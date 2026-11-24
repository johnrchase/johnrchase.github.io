const {test}=require('node:test');
const assert=require('node:assert/strict');
const E=require('./seating-engine.js');
const random=n=>Math.floor(Math.random()*n);
function make(count=8){
  return E.normalizeChart({name:'Test chart',classKey:'class-a',className:'Class A',layout:E.starter(count),roster:Array.from({length:count},(_,i)=>'Student '+i),assignments:{},priorityStudents:[],prioritySeats:[],lockedStudents:[],lockedGroups:[]});
}
function assign(chart){chart.assignments=E.randomize(chart,random).assignments;return chart;}
test('randomization seats each student once and fills priority seats first',()=>{
  for(let i=0;i<40;i++){
    const c=make(),slots=E.seats(c.layout);c.priorityStudents=c.roster.slice(0,2);c.prioritySeats=slots.slice(-2).map(s=>s.id);
    const result=E.randomize(c,random);
    assert.equal(new Set(Object.values(result.assignments)).size,8);
    assert.equal(result.unmet.length,0);assert.equal(result.unseated.length,0);
    assert(c.prioritySeats.every(id=>c.priorityStudents.includes(result.assignments[id])));
  }
});
test('individual and group locks preserve assignments while the rest can move',()=>{
  const c=assign(make(12)),slots=E.seats(c.layout);c.lockedStudents=[c.assignments[slots[0].id]];c.lockedGroups=[slots[4].objectId];
  const fixed=slots.filter(s=>E.lockedSeat(c,s));let changed=false;
  for(let i=0;i<30;i++){const result=E.randomize(c,random);for(const s of fixed)assert.equal(result.assignments[s.id],c.assignments[s.id]);if(JSON.stringify(result.assignments)!==JSON.stringify(c.assignments))changed=true;}
  assert(changed);
});
test('locked empty table seats remain empty and capacity shortages are reported',()=>{
  const c=make();const slots=E.seats(c.layout);c.lockedGroups=[slots[0].objectId];c.priorityStudents=[c.roster[0]];c.prioritySeats=slots.slice(0,4).map(s=>s.id);
  const result=E.randomize(c,random);assert.equal(result.unseated.length,4);assert.equal(result.unmet.length,1);
  for(const s of slots.slice(0,4))assert.equal(result.assignments[s.id],undefined);
});
test('within-table shuffle retains table membership and locked students',()=>{
  const c=assign(make()),slots=E.seats(c.layout);c.lockedStudents=[c.assignments[slots[0].id]];const result=E.randomize(c,random,'within');
  for(const o of c.layout.objects){const ids=slots.filter(s=>s.objectId===o.id).map(s=>s.id);assert.deepEqual(ids.map(id=>c.assignments[id]).filter(Boolean).sort(),ids.map(id=>result.assignments[id]).filter(Boolean).sort());}
  assert.equal(result.assignments[slots[0].id],c.assignments[slots[0].id]);
});
test('group allocation respects priority seats and pinned group members',()=>{
  const c=make(),slots=E.seats(c.layout),groups=[c.roster.slice(0,4),c.roster.slice(4)];
  c.assignments[slots[4].id]=groups[0][0];c.lockedStudents=[groups[0][0]];c.priorityStudents=[groups[0][1]];c.prioritySeats=[slots[5].id];
  const result=E.randomize(c,random,'groups',groups);assert(!result.error);assert.equal(result.assignments[slots[4].id],groups[0][0]);assert.equal(result.assignments[slots[5].id],groups[0][1]);
  assert.deepEqual(slots.slice(4).map(s=>result.assignments[s.id]).sort(),groups[0].slice().sort());
});
test('fully fixed groups do not share their table with other groups',()=>{
  const c=make(4);c.layout=E.starter(8);const slots=E.seats(c.layout),groups=[c.roster.slice(0,2),c.roster.slice(2)];
  c.assignments={[slots[0].id]:groups[0][0],[slots[1].id]:groups[0][1]};c.lockedStudents=groups[0].slice();
  const result=E.randomize(c,random,'groups',groups);assert(!result.error);assert(slots.slice(0,4).every(s=>!groups[1].includes(result.assignments[s.id])));
});
test('infeasible groups fail without changing the chart',()=>{
  const c=assign(make()),before=E.copy(c),result=E.randomize(c,random,'groups',[c.roster.slice(0,5),c.roster.slice(5)]);
  assert(result.error);assert.deepEqual(c,before);
});
test('manual moves swap occupants and reject locked destinations',()=>{
  const c=assign(make()),slots=E.seats(c.layout),a=c.assignments[slots[0].id],b=c.assignments[slots[1].id];
  assert.equal(E.moveStudent(c,a,slots[1].id),'');assert.equal(c.assignments[slots[0].id],b);assert.equal(c.assignments[slots[1].id],a);
  c.lockedStudents=[b];const before=E.copy(c);assert(E.moveStudent(c,a,slots[0].id));assert.deepEqual(c,before);
});
test('rotated furniture and its seats stay inside resized room bounds',()=>{
  const layout=E.starter(4);layout.width=500;layout.height=400;const table=layout.objects.find(o=>o.seats);table.x=0;table.y=0;table.angle=45;table.w=700;table.h=500;
  const normalized=E.normalizeLayout(layout);for(const seat of E.seats(normalized)){assert(seat.x-51>=0);assert(seat.y-22>=0);assert(seat.x+51<=normalized.width);assert(seat.y+22<=normalized.height);}
});
test('imports reject duplicate objects and remove stale or duplicate assignments',()=>{
  const c=assign(make()),slots=E.seats(c.layout);c.assignments[slots[1].id]=c.assignments[slots[0].id];c.assignments.fake='Student 0';
  const normalized=E.normalizeChart(c);assert.equal(new Set(Object.values(normalized.assignments)).size,Object.keys(normalized.assignments).length);assert(!normalized.assignments.fake);
  c.layout.objects.push(c.layout.objects[0]);assert.throws(()=>E.normalizeChart(c));
});
test('new round tables are circles and furniture has distinct wood defaults',()=>{
  const round=E.createObject('round',200,200),desk=E.createObject('desk',400,200),teacher=E.createObject('teacher',400,400);
  assert.equal(round.w,round.h);assert.equal(round.texture,'wood');assert.equal(desk.texture,'wood');assert.equal(teacher.texture,'wood');
  assert.equal(new Set([round.fill,desk.fill,teacher.fill]).size,3);
});
test('object snapping joins desk edges, including rotated desks',()=>{
  for(const angle of [0,45,90]){
    const a=E.createObject('desk',300,300),b=E.createObject('desk',300,300);a.angle=b.angle=angle;
    const r=angle*Math.PI/180;b.x+=Math.cos(r)*(a.w+7);b.y+=Math.sin(r)*(a.w+7);
    const layout={objects:[a,b]};const result=E.snapObject(layout,b,{objects:true});assert(result);assert.equal(result.otherId,a.id);assert(Math.abs(Math.hypot(b.x-a.x,b.y-a.y)-a.w)<.001);
  }
});
test('grid and object snapping can be disabled independently',()=>{
  const a=E.createObject('desk',300,300),b=E.createObject('desk',426.5,302.5),layout={objects:[a,b]};
  E.snapObject(layout,b,{});assert.equal(b.x,426.5);assert.equal(b.y,302.5);
  E.snapObject(layout,b,{grid:true});assert.equal(b.x,425);assert.equal(b.y,300);
  E.snapObject(layout,b,{objects:true});assert.equal(b.x,420);assert.equal(b.y,300);
});
test('object appearance and room border settings survive chart normalization',()=>{
  const chart=make(),object=chart.layout.objects.find(o=>o.type==='table');
  Object.assign(object,{fill:'#123456',texture:'speckle',stroke:'#abcdef',strokeWidth:5,strokeStyle:'dashed',fontFamily:'Georgia',fontSize:28,bold:true,fontColor:'#fedcba'});
  chart.layout.borderColor='#456789';chart.layout.borderWidth=12;
  const restored=E.normalizeChart(JSON.parse(JSON.stringify(chart))),actual=restored.layout.objects.find(o=>o.id===object.id);
  for(const key of ['fill','texture','stroke','strokeWidth','strokeStyle','fontFamily','fontSize','bold','fontColor'])assert.equal(actual[key],object[key]);
  assert.equal(restored.layout.borderColor,'#456789');assert.equal(restored.layout.borderWidth,12);
});
test('appearance validation rejects injected colors and unsupported fonts',()=>{
  const object=E.createObject('desk',200,200);Object.assign(object,{fill:'url(https://example.com)',stroke:'red" onload="alert(1)',fontFamily:'bad-font',texture:'bad',fontSize:1000});
  const safe=E.style(object);assert.equal(safe.fill,'#e3c28b');assert.equal(safe.stroke,'#4b5563');assert.equal(safe.fontFamily,'Arial');assert.equal(safe.texture,'wood');assert.equal(safe.fontSize,48);
});
test('plant and floor lamp objects preserve their types and do not add seats',()=>{
  const chart=make();chart.layout.objects.push(E.createObject('plant',300,500),E.createObject('lamp',500,500));
  const restored=E.normalizeChart(chart);assert(restored.layout.objects.some(o=>o.type==='plant'));assert(restored.layout.objects.some(o=>o.type==='lamp'));assert.equal(E.seats(restored.layout).length,8);
});


