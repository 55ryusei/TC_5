/***********************************************
 * ダークモード機能
 ***********************************************/

function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  applyTheme(savedTheme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
  localStorage.setItem('theme', theme);
  
  if (theme === 'dark') {
    applyDarkModeStyles();
  } else {
    removeDarkModeStyles();
  }
}

function applyDarkModeStyles() {
  const existingStyle = document.getElementById('dark-mode-override');
  if (existingStyle) {
    existingStyle.remove();
  }
  
  const style = document.createElement('style');
  style.id = 'dark-mode-override';
  style.textContent = `
    [data-theme="dark"] body {
      background: linear-gradient(135deg, #1e1e1e 0%, #2d2d30 100%) !important;
      color: #ffffff !important;
    }
    
    [data-theme="dark"] .container {
      background: #2d2d30 !important;
      border: 1px solid #46464b !important;
      color: #ffffff !important;
    }
    
    [data-theme="dark"] h1 {
      color: #ffffff !important;
    }
    
    [data-theme="dark"] label {
      color: #cccccc !important;
    }
    
    [data-theme="dark"] input[type="text"],
    [data-theme="dark"] input[type="time"], 
    [data-theme="dark"] input[type="number"],
    [data-theme="dark"] input[type="date"],
    [data-theme="dark"] select {
      background: #3c3c41 !important;
      border: 1px solid #505055 !important;
      color: #ffffff !important;
    }
    
    [data-theme="dark"] input[type="text"]:focus,
    [data-theme="dark"] input[type="time"]:focus,
    [data-theme="dark"] input[type="number"]:focus,
    [data-theme="dark"] input[type="date"]:focus,
    [data-theme="dark"] select:focus {
      background: #46464b !important;
      border-color: #3b82f6 !important;
      color: #ffffff !important;
    }
    
    [data-theme="dark"] input[type="text"]::placeholder {
      color: #888888 !important;
    }
    
    [data-theme="dark"] #result {
      background: #232326 !important;
      border: 1px solid #46464b !important;
      color: #ffffff !important;
    }
    
    [data-theme="dark"] #result h2 {
      color: #ffffff !important;
      border-bottom: 2px solid #46464b !important;
    }
    
    [data-theme="dark"] #result h3 {
      color: #ffffff !important;
      background: #373738 !important;
      border: 1px solid #46464b !important;
    }
    
    [data-theme="dark"] .record-card {
      background: #373738 !important;
      border: 1px solid #46464b !important;
      color: #ffffff !important;
    }
    
    [data-theme="dark"] .record-card:hover {
      background: #404045 !important;
      border-color: rgba(59, 130, 246, 0.5) !important;
    }
    
    [data-theme="dark"] .record-time,
    [data-theme="dark"] .record-date {
      color: #ffffff !important;
    }
    
    [data-theme="dark"] .record-date {
      background: rgba(59, 130, 246, 0.2) !important;
      border: 1px solid rgba(59, 130, 246, 0.4) !important;
    }
    
    [data-theme="dark"] .dropdown-menu {
      background: #2d2d30 !important;
      border: 1px solid #46464b !important;
    }
    
    [data-theme="dark"] .dropdown-item {
      color: #ffffff !important;
      border-bottom: 1px solid #46464b !important;
    }
    
    [data-theme="dark"] .dropdown-item-info {
      color: #888888 !important;
    }
    
    [data-theme="dark"] .dropdown-empty {
      color: #888888 !important;
    }
    
    [data-theme="dark"] .checkbox-label {
      color: #cccccc !important;
    }
    
    [data-theme="dark"] .clear-btn {
      background: #46464b !important;
      color: #cccccc !important;
    }
    
    [data-theme="dark"] .clear-btn:hover {
      background: #505055 !important;
      color: #ffffff !important;
    }
    
    [data-theme="dark"] .theme-toggle {
      background: #2d2d30 !important;
      border: 1px solid #46464b !important;
    }
    
    [data-theme="dark"] .toast-notification {
      background: #2d2d30 !important;
      border: 1px solid #46464b !important;
    }
    
    [data-theme="dark"] .toast-message {
      color: #ffffff !important;
    }
    
    [data-theme="dark"] .ios-dialog-content {
      background: #2d2d30 !important;
    }
    
    [data-theme="dark"] .ios-dialog-header {
      border-bottom: 1px solid #46464b !important;
    }
    
    [data-theme="dark"] .ios-dialog-title {
      color: #ffffff !important;
    }
    
    [data-theme="dark"] .ios-dialog-message {
      color: #cccccc !important;
    }
    
    [data-theme="dark"] .ios-dialog-buttons {
      background: #373738 !important;
    }
    
    [data-theme="dark"] .ios-dialog-button {
      color: #3b82f6 !important;
    }
    
    [data-theme="dark"] .ios-dialog-button.primary {
      color: #ef4444 !important;
    }
    
    [data-theme="dark"] .ios-dialog-button + .ios-dialog-button {
      border-left: 1px solid #46464b !important;
    }
    
    [data-theme="dark"] .btn-secondary {
      background: #373738 !important;
      border: 1px solid #46464b !important;
      color: #3b82f6 !important;
    }
    
    [data-theme="dark"] .btn-secondary:hover:not(:disabled) {
      background: rgba(59, 130, 246, 0.1) !important;
    }
  `;
  document.head.appendChild(style);
}

function removeDarkModeStyles() {
  const existingStyle = document.getElementById('dark-mode-override');
  if (existingStyle) {
    existingStyle.remove();
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
  showToast(`${newTheme === 'dark' ? 'ダーク' : 'ライト'}モードに変更しました`, 'info', 2000);
}

/***********************************************
 * 編集機能用のグローバル変数
 ***********************************************/
let editingRecord = null;

/***********************************************
 * ドロップダウン機能の変数とフラグ
 ***********************************************/
let isDropdownActionInProgress = false;

/***********************************************
 * iOS風通知システム
 ***********************************************/

function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast-notification ${type}`;
  
  const iconMap = {
    success: '✓',
    error: '✕',
    info: 'i',
    warning: '!'
  };
  
  toast.innerHTML = `
    <div class="toast-content">
      <div class="toast-icon">${iconMap[type] || 'i'}</div>
      <div class="toast-message">${message}</div>
    </div>
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOutToast 0.3s ease-in forwards';
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, duration);
}

