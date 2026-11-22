/* Nanobots · World tab: the seven parts and what they do */
(function(){
const T=(window.HV.T=window.HV.T||{}).nanobots=window.HV.T.nanobots||{};
/* ---------- parts shown in the World tab ---------- */
const PARTS=[
 {id:'head',n:'Magnetic head',l:'BUILT',d:'A sphere about 1 µm across made of a magnetic metal such as nickel or cobalt, or of iron oxide. The outside field grips it and twists it, and the helix is dragged round with it. It is the only part that needs to feel the field.',k:[['Size','about 1 µm'],['Material','nickel, cobalt or iron oxide'],['Field needed','a few mT']]},
 {id:'tail',n:'Helical tail',l:'BUILT',d:'A rigid corkscrew about 2 µm long. A rotating corkscrew is not reversible, so it beats the scallop theorem: every turn pushes fluid backward and the bot forward, like a screw through honey.',k:[['Length','about 2 µm'],['Pitch','about 2 µm'],['Ideal speed','rotation rate × pitch']]},
 {id:'payload',n:'Drug payload',l:'BUILT',d:'Beads or a porous layer holding a clot-dissolving enzyme. Carrying the drug on the bot means a small dose released exactly at the clot, instead of a large dose through the whole body.',k:[['Carried by','porous beads or liposomes'],['Cargo','clot-dissolving enzyme']]},
 {id:'ligands',n:'Targeting molecules',l:'BUILT',d:'Antibodies or short peptides on the surface that bind fibrin, the protein mesh of a clot. They make the bot stick at the clot, which matters because blood flow is far stronger than the bot’s swimming.',k:[['Binds','fibrin'],['Why','blood outruns the bot']]},
 {id:'coat',n:'Stealth coating',l:'BUILT',d:'A thin biocompatible layer, often a polymer such as PEG over gold or titanium, that hides the bot from the immune system and keeps the metal from harming tissue. It must also break down safely afterwards.',k:[['Thickness','a few to tens of nm'],['Job','hide and protect']]},
 {id:'lock',n:'Release lock',l:'PROPOSED',d:'A gate that opens only when the bot reaches its target. DNA locks that open on a marker protein exist in the lab. Fitting one into this bot, and making it work in blood, is still research.',k:[['Trigger','marker protein, pH or ultrasound'],['Status','lab research']]},
 {id:'coils',n:'Field coils',l:'BUILT',d:'The real engine is outside the body. Several electromagnet coils around the patient make a rotating field of a few millitesla, and tilting it steers the bot. Systems like this already steer magnetic catheters.',k:[['Field','about 10 mT'],['Rotation','about 20 Hz']]}
];

Object.assign(T,{PARTS});
})();
