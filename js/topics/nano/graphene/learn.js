/* Graphene · Learn. 13 sections, each labelled BUILT (exists today), PROPOSED (designed with known technology)
   or THEORETICAL (depends on something unproven). Numbers from the experiment are computed from core.js so the page
   can never disagree with the model. Lab figures quoted for electrons, heat and gas are published measurements, rounded. */
(function(){
const T=window.HV.T.graphene,D=T.DES,f=T.f,fF=T.fF,nm=T.nm;

const pS=T.peak(D.Rs),pB=T.peak(D.Rb);
const e50=T.force(50e-9),e100=T.force(100e-9);
const ratioSteel=T.S3/D.steel;
const layersMm=1e-3/D.t/1e6;                                   /* million layers in a millimetre of graphite */
const kgPerMetre=T.sigF/9.81;                                  /* kg a 1 m wide strip holds, hanging */
const bendS=pS.defl;

T.LEARN=[
 {h:'What graphene is',l:'BUILT',p:[
  'Graphene is a single layer of carbon atoms arranged in a honeycomb. Each atom bonds to three neighbours '+f(D.b*1e9,3)+' nm away at 120° angles, and the pattern repeats every '+f(D.a*1e9,3)+' nm. Stack the layers and you get graphite, the grey stuff in a pencil. A millimetre of graphite is about '+f(layersMm,0)+' million layers.',
  'Each carbon uses three of its four outer electrons for strong bonds inside the sheet. The fourth sits in a cloud above and below the sheet and is free to move. Strong bonds give the strength. Free electrons give the conduction. Counting the space an atom takes up, the sheet is '+f(D.t*1e9,3)+' nm thick, the spacing between layers in graphite.']},

 {h:'Where it came from',l:'BUILT',p:[
  'In 2004 Andre Geim and Konstantin Novoselov at Manchester peeled flakes off graphite with sticky tape, again and again, until some were a single layer thick. They measured how electrons behave in it, and won the 2010 Nobel Prize in Physics.',
  'Before that, many physicists doubted that a flat crystal one atom thick could exist at all. It does, though a real sheet is never perfectly flat. It ripples slightly, and that rippling is thought to be part of what keeps it stable.']},

 {h:'How little there is',l:'BUILT',p:[
  'Spread over a square metre, graphene weighs about '+f(T.rho2*1e6,2)+' mg. Our drum is '+f(D.aR*2e6,1)+' µm across and holds about '+f(T.natoms/1e6,0)+' million atoms, and yet it pushes back like a tight drum skin.',
  'Here is the picture that makes it stick. A strip of perfect graphene 1 m wide could hold about '+f(kgPerMetre,1)+' kg hanging from it, because its strength is '+f(T.sigF,0)+' N per metre of width. The same strip weighs under a milligram per metre of length. That is for a perfect sheet. Real large sheets are far weaker, which a later section explains.']},

 {h:'Stiff and strong',l:'BUILT',p:[
  'Because the sheet is one atom thick, its stiffness is quoted per metre of width, not per square metre of cross-section. Graphene measures about '+f(D.E)+' N/m. Spread over the '+f(D.t*1e9,3)+' nm thickness, that is a Young\'s modulus of about '+f(T.E3/1e12,1)+' TPa, five times steel.',
  'Its strength is about '+f(T.sigF)+' N/m, or about '+f(T.S3/1e9)+' GPa over the thickness. Ordinary structural steel yields at about '+f(D.steel/1e9,3)+' GPa, so a perfect graphene flake is more than '+f(Math.floor(ratioSteel/100)*100)+' times stronger. Lee and colleagues measured this at Columbia in 2008 and reported it as the strongest material ever measured. It holds for tiny, perfect flakes.']},

 {h:'The indentation test',l:'BUILT',p:[
  'To measure strength you have to break something. The method is to lay a flake over a round well in a chip, so the part over the well hangs free like a drum skin, then press its centre with a very sharp diamond tip on a cantilever and record force against depth.',
  'Here the drum is '+f(D.aR*2e6,1)+' µm across and the tip has a point '+f(D.Rs*1e9,1)+' nm in radius. The force has two parts: one from the sheet\'s pre-tension that grows in step with depth, and one from stretching it that grows with the cube of depth. At 50 nm deep the force is about '+fF(e50)+'. At 100 nm it is about '+fF(e100)+'. Doubling the depth multiplies the force by about '+f(e100/e50,1)+'.']},

 {h:'The cantilever bends too',l:'BUILT',p:[
  'The tip does not sit on a rigid post. It hangs from a springy cantilever, here '+D.kc+' N/m. When the sheet pushes back, the cantilever bends, so the piezo scanner has to extend further than the tip moves: extension = gap + depth + force divided by stiffness.',
  'At the break the force is about '+fF(pS.F)+', so the cantilever bends by about '+nm(bendS)+'. A laser bounced off the back of the cantilever reads that bend, and force is simply bend times stiffness. That is how the force is measured. The bend is a large part of the piezo travel, which is why the Fly slider and the real tip depth are not the same thing.']},

 {h:'Stress under the tip',l:'BUILT',p:[
  'The sheet is stretched most right under the tip. An energy estimate for the stress there gives about the square root of force times stiffness over four pi times the tip radius. A smaller radius means a higher stress for the same force.',
  'So the same sheet breaks at different forces depending on the tip. The sharp '+f(D.Rs*1e9,1)+' nm tip breaks it at about '+fF(pS.F)+' and a depth of about '+f(pS.d*1e9)+' nm. A blunt '+f(D.Rb*1e9)+' nm tip spreads the load and needs about '+fF(pB.F)+' and '+f(pB.d*1e9)+' nm. That needs '+f(pB.Z*1e9)+' nm of piezo travel, more than the '+f(D.Zmax*1e9)+' nm this instrument has, so with the blunt tip you cannot break the sheet.']},

 {h:'Stretching until it fails',l:'BUILT',p:[
  'Graphene is not a perfect spring. At small strain the stress follows the stiffness. At large strain it softens: stress = '+f(D.E)+' × strain − '+f(Math.abs(D.Dn))+' × strain squared, in N/m. The curve climbs, flattens and peaks.',
  'The peak is at a strain of about '+f(T.epsF*100)+'%, where the stress reaches about '+f(T.sigF)+' N/m. That peak is the strength. A perfect lattice can be stretched by roughly a quarter of its length before the bonds give way, which almost nothing else can do.']},

 {h:'Electrons and light',l:'BUILT',p:[
  'Electrons in graphene move as if they have no mass, at about a million metres per second, roughly 1/300 of the speed of light. In suspended flakes their mobility has been measured above 200,000 cm²/V·s, against about 1,400 for silicon.',
  'A single layer absorbs about 2.3% of the light passing through, which is a lot for one atom, and why you can see it under a microscope on the right wafer. Graphene has no band gap, so it cannot be switched fully off. That is the main reason it has not replaced silicon in computer chips.']},

 {h:'Heat and gas',l:'BUILT',p:[
  'Heat travels along the sheet very well. Suspended flakes have been measured between roughly 2,000 and 5,000 W/m·K, against about 400 for copper. Graphene films are already used to spread heat in some phones.',
  'The sheet is also a barrier. A perfect layer lets no gas through, not even helium, which was shown in 2008 using sealed drums much like this one. Real films have pinholes and grain boundaries, so real barriers leak more.']},

 {h:'Making it',l:'BUILT',p:[
  'There are two main routes. Peeling with tape gives small, nearly perfect flakes, ideal for experiments like this. Chemical vapour deposition grows a sheet on copper foil from hot methane, and in 2010 a roll-to-roll process made films 30 inches across.',
  'Large films are many small crystals stitched together. The seams, called grain boundaries, and the other defects are where cracks start, so large films are weaker and less conductive than a perfect flake. The test in this topic uses the best case.']},

 {h:'Uses, and the limits',l:'PROPOSED',p:[
  'Today graphene appears in conductive inks, composites, heat spreaders and sensors, mostly as small amounts mixed into something else. Proposed uses include transparent touch screens, filters that desalinate water through nanopores and battery electrodes. Each is real research. None has overtaken the material it would replace.',
  'A space elevator cable is the dream use, and it is THEORETICAL. It would need defect-free sheet tens of thousands of kilometres long. The strength in this test belongs to a perfect, micrometre-sized drum, not to anything that can be made at that length.']},

 {h:'What this model leaves out',l:'THEORETICAL',p:[
  'The Launch and Fly runs follow the physics of the real experiment, not one particular device. The load is treated as a point at the centre of a perfect circular membrane. The stress under the tip comes from an energy estimate, and the drum is taken as clamped, with a pre-tension of '+f(D.s0,1)+' N/m.',
  'It leaves out the thermal ripples of the sheet, adhesion between tip and graphene, tip wear, slipping at the well edge, creep, and any defect or grain boundary. A real flake would break somewhat below the perfect value, and different flakes would break at different forces. The numbers show how the idea behaves, not what any one sample would do. In the 3D view the atoms are drawn about '+f(Math.round(T.DRAW/10)*10)+' times too large so you can see them.']}
];
})();
