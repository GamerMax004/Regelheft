/* Wählt Hell/Dunkel, BEVOR die Seite gezeichnet wird (verhindert Aufblitzen).
   Gespeichert wird nur die vom Nutzer gewählte Einstellung (localStorage "regelheft-theme"). */
(function(){
  var t = null;
  try{ t = localStorage.getItem('regelheft-theme'); }catch(e){}
  if(t !== 'dark' && t !== 'light') t = (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', t);
  var m = document.querySelector('meta[name="theme-color"]');
  if(m) m.setAttribute('content', t === 'dark' ? '#0F1218' : '#ffffff');
})();
