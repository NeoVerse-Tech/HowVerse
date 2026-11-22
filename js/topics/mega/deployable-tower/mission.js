/* Deployable tower · Launch mission, and the shared tower model that Fly uses (so this file loads before fly.js).
   The scripted storm cycle runs on one clock in minutes. at(u) turns playback position u (0 to 1) into a full tower state;
   eval() is the one place a state is turned into loads, so Launch and Fly can never disagree. */
(function(){
const T=window.HV.T.tower,D=T.DES,clamp=T.clamp,f=T.f,eng=T.eng;
const sm=x=>{x=clamp(x,0,1);return x*x*(3-2*x)};
const NJ=D.N-1,PEOPLE=D.people||2000,STORM=55;                   /* joints that lock, people at full occupancy, design storm m/s */

/* ---- shared model ---- */
/* pins carry the bending between tubes; with them released, the jacks alone hold the stages, so strength drops */
const lockK=n=>.45+.55*clamp(n/NJ,0,1);

/* highest mean 10 m wind the base takes at this height, damper state and number of locked joints. Cached by whole metre. */
const limC={};
function lim(h,damp,locked){
 const hh=Math.round(clamp(h,D.Hmin,D.Hmax)),n=Math.round(clamp(locked,0,NJ)),key=hh+'|'+(damp?1:0)+'|'+n,k=lockK(n);
 if(limC[key]!=null)return limC[key];
 let lo=3,hi=160,r;
 if(T.check(hi,hh,damp).u/k<1)r=hi;
 else{for(let i=0;i<22;i++){const m=(lo+hi)/2;if(T.check(m,hh,damp).u/k<1)lo=m;else hi=m}r=lo}
 return limC[key]=r;
}

/* one tower state in, every derived reading out. o: {h m, V m/s, locked 0..5, people, damp, rate m/s, heat 0..1} */
function evalState(o){
 const h=clamp(o.h,D.Hmin,D.Hmax),V=Math.max(0,o.V),damp=!!o.damp,lk=clamp(o.locked,0,NJ),rate=o.rate||0;
 const c=T.check(V,h,damp),w=T.wind(V,h,damp);
 return{h,V,damp,locked:lk,people:o.people||0,rate,heat:o.heat||0,
  F:w.Fpk,M:w.Mpk,sway:c.sway,swayLim:c.swayLim,util:c.u/lockK(lk),power:T.drivePower(rate),limit:lim(h,damp,lk)};
}

/* ---- the scripted storm cycle ---- */
const moveMin=Math.round(T.moveTime(D.Hmax,D.Hmin,T.rateAtPower(D.drive.rated))/60);   /* minutes the drive needs at rated power */
const DUR=[60,30,60,15,moveMin,205,30,moveMin,30];
const NAMES=['Calm','Forecast','Evacuate','Lock check','Retract','Ride out the storm','All clear','Redeploy','Locks engaged'];
const tp=[0];DUR.forEach(d=>tp.push(tp[tp.length-1]+d));
const TOT=tp[9],tPeak=tp[5]+110;

const TXT=[
 'Fine weather. The tower stands at full height, every joint is pinned and the damper is running.',
 'A major hurricane is forecast to peak in about '+f((tPeak-tp[1])/60,1)+' hours. The tower cannot retract in minutes, so the decision has to be made now, while the wind is still light.',
 'Everyone leaves. Nobody may be inside while the stages move, so the building empties first. It takes an hour.',
 'Engineers confirm every pin is engaged and the jacks and drive are healthy, before anything is released.',
 'The pins release and the jacks lower the stages into one another. At the drive\'s rated power this takes about '+moveMin+' minutes, and the wind keeps rising while it happens.',
 'Stowed at '+D.Hmin+' m the tower is a small target. The wind peaks at '+STORM+' m/s, far above the '+f(lim(D.Hmax,true,NJ))+' m/s the full-height tower could survive.',
 'The wind has dropped. The pins and structure are inspected before anyone is allowed back.',
 'The pins release and the jacks lift the stages back up. The wind must stay low while the tower is climbing.',
 'Pins drive home at every joint. Once they are all engaged, people are allowed back in.'
];

const P=NAMES.map((n,i)=>({n,w:DUR[i]/TOT,f:TXT[i],t0:tp[i],t1:tp[i+1]}));

/* mean wind at 10 m, by minute */
const WK=[[0,8],[tp[1],10],[tp[2],15],[tp[3],18],[tp[4],19],[tp[5],26],[tPeak,STORM],[tPeak+60,42],[tp[6],28],[tp[7],16],[tp[8],11],[TOT,9]];
function storm(t){
 t=clamp(t,0,TOT);let i=0;while(i<WK.length-2&&t>=WK[i+1][0])i++;
 const a=WK[i],b=WK[i+1];return a[1]+(b[1]-a[1])*sm((t-a[0])/(b[0]-a[0]));
}
const hAt=t=>t<tp[4]?D.Hmax:t<tp[5]?D.Hmax+(D.Hmin-D.Hmax)*(t-tp[4])/(tp[5]-tp[4]):t<tp[7]?D.Hmin:t<tp[8]?D.Hmin+(D.Hmax-D.Hmin)*(t-tp[7])/(tp[8]-tp[7]):D.Hmax;
const ramp=(t,t0)=>Math.min(NJ,Math.floor((t-t0)/15*(NJ+1)));
const lockAt=t=>t<tp[4]?NJ:t<tp[5]?0:t<tp[5]+15?ramp(t,tp[5]):t<tp[7]?NJ:t<tp[8]?0:t<tp[8]+15?ramp(t,tp[8]):NJ;
const peopleAt=t=>t<tp[2]?PEOPLE:t<tp[3]?Math.round(PEOPLE*(1-sm((t-tp[2])/(tp[3]-tp[2])))):t<tp[8]+15?0:Math.round(PEOPLE*sm((t-tp[8]-15)/(TOT-tp[8]-15)));

function at(u){
 u=clamp(u,0,1);const t=u*TOT;let i=0;while(i<P.length-1&&t>=P[i+1].t0)i++;
 const rate=(hAt(t+.5)-hAt(t-.5))/60;                                   /* m/s of height, from a one minute window */
 return Object.assign({i,n:P[i].n,f:P[i].f,th:0,t,u},evalState({h:hAt(t),V:storm(t),locked:lockAt(t),people:peopleAt(t),rate,damp:true,heat:0}));
}

/* the eight Launch readouts */
function read(s){
 return[
  ['Height',f(s.h)+' m'],
  ['Wind, 10 m',f(s.V)+' m/s'],
  ['Wind load',eng(s.F,'N')],
  ['Overturning moment',eng(s.M,'N·m')],
  ['Sway',f(s.sway,2)+' m'],
  ['Drive power',eng(s.power,'W')],
  ['Stages locked',f(s.locked)+' of '+NJ],
  ['People inside',f(s.people)]
 ];
}

Object.assign(T,{NJ,PEOPLE,STORM,lockK,lim,eval:evalState,P,TOT,tp,tPeak,storm,hAt,lockAt,peopleAt,at,read});
})();
