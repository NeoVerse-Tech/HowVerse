/* Dyson swarm · registers the topic. Loaded last.
   Learn, Parts, the 3D model and the Launch mission come from learn.js, parts.js, world.js, earth.js and mission.js.
   Phase 7: fly.js adds the Fly tab and its Learn section. The Fly model drives the scene through the same bridge as the Launch tab. */
(function(){
const HV=window.HV,T=HV.T.dyson,S=T.SUN;
HV.topics=HV.topics||{};

/* the scene is world.js, then the mission bridge, then the Earth link from earth.js, then the mission camera */
const create=(THREE,root)=>{
 const w=T.create(THREE,root),e=T.makeEarth(THREE,root),m=T.makeMission(THREE,root);
 return Object.assign({},w,{
  update(dt,time,o){w.update(dt,time,o);m.pre(dt,o);e.update(dt,time,o);m.post(dt,o)},
  dispose(){w.dispose();e.dispose();m.dispose()}});
};
/* parts: the emitter text is replaced, and the Earth parts are added at the end */
const parts=T.PARTS.map(p=>p.id==='emitter'?T.EARTH_EMITTER:p).concat(T.EARTH_PARTS);
/* learn: the old closing sections are replaced; the Launch trip now starts at the first collector, so that sentence is dropped.
   The closing section no longer says Fly is still to come, and the Fly section goes just before it. */
const END='Where this stands';
const end=Object.assign({},T.MISSION_END,{p:T.MISSION_END.p.map(x=>x.replace(' A hands-on Fly mode is still to come.',' The Fly tab lets you run the swarm yourself.'))});
const learn=T.LEARN.filter(s=>s.h!==END)
 .map(s=>({h:s.h,l:s.l,p:s.p.map(x=>x.replace(' The Launch tab walks this trip from the core to the sky.',''))}))
 .concat(T.EARTH_LEARN.filter(s=>s.h!==END),T.MISSION_LEARN,[T.FLY_LEARN,end]);

HV.topics['dyson-swarm']={slug:'dyson-swarm',title:'Dyson swarm',
 hook:'A crowd of collectors around the Sun, beaming its power through a hub ship to Earth.',
 stats:[[T.sci(S.L)+' W','power the Sun puts out'],[S.Teff.toLocaleString('en-US')+' K','Sun\'s surface temperature'],[T.sci(Math.pow(6.371e6,2)/(4*T.AU*T.AU),1),'share of it Earth catches']],
 learn,parts,create,mission:{at:T.at,read:T.read,phases:T.P.map(p=>({n:p.n,w:p.w}))},
 fly:T.fly};
})();
