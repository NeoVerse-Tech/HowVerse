/* Metamaterials · single-file build of the whole topic (core, learn, parts, mission, fly, world, register). The loader falls back to this file when the metamaterials/ folder cannot be served. */
window.HV=window.HV||{};

/* ---- core.js ---- */
/* Metamaterials · core. Design numbers, formulas and helpers shared by every file. Loaded first.
   Reference experiment (BUILT-class): a wedge of copper split rings and wires on circuit board, in the style of Shelby, Smith and
   Schultz, Science 2001, tested with microwaves around 10 GHz. Design values are chosen to fit together, they are not a copy of that device.
   Simplifications, stated honestly in the Learn tab: an effective-medium model (one permittivity and one permeability for the
   whole slab), a Drude curve for the wires and a Lorentz curve for the rings, loss as a single damping term for each,
   the beam at normal incidence on the first face, and the same Fresnel mismatch used at both faces. */
(function(){
const HV=window.HV=window.HV||{};
HV.T=HV.T||{};

const PI=Math.PI,C=299792458,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

/* design numbers. Frequencies in GHz, lengths in mm. */
const DES={
 fp:15,gam:.05,                      /* wire plasma frequency and its damping, GHz */
 f0:10,F:.25,Gam:.12,                /* ring resonance, filling fraction of the rings, ring damping, GHz */
 a:4,                               /* unit cell, mm */
 W:32,H:60,                         /* wedge thickness along the beam at its centre, and height, mm */
 alpha:18.4,                        /* wedge angle: the exit face tilts this far from the first face, degrees */
 nT:1.44,                           /* Teflon control, the ordinary prism */
 fmin:8,fmax:16                     /* synthesiser range, GHz */
};
const AL=DES.alpha*PI/180,SA=Math.sin(AL);

/* complex helpers: z = [re, im]; the e^(-iwt) convention, so passive media have a positive imaginary part */
const cadd=(x,y)=>[x[0]+y[0],x[1]+y[1]],cmul=(x,y)=>[x[0]*y[0]-x[1]*y[1],x[0]*y[1]+x[1]*y[0]];
const cdiv=(x,y)=>{const d=y[0]*y[0]+y[1]*y[1];return[(x[0]*y[0]+x[1]*y[1])/d,(x[1]*y[0]-x[0]*y[1])/d]};
const cabs=x=>Math.hypot(x[0],x[1]);
function csqrt(x){const r=cabs(x),re=Math.sqrt(Math.max(0,(r+x[0])/2)),im=Math.sqrt(Math.max(0,(r-x[0])/2));return[re,x[1]<0?-im:im]}   /* principal root, real part >= 0 */

/* wires: Drude curve. Negative below the plasma frequency. */
const epsW=f=>{const d=cmul([f,0],[f,DES.gam]);return cadd([1,0],cdiv([-DES.fp*DES.fp,0],d))};
/* rings: Lorentz curve. Negative just above the ring resonance, back to zero at f0/sqrt(1-F). */
const muR=f=>cadd([1,0],cdiv([-DES.F*f*f,0],[f*f-DES.f0*DES.f0,DES.Gam*f]));

/* One state in, every reading out. ctrl=true swaps the metamaterial for an ordinary Teflon wedge. */
function evalF(f,ctrl){
 f=clamp(f,DES.fmin,DES.fmax);
 let eps,mu;
 if(ctrl){eps=[DES.nT*DES.nT,.0006];mu=[1,0]}else{eps=epsW(f);mu=muR(f)}
 /* the root with a positive imaginary part for each, then the product: this gives the negative index when both are negative */
 const ne=csqrt(eps),nm=csqrt(mu),n=cmul(ne,nm),Z=cdiv(nm,ne);
 const rr=cdiv([Z[0]-1,Z[1]],[Z[0]+1,Z[1]]),R=Math.pow(cabs(rr),2);
 const k0=2*PI*f*1e9/C,att=Math.exp(-2*k0*Math.max(0,n[1])*DES.W*1e-3);   /* intensity left after the wedge's centre line */
 const T=clamp((1-R)*(1-R)*att,0,1);
 const x=n[0]*SA,tir=Math.abs(x)>=1;
 const delta=tir?NaN:(AL-Math.asin(x))*180/PI;                            /* beam angle after the exit face, degrees, positive = toward the thin end */
 const lam=C/(f*1e9)*1e3;                                                /* free-space wavelength, mm */
 /* keys are fr and nc, not f and n: the topic page already uses f and n for the phase text and name */
 return{fr:f,ctrl:!!ctrl,eps,mu,nc:n,nre:n[0],nim:n[1],Z,R,T,delta,tir,lam,blk:n[1]>2*Math.abs(n[0]),neg:!ctrl&&eps[0]<0&&mu[0]<0&&n[0]<0};
}

/* sweep for the landmarks */
const scan=(g,n=1600)=>{let best=null;for(let i=0;i<=n;i++){const f=DES.fmin+(DES.fmax-DES.fmin)*i/n,s=evalF(f,false),v=g(s);if(best==null||v>best.v)best={v,f}}return best};
const fmp=DES.f0/Math.sqrt(1-DES.F);                                       /* upper edge of the negative-permeability band */
const bestF=scan(s=>s.nre<0&&!s.blk?-s.nre*s.T:-1).f;                              /* best compromise: most negative index that still gets power through */
const matchF=(()=>{let b=null;for(let i=0;i<=3200;i++){const f=DES.f0+(fmp-DES.f0)*i/3200,s=evalF(f,false);if(s.nre<0){const d=Math.abs(s.nre+1);if(!b||d<b.d)b={d,f}}}return b.f})();   /* where the index passes through -1 */
function band(){                                                           /* range where the index is negative and at least 1% of the power gets through */
 let lo=null,hi=null;for(let i=0;i<=3200;i++){const f=DES.fmin+(DES.fmax-DES.fmin)*i/3200,s=evalF(f,false);if(s.nre<0&&!s.blk&&s.T>.01){if(lo==null)lo=f;hi=f}}
 return{lo,hi};
}

/* formatters */
const f1=(x,d)=>Number(x).toFixed(d==null?0:d);
const sg=(x,d)=>(x>=0?'+':'−')+Math.abs(x).toFixed(d==null?2:d);
const pct=x=>x>=.1?f1(x*100):x>=.001?f1(x*100,1):x>0?'<0.1':'0';

HV.T.meta={DES,PI,C,clamp,AL,SA,epsW,muR,evalF,scan,fmp,bestF,matchF,band,f:f1,sg,pct};
})();