test('attached chairs retain local offsets and rotate with the desk',()=>{
  const layout=E.normalizeLayout({width:1000,height:750,objects:[E.createObject('desk',400,300)]}),desk=layout.objects[0],seat=E.seats(layout)[0];
  E.setEntity(layout,seat.id,{x:seat.x+20,y:seat.y+10,angle:225});
  let saved=E.normalizeLayout(layout),chair=E.seats(saved)[0];assert.equal(chair.x,seat.x+20);assert.equal(chair.angle,225);
  saved.objects[0].angle=90;chair=E.seats(saved)[0];assert.equal(chair.angle,315);assert.equal(chair.x,400-(seat.y+10-300));assert.equal(chair.y,320);
  assert.equal(E.entities(saved).length,2);
});
test('multi-object transforms rotate and scale furniture as one selection',()=>{
  const layout=E.normalizeLayout({width:1400,height:1000,objects:[E.createObject('desk',500,400),E.createObject('desk',700,400)]}),ids=layout.objects.map(o=>o.id),from=E.bounds(layout,ids);
  E.transform(layout,ids,from,{...from,angle:90});assert.equal(layout.objects[0].x,600);assert.equal(layout.objects[0].y,300);assert.equal(layout.objects[1].y,500);assert.equal(layout.objects[0].angle,90);
  const rotated=E.bounds(layout,ids);E.transform(layout,ids,rotated,{...rotated,w:rotated.w*1.2,h:rotated.h*1.2});assert.equal(layout.objects[0].w,144);assert.equal(layout.objects[0].h,78);
  E.group(layout,ids);assert.deepEqual(E.selection(layout,[ids[0]]),ids);E.ungroup(layout,ids);assert.equal(layout.groups.length,0);
});
test('conceptual desk table groups support group seating, within shuffle, and locks',()=>{
  const objects=Array.from({length:4},(_,i)=>E.createObject('desk',250+i*180,350)),layout=E.normalizeLayout({width:1200,height:800,objects});E.group(layout,objects.slice(0,2).map(o=>o.id),true);E.group(layout,objects.slice(2).map(o=>o.id),true);
  const c=E.normalizeChart({layout,roster:['A','B','C','D'],assignments:{}}),result=E.randomize(c,random,'groups',[['A','B'],['C','D']]);assert(!result.error);c.assignments=result.assignments;
  const seats=E.seats(c.layout),a=seats.find(s=>c.assignments[s.id]==='A'),b=seats.find(s=>c.assignments[s.id]==='B');assert.equal(a.tableId,b.tableId);
  c.lockedGroups=[a.tableId];const saved=E.normalizeChart(c);assert(saved.lockedGroups.includes(a.tableId));for(const seat of seats.filter(s=>s.tableId===a.tableId))assert(E.lockedSeat(saved,seat));
  const next=E.randomize(saved,random,'within');assert.equal(next.assignments[a.id],'A');assert.equal(next.assignments[b.id],'B');
});
test('wall openings sit on the border and survive layout normalization',()=>{
  for(const wall of ['top','right','bottom','left'])for(const type of ['door','window']){const o=E.createObject(type,300,300),layout={width:1000,height:750,objects:[o]};E.placeOpening(layout,o,wall);o.flipDoor=true;const saved=E.normalizeLayout(layout).objects[0];assert.equal(saved.wall,wall);assert.equal(saved.flipDoor,true);const horizontal=wall==='top'||wall==='bottom',edge=wall==='top'||wall==='left'?0:horizontal?750:1000;assert.equal(Math.abs((horizontal?saved.y:saved.x)-edge),type==='door'?saved.h/2:0);}
});
test('labels, floor, name choices, and empty-seat defaults are preserved',()=>{
  const c=make();assert.equal(c.showEmptySeats,false);assert.equal(c.layout.floorPattern,'tile');for(const type of ['desk','table','round','shelf','door','window','plant'])assert.equal(E.createObject(type,300,300).showLabel,false);assert.equal(E.createObject('round',300,300).w,125);
  c.layout.objects[1].showLabel=true;c.layout.objects[1].rotateLabel=true;c.layout.floorColor='#e5dfcc';c.layout.floorPattern='wood';c.layout.tileSize=30;c.nameMode='both';c.showEmptySeats=true;const saved=E.normalizeChart(c);assert.equal(saved.nameMode,'both');assert(saved.showEmptySeats);assert(saved.layout.objects[1].rotateLabel);assert.equal(saved.layout.floorColor,'#e5dfcc');
});
test('alphabetical fill preserves locks and priority requirements',()=>{
  const c=make(4);c.roster=['Zoe Z','Amy A','Ben B','Cam C'];const seats=E.seats(c.layout);c.assignments={[seats[3].id]:'Cam C'};c.lockedStudents=['Cam C'];let r=E.randomize(c,random,'alpha');assert.deepEqual(seats.map(s=>r.assignments[s.id]),['Amy A','Ben B','Zoe Z','Cam C']);c.priorityStudents=['Zoe Z'];c.prioritySeats=[seats[0].id];r=E.randomize(c,random,'alpha');assert.equal(r.assignments[seats[0].id],'Zoe Z');assert.equal(r.assignments[seats[3].id],'Cam C');assert.equal(r.unmet.length,0);
});

