/* =====================================================
 * 勤怠管理（経理）5.0.0
 *
 * 構成：
 *   1. 設定（クラウド・モード）
 *   2. テーマ（ダークモード）
 *   3. 通知・ダイアログ
 *   4. 期間ユーティリティ（10日締め）
 *   5. データアクセス（localStorage）
 *   6. モード切替（通常／スイミング）
 *   7. クラウド連携（取込・元データ保存）
 *   8. 入力・編集・分割・削除
 *   9. 一覧表示
 *  10. Excelエクスポート
 *  11. バックアップ・リストア
 *  12. 初期化
 * ===================================================== */

/* ============ 1. 設定 ============ */

const CLOUD_URL = 'https://fdvibgxcuviftanwrjnn.supabase.co';
const CLOUD_KEY = 'sb_publishable_DA0blazZouSWkNMIylFKHg_aRPE6Cab';
const ADMIN_PASSWORD = '4564';

// 修正申請スプレッドシート（📋ボタンで画面右半分に開く。モードに応じて切り替わる）
const FIX_SHEET_URLS = {
  normal: 'https://docs.google.com/spreadsheets/d/1QEfzqy7FgpKEc6yq9XZemM5FUSNaPoEft2MmhMwRt8k/edit?usp=sharing',
  swim:   'https://docs.google.com/spreadsheets/d/1nWvfvl5mUJGPZE622L5EA1swR_zpDFyUiiA9UW1JptU/edit?usp=sharing'
};

// Excel・JSONの保存先Googleドライブフォルダ（📁ボタンで開く）
const DRIVE_FOLDER_URL = 'https://drive.google.com/drive/folders/1r0EapIF85w6xQnsPWxo7l7NCc9wsy9cN?usp=sharing';

// 通常／スイミングそれぞれの設定
const MODES = {
  normal: { label: '通常',       device: 'ipad-1',    storageKey: 'timeCards',      nameKey: 'nameUsageOrder' },
  swim:   { label: 'スイミング', device: 'ipad-swim', storageKey: 'timeCards_swim', nameKey: 'nameUsageOrder_swim' }
};

function getMode()  { return localStorage.getItem('tc_mode') || 'normal'; }
function modeCfg()  { return MODES[getMode()]; }

let editingRecord = null;   // 編集中レコード {name, date, index}

/* ============ 2. テーマ ============ */

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.getElementById('themeToggle').textContent = theme === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('theme', theme);
}

function toggleTheme() {
  const next = (localStorage.getItem('theme') || 'light') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
}

/* ============ 3. 通知・ダイアログ ============ */

