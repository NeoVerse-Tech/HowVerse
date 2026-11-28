/* Octopus arms · core: all the physics and kinematics. Pure maths, no graphics. World, Launch and Fly only draw what this file returns.
   Reference design OA2, taken from the schematic: a chest harness (two rear cylinders, isotope thermoelectric generator, power distribution computer,
   spinal-tap nerve transducers, arm motility controllers, quick-disconnect screws) carrying four titanium snake arms. Each arm has a 2-axis swivel root,
   7 sections of 4 ball-jointed segments, and in each section a motor that drives two cylinders in opposite directions on each of two axes (elbow actuators),
   an arm battery and electronics at the root, and a quick-disconnect tip: 3-finger pincer or tripod foot.
   Worn by an invisible faceless mannequin whose skeleton this file also solves.
   Frames: metres, y up, z forward, x = wearer's LEFT. Arm order 0 upper-left, 1 upper-right, 2 lower-left, 3 lower-right.
   Physics (statics, section loads, tip-over, strap loads, heat, delay) is real. Design figures are marked "design". */
(function(){
const T=(window.HV.T=window.HV.T||{}).octopus=window.HV.T.octopus||{};
const PI=Math.PI,D=PI/180,G=9.81,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],mul=(a,s)=>[a[0]*s,a[1]*s,a[2]*s],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],
 cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],len=a=>Math.hypot(a[0],a[1],a[2]),unit=a=>{const l=len(a)||1;return[a[0]/l,a[1]/l,a[2]/l]};
const rot=(v,a,t)=>{const c=Math.cos(t),s=Math.sin(t),d=dot(a,v)*(1-c),x=cross(a,v);return[v[0]*c+x[0]*s+a[0]*d,v[1]*c+x[1]*s+a[1]*d,v[2]*c+x[2]*s+a[2]*d]};

/* ================= the wearer: Drillis-Contini lengths, Dempster masses ================= */
const H=1.75,MW=75;                                       /* height m, mass kg (design) */
const HIPH=.530*H,KNEEH=.285*H,ANKH=.039*H,SHH=.818*H;    /* joint heights standing */
const LTH=HIPH-KNEEH,LSH=KNEEH-ANKH,LTR=SHH-HIPH,LUA=.186*H,LFA=.146*H,LHD=.108*H;
const HIPW=.095*H,SHW=.1295*H,FOOTB=.030*H,FOOTF=.122*H,FOOTW=.0275*H;   /* hip and shoulder half-widths, heel behind and toe ahead of the ankle, foot half-width */
const DM={head:.081,trunk:.497,ua:.028,fa:.016,hd:.006,th:.100,sh:.0465,ft:.0145};   /* segment mass shares, sum 1 */
const TOLF=.015,TOLC=.03;                                 /* a sole within 15 mm of its support, or a pad tip within 30 mm of the floor, is in contact */
/* poses in degrees, sagittal. lean: trunk forward. th: thigh forward from vertical. kn: knee flexion. ua: upper arm forward. el: elbow flexion. supL/supR: height of what each foot stands on. py: fixed pelvis height (hanging) */
const POSES={
 stand:{lean:0,thL:0,thR:0,knL:0,knR:0,uaL:4,uaR:4,elL:8,elR:8},
 walk:{lean:6,thL:20,thR:-15,knL:5,knR:8,uaL:-18,uaR:18,elL:15,elR:15},
 crouch:{lean:35,thL:75,thR:75,knL:110,knR:110,uaL:40,uaR:40,elL:30,elR:30},
 climb:{lean:10,thL:70,thR:5,knL:80,knR:10,supL:.30,uaL:150,uaR:170,elL:10,elR:10},
 hang:{lean:0,thL:6,thR:-4,knL:12,knR:18,py:1.15,uaL:170,uaR:170,elL:0,elR:0}};
const BONES=[['hipL','kneeL'],['kneeL','ankleL'],['ankleL','toeL'],['hipR','kneeR'],['kneeR','ankleR'],['ankleR','toeR'],['hipL','hipR'],['hip','shMid'],['shL','shR'],
 ['shMid','head'],['shL','elL'],['elL','wrL'],['wrL','hdL'],['shR','elR'],['elR','wrR'],['wrR','hdR']];