/* ---- learn.js ---- */
/* Metamaterials · Learn. 13 sections, each labelled BUILT (exists today), PROPOSED (designed with known technology)
   or THEORETICAL (depends on something unproven). Every number from the reference experiment is computed from core.js so the
   page can never disagree with the model. Lab and history figures are published values, rounded. */
(function(){
const T=window.HV.T.meta,D=T.DES,f=T.f,sg=T.sg,pct=T.pct;

const bd=T.band(),M=T.evalF(T.matchF,false),B=T.evalF(T.bestF,false),Tf=T.evalF(M.fr,true);
const a105=T.evalF(10.5,false),a11=T.evalF(11,false),a9=T.evalF(9,false),a13=T.evalF(13,false),a16=T.evalF(16,false);
const lamM=M.lam,cellFrac=lamM/D.a;
const dMeta=M.delta,dTef=Tf.delta;

T.LEARN=[
 {h:'What a metamaterial is',l:'BUILT',p:[
  'A metamaterial is a material whose behaviour comes from its structure, not from what it is made of. Build tiny shapes, much smaller than the wavelength you care about, and arrange them in a repeating pattern. Waves passing through see a smooth medium with new properties that no natural substance has.',
  'The one in this topic is made of nothing exotic: copper strips and copper rings on ordinary circuit board. What matters is the shape. Each cell is '+D.a+' mm wide, and the microwaves it works on are about '+f(lamM)+' mm long, so a wave sees roughly '+f(cellFrac)+' cells per wavelength and treats the whole thing as one material.']},

 {h:'What a refractive index is',l:'BUILT',p:[
  'The refractive index n tells you how much a material slows light: the wave travels at c divided by n. Glass has n of about 1.5, water about 1.33, air about 1. When light enters a slanted surface the slowing turns the beam, following Snell\'s law: n₁ sin θ₁ = n₂ sin θ₂.',
  'Nothing in everyday life has n below 1 for visible light by much, and nothing natural has n below zero. Metamaterials do.']},

 {h:'Veselago\'s idea',l:'BUILT',p:[
  'In 1968 the Soviet physicist Viktor Veselago asked what would happen if a material had both a negative permittivity ε and a negative permeability μ. Maxwell\'s equations allow it. The index becomes the negative square root of ε times μ, so n is negative.',
  'He predicted that light would refract to the same side of the normal as it came from, and that a flat slab of n = −1 would focus light. No such material was known, so the idea sat for more than thirty years.']},

 {h:'Two things to make negative',l:'BUILT',p:[
  'ε says how a material\'s charges respond to the electric field of a wave. μ says how it responds to the magnetic field. Natural materials have a negative ε in some bands, which is why metals are shiny. Almost none have a negative μ.',
  'So the recipe is two separate structures, one for each. Wires for ε, rings for μ. Put them together and, in a narrow band, both go negative at once.']},

 {h:'Wires make ε negative',l:'BUILT',p:[
  'A grid of thin metal wires acts like a dilute metal, a gas of electrons with a plasma frequency far below that of a real metal. Pendry and colleagues showed in 1996 that thin wires push the plasma frequency down into the microwave range. Below it, ε is negative.',
  'Here the wire plasma frequency is '+D.fp+' GHz. At 10.5 GHz the model gives ε = '+sg(a105.eps[0])+', and ε stays negative all the way from the bottom of the test range up to '+D.fp+' GHz. Above that, the wires stop blocking and ε turns positive.']},

 {h:'Split rings make μ negative',l:'BUILT',p:[
  'A metal ring with a gap in it is a tiny circuit: the ring is an inductor and the gap is a capacitor, so it resonates at one frequency. A wave\'s changing magnetic field drives a current round the ring, and the ring\'s own field pushes back. Just above the resonance, the push is stronger than the drive, and the effective μ goes negative. Pendry\'s group proposed this in 1999.',
  'Here the rings resonate at '+D.f0+' GHz. The permeability is negative from there up to '+f(T.fmp,2)+' GHz, where it crosses zero. At 10.5 GHz the model gives μ = '+sg(a105.mu[0])+'. Below the resonance μ is positive again and the band is closed.']},

 {h:'The negative band',l:'BUILT',p:[
  'With wires and rings in one structure, both ε and μ are negative where their bands overlap. Here the wires work below '+D.fp+' GHz and the rings from '+D.f0+' to '+f(T.fmp,2)+' GHz, so the overlap is the ring band. In the model, power gets through (at least 1%) from about '+f(bd.lo,2)+' to '+f(bd.hi,2)+' GHz.',
  'The index is far from constant inside it. At 10.5 GHz it is n = '+sg(a105.nre)+'. At 11 GHz it is '+sg(a11.nre)+'. At '+f(M.fr,2)+' GHz it passes through '+sg(M.nre)+', with ε = '+sg(M.eps[0])+' and μ = '+sg(M.mu[0])+', so both are nearly equal and the slab is matched to air with almost no reflection. That is the best operating point.']},

 {h:'Phase goes backward',l:'BUILT',p:[
  'In a negative-index medium the crests of the wave travel toward the source while the energy travels away from it. These two directions are the phase velocity and the group velocity, and normally they agree. Here they are opposite.',
  'The Fly and World views show this: the thin bars are the wave crests, and inside the metamaterial they move backward while the beam still moves forward. The crest spacing inside is the wavelength divided by the size of n, so at n = −1 it is the same as in air.']},

 {h:'The prism experiment',l:'BUILT',p:[
  'In 2001 David Smith, Richard Shelby and Sheldon Schultz at UC San Diego built a wedge of such cells and sent microwaves at it. The beam enters the flat face head on, so it does not bend there. It meets the slanted exit face at the wedge angle, '+D.alpha+'°, and bends there.',
  'The bend follows Snell\'s law. The beam leaves at an angle of α − arcsin(n sin α) from straight on, with positive meaning toward the thin end. A Teflon wedge (n = '+D.nT+') bends the beam to '+sg(dTef,1)+'°, toward the thick end, as any glass prism would. The metamaterial at n = '+sg(M.nre)+' bends it to '+sg(dMeta,1)+'°, to the other side. A beam on the wrong side of the normal was the proof.']},

 {h:'Loss and bandwidth',l:'BUILT',p:[
  'Every resonance has loss, and the rings are at their lossiest right at resonance. Just above '+D.f0+' GHz the index is a large negative number but the wave is soaked up before it gets through the '+D.W+' mm wedge. Transmission is about '+pct(T.evalF(10.3,false).T)+'% at 10.3 GHz, '+pct(a105.T)+'% at 10.5 GHz and '+pct(B.T)+'% at '+f(B.fr,2)+' GHz.',
  'Away from the band nothing gets through at all. Below '+D.f0+' GHz μ is positive while ε is negative, so n is imaginary and the wave dies off within a fraction of a wavelength. At 9 GHz the model passes '+pct(a9.T)+'% and at 13 GHz '+pct(a13.T)+'%. Only at '+D.fp+' GHz and up, where ε turns positive, does power flow again, with n = '+sg(a16.nre)+' at 16 GHz. The negative band is narrow and lossy, and this is the main limit on every real metamaterial.']},

 {h:'The perfect lens',l:'PROPOSED',p:[
  'In 2000 John Pendry showed that a flat slab with n = −1 would refocus light from a point, and that, unlike a glass lens, it could in principle also recover the fine detail carried by the evanescent waves that die out within a wavelength of the object. In theory the resolution would have no diffraction limit.',
  'Experiments have shown part of this. In 2005 a thin silver layer resolved features about 60 nm across using ultraviolet light, a near-field effect. A practical perfect lens would need matched, low-loss, negative-index material at optical wavelengths, and nothing like that exists. The slightest loss destroys the detail the lens was supposed to recover.']},

 {h:'Invisibility, and its limits',l:'THEORETICAL',p:[
  'In 2006 a Duke group led by Smith and Schurig built a microwave cloak: rings of metamaterial that steer waves around a small copper cylinder, at about 8.5 GHz. It worked in two dimensions, for one frequency, and left a visible shadow. That is a real result and a small one.',
  'A cloak for visible light, in three dimensions, working across all colours and all angles, would need structures smaller than a few tens of nanometres and almost no loss. Nothing like that has been demonstrated. The honest status is that the principle works and the practical object does not exist.']},

 {h:'What this model leaves out',l:'THEORETICAL',p:[
  'The model replaces the whole slab with a single permittivity and permeability, a Drude curve for the wires and a Lorentz curve for the rings, with one damping term each. The beam hits the first face head on, and the same impedance mismatch is applied at both faces. Real metamaterials are not perfectly uniform, and a wave is not a ray.',
  'It leaves out coupling between the rings and wires, the finite size of the cells (which makes the index depend on direction), a beam that spreads, the bianisotropy of the real rings, and any fabrication error. The numbers show how the idea behaves, not what any one device would measure. In the 3D view the wave crests are drawn at about a third of their true spacing so they fit on screen.']}
];
})();

