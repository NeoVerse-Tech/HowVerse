/* Microbot swarm · forming: target shapes, a structure check and the build schedule. Pure maths, no graphics.
   A construct is a set of smooth curves ("strokes") with changing thickness. Each stroke is filled with strands, chains of slender bots joined
   end face to end face and bending at their ball joints. Strands sit on a square grid, SIDEPITCH apart, and every second one is slid 1.6 mm
   along, so shoulders nest beside narrower waists. The code places every bot, checks bending, tipping and sliding, and works out the build
   schedule. Shapes are PROPOSED: nobody has built them.
   Units: millimetres, z up, z = 0 on the floor. Add a shape with T.addForm(key,label,k=>[stroke(...), ...]). */
(function(){
const T=(window.HV.T=window.HV.T||{}).microbots=window.HV.T.microbots||{};
const {LEN,SHO,ENDA,NECKZ,SHZ,SIDEPITCH,MSIDE,W,MUF,FEND,FSIDE,MENDM,BENDUSE,VMOVE,PIDLE,PMOVE,TSET,EB,USE,clamp}=T;
const L=LEN*1e3,PITCH=SIDEPITCH*1e3,SLIDE=1.6,EA=ENDA*1e3,STEP=.6;

/* flank pull between two neighbouring strands in a bundle: the slide that packs best leaves the flank magnets offset, so sum the pairs that face
   each other with the 1/d⁴ law. A rough estimate, and weak: this is the open problem of the design. */
const SIDEBUNDLE=(()=>{const z=MSIDE.z*1e3,c=MSIDE.c*1e3,a=SHO*1e3-(SHO-ENDA)*1e3*(z-SHZ*1e3)/(L/2-SHZ*1e3),gap=PITCH-2*(a-c/2);let f=0;
 for(const za of[-z,z])for(let k=-1;k<=1;k++)for(const zb of[-z,z]){const d=Math.hypot(gap,za-(SLIDE+k*L+zb));f+=FSIDE*Math.pow(c/d,4)}return f})();

/* ---- vectors ---- */
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],add=(a,b,k)=>[a[0]+b[0]*k,a[1]+b[1]*k,a[2]+b[2]*k];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],len=a=>Math.sqrt(dot(a,a)),unit=a=>{const l=len(a)||1;return[a[0]/l,a[1]/l,a[2]/l]};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];

/* ---- a stroke: smooth curve through control points, radius easing from r0 to r1 ----
   {pts:[[x,y,z],…], r:[r0,r1], on:index of the stroke it grows from (omit for one that starts on the floor), arch:true if both ends stand on the floor} */
const stroke=(pts,r0,r1,o)=>Object.assign({pts,r:[r0,r1===undefined?r0:r1]},o||{});
function sample(pts){
 const P=[],S=[0];
 for(let i=0;i<pts.length-1;i++){
  const p0=pts[Math.max(0,i-1)],p1=pts[i],p2=pts[i+1],p3=pts[Math.min(pts.length-1,i+2)],m=Math.max(2,Math.ceil(len(sub(p2,p1))/STEP));
  for(let j=i?1:0;j<=m;j++){const t=j/m,t2=t*t,t3=t2*t;
   P.push([0,1,2].map(k=>.5*(2*p1[k]+(p2[k]-p0[k])*t+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t2+(3*p1[k]-p0[k]-3*p2[k]+p3[k])*t3)))}}
 for(let i=1;i<P.length;i++)S.push(S[i-1]+len(sub(P[i],P[i-1])));
 /* frames that follow the curve without spinning */
 const Tn=P.map((p,i)=>unit(sub(P[Math.min(P.length-1,i+1)],P[Math.max(0,i-1)]))),U=[],V=[];
 let u=Math.abs(Tn[0][2])<.9?unit(cross([0,0,1],Tn[0])):[1,0,0];
 for(let i=0;i<P.length;i++){u=unit(add(u,Tn[i],-dot(u,Tn[i])));U.push(u);V.push(cross(Tn[i],u))}
 return{P,S,Tn,U,V,L:S[S.length-1]}}