function skeleton(pose){
 const P=typeof pose==='string'?POSES[pose]:pose,l=(P.lean||0)*D,tx=[1,0,0],ty=[0,Math.cos(l),Math.sin(l)],tz=[0,-Math.sin(l),Math.cos(l)];
 const leg=(th,kn,sup)=>{const a=th*D,b=(th-kn)*D,knee=[0,-LTH*Math.cos(a),LTH*Math.sin(a)],ank=[0,knee[1]-LSH*Math.cos(b),knee[2]+LSH*Math.sin(b)];return{knee,ank,drop:sup+ANKH-ank[1]}};
 const sL=P.supL||0,sR=P.supR||0,lg=[leg(P.thL,P.knL,sL),leg(P.thR,P.knR,sR)],py=P.py!==undefined?P.py:Math.max(lg[0].drop,lg[1].drop),pz=P.pz||0;
 const hip=[0,py,pz],J={hip},masses=[],feet=[];
 const mk=(m,p)=>masses.push([m,p]);
 const shMid=add(hip,mul(ty,LTR));J.shMid=shMid;J.head=add(shMid,mul(ty,.12*H));
 mk(DM.head*MW,J.head);mk(DM.trunk*MW,add(hip,mul(ty,.57*LTR)));
 [[1,'L',lg[0],sL],[-1,'R',lg[1],sR]].forEach((q,i)=>{const s=q[0],n=q[1],g=q[2],sup=q[3],hp=[s*HIPW,py,pz];J['hip'+n]=hp;J['knee'+n]=add(hp,g.knee);J['ankle'+n]=add(hp,g.ank);
  const an=J['ankle'+n];J['toe'+n]=[an[0],an[1]-ANKH,an[2]+FOOTF];
  const sole=an[1]-ANKH,contact=sole-sup<=TOLF,w=FOOTW,poly=[[an[0]-w,an[2]-FOOTB],[an[0]+w,an[2]-FOOTB],[an[0]+w,an[2]+FOOTF],[an[0]-w,an[2]+FOOTF]];
  feet.push({side:n,contact:contact,sole:sole,poly:poly});
  mk(DM.th*MW,add(hp,mul(g.knee,.433)));mk(DM.sh*MW,add(J['knee'+n],mul(sub(J['ankle'+n],J['knee'+n]),.433)));mk(DM.ft*MW,[an[0],an[1]-ANKH/2,an[2]+(FOOTF-FOOTB)/2]);
  const sh=add(shMid,mul(tx,s*SHW)),ua=(P['ua'+n]||0)*D,ea=ua+(P['el'+n]||0)*D;J['sh'+n]=sh;
  J['el'+n]=add(sh,[0,-LUA*Math.cos(ua),LUA*Math.sin(ua)]);J['wr'+n]=add(J['el'+n],[0,-LFA*Math.cos(ea),LFA*Math.sin(ea)]);J['hd'+n]=add(J['wr'+n],[0,-LHD*Math.cos(ea),LHD*Math.sin(ea)]);
  mk(DM.ua*MW,add(sh,mul(sub(J['el'+n],sh),.436)));mk(DM.fa*MW,add(J['el'+n],mul(sub(J['wr'+n],J['el'+n]),.430)));mk(DM.hd*MW,add(J['wr'+n],mul(sub(J['hd'+n],J['wr'+n]),.506)))});
 let c=[0,0,0];masses.forEach(m=>{c=add(c,mul(m[1],m[0]/MW))});
 return{pose:P,py:py,hip:hip,tx:tx,ty:ty,tz:tz,J:J,feet:feet,com:c,mass:MW}}
/* trunk coordinates (x left, y along the trunk, z forward, origin at the hip midpoint) to world, and back */
const toWorld=(sk,v)=>add(sk.hip,add(mul(sk.tx,v[0]),add(mul(sk.ty,v[1]),mul(sk.tz,v[2]))));
const toBody=(sk,w)=>{const d=sub(w,sk.hip);return[dot(d,sk.tx),dot(d,sk.ty),dot(d,sk.tz)]};

/* ================= the harness: schematic parts, masses (design) and trunk-frame positions ================= */
const MGEN=3,GENSP=2.4,GENEFF=.06;                        /* generator mass kg (design); electrical W per kg (flight RTG, 110 We in 45 kg); thermoelectric efficiency */
const HARN=[['frame',1.7,[0,.28,-.07]],['cylinderL',.7,[.11,.35,-.18]],['cylinderR',.7,[-.11,.35,-.18]],['generator',MGEN,[0,.22,-.14]],
 ['computer',.6,[0,.40,-.12]],['controllers',.4,[0,.34,-.12]],['transducers',.15,[0,.05,-.05]]];
