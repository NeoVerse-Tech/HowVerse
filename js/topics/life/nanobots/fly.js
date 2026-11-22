/* Nanobots · Fly tab: steer the bot to the clot, dock, cover the face, release */
(function(){
const T=(window.HV.T=window.HV.T||{}).nanobots=window.HV.T.nanobots||{};
const {PI,sm,clamp,rel,MU,RHO,LBOT,RBOT,VSW,NB,UMEAN,X0,XN,UA,B2,KAB,TH0,T_APP,xApp,drag,ReOf,fmtT}=T;

/* ---------- Fly tab: steer the bot to the clot, dock, cover the face, release ----------
   2D slice of a 50 µm vessel (x along the flow, r across it). Blood runs 4 mm/s at the centre and slows to a crawl at the clot.
   The clot only catches bots within RC of the centre. One bot stands in for the swarm. Heat shakes it (Brownian motion). */
const FR=25,RC=12,UC0=4000,UAC=30,B3=(UC0-UAC)/(XN*XN),DIFF=.13,NBIN=12,FREQS=[0,15,20,28,40],FSO=28,X_START=1500;
const gauss=()=>{let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*PI*v)};
const fsoAt=r=>FSO*(1-.25*(r/FR)*(r/FR));                                   /* walls add drag, so the step-out frequency drops near them */
const speedAt=(hz,r)=>{if(hz<=0)return 0;const f0=fsoAt(r);return hz<=f0?VSW*hz/20:VSW*f0/20*Math.pow(f0/hz,4)};
const flowAt=(x,r)=>(x>=XN?UC0:UAC+B3*x*x)*Math.max(0,1-(r/FR)*(r/FR));
const dName=d=>{const a=Math.abs(d);return a<20?'downstream':a>160?'upstream':d>0?'across, +':'across, −'};

function createFly(){
 const S={};
 function reset(){Object.assign(S,{mode:'fly',x:X_START,r:(Math.random()<.5?-1:1)*(18+Math.random()*4),th:0,hzI:0,t:0,docked:0,tDock:0,cover:new Array(NBIN).fill(0),rel:0,relT:0,cov0:0,clot:1,pay:0,dr:0,k:0,vrel:0,auto:0,am:'',dir:0,sw:1})}
 reset();
 const hzNow=()=>FREQS[S.hzI],head=()=>S.th*100,rad=()=>head()*PI/180;
 const covFrac=()=>S.cover.reduce((a,b)=>a+b,0)/NBIN;
 const markBin=()=>{const b=clamp(Math.floor((S.r+RC)/(2*RC/NBIN)),0,NBIN-1);S.cover[b]=1};
 function doRelease(){if(S.mode!=='fly'||S.rel)return;if(!S.docked){S.mode='lost';return}S.rel=1;S.relT=0;S.cov0=covFrac()}
 const setHead=d=>{S.th=clamp(d,-180,180)/100};

 function autopilot(){
  if(!S.am)S.am=S.docked?(S.rel?'wait':'cover'):'steer';
  if(S.am==='steer'){S.hzI=2;setHead(Math.abs(S.r)>6?(S.r>0?-90:90):0);if(S.docked)S.am='cover'}
  if(S.am==='cover'){S.hzI=2;if(!S.dir)S.dir=1;if(S.r>=RC-.7)S.dir=-1;if(S.r<=-RC+.7)S.dir=1;setHead(S.dir*90);if(covFrac()>=1)S.am='release'}
  if(S.am==='release'){doRelease();S.hzI=0;S.am='wait'}
 }

 function step(dt){
  if(S.mode!=='fly')return;
  if(S.auto)autopilot();
  let left=dt;
  while(left>1e-9&&S.mode==='fly'){
   const h=Math.min(left,S.docked?.5:.002);left-=h;
   const hz=hzNow(),vs=speedAt(hz,S.r),th=rad();
   if(!S.docked){
    const u=flowAt(S.x,S.r),sq=Math.sqrt(2*DIFF*h);
    S.x+=-(u+vs*Math.cos(th))*h+gauss()*sq;
    S.r=clamp(S.r+vs*Math.sin(th)*h+gauss()*sq,-(FR-1.5),FR-1.5);
    S.vrel=u+vs*Math.cos(th);
    if(S.x<=0){if(Math.abs(S.r)<RC){S.x=0;S.docked=1;S.tDock=S.t;S.vrel=0;markBin()}else{S.mode='missed'}}
   }else{
    S.r=clamp(S.r+vs*Math.sin(th)*h,-RC+.5,RC-.5);if(vs>0)markBin();S.vrel=0;
   }
   S.t+=h;
   if(S.rel){
    S.relT+=h;
    S.pay=rel(S.relT/300);S.k=rel((S.relT-300)/1800);
    S.clot=1-.85*S.cov0*S.k;S.dr=S.pay*(1-.7*S.k);
    if(S.relT>=2100){S.mode=S.clot<=.2?'done':'partial';S.auto=0;S.dr=0}
   }
  }
 }
 function tick(){}
 const flowHere=()=>S.docked?UAC/2+(UMEAN-UAC/2)*S.k*S.cov0:flowAt(S.x,S.r);
 function view(){
  const hz=hzNow();
  return{x:S.x,r:S.r,hd:rad(),hz:hz,vs:speedAt(hz,S.r),th:hz/40,dock:S.docked?1:0,pay:S.pay,dr:S.dr,flow:flowHere(),vrel:S.vrel,clot:S.clot,sw:0,wash:0};
 }
 function readout(){
  const hz=hzNow(),vs=speedAt(hz,S.r),fl=flowHere(),d=head();
  const dist=S.docked||S.x<=0?'at the clot':S.x>=1000?(S.x/1000).toFixed(2)+' mm':Math.round(S.x)+' µm';
  return[['Time',S.t<10?S.t.toFixed(1)+' s':'T+ '+fmtT(S.t)],['Distance to clot',dist],['Off centre',Math.abs(S.r).toFixed(1)+' µm'],
   ['Blood flow here',fl>=1000?(fl/1000).toFixed(1)+' mm/s':Math.round(fl)+' µm/s'],['Swim speed',vs.toFixed(0)+' µm/s'],['Heading',Math.round(d)+'° '+dName(d)],
   ['Field',hz>0?hz+' Hz, 10 mT':'off'],['Drag on bot',vs>0?drag(vs).toFixed(1)+' pN':'0 pN'],['Reynolds number',vs>0?ReOf(vs).toExponential(1):'0'],
   ['Face covered',Math.round(100*covFrac())+' %'],['Payload released',Math.round(100*S.pay)+' %'],['Clot left',Math.round(100*S.clot)+' %']];
 }
 function status(){
  const hz=hzNow(),cov=Math.round(100*covFrac());
  if(S.mode==='done')return{k:'good',n:'Clot cleared',f:'Docked after '+S.tDock.toFixed(1)+' s, covered '+Math.round(100*S.cov0)+' percent of the face, and the clot is down to '+Math.round(100*S.clot)+' percent. In real life that is the work of a swarm of 100,000 bots. Reset to fly again, or press Auto to watch the reference plan.'};
  if(S.mode==='partial')return{k:'warn',n:'Clot partly cleared',f:'You covered only '+Math.round(100*S.cov0)+' percent of the face before releasing, so the enzyme reached only that part and '+Math.round(100*S.clot)+' percent of the clot is left. Crawl across the whole face first.'};
  if(S.mode==='missed')return{k:'bad',n:'Swept past',f:'The bot was '+Math.abs(S.r).toFixed(0)+' µm off centre when it reached the clot, and the blood carried it through the gap beside it. The clot catches only bots within '+RC+' µm of the centre. Steer toward the centre early: the flow carries you along but cannot stop you crossing.'};
  if(S.mode==='lost')return{k:'bad',n:'Payload lost',f:'The payload was released before the bot docked and the blood washed it away. Dock first, then release.'};
  if(S.auto){const a=S.am||'steer',m={steer:['steering','Field on at 20 Hz, steering to the centre, then letting the flow bring it in.'],cover:['covering the face','Docked. Crawling from one edge of the clot face to the other.'],release:['releasing','Face covered. Opening the locks.'],wait:['waiting','The enzyme is working. Raise the warp to skip the wait.']}[a];return{k:'',n:'Autopilot: '+m[0],f:m[1]}}
  if(!S.docked){
   if(S.t===0&&hz===0)return{k:'',n:'Ready upstream',f:'Blood is carrying the bot toward the clot, '+X_START+' µm ahead, and it starts '+Math.abs(S.r).toFixed(0)+' µm off centre. Tap Freq to switch the field on, then set Heading to cross toward the centre: −90° and +90° are across the vessel, 0° is downstream.'};
   if(hz===0)return{k:'warn',n:'Field is off',f:'The bot cannot steer without the rotating field. Tap Freq: 20 Hz is a safe choice.'};
   if(hz>fsoAt(S.r))return{k:'warn',n:'Past step-out',f:'The helix cannot keep up with the field, so speed has collapsed. Near the wall the limit is lower than 28 Hz. Tap Freq to lower it.'};
   if(Math.abs(S.r)<RC-2)return{k:'good',n:'On target',f:'Within the clot’s catch zone and '+(S.x>=1000?(S.x/1000).toFixed(1)+' mm':Math.round(S.x)+' µm')+' from the clot. Hold heading 0° and let the flow bring you in.'};
   return{k:'',n:'Steer to the centre',f:'You are '+Math.abs(S.r).toFixed(0)+' µm off centre and the clot catches only within '+RC+' µm. Set Heading to '+(S.r>0?'−90°':'+90°')+' to swim toward the middle.'};
  }
  if(!S.rel)return{k:cov>=100?'good':'',n:cov>=100?'Face covered':'Docked',f:'Face covered: '+cov+' percent. Set Heading to −90° or +90° to crawl along the clot face. The enzyme reaches only where the bot has been, so cover the whole face, then Release.'};
  return{k:'',n:'Dissolving',f:'Clot left: '+Math.round(100*S.clot)+' percent. It takes about 35 minutes, so raise the warp.'};
 }
 return{
  state:S,step,tick,view,read:readout,status,reset,
  ui:{label:'Heading',min:-180,max:180,unit:'°',btns:[{k:'freq'},{k:'release',l:'Release'},{k:'warp'},{k:'auto'},{k:'reset'}]},
  warp:[.1,1,60,600],warpL:['0.1×','1×','1 min/s','10 min/s'],warp0:0,dtmax:.05,
  label:k=>k==='freq'?(hzNow()?'Freq '+hzNow()+' Hz':'Field off'):null,
  on:k=>k==='freq'?hzNow()>0:false,
  setThrottle(x){S.th=clamp(x,-1.8,1.8);S.auto=0;S.am=''},
  act(k){if(k==='freq'){S.hzI=(S.hzI+1)%FREQS.length;S.auto=0;S.am=''}else if(k==='release'){S.auto=0;S.am='';doRelease()}},
  toggleAuto(){if(S.auto){S.auto=0;S.am=''}else{S.auto=1;S.am=''}}
 };
}

Object.assign(T,{createFly});
})();
