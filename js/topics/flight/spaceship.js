/* Topic: Spaceship. A crewed fusion ship. Everything on screen is derived from the numbers in the block below. */
(function(){
const HV=window.HV=window.HV||{};
const PI=Math.PI,sm=x=>x*x*(3-2*x);

/* ---------- reference ship (THEORETICAL) ---------- */
const m0=200000,dry=140000,F=20000,ve=100000,mdot=F/ve,mb1=30000,RING_G=0.342;   /* kg, kg, N, m/s, kg/s */
const m1=m0-mb1,v1=ve*Math.log(m0/m1),mEnd=m1*Math.exp(-v1/ve);
const Tb1=mb1/mdot,Tb2=(m1-mEnd)/mdot,Tc=40*86400;
const sOf=t=>ve*(t-((m0-mdot*t)/mdot)*Math.log(m0/(m0-mdot*t)));
const S1=sOf(Tb1),S2=S1+v1*Tc,S3=S2+v1*1800;
const sB=t=>S3+v1*t-ve*(t-((m1-mdot*t)/mdot)*Math.log(m1/(m1-mdot*t)));
const S4=sB(Tb2);
const fmtT=s=>s<120?Math.round(s)+' s':s<7200?Math.round(s/60)+' min':s<172800?(s/3600).toFixed(1)+' h':(s/86400).toFixed(1)+' days';

const P=[
 {n:'Parked in orbit',w:.06,T:1800,s0:0,f:'In orbit the ship is already falling around Earth, so crew and cargo float. The engine is cold.'},
 {n:'Spinning up the ring',w:.10,T:600,s0:0,f:'Spin gravity is angular speed squared times radius. At 6 rpm on an 8.5 m radius that is about a third of Earth gravity.'},
 {n:'Igniting the reactor',w:.12,T:3600,s0:0,f:'Fusion needs plasma far hotter than the Sun’s core, held away from every wall by magnetic fields. Warm-up is slow.'},
 {n:'Burn: speeding up',w:.22,T:Tb1,s0:0,f:'Thrust is only 20 kN, so speed builds slowly. Every second 0.2 kg of propellant leaves at 100 km/s.'},
 {n:'Coasting',w:.16,T:Tc,s0:S1,f:'Engine off. Nothing pushes the ship, so it keeps its speed with no fuel burned. The radiators cool.'},
 {n:'Flipping',w:.08,T:1800,s0:S2,f:'Small thrusters turn the ship half a turn so the engine points the way it is travelling.'},
 {n:'Burn: slowing down',w:.20,T:Tb2,s0:S3,f:'The same engine now brakes. The ship stops when its speed reaches zero, with propellant to spare.'},
 {n:'Arrival',w:.06,T:0,s0:S4,f:''}
];
let tt=0;P.forEach(p=>{p.t0=tt;tt+=p.T});
const TOTAL=tt;
P[7].f='Trip time '+fmtT(TOTAL)+', about '+Math.round(S4/1e9)+' million km, with '+((mEnd-dry)/1000).toFixed(1)+' t of propellant left. That is roughly the distance to Mars at its closest.';

function at(u){
 u=Math.max(0,Math.min(.99999,u));
 let i=0,a=0;while(i<7&&u>=a+P[i].w){a+=P[i].w;i++}
 const p=P[i],f=(u-a)/p.w,tau=f*p.T,s={i,n:p.n,f:p.f,t:p.t0+tau,v:0,s:p.s0,m:m0,th:0,pw:0,ring:1,flip:0,heat:0};
 if(i===0)s.ring=0;
 else if(i===1)s.ring=sm(f);
 else if(i===2){s.pw=sm(f);s.heat=s.pw*.5}
 else if(i===3){const x=m0-mdot*tau;s.m=x;s.v=ve*Math.log(m0/x);s.s=sOf(tau);s.th=1;s.pw=1;s.heat=1}
 else if(i===4){s.m=m1;s.v=v1;s.s=S1+v1*tau;s.pw=.35;s.heat=1-.6*f}
 else if(i===5){s.m=m1;s.v=v1;s.s=S2+v1*tau;s.pw=.35;s.heat=.4;s.flip=sm(f)}
 else if(i===6){const x=m1-mdot*tau;s.m=x;s.v=v1-ve*Math.log(m1/x);s.s=sB(tau);s.th=1;s.pw=1;s.heat=.4+.6*f;s.flip=1}
 else {s.m=mEnd;s.flip=1;s.pw=.2;s.heat=.3}
 return s;
}
function read(s){return[
 ['Time','T+ '+fmtT(s.t)],['Speed',(s.v/1000).toFixed(1)+' km/s'],['Distance',(s.s/1e9).toFixed(2)+' M km'],['Mass',(s.m/1000).toFixed(0)+' t'],
 ['Propellant',Math.max(0,(s.m-dry)/1000).toFixed(1)+' t'],['Thrust',(F*s.th/1000).toFixed(0)+' kN'],['Acceleration',(F*s.th/s.m).toFixed(3)+' m/s²'],['Ring gravity',(RING_G*s.ring*s.ring).toFixed(2)+' g']]}

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

/* ---------- parts shown in the World tab ---------- */
const PARTS=[
 {id:'hull',n:'Crew hull',l:'PROPOSED',d:'The pressurised section where the crew lives and flies the ship. It sits at the front, with the whole ship behind it acting as a shield.',k:[['Length','about 40 m total'],['Crew','3 to 6']]},
 {id:'ring',n:'Spin ring',l:'PROPOSED',d:'A wheel that turns slowly to press the crew against its floor. Spin gravity equals angular speed squared times radius. Nothing like it has flown.',k:[['Radius','8.5 m'],['Spin','6 rpm'],['Gravity','0.34 g']]},
 {id:'shield',n:'Shadow shield',l:'PROPOSED',d:'A thick disc between reactor and crew. Fusion throws out neutrons and gamma rays, and the crew sit in the shield’s shadow, so the radiation never reaches them.',k:[['Job','blocks neutrons, gamma']]},
 {id:'reactor',n:'Fusion reactor',l:'THEORETICAL',d:'Light atoms are squeezed hot enough to fuse and release energy. Lab fusion has beaten break-even at the target, but no reactor yet powers a vehicle.',k:[['Jet power','1 GW'],['Plasma','over 100 million K']]},
 {id:'tanks',n:'Propellant tanks',l:'PROPOSED',d:'Cold propellant is heated by the reactor and thrown out the back. Tanks sit beside the reactor, and the stored mass also helps stop radiation.',k:[['Propellant','60 t'],['Dry mass','140 t']]},
 {id:'rad',n:'Radiators',l:'BUILT',d:'Space has no air, so heat can only leave as light. The big fins glow as the load rises. The ISS already carries radiators; this ship needs far bigger ones. The fins drawn here are schematic. The area figure assumes about 1 GW of waste heat radiated at 1,500 K.',k:[['Law','power grows with T⁴'],['Area needed','about 3,900 m²']]},
 {id:'coils',n:'Magnetic nozzle',l:'THEORETICAL',d:'No solid nozzle could survive the plasma. Superconducting coils steer it instead, turning a hot cloud into a narrow beam.',k:[['Exhaust speed','100 km/s'],['Thrust','20 kN']]}
];

/* ---------- the 3D ship ---------- */
function create(THREE,root){
 const mats=[],geos=[],parts={},ship=new THREE.Group();root.add(ship);
 const M=(c,o)=>{const m=new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.5,metalness:.3,emissive:c,emissiveIntensity:.1},o));m.userData.ei=m.emissiveIntensity;mats.push(m);return m};
 const BM=(c,o)=>{const m=new THREE.MeshBasicMaterial(Object.assign({color:c},o));mats.push(m);return m};
 const part=(id,dx,dy,dz)=>{const g=new THREE.Group();g.userData={dir:new THREE.Vector3(dx,dy,dz),ms:[]};parts[id]=g;ship.add(g);return g};
 const add=(g,geo,m,x,y,z,rx,ry,rz)=>{geos.push(geo);const me=new THREE.Mesh(geo,m);me.position.set(x||0,y||0,z||0);me.rotation.set(rx||0,ry||0,rz||0);g.add(me);if(g.userData.ms&&g.userData.ms.indexOf(m)<0&&m.emissive)g.userData.ms.push(m);return me};
 const CY=(a,b,h,s)=>new THREE.CylinderGeometry(a,b,h,s||24),R90=PI/2;
 const body=M('#dfe6f2'),dark=M('#2a3350',{metalness:.5}),gold=M('#c8a24a',{metalness:.6,emissiveIntensity:.18}),orange=M('#ff7a2b',{emissiveIntensity:.9}),cyan=M('#5df2ff',{emissiveIntensity:1.1,roughness:.3});

 /* crew hull: octagonal section, wedge prow, tower, windows */
 const hull=part('hull',0,0,4);
 add(hull,CY(.85,.85,4.6,8),body,0,0,3.5,R90);
 add(hull,CY(.12,.85,2.2,8),body,0,0,6.9,R90);
 add(hull,new THREE.BoxGeometry(.9,.06,1.5),cyan,0,.42,6.1,-.28,0,0);
 add(hull,new THREE.BoxGeometry(.14,.04,3.8),orange,0,.83,3.4);
 add(hull,new THREE.BoxGeometry(.7,.5,1.3),body,0,1.05,2.6);
 add(hull,new THREE.BoxGeometry(.5,.08,.3),cyan,0,1.1,3.3);
 add(hull,CY(.02,.02,1.2,6),dark,0,1.8,2.2);
 for(const sd of[-1,1])add(hull,new THREE.BoxGeometry(.04,.12,3.2),cyan,sd*.8,.1,3.4);
 add(hull,new THREE.TorusGeometry(.14,.025,6,16),cyan,0,0,8.02);

 /* neck + spin ring */
 const ring=part('ring',0,0,1.5);
 add(ring,CY(.45,.45,2.8,12),dark,0,0,-.2,R90);
 const spin=new THREE.Group();spin.position.set(0,0,-.2);ring.add(spin);
 add(spin,new THREE.TorusGeometry(3.4,.3,10,56),body,0,0,0);
 for(let k=0;k<4;k++){const sg=new THREE.Group();sg.rotation.z=k*R90;spin.add(sg);add(sg,new THREE.BoxGeometry(.1,2.65,.1),dark,0,1.78,0)}
 for(let k=0;k<20;k++){const a=k/20*PI*2,w=new THREE.Mesh(new THREE.BoxGeometry(.12,.3,.14),cyan);geos.push(w.geometry);w.position.set(Math.cos(a)*3.4,Math.sin(a)*3.4,.18);w.rotation.z=a;spin.add(w)}
 add(spin,new THREE.TorusGeometry(3.4,.03,6,56),orange,0,0,.3);
 ring.userData.ms.push(body,cyan);

 /* shadow shield */
 const shield=part('shield',0,0,-1.2);
 add(shield,CY(4,4,.16,56),dark,0,0,-1.7,R90);
 add(shield,CY(3.95,3.95,.02,56),gold,0,0,-1.79,R90);
 add(shield,new THREE.TorusGeometry(4,.06,6,56),orange,0,0,-1.7);
 add(shield,new THREE.TorusGeometry(2.4,.025,6,48),cyan,0,0,-1.62);

 /* reactor */
 const reactor=part('reactor',0,0,-3.2);
 const coreM=M('#bff8ff',{emissive:'#7fe9ff',emissiveIntensity:1.6,roughness:.2});
 const core=add(reactor,new THREE.SphereGeometry(.42,20,16),coreM,0,0,-3.2);
 add(reactor,CY(.95,.95,.08,28),dark,0,0,-2.0,R90);add(reactor,CY(.95,.95,.08,28),dark,0,0,-4.4,R90);
 for(let k=0;k<6;k++){const a=k/6*PI*2;add(reactor,CY(.035,.035,2.4,6),body,Math.cos(a)*.85,Math.sin(a)*.85,-3.2,R90)}
 add(reactor,new THREE.TorusGeometry(.8,.03,6,32),cyan,0,0,-3.2);
 add(reactor,new THREE.TorusGeometry(.62,.03,6,32),cyan,0,.0,-3.2,0,R90,0);

 /* tanks */
 const tanks=part('tanks',3,0,-1.5);
 for(const sd of[-1,1]){
  add(tanks,CY(.5,.5,2.6,24),gold,sd*1.35,0,-3.2,R90);
  add(tanks,new THREE.SphereGeometry(.5,16,10),gold,sd*1.35,0,-1.9);add(tanks,new THREE.SphereGeometry(.5,16,10),gold,sd*1.35,0,-4.5);
  add(tanks,new THREE.BoxGeometry(.8,.06,.06),dark,sd*.9,0,-2.4);add(tanks,new THREE.BoxGeometry(.8,.06,.06),dark,sd*.9,0,-4.0);
 }

 /* radiators: four fins in an X, hidden in the shield's shadow */
 const rad=part('rad',0,0,-2.5);
 const radM=M('#e6ebf3',{emissive:'#ff7a2b',emissiveIntensity:0,metalness:.2});radM.userData.ei=0;
 for(let k=0;k<4;k++){const g=new THREE.Group();g.rotation.z=k*R90+PI/4;rad.add(g);
  add(g,new THREE.BoxGeometry(.04,2.0,3.0),radM,0,2.8,-3.5);add(g,CY(.05,.05,3.0,6),orange,0,1.8,-3.5,R90)}
 rad.userData.ms.push(radM);

 /* magnet coils and the beam */
 const coils=part('coils',0,0,-3.5);
 [[-5.0,.95],[-5.8,1.2],[-6.7,1.5],[-7.7,1.85]].forEach(c=>{add(coils,new THREE.TorusGeometry(c[1],.08,8,40),cyan,0,0,c[0])});
 for(let k=0;k<4;k++){const a=k*R90+PI/4;add(coils,CY(.03,.03,3.0,6),dark,Math.cos(a)*1.25,Math.sin(a)*1.25,-6.3,R90)}
 const bm1=BM('#6fe3ff',{transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
 const bm2=BM('#ffffff',{transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
 add(coils,new THREE.ConeGeometry(1.7,10,24,1,true),bm1,0,0,-12.9,-R90);
 add(coils,new THREE.ConeGeometry(.75,12,16,1,true),bm2,0,0,-13.9,-R90);

 /* dust that streams past while travelling: the sense of speed */
 const N=420,dp=new Float32Array(N*3);
 for(let i=0;i<N;i++){dp.set([(Math.random()-.5)*34,(Math.random()-.5)*34,(Math.random()-.5)*70],i*3)}
 const dg=new THREE.BufferGeometry();dg.setAttribute('position',new THREE.BufferAttribute(dp,3));geos.push(dg);
 const dust=new THREE.Points(dg,new THREE.PointsMaterial({size:.09,color:0xbfeaff,transparent:true,opacity:.7,depthWrite:false,blending:THREE.AdditiveBlending}));mats.push(dust.material);root.add(dust);

 /* worlds: Earth falls away behind the ship, Mars grows ahead. Procedural, no image files. */
 const tex=[];
 const hs=(x,y,z)=>{const h=Math.sin(x*127.1+y*311.7+z*74.7)*43758.5453;return h-Math.floor(h)};
 const vn=(x,y,z)=>{const xi=Math.floor(x),yi=Math.floor(y),zi=Math.floor(z),u=sm(x-xi),v=sm(y-yi),w=sm(z-zi),L=(a,b,t)=>a+(b-a)*t,h=(i,j,k)=>hs(xi+i,yi+j,zi+k);
  return L(L(L(h(0,0,0),h(1,0,0),u),L(h(0,1,0),h(1,1,0),u),v),L(L(h(0,0,1),h(1,0,1),u),L(h(0,1,1),h(1,1,1),u),v),w)};
 const fbm=(x,y,z)=>{let s=0,a=.5;for(let o=0;o<5;o++){s+=a*vn(x,y,z);x*=2.03;y*=2.03;z*=2.03;a*=.5}return s};
 const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
 function planetTex(isEarth){
  const W=384,H=192,cv=document.createElement('canvas');cv.width=W;cv.height=H;
  const g=cv.getContext('2d'),im=g.createImageData(W,H),d=im.data;
  for(let y=0;y<H;y++){const la=(y/H-.5)*PI,cy=Math.sin(la),cr=Math.cos(la);
   for(let x=0;x<W;x++){const lo=x/W*PI*2,px=Math.cos(lo)*cr,pz=Math.sin(lo)*cr,i=(y*W+x)*4;
    const h=fbm(px*2.2+(isEarth?0:9),cy*2.2,pz*2.2);let c;
    if(isEarth){
     if(h<.52){c=mix([54,140,200],[14,60,130],Math.min(1,(.52-h)*5))}
     else{const e=Math.min(1,(h-.52)*4);c=e<.6?mix([60,130,60],[170,150,100],e/.6):mix([170,150,100],[245,245,245],(e-.6)/.4)}
     if(Math.abs(cy)>.86-.1*fbm(px*3,cy*3,pz*3))c=[240,246,255];
     const cl=Math.min(1,Math.max(0,fbm(px*3.5+20,cy*3.5,pz*3.5)-.52)*3.2);c=mix(c,[255,255,255],cl*.85);
    }else{
     const n=fbm(px*5,cy*5,pz*5);c=[150+70*n,70+40*n,40+25*n];
     if(h<.45)c=[c[0]*.62,c[1]*.62,c[2]*.62];
     if(Math.abs(cy)>.9-.05*n)c=[235,225,215];
    }
    d[i]=c[0];d[i+1]=c[1];d[i+2]=c[2];d[i+3]=255}}
  g.putImageData(im,0,0);const t=new THREE.CanvasTexture(cv);tex.push(t);return t;
 }
 const sun=new THREE.Vector3(.7,.35,-.55).normalize();
 function planet(isEarth,rad){
  const grp=new THREE.Group(),m=new THREE.ShaderMaterial({
   uniforms:{t:{value:planetTex(isEarth)},sun:{value:sun},atm:{value:new THREE.Color(isEarth?'#6fb8ff':'#ff9a66')},k:{value:isEarth?1:.45}},
   vertexShader:'varying vec2 vu;varying vec3 vn,vp;void main(){vu=uv;vn=normalize(mat3(modelMatrix)*normal);vp=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vp,1.);}',
   fragmentShader:'uniform sampler2D t;uniform vec3 sun,atm;uniform float k;varying vec2 vu;varying vec3 vn,vp;void main(){vec3 n=normalize(vn),v=normalize(cameraPosition-vp);float d=max(dot(n,sun),0.),rim=pow(1.-max(dot(n,v),0.),3.);vec3 c=texture2D(t,vu).rgb;gl_FragColor=vec4(c*(.04+1.05*smoothstep(0.,.35,d))+atm*rim*k*(.25+.9*d),1.);}'});
  const hm=new THREE.ShaderMaterial({uniforms:{c:{value:new THREE.Color(isEarth?'#5aa8ff':'#ff8a55')}},transparent:true,side:THREE.BackSide,blending:THREE.AdditiveBlending,depthWrite:false,
   vertexShader:'varying vec3 vn;void main(){vn=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:'uniform vec3 c;varying vec3 vn;void main(){float i=pow(max(.62-dot(vn,vec3(0.,0.,1.)),0.),3.);gl_FragColor=vec4(c*i*.9,1.);}'});
  const bg=new THREE.SphereGeometry(rad,48,32),hg=new THREE.SphereGeometry(rad*1.13,32,24);geos.push(bg,hg);mats.push(m,hm);
  const body=new THREE.Mesh(bg,m);grp.add(body,new THREE.Mesh(hg,hm));root.add(grp);grp.rotation.z=.4;return grp;
 }
 const PE=planet(true,40),PM=planet(false,16);
 const lerp=(a,b,t)=>a+(b-a)*t;
 function place(f){
  const a=Math.pow(f,.4),b=Math.pow(f,2.4);
  PE.position.set(lerp(0,-40,a),lerp(-52,-4,a),lerp(-6,-300,a));PE.scale.setScalar(lerp(1,.5,a));
  PM.position.set(lerp(30,14,b),lerp(10,-4,b),lerp(520,80,b));PM.scale.setScalar(lerp(.8,1.5,b));
 }
 place(0);
 /* the sun: a soft flare far off, the same direction that lights both planets */
 const sc=document.createElement('canvas');sc.width=sc.height=128;
 const sg=sc.getContext('2d'),gr=sg.createRadialGradient(64,64,0,64,64,64);
 gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.12,'rgba(255,240,200,.85)');gr.addColorStop(.4,'rgba(255,200,120,.18)');gr.addColorStop(1,'rgba(255,180,100,0)');
 sg.fillStyle=gr;sg.fillRect(0,0,128,128);
 const sunT=new THREE.CanvasTexture(sc);tex.push(sunT);
 const sunS=new THREE.Sprite(new THREE.SpriteMaterial({map:sunT,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));
 mats.push(sunS.material);sunS.scale.set(220,220,1);sunS.position.copy(sun).multiplyScalar(480);root.add(sunS);
 /* reactor glow lights the hull */
 const coreL=new THREE.PointLight(0x7fe9ff,0,45);coreL.position.set(0,0,-3.2);ship.add(coreL);

 /* lights */
 const L=[new THREE.AmbientLight(0x8ea0c0,.7),new THREE.DirectionalLight(0xffffff,1.2),new THREE.DirectionalLight(0x5df2ff,.5)];
 L[1].position.set(6,8,10);L[2].position.set(-8,2,-10);L.forEach(l=>root.add(l));

 let ex=0,spinA=0,sp=0;
 return {
  update(dt,time,o){
   const st=o.state,live=o.tab==='launch'||o.tab==='fly';
   const th=live?st.th:.35,pw=live?st.pw:.6,heat=live?st.heat:.5,rg=live?st.ring:.5;
   ex+=(o.explode-ex)*Math.min(1,dt*5);
   for(const id in parts){const g=parts[id];g.position.copy(g.userData.dir).multiplyScalar(ex*1.4);
    const pulse=o.sel===id?.55+.45*Math.sin(time*7):0;g.userData.ms.forEach(m=>{m.emissiveIntensity=(m.userData.ei||0)+pulse})}
   radM.emissiveIntensity=heat*.9+(o.sel==='rad'?.5+.4*Math.sin(time*7):0);radM.userData.ei=heat*.9;
   const wob=1+.08*Math.sin(time*9);core.scale.setScalar((.5+pw*.7)*wob);coreM.userData.ei=1.6;
   bm1.opacity=th*.5;bm2.opacity=th*.85;
   place(live?Math.max(0,Math.min(1.2,st.s/S4)):0);PE.rotation.y+=dt*.01;PM.rotation.y+=dt*.01;coreL.intensity=pw*2.2*wob;
   spinA+=dt*rg*1.3;spin.rotation.z=spinA;
   ship.rotation.y=live?PI*st.flip:0;
   dust.visible=live;
   if(live){const sgn=Math.sign(st.v),sv=Math.log10(1+Math.abs(st.v)/1000);sp+=sv*dt*9;const a=dg.attributes.position.array;
    const dz=sgn*sv*dt*22;
    for(let i=0;i<N;i++){let z=a[i*3+2]-dz;if(z<-35)z+=70;else if(z>35)z-=70;a[i*3+2]=z}dg.attributes.position.needsUpdate=true}
  },
  dispose(){geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());tex.forEach(t=>t.dispose())}
 };
}

/* ---------- Learn tab ---------- */
const LEARN=[
 {h:'The idea',l:'THEORETICAL',p:['A fusion ship pushes itself with the energy that powers the Sun. Instead of burning fuel in a chemical flame, it fuses light atoms and throws the hot products out the back at extreme speed.','The payoff is time. Chemical rockets take months to reach Mars. This reference ship covers roughly the same distance as Mars at closest approach in about six weeks, and it can slow itself down on arrival.']},
 {h:'Why chemical rockets are stuck',l:'BUILT',p:['The best chemical engines throw their exhaust out at about 4.5 km/s. That is a physical limit set by how much energy a chemical bond holds.','Because the ship must carry the fuel it uses to carry fuel, the numbers snowball. Almost all of a chemical rocket at launch is propellant.']},
 {h:'The rocket equation',l:'BUILT',p:['Every rocket obeys one law: the speed change it can make equals its exhaust speed times the natural log of its mass ratio, wet mass divided by dry mass.','Here: 100 km/s × ln(200 ÷ 140) = 35.7 km/s. Doubling exhaust speed doubles that, and no amount of cleverness with tanks does as much.'],k:['Wet mass 200 t, dry mass 140 t, propellant 60 t','Exhaust speed 100 km/s, two to three times the best ion thrusters flying today, with tens of thousands of times their thrust','Speed change available: 35.7 km/s']},
 {h:'Fusion: the fuel',l:'THEORETICAL',p:['Deuterium and tritium fuse into helium and a neutron, releasing 17.6 MeV. Roughly 80 percent of that energy leaves in the neutron, which a magnet cannot steer and which damages materials.','Deuterium with helium-3 releases mostly charged particles that magnets can steer into a beam, which suits a rocket. The catch: helium-3 is very scarce on Earth.','Lab fusion has delivered more energy than the lasers put into the target (NIF, 2022). No device yet powers anything, and none is close to ship size.']},
 {h:'The magnetic nozzle',l:'THEORETICAL',p:['Plasma at over 100 million kelvin would vaporise any solid bell. So the four superconducting coils at the back act as the nozzle: they guide the plasma and turn a hot cloud into a narrow beam.','Superconducting magnets are BUILT (tokamaks, MRI machines). Small plasma thrusters with magnetic nozzles have been tested, but they make a tiny fraction of the thrust this ship needs.']},
 {h:'Getting rid of heat',l:'BUILT',p:['A vacuum is a thermos. Nothing carries heat away, so it can only leave as light. Radiated power grows with temperature to the fourth power, so hotter fins shed heat much faster, but they also need more material.','That is why the ship carries four huge radiator fins. Watch them glow in the Launch and Fly tabs when the burn is on.']},
 {h:'Protecting the crew',l:'PROPOSED',p:['Fusion makes neutrons and gamma rays. The crew sit behind distance, tanks, and a thick shadow shield, so the radiation passes around them.','Everything with a hull must hide inside that shadow cone, which is why the ring, hull and tanks all sit within the disc’s outline.']},
 {h:'Gravity from spin',l:'PROPOSED',p:['Spin makes a floor. Gravity felt is angular speed squared times radius. At 6 rpm and 8.5 m: 0.63² × 8.5 ÷ 9.81 = 0.34 g.','A bigger, slower ring is more comfortable, because fast spin makes heads feel dizzy. This one is sized to fit a hangar, not to be ideal. Nothing like it has ever flown.']},
 {h:'Flip and burn',l:'PROPOSED',p:['Thrust is gentle: 20 kN on 200 t is 0.1 m/s², one hundredth of Earth gravity. So the ship burns for days to build speed, coasts, flips, then burns again to stop.','In the Launch tab you can drag through the whole trip and watch speed, fuel, thrust and gravity change. In the Fly tab you take the controls yourself.']},
 {h:'Fly it yourself',l:'THEORETICAL',p:['The Fly tab runs the same ship on live physics. You set the throttle, the engine burns real propellant, and mass, speed and distance update from the rocket equation. The engine only pushes along the ship’s axis, so to stop you must flip the ship and burn the other way.','To keep it playable, the model is a straight line from Earth to a stationary Mars. It ignores the Sun’s gravity (about 6 percent of the engine’s push at Earth’s distance from the Sun), the gravity of both planets, and the way the planets move. A real trajectory would be curved.'],k:['Goal: get inside Mars’s sphere of influence (about 577,000 km) slower than about 385 m/s, which is Mars’s escape speed at that distance','Earth link: by the end of the trip a radio signal needs about 3 minutes to reach Earth, and nothing can make it faster','Clock lag: special relativity makes the ship clock fall a few milliseconds behind Earth over the trip','Planet sizes and distances on screen are compressed so you can see them']},
 {h:'Honest status',l:'THEORETICAL',p:['Every number here is a design target for a ship that does not exist. The physics is sound, but fusion power, huge radiators, and a spin ring are all unbuilt.','The labels tell you which parts are BUILT, PROPOSED, or THEORETICAL.']}
];

HV.topics.spaceship={slug:'spaceship',title:'Spaceship',
 hook:'A crewed fusion ship. Six weeks to Mars distance, and it stops when it gets there.',
 stats:[['35.7 km/s','speed change'],['0.1 m/s²','acceleration'],['0.34 g','ring gravity']],
 learn:LEARN,parts:PARTS,create:create,fly:{create:createFly},mission:{at:at,read:read,phases:P.map(p=>({n:p.n,w:p.w}))}};
})();