function showConfirmDialog(title, message, onConfirm, confirmText = '削除', cancelText = 'キャンセル') {
  return new Promise((resolve) => {
    const dialog = document.createElement('div');
    dialog.className = 'ios-dialog';
    
    dialog.innerHTML = `
      <div class="ios-dialog-content">
        <div class="ios-dialog-header">
          <div class="ios-dialog-title">${title}</div>
          <div class="ios-dialog-message">${message}</div>
        </div>
        <div class="ios-dialog-buttons">
          <button class="ios-dialog-button">${cancelText}</button>
          <button class="ios-dialog-button primary">${confirmText}</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    const [cancelBtn, confirmBtn] = dialog.querySelectorAll('.ios-dialog-button');
    
    const closeDialog = () => {
      dialog.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(dialog)) {
          document.body.removeChild(dialog);
        }
      }, 300);
    };
    
    cancelBtn.addEventListener('click', () => {
      closeDialog();
      resolve(false);
    });
    
    confirmBtn.addEventListener('click', () => {
      onConfirm();
      closeDialog();
      resolve(true);
    });
    
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        closeDialog();
        resolve(false);
      }
    });
  });
}

function showPromptDialog(title, message, defaultValue = '') {
  return new Promise((resolve) => {
    const dialog = document.createElement('div');
    dialog.className = 'ios-dialog';
    
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const inputStyle = isDark ? `
      width: 100%;
      margin-top: 16px;
      padding: 12px;
      border: 1px solid rgba(80, 80, 85, 0.6);
      border-radius: 8px;
      font-size: 1em;
      outline: none;
      background: rgba(60, 60, 65, 0.8);
      color: #ffffff;
    ` : `
      width: 100%;
      margin-top: 16px;
      padding: 12px;
      border: 1px solid rgba(0,0,0,0.2);
      border-radius: 8px;
      font-size: 1em;
      outline: none;
    `;
    
    dialog.innerHTML = `
      <div class="ios-dialog-content">
        <div class="ios-dialog-header">
          <div class="ios-dialog-title">${title}</div>
          <div class="ios-dialog-message">${message}</div>
          <input type="text" value="${defaultValue}" style="${inputStyle}">
        </div>
        <div class="ios-dialog-buttons">
          <button class="ios-dialog-button">キャンセル</button>
          <button class="ios-dialog-button primary">OK</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    const input = dialog.querySelector('input');
    const [cancelBtn, confirmBtn] = dialog.querySelectorAll('.ios-dialog-button');
    
    setTimeout(() => input.focus(), 100);
    
    const closeDialog = () => {
      dialog.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(dialog)) {
          document.body.removeChild(dialog);
        }
      }, 300);
    };
    
    cancelBtn.addEventListener('click', () => {
      closeDialog();
      resolve(null);
    });
    
    confirmBtn.addEventListener('click', () => {
      const value = input.value.trim();
      closeDialog();
      resolve(value);
    });
    
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const value = input.value.trim();
        closeDialog();
        resolve(value);
      }
    });
  });
}

/***********************************************
 * 期間取得用 関数群
 *   毎月11日～翌月10日を1期間とする
 ***********************************************/

function getMonthPeriod(dateString) {
  const date = new Date(dateString);
  const day = date.getDate();
  let startYear = date.getFullYear();
  let startMonth = date.getMonth();
  // 10日以前の場合は前月の期間に含まれる
  if (day <= 10) {
    startMonth--;
    if (startMonth < 0) {
      startMonth = 11;
      startYear--;
    }
  }
  const start = new Date(startYear, startMonth, 11);

  let endYear = startYear;
  let endMonth = startMonth + 1;
  if (endMonth > 11) {
    endMonth = 0;
    endYear++;
  }
  const end = new Date(endYear, endMonth, 10);
  return { start, end };
}

function getLatestMonthPeriod() {
  const today = new Date();
  const day = today.getDate();
  let startYear = today.getFullYear();
  let startMonth = today.getMonth();
  // 10日以前の場合は前月の期間に含まれる
  if (day <= 10) {
    startMonth--;
    if (startMonth < 0) {
      startMonth = 11;
      startYear--;
    }
  }
  const start = new Date(startYear, startMonth, 11);

  let endYear = startYear;
  let endMonth = startMonth + 1;
  if (endMonth > 11) {
    endMonth = 0;
    endYear++;
  }
  const end = new Date(endYear, endMonth, 10);
  return { start, end };
}

// 新しい関数：実際のデータから最新の期間を取得
function getLatestDataPeriod() {
  const allTimeCards = JSON.parse(localStorage.getItem('timeCards') || '{}');
  let latestDate = null;

  console.log('データ全体:', allTimeCards);

  // すべてのデータから最新の日付を探す
  for (let name in allTimeCards) {
    console.log(`${name}のデータ:`, allTimeCards[name]);
    for (let date in allTimeCards[name]) {
      console.log('日付文字列:', date);
      // 日付文字列をパース（YYYY-MM-DD形式を想定）
      const d = new Date(date + 'T00:00:00');
      console.log('パースした日付:', d, 'isValid:', !isNaN(d.getTime()));
      if (!isNaN(d.getTime())) {  // 有効な日付かチェック
        console.log('比較: latestDate=', latestDate, 'd=', d, 'd > latestDate:', d > latestDate);
        if (!latestDate || d > latestDate) {
          console.log('★最新日付を更新します:', d);
          latestDate = d;
          console.log('★更新後のlatestDate:', latestDate);
        }
      }
    }
  }

  // データがない場合は今日の日付を使用
  if (!latestDate) {
    console.warn('データが見つかりませんでした。今日の日付を使用します。');
    latestDate = new Date();
  }

  console.log('最終的な最新のデータ日付:', latestDate);
  console.log('最新のデータ日付の日にち:', latestDate.getDate());

  // 最新の日付を基準に期間を計算
  const dateString = latestDate.toISOString().slice(0, 10);
  console.log('getMonthPeriodに渡す文字列:', dateString);
  const period = getMonthPeriod(dateString);
  console.log('計算された期間:', period);
  console.log('期間の開始:', period.start);
  console.log('期間の終了:', period.end);
  console.log('開始月:', period.start.getMonth() + 1, '終了月:', period.end.getMonth() + 1);
  return period;
}
/***********************************************
 * ドロップダウン機能
 ***********************************************/

function updateNameUsageOrder(name) {
  let nameUsage = JSON.parse(localStorage.getItem('nameUsageOrder') || '{}');
  nameUsage[name] = Date.now();
  localStorage.setItem('nameUsageOrder', JSON.stringify(nameUsage));
}

function getExistingNames() {
  const data = JSON.parse(localStorage.getItem('timeCards') || '{}');
  const nameUsage = JSON.parse(localStorage.getItem('nameUsageOrder') || '{}');
  const names = Object.keys(data);
  
  const namesWithUsage = names.map(name => {
    const lastUsed = nameUsage[name] || 0;
    return { name, lastUsed };
  });
  
  namesWithUsage.sort((a, b) => {
    return b.lastUsed - a.lastUsed;
  });
  
  return namesWithUsage.map(item => item.name);
}

function updateClearButton(inputId, clearBtnId) {
  const input = document.getElementById(inputId);
  const clearBtn = document.getElementById(clearBtnId);
  
  if (input && clearBtn) {
    if (input.value.trim()) {
      clearBtn.classList.add('show');
    } else {
      clearBtn.classList.remove('show');
    }
  }
}

function showDropdown(inputId, dropdownId) {
  if (isDropdownActionInProgress) return;
  
  if (dropdownId === 'nameDropdown') {
    hideDropdown('searchDropdown');
  } else if (dropdownId === 'searchDropdown') {
    hideDropdown('nameDropdown');
  }
  
  const input = document.getElementById(inputId);
  const dropdown = document.getElementById(dropdownId);
  const names = getExistingNames();
  const inputValue = input.value.toLowerCase().trim();
  
  const filteredNames = names.filter(name => 
    name.toLowerCase().includes(inputValue)
  );
  
  dropdown.innerHTML = '';
  
  if (filteredNames.length === 0) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'dropdown-empty';
    emptyDiv.textContent = inputValue ? '該当する名前が見つかりません' : '記録された名前はありません';
    dropdown.appendChild(emptyDiv);
  } else {
    filteredNames.forEach(name => {
      const item = document.createElement('div');
      item.className = 'dropdown-item';
      
      const nameSpan = document.createElement('span');
      nameSpan.textContent = name;
      
      const nameUsage = JSON.parse(localStorage.getItem('nameUsageOrder') || '{}');
      const lastUsed = nameUsage[name];
      const infoSpan = document.createElement('span');
      infoSpan.className = 'dropdown-item-info';
      if (lastUsed) {
        const lastUsedDate = new Date(lastUsed);
        const today = new Date();
        const diffDays = Math.floor((today - lastUsedDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
          infoSpan.textContent = '今日使用';
        } else if (diffDays === 1) {
          infoSpan.textContent = '昨日使用';
        } else if (diffDays < 7) {
          infoSpan.textContent = `${diffDays}日前使用`;
        } else {
          infoSpan.textContent = `${Math.floor(diffDays / 7)}週間前使用`;
        }
      } else {
        infoSpan.textContent = '';
      }
      
      item.appendChild(nameSpan);
      item.appendChild(infoSpan);
      
      const handleItemClick = () => {
        isDropdownActionInProgress = true;
        input.value = name;
        hideDropdown(dropdownId);
        
        if (inputId === 'name') {
          updateClearButton('name', 'clearNameBtn');
        } else if (inputId === 'searchName') {
          displayTimeCards();
          updateClearButton('searchName', 'clearSearchBtn');
        }
        
        setTimeout(() => {
          isDropdownActionInProgress = false;
        }, 300);
      };

      item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleItemClick();
      });
      
      dropdown.appendChild(item);
    });
  }
  
  dropdown.classList.add('show');
}

