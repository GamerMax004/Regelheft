/* ============================================================
   Darstellung der Regeltexte (Brüche, Wurzeln, Potenzen, Tabellen …)
   Wird von der Startseite (index.js) und vom Übungsmodus (ueben.js) benutzt.
   ============================================================ */
const escapeHtml = RH.esc;
const SUP_MAP = {'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁺':'+','⁻':'−'};
const CLOSERS = {'{':'}','(':')','[':']'};
function matchClose(s, i){
  const open = s[i], close = CLOSERS[open];
  let d = 0;
  for(let k=i;k<s.length;k++){
    if(s[k]===open) d++;
    else if(s[k]===close){ d--; if(d===0) return k; }
  }
  return -1;
}
function topSlash(s){
  let d = 0;
  for(let k=0;k<s.length;k++){
    const c = s[k];
    if(c==='('||c==='{'||c==='[') d++;
    else if(c===')'||c==='}'||c===']') d--;
    else if(c==='/' && d===0) return [s.slice(0,k), s.slice(k+1)];
  }
  return null;
}
function isLetter(ch){ return /[A-Za-zÄÖÜäöüßα-ωΑ-Ω]/.test(ch||''); }
function isMinus(s,i){
  const p = i===0 ? ' ' : s[i-1], n = s[i+1] || ' ';
  if(p===' ' && n===' ') return true;
  const prevOp = i===0 || /[\s(\[{=+·*\/;,:|⇒⇔→<>≤≥≠±^_]/.test(p);
  if(prevOp) return /[0-9A-Za-zα-ωΑ-Ω({√∞.]/.test(n);
  if(/[0-9({√∞]/.test(n)) return true;
  return isLetter(n) && !isLetter(s[i+2]) && !(isLetter(p) && isLetter(s[i-2]));
}
function parseMath(s){
  let out = '', i = 0;
  while(i < s.length){
    const c = s[i];
    if(c==='{'){
      const j = matchClose(s,i);
      if(j<0){ out += '{'; i++; continue; }
      const inner = s.slice(i+1,j), sp = topSlash(inner);
      if(sp) out += '<span class="frac"><span class="num">'+parseMath(sp[0].trim())+'</span><span class="den">'+parseMath(sp[1].trim())+'</span></span>';
      else out += '{'+parseMath(inner)+'}';
      i = j+1; continue;
    }
    if(c==='√'){
      i++; let idx = '';
      if(s[i]==='['){ const j = matchClose(s,i); idx = s.slice(i+1,j); i = j+1; }
      let rad;
      if(s[i]==='('){ const j = matchClose(s,i); rad = s.slice(i+1,j); i = j+1; }
      else { const m = /^[A-Za-z0-9²³πΔ]+/.exec(s.slice(i)); rad = m?m[0]:''; i += rad.length; }
      out += '<span class="sqrt">'+(idx?'<sup class="idx">'+parseMath(idx)+'</sup>':'')+'<span class="rad">√</span><span class="radicand">'+parseMath(rad)+'</span></span>';
      continue;
    }
    if(c==='~' && s[i+1]==='('){
      const j = matchClose(s,i+1);
      out += '<span class="per">'+parseMath(s.slice(i+2,j))+'</span>'; i = j+1; continue;
    }
    if(c==='^' || c==='_'){
      let inner;
      if(s[i+1]==='('){ const j = matchClose(s,i+1); inner = s.slice(i+2,j); i = j+1; }
      else {
        const m = /^[-+]?[A-Za-z0-9]+/.exec(s.slice(i+1));
        if(m){ inner = m[0]; i += 1+inner.length; } else { out += c; i++; continue; }
      }
      out += (c==='^'?'<sup>':'<sub>')+parseMath(inner)+(c==='^'?'</sup>':'</sub>');
      continue;
    }
    if(SUP_MAP[c]!==undefined){
      let run = '';
      while(i<s.length && SUP_MAP[s[i]]!==undefined){ run += SUP_MAP[s[i]]; i++; }
      out += '<sup>'+run+'</sup>'; continue;
    }
    if(c==='-' && isMinus(s,i)){ out += '−'; i++; continue; }
    out += c==='&'?'&amp;':c==='<'?'&lt;':c==='>'?'&gt;':c;
    i++;
  }
  return out;
}
function inline(s){
  // **fett** + Mathe
  return s.split('**').map((seg,k)=> k%2 ? '<b>'+parseMath(seg)+'</b>' : parseMath(seg)).join('');
}
function renderTable(spec){
  const rows = spec.split(' ;; ').map(r=>r.split('§'));
  let h = '<div class="tbl-wrap"><table class="tbl">';
  rows.forEach((cells,ri)=>{
    h += '<tr>' + cells.map(c=>{
      const t = c.replace(/\u200e/g,'').trim();
      return (ri===0?'<th>':'<td>') + inline(t) + (ri===0?'</th>':'</td>');
    }).join('') + '</tr>';
  });
  return h + '</table></div>';
}
function formatBody(body){
  const lines = body.split('\n').map(l=>l.replace(/\s+$/,'')).filter(l=>l.trim().length>0);
  let html = '', i = 0;
  while(i < lines.length){
    const L = lines[i];
    if(L.startsWith('$ ')){
      let items = '';
      while(i<lines.length && lines[i].startsWith('$ ')){
        const raw = lines[i].slice(2);
        const parts = raw.split(' ‖ ');
        items += '<div class="fl"><span class="fl-expr">'+inline(parts[0])+'</span>'+(parts[1]?'<span class="fl-note">'+inline(parts.slice(1).join(' ‖ '))+'</span>':'')+'</div>';
        i++;
      }
      html += '<div class="formula-block">'+items+'</div>';
    } else if(L.startsWith('% ')){
      let pre = '';
      while(i<lines.length && lines[i].startsWith('% ')){ pre += escapeHtml(lines[i].slice(2))+'\n'; i++; }
      html += '<pre class="pre">'+pre.trimEnd()+'</pre>';
    } else if(L.startsWith('- ')){
      let items = '';
      while(i<lines.length && lines[i].startsWith('- ')){ items += '<li>'+inline(lines[i].slice(2))+'</li>'; i++; }
      html += '<ul class="bullet-list">'+items+'</ul>';
    } else if(L.startsWith('! ')){
      html += '<div class="callout">'+inline(L.slice(2))+'</div>'; i++;
    } else if(L.startsWith('## ')){
      html += '<h4 class="subhead">'+inline(L.slice(3))+'</h4>'; i++;
    } else if(L.startsWith('T: ')){
      html += renderTable(L.slice(3)); i++;
    } else {
      const m = /^(\d)\)\s+(.*)$/.exec(L);
      if(m) html += '<p class="step"><span class="n">'+m[1]+'</span><span>'+inline(m[2])+'</span></p>';
      else html += '<p class="prose-line">'+inline(L)+'</p>';
      i++;
    }
  }
  return html;
}

