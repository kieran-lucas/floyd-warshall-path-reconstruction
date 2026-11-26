'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const E=require('./matrix-engine.js');
const sig=a=>a.map(x=>x.join(',')).sort().join('|');
let checks=0,graphs=0;
function verify(n,edges){
 const m=E.build(n,edges);graphs++;
 for(let s=0;s<n;s++)for(let t=0;t<n;t++){
  let best=Infinity,p=[];
  function rec(u,r,w){
   if(u===t){if(w<best){p=[];best=w;}if(w===best)p.push(r);return;}
   for(let v=0;v<n;v++)if(Number.isFinite(m.W[u][v])&&!r.includes(v))rec(v,r.concat(v),w+m.W[u][v]);
  }
  rec(s,[s],0);
  for(const k of ['P','N','M','H','T']){
   const x=E.path(m,s,t,k);
   assert.equal(x.distance,best);
   if(k==='H'||k==='T'){assert.equal(sig(x.paths),sig(p));}
   else if(p.length){assert.equal(x.paths.length,1);assert.ok(p.some(q=>q.join(',')===x.paths[0].join(',')));}
   else assert.equal(x.paths.length,0);
   checks++;
  }
 }
}
for(const d of Object.values(E.DATA))verify(6,d.edges);
let seed=79342;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/2**32;};
for(let i=0;i<200;i++){
 const n=2+Math.floor(rand()*6),es=[];
 for(let u=0;u<n;u++)for(let v=0;v<n;v++)if(u!==v&&rand()<.45)es.push([u,v,1+Math.floor(rand()*8)]);
 verify(n,es);
}
for(let i=0;i<150;i++){
 const n=2+Math.floor(rand()*6),es=[],pot=Array.from({length:n},()=>Math.floor(rand()*9)-4);
 for(let u=0;u<n;u++)for(let v=0;v<n;v++)if(u!==v&&rand()<.4)es.push([u,v,Math.floor(rand()*5)+pot[v]-pot[u]]);
 verify(n,es);
}
const tie=E.build(6,E.DATA.tie.edges);
assert.equal(tie.frames.length,217);assert.equal(tie.frames.at(-1).ties,7);assert.equal(E.path(tie,0,5,'H').paths.length,8);
const neg=E.build(4,[[0,1,1],[1,2,-3],[2,1,1],[0,3,7]]);
assert.equal(E.path(neg,0,2,'H').status,'negative-cycle');assert.equal(E.path(neg,0,3,'T').distance,7);
const html=fs.readFileSync(__dirname+'/laboratory.html','utf8');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
assert.equal(new Set(ids).size,ids.length);
const staticTables=[...html.matchAll(/<table class="mlMatrix"[\s\S]*?<\/table>/g)];
assert.equal(staticTables.length,6);
for(const t of staticTables)assert.equal((t[0].match(/<td(?:>| )/g)||[]).length,36);
const el=Object.fromEntries(ids.map(id=>[id,{id,value:'',innerHTML:'',textContent:'',checked:false,hidden:false,disabled:false,setAttribute(k,v){this[k]=v;}}]));
const doc={readyState:'complete',getElementById(id){assert.ok(el[id],id);return el[id];}};
vm.runInNewContext(fs.readFileSync(__dirname+'/matrix-lab.js','utf8'),{document:doc,MatrixLabEngine:E,console});
assert.equal(el.mlError.textContent,'');
let uiChecks=0;const ok=(v,m)=>{assert.ok(v,m);uiChecks++;};
const tables=()=>[el.mlMatrices,el.mlExtraMatrices].reduce((n,e)=>n+(e.innerHTML.match(/<table class="mlMatrix"/g)||[]).length,0);
const cells=()=>[el.mlMatrices,el.mlExtraMatrices].reduce((n,e)=>n+(e.innerHTML.match(/<td /g)||[]).length,0);
ok(tables()===6&&cells()===216,'six matrices');ok(el.mlCrossCheck.innerHTML.includes('thống nhất'),'agreement');ok(el.mlCount.textContent===8,'eight paths');
const click=(e,k,v)=>e.onclick({target:{closest(){return{dataset:{[k]:v}};}}});
for(const d of ['tie','unique','zero']){
 el.mlDataset.value=d;el.mlDataset.onchange();
 for(const k of ['P','N','M','H','T']){
  click(el.mlMethods,'method',k);
  for(let i=0;i<6;i++)for(let j=0;j<6;j++){
   click(el.mlMatrices,'cell','D,'+i+','+j);el.mlLast.onclick();
   ok(tables()===6&&cells()===216,'full trace matrices');ok(el.mlCrossCheck.innerHTML.includes('thống nhất'),'agreement');
  }
 }
 el.mlBuild.onclick();el.mlFilter.checked=false;el.mlFilter.onchange();
 for(let i=0;i<=216;i++){el.mlRange.value=String(i);el.mlRange.oninput();ok(cells()===216,'full build matrices');}
 el.mlNextTie.onclick();ok(el.mlExplain.innerHTML.includes('ĐỒNG HẠNG')||el.mlNextTie.disabled,'jump tie');
 el.mlAll.checked=false;el.mlAll.onchange();ok(tables()===2&&el.mlExtraWrap.hidden,'collapse');el.mlAll.checked=true;el.mlAll.onchange();el.mlTrace.onclick();
}
console.log('PASS: '+checks+' algorithm-method queries on '+graphs+' graphs; '+uiChecks+' DOM-harness checks; static matrices and negative-cycle guards.');