function hideDropdown(dropdownId) {
  const dropdown = document.getElementById(dropdownId);
  dropdown.classList.remove('show');
}

function hideAllDropdowns() {
  hideDropdown('nameDropdown');
  hideDropdown('searchDropdown');
}

/***********************************************
 * イベントリスナー
 ***********************************************/

document.getElementById('isPaidLeave').addEventListener('change', async function() {
  if (this.checked) {
    const pwd = await showPromptDialog(
      '有給登録',
      '有給として登録するためのパスワードを入力してください:'
    );
    
    if (pwd === "4564") {
      document.getElementById('normalDateGroup').classList.add('hidden');
      document.getElementById('paidLeaveYearGroup').classList.remove('hidden');
      document.getElementById('multiDateGroup').classList.remove('hidden');
      document.getElementById('dateSingle').required = false;
      document.getElementById('paidLeaveYear').required = true;
      document.getElementById('dateMulti').required = true;
    } else if (pwd) {
      showToast("パスワードが違います", 'error');
      this.checked = false;
    } else {
      this.checked = false;
    }
  } else {
    document.getElementById('normalDateGroup').classList.remove('hidden');
    document.getElementById('paidLeaveYearGroup').classList.add('hidden');
    document.getElementById('multiDateGroup').classList.add('hidden');
    document.getElementById('dateSingle').required = true;
    document.getElementById('paidLeaveYear').required = false;
    document.getElementById('dateMulti').required = false;
  }
});

document.getElementById('timeCardForm').addEventListener('submit', function(e) {
  e.preventDefault();
  if (editingRecord) {
    updateTimeCard();
  } else {
    saveTimeCard();
  }
});

document.getElementById('cancelEditBtn').addEventListener('click', cancelEdit);

document.getElementById('exportBtn').addEventListener('click', showExportDialog);
document.getElementById('clearDataBtn').addEventListener('click', requestPasswordAndClearData);
document.getElementById('backupBtn').addEventListener('click', backupData);
document.getElementById('backupLatestMonthBtn').addEventListener('click', backupLatestMonthData);
document.getElementById('restoreBtn').addEventListener('click', function() {
  document.getElementById('restoreFile').click();
});
document.getElementById('restoreFile').addEventListener('change', function(e) {
  if (e.target.files[0]) {
    showRestoreDialog(e.target.files[0]);
    e.target.value = '';
  }
});

document.getElementById('searchName').addEventListener('input', function() {
  displayTimeCards();
});

document.addEventListener('DOMContentLoaded', function() {
  initTheme();
  
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  const currentYear = new Date().getFullYear();
  const yearInput = document.getElementById('paidLeaveYear');
  if (yearInput) {
    yearInput.value = currentYear;
  }

  const nameInput = document.getElementById('name');
  const searchInput = document.getElementById('searchName');
  const clearNameBtn = document.getElementById('clearNameBtn');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  
  nameInput.addEventListener('focus', () => {
    if (!isDropdownActionInProgress) {
      showDropdown('name', 'nameDropdown');
      updateClearButton('name', 'clearNameBtn');
    }
  });
  
  nameInput.addEventListener('input', () => {
    if (!isDropdownActionInProgress) {
      showDropdown('name', 'nameDropdown');
      updateClearButton('name', 'clearNameBtn');
    }
  });
  
  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      hideDropdown('nameDropdown');
      e.preventDefault();
    }
  });
  
  searchInput.addEventListener('focus', () => {
    showDropdown('searchName', 'searchDropdown');
    updateClearButton('searchName', 'clearSearchBtn');
  });
  
  searchInput.addEventListener('input', () => {
    if (!isDropdownActionInProgress) {
      displayTimeCards();
      showDropdown('searchName', 'searchDropdown');
      updateClearButton('searchName', 'clearSearchBtn');
    }
  });
  
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      hideDropdown('searchDropdown');
      e.preventDefault();
    }
  });
  
  clearNameBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    nameInput.value = '';
    clearNameBtn.classList.remove('show');
    hideDropdown('nameDropdown');
    nameInput.focus();
  });
  
  clearSearchBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    searchInput.value = '';
    clearSearchBtn.classList.remove('show');
    hideDropdown('searchDropdown');
    displayTimeCards();
    searchInput.focus();
  });
  
  document.addEventListener('click', (e) => {
    if (isDropdownActionInProgress) return;
    
    if (!e.target.closest('.input-wrapper')) {
      hideAllDropdowns();
    }
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideAllDropdowns();
    }
  });
  
  displayTimeCards();
  updateClearButton('name', 'clearNameBtn');
  updateClearButton('searchName', 'clearSearchBtn');
});

/***********************************************
 * saveTimeCard, displayTimeCards, deleteTimeCard
 ***********************************************/

function saveTimeCard() {
  const name = document.getElementById('name').value.trim();
  const isPaidLeave = document.getElementById('isPaidLeave').checked;

  if (!name) {
    showToast('名前を入力してください', 'warning');
    return;
  }
  const checkIn = document.getElementById('checkIn').value;
  const checkOut = document.getElementById('checkOut').value;
  if (!checkIn) {
    showToast('出勤時間を入力してください', 'warning');
    return;
  }

  let finalDates = [];
  if (isPaidLeave) {
    const paidLeaveYear = document.getElementById('paidLeaveYear').value.trim();
    let dateMulti = document.getElementById('dateMulti').value.trim();
    if (!paidLeaveYear) {
      showToast('有給用の西暦を入力してください', 'warning');
      return;
    }
    if (!dateMulti) {
      showToast('月日を入力してください', 'warning');
      return;
    }
    const splitted = dateMulti.split(',')
      .map(s => s.trim())
      .filter(s => s !== '')
      .map(s => (s.length===4 && s.indexOf('-')===-1) ? s.slice(0,2)+'-'+s.slice(2) : s);
    if (splitted.length === 0) {
      showToast('月日を入力してください', 'warning');
      return;
    }
    finalDates = splitted.map(md => `${paidLeaveYear}-${md}`);
  } else {
    const dateSingle = document.getElementById('dateSingle').value;
    if (!dateSingle) {
      showToast('月日を入力してください', 'warning');
      return;
    }
    finalDates = [dateSingle];
  }

  const timeCardData = { 
    checkIn, 
    checkOut: checkOut || null,
    isPaidLeave 
  };
  let allTimeCards = JSON.parse(localStorage.getItem('timeCards')) || {};
  if (!allTimeCards[name]) {
    allTimeCards[name] = {};
  }
  finalDates.forEach(dateStr => {
    if (!allTimeCards[name][dateStr]) {
      allTimeCards[name][dateStr] = [];
    }
    allTimeCards[name][dateStr].push(timeCardData);
  });
  localStorage.setItem('timeCards', JSON.stringify(allTimeCards));

  updateNameUsageOrder(name);

  if (!isPaidLeave) {
    document.getElementById('timeCardForm').reset();
    document.getElementById('isPaidLeave').checked = false;
    document.getElementById('normalDateGroup').classList.remove('hidden');
    document.getElementById('paidLeaveYearGroup').classList.add('hidden');
    document.getElementById('multiDateGroup').classList.add('hidden');
    document.getElementById('dateSingle').required = true;
    document.getElementById('paidLeaveYear').required = false;
    document.getElementById('dateMulti').required = false;
    updateClearButton('name', 'clearNameBtn');
    if (checkOut) {
      showToast('送信が完了しました（通常勤務）', 'success');
    } else {
      showToast('出勤を記録しました。退勤時は再度登録してください', 'info');
    }
  } else {
    document.getElementById('checkIn').value = "";
    document.getElementById('checkOut').value = "";
    document.getElementById('dateMulti').value = "";
    showToast('送信が完了しました（有給）', 'success');
  }

  displayTimeCards();
}