/* ---- parts.js ---- */
/* Metamaterials · parts. Eight parts; the ids are what world.js uses to find each piece, so keep them stable.
   Numbers come from core.js. Labels: BUILT (exists today), PROPOSED (known technology, designed here), THEORETICAL (unproven).
   Everything in this experiment is BUILT: the apparatus exists in labs today. */
(function(){
const T=window.HV.T.meta,D=T.DES,f=T.f,sg=T.sg,pct=T.pct;
const M=T.evalF(T.matchF,false),Tf=T.evalF(M.fr,true),a105=T.evalF(10.5,false),bd=T.band();

T.PARTS=[
 {id:'wires',n:'Copper wires',l:'BUILT',
  d:'Thin copper strips running up each cell. Together they behave like a dilute metal with a plasma frequency of '+D.fp+' GHz, far below that of real metal, so they make the permittivity negative at every frequency below it. This idea comes from Pendry\'s 1996 work on wire grids.',
  k:[['Plasma frequency',D.fp+' GHz'],['ε at 10.5 GHz',sg(a105.eps[0])],['ε is negative','below '+D.fp+' GHz']]},

 {id:'rings',n:'Split rings',l:'BUILT',
  d:'A copper ring with a gap is an inductor and capacitor in one, so it resonates. A wave\'s magnetic field drives a current round it, and just above the resonance the ring\'s own field outweighs the wave\'s and the permeability turns negative. Each cell holds one ring. They are drawn larger than the cell\'s real share, so you can see them.',
  k:[['Resonance',D.f0+' GHz'],['μ is negative',D.f0+' to '+f(T.fmp,2)+' GHz'],['μ at 10.5 GHz',sg(a105.mu[0])]]},

 {id:'board',n:'Circuit board',l:'BUILT',
  d:'The copper sits on thin sheets of fibreglass circuit board. Printing the pattern is ordinary board manufacturing, which is why microwave metamaterials are cheap to make. The board itself barely matters to the waves, so it is drawn as a faint tinted plate.',
  k:[['Cell size',D.a+' mm'],['Wavelength at '+f(M.fr,1)+' GHz',f(M.lam)+' mm'],['Cells per wavelength','about '+f(M.lam/D.a)]]},

 {id:'prism',n:'Wedge of cells',l:'BUILT',
  d:'The cells are stacked into a wedge. The beam goes in square to the flat face, so it does not bend there. The exit face is tilted '+D.alpha+'° and the beam bends as it leaves. The stepped edge is real: the exit face is made of whole cells.',
  k:[['Wedge angle',D.alpha+'°'],['Thickness at the beam',D.W+' mm'],['Height',D.H+' mm'],['Bend at n = '+sg(M.nre),sg(M.delta,1)+'°']]},

 {id:'control',n:'Teflon control',l:'BUILT',
  d:'An ordinary wedge of Teflon of the same shape, as the control experiment. It has n = '+D.nT+', so it bends the beam the way any prism does, toward the thick end. Switch to it in Fly and the cells disappear and the wedge turns solid.',
  k:[['Index',D.nT],['Bend',sg(Tf.delta,1)+'°'],['Power through',pct(Tf.T)+'%']]},

 {id:'source',n:'Microwave source',l:'BUILT',
  d:'A horn antenna on the left sends a narrow beam of microwaves at the wedge. The test frequency can be swept from '+D.fmin+' to '+D.fmax+' GHz. The beam is drawn about 2 cells wide.',
  k:[['Range',D.fmin+' to '+D.fmax+' GHz'],['Wavelength',f(T.C/16e6,1)+' to '+f(T.C/8e6,1)+' mm'],['Beam','narrow, head-on']]},

 {id:'detector',n:'Detector',l:'BUILT',
  d:'A second horn on the right picks up the microwaves leaving the wedge and measures the angle and power. In the real experiment it was swung on an arc around the wedge. Here the detector rides on the beam, so it always sees the exit angle, and glows with the power it receives.',
  k:[['Measures','angle and power'],['Negative-index power',pct(M.T)+'% at '+f(M.fr,1)+' GHz'],['Best power in band',pct(T.evalF(T.bestF,false).T)+'%']]},

 {id:'fronts',n:'Wave crests',l:'BUILT',
  d:'The thin bars are the wave crests, drawn about a third of their true spacing so several fit on screen. In air and in Teflon they move forward with the beam. Inside a negative-index medium they move backward while the energy still travels forward, and they sit closer together by the factor |n|.',
  k:[['Crest spacing','wavelength ÷ |n|'],['Phase speed','backward when n < 0'],['Negative band',f(bd.lo,2)+' to '+f(bd.hi,2)+' GHz']]}
];
})();

