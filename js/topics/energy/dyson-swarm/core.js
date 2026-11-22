/* Dyson swarm · shared constants and helpers. Loaded first. */
(function(){
const HV=window.HV=window.HV||{};
const T=(HV.T=HV.T||{}).dyson=HV.T.dyson||{};
const PI=Math.PI;

/* The Sun: real values (measured) */
const SUN={Teff:5772,        /* K, effective surface temperature */
 L:3.828e26,                 /* W, luminosity */
 R:6.957e8,                  /* m, radius */
 M:1.989e30,                 /* kg, mass */
 rotEq:25.4};                /* days, equatorial rotation */
const AU=1.495978707e11;     /* m */
const G=6.674e-11,C=2.998e8; /* gravity constant, speed of light */

/* number helpers */
const f=(x,d)=>Number(x).toFixed(d==null?1:d);
const sci=(x,d)=>{const e=Math.floor(Math.log10(Math.abs(x)));return (x/Math.pow(10,e)).toFixed(d==null?2:d)+'×10^'+e};
const comma=n=>String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,',');

/* sunlight intensity (W/m²) at a distance from the Sun, in AU. At 1 AU this is about 1,361. */
const flux=au=>SUN.L/(4*PI*Math.pow(au*AU,2));

/* circular orbit at a distance in AU: speed (m/s) and period (days) */
const orbit=au=>{const r=au*AU,v=Math.sqrt(G*SUN.M/r);return{v,days:2*PI*r/v/86400}};

/* light pressure on a perfect mirror facing the Sun at a distance in AU (Pa) */
const press=au=>2*flux(au)/C;

/* critical sail loading: a perfect mirror with this mass per area feels light pressure equal to the Sun's pull (kg/m²) */
const sigmaCrit=2*SUN.L/(4*PI*G*SUN.M*C);

/* The swarm's distance from the Sun, real and on screen.
   REAL_AU is the design distance. SW is the same distance in Sun radii on screen: the real value is about 64.5,
   which would put the swarm far outside the view, so it is compressed. Change SW to move the swarm in or out. */
const REAL_AU=.3,SW=3.2;

/* The hub ship sits near the Sun-Earth L1 point, about 0.99 AU from the Sun, on the line to Earth.
   GATE_K: the gateway's distance from the Sun on screen, as a multiple of the swarm's radius.
   HUB_D: how far past the gateway the hub sits on screen, in scene units. Both are compressed for the view. */
const HUB_AU=.99,GATE_K=1.8,HUB_D=70;

/* The trunk beam. These are illustrative design values, not a finished design.
   A beam of near-infrared light, sent through a mirror one kilometre across, spreads as a Gaussian beam. */
const LAMBDA=1e-6,APERTURE=1000;
const trunkL=(HUB_AU-REAL_AU)*AU;                         /* gateway to hub, metres */
const w0=APERTURE/2,zR=PI*w0*w0/LAMBDA;                    /* waist radius, and the Rayleigh range (distance over which it stays narrow) */
const spot=w0*Math.sqrt(1+Math.pow(trunkL/zR,2));          /* beam radius at the hub, metres */
const aimMas=spot/trunkL*206265e3;                         /* aiming tolerance: spot radius divided by distance, in milli-arcseconds */
const beam={lambda:LAMBDA,D:APERTURE,L:trunkL,zR,spot,aimMas};

/* The hub ship is drawn at HUBU metres per scene unit, chosen so a 3 km receiver is 18 units wide.
   Heat: the hub is assumed to handle humanity's power (19 TW) and lose 10% in conversion. In a vacuum heat leaves only as radiation,
   at sigma times T^4 from each face of a panel. */
const HUBU=3000/18;
const SIG=5.670374e-8,HEAT_W=.1*1.9e13;
const radArea=Tk=>HEAT_W/(2*SIG*Math.pow(Tk,4));          /* panel area in m², both faces radiating, at temperature Tk */
const L1M=(1-HUB_AU)*AU;                                    /* hub to Earth, metres */
const heat={W:HEAT_W,area1000:radArea(1000),area400:radArea(400),perM2:2*SIG*Math.pow(1000,4)};

/* scene units: the Sun's radius on screen. Change this one number to resize the Sun everywhere. */
const SR=8;

Object.assign(T,{PI,SUN,AU,G,C,SR,SW,REAL_AU,HUB_AU,GATE_K,HUB_D,HUBU,L1M,heat,beam,f,sci,comma,flux,orbit,press,sigmaCrit});
})();
