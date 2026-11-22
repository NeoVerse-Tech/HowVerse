/* Graphene · registers the topic. Loaded last.
   Learn, Parts, the 3D model and the Launch mission come from learn.js, parts.js, world.js and mission.js. fly.js runs the Fly tab. */
(function(){
const HV=window.HV,T=HV.T.graphene,D=T.DES;
HV.topics=HV.topics||{};

const pS=T.peak(D.Rs);

HV.topics['graphene']={slug:'graphene',title:'Graphene',
 hook:'One layer of carbon atoms, strong enough to be measured by poking it with a diamond until it breaks.',
 stats:[[T.f(T.sigF)+' N/m','2D strength, about '+T.f(T.S3/1e9)+' GPa'],[T.f(T.E3/1e12,1)+' TPa','stiffness, five times steel'],[T.fF(pS.F),'force to break the drum, sharp tip']],
 learn:T.LEARN,parts:T.PARTS,create:T.create,fly:{create:T.createFly},mission:{at:T.at,read:T.read,phases:T.P.map(p=>({n:p.n,w:p.w}))}};
})();
