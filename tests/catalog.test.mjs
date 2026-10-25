import test from 'node:test';
import assert from 'node:assert/strict';
import { equipment } from '../src/data.ts';
import { useTwin } from '../src/store.ts';
import source from '../src/equipment-source.json' with {type:'json'};

test('all source equipment and point records are preserved including auxiliaries and unnumbered points',()=>{
  assert.equal(equipment.length,232);
  assert.equal(equipment.filter(e=>e.isMain).length,68);
  assert.equal(equipment.filter(e=>!e.isMain).length,164);
  assert.equal(equipment.flatMap(e=>e.points).length,533);
  assert.equal(equipment.flatMap(e=>e.points).filter(p=>!p.code).length,1);
  for(const row of source.records) {
    const e=equipment.find(e=>e.id===row.id);
    assert.ok(e);
    for(const key of Object.keys(row)) assert.deepEqual(e[key],row[key],`${e.id} ${key}`);
  }
});
test('ambiguous source identities and point codes never overwrite separate source associations',()=>{
  const tagRecords=equipment.filter(e=>e.tag==='D2Q2');
  assert.equal(tagRecords.length,2);
  assert.notEqual(tagRecords[0].id,tagRecords[1].id);
  const refs=equipment.flatMap(e=>e.points.filter(p=>p.code==='HF.P224_Show_1').map(p=>({e,p})));
  assert.equal(refs.length,2);
  assert.notEqual(refs[0].e.id,refs[1].e.id);
  assert.ok(refs.every(r=>r.p.duplicateCode));
});
test('click inspection and close preserve camera request, scene, floor, filters and history in every viewing mode',()=>{
  for(const mode of ['complete','single','explode','interior','structure','clip']) {
    useTwin.setState({site:'P1_TOWER', floor:'L03_EL+13.000',mode,focus:12,line:'2',module:'monitor',history:true,minute:23,selected:null,inspection:null});
    const before=useTwin.getState();
    useTwin.getState().inspect('XL1-R130');
    const after=useTwin.getState();
    assert.equal(after.inspection,'XL1-R130');
    assert.equal(after.selected,'XL1-R130');
    for(const k of ['site','floor','mode','focus','line','module','history','minute','layers']) assert.deepEqual(after[k],before[k]);
    useTwin.getState().set({inspection:null});
    assert.equal(useTwin.getState().focus,12);
  }
});
test('explicit locate closes popup and requests camera movement to the correct floor',()=>{
  useTwin.getState().inspect('XL1-R130');
  const previous=useTwin.getState().focus;
  useTwin.getState().locate('XL1-R130');
  const s=useTwin.getState();
  assert.equal(s.focus,previous+1);
  assert.equal(s.mode,'single');
  assert.equal(s.floor,'L03_EL+13.000');
  assert.equal(s.site,'P1_TOWER');
  assert.equal(s.inspection,null);
});
