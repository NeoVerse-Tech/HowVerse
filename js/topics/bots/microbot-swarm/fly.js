/* Microbot swarm · Fly tab: command the swarm to grow a sculpture before the batteries run out, the swarm overheats or the shape fails.
   You pick the shape, its size, how many walking lanes leave the pile, and whether bundles are assumed to grip each other. You ride the drive
   slider. More lanes build faster but more bots walk at once, which makes heat. Idle power drains every bot the whole time. */
(function(){
const T=(window.HV.T=window.HV.T||{}).microbots=window.HV.T.microbots||{};
const {clamp,EB,USE,PIDLE,PMOVE,VMOVE,HC,FORMS,grown,census,fmtT}=T;

const SIZES=[.7,1,1.5,2,3];
const LANES=[4,16,64,256];
const MAXBOTS=45000;                   /* the biggest swarm offered on a phone */
const TMAX=40;                         /* K above room: where thin-film cells and silicon stop being safe */
const GAP=20;                          /* pile to structure, mm (same as forming.js) */
const keys=()=>Object.keys(T.FORMS);   /* shapes added with T.addForm show up here too */
const N=n=>Math.round(n).toLocaleString('en-US'),pc=x=>Math.round(x*100)+'%';
const COUNT={};                        /* bots at size 1, to skip sizes that would be too big */
const fits=(key,i)=>(COUNT[key]||(COUNT[key]=grown(key,1).model.n))*Math.pow(SIZES[i],3)<=MAXBOTS*1.1;

function createFly(){
 const S={};
 let sc=null;
 function recalc(){
  sc=grown(keys()[S.sI],SIZES[S.kI],LANES[S.lI]);
  Object.assign(S,{mode:'fly',t:0,bt:0,melt:0,placed:0,moving:0,batt:0,tempRiseK:0,powerW:sc.model.n*PIDLE,why:''})}
 function reset(){Object.assign(S,{sI:0,kI:2,lI:1,loose:0,th:1,auto:0});recalc()}
 reset();
 /* the check under the chosen assumption */
 function verdict(){const c=sc.check,use=S.loose?c.looseUse:c.worst;
  const why=c.tips?'it tips over':c.slide>1?'it slides apart ('+pc(c.slide)+' of the friction limit)':use>1?'the bonds are at '+pc(use)+' of their limit':!c.bendOk?'joints would have to bend too far':'';
  return{use,why,ok:!why}}

 function step(h){
  if(S.mode!=='fly')return;
  if(S.auto)S.th=clamp((TMAX-8-S.tempRiseK)/12,.15,1);
  const end=sc.time.time;
  S.t+=h;
  S.bt=clamp(S.bt+(S.melt?-1:1)*h*S.th,0,end);
  const c=census(sc,S.bt);S.placed=c.placed;S.moving=S.th>0?c.moving:0;
  /* the worst bot has walked the furthest trip that has started */
  let far=0;const lv=sc.time.leave,d=sc.model.dist;for(let i=0;i<lv.length;i++)if(S.bt>lv[i]&&d[i]>far)far=d[i];
  const trip=S.bt>0?PMOVE*(far+GAP)/(VMOVE*1e3):0;
  S.batt=Math.max(S.batt,(PIDLE*S.t+trip)/EB);
  S.powerW=sc.model.n*PIDLE+S.moving*PMOVE*S.th;
  const target=S.powerW/(HC*sc.area);
  S.tempRiseK+=(target-S.tempRiseK)*(1-Math.exp(-h/6));
  if(S.tempRiseK>TMAX){S.mode='fail';S.why='heat';S.auto=0}
  else if(S.batt>USE){S.mode='fail';S.why='battery';S.auto=0}
  else if(!S.melt&&S.bt>=end){S.mode=verdict().ok?'done':'weak';S.auto=0}
  else if(S.melt&&S.bt<=0){S.mode='melted';S.auto=0}}

 const view=()=>({sc,bt:S.bt,th:0,moving:S.moving});

 function readout(){
  const pw=S.powerW>=1?S.powerW.toFixed(2)+' W':Math.round(S.powerW*1e3)+' mW',v=verdict();
  return[
   ['Elapsed time','T+ '+fmtT(S.t)],
   ['Shape',sc.label+' ×'+sc.k],
   ['Bots in the shape',N(S.placed)+' / '+N(sc.model.n)],
   ['Walking now',N(S.moving)],
   ['Worst battery used',pc(S.batt)+' (cut-off '+pc(USE)+')'],
   ['Swarm power',pw],
   ['Temp rise',S.tempRiseK.toFixed(1)+' K (limit '+TMAX+')'],
   [S.loose?'Bonds, loose strands':'Bonds, locked bundles',pc(v.use)+' of limit']]}

 function status(){
  const nm=sc.label+' ×'+sc.k;
  if(S.mode==='done')return{k:'good',n:nm+' stands',f:'All '+N(sc.model.n)+' bots locked in after '+fmtT(S.t)+', worst battery '+pc(S.batt)+'. '+(S.loose?'It holds even if every strand bends on its own.':'This assumes bundled strands grip each other, which is not proven. Try Loose.')};
  if(S.mode==='weak')return{k:'warn',n:'Built, but it fails',f:'Every bot is in place, but '+verdict().why+'. The real shape would fall. Try a smaller size'+(S.loose?', or Locked bundles.':' or another shape.')};
  if(S.mode==='melted')return{k:'',n:'Back in the pile',f:'The swarm let go and flowed home. Pick a shape, or press Reset.'};
  if(S.mode==='fail'&&S.why==='battery')return{k:'bad',n:'Batteries ran out',f:N(S.placed)+' of '+N(sc.model.n)+' bots were placed. Waiting drains batteries: open more lanes, keep the drive up, or build smaller.'};
  if(S.mode==='fail')return{k:'bad',n:'Swarm overheated',f:'The swarm passed '+TMAX+' K above the room. Ease the drive or use fewer lanes.'};
  if(S.melt)return{k:'',n:'Letting go',f:'Bonds release from the tips inward.'};
  if(S.auto)return{k:'',n:'Autopilot building',f:'The drive eases off as the swarm warms.'};
  return{k:'',n:'Growing '+nm,f:'Pick shape, size and lanes, then ride the drive. Release sends the swarm back to the pile.'}}

 const wrap=(i,n)=>(i+n)%n,cfg=()=>{S.auto=0;recalc()};
 return{
  state:S,step,tick(){},view,read:readout,status,reset,
  ui:{label:'Drive',min:0,max:100,btns:[
   {k:'drop',lf:()=>'Shape: '+sc.label},
   {k:'lamps',lf:()=>'Size: '+sc.k+'×'},
   {k:'damper',lf:()=>'Lanes: '+LANES[S.lI]},
   {k:'lock',lf:()=>S.loose?'Strands: loose':'Strands: locked'},
   {k:'evac',lf:()=>'Release',on:()=>!!S.melt},
   {k:'warp'},{k:'auto'},{k:'reset'}]},
  warp:[1,5,20,120,600],warpL:['1×','5×','20×','2 min/s','10 min/s'],dtmax:2,
  setThrottle(v){S.th=clamp(v,0,1);S.auto=0},
  drop(){S.sI=wrap(S.sI+1,keys().length);while(S.kI>0&&!fits(keys()[S.sI],S.kI))S.kI--;cfg()},
  lamps(){do{S.kI=wrap(S.kI+1,SIZES.length)}while(!fits(keys()[S.sI],S.kI));cfg()},
  damper(){S.lI=wrap(S.lI+1,LANES.length);cfg()},
  lock(){S.loose=S.loose?0:1;if(S.mode==='done'||S.mode==='weak')S.mode=verdict().ok?'done':'weak'},
  evac(){if(S.bt<=0)return;S.melt=S.melt?0:1;S.mode='fly'},
  toggleAuto(){S.auto=S.auto?0:1}}}

Object.assign(T,{createFly});
})();