test('occupied-seat randomization keeps empty seats and unseated students untouched',()=>{
  const c=make(8),slots=E.seats(c.layout);c.assignments={[slots[0].id]:c.roster[0],[slots[2].id]:c.roster[1],[slots[4].id]:c.roster[2],[slots[7].id]:c.roster[3]};c.lockedStudents=[c.roster[0]];c.priorityStudents=[c.roster[2]];c.prioritySeats=[slots[2].id];
  for(let i=0;i<20;i++){const result=E.randomize(c,random,'occupied');assert.deepEqual(Object.keys(result.assignments).sort(),Object.keys(c.assignments).sort());assert.deepEqual(Object.values(result.assignments).sort(),Object.values(c.assignments).sort());assert.equal(result.assignments[slots[0].id],c.roster[0]);assert.equal(result.assignments[slots[2].id],c.roster[2]);assert.equal(result.unseated.length,4);}
  c.assignments={};assert.deepEqual(E.randomize(c,random,'occupied').assignments,{});
});
test('room priority seats survive templates, validation, and chart defaults',()=>{
  const layout=E.normalizeLayout(E.starter(4)),ids=E.seats(layout).map(s=>s.id);layout.prioritySeats=[ids[0],ids[0],'missing'];const saved=E.normalizeLayout(layout);assert.deepEqual(saved.prioritySeats,[ids[0]]);const chart=E.normalizeChart({layout:saved,roster:['Student'],assignments:{}});assert.deepEqual(chart.prioritySeats,[ids[0]]);chart.prioritySeats=[];assert.deepEqual(E.normalizeChart(chart).prioritySeats,[]);
});
test('decorative stools, podiums, and spare chairs cannot hold students',()=>{
  for(const type of ['stool','podium','sparechair']){const object=E.createObject(type,300,300);assert.equal(object.seats,0);object.seats=5;const layout=E.normalizeLayout({width:1000,height:750,objects:[object]});assert.equal(layout.objects[0].type,type);assert.equal(E.seats(layout).length,0);}
});

