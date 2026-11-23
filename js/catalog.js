const catalog=document.getElementById("catalog");
const viewer=document.getElementById("viewer");
const selector=document.getElementById("language");
const topics=new Map();
const gameToggle=document.getElementById("game-toggle");
const gameTitles={
  en:["Game","Choose a topic to play"],he:["משחק","בחר נושא למשחק"],ar:["لعبة","اختر موضوعًا للعب"],
  es:["Juego","Elige un tema para jugar"],fr:["Jeu","Choisissez un sujet pour jouer"],
  de:["Spiel","Wähle ein Thema zum Spielen"],ru:["Игра","Выберите тему для игры"],
  it:["Gioco","Scegli un argomento per giocare"],pt:["Jogo","Escolha um tema para jogar"]
};
function gameMode(){
  return new URLSearchParams(location.search).get("game")==="1";
}
gameToggle.addEventListener("click",()=>{
  const address=new URL(location.href);
  if(gameMode())address.searchParams.delete("game");
  else address.searchParams.set("game","1");
  history.replaceState(null,"",address);
  translateCatalog();
});
let lastLink;
const labels={
  en:["Naftali’s Visual Book","Topics","Horse – Internal Anatomy","Dog – Internal Anatomy","Atlas language"],
  he:["ספר ויזואלי של נפתלי","נושאים","סוס-אנטומיה פנימית","כלב-אנטומיה פנימית","שפת האטלס"],
  ar:["كتاب نفتالي البصري","الموضوعات","التشريح الداخلي للحصان","التشريح الداخلي للكلب","لغة الأطلس"],
  es:["El libro visual de Naftali","Temas","Anatomía interna del caballo","Anatomía interna del perro","Idioma del atlas"],
  fr:["Le livre visuel de Naftali","Sujets","Anatomie interne du cheval","Anatomie interne du chien","Langue de l’atlas"],
  de:["Naftalis visuelles Buch","Themen","Innere Anatomie des Pferdes","Innere Anatomie des Hundes","Sprache des Atlas"],
  ru:["Визуальная книга Нафтали","Темы","Внутренняя анатомия лошади","Внутренняя анатомия собаки","Язык атласа"],
  it:["Il libro visivo di Naftali","Argomenti","Anatomia interna del cavallo","Anatomia interna del cane","Lingua dell’atlante"],
  pt:["O livro visual de Naftali","Temas","Anatomia interna do cavalo","Anatomia interna do cão","Idioma do atlas"]
};
const sharkTitles={
  en:"Greenland Shark – Anatomy",he:"כריש גרינלנדי-אנטומיה",ar:"تشريح قرش غرينلاند",
  es:"Anatomía del tiburón de Groenlandia",fr:"Anatomie du requin du Groenland",
  de:"Anatomie des Grönlandhais",ru:"Анатомия гренландской акулы",
  it:"Anatomia dello squalo della Groenlandia",pt:"Anatomia do tubarão-da-Groenlândia"
};
const australiaTitles={
  en:"Australia – States and Major Cities",he:"אוסטרליה-מדינות וערים גדולות",ar:"أستراليا – الولايات والمدن الكبرى",
  es:"Australia – Estados y ciudades principales",fr:"Australie – États et grandes villes",
  de:"Australien – Bundesstaaten und Großstädte",ru:"Австралия – штаты и крупные города",
  it:"Australia – Stati e città principali",pt:"Austrália – Estados e cidades principais"
};
let topicTranslationRequest;

