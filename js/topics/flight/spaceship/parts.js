/* Spaceship · World tab: the seven parts */
(function(){
const T=(window.HV.T=window.HV.T||{}).spaceship=window.HV.T.spaceship||{};

/* ---------- parts shown in the World tab ---------- */
const PARTS=[
 {id:'hull',n:'Crew hull',l:'PROPOSED',d:'The pressurised section where the crew lives and flies the ship. It sits at the front, with the whole ship behind it acting as a shield.',k:[['Length','about 40 m total'],['Crew','3 to 6']]},
 {id:'ring',n:'Spin ring',l:'PROPOSED',d:'A wheel that turns slowly to press the crew against its floor. Spin gravity equals angular speed squared times radius. Nothing like it has flown.',k:[['Radius','8.5 m'],['Spin','6 rpm'],['Gravity','0.34 g']]},
 {id:'shield',n:'Shadow shield',l:'PROPOSED',d:'A thick disc between reactor and crew. Fusion throws out neutrons and gamma rays, and the crew sit in the shield’s shadow, so the radiation never reaches them.',k:[['Job','blocks neutrons, gamma']]},
 {id:'reactor',n:'Fusion reactor',l:'THEORETICAL',d:'Light atoms are squeezed hot enough to fuse and release energy. Lab fusion has beaten break-even at the target, but no reactor yet powers a vehicle.',k:[['Jet power','1 GW'],['Plasma','over 100 million K']]},
 {id:'tanks',n:'Propellant tanks',l:'PROPOSED',d:'Cold propellant is heated by the reactor and thrown out the back. Tanks sit beside the reactor, and the stored mass also helps stop radiation.',k:[['Propellant','60 t'],['Dry mass','140 t']]},
 {id:'rad',n:'Radiators',l:'BUILT',d:'Space has no air, so heat can only leave as light. The big fins glow as the load rises. The ISS already carries radiators; this ship needs far bigger ones. The fins drawn here are schematic. The area figure assumes about 1 GW of waste heat radiated at 1,500 K.',k:[['Law','power grows with T⁴'],['Area needed','about 3,900 m²']]},
 {id:'coils',n:'Magnetic nozzle',l:'THEORETICAL',d:'No solid nozzle could survive the plasma. Superconducting coils steer it instead, turning a hot cloud into a narrow beam.',k:[['Exhaust speed','100 km/s'],['Thrust','20 kN']]}
];

Object.assign(T,{PARTS});
})();