function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast-notification ${type}`;
  const icons = { success: '✓', error: '✕', info: 'i', warning: '!' };
  toast.innerHTML = `
    <div class="toast-content">
      <div class="toast-icon">${icons[type] || 'i'}</div>
      <div class="toast-message">${esc(message)}</div>
    </div>`;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideOutToast 0.3s ease-in forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function showConfirmDialog(title, message, confirmText = '実行', cancelText = 'キャンセル') {
  return new Promise(resolve => {
    const dialog = document.createElement('div');
    dialog.className = 'ios-dialog';
    dialog.innerHTML = `
      <div class="ios-dialog-content">
        <div class="ios-dialog-header">
          <div class="ios-dialog-title">${esc(title)}</div>
          <div class="ios-dialog-message">${esc(message)}</div>
        </div>
        <div class="ios-dialog-buttons">
          <button class="ios-dialog-button">${esc(cancelText)}</button>
          <button class="ios-dialog-button primary">${esc(confirmText)}</button>
        </div>
      </div>`;
    document.body.appendChild(dialog);
    const [cancelBtn, confirmBtn] = dialog.querySelectorAll('.ios-dialog-button');
    const close = result => { dialog.style.opacity = '0'; setTimeout(() => dialog.remove(), 250); resolve(result); };
    cancelBtn.addEventListener('click', () => close(false));
    confirmBtn.addEventListener('click', () => close(true));
    dialog.addEventListener('click', e => { if (e.target === dialog) close(false); });
  });
}

function showPromptDialog(title, message, defaultValue = '', inputType = 'text') {
  return new Promise(resolve => {
    const dialog = document.createElement('div');
    dialog.className = 'ios-dialog';
    dialog.innerHTML = `
      <div class="ios-dialog-content">
        <div class="ios-dialog-header">
          <div class="ios-dialog-title">${esc(title)}</div>
          <div class="ios-dialog-message">${esc(message)}</div>
          <input type="${inputType}" class="ios-dialog-input" value="${esc(defaultValue)}">
        </div>
        <div class="ios-dialog-buttons">
          <button class="ios-dialog-button">キャンセル</button>
          <button class="ios-dialog-button primary">OK</button>
        </div>
      </div>`;
    document.body.appendChild(dialog);
    const input = dialog.querySelector('input');
    const [cancelBtn, confirmBtn] = dialog.querySelectorAll('.ios-dialog-button');
    setTimeout(() => input.focus(), 100);
    const close = result => { dialog.style.opacity = '0'; setTimeout(() => dialog.remove(), 250); resolve(result); };
    cancelBtn.addEventListener('click', () => close(null));
    confirmBtn.addEventListener('click', () => close(input.value.trim()));
    input.addEventListener('keydown', e => { if (e.key === 'Enter') close(input.value.trim()); });
    dialog.addEventListener('click', e => { if (e.target === dialog) close(null); });
  });
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ============ 4. 期間ユーティリティ（10日締め：11日〜翌月10日） ============ */

// 指定日が属する期間の開始日・終了日
function getMonthPeriod(dateString) {
  const date = new Date(dateString);
  let y = date.getFullYear();
  let m = date.getMonth();
  if (date.getDate() <= 10) { m--; if (m < 0) { m = 11; y--; } }
  const start = new Date(y, m, 11);
  const end   = new Date(y, m + 1, 10);
  return { start, end };
}

// 期間キー "YYYY-MM"（開始月）を返す
function periodKeyOf(dateStr) {
  const y = +dateStr.slice(0, 4), m = +dateStr.slice(5, 7), d = +dateStr.slice(8, 10);
  if (d >= 11) return dateStr.slice(0, 7);
  const py = m === 1 ? y - 1 : y;
  const pm = m === 1 ? 12 : m - 1;
  return py + '-' + String(pm).padStart(2, '0');
}

function periodLabelOf(key) {
  const y = +key.slice(0, 4), m = +key.slice(5, 7);
  const nm = m === 12 ? 1 : m + 1;
  return `${y}年${m}月11日〜${nm}月10日`;
}

// 期間キー "YYYY-MM" → {start, end}
function periodOfKey(key) {
  const y = +key.slice(0, 4), m = +key.slice(5, 7);
  return { start: new Date(y, m - 1, 11), end: new Date(y, m, 10) };
}

// 「最新の月」＝データが存在する期間のうち、締め（10日）を過ぎた最新のもの。
// 例：今日が6/11でデータが5/10〜6/10までなら 5/11〜6/10（R8.5-6）。
// 有給の前倒し入力などで次の期間（6/11以降）のデータがあっても、締め前の期間は選ばない。
// まだ締めていない期間にしかデータが無い場合はその期間を返す。
function getLatestDataPeriod() {
  const data = loadData();
  const keys = new Set();
  for (const name in data) {
    for (const date in data[name]) {
      const d = new Date(date + 'T00:00:00');
      if (!isNaN(d.getTime())) keys.add(periodKeyOf(date));
    }
  }
  if (keys.size === 0) return getMonthPeriod(toDateStr(new Date()));

  const sorted = [...keys].sort();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = periodOfKey(sorted[i]);
    if (p.end <= today) return p;
  }
  return periodOfKey(sorted[sorted.length - 1]);
}

function toDateStr(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function formatDate(dateString) {
  const parts = dateString.split('-');
  return parts.length === 3 ? `${parts[1]}-${parts[2]}` : dateString;
}

/* ============ 5. データアクセス ============ */

function loadDataFor(mode) {
  try {
    const obj = JSON.parse(localStorage.getItem(MODES[mode].storageKey) || '{}');
    return (obj && typeof obj === 'object' && !Array.isArray(obj)) ? obj : {};
  } catch { return {}; }
}

function loadData() { return loadDataFor(getMode()); }

function saveData(data) {
  localStorage.setItem(modeCfg().storageKey, JSON.stringify(data));
  scheduleFolderSave();          // フォルダ連携中なら、そちらにも自動で保存する
  scheduleAppSend();             // アプリ（はくつるポータル）へも自動で送る
}

/* ---- アプリ（はくつるポータル）への自動送信 ----
 * 保存のたびに、変わった締め期間だけをアプリへ送る。失敗しても TC5 の動作は変えない。
 * 鍵は localStorage の appHrKey（バックアップ・設定ファイルには入れない）。 */
const APP_URL = 'https://hakutsuru-portal.pages.dev';
const APP_KEY_KEY = 'appHrKey';
const APP_STATUS_KEY = 'appHrStatus';
const APP_MAX_PERIODS = 24;
const appSentKey = mode => 'appHrSent_' + mode;

// 名前・日付の順をそろえて、短いハッシュ（FNV-1a）にする
function appHashOf(periodObj) {
  const names = Object.keys(periodObj || {}).sort();
  const canon = names.map(n => [n, Object.keys(periodObj[n]).sort().map(d => [d, periodObj[n][d]])]);
  const s = JSON.stringify(canon);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16) + ':' + s.length;
}

// 1モード分の勤怠を締め期間ごとにまとめる（送る項目だけ。空の日は除く）
function appGroupByPeriod(data) {
  const out = {};
  for (const name in (data || {})) {
    const days = data[name] || {};
    for (const date in days) {
      const recs = days[date];
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Array.isArray(recs) || !recs.length) continue;
      const key = periodKeyOf(date);
      const p = out[key] = out[key] || {};
      (p[name] = p[name] || {})[date] = recs.filter(Boolean).map(r => ({
        checkIn: String(r.checkIn || ''), checkOut: String(r.checkOut || ''), isPaidLeave: !!r.isPaidLeave
      }));
    }
  }
  return out;
}

// 送る内容を決める。sent = {期間: 前回送ったハッシュ}。
// 戻り値 { periods: {期間: 中身 or {}}, hashes: {期間: ハッシュ or ''(消した)} }
function appPlanSend(data, sent, max) {
  const grouped = appGroupByPeriod(data);
  sent = sent || {};
  const all = [...new Set([...Object.keys(grouped), ...Object.keys(sent)])].sort().reverse().slice(0, max || APP_MAX_PERIODS);
  const periods = {}, hashes = {};
  for (const key of all) {
    if (grouped[key]) {
      const h = appHashOf(grouped[key]);
      if (sent[key] !== h) { periods[key] = grouped[key]; hashes[key] = h; }
    } else {
      periods[key] = {}; hashes[key] = '';      // 前に送った期間が空になった → アプリ側も空にする
    }
  }
  return { periods, hashes };
}

function appPayload(mode, periods) {
  return { format: 'tc5-app-upload', version: 1, sentAt: new Date().toISOString(), mode, periods };
}

function appSetStatus(text, ok) {
  try { localStorage.setItem(APP_STATUS_KEY, JSON.stringify({ text, ok: !!ok })); } catch {}
  const el = document.getElementById('appSendStatus');
  if (el) el.textContent = text;
}

function appLoadSent(mode) {
  try {
    const o = JSON.parse(localStorage.getItem(appSentKey(mode)) || '{}');
    return (o && typeof o === 'object' && !Array.isArray(o)) ? o : {};
  } catch { return {}; }
}

let appSendTimer = null;
let appSendBusy = false;
function scheduleAppSend(delay) {
  try {
    clearTimeout(appSendTimer);
    appSendTimer = setTimeout(() => { appSendNow(false); }, delay == null ? 5000 : delay);
  } catch {}
}

// force=true：送った記録を消して、新しい24期間をすべて送り直す
async function appSendNow(force) {
  clearTimeout(appSendTimer);
  // 送っている最中なら、少し後にもう一度。ここは try の外で見る
  // (try の中で return すると、下の finally が「送っている最中」の印を外してしまうため)
  if (appSendBusy) { scheduleAppSend(3000); return; }
  appSendBusy = true;
  try {
    const key = (localStorage.getItem(APP_KEY_KEY) || '').trim();
    if (!key) { appSetStatus('アプリへの送信: 鍵が未設定', false); return; }
    if (force) for (const m of Object.keys(MODES)) localStorage.removeItem(appSentKey(m));
    const now = new Date();
    const done = [];
    for (const mode of Object.keys(MODES)) {
      const sent = appLoadSent(mode);
      const plan = appPlanSend(loadDataFor(mode), sent, APP_MAX_PERIODS);
      const keys = Object.keys(plan.periods);
      if (!keys.length) continue;
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 20000);
      let res;
      try {
        res = await fetch(APP_URL + '/api/hr/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-HR-Key': key },
          body: JSON.stringify(appPayload(mode, plan.periods)),
          signal: ctrl.signal
        });
      } catch (e) {
        appSetStatus('送信できませんでした（ネットにつながっていません）', false); return;
      } finally { clearTimeout(to); }
      if (res.status === 401) { appSetStatus('送信できませんでした（鍵が違います）', false); return; }
      if (res.status === 503) { appSetStatus('送信できませんでした（アプリ側の準備ができていません）', false); return; }
      if (!res.ok) { appSetStatus('送信できませんでした（エラー ' + res.status + '）', false); return; }
      for (const k of keys) { if (plan.hashes[k]) sent[k] = plan.hashes[k]; else delete sent[k]; }
      localStorage.setItem(appSentKey(mode), JSON.stringify(sent));
      done.push(MODES[mode].label + ' ' + keys.length + '期間');
    }
    if (done.length) {
      appSetStatus('送信済み ' + (now.getMonth() + 1) + '/' + now.getDate() + ' ' + now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0') + '（' + done.join('、') + '）', true);
    } else if (force) {
      appSetStatus('送るデータがありません', true);
    }
  } catch (e) {
    try { appSetStatus('送信できませんでした', false); } catch {}
  } finally {
    appSendBusy = false;
  }
}

function updateNameUsageOrder(name) {
  const key = modeCfg().nameKey;
  const usage = JSON.parse(localStorage.getItem(key) || '{}');
  usage[name] = Date.now();
  localStorage.setItem(key, JSON.stringify(usage));
}

// 重複を除外しながら2つのデータを統合
function mergeTimeCards(existing, incoming) {
  const merged = JSON.parse(JSON.stringify(existing));
  let added = 0;
  for (const name in incoming) {
    if (!merged[name]) merged[name] = {};
    for (const date in incoming[name]) {
      if (!merged[name][date]) merged[name][date] = [];
      incoming[name][date].forEach(card => {
        const dup = merged[name][date].some(c =>
          c.checkIn === card.checkIn &&
          (c.checkOut || null) === (card.checkOut || null) &&
          !!c.isPaidLeave === !!card.isPaidLeave
        );
        if (!dup) { merged[name][date].push(card); added++; }
      });
    }
  }
  return { merged, added };
}

/* ============ 6. モード切替 ============ */

function setMode(mode) {
  localStorage.setItem('tc_mode', mode);
  document.querySelectorAll('#modeSwitch button').forEach(b =>
    b.classList.toggle('active', b.dataset.mode === mode));
  document.getElementById('listTitle').textContent = `勤怠一覧（${modeCfg().label}）`;
  cancelEdit();
  refreshNameList();
  displayTimeCards();
  updateRawSaveInfo();
  // クラウドログイン済みなら接続先デバイスを切り替えて再読込
  if (cloudToken && !document.getElementById('cloudMain').classList.contains('hidden')) {
    cloudLoadSnapshots();
  }
}

/* ============ 7. クラウド連携 ============ */

let cloudToken = sessionStorage.getItem('tc_cloud_token') || '';
let cloudSnapshots = [];
let cloudCurrent = null;   // 読込中のスナップショット {day, updated_at, record_count, data}

function cloudHeaders() {
  return { 'apikey': CLOUD_KEY, 'Authorization': 'Bearer ' + cloudToken, 'Content-Type': 'application/json' };
}

async function cloudLogin() {
  const email = document.getElementById('cloudEmail').value.trim();
  const password = document.getElementById('cloudPassword').value;
  const errBox = document.getElementById('cloudLoginError');
  errBox.innerHTML = '';
  try {
    const res = await fetch(CLOUD_URL + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: { 'apikey': CLOUD_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      let detail = 'ログインに失敗しました (HTTP ' + res.status + ')';
      try {
        const err = await res.json();
        const code = err.error_code || err.error || '';
        if (code === 'invalid_credentials' || code === 'invalid_grant') detail = 'メールアドレスまたはパスワードが違います。';
      } catch {}
      errBox.innerHTML = `<div class="error">${esc(detail)}</div>`;
      return;
    }
    const json = await res.json();
    cloudToken = json.access_token;
    sessionStorage.setItem('tc_cloud_token', cloudToken);
    showCloudMain();
  } catch {
    errBox.innerHTML = '<div class="error">通信エラーです。ネット接続を確認してください。</div>';
  }
}

function cloudLogout() {
  cloudToken = '';
  sessionStorage.removeItem('tc_cloud_token');
  cloudCurrent = null;
  document.getElementById('cloudMain').classList.add('hidden');
  document.getElementById('cloudLogin').classList.remove('hidden');
}

function showCloudMain() {
  document.getElementById('cloudLogin').classList.add('hidden');
  document.getElementById('cloudMain').classList.remove('hidden');
  cloudLoadSnapshots();
}

// 現在モードのデバイスのスナップショット一覧を取得
async function cloudLoadSnapshots() {
  const device = modeCfg().device;
  const res = await fetch(
    CLOUD_URL + '/rest/v1/tce_backups?select=id,day,record_count,updated_at' +
    '&device=eq.' + encodeURIComponent(device) + '&order=day.desc&limit=90',
    { headers: cloudHeaders() }
  );
  if (res.status === 401) { cloudLogout(); return; }
  if (!res.ok) { showToast('クラウドの読み込みに失敗しました (HTTP ' + res.status + ')', 'error'); return; }
  cloudSnapshots = await res.json();

  const sel = document.getElementById('cloudSnapshotSel');
  sel.innerHTML = cloudSnapshots.map(s =>
    `<option value="${s.id}">${s.day}（${s.record_count}件）</option>`).join('');

  if (cloudSnapshots.length === 0) {
    cloudCurrent = null;
    document.getElementById('cloudSnapMeta').textContent = 'まだバックアップが届いていません。';
    document.getElementById('cloudPeriodSel').innerHTML = '';
    document.getElementById('cloudSummary').innerHTML = '';
    return;
  }
  cloudLoadSnapshot(cloudSnapshots[0].id);
}

async function cloudLoadSnapshot(id) {
  const res = await fetch(
    CLOUD_URL + '/rest/v1/tce_backups?id=eq.' + id + '&select=day,updated_at,record_count,data',
    { headers: cloudHeaders() }
  );
  if (res.status === 401) { cloudLogout(); return; }
  const rows = await res.json();
  cloudCurrent = rows[0] || null;
  if (!cloudCurrent) return;

  const t = new Date(cloudCurrent.updated_at);
  document.getElementById('cloudSnapMeta').textContent =
    `最終送信: ${t.toLocaleString('ja-JP')} ／ 総記録数: ${cloudCurrent.record_count}件`;

  // 期間プルダウンを作成
  const data = cloudData();
  const periods = new Set();
  for (const name in data) {
    for (const d in data[name]) periods.add(periodKeyOf(d));
  }
  const sorted = [...periods].sort().reverse();
  document.getElementById('cloudPeriodSel').innerHTML =
    sorted.map(p => `<option value="${p}">${periodLabelOf(p)}</option>`).join('');

  renderCloudSummary();
}

// クラウドの生データ（旧combined形式にも対応）
function cloudData() {
  if (!cloudCurrent || !cloudCurrent.data) return {};
  const d = cloudCurrent.data;
  if (d.normal !== undefined || d.swim !== undefined) return d[getMode()] || {};
  return d;
}

// 選択期間だけに絞ったクラウドデータ
function cloudDataForPeriod() {
  const period = document.getElementById('cloudPeriodSel').value;
  const data = cloudData();
  const filtered = {};
  for (const name in data) {
    for (const d in data[name]) {
      if (periodKeyOf(d) !== period) continue;
      if (!filtered[name]) filtered[name] = {};
      filtered[name][d] = data[name][d];
    }
  }
  return filtered;
}

// ミニビューワー（名前・日数・合計時間）
function renderCloudSummary() {
  const data = cloudDataForPeriod();
  const names = Object.keys(data).sort((a, b) => a.localeCompare(b, 'ja'));
  const box = document.getElementById('cloudSummary');
  if (names.length === 0) {
    box.innerHTML = '<p class="hint">この期間のデータはありません。</p>';
    return;
  }
  let html = '<table><tr><th>名前</th><th>日数</th><th>合計</th></tr>';
  for (const name of names) {
    let days = 0, total = 0, incomplete = 0;
    for (const d in data[name]) {
      days++;
      for (const rec of data[name][d]) {
        if (rec.checkIn && rec.checkOut) total += calculateTimeDifference(rec.checkIn, rec.checkOut);
        else if (rec.checkIn) incomplete++;
      }
    }
    html += `<tr><td>${esc(name)}</td><td>${days}日</td><td>${total.toFixed(1)}h${incomplete ? ' ⚠' : ''}</td></tr>`;
  }
  html += '</table>';
  box.innerHTML = html;
}

/*
 *  その期間のローカルの記録を、クラウドの記録で置き換える（他の期間には触らない）。
 *  有給は残す。有給はPC（TC5・有給管理ツール）で入れるものでクラウドには無いので、
 *  消すと戻ってこないため。
 */
function overwritePeriod(local, incoming, period) {
  const out = {};
  let removed = 0, keptPaid = 0;
  for (const name in local) {
    for (const d in local[name]) {
      const recs = Array.isArray(local[name][d]) ? local[name][d] : [];
      if (periodKeyOf(d) !== period) {
        (out[name] = out[name] || {})[d] = recs;
        continue;
      }
      const paid = recs.filter(r => r && r.isPaidLeave);
      removed += recs.length - paid.length;
      keptPaid += paid.length;
      if (paid.length) (out[name] = out[name] || {})[d] = paid;
    }
  }
  const { merged, added } = mergeTimeCards(out, incoming);
  return { data: merged, removed, keptPaid, added };
}

// クラウドの記録数を数える
function countRecords(data) {
  let n = 0;
  for (const name in data) for (const d in data[name]) n += (data[name][d] || []).length;
  return n;
}

// 統合か上書きかを選んでもらう。'merge' / 'overwrite' / null（やめる）
function chooseCloudImportMode(message) {
  return new Promise(resolve => {
    const dialog = document.createElement('div');
    dialog.className = 'ios-dialog';
    dialog.innerHTML = `
      <div class="ios-dialog-content">
        <div class="ios-dialog-header">
          <div class="ios-dialog-title">クラウドデータ取込</div>
          <div class="ios-dialog-message" style="white-space:pre-line;">${esc(message)}</div>
        </div>
        <div class="ios-dialog-buttons" style="flex-direction: column;">
          <button class="ios-dialog-button" data-act="merge" style="border-left:none;border-bottom:1px solid var(--border);">統合（今の記録に足す・同じものは除外）</button>
          <!-- primary は赤（消す操作の色）。ファイルのリストアと同じく上書きに付ける -->
          <button class="ios-dialog-button primary" data-act="overwrite" style="border-left:none;border-bottom:1px solid var(--border);">上書き（この期間をクラウドの内容に置き換え）</button>
          <button class="ios-dialog-button" data-act="cancel" style="border-left:none;">キャンセル</button>
        </div>
      </div>`;
    document.body.appendChild(dialog);
    const close = act => {
      dialog.style.opacity = '0';
      setTimeout(() => dialog.remove(), 250);
      resolve(act === 'merge' || act === 'overwrite' ? act : null);
    };
    dialog.addEventListener('click', e => {
      if (e.target === dialog) { close(null); return; }
      const act = e.target.dataset && e.target.dataset.act;
      if (act) close(act);
    });
  });
}

// クラウド → ローカルへ取込。統合（重複は除外）か、その期間の上書きかを選ぶ
async function cloudImport() {
  if (!cloudCurrent) { showToast('クラウドデータが読み込まれていません', 'warning'); return; }
  const incoming = cloudDataForPeriod();
  if (Object.keys(incoming).length === 0) { showToast('この期間のデータがありません', 'warning'); return; }

  const period = document.getElementById('cloudPeriodSel').value;
  const label = `【${modeCfg().label}】${periodLabelOf(period)}`;
  // 上書きしたら何が消えて何が残るかを、選ぶ前に見せる
  const preview = overwritePeriod(loadData(), incoming, period);
  const act = await chooseCloudImportMode(
    `${label} のクラウドの記録 ${countRecords(incoming)}件 を取り込みます。\n\n`
    + '統合：今の記録はそのまま。クラウドにだけある記録を足します。\n'
    + `上書き：この期間の今の記録 ${preview.removed}件 を消して、クラウドの記録に置き換えます。`
    + `${preview.keptPaid ? `有給 ${preview.keptPaid}件 は消さずに残します。` : ''}`
    + 'ほかの期間は変わりません。'
  );
  if (!act) return;

  if (act === 'merge') {
    const { merged, added } = mergeTimeCards(loadData(), incoming);
    saveData(merged);
    refreshNameList();
    displayTimeCards();
    showToast(added > 0 ? `${added}件の記録を取り込みました` : '新しい記録はありませんでした（すべて取込済み）', 'success');
    return;
  }

  // 上書きは元に戻せないので、もう一度だけ確かめる
  const ok = await showConfirmDialog(
    '上書きの確認',
    `${label} の今の記録 ${preview.removed}件 を消して、クラウドの内容に置き換えます。\n`
    + '手で直した時刻もクラウドの時刻に戻ります。元に戻せません。'
    + `${preview.keptPaid ? `\n（有給 ${preview.keptPaid}件 は残します）` : ''}`,
    '上書きする'
  );
  if (!ok) return;

  const result = overwritePeriod(loadData(), incoming, period);
  saveData(result.data);
  refreshNameList();
  displayTimeCards();
  showToast(`${periodLabelOf(period)} をクラウドの内容に置き換えました（${result.added}件`
    + `${result.keptPaid ? `・有給${result.keptPaid}件はそのまま` : ''}）`, 'success');
}

// 元データの月次ローカル保存
function cloudRawSave() {
  if (!cloudCurrent) { showToast('クラウドデータが読み込まれていません', 'warning'); return; }
  const data = cloudDataForPeriod();
  if (Object.keys(data).length === 0) { showToast('この期間のデータがありません', 'warning'); return; }

  const period = document.getElementById('cloudPeriodSel').value;
  const py = +period.slice(0, 4);
  const pm = +period.slice(5, 7);
  const nm = pm === 12 ? 1 : pm + 1;

  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  // Excelと同じ R{令和}.{開始月}-{終了月} 形式
  a.download = `勤怠元データ_${modeCfg().label}_R${py - 2018}.${pm}-${nm}.json`;
  a.click();
  URL.revokeObjectURL(url);

  localStorage.setItem('lastRawSave_' + getMode(), new Date().toISOString());
  updateRawSaveInfo();
  showToast('元データを保存しました', 'success');
}

// 前回の元データ保存日を表示（1ヶ月超なら注意表示）
function updateRawSaveInfo() {
  const el = document.getElementById('rawSaveInfo');
  const last = localStorage.getItem('lastRawSave_' + getMode());
  if (!last) {
    el.innerHTML = '⚠ <b>元データはまだ保存されていません。</b>月1回の保存をおすすめします。';
    return;
  }
  const d = new Date(last);
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  const dateStr = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  el.innerHTML = days > 31
    ? `⚠ 前回の元データ保存: ${dateStr}（${days}日前）<b>そろそろ保存してください。</b>`
    : `前回の元データ保存: ${dateStr}`;
}

/* ============ 8. 入力・編集・分割・削除 ============ */

/* --- 有給用カレンダー（クリックで複数日選択） --- */

let paidSelectedDates = new Set();   // 選択中の日付 'YYYY-MM-DD'
let paidCalCursor = new Date();      // 表示中の月

function renderPaidCalendar() {
  const box = document.getElementById('paidCalendar');
  const y = paidCalCursor.getFullYear();
  const m = paidCalCursor.getMonth();
  const startDow = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const todayStr = toDateStr(new Date());

  let html = `
    <div class="cal-header">
      <button type="button" class="cal-nav" data-nav="-1">◀</button>
      <span>${y}年${m + 1}月</span>
      <button type="button" class="cal-nav" data-nav="1">▶</button>
    </div>
    <div class="cal-grid">
      ${['日','月','火','水','木','金','土'].map(w => `<div class="cal-dow">${w}</div>`).join('')}`;
  for (let i = 0; i < startDow; i++) html += '<div></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = toDateStr(new Date(y, m, d));
    const cls = ['cal-day'];
    if (paidSelectedDates.has(ds)) cls.push('sel');
    if (ds === todayStr) cls.push('today');
    html += `<div class="${cls.join(' ')}" data-date="${ds}">${d}</div>`;
  }
  html += '</div>';
  if (paidSelectedDates.size > 0) {
    html += `<div class="cal-count">${paidSelectedDates.size}日選択中</div>`;
  }
  box.innerHTML = html;
}

// カレンダーの選択をテキスト欄（MM-DD表示）と西暦欄に反映
function syncDateMultiFromCalendar() {
  const dates = [...paidSelectedDates].sort();
  document.getElementById('dateMulti').value = dates.map(d => d.slice(5)).join(', ');
  if (dates.length > 0) document.getElementById('paidLeaveYear').value = +dates[0].slice(0, 4);
}

function saveTimeCard() {
  const name = document.getElementById('name').value.trim();
  const isPaidLeave = document.getElementById('isPaidLeave').checked;
  if (!name) { showToast('名前を入力してください', 'warning'); return; }

  const checkIn = document.getElementById('checkIn').value;
  const checkOut = document.getElementById('checkOut').value;
  if (!checkIn) { showToast('出勤時間を入力してください', 'warning'); return; }
  if (!checkOut) { showToast('退勤時間を入力してください（出勤・退勤の両方が必要です）', 'warning'); return; }

  // 有給の時間帯②（中抜けの人向け・任意）
  const checkIn2 = isPaidLeave ? document.getElementById('checkIn2').value : '';
  const checkOut2 = isPaidLeave ? document.getElementById('checkOut2').value : '';
  if ((checkIn2 && !checkOut2) || (!checkIn2 && checkOut2)) {
    showToast('時間帯②は出勤・退勤の両方を入力してください', 'warning');
    return;
  }

  const finalDates = collectDates(isPaidLeave);
  if (!finalDates) return;

  const cardsToAdd = [{ checkIn, checkOut: checkOut || null, isPaidLeave }];
  if (checkIn2 && checkOut2) cardsToAdd.push({ checkIn: checkIn2, checkOut: checkOut2, isPaidLeave });

  const data = loadData();
  if (!data[name]) data[name] = {};
  finalDates.forEach(dateStr => {
    if (!data[name][dateStr]) data[name][dateStr] = [];
    cardsToAdd.forEach(c => data[name][dateStr].push({ ...c }));
  });
  saveData(data);
  updateNameUsageOrder(name);
  refreshNameList();

  if (!isPaidLeave) {
    resetForm();
    showToast('送信が完了しました', 'success');
  } else {
    // 連続入力しやすいよう、有給モードのまま次の人の入力へ
    document.getElementById('name').value = '';
    document.getElementById('checkIn').value = '';
    document.getElementById('checkOut').value = '';
    document.getElementById('checkIn2').value = '';
    document.getElementById('checkOut2').value = '';
    document.getElementById('dateMulti').value = '';
    paidSelectedDates.clear();
    renderPaidCalendar();
    showToast(`送信が完了しました（有給 ${name}・${finalDates.length}日分）`, 'success');
    document.getElementById('name').focus();
  }
  displayTimeCards();
}

// フォームから日付（複数）を取り出す
function collectDates(isPaidLeave) {
  if (isPaidLeave) {
    // カレンダーで選択していればそれを優先（年またぎもそのまま使える）
    if (paidSelectedDates.size > 0) return [...paidSelectedDates].sort();
    const year = document.getElementById('paidLeaveYear').value.trim();
    const multi = document.getElementById('dateMulti').value.trim();
    if (!year)  { showToast('有給用の西暦を入力してください', 'warning'); return null; }
    if (!multi) { showToast('月日を入力してください', 'warning'); return null; }
    const splitted = multi.split(',')
      .map(s => s.trim())
      .filter(s => s !== '')
      .map(s => (s.length === 4 && s.indexOf('-') === -1) ? s.slice(0, 2) + '-' + s.slice(2) : s);
    if (splitted.length === 0) { showToast('月日を入力してください', 'warning'); return null; }
    return splitted.map(md => `${year}-${md}`);
  }
  const single = document.getElementById('dateSingle').value;
  if (!single) { showToast('月日を入力してください', 'warning'); return null; }
  return [single];
}

function editTimeCard(name, date, index) {
  const data = loadData();
  const card = data[name] && data[name][date] && data[name][date][index];
  if (!card) return;

  editingRecord = { name, date, index };
  document.getElementById('name').value = name;
  document.getElementById('dateSingle').value = date;
  document.getElementById('checkIn').value = card.checkIn || '';
  document.getElementById('checkOut').value = card.checkOut || '';
  document.getElementById('isPaidLeave').checked = !!card.isPaidLeave;

  if (card.isPaidLeave) {
    const yearMatch = date.match(/^(\d{4})-/);
    if (yearMatch) {
      document.getElementById('paidLeaveYear').value = yearMatch[1];
      document.getElementById('dateMulti').value = formatDate(date);
    }
    setPaidLeaveFields(true);
    // 編集は1件単位なので、カレンダー選択と時間帯②は使わない
    paidSelectedDates.clear();
    renderPaidCalendar();
    document.getElementById('secondTimeGroup').classList.add('hidden');
  }

  document.getElementById('submitBtn').textContent = '更新';
  document.getElementById('cancelEditBtn').classList.remove('hidden');
  document.getElementById('timeCardForm').scrollIntoView({ behavior: 'smooth' });
}

function updateTimeCard() {
  const name = document.getElementById('name').value.trim();
  const isPaidLeave = document.getElementById('isPaidLeave').checked;
  if (!name) { showToast('名前を入力してください', 'warning'); return; }

  const checkIn = document.getElementById('checkIn').value;
  const checkOut = document.getElementById('checkOut').value;
  if (!checkIn) { showToast('出勤時間を入力してください', 'warning'); return; }
  if (!checkOut) { showToast('退勤時間を入力してください（出勤・退勤の両方が必要です）', 'warning'); return; }

  const finalDates = collectDates(isPaidLeave);
  if (!finalDates) return;

  const data = loadData();

  // 元のレコードを削除
  data[editingRecord.name][editingRecord.date].splice(editingRecord.index, 1);
  if (data[editingRecord.name][editingRecord.date].length === 0) delete data[editingRecord.name][editingRecord.date];
  if (Object.keys(data[editingRecord.name]).length === 0) delete data[editingRecord.name];

  // 新しい内容で追加
  const card = { checkIn, checkOut: checkOut || null, isPaidLeave };
  if (!data[name]) data[name] = {};
  finalDates.forEach(dateStr => {
    if (!data[name][dateStr]) data[name][dateStr] = [];
    data[name][dateStr].push(card);
  });

  saveData(data);
  updateNameUsageOrder(name);
  refreshNameList();
  showToast('更新が完了しました', 'success');
  cancelEdit();
  displayTimeCards();
}

function cancelEdit() {
  editingRecord = null;
  resetForm();
  document.getElementById('submitBtn').textContent = '送信';
  document.getElementById('cancelEditBtn').classList.add('hidden');
}

function resetForm() {
  document.getElementById('timeCardForm').reset();
  document.getElementById('isPaidLeave').checked = false;
  setPaidLeaveFields(false);
}

function setPaidLeaveFields(on) {
  document.getElementById('normalDateGroup').classList.toggle('hidden', on);
  document.getElementById('paidLeaveYearGroup').classList.toggle('hidden', !on);
  document.getElementById('multiDateGroup').classList.toggle('hidden', !on);
  document.getElementById('secondTimeGroup').classList.toggle('hidden', !on);
  document.getElementById('dateSingle').required = !on;
  document.getElementById('paidLeaveYear').required = on;
  document.getElementById('dateMulti').required = on;
  if (on) {
    renderPaidCalendar();
  } else {
    paidSelectedDates.clear();
    document.getElementById('checkIn2').value = '';
    document.getElementById('checkOut2').value = '';
  }
}

async function deleteTimeCard(name, date, index) {
  const ok = await showConfirmDialog('記録の削除', `${name} ${formatDate(date)} の記録を削除しますか？`, '削除');
  if (!ok) return;
  const data = loadData();
  data[name][date].splice(index, 1);
  if (data[name][date].length === 0) delete data[name][date];
  if (Object.keys(data[name]).length === 0) delete data[name];
  saveData(data);
  displayTimeCards();
  showToast('記録を削除しました', 'success');
}

// 分割（中抜け対応）
async function splitTimeCard(name, date, index) {
  const data = loadData();
  const card = data[name] && data[name][date] && data[name][date][index];
  if (!card || !card.checkIn || !card.checkOut) {
    showToast('出勤・退勤時間が両方登録されている記録のみ分割できます', 'warning');
    return;
  }

  const breakStartInput = await showPromptDialog(
    '中抜け開始時間',
    `中抜け開始時間を入力してください（例: 12:00 または 1200）\n現在の記録: ${card.checkIn} 〜 ${card.checkOut}`);
  if (!breakStartInput) return;
  const breakStart = normalizeTimeInput(breakStartInput);
  if (!breakStart) { showToast('無効な時刻形式です（例: 12:00、1200、820）', 'error'); return; }

  const breakEndInput = await showPromptDialog(
    '中抜け終了時間',
    `中抜け終了時間を入力してください（例: 13:00 または 1300）\n中抜け開始: ${breakStart}`);
  if (!breakEndInput) return;
  const breakEnd = normalizeTimeInput(breakEndInput);
  if (!breakEnd) { showToast('無効な時刻形式です（例: 13:00、1300、830）', 'error'); return; }

  if (!isValidTimeOrder(card.checkIn, breakStart, breakEnd, card.checkOut)) {
    showToast(`時間の順序が正しくありません。\n出勤 < 中抜け開始 < 中抜け終了 < 退勤\n\n出勤: ${card.checkIn} / 開始: ${breakStart} / 終了: ${breakEnd} / 退勤: ${card.checkOut}`, 'error');
    return;
  }

  const ok = await showConfirmDialog(
    '記録を分割',
    `以下のように分割しますか？\n\n【1】${card.checkIn} 〜 ${breakStart}\n【2】${breakEnd} 〜 ${card.checkOut}`,
    '分割する');
  if (!ok) return;

  data[name][date].splice(index, 1);
  data[name][date].push({ checkIn: card.checkIn, checkOut: breakStart, isPaidLeave: !!card.isPaidLeave });
  data[name][date].push({ checkIn: breakEnd, checkOut: card.checkOut, isPaidLeave: !!card.isPaidLeave });
  saveData(data);
  showToast('記録を分割しました', 'success');
  displayTimeCards();
}

function isValidTimeOrder(t1, t2, t3, t4) {
  const ts = [t1, t2, t3, t4].map(t => new Date(`1970-01-01T${t}`));
  return ts[0] < ts[1] && ts[1] < ts[2] && ts[2] < ts[3];
}

function normalizeTimeInput(input) {
  if (!input) return null;
  input = input.trim();
  let h, m;
  if (/^\d{1,2}:\d{2}$/.test(input))      [h, m] = input.split(':').map(Number);
  else if (/^\d{4}$/.test(input))         { h = +input.slice(0, 2); m = +input.slice(2); }
  else if (/^\d{3}$/.test(input))         { h = +input.slice(0, 1); m = +input.slice(1); }
  else return null;
  if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  }
  return null;
}

async function requestPasswordAndClearData() {
  const password = await showPromptDialog('データクリア', `【${modeCfg().label}】の全データを削除します。パスワードを入力してください:`, '', 'password');
  if (password === null) return;
  if (password !== ADMIN_PASSWORD) { showToast('パスワードが違います', 'error'); return; }
  // フォルダ連携中は、フォルダの中身も空になる（自動保存なので）。そのことを先に伝える
  const inFolder = dirHandle && fsReady
    ? `\n\nフォルダ「${dirHandle.name}」に保存されている【${modeCfg().label}】の勤怠も空になります。`
    : '';
  const ok = await showConfirmDialog('データクリア確認', `本当に【${modeCfg().label}】のすべてのデータをクリアしますか？${inFolder}`, '削除');
  if (!ok) return;
  localStorage.removeItem(modeCfg().storageKey);
  scheduleFolderSave();
  scheduleAppSend();
  refreshNameList();
  displayTimeCards();
  showToast('すべてのデータを削除しました', 'success');
}

/* ============ 9. 一覧表示 ============ */

function refreshNameList() {
  const data = loadData();
  const usage = JSON.parse(localStorage.getItem(modeCfg().nameKey) || '{}');
  const names = Object.keys(data).sort((a, b) => (usage[b] || 0) - (usage[a] || 0));
  document.getElementById('nameList').innerHTML =
    names.map(n => `<option value="${esc(n)}">`).join('');
}

// 一覧に出す期間。null＝最新の月（印刷の「最新の月」と同じ。データが増えれば一緒に動く）。
// ほかは 'YYYY-MM'（締めの期間）・'custom'（期間指定）・'all'（すべて）。ページを開いている間だけ覚える
let listPeriodSel = null;

// 期間の選択肢を作り直し、いま出す範囲 { from, to }（"YYYY-MM-DD"）を返す。すべてなら null
function listPeriodRange(data) {
  const sel = document.getElementById('listPeriod');
  const keys = new Set();
  for (const name in data) for (const date in data[name]) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) keys.add(periodKeyOf(date));
  }
  const latestKey = toDateStr(getLatestDataPeriod().start).slice(0, 7);
  keys.add(latestKey);
  const sorted = [...keys].sort().reverse();
  // 選んでいた月がこのモードに無ければ最新の月を出す（選んだことは覚えたまま）
  let cur = listPeriodSel || latestKey;
  if (/^\d{4}-\d{2}$/.test(cur) && !keys.has(cur)) cur = latestKey;
  sel.innerHTML = sorted.map(k => `<option value="${k}">${periodLabelOf(k)}${k === latestKey ? '（最新）' : ''}</option>`).join('')
    + '<option value="custom">期間指定</option><option value="all">すべて</option>';
  sel.value = cur;
  document.getElementById('listCustomRange').classList.toggle('hidden', cur !== 'custom');
  if (cur === 'all') return null;
  if (cur === 'custom') {
    return { from: document.getElementById('listFrom').value || '0000-00-00', to: document.getElementById('listTo').value || '9999-99-99' };
  }
  const p = periodOfKey(cur);
  return { from: toDateStr(p.start), to: toDateStr(p.end) };
}

function displayTimeCards() {
  const filter = document.getElementById('searchName').value.trim().toLowerCase();
  const data = loadData();
  const range = listPeriodRange(data);
  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = '';

  const names = Object.keys(data)
    .filter(name => name.toLowerCase().includes(filter))
    .sort((a, b) => a.localeCompare(b, 'ja'));

  let hasRecords = false;

  names.forEach(name => {
    const group = document.createElement('div');
    group.className = 'name-group';
    group.innerHTML = `<div class="name-header">${esc(name)}</div>`;

    Object.keys(data[name]).sort().forEach(date => {
      if (!Array.isArray(data[name][date])) return;
      if (range && (date < range.from || date > range.to)) return;
      data[name][date].forEach((card, index) => {
        if (!card || !card.checkIn) return;
        hasRecords = true;

        const paidLabel = card.isPaidLeave ? '<span class="record-status status-paid">有給</span>' : '';
        const checkOutDisplay = card.checkOut
          ? `<span class="record-time">${esc(card.checkOut)}</span>`
          : '<span class="record-status status-incomplete">未登録</span>';
        const splitBtn = card.checkOut
          ? `<button class="btn-xs split" data-action="split" data-name="${esc(name)}" data-date="${date}" data-index="${index}">分割</button>` : '';

        const row = document.createElement('div');
        row.className = 'record-card';
        row.innerHTML = `
          <div class="record-info">
            <input type="checkbox" class="rec-check" title="一括編集の対象に選択" data-name="${esc(name)}" data-date="${date}" data-index="${index}">
            <span class="record-date">${formatDate(date)}</span>
            <span class="record-time">${esc(card.checkIn)}</span>
            <span>→</span>
            ${checkOutDisplay}
            ${paidLabel}
          </div>
          <div class="record-buttons">
            <button class="btn-xs edit" data-action="edit" data-name="${esc(name)}" data-date="${date}" data-index="${index}">編集</button>
            ${splitBtn}
            <button class="btn-xs delete" data-action="delete" data-name="${esc(name)}" data-date="${date}" data-index="${index}">削除</button>
          </div>`;
        group.appendChild(row);
      });
    });

    if (group.children.length > 1) resultDiv.appendChild(group);
  });

  if (!hasRecords) {
    resultDiv.innerHTML = Object.keys(data).length
      ? '<div class="no-data">この期間の記録はありません</div>'
      : '<div class="no-data">まだ記録がありません</div>';
  }
  updateBulkBar();
}

/* --- 一括編集（チェックした記録をまとめて変更・削除） --- */

function selectedRecords() {
  return [...document.querySelectorAll('.rec-check:checked')].map(cb => ({
    name: cb.dataset.name, date: cb.dataset.date, index: +cb.dataset.index
  }));
}

function updateBulkBar() {
  const n = document.querySelectorAll('.rec-check:checked').length;
  document.getElementById('bulkBar').classList.toggle('hidden', n === 0);
  document.getElementById('bulkCount').textContent = `${n}件選択中`;
}

function showBulkEditDialog(count) {
  return new Promise(resolve => {
    const dialog = document.createElement('div');
    dialog.className = 'ios-dialog';
    dialog.innerHTML = `
      <div class="ios-dialog-content">
        <div class="ios-dialog-header">
          <div class="ios-dialog-title">まとめて時間変更（${count}件）</div>
          <div class="ios-dialog-message">空欄の項目は変更されません。\n（出勤だけ・退勤だけの修正もできます）</div>
          <div class="form-group" style="margin-top:14px;">
            <label>出勤時間</label>
            <input type="time" id="bulkCheckIn">
          </div>
          <div class="form-group">
            <label>退勤時間</label>
            <input type="time" id="bulkCheckOut">
          </div>
        </div>
        <div class="ios-dialog-buttons">
          <button class="ios-dialog-button">キャンセル</button>
          <button class="ios-dialog-button primary">変更する</button>
        </div>
      </div>`;
    document.body.appendChild(dialog);
    const [cancelBtn, okBtn] = dialog.querySelectorAll('.ios-dialog-button');
    const close = result => { dialog.style.opacity = '0'; setTimeout(() => dialog.remove(), 250); resolve(result); };
    cancelBtn.addEventListener('click', () => close(null));
    okBtn.addEventListener('click', () => close({
      checkIn: dialog.querySelector('#bulkCheckIn').value,
      checkOut: dialog.querySelector('#bulkCheckOut').value
    }));
    dialog.addEventListener('click', e => { if (e.target === dialog) close(null); });
  });
}

async function bulkEditTimes() {
  const recs = selectedRecords();
  if (recs.length === 0) return;
  const v = await showBulkEditDialog(recs.length);
  if (!v) return;
  if (!v.checkIn && !v.checkOut) { showToast('変更する時間を入力してください', 'warning'); return; }

  const data = loadData();
  let changed = 0;
  recs.forEach(r => {
    const card = data[r.name] && data[r.name][r.date] && data[r.name][r.date][r.index];
    if (!card) return;
    if (v.checkIn) card.checkIn = v.checkIn;
    if (v.checkOut) card.checkOut = v.checkOut;
    changed++;
  });
  saveData(data);
  displayTimeCards();
  showToast(`${changed}件の時間を変更しました`, 'success');
}

async function bulkDelete() {
  const recs = selectedRecords();
  if (recs.length === 0) return;
  const ok = await showConfirmDialog('まとめて削除', `選択した${recs.length}件の記録を削除しますか？`, '削除');
  if (!ok) return;

  const data = loadData();
  // 同じ名前・日付の中で index がずれないよう、大きい index から削除
  recs.sort((a, b) => b.index - a.index);
  recs.forEach(r => {
    if (!data[r.name] || !data[r.name][r.date]) return;
    data[r.name][r.date].splice(r.index, 1);
    if (data[r.name][r.date].length === 0) delete data[r.name][r.date];
    if (Object.keys(data[r.name]).length === 0) delete data[r.name];
  });
  saveData(data);
  refreshNameList();
  displayTimeCards();
  showToast(`${recs.length}件削除しました`, 'success');
}

/* ============ 10. Excelエクスポート ============ */

function calculateTimeDifference(startTime, endTime) {
  const start = new Date(`1970-01-01T${startTime}`);
  const end = new Date(`1970-01-01T${endTime}`);
  return parseFloat(((end - start) / 3600000).toFixed(2));
}

function calculateEarlyMorningTime(startTime, endTime) {
  const limit = new Date('1970-01-01T08:30');
  const start = new Date(`1970-01-01T${startTime}`);
  const end = new Date(`1970-01-01T${endTime}`);
  if (end <= limit) return calculateTimeDifference(startTime, endTime);
  if (start < limit) return calculateTimeDifference(startTime, '08:30');
  return 0;
}

function calculateEveningTime(startTime, endTime) {
  const limit = new Date('1970-01-01T16:00');
  const start = new Date(`1970-01-01T${startTime}`);
  const end = new Date(`1970-01-01T${endTime}`);
  if (start >= limit) return calculateTimeDifference(startTime, endTime);
  if (end > limit) return calculateTimeDifference('16:00', endTime);
  return 0;
}

// 並び順（通常・スイミング共通の印刷順）は、画面で並べ替えたものを端末に保存して使う。
// このツールは公開リポジトリ（GitHub Pages）で配っているので、職員の氏名はソースに書かない。
// 初期値は空（未設定の端末では五十音順）。別の端末へは、エクスポート画面の
// 「設定を書き出す／読み込む」で並び順・資格／バス・サンプルの人をまとめて持っていく。
// （データが無くても空の表を印刷する「手書き用」の機能は、使わなくなったので外した。2026-10）

// 印刷のときにサンプルを作る人（通常）。氏名はソースに書かず、印刷画面で入力して保存する。
// 勤怠データには保存しない。印刷・Excelのたびに、選んだ期間の分をその場で作る。
const SAMPLE_KEY = 'samplePeople';
const SAMPLE_ON_KEY = 'sampleEnabled';      // 「サンプルを付ける」のON/OFF（このPCだけで覚える）

function loadSamplePeople() {
  try {
    const arr = JSON.parse(localStorage.getItem(SAMPLE_KEY) || '[]');
    return Array.isArray(arr) ? arr.map(n => String(n).trim()).filter(Boolean) : [];
  } catch { return []; }
}

function saveSamplePeople(names) {
  localStorage.setItem(SAMPLE_KEY, JSON.stringify(names));
  markSettingsChanged();
}

function sampleEnabled() { return localStorage.getItem(SAMPLE_ON_KEY) !== '0'; }

// 日本の祝日（2020年以降のルール：振替休日・国民の休日を含む）。"YYYY-MM-DD" の Set
const JP_HOLIDAY_CACHE = {};
function jpHolidays(year) {
  if (JP_HOLIDAY_CACHE[year]) return JP_HOLIDAY_CACHE[year];
  const key = (m, d) => toDateStr(new Date(year, m - 1, d));
  const nthMonday = (m, n) => 1 + ((8 - new Date(year, m - 1, 1).getDay()) % 7) + (n - 1) * 7;
  const t = year - 1980, leap = Math.floor(t / 4);
  const base = [
    key(1, 1), key(1, nthMonday(1, 2)), key(2, 11), key(2, 23),
    key(3, Math.floor(20.8431 + 0.242194 * t - leap)),            // 春分の日
    key(4, 29), key(5, 3), key(5, 4), key(5, 5),
    key(7, nthMonday(7, 3)), key(8, 11), key(9, nthMonday(9, 3)),
    key(9, Math.floor(23.2488 + 0.242194 * t - leap)),            // 秋分の日
    key(10, nthMonday(10, 2)), key(11, 3), key(11, 23)
  ];
  const set = new Set(base);
  const shift = (s, n) => { const d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); return toDateStr(d); };
  // 国民の休日：祝日にはさまれた日（9月の敬老の日と秋分の日の間など）
  for (const s of base) {
    const mid = shift(s, 1);
    if (!set.has(mid) && set.has(shift(s, 2)) && new Date(mid + 'T00:00:00').getDay() !== 0) set.add(mid);
  }
  // 振替休日：祝日が日曜なら、その後の祝日でない最初の日
  for (const s of base) {
    if (new Date(s + 'T00:00:00').getDay() !== 0) continue;
    let d = shift(s, 1);
    while (set.has(d)) d = shift(d, 1);
    set.add(d);
  }
  return (JP_HOLIDAY_CACHE[year] = set);
}

// 名前と日付から決まる乱数（同じ期間を何度印刷しても同じ時刻になる）
function seededRandom(seed) {
  let h = 2166136261;
  for (const ch of seed) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); }
  return () => {
    h = (h + 0x6D2B79F5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// サンプルの勤怠：from〜to の平日に、午前（10時〜14時ごろ）と午後（15時〜19時ごろ）。
// 休みの日は restDays（はくつるポータルの予定表で休みの日）で外す。予定表を読めないときは国民の祝日で外す。
// 1日の合計は 7時間50分〜7時間59分（8時間は超えない）。出退勤の分は乱数で散らす
function generateSampleCards(name, from, to, restDays) {
  const hm = min => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
  const cards = {};
  const last = toDateStr(to);
  for (let d = new Date(from.getFullYear(), from.getMonth(), from.getDate()); toDateStr(d) <= last; d.setDate(d.getDate() + 1)) {
    const day = toDateStr(d);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    if (restDays ? restDays.has(day) : jpHolidays(d.getFullYear()).has(day)) continue;
    const r = seededRandom(`${name}|${day}`);
    const pick = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
    const in1 = 600 + pick(-10, 10);            // 9:50〜10:10
    const len1 = 240 + pick(-8, 5);             // 3時間52分〜4時間5分
    const in2 = 900 + pick(-10, 10);            // 14:50〜15:10
    const total = 480 - pick(1, 10);            // 7時間50分〜7時間59分
    cards[day] = [
      { checkIn: hm(in1), checkOut: hm(in1 + len1), isPaidLeave: false },
      { checkIn: hm(in2), checkOut: hm(in2 + total - len1), isPaidLeave: false }
    ];
  }
  return cards;
}

/* はくつるポータルの予定表（園のGoogleカレンダー）から、園が休みの日を読む。
   APIキーとカレンダーIDはソースに書かず、印刷画面で貼って保存する（保存先フォルダの設定にも入る）。
   休みかどうかの決まりは、ポータルの classifyDay（portal/src/lib/calendarDay.js・dayType.js）と同じにしてある。
   ポータル側の決まりを変えたら、ここも一緒に直すこと */
const PORTAL_CAL_KEY = 'portalCalendar';

function loadPortalCalendar() {
  let o = {};
  try { o = JSON.parse(localStorage.getItem(PORTAL_CAL_KEY) || '{}') || {}; } catch {}
  return { apiKey: String(o.apiKey || '').trim(), calendarId: String(o.calendarId || '').trim(), muuminId: String(o.muuminId || '').trim() };
}

function savePortalCalendar(c) {
  localStorage.setItem(PORTAL_CAL_KEY, JSON.stringify(c));
  markSettingsChanged();
}

// ポータルの HOLIDAY_NAMES と同じ。名前で分かる休み（祝日・さいたま市民の日・夏休みなど）
const PORTAL_HOLIDAY_NAMES = [
  '元日', '成人の日', '建国記念の日', '天皇誕生日', '春分の日', '昭和の日',
  '憲法記念日', 'みどりの日', 'こどもの日', '海の日', '山の日', '敬老の日',
  '秋分の日', 'スポーツの日', '体育の日', '文化の日', '勤労感謝の日',
  '振替休日', '国民の休日', 'さいたま市民の日', '県民の日',
  '大晦日', 'お盆休み', '夏休み', '冬休み', '春休み', '休園'
];

// 休みの行事か：名前で分かる休み、または件名の先頭に【休】（【つぼみ】が前にあっても見る）
function portalHolidayTitle(title) {
  const t = String(title || '');
  if (PORTAL_HOLIDAY_NAMES.some(n => t.includes(n))) return true;
  let rest = t, holiday = false, tsubomi = false;
  for (;;) {
    if (!holiday && rest.startsWith('【休】')) { holiday = true; rest = rest.slice(3).trim(); }
    else if (!tsubomi && rest.startsWith('【つぼみ】')) { tsubomi = true; rest = rest.slice(5).trim(); }
    else break;
  }
  return holiday;
}

// 園が休みの日か（ポータルの classifyDay の restDay と同じ）。
// 休みの行事がある日・日曜・行事が無く土曜かむーみん「なし」の日
function portalRestDay(date, titles, muuminMark) {
  const dow = new Date(`${date}T00:00:00`).getDay();
  return titles.some(portalHolidayTitle) || dow === 0
    || (titles.length === 0 && (dow === 6 || muuminMark === '/'));
}

// むーみんの件名 → 印（ポータルの muuminMark と同じ）
function portalMuuminMark(title) {
  if (title.includes('なし')) return '/';
  if (title.includes('支援枠')) return '◎';
  return '○';
}

async function fetchPortalCalendar(calendarId, apiKey, timeMin, timeMax) {
  const q = new URLSearchParams({ key: apiKey, timeMin, timeMax, singleEvents: 'true', orderBy: 'startTime', maxResults: '2500' });
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${q}`);
  if (!res.ok) throw new Error(`Googleカレンダーの応答 ${res.status}`);
  const data = await res.json();
  // 終日の予定は start.date、時刻付きは start.dateTime。何日も続く予定も、ポータルと同じく始まりの日だけに数える
  return (data.items || [])
    .filter(e => e.status !== 'cancelled' && e.summary)
    .map(e => ({ date: ((e.start && (e.start.date || e.start.dateTime)) || '').slice(0, 10), title: e.summary }))
    .filter(e => e.date);
}