function translateCatalog(){
  const lang=selector.value;
  const [title,heading,horse,dog,languageLabel]=labels[lang] || labels.he;
  document.getElementById("language-width").textContent=selector.options[selector.selectedIndex].textContent;
  document.documentElement.lang=lang;
  catalog.dir=["he","ar"].includes(lang)?"rtl":"ltr";
  document.title=title;
  document.getElementById("catalog-title").textContent=title;
  const [gameLabel,gameHeading]=gameTitles[lang] || gameTitles.he;
  gameToggle.setAttribute("aria-label",gameLabel);
  gameToggle.title=gameLabel;
  gameToggle.setAttribute("aria-pressed",String(gameMode()));
  document.getElementById("topic-heading").textContent=gameMode()?gameHeading:heading;
  selector.setAttribute("aria-label",languageLabel);
  selector.title=languageLabel;
  selector.parentElement.title=languageLabel;
  for(const [slug,name] of [["horse",horse],["dog-internal-anatomy",dog],["greenland-shark",sharkTitles[lang] || sharkTitles.he],["australia",australiaTitles[lang] || australiaTitles.he]]){
    const link=topics.get(slug);
    if(link)link.textContent=name;
  }
  topicTranslationRequest?.abort();
  const extra=[...topics.entries()].filter(([slug])=>slug!=="horse" && slug!=="dog-internal-anatomy" && slug!=="greenland-shark" && slug!=="australia");
  for(const [,link] of extra)link.textContent=lang==="he"?link.dataset.original:link.dataset.english;
  if(!extra.length || lang==="en" || lang==="he")return;
  const request=new AbortController();
  topicTranslationRequest=request;
  const timeout=setTimeout(()=>request.abort(),6500);
  const query=new URLSearchParams({client:"gtx",sl:"en",tl:lang,dt:"t",q:extra.map(([,link])=>link.dataset.english).join("\n")});
  fetch("https://translate.googleapis.com/translate_a/single?"+query,{signal:request.signal})
    .then(response=>{if(!response.ok)throw Error("Translation unavailable");return response.json();})
    .then(data=>{
      const lines=data[0].map(segment=>segment[0]).join("").trim().split(/\r?\n/);
      if(selector.value===lang && lines.length===extra.length && lines.every(line=>line.trim())){
        extra.forEach(([,link],i)=>{link.textContent=lines[i].trim();});
      }
    }).catch(()=>{}).finally(()=>clearTimeout(timeout));
}
let languagePreference=new URLSearchParams(location.search).get("lang");
if(!languagePreference){
  try { languagePreference=localStorage.getItem("visualLanguage"); } catch {}
}
selector.value=Object.hasOwn(labels,languagePreference)?languagePreference:"he";
function changeLanguage(){
  try { localStorage.setItem("visualLanguage",selector.value); } catch {}
  const address=new URL(location.href);
  address.searchParams.set("lang",selector.value);
  history.replaceState(null,"",address);
  translateCatalog();
}
selector.addEventListener("input",changeLanguage);
selector.addEventListener("change",changeLanguage);
for(const link of document.querySelectorAll("#topic-links a")){
  const slug=link.getAttribute("href").match(/^\.\/topics\/([a-z0-9-]+)\/(?:index\.html)?$/)?.[1];
  if(!slug)continue;
  topics.set(slug,link);
  link.dataset.original=link.querySelector('[lang="he"]')?.textContent.trim() || link.textContent.trim();
  link.dataset.english=link.querySelector('[lang="en"]')?.textContent.trim() || (slug==="maccabi-haifa-26-squad-1"?"Maccabi Haifa 26 — Squad 1":slug==="maccabi-haifa-26-squad-2"?"Maccabi Haifa 26 — Squad 2":slug==="israel-presidents-2026"?"Presidents of Israel — through 2026":slug==="flying-roadster"?"Musk – The Flying Car":slug.replace(/-\d{8}-[a-f0-9]{6}$/,"")
    .split("-").map(word=>word.charAt(0).toUpperCase()+word.slice(1)).join(" "));
  link.addEventListener("click",event=>{
    if(event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)return;
    event.preventDefault();
    lastLink=link;
    history.pushState(null,"","#"+slug);
    renderTopic();
  });
}
function renderTopic(){
  const link=topics.get(location.hash.slice(1));
  if(!link){
    const wasViewing=!viewer.hidden;
    viewer.hidden=true;
    viewer.removeAttribute("src");
    catalog.hidden=false;
    if(wasViewing)lastLink?.focus();
    return;
  }
  const source=new URL(link.href);
  source.searchParams.set("lang",selector.value);
  source.searchParams.set("v","shared-fullscreen-2");
  if(gameMode())source.searchParams.set("game","1");
  if(viewer.src!==source.href)viewer.src=source.href;
  viewer.title=link.textContent.trim();
  catalog.hidden=true;
  viewer.hidden=false;
  window.scrollTo(0,0);
}
window.addEventListener("popstate",renderTopic);
window.addEventListener("message",event=>{
  if(viewer.hidden || event.source!==viewer.contentWindow || event.origin!==location.origin ||
     event.data!=="visual-atlas-home")return;
  history.replaceState(null,"",location.pathname+location.search);
  renderTopic();
});
translateCatalog();
renderTopic();
