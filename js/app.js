/* Wires everything together. Keep this file tiny. */
(function(){
const HV=window.HV;

const router=VueRouter.createRouter({
 history:VueRouter.createWebHashHistory(),
 routes:[
  {path:'/',component:HV.Home},
  {path:'/s/:id',component:HV.Sector,beforeEnter:to=>HV.sec(to.params.id)?true:'/'},
  {path:'/s/:sector/:slug',component:HV.Topic,beforeEnter:to=>HV.sec(to.params.sector)?true:'/'},
  {path:'/:rest(.*)',redirect:'/'}
 ]
});

/* the tab title follows the page, so a shared link looks right in the browser and in history */
router.afterEach(to=>{
 const s=HV.sec(to.params.id||to.params.sector),tp=to.params.slug&&HV.topics[to.params.slug];
 document.title=tp?tp.title+' · Howverse':s?s.n+' · Howverse':'Howverse';
});

const Root={template:`<router-view v-slot="{Component}"><transition><component :is="Component"/></transition></router-view>`};

Vue.createApp(Root).use(router).mount('#app');
HV.runLoader();
})();
