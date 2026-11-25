(() => {
  const scenarios = {
    docking: {moving_collar:'Moving collar', panel_bypass:'Panel bypass', debris_crossing:'Crossing debris', combined_salvage:'Combined salvage'},
    warehouse: {balanced:'Balanced flow', pick_station_burst:'Station burst', narrow_bottleneck:'Narrow bottleneck', temporary_closure_slowdown:'Closure + slowdown'}
  };
  const PLAY_ICON='<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l13-7.5z" fill="currentColor"/></svg>';
  const PAUSE_ICON='<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor"/></svg>';
  const PREV_ICON='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
  const NEXT_ICON='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';
  const colors = {ink:'#e8f0f4', muted:'#93a9b9', grid:'#294558', mint:'#78dfcf', amber:'#ffcd80', red:'#ff8d83', blue:'#83b7f6'};
  const linkPairs = [[0,1],[1,2],[3,4],[4,5],[6,7],[7,8],[0,3],[3,6],[1,4],[4,7],[2,5],[5,8]];
  const nodes = Array.from({length:9}, (_,n)=>[153+(n%3)*207,104+Math.floor(n/3)*116]);
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
  function box(ctx,x,y,w,h,fill,outline,r=4){
    ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();
    if(outline){ctx.strokeStyle=outline;ctx.lineWidth=1;ctx.stroke();}
  }
  function shelf(ctx,x,y,w=36,h=28){
    box(ctx,x-w/2,y-h/2,w,h,'#23485e','#87a9bd',2);
    for(let j=1;j<3;j++)stroke(ctx,[[x-w/2+4,y-h/2+j*h/3],[x+w/2-4,y-h/2+j*h/3]],'#87a9bd',1);
    stroke(ctx,[[x,y-h/2+3],[x,y+h/2-3]],'#557c93',1);
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
    // Target-relative 3D lattice: three perpendicular planes, five metres per cell.
    const gridPoint=(x,y,z)=>project([center[0]+side*x,center[1]+y,center[2]+z]);
    const gridLine=(a,b,alpha=.24)=>{ctx.globalAlpha=alpha;stroke(ctx,[gridPoint(...a),gridPoint(...b)],'#5a8399',1);};
    ctx.save();
    for(let x=0;x<=35;x+=5){
      gridLine([x,-10,-10],[x,10,-10]); // floor: X/Y
      gridLine([x,10,-10],[x,10,10]); // rear: X/Z
    }
    for(let y=-10;y<=10;y+=5){
      gridLine([0,y,-10],[35,y,-10]); // floor depth
      gridLine([0,y,-10],[0,y,10],.32); // end: Y/Z
    }
    for(let z=-10;z<=10;z+=5){
      gridLine([0,10,z],[35,10,z]); // rear height
      gridLine([0,-10,z],[0,10,z],.32); // end: Y/Z
    }
    for(const [a,b] of [
      [[0,-10,-10],[35,-10,-10]],[[0,10,-10],[35,10,-10]],
      [[0,10,10],[35,10,10]],[[0,-10,-10],[0,10,-10]],
      [[0,10,-10],[0,10,10]]
    ])gridLine(a,b,.45);
    ctx.restore();
    for(let x=0;x<=30;x+=10){const p=gridPoint(x,-10,-10);txt(ctx,`${x} m`,p[0],p[1]+13,10,'#89a9b9','center');}
    txt(ctx,'Docking approach',24,30,16);
    txt(ctx,'5 m grid  /  drag to rotate',700,29,11,'#aac5d4','right');
    const target=project(center),port=project(f[3]);
    const corridor=project([f[3][0]+side*12,f[3][1],f[3][2]]);
    stroke(ctx,[port,corridor],'#678498',2,[6,7]);
    // The dashed sphere is the simulated 3 m hull collision boundary;
    // the blue geometry inside it identifies the target as a ghost ship.
    ctx.beginPath();ctx.arc(target[0],target[1],3*target[2],0,2*Math.PI);ctx.setLineDash([5,6]);ctx.strokeStyle='#7892a2';ctx.lineWidth=1.5;ctx.stroke();ctx.setLineDash([]);
    if(f[9]){
      const world=v=>center.map((c,n)=>c+rotate(f[9],v)[n]);
      const part=(vertices,fill)=>{const points=vertices.map(v=>project(world(v)));ctx.beginPath();points.forEach((p,n)=>n?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle='#9fb9ca';ctx.lineWidth=1;ctx.stroke();};
      for(const wing of [-1,1]){
        part([[-1.5,wing*.9,0],[1.3,wing*.9,0],[1.3,wing*2.6,0],[-1.5,wing*2.6,0]],'#254965');
        for(let x=-.8;x<1.3;x+=.7)stroke(ctx,[project(world([x,wing*.9,0])),project(world([x,wing*2.6,0]))],'#527b99',1);
      }
      part([[-1.8,-.65,-.65],[1.8,-.65,-.65],[1.8,-.65,.65],[-1.8,-.65,.65]],'#526f83');
      part([[-1.8,-.65,.65],[1.8,-.65,.65],[1.8,.65,.65],[-1.8,.65,.65]],'#aac0ca');
      part([[1.8,-.65,-.65],[1.8,.65,-.65],[1.8,.65,.65],[1.8,-.65,.65]],'#7896a8');
    }
    txt(ctx,'Ghost ship',target[0]+42,target[1]+42,11,colors.muted);
    if(f[4]&&f[9]){
      const q=f[9],corners=[[-1.7,-3.5],[1.7,-3.5],[1.7,3.5],[-1.7,3.5]].map(([y,z])=>project(f[4].map((v,n)=>v+rotate(q,[0,y,z])[n])));
      ctx.beginPath();corners.forEach((p,n)=>n?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fillStyle='#243e52';ctx.fill();ctx.strokeStyle=colors.red;ctx.lineWidth=2;ctx.stroke();
      for(let z=-2.5;z<3.5;z+=1)stroke(ctx,[-1.7,1.7].map(y=>project(f[4].map((v,n)=>v+rotate(q,[0,y,z])[n]))),'#6c8291',.7);
      const pc=project(f[4]);txt(ctx,'Attached panel',pc[0]-12,pc[1]-50,12,colors.red,'right');
    }
    const debris=f[5].map(d=>({p:project(d),r:d[3]})).sort((a,b)=>a.p[2]-b.p[2]);
    debris.forEach(({p,r},j)=>{
      const radius=Math.max(5,r*p[2]),points=Array.from({length:7},(_,k)=>{const a=k*Math.PI*2/7+j,scale=[.9,1,.76,.95,.82,1,.8][k];return[p[0]+Math.cos(a)*radius*scale,p[1]+Math.sin(a)*radius*scale];});
      ctx.beginPath();points.forEach((v,k)=>k?ctx.lineTo(...v):ctx.moveTo(...v));ctx.closePath();ctx.fillStyle='#644d50';ctx.fill();ctx.strokeStyle=colors.red;ctx.lineWidth=1.4;ctx.stroke();
      stroke(ctx,[points[1],points[4],points[6]],'#a57977',.8);
    });
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
    const w=26;
    box(ctx,x-w/2-3,y-8,4,16,'#071724',null,1);box(ctx,x+w/2-1,y-8,4,16,'#071724',null,1);
    box(ctx,x-w/2,y-12,w,24,c,'#c5e2e3',5);
    stroke(ctx,[[x-7,y-8],[x+7,y-8]],'#153c49',2);
    txt(ctx,String(id+1),x,y+6,13,'#102131','center');
    if(focus){ctx.strokeStyle=colors.ink;ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(x-18,y-17,36,34,8);ctx.stroke();}

  }
  function warehouse(ctx,frame,focus) {
    const [tick,raw,closed,rawEvents]=frame;
    const phases=['idle','to_pod','to_station','service','to_storage'];
    const names=['pickup','station_arrival','return_complete','safety_reject'];
    const robots=raw.map(r=>({id:r[0],node:r[1],phase:phases[r[2]],pod:r[3],station:r[4],job:r[5],transit:r[6]?{from:r[6][0],to:r[6][1],remaining:r[6][2],total:r[6][3]}:null}));
    const events=rawEvents.map(e=>({type:names[e[0]],robot:e[1]}));
    linkPairs.forEach(([a,b])=>{
      const shut=closed&&a===1&&b===4;
      stroke(ctx,[nodes[a],nodes[b]],'#203b4b',32);
      stroke(ctx,[nodes[a],nodes[b]],shut?colors.red:'#5b7685',shut?3:1,shut?[6,5]:[3,7]);
    });
    nodes.forEach(([x,y],n)=>{
      box(ctx,x-22,y-22,44,44,'#203b4b',null,6);
      if(podNode.includes(n)){
        shelf(ctx,x,y-48,42,28);
        txt(ctx,`P${podNode.indexOf(n)+1}`,x+29,y-44,10,colors.muted);
      }
      if(stationNode.includes(n)){
        box(ctx,x-38,y-57,76,28,'#554934','#c5a779',3);
        box(ctx,x-30,y-50,17,14,'#d2b68a',null,2);
        stroke(ctx,[[x-3,y-48],[x+27,y-48]],'#c5a779',1);
        stroke(ctx,[[x-3,y-42],[x+20,y-42]],'#c5a779',1);
        txt(ctx,`PICK ${stationNode.indexOf(n)+1}`,x,y-65,10,colors.amber,'center');
      }
      if(n===4)txt(ctx,'PARK',x,y-35,11,colors.muted,'center');
      txt(ctx,String(n+1),x+29,y+23,10,'#6d8c9e','center');
    });
    const atNode={};
    robots.forEach(r=>{
      let x,y;
      if(r.transit){const a=nodes[r.transit.from],b=nodes[r.transit.to];const q=1-r.transit.remaining/r.transit.total;x=a[0]+(b[0]-a[0])*q;y=a[1]+(b[1]-a[1])*q;}
      else [x,y]=nodes[r.node];
      const j=atNode[r.node]||0;if(!r.transit){x+=(j%3-1)*36;y+=(Math.floor(j/3)-.5)*35;atNode[r.node]=j+1;}
      robot(ctx,x,y,r.id,r.phase,r.id===focus);
    });
    const selected=robots[focus];
    const goal=selected.phase==='to_station'||selected.phase==='service'?stationNode[selected.station]:(selected.pod===null?null:podNode[selected.pod]);
    if(goal!==null){circle(ctx,...nodes[goal],26,'transparent',colors.amber);txt(ctx,'GOAL',nodes[goal][0]+31,nodes[goal][1]-18,11,colors.amber)}
    const phase={idle:'Waiting for job',to_pod:'Going to pod',to_station:'Taking pod to pick station',service:'At pick station',to_storage:'Returning pod'}[selected.phase]||selected.phase;
    txt(ctx,`Robot ${focus+1}: ${phase}`,24,26,15);
    if(selected.job!==null)txt(ctx,`Pod P${selected.pod+1}  →  Pick ${selected.station+1}`,24,392,14);
    const event=events.find(e=>e.robot===focus&&['pickup','station_arrival','return_complete','safety_reject'].includes(e.type));
    if(event)txt(ctx,event.type.replaceAll('_',' '),456,392,14,colors.amber);
    txt(ctx,`Tick ${tick}`,630,29,14,colors.muted,'right');
  }
  const timeline=document.querySelector('[data-wsp-timeline]');
  if(timeline&&window.weightSpaceTimeline){
    timeline.innerHTML='<div class="wsp-timeline-controls"><label>Task <select class="wsp-tl-task"><option value="docking">Space docking</option><option value="warehouse">Warehouse</option></select></label></div><svg viewBox="0 0 720 270" role="img" aria-label="Practice score by evaluation call"></svg><div class="wsp-tl-note"></div><div class="wsp-tl-legend">Mint: practice score (20 cases per call) · Grey: retrospective unseen score (200 cases) · Red: edit call</div>';
    const task=timeline.querySelector('.wsp-tl-task'),svg=timeline.querySelector('svg'),note=timeline.querySelector('.wsp-tl-note');
    let selected=1,rows=[],min=0,max=100;
    const X=n=>62+(n-1)*620/9,Y=v=>220-(v-min)*155/(max-min);
    function select(call,force=false){
      if(call===selected&&!force)return;
      selected=call;
      const current=rows[selected-1],x=X(selected),scoreY=Y(current.score);
      const band=svg.querySelector('.wsp-selected-band');
      band.setAttribute('x',Math.max(44,x-620/18));
      band.setAttribute('width',Math.min(704,x+620/18)-Math.max(44,x-620/18));
      svg.querySelector('.wsp-selected-line').setAttribute('x1',x);
      svg.querySelector('.wsp-selected-line').setAttribute('x2',x);
      const label=svg.querySelector('.wsp-selected-label');
      label.setAttribute('x',x+(selected>=9?-8:8));
      label.setAttribute('y',Math.max(52,scoreY-12));
      label.setAttribute('text-anchor',selected>=9?'end':'start');
      label.textContent=`${current.score}${task.value==='docking'?'%':''}`;
      svg.querySelectorAll('[data-call]').forEach(g=>{
        const active=Number(g.dataset.call)===selected,point=g.querySelector('circle');
        point.setAttribute('r',active?7:5);
        point.setAttribute('fill',active?'#102131':'#168d7d');
        point.setAttribute('stroke',active?'#168d7d':'none');
        g.setAttribute('aria-current',active?'step':'false');
      });
      const unit=task.value==='docking'?'% docks':' jobs / episode';
      note.innerHTML=`<div class="wsp-tl-metrics"><strong>Call ${selected} of ${rows.length} · weights edited</strong><span>Practice <b>${current.score}${unit}</b></span><span>Unseen <b>${current.heldout}${unit}</b></span></div><div class="wsp-tl-brief"><small>What changed</small><p></p></div><details class="wsp-tl-record"><summary>Read the model’s submitted edit note</summary><p></p></details><small class="wsp-tl-provenance">Unseen scores were measured afterward and were never shown to the writer.</small>`;
      note.querySelector('.wsp-tl-brief p').textContent=current.brief;
      note.querySelector('.wsp-tl-record p').textContent=current.explanation||'No note submitted.';
    }
    function draw(){
      rows=window.weightSpaceTimeline[task.value].slice(0,10);
      min=task.value==='docking'?0:50;max=task.value==='docking'?100:65;
      const ticks=task.value==='docking'?[0,25,50,75,100]:[50,55,60,65];
      const line=rows.map(r=>`${X(r.call)},${Y(r.score)}`).join(' ');
      const held=rows.filter(r=>r.heldout!==undefined),heldLine=held.map(r=>`${X(r.call)},${Y(r.heldout)}`).join(' ');
      svg.innerHTML=`${ticks.map(v=>`<line x1="62" y1="${Y(v)}" x2="682" y2="${Y(v)}" stroke="#d8e1e2" stroke-width="1"/><text x="12" y="${Y(v)+4}">${v}${task.value==='docking'?'%':''}</text>`).join('')}<rect class="wsp-selected-band" y="47" height="205" fill="#dcefeb" opacity=".5"/><polyline points="${line}" fill="none" stroke="#168d7d" stroke-width="3" stroke-linejoin="round"/><polyline points="${heldLine}" fill="none" stroke="#84949b" stroke-width="2" stroke-dasharray="5 4"/>${held.map(r=>`<circle cx="${X(r.call)}" cy="${Y(r.heldout)}" r="3" fill="#84949b"/>`).join('')}${rows.map(r=>`<g data-call="${r.call}" tabindex="0" role="button" aria-label="Call ${r.call}, practice score ${r.score}"><line x1="${X(r.call)}" y1="238" x2="${X(r.call)}" y2="252" stroke="${r.weights_changed?'#d15452':'#aab9c0'}" stroke-width="2"/><circle cx="${X(r.call)}" cy="${Y(r.score)}" r="5" fill="#168d7d"/><text x="${X(r.call)}" y="267" text-anchor="middle">${r.call}</text></g>`).join('')}<line class="wsp-selected-line" y1="47" y2="220" stroke="#607783" stroke-dasharray="3 5"/><text class="wsp-selected-label" fill="#168d7d"></text>`;
      svg.querySelectorAll('[data-call]').forEach(g=>{
        const choose=()=>select(Number(g.dataset.call));
        g.addEventListener('click',choose);
        g.addEventListener('focus',choose);
        g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose()}});
      });
      select(selected,true);
    }
    function pickArea(e){
      const rect=svg.getBoundingClientRect();
      const x=(e.clientX-rect.left)*720/rect.width,y=(e.clientY-rect.top)*270/rect.height;
      if(x<44||x>704||y<45||y>255)return;
      select(Math.max(1,Math.min(10,Math.round((x-62)*9/620)+1)));
    }
    svg.addEventListener('pointermove',pickArea);
    svg.addEventListener('pointerdown',pickArea);
    task.addEventListener('change',()=>{selected=1;draw()});
    draw();
  }
  const cache=new Map();
  async function episode(task, checkpoint, number){
    const chunk=Math.floor((number-1)/25), key=`${task}-${checkpoint}-${chunk}`;
    if(!cache.has(key)){
      const response=await fetch(`/blog/weight-space-programming/data/${key}.json`);
      if(!response.ok)throw new Error(`Replay file could not load (${response.status})`);
      cache.set(key,await response.json());
    }
    return cache.get(key)[(number-1)%25];
  }
  for(const figure of document.querySelectorAll('[data-wsp-replay]')){
    const task=figure.dataset.wspReplay;
    figure.innerHTML=`<div class="wsp-controls"><label>Checkpoint <select class="wsp-checkpoint"></select></label><label>Challenge <select class="wsp-scenario"></select></label>${task==='docking'?'':'<label>Follow <select class="wsp-robot"></select></label>'}</div><canvas width="720" height="420" role="img"></canvas><div class="wsp-transport"><button class="wsp-play" type="button" aria-label="Play all episodes" title="Play all episodes">${PLAY_ICON}</button><button class="wsp-prev" type="button" aria-label="Previous episode">${PREV_ICON}</button><label class="wsp-episode-label">Episode <input class="wsp-episode" type="number" min="1" max="200" value="1" aria-label="Episode number"> / 200</label><button class="wsp-next" type="button" aria-label="Next episode">${NEXT_ICON}</button><input class="wsp-scrub" type="range" min="0" value="0" aria-label="Replay position"><output></output><div class="wsp-speed" role="group" aria-label="Replay speed">${(task==='docking'?[.5,1,2,4,8]:[.1,.25,.5,1,2]).map(n=>`<button type="button" data-speed="${n}" aria-pressed="${n===1}">${n}×</button>`).join('')}</div></div><figcaption class="wsp-caption" aria-live="polite"></figcaption>${task==='docking'?'<div class="wsp-command"><strong>Controller commands <small>−1 to +1</small></strong><div class="wsp-command-grid"><div class="wsp-stick"><b>Translation</b><div class="wsp-stick-field"><span class="wsp-stick-axis horizontal"></span><span class="wsp-stick-axis vertical"></span><i data-stick="move"></i></div><small>X <output data-value="0">0.00</output> · Y <output data-value="1">0.00</output> · Z <output data-value="2">0.00</output></small></div><div class="wsp-stick"><b>Rotation</b><div class="wsp-stick-field"><span class="wsp-stick-axis horizontal"></span><span class="wsp-stick-axis vertical"></span><i data-stick="turn"></i></div><small>X <output data-value="3">0.00</output> · Y <output data-value="4">0.00</output> · Z <output data-value="5">0.00</output></small></div><div class="wsp-mode">Mode <output data-value="6">FLY</output><small>Requested mode</small></div></div></div>':''}<div class="wsp-legend"></div>`;
    const q=s=>figure.querySelector(s), canvas=q('canvas'),ctx=canvas.getContext('2d'),checkpoint=q('.wsp-checkpoint'),scenario=q('.wsp-scenario'),follow=q('.wsp-robot'),play=q('.wsp-play'),prev=q('.wsp-prev'),next=q('.wsp-next'),episodeInput=q('.wsp-episode'),scrub=q('.wsp-scrub'),output=q('output'),caption=q('figcaption'),speed=q('.wsp-speed');
    const episodeNav=document.createElement('div');episodeNav.className='wsp-episode-nav';episodeNav.append(prev,q('.wsp-episode-label'),next);q('.wsp-controls').append(episodeNav);
    [0,5,10].forEach(n=>checkpoint.add(new Option(n===0?'0 · First weights':`${n} calls`,n)));
    Object.entries(scenarios[task]).forEach(([id,name],i)=>scenario.add(new Option(`${name} · ${i*50+1}–${(i+1)*50}`,i*50)));
    if(follow)for(let n=0;n<6;n++)follow.add(new Option(`Robot ${n+1}`,n));
    checkpoint.value='10';
    q('.wsp-legend').innerHTML=task==='docking'?'<span><i class="wsp-key craft"></i>Chaser + recorded trail</span><span><i class="wsp-key ship"></i>Ghost ship + hull boundary</span><span><i class="wsp-key collar"></i>Docking collar</span><span><i class="wsp-key panel"></i>Attached panel</span><span><i class="wsp-key debris"></i>Moving debris</span>':'<span><i class="wsp-key robot"></i>Numbered robot</span><span><i class="wsp-key pod"></i>Storage pod · collect → return</span><span><i class="wsp-key station"></i>Pick station · service</span><span><i class="wsp-key closure"></i>Closed aisle</span><span><i class="wsp-key goal"></i>Selected robot’s destination</span>';
    play.disabled=true;
        const camera={yaw:-.55,elev:.35};
    let frames=[],current=null,index=0,cursor=0,number=1,previous=null,animation=null,playing=false,loadToken=0,rate=1;
    function render(){
      if(!frames.length)return;
      const f=frames[index];ctx.fillStyle='#102131';ctx.fillRect(0,0,720,420);
      if(task==='docking'){
        docking(ctx,frames,index,camera);
        const values=f[8]||[];
        values.forEach((value,i)=>{const val=q(`[data-value="${i}"]`);if(val)val.textContent=i===6?(value>=.5?'HOLD':value<=-.5?'ABORT':'FLY'):value.toFixed(2)});for(const [name,a,b] of [['move',0,1],['turn',3,4]]){const dot=q(`[data-stick="${name}"]`);dot.style.left=`${50+Math.max(-1,Math.min(1,values[a]||0))*42}%`;dot.style.top=`${50-Math.max(-1,Math.min(1,values[b]||0))*42}%`;}
      }else warehouse(ctx,f,Number(follow.value));
      scrub.value=index;output.textContent=task==='docking'?`${f[0].toFixed(1)} / ${frames.at(-1)[0].toFixed(1)} s`:`Tick ${f[0]} / ${frames.at(-1)[0]}`;
      scrub.setAttribute('aria-valuetext',output.textContent);
      canvas.setAttribute('aria-label',`Episode ${number} of 200, ${scenarios[task][current.scenario]}, checkpoint ${checkpoint.value}, ${output.textContent}. ${caption.textContent}`);
    }
    function pause(){playing=false;if(animation!==null)cancelAnimationFrame(animation);animation=null;play.innerHTML=PLAY_ICON;play.setAttribute('aria-label','Play all episodes');}
    async function go(n,autoplay=false){
      const token=++loadToken;number=Math.max(1,Math.min(200,n));episodeInput.value=number;prev.disabled=number===1;next.disabled=number===200;
      scenario.value=Math.floor((number-1)/50)*50;play.disabled=true;caption.textContent=`Loading test episode ${number}…`;
      try{const item=await episode(task,checkpoint.value,number);if(token!==loadToken)return;
        current=item;frames=item.frames;play.disabled=false;cursor=index=0;scrub.max=frames.length-1;
        const m=item.metrics;
        const start=frames[0],end=frames.at(-1),collarShift=task==='docking'?Math.hypot(...start[3].map((v,n)=>(end[3][n]-end[2][n])-(v-start[2][n]))):0;
        caption.textContent=task==='docking'?`${scenarios[task][item.scenario]} · ${m.success?'Docked':m.termination.replaceAll('_',' ')} · ${m.fuel_used.toFixed(3)} fuel used${m.min_debris_clearance===null?'':` · closest debris gap ${m.min_debris_clearance.toFixed(2)} m`}`:`${scenarios[task][item.scenario]} · ${m.jobs_completed_on_time}/${m.jobs_released} jobs on time · ${m.safety_rejections} safety rejections`;
        render();if(autoplay&&playing){previous=null;animation=requestAnimationFrame(step)}
      }catch(error){if(token===loadToken){pause();caption.textContent=`${error.message}. Select an episode to retry.`}}
    }
    function step(time){if(!playing)return;if(previous!==null)cursor+=Math.min(time-previous,100)*.06*rate;previous=time;const nextFrame=Math.min(Math.floor(cursor),frames.length-1);if(nextFrame!==index){index=nextFrame;render()}
      if(index===frames.length-1){animation=null;if(number<200)go(number+1,true);else pause()}else animation=requestAnimationFrame(step)}
    play.addEventListener('click',()=>{if(playing)return pause();playing=true;play.innerHTML=PAUSE_ICON;play.setAttribute('aria-label','Pause replay');if(number===200&&index===frames.length-1)go(1,true);else{previous=null;animation=requestAnimationFrame(step)}});
    speed.querySelectorAll('[data-speed]').forEach(button=>button.addEventListener('click',()=>{rate=Number(button.dataset.speed);speed.querySelectorAll('[data-speed]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)))}));
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