/* grid points of a bundle of radius r: the centre strand is always there */
function section(r){const o=[],m=Math.floor(r/PITCH);
 for(let i=-m;i<=m;i++)for(let j=-m;j<=m;j++)if(i*i+j*j===0||Math.hypot(i,j)*PITCH+EA<=r)o.push([i,j]);return o}
/* what the end bonds of such a section resist before it peels open about one edge, N·m. One strand gives MENDM. */
const CAP={};
function capacity(r){const key=Math.round(r*4);if(CAP[key])return CAP[key];const s=section(key/4);let lo=0;for(const q of s)lo=Math.min(lo,q[0]*PITCH);
 let m=0;for(const q of s)m+=(q[0]*PITCH-lo+EA)*1e-3*FEND;return CAP[key]={m,n:s.length,loose:s.length*MENDM}}

/* ---------- place every bot ---------- */
function build(strokes){
 const C=[],A=[],B=[],ST=[],D=[],lines=[],hash=new Map(),CELL=2;
 const hk=(x,y,z)=>x+','+y+','+z;
 /* is this point already filled by a bot of another stroke? (where strokes join) */
 const taken=(p,s)=>{const cx=Math.floor(p[0]/CELL),cy=Math.floor(p[1]/CELL),cz=Math.floor(p[2]/CELL);
  for(let x=cx-1;x<=cx+1;x++)for(let y=cy-1;y<=cy+1;y++)for(let z=cz-1;z<=cz+1;z++){const l=hash.get(hk(x,y,z));if(l)for(const q of l)if(q[3]!==s&&len(sub(p,q))<PITCH*.85)return true}return false};
 const put=(p,s)=>{const k=hk(Math.floor(p[0]/CELL),Math.floor(p[1]/CELL),Math.floor(p[2]/CELL));let l=hash.get(k);if(!l)hash.set(k,l=[]);l.push([p[0],p[1],p[2],s])};
 let maxBend=0,tight=0;
 strokes.forEach((sk,si)=>{
  const c=sample(sk.pts),n=c.P.length,rad=i=>sk.r[0]+(sk.r[1]-sk.r[0])*c.S[i]/c.L;
  /* distance from the floor at which this stroke starts */
  let base=0;
  if(sk.on!==undefined){const par=lines[sk.on];let best=1e18;for(let i=0;i<par.c.P.length;i++){const d=len(sub(par.c.P[i],c.P[0]));if(d<best){best=d;base=par.base+par.c.S[i]}}}
  lines.push({c,base,rad,sk});
  const fresh=[];
  for(const g of section(Math.max(sk.r[0],sk.r[1]))){
   const ox=g[0]*PITCH,oy=g[1]*PITCH,need=g[0]||g[1]?Math.hypot(ox,oy)+EA:0;
   /* this strand's own path, cut where the stroke is too thin for it */
   let run=[];
   const flush=()=>{
    if(run.length>1){
     const S=[0];for(let i=1;i<run.length;i++)S.push(S[i-1]+len(sub(run[i].p,run[i-1].p)));
     const total=S[S.length-1];let h=0;
     const at=s=>{while(h<S.length-2&&S[h+1]<s)h++;while(h>0&&S[h]>s)h--;const f=clamp((s-S[h])/(S[h+1]-S[h]||1),0,1);return add(run[h].p,sub(run[h+1].p,run[h].p),f)};
     for(let s=((g[0]+g[1])&1)?SLIDE:0;s+L<=total+.5;s+=L){
      const p0=at(s),pm=at(s+L/2),p1=at(Math.min(total,s+L)),a=unit(sub(pm,p0)),b=unit(sub(p1,pm));
      const mid=add(pm,[0,0,0],0);
      if(mid[2]<-.2||taken(mid,si)||taken(add(mid,a,-L/4),si)&&taken(add(mid,b,L/4),si))continue;
      const bend=Math.acos(clamp(dot(a,b),-1,1));if(bend>maxBend)maxBend=bend;if(bend>BENDUSE)tight++;
      C.push(mid);A.push(a);B.push(b);ST.push(si);D.push(base+run[h].s);fresh.push([mid,a,b])}}
    run=[]};
   for(let i=0;i<n;i++){if(rad(i)+1e-6<need){flush();continue}run.push({p:add(add(c.P[i],c.U[i],ox),c.V[i],oy),s:c.S[i]})}
   flush()}
  for(const f of fresh){put(f[0],si);put(add(f[0],f[1],-L/4),si);put(add(f[0],f[2],L/4),si)}
 });
 const n=C.length,pos=new Float32Array(n*3),d0=new Float32Array(n*3),d1=new Float32Array(n*3);
 for(let i=0;i<n;i++){pos.set(C[i],i*3);d0.set(A[i],i*3);d1.set(B[i],i*3)}
 return{n,pos,dir0:d0,dir1:d1,stroke:Int32Array.from(ST),dist:Float32Array.from(D),lines,maxBend,tight}}

