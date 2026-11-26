/* Floyd–Warshall: all shortest simple vertex paths, integer weights. */
(function(root){
const api=(function allPathsAPI(){
  'use strict';
  const matrix=(n,f)=>Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>f(i,j)));
  const sorted=s=>[...s].sort((a,b)=>a-b);
  function build(n,edges,{capture=false,storeHops=true}={}){
    if(!Number.isInteger(n)||n<1)throw new Error('Invalid vertex count');
    const adj=Array.from({length:n},()=>new Map());
    for(const [u,v,w] of edges){
      if(!Number.isInteger(u)||!Number.isInteger(v)||u<0||u>=n||v<0||v>=n||!Number.isSafeInteger(w))throw new Error('Invalid edge: integer weights required');
      adj[u].set(v,Math.min(adj[u].get(v)??Infinity,w));
    }
    const D=matrix(n,(i,j)=>i===j?0:Infinity);
    const H=storeHops?matrix(n,()=>new Set()):null, updates=[];
    for(let u=0;u<n;u++)for(const [v,w] of adj[u]){
      if(w<D[u][v])D[u][v]=w;
      if(H&&u!==v)H[u][v].add(v);
    }
    for(let k=0;k<n;k++)for(let i=0;i<n;i++)for(let j=0;j<n;j++){
      if(!Number.isFinite(D[i][k])||!Number.isFinite(D[k][j]))continue;
      const old=D[i][j],cand=D[i][k]+D[k][j];
      if(!Number.isSafeInteger(cand))throw new RangeError('Unsafe distance');
      if(cand>old)continue;
      if(cand<old)D[i][j]=cand;
      // The empty i-to-i segment has no first hop; endpoint splits
      // contribute no new choice for simple paths. Still update D above.
      if(!H||i===j||k===i||k===j)continue;
      const before=H[i][j],via=H[i][k];
      const after=cand<old?new Set(via):new Set([...before,...via]);
      const changed=after.size!==before.size||[...after].some(v=>!before.has(v));
      if(capture&&(cand<old||changed))updates.push({
        i,j,k,old,cand,kind:cand<old?'replace':'union',
        before:sorted(before),via:sorted(via),after:sorted(after)
      });
      H[i][j]=after;
    }
    const negative=(s,t)=>D.some((r,k)=>r[k]<0&&Number.isFinite(D[s][k])&&Number.isFinite(D[k][t]));
    return {n,D,H,adj,updates,negative};
  }
  function tight(model,u,t){
    if(!Number.isFinite(model.D[u][t]))return [];
    return sorted([...model.adj[u]].filter(([v,w])=>Number.isFinite(model.D[v][t])&&w+model.D[v][t]===model.D[u][t]).map(([v])=>v));
  }
  function enumerate(model,s,t,method='set',{capture=false}={}){
    const {n,D,H}=model;
    if(!Number.isInteger(s)||!Number.isInteger(t)||s<0||s>=n||t<0||t>=n)throw new RangeError('Invalid query');
    if(method!=='set'&&method!=='tight')throw new Error('Unknown method');
    if(method==='set'&&!H)throw new Error('Next-hop sets not stored');
    const paths=[],steps=[],route=[s],visited=new Set(route);
    let inspections=0;
    const status=model.negative(s,t)?'negative-cycle':!Number.isFinite(D[s][t])?'unreachable':'finite';
    const record=(kind,node,choices=[],candidate=null)=>{
      if(capture)steps.push({kind,node,choices:choices.slice(),candidate,route:route.slice(),found:paths.length,inspections});
    };
    if(status!=='finite'){record(status,s);return {status,distance:status==='negative-cycle'?-Infinity:Infinity,paths,steps,inspections};}
    function dfs(u){
      if(u===t){paths.push(route.slice());record('found',u);return;}
      const choices=method==='set'?sorted(H[u][t]):tight(model,u,t);
      inspections+=method==='set'?choices.length:model.adj[u].size;
      record('expand',u,choices);
      for(const v of choices){
        if(visited.has(v)){record('cycle',u,choices,v);continue;}
        // Every chosen edge must be tight; keep the guard to detect a broken set invariant.
        const w=model.adj[u].get(v);
        if(w===undefined||!Number.isFinite(D[v][t])||w+D[v][t]!==D[u][t])throw new Error('Non-tight next hop');
        visited.add(v);route.push(v);record('advance',v,[],v);dfs(v);
        route.pop();visited.delete(v);record('backtrack',u,choices,v);
      }
    }
    dfs(s);record('done',s);
    return {status,distance:D[s][t],paths,steps,inspections};
  }
  return {build,tight,enumerate};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.AllPathsEngine=api;
})(typeof window!=='undefined'?window:globalThis);
