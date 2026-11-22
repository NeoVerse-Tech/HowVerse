/* Deployable tower · Learn. 13 sections, each labelled BUILT (exists today), PROPOSED (designed with known technology)
   or THEORETICAL (depends on something unproven). Every number is computed from core.js so the page can never disagree with the model. */
(function(){
const T=window.HV.T.tower,D=T.DES,f=T.f,eng=T.eng;

const top=Math.pow(D.Hmax/10,D.alpha),q40=.5*T.RHO*40*40;
const w40t=T.wind(40,D.Hmax,false),w40s=T.wind(40,D.Hmin,false);
const c40=T.check(40,D.Hmax,false);
const lim={tall:T.windLimit(D.Hmax,false),tallD:T.windLimit(D.Hmax,true),mid:T.windLimit(120,false),stow:T.windLimit(D.Hmin,false)};
const b300=T.buckling(D.Hmax),fr=T.freq(D.Hmax);
const tRated=T.moveTime(D.Hmax,D.Hmin,T.rateAtPower(D.drive.rated)),tMax=T.moveTime(D.Hmax,D.Hmin,D.drive.rateMax),pMax=T.drivePower(D.drive.rateMax);
const STORM=55;let hLo=D.Hmin,hHi=D.Hmax;                 /* tallest height the base survives in the design storm, found by bisection */
if(T.windLimit(D.Hmax,false)>=STORM)hLo=D.Hmax;else for(let i=0;i<30;i++){const m=(hLo+hHi)/2;if(T.windLimit(m,false)>=STORM)hLo=m;else hHi=m}
const hSafe=hLo;
const jack1=T.jackForce(1),dmpCut=Math.round(100*(1-T.gust(D.zetaD)/T.gust(D.zeta0)));

T.LEARN=[
 {h:'Why shrink a tower',l:'PROPOSED',p:[
  'Wind pushes harder the taller a structure stands, and it pushes hardest near the top, where the lever arm to the base is longest. Most tall buildings answer this by being stiff and heavy enough to take the worst storm they will ever see, all the time.',
  'A deployable tower answers it differently. It stands tall in good weather, and when a storm is forecast it nests down into itself, so the wind has far less to grab. The reference design here stands '+D.Hmax+' m deployed and '+D.Hmin+' m stowed.']},

 {h:'What wind does to a tall thing',l:'BUILT',p:[
  'Wind pressure is half the air density times the speed squared. Double the speed and the pressure quadruples. At a steady 40 m/s the pressure is about '+f(q40/1000,1)+' kPa on a face-on surface, roughly '+f(q40/9.81)+' kg pushing on every square metre.',
  'Wind also speeds up with height, because the ground drags the air near it. In this model the wind at '+D.Hmax+' m is about '+f(top,2)+' times the wind at 10 m. The top of a tall tower sees the fastest wind, which is the wind that matters most.']},

 {h:'The lever arm',l:'BUILT',p:[
  'What topples or bends a tower is not the push alone but the push times its height above the base, the overturning moment. Moving the same push twice as high doubles the moment.',
  'That is why shrinking works so well. At a 40 m/s mean wind, the deployed tower takes a peak push of '+eng(w40t.Fpk,'N')+' and a base moment of '+eng(w40t.Mpk,'N·m')+'. Stowed, the same wind gives '+eng(w40s.Fpk,'N')+' and '+eng(w40s.Mpk,'N·m')+'. The push falls by about '+f(100*(1-w40s.Fpk/w40t.Fpk))+'%, the moment by about '+f(100*(1-w40s.Mpk/w40t.Mpk))+'%.']},

 {h:'Telescoping tubes',l:'BUILT',p:[
  'Nested sections that slide out are an old, proven idea. Telescopic masts carry antennas on vehicles, telescopic cranes lift loads on booms around 100 m long, and the sections lock together with pins once extended.',
  'What has not been built is the scale. Those machines are tens of metres. This design asks for six tubes that reach '+D.Hmax+' m and carry people.']},

 {h:'The reference design',l:'PROPOSED',p:[
  'Six steel tubes, each '+D.Ls+' m long. Stage 0 is the fixed base tube. The others slide up inside it, each one narrower than the last.',
  'Outer diameters run from '+D.dia[0]+' m at the base to '+D.dia[D.N-1]+' m at the top, with a '+f(D.t*1000)+' mm wall. The whole tower, damper included, is about '+f(D.mass/1e6)+',000 tonnes. Deployed, each stage rises '+f(T.pitch(D.Hmax),0)+' m above the one below it and overlaps it by '+f(D.Ls-T.pitch(D.Hmax),0)+' m. Stowed, all six sit one inside another.'],
  k:['Height: '+D.Hmin+' m stowed, '+D.Hmax+' m deployed','Stages: '+D.N+', diameter '+D.dia[0]+' m down to '+D.dia[D.N-1]+' m','Mass: about '+f(D.mass/1e3)+' t','Design occupancy: '+(D.people||2000)+' people, deployed only']},

 {h:'Checking the base',l:'PROPOSED',p:[
  'The model checks the base tube for the weight of the tower plus the peak wind bending, with the bending magnified as the load nears buckling. A utilisation of 1.0 is the limit.',
  'Fully deployed at 40 m/s, the base sits at '+f(c40.u,2)+' of its limit, so it is already past it. The wind speed at which the base reaches its limit is about '+f(lim.tall)+' m/s with no damper, and '+f(lim.tallD)+' m/s with the damper on. At 120 m that rises to '+f(lim.mid)+' m/s, and stowed the base never governs.']},

 {h:'Buckling',l:'BUILT',p:[
  'A tall column fails by bowing sideways, not by crushing. Euler worked out the load: pi squared times stiffness divided by the square of the effective length. For a column fixed at the bottom and free at the top, the effective length is twice the height.',
  'Taller means far weaker, because the height is squared. At '+D.Hmax+' m this tower\'s weight is about '+f(100*b300.ratio)+'% of its buckling load. At '+D.Hmin+' m it is only about '+f(100*T.buckling(D.Hmin).ratio,1)+'%. Weight alone never topples it. The danger is wind bending it while the weight pushes it further over.']},

 {h:'Sway',l:'BUILT',p:[
  'A tower can stay strong enough and still be too bendy to live in. The usual comfort limit is a sway of about height divided by 500, which is '+f(D.Hmax/D.swayLimDiv,1)+' m at the top here.',
  'At 40 m/s the model gives a peak sway of '+f(c40.sway,1)+' m, nearly three times that limit. The tower would stay up, but nobody would want to be inside. Its natural sway frequency is about '+f(fr,2)+' Hz, a slow roll of roughly '+f(1/fr)+' seconds per swing.']},

 {h:'The tuned mass damper',l:'BUILT',p:[
  'A tuned mass damper is a huge weight hung near the top that swings against the sway. Taipei 101 has one of roughly 660 tonnes, and New York\'s Citicorp Center has one of around 400 tonnes. Both are real and working.',
  'Here the damper is '+f(D.damperMass/1e3)+' tonnes, 2% of the tower, and lifts the damping from '+f(D.zeta0*100)+'% to '+f(D.zetaD*100)+'% of critical. In the model that trims the peak wind load by about '+dmpCut+'% and raises the base limit from '+f(lim.tall)+' to '+f(lim.tallD)+' m/s. Helpful, but it cannot save a fully extended tower from a hurricane.']},

 {h:'Raising and lowering',l:'PROPOSED',p:[
  'Offshore jack-up rigs already lift hulls weighing many thousands of tonnes up long legs, using rack-and-pinion jacks. The tower borrows that idea. The jacks under stage 1 carry the weight of stages 1 to 5, about '+eng(jack1,'N')+'.',
  'The drive is rated for '+eng(D.drive.rated,'W')+' continuously. At that power the height changes by about '+f(T.rateAtPower(D.drive.rated),3)+' m/s, so going from '+D.Hmax+' m to '+D.Hmin+' m takes about '+T.clock(tRated)+'. Pushing to the '+D.drive.rateMax+' m/s limit cuts that to about '+T.clock(tMax)+', but needs about '+eng(pMax,'W')+' and heats the drive faster than it can shed heat.']},

 {h:'Locking pins',l:'PROPOSED',p:[
  'Jacks move the tower. Pins hold it. Once a stage reaches its position, steel pins drive through both tubes and lock them together, so the jacks carry no wind load. That is the same trick telescopic cranes use.',
  'The rule is simple. Never retract unless the pins are checked and released in order, and never stand in wind unless they are engaged. The Fly mode lets you do both and shows what happens when you get it wrong.']},

 {h:'Timing a storm',l:'PROPOSED',p:[
  'The hard part is not the retraction. It is that retraction is slow. At rated power it takes about '+T.clock(tRated)+', and the building has to be emptied first. A forecast that arrives an hour before the wind does is already too late.',
  'The model\'s limits show the deadline. In a '+STORM+' m/s storm, a major hurricane, the base only holds if the tower is below about '+f(hSafe)+' m. Above '+f(lim.tall)+' m/s it must not be fully deployed at all. So retraction has to start on the forecast, with the wind still calm.']},

 {h:'What this model leaves out',l:'THEORETICAL',p:[
  'No tower this tall retracts in real life, so nothing here is proven. The model uses a simple wind profile, one gust factor, one base section, and an equivalent uniform tube for buckling and frequency.',
  'It leaves out vortex shedding, fatigue from millions of sway cycles, ice, earthquakes, seal and tolerance problems along 60 m sliding joints, and the dynamic load when a stage locks. Any of these could decide whether the real thing works. The numbers show how the idea behaves, not that it would pass a safety review.']}
];
})();