/* ---------- structure check ----------
   Each stroke is cut at points along its curve. Everything beyond a cut hangs on that cut: its weight bends the end bonds (a growing stroke),
   or, for an arch, pushes down through both feet (three-hinge estimate: two feet and a crown). Parts within a bot-width of the floor rest on it.
   use = 1 means the end bonds are at their limit, IF the strands of a bundle act as one solid beam. That needs neighbours that cannot slip past
   each other, which the weak flank bonds have not been shown to do (PROPOSED). looseUse is the other extreme: every strand bending on its own.
   First-order statics: no wind, shaking or twisting. */
function check(m){
 const nl=m.lines.length,load=m.lines.map(l=>new Float64Array(l.c.P.length*4)),count=new Int32Array(nl);
 const nearest=(c,p)=>{let b=0,bd=1e18;for(let i=0;i<c.P.length;i++){const q=c.P[i],d=(q[0]-p[0])**2+(q[1]-p[1])**2+(q[2]-p[2])**2;if(d<bd){bd=d;b=i}}return b};
 /* weight w at point (x,y) acting on line li at sample i: store count, Σx, Σy */
 const hang=(li,i,w,x,y)=>{const a=load[li];a[i*4]+=w;a[i*4+1]+=w*x;a[i*4+2]+=w*y};
 let tw=0,tx=0,ty=0;
 for(let k=0;k<m.n;k++){const x=m.pos[k*3],y=m.pos[k*3+1],z=m.pos[k*3+2],li=m.stroke[k];count[li]++;tw++;tx+=x;ty+=y;
  if(z>2.5)hang(li,nearest(m.lines[li].c,[x,y,z]),1,x,y)}
 let worst=0,worstAt=-1,slide=0,looseUse=0;
 const per=new Float64Array(nl);
 const note=(li,Mo,N,cap)=>{const rel=N/(cap.n*FEND),u=Math.max(0,Mo/cap.m-rel);looseUse=Math.max(looseUse,Mo/cap.loose-rel);
  if(u>per[li])per[li]=u;if(u>worst){worst=u;worstAt=li}};
 for(let li=nl-1;li>=0;li--){          /* children come after parents, so walk backwards and pass loads down */
  const l=m.lines[li],c=l.c,a=load[li],n=c.P.length;
  if(l.sk.arch){
   const p=c.P[0],q=c.P[n-1],span=Math.hypot(q[0]-p[0],q[1]-p[1])||1,ex=(q[0]-p[0])/span,ey=(q[1]-p[1])/span,X=v=>(v[0]-p[0])*ex+(v[1]-p[1])*ey;
   let cr=0;for(let i=1;i<n;i++)if(c.P[i][2]>c.P[cr][2])cr=i;
   let total=0,mB=0,left=0,mL=0;const xc=X(c.P[cr]),yc=Math.max(1,c.P[cr][2]-p[2]);
   for(let i=0;i<n;i++){const w=a[i*4];if(!w)continue;const x=X([a[i*4+1]/w,a[i*4+2]/w]);total+=w;mB+=w*(span-x);if(i<=cr){left+=w;mL+=w*(xc-x)}}
   const VA=mB/span,H=Math.max(0,(VA*xc-mL)/yc);
   if(total)slide=Math.max(slide,H/(MUF*Math.max(1e-9,Math.min(VA,total-VA))));   /* the floor has no magnets: friction alone stops the feet spreading */
   let sw=0,sx=0;
   for(let i=0;i<n;i++){const w=a[i*4];if(w){sw+=w;sx+=w*X([a[i*4+1]/w,a[i*4+2]/w])}
    const x=X(c.P[i]),z=c.P[i][2]-p[2],Mo=(VA*x-H*z-(sw*x-sx))*W*1e-3,cap=capacity(l.rad(i)),t=c.Tn[i],th=t[0]*ex+t[1]*ey;
    const N=(H*th+(VA-sw)*t[2])*W;                       /* positive = squeeze */
    note(li,Math.abs(Mo),N,cap)}
  }else{
   let sw=0,sx=0,sy=0;
   for(let i=n-1;i>=0;i--){sw+=a[i*4];sx+=a[i*4+1];sy+=a[i*4+2];
    if(!sw||c.P[i][2]<=2.5){if(c.P[i][2]<=2.5){sw=sx=sy=0}continue}
    const q=c.P[i],t=c.Tn[i],cap=capacity(l.rad(i)),Mo=sw*W*Math.hypot(sx/sw-q[0],sy/sw-q[1])*1e-3,N=sw*W*t[2];   /* t up and weight beyond = squeeze */
    note(li,Mo,N,cap);
    const shear=sw*W*Math.sqrt(Math.max(0,1-t[2]*t[2])),grip=MUF*(cap.n*FEND+Math.max(0,N));slide=Math.max(slide,shear/grip)}
   if(l.sk.on!==undefined&&sw){const par=m.lines[l.sk.on];hang(l.sk.on,nearest(par.c,c.P[0]),sw,sx/sw,sy/sw)}
  }}
 /* tipping: the centre of mass must sit inside the box around everything touching the floor */
 let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
 for(let k=0;k<m.n;k++)if(m.pos[k*3+2]-Math.abs(m.dir0[k*3+2]+m.dir1[k*3+2])*L/4<=2){const x=m.pos[k*3],y=m.pos[k*3+1];x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)}
 const cx=tx/tw,cy=ty/tw,tips=!(cx>=x0&&cx<=x1&&cy>=y0&&cy<=y1);
 const bendOk=m.tight<=m.n*.01;
 return{worst,looseUse,worstAt,per,slide,tips,bendOk,mass:m.n*W/9.81,com:[cx,cy],ok:worst<=1&&slide<=1&&!tips&&bendOk}}

