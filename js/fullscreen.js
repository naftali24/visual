// Keep fullscreen on the outer catalog so it survives topic navigation.
(() => {
  function outerWindow() {
    try {
      if (window.parent !== window && window.parent.location.origin === location.origin &&
          typeof window.parent.visualEnterFullscreen === 'function') return window.parent;
    } catch {}
    return window;
  }
  let pending = false;
  async function enterFullscreen() {
    const owner = outerWindow();
    if (owner !== window) return owner.visualEnterFullscreen();
    if (pending || document.fullscreenElement || document.webkitFullscreenElement) return;
    const root = document.documentElement;
    const request = root.requestFullscreen || root.webkitRequestFullscreen;
    if (!request) return;
    pending = true;
    try {
      await request.call(root, {navigationUI:'hide'});
    } catch {
      // Browsers require a user gesture; retry on the next interaction.
    } finally {
      pending = false;
    }
  }
  window.visualEnterFullscreen = enterFullscreen;
  document.addEventListener('pointerup', enterFullscreen, {capture:true, passive:true});
  document.addEventListener('click', enterFullscreen, {capture:true, passive:true});
  document.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') enterFullscreen();
  }, true);
  document.addEventListener('fullscreenchange', () => window.dispatchEvent(new Event('resize')));
  window.addEventListener('pageshow', enterFullscreen);
})();
