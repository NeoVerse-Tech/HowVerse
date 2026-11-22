/* Spaceship · registers the topic. Loaded last. */
(function(){
const HV=window.HV,T=HV.T.spaceship;
HV.topics=HV.topics||{};

HV.topics.spaceship={slug:'spaceship',title:'Spaceship',
 hook:'A crewed fusion ship. Six weeks to Mars distance, and it stops when it gets there.',
 stats:[['35.7 km/s','speed change'],['0.1 m/s²','acceleration'],['0.34 g','ring gravity']],
 learn:T.LEARN,parts:T.PARTS,create:T.create,fly:{create:T.createFly},mission:{at:T.at,read:T.read,phases:T.P.map(p=>({n:p.n,w:p.w}))}};
})();
