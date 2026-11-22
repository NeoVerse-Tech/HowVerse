/* Dyson swarm · World tab: the 3D scene. Phase 3: the Sun, the swarm of collectors, and the nexus that carries the power. */
(function(){
const T=window.HV.T.dyson;
const {PI,SR,SW}=T;

function create(THREE,root){
 const mats=[],geos=[],tex=[];

 /* ---------- the Sun: procedural photosphere ----------
    Real features: granulation (convection cells), supergranulation, limb darkening (edge is about
    40% as bright as the centre and redder), sunspots in the 10-35 degree latitude bands,
    bright faculae near the limb, a corona that fades with distance, and prominences. */
 const sunG=new THREE.Group();root.add(sunG);

 const sunM=new THREE.ShaderMaterial({
  uniforms:{t:{value:0},uBr:{value:0},uSp:{value:0}},
  vertexShader:`varying vec3 vObj,vNrm,vWorld;
   void main(){vObj=position;vNrm=normalize(mat3(modelMatrix)*normal);
    vec4 w=modelMatrix*vec4(position,1.);vWorld=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
  fragmentShader:`uniform float t,uBr,uSp;varying vec3 vObj,vNrm,vWorld;
   float h31(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
   float vn(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
    return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x),mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x),mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y),f.z);}
   float fbm(vec3 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*vn(p);p=p*2.03+vec3(1.7,9.2,3.1);a*=.5;}return s;}
   void main(){
    vec3 n=normalize(vNrm),v=normalize(cameraPosition-vWorld);
    float mu=max(dot(n,v),0.);
    vec3 p=normalize(vObj);
    float g=fbm(p*38.+vec3(0.,t*.05,0.));
    float cell=smoothstep(.38,.62,g);
    float sg=fbm(p*7.+vec3(t*.01));
    float I=.80+.24*cell+.10*(sg-.5);
    float s=fbm(p*3.2+vec3(3.1,1.7,5.2));
    float lat=abs(p.y);
    float w=smoothstep(.1,.2,lat)*(1.-smoothstep(.42,.58,lat));
    float pen=w*smoothstep(.60,.66,s),umb=w*smoothstep(.66,.72,s);
    I*=1.-min(.9,.5*pen*(1.+uSp));I*=1.-min(.9,.55*umb*(1.+uSp));
    I+=.14*w*smoothstep(.54,.60,s)*(1.-pen)*(1.-mu);
    float limb=1.-.62*(1.-mu);
    vec3 hot=vec3(1.,.96,.86),cool=vec3(1.,.50,.16);
    vec3 col=mix(cool,hot,pow(mu,.45))*I*limb*1.1*(1.+uBr);
    gl_FragColor=vec4(col,1.);}`
 });
 const sunGeo=new THREE.SphereGeometry(SR,96,64);geos.push(sunGeo);mats.push(sunM);
 const sunMesh=new THREE.Mesh(sunGeo,sunM);sunG.add(sunMesh);

 /* corona: a camera-facing glow that falls off roughly with distance, brightest along the equator (streamers) */
 const CW=5.5,q0=1/CW;
 const cc=document.createElement('canvas');cc.width=cc.height=256;
 const cg=cc.getContext('2d'),im=cg.createImageData(256,256),d=im.data;
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){
  const dx=(x-127.5)/128,dy=(y-127.5)/128,q=Math.hypot(dx,dy),i=(y*256+x)*4;
  d[i]=255;d[i+1]=236;d[i+2]=205;d[i+3]=0;
  if(q<q0||q>=1)continue;
  const a=Math.atan2(dy,dx);
  const stream=(.35+.65*Math.pow(Math.abs(Math.cos(a)),1.5))*(.75+.25*Math.sin(a*7+1.3)*Math.sin(a*3.1));
  let I=Math.pow(q0/q,2.4)*stream;
  const k=Math.min(1,Math.max(0,(q-.6)/.4));I*=1-k*k*(3-2*k);
  d[i+3]=Math.round(255*Math.min(1,I*.8));
 }
 cg.putImageData(im,0,0);
 const coT=new THREE.CanvasTexture(cc);tex.push(coT);
 const cor=new THREE.Sprite(new THREE.SpriteMaterial({map:coT,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));
 mats.push(cor.material);cor.scale.set(SR*2*CW,SR*2*CW,1);root.add(cor);

 /* prominences: loops of plasma arching out of the surface along magnetic field lines */
 const proms=[];
 const prom=(lat,lon,r,ph)=>{
  const P=new THREE.Vector3(Math.cos(lat)*Math.cos(lon),Math.sin(lat),Math.cos(lat)*Math.sin(lon));
  const tg=new THREE.Vector3(0,1,0).cross(P).normalize(),bn=tg.clone().cross(P);
  const g=new THREE.TorusGeometry(SR*r,SR*.012,8,28,PI),m=new THREE.MeshBasicMaterial({color:0xff5a2a,transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false});
  geos.push(g);mats.push(m);
  const me=new THREE.Mesh(g,m);
  me.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(tg,P,bn));
  me.position.copy(P).multiplyScalar(SR*.995);me.scale.set(1,1.5,1);sunG.add(me);proms.push({m,ph});
 };
 prom(.35,.4,.14,0);prom(-.45,2.2,.18,1.7);prom(.1,3.9,.12,3.1);prom(-.2,5.3,.16,4.4);prom(.6,1.4,.1,2.3);

 /* ---------- the swarm: thousands of collectors, each on its own orbit ----------
    Every collector is one instance of a flat hexagon. Its whole orbit is worked out on the graphics chip from a few
    numbers (radius, tilt, node, phase, speed), so thousands of them cost almost nothing to animate.
    Three layers at different distances, tilted every which way, so no two paths cross.
    Orbit speed follows Kepler: closer in is faster. Time is much faster than real. */
 const N=9000,RS=SR*SW,W0=.06;
 const rng=(s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296})(20261120);
 const orb=new Float32Array(N*4),mot=new Float32Array(N*2),lay=new Float32Array(N);
 for(let i=0;i<N;i++){
  const L=Math.floor(rng()*3),r=RS*(.80+.20*L)*(1+(rng()-.5)*.08);
  orb[i*4]=r;orb[i*4+1]=Math.acos(1-2*rng());orb[i*4+2]=rng()*PI*2;orb[i*4+3]=rng()*PI*2;
  mot[i*2]=W0*Math.pow(r/RS,-1.5);mot[i*2+1]=.12+.14*rng();lay[i]=L;
 }
 const base=new THREE.PlaneGeometry(2,2),sg=new THREE.InstancedBufferGeometry();
 sg.index=base.index;sg.setAttribute('position',base.attributes.position);sg.setAttribute('uv',base.attributes.uv);
 sg.setAttribute('aOrb',new THREE.InstancedBufferAttribute(orb,4));
 sg.setAttribute('aMot',new THREE.InstancedBufferAttribute(mot,2));
 sg.setAttribute('aLay',new THREE.InstancedBufferAttribute(lay,1));
 sg.instanceCount=N;geos.push(sg,base);
 const swM=new THREE.ShaderMaterial({side:THREE.DoubleSide,
  uniforms:{t:{value:0},uEx:{value:0},uSel:{value:0},uPulse:{value:0}},
  vertexShader:`attribute vec4 aOrb;attribute vec2 aMot;attribute float aLay;
   uniform float t,uEx;varying vec2 vUv;varying vec3 vN,vW;varying float vLay,vPh;
   void main(){
    float a=aOrb.w+aMot.x*t;
    float r=aOrb.x*(1.+uEx*(aLay-1.)*.35);
    vec3 p=vec3(cos(a),0.,sin(a))*r;
    float ci=cos(aOrb.y),si=sin(aOrb.y);
    p=vec3(p.x,p.y*ci-p.z*si,p.y*si+p.z*ci);
    float cn=cos(aOrb.z),sn=sin(aOrb.z);
    p=vec3(p.x*cn+p.z*sn,p.y,-p.x*sn+p.z*cn);
    vec3 n=normalize(p);
    vec3 up=abs(n.y)>.99?vec3(1.,0.,0.):vec3(0.,1.,0.);
    vec3 tg=normalize(cross(up,n)),bn=cross(n,tg);
    vec3 w=p+(tg*position.x+bn*position.y)*aMot.y;
    vec4 wp=modelMatrix*vec4(w,1.);
    vUv=uv;vN=normalize(mat3(modelMatrix)*n);vW=wp.xyz;vLay=aLay;vPh=aOrb.w;
    gl_Position=projectionMatrix*viewMatrix*wp;}`,
  fragmentShader:`uniform float t,uSel,uPulse;varying vec2 vUv;varying vec3 vN,vW;varying float vLay,vPh;
   void main(){
    vec2 p=abs(vUv-.5)*2.;
    float d=max(p.x*.866+p.y*.5,p.y);
    if(d>.98)discard;
    vec3 n=normalize(vN),v=normalize(cameraPosition-vW);
    float fc=dot(n,v);
    float tw=pow(.5+.5*sin(vPh*5.+t*2.5),10.);
    vec3 col;
    if(fc<0.){col=mix(vec3(1.,.78,.42),vec3(1.,.97,.85),tw)*(.75+.5*abs(fc)+.9*tw);}
    else{col=vec3(.10,.12,.18)+vec3(.35,.25,.18)*pow(1.-fc,3.);}
    col*=1.-.5*smoothstep(.82,.98,d);
    if(uSel>.5&&uSel<1.5)col+=vec3(.45,.6,1.)*uPulse*.6;
    if(uSel>1.5){vec3 lc=vLay<.5?vec3(.35,.9,1.):(vLay<1.5?vec3(1.,.8,.3):vec3(1.,.4,.9));col=mix(col,lc*(.6+.5*abs(fc)),.7);}
    gl_FragColor=vec4(col,1.);}`
 });
 mats.push(swM);
 const swarm=new THREE.Mesh(sg,swM);swarm.frustumCulled=false;root.add(swarm);

 /* ---------- the nexus: how the power moves ----------
    320 of the collectors are feeding power: each beams to the nearest relay it can see.
    12 relay nodes orbit in the middle layer and pass the power to the gateway, a station held beyond the swarm.
    The Sun blocks the line of sight to the far side, so a relay that cannot see the gateway hands its power to one that can.
    The gateway fires the trunk beam toward the hub (built in Phase 4).
    The orbit maths below is the same as the swarm's shader, run on the CPU for just these few hundred objects. */
 const BN=320,K=12,GX=RS*T.GATE_K,HX=GX+T.HUB_D,R2=Math.pow(SR*1.08,2);
 const opos=(r0,inc,node,ph,w,L,t,ex,out,o)=>{
  const a=ph+w*t,r=r0*(1+ex*(L-1)*.35),x=Math.cos(a)*r,z=Math.sin(a)*r,ci=Math.cos(inc),si=Math.sin(inc),z2=z*ci,y2=-z*si,cn=Math.cos(node),sn=Math.sin(node);
  out[o]=x*cn+z2*sn;out[o+1]=y2;out[o+2]=-x*sn+z2*cn;
 };
 /* does the straight line from A to B stay clear of the Sun? */
 const clear=(ax,ay,az,bx,by,bz)=>{
  const dx=bx-ax,dy=by-ay,dz=bz-az,dd=dx*dx+dy*dy+dz*dz;
  let t=dd>0?-(ax*dx+ay*dy+az*dz)/dd:0;t=t<0?0:t>1?1:t;
  const cx=ax+t*dx,cy=ay+t*dy,cz=az+t*dz;return cx*cx+cy*cy+cz*cz>R2;
 };
 const cp=new Float32Array(BN*3),rp=new Float32Array(K*3);
 const rinc=[],rnode=[],rph=[];
 for(let j=0;j<K;j++){rinc.push(Math.acos(1-2*(j+.5)/K));rnode.push(j*2.399963);rph.push(j*2.399963*1.7)}
 const cur=new Int16Array(BN).fill(-1),hop=new Int16Array(K),relOK=new Uint8Array(K),baseL=new Float32Array(K),totL=new Float32Array(K);
 const SEG=BN+K,lp=new Float32Array(SEG*6),lw=new Float32Array(SEG*2),wc=new Float32Array(SEG);
 const ls=new Float32Array(SEG*2),lph=new Float32Array(SEG*2),lk=new Float32Array(SEG*2);
 for(let i=0;i<SEG;i++){ls[i*2]=0;ls[i*2+1]=1;lph[i*2]=lph[i*2+1]=rng();lk[i*2]=lk[i*2+1]=i<BN?0:1}
 const lg=new THREE.BufferGeometry();
 const lpA=new THREE.BufferAttribute(lp,3),lwA=new THREE.BufferAttribute(lw,1);lpA.setUsage(THREE.DynamicDrawUsage);lwA.setUsage(THREE.DynamicDrawUsage);
 lg.setAttribute('position',lpA);lg.setAttribute('aW',lwA);
 lg.setAttribute('aS',new THREE.BufferAttribute(ls,1));lg.setAttribute('aPh',new THREE.BufferAttribute(lph,1));lg.setAttribute('aK',new THREE.BufferAttribute(lk,1));
 geos.push(lg);
 const lineM=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  uniforms:{t:{value:0},uBoost:{value:0}},
  vertexShader:`attribute float aS,aW,aPh,aK;varying float vS,vW,vPh,vK;
   void main(){vS=aS;vW=aW;vPh=aPh;vK=aK;gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform float t,uBoost;varying float vS,vW,vPh,vK;
   void main(){
    if(vW<.02)discard;
    float pulse=pow(.5+.5*sin(6.2832*(vS*2.-t*.7+vPh)),8.);
    float b=(.14+.86*pulse)*vW*(1.+uBoost);
    vec3 c=mix(vec3(1.,.82,.45),vec3(.4,.9,1.),vK);
    c=mix(c,vec3(1.),pulse*.6);
    gl_FragColor=vec4(c,min(1.,b));}`});
 mats.push(lineM);
 const lines=new THREE.LineSegments(lg,lineM);lines.frustumCulled=false;root.add(lines);

 /* glow dots on the collectors that are feeding power */
 const pg=new THREE.BufferGeometry(),pA=new Float32Array(BN),pPos=new THREE.BufferAttribute(cp,3);pPos.setUsage(THREE.DynamicDrawUsage);
 const pAA=new THREE.BufferAttribute(pA,1);pAA.setUsage(THREE.DynamicDrawUsage);
 pg.setAttribute('position',pPos);pg.setAttribute('aA',pAA);geos.push(pg);
 const dotM=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  uniforms:{uBoost:{value:0}},
  vertexShader:`attribute float aA;uniform float uBoost;varying float vA;
   void main(){vA=aA;vec4 mv=viewMatrix*modelMatrix*vec4(position,1.);gl_PointSize=clamp(300./-mv.z,2.5,9.)*(1.+uBoost*.5);gl_Position=projectionMatrix*mv;}`,
  fragmentShader:`varying float vA;
   void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;float a=(1.-r*r)*vA;gl_FragColor=vec4(vec3(1.,.85,.5)*a,a);}`});
 mats.push(dotM);
 const dots=new THREE.Points(pg,dotM);dots.frustumCulled=false;root.add(dots);

 /* soft glow shared by the relays, the gateway and the hub site */
 const gc=document.createElement('canvas');gc.width=gc.height=64;
 const gx=gc.getContext('2d'),gr=gx.createRadialGradient(32,32,0,32,32,32);
 gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.25,'rgba(255,255,255,.5)');gr.addColorStop(1,'rgba(255,255,255,0)');
 gx.fillStyle=gr;gx.fillRect(0,0,64,64);
 const glowT=new THREE.CanvasTexture(gc);tex.push(glowT);
 const glow=(col,sz)=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowT,color:col,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));mats.push(s.material);s.scale.set(sz,sz,1);return s};

 /* relay nodes */
 const relayG=new THREE.Group();root.add(relayG);
 const rGeo=new THREE.OctahedronGeometry(.55,0),rMat=new THREE.MeshBasicMaterial({color:0xbff6ff});geos.push(rGeo);mats.push(rMat);
 const relays=[];
 for(let j=0;j<K;j++){const g=new THREE.Group(),m=new THREE.Mesh(rGeo,rMat);g.add(m);const gl=glow(0x5de8ff,4);g.add(gl);relayG.add(g);relays.push({g,gl})}

 /* gateway: a hexagonal dish held in place by light pressure, facing the hub */
 const gate=new THREE.Group();gate.position.set(GX,0,0);root.add(gate);
 const gGeo=new THREE.CylinderGeometry(2.3,2.3,.25,6),gMat=new THREE.MeshBasicMaterial({color:0xe6c070}),
  rnGeo=new THREE.TorusGeometry(2.9,.09,8,40),rnMat=new THREE.MeshBasicMaterial({color:0x7fe9ff}),
  cGeo=new THREE.SphereGeometry(.6,16,12),cMat=new THREE.MeshBasicMaterial({color:0xffffff});
 geos.push(gGeo,rnGeo,cGeo);mats.push(gMat,rnMat,cMat);
 const dish=new THREE.Mesh(gGeo,gMat);dish.rotation.z=PI/2;gate.add(dish);
 const ring=new THREE.Mesh(rnGeo,rnMat);ring.rotation.y=PI/2;gate.add(ring);
 const core=new THREE.Mesh(cGeo,cMat);core.position.x=.5;gate.add(core);
 gate.add(glow(0x9ff2ff,9));

 /* trunk beam: from the gateway to the hub. The widening is exaggerated so you can see it. */
 const TL=HX-15.7-GX,tGeo=new THREE.CylinderGeometry(4.5,.55,TL,28,1,true);geos.push(tGeo);
 const trunkM=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
  uniforms:{t:{value:0},uLoad:{value:.5},uBoost:{value:0}},
  vertexShader:`varying vec2 vUv;varying vec3 vN,vW;
   void main(){vUv=uv;vN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
  fragmentShader:`uniform float t,uLoad,uBoost;varying vec2 vUv;varying vec3 vN,vW;
   void main(){
    vec3 n=normalize(vN),v=normalize(cameraPosition-vW);
    float edge=pow(abs(dot(n,v)),1.4);
    float pulse=.5+.5*sin(6.2832*(vUv.y*9.-t*.6));
    float fade=smoothstep(0.,.06,vUv.y)*(1.-.35*vUv.y);
    float a=(.18+.4*pulse)*edge*fade*(.35+.65*uLoad)*(1.+uBoost);
    gl_FragColor=vec4(mix(vec3(.45,.9,1.),vec3(1.),pulse*.5),min(1.,a));}`});
 mats.push(trunkM);
 const trunk=new THREE.Mesh(tGeo,trunkM);trunk.rotation.z=-PI/2;trunk.position.set(GX+TL/2,0,0);root.add(trunk);

 /* hub site: a marker where the hub ship will be built in Phase 4 */
 const hGeo=new THREE.TorusGeometry(7,.1,8,56),hMat=new THREE.MeshBasicMaterial({color:0xffc870,transparent:true,opacity:.35});geos.push(hGeo);mats.push(hMat);
 /* (the Phase 3 hub-site marker is gone: the hub itself is built below) */
 /* ---------- the hub ship ----------
    Built along the X axis. The receiver faces the gateway (toward the Sun), the emitter faces Earth.
    Drawn at about 167 m per unit: the receiver is 3 km across. Lit by the Sun from the left. */
 const hub=new THREE.Group();hub.position.set(HX,0,0);root.add(hub);
 root.add(new THREE.PointLight(0xfff1dc,2.4,0,0));root.add(new THREE.AmbientLight(0x6a7a96,.55));
 const hubParts={},HS=['receiver','core','dock','gantry','fab','radiators','emitter','traffic'],R90=PI/2,V3=THREE.Vector3,UP=new V3(0,1,0);
 const HM=(c,o)=>{const m=new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.5,metalness:.45,emissive:c,emissiveIntensity:.06},o));m.userData.ei=m.emissiveIntensity;mats.push(m);return m};
 const HB=(c,o)=>{const m=new THREE.MeshBasicMaterial(Object.assign({color:c},o));mats.push(m);return m};
 const hubPart=(id,dx,dy,dz)=>{const g=new THREE.Group();g.userData={dir:new V3(dx,dy,dz),ms:[]};hubParts[id]=g;hub.add(g);return g};
 const track=(g,m)=>{if(g.userData.ms&&m.emissive&&g.userData.ms.indexOf(m)<0)g.userData.ms.push(m)};
 const hadd=(g,geo,m,x,y,z,rx,ry,rz)=>{geos.push(geo);const me=new THREE.Mesh(geo,m);me.position.set(x||0,y||0,z||0);me.rotation.set(rx||0,ry||0,rz||0);g.add(me);track(g,m);return me};
 const rod=(g,ax,ay,az,bx,by,bz,r,m)=>{const v=new V3(bx-ax,by-ay,bz-az),len=v.length(),geo=new THREE.CylinderGeometry(r,r,len,6);geos.push(geo);
  const me=new THREE.Mesh(geo,m);me.position.set((ax+bx)/2,(ay+by)/2,(az+bz)/2);me.quaternion.setFromUnitVectors(UP,v.normalize());g.add(me);track(g,m);return me};
 const frame=(g,x0,x1,y0,y1,z0,z1,r,m)=>{
  for(const y of[y0,y1])for(const z of[z0,z1])rod(g,x0,y,z,x1,y,z,r,m);
  for(const x of[x0,x1])for(const z of[z0,z1])rod(g,x,y0,z,x,y1,z,r,m);
  for(const x of[x0,x1])for(const y of[y0,y1])rod(g,x,y,z0,x,y,z1,r,m)};
 const TG=(a,b,s,t)=>new THREE.TorusGeometry(a,b,s||8,t||56),CYG=(a,b,h,s)=>new THREE.CylinderGeometry(a,b,h,s||16);
 const hbody=HM('#cfd6e4'),hdark=HM('#2a3350',{metalness:.6}),hgold=HM('#c8a24a',{metalness:.7,emissiveIntensity:.12});
 const hplate=HM('#e8c470',{side:THREE.DoubleSide,metalness:.8,emissiveIntensity:.25});
 const pvM=HM('#ffffff',{emissive:'#2a6cff',emissiveIntensity:.1,metalness:.3,roughness:.35});
 const mirM=HM('#ffffff',{emissive:'#ffcf70',emissiveIntensity:.05,metalness:.9,roughness:.25});
 const radM=HM('#e6ebf3',{emissive:'#ff7a2b',emissiveIntensity:.15,metalness:.2});
 const pipeM=HM('#ff9a4a',{emissive:'#ff7a2b',emissiveIntensity:.8});
 const hcy=HB('#5df2ff'),hgr=HB('#7dff9a'),ham=HB('#ffb84d'),hsp=HB('#ff9a4a');

 /* a dish of hexagon tiles; face -1 curves it to catch light from the left, +1 to send it right */
 const hexTiles=(g,mat,R,cx,face,curv,pitch,tr,cols)=>{
  const geo=new THREE.CylinderGeometry(tr,tr,.22,6);geos.push(geo);
  const n=Math.ceil(R/pitch),pts=[];
  for(let row=-n;row<=n;row++)for(let col=-n;col<=n;col++){const y=row*pitch*.866,z=col*pitch+(row&1?pitch/2:0);if(Math.hypot(y,z)<=R)pts.push([y,z])}
  const mesh=new THREE.InstancedMesh(geo,mat,pts.length),dm=new THREE.Object3D(),c=new THREE.Color();dm.rotation.z=R90;
  pts.forEach((p,i)=>{dm.position.set(cx+face*(p[0]*p[0]+p[1]*p[1])*curv,p[0],p[1]);dm.updateMatrix();mesh.setMatrixAt(i,dm.matrix);
   const v=rng();c.setRGB(cols[0]+cols[3]*v,cols[1]+cols[4]*v,cols[2]+cols[5]*v);mesh.setColorAt(i,c)});
  mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;mesh.frustumCulled=false;g.add(mesh);track(g,mat);return mesh};
 /* a soft glowing disc that shows power flowing through the receiver or the emitter */
 const disc=(rad,col)=>{
  const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
   uniforms:{t:{value:0},uL:{value:.5},uDir:{value:1},c:{value:new THREE.Color(col)}},
   vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:'uniform float t,uL,uDir;uniform vec3 c;varying vec2 vUv;void main(){float r=length(vUv-.5)*2.;if(r>1.)discard;float a=(1.-r*r)*.55*(.3+.7*uL)*(.75+.25*sin(r*16.-uDir*t*3.));gl_FragColor=vec4(c,a);}'});
  const g=new THREE.CircleGeometry(rad,48);geos.push(g);mats.push(m);return {m,mesh:new THREE.Mesh(g,m)}};

 /* receiver array: catches the trunk beam */
 const rc=hubPart('receiver',-1,0,0);
 hexTiles(rc,pvM,9,-14,-1,.012,1.08,.58,[.05,.11,.28,.05,.08,.14]);
 hadd(rc,TG(9.3,.16),hbody,-15,0,0,0,R90,0);hadd(rc,TG(4.6,.1),hbody,-14.3,0,0,0,R90,0);
 for(let k=0;k<12;k++){const a=k/12*PI*2;rod(rc,-14,0,0,-15,Math.cos(a)*9.3,Math.sin(a)*9.3,.08,hdark)}
 hadd(rc,CYG(1.8,1.8,2.2,16),hdark,-13.2,0,0,0,0,R90);
 const rd=disc(8.6,'#6fe3ff');rd.mesh.rotation.y=-R90;rd.mesh.position.set(-15.6,0,0);rc.add(rd.mesh);

 /* power core: the spine and the converter drums */
 const hc=hubPart('core',0,0,0);
 rod(hc,-13,0,0,17,0,0,1.5,hbody);
 for(const x of[-10,-6,-2,6,10,14])hadd(hc,TG(1.9,.1,6,32),hgold,x,0,0,0,R90,0);
 for(let k=0;k<6;k++){const a=k/6*PI*2,y=Math.cos(a)*3.4,z=Math.sin(a)*3.4;rod(hc,-9,y,z,-3,y,z,.9,hgold);rod(hc,-6,0,0,-6,y,z,.12,hdark)}
 hadd(hc,TG(3.4,.1,6,40),hdark,-9,0,0,0,R90,0);hadd(hc,TG(3.4,.1,6,40),hdark,-3,0,0,0,R90,0);
 for(let k=0;k<4;k++){const a=k*R90+PI/4;hadd(hc,new THREE.BoxGeometry(3,1.2,1.2),hdark,11,Math.cos(a)*2.8,Math.sin(a)*2.8)}

 /* dock ring with 16 ports */
 const hd=hubPart('dock',0,0,0);
 hadd(hd,TG(11,.9,12,72),hbody,2,0,0,0,R90,0);hadd(hd,TG(11,.05,6,72),hcy,2,0,0,0,R90,0).position.x=3;
 for(let k=0;k<6;k++){const a=k/6*PI*2;rod(hd,2,0,0,2,Math.cos(a)*11,Math.sin(a)*11,.35,hdark)}
 for(let k=0;k<16;k++){const a=k/16*PI*2+.1,ca=Math.cos(a),sa=Math.sin(a);
  rod(hd,2,ca*11.5,sa*11.5,2,ca*13.4,sa*13.4,.55,hbody);
  hadd(hd,new THREE.SphereGeometry(.2,8,6),k%2?hgr:ham,2,ca*13.7,sa*13.7)}

 /* repair gantry with two robot arms, holding a damaged collector */
 const hg=hubPart('gantry',0,1,0);
 frame(hg,-4,8,13,25,-6,6,.18,hdark);
 for(const s of[-1,1])rod(hg,2,11.9,s*1.8,2,13,s*3,.3,hbody);
 hadd(hg,new THREE.CircleGeometry(4.2,6),hplate,2,19,0,0,R90,0);
 const arms=[];
 for(const s of[-1,1]){
  const a1=new THREE.Group();a1.position.set(2,25,s*5.6);hg.add(a1);rod(a1,0,0,0,0,-6,0,.28,hbody);
  const a2=new THREE.Group();a2.position.set(0,-6,0);a1.add(a2);rod(a2,0,0,0,0,-5,0,.22,hbody);
  hadd(a2,new THREE.SphereGeometry(.3,10,8),hsp,0,-5,0);arms.push({a1,a2,s})}

 /* fabrication bay: new collectors are made and sent out toward the swarm */
 const hf=hubPart('fab',0,-1,0);
 frame(hf,-14,10,-25,-13,-6,6,.18,hdark);
 for(const s of[-1,1])rod(hf,-14,-19,s*3.2,2.5,-19,s*3.2,.15,hbody);
 for(let k=0;k<8;k++)hadd(hf,new THREE.CircleGeometry(3.6,6),hplate,3+k*.9,-19,0,0,R90,0);
 const outs=[];for(let k=0;k<6;k++)outs.push(hadd(hf,new THREE.CircleGeometry(3.6,6),hplate,-8,-19,0,0,R90,0));

 /* radiator wings: held edge-on to the Sun, shed the hub's waste heat */
 const hr=hubPart('radiators',-.6,0,0);
 for(const s of[-1,1]){
  hadd(hr,new THREE.BoxGeometry(12,.2,22),radM,-7,0,s*15.6);
  for(let k=0;k<7;k++){const x=-7+(k-3)*1.7;rod(hr,x,.15,s*4.8,x,.15,s*26.4,.1,pipeM)}
  rod(hr,-12,0,s*4.6,-2,0,s*4.6,.4,hdark);rod(hr,-6,0,s*1.5,-6,0,s*4.6,.25,hdark)}

 /* emitter mirror: sends the beam on toward Earth */
 const he=hubPart('emitter',1,0,0);
 rod(he,17,0,0,18,0,0,1.5,hbody);
 hexTiles(he,mirM,7.5,18,1,.011,1.08,.58,[.75,.7,.55,.2,.2,.2]);
 hadd(he,TG(7.7,.16,8,48),hbody,18.7,0,0,0,R90,0);
 for(let k=0;k<8;k++){const a=k/8*PI*2;rod(he,18,0,0,18.7,Math.cos(a)*7.7,Math.sin(a)*7.7,.08,hdark)}
 for(let k=0;k<3;k++){const a=k/3*PI*2;rod(he,18.7,Math.cos(a)*7.7,Math.sin(a)*7.7,29,0,0,.12,hdark)}
 hadd(he,new THREE.SphereGeometry(.9,16,12),hgold,29,0,0).scale.x=.4;
 const ed=disc(7.4,'#ffd48a');ed.m.uniforms.uDir.value=-1;ed.mesh.rotation.y=R90;ed.mesh.position.set(19.6,0,0);he.add(ed.mesh);

 /* repair ships: out from a port to the swarm, work there, and home again */
 const ht=hubPart('traffic',0,0,0);
 const ships=[];
 for(let k=0;k<8;k++){
  const g=new THREE.Group();g.userData={ms:[]};
  hadd(g,new THREE.BoxGeometry(.5,.35,1.2),hbody,0,0,0);hadd(g,new THREE.BoxGeometry(1.3,.05,.4),hdark,0,0,.1);
  hadd(g,CYG(.12,.2,.3,8),hdark,0,0,-.7,R90,0,0);
  const eg=glow(0x9fe8ff,1.6);eg.position.set(0,0,-.95);g.add(eg);g.scale.setScalar(1.4);ht.add(g);
  const a=k/8*PI*2+.3,ca=Math.cos(a),sa=Math.sin(a);
  ships.push({g,eg,off:k*5,P0:new V3(2,ca*13.9,sa*13.9),C:new V3(-6,ca*30,sa*30),T:new V3(-66-6*rng(),(rng()-.5)*26,(rng()-.5)*26)})}
 const bz=(s,u,out)=>{const w=1-u;out.set(w*w*s.P0.x+2*w*u*s.C.x+u*u*s.T.x,w*w*s.P0.y+2*w*u*s.C.y+u*u*s.T.y,w*w*s.P0.z+2*w*u*s.C.z+u*u*s.T.z);return out};
 const sP=new V3(),sQ=new V3(),Z=new V3(0,0,1);

 const heavy=(x)=>Math.min(1,x/(BN/4));
 let rot=0,ex=0,gl=.5,glOut=.5;
 return {
  update(dt,time,o){
   const pulse=.5+.5*Math.sin(time*7),sel=o.sel;
   ex+=(o.explode-ex)*Math.min(1,dt*5);
   /* sun */
   sunM.uniforms.t.value=time;
   sunM.uniforms.uBr.value=sel==='photosphere'?.3*pulse:0;
   sunM.uniforms.uSp.value=sel==='spots'?1.5*pulse:0;
   rot+=dt*.03;sunG.rotation.y=rot;
   for(const p of proms)p.m.opacity=Math.min(1,.55+.3*Math.sin(time*.8+p.ph)+(sel==='prominences'?.35*pulse:0));
   const cs=SR*2*CW*(1+(sel==='corona'?.06*pulse:0));cor.scale.set(cs,cs,1);
   /* swarm */
   swM.uniforms.t.value=time;swM.uniforms.uEx.value=ex;
   swM.uniforms.uSel.value=sel==='collectors'?1:sel==='shells'?2:0;swM.uniforms.uPulse.value=pulse;

   /* nexus: positions of the feeding collectors and the relays */
   for(let c=0;c<BN;c++)opos(orb[c*4],orb[c*4+1],orb[c*4+2],orb[c*4+3],mot[c*2],lay[c],time,ex,cp,c*3);
   for(let j=0;j<K;j++){opos(RS,rinc[j],rnode[j],rph[j],W0,1,time,ex,rp,j*3);relays[j].g.position.set(rp[j*3],rp[j*3+1],rp[j*3+2])}
   /* which relays can see the gateway, and who hands over to whom */
   for(let j=0;j<K;j++)relOK[j]=clear(rp[j*3],rp[j*3+1],rp[j*3+2],GX,0,0)?1:0;
   for(let j=0;j<K;j++){hop[j]=-1;baseL[j]=0;
    if(!relOK[j]){let bd=1e9;for(let k=0;k<K;k++){if(!relOK[k])continue;
      const dx=rp[j*3]-rp[k*3],dy=rp[j*3+1]-rp[k*3+1],dz=rp[j*3+2]-rp[k*3+2],dd=dx*dx+dy*dy+dz*dz;
      if(dd<bd&&clear(rp[j*3],rp[j*3+1],rp[j*3+2],rp[k*3],rp[k*3+1],rp[k*3+2])){bd=dd;hop[j]=k}}}}
   /* each feeding collector picks the nearest relay it can see, and keeps it until a clearly better one appears */
   for(let c=0;c<BN;c++){
    const x=cp[c*3],y=cp[c*3+1],z=cp[c*3+2];let best=-1,bd=1e9,cd=1e9;
    for(let j=0;j<K;j++){
     if(!clear(x,y,z,rp[j*3],rp[j*3+1],rp[j*3+2]))continue;
     const dx=x-rp[j*3],dy=y-rp[j*3+1],dz=z-rp[j*3+2],dd=dx*dx+dy*dy+dz*dz;
     if(dd<bd){bd=dd;best=j}if(j===cur[c])cd=dd}
    cur[c]=(cd<1e9&&cd<bd*1.56)?cur[c]:best;
    if(cur[c]>=0)baseL[cur[c]]++;
   }
   for(let j=0;j<K;j++)totL[j]=baseL[j];
   for(let j=0;j<K;j++)if(hop[j]>=0)totL[hop[j]]+=baseL[j];
   let gSum=0;for(let j=0;j<K;j++)if(relOK[j])gSum+=totL[j];
   gl+=(gSum/BN-gl)*Math.min(1,dt*3);

   /* line positions and brightness; links fade in and out smoothly */
   const ease=Math.min(1,dt*6);
   for(let c=0;c<BN;c++){
    const j=cur[c],o6=c*6;
    lp[o6]=cp[c*3];lp[o6+1]=cp[c*3+1];lp[o6+2]=cp[c*3+2];
    if(j>=0){lp[o6+3]=rp[j*3];lp[o6+4]=rp[j*3+1];lp[o6+5]=rp[j*3+2]}else{lp[o6+3]=lp[o6];lp[o6+4]=lp[o6+1];lp[o6+5]=lp[o6+2]}
    wc[c]+=((j>=0?.32:0)-wc[c])*ease;lw[c*2]=lw[c*2+1]=wc[c];pA[c]=wc[c]/.32;
   }
   for(let j=0;j<K;j++){
    const i=BN+j,o6=i*6;let tw=0;
    lp[o6]=rp[j*3];lp[o6+1]=rp[j*3+1];lp[o6+2]=rp[j*3+2];
    if(relOK[j]){lp[o6+3]=GX;lp[o6+4]=0;lp[o6+5]=0;tw=.4+.6*heavy(totL[j])}
    else if(hop[j]>=0){const k=hop[j];lp[o6+3]=rp[k*3];lp[o6+4]=rp[k*3+1];lp[o6+5]=rp[k*3+2];tw=.4+.6*heavy(baseL[j])}
    else{lp[o6+3]=lp[o6];lp[o6+4]=lp[o6+1];lp[o6+5]=lp[o6+2]}
    wc[i]+=(tw-wc[i])*ease;lw[i*2]=lw[i*2+1]=wc[i];
   }
   lpA.needsUpdate=true;lwA.needsUpdate=true;pPos.needsUpdate=true;pAA.needsUpdate=true;
   lineM.uniforms.t.value=time;lineM.uniforms.uBoost.value=sel==='beams'?1.2*pulse:0;
   dotM.uniforms.uBoost.value=sel==='beams'?pulse:0;
   const rs=sel==='relays'?1+.5*pulse:1;
   for(const r of relays){r.g.scale.setScalar(rs);r.g.rotation.y=time*.8}
   const gs=sel==='gateway'?1+.15*pulse:1;gate.scale.setScalar(gs);ring.rotation.x=time*.4;
   trunkM.uniforms.t.value=time;trunkM.uniforms.uLoad.value=gl;trunkM.uniforms.uBoost.value=sel==='gateway'?.8*pulse:0;
   /* hub: power glows follow the load, the emitter lags the receiver, parts pull apart and pulse when selected */
   glOut+=(gl-glOut)*Math.min(1,dt*.8);
   radM.userData.ei=.15+.8*gl;pvM.userData.ei=.08+.5*gl;mirM.userData.ei=.05+.45*glOut;
   for(const id of HS){const g=hubParts[id],dv=g.userData.dir,pl=sel===id?.5+.5*Math.sin(time*7):0;
    g.position.set(dv.x*ex*7,dv.y*ex*7,dv.z*ex*7);
    for(const m of g.userData.ms)m.emissiveIntensity=(m.userData.ei||0)+pl*.6}
   rd.m.uniforms.t.value=time;rd.m.uniforms.uL.value=gl;ed.m.uniforms.t.value=time;ed.m.uniforms.uL.value=glOut;
   for(const a of arms){a.a1.rotation.z=a.s*.35*Math.sin(time*.7+a.s);a.a1.rotation.x=.25*Math.sin(time*.5+a.s*2);a.a2.rotation.z=-a.s*.5*Math.sin(time*.9+1)}
   for(let k=0;k<outs.length;k++){const tr=(time*1.6+k*5)%30,sc=Math.min(1,tr/3)*(1-Math.pow(Math.min(1,Math.max(0,(tr-24)/6)),2));
    outs[k].position.x=2-tr;outs[k].scale.setScalar(Math.max(.001,sc))}
   for(const s of ships){
    const ph=((time+s.off)/40)%1;let u,sp,dir=1;
    if(ph<.07){u=0;sp=0}
    else if(ph<.5){const x=(ph-.07)/.43;u=x*x*(3-2*x);sp=Math.sin(PI*x)}
    else if(ph<.57){u=1;sp=0}
    else{const x=(ph-.57)/.43;u=1-x*x*(3-2*x);sp=Math.sin(PI*x);dir=-1}
    bz(s,u,sP);s.g.position.copy(sP);
    bz(s,Math.min(1,Math.max(0,u+dir*.01)),sQ);sQ.sub(sP);
    if(sQ.lengthSq()>1e-10)s.g.quaternion.setFromUnitVectors(Z,sQ.normalize());
    const e=.5+sp*2.4;s.eg.scale.set(e,e,1)}
   /* tapping a hub part moves the view over to the hub */
   const hubSel=HS.indexOf(sel)>=0;
   root.position.x+=((hubSel?-HX:0)-root.position.x)*Math.min(1,dt*3);
  },
  dispose(){geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());tex.forEach(t=>t.dispose())}
 };
}

Object.assign(T,{create});
})();