const MHARN=HARN.reduce((a,h)=>a+h[1],0),PGEN=MGEN*GENSP,QGEN=PGEN/GENEFF-PGEN;   /* waste heat the harness must shed */
const MOUNT=[[.11,.43,-.17],[-.11,.43,-.17],[.10,.27,-.17],[-.10,.27,-.17]];   /* socket positions, trunk frame, on the rear cylinders */
const NARM=4,HF=.45,WSH=2*SHW,STRAP=250,CARRY=.30,SAFE=.6;   /* lever from hip belt to shoulder straps m; comfortable load per strap N (design); carried share of body mass; design zone share of the support polygon */

/* ================= the arm: geometry ================= */
const N=28,S=7,PER=N/S,P=.05,L=N*P,LS=PER*P;               /* segments, sections, segments per section (the schematic's 4-segment sheath), pitch m, length m, section length m */
const RO0=.040,RO1=.014,WALL=.6e-3,RINGW=.15,RINGT=4e-3,BALLF=.5,BALLT=1.5e-3,MJOINT=.005;   /* radius base and tip, sheath wall, ring, ball and wiring (design) */
const RTI=4430,RAL=2700,SIGU=950e6,SF=4;                  /* titanium and aluminium density kg/m3, Ti-6Al-4V ultimate Pa, safety factor on ultimate */
const ro=i=>RO0+(RO1-RO0)*(i+.5)/N,roEnd=k=>ro((k+1)*PER-1),xc=i=>(i+.5)*P,secOf=i=>Math.floor(i/PER);
const SOCK=35*D;let BEND=SOCK;for(let i=0;i<N;i++)BEND=Math.min(BEND,2*Math.atan(P/2/ro(i)));   /* ring rims touch at 2*atan(h/r); the socket lets go sooner */
const BENDUSE=.8*BEND,RMIN=P/BENDUSE,SECMAX=PER*BENDUSE,TURN=N*BENDUSE;   /* working bend per joint, tightest curve m, most one section can bend, most the arm can turn */
const YAWM=140*D,PMIN=-70*D,PMAX=100*D;                   /* swivel root limits (design) */

/* ================= the arm: sizing. Each section has 4 cylinders at 90 degrees, a motor driving each opposite pair, so two bending axes.
   Two design cases: (1) arm straight and level at full reach with the rated payload, which sets bending and motor power;
   (2) a column: the arm carries half the body (two arms hanging, or standing on two pads) with the force line ECC off the arm's axis, which sets the cylinders. Self-locking screws hold it, so it costs rod area, not motor power.
   Cylinder rod area from the larger working force times SF over ultimate strength. Motor mass from power = moment x bend rate over specific power. ================= */
const ECC=.05;                                             /* how far the force line may sit off the arm's axis in the column case, m (design) */
const PAY=1,AMAX=2,LF=1+AMAX/G;                          /* rated payload kg at full level reach (design); design tip acceleration m/s2 and its load factor */
const RF=.8,OMEGA=1,SPM=300,ETA=.6,CYLX=3,MMOT0=.02;       /* cylinder circle share of ring radius; section bend rate rad/s; motor+gear specific power W/kg; drive efficiency; housing, nut and bearings as multiples of rod mass; smallest motor kg (design) */
const MELEC=.12,MBATA=.4,MHOUSE=.1,WHKG=200;              /* arm electronics kg, arm battery kg, root housing kg, pack Wh/kg (design) */
const FG=40,MU=.5,NFING=3,PADR=.07;                        /* pincer: grip force per finger N, friction, fingers; foot: toe circle radius m (design) */
const TOOLS={pincer:{m:.30,grip:MU*NFING*FG/G},foot:{m:.25,grip:0}};
const REFTOOL=['pincer','pincer','foot','foot'];
const MST=[];for(let i=0;i<N;i++){const r=ro(i);MST[i]=RTI*2*PI*r*WALL*P+RAL*2*PI*r*(RINGW*r)*RINGT+RTI*4*PI*(BALLF*r)*(BALLF*r)*BALLT+MJOINT}
const RA=k=>RF*roEnd(k);
const FW=Array(S).fill(0),MACT=Array(S).fill(0),MSEG=Array(N).fill(0),CAPW=Array(S).fill(0);
let MROOT=0,MARM=0,MBODY=MW+MHARN+4*3;
for(let it=0;it<24;it++){
 for(let i=0;i<N;i++)MSEG[i]=MST[i]+MACT[secOf(i)]/PER;
 for(let k=0;k<S;k++){const b=k*PER*P;let M=(PAY+TOOLS.pincer.m)*(L-b);for(let i=k*PER;i<N;i++)M+=MSEG[i]*(xc(i)-b);
  const M1=G*LF*M,F1=M1/(2*RA(k)),F3=G*LF*(MBODY/2)*(.25+ECC/(2*RA(k)));FW[k]=Math.max(F1,F3);CAPW[k]=M1;
  MACT[k]=4*RTI*(SF*FW[k]/SIGU)*LS*CYLX+2*Math.max(MMOT0,M1*OMEGA/SPM)}
 MROOT=2*Math.max(MMOT0,CAPW[0]*OMEGA/SPM)+MBATA+MELEC+MHOUSE;
 let ms=0;for(let i=0;i<N;i++)ms+=MSEG[i];MARM=ms+MROOT+TOOLS.pincer.m;MBODY=MW+MHARN+NARM*MARM}
