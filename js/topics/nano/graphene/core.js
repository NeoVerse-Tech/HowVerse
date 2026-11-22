/* Graphene · core. Design numbers, formulas and helpers shared by every file. Loaded first.
   Reference experiment (BUILT-class): a graphene drum 1 µm across, hanging over a well in a chip, pressed at its centre by a
   diamond tip on a cantilever. It follows the nanoindentation test of Lee et al., Science 2008, with design values chosen to fit together.
   Simplifications, stated honestly in the Learn tab: point load at the centre, a perfect membrane, a stress under the tip taken from
   an energy estimate, no thermal ripples, no tip-sample adhesion, no defects. */
(function(){
const HV=window.HV=window.HV||{};
HV.T=HV.T||{};

const PI=Math.PI,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

/* design numbers (SI unless the name says otherwise) */
const DES={
 b:.142e-9,a:.246e-9,t:.335e-9,        /* C-C bond, lattice constant, thickness taken as the layer spacing in graphite, m */
 mC:1.994e-26,                          /* mass of one carbon atom, kg */
 E:340,Dn:-690,                         /* 2D stiffness and third-order constant, N/m: stress = E*strain + Dn*strain^2 */
 s0:.3,nu:.165,                         /* pre-tension, N/m, and Poisson ratio */
 aR:.5e-6,                              /* drum radius, m */
 Rs:16.5e-9,Rb:60e-9,                   /* sharp and blunt tip radius, m */
 kc:40,                                 /* cantilever stiffness, N/m (design value) */
 Zc:40e-9,Zmax:260e-9,slew:80e-9,       /* start gap above the sheet, piezo range, piezo speed limit, m and m/s */
 well:250e-9,                           /* well depth, m (design value) */
 steel:355e6                            /* yield strength of ordinary structural steel, Pa */
};

/* derived */
const q=1/(1.05-.15*DES.nu-.16*DES.nu*DES.nu);                 /* shape factor for a clamped circular membrane */
const K=DES.E*q*q*q/(DES.aR*DES.aR);                           /* cubic stretching term, N/m^3 */
const epsF=DES.E/(2*Math.abs(DES.Dn));                         /* strain at the top of the stress curve */
const sigF=DES.E*DES.E/(4*Math.abs(DES.Dn));                   /* 2D strength: the top of the stress curve, N/m */
const cell=Math.sqrt(3)/2*DES.a*DES.a;                         /* area of one unit cell (two atoms), m^2 */
const rho2=2*DES.mC/cell;                                      /* mass per area, kg/m^2 */
const natoms=2/cell*PI*DES.aR*DES.aR;                          /* atoms in the drum */
const E3=DES.E/DES.t,S3=sigF/DES.t;                            /* the same numbers spread over the thickness, Pa */
const DRAW=.34*(DES.aR/5)/DES.b;                               /* how many times too large world.js draws the bonds (0.34 scene units, 5 units = drum radius) */

/* force on the tip at depth d: pre-tension term plus stretching term (Lee et al.) */
const force=d=>DES.s0*PI*d+K*d*d*d;
const dForce=d=>DES.s0*PI+3*K*d*d;                             /* membrane stiffness at depth d, N/m */
const sigOf=e=>DES.E*e+DES.Dn*e*e;                             /* stress at strain e, N/m */

/* breaking force for a tip of radius R: where the stress under the tip reaches the top of the curve */
const Fbreak=R=>8*PI*R*sigF*sigF/DES.E;

/* strain under the tip for a force F. Stress^2 = F * (secant stiffness) / (4 pi R), solved by bisection on [0, epsF]. */
function tipStrain(F,R){
 if(F<=0)return 0;
 if(F>=Fbreak(R))return epsF;
 let lo=0,hi=epsF;
 for(let i=0;i<40;i++){
  const m=(lo+hi)/2,s=sigOf(m),g=s*s-F*(DES.E+DES.Dn*m)/(4*PI*R);
  if(g<0)lo=m;else hi=m;
 }
 return(lo+hi)/2;
}

/* depth at which a tip of radius R reaches its breaking force */
function depthBreak(R){
 const Fb=Fbreak(R);let lo=0,hi=3e-6;
 for(let i=0;i<60;i++){const m=(lo+hi)/2;if(force(m)<Fb)lo=m;else hi=m}
 return(lo+hi)/2;
}

/* the cantilever bends too: piezo extension Z = gap + depth + force / cantilever stiffness */
const zFor=d=>DES.Zc+d+force(d)/DES.kc;
function indent(Z){
 if(Z<=DES.Zc)return{d:0,F:0};
 const target=Z-DES.Zc;let lo=0,hi=target;
 for(let i=0;i<60;i++){const m=(lo+hi)/2;if(m+force(m)/DES.kc>target)hi=m;else lo=m}
 const d=(lo+hi)/2;return{d,F:force(d)};
}

/* one state in, every reading out. pk is the recorded peak once the sheet has broken. */
function fin(Z,d,F,R,broken,pk){
 const eps=broken?0:tipStrain(F,R),sig=sigOf(eps);
 return{Z,d,F,defl:F/DES.kc,eps,sig,util:broken?0:sig/sigF,stiff:(!broken&&d>0)?dForce(d):0,R,broken:!!broken,pk:pk||null};
}
const evalDepth=(d,R)=>fin(zFor(d),d,force(d),R,false);
function evalZ(Z,R,broken,pk){
 if(broken)return fin(Z,0,0,R,true,pk);
 const i=indent(Z);return fin(Z,i.d,i.F,R,false);
}
function peak(R){
 const Fb=Fbreak(R),d=depthBreak(R);
 return{F:Fb,d,eps:epsF,sig:sigF,util:1,defl:Fb/DES.kc,Z:zFor(d)};
}

/* formatters */
const f=(x,d)=>Number(x).toFixed(d==null?0:d);
const nm=x=>f(x*1e9,1)+' nm';
const fF=F=>F>=1e-6?f(F*1e6,2)+' µN':f(F*1e9,0)+' nN';

HV.T.graphene={DES,PI,clamp,q,K,epsF,sigF,cell,rho2,natoms,E3,S3,DRAW,force,dForce,sigOf,Fbreak,tipStrain,depthBreak,zFor,indent,evalDepth,evalZ,peak,f,nm,fF};
})();
