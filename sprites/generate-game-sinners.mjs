import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import sharp from 'sharp'

// Each source sheet contains two independently drawn poses of one character:
// idle on the left, shocked on the right. Keep the same person in both halves.
const sinners = [
  'felix', 'rita', 'kieran', 'simone', 'omar', 'chloe', 'hugo',
  'bianca', 'priya', 'marco', 'sloane', 'nina', 'calvin', 'wren',
  'luca', 'greta', 'malik', 'june', 'eddie', 'vera', 'arlo',
]

const sources = resolve(fileURLToPath(new URL('./art-sources/new-sinners/', import.meta.url)))
const output = resolve(fileURLToPath(new URL('../public/art/', import.meta.url)))
await mkdir(output, { recursive: true })

for (const id of sinners) {
  const sheet = resolve(sources, `${id}.webp`)
  const { width, height, hasAlpha } = await sharp(sheet).metadata()
  if (!width || !height || width % 2 !== 0 || !hasAlpha) {
    throw new Error(`${id}: expected an even-width transparent two-pose sheet`)
  }

  for (const [index, pose] of ['idle', 'shocked'].entries()) {
    // Rita's idle suitcase reaches slightly across the sheet midpoint.
    const leftInset = id === 'rita' && pose === 'shocked' ? 80 : 0
    const half = await sharp(sheet)
      .extract({ left: index * width / 2 + leftInset, top: 0, width: width / 2 - leftInset, height })
      .toBuffer()
    const image = await sharp(half)
      .trim({ threshold: 5 })
      .resize(480, 480, { fit: 'contain', background: '#00000000' })
      .extend({ top: 16, bottom: 16, left: 16, right: 16, background: '#00000000' })
      .webp({ quality: 92, effort: 4 })
      .toFile(resolve(output, `${id}-${pose}.webp`))
    if (image.width !== 512 || image.height !== 512) {
      throw new Error(`${id}-${pose}: expected a 512px sprite`)
    }
  }
}

console.log(`Built ${sinners.length} original sinners and ${sinners.length * 2} poses.`)
