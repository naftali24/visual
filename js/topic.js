const get = id => document.getElementById(id);
const page = window.atlasPage;
const notes = window.atlasExplanations;
const stage = get("stage");
const picture = get("picture");
const guides = get("guides");
const buttons = new Map();
let selected = null;
const supportedLanguages=["en","he","ar","es","fr","de","ru","it","pt"];
let requestedLanguage=new URLSearchParams(location.search).get("lang");
if(!requestedLanguage){
  try { requestedLanguage=localStorage.getItem("visualLanguage"); } catch {}
}
const language=supportedLanguages.includes(requestedLanguage)?requestedLanguage:"he";
const homeLabels={en:"Back to topics",he:"חזרה לתפריט הראשי",ar:"العودة إلى الموضوعات",es:"Volver a los temas",fr:"Retour aux sujets",de:"Zurück zur Themenliste",ru:"Вернуться к темам",it:"Torna agli argomenti",pt:"Voltar aos temas"};
const homeLink=get("restart");
homeLink.setAttribute("aria-label",homeLabels[language]);
homeLink.title=homeLabels[language];
const homeUrl=new URL(homeLink.href);
homeUrl.searchParams.set("lang",language);
homeLink.href=homeUrl.href;
homeLink.addEventListener("click",event=>{
  window.speechSynthesis?.cancel();
  if(window.parent!==window && location.protocol!=="file:"){
    event.preventDefault();
    window.parent.postMessage("visual-atlas-home",location.origin);
  }
});
let translations=language==="he"?Object.fromEntries(page.items.map(item=>[item.id,{
  name:item.he,info:notes[item.id].he
}])):{};
document.title = page.title.en;
picture.alt = page.title.en;

function speak(text){
  if(!window.speechSynthesis || typeof SpeechSynthesisUtterance !== "function")return;
  const voice = new SpeechSynthesisUtterance(text);
  voice.lang = "en-US";
  voice.rate = .9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(voice);
}

function drawLines(){
  const bounds = guides.getBoundingClientRect();
  const image = picture.getBoundingClientRect();
  if(!bounds.width || !bounds.height)return;
  guides.setAttribute("viewBox", [0, 0, bounds.width, bounds.height].join(" "));
  const lines = page.items.map(item=>{
    const {button,top} = buttons.get(item.id);
    const box = button.getBoundingClientRect();
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    const points = {
      x1:box.left + box.width/2 - bounds.left,
      y1:(top?box.bottom:box.top) - bounds.top,
      x2:image.left + image.width*item.x/1000 - bounds.left,
      y2:image.top + image.height*item.y/1000 - bounds.top
    };
    for(const [key,value] of Object.entries(points))line.setAttribute(key,value);
    if(item.id === selected)line.setAttribute("class","active");
    return line;
  });
  guides.replaceChildren(...lines);
}

function updateDetail(item){
  const translation=translations[item.id];
  get("term").textContent = translation ? item.en+" · "+translation.name : item.en;
  get("hebrewInfo").textContent = translation?.info ?? "";
  get("hebrewInfo").lang = language;
  get("hebrewInfo").hidden = !translation;
  get("englishInfo").textContent = notes[item.id].en;
  get("detail").hidden = false;
}

function select(item){
  selected=item.id;
  updateDetail(item);
  for(const [id,{button}] of buttons)button.setAttribute("aria-pressed",String(id===selected));
  drawLines();
  speak(item.en);
}

async function loadTranslations(){
  if(language==="en" || language==="he")return;
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),6500);
  async function translate(list){
    const query=new URLSearchParams({client:"gtx",sl:"en",tl:language,dt:"t",q:list.join("\n")});
    const response=await fetch("https://translate.googleapis.com/translate_a/single?"+query,{signal:controller.signal});
    if(!response.ok)throw new Error("Translation unavailable");
    const data=await response.json();
    const lines=data[0].map(segment=>segment[0]).join("").trim().split(/\r?\n/).map(line=>line.trim());
    if(lines.length!==list.length || lines.some(line=>!line))throw new Error("Unexpected translations");
    return lines;
  }
  try {
    const [names,infos]=await Promise.all([translate(page.items.map(item=>item.en)),translate(page.items.map(item=>notes[item.id].en))]);
    translations=Object.fromEntries(page.items.map((item,i)=>[item.id,{name:names[i],info:infos[i]}]));
    for(const [id,{translated}] of buttons){
      translated.textContent=translations[id].name;
      translated.hidden=false;
    }
    const item=page.items.find(entry=>entry.id===selected);
    if(item)updateDetail(item);
    drawLines();
  } catch {
    // English stays available when translation is unavailable.
  } finally {
    clearTimeout(timer);
  }
}

const ordered = [...page.items].sort((a,b)=>a.y-b.y);
const half = Math.ceil(ordered.length/2);
const sections=ordered.some(item=>item.group==="region")
  ? [[ordered.filter(item=>item.group==="region"),true],[ordered.filter(item=>item.group!=="region"),false]]
  : [[ordered.slice(0,half),true],[ordered.slice(half),false]];
for(const [group,top] of sections){
  for(const item of group.sort((a,b)=>a.x-b.x)){
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-pressed","false");
    const english=document.createElement("span");
    english.lang="en";
    english.textContent=item.en;
    const translated=document.createElement("span");
    translated.lang=language;
    translated.dir="auto";
    translated.className="translated";
    translated.textContent=translations[item.id]?.name ?? "";
    translated.hidden=!translations[item.id];
    button.append(english,translated);
    button.addEventListener("click",()=>select(item));
    buttons.set(item.id,{button,top,translated});
    get(top?"above":"below").append(button);
  }
}
loadTranslations();
get("englishInfo").addEventListener("click",()=>{if(selected)speak(notes[selected].en);});
picture.addEventListener("load",drawLines);
window.addEventListener("resize",drawLines);
if(typeof ResizeObserver==="function")new ResizeObserver(drawLines).observe(stage);
drawLines();