/* ---- mission.js ---- */
/* Metamaterials · Launch mission, and the shared sweep model that Fly uses (so this file loads before fly.js).
   One experiment in nine phases: the Teflon control, the swap to the metamaterial, then a frequency sweep through every region
   of the response. at(u) turns playback position u (0 to 1) into a full state; core.js evalF() is the one place a frequency
   becomes an index, a bend and a power, so Launch and Fly can never disagree. */
(function(){
const T=window.HV.T.meta,D=T.DES,clamp=T.clamp,f=T.f,sg=T.sg,pct=T.pct;
const sm=x=>{x=clamp(x,0,1);return x*x*(3-2*x)};
const FM=T.matchF,M=T.evalF(FM,false),Tf=T.evalF(FM,true);

/* frequency at the start and end of each phase (GHz), and whether the Teflon control is fitted */
const SEG=[[FM,FM,1],[FM,FM,0],[FM,8.5,0],[8.5,10.3,0],[10.3,11,0],[11,11.7,0],[11.7,14.8,0],[14.8,16,0],[FM,FM,0]];
const DUR=[9,8,9,9,10,8,9,8,10];
const NAMES=['The control: Teflon','Swap in the metamaterial','Sweep down','The rings resonate','The negative band','The band closes','Blocked','Back to normal','The matched point'];
const tp=[0];DUR.forEach(d=>tp.push(tp[tp.length-1]+d));
const TOT=tp[9];

const TXT=[
 'First the control. A wedge of Teflon, n = '+D.nT+', with microwaves at '+f(FM,2)+' GHz. The beam goes into the flat face head on, bends at the slanted face and leaves at '+sg(Tf.delta,1)+'°, toward the thick end, as it would in any glass prism.',
 'Now the metamaterial wedge: copper wires and split rings on circuit board, the same shape. Same frequency, same beam. It leaves at '+sg(M.delta,1)+'°, on the other side of straight on. The index here is '+sg(M.nre)+'.',
 'Now sweep the frequency down. The power drops away as you pass the ring resonance at '+D.f0+' GHz. Below it the permeability is positive while the permittivity is still negative, so the index is imaginary. The wave dies within a fraction of a wavelength and nothing comes out.',
 'Back up through '+D.f0+' GHz the rings resonate hard. The index is a huge negative number here, but resonance means loss, and the wave is soaked up before it gets through '+D.W+' mm of cells.',
 'In the middle of the band both ε and μ are negative. The loss falls as the index climbs from very negative toward −1, and more of the beam gets through. Watch the bend come in from far past the wedge angle toward '+f(2*D.alpha,1)+'°, twice the wedge angle, at n = −1.',
 'Near '+f(T.fmp,2)+' GHz the permeability climbs back to zero. The index shrinks toward zero, the beam straightens, and the match to air is lost, so the reflection grows.',
 'Above the band μ is positive again, while the wires still hold ε negative. Imaginary index again, so the wave is blocked, all the way up to the wire plasma frequency at '+D.fp+' GHz.',
 'Past '+D.fp+' GHz the wires stop blocking. ε turns positive, μ is still below one, so the index is a small positive number and the beam bends only a little. Ordinary wave behaviour, at last.',
 'Back at '+f(FM,2)+' GHz, where n passes through −1. ε and μ are both close to −1, so the slab is matched to air and almost nothing reflects, and '+pct(M.T)+'% of the power gets through. The beam leaves at '+sg(M.delta,1)+'°, which is twice the wedge angle. This is the condition for Pendry\'s perfect lens.'
];

const P=NAMES.map((n,i)=>({n,w:DUR[i]/TOT,f:TXT[i],t0:tp[i],t1:tp[i+1]}));

function at(u){
 u=clamp(u,0,1);const t=u*TOT;let i=0;while(i<P.length-1&&t>=P[i+1].t0)i++;
 const p=sm((t-P[i].t0)/(P[i].t1-P[i].t0)),sgm=SEG[i],fr=sgm[0]+(sgm[1]-sgm[0])*p;
 return Object.assign({i,n:P[i].n,f:P[i].f,th:0,t,u},T.evalF(fr,!!sgm[2]));
}

/* the eight readouts */
function read(s){
 const dead=s.blk||s.T<.0005;
 return[
  ['Medium',s.ctrl?'Teflon':'Metamaterial'],
  ['Frequency',f(s.fr,2)+' GHz'],
  ['Wavelength',f(s.lam,1)+' mm'],
  ['ε, μ',s.ctrl?sg(s.eps[0],1)+', +1.0':sg(s.eps[0],1)+', '+sg(s.mu[0],1)],
  ['Index n',s.blk?'imaginary':sg(s.nre)],
  ['Beam bend',dead||s.tir?'none':sg(s.delta,1)+'°'],
  ['Power through',pct(s.T)+' %'],
  ['Crest motion',s.blk?'none':s.nre<0?'backward':'forward']
 ];
}

Object.assign(T,{P,TOT,tp,at,read});
})();

