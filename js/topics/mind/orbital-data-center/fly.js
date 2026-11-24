/* Orbital data center · Fly. You manage the node through 24 hours of the shadow season. Needs mission.js loaded first (it shares T.geom and the link numbers).
   You set the compute load. Power, the radiators and the chips follow the physics of core.js: no compute in shadow, one lumped thermal mass,
   a chip limit that trips the node. A micrometeoroid cuts the radiator area, a particle storm raises restarts, and results only count once
   they are sent down during a ground pass. Simplified: fluid averages for restarts, a fixed pass schedule, one result rate per unit of compute. */
(function(){
const T=window.HV.T.odc,D=T.DES,K=T.K,Y=T.YEAR,f=T.f,fW=T.fW,fC=T.fC,fR=T.fR,fD=T.fD,clamp=T.clamp,D2R=T.D2R,PI=Math.PI;
const DAY=Y.dmin,YR=2.5,BETA=T.beta(DAY),S=T.flux(DAY),ENV=T.envLoad(Math.min(Math.abs(BETA),88*D2R),S);
const Tp=T.Tper,END=86400,PD=T.PS.dur,PK=[1,3,5,8,10,12,14],PC=k=>(k+.25)*Tp;               /* day length, pass length, orbits with a pass, pass centre */
const RADT=3.5*3600,RADF=.7,ST0=8*3600,ST1=11*3600,EDGE=300;                            /* radiator hit, share left, storm start and end, ramp s */
const TC=[30,60,150,300,900],BUF=12,RES=1,GOAL=28;                                      /* checkpoint choices s, buffer TB, TB of results per ZFLOP, goal TB */
const lamQ=T.lamFleet(false),lamS=T.lamFleet(true),PF=T.PFLOPS*1e-6;                    /* restarts per hour, ZFLOP per second at full load */
const Ecap=T.Ecap,CHG=T.CHG,DRATE=T.gR/8/1e12;                                          /* usable battery J, charge W, downlink TB/s */
const sm=x=>{x=clamp(x,0,1);return x*x*(3-2*x)};
const clock=t=>{const h=Math.floor(t/3600),m=Math.floor(t%3600/60);return(h<10?'0':'')+h+':'+(m<10?'0':'')+m};

/* the most load the radiators can carry in steady state with 3 K to spare before the chip limit */
function safeLoad(rf){
 const A=D.Arad*rf,ok=l=>T.Tjunc(T.radTemp(D.hkW+D.nAcc*D.accW*l,A,ENV),l)<=D.Tj-3;
 if(ok(1))return 1;let lo=0,hi=1;for(let i=0;i<30;i++){const m=(lo+hi)/2;if(ok(m))lo=m;else hi=m}return lo;
}
const stormAt=t=>sm((t-ST0)/EDGE)*(1-sm((t-ST1)/EDGE));

T.createFly=function(){
 const st={mode:'fly',auto:false,th:.3,lamp:false};
 let t,Tr,E,Lf,trip,trips,rf,ck,dl,buf,del,zf,rst,seu,gp,Tj,lit,sun,storm,pass,warn,dlWas,gnd;

 function reset(){
  t=0;rf=1;ck=3;dl=false;buf=0;del=0;zf=0;rst=0;seu=0;trip=false;trips=0;warn=0;dlWas=false;gnd=0;
  st.mode='fly';st.auto=false;st.th=.3;st.lamp=false;
  Tr=T.radTemp(D.hkW+D.nAcc*D.accW*.3,D.Arad,ENV);E=Ecap;Lf=0;gp=1;storm=0;
  update(0);
 }

 /* Auto: the reference plan. Hold the load the radiators can carry, shorten checkpoints in the storm, and open the downlink at every pass. */
 function autoStep(){
  st.th=Math.min(1,safeLoad(rf));
  ck=stormAt(t)>.3?2:4;
  if(pass)dl=true;
 }

 function update(dt){
  const nu=2*PI*t/Tp;lit=T.geom(nu,BETA).lit;sun=lit>.5;storm=stormAt(t);const pk=PK.find(k=>Math.abs(t-PC(k))<=PD/2);pass=pk!=null;
  if(t>=RADT)rf=RADF;
  const Pgen=lit*D.Aarr*T.arrayP(S,YR),Lpow=clamp((Pgen*.98-D.hkW)/(D.nAcc*D.accW),0,1);
  let Lc=st.th;if(trip)Lc=0;Lf=Math.min(Lc,Lpow);if(buf>=BUF-1e-6)Lf=0;
  const Q=D.hkW+D.nAcc*D.accW*Lf,A=D.Arad*rf;
  if(dt>0){
   Tr+=(Q-A*T.radNet(Tr,ENV))/T.Cth*dt;
   E=Pgen>=Q?Math.min(Ecap,E+Math.min(Pgen-Q,CHG)*dt):Math.max(0,E-(Q-Pgen)*dt);
  }
  gnd=dl&&pass?clamp(3*Math.sin(PI*((t-PC(pk))/PD+.5)),0,1):0;
  Tj=T.Tjunc(Tr,Lf);
  if(!trip&&Tj>=D.Tj){trip=true;trips++;Lf=0;Tj=T.Tjunc(Tr,0)}else if(trip&&T.Tjunc(Tr,Math.min(st.th,Lpow))<=D.Tj-12)trip=false;
  const lam=(lamQ+(lamS-lamQ)*storm)*Lf;gp=T.goodput(lam,TC[ck]);
  if(dt>0){
   const dz=Lf*PF*gp*dt;zf+=dz;buf=Math.min(BUF,buf+dz*RES);
   const r0=Math.floor(rst);rst+=lam/3600*dt;if(Math.floor(rst)>r0)seu=1;
   if(dl&&pass){const mv=Math.min(buf,DRATE*dt);buf-=mv;del+=mv}
   if(dlWas&&!pass)dl=false;dlWas=pass;
  }
 }

 function step(dt){
  if(st.mode!=='fly')return;
  if(warn>0)warn-=dt;
  if(st.auto)autoStep();
  t+=dt;update(dt);
  if(t>=END){t=END;st.auto=false;st.mode=del>=GOAL?'won':'lost'}
 }

 function status(){
  const nx=PK.map(k=>PC(k)-PD/2).find(x=>x>t),mn=nx==null?0:Math.round((nx-t)/60);
  if(st.mode==='won')return{n:'Goal met',f:'You sent down '+f(del,1)+' TB of results in 24 hours, against a goal of '+GOAL+' TB, with '+trips+' thermal trip'+(trips===1?'':'s')+' and '+Math.floor(rst)+' job restarts. Press Reset to run the day again.',k:'ok'};
  if(st.mode==='lost')return{n:'Short of the goal',f:'You sent down '+f(del,1)+' TB, short of the '+GOAL+' TB goal. '+trips+' thermal trip'+(trips===1?'':'s')+', '+Math.floor(rst)+' restarts, '+f(buf,1)+' TB still waiting in the buffer. Press Reset, or press Auto to see the reference plan.',k:'bad'};
  if(trip)return{n:'Thermal trip',f:'The chips hit '+fC(D.Tj)+' and the node shut the compute down. It restarts when the chips, at the load you ask for, are 12 K under the limit. A lower load restarts sooner. The safe load now is about '+f(safeLoad(rf)*100)+'%.',k:'bad'};
  if(rf<1&&t-RADT<1500)return{n:'Radiator hit',f:'A micrometeoroid cut one fin. Only '+f(rf*100)+'% of the radiator area is left, so the node can no longer shed the heat of full load. The safe load is about '+f(safeLoad(rf)*100)+'%. Watch the chip temperature.',k:'warn'};
  if(warn>0)return{n:'No station in view',f:'The downlink only works while the ground station can see the node. The next pass is in about '+mn+' min.',k:'warn'};
  if(pass)return dl?{n:'Downlinking',f:'The laser link is sending results at '+fR(T.gR)+'. The buffer holds '+f(buf,1)+' TB. The link closes by itself when the pass ends.',k:'ok'}:{n:'Station in view',f:'The ground station sees the node for about '+f(PD/60,1)+' min. Press Downlink to send the '+f(buf,1)+' TB in the buffer. Results only count once they are on the ground.',k:'warn'};
  if(storm>.5)return{n:'Particle storm',f:'Bit flips that error correction cannot fix are about '+D.spe+' times as common, so jobs restart every few minutes. Shorter checkpoints lose less work per restart, but each one costs '+D.ckpt+' s. Useful work is '+f(gp*100)+'% at '+TC[ck]+' s.',k:'warn'};
  if(!sun)return{n:'In shadow',f:'Earth blocks the Sun. The array makes nothing and the battery carries housekeeping alone, so compute is off until the node is back in sunlight. Battery: '+f(E/Ecap*100)+'%.',k:''};
  if(buf>=BUF-1e-6)return{n:'Buffer full',f:'The '+BUF+' TB buffer is full, so compute has paused. Results only leave during a ground pass. The next one is in about '+mn+' min.',k:'warn'};
  if(Tj>D.Tj-6)return{n:'Close to the limit',f:'The chips are at '+fC(Tj)+', '+f(D.Tj-Tj)+' K under the limit. The radiators are still warming. Lower the load if the temperature keeps climbing.',k:'warn'};
  return{n:'Running',f:'The node is at '+f(Lf*100)+'% load. The radiators are at '+fC(Tr)+' and the chips at '+fC(Tj)+'. '+(nx==null?'No more passes today.':'Next ground pass in about '+mn+' min.')+' Goal: '+GOAL+' TB delivered in 24 hours.',k:''};
 }

 const read=()=>[
  ['Mission time',clock(t)+' of 24:00'],
  ['Sunlight',sun?'In sun':'In shadow'],
  ['Compute load',f(Lf*100)+' %'],
  ['Radiators',fC(Tr)],
  ['Chip junction',fC(Tj)+' / '+fC(D.Tj)],
  ['Safe load',f(safeLoad(rf)*100)+' %'],
  ['Buffer',f(buf,1)+' / '+BUF+' TB'],
  ['Delivered',f(del,1)+' / '+GOAL+' TB'],
  ['Useful work',f(gp*100)+' %'],
  ['Battery',f(E/Ecap*100)+' %']
 ];

 reset();
 return{
  ui:{label:'Load',min:0,max:100,btns:[
   {k:'cut',l:'Idle'},
   {k:'lamps',l:'Checkpoint',lf:()=>'Checkpoint: '+TC[ck]+' s'},
   {k:'drop',l:'Downlink',lf:()=>dl?'Downlink: on':'Downlink',on:()=>dl},
   {k:'warp'},{k:'auto'},{k:'reset'}]},
  warp:[1,60,600,1800],warpL:['1×','1 min/s','10 min/s','30 min/s'],dtmax:30,
  state:st,
  setThrottle(x){st.th=clamp(x,0,1);st.auto=false},
  toggleAuto(){if(st.mode==='fly')st.auto=!st.auto},
  lamps(){if(st.mode!=='fly')return;ck=(ck+1)%TC.length;st.auto=false},
  drop(){if(st.mode!=='fly')return;if(!pass){warn=4;return}dl=!dl;st.auto=false},
  reset,step,
  tick(dt){if(seu>0)seu=Math.max(0,seu-dt*3)},
  read,status,
  view(){return{i:0,n:'Fly',f:'',th:0,t,nu:2*PI*t/Tp,beta:BETA,dep:1,load:Lf,link:.7,gnd,storm,seu,thrust:0,rad:rf,Tr}}
 };
};
})();
