/**
 * family-auth-admin Edge Function (Family-Auth-Two-Door, Phase 3)
 *
 * Manages the shadow auth accounts behind the two-door umbrella model:
 *   - {family_id}@family.myaimcentral.app — the Family identity session
 *     (hub-resting family devices; Founder Decision 12)
 *   - {member_id}@pin.myaimcentral.app — member PIN sessions
 *     (fixes the long-standing FamilyMembers PIN-set TODO)
 *
 * Actions (POST { action, ... }):
 *
 *   set_family_password  (mom JWT required)
 *     { action, password }
 *     Canonical set/change path: validates strength, writes the bcrypt hash
 *     (admin_set_family_password RPC), creates/rotates the family shadow
 *     account, signs out ALL existing family-device sessions (the kill
 *     switch), and ensures the hidden role='family' member row.
 *
 *   family_door_sync  (no JWT — gated by knowing the actual family password)
 *     { action, login_name, password }
 *     Self-healing bootstrap: re-verifies the password server-side via
 *     verify_family_login (lockout applies), then creates/updates the family
 *     shadow account so the device can sign in. Called by the client only
 *     when direct sign-in fails (first login after this feature ships, or
 *     after an out-of-band hash change). Existing families need no manual
 *     backfill because of this action.
 *
 *   ensure_pin_shadow_account  (mom JWT required)
 *     { action, member_id, pin }
 *     Creates/updates {member_id}@pin.myaimcentral.app with the PIN as
 *     password and links family_members.user_id. Used by the PIN-set flow
 *     and the backfill of members whose PIN verifies but can't create a
 *     session.
 *
 *   set_member_picture  (mom JWT required)
 *     { action, member_id, asset_id }
 *     Picture password (Founder Decision 13 — SINGLE picture, never a
 *     sequence): stores the kid's secret picture server-side, switches
 *     auth_method to visual_password, and syncs the member's shadow account
 *     to a server-derived secret (the picture is never the password).
 *
 *   get_picture_grid  (no JWT — reachable only behind the family door)
 *     { action, member_id }
 *     Returns the login grid: the kid's picture + 8 decoys. The decoy SET is
 *     FIXED per member (deterministic from member_id) so grids can't be
 *     intersected across reloads to reveal the constant picture. The correct
 *     answer is never marked.
 *
 *   picture_login  (no JWT — verified server-side with lockout)
 *     { action, member_id, asset_id }
 *     Verifies the tapped picture via verify_member_picture_password
 *     (5-try/15-min lockout), then signs the member's shadow account in with
 *     the server-derived secret and returns session tokens for
 *     supabase.auth.setSession(). The secret never leaves the server
 *     unexercised — only resulting tokens do.
 *
 * Deployed with --no-verify-jwt (publishable keys are not JWTs — Silent
 * Tooling Failure Pattern #7). Authorization happens in code: mom actions
 * verify the JWT via authenticateRequest; family_door_sync requires the
 * correct family password (verified server-side with lockout).
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors, jsonHeaders } from '../_shared/cors.ts'
import { authenticateRequest } from '../_shared/auth.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function familyEmail(familyId: string): string {
  return `${familyId}@family.myaimcentral.app`
}

function pinEmail(memberId: string): string {
  return `${memberId}@pin.myaimcentral.app`
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders })
}

/**
 * Server-derived shadow-account password for picture-password members.
 * HMAC-SHA256 keyed by the service role key — deterministic, never stored,
 * never sent to a client. The kid's picture choice is verified separately;
 * this secret only exists so the shadow account has a strong password that
 * is NOT the (low-entropy, grid-exposed) picture id.
 */
async function deriveMemberSecret(memberId: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(SERVICE_ROLE_KEY),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`member-picture-secret:${memberId}`))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Deterministic PRNG from a string seed (FNV-1a → mulberry32). */
function seededRandom(seed: string): () => number {
  let h = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  let a = h >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function passwordIsStrong(pwd: string): boolean {
  return typeof pwd === 'string' && pwd.length >= 8 && /[a-zA-Z]/.test(pwd) && /[0-9]/.test(pwd)
}

/** Find an auth user by exact email. Pages through the admin list API. */
async function findAuthUserByEmail(email: string): Promise<{ id: string } | null> {
  // listUsers has no email filter in supabase-js v2; page until found.
  // Shadow-account volume is small (one per family / one per PIN member).
  let page = 1
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw new Error(`listUsers failed: ${error.message}`)
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (hit) return { id: hit.id }
    if (data.users.length < 200) return null
    page += 1
  }
}

