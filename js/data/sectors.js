/* All sector content lives here. Add a topic = add one line to tp: [name, subtitle].
   Add a loose idea = add a string to ideas: [...]. Ideas show under the home card carousel.
   When its file exists at js/topics/<sector id>/<slug>.js, add its slug to HV.BUILT below. */
(function(){
const HV=window.HV=window.HV||{};

HV.SECTORS=[
 {id:'flight',n:'Spaceflight',i:'🚀',c:'#5df2ff',t:'How we leave the planet.',tp:[['Spaceship','How a crewed fusion ship works'],['Rocket and capsule','Launch, orbit, return'],['Fusion drive','Pushing with plasma']],
  ideas:['Solar sail','Lunar base','Space tug','Nuclear thermal rocket','Reusable booster','Interstellar probe']},
 {id:'energy',n:'Energy',i:'☀️',c:'#ffb84d',t:'Power that changes what is possible.',tp:[['Fusion reactor','A star in a magnetic bottle'],['Dyson swarm','Collecting a star'],['Space solar power','Sunlight beamed down']],
  ideas:['Solid-state battery','Tidal power','Hydrogen grid','Fission microreactor','Superconducting grid','Wind farm']},
 {id:'mega',n:'Megastructures',i:'🏗️',c:'#ff8a5d',t:'Engineering at planetary scale.',tp:[['Space elevator','A cable to orbit'],['Orbital ring','A loop around Earth'],['Ark station','A spinning city'],['Deployable tower','Shrinks before the storm']],
  ideas:['Floating city','Mass driver','Lunar elevator','Undersea tunnel','Giant sea wall']},
 {id:'life',n:'Life and Medicine',i:'🧬',c:'#7dff9a',t:'Rebuilding the body from inside.',tp:[['Bloodstream','Shrink and ride along'],['Nanobots','Repair at cell scale'],['Gene editing','Rewriting the code']],
  ideas:['Artificial organ','Brain interface','Lab-grown meat','Bionic limb','Cryosleep','Organ printing']},
 {id:'earth',n:'Earth and Climate',i:'🌍',c:'#4dd2a6',t:'Reading and reshaping a planet.',tp:[['Terraforming','Making worlds livable'],['Geothermal','Heat from below'],['Storm science','Inside a hurricane']],
  ideas:['Carbon capture','Cloud seeding','Desalination','Ice sheet watch','Volcano monitoring']},
 {id:'mind',n:'Computing and AI',i:'🧠',c:'#b18cff',t:'Machines that think and calculate.',tp:[['Inside a chip','Walk the transistors'],['Quantum computer','Qubits in the cold'],['Orbital data center','Servers in space']],
  ideas:['Neural network','Neuromorphic chip','Optical computer','DNA storage','Mesh internet']},
 {id:'move',n:'Transport',i:'🚄',c:'#ff3df2',t:'Moving people faster and cleaner.',tp:[['Maglev','Riding a magnetic field'],['Vacuum tube','Trains without air'],['Hover vehicles','Lift without wheels']],
  ideas:['Electric plane','Cargo airship','Autonomous ship','Skyhook','Hydrogen train']},
 {id:'deep',n:'Ocean and Deep',i:'🌊',c:'#3d8bff',t:'The frontier under the surface.',tp:[['Undersea habitat','Living on the seabed'],['Submersible','Pressure and light']],
  ideas:['Ocean thermal power','Kelp farm','Deep-sea mining','Tsunami buoys','Hydrothermal vents']},
 {id:'nano',n:'Materials and Nano',i:'⚛️',c:'#ffe14d',t:'Matter, designed from the atom up.',tp:[['Graphene','One atom thick'],['Metamaterials','Bending light']],
  ideas:['Aerogel','Carbon nanotube','Quantum dots','Self-healing material','Superconductor','Shape-memory alloy']},
 {id:'phys',n:'Physics Frontier',i:'🕳️',c:'#ff5d7a',t:'Where known physics gets strange.',tp:[['Black hole','Light bent and trapped'],['Time dilation','Clocks that disagree'],['Warp drive','A bubble in spacetime']],
  ideas:['Wormhole','Antimatter','Dark matter','Gravitational waves','Neutron star']},
 {id:'bots',n:'Robotics',i:'🤖',c:'#c0c8d8',t:'Machines that build, farm and walk.',tp:[['Robot farm','Fields without farmers'],['Giant mech','Walking at skyscraper size']],
  ideas:['Surgical robot','Swarm drones','Exoskeleton','Humanoid worker','Underwater crawler']}
];

/* topics that have a built file; they open from the sector page and load on demand */
HV.BUILT=['spaceship','nanobots','fusion-reactor','deployable-tower','dyson-swarm','graphene','metamaterials'];

/* the one rule for 'is this topic built'. Home, sector page and loader all use it. */
HV.isLive=x=>HV.BUILT.indexOf(x[0].toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''))>=0;

HV.sec=id=>HV.SECTORS.find(s=>s.id===id);
})();
