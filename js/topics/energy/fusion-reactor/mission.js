/* Fusion reactor · Launch tab: one full pulse, from a warm machine to shutdown.
   Also holds the shared plasma model (T.model) that the Fly tab uses, calibrated so the
   reference point (1.0e20 /m3, 8.8 keV) gives exactly the design fusion power. */
(function(){
const T=(window.HV.T=window.HV.T||{}).fusion=window.HV.T.fusion||{};
const {PI,sm,EV,Vp,Pfus,Paux,nAvg,TavgKeV,Ip,BT,ELM,E_DT,KofkeV,fmtE,fmtT}=T;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),rel=x=>sm(clamp(x,0,1));

/* ---------- shared 0-D plasma model (PROPOSED design, simplified) ---------- */
const EJ=E_DT*1e6*EV;                                         /* joules per fusion */
const sv0=x=>x*x/(1+(x/45)*(x/45));                           /* reactivity shape: rises as T squared, then flattens */
const KS=Pfus/(.25*nAvg*nAvg*EJ*Vp*sv0(TavgKeV));             /* calibration to the design point */
const pfusOf=(n,k)=>.25*n*n*KS*sv0(k)*EJ*Vp;                  /* fusion power W, n in /m3, k in keV */
const wOf=(n,k)=>3*n*k*1e3*EV*Vp;                             /* stored thermal energy J */
const kOf=(n,w)=>n>0?w/(3*n*1e3*EV*Vp):0;
const pradOf=(n,k)=>1.5*5.35e-37*n*n*Math.sqrt(Math.max(k,0))*Vp;   /* bremsstrahlung W */
Object.assign(T,{clamp,rel,pfusOf,wOf,kOf,pradOf});

/* ---------- the pulse ---------- */
const P=[
 {n:'Cooling the magnets',w:.09,T:21*86400,f:'The coils only superconduct when very cold, so the whole magnet system is cooled by liquid helium from room temperature down to '+ELM.coilK+' K. It takes weeks, and is done once, not for every pulse.'},
 {n:'Pumping out the air',w:.08,T:2*86400,f:'Pumps empty the vessel until almost nothing is left. Any stray air would cool the plasma at once, so the vacuum has to be nearly perfect before fuel goes in.'},
 {n:'Charging the field coils',w:.09,T:10800,f:'Current is ramped into the 18 toroidal coils over hours until they make '+BT+' T inside the vessel. They store about 41 GJ, and a quench system stands ready to dump it safely.'},
 {n:'Fuel and breakdown',w:.08,T:12,f:'A small puff of deuterium and tritium gas is let in. The central solenoid’s current is driven down fast, and the changing field makes a voltage around the vessel that tears electrons off the atoms. The gas turns into plasma in a fraction of a second.'},
 {n:'Current ramp-up',w:.10,T:100,f:'The solenoid keeps ramping and drives the plasma current up to 15 MA over about 100 seconds. The current heats the plasma like a heater wire and twists the magnetic field into a helix. The plasma grows from a small ring into its full D shape.'},
 {n:'Heating up',w:.12,T:90,f:'Particle beams and radio waves add '+(Paux/1e6)+' MW and the fuel density is raised. Partway up, the plasma edge forms an insulating barrier, called H-mode, and confinement roughly doubles. As it nears 100 million degrees, the alpha particles start to heat it too.'},
 {n:'The burn',w:.22,T:400,f:'About 500 MW of fusion power from 50 MW of heating: Q = 10. Neutrons carry 400 MW out to the blanket. The alphas stay trapped and supply the other 100 MW that keeps the plasma hot. It lasts about 400 seconds, until the central solenoid runs out of swing. No machine has done this yet.'},
 {n:'Ramp-down',w:.10,T:100,f:'Heating is switched off and the current is ramped down slowly. Dropping it too fast would be a disruption, so the plasma is eased out like a dimmed lamp.'},
 {n:'Afterglow and reset',w:.12,T:1800,f:'The plasma is gone and the reaction has simply stopped. The blanket and vessel shed their heat, the solenoid resets, and the machine can pulse again. A power plant would want pulses much longer than 400 seconds, or steady running.'}
];
let tt=0;P.forEach(p=>{p.t0=tt;tt+=p.T});
const TOTAL=tt;

function at(u){
 u=clamp(u,0,.99999);
 let i=0,a=0;while(i<P.length-1&&u>=a+P[i].w){a+=P[i].w;i++}
 const p=P[i],f=(u-a)/p.w,tau=f*p.T,k=rel(f);
 let coilK=ELM.coilK,bt=BT,ipMA=0,n=0,tk=0,paW=0,cold=1,vac=1,hm=0;
 if(i===0){coilK=ELM.coilK+295.5*(1-k)*(1-k);cold=k;vac=0;bt=0}
 else if(i===1){vac=k;bt=0}
 else if(i===2){bt=BT*k}
 else if(i===3){n=.3e20*k;tk=.01+.09*k;ipMA=.5*k}
 else if(i===4){n=.3e20;tk=.1+.9*k;ipMA=.5+(Ip/1e6-.5)*k}
 else if(i===5){n=(.3+.7*k)*1e20;tk=1+(TavgKeV-1)*k;ipMA=Ip/1e6;paW=Paux*rel(f/.5);hm=rel((f-.4)*5)}
 else if(i===6){n=nAvg;tk=TavgKeV;ipMA=Ip/1e6;paW=Paux;hm=1}
 else if(i===7){n=nAvg*(1-.8*k);tk=TavgKeV*(1-k)*(1-k)+.05*k;ipMA=Ip/1e6*(1-k);paW=Paux*(1-rel(f*3));hm=1-rel(f*2)}
 else{ }
 const pf=n>0?pfusOf(n,tk):0,W=n>0?wOf(n,tk):0;
 return{i,n:p.n,f:p.f,t:p.t0+tau,
  coilK,bt,ipMA,nm:n,tk,paW,pfW:pf,W,
  tf:bt/BT,ip:ipMA/(Ip/1e6),ne:n/1e20,pa:paW/Paux,pf:pf/Pfus,cold,vac,hm,dis:0,
  glow:clamp(tk/TavgKeV,0,1)*(n>0?1:0),th:clamp(pf/Pfus,0,1.2)};
}
function read(s){
 const q=s.paW>1e6&&s.pfW>1e5?(s.pfW/s.paW).toFixed(1):(s.pfW>1e6?'self-heated':'0');
 return[
  ['Time','T+ '+fmtT(s.t)],
  ['Coil temperature',s.coilK>=50?Math.round(s.coilK)+' K':s.coilK.toFixed(1)+' K'],
  ['Field in plasma',s.bt.toFixed(1)+' T'],
  ['Plasma current',s.ipMA>0?(s.ipMA<1?s.ipMA.toFixed(1):s.ipMA.toFixed(s.ipMA>=14.95?0:1))+' MA':'off'],
  ['Plasma heat',s.tk>.005?T.fmtK(KofkeV(s.tk)):'no plasma'],
  ['Density',s.nm>0?(s.nm/1e20).toFixed(2)+'×10²⁰ /m³':'none'],
  ['Heating in',s.paW>0?T.fmtP(s.paW):'off'],
  ['Fusion power',T.fmtP(s.pfW)],
  ['Power gain Q',q],
  ['Stored heat',s.W>0?fmtE(s.W):'none']];
}
Object.assign(T,{P,TOTAL,at,read});
})();
