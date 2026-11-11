(function () {
  var items = ['Software Developer', 'Full-Stack & Mobile', 'CS @ CSU Fullerton', 'React Native', 'Python', 'Open to roles'];
  var html = ''; for (var i = 0; i < 2; i++) { items.forEach(function (t) { html += '<span>' + t.replace(/&/g, '&amp;') + '</span><span class="sep">||</span>'; }); }
  document.getElementById('track').innerHTML = html;

  var tabs = [].slice.call(document.querySelectorAll('.tab'));
  function show(id, focus) {
    tabs.forEach(function (t) {
      var on = t.getAttribute('aria-controls') === id;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      if (on && focus) t.focus();
    });
    try { history.replaceState(null, '', '#' + id); } catch (e) { }
  }
  function toContent() { document.getElementById('tabbar').scrollIntoView({ behavior: 'smooth' }); }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { show(t.getAttribute('aria-controls')); });
    t.addEventListener('keydown', function (e) {
      var n = null;
      if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
      if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
      if (n !== null) { e.preventDefault(); show(tabs[n].getAttribute('aria-controls'), true); }
    });
  });
  document.getElementById('down').addEventListener('click', toContent);
  document.querySelectorAll('[data-go]').forEach(function (b) {
    b.addEventListener('click', function () { show(b.dataset.go); toContent(); });
  });
  var h = location.hash.slice(1);
  if (h && document.getElementById(h) && document.getElementById(h).classList.contains('panel')) show(h);
})();
