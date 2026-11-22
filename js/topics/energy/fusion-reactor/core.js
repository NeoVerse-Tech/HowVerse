/* Fusion reactor · core: the reference tokamak (PROPOSED, ITER-class) and shared physics.
   Design figures are the published ITER design values. Everything below the "derived" line is
   computed from them, so the numbers on screen can never disagree with each other. */
(function(){
const T=(window.HV.T=window.HV.T||{}).fusion=window.HV.T.fusion||{};

const PI=Math.PI,sm=x=>x*x*(3-2*x);
const MU0=4e-7*PI,EV=1.602176634e-19,KB_EV=8.617333e-5,AMU=1.66053907e-27;   /* H/m, J per eV, eV per K, kg */

/* ---------- reference design (PROPOSED: ITER-class tokamak) ---------- */
const R=6.2,a=2.0,kappa=1.7;             /* major radius m, minor radius m, plasma elongation */
const BT=5.3,Ip=15e6,q95=3.0;            /* toroidal field T, plasma current A, edge safety factor */
const Pfus=500e6,Paux=50e6;              /* fusion power W, external heating W */
const nAvg=1.0e20,TavgKeV=8.8,tauE=3.7;  /* density m^-3, volume-average ion temperature keV, energy confinement time s */
const TopK=150e6;                        /* the quoted operating temperature, kelvin (about 12.9 keV) */
const ELM={TF:18,PF:6,CS:6,TFpeak:11.8,CSpeak:13,coilK:4.5};   /* coil counts, peak fields T, coil temperature K (Nb3Sn, liquid helium) */

/* ---------- the D-T reaction ---------- */
const E_DT=17.59,E_N=14.07,E_A=3.52;     /* MeV: total, neutron, alpha */
const mT=3.01605*AMU;                    /* one tritium atom, kg */
const E_LI6=4.78;                        /* MeV released by n + Li-6 -> T + He-4 */

/* ---------- derived ---------- */
const fN=E_N/E_DT,fA=E_A/E_DT;                                   /* energy fraction in neutron, alpha */
const Pn=Pfus*fN,Pa=Pfus*fA;                                     /* neutron power, alpha power W */
const Q=Pfus/Paux;                                               /* power gain */
const rate=Pfus/(E_DT*1e6*EV);                                   /* reactions per second */
const tBurn=rate*mT;                                             /* tritium burned, kg/s */
const dsh=Math.sqrt((1+kappa*kappa)/2);                          /* shape factor */
const Vp=2*PI*PI*R*a*a*kappa;                                    /* plasma volume m^3 */
const Sp=4*PI*PI*R*a*dsh;                                        /* plasma surface m^2 */
const wallLoad=Pn/Sp;                                            /* neutron power per wall area W/m^2 */
const Bp=MU0*Ip/(2*PI*a*dsh);                                    /* average poloidal field T */
const pPlasma=2*nAvg*TavgKeV*1e3*EV;                             /* pressure Pa (electrons + ions) */
const beta=2*MU0*pPlasma/(BT*BT);                                /* plasma pressure / magnetic pressure */
const Wth=3*nAvg*TavgKeV*1e3*EV*Vp;                              /* thermal energy stored J */
const aspect=R/a;

/* ---------- helpers ---------- */
const keVofK=k=>k*KB_EV/1e3,KofkeV=e=>e*1e3/KB_EV;
const triple=(n,tKeV,tau)=>n*tKeV*tau;                           /* keV s m^-3 */
const LAWSON=3e21;                                               /* D-T ignition threshold near 14 keV, keV s m^-3 */
const fmtP=w=>w>=1e9?(w/1e9).toFixed(2)+' GW':w>=1e6?(w/1e6).toFixed(w>=1e8?0:1)+' MW':w>=1e3?(w/1e3).toFixed(1)+' kW':Math.round(w)+' W';
const fmtE=j=>j>=1e9?(j/1e9).toFixed(1)+' GJ':j>=1e6?Math.round(j/1e6)+' MJ':j>=1e3?(j/1e3).toFixed(1)+' kJ':Math.round(j)+' J';
const fmtK=k=>k>=1e6?Math.round(k/1e6)+' million K':k>=1e3?Math.round(k/1e3)+' thousand K':Math.round(k)+' K';
const fmtT=s=>s<1?(s*1000).toFixed(0)+' ms':s<120?s.toFixed(1)+' s':s<7200?Math.round(s/60)+' min':s<172800?(s/3600).toFixed(1)+' h':(s/86400).toFixed(1)+' days';

Object.assign(T,{PI,sm,MU0,EV,R,a,kappa,BT,Ip,q95,Pfus,Paux,nAvg,TavgKeV,tauE,TopK,ELM,
 E_DT,E_N,E_A,E_LI6,mT,fN,fA,Pn,Pa,Q,rate,tBurn,Vp,Sp,wallLoad,Bp,pPlasma,beta,Wth,aspect,
 keVofK,KofkeV,triple,LAWSON,fmtP,fmtE,fmtK,fmtT});
})();
