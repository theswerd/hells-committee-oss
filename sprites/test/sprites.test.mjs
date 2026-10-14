import test from 'node:test';
import assert from 'node:assert/strict';
import {createCharacter,generateRoster,renderSprite,PRESETS,OPTIONS} from '../src/sprites.mjs';

test('a saved definition reproduces the same identity and exact SVG',()=>{
  const character=createCharacter({kind:'human',seed:'sinner-942'});
  const saved=JSON.parse(JSON.stringify(character));
  assert.deepEqual(createCharacter(saved),character);
  assert.equal(renderSprite(saved),renderSprite(character));
  assert.deepEqual(createCharacter({kind:'human',seed:'sinner-942'}),character);
});
test('authored poses alter the acting while preserving the character definition',()=>{
  const c=PRESETS.mothmanager;
  const before=JSON.stringify(c),idle=renderSprite(c),stamp=renderSprite(c,{pose:'stamping'});
  assert.notEqual(stamp,idle);
  assert.ok(stamp.includes('data-archetype="mothmanager"'));
  assert.ok(idle.includes('data-archetype="mothmanager"'));
  assert.ok(stamp.includes('data-frame="stamping"'));
  assert.ok(idle.includes('data-frame="idle"'));
  assert.equal(JSON.stringify(c),before);
});
test('batch generation has unique repeatable identities and feature variety',()=>{
  const roster=generateRoster({kind:'demon',seed:'committee',count:100});
  assert.deepEqual(roster,generateRoster({kind:'demon',seed:'committee',count:100}));
  assert.equal(new Set(roster.map(c=>c.id)).size,100);
  assert.equal(new Set(roster.map(c=>c.species)).size,OPTIONS.species.length);
  const humans=generateRoster({kind:'human',seed:'cases',count:100});
  assert.equal(new Set(humans.map(c=>c.hairStyle)).size,OPTIONS.hairStyle.length);
  assert.ok(new Set(humans.map(c=>c.skin)).size>=5);
});
test('pinned features survive generation of many variants',()=>{
  const roster=generateRoster({kind:'demon',seed:'moth-team',count:32,species:'moth',glasses:'cat-eye',color:'#b997ed'});
  assert.ok(roster.every(c=>c.species==='moth'&&c.glasses==='cat-eye'&&c.color==='#b997ed'));
  assert.ok(new Set(roster.map(c=>c.prop)).size>1);
});
test('invalid art options fail clearly instead of producing broken SVG',()=>{
  assert.throws(()=>createCharacter({species:'dragon'}),/species/);
  assert.throws(()=>createCharacter({color:'url(javascript:1)'}),/six-digit/);
  assert.throws(()=>createCharacter({unknown:true}),/Unknown character option/);
  assert.throws(()=>renderSprite(PRESETS.john,{pose:'levitate'}),/Unknown pose/);
  assert.throws(()=>generateRoster({count:NaN}),/count/);
});
test('labels are escaped and character sprites keep transparent backgrounds',()=>{
  const svg=renderSprite({...PRESETS.john,name:'<script>&"test"</script>'});
  assert.ok(svg.includes('&lt;script&gt;&amp;&quot;test&quot;&lt;/script&gt;'));
  assert.ok(!svg.includes('<script>'));
  assert.ok(!svg.includes('fill="url('));
  assert.ok(!svg.includes('<image'));
  assert.ok(svg.includes('viewBox="0 0 512 512"'));
});
test('all eleven demon archetypes keep their identities across six authored reactions',()=>{
  const demons=Object.values(PRESETS).filter(c=>c.kind==='demon');
  assert.equal(demons.length,11);
  for(const c of demons){
    const poses=['idle','writing','stamping','voting','celebrate','shocked'].map(reaction=>renderSprite(c,{reaction}));
    assert.equal(new Set(poses).size,6);
    assert.ok(poses.every(svg=>svg.includes(`data-archetype="${c.id}"`)&&!svg.includes('<image')&&!svg.includes('data:image')));
  }
});