function displayTimeCards() {
  const searchName = document.getElementById('searchName').value.trim().toLowerCase();
  const allTimeCards = JSON.parse(localStorage.getItem('timeCards') || '{}');
  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = '<h2>勤怠一覧</h2>';

  for (let name in allTimeCards) {
    if (searchName && !name.toLowerCase().includes(searchName)) continue;
    resultDiv.innerHTML += `<h3>${name}</h3>`;
    const sortedDates = Object.keys(allTimeCards[name]).sort();
    sortedDates.forEach(date => {
      if (Array.isArray(allTimeCards[name][date])) {
        allTimeCards[name][date].forEach((card, index) => {
          if (card && card.checkIn) {
            const paidLabel = card.isPaidLeave ? '<span class="record-status status-paid">有給</span>' : '';
            const checkOutDisplay = card.checkOut ? card.checkOut : '<span class="record-status status-incomplete">未登録</span>';
            
            const splitButton = card.checkOut ? 
              `<button class="btn-info btn-xs" onclick="splitTimeCard('${name}', '${date}', ${index})">分割</button>` : '';
            
            resultDiv.innerHTML += `
              <div class="record-card">
                <div class="record-info">
                  <span class="record-date">${formatDate(date)}</span>
                  <span class="record-time">${card.checkIn}</span>
                  <span>→</span>
                  <span class="record-time">${checkOutDisplay}</span>
                  ${paidLabel}
                </div>
                <div class="record-buttons">
                  <button class="btn-warning btn-xs" onclick="editTimeCard('${name}', '${date}', ${index})">編集</button>
                  ${splitButton}
                  <button class="btn-danger btn-xs" onclick="deleteTimeCard('${name}', '${date}', ${index})">削除</button>
                </div>
              </div>
            `;
          }
        });
      }
    });
  }
}

function deleteTimeCard(name, date, index) {
  showConfirmDialog(
    '記録の削除',
    '本当に削除しますか？',
    () => {
      let allTimeCards = JSON.parse(localStorage.getItem('timeCards') || '{}');
      allTimeCards[name][date].splice(index, 1);
      if (allTimeCards[name][date].length === 0) {
        delete allTimeCards[name][date];
      }
      if (Object.keys(allTimeCards[name]).length === 0) {
        delete allTimeCards[name];
      }
      localStorage.setItem('timeCards', JSON.stringify(allTimeCards));
      displayTimeCards();
      showToast('記録を削除しました', 'success');
    }
  );
}

/****************************************************
 * 編集機能
 ****************************************************/
function editTimeCard(name, date, index) {
  const allTimeCards = JSON.parse(localStorage.getItem('timeCards') || '{}');
  const card = allTimeCards[name][date][index];
  
  if (!card) return;
  
  editingRecord = { name, date, index };
  
  document.getElementById('name').value = name;
  document.getElementById('dateSingle').value = date;
  document.getElementById('checkIn').value = card.checkIn || '';
  document.getElementById('checkOut').value = card.checkOut || '';
  document.getElementById('isPaidLeave').checked = card.isPaidLeave || false;
  
  if (card.isPaidLeave) {
    const yearMatch = date.match(/^(\d{4})-/);
    if (yearMatch) {
      const yearInput = document.getElementById('paidLeaveYear');
      yearInput.value = yearMatch[1];
      document.getElementById('dateMulti').value = formatDate(date);
    }
    document.getElementById('normalDateGroup').classList.add('hidden');
    document.getElementById('paidLeaveYearGroup').classList.remove('hidden');
    document.getElementById('multiDateGroup').classList.remove('hidden');
    document.getElementById('dateSingle').required = false;
    document.getElementById('paidLeaveYear').required = true;
    document.getElementById('dateMulti').required = true;
  }
  
  document.getElementById('submitBtn').textContent = '更新';
  document.getElementById('cancelEditBtn').classList.remove('hidden');
  
  updateClearButton('name', 'clearNameBtn');
  
  document.getElementById('timeCardForm').scrollIntoView({ behavior: 'smooth' });
}

function updateTimeCard() {
  const name = document.getElementById('name').value.trim();
  const isPaidLeave = document.getElementById('isPaidLeave').checked;

  if (!name) {
    showToast('名前を入力してください', 'warning');
    return;
  }
  
  const checkIn = document.getElementById('checkIn').value;
  const checkOut = document.getElementById('checkOut').value;
  
  if (!checkIn) {
    showToast('出勤時間を入力してください', 'warning');
    return;
  }

  const timeCardData = { 
    checkIn, 
    checkOut: checkOut || null,
    isPaidLeave 
  };
  
  let allTimeCards = JSON.parse(localStorage.getItem('timeCards') || '{}');
  
  allTimeCards[editingRecord.name][editingRecord.date].splice(editingRecord.index, 1);
  if (allTimeCards[editingRecord.name][editingRecord.date].length === 0) {
    delete allTimeCards[editingRecord.name][editingRecord.date];
  }
  if (Object.keys(allTimeCards[editingRecord.name]).length === 0) {
    delete allTimeCards[editingRecord.name];
  }
  
  let finalDates = [];
  if (isPaidLeave) {
    const paidLeaveYear = document.getElementById('paidLeaveYear').value.trim();
    let dateMulti = document.getElementById('dateMulti').value.trim();
    if (!paidLeaveYear || !dateMulti) {
      showToast('有給用の西暦と月日を入力してください', 'warning');
      return;
    }
    const splitted = dateMulti.split(',')
      .map(s => s.trim())
      .filter(s => s !== '')
      .map(s => (s.length===4 && s.indexOf('-')===-1) ? s.slice(0,2)+'-'+s.slice(2) : s);
    finalDates = splitted.map(md => `${paidLeaveYear}-${md}`);
  } else {
    const dateSingle = document.getElementById('dateSingle').value;
    if (!dateSingle) {
      showToast('月日を入力してください', 'warning');
      return;
    }
    finalDates = [dateSingle];
  }
  
  if (!allTimeCards[name]) {
    allTimeCards[name] = {};
  }
  finalDates.forEach(dateStr => {
    if (!allTimeCards[name][dateStr]) {
      allTimeCards[name][dateStr] = [];
    }
    allTimeCards[name][dateStr].push(timeCardData);
  });
  
  localStorage.setItem('timeCards', JSON.stringify(allTimeCards));
  
  updateNameUsageOrder(name);
  
  showToast('更新が完了しました', 'success');
  cancelEdit();
  displayTimeCards();
}

