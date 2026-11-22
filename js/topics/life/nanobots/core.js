/* Nanobots · core: shared constants and helpers (physics of the reference bot) */
(function(){
const T=(window.HV.T=window.HV.T||{}).nanobots=window.HV.T.nanobots||{};
const PI=Math.PI,sm=x=>x*x*(3-2*x),clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),rel=x=>sm(clamp(x,0,1));
const MU=3.5e-3,RHO=1060,LBOT=3e-6,RBOT=1.5e-6,VSW=20,NB=100000;   /* blood viscosity Pa·s, density kg/m³, bot length m, bot radius m, swim speed µm/s, swarm size */
const UMEAN=2000,X0=8000,XN=500,UA=15;                              /* mean flow in a 50 µm vessel µm/s, start distance µm, slow zone µm, flow at the clot face µm/s */
const B2=(UMEAN-UA)/(XN*XN),KAB=Math.sqrt(UA*B2),TH0=Math.atan(XN*Math.sqrt(B2/UA)),T_APP=TH0/KAB;   /* flow in the slow zone: u = UA + B2 x² */
const xApp=tau=>{const th=TH0-KAB*tau;return th<=0?0:Math.sqrt(UA/B2)*Math.tan(th)};                 /* exact position while drifting through it */
const drag=v=>6*PI*MU*RBOT*v*1e-6*1e12;                             /* Stokes drag in pN for a speed in µm/s */
const ReOf=v=>RHO*v*1e-6*LBOT/MU;
const fmtT=s=>s<120?Math.round(s)+' s':s<7200?Math.round(s/60)+' min':(s/3600).toFixed(1)+' h';

Object.assign(T,{PI,sm,clamp,rel,MU,RHO,LBOT,RBOT,VSW,NB,UMEAN,X0,XN,UA,B2,KAB,TH0,T_APP,xApp,drag,ReOf,fmtT});
})();
