import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {PRESETS} from './src/sprites.mjs';
import {renderScene} from './src/driver.mjs';
const dir='review/animation-frames';await mkdir(dir,{recursive:true});
const demonActions=['idle','writing','stamping','voting','celebrate','shocked'];
const humanActions=['idle','talking','angry','embarrassed','celebrate','shocked'];
for(let action=0;action<6;action++)for(let frame=0;frame<4;frame++){
  const scene=renderScene([PRESETS.mothmanager,PRESETS.john],{scene:'verdict',width:960,height:540,time:frame*.2,slots:[{x:135,y:135,size:470,state:{reaction:demonActions[action]}},{x:690,y:135,size:470,state:{reaction:humanActions[action]}}]});
  const label=`${demonActions[action].toUpperCase()} / ${humanActions[action].toUpperCase()}`;
  const svg=scene.replace('</svg>',`<rect x="412" y="639" width="456" height="45" rx="18" fill="#271334"/><text x="640" y="668" text-anchor="middle" font-family="Arial,sans-serif" font-size="19" font-weight="800" fill="#fff6df">${label}</text></svg>`);
  await writeFile(join(dir,`${String(action*4+frame).padStart(2,'0')}.svg`),svg);
}
console.log('Created 24 code-rendered scene/reaction frames.');
