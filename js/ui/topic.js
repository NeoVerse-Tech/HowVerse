/* Topic page: Learn / World / Launch (and Fly, when a topic has a flight model) for any topic registered in HV.topics. */
(function(){
const HV=window.HV=window.HV||{};
const G=HV.G,{ref,onMounted,onBeforeUnmount}=Vue;
HV.topics=HV.topics||{};
HV.slug=n=>n.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

/* Topic loader. A topic is a folder: js/topics/<sector id>/<slug>/index.js lists its files and the loader runs them in order.
   A single-file topic at js/topics/<sector id>/<slug>.js still works. Resolves once the topic has registered itself. */
HV._ld=HV._ld||{};HV.manifest=HV.manifest||{};HV.T=HV.T||{};
HV._js=src=>new Promise((ok,no)=>{
 const el=document.createElement('script');el.src=src;
 el.onload=()=>ok(src);
 el.onerror=()=>{el.remove();no(new Error('Could not load '+src))};
 document.head.appendChild(el);
});
HV.load=(sec,slug)=>{
 if(HV.topics[slug])return Promise.resolve();
 if(HV._ld[slug])return HV._ld[slug];
 const base='js/topics/'+sec+'/',idx=base+slug+'/index.js',flat=base+slug+'.js';
 const files=()=>{
  const m=HV.manifest[slug];
  if(!m)throw new Error(idx+' loaded but did not set HV.manifest.'+slug+'.');
  return m.reduce((q,f)=>q.then(()=>HV._js(base+slug+'/'+f)),Promise.resolve());
 };
 return HV._ld[slug]=HV._js(idx).then(files,()=>HV._js(flat).catch(()=>{throw new Error('Could not find the '+slug+' topic. Looked for '+idx+' and '+flat+'.')}))
  .then(()=>{if(!HV.topics[slug])throw new Error('The '+slug+' files loaded but none registered HV.topics.'+slug+'.')})
  .catch(e=>{delete HV._ld[slug];throw e});
};

const TopicView={
 template:`
<div class="tpg" :style="{'--c':sec.c}">
 <header class="th"><button class="bk" @click="$router.push('/s/'+sec.id)">‹ {{sec.n}}</button><b>{{t?t.title:'Not found'}}</b></header>
 <main class="tb" v-if="t">
  <div class="learn" v-if="tab==='learn'">
   <div class="hero"><h1>{{t.title}}</h1><p>{{t.hook}}</p>
    <div class="stats"><div v-for="x in t.stats"><b>{{x[0]}}</b><span>{{x[1]}}</span></div></div></div>
   <section v-for="s in t.learn" :key="s.h"><h3>{{s.h}}</h3><span class="lb" :class="s.l">{{s.l}}</span>
    <p v-for="p in s.p">{{p}}</p><ul v-if="s.k"><li v-for="k in s.k">{{k}}</li></ul></section>
  </div>
  <div class="stage" v-else @pointerdown="down" @pointermove="move" @pointerup="up" @pointercancel="up" @wheel.prevent="wheel"></div>

  <div class="dock" :class="{mini}" v-if="tab==='world'">
   <button class="dh" @click="mini=!mini">{{mini?'▴ Show panel':'▾ Hide panel'}}</button>
   <div class="info hid" v-if="part"><b>{{part.n}}</b><span class="lb" :class="part.l">{{part.l}}</span><p>{{part.d}}</p>
    <div class="kv"><span v-for="k in part.k"><em>{{k[0]}}</em> {{k[1]}}</span></div></div>
   <label class="ex">Pull apart <input type="range" min="0" max="100" :value="ex*100" @input="ex=$event.target.value/100"></label>
   <div class="chips2 hid"><button v-for="p in t.parts" :class="{on:sel===p.id}" @click="sel=sel===p.id?null:p.id">{{p.n}}</button></div>
  </div>

  <div class="dock" :class="{mini}" v-if="tab==='launch'">
   <button class="dh" @click="mini=!mini">{{mini?'▴ Show panel':'▾ Hide panel'}}</button>
   <div class="phase hid"><b>{{st.n}}</b><p>{{st.f}}</p></div>
   <div class="grid hid"><div v-for="r in rd"><em>{{r[0]}}</em><b>{{r[1]}}</b></div></div>
   <div class="tl hid"><i v-for="(p,k) in t.mission.phases" :key="k" :class="{on:k===st.i,done:k<st.i}" :style="{flex:p.w}" @click="jump(k)"></i></div>
   <div class="ctl"><button class="pl" @click="toggle">{{play?'Pause':(u>=1?'Replay':'Play')}}</button>
    <input type="range" min="0" max="1000" :value="u*1000" @input="scrub($event.target.value/1000)">
    <button class="sp" @click="spd=spd===1?3:(spd===3?8:1)">{{spd}}x</button></div>
  </div>

  <div class="dock" :class="{mini}" v-if="tab==='fly'">
   <button class="dh" @click="mini=!mini">{{mini?'▴ Show panel':'▾ Hide panel'}}</button>
   <div class="phase hid" :class="fl.k"><b>{{fl.n}}</b><p>{{fl.f}}</p></div>
   <div class="grid hid"><div v-for="r in fg"><em>{{r[0]}}</em><b>{{r[1]}}</b></div></div>
   <label class="ex">{{ui.label}} <input type="range" :min="ui.min" :max="ui.max" :value="thr" @input="setThr($event.target.value)"><span class="pv">{{thr}}%</span></label>
   <div class="fbt">
    <button v-for="b in ui.btns" :key="b.k" :class="{on:b.k==='auto'?auto:((b.k==='lamps'&&fs.state.lamp)||(b.on&&b.on()))}" @click="act(b.k)">{{b.k==='warp'?'Warp '+WL[wi]:(b.lf?b.lf():b.l)}}</button>
   </div>
  </div>
 </main>
 <main class="tb nf" v-else><p>This topic is coming soon.</p></main>
 <nav class="tabs" v-if="t"><button v-for="k in tabs" :class="{on:tab===k}" @click="tab=k">{{k}}</button></nav>
</div>`,

 setup(){
  const r=VueRouter.useRoute(),sec=HV.sec(r.params.sector)||HV.SECTORS[0],t=HV.topics[r.params.slug];
  const tab=ref('learn'),ex=ref(0),sel=ref(null),u=ref(0),play=ref(false),spd=ref(1),rd=ref([]),st=ref(t?t.mission.at(0):{}),part=ref(null);
  const fs=t&&t.fly?t.fly.create():null;
  /* a flight model may bring its own controls (ui, warp steps, max physics step); otherwise the spaceship controls are used */
  const ui=fs&&fs.ui?fs.ui:{label:'Throttle',min:0,max:100,btns:[{k:'flip',l:'Flip'},{k:'cut',l:'Cut'},{k:'warp'},{k:'auto'},{k:'reset'}]};
  const tabs=['learn','world','launch'].concat(fs?['fly']:[]);
  const thr=ref(0),wi=ref(2),fl=ref({n:'',f:'',k:''}),fg=ref([]),auto=ref(false),mini=ref(false);
  const WV=(fs&&fs.warp)||[1,60,3600,86400],WL=(fs&&fs.warpL)||['1×','1 min/s','1 h/s','1 day/s'];
  const C=HV.C,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  /* distance at which the whole ship fits across the screen width (phones are tall and narrow) */
  const fitD=()=>clamp(24/(1.155*(innerWidth/innerHeight)),18,60);
  let W=null,grp=null,yaw=.6,pit=.2,dist=fitD(),cur=dist,fr=0,fov=60,vt=0,vo=0,vOn=false;const ptr=new Map();

  /* a shared link carries the tab, selected part, pull-apart, launch position and camera. Anything missing or invalid is ignored. */
  const q=r.query||{},num=v=>v!=null&&v!==''&&isFinite(v)?Number(v):null,photo=ref(false);let spin=false;
  const shared=!!(t&&(q.tab||q.part||q.cam||q.ex||q.u));
  if(t){
   if(tabs.indexOf(q.tab)>=0)tab.value=q.tab;
   if(t.parts.some(p=>p.id===q.part))sel.value=q.part;
   if(num(q.ex)!=null)ex.value=clamp(num(q.ex)/100,0,1);
   if(num(q.u)!=null){u.value=clamp(num(q.u)/1000,0,1);st.value=t.mission.at(u.value)}
   const c=String(q.cam||'').split(',').map(Number);
   if(c.length===3&&c.every(isFinite)){yaw=c[0]/100;pit=clamp(c[1]/100,-1.3,1.3);dist=clamp(c[2]/10,8,70);cur=dist}
  }

  const down=e=>{try{e.currentTarget.setPointerCapture(e.pointerId)}catch(_){}ptr.set(e.pointerId,[e.clientX,e.clientY])};
  const up=e=>ptr.delete(e.pointerId);
  const move=e=>{const p=ptr.get(e.pointerId);if(!p)return;
   if(ptr.size===1){yaw-=(e.clientX-p[0])*.008;pit=clamp(pit+(e.clientY-p[1])*.006,-1.3,1.3)}
   else{let o;ptr.forEach((v,k)=>{if(k!==e.pointerId)o=v});if(o){const d0=Math.hypot(p[0]-o[0],p[1]-o[1]),d1=Math.hypot(e.clientX-o[0],e.clientY-o[1]);if(d1>0)dist=clamp(dist*d0/d1,8,70)}}
   ptr.set(e.pointerId,[e.clientX,e.clientY])};
  const wheel=e=>{dist=clamp(dist*(1+e.deltaY*.001),8,70)};
  const toggle=()=>{if(u.value>=1)u.value=0;play.value=!play.value};
  const scrub=v=>{u.value=v;play.value=false};
  const jump=k=>{let a=0;t.mission.phases.slice(0,k).forEach(p=>a+=p.w);u.value=a+.001};

  /* fly controls */
  const setThr=v=>{if(!fs)return;thr.value=Math.round(v);fs.setThrottle(thr.value/100);auto.value=!!fs.state.auto};
  const cut=()=>setThr(0);
  const doFlip=()=>{if(!fs)return;fs.flip();thr.value=0;auto.value=false};
  const toggleAuto=()=>{if(!fs)return;fs.toggleAuto();auto.value=!!fs.state.auto;thr.value=Math.round(fs.state.th*100)};
  const cycleWarp=()=>{wi.value=(wi.value+1)%WV.length};
  const act=k=>({flip:doFlip,cut:cut,warp:cycleWarp,auto:toggleAuto,reset:resetFly,drop:()=>fs.drop(),lamps:()=>fs.lamps(),evac:()=>fs.evac(),lock:()=>fs.lock(),damper:()=>fs.damper(),launch:()=>fs.launch(),repair:()=>fs.repair()})[k]();
  const resetFly=()=>{if(!fs)return;fs.reset();thr.value=Math.round((fs.state.th||0)*100);auto.value=false;fg.value=fs.read();fl.value=fs.status()};

  /* how many pixels to slide the picture up so the ship sits in the free space between the header and the panel */
  function viewTarget(tb){
   if(photo.value)return 0;
   const hd=document.querySelector('.th'),dk=document.querySelector('.dock'),H=innerHeight;
   const top=hd?hd.getBoundingClientRect().bottom:0;
   let bot=H*.6;
   if(tb==='learn')bot=top+H*.34;
   else if(dk)bot=dk.getBoundingClientRect().top+22;
   return Math.max(0,H/2-(top+Math.max(bot,top+80))/2);
  }

  function tick(dt,time){
   if(!W)return;
   const slow=(fr++%4===0),tb=tab.value;
   if(play.value){u.value=Math.min(1,u.value+dt*spd.value/70);if(u.value>=1)play.value=false}
   let s;
   if(tb==='fly'&&fs){
    /* run the flight model in small sim steps so fast time warp stays accurate */
    let left=dt*WV[wi.value],n=0;
    while(left>1e-9&&fs.state.mode==='fly'&&n<400){const h=Math.min(left,fs.dtmax||120);fs.step(h);left-=h;n++}
    fs.tick(dt);
    if(fs.state.auto||fs.state.mode!=='fly')thr.value=Math.round(fs.state.th*100);
    auto.value=!!fs.state.auto;
    if(slow){fg.value=fs.read();fl.value=fs.status()}
    s=fs.view();
   }else{
    s=t.mission.at(u.value);
    if(s.i!==st.value.i)st.value=s;
    if(tb==='launch'&&slow)rd.value=t.mission.read(s);
   }
   const fv=60+((tb==='launch'||tb==='fly')?s.th*7:0);fov+=(fv-fov)*Math.min(1,dt*2);if(Math.abs(C.fov-fov)>.01){C.fov=fov;C.updateProjectionMatrix()}
   part.value=sel.value?t.parts.find(p=>p.id===sel.value):null;
   W.update(dt,time,{explode:tb==='world'?ex.value:0,state:s,tab:tb,sel:tb==='world'?sel.value:null});
   const L=tb==='learn';
   if(L)yaw+=dt*.12;else if((tb==='launch'||tb==='fly')&&!ptr.size)yaw+=dt*.04;
   if(spin&&!ptr.size)yaw+=dt*.3;
   const d=L?fitD():dist,pp=L?.18:pit;cur+=(d-cur)*Math.min(1,dt*3);
   C.position.set(Math.sin(yaw)*Math.cos(pp)*cur,Math.sin(pp)*cur,Math.cos(yaw)*Math.cos(pp)*cur-2);
   C.lookAt(0,0,-2);
   /* slide the picture into the free space above the panel */
   if(slow)vt=viewTarget(tb);
   vo+=(vt-vo)*Math.min(1,dt*6);
   if(vo>.5){C.setViewOffset(innerWidth,innerHeight,0,vo,innerWidth,innerHeight);vOn=true}
   else if(vOn){C.clearViewOffset();vOn=false}
  }

  onMounted(()=>{
   if(!t)return;
   HV.setTint(sec.c);HV.rig.visible=false;G.phase='topic';
   grp=new THREE.Group();HV.S.add(grp);W=t.create(THREE,grp);HV.topicTick=tick;
   HV.view={sec:sec.id,slug:r.params.slug,title:t.title,sector:sec.n,tab:()=>tab.value,
    get:()=>({tab:tab.value,part:sel.value||'',ex:Math.round(ex.value*100),u:Math.round(u.value*1000),cam:[Math.round(yaw*100),Math.round(pit*100),Math.round(dist*10)].join(',')}),
    set:o=>{if(o.tab&&tabs.indexOf(o.tab)>=0)tab.value=o.tab},
    partName:()=>{const p=sel.value&&t.parts.find(x=>x.id===sel.value);return p?p.n:''},
    photo:v=>{photo.value=v},spin:v=>{spin=v}};
   if(HV.share)HV.share.enter(shared);
   rd.value=t.mission.read(st.value);
   if(fs){thr.value=Math.round((fs.state.th||0)*100);fg.value=fs.read();fl.value=fs.status()}
  });
  onBeforeUnmount(()=>{
   HV.topicTick=null;G.phase='idle';HV.view=null;
   if(HV.share)HV.share.leave();
   if(W)W.dispose();if(grp)HV.S.remove(grp);
   C.clearViewOffset();
   C.position.set(0,0,HV.camZ());C.rotation.set(0,0,0);C.fov=60;C.updateProjectionMatrix();
  });
  return{sec,t,tab,tabs,ex,sel,u,play,spd,rd,st,part,down,move,up,wheel,toggle,scrub,jump,thr,wi,fl,fg,auto,mini,WL,setThr,cut,doFlip,toggleAuto,cycleWarp,resetFly,fs,ui,act};
 }
};

/* Wrapper: makes sure the topic is loaded before the topic page draws, so a direct link or refresh works too */
HV.Topic={
 components:{TopicView},
 template:`<div style="display:contents"><TopicView v-if="ok" :key="key"/><main class="tb nf" v-else-if="err"><p>{{err}}</p></main><main class="tb nf" v-else><p>Loading…</p></main></div>`,
 setup(){
  const r=VueRouter.useRoute(),ok=ref(false),err=ref(''),key=r.params.sector+'/'+r.params.slug;
  HV.load(r.params.sector,r.params.slug).then(()=>{ok.value=true}).catch(e=>{err.value=e.message});
  return{ok,err,key};
 }
};
})();
