/* Orbital data center · Launch mission, and the shared geometry that Fly uses (so this file loads before fly.js).
   One mission in nine phases: launch, release, unfold, power up, compute load, laser link, ground pass, particle storm, shadow season.
   Phases 1 to 8 run on a sunny day of the year (Sun nearly overhead of the orbit plane); the last phase jumps six months ahead to the shadow season.
   at(u) turns playback position u (0 to 1) into a full state. Every number comes from core.js. The temperature of the radiators and the
   battery charge need history, so they are worked out once at load by stepping the whole mission, then read back by time. */
(function(){
const T=window.HV.T.odc,D=T.DES,K=T.K,Y=T.YEAR,M=T.MASSKG,PI=Math.PI,D2R=T.D2R,clamp=T.clamp;
const f=T.f,fW=T.fW,fM=T.fM,fD=T.fD,fC=T.fC,fR=T.fR,fT=T.fT;
const sm=x=>{x=clamp(x,0,1);return x*x*(3-2*x)};

/* the Sun and the Earth's shadow seen from the node: same geometry as world.js, so the 3D scene and the numbers agree.
   nu is the orbit angle (0 = Sun straight overhead, pi = midnight side), beta the Sun to orbit-plane angle. lit goes 1 to 0 across the shadow edge. */
function geom(nu,beta){
 const s1=Math.cos(beta)*Math.cos(nu);let lit=1;
 if(s1<0){const d=T.a*Math.sqrt(1-s1*s1);lit=sm((d-K.Re*.985)/(K.Re*.03))}
 return{lit,s1};
}

const DSUN=((Y.dmin+181)%365)+1,DDARK=Y.dmin,BS=T.beta(DSUN),BD=T.beta(DDARK);
const SS=T.flux(DSUN),SD=T.flux(DDARK);
const ES=T.envLoad(Math.min(Math.abs(BS),88*D2R),SS),ED=T.envLoad(Math.min(Math.abs(BD),88*D2R),SD);
const PS=T.pass(10*D2R),G={Dr:D.gndDap,loss:D.gndLoss*D.loss,cap:D.gndCap},NB=T.linkRate(D.sep),gR=T.linkRate(PS.slant,G).R,lam0=PS.arc/2*D2R;
const Tp=T.Tper,Ecap=D.hkW*Y.tmax,CHG=30e3,SB=4e3;                      /* usable battery energy, J. Charge power W. Standby draw before the wings open, W */
const lamQ=T.lamFleet(false),lamS=T.lamFleet(true);
const hot=T.plant({d:DSUN,yr:0,load:1}),ecl=T.eclOf(DDARK);

const NAMES=['Launch','Release and sun lock','Unfold','Power up','Compute load','Laser link','Ground pass','Particle storm','Shadow season'];
const RT=[600,1800,2400,3600,7200,2400,PS.dur,4800,Tp];                  /* real seconds in each phase */
const WT=[7,7,8,8,10,8,8,9,10],WS=WT.reduce((a,b)=>a+b,0);             /* playback weights */
const RT0=[0];RT.forEach(d=>RT0.push(RT0[RT0.length-1]+d));const TOT=RT0[9];

const TXT=[
 'A heavy-lift rocket carries the folded node, about '+fM(M.total)+', up to '+fD(D.h)+'. It is released along the day-night line, which puts it in a dawn-dusk orbit tilted '+f(T.incl/D2R,1)+'° to the equator. The wings, radiators and laser terminals are all folded inside the fairing, so the node runs on its battery.',
 'The node separates, stops its tumble and points at the Sun. A small ion thruster trims the orbit. One lap takes '+f(Tp/60,1)+' min at '+f(T.vel/1e3,2)+' km/s, so there are '+f(86400/Tp,1)+' orbits a day. Until the wings open it lives on '+f(SB/1e3)+' kW from the battery.',
 'Two wings, each about '+f(D.Aarr/2/40)+' by 40 m, roll out, and the radiator fins unfold edge-on to the Sun. At full size the array covers '+f(D.Aarr)+' m² and delivers '+fW(D.Aarr*T.arrayP(SS,0))+' on a new day. The cells run near '+fC(T.arrayT(SS))+' and lose efficiency as they warm.',
 'With power flowing, the node switches on the coolant loop, the controller and the battery charger. The radiators warm from their cold start toward the heat of housekeeping alone, '+fW(D.hkW)+'. No compute is running yet. The battery refills from the surplus.',
 'The accelerators come on in steps, up to '+fW(D.nAcc*D.accW)+' and '+f(T.PFLOPS)+' PFLOP/s at peak. Every watt ends up as heat, and the thermal mass makes the radiators lag the load by tens of minutes. Settled at full load they sit near '+fC(hot.Tr)+' and the chips near '+fC(hot.Tj)+', under the '+fC(D.Tj)+' limit.',
 'A second node flies '+D.sep+' m away. Their laser terminals, '+f(D.Dap*100)+' cm across, find each other and lock. At this range nearly all of the light lands in the far aperture, so the link runs at the terminal limit of '+fR(NB.R)+'. Clusters grow by adding nodes this way.',
 'A ground station sees the node for about '+f(PS.dur/60,1)+' min per pass above 10° elevation. The range runs from '+fD(PS.slant)+' at the edges to '+fD(D.h)+' overhead, a light delay of '+f(PS.delayZ*1e3,1)+' to '+f(PS.delay*1e3,1)+' ms. The laser downlink runs at '+fR(gR)+' and moves about '+f(gR*PS.dur/8/1e12,1)+' TB in one pass.',
 'A solar particle storm arrives. Protons punch through the shield and flip bits in memory. Error correction catches single flips, but the upsets it cannot fix rise about '+D.spe+' times, from '+f(lamQ,1)+' to '+f(lamS)+' job restarts an hour across the node. Even with checkpoints tuned to the storm, useful work falls from '+f(T.goodput(lamQ,T.youngDaly(lamQ))*100)+'% to '+f(T.goodput(lamS,T.youngDaly(lamS))*100)+'%.',
 'Six months later the Sun angle has dropped to '+f(Math.abs(BD)/D2R,1)+'°, low enough for Earth\'s shadow to clip the orbit. Each lap now has '+f(ecl.t/60)+' minutes of darkness. The compute stops, housekeeping runs on the '+fM(M.battery)+' battery, and work resumes in sunlight. Over a whole year the orbit is sunlit '+f(Y.avail*100,1)+'% of the time.'
];

const P=[];let a=0;
NAMES.forEach((n,i)=>{const w=WT[i]/WS;P.push({n,w,f:TXT[i],u0:a,u1:a+w});a+=w});

/* what is happening at phase i, fraction p through it (before thermal history is added) */
function ctrl(i,p){
 const dk=i===8,bt=dk?BD:BS,S=dk?SD:SS;
 const t=RT0[i]+p*RT[i],nu=dk?2*PI*p:2*PI*t/Tp,g=geom(nu,bt);
 const dep=i<2?0:i===2?sm(p):1;
 const lit=g.lit,load=i<4?0:i===4?sm(p):i===8?lit:1;
 const Pgen=lit*dep*D.Aarr*T.arrayP(S,0);
 const draw=i<2?SB:i===2?SB+(D.hkW*.5-SB)*sm(p):i===3?D.hkW*.5+D.hkW*.5*sm(p):D.hkW+D.nAcc*D.accW*load;
 const storm=i===7?sm(p/.15)*(1-sm((p-.85)/.15)):0;
 let seu=0;if(i===7)[.12,.23,.31,.44,.52,.63,.71,.8,.9].forEach(e=>{const q=p-e;if(q>=0&&q<.05)seu=Math.max(seu,1-q/.05)});
 const lam=(lamQ+(lamS-lamQ)*storm)*load;
 const ps=(2*p-1)*lam0,rng=Math.sqrt(T.a*T.a+K.Re*K.Re-2*T.a*K.Re*Math.cos(ps));
 return{nu,beta:bt,dep,load,lit,Pgen,draw,storm,seu,lam,
  link:i<5?0:i===5?sm(p*2.2):1,gnd:i===6?clamp(3*Math.sin(PI*p),0,1):0,thrust:i===1?.8*Math.sin(PI*clamp((p-.25)/.5,0,1)):0,rad:1,
  alt:i===0?D.h*(1-(1-p)*(1-p)):D.h,v:i===0?T.vel*sm(p):T.vel,rng,sent:i===6?gR*RT[i]*p/8/1e12:0,tr:t};
}

/* step the whole mission once: radiator temperature and battery charge */
const DTT=20,NT=Math.ceil(TOT/DTT)+2,TR=new Float32Array(NT),EB=new Float32Array(NT);
(function(){
 let tr=255,e=Ecap,i=0;TR[0]=tr;EB[0]=e;
 for(let k=1;k<NT;k++){
  const t=(k-1)*DTT;while(i<8&&t>=RT0[i+1])i++;
  const c=ctrl(i,clamp((t-RT0[i])/RT[i],0,1)),A=D.Arad*Math.max(.06,c.dep);
  tr+=(c.draw-A*T.radNet(tr,i===8?ED:ES))/T.Cth*DTT;
  e=c.Pgen>=c.draw?Math.min(Ecap,e+Math.min(c.Pgen-c.draw,CHG)*DTT):Math.max(0,e-(c.draw-c.Pgen)*DTT);
  TR[k]=tr;EB[k]=e;
 }
})();

function at(u){
 u=clamp(u,0,1);let i=0;while(i<8&&u>=P[i+1].u0)i++;
 const p=clamp((u-P[i].u0)/(P[i].u1-P[i].u0),0,1),c=ctrl(i,p),k=c.tr/DTT,k0=Math.min(NT-2,Math.floor(k)),fr=k-k0;
 const Tr=TR[k0]+(TR[k0+1]-TR[k0])*fr,E=EB[k0]+(EB[k0+1]-EB[k0])*fr;
 const Qrad=D.Arad*Math.max(.06,c.dep)*Math.max(0,T.radNet(Tr,i===8?ED:ES));
 return Object.assign({i,n:P[i].n,f:P[i].f,th:0,t:c.tr,u,Tr,E,Qrad,Tj:T.Tjunc(Tr,c.load)},c);
}

function read(s){
 const i=s.i,gp=T.goodput(s.lam,T.youngDaly(Math.max(s.lam,1e-6)));
 const X=[
  ['Mission time',fT(s.t)],
  ['Altitude',fD(s.alt)],
  ['Sun angle',f(Math.abs(s.beta)/D2R,1)+'°'],
  ['Array power',fW(s.Pgen)],
  ['Power draw',fW(s.draw)],
  ['Radiators',fC(s.Tr)],
  ['Chip junction',s.load>0?fC(s.Tj):'off'],
  ['Compute',f(T.PFLOPS*s.load)+' PFLOP/s']
 ];
 const Z=[
  [['Speed',f(s.v/1e3,2)+' km/s'],['Launch mass',fM(M.total)]],
  [['Orbit period',f(Tp/60,1)+' min'],['Orbits per day',f(86400/Tp,1)]],
  [['Wings open',f(s.dep*100)+' %'],['Array area',f(s.dep*D.Aarr)+' m²']],
  [['Battery',f(s.E/Ecap*100)+' %'],['Heat to shed',fW(s.draw)]],
  [['Thermal margin',f(D.Tj-s.Tj)+' K'],['Heat radiated',fW(s.Qrad)]],
  [['Neighbour link',fR(NB.R*s.link)],['Beam width',f(T.wAt(D.sep,D.Dap)*100,1)+' cm']],
  [['Sent this pass',f(s.sent,1)+' TB'],['Range, delay',fD(s.rng)+', '+f(s.rng/K.c*1e3,1)+' ms']],
  [['Restarts per hour',f(s.lam,1)],['Useful work',f(gp*100)+' %']],
  [['Sunlight',s.lit>.5?'In sun':'In shadow'],['Battery',f(s.E/Ecap*100)+' %']]
 ][i];
 return X.concat(Z);
}

Object.assign(T,{P,TOT,at,read,geom,DSUN,DDARK,Ecap,CHG,gR,PS,lam0});
})();
