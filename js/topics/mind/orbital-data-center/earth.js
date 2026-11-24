/* Orbital data center · Earth. Loaded before world.js, which builds it with T.makeEarth(THREE,root,{R,cy}).
   The same generated planet as the Spaceship and Dyson topics (same noise, so the continents match), with a night side that shows
   city lights, cloud that drifts on its own, and a thin atmosphere. The lights follow this generated map, not the real cities.
   update(dt,time,p) takes p={sun:[x,y,z] unit vector toward the Sun, nu: orbit angle in radians, sel, ex}. The planet turns by nu
   about the orbit normal, so the ground slides past under the node, and the Sun direction in the shader is the same one world.js uses. */
(function(){
const T=window.HV.T.odc,PI=Math.PI;

T.makeEarth=function(THREE,root,o){
 o=o||{};const ER=o.R||150,cy=o.cy==null?-ER:o.cy;
 const mats=[],geos=[],tex=[],sm=x=>x*x*(3-2*x);

 /* same value noise as the Spaceship Earth, so the continents match */
 const hs=(x,y,z)=>{const h=Math.sin(x*127.1+y*311.7+z*74.7)*43758.5453;return h-Math.floor(h)};
 const vn=(x,y,z)=>{const xi=Math.floor(x),yi=Math.floor(y),zi=Math.floor(z),u=sm(x-xi),v=sm(y-yi),w=sm(z-zi),L=(a,b,t)=>a+(b-a)*t,h=(i,j,k)=>hs(xi+i,yi+j,zi+k);
  return L(L(L(h(0,0,0),h(1,0,0),u),L(h(0,1,0),h(1,1,0),u),v),L(L(h(0,0,1),h(1,0,1),u),L(h(0,1,1),h(1,1,1),u),v),w)};
 const fbm=(x,y,z)=>{let s=0,a=.5;for(let k=0;k<5;k++){s+=a*vn(x,y,z);x*=2.03;y*=2.03;z*=2.03;a*=.5}return s};
 const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
 const clamp=(x,a,b)=>x<a?a:x>b?b:x;

 /* three maps in one pass: colour, a mask (red = city lights, green = ocean) and cloud */
 const W=512,H=256,mk=()=>{const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');return{c,g,im:g.createImageData(W,H)}};
 const D=mk(),M=mk(),C=mk();
 for(let y=0;y<H;y++){const la=(y/H-.5)*PI,cyl=Math.sin(la),cr=Math.cos(la);
  for(let x=0;x<W;x++){const lo=x/W*PI*2,px=Math.cos(lo)*cr,pz=Math.sin(lo)*cr,i=(y*W+x)*4;
   const h=fbm(px*2.2,cyl*2.2,pz*2.2);let c,lit=0,oc=0;
   if(h<.52){c=mix([54,140,200],[14,60,130],Math.min(1,(.52-h)*5));oc=1}
   else{const e=Math.min(1,(h-.52)*4);c=e<.6?mix([60,130,60],[170,150,100],e/.6):mix([170,150,100],[245,245,245],(e-.6)/.4);
    lit=clamp((fbm(px*8+50,cyl*8,pz*8)-.5)*4,0,1)*(e<.45?1:.3)}
   if(Math.abs(cyl)>.7&&Math.abs(cyl)>.86-.1*fbm(px*3,cyl*3,pz*3)){c=[240,246,255];lit=0;oc=0}
   const cl=clamp((fbm(px*3.5+20,cyl*3.5,pz*3.5)-.52)*3.2,0,1);
   D.im.data[i]=c[0];D.im.data[i+1]=c[1];D.im.data[i+2]=c[2];D.im.data[i+3]=255;
   M.im.data[i]=lit*255;M.im.data[i+1]=oc*255;M.im.data[i+2]=0;M.im.data[i+3]=255;
   C.im.data[i]=C.im.data[i+1]=C.im.data[i+2]=255;C.im.data[i+3]=Math.round(cl*.85*255)}}
 const tx=m=>{m.g.putImageData(m.im,0,0);const t=new THREE.CanvasTexture(m.c);tex.push(t);return t};
 const tD=tx(D),tM=tx(M),tC=tx(C);

 const SUN=new THREE.Vector3(0,1,0);                          /* direction from Earth to the Sun, world space */
 const E=new THREE.Group();E.position.set(0,cy,0);root.add(E);
 const spin=new THREE.Group();E.add(spin);                    /* turns about the orbit normal as the node goes round */
 const tilt=new THREE.Group();tilt.rotation.x=.41;spin.add(tilt);   /* Earth's axis, 23.4 degrees */

 /* planet: day side, specular sea, night lights, a warm band at the terminator */
 const bm=new THREE.ShaderMaterial({uniforms:{tD:{value:tD},tM:{value:tM},sun:{value:SUN},uBr:{value:0}},
  vertexShader:'varying vec2 vu;varying vec3 vn,vp;void main(){vu=uv;vn=normalize(mat3(modelMatrix)*normal);vp=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vp,1.);}',
  fragmentShader:`uniform sampler2D tD,tM;uniform vec3 sun;uniform float uBr;varying vec2 vu;varying vec3 vn,vp;
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
    col*=1.+uBr;
    gl_FragColor=vec4(col,1.);}`});
 const bg=new THREE.SphereGeometry(ER,96,64);geos.push(bg);mats.push(bm);
 tilt.add(new THREE.Mesh(bg,bm));

 /* cloud layer, drifting on its own */
 const cm=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{tC:{value:tC},sun:{value:SUN},uBr:{value:0}},
  vertexShader:'varying vec2 vu;varying vec3 vn;void main(){vu=uv;vn=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`uniform sampler2D tC;uniform vec3 sun;uniform float uBr;varying vec2 vu;varying vec3 vn;
   void main(){vec4 c=texture2D(tC,vu);float d=dot(normalize(vn),sun);
    float lit=.04+1.05*smoothstep(-.02,.35,d);
    vec3 col=vec3(lit)+vec3(1.,.55,.3)*exp(-pow(d*5.,2.))*.25*c.a;
    gl_FragColor=vec4(col*(1.+uBr),c.a*.88);}`});
 const cg=new THREE.SphereGeometry(ER*1.006,72,48);geos.push(cg);mats.push(cm);
 const clouds=new THREE.Mesh(cg,cm);tilt.add(clouds);

 /* atmosphere haze around the edge, brighter on the sunlit side */
 const hm=new THREE.ShaderMaterial({uniforms:{c:{value:new THREE.Color('#5aa8ff')},sun:{value:SUN}},transparent:true,side:THREE.BackSide,blending:THREE.AdditiveBlending,depthWrite:false,
  vertexShader:'varying vec3 vn,vw;void main(){vn=normalize(normalMatrix*normal);vw=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform vec3 c,sun;varying vec3 vn,vw;void main(){float i=pow(max(.62-dot(vn,vec3(0.,0.,1.)),0.),3.);float l=.25+.95*smoothstep(-.35,.4,dot(vw,sun));gl_FragColor=vec4(c*i*.9*l,1.);}'});
 const hg=new THREE.SphereGeometry(ER*1.06,48,32);geos.push(hg);mats.push(hm);
 E.add(new THREE.Mesh(hg,hm));

 return{
  group:E,
  update(dt,time,p){
   p=p||{};const s=p.sun||[0,1,0],glow=p.sel==='orbit'?.25*(.5+.5*Math.sin(time*5)):0;
   SUN.set(s[0],s[1],s[2]);
   spin.rotation.z=p.nu||0;
   clouds.rotation.y+=dt*.012;
   bm.uniforms.uBr.value=glow;cm.uniforms.uBr.value=glow;
   E.position.y=cy-(p.ex||0)*14;                              /* the Earth drops away when parts pull apart */
  },
  dispose(){root.remove(E);geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());tex.forEach(t=>t.dispose())}
 };
};
})();