function cancelEdit() {
  editingRecord = null;
  
  document.getElementById('timeCardForm').reset();
  document.getElementById('isPaidLeave').checked = false;
  
  document.getElementById('normalDateGroup').classList.remove('hidden');
  document.getElementById('paidLeaveYearGroup').classList.add('hidden');
  document.getElementById('multiDateGroup').classList.add('hidden');
  document.getElementById('dateSingle').required = true;
  document.getElementById('paidLeaveYear').required = false;
  document.getElementById('dateMulti').required = false;
  
  document.getElementById('submitBtn').textContent = '送信';
  document.getElementById('cancelEditBtn').classList.add('hidden');
  
  updateClearButton('name', 'clearNameBtn');
}

/****************************************************
 * 分割機能（中抜け対応）
 ****************************************************/
function splitTimeCard(name, date, index) {
  const allTimeCards = JSON.parse(localStorage.getItem('timeCards') || '{}');
  const card = allTimeCards[name][date][index];
  
  if (!card || !card.checkIn || !card.checkOut) {
    showToast('出勤・退勤時間が両方登録されている記録のみ分割できます', 'warning');
    return;
  }
  
  showPromptDialog(
    '中抜け開始時間',
    `中抜け開始時間を入力してください\n\n【入力例】\n・12:00 または 1200\n・08:20 または 0820\n\n現在の記録:\n出勤: ${card.checkIn}\n退勤: ${card.checkOut}`
  ).then((breakStartInput) => {
    if (!breakStartInput) return;
    
    const breakStart = normalizeTimeInput(breakStartInput);
    if (!breakStart) {
      showToast('無効な時刻形式です。\n\n有効な形式:\n・HH:MM（例：12:00）\n・HHMM（例：1200）\n・HMM（例：820）', 'error');
      return;
    }
    
    showPromptDialog(
      '中抜け終了時間',
      `中抜け終了時間を入力してください\n\n【入力例】\n・13:00 または 1300\n・08:20 または 0820\n\n現在の記録:\n出勤: ${card.checkIn}\n退勤: ${card.checkOut}\n中抜け開始: ${breakStart}`
    ).then((breakEndInput) => {
      if (!breakEndInput) return;
      
      const breakEnd = normalizeTimeInput(breakEndInput);
      if (!breakEnd) {
        showToast('無効な時刻形式です。\n\n有効な形式:\n・HH:MM（例：13:00）\n・HHMM（例：1300）\n・HMM（例：830）', 'error');
        return;
      }
      
      if (!isValidTimeOrder(card.checkIn, breakStart, breakEnd, card.checkOut)) {
        showToast('時間の順序が正しくありません。\n出勤時間 < 中抜け開始 < 中抜け終了 < 退勤時間\nになるように入力してください。\n\n入力された時刻:\n出勤: ' + card.checkIn + '\n中抜け開始: ' + breakStart + '\n中抜け終了: ' + breakEnd + '\n退勤: ' + card.checkOut, 'error');
        return;
      }
      
      showConfirmDialog(
        '記録を分割',
        `以下のように分割しますか？\n\n【1つ目の記録】\n出勤: ${card.checkIn}\n退勤: ${breakStart}\n\n【2つ目の記録】\n出勤: ${breakEnd}\n退勤: ${card.checkOut}`,
        () => {
          allTimeCards[name][date].splice(index, 1);
          
          const record1 = {
            checkIn: card.checkIn,
            checkOut: breakStart,
            isPaidLeave: card.isPaidLeave || false
          };
          
          const record2 = {
            checkIn: breakEnd,
            checkOut: card.checkOut,
            isPaidLeave: card.isPaidLeave || false
          };
          
          allTimeCards[name][date].push(record1);
          allTimeCards[name][date].push(record2);
          
          localStorage.setItem('timeCards', JSON.stringify(allTimeCards));
          
          showToast('記録を分割しました', 'success');
          displayTimeCards();
        },
        '分割する'
      );
    });
  });
}

function isValidTimeOrder(time1, time2, time3, time4) {
  const t1 = new Date(`1970-01-01T${time1}`);
  const t2 = new Date(`1970-01-01T${time2}`);
  const t3 = new Date(`1970-01-01T${time3}`);
  const t4 = new Date(`1970-01-01T${time4}`);
  
  return t1 < t2 && t2 < t3 && t3 < t4;
}

function normalizeTimeInput(input) {
  if (!input) return null;
  
  input = input.trim();
  
  if (/^\d{1,2}:\d{2}$/.test(input)) {
    const [hours, minutes] = input.split(':');
    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
    }
    return null;
  }
  
  if (/^\d{4}$/.test(input)) {
    const hours = parseInt(input.substring(0, 2), 10);
    const minutes = parseInt(input.substring(2, 4), 10);
    
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');
    }
    return null;
  }
  
  if (/^\d{3}$/.test(input)) {
    const hours = parseInt(input.substring(0, 1), 10);
    const minutes = parseInt(input.substring(1, 3), 10);
    
    if (hours >= 0 && hours <= 9 && minutes >= 0 && minutes <= 59) {
      return String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');
    }
    return null;
  }
  
  return null;
}

/****************************************************
 * 全データ削除 (パスワード)
 ****************************************************/
function requestPasswordAndClearData() {
  showPromptDialog(
    'データクリア',
    'パスワードを入力してください:'
  ).then((password) => {
    if (password === '4564') {
      showConfirmDialog(
        'データクリア確認',
        '本当にすべてのデータをクリアしますか？',
        () => {
          localStorage.removeItem('timeCards');
          displayTimeCards();
          showToast('すべてのデータを削除しました', 'success');
        }
      );
    } else if (password) {
      showToast('パスワードが違います', 'error');
    }
  });
}

/****************************************************
 * 計算・ユーティリティ関数
 ***********************************************/

function calculateTimeDifference(startTime, endTime) {
  const start = new Date(`1970-01-01T${startTime}`);
  const end = new Date(`1970-01-01T${endTime}`);
  const diff = (end - start) / (1000 * 60 * 60);
  return parseFloat(diff.toFixed(2));
}

function calculateEarlyMorningTime(startTime, endTime) {
  const endLimit = new Date('1970-01-01T08:30');
  const start = new Date(`1970-01-01T${startTime}`);
  const end = new Date(`1970-01-01T${endTime}`);
  if (end <= endLimit) {
    return calculateTimeDifference(startTime, endTime);
  } else if (start < endLimit) {
    return calculateTimeDifference(startTime, '08:30');
  }
  return 0;
}

function calculateEveningTime(startTime, endTime) {
  const startLimit = new Date('1970-01-01T16:00');
  const start = new Date(`1970-01-01T${startTime}`);
  const end = new Date(`1970-01-01T${endTime}`);
  if (start >= startLimit) {
    return calculateTimeDifference(startTime, endTime);
  } else if (end > startLimit) {
    return calculateTimeDifference('16:00', endTime);
  }
  return 0;
}

function formatDate(dateString) {
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return `${parts[1]}-${parts[2]}`;
  }
  return dateString;
}

/****************************************************
 * エクスポートダイアログ表示・非表示
 ****************************************************/