const MARMS=MSEG.reduce((a,b)=>a+b,0)+MROOT,MCARRY=MHARN+NARM*MARM;   /* arm without its tip, and everything the wearer carries */
const CAPROOT=CAPW[0];                                     /* swivel torque = first section's moment capacity */
const PAXIAL=4*FW[S-1],EBAT=NARM*MBATA*WHKG;                /* axial pull the weakest section holds, N; battery energy Wh */

/* ================= arm kinematics: root swivel (yaw, pitch) then 7 sections, each a constant-curvature arc bent by (bx,by) about its own axes. q = [yaw, pitch, b1x, b1y, ... b7x, b7y] ================= */
const NQ=2+2*S;
function rootFrame(sk,a,yaw,pitch){
 const m=MOUNT[a],o=toWorld(sk,m),y0=sk.ty,z0=mul(sk.tz,-1),x0=cross(y0,z0);
 const x1=rot(x0,y0,yaw),z1=rot(z0,y0,yaw),y2=rot(y0,x1,-pitch),z2=rot(z1,x1,-pitch);
 return{o:o,x:x1,y:y2,z:z2,yawAxis:y0,pitchAxis:x1}}
function secPoint(F,th,u,s){const ts=th*s/LS;if(th<1e-9)return{d:mul(F.z,s),x:F.x,y:F.y,z:F.z};
 const rho=LS/th,ax=cross(F.z,u);return{d:add(mul(u,rho*(1-Math.cos(ts))),mul(F.z,rho*Math.sin(ts))),x:rot(F.x,ax,ts),y:rot(F.y,ax,ts),z:rot(F.z,ax,ts)}}
function chain(sk,a,q,full){
 const R=rootFrame(sk,a,q[0],q[1]);let F={x:R.x,y:R.y,z:R.z},p=R.o;const o=full?{root:R,j:[p],c:[],base:[]}:null;
 for(let k=0;k<S;k++){const bx=q[2+2*k],by=q[3+2*k],th=Math.hypot(bx,by),u=th>1e-9?add(mul(F.x,bx/th),mul(F.y,by/th)):F.x;
  if(full){o.base.push({p:p,x:F.x,y:F.y,z:F.z});for(let j=1;j<=PER;j++){o.c.push(add(p,secPoint(F,th,u,(j-.5)*P).d));o.j.push(add(p,secPoint(F,th,u,j*P).d))}}
  const e=secPoint(F,th,u,LS);p=add(p,e.d);F={x:e.x,y:e.y,z:e.z}}
 if(full){o.p=p;o.t=F.z;o.F=F;return o}
 return{p:p,t:F.z}}
function clampQ(q){q[0]=clamp(q[0],-YAWM,YAWM);q[1]=clamp(q[1],PMIN,PMAX);
 for(let k=0;k<S;k++){const x=q[2+2*k],y=q[3+2*k],th=Math.hypot(x,y);if(th>SECMAX){q[2+2*k]=x*SECMAX/th;q[3+2*k]=y*SECMAX/th}}return q}
