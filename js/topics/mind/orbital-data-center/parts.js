/* Orbital data center · parts. Nine parts; the ids are what world.js uses to find each piece, so keep them stable:
   array, radiators, compute, shield, power, loop, links, bus, orbit.
   Numbers come from core.js. Labels: BUILT (exists today), PROPOSED (known technology, designed here), THEORETICAL (unproven).
   The bus and the orbit are BUILT. The rest are PROPOSED: each technology exists, but not at this size, and not all together. */
(function(){
const T=window.HV.T.odc,D=T.DES,K=T.K,f=T.f,fW=T.fW,fM=T.fM,fD=T.fD,fC=T.fC,fR=T.fR,fT=T.fT,comma=T.comma;
const Y=T.YEAR,M=T.MASSKG,D2R=T.D2R;

/* the hardest day: deepest shadow season, end of life, everything running flat out */
const hot=T.plant({d:Math.round(Y.dmin),yr:D.life,load:1});
const bol=D.Aarr*T.arrayP(T.flux(3),0),eol=D.Aarr*T.arrayP(T.flux(185),D.life);
const pnew=T.arrayP(K.S0,0),pold=T.arrayP(K.S0,D.life),Tcell=T.arrayT(K.S0);
const A20=T.radArea(T.Qdes,hot.Tr-20,hot.env);
const nbr=T.linkRate(D.sep),p10=T.pass(10*D2R);
const gnd=T.linkRate(p10.slant,{Dr:D.gndDap,loss:D.gndLoss*D.loss,cap:D.gndCap});
const passTB=gnd.R*p10.dur/8/1e12,zR=Math.PI*Math.pow(.4*D.Dap,2)/D.lam;
const hold=T.batKg(D.hkW*Y.tmax),full=T.batKg(T.Qdes*Y.tmax);
const busKg=M.structure+M.bus+M.propellant;
const dv1=T.dvYear(1),dv8=T.dvYear(8);

T.PARTS=[
 {id:'array',n:'Solar array',l:'PROPOSED',
  d:'Two wings of solar cells, each about '+f(D.Aarr/2/40)+' by 40 m, that turn to keep facing the Sun. The cells have three layers, each tuned to a different colour of light, which is how they reach about 30% where a roof panel reaches about 20%. Up here they run warm and lose a little efficiency for it, and radiation damage takes about '+f(D.deg*100)+'% more each year.',
  k:[['Area',comma(D.Aarr)+' m²'],['Cell temperature',fC(Tcell)],['Per m², new',f(pnew)+' W'],['Per m², after '+D.life+' yr',f(pold)+' W'],['Power, new, nearest the Sun',fW(bol)],['Power, '+D.life+' yr, farthest',fW(eol)],['Mass',fM(M.array)]]},

 {id:'radiators',n:'Radiators',l:'PROPOSED',
  d:'Flat panels that glow heat away from both faces. In vacuum there is no air or water to carry heat off, so glowing is the only way. The panels stay edge-on to the Sun so sunlight barely touches them. Earth fills about a quarter of each face\'s view, so each face also takes in Earth\'s own infrared glow and a little reflected sunlight. That is subtracted from what the panel sheds.',
  k:[['Area, both faces',comma(D.Arad)+' m²'],['Temperature',fC(hot.Tr)],['Net heat per m²',f(T.Qdes/D.Arad)+' W'],['Heat to shed',fW(T.Qdes)],['If 20 K cooler',comma(A20)+' m² needed'],['Mass',fM(M.radiators)]]},

 {id:'compute',n:'Compute racks',l:'PROPOSED',
  d:'About '+D.nAcc+' accelerators in racks inside the shielded vault. Each draws about '+f(D.accW/1e3,1)+' kW all in: '+D.boardW+' W for the chip board and the rest for host processors, network and power conversion. They are ordinary data-centre parts, not radiation-hardened ones. That makes them fast and cheap, but they were not made for space, so every batch has to be tested in a particle beam first.',
  k:[['Accelerators',comma(D.nAcc)],['Power each',fW(D.accW)],['Peak speed','about '+f(T.PFLOPS)+' PFLOP/s'],['Memory in total',f(D.nAcc*D.hbmGB/1e3)+' TB'],['Mass',fM(M.compute)]]},

 {id:'shield',n:'Radiation vault',l:'PROPOSED',
  d:'A box of aluminium-equivalent wall, '+f(D.shT*1e3)+' mm thick, around the electronics. It stops most of the electrons and slower protons that slowly dose the chips. It does not stop the fastest particles, the ones that flip single bits. Error correction and restarts handle those.',
  k:[['Wall thickness',f(D.shT*1e3)+' mm'],['Dose per year',f(T.dose(D.shT*1e3),2)+' krad'],['Over '+D.life+' years',f(T.doseMission(D.shT*1e3),2)+' krad'],['Chip tolerance',D.tid+' krad'],['Safety margin',f(T.tidMargin(D.shT*1e3),1)+'×'],['Mass',fM(M.shield)]]},

 {id:'power',n:'Power and battery',l:'PROPOSED',
  d:'Power electronics turn the array\'s output into the voltage the racks use. A small battery carries only the bus through the shadow, so the compute pauses and saves its work instead. Riding through on battery alone would need a pack about '+f(full/hold)+' times bigger.',
  k:[['Longest shadow',f(Y.tmax/60,1)+' min'],['Battery, bus only',fM(hold)+' ('+f(D.hkW*Y.tmax/3.6e6)+' kWh)'],['Battery, full ride-through',fM(full)+' ('+f(T.Qdes*Y.tmax/3.6e6)+' kWh)'],['Shadow season',Y.days+' days a year'],['Compute available',f(Y.avail*100,1)+'% of the year']]},

 {id:'loop',n:'Coolant loop',l:'PROPOSED',
  d:'Pumps, cold plates, pipes and heat exchangers that carry heat from every chip out to the radiators. Heat flows downhill in temperature, and each hop costs a few degrees. The coolant and hardware also store heat, so the temperature takes about half an hour to settle after the load changes.',
  k:[['Chip junction, full load',fC(hot.Tj)],['Chip limit',fC(D.Tj)],['Margin',f(D.Tj-hot.Tj,1)+' K'],['Radiator',fC(hot.Tr)],['Heat stored',f(T.Cth/1e6,1)+' MJ per kelvin'],['Settling time','about '+f(T.tauTh(hot.Tr,T.Qdes)/60)+' min'],['Coolant',fM(D.coolKg)]]},

 {id:'links',n:'Laser links',l:'PROPOSED',
  d:'Laser terminals pass data between nodes and down to the ground. Each has a '+f(D.Dap*100)+' cm aperture and sends '+D.Pt+' W of infrared at 1,550 nm. A beam this narrow hardly spreads inside about '+fD(zR)+', so a neighbour '+D.sep+' m away catches nearly all of it. Laser links between satellites already carry traffic in working constellations. The rate shown here is a design value.',
  k:[['Neighbour at '+D.sep+' m',f(nbr.eta*100)+'% of the beam caught'],['Link rate, design',fR(nbr.R)],['Ground link, design',fR(D.gndCap)],['One 10° pass',f(p10.dur/60,1)+' min, about '+f(passTB,1)+' TB'],['Light delay to ground',f(p10.delayZ*1e3,1)+' to '+f(p10.delay*1e3,1)+' ms one way']]},

 {id:'bus',n:'Bus and thrusters',l:'BUILT',
  d:'The frame that holds everything, plus star trackers and reaction wheels for pointing, electric thrusters, flight computers and radios. Thin air still drags on the node at 650 km. The radiators face the flight direction and set most of the drag, and the thrusters pay it back. At the end of life they steer the node down to burn up.',
  k:[['Mass, bus and structure',fM(busKg)],['Drag area','about '+comma(T.dragA(75*D2R))+' m²'],['Speed lost per year',f(dv1,1)+' m/s average, '+f(dv8)+' m/s at solar peak'],['Propellant, worst year','about '+f(T.propYear(dv8))+' kg']]},

 {id:'orbit',n:'Orbit and Earth',l:'BUILT',
  d:'A sun-synchronous orbit at '+fD(D.h)+', tilted '+f(T.incl/D2R,1)+'° so that Earth\'s equatorial bulge turns it once a year, matching Earth\'s trip around the Sun. Launched along the day-night line, a dawn-dusk orbit, it keeps the Sun nearly above its plane. Earth fills a cone '+f(T.rhoE/D2R*2)+'° wide below the node, and its shadow clips the orbit only in the shadow season.',
  k:[['Altitude',fD(D.h)],['Period',f(T.Tper/60,1)+' min'],['Speed',f(T.vel/1e3,2)+' km/s'],['Orbits per day',f(86400/T.Tper,1)],['Sun to orbit angle',f(Y.bmin/D2R,1)+'° to '+f(Y.bmax/D2R)+'°'],['Shadow season',T.dayLabel(Y.from)+' to '+T.dayLabel(Y.to)]]}
];
})();
