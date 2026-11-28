/* Octopus arms · Fly 2.0: the pilot world. You walk the wearer round a workshop and work three jobs with a pilot interface.
   Load after fly.js. It wraps T.createFly, so ui/topic.js and register.js need no change. world.js draws the workshop.
   Physics: every posture goes through core.evaluate(). The ladder and the stumble replay the Launch keyframes (T.at), driven by your stick.
   Simplified: walking is a scripted gait solved as a series of still postures (no momentum); walls and benches simply stop you;
   the trip and its catch window are game rules, and the stumble is slowed down.
   Controls: left side of the screen = stick, right side = drag to look. Keyboard: WASD or arrows, Space action, Shift careful, Q/E reach, C view.
   Gamepad: left stick, A action, B careful, X view, LB/RB reach. */
(function(){
const T=(window.HV.T=window.HV.T||{}).octopus=window.HV.T.octopus||{};
const {PI,clamp,POSES,REFTIPS,evaluate,skeleton}=T;
const DN=[0,-1,0],B2=.16,B4=.46,B7=.82,B8=.94;               /* Launch phase borders, from mission.js weights */
const CU0=B2+.03,CU1=B4-.005,HANGU=.41,TU0=B7,TUC=.855,TU1=B8-.005;
const SPEED=1,TURNR=1.9,CY=1.15,DMIN=.4,DMAX=1.15,TIPV=1.4,CATCHT=1.4,BEST='hv-octo-pilot-best';

/* the workshop, world metres. x = wearer's left at the start, z = ahead */
const MAP={half:4,
 benches:[{x:0,z:2,h:.9},{x:-.2,z:-2.3,h:.9}],
 crates:[{x:0,y:.9,z:2,kg:1},{x:-.2,y:.9,z:-2.3,kg:5}],
 pads:[{x:2.5,z:1.9},{x:2.7,z:-2}],
 cable:{x:1.25,z0:-3.6,z1:-.7},
 ladder:{x:-2.6,z:.4,h:PI/2}};

const l2w=(f,v)=>[f.x+v[0]*Math.cos(f.h)+v[2]*Math.sin(f.h),v[1],f.z-v[0]*Math.sin(f.h)+v[2]*Math.cos(f.h)];
const w2l=(f,w)=>{const dx=w[0]-f.x,dz=w[2]-f.z;return[dx*Math.cos(f.h)-dz*Math.sin(f.h),w[1],dx*Math.sin(f.h)+dz*Math.cos(f.h)]};
const lerp=(a,b,g)=>a+(b-a)*g,lv=(a,b,g)=>[lerp(a[0],b[0],g),lerp(a[1],b[1],g),lerp(a[2],b[2],g)];
const wrap=a=>((a+PI)%(2*PI)+2*PI)%(2*PI)-PI,ease=g=>.5-.5*Math.cos(PI*g);
const HOME=a=>[a%2?-.32:.32,0,-.22];
const loadBest=()=>{try{return +localStorage.getItem(BEST)||0}catch(e){return 0}};
const saveBest=v=>{try{localStorage.setItem(BEST,String(v))}catch(e){}};

function createPilot(){
 const P={};let W,up,st,ev,props,trans,solveT,over,qs=[null,null,null,null];
 const input={x:0,y:0,careful:false};
 const crateHome=()=>MAP.crates.map(c=>({x:c.x,y:c.y,z:c.z,kg:c.kg,done:false}));

 function reset(){
  W={x:0,z:0,h:0,phase:0,v:0,turn:0};
  up=[0,1].map(a=>({tip:REFTIPS[a].slice()}));
  Object.assign(P,{mode:'walk',t:0,job:0,carry:-1,grab:0,d:.7,u:CU0,hang:0,climbed:false,msg:'',msgT:0,tripT:0,caught:false,cool:0,best:loadBest(),crates:crateHome()});
  trans=null;st=null;ev=null;props=[];solveT=1;over=0;qs=[null,null,null,null];
  walkState(0);solve()}
 const say=(m,s)=>{P.msg=m;P.msgT=s||3};

 /* ---------- the walking posture ---------- */
 function walkPose(){const k=Math.min(1,W.v/SPEED),s=Math.sin(W.phase)*k,c=Math.cos(W.phase)*k;
  return Object.assign({},POSES.stand,{lean:5*k,thL:12*s,thR:-12*s,knL:Math.max(0,10*c),knR:Math.max(0,-10*c),uaL:4-15*s,uaR:4+15*s,pz:0})}
 function walkState(dt){
  const arms=[];
  for(let a=0;a<2;a++){
   const c=P.carry>=0?P.crates[P.carry]:null;let tg=REFTIPS[a];
   if(c){const side=a?-.2:.2;tg=P.grab===1?(()=>{const l=w2l(W,[c.x,c.y+.15,c.z]);return[l[0]+side,l[1],l[2]]})():[side,CY,P.d]}
   const t=up[a].tip,d=Math.hypot(tg[0]-t[0],tg[1]-t[1],tg[2]-t[2]),m=Math.min(1,TIPV*dt/(d||1));
   up[a].tip=lv(t,tg,m);up[a].left=d*(1-m);
   arms.push({tip:up[a].tip.slice(),tool:'pincer',dir:null,load:c&&P.grab===2?c.kg/2:0,hold:false})}
  if(P.grab===1&&up[0].left<.03&&up[1].left<.03)P.grab=2;
  /* lower arms: tripod feet stay under the body and take short alternate steps. Longer strides put the loaded arm far past its limit */
  const k=Math.min(1,W.v/SPEED+W.turn*.5);
  [2,3].forEach(a=>{const h=HOME(a),ph=W.phase+(a===3?PI:0);
   arms.push({tip:[h[0],.025*Math.max(0,Math.sin(ph))*k,h[2]+.05*Math.cos(ph)*k],tool:'foot',dir:DN,load:0,hold:false})});
  st={pose:walkPose(),arms:arms};props=[]}
 /* same solve as fly.js: warm start from the last answer (not for gripping or floor feet), and if any arm misses its tip, start cold with more iterations */
 function solve(){
  st.arms.forEach((r,a)=>{const loaded=r.hold||(r.tool==='foot'&&r.tip[1]<.06);r.q=(!loaded&&qs[a])?qs[a].slice():null});
  ev=evaluate(st,{iter:50});
  if(ev.arms.some(r=>r.sol&&r.sol.err>.03)){st.arms.forEach(r=>{r.q=null});ev=evaluate(st,{iter:140})}
  st.arms.forEach((r,a)=>{qs[a]=r.q?r.q.slice():null});solveT=0}

 /* ---------- moving between the free walk and a Launch segment ---------- */
 const snap=()=>({f:{x:W.x,z:W.z,h:W.h},pose:st.pose,arms:st.arms.map(r=>Object.assign({},r))});
 function go(to,dur,then){trans={a:snap(),b:to,g:0,dur:dur,then:then};P.mode='move'}
 function moveStep(dt){
  const tr=trans;tr.g=Math.min(1,tr.g+dt/tr.dur);const g=ease(tr.g),a=tr.a,b=tr.b;
  W.x=lerp(a.f.x,b.f.x,g);W.z=lerp(a.f.z,b.f.z,g);W.h=a.f.h+wrap(b.f.h-a.f.h)*g;
  st={pose:T.blendPose(a.pose,b.pose,g),arms:a.arms.map((r,i)=>{const s=b.arms[i];return{tip:lv(r.tip,s.tip,g),tool:g<.5?r.tool:s.tool,dir:g<.5?r.dir:s.dir,load:0,hold:g>.995&&s.hold}})};
  if(solveT>.05||tr.g>=1)solve();
  if(tr.g>=1){trans=null;tr.then()}}
 function scripted(u){const r=T.at(u);st=r.state;ev=r.ev;props=r.props;solveT=0;return r}
 function toWalk(f){
  const keep={x:W.x,z:W.z,h:W.h};Object.assign(W,f,{v:0,phase:0,turn:0});
  const home=[0,1,2,3].map(a=>a<2?{tip:REFTIPS[a].slice(),tool:'pincer',dir:null,load:0,hold:false}:{tip:HOME(a),tool:'foot',dir:DN,load:0,hold:false});
  const target={f:{x:f.x,z:f.z,h:f.h},pose:walkPose(),arms:home};Object.assign(W,keep);
  go(target,.9,()=>{P.mode='walk';up=[0,1].map(a=>({tip:REFTIPS[a].slice()}));walkState(0);solve()})}

 /* ---------- things you can do right now ---------- */
 const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
 const heldAt=()=>{const m=lv(st.arms[0].tip,st.arms[1].tip,.5),w=l2w(W,m);return{x:w[0],y:w[1],z:w[2]}};
 function nearCrate(){let k=-1;P.crates.forEach((c,i)=>{if(c.done)return;const l=w2l(W,[c.x,c.y,c.z]);if(Math.abs(l[0])<.4&&l[2]>.3&&l[2]<1.2)k=i});return k}
 function actionName(){
  if(P.mode==='over')return'Try again';
  if(P.mode==='done')return'Restart';
  if(P.mode==='trip')return P.caught?'':'CATCH';
  if(P.mode!=='walk')return'';
  if(P.carry>=0){if(P.grab<2)return'';return dist(heldAt(),MAP.pads[P.carry])<.5?'Set down':'Put back'}
  if(nearCrate()>=0)return'Grab '+P.crates[nearCrate()].kg+' kg';
  if(dist(W,MAP.ladder)<1)return'Climb';
  return''}
 function action(){
  const n=actionName();if(!n)return;
  if(n==='Restart'){reset();return}
  if(n==='Try again'){Object.assign(W,P.safe,{v:0,phase:0,turn:0});up=[0,1].map(a=>({tip:REFTIPS[a].slice()}));P.mode='walk';P.msgT=0;P.cool=0;walkState(0);solve();return}
  if(n==='CATCH'){P.caught=true;say('Caught it. The upper arms drop to the floor.',3);return}
  if(n==='Climb'){const r=T.at(CU0);go({f:Object.assign({},MAP.ladder),pose:r.state.pose,arms:r.state.arms},1.6,()=>{P.mode='climb';P.u=CU0;scripted(CU0)});return}
  if(n.indexOf('Grab')===0){const k=nearCrate(),c=P.crates[k];P.carry=k;P.grab=1;P.d=clamp(w2l(W,[c.x,c.y,c.z])[2],DMIN,.8);return}
  const k=P.carry,c=P.crates[k];
  if(n==='Set down'){const pad=MAP.pads[k];c.x=pad.x;c.z=pad.z;c.y=0;c.done=true;P.carry=-1;P.grab=0;say('Delivered '+c.kg+' kg.',3);nextJob()}
  else{putBack();say('Crate back on its bench.',2)}}
 function putBack(){if(P.carry<0)return;const c=P.crates[P.carry],h=MAP.crates[P.carry];c.x=h.x;c.y=h.y;c.z=h.z;P.carry=-1;P.grab=0}
 function nextJob(){
  const ok=[P.crates[0].done,P.climbed,P.crates[1].done];let j=0;while(j<3&&ok[j])j++;P.job=j;
  if(j===3){P.mode='done';const s=Math.round(P.t);if(!P.best||s<P.best){P.best=s;saveBest(s)}say('All three jobs done in '+s+' s. Best '+P.best+' s.',1e9)}}

 /* ---------- one step, real seconds ---------- */
 function update(dt){
  dt=Math.min(dt,.05);solveT+=dt;
  if(P.msgT>0)P.msgT-=dt;
  if(P.mode==='over'||P.mode==='done')return;
  P.t+=dt;P.cool=Math.max(0,P.cool-dt);
  if(P.mode==='move'){moveStep(dt);return}
  if(P.mode==='climb'){
   P.u=clamp(P.u+input.y*dt*(CU1-CU0)/(input.careful?24:12),CU0,CU1);
   if(solveT>.04)scripted(P.u);
   if(P.u>=HANGU){P.hang+=dt;if(P.hang>2&&!P.climbed){P.climbed=true;say('Hanging on two arms. Pull the stick down to climb back.',4);nextJob()}}else P.hang=0;
   if(P.u<=CU0+1e-6&&input.y<-.3&&P.mode==='climb'){const o=Object.assign({},MAP.ladder),w=l2w(o,[0,0,.25]);toWalk({x:w[0],z:w[2],h:o.h})}
   return}
  if(P.mode==='trip'){
   P.tripT+=dt;
   if(P.tripT<=CATCHT)P.u=lerp(TU0,TUC,P.tripT/CATCHT);
   else if(!P.caught){P.mode='over';say('You fell. Cross the cable carefully, or press CATCH sooner.',1e9);return}
   else P.u=Math.min(TU1,lerp(TUC,TU1,(P.tripT-CATCHT)/2.4));
   if(solveT>.04){const r=T.at(P.u);st=r.state;ev=r.ev;props=[];solveT=0}
   if(P.u>=TU1){W.x=MAP.cable.x+P.side*.5;const w=l2w(W,[0,0,st.pose.pz||0]),z=w[2];const o={x:W.x,z:W.z,h:W.h};
    /* re-express the final crouch about the wearer, so the stand-up starts where the catch ended */
    st={pose:Object.assign({},st.pose,{pz:0}),arms:st.arms.map(r=>Object.assign({},r,{tip:[r.tip[0],r.tip[1],r.tip[2]-(st.pose.pz||0)]}))};
    W.z=z;toWalk({x:W.x,z:W.z,h:o.h})}
   return}
  /* walk */
  const slow=input.careful?.45:1,fwd=clamp(input.y,-.6,1)*slow,turn=clamp(input.x,-1,1);
  W.h=wrap(W.h-turn*TURNR*dt);
  const v=fwd*SPEED,ox=W.x,oz=W.z;
  let nx=clamp(W.x+Math.sin(W.h)*v*dt,-MAP.half,MAP.half),nz=clamp(W.z+Math.cos(W.h)*v*dt,-MAP.half,MAP.half);
  MAP.benches.forEach(b=>{const dx=nx-b.x,dz=nz-b.z,d=Math.hypot(dx,dz);if(d<.55){nx=b.x+dx*.55/(d||1);nz=b.z+dz*.55/(d||1)}});
  W.x=nx;W.z=nz;W.v=Math.abs(v);W.turn=Math.abs(turn);W.phase+=Math.max(W.v,Math.abs(turn)*.3)*dt*6.5;
  const c=MAP.cable,side0=Math.sign(ox-c.x),side1=Math.sign(nx-c.x);
  if(side0&&side1&&side0!==side1&&nz>c.z0&&nz<c.z1&&!P.cool){
   if(Math.abs(v)>.55*SPEED){const had=P.carry>=0;putBack();P.safe={x:c.x+side0*.5,z:oz,h:W.h};
    P.mode='trip';P.tripT=0;P.caught=false;P.u=TU0;P.cool=5;P.side=side1;
    const h=side1>0?PI/2:-PI/2,pz=T.STAGE.PZ;W.h=h;W.x=c.x-Math.sin(h)*pz;W.z=oz;W.v=0;
    say(had?'Tripped! The crate went back to its bench. CATCH!':'Tripped! Press CATCH!',CATCHT);const r=T.at(TU0);st=r.state;ev=r.ev;props=[];return}
   P.cool=.6;say('Stepped over the cable.',1.5)}
  walkState(dt);
  if(solveT>.04){solve()}
  /* limits: only a carried load can end a lift. A short spike while stepping is forgiven */
  if(P.grab===2&&(ev.util>1||ev.spine.util>1)){over+=dt;if(over>.5){over=0;putBack();say('Overload. The arms let go. Hold heavy loads closer.',4)}}else over=Math.max(0,over-dt)}

 function target(){
  if(P.job>=3)return null;
  if(P.job===1)return{x:MAP.ladder.x,z:MAP.ladder.z,text:'Climb to the ledge and hang for 2 s'};
  const k=P.job===0?0:1,c=P.crates[k];
  return P.carry===k?{x:MAP.pads[k].x,z:MAP.pads[k].z,text:'Carry the '+c.kg+' kg crate to the ringed pad'}:{x:c.x,z:c.z,text:'Pick up the '+c.kg+' kg crate'+(k?' (mind the cable)':'')}}
 const reach=d=>{if(P.mode==='walk'&&P.carry>=0)P.d=clamp(P.d+d,DMIN,DMAX)};
 function centre(){const w=l2w(W,[ev.sk.hip[0],0,ev.sk.hip[2]]);return{x:w[0],z:w[2]}}
 function view(){
  const cr=P.crates.map((c,i)=>{if(P.carry===i&&P.grab===2){const h=heldAt();return{x:h.x,y:h.y-.2,z:h.z,h:W.h,kg:c.kg}}return{x:c.x,y:c.y,z:c.z,h:0,kg:c.kg}});
  return{state:st,ev:ev,props:props,pose:'stand',sel:0,t:P.t,
   pilot:{x:W.x,z:W.z,h:W.h,c:centre(),map:MAP,crates:cr,target:target(),station:P.mode==='climb'}}}

 reset();
 return{P:P,W:W,input:input,MAP:MAP,reset:reset,update:update,action:action,actionName:actionName,reach:reach,target:target,view:view,
  where:()=>({x:W.x,z:W.z,h:W.h}),ev:()=>ev}
}

/* ================= the pilot interface (DOM). One shared overlay; it closes by itself when the Fly tab stops being drawn ================= */
let host=null,quiet=0,ui=null,err='';
const CAMS=[{n:'Chase',yaw:0,tilt:.3,zoom:.8},{n:'Side',yaw:-PI/2,tilt:.15,zoom:.85},{n:'Wide',yaw:0,tilt:.65,zoom:.48}];
const CSS='body.hvp-on .hvp-go{display:none}'+
'.hvp-go{position:fixed;right:12px;top:calc(64px + env(safe-area-inset-top));z-index:9000;padding:10px 16px;border-radius:22px;border:1px solid #ff9d4a;background:#1a1008ee;color:#ffd9b0;font:600 14px system-ui}'+
'body.hvp-on .tpg *:not(canvas){visibility:hidden!important}body.hvp-on canvas{visibility:visible!important}'+
'.hvp{position:fixed;inset:0;z-index:9001;touch-action:none;user-select:none;-webkit-user-select:none;color:#e8f6ff;font:13px system-ui}'+
'.hvp button{touch-action:none;border:1px solid #5df2ff88;background:#08141ccc;color:#e8f6ff;border-radius:22px;padding:11px 14px;font:600 14px system-ui}'+
'.hvp button.on{background:#5df2ff;color:#04121a}.hvp .top{position:absolute;left:12px;right:12px;top:calc(10px + env(safe-area-inset-top));display:flex;justify-content:space-between;gap:8px}'+
'.hvp .card{position:absolute;left:12px;right:12px;top:calc(62px + env(safe-area-inset-top));background:#08141ccc;border-radius:12px;padding:9px 12px;line-height:1.5;max-width:420px;pointer-events:none}'+
'.hvp .arrow{display:inline-block;color:#ffb35c;font-size:18px;margin-right:6px}.hvp .msg{color:#ffd24d;font-weight:600}'+
'.hvp .stick{position:absolute;width:112px;height:112px;margin:-56px;border-radius:50%;border:2px solid #5df2ff66;pointer-events:none}'+
'.hvp .stick i{position:absolute;left:34px;top:34px;width:44px;height:44px;border-radius:50%;background:#5df2ffaa}'+
'.hvp .pad{position:absolute;right:12px;bottom:calc(18px + env(safe-area-inset-bottom));display:flex;flex-direction:column;align-items:flex-end;gap:10px}'+
'.hvp .act{min-width:108px;padding:20px;border-color:#ff9d4a;background:#3a1d08dd;font-size:17px}.hvp .row{display:flex;gap:8px}';

function open(){
 if(ui||!host)return;
 const pl=host.pilot,el=document.createElement('div');el.className='hvp';
 el.innerHTML='<div class="top"><button data-k="exit">✕ Exit</button><button data-k="cam"></button></div><div class="card"></div><div class="stick"><i></i></div>'+
  '<div class="pad"><div class="row reach"><button data-k="in">Reach −</button><button data-k="outw">Reach +</button></div><button data-k="slow">Careful</button><button class="act" data-k="act"></button></div>';
 document.body.appendChild(el);document.body.classList.add('hvp-on');
 const q=s=>el.querySelector(s),card=q('.card'),stick=q('.stick'),nub=q('.stick i'),act=q('.act'),slow=q('[data-k=slow]'),camB=q('[data-k=cam]'),rr=q('.reach');
 let mv=null,look=null,cam=0,lookY=0,lookT=0,yaw=null,careful=false,last=performance.now(),raf=0,html='',padPrev=[];
 const keys={},held={in:0,outw:0},home=()=>{stick.style.left='78px';stick.style.top=(innerHeight-110)+'px';nub.style.transform=''};home();
 const press=k=>{if(k==='exit')close();else if(k==='cam'){cam=(cam+1)%CAMS.length;lookY=lookT=0}else if(k==='slow')careful=!careful;else if(k==='act')pl.action()};
 el.addEventListener('pointerdown',e=>{
  e.preventDefault();const b=e.target.closest('button');
  if(b){const k=b.dataset.k;if(k in held){held[k]=e.pointerId}else press(k);return}
  try{el.setPointerCapture(e.pointerId)}catch(_){}
  if(!mv&&e.clientX<innerWidth*.55){mv={id:e.pointerId,x:e.clientX,y:e.clientY,dx:0,dy:0};stick.style.left=e.clientX+'px';stick.style.top=e.clientY+'px'}
  else if(!look)look={id:e.pointerId,x:e.clientX,y:e.clientY}});
 el.addEventListener('pointermove',e=>{
  if(mv&&e.pointerId===mv.id){let dx=(e.clientX-mv.x)/50,dy=(e.clientY-mv.y)/50;const l=Math.hypot(dx,dy);if(l>1){dx/=l;dy/=l}mv.dx=dx;mv.dy=dy;nub.style.transform='translate('+dx*40+'px,'+dy*40+'px)'}
  else if(look&&e.pointerId===look.id){lookY+=(e.clientX-look.x)*.008;lookT=clamp(lookT+(e.clientY-look.y)*.004,-.3,.5);look.x=e.clientX;look.y=e.clientY}});
 const end=e=>{if(mv&&mv.id===e.pointerId){mv=null;home()}if(look&&look.id===e.pointerId)look=null;for(const k in held)if(held[k]===e.pointerId)held[k]=0};
 window.addEventListener('pointerup',end);window.addEventListener('pointercancel',end);
 const kd=e=>{const k=e.key.toLowerCase();if([' ','arrowup','arrowdown','arrowleft','arrowright'].indexOf(k)>=0)e.preventDefault();
  if(!e.repeat){if(k===' ')pl.action();if(k==='c')press('cam');if(k==='escape')close()}keys[k]=1};
 const ku=e=>{keys[e.key.toLowerCase()]=0},blur=()=>{for(const k in keys)keys[k]=0;mv=look=null;held.in=held.outw=0;home()};
 window.addEventListener('keydown',kd,true);window.addEventListener('keyup',ku,true);window.addEventListener('blur',blur);
 function frame(now){
  raf=requestAnimationFrame(frame);const dt=Math.min(.05,(now-last)/1000);last=now;
  let x=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),y=(keys.w||keys.arrowup?1:0)-(keys.s||keys.arrowdown?1:0),rch=(keys.e||held.outw?1:0)-(keys.q||held.in?1:0),sl=careful||!!keys.shift;
  if(mv){x=mv.dx;y=-mv.dy}
  const gp=navigator.getGamepads?Array.from(navigator.getGamepads()).find(g=>g):null;
  if(gp){const dz=v=>Math.abs(v||0)<.18?0:v,bt=gp.buttons.map(b=>b.pressed),hit=i=>bt[i]&&!padPrev[i];
   if(dz(gp.axes[0]))x=gp.axes[0];if(dz(gp.axes[1]))y=-gp.axes[1];if(hit(0))pl.action();if(hit(1))press('slow');if(hit(2))press('cam');rch+=(bt[5]?1:0)-(bt[4]?1:0);padPrev=bt}
  if(!ui)return;
  pl.input.x=x;pl.input.y=y;pl.input.careful=sl;if(rch)pl.reach(rch*dt*.5);try{pl.update(dt)}catch(e){fault(e);return}
  const P=pl.P,C=CAMS[cam],h=pl.where().h,want=PI-h+C.yaw;
  yaw=yaw===null?want:yaw+wrap(want-yaw)*Math.min(1,dt*(P.mode==='walk'?3.5:2));
  host.cam={yaw:yaw+lookY,tilt:C.tilt+lookT,zoom:C.zoom};
  const tg=pl.target(),ev=pl.ev(),w=pl.where(),b=ev.balance,name=pl.actionName();
  let s='';
  if(tg){const dx=tg.x-w.x,dz=tg.z-w.z,ang=PI-(Math.atan2(dx,dz)+yaw+lookY);s+='<div><span class="arrow" style="transform:rotate('+ang.toFixed(2)+'rad)">▲</span><b>Job '+(P.job+1)+'/3:</b> '+tg.text+' · '+Math.hypot(dx,dz).toFixed(1)+' m</div>'}
  s+='<div>Time '+Math.floor(P.t)+' s'+(P.best?' · best '+P.best+' s':'')+' · arms '+Math.round(ev.util*100)+'% · straps '+Math.round(ev.spine.util*100)+'%'+(b.mode==='stand'&&P.mode==='walk'?' · balance '+Math.round(b.margin*100)+' cm':'')+'</div>';
  if(P.carry>=0)s+='<div>Carrying '+P.crates[P.carry].kg+' kg at '+Math.round(P.d*100)+' cm</div>';
  if(P.mode==='climb')s+='<div>Stick up to climb, down to return. '+(P.u>=HANGU?'Hanging '+Math.min(2,P.hang).toFixed(1)+' s':Math.round((P.u-CU0)/(HANGU-CU0)*100)+'% to the ledge')+'</div>';
  if(P.msgT>0)s+='<div class="msg">'+P.msg+'</div>';
  if(s!==html){card.innerHTML=s;html=s}
  const label=name||'·';if(act.textContent!==label)act.textContent=label;act.style.opacity=name?1:.35;
  if(camB.textContent!=='View: '+C.n)camB.textContent='View: '+C.n;
  slow.classList.toggle('on',sl);rr.style.visibility=P.carry>=0?'':'hidden'}
 ui={el:el,close:()=>{cancelAnimationFrame(raf);pl.input.x=pl.input.y=0;window.removeEventListener('pointerup',end);window.removeEventListener('pointercancel',end);
  window.removeEventListener('keydown',kd,true);window.removeEventListener('keyup',ku,true);window.removeEventListener('blur',blur);el.remove();document.body.classList.remove('hvp-on')}};
 host.active=true;frame(last)}
function fault(e){err=String(e&&e.message||e).slice(0,80);if(typeof console!=='undefined')console.error('pilot',e);close();if(goBtn)goBtn.textContent='🕹 Pilot world (error: '+err+')'}
function close(){if(ui){const u=ui;ui=null;u.close()}if(host)host.active=false}

let goBtn=null,watch=0;
function beat(h){
 if(typeof document==='undefined')return;
 if(host!==h){close();host=h}
 quiet=0;
 if(!goBtn){
  if(!document.getElementById('hvp-css')){const s=document.createElement('style');s.id='hvp-css';s.textContent=CSS;document.head.appendChild(s)}
  goBtn=document.createElement('button');goBtn.className='hvp-go';goBtn.textContent='🕹 Pilot world';goBtn.onclick=open;document.body.appendChild(goBtn);
  const tick=()=>{if(++quiet>20){close();goBtn.remove();goBtn=null;host=null;return}watch=requestAnimationFrame(tick)};watch=requestAnimationFrame(tick)}}

/* give every Fly model a pilot world: while it is open, the old model waits and view() shows the workshop */
const base=T.createFly;
T.createFly=function(){
 const f=base.apply(this,arguments),view=f.view,step=f.step;
 const h={active:false,cam:null,pilot:createPilot()};
 f.step=function(dt){if(!h.active)step.call(f,dt)};
 f.view=function(){if(h.active){try{const v=h.pilot.view();v.pilot.cam=h.cam;v.pilotHost=h;return v}catch(e){fault(e)}}const v=view.call(f);v.pilotHost=h;return v};
 return f};

Object.assign(T,{createPilot:createPilot,pilotBeat:beat});
})();
