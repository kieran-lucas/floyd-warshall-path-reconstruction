
(function(){
const tie=EDGES.map(([u,v,w])=>[u,v,({"0,2":7,"1,3":5,"2,4":4,"3,5":5})[[u,v].join(',')]??w]);
const model=AllPathsEngine.build(V,tie,{capture:true}),plain=AllPathsEngine.build(V,tie,{storeHops:false});
const routeText=p=>p.map(label).join(' → '), setText=p=>'{'+p.map(label).join(', ')+'}';
let result,s=0,t=5,method='set',buildIndex=0,selectedPath=-1;
for(let i=0;i<V;i++)for(const id of ['allSrc','allDst'])$(id).add(new Option(String(label(i)),i));
$('allSrc').value=0;$('allDst').value=5;
function drawGraph(route){
 const active=pairs(route),high=new Set(route),id='graphAll';
 let svg='<defs><marker id="alla" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8z" fill="#aeb6c1"/></marker><marker id="allb" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8z" fill="#315bc3"/></marker></defs>';
 for(const [u,v,w] of tie){const key=u+','+v,g=edgeStyles[key],a=active.has(key);svg+='<path d="'+lineGeometry(u,v,g.bend)+'" class="edge '+(a?'active':'')+'" marker-end="url(#all'+(a?'b':'a')+')"/>';}
 for(const [u,v,w] of tie){const key=u+','+v,g=edgeStyles[key];svg+='<text class="weight '+(active.has(key)?'active':'')+'" x="'+g.label[0]+'" y="'+g.label[1]+'">'+w+'</text>';}
 for(let i=0;i<V;i++){const [x,y]=nodes[i];svg+='<circle class="vertex '+(high.has(i)?'hot':'')+'" cx="'+x+'" cy="'+y+'" r="21"/><text class="vertex-label" x="'+x+'" y="'+y+'">'+label(i)+'</text>';}
 $(id).innerHTML=svg;
}
function showBuild(){
 const ev=model.updates[buildIndex];$('buildPrev').disabled=buildIndex===0;$('buildNext').disabled=buildIndex===model.updates.length-1;
 $('buildLabel').textContent='Cập nhật H: '+(buildIndex+1)+' / '+model.updates.length;
 $('buildDetail').textContent='k = '+label(ev.k)+': H['+label(ev.i)+']['+label(ev.j)+'] '+setText(ev.before)+(ev.kind==='union'?' ∪ ':' → ')+setText(ev.via)+' = '+setText(ev.after)+'. D: '+fmt(ev.old)+' → '+fmt(ev.cand)+(ev.kind==='union'?' (hòa: hợp tập)':' (ngắn hơn: thay thế)');
}
$('buildPrev').onclick=()=>{if(buildIndex>0)buildIndex--;showBuild();};$('buildNext').onclick=()=>{if(buildIndex<model.updates.length-1)buildIndex++;showBuild();};
function draw(i,max){
 const f=result.steps[i];selectedPath=-1;drawGraph(f.route);
 $('aStep').textContent=i+' / '+max;
 const messages={expand:'Xét các bước tiếp theo từ '+label(f.node)+': '+setText(f.choices),advance:'Đi tới đỉnh '+label(f.node),backtrack:'Quay lui từ '+label(f.candidate??f.node),cycle:'Bỏ qua đỉnh đã nằm trên nhánh: '+label(f.candidate??f.node),found:'Tìm được đường ngắn nhất: '+routeText(f.route),done:'Đã duyệt xong mọi nhánh.',unreachable:'Không tồn tại đường đi.','negative-cycle':'Không có cực tiểu hữu hạn.'};
 $('allExplain').textContent=messages[f.kind]+' | Đã tìm: '+f.found+'/'+result.paths.length+' | Nhánh: '+routeText(f.route)+' | Lựa chọn/cạnh đã kiểm tra: '+f.inspections;
 let out='<table class="compare"><thead><tr><th>u</th><th>D[u][t]</th><th>'+(method==='set'?'H[u][t]':'Các cạnh chặt u → v')+'</th></tr></thead><tbody>';
 for(let u=0;u<V;u++){const hops=method==='set'?[...model.H[u][t]].sort((a,b)=>a-b):AllPathsEngine.tight(plain,u,t);out+='<tr'+(u===f.node?' style="font-weight:bold"':'')+'><td>'+label(u)+'</td><td>'+fmt(model.D[u][t])+'</td><td>'+setText(hops)+'</td></tr>';}
 $('allMatrix').innerHTML=out+'</tbody></table>';
 $('allList').innerHTML=result.paths.map((p,k)=>'<div class="all-route"><button data-route="'+k+'">'+(k+1)+'. '+routeText(p)+'</button><span>'+result.distance+(k<f.found?' · đã tìm':' · kết quả tham chiếu')+'</span></div>').join('')||'<p>Không có đường đi.</p>';
}
const ctl=controller('a',draw);
function prepare(){
 s=Number($('allSrc').value);t=Number($('allDst').value);method=$('allMethod').value;
 result=AllPathsEngine.enumerate(method==='set'?model:plain,s,t,method,{capture:true});
 const other=AllPathsEngine.enumerate(method==='set'?plain:model,s,t,method==='set'?'tight':'set');
 const signature=x=>x.paths.map(p=>p.join(',')).sort().join('|');
 $('allQuery').textContent=label(s)+' → '+label(t);$('allDist').textContent=fmt(result.distance);$('allCount').textContent=result.paths.length;
 $('allVerify').textContent=(signature(result)===signature(other)&&result.distance===other.distance?'✓ Hai phương án cho cùng tập đường đi.':'Lỗi: hai phương án không nhất quán.')+' | Kiểm tra lựa chọn/cạnh: '+result.inspections+' so với '+other.inspections+' của phương án còn lại.';
 ctl.configure(result.steps.length-1);
}
for(const id of ['allSrc','allDst','allMethod'])$(id).onchange=prepare;
$('allList').onclick=e=>{const b=e.target.closest('[data-route]');if(!b)return;ctl.stop();selectedPath=Number(b.dataset.route);drawGraph(result.paths[selectedPath]);$('allExplain').textContent='Đường '+(selectedPath+1)+' / '+result.paths.length+': '+routeText(result.paths[selectedPath])+' | Tổng trọng số: '+result.distance;};
buildIndex=Math.max(0,model.updates.findIndex(x=>x.kind==='union'));showBuild();prepare();
})();