function solveN(A,b){const n=b.length,M=A.map((r,i)=>r.concat([b[i]]));
 for(let i=0;i<n;i++){let p=i;for(let r=i+1;r<n;r++)if(Math.abs(M[r][i])>Math.abs(M[p][i]))p=r;if(Math.abs(M[p][i])<1e-12)return null;[M[i],M[p]]=[M[p],M[i]];
  for(let r=0;r<n;r++)if(r!==i){const f=M[r][i]/M[i][i];for(let c=i;c<=n;c++)M[r][c]-=f*M[i][c]}}
 return M.map((r,i)=>r[n]/r[i])}
const REST=[];                                              /* relaxed posture per arm, filled below */
/* damped least squares to a tip position (and, if given, a tip direction), warm-started from q0, pulled gently toward the relaxed posture in the null space */
function solveArm(sk,a,tgt,q0,opt){
 opt=opt||{};const it=opt.iter||40,tol=opt.tol||.002,lam=opt.lam||.08,wd=tgt.dir?(opt.straight?.6:.18):0,nf=opt.straight?2+2*(opt.kfree||4):NQ;let rest=opt.free?null:(REST[a]||null),wr=.15;const dir=tgt.dir?unit(tgt.dir):null;
 let q=clampQ((q0||new Array(NQ).fill(0)).slice()),err=0;for(let c=nf;c<NQ;c++)q[c]=0;   /* a loaded arm: only the root and its first sections turn, the rest is a straight column */
 const res=q=>{const f=chain(sk,a,q),e=sub(tgt.pos,f.p),r=[e[0],e[1],e[2]];if(dir){const d=sub(dir,f.t);r.push(wd*d[0],wd*d[1],wd*d[2])}return r};
 for(let n=0;n<it;n++){
  const r0=res(q),pe=Math.hypot(r0[0],r0[1],r0[2]);err=pe;if(pe<tol&&(!dir||Math.hypot(r0[3],r0[4],r0[5])<.03))break;
  const r=r0.slice();if(pe>.2)for(let i=0;i<3;i++)r[i]*=.2/pe;
  const m=r.length,Jc=[];
  for(let c=0;c<NQ;c++){if(c>=nf){Jc.push(r0.map(()=>0));continue}const q2=q.slice();q2[c]+=1e-4;const r2=res(q2);Jc.push(r0.map((v,i)=>(v-r2[i])/1e-4))}   /* column c: d(tip)/d(q_c), so J dq = r */
  const A=[];for(let i=0;i<m;i++){A.push([]);for(let j=0;j<m;j++){let s=0;for(let c=0;c<NQ;c++)s+=Jc[c][i]*Jc[c][j];A[i].push(s+(i===j?lam*lam:0))}}
  const y=solveN(A,r);if(!y)break;
  const dq=new Array(NQ);for(let c=0;c<NQ;c++){let s=0;for(let i=0;i<m;i++)s+=Jc[c][i]*y[i];dq[c]=s}
  if(opt.straight){rest=new Array(NQ).fill(0);rest[1]=opt.up?90*D:PMIN}   /* column: root swivel aims along the force line */
  if(rest){const v=q.map((x,c)=>c<nf?wr*(rest[c]-x):0),Jv=new Array(m).fill(0);for(let c=0;c<NQ;c++)for(let i=0;i<m;i++)Jv[i]+=Jc[c][i]*v[c];
   const z=solveN(A,Jv);if(z)for(let c=0;c<NQ;c++){let s=0;for(let i=0;i<m;i++)s+=Jc[c][i]*z[i];dq[c]+=v[c]-s}}
  for(let c=0;c<NQ;c++)q[c]+=dq[c];clampQ(q)}
 const f=chain(sk,a,q),e=sub(tgt.pos,f.p),root=rootFrame(sk,a,q[0],q[1]).o;err=len(e);
 return{q:q,err:err,ok:err<=.01,reach:len(sub(tgt.pos,root)),tip:f.p,tangent:f.t}}

/* ================= the reference state. Doc Ock stance on a standing wearer: upper pincers up and out, lower feet planted wide behind ================= */
const REFTIPS=[[.75,2.20,.35],[-.75,2.20,.35],[.32,0,-.22],[-.32,0,-.22]],REFDIR=[null,null,[0,-1,0],[0,-1,0]];
(function(){const sk=skeleton('stand');for(let a=0;a<NARM;a++){REST[a]=solveArm(sk,a,{pos:REFTIPS[a],dir:REFDIR[a]},null,{iter:160,free:true}).q}})();
/* hanging: the pelvis settles until the arms are straight under load. Returns the hang pose for pincers holding at height holdY */
const hangPose=holdY=>Object.assign({},POSES.hang,{py:holdY-.985*L-MOUNT[0][1]});
function refState(poseName){const sk=skeleton(poseName||'stand'),o={pose:poseName||'stand',arms:[]};
 for(let a=0;a<NARM;a++)o.arms.push({tip:REFTIPS[a].slice(),dir:REFDIR[a]?REFDIR[a].slice():null,tool:REFTOOL[a],load:0,hold:false,q:REST[a].slice()});return o}

