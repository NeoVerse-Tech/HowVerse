/* Nanobots · registers the topic. Loaded last. */
(function(){
const HV=window.HV,T=HV.T.nanobots;
HV.topics=HV.topics||{};

HV.topics.nanobots={slug:'nanobots',title:'Nanobots',
 hook:'A magnetic corkscrew 3 µm long swims through blood, where water feels like honey and heat keeps shaking everything.',
 stats:[['3 µm','reference bot length'],['0.00002','Reynolds number'],['20 µm/s','swimming speed']],
 learn:T.LEARN,parts:T.PARTS,create:T.create,fly:{create:T.createFly},mission:{at:T.at,read:T.read,phases:T.P.map(p=>({n:p.n,w:p.w}))}};
})();
