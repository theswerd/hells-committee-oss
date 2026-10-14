import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createCharacter } from '../sprites/src/sprites.mjs'
import { renderDrivenSprite } from '../sprites/src/driver.mjs'

const artDir = fileURLToPath(new URL('../public/art/', import.meta.url))
const sinners = [
  { id: 'tessa', name: 'Tessa', archetype: 'maya', skin: '#d49368', hairColor: '#a6a0b2', clothingColor: '#9de1b5', pantsColor: '#557d72' },
  { id: 'derek', name: 'Derek', archetype: 'brad', skin: '#d49368', hairColor: '#2e2330', clothingColor: '#9de1b5', pantsColor: '#434052' },
  { id: 'pam', name: 'Pam', archetype: 'maya', skin: '#f9d4b5', hairColor: '#9b5635', clothingColor: '#fa8062', pantsColor: '#645278', flip: true },
  { id: 'olivia', name: 'Olivia', archetype: 'maya', skin: '#96593e', hairColor: '#2e2330', clothingColor: '#74b7f0', pantsColor: '#434052' },
  { id: 'elliot', name: 'Elliot', archetype: 'john', skin: '#734630', hairColor: '#a6a0b2', clothingColor: '#fa8062', pantsColor: '#645278', flip: true },
]

for (const { flip = false, ...features } of sinners) {
  const character = createCharacter({ kind: 'human', seed: features.id, expression: 'smug', ...features })
  for (const reaction of ['idle', 'shocked']) {
    await writeFile(`${artDir}${character.id}-${reaction}.svg`, renderDrivenSprite(character, { reaction, time: 0.2, flip }))
  }
}
