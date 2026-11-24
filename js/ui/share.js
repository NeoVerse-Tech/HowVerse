/* Share links and photo mode. Loaded before app.js. Needs scene.js (HV.snap) and, on a topic page, topic.js (HV.view).
   A link only ever carries a place in the app: a sector, or a topic with its tab, selected part, pull-apart, launch position and camera.
   Never anything about the visitor. Photo mode hides every control, lets you orbit and pinch to frame the shot, crops to Full, Square or Story,
   stamps the topic name on it, then shows a preview with Share (the picture and the link together), Save and Retake. It brings its own CSS. */
(function(){
const HV=window.HV=window.HV||{};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

const CSS=[
 '.hv-fab{position:fixed;right:12px;z-index:30;display:flex;flex-direction:column;gap:10px}',
 '.hv-fab button{width:42px;height:42px;border-radius:50%;border:1px solid rgba(255,255,255,.22);background:rgba(8,12,24,.62);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);color:#fff;display:flex;align-items:center;justify-content:center;padding:0;touch-action:manipulation}',
 '.hv-fab svg,.hvp svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',
 '.hv-pill{margin:6px 0 14px;border:1px solid var(--c,#5df2ff);background:rgba(8,12,24,.5);color:var(--c,#5df2ff);border-radius:999px;padding:9px 16px;font:600 13px/1 system-ui,sans-serif;touch-action:manipulation}',
 '#hvt{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(96px + env(safe-area-inset-bottom,0px));z-index:99999;background:rgba(8,14,28,.88);color:#fff;border-radius:10px;padding:9px 14px;font:600 13px/1.3 system-ui,sans-serif;max-width:82vw;text-align:center;display:none;word-break:break-all}',
 'body.hv-photo .th,body.hv-photo .dock,body.hv-photo .tabs,body.hv-photo .hv-fab{display:none!important}',
 '.hvp{position:fixed;inset:0;z-index:99990;pointer-events:none;font:700 12px/1 system-ui,sans-serif}',
 '.hvp-g{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);box-shadow:0 0 0 100vmax rgba(0,0,0,.6);border:1px dashed rgba(255,255,255,.45);display:none}',
 '.hvp-top{position:absolute;left:0;right:0;top:calc(12px + env(safe-area-inset-top,0px));display:flex;justify-content:center;gap:10px}',
 '.hvp-bar{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:center;align-items:center;gap:16px;padding:14px 0 calc(18px + env(safe-area-inset-bottom,0px))}',
 '.hvp button{pointer-events:auto;touch-action:manipulation;border:1.5px solid rgba(255,255,255,.65);background:rgba(8,14,28,.6);color:#fff;border-radius:999px;padding:11px 15px;font:inherit;letter-spacing:.06em}',
 '.hvp button.on{background:rgba(255,255,255,.9);color:#000}',
 '.hvp .hvp-sh{width:68px;height:68px;padding:0;background:rgba(255,255,255,.9);border:4px solid rgba(255,255,255,.35)}',
 '.hvp-fl{position:fixed;inset:0;background:#fff;opacity:0;z-index:99995;pointer-events:none}',
 '.hvs{position:fixed;inset:0;z-index:99996;background:rgba(3,5,12,.94);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:18px}',
 '.hvs img{max-width:100%;max-height:68vh;border-radius:12px;box-shadow:0 8px 40px rgba(0,0,0,.6)}',
 '.hvs div{display:flex;gap:12px}',
 '.hvs button{border:1.5px solid rgba(255,255,255,.65);background:rgba(255,255,255,.08);color:#fff;border-radius:999px;padding:13px 20px;font:700 14px/1 system-ui,sans-serif;touch-action:manipulation}',
 '.hvs button.pri{background:#fff;color:#000}',
 /* layout guard: long readout text (for example the last phase of a launch) must wrap, never push the panel wider than the screen */
 'html,body{overflow-x:hidden}',
 '.tpg,.tpg .tb{max-width:100vw;box-sizing:border-box}',
 '.tpg .dock{max-width:100vw;min-width:0;box-sizing:border-box;overflow-x:hidden}',
 '.tpg .dock .phase,.tpg .dock .phase p,.tpg .dock .grid>div,.tpg .dock .info,.tpg .dock .info p{min-width:0;max-width:100%;white-space:normal;overflow-wrap:anywhere}',
 '@media(max-width:700px){.tpg .dock .grid{grid-template-columns:repeat(3,minmax(0,1fr))}}'
].join('');
let st=null;function css(){if(st||!document.head)return;st=document.createElement('style');st.id='hv-share-css';st.textContent=CSS;document.head.appendChild(st)}
css();document.addEventListener('DOMContentLoaded',css);

const ICON={
 share:'<svg viewBox="0 0 24 24"><path d="M12 15V3M7 8l5-5 5 5M5 13v6a2 2 0 002 2h10a2 2 0 002-2v-6"/></svg>',
 cam:'<svg viewBox="0 0 24 24"><path d="M3 8a2 2 0 012-2h2l2-2h6l2 2h2a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><circle cx="12" cy="13" r="3.6"/></svg>'
};

/* ---------- small helpers ---------- */
let tT=0;
function toast(m){
 css();let n=document.getElementById('hvt');
 if(!n){n=document.createElement('div');n.id='hvt';document.body.appendChild(n)}
 n.textContent=m;n.style.display='block';clearTimeout(tT);tT=setTimeout(()=>{n.style.display='none'},2600);
}
const base=()=>location.origin;
function copy(u){
 try{return navigator.clipboard.writeText(u).then(()=>toast('Link copied'),()=>toast(u))}catch(e){toast(u)}
 return Promise.resolve();
}
function send(d){
 if(navigator.share)return navigator.share(d).catch(e=>{if(!e||e.name!=='AbortError')copy(d.url)});
 return copy(d.url);
}

/* ---------- links ---------- */
const linkSector=id=>base()+'/'+id;
function linkView(){
 const v=HV.view;if(!v)return base();
 const g=v.get(),k=g.tab;
 const s=k==='world'?['world',g.part||'-',g.ex,g.cam]:k==='launch'?['launch',g.u,g.cam]:[k,g.cam];
 return base()+'/'+v.sec+'/'+v.slug+'?v='+s.join('.').replace(/,/g,'.');
}
function sector(s){
 send({title:s.n+' · Howverse',text:s.n+' on Howverse: '+s.t,url:linkSector(s.id)});
}
function topic(){
 const v=HV.view;if(!v)return;
 const p=v.partName();
 send({title:v.title+' · Howverse',text:v.title+(p?' ('+p+')':'')+' on Howverse, live in 3D.',url:linkView()});
}

/* ---------- the two buttons on a topic page ---------- */
let fab=null;
function place(){
 if(!fab)return;const h=document.querySelector('.th');
 fab.style.top=((h?h.getBoundingClientRect().bottom:56)+10)+'px';
}
function enter(shared){
 css();leave();
 fab=document.createElement('div');fab.className='hv-fab';
 fab.innerHTML='<button data-a="share" aria-label="Share link">'+ICON.share+'</button><button data-a="photo" aria-label="Photo mode">'+ICON.cam+'</button>';
 fab.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.a==='share')topic();else openPhoto();
 });
 document.body.appendChild(fab);place();addEventListener('resize',place);
 if(shared)toast('Opened a shared view');
}
function leave(){
 closePhoto(true);
 if(fab&&fab.parentNode)fab.parentNode.removeChild(fab);fab=null;removeEventListener('resize',place);
}

