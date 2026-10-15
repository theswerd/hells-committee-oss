import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import sharp from 'sharp'
import { createCharacter } from './src/sprites.mjs'
import { renderDrivenSprite } from './src/driver.mjs'

// The authored John, Maya, and Brad drawings supply matching idle and shocked
// poses. Each case keeps one identity and palette across both reactions.
const sinners = [
  { id: 'felix', name: 'Felix', archetype: 'john', skin: '#edb38b', hairColor: '#241d27', clothingColor: '#a4c764', build: 'slim', idleReaction: 'talking' },
  { id: 'rita', name: 'Rita', archetype: 'maya', skin: '#d49368', hairColor: '#594133', clothingColor: '#ce6c9e', build: 'regular', idleReaction: 'angry', flip: true },
  { id: 'kieran', name: 'Kieran', archetype: 'john', skin: '#96593e', hairColor: '#23202a', clothingColor: '#e4ba4b', build: 'wide', idleReaction: 'celebrate' },
  { id: 'simone', name: 'Simone', archetype: 'maya', skin: '#734630', hairColor: '#a66344', clothingColor: '#55a9c8', build: 'slim', idleReaction: 'talking', flip: true },
  { id: 'omar', name: 'Omar', archetype: 'brad', skin: '#b9774e', hairColor: '#282331', clothingColor: '#c59655', build: 'regular', idleReaction: 'embarrassed' },
  { id: 'chloe', name: 'Chloe', archetype: 'maya', skin: '#f9d4b5', hairColor: '#e5b557', clothingColor: '#ac86d9', build: 'slim', idleReaction: 'talking' },
  { id: 'hugo', name: 'Hugo', archetype: 'brad', skin: '#edb38b', hairColor: '#563529', clothingColor: '#7792d9', build: 'wide', idleReaction: 'angry', flip: true },
  { id: 'bianca', name: 'Bianca', archetype: 'maya', skin: '#d49368', hairColor: '#38263c', clothingColor: '#ef8d5d', build: 'regular', idleReaction: 'celebrate' },
  { id: 'priya', name: 'Priya', archetype: 'maya', skin: '#b9774e', hairColor: '#201c30', clothingColor: '#8ab991', build: 'regular', idleReaction: 'idle', flip: true },
  { id: 'marco', name: 'Marco', archetype: 'john', skin: '#533527', hairColor: '#171620', clothingColor: '#d2738a', build: 'wide', idleReaction: 'embarrassed' },
  { id: 'sloane', name: 'Sloane', archetype: 'maya', skin: '#edb38b', hairColor: '#714e3b', clothingColor: '#797ec0', build: 'slim', idleReaction: 'talking', flip: true },
  { id: 'nina', name: 'Nina', archetype: 'maya', skin: '#d49368', hairColor: '#5b3528', clothingColor: '#c2a056', build: 'wide', idleReaction: 'talking' },
  { id: 'calvin', name: 'Calvin', archetype: 'brad', skin: '#f9d4b5', hairColor: '#a6a0b2', clothingColor: '#a96d76', build: 'regular', idleReaction: 'angry' },
  { id: 'wren', name: 'Wren', archetype: 'maya', skin: '#96593e', hairColor: '#303a4a', clothingColor: '#e482a2', build: 'slim', idleReaction: 'talking', flip: true },
  { id: 'luca', name: 'Luca', archetype: 'john', skin: '#b9774e', hairColor: '#4c2c20', clothingColor: '#e57959', build: 'wide', idleReaction: 'celebrate' },
  { id: 'greta', name: 'Greta', archetype: 'maya', skin: '#edb38b', hairColor: '#a6a0b2', clothingColor: '#8176bc', build: 'regular', idleReaction: 'idle', flip: true },
  { id: 'malik', name: 'Malik', archetype: 'john', skin: '#734630', hairColor: '#241b29', clothingColor: '#64b4aa', build: 'slim', idleReaction: 'celebrate' },
  { id: 'june', name: 'June', archetype: 'maya', skin: '#f9d4b5', hairColor: '#a6a0b2', clothingColor: '#d888a5', build: 'regular', idleReaction: 'embarrassed' },
  { id: 'eddie', name: 'Eddie', archetype: 'brad', skin: '#edb38b', hairColor: '#513c34', clothingColor: '#88adca', build: 'slim', idleReaction: 'talking', flip: true },
  { id: 'vera', name: 'Vera', archetype: 'maya', skin: '#96593e', hairColor: '#341e1f', clothingColor: '#cb9e60', build: 'wide', idleReaction: 'angry' },
  { id: 'arlo', name: 'Arlo', archetype: 'john', skin: '#d49368', hairColor: '#563529', clothingColor: '#756aca', build: 'regular', idleReaction: 'embarrassed', flip: true },
]

const output = resolve(fileURLToPath(new URL('../public/art/', import.meta.url)))
await mkdir(output, { recursive: true })
for (const definition of sinners) {
  const { idleReaction, flip = false, ...identity } = definition
  const character = createCharacter({ kind: 'human', seed: `case-${definition.id}`, ...identity })
  for (const pose of ['idle', 'shocked']) {
    const svg = renderDrivenSprite(character, { reaction: pose === 'idle' ? idleReaction : 'shocked', time: 0.2, flip })
    const image = await sharp(Buffer.from(svg)).webp({ quality: 92, effort: 6 }).toBuffer()
    await writeFile(resolve(output, `${definition.id}-${pose}.webp`), image)
  }
}
console.log(`Generated ${sinners.length} sinners and ${sinners.length * 2} matching poses.`)
