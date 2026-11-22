/* Deployable tower · parts. Eight parts; the ids are what world.js will use to find each piece, so keep them stable.
   Numbers come from core.js. Labels: BUILT (exists today), PROPOSED (known technology, designed here), THEORETICAL (unproven). */
(function(){
const T=window.HV.T.tower,D=T.DES,f=T.f,eng=T.eng;

const wFull=T.wind(55,D.Hmax,true),W=D.mass*T.g;
const tRated=T.moveTime(D.Hmax,D.Hmin,T.rateAtPower(D.drive.rated));
const dmpCut=Math.round(100*(1-T.gust(D.zetaD)/T.gust(D.zeta0)));

T.PARTS=[
 {id:'foundation',n:'Foundation and anchors',l:'BUILT',
  d:'A wide ring beneath the base tube. The tower\'s own weight holds it down, and anchors reaching into rock take whatever uplift the wind adds on the windward side. Anchored foundations for tall structures are standard practice.',
  k:[['Base ring',D.dia[0]+' m'],['Tower weight',eng(W,'N')],['Wind moment, 55 m/s deployed',eng(wFull.Mpk,'N·m')]]},

 {id:'stages',n:'Telescoping stages',l:'PROPOSED',
  d:'Six steel tubes that nest one inside another. Stage 0 is fixed. Each stage above it is narrower and slides up inside the one below. Deployed, they overlap by '+f(D.Ls-T.pitch(D.Hmax),0)+' m at every joint, which is what carries the bending.',
  k:[['Stages',D.N],['Length each',D.Ls+' m'],['Diameter',D.dia[0]+' to '+D.dia[D.N-1]+' m'],['Wall',f(D.t*1000)+' mm'],['Mass',f(D.mass/1e3)+' t']]},

 {id:'pins',n:'Locking pins',l:'PROPOSED',
  d:'Steel pins that drive through two overlapping tubes and lock them together. Once pinned, the jacks carry no wind load. Telescopic cranes lock their sections the same way. The rule is to engage them before the wind arrives and release them in order before moving.',
  k:[['Joints',D.N-1],['Positions','stowed and deployed'],['Jack load without pins',eng(T.jackForce(1),'N')]]},

 {id:'jacks',n:'Drive jacks',l:'BUILT',
  d:'Rack-and-pinion jacks like those that raise offshore jack-up rigs. They lift the nested stages one above the other. The limit is heat. Pushing the drive harder shortens the retraction but heats it faster than it can cool.',
  k:[['Jacks',D.drive.jacks],['Rated power',eng(D.drive.rated,'W')],['Peak power',eng(D.drive.peak,'W')],['Top speed',D.drive.rateMax+' m/s'],['Retract at rated power',T.clock(tRated)]]},

 {id:'floors',n:'Floor modules',l:'THEORETICAL',
  d:'Floors that fold or slide so every level still fits when the tower nests down. Nothing like this is built at this scale. Only the deployed height is occupied, and the building has to be fully evacuated before any retraction starts.',
  k:[['Design occupancy',(D.people||2000)+' people'],['When occupied','deployed only']]},

 {id:'skin',n:'Facade skin',l:'PROPOSED',
  d:'Overlapping panels that slide over each other, so the surface stays closed at every height. The skin sets how much wind the tower catches, and a rough round tube is modelled with a drag coefficient of '+D.cd+'.',
  k:[['Drag coefficient',D.cd],['Width seen by wind',D.dia[0]+' m low, '+D.dia[D.N-1]+' m at top']]},

 {id:'damper',n:'Damper mass',l:'BUILT',
  d:'A big weight hung near the top that swings against the sway. Taipei 101 and Citicorp Center both have one. It makes the tower calmer and trims the peak wind load, but it does not make a deployed tower hurricane-proof.',
  k:[['Mass',f(D.damperMass/1e3)+' t'],['Share of tower','2%'],['Damping',f(D.zeta0*100)+'% to '+f(D.zetaD*100)+'%'],['Peak load cut','about '+dmpCut+'%']]},

 {id:'control',n:'Control system',l:'PROPOSED',
  d:'Reads the forecast and the wind, checks the pins, clears the people and runs the drive. Its hardest job is timing. Retraction is slow, so it has to start while the weather is still calm.',
  k:[['Retract from tall',T.clock(tRated)],['Wind limit, tall',f(T.windLimit(D.Hmax,false))+' m/s'],['Wind limit, stowed',f(T.windLimit(D.Hmin,false))+'+ m/s']]}
];
})();
