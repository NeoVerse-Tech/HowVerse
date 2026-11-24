/* Sector page: lists a sector's topics, with a search bar for when the list grows.
   Each topic opens its own Learn / World / Launch flow. */
(function(){
const HV=window.HV=window.HV||{};
const {computed,onMounted,ref}=Vue;

HV.Sector={
 template:`
<div class="pg" :style="{'--c':s.c}">
 <button class="bk" @click="$router.push('/')">‹ Back</button>
 <div class="ic" style="margin-top:18px;font-size:46px">{{s.i}}</div>
 <h1>{{s.n}}</h1>
 <p class="tg">{{s.t}}</p>
 <button class="hv-pill" @click="HV.share.sector(s)">Share this sector</button>

 <div class="sq">
  <div class="sq-box" :class="{on:q}">
   <svg class="sq-ic" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
   <input type="search" v-model="q" :placeholder="'Search '+s.tp.length+' topics'" enterkeyhint="search" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" aria-label="Search topics">
   <button v-if="q" class="sq-x" @click="q=''" aria-label="Clear search">&times;</button>
  </div>
  <div class="sq-meta" v-if="q.trim()">{{list.length}} of {{s.tp.length}} {{list.length===1?'topic':'topics'}}</div>
 </div>

 <div class="row" :class="{live:live(x)}" v-for="x in list" :key="x[0]" @click="open(x)"><h3>{{x[0]}}</h3><p>{{x[1]}}</p><span>{{busy===HV.slug(x[0])?'Loading…':live(x)?'Open':'Coming soon'}}</span></div>

 <p class="more" v-if="q.trim()&&!list.length">No topic matches "{{q.trim()}}".<br><button class="sq-reset" @click="q=''">Clear search</button></p>
 <p class="more" v-if="err">{{err}}</p>
 <p class="more" v-if="!q.trim()">More topics will land here.</p>
</div>`,
 setup(){
  const r=VueRouter.useRoute(),rt=VueRouter.useRouter();
  const s=computed(()=>HV.sec(r.params.id)||HV.SECTORS[0]);
  onMounted(()=>HV.setTint(s.value.c));
  const busy=ref(''),err=ref(''),q=ref('');
  const live=HV.isLive;

  /* every typed word must appear in the topic name or its subtitle */
  const list=computed(()=>{
   const w=q.value.toLowerCase().split(/\s+/).filter(Boolean);
   if(!w.length)return s.value.tp;
   return s.value.tp.filter(x=>{const t=(x[0]+' '+x[1]).toLowerCase();return w.every(k=>t.indexOf(k)>=0)});
  });

  const open=x=>{
   if(!live(x)||busy.value)return;
   const sl=HV.slug(x[0]);busy.value=sl;err.value='';
   HV.load(s.value.id,sl).then(()=>{busy.value='';rt.push('/s/'+s.value.id+'/'+sl)}).catch(e=>{busy.value='';err.value=e.message});
  };
  return{s,live,open,busy,err,HV,q,list};
 }
};
})();
