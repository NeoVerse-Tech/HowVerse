/* Dyson swarm · Learn. Phases 1 to 3: the Sun, the swarm's collectors and orbits, and the nexus that moves the power.
   Hub and Earth sections arrive with their phases.
   Labels: BUILT (measured or exists today), PROPOSED (designed with known technology), THEORETICAL (unproven).
   Every number is computed from core.js so the page can never disagree with the model. */
(function(){
const T=window.HV.T.dyson,S=T.SUN,AU=T.AU,f=T.f,sci=T.sci,comma=T.comma,PI=T.PI,B=T.beam;
const HUMAN=1.9e13;                                              /* humanity's average power use, about 19 TW */

const ratio=S.L/HUMAN;
const earthCatch=Math.pow(6.371e6,2)/(4*AU*AU);                  /* fraction of the Sun's output that lands on Earth */
const massRate=S.L/(T.C*T.C);                                    /* kg of mass turned to energy each second */
const tLight=AU/T.C/60;                                          /* minutes for sunlight to reach Earth */
const F03=T.flux(T.REAL_AU),eff=.3,area=HUMAN/(eff*F03);         /* collector area at the swarm for all of humanity's power at 30% efficiency */
const side=Math.sqrt(area)/1e3;
const shell=4*PI*Math.pow(T.REAL_AU*AU,2);
const orb=T.orbit(T.REAL_AU),press=T.press(T.REAL_AU),RR=T.REAL_AU*AU/S.R,H=T.heat;

T.LEARN=[
 {h:'Why collect a star',l:'PROPOSED',p:[
  'Humanity uses about 19 terawatts, averaged over the year. The Sun puts out '+sci(S.L)+' watts. That is about '+sci(ratio,1)+' times more than we use, and nearly all of it goes into empty space.',
  'Earth catches only about '+sci(earthCatch,1)+' of the Sun\'s output. A Dyson swarm is the idea of catching far more of it, with a crowd of collectors that orbit the Sun instead of sitting on one planet.']},

 {h:'What the Sun is',l:'BUILT',p:[
  'The Sun is a ball of hot plasma, not a fire. It holds about 99.86% of all the mass in the Solar System. At its centre the temperature is about 15.7 million K and the density is around 150 times that of water.',
  'There, hydrogen fuses into helium. Each second about '+f(massRate/1e9,1)+' million tonnes of matter turn into energy, which is how it keeps '+sci(S.L)+' W flowing. The surface temperature of '+comma(S.Teff)+' K is the effective temperature, the one that matches the light we see.']},

 {h:'From the core to sunlight',l:'BUILT',p:[
  'Energy made in the core does not simply leave. Light bumps into particles billions of times, wandering outward. Estimates put that journey at tens of thousands to over a hundred thousand years through the radiation zone. In the outer third, the plasma itself boils upward in the convection zone.',
  'Once light breaks free at the photosphere, it crosses to Earth in about '+f(tLight,1)+' minutes. The Launch tab walks this trip from the core to the sky.']},

 {h:'What the Sun looks like',l:'BUILT',p:[
  'Up close the surface is covered in granules, cells of rising hot plasma about a thousand kilometres across. Each lasts only around ten minutes. Bright centres are hotter, dark lanes are plasma sinking back down.',
  'The disc is also darker and redder at the edge than in the middle. That is limb darkening: at the edge you look through the cooler, higher layers. In this model the edge is about 40% as bright as the centre.',
  'Sunspots are patches cooled by strong magnetic fields, around 3,500 to 4,500 K against the 5,772 K around them. They appear in bands away from the equator and come and go on a cycle of about 11 years.']},

 {h:'The corona and prominences',l:'BUILT',p:[
  'Above the surface is the corona, a thin halo only seen with the naked eye during a total eclipse. It is at one to two million K, far hotter than the surface below it. How it gets so hot is still an open research question.',
  'Prominences are loops of plasma held up by magnetic fields. They can stretch hundreds of thousands of kilometres. The corona and prominences on screen are shaped by those real features.']},

 {h:'The swarm idea',l:'PROPOSED',p:[
  'Freeman Dyson described the idea in a 1960 paper. A solid shell around a star is the version people picture, but it would not hold. A rigid shell has no net pull toward or away from the star, so the smallest push would let it drift into the Sun, and it would need constant active control.',
  'The swarm is the version that can work in principle. It uses countless separate collectors, each in its own orbit. Gaps between them are fine, and each one can be built, replaced and repaired on its own.']},

 {h:'How little we need',l:'PROPOSED',p:[
  'At '+T.REAL_AU+' AU sunlight is about '+comma(F03)+' W per square metre, compared with about 1,361 at Earth. A collector at 30% efficiency needs around '+comma(area/1e6)+' km² to supply all of humanity\'s power. That is a square roughly '+f(side,0)+' km on a side.',
  'A full shell at that distance would cover about '+sci(shell,1)+' m². So even a very large swarm collects a tiny part of the Sun\'s light, and the Sun hardly notices.']},

 {h:'The collectors',l:'THEORETICAL',p:[
  'Each collector is a thin mirror or solar panel that faces the Sun. Solar sails are real. Japan\'s IKAROS flew in 2010 and the LightSail 2 spacecraft flew in 2019. Those are hundreds of square metres at most. A swarm needs millions of collectors, each possibly kilometres wide, built and maintained in space. Nobody has done that.',
  'On screen the collectors are drawn much larger than to scale, so that you can see them. A real collector kilometres wide would be invisible next to a Sun almost 1.4 million kilometres across.']},

 {h:'Orbits and layers',l:'PROPOSED',p:[
  'The collectors orbit like small planets. At '+T.REAL_AU+' AU the orbital speed is about '+f(orb.v/1e3)+' km/s and one orbit takes about '+f(orb.days,0)+' days. Orbit physics is well understood, so this part is on firmer ground than the collectors themselves.',
  'The swarm is spread over several layers at different distances and tilts, so that paths do not cross and collectors do not collide. Use the pull-apart slider to spread the three layers. The animation is far faster than real time.',
  'The distance is compressed on screen. The swarm sits at '+T.SW+' Sun radii here. At '+T.REAL_AU+' AU it would really be about '+f(RR,0)+' Sun radii away, which would not fit in the view.']},

 {h:'Light pushes back',l:'BUILT',p:[
  'Light carries momentum. A perfect mirror facing the Sun at '+T.REAL_AU+' AU feels a push of about '+f(press*1e6,0)+' micropascals. That is tiny, but on a thin, light collector it adds up to a steady acceleration.',
  'A mirror with a mass of about '+f(T.sigmaCrit*1000,2)+' grams per square metre feels light pressure equal to the Sun\'s pull. Lighter than that, it is pushed outward. The collectors have to be light enough to be cheap and heavy enough to stay where they belong.']},

 {h:'Moving the power',l:'THEORETICAL',p:[
  'Collected sunlight has to go somewhere. In this design each collector turns its energy into a narrow beam, either microwaves or laser light, and aims it at a relay. Power beaming is real but tiny so far. In 2015 JAXA sent 1.8 kW by microwave to a receiver 55 m away, and in 2023 a Caltech prototype sent small amounts of power wirelessly in space.',
  'This design needs terawatts over millions of kilometres. In the scene, gold lines are collector beams and cyan lines are relay beams. Space is nearly empty, so a real beam would be invisible. The lines and moving pulses are only there so that you can see where the power goes. Brighter means more power.']},

 {h:'Relays and handovers',l:'THEORETICAL',p:[
  'Twelve relay nodes orbit inside the swarm. A collector sends to the nearest relay it can see. The relays pass the combined power on to the gateway, a station held beyond the swarm.',
  'The Sun is in the way. From the far side a relay cannot see the gateway, so it hands its power to a relay that can. Watch the cyan lines switch as the relays orbit. A real network would need the same kind of handover, with every link aimed exactly.']},

 {h:'Aiming across space',l:'THEORETICAL',p:[
  'The gateway sends one trunk beam toward the hub ship, about '+comma(B.L/1e9)+' million km away. These numbers are illustrative: near-infrared light at '+f(B.lambda*1e6,1)+' µm through a mirror '+comma(B.D)+' m across.',
  'Over that distance a light beam spreads because it is a wave. With such a wide mirror the beam stays narrow. It is only about '+f(B.spot*2,0)+' m wide when it arrives, so spreading is not the main problem. The hard parts are building a mirror a kilometre across and aiming within about '+f(B.aimMas,1)+' milli-arcseconds, at a hub that is itself moving.']},

 {h:'Why the hub sits at L1',l:'BUILT',p:[
  'Between the Sun and Earth there is a spot where their pulls combine so that a spacecraft there goes around the Sun in exactly one year. It is called L1. It sits on the line from the Sun to Earth, about '+f(T.L1M/1e9,1)+' million km sunward of Earth, which is about '+f(T.HUB_AU,2)+' AU from the Sun.',
  'Real spacecraft live there. SOHO has watched the Sun from near L1 since 1996, and DSCOVR since 2015. The spot is not stable, so they need small correction burns every so often. A hub there stays in view of the swarm and of Earth at the same time.']},

 {h:'The hub ship',l:'PROPOSED',p:[
  'The hub is the biggest structure in the system. At its sunward end a receiver array catches the trunk beam. A power core turns it into electricity. At the other end a mirror aims the outgoing beam at Earth.',
  'Around the middle is a dock ring with 16 ports, repair gantries with robot arms, a bay that builds new collectors, and two huge radiator wings. It is drawn to a scale of about '+f(T.HUBU,0)+' m per unit, so the receiver is 3 km across. The ships are drawn much larger than they would be.']},

 {h:'The heat problem',l:'PROPOSED',p:[
  'No machine turns power over perfectly. If the hub handles humanity\'s 19 TW and loses 10%, that is '+f(H.W/1e12,1)+' TW of heat. In a vacuum there is no air to carry it off. Heat can only leave as light, from the surface of a radiator.',
  'A panel at 1,000 K sheds about '+f(H.perM2/1e3,0)+' kW per square metre counting both faces, so it takes about '+f(H.area1000/1e6,0)+' km² of panel. At a cooler 400 K it would take about '+comma(H.area400/1e6)+' km². That is why the radiator wings are so large, and why they are kept edge-on to the Sun.']},

 {h:'Repair and rebuild',l:'THEORETICAL',p:[
  'A swarm of millions of collectors will lose some of them all the time to dust impacts, radiation and ageing. The hub has a gantry with robot arms to repair them, ships to carry crews and spares, and a bay that builds replacements and sends them toward the Sun.',
  'The parts have small real precedents. The Space Station has docking ports, a big robot arm and a 3D printer. But nobody has repaired or built a kilometre-wide thin film in space. It is a big gap between those machines and this one.']},

 {h:'Where this stands',l:'THEORETICAL',p:[
  'The Sun on screen follows measured values, and the orbits follow ordinary orbital physics. L1 and the docking and robot-arm technology have real precedents. But no collector, relay, gateway or hub like the ones in this topic has been built. Everything about the swarm, the nexus, the hub ship and beaming power to Earth is a design study.',
  'Still to come is the Earth link: the beam from the hub to a receiver on Earth. On screen the hub sits far off to the right. Tap a hub part and the view moves there. Distances are compressed so the whole system fits.']}
];
})();
