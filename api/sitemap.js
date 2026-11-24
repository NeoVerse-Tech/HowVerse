/* /sitemap.xml: the home page, every sector, and every topic listed in BUILT. Built from sectors.js, so it is always current. */
const fs=require('fs'),path=require('path');
const slug=n=>n.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
module.exports=(req,res)=>{
 const w={HV:{}};new Function('window',fs.readFileSync(path.join(process.cwd(),'js/data/sectors.js'),'utf8'))(w);
 const HV=w.HV,host=(req.headers['x-forwarded-host']||req.headers.host||'').split(',')[0],b='https://'+host,d=new Date().toISOString().slice(0,10);
 const u=[['/',1]];
 HV.SECTORS.forEach(s=>{u.push(['/'+s.id,.8]);s.tp.forEach(t=>{if(HV.BUILT.indexOf(slug(t[0]))>=0)u.push(['/'+s.id+'/'+slug(t[0]),.9])})});
 res.setHeader('Content-Type','application/xml; charset=utf-8');res.setHeader('Cache-Control','public, s-maxage=3600, stale-while-revalidate=86400');
 res.end('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+u.map(x=>' <url><loc>'+b+x[0]+'</loc><lastmod>'+d+'</lastmod><priority>'+x[1]+'</priority></url>').join('\n')+'\n</urlset>\n');
};
