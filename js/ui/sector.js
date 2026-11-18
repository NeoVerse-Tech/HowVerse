/* Sector page: lists a sector's topics. Each topic will later open its own Learn / World / Launch flow. */
(function(){
const HV=window.HV=window.HV||{};
const {computed,onMounted}=Vue;

HV.Sector={
 template:`
<div class="pg" :style="{'--c':s.c}">
 <button class="bk" @click="$router.push('/')">‹ Back</button>
 <div class="ic" style="margin-top:18px;font-size:46px">{{s.i}}</div>
 <h1>{{s.n}}</h1>
 <p class="tg">{{s.t}}</p>
 <div class="row" :class="{live:live(x)}" v-for="x in s.tp" :key="x[0]" @click="open(x)"><h3>{{x[0]}}</h3><p>{{x[1]}}</p><span>{{live(x)?'Open':'Coming soon'}}</span></div>
 <p class="more">More topics will land here.</p>
</div>`,
 setup(){
  const r=VueRouter.useRoute(),rt=VueRouter.useRouter();
  const s=computed(()=>HV.sec(r.params.id)||HV.SECTORS[0]);
  onMounted(()=>HV.setTint(s.value.c));
  const live=x=>!!HV.topics[HV.slug(x[0])];
  const open=x=>{if(live(x))rt.push('/s/'+s.value.id+'/'+HV.slug(x[0]))};
  return{s,live,open};
 }
};
})();
