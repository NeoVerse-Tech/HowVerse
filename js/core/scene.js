/* One three.js renderer for the whole app. Pages never touch it directly: they use HV.G and HV.setTint. */
(function(){
const HV=window.HV=window.HV||{};

const G=HV.G={phase:'load',p:0,b:0,scroll:0,tint:new THREE.Color(0x5df2ff),want:new THREE.Color(0x5df2ff)};

/* page accent colour: tints the star field and the --a CSS variable */
HV.setTint=c=>{G.want.set(c);document.documentElement.style.setProperty('--a',c)};

const N=1600,cv=document.getElementById('gl');
let R=null;
try{
 R=new THREE.WebGLRenderer({canvas:cv,antialias:devicePixelRatio<2,alpha:false});
 R.setPixelRatio(Math.min(devicePixelRatio,1.75));R.setClearColor(0x05060d);
}catch(e){console.warn('WebGL unavailable, running without 3D')}

const S=new THREE.Scene(),C=new THREE.PerspectiveCamera(60,1,.3,700);C.position.z=9;
const spiral=new Float32Array(N*3),sphere=new Float32Array(N*3),field=new Float32Array(N*3),pos=new Float32Array(N*3);
for(let i=0;i<N;i++){
 const arm=i%3,r=Math.pow(Math.random(),.6)*14+.5,a=r*.55+arm*2.094+Math.random()*.4;
 spiral.set([Math.cos(a)*r,(Math.random()-.5)*1.2,Math.sin(a)*r],i*3);
 const u=Math.random()*6.283,v=Math.acos(2*Math.random()-1),sr=2.6;
 sphere.set([sr*Math.sin(v)*Math.cos(u),sr*Math.cos(v),sr*Math.sin(v)*Math.sin(u)],i*3);
 field.set([(Math.random()-.5)*50,(Math.random()-.5)*34,(Math.random()-.5)*40-6],i*3);
}
const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(pos,3));
const pm=new THREE.PointsMaterial({size:.09,color:0x5df2ff,transparent:true,opacity:.95,depthWrite:false,blending:THREE.AdditiveBlending});
const pts=new THREE.Points(pg,pm);S.add(pts);

const rig=new THREE.Group();S.add(rig);
const rings=[0,1,2].map(k=>{
 const m=new THREE.Mesh(new THREE.TorusGeometry(3.3+k*.5,.012,6,120),new THREE.MeshBasicMaterial({color:[0x5df2ff,0xff3df2,0xffb84d][k],transparent:true,opacity:.9}));
 m.rotation.set(k*1.05,k*.6,0);rig.add(m);return m});
const core=new THREE.Mesh(new THREE.IcosahedronGeometry(1.15,1),new THREE.MeshBasicMaterial({color:0xffffff,wireframe:true,transparent:true,opacity:.9}));rig.add(core);
const glow=new THREE.Mesh(new THREE.SphereGeometry(.7,16,16),new THREE.MeshBasicMaterial({color:0x5df2ff,transparent:true,opacity:.5,blending:THREE.AdditiveBlending}));rig.add(glow);

const camZ=()=>innerWidth<innerHeight?11:9;
HV.S=S;HV.C=C;HV.rig=rig;HV.camZ=camZ;
function fit(){if(!R)return;R.setSize(innerWidth,innerHeight,false);C.aspect=innerWidth/innerHeight;C.updateProjectionMatrix();C.position.z=camZ()}
addEventListener('resize',fit);fit();

const ease=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
let last=performance.now();

function frame(now){
 requestAnimationFrame(frame);
 if(!R)return;
 const dt=Math.min((now-last)/1000,.05);last=now;const t=now/1000;
 const a=pg.attributes.position.array;

 if(G.phase==='load'){
  /* galaxy spiral collapses into a sphere while the loader runs */
  const e=ease(Math.min(G.p,1)),spin=t*(.4+e*1.8);
  const cs=Math.cos(spin*(1-e)),sn=Math.sin(spin*(1-e));
  for(let i=0;i<N;i++){const k=i*3,x=spiral[k],z=spiral[k+2];
   const rx=x*cs-z*sn,rz=x*sn+z*cs;
   const w=Math.min(1,Math.max(0,e*1.6-(i/N)*.6));
   a[k]=rx+(sphere[k]-rx)*w;a[k+1]=spiral[k+1]+(sphere[k+1]-spiral[k+1])*w;a[k+2]=rz+(sphere[k+2]-rz)*w}
  rig.visible=true;rig.scale.setScalar(Math.max(.001,ease(Math.min(1,G.p*1.15))));
  glow.scale.setScalar(1+Math.sin(t*6)*.12+G.p);
  rings.forEach((r,k)=>{r.rotation.x+=dt*(1+k*.7)*(1+G.p*2);r.rotation.y+=dt*(.8-k*.3)*(1+G.p*2)});
  core.rotation.y+=dt*2;core.rotation.x+=dt;
  pts.rotation.y=t*.15*(1-e);

 }else if(G.phase==='burst'){
  /* sphere explodes outward into the star field */
  G.b=Math.min(1,G.b+dt/1.4);const e=ease(G.b);
  for(let i=0;i<N;i++){const k=i*3;
   a[k]=sphere[k]+(field[k]-sphere[k])*e;a[k+1]=sphere[k+1]+(field[k+1]-sphere[k+1])*e;a[k+2]=sphere[k+2]+(field[k+2]-sphere[k+2])*e}
  rig.scale.setScalar(1+G.b*9);
  rings.forEach(r=>{r.material.opacity=.9*(1-G.b);r.rotation.x+=dt*6});
  core.material.opacity=.9*(1-G.b);glow.material.opacity=.5*(1-G.b);
  C.position.z=camZ()-G.b*3;
  if(G.b>=1){G.phase='idle';rig.visible=false;C.position.z=camZ()}

 }else if(G.phase==='topic'){
  /* a topic page owns the camera and the scene */
  pts.rotation.y+=dt*.02;
  if(HV.topicTick)HV.topicTick(dt,t);

 }else{
  /* idle: slow drift, camera follows the swipe position */
  pts.rotation.y+=dt*.02;pts.rotation.x=Math.sin(t*.1)*.05;
  C.position.x+=((G.scroll*.6)-C.position.x)*Math.min(1,dt*3);
 }

 pg.attributes.position.needsUpdate=true;
 G.tint.lerp(G.want,Math.min(1,dt*3));pm.color.copy(G.tint);
 R.render(S,C);
}
requestAnimationFrame(frame);
})();