test('clockwise then counterclockwise room rotation restores geometry and wall openings',()=>{
  const layout=E.normalizeLayout({width:1100,height:750,objects:[E.createObject('desk',260,300),E.createObject('door',400,45)]});E.placeOpening(layout,layout.objects[1],'top');const before=E.copy(layout);E.rotateRoom(layout,true);assert.equal(layout.objects[1].wall,'right');E.rotateRoom(layout,false);assert.deepEqual(layout,before);
});
test('layer moves preserve multi-selection order and attached-chair ownership',()=>{
  const layout=E.normalizeLayout({width:1100,height:750,objects:[E.createObject('desk',200,300),E.createObject('desk',400,300),E.createObject('plant',600,300),E.createObject('monitor',800,300)]}),ids=layout.objects.map(o=>o.id);
  E.reorder(layout,[ids[0]+':0'],'top');assert.deepEqual(layout.objects.map(o=>o.id),[ids[1],ids[2],ids[3],ids[0]]);E.reorder(layout,[ids[0]],'bottom');assert.deepEqual(layout.objects.map(o=>o.id),ids);E.reorder(layout,[ids[0],ids[1]],'up');assert.deepEqual(layout.objects.map(o=>o.id),[ids[2],ids[0],ids[1],ids[3]]);E.reorder(layout,[ids[0],ids[1]],'down');assert.deepEqual(layout.objects.map(o=>o.id),ids);
});
test('computer monitor and keyboard remain decorative through imports',()=>{
  for(const type of ['monitor','keyboard']){const o=E.createObject(type,350,350);o.seats=4;const l=E.normalizeLayout({width:1000,height:750,objects:[o]});assert.equal(l.objects[0].type,type);assert.equal(E.seats(l).length,0);}
});

test('every new object starts with labels hidden and computer defaults use compact widths',()=>{
  for(const type of E.types)assert.equal(E.createObject(type,300,300).showLabel,false,type);assert.equal(E.createObject('keyboard',300,300).w,50);assert.equal(E.createObject('monitor',300,300).w,75);const o=E.createObject('teacher',300,300);o.showLabel=true;assert.equal(E.normalizeLayout({width:1000,height:750,objects:[o]}).objects[0].showLabel,true);
});
test('unavailable attached and standalone chairs remain physical but cannot receive students',()=>{
  const desk=E.createObject('desk',300,300),chair=E.createObject('chair',600,300),layout=E.normalizeLayout({width:1000,height:750,objects:[desk,chair]});const id=desk.id+':0';E.setEntity(layout,id,{noAssign:true});E.setEntity(layout,chair.id,{noAssign:true});const saved=E.normalizeLayout(layout);assert.equal(E.chairs(saved).length,2);assert.equal(E.seats(saved).length,0);assert(E.entity(saved,id).noAssign);assert(E.entity(saved,chair.id).noAssign);const chart=E.normalizeChart({layout:saved,roster:['A'],assignments:{[id]:'A'}});assert.deepEqual(chart.assignments,{});assert.equal(E.randomize(chart,random).unseated.length,1);assert(E.moveStudent(chart,'A',id));E.setEntity(saved,id,{noAssign:false});assert.equal(E.seats(E.normalizeLayout(saved)).length,1);
});

test('first-name and last-name fill orders support natural and comma-separated names',()=>{
  const c=make(4),slots=E.seats(c.layout);c.roster=['Zoe Adams','Amy Zebra','Brown, Ben','Cam Clark'];
  const last=E.randomize(c,random,'alpha-last'),first=E.randomize(c,random,'alpha-first');assert.deepEqual(slots.map(s=>last.assignments[s.id]),['Zoe Adams','Brown, Ben','Cam Clark','Amy Zebra']);assert.deepEqual(slots.map(s=>first.assignments[s.id]),['Amy Zebra','Brown, Ben','Cam Clark','Zoe Adams']);
  c.assignments={[slots[3].id]:'Amy Zebra'};c.lockedStudents=['Amy Zebra'];c.priorityStudents=['Cam Clark'];c.prioritySeats=[slots[0].id];const fixed=E.randomize(c,random,'alpha-last');assert.equal(fixed.assignments[slots[3].id],'Amy Zebra');assert.equal(fixed.assignments[slots[0].id],'Cam Clark');assert.equal(fixed.unmet.length,0);
});

