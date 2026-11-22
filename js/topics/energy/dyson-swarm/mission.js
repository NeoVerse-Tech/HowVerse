/* Dyson swarm · Launch mission (Phase 6): from the first collector to full power.
   at(u) turns playback position u (0 to 1) into a state; read(s) turns the state into readouts.
   at() also publishes T.live. makeMission() (called from register.js) reads T.live and drives the swarm, beams and camera
   from outside, so world.js and earth.js are not changed. Every number comes from core.js and earth.js.
   All design values here are illustrative, not a finished design. */
(function(){
const T=window.HV.T.dyson,S=T.SUN,f=T.f,sci=T.sci,comma=T.comma;
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const HUMAN=1.9e13;                                              /* humanity's average power use, W */

/* ---------- the plan ---------- */
const EFF=.3,AC=1e6;                                             /* collector: 30% efficient, 1 km² each */
const LINK={relay:.95,trunk:.9,hub:.9,earth:.8};                 /* share of power kept at each hop (assumed) */
const CHAIN=LINK.relay*LINK.trunk*LINK.hub*LINK.earth;
const PER=AC*T.flux(T.REAL_AU)*EFF;                              /* W from one collector at the swarm */
const NFULL=Math.ceil(HUMAN/(PER*CHAIN));                        /* collectors needed to put 19 TW on Earth */
const FULLH=NFULL*PER*LINK.relay*LINK.trunk;                     /* power reaching the hub at full power */
const HEATF=FULLH*(1-LINK.hub);                                  /* waste heat at the hub at full power */

const pw=w=>w>=1e12?f(w/1e12,w<1e13?2:1)+' TW':w>=1e9?f(w/1e9,w<1e10?2:1)+' GW':w>=1e6?f(w/1e6,1)+' MW':w>=1e3?f(w/1e3,1)+' kW':f(w,0)+' W';
const pc=x=>f(x*100,0)+'%';
const dm=x=>x<1e-4?'under 0.01%':f(x*100,x<.1?2:x<1?1:0)+'%';

/* stage: 0 collecting only, 1 nexus online, 2 trunk beam and hub online, 3 Earth beam online */
const P=[
 {n:'First collector',w:.12,st:0,f:'One collector is launched from the hub and unfolds facing the Sun. It makes electricity, but nothing links it to anywhere yet.'},
 {n:'The nexus wakes',w:.16,st:1,f:'The relays and the gateway come online. Collectors beam to the nearest relay, and the relays hand the power on to the gateway. Nothing has reached the hub yet.'},
 {n:'The trunk beam',w:.16,st:2,f:'The gateway fires the trunk beam. The hub receiver catches it and the power core starts work, and starts shedding heat.'},
 {n:'First power at Earth',w:.16,st:3,f:'The hub turns power into microwaves and aims them at the ocean receiver. The first electricity reaches Earth.'},
 {n:'Scaling up',w:.22,st:3,f:'The fabrication bay builds collectors faster. More power also means more waste heat for the radiators to shed.'},
 {n:'Full power',w:.18,st:3,f:'The fleet reaches the size that puts 19 TW, humanity\'s average use, on Earth. This is an accounting result, not a proven design.'}
];
let a=0;P.forEach(p=>{p.u0=a;a+=p.w;p.u1=a});
const END=[8,.02*NFULL,.1*NFULL,.25*NFULL,.85*NFULL,NFULL].map(Math.round);   /* collector count at the end of each phase */

function at(u){
 u=clamp(u,0,1);let i=0;while(i<P.length-1&&u>=P[i].u1)i++;
 const p=P[i],l=clamp((u-p.u0)/p.w,0,1),c0=i?END[i-1]:1,c1=END[i],st=p.st;
 const count=Math.max(1,Math.round(Math.exp(Math.log(c0)+(Math.log(c1)-Math.log(c0))*l)));
 const Pc=count*PER,Pg=st>=1?Pc*LINK.relay:0,Ph=st>=2?Pg*LINK.trunk:0,Pe=st>=3?Ph*LINK.hub*LINK.earth:0;
 const s={i,n:p.n,f:p.f,th:0,u,st,count,Pc,Pg,Ph,Pe,heat:st>=2?Ph*(1-LINK.hub):0,met:Math.min(1,Pe/HUMAN)};
 T.live={t:performance.now(),i,st,count,full:NFULL,frac:Math.min(1,Ph/FULLH)};
 return s;
}

function read(s){
 const out=[['Collectors',comma(s.count)+' of '+comma(NFULL)],['Power collected',pw(s.Pc)]];
 out.push(['Reaching the hub',s.st>=2?pw(s.Ph):'not yet']);
 out.push(['Power at Earth',s.st>=3?pw(s.Pe):'not yet']);
 out.push(['Earth demand met',dm(s.met)]);
 out.push(['Collector to Earth',s.st>=3?pc(s.Pe/s.Pc)+' kept':'link not complete']);
 out.push(['Hub waste heat',s.st>=2?pw(s.heat)+' ('+f(s.heat/T.heat.perM2/1e6,0)+' km² of radiator at 1,000 K)':'none yet']);
 out.push(['Share of the Sun used',sci(s.Pc/S.L,1)]);
 return out;
}

/* ---------- Learn ---------- */
const B=T.beam,lk=T.link;
const MISSION_LEARN=[
 {h:'The Launch mission',l:'THEORETICAL',p:[
  'The Launch tab plays a build-up from one collector to full power. In this plan each collector is a thin film about 1 km² that turns '+pc(EFF)+' of the light it catches into electricity. At '+T.REAL_AU+' AU one collector makes about '+pw(PER)+'.',
  'Power crosses four hops before it is useful: relay, trunk beam, hub, and the Earth beam with its receiver. Together they keep about '+pc(CHAIN)+'. So putting all of humanity\'s 19 TW on Earth takes about '+comma(NFULL)+' collectors, '+comma(NFULL*AC/1e6)+' km² in all. On screen the swarm fills in as the count rises, so the dots are scaled, not counted one for one.']},

 {h:'What each hop costs',l:'THEORETICAL',p:[
  'The kept shares are assumptions: relays '+pc(LINK.relay)+', the trunk beam '+pc(LINK.trunk)+', the hub '+pc(LINK.hub)+', and the Earth beam with its receiver '+pc(LINK.earth)+'. Lab rectennas can convert microwaves very efficiently, but only at small sizes. Nothing at this scale exists.',
  'The losses become heat. At full power the hub takes in about '+pw(FULLH)+' so that 19 TW can reach the ground. It loses about '+pw(HEATF)+' as heat, which takes about '+f(HEATF/T.heat.perM2/1e6,0)+' km² of radiator at 1,000 K. That is more than the 1.9 TW example in the heat section, because the hub here carries the power that is lost after it too.']},

 {h:'The honest limits',l:'THEORETICAL',p:[
  'Demand: 19 TW is what humanity uses on average today. The Sun puts out about '+sci(S.L/HUMAN,1)+' times that, so the supply of sunlight is not the limit. Building, aiming and cooling are.',
  'Diffraction: light spreads because it is a wave. The trunk beam stays narrow, about '+f(B.spot*2,0)+' m wide at the hub, but it must be aimed within about '+f(B.aimMas,1)+' milli-arcseconds. The Earth beam spreads to about '+f(lk.spot*2/1e3,0)+' km wide, and keeping its centre near '+lk.SAFE+' W/m² needs around '+comma(lk.N)+' beams.',
  'Treat the Launch tab as an accounting exercise. It shows how the numbers add up, not that the system can be built.']}
];
const MISSION_END={h:'Where this stands',l:'THEORETICAL',p:[
 'The Sun on screen follows measured values, and the orbits follow ordinary orbital physics. L1 and the docking and robot-arm technology have real precedents. But no collector, relay, gateway, hub or Earth receiver like the ones in this topic has been built. The swarm, the nexus, the hub ship and the beam to Earth are a design study.',
 'The Launch tab now runs the whole chain, from the first collector to power on Earth. A hands-on Fly mode is still to come. Distances are compressed so the whole system fits.']};

/* ---------- scene bridge ----------
   While the Launch tab plays, at() keeps T.live fresh. This reads it and changes only what the mission needs:
   the number of collectors, which beams are on, how bright the trunk and Earth beams are, and where the view looks.
   When T.live goes quiet (LIVE_MS) everything returns to the full swarm. */
const LIVE_MS=1500,BN=320;
const GX=T.SR*T.SW*T.GATE_K,HX=GX+T.HUB_D,EX=HX+30+120+26;      /* same layout as world.js and earth.js */
const CAM=[0,-GX*.5,-HX,-(HX+EX)/2,-(HX+EX)/2,-EX/2];           /* view centre for each phase */

T.makeMission=function(THREE,root){
 let sw=null,ln=null,dots=null,trunk=null,eb=null;const discs=[];
 root.traverse(o=>{
  const g=o.geometry,p=g&&g.parameters,m=o.material;
  if(g&&g.isInstancedBufferGeometry&&!sw)sw=o;
  else if(o.isLineSegments)ln=o;
  else if(o.isPoints)dots=o;
  else if(p&&p.radiusTop===4.5&&p.radiusBottom===.55)trunk=o;
  else if(p&&p.radiusBottom===6.4)eb=o;
  if(m&&m.uniforms&&m.uniforms.uL&&m.uniforms.uDir)discs.push(m);
 });
 const N0=sw?sw.geometry.instanceCount:0;
 let was=false,mx=0;
 T.live=null;
 const live=()=>{const L=T.live;return L&&performance.now()-L.t<LIVE_MS?L:null};
 return{
  /* runs after world.js and before earth.js, so the Earth glow follows the dimmed trunk beam */
  pre(){
   const L=live();
   if(!L){
    if(was){was=false;if(sw)sw.geometry.instanceCount=N0;for(const x of[ln,dots,trunk,eb])if(x)x.visible=true}
    return;
   }
   if(!was){was=true;mx=root.position.x}
   const st=L.st,k=Math.sqrt(L.frac);
   if(sw)sw.geometry.instanceCount=st>=1?clamp(Math.round(N0*L.count/L.full),Math.min(BN,N0),N0):Math.min(L.count,N0);
   if(ln)ln.visible=st>=1;
   if(dots)dots.visible=st>=1;
   if(trunk){trunk.visible=st>=2;trunk.material.uniforms.uLoad.value*=st>=2?k:0}
   if(eb)eb.visible=st>=3;
   for(const m of discs){const u=m.uniforms;u.uL.value*=(u.uDir.value>0?st>=2:st>=3)?k:0}
  },
  /* runs last: the view follows the mission unless a part is selected */
  post(dt,o){
   const L=live();if(!L||(o&&o.sel))return;
   mx+=(CAM[L.i]-mx)*Math.min(1,dt*2);root.position.x=mx;
  },
  dispose(){T.live=null}
 };
};

Object.assign(T,{P,at,read,pw,NFULL,MISSION_LEARN,MISSION_END});
})();
