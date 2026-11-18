/* Wires everything together. Keep this file tiny. */
(function(){
const HV=window.HV;

const router=VueRouter.createRouter({
 history:VueRouter.createWebHashHistory(),
 routes:[
  {path:'/',component:HV.Home},
  {path:'/s/:id',component:HV.Sector},
  {path:'/s/:sector/:slug',component:HV.Topic}
 ]
});

const Root={template:`<router-view v-slot="{Component}"><transition><component :is="Component"/></transition></router-view>`};

Vue.createApp(Root).use(router).mount('#app');
HV.runLoader();
})();
