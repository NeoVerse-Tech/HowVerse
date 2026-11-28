/* Octopus arms · 3D scene.
   The OA2 harness on an invisible wearer, at full size in metres (core.js numbers, nothing redrawn to look better). core.skeleton() solves the wearer's joints for the pose; the body is
   not drawn. A hip belt, shoulder straps and a collar wrap where it would be, and the harness rides the trunk frame: back plate, two rear cylinders with the four arm sockets, the isotope
   generator, power computer, motility controllers and spine transducers, and a small battery by each socket. Four arms of 28 titanium segments in 7 sections, each section bending on two axes.
   Each section carries two motors (armature) and four rods (elbow actuators), drawn as copper lines. Tips are a three-finger pincer or a tripod foot, swapped by core's tool field.
   The segments tint red as their section nears its working load. On the floor: the support outline from core.evaluate(), its 60% design zone, the feet, and the centre of mass with a plumb line.
   Launch and Fly pass o.state = {pose, arms:[{tip,dir,tool,load,hold,q} x4]} (core's contract). Optional: o.ev (an evaluate() result for that state, saves a second solve),
   o.props = [{type:'ladder'|'ledge'|'wall'|'crate', x,y,z, ry, ...}], o.bones (faint skeleton lines). Without o.state the figure idles in the Doc Ock stance.
   Fly 2.0: o.pilot (from pilot.js) places the wearer in a workshop: {x,z,h} frame, c view centre, map, crates, target, cam {yaw,tilt,zoom}.
   Selecting joints, elbows or armature, or pulling apart, turns the shells see-through, and a see-through part cannot be picked, so a tap lands on what is inside. */
