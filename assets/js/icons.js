/* ============================================================
   SVG-Icons (Linienstil, einheitlich). Benutzung: icon('star', 20)
   ============================================================ */
const ICON_PATHS = {
  'arrow-left':    '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
  'chevron-left':  '<path d="m15 18-6-6 6-6"/>',
  'chevron-right': '<path d="m9 18 6-6-6-6"/>',
  'x':             '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  'star':          '<path d="M11.5 2.8a.55.55 0 0 1 1 0l2.3 4.7a2.1 2.1 0 0 0 1.6 1.2l5.1.7a.55.55 0 0 1 .3.9l-3.7 3.6a2.1 2.1 0 0 0-.6 1.9l.9 5.1a.55.55 0 0 1-.8.6l-4.6-2.4a2.1 2.1 0 0 0-2 0l-4.6 2.4a.55.55 0 0 1-.8-.6l.9-5.1a2.1 2.1 0 0 0-.6-1.9L2.8 10.3a.55.55 0 0 1 .3-.9l5.1-.7a2.1 2.1 0 0 0 1.6-1.2z"/>',
  'link':          '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  'check':         '<path d="M20 6 9 17l-5-5"/>',
  'clock':         '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  'moon':          '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  'sun':           '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  'image':         '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>'
};
function icon(name, size, filled){
  size = size || 20;
  return '<svg class="ic" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="' + (filled ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON_PATHS[name] + '</svg>';
}