/* ---- fly.js ---- */
/* Metamaterials · Fly. You run the microwave bench. Needs mission.js loaded first (it supplies read(), built on core.js evalF()).
   The slider sets the synthesiser frequency, and the synthesiser follows at 1 GHz per second (the warp button changes the sweep speed).
   Medium swaps the metamaterial wedge for the Teflon control (only with the synthesiser parked, as in the lab: here, any time).
   Record logs a measurement. The goal: record a point where the index is −1, within 0.15, with at least 8% of the power through.
   Simplified: an effective medium, the detector rides on the beam, one fixed wedge. */
(function(){
const T=window.HV.T.meta,D=T.DES,clamp=T.clamp,f=T.f,sg=T.sg,pct=T.pct;
const SPAN=D.fmax-D.fmin,RATE=1,TOL=.15,TMIN=.08,GOAL=T.matchF;
const thGoal=(GOAL-D.fmin)/SPAN;

T.createFly=function(){
 const st={mode:'fly',auto:false,th:0,lamp:false};              /* lamp = the Teflon control is fitted */
 let fr,E,recs,msg,msgT,win,tsim;

 const refresh=()=>{E=T.evalF(fr,st.lamp)};
 function reset(){
  fr=D.fmin+.1*SPAN;recs=0;msg='';msgT=0;win=null;tsim=0;
  st.mode='fly';st.auto=false;st.th=.1;st.lamp=false;refresh();
 }
 const tgtF=()=>D.fmin+st.th*SPAN;

 function record(){
  if(st.mode!=='fly')return;
  recs++;msgT=10;
  if(st.lamp)msg='Control recorded: n = '+D.nT+', bend '+sg(E.delta,1)+'°, '+pct(E.T)+'% through. Now swap in the metamaterial.';
  else if(E.blk||E.T<.0005)msg='Nothing got through at '+f(E.fr,2)+' GHz. The index is imaginary here, so the wave dies in the wedge. Try the negative band, just above '+D.f0+' GHz.';
  else if(E.nre>=0)msg='Recorded n = '+sg(E.nre)+' at '+f(E.fr,2)+' GHz: a positive index, so the beam bends the ordinary way, '+sg(E.delta,1)+'°.';
  else if(Math.abs(E.nre+1)<=TOL&&E.T>=TMIN){
   win={fr:E.fr,n:E.nre,delta:E.delta,T:E.T,eps:E.eps[0],mu:E.mu[0]};st.mode='won';st.auto=false;
  }else if(Math.abs(E.nre+1)<=TOL)msg='n = '+sg(E.nre)+' is right, but only '+pct(E.T)+'% of the power gets through. At least '+f(TMIN*100)+'% is needed.';
  else msg='Recorded n = '+sg(E.nre)+', bend '+sg(E.delta,1)+'°, '+pct(E.T)+'% through. The goal is n = −1, within '+TOL+'. '+(E.nre<-1?'Go up in frequency: the index rises toward zero.':'Go down in frequency: the index gets more negative.');
 }

 /* Auto: the reference plan. Metamaterial in, sweep to the matched frequency, record. */
 function autoStep(dt){
  if(st.lamp){st.lamp=false;refresh();return}
  const d=thGoal-st.th,mv=RATE/SPAN*dt;
  if(Math.abs(d)>mv)st.th+=Math.sign(d)*mv;else st.th=thGoal;
  if(Math.abs(fr-GOAL)<.01&&st.th===thGoal)record();
 }

 function step(dt){
  if(st.mode!=='fly')return;
  tsim+=dt;if(msgT>0)msgT-=dt;
  if(st.auto)autoStep(dt);
  const d=tgtF()-fr,mv=RATE*dt;
  fr=Math.abs(d)<=mv?tgtF():fr+Math.sign(d)*mv;
  refresh();
 }

 function status(){
  if(st.mode==='won')return{n:'n = −1 recorded',f:'At '+f(win.fr,2)+' GHz the index is '+sg(win.n)+', with ε = '+sg(win.eps)+' and μ = '+sg(win.mu)+'. The beam leaves at '+sg(win.delta,1)+'°, twice the '+D.alpha+'° wedge angle, with '+pct(win.T)+'% of the power through. This is the matched condition a perfect lens needs. Press Reset to try again.',k:'ok'};
  if(msgT>0&&msg)return{n:'Recorded',f:msg,k:(E.blk||E.nre>=0&&!st.lamp)?'warn':''};
  if(st.lamp)return{n:'Teflon control',f:'An ordinary wedge, n = '+D.nT+'. The beam bends '+sg(E.delta,1)+'°, toward the thick end. Switch back to the metamaterial.',k:''};
  if(E.blk)return{n:'Blocked',f:'At '+f(E.fr,2)+' GHz the index is imaginary: ε and μ have opposite signs, so the wave cannot travel. Nothing comes out. The negative band starts just above '+D.f0+' GHz.',k:'warn'};
  if(E.nre<0)return{n:'Negative index',f:'n = '+sg(E.nre)+' at '+f(E.fr,2)+' GHz. The beam leaves at '+sg(E.delta,1)+'°, on the far side of straight on, and the crests run backward inside. '+pct(E.T)+'% gets through. Find n = −1 and press Record.',k:E.T<.03?'warn':''};
  return{n:'Ordinary index',f:'n = '+sg(E.nre)+' at '+f(E.fr,2)+' GHz. The wires are no longer blocking, but the rings are out of band, so the beam bends the ordinary way, '+sg(E.delta,1)+'°.',k:''};
 }

 function read(){
  const s=E,dead=s.blk||s.T<.0005;
  return[
   ['Medium',s.ctrl?'Teflon':'Metamaterial'],
   ['Frequency',f(s.fr,2)+' GHz'],
   ['Index n',s.blk?'imaginary':sg(s.nre)],
   ['Beam bend',dead||s.tir?'none':sg(s.delta,1)+'°'],
   ['Power through',pct(s.T)+' %'],
   ['ε, μ',s.ctrl?sg(s.eps[0],1)+', +1.0':sg(s.eps[0],1)+', '+sg(s.mu[0],1)],
   ['Crest motion',s.blk?'none':s.nre<0?'backward':'forward'],
   ['Records',recs]
  ];
 }

 reset();
 return{
  ui:{label:'Frequency',min:0,max:100,btns:[
   {k:'lamps',l:'Medium',lf:()=>st.lamp?'Medium: Teflon':'Medium: metamaterial',on:()=>st.lamp},
   {k:'drop',l:'Record'},
   {k:'warp'},{k:'auto'},{k:'reset'}]},
  warp:[.25,.5,1,3],warpL:['0.25×','0.5×','1×','3×'],dtmax:.05,
  state:st,
  setThrottle(x){st.th=clamp(x,0,1);st.auto=false},
  toggleAuto(){if(st.mode==='fly')st.auto=!st.auto},
  lamps(){if(st.mode!=='fly')return;st.lamp=!st.lamp;st.auto=false;msgT=0;refresh()},
  drop(){record()},
  reset,step,tick(){},read,status,
  view(){return Object.assign({},E,{i:0,n:'Fly',f:'',th:0,t:tsim})}
 };
};
})();

