import {enhanceSprite} from './illustrated.mjs';
import {renderVectorSprite,ART_ARCHETYPES} from './high-fidelity.mjs';
/**
 * Hell's Committee · parametric art foundation.
 * Character identity is plain JSON. A pose never rerolls that identity.
 * All shapes are vector paths; no image assets, fonts or packages required.
 */
export const VERSION = '0.1.0';
export const CONCEPTS = Object.freeze({
  sticker: {name:'Sticker Clerks', description:'Round silhouettes, chunky outlines, office props.', x:1, y:1},
  squishy: {name:'Squishy Bureaucrats', description:'Shorter, broader mascots with oversized faces.', x:1.035, y:.86},
  angular: {name:'Ink & Angles', description:'Sharper silhouettes and bolder graphic shapes.', x:.94, y:1.01},
});
export const INK = '#271334';
export const CREAM = '#fff6df';
export const PALETTES = Object.freeze({
  cherry: '#fa416b', lilac: '#b997ed', gold: '#f4d544', mint: '#9de1b5',
  coral: '#fa8062', blue: '#74b7f0', lime: '#d9ef57', plum: '#8667b5',
});
export const SKIN_TONES = Object.freeze(['#f9d4b5', '#edb38b', '#d49368', '#b9774e', '#96593e', '#734630', '#533527']);
export const HAIR_COLORS = Object.freeze(['#563529', '#2e2330', '#9b5635', '#e5b557', '#a6a0b2', '#ed628b']);
export const OPTIONS = Object.freeze({
  kind: ['demon', 'human'],
  archetype: ['auto','beelzebabs','mothmanager','litigator','greg','velvet','bonejamin','cerberus','dolly','norm','gus','dot','john','maya','brad'],
  species: ['bat', 'moth', 'imp', 'blob', 'goat', 'skeleton', 'hound', 'cyclops', 'gargoyle', 'walrus'],
  build: ['slim', 'regular', 'wide'],
  horns: ['curved', 'short', 'spiral', 'antlers', 'none'],
  wings: ['bat', 'moth', 'none'],
  tail: ['spade', 'none'],
  glasses: ['none', 'round', 'cat-eye', 'square'],
  outfit: ['tie', 'waistcoat', 'polo', 'suit', 'tracksuit', 'hoodie', 'shirt', 'none'],
  hairStyle: ['quiff', 'bob', 'curls', 'braids', 'spiky', 'balding'],
  facialHair: ['none', 'moustache', 'beard'],
  prop: ['none', 'clipboard', 'mug', 'phone', 'stamp', 'ballot', 'stapler'],
  expression: ['smile', 'smug', 'angry', 'shocked', 'sleepy', 'neutral'],
  pose: ['idle', 'writing', 'stamping', 'celebrate'],
});
const enumKeys = Object.keys(OPTIONS).filter(k => !['kind', 'pose'].includes(k));
const colorKeys = ['color', 'skin', 'hairColor', 'clothingColor', 'pantsColor', 'accent'];
const allowedKeys = new Set(['version', 'id', 'name', 'seed', 'kind', ...enumKeys, ...colorKeys]);

