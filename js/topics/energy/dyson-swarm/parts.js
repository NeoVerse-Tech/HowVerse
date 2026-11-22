/* Dyson swarm · parts. Phase 3: four features of the Sun, two parts of the swarm and three parts of the nexus.
   The ids are what world.js uses to find each piece, so keep them stable.
   Hub and Earth parts are added in later phases. Labels: BUILT, PROPOSED, THEORETICAL. */
(function(){
const T=window.HV.T.dyson,S=T.SUN,f=T.f,sci=T.sci,comma=T.comma,B=T.beam,H=T.heat,U=T.HUBU;
const o=T.orbit(T.REAL_AU),F=T.flux(T.REAL_AU),P=T.press(T.REAL_AU),RR=T.REAL_AU*T.AU/S.R;

T.PARTS=[
 {id:'photosphere',n:'Photosphere',l:'BUILT',
  d:'The visible surface of the Sun, a layer only a few hundred kilometres thick. It is covered in granules, cells of rising hot plasma about 1,000 km across. The edge looks darker and redder than the centre because you see cooler, higher gas there.',
  k:[['Temperature',comma(S.Teff)+' K'],['Radius',comma(S.R/1e3)+' km'],['Power output',sci(S.L)+' W'],['Granule size','about 1,000 km']]},

 {id:'spots',n:'Sunspots',l:'BUILT',
  d:'Dark patches where strong magnetic fields hold back the heat flowing up from below. They are cooler than the gas around them, which is why they look dark. They form in bands away from the equator and follow a cycle of about 11 years.',
  k:[['Temperature','3,500 to 4,500 K'],['Latitude','about 10° to 35°'],['Cycle','about 11 years']]},

 {id:'corona',n:'Corona',l:'BUILT',
  d:'The Sun\'s thin outer atmosphere, a million times fainter than the surface. It is hotter than the surface by hundreds of times, and why is still debated. Its streamers follow the magnetic field and are strongest near the equator.',
  k:[['Temperature','1 to 2 million K'],['Visible','during a total eclipse'],['Surface brightness','far below the disc']]},

 {id:'prominences',n:'Prominences',l:'BUILT',
  d:'Arches of cool, dense plasma held up above the surface by magnetic fields. They glow reddish. Some last for weeks and others erupt in hours, and the biggest reach hundreds of thousands of kilometres.',
  k:[['Reach','up to hundreds of thousands of km'],['Colour','red, from hydrogen'],['Held up by','magnetic fields']]},

 {id:'collectors',n:'Collectors',l:'THEORETICAL',
  d:'Thin hexagonal mirrors, each in its own orbit, facing the Sun. Solar sails already fly: Japan\'s IKAROS in 2010 and LightSail 2 in 2019 were both real. But those are hundreds of square metres. A swarm of millions of kilometre-wide collectors has never been built. On screen the collectors are drawn far larger than to scale, so you can see them.',
  k:[['Orbit',T.REAL_AU+' AU, '+f(RR,1)+' Sun radii'],['Orbit speed',f(o.v/1e3)+' km/s'],['One orbit',f(o.days,0)+' days'],['Sunlight there',comma(F)+' W/m²'],['Light push on a mirror',f(P*1e6,0)+' µPa'],['Real sails','IKAROS 2010, LightSail 2 2019']]},

 {id:'shells',n:'Orbit layers',l:'PROPOSED',
  d:'The swarm is not one ring or one shell. Collectors sit in several layers at different distances and tilts, so their paths do not cross. Orbits around a star are well-understood physics. Pull the slider to spread the three layers apart. On screen the swarm is pulled in to '+T.SW+' Sun radii. In the real design it would be about '+f(RR,0)+'.',
  k:[['Layers on screen',3],['Tilts','every direction'],['Real distance',T.REAL_AU+' AU'],['On screen',T.SW+' Sun radii']]},

 {id:'beams',n:'Power beams',l:'THEORETICAL',
  d:'The glowing collectors are the ones sending power. Each turns its energy into a narrow beam and aims it at the nearest relay it can see. Beaming power is real but small. In 2015 JAXA sent 1.8 kW by microwave to a receiver 55 m away. Here the beams carry terawatts across millions of kilometres. Real beams would be invisible in the vacuum. The lines and pulses are drawn so you can see the flow, and brighter means more power.',
  k:[['Real record','1.8 kW over 55 m (JAXA 2015)'],['Colour','gold from collectors, cyan from relays'],['Brightness','how much power flows'],['Visible in real space','no']]},

 {id:'relays',n:'Relay nodes',l:'PROPOSED',
  d:'Twelve stations orbiting inside the swarm. Each gathers beams from the collectors near it and passes the combined power on. The Sun blocks the line of sight to the far side, so a relay that cannot see the gateway hands its power to a relay that can. Watch the lines change as they orbit.',
  k:[['Relays on screen',12],['Collectors feeding in','320 shown'],['Handover','when the Sun is in the way'],['Orbit','same layer as the middle swarm']]},

 {id:'gateway',n:'Gateway and trunk beam',l:'THEORETICAL',
  d:'A station held in place beyond the swarm by light pressure, an idea called a statite. It gathers everything the relays send and fires one trunk beam toward the hub ship. With a mirror '+comma(B.D)+' m across and near-infrared light, the beam stays about '+f(B.spot*2,0)+' m wide after '+comma(B.L/1e9)+' million km, so spreading is manageable. The hard part is aiming within about '+f(B.aimMas,1)+' milli-arcseconds. These figures are illustrative, not a finished design. The hub itself comes next.',
  k:[['Mirror',comma(B.D)+' m'],['Light','near-infrared, '+f(B.lambda*1e6,1)+' µm'],['Distance to hub',comma(B.L/1e9)+' million km'],['Beam width at hub',f(B.spot*2,0)+' m'],['Aiming tolerance',f(B.aimMas,1)+' milli-arcsec']]},

 {id:'receiver',n:'Receiver array',l:'THEORETICAL',
  d:'A huge dish of tiles at the hub\'s sunward end that catches the trunk beam. It is made about three times wider than the beam, so small aiming errors still land on it. Light spreading across the tiles is turned into electricity. Nothing like it has been built. The glow shows how much power is arriving.',
  k:[['Width',f(18*U/1e3,0)+' km'],['Beam on it',f(B.spot*2/1e3,1)+' km'],['Tiles on screen','about 250'],['Held at','Sun-Earth L1']]},

 {id:'core',n:'Power core',l:'PROPOSED',
  d:'The spine and the converter drums. They turn the arriving beam into steady electrical power and condition it for the trip to Earth. No conversion is perfect, and the losses become heat. That heat is the hub\'s biggest design problem.',
  k:[['Spine length',f(33*U/1e3,1)+' km'],['Assumed loss','10%'],['Waste heat',f(H.W/1e12,1)+' TW'],['Handles','all of humanity\'s power, 19 TW']]},

 {id:'dock',n:'Dock ring',l:'PROPOSED',
  d:'A ring around the spine with 16 docking ports, where ships arrive for repairs, supplies and crew changes. Docking ports are standard on the International Space Station, which has had them since 1998. The ring here is far larger, and the ships are drawn bigger than they would be.',
  k:[['Ring width',f(22*U/1e3,1)+' km'],['Ports',16],['Real precedent','ISS docking, since 1998']]},

 {id:'gantry',n:'Repair gantry',l:'PROPOSED',
  d:'A frame with two robot arms that holds a damaged collector and repairs it. Big space robot arms exist: Canadarm2 has worked on the Space Station since 2001. A gantry that fixes kilometre-wide collectors would be much larger. The arms swing slowly as they work.',
  k:[['Robot arms',2],['Holds','one damaged collector'],['Real precedent','Canadarm2, 2001']]},

 {id:'fab',n:'Fabrication bay',l:'THEORETICAL',
  d:'A factory that makes new collectors from raw material and sends them out toward the swarm. Small 3D printers have worked in orbit, but nobody has made kilometre-wide thin films in space. You see finished collectors leaving the bay and heading toward the Sun.',
  k:[['Job','build and replace collectors'],['Output','sent out toward the swarm'],['Real precedent','3D printers on the ISS']]},

 {id:'radiators',n:'Radiator wings',l:'PROPOSED',
  d:'Two huge panels held edge-on to the Sun so they stay cool and shed heat from both faces into space. In a vacuum, heat can only leave as light. At 1,000 K a panel sheds about '+f(H.perM2/1e3,0)+' kW per square metre, so the waste heat needs about '+f(H.area1000/1e6,0)+' km² of panel. At 400 K it would need about '+comma(H.area400/1e6)+' km². The wings are drawn near the 1,000 K size. They glow brighter as more power flows.',
  k:[['Waste heat',f(H.W/1e12,1)+' TW'],['Panel at 1,000 K',f(H.area1000/1e6,0)+' km²'],['Panel at 400 K',comma(H.area400/1e6)+' km²'],['Real precedent','ISS radiators']]},

 {id:'emitter',n:'Emitter mirror',l:'THEORETICAL',
  d:'The segmented mirror at the hub\'s Earth end. It aims the outgoing beam at Earth, about '+f(T.L1M/1e9,1)+' million km away. It glows brighter when power is leaving. The Earth link is built in the next phase.',
  k:[['Width',f(15*U/1e3,1)+' km'],['Aims at','Earth'],['Distance to Earth',f(T.L1M/1e9,1)+' million km'],['Status','Earth link comes next']]},

 {id:'traffic',n:'Repair ships',l:'PROPOSED',
  d:'Eight small ships shuttle between the dock ring and the swarm, carrying crews, spares and tools. They leave a port, fly out to the collectors, work there, and come home. They are drawn far larger than real ones so you can see them.',
  k:[['Ships on screen',8],['Job','repair and swap collectors'],['Trip','dock to swarm and back']]}
];
})();