test('layout templates generate expected seat counts and orientation without private class data',()=>{
  for(const portrait of [false,true])for(const kind of ['empty','grid','tables','stadium','horseshoe','circle']){const layout=E.createTemplate(kind,{portrait,rows:3,columns:5,groups:5,members:6,count:18});assert.equal(layout.height>layout.width,portrait,kind);const expected=kind==='empty'?0:kind==='grid'||kind==='stadium'?15:kind==='tables'?30:18;assert.equal(E.seats(layout).length,expected,kind);assert(!('roster' in layout));const seen=new Set();for(const o of layout.objects){assert(!seen.has(o.id));seen.add(o.id);assert(o.x>=0&&o.x<=layout.width);assert(o.y>=0&&o.y<=layout.height);}for(const seat of E.chairs(layout)){assert(seat.x>=0&&seat.x<=layout.width);assert(seat.y>=0&&seat.y<=layout.height);}assert.deepEqual(E.normalizeLayout(layout),layout);}
});
test('template counts are bounded and duplicated table group names are unique',()=>{
  for(const kind of ['grid','tables','stadium','horseshoe','circle']){const l=E.createTemplate(kind,{portrait:true,rows:99,columns:99,groups:99,members:99,count:99});assert(l.objects.length<=150);assert(l.width<=4000&&l.height<=4000);}
  assert.equal(E.uniqueGroupName('Table group 1',['Table group 1','Table group 2']),'Table group 3');assert.equal(E.uniqueGroupName('Blue team',['Blue team','Blue team (2)']),'Blue team (3)');assert.equal(E.uniqueGroupName('Blue team (2)',['Blue team','Blue team (2)']),'Blue team (3)');
});


test('group-grid and layered horseshoe templates preserve usable seating groups',()=>{
  for(const portrait of [false,true])for(const kind of ['tables','deskGroups']){const l=E.createTemplate(kind,{portrait,groupGrid:true,rows:2,columns:3,members:5});assert.equal(E.seats(l).length,30);assert.equal(l.height>l.width,portrait);if(kind==='deskGroups'){assert.equal(l.tableGroups.length,6);assert(l.tableGroups.every(g=>g.members.length===5));const group=l.tableGroups[0].members.map(id=>l.objects.find(o=>o.id===id));assert.equal(group[1].x-group[0].x,120);assert.equal(group[3].y-group[0].y,65);}else assert.equal(l.objects.filter(o=>o.type==='table').length,6);for(const seat of E.chairs(l)){assert(seat.x>=0&&seat.x<=l.width);assert(seat.y>=0&&seat.y<=l.height);}}
  const l=E.createTemplate('horseshoe',{count:10,layers:3});assert.equal(E.seats(l).length,30);const desks=l.objects.filter(o=>o.type==='desk');assert.notEqual(desks[0].x,desks[10].x);assert.deepEqual(E.normalizeLayout(l),l);
});


test('one-side table and desk templates keep chairs facing forward and preserve groups',()=>{
  for(const kind of ['tables','deskGroups']){const layout=E.createTemplate(kind,{groupGrid:true,rows:2,columns:3,members:3,oneSide:true});assert.equal(E.seats(layout).length,18);assert(E.chairs(layout).every(c=>c.angle===180));if(kind==='tables'){for(const o of layout.objects.filter(o=>o.type==='table'))assert(E.chairs(layout).filter(c=>c.objectId===o.id).every(c=>c.y>o.y));}else{assert.equal(layout.tableGroups.length,6);for(const group of layout.tableGroups){const desks=group.members.map(id=>layout.objects.find(o=>o.id===id));assert(desks.every(o=>o.y===desks[0].y&&o.angle===0));assert.equal(desks[1].x-desks[0].x,120);}}assert.deepEqual(E.normalizeLayout(layout),layout);}
});
test('circle layers and bold italic underline survive normalization and object copying',()=>{
  const layout=E.createTemplate('circle',{count:9,layers:3});assert.equal(E.seats(layout).length,27);const o=E.createObject('label',200,200);Object.assign(o,{bold:true,italic:true,underline:true});const saved=E.normalizeLayout({width:1000,height:750,objects:[o]});assert.equal(E.style(saved.objects[0]).bold,true);assert.equal(E.style(saved.objects[0]).italic,true);assert.equal(E.style(saved.objects[0]).underline,true);assert.deepEqual(E.copy(saved),saved);
});


