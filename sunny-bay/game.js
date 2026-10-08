// FisherTown — Sunny Bay playable UI prototype.
// Built from the user's approved art direction. No fixed button image is interactive;
// UI elements are real HTML controls, game phases are persistent and user-action driven.

const $=(id)=>document.getElementById(id);
const $all=(selector)=>[...document.querySelectorAll(selector)];
const STORAGE='fishertown:v0.1:save';
const NEW_STORAGE='fishertown:sunnybay:progress';
const fishes=[
  {id:'barbonymus-gonionotus',name:'ปลาตะเพียนขาว',en:'Silver barb',scientific:'Barbonymus gonionotus',bait:'worm',size:[18,38],weightFactor:0.000018,power:.45},
  {id:'channa-striata',name:'ปลาช่อน',en:'Striped snakehead',scientific:'Channa striata',bait:'small-fish',size:[24,66],weightFactor:0.000013,power:.68},
  {id:'channa-micropeltes',name:'ปลาชะโด',en:'Indonesian snakehead',scientific:'Channa micropeltes',bait:'spinner',size:[32,86],weightFactor:0.000015,power:.81},
  {id:'pangasianodon-hypophthalmus',name:'ปลาสวาย',en:'Striped catfish',scientific:'Pangasianodon hypophthalmus',bait:'worm',size:[28,82],weightFactor:0.000016,power:.65},
  {id:'clarias-macrocephalus',name:'ปลาดุกอุย',en:'Bighead catfish',scientific:'Clarias macrocephalus',bait:'worm',size:[20,42],weightFactor:0.000019,power:.48},
  {id:'anabas-testudineus',name:'ปลาหมอไทย',en:'Climbing perch',scientific:'Anabas testudineus',bait:'worm',size:[12,24],weightFactor:0.000024,power:.32},
  {id:'trichopodus-pectoralis',name:'ปลาสลิด',en:'Snakeskin gourami',scientific:'Trichopodus pectoralis',bait:'worm',size:[14,26],weightFactor:0.000020,power:.30},
  {id:'notopterus-notopterus',name:'ปลาสลาด',en:'Bronze featherback',scientific:'Notopterus notopterus',bait:'small-fish',size:[22,46],weightFactor:0.000012,power:.52},
  {id:'wallago-attu',name:'ปลาเค้า',en:'Wallago catfish',scientific:'Wallago attu',bait:'small-fish',size:[36,92],weightFactor:0.000013,power:.79},
  {id:'catlocarpio-siamensis',name:'ปลากระโห้',en:'Giant barb',scientific:'Catlocarpio siamensis',bait:'worm',size:[45,105],weightFactor:0.000021,power:.9}
];

const app=$('app'),dom={cast:$('cast'),hook:$('hook'),reel:$('reel'),release:$('release'),status:$('action-status'),stateTitle:$('state-title'),stateHint:$('state-hint'),stateSymbol:$('state-symbol'),bobber:$('bobber'),signal:$('bite-signal'),meter:$('meter'),fill:$('meter-fill'),caption:$('meter-caption'),number:$('meter-label'),toast:$('toast'),modal:$('modal'),modalBody:$('modal-body'),modalTitle:$('modal-title')};

const progress=(()=>{try{const value=JSON.parse(localStorage.getItem(STORAGE)||'null');if(value?.version===1&&Array.isArray(value.discovered))return {...value,records:value.records||{},selectedBait:value.selectedBait||'worm'};}catch{}return{version:1,totalCatches:0,discovered:[],records:{},selectedBait:'worm'};})();
const extras=(()=>{try{return JSON.parse(localStorage.getItem(NEW_STORAGE)||'null')||{coins:1250}}catch{return {coins:1250}}})();
let phase='idle',charge=.18,chargeDir=1,tension=42,stamina=1,activeFish=null,bait=progress.selectedBait,casting=false,reeling=false,castAt=0,biteAt=0,hookAt=0,castX=52,castY=47,landed=null,lastFrame=performance.now(),onHold=false,toastTime=0;
let savedPhase='idle';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const rand=(a,b)=>Math.random()*(b-a)+a;
const now=()=>performance.now();
const save=()=>{try{localStorage.setItem(STORAGE,JSON.stringify(progress));localStorage.setItem(NEW_STORAGE,JSON.stringify(extras));}catch{}};
const message=(title,hint,symbol='🫧',summary=title)=>{dom.stateTitle.textContent=title;dom.stateHint.textContent=hint;dom.stateSymbol.textContent=symbol;dom.status.textContent=summary};
const showToast=(text,seconds=3)=>{dom.toast.textContent=text;dom.toast.classList.remove('hidden');toastTime=now()+seconds*1000};
const updateBait=()=>{$all('.bait').forEach(x=>{x.setAttribute('aria-pressed',String(x.dataset.bait===bait));x.disabled=phase!=='idle'})};
const setPhase=(next)=>{phase=next;render();};
const coinUpdate=()=>{$('money').textContent=extras.coins.toLocaleString('en-US')};

