import test from 'node:test';
import assert from 'node:assert/strict';
import {PRESETS,CONCEPTS} from '../src/sprites.mjs';
import {renderDrivenSprite,renderScene,REACTIONS} from '../src/driver.mjs';

test('all sprite concepts and reactions preserve character identity',()=>{
  const character=PRESETS.john,before=JSON.stringify(character);
  for(const concept of Object.keys(CONCEPTS))for(const reaction of Object.keys(REACTIONS)) {
    const svg=renderDrivenSprite(character,{concept,reaction,time:.3});
    assert.ok(svg.includes('data-character="john"'));
    assert.ok(svg.includes(`data-reaction="${reaction}"`));
    assert.ok(!svg.includes('NaN'));assert.ok(!svg.includes('undefined'));
  }
  assert.equal(JSON.stringify(character),before);
});
test('animation is deterministic and controls individual action layers',()=>{
  const character=PRESETS.mothmanager;
  const first=renderDrivenSprite(character,{reaction:'stamping',time:0});
  const impact=renderDrivenSprite(character,{reaction:'stamping',time:.3125});
  assert.notEqual(first,impact);
  assert.equal(impact,renderDrivenSprite(character,{reaction:'stamping',time:.3125}));
  assert.ok(impact.includes('data-frame="stamping"'));
  assert.ok(impact.includes('data-part="character" transform='));
});
test('pose selection and mirroring do not reroll identity',()=>{
  const c=PRESETS.beelzebabs;
  const base=renderDrivenSprite(c,{time:.1});
  const look=renderDrivenSprite(c,{time:.1,reaction:'shocked',flip:true});
  assert.notEqual(base,look);
  assert.ok(look.includes('scale(-1 1)'));
  assert.ok(look.includes('data-character="beelzebabs"'));
  assert.throws(()=>renderDrivenSprite(c,{joints:{fake:1}}),/Joint/);
  assert.throws(()=>renderDrivenSprite(c,{gaze:{x:4}}),/lookX/);
});
test('scene placement and per-slot reactions are independent',()=>{
  const svg=renderScene([PRESETS.mothmanager,PRESETS.john],{scene:'committee',time:.2,slots:[{x:150,state:{reaction:'writing'}},{x:700,state:{reaction:'shocked'}}]});
  assert.ok(svg.includes('data-scene="committee"'));
  assert.ok(svg.includes('data-reaction="writing"'));
  assert.ok(svg.includes('data-reaction="shocked"'));
  assert.ok(svg.includes('x="150"'));assert.ok(svg.includes('x="700"'));
  assert.throws(()=>renderScene([]),/at least one/);
  assert.throws(()=>renderDrivenSprite(PRESETS.greg,{time:Infinity}),/time/);
});
