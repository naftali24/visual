// All topic pages stay in the persistent top-level app shell.
// Installed fullscreen is controlled by the manifest, without repeated API requests.
(() => {
  if (window.parent !== window || location.protocol === 'file:') return;
  const home = new URL('../../index.html', location.href);
  home.search = location.search;
  home.searchParams.delete('v');
  home.hash = location.pathname.split('/').filter(Boolean).at(-2);
  location.replace(home.href);
})();