(function(){
const T=(window.HV.T=window.HV.T||{}).octopus=window.HV.T.octopus||{};
const {PI,clamp,N,S,PER,L,RO0,RO1,RF,ro,SECMAX,SAFE,NARM,NQ,PADR,TOOLS,HARN,MOUNT,CAPW,OMEGA,SPM,MMOT0,secOf,evaluate,refState,POSES,REST,REFTIPS,REFDIR,BONES}=T;
const {add:vadd,sub:vsub,mul:vmul,cross:vcross,unit:vunit,rot}=T;
const P=L/N;                                              /* segment pitch, m. Not T.P: Launch puts its phase list there */
const BALLF=.5;                                           /* ball radius as share of ring radius, as in core.js */
const rj=i=>RO0+(RO1-RO0)*i/N;                            /* ring radius at joint i */
const AT=['#ff9d4a','#ffb35c','#ff8a3d','#ffc070'];       /* copper tones, one a little different per arm: its tendons and its drive modules */
const YAW={harness:2.9,cylinders:3.0,generator:3.1,computer:2.9,controllers:2.9,transducers:3.0,battery:3.3,sheath:1.6,joints:1.6,armature:1.6,elbows:1.6,pincer:.55,foot:.55},YAW0=2.7,YAWF=.55;
const MAXH=24,hn={};HARN.forEach(h=>{hn[h[0]]=h[2]});            /* harness part positions in the trunk frame, straight from core */
const mot=k=>Math.max(MMOT0,CAPW[k]*OMEGA/SPM);                  /* one section motor, kg, as core.js sizes it */
const shrink=(h,k)=>{let cx=0,cz=0;h.forEach(p=>{cx+=p[0];cz+=p[1]});cx/=h.length;cz/=h.length;return h.map(p=>[cx+(p[0]-cx)*k,cz+(p[1]-cz)*k])};   /* the same shrink core uses for the design zone */
const ZERO=()=>{};

function create(THREE,root){
 const geos=[],mats=[],parts={};
 const M=(c,o)=>{const m=new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.5,metalness:.4,emissive:c,emissiveIntensity:.08},o));m.userData.ei=m.emissiveIntensity;mats.push(m);return m};
 const LM=(c,o)=>{const m=new THREE.LineBasicMaterial(Object.assign({color:c,transparent:true,opacity:.9},o));m.userData.op=m.opacity;mats.push(m);return m};
 const part=id=>parts[id]={ms:[],ls:[],kids:[],pick:[]};
 const reg=(id,me)=>{const p=parts[id];me.userData.part=id;me.userData.hit=me.raycast;p.pick.push(me)};
 /* add a mesh; "out" is how far it travels, in metres, at full pull-apart */
 const add=(id,geo,m,parent,x,y,z,out)=>{geos.push(geo);const me=new THREE.Mesh(geo,m);me.position.set(x,y,z);parent.add(me);const p=parts[id];
  if(p.ms.indexOf(m)<0)p.ms.push(m);reg(id,me);if(out)p.kids.push({m:me,base:me.position.clone(),out:out});return me};
 const Y=new THREE.Vector3(0,1,0),Z=new THREE.Vector3(0,0,1),V=(x,y,z)=>new THREE.Vector3(x,y,z);
 const rodGeo=(a,b,r,seg)=>{const d=Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]),g=new THREE.CylinderGeometry(r,r,d,seg||8,1);return{g,d}};
 const orient=(me,a,b)=>{const d=V(b[0]-a[0],b[1]-a[1],b[2]-a[2]).normalize();me.quaternion.setFromUnitVectors(Y,d);me.position.set((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2)};
 const rod=(id,a,b,r,m,parent,out)=>{const q=rodGeo(a,b,r),me=add(id,q.g,m,parent,0,0,0,out);orient(me,a,b);if(out)parts[id].kids[parts[id].kids.length-1].base=me.position.clone();return me};

 /* ---------- fit: the figure is metres, the screen is not. topic.js frames Learn and World at the same distance as the microbot topic. The scale eases when the figure gets taller (hanging, climbing) ---------- */
 const asp=innerWidth/innerHeight,fitD=clamp(24/(1.155*asp),18,60),vh=1.155*fitD,vw=vh*asp;
 let ext=2.4;const UF=e=>Math.min(vw*.8/2.7,vh*.4/Math.max(2.1,e));
 const hero=new THREE.Group(),spin=new THREE.Group(),rig=new THREE.Group();
 hero.position.set(0,-ext*UF(ext)/2,-2);hero.scale.setScalar(UF(ext));hero.add(spin);spin.add(rig);root.add(hero);spin.rotation.y=YAW0;

 /* ---------- harness on the trunk frame. The wearer is invisible: only what is strapped to them shows ---------- */
 const trunk=new THREE.Group();trunk.matrixAutoUpdate=false;rig.add(trunk);
 ['harness','cylinders','generator','computer','transducers','controllers','battery'].forEach(part);
 const frameM=M('#56616e',{metalness:.7,roughness:.4,emissiveIntensity:.05}),fabM=M('#2a313a',{metalness:.1,roughness:.9,emissiveIntensity:.03}),mountM=M('#2e3640',{metalness:.75,roughness:.35,emissiveIntensity:.06}),ctlM=M('#5df2ff',{emissiveIntensity:.25,metalness:.5}),sockM=M('#ff7a2e',{emissiveIntensity:.95,metalness:.2,roughness:.4}),
  cylM=M('#3a4654',{metalness:.7,roughness:.35,emissiveIntensity:.06}),genM=M('#ff6a2a',{emissiveIntensity:.55,metalness:.4,roughness:.45}),finM=M('#7a3a1c',{metalness:.6,roughness:.5,emissiveIntensity:.1}),cptM=M('#7dd3ff',{emissiveIntensity:.3,metalness:.5}),batM=M('#7dff9a',{emissiveIntensity:.22,metalness:.3});
 const pl=hn.frame[2]-.04;                                        /* back plate depth */
 [1,-1].forEach(s=>{
  rod('harness',[s*.17,.04,pl],[s*.17,.52,pl],.009,frameM,trunk,V(s*.1,0,-.16));
  rod('harness',[s*.14,.50,pl],[s*.15,.535,0],.012,fabM,trunk,V(s*.12,.12,.1));        /* shoulder strap: plate, over the shoulder, down the chest, to the belt */
  rod('harness',[s*.15,.535,0],[s*.13,.36,.10],.012,fabM,trunk,V(s*.12,.05,.26));
  rod('harness',[s*.13,.36,.10],[s*.12,.02,.11],.012,fabM,trunk,V(s*.12,0,.3))});
 [.04,.28,.52].forEach(y=>rod('harness',[-.17,y,pl],[.17,y,pl],.008,frameM,trunk,V(0,0,-.16)));
 rod('harness',[-.13,.36,.10],[.13,.36,.10],.008,fabM,trunk,V(0,.05,.26));                 /* chest strap */
 add('harness',new THREE.BoxGeometry(.36,.5,.006),frameM,trunk,0,.28,pl-.005,V(0,0,-.2));
 for(let y=.06;y<.52;y+=.07)add('harness',new THREE.BoxGeometry(.1,.018,.02),mountM,trunk,0,y,pl-.016,V(0,0,-.24));   /* spine ribs */
 const bg=new THREE.TorusGeometry(.19,.022,10,32);bg.rotateX(PI/2);add('harness',bg,fabM,trunk,0,0,0,V(0,-.1,.25)).scale.set(1,1,.68);   /* hip belt */
 const kg=new THREE.TorusGeometry(.062,.012,8,24);kg.rotateX(PI/2);add('harness',kg,mountM,trunk,0,.535,0,V(0,.15,.05));                   /* collar */
 [['cylinderL',1],['cylinderR',-1]].forEach(c=>{const p=hn[c[0]];add('cylinders',new THREE.CylinderGeometry(.052,.052,.32,18),cylM,trunk,p[0],p[1],p[2],V(c[1]*.12,0,-.2))});
 MOUNT.forEach((m,a)=>{const s=(a%2)?-1:1;
  add('cylinders',new THREE.TorusGeometry(.058,.008,8,28),sockM,trunk,m[0],m[1],m[2]-.055,V(s*.1,0,-.3));                                 /* glowing socket ring */
  add('harness',new THREE.CylinderGeometry(.009,.009,.03,8),mountM,trunk,m[0]+s*.045,m[1],m[2]-.03,V(s*.2,0,-.3)).rotation.x=PI/2;        /* quarter-turn quick-disconnect screw */
  add('battery',new THREE.BoxGeometry(.05,.05,.045),batM,trunk,m[0]+s*.07,m[1],m[2]-.03,V(s*.25,0,-.25))});                               /* the arm's own battery */
 const gp=hn.generator,gg=new THREE.CylinderGeometry(.055,.055,.12,16);gg.rotateZ(PI/2);add('generator',gg,genM,trunk,gp[0],gp[1],gp[2],V(0,0,-.32));
 for(let i=-2;i<=2;i++){const fg=new THREE.CylinderGeometry(.067,.067,.01,16);fg.rotateZ(PI/2);add('generator',fg,finM,trunk,gp[0]+i*.027,gp[1],gp[2],V(0,0,-.32))}   /* cooling fins */
 const cp=hn.computer,kp=hn.controllers,tp=hn.transducers;
 add('computer',new THREE.BoxGeometry(.12,.055,.04),cptM,trunk,cp[0],cp[1],cp[2],V(0,.15,-.2));
 add('controllers',new THREE.BoxGeometry(.12,.05,.04),ctlM,trunk,kp[0],kp[1],kp[2],V(0,.08,-.2));
 [-1,1].forEach(s=>add('transducers',new THREE.BoxGeometry(.03,.03,.02),cptM,trunk,tp[0]+s*.03,tp[1],tp[2]-.04,V(s*.12,-.08,-.25)));
 rod('transducers',[tp[0],tp[1]+.015,tp[2]-.045],[0,.50,tp[2]-.045],.004,cptM,trunk,V(0,0,-.25));                                           /* spine lead */


 part('sheath');part('joints');
 const prof=[[0,-.5],[.6,-.5],[.66,-.47],[.8,-.42],[.97,-.38],[1,-.33],[1.07,-.28],[1.07,-.21],[.93,-.16],[.93,.16],[1.07,.21],[1.07,.28],[1,.33],[.97,.38],[.8,.42],[.66,.47],[.6,.5],[0,.5]].map(p=>new THREE.Vector2(p[0],p[1]));
 const sg=new THREE.LatheGeometry(prof,20),pp=sg.attributes.position,cc=new Float32Array(pp.count*3);
 for(let i=0;i<pp.count;i++){const y=Math.abs(pp.getY(i)),sh=y>.45?.42:y>.37?.78:y>.2?1:.66;cc[i*3]=cc[i*3+1]=cc[i*3+2]=sh}   /* dark necks, bright ribs, shaded groove */
 sg.setAttribute('color',new THREE.BufferAttribute(cc,3));geos.push(sg);
 const segM=new THREE.MeshStandardMaterial({color:0x7fb6c9,vertexColors:true,roughness:.38,metalness:.45,side:THREE.DoubleSide,transparent:true,emissive:0x2c6f86,emissiveIntensity:.1});segM.userData.ei=.1;mats.push(segM);parts.sheath.ms.push(segM);
 const shells=new THREE.InstancedMesh(sg,segM,NARM*N);shells.frustumCulled=false;rig.add(shells);reg('sheath',shells);
 const ballM=M('#1d2329',{metalness:.7,roughness:.35,transparent:true,emissiveIntensity:.05}),bsg=new THREE.SphereGeometry(1,14,10);geos.push(bsg);
 const balls=new THREE.InstancedMesh(bsg,ballM,NARM*(N-1));balls.frustumCulled=false;rig.add(balls);reg('joints',balls);parts.joints.ms.push(ballM);

 const hasCol=!!shells.setColorAt,tint=new THREE.Color(1,1,1);if(hasCol)for(let i=0;i<NARM*N;i++)shells.setColorAt(i,tint);   /* per-segment tint shows how near its section is to its working load */
 MOUNT.forEach((m,a)=>{const s=(a%2)?-1:1;add('joints',new THREE.SphereGeometry(.04,16,12),ballM,trunk,m[0],m[1],m[2]-.01,V(s*.15,0,-.35))});   /* the 2-axis swivel at each root */

 /* ---------- armature: two motors at the base of every section, one per bending axis. Sized from core's motor sizing. One instanced mesh ---------- */
 part('armature');part('elbows');
 const motM=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.45,metalness:.5,emissive:0x405060,emissiveIntensity:.18});motM.userData.ei=.18;mats.push(motM);parts.armature.ms.push(motM);
 const mg=new THREE.BoxGeometry(1,1,1);geos.push(mg);
 const motors=new THREE.InstancedMesh(mg,motM,NARM*S*2);motors.frustumCulled=false;rig.add(motors);reg('armature',motors);
 {const dc=new THREE.Color();for(let a=0;a<NARM;a++)for(let i=0;i<S*2;i++){dc.set(AT[a]);dc.multiplyScalar(.55);if(motors.setColorAt)motors.setColorAt(a*S*2+i,dc)}}
 /* ---------- elbow actuators: four rods per section at 90 degrees, one line each, rebuilt every frame from the section's own bend ---------- */
 const NV=S*4*PER*2,rAttr=[];
 const lineM=AT.map(c=>{const m=LM(c,{opacity:.6});parts.elbows.ls.push(m);return m});
 for(let a=0;a<NARM;a++){const g=new THREE.BufferGeometry(),pa=new THREE.BufferAttribute(new Float32Array(NV*3),3);g.setAttribute('position',pa);geos.push(g);rAttr.push(pa);
  const l=new THREE.LineSegments(g,lineM[a]);l.frustumCulled=false;l.raycast=ZERO;rig.add(l)}

 /* ---------- tips: a three-finger pincer and a tripod foot on every arm, in the tip's own frame (+y along the arm). core's tool field picks which shows ---------- */
 part('pincer');part('foot');
 const gripM=M('#2f3a45',{metalness:.7,roughness:.35,emissiveIntensity:.05}),clawM=M('#9db0bf',{metalness:.7,roughness:.3,emissiveIntensity:.06}),ledM=M('#ff3b2f',{emissiveIntensity:1,metalness:.1,roughness:.4}),
  footM=M('#3b4652',{metalness:.7,roughness:.35,emissiveIntensity:.05}),padM=M('#ffb35c',{emissiveIntensity:.35,metalness:.3,roughness:.6}),loadM=M('#ffb347',{emissiveIntensity:.15,roughness:.7});
 const tips=[],pinG=[],ftG=[],crates=[],fingers=[],clawC=[],cg=new THREE.BoxGeometry(1,1,1);geos.push(cg);
 for(let a=0;a<NARM;a++){const tip=new THREE.Group();rig.add(tip);tips.push(tip);clawC.push(.4);
  const pg=new THREE.Group();pg.position.y=-.14;tip.add(pg);pinG.push(pg);                                              /* fingers close around the tip point, which is where core puts the hold */
  add('pincer',new THREE.CylinderGeometry(.03,.02,.05,6),gripM,pg,0,.025,0,V(0,.1,0));                                  /* wrist collar */
  add('pincer',new THREE.CylinderGeometry(.052,.052,.03,3),gripM,pg,0,.065,0,V(0,.14,0)).rotation.y=PI/2;               /* palm: a triangular plate */
  const fs=[];
  for(let k=0;k<3;k++){const q=k*2*PI/3+PI/2,pv=new THREE.Group();pv.position.set(Math.cos(q)*.05,.07,Math.sin(q)*.05);pv.rotation.y=-q;pg.add(pv);
   parts.pincer.kids.push({m:pv,base:pv.position.clone(),out:V(Math.cos(q)*.07,.12,Math.sin(q)*.07)});
   const hinge=new THREE.Group();pv.add(hinge);
   add('pincer',new THREE.SphereGeometry(.012,10,8),gripM,hinge,0,0,0);
   add('pincer',new THREE.BoxGeometry(.02,.078,.018),clawM,hinge,0,.039,0);                                            /* upper finger */
   add('pincer',new THREE.SphereGeometry(.0065,8,6),ledM,hinge,.0105,.042,0);                                          /* red status lamp: the finger's force sensor */
   const dist=new THREE.Group();dist.position.set(0,.078,0);hinge.add(dist);
   add('pincer',new THREE.SphereGeometry(.0105,10,8),gripM,dist,0,0,0);
   add('pincer',new THREE.BoxGeometry(.015,.066,.014),clawM,dist,0,.033,0);                                            /* hooked finger */
   add('pincer',new THREE.ConeGeometry(.0075,.032,8),clawM,dist,0,.082,0);
   fs.push({h:hinge,d:dist})}
  fingers.push(fs);
  const fg2=new THREE.Group();tip.add(fg2);ftG.push(fg2);                                                              /* tripod foot: three toe pads on a circle of radius PADR in the tip plane, as core.js puts them */
  add('foot',new THREE.CylinderGeometry(.02,.03,.06,10),footM,fg2,0,-.11,0,V(0,-.16,0));
  add('foot',new THREE.SphereGeometry(.032,12,10),footM,fg2,0,-.06,0,V(0,-.1,0));
  for(let k=0;k<3;k++){const q=k*2*PI/3+PI/2,px=Math.cos(q)*PADR,pz=Math.sin(q)*PADR;
   rod('foot',[0,-.06,0],[px,0,pz],.009,footM,fg2,V(px*1.2,-.05,pz*1.2));
   add('foot',new THREE.CylinderGeometry(.02,.02,.012,12),padM,fg2,px,0,pz,V(px*1.2,0,pz*1.2))}
  const cr=new THREE.Mesh(cg,loadM);cr.visible=false;cr.raycast=ZERO;tip.add(cr);crates.push(cr)}

 /* ---------- floor: grid, support outline, 60% design zone, feet, steps, centre of mass with a plumb line, optional bones. Everything is in world metres ---------- */
 const grid=new THREE.GridHelper(6,24,0x2a6a7a,0x14323c);geos.push(grid.geometry);mats.push(grid.material);rig.add(grid);

 const poly=(c,o)=>{const g=new THREE.BufferGeometry(),pa=new THREE.BufferAttribute(new Float32Array(MAXH*3),3);g.setAttribute('position',pa);g.setDrawRange(0,0);geos.push(g);const l=new THREE.LineLoop(g,LM(c,o));l.frustumCulled=false;l.raycast=ZERO;rig.add(l);return{pa:pa,g:g,l:l}};
 const setPoly=(pl,pts,y)=>{const n=Math.min(pts.length,MAXH),a=pl.pa.array;for(let i=0;i<n;i++){a[i*3]=pts[i][0];a[i*3+1]=y;a[i*3+2]=pts[i][1]}pl.pa.needsUpdate=true;pl.g.setDrawRange(0,n);pl.l.visible=n>=3};
 const supp=poly(0x5df2ff,{opacity:.9}),zone=poly(0xffd24d,{opacity:.45});
 const comM=new THREE.MeshBasicMaterial({color:0x7dff9a,side:THREE.DoubleSide,transparent:true,opacity:.95});mats.push(comM);
 const rg=new THREE.RingGeometry(.02,.035,24);rg.rotateX(-PI/2);geos.push(rg);const com=new THREE.Mesh(rg,comM);com.position.y=.006;com.raycast=ZERO;rig.add(com);

 const pg2=new THREE.BufferGeometry();pg2.setAttribute('position',new THREE.BufferAttribute(new Float32Array(6),3));geos.push(pg2);
 const plumb=new THREE.Line(pg2,LM(0x7dff9a,{opacity:.4}));plumb.frustumCulled=false;plumb.raycast=ZERO;rig.add(plumb);
 const soleG=new THREE.BoxGeometry(1,1,1);geos.push(soleG);
 const soles=[0,1].map(()=>{const m=new THREE.MeshBasicMaterial({color:0x5df2ff,transparent:true,opacity:.55});mats.push(m);const me=new THREE.Mesh(soleG,m);me.raycast=ZERO;rig.add(me);return me});
 const stepM=new THREE.MeshStandardMaterial({color:0x5b6b78,roughness:.6,metalness:.3,transparent:true,opacity:.8});mats.push(stepM);
 const steps=[0,1].map(()=>{const me=new THREE.Mesh(soleG,stepM);me.raycast=ZERO;rig.add(me);return me});
 const bAttr=new THREE.BufferAttribute(new Float32Array(BONES.length*6),3),bgeo=new THREE.BufferGeometry();bgeo.setAttribute('position',bAttr);geos.push(bgeo);
 const bones=new THREE.LineSegments(bgeo,LM(0x9cc3e6,{opacity:.3}));bones.frustumCulled=false;bones.raycast=ZERO;bones.visible=false;rig.add(bones);

 /* ---------- props: ladder, ledge, wall, crate. Rebuilt only when o.props changes ---------- */
 const propG=new THREE.Group();rig.add(propG);let propSig='',propRes=[];
 const propM=new THREE.MeshStandardMaterial({color:0x5b6b78,roughness:.6,metalness:.3,emissive:0x1a2630,emissiveIntensity:.3});mats.push(propM);
 const wallM=new THREE.MeshStandardMaterial({color:0x7fa3b8,transparent:true,opacity:.35,roughness:.8,metalness:0,side:THREE.DoubleSide,depthWrite:false});mats.push(wallM);
 const buildProps=list=>{propRes.forEach(g=>g.dispose());propRes=[];while(propG.children.length)propG.remove(propG.children[0]);
  const bx=(w,h,d,x,y,z,m,par)=>{const g=new THREE.BoxGeometry(w,h,d);propRes.push(g);const me=new THREE.Mesh(g,m);me.position.set(x,y,z);me.raycast=ZERO;par.add(me);return me};
  list.forEach(p=>{const g=new THREE.Group();g.position.set(p.x||0,p.y||0,p.z||0);g.rotation.y=p.ry||0;propG.add(g);
   if(p.type==='ladder'){const h=p.h||3,w=p.w||.45,rg=new THREE.CylinderGeometry(.016,.016,w,8);rg.rotateZ(PI/2);propRes.push(rg);
    [-1,1].forEach(s=>bx(.04,h,.04,s*w/2,h/2,0,propM,g));for(let y=.3;y<h;y+=.28){const me=new THREE.Mesh(rg,propM);me.position.y=y;me.raycast=ZERO;g.add(me)}}
   else if(p.type==='ledge')bx(p.w||1.2,.06,p.d||.25,0,-.03,0,propM,g);                     /* top surface at p.y */
   else if(p.type==='wall')bx(p.w||3,p.h||3,.08,0,(p.h||3)/2,0,wallM,g);
   else if(p.type==='crate'){const s=p.s||.4;bx(s,s,s,0,s/2,0,propM,g)}})};


 /* ---------- Fly 2.0 workshop, world metres. Built on first use. The wearer's rig moves inside it and the view follows ---------- */
 const land=new THREE.Group();spin.add(land);land.add(rig);
 let shop=null;
 function buildShop(map){
  const g=new THREE.Group();land.add(g);
  const mat=(c,o)=>{const m=new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.65,metalness:.25,emissive:c,emissiveIntensity:.12},o));mats.push(m);return m};
  const mesh=(geo,m,x,y,z,par)=>{geos.push(geo);const me=new THREE.Mesh(geo,m);me.position.set(x,y,z);me.raycast=ZERO;(par||g).add(me);return me};
  const box=(w,h,d,x,y,z,m,par)=>mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z,par);
  const H=map.half+.5,floor=new THREE.GridHelper(2*H,Math.round(4*H),0x2a6a7a,0x14323c);geos.push(floor.geometry);mats.push(floor.material);g.add(floor);
  const edge=mat('#2f4a5a'),bench=mat('#4a5866'),wood=mat('#c98a45'),heavy=mat('#8a5a9a'),padM2=mat('#3ddc84',{emissiveIntensity:.5}),cab=mat('#ffd21f',{emissiveIntensity:.5}),mark=mat('#ffb35c',{emissiveIntensity:.9});
  [[0,H],[0,-H]].forEach(p=>box(2*H,.12,.06,p[0],.06,p[1],edge));[[H,0],[-H,0]].forEach(p=>box(.06,.12,2*H,p[0],.06,p[1],edge));
  map.benches.forEach(b=>{box(.6,.06,.45,b.x,b.h-.03,b.z,bench);[[-1,-1],[-1,1],[1,-1],[1,1]].forEach(s=>box(.05,b.h-.06,.05,b.x+s[0]*.25,(b.h-.06)/2,b.z+s[1]*.18,bench))});
  map.pads.forEach(p=>{const t=new THREE.TorusGeometry(.42,.025,8,40);t.rotateX(PI/2);mesh(t,padM2,p.x,.03,p.z)});
  const c=map.cable;box(.07,.05,c.z1-c.z0,c.x,.025,(c.z0+c.z1)/2,cab);
  const lad=new THREE.Group();lad.position.set(map.ladder.x,0,map.ladder.z);lad.rotation.y=map.ladder.h;g.add(lad);
  const S2=T.STAGE;[-1,1].forEach(s=>box(.04,3.6,.04,s*.225,1.8,S2.ZL,bench,lad));for(let y=.3;y<3.6;y+=.28)box(.45,.03,.03,0,y,S2.ZL,bench,lad);
  box(.7,.06,.3,0,S2.HY-.03,S2.ZLEDGE,bench,lad);
  const crates=map.crates.map((c,i)=>{const gp=new THREE.Group();g.add(gp);const s=i?.3:.24;box(s,s,s,0,s/2,0,i?heavy:wood,gp);return gp});
  const cone=new THREE.ConeGeometry(.09,.22,4);cone.rotateX(PI);const beacon=mesh(cone,mark,0,2.2,0);
  return{g,lad,crates,beacon}}

 /* ---------- backdrop and light ---------- */
 const wg=new THREE.SphereGeometry(180,24,16),wm=new THREE.MeshBasicMaterial({color:0x04080f,side:THREE.BackSide});geos.push(wg);mats.push(wm);root.add(new THREE.Mesh(wg,wm));
 const LT=[new THREE.AmbientLight(0xa0c0d0,.7),new THREE.DirectionalLight(0xffffff,1.05),new THREE.DirectionalLight(0xff8a3d,.7),new THREE.DirectionalLight(0x5df2ff,.35)];
 LT[1].position.set(6,10,8);LT[2].position.set(-8,-1,-10);LT[3].position.set(9,3,-6);LT.forEach(l=>root.add(l));

 const m4=new THREE.Matrix4();
 const setM=(arr,o,x,y,z,sx,sy,sz,px,py,pz)=>{arr[o]=x[0]*sx;arr[o+1]=x[1]*sx;arr[o+2]=x[2]*sx;arr[o+3]=0;arr[o+4]=y[0]*sy;arr[o+5]=y[1]*sy;arr[o+6]=y[2]*sy;arr[o+7]=0;arr[o+8]=z[0]*sz;arr[o+9]=z[1]*sz;arr[o+10]=z[2]*sz;arr[o+11]=0;arr[o+12]=px;arr[o+13]=py;arr[o+14]=pz;arr[o+15]=1};

 /* ---------- idle: the Doc Ock stance with a slow sway, or the joint demo. Used when Launch and Fly hand in no state ---------- */
 const idleSt=refState('stand');
 const idle=(time,sel,sw)=>{const s=idleSt;s.pose=Object.assign({},POSES.stand,{lean:1.2*Math.sin(time*.5)});
  for(let a=0;a<NARM;a++){const g=s.arms[a];
   if(sel==='joints'){g.tip=null;g.dir=null;const q=new Array(NQ).fill(0);q[0]=REST[a][0];q[1]=REST[a][1];for(let k=0;k<S;k++){const ph=time*.9+a*.5+k*.6;q[2+2*k]=.55*SECMAX*Math.sin(ph);q[3+2*k]=.55*SECMAX*Math.cos(ph*.8)}g.q=q}
   else{const r=REFTIPS[a],up=a<2;g.tip=[r[0]+(up?.1*Math.sin(time*.8+a*1.7)*sw:0),r[1]+(up?.12*Math.sin(time*.6+a*1.3)*sw:0),r[2]+(up?.08*Math.sin(time*.7+a)*sw:0)];g.dir=REFDIR[a]?REFDIR[a].slice():null}}
  return s};
 let ex=0,xray=0,ghosted=false,yaw=YAW0,zm=1,tl=0;
 const ghostSet=on=>{if(on===ghosted)return;ghosted=on;parts.sheath.pick.forEach(me=>{me.raycast=on?ZERO:me.userData.hit})};
 const I0=[1,0,0],I1=[0,1,0],I2=[0,0,1];
 return{
  update(dt,time,o){
   const solo=o.tab==='learn'||o.tab==='world',sel=o.sel,e=solo?(o.explode||0):0,k=Math.min(1,dt*5);
   ex+=(e-ex)*k;
   const inner=sel==='joints'||sel==='elbows'||sel==='armature';
   xray+=((inner||ex>.05?1:0)-xray)*k;
   segM.opacity=1-.82*xray;segM.depthWrite=xray<.05;ghostSet(xray>.5);
   const jx=sel==='joints'?.55:xray*.5;ballM.opacity=1-.6*jx;ballM.depthWrite=jx<.05;
   /* the whole body, from core: skeleton, four solved arms, contacts, balance */
   /* topic.js passes the whole readout from mission.at() / fly.view() as o.state: {state, ev, props, ...}. Unwrap it so evaluate() gets the plain {pose, arms} state */
   let pil=null;
   if(o.state&&o.state.state&&!o.state.arms){const w=o.state;if(w.pilotHost&&T.pilotBeat)T.pilotBeat(w.pilotHost);pil=w.pilot||null;
    o={tab:o.tab,sel:pil?null:o.sel,explode:pil?0:o.explode,bones:o.bones||w.bones,state:w.state,ev:o.ev||w.ev,props:pil?w.props:o.props||w.props}}
   const ev=o.ev||evaluate(o.state||idle(time,sel,1-ex)),sk=ev.sk,hp=sk.hip,sc=1+.55*ex;
   if(pil){ex=0;xray=0;segM.opacity=1;segM.depthWrite=true;ballM.opacity=1;ballM.depthWrite=true}
   /* pulses */
   for(const id in parts){const p=parts[id],pulse=sel===id?(id==='sheath'?.12:.35)*(1+Math.sin(time*6)):0;
    p.ms.forEach(m=>{m.emissiveIntensity=(m.userData.ei||0)+pulse});p.ls.forEach(m=>{m.opacity=clamp((m.userData.op||.9)*(xray>.05?1:.8)+(sel===id?.3*(1+Math.sin(time*6))/2:0),0,1)});
    p.kids.forEach(q=>q.m.position.set(q.base.x+q.out.x*ex,q.base.y+q.out.y*ex,q.base.z+q.out.z*ex))}
   /* trunk frame, and the view follows the wearer so walking moves the floor, not the figure */
   trunk.matrix.makeBasis(V(sk.tx[0],sk.tx[1],sk.tx[2]),V(sk.ty[0],sk.ty[1],sk.ty[2]),V(sk.tz[0],sk.tz[1],sk.tz[2])).setPosition(hp[0],hp[1],hp[2]);trunk.matrixWorldNeedsUpdate=true;
   grid.position.set(Math.round(hp[0]/.25)*.25,0,Math.round(hp[2]/.25)*.25);grid.visible=!pil;
   if(pil){if(!shop)shop=buildShop(pil.map);rig.position.set(pil.x,0,pil.z);rig.rotation.y=pil.h;land.position.set(-pil.c.x,0,-pil.c.z);
    shop.lad.visible=!pil.station;
    pil.crates.forEach((c,i)=>{const m=shop.crates[i];m.position.set(c.x,c.y,c.z);m.rotation.y=c.h});
    const t=pil.target;shop.beacon.visible=!!t&&!pil.station;if(t){shop.beacon.position.set(t.x,2.3+.1*Math.sin(time*4),t.z);shop.beacon.rotation.y=time*2}}
   else{rig.position.set(-hp[0],0,-hp[2]);rig.rotation.y=0;land.position.set(0,0,0)}
   if(shop)shop.g.visible=!!pil;
   /* arms */
   const shA=shells.instanceMatrix.array,blA=balls.instanceMatrix.array,mtA=motors.instanceMatrix.array;let top=Math.max(sk.J.head[1]+.15,2.1);
   for(let a=0;a<NARM;a++){const r=ev.arms[a],sh=r.sh,o0=sh.root.o,q=r.q;
    const st=p=>[o0[0]+(p[0]-o0[0])*sc,o0[1]+(p[1]-o0[1])*sc,o0[2]+(p[2]-o0[2])*sc];            /* pulling apart opens the gaps along the arm */
    for(let i=0;i<N;i++){const j0=sh.j[i],j1=sh.j[i+1],d=vunit(vsub(j1,j0)),up=Math.abs(d[1])>.95?[1,0,0]:[0,1,0],X=vunit(vcross(up,d)),Z=vcross(d,X),p=st(sh.c[i]),rr=ro(i);
     setM(shA,(a*N+i)*16,X,d,Z,rr,.82*P,rr,p[0],p[1],p[2]);                                       /* a vertebra is round, so only its axis matters */
     if(hasCol){const u=r.loads.sec[secOf(i)].util,w=clamp((u-.6)/.4,0,1);tint.setRGB(1,1-.65*w,1-.7*w);shells.setColorAt(a*N+i,tint)}}
    for(let i=1;i<N;i++){const p=st(sh.j[i]),rb=BALLF*rj(i);setM(blA,(a*(N-1)+i-1)*16,I0,I1,I2,rb,rb,rb,p[0],p[1],p[2])}
    for(let k2=0;k2<S;k2++){const b=sh.base[k2],p=st(b.p),s=.016*Math.cbrt(mot(k2)/MMOT0),rk=ro(k2*PER)+s*.6;
     setM(mtA,(a*S*2+k2*2)*16,b.x,b.y,b.z,s,s,s*1.6,p[0]+b.x[0]*rk,p[1]+b.x[1]*rk,p[2]+b.x[2]*rk);
     setM(mtA,(a*S*2+k2*2+1)*16,b.x,b.y,b.z,s,s,s*1.6,p[0]+b.y[0]*rk,p[1]+b.y[1]*rk,p[2]+b.y[2]*rk)}
    /* rods: through the section's own joints, offset round the axis in the section's bent frame (the same frame transport core.js uses) */
    const ra=rAttr[a].array;let n=0;
    for(let k2=0;k2<S;k2++){const F=sh.base[k2],bx=q[2+2*k2],by=q[3+2*k2],th=Math.hypot(bx,by),bend=th>1e-9,u=bend?vadd(vmul(F.x,bx/th),vmul(F.y,by/th)):F.x,ax=bend?vcross(F.z,u):null,prev=[null,null,null,null];
     for(let j=0;j<=PER;j++){const ts=th*j/PER,xj=bend?rot(F.x,ax,ts):F.x,yj=bend?rot(F.y,ax,ts):F.y,pj=st(sh.j[k2*PER+j]),rr=RF*rj(k2*PER+j);
      for(let c=0;c<4;c++){const g=c*PI/2+a*.4,cc=Math.cos(g)*rr,ss=Math.sin(g)*rr,pt=[pj[0]+cc*xj[0]+ss*yj[0],pj[1]+cc*xj[1]+ss*yj[1],pj[2]+cc*xj[2]+ss*yj[2]];
       if(prev[c]){ra[n++]=prev[c][0];ra[n++]=prev[c][1];ra[n++]=prev[c][2];ra[n++]=pt[0];ra[n++]=pt[1];ra[n++]=pt[2]}prev[c]=pt}}}
    rAttr[a].needsUpdate=true;
    /* tip: tool frame has +y along the arm. Pincer or foot, whichever core says; a load shows as a crate at 700 kg/m3 */
    const tp2=st(sh.p),F=sh.F,tip=tips[a];tip.position.set(tp2[0],tp2[1],tp2[2]);
    tip.quaternion.setFromRotationMatrix(m4.makeBasis(V(F.x[0],F.x[1],F.x[2]),V(F.z[0],F.z[1],F.z[2]),V(-F.y[0],-F.y[1],-F.y[2])));
    pinG[a].visible=r.tool==='pincer';ftG[a].visible=r.tool==='foot';
    const ld=Math.max(0,r.mtip-TOOLS[r.tool].m),cr=crates[a];cr.visible=!pil&&ld>.01&&r.tool==='pincer';if(cr.visible){const h=Math.cbrt(ld/700);cr.scale.set(h,h,h);cr.position.y=.03+h/2}
    const cl=(r.hold||ld>.01)?1:.4+.3*Math.sin(time*1.3+a*1.9);clawC[a]+=(cl-clawC[a])*Math.min(1,dt*8);fingers[a].forEach(f=>{f.h.rotation.z=-.5+.75*clawC[a];f.d.rotation.z=.5+.65*clawC[a]});
    for(let i=0;i<=N;i+=4)top=Math.max(top,sh.j[i][1])}
   shells.instanceMatrix.needsUpdate=true;balls.instanceMatrix.needsUpdate=true;motors.instanceMatrix.needsUpdate=true;if(hasCol&&shells.instanceColor)shells.instanceColor.needsUpdate=true;
   /* floor: support outline and design zone from core's hull, feet, steps, centre of mass */
   const bal=ev.balance,c=ev.com;
   setPoly(supp,bal.hull,.004);setPoly(zone,bal.hull.length>=3?shrink(bal.hull,SAFE):[],.004);
   com.position.set(c[0],.006,c[2]);comM.color.set(bal.tip||bal.mode==='fall'?0xff4d4d:bal.warn?0xffd24d:0x7dff9a);
   const pa=pg2.attributes.position.array;pa[0]=c[0];pa[1]=.006;pa[2]=c[2];pa[3]=c[0];pa[4]=c[1];pa[5]=c[2];pg2.attributes.position.needsUpdate=true;
   sk.feet.forEach((f,i)=>{const p=f.poly,cx=(p[0][0]+p[1][0])/2,cz=(p[0][1]+p[2][1])/2,so=soles[i];so.position.set(cx,f.sole+.012,cz);so.scale.set(p[1][0]-p[0][0],.024,p[2][1]-p[1][1]);so.material.color.set(f.contact?0x5df2ff:0x3a5666);
    const sup=(i===0?sk.pose.supL:sk.pose.supR)||0,sp=steps[i];sp.visible=sup>0;if(sup>0){sp.position.set(cx,sup/2,cz);sp.scale.set(.42,sup,.55)}});
   bones.visible=!!o.bones;if(o.bones){const ba=bAttr.array;BONES.forEach((b,i)=>{const p=sk.J[b[0]],q2=sk.J[b[1]];ba.set([p[0],p[1],p[2],q2[0],q2[1],q2[2]],i*6)});bAttr.needsUpdate=true}
   const sig=JSON.stringify(o.props||[]);if(sig!==propSig){propSig=sig;buildProps(o.props||[])}
   /* scale to fit: a hang or a climb is taller than the stance */
   top=Math.max(top+.1,2.1);ext+=(top-ext)*Math.min(1,dt*2);
   const cam=pil&&pil.cam;zm+=((cam?cam.zoom:1)-zm)*k;tl+=((cam?cam.tilt:0)-tl)*k;
   const U=UF(ext)*zm;hero.scale.setScalar(U);hero.position.y=-ext*U/2;hero.rotation.x=tl;
   /* turn the figure: slow spin in World with nothing selected, otherwise ease to a view of the selected part */
   if(pil){if(cam)yaw=cam.yaw}
   else if(o.tab==='world'&&!sel)yaw+=dt*.25;
   else{const tg=!solo?YAWF:(YAW[sel]===undefined?YAW0:YAW[sel]),d=((tg-yaw+PI)%(2*PI)+2*PI)%(2*PI)-PI;yaw+=d*Math.min(1,dt*3)}
   spin.rotation.y=yaw},
  /* tap: the part id under a THREE.Raycaster, or null. See-through shells cannot be hit, so the tap goes through to the ball joints and drives inside. A hidden tool cannot be hit either */
  pick(ray){const objs=[];for(const id in parts)parts[id].pick.forEach(me=>objs.push(me));const h=ray.intersectObjects(objs,false);
   for(const x of h){let ob=x.object,ok=true;while(ob){if(ob.visible===false){ok=false;break}ob=ob.parent}if(ok)return x.object.userData.part}return null},
  dispose(){[shells,balls,motors].forEach(i=>i.dispose&&i.dispose());geos.forEach(g=>g.dispose&&g.dispose());propRes.forEach(g=>g.dispose());mats.forEach(m=>m.dispose&&m.dispose())}
 };
}

Object.assign(T,{create});
})();
