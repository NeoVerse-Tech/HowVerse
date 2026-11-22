/* Spaceship · core: the reference ship (THEORETICAL) and shared helpers */
(function(){
const T=(window.HV.T=window.HV.T||{}).spaceship=window.HV.T.spaceship||{};

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

Object.assign(T,{PI,sm,m0,dry,F,ve,mdot,mb1,RING_G,m1,v1,mEnd,Tb1,Tb2,Tc,sOf,S1,S2,S3,sB,S4,fmtT});
})();