// from〜to のうち園が休みの日（"YYYY-MM-DD" の Set）。予定表が未設定なら null
async function loadPortalRestDays(from, to) {
  const c = loadPortalCalendar();
  if (!c.apiKey || !c.calendarId) return null;
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate() + 1);
  const timeMin = `${toDateStr(from)}T00:00:00+09:00`, timeMax = `${toDateStr(end)}T00:00:00+09:00`;
  const [events, muuminCal] = await Promise.all([
    fetchPortalCalendar(c.calendarId, c.apiKey, timeMin, timeMax),
    // むーみんは任意。読めなくても行事だけで判定する（ポータルと同じ）
    c.muuminId ? fetchPortalCalendar(c.muuminId, c.apiKey, timeMin, timeMax).catch(() => []) : Promise.resolve([])
  ]);
  // 行事カレンダーに入っている「むーみん…」はむーみん扱い（ポータルと同じ）
  const titles = {}, muuminList = [];
  events.forEach(e => {
    if (e.title.startsWith('むーみん')) muuminList.push(e);
    else (titles[e.date] = titles[e.date] || []).push(e.title);
  });
  muuminList.push(...muuminCal);
  // 同じ日に何件かあれば後のものを使う。「あり」は、その日の行がすでにある（行事か、先に印の付いた
  // むーみんがある）ときだけ反映する（ポータルの groupByMonth と同じ）
  const mark = {};
  muuminList.forEach(m => {
    const k = portalMuuminMark(m.title);
    if (k !== '○' || titles[m.date] || m.date in mark) mark[m.date] = k;
  });
  const rest = new Set();
  for (let d = new Date(from.getFullYear(), from.getMonth(), from.getDate()); d < end; d.setDate(d.getDate() + 1)) {
    const day = toDateStr(d);
    if (portalRestDay(day, titles[day] || [], mark[day])) rest.add(day);
  }
  return rest;
}

