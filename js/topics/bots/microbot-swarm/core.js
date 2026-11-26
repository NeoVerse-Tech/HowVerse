/* Microbot swarm · core: physics of the reference bot. Pure maths, no graphics.
   Reference bot (MK1): two long tapered eight-sided segments joined by a ball joint, 6.8 mm long and 2 mm across at the shoulders (3.4 : 1).
   Each segment is narrow at the neck beside the ball, widest at the shoulder, then tapers to a flat end face. A neodymium magnet sits behind each
   end face and behind four of the long flats of each segment. A thin-film battery, a radio and the ball-joint drive sit inside.
   It is a composite of published swarm and modular-robot work (Kilobots, M-TRAN, claytronics studies), not one device.
   Physics (magnet law, weight, heat) is real. Design figures (size, magnet recess, battery share, drive power) are values chosen to fit together. */
(function(){
const T=(window.HV.T=window.HV.T||{}).microbots=window.HV.T.microbots||{};
const PI=Math.PI,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

/* ---- the bot: segment, ball, segment ---- */
const G=9.81,RHOB=2200,RHOM=7500;                       /* gravity, density of everything but the magnets, density of NdFeB, kg/m³ */
/* Profile of one segment, from the ball's centre along the axis (z) and as the apothem (centre to flat) of its octagon:
   neck (z = NECKZ, apothem NECKA) widens along a short bevel to the shoulder (z = SHZ, apothem SHO), then tapers to the end face (z = LEN/2, apothem ENDA). */
const LEN=6.8e-3,SHO=1e-3,NECKA=.56e-3,ENDA=.5e-3,NECKZ=.6e-3,SHZ=1e-3,BALLR=.72e-3;
const FINE=LEN/(2*SHO),TAPER=Math.atan((SHO-ENDA)/(LEN/2-SHZ));   /* length over width, slope of the long flats, rad */
const TAN8=Math.tan(PI/8),octA=a=>8*a*a*TAN8;           /* area of a regular octagon from its apothem */
const frus=(h,a1,a2)=>h/3*(octA(a1)+Math.sqrt(octA(a1)*octA(a2))+octA(a2));   /* octagonal frustum volume */
const SEGV=frus(SHZ-NECKZ,NECKA,SHO)+frus(LEN/2-SHZ,SHO,ENDA);                 /* one segment, m³ */
const BALLV=PI*(BALLR*BALLR*2*NECKZ-2*NECKZ*NECKZ*NECKZ/3);                    /* the part of the ball between the necks, m³ */
const VBOT=2*SEGV+BALLV;                                /* solid volume of one bot m³ (about 12.4 mm³) */
/* the joint folds until the shoulder corners of the two segments touch. BENDUSE is the working limit the drive is designed to reach */
const BEND=2*Math.atan(SHZ/(SHO/Math.cos(PI/8))),BENDUSE=PI/3,SWING=BEND/2;

/* ---- magnets: cylinders recessed behind the faces. c is the centre-to-centre distance of a pair when the two faces touch ---- */
const MU0=4*PI*1e-7,BR=1.3;                             /* vacuum permeability, NdFeB remanence T */
const MEND={n:2,d:.8e-3,t:.6e-3,c:1.6e-3};              /* one behind each end face */
const MSIDE={n:8,d:.4e-3,t:.3e-3,c:.8e-3,z:2e-3};       /* four behind the long flats of each segment, z from the ball's centre */
const mvol=m=>PI*m.d*m.d/4*m.t,dip=m=>BR*mvol(m)/MU0;
const MAGV=MEND.n*mvol(MEND)+MSIDE.n*mvol(MSIDE);
const MMAG=MAGV*RHOM,M=MMAG+(VBOT-MAGV)*RHOB,W=M*G;     /* magnet mass kg, bot mass kg (about 32 mg), weight N */
const MUF=.3;                                           /* friction between bot faces */

/* ---- energy, power, heat ---- */
const BATV=.3,EDENS=3.6e8;                              /* battery share of the volume, thin-film energy density J/m³ (100 Wh/L) */
const EB=BATV*VBOT*EDENS;                               /* battery energy J: 30% of the bot's own volume */
const USE=.8;                                           /* usable share: the rest is a reserve */
const PIDLE=50e-6,PMOVE=6e-3,VMOVE=10e-3;              /* idle power W (radio + clock), drive power W (ball-joint inchworm gait), walking speed m/s: design values */
const HC=10;                                            /* natural convection W/m²K */

/* ---- magnet law ---- */
const bondForce=(m,d)=>3*MU0*dip(m)*dip(m)/(2*PI*Math.pow(d,4));   /* two aligned point dipoles, centre distance d m. A fair estimate from about two magnet widths */
const FEND=bondForce(MEND,MEND.c),FSIDE=bondForce(MSIDE,MSIDE.c);  /* one end-to-end bond and one flank-to-flank bond in contact, N */

/* ---- one bot and one strand: the structural numbers ---- */
const hangBots=FEND/W,sideHang=FSIDE/W;                 /* bots one bond can hold hanging below it */
const slideHold=MUF*FEND/W;                             /* bots friction can hold from sliding across an upright end bond */
const MENDM=FEND*ENDA;                                  /* N·m an end bond resists before it peels open about the edge of the face */
const strandCant=Math.sqrt(2*MENDM/(W*LEN));            /* longest level, unsupported strand, in bots */
const curveR=LEN/BENDUSE;                               /* tightest curve of a strand, one joint bend per bot, m */

/* ---- packing and timing ---- */
const SIDEPITCH=1.667e-3;                               /* closest axis spacing of two parallel strands with one slid 1.6 mm along, from the profile above */
const VCELL=SIDEPITCH*SIDEPITCH*LEN,A=Math.cbrt(VCELL),PACK=VBOT/VCELL;   /* room one bot takes in a bundle m³, the cube of that volume, share filled */
const TLEN=LEN/VMOVE,TMSG=.1,TSET=.5;                   /* s per bot length, s per radio hop, s to swivel, align and snap into place */
const EBOND=FEND*MEND.c/3;                              /* work to pull one end bond apart to infinity, J (the 1/d⁴ law integrates to F·d/3) */

/* ---- how far one battery goes ---- */
const range=USE*EB/PMOVE*VMOVE;                         /* metres of walking */
const idleHours=EB/PIDLE/3600;

/* ---- scaling up: N bots packed into a solid cube ---- */
function scale(N){
 const n=Math.cbrt(N),edge=n*A,area=6*edge*edge;
 return{N,n,edge,mass:N*M,volume:N*A*A*A*1e3,
  dTidle:N*PIDLE/(HC*area),dTmove:N*PMOVE/(HC*area),     /* surface-limited rise: heat out through the skin only */
  idleW:N*PIDLE,moveW:N*PMOVE}}

/* ---- helpers ---- */
const fmtT=s=>s<120?Math.round(s)+' s':s<7200?Math.round(s/60)+' min':(s/3600).toFixed(1)+' h';
const fmtE=j=>j<1?(j*1e3).toFixed(j<.01?1:0)+' mJ':j.toFixed(2)+' J';
const fmtN=n=>n>=1e9?(n/1e9)+'bn':n>=1e6?(n/1e6)+'M':n>=1e3?(n/1e3)+'k':''+n;

Object.assign(T,{PI,clamp,G,RHOB,RHOM,LEN,SHO,NECKA,ENDA,NECKZ,SHZ,BALLR,FINE,TAPER,SEGV,BALLV,VBOT,BEND,BENDUSE,SWING,MU0,BR,MEND,MSIDE,MAGV,MMAG,M,W,MUF,
 BATV,EDENS,EB,USE,PIDLE,PMOVE,VMOVE,HC,bondForce,FEND,FSIDE,hangBots,sideHang,slideHold,MENDM,strandCant,curveR,SIDEPITCH,VCELL,A,PACK,TLEN,TMSG,TSET,
 EBOND,range,idleHours,scale,fmtT,fmtE,fmtN});
})();
