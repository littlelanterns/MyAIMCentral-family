import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../public');
const source = path.resolve(publicDir, 'flavicon512.png');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generate() {
  for (const size of sizes) {
    await sharp(source)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.resolve(publicDir, `pwa-icon-${size}.png`));
    console.log(`Generated pwa-icon-${size}.png`);
  }

  // Maskable icon — needs safe zone padding with matching background
  const meta = await sharp(source).metadata();
  // Sample the corner pixel for background color
  const { data } = await sharp(source).resize(1, 1).raw().toBuffer({ resolveWithObject: true });
  const bg = { r: data[0], g: data[1], b: data[2], alpha: 255 };

  await sharp(source)
    .resize(410, 410, { fit: 'contain', background: bg })
    .extend({
      top: 51, bottom: 51, left: 51, right: 51,
      background: bg,
    })
    .resize(512, 512)
    .png()
    .toFile(path.resolve(publicDir, 'pwa-icon-maskable-512.png'));
  console.log('Generated pwa-icon-maskable-512.png');

  // Apple touch icon (180x180 with solid bg)
  await sharp(source)
    .resize(180, 180, { fit: 'contain', background: bg })
    .flatten({ background: bg })
    .png()
    .toFile(path.resolve(publicDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');
}

generate().catch(console.error);
