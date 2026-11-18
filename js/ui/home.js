/* Home screen: swipe sideways through sectors. Chips jump, cards peek, counter shows where you are. */
(function(){
const HV=window.HV=window.HV||{};
const G=HV.G;
const {ref,onMounted,onBeforeUnmount}=Vue;

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
    <ul class="tp"><li v-for="x in s.tp.slice(0,3)"><span>{{x[0]}}</span><em>{{live(x)?'Live':'Coming soon'}}</em></li></ul>
    <button class="go" @click="$router.push('/s/'+s.id)">Open sector</button>
   </div>
  </section>
 </div>

 <footer class="foot">
  <div class="count"><b>{{pad(idx+1)}}</b> / {{pad(S.length)}}</div>
  <div class="hint" :class="{gone:touched}">Swipe to explore</div>
 </footer>
</div>`,

 setup(){
  const S=HV.SECTORS,rail=ref(null),chips=ref(null),idx=ref(0),touched=ref(false);
  const pad=n=>String(n).padStart(2,'0'),live=x=>!!HV.topics[HV.slug(x[0])];

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
  });
  onBeforeUnmount(()=>{sessionStorage.setItem('hv_i',idx.value);document.removeEventListener('hv:ready',intro)});

  return{S,rail,chips,idx,touched,pad,live,onScroll,goTo,touch};
 }
};
})();
