import { writeFile } from 'node:fs/promises';
import { PRESETS } from './src/sprites.mjs';
import { renderDrivenSprite } from './src/driver.mjs';
import { renderSheet } from './src/sheets.mjs';

const cast=Object.values(PRESETS).filter(c=>c.kind==='demon');
await writeFile(new URL('./review/eight-demons.svg',import.meta.url),renderSheet(cast,{title:'The committee just got worse.',subtitle:'8 distinct demons · 6 code-driven acting states each',renderer:renderDrivenSprite,columns:4,cellSize:330}));
const names=['velvet','bonejamin','cerberus','dolly'];
const states=['idle','writing','stamping','voting','celebrate','shocked'];
const poses=names.flatMap(key=>states.map(reaction=>({character:PRESETS[key],state:{reaction,time:0},caption:reaction[0].toUpperCase()+reaction.slice(1),detail:PRESETS[key].name})));
await writeFile(new URL('./review/new-demons-reactions.svg',import.meta.url),renderSheet(poses,{title:'Four new faces. Twenty-four terrible ideas.',subtitle:'New authored demon poses · all drawn from editable vector code',renderer:renderDrivenSprite,columns:6,cellSize:260}));
console.log('Eight-demon roster and 24 new reaction views written.');
