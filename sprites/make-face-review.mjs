import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {PRESETS,createCharacter} from './src/sprites.mjs';
import {ART_LIBRARY} from './src/compiled-art.mjs';
import {renderDrivenSprite} from './src/driver.mjs';
import {renderSheet} from './src/sheets.mjs';

const reactions=['idle','talking','angry','embarrassed','celebrate','shocked'];
const boxes=[[85,35,145,120],[80,35,145,125],[113,48,150,125],[53,32,140,130],[103,23,145,130],[87,23,145,125]];
const palettes=[
  ['#f9d4b5','#e5b557'],['#734630','#563529'],['#edb38b','#663baa'],
  ['#533527','#cde663'],['#d49368','#ff97b9'],['#96593e','#2e2330'],
];

function renderFace(character,options) {
  const frame=ART_LIBRARY.maya.frames.find(f=>f.name===options.reaction);
  const [x,y,w,h]=boxes[reactions.indexOf(frame.name)];
  const [ox,oy,scale]=frame.transform.match(/[-\d.]+/g).map(Number);
  return renderDrivenSprite(character,options).replace('viewBox="0 0 512 512"',`viewBox="${ox+x*scale} ${oy+y*scale} ${w*scale} ${h*scale}"`);
}

export async function writeFaceReviews() {
  for(const variant of [false,true]) {
    const entries=reactions.map((reaction,i)=>({
      character:variant?createCharacter({...PRESETS.maya,skin:palettes[i][0],hairColor:palettes[i][1]}):PRESETS.maya,
      state:{reaction,time:0},caption:reaction[0].toUpperCase()+reaction.slice(1),
      detail:variant?'SKIN + HAIR VARIANT':'MAYA / EYE & EAR DETAILS',
    }));
    const svg=renderSheet(entries,{
      title:variant?'Maya / curls & color.':'Maya / faces & curls.',
      subtitle:variant?'Hair color stays in the hair layer. Face and neck colors stay independent.':'Six authored reactions · continuous curls and corrected facial contours',
      renderer:renderFace,columns:3,cellSize:300,
    });
    await writeFile(new URL(`./review/maya-${variant?'palette-details':'detail-pass'}.svg`,import.meta.url),svg);
  }
  const repaired=['angry','celebrate'].map(reaction=>({character:PRESETS.maya,state:{reaction,time:0},caption:reaction==='angry'?'Angry':'Celebrating',detail:'MAYA / CORRECTED FACE LAYER'}));
  await writeFile(new URL('./review/maya-repaired-reactions.svg',import.meta.url),renderSheet(repaired,{
    title:'Maya / repaired reactions.',subtitle:'Clean angry contours · celebrating eyes aligned to the original art',
    renderer:renderFace,columns:2,cellSize:360,
  }));
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1])await writeFaceReviews();
