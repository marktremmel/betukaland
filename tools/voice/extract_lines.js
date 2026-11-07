/*
 * Every line in Betűkaland that could be spoken, in one file: voice/lines.json
 *   node tools/voice/extract_lines.js
 * Each line: { id, group, char, lang, text }. The id stays the same as long as the line's place
 * in the data stays the same; the renderer caches by a hash of the text, so a fixed typo only
 * re-renders that line. Prints how many characters and roughly how many minutes each group is.
 */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..', '..');
const ctx = { window: {}, BK: {}, console };
ctx.window.BK = ctx.BK;
vm.createContext(ctx);
for (const f of ['words_hu.js', 'words_en.js', 'tales_hu.js', 'tales_en.js', 'halloween.js', 'nemoke.js'])
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8'), ctx, { filename: f });
const W = ctx.window, BK = ctx.BK, out = [];
const add = (id, group, char, lang, text) => { if (text && String(text).trim()) out.push({ id, group, char, lang, text: String(text).trim() }); };
const words = s => [...new Set(String(s).split(/\s+/).filter(Boolean))];

for (const lang of ['hu', 'en']) {
  const L = lang.toUpperCase();
  // NEM OKÉ: Karou tells chapters 1-4, Mrs Owl chapter 5; the story characters' own lines
  const N = BK.NEMOKE_STORY[lang];
  add(`nm.${lang}.title`, 'nemoke', 'karou', lang, N.title);
  add(`nm.${lang}.intro`, 'nemoke', 'karou', lang, N.intro);
  N.chapters.forEach((c, i) => {
    const nar = i === 4 ? 'owl' : 'karou', p = `nm.${lang}.c${i + 1}`;
    add(`${p}.name`, 'nemoke', nar, lang, `${i + 1}. ${c.name}`);
    add(`${p}.intro`, 'nemoke', nar, lang, c.intro);
    add(`${p}.after`, 'nemoke', nar, lang, c.after);
    add(`${p}.card`, 'nemoke', 'karou', lang, c.card);
    add(`${p}.lesson`, 'nemoke', 'karou', lang, c.lesson.replace(/\n/g, ' '));
    (c.beats || []).forEach((b, j) => add(`${p}.beat${j + 1}`, 'nemoke', b.who, lang, b.say.replace(/^"|"$/g, '')));
    if (c.choice) {
      add(`${p}.q`, 'nemoke', nar, lang, c.choice.q);
      c.choice.options.forEach(o => { add(`${p}.opt.${o.key}`, 'nemoke', 'karou', lang, o.label); add(`${p}.reply.${o.key}`, 'nemoke', nar, lang, o.reply); });
    }
  });
  add(`nm.${lang}.end`, 'nemoke', 'karou', lang, N.end);
  add(`nm.${lang}.help`, 'nemoke', 'karou', lang, N.help);
  // Halloween: Denevérke tells it, the Pumpkin King says his lines
  const H = BK.HALLOWEEN_STORY[lang];
  add(`hw.${lang}.intro`, 'halloween', 'bat', lang, H.intro);
  H.stages.forEach((t, i) => add(`hw.${lang}.stage${i + 1}`, 'halloween', 'bat', lang, t));
  H.after.forEach((t, i) => add(`hw.${lang}.after${i + 1}`, 'halloween', 'bat', lang, t));
  add(`hw.${lang}.end`, 'halloween', 'bat', lang, H.end);
  (BK.HALLOWEEN_KING[lang] || []).forEach((t, i) => add(`hw.${lang}.king${i + 1}`, 'halloween', 'king', lang, t));
  // the storybook stories and the tales (narrator)
  (W['BK_STORIES_' + L] || []).forEach(st => { add(`st.${lang}.${st.id}.title`, 'stories', 'narrator', lang, st.title); st.lines.forEach((t, i) => add(`st.${lang}.${st.id}.${i + 1}`, 'stories', 'narrator', lang, t)); });
  (W['BK_TALES_' + L] || []).forEach(tl => { add(`tale.${lang}.${tl.id}.title`, 'tales', 'narrator', lang, tl.title); tl.lines.forEach((t, i) => add(`tale.${lang}.${tl.id}.${i + 1}`, 'tales', 'narrator', lang, t)); });
  // what the child types (read aloud only on request, or for dictation)
  [...new Set(W['BK_SENTENCES_' + L] || [])].forEach((t, i) => add(`sen.${lang}.${i + 1}`, 'sentences', 'reader', lang, t));
  const ws = words((W['BK_WORDS_' + L] || '') + ' ' + (W['BK_NOUNS_' + L] || '') + ' ' + (BK.NEMOKE_WORDS[lang] || []).join(' ') + ' ' + (BK.HALLOWEEN_WORDS[lang] || []).join(' '));
  ws.forEach(w => add(`w.${lang}.${w}`, 'words', 'reader', lang, w));
  (BK.NEMOKE_SENTENCES[lang] || []).concat(BK.HALLOWEEN_SENTENCES[lang] || []).forEach((t, i) => add(`sen.${lang}.th${i + 1}`, 'sentences', 'reader', lang, t));
}
// duplicate ids (a word in two lists) keep the first
const seen = new Set(), lines = out.filter(l => !seen.has(l.id) && seen.add(l.id));
fs.mkdirSync(path.join(ROOT, 'voice'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'voice', 'lines.json'), JSON.stringify(lines, null, 1));
// about 13 characters a second of calm speech, plus a short pause per line
const sum = {};
lines.forEach(l => { const k = l.group + ' ' + l.lang; sum[k] = sum[k] || { n: 0, ch: 0 }; sum[k].n++; sum[k].ch += l.text.length; });
console.log('group lang      lines   chars   ~minutes');
Object.entries(sum).sort().forEach(([k, v]) => console.log(k.padEnd(16), String(v.n).padStart(6), String(v.ch).padStart(7), (v.ch / 13 / 60 + v.n * 0.4 / 60).toFixed(1).padStart(9)));
const chars = {}; lines.forEach(l => chars[l.char + ' ' + l.lang] = (chars[l.char + ' ' + l.lang] || 0) + 1);
console.log('\nby voice:', JSON.stringify(chars));
console.log('\n' + lines.length + ' lines -> voice/lines.json');
