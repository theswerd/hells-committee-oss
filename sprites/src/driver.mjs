import {createCharacter,renderSprite,hashSeed,CONCEPTS,INK,CREAM,OPTIONS} from './sprites.mjs';

export const REACTIONS = Object.freeze({
  idle:{pose:'idle'}, writing:{pose:'writing',expression:'neutral'}, stamping:{pose:'stamping',expression:'angry'},
  voting:{pose:'idle',prop:'ballot',expression:'smug'}, celebrate:{pose:'celebrate',expression:'smile'},
  shocked:{pose:'celebrate',expression:'shocked'}, angry:{pose:'idle',expression:'angry'},
  sleepy:{pose:'idle',expression:'sleepy'}, smug:{pose:'idle',expression:'smug'},
  talking:{pose:'idle',expression:'smile'},embarrassed:{pose:'idle',expression:'neutral'},
});
export const SCENES = Object.freeze(['lineup','committee','profile','verdict']);
const n=value=>Number(value.toFixed(3));
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function move(svg,part,transform) {
  return svg.replace(new RegExp(`<g data-part="${part}"(?: transform="([^"]*)")?`),(_,existing)=>`<g data-part="${part}" transform="${transform}${existing?' '+existing:''}"`);
}
export function renderDrivenSprite(character,state={}) {
  const {reaction='idle',time=0,concept='sticker',size=512,idPrefix,expression,pose,gaze={x:0,y:0},blink,speaking=false,flip=false,joints={}}=state;
  if(!REACTIONS[reaction]) throw new RangeError(`Unknown reaction: ${reaction}`);
  if(!Number.isFinite(time)||time<0) throw new RangeError('time must be a nonnegative finite number of seconds.');
  const jointPivots={armLeft:[180,285],armRight:[332,285],wingLeft:[185,270],wingRight:[327,270],tail:[343,375]};
  for(const [key,value] of Object.entries(joints))if(!jointPivots[key]||!Number.isFinite(value)||Math.abs(value)>90)throw new RangeError(`Joint ${key} must be a supported angle within -90 and 90 degrees.`);
  const definition=createCharacter(character),rule=REACTIONS[reaction];
  const c=rule.prop?createCharacter({...definition,prop:rule.prop}):definition;
  const phase=(hashSeed(c.seed)%1000)/1000;
  const beat=time*2*Math.PI;
  const blinkCycle=(time+phase)%4.2;
  const automaticBlink=blinkCycle>3.98?Math.sin((blinkCycle-3.98)/.22*Math.PI):0;
  let svg=renderSprite(c,{pose:pose??rule.pose,expression:expression??rule.expression,size,idPrefix,concept,reaction,
    lookX:gaze.x??0,lookY:gaze.y??0,blink:blink??automaticBlink,
    mouth:speaking&&Math.sin(beat*3)>0?'open':state.mouth??'auto'});
  let bob=Math.sin(beat*.45)*1.4,tilt=0,squash=1+Math.sin(beat*.45)*.008;
  if(reaction==='celebrate') {bob=-Math.abs(Math.sin(beat*1.2))*10;squash=1+Math.sin(beat*1.2)*.02;}
  if(reaction==='shocked') {tilt=Math.sin(beat*3.5)*1.8;bob=-3;}
  if(reaction==='angry') {tilt=Math.sin(beat*1.4)*1.4;bob=-Math.abs(Math.sin(beat*1.4))*3;}
  if(reaction==='sleepy') {bob=Math.sin(beat*.2)*2.2;tilt=Math.sin(beat*.2)*1.5;}
  if(reaction==='writing') {bob=Math.sin(beat*1.1)*1.7;tilt=Math.sin(beat*.7)*2;}
  if(reaction==='stamping') {bob=-Math.abs(Math.sin(beat*.8))*5;tilt=Math.sin(beat*.8)*1.2;}
  const flipTransform=flip?'translate(512 0) scale(-1 1) ':'';
  svg=move(svg,'character',`${flipTransform}translate(0 ${n(bob)}) rotate(${n(tilt)} 256 380) translate(256 456) scale(1 ${n(squash)}) translate(-256 -456)`);
  const flap=Math.sin(beat*.65)*3;
  svg=move(svg,'wing-left',`rotate(${n(-flap)} 185 270)`);
  svg=move(svg,'wing-right',`rotate(${n(flap)} 327 270)`);
  svg=move(svg,'tail',`rotate(${n(Math.sin(beat*.4)*3)} 343 375)`);
  if(reaction==='writing') {
    const scribble=Math.sin(beat*2.4)*5;
    svg=move(svg,'arm-right',`rotate(${n(scribble)} 337 294)`);
    svg=move(svg,'pen',`rotate(${n(scribble)} 337 294)`);
  }
  if(reaction==='stamping') {
    const stampDrop=Math.max(0,Math.sin(beat*.8))*97;
    svg=move(svg,'stamp',`translate(0 ${n(stampDrop)})`);
    svg=move(svg,'arm-right',`translate(0 ${n(stampDrop)})`);
  }
  if(reaction==='celebrate'||reaction==='shocked') {
    const wave=Math.sin(beat*1.3)*9;
    svg=move(svg,'arm-left',`rotate(${n(wave)} 180 285)`);
    svg=move(svg,'arm-right',`rotate(${n(-wave)} 332 285)`);
  }
  const parts={armLeft:'arm-left',armRight:'arm-right',wingLeft:'wing-left',wingRight:'wing-right',tail:'tail'};
  for(const [key,value] of Object.entries(joints))svg=move(svg,parts[key],`rotate(${n(value)} ${jointPivots[key].join(' ')})`);
  return svg.replace('<svg ',`<svg data-reaction="${reaction}" data-time="${n(time)}" `);
}

