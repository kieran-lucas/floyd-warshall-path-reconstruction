'use strict';
const assert=require('node:assert/strict');
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
console.log('PASS: '+checks+' algorithm-method queries on '+graphs+' graphs, including tie and negative-cycle checks.');
