/* Microbot swarm · Launch tab: the swarm grows a sculpture out of a pile, lets go, flows back and grows another one.
   Every bot, its departure and its arrival come from forming.js. Letting go is the build played backwards. */
(function(){
const T=(window.HV.T=window.HV.T||{}).microbots=window.HV.T.microbots||{};
const {clamp,PIDLE,PMOVE,EB,USE,HC,FORMS,sculpt,fmtT}=T;

/* ---------- shared by Launch and Fly ---------- */
const CACHE={};
/* a sculpture with its structure check and schedule, worked out once. area is the skin that sheds heat, m² */
function grown(key,k,lanes){
 const id=key+'|'+k+'|'+(lanes||8);if(CACHE[id])return CACHE[id];
 const base=CACHE[key+'|'+k+'|any']||(CACHE[key+'|'+k+'|any']=sculpt(key,k));
 const sc=Object.assign({},base,{id:key+'|'+k,time:T.timeline(base.model,{lanes:lanes||8})});
 let area=0;for(const l of sc.model.lines){const c=l.c;for(let i=1;i<c.P.length;i++)area+=2*Math.PI*l.rad(i)*(c.S[i]-c.S[i-1])*1e-6}
 sc.area=Math.max(1e-4,area);return CACHE[id]=sc}
/* how many bots have snapped on and how many are walking at build time t */
function census(sc,t){const a=sc.time.arrive,l=sc.time.leave;let placed=0,moving=0;
 for(let i=0;i<a.length;i++){if(t>=a[i])placed++;else if(t>l[i])moving++}return{placed,moving}}

/* ---------- the mission ---------- */
const A=grown('tendrils',1.5,32),B=grown('hand',1.5,32),NA=A.model.n,NB=B.model.n,NP=Math.max(NA,NB);
const TA=A.time.time,TB=B.time.time,END=TA*2+TB;
const pc=x=>Math.round(x*100)+'%',N=n=>Math.round(n).toLocaleString('en-US');

/* sc: which shape is on screen. from→to: its build time over the phase. t0→t1: mission time over the phase. */
const P=[
 {n:'Pile & seed',w:.07,sc:A,from:0,to:0,t0:0,t1:4,f:N(NP)+' bots wait in a pile. Each one’s turn to leave is set by how far it will have to walk.'},
 {n:'The trunk rises',w:.18,sc:A,from:0,to:TA*.4,t0:4,t1:4+TA*.4,f:'Bots flow out of the pile, crawl up what is already built and snap on at the growing end. Each bends at its ball as it walks.'},
 {n:'Tendrils reach',w:.22,sc:A,from:TA*.4,to:TA,t0:4+TA*.4,t1:4+TA,f:'Five tapered bundles curl outward. Bots climb over the finished ones to reach the tips.'},
 {n:'Stand & check',w:.12,sc:A,from:TA,to:TA,t0:4+TA,t1:14+TA,f:'It passes the check only if the strands in each bundle grip each other. If each bent on its own, the bonds would be at '+A.check.looseUse.toFixed(1)+' times their limit.'},
 {n:'Let go & flow',w:.15,sc:A,from:TA,to:0,t0:14+TA,t1:14+TA*2,f:'The bonds release from the tips inward and the swarm pours back into the pile.'},
 {n:'Reshape: a hand',w:.26,sc:B,from:0,to:TB,t0:14+TA*2,t1:14+TA*2+TB,f:'The same bots take a new shape. Only the instructions changed: a palm, four fingers and a thumb.'}
];

function at(u){
 u=clamp(u,0,.99999);
 let i=0,a=0;while(i<P.length-1&&u>=a+P[i].w){a+=P[i].w;i++}
 const p=P[i],f=clamp((u-a)/p.w,0,1),g=i===P.length-1?Math.min(1,f/.9):f;     /* hold the finished hand at the end */
 const bt=p.from+(p.to-p.from)*g,t=p.t0+(p.t1-p.t0)*g,c=census(p.sc,bt),moving=c.moving;
 /* worst bot: idle all along, plus the longest walk once for each build or release it has done */
 const walk=s=>s.time.eMax-PIDLE*s.time.time;
 const walked=i<4?walk(A)*bt/TA:i===4?walk(A)*(2-bt/TA):walk(A)*2+walk(B)*bt/TB;
 const batt=(PIDLE*t+walked)/EB,powerW=NP*PIDLE+moving*PMOVE;
 return{i,n:p.n,f:p.f,th:0,sc:p.sc,bt,t,placed:c.placed,moving,target:p.sc.model.n,batt,powerW,heat:powerW/(HC*p.sc.area),total:NP}}

function read(s){
 const pw=s.powerW>=1?s.powerW.toFixed(2)+' W':Math.round(s.powerW*1e3)+' mW',c=s.sc.check;
 return[
  ['Mission time','T+ '+fmtT(s.t)],
  ['Shape',s.sc.label],
  ['Bots in the shape',N(s.placed)+' / '+N(s.target)],
  ['Walking now',N(s.moving)],
  ['Swarm power',pw],
  ['Worst battery used',pc(s.batt)+' (cut-off '+pc(USE)+')'],
  ['Warming (estimate)',s.heat.toFixed(1)+' K'],
  ['Bonds, locked bundles',pc(c.worst)+' of limit'],
  ['Bonds, loose strands',pc(c.looseUse)+' of limit'],
  ['Mass of the shape',(c.mass*1e3).toFixed(0)+' g']]}

Object.assign(T,{grown,census,REF:A,P,at,read});
})();
