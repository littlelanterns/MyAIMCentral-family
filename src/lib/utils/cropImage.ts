/**
 * Canvas-based image cropping utility.
 * Crops an image to the specified pixel region and returns a JPEG blob.
 */
export async function getCroppedImage(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
): Promise<Blob> {
  const image = new Image()
  image.src = imageSrc
  image.crossOrigin = 'anonymous'

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('Failed to load image'))
  })

  const canvas = document.createElement('canvas')
  const size = Math.min(pixelCrop.width, pixelCrop.height)
  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context unavailable')

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    size,
    size,
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
