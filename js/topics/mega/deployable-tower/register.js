/* Deployable tower · registers the topic. Loaded last.
   Learn, Parts, the 3D model and the Launch mission come from learn.js, parts.js, world.js and mission.js. fly.js runs the Fly tab. */
(function(){
const HV=window.HV,T=HV.T.tower,D=T.DES;
HV.topics=HV.topics||{};

const Vs=55,cut=Math.round(100*(1-T.wind(Vs,D.Hmin,false).Mpk/T.wind(Vs,D.Hmax,false).Mpk));

HV.topics['deployable-tower']={slug:'deployable-tower',title:'Deployable tower',
 hook:'A 300 m telescoping tower that nests down to 60 m before a storm, so the wind has far less to grab.',
 stats:[[D.Hmax+' → '+D.Hmin+' m','deployed to stowed height'],['−'+cut+'%','wind moment at '+Vs+' m/s, stowed'],[T.f(T.windLimit(D.Hmax,false))+' m/s','wind limit when fully tall']],
 learn:T.LEARN,parts:T.PARTS,create:T.create,fly:{create:T.createFly},mission:{at:T.at,read:T.read,phases:T.P.map(p=>({n:p.n,w:p.w}))}};
})();
