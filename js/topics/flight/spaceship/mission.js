/* Spaceship · Launch tab: Earth orbit to Mars */
(function(){
const T=(window.HV.T=window.HV.T||{}).spaceship=window.HV.T.spaceship||{};
const {PI,sm,m0,dry,F,ve,mdot,mb1,RING_G,m1,v1,mEnd,Tb1,Tb2,Tc,sOf,S1,S2,S3,sB,S4,fmtT}=T;

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

Object.assign(T,{P,TOTAL,at,read});
})();
