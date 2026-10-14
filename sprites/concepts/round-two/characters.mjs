import { CONCEPT_ART } from './compiled-concepts.mjs'

export const CONCEPT_IDS = Object.freeze(Object.keys(CONCEPT_ART))
export const CONCEPTS = Object.freeze(Object.fromEntries(CONCEPT_IDS.map(id => [id,
  Object.freeze({ id, name: CONCEPT_ART[id].name, group: CONCEPT_ART[id].group, states: ['idle'] })])))

function color(value) {
  if (typeof value !== 'string' || !/^#[0-9a-f]{6}$/i.test(value)) throw new TypeError('Palette colors must be six-digit hex values.')
  return value
}
function rgb(hex) { return [1,3,5].map(i => parseInt(hex.slice(i,i+2),16) / 255) }
function hsv([r,g,b]) {
  const max = Math.max(r,g,b), min = Math.min(r,g,b), delta = max - min
  let h = delta === 0 ? 0 : max === r ? ((g-b)/delta)%6 : max === g ? (b-r)/delta+2 : (r-g)/delta+4
  h = ((h/6)%1+1)%1
  return [h, max === 0 ? 0 : delta/max, max]
}
function hex([h,s,v]) {
  const c = v*s, x = c*(1-Math.abs((h*6)%2-1)), m = v-c
  const [r,g,b] = h < 1/6 ? [c,x,0] : h < 2/6 ? [x,c,0] : h < 3/6 ? [0,c,x] : h < 4/6 ? [0,x,c] : h < 5/6 ? [x,0,c] : [c,0,x]
  return '#'+[r,g,b].map(n => Math.round((n+m)*255).toString(16).padStart(2,'0')).join('')
}
function tint(fill, target) {
  const [,s,v] = hsv(rgb(fill)), [h,ts,tv] = hsv(rgb(target))
  return hex([h, Math.min(1,s*.45+ts*.55), Math.min(1,v*(.8+tv*.35))])
}
function finite(value, fallback, min, max) {
  if (value === undefined) return fallback
  if (!Number.isFinite(value) || value < min || value > max) throw new RangeError(`Value must be between ${min} and ${max}.`)
  return value
}

/** Render one idle study as pure vector SVG. Winners receive authored acting poses later. */
export function renderConcept(id, { body, accent, size = 512, tilt = 0, flip = false, state = 'idle' } = {}) {
  const character = CONCEPT_ART[id]
  if (!character) throw new RangeError(`Unknown concept: ${id}`)
  if (state !== 'idle') throw new RangeError('Casting studies currently provide only the idle state.')
  if (body !== undefined) body = color(body)
  if (accent !== undefined) accent = color(accent)
  size = finite(size,512,16,4096)
  tilt = finite(tilt,0,-20,20)
  const [left,top,right,bottom] = character.bounds
  const radians = tilt*Math.PI/180, cos = Math.cos(radians), sin = Math.sin(radians)
  const corners = [[left,top],[right,top],[left,bottom],[right,bottom]].map(([x,y]) => [
    256+(x-256)*cos-(y-479)*sin, 479+(x-256)*sin+(y-479)*cos,
  ])
  const minX = Math.min(0,...corners.map(([x])=>x-6)), minY = Math.min(0,...corners.map(([,y])=>y-6))
  const maxX = Math.max(512,...corners.map(([x])=>x+6)), maxY = Math.max(512,...corners.map(([,y])=>y+6))
  const viewBox = [minX,minY,maxX-minX,maxY-minY].map(n=>Number(n.toFixed(3))).join(' ')
  const name = character.name.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;')
  const paths = character.paths.map(path => {
    const target = path.role === 'body' ? body : path.role === 'accent' ? accent : undefined
    const fill = target ? tint(path.fill,target) : path.fill
    return `<path data-palette="${path.role}" fill="${fill}" d="${path.d}" transform="${path.transform}"/>`
  }).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${viewBox}" role="img" aria-label="${name}" data-concept="${id}" data-state="idle"><title>${name} — idle concept study</title><g transform="rotate(${tilt} 256 479) ${flip ? 'translate(512 0) scale(-1 1)' : ''}"><g transform="${character.transform}">${paths}</g></g></svg>`
}

/** Place multiple individually driven concepts into a scene with explicit SVG transforms. */
export function renderConceptScene(characters, { width = 1280, height = 720, background = '#fff2d2' } = {}) {
  width = finite(width,1280,64,8192)
  height = finite(height,720,64,8192)
  background = color(background)
  if (!Array.isArray(characters) || characters.length > 20) throw new TypeError('Provide at most twenty character configurations.')
  const cast = characters.map(({ id, x = 0, y = 0, size = 280, ...options }) => {
    x = finite(x,0,-8192,8192)
    y = finite(y,0,-8192,8192)
    const svg = renderConcept(id,{...options,size}).replace('<svg ','<svg x="'+x+'" y="'+y+'" ')
    return svg
  }).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Demon concept scene"><rect width="${width}" height="${height}" fill="${background}"/>${cast}</svg>`
}
