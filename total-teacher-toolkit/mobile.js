/* Phone navigation reuses the same groups, roster and running tools. */
(function(){
  if(window.qtgToolWindow)return;
  const $=id=>document.getElementById(id),body=document.body;
  let desktop=false,section='groups',tool='pickerPanel';
  try{desktop=sessionStorage.getItem('ttt-desktop-view')==='true';}catch(_){}
  const tools=[['pickerPanel','Random Picker'],['timerPanel','Countdown timer'],['stopwatchPanel','Stopwatch'],['communityPanel','Community Builder'],['clockPanel','Clock']];
  const nav=document.createElement('nav');nav.className='mobile-navigation';nav.setAttribute('aria-label','Mobile workspace');
  nav.innerHTML='<div class="mobile-tabs"><button class="btn" id="mobileGroups" aria-pressed="true">Groups</button><button class="btn" id="mobileTools" aria-pressed="false">Tools</button></div><button class="btn" id="mobileDesktop">Desktop version</button><p id="mobileDesktopNote">More features, including Seating Charts and Room Designer, are available in the Desktop version.</p>';
  document.querySelector('.app').prepend(nav);
  const chooser=document.createElement('label');chooser.className='mobile-tool-chooser';chooser.innerHTML='Choose a tool <select id="mobileToolSelect">'+tools.map(([id,name])=>'<option value="'+id+'">'+name+'</option>').join('')+'</select>';
  document.querySelector('.tool-dock').before(chooser);
  const viewport=document.querySelector('meta[name=viewport]'),originalViewport=viewport?.content;
  const phone=()=>matchMedia('(max-width:760px)').matches||(matchMedia('(pointer:coarse)').matches&&screen.width<=760);
  function update(){
    const compact=phone()&&!desktop;
    body.classList.toggle('mobile-layout',compact);body.classList.toggle('desktop-requested',desktop);
    body.dataset.mobileSection=section;
    $('mobileGroups').setAttribute('aria-pressed',String(section==='groups'));
    $('mobileTools').setAttribute('aria-pressed',String(section==='tools'));
    $('mobileDesktop').textContent=desktop?'Mobile version':'Desktop version';
    nav.hidden=!phone()&&!desktop;
    chooser.hidden=!compact||section!=='tools';
    tools.forEach(([id])=>$(id).classList.toggle('mobile-tool-active',id===tool));
    if(compact&&document.body.classList.contains('sc-editing'))$('scGroups').click();
  }
  $('mobileGroups').onclick=()=>{section='groups';update();window.scrollTo(0,0);};
  $('mobileTools').onclick=()=>{section='tools';update();window.scrollTo(0,0);};
  $('mobileToolSelect').onchange=e=>{tool=e.target.value;update();};
  $('mobileDesktop').onclick=()=>{
    desktop=!desktop;try{sessionStorage.setItem('ttt-desktop-view',String(desktop));}catch(_){}
    if(viewport)viewport.content=desktop?'width=1280, initial-scale=0.3':originalViewport;
    update();window.scrollTo(0,0);
  };
  if(desktop&&viewport)viewport.content='width=1280, initial-scale=0.3';
  window.addEventListener('resize',update);update();
})();
