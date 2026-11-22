/* Deployable tower · the 3D model, used by World, Launch and Fly. update(dt,time,o) with o={state,tab,explode,sel}.
   Each part from parts.js is one group of meshes, found by its id, so selecting a part lights it and dims the rest.
   The tower height follows state.h. In World, with nothing selected, it slowly retracts and redeploys on its own so you can watch it work.
   Heights are drawn at SC scene units per metre. Sway is exaggerated so it can be seen. */
(function(){
const T=window.HV.T.tower,D=T.DES,clamp=T.clamp;
const SC=.055;
const BASE=-D.Hmax*SC/2,NJ=D.N-1,SWAYX=10,EXP=.9,NS=44; /* scene units per m, ground level (tower centred on screen), sway exaggeration, pull-apart gap per stage, wind streaks */
const sm=x=>{x=clamp(x,0,1);return x*x*(3-2*x)};

T.create=function(THREE,grp){
 const root=new THREE.Group();root.position.z=-2;grp.add(root);
 const own=[],keep=o=>{own.push(o);return o};
 const parts={};                                              /* id -> {mats:[...]} */
 const mat=(id,color,op,extra)=>{
  const m=keep(new THREE.MeshLambertMaterial(Object.assign({color,transparent:true,opacity:op,side:THREE.DoubleSide},extra||{})));
  m.userData.op=op;(parts[id]=parts[id]||{mats:[]}).mats.push(m);return m;
 };
 const geo=g=>keep(g);
 const mesh=(g,m,parent,x,y,z)=>{const o=new THREE.Mesh(g,m);o.position.set(x||0,y||0,z||0);parent.add(o);return o};

 root.add(new THREE.AmbientLight(0xffffff,.7));
 const sun=new THREE.DirectionalLight(0xffffff,.9);sun.position.set(8,14,10);root.add(sun);

 /* ground: context, not a part. Slightly see-through so the anchors below it show. */
 const gm=keep(new THREE.MeshLambertMaterial({color:0x2a2f3a,transparent:true,opacity:.5,depthWrite:false}));
 const ground=mesh(geo(new THREE.CircleGeometry(7,56)),gm,root,0,BASE-.002,0);ground.rotation.x=-Math.PI/2;

 /* foundation: a wide slab under the base tube and anchor rods reaching down */
 const R=D.dia.map(d=>d/2*SC),H=D.Ls*SC;
 const fm=mat('foundation',0x8a8f99,1);
 mesh(geo(new THREE.CylinderGeometry(R[0]*1.4,R[0]*1.4,.3,40)),fm,root,0,BASE-.15,0);
 const rodG=geo(new THREE.CylinderGeometry(.028,.028,1.5,8));
 for(let k=0;k<10;k++){const a=k/10*Math.PI*2;mesh(rodG,fm,root,Math.cos(a)*R[0]*1.18,BASE-1.05,Math.sin(a)*R[0]*1.18)}

 /* one group per stage: tube, floors, skin and the pins that lock the next stage in */
 const sg=[],pinMats=[],pinExt=[],pins=[];
 const grayPin=new THREE.Color(0x7a808c),goldPin=new THREE.Color(0xffb84d);
 for(let i=0;i<D.N;i++){
  const g=new THREE.Group();root.add(g);sg.push(g);
  mesh(geo(new THREE.CylinderGeometry(R[i],R[i],H,32,1,true)),mat('stages',new THREE.Color().setHSL(.04,.62,.36+i*.05),.62),g);
  const fg=geo(new THREE.CylinderGeometry(R[i]*.96,R[i]*.96,.015,28)),flm=mat('floors',0x9fc3e8,.9);
  for(let k=0;k<5;k++)mesh(fg,flm,g,0,-H/2+(k+.5)/5*H,0);
  mesh(geo(new THREE.CylinderGeometry(R[i]*1.015,R[i]*1.015,H,24,5,true)),mat('skin',0xd5deea,.45,{wireframe:true}),g);
  if(i<NJ){
   const pm=mat('pins',0x7a808c,1);pinMats.push(pm);pinExt.push(1);
   const pg=geo(new THREE.BoxGeometry(.14,.07,.07));
   for(let k=0;k<4;k++){
    const a=k/4*Math.PI*2+.4,p=mesh(pg,pm,g,0,H/2-3*SC,0);p.rotation.y=-a;pins.push({p,j:i,a});
   }
  }
 }

 /* jacks: twelve drive units around the base ring. They glow with heat and while moving. */
 const jm=mat('jacks',0x9aa3b2,1),jg=geo(new THREE.BoxGeometry(.18,.5,.18));
 for(let k=0;k<D.drive.jacks;k++){const a=k/D.drive.jacks*Math.PI*2;const j=mesh(jg,jm,root,Math.cos(a)*(R[0]+.11),BASE+.25,Math.sin(a)*(R[0]+.11));j.rotation.y=-a}

 /* damper: a heavy sphere on a cable inside the top stage. Drawn larger than true size so it reads. */
 const top=sg[D.N-1],dpiv=new THREE.Group();dpiv.position.y=H/2-.1;top.add(dpiv);
 const dmm=mat('damper',0xd8a93a,1);
 mesh(geo(new THREE.CylinderGeometry(.008,.008,.9,6)),mat('damper',0xb8bcc6,1),dpiv,0,-.45,0);
 mesh(geo(new THREE.SphereGeometry(.2,20,14)),dmm,dpiv,0,-1.0,0);

 /* control: wind sensor mast on top, and a small hub beside the foundation */
 const cm=mat('control',0x5df2ff,1),cups=new THREE.Group();cups.position.y=H/2+.95;top.add(cups);
 mesh(geo(new THREE.CylinderGeometry(.016,.016,.95,8)),cm,top,0,H/2+.475,0);
 mesh(geo(new THREE.BoxGeometry(.55,.02,.02)),cm,cups);
 const sg2=geo(new THREE.SphereGeometry(.06,10,8));mesh(sg2,cm,cups,.275,0,0);mesh(sg2,cm,cups,-.275,0,0);
 mesh(geo(new THREE.BoxGeometry(.34,.26,.34)),cm,root,R[0]*1.9,BASE+.13,.3);

 /* wind streaks: thin bars that blow along +x, faster and denser with the wind */
 const wm=keep(new THREE.MeshBasicMaterial({color:0xbfe8ff,transparent:true,opacity:0,depthWrite:false})),wg=geo(new THREE.BoxGeometry(1.6,.012,.012));
 const streaks=[];
 for(let k=0;k<NS;k++){const m=mesh(wg,wm,root,0,0,0);streaks.push({m,x:(Math.random()-.5)*24,y:BASE+Math.random()*(D.Hmax*SC+3),z:(Math.random()-.5)*8,k:.7+Math.random()*.6})}

 let hd=D.Hmax,pAng=0,cupA=0,lk=NJ;
 const hl=[1,.62,.3];

 /* World demo: hold tall, retract, hold stowed, redeploy, in a loop of 30 s */
 const demoH=time=>{const p=(time%30)/30;return p<.25?D.Hmax:p<.5?D.Hmax+(D.Hmin-D.Hmax)*sm((p-.25)/.25):p<.7?D.Hmin:p<.95?D.Hmin+(D.Hmax-D.Hmin)*sm((p-.7)/.25):D.Hmax};

 return{
  update(dt,time,o){
   o=o||{};const s=o.state||{},tab=o.tab,ex=o.explode||0,sel=o.sel||null,V=s.V==null?8:s.V;
   dt=Math.min(dt,.1);

   /* height and pins */
   let target=s.h==null?D.Hmax:s.h,lockT=s.locked==null?NJ:s.locked;
   if(tab==='world'){
    target=(ex>.01||sel)?D.Hmax:demoH(time);
    lockT=Math.abs(target-hd)>1.5?0:NJ;
   }
   hd+=(target-hd)*Math.min(1,dt*(tab==='world'?2:12));
   lk+=(lockT-lk)*Math.min(1,dt*6);

   /* sway: a steady lean plus a slow swing at the tower's own frequency, exaggerated */
   const fr=T.freq(hd),amp=(s.sway||0)*SC*SWAYX,lean=amp*(.6+.4*Math.sin(time*Math.PI*2*fr));
   const p=(hd-D.Ls)/(D.N-1);
   for(let i=0;i<D.N;i++){
    const zc=i*p+D.Ls/2;
    sg[i].position.set(lean*Math.pow(zc/hd,2),BASE+zc*SC+i*ex*EXP,0);
   }

   /* pins slide in when locked, out when released */
   for(let j=0;j<NJ;j++){const t=clamp(lk-j,0,1);pinExt[j]+=(t-pinExt[j])*Math.min(1,dt*10);pinMats[j].color.lerpColors(grayPin,goldPin,pinExt[j])}
   pins.forEach(q=>{const e=pinExt[q.j],r=R[q.j]+.02+(1-e)*.22;q.p.position.x=Math.cos(q.a)*r;q.p.position.z=Math.sin(q.a)*r});

   /* damper swings against the sway; sensor cups spin with the wind */
   const on=s.damp!==false;
   pAng+=((on?Math.sin(time*Math.PI*2*fr+1.2)*Math.min(.5,.08+(s.sway||0)*.35):0)-pAng)*Math.min(1,dt*4);
   dpiv.rotation.z=pAng;dmm.color.setHex(on?0xd8a93a:0x77736a);
   cupA+=dt*(1+V*.5);cups.rotation.y=cupA;

   /* wind streaks */
   const vis=V<4?0:clamp(V/55,0,1)*.55;wm.opacity+=(vis-wm.opacity)*Math.min(1,dt*3);
   streaks.forEach(q=>{
    q.x+=V*SC*3*q.k*Math.pow(Math.max(q.y-BASE,2)/21,.16)*dt;if(q.x>13)q.x=-13;
    q.m.position.set(q.x,q.y,q.z);
   });

   /* selection: the chosen part glows, the rest fade. Heat and motion tint the jacks. */
   const heat=clamp(s.heat||0,0,1),mv=Math.abs(s.rate||0)>1e-4?1:0,pulse=.22+.12*Math.sin(time*5);
   for(const id in parts){
    const pt=parts[id],isSel=sel===id,fade=sel?(isSel?1:.15):1;
    let er=0,eg=0,eb=0;
    if(isSel){er=hl[0]*pulse;eg=hl[1]*pulse;eb=hl[2]*pulse}
    if(id==='jacks'){er+=heat*.9+mv*.12;eg+=mv*.08}
    pt.mats.forEach(m=>{
     m.opacity+=(m.userData.op*fade-m.opacity)*Math.min(1,dt*8);
     m.emissive.setRGB(er,eg,eb);
    });
   }
  },
  dispose(){
   grp.remove(root);
   own.forEach(x=>x.dispose&&x.dispose());
  }
 };
};
})();
