// Keep the complete atlas (including an open explanation or game) in the
// visible viewport. Transform preserves the artwork and all target positions.
(() => {
  const main = document.querySelector('main');
  let pending = false;
  function fit() {
    pending = false;
    const viewport = window.visualViewport;
    const width = viewport?.width || document.documentElement.clientWidth;
    const height = viewport?.height || window.innerHeight;
    const inset = 8;
    main.style.width = Math.min(1050, width) + 'px';
    const scale = Math.min(1, (width - inset * 2) / main.offsetWidth,
      (height - inset * 2) / main.offsetHeight);
    main.style.transform = `translateX(-50%) scale(${Math.max(.01, scale)})`;
    main.style.top = ((viewport?.offsetTop || 0) + inset) + 'px';
    main.style.left = ((viewport?.offsetLeft || 0) + width / 2) + 'px';
    window.dispatchEvent(new Event('atlas-layout'));
  }
  function schedule() {
    if (!pending) { pending = true; requestAnimationFrame(fit); }
  }
  const style = document.createElement('style');
  style.textContent = `html,body{height:100%;min-height:0;overflow:hidden}
    body{padding:0}body>main{position:absolute;margin:0;max-width:none;
    transform-origin:top center;padding:4px}
    .restart{width:44px;height:44px}`;
  document.head.append(style);
  new ResizeObserver(schedule).observe(main);
  new MutationObserver(records => {
    if (records.some(record => !record.target.closest?.("#guides, #leaders"))) schedule();
  }).observe(main, {childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['hidden']});
  window.addEventListener('resize', schedule);
  window.visualViewport?.addEventListener('resize', schedule);
  window.visualViewport?.addEventListener('scroll', schedule);
  document.fonts?.ready.then(schedule);
  schedule();
})();
