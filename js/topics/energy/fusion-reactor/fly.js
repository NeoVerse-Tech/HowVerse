/* Fusion reactor · Fly tab: you run the pulse.
   A simplified 0-D tokamak (PROPOSED design values). You set the heating power and the fuel density.
   Heat the plasma into H-mode, raise the fuel, and hold 400 MW or more of fusion at Q of 10 or better for 400 s,
   all before the central solenoid runs out. Two limits end the run in a disruption: too much fuel (density limit)
   and too much pressure (beta limit). */
(function(){
const T=(window.HV.T=window.HV.T||{}).fusion=window.HV.T.fusion||{};
const {PI,MU0,EV,R,a,BT,Ip,Vp,Sp,Pfus,Paux,Pa,nAvg,TavgKeV,fA,KofkeV,fmtP,fmtE,fmtK,fmtT,clamp,pfusOf,wOf,kOf,pradOf}=T;

const PHMAX=73e6,TAUN=6,PULSE=900,BURN_GOAL=400,PF_GOAL=400e6,Q_GOAL=10;
const LEV=[.3,.5,.7,.85,1.0,1.1,1.2,1.3];                         /* fuel levels, in 1e20 per m3 */
const IPMA=Ip/1e6,NGW=IPMA/(PI*a*a)*1e20;                          /* Greenwald density limit */
const BNLIM=2.8;                                                   /* beta-N limit (design runs near 1.8) */
const PLH=n=>.0488*Math.pow(n/1e20,.717)*Math.pow(BT,.803)*Math.pow(Sp,.941)*1e6;   /* L-to-H power threshold, W */
const PNREF=Paux+Pa-pradOf(nAvg,TavgKeV),TAU0=wOf(nAvg,TavgKeV)/PNREF;            /* calibrated so the design point balances */
const betaN=(n,k)=>{const p=2*n*k*1e3*EV,b=2*MU0*p/(BT*BT);return b*100*a*BT/IPMA};

function createFly(){
 const S={};
 function reset(){
  const n=LEV[0]*1e20;
  Object.assign(S,{mode:'fly',th:0,fi:0,n,W:wOf(n,1.0),hf:.5,t:0,burn:0,best:0,why:'',dis:0,auto:0,am:'',aT:0,
   Pf:0,Pn:0,Pr:0,Pnet:0,tauE:0,k:1.0,bn:0,dens:0,lh:0,q:0,peakPf:0,peakQ:0})}
 reset();
 const aux=()=>S.th*PHMAX;

 function disrupt(why){S.mode='disrupt';S.why=why;S.dis=1;S.W*=.02;S.th=0;S.auto=0;S.am=''}

 function autopilot(){
  S.th=Math.max(S.th,0);
  if(S.mode!=='fly')return;
  if(S.t-S.aT<10)return;
  if(S.fi<4&&S.k>=(S.fi<2?3:4.5)){S.fi++;S.aT=S.t}
  if(S.t<2)S.th=.685;
  if(S.fi>=4&&S.Pf>2e8){
   const e=(Pfus-S.Pf)/Pfus;S.th=clamp(S.th+e*.12,.15,.9);S.aT=S.t-9;
  }
 }

 function step(dt){
  if(S.mode!=='fly')return;
  let left=dt;
  while(left>1e-9&&S.mode==='fly'){
   const h=Math.min(left,.02);left-=h;
   if(S.auto)autopilot();
   const Pw=aux(),nT=LEV[S.fi]*1e20,dn=(nT-S.n)/TAUN*h;
   if(dn<0)S.W*=(S.n+dn)/S.n;                       /* particles leaving take heat with them; cold fuel just dilutes */
   S.n=Math.max(1e18,S.n+dn);
   S.k=kOf(S.n,S.W);
   S.Pf=pfusOf(S.n,S.k);S.Pn=S.Pf*(1-fA);const Pal=S.Pf*fA;S.Pr=pradOf(S.n,S.k);
   S.Pnet=Pw+Pal-S.Pr;
   const lh=PLH(S.n);S.lh=lh;
   const Ps=S.Pnet;
   const target=Ps>lh?1:(Ps<.8*lh?.5:(S.hf>.75?1:.5));            /* H-mode needs power above the threshold, and keeps hold a little below it */
   S.hf+=(target-S.hf)*Math.min(1,h/1.5);
   S.tauE=TAU0*S.hf*Math.pow(Math.max(S.Pnet,5e6)/PNREF,-.69)*Math.pow(S.n/nAvg,.41);
   S.W=Math.max(1e4,S.W+(S.Pnet-S.W/S.tauE)*h);
   S.k=kOf(S.n,S.W);S.Pf=pfusOf(S.n,S.k);
   S.q=Pw>1e5?S.Pf/Pw:0;
   S.dens=S.n/NGW;S.bn=betaN(S.n,S.k);
   S.peakPf=Math.max(S.peakPf,S.Pf);
   S.t+=h;
   S.dis=Math.max(0,S.dis-h/3);
   if(S.dens>1.02){disrupt('density');break}
   if(S.bn>BNLIM){disrupt('beta');break}
   if(S.Pf>=PF_GOAL&&(Pw<1e5||S.Pf/Pw>=Q_GOAL-.05))S.burn+=h;      /* 0.05 of slack: the design point itself sits at Q of 9.99 to 10.0 */
   if(S.burn>=BURN_GOAL){S.mode='done';S.auto=0;break}
   if(S.t>=PULSE){S.mode='flux';S.auto=0;break}
  }
 }
 function tick(dt){if(S.mode==='disrupt'||S.mode==='done')S.dis=Math.max(0,S.dis-dt/3)}

 function view(){
  const Pw=aux();
  return{i:0,coilK:4.5,bt:BT,ipMA:S.mode==='disrupt'?0:IPMA,tf:1,ip:S.mode==='disrupt'?0:1,cold:1,vac:1,
   nm:S.n,ne:S.n/1e20,tk:S.k,paW:Pw,pa:Pw/Paux,pfW:S.Pf,pf:S.Pf/Pfus,W:S.W,hm:S.hf>.75?1:S.hf>.6?(S.hf-.5)*4:0,
   dis:S.dis,glow:clamp(S.k/TavgKeV,0,1)*(S.mode==='disrupt'&&S.dis<=0?0:1),th:clamp(S.Pf/Pfus,0,1.2)};
 }
 function readout(){
  const Pw=aux(),q=Pw>1e5?S.Pf/Pw:0;
  return[
   ['Time',S.t<10?S.t.toFixed(1)+' s':fmtT(S.t)+' of 15 min'],
   ['Heating in',Pw>0?fmtP(Pw):'off'],
   ['Fusion power',fmtP(S.Pf)],
   ['Power gain Q',Pw>1e5?(S.Pf>1e5?q.toFixed(1):'0'):(S.Pf>1e7?'self-heated':'0')],
   ['Plasma heat',fmtK(KofkeV(S.k))],
   ['Density limit used',Math.round(100*S.dens)+' %'],
   ['Pressure limit used',Math.round(100*S.bn/BNLIM)+' %'],
   ['Confinement',S.hf>.75?'H-mode, '+S.tauE.toFixed(1)+' s':'L-mode, '+S.tauE.toFixed(1)+' s'],
   ['H-mode needs',fmtP(S.lh)+' net'],
   ['Stored heat',fmtE(S.W)],
   ['Burn held',Math.round(S.burn)+' of '+BURN_GOAL+' s'],
   ['Fuel level',(S.n/1e20).toFixed(2)+' → '+LEV[S.fi].toFixed(2)]];
 }
 function status(){
  const Pw=aux(),pct=Math.round(100*S.bn/BNLIM);
  if(S.mode==='done')return{k:'good',n:'Burn held',f:'You held at least 400 MW of fusion at Q of 10 or better for 400 seconds, the target of the real machine. Peak fusion power was '+fmtP(S.peakPf)+'. Reset to fly again, or press Auto to watch the reference plan.'};
  if(S.mode==='disrupt')return S.why==='density'
   ?{k:'bad',n:'Disruption: too much fuel',f:'Density went past the Greenwald limit, about '+(NGW/1e20).toFixed(2)+'×10²⁰ per m³ at this current. The edge cooled, the current channel shrank and the plasma lost its confinement in milliseconds. Fuel more slowly, and pull back when the density gauge passes 90 percent.'}
   :{k:'bad',n:'Disruption: pressure too high',f:'The plasma pressure went past the beta limit. The plasma kinks, loses confinement and dumps its heat on the wall. Density and temperature together set the pressure, so back off the heating or the fuel before the pressure gauge reaches 100 percent.'};
  if(S.mode==='flux')return{k:'bad',n:'Out of flux',f:'The central solenoid has run out of swing, so the plasma current cannot be held any longer and the pulse ends. You held the burn for '+Math.round(S.burn)+' of the '+BURN_GOAL+' seconds needed. Reach the burn sooner, and use warp to skip the waiting.'};
  if(S.auto)return{k:'',n:'Autopilot',f:'Heating at about 50 MW, raising the fuel in steps once the plasma is hot enough, then trimming the heating to hold 500 MW of fusion.'};
  if(S.dens>.92)return{k:'warn',n:'Near the density limit',f:'Density is at '+Math.round(100*S.dens)+' percent of the limit. Another fuel step could trigger a disruption. Tap Fuel − to ease off.'};
  if(pct>88)return{k:'warn',n:'Near the pressure limit',f:'Pressure is at '+pct+' percent of the beta limit. Lower the heating or the fuel before it passes 100.'};
  if(S.burn>0&&S.burn<BURN_GOAL)return{k:'good',n:'Burning',f:'Holding '+fmtP(S.Pf)+' at Q = '+(Pw>1e5?(S.Pf/Pw).toFixed(1):'high')+'. Burn held: '+Math.round(S.burn)+' of '+BURN_GOAL+' s. Keep both gauges clear of their limits.'};
  if(S.t===0&&Pw===0)return{k:'',n:'Ready to heat',f:'The current is ramped and the plasma is warm at about 12 million K, thin and cold. Raise the Heating slider. Start near 70 percent, which is about 50 MW. You have 15 minutes of pulse, and warp saves time.'};
  if(Pw===0)return{k:'warn',n:'No heating',f:'Without heating the plasma cools and fusion stops. Raise the Heating slider.'};
  if(S.hf<.75)return{k:'',n:'L-mode',f:'Confinement is poor. The plasma needs about '+fmtP(S.lh)+' flowing out through its edge to form the H-mode barrier, and it has about '+fmtP(Math.max(S.Pnet,0))+'. Add heating, or fuel less to lower the threshold.'};
  if(S.Pf<PF_GOAL)return{k:'',n:'H-mode, still climbing',f:'Fusion is '+fmtP(S.Pf)+' and the goal is '+fmtP(PF_GOAL)+' at Q of 10. Fusion grows with the square of the density, so raise the fuel in small steps while the temperature holds.'};
  return{k:'warn',n:'Q is too low',f:'Fusion power is high but Q is '+(Pw>1e5?(S.Pf/Pw).toFixed(1):'high')+'. Cut the heating until Q passes 10; the alphas will keep the plasma hot.'};
 }
 /* Fuel + and Fuel − ride on the page's existing drop and lamps keys, which call fs.drop() and fs.lamps(),
    so ui/topic.js needs no change. (The page's cut key sets the heating slider to zero, so it is not used.) */
 function lbl(k){return k==='fup'||k==='drop'?'Fuel + '+LEV[Math.min(S.fi+1,LEV.length-1)].toFixed(2):k==='fdn'||k==='lamps'?'Fuel − '+LEV[Math.max(S.fi-1,0)].toFixed(2):null}
 function act(k){if(S.mode!=='fly')return;S.auto=0;S.am='';if(k==='fup'||k==='drop')S.fi=Math.min(S.fi+1,LEV.length-1);else if(k==='fdn'||k==='lamps')S.fi=Math.max(S.fi-1,0)}
 return{
  state:S,step,tick,view,read:readout,status,reset,
  ui:{label:'Heating',min:0,max:100,unit:'%',btns:[{k:'drop',l:'Fuel +',lf:()=>lbl('fup'),on:()=>false},{k:'lamps',l:'Fuel −',lf:()=>lbl('fdn'),on:()=>false},{k:'warp'},{k:'auto'},{k:'reset'}]},
  warp:[60,600,1,10],warpL:['1 min/s','10 min/s','1×','10×'],   /* the page starts on index 2, so the run starts at 1× and the buttons cycle 1×, 10×, 1 min/s, 10 min/s */
  dtmax:.05,
  label:lbl,
  on:k=>false,
  setThrottle(x){S.th=clamp(x,0,1);S.auto=0;S.am=''},
  act,drop:()=>act('fup'),lamps:()=>act('fdn'),fup:()=>act('fup'),fdn:()=>act('fdn'),
  toggleAuto(){if(S.auto){S.auto=0}else{if(S.mode==='fly'){S.auto=1;S.aT=S.t-10}}}
 };
}
Object.assign(T,{createFly});
})();
