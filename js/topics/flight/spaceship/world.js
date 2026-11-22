/* Spaceship · World tab: the 3D ship */
(function(){
const T=(window.HV.T=window.HV.T||{}).spaceship=window.HV.T.spaceship||{};
const {PI,sm,m0,dry,F,ve,mdot,mb1,RING_G,m1,v1,mEnd,Tb1,Tb2,Tc,sOf,S1,S2,S3,sB,S4,fmtT}=T;

/* ---------- the 3D ship ---------- */
function create(THREE,root){
 const mats=[],geos=[],parts={},ship=new THREE.Group();root.add(ship);
 const M=(c,o)=>{const m=new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.5,metalness:.3,emissive:c,emissiveIntensity:.1},o));m.userData.ei=m.emissiveIntensity;mats.push(m);return m};
 const BM=(c,o)=>{const m=new THREE.MeshBasicMaterial(Object.assign({color:c},o));mats.push(m);return m};
 const part=(id,dx,dy,dz)=>{const g=new THREE.Group();g.userData={dir:new THREE.Vector3(dx,dy,dz),ms:[]};parts[id]=g;ship.add(g);return g};
 const add=(g,geo,m,x,y,z,rx,ry,rz)=>{geos.push(geo);const me=new THREE.Mesh(geo,m);me.position.set(x||0,y||0,z||0);me.rotation.set(rx||0,ry||0,rz||0);g.add(me);if(g.userData.ms&&g.userData.ms.indexOf(m)<0&&m.emissive)g.userData.ms.push(m);return me};
 const CY=(a,b,h,s)=>new THREE.CylinderGeometry(a,b,h,s||24),R90=PI/2;
 const body=M('#dfe6f2'),dark=M('#2a3350',{metalness:.5}),gold=M('#c8a24a',{metalness:.6,emissiveIntensity:.18}),orange=M('#ff7a2b',{emissiveIntensity:.9}),cyan=M('#5df2ff',{emissiveIntensity:1.1,roughness:.3});

 /* crew hull: octagonal section, wedge prow, tower, windows */
 const hull=part('hull',0,0,4);
 add(hull,CY(.85,.85,4.6,8),body,0,0,3.5,R90);
 add(hull,CY(.12,.85,2.2,8),body,0,0,6.9,R90);
 add(hull,new THREE.BoxGeometry(.9,.06,1.5),cyan,0,.42,6.1,-.28,0,0);
 add(hull,new THREE.BoxGeometry(.14,.04,3.8),orange,0,.83,3.4);
 add(hull,new THREE.BoxGeometry(.7,.5,1.3),body,0,1.05,2.6);
 add(hull,new THREE.BoxGeometry(.5,.08,.3),cyan,0,1.1,3.3);
 add(hull,CY(.02,.02,1.2,6),dark,0,1.8,2.2);
 for(const sd of[-1,1])add(hull,new THREE.BoxGeometry(.04,.12,3.2),cyan,sd*.8,.1,3.4);
 add(hull,new THREE.TorusGeometry(.14,.025,6,16),cyan,0,0,8.02);

 /* neck + spin ring */
 const ring=part('ring',0,0,1.5);
 add(ring,CY(.45,.45,2.8,12),dark,0,0,-.2,R90);
 const spin=new THREE.Group();spin.position.set(0,0,-.2);ring.add(spin);
 add(spin,new THREE.TorusGeometry(3.4,.3,10,56),body,0,0,0);
 for(let k=0;k<4;k++){const sg=new THREE.Group();sg.rotation.z=k*R90;spin.add(sg);add(sg,new THREE.BoxGeometry(.1,2.65,.1),dark,0,1.78,0)}
 for(let k=0;k<20;k++){const a=k/20*PI*2,w=new THREE.Mesh(new THREE.BoxGeometry(.12,.3,.14),cyan);geos.push(w.geometry);w.position.set(Math.cos(a)*3.4,Math.sin(a)*3.4,.18);w.rotation.z=a;spin.add(w)}
 add(spin,new THREE.TorusGeometry(3.4,.03,6,56),orange,0,0,.3);
 ring.userData.ms.push(body,cyan);

 /* shadow shield */
 const shield=part('shield',0,0,-1.2);
 add(shield,CY(4,4,.16,56),dark,0,0,-1.7,R90);
 add(shield,CY(3.95,3.95,.02,56),gold,0,0,-1.79,R90);
 add(shield,new THREE.TorusGeometry(4,.06,6,56),orange,0,0,-1.7);
 add(shield,new THREE.TorusGeometry(2.4,.025,6,48),cyan,0,0,-1.62);

 /* reactor */
 const reactor=part('reactor',0,0,-3.2);
 const coreM=M('#bff8ff',{emissive:'#7fe9ff',emissiveIntensity:1.6,roughness:.2});
 const core=add(reactor,new THREE.SphereGeometry(.42,20,16),coreM,0,0,-3.2);
 add(reactor,CY(.95,.95,.08,28),dark,0,0,-2.0,R90);add(reactor,CY(.95,.95,.08,28),dark,0,0,-4.4,R90);
 for(let k=0;k<6;k++){const a=k/6*PI*2;add(reactor,CY(.035,.035,2.4,6),body,Math.cos(a)*.85,Math.sin(a)*.85,-3.2,R90)}
 add(reactor,new THREE.TorusGeometry(.8,.03,6,32),cyan,0,0,-3.2);
 add(reactor,new THREE.TorusGeometry(.62,.03,6,32),cyan,0,.0,-3.2,0,R90,0);

 /* tanks */
 const tanks=part('tanks',3,0,-1.5);
 for(const sd of[-1,1]){
  add(tanks,CY(.5,.5,2.6,24),gold,sd*1.35,0,-3.2,R90);
  add(tanks,new THREE.SphereGeometry(.5,16,10),gold,sd*1.35,0,-1.9);add(tanks,new THREE.SphereGeometry(.5,16,10),gold,sd*1.35,0,-4.5);
  add(tanks,new THREE.BoxGeometry(.8,.06,.06),dark,sd*.9,0,-2.4);add(tanks,new THREE.BoxGeometry(.8,.06,.06),dark,sd*.9,0,-4.0);
 }

 /* radiators: four fins in an X, hidden in the shield's shadow */
 const rad=part('rad',0,0,-2.5);
 const radM=M('#e6ebf3',{emissive:'#ff7a2b',emissiveIntensity:0,metalness:.2});radM.userData.ei=0;
 for(let k=0;k<4;k++){const g=new THREE.Group();g.rotation.z=k*R90+PI/4;rad.add(g);
  add(g,new THREE.BoxGeometry(.04,2.0,3.0),radM,0,2.8,-3.5);add(g,CY(.05,.05,3.0,6),orange,0,1.8,-3.5,R90)}
 rad.userData.ms.push(radM);

 /* magnet coils and the beam */
 const coils=part('coils',0,0,-3.5);
 [[-5.0,.95],[-5.8,1.2],[-6.7,1.5],[-7.7,1.85]].forEach(c=>{add(coils,new THREE.TorusGeometry(c[1],.08,8,40),cyan,0,0,c[0])});
 for(let k=0;k<4;k++){const a=k*R90+PI/4;add(coils,CY(.03,.03,3.0,6),dark,Math.cos(a)*1.25,Math.sin(a)*1.25,-6.3,R90)}
 const bm1=BM('#6fe3ff',{transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
 const bm2=BM('#ffffff',{transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
 add(coils,new THREE.ConeGeometry(1.7,10,24,1,true),bm1,0,0,-12.9,-R90);
 add(coils,new THREE.ConeGeometry(.75,12,16,1,true),bm2,0,0,-13.9,-R90);

 /* dust that streams past while travelling: the sense of speed */
 const N=420,dp=new Float32Array(N*3);
 for(let i=0;i<N;i++){dp.set([(Math.random()-.5)*34,(Math.random()-.5)*34,(Math.random()-.5)*70],i*3)}
 const dg=new THREE.BufferGeometry();dg.setAttribute('position',new THREE.BufferAttribute(dp,3));geos.push(dg);
 const dust=new THREE.Points(dg,new THREE.PointsMaterial({size:.09,color:0xbfeaff,transparent:true,opacity:.7,depthWrite:false,blending:THREE.AdditiveBlending}));mats.push(dust.material);root.add(dust);

 /* worlds: Earth falls away behind the ship, Mars grows ahead. Procedural, no image files. */
 const tex=[];
 const hs=(x,y,z)=>{const h=Math.sin(x*127.1+y*311.7+z*74.7)*43758.5453;return h-Math.floor(h)};
 const vn=(x,y,z)=>{const xi=Math.floor(x),yi=Math.floor(y),zi=Math.floor(z),u=sm(x-xi),v=sm(y-yi),w=sm(z-zi),L=(a,b,t)=>a+(b-a)*t,h=(i,j,k)=>hs(xi+i,yi+j,zi+k);
  return L(L(L(h(0,0,0),h(1,0,0),u),L(h(0,1,0),h(1,1,0),u),v),L(L(h(0,0,1),h(1,0,1),u),L(h(0,1,1),h(1,1,1),u),v),w)};
 const fbm=(x,y,z)=>{let s=0,a=.5;for(let o=0;o<5;o++){s+=a*vn(x,y,z);x*=2.03;y*=2.03;z*=2.03;a*=.5}return s};
 const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
 function planetTex(isEarth){
  const W=384,H=192,cv=document.createElement('canvas');cv.width=W;cv.height=H;
  const g=cv.getContext('2d'),im=g.createImageData(W,H),d=im.data;
  for(let y=0;y<H;y++){const la=(y/H-.5)*PI,cy=Math.sin(la),cr=Math.cos(la);
   for(let x=0;x<W;x++){const lo=x/W*PI*2,px=Math.cos(lo)*cr,pz=Math.sin(lo)*cr,i=(y*W+x)*4;
    const h=fbm(px*2.2+(isEarth?0:9),cy*2.2,pz*2.2);let c;
    if(isEarth){
     if(h<.52){c=mix([54,140,200],[14,60,130],Math.min(1,(.52-h)*5))}
     else{const e=Math.min(1,(h-.52)*4);c=e<.6?mix([60,130,60],[170,150,100],e/.6):mix([170,150,100],[245,245,245],(e-.6)/.4)}
     if(Math.abs(cy)>.86-.1*fbm(px*3,cy*3,pz*3))c=[240,246,255];
     const cl=Math.min(1,Math.max(0,fbm(px*3.5+20,cy*3.5,pz*3.5)-.52)*3.2);c=mix(c,[255,255,255],cl*.85);
    }else{
     const n=fbm(px*5,cy*5,pz*5);c=[150+70*n,70+40*n,40+25*n];
     if(h<.45)c=[c[0]*.62,c[1]*.62,c[2]*.62];
     if(Math.abs(cy)>.9-.05*n)c=[235,225,215];
    }
    d[i]=c[0];d[i+1]=c[1];d[i+2]=c[2];d[i+3]=255}}
  g.putImageData(im,0,0);const t=new THREE.CanvasTexture(cv);tex.push(t);return t;
 }
 const sun=new THREE.Vector3(.7,.35,-.55).normalize();
 function planet(isEarth,rad){
  const grp=new THREE.Group(),m=new THREE.ShaderMaterial({
   uniforms:{t:{value:planetTex(isEarth)},sun:{value:sun},atm:{value:new THREE.Color(isEarth?'#6fb8ff':'#ff9a66')},k:{value:isEarth?1:.45}},
   vertexShader:'varying vec2 vu;varying vec3 vn,vp;void main(){vu=uv;vn=normalize(mat3(modelMatrix)*normal);vp=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vp,1.);}',
   fragmentShader:'uniform sampler2D t;uniform vec3 sun,atm;uniform float k;varying vec2 vu;varying vec3 vn,vp;void main(){vec3 n=normalize(vn),v=normalize(cameraPosition-vp);float d=max(dot(n,sun),0.),rim=pow(1.-max(dot(n,v),0.),3.);vec3 c=texture2D(t,vu).rgb;gl_FragColor=vec4(c*(.04+1.05*smoothstep(0.,.35,d))+atm*rim*k*(.25+.9*d),1.);}'});
  const hm=new THREE.ShaderMaterial({uniforms:{c:{value:new THREE.Color(isEarth?'#5aa8ff':'#ff8a55')}},transparent:true,side:THREE.BackSide,blending:THREE.AdditiveBlending,depthWrite:false,
   vertexShader:'varying vec3 vn;void main(){vn=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:'uniform vec3 c;varying vec3 vn;void main(){float i=pow(max(.62-dot(vn,vec3(0.,0.,1.)),0.),3.);gl_FragColor=vec4(c*i*.9,1.);}'});
  const bg=new THREE.SphereGeometry(rad,48,32),hg=new THREE.SphereGeometry(rad*1.13,32,24);geos.push(bg,hg);mats.push(m,hm);
  const body=new THREE.Mesh(bg,m);grp.add(body,new THREE.Mesh(hg,hm));root.add(grp);grp.rotation.z=.4;return grp;
 }
 const PE=planet(true,40),PM=planet(false,16);
 const lerp=(a,b,t)=>a+(b-a)*t;
 function place(f){
  const a=Math.pow(f,.4),b=Math.pow(f,2.4);
  PE.position.set(lerp(0,-40,a),lerp(-52,-4,a),lerp(-6,-300,a));PE.scale.setScalar(lerp(1,.5,a));
  PM.position.set(lerp(30,14,b),lerp(10,-4,b),lerp(520,80,b));PM.scale.setScalar(lerp(.8,1.5,b));
 }
 place(0);
 /* the sun: a soft flare far off, the same direction that lights both planets */
 const sc=document.createElement('canvas');sc.width=sc.height=128;
 const sg=sc.getContext('2d'),gr=sg.createRadialGradient(64,64,0,64,64,64);
 gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.12,'rgba(255,240,200,.85)');gr.addColorStop(.4,'rgba(255,200,120,.18)');gr.addColorStop(1,'rgba(255,180,100,0)');
 sg.fillStyle=gr;sg.fillRect(0,0,128,128);
 const sunT=new THREE.CanvasTexture(sc);tex.push(sunT);
 const sunS=new THREE.Sprite(new THREE.SpriteMaterial({map:sunT,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));
 mats.push(sunS.material);sunS.scale.set(220,220,1);sunS.position.copy(sun).multiplyScalar(480);root.add(sunS);
 /* reactor glow lights the hull */
 const coreL=new THREE.PointLight(0x7fe9ff,0,45);coreL.position.set(0,0,-3.2);ship.add(coreL);

 /* lights */
 const L=[new THREE.AmbientLight(0x8ea0c0,.7),new THREE.DirectionalLight(0xffffff,1.2),new THREE.DirectionalLight(0x5df2ff,.5)];
 L[1].position.set(6,8,10);L[2].position.set(-8,2,-10);L.forEach(l=>root.add(l));

 let ex=0,spinA=0,sp=0;
 return {
  update(dt,time,o){
   const st=o.state,live=o.tab==='launch'||o.tab==='fly';
   const th=live?st.th:.35,pw=live?st.pw:.6,heat=live?st.heat:.5,rg=live?st.ring:.5;
   ex+=(o.explode-ex)*Math.min(1,dt*5);
   for(const id in parts){const g=parts[id];g.position.copy(g.userData.dir).multiplyScalar(ex*1.4);
    const pulse=o.sel===id?.55+.45*Math.sin(time*7):0;g.userData.ms.forEach(m=>{m.emissiveIntensity=(m.userData.ei||0)+pulse})}
   radM.emissiveIntensity=heat*.9+(o.sel==='rad'?.5+.4*Math.sin(time*7):0);radM.userData.ei=heat*.9;
   const wob=1+.08*Math.sin(time*9);core.scale.setScalar((.5+pw*.7)*wob);coreM.userData.ei=1.6;
   bm1.opacity=th*.5;bm2.opacity=th*.85;
   place(live?Math.max(0,Math.min(1.2,st.s/S4)):0);PE.rotation.y+=dt*.01;PM.rotation.y+=dt*.01;coreL.intensity=pw*2.2*wob;
   spinA+=dt*rg*1.3;spin.rotation.z=spinA;
   ship.rotation.y=live?PI*st.flip:0;
   dust.visible=live;
   if(live){const sgn=Math.sign(st.v),sv=Math.log10(1+Math.abs(st.v)/1000);sp+=sv*dt*9;const a=dg.attributes.position.array;
    const dz=sgn*sv*dt*22;
    for(let i=0;i<N;i++){let z=a[i*3+2]-dz;if(z<-35)z+=70;else if(z>35)z-=70;a[i*3+2]=z}dg.attributes.position.needsUpdate=true}
  },
  dispose(){geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());tex.forEach(t=>t.dispose())}
 };
}

Object.assign(T,{create});
})();
