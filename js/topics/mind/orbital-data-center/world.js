/* Orbital data center · the 3D model, used by World, Launch and Fly. update(dt,time,o) with o={state,tab,explode,sel}.
   Each part from parts.js is a group of meshes found by its id, so selecting a part lights it and dims the rest.
   Scale: for the node, 1 scene unit = 8 m, so the two 35 by 40 m wings are 4.4 by 5 units and the radiator fins add up to 850 m². The Earth is 150 units in radius
   and the node is 15 units above it, which keeps the true ratio of Earth's radius to the orbit's (6371 to 7021). So against the Earth the node is drawn about ten
   thousand times too large, and the heat colours are schematic: real panels at this temperature glow only in infrared.
   Axes: X is the flight direction, Y is up away from Earth, Z is along the orbit normal toward the Sun side. The Sun direction is worked out from nu and beta
   with the same geometry as core.js, so the shadow season on screen is the real one: the node is in shadow when it is on the night side and the Earth's shadow
   cylinder covers it. The wings turn to face the Sun, and the radiator fins stay edge-on to it, as in the model.
   State it reads, all optional, any missing one falls back to a gentle demo: nu orbit angle (rad), beta Sun to orbit-plane angle (rad), dep 0..1 how far the wings and
   fins are unfolded, load 0..1 compute load, Tr radiator temperature (K), link 0..1 neighbour laser, gnd 0..1 ground laser, storm 0..1 particle storm,
   seu 0..1 a bit-flip flash, thrust 0..1 thruster, rad 0..1 share of radiator area still working.
   In World and Learn the season is sped up (a full cycle every 150 s) so the shadow season can be seen arriving. */
