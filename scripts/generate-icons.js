import sharp from 'sharp'

const createIcon = (size) => {
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 30, g: 41, b: 59, alpha: 1 },
    },
  })
    .png()
    .toFile(`public/icons/icon-${size}x${size}.png`)
}

Promise.all([createIcon(192), createIcon(512)])
  .then(() => {
    console.log('Icons created successfully')
  })
  .catch((err) => {
    console.error('Failed to create icons:', err)
  })
