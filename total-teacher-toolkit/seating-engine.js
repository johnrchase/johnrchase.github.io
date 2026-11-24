/* Reusable geometry and assignment rules for Quick Team Generator seating charts. */
(function(root){
  'use strict';
  const copy=value=>JSON.parse(JSON.stringify(value));
  const uid=()=>globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2);
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number.isFinite(Number(n))?Number(n):min));
  const round=n=>Math.round(n*100)/100;
  const types=['table','round','desk','chair','officechair','stool','podium','sparechair','monitor','keyboard','teacher','board','door','window','shelf','label','lamp','plant','couch','comfychair','rug','roundrug','sink','stovetop','bookcart','deskchair','cabinet','trashcan','recyclebin','laptop','schoolsupplies','printer'];
  const fonts=['Arial','Verdana','Georgia','Trebuchet MS','Courier New'];
  const color=(value,fallback)=>/^#[0-9a-f]{6}$/i.test(value||'')?value:fallback;
  function style(object){
    const wood=['table','round','desk','deskchair','teacher','shelf','podium','cabinet'].includes(object.type);
    return {rugPattern:['geometric','rings','diamonds','stripes','plain'].includes(object.rugPattern)?object.rugPattern:object.type==='roundrug'?'rings':'geometric',showLabel:object.showLabel===true,rotateLabel:object.rotateLabel===undefined?object.type==='label':object.rotateLabel===true,fill:color(object.fill,object.type==='laptop'?'#64748b':['schoolsupplies','printer'].includes(object.type)?'#b8c2cb':object.type==='trashcan'?'#aeb9c2':object.type==='recyclebin'?'#287ab8':['couch','comfychair'].includes(object.type)?'#6e8a79':object.type==='rug'?'#d9903e':object.type==='roundrug'?'#6b9f9a':['sink','bookcart'].includes(object.type)?'#b8c2cb':object.type==='stovetop'?'#343a40':object.type==='officechair'?'#334155':['desk','deskchair'].includes(object.type)?'#e3c28b':object.type==='teacher'?'#a87748':wood?'#684025':'#dbeafe'),texture:['wood','plain','speckle'].includes(object.texture)?object.texture:wood?'wood':'plain',stroke:color(object.stroke,'#4b5563'),strokeWidth:clamp(object.strokeWidth===undefined?2:object.strokeWidth,0,12),strokeStyle:['solid','dashed','dotted','none'].includes(object.strokeStyle)?object.strokeStyle:'solid',fontFamily:fonts.includes(object.fontFamily)?object.fontFamily:'Arial',fontSize:clamp(object.fontSize||15,8,48),bold:object.bold===true,italic:object.italic===true,underline:object.underline===true,fontColor:color(object.fontColor,(object.type==='board'||wood&&!['desk','teacher'].includes(object.type))?'#ffffff':'#172033')};
  }
  function createObject(type,x,y){
    if(!types.includes(type))throw Error('Unknown room item.');
    const sizes={table:[210,90,4],round:[125,125,4],desk:[120,65,1],chair:[40,38,1],officechair:[65,65,1],stool:[40,40,0],podium:[70,60,0],sparechair:[40,38,0],monitor:[75,30,0],keyboard:[50,20,0],teacher:[180,85,0],door:[90,90,0],window:[160,22,0],board:[240,28,0],shelf:[150,65,0],label:[160,36,0],plant:[90,90,0],lamp:[76,76,0],couch:[240,110,3],comfychair:[115,120,1],rug:[280,180,0],roundrug:[210,210,0],sink:[100,65,0],stovetop:[80,75,0],bookcart:[140,75,0],deskchair:[100,135,1],cabinet:[180,70,0],trashcan:[45,45,0],recyclebin:[38,65,0],laptop:[75,65,0],schoolsupplies:[150,65,0],printer:[95,85,0]};
    const [w,h,seats]=sizes[type],labels={table:'Table',round:'Round table',desk:'Desk',chair:'Chair',officechair:'Office chair',stool:'Stool',podium:'Podium',sparechair:'Spare chair',monitor:'Computer monitor',keyboard:'Keyboard',teacher:'Teacher desk',door:'Door',window:'Window',board:'Smart Board',shelf:'Bookshelf',label:'Custom text',plant:'',lamp:'',couch:'Couch',comfychair:'Comfy chair',rug:'Rectangular rug',roundrug:'Round rug',sink:'Sink',stovetop:'Stove top',bookcart:'Book push-cart',deskchair:'Attached desk-chair',cabinet:'Cabinet',trashcan:'Metal trashcan',recyclebin:'Recycle bin',laptop:'Laptop',schoolsupplies:'School supplies',printer:'Desktop printer'};
    const object={id:uid(),type,x,y,w,h,angle:0,seats,...(type==='trashcan'?{trashLevel:50}:{}),noAssign:['couch','comfychair','officechair'].includes(type),label:labels[type]};return {...object,...style(object)};
  }
  function snapObject(layout,object,{grid=false,objects=false,threshold=14}={}){
    if(grid){object.x=Math.round(object.x/25)*25;object.y=Math.round(object.y/25)*25;}
    if(!objects||!['desk','teacher','table'].includes(object.type))return null;
    let best=null;
    for(const other of layout.objects){
      if(other.id===object.id||!['desk','teacher','table'].includes(other.type)||Math.abs(((object.angle-other.angle+540)%360)-180)>.01)continue;
      const a=other.angle*Math.PI/180,dx=object.x-other.x,dy=object.y-other.y,lx=dx*Math.cos(a)+dy*Math.sin(a),ly=-dx*Math.sin(a)+dy*Math.cos(a);
      const candidates=[[(other.w+object.w)/2,0],[-(other.w+object.w)/2,0],[0,(other.h+object.h)/2],[0,-(other.h+object.h)/2]];
      for(const [x,y]of candidates){const distance=Math.hypot(lx-x,ly-y);if(distance<=threshold&&(!best||distance<best.distance))best={x:other.x+x*Math.cos(a)-y*Math.sin(a),y:other.y+x*Math.sin(a)+y*Math.cos(a),distance,otherId:other.id};}
    }
    if(best){object.x=best.x;object.y=best.y;}return best;
  }
  function chairs(layout){
    return layout.objects.flatMap(object=>{
      const count=object.seats||0,angle=object.angle*Math.PI/180;
      return Array.from({length:count},(_,i)=>{
        let x,y,chairAngle=0;
        if(['couch','comfychair'].includes(object.type)){const arm=object.w*.11;x=(i+.5)*(object.w-2*arm)/count-object.w/2+arm;y=object.h*.12;chairAngle=180;}else if(object.type==='officechair'){x=0;y=0;chairAngle=0;}else if(object.type==='deskchair'){x=0;y=object.h*.13;chairAngle=180;}else if(object.type==='round'){
          const t=-Math.PI/2+i*2*Math.PI/count;
          x=Math.cos(t)*(object.w/2+30);y=Math.sin(t)*(object.h/2+30);chairAngle=t*180/Math.PI+90;
        }else if(object.oneSide){x=(i+.5)*object.w/count-object.w/2;y=object.h/2+28;chairAngle=180;}else if(object.type==='chair'){x=0;y=0;}else if(count===1){x=0;y=object.h/2+28;chairAngle=180;}
        else{const upper=Math.ceil(count/2),top=i<upper,j=top?i:i-upper,n=top?upper:count-upper;x=(j+.5)*object.w/n-object.w/2;y=(top?-1:1)*(object.h/2+28);chairAngle=top?0:180;}
        const custom=object.chairs?.[i];if(custom){x=custom.x;y=custom.y;chairAngle=custom.angle;}
        return {id:object.id+':'+i,objectId:object.id,tableId:layout.tableGroups?.find(g=>g.members.includes(object.id))?.id||object.id,index:i,noAssign:object.noAssign===true||custom?.noAssign===true,angle:(chairAngle+object.angle+360)%360,w:custom?.w||40,h:custom?.h||38,x:object.x+x*Math.cos(angle)-y*Math.sin(angle),y:object.y+x*Math.sin(angle)+y*Math.cos(angle)};
      });
    });
  }
  function seats(layout){return chairs(layout).filter(s=>!s.noAssign);}
  function starter(count=24){
    const tables=Math.max(1,Math.ceil(Math.min(count,500)/4)),columns=Math.max(3,Math.ceil(Math.sqrt(tables))),rows=Math.ceil(tables/columns),width=Math.max(1000,columns*325);
    return {id:uid(),name:'Table groups',width,height:Math.max(750,rows*220+130),objects:[
      {id:uid(),type:'board',x:width/2,y:45,w:300,h:24,angle:0,seats:0,label:'Smart Board / Front'},
      ...Array.from({length:tables},(_,i)=>({id:uid(),type:'table',x:175+(i%columns)*325,y:190+Math.floor(i/columns)*220,w:210,h:90,angle:0,seats:4,label:'Table '+(i+1)})),
      {id:uid(),type:'label',x:width/2,y:Math.max(750,rows*220+130)-30,w:150,h:30,angle:0,seats:0,label:'Back'}
    ]};
  }
  function normalizeLayout(raw,options={}){
    if(!raw||!Array.isArray(raw.objects)||raw.objects.length>700)throw Error('Invalid room layout.');
    const seen=new Set();
    const layout={id:String(raw.id||uid()).slice(0,100),name:String(raw.name||'Room layout').slice(0,100),width:clamp(raw.width,500,12000),height:clamp(raw.height,400,12000),orientationTurn:raw.orientationTurn===1?1:0,floorColor:color(raw.floorColor,'#fafaf8'),floorPattern:['tile','plain','checker','wood','carpet'].includes(raw.floorPattern)?raw.floorPattern:'tile',tileSize:clamp(raw.tileSize||25,12,100),borderColor:color(raw.borderColor,'#475569'),borderWidth:clamp(raw.borderWidth===undefined?6:raw.borderWidth,1,20),objects:raw.objects.map(o=>{
      if(!o||!types.includes(o.type)||typeof o.id!=='string'||!o.id||o.id.length>100||seen.has(o.id))throw Error('Invalid or duplicate room object.');
      seen.add(o.id);
      return {id:o.id,type:o.type,x:clamp(o.x,0,12000),y:clamp(o.y,0,12000),w:clamp(o.w,30,700),h:clamp(o.h,20,700),angle:((Number(o.angle)||0)%360+360)%360,seats:o.type==='couch'?3:['comfychair','officechair'].includes(o.type)?1:['table','round','desk','deskchair','chair'].includes(o.type)?Math.round(clamp(o.seats||0,0,['chair','deskchair'].includes(o.type)?1:12)):0,label:String(o.label||'').slice(0,80),noAssign:o.noAssign===true||(['couch','comfychair','officechair'].includes(o.type)&&(!o.seats||o.noAssign===undefined)),oneSide:o.oneSide===true,...(o.type==='trashcan'?{trashLevel:clamp(o.trashLevel===undefined?(o.emptyTrash?0:50):o.trashLevel,0,100)}:{}),wall:['top','right','bottom','left'].includes(o.wall)&&['door','window'].includes(o.type)?o.wall:'',flipDoor:o.flipDoor===true,chairs:normalizeChairs(o.chairs),...style(o)};
    })};
    const ids=new Set(entities(layout).map(o=>o.id));
    layout.groups=normalizeGroups(raw.groups,ids);layout.tableGroups=normalizeGroups(raw.tableGroups,new Set(layout.objects.filter(o=>o.seats).map(o=>o.id)));
    layout.seatNumbers={};const numberEntries=Object.entries(raw.seatNumbers||{}),numberIds=new Set(numberEntries.length?seats(layout).map(s=>s.id):[]);for(const [id,n]of numberEntries)if(numberIds.has(id)&&Number.isInteger(n)&&n>0&&n<=9999)layout.seatNumbers[id]=n;layout.showSeatNumbers=raw.showSeatNumbers===true;if(layout.showSeatNumbers)numberSeats(layout);
    layout.prioritySeats=[...new Set(Array.isArray(raw.prioritySeats)?raw.prioritySeats:[])].filter(id=>seats(layout).some(s=>s.id===id));
    layout.width=round(layout.width);layout.height=round(layout.height);
    layout.objects.forEach(o=>{if(options.fit!==false)fitObject(layout,o);for(const key of ['x','y','w','h','angle'])o[key]=Math.round(o[key]*1e6)/1e6;});
    return layout;
  }
  function fitObject(layout,object){
    if(object.wall&&['door','window'].includes(object.type)){placeOpening(layout,object,object.wall);return object;}
    function extents(){
      const angle=object.angle*Math.PI/180,w=Math.abs(Math.cos(angle))*object.w/2+Math.abs(Math.sin(angle))*object.h/2,h=Math.abs(Math.sin(angle))*object.w/2+Math.abs(Math.cos(angle))*object.h/2;
      const points=['couch','comfychair','deskchair','officechair'].includes(object.type)?[]:chairs({objects:[object]}),left=Math.max(w,...points.map(s=>object.x-s.x+51)),right=Math.max(w,...points.map(s=>s.x-object.x+51)),top=Math.max(h,...points.map(s=>object.y-s.y+22)),bottom=Math.max(h,...points.map(s=>s.y-object.y+22));
      return {left,right,top,bottom};
    }
    let bounds=extents();
    for(let i=0;i<8&&(bounds.left+bounds.right>layout.width||bounds.top+bounds.bottom>layout.height);i++){
      object.w=Math.max(30,object.w*.85);object.h=Math.max(20,object.h*.85);bounds=extents();
    }
    object.x=clamp(object.x,bounds.left,layout.width-bounds.right);object.y=clamp(object.y,bounds.top,layout.height-bounds.bottom);
    return object;
  }
  function normalizeChart(raw,options={}){
    if(!raw||!Array.isArray(raw.roster)||raw.roster.length>500)throw Error('Invalid seating chart.');
    const layout=normalizeLayout(raw.layout,options),validSeats=new Set(seats(layout).map(s=>s.id));
    const roster=[...new Set(raw.roster.filter(n=>typeof n==='string'&&n.length&&n.length<=250))];
    const used=new Set(),assignments={};
    for(const [id,name]of Object.entries(raw.assignments||{}))if(validSeats.has(id)&&roster.includes(name)&&!used.has(name)){assignments[id]=name;used.add(name);}
    const chart={id:String(raw.id||uid()).slice(0,100),name:String(raw.name||'Seating chart').slice(0,100),classKey:String(raw.classKey||'').slice(0,10000),className:String(raw.className||'Class').slice(0,100),layout,roster,assignments,
      priorityStudents:(Array.isArray(raw.priorityStudents)?raw.priorityStudents:[]).filter(n=>roster.includes(n)),
      prioritySeats:(Array.isArray(raw.prioritySeats)?raw.prioritySeats:layout.prioritySeats).filter(id=>validSeats.has(id)),
      lockedStudents:(Array.isArray(raw.lockedStudents)?raw.lockedStudents:[]).filter(n=>used.has(n)),
      lockedGroups:(Array.isArray(raw.lockedGroups)?raw.lockedGroups:[]).filter(id=>(layout.objects.some(o=>o.id===id)||layout.tableGroups.some(g=>g.id===id))),orientation:raw.orientation===180?180:0,respectGroupingRules:raw.respectGroupingRules!==false,respectEmptySeats:raw.respectEmptySeats!==false,respectPrioritySeating:raw.respectPrioritySeating!==false,respectLockedSeats:raw.respectLockedSeats!==false,showLayoutTitle:raw.showLayoutTitle!==false,showEmptySeats:raw.showEmptySeats===true,nameMode:['first','last','both'].includes(raw.nameMode)?raw.nameMode:'app'};
    return chart;
  }
  function lockedSeat(chart,seat){return (chart.lockedGroups.includes(seat.tableId)||chart.lockedGroups.includes(seat.objectId))||chart.lockedStudents.includes(chart.assignments[seat.id]);}
  function shuffled(items,randomInt){const out=items.slice();for(let i=out.length-1;i>0;i--){const j=randomInt(i+1);[out[i],out[j]]=[out[j],out[i]];}return out;}
  function randomize(chart,randomInt,mode='all',groups=[],rules={},options={}){
    if(options.respectPrioritySeating===false||options.respectLockedSeats===false)chart={...chart,...(options.respectPrioritySeating===false?{priorityStudents:[],prioritySeats:[]}:{}),...(options.respectLockedSeats===false?{lockedStudents:[],lockedGroups:[]}: {})};
    const occupiedOnly=mode==='occupied'||options.respectEmptySeats===true;
    const all=seats(chart.layout).filter(s=>!occupiedOnly||chart.assignments[s.id]),priority=new Set(chart.priorityStudents),prioritySeats=new Set(chart.prioritySeats),assignments={};
    all.filter(s=>lockedSeat(chart,s)).forEach(s=>{if(chart.assignments[s.id])assignments[s.id]=chart.assignments[s.id];});
    const fixed=new Set(Object.values(assignments)),remaining=chart.roster.filter(n=>!fixed.has(n)&&(!occupiedOnly||Object.values(chart.assignments).includes(n))),available=all.filter(s=>!lockedSeat(chart,s));
    const marker=chart.layout.objects.find(o=>o.type==='label'&&/^front$/i.test(o.label.trim()))||chart.layout.objects.find(o=>o.type==='board');const front=marker?[['top',marker.y/chart.layout.height],['bottom',1-marker.y/chart.layout.height],['left',marker.x/chart.layout.width],['right',1-marker.x/chart.layout.width]].sort((a,b)=>a[1]-b[1])[0][0]:'top';
    const depth=s=>front==='top'?s.y:front==='bottom'?chart.layout.height-s.y:front==='left'?s.x:chart.layout.width-s.x;
    const frontOrder=slots=>slots.slice().sort((a,b)=>depth(a)-depth(b)||(front==='top'||front==='bottom'?a.x-b.x:a.y-b.y));
    const anywhere=options.randomSeatLocations===true&&!occupiedOnly,seatOrder=slots=>anywhere?shuffled(slots,randomInt):frontOrder(slots);
    const put=(names,slots)=>{
      const alphabetic=['alpha','alpha-first','alpha-last'].includes(mode),key=name=>{if(mode==='alpha')return name;const text=name.trim(),comma=text.indexOf(',');let first,last;if(comma>=0){last=text.slice(0,comma).trim();first=text.slice(comma+1).trim();}else{const parts=text.split(/\s+/);last=parts.length>1?parts.pop():'';first=parts.join(' ');}return mode==='alpha-last'?(last||first)+' '+first:first+' '+last;};
      const order=items=>alphabetic?items.slice().sort((a,b)=>key(a).localeCompare(key(b),undefined,{numeric:true,sensitivity:'base'})):shuffled(items,randomInt);
      const high=order(names.filter(n=>priority.has(n))),regular=order(names.filter(n=>!priority.has(n)));
      const preferred=seatOrder(slots.filter(s=>prioritySeats.has(s.id))),other=seatOrder(slots.filter(s=>!prioritySeats.has(s.id)));
      for(const name of high){const slot=preferred.shift()||other.shift();if(slot)assignments[slot.id]=name;}
      const rest=anywhere?shuffled([...preferred,...other],randomInt):[...preferred,...other];for(const name of regular){const slot=rest.shift();if(slot)assignments[slot.id]=name;}
    };
    if(mode==='within'){
      for(const id of new Set(all.map(s=>s.tableId))){const slots=available.filter(s=>s.tableId===id),names=slots.map(s=>chart.assignments[s.id]).filter(n=>remaining.includes(n));put(names,slots);}
    }else if(mode==='groups'){
      const teams=groups.map(g=>g.filter(n=>remaining.includes(n))).filter(g=>g.length);
      const covered=new Set(teams.flat());if(remaining.some(n=>!covered.has(n)))return {error:'The current groups do not cover this chart roster. Sync the class or use Randomize seats.'};
      const tables=shuffled([...new Set(all.map(s=>s.tableId))],randomInt).map(id=>({id,slots:available.filter(s=>s.tableId===id)}));
      const fixedTable=new Map();for(const s of all)if(assignments[s.id])fixedTable.set(assignments[s.id],s.tableId);
      const tasks=teams.map(names=>{const team=groups.find(g=>g.includes(names[0]))||names;const pinned=[...new Set(team.filter(n=>fixedTable.has(n)).map(n=>fixedTable.get(n)))];return {names,team,pinned,priority:names.filter(n=>priority.has(n)).length};});
      if(tasks.some(t=>t.pinned.length>1))return {error:'Locked members of a group occupy different tables. Unlock or move them before seating groups together.'};
      tasks.sort((a,b)=>b.pinned.length-a.pinned.length||b.priority-a.priority||b.names.length-a.names.length);
      let visits=0;const matches=[];
      function match(i,used){if(i===tasks.length)return true;if(++visits>20000)return false;const task=tasks[i];for(const table of tables){if(used.has(table.id)||table.slots.length<task.names.length||(task.pinned.length&&task.pinned[0]!==table.id)||[...fixedTable].some(([name,id])=>id===table.id&&!task.team.includes(name))||table.slots.filter(s=>prioritySeats.has(s.id)).length<task.priority)continue;used.add(table.id);matches[i]=table;if(match(i+1,used))return true;used.delete(table.id);}return false;}
      if(!match(0,new Set()))return {error:'Cannot seat these groups together with the current table sizes, locks, and priority seats. Add seats, mark more priority seats, or adjust locks.'};
      tasks.forEach((task,i)=>put(task.names,matches[i].slots));
    }else put(remaining,available);
    if((rules.togetherRaw?.length||rules.apartPairs?.length)&&mode!=='groups'){
      const result=seatWithRules(chart,all,assignments,rules,mode,seatOrder,put);
      if(result)return {error:result};
    }
    const seated=new Set(Object.values(assignments)),unseated=chart.roster.filter(n=>!seated.has(n));
    const unmet=chart.priorityStudents.filter(n=>!Object.entries(assignments).some(([id,name])=>name===n&&prioritySeats.has(id)));
    return {assignments,unseated,unmet};
  }
  // Rules use the same table/table-group boundaries as Shuffle within tables.
  function ruleWarnings(chart,rules={}){
    const where=new Map(seats(chart.layout).filter(s=>chart.assignments[s.id]).map(s=>[chart.assignments[s.id],s.tableId])),warnings=[];
    for(const line of rules.togetherRaw||[]){const present=line.filter(n=>where.has(n));if(new Set(present.map(n=>where.get(n))).size>1)warnings.push(present.join(' and ')+' should sit together at one table or table group.');}
    for(const [a,b]of rules.apartPairs||[])if(where.has(a)&&where.get(a)===where.get(b))warnings.push(a+' and '+b+' should sit at different tables or table groups.');
    return [...new Set(warnings)];
  }
  function seatWithRules(chart,all,assignments,rules,mode,frontOrder,put){
    const failure='Cannot satisfy grouping rules with these seats and locks. Together students need one table or table group; apart students need different tables. Adjust the rules, table groups, or locks.';
    if(rules.contradictions?.length)return failure;
    const names=Object.values(assignments),active=new Set(names),parent=new Map(names.map(n=>[n,n]));
    const find=n=>parent.get(n)===n?n:find(parent.get(n));
    for(const line of rules.togetherRaw||[]){if(line.some(n=>active.has(n))&&line.some(n=>!active.has(n)))return failure;const members=line.filter(n=>active.has(n));for(const n of members.slice(1))parent.set(find(n),find(members[0]));}
    const bundles=new Map();for(const n of names){const root=find(n);if(!bundles.has(root))bundles.set(root,[]);bundles.get(root).push(n);}
    const apart=new Map([...bundles.keys()].map(k=>[k,new Set()]));for(const [a,b]of rules.apartPairs||[])if(active.has(a)&&active.has(b)){const x=find(a),y=find(b);if(x===y)return failure;apart.get(x).add(y);apart.get(y).add(x);}
    const fixed=all.filter(s=>lockedSeat(chart,s)&&chart.assignments[s.id]),free=all.filter(s=>!lockedSeat(chart,s)),tables=[...new Set(frontOrder(all).map(s=>s.tableId))],capacity=new Map(tables.map(id=>[id,free.filter(s=>s.tableId===id).length])),pinned=new Map(fixed.map(s=>[chart.assignments[s.id],s.tableId]));
    const tasks=[...bundles].map(([id,members])=>({id,members,moving:members.filter(n=>!pinned.has(n)),allowed:tables.filter(t=>members.every(n=>(!pinned.has(n)||pinned.get(n)===t)&&(mode!=='within'||all.find(s=>chart.assignments[s.id]===n)?.tableId===t)))}));
    tasks.sort((a,b)=>a.allowed.length-b.allowed.length||b.members.filter(n=>chart.priorityStudents.includes(n)).length-a.members.filter(n=>chart.priorityStudents.includes(n)).length||b.members.length-a.members.length||apart.get(b.id).size-apart.get(a.id).size);
    let visits=0;const chosen=new Map(),priorityCapacity=new Map(tables.map(t=>[t,free.filter(s=>s.tableId===t&&chart.prioritySeats.includes(s.id)).length]));
    function search(i){if(i===tasks.length)return true;if(++visits>50000)return false;const task=tasks[i];const candidates=task.allowed.slice().sort((a,b)=>{const priorityCount=task.moving.filter(n=>chart.priorityStudents.includes(n)).length;const score=t=>Math.min(priorityCount,priorityCapacity.get(t));return score(b)-score(a);});for(const t of candidates){if(capacity.get(t)<task.moving.length||[...apart.get(task.id)].some(id=>chosen.get(id)===t))continue;const prior=priorityCapacity.get(t),need=task.moving.filter(n=>chart.priorityStudents.includes(n)).length;chosen.set(task.id,t);capacity.set(t,capacity.get(t)-task.moving.length);priorityCapacity.set(t,Math.max(0,prior-need));if(search(i+1))return true;capacity.set(t,capacity.get(t)+task.moving.length);priorityCapacity.set(t,prior);chosen.delete(task.id);}return false;}
    if(!search(0))return failure;
    for(const id of Object.keys(assignments))delete assignments[id];for(const s of fixed)assignments[s.id]=chart.assignments[s.id];
    for(const t of tables)put(tasks.filter(task=>chosen.get(task.id)===t).flatMap(task=>task.moving),free.filter(s=>s.tableId===t));
    return '';
  }
  function numberSeats(layout,reset=false,pattern='rows'){
    const slots=seats(layout),marker=layout.objects.find(o=>o.type==='label'&&/^front$/i.test(o.label.trim()))||layout.objects.find(o=>o.type==='board'),front=marker?[['top',marker.y/layout.height],['bottom',1-marker.y/layout.height],['left',marker.x/layout.width],['right',1-marker.x/layout.width]].sort((a,b)=>a[1]-b[1])[0][0]:'top',depth=s=>front==='top'?s.y:front==='bottom'?layout.height-s.y:front==='left'?s.x:layout.width-s.x;
    const cross=s=>front==='top'||front==='bottom'?s.x:s.y;
    let ordered=slots.slice().sort((a,b)=>depth(a)-depth(b)||cross(a)-cross(b));
    if(pattern==='tables'){
      const tables=[...new Set(ordered.map(s=>s.tableId))].map(id=>{const members=slots.filter(s=>s.tableId===id),x=members.reduce((n,s)=>n+s.x,0)/members.length,y=members.reduce((n,s)=>n+s.y,0)/members.length;return {members,x,y};}).sort((a,b)=>depth(a)-depth(b)||cross(a)-cross(b));
      ordered=tables.flatMap(t=>t.members.sort((a,b)=>{const angle=s=>(Math.atan2(s.y-t.y,s.x-t.x)+Math.PI/2+Math.PI*2)%(Math.PI*2);return angle(a)-angle(b);}));
    }else if(pattern!=='rows'){
      const columns=pattern.startsWith('columns')||pattern.startsWith('snake-columns'),primary=columns?cross:depth,secondary=columns?depth:cross,lines=[];
      const tolerance=Math.max(8,Math.min(...slots.map(s=>Math.min(s.w,s.h)))*.55);
      for(const slot of slots.slice().sort((a,b)=>primary(a)-primary(b)||secondary(a)-secondary(b))){let line=lines.at(-1);if(!line||Math.abs(primary(slot)-line.position)>tolerance){line={position:primary(slot),members:[]};lines.push(line);}line.members.push(slot);}
      ordered=lines.flatMap((line,i)=>{const reverse=pattern.endsWith('reverse')!== (pattern.startsWith('snake')&&i%2===1);return line.members.sort((a,b)=>(secondary(a)-secondary(b))*(reverse?-1:1));});
    }
    const numbers=reset?{}:{...layout.seatNumbers},used=new Set(Object.values(numbers));let n=1;for(const slot of ordered){if(numbers[slot.id])continue;while(used.has(n))n++;numbers[slot.id]=n;used.add(n++);}layout.seatNumbers=numbers;return numbers;
  }
  function reorderSeatNumbers(layout,source,target){
    numberSeats(layout);const numbers=layout.seatNumbers;if(source===target||!numbers[source]||!numbers[target])return;[numbers[source],numbers[target]]=[numbers[target],numbers[source]];
  }
  function moveStudent(chart,name,targetId){
    const all=seats(chart.layout),target=all.find(s=>s.id===targetId),source=all.find(s=>chart.assignments[s.id]===name);
    if(!chart.roster.includes(name)||!target)return 'Choose a valid student and seat.';
    if((source&&lockedSeat(chart,source))||lockedSeat(chart,target))return 'Unlock the student or table before moving this assignment.';
    const other=chart.assignments[targetId];
    if(source){if(other)chart.assignments[source.id]=other;else delete chart.assignments[source.id];}
    // An unseated student replaces the occupant; the previous occupant returns to the roster.
    chart.assignments[targetId]=name;
    return '';
  }

  // Chairs are stored relative to their parent, so moving or rotating furniture carries them.
  function normalizeChairs(raw){const out={};for(const [key,c]of Object.entries(raw||{}))if(/^\d+$/.test(key)&&Number(key)<12&&c)out[key]={x:clamp(c.x,-1000,1000),y:clamp(c.y,-1000,1000),angle:clamp(c.angle,-720,720),w:clamp(c.w||40,20,300),h:clamp(c.h||38,20,300),label:String(c.label||'Chair').slice(0,80),noAssign:c.noAssign===true,...style({...c,type:'chair'})};return out;}
  function normalizeGroups(raw,ids){const used=new Set();return (Array.isArray(raw)?raw:[]).slice(0,700).map(g=>({id:String(g.id||uid()).slice(0,100),name:String(g.name||'Table group').slice(0,80),members:[...new Set(g.members||[])].filter(id=>ids.has(id)&&!used.has(id))})).filter(g=>{if(g.members.length<2)return false;g.members.forEach(id=>used.add(id));return true;});}
  function entities(layout){return [...layout.objects,...chairs(layout).filter(s=>layout.objects.find(o=>o.id===s.objectId)?.type!=='chair').map(s=>({...s,type:'chair',parentId:s.objectId,seats:0,label:layout.objects.find(o=>o.id===s.objectId)?.chairs?.[s.index]?.label||'Chair',...style({...layout.objects.find(o=>o.id===s.objectId)?.chairs?.[s.index],type:'chair'})}))];}
  function entity(layout,id){return entities(layout).find(o=>o.id===id);}
  function setEntity(layout,id,values){const object=layout.objects.find(o=>o.id===id);if(object){Object.assign(object,values);return;}const chair=entity(layout,id);if(!chair)return;const parent=layout.objects.find(o=>o.id===chair.parentId),next={...chair,...values},a=parent.angle*Math.PI/180,dx=next.x-parent.x,dy=next.y-parent.y;parent.chairs=parent.chairs||{};parent.chairs[chair.index]={x:dx*Math.cos(a)+dy*Math.sin(a),y:-dx*Math.sin(a)+dy*Math.cos(a),angle:next.angle-parent.angle,w:next.w,h:next.h,label:next.label,noAssign:next.noAssign===true,...style(next)};}
  function selection(layout,ids){let out=[...new Set(ids)].filter(id=>entity(layout,id));for(const group of layout.groups||[])if(group.members.some(id=>out.includes(id)))out=[...new Set([...out,...group.members])];return out;}
  function bounds(layout,ids){
    const items=ids.map(id=>entity(layout,id)).filter(Boolean);if(items.length===1)return copy(items[0]);if(!items.length)return null;
    // Measure in the first item's rotating frame so the group's center and dimensions stay stable.
    const angle=items[0].angle,a=angle*Math.PI/180,c=Math.cos(a),s=Math.sin(a),points=items.flatMap(o=>{const b=o.angle*Math.PI/180;return [[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>{const px=o.x+x*o.w/2*Math.cos(b)-y*o.h/2*Math.sin(b),py=o.y+x*o.w/2*Math.sin(b)+y*o.h/2*Math.cos(b);return {x:px*c+py*s,y:-px*s+py*c};});});
    const left=Math.min(...points.map(p=>p.x)),right=Math.max(...points.map(p=>p.x)),top=Math.min(...points.map(p=>p.y)),bottom=Math.max(...points.map(p=>p.y)),x=(left+right)/2,y=(top+bottom)/2;return {x:x*c-y*s,y:x*s+y*c,w:right-left,h:bottom-top,angle};
  }

  function transform(layout,ids,from,to){const a=from.angle*Math.PI/180,b=to.angle*Math.PI/180,sx=to.w/from.w,sy=to.h/from.h,items=ids.map(id=>entity(layout,id)).filter(Boolean).filter(o=>!o.parentId||!ids.includes(o.parentId));for(const o of items){const dx=o.x-from.x,dy=o.y-from.y,x=(dx*Math.cos(a)+dy*Math.sin(a))*sx,y=(-dx*Math.sin(a)+dy*Math.cos(a))*sy;setEntity(layout,o.id,{x:to.x+x*Math.cos(b)-y*Math.sin(b),y:to.y+x*Math.sin(b)+y*Math.cos(b),w:o.w*sx,h:o.h*sy,angle:(o.angle+to.angle-from.angle+720)%360,...(o.wall?{wall:''}:{})});if(o.chairs){const parent=layout.objects.find(p=>p.id===o.id);for(const c of Object.values(parent.chairs)){c.x*=sx;c.y*=sy;c.w*=sx;c.h*=sy;}}}}
  function group(layout,ids,table=false){const members=selection(layout,ids);if(members.length<2)return;layout.groups=(layout.groups||[]).filter(g=>!g.members.some(id=>members.includes(id)));layout.groups.push({id:uid(),name:'Objects',members});if(table){const parents=[...new Set(members.map(id=>entity(layout,id)).filter(o=>o?.seats).map(o=>o.id))];if(parents.length>1){layout.tableGroups=(layout.tableGroups||[]).filter(g=>!g.members.some(id=>parents.includes(id)));layout.tableGroups.push({id:uid(),name:uniqueGroupName('Table group 1',(layout.tableGroups||[]).map(g=>g.name)),members:parents});}}}
  function ungroup(layout,ids){layout.groups=(layout.groups||[]).filter(g=>!g.members.some(id=>ids.includes(id)));layout.tableGroups=(layout.tableGroups||[]).filter(g=>!g.members.some(id=>ids.includes(id)));}
  function placeOpening(layout,object,wall){object.wall=wall;if(!wall)return;const horizontal=wall==='top'||wall==='bottom',half=object.type==='door'?object.h/2:0;object.angle=wall==='top'?(object.type==='door'?180:0):wall==='right'?(object.type==='door'?270:90):wall==='left'?90:0;if(horizontal){object.x=clamp(object.x,object.w/2,layout.width-object.w/2);object.y=wall==='top'?half:layout.height-half;}else{object.y=clamp(object.y,object.w/2,layout.height-object.w/2);object.x=wall==='left'?half:layout.width-half;}}
  function snapOpening(layout,object,threshold=35){if(!['door','window'].includes(object.type))return;const distances=[['top',object.y],['bottom',layout.height-object.y],['left',object.x],['right',layout.width-object.x]].sort((a,b)=>a[1]-b[1]);const [wall,d]=distances[0];if(d<Math.max(threshold,object.type==='door'?object.h/2+threshold:threshold))placeOpening(layout,object,wall);else object.wall='';}

  function rotateRoom(layout,clockwise=true){const {width,height}=layout;layout.width=height;layout.height=width;for(const o of layout.objects){const {x,y}=o;o.x=clockwise?height-y:y;o.y=clockwise?x:width-x;o.angle=(o.angle+(clockwise?90:270))%360;if(o.wall)o.wall=(clockwise?{top:'right',right:'bottom',bottom:'left',left:'top'}:{top:'left',left:'bottom',bottom:'right',right:'top'})[o.wall];}}
  function reorder(layout,ids,direction){const parents=new Set(ids.map(id=>entity(layout,id)).filter(Boolean).map(o=>o.parentId||o.id)),items=layout.objects;if(direction==='top'||direction==='bottom'){const picked=items.filter(o=>parents.has(o.id)),rest=items.filter(o=>!parents.has(o.id));layout.objects=direction==='top'?[...rest,...picked]:[...picked,...rest];}else if(direction==='up'){for(let i=items.length-2;i>=0;i--)if(parents.has(items[i].id)&&!parents.has(items[i+1].id))[items[i],items[i+1]]=[items[i+1],items[i]];}else{for(let i=1;i<items.length;i++)if(parents.has(items[i].id)&&!parents.has(items[i-1].id))[items[i],items[i-1]]=[items[i-1],items[i]];}}

  function uniqueGroupName(name,names){const used=new Set(names),original=String(name||'Table group');if(!used.has(original))return original;const numbered=original.match(/^Table group \d+$/i);if(numbered){let n=1;while(used.has('Table group '+n))n++;return 'Table group '+n;}const base=original.replace(/ \(\d+\)$/,'');let n=2;while(used.has(base+' ('+n+')'))n++;return base+' ('+n+')';}
  function createTemplate(kind,{portrait=false,rows=4,columns=6,groups=6,members=4,count=24,layers=1,groupGrid=false,oneSide=false,shape=portrait?'portrait':'landscape',roomWidth=1000,roomHeight=750}={}){
    if(!['empty','grid','tables','deskGroups','stadium','horseshoe','circle'].includes(kind))throw Error('Unknown template.');
    rows=Math.round(clamp(rows,1,8));columns=Math.round(clamp(columns,1,8));groups=Math.round(clamp(groups,1,12));members=Math.round(clamp(members,2,8));count=Math.round(clamp(count,['horseshoe','circle'].includes(kind)?2:4,kind==='horseshoe'?40:60));
    layers=Math.round(clamp(layers,1,3));if(groupGrid&&(kind==='tables'||kind==='deskGroups')){groups=rows*columns;}
    if(!['portrait','landscape','square','custom'].includes(shape))shape=portrait?'portrait':'landscape';portrait=shape==='portrait';
    let width=shape==='custom'?clamp(roomWidth,500,12000):portrait?750:1000,height=shape==='custom'?clamp(roomHeight,400,12000):portrait?1000:shape==='square'?1000:750,objects=[],deskGroups=[];
    const fit=(w,h)=>{width=Math.max(width,w);height=Math.max(height,h);if(shape==='square')width=height=Math.max(width,height);else if(shape==='portrait')height=Math.max(height,width*1.25);else if(shape==='landscape')width=Math.max(width,height*1.25);width=Math.ceil(width/25)*25;height=Math.ceil(height/25)*25;};
    if(kind==='grid'||kind==='stadium'){fit(columns*170+110+(kind==='stadium'?140:0),rows*155+160);for(let r=0;r<rows;r++)for(let c=0;c<columns;c++){const o=createObject('desk',width/2+(c-(columns-1)/2)*170,160+r*155);if(kind==='stadium'){const side=Math.sign(c-(columns-1)/2);o.y+=Math.abs(c-(columns-1)/2)*15;o.angle=side*-15;}objects.push(o);}}
    if(kind==='tables'){const cols=groupGrid?columns:Math.ceil(Math.sqrt(groups*(portrait?0.65:1.4))),rs=groupGrid?rows:Math.ceil(groups/cols),w=Math.max(210,(oneSide?members:Math.ceil(members/2))*80);fit(cols*(w+110)+80,rs*220+130);for(let i=0;i<groups;i++){const o=createObject('table',width/2+((i%cols)-(cols-1)/2)*(w+110),180+Math.floor(i/cols)*220);o.w=w;o.seats=members;o.oneSide=oneSide;o.label='Table group '+(i+1);objects.push(o);}}
    if(kind==='deskGroups'){const cols=groupGrid?columns:Math.ceil(Math.sqrt(groups)),rs=Math.ceil(groups/cols),deskCols=oneSide?members:Math.ceil(members/2),w=deskCols*120,stepX=w+120,stepY=310;fit(cols*stepX+80,rs*stepY+130);for(let i=0;i<groups;i++){const ids=[],cx=width/2+((i%cols)-(cols-1)/2)*stepX,cy=210+Math.floor(i/cols)*stepY;for(let k=0;k<members;k++){const o=createObject('desk',cx+(k%deskCols-(deskCols-1)/2)*120,cy+(oneSide?0:k<deskCols?-32.5:32.5));o.angle=oneSide?0:k<deskCols?180:0;objects.push(o);ids.push(o.id);}deskGroups.push(ids);}}
    if(kind==='circle'||kind==='horseshoe'){const span=kind==='circle'?2*Math.PI:Math.PI*1.35,base=Math.max(270,count*155/span),rings=layers,outer=base+(rings-1)*190;fit(outer*2+220,outer*2+240);for(let layer=0;layer<rings;layer++)for(let i=0;i<count;i++){const radius=base+layer*190,t=kind==='circle'?-Math.PI/2+i*span/count:-Math.PI*.175+i*span/(count-1),o=createObject('desk',width/2+Math.cos(t)*radius,height/2+30+Math.sin(t)*radius);o.angle=Math.round((t*180/Math.PI-90)/15)*15;objects.push(o);}}
    if(kind!=='empty')objects.unshift(createObject('board',width/2,40));
    const layout=normalizeLayout({id:uid(),name:{empty:'Empty layout',grid:'Desk grid',tables:'Table groups',deskGroups:'Desk groups',stadium:'Stadium seating',horseshoe:'Horseshoe',circle:'Discussion circle'}[kind],width,height,objects});for(const ids of deskGroups)group(layout,ids,true);return layout;
  }
  const api={createTemplate,uniqueGroupName,chairs,rotateRoom,reorder,entities,entity,setEntity,selection,bounds,transform,group,ungroup,placeOpening,snapOpening,copy,uid,clamp,types,fonts,style,createObject,snapObject,seats,starter,fitObject,normalizeLayout,normalizeChart,lockedSeat,randomize,ruleWarnings,numberSeats,reorderSeatNumbers,moveStudent};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.SeatingEngine=api;
})(globalThis);