/* ---------- build schedule ----------
   The shape grows from the floor outward. Bots leave the pile through "lanes" side by side, walk along finished strands to a growing tip
   (distance dist + the gap from the pile) and snap on. Idle power drains every bot for the whole build. */
function timeline(m,opts){
 const o=Object.assign({lanes:8,gap:20},opts||{}),n=m.n,v=VMOVE*1e3;
 const order=Array.from({length:n},(_,i)=>i).sort((a,b)=>m.dist[a]-m.dist[b]||m.pos[a*3+2]-m.pos[b*3+2]);
 const dt=1.5*(L/v)/o.lanes,leave=new Float32Array(n),arrive=new Float32Array(n);
 let end=0,eMax=0,front=0;
 order.forEach((i,k)=>{leave[i]=k*dt;front=Math.max(front+(k?TSET/o.lanes:0),leave[i]+(m.dist[i]+o.gap)/v+TSET);arrive[i]=front;if(arrive[i]>end)end=arrive[i]});
 for(let i=0;i<n;i++){const e=PMOVE*(m.dist[i]+o.gap)/v+PIDLE*end;if(e>eMax)eMax=e}
 return{order:Int32Array.from(order),leave,arrive,time:end,eMax,battMax:eMax/EB,finishes:eMax<=USE*EB}}

