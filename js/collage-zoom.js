(() => {
  const slug=location.pathname.split('/').filter(Boolean).at(-2);
  const picture=document.getElementById('picture');
  if(!picture)return;
  const uniform=(columns,rows)=>Array.from({length:rows},(_,row)=>({top:row/rows,bottom:(row+1)/rows,edges:Array.from({length:columns+1},(_,i)=>i/columns)}));
  let rows;
  if(/^car-logos-/.test(slug) || slug==='historical-figures-18')rows=uniform(6,3);
  else if(/^great-composers-/.test(slug) || (/^football-clubs-/.test(slug) || slug==='football-legends-12') || slug==='beatles-12-songs' || slug==='f16-cockpit-instruments-12')rows=uniform(4,3);
  else if(/^classic-paintings-/.test(slug) || slug==='famous-movies-9')rows=uniform(3,3);
  else if(slug==='naftali-family')rows=uniform(6,4);
  else if(/^goalkeeper-video-/.test(slug))rows=uniform(2,3);
  else if(/^goalkeeper-/.test(slug)){
    const split={'goalkeeper-long-shots':.415,'goalkeeper-high-balls':.467,'goalkeeper-crosses':.44}[slug] || .5;
    rows=[{top:0,bottom:split,edges:[0,1/3,2/3,1]},{top:split,bottom:1,edges:[0,.5,1]}];
  } else if(slug==='israel-presidents-2026' || /^maccabi-haifa-26-squad-/.test(slug)){
    rows=[{top:0,bottom:1/3,edges:[.05,.275,.5,.725,.95]},{top:1/3,bottom:.6556,edges:[.05,.275,.5,.725,.95]},{top:.6556,bottom:1,edges:[.1625,.3875,.6125,.8375]}];
  }
  if(!rows)return;
  const playing=()=>new URLSearchParams(location.search).get('game')==='1' || document.documentElement.classList.contains('atlas-playing');
  if(playing())return;
  const parent=picture.parentElement;
  if(getComputedStyle(parent).position==='static')parent.style.position='relative';
  const overlay=document.createElement('div');
  overlay.hidden=true;
  overlay.className='collage-zoom';
  const canvas=document.createElement('canvas');
  canvas.setAttribute('role','img');
  const close=document.createElement('button');
  close.type='button';close.textContent='×';close.setAttribute('aria-label','סגירת התמונה המוגדלת / Close enlarged image');
  overlay.append(canvas,close);parent.append(overlay);
  const style=document.createElement('style');
  style.textContent='.collage-zoom{position:absolute;z-index:15;background:#090703;border:1px solid #ffdc73;box-sizing:border-box;display:grid;place-items:center;cursor:zoom-out;overflow:hidden}.collage-zoom[hidden]{display:none!important}.collage-zoom canvas{display:block;width:100%;height:100%;object-fit:contain}.collage-zoom button{position:absolute;right:5px;top:5px;z-index:1;width:40px;height:40px;padding:0;border:1px solid #ffe69b;border-radius:7px;background:#201600e6;color:#ffe69b;font:bold 30px/1 Arial;cursor:pointer}.collage-zoom button:focus-visible{outline:2px solid white}';
  document.head.append(style);
  picture.style.cursor='zoom-in';
  picture.tabIndex=0;picture.setAttribute('role','button');picture.setAttribute('aria-label',(picture.alt || '')+' — לחצו להגדלה / Select a picture to enlarge');picture.setAttribute('aria-expanded','false');
  let closeTimer;
  let returnFocus=picture;
  function layout(){
    const width=picture.offsetWidth,height=picture.offsetHeight;
    Object.assign(overlay.style,{left:picture.offsetLeft+'px',top:picture.offsetTop+'px',width:width+'px',height:height+'px'});
    // Crop dimensions come from this page's grid. Fit that crop to the full
    // picture box, so different panel sizes receive different zoom factors.
    if(canvas.width && canvas.height){
      const scale=Math.min(Math.max(0,width-2)/canvas.width,Math.max(0,height-2)/canvas.height);
      canvas.style.width=canvas.width*scale+'px';
      canvas.style.height=canvas.height*scale+'px';
    }
  }
  function dismiss(){
    clearTimeout(closeTimer);
    const restore=overlay.contains?.(document.activeElement);
    overlay.hidden=true;picture.setAttribute('aria-expanded','false');
    if(restore)returnFocus.focus({preventScroll:true});
  }
  function open(x,y,source=picture){
    if(playing() || !picture.naturalWidth)return;
    const row=rows.find(r=>y>=r.top && y<r.bottom);if(!row)return;
    const col=row.edges.findIndex((edge,i)=>i<row.edges.length-1 && x>=edge && x<row.edges[i+1]);if(col<0)return;
    // A sixth cell is empty on the last video page.
    if(slug==='goalkeeper-video-8' && rows.indexOf(row)===2 && col===1)return;
    const left=row.edges[col],right=row.edges[col+1];
    canvas.width=Math.max(1,Math.round((right-left)*picture.naturalWidth));
    canvas.height=Math.max(1,Math.round((row.bottom-row.top)*picture.naturalHeight));
    canvas.getContext('2d').drawImage(picture,left*picture.naturalWidth,row.top*picture.naturalHeight,(right-left)*picture.naturalWidth,(row.bottom-row.top)*picture.naturalHeight,0,0,canvas.width,canvas.height);
    canvas.setAttribute('aria-label','תמונה מוגדלת / Enlarged picture');
    clearTimeout(closeTimer);returnFocus=source;
    layout();overlay.hidden=false;picture.setAttribute('aria-expanded','true');
    if(source===picture)close.focus({preventScroll:true});
    closeTimer=setTimeout(dismiss,3000);
  }
  picture.addEventListener('click',event=>{
    const rect=picture.getBoundingClientRect();open((event.clientX-rect.left)/rect.width,(event.clientY-rect.top)/rect.height);
  });
  picture.addEventListener('keydown',event=>{if(event.key==='Enter' || event.key===' '){event.preventDefault();open((rows[0].edges[0]+rows[0].edges[1])/2,(rows[0].top+rows[0].bottom)/2);}});
  // Match the actual label, rather than visual button order (which can be sorted).
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('.items button');
    if(!button || playing())return;
    const records=window.atlasPage?.items || [];
    let item;
    if(slug==='naftali-family'){
      const index=[...document.querySelectorAll('.items button')].indexOf(button);
      item=records[index];
    } else {
      const name=button.querySelector('[lang="en"]')?.textContent.trim();
      item=records.find(record=>record.en.trim()===name);
    }
    if(item)open(item.x/1000,item.y/1000,button);
  });
  window.addEventListener('pagehide',()=>clearTimeout(closeTimer));
  overlay.addEventListener('click',dismiss);
  document.addEventListener('keydown',event=>{if(event.key==='Escape' && !overlay.hidden){event.preventDefault();dismiss();}});
  window.addEventListener('atlas-layout',layout);
  window.addEventListener('resize',layout);
  new ResizeObserver(layout).observe(picture);
})();
