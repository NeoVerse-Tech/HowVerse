/* Fusion reactor · registers the topic. Loaded last.
   All four tabs are wired: learn, parts (World), create (World), mission (Launch) and fly (Fly). */
(function(){
const HV=window.HV,T=HV.T.fusion;
HV.topics=HV.topics||{};

/* placeholder 3D model: a glowing torus, replaced by T.create in Phase 3 */
function holdCreate(THREE,root){
 const g=new THREE.TorusGeometry(2.2,.55,16,64),m=new THREE.MeshStandardMaterial({color:'#ffb84d',emissive:'#ffb84d',emissiveIntensity:.5,roughness:.4,metalness:.3});
 const me=new THREE.Mesh(g,m),L=[new THREE.AmbientLight(0x8ea0c0,.8),new THREE.DirectionalLight(0xffffff,1.1)];
 L[1].position.set(5,6,8);me.rotation.x=1.2;root.add(me);L.forEach(l=>root.add(l));
 return{update(dt){me.rotation.z+=dt*.25},dispose(){g.dispose();m.dispose()}};
}

/* Fly tab. The factory gives a fresh flight model on each call. It also carries one model's
   members (ui, warp, step, view and so on), so it works whether the page calls it or reads it directly. */
const flyFactory=T.createFly?Object.assign(()=>T.createFly(),T.createFly()):undefined;
if(flyFactory)flyFactory.create=()=>T.createFly();

HV.topics['fusion-reactor']={slug:'fusion-reactor',title:'Fusion reactor',
 hook:'A star in a magnetic bottle. Heat hydrogen past 100 million degrees and hold it with magnets.',
 stats:[[T.fmtP(T.Pfus),'fusion power'],['Q = '+T.Q.toFixed(0),'power gain'],[T.fmtK(T.TopK),'plasma heat']],
 learn:T.LEARN||[],parts:T.PARTS||[],create:T.create||holdCreate,
 mission:{at:T.at||(()=>({})),read:T.read||(()=>[]),phases:T.P?T.P.map(p=>({n:p.n,w:p.w})):[]},
 fly:flyFactory};
})();
