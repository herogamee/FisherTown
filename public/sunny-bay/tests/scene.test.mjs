import test from 'node:test';
import assert from 'node:assert/strict';
import {SunnyBayScene} from '../scene.js';
const noOp=()=>{};
function fakeCtx(){
 const out={createLinearGradient:()=>({addColorStop:noOp}),createRadialGradient:()=>({addColorStop:noOp})};
 return new Proxy(out,{get:(obj,key)=>key in obj?obj[key]:noOp,set:(obj,key,v)=>{obj[key]=v;return true;}});
}
function fakeCanvas(){
 const context=fakeCtx();
 return {width:0,height:0,style:{},parentElement:{getBoundingClientRect:()=>({width:390,height:650})},getContext:()=>context};
}
globalThis.ResizeObserver=class{observe(){}disconnect(){}};
globalThis.Image=class{constructor(){this.complete=true;this.naturalWidth=200;this.naturalHeight=90;this.decoding='async'}set src(value){this.uri=value}};
globalThis.window={devicePixelRatio:1.5,matchMedia:()=>({matches:false})};
const animals=[
 {id:'tuna',sprite:'yellowfin-tuna',power:.83,bait:'small-fish',size:[35,90]},
 {id:'snapper',sprite:'red-snapper',power:.5,bait:'worm',size:[12,55]},
 {id:'trevally',sprite:'silver-trevally',power:.8,bait:'spinner',size:[20,77]},
 {id:'sergeant',sprite:'sergeant-major',power:.3,bait:'worm',size:[11,24]},
 {id:'grouper',sprite:'coral-grouper',power:.65,bait:'small-fish',size:[20,60]}
];
function makeGame(){
 const bites=[];
 const engine=new SunnyBayScene({canvas:fakeCanvas(),rodCanvas:fakeCanvas(),species:animals,onBite:(species)=>bites.push(species.id)});
 return {engine,bites};
}
test('all visible fish have independent coordinates, animation steps and unique sprite source',()=>{
 const {engine}=makeGame();
 assert.equal(engine.fish.length,14);
 assert.equal(engine.lastSize.w,390);assert.equal(engine.lastSize.h,650);
 const first=engine.fish[0];const before=[first.x,first.y];
 engine.update(.33,900);
 assert.ok(Math.abs(first.x-before[0])+Math.abs(first.y-before[1])>.0001,'fish must physically move between frames');
 assert.ok(first.tailPhase>0);
 assert.ok(engine.frame>0);
 assert.ok(engine.images.get('tuna').uri.includes('yellowfin-tuna.webp'));
 assert.ok(engine.getDebug().separateLayers);
 assert.equal(new Set(engine.fish.map(f=>f.id)).size,engine.fish.length);
});
test('casting hooks target fish by proximity rather than a random timer',()=>{
 const {engine,bites}=makeGame();engine.setAim(.50);engine.cast(.72,'worm');
 assert.equal(engine.phase,'cast');assert.ok(engine.bobber.visible);
 assert.ok(engine.targetFish);assert.equal(engine.targetFish.state,'investigate');
 assert.ok(engine.targetFish.species.bait==='worm');
 // A deterministic approach simulation: fish enters the float's attack radius.
 engine.castElapsed=1.9;engine.targetFish.x=engine.bobber.x+.009;
 engine.targetFish.y=engine.bobber.y+.059;
 engine.update(.10,3500);
 assert.equal(engine.phase,'bite');assert.equal(bites.length,1);
 assert.equal(engine.hook().id,engine.hookedFish.species.id);
 assert.equal(engine.phase,'fight');
 const previous=engine.reelAngle;engine.reel(true,60);engine.update(.2,3700);
 assert.ok(engine.reelAngle>previous,'spool must rotate when reeling');
 engine.landed();assert.equal(engine.phase,'result');engine.release();
 assert.equal(engine.phase,'idle');assert.ok(!engine.bobber.visible);
});
test('line, rod and float never exist in the background; cast animation changes rod geometry',()=>{
 const {engine}=makeGame();
 assert.equal(engine.bobber.visible,false);
 const start=engine.getDebug();assert.equal(start.rod.dynamic,true);
 engine.chargeRod(.8);engine.update(.02,350);
 assert.equal(engine.phase,'charging');assert.equal(engine.charge,.8);
 engine.cast(.8,'spinner');const length=engine.castAnimation;engine.update(.20,600);
 assert.ok(engine.castAnimation<length,'rod must physically animate after release');
 assert.ok(engine.bobber.visible);
 engine.clearCast();assert.equal(engine.phase,'idle');
});
