/* All sector content lives here. Add a topic = add one line to tp: [name, subtitle]. */
(function(){
const HV=window.HV=window.HV||{};

HV.SECTORS=[
 {id:'flight',n:'Spaceflight',i:'🚀',c:'#5df2ff',t:'How we leave the planet.',tp:[['Spaceship','How a crewed fusion ship works'],['Rocket and capsule','Launch, orbit, return'],['Fusion drive','Pushing with plasma']]},
 {id:'energy',n:'Energy',i:'☀️',c:'#ffb84d',t:'Power that changes what is possible.',tp:[['Fusion reactor','A star in a magnetic bottle'],['Dyson swarm','Collecting a star'],['Space solar power','Sunlight beamed down']]},
 {id:'mega',n:'Megastructures',i:'🏗️',c:'#ff8a5d',t:'Engineering at planetary scale.',tp:[['Space elevator','A cable to orbit'],['Orbital ring','A loop around Earth'],['Ark station','A spinning city']]},
 {id:'life',n:'Life and Medicine',i:'🧬',c:'#7dff9a',t:'Rebuilding the body from inside.',tp:[['Bloodstream','Shrink and ride along'],['Nanobots','Repair at cell scale'],['Gene editing','Rewriting the code']]},
 {id:'earth',n:'Earth and Climate',i:'🌍',c:'#4dd2a6',t:'Reading and reshaping a planet.',tp:[['Terraforming','Making worlds livable'],['Geothermal','Heat from below'],['Storm science','Inside a hurricane']]},
 {id:'mind',n:'Computing and AI',i:'🧠',c:'#b18cff',t:'Machines that think and calculate.',tp:[['Inside a chip','Walk the transistors'],['Quantum computer','Qubits in the cold'],['Orbital data center','Servers in space']]},
 {id:'move',n:'Transport',i:'🚄',c:'#ff3df2',t:'Moving people faster and cleaner.',tp:[['Maglev','Riding a magnetic field'],['Vacuum tube','Trains without air'],['Hover vehicles','Lift without wheels']]},
 {id:'deep',n:'Ocean and Deep',i:'🌊',c:'#3d8bff',t:'The frontier under the surface.',tp:[['Undersea habitat','Living on the seabed'],['Submersible','Pressure and light']]},
 {id:'nano',n:'Materials and Nano',i:'⚛️',c:'#ffe14d',t:'Matter, designed from the atom up.',tp:[['Graphene','One atom thick'],['Metamaterials','Bending light']]},
 {id:'phys',n:'Physics Frontier',i:'🕳️',c:'#ff5d7a',t:'Where known physics gets strange.',tp:[['Black hole','Light bent and trapped'],['Time dilation','Clocks that disagree'],['Warp drive','A bubble in spacetime']]},
 {id:'bots',n:'Robotics',i:'🤖',c:'#c0c8d8',t:'Machines that build, farm and walk.',tp:[['Robot farm','Fields without farmers'],['Giant mech','Walking at skyscraper size']]}
];

HV.sec=id=>HV.SECTORS.find(s=>s.id===id);
})();
