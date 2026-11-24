/* Home screen: swipe sideways through sectors. Chips jump, cards peek, counter shows where you are.
   The card in focus runs a topic carousel (3 s). Hold to pause, tap a dot to jump, tap the panel to open. */
(function(){
const HV=window.HV=window.HV||{};
const G=HV.G;
const {ref,onMounted,onBeforeUnmount}=Vue;

const DELAY=3000;

/* the card order is shuffled once per visit, and kept while the tab stays open so swiping back and forth feels steady.
   It never opens on the same first card as the visit before. */
function order(){
 const all=HV.SECTORS;let ids=null;
 try{ids=JSON.parse(sessionStorage.getItem('hv_o')||'null')}catch(e){}
 if(!Array.isArray(ids)||ids.length!==all.length||!all.every(s=>ids.indexOf(s.id)>=0)){
  ids=all.map(s=>s.id);
  for(let i=ids.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]]}
  let last='';try{last=localStorage.getItem('hv_f')||''}catch(e){}
  if(ids.length>1&&ids[0]===last){const j=1+Math.floor(Math.random()*(ids.length-1));[ids[0],ids[j]]=[ids[j],ids[0]]}
  try{sessionStorage.setItem('hv_o',JSON.stringify(ids));localStorage.setItem('hv_f',ids[0])}catch(e){}
 }
 return ids.map(id=>all.find(s=>s.id===id));
}

HV.Home={
 template:`
<div class="home">
 <header class="top"><b>HOWVERSE</b><p>Learn how the future gets built.</p></header>

 <nav class="chips" ref="chips">
  <button v-for="(s,k) in S" :key="s.id" class="chip" :class="{on:k===idx}" :style="{'--c':s.c}" @click="goTo(k)">
   <span>{{s.i}}</span><em>{{s.n}}</em>
  </button>
 </nav>

 <div class="rail" ref="rail" @scroll.passive="onScroll" @pointerdown="touch">
  <section class="card" v-for="(s,k) in S" :key="s.id" :class="{on:k===idx}" :style="{'--c':s.c,'--k':Math.min(k,4)}">
   <div class="cin">
    <div class="ic">{{s.i}}</div>
    <h2>{{s.n}}</h2>
    <p class="tg">{{s.t}}</p>

    <div class="hc-fx" :class="{held:paused&&k===idx}"
     @pointerdown="hold" @pointerup="release" @pointercancel="release" @pointerleave="release"
     @click="openSector(s)">
     <transition name="hc-sw" mode="out-in">
      <div class="hc-fxi" :key="pos[k]">
       <div class="hc-fxt">
        <em class="hc-st" :class="{lv:live(cur(s,k))}">{{live(cur(s,k))?'Live':'Coming soon'}}</em>
        <span class="hc-fxn">{{pos[k]+1}} / {{s.tp.length}}</span>
       </div>
       <h3>{{cur(s,k)[0]}}</h3>
       <p>{{cur(s,k)[1]}}</p>
       <span class="hc-inv">{{live(cur(s,k))?'Ready to explore':'In the works'}} <b>&rarr;</b></span>
      </div>
     </transition>
     <i v-if="k===idx" class="hc-bar" :key="tick" :class="{run:!paused}"></i>
    </div>

    <div class="hc-dots">
     <button v-for="(x,j) in s.tp" :key="j" class="hc-dot" :class="{on:j===pos[k]}" :aria-label="x[0]" @click.stop="setPos(k,j)"><i></i></button>
    </div>

    <div class="hc-ideas" v-if="s.ideas&&s.ideas.length">
     <small>More ideas</small>
     <div class="hc-chips"><span v-for="i in s.ideas.slice(0,6)">{{i}}</span></div>
    </div>

    <button class="go" @click="openSector(s)">Open sector</button>
   </div>
  </section>
 </div>

 <footer class="foot">
  <div class="count"><b>{{pad(idx+1)}}</b> / {{pad(S.length)}}</div>
  <div class="hint" :class="{gone:touched}">Swipe to explore</div>
 </footer>
</div>`,

 setup(){
  const S=order(),rail=ref(null),chips=ref(null),idx=ref(0),touched=ref(false);
  const pos=ref(S.map(()=>0)),paused=ref(false),tick=ref(0);
  const pad=n=>String(n).padStart(2,'0'),live=HV.isLive;
  const reduced=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  const router=VueRouter.useRouter();

  let timer=0,holdAt=0;

  const cur=(s,k)=>s.tp[pos.value[k]]||s.tp[0];

  /* carousel: one timer, only for the card in focus */
  function schedule(){
   clearTimeout(timer);tick.value++;
   if(reduced||paused.value||document.hidden)return;
   timer=setTimeout(advance,DELAY);
  }
  function advance(){
   const k=idx.value,n=S[k].tp.length;
   if(n>1)pos.value[k]=(pos.value[k]+1)%n;
   schedule();
  }
  function setPos(k,j){pos.value[k]=j;schedule()}
  function hold(){holdAt=Date.now();paused.value=true;clearTimeout(timer)}
  function release(){if(!paused.value)return;paused.value=false;schedule()}
  const vis=()=>{document.hidden?clearTimeout(timer):schedule()};

  function openSector(s){
   if(holdAt&&Date.now()-holdAt>350){holdAt=0;return}  /* a long press was a pause, not a tap */
   router.push('/s/'+s.id);
  }

  const step=()=>{
   const c=rail.value.children[0];
   const gap=parseFloat(getComputedStyle(rail.value).columnGap)||14;
   return c.offsetWidth+gap;
  };

  const touch=()=>{touched.value=true;rail.value.classList.remove('peek')};

  function centerChip(k){
   const c=chips.value,el=c.children[k];if(!el)return;
   c.scrollTo({left:el.offsetLeft-(c.clientWidth-el.offsetWidth)/2,behavior:'smooth'});
  }

  function select(k){
   idx.value=k;HV.setTint(S[k].c);centerChip(k);
   navigator.vibrate&&navigator.vibrate(8);
   schedule();                                          /* new card starts a fresh 3 s */
  }

  function onScroll(){
   const f=rail.value.scrollLeft/step();
   G.scroll=-f*1.5+2;                                /* camera follows the swipe */
   const k=Math.max(0,Math.min(S.length-1,Math.round(f)));
   if(k!==idx.value)select(k);
  }

  function goTo(k){touch();rail.value.scrollTo({left:k*step(),behavior:'smooth'})}

  const intro=()=>{if(HV.introDone)return;HV.introDone=true;rail.value.classList.add('peek')};

  onMounted(()=>{
   const k=Number(sessionStorage.getItem('hv_i')||0);
   rail.value.scrollLeft=k*step();idx.value=k;HV.setTint(S[k].c);
   setTimeout(()=>centerChip(k),50);
   if(document.body.classList.contains('ready'))intro();
   else document.addEventListener('hv:ready',intro,{once:true});
   document.addEventListener('visibilitychange',vis);
   schedule();
  });
  onBeforeUnmount(()=>{
   clearTimeout(timer);
   sessionStorage.setItem('hv_i',idx.value);
   document.removeEventListener('hv:ready',intro);
   document.removeEventListener('visibilitychange',vis);
  });

  return{S,rail,chips,idx,touched,pos,paused,tick,pad,live,cur,onScroll,goTo,touch,setPos,hold,release,openSector};
 }
};
})();