// 並び順の保存先（通常・スイミング共通の1本）
const ORDER_KEY = 'exportOrderUnified';

// 保存済みの従業員並び順（Excelのシート順）。未登録の名前は末尾に五十音順で追加
function loadExportOrder() {
  try {
    const arr = JSON.parse(localStorage.getItem(ORDER_KEY) || '[]');
    if (Array.isArray(arr) && arr.length > 0) return arr;
  } catch {}
  return [];
}

function saveExportOrder(names) {
  localStorage.setItem(ORDER_KEY, JSON.stringify(names));
  markSettingsChanged();
}

// 従業員ごとの属性（資格有無・バス添乗）。通常／スイミング共通で名前をキーに保存。
// 合計まとめシートの日給ランク（A〜E）振り分けに使う。
const EMP_ATTR_KEY = 'employeeAttrs';

// 初期値はソースに持たない（氏名を公開リポジトリに置かないため）。
// 未保存の人は「資格なし・バス添乗なし」扱い。エクスポート画面のチェックで保存する。

function loadEmployeeAttrs() {
  try {
    const o = JSON.parse(localStorage.getItem(EMP_ATTR_KEY) || '{}');
    return (o && typeof o === 'object' && !Array.isArray(o)) ? o : {};
  } catch { return {}; }
}

function getEmployeeAttr(name) {
  const saved = loadEmployeeAttrs();
  const a = saved[name] || {};
  return { qualified: !!a.qualified, bus: !!a.bus };
}

function setEmployeeAttr(name, attr) {
  const all = loadEmployeeAttrs();
  all[name] = { qualified: !!attr.qualified, bus: !!attr.bus };
  localStorage.setItem(EMP_ATTR_KEY, JSON.stringify(all));
  markSettingsChanged();
}

/* 従業員設定（並び順・資格／バス・サンプルの人）の書き出しと読み込み。
   氏名はソースに置かないので、別の端末へはこのJSONファイルで持っていく。
   勤怠データのバックアップ（{名前:{日付:[…]}}）とは別物。 */
const SETTINGS_FILE_TYPE = 'tc5-employee-settings';

