const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const out = $('#output');
const preview = $('#preview');
const STORAGE_KEY = 'academy-codelab-web';
const escapeHtml = s =>
    String(s).replace(/[&<>"]/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;'
    }[c]
    ));
function log(msg, type = 'info') {
    const time = new Date().toLocaleTimeString();
    const text = `[${time}] ${String(msg)}`;
    if (out) {
        try {
            const color = type === 'error' ? 'var(--err)' : type === 'warn' ? 'var(--warn)' : 'var(--brand)';
            const line = document.createElement('div');
            line.innerHTML = `<span style="color:${color}">[${time}]</span> ${escapeHtml(msg)}`;
            out.appendChild(line);
            out.scrollTop = out.scrollHeight;
            return;
        } catch (e) { /* fallback to console */ }
    }
    if (type === 'error') console.error(text); else if (type === 'warn') console.warn(text); else console.log(text);
}

function clearOut() { if (out) out.innerHTML = ''; }
if (document.getElementById('clearOut')) document.getElementById('clearOut').addEventListener('click', clearOut);
function makeEditor(id, mode) {
    const ed = ace.edit(id, {
        theme: 'ace/theme/dracula',
        mode, tabSize: 2, useSoftTabs: true, showPrintMargin: false, wrap: true
    });
    ed.session.setUseWrapMode(true);
    ed.commands.addCommand({
        name: 'run', bindKey: { win: 'Ctrl-Enter', mac: 'Command-Enter' },
        exec() { runWeb(false); }
    });
    ed.commands.addCommand({
        name: 'save', bindKey: { win: 'Ctrl-S', mac: 'Command-S' },
        exec() { saveProject(); }
    });
    return ed;
}

const ed_html = makeEditor('ed_html', 'ace/mode/html');
const ed_css = makeEditor('ed_css', 'ace/mode/css');
const ed_js = makeEditor('ed_js', 'ace/mode/javascript');

const autoRun = () => runWeb(false);
if (ed_html && ed_html.session) ed_html.session.on('change', autoRun);
if (ed_css && ed_css.session) ed_css.session.on('change', autoRun);
if (ed_js && ed_js.session) ed_js.session.on('change', autoRun);

const TAB_ORDER = ['html', 'css', 'js'];
const wraps = Object.fromEntries($$('#webEditors .editor-wrap').map(w => [w.dataset.pane, w]));
const editors = { html: ed_html, css: ed_css, js: ed_js };
function activePane() {
    const t = $('#webTabs .tab.active');
    return t ? t.dataset.pane : 'html';
}
function showPane(name) {
    TAB_ORDER.forEach(k => { if (wraps[k]) wraps[k].hidden = (k !== name); });
    $$('#webTabs .tab').forEach(t => {
        const on = t.dataset.pane === name;
        t.classList.toggle('active', on);
        t.setAttribute('aria-selected', on);
        t.tabIndex = on ? 0 : -1;
    });
    requestAnimationFrame(() => {
        const ed = editors[name];
        if (ed && ed.resize) { ed.resize(true); ed.focus(); }
    });
}
$('#webTabs')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.tab'); if (!btn) return;
    showPane(btn.dataset.pane);
});
$('#webTabs')?.addEventListener('keydown', (e) => {
    const idx = TAB_ORDER.indexOf(activePane());
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const delta = e.key === 'ArrowLeft' ? -1 : 1;
        showPane(TAB_ORDER[(idx + delta + TAB_ORDER.length) % TAB_ORDER.length]);
        e.preventDefault();
    }
});
showPane('html');
function buildWebSrcdoc(withTests = false) {
    const html = ed_html.getValue();
    const css = ed_css.getValue();
    const js = ed_js.getValue();
    const tests = ($('#testArea')?.value || '').trim();

    return `<!doctype html>
  
  <html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>${css}\n</style></head>
<body>${html}
<script>
try{
${js}
${withTests && tests ? `\n/* tests */\n${tests}` : ''}
}catch(e){console.error(e)}<\/script>
</body>
</html>`;
}
function runWeb(withTests = false) {
    preview.srcdoc = buildWebSrcdoc(withTests);
    log(withTests ? 'Run with tests.' : 'Web preview updated.');
}
$('#runWeb')?.addEventListener('click', () => runWeb(false));
if (document.getElementById('runTests')) document.getElementById('runTests').addEventListener('click', () => runWeb(true));
$('#openPreview')?.addEventListener('click', () => {
    const src = buildWebSrcdoc(false);
    const w = window.open('about:blank');
    w.document.open(); w.document.write(src); w.document.close();
});
function projectJSON() {
    return {
        version: 1,
        kind: 'web-only',
        assignment: $('#assignment')?.value || '',
        test: $('#testArea')?.value || '',
        html: ed_html.getValue(),
        css: ed_css.getValue(),
        js: ed_js.getValue()
    };
}


