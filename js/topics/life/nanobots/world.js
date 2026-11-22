/* Nanobots · World tab: the 3D bot, vessel, clot and swarm */
(function(){
const T=(window.HV.T=window.HV.T||{}).nanobots=window.HV.T.nanobots||{};
const {PI,sm,clamp,rel,MU,RHO,LBOT,RBOT,VSW,NB,UMEAN,X0,XN,UA,B2,KAB,TH0,T_APP,xApp,drag,ReOf,fmtT}=T;

/* ---------- the 3D bot, vessel, clot and swarm ---------- */
function create(THREE,root){
 const geos=[],mats=[],parts={},sub=new THREE.Group(),bot=new THREE.Group();root.add(sub);sub.add(bot);
 const M=(c,o)=>{const m=new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.45,metalness:.4,emissive:c,emissiveIntensity:.12},o));m.userData.ei=m.emissiveIntensity;mats.push(m);return m};
 const part=(id,dx,dy,dz,top)=>{const g=new THREE.Group();g.userData={dir:new THREE.Vector3(dx,dy,dz),ms:[]};parts[id]=g;(top||bot).add(g);return g};
 const add=(g,geo,m,x,y,z,rx,ry,rz)=>{geos.push(geo);const me=new THREE.Mesh(geo,m);me.position.set(x||0,y||0,z||0);me.rotation.set(rx||0,ry||0,rz||0);g.add(me);if(g.userData.ms&&g.userData.ms.indexOf(m)<0)g.userData.ms.push(m);return me};
 const orange=M('#ff8a2b',{metalness:.6}),cyan=M('#5df2ff',{metalness:.5}),gold=M('#ffd24d',{emissiveIntensity:.35}),green=M('#7dff9a',{emissiveIntensity:.3}),pink=M('#ff3df2',{emissiveIntensity:.3}),steel=M('#5d7cff',{metalness:.7,emissiveIntensity:.1});
 const coatM=M('#bfe8ff',{transparent:true,opacity:.16,depthWrite:false,side:THREE.DoubleSide,emissiveIntensity:.05});

 /* head */
 const head=part('head',-3.5,0,0);add(head,new THREE.SphereGeometry(1.7,32,24),orange,-6.2,0,0);

 /* helical tail: the helix spins about the bot's axis */
 const tail=part('tail',3.5,0,0),helix=new THREE.Group();tail.add(helix);
 const pts=[];for(let k=0;k<=120;k++){const a=k/120*PI*8;pts.push(new THREE.Vector3(-4.2+k/120*9.2,Math.cos(a)*1.3,Math.sin(a)*1.3))}
 add(helix,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),240,.22,8,false),cyan);
 add(tail,new THREE.CylinderGeometry(.5,.5,.8,16),cyan,-4.4,0,0,0,0,PI/2);

 /* payload beads inside the helix */
 const pay=part('payload',0,3.2,0),beads=[];
 for(let k=0;k<7;k++)beads.push(add(pay,new THREE.SphereGeometry(.45,14,10),gold,-3+k,0,0));

 /* targeting molecules on the head */
 const lig=part('ligands',-1.5,2.5,2.5),sg=new THREE.CylinderGeometry(.05,.05,.7,6),tg=new THREE.SphereGeometry(.13,8,6);
 for(let k=0;k<24;k++){
  const y=1-2*(k+.5)/24,r=Math.sqrt(1-y*y),ph=k*2.399963,n=new THREE.Vector3(y,Math.cos(ph)*r,Math.sin(ph)*r);
  const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),n);
  const st=add(lig,sg,green,-6.2+n.x*2.05,n.y*2.05,n.z*2.05);st.quaternion.copy(q);
  add(lig,tg,green,-6.2+n.x*2.45,n.y*2.45,n.z*2.45);
 }

 /* stealth coating */
 const coat=part('coat',0,0,-4.5);
 add(coat,new THREE.CylinderGeometry(2.1,2.1,13.5,32,1,true),coatM,-1.35,0,0,0,0,PI/2);
 add(coat,new THREE.SphereGeometry(2.05,24,16),coatM,-6.2,0,0);

 /* release lock */
 const lock=part('lock',-1,-3.2,0);
 add(lock,new THREE.TorusGeometry(1.0,.13,8,28),pink,-4,0,0,0,PI/2,0);
 for(let k=0;k<4;k++){const a=k*PI/2;add(lock,new THREE.SphereGeometry(.22,10,8),pink,-4,Math.cos(a)*1,Math.sin(a)*1)}

 /* field coils (outside the body in real life) */
 const coils=part('coils',0,0,0,sub);coils.userData.dir.set(0,0,0);
 for(const sd of[-1,1]){add(coils,new THREE.TorusGeometry(9,.5,10,48),steel,0,sd*23,0,PI/2);add(coils,new THREE.TorusGeometry(9,.5,10,48),steel,0,0,sd*23)}

 /* vessel: translucent wall and rings that rush past when the blood is fast */
 const vessel=new THREE.Group();root.add(vessel);vessel.visible=false;
 const wallG=new THREE.CylinderGeometry(14,14,150,24,1,true);geos.push(wallG);
 const wallM=new THREE.MeshBasicMaterial({color:0xff5d7a,transparent:true,opacity:.1,side:THREE.DoubleSide,depthWrite:false});mats.push(wallM);
 const wall=new THREE.Mesh(wallG,wallM);wall.rotation.z=PI/2;vessel.add(wall);
 const rg=new THREE.TorusGeometry(14,.22,6,32);geos.push(rg);const rm=new THREE.MeshBasicMaterial({color:0xff8aa0,transparent:true,opacity:.5});mats.push(rm);
 const rings=[];for(let k=0;k<16;k++){const r=new THREE.Mesh(rg,rm);r.rotation.y=PI/2;r.position.x=k*9-70;vessel.add(r);rings.push(r)}

 /* red blood cells */
 const cg=new THREE.SphereGeometry(1,18,12);geos.push(cg);const cm=M('#c4243b',{roughness:.7,emissiveIntensity:.08});
 const cells=[];for(let k=0;k<18;k++){const c=new THREE.Mesh(cg,cm),a=k*2.399,r=4+(k%5)*1.8;c.scale.set(2.4,.85,2.4);c.position.set(((k*37)%80)-40,Math.cos(a)*r,Math.sin(a)*r);c.rotation.set(a,a*.7,0);root.add(c);cells.push({m:c,c:.12+(k%6)*.08})}

 /* clot: a lumpy blob with a fibrin mesh over it */
 const cg2=new THREE.IcosahedronGeometry(8,2),pa=cg2.attributes.position;geos.push(cg2);
 for(let k=0;k<pa.count;k++){const x=pa.getX(k),y=pa.getY(k),z=pa.getZ(k),f=1+.1*Math.sin(x*1.3)*Math.cos(y*1.7)+.06*Math.sin(z*2.1);pa.setXYZ(k,x*f,y*f,z*f)}
 cg2.computeVertexNormals();
 const clot=new THREE.Group();clot.visible=false;root.add(clot);
 clot.add(new THREE.Mesh(cg2,M('#7a1226',{roughness:.8,metalness:.1,emissiveIntensity:.12})));
 const fibM=new THREE.MeshBasicMaterial({color:0xff9aa8,wireframe:true,transparent:true,opacity:.22});mats.push(fibM);clot.add(new THREE.Mesh(cg2,fibM));

 /* swarm and drug particles */
 const NS=160,ND=120,rnd=k=>{const x=Math.sin(k*127.1+311.7)*43758.5453;return x-Math.floor(x)};
 const sw={b:[],ct:[],ph:[]},dg={ct:[],ph:[]};
 for(let k=0;k<NS;k++){const r=6+rnd(k)*7,a=rnd(k+9)*PI*2,e=Math.acos(2*rnd(k+3)-1);sw.b.push([r*Math.cos(e),r*Math.sin(e)*Math.cos(a),r*Math.sin(e)*Math.sin(a)]);sw.ct.push(.15+.85*rnd(k+5));sw.ph.push(rnd(k+7)*PI*2)}
 for(let k=0;k<ND;k++){dg.ct.push(.1+.9*rnd(k+11));dg.ph.push(rnd(k+13)*PI*2)}
 const pg=(n)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(n*3),3));geos.push(g);return g};
 const swG=pg(NS),drG=pg(ND);
 const swP=new THREE.Points(swG,new THREE.PointsMaterial({size:.45,color:0x5df2ff,transparent:true,opacity:.9,depthWrite:false,blending:THREE.AdditiveBlending}));mats.push(swP.material);swP.visible=false;swP.frustumCulled=false;root.add(swP);
 const drP=new THREE.Points(drG,new THREE.PointsMaterial({size:.4,color:0xffd24d,transparent:true,opacity:.95,depthWrite:false,blending:THREE.AdditiveBlending}));mats.push(drP.material);drP.visible=false;drP.frustumCulled=false;root.add(drP);

 const wg=new THREE.SphereGeometry(180,24,16),wm=new THREE.MeshBasicMaterial({color:0x1a0610,side:THREE.BackSide});geos.push(wg);mats.push(wm);root.add(new THREE.Mesh(wg,wm));
 const L=[new THREE.AmbientLight(0xc0a0b0,.7),new THREE.DirectionalLight(0xffffff,1.1),new THREE.DirectionalLight(0xff6b8b,.5)];
 L[1].position.set(6,10,8);L[2].position.set(-8,-2,-10);L.forEach(l=>root.add(l));

 let ex=0;
 return{
  update(dt,time,o){
   const st=o.state,live=o.tab==='launch'||o.tab==='fly';
   ex+=(o.explode-ex)*Math.min(1,dt*5);
   for(const id in parts){const g=parts[id];g.position.copy(g.userData.dir).multiplyScalar(ex*1.5);
    const pulse=o.sel===id?.55+.45*Math.sin(time*7):0;g.userData.ms.forEach(m=>{m.emissiveIntensity=(m.userData.ei||0)+pulse})}
   const hz=live?st.hz:8,dock=live?st.dock:0,dr=live?st.dr:0,pyl=live?st.pay:0,flow=live?st.flow:300;
   const hd=live&&st.hd!==undefined?st.hd:0;
   bot.position.y=live&&st.r!==undefined?st.r*.56:0;bot.rotation.z+=(-hd-bot.rotation.z)*Math.min(1,dt*10);
   helix.rotation.x+=dt*8*hz/20;
   const pl=id=>o.sel===id?.55+.45*Math.sin(time*7):0;
   steel.emissiveIntensity=.1+(live?hz/20*.9:.2)+pl('coils');gold.emissiveIntensity=.35+dr*1.6+pl('payload');
   beads.forEach(b=>b.scale.setScalar(1-.7*pyl));
   vessel.visible=live;
   const vr=live?(st.vrel!==undefined?st.vrel:st.flow):300,wv=live?clamp(vr*.006,0,16):.4;
   rings.forEach(r=>{r.position.x+=wv*dt;if(r.position.x>75)r.position.x-=144});
   cells.forEach(c=>{c.m.position.x+=wv*c.c*dt;if(c.m.position.x>40)c.m.position.x-=80;c.m.rotation.y+=dt*.3});
   if(!live){clot.visible=swP.visible=drP.visible=false;return}
   /* clot position and size */
   const sc=.2+.8*st.clot,R=8*sc,faceX=-(7.95+(.4+2.2*Math.log10(1+Math.max(0,st.x)))*(1-dock))+Math.min(60,Math.max(0,-st.x)*.03),Cx=faceX-R;
   clot.visible=true;clot.scale.setScalar(sc);clot.position.set(Cx,0,0);
   /* swarm */
   const sp=swG.attributes.position.array;
   for(let k=0;k<NS;k++){
    const b=sw.b[k],ph=sw.ph[k]+time*.12*(hz/20)*(1+k%3),ct=sw.ct[k],sn=Math.sqrt(1-ct*ct);
    const jx=Math.sin(time*1.3+k)*.35,jy=Math.cos(time*1.7+k*1.3)*.35,jz=Math.sin(time*1.1+k*.7)*.35;
    const sx=Cx+ct*R*1.04,sy=sn*Math.cos(ph)*R*1.04,sz=sn*Math.sin(ph)*R*1.04;
    sp[k*3]=b[0]*(1-dock)+sx*dock+jx-st.wash*30;sp[k*3+1]=b[1]*(1-dock)+sy*dock+jy;sp[k*3+2]=b[2]*(1-dock)+sz*dock+jz;
   }
   swG.attributes.position.needsUpdate=true;swG.setDrawRange(0,Math.floor(NS*st.sw));swP.visible=st.sw>0;
   /* drug streaming into the clot */
   const dp=drG.attributes.position.array;
   for(let k=0;k<ND;k++){
    const ct=dg.ct[k],sn=Math.sqrt(1-ct*ct),ph=dg.ph[k],t=((time*.25+k*.0083)%1)*.85;
    dp[k*3]=(Cx+ct*R*1.04)*(1-t)+Cx*t;dp[k*3+1]=sn*Math.cos(ph)*R*1.04*(1-t);dp[k*3+2]=sn*Math.sin(ph)*R*1.04*(1-t);
   }
   drG.attributes.position.needsUpdate=true;drG.setDrawRange(0,Math.floor(ND*dr));drP.visible=dr>.02;
  },
  dispose(){geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose())}
 };
}

Object.assign(T,{create});
})();
