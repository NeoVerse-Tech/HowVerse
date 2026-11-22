/* Deployable tower · Fly. You run the storm. Needs mission.js loaded first: it supplies the storm, and eval(), the one place a
   tower state becomes loads, so Fly and Launch agree. The run starts when the forecast arrives and ends when the storm cycle does.
   The Deploy slider sets a target height. The drive chases it at full speed, which is faster than it can cool, so retract in steps.
   Rules: the drive only moves with the pins released and the building empty; pins only engage at an end stop. Simplified: scripted wind,
   one drive, one failure rule (base past its limit for a minute). */
(function(){
const T=window.HV.T.tower,D=T.DES,clamp=T.clamp,f=T.f;
const NJ=T.NJ,PEOPLE=T.PEOPLE,TOT=T.TOT,T0=T.tp[1],SPAN=D.Hmax-D.Hmin;
const RM=D.drive.rateMax,RR=T.rateAtPower(D.drive.rated)*.95;           /* top drive speed, and the safe pace Auto keeps */
const TAU=20,PIN_S=20,TRIP_S=600,FAIL_S=60,EVAC_S=3600;                  /* drive follow time, s per pin, trip lockout, s over the limit to fail, s to empty the building */
const moveT=T.clock(T.moveTime(D.Hmax,D.Hmin,T.rateAtPower(D.drive.rated)));

T.createFly=function(){
 const st={mode:'fly',auto:false,th:1,damp:true,lockCmd:true,evac:false};
 let ts,h,locked,people,heat,tripT,over,died,lockT,rate,E,V,tm,why='';

 function refresh(){tm=ts/60;V=T.storm(tm);E=T.eval({h,V,locked,people:Math.ceil(people),damp:st.damp,rate,heat})}

 function reset(){
  ts=T0*60;h=D.Hmax;locked=NJ;people=PEOPLE;heat=0;tripT=0;over=0;died=0;lockT=0;rate=0;why='';
  st.mode='fly';st.auto=false;st.th=1;st.damp=true;st.lockCmd=true;st.evac=false;refresh();
 }

 /* Auto: the reference plan. Empty the building, release, retract at a safe pace, lock; after the storm, the reverse. */
 function autoStep(dt){
  const clear=tm>T.tPeak+40&&V<18;
  if(!clear){
   if(h>D.Hmin+.5){
    if(people>0){st.evac=true;return}
    if(locked>0){st.lockCmd=false;return}
    st.th=Math.max(0,st.th-RR*dt/SPAN);
   }else st.lockCmd=true;
  }else{
   if(h<D.Hmax-.5){
    if(locked>0){st.lockCmd=false;return}
    st.th=Math.min(1,st.th+RR*dt/SPAN);
   }else st.lockCmd=true;
  }
 }

 function step(dt){
  if(st.mode!=='fly')return;
  ts+=dt;tm=ts/60;V=T.storm(tm);
  if(st.auto)autoStep(dt);

  if(st.evac&&people>0)people=Math.max(0,people-PEOPLE/EVAC_S*dt);

  /* pins: one joint every PIN_S seconds. They only engage at an end stop. */
  lockT+=dt;
  if(lockT>=PIN_S){lockT=0;
   if(st.lockCmd&&locked<NJ&&(h<=D.Hmin+.5||h>=D.Hmax-.5))locked++;
   else if(!st.lockCmd&&locked>0)locked--;
  }

  /* drive: moves only with pins released, the building empty and the drive not tripped */
  const tgt=D.Hmin+st.th*SPAN,err=tgt-h;
  rate=0;why='';
  if(Math.abs(err)>.05){
   if(tripT>0)why='trip';else if(people>0)why='people';else if(locked>0)why='pins';
   else{rate=clamp(err/TAU,-RM,RM);if(Math.abs(rate*dt)>=Math.abs(err))rate=err/dt;h=clamp(h+rate*dt,D.Hmin,D.Hmax)}
  }else h=tgt;

  /* heat: above rated power it builds, below it cools. At full speed it overheats in about ten minutes. */
  const load=T.drivePower(rate)/D.drive.rated;
  heat=clamp(heat+(load>1?load-1:-(1-load))/D.drive.tau*dt,0,1);
  if(tripT>0)tripT-=dt;
  else if(heat>=1){tripT=TRIP_S;rate=0}

  refresh();

  /* failure: the base is past its limit for a minute, or far past it at once */
  over=E.util>1?over+dt:Math.max(0,over-dt*2);
  if(over>FAIL_S||E.util>1.4){died=Math.ceil(people);st.mode='lost';st.auto=false}
  else if(tm>=TOT)st.mode='won';
 }

 function status(){
  const toPeak=T.tPeak-tm,peak=toPeak>0?'The storm peaks at '+T.STORM+' m/s in '+T.clock(toPeak*60)+'. ':'';
  if(st.mode==='lost')return died>0
   ?{n:'Tower lost',f:died+' people were inside when the base failed. Empty the building first, and start retracting on the forecast, not when the wind arrives.',k:'bad'}
   :{n:'Tower lost, everyone safe',f:'The building was empty, but the tower was still too tall when the wind passed its limit. Start retracting sooner.',k:'bad'};
  if(st.mode==='won')return(h>=D.Hmax-1&&locked===NJ)
   ?{n:'Everyone safe, tower redeployed',f:'The tower rode out the storm stowed, and is standing and locked again. That is the full cycle.',k:'ok'}
   :{n:'Everyone safe, tower intact',f:'The storm is over and nobody was hurt. The tower is still stowed. Redeploy and lock it to finish the cycle.',k:'ok'};
  if(E.util>1)return{n:'Past the limit',f:'The base is over its limit at this height and wind. Each second counts. Retract now if you can.',k:'bad'};
  if(tripT>0)return{n:'Drive tripped',f:'The drive overheated and is cooling for '+T.clock(tripT)+'. It runs faster than it can cool, so retract in steps and watch the heat.',k:'bad'};
  if(why==='people')return{n:'Building not empty',f:'The drive will not move while people are inside. Press Evacuate and wait for the building to empty.',k:'warn'};
  if(why==='pins')return{n:'Pins engaged',f:'Release the pins first. The drive cannot move a locked tower.',k:'warn'};
  if(Math.abs(rate)>1e-4)return{n:rate<0?'Retracting':'Deploying',f:f(h)+' m at '+f(Math.abs(rate)*60,1)+' m/min. '+(heat>.6?'The drive is running hot.':'Keep the heat gauge below the top.'),k:heat>.6?'warn':''};
  if(E.util>.8)return{n:'Getting close',f:'The base is at '+f(E.util*100)+'% of its limit. The wind is still rising.',k:'warn'};
  if(h<D.Hmin+1)return{n:'Stowed',f:'The tower is nested down to '+D.Hmin+' m. Lock the pins. Redeploy after the wind drops.',k:''};
  return{n:'Watching the forecast',f:peak+'Emptying the building takes about an hour and retracting about '+moveT+'. The tower stands at '+f(h)+' m.',k:''};
 }

 function read(){
  return[
   ['Storm peak in',tm<T.tPeak?T.clock((T.tPeak-tm)*60):'passed'],
   ['Wind, 10 m',f(V)+' m/s'],
   ['Limit here',f(E.limit)+' m/s'],
   ['Height',f(h)+' m'],
   ['Base load',f(E.util*100)+'%'],
   ['Drive heat',tripT>0?'tripped':f(heat*100)+'%'],
   ['Pins locked',locked+' of '+NJ],
   ['People inside',f(Math.ceil(people))]
  ];
 }

 reset();
 return{
  ui:{label:'Deploy',min:0,max:100,btns:[
   {k:'evac',l:'Evacuate',lf:()=>st.evac?(people>0?'Evacuating':'Empty'):'Evacuate',on:()=>st.evac},
   {k:'lock',l:'Lock',lf:()=>st.lockCmd?'Unlock':'Lock',on:()=>st.lockCmd},
   {k:'damper',l:'Damper',lf:()=>'Damper '+(st.damp?'on':'off'),on:()=>st.damp},
   {k:'warp'},{k:'auto'},{k:'reset'}]},
  warp:[1,10,60,300,900],warpL:['1×','10 s/s','1 min/s','5 min/s','15 min/s'],dtmax:5,
  state:st,
  setThrottle(x){st.th=clamp(x,0,1);st.auto=false},
  toggleAuto(){if(st.mode==='fly')st.auto=!st.auto},
  lock(){if(st.mode==='fly'){st.lockCmd=!st.lockCmd;st.auto=false}},
  evac(){if(st.mode==='fly'){st.evac=!st.evac;st.auto=false}},
  damper(){if(st.mode==='fly'){st.damp=!st.damp;refresh()}},
  reset,step,tick(){},read,status,
  view(){return Object.assign({},E,{i:0,n:'Fly',f:'',th:0,t:tm,sway:st.mode==='lost'?6:E.sway})}
 };
};
})();
