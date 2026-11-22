/* Dyson swarm · Fly tab (Phase 7): you run the swarm.
   Launch collectors from the hub's fab bay, send repair ships to failed ones, and set the beam to Earth,
   balanced against hub heat. Needs mission.js loaded first (it provides T.NFULL and T.pw).
   The scene is driven through T.live, the same bridge the Launch tab uses, so world.js and earth.js are not changed.
   All design values are illustrative, not a finished design. Keep the link shares and EFF in step with mission.js. */
(function(){
const T=window.HV.T.dyson,f=T.f,comma=T.comma,pw=T.pw;
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const DAY=86400,SIG=5.670374e-8,HUMAN=1.9e13;

/* ---------- the design (same as mission.js) ---------- */
const EFF=.3,AC=1e6,LINK={relay:.95,trunk:.9,hub:.9,earth:.8};
const PER=AC*T.flux(T.REAL_AU)*EFF,NFULL=T.NFULL;
const FULLH=NFULL*PER*LINK.relay*LINK.trunk;

/* ---------- the rules of the game ---------- */
const RECV=2.4e13,GOAL=.95*HUMAN,HOLD=30*DAY,LIMIT=1200*DAY;   /* receiver limit; goal power; hold time; time limit */
const FAB=100,STOCKCAP=1500,TRANSIT=12*DAY;                     /* fab bay: collectors per day, storage, days to reach the swarm */
const MTBF=1100,LIFE=20*DAY;                                    /* a collector fails about once in 3 years; unrepaired ones are lost after 20 days */
const SHIPS=8,CARRY=12,SORTIE=3*DAY;                            /* repair ships: 8, fix up to 12 per trip, 3 days per trip */
const RATES=[0,25,50,100,200];                                  /* launch settings, collectors per day */
const RAD=3e7,TLIM=1100,CTH=5.9e14,SAFE=4*DAY;                  /* radiators 30 km², trip temperature K, heat capacity J/K, safe-mode time */

const mk=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
let rng=mk(20261121);

const put=(q,t,n)=>{const l=q[q.length-1];if(l&&Math.floor(l.t/3600)===Math.floor(t/3600))l.n+=n;else q.push({t,n})};
const powers=S=>{
 const run=S.safe>0?.05:1,jf=S.jit>0?.7:1;
 const Ph=S.count*PER*run*LINK.relay*LINK.trunk*jf;
 return{Ph,avail:Ph*LINK.hub*LINK.earth};
};

function init(){
 rng=mk(20261121);
 const S={mode:'fly',auto:false,th:0,t:0,count:300,stock:800,pipe:[],pipeN:0,fail:[],failN:0,lost:0,ri:0,crew:false,ships:[],
  T:300,trips:0,safe:0,streak:0,jit:0,flareAt:-1e9,next:(35+rng()*30)*DAY,Ph:0,Pe:0,Q:0,why:''};
 for(let k=0;k<SHIPS;k++)S.ships.push({back:-1,n:0});
 S.Ph=powers(S).Ph;
 return S;
}

const fs={
 state:null,
 /* controls the page reads */
 ui:{label:'Beam to Earth',min:0,max:100,btns:[
  {k:'launch',lf:()=>'Launch '+RATES[fs.state.ri]+'/day',on:()=>fs.state.ri>0},
  {k:'repair',lf:()=>'Repair '+(fs.state.crew?'ON':'OFF'),on:()=>fs.state.crew},
  {k:'warp'},{k:'auto'},{k:'reset'}]},
 warp:[60,3600,86400,432000],
 warpL:['1 min/s','1 h/s','1 day/s','5 days/s'],
 dtmax:21600,

 create(){fs.state=init();return fs},
 reset(){fs.state=init()},
 setThrottle(x){fs.state.th=clamp(x,0,1);fs.state.auto=false},
 launch(){const S=fs.state;S.ri=(S.ri+1)%RATES.length;S.auto=false},
 repair(){const S=fs.state;S.crew=!S.crew;S.auto=false},
 toggleAuto(){const S=fs.state;S.auto=!S.auto},

 step(h){
  const S=fs.state,d=h/DAY;
  S.t+=h;if(S.jit>0)S.jit-=h;

  /* solar flare: damages some collectors and shakes the pointing for a few days */
  if(S.t>=S.next){const n=S.count*.04;S.count-=n;put(S.fail,S.t,n);S.failN+=n;S.jit=3*DAY;S.flareAt=S.t;S.next=S.t+(40+40*rng())*DAY}

  /* fab bay and launches */
  S.stock=Math.min(STOCKCAP,S.stock+FAB*d);
  while(S.pipe.length&&S.pipe[0].t<=S.t){const b=S.pipe.shift();S.count+=b.n;S.pipeN-=b.n}

  /* random failures, and losing the ones nobody repaired in time */
  const fn=S.count*d/MTBF*(.8+.4*rng());S.count-=fn;put(S.fail,S.t,fn);S.failN+=fn;
  while(S.fail.length&&S.fail[0].t+LIFE<=S.t){const b=S.fail.shift();S.failN-=b.n;S.lost+=b.n}

  /* repair ships: come home, then go out again if the crews are on */
  for(const s of S.ships)if(s.back>=0&&s.back<=S.t){S.count+=s.n;s.back=-1;s.n=0}
  if(S.crew)for(const s of S.ships){
   if(s.back>=0||S.failN<.5)continue;
   let need=CARRY;
   while(need>1e-9&&S.fail.length){const b=S.fail[0],x=Math.min(b.n,need);b.n-=x;need-=x;if(b.n<=1e-9)S.fail.shift()}
   const took=CARRY-need;S.failN-=took;s.n=took;s.back=S.t+SORTIE;
  }

  /* power */
  const p=powers(S);
  if(S.auto){
   S.crew=true;S.ri=(S.count+S.pipeN<NFULL*1.04)?3:0;
   S.th=clamp(Math.min(p.avail*.995,HUMAN)/RECV,0,1);
  }
  const n=Math.min(RATES[S.ri]*d,S.stock);
  if(n>0){S.stock-=n;put(S.pipe,S.t+TRANSIT,n);S.pipeN+=n}

  const Pe=Math.min(S.th*RECV,p.avail),used=Pe/(LINK.hub*LINK.earth);
  /* heat: the hub's own conversion loss, plus every watt that arrives and is not sent on */
  const Q=Math.max(0,p.Ph-used)+used*(1-LINK.hub);
  const ns=Math.max(1,Math.ceil(h/1800)),sh=h/ns;
  for(let i=0;i<ns;i++){S.T+=sh*(Q-2*SIG*RAD*Math.pow(S.T,4))/CTH;if(S.T<3)S.T=3}
  S.Ph=p.Ph;S.Pe=Pe;S.Q=Q;

  /* too hot: the hub goes to safe mode, feathering the collectors for a few days */
  if(S.safe>0)S.safe-=h;
  else if(S.T>TLIM){S.safe=SAFE;S.trips++}

  if(Pe>=GOAL&&S.safe<=0&&S.T<TLIM)S.streak+=h;else S.streak=0;

  if(S.streak>=HOLD)S.mode='won';
  else if(S.trips>=3){S.mode='lost';S.why='The hub overheated three times. The radiators and converters are damaged beyond repair.'}
  else if(S.t>=LIMIT){S.mode='lost';S.why='Time ran out before Earth had steady power.'}
 },

 /* publish the swarm state to the scene (the same bridge the Launch tab uses) */
 tick(){
  const S=fs.state;
  T.live={t:performance.now(),i:2,st:S.Ph>0?(S.Pe>0?3:2):1,count:Math.max(1,Math.round(S.count)),full:NFULL,frac:Math.min(1,S.Ph/FULLH)};
 },
 view(){return{th:0,i:2}},

 read(){
  const S=fs.state,idle=S.ships.filter(s=>s.back<0).length;
  return[
   ['Day',f(S.t/DAY,1)+' of '+comma(LIMIT/DAY)],
   ['Collectors',comma(S.count)+' of '+comma(NFULL)],
   ['In transit / in bay',comma(S.pipeN)+' / '+comma(S.stock)],
   ['Failed, waiting',comma(S.failN)+' (lost '+comma(S.lost)+')'],
   ['Repair ships','idle '+idle+' of '+SHIPS],
   ['Reaching the hub',pw(S.Ph)],
   ['Power at Earth',pw(S.Pe)+' ('+f(S.Pe/HUMAN*100,0)+'% of 19 TW)'],
   ['Hub waste heat',pw(S.Q)],
   ['Hub temperature',f(S.T,0)+' K (trips at '+comma(TLIM)+')'],
   ['Hold streak',f(S.streak/DAY,1)+' of '+HOLD/DAY+' days']
  ];
 },

 status(){
  const S=fs.state;
  if(S.mode==='won')return{n:'Earth is powered',k:'win',f:'You held at least 95% of humanity\'s 19 TW at Earth for 30 days, on day '+f(S.t/DAY,0)+', with '+comma(S.count)+' collectors and '+S.trips+' hub trip'+(S.trips===1?'':'s')+'. Press Reset to try for fewer trips or a faster time.'};
  if(S.mode==='lost')return{n:'Mission lost',k:'bad',f:S.why+' Press Reset to try again.'};
  if(S.safe>0)return{n:'Hub in safe mode',k:'bad',f:'The hub overheated and feathered the collectors for '+f(S.safe/DAY,1)+' more days. Send more power to Earth, or launch fewer collectors, so less is dumped as heat. Trips so far: '+S.trips+' of 3.'};
  if(S.t-S.flareAt<3*DAY)return{n:'Solar flare',k:'warn',f:'A flare damaged 4% of the collectors and is shaking the pointing, so the trunk beam is weaker for a few days. Send the repair ships.'};
  if(S.T>TLIM*.9)return{n:'Hub running hot',k:'warn',f:'Power that arrives and is not sent to Earth turns into heat. Raise the beam, or pause launching, before the hub trips at '+comma(TLIM)+' K.'};
  if(S.streak>0)return{n:'Holding the target',k:'ok',f:'Power at Earth is above the goal. Hold it for '+f((HOLD-S.streak)/DAY,1)+' more days.'};
  return{n:'Build the swarm',k:'',f:'Goal: hold at least 95% of 19 TW at Earth for 30 days. Launch collectors, turn the repair crews on, and raise the beam as power arrives. Heat from unsent power can trip the hub.'};
 }
};

T.FLY_LEARN={h:'The Fly mode',l:'THEORETICAL',p:[
 'In Fly mode you run the swarm. The fab bay at the hub builds about '+FAB+' collectors a day and stores up to '+comma(STOCKCAP)+'. Launch sets how many go out per day, and each takes '+(TRANSIT/DAY)+' days to reach the swarm. The goal is to put at least 95% of 19 TW on Earth for 30 days in a row, within '+comma(LIMIT/DAY)+' days.',
 'Collectors fail about once in 3 years, and a solar flare can damage 4% of them at once. Failed ones are lost after 20 days unless the '+SHIPS+' repair ships reach them. Each ship fixes up to '+CARRY+' collectors a trip and is away for 3 days.',
 'Heat is the trap. Every watt that reaches the hub and is not sent on to Earth turns into heat, and the radiators shed about 3.4 TW at 1,000 K. The hub trips at '+comma(TLIM)+' K and feathers the collectors for 4 days. Three trips lose the hub.',
 'What the model leaves out: orbital mechanics for the transit, the real shape of diffraction (here the Earth beam is just capped at '+pw(RECV)+' at the receiver, and a flare cuts the trunk beam to 70% for 3 days), collector design details, and the cost and material supply of building millions of mirrors. The Fly tab is a game built on the Launch tab\'s accounting, not a proof that the system can be built.']};

T.fly={create:fs.create};
})();
