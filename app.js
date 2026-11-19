const $=id=>document.getElementById(id);
const namespace="http://www.w3.org/2000/svg";
const phone=window.matchMedia("(max-width: 620px)");
const parts=window.atlasButtons.map(button=>{
  const explanation=window.atlasExplanations[button.id];
  return {...button,enInfo:explanation.en,heInfo:explanation.he};
});
let selected=null;
let language="he";
let translations=[];
let translationRequest;
const cache=new Map();

async function googleTranslate(texts,target,signal){
  const query=new URLSearchParams({client:"gtx",sl:"en",tl:target,dt:"t",q:texts.join("\n")});
  const response=await fetch("https://translate.googleapis.com/translate_a/single?"+query,{signal});
  if(!response.ok)throw new Error("Translation request failed");
  const data=await response.json();
  const lines=data[0].map(segment=>segment[0]).join("").trim().split(/\r?\n/).map(line=>line.trim());
  if(lines.length!==texts.length || lines.some(line=>!line))throw new Error("Unexpected translation response");
  return lines;
}

async function loadLanguage(target){
  translationRequest?.abort();
  language=target;
  const status=$("translationStatus");
  status.hidden=true;
  translations=target==="he"?parts.map(part=>({name:part.he,info:part.heInfo})):cache.get(target)??[];
  drawLabels();
  updateDetail();
  if(target==="en" || cache.has(target))return;
  const controller=new AbortController();
  translationRequest=controller;
  const timer=setTimeout(()=>controller.abort(),6500);
  try{
    const [names,descriptions]=await Promise.all([
      googleTranslate(parts.map(part=>part.en),target,controller.signal),
      googleTranslate(parts.map(part=>part.enInfo),target,controller.signal)
    ]);
    if(translationRequest!==controller || language!==target)return;
    translations=parts.map((part,i)=>({name:target==="he"?part.he:names[i],info:descriptions[i]}));
    cache.set(target,translations);
    drawLabels();
    updateDetail();
  }catch{
    if(translationRequest!==controller || language!==target)return;
    if(target!=="he"){
      status.textContent="Google Translate is unavailable. English is shown.";
      status.hidden=false;
    }
  }finally{
    clearTimeout(timer);
  }
}


function svgNode(tag,attributes){
  const node=document.createElementNS(namespace,tag);
  for(const [name,value] of Object.entries(attributes))node.setAttribute(name,value);
  return node;
}

function speak(text){
  if(!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance!=="function")return;
  const speech=new SpeechSynthesisUtterance(text);
  speech.lang="en-US";
  speech.rate=0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(speech);
}

function highlight(){
  $("horse").querySelectorAll("[data-index]").forEach(node=>{
    const active=Number(node.dataset.index)===selected;
    node.classList.toggle("active",active);
    if(node.classList.contains("label"))node.setAttribute("aria-pressed",String(active));
  });
}

function updateDetail(){
  if(selected===null)return;
  const part=parts[selected];
  const translation=translations[selected];
  const english=document.createElement("span");
  english.lang="en";
  english.textContent=part.en;
  $("term").replaceChildren(english);
  if(translation){
    const translated=document.createElement("bdi");
    translated.lang=language;
    translated.textContent=translation.name;
    $("term").append(" · ",translated);
  }
  $("translation").lang=language;
  $("translation").textContent=translation?.info??"";
  $("translation").hidden=!translation;
  $("explanation").textContent=part.enInfo;
  $("detail").hidden=false;
}

function selectPart(index){
  selected=index;
  highlight();
  updateDetail();
  speak(parts[index].en);
}

let illustrationWidth=0;