function showExportDialog() {
  const dialog = document.createElement('div');
  dialog.id = 'exportDialog';
  dialog.className = 'ios-dialog';

  // Get all user names from localStorage
  const allTimeCards = JSON.parse(localStorage.getItem('timeCards') || '{}');
  const userNames = Object.keys(allTimeCards).sort();

  // Generate checkboxes HTML for each user (all checked by default)
  let userCheckboxesHTML = '';
  if (userNames.length > 0) {
    userCheckboxesHTML = `
      <div style="margin-top: 20px;">
        <label style="display: block; margin-bottom: 6px; font-size: 0.9em; color: var(--text-secondary);">エクスポートする従業員</label>
        <div style="max-height: 200px; overflow-y: auto; border: 1px solid var(--border-primary); border-radius: 8px; padding: 12px; background: var(--bg-card);">
          <div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid var(--border-primary);">
            <label style="display: flex; align-items: center; cursor: pointer;">
              <input type="checkbox" id="selectAllUsers" checked style="margin-right: 8px; cursor: pointer;">
              <span style="font-weight: bold;">すべて選択</span>
            </label>
          </div>
          ${userNames.map(name => `
            <div style="margin-bottom: 6px;">
              <label style="display: flex; align-items: center; cursor: pointer;">
                <input type="checkbox" class="userCheckbox" value="${name}" checked style="margin-right: 8px; cursor: pointer;">
                <span>${name}</span>
              </label>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // データの最新期間を取得（今日の日付ではなく）
  const { start, end } = getLatestDataPeriod();
  const startDateStr = start.toISOString().slice(0, 10);
  const endDateStr = end.toISOString().slice(0, 10);

  dialog.innerHTML = `
    <div class="ios-dialog-content" style="width: 450px; max-width: 90vw;">
      <div class="ios-dialog-header" style="text-align: left;">
        <div class="ios-dialog-title">エクスポート設定</div>

        ${userCheckboxesHTML}

        <div style="margin-top: 20px;">
          <label style="display: block; margin-bottom: 6px; font-size: 0.9em; color: var(--text-secondary);">エクスポート期間</label>
          <select id="exportPeriodType" style="width: 100%; padding: 10px; border: 1px solid var(--border-primary); border-radius: 8px; font-size: 1em; background: var(--bg-card); color: var(--text-primary);">
            <option value="all">すべてのデータ</option>
            <option value="latest" selected>最新の月（11日～翌月10日）</option>
            <option value="custom">期間指定</option>
          </select>
        </div>

        <div id="customPeriodFields" style="display: none; margin-top: 16px;">
          <div style="margin-bottom: 12px;">
            <label style="display: block; margin-bottom: 6px; font-size: 0.9em; color: var(--text-secondary);">開始日</label>
            <input type="date" id="exportStartDate" value="${startDateStr}" style="width: 100%; padding: 10px; border: 1px solid var(--border-primary); border-radius: 8px; font-size: 1em; background: var(--bg-card); color: var(--text-primary);">
          </div>
          <div>
            <label style="display: block; margin-bottom: 6px; font-size: 0.9em; color: var(--text-secondary);">終了日</label>
            <input type="date" id="exportEndDate" value="${endDateStr}" style="width: 100%; padding: 10px; border: 1px solid var(--border-primary); border-radius: 8px; font-size: 1em; background: var(--bg-card); color: var(--text-primary);">
          </div>
        </div>

        <div style="margin-top: 16px;">
          <label class="checkbox-label" style="display: flex; align-items: center; cursor: pointer; font-size: 0.9em;">
            <input type="checkbox" id="enableRaiseDate" style="margin-right: 8px; cursor: pointer;">
            <span>昇給日で分割する</span>
          </label>
        </div>

        <div id="raiseDateFields" style="display: none; margin-top: 12px;">
          <label style="display: block; margin-bottom: 6px; font-size: 0.9em; color: var(--text-secondary);">昇給日</label>
          <input type="date" id="raiseDate" style="width: 100%; padding: 10px; border: 1px solid var(--border-primary); border-radius: 8px; font-size: 1em; background: var(--bg-card); color: var(--text-primary);">
          <div style="margin-top: 6px; font-size: 0.8em; color: var(--text-secondary);">
            指定した日付で期間を分割し、別々に集計します
          </div>
        </div>

<div style="margin-top: 16px;">
          <label style="display: block; margin-bottom: 6px; font-size: 0.9em; color: var(--text-secondary);">業務内容</label>
          <select id="exportWorkType" style="width: 100%; padding: 10px; border: 1px solid var(--border-primary); border-radius: 8px; font-size: 1em; background: var(--bg-card); color: var(--text-primary);">
            <option value="通常" selected>通常</option>
            <option value="スイミング">スイミング</option>
          </select>
        </div>
      </div>

      <div class="ios-dialog-buttons">
        <button class="ios-dialog-button" onclick="hideExportDialog()">キャンセル</button>
        <button class="ios-dialog-button primary" id="exportExecuteBtn">エクスポート</button>
      </div>
    </div>
  `;

  document.body.appendChild(dialog);

  // Add event listeners for the checkboxes
  const selectAllCheckbox = document.getElementById('selectAllUsers');
  const userCheckboxes = document.querySelectorAll('.userCheckbox');

  if (selectAllCheckbox) {
    // "Select All" checkbox controls all individual checkboxes
    selectAllCheckbox.addEventListener('change', function() {
      userCheckboxes.forEach(checkbox => {
        checkbox.checked = this.checked;
      });
    });

    // Individual checkboxes update "Select All" state
    userCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', function() {
        const allChecked = Array.from(userCheckboxes).every(cb => cb.checked);
        const someChecked = Array.from(userCheckboxes).some(cb => cb.checked);

        selectAllCheckbox.checked = allChecked;
        selectAllCheckbox.indeterminate = someChecked && !allChecked;
      });
    });
  }

  document.getElementById('exportPeriodType').addEventListener('change', function() {
    const customFields = document.getElementById('customPeriodFields');
    if (this.value === 'custom') {
      customFields.style.display = 'block';
    } else {
      customFields.style.display = 'none';
    }
  });

  document.getElementById('enableRaiseDate').addEventListener('change', function() {
    const raiseDateFields = document.getElementById('raiseDateFields');
    if (this.checked) {
      raiseDateFields.style.display = 'block';
    } else {
      raiseDateFields.style.display = 'none';
    }
  });

  // エクスポートボタンのイベントリスナーを追加
// エクスポートボタンのイベントリスナーを追加
  document.getElementById('exportExecuteBtn').addEventListener('click', function() {
    // この時点で値を取得してログ出力
    const periodTypeValue = document.getElementById('exportPeriodType').value;
    const workTypeValue = document.getElementById('exportWorkType').value;
    console.log('Button clicked - Period:', periodTypeValue, 'WorkType:', workTypeValue);
    console.log('WorkType element:', document.getElementById('exportWorkType'));

    performExport();
  });

  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) {
      hideExportDialog();
    }
  });
}
function hideExportDialog() {
  const dialog = document.getElementById('exportDialog');
  if (dialog) {
    dialog.style.opacity = '0';
    setTimeout(() => {
      if (document.body.contains(dialog)) {
        document.body.removeChild(dialog);
      }
    }, 300);
  }
}

/****************************************************
 * Excelエクスポート実行
 ****************************************************/