/* ================= statics ================= */
/* shape of one arm for drawing: joints, segment centres, section base frames, tip frame */
function armShape(sk,a,q){return chain(sk,a,q,true)}
/* section loads of one arm. tipF: force on the tip from the world, N. mtip: tool + payload kg. lf: load factor (1 = held still).
   For section k the base cut carries moment M and pull T of everything beyond it; the 4 cylinders share them: cylinder load = T/4 + |M|/(2 r_a). util 1 = working capacity. */
function armLoads(sh,tipF,mtip,lf){
 lf=lf||1;const items=[],g=[0,-G*lf,0];for(let i=0;i<N;i++)items.push([MSEG[i],sh.c[i],mul(g,MSEG[i])]);
 items.push([mtip,sh.p,add(mul(g,mtip),tipF||[0,0,0])]);
 const sec=[];let M0=null;
 for(let k=0;k<S;k++){const b=sh.base[k];let M=[0,0,0],Fs=[0,0,0];
  for(let i=k*PER;i<items.length;i++){M=add(M,cross(sub(items[i][1],b.p),items[i][2]));Fs=add(Fs,items[i][2])}
  const mx=dot(M,b.x),my=dot(M,b.y),Tn=dot(Fs,b.z);if(k===0)M0=M;
  sec.push({mx:mx,my:my,T:Tn,util:(Math.abs(Tn)/4+Math.max(Math.abs(mx),Math.abs(my))/(2*RA(k)))/FW[k]})}
 const R=sh.root,ru=Math.max(Math.abs(dot(M0,R.yawAxis)),Math.abs(dot(M0,R.pitchAxis)))/CAPROOT;
 let u=ru,w=-1;sec.forEach((s,k)=>{if(s.util>u){u=s.util;w=k}});
 return{sec:sec,root:ru,util:u,worst:w}}                 /* worst: section index, or -1 for the swivel root */
function hullOf(pts){const p=pts.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);if(p.length<3)return p;
 const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],up=[];
 for(const q of p){while(lo.length>=2&&cr(lo[lo.length-2],lo[lo.length-1],q)<=0)lo.pop();lo.push(q)}
 for(let i=p.length-1;i>=0;i--){const q=p[i];while(up.length>=2&&cr(up[up.length-2],up[up.length-1],q)<=0)up.pop();up.push(q)}
 lo.pop();up.pop();return lo.concat(up)}
function marginIn(poly,c){if(poly.length<3)return-1;let m=1e9;for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],ex=b[0]-a[0],ez=b[1]-a[1],l=Math.hypot(ex,ez)||1;
 m=Math.min(m,(ex*(c[1]-a[1])-ez*(c[0]-a[0]))/l)}return m}
function shrink(poly,k){let cx=0,cz=0;poly.forEach(p=>{cx+=p[0];cz+=p[1]});cx/=poly.length;cz/=poly.length;return poly.map(p=>[cx+(p[0]-cx)*k,cz+(p[1]-cz)*k])}
/* share the weight W over the support points so that force, and moment about the centre of mass, balance; no point may pull down. Few or collinear points: equal shares */
function distribute(pts,c,W){const n=pts.length,f=new Array(n).fill(0);let act=pts.map((_,i)=>i);
 for(let g=0;g<n;g++){const m=act.length;if(!m)break;
  const rows=[a=>1,a=>pts[a][0],a=>pts[a][1]],A=[[0,0,0],[0,0,0],[0,0,0]];
  for(let i=0;i<3;i++)for(let j=0;j<3;j++)act.forEach(a=>{A[i][j]+=rows[i](a)*rows[j](a)});
  const y=m>=3?solveN(A,[W,W*c[0],W*c[1]]):null;
  if(!y){act.forEach(a=>{f[a]=W/m});break}
  let worst=-1,lo=-1e-9;act.forEach(a=>{const v=y[0]+y[1]*pts[a][0]+y[2]*pts[a][1];f[a]=v;if(v<lo){lo=v;worst=a}});
  if(worst<0)break;f[worst]=0;act=act.filter(a=>a!==worst)}
 return f.map(v=>Math.max(0,v))}