function drawLabels(){
  const narrow=phone.matches;
  const unitsWide=narrow?440:800;
  illustrationWidth=$("horse").getBoundingClientRect().width;
  const extraHeight=70*unitsWide/(illustrationWidth || unitsWide);
  const scaleX=narrow?0.60:1;
  const scaleY=scaleX*1.16+extraHeight/410;
  const offsetX=(unitsWide-710*scaleX)/2;
  const offsetY=narrow?96:54;
  const photoBottom=offsetY+442*scaleY;
  const bottomRow=photoBottom+30;
  const canvasHeight=bottomRow+(narrow?75:25);
  $("horse").setAttribute("viewBox",[0,0,unitsWide,canvasHeight].join(" "));
  const transform="translate("+offsetX+" "+offsetY+") scale("+scaleX+" "+scaleY+")";
  $("body").setAttribute("transform",transform);
  $("labels").replaceChildren();
  $("leaders").replaceChildren();
  parts.forEach((part,index)=>{
    const columns=narrow?3:6;
    const top=index<6;
    const slot=top?index:[8,9,10,11,6,7].indexOf(index);
    const x=(slot%columns+.5)*unitsWide/columns;
    const y=(top?25:bottomRow)+Math.floor(slot/columns)*50;
    const [endX,endY]=part.anchor;
    const ax=offsetX+scaleX*endX;
    const ay=offsetY+scaleY*endY;
    const edge=y+(top?22:-22);
    const route="M"+x+" "+edge+" L"+ax+" "+ay;
    const leader=svgNode("path",{d:route,class:"connector","data-index":index});
    $("leaders").append(leader);
    const translation=translations[index]?.name;
    const label=svgNode("g",{class:"label",role:"button",tabindex:"0",
      "aria-label":translation?part.en+" / "+translation:part.en,"data-index":index});
    const width=unitsWide/columns-10;
    label.append(svgNode("rect",{x:x-width/2,y:y-22,width,height:44,rx:6}));
    const translatedWidth=(translation?.length??0)*9;
    const english=svgNode("text",{x,y:translation?y-10:y,lang:"en"});
    english.textContent=part.en;
    if(part.en.length*10>width-12){
      english.setAttribute("style","font-size:"+(part.en.length>=15?16:18)+"px");
      english.setAttribute("textLength",width-12);
      english.setAttribute("lengthAdjust","spacingAndGlyphs");
    }
    label.append(english);
    if(translation){
      const node=svgNode("text",{x,y:y+11,
        class:"translated",lang:language,direction:["he","ar"].includes(language)?"rtl":"ltr"});
      node.textContent=translation;
      label.append(node);
      if(translatedWidth>width-10){
        node.setAttribute("textLength",width-10);
        node.setAttribute("lengthAdjust","spacingAndGlyphs");
      }
    }
    label.addEventListener("click",()=>selectPart(index));
    label.addEventListener("keydown",event=>{
      if(event.key==="Enter" || event.key===" "){event.preventDefault();selectPart(index);}
    });
    $("labels").append(label);
  });
  highlight();
}

$("explanation").addEventListener("click",()=>{
  if(selected!==null)speak(parts[selected].enInfo);
});
const atlasMenu=$("atlas-menu");
atlasMenu.querySelector("a[href='#horse-atlas']").addEventListener("click",()=>{
  atlasMenu.open=false;
});
atlasMenu.addEventListener("keydown",event=>{
  if(event.key==="Escape" && atlasMenu.open){
    atlasMenu.open=false;
    atlasMenu.querySelector("summary").focus();
  }
});
$("restart").addEventListener("click",()=>{
  selected=null;
  window.speechSynthesis?.cancel();
  $("detail").hidden=true;
  atlasMenu.open=false;
  if(language!=="he"){
    $("language").value="he";
    loadLanguage("he");
  }else{
    highlight();
  }
  window.scrollTo(0,0);
});
$("language").addEventListener("change",event=>loadLanguage(event.target.value));
loadLanguage($("language").value || "he");
if(phone.addEventListener)phone.addEventListener("change",drawLabels);
else phone.addListener(drawLabels);
window.addEventListener("resize",()=>{
  if(Math.abs($("horse").getBoundingClientRect().width-illustrationWidth)>0.5)drawLabels();
});
