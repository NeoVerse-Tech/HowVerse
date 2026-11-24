/* Wires everything together. Keep this file tiny. */
(function(){
const HV=window.HV;

/* old links like /#/s/mind/orbital-data-center become /mind/orbital-data-center before the router starts */
if(location.hash.indexOf('#/')===0)history.replaceState(null,'',location.hash.slice(1).replace(/^\/s\//,'/'));

const router=VueRouter.createRouter({
 history:VueRouter.createWebHistory(),
 routes:[
  {path:'/',component:HV.Home},
  {path:'/:id([a-z0-9-]+)',component:HV.Sector,beforeEnter:to=>HV.sec(to.params.id)?true:'/'},
  {path:'/:sector([a-z0-9-]+)/:slug([a-z0-9-]+)',component:HV.Topic,beforeEnter:to=>HV.sec(to.params.sector)?true:'/'},
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
