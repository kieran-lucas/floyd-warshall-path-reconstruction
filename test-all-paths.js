'use strict';
const assert=require('node:assert/strict');
const {build,enumerate}=require('./all-paths.js');
const sig=p=>p.map(x=>x.join(',')).sort().join('|');
function brute(n,edges,s,t){
 const adj=Array.from({length:n},()=>new Map());
 for(const [u,v,w] of edges)adj[u].set(v,Math.min(adj[u].get(v)??Infinity,w));
 let best=Infinity,paths=[];
 function rec(u,p,w){
  if(u===t){if(w<best){best=w;paths=[];}if(w===best)paths.push(p);return;}
  for(const [v,c] of adj[u])if(!p.includes(v))rec(v,p.concat(v),w+c);
 }
 rec(s,[s],0);return {best,paths};
}
let pairs=0;
function verify(n,edges){
 const m=build(n,edges),d=build(n,edges,{storeHops:false});
 for(let s=0;s<n;s++)for(let t=0;t<n;t++){
  const a=enumerate(m,s,t),b=enumerate(d,s,t,'tight'),c=brute(n,edges,s,t);
  assert.equal(a.distance,c.best);assert.equal(b.distance,c.best);
  assert.equal(sig(a.paths),sig(c.paths));assert.equal(sig(b.paths),sig(c.paths));
  assert.equal(new Set(a.paths.map(p=>p.join(','))).size,a.paths.length);pairs++;
 }
}
const original=[[0,1,4],[0,2,15],[0,5,30],[1,2,3],[1,3,8],[2,3,2],[2,4,9],[3,4,2],[3,5,10],[4,5,3]];
const tie=original.map(([u,v,w])=>[u,v,({"0,2":7,"1,3":5,"2,4":4,"3,5":5})[[u,v].join(',')]??w]);
verify(6,original);verify(6,tie);
const t=enumerate(build(6,tie),0,5);
assert.equal(t.paths.length,8);assert.equal(t.distance,14);
verify(4,[[0,1,0],[1,0,0],[0,2,1],[1,2,1],[2,3,0],[3,2,0],[1,3,1]]);
let seed=7654321;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/2**32;};
for(let q=0;q<350;q++){
 const n=2+Math.floor(rand()*6),pot=Array.from({length:n},()=>Math.floor(rand()*7)-3),edges=[];
 for(let i=0;i<n;i++)for(let j=0;j<n;j++)if(i!==j&&rand()<.43)edges.push([i,j,Math.floor(rand()*5)+pot[j]-pot[i]]);
 verify(n,edges);
}
const neg=build(5,[[0,1,1],[1,2,-3],[2,1,1],[2,3,1],[0,4,7]]);
assert.equal(enumerate(neg,0,3).status,'negative-cycle');
assert.equal(enumerate(neg,0,4).distance,7);
assert.equal(enumerate(neg,4,0).status,'unreachable');
console.log('PASS: '+pairs+' pairs across 353 graphs, plus negative-cycle checks.');