function render(){
  const idle=phase==='idle',waiting=phase==='cast',bitePhase=phase==='bite',fight=phase==='fight',result=phase==='result';
  dom.cast.disabled=!(idle||phase==='charging'||waiting||bitePhase);
  dom.cast.classList.toggle('held',casting);
  dom.cast.querySelector('#cast-title').textContent=phase==='charging'?'ปล่อยเพื่อเหวี่ยง':(waiting||bitePhase?'เก็บสาย':'เหวี่ยงเบ็ด');
  $('cast-subtitle').textContent=phase==='charging'?'กำลังเพิ่มแรง...':(waiting||bitePhase?'เหวี่ยงใหม่ได้':'กดค้างแล้วปล่อย');
  dom.hook.disabled=!bitePhase;dom.hook.classList.toggle('attention',bitePhase);
  dom.reel.disabled=!fight;dom.reel.classList.toggle('held',reeling);
  dom.release.disabled=!result;dom.release.classList.toggle('attention',result);
  dom.signal.classList.toggle('hidden',!bitePhase);
  dom.bobber.classList.toggle('hidden',!(waiting||bitePhase||fight));
  dom.meter.classList.toggle('hidden',!(phase==='charging'||fight));
  if(phase==='charging'||fight){const value=clamp((fight?tension:charge*100),0,100);dom.fill.style.width=value+'%';dom.number.textContent=Math.round(value)+'%';dom.caption.textContent=fight?'แรงตึงสาย · ควรอยู่ 20–82%':'แรงเหวี่ยง';dom.meter.setAttribute('aria-valuenow',String(Math.round(value)));dom.fill.style.background=fight&&value>87?'#f2745f':'linear-gradient(90deg,#4dcfc7,#f9cc57)';}
  updateBait();coinUpdate();
}

