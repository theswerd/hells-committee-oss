import test from 'node:test'
import assert from 'node:assert/strict'
import { CONCEPT_ART } from '../concepts/round-two/compiled-concepts.mjs'
import { CONCEPT_IDS, CONCEPTS, renderConcept, renderConceptScene } from '../concepts/round-two/characters.mjs'

test('Twelve separate casting studies retain authored idle geometry without raster embeds', () => {
  assert.equal(CONCEPT_IDS.length,12)
  assert.equal(new Set(CONCEPT_IDS).size,12)
  const signatures = new Set()
  for (const id of CONCEPT_IDS) {
    assert.deepEqual(CONCEPTS[id].states,['idle'])
    const svg = renderConcept(id)
    assert.doesNotMatch(svg, /<image|data:image|<foreignObject/)
    assert.ok(CONCEPT_ART[id].paths.length > 400)
    assert.equal((svg.match(/<path /g) ?? []).length,CONCEPT_ART[id].paths.length)
    const [,top,right,bottom] = CONCEPT_ART[id].bounds
    assert.ok(top >= 20 && right <= 492 && bottom <= 480)
    signatures.add(CONCEPT_ART[id].paths[0].d)
  }
  assert.equal(signatures.size,12)
})

test('Palette edits and mirrored scene placement preserve every authored contour', () => {
  const original = renderConcept('edgar')
  const variant = renderConcept('edgar',{body:'#588ac4',accent:'#8c465f',flip:true,tilt:4})
  const contours = svg => [...svg.matchAll(/\sd="([^"]+)"/g)].map(match => match[1])
  assert.deepEqual(contours(variant),contours(original))
  assert.notEqual(variant,original)
  const fixedFills = svg => [...svg.matchAll(/data-palette="fixed" fill="([^"]+)"/g)].map(match => match[1])
  assert.deepEqual(fixedFills(variant),fixedFills(original))
  const cast = renderConceptScene(CONCEPT_IDS.slice(0,8).map((id,i)=>({id,x:i*145,y:200,size:220})))
  assert.equal((cast.match(/data-concept=/g) ?? []).length,8)
  // Extreme allowed tilt expands the output frame to keep horns, fur and feet.
  for (const id of CONCEPT_IDS) for (const tilt of [-20,20]) {
    const svg=renderConcept(id,{tilt,flip:true})
    const [x,y,width,height]=svg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number)
    const [left,top,right,bottom]=CONCEPT_ART[id].bounds
    const radians=tilt*Math.PI/180
    for (const [cx,cy] of [[left,top],[right,top],[left,bottom],[right,bottom]]) {
      const rx=256+(cx-256)*Math.cos(radians)-(cy-479)*Math.sin(radians)
      const ry=479+(cx-256)*Math.sin(radians)+(cy-479)*Math.cos(radians)
      assert.ok(rx>=x && rx<=x+width && ry>=y && ry<=y+height)
    }
  }
})

test('Concept controls reject unavailable acting states and unsafe render parameters', () => {
  assert.throws(()=>renderConcept('edgar',{state:'celebrate'}),/only the idle state/)
  assert.throws(()=>renderConcept('greg'),/Unknown concept/)
  assert.throws(()=>renderConcept('dot',{body:'url(https://example.com)'}),/hex/)
  assert.throws(()=>renderConcept('norm',{tilt:NaN}),/between/)
  assert.throws(()=>renderConceptScene([],{background:'<script>'}),/hex/)
})
