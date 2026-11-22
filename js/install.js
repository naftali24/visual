(() => {
  const button=document.getElementById('install-app');
  let prompt=null;
  const installed=()=>navigator.standalone===true || matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches;
  function refresh(){button.hidden=installed();}
  addEventListener('beforeinstallprompt',event=>{event.preventDefault();prompt=event;});
  addEventListener('appinstalled',()=>{prompt=null;button.hidden=true;});
  addEventListener('pageshow',refresh);
  button.addEventListener('click',async()=>{
    if(prompt){const pending=prompt;prompt=null;try{await pending.prompt();await pending.userChoice;}catch{}return;}
    alert(/iPhone|iPad|iPod/.test(navigator.userAgent)
      ? 'פתחו ב־Safari: שיתוף ← הוסף למסך הבית. לאחר מכן פתחו את ויזואל מהסמל שנוסף.'
      : 'בתפריט הדפדפן ⋮ בחרו התקנת אפליקציה או הוספה למסך הבית. לאחר מכן פתחו את ויזואל מהסמל שנוסף.');
  });
  refresh();
})();
