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
    const detail = document.getElementById('detail');
    if (detail && !detail.hidden && !document.documentElement.classList.contains('atlas-playing')) {
      // Measure the explanation in normal flow each time. A previous overlay
      // must not force later, shorter explanations (or larger screens) to overlay.
      detail.classList.remove('atlas-detail-overlay');
      for (const property of ['left', 'top', 'width', 'height', 'max-height']) detail.style.removeProperty(property);
      if (!detail.querySelector('.atlas-close-detail')) {
        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'atlas-close-detail';
        close.textContent = '×';
        close.setAttribute('aria-label', 'Close / סגירה');
        close.addEventListener('click', () => { detail.hidden = true; });
        detail.append(close);
      }
      const needsOverlay = main.offsetHeight > height - inset * 2;
      const active = document.querySelector('.items button[aria-pressed="true"], #labels .label.active');
      if (active && needsOverlay) {
        const top = active.closest('#above') || (active.dataset.index !== undefined && Number(active.dataset.index) < 6);
        const bank = document.getElementById(top ? 'below' : 'above');
        const labels = bank ? [bank] : [...document.querySelectorAll('#labels .label')].filter(node => (Number(node.dataset.index) < 6) !== Boolean(top));
        if (labels.length) {
          const parent = main.getBoundingClientRect();
          const factor = parent.width / main.offsetWidth || 1;
          const boxes = labels.map(node => node.getBoundingClientRect());
          const left = Math.min(...boxes.map(box => box.left));
          const right = Math.max(...boxes.map(box => box.right));
          const y = Math.min(...boxes.map(box => box.top));
          const bottom = Math.max(...boxes.map(box => box.bottom));
          detail.classList.add('atlas-detail-overlay');
          Object.assign(detail.style, {left:(left-parent.left)/factor+'px', top:(y-parent.top)/factor+'px',
            width:(right-left)/factor+'px', maxHeight:(bottom-y)/factor+'px'});
        }
      }
    }
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
    .restart{width:44px;height:44px}
    #detail{position:relative;padding-right:80px;height:auto;min-height:0}
    #detail.atlas-detail-overlay{position:absolute;min-height:0;z-index:10;margin:0;padding:10px 12px;
      overflow:auto;overscroll-behavior:contain;border-radius:6px;padding-right:80px}
    #detail .atlas-close-detail{position:absolute;right:0;top:0;width:64px;height:64px;
      border:2px solid #ffda68;border-radius:10px;background:linear-gradient(#ffe788,#d99a16);color:#241300;font:700 48px/1 Arial,sans-serif;cursor:pointer}
    #detail h2{font-size:24px;margin:0 0 8px}
    #detail p,#detail button:not(.atlas-close-detail){font-size:20px;line-height:1.35}`;
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
