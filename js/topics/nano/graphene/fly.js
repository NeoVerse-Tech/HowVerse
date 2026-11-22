/* Graphene · Fly. You run the nanoindenter. Needs mission.js loaded first (it loads core.js's model through T).
   You set the piezo extension with the slider; the piezo follows at a limited speed. The tip touches the drum after a 40 nm gap,
   the cantilever bends, and the sheet pushes back. Break the sheet with the sharp tip. The blunt tip cannot reach the breaking force
   inside the piezo range. Simplified: a perfect membrane, one point load, no thermal drift, no tip wear. */
(function(){
const T=window.HV.T.graphene,D=T.DES,clamp=T.clamp,f=T.f,fF=T.fF,nm=T.nm;
const ZM=D.Zmax,ZC=D.Zc,SLEW=D.slew,AUTO_RATE=22e-9;                    /* piezo range, start gap, speed limit, Auto push rate, m and m/s */
const PKS=T.peak(D.Rs);

T.createFly=function(){
 const st={mode:'fly',auto:false,th:0,lamp:false};                      /* lamp = blunt tip fitted */
 let Zp,broken,pk,E,tsim,warn;

 const tipR=()=>st.lamp?D.Rb:D.Rs;
 function refresh(){E=broken?T.evalZ(Zp,tipR(),true,pk):T.evalZ(Zp,tipR(),false)}

 function reset(){
  Zp=0;broken=false;pk=null;tsim=0;warn=0;
  st.mode='fly';st.auto=false;st.th=0;st.lamp=false;refresh();
 }

 /* Auto: the reference plan. Fit the sharp tip (retracting first if needed), then push at a steady pace until the sheet breaks. */
 function autoStep(dt){
  if(broken)return;
  if(st.lamp){
   if(Zp>ZC-5e-9)st.th=0;else st.lamp=false;
   return;
  }
  st.th=clamp(st.th+AUTO_RATE/ZM*dt,0,1);
 }

 function step(dt){
  if(st.mode!=='fly')return;
  tsim+=dt;if(warn>0)warn-=dt;
  if(st.auto)autoStep(dt);
  const Zt=st.th*ZM,mv=clamp(Zt-Zp,-SLEW*dt,SLEW*dt);
  Zp+=mv;
  refresh();
  if(!broken&&E.F>=T.Fbreak(tipR())*.9999){
   broken=true;pk=T.peak(tipR());st.mode='won';st.auto=false;refresh();
  }
 }

 function status(){
  const R=tipR(),Rn=f(R*1e9,R<30e-9?1:0),gap=Math.max(0,ZC-Zp);
  if(st.mode==='won')return{n:'Sheet broken',f:'It broke at '+fF(pk.F)+' and a depth of '+f(pk.d*1e9)+' nm with the '+Rn+' nm tip. That is a peak stress under the tip of about '+f(T.sigF)+' N/m, or '+f(T.S3/1e9)+' GPa over the thickness. The cantilever was bent '+nm(pk.defl)+' by then. Press Reset for another sheet.',k:'ok'};
  if(warn>0)return{n:'Retract first',f:'The tip can only be changed while it is clear of the sheet. Press Retract, wait for the piezo to pull back, then change it.',k:'warn'};
  if(st.lamp&&Zp>=ZM-1e-9)return{n:'Out of range',f:'The piezo is at its limit and the sheet is still whole. The blunt tip spreads the load and needs '+fF(T.Fbreak(D.Rb))+' and '+f(T.peak(D.Rb).Z*1e9)+' nm of travel, more than the '+f(ZM*1e9)+' nm available. Retract and fit the sharp tip.',k:'bad'};
  if(E.d<=0)return{n:'Approaching',f:'The '+Rn+' nm tip is '+f(gap*1e9)+' nm above the sheet and the cantilever is straight. Raise the slider to lower it. The piezo moves at no more than '+f(SLEW*1e9)+' nm/s.',k:''};
  if(E.util>.85)return{n:'Close to the limit',f:'The stress under the tip is '+f(E.util*100)+'% of the strength. The force is '+fF(E.F)+' and the cantilever is bent '+nm(E.defl)+'. A little further and the sheet will break.',k:'warn'};
  return{n:'In contact',f:'The tip is '+f(E.d*1e9)+' nm into the sheet with '+fF(E.F)+' of force. The piezo has moved '+f((Zp-ZC)*1e9)+' nm past contact, but the cantilever has bent '+nm(E.defl)+' of that, so the tip moved less. Stress under the tip: '+f(E.util*100)+'% of the strength.',k:''};
 }

 function read(){
  return T.read(Object.assign({},E,{th:0}));
 }

 reset();
 return{
  ui:{label:'Piezo',min:0,max:100,btns:[
   {k:'cut',l:'Retract'},
   {k:'lamps',l:'Tip',lf:()=>st.lamp?'Tip: blunt 60 nm':'Tip: sharp 16.5 nm',on:()=>st.lamp},
   {k:'warp'},{k:'auto'},{k:'reset'}]},
  warp:[.1,.5,1,3],warpL:['0.1×','0.5×','1×','3×'],dtmax:.05,
  state:st,
  setThrottle(x){st.th=clamp(x,0,1);st.auto=false},
  toggleAuto(){if(st.mode==='fly')st.auto=!st.auto},
  lamps(){
   if(st.mode!=='fly')return;
   if(Zp>ZC-5e-9){warn=4;return}
   st.lamp=!st.lamp;st.auto=false;refresh();
  },
  reset,step,tick(){},read,status,
  view(){return Object.assign({},E,{i:0,n:'Fly',f:'',th:0,t:tsim})}
 };
};
})();
