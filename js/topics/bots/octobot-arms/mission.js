/* Octopus arms · Launch tab: the stunt reel. One wearer, four arms, nine phases, one run.
   Every frame is a real posture: the reel is a list of keyframes (a pose and four tips each), the state between two keyframes is a smooth blend, and core.evaluate() solves that blend,
   then reports section loads, balance, harness load and the arms' limits. Nothing is drawn from here; World draws state, ev and props.
   Gripping needs something the pincer can wrap (a rung, a ledge). A foot stands only within 30 mm of the floor. The model has weight and statics only: no push against a wall, no friction,
   no impact, no swing of a knocked arm. So the wall brace is a reach and the stumble is a slow motion, not a fall. Climbing and hanging are held by the pincers; the model counts their load, not their grip on the rung.
   Power and heat use one duty per phase, set by how much the arms move in it.
   at(u), u 0..1, returns {state, ev, props, n, f, i, t, ...readouts}. read(s) returns [label, value] pairs. P is the phase list, duration the reel time in s. */
(function(){
const T=(window.HV.T=window.HV.T||{}).octopus=window.HV.T.octopus||{};
const {PI,clamp,POSES,REFTIPS,REFDIR,REFTOOL,MOUNT,EBAT,TAMB,TLIM,TAU,DELAY,evaluate,power,heatStep,skeleton,toWorld,hangPose}=T;
const kg=(x,d)=>x.toFixed(d===undefined?1:d)+' kg',pc=x=>Math.round(x*100)+'%',cm=x=>Math.round(x*100)+' cm',fmtT=t=>Math.floor(t/60)+':'+('0'+Math.floor(t%60)).slice(-2);
const DN=[0,-1,0],LOAD=.5;                                  /* load per upper pincer in the hold phase, kg (1 kg in all) */

/* ---------- nine phases. w = share of the reel, d = duty (how much the arms move: sets power and heat) ---------- */
const PHASES=[
 {n:'Stand by',        w:.06,d:.05,f:'The wearer stands in the reference stance: upper pincers up and out, lower feet planted behind. Only the electronics run.'},
 {n:'Reach',           w:.10,d:.8, f:'Both upper pincers stretch for a shelf almost 2 m up. The arms are at full stretch, so the straps and the first sections take the most they will in this reel.'},
 {n:'Ladder climb',    w:.16,d:1,  f:'The pincers take rungs and the wearer steps up with the lower feet drawn in. The pincers carry part of the body as straight columns. On the feet alone the balance margin is only a few centimetres.'},
 {n:'Ledge hang',      w:.14,d:.5, f:'From the top step the pincers grip a ledge overhead and the wearer lets go of the step. Two arms carry the whole system, straight above their sockets.'},
 {n:'Four-leg walk',   w:.14,d:1,  f:'The wearer drops into a crouch and the arms become legs. Diagonal pairs step in turn, so at least two pads and both feet stay down.'},
 {n:'Hold a load',     w:.12,d:.15,f:'The wearer stands and the upper pincers hold 1 kg out in front while both hands are free for other work. The lower feet keep the balance.'},
 {n:'Wall brace',      w:.10,d:.3, f:'The wearer leans toward a wall and the upper pincers reach out to it. The model counts weight only, so a push against the wall is not modelled.'},
 {n:'Stumble recovery',w:.12,d:1,  f:'The wearer pitches forward and the upper arms drop to the floor ahead. The balance margin dips, then the arms take the weight in a four-point stance.'},
 {n:'Done',            w:.06,d:.05,f:'The wearer stands up and the arms return to the reference stance. The pack is warm and the reel is over.'}
];
const TEND=80;                                              /* s of reel time */
const B=[0];PHASES.forEach(p=>B.push(B[B.length-1]+p.w));B[B.length-1]=1;

/* ---------- the stage, from the same numbers the keyframes use ---------- */
const SHELF=1.9,ZSH=1.0,ZL=-.22,RUNG0=.3,RUNGS=.28,STEP1=.30,ZLEDGE=-.17,PZ=.4;
const rung=y=>RUNG0+RUNGS*Math.round((y-RUNG0)/RUNGS);
const mkPose=o=>Object.assign({},POSES.stand,o);
const hipY=p=>skeleton(p).py;

/* ---------- keyframes: [u, pose, four arm specs, props on show] ---------- */
const ARM0=a=>({tip:REFTIPS[a].slice(),dir:REFDIR[a]?REFDIR[a].slice():null,tool:REFTOOL[a],load:0,hold:false});
const KF=[];
const key=(u,pose,arms,props)=>{KF.push({u:u,pose:pose,arms:[0,1,2,3].map(a=>Object.assign(ARM0(a),(arms&&arms[a])||{})),props:props||[]})};
const ft=(x,z,y)=>({tip:[x,y||0,z],dir:DN,tool:'foot'});
const pin=(x,y,z,o)=>Object.assign({tip:[x,y,z],dir:null,tool:'pincer',hold:false},o||{});
const shelf=[{type:'ledge',x:0,y:SHELF,z:ZSH,w:1.1,d:.3}];
const ladder=[{type:'ladder',x:0,y:0,z:ZL,h:3.6,w:.45}];
const wall=[{type:'wall',x:0,y:0,z:PZ+1.12,w:3,h:3}];
const L2=ft(.32,-.22),R2=ft(-.32,-.22);

/* 1-2 stand by, reach */
key(0,mkPose({}),[]);
key(B[1],mkPose({}),[]);
key(B[2]-.01,mkPose({}),[pin(.28,SHELF+.05,ZSH-.02),pin(-.28,SHELF+.05,ZSH-.02),L2,R2],shelf);

/* 3 ladder climb: back to the ladder, so the rungs sit above the arm sockets and the pincers pull straight up. The wearer steps up with both feet while the pincers are loose,
   then re-grips hand over hand: one pincer moves up while the other holds. Rung heights are the ladder's own */
const cB=mkPose({lean:6,supL:STEP1,supR:STEP1,uaL:150,uaR:170,elL:10,elR:10}),s0=mkPose({});
const rg=p=>rung(hipY(p)+.43+1.2);                           /* a pincer pulls best when its rung is nearly an arm's length above the socket, so the arm is a straight column */
const r0=rg(s0),r1=r0,n0=rg(cB),n1=n0;                       /* the rung gripped from the floor, and the next one up from the first step */
const hold=(x,y,o)=>pin(x,y,ZL,Object.assign({hold:true},o||{}));
const dang=(p,x)=>ft(x,-.3,hipY(p)+.27-1.3);                  /* a leg arm hangs straight down, off the floor */
key(B[2]+.03,s0,[hold(.14,r0),hold(-.14,r1),L2,R2],shelf.concat(ladder));
key(B[2]+.065,cB,[hold(.14,r0,{hold:false}),hold(-.14,r1,{hold:false}),dang(cB,.2),dang(cB,-.2)],ladder);
key(B[2]+.09,cB,[hold(.14,n0,{hold:false}),hold(-.14,r1,{hold:false}),dang(cB,.2),dang(cB,-.2)],ladder);
key(B[2]+.105,cB,[hold(.14,n0),hold(-.14,r1,{hold:false}),dang(cB,.2),dang(cB,-.2)],ladder);
key(B[2]+.125,cB,[hold(.14,n0),hold(-.14,n1,{hold:false}),dang(cB,.2),dang(cB,-.2)],ladder);
key(B[3]-.005,cB,[hold(.14,n0),hold(-.14,n1),dang(cB,.2),dang(cB,-.2)],ladder);

/* 4 ledge hang: the ledge sits above the sockets at the height where the arms are straight columns with the pelvis at the same height as on the top step. Both pincers let go of the rungs
   and take the ledge with the feet still down, then the step drops away and the pincers take the whole weight. No snatch: core has no dynamics, so a drop into a slack arm would not be modelled */
const HY=3.03,hp=hangPose(HY),hs=skeleton(hp),sk0=a=>{const w=toWorld(hs,MOUNT[a]);return[w[0],w[2]]};
const ledge=[{type:'ledge',x:0,y:HY,z:ZLEDGE,w:.7,d:.3}];
const grip=(a,o)=>{const s=sk0(a);return pin(s[0],HY,s[1],Object.assign({hold:true},o||{}))};
const dgl=a=>{const s=sk0(a);return ft(s[0],s[1],hp.py+.27-1.3)};
const cF=Object.assign({},cB,{lean:0,py:hp.py});               /* the top step pose, upright, with the pelvis at hanging height */
key(B[3]+.025,cF,[grip(0,{hold:false}),grip(1,{hold:false}),dang(cB,.2),dang(cB,-.2)],ledge.concat(ladder));
key(B[3]+.05,cF,[grip(0),grip(1),dang(cB,.2),dang(cB,-.2)],ledge.concat(ladder));
key(B[3]+.09,hp,[grip(0),grip(1),dgl(2),dgl(3)],ledge);
key(B[4]-.005,hp,[grip(0),grip(1),dgl(2),dgl(3)],ledge);

/* 5 four-leg walk: let go, drop the last few centimetres, crouch, arms as legs, diagonal pairs step. pz moves the wearer forward. Planted arms stay within the column zone core can carry */
key(B[4]+.012,mkPose({}),[pin(.45,1.7,.1),pin(-.45,1.7,.1),ft(.2,-.3,.15),ft(-.2,-.3,.15)]);   /* the feet land first, the lower arms stay off the floor until they do */
const cr=z=>mkPose(Object.assign({},POSES.crouch,{pz:z}));
key(B[4]+.03,cr(0),[ft(.3,.35),ft(-.3,0),ft(.32,-.1),ft(-.32,-.4)]);
key(B[4]+.055,cr(.1),[ft(.3,.45,.14),ft(-.3,0),ft(.32,-.1),ft(-.32,-.2,.14)]);
key(B[4]+.08,cr(.2),[ft(.3,.55),ft(-.3,0),ft(.32,-.1),ft(-.32,0)]);
key(B[4]+.105,cr(.3),[ft(.3,.55),ft(-.3,.1,.14),ft(.32,0,.14),ft(-.32,0)]);
key(B[5]-.005,cr(PZ),[ft(.3,.55),ft(-.3,.2),ft(.32,.1),ft(-.32,0)]);

/* 6 hold a load: stand up, lower feet plant, upper pincers hold a crate out in front while the hands (the wearer's own) work at the waist */
const hands={uaL:45,uaR:45,elL:70,elR:70,pz:PZ};
const lowP=[ft(.32,PZ-.22),ft(-.32,PZ-.22)];
key(B[5]+.03,mkPose(Object.assign({},hands)),[pin(.26,1.15,PZ+.8,{load:LOAD}),pin(-.26,1.15,PZ+.8,{load:LOAD}),lowP[0],lowP[1]]);
key(B[6]-.01,mkPose(Object.assign({},hands)),[pin(.26,1.15,PZ+.8,{load:LOAD}),pin(-.26,1.15,PZ+.8,{load:LOAD}),lowP[0],lowP[1]]);

/* 7 wall brace: lean to the wall, upper pincers reach it, lower feet planted wide behind */
const lean=mkPose({lean:14,pz:PZ,uaL:20,uaR:20,elL:20,elR:20}),wf=[ft(.32,PZ-.35),ft(-.32,PZ-.35)];
key(B[6]+.03,lean,[pin(.45,1.7,PZ+1.0),pin(-.45,1.7,PZ+1.0),wf[0],wf[1]],wall);
key(B[7]-.01,lean,[pin(.45,1.7,PZ+1.0),pin(-.45,1.7,PZ+1.0),wf[0],wf[1]],wall);

/* 8 stumble: the wearer pitches forward with the lower feet off the floor, the margin goes negative, then the upper arms drop to the floor ahead and take the weight */
const trip=mkPose({lean:20,thL:30,thR:-22,knL:10,knR:12,uaL:-18,uaR:18,elL:15,elR:15,pz:PZ+.1}),cs=mkPose(Object.assign({},POSES.crouch,{pz:PZ+.2}));
key(B[7]+.03,trip,[pin(.45,1.7,PZ+1.1),pin(-.45,1.7,PZ+1.1),ft(.32,PZ-.3,.15),ft(-.32,PZ-.3,.15)]);
key(B[7]+.06,cs,[ft(.3,PZ+.5),ft(-.3,PZ+.5),ft(.32,PZ-.05,.15),ft(-.32,PZ-.05,.15)]);
key(B[7]+.085,cs,[ft(.3,PZ+.45),ft(-.3,PZ+.45),ft(.32,PZ-.05),ft(-.32,PZ-.05)]);
key(B[8]-.005,cs,[ft(.3,PZ+.45),ft(-.3,PZ+.45),ft(.32,PZ-.05),ft(-.32,PZ-.05)]);

/* 9 done: stand, arms back to the reference stance, now PZ+.2 down the floor */
const ZE=PZ+.2,dn=ARM0;
key(B[8]+.03,mkPose({pz:ZE}),[{tip:[REFTIPS[0][0],REFTIPS[0][1],ZE+REFTIPS[0][2]]},{tip:[REFTIPS[1][0],REFTIPS[1][1],ZE+REFTIPS[1][2]]},ft(.32,ZE-.22),ft(-.32,ZE-.22)]);
key(1,mkPose({pz:ZE}),[{tip:[REFTIPS[0][0],REFTIPS[0][1],ZE+REFTIPS[0][2]]},{tip:[REFTIPS[1][0],REFTIPS[1][1],ZE+REFTIPS[1][2]]},ft(.32,ZE-.22),ft(-.32,ZE-.22)]);

/* ---------- blending ---------- */
const PK=['lean','thL','thR','knL','knR','uaL','uaR','elL','elR','supL','supR','pz'];
const lerp=(a,b,g)=>a+(b-a)*g,lv=(a,b,g)=>[lerp(a[0],b[0],g),lerp(a[1],b[1],g),lerp(a[2],b[2],g)];
const setpy=(p,v)=>Object.assign({},p,{py:v});
function blendPose(a,b,g){
 const o={};PK.forEach(k=>{o[k]=lerp(a[k]||0,b[k]||0,g)});
 if(a.py!==undefined||b.py!==undefined){const pa=a.py!==undefined?a.py:skeleton(a).py,pb=b.py!==undefined?b.py:skeleton(b).py;o.py=lerp(pa,pb,g)}
 return o}
function blendArm(a,b,g){
 const hold=(a.hold&&b.hold)||(b.hold&&g>.995)||(a.hold&&g<.005),tool=g<.5?a.tool:b.tool;
 let dir=null;if(a.dir&&b.dir)dir=lv(a.dir,b.dir,g);else if(a.dir&&g<.5)dir=a.dir.slice();else if(b.dir&&g>=.5)dir=b.dir.slice();
 return{tip:lv(a.tip,b.tip,g),dir:dir,tool:tool,load:lerp(a.load||0,b.load||0,g),hold:hold}}
const QC=[null,null,null,null];                             /* last solution per arm: a warm start, so scrubbing and playing both converge */
function stateAt(u){
 let i=0;while(i<KF.length-2&&u>=KF[i+1].u)i++;
 const a=KF[i],b=KF[i+1],gg=clamp((u-a.u)/(b.u-a.u),0,1),g=.5-.5*Math.cos(gg*PI);
 const st={pose:blendPose(a.pose,b.pose,g),arms:[0,1,2,3].map(k=>blendArm(a.arms[k],b.arms[k],g))};
 const props=gg<.5?a.props:b.props;
 st.arms.forEach((r,k)=>{if(QC[k]&&!r.hold&&!(r.tool==='foot'&&r.tip[1]<.06))r.q=QC[k].slice()});   /* loaded arms always start from the relaxed posture, so a column is always the same column */
 let ev=evaluate(st,{iter:50});
 if(ev.arms.some(r=>r.sol&&r.sol.err>.03)){st.arms.forEach(r=>{r.q=null});ev=evaluate(st,{iter:140})}   /* a jump (scrub): solve again from the relaxed posture */
 st.arms.forEach((r,k)=>{QC[k]=r.q?r.q.slice():null});
 return{st:st,ev:ev,props:props}}

/* ---------- time: power, heat and energy, one value per phase, taken from a mid-phase solve and cached ---------- */
let TAB=null;
function table(){
 if(TAB)return TAB;TAB=[];let tc=TAMB,e=0;
 PHASES.forEach((p,i)=>{const u0=B[i],u1=B[i+1],s=stateAt((u0+u1)/2),pw=power(s.ev,p.d),dt=(u1-u0)*TEND;
  TAB.push({u0:u0,t0:u0*TEND,tc0:tc,e0:e,q:pw.armHeat,net:pw.net,el:pw.el,mech:pw.mech});
  tc=heatStep(tc,pw.armHeat,dt);e+=pw.net*dt/3600});
 QC.fill(null);return TAB}
function clock(u){const tb=table();let i=tb.length-1;while(i>0&&u<tb[i].u0)i--;const r=tb[i],t=u*TEND,dt=t-r.t0;
 return{temp:heatStep(r.tc0,r.q,dt),wh:r.e0+r.net*dt/3600,watts:r.el}}

function at(u){
 u=clamp(u||0,0,1);const s=stateAt(u),ev=s.ev;let pi=0;while(pi<PHASES.length-1&&u>=B[pi+1])pi++;
 const ph=PHASES[pi],c=clock(u),bal=ev.balance;
 let reach=0;ev.arms.forEach(r=>{reach=Math.max(reach,Math.hypot(r.sh.p[0]-r.sh.root.o[0],r.sh.p[1]-r.sh.root.o[1],r.sh.p[2]-r.sh.root.o[2]))});
 let load=0;s.st.arms.forEach(r=>{load+=r.load||0});
 const lim={arm:ev.util>1,strap:ev.spine.util>1,tip:!!bal.tip,hot:c.temp>TLIM};   /* arm, strap and hot are hardware limits; tip is the wearer going over, which the stumble does on purpose for a moment */
 return{u:u,t:u*TEND,i:pi,n:ph.n,f:ph.f,state:s.st,ev:ev,props:s.props,
  reach:reach,load:load,armUtil:ev.util,worst:ev.arms.reduce((w,r)=>r.loads.util>w.loads.util?r:w,ev.arms[0]).a,strap:ev.spine.util,
  mode:bal.mode,margin:bal.margin,swing:bal.swing,warn:bal.warn,
  temp:c.temp,wh:c.wh,batt:c.wh/EBAT,watts:c.watts,delay:DELAY.nerve,lim:lim,tipping:lim.tip,over:lim.arm||lim.strap||lim.hot}}

function read(s){
 const bal=s.mode==='hang'?['Swing under holds',cm(s.swing)]:s.mode==='fall'?['Support','none, dropping']:['Balance margin',Math.round(s.margin*1000)+' mm'+(s.margin<0?' (tipping)':s.warn?' (narrow)':'')];
 return[['Time',fmtT(s.t||0)],['Phase',s.n],['Arm reach',cm(s.reach)],['Load held',kg(s.load,1)],
  ['Busiest arm','Arm '+(s.worst+1)+', '+pc(s.armUtil)+' of limit'],['Harness straps',pc(s.strap)+' of comfort'],bal,
  ['Power',Math.round(s.watts)+' W'],['Battery used',(s.wh).toFixed(2)+' Wh, '+(s.batt*100).toFixed(2)+'%'],['Arm temperature',Math.round(s.temp)+' °C of '+TLIM],['Control delay',Math.round(s.delay*1000)+' ms']]}

/* the stage and the blend are shared with Fly, so both tabs use the same ladder, ledge and pose maths */
const STAGE={SHELF:SHELF,ZSH:ZSH,ZL:ZL,RUNG0:RUNG0,RUNGS:RUNGS,STEP1:STEP1,ZLEDGE:ZLEDGE,PZ:PZ,HY:HY,rung:rung};
Object.assign(T,{at:at,read:read,P:PHASES.map(p=>({n:p.n,w:p.w})),duration:TEND,STAGE:STAGE,blendPose:blendPose});
})();