function exportEmployeeSettings() {
  const data = {
    type: SETTINGS_FILE_TYPE,
    exportOrder: loadExportOrder(),
    employeeAttrs: loadEmployeeAttrs(),
    samplePeople: loadSamplePeople()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `従業員設定_${toDateStr(new Date()).replace(/-/g, '')}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('従業員設定を書き出しました', 'success');
}

function importEmployeeSettings(file, done) {
  const reader = new FileReader();
  reader.onload = function (event) {
    try {
      const d = JSON.parse(event.target.result);
      if (!d || d.type !== SETTINGS_FILE_TYPE) {
        showToast('従業員設定のファイルではありません', 'error');
        return;
      }
      if (Array.isArray(d.exportOrder)) {
        saveExportOrder(d.exportOrder.map(n => String(n).trim()).filter(Boolean));
      }
      if (d.employeeAttrs && typeof d.employeeAttrs === 'object' && !Array.isArray(d.employeeAttrs)) {
        const attrs = {};
        for (const [n, a] of Object.entries(d.employeeAttrs)) {
          attrs[String(n)] = { qualified: !!(a && a.qualified), bus: !!(a && a.bus) };
        }
        localStorage.setItem(EMP_ATTR_KEY, JSON.stringify(attrs));
        markSettingsChanged();
      }
      if (Array.isArray(d.samplePeople)) {
        saveSamplePeople(d.samplePeople.map(n => String(n).trim()).filter(Boolean));
      }
      showToast('従業員設定を読み込みました', 'success');
      if (done) done();
    } catch {
      showToast('従業員設定の読み込み中にエラーが発生しました', 'error');
    }
  };
  reader.readAsText(file);
}

// 日給ランク A〜E の時給（円）。設定で変更可、未設定は初期値。
const WAGE_KEY = 'rankWages';
const DEFAULT_WAGES = { A: 1300, B: 1200, C: 1500, D: 1400, E: 1500 };

function loadWages() {
  let saved = {};
  try {
    const o = JSON.parse(localStorage.getItem(WAGE_KEY) || '{}');
    if (o && typeof o === 'object' && !Array.isArray(o)) saved = o;
  } catch {}
  const w = {};
  for (const k of ['A', 'B', 'C', 'D', 'E']) {
    const v = Number(saved[k]);
    w[k] = Number.isFinite(v) && v > 0 ? v : DEFAULT_WAGES[k];
  }
  return w;
}

function saveWages(wages) {
  localStorage.setItem(WAGE_KEY, JSON.stringify(wages));
  markSettingsChanged();
}

function orderedUserNames(names) {
  const saved = loadExportOrder();
  const known = saved.filter(n => names.includes(n));
  const rest = names.filter(n => !saved.includes(n)).sort((a, b) => a.localeCompare(b, 'ja'));
  return [...known, ...rest];
}

// エクスポート対象の名前一覧（scope: 'current'＝今のモードのみ／'both'＝通常＋スイミング）
function exportCandidateNames(scope) {
  const modes = scope === 'both' ? ['normal', 'swim'] : [getMode()];
  const names = new Set();
  modes.forEach(m => Object.keys(loadDataFor(m)).forEach(n => names.add(n)));
  // サンプルを付けるときは、サンプルの人も載せる（通常のみ）
  if (modes.includes('normal') && sampleEnabled()) loadSamplePeople().forEach(n => names.add(n));
  return orderedUserNames([...names]);
}

function showExportDialog() {
  if (exportCandidateNames('current').length === 0) {
    showToast('印刷するデータがありません', 'warning');
    return;
  }

  const { start, end } = getLatestDataPeriod();

  const dialog = document.createElement('div');
  dialog.className = 'ios-dialog';
  dialog.innerHTML = `
    <div class="ios-dialog-content" style="width: 440px;">
      <div class="ios-dialog-header">
        <div class="ios-dialog-title">🖨 印刷</div>
      </div>
      <div class="export-body">
        <div class="form-group">
          <label>出力対象</label>
          <select id="exportScope">
            <option value="current" selected>${esc(modeCfg().label)}のみ</option>
            <option value="both">通常＋スイミング（1つのファイルにまとめる）</option>
          </select>
        </div>
        <div class="form-group">
          <label>印刷する従業員（ドラッグまたは▲▼で並び順を変更・自動保存、上から順に1人1枚で印刷されます）</label>
          <div class="user-checkbox-list" id="userOrderList"></div>
          <div class="rank-legend">
            <div class="rank-legend-title">合計まとめ A〜E 振り分け</div>
            <div><b>A</b> = 資格有 × 通常</div>
            <div><b>B</b> = 資格なし × 通常</div>
            <div><b>C</b> = 資格有 × 朝 ／ 資格有 × 夕 ／ 資格なし × 朝（バス添乗なし）</div>
            <div><b>D</b> = 資格なし × 朝（バス添乗あり） ／ 資格なし × 夕</div>
            <div><b>E</b> = スイミング（時間帯・資格問わず全時間）</div>
          </div>
        </div>
        <div class="form-group">
          <label>サンプルを作る人（通常・カンマ区切り・自動保存）</label>
          <input type="text" id="samplePeopleInput" placeholder="例: 山田" value="${esc(loadSamplePeople().join(', '))}">
          <label class="checkbox-label" style="margin-top:8px;"><input type="checkbox" id="sampleOn" ${sampleEnabled() ? 'checked' : ''}> サンプルを付けて印刷する</label>
          <details class="cal-settings">
            <summary>休みの日：はくつるポータルの予定表 <span id="calStatus"></span></summary>
            <input type="password" id="calApiKey" placeholder="APIキー（GOOGLE_CALENDAR_API_KEY）" autocomplete="off">
            <input type="text" id="calId" placeholder="行事カレンダーID（GOOGLE_CALENDAR_ID）" autocomplete="off">
            <input type="text" id="calMuuminId" placeholder="むーみんカレンダーID（GOOGLE_MUUMIN_CALENDAR_ID）" autocomplete="off">
            <button type="button" class="btn btn-secondary" id="calTestBtn">読めるか確かめる</button>
            <p class="hint" id="calTestResult"></p>
          </details>
        </div>
        <div class="form-group">
          <label>並び順・資格／バス・サンプル・予定表・時給の設定は、保存先フォルダにも自動で保存されます（フォルダを選んでいれば、ほかのPCでも同じ設定になります）。ファイルで受け渡すときはこちら</label>
          <div style="display:flex; gap:8px;">
            <button type="button" class="btn btn-secondary" id="exportSettingsBtn">設定を書き出す</button>
            <button type="button" class="btn btn-secondary" id="importSettingsBtn">設定を読み込む</button>
            <input type="file" id="importSettingsFile" accept=".json" style="display:none;">
          </div>
        </div>
        <div class="form-group">
          <label>A〜E の時給（円・変更すると自動保存。合計まとめの見出しに表示されます）</label>
          <div class="wage-inputs" id="wageInputs"></div>
        </div>
        <div class="form-group">
          <label>期間</label>
          <select id="exportPeriodType">
            <option value="all">すべてのデータ</option>
            <option value="latest" selected>最新の月（11日〜翌月10日）</option>
            <option value="custom">期間指定</option>
          </select>
        </div>
        <div class="form-group hidden" id="customPeriodFields">
          <label>開始日</label>
          <input type="date" id="exportStartDate" value="${toDateStr(start)}">
          <label style="margin-top:10px;">終了日</label>
          <input type="date" id="exportEndDate" value="${toDateStr(end)}">
        </div>
        <div class="form-group">
          <label class="checkbox-label"><input type="checkbox" id="enableRaiseDate"> 昇給日で分割する</label>
        </div>
        <div class="form-group hidden" id="raiseDateFields">
          <label>昇給日（この日付で期間を分割して別々に集計）</label>
          <input type="date" id="raiseDate">
        </div>
      </div>
      <div class="ios-dialog-buttons">
        <button class="ios-dialog-button" id="exportCancelBtn">キャンセル</button>
        <button class="ios-dialog-button primary" id="exportExecuteBtn">🖨 印刷する</button>
      </div>
      <div class="export-alt"><button type="button" class="btn-link" id="exportExcelBtn">Excelで出す（予備）</button></div>
    </div>`;
  document.body.appendChild(dialog);

  const closeDialog = () => { dialog.style.opacity = '0'; setTimeout(() => dialog.remove(), 250); };

  // A〜E の時給入力（変更で自動保存）
  const wageBox = dialog.querySelector('#wageInputs');
  const wages = loadWages();
  wageBox.innerHTML = ['A', 'B', 'C', 'D', 'E'].map(k => `
    <label class="wage-field"><span class="wage-rank">${k}</span>
      <input type="number" class="wageInput" data-rank="${k}" min="0" step="10" value="${wages[k]}">円</label>`).join('');
  wageBox.addEventListener('change', e => {
    if (!e.target.classList.contains('wageInput')) return;
    const cur = loadWages();
    const v = Number(e.target.value);
    if (Number.isFinite(v) && v > 0) cur[e.target.dataset.rank] = Math.round(v);
    saveWages(cur);
  });

  const orderList = dialog.querySelector('#userOrderList');

  // 従業員リストの描画（出力対象の切り替えで作り直す）
  const userRowHtml = (n, isSample) => {
    const a = getEmployeeAttr(n);
    return `
    <div class="user-row" data-name="${esc(n)}" draggable="true">
      <span class="drag-handle" title="ドラッグで並べ替え">⠿</span>
      <label><input type="checkbox" class="userCheckbox" value="${esc(n)}" checked> ${esc(n)}${isSample ? ' <span class="sample-tag">サンプル</span>' : ''}</label>
      <span class="emp-attrs" title="合計まとめのA〜E振り分けに使用">
        <label title="資格有"><input type="checkbox" class="attrQualified" ${a.qualified ? 'checked' : ''}> 資格</label>
        <label title="バス添乗"><input type="checkbox" class="attrBus" ${a.bus ? 'checked' : ''}> バス</label>
      </span>
      <span class="order-btns">
        <button type="button" class="order-btn" data-dir="up" title="上へ">▲</button>
        <button type="button" class="order-btn" data-dir="down" title="下へ">▼</button>
      </span>
    </div>`;
  };

  const renderUserList = scope => {
    const samples = (scope === 'both' || getMode() === 'normal') && sampleEnabled() ? loadSamplePeople() : [];
    orderList.innerHTML =
      `<label class="select-all"><input type="checkbox" id="selectAllUsers" checked> すべて選択</label>` +
      exportCandidateNames(scope).map(n => userRowHtml(n, samples.includes(n))).join('');
  };
  renderUserList('current');

  dialog.querySelector('#exportScope').addEventListener('change', function () {
    renderUserList(this.value);
  });

  // サンプルを作る人・付けるかどうか。変えたら保存して従業員リストを作り直す
  dialog.querySelector('#samplePeopleInput').addEventListener('change', function () {
    saveSamplePeople(this.value.split(/[,、，]/).map(s => s.trim()).filter(Boolean));
    this.value = loadSamplePeople().join(', ');
    renderUserList(dialog.querySelector('#exportScope').value);
  });
  dialog.querySelector('#sampleOn').addEventListener('change', function () {
    localStorage.setItem(SAMPLE_ON_KEY, this.checked ? '1' : '0');
    renderUserList(dialog.querySelector('#exportScope').value);
  });

  // 予定表（Googleカレンダー）の設定。変えたら保存する
  const calInputs = { apiKey: '#calApiKey', calendarId: '#calId', muuminId: '#calMuuminId' };
  const showCalStatus = () => {
    const c = loadPortalCalendar();
    dialog.querySelector('#calStatus').textContent = c.apiKey && c.calendarId ? '（設定済み）' : '（未設定：土日と国民の祝日で判断）';
  };
  const cal = loadPortalCalendar();
  for (const [k, sel] of Object.entries(calInputs)) {
    const input = dialog.querySelector(sel);
    input.value = cal[k];
    input.addEventListener('change', () => {
      const c = loadPortalCalendar();
      c[k] = input.value.trim();
      savePortalCalendar(c);
      showCalStatus();
    });
  }
  showCalStatus();
  // 最新の月の休みの日を読んでみせる
  dialog.querySelector('#calTestBtn').addEventListener('click', async () => {
    const out = dialog.querySelector('#calTestResult');
    out.textContent = '読んでいます…';
    const { start, end } = getLatestDataPeriod();
    try {
      const rest = await loadPortalRestDays(start, end);
      if (!rest) { out.textContent = 'APIキーと行事カレンダーIDを入れてください'; return; }
      const md = s => `${+s.slice(5, 7)}/${+s.slice(8, 10)}`;
      const weekdays = [...rest].filter(s => { const g = new Date(`${s}T00:00:00`).getDay(); return g !== 0 && g !== 6; }).sort();
      out.textContent = `読めました。${md(toDateStr(start))}〜${md(toDateStr(end))} の平日の休み：${weekdays.length ? weekdays.map(md).join('・') : 'なし'}`;
    } catch (e) {
      out.textContent = `読めませんでした（${e.message}）`;
    }
  });

  // 従業員設定の書き出し・読み込み（別の端末へ持っていくため）
  dialog.querySelector('#exportSettingsBtn').addEventListener('click', exportEmployeeSettings);
  dialog.querySelector('#importSettingsBtn').addEventListener('click', () => dialog.querySelector('#importSettingsFile').click());
  dialog.querySelector('#importSettingsFile').addEventListener('change', function () {
    const file = this.files && this.files[0];
    this.value = '';
    if (!file) return;
    importEmployeeSettings(file, () => {
      dialog.querySelector('#samplePeopleInput').value = loadSamplePeople().join(', ');
      renderUserList(dialog.querySelector('#exportScope').value);
    });
  });

  // 全選択チェックボックス（リストを作り直しても効くように委譲で処理）
  orderList.addEventListener('change', e => {
    // 資格・バス添乗の変更は即保存
    if (e.target.classList.contains('attrQualified') || e.target.classList.contains('attrBus')) {
      const row = e.target.closest('.user-row');
      setEmployeeAttr(row.dataset.name, {
        qualified: row.querySelector('.attrQualified').checked,
        bus: row.querySelector('.attrBus').checked
      });
      return;
    }
    const selectAll = orderList.querySelector('#selectAllUsers');
    const boxes = [...orderList.querySelectorAll('.userCheckbox')];
    if (e.target === selectAll) {
      boxes.forEach(cb => { cb.checked = selectAll.checked; });
      selectAll.indeterminate = false;
      return;
    }
    if (e.target.classList.contains('userCheckbox')) {
      const all = boxes.every(c => c.checked);
      const some = boxes.some(c => c.checked);
      selectAll.checked = all;
      selectAll.indeterminate = some && !all;
    }
  });

  // 並べ替え：▲▼ボタン＋ドラッグ&ドロップ。動かしたら即保存。
  // リストに表示されていない名前（別モードの人）は元の位置を保ったままマージする
  const saveOrderFromDom = () => {
    const domNames = [...orderList.querySelectorAll('.user-row')].map(r => r.dataset.name);
    const old = loadExportOrder();
    const merged = [...domNames];
    old.forEach((name, i) => {
      if (merged.includes(name)) return;
      let insertAt = 0;
      for (let j = i - 1; j >= 0; j--) {
        const idx = merged.indexOf(old[j]);
        if (idx !== -1) { insertAt = idx + 1; break; }
      }
      merged.splice(insertAt, 0, name);
    });
    saveExportOrder(merged);
  };

  orderList.addEventListener('click', e => {
    const btn = e.target.closest('.order-btn');
    if (!btn) return;
    const row = btn.closest('.user-row');
    if (btn.dataset.dir === 'up') {
      const prev = row.previousElementSibling;
      if (prev && prev.classList.contains('user-row')) orderList.insertBefore(row, prev);
    } else {
      const next = row.nextElementSibling;
      if (next) orderList.insertBefore(next, row);
    }
    saveOrderFromDom();
  });

  let dragRow = null;
  orderList.addEventListener('dragstart', e => {
    dragRow = e.target.closest('.user-row');
    if (!dragRow) return;
    dragRow.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    // Firefoxはこれが無いとドラッグが始まらない
    e.dataTransfer.setData('text/plain', dragRow.dataset.name);
  });
  orderList.addEventListener('dragover', e => {
    if (!dragRow) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const over = e.target.closest('.user-row');
    if (!over || over === dragRow) return;
    const rect = over.getBoundingClientRect();
    const below = e.clientY > rect.top + rect.height / 2;
    orderList.insertBefore(dragRow, below ? over.nextSibling : over);
  });
  orderList.addEventListener('drop', e => e.preventDefault());
  orderList.addEventListener('dragend', () => {
    if (!dragRow) return;
    dragRow.classList.remove('dragging');
    dragRow = null;
    saveOrderFromDom();
  });

  dialog.querySelector('#exportPeriodType').addEventListener('change', function () {
    dialog.querySelector('#customPeriodFields').classList.toggle('hidden', this.value !== 'custom');
  });
  dialog.querySelector('#enableRaiseDate').addEventListener('change', function () {
    dialog.querySelector('#raiseDateFields').classList.toggle('hidden', !this.checked);
  });

  dialog.querySelector('#exportCancelBtn').addEventListener('click', closeDialog);
  dialog.querySelector('#exportExecuteBtn').addEventListener('click', () => performExport(dialog, closeDialog, 'print'));
  dialog.querySelector('#exportExcelBtn').addEventListener('click', () => performExport(dialog, closeDialog, 'excel'));
  dialog.addEventListener('click', e => { if (e.target === dialog) closeDialog(); });
}

function performExport(dialog, closeDialog, action) {
  const selectedUsers = [...dialog.querySelectorAll('.userCheckbox:checked')].map(cb => cb.value);
  if (selectedUsers.length === 0) { showToast('少なくとも1人の従業員を選択してください', 'warning'); return; }

  const scope = dialog.querySelector('#exportScope').value;
  const exportType = dialog.querySelector('#exportPeriodType').value;
  const enableRaiseDate = dialog.querySelector('#enableRaiseDate').checked;
  const raiseDateValue = enableRaiseDate ? dialog.querySelector('#raiseDate').value : null;

  let startDate, endDate;
  if (exportType === 'all') {
    startDate = new Date('1900-01-01');
    endDate = new Date('2100-12-31');
  } else if (exportType === 'latest') {
    const { start, end } = getLatestDataPeriod();
    startDate = start;
    endDate = end;
  } else {
    const s = dialog.querySelector('#exportStartDate').value;
    const e = dialog.querySelector('#exportEndDate').value;
    if (!s || !e) { showToast('開始日と終了日を入力してください', 'warning'); return; }
    startDate = new Date(s);
    endDate = new Date(e);
    if (startDate > endDate) { showToast('開始日は終了日より前である必要があります', 'warning'); return; }
  }

  if (enableRaiseDate) {
    if (!raiseDateValue) { showToast('昇給日を入力してください', 'warning'); return; }
    const rd = new Date(raiseDateValue);
    if (rd <= startDate || rd >= endDate) {
      showToast('昇給日は開始日と終了日の間の日付を指定してください', 'warning');
      return;
    }
  }

  closeDialog();
  const raise = raiseDateValue ? new Date(raiseDateValue) : null;
  if (action === 'excel') exportToExcel(startDate, endDate, exportType, selectedUsers, raise, scope);
  else printTimesheets(startDate, endDate, exportType, selectedUsers, raise, scope);
}

/*
 *  出力する中身（1人1枚の表と、合計まとめ）を組み立てる。印刷とExcelで同じものを使う。
 *  返すもの：{ sheets:[{name, person, mode, aoa}], summary:{aoa, legendStart, legendLines}|null,
 *            filename（拡張子なし）, minDate, maxDate }。出すものが無ければ null。
 *  restDays：サンプルを作らない休みの日（予定表から読んだもの）。null なら国民の祝日で判断する
 */
// サンプルを作る人と期間。サンプルを付けないときは null
function sampleRange(startDate, endDate, exportType, scope) {
  const modes = scope === 'both' ? ['normal', 'swim'] : [getMode()];
  const people = modes.includes('normal') && sampleEnabled() ? loadSamplePeople() : [];
  if (!people.length) return null;
  if (exportType !== 'all') return { people, from: startDate, to: endDate };
  // 「すべてのデータ」のときは、ほかの人の記録がある範囲で作る
  const days = [];
  modes.forEach(m => {
    const data = loadDataFor(m);
    for (const n in data) if (!people.includes(n)) days.push(...Object.keys(data[n]));
  });
  days.sort();
  if (days.length) return { people, from: new Date(days[0] + 'T00:00:00'), to: new Date(days[days.length - 1] + 'T00:00:00') };
  const { start, end } = getLatestDataPeriod();
  return { people, from: start, to: end };
}

// 印刷・Excelの前に、サンプルを作る期間の休みの日を予定表から読む。
// 予定表が未設定・読めないときは null（土日と国民の祝日で判断する）
async function sampleRestDays(startDate, endDate, exportType, selectedUsers, scope) {
  const sample = sampleRange(startDate, endDate, exportType, scope);
  if (!sample || !sample.people.some(n => selectedUsers.includes(n))) return null;
  try {
    const rest = await loadPortalRestDays(sample.from, sample.to);
    if (!rest) showToast('予定表が未設定なので、休みの日は土日と国民の祝日で判断しました', 'warning', 5000);
    return rest;
  } catch (e) {
    console.warn('予定表を読めない:', e);
    showToast(`予定表を読めなかったので、休みの日は土日と国民の祝日で判断しました（${e.message}）`, 'warning', 6000);
    return null;
  }
}

function buildExportBook(startDate, endDate, exportType, selectedUsers, raiseDate, scope, restDays) {
  // scope: 'current'＝今のモードのみ／'both'＝通常＋スイミングを1つにまとめる
  const modesToExport = scope === 'both' ? ['normal', 'swim'] : [getMode()];
  const dataByMode = {};
  modesToExport.forEach(m => { dataByMode[m] = loadDataFor(m); });

  // サンプルの人：通常の記録を、この期間の分だけその場で作ったものにする（勤怠データには保存しない）
  const sample = sampleRange(startDate, endDate, exportType, scope);
  const samplePeople = sample ? sample.people : [];
  samplePeople.forEach(n => { dataByMode.normal[n] = generateSampleCards(n, sample.from, sample.to, restDays); });

  const sheets = [];
  let summary = null;
  let sheetCount = 0;
  let actualMinDate = null;
  let actualMaxDate = null;

  const adjustedEndDate = new Date(endDate);
  adjustedEndDate.setHours(23, 59, 59, 999);

  // 昇給日が指定されている場合は期間を2つに分割
  let periods;
  if (raiseDate) {
    const beforeEnd = new Date(raiseDate);
    beforeEnd.setDate(beforeEnd.getDate() - 1);
    beforeEnd.setHours(23, 59, 59, 999);
    periods = [
      { start: startDate, end: beforeEnd, label: '昇給前' },
      { start: new Date(raiseDate), end: adjustedEndDate, label: '昇給後' }
    ];
  } else {
    periods = [{ start: startDate, end: adjustedEndDate, label: '' }];
  }

  // 出力シート（1人×1モード＝1シート）をダイアログの表示順に組み立てる。
  // 両モードにデータがある人は 通常→スイミング の順で並べ、シート名に（通常）（スイミング）を付ける
  const tasks = [];
  for (const name of selectedUsers) {
    const targets = modesToExport.filter(m =>
      dataByMode[m][name] && Object.keys(dataByMode[m][name]).length > 0);
    const dual = targets.length > 1;
    for (const m of targets) tasks.push({ name, mode: m, dual });
  }

  // 最後のまとめシート用：各人の全期間合計を日給ランク A〜E に振り分けて集める
  //   A=資格有×通常 / B=資格なし×通常
  //   C=資格有×朝 + 資格有×夕 + 資格なし×朝（バス無）
  //   D=資格なし×朝（バス有）+ 資格なし×夕 / E=スイミング（全時間）
  // 通常とスイミング両方ある人は1行にまとめる（A〜Dは通常、Eはスイミング由来）
  const summaryByName = {};
  const summaryOrder = [];

  for (const { name, mode, dual } of tasks) {
    const cards = dataByMode[mode][name] || {};
    const workType = MODES[mode].label;

    let sheetName = name;
    if (dual) {
      sheetName = `${name}(${workType})`;
    } else if (exportType !== 'custom' && !raiseDate) {
      const monthNames = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
      sheetName = name + monthNames[startDate.getMonth()];
    }

    // サンプルの人は早朝・夕方を付けず、全部を通常として数える
    const isSample = mode === 'normal' && samplePeople.includes(name);
    const sheetData = [];
    sheetData.push([`名前: ${name} (${workType})`]);
    if (!raiseDate) {
      sheetData.push(["日付","出勤時間","退勤時間","合計時間","早朝勤務","夕方勤務","朝夕合計","通常合計","勤務種別"]);
    }

    let hasAnyData = false;
    // この人（×モード）の全期間を通した合計
    let gTotal = 0, gEarly = 0, gEvening = 0, gNormal = 0;

    for (const { start: pStart, end: pEnd, label: pLabel } of periods) {
      const periodData = [];

      for (const date in cards) {
        if (!Array.isArray(cards[date])) continue;
        const d = new Date(date);
        if (d < pStart || d > pEnd) continue;
        if (!actualMinDate || d < actualMinDate) actualMinDate = d;
        if (!actualMaxDate || d > actualMaxDate) actualMaxDate = d;

        cards[date].forEach(card => {
          if (!card || !card.checkIn) return;
          let totalHours = 0, earlyMorning = 0, evening = 0;
          if (card.checkOut) {
            totalHours = calculateTimeDifference(card.checkIn, card.checkOut);
            earlyMorning = isSample ? 0 : calculateEarlyMorningTime(card.checkIn, card.checkOut);
            evening = isSample ? 0 : calculateEveningTime(card.checkIn, card.checkOut);
          }
          periodData.push({
            date,
            checkIn: card.checkIn,
            checkOut: card.checkOut || '未登録',
            totalHours, earlyMorning, evening,
            isPaidLeave: card.isPaidLeave
          });
        });
      }

      if (periodData.length === 0) continue;
      hasAnyData = true;

      if (pLabel) {
        const startStr = `${pStart.getMonth() + 1}/${pStart.getDate()}`;
        const endStr = `${pEnd.getMonth() + 1}/${pEnd.getDate()}`;
        sheetData.push([]);
        sheetData.push([`■ ${pLabel} (${startStr}〜${endStr})`]);
        sheetData.push(["日付","出勤時間","退勤時間","合計時間","早朝勤務","夕方勤務","朝夕合計","通常合計","勤務種別"]);
      }

      let sumTotal = 0, sumEarly = 0, sumEvening = 0, sumME = 0, sumNormal = 0;
      periodData.sort((a, b) => new Date(a.date) - new Date(b.date));

      periodData.forEach(rec => {
        const morningEvening = rec.earlyMorning + rec.evening;
        const normalHours = rec.totalHours - morningEvening;
        if (rec.checkOut !== '未登録') {
          sumTotal += rec.totalHours;
          sumEarly += rec.earlyMorning;
          sumEvening += rec.evening;
          sumME += morningEvening;
          sumNormal += normalHours;
        }
        const noOut = rec.checkOut === '未登録';
        sheetData.push([
          formatDate(rec.date),
          rec.checkIn,
          rec.checkOut,
          noOut ? '－' : rec.totalHours.toFixed(2),
          noOut ? '－' : rec.earlyMorning.toFixed(2),
          noOut ? '－' : rec.evening.toFixed(2),
          noOut ? '－' : morningEvening.toFixed(2),
          noOut ? '－' : normalHours.toFixed(2),
          rec.isPaidLeave ? "有給" : ""
        ]);
      });

      sheetData.push([]);
      sheetData.push([
        pLabel ? `【${pLabel}合計】` : "合計", "", "",
        sumTotal.toFixed(2), sumEarly.toFixed(2), sumEvening.toFixed(2),
        sumME.toFixed(2), sumNormal.toFixed(2), ""
      ]);

      gTotal += sumTotal; gEarly += sumEarly; gEvening += sumEvening;
      gNormal += sumNormal;
    }

    if (hasAnyData) {
      let row = summaryByName[name];
      if (!row) { row = summaryByName[name] = { name, a: 0, b: 0, c: 0, d: 0, e: 0 }; summaryOrder.push(name); }
      if (mode === 'swim') {
        row.e += gTotal;                       // スイミングは全時間 → E
      } else {
        const attr = getEmployeeAttr(name);
        if (attr.qualified) {
          row.a += gNormal;                    // 資格有×通常 → A
          row.c += gEarly + gEvening;          // 資格有×朝夕 → C
        } else {
          row.b += gNormal;                    // 資格なし×通常 → B
          if (attr.bus) {
            row.d += gEarly + gEvening;         // 資格なし×朝(バス) + 夕 → D
          } else {
            row.c += gEarly;                    // 資格なし×朝(バス無) → C
            row.d += gEvening;                  // 資格なし×夕 → D
          }
        }
      }
    }

    if (!hasAnyData) continue;
    sheets.push({ name: sheetName.slice(0, 31), person: name, mode, aoa: sheetData });
    sheetCount++;
  }

  if (sheetCount === 0) return null;

  // 最後のシート：各人の合計時間を日給ランク A〜E に振り分けてまとめる
  if (summaryOrder.length > 0) {
    const wages = loadWages();
    const summaryData = [];
    summaryData.push(["合計時間まとめ（単位：時間）"]);
    summaryData.push([]);
    summaryData.push([
      "名前",
      `A ${wages.A}円`,
      `B ${wages.B}円`,
      `C ${wages.C}円`,
      `D ${wages.D}円`,
      `E ${wages.E}円`
    ]);

    summaryOrder.forEach(n => {
      const r = summaryByName[n];
      summaryData.push([
        r.name,
        r.a.toFixed(2),
        r.b.toFixed(2),
        r.c.toFixed(2),
        r.d.toFixed(2),
        r.e.toFixed(2)
      ]);
    });

    // A〜E 振り分け表（凡例）。各行は6列ぶん結合して見やすく表示
    summaryData.push([]);
    const legendStart = summaryData.length;
    const legendLines = [
      "【A〜E 振り分け】",
      "A = 資格有 × 通常",
      "B = 資格なし × 通常",
      "C = 資格有 × 朝 ／ 資格有 × 夕 ／ 資格なし × 朝（バス添乗なし）",
      "D = 資格なし × 朝（バス添乗あり） ／ 資格なし × 夕",
      "E = スイミング（時間帯・資格問わず全時間）"
    ];
    legendLines.forEach(line => summaryData.push([line]));

    summary = { aoa: summaryData, legendStart, legendLines };
  }

  // ファイル名: R{令和}.{開始月}-{終了月}（スイミングは_SW付き）
  let filename;
  if (exportType === 'all' && actualMinDate && actualMaxDate) {
    const minP = getMonthPeriod(toDateStr(actualMinDate));
    const maxP = getMonthPeriod(toDateStr(actualMaxDate));
    filename = `R${minP.start.getFullYear() - 2018}.${minP.start.getMonth() + 1}-${maxP.end.getMonth() + 1}`;
  } else if (exportType === 'latest') {
    const { start, end } = getLatestDataPeriod();
    filename = `R${start.getFullYear() - 2018}.${start.getMonth() + 1}-${end.getMonth() + 1}`;
  } else {
    filename = `R${startDate.getFullYear() - 2018}.${startDate.getMonth() + 1}.${startDate.getDate()}-${endDate.getMonth() + 1}.${endDate.getDate()}`;
  }
  if (scope === 'both') filename += '_通常+SW';
  else if (getMode() === 'swim') filename += '_SW';

  return { sheets, summary, filename, minDate: actualMinDate, maxDate: actualMaxDate };
}

// 予備：Excelで出す（中身は buildExportBook で組み立てたもの）
async function exportToExcel(startDate, endDate, exportType, selectedUsers, raiseDate, scope) {
  const restDays = await sampleRestDays(startDate, endDate, exportType, selectedUsers, scope);
  const book = buildExportBook(startDate, endDate, exportType, selectedUsers, raiseDate, scope, restDays);
  if (!book) {
    showToast('選択した期間にデータがありません', 'warning');
    return;
  }
  const workbook = XLSX.utils.book_new();
  for (const s of book.sheets) {
    const worksheet = XLSX.utils.aoa_to_sheet(s.aoa);
    // 列幅：ヘッダー（出勤時間・退勤時間 等の4文字）が切れず全部見えるように広めに確保
    worksheet['!cols'] = [
      { wch: 12 }, // 日付
      { wch: 11 }, // 出勤時間
      { wch: 11 }, // 退勤時間
      { wch: 11 }, // 合計時間
      { wch: 11 }, // 早朝勤務
      { wch: 11 }, // 夕方勤務
      { wch: 11 }, // 朝夕合計
      { wch: 11 }, // 通常合計
      { wch: 11 }  // 勤務種別
    ];
    XLSX.utils.book_append_sheet(workbook, worksheet, s.name);
  }

  if (book.summary) {
    const { aoa: summaryData, legendStart, legendLines } = book.summary;
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    // 列幅（名前は広め、数値列もゆったり）
    summarySheet['!cols'] = [
      { wch: 24 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }
    ];
    // 全行に高さを設定して詰まりを解消（タイトル＝大、区切り＝小、その他＝ゆったり）
    summarySheet['!rows'] = summaryData.map((row, i) => {
      if (i === 0) return { hpt: 30 };                 // タイトル
      if (row.length === 0) return { hpt: 10 };        // 区切りの空行
      return { hpt: 24 };                              // 見出し・データ・凡例
    });
    // タイトル＋凡例の各行を6列ぶん結合
    summarySheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }
    ];
    legendLines.forEach((_, i) => {
      const r = legendStart + i;
      summarySheet['!merges'].push({ s: { r, c: 0 }, e: { r, c: 5 } });
    });
    XLSX.utils.book_append_sheet(workbook, summarySheet, "合計まとめ");
  }

  writeWorkbookFile(workbook, book.filename + '.xlsx');
  showToast('Excelファイルを出力しました', 'success');
}

/* ============ 印刷（Excelを使わずTC5から直接） ============ */

const PRINT_HEADER = ["日付","出勤時間","退勤時間","合計時間","早朝勤務","夕方勤務","朝夕合計","通常合計","勤務種別"];

// 印刷するページの見た目。アプリの画面用CSSは使わず、これだけを当てる
const PRINT_CSS = `
@page { size: A4 portrait; margin: 11mm 12mm; }
* { box-sizing: border-box; }
body { margin: 0; color: #000; background: #fff;
  font-family: "Yu Gothic", "YuGothic", "Meiryo", "Hiragino Kaku Gothic ProN", sans-serif; font-size: 10pt; }
/* 表の外枠が印刷できる範囲のちょうど端に乗ると、右の線が切れて消える。左右を1mm内側に寄せる */
.page { page-break-after: always; break-after: page; padding: 0 1mm; }
.page:last-child { page-break-after: auto; break-after: auto; }
.head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 3mm;
  border-bottom: 1.5px solid #000; padding-bottom: 1.5mm; }
h1 { font-size: 14pt; margin: 0; }
.meta { font-size: 9pt; color: #333; }
h2 { font-size: 10.5pt; margin: 4mm 0 1.5mm; }
table { width: 100%; border-collapse: collapse; table-layout: fixed; }
th, td { border: 1px solid #666; padding: 1mm 1.2mm; text-align: center; font-size: 9.5pt; line-height: 1.35; }
thead th { background: #e8e8e8; font-weight: 600; }
td.num { text-align: right; font-variant-numeric: tabular-nums; }
td.paid { font-weight: 700; }
tr.total td { font-weight: 700; background: #f2f2f2; border-top: 2px solid #000; }
/* 1枚に入らないページ（fitPrintPages が付ける）：行の上下を詰める */
.page.compact th, .page.compact td { padding: 0.3mm 1.2mm; line-height: 1.2; }
.page.compact h2 { margin: 2mm 0 1mm; }
/* 画面で高さを測るとき、紙と同じ幅で並ぶように（紙の印刷できる幅 = 210mm − 左右12mm） */
@media screen { body { width: 186mm; } }
col.c-date { width: 12%; } col.c-time { width: 11%; }
.summary th, .summary td { font-size: 10.5pt; padding: 1.8mm 2mm; }
.summary td:first-child { text-align: left; }
.legend { margin-top: 6mm; font-size: 9.5pt; line-height: 1.8; }
.legend b { display: block; margin-bottom: 1mm; }
`;

// 1人分の表（aoa）を、見出し・小見出し（昇給前／後）・明細・合計に分ける
function splitSheetBlocks(aoa) {
  const blocks = [];
  let cur = null;
  const isHeader = row => row.length === PRINT_HEADER.length && row.every((v, i) => v === PRINT_HEADER[i]);
  for (let i = 1; i < aoa.length; i++) {
    const row = aoa[i] || [];
    if (row.length === 0) continue;
    const first = String(row[0] == null ? '' : row[0]);
    if (row.length === 1 && first.startsWith('■')) { cur = { title: first.replace(/^■\s*/, ''), rows: [], total: null }; blocks.push(cur); continue; }
    if (!cur) { cur = { title: '', rows: [], total: null }; blocks.push(cur); }
    if (isHeader(row)) continue;
    if (first === '合計' || /^【.*合計】$/.test(first)) { cur.total = row; continue; }
    cur.rows.push(row);
  }
  if (!blocks.length) blocks.push({ title: '', rows: [], total: null });
  return blocks;
}

function printSheetHtml(sheet, periodText) {
  const title = String((sheet.aoa[0] || [''])[0] || sheet.name);
  const blocks = splitSheetBlocks(sheet.aoa);
  const cell = (v, i) => {
    const s = v == null ? '' : String(v);
    const cls = i >= 3 && i <= 7 ? ' class="num"' : (i === 8 && s ? ' class="paid"' : '');
    return `<td${cls}>${esc(s)}</td>`;
  };
  const table = b => `
    ${b.title ? `<h2>■ ${esc(b.title)}</h2>` : ''}
    <table>
      <colgroup><col class="c-date">${'<col class="c-time">'.repeat(8)}</colgroup>
      <thead><tr>${PRINT_HEADER.map(h => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>
        ${b.rows.map(r => `<tr>${PRINT_HEADER.map((_, i) => cell(r[i], i)).join('')}</tr>`).join('')}
        ${b.total
          // 合計の行は出勤・退勤が空なので、見出し（【昇給前合計】など）を3列ぶん使って1行に収める
          ? `<tr class="total"><td colspan="3">${esc(b.total[0])}</td>${PRINT_HEADER.slice(3).map((_, k) => cell(b.total[k + 3], k + 3)).join('')}</tr>`
          : ''}
      </tbody>
    </table>`;
  return `<section class="page">
    <div class="head"><h1>${esc(title)}</h1><div class="meta">${esc(periodText)}</div></div>
    ${blocks.map(table).join('')}
  </section>`;
}

function printSummaryHtml(summary, periodText) {
  const aoa = summary.aoa;
  const header = aoa[2] || [];
  const rows = aoa.slice(3, summary.legendStart - 1).filter(r => r && r.length);
  return `<section class="page">
    <div class="head"><h1>${esc(aoa[0][0])}</h1><div class="meta">${esc(periodText)}</div></div>
    <table class="summary">
      <thead><tr>${header.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(r => `<tr>${r.map((v, i) => i === 0 ? `<td>${esc(v)}</td>` : `<td class="num">${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>
    <div class="legend"><b>${esc(summary.legendLines[0])}</b>${summary.legendLines.slice(1).map(l => `<div>${esc(l)}</div>`).join('')}</div>
  </section>`;
}

// 印刷用のページ全体（HTML）。テストからも使えるよう、組み立てだけを分けておく
function buildPrintHtml(book, periodText) {
  const pages = book.sheets.map(s => printSheetHtml(s, periodText)).join('')
    + (book.summary ? printSummaryHtml(book.summary, periodText) : '');
  return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8">`
    + `<title>勤怠_${esc(book.filename)}</title><style>${PRINT_CSS}</style></head><body>${pages}</body></html>`;
}

// 1人1枚に収める。紙1枚に入らないページは、まず行の上下を詰め、それでも入らなければ
// ページ全体を縮める（縮めたぶん幅を広げておくので、表の横幅は紙いっぱいのまま）
function fitPrintPages(doc) {
  const probe = doc.createElement('div');
  // 印刷できる高さ = 297mm − 上下11mm。端数で次のページへこぼれないよう少し余らせる
  probe.style.cssText = 'position:absolute; visibility:hidden; width:186mm; height:272mm;';
  doc.body.appendChild(probe);
  const { width: fullW, height: availH } = probe.getBoundingClientRect();
  probe.remove();
  doc.querySelectorAll('.page').forEach(page => {
    if (page.getBoundingClientRect().height <= availH) return;
    page.classList.add('compact');
    // 縮めても罫線は細くならないので、縮めたあとに測り直し、入るまで縮め直す
    let z = 1;
    for (let i = 0; i < 8; i++) {
      const h = page.getBoundingClientRect().height;
      if (h <= availH) return;
      z = Math.floor(z * availH / h * 1000) / 1000;
      page.style.width = `${fullW / z}px`;
      page.style.zoom = z;
    }
  });
}

// 印刷する。印刷専用のページを新しいタブに作って、そこから刷る（アプリの画面は刷らない）。
// タブはクリックしてすぐ開く（予定表を読んだあとに開くと、ポップアップとして止められることがあるため）
async function printTimesheets(startDate, endDate, exportType, selectedUsers, raiseDate, scope) {
  const w = window.open('', '_blank');
  if (!w) { showToast('新しいタブを開けませんでした。ポップアップを許可してください', 'warning'); return; }
  w.document.write('<p style="font:15px sans-serif; padding:24px;">印刷の準備をしています…</p>');
  w.document.close();

  const restDays = await sampleRestDays(startDate, endDate, exportType, selectedUsers, scope);
  const book = buildExportBook(startDate, endDate, exportType, selectedUsers, raiseDate, scope, restDays);
  if (!book) { w.close(); showToast('選択した期間にデータがありません', 'warning'); return; }
  const from = exportType === 'all' ? book.minDate : startDate;
  const to = exportType === 'all' ? book.maxDate : endDate;
  const ymd = d => d ? `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}` : '';
  const periodText = `期間：${ymd(from)}〜${ymd(to)}`;

  w.document.open();
  w.document.write(buildPrintHtml(book, periodText));
  w.document.close();
  setTimeout(() => {
    fitPrintPages(w.document);
    w.focus();
    w.print();
    w.onafterprint = () => w.close();
  }, 50);
  showToast(`${book.sheets.length}人ぶんを新しいタブで印刷します`, 'success');
}

/*
 *  Excelファイルの基準フォントを「ＭＳ Ｐゴシック」にして書き出す。
 *
 *  SheetJS（無償版）は基準フォントを Calibri で書き出す。日本語版Excelはどちらでも
 *  同じに見せるが、Googleスプレッドシートは書いてある名前のまま列幅を計算するので、
 *  Excelで一度保存し直したファイル（ＭＳ Ｐゴシックになる）と幅が変わってしまう。
 *  最初から名前をＭＳ Ｐゴシックにしておけば、保存し直したものと同じ指定になる
 *  （ほかの指定は同じなので、名前だけ差し替える）。
 *
 *  ※ SheetJS の zip 組み立て（XLSX.CFB.write）はブラウザで中身を落とすので使わない
 *    （v5.0.2 で Excel が開けなくなった原因）。SheetJS は部品を圧縮せずに入れるので、
 *    zip の読み書きはここで自前でやる。少しでもおかしければ今までどおり保存する。
 */
function writeWorkbookFile(workbook, filename) {
  let bytes;
  try {
    bytes = buildXlsxBytes(workbook);
  } catch (e) {
    console.warn('フォントを差し替えずに保存します:', e);
    XLSX.writeFile(workbook, filename);
    return;
  }
  const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// 基準フォントを差し替えた xlsx を、バイト列（Uint8Array）で作る。おかしければ投げる
function buildXlsxBytes(workbook) {
  const src = new Uint8Array(XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }));
  const entries = readStoredZip(src);
  const styles = entries.find(e => e.name === 'xl/styles.xml');
  if (!styles) throw new Error('styles.xml が無い');
  const xml = new TextDecoder('utf-8').decode(styles.data);
  // 最初の <font>（＝基準フォント）の名前だけを差し替える
  const fixed = xml.replace(/(<fonts[^>]*>\s*<font>[\s\S]*?)<name val="[^"]*"\/>/, '$1<name val="ＭＳ Ｐゴシック"/>');
  if (fixed === xml) throw new Error('基準フォントの名前が見つからない');
  styles.data = new TextEncoder().encode(fixed);
  const out = writeStoredZip(entries);

  // できたものを読み直して、部品がそろっていて中身が入っていることを確かめる
  const check = readStoredZip(out);
  if (check.length !== entries.length) throw new Error('部品の数が合わない');
  for (let i = 0; i < entries.length; i++) {
    if (check[i].name !== entries[i].name || check[i].data.length !== entries[i].data.length) {
      throw new Error('部品の中身が合わない: ' + entries[i].name);
    }
  }
  if (!new TextDecoder('utf-8').decode(check.find(e => e.name === 'xl/styles.xml').data).includes('ＭＳ Ｐゴシック')) {
    throw new Error('差し替えたフォントが入っていない');
  }
  return out;
}

// 圧縮なし（STORE）の zip を読む。部品名と中身の配列を返す。圧縮された部品があれば投げる
function readStoredZip(u8) {
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  let eocd = -1;                                          // 目次の終わり（後ろから探す）
  for (let i = u8.length - 22; i >= Math.max(0, u8.length - 22 - 65535); i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('zip の目次が見つからない');
  const count = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true);
  const dec = new TextDecoder('utf-8');
  const out = [];
  for (let k = 0; k < count; k++) {
    if (dv.getUint32(p, true) !== 0x02014b50) throw new Error('zip の目次が壊れている');
    const method = dv.getUint16(p + 10, true);
    const csize = dv.getUint32(p + 20, true), usize = dv.getUint32(p + 24, true);
    const nlen = dv.getUint16(p + 28, true), xlen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true);
    const at = dv.getUint32(p + 42, true);
    const name = dec.decode(u8.subarray(p + 46, p + 46 + nlen));
    if (method !== 0 || csize !== usize) throw new Error('圧縮された部品がある: ' + name);
    if (dv.getUint32(at, true) !== 0x04034b50) throw new Error('部品の頭が壊れている: ' + name);
    const start = at + 30 + dv.getUint16(at + 26, true) + dv.getUint16(at + 28, true);
    out.push({ name, data: u8.slice(start, start + csize) });
    p += 46 + nlen + xlen + clen;
  }
  return out;
}

// 圧縮なし（STORE）の zip を作る
function writeStoredZip(entries) {
  const enc = new TextEncoder();
  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  const locals = [], centrals = [];
  let offset = 0;
  for (const e of entries) {
    const name = enc.encode(e.name), size = e.data.length, crc = crc32(e.data);
    const lh = new Uint8Array(30 + name.length), lv = new DataView(lh.buffer);
    lv.setUint32(0, 0x04034b50, true); lv.setUint16(4, 20, true); lv.setUint16(6, 0x0800, true);
    lv.setUint16(8, 0, true); lv.setUint16(10, dosTime, true); lv.setUint16(12, dosDate, true);
    lv.setUint32(14, crc, true); lv.setUint32(18, size, true); lv.setUint32(22, size, true);
    lv.setUint16(26, name.length, true); lv.setUint16(28, 0, true); lh.set(name, 30);
    const ch = new Uint8Array(46 + name.length), cv = new DataView(ch.buffer);
    cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true); cv.setUint16(10, 0, true); cv.setUint16(12, dosTime, true);
    cv.setUint16(14, dosDate, true); cv.setUint32(16, crc, true); cv.setUint32(20, size, true);
    cv.setUint32(24, size, true); cv.setUint16(28, name.length, true); cv.setUint32(42, offset, true);
    ch.set(name, 46);
    locals.push(lh, e.data); centrals.push(ch);
    offset += lh.length + size;
  }
  const cdSize = centrals.reduce((s, c) => s + c.length, 0);
  const end = new Uint8Array(22), ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true); ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true); ev.setUint32(12, cdSize, true); ev.setUint32(16, offset, true);
  const out = new Uint8Array(offset + cdSize + 22);
  let p = 0;
  for (const part of [...locals, ...centrals, end]) { out.set(part, p); p += part.length; }
  return out;
}

// zip の部品ごとの検査値（CRC-32）
let CRC32_TABLE = null;
function crc32(u8) {
  if (!CRC32_TABLE) {
    CRC32_TABLE = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      CRC32_TABLE[n] = c >>> 0;
    }
  }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < u8.length; i++) crc = CRC32_TABLE[(crc ^ u8[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

/* ============ 11. バックアップ・リストア ============ */

function backupData() {
  const data = loadData();
  const now = new Date();
  const stamp = toDateStr(now).replace(/-/g, '');
  // Excelと同じ R{令和}.{開始月}-{終了月} を付ける（同じ期間に複数回とっても区別できるよう日付も残す）
  const { start, end } = getLatestDataPeriod();
  const period = `R${start.getFullYear() - 2018}.${start.getMonth() + 1}-${end.getMonth() + 1}`;
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `勤怠バックアップ_${modeCfg().label}_${period}_${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('データをバックアップしました', 'success');
}

function showRestoreDialog(file) {
  const dialog = document.createElement('div');
  dialog.className = 'ios-dialog';
  dialog.innerHTML = `
    <div class="ios-dialog-content">
      <div class="ios-dialog-header">
        <div class="ios-dialog-title">データ復元方法</div>
        <div class="ios-dialog-message">【${esc(modeCfg().label)}】への復元方法を選択してください</div>
      </div>
      <div class="ios-dialog-buttons" style="flex-direction: column;">
        <button class="ios-dialog-button" data-act="merge" style="border-left:none;border-bottom:1px solid var(--border);">統合（既存データに追加・重複は除外）</button>
        <button class="ios-dialog-button primary" data-act="overwrite" style="border-left:none;border-bottom:1px solid var(--border);">上書き（既存データを置き換え）</button>
        <button class="ios-dialog-button" data-act="cancel" style="border-left:none;">キャンセル</button>
      </div>
    </div>`;
  document.body.appendChild(dialog);

  const close = () => { dialog.style.opacity = '0'; setTimeout(() => dialog.remove(), 250); };

  dialog.addEventListener('click', e => {
    if (e.target === dialog) { close(); return; }
    const act = e.target.dataset && e.target.dataset.act;
    if (!act) return;
    close();
    if (act === 'merge') restoreData(file, 'merge');
    else if (act === 'overwrite') restoreData(file, 'overwrite');
  });
}

function restoreData(file, mode) {
  const reader = new FileReader();
  reader.onload = function (event) {
    try {
      const incoming = JSON.parse(event.target.result);
      if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
        showToast('無効なデータ形式です', 'error');
        return;
      }
      if (mode === 'merge') {
        const { merged, added } = mergeTimeCards(loadData(), incoming);
        saveData(merged);
        showToast(`データを統合しました（${added}件追加）`, 'success');
      } else {
        saveData(incoming);
        showToast('データを上書きしました', 'success');
      }
      refreshNameList();
      displayTimeCards();
    } catch {
      showToast('データの読み込み中にエラーが発生しました', 'error');
    }
  };
  reader.readAsText(file);
}

/* ============ 11.5 フォルダ連携（月末会計・有給管理と同じ方式） ============ */
/*
 *  最初に1回フォルダを選ぶと、ブラウザが覚えておき、以後は変更のたびにそのフォルダへ自動で保存する。
 *    勤怠データ_R8.9-10.json … 締め期間（11日〜翌10日）ごとに1ファイル。通常とスイミングの両方が入る
 *    勤怠データ_設定.json   … 並び順・資格／バス・A〜Eの時給・サンプルの人・予定表（Googleカレンダー）の設定
 *  このPCの中（localStorage）が作業用、フォルダが保管用。開いたときに両方を突き合わせ、
 *  どちらか一方にしか無い記録があれば、黙って消さずにどうするか聞く。
 */
const FS_SUPPORTED = typeof window !== 'undefined' && 'showDirectoryPicker' in window;
const FS_DB_NAME = 'tc5FS';                 // 有給管理（yk_fs）・月末会計（getsumatsuFS）とは別の入れ物
const DATA_FILE_RE = /^勤怠データ_R\d+\.\d+-\d+\.json$/;
const SETTINGS_FILE = '勤怠データ_設定.json';
const SETTINGS_TIME_KEY = 'tc_settingsSavedAt';
let dirHandle = null;
let fsReady = false;        // フォルダと突き合わせ済みか。済むまでは書き込まない
let fsBusy = false;
let fsTimer = null;
let fsWritten = {};         // ファイル名 → { key, core }。いまフォルダにある中身（変わったファイルだけ書く）
let fsState = 'none';

function tc5IdbOpen() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(FS_DB_NAME, 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function tc5IdbSet(k, v) {
  const db = await tc5IdbOpen();
  return new Promise((res, rej) => {
    const t = db.transaction('kv', 'readwrite');
    t.objectStore('kv').put(v, k);
    t.oncomplete = () => res();
    t.onerror = () => rej(t.error);
  });
}
async function tc5IdbGet(k) {
  const db = await tc5IdbOpen();
  return new Promise((res, rej) => {
    const rq = db.transaction('kv', 'readonly').objectStore('kv').get(k);
    rq.onsuccess = () => res(rq.result);
    rq.onerror = () => rej(rq.error);
  });
}

// 期間キー "2026-09" → "勤怠データ_R8.9-10.json"
function periodFileName(key) {
  const y = +key.slice(0, 4), m = +key.slice(5, 7);
  return `勤怠データ_R${y - 2018}.${m}-${m === 12 ? 1 : m + 1}.json`;
}

// 名前・日付の順をそろえる（同じ中身なら同じ文字列になるように）
function canonModeData(d) {
  const out = {};
  for (const n of Object.keys(d || {}).sort()) {
    const days = d[n] || {};
    const keys = Object.keys(days).filter(k => Array.isArray(days[k]) && days[k].length).sort();
    if (!keys.length) continue;
    out[n] = {};
    for (const k of keys) out[n][k] = days[k];
  }
  return out;
}

function periodCore(key, normal, swim) {
  return JSON.stringify({ format: 'tc5-kintai', version: 1, period: key, label: periodLabelOf(key),
    normal: canonModeData(normal), swim: canonModeData(swim) });
}

// このPCの勤怠を、期間ごとのファイルの中身にする。ファイル名 → { key, core }
function buildDataFiles() {
  const byPeriod = {};
  for (const mode of ['normal', 'swim']) {
    const data = loadDataFor(mode);
    for (const name in data) {
      for (const d in data[name]) {
        if (!Array.isArray(data[name][d]) || !data[name][d].length) continue;
        const key = periodKeyOf(d);
        const p = byPeriod[key] = byPeriod[key] || { normal: {}, swim: {} };
        (p[mode][name] = p[mode][name] || {})[d] = data[name][d];
      }
    }
  }
  const files = {};
  for (const key of Object.keys(byPeriod)) {
    files[periodFileName(key)] = { key, core: periodCore(key, byPeriod[key].normal, byPeriod[key].swim) };
  }
  return files;
}

function settingsCore() {
  return JSON.stringify({ format: 'tc5-settings', version: 1,
    exportOrder: loadExportOrder(), employeeAttrs: loadEmployeeAttrs(),
    rankWages: loadWages(), samplePeople: loadSamplePeople(), portalCalendar: loadPortalCalendar() });
}

// 設定を変えたとき：変えた時刻を覚えて、フォルダへの保存を予約する
function markSettingsChanged() {
  localStorage.setItem(SETTINGS_TIME_KEY, new Date().toISOString());
  scheduleFolderSave();
}

function scheduleFolderSave() {
  if (!dirHandle || !fsReady) return;
  clearTimeout(fsTimer);
  fsTimer = setTimeout(flushFolder, 800);
}

async function writeFolderFile(name, core, savedAt) {
  const obj = JSON.parse(core);
  obj.savedAt = savedAt || new Date().toISOString();
  const fh = await dirHandle.getFileHandle(name, { create: true });
  const w = await fh.createWritable();
  await w.write(JSON.stringify(obj, null, 2));
  await w.close();
}

// 変わったファイルだけフォルダへ書く。データが無くなった期間は空にする（消したことが伝わるように）
async function flushFolder() {
  clearTimeout(fsTimer);
  fsTimer = null;
  if (!dirHandle || !fsReady) return false;
  if (fsBusy) { scheduleFolderSave(); return false; }
  fsBusy = true;
  try {
    if ((await dirHandle.queryPermission({ mode: 'readwrite' })) !== 'granted') { setFsStatus('perm'); return false; }
    const files = buildDataFiles();
    for (const name of Object.keys(fsWritten)) {
      if (DATA_FILE_RE.test(name) && !files[name]) files[name] = { key: fsWritten[name].key, core: periodCore(fsWritten[name].key, {}, {}) };
    }
    files[SETTINGS_FILE] = { core: settingsCore() };
    for (const name of Object.keys(files)) {
      const f = files[name];
      if (fsWritten[name] && fsWritten[name].core === f.core) continue;
      const savedAt = name === SETTINGS_FILE ? (localStorage.getItem(SETTINGS_TIME_KEY) || undefined) : undefined;
      await writeFolderFile(name, f.core, savedAt);
      fsWritten[name] = f;
    }
    setFsStatus('saved');
    return true;
  } catch (e) {
    console.warn('フォルダへの保存に失敗:', e);
    setFsStatus('error');
    return false;
  } finally {
    fsBusy = false;
  }
}

// フォルダの中身を読む
async function readFolderFiles() {
  const out = { data: { normal: {}, swim: {} }, files: {}, settings: null, dataFiles: 0, broken: [] };
  for await (const [name, handle] of dirHandle.entries()) {
    if (handle.kind !== 'file') continue;
    if (!DATA_FILE_RE.test(name) && name !== SETTINGS_FILE) continue;
    let obj;
    try { obj = JSON.parse(await (await handle.getFile()).text()); } catch { out.broken.push(name); continue; }
    if (name === SETTINGS_FILE) {
      if (obj && obj.format === 'tc5-settings') {
        out.settings = obj;
        out.files[name] = { core: JSON.stringify({ format: 'tc5-settings', version: 1,
          exportOrder: obj.exportOrder || [], employeeAttrs: obj.employeeAttrs || {},
          rankWages: obj.rankWages || {}, samplePeople: obj.samplePeople || [],
          portalCalendar: obj.portalCalendar || { apiKey: '', calendarId: '', muuminId: '' } }) };
      }
      continue;
    }
    if (!obj || obj.format !== 'tc5-kintai' || !/^\d{4}-\d{2}$/.test(obj.period)) { out.broken.push(name); continue; }
    out.dataFiles++;
    out.files[name] = { key: obj.period, core: periodCore(obj.period, obj.normal, obj.swim) };
    for (const mode of ['normal', 'swim']) {
      const src = obj[mode] || {};
      for (const n in src) for (const d in src[n]) {
        if (!Array.isArray(src[n][d]) || !src[n][d].length) continue;
        (out.data[mode][n] = out.data[mode][n] || {})[d] = src[n][d];
      }
    }
  }
  return out;
}

// 記録1件を見分ける鍵（モード｜名前｜日付｜出勤｜退勤｜有給）。同じものが2件あっても数える
function recordCounts(both) {
  const m = new Map();
  for (const mode of ['normal', 'swim']) {
    const d = both[mode] || {};
    for (const n in d) for (const day in d[n]) for (const c of (d[n][day] || [])) {
      if (!c) continue;
      const k = [mode, n, day, c.checkIn || '', c.checkOut || '', c.isPaidLeave ? 1 : 0].join('|');
      m.set(k, (m.get(k) || 0) + 1);
    }
  }
  return m;
}

// このPCとフォルダの違い（片方にしか無い記録の件数）
function compareWithFolder(local, folder) {
  const a = recordCounts(local), b = recordCounts(folder);
  let localOnly = 0, folderOnly = 0;
  for (const [k, n] of a) localOnly += Math.max(0, n - (b.get(k) || 0));
  for (const [k, n] of b) folderOnly += Math.max(0, n - (a.get(k) || 0));
  return { localOnly, folderOnly };
}

function applyBothModes(both) {
  localStorage.setItem(MODES.normal.storageKey, JSON.stringify(both.normal || {}));
  localStorage.setItem(MODES.swim.storageKey, JSON.stringify(both.swim || {}));
  scheduleAppSend();
}

function applySettingsFromFolder(s) {
  if (Array.isArray(s.exportOrder)) localStorage.setItem(ORDER_KEY, JSON.stringify(s.exportOrder));
  if (s.employeeAttrs && typeof s.employeeAttrs === 'object') localStorage.setItem(EMP_ATTR_KEY, JSON.stringify(s.employeeAttrs));
  if (s.rankWages && typeof s.rankWages === 'object') localStorage.setItem(WAGE_KEY, JSON.stringify(s.rankWages));
  if (Array.isArray(s.samplePeople)) localStorage.setItem(SAMPLE_KEY, JSON.stringify(s.samplePeople));
  if (s.portalCalendar && typeof s.portalCalendar === 'object') localStorage.setItem(PORTAL_CAL_KEY, JSON.stringify(s.portalCalendar));
  if (s.savedAt) localStorage.setItem(SETTINGS_TIME_KEY, s.savedAt);
}

// フォルダとこのPCの両方にしか無い記録があるとき、どうするか聞く
function chooseFolderConflict(diff) {
  return new Promise(resolve => {
    const dialog = document.createElement('div');
    dialog.className = 'ios-dialog';
    dialog.innerHTML = `
      <div class="ios-dialog-content">
        <div class="ios-dialog-header">
          <div class="ios-dialog-title">フォルダとこのPCの内容が違います</div>
          <div class="ios-dialog-message" style="white-space:pre-line;">${esc(
            `このPCにだけある記録：${diff.localOnly}件\nフォルダにだけある記録：${diff.folderOnly}件\n\n`
            + 'ほかのPCで直したり消したりした可能性があります。どちらに合わせますか？')}</div>
        </div>
        <div class="ios-dialog-buttons" style="flex-direction: column;">
          <button class="ios-dialog-button" data-act="folder" style="border-left:none;border-bottom:1px solid var(--border);">フォルダの内容にする（ふつうはこちら）</button>
          <button class="ios-dialog-button" data-act="merge" style="border-left:none;border-bottom:1px solid var(--border);">両方を合わせる（どちらにも無いものだけ足す）</button>
          <button class="ios-dialog-button primary" data-act="local" style="border-left:none;border-bottom:1px solid var(--border);">このPCの内容にする（フォルダだけの${diff.folderOnly}件は消える）</button>
          <button class="ios-dialog-button" data-act="later" style="border-left:none;">あとで決める（フォルダには保存しない）</button>
        </div>
      </div>`;
    document.body.appendChild(dialog);
    dialog.addEventListener('click', e => {
      const act = e.target.dataset && e.target.dataset.act;
      if (!act) return;
      dialog.style.opacity = '0';
      setTimeout(() => dialog.remove(), 250);
      resolve(act);
    });
  });
}

// フォルダと突き合わせる。済んだら自動保存を始める
async function syncWithFolder() {
  fsReady = false;
  setFsStatus('syncing');
  let folder;
  try {
    folder = await readFolderFiles();
  } catch (e) {
    console.warn('フォルダを読めない:', e);
    setFsStatus('error');
    return;
  }
  fsWritten = { ...folder.files };

  // 設定：新しいほうに合わせる（フォルダのほうが新しい、またはこのPCに記録が無ければフォルダ）
  if (folder.settings) {
    const localAt = localStorage.getItem(SETTINGS_TIME_KEY);
    if (!localAt || String(folder.settings.savedAt || '') > localAt) applySettingsFromFolder(folder.settings);
  }

  // 勤怠
  const local = { normal: loadDataFor('normal'), swim: loadDataFor('swim') };
  const diff = compareWithFolder(local, folder.data);
  let message = '';
  if (folder.dataFiles > 0 && diff.localOnly === 0 && diff.folderOnly > 0) {
    applyBothModes(folder.data);
    message = `フォルダから ${diff.folderOnly}件 の記録を読み込みました`;
  } else if (folder.dataFiles > 0 && diff.localOnly > 0 && diff.folderOnly > 0) {
    const act = await chooseFolderConflict(diff);
    if (act === 'later') { setFsStatus('conflict'); return; }
    if (act === 'folder') applyBothModes(folder.data);
    else if (act === 'merge') {
      applyBothModes({
        normal: mergeTimeCards(local.normal, folder.data.normal).merged,
        swim: mergeTimeCards(local.swim, folder.data.swim).merged
      });
    }
    message = act === 'folder' ? 'フォルダの内容に合わせました'
      : act === 'merge' ? '両方を合わせました' : 'このPCの内容をフォルダに保存しました';
  } else if (diff.localOnly > 0) {
    message = folder.dataFiles ? `このPCにだけある ${diff.localOnly}件 をフォルダに保存しました` : 'このPCの勤怠をフォルダに保存しました';
  }

  fsReady = true;
  await flushFolder();
  refreshNameList();
  displayTimeCards();
  if (folder.broken.length) showToast(`読めないファイルがありました：${folder.broken.join('、')}`, 'warning');
  else if (message) showToast(message, 'success');
}

// 保存先フォルダを選ぶ（ユーザーの操作から呼ぶ）
async function chooseFolder() {
  if (!FS_SUPPORTED) {
    showToast('このブラウザはフォルダ保存に対応していません（PCの Chrome か Edge で開いてください）', 'warning');
    return;
  }
  let dh;
  try {
    dh = await window.showDirectoryPicker({ mode: 'readwrite', id: 'tc5-kintai' });
  } catch (e) {
    if (e.name !== 'AbortError') showToast('フォルダを選べませんでした: ' + e.message, 'error');
    return;
  }
  dirHandle = dh;
  fsReady = false;
  fsWritten = {};
  try { await tc5IdbSet('dirHandle', dh); } catch {}
  await syncWithFolder();
}

// 前回のフォルダへの許可を取り直す（ユーザーの操作から呼ぶ）
async function reconnectFolder() {
  if (!dirHandle) { chooseFolder(); return; }
  try {
    if ((await dirHandle.requestPermission({ mode: 'readwrite' })) === 'granted') { await syncWithFolder(); return; }
  } catch {}
  setFsStatus('perm');
}

// 開いたとき：前回のフォルダを覚えていれば、許可があるか見て突き合わせる
async function restoreFolder() {
  if (!FS_SUPPORTED) { setFsStatus('unsupported'); return; }
  try { dirHandle = (await tc5IdbGet('dirHandle')) || null; } catch { dirHandle = null; }
  if (!dirHandle) { setFsStatus('none'); return; }
  try {
    if ((await dirHandle.queryPermission({ mode: 'readwrite' })) === 'granted') { await syncWithFolder(); return; }
  } catch {}
  setFsStatus('perm');
}

// 画面上の表示とボタン
function setFsStatus(state) {
  fsState = state;
  const label = document.getElementById('fsStatus');
  const btn = document.getElementById('fsActionBtn');
  if (!label || !btn) return;
  const name = dirHandle ? `「${dirHandle.name}」` : '';
  const time = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  const view = {
    unsupported: ['💾 フォルダへの保存は、PCの Chrome か Edge で使えます', ''],
    none:        ['💾 保存先フォルダ：まだ選んでいません', 'フォルダを選ぶ'],
    perm:        [`💾 フォルダ${name}：再接続が必要です（ブラウザを開き直したため）`, '再接続'],
    syncing:     [`💾 フォルダ${name}を確認しています…`, ''],
    saved:       [`💾 フォルダ${name}に自動保存中（${time} 保存）`, '変更'],
    error:       [`⚠ フォルダ${name}に保存できませんでした`, '再接続'],
    conflict:    [`⚠ フォルダ${name}とこのPCの内容が違います（まだ保存していません）`, '確かめる']
  }[state] || ['', ''];
  label.textContent = view[0];
  label.classList.toggle('fs-warn', state === 'perm' || state === 'error' || state === 'conflict' || state === 'none');
  btn.textContent = view[1];
  btn.classList.toggle('hidden', !view[1]);
}

function onFsAction() {
  if (fsState === 'perm' || fsState === 'error') reconnectFolder();
  else if (fsState === 'conflict') syncWithFolder();
  else chooseFolder();
}

/* ============ 12. 初期化 ============ */

document.addEventListener('DOMContentLoaded', () => {
  applyTheme(localStorage.getItem('theme') || 'light');
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);

  // モード切替
  document.querySelectorAll('#modeSwitch button').forEach(btn =>
    btn.addEventListener('click', () => setMode(btn.dataset.mode)));

  // 有給チェック（パスワード式）
  document.getElementById('isPaidLeave').addEventListener('change', async function () {
    if (this.checked) {
      const pwd = await showPromptDialog('有給登録', '有給として登録するためのパスワードを入力してください:', '', 'password');
      if (pwd === ADMIN_PASSWORD) {
        setPaidLeaveFields(true);
        document.getElementById('paidLeaveYear').value = new Date().getFullYear();
      } else {
        if (pwd) showToast('パスワードが違います', 'error');
        this.checked = false;
      }
    } else {
      setPaidLeaveFields(false);
    }
  });

  // 有給カレンダー（クリックで日付を選択／解除、◀▶で月移動）
  document.getElementById('paidCalendar').addEventListener('click', e => {
    const nav = e.target.closest('.cal-nav');
    if (nav) {
      paidCalCursor = new Date(paidCalCursor.getFullYear(), paidCalCursor.getMonth() + (+nav.dataset.nav), 1);
      renderPaidCalendar();
      return;
    }
    const day = e.target.closest('.cal-day');
    if (!day) return;
    const ds = day.dataset.date;
    if (paidSelectedDates.has(ds)) paidSelectedDates.delete(ds);
    else paidSelectedDates.add(ds);
    syncDateMultiFromCalendar();
    renderPaidCalendar();
  });

  // 日付欄を手で書き換えたらカレンダー選択は解除（手入力を優先）
  document.getElementById('dateMulti').addEventListener('input', () => {
    if (paidSelectedDates.size > 0) {
      paidSelectedDates.clear();
      renderPaidCalendar();
    }
  });

  // フォーム送信
  document.getElementById('timeCardForm').addEventListener('submit', e => {
    e.preventDefault();
    if (editingRecord) updateTimeCard();
    else saveTimeCard();
  });

  // Enterで次の入力欄へ移動（最後の欄でEnterすると送信）
  document.getElementById('timeCardForm').addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const t = e.target;
    if (t.tagName !== 'INPUT' || t.type === 'checkbox') return;
    e.preventDefault();
    const fields = [...e.currentTarget.querySelectorAll('input')]
      .filter(el => el.type !== 'checkbox' && el.offsetParent !== null);
    const next = fields[fields.indexOf(t) + 1];
    if (next) next.focus();
    else e.currentTarget.requestSubmit();
  });
  document.getElementById('cancelEditBtn').addEventListener('click', cancelEdit);

  // クラウドカードの折りたたみ（状態を記憶）
  const setCloudCollapsed = collapsed => {
    document.getElementById('cloudBody').classList.toggle('hidden', collapsed);
    document.getElementById('cloudArrow').textContent = collapsed ? '▸ ひらく' : '▾';
    localStorage.setItem('cloudCardCollapsed', collapsed ? '1' : '');
  };
  document.getElementById('cloudCardToggle').addEventListener('click', () =>
    setCloudCollapsed(!document.getElementById('cloudBody').classList.contains('hidden')));
  setCloudCollapsed(localStorage.getItem('cloudCardCollapsed') === '1');

  // 修正申請シート：現在モードのシートを画面右半分のウィンドウで開く（アプリと並べて見られる）
  document.getElementById('fixSheetBtn').addEventListener('click', () => {
    const w = Math.floor(screen.availWidth / 2);
    const h = screen.availHeight;
    window.open(FIX_SHEET_URLS[getMode()], 'fixSheet_' + getMode(), `width=${w},height=${h},left=${w},top=0`);
  });

  // ツールバー
  document.getElementById('exportBtn').addEventListener('click', showExportDialog);
  document.getElementById('backupBtn').addEventListener('click', backupData);
  document.getElementById('clearDataBtn').addEventListener('click', requestPasswordAndClearData);
  document.getElementById('restoreBtn').addEventListener('click', () => document.getElementById('restoreFile').click());
  document.getElementById('restoreFile').addEventListener('change', function (e) {
    if (e.target.files[0]) {
      showRestoreDialog(e.target.files[0]);
      e.target.value = '';
    }
  });

  // Googleドライブ（保存先フォルダ）：画面右半分のウィンドウで開く
  document.getElementById('driveBtn').addEventListener('click', () => {
    const w = Math.floor(screen.availWidth / 2);
    const h = screen.availHeight;
    window.open(DRIVE_FOLDER_URL, 'driveFolder', `width=${w},height=${h},left=${w},top=0`);
  });

  // 一括編集バー
  document.getElementById('result').addEventListener('change', e => {
    if (e.target.classList.contains('rec-check')) updateBulkBar();
  });
  document.getElementById('bulkEditBtn').addEventListener('click', bulkEditTimes);
  document.getElementById('bulkDeleteBtn').addEventListener('click', bulkDelete);
  document.getElementById('bulkClearBtn').addEventListener('click', () => {
    document.querySelectorAll('.rec-check:checked').forEach(cb => { cb.checked = false; });
    updateBulkBar();
  });

  // 一覧の期間。期間指定に切り替えたら、それまで出していた月を初めの値にする
  document.getElementById('listPeriod').addEventListener('change', function () {
    if (this.value === 'custom' && !document.getElementById('listFrom').value && !document.getElementById('listTo').value) {
      const cur = listPeriodSel && /^\d{4}-\d{2}$/.test(listPeriodSel) ? listPeriodSel : toDateStr(getLatestDataPeriod().start).slice(0, 7);
      const p = periodOfKey(cur);
      document.getElementById('listFrom').value = toDateStr(p.start);
      document.getElementById('listTo').value = toDateStr(p.end);
    }
    listPeriodSel = this.value;
    displayTimeCards();
  });
  document.getElementById('listFrom').addEventListener('change', displayTimeCards);
  document.getElementById('listTo').addEventListener('change', displayTimeCards);

  // 検索
  document.getElementById('searchName').addEventListener('input', displayTimeCards);
  document.getElementById('searchClearBtn').addEventListener('click', () => {
    document.getElementById('searchName').value = '';
    displayTimeCards();
  });

  // 入力欄に名前を打つと一覧も自動で絞り込み（検索バーに反映されるので手で変更・解除も可能）
  document.getElementById('name').addEventListener('input', function () {
    document.getElementById('searchName').value = this.value;
    displayTimeCards();
  });

  // 一覧のボタン（イベント委譲：名前に記号があっても安全）
  document.getElementById('result').addEventListener('click', e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const { action, name, date, index } = btn.dataset;
    if (action === 'edit') editTimeCard(name, date, +index);
    else if (action === 'split') splitTimeCard(name, date, +index);
    else if (action === 'delete') deleteTimeCard(name, date, +index);
  });

  // クラウド
  document.getElementById('cloudLoginBtn').addEventListener('click', cloudLogin);
  document.getElementById('cloudPassword').addEventListener('keydown', e => { if (e.key === 'Enter') cloudLogin(); });
  document.getElementById('cloudLogoutBtn').addEventListener('click', cloudLogout);
  document.getElementById('cloudReloadBtn').addEventListener('click', cloudLoadSnapshots);
  document.getElementById('cloudSnapshotSel').addEventListener('change', function () { cloudLoadSnapshot(this.value); });
  document.getElementById('cloudPeriodSel').addEventListener('change', renderCloudSummary);
  document.getElementById('cloudImportBtn').addEventListener('click', cloudImport);
  document.getElementById('cloudRawSaveBtn').addEventListener('click', cloudRawSave);

  // 保存先フォルダ
  document.getElementById('fsActionBtn').addEventListener('click', onFsAction);
  // Ctrl+S：フォルダにすぐ保存（まだ選んでいなければフォルダを選ぶ）
  document.addEventListener('keydown', async e => {
    if (!(e.ctrlKey || e.metaKey) || String(e.key).toLowerCase() !== 's') return;
    e.preventDefault();
    if (dirHandle && fsReady) {
      if (await flushFolder()) showToast(`フォルダ「${dirHandle.name}」に保存しました`, 'success');
    } else {
      onFsAction();
    }
  });
  // 別のタブ（有給管理の「TC5へ直接反映」など）が勤怠を書き換えたら、フォルダにも保存する
  window.addEventListener('storage', e => {
    if (e.key === MODES.normal.storageKey || e.key === MODES.swim.storageKey) { scheduleFolderSave(); scheduleAppSend(); }
  });

  // アプリへ送るカード（折りたたみ・鍵の保存・今すぐ送る）
  const setAppCollapsed = collapsed => {
    document.getElementById('appSendBody').classList.toggle('hidden', collapsed);
    document.getElementById('appSendArrow').textContent = collapsed ? '▸ ひらく' : '▾';
  };
  document.getElementById('appSendToggle').addEventListener('click', () =>
    setAppCollapsed(!document.getElementById('appSendBody').classList.contains('hidden')));
  document.getElementById('appKeySaveBtn').addEventListener('click', () => {
    const v = document.getElementById('appKeyInput').value.trim();
    if (!v) { showToast('鍵を入力してください', 'error'); return; }
    localStorage.setItem(APP_KEY_KEY, v);
    document.getElementById('appKeyInput').value = '';
    appSetStatus('鍵を保存しました。送信中…', true);
    appSendNow(true);
  });
  document.getElementById('appSendNowBtn').addEventListener('click', () => appSendNow(true));
  try {
    const st = JSON.parse(localStorage.getItem(APP_STATUS_KEY) || 'null');
    document.getElementById('appSendStatus').textContent = (localStorage.getItem(APP_KEY_KEY) ? (st && st.text) : '') || (localStorage.getItem(APP_KEY_KEY) ? '' : '鍵が未設定');
  } catch {}

  // 初期表示
  setMode(getMode());
  if (cloudToken) showCloudMain();
  restoreFolder();
  scheduleAppSend(8000);          // 起動時：未送信の変更があれば送る
});
