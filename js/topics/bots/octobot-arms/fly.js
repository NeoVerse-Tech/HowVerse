/* Octopus arms · Fly tab: you steer the arms, one at a time.
   Pick an arm, point it (Up, Out, Front, Floor, or onto a hold), set how far it stretches with the slider, swap its tip between pincer and foot, load it, and grip a rung or ledge.
   Four poses: Stand, Crouch (four-leg), Climb, Hang. Every number comes from core.evaluate(), the same solver Launch uses, so the two tabs always agree.
   Three things end a run: tip-over (the centre of mass leaves the support, or nothing supports it), joint overload (an arm or the straps pass their working load), overheated drive (an arm passes its surface limit).
   Only one arm is steered at a time, as Learn says: the others hold their pose. The model has weight and statics only, so a knocked or swinging arm is not modelled.
   Auto runs the same commands the buttons give, so it is a real run, not a replay. */
(function(){
const T=(window.HV.T=window.HV.T||{}).octopus=window.HV.T.octopus||{};
const {PI,clamp,POSES,MOUNT,NARM,L,EBAT,TAMB,TLIM,DELAY,evaluate,power,heatStep,skeleton,toWorld,hangPose,STAGE,blendPose}=T;
const fmtT=t=>Math.floor(t/60)+':'+('0'+Math.floor(t%60)).slice(-2),pc=x=>Math.round(x*100)+'%',kg=(x,d)=>x.toFixed(d===undefined?1:d)+' kg',cm=x=>Math.round(x*100)+' cm';

const NAMES=['upper left','upper right','lower left','lower right'];
const AIMS=['up','out','front','floor','hold'],AIML={up:'Up',out:'Out',front:'Front',floor:'Floor',hold:'Hold'};
const LOADS=[0,.5,1,2,3];                                /* kg a pincer can be given; 1 kg is the rated payload at full reach, so 2 and 3 kg are for finding the limit */
const D0=.2,DMAX=.99*L;                                  /* nearest and farthest a tip goes from its socket, m */
const TIPV=1.2,TRANS=2.4,SNAP=.02;                       /* tip speed m/s, pose change time s, how close counts as on a hold */
const DN=[0,-1,0];
const DIRS={up:[.35,1,.25],out:[1,.25,.1],front:[.15,.05,1]};   /* trunk-frame directions; x is mirrored for the right side */
const FLOORPT=[[.30,.45],[-.30,.45],[.32,-.10],[-.32,-.10]];    /* where each foot goes on the floor: x, z (crouch, climb, hang) */
const FLOORLO=[[.30,.45],[-.30,.45],[.32,-.22],[-.32,-.22]];    /* the standing stance: lower feet well behind */

/* ---------- the four poses, each with the props it needs and the arm set-up a press of the button gives ---------- */
const ST=STAGE;
const CLIMBP=Object.assign({},POSES.stand,{lean:6,supL:ST.STEP1,supR:ST.STEP1,uaL:150,uaR:170,elL:10,elR:10});
const HANGP=hangPose(ST.HY);
const POSEN=['stand','crouch','climb','hang'],POSEL={stand:'Stand',crouch:'Crouch',climb:'Climb',hang:'Hang'};
const PP={stand:POSES.stand,crouch:POSES.crouch,climb:CLIMBP,hang:HANGP};
const PROPS={stand:[],crouch:[],climb:[{type:'ladder',x:0,y:0,z:ST.ZL,h:3.6,w:.45}],hang:[{type:'ledge',x:0,y:ST.HY,z:ST.ZLEDGE,w:.7,d:.3}]};
const HOLDS=(()=>{const h={stand:[null,null,null,null],crouch:[null,null,null,null]};
 const y=ST.rung(skeleton(CLIMBP).py+.43+1.2);h.climb=[[.14,y,ST.ZL],[-.14,y,ST.ZL],null,null];
 const hs=skeleton(HANGP);h.hang=[0,1].map(a=>{const w=toWorld(hs,MOUNT[a]);return[w[0],ST.HY,w[2]]}).concat([null,null]);return h})();
/* arm set-up per pose: [tool, aim, extension, grip once there] for each arm */
const SETUP={
 stand:[['pincer','up',.6],['pincer','up',.6],['foot','floor',1],['foot','floor',1]],
 crouch:[['foot','floor',1],['foot','floor',1],['foot','floor',1],['foot','floor',1]],
 climb:[['pincer','hold',1,1],['pincer','hold',1,1],['foot','floor',.5],['foot','floor',.5]],
 hang:[['pincer','hold',1,1],['pincer','hold',1,1],['foot','floor',.6],['foot','floor',.6]]};

function createFly(){
 const S={};let A=[],pFrom=null,pTo=null,pName='stand',dirty=true,evTip=null;
 const st={pose:POSES.stand,arms:[0,1,2,3].map(()=>({tip:[0,0,0],dir:null,tool:'pincer',load:0,hold:false,q:null}))};
 const mkArm=u=>({tool:u[0],aim:u[1],ext:u[2],load:0,hold:false,want:u[3]?1:0,cur:null,q:null});
 const holdPt=a=>HOLDS[pName][a];
 const hasHold=a=>!!holdPt(a);

 function reset(){
  pName='stand';pFrom=pTo=PP.stand;
  A=SETUP.stand.map(mkArm);
  Object.assign(S,{mode:'fly',t:0,sel:0,pose:'stand',blend:1,work:0,duty:.05,tempC:TAMB,wh:0,powerW:0,reach:.6,auto:0,autoT:0,autoI:0,why:'',busy:0,curPose:pTo});
  S.props=PROPS.stand;S.ev=null;evTip=null;dirty=true;
  const sk=skeleton(pTo);A.forEach((x,a)=>{x.cur=target(a,sk)});
  solve();refreshPower()}

 /* ---------- targets ---------- */
 function target(a,sk){
  const x=A[a],r=toWorld(sk,MOUNT[a]);
  if(x.hold&&holdPt(a))return holdPt(a).slice();
  const sx=a%2?-1:1;let dir,cap=Infinity;
  if(x.aim==='floor'){const f=(pName==='stand'?FLOORLO:FLOORPT)[a],v=[f[0]-r[0],-r[1],f[1]-r[2]],l=Math.hypot(v[0],v[1],v[2]);dir=[v[0]/l,v[1]/l,v[2]/l];cap=l}
  else if(x.aim==='hold'&&holdPt(a)){const h=holdPt(a),v=[h[0]-r[0],h[1]-r[1],h[2]-r[2]],l=Math.hypot(v[0],v[1],v[2]);dir=[v[0]/l,v[1]/l,v[2]/l];cap=l}
  else{const q=DIRS[x.aim==='hold'?'front':x.aim],l=Math.hypot(q[0],q[1],q[2]),w=[q[0]*sx/l,q[1]/l,q[2]/l];
   dir=[sk.tx[0]*w[0]+sk.ty[0]*w[1]+sk.tz[0]*w[2],sk.tx[1]*w[0]+sk.ty[1]*w[1]+sk.tz[1]*w[2],sk.tx[2]*w[0]+sk.ty[2]*w[1]+sk.tz[2]*w[2]]}
  let e=x.ext;if(S.work&&a===S.sel&&!x.hold)e=clamp(e+.25*Math.sin(2*PI*S.t/6),0,1);
  const d=Math.min(D0+e*(DMAX-D0),cap,DMAX);
  return[r[0]+dir[0]*d,Math.max(0,r[1]+dir[1]*d),r[2]+dir[2]*d]}
 const reached=a=>{const h=holdPt(a),c=A[a].cur;return!!h&&Math.hypot(c[0]-h[0],c[1]-h[1],c[2]-h[2])<=SNAP};

 /* ---------- solve: core.evaluate on the current state, solved the way Launch does it ---------- */
 function solve(){
  st.pose=S.curPose;
  A.forEach((x,a)=>{const r=st.arms[a];r.tip=x.cur.slice();r.dir=(x.tool==='foot'&&x.aim==='floor')?DN:null;r.tool=x.tool;r.load=x.load;r.hold=x.hold;
   const loaded=x.hold||(x.tool==='foot'&&x.cur[1]<.06);r.q=(!loaded&&x.q)?x.q.slice():null});
  let ev=evaluate(st,{iter:50});
  if(ev.arms.some(r=>r.sol&&r.sol.err>.03)){st.arms.forEach(r=>{r.q=null});ev=evaluate(st,{iter:140})}
  A.forEach((x,a)=>{x.q=st.arms[a].q?st.arms[a].q.slice():null});
  S.ev=ev;evTip=A.map(x=>x.cur.slice());dirty=false}
 function refreshPower(){S.pw=power(S.ev,S.duty);S.powerW=S.pw.el}

 /* ---------- commands: the buttons and Auto both go through these ---------- */
 const live=()=>S.mode==='fly';
 const arm=i=>{if(!live())return;S.sel=((i%NARM)+NARM)%NARM;S.reach=A[S.sel].ext};
 const aimsFor=a=>AIMS.filter(n=>n!=='hold'||(hasHold(a)&&A[a].tool==='pincer'));
 const aim=n=>{if(!live())return;const x=A[S.sel];if(aimsFor(S.sel).indexOf(n)<0||x.hold)return;x.aim=n;dirty=true};
 const reach=v=>{if(!live())return;const x=A[S.sel];if(x.hold)return;x.ext=clamp(v,0,1);S.reach=x.ext;dirty=true};
 const tool=n=>{if(!live())return;const x=A[S.sel];if(x.tool===n)return;x.tool=n;x.hold=false;x.want=0;x.load=0;if(n==='foot'&&x.aim==='hold')x.aim='floor';dirty=true};
 const load=v=>{if(!live())return;const x=A[S.sel];if(x.tool!=='pincer')return;x.load=v;dirty=true};
 const grip=on=>{if(!live())return;const x=A[S.sel];if(on){if(x.tool==='pincer'&&x.aim==='hold'&&reached(S.sel)){x.hold=true;x.want=0}}else x.hold=false;dirty=true};
 const work=on=>{if(!live())return;S.work=on?1:0;dirty=true};
 const pose=n=>{if(!live()||POSEN.indexOf(n)<0||(n===pName&&S.blend>=1))return;
  pFrom=S.curPose;pTo=PP[n];pName=n;S.pose=n;S.blend=0;S.props=PROPS[n];
  A.forEach((x,a)=>{const u=SETUP[n][a];x.tool=u[0];x.aim=u[1];x.ext=u[2];x.load=0;x.hold=false;x.want=u[3]?1:0});S.reach=A[S.sel].ext;dirty=true};

 /* ---------- one step of the run ---------- */
 function step(h){
  if(S.mode!=='fly')return;
  S.t+=h;
  if(S.auto)autoStep(h);
  /* pose change */
  if(S.blend<1){S.blend=Math.min(1,S.blend+h/TRANS);S.curPose=S.blend>=1?pTo:blendPose(pFrom,pTo,.5-.5*Math.cos(S.blend*PI));dirty=true}
  const sk=skeleton(S.curPose);
  /* tips glide to their targets */
  let moved=0,speed=0;
  A.forEach((x,a)=>{const tg=target(a,sk),dx=tg[0]-x.cur[0],dy=tg[1]-x.cur[1],dz=tg[2]-x.cur[2],dd=Math.hypot(dx,dy,dz);
   if(dd>1e-6){const m=Math.min(dd,TIPV*h),k=m/dd;x.cur[0]+=dx*k;x.cur[1]+=dy*k;x.cur[2]+=dz*k;moved+=m;speed+=Math.min(1,m/(TIPV*h))}
   if(x.want&&!x.hold&&S.blend>=1&&reached(a)){x.hold=true;x.want=0;dirty=true}});
  if(!dirty&&evTip){let big=0;A.forEach((x,a)=>{big=Math.max(big,Math.hypot(x.cur[0]-evTip[a][0],x.cur[1]-evTip[a][1],x.cur[2]-evTip[a][2]))});dirty=big>.002}
  if(dirty||moved>1e-6||!S.ev)solve();
  S.busy=(S.blend<1||A.some(x=>x.want&&!x.hold))?1:0;
  /* duty: how much the arms are moving, smoothed. Work keeps them going all the time */
  const tgt=S.work?1:Math.max(.05,speed/NARM);S.duty+=(tgt-S.duty)*(1-Math.exp(-h/2));
  refreshPower();
  S.tempC=heatStep(S.tempC,S.pw.armHeat,h);S.wh+=S.pw.net*h/3600;
  /* limits end the run, but not while the wearer is changing pose or an arm is still on its way to a hold */
  if(!S.busy){
   if(S.ev.balance.tip){S.mode='fail';S.why='tip-over'}
   else if(S.ev.util>1||S.ev.spine.util>1){S.mode='fail';S.why='joint overload'}
   else if(S.tempC>=TLIM){S.mode='fail';S.why='overheated drive'}
   if(S.mode==='fail'){S.auto=0;return}}
  if(S.auto&&S.autoI>=AUTO.length&&!S.busy){S.mode='done';S.auto=0;S.why=''}
 }

 /* ---------- Auto: the same commands the buttons give. Reach, climb, hang, crouch, stand, carry a load, then put everything back ---------- */
 const sel=(a,f)=>()=>{arm(a);f()};
 const AUTO=[
  {t:0,f:sel(0,()=>{aim('up');reach(.6)})},
  {t:1.5,f:sel(0,()=>reach(1))},{t:2,f:sel(1,()=>{aim('out');reach(.9)})},
  {t:5,f:()=>pose('climb')},
  {t:12,f:()=>pose('hang')},
  {t:21,f:()=>pose('crouch')},
  {t:28,f:()=>pose('stand')},
  {t:33,f:sel(0,()=>{aim('front');reach(.7);load(.5)})},{t:33.5,f:sel(1,()=>{aim('front');reach(.7);load(.5)})},
  {t:41,f:sel(0,()=>{load(0);aim('up');reach(.6)})},{t:41.5,f:sel(1,()=>{load(0);aim('up');reach(.6)})},
  {t:46,f:()=>{}}];
 function autoStep(h){S.autoT+=h;while(S.autoI<AUTO.length&&S.autoT>=AUTO[S.autoI].t){AUTO[S.autoI].f();S.autoI++}}
 function toggleAuto(){
  if(S.mode!=='fly')return;
  if(S.auto){S.auto=0;return}
  reset();S.auto=1}

 /* ---------- view, readouts, status ---------- */
 function view(){return{state:st,ev:S.ev,props:S.props,pose:S.pose,sel:S.sel,t:S.t}}
 function read(){
  const ev=S.ev,b=ev.balance,x=A[S.sel],r=ev.arms[S.sel],o=r.sh.root.o,dist=Math.hypot(r.sh.p[0]-o[0],r.sh.p[1]-o[1],r.sh.p[2]-o[2]);
  let tl=0;A.forEach(y=>{tl+=y.load});
  const worst=ev.arms.reduce((w,q)=>q.loads.util>w.loads.util?q:w,ev.arms[0]);
  const bal=b.mode==='hang'?['Swing under holds',cm(b.swing)]:b.mode==='fall'?['Support','none']:['Balance margin',Math.round(b.margin*1000)+' mm'+(b.margin<0?' (tipping)':b.warn?' (narrow)':'')];
  return[['Time',fmtT(S.t)],['Pose',POSEL[S.pose]],['Arm',(S.sel+1)+', '+NAMES[S.sel]],['Tip',x.tool+(x.hold?', gripping':x.aim==='hold'&&reached(S.sel)?', at the hold':'')],
   ['Arm reach',cm(dist)],['Load held',kg(tl,1)],['Busiest arm','Arm '+(worst.a+1)+', '+pc(ev.util)+' of limit'],['Harness straps',pc(ev.spine.util)+' of comfort'],bal,
   ['Power',Math.round(S.powerW)+' W'],['Battery used',pc(Math.min(1,S.wh/EBAT))],['Arm temperature',Math.round(S.tempC)+' °C of '+TLIM],['Control delay',Math.round(DELAY.nerve*1000)+' ms']]}
 function status(){
  if(S.mode==='done')return{k:'good',n:'Run complete',f:'Every pose held and every limit respected. The harness carried it.'};
  if(S.mode==='fail'){
   if(S.why==='tip-over')return{k:'bad',n:'Tip-over',f:'The centre of mass left the support, or nothing supported it. The wearer would fall.'};
   if(S.why==='joint overload')return{k:'bad',n:'Joint overload',f:'An arm or the straps passed their working load. Something would break or give.'};
   return{k:'bad',n:'Overheated drive',f:'An arm passed its '+TLIM+' °C surface limit. The motors would trip.'}}
  if(S.auto)return{k:'',n:'Autopilot',f:'The same commands as the buttons: reach, climb, hang, crouch, stand, carry. Watch the balance and the limits.'};
  if(S.busy)return{k:'',n:'Changing pose',f:'The wearer is moving to '+POSEL[S.pose]+'. Limits are not checked until the arms are in place.'};
  if(A[S.sel].hold)return{k:'',n:'Gripping',f:'Arm '+(S.sel+1)+' holds the '+(S.pose==='hang'?'ledge':'rung')+'. Release the grip to move it.'};
  return{k:'',n:'Ready',f:'Arm '+(S.sel+1)+' ('+NAMES[S.sel]+') is selected. Point it, stretch it with the slider, swap its tip, load it. Pick another arm to steer that one instead.'}}

 const buttons=[
  {k:'arm',lf:()=>'Arm '+(S.sel+1)+' · '+NAMES[S.sel]},
  {k:'aim',lf:()=>'Aim: '+AIML[A[S.sel].aim]},
  {k:'tool',lf:()=>A[S.sel].tool==='pincer'?'Swap to foot':'Swap to pincer'},
  {k:'grip',lf:()=>A[S.sel].hold?'Release grip':'Grip hold',on:()=>A[S.sel].hold||(A[S.sel].tool==='pincer'&&A[S.sel].aim==='hold'&&reached(S.sel))},
  {k:'load',lf:()=>'Load: '+kg(A[S.sel].load,1),on:()=>A[S.sel].tool==='pincer'},
  {k:'pose',lf:()=>'Pose: '+POSEL[S.pose]},
  {k:'work',lf:()=>S.work?'Work: on':'Work: off'},
  {k:'auto'},{k:'reset'}];

 reset();
 return{
  state:S,step,view,read,status,reset,
  ui:{label:'Reach',min:0,max:100,btns:buttons},
  warp:[1,5,20,120,600],warpL:['1×','5×','20×','2 min/s','10 min/s'],dtmax:1,
  setThrottle(v){reach(v/100);S.auto=0},
  /* button handlers, named by the button's key */
  arm:()=>{arm(S.sel+1);S.auto=0},
  aim:()=>{const l=aimsFor(S.sel);aim(l[(l.indexOf(A[S.sel].aim)+1)%l.length]);S.auto=0},
  tool:()=>{tool(A[S.sel].tool==='pincer'?'foot':'pincer');S.auto=0},
  grip:()=>{grip(!A[S.sel].hold);S.auto=0},
  load:()=>{load(LOADS[(LOADS.indexOf(A[S.sel].load)+1)%LOADS.length]);S.auto=0},
  pose:()=>{pose(POSEN[(POSEN.indexOf(pName)+1)%POSEN.length]);S.auto=0},
  work:()=>{work(!S.work);S.auto=0},
  toggleAuto:toggleAuto,auto:toggleAuto,
  /* the same commands by name, for tests and for Auto */
  cmd:{arm,aim,reach,tool,load,grip,work,pose}
 };
}

Object.assign(T,{createFly});
})();
