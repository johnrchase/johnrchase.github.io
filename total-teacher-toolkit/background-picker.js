/* Inline color picker; the original color input remains the persistence hook. */
(function(){
  const $=id=>document.getElementById(id),plane=$('bgColorPlane'),ctx=plane.getContext('2d'),color=$('bgColor'),hue=$('bgHue'),hex=$('bgHex');
  let h=220,s=0,v=1;
  function rgb(){
    const c=v*s,x=c*(1-Math.abs((h/60)%2-1)),m=v-c;
    const channels=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];
    return '#'+channels.map(n=>Math.round((n+m)*255).toString(16).padStart(2,'0')).join('');
  }
  function draw(){
    ctx.fillStyle='hsl('+h+' 100% 50%)';ctx.fillRect(0,0,200,140);
    const white=ctx.createLinearGradient(0,0,200,0);white.addColorStop(0,'#fff');white.addColorStop(1,'#fff0');ctx.fillStyle=white;ctx.fillRect(0,0,200,140);
    const black=ctx.createLinearGradient(0,0,0,140);black.addColorStop(0,'#0000');black.addColorStop(1,'#000');ctx.fillStyle=black;ctx.fillRect(0,0,200,140);
    ctx.beginPath();ctx.arc(s*200,(1-v)*140,5,0,Math.PI*2);ctx.strokeStyle='#000';ctx.lineWidth=3;ctx.stroke();ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.stroke();
    hue.value=h;hex.value=rgb();plane.setAttribute('aria-valuenow',String(Math.round(s*100)));plane.setAttribute('aria-valuetext',hex.value+', brightness '+Math.round(v*100)+' percent');
  }
  function sync(){
    const [r,g,b]=color.value.slice(1).match(/../g).map(n=>parseInt(n,16)/255),max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
    if(d)h=((max===r?(g-b)/d:max===g?(b-r)/d+2:(r-g)/d+4)*60+360)%360;
    s=max?d/max:0;v=max;draw();
  }
  function apply(){color.value=rgb();color.dispatchEvent(new Event('input',{bubbles:true}));draw();}
  function point(e){const r=plane.getBoundingClientRect();s=Math.max(0,Math.min(1,(e.clientX-r.x)/r.width));v=1-Math.max(0,Math.min(1,(e.clientY-r.y)/r.height));apply();}
  plane.onpointerdown=e=>{plane.focus();plane.setPointerCapture(e.pointerId);point(e);};
  plane.onpointermove=e=>{if(plane.hasPointerCapture(e.pointerId)&&e.buttons)point(e);};
  plane.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const step=e.shiftKey ? .1 : .02;s=Math.max(0,Math.min(1,s+(e.key==='ArrowRight'?step:e.key==='ArrowLeft'?-step:0)));v=Math.max(0,Math.min(1,v+(e.key==='ArrowUp'?step:e.key==='ArrowDown'?-step:0)));apply();};
  hue.oninput=()=>{h=Number(hue.value);apply();};
  hex.onchange=()=>{const value=hex.value.startsWith('#')?hex.value:'#'+hex.value;if(/^#[0-9a-f]{6}$/i.test(value)){color.value=value;sync();color.dispatchEvent(new Event('input',{bubbles:true}));}else sync();};
  window.syncBackgroundPicker=sync;sync();
})();
