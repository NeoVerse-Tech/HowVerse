/* Fusion reactor · World tab: the live 3D tokamak (PROPOSED, ITER-class).
   Nine groups, ids matching parts.js: plasma, vessel, blanket, divertor, tf, cs, pf, heat, cryo.
   Sizes follow the published ITER layout: vessel 19.4 m across and 11.3 m tall, 18 D-shaped coils about 17 m tall,
   a 13 m solenoid, 29 m cryostat. Built in metres from the core.js numbers, then scaled once (S below).
   A wedge is cut away so you can see inside; the real machine is closed all the way round.
   Returns {update(dt,time,o), dispose(), explode(v), highlight(id), pick(raycaster), groups}.
   update uses the same signature as Spaceship: o = {state, tab, explode, sel}. */
(function(){
const T=(window.HV.T=window.HV.T||{}).fusion=window.HV.T.fusion||{};
const {PI,R,a,kappa,q95,ELM}=T;
const S=.3,TAU=PI*2,CUT=1.75,DELTA=.4;       /* model scale (raise to fill more of the screen), full turn, cut-away wedge (rad), D triangularity */
const NS=ELM.TF;                              /* 18 sectors, one per toroidal coil */

/* ---------- geometry helpers ---------- */
/* sweep a closed profile round the machine axis. prof(t) -> [radius, height]; angle phi runs phi0..phi1 */
function sweep(THREE,prof,phi0,phi1,nu,nv){
 const pos=[],idx=[];
 for(let i=0;i<=nu;i++){const ph=phi0+(phi1-phi0)*i/nu,c=Math.cos(ph),s=Math.sin(ph);
  for(let j=0;j<=nv;j++){const p=prof(TAU*j/nv);pos.push(p[0]*c,p[1],p[0]*s)}}
 const w=nv+1;
 for(let i=0;i<nu;i++)for(let j=0;j<nv;j++){const A=i*w+j,B=A+1,C=A+w,D=C+1;idx.push(A,C,B,B,C,D)}
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
 return g;
}
/* a closed loop in the XY plane, thickened into a rectangular bar (sharp edges, like a real coil case).
   pts: [x,y] pairs; w(p) = thickness in the plane, d(p) = depth along z */
function ribbon(THREE,pts,w,d){
 const N=pts.length,pos=[],cs=[];
 for(let i=0;i<N;i++){const p=pts[i],q=pts[(i+1)%N],o=pts[(i+N-1)%N];
  let tx=q[0]-o[0],ty=q[1]-o[1];const l=Math.hypot(tx,ty)||1;tx/=l;ty/=l;
  const nx=-ty,ny=tx,hw=w(p)/2,hd=d(p)/2;
  cs.push([[p[0]+nx*hw,p[1]+ny*hw,hd],[p[0]-nx*hw,p[1]-ny*hw,hd],[p[0]-nx*hw,p[1]-ny*hw,-hd],[p[0]+nx*hw,p[1]+ny*hw,-hd]])}
 for(let i=0;i<N;i++){const A=cs[i],B=cs[(i+1)%N];
  for(let k=0;k<4;k++){const k2=(k+1)%4;pos.push(...A[k],...A[k2],...B[k],...A[k2],...B[k2],...B[k])}}
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.computeVertexNormals();
 return g;
}
/* merge several boxes into one flat-shaded geometry. items: [boxGeometry, x, y, z, rotationAboutZ] */
function fuse(THREE,items){
 const pos=[];
 items.forEach(it=>{const g=it[0].toNonIndexed(),m=new THREE.Matrix4().makeRotationZ(it[4]||0);
  m.setPosition(new THREE.Vector3(it[1],it[2],it[3]));g.applyMatrix4(m);
  const A=g.attributes.position.array;for(let i=0;i<A.length;i++)pos.push(A[i]);g.dispose();it[0].dispose()});
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.computeVertexNormals();
 return g;
}
const dShape=(s,off)=>t=>[R+s*a*Math.cos(t+DELTA*Math.sin(t)),(off||0)+s*kappa*a*Math.sin(t)];   /* the D-shaped plasma cross-section */
const vesShape=t=>[6.45+3.25*Math.cos(t+.45*Math.sin(t)),5.65*Math.sin(t)];                      /* vacuum vessel: R 3.2 to 9.7 m, height 11.3 m */
const circ=(r,z,rad)=>t=>[r+rad*Math.cos(t),z+rad*Math.sin(t)];
const sp=(v,p)=>Math.sign(v)*Math.pow(Math.abs(v),p);

function create(THREE,root){
 const V3=THREE.Vector3,geos=[],mats=[];
 const G=g=>{geos.push(g);return g};
 const M=(type,o)=>{const m=new THREE[type](o);mats.push(m);return m};
 const std=(c,o)=>M('MeshStandardMaterial',Object.assign({color:c,roughness:.45,metalness:.55,side:THREE.DoubleSide},o||{}));

 const master=new THREE.Group(),spin=new THREE.Group();
 master.scale.setScalar(S);master.rotation.x=.5;master.add(spin);root.add(master);

 /* lights */
 const amb=new THREE.AmbientLight(0x8ea0c0,.75),sun=new THREE.DirectionalLight(0xffffff,1.1),glowL=new THREE.PointLight(0xffa050,0,16);
 sun.position.set(5,8,7);root.add(amb);root.add(sun);root.add(glowL);

 /* ---------- parts ---------- */
 const parts={},ORDER=['cryo','plasma','vessel','blanket','divertor','tf','cs','pf','heat'];
 const part=(id,ex)=>{const g=new THREE.Group();g.userData.part=id;parts[id]={id,g,ex:ex,kids:[],mats:[],pulse:[]};spin.add(g);return parts[id]};
 const tag=(id,o)=>{o.userData.part=id;o.userData.partId=id;o.userData.id=id;o.userData.hvPart=id};
 const put=(id,mesh,ex,base,mat)=>{const P=parts[id];tag(id,mesh);if(ex)mesh.userData.ex=ex;if(base){mesh.userData.base=base;mesh.position.copy(base)}
  P.g.add(mesh);P.kids.push(mesh);if(mat&&P.mats.indexOf(mat)<0)P.mats.push(mat);return mesh};
 /* a pivot turned to angle ph, holding one mesh at radius x: coils, ports, supports and cassettes all use it */
 const spoke=(id,geo,mat,ph,x,y,ex,ghost)=>{const piv=new THREE.Group(),m=new THREE.Mesh(geo,mat);piv.rotation.y=-ph;m.position.set(x,y,0);
  tag(id,m);if(ghost)m.userData.ghost=true;piv.add(m);return put(id,piv,ex,null,mat)};
 const ph0=CUT,ph1=TAU;                                   /* the wedge from 0 to CUT is left open */
 const rad=(ph,k,y)=>new V3(Math.cos(ph)*k,y||0,Math.sin(ph)*k);

 /* cryostat: the outer thermos, 29 m across and 29 m tall, faint, with ribs. Drawn first so everything shows through it */
 part('cryo',new V3(0,0,0));
 const mCry=std('#8fa0b8',{transparent:true,opacity:.06,metalness:.5,roughness:.6,emissive:'#6f86a8',emissiveIntensity:0,depthWrite:false});
 const mRib=std('#7d8aa0',{metalness:.6,roughness:.5,emissive:'#6f86a8',emissiveIntensity:0});
 const cryWall=new THREE.Mesh(G(new THREE.CylinderGeometry(14.65,14.65,29,72,1,true,PI/2-TAU,TAU-CUT)),mCry);
 const cryTop=new THREE.Mesh(G(new THREE.CircleGeometry(14.65,72,CUT,TAU-CUT)),mCry),cryBot=new THREE.Mesh(G(new THREE.CircleGeometry(14.65,72,CUT,TAU-CUT)),mCry);
 cryTop.rotation.x=cryBot.rotation.x=PI/2;cryTop.position.y=14.5;cryBot.position.y=-14.5;
 [cryWall,cryTop,cryBot].forEach(m=>{m.userData.ghost=true;put('cryo',m,null,null,mCry)});
 const ribG=G(new THREE.TorusGeometry(14.72,.3,6,72,TAU-CUT));
 [-10,0,10].forEach(y=>{const piv=new THREE.Group(),m=new THREE.Mesh(ribG,mRib);piv.rotation.y=-CUT;piv.position.y=y;m.rotation.x=PI/2;tag('cryo',m);piv.add(m);put('cryo',piv,null,null,mRib)});

 /* plasma: glowing D ring, hot core, field lines with moving markers */
 part('plasma',new V3(0,14,0));
 const mPl=M('MeshBasicMaterial',{color:'#ff9a3d',transparent:true,opacity:.4,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
 const mCore=M('MeshBasicMaterial',{color:'#ffe9b8',transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
 put('plasma',new THREE.Mesh(G(sweep(THREE,dShape(1,0),ph0,ph1,96,28)),mPl));
 put('plasma',new THREE.Mesh(G(sweep(THREE,dShape(.45,0),ph0,ph1,96,16)),mCore));
 /* field lines wind round the doughnut and round the cross-section: poloidal angle = q * toroidal angle */
 const LN=[[.62,0],[.62,PI/2],[.62,PI],[.62,3*PI/2],[.85,PI/4],[.85,PI*1.25]],NPT=36;
 const lineMat=M('LineBasicMaterial',{color:'#ffffff',transparent:true,opacity:.45});
 const dotMat=M('PointsMaterial',{color:'#ffffff',size:.075,sizeAttenuation:true,transparent:true,opacity:.95,depthWrite:false});
 const fpos=(s,t0,ph)=>{const t=q95*ph+t0;return[(R+s*a*Math.cos(t+DELTA*Math.sin(t)))*Math.cos(ph),s*kappa*a*Math.sin(t),(R+s*a*Math.cos(t+DELTA*Math.sin(t)))*Math.sin(ph)]};
 LN.forEach(L=>{
  const p=[];for(let i=0;i<=160;i++){const f=fpos(L[0],L[1],ph0+(ph1-ph0)*i/160);p.push(f[0],f[1],f[2])}
  const g=G(new THREE.BufferGeometry());g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
  put('plasma',new THREE.Line(g,lineMat));
 });
 const dotG=G(new THREE.BufferGeometry()),dotPos=new Float32Array(LN.length*NPT*3);
 dotG.setAttribute('position',new THREE.BufferAttribute(dotPos,3));
 const dots=new THREE.Points(dotG,dotMat);dots.frustumCulled=false;put('plasma',dots);
 parts.plasma.mats.push(mPl,mCore);

 /* vacuum vessel: pale steel D-ring, see-through, with its three rows of ports (18 equatorial, 18 upper, 9 lower) */
 part('vessel',new V3(0,0,0));
 const mVes=std('#9aa8bd',{transparent:true,opacity:.28,metalness:.7,roughness:.35,emissive:'#6f86a8',emissiveIntensity:0,depthWrite:false});
 const vesM=new THREE.Mesh(G(sweep(THREE,vesShape,ph0,ph1,72,40)),mVes);vesM.userData.ghost=true;put('vessel',vesM,null,null,mVes);
 const mPort=std('#8d9bb0',{metalness:.6,roughness:.5,emissive:'#6f86a8',emissiveIntensity:0});
 const B3=THREE.BoxGeometry;
 const portEq=G(fuse(THREE,[[new B3(4.9,2.4,1.7),0,0,0,0],[new B3(.35,3.1,2.4),2.55,0,0,0]]));
 const portUp=G(fuse(THREE,[[new B3(1.7,7.4,.7),0,0,0,0],[new B3(2.3,.3,1.2),0,3.85,0,0]]));
 const portLo=G(fuse(THREE,[[new B3(2.2,6.5,.9),0,0,0,0],[new B3(2.8,.3,1.5),0,-3.4,0,0]]));
 const HEATAT=[7,10,13];                                  /* sectors where a heating system fills the equatorial port */
 for(let i=0;i<NS;i++){const ph=TAU*i/NS;if(ph<CUT)continue;
  if(HEATAT.indexOf(i)<0)spoke('vessel',portEq,mPort,ph,11.65,0,rad(ph,3));
  spoke('vessel',portUp,mPort,ph,6.3,8.6,rad(ph,1.5,5));
  if(i%2===0)spoke('vessel',portLo,mPort,ph,6,-8.3,rad(ph,1.5,-5))}

 /* blanket: 18 sectors of flat copper-coloured panels with gaps between (about 18 panels round each sector) */
 part('blanket',new V3(0,7,0));
 const mBl=std('#c9803d',{flatShading:true,emissive:'#ff7a2a',emissiveIntensity:0,metalness:.4,roughness:.55});
 for(let i=0;i<NS;i++){const p0=Math.max(TAU*i/NS+.012,CUT),p1=TAU*(i+1)/NS-.012;if(p1<=p0)continue;
  put('blanket',new THREE.Mesh(G(sweep(THREE,dShape(1.14,0),p0,p1,2,18)),mBl),null,null,mBl)}

 /* divertor: 54 cassettes in a ring along the bottom. Each is a V of two inclined targets with a dome between them */
 part('divertor',new V3(0,-6.5,0));
 const mDv=std('#6b7385',{emissive:'#ff5a1a',emissiveIntensity:0,metalness:.8,roughness:.4});
 const nDv=54,zDv=-(kappa*a*1.14+.4);
 const casG=G(fuse(THREE,[[new B3(2.9,.3,.66),0,-.3,0,0],[new B3(.3,1.35,.62),-1.2,.35,0,.3],[new B3(.3,1.7,.62),.8,.45,0,-.4],[new B3(1.1,.28,.62),-.15,.55,0,0]]));
 for(let i=0;i<nDv;i++){const ph=TAU*(i+.5)/nDv;if(ph<CUT)continue;
  const c=new THREE.Group(),m=new THREE.Mesh(casG,mDv);c.rotation.y=-ph;m.position.set(R-.2,zDv,0);c.add(m);
  tag('divertor',m);tag('divertor',c);parts.divertor.g.add(c);parts.divertor.kids.push(c)}
 parts.divertor.mats.push(mDv);

 /* toroidal field coils: 18 D-shaped bars, flat inner leg, rounded outer arc, wedging together at the centre.
    Each stands on a gravity support, the column that carries the weight of the whole machine. */
 part('tf',new V3(0,0,0));
 const mTf=std('#3d8bff',{emissive:'#2b5dff',emissiveIntensity:.1,metalness:.6,roughness:.4});
 const xin=2.85,xout=11.1,xc=(xin+xout)/2,A=(xout-xin)/2,Bh=8.2,pts=[];
 for(let i=0;i<96;i++){const t=TAU*i/96,c=Math.cos(t),s=Math.sin(t);pts.push([xc+A*c,Bh*sp(s,c<0?.55:.85)])}
 const tfG=G(ribbon(THREE,pts,()=>.7,p=>.95+.55*Math.max(0,Math.min(1,(p[0]-xin)/(xout-xin)))));
 const supG=G(fuse(THREE,[[new B3(1.5,6.2,1.5),0,0,0,0],[new B3(2.6,.3,2.6),0,-3.15,0,0]]));
 for(let i=0;i<NS;i++){const ph=TAU*(i+.5)/NS;if(ph<CUT)continue;
  const m=new THREE.Mesh(tfG,mTf);m.rotation.y=-ph;put('tf',m,rad(ph,6),null,mTf);
  spoke('tf',supG,mTf,ph,xc,-11.3,rad(ph,6,-3))}

 /* central solenoid: six stacked modules in the hole of the doughnut, 13 m tall and about 4 m wide */
 part('cs',new V3(0,11,0));
 const mCs=std('#b18cff',{emissive:'#7a4dff',emissiveIntensity:.1,metalness:.6,roughness:.4}),mCs2=std('#9a73f0',{emissive:'#7a4dff',emissiveIntensity:.1,metalness:.6,roughness:.4});
 const csG=G(new THREE.CylinderGeometry(2,2,2,32)),h=2.0,gap=.2,tot=ELM.CS*h+(ELM.CS-1)*gap;
 for(let i=0;i<ELM.CS;i++){const y=-tot/2+h/2+i*(h+gap);
  put('cs',new THREE.Mesh(csG,i%2?mCs2:mCs),new V3(0,(i-(ELM.CS-1)/2)*1.6,0),new V3(0,y,0),i%2?mCs2:mCs)}

 /* poloidal field coils: six rings outside the toroidal coils, from 8 m to 25 m across (all closed except the wedge) */
 part('pf',new V3(0,0,0));
 const mPf=std('#5df2ff',{emissive:'#1fb8d0',emissiveIntensity:.1,metalness:.6,roughness:.4});
 [[4,9.1],[8.6,9.3],[12.3,3.4],[12.3,-3],[8.6,-9.3],[4,-9.1]].forEach(p=>{
  put('pf',new THREE.Mesh(G(sweep(THREE,circ(p[0],p[1],.5),ph0,ph1,64,10)),mPf),new V3(0,p[1]>0?7:-7,0),null,mPf)});

 /* heating: two particle beams and one radio-wave launcher, each filling an equatorial port between two coils */
 part('heat',new V3(0,0,0));
 const mNb=std('#7dff9a',{emissive:'#2bd05a',emissiveIntensity:.12,metalness:.5,roughness:.45}),mRf=std('#c7ffd3',{emissive:'#2bd05a',emissiveIntensity:.1,metalness:.5,roughness:.45});
 const nbG=G(new THREE.BoxGeometry(5.2,1.5,1.5)),rfG=G(new THREE.CylinderGeometry(.6,.6,4,16));
 [[TAU*7/NS,0],[TAU*10/NS,0],[TAU*13/NS,1]].forEach(L=>{
  const piv=new THREE.Group(),ph=L[0];piv.rotation.y=-ph;
  const m=L[1]?new THREE.Mesh(rfG,mRf):new THREE.Mesh(nbG,mNb);
  if(L[1])m.rotation.z=PI/2;m.position.set(11.9,0,0);tag('heat',m);piv.add(m);
  tag('heat',piv);piv.userData.ex=new V3(Math.cos(ph)*7,0,Math.sin(ph)*7);parts.heat.g.add(piv);parts.heat.kids.push(piv)});
 parts.heat.mats.push(mNb,mRf);

 /* ---------- behaviour ---------- */
 let ev=0,et=0,sel=null,time=0,st=null;
 const cl=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
 const num=(v,d)=>typeof v==='number'&&isFinite(v)?v:d;

 function explode(v){et=cl(num(v,0),0,1)}
 function highlight(id){sel=id&&parts[id]?id:null}
 /* a tap picks the first solid part under the finger. The faint shells (cryostat and vessel wall) only count when nothing solid is behind them */
 function pick(rc){
  const hit=rc.intersectObject(spin,true);let ghost=null;
  for(let i=0;i<hit.length;i++){const o=hit[i].object;if(o.isLine||o.isPoints)continue;const u=o.userData,id=u&&u.part;if(!id)continue;
   if(u.ghost){if(!ghost)ghost=id;continue}
   return id}
  return ghost;
 }
 function place(){
  ORDER.forEach(id=>{const P=parts[id];P.g.position.copy(P.ex).multiplyScalar(ev);
   P.kids.forEach(k=>{const u=k.userData;if(!u.ex&&!u.base)return;
    if(u.base)k.position.copy(u.base);else k.position.set(0,0,0);if(u.ex)k.position.addScaledVector(u.ex,ev)})});
 }

 /* same signature as Spaceship: update(dt, time, o), o = {state, tab, explode, sel}.
    Also accepts the old update(dt, state) form. */
 function update(dt,tm,o){
  if(tm&&typeof tm==='object'&&!o)o=tm;
  o=o||{};
  dt=cl(num(dt,.016),0,.1);time+=dt;
  const live=o.tab==='launch'||o.tab==='fly';
  st=live&&o.state&&typeof o.state==='object'?o.state:null;
  if('explode' in o)et=cl(num(o.explode,0),0,1);
  if('sel' in o)sel=o.sel&&parts[o.sel]?o.sel:null;
  const glow=st?cl(num(st.glow,1),0,1):1,tf=st?cl(num(st.tf,1),0,1):1,ip=st?cl(num(st.ip,1),0,1):1,hot=st?cl(num(st.th,1),0,1.2):1;
  ev+=(et-ev)*Math.min(1,dt*5);place();
  spin.rotation.y+=dt*.12;
  const pulse=.5+.5*Math.sin(time*5);
  /* plasma and field lines follow the machine state */
  mPl.opacity=.08+.34*glow+(sel==='plasma'?.25*pulse:0)+.03*Math.sin(time*9)*glow;
  mCore.opacity=.55*glow*(.85+.15*Math.sin(time*7));
  parts.plasma.g.visible=glow>.02||ip>.02||sel==='plasma';
  lineMat.opacity=.1+.4*ip;dotMat.opacity=.95*ip;
  glowL.intensity=3.5*glow*hot;
  /* moving markers along the twisted field lines */
  let k=0;const speed=.12;
  for(let l=0;l<LN.length;l++)for(let i=0;i<NPT;i++){
   const u=((i/NPT)+time*speed)%1,f=fpos(LN[l][0],LN[l][1],ph0+(ph1-ph0)*u);
   dotPos[k++]=f[0];dotPos[k++]=f[1];dotPos[k++]=f[2]}
  dotG.attributes.position.needsUpdate=true;
  /* magnets glow with field, hot walls with fusion power, selected part pulses */
  mTf.emissiveIntensity=.08+.4*tf+(sel==='tf'?.5*pulse:0);
  mPf.emissiveIntensity=.08+.3*tf+(sel==='pf'?.5*pulse:0);
  mCs.emissiveIntensity=mCs2.emissiveIntensity=.08+.3*ip+(sel==='cs'?.5*pulse:0);
  mBl.emissiveIntensity=.04+.35*cl(hot,0,1)*glow+(sel==='blanket'?.4*pulse:0);
  mDv.emissiveIntensity=.03+.3*cl(hot,0,1)*glow+(sel==='divertor'?.4*pulse:0);
  mVes.emissiveIntensity=mPort.emissiveIntensity=sel==='vessel'?.2+.4*pulse:0;
  mCry.opacity=.06+(sel==='cryo'?.12*pulse:0);mRib.emissiveIntensity=sel==='cryo'?.3+.4*pulse:0;
  mNb.emissiveIntensity=mRf.emissiveIntensity=.1+(st&&st.pa>0?.35*cl(st.pa,0,1):0)+(sel==='heat'?.5*pulse:0);
 }

 function dispose(){
  geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());
  [amb,sun,glowL,master].forEach(o=>root.remove(o));
 }

 place();
 const api={update,dispose,explode,highlight,pick,groups:parts,parts:parts,ids:ORDER.slice()};
 /* other names a topic page might use for the pull-apart slider and part selection */
 api.setExplode=api.setApart=api.setSpread=api.apart=api.set=explode;
 api.select=api.setPart=api.focus=highlight;
 api.getGroup=id=>parts[id]&&parts[id].g;
 api.object=master;
 return api;
}

Object.assign(T,{create});
})();