test('fills prefer priority seats then the front regardless of object creation order',()=>{
  const board=E.createObject('board',500,30),back=E.createObject('desk',300,650),middle=E.createObject('desk',300,400),front=E.createObject('desk',300,180),near=E.createObject('desk',600,180),layout=E.normalizeLayout({width:1000,height:800,objects:[back,middle,near,front,board]});
  for(const mode of ['all','alpha-first','alpha-last']){const c=E.normalizeChart({layout,roster:['Zoe Zebra','Amy Adams'],prioritySeats:[]});const result=E.randomize(c,random,mode);assert.deepEqual(Object.keys(result.assignments).sort(),[front.id+':0',near.id+':0'].sort());c.prioritySeats=[back.id+':0'];c.priorityStudents=['Zoe Zebra'];const preferred=E.randomize(c,random,mode);assert.equal(preferred.assignments[back.id+':0'],'Zoe Zebra');assert.equal(preferred.assignments[front.id+':0'],'Amy Adams');}
  E.rotateRoom(layout,true);const c=E.normalizeChart({layout,roster:['A'],prioritySeats:[]});assert.equal(Object.keys(E.randomize(c,random).assignments)[0],front.id+':0');
});
test('large group grids and Square/Custom shapes preserve counts and fit inside the room',()=>{
  for(const kind of ['tables','deskGroups']){const l=E.createTemplate(kind,{shape:'portrait',groupGrid:true,rows:8,columns:8,members:8,oneSide:true});assert.equal(E.seats(l).length,512);assert.equal(l.objects.filter(o=>o.type===(kind==='tables'?'table':'desk')).length,kind==='tables'?64:512);assert(l.width<=12000&&l.height<=12000);for(const seat of E.chairs(l)){assert(seat.x>=0&&seat.x<=l.width);assert(seat.y>=0&&seat.y<=l.height);}assert.deepEqual(E.normalizeLayout(l),l);}
  const square=E.createTemplate('grid',{shape:'square',rows:6,columns:3});assert.equal(square.width,square.height);const custom=E.createTemplate('empty',{shape:'custom',roomWidth:1300,roomHeight:900});assert.equal(custom.width,1300);assert.equal(custom.height,900);
});


test('asymmetric selections retain center and oriented bounds through repeated rotations',()=>{
  const a=E.createObject('desk',400,350),b=E.createObject('comfychair',650,470);b.angle=30;let layout=E.normalizeLayout({width:1200,height:1000,objects:[a,b]}),ids=[a.id,b.id],original=E.bounds(layout,ids);
  for(let i=0;i<24;i++){const from=E.bounds(layout,ids);E.transform(layout,ids,from,{...from,angle:from.angle+15});layout=E.normalizeLayout(layout,{fit:false});const now=E.bounds(layout,ids);assert(Math.hypot(now.x-original.x,now.y-original.y)<.0001);assert(Math.abs(now.w-original.w)<.0001);assert(Math.abs(now.h-original.h)<.0001);}
  const edge=E.createObject('shelf',85,50);edge.angle=90;const preserved=E.normalizeLayout({width:1000,height:750,objects:[edge]},{fit:false});assert.equal(preserved.objects[0].x,85);assert.equal(preserved.objects[0].y,50);
});
test('lounge seating starts unavailable and rugs remain decorative with saved appearance',()=>{
  const objects=['couch','comfychair','rug','roundrug'].map((type,i)=>E.createObject(type,200+i*230,300));objects[0].fill='#638571';objects[2].texture='speckle';const layout=E.normalizeLayout({width:1300,height:900,objects});assert.equal(E.seats(layout).length,0);assert.equal(E.chairs(layout).length,4);assert(E.chairs(layout).every(s=>s.noAssign));assert.equal(layout.objects[0].fill,'#638571');assert.equal(layout.objects[2].texture,'speckle');assert.equal(objects[3].w,objects[3].h);assert.deepEqual(E.normalizeLayout(layout),layout);
});


test('lounge seats are disabled by default and become three plus one assignable places when enabled',()=>{
  const couch=E.createObject('couch',350,300),chair=E.createObject('comfychair',750,300);let layout=E.normalizeLayout({width:1200,height:900,objects:[couch,chair]});assert.equal(E.seats(layout).length,0);assert.equal(couch.seats,3);assert.equal(chair.seats,1);layout.objects.forEach(o=>o.noAssign=false);layout=E.normalizeLayout(layout);assert.equal(E.seats(layout).length,4);for(const seat of E.seats(layout)){const o=layout.objects.find(o=>o.id===seat.objectId);assert(seat.x>=o.x-o.w/2&&seat.x<=o.x+o.w/2);assert(seat.y>=o.y-o.h/2&&seat.y<=o.y+o.h/2);}const c=E.normalizeChart({layout,roster:['A','B','C','D']});assert.equal(Object.keys(E.randomize(c,random).assignments).length,4);const old=E.normalizeLayout({width:1000,height:800,objects:[{...couch,seats:0,noAssign:false}]});assert.equal(E.seats(old).length,0);
});
test('new fixtures remain decorative, attached desk-chairs seat one, and seat numbers persist',()=>{
  const objects=['sink','stovetop','bookcart','cabinet','deskchair'].map((type,i)=>E.createObject(type,150+i*200,350)),layout=E.normalizeLayout({width:1300,height:900,objects});assert.equal(E.seats(layout).length,1);const id=E.seats(layout)[0].id;layout.seatNumbers={[id]:17,missing:99};layout.showSeatNumbers=true;layout.objects[0].rugPattern='stripes';const saved=E.normalizeLayout(layout);assert.deepEqual(saved.seatNumbers,{[id]:17});assert(saved.showSeatNumbers);assert.deepEqual(E.copy(saved).seatNumbers,saved.seatNumbers);const rug=E.createObject('rug',300,300);rug.rugPattern='diamonds';assert.equal(E.normalizeLayout({width:1000,height:900,objects:[rug]}).objects[0].rugPattern,'diamonds');
});


