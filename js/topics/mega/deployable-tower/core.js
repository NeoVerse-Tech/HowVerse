/* Deployable tower · core. Design numbers, formulas and helpers shared by every file. Loaded first.
   Reference design (PROPOSED): six nested steel tubes, 300 m deployed, 60 m stowed.
   Simplifications, stated honestly in the Learn tab: power-law wind profile, a flat gust factor, one base
   section checked in bending plus axial load, an equivalent uniform tube for buckling and sway frequency. */
(function(){
const HV=window.HV=window.HV||{};
HV.T=HV.T||{};

const g=9.81,RHO=1.225,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

/* design numbers */
const DES={
 N:6,                              /* telescoping stages, stage 0 is the fixed base tube */
 Ls:60,                            /* length of every stage, m */
 Hmin:60,Hmax:300,                 /* stowed and deployed height, m */
 dia:[24,21,18,15,12,9],           /* outer diameter of each stage, m */
 t:.03,                            /* wall thickness, m */
 E:200e9,fy:355e6,gM:1.5,          /* steel stiffness, yield strength, safety factor */
 mass:14e6,                        /* whole tower including 280 t damper, kg */
 damperMass:2.8e5,
 people:2000,                       /* design occupancy when fully deployed */
 cd:.8,                            /* drag coefficient of a rough round tube */
 alpha:.16,                        /* wind profile exponent, open ground */
 zeta0:.01,zetaD:.05,              /* structural damping without and with the tuned damper */
 drive:{jacks:12,eta:.85,rated:5e6,peak:9e6,rateMax:.12,tau:300}, /* rack-and-pinion jacks: W, m/s of height, heat time constant s */
 swayLimDiv:500                    /* sway limit is height / 500 */
};

/* geometry: stage i has its base at i*pitch and a length of Ls. At pitch 0 all six sit nested. */
const pitch=h=>(clamp(h,DES.Hmin,DES.Hmax)-DES.Ls)/(DES.N-1);
const stageZ=(i,h)=>i*pitch(h);
/* outer width the wind sees at elevation z: the lowest stage that covers z is the outer skin there */
const widthAt=(z,h)=>{const p=pitch(h);for(let i=0;i<DES.N;i++)if(z<=i*p+DES.Ls+1e-9)return DES.dia[i];return DES.dia[DES.N-1]};
const stageMass=i=>DES.mass*DES.dia[i]/DES.dia.reduce((a,b)=>a+b,0);

/* wind: mean speed at 10 m (V10, m/s), tower height h (m), damper on/off.
   Returns mean and peak force (N), overturning moment (N·m), area (m²), centre height of the load (m). */
const gust=z=>1+.5*Math.sqrt(.01/z);
function slices(V10,h,damp){
 h=clamp(h,DES.Hmin,DES.Hmax);
 const n=120,dz=h/n,G=gust(damp?DES.zetaD:DES.zeta0),z=[],D=[],f=[];
 for(let k=0;k<n;k++){
  const zk=(k+.5)*dz,d=widthAt(zk,h),V=V10*Math.pow(Math.max(zk,5)/10,DES.alpha);
  z.push(zk);D.push(d);f.push(.5*RHO*V*V*DES.cd*d*dz);
 }
 return{h,n,dz,G,z,D,f};
}
function wind(V10,h,damp){
 const s=slices(V10,h,damp);let F=0,M=0,A=0;
 for(let k=0;k<s.n;k++){F+=s.f[k];M+=s.f[k]*s.z[k];A+=s.D[k]*s.dz}
 return{F,M,A,Fpk:F*s.G,Mpk:M*s.G,zc:F>0?M/F:0,G:s.G};
}

/* section of the equivalent uniform tube, used for buckling and natural frequency */
function eqI(h){const s=slices(0,h,false);let m=0;for(let k=0;k<s.n;k++)m+=Math.pow(s.D[k],3);return Math.PI*DES.t/8*m/s.n}

/* buckling: a free-standing column is fixed at the base, free at the top, so effective length is 2h */
function buckling(h){
 h=clamp(h,DES.Hmin,DES.Hmax);
 const I=eqI(h),Pcr=Math.PI*Math.PI*DES.E*I/Math.pow(2*h,2),N=DES.mass*g;
 return{Pcr,N,ratio:N/Pcr,I};
}
/* natural frequency of a cantilever (first mode), Hz */
const freq=h=>{h=clamp(h,DES.Hmin,DES.Hmax);return .5596*Math.sqrt(DES.E*eqI(h)/(DES.mass*Math.pow(h,3)))};

/* sway: integrate curvature M/EI twice up the tower. Peak load, so it already includes the gust factor. */
function sway(V10,h,damp){
 const s=slices(V10,h,damp),n=s.n;let S=0,T=0;const M=new Array(n),EI=k=>DES.E*Math.PI*Math.pow(s.D[k],3)*DES.t/8;
 for(let k=n-1;k>=0;k--){S+=s.f[k]*s.G;T+=s.f[k]*s.G*s.z[k];M[k]=T-s.z[k]*S}
 let th=0,de=0;
 for(let k=0;k<n;k++){th+=M[k]/EI(k)*s.dz;de+=th*s.dz}
 return{tip:de,lim:s.h/DES.swayLimDiv,ratio:de/(s.h/DES.swayLimDiv)};
}

/* strength at the base: axial load plus peak wind bending, bending magnified as the load nears buckling.
   u = 1 is the limit. */
function check(V10,h,damp){
 h=clamp(h,DES.Hmin,DES.Hmax);
 const w=wind(V10,h,damp),b=buckling(h),D0=DES.dia[0],A0=Math.PI*D0*DES.t,Z0=Math.PI*D0*D0*DES.t/4;
 const amp=1/Math.max(.05,1-b.ratio),sig=b.N/A0+w.Mpk*amp/Z0,sw=sway(V10,h,damp);
 return{u:sig/(DES.fy/DES.gM),sig,amp,Mpk:w.Mpk,Fpk:w.Fpk,sway:sw.tip,swayLim:sw.lim,swayRatio:sw.ratio,Pcr:b.Pcr,N:b.N};
}
/* highest 10 m wind speed (m/s) at which the base stays inside its limit at height h */
function windLimit(h,damp){
 let lo=5,hi=160;if(check(hi,h,damp).u<1)return hi;
 for(let i=0;i<30;i++){const m=(lo+hi)/2;if(check(m,h,damp).u<1)lo=m;else hi=m}
 return lo;
}

/* lift: the jacks under stage i carry the weight of stages i to the top. Deploying raises stage i by i/(N-1) of the height gained. */
const jackForce=i=>{let m=0;for(let j=i;j<DES.N;j++)m+=stageMass(j);return m*g};
const driveK=(()=>{let k=0;for(let i=1;i<DES.N;i++)k+=stageMass(i)*g*i/(DES.N-1);return k})(); /* N per (m/s of height rate) */
const drivePower=rate=>driveK*Math.abs(rate)/DES.drive.eta;                              /* W at that height rate */
const rateAtPower=p=>p*DES.drive.eta/driveK;                                           /* m/s of height rate for a power */
const moveTime=(from,to,rate)=>Math.abs(to-from)/rate;                                  /* s */

/* formatters */
const f=(x,d)=>Number(x).toFixed(d==null?0:d);
const eng=(x,u)=>{const a=Math.abs(x);return a>=1e9?f(x/1e9,2)+' G'+u:a>=1e6?f(x/1e6,a>=1e8?0:1)+' M'+u:a>=1e3?f(x/1e3,a>=1e5?0:1)+' k'+u:f(x,0)+' '+u};
const clock=s=>{s=Math.max(0,Math.round(s));const h=Math.floor(s/3600),m=Math.floor(s%3600/60);return h?h+' h '+(m<10?'0':'')+m+' min':m+' min'};

HV.T.tower={DES,g,RHO,clamp,pitch,stageZ,widthAt,stageMass,gust,wind,eqI,buckling,freq,sway,check,windLimit,jackForce,driveK,drivePower,rateAtPower,moveTime,f,eng,clock};
})();
