/** Illustrated vector parts. Every mark below is geometry, not a bitmap.
 * The semantic layers match the reaction rig in driver.mjs.
 */
const ART_INK='#271334',ART_CREAM='#fff6df';
const ip=(d,fill='none',weight=5,stroke=ART_INK)=>`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${weight}"/>`;
const ie=(x,y,rx,ry,fill,weight=4)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${ART_INK}" stroke-width="${weight}"/>`;
const ig=(part,content,transform='')=>`<g data-part="${part}"${transform?` transform="${transform}"`:''}>${content}</g>`;
function itone(hex,target=ART_INK,amount=.18){return '#'+[1,3,5].map(i=>Math.round(parseInt(hex.slice(i,i+2),16)*(1-amount)+parseInt(target.slice(i,i+2),16)*amount).toString(16).padStart(2,'0')).join('');}
function replaceArt(svg,part,content){
  const match=new RegExp(`<g data-part="${part}"[^>]*>`).exec(svg);if(!match)return svg;
  const start=match.index+match[0].length;
  const tags=/<g\b[^>]*>|<\/g>/g;tags.lastIndex=start;let depth=1,tag;
  while((tag=tags.exec(svg))){depth+=tag[0].startsWith('</')?-1:1;if(depth===0)return svg.slice(0,start)+content+svg.slice(tag.index);}
  throw new Error(`Unclosed art layer: ${part}`);
}
function inkEye(x,y,expression,color,{lookX=0,lookY=0,blink=0}={},side=0){
  if(blink>.78)return ip(`M${x-24} ${y} Q${x} ${y+14} ${x+24} ${y-1}`,'none',4.5);
  const sleepy=expression==='sleepy',lidded=sleepy||expression==='smug'||expression==='neutral';
  const high=expression==='shocked'?29:22;
  let art=ip(`M${x-25} ${y+2} Q${x-22} ${y-high-5} ${x} ${y-high} Q${x+25} ${y-high+1} ${x+25} ${y+4} Q${x+18} ${y+27} ${x} ${y+25} Q${x-22} ${y+24} ${x-25} ${y+2} Z`,ART_CREAM,4.5);
  const px=x+(expression==='smug'?8:side*2)+lookX*6,py=y+3+lookY*5;
  art+=ie(px,py,8,expression==='shocked'?15:13,ART_INK,0)+ie(px+3,py-5,2.8,4,'#ffffff',0);
  if(lidded){const lid=sleepy?y+(side?8:2):y-(side?0:4);art+=ip(`M${x-25} ${lid} Q${x} ${lid+5} ${x+25} ${lid-2} Q${x+26} ${y-high-3} ${x} ${y-high-4} Q${x-27} ${y-high-2} ${x-25} ${lid} Z`,color,4);}
  art+=ip(`M${x-20} ${y+28} Q${x} ${y+32} ${x+15} ${y+26}`,'none',2.5);
  return art;
}
function richFace(c,expression,controls){
  const human=c.kind==='human',species=c.species,color=human?c.skin:c.color;
  const shade=itone(color,ART_INK,.12),light=itone(color,'#ffffff',.16);
  let art='';
  if(human){
    // Adult caricature: asymmetric lids, cheek folds, a prominent curved nose.
    art=inkEye(-32,0,expression,color,controls,0)+inkEye(33,-3,expression,color,controls,1);
    art+=ip('M-60 19 Q-55 36 -36 38 M37 36 Q58 27 58 13','none',2.5);
    art+=ip('M9 -1 Q12 12 24 19 Q39 22 25 32 Q14 37 2 29',light,3.5)+ip('M10 31 Q18 32 24 28','none',2);
    art+=ip(expression==='angry'?'M-57 -30 L-13 -17 M13 -19 L58 -35':'M-57 -31 Q-37 -43 -15 -31 M14 -36 Q34 -52 58 -38','none',7);
    art+=ip('M-50 47 Q-47 58 -34 61 M32 51 Q36 42 43 41','none',2.5);
    if(expression==='shocked')art+=ip('M-14 51 Q3 37 20 49 Q31 76 7 87 Q-18 79 -14 51 Z',ART_INK,4)+ip('M-7 53 Q5 50 18 52 L17 61 L-6 61 Z',ART_CREAM,0)+ie(5,78,12,6,'#fa416b',0);
    else if(expression==='smile')art+=ip('M-35 40 Q0 60 40 33 Q39 78 6 80 Q-19 75 -35 40 Z',ART_INK,4)+ip('M-26 45 Q4 58 32 42 L30 56 Q6 66 -19 57 Z',ART_CREAM,1.5)+ip('M-13 67 Q9 59 22 73 Q4 83 -13 67 Z','#fa416b',0);
    else art+=ip(expression==='angry'?'M-28 56 Q1 36 31 53 L28 64 L-23 67 Z':'M-32 49 Q-6 67 30 45 Q23 67 -5 67','none',4)+ip('M-5 73 Q12 79 24 68','none',2);
    if(c.facialHair==='moustache')art+=ip('M2 37 Q-22 29 -35 47 Q-10 57 2 42 Q21 54 38 43 Q24 29 4 37 Z',c.hairColor,2.5);
    if(c.facialHair==='beard')art+=ip('M-40 45 L-34 71 L-23 68 L-15 83 L0 95 L19 81 L31 72 L40 42 Q29 56 11 50 L2 64 L-11 51 Q-31 57 -40 45 Z',c.hairColor,3);
  }else{
    const sleepy=species==='blob'&&expression==='sleepy';
    art=inkEye(-34,0,sleepy?'sleepy':expression,color,controls,0)+inkEye(35,species==='bat'?-5:species==='blob'?5:-1,sleepy?'sleepy':expression,color,controls,1);
    if(expression==='angry')art+=ip('M-63 -33 Q-35 -29 -10 -14 M13 -15 Q34 -32 64 -36','none',8);
    else if(expression==='shocked')art+=ip('M-62 -39 Q-34 -62 -14 -39 M15 -40 Q38 -63 62 -35','none',6);
    else art+=ip(species==='blob'?'M-60 -34 Q-40 -43 -19 -33 M18 -25 Q38 -31 62 -20':species==='bat'?'M-62 -33 Q-38 -52 -15 -34 M13 -40 Q39 -56 62 -37':'M-60 -34 Q-38 -45 -13 -33 M14 -36 Q36 -48 63 -30','none',6);
    if(species==='moth'){
      art+=ip('M-62 29 L-48 40 L-51 54 L-35 51 L-31 66 L-13 58 L1 73 L16 59 L31 66 L38 49 L52 54 L51 38 L65 27',light,0);
      art+=ip('M-13 25 L0 14 L15 27 L2 35 Z',shade,2.5);
    }else if(species==='imp'||species==='goat')art+=ip('M-7 24 Q3 17 14 26 L5 35 L-9 29',shade,2.5);
    else art+=ip('M-10 26 Q0 17 11 25 Q5 34 -6 33 Z',shade,0);
    if(expression==='shocked')art+=ip('M-18 47 Q3 31 22 47 L19 74 Q2 91 -18 71 Z',ART_INK,4)+ie(2,73,13,6,'#fa416b',0);
    else if(species==='blob'&&expression==='sleepy')art+=ip('M-16 56 Q10 68 33 49','none',4)+ip('M21 57 L25 67 L31 53',ART_CREAM,2)+ip('M4 73 Q17 75 24 68','none',2);
    else if(expression==='smug'||expression==='neutral')art+=ip('M-30 43 Q-5 65 32 40','none',4)+ip('M-27 40 Q-29 36 -35 39 M27 39 L36 37','none',2.5);
    else {
      const wide=species==='bat'?51:38;
      art+=ip(`M-${wide} 31 Q-3 58 ${wide} 28 Q${wide-3} 80 4 84 Q-${wide-14} 82 -${wide} 31 Z`,ART_INK,4);
      art+=ip(`M-${wide-9} 39 Q0 60 ${wide-8} 36 L${wide-11} 50 Q1 73 -${wide-17} 52 Z`,ART_CREAM,0);
      art+=ip(`M-${wide-13} 41 L-${wide-21} 64 L-${wide-28} 49 M${wide-26} 49 L${wide-17} 61 L${wide-11} 39`,ART_CREAM,2.5);
      art+=ip('M-16 73 Q7 61 25 75 Q8 86 -16 73 Z','#fa416b',0);
      art+=ip('M-2 79 L1 72','none',2);
    }
    art+=ie(-61,27,12,6,itone(color,'#fa416b',.34),0)+ie(62,27,11,6,itone(color,'#fa416b',.34),0);
    if(species==='bat')art+=ip('M-75 12 Q-75 37 -55 43 M54 42 Q77 31 78 11','none',3);
    if(species==='blob')art+=ip('M-69 36 L-58 46 L-65 52 M67 40 L58 50 L64 57','none',2.5);
  }
  if(controls.mouth==='open')art+=ie(0,58,19,23,ART_INK,3)+ie(0,72,11,6,'#fa416b',0);
  return art;
}
function richMothBody(c){
  const col=c.color,shade=itone(col),light=itone(col,'#ffffff',.25);
  let art=ip('M174 179 L166 163 L184 166 L183 145 L199 157 L213 136 L224 149 L244 132 L257 146 L279 132 L291 152 L312 140 L315 160 L337 151 L332 177 Q362 199 361 230 L373 248 L356 251 L366 271 L347 267 Q353 291 339 315 L349 335 L330 331 L334 354 L315 348 L306 379 L290 369 L276 395 L257 384 L240 399 L226 378 L205 387 L199 363 L179 370 L178 345 L158 348 L168 324 L151 322 L162 299 Q145 274 152 251 L137 246 L153 231 Q143 203 174 179 Z',col,6);
  art+=ip('M174 285 L185 300 L186 281 L199 303 L215 284 L224 307 L241 290 L257 310 L271 287 L286 303 L302 283 L309 302 L328 286 L337 315 L322 336 L305 359 L282 379 L259 386 L240 389 L218 373 L203 370 L188 347 L176 323 Z',shade,0);
  art+=ip('M166 199 L184 178 L190 192 L205 169 L217 186 L235 169 L241 191 L258 175 L276 194 L296 174 L302 195 L324 181 L338 200 L323 215 L305 202 L291 217 L271 203 L258 222 L240 208 L224 223 L214 207 L194 219 L189 205 L173 215 Z',light,0);
  art+=ip('M175 253 L187 264 L182 275 M326 247 L339 257 L332 270 M202 344 L213 355 L209 367 M296 334 L285 348 L289 360','none',2.5);
  art+=ig('antennae',ip('M222 158 Q187 83 133 105 M291 154 Q321 79 374 102','none',6)+ip('M145 106 L142 93 M157 104 L158 90 M168 107 L174 94 M181 112 L188 99 M192 122 L201 109 M363 103 L369 89 M351 102 L354 88 M340 104 L340 90 M329 110 L324 96 M318 117 L309 104','none',3)+ie(132,105,6,4,col,3)+ie(376,102,6,4,col,3));
  return art;
}
function richWing(c,left=true){
  const col=c.color,shade=itone(col,ART_INK,.25),light=itone(col,'#ffffff',.24);
  let art;
  if(c.wings==='moth'){
    art=ip('M194 223 Q150 168 105 155 Q65 142 46 165 Q23 199 46 240 Q69 285 141 300 Q90 304 71 337 Q50 370 75 398 Q99 419 134 399 Q182 371 208 298 Z',light,6);
    art+=ip('M192 235 Q133 204 76 168 M190 260 Q117 239 51 210 M181 280 Q114 279 78 271 M192 312 Q138 329 91 380','none',2.5,itone(col,ART_INK,.12));
    art+=ip('M64 190 Q65 177 77 182 Q105 187 114 216 Q124 241 109 249 Q91 254 78 232 Q63 208 64 190 Z',shade,0)+ip('M123 210 Q128 199 139 207 Q157 221 160 236 Q160 250 149 247 Q130 238 123 210 Z',shade,0)+ie(58,214,5,9,shade,0)+ie(114,273,8,5,shade,0)+ie(137,282,6,3,shade,0);
    art+=ip('M91 343 Q90 327 105 329 Q126 334 134 354 Q139 375 124 381 Q106 382 97 364 Z',shade,0)+ie(157,340,6,10,shade,0)+ie(81,371,4,7,shade,0)+ie(105,350,5,10,ART_CREAM,0);
    art+=ip('M74 173 Q87 171 99 180 M42 195 Q45 216 55 226 M79 393 Q94 402 113 390','none',3,'#ffffff');
  }else{
    art=ip('M175 224 Q130 138 54 143 Q28 202 35 291 Q64 250 93 290 Q94 251 126 279 Q130 244 175 263 Z',itone(col,ART_INK,.12),6);
    art+=ip('M58 151 Q108 174 170 257 M58 151 Q48 210 37 282 M58 151 L93 283 M58 151 L127 274','none',4);
    art+=ip('M66 170 L88 257 Q68 236 50 249 L57 184 Z',itone(col,'#fa416b',.22),0)+ip('M78 177 Q107 193 142 234 Q117 227 113 254 Z',itone(col,'#ffffff',.12),0);
    art+=ip('M57 158 Q33 206 37 244','none',3,itone(col,'#ffffff',.30));
  }
  return left?art:`<g transform="translate(512 0) scale(-1 1)">${art}</g>`;
}
function palm(x,y,col,flip=false){
  const art=ip('M-18 5 Q-28 -3 -17 -10 Q-23 -23 -11 -20 Q-13 -34 0 -27 Q5 -37 13 -24 Q24 -29 26 -15 L30 6 Q24 22 8 23 L-6 20 Q-14 23 -18 5 Z',col,4.5)+ip('M-11 -18 L-6 -4 M1 -24 L5 -6 M14 -21 L17 -5 M-16 5 Q-8 -2 0 7','none',2.5);
  return `<g transform="translate(${x} ${y})${flip?' scale(-1 1)':''}">${art}</g>`;
}
function richArms(c,pose){
  const col=c.kind==='human'?c.skin:c.color,shade=itone(col);
  let left,right;
  if(pose==='celebrate'){
    left=ip('M183 300 Q122 284 118 231 Q110 213 126 203 Q144 202 146 225 Q151 259 201 264 Z',col,6)+palm(124,202,col);
    right=`<g transform="translate(512 0) scale(-1 1)">${left}</g>`;
  }else if(c.kind==='human'&&c.prop==='none'&&pose==='idle'){
    left=ip('M205 273 Q171 286 176 310 Q181 333 241 341 L263 329 L256 310 Q219 312 205 291 Z',col,5)+ip('M180 314 Q195 334 233 337 L242 328 Q204 319 197 306 Z',shade,0)+palm(259,321,col);
    right=ip('M304 275 Q337 291 327 318 Q310 340 270 336 L229 324 L237 306 L286 311 Q299 305 288 291 Z',col,5)+palm(228,314,col,true);
  }else{
    const human=c.kind==='human',imp=c.species==='imp'&&c.prop==='none'&&pose==='idle';
    const shoulder=human?201:c.species==='imp'||c.species==='goat'?194:171;
    if(imp)left=ip('M198 316 Q159 299 165 260 L175 242 L194 248 Q184 277 223 292 Z',col,5)+ip('M170 248 Q162 230 176 224 L184 209 Q192 205 196 212 L188 229 L197 223 Q206 225 203 235 L188 254 Z',col,4)+ip('M182 232 L195 235','none',2.5);
    else left=ip(`M${shoulder+9} 282 Q${shoulder-39} 305 ${shoulder-21} 340 Q${shoulder-1} 366 ${shoulder+53} 350 L${shoulder+51} 326 Q${shoulder+8} 345 ${shoulder+1} 328 Q${shoulder+4} 311 ${shoulder+27} 302 Z`,col,6)+palm(shoulder+45,338,col)+ip(`M${shoulder-14} 326 Q${shoulder-6} 346 ${shoulder+22} 348`,'none',2.5);
    if(pose==='stamping')right=ip('M320 306 Q365 283 359 245 L378 237 Q402 301 339 337 Z',col,6)+palm(366,235,col,true);
    else if(pose==='writing')right=ip('M322 288 Q375 306 347 340 L321 350 L304 331 Q338 324 315 304 Z',col,6)+palm(316,335,col,true);
    else if(c.species==='bat'&&c.kind==='demon'&&c.prop==='none')right=ip('M339 285 Q380 278 397 254 L418 274 Q397 309 353 319 Z',col,6)+ip('M396 258 Q396 245 410 243 L446 238 Q456 238 457 247 Q456 253 442 256 L423 261 Q435 260 439 269 Q441 279 430 283 Q421 299 407 291 L398 285 Z',col,4.5)+ip('M423 261 L414 275 M430 273 L421 284','none',2.5);
    else right=ip('M322 287 Q368 302 355 339 Q347 360 310 356 L297 338 L311 327 Q330 341 331 327 L312 309 Z',col,6)+palm(307,343,col,true);
  }
  return {left,right};
}
function richBatBody(c){
  const col=c.color,shade=itone(col),light=itone(col,'#ffffff',.20);
  return ip('M179 154 Q158 136 144 153 Q128 161 140 190 Q114 216 124 255 Q101 288 114 345 Q123 383 164 411 Q205 438 260 433 Q328 438 365 404 Q401 375 399 321 Q400 281 377 254 Q388 218 366 190 Q378 160 361 150 Q345 139 330 155 Q298 133 252 140 Q211 132 179 154 Z',col,6)+ip('M146 283 Q160 377 244 396 Q344 409 375 345 Q383 393 347 414 Q300 445 233 432 Q158 420 133 378 Q114 334 124 308 Z',shade,0)+ip('M157 178 Q191 144 228 151 L233 162 Q188 157 166 186 Z',light,0)+ip('M145 218 Q140 242 153 259 M362 211 Q373 234 360 253 M180 393 Q207 410 234 411','none',2.5)+ip('M145 170 L163 177 L157 192 Z M349 169 L339 183 L351 192 Z',shade,0);
}
function richBlobBody(c){
  const col=c.color,shade=itone(col),light=itone(col,'#ffffff',.20);
  return ip('M176 186 L189 169 L206 174 L220 153 L234 166 L252 150 L271 167 L295 157 L301 175 L323 169 L327 190 L350 192 L344 211 Q380 239 385 281 L399 291 L387 308 L407 324 L393 341 Q417 365 402 388 L413 399 L391 407 Q380 433 354 430 L341 441 L322 433 Q298 447 279 433 L256 442 L235 431 Q211 445 192 429 L169 436 L161 423 Q137 431 122 409 L104 411 L113 391 Q99 369 113 345 L99 334 L117 316 Q112 274 139 237 L131 221 L150 218 L147 198 L167 200 Z',col,6)+ip('M119 350 L139 368 L134 384 L157 384 L159 403 L185 396 L199 417 L219 404 L240 424 L260 412 L280 425 L299 410 L321 420 L337 404 L360 409 L370 391 L390 377 Q404 401 381 424 L355 437 L326 440 L302 440 L280 443 L256 446 L232 438 L205 441 L176 433 L148 428 L123 411 Z',shade,0)+ip('M167 227 L178 206 L190 212 L201 189 L215 200 L229 181 L239 197 L253 185 L272 204 L288 190 L303 209 L321 199 L325 219 L311 229 L289 215 L276 231 L255 217 L241 231 L221 216 L206 233 L189 221 L176 238 Z',light,0)+ip('M149 255 L158 264 L154 274 M352 245 L343 257 L350 268 M141 385 L151 397 M366 365 L376 373 M204 424 L218 419','none',2.5);
}
function richOutfit(c){
  if(c.kind==='human'||c.outfit==='none')return null;
  const imp=c.species==='imp'||c.species==='goat',y=imp?299:315;
  let art='';
  if(c.outfit==='waistcoat')art=ip(`M203 ${y-13} L254 ${y+8} L310 ${y-14} L321 ${y+69} L266 ${y+91} L250 ${y+72} L225 ${y+87} L190 ${y+62} Z`,'#382740',5)+ip(`M207 ${y+3} L234 ${y+64} L225 ${y+70} M302 ${y+1} L279 ${y+72}`,'none',2.5,'#765576');
  art+=ip(`M216 ${y-13} Q253 ${y+11} 292 ${y-15} L277 ${y+21} L255 ${y+7} L236 ${y+26} Z`,ART_CREAM,4);
  art+=ip(`M249 ${y+6} L263 ${y+7} L268 ${y+20} L260 ${y+31} L276 ${y+64} L257 ${y+81} L239 ${y+66} L253 ${y+31} L244 ${y+18} Z`,c.accent,4)+ip(`M252 ${y+36} L251 ${y+58} M248 ${y+12} L260 ${y+13}`,'none',2,itone(c.accent));
  if(c.outfit==='waistcoat')art+=ie(264,y+71,3.5,3.5,'#f4d544',1.5);
  return art;
}
function wingDetails(c){return richWing(c,true);}
function humanDetails(c){
  let art=ip('M214 351 L213 427 M288 350 L303 426 M217 376 L229 365 M286 376 L273 364 M209 441 L238 441 M276 441 L307 441','none',2.5);
  art+=ip('M188 181 Q196 169 203 183 Q200 197 193 197 M314 181 Q320 172 326 186','none',2.5,itone(c.skin));
  art+=ip('M201 290 L210 299 M296 289 L287 299 M226 346 L239 349 M284 347 L269 351','none',2.5);
  if(c.outfit==='suit')art+=ip('M293 307 L309 305 L309 322 L295 323 Z','none',2.5)+ip('M300 307 L304 297 L308 306',ART_CREAM,2);
  return art;
}
export function enhanceSprite(svg,c,{expression,pose,concept,cy,blink,lookX,lookY,mouth}){
  const controls={blink,lookX,lookY,mouth};
  svg=replaceArt(svg,'face',richFace(c,expression,controls));
  const arms=richArms(c,pose);svg=replaceArt(svg,'arm-left',arms.left);svg=replaceArt(svg,'arm-right',arms.right);
  if(c.kind==='demon'){
    if(c.species==='moth')svg=replaceArt(svg,'body',richMothBody(c));
    if(c.species==='bat'&&concept!=='angular')svg=replaceArt(svg,'body',richBatBody(c));
    if(c.species==='blob'&&concept!=='angular')svg=replaceArt(svg,'body',richBlobBody(c));
    if(c.wings!=='none'){svg=replaceArt(svg,'wing-left',richWing(c,true));svg=replaceArt(svg,'wing-right',richWing(c,false));}
    const outfit=richOutfit(c);if(outfit!==null)svg=replaceArt(svg,'outfit',outfit);
  }else{
    // Clothing seams and adult face folds share the body layer and its motion.
    const marker=/<g data-part="body"[^>]*>/;
    svg=svg.replace(marker,match=>match+humanDetails(c));
    svg=replaceArt(svg,'hair-front',richHair(c));
  }
  return svg;
}
function richHair(c){
  const col=c.hairColor,light=itone(col,'#ffffff',.20);
  if(c.hairStyle==='quiff')return ip('M187 162 Q174 152 184 136 Q171 124 182 108 Q170 93 190 87 Q188 69 211 72 Q221 52 238 65 Q272 43 290 59 Q319 47 326 71 Q344 83 331 107 Q334 127 308 137 Q290 145 276 127 L267 113 Q253 134 230 132 Q212 153 202 139 L203 164 Z',col,5)+ip('M200 101 Q222 79 246 91 Q268 69 299 78 M211 117 Q229 101 249 104 M275 93 Q302 88 318 80','none',2.5,light)+ip('M190 133 Q197 135 205 126 M290 119 Q307 126 319 111','none',2.5);
  if(c.hairStyle==='curls')return ip('M183 144 Q158 135 173 115 Q159 93 184 89 Q178 66 200 71 Q207 48 228 63 Q243 40 261 62 Q285 40 299 68 Q330 53 331 83 Q356 88 342 109 Q351 132 326 144 L310 128 Q289 147 274 126 Q254 145 239 127 Q218 147 204 129 L195 148 Z',col,5)+ip('M180 112 Q186 94 202 108 Q203 88 217 94 M224 79 Q240 72 249 89 M263 82 Q281 69 294 87 M306 97 Q321 84 331 101 M210 119 Q220 107 229 115 M285 116 Q299 104 310 117','none',2.5,light);
  if(c.hairStyle==='balding')return ip('M186 162 Q170 143 178 121 Q184 104 204 101 L216 88 L215 108 L204 123 L199 159 Z',col,5)+ip('M308 102 Q342 114 335 141 L325 164 L309 153 L320 132 Z',col,5)+ip('M224 86 Q243 65 261 85 M229 97 Q246 86 254 101','none',4,col)+ip('M187 117 L194 113 M184 135 L191 127 M321 118 L327 129','none',2.5,light);
  if(c.hairStyle==='bob')return ip('M181 144 Q173 85 239 75 Q302 64 327 98 L334 141 L313 127 L302 144 L286 123 L273 142 L253 119 L236 141 L221 117 L208 139 L194 154 Z',col,5)+ip('M192 109 Q203 87 229 92 M258 91 Q292 84 310 112 M222 122 L228 101 M286 127 L288 106','none',2.5,light);
  if(c.hairStyle==='spiky')return ip('M181 157 L165 133 L179 120 L169 98 L193 103 L193 75 L219 95 L230 61 L252 84 L270 58 L284 90 L313 66 L309 101 L337 91 L327 118 L345 130 L327 156 L308 136 L288 145 L269 127 L247 143 L228 129 L210 145 L195 132 Z',col,5)+ip('M200 116 L218 105 L214 123 M243 115 L258 96 L267 116 M295 112 L310 102','none',2.5,light);
  return ip('M182 148 Q169 79 249 72 Q329 69 337 116 L326 147 L307 129 L297 107 L282 127 L270 106 L252 129 L238 104 L221 126 L206 110 L195 152 Z',col,5)+ip('M195 102 Q225 83 250 88 M202 119 Q223 98 249 98 M267 88 Q301 89 323 120 M278 106 L295 114','none',2.5,light)+[221,243,264,283].map(y=>ie(184,y,11,13,col,3)).join('');
}
