(() => {
  const data = window.weightSpaceReplaysV2;
  if (!data) return;
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
  function docking(ctx,frames,i,view) {
    const f=frames[i], first=frames[0];
    const side=Math.sign(first[1][0]-first[2][0])||1;
    const plane=view==='elevation'?2:1;
    const rel=p=>[p[0]-f[2][0],p[plane]-f[2][plane]];
    const xy=p=>{const [x,y]=rel(p);return [570-side*x*17,205-y*30]};
    const port=xy(f[3]),target=xy(f[2]),ship=xy(f[1]);
    for(let x=0;x<720;x+=60)stroke(ctx,[[x,47],[x,357]],colors.grid,1);
    for(let y=55;y<360;y+=60)stroke(ctx,[[35,y],[685,y]],colors.grid,1);
    stroke(ctx,[[35,205],[685,205]],'#486278',1,[5,7]);
    if(view==='port'){
      const cp=f[1].map((v,n)=>v-f[3][n]);
      const px=360+cp[1]*95,py=205-cp[2]*95;
      for(const r of [35,95,155])circle(ctx,360,205,r,'transparent',colors.grid);
      circle(ctx,360,205,35,'#294558',colors.amber);
      stroke(ctx,frames.slice(0,i+1).map(v=>[360+(v[1][1]-v[3][1])*95,205-(v[1][2]-v[3][2])*95]),colors.mint,2);
      circle(ctx,px,py,8,colors.mint,colors.ink);
      txt(ctx,'Port opening',360,161,13,colors.amber,'center');
      txt(ctx,`Axial range ${Math.abs(cp[0]).toFixed(1)} m`,24,394,14);
      txt(ctx,'Cross-section: sideways / vertical',24,29,16);
      return;
    }
    // The ghost ship is a measured keep-out shape in this projection.
    circle(ctx,...target,29,'#243c50','#648296');
    stroke(ctx,[xy([f[2][0]-side*2.6,f[2][1],f[2][2]]),xy([f[2][0]+side*2.6,f[2][1],f[2][2]])],colors.amber,2);
    circle(ctx,...port,9,'#273b4e',colors.amber);
    txt(ctx,'Moving dock',port[0]+14,port[1]-25,12,colors.amber);
    if(f[4]){
      const p=xy(f[4]);ctx.fillStyle='#a95054';ctx.fillRect(p[0]-27,p[1]-11,54,22);
      txt(ctx,'Panel',p[0],p[1]-17,12,colors.red,'center');
    }
    f[5].forEach(d=>{const p=xy(d);circle(ctx,...p,Math.max(5,d[3]*17),'#a45055',colors.red)});
    stroke(ctx,frames.map(v=>xy(v[1])),'#386c6a',1.25);
    stroke(ctx,frames.slice(0,i+1).map(v=>xy(v[1])),colors.mint,2.5);
    circle(ctx,...ship,9,colors.mint,colors.ink);
    stroke(ctx,[[ship[0]-11,ship[1]+11],[ship[0],ship[1]-13],[ship[0]+11,ship[1]+11]],colors.ink,2);
    txt(ctx,'Chaser',ship[0]+16,ship[1]-14,12,colors.mint);
    txt(ctx,view==='elevation'?'Elevation: approach / vertical':'Plan: approach / sideways',24,29,16);
    txt(ctx,['Staging','Bypass','Crossing','Port approach'][f[6]],24,394,14);
    txt(ctx,`Fuel ${f[7].toFixed(2)} / 6`,584,394,14);
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
    const selected=robots[focus], phase={idle:'Waiting for job',to_pod:'Going to pod',to_station:'Taking pod to pick station',service:'At pick station',to_storage:'Returning pod'}[selected.phase]||selected.phase;
    txt(ctx,`Robot ${focus+1}: ${phase}`,24,29,16);
    if(selected.job!==null)txt(ctx,`Pod P${selected.pod+1}  →  Pick ${selected.station+1}`,24,392,14);
    const event=events.find(e=>e.robot===focus&&['pickup','station_arrival','return_complete','safety_reject'].includes(e.type));
    if(event)txt(ctx,event.type.replaceAll('_',' '),456,392,14,colors.amber);
    txt(ctx,`Tick ${tick}`,630,29,14,colors.muted,'right');
  }
  for(const figure of document.querySelectorAll('[data-wsp-replay]')){
    const task=figure.dataset.wspReplay,records=data[task];if(!records)continue;
    figure.innerHTML=`<div class="wsp-controls"><label>Checkpoint <select class="wsp-checkpoint"></select></label><label>Challenge <select class="wsp-scenario"></select></label>${task==='docking'?'<label>View <select class="wsp-view"><option value="plan">Plan</option><option value="elevation">Elevation</option><option value="port">Port alignment</option></select></label>':'<label>Follow <select class="wsp-robot"></select></label>'}</div><canvas width="720" height="420" role="img"></canvas><div class="wsp-transport"><button type="button">Play</button><input type="range" min="0" value="0" aria-label="Replay position"><output></output><label>Speed <select class="wsp-speed"><option value=".5">0.5×</option><option value="1" selected>1×</option><option value="2">2×</option></select></label></div><figcaption class="wsp-caption"></figcaption><div class="wsp-legend"></div>`;
    const q=s=>figure.querySelector(s), canvas=q('canvas'),ctx=canvas.getContext('2d'),checkpoint=q('.wsp-checkpoint'),scenario=q('.wsp-scenario'),view=q('.wsp-view'),follow=q('.wsp-robot'),play=q('button'),scrub=q('input'),output=q('output'),caption=q('figcaption'),speed=q('.wsp-speed');
    [0,5,10,15,20].forEach(n=>checkpoint.add(new Option(n===0?'0 · First weights':`${n} calls`,n)));
    Object.entries(scenarios[task]).forEach(([id,name])=>scenario.add(new Option(name,id)));
    if(follow)for(let n=0;n<6;n++)follow.add(new Option(`Robot ${n+1}`,n));
    checkpoint.value='20';
    if(view)view.value='elevation';
    scenario.value=task==='docking'?'combined_salvage':'temporary_closure_slowdown';
    q('.wsp-legend').textContent=task==='docking'?'Mint: chaser and path · Amber: moving dock · Red: panel and debris':'P: storage pod · PICK: pick station · Numbered circles: robots · Red dashed track: closed link';
    let frames,index=0,cursor=0,previous=null,animation=null;
    function render(){
      const f=frames[index];ctx.fillStyle='#102131';ctx.fillRect(0,0,720,420);
      if(task==='docking')docking(ctx,frames,index,view.value);else warehouse(ctx,f,Number(follow.value));
      scrub.value=index;output.textContent=task==='docking'?`${f[0].toFixed(1)} / ${frames.at(-1)[0].toFixed(1)} s`:`Tick ${f[0]} / ${frames.at(-1)[0]}`;
      scrub.setAttribute('aria-valuetext',output.textContent);
      canvas.setAttribute('aria-label',`${scenarios[task][scenario.value]}, checkpoint ${checkpoint.value}, ${output.textContent}. ${caption.textContent}`);
    }
    function pause(){if(animation!==null)cancelAnimationFrame(animation);animation=null;play.textContent='Play';}
    function select(){pause();const r=records[checkpoint.value].cases[scenario.value];frames=r.frames;index=cursor=task==='warehouse'?Math.min(50,frames.length-1):0;scrub.max=frames.length-1;
      const m=r.metrics;caption.textContent=task==='docking'?`Recorded practice episode · ${m.success?'Docked':m.termination.replaceAll('_',' ')} · ${m.fuel_used.toFixed(3)} fuel used`:`Recorded practice episode · ${m.jobs_completed_on_time}/${m.jobs_released} jobs completed on time · ${m.safety_rejections} safety rejections`;render();}
    function step(time){if(previous!==null)cursor+=Math.min(time-previous,100)*.06*Number(speed.value);previous=time;const next=Math.min(Math.floor(cursor),frames.length-1);if(next!==index){index=next;render();}if(index===frames.length-1)pause();else animation=requestAnimationFrame(step);}
    play.addEventListener('click',()=>{if(animation!==null)return pause();if(index===frames.length-1){index=cursor=0;render();}previous=null;play.textContent='Pause';animation=requestAnimationFrame(step);});
    scrub.addEventListener('input',()=>{pause();index=cursor=Number(scrub.value);render();});
    checkpoint.addEventListener('change',select);scenario.addEventListener('change',select);view?.addEventListener('change',render);follow?.addEventListener('change',render);select();
  }
  for(const table of document.querySelectorAll('.prose table')){
    const wrapper=document.createElement('div');
    wrapper.className='wsp-table-scroll';
    table.parentNode.insertBefore(wrapper,table);
    wrapper.append(table);
  }
})();