test('office chairs expose one centered student seat only when explicitly enabled',()=>{
  const object=E.createObject('officechair',300,300);assert.equal(object.seats,1);assert(object.noAssign);let layout=E.normalizeLayout({width:1000,height:750,objects:[object]});assert.equal(E.seats(layout).length,0);layout.objects[0].noAssign=false;layout=E.normalizeLayout(layout);const seat=E.seats(layout)[0];assert.equal(seat.x,layout.objects[0].x);assert.equal(seat.y,layout.objects[0].y);assert.equal(E.seats(layout).length,1);assert.equal(Object.keys(E.randomize(E.normalizeChart({layout,roster:['A']}),random).assignments).length,1);const old=E.normalizeLayout({width:1000,height:750,objects:[{...object,seats:0,noAssign:false}]});assert.equal(E.seats(old).length,0);
});
test('furniture can meet walls without an added margin and fixtures start compact',()=>{
  const layout={width:1000,height:750,objects:[]},cabinet=E.createObject('cabinet',0,0);E.fitObject(layout,cabinet);assert.equal(cabinet.x,cabinet.w/2);assert.equal(cabinet.y,cabinet.h/2);assert.equal(E.createObject('sink',300,300).w,100);assert.equal(E.createObject('stovetop',300,300).w,80);
  for(const [wall,x,y]of [['top',400,20],['bottom',400,730],['left',20,400],['right',980,400]]){const door=E.createObject('door',x,y);E.snapOpening(layout,door,20);assert.equal(door.wall,wall);E.fitObject(layout,door);assert.equal(door.wall,wall);}
});

test('seating fills honor together/apart rules and report manual violations',()=>{
  const c=make(8),[a,b,d]=c.roster,rules={togetherRaw:[[a,b]],apartPairs:[[a,d]]};
  for(const mode of ['all','alpha-first','alpha-last'])for(let i=0;i<10;i++){
    const r=E.randomize(c,random,mode,[],rules);assert(!r.error,r.error);assert.equal(Object.values(r.assignments).length,8);assert.deepEqual(E.ruleWarnings({...c,assignments:r.assignments},rules),[]);
    const slots=E.seats(c.layout),source=slots.find(s=>r.assignments[s.id]===a),target=slots.find(s=>s.tableId===source.tableId&&r.assignments[s.id]!==a&&r.assignments[s.id]!==b);const moved={...c,assignments:{...r.assignments}};E.moveStudent(moved,d,target.id);assert(E.ruleWarnings(moved,rules).some(w=>w.includes('different tables')));
  }
});
test('impossible rules fail without moving locked students or mutating the chart',()=>{
  const c=assign(make(8)),slots=E.seats(c.layout),a=c.assignments[slots[0].id],b=c.assignments[slots[4].id];c.lockedStudents=[a,b];const before=E.copy(c);
  const result=E.randomize(c,random,'all',[],{togetherRaw:[[a,b]],apartPairs:[]});assert(result.error);assert.deepEqual(c,before);
});
test('transitive together rules and contradictions are handled',()=>{
  const c=make(8),[a,b,d]=c.roster,rules={togetherRaw:[[a,b],[b,d]],apartPairs:[]};const r=E.randomize(c,random,'all',[],rules);assert(!r.error);assert.deepEqual(E.ruleWarnings({...c,assignments:r.assignments},rules),[]);
  assert(E.randomize(c,random,'all',[],{...rules,apartPairs:[[a,d]]}).error);
});

test('grouping rules retain available priority seating across tables',()=>{
  const c=make(8),slots=E.seats(c.layout);c.priorityStudents=c.roster.slice(0,2);c.prioritySeats=[slots[0].id,slots[4].id];const rules={togetherRaw:[],apartPairs:[[c.roster[0],c.roster[1]]]};
  const r=E.randomize(c,random,'all',[],rules);assert(!r.error);assert.equal(r.unmet.length,0);assert.deepEqual(E.ruleWarnings({...c,assignments:r.assignments},rules),[]);
});

test('seat numbering generates missing numbers, preserves custom values, and renumbers from the front',()=>{
  const l=E.starter(8),slots=E.seats(l);l.seatNumbers={[slots[3].id]:42};l.showSeatNumbers=true;const normalized=E.normalizeLayout(l);assert.equal(normalized.seatNumbers[slots[3].id],42);assert.equal(Object.keys(normalized.seatNumbers).length,8);assert.equal(new Set(Object.values(normalized.seatNumbers)).size,8);
  E.numberSeats(normalized,true);assert.deepEqual(Object.values(normalized.seatNumbers).sort((a,b)=>a-b),[1,2,3,4,5,6,7,8]);const first=E.seats(normalized).sort((a,b)=>a.y-b.y||a.x-b.x)[0];assert.equal(normalized.seatNumbers[first.id],1);
  normalized.objects.push(E.createObject('chair',100,700));const refreshed=E.normalizeLayout(normalized);assert.equal(Object.keys(refreshed.seatNumbers).length,9);assert.equal(refreshed.seatNumbers[first.id],1);
});

