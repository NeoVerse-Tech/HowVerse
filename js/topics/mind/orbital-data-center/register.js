/* Orbital data center · register. Loaded last: it gathers what the other files built and registers the topic under its slug. */
(function(){
const T=window.HV.T.odc,D=T.DES,f=T.f,fW=T.fW;
window.HV.topics['orbital-data-center']={
 slug:'orbital-data-center',
 title:'Orbital data center',
 hook:'A megawatt of computers on a sunlit orbit, cooled only by the cold of space.',
 stats:[[fW(T.Qdes),'compute and heat'],[f(D.h/1e3)+' km','dawn-dusk orbit'],[f(D.Arad)+' m²','radiators']],
 learn:T.LEARN,
 parts:T.PARTS,
 create:T.create,
 mission:{at:T.at,read:T.read,phases:T.P},
 fly:{create:T.createFly}
};
})();
