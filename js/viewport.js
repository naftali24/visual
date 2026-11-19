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
      // Explanations cover the opposite button bank instead of adding a row.
      const active = document.querySelector('.items button[aria-pressed="true"], #labels .label.active');
      if (active && (detail.classList.contains('atlas-detail-overlay') || main.offsetHeight > height - inset * 2)) {
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
          if (!detail.querySelector('.atlas-close-detail')) {
            const close = document.createElement('button');
            close.type = 'button';
            close.className = 'atlas-close-detail';
            close.textContent = '×';
            close.setAttribute('aria-label', 'Close / סגירה');
            close.addEventListener('click', () => { detail.hidden = true; });
            detail.append(close);
          }
          Object.assign(detail.style, {left:(left-parent.left)/factor+'px', top:(y-parent.top)/factor+'px',
            width:(right-left)/factor+'px', height:(bottom-y)/factor+'px'});
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
    #detail.atlas-detail-overlay{position:absolute;z-index:10;margin:0;padding:5px 8px;
      overflow:auto;overscroll-behavior:contain;border-radius:6px;padding-right:34px}
    #detail .atlas-close-detail{position:absolute;right:0;top:0;width:30px;height:30px;
      border:0;background:#1e1608;color:#ffda68;font-size:24px;cursor:pointer}
    #detail.atlas-detail-overlay h2{font-size:18px;margin:0 0 3px}
    #detail.atlas-detail-overlay p,#detail.atlas-detail-overlay button{font-size:16px;line-height:1.2}`;
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