test('numbering patterns snake across rows and columns, circle tables, and allow pairwise swaps',()=>{
 const objects=[];for(let row=0;row<2;row++)for(let col=0;col<3;col++){const o=E.createObject('chair',100+col*150,100+row*150);o.id='r'+row+'c'+col;objects.push(o);}const l=E.normalizeLayout({width:900,height:700,objects});const order=()=>Object.entries(l.seatNumbers).sort((a,b)=>a[1]-b[1]).map(([id])=>id.split(':')[0]);
 E.numberSeats(l,true,'snake-rows');assert.deepEqual(order(),['r0c0','r0c1','r0c2','r1c2','r1c1','r1c0']);
 E.numberSeats(l,true,'snake-rows-reverse');assert.deepEqual(order(),['r0c2','r0c1','r0c0','r1c0','r1c1','r1c2']);
 E.numberSeats(l,true,'snake-columns');assert.deepEqual(order(),['r0c0','r1c0','r1c1','r0c1','r0c2','r1c2']);
 const geometry=E.copy(l.objects);E.reorderSeatNumbers(l,'r0c0:0','r0c1:0');assert.deepEqual(order(),['r0c1','r1c0','r1c1','r0c0','r0c2','r1c2']);assert.deepEqual(l.objects,geometry);
 const table=E.createObject('round',400,300),t=E.normalizeLayout({width:900,height:700,objects:[table]});E.numberSeats(t,true,'tables');const seats=E.seats(t).sort((a,b)=>t.seatNumbers[a.id]-t.seatNumbers[b.id]);const angles=seats.map(s=>(Math.atan2(s.y-table.y,s.x-table.x)+Math.PI*2.5)%(Math.PI*2));assert(angles.every((a,i)=>i===0||a>=angles[i-1]));
});

test('respect-empty option preserves empty slots for random and alphabetical fills',()=>{
 const c=assign(make(8)),slots=E.seats(c.layout);delete c.assignments[slots[2].id];for(const mode of ['all','alpha-first','alpha-last']){const r=E.randomize(c,random,mode,[],{},{respectEmptySeats:true});assert(!r.assignments[slots[2].id]);assert.equal(Object.keys(r.assignments).length,7);assert.equal(r.unseated.length,1);}
 c.respectGroupingRules=false;c.respectEmptySeats=true;const saved=E.normalizeChart(c);assert.equal(saved.respectGroupingRules,false);assert.equal(saved.respectEmptySeats,true);
});
test('laptop and school supplies are persistent decorative objects',()=>{
 const objects=['laptop','schoolsupplies'].map((type,i)=>E.createObject(type,200+i*200,200)),layout=E.normalizeLayout({width:900,height:700,objects});assert.deepEqual(layout.objects.map(o=>o.type),['laptop','schoolsupplies']);assert.equal(E.seats(layout).length,0);
});

test('randomization can ignore priority and locks without deleting stored preferences',()=>{
 const c=make(8),slots=E.seats(c.layout);c.assignments[slots[0].id]=c.roster[7];c.lockedStudents=[c.roster[7]];c.priorityStudents=[c.roster[7]];c.prioritySeats=[slots[0].id];const before=E.copy(c);
 const locked=E.randomize(c,random,'alpha',[],{},{respectLockedSeats:true,respectPrioritySeating:false});assert.equal(locked.assignments[slots[0].id],c.roster[7]);
 const priority=E.randomize(c,random,'alpha',[],{},{respectLockedSeats:false,respectPrioritySeating:true});assert.equal(priority.assignments[slots[0].id],c.roster[7]);
 const unrestricted=E.randomize(c,random,'alpha',[],{},{respectLockedSeats:false,respectPrioritySeating:false});assert.equal(unrestricted.assignments[slots[0].id],c.roster[0]);assert.deepEqual(c,before);
 const defaults=E.normalizeChart(make());assert.equal(defaults.respectEmptySeats,true);assert.equal(defaults.respectPrioritySeating,true);assert.equal(defaults.respectLockedSeats,true);
});
test('desktop printer remains decorative through room serialization',()=>{
 const p=E.createObject('printer',200,200),l=E.normalizeLayout({width:800,height:700,objects:[p]});assert.equal(l.objects[0].type,'printer');assert.equal(E.seats(l).length,0);
});

test('unrestricted Randomize uses spare chairs throughout the room while Fill stays front-first',()=>{
 const c=make(8);c.layout=E.normalizeLayout(E.starter(16));c.assignments=E.randomize(c,random,'all').assignments;const original=new Set(Object.keys(c.assignments)),used=new Set();let seed=12345;const rng=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return Math.floor(seed/4294967296*n);};
 for(let i=0;i<40;i++){const r=E.randomize(c,rng,'randomize',[],{},{respectEmptySeats:false,randomSeatLocations:true});assert.equal(Object.keys(r.assignments).length,8);Object.keys(r.assignments).forEach(id=>used.add(id));}
 assert.equal(used.size,16);assert([...used].some(id=>!original.has(id)));
 const kept=E.randomize(c,rng,'randomize',[],{},{respectEmptySeats:true,randomSeatLocations:true});assert.deepEqual(Object.keys(kept.assignments).sort(),[...original].sort());
 const filled=E.randomize(c,rng,'all').assignments;assert.deepEqual(Object.keys(filled).sort(),[...original].sort());
});