(function(){
const T=window.HV.T.odc,D=T.DES,K=T.K,clamp=T.clamp,D2R=T.D2R,PI=Math.PI;
const ER=150,AS=ER*T.a/K.Re,H0=AS-ER;                       /* Earth radius, orbit radius, node height above the ground, scene units */
const WX=4.4,WY=5.0,WI=1.3;                                 /* wing width, height, inner edge */
const VX=1.3,VY=.95,VZ=.95;                                 /* radiation vault */
const FD=3.3,FH=2.0,FX=1.0,FZ=.55;                          /* radiator fin depth along the Sun line, height, offset from centre, gap behind the vault */
const NBX=25,NBY=2.4,NBZ=-1.2;                              /* neighbour node: 200 m away at 8 m per unit */
const sm=x=>{x=clamp(x,0,1);return x*x*(3-2*x)},lerp=(a,b,t)=>a+(b-a)*t;

/* small vector helpers, plain arrays */
const nrm=v=>{const l=Math.hypot(v[0],v[1],v[2])||1;return[v[0]/l,v[1]/l,v[2]/l]};
const crs=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
/* quaternion of the rotation whose columns are the orthonormal vectors x,y,z */
function qBasis(x,y,z){
 const a=x[0],b=y[0],c=z[0],d=x[1],e=y[1],f=z[1],g=x[2],h=y[2],i=z[2],tr=a+e+i;
 if(tr>0){const S=Math.sqrt(tr+1)*2;return[(h-f)/S,(c-g)/S,(d-b)/S,.25*S]}
 if(a>e&&a>i){const S=Math.sqrt(1+a-e-i)*2;return[.25*S,(b+d)/S,(c+g)/S,(h-f)/S]}
 if(e>i){const S=Math.sqrt(1+e-a-i)*2;return[(b+d)/S,.25*S,(f+h)/S,(c-g)/S]}
 const S=Math.sqrt(1+i-a-e)*2;return[(c+g)/S,(f+h)/S,.25*S,(d-b)/S];
}
/* quaternion that turns unit vector a onto unit vector b */
function qFromTo(a,b){const w=1+dot(a,b);if(w<1e-6)return[1,0,0,0];const c=crs(a,b),l=Math.hypot(c[0],c[1],c[2],w);return[c[0]/l,c[1]/l,c[2]/l,w/l]}

/* the World and Learn demo: the orbit turns once a minute or so, the season sweeps through the year, load and links breathe */
const demo=t=>({nu:t*.12,beta:(74+15.5*Math.cos(t/150*2*PI))*D2R,dep:1,load:.7+.25*Math.sin(t*.4),link:.55+.45*Math.sin(t*.9),gnd:sm((Math.sin(t*.21)-.2)/.6),storm:0,seu:0,thrust:0,rad:1});

T.create=function(THREE,grp){
 const root=new THREE.Group();root.position.set(0,0,-2);grp.add(root);
 const own=[],keep=o=>{own.push(o);return o};
 const parts={};                                              /* id -> {mats:[...]} */
 const reg=(id,m,op)=>{keep(m);m.transparent=true;m.opacity=op;m.userData.op=op;(parts[id]=parts[id]||{mats:[]}).mats.push(m);return m};
 const lam=(id,color,op,extra)=>reg(id,new THREE.MeshLambertMaterial(Object.assign({color,side:THREE.DoubleSide},extra||{})),op);
 const add=(id,color,op)=>reg(id,new THREE.MeshBasicMaterial({color,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}),op);
 const geo=g=>keep(g);
 const mesh=(g,m,parent,x,y,z)=>{const o=new THREE.Mesh(g,m);o.position.set(x||0,y||0,z||0);parent.add(o);return o};
 const cv=(w,h,fn,rx,ry)=>{const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);const t=keep(new THREE.CanvasTexture(c));t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx,ry);return t};

 const amb=new THREE.AmbientLight(0xffffff,.6);root.add(amb);
 const sunL=new THREE.DirectionalLight(0xffffff,1);root.add(sunL);

 /* Earth, the orbit ring, the Sun and the Earth's shadow (the orbit part) */
 const earth=T.makeEarth(THREE,root,{R:ER,cy:-AS});
 const ringM=add('orbit',0x5df2ff,.5),ring=mesh(geo(new THREE.TorusGeometry(AS,.09,6,240)),ringM,root,0,-AS,0);
 const sunM=reg('orbit',new THREE.MeshBasicMaterial({color:0xfff2c0}),1),sunB=mesh(geo(new THREE.SphereGeometry(5,24,16)),sunM,root);
 const haloM=add('orbit',0xffd27a,.22),halo=mesh(geo(new THREE.SphereGeometry(11,24,16)),haloM,root);
 const shM=reg('orbit',new THREE.MeshBasicMaterial({color:0x000010,depthWrite:false}),.16),shadow=mesh(geo(new THREE.CylinderGeometry(ER,ER,700,48,1,true)),shM,root);

 /* radiation vault, with the compute racks inside it */
 const shG=new THREE.Group();root.add(shG);
 const vg=geo(new THREE.BoxGeometry(VX,VY,VZ));
 mesh(vg,lam('shield',0x8a93a6,.3),shG);
 const edM=reg('shield',new THREE.LineBasicMaterial({color:0xcfd8ea}),.9);shG.add(new THREE.LineSegments(geo(new THREE.EdgesGeometry(vg)),edM));
 const rackG=new THREE.Group();root.add(rackG);
 const rkM=lam('compute',0x1c2a3a,1),rkF=lam('compute',0x1c2a3a,1),rg=geo(new THREE.BoxGeometry(.1,.6,.3)),racks=[];
 for(let c=0;c<6;c++)for(let r=0;r<2;r++)racks.push(mesh(rg,rkM,rackG,(c-2.5)*.17,0,(r-.5)*.4));

 /* wings, on a group that turns to face the Sun: left and right wing, boom, power converters */
 const WG=new THREE.Group();root.add(WG);
 const cellT=cv(64,64,(g,w,h)=>{g.fillStyle='#0f2a66';g.fillRect(0,0,w,h);g.strokeStyle='#6f93e0';g.lineWidth=2;g.strokeRect(1,1,w-2,h-2);g.strokeStyle='#2c4f9c';g.lineWidth=1;g.beginPath();g.moveTo(w/2,0);g.lineTo(w/2,h);g.stroke()},WX*3.3,WY*3.3);
 const wingM=lam('array',0xffffff,1,{map:cellT}),wgeo=geo(new THREE.PlaneGeometry(WX,WY));
 const wL=mesh(wgeo,wingM,WG),wR=mesh(wgeo,wingM,WG);
 const boomM=lam('bus',0xb7bfcc,1),boom=mesh(geo(new THREE.BoxGeometry(2*(WI+WX),.07,.07)),boomM,WG);
 const pcM=lam('power',0xffd24d,1),pcg=geo(new THREE.BoxGeometry(.3,.38,.26)),pcL=mesh(pcg,pcM,WG),pcR=mesh(pcg,pcM,WG);
 const batt=mesh(geo(new THREE.BoxGeometry(.5,.2,.4)),pcM,root,0,-.62,0);

 /* radiator fins and the coolant headers, on a group that keeps them edge-on to the Sun */
 const RG=new THREE.Group();root.add(RG);
 const finT=cv(64,64,(g,w,h)=>{g.fillStyle='#e9eef6';g.fillRect(0,0,w,h);g.strokeStyle='#a3afc2';g.lineWidth=2;for(let y=4;y<h;y+=8){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke()}},1,1);
 const finM=lam('radiators',0xffffff,1,{map:finT}),fgeo=geo(new THREE.PlaneGeometry(FD,FH));
 const fins=[0,1].map(k=>{const m=mesh(fgeo,finM,RG);m.rotation.y=PI/2;return m});
 const pipeM=lam('loop',0x6aa8ff,1),pgeo=geo(new THREE.CylinderGeometry(.03,.03,1,10));
 const pipes=[[1,.5],[1,-.5],[-1,.5],[-1,-.5]].map(q=>{const m=mesh(pgeo,pipeM,RG);m.rotation.x=PI/2;return m});

 /* laser terminals, the neighbour node and the two laser beams */
 const trM=lam('links',0xff6a6a,1),tgeo=geo(new THREE.CylinderGeometry(.1,.1,.14,12)),dgeo=geo(new THREE.SphereGeometry(.12,12,8));
 const tL=mesh(tgeo,trM,root),tR=mesh(tgeo,trM,root);tL.rotation.z=tR.rotation.z=PI/2;
 const dL=mesh(dgeo,trM,root),dR=mesh(dgeo,trM,root);dL.scale.set(.5,1,1);dR.scale.set(.5,1,1);
 const nb=new THREE.Group();nb.position.set(NBX,NBY,NBZ);root.add(nb);
 const nbM=lam('links',0xbfc8d8,.9),nbW=lam('links',0xffffff,.9,{map:cellT});
 mesh(geo(new THREE.BoxGeometry(VX,VY,VZ)),nbM,nb);mesh(wgeo,nbW,nb,-(WI+WX/2),0,0);mesh(wgeo,nbW,nb,WI+WX/2,0,0);
 const lbM=add('links',0x7fe9ff,.4),lbeam=mesh(geo(new THREE.CylinderGeometry(.035,.035,1,8)),lbM,root);
 const gbM=add('links',0xffd36b,.5),gbeam=mesh(geo(new THREE.CylinderGeometry(.05,.16,1,10)),gbM,root);
 const gsM=add('links',0xffd36b,.5),gspot=mesh(geo(new THREE.CircleGeometry(1.1,24)),gsM,root);gspot.rotation.x=-PI/2;

 /* thruster and its plume */
 const nzM=lam('bus',0x9aa3b4,1),nozzle=mesh(geo(new THREE.CylinderGeometry(.07,.14,.2,12)),nzM,root);nozzle.rotation.z=PI/2;
 const plM=add('bus',0x6ab8ff,.7),plume=mesh(geo(new THREE.ConeGeometry(.13,1,12)),plM,root);plume.rotation.z=PI/2;

 /* radiation storm: streaks of particles crossing the node */
 const NP=90,pp=new Float32Array(NP*3),pg=keep(new THREE.BufferGeometry()),pd=nrm([-.55,-.35,-.76]);
 for(let i=0;i<NP*3;i++)pp[i]=(Math.random()-.5)*26;
 pg.setAttribute('position',new THREE.BufferAttribute(pp,3));
 const pm=keep(new THREE.PointsMaterial({color:0xffe08a,size:.16,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));
 const stormP=new THREE.Points(pg,pm);stormP.frustumCulled=false;root.add(stormP);

 let trS=null,seuT=0,seuI=-1;
 const Z3=[0,0,0];

 return{
  update(dt,time,o){
   o=o||{};dt=Math.min(dt,.1);
   const tab=o.tab,ex=o.explode||0,sel=o.sel||null,dm=demo(time);
   const s=(tab==='world'||tab==='learn')?dm:(o.state||{});
   const v=k=>s[k]!=null?s[k]:dm[k];
   const nu=v('nu'),beta=v('beta'),dep=v('dep'),load=v('load'),link=v('link'),gnd=v('gnd'),storm=v('storm'),seu=v('seu'),thrust=v('thrust'),radf=v('rad');
   const sd=Math.max(.04,dep);

   /* the Sun, the shadow and the lights */
   const cb=Math.cos(beta),sv=[-cb*Math.sin(nu),cb*Math.cos(nu),Math.sin(beta)];
   let lit=1;if(sv[1]<0){const d=AS*Math.sqrt(1-sv[1]*sv[1]);lit=sm((d-ER*.985)/(ER*.03))}
   sunL.position.set(sv[0]*50,sv[1]*50,sv[2]*50);sunL.intensity=.08+.95*lit;amb.intensity=.28+.34*lit;
   sunB.position.set(sv[0]*140,sv[1]*140,sv[2]*140);halo.position.copy(sunB.position);
   const ey0=-AS-ex*14;                                         /* where the Earth's centre is */
   shadow.position.set(-sv[0]*350,ey0-sv[1]*350,-sv[2]*350);shadow.quaternion.set(...qFromTo([0,1,0],sv));
   earth.update(dt,time,{sun:sv,nu,sel,ex});

   /* orientation: wings face the Sun; fins stay edge-on to it, with their plane holding the Sun line and the vertical */
   const xl=nrm([1-sv[0]*sv[0],-sv[0]*sv[1],-sv[0]*sv[2]]),yl=crs(sv,xl);
   WG.quaternion.set(...qBasis(xl,yl,sv));
   const fx=nrm(crs(sv,[0,1,0])),fy=[0,1,0],fz=crs(fx,fy);
   RG.quaternion.set(...qBasis(fx,fy,fz));

   /* temperature of the radiators, with a slow lag like the real thermal mass */
   const Tt=s.Tr!=null?s.Tr:T.radTemp(D.hkW+D.nAcc*D.accW*load,D.Arad,T.envLoad(Math.min(beta,88*D2R),K.S0));
   if(trS==null||s.Tr!=null)trS=Tt;else trS+=(Tt-trS)*Math.min(1,dt*.6);
   const tt=clamp((trS-285)/50,0,1);

   /* wings and boom unfold; power converters ride on the boom */
   const wc=(WI+WX*sd/2)+ex*3.5;
   wL.position.set(-wc,0,0);wR.position.set(wc,0,0);wL.scale.x=wR.scale.x=sd;
   boom.scale.x=(WI+WX*sd)/(WI+WX);
   pcL.position.set(-(WI-.25),ex*2.2,-.1);pcR.position.set(WI-.25,ex*2.2,-.1);
   batt.position.y=-.62-ex*3.4;

   /* fins unfold along the Sun line and slide back when pulled apart. A damaged fin gets shorter. */
   const fr=[1,clamp(2*radf-1,.001,1)];
   fins.forEach((m,k)=>{
    const dp=FD*sd*fr[k];m.scale.x=sd*fr[k];m.position.set((k?-1:1)*(FX+ex*1.6),0,FZ+dp/2+ex*6);
   });
   pipes.forEach((m,k)=>{
    const fk=k<2?0:1,L=FD*sd*fr[fk]+.15+ex*6;m.scale.y=L;m.position.set((k<2?1:-1)*(FX+.04+ex*1.6),k%2?-.5:.5,.4+L/2);
   });
   finM.color.setRGB(lerp(.88,1,tt),lerp(.92,.58,tt),lerp(.96,.4,tt));finM.userData.eb=[.55*tt*tt,.2*tt*tt,0];
   pipeM.color.setRGB(lerp(.35,1,tt),lerp(.65,.55,tt),lerp(1,.25,tt));pipeM.userData.eb=[.35*tt,.12*tt,0];

   /* vault, racks, wings glow */
   shG.position.y=-ex*1.8;rackG.position.y=ex*2.6;
   const flick=i=>.82+.18*Math.sin(time*9+i*2.1);
   rkM.userData.eb=[.04,.1+.5*load,.12+.55*load];
   racks.forEach((r,i)=>{r.material=(seu>.05&&i===seuI)?rkF:rkM;r.scale.y=1});
   rkF.userData.eb=[.9*seu,.15,.1];
   if(seu<=.05)seuI=-1;else if(seuI<0)seuI=Math.floor(Math.random()*racks.length);
   edM.color.setRGB(1,1-.65*seu,1-.65*seu);
   wingM.userData.eb=[.01*lit,.04*lit,.14*lit];

   /* laser terminals and beams */
   const tx=VX/2+.07+ex*2.5;
   tL.position.set(-tx,.05,0);tR.position.set(tx,.05,0);dL.position.set(-tx-.1,.05,0);dR.position.set(tx+.1,.05,0);
   trM.userData.eb=[.15+.5*link,.05,.05];
   const bx=nrm([NBX-tx,NBY-.05,NBZ]),bl=Math.hypot(NBX-tx,NBY-.05,NBZ);
   lbeam.scale.y=bl;lbeam.position.set(tx+(NBX-tx)/2,.05+(NBY-.05)/2,NBZ/2);lbeam.quaternion.set(...qFromTo([0,1,0],bx));
   lbM.userData.op=(.1+.55*link)*(.8+.2*Math.sin(time*18));lbeam.visible=link>.02;
   const gy=-H0-ex*14,gl=-.5-gy;
   gbeam.scale.y=gl;gbeam.position.set(0,-.5-gl/2,0);gbM.userData.op=.6*gnd*(.8+.2*Math.sin(time*14));gbeam.visible=gnd>.02;
   gspot.position.set(0,gy+.08,0);gsM.userData.op=.7*gnd;gspot.visible=gnd>.02;

   /* thruster */
   const pl=.2+2.2*thrust;
   nozzle.position.set(-(VX/2+.1+ex*2),-.2,0);plume.scale.y=pl;plume.position.set(-(VX/2+.2+ex*2)-pl/2,-.2,0);
   plM.userData.op=.75*thrust;plume.visible=thrust>.02;

   /* particle storm */
   pm.opacity=.9*storm;stormP.visible=storm>.01;
   if(storm>.01){
    for(let i=0;i<NP;i++){
     const k=i*3;pp[k]+=pd[0]*16*dt;pp[k+1]+=pd[1]*16*dt;pp[k+2]+=pd[2]*16*dt;
     if(Math.abs(pp[k])>13||Math.abs(pp[k+1])>13||Math.abs(pp[k+2])>13){pp[k]=-pd[0]*13+(Math.random()-.5)*20;pp[k+1]=-pd[1]*13+(Math.random()-.5)*20;pp[k+2]=-pd[2]*13+(Math.random()-.5)*20}
    }
    pg.attributes.position.needsUpdate=true;
   }

   /* selection: the chosen part glows, the rest fade */
   const pulse=.22+.12*Math.sin(time*5);
   for(const id in parts){
    const pt=parts[id],isSel=sel===id,fade=sel?(isSel?1:.15):1;
    pt.mats.forEach(m=>{
     m.opacity+=(m.userData.op*fade-m.opacity)*Math.min(1,dt*8);
     if(m.emissive){const b=m.userData.eb||Z3;m.emissive.setRGB(b[0]+(isSel?pulse:0),b[1]+(isSel?.62*pulse:0),b[2]+(isSel?.3*pulse:0))}
    });
   }
  },
  dispose(){
   grp.remove(root);earth.dispose();
   own.forEach(x=>x.dispose&&x.dispose());
  }
 };
};
})();
