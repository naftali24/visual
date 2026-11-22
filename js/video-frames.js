(() => {
  const picture=document.getElementById('picture');
  const stage=document.getElementById('stage');
  if(!picture || !stage)return;
  const colors=['#27d7ff','#ff9d28','#b58aff','#71e04b','#ff66bc','#ff5656'];
  const layer=document.createElement('div');
  layer.setAttribute('aria-hidden','true');
  Object.assign(layer.style,{position:'absolute',pointerEvents:'none',zIndex:'2'});
  const count=Math.min(6,window.atlasPage?.items?.length || 0);
  for(let i=0;i<count;i++){
    const frame=document.createElement('div');
    Object.assign(frame.style,{position:'absolute',boxSizing:'border-box',left:(i%2)*50+'%',top:Math.floor(i/2)*100/3+'%',width:'50%',height:100/3+'%',border:'4px solid '+colors[i],borderRadius:'4px',pointerEvents:'none'});
    layer.append(frame);
  }
  stage.append(layer);
  function fitFrames(){
    Object.assign(layer.style,{left:picture.offsetLeft+'px',top:picture.offsetTop+'px',width:picture.offsetWidth+'px',height:picture.offsetHeight+'px'});
  }
  picture.addEventListener('load',fitFrames);
  window.addEventListener('atlas-layout',fitFrames);
  window.addEventListener('resize',fitFrames);
  new ResizeObserver(fitFrames).observe(picture);
  fitFrames();
})();
