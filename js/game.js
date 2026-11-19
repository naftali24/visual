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
  let preference = parameters.get("lang");
  if(!preference){try{preference=localStorage.getItem("visualLanguage");}catch{}}
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
    return {id:item.id,index:entries.indexOf(item),x,y,en:item.en,name:language==="he"?item.he:item.en};
  });
  const make = (tag, className) => Object.assign(document.createElement(tag), {className});
  const game = make("section","atlas-game");
  game.lang = language;
  game.dir = ["he","ar"].includes(language) ? "rtl" : "ltr";
  const heading = make("h1","atlas-game-question");
  heading.id = "atlas-game-question";
  heading.setAttribute("aria-live","polite");
  const status = make("p","atlas-game-feedback");
  status.setAttribute("role","status");
  const figure = photo.closest("svg") || photo;
  figure.tabIndex = 0;
  figure.setAttribute("aria-labelledby",heading.id);
  const image = photo;
  const replay = make("button","atlas-game-replay");
  replay.type = "button";
  replay.textContent = replayText;
  game.append(heading,status,replay);
  const detail = document.getElementById("detail");
  detail.insertAdjacentElement("afterend",game);
  document.documentElement.classList.add("atlas-playing");

  let queue, cursor;
  const found = [];
  function currentQuestion(){
    const item = queue[0];
    heading.textContent = item ? item.name : complete;
    heading.setAttribute("aria-label",item ? question+" "+item.name : complete);
    replay.hidden = Boolean(item);
  }
  function reset(){
    queue = [...items];
    for(let i=queue.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [queue[i],queue[j]]=[queue[j],queue[i]];
    }
    found.length=0;
    cursor=null;
    status.textContent="";
    syncRevealed();
    currentQuestion();
    drawCursor();
  }

  const pointer=document.createElementNS("http://www.w3.org/2000/svg","svg");
  pointer.setAttribute("aria-hidden","true");
  pointer.style.cssText="position:fixed;width:18px;height:18px;pointer-events:none;z-index:30;overflow:visible";
  pointer.innerHTML='<circle cx="9" cy="9" r="7" fill="none" stroke="#ffda68" stroke-width="2"/>';
  document.body.append(pointer);
  function drawCursor(){
    pointer.style.display=cursor?"block":"none";
    if(!cursor)return;
    const bounds=image.getBoundingClientRect();
    pointer.style.left=(bounds.left+cursor.x*bounds.width-9)+"px";
    pointer.style.top=(bounds.top+cursor.y*bounds.height-9)+"px";
  }
  window.addEventListener("scroll",drawCursor);
  window.addEventListener("resize",drawCursor);
  const targets = items.map((item, index) => {
    const button = make('button', 'atlas-answer-dot');
    button.type = 'button';
    button.setAttribute('aria-label', (language === 'he' ? 'נקודת תשובה ' : 'Answer point ') + (index + 1));
    button.addEventListener('click', () => {
      if (queue[0] !== item) { status.textContent = again; return; }
      attempt(item.x, item.y);
    });
    document.body.append(button);
    return {item, button};
  });
  function drawTargets(){
    const bounds = image.getBoundingClientRect();
    for (const {item, button} of targets) {
      button.hidden = found.includes(item);
      button.style.left = (bounds.left + item.x * bounds.width) + 'px';
      button.style.top = (bounds.top + item.y * bounds.height) + 'px';
    }
    drawCursor();
  }
  window.addEventListener('atlas-layout', drawTargets);
  window.addEventListener('resize', drawTargets);
  image.addEventListener('load', drawTargets);
  function syncRevealed(){
    drawTargets();
    if(horseBox){
      document.querySelectorAll("#labels [data-index], #leaders [data-index]").forEach(node=>{
        node.classList.toggle("atlas-game-unfound",!found.some(item=>item.index===Number(node.dataset.index)));
      });
    }else{
      const nodes=[...document.querySelectorAll("#above button, #below button")];
      // Match the rendered order, which is grouped and sorted by the atlas.
      const ordered=[...entries].sort((a,b)=>a.y-b.y);
      const half=Math.ceil(ordered.length/2);
      const groups=ordered.some(item=>item.group==="region")
        ? [ordered.filter(item=>item.group==="region"),ordered.filter(item=>item.group!=="region")]
        : [ordered.slice(0,half),ordered.slice(half)];
      const rendered=groups.flatMap(group=>group.sort((a,b)=>a.x-b.x));
      nodes.forEach((node,i)=>node.classList.toggle("atlas-game-unfound",!found.some(item=>item.id===rendered[i]?.id)));
      document.querySelectorAll("#guides line").forEach((node,i)=>{
        node.classList.toggle("atlas-game-unfound",!found.some(item=>item.id===entries[i]?.id));
      });
    }
  }
  const observer=new MutationObserver(syncRevealed);
  for(const id of horseBox?["labels","leaders"]:["guides"]){
    observer.observe(document.getElementById(id),{childList:true});
  }
  let gongAudio;
  async function playGong(){
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      gongAudio ||= new AudioContext();
      if (gongAudio.state === 'suspended') await gongAudio.resume();
      const now = gongAudio.currentTime;
      // Inharmonic, slowly decaying partials give the strike a gong-like ring.
      for (const [frequency, level, decay] of [[180,.24,2.4],[277,.13,1.9],[389,.08,1.5],[563,.04,1.1],[827,.025,.7]]) {
        const tone = gongAudio.createOscillator();
        const envelope = gongAudio.createGain();
        tone.type = 'sine';
        tone.frequency.setValueAtTime(frequency * 1.015, now);
        tone.frequency.exponentialRampToValueAtTime(frequency, now + .25);
        envelope.gain.setValueAtTime(0, now);
        envelope.gain.linearRampToValueAtTime(level, now + .008);
        envelope.gain.exponentialRampToValueAtTime(.0001, now + decay);
        tone.connect(envelope);
        envelope.connect(gongAudio.destination);
        tone.start(now);
        tone.stop(now + decay + .05);
        tone.onended = () => { tone.disconnect(); envelope.disconnect(); };
      }
    } catch {
      // The game remains playable when audio is unavailable.
    }
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
    found.push(queue.shift());
    playGong();
    syncRevealed();
    status.textContent=correct+" "+found.length+"/"+items.length;
    currentQuestion();
    drawCursor();
  }
  image.addEventListener("click",event=>{
    const b=image.getBoundingClientRect();
    cursor=null;
    drawCursor();
    attempt((event.clientX-b.left)/b.width,(event.clientY-b.top)/b.height);
  });
  figure.addEventListener("keydown",event=>{
    const movement={ArrowLeft:[-.025,0],ArrowRight:[.025,0],ArrowUp:[0,-.025],ArrowDown:[0,.025]}[event.key];
    if(movement){
      event.preventDefault();
      if(!cursor)cursor={x:.5,y:.5};
      cursor.x=Math.max(0,Math.min(1,cursor.x+movement[0]));
      cursor.y=Math.max(0,Math.min(1,cursor.y+movement[1]));
      drawCursor();
    }else if(cursor && (event.key==="Enter" || event.key===" ")){
      event.preventDefault();
      attempt(cursor.x,cursor.y);
    }
  });
  replay.addEventListener("click",reset);
  reset();


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
      });
      currentQuestion();
    }).catch(()=>{}).finally(()=>clearTimeout(timeout));
})();