/* whole-body evaluation. state={pose, arms:[{tip,dir,tool,load,hold,q}]x4}. Solves every arm to its tip target (warm start from arm.q, written back), then returns shapes, section loads,
   balance, harness load and masses. Contact is derived: a foot-tool tip within 30 mm of the floor and pointing down stands; a pincer with hold:true clamps a fixed hold and carries weight. */
function evaluate(st,opt){
 const sk=skeleton(st.pose),A=[],items=[];
 const mk=(m,p)=>items.push([m,p]);mk(MW,sk.com);HARN.forEach(h=>mk(h[1],toWorld(sk,h[2])));
 for(let a=0;a<NARM;a++){const s=st.arms[a],tool=s.tool||REFTOOL[a];let sol=null,q=s.q;
  const ld=s.hold||(tool==='foot'&&s.tip&&s.tip[1]<=TOLC),dr=s.dir||(ld?(s.hold?[0,1,0]:[0,-1,0]):null);   /* a loaded tip points along the force: up for a hold, down for a foot */
  if(s.tip){sol=solveArm(sk,a,{pos:s.tip,dir:dr},q||REST[a],Object.assign({},opt,{straight:ld,up:!!s.hold}));q=sol.q;s.q=q}else if(!q)q=REST[a].slice();
  const sh=armShape(sk,a,q),mt=TOOLS[tool].m+(s.load||0);
  mk(MROOT,sh.root.o);for(let i=0;i<N;i++)mk(MSEG[i],sh.c[i]);mk(mt,sh.p);
  A.push({a:a,tool:tool,sol:sol,sh:sh,mtip:mt,q:q,hold:!!s.hold,contact:null,pts:[]})}
 let m=0,c=[0,0,0];items.forEach(i=>{m+=i[0];c=add(c,mul(i[1],i[0]))});c=mul(c,1/m);const W=m*G;
 const sup=[];                                              /* support points: [x,z], with an owner */
 sk.feet.forEach(f=>{if(f.contact)f.poly.forEach(p=>sup.push({p:p,o:-1}))});
 const nFloor0=sup.length;
 A.forEach(r=>{const tip=r.sh.p,t=r.sh.t;
  if(r.tool==='foot'&&tip[1]<=TOLC&&t[1]<=-Math.cos(40*D)){r.contact='foot';const e1=unit(cross(t,[1,0,0])),e2=cross(t,e1);
   for(let k=0;k<3;k++){const ph=(90+120*k)*D,p=add(tip,add(mul(e1,PADR*Math.cos(ph)),mul(e2,PADR*Math.sin(ph))));sup.push({p:[p[0],p[2]],o:r.a})}}
  else if(r.tool==='pincer'&&r.hold){r.contact='hold';sup.push({p:[tip[0],tip[2]],o:r.a})}});
 const f=distribute(sup.map(s=>s.p),[c[0],c[2]],W);
 A.forEach(r=>{r.F=0;sup.forEach((s,i)=>{if(s.o===r.a)r.F+=f[i]})});
 const floorPts=sup.filter(s=>s.o<0||A[s.o].contact==='foot').map(s=>s.p),holds=A.filter(r=>r.contact==='hold');
 let bal={mode:'fall',margin:-1,warn:true,tip:true,hull:[],com:[c[0],c[2]],swing:0};
 if(floorPts.length>=3){const h=hullOf(floorPts),mg=marginIn(h,[c[0],c[2]]),mz=marginIn(shrink(h,SAFE),[c[0],c[2]]);bal={mode:'stand',margin:mg,warn:mz<0,tip:mg<0,hull:h,com:[c[0],c[2]],swing:0}}
 else if(holds.length){let hx=0,hz=0;holds.forEach(r=>{hx+=r.sh.p[0];hz+=r.sh.p[2]});hx/=holds.length;hz/=holds.length;const sw=Math.hypot(c[0]-hx,c[2]-hz);bal={mode:'hang',margin:0,warn:sw>.25,tip:false,hull:[],com:[c[0],c[2]],swing:sw}}
 A.forEach(r=>{const tf=r.contact?[0,r.F,0]:[0,0,0];r.tipF=tf;r.loads=armLoads(r.sh,tf,r.mtip,1)});
 /* harness: every external force on harness and arms, taken about the hip belt */
 let Mh=[0,0,0];HARN.forEach(h=>{Mh=add(Mh,cross(sub(toWorld(sk,h[2]),sk.hip),[0,-G*h[1],0]))});
 A.forEach(r=>{const add1=(p,F)=>{Mh=add(Mh,cross(sub(p,sk.hip),F))};add1(r.sh.root.o,[0,-G*MROOT,0]);for(let i=0;i<N;i++)add1(r.sh.c[i],[0,-G*MSEG[i],0]);add1(r.sh.p,add([0,-G*r.mtip,0],r.tipF))});
 const Mp=dot(Mh,sk.tx),Mr=dot(Mh,sk.tz),sp={Mp:Mp,Mr:Mr,util:Math.max(Math.abs(Mp)/(2*STRAP*HF),Math.abs(Mr)/(2*STRAP*WSH))};
 let mc=MHARN;A.forEach(r=>{mc+=MROOT+MARMS-MROOT+r.mtip});   /* harness + arms + their tips; MARMS already holds the root */
 let worst=0;A.forEach(r=>{worst=Math.max(worst,r.loads.util)});
 return{sk:sk,arms:A,mass:m,carried:mc,carriedShare:mc/MW,com:c,balance:bal,spine:sp,util:worst,overload:worst>1||sp.util>1}}

