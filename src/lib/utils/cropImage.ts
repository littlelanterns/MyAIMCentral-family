/**
 * Canvas-based image cropping utility.
 * Crops an image to the specified pixel region and returns a JPEG blob.
 *
 * pixelCrop coordinates come from react-image-crop's PixelCrop, which are
 * relative to the RENDERED image size in the DOM. We must scale them to
 * the image's natural dimensions before cropping.
 *
 * renderedWidth/renderedHeight are the dimensions of the <img> element
 * in the crop modal. If omitted, the crop coordinates are assumed to be
 * in natural image space (backward compatible).
 */
export async function getCroppedImage(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  renderedWidth?: number,
  renderedHeight?: number,
): Promise<Blob> {
  const image = new Image()
  image.src = imageSrc
  image.crossOrigin = 'anonymous'

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('Failed to load image'))
  })

  // Scale crop coordinates from rendered space to natural space
  const scaleX = renderedWidth ? image.naturalWidth / renderedWidth : 1
  const scaleY = renderedHeight ? image.naturalHeight / renderedHeight : 1

  const sourceX = pixelCrop.x * scaleX
  const sourceY = pixelCrop.y * scaleY
  const sourceW = pixelCrop.width * scaleX
  const sourceH = pixelCrop.height * scaleY

  // Output square at reasonable resolution (max 800px for profile photos)
  const outputSize = Math.min(Math.round(Math.min(sourceW, sourceH)), 800)

  const canvas = document.createElement('canvas')
  canvas.width = outputSize
  canvas.height = outputSize

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context unavailable')

  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    sourceW,
    sourceH,
    0,
    0,
    outputSize,
    outputSize,
  )

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Canvas toBlob failed'))
      },
      'image/jpeg',
      0.92,
    )
  })
}