/** Create the auth user if missing, else update its password. Returns user id. */
async function upsertShadowAccount(
  email: string,
  password: string,
  opts: { rotateIfExists: boolean },
): Promise<{ userId: string; rotated: boolean }> {
  const existing = await findAuthUserByEmail(email)

  if (existing) {
    if (opts.rotateIfExists) {
      const { error } = await admin.auth.admin.updateUserById(existing.id, { password })
      if (error) throw new Error(`password update failed: ${error.message}`)
      return { userId: existing.id, rotated: true }
    }
    return { userId: existing.id, rotated: false }
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error || !data.user) throw new Error(`createUser failed: ${error?.message}`)
  return { userId: data.user.id, rotated: false }
}

/** Ensure the hidden role='family' member row exists and is linked. */
async function ensureFamilyIdentityRow(familyId: string, userId: string): Promise<void> {
  const { error } = await admin.rpc('ensure_family_member_identity', {
    p_family_id: familyId,
    p_user_id: userId,
  })
  if (error) throw new Error(`ensure_family_member_identity failed: ${error.message}`)
}

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const action = body.action as string

  try {
    // ------------------------------------------------------------------
    // set_family_password — mom JWT; hash + shadow rotation + kill switch
    // ------------------------------------------------------------------
    if (action === 'set_family_password') {
      const auth = await authenticateRequest(req)
      if (auth instanceof Response) return auth

      const password = body.password as string
      if (!passwordIsStrong(password)) {
        return json({ success: false, reason: 'weak_password' })
      }

      // Caller must be the primary parent of their family
      const { data: family, error: famError } = await admin
        .from('families')
        .select('id')
        .eq('primary_parent_id', auth.user.id)
        .limit(1)
        .maybeSingle()
      if (famError) throw new Error(famError.message)
      if (!family) return json({ success: false, reason: 'not_authorized' }, 403)

      // 1. Write the bcrypt hash (resets lockout)
      const { data: hashResult, error: hashError } = await admin.rpc('admin_set_family_password', {
        p_family_id: family.id,
        p_password: password,
      })
      if (hashError) throw new Error(hashError.message)
      if (!hashResult?.success) return json(hashResult)

      // 2. Create or rotate the family shadow account
      const { userId, rotated } = await upsertShadowAccount(familyEmail(family.id), password, {
        rotateIfExists: true,
      })

      // 3. Kill switch: changing the family password boots every resting
      //    family-device session (refresh tokens revoked globally)
      if (rotated) {
        const { error: soError } = await admin.auth.admin.signOut(userId, 'global')
        if (soError) console.warn('global signOut failed (non-fatal):', soError.message)
      }

      // 4. Hidden Family identity row
      await ensureFamilyIdentityRow(family.id, userId)

      return json({ success: true })
    }

    // ------------------------------------------------------------------
    // family_door_sync — no JWT; gated by the real family password
    // ------------------------------------------------------------------
    if (action === 'family_door_sync') {
      const loginName = body.login_name as string
      const password = body.password as string
      if (!loginName || !password) {
        return json({ error: 'login_name and password are required' }, 400)
      }

      // Server-side re-verification — lockout and no-enumeration semantics
      // come from the RPC itself
      const { data: verify, error: verifyError } = await admin.rpc('verify_family_login', {
        p_login_name: loginName,
        p_password: password,
      })
      if (verifyError) throw new Error(verifyError.message)
      if (!verify?.success) {
        // Pass through the generic result (invalid/locked) unchanged
        return json(verify ?? { success: false, reason: 'invalid' })
      }

      const familyId = verify.family_id as string

      // Sync the shadow account to the (verified-correct) password.
      // rotateIfExists keeps the account aligned when the hash was changed
      // through a path that didn't rotate (e.g. transitional RPC callers).
      const { userId } = await upsertShadowAccount(familyEmail(familyId), password, {
        rotateIfExists: true,
      })
      await ensureFamilyIdentityRow(familyId, userId)

      return json({ success: true, family_email: familyEmail(familyId) })
    }

    // ------------------------------------------------------------------
    // ensure_pin_shadow_account — mom JWT; PIN session repair/creation
    // ------------------------------------------------------------------
    if (action === 'ensure_pin_shadow_account') {
      const auth = await authenticateRequest(req)
      if (auth instanceof Response) return auth

      const memberId = body.member_id as string
      const pin = body.pin as string
      if (!memberId || !pin || !/^\d{4,8}$/.test(pin)) {
        return json({ error: 'member_id and a 4-8 digit pin are required' }, 400)
      }

      // Caller must be the primary parent of the member's family
      const { data: member, error: memberError } = await admin
        .from('family_members')
        .select('id, family_id, user_id')
        .eq('id', memberId)
        .maybeSingle()
      if (memberError) throw new Error(memberError.message)
      if (!member) return json({ error: 'member not found' }, 404)

      const { data: family, error: famError } = await admin
        .from('families')
        .select('id')
        .eq('id', member.family_id)
        .eq('primary_parent_id', auth.user.id)
        .maybeSingle()
      if (famError) throw new Error(famError.message)
      if (!family) return json({ success: false, reason: 'not_authorized' }, 403)

      const { userId } = await upsertShadowAccount(pinEmail(memberId), pin, {
        rotateIfExists: true,
      })

      // Link the member row to the shadow account if not already linked.
      // Never overwrite a real (email-invited) user_id with a PIN shadow id.
      if (!member.user_id) {
        const { error: linkError } = await admin
          .from('family_members')
          .update({ user_id: userId })
          .eq('id', memberId)
        if (linkError) throw new Error(`user_id link failed: ${linkError.message}`)
      } else if (member.user_id !== userId) {
        // Member already linked to a different auth user (real email account
        // or pre-existing shadow) — report, don't clobber
        return json({
          success: true,
          warning: 'member already linked to a different auth account; PIN account updated but not linked',
        })
      }

      return json({ success: true })
    }

    // ------------------------------------------------------------------
    // set_member_picture — mom JWT; single-picture password (Decision 13)
    // ------------------------------------------------------------------
    if (action === 'set_member_picture') {
      const auth = await authenticateRequest(req)
      if (auth instanceof Response) return auth

      const memberId = body.member_id as string
      const assetId = body.asset_id as string
      if (!memberId || !assetId) {
        return json({ error: 'member_id and asset_id are required' }, 400)
      }

      // Caller must be the primary parent of the member's family
      const { data: member, error: memberError } = await admin
        .from('family_members')
        .select('id, family_id, user_id')
        .eq('id', memberId)
        .maybeSingle()
      if (memberError) throw new Error(memberError.message)
      if (!member) return json({ error: 'member not found' }, 404)

      const { data: family, error: famError } = await admin
        .from('families')
        .select('id')
        .eq('id', member.family_id)
        .eq('primary_parent_id', auth.user.id)
        .maybeSingle()
      if (famError) throw new Error(famError.message)
      if (!family) return json({ success: false, reason: 'not_authorized' }, 403)

      // The picture must be a real, active login asset
      const { data: asset, error: assetError } = await admin
        .from('platform_assets')
        .select('id')
        .eq('id', assetId)
        .eq('category', 'login_avatar')
        .eq('status', 'active')
        .maybeSingle()
      if (assetError) throw new Error(assetError.message)
      if (!asset) return json({ error: 'asset not found' }, 404)

      // Store config server-side + switch auth method + reset lockout
      const { error: updateError } = await admin
        .from('family_members')
        .update({
          visual_password_config: { asset_id: assetId },
          auth_method: 'visual_password',
          pin_failed_attempts: 0,
          pin_locked_until: null,
        })
        .eq('id', memberId)
      if (updateError) throw new Error(updateError.message)

      // Shadow account password = server-derived secret (never the picture)
      const secret = await deriveMemberSecret(memberId)
      const { userId } = await upsertShadowAccount(pinEmail(memberId), secret, {
        rotateIfExists: true,
      })
      if (!member.user_id) {
        const { error: linkError } = await admin
          .from('family_members')
          .update({ user_id: userId })
          .eq('id', memberId)
        if (linkError) throw new Error(`user_id link failed: ${linkError.message}`)
      }

      return json({ success: true })
    }

    // ------------------------------------------------------------------
    // get_picture_grid — the kid's picture + 8 FIXED decoys, never marked
    // ------------------------------------------------------------------
    if (action === 'get_picture_grid') {
      const memberId = body.member_id as string
      if (!memberId) return json({ error: 'member_id is required' }, 400)

      const { data: member, error: memberError } = await admin
        .from('family_members')
        .select('id, visual_password_config')
        .eq('id', memberId)
        .eq('is_active', true)
        .maybeSingle()
      if (memberError) throw new Error(memberError.message)
      const config = member?.visual_password_config as { asset_id?: string } | null
      if (!member || !config?.asset_id) {
        return json({ error: 'picture password not set up' }, 404)
      }

      const { data: assets, error: assetsError } = await admin
        .from('platform_assets')
        .select('id, display_name, size_128_url')
        .eq('category', 'login_avatar')
        .eq('status', 'active')
        .order('id')
      if (assetsError) throw new Error(assetsError.message)
      if (!assets || assets.length === 0) return json({ error: 'no login assets' }, 500)

      const correct = assets.find((a) => a.id === config.asset_id)
      if (!correct) return json({ error: 'picture password not set up' }, 404)

      // FIXED decoy set per member: deterministic seed = member id + their
      // asset id. A changing decoy set could be intersected across reloads
      // to reveal the constant (correct) picture.
      const pool = assets.filter((a) => a.id !== config.asset_id)
      const rand = seededRandom(`${memberId}:${config.asset_id}`)
      const decoys: typeof pool = []
      const poolCopy = [...pool]
      while (decoys.length < Math.min(8, poolCopy.length)) {
        const idx = Math.floor(rand() * poolCopy.length)
        decoys.push(poolCopy.splice(idx, 1)[0])
      }

      // Stable order (sorted by id) — the client shuffles display order
      const grid = [correct, ...decoys].sort((a, b) => a.id.localeCompare(b.id))
      return json({
        success: true,
        images: grid.map((a) => ({
          id: a.id,
          display_name: a.display_name,
          url: a.size_128_url,
        })),
      })
    }

    // ------------------------------------------------------------------
    // picture_login — verify tap server-side (lockout), mint a session
    // ------------------------------------------------------------------
    if (action === 'picture_login') {
      const memberId = body.member_id as string
      const assetId = body.asset_id as string
      if (!memberId || !assetId) {
        return json({ error: 'member_id and asset_id are required' }, 400)
      }

      const { data: verify, error: verifyError } = await admin.rpc(
        'verify_member_picture_password',
        { p_member_id: memberId, p_asset_id: assetId },
      )
      if (verifyError) throw new Error(verifyError.message)
      if (!verify?.success) {
        // Pass through invalid/locked/not_found unchanged
        return json(verify ?? { success: false, reason: 'invalid' })
      }

      // Members linked to a REAL email account (not a shadow) sign in with
      // their email — a shadow session would never resolve to their member
      // row under RLS. Their picture remains valid for hub dip-ins
      // (verify-only); personal devices route to email sign-in.
      const { data: member } = await admin
        .from('family_members')
        .select('user_id')
        .eq('id', memberId)
        .maybeSingle()
      if (member?.user_id) {
        const { data: linked } = await admin.auth.admin.getUserById(member.user_id)
        const linkedEmail = linked?.user?.email ?? ''
        if (linkedEmail && !linkedEmail.endsWith('@pin.myaimcentral.app')) {
          return json({ success: true, requires_email_login: true })
        }
      }

      // Self-healing: make sure the shadow account exists with the derived
      // secret, then sign in and hand the tokens to the device.
      const secret = await deriveMemberSecret(memberId)
      const { userId } = await upsertShadowAccount(pinEmail(memberId), secret, {
        rotateIfExists: false,
      })

      if (member && !member.user_id) {
        await admin.from('family_members').update({ user_id: userId }).eq('id', memberId)
      }

      const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
      const signInClient = createClient(SUPABASE_URL, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
      let signIn = await signInClient.auth.signInWithPassword({
        email: pinEmail(memberId),
        password: secret,
      })
      if (signIn.error) {
        // Account predates the picture switch (password is an old PIN) —
        // rotate to the derived secret and retry once
        await upsertShadowAccount(pinEmail(memberId), secret, { rotateIfExists: true })
        signIn = await signInClient.auth.signInWithPassword({
          email: pinEmail(memberId),
          password: secret,
        })
      }
      if (signIn.error || !signIn.data.session) {
        throw new Error(`picture session sign-in failed: ${signIn.error?.message}`)
      }

      return json({
        success: true,
        access_token: signIn.data.session.access_token,
        refresh_token: signIn.data.session.refresh_token,
      })
    }

    return json({ error: `Unknown action: ${action}` }, 400)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('family-auth-admin error:', msg)
    return json({ error: `Server error: ${msg}` }, 500)
  }
})
