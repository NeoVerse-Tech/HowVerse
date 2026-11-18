/* Intro animation. Starts instantly, hands over to the home screen when done. */
(function(){
const HV=window.HV=window.HV||{};
const G=HV.G;
const $=id=>document.getElementById(id);
const DURATION=4600;
const MSG=[[0,'Igniting the simulation'],[18,'Gathering stardust'],[40,'Spinning up the lab rings'],[62,'Loading eleven sectors'],[82,'Calibrating the museum'],[96,'Opening the doors']];

HV.runLoader=function(){
 const ld=$('ld'),bar=$('ldBar'),pc=$('ldPc'),msg=$('ldMsg'),skip=$('ldSkip');
 if(!ld)return;
 let t0=performance.now(),done=false,shown=-1;

 function tick(now){
  if(done)return;
  const x=Math.min(1,(now-t0)/DURATION);
  const e=x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2;
  G.p=e;
  const p=Math.round(e*100);
  if(p!==shown){shown=p;pc.textContent=p+'%';bar.style.width=p+'%';for(const m of MSG)if(p>=m[0])msg.textContent=m[1]}
  if(x<1)requestAnimationFrame(tick);else finish();
 }

 function finish(){
  if(done)return;done=true;
  G.p=1;pc.textContent='100%';bar.style.width='100%';msg.textContent='Welcome';
  ld.classList.add('flash');
  setTimeout(()=>{
   G.phase='burst';
   ld.classList.add('out');
   document.body.classList.remove('booting');
   document.body.classList.add('ready');          /* home cards animate in now */
   document.dispatchEvent(new Event('hv:ready'));
  },380);
  setTimeout(()=>ld.remove(),1900);
 }

 skip.addEventListener('click',finish);
 requestAnimationFrame(tick);
};
})();
