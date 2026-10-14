import {ART_LIBRARY} from './compiled-art.mjs';
import {MAYA_FACE_REPLACEMENTS} from './compiled-faces.mjs';
import {MAYA_HAIR} from './compiled-hair.mjs';
import {renderFacialDetails,renderMayaFeatures,getMayaPaletteMasks} from './facial-details.mjs';

export const ART_ARCHETYPES=Object.freeze(Object.keys(ART_LIBRARY));
const DEFAULT_COLORS={
 beelzebabs:{body:'#fa416b',accent:'#472153'},mothmanager:{body:'#b997ed',accent:'#fa416b'},litigator:{body:'#f4d544',accent:'#fa416b'},greg:{body:'#9de1b5',accent:'#b997ed'},
 velvet:{body:'#7695ef',accent:'#ae2a73'},bonejamin:{body:'#da5a19',accent:'#582047'},cerberus:{body:'#23538c',accent:'#207e7c'},dolly:{body:'#e649a0',accent:'#512552'},
 norm:{body:'#99988f',accent:'#ed6928'},gus:{body:'#df6d40',accent:'#742039'},dot:{body:'#dd197d',accent:'#793951'},
 john:{skin:'#edb38b',hair:'#563529',clothing:'#588fea'},
 maya:{skin:'#b9774e',hair:'#2e2330',clothing:'#b997ed'},
 brad:{skin:'#f9d4b5',hair:'#e5b557',clothing:'#fa8062'},
};
const escapeArt=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function hexHsl(hex){
 const [r,g,b]=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255),max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2;
 let h=0,s=0;if(d){s=d/(1-Math.abs(2*l-1));h=max===r?((g-b)/d)%6:max===g?(b-r)/d+2:(r-g)/d+4;h=(h*60+360)%360;}return [h,s,l];
}
function hslHex(h,s,l){const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;let rgb=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];return '#'+rgb.map(v=>Math.round((v+m)*255).toString(16).padStart(2,'0')).join('');}
function recolor(fill,semantic,c,key){
 if(semantic==='fixed')return fill;
 const property={body:'color',skin:'skin',hair:'hairColor',clothing:'clothingColor',accent:'accent'}[semantic],target=c[property],base=DEFAULT_COLORS[key]?.[semantic];
 if(!target||!base||target.toLowerCase()===base.toLowerCase())return fill;
 const [h,s,l]=hexHsl(fill),[th,ts,tl]=hexHsl(target),[bh,bs,bl]=hexHsl(base);
 return hslHex((h+th-bh+360)%360,Math.max(.02,Math.min(1,s+(ts-bs)*.6)),Math.max(.08,Math.min(.98,l+(tl-bl)*.65)));
}
export function resolveArchetype(c){
 if(c.archetype&&ART_LIBRARY[c.archetype])return c.archetype;
 if(ART_LIBRARY[c.id])return c.id;
 if(c.kind==='human')return ['curls','braids','bob'].includes(c.hairStyle)?'maya':c.hairStyle==='balding'?'brad':'john';
 return {bat:'beelzebabs',moth:'mothmanager',imp:'litigator',blob:'greg',goat:'velvet',skeleton:'bonejamin',hound:'cerberus',cyclops:'dolly',gargoyle:'norm',walrus:'gus'}[c.species]??'beelzebabs';
}
function selectFrame(asset,{pose,expression,reaction}){
 let frame=reaction;
 if(expression==='shocked')frame='shocked';
 if(!frame||frame==='idle'||frame==='smug'||frame==='sleepy')frame=pose==='celebrate'?'celebrate':pose==='writing'?(asset.kind==='human'?'talking':'writing'):pose==='stamping'?(asset.kind==='human'?'angry':'stamping'):expression==='angry'?'angry':'idle';
 if(asset.kind==='demon'&&frame==='angry')frame='writing';
 if(asset.kind==='demon'&&frame==='talking')frame='idle';
 if(asset.kind==='human'&&frame==='voting')frame='embarrassed';
 return asset.frames.find(f=>f.name===frame)??asset.frames[0];
}
function renderFaceReplacement(replacement,paint,clipId,filterId) {
 const [x,y]=replacement.box;
 const parts=replacement.parts.map(part=>`<g data-part="${part.name}">${part.paths.map(path=>{
   const fill=paint(path.fill,path.semantic);
   return `<path fill="${fill}" stroke="${fill}" stroke-width=".18" fill-rule="evenodd" stroke-linejoin="round" d="${path.d}"/>`;
 }).join('')}</g>`).join('');
 return `<g data-part="face-details" data-source="reference-vector" data-face-replacement="complete" clip-path="url(#${clipId})"><g filter="url(#${filterId})"><g transform="translate(${x} ${y})">${parts}</g></g></g>`;
}
function hairPaths(paths,fill){return paths.map(path=>`<path fill="${fill}"${path.transform?` transform="${path.transform}"`:''} d="${path.d}"/>`).join('');}
function renderMayaHair(hair,paint,clipId){
 const strands=(hair.strands??[]).map(path=>`<path fill="none" stroke="#24181a" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" opacity=".8" transform="${path.transform}" d="${path.d}"/>`).join('');
 return `<g data-part="hair" data-source="continuous-curls" clip-path="url(#${clipId})">${hairPaths(hair.silhouette,paint('#67442e','hair'))}<g opacity=".4">${hairPaths(hair.shadow,paint('#452b21','hair'))}</g><g opacity=".3">${hairPaths(hair.highlight,paint('#966447','hair'))}</g><g opacity=".55">${hairPaths(hair.ink,'#211619')}</g><g data-part="hair-strands">${strands}</g></g>`;
}
/** High-fidelity pose geometry; no image tags, bitmap URLs or network requests. */
export function renderVectorSprite(c,{pose='idle',expression,reaction,size=512,idPrefix='vector-sprite',concept='sticker'}={}){
 const key=resolveArchetype(c),asset=ART_LIBRARY[key];if(!asset)return null;
 const frame=selectFrame(asset,{pose,expression,reaction});
 const titleId=escapeArt(idPrefix),name=escapeArt(c.name),build=c.build==='wide'?1.035:c.build==='slim'?.96:1;
 const masks=key==='maya'?getMayaPaletteMasks(frame.name):null;
 const replacement=key==='maya'?MAYA_FACE_REPLACEMENTS.faces[frame.name]:null;
 const hair=key==='maya'?MAYA_HAIR.frames[frame.name]:null;
 const maskId=`${idPrefix}-${c.id}-${frame.name}-maya`.replace(/[^a-zA-Z0-9_-]/g,'-');
 const defs=masks?`<defs><clipPath id="${maskId}-face"><path d="${masks.face}"/></clipPath><clipPath id="${maskId}-jewelry"><path clip-rule="evenodd" d="${masks.jewelry}"/></clipPath>${hair?`<clipPath id="${maskId}-hair">${hairPaths(hair.silhouette,'#000000')}</clipPath>`:''}${replacement?`<clipPath id="${maskId}-replacement"><path d="${replacement.clip}"/></clipPath><clipPath id="${maskId}-body"><path clip-rule="evenodd" d="M-100 -100H1000V1000H-100Z ${replacement.clip}"/></clipPath><filter id="${maskId}-solid-face" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncA type="linear" slope="2"/></feComponentTransfer></filter>`:''}</defs>`:'';
 const paths=frame.paths.map(item=>{
   const semantic=key==='maya'&&item.semantic==='hair'?'skin':item.semantic;
   const fill=recolor(item.fill,semantic,c,key),shape=`${item.transform?` transform="${item.transform}"`:''} d="${item.d}"`;
   let result=`<path fill="${fill}"${shape}/>`;
   // Keep the original stacking order. These clipped copies adjust only the
   // paint; a later foreground contour still covers the same background paths.
   if(masks&&item.semantic==='hair') {
     const faceFill=recolor(item.fill,'skin',c,key);
     if(faceFill!==fill)result+=`<g clip-path="url(#${maskId}-face)"><path fill="${faceFill}"${shape}/></g>`;
   }
   if(masks&&item.semantic!=='fixed'&&fill!==item.fill)result+=`<g clip-path="url(#${maskId}-jewelry)"><path fill="${item.fill}"${shape}/></g>`;
   return result;
 }).join('');
 const tracedBody=`<g data-part="traced-body"${replacement?` clip-path="url(#${maskId}-body)"`:''}>${paths}</g>`;
 const facePaint=(fill,semantic)=>recolor(fill,key==='maya'&&semantic==='hair'?'skin':semantic,c,key);
 const hairPaint=(fill,semantic)=>recolor(fill,semantic,c,key);
 const facialDetails=(replacement?renderFaceReplacement(replacement,facePaint,`${maskId}-replacement`,`${maskId}-solid-face`):key==='maya'?renderMayaFeatures(frame.name,facePaint):'')+(hair?renderMayaHair(hair,hairPaint,`${maskId}-hair`):'')+renderFacialDetails(key,frame.name);
 // Authored acting is stored as vector geometry. Scene and reaction state choose
 // a pose; the driver supplies live body motion, placement, gaze and controls.
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512" role="img" aria-labelledby="${titleId}" data-character="${escapeArt(c.id)}" data-pose="${pose}" data-frame="${frame.name}" data-archetype="${key}" data-concept="${concept}" data-art="illustrated"><title id="${titleId}">${name} · ${pose} · ${escapeArt(expression??c.expression)}</title><g data-part="character" transform="translate(256 456) scale(${build} 1) translate(-256 -456)"><g data-part="body" transform="${frame.transform??''}">${defs}${tracedBody}${facialDetails}</g></g></svg>`;
}
