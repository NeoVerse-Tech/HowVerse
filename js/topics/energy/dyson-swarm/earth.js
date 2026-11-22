/* Dyson swarm · Earth link (Phase 5). Loaded right after core.js.
   Adds: the Earth (the same generated planet as the Spaceship topic, sharper, with a night side and moving clouds),
   the Earth beam from the hub's emitter, and an ocean receiver array lit by the incoming beam.
   It plugs into world.js from outside: register.js calls T.makeEarth after T.create. world.js is not changed.
   Every number is computed from core.js and this file, so Learn and Parts can never disagree with the model. */
(function(){
const T=window.HV.T.dyson;
const {PI,SR,SW,GATE_K,HUB_D,HUBU,L1M,f,sci,comma}=T;

/* ---------- on-screen layout (scene units) ---------- */
const ER=26,RRAD=9,GAP=120;                       /* Earth radius, receiver radius, gap from the hub's emitter tip to Earth */
const HX=SR*SW*GATE_K+HUB_D;                      /* hub position: same formula as world.js */
const B0=HX+19.8,EX=HX+30+GAP+ER,B1=EX-ER-.3;     /* beam start (emitter face), Earth centre, beam end (receiver) */
const HUBSEL=['receiver','core','dock','gantry','fab','radiators','emitter','traffic'];
const EARTHSEL=['earth','atmosphere','oceanarray'];

/* ---------- the Earth beam: illustrative design values ----------
   The hub turns power into 5.8 GHz microwaves, which pass through cloud. The dish is the emitter, 15 units = about 2.5 km. */
const LAM=2.998e8/5.8e9,DISH=15*HUBU;
const w0=DISH/2,zR=PI*w0*w0/LAM,wE=w0*Math.sqrt(1+Math.pow(L1M/zR,2));   /* beam radius at Earth, metres */
const P=1.9e13,I0=2*P/(PI*wE*wE),SUNF=T.flux(1);                          /* peak intensity if all 19 TW went in one beam */
const SAFE=230;                                                            /* W/m², the centre density used in 1970s microwave studies */
const perBeam=SAFE*PI*wE*wE/2,NB=Math.ceil(P/perBeam);
const link={lambda:LAM,dish:DISH,L:L1M,spot:wE,I0,sunRatio:I0/SUNF,SAFE,perBeam,N:NB,area:PI*wE*wE};
T.link=link;

/* ---------- parts (labels: BUILT, PROPOSED, THEORETICAL) ---------- */
T.EARTH_EMITTER={id:'emitter',n:'Emitter dish',l:'THEORETICAL',
 d:'The tiled dish at the hub\'s Earth end. For this hop the hub turns its power into microwaves and the dish aims them at Earth, about '+f(L1M/1e9,1)+' million km away. Microwaves pass through cloud, which near-infrared light does not. It glows brighter when power is leaving. The beam itself is the Earth beam part.',
 k:[['Width',f(DISH/1e3,1)+' km'],['Sends','microwaves, 5.8 GHz'],['Aims at','the ocean receiver'],['Distance to Earth',f(L1M/1e9,1)+' million km']]};

T.EARTH_PARTS=[
 {id:'earth',n:'Earth',l:'BUILT',
  d:'The same generated Earth as in the Spaceship topic, drawn sharper. The sunlit side faces the Sun, which is to the far left. The dark side shows lights on the land. The lights follow this generated map, not the real cities. Earth is held still so the receiver stays under the beam. The real Earth spins once a day.',
  k:[['Radius','6,371 km'],['Sunlight here',comma(SUNF)+' W/m²'],['Spin','once a day (held still on screen)'],['Distance to hub',f(L1M/1e9,1)+' million km'],['Size on screen','compressed so it fits']]},

 {id:'atmosphere',n:'Atmosphere and cloud',l:'BUILT',
  d:'A thin layer of air and moving cloud. Cloud blocks light but microwaves pass through it with little loss, which is why the Earth beam uses them. Heavy rain absorbs some of a 5.8 GHz beam. Weather is one reason a real system would need several receiver sites.',
  k:[['Cloud','drifts on screen'],['Near-infrared light','blocked by cloud'],['Microwaves','mostly pass through'],['Heavy rain','absorbs some']]},

 {id:'downlink',n:'Earth beam',l:'THEORETICAL',
  d:'The beam from the hub to Earth. With a dish '+f(DISH/1e3,1)+' km wide and 5.8 GHz microwaves, it spreads to about '+f(wE*2/1e3,0)+' km wide at Earth. Sending all 19 TW in one beam would be about '+f(link.sunRatio,0)+' times as intense as sunlight at the centre, which is far too much. So the real design would split the power into around '+comma(NB)+' beams. On screen it is drawn as one beam so you can see it. Real microwaves are invisible.',
  k:[['Light','microwaves, '+f(LAM*100,1)+' cm'],['Dish',f(DISH/1e3,1)+' km'],['Beam at Earth',f(wE*2/1e3,0)+' km wide'],['One beam, 19 TW',f(link.sunRatio,0)+'× sunlight'],['Safe centre density','about '+link.SAFE+' W/m²'],['Beams needed','about '+comma(NB)]]},

 {id:'oceanarray',n:'Ocean receiver array',l:'THEORETICAL',
  d:'Floating platforms of rectennas, antennas that turn microwaves straight into electricity. The ocean has room, keeps the beam away from people, and the sea water helps cool the platforms. Small real tests exist: JAXA sent 1.8 kW to a receiver 55 m away in 2015, and Caltech\'s space solar demonstrator beamed a small amount of power in orbit in 2023. Nothing close to this size has been built. The glow shows how much power is arriving.',
  k:[['Platform','floating rectennas'],['Real tests','JAXA 2015, Caltech 2023'],['Receiver on screen','drawn far smaller than real'],['Power in','follows the trunk beam, delayed']]}
];

T.EARTH_LEARN=[
 {h:'From the hub to Earth',l:'THEORETICAL',p:[
  'At the hub the arriving light is turned into electricity, and then into a beam aimed at Earth. For this last hop the hub would use microwaves instead of light. Cloud blocks near-infrared light, but microwaves pass through it, so the power still arrives on a cloudy day.',
  'The hub sits about '+f(L1M/1e9,1)+' million km from Earth. The beam leaves a dish '+f(DISH/1e3,1)+' km wide. Microwaves have a much longer wavelength than light, so they spread more: the beam is about '+f(wE*2/1e3,0)+' km wide when it reaches Earth.']},

 {h:'The intensity problem',l:'THEORETICAL',p:[
  'Spreading is the easy part. Intensity is the hard part. If all 19 TW went down in one beam, the centre would be about '+f(link.sunRatio,0)+' times as bright as sunlight. That would heat and damage anything in the way.',
  'Studies of space solar power in the 1970s kept the centre of the beam near '+link.SAFE+' W/m². At that level one beam carries about '+f(perBeam/1e9,0)+' GW, so 19 TW needs around '+comma(NB)+' beams and as many receiver sites. A smaller share of the hub\'s power, sent down a few beams, would be a more realistic start.']},

 {h:'The ocean receiver',l:'THEORETICAL',p:[
  'Each receiver is a field of rectennas that turn microwaves into electricity. Putting them on floating platforms at sea gives them room and keeps the beam away from towns. Offshore platforms exist today, but not at this size.',
  'Beaming power is real but small so far. JAXA sent 1.8 kW over 55 m in 2015. In 2023 Caltech\'s space solar demonstrator sent a small amount of power between receivers in orbit. Going from those to terawatts is a very large step. On screen the receiver is drawn far smaller than the real one, and the beam is drawn as a single visible shaft.']},

 {h:'Earth on screen',l:'BUILT',p:[
  'The Earth is the same generated planet as in the Spaceship topic. Here it also has a night side with lights, a glint on the ocean, a sunset glow at the edge of the dark and clouds that drift over the surface.',
  'It is held still so the receiver stays under the beam. The real Earth spins once a day, so a real system would aim at a receiver that moves, or switch between several sites. Earth is also drawn far smaller than to scale next to the hub.']},

 {h:'Where this stands',l:'THEORETICAL',p:[
  'The Sun on screen follows measured values, and the orbits follow ordinary orbital physics. L1 and the docking and robot-arm technology have real precedents. But no collector, relay, gateway, hub or Earth receiver like the ones in this topic has been built. Everything about the swarm, the nexus, the hub ship and beaming power to Earth is a design study.',
  'The whole chain now runs from the Sun to the ocean on Earth. Tap a hub part or an Earth part and the view moves there. Distances are compressed so the whole system fits.']}
];

/* ---------- the 3D Earth ---------- */
T.makeEarth=function(THREE,root){
 const mats=[],geos=[],tex=[],sm=x=>x*x*(3-2*x);

 /* same value noise as the Spaceship Earth, so the continents match */
 const hs=(x,y,z)=>{const h=Math.sin(x*127.1+y*311.7+z*74.7)*43758.5453;return h-Math.floor(h)};
 const vn=(x,y,z)=>{const xi=Math.floor(x),yi=Math.floor(y),zi=Math.floor(z),u=sm(x-xi),v=sm(y-yi),w=sm(z-zi),L=(a,b,t)=>a+(b-a)*t,h=(i,j,k)=>hs(xi+i,yi+j,zi+k);
  return L(L(L(h(0,0,0),h(1,0,0),u),L(h(0,1,0),h(1,1,0),u),v),L(L(h(0,0,1),h(1,0,1),u),L(h(0,1,1),h(1,1,1),u),v),w)};
 const fbm=(x,y,z)=>{let s=0,a=.5;for(let o=0;o<5;o++){s+=a*vn(x,y,z);x*=2.03;y*=2.03;z*=2.03;a*=.5}return s};
 const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
 const clamp=(x,a,b)=>x<a?a:x>b?b:x;

 /* three maps in one pass: colour, a mask (red = city lights, green = ocean) and cloud */
 const W=512,H=256,mk=()=>{const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');return{c,g,im:g.createImageData(W,H)}};
 const D=mk(),M=mk(),C=mk();
 for(let y=0;y<H;y++){const la=(y/H-.5)*PI,cy=Math.sin(la),cr=Math.cos(la);
  for(let x=0;x<W;x++){const lo=x/W*PI*2,px=Math.cos(lo)*cr,pz=Math.sin(lo)*cr,i=(y*W+x)*4;
   const h=fbm(px*2.2,cy*2.2,pz*2.2);let c,lit=0,oc=0;
   if(h<.52){c=mix([54,140,200],[14,60,130],Math.min(1,(.52-h)*5));oc=1}
   else{const e=Math.min(1,(h-.52)*4);c=e<.6?mix([60,130,60],[170,150,100],e/.6):mix([170,150,100],[245,245,245],(e-.6)/.4);
    lit=clamp((fbm(px*8+50,cy*8,pz*8)-.5)*4,0,1)*(e<.45?1:.3)}
   if(Math.abs(cy)>.7&&Math.abs(cy)>.86-.1*fbm(px*3,cy*3,pz*3)){c=[240,246,255];lit=0;oc=0}
   const cl=clamp((fbm(px*3.5+20,cy*3.5,pz*3.5)-.52)*3.2,0,1);
   D.im.data[i]=c[0];D.im.data[i+1]=c[1];D.im.data[i+2]=c[2];D.im.data[i+3]=255;
   M.im.data[i]=lit*255;M.im.data[i+1]=oc*255;M.im.data[i+2]=0;M.im.data[i+3]=255;
   C.im.data[i]=C.im.data[i+1]=C.im.data[i+2]=255;C.im.data[i+3]=Math.round(cl*.85*255)}}
 const tx=m=>{m.g.putImageData(m.im,0,0);const t=new THREE.CanvasTexture(m.c);tex.push(t);return t};
 const tD=tx(D),tM=tx(M),tC=tx(C);

 /* find an ocean at the point facing the hub, so the receiver floats on open water */
 const hAt=(lo,la)=>{const cr=Math.cos(la);return fbm(Math.cos(lo)*cr*2.2,Math.sin(la)*2.2,Math.sin(lo)*cr*2.2)};
 const cap=Math.asin(RRAD/ER);let bestLo=0,bestM=-9;
 for(let k=0;k<90;k++){const lo=k/90*PI*2;let mx=hAt(lo,0);
  for(let a=0;a<8;a++){const an=a/8*PI*2;for(const r of[.5,1])mx=Math.max(mx,hAt(lo+Math.cos(an)*cap*r,Math.sin(an)*cap*r))}
  if(.52-mx>bestM){bestM=.52-mx;bestLo=lo}}

 const SUN=new THREE.Vector3(-1,0,0);                /* direction from Earth to the Sun */
 const E=new THREE.Group();E.position.set(EX,0,0);root.add(E);
 const tilt=new THREE.Group();tilt.rotation.x=.41;E.add(tilt);   /* 23.4 degrees, tilted about the Sun line so the receiver stays on the equator */

 /* planet */
 const bm=new THREE.ShaderMaterial({uniforms:{tD:{value:tD},tM:{value:tM},sun:{value:SUN},uBr:{value:0},uL:{value:.5}},
  vertexShader:'varying vec2 vu;varying vec3 vn,vp;void main(){vu=uv;vn=normalize(mat3(modelMatrix)*normal);vp=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vp,1.);}',
  fragmentShader:`uniform sampler2D tD,tM;uniform vec3 sun;uniform float uBr,uL;varying vec2 vu;varying vec3 vn,vp;
   void main(){
    vec3 n=normalize(vn),v=normalize(cameraPosition-vp);
    float d=dot(n,sun),dl=max(d,0.),ndv=max(dot(n,v),0.);
    vec3 c=texture2D(tD,vu).rgb,m=texture2D(tM,vu).rgb;
    float day=smoothstep(-.05,.3,d);
    vec3 col=c*(.035+1.05*smoothstep(0.,.35,dl));
    vec3 h=normalize(sun+v);
    col+=vec3(1.,.95,.85)*pow(max(dot(n,h),0.),90.)*m.g*.7*day;
    col+=vec3(1.,.74,.4)*m.r*smoothstep(.05,.3,m.r)*1.5*(1.-day);
    float rim=pow(1.-ndv,3.);
    col+=vec3(.35,.65,1.)*rim*(.15+1.*smoothstep(-.25,.45,d));
    col+=vec3(1.,.5,.25)*rim*exp(-pow(d*5.,2.))*.5;
    float b=max(dot(n,vec3(-1.,0.,0.)),0.);
    col+=vec3(.6,.9,1.)*pow(b,60.)*uL*.5;
    col*=1.+uBr;
    gl_FragColor=vec4(col,1.);}`});
 const bg=new THREE.SphereGeometry(ER,96,64);geos.push(bg);mats.push(bm);
 const body=new THREE.Mesh(bg,bm);body.rotation.y=-bestLo;tilt.add(body);   /* turns the open ocean toward the hub */

 /* cloud layer, drifting on its own */
 const cm=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{tC:{value:tC},sun:{value:SUN},uBr:{value:0}},
  vertexShader:'varying vec2 vu;varying vec3 vn;void main(){vu=uv;vn=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`uniform sampler2D tC;uniform vec3 sun;uniform float uBr;varying vec2 vu;varying vec3 vn;
   void main(){vec4 c=texture2D(tC,vu);float d=dot(normalize(vn),sun);
    float lit=.04+1.05*smoothstep(-.02,.35,d);
    vec3 col=vec3(lit)+vec3(1.,.55,.3)*exp(-pow(d*5.,2.))*.25*c.a;
    gl_FragColor=vec4(col*(1.+uBr),c.a*.88);}`});
 const cg=new THREE.SphereGeometry(ER*1.014,72,48);geos.push(cg);mats.push(cm);
 const clouds=new THREE.Mesh(cg,cm);tilt.add(clouds);

 /* atmosphere haze around the edge, brighter on the sunlit side */
 const hm=new THREE.ShaderMaterial({uniforms:{c:{value:new THREE.Color('#5aa8ff')},sun:{value:SUN}},transparent:true,side:THREE.BackSide,blending:THREE.AdditiveBlending,depthWrite:false,
  vertexShader:'varying vec3 vn,vw;void main(){vn=normalize(normalMatrix*normal);vw=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform vec3 c,sun;varying vec3 vn,vw;void main(){float i=pow(max(.62-dot(vn,vec3(0.,0.,1.)),0.),3.);float l=.25+.95*smoothstep(-.35,.4,dot(vw,sun));gl_FragColor=vec4(c*i*.9*l,1.);}'});
 const hg=new THREE.SphereGeometry(ER*1.13,48,32);geos.push(hg);mats.push(hm);
 const halo=new THREE.Mesh(hg,hm);E.add(halo);

 /* ---------- ocean receiver array: tiles floating on the water, facing the hub ---------- */
 const ra=new THREE.Group();E.add(ra);
 const UP=new THREE.Vector3(0,1,0),V3=THREE.Vector3;
 const tg=new THREE.CylinderGeometry(.55,.55,.14,6);geos.push(tg);
 const tm=new THREE.MeshStandardMaterial({color:'#ffffff',emissive:'#2a6cff',emissiveIntensity:.1,roughness:.35,metalness:.3});mats.push(tm);
 const pts=[],pitch=1;
 for(let r=-10;r<=10;r++)for(let q=-10;q<=10;q++){const u=r*pitch*.866,v=q*pitch+(r&1?pitch/2:0);if(Math.hypot(u,v)<=RRAD*.96)pts.push([u,v])}
 const tiles=new THREE.InstancedMesh(tg,tm,pts.length),dm=new THREE.Object3D(),col=new THREE.Color();
 pts.forEach((p,i)=>{const px=new V3(-Math.sqrt(ER*ER-p[0]*p[0]-p[1]*p[1]),p[0],p[1]),n=px.clone().normalize();
  dm.position.copy(n).multiplyScalar(ER+.12);dm.quaternion.setFromUnitVectors(UP,n);dm.updateMatrix();tiles.setMatrixAt(i,dm.matrix);
  const k=Math.random();col.setRGB(.05+.05*k,.11+.08*k,.28+.14*k);tiles.setColorAt(i,col)});
 tiles.instanceMatrix.needsUpdate=true;tiles.instanceColor.needsUpdate=true;tiles.frustumCulled=false;ra.add(tiles);
 /* frame ring along the edge, following the curve of the sea */
 const RS=64,rg=new THREE.BoxGeometry(.32,.22,2*PI*RRAD/RS*1.06);geos.push(rg);
 const rm=new THREE.MeshStandardMaterial({color:'#cfd6e4',roughness:.5,metalness:.45,emissive:'#7fe9ff',emissiveIntensity:.15});mats.push(rm);
 const ring=new THREE.InstancedMesh(rg,rm,RS),bs=new THREE.Matrix4();
 for(let k=0;k<RS;k++){const a=k/RS*PI*2,pos=new V3(-Math.sqrt(ER*ER-RRAD*RRAD),RRAD*Math.cos(a),RRAD*Math.sin(a)),n=pos.clone().normalize(),
   t=new V3(0,-Math.sin(a),Math.cos(a)),x=new V3().crossVectors(n,t);
  bs.makeBasis(x,n,t);bs.setPosition(n.clone().multiplyScalar(ER+.15));ring.setMatrixAt(k,bs)}
 ring.instanceMatrix.needsUpdate=true;ring.frustumCulled=false;ra.add(ring);
 /* glow on the water where the beam lands */
 const gm=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
  uniforms:{t:{value:0},uL:{value:.5},c:{value:new THREE.Color('#8ce6ff')}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform float t,uL;uniform vec3 c;varying vec2 vUv;void main(){float r=1.-vUv.y;float a=(1.-r*r)*.5*(.25+.75*uL)*(.75+.25*sin(r*18.-t*3.));gl_FragColor=vec4(c,a);}'});
 const gg=new THREE.SphereGeometry(ER+.25,40,16,0,PI*2,0,cap);geos.push(gg);mats.push(gm);
 const glowCap=new THREE.Mesh(gg,gm);glowCap.rotation.z=PI/2;ra.add(glowCap);

 /* ---------- the Earth beam: from the emitter to the receiver ---------- */
 const BL=B1-B0,bgeo=new THREE.CylinderGeometry(RRAD*.98,6.4,BL,28,1,true);geos.push(bgeo);
 const bem=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
  uniforms:{t:{value:0},uL:{value:.5},uBoost:{value:0}},
  vertexShader:'varying vec2 vUv;varying vec3 vN,vW;void main(){vUv=uv;vN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:`uniform float t,uL,uBoost;varying vec2 vUv;varying vec3 vN,vW;
   void main(){
    vec3 n=normalize(vN),v=normalize(cameraPosition-vW);
    float edge=pow(abs(dot(n,v)),1.4);
    float pulse=.5+.5*sin(6.2832*(vUv.y*9.-t*.6));
    float fade=smoothstep(0.,.06,vUv.y)*(1.-.2*vUv.y);
    float a=(.18+.4*pulse)*edge*fade*(.35+.65*uL)*(1.+uBoost);
    gl_FragColor=vec4(mix(vec3(1.,.8,.45),vec3(1.),pulse*.5),min(1.,a));}`});
 mats.push(bem);
 const beam=new THREE.Mesh(bgeo,bem);beam.rotation.z=-PI/2;beam.position.set((B0+B1)/2,0,0);root.add(beam);

 /* power arriving follows the trunk beam's load that world.js already computes, a little later */
 let trunk=null;root.traverse(o=>{if(!trunk&&o.material&&o.material.uniforms&&o.material.uniforms.uLoad)trunk=o.material});
 let gOut=.5,rx=root.position.x;

 return{
  update(dt,time,o){
   const sel=o.sel,ex=o.explode||0,pulse=.5+.5*Math.sin(time*7);
   gOut+=((trunk?trunk.uniforms.uLoad.value:.5)-gOut)*Math.min(1,dt*.5);
   bm.uniforms.uBr.value=sel==='earth'?.25*pulse:0;bm.uniforms.uL.value=gOut;
   cm.uniforms.uBr.value=sel==='atmosphere'?.35*pulse:0;
   clouds.rotation.y+=dt*.012;clouds.scale.setScalar(1+ex*.1);
   tm.emissiveIntensity=.1+.5*gOut+(sel==='oceanarray'?.6*pulse:0);
   rm.emissiveIntensity=.15+(sel==='oceanarray'?.6*pulse:0);
   gm.uniforms.t.value=time;gm.uniforms.uL.value=gOut;
   bem.uniforms.t.value=time;bem.uniforms.uL.value=gOut;bem.uniforms.uBoost.value=sel==='downlink'?.8*pulse:0;
   ra.position.x=-ex*8;                                           /* the receiver lifts off toward the hub when parts pull apart */
   /* the view: hub parts centre on the hub, Earth parts on Earth, the Earth beam on its middle */
   const tgt=HUBSEL.indexOf(sel)>=0?-HX:EARTHSEL.indexOf(sel)>=0?-EX:sel==='downlink'?-(B0+B1)/2:0;
   rx+=(tgt-rx)*Math.min(1,dt*3);root.position.x=rx;
  },
  dispose(){geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());tex.forEach(t=>t.dispose())}
 };
};
})();