function performExport() {
  // Get selected users from checkboxes
  const userCheckboxes = document.querySelectorAll('.userCheckbox:checked');
  const selectedUsers = Array.from(userCheckboxes).map(cb => cb.value);

  // Validate that at least one user is selected
  if (selectedUsers.length === 0) {
    hideExportDialog();
    setTimeout(() => showToast('少なくとも1人の従業員を選択してください', 'warning'), 100);
    return;
  }

  // 要素を直接取得
  const periodSelect = document.getElementById('exportPeriodType');
  const workTypeSelect = document.getElementById('exportWorkType');

  console.log('periodSelect element:', periodSelect);
  console.log('workTypeSelect element:', workTypeSelect);

  if (!periodSelect || !workTypeSelect) {
    console.error('Elements not found!');
    hideExportDialog();
    setTimeout(() => showToast('エラーが発生しました', 'error'), 100);
    return;
  }

  const exportType = periodSelect.value;
  const exportWorkType = workTypeSelect.value;

  // 昇給日の設定を取得
  const enableRaiseDate = document.getElementById('enableRaiseDate').checked;
  const raiseDate = enableRaiseDate ? document.getElementById('raiseDate').value : null;

  console.log('取得した値 - exportType:', exportType, 'exportWorkType:', exportWorkType);
  console.log('選択された従業員:', selectedUsers);
  console.log('昇給日設定 - enabled:', enableRaiseDate, 'date:', raiseDate);

  let startDate, endDate;

  if (exportType === 'all') {
    // すべてのデータをエクスポート（期間制限なし）
    startDate = new Date('1900-01-01');
    endDate = new Date('2100-12-31');
    console.log('全データをエクスポート');
  } else if (exportType === 'latest') {
    // データの最新期間を使用
    const { start, end } = getLatestDataPeriod();
    startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    console.log('最新月の期間（データ基準）:', startDate, '～', endDate);
  } else {
    const startInput = document.getElementById('exportStartDate').value;
    const endInput = document.getElementById('exportEndDate').value;

    console.log('期間指定 - startInput:', startInput, 'endInput:', endInput);

    if (!startInput || !endInput) {
      console.error('日付が未入力: startInput=', startInput, 'endInput=', endInput);
      hideExportDialog();
      setTimeout(() => showToast('開始日と終了日を入力してください', 'warning'), 100);
      return;
    }

    startDate = new Date(startInput);
    endDate = new Date(endInput);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      hideExportDialog();
      setTimeout(() => showToast('有効な日付を入力してください', 'warning'), 100);
      return;
    }

    if (startDate > endDate) {
      hideExportDialog();
      setTimeout(() => showToast('開始日は終了日より前である必要があります', 'warning'), 100);
      return;
    }
}

  // 昇給日のバリデーション
  if (enableRaiseDate && !raiseDate) {
    hideExportDialog();
    setTimeout(() => showToast('昇給日を入力してください', 'warning'), 100);
    return;
  }

  // 昇給日が期間内にあるかチェック
  if (enableRaiseDate && raiseDate) {
    const raiseDateObj = new Date(raiseDate);
    if (raiseDateObj <= startDate || raiseDateObj >= endDate) {
      hideExportDialog();
      setTimeout(() => showToast('昇給日は開始日と終了日の間の日付を指定してください', 'warning'), 100);
      return;
    }
  }

  // ダイアログを閉じる前に値を保存
  const finalExportType = exportType;
  const finalWorkType = exportWorkType;
  const finalSelectedUsers = selectedUsers;
  const finalRaiseDate = raiseDate ? new Date(raiseDate) : null;

  console.log('Exporting with:', { finalExportType, finalWorkType, startDate, endDate, finalSelectedUsers, finalRaiseDate });

  hideExportDialog();
  exportToExcelWithOptions(startDate, endDate, finalWorkType, finalExportType, finalSelectedUsers, finalRaiseDate);
}

function exportToExcelWithOptions(startDate, endDate, workType, exportType, selectedUsers, raiseDate = null) {
  const allTimeCards = JSON.parse(localStorage.getItem('timeCards') || '{}');
  const workbook = XLSX.utils.book_new();
  let sheetCount = 0;

  // 実際にエクスポートされるデータの日付範囲を追跡
  let actualMinDate = null;
  let actualMaxDate = null;

  // 終了日を23:59:59に設定して、その日のデータを確実に含める
  const adjustedEndDate = new Date(endDate);
  adjustedEndDate.setHours(23, 59, 59, 999);

  // 昇給日が指定されている場合、期間を2つに分割
  let periods = [];
  if (raiseDate) {
    const raiseDateCopy = new Date(raiseDate);
    const beforeRaiseDateEnd = new Date(raiseDate);
    beforeRaiseDateEnd.setDate(beforeRaiseDateEnd.getDate() - 1);
    beforeRaiseDateEnd.setHours(23, 59, 59, 999);

    periods = [
      { start: startDate, end: beforeRaiseDateEnd, label: '昇給前' },
      { start: raiseDateCopy, end: adjustedEndDate, label: '昇給後' }
    ];
  } else {
    periods = [{ start: startDate, end: adjustedEndDate, label: '' }];
  }

  // 各従業員のデータを処理
  for (let name in allTimeCards) {
    // Filter: only process data for selected users
    if (!selectedUsers.includes(name)) {
      continue;
    }

    // シート名を決定
    let sheetName = name;
    if (exportType !== 'custom' && !raiseDate) {
      // 11日～10日の期間の場合はエクスポート期間の開始月を使用（昇給日がない場合のみ）
      const monthNames = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
      sheetName = name + monthNames[startDate.getMonth()];
    }

    const sheetData = [];

    // ヘッダー行：名前と業務内容
    let headerText = `名前: ${name} (${workType})`;
    sheetData.push([headerText]);

    // 昇給日がない場合のみ列ヘッダーを追加
    if (!raiseDate) {
      sheetData.push(["日付","出勤時間","退勤時間","合計時間","早朝勤務","夕方勤務","朝夕合計","通常合計","勤務種別"]);
    }

    // 昇給日対応：各期間ごとにデータを収集して出力
    for (let periodIndex = 0; periodIndex < periods.length; periodIndex++) {
      const { start: periodStart, end: periodEnd, label: periodLabel } = periods[periodIndex];
      const periodData = [];

      for (let date in allTimeCards[name]) {
        const d = new Date(date);

        // この日付が現在の期間内にあるかチェック
        if (d >= periodStart && d <= periodEnd) {
          // 実際の最小・最大日付を更新
          if (!actualMinDate || d < actualMinDate) {
            actualMinDate = d;
          }
          if (!actualMaxDate || d > actualMaxDate) {
            actualMaxDate = d;
          }

          allTimeCards[name][date].forEach(card => {
            if (card && card.checkIn) {
              const checkOutTime = card.checkOut || '未登録';
              let totalHours = 0;
              let earlyMorning = 0;
              let evening = 0;

              if (card.checkOut) {
                totalHours = parseFloat(calculateTimeDifference(card.checkIn, card.checkOut));
                earlyMorning = parseFloat(calculateEarlyMorningTime(card.checkIn, card.checkOut));
                evening = parseFloat(calculateEveningTime(card.checkIn, card.checkOut));
              }

              periodData.push({
                date,
                checkIn: card.checkIn,
                checkOut: checkOutTime,
                totalHours,
                earlyMorning,
                evening,
                isPaidLeave: card.isPaidLeave
              });
            }
          });
        }
      }

      // この期間にデータがない場合はスキップ
      if (periodData.length === 0) {
        continue;
      }

      // 期間ラベルがある場合（昇給日設定時）は区切り行を追加
      if (periodLabel) {
        const startStr = `${periodStart.getMonth() + 1}/${periodStart.getDate()}`;
        const endStr = `${periodEnd.getMonth() + 1}/${periodEnd.getDate()}`;
        sheetData.push([]);
        sheetData.push([`■ ${periodLabel} (${startStr}～${endStr})`]);
        sheetData.push(["日付","出勤時間","退勤時間","合計時間","早朝勤務","夕方勤務","朝夕合計","通常合計","勤務種別"]);
      }

      let periodTotalDay = 0;
      let periodEarlyMorning = 0;
      let periodEvening = 0;
      let periodMorningEvening = 0;
      let periodNormal = 0;

      // データを日付順にソート
      periodData.sort((a, b) => new Date(a.date) - new Date(b.date));

      // 各レコードを出力
      periodData.forEach(rec => {
        const morningEvening = rec.earlyMorning + rec.evening;
        const normalHours = rec.totalHours - morningEvening;

        if (rec.checkOut !== '未登録') {
          periodTotalDay += rec.totalHours;
          periodEarlyMorning += rec.earlyMorning;
          periodEvening += rec.evening;
          periodMorningEvening += morningEvening;
          periodNormal += normalHours;
        }

        sheetData.push([
          formatDate(rec.date),
          rec.checkIn,
          rec.checkOut,
          rec.checkOut === '未登録' ? '－' : rec.totalHours.toFixed(2),
          rec.checkOut === '未登録' ? '－' : rec.earlyMorning.toFixed(2),
          rec.checkOut === '未登録' ? '－' : rec.evening.toFixed(2),
          rec.checkOut === '未登録' ? '－' : morningEvening.toFixed(2),
          rec.checkOut === '未登録' ? '－' : normalHours.toFixed(2),
          rec.isPaidLeave ? "有給" : ""
        ]);
      });

      // 期間ごとの小計行
      sheetData.push([]);
      sheetData.push([
        periodLabel ? `【${periodLabel}合計】` : "合計","","",
        periodTotalDay.toFixed(2),
        periodEarlyMorning.toFixed(2),
        periodEvening.toFixed(2),
        periodMorningEvening.toFixed(2),
        periodNormal.toFixed(2),
        ""
      ]);
    }

    // ワークシートを作成して追加
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    sheetCount++;
  }

  if (sheetCount === 0) {
    showToast('選択した期間にデータがありません', 'warning');
    return;
  }

  // ファイル名生成
  let filename = '';
  
  if (exportType === 'all') {
    // すべてのデータの場合、実際のデータの範囲を使用
    if (actualMinDate && actualMaxDate) {
      const minPeriod = getMonthPeriod(actualMinDate.toISOString().slice(0, 10));
      const maxPeriod = getMonthPeriod(actualMaxDate.toISOString().slice(0, 10));
      
      const startYear = minPeriod.start.getFullYear();
      const startMonth = minPeriod.start.getMonth() + 1;
      const endMonth = maxPeriod.end.getMonth() + 1;
      const reiwaYear = startYear - 2018;
      
      filename = `R${reiwaYear}.${startMonth}-${endMonth}`;
    } else {
      filename = 'timecards';
    }
  } else if (exportType === 'latest') {
    const { start, end } = getLatestDataPeriod();
    const startYear = start.getFullYear();
    const startMonth = start.getMonth() + 1;
    const endMonth = end.getMonth() + 1;
    const reiwaYear = startYear - 2018;
    
    filename = `R${reiwaYear}.${startMonth}-${endMonth}`;
  } else {
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth() + 1;
    const startDay = startDate.getDate();
    const endMonth = endDate.getMonth() + 1;
    const endDay = endDate.getDate();
    const reiwaYear = startYear - 2018;
    
    filename = `R${reiwaYear}.${startMonth}/${startDay}-${endMonth}/${endDay}`;
  }
  
  if (workType === 'スイミング') {
    filename += '_SW';
  }
  
  filename += '.xlsx';

  console.log('ファイル名:', filename);
  XLSX.writeFile(workbook, filename);
  showToast('Excelファイルを出力しました', 'success');
}

