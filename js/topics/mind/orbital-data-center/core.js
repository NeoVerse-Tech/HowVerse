/* Orbital data center · core. Design numbers, formulas and helpers shared by every file. Loaded first.
   Reference design: one compute node of about 740 kW, flying alone or in a cluster, in a dawn-dusk sun-synchronous orbit at 650 km.
   Labels: small GPU satellites in orbit are BUILT. A megawatt-class node like this one is PROPOSED. Gigawatt clusters are THEORETICAL.
   All design values (areas, masses, device figures) are chosen to fit together, in the spirit of published concepts. They are not a copy of any company's design.
   Simplifications, stated honestly in the Learn tab: a circular orbit and a cylindrical Earth shadow, a Lambertian Earth for albedo, a fixed
   radiation curve instead of a full AE-9/AP-9 run, one lumped thermal mass, one failure rate per accelerator, no debris model, no launch loads. */
(function(){
const HV=window.HV=window.HV||{};
HV.T=HV.T||{};

const PI=Math.PI,D2R=PI/180,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

/* physical constants */
const K={S0:1361,sig:5.670374419e-8,mu:3.986004418e14,Re:6371e3,Reeq:6378.137e3,J2:1.08263e-3,c:2.99792458e8,hP:6.62607015e-34,g0:9.80665,
 Mir:237,alb:.30,yr:365.2422,day:86400,eps:23.439*D2R};
K.wSun=2*PI/(K.yr*K.day);                                    /* the rate the orbit must turn to stay sun-synchronous, rad/s */

/* design numbers (SI unless the name says otherwise) */
const DES={
 h:650e3,ltan:6,                                            /* altitude, m. Local time of the ascending node, hours: 6 = dawn-dusk */
 /* solar array: two sun-tracking wings of rolled-out triple-junction cells */
 Aarr:2800,etaRef:.295,Tref:301.15,dEta:-5e-4,pack:.92,harn:.97,bol:.97,deg:.02,life:5,
 aSol:.90,eF:.85,eB:.80,arrKg:1.6,                          /* area m², cell efficiency at 28 °C, change per K, cell packing, harness and converter, first-day loss, loss per year, design life yr, absorptance, emittance front and back, kg per m² */
 /* radiators: flat two-sided panels, plane kept edge-on to the sun */
 Arad:850,eR:.85,aR:.25,tilt:2*D2R,Trad:320,radKg:3.5,      /* panel area m², emittance, solar absorptance at mid-life, pointing error, sizing temperature K (the area is checked against it), kg per m² */
 /* compute */
 nAcc:700,accW:1000,boardW:700,hkW:40e3,pflop:.99,hbmGB:80, /* accelerators, all-in watts each, board watts each, bus housekeeping W, PFLOP/s each (dense BF16), memory GB each */
 Tj:358.15,rjc:.03,rcp:.012,dLoop:6,                         /* junction limit K, junction-to-case K/W, cold plate K/W, loop temperature drop at full load K */
 accKg:12,                                                  /* kg per accelerator, with its share of chassis, cold plate, power conversion and cabling */
 /* shielding, structure, other mass */
 shT:5e-3,shA:400,rhoAl:2700,                                /* aluminium-equivalent shield: thickness m, vault area m², density kg/m³ */
 structKg:3000,loopKg:2500,busKg:1500,propKg:700,batSpec:180,batDod:.4,
 coolKg:3000,cpCool:3400,cpHw:700,cpRad:900,                 /* coolant kg and J/kg/K, hardware J/kg/K, radiator J/kg/K */
 /* radiation and faults */
 tid:15,seuBit:2e-11,mbu:.0016,spe:30,ckpt:60,rest:300,      /* krad(Si) tolerance, raw upsets per bit per day, share that ECC cannot fix, storm factor, checkpoint s, restart s */
 /* links */
 lam:1550e-9,Pt:1,Dap:.10,sep:200,nb:100,loss:.25,rateCap:8e12,gndCap:100e9,gndDap:.40,gndLoss:.5,
 /* economics */
 grid:.08                                                   /* what a kWh costs on the ground, $ (design value) */
};

/* ---------- orbit ---------- */
const a=K.Re+DES.h,Tper=2*PI*Math.sqrt(a*a*a/K.mu),vel=Math.sqrt(K.mu/a),nMean=2*PI/Tper;
const incl=Math.acos(clamp(-(2/3)*K.wSun/(K.J2*nMean*Math.pow(K.Reeq/a,2)),-1,1));   /* sun-synchronous: the J2 bulge turns the orbit once a year */
const rhoE=Math.asin(K.Re/a);                                                        /* angular radius of Earth seen from the node */
const betaStar=Math.asin(K.Re/a);                                                    /* below this angle the orbit dips into Earth's shadow */
const fEcl=b=>{const c=Math.cos(b);if(c<1e-9)return 0;const x=Math.sqrt(DES.h*DES.h+2*K.Re*DES.h)/(a*c);return x>=1?0:Math.acos(x)/PI};

/* sun direction, orbit normal and beta angle for day d of the year (1 = 1 January). Circular orbit, mean-sun nodal rate. */
const sunLon=d=>{const M=2*PI*(d-3)/K.yr;return(283+M/D2R+1.915*Math.sin(M)+.02*Math.sin(2*M))*D2R};
const raMean=d=>(280.46+.9856474*(d-1.5))*D2R;
function beta(d){
 const l=sunLon(d),s=[Math.cos(l),Math.sin(l)*Math.cos(K.eps),Math.sin(l)*Math.sin(K.eps)];
 const Om=raMean(d)+(DES.ltan-12)*15*D2R,si=Math.sin(incl),n=[si*Math.sin(Om),-si*Math.cos(Om),Math.cos(incl)];
 return Math.asin(clamp(s[0]*n[0]+s[1]*n[1]+s[2]*n[2],-1,1));
}
const flux=d=>K.S0*(1+2*.0167*Math.cos(2*PI*(d-3)/K.yr));                           /* sunlight at the node, W/m²: 3% stronger in early January */
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],ML=[31,28,31,30,31,30,31,31,30,31,30,31];
function dayLabel(d){d=Math.round(clamp(d,1,365));let m=0;while(m<11&&d>ML[m]){d-=ML[m];m++}return d+' '+MON[m]}

/* a year of beta angles and eclipses, worked out once. The eclipse season is the unbroken run of days around the minimum beta (it crosses New Year). */
const eclOf=d=>{const fe=fEcl(Math.abs(beta(d)));return{f:fe,t:fe*Tper,sun:1-fe}};
const YEAR=(()=>{
 let days=0,tmax=0,sum=0,bmin=9,bmax=0,dmin=1;
 for(let d=1;d<=365;d++){
  const b=Math.abs(beta(d)),fe=fEcl(b);sum+=1-fe;
  if(b<bmin){bmin=b;dmin=d}if(b>bmax)bmax=b;
  if(fe>0)days++;
  if(fe*Tper>tmax)tmax=fe*Tper;
 }
 const wrap=d=>((d-1+365)%365)+1;let from=dmin,to=dmin;
 while(from!==wrap(dmin+1)&&fEcl(Math.abs(beta(wrap(from-1))))>0&&dmin-from<200)from=wrap(from-1);
 while(to!==wrap(dmin-1)&&fEcl(Math.abs(beta(wrap(to+1))))>0&&to-dmin<200&&(to-dmin+365)%365<200)to=wrap(to+1);
 return{days,tmax,avail:sum/365,bmin,bmax,dmin,from,to};
})();

/* ---------- viewing the Earth, and what it adds to the heat ---------- */
/* view factor from a flat plate to the Earth's disc, for a plate whose normal makes angle bt with straight down */
function fview(bt){
 const nt=64,np=64,nx=Math.sin(bt),nz=Math.cos(bt);let s=0;
 for(let i=0;i<nt;i++){const th=(i+.5)/nt*rhoE,st=Math.sin(th),ct=Math.cos(th);
  for(let j=0;j<np;j++){const dt=nx*st*Math.cos((j+.5)/np*2*PI)+nz*ct;if(dt>0)s+=dt*st}}
 return s*(rhoE/nt)*(2*PI/np)/PI;
}
const FE90=fview(PI/2);                                                              /* a plate edge-on to the ground: sees about a quarter of its face's hemisphere as Earth */

/* reflected sunlight on both faces of a plate kept edge-on to the sun, orbit-averaged, as a fraction of (albedo x sunlight). Lambertian Earth. */
const albC={};
function albedoF(bd){
 const key=Math.round(bd/5)*5;if(albC[key]!=null)return albC[key];
 const b=key*D2R,s=[Math.cos(b),0,Math.sin(b)],nt=24,np=24,NU=24;
 const cr=(p,q)=>[p[1]*q[2]-p[2]*q[1],p[2]*q[0]-p[0]*q[2],p[0]*q[1]-p[1]*q[0]],dot=(p,q)=>p[0]*q[0]+p[1]*q[1]+p[2]*q[2];
 let tot=0;
 for(let k=0;k<NU;k++){
  const nu=(k+.5)/NU*2*PI,r=[Math.cos(nu),Math.sin(nu),0];let xb=cr(s,r);const m=Math.hypot(xb[0],xb[1],xb[2]);if(m<1e-6)continue;
  xb=xb.map(v=>v/m);const zn=[-r[0],-r[1],-r[2]],yb=cr(zn,xb);let sum=0;
  for(let i=0;i<nt;i++){const th=(i+.5)/nt*rhoE,st=Math.sin(th),ct=Math.cos(th),dist=a*ct-Math.sqrt(Math.max(0,K.Re*K.Re-a*a*st*st));
   for(let j=0;j<np;j++){const ps=(j+.5)/np*2*PI,cp=Math.cos(ps),sp=Math.sin(ps);
    const u=[xb[0]*st*cp+yb[0]*st*sp+zn[0]*ct,xb[1]*st*cp+yb[1]*st*sp+zn[1]*ct,xb[2]*st*cp+yb[2]*st*sp+zn[2]*ct];
    const g=[(r[0]*a+u[0]*dist)/K.Re,(r[1]*a+u[1]*dist)/K.Re,(r[2]*a+u[2]*dist)/K.Re],cz=dot(s,g);
    if(cz>0)sum+=cz*Math.abs(st*cp)*st}}
  tot+=sum*(rhoE/nt)*(2*PI/np)/PI;
 }
 return albC[key]=tot/NU;
}

/* ---------- the solar array ---------- */
const etaT=T=>Math.max(0,DES.etaRef+DES.dEta*(T-DES.Tref));                          /* cells lose efficiency as they warm */
function arrayT(S){                                                                  /* the temperature where heat in equals heat radiated */
 const ab=DES.aSol*S+(DES.eF+DES.eB)*FE90*K.Mir;let lo=200,hi=450;
 for(let i=0;i<50;i++){const m=(lo+hi)/2,g=ab-etaT(m)*DES.pack*S-(DES.eF+DES.eB)*K.sig*Math.pow(m,4);if(g>0)lo=m;else hi=m}
 return(lo+hi)/2;
}
const arrayP=(S,yr)=>S*etaT(arrayT(S))*DES.pack*DES.harn*DES.bol*Math.pow(1-DES.deg,yr||0);   /* W per m² of array delivered to the bus */

/* ---------- the radiators ---------- */
const radOut=T=>2*DES.eR*K.sig*Math.pow(T,4);                                        /* W per m² of panel, both faces, before the environment pushes back */
const envLoad=(bt,S)=>2*DES.eR*FE90*K.Mir+DES.aR*K.alb*S*albedoF(bt/D2R)+DES.aR*S*Math.sin(DES.tilt);   /* Earth heat, reflected sunlight, sunlight leaking onto the faces; W per m² of panel */
const radNet=(T,env)=>radOut(T)-env;
const radArea=(Q,T,env)=>Q/radNet(T,env);
const radTemp=(Q,A,env)=>Math.pow((Q/A+env)/(2*DES.eR*K.sig),.25);

/* a heat pump lifts heat to a hotter radiator. Carnot limit scaled by a real-machine fraction. */
function hp(Qc,Tc,Th,eta){eta=eta||.4;const W=Qc*(Th-Tc)/(Tc*eta);return{W,Qh:Qc+W}}

/* ---------- power, heat and the chips ---------- */
const Qdes=DES.nAcc*DES.accW+DES.hkW;                                                /* design electrical load, all of it ends up as heat, W */
const PFLOPS=DES.nAcc*DES.pflop;                                                     /* peak, PFLOP/s */
const Cth=DES.coolKg*DES.cpCool+DES.nAcc*DES.accKg*DES.cpHw+DES.Arad*DES.radKg*DES.cpRad;   /* lumped thermal mass, J/K */
const Tjunc=(Tr,load)=>Tr+DES.dLoop*(DES.hkW+DES.nAcc*DES.accW*load)/Qdes+(DES.rcp+DES.rjc)*DES.boardW*load;   /* radiator to chip junction, K */

/* the steady state of the whole node. load 0..1 is the share of full compute power; d is the day; yr is years in orbit; sun is false in eclipse. */
function plant(o){
 const d=o.d==null?1:o.d,yr=o.yr||0,ld=clamp(o.load==null?1:o.load,0,1),sun=o.sun!==false,bt=Math.abs(beta(d)),S=flux(d);
 const Pgen=sun?DES.Aarr*arrayP(S,yr):0,Pdraw=DES.hkW+DES.nAcc*DES.accW*ld,env=envLoad(bt,S),Tr=radTemp(Pdraw,DES.Arad,env);
 return{S,beta:bt,Pgen,Pdraw,Tr,Tj:Tjunc(Tr,ld),env,margin:Pgen-Pdraw,Tcell:arrayT(S)};
}
/* the most compute the node can run flat out in sunlight, and what stops it */
function maxLoad(d,yr){
 let lo=0,hi=1;
 const ok=ld=>{const p=plant({d,yr,load:ld});return p.Pdraw<=p.Pgen*.98&&p.Tj<=DES.Tj};
 if(ok(1))return{load:1,limit:'none'};
 for(let i=0;i<40;i++){const m=(lo+hi)/2;if(ok(m))lo=m;else hi=m}
 const p=plant({d,yr,load:lo+.001});return{load:lo,limit:p.Pdraw>p.Pgen*.98?'power':'thermal'};
}
const dTdt=(Tr,Q,env)=>(Q-DES.Arad*radNet(Tr,env))/Cth;                              /* K/s, one lumped thermal mass */
const tauTh=(Tr,Q)=>Cth/(4*Q/Tr);                                                    /* time constant of the thermal mass against the T^4 law, s */

/* ---------- eclipse and the battery ---------- */
const batKg=E=>E/3600/(DES.batSpec*DES.batDod);                                      /* pack mass for E joules, at the planned depth of discharge */
const eclEnergy=(P,t)=>P*t;

/* ---------- radiation ---------- */
/* dose behind aluminium, krad(Si) per year, in a 650 km sun-synchronous orbit. A fixed design curve with the shape of published
   trapped-particle results. A real mission runs AE-9 and AP-9 for its exact orbit. Log-log between points. */
const DOSE=[[.5,16],[1,7],[2,2.6],[3,1.6],[5,.75],[8,.38],[12,.2],[20,.12],[30,.08]];
function dose(tmm){
 if(tmm<=DOSE[0][0])return DOSE[0][1];
 for(let i=1;i<DOSE.length;i++){const p=DOSE[i-1],q=DOSE[i];
  if(tmm<=q[0]){const u=Math.log(tmm/p[0])/Math.log(q[0]/p[0]);return Math.exp(Math.log(p[1])+u*(Math.log(q[1])-Math.log(p[1])))}}
 return DOSE[DOSE.length-1][1];
}
const doseMission=(tmm,yr)=>dose(tmm)*(yr==null?DES.life:yr);
const tidMargin=tmm=>DES.tid/doseMission(tmm);
const shieldKg=tmm=>DES.shA*tmm*1e-3*DES.rhoAl;
const bits=DES.hbmGB*8e9;
const rawPerAccDay=bits*DES.seuBit;                                                  /* memory bit flips per accelerator per day, all caught by error correction when single */
const uePerAccDay=rawPerAccDay*DES.mbu;                                              /* the ones error correction cannot fix: they restart a job */
const lamFleet=(st)=>DES.nAcc*uePerAccDay*(st?DES.spe:1)/24;                         /* restarts per hour across the node (st = storm) */
/* share of time spent on useful work when jobs checkpoint every tc seconds (Young and Daly). lam is restarts per hour. */
function goodput(lam,tc,C,R){
 C=C==null?DES.ckpt:C;R=R==null?DES.rest:R;const l=lam/3600;if(l<=0)return 1/(1+C/tc);
 if(tc==null)tc=Math.sqrt(2*C/l);
 return 1/(1+C/tc+l*(tc/2+R));
}
const youngDaly=lam=>Math.sqrt(2*DES.ckpt/(lam/3600));

/* ---------- links ---------- */
const Eph=K.hP*K.c/DES.lam;                                                        /* energy of one photon, J */
const wAt=(L,Dt)=>{const w0=.4*Dt,zR=PI*w0*w0/DES.lam;return w0*Math.sqrt(1+(L/zR)*(L/zR))};
const couple=(L,Dt,Dr)=>1-Math.exp(-2*(Dr/2)*(Dr/2)/Math.pow(wAt(L,Dt),2));         /* share of a Gaussian beam caught by the far aperture */
function linkRate(L,o){
 o=o||{};const Dt=o.Dt||DES.Dap,Dr=o.Dr||DES.Dap,Pt=o.Pt||DES.Pt,cap=o.cap||DES.rateCap,ls=o.loss==null?DES.loss:o.loss;
 const Prx=Pt*ls*couple(L,Dt,Dr),Rp=Prx/(Eph*DES.nb);
 return{Prx,Rp,R:Math.min(Rp,cap),lim:Rp<cap?'power':'bandwidth',eta:couple(L,Dt,Dr),w:wAt(L,Dt),far:Dt*Dt/DES.lam};
}
/* a ground pass at minimum elevation el (radians): length, closest-to-farthest range and light time */
function pass(el){
 const H=a/K.Re,lam=Math.acos(Math.cos(el)/H)-el,dur=2*lam/(2*PI)*Tper;
 const slant=K.Re*(Math.sqrt(H*H-Math.cos(el)*Math.cos(el))-Math.sin(el));
 return{dur,slant,zen:DES.h,delay:slant/K.c,delayZ:DES.h/K.c,arc:2*lam/D2R};
}

/* ---------- drag and station-keeping ---------- */
const RHO=[[400,3e-12],[500,5e-13],[600,1.2e-13],[650,6e-14],[700,3e-14],[800,8e-15],[1000,4e-16]];   /* kg/m³ at average solar activity */
function rho(hm,act){
 const hk=hm/1e3;let r=RHO[RHO.length-1][1];
 if(hk<=RHO[0][0])r=RHO[0][1];
 else for(let i=1;i<RHO.length;i++){const p=RHO[i-1],q=RHO[i];
  if(hk<=q[0]){const u=(hk-p[0])/(q[0]-p[0]);r=Math.exp(Math.log(p[1])+u*(Math.log(q[1])-Math.log(p[1])));break}}
 return r*(act==null?1:act);
}
/* area the node shows to the flow: radiators face the flight direction, wings are close to edge-on, tilted by the season */
const dragA=bt=>DES.Arad+80+DES.Aarr*(2/PI)*Math.cos(bt);
const MASSKG=(()=>{
 const m={array:DES.arrKg*DES.Aarr,radiators:DES.radKg*DES.Arad,compute:DES.accKg*DES.nAcc,shield:DES.shA*DES.shT*DES.rhoAl,
  structure:DES.structKg,loop:DES.loopKg,bus:DES.busKg,propellant:DES.propKg,battery:batKg(DES.hkW*YEAR.tmax)};
 m.total=Object.keys(m).reduce((s,k)=>s+m[k],0);return m;
})();
const dvYear=(act,bt)=>.5*rho(DES.h,act)*vel*vel*2.2*dragA(bt==null?75*D2R:bt)/MASSKG.total*K.yr*K.day;   /* m/s per year */
const propYear=(dv,isp)=>MASSKG.total*(1-Math.exp(-dv/(K.g0*(isp||1800))));                              /* kg per year for a Hall thruster */

/* ---------- money ---------- */
const kwhLife=DES.nAcc*DES.accW*DES.life*8766*YEAR.avail/1000;                       /* kWh the compute uses over its life (hours x kW) */
const launchKWh=price=>MASSKG.total*price/kwhLife;                                   /* launch cost alone, $ per kWh */
const breakEven=target=>target*kwhLife/MASSKG.total;                                 /* $ per kg at which launch alone costs 'target' per kWh */

/* ---------- formatters ---------- */
const f=(x,d)=>Number(x).toFixed(d==null?0:d);
const comma=x=>Math.round(x).toLocaleString('en-US');
const SUP={'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','-':'⁻'};
const sci=(x,d)=>{if(!x)return'0';const e=Math.floor(Math.log10(Math.abs(x))),m=x/Math.pow(10,e);return f(m,d==null?1:d)+'×10'+String(e).split('').map(c=>SUP[c]).join('')};
const fW=w=>w>=1e9?f(w/1e9,2)+' GW':w>=1e6?f(w/1e6,2)+' MW':w>=1e3?f(w/1e3,0)+' kW':f(w,0)+' W';
const fM=kg=>kg>=1e3?f(kg/1e3,1)+' t':f(kg,0)+' kg';
const fD=m=>m>=1e3?f(m/1e3,m>=1e5?0:1)+' km':f(m,m<10?1:0)+' m';
const fC=K_=>f(K_-273.15,0)+' °C';
const fR=b=>b>=1e12?f(b/1e12,1)+' Tb/s':b>=1e9?f(b/1e9,0)+' Gb/s':b>=1e6?f(b/1e6,0)+' Mb/s':f(b,0)+' b/s';
const fT=s=>s>=86400?f(s/86400,1)+' days':s>=3600?f(s/3600,1)+' h':s>=60?f(s/60,1)+' min':f(s,0)+' s';

HV.T.odc={K,DES,PI,D2R,clamp,a,Tper,vel,nMean,incl,rhoE,betaStar,fEcl,eclOf,sunLon,beta,flux,dayLabel,YEAR,fview,FE90,albedoF,
 etaT,arrayT,arrayP,radOut,envLoad,radNet,radArea,radTemp,hp,Qdes,PFLOPS,Cth,Tjunc,plant,maxLoad,dTdt,tauTh,batKg,eclEnergy,
 DOSE,dose,doseMission,tidMargin,shieldKg,bits,rawPerAccDay,uePerAccDay,lamFleet,goodput,youngDaly,
 Eph,wAt,couple,linkRate,pass,RHO,rho,dragA,MASSKG,dvYear,propYear,kwhLife,launchKWh,breakEven,
 f,comma,sci,fW,fM,fD,fC,fR,fT};
})();
