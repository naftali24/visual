// All topic pages stay in the persistent top-level app shell.
// Installed fullscreen is controlled by the manifest, without repeated API requests.
(() => {
  const style=document.createElement('style');
  style.textContent='html,body{width:100%;height:100%;margin:0;overflow:hidden;overscroll-behavior:none}body>main.app{height:100%;min-height:0;max-width:none;overflow:hidden}main.app>.image{flex:1 1 0;min-height:0}main.app>.image img{max-height:100%;width:auto;max-width:100%;object-fit:contain}main.app>.info{flex:0 0 auto;max-height:25%;overflow:auto}main.app>.top,main.app>.bottom,main.app>header{flex:0 0 auto}';
  document.head.append(style);
  if (window.parent !== window || location.protocol === 'file:') return;
  const home = new URL('../../index.html', location.href);
  home.search = location.search;
  home.searchParams.delete('v');
  home.hash = location.pathname.split('/').filter(Boolean).at(-2);
  location.replace(home.href);
})();