function startCast(){if(phase==='cast'||phase==='bite'){retrieve();return}if(phase!=='idle')return;casting=true;charge=.18;chargeDir=1;phase='charging';message('กำลังเล็งระยะ','ปล่อยปุ่มเมื่อต้องการเหวี่ยง','🎯','ปล่อยเพื่อเหวี่ยงเบ็ด');render()}
function finishCast(){if(!casting)return;casting=false; if(phase!=='charging')return;
  castX=clamp(87-charge*74,12,87);castY=clamp(37+Math.random()*12,38,50);
  dom.bobber.style.left=castX+'%';dom.bobber.style.top=castY+'%';dom.signal.style.left=castX+'%';dom.signal.style.top=(castY-7)+'%';
  castAt=now();biteAt=castAt+rand(3900,8300);activeFish=null;setPhase('cast');message('เหยื่อลงน้ำแล้ว','รอปลาเข้ามากินเหยื่อ','🌊','รอปลา... ทุ่นเริ่มนิ่งแล้ว');
}
function retrieve(){if(phase!=='cast'&&phase!=='bite')return;activeFish=null;phase='idle';dom.bobber.classList.add('hidden');message('เก็บสายแล้ว','เลือกเหยื่อใหม่หรือเหวี่ยงอีกครั้ง','🎣','พร้อมเหวี่ยงเบ็ดใหม่');render()}
function chooseFish(){const matches=fishes.filter(f=>f.bait===bait);return matches[Math.floor(Math.random()*matches.length)]||fishes[0]}
function triggerBite(){if(phase!=='cast')return;activeFish=chooseFish();hookAt=now();phase='bite';message('ปลากินเหยื่อแล้ว!','กด HOOK! ก่อนปลาหนี','⚡','ปลากินเหยื่อ! กด HOOK!');render();if(navigator.vibrate)navigator.vibrate([40,40,40]);}
function hook(){if(phase!=='bite')return;phase='fight';tension=45;stamina=1;reeling=false;message('ติดเบ็ดแล้ว!','กดค้าง “ดึงสาย” สลับกับปล่อย','🐟','รักษาแรงตึง 20–82%');render();}
function startReel(){if(phase!=='fight')return;reeling=true;render()}
function stopReel(){if(!reeling)return;reeling=false;render()}
function fishEscape(reason){if(phase!=='fight'&&phase!=='bite')return;phase='idle';reeling=false;activeFish=null;message(reason,'เลือกเหยื่อและเริ่มใหม่ได้เลย','💨',reason);showToast(reason);render()}
function recordCatch(fish,length,weight){const previous=progress.records[fish.id],isNew=!progress.discovered.includes(fish.id),isBest=!previous||length>previous.bestLengthCm;
 if(isNew)progress.discovered.push(fish.id);progress.totalCatches++;
 progress.records[fish.id]={speciesId:fish.id,bestLengthCm:Math.max(previous?.bestLengthCm||0,length),bestWeightKg:Math.max(previous?.bestWeightKg||0,weight),catches:(previous?.catches||0)+1,lastCaughtAt:new Date().toISOString()};
 extras.coins=Math.max(0,(Number(extras.coins)||1250))+Math.round(length*1.8);save();return {isNew,isBest};}
function land(){if(phase!=='fight'||!activeFish)return;const fish=activeFish;const length=rand(...fish.size),weight=Math.max(.05,fish.weightFactor*length**3),tags=recordCatch(fish,length,weight);landed={fish,length,weight,tags};phase='result';reeling=false;
 message('ตกได้แล้ว! '+fish.name,'แตะ “ปล่อยปลา” เพื่อบันทึกและเล่นต่อ','🏆',fish.name+' · '+length.toFixed(1)+' ซม.');render();showCatchModal();}
function release(){if(phase!=='result')return;landed=null;activeFish=null;phase='idle';dom.modal.close();message('ปล่อยปลาแล้ว','กลับไปตกปลาตัวต่อไปกันเถอะ','🌊','บันทึกสถิติและปล่อยคืนสำเร็จ');render()}

function showCatchModal(){if(!landed)return;const {fish,length,weight,tags}=landed;
 $('modal-title').textContent='🎉 ตกปลาได้แล้ว!';
 dom.modalBody.innerHTML='';const wrap=document.createElement('div');wrap.className='catch-modal';
 const img=document.createElement('img');img.className='big-catch-art';img.src='./assets/'+(fish.id.startsWith('channa-')?'snakehead':fish.id.startsWith('pangasianodon-')||fish.id.startsWith('clarias-')||fish.id.startsWith('wallago-')?'catfish':fish.id.startsWith('notopterus-')?'featherback':'silver-barb')+'.svg';img.alt='ภาพวาดประกอบ '+fish.name;wrap.appendChild(img);
 const name=document.createElement('strong');name.textContent=fish.name;wrap.appendChild(name);
 const scientific=document.createElement('em');scientific.textContent=fish.en+' · '+fish.scientific;wrap.appendChild(scientific);
 const metric=document.createElement('p');metric.textContent=length.toFixed(1)+' ซม. · '+weight.toFixed(2)+' กก.';wrap.appendChild(metric);
 const badges=document.createElement('p');badges.textContent=[tags.isNew?'พบชนิดปลาใหม่!':'',tags.isBest?'ทำลายสถิติความยาว!':''].filter(Boolean).join(' · ')||'บันทึกลงสมุดปลาแล้ว';wrap.appendChild(badges);
 const btn=document.createElement('button');btn.className='panel-button';btn.textContent='🐠 ปล่อยคืนสู่ธรรมชาติ';btn.onclick=release;wrap.appendChild(btn);
 dom.modalBody.appendChild(wrap);dom.modal.showModal();}

