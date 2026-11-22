// Keep the complete atlas (including an open explanation or game) in the
// visible viewport. Transform preserves the artwork and all target positions.
(() => {
  const main = document.querySelector('main');
  // Family and legacy pages must return inside the outer viewer, preserving fullscreen.
  document.querySelector('a.restart:not(.ask-gpt)')?.addEventListener('click', event => {
    if(window.parent !== window && location.protocol !== 'file:') {
      event.preventDefault();
      window.speechSynthesis?.cancel();
      window.parent.postMessage('visual-atlas-home', location.origin);
    }
  });
  // Game control is shared by every topic page, centered between Home and GPT.
  const gameButton = document.createElement('button');
  gameButton.type = 'button';
  gameButton.className = 'atlas-bottom-game';
  const isGame = new URLSearchParams(location.search).get('game') === '1';
  gameButton.textContent = '🎮';
  gameButton.title = isGame ? 'חזרה ללימוד / Back to learning' : 'משחק / Game';
  gameButton.setAttribute('aria-label', gameButton.title);
  gameButton.setAttribute('aria-pressed', String(isGame));
  gameButton.addEventListener('click', () => {
    const target = new URL(location.href);
    if (isGame) target.searchParams.delete('game');
    else target.searchParams.set('game', '1');
    location.assign(target.href);
  });
  document.body.append(gameButton);
  const gameStyle = document.createElement('style');
  gameStyle.textContent = '.atlas-bottom-game{position:fixed;bottom:max(0px,env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);z-index:40;width:52px;height:52px;border:1px solid #e2b63e;border-radius:9px;background:#f8e8ad;color:#241805;font:700 27px/1 Arial,sans-serif;display:grid;place-items:center;cursor:pointer;opacity:1}.atlas-bottom-game[aria-pressed="true"]{background:#ffd85b;box-shadow:0 0 0 2px #c68c18}.atlas-bottom-game:focus-visible{outline:2px solid white;outline-offset:2px}';
  document.head.append(gameStyle);

  let pending = false;
  function explanationLayout(totalHeight, detailTop, availableHeight, widthScale) {
    if ((totalHeight - availableHeight) * widthScale <= 30) return 'flow';
    return (availableHeight - detailTop) * widthScale >= 96 ? 'scroll' : 'overlay';
  }
  function fit() {
    pending = false;
    const viewport = window.visualViewport;
    const width = viewport?.width || document.documentElement.clientWidth;
    const height = viewport?.height || window.innerHeight;
    const inset = 8;
    main.style.width = width + 'px';
    const detail = document.getElementById('detail');
    let footerSpace = 0;
    let overlayScaleLimit = Infinity;
    if (detail && !detail.hidden && !document.documentElement.classList.contains('atlas-playing')) {
      // Measure the explanation in normal flow each time. A previous overlay
      // must not force later, shorter explanations (or larger screens) to overlay.
      detail.classList.remove('atlas-detail-overlay', 'atlas-detail-scroll');
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
      const widthScale = Math.min(1, (width - inset * 2) / main.offsetWidth);
      // Leave the bottom navigation buttons outside the reading area.
      footerSpace = 52;
      const availableHeight = (height - inset * 2 - footerSpace) / widthScale;
      const mode = explanationLayout(main.offsetHeight, detail.offsetTop, availableHeight, widthScale);
      if (mode === 'scroll') {
        detail.classList.add('atlas-detail-scroll');
        detail.style.height = Math.max(0, availableHeight - detail.offsetTop - 4) + 'px';
      }
      const needsOverlay = mode === 'overlay';
      if (needsOverlay) footerSpace = 0;
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
          const overlayTop = (y - parent.top) / factor;
          const bankHeight = (bottom - y) / factor;
          Object.assign(detail.style, {
            left:(left-parent.left)/factor+'px',
            top:overlayTop+'px',
            width:(right-left)/factor+'px',
            maxHeight:bankHeight+'px'
          });
          if (top && document.body.matches('[data-mediterranean-layout], [data-explanation-at-image-bottom]')) {
            const photo = document.getElementById('picture').getBoundingClientRect();
            const photoBottom = (photo.bottom - parent.top) / factor;
            footerSpace = 52;
            const usableHeight = height - inset * 2 - footerSpace;
            const panelHeight = Math.min(200, Math.max(1, usableHeight - photoBottom * .01));
            overlayScaleLimit = (usableHeight - panelHeight) / photoBottom;
            const scale = Math.max(.01, Math.min(widthScale, usableHeight / main.offsetHeight, overlayScaleLimit));
            detail.style.top = photoBottom + 'px';
            detail.style.height = detail.style.maxHeight = panelHeight / scale + 'px';
          } else if (top) {
            const finalScale = Math.max(.01, Math.min(widthScale, (height - inset * 2) / main.offsetHeight));
            const overlayHeight = 250 / finalScale;
            detail.style.top = Math.max(0, overlayTop - 100 / finalScale) + 'px';
            detail.style.height = overlayHeight + 'px';
            detail.style.maxHeight = overlayHeight + 'px';
          }
        }
      }
    }
    const scale = Math.min(1, overlayScaleLimit, (width - inset * 2) / main.offsetWidth,
      (height - inset * 2 - footerSpace) / main.offsetHeight);
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
    #stage>#picture{width:100%;height:auto;object-fit:contain}
    .items button[aria-pressed="true"]{background:linear-gradient(#caffd2,#65f18b 55%,#23bd56)!important;border-color:#b6ffcb!important;box-shadow:inset 0 0 0 1px #d0ffda,0 0 10px #39ff78!important;color:#082b12!important}
    .items button[aria-pressed="true"] span{color:#082b12!important;text-shadow:0 0 2px #caffd2}
    #labels .label.active rect{fill:#65f18b;stroke:#b6ffcb;stroke-width:2;filter:drop-shadow(0 0 3px #39ff78)}
    .restart{width:44px;height:44px}
    #detail{position:relative;padding-right:80px;height:auto;min-height:0}
    #detail.atlas-detail-scroll{overflow:auto;overscroll-behavior:contain}
    #detail.atlas-detail-overlay{position:absolute;box-sizing:border-box;min-height:0;z-index:10;margin:0;padding:10px 12px;
      overflow:auto;overscroll-behavior:contain;border-radius:6px;padding-right:80px}
    #detail .atlas-close-detail{position:absolute;right:0;top:0;width:64px;height:64px;
      border:2px solid #ffda68;border-radius:10px;background:linear-gradient(#ffe788,#d99a16);color:#241300;font:700 48px/1 Arial,sans-serif;cursor:pointer}
    #detail h2{font-size:24px;margin:0 0 8px}
    #detail p,#detail button:not(.atlas-close-detail){font-size:20px;line-height:1.35}
    #detail p[lang="he"]{font-size:20px}
    body[data-goalkeeping] #detail p,body[data-goalkeeping] #detail button:not(.atlas-close-detail){font-size:18px}
    body[data-goalkeeping] #detail h2{font-size:22px}`;
  document.head.append(style);
  new ResizeObserver(schedule).observe(main);
  new MutationObserver(records => {
    if (records.some(record => !record.target.closest?.("#guides, #leaders"))) schedule();
  }).observe(main, {childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['hidden']});
  document.getElementById('picture')?.addEventListener('load', schedule);
  window.addEventListener('resize', schedule);
  window.visualViewport?.addEventListener('resize', schedule);
  window.visualViewport?.addEventListener('scroll', schedule);
  document.fonts?.ready.then(schedule);
  schedule();
})();
