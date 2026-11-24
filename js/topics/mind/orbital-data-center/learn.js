/* Orbital data center · Learn. 14 sections, each labelled BUILT (exists today), PROPOSED (designed with known technology)
   or THEORETICAL (depends on something unproven). Numbers from the reference node are computed from core.js so the page can
   never disagree with the model. Facts about real missions (Starcloud, Google, SpaceX) are as reported by late November 2026. */
(function(){
const T=window.HV.T.odc,D=T.DES,K=T.K,f=T.f,fW=T.fW,fM=T.fM,fD=T.fD,fC=T.fC,fR=T.fR,comma=T.comma,D2R=T.D2R;
const Y=T.YEAR,M=T.MASSKG,Q=T.Qdes;

const hot=T.plant({d:Math.round(Y.dmin),yr:D.life,load:1});
const Tcell=T.arrayT(K.S0),eta=T.etaT(Tcell),pnew=T.arrayP(K.S0,0),pold=T.arrayP(K.S0,D.life);
const bol=D.Aarr*T.arrayP(T.flux(3),0),eol=D.Aarr*T.arrayP(T.flux(185),D.life);
const ratioE=K.S0*Y.avail/250;                                              /* orbit against a very good ground site averaging about 250 W/m² */
const aOf=Tk=>comma(T.radArea(Q,Tk,hot.env));
const pump=T.hp(Q,340,400);
const m5=D.shT*1e3,d5=T.dose(m5),tot5=T.doseMission(m5),mg5=T.tidMargin(m5),mg12=T.tidMargin(12);
const lamQ=T.lamFleet(false),lamS=T.lamFleet(true),tcQ=T.youngDaly(lamQ),tcS=T.youngDaly(lamS);
const gQ=T.goodput(lamQ,tcQ),gS=T.goodput(lamS,tcS);
const nbr=T.linkRate(D.sep),p10=T.pass(10*D2R),zR=Math.PI*Math.pow(.4*D.Dap,2)/D.lam;
const gnd=T.linkRate(p10.slant,{Dr:D.gndDap,loss:D.gndLoss*D.loss,cap:D.gndCap}),passTB=gnd.R*p10.dur/8/1e12;
const dv1=T.dvYear(1),dv8=T.dvYear(8);
const pr=p=>'$'+f(T.launchKWh(p),2);

T.LEARN=[
 {h:'The idea',l:'PROPOSED',p:[
  'AI data centres on Earth are held back by power connections, land, water and heat. In orbit there is almost no night, no weather, and a sky at about −270 °C to dump heat into. The idea is to put the computers where the Sun is and send back only the answers.',
  'The catch is that every watt has to be launched, and the only way to get rid of heat is to glow it away. This topic follows one node: about '+fW(Q)+' of computing, '+D.nAcc+' accelerators, '+fM(M.total)+' at launch. It is labelled PROPOSED because every part exists, but nobody has built a node this large.']},

 {h:'What has flown',l:'BUILT',p:[
  'Small versions are already up. In November 2025 the startup Starcloud launched a satellite carrying an NVIDIA H100, a data-centre GPU, and ran an AI model on it from orbit. On 1 October 2026 Google launched a fridge-sized prototype with four of its TPU chips, built with Planet. It runs a small AI model for only 15 minutes at a time because of heat, and Google describes it as a minimal test.',
  'These carry one GPU or four chips, not hundreds. Google\'s prototype flies in an ordinary orbit and uses batteries, and its future satellites are planned for sun-synchronous orbit. Google plans two more satellites next year to test the links between them, and SpaceX has said in a filing that it expects to start deploying orbital AI compute satellites as early as 2028. The '+fW(Q)+' node here is far larger than anything flying. Status as of late November 2026.']},

 {h:'Sunlight without night',l:'BUILT',p:[
  'The node flies at '+fD(D.h)+' in a sun-synchronous orbit. Earth bulges at the equator, and the bulge slowly turns any tilted orbit. At an inclination of '+f(T.incl/D2R,1)+'°, a little past the poles, the turning is exactly once a year, matching Earth\'s trip around the Sun. The orbit keeps the same angle to the Sun all year.',
  'Launch it along the day-night line, a dawn-dusk orbit, and the Sun sits nearly straight above the orbit\'s plane. The node rides the border between day and night. Sunlight out here is '+f(K.S0)+' W/m². A very good desert site averages about 250 W/m² over day, night and weather. After counting eclipses, a square metre of array in this orbit collects about '+f(ratioE,1)+' times as much energy. That is the real prize.']},

 {h:'Not quite eclipse-free',l:'BUILT',p:[
  'A dawn-dusk orbit is not shadow-free all year. The Sun swings 23.4° north and south through the seasons while the orbit plane stays put, so the Sun sometimes sits well off the plane\'s straight-up direction. That angle is called beta. Here it ranges from '+f(Y.bmin/D2R,1)+'° to '+f(Y.bmax/D2R)+'°, and below '+f(T.betaStar/D2R,1)+'° the orbit clips Earth\'s shadow.',
  'That happens from '+T.dayLabel(Y.from)+' to '+T.dayLabel(Y.to)+', '+Y.days+' days a year. The deepest shadow is '+f(Y.tmax/60,1)+' minutes per orbit on '+T.dayLabel(Y.dmin)+'. Earth\'s orbit is slightly oval, so sunlight is also about 3% stronger in early January than in July. Over a year the node is in sunlight '+f(Y.avail*100,1)+'% of the time. In shadow the compute pauses and saves its work, because a battery big enough to keep it running would be too heavy.']},

 {h:'Making power',l:'PROPOSED',p:[
  'The array is '+comma(D.Aarr)+' m² of triple-junction cells, three layers each tuned to a different colour of light. They absorb about 90% of the sunlight but turn only about '+f(eta*100)+'% into electricity. The rest becomes heat, and the array glows it away from both faces, settling at about '+fC(Tcell)+'. Warm cells are a little less efficient, and the model includes that.',
  'Each square metre delivers about '+f(pnew)+' W new and '+f(pold)+' W after '+D.life+' years of radiation damage at '+f(D.deg*100)+'% a year. In total that is '+fW(bol)+' new when Earth is nearest the Sun, and '+fW(eol)+' after '+D.life+' years when it is farthest, against a load of '+fW(Q)+'. The '+f((eol/Q-1)*100)+'% left over is the cushion for everything the model does not know.']},

 {h:'Heat is the real problem',l:'PROPOSED',p:[
  'On Earth, air or water carries heat away. In vacuum nothing does, so a surface can only glow it off as infrared light. Each face sheds emissivity × 5.67×10⁻⁸ × temperature⁴ per square metre, with temperature in kelvin and an emissivity of about 0.85 for these panels. The fourth power matters: a panel 10% hotter sheds about 46% more.',
  'All '+fW(Q)+' of electricity ends up as heat, so the node needs '+comma(D.Arad)+' m² of two-sided panel. At 300 K it would need about '+aOf(300)+' m², and at 360 K only about '+aOf(360)+' m². So why not run them hot? The chips cap it: they must stay under '+fC(D.Tj)+', which holds the radiators near '+fC(hot.Tr)+'. A heat pump could lift the heat to a hotter radiator, but a realistic pump, at 40% of the ideal, would need about '+fW(pump.W)+' more power to lift from 340 K to 400 K. That costs more mass than the smaller radiators save.']},

 {h:'From chip to sky',l:'PROPOSED',p:[
  'Heat flows downhill in temperature from the chip to the radiator. At full load on the hardest day the chip junction sits at '+fC(hot.Tj)+' and the radiator at '+fC(hot.Tr)+'. The hops cost '+f(D.dLoop)+' K around the coolant loop, about '+f(D.rcp*D.boardW,1)+' K across the cold plate and about '+f(D.rjc*D.boardW)+' K inside the chip package. The chip limit is '+fC(D.Tj)+', so the margin is only '+f(D.Tj-hot.Tj,1)+' K.',
  'The coolant and hardware also store heat: '+f(T.Cth/1e6,1)+' MJ for every kelvin. Set against the T⁴ law, that gives a settling time of about '+f(T.tauTh(hot.Tr,Q)/60)+' minutes. After a change in load the temperature takes about half an hour to catch up. A short burst is absorbed. A long overload is not.']},

 {h:'Radiation: the dose',l:'BUILT',p:[
  'Charged particles trapped in Earth\'s magnetic field, mostly electrons and protons, hit the node all the time. Over years they build up charge in the chips\' insulating layers and slowly shift how the transistors switch. That is the total ionising dose, counted in rad of silicon. A tolerance of '+D.tid+' krad is 150 gray. A person is in serious danger at about 4 to 5 gray, but chips are tougher than people.',
  'Aluminium walls cut the dose steeply. The design curve here gives '+f(T.dose(1))+' krad a year behind 1 mm, '+f(d5,2)+' behind the '+f(m5)+' mm vault wall and '+f(T.dose(12),2)+' behind 12 mm. Over '+D.life+' years that is '+f(tot5,2)+' krad at '+f(m5)+' mm, a margin of '+f(mg5,1)+'× against the chip tolerance. A 12 mm wall would give '+f(mg12)+'× but add '+fM(T.shieldKg(12)-T.shieldKg(m5))+' of wall.']},

 {h:'Radiation: bit flips',l:'BUILT',p:[
  'A wall cannot stop everything. One fast particle, a cosmic ray or a high-energy proton, can pass through and leave a trail of charge in a single transistor, flipping a bit. The orbit crosses the South Atlantic Anomaly, where the inner radiation belt dips low, and the polar regions, where the magnetic field protects less. This model gives about '+f(T.rawPerAccDay,1)+' raw bit flips per accelerator per day.',
  'Error-correcting memory fixes single flips without anyone noticing. About 1 flip in '+f(1/D.mbu)+' damages several bits at once, which the memory cannot fix. That is about '+f(T.uePerAccDay,2)+' per accelerator per day, or '+f(lamQ,1)+' job restarts an hour across the node. With a checkpoint every '+f(tcQ/60)+' minutes, the best interval for that rate, about '+f(gQ*100)+'% of the time goes to real work. In a solar storm the rate is '+D.spe+' times higher and the share of time on real work falls to about '+f(gS*100)+'%. Answering questions suffers less than a long training run.']},

 {h:'Moving data',l:'PROPOSED',p:[
  'Nodes talk by laser. Each terminal has a '+f(D.Dap*100)+' cm aperture and sends '+D.Pt+' W of 1,550 nm infrared. A beam this narrow hardly spreads within about '+fD(zR)+', so a neighbour '+D.sep+' m away catches about '+f(nbr.eta*100)+'% of it. The link then runs at the limit of the modulation hardware, a design value of '+fR(D.rateCap)+', not at the limit of the light.',
  'The ground is much harder. A pass at 10° elevation lasts about '+f(p10.dur/60,1)+' minutes, with the node '+fD(p10.slant)+' away and a delay of '+f(p10.delay*1e3,1)+' ms one way. At '+fR(D.gndCap)+' that is about '+f(passTB,1)+' TB per pass, if the sky is clear. A petabyte would take about '+f(1000/passTB)+' passes. So orbital compute suits jobs heavy on computing and light on data, like answering questions or processing images taken in orbit.']},

 {h:'What it weighs',l:'PROPOSED',p:[
  'Everything has to be launched. The node weighs '+fM(M.total)+', about '+f(M.total/(Q/1e3))+' kg for every kilowatt of computing. The racks are '+fM(M.compute)+', the array '+fM(M.array)+', the radiation vault '+fM(M.shield)+', and the radiators '+fM(M.radiators)+'. Structure, coolant loop, bus, propellant and battery make up the rest.',
  'Google\'s project lead has said radiators are among the heaviest parts of its prototype. Lighter versions of everything are being worked on, and some company plans aim for far less mass per kilowatt than this. The design values here are cautious, so treat the total as a careful estimate, not a floor.']},

 {h:'Does the money work',l:'THEORETICAL',p:[
  'Spread launch cost over the energy the node uses in its '+D.life+'-year life, '+f(T.kwhLife/1e6,1)+' GWh, and launch alone comes to about '+pr(3000)+' per kWh at $3,000 per kg, '+pr(1000)+' at $1,000, '+pr(500)+' at $500 and '+pr(100)+' at $100. Grid power costs about $'+f(D.grid,2)+' per kWh, a typical industrial rate, so launch alone only matches it near $'+f(T.breakEven(D.grid))+' per kg.',
  'That leaves out the chips, which cost the same on the ground. It also leaves out insurance, the ground network, and that a failed accelerator cannot be swapped. Google\'s project lead has said he does not expect orbital computing to beat the ground on cost within five years. Rocket exhaust and burn-up at the end of life are open questions too. The physics works. The money depends on launch prices that do not exist yet.']},

 {h:'Staying up',l:'BUILT',p:[
  'At '+fD(D.h)+' there is still a trace of air: about '+T.sci(T.rho(D.h),0)+' kg/m³ at average solar activity, roughly twenty trillion times thinner than at sea level. The radiators face the flight direction, so the node shows about '+comma(T.dragA(75*D2R))+' m² to the flow. Drag takes about '+f(dv1,1)+' m/s of speed a year, or about '+f(dv8)+' m/s at solar maximum when the upper air swells.',
  'Electric thrusters can pay that back with about '+f(T.propYear(dv8))+' kg of propellant in the worst year. Wings and radiators this large are also a big target for debris. The node has to dodge tracked objects and, at the end of its life, steer down to burn up. This model counts drag but not collisions.']},

 {h:'What this model leaves out',l:'THEORETICAL',p:[
  'The Launch and Fly runs follow one reference design, not any company\'s. The orbit is circular, and Earth\'s shadow has a sharp edge. Earth reflects sunlight evenly in all directions. Radiation uses a fixed dose curve instead of a full AE-9 and AP-9 run for the orbit. One failure rate stands for every accelerator, and one lumped thermal mass stands for the whole loop.',
  'It leaves out unfolding '+f(D.Aarr/2/40)+' by 40 m wings, pointing jitter, flexing of the structure, micrometeoroid damage, launch loads, formation-flying control, the ground network, software, and the cost of anything but launch. Masses are design values, and real hardware is usually heavier than a first estimate. The numbers show how the idea behaves and where it is hard, not what any one company will build.']}
];
})();
