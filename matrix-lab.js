/* Matrix-first laboratory UI. */
(function(){'use strict';function boot(){try{(function initMatrixLab(doc,E){
 'use strict';
 const $=id=>doc.getElementById(id), n=6, {fmt,vertex,setText,routeText}=E;
 const names={D:'Khoảng cách',W:'Trọng số gốc',P:'Predecessor',N:'Next-Hop',M:'Intermediate',H:'Next-Hop Set',T:'Tight Edges'};
 const defs={D:'D[i][j] = tổng trọng số ngắn nhất hiện biết.',W:'W[i][j] = trọng số cạnh trực tiếp; ∞ nếu không có cạnh (kể cả đường chéo).',P:'P[i][j] = đỉnh ngay trước j; — nếu không có predecessor.',N:'N[i][j] = đỉnh ngay sau i; N[i][i] = i.',M:'M[i][j] = đỉnh chia đường ở lần cải thiện cuối; — nếu không cần chia hoặc không có đường.',H:'H[i][j] = tập bước đầu tiên đồng hạng; ∅ nếu không có bước tiếp.',T:'Chỉ dùng W và D. Kiểm tra W[u][v] + D[v][t] = D[u][t].'};
 let dataset='tie',model=E.build(n,E.DATA[dataset].edges),mode='trace',method='H',s=0,t=5,showAll=true,filter=true,buildPos=0,tracePos=0,result,selected=-1,timer=null,frames=[];
 const changeFilter=()=>{frames=filter?model.frames.filter((x,i)=>i===0||i===model.frames.length-1||x.event.improved||x.event.tied):model.frames;};
 const pos=()=>mode==='build'?buildPos:tracePos;
 const max=()=>mode==='build'?frames.length-1:result.frames.length-1;
 const num=x=>Number(x);
 for(const id of ['mlSource','mlTarget'])$(id).innerHTML=Array.from({length:n},(_,i)=>'<option value="'+i+'">'+vertex(i)+'</option>').join('');
 function recalc(end=false){result=E.path(model,s,t,method);tracePos=end?result.frames.length-1:0;selected=-1;}
 function stop(){if(timer!==null){clearInterval(timer);timer=null;} $('mlPlay').textContent='▶ Phát';}
 function resetDataset(){stop();dataset=$('mlDataset').value;model=E.build(n,E.DATA[dataset].edges);changeFilter();buildPos=0;recalc(mode==='trace');render();}
 function setPosition(i){i=Math.max(0,Math.min(max(),i));if(mode==='build')buildPos=i;else tracePos=i;selected=-1;render();if(i===max())stop();}
 function play(){if(timer!==null){stop();return;}if(pos()===max())setPosition(0);if(!max())return;timer=setInterval(()=>setPosition(pos()+1),num($('mlSpeed').value));$('mlPlay').textContent='Ⅱ Tạm dừng';}
 function setMode(v){stop();mode=v;selected=-1;if(v==='trace')recalc(true);render();}
 function setMethod(v){stop();method=v;recalc(true);render();}
 function query(u,v,k=method){stop();s=u;t=v;method=k;recalc(false);render();}
 const xy=[[58,142],[174,54],[310,54],[310,228],[465,228],[607,142]];
 const styles={'0,1':{l:[106,83]},'0,2':{q:[150,-55],l:[157,19]},'0,5':{q:[326,420],l:[334,287]},'1,2':{l:[241,34]},'2,1':{q:[243,125],l:[241,91]},'1,3':{l:[220,148]},'2,3':{l:[328,141]},'2,4':{l:[402,120]},'3,4':{l:[388,249]},'3,5':{q:[500,105],l:[488,145]},'4,5':{l:[540,207]}};
 function graph(route=[],focus=[],mid=-1,candidate=null,tight=false){
  const keys=new Set(route.slice(1).map((v,i)=>route[i]+','+v)),high=new Set([...route,...focus]);
  let svg='<defs><marker id="mlArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0L8 4L0 8z" fill="#a8b1bf"/></marker><marker id="mlBlue" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0L10 5L0 10z" fill="#315bc3"/></marker><marker id="mlOrange" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0L10 5L0 10z" fill="#a65a12"/></marker></defs>';
  for(const [u,v,w] of model.edges){
   const a=xy[u],b=xy[v],g=styles[u+','+v]||{l:[(a[0]+b[0])/2,(a[1]+b[1])/2-10]},q=g.q||b,z=g.q||a;
   const d1=Math.hypot(q[0]-a[0],q[1]-a[1]),d2=Math.hypot(z[0]-b[0],z[1]-b[1]);
   const start=[a[0]+23*(q[0]-a[0])/d1,a[1]+23*(q[1]-a[1])/d1],end=[b[0]+26*(z[0]-b[0])/d2,b[1]+26*(z[1]-b[1])/d2];
   const active=keys.has(u+','+v),check=candidate&&candidate[0]===u&&candidate[1]===v;
   svg+='<path class="edge '+(check&&!tight?'mlRejected':active||check?'active':'')+'" d="M'+start.join(',')+' '+(g.q?'Q'+g.q.join(','):'L')+' '+end.join(',')+'" marker-end="url(#'+(check&&!tight?'mlOrange':active||check?'mlBlue':'mlArrow')+')"/>';
   svg+='<text class="weight '+(active||check?'active':'')+'" x="'+g.l[0]+'" y="'+g.l[1]+'">'+w+'</text>';
  }
  for(let i=0;i<n;i++){const [x,y]=xy[i],c=i===mid?'middle':high.has(i)?'hot':'';svg+='<circle class="vertex '+c+'" cx="'+x+'" cy="'+y+'" r="21"/><text class="vertex-label '+(i===mid?'middle':'')+'" x="'+x+'" y="'+y+'">'+vertex(i)+'</text>';}
  $('mlGraph').innerHTML=svg;
 }
 const val=(kind,x)=>kind==='H'?setText(x):kind==='D'||kind==='W'?fmt(x):vertex(x);
 function matrix(kind,a,lookup,refs,oldVal,ev){
  const primary=mode==='build'?ev?[ev.i,ev.j]:null:[s,t];
  let html='<div class="mlMatrixPanel '+(kind===method||kind==='D'?'mlPrimaryMatrix':'')+'"><div class="mlMatrixHeader"><span class="mlSymbol">'+kind+'</span><div><strong>'+names[kind]+'</strong><small>'+defs[kind]+'</small></div></div><div class="matrix-scroll"><table class="mlMatrix" aria-label="Ma trận '+kind+'"><thead><tr><th scope="col">i/j</th>';
  for(let j=0;j<n;j++)html+='<th scope="col" class="'+(mode==='trace'&&j===t?'mlAxis':'')+'">'+vertex(j)+'</th>';
  html+='</tr></thead><tbody>';
  for(let i=0;i<n;i++){
   html+='<tr><th scope="row" class="'+(mode==='trace'&&i===s?'mlAxis':'')+'">'+vertex(i)+'</th>';
   for(let j=0;j<n;j++){
    const v=a[i][j],str=val(kind,v),target=primary&&primary[0]===i&&primary[1]===j;
    const read=lookup.some(([k,u,v])=>k===kind&&u===i&&v===j),ref=refs.some(([k,u,v])=>k===kind&&u===i&&v===j);
    const changed=mode==='build'&&ev&&target&&kind!=='W'&&val(kind,oldVal[kind][i][j])!==str;
    const axis=mode==='trace'&&((kind==='P'&&i===s)||(['N','H','D'].includes(kind)&&j===t));
    const cls=[target?'mlTarget':'',read?'mlRead':'',ref?'mlRef':'',changed?'mlChanged':'',axis?'mlAxisCell':'',str==='∞'||str==='—'||str==='∅'?'mlEmpty':''].join(' ');
    const cellTitle=kind+'['+vertex(i)+']['+vertex(j)+'] = '+str+(changed?' (trước: '+val(kind,oldVal[kind][i][j])+')':'');
    html+='<td class="'+cls+'" title="'+cellTitle+'">'+(mode==='trace'?'<button type="button" data-cell="'+kind+','+i+','+j+'" aria-label="'+cellTitle+'">'+str+'</button>':str)+'</td>';
   }
   html+='</tr>';
  }
  return html+'</tbody></table></div></div>';
 }
 function render(){
  $('mlDataset').value=dataset;$('mlSource').value=s;$('mlTarget').value=t;$('mlFilter').checked=filter;$('mlAll').checked=showAll;
  $('mlBuild').setAttribute('aria-pressed',String(mode==='build'));$('mlTrace').setAttribute('aria-pressed',String(mode==='trace'));
  $('mlFilterWrap').hidden=mode!=='build';$('mlNextTie').disabled=!frames.some(f=>f.event?.tied);$('mlQueryControls').hidden=mode!=='trace';
  $('mlSummary').hidden=mode!=='trace';$('mlResults').hidden=mode!=='trace';
  $('mlStep').textContent=pos()+' / '+max();$('mlRange').max=max();$('mlRange').value=pos();
  $('mlPrev').disabled=pos()===0;$('mlNext').disabled=pos()===max();
  $('mlModeLabel').textContent=mode==='build'?'GIAI ĐOẠN 1 / XÂY DỰNG MA TRẬN':'GIAI ĐOẠN 2 / TRUY VẾT TỪ MA TRẬN CUỐI';
  $('mlMethods').innerHTML=['P','N','M','H','T'].map(k=>'<button type="button" data-method="'+k+'" aria-pressed="'+(k===method)+'"><b>'+k+'</b> '+names[k]+'</button>').join('');
  let state,previous,ev=null,lookup=[],refs=[];
  if(mode==='build'){
   const frame=frames[buildPos];state=frame.state;previous=model.frames[Math.max(0,frame.step-1)].state;ev=frame.event;
   $('mlPhase').textContent='Phép so sánh '+frame.step+' / '+n**3+' · '+frame.changes+' giảm D · '+frame.ties+' hợp tập H';
   if(!ev){
    $('mlExplain').innerHTML='<strong>Khởi tạo D = W, đường chéo D[i][i] = 0.</strong><div class="mlCalc">P = nguồn của cạnh trực tiếp · N = đích · M = — · H = {đích}</div>Chưa sử dụng bất kỳ đỉnh trung gian nào.';
    graph();
   }else{
    const {i,j,k,old,left,right,candidate,improved,tied,prev,read}=ev;
    refs=[['D',i,k],['D',k,j],['P',k,j],['N',i,k],['H',i,k]];
    const finite=Number.isFinite(candidate);
    const verdict=improved?'ĐƯỜNG NGẮN HƠN — cập nhật D, P, N, M, H':tied?'ĐỒNG HẠNG — chỉ hợp thêm lựa chọn vào H':!finite?'KHÔNG CÓ ĐƯỜNG QUA k':'GIỮ NGUYÊN — không có cải thiện';
    const next=state[method]?.[i]?.[j],rule=method==='P'?'P[i][j] ← P[k][j]':method==='N'?'N[i][j] ← N[i][k]':method==='M'?'M[i][j] ← k':method==='H'?(improved?'H[i][j] ← copy(H[i][k])':tied?'H[i][j] ← H[i][j] ∪ H[i][k]':'H[i][j] giữ nguyên'):'Không lưu ma trận bổ trợ';
    $('mlExplain').innerHTML='<strong>'+verdict+'</strong><div class="mlCalc">k = '+vertex(k)+' · i = '+vertex(i)+' · j = '+vertex(j)+'</div><div class="mlCalc">D['+vertex(i)+']['+vertex(k)+'] + D['+vertex(k)+']['+vertex(j)+'] = '+fmt(left)+' + '+fmt(right)+' = '+fmt(candidate)+'; D['+vertex(i)+']['+vertex(j)+']: '+fmt(old)+' → '+fmt(state.D[i][j])+'</div><div class="mlCalc">'+(method==='T'?rule:((improved||method==='H'&&tied)?rule:'Không cập nhật '+method)+' · '+val(method,prev[method])+' → '+val(method,next))+'</div>';
    let route=[];
    if(finite){try{const a=E.path(model,i,k,'N',previous).paths[0],b=E.path(model,k,j,'N',previous).paths[0];if(a&&b)route=a.concat(b.slice(1));}catch(_){}}
    graph(route,[i,j,k],k);
   }
  }else{
   state=model.final;previous=state;const f=result.frames[tracePos];lookup=f.lookups;
   $('mlPhase').textContent='D đã hoàn tất · '+names[method]+' · '+vertex(s)+' → '+vertex(t);
   const route=selected>=0?result.paths[selected]:f.route;
   if(selected>=0)lookup=[['D',s,t]];
   $('mlExplain').innerHTML='<strong>'+(selected>=0?'Đường '+(selected+1)+' / '+result.paths.length+' · '+routeText(route):f.message)+'</strong><div class="mlCalc">'+(selected>=0?'Tổng trọng số: '+fmt(result.distance):'Nhánh hiện tại: '+(route.length?routeText(route):'—')+(f.sequence?' · Thứ tự đọc: '+f.sequence:'')+(f.depth!==undefined?' · Độ sâu đệ quy: '+f.depth:''))+'</div>';
   graph(route,f.focus||[s,t],-1,selected>=0?null:f.candidate,f.tight);
   $('mlDistance').textContent=fmt(result.distance);$('mlCount').textContent=result.paths.length;
   $('mlFound').textContent=selected>=0?result.paths.length:f.found;
   $('mlPathLabel').textContent=(method==='H'||method==='T')?'Mọi đường ngắn nhất đơn':'Đường ngắn nhất được chọn';
   $('mlList').innerHTML=result.paths.map((r,i)=>'<button class="mlRoute '+(selected===i?'chosen':'')+'" data-route="'+i+'" aria-pressed="'+(selected===i)+'"><span class="mlRouteNo">'+String(i+1).padStart(2,'0')+'</span><strong>'+routeText(r)+'</strong><span class="mlRouteCost">'+fmt(result.distance)+'</span><small>'+(i<f.found?'Đã tìm':'Tham chiếu')+'</small></button>').join('')||'<p>Không tồn tại đường đi hữu hạn.</p>';
  }
  const primary=method==='T'?'W':method;
  const order=['D',primary],extra=['W','P','N','M','H'].filter(k=>k!==primary);
  const data={...state,W:model.W};
  $('mlMatrices').innerHTML=order.map(k=>matrix(k,data[k],lookup,refs,previous,ev)).join('');
  $('mlExtraWrap').hidden=!showAll;$('mlExtraMatrices').innerHTML=showAll?extra.map(k=>matrix(k,data[k],lookup,refs,previous,ev)).join(''):'';
  $('mlCrossCheck').hidden=mode!=='trace';
  if(mode==='trace'){const methods=['P','N','M','H','T'],checks=methods.map(k=>E.path(model,s,t,k));const sig=x=>x.paths.map(p=>p.join(',')).sort().join('|');const ok=sig(checks[3])===sig(checks[4])&&checks.every(x=>x.distance===result.distance);$('mlCrossCheck').innerHTML='<h3>Đối chiếu cả 5 phương án</h3><p>'+(ok?'✓ Cả năm phương án thống nhất về khoảng cách; H và T cho cùng tập đường đi.':'Kết quả không nhất quán.')+'</p><div class="mlCrossGrid">'+methods.map((k,i)=>'<div><small>'+k+' · '+names[k]+'</small><strong>'+checks[i].paths.length+'</strong><span>'+ (i<3?(checks[i].paths[0]?routeText(checks[i].paths[0]):'—'):'đường ngắn nhất đơn')+'</span></div>').join('')+'</div>';}
  $('mlMatrixHelp').textContent=mode==='build'?'Xanh đậm: ô đang xét · xanh nhạt: ô tham chiếu · viền vàng: giá trị vừa đổi.':'Bấm một ô bất kỳ để truy vấn i → j; ô xanh đậm là cặp nguồn–đích, viền xanh là ô đang đọc.';
  $('mlMethodHint').textContent=defs[method];
 }
 $('mlDataset').onchange=resetDataset;
 $('mlBuild').onclick=()=>setMode('build');$('mlTrace').onclick=()=>setMode('trace');
 $('mlSource').onchange=()=>query(num($('mlSource').value),t);$('mlTarget').onchange=()=>query(s,num($('mlTarget').value));
 $('mlMethods').onclick=e=>{const b=e.target.closest('[data-method]');if(b)setMethod(b.dataset.method);};
 $('mlAll').onchange=()=>{showAll=$('mlAll').checked;render();};
 $('mlFilter').onchange=()=>{stop();const step=frames[buildPos].step;filter=$('mlFilter').checked;changeFilter();const i=frames.findIndex(x=>x.step>=step);buildPos=i<0?frames.length-1:i;render();};
 $('mlFirst').onclick=()=>{stop();setPosition(0);};$('mlPrev').onclick=()=>{stop();setPosition(pos()-1);};$('mlNext').onclick=()=>{stop();setPosition(pos()+1);};$('mlLast').onclick=()=>{stop();setPosition(max());};
 $('mlPlay').onclick=play;$('mlSpeed').onchange=()=>{if(timer!==null){stop();play();}};
 $('mlRange').oninput=()=>{stop();setPosition(num($('mlRange').value));};
 const matrixClick=e=>{const b=e.target.closest('[data-cell]');if(!b||mode!=='trace')return;const [k,u,v]=b.dataset.cell.split(',');query(num(u),num(v),['P','N','M','H'].includes(k)?k:method);};$('mlMatrices').onclick=matrixClick;$('mlExtraMatrices').onclick=matrixClick;
 $('mlNextTie').onclick=()=>{stop();const next=frames.findIndex((f,i)=>i>buildPos&&f.event?.tied);if(next>=0)setPosition(next);else{const first=frames.findIndex(f=>f.event?.tied);if(first>=0)setPosition(first);}};
 $('mlList').onclick=e=>{const b=e.target.closest('[data-route]');if(!b)return;stop();selected=num(b.dataset.route);tracePos=max();render();};
 changeFilter();recalc(true);render();
 return {getState:()=>({dataset,mode,method,s,t,buildPos,tracePos,showAll,filter,selected,result,model}),render};
})(document,MatrixLabEngine);}catch(e){document.getElementById('mlError').hidden=false;document.getElementById('mlError').textContent='Không thể khởi tạo mô phỏng: '+e.message;console.error(e);}}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();})();
