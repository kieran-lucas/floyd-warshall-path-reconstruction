/* Matrix-first Floyd–Warshall laboratory: independent engine. */
(function(root){const api=(function matrixEngine(){
 const BASE=[[0,1,4],[0,2,15],[0,5,30],[1,2,3],[1,3,8],[2,3,2],[2,4,9],[3,4,2],[3,5,10],[4,5,3]];
 const TIE=BASE.map(([u,v,w])=>[u,v,({"0,2":7,"1,3":5,"2,4":4,"3,5":5})[u+','+v]??w]);
 const DATA={tie:{name:'Nhiều đường đồng hạng',edges:TIE},unique:{name:'Đường duy nhất 1 → 6',edges:BASE},zero:{name:'Chu trình trọng số 0',edges:[[0,1,2],[0,2,2],[1,2,0],[2,1,0],[1,3,3],[2,3,3],[3,4,2],[3,5,4],[4,5,2]]}};
 const mat=(n,f)=>Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>f(i,j)));
 const sorted=a=>[...new Set(a)].sort((a,b)=>a-b);
 const fmt=v=>v===Infinity?'∞':v===-Infinity?'−∞':String(v);
 const vertex=v=>v===-1?'—':String(v+1);
 const setText=a=>a.length?'{'+a.map(vertex).join(',')+'}':'∅';
 const routeText=a=>a.map(vertex).join(' → ');
 function build(n,edges){
  const W=mat(n,()=>Infinity);
  for(const [u,v,w] of edges)W[u][v]=Math.min(W[u][v],w);
  const D=mat(n,(i,j)=>i===j?Math.min(0,W[i][j]):W[i][j]);
  const P=mat(n,(i,j)=>i!==j&&Number.isFinite(W[i][j])?i:-1);
  const N=mat(n,(i,j)=>i===j?i:Number.isFinite(W[i][j])?j:-1);
  const M=mat(n,()=>-1),H=mat(n,(i,j)=>i!==j&&Number.isFinite(W[i][j])?[j]:[]);
  const snap=()=>({D:D.map(r=>r.slice()),P:P.map(r=>r.slice()),N:N.map(r=>r.slice()),M:M.map(r=>r.slice()),H:H.map(r=>r.map(a=>a.slice()))});
  const frames=[{state:snap(),step:0,changes:0,ties:0,event:null}];
  let changes=0,ties=0;
  for(let k=0;k<n;k++)for(let i=0;i<n;i++)for(let j=0;j<n;j++){
   const old=D[i][j],left=D[i][k],right=D[k][j],candidate=left+right;
   const finite=Number.isFinite(candidate),improved=finite&&candidate<old;
   const prev={P:P[i][j],N:N[i][j],M:M[i][j],H:H[i][j].slice()};
   const read={P:P[k][j],N:N[i][k],M:k,H:H[i][k].slice()};
   if(improved){D[i][j]=candidate;P[i][j]=read.P;N[i][j]=read.N;M[i][j]=k;changes++;}
   if(finite&&candidate<=old&&i!==j&&k!==i&&k!==j)H[i][j]=improved?read.H.slice():sorted([...prev.H,...read.H]);
   const expanded=H[i][j].some(v=>!prev.H.includes(v))||H[i][j].length!==prev.H.length;
   const tied=!improved&&expanded;if(tied)ties++;
   frames.push({step:frames.length,changes,ties,event:{i,j,k,old,left,right,candidate,improved,tied,prev,read},state:snap()});
  }
  const final=frames.at(-1).state;
  const negative=(s,t)=>final.D.some((r,k)=>r[k]<0&&Number.isFinite(final.D[s][k])&&Number.isFinite(final.D[k][t]));
  return {n,edges,W,frames,final,negative};
 }
 function path(model,s,t,method,stage=model.final){
  const {n,W}=model,{D,P,N,M,H}=stage;
  const frames=[],paths=[],reads=[];
  const add=(message,route=[],lookups=[],extra={})=>frames.push({message,route:route.slice(),lookups:lookups.map(x=>x.slice()),found:paths.length,...extra});
  const d=D[s][t];
  if(stage===model.final&&model.negative(s,t)){add('Cặp đỉnh chịu ảnh hưởng chu trình âm. Không có cực tiểu hữu hạn.',[],[['D',s,t]]);return {paths,frames,distance:-Infinity,status:'negative-cycle'};}
  if(!Number.isFinite(d)){add('D['+vertex(s)+']['+vertex(t)+'] = ∞. Không tồn tại đường đi.',[],[['D',s,t]]);return {paths,frames,distance:Infinity,status:'unreachable'};}
  add('Bắt đầu: D['+vertex(s)+']['+vertex(t)+'] = '+fmt(d)+'.', [s], [['D',s,t]]);
  function finish(r){paths.push(r.slice());add('Tìm được '+routeText(r)+'; tổng trọng số '+fmt(d)+'.',r,[],{kind:'found'});}
  if(s===t)finish([s]);
  else if(method==='P'){
   let u=t;const reverse=[t],seen=new Set(reverse);
   while(u!==s){const v=P[s][u];if(v<0||seen.has(v))throw Error('Invalid predecessor');reads.push(['P',s,u]);reverse.push(v);seen.add(v);add('P['+vertex(s)+']['+vertex(u)+'] = '+vertex(v)+'. Đi ngược về '+vertex(v)+'.',reverse.slice().reverse(),[['P',s,u]],{kind:'read',sequence:reverse.map(vertex).join(' ← ')});u=v;}
   finish(reverse.reverse());
  }else if(method==='N'){
   let u=s;const r=[s],seen=new Set(r);
   while(u!==t){const v=N[u][t];if(v<0||seen.has(v))throw Error('Invalid next hop');reads.push(['N',u,t]);r.push(v);seen.add(v);add('N['+vertex(u)+']['+vertex(t)+'] = '+vertex(v)+'. Đi tới '+vertex(v)+'.',r,[['N',u,t]],{kind:'read'});u=v;}
   finish(r);
  }else if(method==='M'){
   const r=[s],active=new Set();
   function split(i,j,depth){
    if(i===j)return;
    const key=i+','+j;if(active.has(key))throw Error('Invalid intermediate recursion');active.add(key);
    const k=M[i][j];reads.push(['M',i,j]);add('M['+vertex(i)+']['+vertex(j)+'] = '+vertex(k)+(k<0?'. Đoạn trực tiếp.':'. Chia thành ('+vertex(i)+','+vertex(k)+') và ('+vertex(k)+','+vertex(j)+').'),r,[['M',i,j]],{kind:'split',focus:[i,j,...(k<0?[]:[k])],depth});
    if(k<0){r.push(j);add('Ghép cạnh '+vertex(i)+' → '+vertex(j)+'.',r,[['W',i,j]],{kind:'advance'});}
    else {split(i,k,depth+1);split(k,j,depth+1);}
    active.delete(key);
   }
   split(s,t,0);finish(r);
  }else{
   const r=[s],seen=new Set(r);
   function dfs(u){
    if(u===t){finish(r);return;}
    const choices=method==='H'?H[u][t]:Array.from({length:n},(_,v)=>v).filter(v=>Number.isFinite(W[u][v]));
    add(method==='H'?'H['+vertex(u)+']['+vertex(t)+'] = '+setText(choices)+'. Thử từng đỉnh trong tập.':'Xét các cạnh gốc đi ra từ '+vertex(u)+'.',r,[[method==='H'?'H':'D',u,t]],{kind:'expand',choices:choices.slice()});
    for(const v of choices){
     const tight=Number.isFinite(W[u][v])&&Number.isFinite(D[v][t])&&W[u][v]+D[v][t]===D[u][t];
     const look=method==='H'?[['H',u,t],['W',u,v]]:[['W',u,v],['D',u,t],['D',v,t]];
     if(method==='T')add('Cạnh '+vertex(u)+' → '+vertex(v)+': '+fmt(W[u][v])+' + '+fmt(D[v][t])+(tight?' = ':' ≠ ')+fmt(D[u][t])+(tight?' ✓ cạnh chặt.':' ✗ loại.'),r,look,{kind:'check',candidate:[u,v],tight});
     if(!tight)continue;
     if(seen.has(v)){add('Bỏ qua '+vertex(v)+': đã có trên nhánh hiện tại.',r,look,{kind:'cycle'});continue;}
     seen.add(v);r.push(v);add('Đi tới '+vertex(v)+'.',r,look,{kind:'advance'});dfs(v);r.pop();seen.delete(v);add('Quay lui '+vertex(v)+' → '+vertex(u)+'.',r,look,{kind:'backtrack'});
    }
   }
   dfs(s);
  }
  add('Hoàn thành. '+paths.length+' đường '+(method==='H'||method==='T'?'ngắn nhất đơn':'được chọn')+'.',paths[0]||[],[['D',s,t]],{kind:'done'});
  return {paths,frames,distance:d,status:'finite',reads};
 }
 return {DATA,build,path,fmt,vertex,setText,routeText};
})();if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MatrixLabEngine=api;})(typeof window!=='undefined'?window:globalThis);