/****************************************************
 * バックアップ・リストア
 ****************************************************/
function backupData() {
  const allTimeCards = JSON.parse(localStorage.getItem('timeCards') || '{}');
  const dataStr = JSON.stringify(allTimeCards);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'timecards_backup.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('データをバックアップしました', 'success');
}

function backupLatestMonthData() {
  const allTimeCards = JSON.parse(localStorage.getItem('timeCards') || '{}');
  // データの最新期間を使用
  const { start, end } = getLatestDataPeriod();
  const latestMonthData = {};

  for (let name in allTimeCards) {
    for (let date in allTimeCards[name]) {
      const d = new Date(date);
      if (d >= start && d <= end) {
        if (!latestMonthData[name]) {
          latestMonthData[name] = {};
        }
        latestMonthData[name][date] = allTimeCards[name][date];
      }
    }
  }

  if (Object.keys(latestMonthData).length === 0) {
    showToast('最新の月のデータがありません', 'warning');
    return;
  }

  const dataStr = JSON.stringify(latestMonthData);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'latest_month_timecards_backup.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('最新の月をバックアップしました', 'success');
}

function showRestoreDialog(file) {
  const dialog = document.createElement('div');
  dialog.className = 'ios-dialog';

  dialog.innerHTML = `
    <div class="ios-dialog-content">
      <div class="ios-dialog-header">
        <div class="ios-dialog-title">データ復元方法</div>
        <div class="ios-dialog-message">復元方法を選択してください</div>
      </div>
      <div class="ios-dialog-buttons" style="flex-direction: column;">
        <button class="ios-dialog-button primary" id="mergeRestoreBtn" style="border-bottom: 1px solid var(--border-primary); border-left: none;">統合</button>
        <button class="ios-dialog-button" id="overwriteRestoreBtn" style="border-left: none;">上書き</button>
        <button class="ios-dialog-button" id="cancelRestoreBtn" style="border-top: 1px solid var(--border-primary); border-left: none;">キャンセル</button>
      </div>
    </div>
  `;

  document.body.appendChild(dialog);

  const closeDialog = () => {
    dialog.style.opacity = '0';
    setTimeout(() => {
      if (document.body.contains(dialog)) {
        document.body.removeChild(dialog);
      }
    }, 300);
  };

  document.getElementById('mergeRestoreBtn').addEventListener('click', () => {
    closeDialog();
    restoreDataMerge(file);
  });

  document.getElementById('overwriteRestoreBtn').addEventListener('click', () => {
    closeDialog();
    restoreDataOverwrite(file);
  });

  document.getElementById('cancelRestoreBtn').addEventListener('click', () => {
    closeDialog();
  });

  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) {
      closeDialog();
    }
  });
}

function restoreDataMerge(file) {
  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      const newData = JSON.parse(event.target.result);
      if (newData && typeof newData === 'object') {
        const existingData = JSON.parse(localStorage.getItem('timeCards') || '{}');
        const mergedData = mergeTimeCards(existingData, newData);
        localStorage.setItem('timeCards', JSON.stringify(mergedData));
        displayTimeCards();
        showToast('データを統合しました', 'success');
      } else {
        showToast('無効なデータ形式です', 'error');
      }
    } catch (e) {
      showToast('データの読み込み中にエラーが発生しました', 'error');
    }
  };
  reader.readAsText(file);
}

function restoreDataOverwrite(file) {
  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      const allTimeCards = JSON.parse(event.target.result);
      if (allTimeCards && typeof allTimeCards === 'object') {
        localStorage.setItem('timeCards', JSON.stringify(allTimeCards));
        displayTimeCards();
        showToast('データを上書きしました', 'success');
      } else {
        showToast('無効なデータ形式です', 'error');
      }
    } catch (e) {
      showToast('データの読み込み中にエラーが発生しました', 'error');
    }
  };
  reader.readAsText(file);
}

function mergeTimeCards(existingData, newData) {
  const merged = JSON.parse(JSON.stringify(existingData));

  for (let name in newData) {
    if (!merged[name]) {
      merged[name] = {};
    }

    for (let date in newData[name]) {
      if (!merged[name][date]) {
        merged[name][date] = [];
      }

      newData[name][date].forEach(newCard => {
        const isDuplicate = merged[name][date].some(existingCard =>
          existingCard.checkIn === newCard.checkIn &&
          existingCard.checkOut === newCard.checkOut &&
          existingCard.isPaidLeave === newCard.isPaidLeave
        );

        if (!isDuplicate) {
          merged[name][date].push(newCard);
        }
      });
    }
  }

  return merged;
}