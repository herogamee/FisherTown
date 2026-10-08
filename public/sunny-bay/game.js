import { SunnyBayScene } from './scene.js';

// FisherTown Sunny Bay v0.6 — actual fish AI, cast physics and animated rod.
const $=id=>document.getElementById(id);
const $all=query=>[...document.querySelectorAll(query)];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const rand=(a,b)=>Math.random()*(b-a)+a;
const now=()=>performance.now();
const STORAGE='fishertown:v0.1:save';
const EXTRA='fishertown:sunnybay:progress';
const fishes=[
 {id:'thunnus-albacares',sprite:'yellowfin-tuna',name:'ปลาทูน่าครีบเหลือง',en:'Yellowfin tuna',scientific:'Thunnus albacares',bait:'small-fish',size:[38,88],weightFactor:.000015,power:.84},
 {id:'lutjanus-argentimaculatus',sprite:'red-snapper',name:'ปลากะพงแดงป่าชายเลน',en:'Mangrove red snapper',scientific:'Lutjanus argentimaculatus',bait:'worm',size:[22,58],weightFactor:.000020,power:.57},
 {id:'epinephelus-coioides',sprite:'coral-grouper',name:'ปลาเก๋าดอกส้ม',en:'Orange-spotted grouper',scientific:'Epinephelus coioides',bait:'small-fish',size:[18,65],weightFactor:.000025,power:.69},
 {id:'abudefduf-vaigiensis',sprite:'sergeant-major',name:'ปลาสลิดหินลายบั้ง',en:'Indo-Pacific sergeant',scientific:'Abudefduf vaigiensis',bait:'worm',size:[11,21],weightFactor:.00003,power:.32},
 {id:'caranx-ignobilis',sprite:'silver-trevally',name:'ปลากะมงพร้าว',en:'Giant trevally',scientific:'Caranx ignobilis',bait:'spinner',size:[27,78],weightFactor:.000019,power:.80}
];
const app=$('app');
const ui={
 cast:$('cast'),hook:$('hook'),reel:$('reel'),release:$('release'),
 stateTitle:$('state-title'),stateHint:$('state-hint'),stateSymbol:$('state-symbol'),status:$('action-status'),
 meter:$('meter'),fill:$('meter-fill'),caption:$('meter-caption'),number:$('meter-label'),
 toast:$('toast'),modal:$('modal'),modalBody:$('modal-body'),modalTitle:$('modal-title'),
 fishCount:$('fish-count'),fullscreen:$('fullscreen')
};
const progress=(()=>{
 const fallback={version:1,totalCatches:0,discovered:[],records:{},selectedBait:'worm'};
 try { const p=JSON.parse(localStorage.getItem(STORAGE)||'null');
  if(p?.version===1&&Array.isArray(p.discovered))return {...fallback,...p,records:p.records||{}};
 }catch{}return fallback;
})();
const extras=(()=>{try{return {...{coins:1250},...JSON.parse(localStorage.getItem(EXTRA)||'{}')}}catch{return {coins:1250}}})();
let phase='idle',charge=.18,chargeDir=1,tension=42,stamina=1,activeFish=null;
let bait=progress.selectedBait,casting=false,reeling=false,hookAt=0,landed=null,slackClock=0;
let lastFrame=performance.now(),toastTime=0,lastStatus='';
let savedPhase='idle';
function save(){try{localStorage.setItem(STORAGE,JSON.stringify(progress));localStorage.setItem(EXTRA,JSON.stringify(extras))}catch{}}
function message(title,hint,symbol='🌊',summary=title){
 ui.stateTitle.textContent=title;ui.stateHint.textContent=hint;ui.stateSymbol.textContent=symbol;
 ui.status.textContent=summary;lastStatus=title;
}
function toast(text,duration=3){ui.toast.textContent=text;ui.toast.classList.remove('hidden');toastTime=now()+duration*1000;}
const scene=new SunnyBayScene({
 canvas:$('sea-canvas'),rodCanvas:$('rod-canvas'),species:fishes,
 onBite:fish=>triggerBite(fish),
 onFishActivity:fish=>{if(phase==='cast')ui.status.textContent=`${fish.name} กำลังว่ายเข้าหาเหยื่อ…`}
});
function updateBait(){
 $all('.bait').forEach(btn=>{btn.setAttribute('aria-pressed',String(btn.dataset.bait===bait));btn.disabled=phase!=='idle'});
}
function render(){
 const idle=phase==='idle',castPhase=phase==='cast',bitePhase=phase==='bite',fight=phase==='fight',result=phase==='result';
 ui.cast.disabled=!(idle||phase==='charging'||castPhase||bitePhase);
 ui.cast.classList.toggle('held',casting);
 $('cast-title').textContent=phase==='charging'?'ปล่อยเพื่อเหวี่ยง':castPhase||bitePhase?'เก็บสาย':'เหวี่ยงเบ็ด';
 $('cast-subtitle').textContent=phase==='charging'?'กำลังเพิ่มแรง...':castPhase||bitePhase?'เหวี่ยงใหม่ได้':'กดค้างแล้วปล่อย';
 ui.hook.disabled=!bitePhase;ui.hook.classList.toggle('attention',bitePhase);
 ui.reel.disabled=!fight;ui.reel.classList.toggle('held',reeling);
 ui.release.disabled=!result;ui.release.classList.toggle('attention',result);
 ui.meter.classList.toggle('hidden',!(phase==='charging'||fight));
 if(phase==='charging'||fight){
  const value=clamp(fight?tension:charge*100,0,100);
  ui.fill.style.width=value.toFixed(1)+'%';ui.number.textContent=Math.round(value)+'%';
  ui.caption.textContent=fight?'แรงตึงสาย · ปลอดภัย 20–82%':'แรงเหวี่ยง';
  ui.meter.setAttribute('aria-valuenow',String(Math.round(value)));
  ui.fill.style.background=fight&&(value>85||value<12)?'#f2745f':'linear-gradient(90deg,#4dcfc7,#f9cc57)';
 }
 updateBait();$('money').textContent=Number(extras.coins).toLocaleString('en-US');
 if(ui.fishCount)ui.fishCount.textContent=`ปลาเคลื่อนไหว ${scene.fish.length} ตัว`;
}
function startCast(){
 if(phase==='cast'||phase==='bite'){retrieve();return;}
 if(phase!=='idle')return;
 casting=true;charge=.18;chargeDir=1;phase='charging';scene.chargeRod(charge);
 message('กำลังเหวี่ยงเบ็ด','ปล่อยปุ่มเพื่อเหวี่ยง สังเกตคันเบ็ดที่เอนตามแรง','🎯','ปล่อยเพื่อเหวี่ยง');render();
}
function finishCast(){
 if(!casting)return;casting=false;
 if(phase!=='charging')return;
 scene.cast(charge,bait);phase='cast';
 message('เหยื่อลงน้ำแล้ว','สังเกตปลาที่กำลังว่ายเข้าหาทุ่น','🌊','รอปลาว่ายเข้าหาเหยื่อ…');render();
}
function retrieve(){
 if(phase!=='cast'&&phase!=='bite')return;
 scene.clearCast();phase='idle';activeFish=null;
 message('เก็บสายแล้ว','พร้อมเลือกเหยื่อหรือเหวี่ยงใหม่','🎣');render();
}
function triggerBite(species){
 if(phase!=='cast')return;
 activeFish=species;hookAt=now();phase='bite';
 message(`ปลากินเหยื่อ! ${species.name}`,'กด HOOK! ให้ทัน ก่อนปลาสะบัดหนี','⚡','มีปลากินเหยื่อ! กด HOOK!');
 render();try{navigator.vibrate?.([40,35,40])}catch{}
}
function hook(){
 if(phase!=='bite')return;
 const hooked=scene.hook();if(!hooked)return;
 activeFish=hooked;phase='fight';tension=45;stamina=1;slackClock=0;reeling=false;
 message(`ติดเบ็ด! ${hooked.name}`,'กดค้าง “ดึงสาย” สลับกับปล่อยเมื่อสายตึง','🐟','ระวังสายขาดหรือสายหย่อน');render();
}
function startReel(){if(phase!=='fight')return;reeling=true;scene.reel(true,tension);render();}
function stopReel(){if(!reeling)return;reeling=false;scene.reel(false,tension);render();}
function escape(reason){
 if(phase!=='fight'&&phase!=='bite')return;
 scene.clearCast('escape');phase='idle';reeling=false;activeFish=null;
 message(reason,'เลือกเหยื่อแล้วเหวี่ยงใหม่ได้ทันที','💨');toast(reason);render();
}
function recordCatch(fish,length,weight){
 const last=progress.records[fish.id];const isNew=!progress.discovered.includes(fish.id);
 const isBest=!last||length>last.bestLengthCm;
 if(isNew)progress.discovered.push(fish.id);
 progress.totalCatches++;
 progress.records[fish.id]={speciesId:fish.id,bestLengthCm:Math.max(last?.bestLengthCm||0,length),bestWeightKg:Math.max(last?.bestWeightKg||0,weight),catches:(last?.catches||0)+1,lastCaughtAt:new Date().toISOString()};
 extras.coins=Number(extras.coins||1250)+Math.round(length*1.8);save();return {isNew,isBest};
}
function land(){
 if(phase!=='fight'||!activeFish)return;
 const fish=activeFish,length=rand(...fish.size),weight=Math.max(.05,fish.weightFactor*length**3);
 landed={fish,length,weight,tags:recordCatch(fish,length,weight)};
 scene.landed();phase='result';reeling=false;
 message('ตกได้แล้ว! '+fish.name,'จับสำเร็จแล้ว แตะ “ปล่อยปลา” เพื่อเล่นต่อ','🏆',fish.name+' · '+length.toFixed(1)+' ซม.');
 render();showCatchModal();
}
function release(){
 if(phase!=='result')return;
 landed=null;activeFish=null;phase='idle';scene.release();
 if(ui.modal.open)ui.modal.close();
 message('ปล่อยปลาเรียบร้อย','กลับไปตกปลาตัวถัดไปได้เลย','🌊','บันทึกสถิติและปล่อยคืนสำเร็จ');render();
}
function showCatchModal(){
 if(!landed)return;const {fish,length,weight,tags}=landed;
 ui.modalTitle.textContent='🎉 จับปลาได้แล้ว!';ui.modalBody.replaceChildren();
 const box=document.createElement('div');box.className='catch-modal';
 const img=document.createElement('img');img.className='big-catch-art';img.src='./assets/live-fish/'+fish.sprite+'.webp';img.alt='ภาพประกอบ '+fish.name;box.append(img);
 const name=document.createElement('strong');name.textContent=fish.name;box.append(name);
 const scientific=document.createElement('em');scientific.textContent=fish.en+' · '+fish.scientific;box.append(scientific);
 const metrics=document.createElement('p');metrics.textContent=length.toFixed(1)+' ซม. · '+weight.toFixed(2)+' กก.';box.append(metrics);
 const label=document.createElement('p');label.textContent=[tags.isNew?'ชนิดปลาใหม่!':'',tags.isBest?'สถิติความยาวใหม่!':''].filter(Boolean).join(' · ')||'บันทึกลงสมุดปลาแล้ว';box.append(label);
 const btn=document.createElement('button');btn.type='button';btn.className='panel-button';btn.textContent='🐠 ปล่อยคืนสู่ธรรมชาติ';btn.addEventListener('click',release);box.append(btn);
 ui.modalBody.append(box);if(!ui.modal.open)ui.modal.showModal();
}
function panel(key){
 let title='FisherTown',rows=[];
 if(key==='fishdex') {title='📖 สมุดปลา Fishdex';rows=fishes.map(f=>{const seen=progress.discovered.includes(f.id),record=progress.records[f.id];return ['🐟 '+(seen?f.name:'???'),seen?(f.en+' · '+f.scientific+'\nสถิติ '+record.bestLengthCm.toFixed(1)+' ซม. · '+record.catches+' ครั้ง'):'ยังไม่ค้นพบ'];});}
 else if(key==='inventory'){title='🎒 กระเป๋า';rows=[['🪱 ไส้เดือน','เหยื่อใช้งานได้ไม่จำกัด'],['🐟 ลูกปลา','เหยื่อดึงดูดปลานักล่า'],['✨ สปินเนอร์','เหยื่อปลอม'],['🎣 คันเบ็ดเคลื่อนไหว','งอและเหวี่ยงตามแรง / แรงตึงสาย']];}
 else if(key==='shop'){title='🏪 ร้านค้า';rows=[['💰 เหรียญ '+Number(extras.coins).toLocaleString('en-US'),'ได้รับจากปลาที่จับได้'],['อุปกรณ์ใหม่','กำลังพัฒนา ยังไม่ใช่การซื้อเงินจริง']];}
 else if(key==='map'){title='🗺 แผนที่';rows=[['📍 Sunny Bay','จุดตกปลาปัจจุบัน'],['🌴 พื้นที่ใหม่','กำลังพัฒนา']];}
 else if(key==='missions'){title='🏆 ภารกิจ';rows=[['จับปลา 1 ตัว',progress.totalCatches>=1?'✅ เสร็จแล้ว':'○ รอสำเร็จ'],['ค้นพบปลา 3 ชนิด',progress.discovered.length+'/3'],['สะสมปลา 5 ชนิด',progress.discovered.length+'/5']];}
 else if(key==='settings'){title='⚙ ตั้งค่า';rows=[['กราฟิก','ฉากหลังไม่มีปลาหรือคันเบ็ดติดภาพ ปลาและคันเบ็ดวาดแยกใน Canvas'],['ความลื่น','ปลาว่ายและงอคันเบ็ดตาม requestAnimationFrame'],['ข้อมูลบันทึก','บันทึก Fishdex ในเบราว์เซอร์เครื่องนี้']];}
 else return;
 ui.modalTitle.textContent=title;ui.modalBody.replaceChildren();const list=document.createElement('div');list.className='panel-list';
 for(const [a,b] of rows){const row=document.createElement('div');row.className='panel-row';const strong=document.createElement('strong');strong.textContent=a;const small=document.createElement('small');small.style.display='block';small.style.whiteSpace='pre-line';small.textContent=b;row.append(strong,small);list.append(row);}
 ui.modalBody.append(list);if(!ui.modal.open)ui.modal.showModal();
}
function bindHold(button,pressed,released){
 let held=false;
 const up=()=>{if(!held)return;held=false;button.classList.remove('held');released()};
 button.addEventListener('pointerdown',e=>{
  if(held||button.disabled||e.button!==0)return;
  e.preventDefault();held=true;button.classList.add('held');
  try{button.setPointerCapture(e.pointerId)}catch{}pressed();
 });
 ['pointerup','pointercancel','lostpointercapture'].forEach(event=>button.addEventListener(event,up));
 button.addEventListener('keydown',e=>{if(button.disabled||held||e.repeat||![' ','Enter'].includes(e.key))return;e.preventDefault();held=true;button.classList.add('held');pressed()});
 button.addEventListener('keyup',e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();up()}});
 window.addEventListener('blur',up);
}
bindHold(ui.cast,startCast,finishCast);bindHold(ui.reel,startReel,stopReel);
ui.hook.addEventListener('click',hook);ui.release.addEventListener('click',release);
$all('.bait').forEach(btn=>btn.addEventListener('click',()=>{
 if(phase!=='idle')return;
 if(!['worm','small-fish','spinner'].includes(btn.dataset.bait))return;
 bait=btn.dataset.bait;progress.selectedBait=bait;save();updateBait();
 message('เลือกเหยื่อ '+btn.textContent,'กดค้างเหวี่ยงเบ็ด','🪱');
}));
$all('[data-panel]').forEach(btn=>btn.addEventListener('click',()=>{
 if(btn.dataset.panel==='home'){if(ui.modal.open)ui.modal.close();return;}
 panel(btn.dataset.panel);
}));
$('settings').addEventListener('click',()=>panel('settings'));
$('modal-close').addEventListener('click',()=>ui.modal.close());
ui.modal.addEventListener('close',()=>{if(phase==='result')toast('แตะ “ปล่อยปลา” เพื่อเล่นต่อ')});
ui.fullscreen.addEventListener('click',async()=>{
 if(document.fullscreenElement){await document.exitFullscreen().catch(()=>{});return;}
 try{await app.requestFullscreen()}catch{app.classList.toggle('pseudo-fullscreen')}
});
document.addEventListener('fullscreenchange',()=>{ui.fullscreen.textContent=document.fullscreenElement?'↙':'⛶'});
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){savedPhase=phase;reeling=false;casting=false;save();lastFrame=now()}
 else{if(savedPhase==='fight'&&phase==='fight')toast('เกมพักไว้แล้ว กลับมาตกปลาได้ต่อ');lastFrame=now()}
});
// Pointer aim on the water: aim moves the live fishing line and fish target.
$('world-layer').addEventListener('pointerup',event=>{
 if(!['idle','charging'].includes(phase))return;
 const box=event.currentTarget.getBoundingClientRect();
 scene.setAim((event.clientX-box.left)/box.width);
 toast('ปรับเป้าหมายที่เหวี่ยงเบ็ดแล้ว',1.3);
});
let frameCount=0;
function loop(time){
 const dt=clamp((time-lastFrame)/1000,0,.05);lastFrame=time;
 if(!document.hidden){
  if(phase==='charging'){
   charge+=dt*.74*chargeDir;
   if(charge>=1){charge=1;chargeDir=-1}
   if(charge<=.14){charge=.14;chargeDir=1}
   scene.chargeRod(charge);
   ui.fill.style.width=(charge*100).toFixed(1)+'%';ui.number.textContent=Math.round(charge*100)+'%';
  }
  scene.update(dt,time);
  if(phase==='bite'&&time-hookAt>2400)escape('ปลาคายเหยื่อแล้ว — กด HOOK! ให้เร็วขึ้น');
  if(phase==='fight'&&activeFish){
   const pull=activeFish.power*(.26+.74*Math.abs(Math.sin(time*.0025)));
   if(reeling){
    tension+=dt*(21+pull*28);
    if(tension>=20&&tension<=82)stamina-=dt*(.31-.08*activeFish.power);
   }else{
    tension-=dt*(17-pull*4);stamina=Math.min(1,stamina+dt*.008);
   }
   tension+=dt*pull*13;tension=clamp(tension,0,109);
   if(tension<7)slackClock+=dt;else slackClock=Math.max(0,slackClock-dt*1.6);
   scene.reel(reeling,tension);
   if(tension>100)escape('สายขาด — ปล่อยปุ่มดึงสายก่อนแรงตึงสูง');
   else if(slackClock>1.2)escape('สายหย่อน — ลองดึงสายให้ต่อเนื่อง');
   else if(stamina<=0)land();
   if(phase==='fight'){
    ui.fill.style.width=Math.round(tension)+'%';ui.number.textContent=Math.round(tension)+'%';
    ui.fill.style.background=tension>85||tension<12?'#ee7257':'linear-gradient(90deg,#56ddd1,#f9d261)';
    ui.meter.setAttribute('aria-valuenow',String(Math.round(tension)));
   }
  }
  if(!ui.toast.classList.contains('hidden')&&time>toastTime)ui.toast.classList.add('hidden');
 }
 frameCount++;requestAnimationFrame(loop);
}
render();message('เตรียมตกปลา','เลือกเหยื่อและกดค้างเพื่อเหวี่ยง ดูปลาที่กำลังว่าย','🌊','ปลากำลังว่ายในทะเลจริง ๆ');
requestAnimationFrame(loop);
if(new URLSearchParams(location.search).has('test')){
 window.__fishertownTest={
  getState:()=>({phase,charge,tension,bait,totalCatches:progress.totalCatches,frames:frameCount,...scene.getDebug()}),
  triggerBite:()=>{const fish=scene.targetFish||scene.fish.find(f=>f.state==='cruise');if(phase==='cast'&&fish){scene.targetFish=fish;fish.x=scene.bobber.x;fish.y=scene.bobber.y+.056;scene.update(.055,now());}},
  hook,land,release,startCast,finishCast,
  canvasFish:()=>scene.fish.map(f=>({x:f.x,y:f.y,id:f.id})),
  visual:()=>scene.getDebug()
 };
}