/** Deterministic scene composition; slots accept independent state and placement. */
export function renderScene(characters,{scene='committee',concept='sticker',time=0,reaction='idle',width=1280,height=720,slots=[]}={}) {
  if(!SCENES.includes(scene)) throw new RangeError(`Unknown scene: ${scene}`);
  if(!Array.isArray(characters)||characters.length===0) throw new RangeError('A scene needs at least one character.');
  if(!Number.isInteger(width)||width<128||width>8192||!Number.isInteger(height)||height<128||height>8192) throw new RangeError('Scene dimensions must be integers from 128 to 8192.');
  const w=1280,h=720;
  let background='';
  if(scene!=='lineup') {
    background=`<rect width="${w}" height="${h}" fill="${scene==='verdict'?'#eadcf8':'#3c2455'}"/>`;
    if(scene==='committee') background+=`<path d="M0 545L1280 545V720H0Z" fill="#5e3b6b"/><rect x="64" y="147" width="150" height="322" rx="14" fill="#8865ad" stroke="${INK}" stroke-width="7"/><rect x="1064" y="147" width="150" height="322" rx="14" fill="#8865ad" stroke="${INK}" stroke-width="7"/>${[176,266,356].map(y=>`<rect x="82" y="${y}" width="114" height="72" rx="8" fill="#cda6de" stroke="${INK}" stroke-width="5"/><path d="M119 ${y+38}h35" stroke="${INK}" stroke-width="7"/>`).join('')}<rect x="394" y="62" width="492" height="75" rx="15" fill="${CREAM}" stroke="${INK}" stroke-width="7"/><text x="640" y="108" text-anchor="middle" font-family="Arial,sans-serif" font-size="30" font-weight="900" fill="${INK}">HELL’S COMMITTEE</text>`;
    if(scene==='profile') background+=`<rect x="82" y="76" width="1116" height="568" rx="35" fill="${CREAM}" stroke="${INK}" stroke-width="7"/><text x="700" y="217" font-family="Arial,sans-serif" font-size="50" font-weight="900" fill="${INK}">${escape(characters[0].name)}</text><text x="700" y="272" font-family="Arial,sans-serif" font-size="22" fill="${INK}">CASE ON FILE / REACTION STUDY</text>`;
    if(scene==='verdict') background+=`<path d="M640 110L190 720H1090Z" fill="${CREAM}"/><text x="640" y="92" text-anchor="middle" font-family="Arial,sans-serif" font-size="38" font-weight="900" fill="${INK}">THE COMMITTEE HAS SPOKEN</text>`;
  }
  const total=characters.length;
  const size=scene==='profile'?560:Math.min(480,1150/total);
  const sprites=characters.map((c,i)=>{
    const slot=slots[i]??{};
    const spriteSize=slot.size??size;
    const x=slot.x??(scene==='profile'?115:(w-total*size)/2+i*size);
    const y=slot.y??(scene==='profile'?110:scene==='committee'?490-spriteSize*.83:600-spriteSize*.88);
    const svg=renderDrivenSprite(c,{reaction,time,concept,size:Math.round(spriteSize),idPrefix:`scene-${i}`,...slot.state});
    return svg.replace('<svg ',`<svg x="${n(x)}" y="${n(y)}" `);
  }).join('');
  const desk=scene==='committee'?`<rect x="102" y="476" width="1076" height="34" rx="12" fill="#fa416b" stroke="${INK}" stroke-width="7"/><path d="M125 510H1155V676H125Z" fill="#704279" stroke="${INK}" stroke-width="7"/>${characters.map((c,i)=>`<rect x="${170+i*(930/total)}" y="${532}" width="${Math.min(190,850/total)}" height="54" rx="10" fill="${CREAM}" stroke="${INK}" stroke-width="4"/><text x="${170+i*(930/total)+Math.min(190,850/total)/2}" y="567" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" font-weight="800" fill="${INK}">${escape(c.name)}</text>`).join('')}`:'';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${w} ${h}" data-scene="${scene}" data-concept="${concept}">${background}${sprites}${desk}</svg>`;
}

/** Browser controller. Game events can call setState or setCharacter at any time. */
export function mountSprite(element,character,initialState={}) {
  if(!element||typeof element.innerHTML!=='string'||typeof requestAnimationFrame==='undefined') throw new TypeError('mountSprite requires a browser element.');
  let identity=createCharacter(character),state={reaction:'idle',concept:'sticker',play:true,...initialState},start=performance.now(),frame=0,last=0,destroyed=false;
  const draw=time=>{element.innerHTML=renderDrivenSprite(identity,{...state,time:state.play?time:state.time??0});};
  // Validate state before scheduling.
  draw(0);
  function loop(now){if(destroyed)return;if(now-last>=1000/24){draw((now-start)/1000);last=now;}frame=requestAnimationFrame(loop);}
  frame=requestAnimationFrame(loop);
  return {
    setState(patch){const next={...state,...patch};renderDrivenSprite(identity,{...next,time:next.time??0});if(patch.reaction&&patch.reaction!==state.reaction)start=performance.now();state=next;draw((performance.now()-start)/1000);},
    setCharacter(value){identity=createCharacter(value);start=performance.now();draw(0);},
    getCharacter(){return {...identity};},
    getState(){return {...state};},
    destroy(){destroyed=true;cancelAnimationFrame(frame);},
  };
}

export function mountScene(element,characters,initialState={}) {
  if(!element||typeof element.innerHTML!=='string'||typeof requestAnimationFrame==='undefined') throw new TypeError('mountScene requires a browser element.');
  let cast=characters.map(createCharacter),state={scene:'committee',concept:'sticker',reaction:'idle',play:true,...initialState},start=performance.now(),last=0,frame=0,destroyed=false;
  const draw=time=>{element.innerHTML=renderScene(cast,{...state,time:state.play?time:state.time??0});};
  draw(0);
  function loop(now){if(destroyed)return;if(state.play&&now-last>=1000/24){draw((now-start)/1000);last=now;}frame=requestAnimationFrame(loop);}
  frame=requestAnimationFrame(loop);
  return {
    setState(patch){const next={...state,...patch};renderScene(cast,{...next,time:next.time??0});state=next;draw((performance.now()-start)/1000);},
    setCharacters(value){const next=value.map(createCharacter);renderScene(next,{...state,time:0});cast=next;start=performance.now();draw(0);},
    getState(){return structuredClone(state);},
    destroy(){destroyed=true;cancelAnimationFrame(frame);},
  };
}
