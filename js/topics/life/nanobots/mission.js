/* Nanobots · Launch tab: the clot-busting mission */
(function(){
const T=(window.HV.T=window.HV.T||{}).nanobots=window.HV.T.nanobots||{};
const {PI,sm,clamp,rel,MU,RHO,LBOT,RBOT,VSW,NB,UMEAN,X0,XN,UA,B2,KAB,TH0,T_APP,xApp,drag,ReOf,fmtT}=T;

const P=[
 {n:'Injection',w:.06,T:30,f:'A catheter places the swarm in the artery just upstream of the clot: 100,000 bots in a small drop of saline.'},
 {n:'Carried by the flow',w:.09,T:(X0-XN)/UMEAN,f:'Blood runs at about 2 mm/s here, 100 times faster than the bots can swim, so they simply ride it. Moving with the fluid they feel no drag at all, and the vessel wall rushes past instead.'},
 {n:'Slowing at the clot',w:.10,T:T_APP,f:'The clot throttles the flow to about 15 µm/s at its face, less than the 20 µm/s the bots can swim. The field is switched on and, for the first time, they can steer against the current.'},
 {n:'Docking',w:.09,T:60,f:'Targeting molecules on the surface grab fibrin, the protein mesh of the clot. The bots stick, and the flow cannot sweep them away.'},
 {n:'Crawling over the clot',w:.14,T:600,f:'The rotating field makes each bot corkscrew along the clot’s surface at about 20 µm/s and spreads the swarm across it. Each bot needs only about 2 pN of thrust.'},
 {n:'Releasing the drug',w:.10,T:300,f:'A trigger opens each bot’s lock and the payload, a clot-dissolving enzyme, floods out right where it is needed.'},
 {n:'The clot dissolves',w:.17,T:1800,f:'The enzyme cuts fibrin and the clot shrinks. As the passage opens, the flow returns.'},
 {n:'Washout',w:.12,T:600,f:'With blood flowing again the bots lose their grip and are swept downstream. Blood outruns them, as the Learn tab said.'},
 {n:'Clearance',w:.13,T:7200,f:'The coating breaks down and the liver and spleen clear what is left over hours. Safe clearance is one of the biggest open problems.'}
];
let tt=0;P.forEach(p=>{p.t0=tt;tt+=p.T});

function at(u){
 u=clamp(u,0,.99999);
 let i=0,a=0;while(i<P.length-1&&u>=a+P[i].w){a+=P[i].w;i++}
 const p=P[i],f=(u-a)/p.w,tau=f*p.T;
 const s={i,n:p.n,f:p.f,t:p.t0+tau,x:0,flow:UMEAN,hz:0,vs:0,pay:0,clot:1,site:0,body:NB,dock:0,dr:0,sw:1,wash:0,th:0};
 if(i===0){s.x=X0}
 else if(i===1){s.x=X0-UMEAN*tau}
 else if(i===2){s.x=xApp(tau);s.flow=UA+B2*s.x*s.x;s.hz=20*rel(f*2)}
 else if(i===3){s.flow=UA;s.hz=20;s.dock=rel(f);s.site=NB*rel(f)}
 else if(i===4){s.flow=UA;s.hz=20;s.dock=1;s.site=NB}
 else if(i===5){s.flow=UA;s.hz=20;s.dock=1;s.site=NB;s.pay=rel(f);s.dr=rel(f)}
 else if(i===6){const k=rel(f);s.flow=UA+(UMEAN-UA)*k;s.hz=20;s.dock=1;s.site=NB;s.pay=1;s.clot=1-.85*k;s.dr=1-.7*k}
 else if(i===7){s.clot=.15;s.hz=20*(1-rel(f*3));s.dock=1-rel(f*2);s.site=NB*(1-rel(f));s.pay=1;s.sw=1-rel(f);s.wash=rel(f)}
 else{s.clot=.15;s.pay=1;s.sw=0;s.wash=1;s.body=NB*Math.exp(-tau/1800)}
 s.vs=VSW*s.hz/20;s.th=s.hz/20;
 return s;
}
function read(s){
 const d=s.i>=7?'swept past':s.x<1?'at the clot':s.x>=1000?(s.x/1000).toFixed(1)+' mm':Math.round(s.x)+' µm';
 const fl=s.flow>=1000?(s.flow/1000).toFixed(1)+' mm/s':Math.round(s.flow)+' µm/s';
 const bots=s.i>=8?['Bots in body',Math.round(s.body).toLocaleString('en-US')]:['Bots at clot',Math.round(s.site).toLocaleString('en-US')];
 return[['Time','T+ '+fmtT(s.t)],['Distance to clot',d],['Blood flow here',fl],['Swim speed',Math.round(s.vs)+' µm/s'],['Drag on bot',s.vs>0?drag(s.vs).toFixed(1)+' pN':'0 pN'],
  ['Reynolds number',s.vs>0?ReOf(s.vs).toExponential(1):'0'],['Field',s.hz>0?Math.round(s.hz)+' Hz, 10 mT':'off'],['Payload released',Math.round(100*s.pay)+' %'],['Clot left',Math.round(100*s.clot)+' %'],bots];
}

Object.assign(T,{P,at,read});
})();
