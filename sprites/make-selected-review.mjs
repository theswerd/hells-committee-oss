import { writeFile } from 'node:fs/promises'
import { PRESETS } from './src/sprites.mjs'
import { renderDrivenSprite } from './src/driver.mjs'
import { renderSheet } from './src/sheets.mjs'

const ids=['gus','norm','dot']
const states=['idle','writing','stamping','voting','celebrate','shocked']
const poses=ids.flatMap(id=>states.map(reaction=>({character:PRESETS[id],state:{reaction,time:0},caption:reaction.toUpperCase(),detail:PRESETS[id].name})))
await writeFile(new URL('./review/selected-demons-reactions.svg',import.meta.url),renderSheet(poses,{title:'Your new committee members.',subtitle:'Gus Grumble · Norm Goyle · Dot / six authored acting states each',renderer:renderDrivenSprite,columns:6,cellSize:260}))
