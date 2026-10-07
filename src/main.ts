import Phaser from 'phaser';
import './style.css';
import { FishingScene } from './game/FishingScene';

const frame=document.getElementById('game-frame');
if(!frame) throw new Error('Missing #game-frame');

const button=document.createElement('button');
button.id='fullscreen-button';
button.type='button';
button.textContent='⛶';
button.title='เต็มจอ';
button.setAttribute('aria-label','ขยายเกมเต็มจอ');
document.body.appendChild(button);

const active=()=>Boolean(document.fullscreenElement)||document.documentElement.classList.contains('fill-screen');
const sync=()=>{button.textContent=active()?'×':'⛶';button.setAttribute('aria-label',active()?'ออกจากโหมดเต็มจอ':'ขยายเกมเต็มจอ')};

button.addEventListener('click',async()=>{
  if(document.fullscreenElement){
    await document.exitFullscreen().catch(()=>undefined);
    sync(); return;
  }
  if(document.documentElement.classList.contains('fill-screen')){
    document.documentElement.classList.remove('fill-screen'); sync(); return;
  }
  try{
    if(frame.requestFullscreen){await frame.requestFullscreen();return;}
  }catch{}
  document.documentElement.classList.add('fill-screen');
  window.scrollTo(0,1);
  sync();
});
document.addEventListener('fullscreenchange',sync);

const config:Phaser.Types.Core.GameConfig={
 type:Phaser.AUTO,parent:'game',width:1280,height:720,backgroundColor:'#071d21',scene:[FishingScene],
 render:{antialias:true,pixelArt:false,roundPixels:false},
 scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH,width:1280,height:720},
 input:{activePointers:3}
};
new Phaser.Game(config);

if('serviceWorker' in navigator&&import.meta.env.PROD){
 window.addEventListener('load',async()=>{
  const regs=await navigator.serviceWorker.getRegistrations().catch(()=>[]);
  for(const reg of regs){await reg.update().catch(()=>undefined);}
  navigator.serviceWorker.register('./sw.js?v=3',{updateViaCache:'none'}).catch(()=>undefined);
 });
}
