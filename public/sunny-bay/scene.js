/** Sunny Bay v0.6 — real-time fish actors + independent animated rod rig.
 * Background deliberately contains no fish or fishing equipment. All species,
 * rod, fishing line and float are rendered as moving entities on these canvases.
 */
const clamp = (n,a,b)=>Math.max(a,Math.min(b,n));
const mix=(a,b,t)=>a+(b-a)*t;
const random=(a,b)=>a+Math.random()*(b-a);

export class SunnyBayScene {
  constructor({ canvas, rodCanvas, species, onBite, onFishActivity }) {
    this.canvas=canvas;
    this.rodCanvas=rodCanvas;
    this.ctx=canvas.getContext('2d',{alpha:true});
    this.rodCtx=rodCanvas.getContext('2d',{alpha:true});
    if (!this.ctx || !this.rodCtx) throw new Error('Canvas 2D is required');
    this.species=species;
    this.onBite=onBite;
    this.onFishActivity=onFishActivity??(()=>{});
    this.images=new Map();
    this.phase='idle';
    this.bobber={ x:.48, y:.441, visible:false, dip:0 };
    this.aim=.46;
    this.targetFish=null;
    this.hookedFish=null;
    this.charge=.18;
    this.tension=42;
    this.reeling=false;
    this.castAnimation=0;
    this.castElapsed=0;
    this.elapsed=0;
    this.rippleAge=0;
    this.reelAngle=0;
    this.rodSway=0;
    this.frame=0;
    this.lastSize={w:0,h:0};
    this.bubbles=Array.from({length:24},()=>({x:random(.07,.92),y:random(.48,.91),radius:random(1,3.2),speed:random(.012,.042),offset:random(0,7)}));
    // Unique sprite for each scientific species ID; never relabel another sprite.
    for(const s of species) {
      const img=new Image();
      img.decoding='async';
      img.src=`./assets/live-fish/${s.sprite}.webp`;
      this.images.set(s.id,img);
    }
    this.fish=species.map((s,i)=>this.spawn(s,i));
    this.fish.push(
      this.spawn(species[0],5),this.spawn(species[1],6),
      this.spawn(species[3],7),this.spawn(species[3],8),
      this.spawn(species[4],9),this.spawn(species[4],10),
      this.spawn(species[4],11),this.spawn(species[3],12),this.spawn(species[2],13)
    );
    this.resize();
    this.ro=new ResizeObserver(()=>this.resize());
    this.ro.observe(this.canvas.parentElement);
  }
  spawn(species,index) {
    const x= index%2 ? random(.48,.87) : random(.10,.49);
    const y=random(.55,.83);
    return {
      id:`${species.id}:${index}`,species,x,y,originY:y,
      direction: index%2 ? -1 : 1,
      speed:random(.018,.035)*(1+species.power*.25),
      size:clamp(.085+species.size[1]/480,.095,.255),
      state:'cruise',
      wanderX:random(.1,.9),wanderY:random(.56,.82),wanderClock:random(1,4),
      tailPhase:random(0,Math.PI*2),turn:0,interested:false,avoid:0,
      depth:random(.63,1.0),pulse:random(0,Math.PI*2)
    };
  }
  resize(){
    const rect=this.canvas.parentElement.getBoundingClientRect();
    const w=Math.max(10,rect.width),h=Math.max(10,rect.height);
    if(this.lastSize.w===w&&this.lastSize.h===h)return;
    this.lastSize={w,h};
    const dpr=Math.min(2,window.devicePixelRatio||1);
    for (const c of [this.canvas,this.rodCanvas]){
      c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);
      c.style.width=w+'px';c.style.height=h+'px';
      c.getContext('2d').setTransform(dpr,0,0,dpr,0,0);
    }
    this.dpr=dpr;
  }
  setAim(value){ this.aim=clamp(value,.18,.70); }
  chargeRod(power){this.phase='charging';this.charge=power;}
  cast(power,bait){
    this.phase='cast';this.charge=power;this.castAnimation=1;this.castElapsed=0;
    this.bobber.x=clamp(this.aim+(0.5-power)*.25,.20,.75);
    this.bobber.y=.435;this.bobber.visible=true;this.bobber.dip=0;
    this.rippleAge=0;
    this.targetFish=null;
    this.lastBait=bait;
    this.assignBiter(bait);
  }
  assignBiter(bait){
    if(this.phase!=='cast')return;
    const candidates=this.fish.filter(f=>f.state!=='hooked' && f.avoid<=0);
    if (!candidates.length)return;
    // Attraction matches prey class, wariness and distance. The actor MUST reach the lure.
    const ranked=candidates.map(f=>({f,score:Math.abs(f.x-this.bobber.x)*1.4+Math.abs(f.y-.50)*.35+
      (f.species.bait===bait?0:.24)+Math.random()*.12})).sort((a,b)=>a.score-b.score);
    this.targetFish=ranked[0].f;
    this.targetFish.state='investigate';
    this.targetFish.wanderClock=8;
    this.onFishActivity(this.targetFish.species);
  }
  hook(){
    if(this.phase!=='bite'||!this.targetFish)return null;
    this.phase='fight';
    this.hookedFish=this.targetFish;this.targetFish=null;
    this.hookedFish.state='hooked';this.tension=44;
    return this.hookedFish.species;
  }
  reel(on,tension){this.reeling=on;this.tension=tension;}
  clearCast(reason='retrieve'){
    if(this.hookedFish){this.hookedFish.state='recover';this.hookedFish.avoid=6;this.hookedFish=null;}
    if(this.targetFish){this.targetFish.state='recover';this.targetFish.avoid=4;this.targetFish=null;}
    this.bobber.visible=false;this.bobber.dip=0;this.phase='idle';this.reeling=false;
    this.lastExit=reason;
  }
  landed(){
    if(this.hookedFish){
      this.hookedFish.state='recover';this.hookedFish.avoid=8;
      this.hookedFish.x=clamp(this.hookedFish.x+random(-.07,.07),.10,.88);
    }
    this.phase='result';this.bobber.visible=false;this.reeling=false;
  }
  release(){this.hookedFish=null;this.phase='idle';this.targetFish=null;this.bobber.visible=false;}
  moveFish(f,tx,ty,dt,speedScale=1){
    const dx=tx-f.x,dy=ty-f.y;
    const distance=Math.hypot(dx*1.35,dy);
    if(distance<.001)return distance;
    const targetDirection=dx>=0?1:-1;
    if(Math.abs(dx)>.018)f.direction=targetDirection;
    const speed=f.speed*speedScale;
    const step=Math.min(distance,speed*dt);
    f.x=clamp(f.x+(dx/distance)*step,.035,.96);
    f.y=clamp(f.y+(dy/distance)*step*.73,.49,.90);
    return distance;
  }
  update(dt,time){
    this.elapsed+=dt;
    if(this.castAnimation>0)this.castAnimation=Math.max(0,this.castAnimation-dt*1.3);
    if(this.bobber.visible){this.castElapsed+=dt;this.rippleAge+=dt;}
    this.rodSway=Math.sin(this.elapsed*1.35)*.014;
    if(this.reeling)this.reelAngle+=dt*9;
    for(const f of this.fish){
      f.tailPhase+=dt*(4.7+f.speed*65);
      f.pulse+=dt;
      f.avoid=Math.max(0,f.avoid-dt);
      if(f===this.hookedFish){
        const kick=Math.sin(time*.005+f.pulse)*(.02+.025*f.species.power);
        f.x=clamp(f.x+kick*dt*((this.reeling ? .5 : 1))-dt*(this.reeling?.044:.002),.12,.9);
        f.y=clamp(f.y+Math.sin(time*.0032+f.tailPhase)*dt*.022,.49,.82);
        f.direction=Math.sin(time*.004+f.tailPhase)>0?1:-1;
      } else if(f===this.targetFish && this.phase==='cast'){
        const dist=this.moveFish(f,this.bobber.x,this.bobber.y+.058,dt,2.35);
        if(dist<.038 && this.castElapsed>1.5){
          f.state='bite';this.phase='bite';this.bobber.dip=1;
          this.onBite(f.species);
        }
      } else if(this.phase==='bite'&&f===this.targetFish){
        this.moveFish(f,this.bobber.x,this.bobber.y+.045,dt,.27);
      } else {
        f.wanderClock-=dt;
        if(f.wanderClock<=0||Math.hypot(f.x-f.wanderX,f.y-f.wanderY)<.04){
          f.wanderX=random(.07,.91);f.wanderY=random(.53,.86);f.wanderClock=random(3,8);
          if(f.state==='recover')f.state='cruise';
        }
        this.moveFish(f,f.wanderX,f.wanderY,dt,.9);
      }
    }
    if(this.phase==='cast' && !this.targetFish && this.castElapsed>1.8)this.assignBiter(this.lastBait);
    this.render(time);
  }
  render(time){
    const {w,h}=this.lastSize;
    if(w<12||h<12)return;
    const ctx=this.ctx;ctx.clearRect(0,0,w,h);
    // gentle animated caustic highlights, never embedded fish photography
    const quality=(window.matchMedia('(prefers-reduced-motion: reduce)').matches)?'low':'normal';
    ctx.save();ctx.globalAlpha=.12;ctx.strokeStyle='#8cfff4';ctx.lineWidth=1.4;
    const rows=quality==='low'?4:8;
    for(let row=0;row<rows;row++){
      const y=h*(.505+row*.043);
      const off=(time*.012+row*97)%(w*.33);
      for(let x=-w*.35+off;x<w;x+=w*.33){
        ctx.beginPath();ctx.ellipse(x,y,w*.07,h*.007,Math.sin(time*.0004+row)*.08,0,Math.PI*.78);ctx.stroke();
      }
    }
    ctx.restore();
    for(const bubble of this.bubbles){
      const yy=(bubble.y-(this.elapsed*bubble.speed) % .44);
      const y2=yy<.48?yy+.44:yy;
      const x=(bubble.x+Math.sin(this.elapsed*.9+bubble.offset)*.01)*w;
      ctx.globalAlpha=.16+Math.sin(this.elapsed*2+bubble.offset)*.08;
      ctx.strokeStyle='#d6fffc';ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(x,y2*h,bubble.radius,0,Math.PI*2);ctx.stroke();
    }
    ctx.globalAlpha=1;
    for(const f of this.fish.slice().sort((a,b)=>a.depth-b.depth))this.drawFish(ctx,f,w,h);
    this.drawRod(this.rodCtx,w,h,time);
    this.frame++;
  }
  drawFish(ctx,f,w,h){
    const img=this.images.get(f.species.id);
    if(!img?.complete||!img.naturalWidth)return;
    const size=w*f.size*f.depth;
    const width=clamp(size,26,w*.34);
    const height=width*.52; // preserve morphology instead of stretching to viewport height
    const px=f.x*w,py=f.y*h+Math.sin(f.tailPhase*.42)*Math.max(1,h*.002);
    ctx.save();ctx.translate(px,py);ctx.scale(f.direction,1);
    ctx.rotate(Math.sin(f.tailPhase)*.034);
    ctx.scale(1+.025*Math.sin(f.tailPhase*1.22),1+.028*Math.cos(f.tailPhase));
    // Submerged light/shadow and species texture directly in the simulation.
    ctx.shadowBlur=7;ctx.shadowColor='rgba(0,20,38,.45)';
    ctx.globalAlpha=clamp(.80*f.depth,.45,.96);
    // Tiny articulated strip mesh: the tail bends while the fish swims.
    // Each actor owns its motion; no static photograph can play this animation.
    const slices=9;
    for(let slice=0;slice<slices;slice++){
      const t=slice/slices;
      const sx=img.naturalWidth*t,sw=img.naturalWidth/slices+.2;
      const wiggle=Math.sin(f.tailPhase+slice*.44)*(1-t)*(1-t)*height*.12;
      const dx=-width/2+t*width;
      ctx.drawImage(img,sx,0,Math.min(sw,img.naturalWidth-sx),img.naturalHeight,dx,-height/2+wiggle,width/slices+.6,height);
    }
    ctx.restore();
  }
  drawRod(ctx,w,h,time){
    ctx.clearRect(0,0,w,h);
    const PI=Math.PI;
    // Rod anchor is independent of the scenic image and never painted into it.
    let tipX=w*(.588+this.rodSway), tipY=h*(.246+this.rodSway*.5);
    let bendX=0,bendY=0;
    if(this.phase==='charging'){
      tipX+=w*(.090+this.charge*.064);tipY+=h*(.045+this.charge*.025);
      bendX=w*.028;
    } else if(this.castAnimation>0){
      const p=this.castAnimation;
      const swing=Math.sin((1-p)*Math.PI*1.6);
      tipX-=w*(.095*swing);tipY-=h*(.067*Math.abs(swing));
      bendX=w*.04*swing;
    } else if(this.phase==='fight'){
      const strength=clamp(this.tension/100,0,1);
      bendX-=w*(.09*strength+.018*Math.sin(time*.014));
      bendY+=h*(.032*strength+.01*Math.sin(time*.011));
    }
    tipX+=bendX;tipY+=bendY;
    const baseX=w*.90,baseY=h*.994;
    const controlX=mix(baseX,tipX,.57)+w*.022;
    const controlY=mix(baseY,tipY,.55)+h*.012;
    const point=t=>({
      x:(1-t)**2*baseX+2*(1-t)*t*controlX+t*t*tipX,
      y:(1-t)**2*baseY+2*(1-t)*t*controlY+t*t*tipY
    });
    ctx.save();
    ctx.lineCap='round';ctx.lineJoin='round';
    // cork handle pointing beyond lower edge, dark contours and actual metallic collar
    ctx.save();ctx.translate(baseX,baseY);ctx.rotate(-.40);
    const cork=ctx.createLinearGradient(-15,0,20,0);
    cork.addColorStop(0,'#302515');cork.addColorStop(.21,'#95662d');cork.addColorStop(.52,'#d7b274');cork.addColorStop(.74,'#8e6636');cork.addColorStop(1,'#1e241e');
    ctx.fillStyle=cork;ctx.shadowColor='#00151eaa';ctx.shadowBlur=10;
    ctx.fillRect(-14,-13,29,h*.33);
    for(let i=0;i<12;i++){
      ctx.strokeStyle=i%2?'#68482680':'#ead19d70';ctx.lineWidth=1.4;
      const y=i*13;ctx.beginPath();ctx.moveTo(-12,y);ctx.lineTo(14,y+4);ctx.stroke();
    }
    ctx.restore();
    // tapering graphite rod with swept curve and reflective coating
    for(let i=0;i<40;i++){
      const a=point(i/40),b=point((i+1)/40),t=i/40;
      ctx.lineWidth= Math.max(2.5,23*(1-t)+1.8);ctx.strokeStyle='#0b1721';
      ctx.shadowBlur=7;ctx.shadowColor='#0017298a';
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      ctx.lineWidth=Math.max(.75,5*(1-t));ctx.strokeStyle='#548199aa';
      ctx.beginPath();ctx.moveTo(a.x-2,a.y);ctx.lineTo(b.x-1,b.y);ctx.stroke();
    }
    ctx.shadowBlur=0;
    // rings/ferrules distributed along the changing rod geometry
    for(let t=.13;t<1;t+=.14){
      const p=point(t),n=point(Math.min(1,t+.006));
      const angle=Math.atan2(n.y-p.y,n.x-p.x);
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(angle);
      ctx.strokeStyle='#d9c58e';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-7*(1-t)-3);ctx.lineTo(0,8*(1-t)+3);ctx.stroke();
      ctx.strokeStyle='#d7e7eb';ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(0,0,2.8,7*(1-t)+2,0,0,PI*2);ctx.stroke();ctx.restore();
    }
    // Active spinning reel below middle shaft, independent rotation when reeling
    const reel=point(.11);const rx=reel.x-26,ry=reel.y+9;
    ctx.save();ctx.translate(rx,ry);ctx.rotate(.13);
    ctx.shadowColor='#000e1b9e';ctx.shadowBlur=12;
    let metal=ctx.createRadialGradient(-8,-8,7,0,0,44);
    metal.addColorStop(0,'#afd5e8');metal.addColorStop(.23,'#356a86');metal.addColorStop(.48,'#061a2d');metal.addColorStop(.64,'#c2b188');metal.addColorStop(.83,'#0e2535');metal.addColorStop(1,'#020e17');
    ctx.fillStyle=metal;ctx.beginPath();ctx.ellipse(0,0,42,32,0,0,PI*2);ctx.fill();
    ctx.shadowBlur=0;ctx.save();ctx.rotate(this.reelAngle);
    for(let a=0;a<6;a++){ctx.rotate(PI/3);ctx.strokeStyle='#a3c6c8ad';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(21,0);ctx.stroke();}
    ctx.restore();
    ctx.fillStyle='#121e29';ctx.beginPath();ctx.arc(0,0,12,0,PI*2);ctx.fill();
    ctx.strokeStyle='#d9c08e';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,27,0,PI*2);ctx.stroke();
    ctx.restore();
    // The animated fishing line is physically attached to the moving tip.
    if(this.bobber.visible){
      let tx=this.bobber.x*w,ty=this.bobber.y*h;
      // bobber leaves rod on an actual parabolic cast trajectory
      const flight=clamp(this.castElapsed/.78,0,1);
      if(flight<1){
        tx=mix(tipX,tx,flight);ty=mix(tipY,ty,flight)-h*.17* Math.sin(PI*flight);
      } else ty+=Math.sin(this.elapsed*4.2)*2 + (this.bobber.dip?11:0);
      ctx.strokeStyle='rgba(244,255,252,.88)';ctx.lineWidth=1.4;
      ctx.beginPath();ctx.moveTo(tipX,tipY);
      const sag=this.phase==='fight'?h*.012:h*.031;
      ctx.quadraticCurveTo(mix(tipX,tx,.52),mix(tipY,ty,.5)+sag,tx,ty);ctx.stroke();
      if(flight>=1){
        const r=(this.rippleAge*14)%23;
        for(let k=0;k<2;k++){
          const a=(r+k*11)%27;ctx.strokeStyle=`rgba(203,255,255,${Math.max(0,(.40-a/85)).toFixed(2)})`;
          ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(tx,ty+4,a*1.8,a*.45,0,0,PI*2);ctx.stroke();
        }
      }
      // float with red tip and white lower half
      ctx.save();ctx.translate(tx,ty);ctx.fillStyle='#f0f0d9';ctx.shadowColor='#061d2c';ctx.shadowBlur=5;
      ctx.beginPath();ctx.ellipse(0,4,6,11,0,0,PI*2);ctx.fill();
      ctx.fillStyle='#e73e2a';ctx.beginPath();ctx.ellipse(0,-2,6,6,0,PI,PI*2);ctx.fill();
      ctx.strokeStyle='#263743';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(0,-16);ctx.stroke();ctx.restore();
    }
    ctx.restore();
  }
  getDebug(){
    return {
      phase:this.phase,frames:this.frame,fishCount:this.fish.length,
      fish:this.fish.map(f=>({id:f.id,x:f.x,y:f.y,state:f.state})),
      rod:{dynamic:true,tipBend:this.phase,angle:this.reelAngle},
      bobber:{...this.bobber}, targetId:this.targetFish?.id??null,
      separateLayers:true
    };
  }
}
