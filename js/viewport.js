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

  const detailPanel = (document.getElementById('detail') || document.getElementById('family-detail'));
  if (detailPanel?.id === 'family-detail') {
    main.append(detailPanel);
    const oldClose = document.getElementById('close-info');
    if (oldClose) oldClose.hidden = true;
  }
  const closeDetail = document.createElement('button');
  closeDetail.type = 'button';
  closeDetail.className = 'atlas-close-detail';
  closeDetail.textContent = '×';
  closeDetail.setAttribute('aria-label', 'Close / סגירה');
  closeDetail.title = 'סגירת ההסבר / Close explanation';
  closeDetail.hidden = true;
  closeDetail.addEventListener('click', () => {
    if (detailPanel) detailPanel.hidden = true;
    closeDetail.hidden = true;
    schedule();
  });
  document.body.append(closeDetail);

  let pending = false;
  function fit() {
    pending = false;
    const viewport = window.visualViewport;
    const width = viewport?.width || document.documentElement.clientWidth;
    const height = viewport?.height || window.innerHeight;
    const title = document.getElementById('page-title');
    const titleHeight = title ? title.getBoundingClientRect().height + 8 : 0;
    const footer = 60;
    Object.assign(main.style, {
      width: width + 'px',
      height: Math.max(1, height - titleHeight - footer) + 'px',
      top: ((viewport?.offsetTop || 0) + titleHeight) + 'px',
      left: (viewport?.offsetLeft || 0) + 'px',
      transform: 'none'
    });
    const detail = detailPanel;
    const playing = document.documentElement.classList.contains('atlas-playing');
    closeDetail.hidden = !detail || detail.hidden || playing;
    if (detail) {
      detail.classList.remove('atlas-detail-overlay', 'atlas-detail-scroll');
      for (const property of ['left','top','width','height','max-height']) detail.style.removeProperty(property);
    }
    const stage = document.getElementById('stage') || main.querySelector('.stage');
    const photo = document.getElementById('picture');
    if (stage && photo) {
      const wrap = document.getElementById('photo-wrap');
      const banks = ['upper-controls','lower-controls'].every(id => document.getElementById(id))
        ? ['upper-controls','lower-controls'] : ['above','below'];
      const controlsHeight = banks.reduce((sum, id) => sum + (document.getElementById(id)?.offsetHeight || 0), 0);
      const availableWidth = Math.max(1, stage.clientWidth - 12);
      const availableHeight = Math.max(1, stage.clientHeight - controlsHeight - 12);
      const ratio = photo.naturalWidth && photo.naturalHeight ? photo.naturalWidth / photo.naturalHeight : 1.5;
      const photoWidth = Math.min(availableWidth, availableHeight * ratio);
      Object.assign(photo.style, {width:photoWidth+'px',height:(photoWidth/ratio)+'px',maxWidth:'100%',maxHeight:'none',flex:'0 0 auto'});
      if (wrap) Object.assign(wrap.style,{height:availableHeight+'px',flex:'1 1 0',minHeight:'0'});
    }
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
    #detail{position:relative;height:auto;min-height:0;background:#9a8548!important}
    #detail.atlas-detail-scroll{overflow:auto;overscroll-behavior:contain}
    #detail.atlas-detail-overlay{position:absolute;box-sizing:border-box;min-height:0;z-index:10;margin:0;padding:10px 12px;
      overflow:auto;overscroll-behavior:contain;border-radius:6px}
    .atlas-close-detail{position:fixed;bottom:max(0px,env(safe-area-inset-bottom));right:calc(50% + 36px);z-index:40;width:52px;height:52px;
      border:2px solid #ffda68;border-radius:9px;background:linear-gradient(#ffe788,#d99a16);color:#241300;font:700 40px/1 Arial,sans-serif;cursor:pointer}
    .atlas-close-detail[hidden]{display:none!important}
    .atlas-close-detail:focus-visible{outline:2px solid white;outline-offset:2px}
    #detail h2{font-size:24px;margin:0 0 8px}
    #detail p,#detail button:not(.atlas-close-detail){font-size:20px;line-height:1.35;font-weight:700;text-align:left;direction:ltr}
    #detail p[lang="he"],#detail button[lang="he"]{text-align:right;direction:rtl;color:#62caff!important}
    #detail #englishInfo,#detail #explanation{display:block;width:100%;text-align:left;direction:ltr;font-weight:700}
    #detail p[lang="he"]{font-size:20px}
    body[data-goalkeeping] #detail p,body[data-goalkeeping] #detail button:not(.atlas-close-detail){font-size:18px}
    body[data-goalkeeping] #detail h2{font-size:22px}`;
  style.textContent += `
    html,body{width:100%;height:100%;margin:0;overscroll-behavior:none}
    body>main,body>main#family-main{position:fixed!important;display:flex!important;flex-direction:column!important;justify-content:flex-start!important;min-height:0!important;max-width:none!important;margin:0!important;padding:4px!important;overflow:hidden;transform:none!important}
    main>#stage,main>.stage{display:flex!important;flex-direction:column!important;flex:1 1 0!important;min-height:0!important;overflow:hidden;justify-content:center}
    #above,#below,#upper-controls,#lower-controls{flex:0 0 auto}
    #stage>#picture{align-self:center;object-fit:contain!important;margin:0 auto!important}
    main>.stage>svg{flex:1 1 0;min-height:0;width:100%;height:100%}
    #detail,#family-detail{flex:0 0 auto!important;max-height:25%!important;height:auto!important;overflow:auto!important;overscroll-behavior:contain;margin:4px 0 0!important;background:#9a8548!important}
    #family-detail p{font-weight:700;text-align:right;direction:rtl;color:#62caff}
    #family-detail p[lang="en"],html[lang="en"] #family-detail #info{text-align:left;direction:ltr;color:#241800}
    .atlas-game{flex:0 0 auto;max-height:22%;overflow:auto}
    .restart,.atlas-bottom-game,.atlas-close-detail{bottom:max(4px,env(safe-area-inset-bottom))!important}
  `;
  document.head.append(style);
  new ResizeObserver(schedule).observe(main);
  new MutationObserver(records => {
    if (records.some(record => !record.target.closest?.("#guides, #leaders"))) schedule();
  }).observe(main, {childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['hidden']});
  document.getElementById('picture')?.addEventListener('load', schedule);
  if (detailPanel) new ResizeObserver(schedule).observe(detailPanel);
  window.addEventListener('resize', schedule);
  window.visualViewport?.addEventListener('resize', schedule);
  window.visualViewport?.addEventListener('scroll', schedule);
  document.fonts?.ready.then(schedule);
  schedule();
})();