/* ---- world.js ---- */
/* Metamaterials · the 3D model, used by World, Launch and Fly. update(dt,time,o) with o={state,tab,explode,sel}.
   Each part from parts.js is a group of meshes found by its id, so selecting a part lights it and dims the rest.
   Scale: 1 scene unit = 4.5 mm, so one unit cell is 0.89 units. The diagram stands in the XY plane: the beam travels along +x,
   up is toward the thin end of the wedge. The cells are drawn to scale. The wave crests are drawn at a third of their true
   spacing so several fit on screen. In World and Learn, with nothing selected, it alternates Teflon and the metamaterial and sweeps the frequency. */
(function(){
const T=window.HV.T.meta,D=T.DES,clamp=T.clamp;
const SC=.22,A=D.a*SC,W=D.W*SC,HH=D.H*SC,TAN=Math.tan(T.AL);
const GAP=3.2,RL=6.2,BH=1.5,NPRE=4,NIN=16,NPOST=6;
const sm=x=>{x=clamp(x,0,1);return x*x*(3-2*x)};
const xe=y=>W-y*TAN;                                         /* exit face x at height y (scene units); thinner going up */
const mod=(a,m)=>((a%m)+m)%m;
const M0=T.evalF(T.matchF,false),T0=T.evalF(T.matchF,true);

/* World/Learn demo: Teflon, swap, matched point, sweep up the band, sweep back, loop of 28 s */
const demo=time=>{
 const p=(time%28)/28;
 if(p<.18)return T0;
 if(p<.4)return M0;
 if(p<.72)return T.evalF(10.3+.9*sm((p-.4)/.32),false);
 if(p<.92)return T.evalF(11.2-(11.2-T.matchF)*sm((p-.72)/.2),false);
 return M0;
};

T.create=function(THREE,grp){
 const root=new THREE.Group();root.position.set(-4.2,0,-2);grp.add(root);
 const own=[],keep=o=>{own.push(o);return o};
 const parts={};
 const reg=(id,m,op)=>{keep(m);m.transparent=true;m.opacity=op;m.userData.op=op;(parts[id]=parts[id]||{mats:[]}).mats.push(m);return m};
 const lam=(id,color,op,extra)=>reg(id,new THREE.MeshLambertMaterial(Object.assign({color,side:THREE.DoubleSide},extra||{})),op);
 const bas=(id,color,op)=>reg(id,new THREE.MeshBasicMaterial({color,depthWrite:false}),op);
 const geo=g=>keep(g);
 const mesh=(g,m,parent,x,y,z)=>{const o=new THREE.Mesh(g,m);o.position.set(x||0,y||0,z||0);parent.add(o);return o};

 root.add(new THREE.AmbientLight(0xffffff,.8));
 const sun=new THREE.DirectionalLight(0xffffff,.8);sun.position.set(6,10,12);root.add(sun);

 /* wedge outline shared by the body, the board and the Teflon block */
 const outline=()=>{const s=new THREE.Shape();s.moveTo(0,-HH/2);s.lineTo(xe(-HH/2),-HH/2);s.lineTo(xe(HH/2),HH/2);s.lineTo(0,HH/2);s.lineTo(0,-HH/2);return s};
 const ex=(depth)=>{const g=keep(new THREE.ExtrudeGeometry(outline(),{depth,bevelEnabled:false}));g.translate(0,0,-depth/2);return g};
 const bodyM=lam('prism',0x5df2ff,.12),teflM=lam('control',0xf2f4f8,0);
 mesh(ex(1.3),bodyM,root);
 const tefl=mesh(ex(1.3),teflM,root);
 const boardM=lam('board',0x2f9f78,.38);
 const board=mesh(ex(.06),boardM,root);

 /* the cells: one copper wire per column, one split ring per cell */
 const cells=new THREE.Group();root.add(cells);
 const wiresG=new THREE.Group(),ringsG=new THREE.Group();cells.add(wiresG);cells.add(ringsG);
 const wM=lam('wires',0xff8a4d,.95),rM=lam('rings',0xffe14d,.95);
 const rg=geo(new THREE.TorusGeometry(A*.3,.032,6,20,Math.PI*2-.7));
 const rows=Math.floor(D.H/D.a),colTop={};
 for(let j=0;j<rows;j++){
  const y=-HH/2+(j+.5)*A,lim=xe(y)-A*.4;
  for(let i=0;(i+.5)*A<lim;i++){
   const x=(i+.5)*A,ring=mesh(rg,rM,ringsG,x+A*.12,y,.06);ring.rotation.z=((i+j)%4)*Math.PI/2+.4;
   colTop[i]=Math.max(colTop[i]==null?-1:colTop[i],j);
  }
 }
 const wg=[];
 for(const k in colTop){
  const i=+k,top=colTop[k],len=(top+1)*A,m=mesh(geo(new THREE.BoxGeometry(.045,len,.045)),wM,wiresG,(i+.5)*A-A*.26,-HH/2+len/2,-.06);wg.push(m);
 }

 /* source horn on the left, detector horn on the ray */
 const srcG=new THREE.Group();root.add(srcG);
 const hornM=lam('source',0x9aa3b2,1),hg=geo(new THREE.CylinderGeometry(.95,.38,2.4,4,1,true));
 const horn=mesh(hg,hornM,srcG,-GAP-1.2,0,0);horn.rotation.set(0,Math.PI/4,-Math.PI/2);
 mesh(geo(new THREE.BoxGeometry(1.2,.5,.5)),hornM,srcG,-GAP-2.8,0,0);
 const detG=new THREE.Group();root.add(detG);
 const dM=lam('detector',0x9aa3b2,1),dh=mesh(hg,dM,detG,1.2,0,0);dh.rotation.set(0,Math.PI/4,Math.PI/2);
 mesh(geo(new THREE.BoxGeometry(1.2,.5,.5)),dM,detG,2.8,0,0);
 const glowM=reg('detector',new THREE.MeshBasicMaterial({color:0x332a10}),1);
 mesh(geo(new THREE.SphereGeometry(.3,14,10)),glowM,detG,.6,0,0);

 /* the beam, in three pieces, and the straight-on reference line */
 const bM=bas('fronts',0x8fe9ff,.4),bPre=mesh(geo(new THREE.BoxGeometry(1,BH,.7)),bM,root),bIn=mesh(geo(new THREE.BoxGeometry(1,BH,.7)),bM,root),bOut=mesh(geo(new THREE.BoxGeometry(1,BH,.7)),bM,root);
 const refM=bas('detector',0xffffff,.28),ref=mesh(geo(new THREE.BoxGeometry(RL+2,.02,.02)),refM,root,W+(RL+2)/2,0,0);

 /* crest bars */
 const cM=bas('fronts',0xffffff,.8),cg=geo(new THREE.BoxGeometry(.06,BH+.3,.8));
 const mk=n=>{const a=[];for(let k=0;k<n;k++)a.push(mesh(cg,cM,root));return a};
 const cPre=mk(NPRE),cIn=mk(NIN),cPost=mk(NPOST);

 let ph=0;

 return{
  update(dt,time,o){
   o=o||{};dt=Math.min(dt,.1);ph+=dt;
   const tab=o.tab,exd=o.explode||0,sel=o.sel||null;
   let s=o.state||M0;
   if(tab==='world'||tab==='learn')s=sel==='control'?T0:(exd>.01||sel)?M0:demo(time);
   const ctrl=!!s.ctrl,blk=!!s.blk,dd=(isNaN(s.delta)||blk||s.T<.0005)?0:s.delta*Math.PI/180;
   const Tq=clamp(s.T||0,0,1),vis=blk||Tq<.0005?0:1,n=s.nre||0,an=Math.abs(n);

   /* what is fitted: cells or the Teflon block */
   cells.visible=!ctrl;
   bodyM.userData.op=ctrl?0:.12;teflM.userData.op=ctrl?.8:0;boardM.userData.op=ctrl?0:.38;
   wiresG.position.z=-exd*3.4;ringsG.position.z=exd*3.4;board.position.z=0;
   srcG.position.x=-exd*1.6;

   /* the exit ray starts at the face centre and leaves at the bend angle */
   const Ex=xe(0)+exd*0,ux=Math.cos(dd),uy=Math.sin(dd),rl=RL+exd*2.2;
   detG.position.set(Ex+ux*(rl+.2),uy*(rl+.2),0);detG.rotation.z=dd;
   tefl.position.set(0,0,0);

   /* beam pieces: before the wedge, inside it, and out */
   const pl=GAP+exd*1.6;
   bPre.position.set(-pl/2,0,0);bPre.scale.set(pl,1,1);
   bIn.position.set(W/2,0,0);bIn.scale.set(W,1,1);
   bOut.position.set(Ex+ux*rl/2,uy*rl/2,0);bOut.rotation.z=dd;bOut.scale.set(rl,1,1);
   const bo=Math.sqrt(Tq);
   bPre.userData.q=1;bIn.userData.q=blk?.12:Math.pow(Tq,.3);bOut.userData.q=bo;

   /* detector glow follows the power received */
   const g=Math.sqrt(Tq);glowM.color.setRGB(.2+.8*g,.16+.62*g,.06+.14*g);

   /* crest bars: forward in air, backward inside a negative-index medium, closer together by |n| */
   const lamV=s.lam*SC/3,spIn=clamp(lamV/Math.max(an,.05),.5,14),sp=lamV;
   const v0=1.6,vIn=v0/clamp(an,.4,3)*(n<0?-1:1);
   cPre.forEach((m,k)=>{const x=-pl+mod(k*sp+ph*v0,pl);m.position.set(x,0,0);m.rotation.z=0;m.visible=true});
   cIn.forEach((m,k)=>{
    m.visible=!blk&&k*spIn<=W;
    m.position.set(mod(k*spIn+ph*vIn,W),0,0);m.rotation.z=0;
   });
   cPost.forEach((m,k)=>{
    const d=mod(k*sp+ph*v0,rl);m.position.set(Ex+ux*d,uy*d,0);m.rotation.z=dd;m.visible=!!vis;
   });

   /* selection: the chosen part glows, the rest fade. Beam pieces carry their own strength. */
   const pulse=.22+.12*Math.sin(time*5);
   for(const id in parts){
    const pt=parts[id],isSel=sel===id,fade=sel?(isSel?1:.15):1;
    pt.mats.forEach(m=>{
     m.opacity+=(m.userData.op*fade-m.opacity)*Math.min(1,dt*8);
     if(m.emissive)m.emissive.setRGB(isSel?pulse:0,isSel?.8*pulse:0,isSel?.3*pulse:0);
    });
   }
   /* the three beam pieces share one material; their visibility is the box scale, so fade it by thickness instead */
   bPre.scale.y=1;bIn.scale.y=Math.max(.001,bIn.userData.q);bOut.scale.y=Math.max(.001,bOut.userData.q);
   bIn.scale.z=bIn.scale.y;bOut.scale.z=bOut.scale.y;
  },
  dispose(){
   grp.remove(root);
   own.forEach(x=>x.dispose&&x.dispose());
  }
 };
};
})();

/* ---- register.js ---- */
/* Metamaterials · registers the topic. Loaded last.
   Learn, Parts, the 3D model and the Launch mission come from learn.js, parts.js, world.js and mission.js. fly.js runs the Fly tab. */
(function(){
const HV=window.HV,T=HV.T.meta,D=T.DES;
HV.topics=HV.topics||{};

const M=T.evalF(T.matchF,false),bd=T.band();

HV.topics['metamaterials']={slug:'metamaterials',title:'Metamaterials',
 hook:'Copper rings and wires on circuit board that bend a beam the wrong way, because the material they make has a negative refractive index.',
 stats:[['n = '+T.sg(M.nre,1).replace('+',''),'index at '+T.f(M.fr,1)+' GHz, ε and μ both negative'],[T.sg(M.delta,0)+'°','beam bend, vs '+T.sg(T.evalF(M.fr,true).delta,0)+'° for Teflon'],[T.f(bd.lo,1)+'–'+T.f(bd.hi,1)+' GHz','the narrow negative band']],
 learn:T.LEARN,parts:T.PARTS,create:T.create,fly:{create:T.createFly},mission:{at:T.at,read:T.read,phases:T.P.map(p=>({n:p.n,w:p.w}))}};
})();