/* ---------- photo mode ---------- */
const FR=[['Full',0],['Square',1],['Story',9/16]];
let ph=null,fr=0,lab=true,spin=false,prevTab=null,sheet=null,shot=null;

function guide(){
 if(!ph)return;const g=ph.querySelector('.hvp-g'),a=FR[fr][1];
 if(!a){g.style.display='none';return}
 const vw=innerWidth,vh=innerHeight;let w,h;
 if(vw/vh>a){h=vh;w=h*a}else{w=vw;h=w/a}
 g.style.display='block';g.style.width=w+'px';g.style.height=h+'px';
}
function openPhoto(){
 const v=HV.view;if(!v||ph)return;css();
 prevTab=v.tab();if(prevTab==='learn')v.set({tab:'world'});
 v.photo(true);document.body.classList.add('hv-photo');
 ph=document.createElement('div');ph.className='hvp';
 ph.innerHTML='<div class="hvp-g"></div>'
  +'<div class="hvp-top"><button data-a="label" class="on">Label on</button><button data-a="spin">Spin off</button></div>'
  +'<div class="hvp-bar"><button data-a="link">Link</button><button class="hvp-sh" data-a="shot" aria-label="Take photo"></button><button data-a="frame">Full</button><button data-a="done">Done</button></div>';
 ph.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;const a=b.dataset.a;
  if(a==='shot')take();
  else if(a==='link')topic();
  else if(a==='done')closePhoto();
  else if(a==='frame'){fr=(fr+1)%FR.length;b.textContent=FR[fr][0];guide()}
  else if(a==='label'){lab=!lab;b.classList.toggle('on',lab);b.textContent=lab?'Label on':'Label off'}
  else if(a==='spin'){spin=!spin;b.classList.toggle('on',spin);b.textContent=spin?'Spin on':'Spin off';v.spin(spin)}
 });
 document.body.appendChild(ph);guide();addEventListener('resize',guide);
 toast('Drag to orbit, pinch to zoom, then shoot');
}
function closePhoto(quiet){
 closeSheet();
 const v=HV.view;
 if(v&&ph){v.spin(false);v.photo(false);if(prevTab==='learn'&&!quiet)v.set({tab:'learn'})}
 document.body.classList.remove('hv-photo');
 if(ph&&ph.parentNode)ph.parentNode.removeChild(ph);ph=null;spin=false;lab=true;removeEventListener('resize',guide);
}