/* ---------- the sculpture library: k scales the size. Add one with T.addForm(key,label,k=>[strokes]) ---------- */
const range=(n,f)=>Array.from({length:n},(_,i)=>f(i/(n-1),i));
const FORMS={};
const addForm=(key,label,fn)=>{FORMS[key]={n:label,f:fn};return key};
const sc=(k,pts)=>pts.map(p=>[p[0]*k,p[1]*k,p[2]*k]);
addForm('hand','Rising hand',k=>{
 const S=[stroke(sc(k,[[0,0,0],[0,0,22],[0,2,40]]),11*k,9*k)];
 /* fingers: root across the palm, then middle and tip */
 [[-9,-15,58,-17,70],[-4,-6,66,-7,86],[1,3,68,4,90],[6,12,62,14,80]].forEach(f=>S.push(stroke(sc(k,[[f[0],2,36],[f[1],2,f[2]],[f[3],6,f[4]]]),4.6*k,1.5*k,{on:0})));
 S.push(stroke(sc(k,[[6,2,18],[22,4,34],[27,9,52]]),5.5*k,1.8*k,{on:0}));return S});
addForm('tendrils','Tendrils',k=>{
 const S=[stroke(sc(k,[[0,0,0],[0,0,9],[0,0,18]]),18*k,14*k)];
 for(let j=0;j<5;j++)S.push(stroke(sc(k,range(9,t=>{const a=j*1.2566+t*2.2,r=7+17*Math.sin(t*1.9);return[Math.cos(a)*r,Math.sin(a)*r,12+50*t-8*t*t*t]})),7*k,1.2*k,{on:0}));return S});
addForm('wave','Breaking wave',k=>range(5,(u,j)=>{const y=(j-2)*14,h=1-.3*Math.abs(j-2)/2;
 return stroke(sc(k,[[-30,y,1],[-14,y,5],[-3,y,18*h],[3,y,33*h],[11,y,39*h],[18,y,35*h],[19,y,28*h]]),9.5*k,1.5*k)}));
addForm('arch','Flowing arch',k=>[-1,1].map(s=>stroke(sc(k,range(11,t=>{const a=Math.PI*t;return[-52*Math.cos(a),s*(15-11*Math.sin(a)),80*Math.sin(a)+1]})),7*k,7*k,{arch:true})));
addForm('twist','Twisted column',k=>range(3,(u,j)=>stroke(sc(k,range(21,t=>{const a=j*2.0944+t*5.2,r=9-4*t+(t>.8?(t-.8)*45:0);
 return[Math.cos(a)*r,Math.sin(a)*r,78*t]})),7.5*k,2*k)));
addForm('tree','Tree',k=>{const S=[stroke(sc(k,[[0,0,0],[2,0,22],[0,0,44]]),11*k,7*k)];
 for(let j=0;j<4;j++){const a=j*Math.PI/2+.4,c=Math.cos(a),s=Math.sin(a),i=S.length;
  S.push(stroke(sc(k,[[0,0,34+j*3],[14*c,14*s,52+j*3],[26*c,26*s,66+j*2]]),5.5*k,2.5*k,{on:0}));
  for(const d of[-.6,.6])S.push(stroke(sc(k,[[19*c,19*s,58+j*3],[(19*c+14*Math.cos(a+d)),(19*s+14*Math.sin(a+d)),74+j*2]]),2.8*k,1.2*k,{on:i}))}
 return S});

/* one call: place the bots, check the structure, schedule the build */
function sculpt(key,k,opts){const f=FORMS[key];if(!f)throw new Error('Unknown form '+key);
 const strokes=f.f(k||1),model=build(strokes);return{key,label:f.n,k:k||1,model,check:check(model),time:timeline(model,opts)}}

Object.assign(T,{PITCH,SLIDE,SIDEBUNDLE,stroke,build,check,timeline,capacity,FORMS,addForm,sculpt});
})();
