/* Graphene · Launch mission, and the shared sheet model that Fly uses (so this file loads before fly.js).
   One measurement in nine phases: three of preparation, then approach, contact, elastic push, stretch, fracture, result.
   at(u) turns playback position u (0 to 1) into a full state; core.js is the one place a state is turned into forces and strains,
   so Launch and Fly can never disagree. */
(function(){
const T=window.HV.T.graphene,D=T.DES,clamp=T.clamp,f=T.f,fF=T.fF,nm=T.nm;
const sm=x=>{x=clamp(x,0,1);return x*x*(3-2*x)};
const R=D.Rs,PK=T.peak(R);

const DUR=[5,4,5,9,6,16,18,7,10];
const NAMES=['Peel the flake','Find it','Place it over the wells','Approach','Contact','Elastic push','Stretch','Fracture','Read the result'];
const tp=[0];DUR.forEach(d=>tp.push(tp[tp.length-1]+d));
const TOT=tp[9];

const TXT=[
 'Sticky tape peels a thin flake off graphite. Peeling again and again thins it until some pieces are one layer thick. This is how graphene was first isolated, in 2004.',
 'A single layer absorbs only about 2.3% of the light passing through. On a chip with the right oxide thickness that faint effect is enough to see under an ordinary microscope, and its colour tells you how many layers there are.',
 'The flake lies across round wells etched in the chip, so the part over each well hangs free. This hanging disc is the drum: '+f(D.aR*2e6,1)+' µm across, '+f(D.t*1e9,3)+' nm thick, about '+f(T.natoms/1e6,0)+' million atoms, held at its rim by adhesion.',
 'The cantilever carries a diamond tip with a point '+f(R*1e9,1)+' nm in radius. The piezo scanner lowers it toward the drum, starting '+f(D.Zc*1e9)+' nm above the sheet. The laser shows the cantilever is still straight.',
 'The tip touches. Force starts to rise. The cantilever has to bend as well, because the drum is stiff, so the piezo travels further than the tip does.',
 'At first the sheet resists mainly by being stretched like a drum skin. Force grows with the cube of depth, plus a small part from the sheet\'s pre-tension. Nothing is near the limit yet.',
 'Deeper, the lattice itself stretches. The atoms right under the tip carry the most strain, and the stress there climbs toward '+f(T.sigF)+' N/m, the top of graphene\'s stress curve at a strain of about '+f(T.epsF*100)+'%.',
 'The bonds under the tip give way and a crack opens. The force drops to zero in an instant, the cantilever springs straight and the tip falls through. Peak force: '+fF(PK.F)+' at a depth of '+f(PK.d*1e9)+' nm.',
 'The number that matters is the force just before the break. With the tip radius it gives a peak stress of about '+f(T.sigF)+' N/m, which is '+f(T.S3/1e9)+' GPa spread over the '+f(D.t*1e9,3)+' nm thickness. That is the strength of a perfect flake.'
];

const P=NAMES.map((n,i)=>({n,w:DUR[i]/TOT,f:TXT[i],t0:tp[i],t1:tp[i+1]}));

function at(u){
 u=clamp(u,0,1);const t=u*TOT;let i=0;while(i<P.length-1&&t>=P[i+1].t0)i++;
 const p=clamp((t-P[i].t0)/(P[i].t1-P[i].t0),0,1);
 let s;
 if(i<=2)s=T.evalZ(0,R,false);
 else if(i===3)s=T.evalZ(D.Zc*sm(p),R,false);
 else if(i===4)s=T.evalDepth(8e-9*p,R);
 else if(i===5)s=T.evalDepth(8e-9+52e-9*p,R);
 else if(i===6)s=T.evalDepth(60e-9+(PK.d*.9995-60e-9)*p,R);
 else if(i===7)s=T.evalZ(PK.Z,R,true,PK);
 else s=T.evalZ(PK.Z*(1-sm(p)),R,true,PK);
 return Object.assign({i,n:P[i].n,f:P[i].f,th:0,t,u},s);
}

/* the eight readouts. After the break they show the recorded peak, so the result stays on screen. */
function read(s){
 const v=s.broken&&s.pk?s.pk:s,b=!!s.broken;
 return[
  ['Piezo',nm(s.Z)],
  [b?'Depth at break':'Tip depth',nm(v.d)],
  [b?'Force at break':'Force',fF(v.F)],
  ['Cantilever bend',nm(v.defl)],
  ['Strain under tip',f(v.eps*100,1)+' %'],
  ['Stress under tip',f(v.sig,1)+' N/m'],
  ['Of strength',f(v.util*100)+' %'],
  ['Tip radius',f(s.R*1e9,1)+' nm']
 ];
}

Object.assign(T,{P,TOT,tp,at,read});
})();