function take(){
 const v=HV.view,snap=HV.snap&&HV.snap(1.6);
 if(!v||!snap){toast('Could not take the picture');return}
 let fl=document.querySelector('.hvp-fl');
 if(!fl){fl=document.createElement('div');fl.className='hvp-fl';document.body.appendChild(fl)}
 fl.style.transition='none';fl.style.opacity='.85';setTimeout(()=>{fl.style.transition='opacity .35s';fl.style.opacity='0'},40);

 const a=FR[fr][1],sw=snap.width,sh=snap.height;let cw=sw,ch=sh;
 if(a){if(sw/sh>a){ch=sh;cw=Math.round(sh*a)}else{cw=sw;ch=Math.round(sw/a)}}
 const o=document.createElement('canvas');o.width=cw;o.height=ch;const g=o.getContext('2d');
 g.drawImage(snap,(sw-cw)/2,(sh-ch)/2,cw,ch,0,0,cw,ch);
 if(lab){
  const k=cw/390,acc=getComputedStyle(document.documentElement).getPropertyValue('--a').trim()||'#5df2ff';
  const gr=g.createLinearGradient(0,ch-150*k,0,ch);gr.addColorStop(0,'rgba(5,6,13,0)');gr.addColorStop(1,'rgba(5,6,13,.88)');
  g.fillStyle=gr;g.fillRect(0,ch-150*k,cw,150*k);
  g.fillStyle=acc;g.fillRect(18*k,ch-96*k,34*k,3*k);
  let fs=26*k;g.font='700 '+fs+'px system-ui,sans-serif';
  while(g.measureText(v.title).width>cw-36*k&&fs>12*k){fs-=k;g.font='700 '+fs+'px system-ui,sans-serif'}
  g.fillStyle='#fff';g.fillText(v.title,18*k,ch-62*k);
  const p=v.partName(),sub=v.sector+(p?' · '+p:'')+(v.tab()==='launch'?' · Launch':'');
  g.fillStyle='rgba(255,255,255,.78)';g.font='500 '+13*k+'px system-ui,sans-serif';g.fillText(sub,18*k,ch-38*k);
  g.fillStyle=acc;g.font='700 '+11*k+'px ui-monospace,Menlo,monospace';g.textAlign='right';g.fillText('HOWVERSE',cw-18*k,ch-20*k);g.textAlign='left';
 }
 o.toBlob(b=>{
  if(!b){toast('Could not take the picture');return}
  shot={b,url:URL.createObjectURL(b),name:'howverse-'+v.slug+'-'+new Date().toISOString().replace(/[-:T]/g,'').slice(0,14)+'.png',link:linkView(),title:v.title};
  showSheet();
 },'image/png');
}

function showSheet(){
 closeSheet(true);
 sheet=document.createElement('div');sheet.className='hvs';
 sheet.innerHTML='<img alt="Your photo"><div><button class="pri" data-a="s">Share</button><button data-a="v">Save</button><button data-a="r">Retake</button></div>';
 sheet.querySelector('img').src=shot.url;
 sheet.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;const a=b.dataset.a;
  if(a==='r')closeSheet();
  else if(a==='v')save();
  else if(a==='s')sharePic();
 });
 document.body.appendChild(sheet);
}
function closeSheet(keep){
 if(sheet&&sheet.parentNode)sheet.parentNode.removeChild(sheet);sheet=null;
 if(!keep&&shot){URL.revokeObjectURL(shot.url);shot=null}
}
function save(){
 if(!shot)return;const a=document.createElement('a');a.href=shot.url;a.download=shot.name;document.body.appendChild(a);a.click();
 setTimeout(()=>document.body.removeChild(a),800);toast('Saved to your downloads');
}
function sharePic(){
 if(!shot)return;let f=null;
 try{f=new File([shot.b],shot.name,{type:'image/png'})}catch(e){}
 const d={files:[f],title:shot.title+' · Howverse',text:shot.title+' on Howverse: '+shot.link};
 if(f&&navigator.canShare&&navigator.canShare({files:[f]})){navigator.share(d).catch(()=>{})}
 else{save();copy(shot.link)}
}

addEventListener('popstate',()=>{if(ph)closePhoto(true)});
HV.share={enter,leave,sector,topic,link:linkView,toast};
})();
