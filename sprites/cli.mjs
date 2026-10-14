#!/usr/bin/env node
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {createCharacter,generateRoster,renderSprite,PRESETS,OPTIONS,VERSION,CONCEPTS} from './src/sprites.mjs';
import {renderDrivenSprite,renderScene} from './src/driver.mjs';
import {renderSheet} from './src/sheets.mjs';
import {buildStudio} from './build-studio.mjs';
import {writeFaceReviews} from './make-face-review.mjs';

const HELP=`Hell's Committee sprite generator\n\n  node cli.mjs demo\n  node cli.mjs render --preset mothmanager --pose stamping --out moth.svg\n  node cli.mjs render --config character.json --expression shocked --out shocked.svg\n  node cli.mjs batch --kind demon --seed committee --count 100 --out exports/demons\n  node cli.mjs batch --kind human --seed sinners --count 100 --poses idle,celebrate --out exports/humans\n\nFlags: --kind, --seed, --count, --out, --preset, --config, --pose, --poses,\n       --expression, --size, --species, --color, --skin, --hair-style,\n       --hair-color, --clothing-color, --pants-color, --accent, --build,\n       --horns, --wings, --tail, --glasses, --outfit, --facial-hair, --prop, --name\n\nNo dependencies. Every sprite is a transparent SVG; batch writes manifest.json.\n`;
const known=new Set(['kind','archetype','seed','count','out','preset','config','pose','poses','expression','size','species','color','skin','hairStyle','hairColor','clothingColor','pantsColor','accent','build','horns','wings','tail','glasses','outfit','facialHair','prop','name','concept','reaction','time','scene']);
function parse(args) {
  const result={};
  for(let i=0;i<args.length;i++) {
    const arg=args[i];
    if(!arg.startsWith('--')) throw new Error(`Unexpected argument: ${arg}`);
    const key=arg.slice(2).replace(/-([a-z])/g,(_,c)=>c.toUpperCase());
    if(!known.has(key)) throw new Error(`Unknown flag: ${arg}`);
    if(!args[i+1]||args[i+1].startsWith('--')) throw new Error(`Missing value for ${arg}`);
    result[key]=args[++i];
  }
  return result;
}
function features(flags) {
  return Object.fromEntries(Object.entries(flags).filter(([k])=>!['count','out','preset','config','pose','poses','size','expression','concept','reaction','time','scene'].includes(k)));
}
async function saveCharacter(c,dir,poses=['idle'],renderOptions={}) {
  const files=[];
  const safeId=c.id.replace(/[^a-z0-9_-]/gi,'-')||'character';
  for(const pose of poses) {
    const file=`${safeId}-${pose}.svg`;
    await writeFile(join(dir,file),(renderOptions.reaction?renderDrivenSprite:renderSprite)(c,{...renderOptions,pose}));
    files.push({file,characterId:c.id,pose,expression:renderOptions.expression??(pose==='celebrate'?'smile':c.expression)});
  }
  return files;
}
async function batch(flags) {
  const count=Number(flags.count??12),dir=resolve(flags.out??'exports/batch');
  const poses=(flags.poses??flags.pose??'idle').split(',');
  if(poses.some(p=>!OPTIONS.pose.includes(p))) throw new Error('Invalid pose in --poses.');
  const renderOptions={size:Number(flags.size??512),concept:flags.concept??'sticker',...(flags.expression?{expression:flags.expression}:{}),...(flags.reaction?{reaction:flags.reaction,time:Number(flags.time??0)}:{})};
  const roster=generateRoster({...features(flags),count});
  // Validate all render options before creating or writing output.
  (renderOptions.reaction?renderDrivenSprite:renderSprite)(roster[0],{...renderOptions,pose:poses[0]});
  await mkdir(dir,{recursive:true});
  const sprites=[];
  for(const c of roster) sprites.push(...await saveCharacter(c,dir,poses,renderOptions));
  await writeFile(join(dir,'manifest.json'),JSON.stringify({version:VERSION,characters:roster,sprites},null,2)+'\n');
  await writeFile(join(dir,'sheet.svg'),renderSheet(roster,{title:`${roster[0].kind==='demon'?'Committee':'Sinner'} variants`,subtitle:`Seed: ${flags.seed??'committee'} · deterministic SVG output`}));
  console.log(`${roster.length} characters, ${sprites.length} sprites → ${dir}`);
}
async function render(flags) {
  let base={};
  if(flags.preset) {
    if(!PRESETS[flags.preset]) throw new Error(`Unknown preset: ${flags.preset}`);
    base=PRESETS[flags.preset];
  }
  if(flags.config) base={...base,...JSON.parse(await readFile(resolve(flags.config),'utf8'))};
  const c=createCharacter({...base,...features(flags)});
  const svg=renderDrivenSprite(c,{pose:flags.pose,expression:flags.expression,size:Number(flags.size??512),concept:flags.concept??'sticker',reaction:flags.reaction??flags.pose??'idle',time:Number(flags.time??0)});
  const out=resolve(flags.out??`${c.id}.svg`);
  await mkdir(dirname(out),{recursive:true});
  await writeFile(out,svg);
  await writeFile(out.replace(/\.svg$/i,'')+'.json',JSON.stringify(c,null,2)+'\n');
  console.log(out);
}
async function demo() {
  const dir=resolve('exports'),review=resolve('review');
  await mkdir(dir,{recursive:true}); await mkdir(review,{recursive:true});
  const cast=Object.values(PRESETS),sprites=[];
  const illustratedDir=join(dir,'illustrated');await mkdir(illustratedDir,{recursive:true});
  const authored=[];
  for(const c of cast) {
    const reactions=c.kind==='human'?['idle','talking','angry','embarrassed','celebrate','shocked']:['idle','writing','stamping','voting','celebrate','shocked'];
    for(const reaction of reactions) {
      const file=`${c.id}-${reaction}.svg`;
      await writeFile(join(illustratedDir,file),renderDrivenSprite(c,{reaction,time:.2}));
      authored.push({file,characterId:c.id,reaction,archetype:c.archetype});
    }
  }
  await writeFile(join(illustratedDir,'manifest.json'),JSON.stringify({version:VERSION,characters:cast,sprites:authored},null,2)+'\n');
  sprites.push(...authored.map(item=>({...item,file:'illustrated/'+item.file})));
  await writeFile(join(dir,'manifest.json'),JSON.stringify({version:VERSION,characters:cast,sprites},null,2)+'\n');
  await writeFile(join(dir,'characters.json'),JSON.stringify(PRESETS,null,2)+'\n');
  await writeFile(join(review,'core-cast.svg'),renderSheet(cast,{title:'The committee & the cases',subtitle:'Actual code output · 11 demons + 3 sinners · transparent SVG source'}));
  const demons=generateRoster({kind:'demon',seed:'infernal-office',count:24});
  const humans=generateRoster({kind:'human',seed:'petty-offenses',count:24});
  for(const [kind,roster] of [['demons',demons],['humans',humans]]) {
    const target=join(dir,kind); await mkdir(target,{recursive:true});
    const generated=[]; for(const c of roster) generated.push(...await saveCharacter(c,target));
    await writeFile(join(target,'manifest.json'),JSON.stringify({version:VERSION,characters:roster,sprites:generated},null,2)+'\n');
    await writeFile(join(review,`${kind}-variants.svg`),renderSheet(roster.slice(0,12).map((c,i)=>({character:c,caption:`${kind==='demons'?'Member':'Case'} ${String(i+1).padStart(2,'0')}`})),{title:kind==='demons'?'More members. Same department.':'A very busy case backlog.',subtitle:`12 of 24 seeded ${kind} · features vary; the drawing rules stay fixed`,cellSize:280}));
  }
  const reactions=[...OPTIONS.pose.map(pose=>({character:PRESETS.mothmanager,pose,caption:pose,detail:'MOTHMANAGER · SAME CHARACTER JSON'})),...['smug','shocked','angry','smile'].map(expression=>({character:PRESETS.john,expression,caption:expression,detail:'JOHN · SAME CHARACTER JSON'}))];
  await writeFile(join(review,'reactions.svg'),renderSheet(reactions,{title:'One identity. Many reactions.',subtitle:'Poses and expressions are separate from character identity'}));
  const acting=[...['idle','writing','stamping','voting','celebrate','shocked'].map(reaction=>({character:PRESETS.mothmanager,state:{reaction,time:.2},caption:titleCase(reaction),detail:'MOTHMANAGER'})),...['idle','talking','angry','embarrassed','celebrate','shocked'].map(reaction=>({character:PRESETS.john,state:{reaction,time:.2},caption:titleCase(reaction),detail:'JOHN'}))];
  await writeFile(join(review,'high-fidelity-reactions.svg'),renderSheet(acting,{title:'Acting, not just expression swaps.',subtitle:'Six authored demon poses + six authored human reactions · all rendered from vector code',renderer:renderDrivenSprite,columns:3,cellSize:340}));
  const humanActing=['john','maya','brad'].flatMap(key=>['idle','talking','angry','embarrassed','celebrate','shocked'].map(reaction=>({character:PRESETS[key],state:{reaction,time:0},caption:titleCase(reaction),detail:PRESETS[key].name})));
  await writeFile(join(review,'human-reactions.svg'),renderSheet(humanActing,{title:'Every sinner has something to say.',subtitle:'All 18 human reactions · preserved facial ink across every palette',renderer:renderDrivenSprite,columns:6,cellSize:260}));
  const studies=[...cast.map(c=>({character:c,caption:c.name,detail:c.kind==='demon'?c.species:'human'})),
    {character:PRESETS.mothmanager,state:{reaction:'writing',time:.3},caption:'Writing',detail:'CODE-DRIVEN REACTION'},
    {character:PRESETS.mothmanager,state:{reaction:'stamping',time:.3125},caption:'Stamping',detail:'CODE-DRIVEN REACTION'},
    {character:PRESETS.litigator,state:{reaction:'voting',time:.4},caption:'Voting',detail:'CODE-DRIVEN REACTION'},
    {character:PRESETS.greg,state:{reaction:'celebrate',time:.2},caption:'Celebrating',detail:'SAME IDENTITY'},
    {character:PRESETS.john,state:{reaction:'shocked',time:.2},caption:'Shocked',detail:'SAME IDENTITY'}];
  for(const [concept,info] of Object.entries(CONCEPTS)) {
    await writeFile(join(review,`concept-${concept}.svg`),renderSheet(studies,{title:info.name,subtitle:info.description+' All characters and reactions drawn from code.',concept,renderer:renderDrivenSprite,cellSize:300}));
  }
  for(const scene of ['committee','profile','verdict']) {
    const people=scene==='profile'?[PRESETS.john]:cast.filter(c=>c.kind==='demon');
    const sceneSvg=renderScene(people,{scene,time:.3125,reaction:scene==='committee'?'writing':scene==='profile'?'shocked':'celebrate',slots:scene==='committee'?people.map((c,i)=>({state:{reaction:['idle','stamping','voting','sleepy'][i]}})):[]});
    await writeFile(join(review,`scene-${scene}.svg`),sceneSvg);
  }
  await buildStudio();
  await writeFaceReviews();
  console.log(`Created ${sprites.length+demons.length+humans.length} SVG sprites, manifests, cast/variant/reaction sheets, three sprite concepts, three scene studies and studio.html.`);
}
function titleCase(value){return value[0].toUpperCase()+value.slice(1);}
try {
  const [command,...args]=process.argv.slice(2);
  if(!command||command==='help'||command==='--help') console.log(HELP);
  else if(command==='demo') {if(args.length) throw new Error('demo takes no arguments.'); await demo();}
  else if(command==='render') await render(parse(args));
  else if(command==='batch') await batch(parse(args));
  else throw new Error(`Unknown command: ${command}`);
} catch(error) { console.error(error.message); process.exitCode=1; }