function loadProject(obj) {

    try {

        if ($('#assignment')) $('#assignment').value = obj.assignment || '';

        if ($('#testArea')) $('#testArea').value = obj.test || '';

        ed_html.setValue(obj.html || '', -1);

        ed_css.setValue(obj.css || '', -1);

        ed_js.setValue(obj.js || '', -1);

        log('Web project loaded.');

    } catch (e) { log('Unable to load project: ' + e, 'error'); }

}


function setDefaultContent() {
    ed_html.setValue(`<!-- Welcome card -->
<section class="card" style="max-width:520px;margin:24px auto;padding:18px;text-align:center">
  <h1>Welcome to the Academy</h1>
  <p>This example runs locally in the browser.</p>
  <button id="btn">Try me</button>
</section>`, -1);
    ed_css.setValue(`body{font-family:system-ui;background:#f7fafc;margin:0}
h1{color:#0f172a}
#btn{padding:.75rem 1rem;border:0;border-radius:10px;background:#60a5fa;color:#08111f;font-weight:700}`, -1);

    ed_js.setValue(`document.getElementById('btn').addEventListener('click',()=>alert('Well done!'));
console.log('Hello from JavaScript!');`, -1);
}

function saveProject() {
    try {
        const data = JSON.stringify(projectJSON(), null, 2);
        localStorage.setItem(STORAGE_KEY, data);
        const blob = new Blob([data], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'academy-web.json';
        a.click();
        log('Saved locally and downloaded JSON file.');
    } catch (e) { log('Unable to save: ' + e, 'error'); }
}

$('#saveBtn')?.addEventListener('click', saveProject);
$('#loadBtn')?.addEventListener('click', () => $('#openFile').click());
$('#openFile')?.addEventListener('change', async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    try { const obj = JSON.parse(await f.text()); loadProject(obj); }
    catch (err) { log('Invalid project file', 'error'); }
});

try {
    const cache = localStorage.getItem(STORAGE_KEY);
    if (cache) { loadProject(JSON.parse(cache)); }
    else { setDefaultContent(); }
} catch { setDefaultContent(); }

log('Ready — Web-only Editor (HTML/CSS/JS) ✨');

function normalizeProject(raw) {
    if (!raw || typeof raw !== 'object') throw new Error('Not an object');

    const html = typeof raw.html === 'string' ? raw.html : (raw.web && raw.web.html) || '';
    const css = typeof raw.css === 'string' ? raw.css : (raw.web && raw.web.css) || '';
    const js = typeof raw.js === 'string' ? raw.js : (raw.web && raw.web.js) || '';

    return {
        version: 1,
        kind: 'web-only',
        assignment: typeof raw.assignment === 'string' ? raw.assignment : (raw.task || ''),
        test: typeof raw.test === 'string' ? raw.test : (raw.tests || ''),
        html, css, js
    };
}

function safeSetValue(id, val) {
    const el = document.getElementById(id);
    if (el) { el.value = val; }
    else { log(`Warning: #${id} not found; skipped setting value`, 'warn'); }
}

function loadProject(raw) {
    const proj = normalizeProject(raw);
    safeSetValue('assignment', proj.assignment);
    safeSetValue('testArea', proj.test);
    if (typeof ed_html?.setValue === 'function') ed_html.setValue(proj.html, -1);
    if (typeof ed_css?.setValue === 'function') ed_css.setValue(proj.css, -1);
    if (typeof ed_js?.setValue === 'function') ed_js.setValue(proj.js, -1);
    log('Project loaded.');
}

const THEME_KEY = 'mini-editor-theme';
function setTheme(light) {
    if (light) document.body.classList.add('light');
    else document.body.classList.remove('light');
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = light ? '🌞' : '🌙';
    localStorage.setItem(THEME_KEY, light ? 'light' : 'dark');
}

try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') {
        setTheme(saved === 'light');
    } else {
        const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
        setTheme(!!prefersLight);
    }
} catch (e) { setTheme(false); }

document.getElementById('themeToggle')?.addEventListener('click', () => {
    const isLight = document.body.classList.contains('light');
    setTheme(!isLight);
});

function resizeEditors() {
    const list = [ed_html, ed_css, ed_js];
    list.forEach(ed => { try { if (ed && ed.resize) ed.resize(true); } catch (e) { /* ignore */ } });
}

let resizeTimer = null;
window.addEventListener('resize', () => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { resizeEditors(); }, 120);
});

const originalSetTheme = setTheme;
function setThemeAndResize(light) {
    originalSetTheme(light);
    setTimeout(resizeEditors, 50);
}

document.getElementById('themeToggle')?.addEventListener('click', () => {
    const isLight = document.body.classList.contains('light');
    setThemeAndResize(!isLight);
});

window.addEventListener('DOMContentLoaded', () => {
    try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
            const obj = JSON.parse(cached);
            loadProject(obj);
        } else {
            if (!document.getElementById('assignment')) return;
        }
    } catch (e) {
        log('Skipping auto-restore: ' + e, 'warn');
    }
});