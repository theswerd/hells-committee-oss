import test from 'node:test';
import assert from 'node:assert/strict';
import {ART_LIBRARY} from '../src/compiled-art.mjs';
import {PRESETS,createCharacter,renderSprite} from '../src/sprites.mjs';
import {renderDrivenSprite} from '../src/driver.mjs';
import {CONCEPT_ART} from '../concepts/round-two/compiled-concepts.mjs';

test('the three selected opening portraits retain every approved contour',()=>{
  for(const id of ['gus','norm','dot']){
    const idle=ART_LIBRARY[id].frames.find(frame=>frame.name==='idle');
    assert.equal(idle.approvedSourceHash,CONCEPT_ART[id].sourceHash);
    assert.deepEqual(idle.paths.map(path=>path.d),CONCEPT_ART[id].paths.map(path=>path.d));
    for(const reaction of ['writing','stamping','voting','celebrate','shocked'])assert.ok(renderDrivenSprite(PRESETS[id],{reaction}).includes(`data-frame="${reaction}"`));
  }
});

test('illustrated library contains fourteen consistent six-pose vector archetypes',()=>{
  assert.equal(Object.keys(ART_LIBRARY).length,14);
  for(const [key,asset] of Object.entries(ART_LIBRARY)) {
    assert.equal(asset.frames.length,6,key);
    assert.equal(new Set(asset.frames.map(f=>f.name)).size,6);
    for(const frame of asset.frames){assert.ok(frame.paths.length>100);assert.ok(frame.paths.some(p=>p.d.includes('C')));}
  }
});
test('illustrated exports contain geometry without embedded raster assets',()=>{
  for(const c of Object.values(PRESETS)){
    const svg=renderSprite(c);
    assert.ok(svg.includes('data-art="illustrated"'));
    assert.ok(!svg.includes('<image'));assert.ok(!svg.includes('data:image'));assert.ok(!svg.includes('href="http'));
    assert.ok(svg.includes(`data-archetype="${c.archetype}"`));
  }
});
test('palette variants change the paint while retaining the same authored curve geometry',()=>{
  const original=PRESETS.mothmanager;
  const variant=createCharacter({...original,color:'#49bfbc',accent:'#ff8634'});
  const before=renderSprite(original),after=renderSprite(variant);
  assert.notEqual(before,after);
  assert.deepEqual([...before.matchAll(/ d="([^"]+)"/g)].map(m=>m[1]),[...after.matchAll(/ d="([^"]+)"/g)].map(m=>m[1]));
});
test('human and demon action states select the matching authored poses',()=>{
  assert.ok(renderDrivenSprite(PRESETS.john,{reaction:'embarrassed'}).includes('data-frame="embarrassed"'));
  assert.ok(renderDrivenSprite(PRESETS.mothmanager,{reaction:'voting'}).includes('data-frame="voting"'));
});
test('closed human mouths survive palette changes and follow the selected pose',()=>{
  for(const key of ['john','maya','brad']) {
    const original=PRESETS[key];
    const variant=createCharacter({...original,skin:'#6b351f',hairColor:'#663baa',clothingColor:'#41884d'});
    const mouth=svg=>svg.match(/<g data-part="mouth"[\s\S]*?<\/g>/)?.[0];
    const poses=[];
    for(const reaction of ['idle','embarrassed']) {
      const before=renderDrivenSprite(original,{reaction});
      const after=renderDrivenSprite(variant,{reaction,flip:true,time:1.4});
      assert.ok(mouth(before),`${key}/${reaction} has visible mouth ink`);
      assert.equal(mouth(before),mouth(after),`${key}/${reaction} mouth cannot become a skin color`);
      assert.ok(before.includes(`data-frame="${reaction}"`));
      poses.push(mouth(before));
    }
    assert.notEqual(poses[0],poses[1],`${key} mouth follows its authored face tilt`);
    // Open-mouth poses retain their authored teeth/tongue, without a closed
    // smile painted over them.
    for(const reaction of ['talking','angry','celebrate','shocked']) {
      assert.equal(mouth(renderDrivenSprite(original,{reaction})),undefined);
    }
  }
});

test('Maya eyes and ear retain their authored contours across all reactions and hair palettes',()=>{
  const original=PRESETS.maya;
  const differentHair=createCharacter({...original,hairColor:'#ffd760'});
  const differentSkin=createCharacter({...original,skin:'#734630'});
  const details=svg=>svg.match(/<g data-part="face-details"[\s\S]*?<\/g><\/g>/)?.[0];
  const part=(svg,name)=>svg.match(new RegExp(`<g data-part="${name}">[\\s\\S]*?<\\/g>`))?.[0];
  const poses=new Set();
  const clipIds=new Set();
  for(const reaction of ['idle','talking','angry','embarrassed','celebrate','shocked']) {
    const before=renderDrivenSprite(original,{reaction});
    assert.equal((before.match(/data-part="eye-/g)??[]).length,2,reaction);
    assert.ok(before.includes('data-part="ear-right"'),reaction);
    for(const name of ['eye-right','eye-left','ear-right'])assert.ok(part(before,name)===part(renderDrivenSprite(differentHair,{reaction}),name),`${reaction}: hair color cannot paint ${name}`);
    assert.notEqual(part(before,'ear-right'),part(renderDrivenSprite(differentSkin,{reaction}),'ear-right'),`${reaction}: ear folds follow the skin palette`);
    poses.add(details(before));
    for(const match of before.matchAll(/<clipPath id="([^"]+)"/g))clipIds.add(match[1]);
  }
  assert.equal(poses.size,6,'facial geometry follows the acting and head tilt');
  assert.equal(clipIds.size,22,'hair, palette and replacement clips do not collide between poses');
});

test('repaired Maya faces replace the traced face instead of overlapping its old features',()=>{
  for(const reaction of ['angry','celebrate']) {
    const svg=renderDrivenSprite(PRESETS.maya,{reaction});
    assert.ok(svg.includes('data-face-replacement="complete"'));
    assert.ok(svg.match(/data-part="traced-body" clip-path="url\(#[^"]+-body\)"/));
    assert.ok(svg.includes('data-source="reference-vector"'));
    assert.ok(!svg.includes('data-source="authored-curves"'));
    assert.equal((svg.match(/data-part="eye-/g)??[]).length,2);
  }
});
