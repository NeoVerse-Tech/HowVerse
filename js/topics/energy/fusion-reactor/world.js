/* Fusion reactor · World tab: the live 3D tokamak (PROPOSED, ITER-class).
   Eight groups, ids matching parts.js: plasma, vessel, blanket, divertor, tf, cs, pf, heat.
   Built in metres from the core.js numbers, then scaled down once. A wedge is cut away so you can
   see inside; the real machine is closed all the way round.
   Returns {update(dt,time,o), dispose(), explode(v), highlight(id), pick(raycaster), groups}.
   update uses the same signature as Spaceship: o = {state, tab, explode, sel}. */
(function(){
const T=(window.HV.T=window.HV.T||{}).fusion=window.HV.T.fusion||{};
const {PI,R,a,kappa,q95,ELM}=T;
const S=.28,TAU=PI*2,CUT=1.75,DELTA=.4;       /* model scale, full turn, cut-away wedge (rad), D triangularity */

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
const dShape=(s,off)=>t=>[R+s*a*Math.cos(t+DELTA*Math.sin(t)),(off||0)+s*kappa*a*Math.sin(t)];   /* the D-shaped plasma cross-section */
const circ=(r,z,rad)=>t=>[r+rad*Math.cos(t),z+rad*Math.sin(t)];

function create(THREE,root){
 const V3=THREE.Vector3,geos=[],mats=[];
 const G=g=>{geos.push(g);return g};
 const M=(type,o)=>{const m=new THREE[type](o);mats.push(m);return m};
 const std=(c,o)=>M('MeshStandardMaterial',Object.assign({color:c,roughness:.45,metalness:.55,side:THREE.DoubleSide},o||{}));

 const master=new THREE.Group(),spin=new THREE.Group();
 master.scale.setScalar(S);master.rotation.x=.5;master.add(spin);root.add(master);

 /* lights */
 const amb=new THREE.AmbientLight(0x8ea0c0,.75),sun=new THREE.DirectionalLight(0xffffff,1.1),glowL=new THREE.PointLight(0xffa050,0,14);
 sun.position.set(5,8,7);root.add(amb);root.add(sun);root.add(glowL);

 /* ---------- parts ---------- */
 const parts={},ORDER=['plasma','vessel','blanket','divertor','tf','cs','pf','heat'];
 const part=(id,ex)=>{const g=new THREE.Group();g.userData.part=id;parts[id]={id,g,ex:ex,kids:[],mats:[],pulse:[]};spin.add(g);return parts[id]};
 const tag=(id,o)=>{o.userData.part=id;o.userData.partId=id;o.userData.id=id;o.userData.hvPart=id};
 const put=(id,mesh,ex,base,mat)=>{const P=parts[id];tag(id,mesh);if(ex)mesh.userData.ex=ex;if(base){mesh.userData.base=base;mesh.position.copy(base)}
  P.g.add(mesh);P.kids.push(mesh);if(mat&&P.mats.indexOf(mat)<0)P.mats.push(mat);return mesh};
 const ph0=CUT,ph1=TAU;                                   /* the wedge from 0 to CUT is left open */

 /* plasma: glowing D ring, hot core, field lines with moving markers */
 part('plasma',new V3(0,14,0));
 const mPl=M('MeshBasicMaterial',{color:'#ff9a3d',transparent:true,opacity:.4,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
 const mCore=M('MeshBasicMaterial',{color:'#ffe9b8',transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
 put('plasma',new THREE.Mesh(G(sweep(THREE,dShape(1,0),ph0,ph1,96,28)),mPl));
 put('plasma',new THREE.Mesh(G(sweep(THREE,dShape(.45,0),ph0,ph1,96,16)),mCore));
 /* field lines wind round the doughnut and round the cross-section: poloidal angle = q * toroidal angle */
 const LN=[[.62,0],[.62,PI/2],[.62,PI],[.62,3*PI/2],[.85,PI/4],[.85,PI*1.25]],NPT=36,lines=[];
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

 /* vacuum vessel: pale steel, see-through */
 part('vessel',new V3(0,0,0));
 const mVes=std('#9aa8bd',{transparent:true,opacity:.28,metalness:.7,roughness:.35,emissive:'#6f86a8',emissiveIntensity:0,depthWrite:false});
 put('vessel',new THREE.Mesh(G(sweep(THREE,dShape(1.34,0),ph0,ph1,72,32)),mVes),null,null,mVes);

 /* blanket: copper-coloured panels (flat shading shows the facets) */
 part('blanket',new V3(0,7,0));
 const mBl=std('#c9803d',{flatShading:true,emissive:'#ff7a2a',emissiveIntensity:0,metalness:.4,roughness:.55});
 put('blanket',new THREE.Mesh(G(sweep(THREE,dShape(1.14,0),ph0,ph1,40,18)),mBl),null,null,mBl);

 /* divertor: tungsten cassettes in a ring along the bottom */
 part('divertor',new V3(0,-6.5,0));
 const mDv=std('#6b7385',{emissive:'#ff5a1a',emissiveIntensity:0,metalness:.8,roughness:.4});
 const nDv=54,boxG=G(new THREE.BoxGeometry(2.6,.55,.62)),zDv=-(kappa*a*1.14+.1);
 for(let i=0;i<nDv;i++){const ph=TAU*(i+.5)/nDv;if(ph<CUT)continue;
  const b=new THREE.Mesh(boxG,mDv),c=new THREE.Group();c.rotation.y=-ph;b.position.set(R-.2,zDv,0);c.add(b);
  tag('divertor',b);tag('divertor',c);parts.divertor.g.add(c);parts.divertor.kids.push(c)}
 parts.divertor.mats.push(mDv);

 /* toroidal field coils: 18 D-shaped loops, those in the cut-away left out */
 part('tf',new V3(0,0,0));
 const mTf=std('#3d8bff',{emissive:'#2b5dff',emissiveIntensity:.1,metalness:.6,roughness:.4});
 const xin=2.9,xout=10.6,xc=(xin+xout)/2,A=(xout-xin)/2,B=7.4,pts=[];
 for(let i=0;i<48;i++){const t=TAU*i/48,c=Math.cos(t),s=Math.sin(t);
  /* squarish D: flat inner leg, rounded outer arc */
  const e=c<0?4:2.4;pts.push(new V3(xc+A*Math.sign(c)*Math.pow(Math.abs(c),2/e),B*Math.sign(s)*Math.pow(Math.abs(s),2/3),0))}
 const tfG=G(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts,true),72,.5,8,true));
 for(let i=0;i<ELM.TF;i++){const ph=TAU*(i+.5)/ELM.TF;if(ph<CUT)continue;
  const m=new THREE.Mesh(tfG,mTf);m.rotation.y=-ph;put('tf',m,new V3(Math.cos(ph)*6,0,Math.sin(ph)*6),null,mTf)}

 /* central solenoid: six stacked modules in the hole of the doughnut, 13 m tall */
 part('cs',new V3(0,11,0));
 const mCs=std('#b18cff',{emissive:'#7a4dff',emissiveIntensity:.1,metalness:.6,roughness:.4}),mCs2=std('#9a73f0',{emissive:'#7a4dff',emissiveIntensity:.1,metalness:.6,roughness:.4});
 const csG=G(new THREE.CylinderGeometry(1.15,1.15,2,28)),h=2.0,gap=.2,tot=ELM.CS*h+(ELM.CS-1)*gap;
 for(let i=0;i<ELM.CS;i++){const y=-tot/2+h/2+i*(h+gap);
  put('cs',new THREE.Mesh(csG,i%2?mCs2:mCs),new V3(0,(i-(ELM.CS-1)/2)*1.6,0),new V3(0,y,0),i%2?mCs2:mCs)}

 /* poloidal field coils: six rings outside the toroidal coils (all closed except the wedge) */
 part('pf',new V3(0,0,0));
 const mPf=std('#5df2ff',{emissive:'#1fb8d0',emissiveIntensity:.1,metalness:.6,roughness:.4});
 [[4.1,8.7],[9.6,7.9],[11.9,3.2],[11.9,-3.2],[9.6,-7.9],[4.1,-8.9]].forEach(p=>{
  put('pf',new THREE.Mesh(G(sweep(THREE,circ(p[0],p[1],.5),ph0,ph1,64,10)),mPf),new V3(0,p[1]>0?7:-7,0),null,mPf)});

 /* heating: two particle beams and one radio-wave launcher, each sticking out between two coils */
 part('heat',new V3(0,0,0));
 const mNb=std('#7dff9a',{emissive:'#2bd05a',emissiveIntensity:.12,metalness:.5,roughness:.45}),mRf=std('#c7ffd3',{emissive:'#2bd05a',emissiveIntensity:.1,metalness:.5,roughness:.45});
 const nbG=G(new THREE.BoxGeometry(5.2,1.5,1.5)),rfG=G(new THREE.CylinderGeometry(.6,.6,4,16));
 [[TAU*7/18,0],[TAU*10/18,0],[TAU*13/18,1]].forEach(L=>{
  const piv=new THREE.Group(),ph=L[0];piv.rotation.y=-ph;
  const m=L[1]?new THREE.Mesh(rfG,mRf):new THREE.Mesh(nbG,mNb);
  if(L[1])m.rotation.z=PI/2;m.position.set(L[1]?11.4:11.7,0,0);tag('heat',m);piv.add(m);
  tag('heat',piv);piv.userData.ex=new V3(Math.cos(ph)*7,0,Math.sin(ph)*7);parts.heat.g.add(piv);parts.heat.kids.push(piv)});
 parts.heat.mats.push(mNb,mRf);

 /* ---------- behaviour ---------- */
 let ev=0,et=0,sel=null,time=0,st=null;
 const cl=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
 const num=(v,d)=>typeof v==='number'&&isFinite(v)?v:d;

 function explode(v){et=cl(num(v,0),0,1)}
 function highlight(id){sel=id&&parts[id]?id:null}
 function pick(rc){
  const hit=rc.intersectObject(spin,true);
  for(let i=0;i<hit.length;i++){const o=hit[i].object;if(o.isLine||o.isPoints)continue;const id=o.userData&&o.userData.part;if(id)return id}
  return null;
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
  mVes.emissiveIntensity=sel==='vessel'?.2+.4*pulse:0;
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
