/* Graphene · parts. Eight parts; the ids are what world.js uses to find each piece, so keep them stable.
   Numbers come from core.js. Labels: BUILT (exists today), PROPOSED (known technology, designed here), THEORETICAL (unproven).
   Everything in this experiment is BUILT: the apparatus and the sheet both exist in labs today. */
(function(){
const T=window.HV.T.graphene,D=T.DES,f=T.f,fF=T.fF,nm=T.nm;
const pS=T.peak(D.Rs),pB=T.peak(D.Rb);

T.PARTS=[
 {id:'lattice',n:'Honeycomb lattice',l:'BUILT',
  d:'The carbon atoms themselves. Each bonds to three neighbours at 120°, and the hexagons tile the whole sheet. Bonds under the tip turn from blue to red as the strain climbs. In this view the atoms are drawn about '+f(Math.round(T.DRAW/10)*10)+' times too large, because at true size the whole drum would hold about '+f(T.natoms/1e6,0)+' million of them.',
  k:[['Bond length',f(D.b*1e9,3)+' nm'],['Lattice constant',f(D.a*1e9,3)+' nm'],['Atoms in the drum','about '+f(T.natoms/1e6,0)+' million'],['Mass per area',f(T.rho2*1e6,2)+' mg/m²']]},

 {id:'membrane',n:'Suspended membrane',l:'BUILT',
  d:'The part of the flake that hangs over the well, like a drum skin one atom thick. It is held at its edge by adhesion to the wall. The shape under the tip is drawn to scale, a steep funnel that flattens toward the rim.',
  k:[['Diameter',f(D.aR*2e6,1)+' µm'],['Thickness',f(D.t*1e9,3)+' nm'],['2D stiffness',f(D.E)+' N/m'],['2D strength',f(T.sigF)+' N/m'],['Pre-tension',f(D.s0,1)+' N/m']]},

 {id:'substrate',n:'Chip and well',l:'BUILT',
  d:'A silicon chip with a layer of oxide on top and round wells etched through the oxide. The flake lies across the top and the part over each well hangs free. The well depth is a design value here. It only has to be deeper than the sag, so the sheet never touches the bottom.',
  k:[['Well diameter',f(D.aR*2e6,1)+' µm'],['Well depth',f(D.well*1e9)+' nm (design)'],['Edge','clamped by adhesion']]},

 {id:'tip',n:'Diamond tip',l:'BUILT',
  d:'A diamond point on the end of the cantilever. It is hard enough not to dent. The smaller its radius, the more the stress concentrates, so the sharp tip breaks the sheet and the blunt one cannot within the piezo range. The tip is drawn to true scale against the drum.',
  k:[['Sharp radius',f(D.Rs*1e9,1)+' nm'],['Blunt radius',f(D.Rb*1e9)+' nm'],['Breaks sheet, sharp',fF(pS.F)],['Breaks sheet, blunt',fF(pB.F)+' (out of range)']]},

 {id:'cantilever',n:'Cantilever',l:'BUILT',
  d:'A tiny springy beam that carries the tip. Pushing on the tip bends it, and the bend is the force measurement. It is stiff, so it bends only tens of nanometres even at the break. The bend is drawn 2.5 times larger so you can see it.',
  k:[['Stiffness',D.kc+' N/m (design)'],['Bend at the break, sharp',nm(pS.defl)],['Force',' = stiffness × bend']]},

 {id:'laser',n:'Laser and detector',l:'BUILT',
  d:'A laser bounces off the back of the cantilever onto a position detector. When the cantilever bends, the reflected spot moves, and the detector turns that movement into a force. This optical lever can read bends far smaller than a nanometre.',
  k:[['Reads','cantilever bend'],['Gives','force = stiffness × bend'],['Spot moves','twice as far as the tilt']]},

 {id:'piezo',n:'Piezo scanner',l:'BUILT',
  d:'A stack of piezoelectric ceramic that lengthens by a precise amount when a voltage is applied. It lowers the cantilever toward the sheet in steps of a fraction of a nanometre. It cannot move instantly, which is why the Fly slider has a speed limit.',
  k:[['Range',f(D.Zmax*1e9)+' nm (design)'],['Speed limit',f(D.slew*1e9)+' nm/s (design)'],['Start gap',f(D.Zc*1e9)+' nm above the sheet']]},

 {id:'defects',n:'Defects',l:'BUILT',
  d:'Places where the lattice is wrong: a missing atom, or a pair of atoms rotated a quarter turn. Four are marked here, drawn much larger than real. Cracks start at the weakest defect, so real flakes break below the perfect value. Freshly peeled flakes have very few, which is why they are used for this test.',
  k:[['Vacancy','one atom missing'],['Stone-Wales','two atoms rotated 90°'],['Effect','weaker, breaks early']]}
];
})();