function simplePanel(key){
 let title='FisherTown',rows=[];
 if(key==='fishdex'){title='📖 สมุดปลา Fishdex';rows=fishes.map(f=>{const known=progress.discovered.includes(f.id),record=progress.records[f.id];return ['🐟 '+(known?f.name:'???'),(known?f.en+' · '+f.scientific+'\nสถิติ '+record.bestLengthCm.toFixed(1)+' ซม. · '+record.catches+' ครั้ง':'ยังไม่ค้นพบ') ]});}
 else if(key==='inventory'){title='🎒 กระเป๋า';rows=[['🪱 ไส้เดือน','เหยื่อใช้งานได้ไม่จำกัดใน Prototype'],['🐟 ลูกปลา','เหยื่อปลานักล่า'],['✨ สปินเนอร์','เหยื่อปลอม'],['🎣 คันเบ็ดเริ่มต้น','ระบบอุปกรณ์อัปเกรดอยู่ระหว่างพัฒนา']];}
 else if(key==='shop'){title='🏪 ร้านค้า';rows=[['💰 เหรียญ '+extras.coins.toLocaleString('en-US'),'ได้รับจากปลาที่จับได้'],['🎣 อุปกรณ์ใหม่','กำลังพัฒนา · ไม่ใช่ปุ่มซื้อสินค้าจริง'],['💎 เพชร','ตัวเลข UI ตัวอย่าง ยังไม่มีการเติมเงินจริง']];}
 else if(key==='map'){title='🗺 แผนที่';rows=[['📍 Sunny Bay — อ่าวแสงจันทร์','จุดตกปลาปัจจุบัน'],['🌴 อ่าวอื่นๆ','จะเปิดเพิ่มในเวอร์ชันถัดไป'],['🌍 แผนที่โลก','ระบบภูมิภาคและแหล่งน้ำกำลังพัฒนา']];}
 else if(key==='missions'){title='🏆 ภารกิจ';rows=[['ตกปลา 1 ตัว',(progress.totalCatches>=1?'✅ เสร็จแล้ว':'○ ยังไม่เสร็จ')],['ค้นพบปลา 3 ชนิด',(progress.discovered.length>=3?'✅ เสร็จแล้ว':'○ '+progress.discovered.length+'/3')],['ทำ Fishdex ครบ 10 ชนิด',progress.discovered.length+'/10']];}
 else if(key==='settings'){title='⚙ ตั้งค่า';rows=[['กราฟิก','ภาพฉาก Sunny Bay จากภาพต้นแบบ ออกแบบแยกปุ่มจริง'],['เสียง','เวอร์ชันนี้ยังไม่มีเสียงประกอบ'],['ข้อมูลบันทึก','ใช้ localStorage ของเบราว์เซอร์เดิม']];}
 else return;
 dom.modalTitle.textContent=title;dom.modalBody.replaceChildren();const list=document.createElement('div');list.className='panel-list';for(const [head,sub] of rows){const row=document.createElement('div');row.className='panel-row';const b=document.createElement('strong');b.textContent=head;const d=document.createElement('small');d.style.display='block';d.style.whiteSpace='pre-line';d.textContent=sub;row.append(b,d);list.append(row)}dom.modalBody.append(list);dom.modal.showModal();
}

