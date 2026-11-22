/* Graphene · the 3D model, used by World, Launch and Fly. update(dt,time,o) with o={state,tab,explode,sel}.
   Each part from parts.js is a group of meshes found by its id, so selecting a part lights it and dims the rest.
   Scale: 1 scene unit = 100 nm, so the 1 µm drum has a radius of 5 units and the tip is drawn to true size.
   The honeycomb bonds are drawn 240 times too large and the cantilever bend is exaggerated 2.5 times. Both are stated in the Learn tab.
   In World and Learn, with nothing selected, the tip makes a gentle push and retreats on its own and never breaks the sheet. */
(function(){
const T=window.HV.T.graphene,D=T.DES,clamp=T.clamp;
const A=5,SC=.01;                                   /* drum radius in scene units, scene units per nm */
const BOND=.34,NR=26,NA=72,BEND=2.5,CH=2.5,TOPY=11,LY=8,BX0=-.6,BX1=9.2;
const sm=x=>{x=clamp(x,0,1);return x*x*(3-2*x)};
const wOf=(r,dn,Rt)=>{if(dn<=0)return 0;const rr=Math.max(r,Rt);return dn*Math.log(A/rr)/Math.log(A/Rt)};   /* depth of the sheet at radius r, for a centre depth dn */
const ZM100=T.zFor(100e-9),FROZ=T.evalDepth(70e-9,D.Rs);

/* the World/Learn demo: park, approach, push to 100 nm, retreat. It stops well short of the breaking depth. */
const demo=time=>{
 const p=(time%24)/24,Zc=D.Zc;let Z;
 if(p<.08)Z=0;else if(p<.2)Z=Zc*sm((p-.08)/.12);else if(p<.62)Z=Zc+(ZM100-Zc)*sm((p-.2)/.42);
 else if(p<.7)Z=ZM100;else if(p<.92)Z=ZM100*(1-sm((p-.7)/.22));else Z=0;
 return T.evalZ(Z,D.Rs,false);
};

T.create=function(THREE,grp){
 const root=new THREE.Group();root.position.set(-1.6,-4.4,-2);grp.add(root);
 const own=[],keep=o=>{own.push(o);return o};
 const parts={};                                              /* id -> {mats:[...]} */
 const reg=(id,m,op,vc)=>{keep(m);m.transparent=true;m.opacity=op;m.userData.op=op;m.userData.vc=!!vc;(parts[id]=parts[id]||{mats:[]}).mats.push(m);return m};
 const lam=(id,color,op,extra)=>reg(id,new THREE.MeshLambertMaterial(Object.assign({color,side:THREE.DoubleSide},extra||{})),op);
 const bas=(id,color,op)=>reg(id,new THREE.MeshBasicMaterial({color}),op);
 const geo=g=>keep(g);
 const mesh=(g,m,parent,x,y,z)=>{const o=new THREE.Mesh(g,m);o.position.set(x||0,y||0,z||0);parent.add(o);return o};
 const seg=(m,ax,ay,bx,by)=>{const dx=bx-ax,dy=by-ay,L=Math.hypot(dx,dy)||1e-6;m.position.set((ax+bx)/2,(ay+by)/2,0);m.rotation.z=Math.atan2(-dx,dy);m.scale.set(1,L,1)};

 root.add(new THREE.AmbientLight(0xffffff,.75));
 const sun=new THREE.DirectionalLight(0xffffff,.9);sun.position.set(8,14,10);root.add(sun);

 /* chip: a slab with a round well, and the floor of the well */
 const chipG=new THREE.Group();root.add(chipG);
 const cm=lam('substrate',0x7a8394,1),fm=lam('substrate',0x3b4150,1);
 const sh=new THREE.Shape();sh.moveTo(-7.5,-7.5);sh.lineTo(7.5,-7.5);sh.lineTo(7.5,7.5);sh.lineTo(-7.5,7.5);sh.lineTo(-7.5,-7.5);
 const hole=new THREE.Path();hole.absarc(0,0,A,0,Math.PI*2,true);sh.holes.push(hole);
 const slab=mesh(geo(new THREE.ExtrudeGeometry(sh,{depth:CH,bevelEnabled:false,curveSegments:56})),cm,chipG);
 slab.rotation.x=-Math.PI/2;slab.position.y=-CH;
 const floor=mesh(geo(new THREE.CircleGeometry(A,56)),fm,chipG,0,-CH+.01,0);floor.rotation.x=-Math.PI/2;

 /* the sheet: a polar grid, denser near the centre where the tip pushes */
 const NV=1+NR*NA,sPos=new Float32Array(NV*3),sR=new Float32Array(NV),sT=new Float32Array(NV),idx=[];
 for(let k=1;k<=NR;k++){const r=A*Math.pow(k/NR,1.7);for(let j=0;j<NA;j++){const v=1+(k-1)*NA+j;sR[v]=r;sT[v]=j/NA*Math.PI*2}}
 for(let j=0;j<NA;j++)idx.push(0,1+j,1+(j+1)%NA);
 for(let k=1;k<NR;k++)for(let j=0;j<NA;j++){
  const a=1+(k-1)*NA+j,b=1+(k-1)*NA+(j+1)%NA,c=1+k*NA+j,d=1+k*NA+(j+1)%NA;
  idx.push(a,c,b,b,c,d);
 }
 const sg=keep(new THREE.BufferGeometry());
 sg.setAttribute('position',new THREE.BufferAttribute(sPos,3));sg.setIndex(idx);
 const sheet=mesh(sg,lam('membrane',0x5fd0ff,.5),root);sheet.frustumCulled=false;

 /* the lattice: hexagons of bonds, kept inside the drum */
 const key=new Map(),atX=[],atZ=[],atR=[],bA=[],bB=[],eset=new Set(),LIM=A-.06;
 const getAtom=(x,z)=>{const k=Math.round(x*500)+','+Math.round(z*500);let i=key.get(k);if(i==null){i=atX.length;key.set(k,i);atX.push(x);atZ.push(z);atR.push(Math.hypot(x,z))}return i};
 for(let j=-26;j<=26;j++)for(let i=-26;i<=26;i++){
  const cx=Math.sqrt(3)*BOND*(i+j/2),cz=1.5*BOND*j;
  if(Math.hypot(cx,cz)>A+BOND)continue;
  const v=[];for(let k=0;k<6;k++){const an=Math.PI/6+k*Math.PI/3;v.push([cx+BOND*Math.cos(an),cz+BOND*Math.sin(an)])}
  for(let k=0;k<6;k++){
   const p=v[k],q=v[(k+1)%6];
   if(Math.hypot(p[0],p[1])>LIM||Math.hypot(q[0],q[1])>LIM)continue;
   const a=getAtom(p[0],p[1]),b=getAtom(q[0],q[1]),ek=a<b?a+'-'+b:b+'-'+a;
   if(eset.has(ek))continue;eset.add(ek);bA.push(a);bB.push(b);
  }
 }
 const na=atX.length,nb=bA.length;
 const pPos=new Float32Array(na*3),pCol=new Float32Array(na*3),lPos=new Float32Array(nb*6),lCol=new Float32Array(nb*6),hid=new Uint8Array(na);
 const pg=keep(new THREE.BufferGeometry());pg.setAttribute('position',new THREE.BufferAttribute(pPos,3));pg.setAttribute('color',new THREE.BufferAttribute(pCol,3));
 const lg=keep(new THREE.BufferGeometry());lg.setAttribute('position',new THREE.BufferAttribute(lPos,3));lg.setAttribute('color',new THREE.BufferAttribute(lCol,3));
 const lm=reg('lattice',new THREE.LineBasicMaterial({color:0xffffff,vertexColors:true}),.95,true);
 const pm=reg('lattice',new THREE.PointsMaterial({color:0xffffff,size:.17,vertexColors:true,sizeAttenuation:true,depthWrite:false}),1,true);
 pm.userData.sz=.17;
 const lines=new THREE.LineSegments(lg,lm),pts=new THREE.Points(pg,pm);lines.frustumCulled=false;pts.frustumCulled=false;root.add(lines);root.add(pts);

 /* defects: four marked atoms, drawn larger than real */
 const dm=lam('defects',0xff5d7a,1),dg=geo(new THREE.OctahedronGeometry(.16)),defs=[];
 [[.7,3.2],[2.3,2.4],[3.9,3.9],[5.4,2.8]].forEach(t=>{
  let best=0,bd=1e9;
  for(let i=0;i<na;i++){const d=Math.hypot(atX[i]-Math.cos(t[0])*t[1],atZ[i]-Math.sin(t[0])*t[1]);if(d<bd){bd=d;best=i}}
  defs.push({m:mesh(dg,dm,root),i:best});
 });

 /* tip: sharp and blunt, each a sphere of true radius under a cone; the apex is at the group's origin */
 const tipG=new THREE.Group();root.add(tipG);const tm=lam('tip',0xcfeaff,1);
 const mkTip=Rs=>{const g=new THREE.Group();tipG.add(g);mesh(geo(new THREE.SphereGeometry(Rs,20,14)),tm,g,0,Rs,0);mesh(geo(new THREE.CylinderGeometry(.5,Rs*.95,1.6,24)),tm,g,0,Rs+.8,0);return g};
 const tipS=mkTip(D.Rs*1e9*SC),tipB=mkTip(D.Rb*1e9*SC);

 /* cantilever beam and holder, piezo stack, laser and detector */
 const cantM=lam('cantilever',0xc9ced8,1),pzM=lam('piezo',0xffe14d,1),lsM=lam('laser',0xff6a6a,1),bmM=bas('laser',0xff5050,.9);
 const beam=mesh(geo(new THREE.BoxGeometry(1,.14,1.3)),cantM,root),holder=mesh(geo(new THREE.BoxGeometry(1.5,1.1,1.8)),cantM,root,(BX1+10.7)/2,0,0);
 const stack=mesh(geo(new THREE.BoxGeometry(.9,1,.9)),pzM,root),plate=mesh(geo(new THREE.BoxGeometry(2.6,.4,2)),pzM,root,(BX1+10.7)/2,TOPY+.2,0);
 const lasr=mesh(geo(new THREE.BoxGeometry(.8,.5,.6)),lsM,root,3,LY,0),diode=mesh(geo(new THREE.BoxGeometry(.8,.5,.6)),lsM,root,-1,LY,0);
 const bg=geo(new THREE.CylinderGeometry(.03,.03,1,6)),b1=mesh(bg,bmM,root),b2=mesh(bg,bmM,root);

 let hd=0,tear=0,apexY=D.Zc*1e9*SC,tipHold=false;

 return{
  update(dt,time,o){
   o=o||{};dt=Math.min(dt,.1);
   const tab=o.tab,ex=o.explode||0,sel=o.sel||null;
   let s=o.state||{};
   if(tab==='world'||tab==='learn')s=(ex>.01||sel)?FROZ:demo(time);
   const R=s.R||D.Rs,blunt=R>30e-9,Rts=R*1e9*SC,TIPH=Rts+1.6,util=s.util||0;
   tipS.visible=!blunt;tipB.visible=blunt;

   /* sheet depth and tear: after the break the hole opens and the sheet relaxes flat */
   if(s.broken){tear=Math.min(1,tear+dt/.45);hd+=(0-hd)*Math.min(1,dt*7)}
   else{tear=0;hd=(s.d||0)*1e9*SC}
   const trT=sm(tear)*1.4,lift=ex*.6,lat=ex*1.8;

   for(let v=0;v<NV;v++){
    const re=Math.max(sR[v],trT),th=sT[v];
    sPos[v*3]=Math.cos(th)*re;sPos[v*3+1]=-wOf(re,hd,Rts)+lift;sPos[v*3+2]=Math.sin(th)*re;
   }
   sg.attributes.position.needsUpdate=true;sg.computeVertexNormals();

   /* atoms: placed on the sheet, hidden inside the tear, coloured by strain (schematic) */
   for(let i=0;i<na;i++){
    const r=atR[i],h=r<trT;hid[i]=h?1:0;
    if(h){pPos[i*3]=0;pPos[i*3+1]=-100;pPos[i*3+2]=0}
    else{pPos[i*3]=atX[i];pPos[i*3+1]=-wOf(r,hd,Rts)+.03+lift+lat;pPos[i*3+2]=atZ[i]}
    const k=clamp((util*Math.min(1,Math.pow(Rts/Math.max(r,Rts),.55))-.2)/.8,0,1);
    pCol[i*3]=.55+.45*k;pCol[i*3+1]=.85-.55*k;pCol[i*3+2]=1-.8*k;
   }
   for(let b=0;b<nb;b++){
    const a=bA[b],c=bB[b],o6=b*6;
    if(hid[a]||hid[c]){lPos[o6]=0;lPos[o6+1]=-100;lPos[o6+2]=0;lPos[o6+3]=0;lPos[o6+4]=-100;lPos[o6+5]=0}
    else{
     lPos[o6]=pPos[a*3];lPos[o6+1]=pPos[a*3+1];lPos[o6+2]=pPos[a*3+2];
     lPos[o6+3]=pPos[c*3];lPos[o6+4]=pPos[c*3+1];lPos[o6+5]=pPos[c*3+2];
    }
    lCol[o6]=pCol[a*3];lCol[o6+1]=pCol[a*3+1];lCol[o6+2]=pCol[a*3+2];lCol[o6+3]=pCol[c*3];lCol[o6+4]=pCol[c*3+1];lCol[o6+5]=pCol[c*3+2];
   }
   pg.attributes.position.needsUpdate=true;pg.attributes.color.needsUpdate=true;lg.attributes.position.needsUpdate=true;lg.attributes.color.needsUpdate=true;
   defs.forEach(q=>{
    const i=q.i;q.m.visible=!hid[i];q.m.position.set(pPos[i*3],pPos[i*3+1]+.05,pPos[i*3+2]);q.m.rotation.y+=dt;
   });

   /* chip drops away when pulled apart */
   chipG.position.y=-ex*3.6;

   /* tip: the apex sits at gap - piezo + bend, so it rests on the sheet in contact and drops through after the break */
   const defl=(s.defl||0)*1e9,Zn=(s.Z||0)*1e9,oT=ex*3.2,oC=ex*4.6,oP=ex*7.6,oL=ex*6.4;
   const apexT=(D.Zc*1e9-Zn+defl)*SC;
   apexY+=(apexT-apexY)*Math.min(1,dt*25);
   tipG.position.set(0,apexY+oT,0);

   const yEnd=apexY+TIPH+oC,yFix=yEnd-defl*SC*BEND,dx=BX1-BX0,Lb=Math.hypot(dx,yFix-yEnd);
   beam.position.set((BX0+BX1)/2,(yEnd+yFix)/2,0);beam.rotation.z=Math.atan2(yFix-yEnd,dx);beam.scale.x=Lb;
   holder.position.y=yFix;
   const top=TOPY+oP,bot=yFix+.55+(oP-oC),len=Math.max(.4,top-bot);
   stack.position.set((BX1+10.7)/2,bot+len/2,0);stack.scale.y=len;plate.position.y=top+.2;

   /* optical lever: the beam from the laser reflects off the cantilever; the reflected spot moves twice as far as the tilt */
   const ly=LY+oL,Sx=.6,beta=Math.atan2(yFix-yEnd,dx),Sy=yEnd+(yFix-yEnd)*(Sx-BX0)/dx;
   let ix=Sx-3,iy=Sy-ly;const il=Math.hypot(ix,iy)||1;ix/=il;iy/=il;
   const nx=-Math.sin(beta),ny=Math.cos(beta),dn=ix*nx+iy*ny,rx=ix-2*dn*nx,ry=iy-2*dn*ny;
   const tt=ry>.02?(ly-Sy)/ry:3,Px=Sx+tt*rx;
   lasr.position.set(3,ly,0);diode.position.set(Px,ly,0);seg(b1,3,ly,Sx,Sy);seg(b2,Sx,Sy,Px,ly);

   /* selection: the chosen part glows, the rest fade */
   const pulse=.22+.12*Math.sin(time*5);
   for(const id in parts){
    const pt=parts[id],isSel=sel===id,fade=sel?(isSel?1:.15):1;
    pt.mats.forEach(m=>{
     m.opacity+=(m.userData.op*fade-m.opacity)*Math.min(1,dt*8);
     if(m.emissive)m.emissive.setRGB(isSel?1*pulse:0,isSel?.62*pulse:0,isSel?.3*pulse:0);
     if(m.userData.vc)m.color.setScalar(isSel?1+pulse*3:1);
     if(m.userData.sz)m.size=m.userData.sz*(isSel?1+pulse*1.5:1);
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