export function hashSeed(value) {
  let h = 2166136261;
  for (const ch of String(value)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export function seededRandom(seed) {
  let a = hashSeed(seed);
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const pick = (items, random) => items[Math.floor(random() * items.length)];
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&apos;'}[c]));

function validateOptions(options) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('Character options must be an object.');
  for (const [key, value] of Object.entries(options)) {
    if (!allowedKeys.has(key)) throw new TypeError(`Unknown character option: ${key}`);
    if (OPTIONS[key] && !OPTIONS[key].includes(value)) throw new RangeError(`${key} must be one of: ${OPTIONS[key].join(', ')}`);
    if (colorKeys.includes(key) && !/^#[0-9a-f]{6}$/i.test(value)) throw new RangeError(`${key} must be a six-digit hex color.`);
  }
  for (const key of ['name', 'id']) if (options[key] !== undefined && typeof options[key] !== 'string') throw new TypeError(`${key} must be a string.`);
  if (options.seed !== undefined && !['string', 'number'].includes(typeof options.seed)) throw new TypeError('seed must be a string or number.');
  if (options.version !== undefined && options.version !== VERSION) throw new RangeError(`Unsupported character version: ${options.version}`);
}

/** Deterministic feature selection; callers can pin any feature explicitly. */
export function createCharacter(options = {}) {
  validateOptions(options);
  const seed = String(options.seed ?? 'committee-001');
  const random = seededRandom(seed);
  const kind = options.kind ?? 'demon';
  const species = options.species ?? pick(OPTIONS.species, random);
  const color = pick(Object.values(PALETTES), random);
  const character = {
    version: VERSION, id: `${kind}-${hashSeed(seed).toString(36)}`, name: kind === 'demon' ? 'Committee member' : 'New case', seed, kind, species,
    color, accent: pick([PALETTES.cherry, PALETTES.gold, PALETTES.lime, PALETTES.lilac], random),
    skin: pick(SKIN_TONES, random), hairColor: pick(HAIR_COLORS, random),
    clothingColor: pick([PALETTES.lilac, PALETTES.blue, PALETTES.coral, PALETTES.mint, PALETTES.cherry], random), pantsColor: pick(['#645278', '#d9b68a', '#434052'], random),
    build: pick(OPTIONS.build, random),
    horns: species === 'moth' ? 'none' : pick(['curved', 'short', 'spiral', 'antlers'], random),
    wings: species === 'moth' ? 'moth' : species === 'bat' ? 'bat' : 'none',
    tail: ['bat', 'imp', 'goat'].includes(species) ? 'spade' : 'none',
    glasses: species === 'moth' ? 'cat-eye' : species === 'imp' ? 'round' : pick(['none', 'none', 'square'], random),
    outfit: kind === 'human' ? pick(['polo', 'suit', 'tracksuit', 'hoodie', 'shirt'], random) : pick(['tie', 'waistcoat', 'none'], random),
    hairStyle: pick(OPTIONS.hairStyle, random), facialHair: pick(['none', 'none', 'none', 'moustache', 'beard'], random),
    prop: pick(['clipboard', 'mug', 'phone', 'none'], random),
    expression: kind === 'human' ? pick(['smug', 'smile', 'neutral'], random) : pick(['smile', 'smug', 'sleepy'], random),
    archetype:ART_ARCHETYPES.includes(options.id)?options.id:kind==='human'?pick(['john','maya','brad'],random):({bat:'beelzebabs',moth:'mothmanager',imp:'litigator',blob:'greg',goat:'velvet',skeleton:'bonejamin',hound:'cerberus',cyclops:'dolly',gargoyle:'norm',walrus:'gus'}[species]),
    ...options, seed,
  };
  return Object.freeze(character);
}

export function generateRoster({ kind = 'demon', seed = 'committee', count = 12, ...features } = {}) {
  if (!Number.isInteger(count) || count < 1 || count > 10000) throw new RangeError('count must be an integer from 1 to 10000.');
  return Array.from({length: count}, (_, i) => createCharacter({...features, kind, seed: `${seed}:${i}`}));
}

export const PRESETS = Object.freeze({
  beelzebabs: createCharacter({id:'beelzebabs', name:'Beelzebabs', seed:'beelzebabs', species:'bat', color:PALETTES.cherry, build:'regular', horns:'curved', wings:'bat', tail:'spade', outfit:'tie', glasses:'none', prop:'none', expression:'smile', accent:'#472153'}),
  mothmanager: createCharacter({id:'mothmanager', name:'Mothmanager', seed:'mothmanager', species:'moth', color:PALETTES.lilac, build:'regular', horns:'none', wings:'moth', tail:'none', outfit:'tie', glasses:'cat-eye', prop:'clipboard', expression:'smug', accent:PALETTES.cherry}),
  litigator: createCharacter({id:'litigator', name:"Lil’ Litigator", seed:'litigator', species:'imp', color:PALETTES.gold, build:'regular', horns:'short', wings:'none', tail:'spade', outfit:'waistcoat', glasses:'round', prop:'none', expression:'smug', accent:PALETTES.cherry}),
  greg: createCharacter({id:'greg', name:'Greg', seed:'greg', species:'blob', color:PALETTES.mint, build:'regular', horns:'short', wings:'none', tail:'none', outfit:'none', glasses:'none', prop:'mug', expression:'sleepy', accent:PALETTES.lilac}),
  velvet: createCharacter({id:'velvet', name:'Velvet Vice', seed:'velvet', archetype:'velvet', species:'goat', color:'#7695ef', accent:'#ae2a73', build:'regular', horns:'spiral', wings:'none', tail:'spade', outfit:'suit', glasses:'none', hairStyle:'bob', facialHair:'none', prop:'clipboard', expression:'smug'}),
  bonejamin: createCharacter({id:'bonejamin', name:'Bonejamin', seed:'bonejamin', archetype:'bonejamin', species:'skeleton', color:'#da5a19', accent:'#582047', build:'regular', horns:'curved', wings:'none', tail:'none', outfit:'suit', glasses:'none', facialHair:'none', prop:'none', expression:'smile'}),
  cerberus: createCharacter({id:'cerberus', name:'Cerberus', seed:'cerberus', archetype:'cerberus', species:'hound', color:'#23538c', accent:'#207e7c', build:'regular', horns:'short', wings:'none', tail:'spade', outfit:'waistcoat', glasses:'none', facialHair:'none', prop:'clipboard', expression:'smile'}),
  dolly: createCharacter({id:'dolly', name:'Dolly Doom', seed:'dolly', archetype:'dolly', species:'cyclops', color:'#e649a0', accent:'#512552', build:'regular', horns:'short', wings:'none', tail:'spade', outfit:'shirt', glasses:'none', hairStyle:'quiff', facialHair:'none', prop:'clipboard', expression:'smug'}),
  norm: createCharacter({id:'norm', name:'Norm Goyle', seed:'norm', archetype:'norm', species:'gargoyle', color:'#99988f', accent:'#ed6928', build:'regular', horns:'short', wings:'bat', tail:'none', outfit:'tie', glasses:'none', facialHair:'none', prop:'mug', expression:'sleepy'}),
  gus: createCharacter({id:'gus', name:'Gus Grumble', seed:'gus', archetype:'gus', species:'walrus', color:'#df6d40', accent:'#742039', build:'regular', horns:'curved', wings:'none', tail:'none', outfit:'waistcoat', glasses:'none', facialHair:'moustache', prop:'stamp', expression:'sleepy'}),
  dot: createCharacter({id:'dot', name:'Dot', seed:'dot', archetype:'dot', species:'bat', color:'#dd197d', accent:'#793951', build:'regular', horns:'short', wings:'bat', tail:'none', outfit:'shirt', glasses:'square', facialHair:'none', prop:'stapler', expression:'sleepy'}),
  john: createCharacter({id:'john', name:'John', seed:'john', kind:'human', skin:'#edb38b', hairColor:'#563529', hairStyle:'quiff', facialHair:'none', outfit:'polo', clothingColor:'#588fea', pantsColor:'#d9b68a', build:'regular', glasses:'none', prop:'none', expression:'smug'}),
  maya: createCharacter({id:'maya', name:'Maya', seed:'maya', kind:'human', skin:'#b9774e', hairColor:'#2e2330', hairStyle:'curls', facialHair:'none', outfit:'tracksuit', clothingColor:PALETTES.lilac, pantsColor:'#9169bd', build:'regular', glasses:'none', prop:'phone', expression:'smug'}),
  brad: createCharacter({id:'brad', name:'Brad', seed:'brad', kind:'human', skin:'#f9d4b5', hairColor:'#e5b557', hairStyle:'balding', facialHair:'none', outfit:'suit', clothingColor:PALETTES.coral, pantsColor:'#645278', build:'regular', glasses:'none', prop:'clipboard', expression:'smug'}),
});

function tone(hex, toward = '#ffffff', amount = 0.25) {
  const channel = (h, i) => parseInt(h.slice(i, i + 2), 16);
  return '#' + [1,3,5].map(i => Math.round(channel(hex,i) * (1-amount) + channel(toward,i) * amount).toString(16).padStart(2,'0')).join('');
}
const path = (d, fill = 'none', sw = 6, extra = '') => `<path d="${d}" fill="${fill}" ${extra.includes('stroke=') ? '' : `stroke="${INK}"`} stroke-width="${sw}" ${extra}/>`;
const ellipse = (cx, cy, rx, ry, fill, sw = 6, extra = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${INK}" stroke-width="${sw}" ${extra}/>`;
const rect = (x,y,w,h,r,fill,sw = 6,extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${INK}" stroke-width="${sw}" ${extra}/>`;
const group = (part, art, transform = '') => `<g data-part="${part}"${transform ? ` transform="${transform}"` : ''}>${art}</g>`;

function horns(style) {
  if (style === 'none') return '';
  const ivory = '#f8df9c';
  let left;
  if (style === 'curved') left = path('M183 145 C143 145 141 97 164 72 C158 110 172 111 201 129 Z',ivory) + path('M155 109 L179 118 M153 95 L165 99','none',3);
  else if (style === 'short') left = path('M177 150 Q163 127 171 97 Q189 120 202 139 Z',ivory) + path('M176 123 L191 130','none',3);
  else if (style === 'spiral') left = path('M195 150 C136 150 136 94 170 93 C202 93 200 127 175 130 C161 132 156 117 165 110 L174 116 Q188 111 177 105 Q155 97 153 119 Q156 140 195 134 Z',ivory,5);
  else left = path('M185 150 L172 126 L149 113 L146 93 L160 109 L176 114 L170 91 L175 72 L183 111 L195 96 L208 94 L191 118 L203 143 Z',ivory,5);
  return group('horns', left + `<g transform="translate(512 0) scale(-1 1)">${left}</g>`);
}
function wings(style, color) {
  if (style === 'none') return '';
  let left;
  if (style === 'bat') {
    left = path('M174 220 Q139 143 65 154 L36 296 Q65 255 91 290 Q96 253 125 278 Q134 244 174 261 Z',tone(color,INK,.14));
    left += path('M69 161 Q119 199 174 255 M69 161 L91 288 M69 161 L125 277','none',3);
    left += path('M72 174 L49 258 Q73 237 83 257 Z',tone(color,'#ffffff',.2),0);
  } else {
    left = path('M194 204 C148 142 65 165 54 226 C46 271 84 305 143 299 C70 324 69 388 118 398 C164 407 192 350 202 285 Z',tone(color,'#ffffff',.22));
    left += ellipse(110,231,27,42,tone(color,INK,.20),3,'transform="rotate(-23 110 231)"');
    left += ellipse(132,353,19,26,tone(color,INK,.16),3,'transform="rotate(25 132 353)"');
    left += ellipse(115,222,10,17,CREAM,0) + ellipse(132,349,6,10,CREAM,0);
    left += path('M188 260 Q134 270 94 286','none',3);
  }
  return group('rear-wings',group('wing-left',left) + group('wing-right',`<g transform="translate(512 0) scale(-1 1)">${left}</g>`));
}
function tail(style,color) {
  return style === 'none' ? '' : group('tail',path('M343 375 C420 416 446 362 423 334','none',10) + path('M343 375 C420 416 446 362 423 334','none',5,`stroke="${color}"`) + path('M408 340 L420 307 L444 332 Q428 326 423 342 Z',color,5));
}
function demonBody(c,concept='sticker') {
  const {species,color} = c;
  const shade = tone(color,INK,.12), light = tone(color,'#ffffff',.28);
  let art;
  if (species === 'bat') {
    art = path(concept==='angular'?'M171 164 L218 144 L294 144 L340 164 L375 213 L367 265 L389 313 L377 380 L338 418 L174 418 L128 380 L114 313 L138 262 L132 211 Z':'M174 157 C133 163 119 210 126 257 C96 300 112 374 159 404 C195 431 319 431 357 403 C402 372 408 302 382 256 C388 205 369 161 336 157 C301 133 207 133 174 157 Z',color);
    art += path('M136 315 Q150 395 224 406 Q315 439 357 398 Q301 419 274 392 Q168 393 136 315 Z',shade,0);
    art += path('M154 205 Q159 168 202 160 L215 174 Q176 175 167 213 Z',light,0);
  } else if (species === 'moth') {
    art = path('M176 184 L161 162 L185 166 L186 143 L205 155 L218 135 L232 150 L254 130 L267 149 L289 136 L300 157 L326 145 L322 174 L347 163 L339 185 C368 224 362 268 345 300 L363 321 L344 322 L347 347 L326 340 L321 370 L301 361 L287 390 L267 373 L253 399 L237 376 L215 389 L202 366 L182 372 L178 347 L158 348 L168 323 L145 319 L165 298 C147 254 143 215 176 184 Z',color);
    art += path('M184 323 L202 326 L204 347 L222 338 L236 364 L251 349 L269 363 L284 341 L306 349 L324 326 L338 330 L319 367 L297 376 L278 398 L252 405 L220 390 L195 373 Z',shade,0);
    art += path('M178 191 L190 174 L192 187 L208 166 L219 183 L239 170 L235 187 Q198 198 184 225 Z',light,0);
    art += group('antennae',path('M221 162 Q195 89 141 98 M290 160 Q321 85 367 101','none',7) + ellipse(139,97,10,7,INK,0) + ellipse(369,100,10,7,INK,0));
  } else if (species === 'imp' || species === 'goat') {
    art = path('M208 288 Q178 312 180 364 L193 405 Q258 422 319 403 L332 365 Q334 312 300 288 Z',color);
    art += path('M174 199 L125 174 L158 242 L191 243 M340 198 L389 174 L355 243 L322 241',color);
    art += path(concept==='angular'?'M179 164 L224 143 L293 143 L335 166 L355 213 L343 252 L304 293 L258 309 L207 292 L168 253 L153 212 Z':'M178 165 Q255 122 333 165 Q369 202 347 249 Q330 295 258 309 Q186 300 166 254 Q145 214 178 165 Z',color);
    art += path('M156 195 L169 226 L182 213 M354 213 L369 195 L353 229',shade,0);
    art += path('M180 178 Q231 143 279 160 L266 170 Q215 163 184 194 Z',light,0);
    if (species === 'goat') art += path('M220 260 Q256 244 291 260 L280 288 Q256 302 231 288 Z',tone(color,'#ffffff',.22),4) + path('M237 294 L256 323 L274 295',CREAM,4);
  } else {
    art = path(concept==='angular'?'M176 185 L198 166 L241 158 L267 147 L304 162 L335 187 L352 221 L367 276 L381 334 L391 398 L358 428 L293 439 L248 435 L200 440 L155 427 L123 400 L132 337 L141 282 L158 218 Z':'M189 178 Q195 157 218 158 L232 144 L247 153 L266 140 L278 154 L299 146 L310 163 Q334 160 342 189 L362 183 L357 207 Q393 242 392 309 L407 320 L394 334 Q413 371 391 395 L400 407 L378 411 Q364 439 337 430 L327 440 L306 432 Q277 447 256 434 Q228 449 207 432 L185 440 L176 429 Q146 439 132 417 L112 418 L121 397 Q105 371 121 339 L106 326 L123 315 Q119 251 157 214 L151 190 L172 195 Z',color);
    art += path('M130 354 Q147 410 194 411 L213 420 L235 408 L255 420 L277 408 L305 421 L327 410 Q371 420 388 377 L389 404 L372 423 L333 438 L308 435 L278 445 L256 440 L226 445 L190 434 L155 430 L132 412 Z',shade,0);
    art += path('M175 226 Q193 178 227 176 L220 190 Q192 197 188 231 Z',light,0);
  }
  return group('body',art);
}
function feet(c) {
  const y = ['imp','goat'].includes(c.species) ? 408 : c.species === 'moth' ? 393 : 422;
  return group('feet',path(`M196 ${y} L194 ${y+19} Q176 ${y+22} 177 ${y+34} L230 ${y+34} L231 ${y+6} Z`,INK,4) + path(`M281 ${y+6} L281 ${y+34} L335 ${y+34} Q337 ${y+22} 315 ${y+19} L314 ${y} Z`,INK,4));
}
function demonOutfit(c) {
  if (c.outfit === 'none') return '';
  const y = ['imp','goat'].includes(c.species) ? 293 : 294;
  let art = '';
  if (['waistcoat','suit'].includes(c.outfit)) art += path(`M198 ${y} L254 ${y+16} L313 ${y} L323 ${y+83} L263 ${y+100} L249 ${y+86} L228 ${y+101} L185 ${y+80} Z`,INK);
  art += path(`M218 ${y-5} L254 ${y+7} L294 ${y-5} L277 ${y+27} L255 ${y+15} L237 ${y+29} Z`,CREAM,4);
  art += path(`M249 ${y+14} L262 ${y+14} L269 ${y+28} L260 ${y+37} L275 ${y+68} L257 ${y+81} L239 ${y+67} L252 ${y+36} L243 ${y+27} Z`,c.accent,4);
  if (['waistcoat','suit'].includes(c.outfit)) art += ellipse(256,y+91,4,4,c.accent,0);
  return group('outfit',art);
}

function eyes(expression,color,{blink=0,lookX=0,lookY=0}={}) {
  let art = '';
  const y = 0, rx = expression === 'shocked' ? 25 : 22, ry = expression === 'shocked' ? 29 : 26;
  for (const x of [-34,34]) {
    if (expression === 'sleepy' || blink > .78) {
      art += path(`M${x-20} -2 Q${x} 12 ${x+20} -2`,'none',5);
    } else {
      art += ellipse(x,y,rx,ry,CREAM,5);
      const pupilX = x + (expression === 'smug' ? 6 : 0) + lookX*6;
      art += ellipse(pupilX,(expression === 'smug' ? 7 : 2)+lookY*5,9,expression === 'shocked' ? 15 : 14,INK,0);
      art += ellipse(pupilX+3,-3+lookY*5,3.5,4,'#ffffff',0);
      if (expression === 'smug' || expression === 'neutral') art += path(`M${x-21} -4 L${x+21} -4 Q${x+18} -26 ${x} -26 Q${x-18} -26 ${x-21} -4 Z`,color,4);
    }
  }
  if (expression === 'angry') art += path('M-57 -31 L-15 -19 M15 -19 L57 -31','none',7);
  else if (expression === 'shocked') art += path('M-56 -40 Q-35 -52 -17 -40 M17 -40 Q36 -52 56 -40','none',5);
  else art += path('M-54 -34 Q-35 -40 -18 -34 M19 -34 Q35 -41 56 -33','none',5);
  return art;
}
function face(c, expression, cy,controls={}) {
  const human = c.kind === 'human';
  const color = human ? c.skin : c.color;
  let art = eyes(expression,color,controls);
  if (human) art += path('M2 15 L8 29 L-2 31','none',3);
  let mouth = '';
  if (expression === 'shocked') mouth = ellipse(0,58,20,26,INK,4) + ellipse(0,73,10,6,PALETTES.cherry,0);
  else if (expression === 'sleepy') mouth = path('M-12 39 Q0 48 13 39','none',4);
  else if (expression === 'smug') mouth = path('M-31 41 Q3 57 32 29 M28 28 L37 30','none',5);
  else if (expression === 'neutral') mouth = path('M-21 43 Q1 47 21 43','none',4);
  else {
    mouth = path('M-39 32 Q0 53 40 31 Q35 72 0 68 Q-31 64 -39 32 Z',INK,4);
    mouth += path('M-30 39 Q0 49 31 38 L25 49 Q0 58 -24 48 Z',CREAM,0);
    if (!human) mouth += path('M-27 40 L-21 55 L-14 44 M14 44 L21 55 L28 40',CREAM,0);
    mouth += ellipse(0,61,16,5,PALETTES.cherry,0);
  }
  if(controls.mouth==='open') mouth = ellipse(0,51,17,19,INK,3)+ellipse(0,63,10,5,PALETTES.cherry,0);
  if(controls.mouth==='flat') mouth = path('M-22 49 L22 49','none',4);
  art += mouth;
  if (human && c.facialHair !== 'none') art += c.facialHair === 'moustache' ? path('M-3 31 Q-23 24 -34 39 Q-10 47 0 35 Q15 48 34 39 Q23 24 4 31 Z',c.hairColor,2) : path('M-38 32 L-23 65 L0 80 L24 66 L38 32 Q25 43 11 38 L0 46 L-11 39 Q-26 44 -38 32 Z',c.hairColor,3);
  art += ellipse(-58,29,10,5,tone(color,PALETTES.cherry,.25),0) + ellipse(58,29,10,5,tone(color,PALETTES.cherry,.25),0);
  return group('face',art,`translate(256 ${cy})${human ? ' scale(.79)' : ''}`);
}
function glasses(style,accent,cy,human) {
  if (style === 'none') return '';
  let art = '';
  if (style === 'round') art = ellipse(-34,0,29,31,'none',6) + ellipse(34,0,29,31,'none',6) + path('M-5 -3 Q0 -8 5 -3','none',5);
  if (style === 'square') art = rect(-63,-26,58,52,10,'none',6) + rect(5,-26,58,52,10,'none',6) + path('M-5 -7 L5 -7','none',5);
  if (style === 'cat-eye') art = path('M-72 -31 L-4 -19 Q-5 25 -34 26 Q-59 24 -72 -31 Z','none',7,`stroke="${accent}"`) + path('M72 -31 L4 -19 Q5 25 34 26 Q59 24 72 -31 Z','none',7,`stroke="${accent}"`) + path('M-4 -10 Q0 -15 4 -10','none',5,`stroke="${accent}"`);
  return group('glasses',art,`translate(256 ${cy})${human ? ' scale(.79)' : ''}`);
}
function hands(c,pose) {
  const color = c.kind === 'human' ? c.skin : c.color;
  const leftX = c.kind === 'human' ? 188 : c.species === 'imp' ? 181 : 161;
  const rightX = 512 - leftX;
  let left, right;
  if (pose === 'celebrate') {
    left = path(`M${leftX+16} 318 Q${leftX-46} 300 ${leftX-51} 231 L${leftX-34} 221 Q${leftX-25} 270 ${leftX+32} 283 Z`,color) + ellipse(leftX-43,220,20,22,color,5);
    right = `<g transform="translate(512 0) scale(-1 1)">${left}</g>`;
  } else {
    left = path(`M${leftX+24} 285 Q${leftX-25} 306 ${leftX-7} 355 Q${leftX+7} 368 ${leftX+49} 348 L${leftX+43} 325 Q${leftX+13} 342 ${leftX+11} 327 L${leftX+38} 301 Z`,color) + ellipse(leftX+48,336,19,18,color,5);
    if (pose === 'stamping') right = path(`M${rightX-24} 290 Q${rightX+16} 276 ${rightX+14} 247 L${rightX+33} 245 Q${rightX+47} 297 ${rightX+4} 329 Z`,color) + ellipse(rightX+23,240,20,19,color,5);
    else if (pose === 'writing') right = path(`M${rightX-20} 289 Q${rightX+31} 314 ${rightX-8} 350 L${rightX-42} 348 L${rightX-40} 328 L${rightX-15} 326 L${rightX-36} 306 Z`,color) + ellipse(rightX-39,339,18,16,color,5);
    else right = path(`M${rightX-24} 287 Q${rightX+25} 315 ${rightX+8} 352 Q${rightX-4} 365 ${rightX-36} 352 L${rightX-32} 329 Q${rightX-7} 346 ${rightX-13} 327 L${rightX-37} 305 Z`,color) + ellipse(rightX-31,344,18,17,color,5);
  }
  return group('arm-left',left) + group('arm-right',right);
}
function props(c,pose) {
  let art = '';
  const prop = pose === 'writing' ? 'clipboard' : pose === 'stamping' ? 'stamp' : c.prop;
  if (pose === 'celebrate') return '';
  if (prop === 'clipboard') {
    art = rect(285,302,91,111,9,'#bf8d69',5) + rect(293,314,75,88,3,CREAM,2) + rect(310,297,37,14,4,INK,3) + path('M305 339 L354 339 M305 352 L351 352 M305 365 L346 365 M305 378 L336 378','none',3);
    if (pose === 'writing') art += group('pen',path('M289 337 L329 368 L336 356 L296 326 Z',c.accent,4) + path('M329 368 L337 371 L336 356',CREAM,3));
    else art += path('M318 387 L324 394 L343 380','none',3,`stroke="${PALETTES.cherry}"`);
  } else if (prop === 'mug') {
    art = path('M371 352 C411 338 419 387 380 393','none',10) + rect(322,343,65,65,10,CREAM,5) + path('M340 360 L365 360 M352 351 L352 389 M339 381 Q352 395 365 381','none',4,`stroke="${c.accent}"`) + path('M338 331 Q330 316 342 307 M363 330 Q352 316 365 304','none',3);
  } else if (prop === 'phone') {
    art = rect(327,282,55,95,10,INK,5,'transform="rotate(9 353 329)"') + rect(335,291,39,66,4,c.accent,0,'transform="rotate(9 353 329)"') + path('M345 303 L365 307 M345 314 L358 316','none',3) + ellipse(349,365,3,3,CREAM,0);
  } else if (prop === 'stamp') {
    art = group('stamp',path('M341 240 Q332 207 354 207 Q376 207 366 240 L377 254 L330 254 Z',c.accent,5) + rect(321,252,68,19,5,INK,4));
    art += group('paper',path('M316 371 L428 360 L438 411 L325 422 Z',CREAM,4) + path('M341 387 L411 379 L414 399 L344 407 Z','none',4,`stroke="${PALETTES.cherry}"`) + path('M374 382 L378 402 M366 391 L385 389','none',3,`stroke="${PALETTES.cherry}"`));
  } else if(prop==='ballot') {
    art=path('M300 290 L387 300 L378 403 L291 393 Z',CREAM,5)+path('M313 326 L360 331 L356 373 L308 368 Z','none',4)+path('M319 349 L330 360 L350 339','none',7,`stroke="${c.accent}"`);
  }
  return group('prop',art);
}

function hairBack(c) {
  if (c.hairStyle === 'bob') return path('M181 143 Q166 83 256 74 Q350 83 334 149 L344 250 L309 270 L294 249 L211 251 L190 270 L168 248 Z',c.hairColor);
  if (c.hairStyle === 'curls' || c.hairStyle === 'braids') return path('M167 124 Q151 97 182 87 Q166 62 201 56 Q215 35 237 53 Q259 29 280 49 Q311 37 317 64 Q350 57 352 88 Q378 97 349 126 L346 226 Q368 244 344 257 Q350 282 322 278 Q302 293 287 272 L222 266 Q198 286 179 269 Q148 271 161 241 Q135 230 162 206 Z',c.hairColor);
  return '';
}
function hairFront(c) {
  const color=c.hairColor, light=tone(color,'#ffffff',.18);
  let art='';
  switch(c.hairStyle) {
    case 'quiff': art=path('M187 158 Q172 141 187 112 Q176 85 208 81 Q224 49 250 73 Q284 41 304 75 Q335 74 329 109 Q319 138 274 132 L264 113 Q235 144 208 137 L204 161 Z',color) + path('M220 97 Q258 66 284 85 Q261 84 243 105',light,0); break;
    case 'bob': art=path('M182 143 Q180 78 255 77 Q328 79 331 140 L291 114 L278 145 L253 123 L227 142 L214 115 L201 155 Z',color); break;
    case 'curls': art=path('M182 140 Q159 122 180 111 Q173 85 200 88 Q202 65 224 80 Q236 52 255 78 Q275 59 291 82 Q323 70 322 100 Q348 114 325 138 L298 123 Q278 143 262 117 Q238 140 224 120 Q197 143 190 126 Z',color); break;
    case 'braids': art=path('M182 142 Q171 75 253 77 Q341 75 330 143 L309 129 L300 110 L286 127 L271 110 L253 131 L239 107 L223 125 L206 110 L195 149 Z',color) + path('M194 106 Q218 85 251 91 M208 119 Q221 100 248 98 M267 91 Q300 92 316 120','none',3,`stroke="${light}"`) + ellipse(184,230,12,15,color,3) + ellipse(184,252,11,13,color,3) + ellipse(183,274,9,12,color,3); break;
    case 'spiky': art=path('M182 148 L169 119 L187 116 L178 89 L209 97 L210 67 L239 88 L253 56 L273 86 L300 64 L302 95 L333 87 L320 116 L342 119 L327 148 L302 124 L275 133 L251 116 L226 135 L204 126 Z',color); break;
    case 'balding': art=path('M185 159 Q168 117 195 103 L213 94 L208 111 L194 130 L202 160 Z',color) + path('M310 99 Q348 121 326 165 L309 156 L320 131 Z',color) + path('M222 90 Q234 67 257 83 Q243 79 240 98','none',5,`stroke="${color}"`); break;
  }
  return group('hair-front',art);
}
function humanBody(c,concept='sticker') {
  const skin=c.skin, cloth=c.clothingColor;
  let art='';
  art += path('M207 340 L253 341 L248 442 L208 443 L193 434 Z',c.pantsColor) + path('M257 340 L302 340 L320 433 L305 444 L264 444 Z',c.pantsColor);
  art += path('M209 432 L246 433 L246 457 L192 457 Q177 449 209 432 Z',INK,4) + path('M266 433 L303 432 Q336 451 320 457 L266 457 Z',INK,4);
  art += path('M231 232 L231 263 L279 263 L279 231 Z',skin,5);
  art += path('M225 251 Q252 266 284 250 L315 270 L320 350 Q259 371 190 350 L195 273 Z',cloth);
  art += path('M198 329 Q235 351 314 334 L316 350 Q257 368 191 349 Z',tone(cloth,INK,.12),0);
  if(c.outfit==='polo'||c.outfit==='shirt') art += path('M224 251 L254 266 L237 280 L216 258 M284 251 L255 266 L273 280 L292 258',CREAM,4) + path('M255 267 L255 296','none',4) + ellipse(254,287,3,3,INK,0) + path('M279 295 L299 295 L297 313 L281 313 Z','none',3);
  if(c.outfit==='suit') art += path('M228 253 L254 347 L286 251 L267 261 L255 284 L241 265 Z',CREAM,4) + path('M233 253 L207 278 L225 292 L215 312 L245 354 M283 253 L309 278 L289 292 L300 312 L262 354','none',4) + path('M250 271 L261 271 L265 284 L258 294 L265 324 L255 333 L246 323 L253 294 L246 284 Z',c.accent,3);
  if(c.outfit==='tracksuit') art += path('M232 251 Q254 274 281 251 M256 269 L256 356','none',4) + path('M210 273 L205 337 M301 273 L309 336','none',4,`stroke="${CREAM}"`) + path('M211 374 L220 428 M287 375 L298 428','none',3,`stroke="${CREAM}"`);
  if(c.outfit==='hoodie') art += path('M221 249 Q228 275 254 273 Q279 274 290 250 L304 265 Q290 293 254 293 Q222 292 208 265 Z',tone(cloth,INK,.17),4) + path('M242 279 L237 311 M266 279 L272 311 M222 320 L285 320 L289 343 L218 343 Z','none',3);
  art += ellipse(185,181,17,24,skin,4) + ellipse(328,181,17,24,skin,4);
  art += path(concept==='angular'?'M196 111 L229 91 L284 94 L318 117 L330 166 L312 215 L287 243 L252 257 L219 244 L191 214 L179 162 Z':'M198 109 Q254 76 311 111 Q332 154 316 207 Q305 246 255 257 Q205 246 193 208 Q176 158 198 109 Z',skin);
  art += path('M202 211 Q212 243 255 248 Q299 242 311 214 Q291 253 256 260 Q217 253 202 211 Z',tone(skin,INK,.10),0);
  return group('body',art);
}

/** A transparent 512-square SVG with individually addressable data-part layers. */
export function renderSprite(definition, {pose='idle', expression, size=512, shadow=false, idPrefix,concept='sticker',blink=0,lookX=0,lookY=0,mouth='auto',art:artStyle='illustrated',reaction} = {}) {
  const c=createCharacter(definition);
  if(!OPTIONS.pose.includes(pose)) throw new RangeError(`Unknown pose: ${pose}`);
  if(expression !== undefined && !OPTIONS.expression.includes(expression)) throw new RangeError(`Unknown expression: ${expression}`);
  if(!Number.isInteger(size)||size<16||size>8192) throw new RangeError('size must be an integer from 16 to 8192.');
  if(!CONCEPTS[concept]) throw new RangeError(`Unknown concept: ${concept}`);
  for(const [key,value] of Object.entries({blink,lookX,lookY})) if(!Number.isFinite(value)||Math.abs(value)>1||(key==='blink'&&value<0)) throw new RangeError(`${key} must be within ${key==='blink'?'0':'-1'} and 1.`);
  if(!['auto','open','flat'].includes(mouth)) throw new RangeError('mouth must be auto, open or flat.');
  const mood=expression ?? (pose==='celebrate'?'smile':c.expression);
  if(artStyle==='illustrated')return renderVectorSprite(c,{pose,expression:mood,reaction,size,idPrefix,concept});
  if(artStyle!=='procedural')throw new RangeError('art must be illustrated or procedural.');
  const cy=c.kind==='human'?177:c.species==='blob'?258:c.species==='moth'?220:218;
  let art='';
  if(c.kind==='human') art=group('hair-back',hairBack(c))+humanBody(c,concept)+hands(c,pose)+hairFront(c)+face(c,mood,cy,{blink,lookX,lookY,mouth})+glasses(c.glasses,c.accent,cy,true)+props(c,pose);
  else art=tail(c.tail,c.color)+wings(c.wings,c.color)+horns(c.horns)+feet(c)+demonBody(c,concept)+demonOutfit(c)+hands(c,pose)+face(c,mood,cy,{blink,lookX,lookY,mouth})+glasses(c.glasses,c.accent,cy,false)+props(c,pose);
  art=enhanceSprite(art,c,{expression:mood,pose,concept,cy,blink,lookX,lookY,mouth});
  const treatment=CONCEPTS[concept];
  if(concept==='squishy') {
    for(const part of ['face','glasses']) art=art.replace(new RegExp(`(<g data-part="${part}" transform=")([^"]*)"`),(_,open,transform)=>`${open}${transform} scale(1.08)"`);
  }
  const scaleX=(c.build==='slim'?.92:c.build==='wide'?1.06:1)*treatment.x;
  const titleId=esc(idPrefix ?? `sprite-${hashSeed(c.id+'-'+pose+'-'+mood).toString(36)}`);
  const label=esc(`${c.name} · ${pose} · ${mood}`);
  const ground=shadow?ellipse(256,465,119,10,INK,0,'opacity=".1"'):'';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512" role="img" aria-labelledby="${titleId}" data-character="${esc(c.id)}" data-pose="${pose}" data-version="${VERSION}" data-concept="${concept}"><title id="${titleId}">${label}</title><g stroke-linecap="${concept==='angular'?'square':'round'}" stroke-linejoin="${concept==='angular'?'bevel':'round'}">${ground}${group('character',art,`translate(256 456) scale(${scaleX} ${treatment.y}) translate(-256 -456)`)}</g></svg>`;
}
