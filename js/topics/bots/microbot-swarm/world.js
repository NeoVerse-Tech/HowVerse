/* Microbot swarm · 3D scene.
   Learn and World show one bot only, magnified: the reference shape exactly as core.js defines it, for a clear view and structural analysis.
   Two eight-sided tapered segments lean on a ball joint. Selecting an inside part, or pulling apart, turns the segments see-through.
   Launch and Fly show the swarm growing a sculpture: bots leave a pile, crawl over the finished strands bending at their ball joints, and snap
   into place. One instanced mesh, two half-bots per bot, with level of detail so a phone keeps up. */
(function(){
const T=(window.HV.T=window.HV.T||{}).microbots=window.HV.T.microbots||{};
const {PI,clamp,LEN,SHO,NECKA,ENDA,NECKZ,SHZ,BALLR,TAPER,BEND,MEND,MSIDE}=T;
/* the profile in mm */
const HL=LEN*500,aS=SHO*1e3,aN=NECKA*1e3,aE=ENDA*1e3,yN=NECKZ*1e3,yS=SHZ*1e3,rB=BALLR*1e3,c8=Math.cos(PI/8);

function create(THREE,root){
 const geos=[],mats=[],parts={};
 const M=(c,o)=>{const m=new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.45,metalness:.4,emissive:c,emissiveIntensity:.1},o));m.userData.ei=m.emissiveIntensity;mats.push(m);return m};
 const LM=(c,o)=>{const m=new THREE.LineBasicMaterial(Object.assign({color:c,transparent:true,opacity:.9},o));mats.push(m);return m};

 /* ---------- the single bot, built in mm and magnified to fit the screen ---------- */
 /* topic.js frames Learn at this distance, so the bot's size follows it */
 const fitD=clamp(24/(1.155*(innerWidth/innerHeight)),18,60),U=fitD*.31/(HL*2);
 const hero=new THREE.Group(),spin=new THREE.Group(),tilt=new THREE.Group(),top=new THREE.Group(),bot=new THREE.Group();
 hero.position.set(0,0,-2);hero.scale.setScalar(U);hero.add(spin);spin.add(tilt);tilt.add(top);tilt.add(bot);root.add(hero);
 tilt.rotation.z=-.17;
 const part=id=>parts[id]={ms:[],kids:[]};
 /* add a mesh to a half (or to the joint); "out" is how far it travels, in mm, at full pull-apart */
 const add=(id,geo,m,parent,x,y,z,out)=>{geos.push(geo);const me=new THREE.Mesh(geo,m);me.position.set(x,y,z);parent.add(me);const p=parts[id];
  if(p.ms.indexOf(m)<0)p.ms.push(m);if(out)p.kids.push({m:me,base:me.position.clone(),out:new THREE.Vector3(out[0],out[1],out[2])});return me};
 const frus=(aTop,aBot,h)=>{const g=new THREE.CylinderGeometry(aTop/c8,aBot/c8,h,8,1);g.rotateY(PI/8);return g};   /* flats face the axes */

 part('segments');
 const segM=M('#9a9b90',{flatShading:true,metalness:.25,roughness:.6,transparent:true,emissiveIntensity:.07}),edgeM=LM(0x20241f);
 [1,-1].forEach(sg=>{const half=sg>0?top:bot;
  [[aS,aN,yN,yS],[aE,aS,yS,HL]].forEach(q=>{
   const [outer,inner,y0,y1]=q,g=sg>0?frus(outer,inner,y1-y0):frus(inner,outer,y1-y0),y=sg*(y0+y1)/2;
   const me=add('segments',g,segM,half,0,y,0),eg=new THREE.EdgesGeometry(g);geos.push(eg);const ln=new THREE.LineSegments(eg,edgeM);ln.position.copy(me.position);half.add(ln)})});

 /* ball joint: a sphere with a flat cap on two sides and two turned grooves, like the reference model */
 part('joint');
 const ball=new THREE.Group();ball.rotation.y=-1;tilt.add(ball);
 const ballM=M('#7d8084',{metalness:.75,roughness:.35,transparent:true,emissiveIntensity:.06}),grooveM=M('#2b2e33',{emissiveIntensity:0});
 const bg=new THREE.SphereGeometry(rB,32,22),bp=bg.attributes.position,bn=bg.attributes.normal,CUT=rB*.85;
 for(let i=0;i<bp.count;i++){const x=bp.getX(i);if(Math.abs(x)>CUT){bp.setX(i,Math.sign(x)*CUT);bn.setXYZ(i,Math.sign(x),0,0)}}
 add('joint',bg,ballM,ball,0,0,0);
 [-.46,-.24].forEach(x=>{const g=new THREE.TorusGeometry(Math.sqrt(rB*rB-x*x),.016,6,48);g.rotateY(PI/2);add('joint',g,grooveM,ball,x,0,0)});
 const actM=M('#ffd24d',{emissiveIntensity:.35});
 for(let k=0;k<3;k++){const a=k*2*PI/3;add('joint',new THREE.CylinderGeometry(.09,.09,.55,10),actM,ball,Math.cos(a)*.34,0,Math.sin(a)*.34)}

 /* ten magnets: one behind each end face, four behind the long flats of each segment; colours show the pole */
 part('magnets');
 const north=M('#ff5d7a',{emissiveIntensity:.3}),south=M('#5d7cff',{emissiveIntensity:.3}),Y=new THREE.Vector3(0,1,0);
 const cyl=m=>new THREE.CylinderGeometry(m.d*500,m.d*500,m.t*1e3,18);
 const zf=MSIDE.z*1e3,af=aS-(aS-aE)*(zf-yS)/(HL-yS),deep=MSIDE.c*500;
 [1,-1].forEach(sg=>{const half=sg>0?top:bot;
  add('magnets',cyl(MEND),sg>0?north:south,half,0,sg*(HL-MEND.c*500),0,[0,sg*1.5,0]);
  for(let k=0;k<4;k++){const a=k*PI/2,n=new THREE.Vector3(Math.cos(a)*Math.cos(TAPER),sg*Math.sin(TAPER),Math.sin(a)*Math.cos(TAPER));
   const me=add('magnets',cyl(MSIDE),k%2?south:north,half,Math.cos(a)*af-n.x*deep,sg*zf-n.y*deep,Math.sin(a)*af-n.z*deep,[n.x*1.3,n.y*1.3,n.z*1.3]);
   me.quaternion.setFromUnitVectors(Y,n)}});

 /* thin-film cells fill the wide part behind each shoulder; the radio and processor sit by the upper neck */
 part('battery');part('radio');
 const green=M('#7dff9a',{emissiveIntensity:.25}),cyan=M('#5df2ff',{metalness:.5,emissiveIntensity:.3}),steel=M('#b9c6d4',{metalness:.7});
 [1,-1].forEach(sg=>add('battery',frus(.84,.84,.68),green,sg>0?top:bot,0,sg*1.36,0,[-2.1,0,0]));
 add('radio',new THREE.BoxGeometry(.7,.12,.7),cyan,top,0,.82,0,[2.1,0,0]);add('radio',new THREE.BoxGeometry(.24,.08,.24),steel,top,.12,.92,-.12,[2.1,0,0]);

 /* dimension lines for the structure view: length, shoulder width, end face and ball */
 part('structure');
 const dimM=LM(0x5df2ff,{depthTest:false}),pts=[];
 const dim=(a,b,t)=>{pts.push(...a,...b);[a,b].forEach(p=>pts.push(p[0]-t[0],p[1]-t[1],p[2]-t[2],p[0]+t[0],p[1]+t[1],p[2]+t[2]))};
 dim([2,-HL,0],[2,HL,0],[.25,0,0]);dim([-aS,HL+.55,0],[aS,HL+.55,0],[0,.22,0]);dim([-aE,-HL-.55,0],[aE,-HL-.55,0],[0,.22,0]);dim([-rB,0,1.5],[rB,0,1.5],[0,.18,0]);
 pts.push(aS,HL+.55,0,aS,yS,0,-aS,HL+.55,0,-aS,yS,0);
 const dg=new THREE.BufferGeometry();dg.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));geos.push(dg);
 const dims=new THREE.LineSegments(dg,dimM);dims.visible=false;dims.renderOrder=9;tilt.add(dims);

 /* ---------- the swarm: one instanced mesh, two half-bots per bot so each can bend at its ball ---------- */
 const grid=new THREE.GridHelper(48,24,0x2a6a7a,0x14323c);geos.push(grid.geometry);mats.push(grid.material);root.add(grid);
 const sm=new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,flatShading:true,roughness:.4,metalness:.4,emissive:0x2a6a8a,emissiveIntensity:.25,side:THREE.DoubleSide});mats.push(sm);

 /* half a bot in mm, from the ball's centre along +y. Level of detail: 0 = full with ball, 1 = eight sides, no ball, 2 = four sides */
 const LODS=[];
 function halfGeo(lod){
  if(LODS[lod])return LODS[lod];
  const sides=lod<2?8:4,P=[],C=[];
  const loft=(rings,n,shade)=>{for(let j=0;j<rings.length-1;j++)for(let i=0;i<n;i++){
   const v=(r,k)=>{const q=(k+.5)*2*PI/n,a=rings[r][1]/Math.cos(PI/n);return[Math.sin(q)*a,rings[r][0],Math.cos(q)*a]};
   const p=v(j,i),q=v(j,i+1),s=v(j+1,i+1),t=v(j+1,i);
   [p,q,s,p,s,t].forEach(x=>{P.push(x[0],x[1],x[2]);C.push(shade,shade,shade)})}};
  if(lod===0){loft([[yN,.01],[yN,aN],[yS,aS],[HL,aE],[HL,.01]],sides,.86);loft([[0,rB],[rB*.5,rB*.87],[rB*.87,rB*.5],[rB,.01]],8,1)}
  else if(lod===1)loft([[0,aN*.8],[yN,aN],[yS,aS],[HL,aE],[HL,.01]],sides,.86);
  else loft([[0,aN],[yS,aS],[HL,aE]],sides,.86);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));
  g.computeVertexNormals();geos.push(g);return LODS[lod]=g}
 const lodOf=n=>n<=900?0:n<=5000?1:2;

 const L2=HL*2,GOLD=2.399963,rnd=i=>{const x=Math.sin(i*91.7+13.1)*43758.5453;return x-Math.floor(x)};
 const norm=(x,y,z)=>{const l=Math.hypot(x,y,z)||1;return[x/l,y/l,z/l]};
 let im=null,arr=null,cur=null,state=null,lastBt=-1,scale=.1,ox=0,oy=0,oz=0;

 /* everything about one sculpture that does not change: screen fit, pile positions and colours */
 function setSculpture(sc){
  cur=sc;const m=sc.model,n=m.n,p=m.pos;
  if(im){root.remove(im);im.dispose&&im.dispose()}
  im=new THREE.InstancedMesh(halfGeo(lodOf(n)),sm,n*2);im.frustumCulled=false;root.add(im);arr=im.instanceMatrix.array;
  let zm=1,rad=1,base=1;
  for(let i=0;i<n;i++){const r=Math.hypot(p[i*3],p[i*3+1]),z=p[i*3+2];zm=Math.max(zm,z);rad=Math.max(rad,r);if(z<8)base=Math.max(base,r)}
  /* the pile: a low mound in front. The first bots to leave sit on its outside top */
  const R=Math.cbrt(18*n),py=-(base+R+12),pile=new Float32Array(n*3);
  sc.time.order.forEach((i,k)=>{const q=(n-k-.5)/n,r=R*Math.sqrt(q),a=k*GOLD;
   pile[i*3]=Math.cos(a)*r;pile[i*3+1]=py+Math.sin(a)*r;pile[i*3+2]=1+(1-r/R)*R*.85*(.35+.65*rnd(k))});
  const span=Math.max(zm,(rad-py+R)*.72,rad*1.7);
  scale=17/span;ox=0;oz=-2+(py*.3)*scale;oy=-zm*scale*.5;
  grid.position.y=oy-scale;
  /* bots wait in the pile as grey metal and take the colour of their height once they set off */
  const hue=new Float32Array(n);for(let i=0;i<n;i++){hue[i]=.5+.38*(p[i*3+2]/zm);paint(i,-1)}
  if(im.instanceColor)im.instanceColor.needsUpdate=true;
  state={pile,hue,mode:new Int8Array(n).fill(-1)};lastBt=-1}
 const col=new THREE.Color();
 function paint(i,h){if(!im.setColorAt)return;if(h<0)col.setHSL(.58,.12,.45);else col.setHSL(h,.8,.6);im.setColorAt(i*2,col);im.setColorAt(i*2+1,col)}

 /* write one half: its +y axis points along (dx,dy,dz) from the ball at (x,y,z). Model millimetres, z up → screen, y up */
 function half(k,x,y,z,dx,dy,dz){
  const X=dx,Y=dz,Z=-dy;                                     /* axis in screen space */
  let ax,ay,az;if(Math.abs(Y)<.95){ax=-Z;ay=0;az=X}else{ax=0;ay=Z;az=-Y}
  const l=Math.hypot(ax,ay,az)||1;ax/=l;ay/=l;az/=l;
  const bx=ay*Z-az*Y,by=az*X-ax*Z,bz=ax*Y-ay*X,s=scale,o=k*16;
  arr[o]=ax*s;arr[o+1]=ay*s;arr[o+2]=az*s;arr[o+3]=0;arr[o+4]=X*s;arr[o+5]=Y*s;arr[o+6]=Z*s;arr[o+7]=0;
  arr[o+8]=bx*s;arr[o+9]=by*s;arr[o+10]=bz*s;arr[o+11]=0;arr[o+12]=ox+x*s;arr[o+13]=oy+z*s;arr[o+14]=oz-y*s;arr[o+15]=1}
 /* a whole bot: d0 is the way the lower half points toward the ball, d1 the way the upper half leaves it */
 const putBot=(i,p,a,b)=>{half(i*2,p[0],p[1],p[2],-a[0],-a[1],-a[2]);half(i*2+1,p[0],p[1],p[2],b[0],b[1],b[2])};

 /* the point on the finished strands d mm from the floor, on the way to stroke si */
 function spine(si,d){
  const lines=cur.model.lines;let l=lines[si];
  while(l.sk.on!==undefined&&d<l.base){si=l.sk.on;l=lines[si]}
  const c=l.c,s=clamp(d-l.base,0,c.L);let lo=0,hi=c.S.length-1;
  while(hi-lo>1){const m=(lo+hi)>>1;if(c.S[m]<s)lo=m;else hi=m}
  const f=clamp((s-c.S[lo])/(c.S[hi]-c.S[lo]||1),0,1),a=c.P[lo],b=c.P[hi];
  return{p:[a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f,a[2]+(b[2]-a[2])*f],t:c.Tn[lo],u:c.U[lo],r:l.rad(lo)}}

 /* a walking bot: from the pile to the base, up the outside of what is built, then into its own place. It bends at the ball as it steps */
 function walk(i,f,time){
  const m=cur.model,k=i*3,fin=[m.pos[k],m.pos[k+1],m.pos[k+2]],d=m.dist[i],GAP=20,q=f*(d+GAP),si=m.stroke[i];
  const own=spine(si,d);
  let ox_=fin[0]-own.p[0],oy_=fin[1]-own.p[1],oz_=fin[2]-own.p[2];
  if(Math.hypot(ox_,oy_,oz_)<.5){const a=i*GOLD;ox_=own.u[0]*Math.cos(a);oy_=own.u[1]*Math.cos(a);oz_=own.u[2]*Math.cos(a)+Math.sin(a)}
  const out=norm(ox_,oy_,oz_),surf=h=>{const s=spine(si,h),r=s.r+1.4;return{p:[s.p[0]+out[0]*r,s.p[1]+out[1]*r,Math.max(1,s.p[2]+out[2]*r)],t:s.t}};
  let p,t;
  if(q<GAP){const g=q/GAP,e=surf(0),a=state.pile;p=[a[k]+(e.p[0]-a[k])*g,a[k+1]+(e.p[1]-a[k+1])*g,a[k+2]+(e.p[2]-a[k+2])*g+Math.sin(g*PI)*3];t=norm(e.p[0]-a[k],e.p[1]-a[k+1],e.p[2]-a[k+2])}
  else{const s=surf(q-GAP);p=s.p;t=s.t}
  const g=clamp((f-.85)/.15,0,1);
  if(g>0){p=[p[0]+(fin[0]-p[0])*g,p[1]+(fin[1]-p[1])*g,p[2]+(fin[2]-p[2])*g];
   t=norm(t[0]+(m.dir0[k]-t[0])*g,t[1]+(m.dir0[k+1]-t[1])*g,t[2]+(m.dir0[k+2]-t[2])*g)}
  const w=.45*Math.sin(time*9+i)*(1-g);
  putBot(i,p,norm(t[0]-out[0]*w,t[1]-out[1]*w,t[2]-out[2]*w),norm(t[0]+out[0]*w,t[1]+out[1]*w,t[2]+out[2]*w))}

 function drawSwarm(sc,bt,time){
  if(sc!==cur&&(!cur||sc.model!==cur.model))setSculpture(sc);else if(sc!==cur){cur=sc;lastBt=-1;state.mode.fill(-1)}
  const m=cur.model,lv=cur.time.leave,ar=cur.time.arrive,md=state.mode,moved=Math.abs(bt-lastBt)>1e-6;
  if(!moved&&lastBt>=0)return;
  let dirty=false,tint=false;
  for(let i=0;i<m.n;i++){
   const s=bt>=ar[i]?2:bt>lv[i]?1:0;
   if(s!==md[i]&&(s===0||md[i]<=0)){paint(i,s?state.hue[i]:-1);tint=true}
   if(s===1){walk(i,(bt-lv[i])/(ar[i]-lv[i]),time);dirty=true}
   else if(s!==md[i]){const k=i*3;dirty=true;
    if(s===2)putBot(i,[m.pos[k],m.pos[k+1],m.pos[k+2]],[m.dir0[k],m.dir0[k+1],m.dir0[k+2]],[m.dir1[k],m.dir1[k+1],m.dir1[k+2]]);
    else{const a=rnd(i)*2*PI,t=[Math.cos(a),Math.sin(a),(rnd(i+7)-.5)*.5],d=norm(t[0],t[1],t[2]),p=state.pile;putBot(i,[p[k],p[k+1],p[k+2]],d,d)}}
   md[i]=s}
  if(dirty)im.instanceMatrix.needsUpdate=true;
  if(tint&&im.instanceColor)im.instanceColor.needsUpdate=true;
  lastBt=bt}

 const wg=new THREE.SphereGeometry(180,24,16),wm=new THREE.MeshBasicMaterial({color:0x04080f,side:THREE.BackSide});geos.push(wg);mats.push(wm);root.add(new THREE.Mesh(wg,wm));
 const L=[new THREE.AmbientLight(0xa0c0d0,.7),new THREE.DirectionalLight(0xffffff,1.1),new THREE.DirectionalLight(0x5df2ff,.5)];
 L[1].position.set(6,10,8);L[2].position.set(-8,-2,-10);L.forEach(l=>root.add(l));


 let ex=0,xray=0;
 return{
  update(dt,time,o){
   const solo=o.tab==='learn'||o.tab==='world',st=o.state;
   hero.visible=solo;grid.visible=!solo;if(im)im.visible=!solo&&!!(st&&st.sc);
   if(solo){
    const sel=o.sel,inner=sel==='magnets'||sel==='battery'||sel==='radio';
    ex+=(o.explode-ex)*Math.min(1,dt*5);
    xray+=((inner||ex>.05?1:0)-xray)*Math.min(1,dt*5);
    segM.opacity=1-.78*xray;segM.depthWrite=xray<.05;edgeM.opacity=.9-.4*xray;
    const jx=sel==='joint'?.65:xray;ballM.opacity=1-.7*jx;ballM.depthWrite=jx<.05;
    for(const id in parts){const p=parts[id],pulse=sel===id?(id==='segments'?.12:.35)*(1+Math.sin(time*6)):0;
     p.ms.forEach(m=>{m.emissiveIntensity=(m.userData.ei||0)+pulse});
     p.kids.forEach(k=>k.m.position.set(k.base.x+k.out.x*ex,k.base.y+k.out.y*ex,k.base.z+k.out.z*ex))}
    dims.visible=sel==='structure';
    /* the joint: a slight bend as in the reference, a gentle sway in World, the full fold when the joint is selected, straight for measuring */
    let a=.07;
    if(sel==='structure'||ex>.05)a=0;
    else if(sel==='joint')a=BEND/2*Math.sin(time*.9);
    else if(o.tab==='world')a=.07+.09*Math.sin(time*.8);
    top.rotation.z=a;bot.rotation.z=-a;
    top.position.y=ex*1.5;bot.position.y=-ex*1.5;
    if(sel==='structure')spin.rotation.y+=(Math.round(spin.rotation.y/(2*PI))*2*PI-spin.rotation.y)*Math.min(1,dt*3);
    else if(o.tab==='world')spin.rotation.y+=dt*.25;
    return}
   if(st&&st.sc)drawSwarm(st.sc,st.bt,time);
  },
  dispose(){im&&im.dispose&&im.dispose();geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose())}
 };
}

Object.assign(T,{create});
})();