/* ================= power, heat, delay ================= */
const PARM=6,PCOMP=15,PTRANS=3,HCONV=10,CTI=500,TLIM=60,TAMB=25;   /* arm electronics W, harness computer W, transducers W, surface film coefficient W/m2K, specific heat J/kgK, surface limit C, ambient C (design) */
const ASURF=(()=>{let a=0;for(let i=0;i<N;i++)a+=2*PI*ro(i)*P;return a})();
function power(ev,duty){let mech=0;ev.arms.forEach(r=>r.loads.sec.forEach(s=>{mech+=(Math.abs(s.mx)+Math.abs(s.my))*OMEGA}));mech*=duty;
 const base=NARM*PARM+PCOMP+PTRANS,el=base+mech/ETA,net=el-PGEN,hot=(PARM+mech/NARM*(1/ETA-1));
 return{mech:mech,base:base,el:el,net:net,hours:net>0?EBAT/net:Infinity,armHeat:hot,gen:PGEN}}
const TAU=MARMS*CTI/(HCONV*ASURF),DTSS=q=>q/(HCONV*ASURF);   /* arm thermal time constant s; steady rise per watt of arm heat */
const heatStep=(Tc,Q,dt)=>Tc+(TAMB+DTSS(Q)-Tc)*(1-Math.exp(-dt/TAU));
const DELAY={nerve:.05+.005+.015+.04,emg:.15+.005+.015+.04};   /* decode window (nerve is an assumption), link, compute, drive lag, s */
const drift=(v,mode)=>v*DELAY[mode||'nerve'],needsAuto=(v,eps,mode)=>eps/v<DELAY[mode||'nerve'];

Object.assign(T,{PI,D,G,clamp,add,sub,mul,dot,cross,len,unit,rot,H,MW,POSES,BONES,skeleton,toWorld,toBody,HARN,MHARN,MGEN,PGEN,QGEN,GENEFF,MOUNT,NARM,HF,STRAP,CARRY,SAFE,
 N,S,PER,P,L,LS,RO0,RO1,ro,roEnd,secOf,BEND,BENDUSE,RMIN,SECMAX,TURN,YAWM,PMIN,PMAX,PAY,LF,SF,FW,CAPW,CAPROOT,PAXIAL,MSEG,MACT,MROOT,MARM,MARMS,MCARRY,MTOT:MCARRY,MBODY,TOOLS,REFTOOL,PADR,EBAT,
 NQ,REST,REFTIPS,REFDIR,refState,hangPose,rootFrame,chain,armShape,solveArm,armLoads,evaluate,distribute,hullOf,power,heatStep,TAU,DTSS,TLIM,TAMB,ASURF,DELAY,drift,needsAuto,OMEGA,
 /* design constants, exported so Parts and Learn quote them instead of repeating them */
 AMAX,ECC,FG,MU,NFING,WALL,SIGU,MBATA,MELEC,MHOUSE,WHKG,PARM,PCOMP,PTRANS,ETA,SPM,RF,MMOT0,TOLC,WSH,SHW});
})();
