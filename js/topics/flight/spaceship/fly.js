/* Spaceship · Fly tab: live flight model */
(function(){
const T=(window.HV.T=window.HV.T||{}).spaceship=window.HV.T.spaceship||{};
const {PI,sm,m0,dry,F,ve,mdot,mb1,RING_G,m1,v1,mEnd,Tb1,Tb2,Tc,sOf,S1,S2,S3,sB,S4,fmtT}=T;
const {P,TOTAL}=T;

/* ---------- Fly tab: live flight model (THEORETICAL) ----------
   Straight line from Earth to a stationary Mars. Ignores the Sun's and planets' gravity and planetary motion.
   The engine only pushes along the ship's axis, so to stop the ship must flip and burn the other way. */
const C_LIGHT=299792458,SOI=5.77e8,VCAP=385,FLIP_T=1800,ROT=PI/FLIP_T,T_DESIGN=1500,DEST=S4;
/* distance gained by thrusting for tb seconds at mass flow r, versus not thrusting (exact; series for tiny steps) */
const tdist=(m,r,tb)=>{const x=r*tb/m;return x<1e-4?ve*(m/r)*(x*x/2+x*x*x/6):ve*(tb-((m-r*tb)/r)*Math.log(m/(m-r*tb)))};
/* distance needed to stop from speed v at full thrust, mass m */
const brakeDist=(m,v)=>{if(v<=0)return 0;const mf=m*Math.exp(-v/ve);if(mf<dry)return Infinity;const tb=(m-mf)/mdot;return v*tb-tdist(m,mdot,tb)};
const fmtD=m=>{const a=Math.abs(m),sg=m<0?'−':'';if(a===Infinity)return 'too far';return a>=1e9?sg+(a/1e9).toFixed(2)+' M km':sg+Math.round(a/1e3).toLocaleString('en-US')+' km'};
const fmtV=v=>{const a=Math.abs(v),sg=v<0?'−':'';return a<1000?sg+a.toFixed(0)+' m/s':sg+(a/1000).toFixed(2)+' km/s'};
const AM={accel:'speeding up',coast:'coasting',flip:'turning around',brake:'slowing down',done:'finished'};
const AMF={accel:'Full throttle until 30 t of propellant is used, the same plan as the Launch tab.',coast:'Engine off. The autopilot waits until Mars is just far enough away to stop in time.',flip:'Turning the ship half a turn so the engine faces forward.',brake:'Burning to bring the speed to zero at Mars.',done:'Burn complete.'};

function createFly(){
 const S={};
 function reset(){Object.assign(S,{mode:'fly',m:m0,v:0,s:0,t:0,h:0,ht:0,th:0,te:0,heat:.2,lag:0,auto:0,am:''})}
 reset();

 function autopilot(){
  let lim=Infinity;const rem=DEST-S.s;
  if(!S.am)S.am=(S.v<1000&&S.m>m1)?'accel':'coast';
  if(S.am==='accel'){
   S.ht=0;S.th=1;lim=(S.m-m1)/mdot;
   if(S.m<=m1+1e-6){S.am='coast';S.th=0;lim=0}
  }else if(S.am==='coast'){
   S.th=0;
   if(S.v>0&&rem<=brakeDist(S.m,S.v)+S.v*FLIP_T+S.v*60)S.am='flip';
  }else if(S.am==='flip'){
   S.th=0;S.ht=PI;
   if(S.h>=PI)S.am='brake';
  }else if(S.am==='brake'){
   S.ht=PI;S.th=1;
   if(S.v<=.01){S.th=0;S.am='done';S.auto=0;lim=0}
   else lim=(S.m-S.m*Math.exp(-S.v/ve))/mdot;
  }
  return lim;
 }

 function step(dt){
  if(S.mode!=='fly')return;
  let lim=Infinity;
  if(S.auto)lim=autopilot();
  /* turn toward the target heading at a fixed rate */
  const err=S.ht-S.h;
  if(err!==0){if(Math.abs(err)<=ROT*dt)S.h=S.ht;else S.h+=Math.sign(err)*ROT*dt}
  const turning=S.h!==S.ht,th=turning?0:S.th,dir=S.h>PI/2?-1:1;
  /* engine: exact rocket equation over this step */
  let tb=0,dv=0,dsT=0;
  if(th>0&&S.m>dry){
   const r=th*mdot;tb=Math.min(dt,(S.m-dry)/r,lim);
   if(tb>0){const x=r*tb/S.m;dv=-ve*Math.log1p(-x);dsT=tdist(S.m,r,tb);S.m-=r*tb}
  }
  S.te=tb>0?th*tb/dt:0;
  S.s+=S.v*dt+dir*(dsT+dv*(dt-tb));
  S.v+=dir*dv;
  S.t+=dt;
  S.lag+=.5*S.v*S.v/(C_LIGHT*C_LIGHT)*dt;      /* special-relativity clock lag versus Earth */
  /* outcomes */
  const rem=DEST-S.s;
  if(Math.abs(rem)<SOI&&Math.abs(S.v)<VCAP){S.mode='arrived';S.th=0;S.te=0;S.auto=0}
  else if(S.s>DEST+SOI&&S.v>0){S.mode='flyby';S.th=0;S.te=0;S.auto=0}
 }

 /* visual smoothing only: radiators warm and cool over a second or two of real time */
 function tick(dtr){
  const target=.2+.8*S.te;
  S.heat+=(target-S.heat)*Math.min(1,dtr*1.5);
 }

 function view(){return{th:S.te,pw:.35+.65*S.te,heat:S.heat,ring:1,flip:S.h/PI,s:S.s,v:S.v}}

 function readout(){
  const rem=DEST-S.s,dir=S.h>PI/2?-1:1,bd=brakeDist(S.m,S.v),T=T_DESIGN*Math.pow(S.heat,.25),delay=Math.max(0,S.s)/C_LIGHT;
  return[
   ['Time','T+ '+fmtT(S.t)],['Speed',fmtV(S.v)],['To Mars',fmtD(rem)],['Propellant',Math.max(0,(S.m-dry)/1000).toFixed(1)+' t'],
   ['Thrust',(F*S.te/1000).toFixed(0)+' kN'],['Acceleration',(F*S.te/S.m*dir).toFixed(3)+' m/s²'],['Δv left',(ve*Math.log(S.m/dry)/1000).toFixed(1)+' km/s'],['Brake dist',bd===Infinity?'cannot stop':fmtD(bd)],
   ['Heading',S.h<.02?'Forward':S.h>PI-.02?'Backward':Math.round(S.h*180/PI)+'°'],['Radiators',Math.round(T)+' K'],['Earth link',delay<120?delay.toFixed(1)+' s':(delay/60).toFixed(1)+' min'],['Clock lag',(S.lag*1000).toFixed(2)+' ms']];
 }

 function status(){
  const rem=DEST-S.s,bd=brakeDist(S.m,S.v),turning=S.h!==S.ht,fwd=S.h<PI/2;
  if(S.mode==='arrived')return{k:'good',n:'Arrived at Mars',f:'Captured after '+fmtT(S.t)+' with '+((S.m-dry)/1000).toFixed(1)+' t of propellant left. The reference ship takes '+fmtT(TOTAL)+' and keeps '+((mEnd-dry)/1000).toFixed(1)+' t. Reset to fly it again.'};
  if(S.mode==='flyby')return{k:'bad',n:'Flew past Mars',f:'You left Mars’s reach at '+fmtV(S.v)+', too fast to be captured. Reset and start the flip earlier. Brake dist must be smaller than the distance to Mars.'};
  if(S.auto){const a=S.am||'accel';return{k:'',n:'Autopilot: '+AM[a],f:AMF[a]}}
  if(turning)return{k:'warn',n:'Turning',f:'Thrusters are turning the ship. The engine is locked until the turn ends, which takes about 30 minutes of ship time. Raise the time warp to skip ahead.'};
  if(S.m<=dry+1)return{k:'bad',n:'Out of propellant',f:'The tanks are empty, so the engine is dead. The ship keeps its speed of '+fmtV(S.v)+' for good.'};
  if(S.t===0&&S.th===0)return{k:'',n:'Ready in orbit',f:'Push the throttle to light the fusion drive. Thrust is gentle, 0.1 m/s² at the start, so use Warp to watch speed build. Goal: stop inside Mars’s reach with propellant to spare.'};
  if(S.v>1&&fwd){
   if(bd===Infinity)return{k:'warn',n:'Cannot stop',f:'At '+fmtV(S.v)+' this ship no longer has the propellant to stop. You can still slow down part of the way, or reset.'};
   const lead=(rem-bd-S.v*FLIP_T)/S.v;
   if(lead<=0)return{k:'bad',n:'Flip now',f:'Stopping needs '+fmtD(bd)+', plus '+fmtD(S.v*FLIP_T)+' of drift while turning. Mars is '+fmtD(rem)+' away. Turn around and burn now.'};
   if(S.te>0)return{k:'',n:'Burning: speeding up',f:'The engine pushes the ship forward. Start the flip in about '+fmtT(lead)+'.'};
   return{k:'',n:'Coasting',f:'The engine is off, so speed holds and no propellant is used. Start the flip in about '+fmtT(lead)+'.'};
  }
  if(S.v>1&&!fwd){
   if(S.te>0)return{k:'',n:'Burning: slowing down',f:'The engine now pushes against the motion. Speed '+fmtV(S.v)+', Mars '+fmtD(rem)+' away.'};
   return{k:'warn',n:'Facing backward',f:'The ship is flipped. Raise the throttle to brake. Stopping needs '+fmtD(bd)+' and Mars is '+fmtD(rem)+' away.'};
  }
  return{k:'',n:S.te>0?'Burning':'Drifting',f:'Speed '+fmtV(S.v)+', '+fmtD(rem)+' from Mars. The engine pushes along the ship’s axis.'};
 }

 return{
  state:S,step,tick,view,read:readout,status,reset,
  setThrottle(x){S.th=Math.max(0,Math.min(1,x));S.auto=0;S.am=''},
  flip(){S.ht=S.ht>PI/2?0:PI;S.th=0;S.auto=0;S.am=''},
  toggleAuto(){if(S.auto){S.auto=0;S.am='';S.th=0}else{S.auto=1;S.am=''}}
 };
}

Object.assign(T,{createFly});
})();