function bindHold(button,press,releaseFn){let held=false,pointer=null;
 const up=()=>{if(!held)return;held=false;pointer=null;button.classList.remove('held');releaseFn()};
 button.addEventListener('pointerdown',ev=>{if(button.disabled||ev.button!==0||held)return;ev.preventDefault();held=true;pointer=ev.pointerId;button.classList.add('held');try{button.setPointerCapture(ev.pointerId)}catch{}press()});
 button.addEventListener('pointerup',up);button.addEventListener('pointercancel',up);button.addEventListener('lostpointercapture',up);
 button.addEventListener('keydown',ev=>{if(button.disabled||held||ev.repeat||![' ','Enter'].includes(ev.key))return;ev.preventDefault();held=true;button.classList.add('held');press()});
 button.addEventListener('keyup',ev=>{if([' ','Enter'].includes(ev.key)){ev.preventDefault();up()}});
 window.addEventListener('blur',up);
}
bindHold(dom.cast,startCast,finishCast);bindHold(dom.reel,startReel,stopReel);
dom.hook.addEventListener('click',hook);dom.release.addEventListener('click',release);
$all('.bait').forEach(btn=>btn.addEventListener('click',()=>{if(phase!=='idle')return;const id=btn.dataset.bait;if(!['worm','small-fish','spinner'].includes(id))return;bait=id;progress.selectedBait=id;save();updateBait();message('เปลี่ยนเหยื่อแล้ว','เลือกแรงเหวี่ยงแล้วเริ่มได้เลย','🪱','เลือกเหยื่อ '+btn.textContent)}));
$all('[data-panel]').forEach(button=>button.addEventListener('click',()=>{if(button.dataset.panel==='home'){if(dom.modal.open)dom.modal.close();return}simplePanel(button.dataset.panel)}));
$('settings').addEventListener('click',()=>simplePanel('settings'));
$('modal-close').addEventListener('click',()=>dom.modal.close());
// Catch confirmation remains accessible when the modal closes accidentally.
dom.modal.addEventListener('close',()=>{if(phase==='result'){showToast('แตะ “ปล่อยปลา” ที่ปุ่มสีแดงเพื่อเล่นต่อ')}});
$('fullscreen').addEventListener('click',async()=>{const fullscreen=document.fullscreenElement;if(fullscreen){await document.exitFullscreen().catch(()=>{});return}try{await app.requestFullscreen()}catch{app.classList.toggle('pseudo-fullscreen')}});
document.addEventListener('fullscreenchange',()=>{$('fullscreen').textContent=document.fullscreenElement?'↙':'⛶'});
document.addEventListener('visibilitychange',()=>{if(document.hidden){savedPhase=phase;reeling=false;casting=false;save();lastFrame=performance.now()}else{if(savedPhase==='fight'&&phase==='fight')showToast('เกมพักไว้ระหว่างสลับหน้าจอแล้ว');lastFrame=performance.now()}});

function loop(time){const dt=clamp((time-lastFrame)/1000,0,.045);lastFrame=time;
 if(!document.hidden){
  if(phase==='charging'){charge+=dt*.7*chargeDir;if(charge>=1){charge=1;chargeDir=-1}if(charge<=.14){charge=.14;chargeDir=1}dom.fill.style.width=(charge*100).toFixed(1)+'%';dom.number.textContent=Math.round(charge*100)+'%';}
  if(phase==='cast'&&time>=biteAt)triggerBite();
  if(phase==='bite'&&time-hookAt>2400)fishEscape('ปลาคายเหยื่อแล้ว — กด HOOK! ให้เร็วขึ้น');
  if(phase==='fight'&&activeFish){const pull=activeFish.power*(.26+.74*Math.abs(Math.sin(time*.0025)));
   if(reeling){tension+=dt*(19+pull*23);if(tension>=20&&tension<=82)stamina-=dt*(.31-.09*activeFish.power)}else{tension-=dt*(21-pull*5)}
   tension+=dt*pull*13;tension=clamp(tension,0,108);
   if(tension>100)fishEscape('สายขาด! ปล่อยดึงสายก่อนแรงตึงสูง');
   else if(tension<5)fishEscape('สายหย่อน! ลองดึงสายเป็นจังหวะ');
   else if(stamina<=0)land();
   dom.fill.style.width=Math.round(tension)+'%';dom.number.textContent=Math.round(tension)+'%';dom.meter.setAttribute('aria-valuenow',String(Math.round(tension)));
  }
  if(!dom.toast.classList.contains('hidden')&&time>toastTime)dom.toast.classList.add('hidden');
 }
 requestAnimationFrame(loop)}
render();message('เตรียมตกปลา','เลือกเหยื่อและกดค้างเหวี่ยงเบ็ด','🌊','แตะปุ่มเพื่อเริ่มตกปลาใน FisherTown');requestAnimationFrame(loop);
// Lightweight dev smoke introspection; no cheats or debug overlays in normal UI.
if(new URLSearchParams(location.search).has('test'))window.__fishertownTest={getState:()=>({phase,charge,tension,bait,totalCatches:progress.totalCatches}),triggerBite,hook,land};
