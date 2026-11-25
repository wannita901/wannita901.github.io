(() => {
  const scenarios = {
    docking: {moving_collar:'Moving collar', panel_bypass:'Panel bypass', debris_crossing:'Crossing debris', combined_salvage:'Combined salvage'},
    warehouse: {balanced:'Balanced flow', pick_station_burst:'Station burst', narrow_bottleneck:'Narrow bottleneck', temporary_closure_slowdown:'Closure + slowdown'}
  };
  const colors = {ink:'#e8f0f4', muted:'#93a9b9', grid:'#294558', mint:'#78dfcf', amber:'#ffcd80', red:'#ff8d83', blue:'#83b7f6'};
  const linkPairs = [[0,1],[1,2],[3,4],[4,5],[6,7],[7,8],[0,3],[3,6],[1,4],[4,7],[2,5],[5,8]];
  const nodes = Array.from({length:9}, (_,n)=>[153+(n%3)*207,88+Math.floor(n/3)*122]);
  const podNode = [0,1,2,6,7,8], stationNode=[3,5];
  function stroke(ctx, points, color, width=1, dash=[]) {
    ctx.beginPath(); ctx.setLineDash(dash);
    points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));
    ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();ctx.setLineDash([]);
  }
  function circle(ctx,x,y,r,fill,outline) {
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();
    if(outline){ctx.strokeStyle=outline;ctx.lineWidth=2;ctx.stroke();}
  }
  function txt(ctx,s,x,y,size=13,color=colors.ink,align='left') {
    ctx.fillStyle=color;ctx.font=`${size}px system-ui,sans-serif`;ctx.textAlign=align;ctx.fillText(s,x,y);ctx.textAlign='left';
  }
  function rotate(q,v){
    const [w,x,y,z]=q, [a,b,c]=v;
    const tx=2*(y*c-z*b),ty=2*(z*a-x*c),tz=2*(x*b-y*a);
    return [a+w*tx+y*tz-z*ty,b+w*ty+z*tx-x*tz,c+w*tz+x*ty-y*tx];
  }
  function docking(ctx,frames,i,camera) {
    const f=frames[i], side=Math.sign(frames[0][1][0]-frames[0][2][0])||1, center=f[2];
    const project=p=>{
      const x=p[0]-center[0],y=p[1]-center[1],z=p[2]-center[2];
      const cy=Math.cos(camera.yaw),sy=Math.sin(camera.yaw),ce=Math.cos(camera.elev),se=Math.sin(camera.elev);
      const horizontal=-side*x*cy+y*sy;
      const vertical=-side*x*sy*se-y*cy*se+z*ce;
      const depth=side*x*sy+y*cy;
      const scale=16/(1+Math.max(-30,depth)/100);
      return [520+horizontal*scale,207-vertical*scale,scale];
    };
    // Three calibrated axes show that this is a local 3D docking frame.
    const origin=project(center);
    for(const axis of [[side*8,0,0],[0,8,0],[0,0,8]]){
      const p=project(center.map((v,n)=>v+axis[n]));stroke(ctx,[origin,p],'#355468',1,[4,5]);
    }
    txt(ctx,'3D proximity view · drag to rotate',22,29,16);
    const target=project(center),port=project(f[3]);
    const corridor=project([f[3][0]+side*12,f[3][1],f[3][2]]);
    stroke(ctx,[port,corridor],'#678498',2,[6,7]);
    // The dashed sphere is the simulated 3 m hull collision boundary;
    // the blue geometry inside it identifies the target as a ghost ship.
    ctx.beginPath();ctx.arc(target[0],target[1],3*target[2],0,2*Math.PI);ctx.setLineDash([5,6]);ctx.strokeStyle='#7892a2';ctx.lineWidth=1.5;ctx.stroke();ctx.setLineDash([]);
    if(f[9]){
      const part=(vertices,fill,outline)=>{const points=vertices.map(v=>project(center.map((c,n)=>c+rotate(f[9],v)[n])));ctx.beginPath();points.forEach((p,n)=>n?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=outline;ctx.lineWidth=1.5;ctx.stroke()};
      part([[-1.2,-2.4,-.35],[-1.2,-.9,-.35],[-1.2,-.9,.35],[-1.2,-2.4,.35]],'#335b7a','#6d9aba');
      part([[-1.2,.9,-.35],[-1.2,2.4,-.35],[-1.2,2.4,.35],[-1.2,.9,.35]],'#335b7a','#6d9aba');
      part([[-2,-1,-.65],[1.9,-1,-.65],[2.4,0,0],[1.9,1,.65],[-2,1,.65]],'#7c9eaf','#e2edf2');
    }
    txt(ctx,'Ghost ship',target[0]+42,target[1]+42,11,colors.muted);
    if(f[4]&&f[9]){
      const q=f[9],corners=[[-1.7,-3.5],[1.7,-3.5],[1.7,3.5],[-1.7,3.5]].map(([y,z])=>project(f[4].map((v,n)=>v+rotate(q,[0,y,z])[n])));
      ctx.beginPath();corners.forEach((p,n)=>n?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fillStyle='rgba(201,83,83,.65)';ctx.fill();ctx.strokeStyle=colors.red;ctx.lineWidth=2;ctx.stroke();
      const pc=project(f[4]);txt(ctx,'Attached panel',pc[0]+15,pc[1]-14,12,colors.red);
    }
    const debris=f[5].map(d=>({p:project(d),r:d[3]})).sort((a,b)=>a.p[2]-b.p[2]);
    debris.forEach(({p,r})=>{const radius=Math.max(5,r*p[2]);const g=ctx.createRadialGradient(p[0]-radius/3,p[1]-radius/3,1,p[0],p[1],radius);g.addColorStop(0,'#f2b0a6');g.addColorStop(1,'#995057');circle(ctx,p[0],p[1],radius,g,colors.red)});
    stroke(ctx,frames.map(v=>project(v[3])),'#9f875f',1.5,[3,5]);
    circle(ctx,port[0],port[1],Math.max(7,.42*port[2]),'#243849',colors.amber);
    txt(ctx,'Moving collar',port[0]+16,port[1]-18,12,colors.amber);
    stroke(ctx,frames.map(v=>project(v[1])),'#396e70',1.5);
    stroke(ctx,frames.slice(0,i+1).map(v=>project(v[1])),colors.mint,2.7);
    const craft=project(f[1]),q=f[10]||[1,0,0,0];
    const hull=[[-.7,0,0],[.5,.4,0],[.3,0,.2],[.5,-.4,0]].map(local=>project(f[1].map((v,n)=>v+rotate(q,local)[n])));
    ctx.beginPath();hull.forEach((p,n)=>n?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fillStyle=colors.mint;ctx.fill();ctx.strokeStyle=colors.ink;ctx.lineWidth=2;ctx.stroke();
    circle(ctx,craft[0],craft[1],4,colors.mint);
    txt(ctx,'Chaser',craft[0]+13,craft[1]-11,12,colors.mint);
    txt(ctx,['Staging','Bypass','Crossing','Port approach'][f[6]],22,394,14);
    txt(ctx,`Range ${Math.hypot(...f[1].map((v,n)=>v-f[3][n])).toFixed(1)} m`,288,394,14);
    txt(ctx,`Fuel ${f[7].toFixed(2)} / 6`,585,394,14);
  }
  function robot(ctx,x,y,id,phase,focus){
    const c=phase==='service'?colors.amber:phase==='idle'?colors.muted:colors.mint;
    circle(ctx,x,y,focus?15:12,c,focus?colors.ink:'#112534');
    ctx.fillStyle='#102131';ctx.fillRect(x-5,y-4,10,6);
    txt(ctx,String(id+1),x,y+7,12,colors.ink,'center');
  }
  function warehouse(ctx,frame,focus) {
    const [tick,raw,closed,rawEvents]=frame;
    const phases=['idle','to_pod','to_station','service','to_storage'];
    const names=['pickup','station_arrival','return_complete','safety_reject'];
    const robots=raw.map(r=>({id:r[0],node:r[1],phase:phases[r[2]],pod:r[3],station:r[4],job:r[5],transit:r[6]?{from:r[6][0],to:r[6][1],remaining:r[6][2],total:r[6][3]}:null}));
    const events=rawEvents.map(e=>({type:names[e[0]],robot:e[1]}));
    linkPairs.forEach(([a,b])=>{
      const shut=closed&&a===1&&b===4;
      stroke(ctx,[nodes[a],nodes[b]],shut?colors.red:'#3c596b',shut?10:15,shut?[8,9]:[]);
    });
    nodes.forEach(([x,y],n)=>{
      circle(ctx,x,y,19,'#172f40','#658498');
      if(podNode.includes(n)){
        ctx.fillStyle='#4e7792';ctx.fillRect(x-17,y-54,34,25);
        txt(ctx,`P${podNode.indexOf(n)+1}`,x,y-36,11,colors.ink,'center');
      }
      if(stationNode.includes(n)){
        ctx.fillStyle='#7a6346';ctx.fillRect(x-37,y-53,74,23);
        txt(ctx,`PICK ${stationNode.indexOf(n)+1}`,x,y-37,11,colors.ink,'center');
      }
      if(n===4)txt(ctx,'PARK',x,y-35,11,colors.muted,'center');
      txt(ctx,String(n+1),x,y+5,12,colors.ink,'center');
    });
    const atNode={};
    robots.forEach(r=>{
      let x,y;
      if(r.transit){const a=nodes[r.transit.from],b=nodes[r.transit.to];const q=1-r.transit.remaining/r.transit.total;x=a[0]+(b[0]-a[0])*q;y=a[1]+(b[1]-a[1])*q;}
      else [x,y]=nodes[r.node];
      const j=atNode[r.node]||0;if(!r.transit){x+=(j%3-1)*25;y+=Math.floor(j/3)*25;atNode[r.node]=j+1;}
      robot(ctx,x,y,r.id,r.phase,r.id===focus);
    });
    const selected=robots[focus];
    const goal=selected.phase==='to_station'||selected.phase==='service'?stationNode[selected.station]:(selected.pod===null?null:podNode[selected.pod]);
    if(goal!==null){circle(ctx,...nodes[goal],26,'transparent',colors.amber);txt(ctx,'GOAL',nodes[goal][0]+31,nodes[goal][1]-18,11,colors.amber)}
    const phase={idle:'Waiting for job',to_pod:'Going to pod',to_station:'Taking pod to pick station',service:'At pick station',to_storage:'Returning pod'}[selected.phase]||selected.phase;
    txt(ctx,`Robot ${focus+1}: ${phase}`,24,29,16);
    if(selected.job!==null)txt(ctx,`Pod P${selected.pod+1}  →  Pick ${selected.station+1}`,24,392,14);
    const event=events.find(e=>e.robot===focus&&['pickup','station_arrival','return_complete','safety_reject'].includes(e.type));
    if(event)txt(ctx,event.type.replaceAll('_',' '),456,392,14,colors.amber);
    txt(ctx,`Tick ${tick}`,630,29,14,colors.muted,'right');
  }
  const timeline=document.querySelector('[data-wsp-timeline]');
  if(timeline&&window.weightSpaceTimeline){
    timeline.innerHTML='<div class="wsp-timeline-controls"><label>Task <select class="wsp-tl-task"><option value="docking">Space docking</option><option value="warehouse">Warehouse</option></select></label><label>Show <select class="wsp-tl-limit"><option value="10">First 10 calls</option><option value="20">All 20 calls</option></select></label><button type="button" class="wsp-tl-play">Play edits</button></div><svg viewBox="0 0 720 270" role="img" aria-label="Practice score by evaluation call"></svg><div class="wsp-tl-note"></div><div class="wsp-tl-legend">Mint: 20 practice cases per call · Grey: retrospective 200-case unseen score · Red marks: weights changed</div>';
    const task=timeline.querySelector('.wsp-tl-task'),limit=timeline.querySelector('.wsp-tl-limit'),play=timeline.querySelector('.wsp-tl-play'),svg=timeline.querySelector('svg'),note=timeline.querySelector('.wsp-tl-note');
    let selected=1,timer=null;
    function draw(){
      const rows=window.weightSpaceTimeline[task.value].slice(0,Number(limit.value));selected=Math.min(selected,rows.length);
      const min=task.value==='docking'?0:50,max=task.value==='docking'?100:65;
      const X=n=>62+(n-1)*620/(rows.length-1),Y=v=>220-(v-min)*155/(max-min);
      const line=rows.map(r=>`${X(r.call)},${Y(r.score)}`).join(' ');
      const held=rows.filter(r=>r.heldout!==undefined),heldLine=held.map(r=>`${X(r.call)},${Y(r.heldout)}`).join(' ');
      svg.innerHTML=`<line x1="62" y1="220" x2="682" y2="220" stroke="#b9c6c9"/><line x1="62" y1="65" x2="682" y2="65" stroke="#d4dddf" stroke-dasharray="4 5"/><text x="12" y="72">${max}${task.value==='docking'?'%':''}</text><text x="12" y="225">${min}${task.value==='docking'?'%':''}</text><polyline points="${line}" fill="none" stroke="#168d7d" stroke-width="3" stroke-linejoin="round"/><polyline points="${heldLine}" fill="none" stroke="#84949b" stroke-width="2" stroke-dasharray="5 4"/>${held.map(r=>`<circle cx="${X(r.call)}" cy="${Y(r.heldout)}" r="3" fill="#84949b"/>`).join('')}${rows.map(r=>`<g data-call="${r.call}" tabindex="0" role="button" aria-label="Call ${r.call}, practice score ${r.score}"><line x1="${X(r.call)}" y1="238" x2="${X(r.call)}" y2="252" stroke="${r.weights_changed?'#d15452':'#aab9c0'}" stroke-width="2"/><circle cx="${X(r.call)}" cy="${Y(r.score)}" r="${r.call===selected?7:5}" fill="${r.call===selected?'#102131':'#168d7d'}" stroke="${r.call===selected?'#168d7d':'none'}" stroke-width="2"/><text x="${X(r.call)}" y="267" text-anchor="middle">${r.call}</text></g>`).join('')}<line x1="${X(selected)}" y1="47" x2="${X(selected)}" y2="220" stroke="#607783" stroke-dasharray="3 5"/><text x="${X(selected)+8}" y="${Math.max(52,Y(rows[selected-1].score)-12)}" fill="#168d7d">${rows[selected-1].score}${task.value==='docking'?'%':''}</text>`;
      const current=rows[selected-1];note.innerHTML=`<strong>Call ${selected} of ${rows.length} · ${current.weights_changed?'weights changed':'weights reused'} · ${current.score}${task.value==='docking'?'% practice docks':' on-time jobs / practice episode'}</strong><p></p><small>${current.heldout===undefined?'':`Retrospective unseen score: ${current.heldout}${task.value==='docking'?'% docks':' on-time jobs / episode'}. `}Red marks: weight edits. The unseen scores were calculated after the writer finished.</small>`;
      note.querySelector('p').textContent=current.explanation||'No explanation recorded.';
      svg.querySelectorAll('[data-call]').forEach(g=>{const choose=()=>{selected=Number(g.dataset.call);draw()};g.addEventListener('click',choose);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose()}})});
    }
    function stop(){if(timer)clearInterval(timer);timer=null;play.textContent='Play edits'}
    task.addEventListener('change',()=>{stop();selected=1;draw()});limit.addEventListener('change',()=>{stop();selected=1;draw()});
    play.addEventListener('click',()=>{if(timer)return stop();selected=1;draw();play.textContent='Pause';timer=setInterval(()=>{if(selected>=Number(limit.value))return stop();selected++;draw()},1100)});
    draw();
  }
  const cache=new Map();
  async function episode(task, checkpoint, number){
    const chunk=Math.floor((number-1)/25), fileCheckpoint=task==='warehouse'&&checkpoint==='20'?'15':checkpoint, key=`${task}-${fileCheckpoint}-${chunk}`;
    if(!cache.has(key)){
      const response=await fetch(`/blog/weight-space-programming/data/${key}.json`);
      if(!response.ok)throw new Error(`Replay file could not load (${response.status})`);
      cache.set(key,await response.json());
    }
    return cache.get(key)[(number-1)%25];
  }
  for(const figure of document.querySelectorAll('[data-wsp-replay]')){
    const task=figure.dataset.wspReplay;
    figure.innerHTML=`<div class="wsp-controls"><label>Checkpoint <select class="wsp-checkpoint"></select></label><label>Challenge <select class="wsp-scenario"></select></label>${task==='docking'?'':'<label>Follow <select class="wsp-robot"></select></label>'}</div><canvas width="720" height="420" role="img"></canvas><div class="wsp-transport"><button class="wsp-prev" type="button" aria-label="Previous episode">←</button><label>Episode <input class="wsp-episode" type="number" min="1" max="200" value="1" aria-label="Episode number"> / 200</label><button class="wsp-next" type="button" aria-label="Next episode">→</button><button class="wsp-play" type="button">Play all</button><input class="wsp-scrub" type="range" min="0" value="0" aria-label="Replay position"><output></output><label>Speed <select class="wsp-speed"><option value=".5">0.5×</option><option value="1" selected>1×</option><option value="2">2×</option>${task==='docking'?'<option value="4">4×</option><option value="8">8×</option>':'<option value=".25">0.25×</option><option value=".1">0.1×</option>'}</select></label></div><figcaption class="wsp-caption" aria-live="polite"></figcaption>${task==='docking'?'<div class="wsp-command"><strong>Controller output</strong><div class="wsp-command-grid"></div></div>':''}<div class="wsp-legend"></div>`;
    const q=s=>figure.querySelector(s), canvas=q('canvas'),ctx=canvas.getContext('2d'),checkpoint=q('.wsp-checkpoint'),scenario=q('.wsp-scenario'),follow=q('.wsp-robot'),play=q('.wsp-play'),prev=q('.wsp-prev'),next=q('.wsp-next'),episodeInput=q('.wsp-episode'),scrub=q('.wsp-scrub'),output=q('output'),caption=q('figcaption'),speed=q('.wsp-speed');
    [0,5,10,15,20].forEach(n=>checkpoint.add(new Option(n===0?'0 · First weights':`${n} calls`,n)));
    Object.entries(scenarios[task]).forEach(([id,name],i)=>scenario.add(new Option(`${name} · ${i*50+1}–${(i+1)*50}`,i*50)));
    if(follow)for(let n=0;n<6;n++)follow.add(new Option(`Robot ${n+1}`,n));
    checkpoint.value='20';
    q('.wsp-legend').innerHTML=task==='docking'?'<span><i class="wsp-key mint"></i>Chaser and path</span><span><i class="wsp-key amber"></i>Moving collar</span><span><i class="wsp-key red"></i>Panel / moving debris</span>':'<span><i class="wsp-key blue"></i>P1–P6: storage pods</span><span><i class="wsp-key amber"></i>PICK: service stations</span><span><i class="wsp-key mint"></i>Numbered robots</span><span><i class="wsp-key red"></i>Closed aisle</span>';
    play.disabled=true;
    const commandNames=['Thrust X','Thrust Y','Thrust Z','Rotate X','Rotate Y','Rotate Z','Hold / abort'];
    if(task==='docking')q('.wsp-command-grid').innerHTML=commandNames.map((name,i)=>`<div class="wsp-command-row"><span>${name}</span><div class="wsp-bar"><i data-command="${i}"></i></div><output data-value="${i}">0.00</output></div>`).join('');
    const camera={yaw:-.55,elev:.35};
    let frames=[],current=null,index=0,cursor=0,number=1,previous=null,animation=null,playing=false,loadToken=0;
    function render(){
      if(!frames.length)return;
      const f=frames[index];ctx.fillStyle='#102131';ctx.fillRect(0,0,720,420);
      if(task==='docking'){
        docking(ctx,frames,index,camera);
        const values=f[8]||[];
        values.forEach((value,i)=>{const bar=q(`[data-command="${i}"]`),val=q(`[data-value="${i}"]`);if(bar){bar.style.width=`${Math.min(100,Math.abs(value)*100)}%`;bar.style.background=value<0?'#83b7f6':'#78dfcf';}if(val)val.textContent=value.toFixed(2)});
      }else warehouse(ctx,f,Number(follow.value));
      scrub.value=index;output.textContent=task==='docking'?`${f[0].toFixed(1)} / ${frames.at(-1)[0].toFixed(1)} s`:`Tick ${f[0]} / ${frames.at(-1)[0]}`;
      scrub.setAttribute('aria-valuetext',output.textContent);
      canvas.setAttribute('aria-label',`Episode ${number} of 200, ${scenarios[task][current.scenario]}, checkpoint ${checkpoint.value}, ${output.textContent}. ${caption.textContent}`);
    }
    function pause(){playing=false;if(animation!==null)cancelAnimationFrame(animation);animation=null;play.textContent='Play all';}
    async function go(n,autoplay=false){
      const token=++loadToken;number=Math.max(1,Math.min(200,n));episodeInput.value=number;prev.disabled=number===1;next.disabled=number===200;
      scenario.value=Math.floor((number-1)/50)*50;play.disabled=true;caption.textContent=`Loading test episode ${number}…`;
      try{const item=await episode(task,checkpoint.value,number);if(token!==loadToken)return;
        current=item;frames=item.frames;play.disabled=false;cursor=index=0;scrub.max=frames.length-1;
        const m=item.metrics;
        const start=frames[0],end=frames.at(-1),collarShift=task==='docking'?Math.hypot(...start[3].map((v,n)=>(end[3][n]-end[2][n])-(v-start[2][n]))):0;
        caption.textContent=task==='docking'?`${scenarios[task][item.scenario]} · ${m.success?'Docked':m.termination.replaceAll('_',' ')} · ${m.fuel_used.toFixed(3)} fuel used${m.min_debris_clearance===null?'':` · closest debris gap ${m.min_debris_clearance.toFixed(2)} m`} · collar shifts ${collarShift.toFixed(2)} m relative to hull`:`${scenarios[task][item.scenario]} · ${m.jobs_completed_on_time}/${m.jobs_released} jobs on time · ${m.safety_rejections} safety rejections`;
        render();if(autoplay&&playing){previous=null;animation=requestAnimationFrame(step)}
      }catch(error){if(token===loadToken){pause();caption.textContent=`${error.message}. Select an episode to retry.`}}
    }
    function step(time){if(!playing)return;if(previous!==null)cursor+=Math.min(time-previous,100)*.06*Number(speed.value);previous=time;const nextFrame=Math.min(Math.floor(cursor),frames.length-1);if(nextFrame!==index){index=nextFrame;render()}
      if(index===frames.length-1){animation=null;if(number<200)go(number+1,true);else pause()}else animation=requestAnimationFrame(step)}
    play.addEventListener('click',()=>{if(playing)return pause();playing=true;play.textContent='Pause';if(number===200&&index===frames.length-1)go(1,true);else{previous=null;animation=requestAnimationFrame(step)}});
    prev.addEventListener('click',()=>{pause();go(number-1)});next.addEventListener('click',()=>{pause();go(number+1)});
    episodeInput.addEventListener('change',()=>{pause();go(Number(episodeInput.value)||1)});
    checkpoint.addEventListener('change',()=>{pause();go(number)});
    scenario.addEventListener('change',()=>{pause();go(Number(scenario.value)+1)});
    scrub.addEventListener('input',()=>{pause();cursor=index=Number(scrub.value);render()});
    if(task==='docking'){let pointer=null;canvas.style.touchAction='none';canvas.addEventListener('pointerdown',e=>{pointer=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointermove',e=>{if(!pointer)return;camera.yaw+=(e.clientX-pointer[0])*.008;camera.elev=Math.max(-1.2,Math.min(1.2,camera.elev+(e.clientY-pointer[1])*.008));pointer=[e.clientX,e.clientY];render()});canvas.addEventListener('pointerup',()=>pointer=null)}
    follow?.addEventListener('change',render);go(151);
  }
  for(const table of document.querySelectorAll('.prose table')){
    const wrapper=document.createElement('div');
    wrapper.className='wsp-table-scroll';
    table.parentNode.insertBefore(wrapper,table);
    wrapper.append(table);
  }
})();
