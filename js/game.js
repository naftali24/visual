(() => {
  const parameters = new URLSearchParams(location.search);
  if (parameters.get("game") !== "1") return;

  const photo = document.querySelector("#picture") || document.querySelector("#horse image");
  const entries = window.atlasPage?.items || window.atlasButtons;
  if (!photo || !Array.isArray(entries) || !entries.length) {
    document.documentElement.classList.remove("atlas-playing");
    return;
  }

  const copy = {
    he: ["איפה נמצא הפריט הבא?", "נכון!", "נסה שוב", "מצאת את כל הפריטים!", "שחק שוב"],
    en: ["Find this item:", "Correct!", "Try again", "You found everything!", "Play again"],
    ar: ["أين يوجد العنصر التالي؟", "صحيح!", "حاول مرة أخرى", "وجدت كل العناصر!", "العب مجددًا"],
    es: ["¿Dónde está este elemento?", "¡Correcto!", "Inténtalo de nuevo", "¡Encontraste todo!", "Jugar de nuevo"],
    fr: ["Où se trouve cet élément ?", "Bravo !", "Réessaie", "Tu as tout trouvé !", "Rejouer"],
    de: ["Wo ist dieses Element?", "Richtig!", "Versuch es noch einmal", "Alles gefunden!", "Noch einmal spielen"],
    ru: ["Где находится этот объект?", "Верно!", "Попробуйте ещё раз", "Вы нашли всё!", "Играть снова"],
    it: ["Dov’è questo elemento?", "Esatto!", "Riprova", "Hai trovato tutto!", "Gioca ancora"],
    pt: ["Onde fica este elemento?", "Correto!", "Tente de novo", "Encontrou tudo!", "Jogar novamente"]
  };
  const preference = parameters.get("lang");
  const language = Object.hasOwn(copy, preference) ? preference : "he";
  const [question, correct, again, complete, replayText] = copy[language];
  const horseBox = window.atlasButtons && !window.atlasPage ? [
    Number(photo.getAttribute("x")), Number(photo.getAttribute("y")),
    Number(photo.getAttribute("width")), Number(photo.getAttribute("height"))
  ] : null;
  const items = entries.map(item => {
    const [x,y] = horseBox ? [
      (item.anchor[0]-horseBox[0])/horseBox[2],
      (item.anchor[1]-horseBox[1])/horseBox[3]
    ] : [item.x/1000,item.y/1000];
    return {x,y,en:item.en,name:language==="he"?item.he:item.en};
  });
  const make = (tag, className) => Object.assign(document.createElement(tag), {className});
  const svgNode = tag => document.createElementNS("http://www.w3.org/2000/svg",tag);
  const attributes = (element, values) => {
    for(const [key,value] of Object.entries(values))element.setAttribute(key,value);
    return element;
  };
  const game = make("section","atlas-game");
  game.lang = language;
  game.dir = ["he","ar"].includes(language) ? "rtl" : "ltr";
  const heading = make("h1","atlas-game-question");
  heading.id = "atlas-game-question";
  heading.setAttribute("aria-live","polite");
  const status = make("p","atlas-game-feedback");
  status.setAttribute("role","status");
  const figure = make("div","atlas-game-image");
  figure.tabIndex = 0;
  figure.setAttribute("role","group");
  figure.setAttribute("aria-labelledby",heading.id);
  const image = make("img","");
  image.alt = "";
  image.draggable = false;
  const guides = attributes(svgNode("svg"),{class:"atlas-game-guides","aria-hidden":"true"});
  const revealed = make("div","atlas-game-revealed");
  const replay = make("button","atlas-game-replay");
  replay.type = "button";
  replay.textContent = replayText;
  figure.append(image,guides,revealed);
  game.append(heading,status,figure,replay);
  document.body.append(game);
  document.documentElement.classList.add("atlas-playing");

  let queue, cursor;
  const found = [];
  const tags = new Map();
  function currentQuestion(){
    const item = queue[0];
    heading.textContent = item ? question+" "+item.name : complete;
    replay.hidden = Boolean(item);
  }
  function reset(){
    queue = [...items];
    for(let i=queue.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [queue[i],queue[j]]=[queue[j],queue[i]];
    }
    found.length=0;
    tags.clear();
    cursor=null;
    status.textContent="";
    revealed.replaceChildren();
    currentQuestion();
    drawRevealed();
  }

  function drawRevealed(){
    const {width:w,height:h} = image.getBoundingClientRect();
    if(!w || !h)return;
    attributes(guides,{viewBox:"0 0 "+w+" "+h});
    guides.replaceChildren();
    const taken=[];
    for(const item of found){
      const x=item.x*w,y=item.y*h;
      const tag=tags.get(item), tw=tag.offsetWidth, th=tag.offsetHeight;
      const offsets=[[-tw/2,-th-7],[8,-th/2],[-tw-8,-th/2],[-tw/2,8],[12,-th-12],[-tw-12,12],[12,12],[-tw-12,-th-12]];
      for(let r=28;r<=112;r+=14)offsets.push([-tw/2,-th-r],[-tw/2,r],[r,-th/2],[-tw-r,-th/2],[r,r],[-tw-r,-th-r]);
      const options=offsets.map(([dx,dy])=>({left:Math.max(0,Math.min(w-tw,x+dx)),top:Math.max(0,Math.min(h-th,y+dy))}));
      const free=options.find(p=>taken.every(q=>p.left>=q.right+2 || p.left+tw+2<=q.left || p.top>=q.bottom+2 || p.top+th+2<=q.top));
      const {left,top}=free || options[0];
      taken.push({left,top,right:left+tw,bottom:top+th});
      tag.style.left=left+"px";
      tag.style.top=top+"px";
      const endX=Math.max(left,Math.min(left+tw,x)),endY=Math.max(top,Math.min(top+th,y));
      guides.append(attributes(svgNode("line"),{x1:x,y1:y,x2:endX,y2:endY}),attributes(svgNode("circle"),{cx:x,cy:y,r:3}));
    }
    if(cursor)guides.append(attributes(svgNode("circle"),{class:"cursor",cx:cursor.x*w,cy:cursor.y*h,r:7}));
  }
  function attempt(x,y){
    const item=queue[0];
    if(!item)return;
    const bounds=image.getBoundingClientRect();
    if(!bounds.width || !bounds.height)return;
    const distance=entry=>Math.hypot((entry.x-x)*bounds.width,(entry.y-y)*bounds.height);
    const nearest=Math.min(...items.map(distance));
    const tolerance=Math.max(19,Math.min(38,Math.min(bounds.width,bounds.height)*.055));
    if(distance(item)>tolerance || distance(item)>nearest+6){
      status.textContent=again;
      return;
    }
    const tag=make("span","atlas-game-tag");
    tag.textContent=item.name;
    tags.set(item,tag);
    revealed.append(tag);
    found.push(queue.shift());
    status.textContent=correct+" "+found.length+"/"+items.length;
    currentQuestion();
    drawRevealed();
  }
  image.addEventListener("click",event=>{
    const b=image.getBoundingClientRect();
    cursor=null;
    attempt((event.clientX-b.left)/b.width,(event.clientY-b.top)/b.height);
  });
  figure.addEventListener("keydown",event=>{
    const movement={ArrowLeft:[-.025,0],ArrowRight:[.025,0],ArrowUp:[0,-.025],ArrowDown:[0,.025]}[event.key];
    if(movement){
      event.preventDefault();
      if(!cursor)cursor={x:.5,y:.5};
      cursor.x=Math.max(0,Math.min(1,cursor.x+movement[0]));
      cursor.y=Math.max(0,Math.min(1,cursor.y+movement[1]));
      drawRevealed();
    }else if(cursor && (event.key==="Enter" || event.key===" ")){
      event.preventDefault();
      attempt(cursor.x,cursor.y);
    }
  });
  image.addEventListener("load",drawRevealed);
  window.addEventListener("resize",drawRevealed);
  if(typeof ResizeObserver==="function")new ResizeObserver(drawRevealed).observe(image);
  replay.addEventListener("click",reset);
  reset();
  image.src=photo.getAttribute("href") || photo.getAttribute("src");

  if(language==="en" || language==="he")return;
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),6500);
  const query=new URLSearchParams({client:"gtx",sl:"en",tl:language,dt:"t",q:items.map(item=>item.en).join("\n")});
  fetch("https://translate.googleapis.com/translate_a/single?"+query,{signal:controller.signal})
    .then(response=>{if(!response.ok)throw Error("Translation unavailable");return response.json();})
    .then(data=>{
      const lines=data[0].map(segment=>segment[0]).join("").trim().split(/\r?\n/);
      if(lines.length!==items.length || lines.some(line=>!line.trim()))return;
      items.forEach((item,i)=>{
        item.name=lines[i].trim();
        if(tags.has(item))tags.get(item).textContent=item.name;
      });
      currentQuestion();
      drawRevealed();
    }).catch(()=>{}).finally(()=>clearTimeout(timeout));
})();
