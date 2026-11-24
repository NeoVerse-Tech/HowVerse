/* Howverse page server for Vercel. Runs for every sector and topic address (see vercel.json), reads your own index.html and js/data/sectors.js,
   and sends the page back with the right title, description, link preview, canonical address and a plain link list for crawlers.
   The app itself still runs in the browser as before. Nothing here needs editing when you add a topic: put it in sectors.js and BUILT. */
const fs=require('fs'),path=require('path');
let C=null;

function boot(){
 if(C)return C;
 const root=process.cwd(),w={HV:{}};
 new Function('window',fs.readFileSync(path.join(root,'js/data/sectors.js'),'utf8'))(w);
 const f=['app.html','index.html'].map(n=>path.join(root,n)).find(x=>fs.existsSync(x));
 C={html:fs.readFileSync(f,'utf8'),HV:w.HV};
 return C;
}
const slug=n=>n.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const SITE='Howverse',TAG='How the future gets built.';
const HOME_D='Swipe the frontiers of science and engineering, then open a live 3D model you can pull apart, launch and fly.';

function built(HV,sec){return sec.tp.filter(t=>HV.BUILT.indexOf(slug(t[0]))>=0).map(t=>({slug:slug(t[0]),n:t[0],d:t[1]}))}

function resolve(HV,q){
 if(!q.id&&!q.sector){
  const all=[];HV.SECTORS.forEach(s=>built(HV,s).forEach(t=>all.push(['/'+s.id+'/'+t.slug,t.n+': '+t.d])));
  return{path:'/',home:true,title:SITE+' · '+TAG,desc:HOME_D,h1:SITE,p:TAG+' '+HOME_D,crumbs:[],links:HV.SECTORS.map(s=>['/'+s.id,s.n+': '+s.t]).concat(all)};
 }
 if(q.id){
  const s=HV.SECTORS.find(x=>x.id===q.id);if(!s)return null;
  const tp=built(HV,s);
  return{path:'/'+s.id,title:s.n+' · '+SITE,desc:s.t+' '+(tp.length?tp.map(t=>t.n).join(', ')+'.':'')+' Open the live 3D models on '+SITE+'.',
   h1:s.n,p:s.t,crumbs:[[s.n,'/'+s.id]],links:tp.map(t=>['/'+s.id+'/'+t.slug,t.n+': '+t.d])};
 }
 const s=HV.SECTORS.find(x=>x.id===q.sector);if(!s)return null;
 const t=built(HV,s).find(x=>x.slug===q.slug);if(!t)return null;
 return{path:'/'+s.id+'/'+t.slug,title:t.n+' · '+SITE,desc:t.d+'. An interactive 3D model of the '+t.n.toLowerCase()+' you can pull apart, launch and fly, with the numbers behind it.',
  h1:t.n,p:t.d+'.',crumbs:[[s.n,'/'+s.id],[t.n,'/'+s.id+'/'+t.slug]],links:[['/'+s.id,'More in '+s.n]]};
}

function head(host,r){
 const u='https://'+host+r.path,img='https://'+host+'/brand/og-image.png';
 const site={'@type':'WebSite',name:SITE,url:'https://'+host+'/'};
 const ld={'@context':'https://schema.org','@graph':r.home?[
  site,{'@type':'Organization',name:SITE,url:'https://'+host+'/',logo:'https://'+host+'/brand/icon-512.png',image:img}
 ]:[
  {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:SITE,item:'https://'+host+'/'}].concat(r.crumbs.map((c,i)=>({'@type':'ListItem',position:i+2,name:c[0],item:'https://'+host+c[1]})))},
  {'@type':'WebPage',name:r.title,description:r.desc,url:u,isPartOf:site,primaryImageOfPage:img}]};
 return '<base href="/">\n<link rel="icon" href="/brand/favicon.svg" type="image/svg+xml"><link rel="icon" href="/brand/favicon.ico" sizes="48x48"><link rel="apple-touch-icon" href="/brand/apple-touch-icon.png"><link rel="manifest" href="/brand/site.webmanifest"><meta name="theme-color" content="#05060d">\n<title>'+esc(r.title)+'</title>\n<meta name="description" content="'+esc(r.desc)+'">\n<link rel="canonical" href="'+u+'">\n'
  +'<meta property="og:type" content="website"><meta property="og:site_name" content="'+SITE+'"><meta property="og:title" content="'+esc(r.title)+'"><meta property="og:description" content="'+esc(r.desc)+'"><meta property="og:url" content="'+u+'"><meta property="og:image" content="'+img+'"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">\n'
  +'<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="'+esc(r.title)+'"><meta name="twitter:description" content="'+esc(r.desc)+'"><meta name="twitter:image" content="'+img+'">\n'
  +'<script type="application/ld+json">'+JSON.stringify(ld).replace(/</g,'\\u003c')+'</script>\n';
}

function body(r){
 return '<noscript><main><h1>'+esc(r.h1)+'</h1><p>'+esc(r.p)+'</p><nav><a href="/">'+SITE+'</a>'+r.links.map(l=>' · <a href="'+l[0]+'">'+esc(l[1])+'</a>').join('')+'</nav><p>'+SITE+' needs JavaScript to show the 3D models.</p></main></noscript>';
}

module.exports=(req,res)=>{
 let c;try{c=boot()}catch(e){res.statusCode=500;res.end('Howverse page server could not start: '+e.message);return}
 const host=(req.headers['x-forwarded-host']||req.headers.host||'').split(',')[0],r=resolve(c.HV,req.query||{});
 let h=c.html;
 if(!r){
  /* unknown address: a real 404 for crawlers, and the app sends a person home */
  h=h.replace(/<head[^>]*>/i,m=>m+'\n<base href="/"><meta name="robots" content="noindex">');
  res.statusCode=404;res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','text/html; charset=utf-8');res.end(h);return;
 }
 h=h.replace(/<title>[\s\S]*?<\/title>/i,'').replace(/<meta\s+(name="description"|property="og:[^"]*"|name="twitter:[^"]*")[^>]*>/gi,'').replace(/<link\s+rel="(canonical|icon|shortcut icon|apple-touch-icon|manifest)"[^>]*>/gi,'').replace(/<meta\s+name="theme-color"[^>]*>/gi,'').replace(/<base\s[^>]*>/gi,'');
 h=h.replace(/<head[^>]*>/i,m=>m+'\n'+head(host,r));
 h=/<div id="app">\s*<\/div>/i.test(h)?h.replace(/<div id="app">\s*<\/div>/i,m=>m+body(r)):h.replace(/<\/body>/i,body(r)+'</body>');
 res.statusCode=200;res.setHeader('Content-Type','text/html; charset=utf-8');
 res.setHeader('Cache-Control','public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
 res.end(h);
};
