"""Builds voice/test/index.html: every test line, every voice side by side, with scores.
Scores stay in the browser (localStorage) and can be exported as a JSON file."""
import json, os, html
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "..", "voice", "test")
os.makedirs(OUT, exist_ok=True)
lines = json.load(open(os.path.join(HERE, "test_lines.json"), encoding="utf-8"))
voices = json.load(open(os.path.join(OUT, "voices.json"), encoding="utf-8")) if os.path.exists(os.path.join(OUT, "voices.json")) else {}
refs_dir = os.path.join(OUT, "_refs")
refs = sorted(os.listdir(refs_dir)) if os.path.isdir(refs_dir) else []
rt = os.path.join(HERE, "..", "..", "voice", "models", "f5-hu", "ref_texts.json")
ref_texts = json.load(open(rt, encoding="utf-8")) if os.path.exists(rt) else {}
have = {v: [l["id"] for l in lines if os.path.exists(os.path.join(OUT, v, l["id"] + ".wav"))] for v in voices}
data = {"lines": lines, "voices": voices, "have": have, "refs": refs, "refTexts": ref_texts}
page = """<!doctype html><html lang="hu"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Betűkaland hangpróba</title>
<style>
:root{--bg:#f6f1e7;--card:#fffaf0;--ink:#3a2a20;--mute:#8a7a6a;--line:#e3d6c0;--acc:#2e6a3e;--sel:#ffd23c}
@media (prefers-color-scheme:dark){:root{--bg:#1d1a17;--card:#27231f;--ink:#efe6d8;--mute:#a89a88;--line:#3b342c;--acc:#8fd6a0;--sel:#b89020}}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.45 -apple-system,system-ui,sans-serif}
main{max-width:1200px;margin:0 auto;padding:16px}
h1{font-size:22px;margin:4px 0 2px}h2{font-size:17px;margin:26px 0 8px}
.mute{color:var(--mute);font-size:13px}
.bar{position:sticky;top:0;background:var(--bg);padding:8px 0;border-bottom:1px solid var(--line);display:flex;gap:8px;flex-wrap:wrap;align-items:center;z-index:2}
button{font:inherit;border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:6px;padding:3px 9px;cursor:pointer}
button.on{background:var(--sel);color:#000}
.line{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px;margin:12px 0}
.text{font-size:18px;font-weight:600}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:8px;margin-top:10px}
.cell{border:1px solid var(--line);border-radius:8px;padding:6px 8px}
.cell.playing{outline:2px solid var(--acc)}
.vn{font-weight:600;font-size:13px}.en{font-size:11px;color:var(--mute)}
audio{width:100%;height:32px;margin:4px 0}
.stars button{padding:1px 7px}
table{border-collapse:collapse;width:100%;background:var(--card)}td,th{border-bottom:1px solid var(--line);padding:5px 8px;text-align:left;font-size:13px;vertical-align:top}
textarea{width:100%;font:inherit;font-size:12px;background:transparent;color:var(--ink);border:1px solid var(--line);border-radius:4px}
</style></head><body><main>
<h1>Betűkaland hangpróba</h1>
<div class="mute">Every voice reads the same lines. Click 1 to 5 under each recording (5 = use this). The table at the top adds them up per voice. The scores are saved in this browser; "Export" downloads them as a file for Claude.</div>
<div class="bar"><span class="mute">Show:</span><button data-l="all" class="on">all</button><button data-l="hu">magyar</button><button data-l="en">English</button>
<span style="flex:1"></span><button id="exp">Export scores</button></div>
<h2>Voices</h2><table id="sum"></table>
<div id="lines"></div>
<h2>Reference speakers (F5 / XTTS can clone any of these)</h2><div class="mute">The voices f5-refNN and xtts-refNN copy these speakers. If you like a speaker here that was not tested, tell Claude its number.</div><div id="refs" class="grid"></div>
</main>
<script>
const D = __DATA__;
let S = {}; try { S = JSON.parse(localStorage.getItem('bk-voice-scores') || '{}'); } catch (e) {}
const save = () => { try { localStorage.setItem('bk-voice-scores', JSON.stringify(S)); } catch (e) {} };
let filter = 'all';
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function render() {
  const L = document.getElementById('lines'); L.innerHTML = '';
  D.lines.filter(l => filter === 'all' || l.lang === filter).forEach(l => {
    const vs = Object.keys(D.voices).filter(v => D.have[v].includes(l.id));
    const d = document.createElement('div'); d.className = 'line';
    d.innerHTML = `<div class="text">${esc(l.text)}</div><div class="mute">${esc(l.id)} · ${esc(l.char)} · ${esc(l.why || '')} <button class="row">▶ all voices in turn</button></div><div class="grid"></div>`;
    const g = d.querySelector('.grid');
    vs.forEach(v => {
      const k = v + '|' + l.id, c = document.createElement('div'); c.className = 'cell';
      c.innerHTML = `<div class="vn">${esc(v)}</div><div class="en">${esc(D.voices[v].engine)}</div><audio controls preload="none" src="${encodeURI(v + '/' + l.id + '.wav')}"></audio><div class="stars">${[1,2,3,4,5].map(n => `<button data-n="${n}" class="${S[k] === n ? 'on' : ''}">${n}</button>`).join('')}</div>`;
      c.querySelectorAll('.stars button').forEach(b => b.onclick = () => { S[k] = +b.dataset.n; save(); render(); });
      g.appendChild(c);
    });
    d.querySelector('.row').onclick = () => playSeq([...g.querySelectorAll('.cell')]);
    L.appendChild(d);
  });
  // summary
  const rows = Object.keys(D.voices).map(v => {
    const sc = D.lines.map(l => S[v + '|' + l.id]).filter(Boolean);
    return { v, n: sc.length, avg: sc.length ? sc.reduce((a, b) => a + b, 0) / sc.length : 0, of: D.have[v].length };
  }).sort((a, b) => b.avg - a.avg);
  document.getElementById('sum').innerHTML = '<tr><th>voice</th><th>engine</th><th>average</th><th>scored</th><th>note</th><th>your note</th></tr>' + rows.map(r =>
    `<tr><td><b>${esc(r.v)}</b><br><button data-v="${esc(r.v)}" class="pv">▶ all lines</button></td><td>${esc(D.voices[r.v].engine)}<br><span class="mute">${esc(D.voices[r.v].langs.join(', '))}</span></td><td>${r.avg ? r.avg.toFixed(2) : '–'}</td><td>${r.n} / ${r.of}</td><td class="mute">${esc(D.voices[r.v].note)}</td><td><textarea data-v="${esc(r.v)}" rows="2">${esc(S['note|' + r.v] || '')}</textarea></td></tr>`).join('');
  document.querySelectorAll('#sum textarea').forEach(t => t.onchange = () => { S['note|' + t.dataset.v] = t.value; save(); });
  document.querySelectorAll('.pv').forEach(b => b.onclick = () => playSeq([...document.querySelectorAll('.cell')].filter(c => c.querySelector('.vn').textContent === b.dataset.v)));
}
let cur = null;
function playSeq(cells) {
  if (cur) cur.stop = true;
  const me = cur = { stop: false }; let i = 0;
  const next = () => {
    document.querySelectorAll('.cell.playing').forEach(c => c.classList.remove('playing'));
    if (me.stop || i >= cells.length) return;
    const c = cells[i++], a = c.querySelector('audio'); c.classList.add('playing'); c.scrollIntoView({ block: 'nearest' });
    a.currentTime = 0; a.onended = () => setTimeout(next, 350); a.play().catch(next);
  };
  next();
}
document.querySelectorAll('.bar button[data-l]').forEach(b => b.onclick = () => { filter = b.dataset.l; document.querySelectorAll('.bar button[data-l]').forEach(x => x.classList.toggle('on', x === b)); render(); });
document.getElementById('exp').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' })); a.download = 'voice_scores.json'; a.click(); };
document.getElementById('refs').innerHTML = D.refs.map(r => { const n = r.replace(/\\D/g, ''); return `<div class="cell"><div class="vn">${esc(r)}</div><audio controls preload="none" src="_refs/${esc(r)}"></audio><div class="en">${esc(D.refTexts[n] || '')}</div></div>`; }).join('');
render();
</script></body></html>"""
open(os.path.join(OUT, "index.html"), "w", encoding="utf-8").write(page.replace("__DATA__", json.dumps(data, ensure_ascii=False)))
print("voice/test/index.html:", len(voices), "voices,", sum(len(x) for x in have.values()), "recordings")
