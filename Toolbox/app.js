// 页面模块
const pages = {
  home: renderHome,
  screenshot: renderScreenshot,
  clipboard: renderClipboard,
  password: renderPassword,
  memo: renderMemo,
  imagebatch: renderImageBatch,
  mediavault: renderMediaVault,
  docconvert: renderDocConvert,
  pdftoolkit: renderPdfToolkit,
  hash: renderHash,
  color: renderColor,
  qrcode: renderQrCode,
  encrypt: renderEncryptTransmission,
  devtools: renderDevTools,
  settings: renderSettings
};

let currentPage = 'home';

function init() {
  // 导航点击事件
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      navigateTo(page);
    });
  });

  // 窗口控制按钮
  initWindowControls();

  // 全局监听 OCR 识别结果（来自截图遮罩层）
  window.electronAPI.onOcrResult((data) => {
    if (data && data.success) {
      showOcrResultModal(data.text || i18n.t('（未识别到文字）'));
    } else {
      showOcrResultModal(data && data.error ? i18n.t('识别失败：') + data.error : i18n.t('识别失败'), i18n.t('OCR 识别失败'));
    }
  });

  // 默认加载首页
  navigateTo('home');

  // 语言切换后重渲当前页
  window.addEventListener('locale-changed', () => {
    navigateTo(currentPage);
  });
}

function initWindowControls() {
  const minimizeBtn = document.getElementById('win-minimize');
  const maximizeBtn = document.getElementById('win-maximize');
  const closeBtn = document.getElementById('win-close');
  const maximizeIcon = document.getElementById('win-maximize-icon');
  const langToggleBtn = document.getElementById('win-lang-toggle');

  if (!minimizeBtn || !maximizeBtn || !closeBtn) return;

  minimizeBtn.addEventListener('click', () => window.electronAPI.windowMinimize());

  maximizeBtn.addEventListener('click', async () => {
    await window.electronAPI.windowMaximize();
    updateMaximizeIcon();
  });

  closeBtn.addEventListener('click', () => window.electronAPI.windowClose());

  if (langToggleBtn) {
    langToggleBtn.addEventListener('click', () => i18n.toggleLocale());
  }

  // 双击标题栏最大化/还原
  const titleBar = document.querySelector('.title-bar');
  if (titleBar) {
    titleBar.addEventListener('dblclick', async (e) => {
      if (e.target.closest('.window-controls')) return;
      await window.electronAPI.windowMaximize();
      updateMaximizeIcon();
    });
  }

  async function updateMaximizeIcon() {
    const isMaximized = await window.electronAPI.windowIsMaximized();
    if (maximizeIcon) {
      maximizeIcon.className = isMaximized ? 'ph ph-corners-in' : 'ph ph-square';
      maximizeBtn.title = isMaximized ? i18n.t('还原') : i18n.t('最大化');
    }
    document.body.classList.toggle('window-maximized', isMaximized);
  }

  // 监听主进程窗口状态变化
  if (window.electronAPI.onWindowStateChanged) {
    window.electronAPI.onWindowStateChanged((state) => {
      if (maximizeIcon) {
        maximizeIcon.className = state.isMaximized ? 'ph ph-corners-in' : 'ph ph-square';
        maximizeBtn.title = state.isMaximized ? i18n.t('还原') : i18n.t('最大化');
      }
      document.body.classList.toggle('window-maximized', state.isMaximized);
    });
  }

  // 初始状态
  updateMaximizeIcon();
}

function navigateTo(page) {
  currentPage = page;
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });

  const content = document.getElementById('content');
  content.innerHTML = '';
  if (pages[page]) {
    pages[page](content);
  }
}

function createPageContainer() {
  const div = document.createElement('div');
  div.className = 'page';
  return div;
}

function showOcrResultModal(text, title = i18n.t('OCR 识别结果')) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width:640px">
      <div class="modal-header">
        <div class="modal-title">${escapeHtml(title)}</div>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <textarea class="textarea" id="ocr-result-text" readonly style="width:100%; min-height:220px; font-family:'Cascadia Code','Consolas',monospace; line-height:1.6;">${escapeHtml(text)}</textarea>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="ocr-copy"><i class="ph ph-copy"></i> ${i18n.t('复制文本')}</button>
        <button class="btn" id="ocr-close"><i class="ph ph-x"></i> ${i18n.t('关闭')}</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const textarea = overlay.querySelector('#ocr-result-text');
  overlay.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
  overlay.querySelector('#ocr-close').addEventListener('click', () => overlay.remove());
  overlay.querySelector('#ocr-copy').addEventListener('click', async () => {
    await window.electronAPI.copyToClipboard(textarea.value);
    const btn = overlay.querySelector('#ocr-copy');
    const original = btn.innerHTML;
    btn.innerHTML = '<i class="ph ph-check"></i> ' + i18n.t('已复制');
    setTimeout(() => btn.innerHTML = original, 1500);
  });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

function showToast(message, duration = 2000) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 200);
  }, duration);
}

// ================= 首页 =================
function renderHome(container) {
  const page = createPageContainer();
  page.innerHTML = `
    <h1 class="page-title">Toolbox</h1>
    <p class="page-desc">${i18n.t('实用 Windows 桌面小工具箱')}</p>
    <div class="card-grid">
      <div class="card" data-nav="screenshot">
        <i class="ph ph-camera card-icon"></i>
        <div class="card-title">${i18n.t('截图')}</div>
        <div class="card-desc">${i18n.t('长截图、OCR、贴图')}</div>
      </div>
      <div class="card" data-nav="clipboard">
        <i class="ph ph-clipboard-text card-icon"></i>
        <div class="card-title">${i18n.t('剪贴板')}</div>
        <div class="card-desc">${i18n.t('历史记录、快捷短语')}</div>
      </div>
      <div class="card" data-nav="password">
        <i class="ph ph-lock-key card-icon"></i>
        <div class="card-title">${i18n.t('密码箱')}</div>
        <div class="card-desc">${i18n.t('本地安全存储账号密码')}</div>
      </div>
      <div class="card" data-nav="memo">
        <i class="ph ph-notebook card-icon"></i>
        <div class="card-title">${i18n.t('备忘录')}</div>
        <div class="card-desc">${i18n.t('临时记录、灵感、便签')}</div>
      </div>
      <div class="card" data-nav="docconvert">
        <i class="ph ph-file-text card-icon"></i>
        <div class="card-title">${i18n.t('文档转换')}</div>
        <div class="card-desc">${i18n.t('Word / Excel / PDF / Markdown 互转')}</div>
      </div>
      <div class="card" data-nav="pdftoolkit">
        <i class="ph ph-file-pdf card-icon"></i>
        <div class="card-title">${i18n.t('PDF 工具箱')}</div>
        <div class="card-desc">${i18n.t('合并、拆分、旋转、水印、提取图片')}</div>
      </div>
      <div class="card" data-nav="encrypt">
        <i class="ph ph-shield card-icon"></i>
        <div class="card-title">${i18n.t('加密传输')}</div>
        <div class="card-desc">${i18n.t('文本对称加密与解密')}</div>
      </div>
      <div class="card" data-nav="devtools">
        <i class="ph ph-code card-icon"></i>
        <div class="card-title">${i18n.t('开发者工具')}</div>
        <div class="card-desc">${i18n.t('JSON、Base64、URL、时间戳、进制')}</div>
      </div>
    </div>
  `;
  page.querySelectorAll('.card[data-nav]').forEach(card => {
    card.addEventListener('click', () => navigateTo(card.dataset.nav));
  });
  container.appendChild(page);
}

// ================= 截图页 =================
function renderScreenshot(container) {
  const page = createPageContainer();
  page.innerHTML = `
    <h1 class="page-title">${i18n.t('截图工具')}</h1>
    <p class="page-desc">${i18n.t('按快捷键或点击按钮开始区域截图，拖拽选择区域后可确认截图或识别文字。')}</p>
    <div class="toolbar">
      <button class="btn" id="btn-capture"><i class="ph ph-camera"></i> ${i18n.t('区域截图')}</button>
      <button class="btn" id="btn-long-screenshot"><i class="ph ph-screenshot"></i> ${i18n.t('长截图')}</button>
      <button class="btn btn-secondary" id="btn-pin"><i class="ph ph-push-pin"></i> ${i18n.t('贴图')}</button>
      <button class="btn btn-secondary" id="btn-ocr"><i class="ph ph-text-t"></i> ${i18n.t('OCR')}</button>
    </div>
    <div id="long-screenshot-status" style="display:none; margin-top:12px; padding:10px 14px; border-radius:8px; background:var(--card-bg); color:var(--text-secondary); font-size:13px"></div>
    <div class="preview-box" id="screenshot-preview">${i18n.t('截图将显示在这里')}</div>
  `;
  container.appendChild(page);

  let currentDataUrl = null;
  const preview = page.querySelector('#screenshot-preview');
  const statusEl = page.querySelector('#long-screenshot-status');

  page.querySelector('#btn-capture').addEventListener('click', async () => {
    await window.electronAPI.captureScreen();
  });

  page.querySelector('#btn-long-screenshot').addEventListener('click', async () => {
    statusEl.style.display = 'block';
    statusEl.style.color = 'var(--text-secondary)';
    statusEl.textContent = i18n.t('请在屏幕上拖拽选择要滚动的区域，开始捕获后按 F9 完成 / F10 取消');
    await window.electronAPI.startLongScreenshot();
  });

  // 监听截图结果
  window.electronAPI.onScreenshotResult((dataUrl) => {
    console.log('Screenshot result received in renderer, length:', dataUrl ? dataUrl.length : 0);
    currentDataUrl = dataUrl;
    preview.innerHTML = `<img src="${dataUrl}" alt="screenshot" style="max-width:100%; max-height:400px;">`;
    console.log('Preview updated');
  });

  // 监听长截图结果
  window.electronAPI.onLongScreenshotResult((dataUrl) => {
    currentDataUrl = dataUrl;
    statusEl.style.display = 'none';
    preview.innerHTML = `
      <div style="color:var(--success); margin-bottom:8px">${i18n.t('长截图完成')}</div>
      <img src="${dataUrl}" alt="long screenshot" style="max-width:100%; max-height:500px;">
    `;
  });

  window.electronAPI.onLongScreenshotError((error) => {
    statusEl.style.display = 'block';
    statusEl.style.color = 'var(--danger)';
    statusEl.textContent = i18n.t('长截图失败：') + error;
  });

  // 对当前已截图的内容进行 OCR
  page.querySelector('#btn-ocr').addEventListener('click', async () => {
    if (!currentDataUrl) {
      showOcrResultModal(i18n.t('请先截取一张图片'), i18n.t('提示'));
      return;
    }
    const btn = page.querySelector('#btn-ocr');
    const originalHtml = btn.innerHTML;
    btn.innerHTML = '<i class="ph ph-spinner"></i> ' + i18n.t('识别中...');
    btn.disabled = true;
    try {
      const result = await window.electronAPI.recognizeOcr(currentDataUrl);
      if (result && result.success) {
        showOcrResultModal(result.text || i18n.t('（未识别到文字）'));
      } else {
        showOcrResultModal(result && result.error ? i18n.t('识别失败：') + result.error : i18n.t('识别失败'), i18n.t('OCR 识别失败'));
      }
    } catch (err) {
      showOcrResultModal(i18n.t('识别失败：') + err.message, i18n.t('OCR 识别失败'));
    } finally {
      btn.innerHTML = originalHtml;
      btn.disabled = false;
    }
  });
}

// ================= 剪贴板页 =================
function renderClipboard(container) {
  const page = createPageContainer();
  page.innerHTML = `
    <h1 class="page-title">${i18n.t('剪贴板')}</h1>
    <p class="page-desc">${i18n.t('历史记录与快捷短语管理。')}</p>
    <div class="tabs">
      <button class="tab active" data-tab="history">${i18n.t('历史记录')}</button>
      <button class="tab" data-tab="snippets">${i18n.t('快捷短语')}</button>
    </div>
    <div class="tab-content active" id="tab-history">
      <div class="toolbar">
        <span id="clipboard-status" style="display:flex; align-items:center; gap:6px; color:var(--text-secondary); font-size:14px">
          <span style="width:8px; height:8px; border-radius:50%; background:var(--success)"></span> ${i18n.t('正在监听剪贴板')}
        </span>
        <button class="btn btn-danger" id="btn-clear-history"><i class="ph ph-trash"></i> ${i18n.t('清空历史')}</button>
      </div>
      <div class="list" id="clipboard-list">
        <div class="empty-state">${i18n.t('复制任意文本即可记录到历史')}</div>
      </div>
    </div>
    <div class="tab-content" id="tab-snippets">
      <div class="toolbar">
        <input type="text" class="input" id="snippet-title" placeholder="${i18n.t('标题（可选）')}" style="width:160px">
        <input type="text" class="input" id="snippet-content" placeholder="${i18n.t('内容')}" style="width:260px">
        <button class="btn" id="btn-add-snippet"><i class="ph ph-plus"></i> ${i18n.t('添加')}</button>
      </div>
      <div class="list" id="snippet-list">
        <div class="empty-state">${i18n.t('暂无快捷短语')}</div>
      </div>
    </div>
  `;
  container.appendChild(page);

  // Tab 切换
  page.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      page.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      page.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      page.querySelector(`#tab-${tab.dataset.tab}`).classList.add('active');
    });
  });

  // 历史记录
  async function loadHistory() {
    const history = await window.electronAPI.getClipboardHistory();
    renderList(page.querySelector('#clipboard-list'), history, item => ({
      title: item.content.slice(0, 80),
      subtitle: new Date(item.time).toLocaleString(),
      actions: [
        { text: i18n.t('复制'), icon: 'ph-copy', class: 'btn btn-secondary', onClick: () => window.electronAPI.copyToClipboard(item.content) }
      ]
    }));
  }

  page.querySelector('#btn-clear-history').addEventListener('click', async () => {
    await window.electronAPI.clearClipboardHistory();
    loadHistory();
  });

  window.electronAPI.onClipboardUpdated(() => loadHistory());

  // 快捷短语
  async function loadSnippets() {
    const snippets = await window.electronAPI.getSnippets();
    renderList(page.querySelector('#snippet-list'), snippets, item => ({
      title: item.title,
      subtitle: item.content,
      actions: [
        { text: i18n.t('复制'), icon: 'ph-copy', class: 'btn btn-secondary', onClick: () => window.electronAPI.copyToClipboard(item.content) },
        { text: i18n.t('删除'), icon: 'ph-trash', class: 'btn btn-danger', onClick: async () => { await window.electronAPI.deleteSnippet(item.id); loadSnippets(); } }
      ]
    }));
  }

  page.querySelector('#btn-add-snippet').addEventListener('click', async () => {
    const title = page.querySelector('#snippet-title').value;
    const content = page.querySelector('#snippet-content').value;
    if (!title || !content) return;
    await window.electronAPI.addSnippet({ title, content });
    page.querySelector('#snippet-title').value = '';
    page.querySelector('#snippet-content').value = '';
    loadSnippets();
  });

  loadHistory();
  loadSnippets();
}

// ================= 密码箱页 =================
function renderPassword(container) {
  const page = createPageContainer();
  page.innerHTML = `
    <h1 class="page-title">${i18n.t('密码箱')}</h1>
    <p class="page-desc">${i18n.t('本地安全存储账号密码，数据仅保存在本机。')}</p>
    <div class="toolbar" style="flex-wrap:wrap; gap:8px; margin-bottom:12px">
      <input type="text" class="input" id="vault-title" placeholder="${i18n.t('标题（如 GitHub）')}" style="width:160px">
      <select class="select" id="vault-category" style="width:110px">
        <option value="网站">${i18n.t('网站')}</option>
        <option value="应用">${i18n.t('应用')}</option>
        <option value="邮箱">${i18n.t('邮箱')}</option>
        <option value="银行卡">${i18n.t('银行卡')}</option>
        <option value="其他">${i18n.t('其他')}</option>
      </select>
      <input type="text" class="input" id="vault-account" placeholder="${i18n.t('账号 / 用户名 / 邮箱')}" style="width:200px">
      <input type="text" class="input" id="vault-password" placeholder="${i18n.t('密码')}" style="width:160px">
      <input type="text" class="input" id="vault-url" placeholder="${i18n.t('网址（可选）')}" style="width:200px">
      <input type="text" class="input" id="vault-note" placeholder="${i18n.t('备注（可选）')}" style="width:200px">
      <button class="btn" id="btn-add-vault"><i class="ph ph-plus"></i> ${i18n.t('添加')}</button>
    </div>
    <div class="list" id="vault-list">
      <div class="empty-state">${i18n.t('暂无存储项')}</div>
    </div>
  `;
  container.appendChild(page);

  function showVaultDetail(item) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width:480px">
        <div class="modal-header">
          <div class="modal-title">${escapeHtml(item.title)}</div>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body" style="display:flex; flex-direction:column; gap:14px">
          <div class="vault-detail-row"><span class="vault-detail-label">${i18n.t('分类')}</span><span class="vault-detail-value">${escapeHtml(item.category || '-')}</span></div>
          <div class="vault-detail-row">
            <span class="vault-detail-label">${i18n.t('账号')}</span>
            <div class="vault-detail-value-wrap">
              <span class="vault-detail-value" id="vault-detail-account">${escapeHtml(item.account || '-')}</span>
              ${item.account ? `<button class="btn btn-secondary" id="vault-copy-account" style="padding:4px 10px; font-size:12px"><i class="ph ph-copy"></i> ${i18n.t('复制')}</button>` : ''}
            </div>
          </div>
          <div class="vault-detail-row">
            <span class="vault-detail-label">${i18n.t('密码')}</span>
            <div class="vault-detail-value-wrap">
              <span class="vault-detail-value" id="vault-detail-password" style="font-family:monospace">${'*'.repeat(Math.min(item.password?.length || 0, 16))}</span>
              ${item.password ? `
                <button class="btn btn-secondary" id="vault-toggle-password" style="padding:4px 10px; font-size:12px"><i class="ph ph-eye"></i> ${i18n.t('显示')}</button>
                <button class="btn btn-secondary" id="vault-copy-password" style="padding:4px 10px; font-size:12px"><i class="ph ph-copy"></i> ${i18n.t('复制')}</button>
              ` : ''}
            </div>
          </div>
          ${item.url ? `<div class="vault-detail-row"><span class="vault-detail-label">${i18n.t('网址')}</span><a class="vault-detail-value" href="${escapeHtml(item.url)}" target="_blank" rel="noopener" style="color:var(--accent); text-decoration:underline">${escapeHtml(item.url)}</a></div>` : ''}
          ${item.note ? `<div class="vault-detail-row"><span class="vault-detail-label">${i18n.t('备注')}</span><span class="vault-detail-value" style="white-space:pre-wrap">${escapeHtml(item.note)}</span></div>` : ''}
        </div>
        <div class="modal-footer">
          <button class="btn btn-danger" id="vault-detail-delete"><i class="ph ph-trash"></i> ${i18n.t('删除')}</button>
          <button class="btn btn-secondary" id="vault-detail-close"><i class="ph ph-x"></i> ${i18n.t('关闭')}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    let passwordVisible = false;
    const accountEl = overlay.querySelector('#vault-detail-account');
    const passwordEl = overlay.querySelector('#vault-detail-password');

    overlay.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#vault-detail-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    const copyAccountBtn = overlay.querySelector('#vault-copy-account');
    if (copyAccountBtn) {
      copyAccountBtn.addEventListener('click', () => window.electronAPI.copyToClipboard(item.account));
    }

    const togglePasswordBtn = overlay.querySelector('#vault-toggle-password');
    if (togglePasswordBtn && passwordEl) {
      togglePasswordBtn.addEventListener('click', () => {
        passwordVisible = !passwordVisible;
        passwordEl.textContent = passwordVisible ? item.password : '*'.repeat(Math.min(item.password.length, 16));
        togglePasswordBtn.innerHTML = passwordVisible
          ? '<i class="ph ph-eye-slash"></i> ' + i18n.t('隐藏')
          : '<i class="ph ph-eye"></i> ' + i18n.t('显示');
      });
    }

    const copyPasswordBtn = overlay.querySelector('#vault-copy-password');
    if (copyPasswordBtn) {
      copyPasswordBtn.addEventListener('click', () => window.electronAPI.copyToClipboard(item.password));
    }

    overlay.querySelector('#vault-detail-delete').addEventListener('click', async () => {
      if (!confirm(i18n.t('确定删除该密码项？'))) return;
      await window.electronAPI.deleteVaultItem(item.id);
      overlay.remove();
      loadVault();
    });
  }

  async function loadVault() {
    const items = await window.electronAPI.getVaultItems();
    renderList(page.querySelector('#vault-list'), items, item => ({
      class: 'list-item-clickable',
      title: item.title,
      subtitle: `${item.category} · ${item.account ? maskText(item.account) : i18n.t('无账号')} · ${'*'.repeat(Math.min(item.password?.length || 0, 16))}`,
      onClick: () => showVaultDetail(item),
      actions: [
        { text: i18n.t('账号'), icon: 'ph-copy', class: 'btn btn-secondary', onClick: () => item.account && window.electronAPI.copyToClipboard(item.account) },
        { text: i18n.t('密码'), icon: 'ph-copy', class: 'btn btn-secondary', onClick: () => item.password && window.electronAPI.copyToClipboard(item.password) },
        { text: i18n.t('删除'), icon: 'ph-trash', class: 'btn btn-danger', onClick: async () => { await window.electronAPI.deleteVaultItem(item.id); loadVault(); } }
      ]
    }));
  }

  page.querySelector('#btn-add-vault').addEventListener('click', async () => {
    const title = page.querySelector('#vault-title').value.trim();
    const category = page.querySelector('#vault-category').value;
    const account = page.querySelector('#vault-account').value.trim();
    const password = page.querySelector('#vault-password').value.trim();
    const url = page.querySelector('#vault-url').value.trim();
    const note = page.querySelector('#vault-note').value.trim();

    if (!title || (!account && !password)) return;

    await window.electronAPI.addVaultItem({ title, category, account, password, url, note });

    page.querySelector('#vault-title').value = '';
    page.querySelector('#vault-account').value = '';
    page.querySelector('#vault-password').value = '';
    page.querySelector('#vault-url').value = '';
    page.querySelector('#vault-note').value = '';
    loadVault();
  });

  loadVault();
}

function maskText(text) {
  if (!text) return '';
  if (text.length <= 6) return '*'.repeat(text.length);
  return text.slice(0, 2) + '*'.repeat(text.length - 4) + text.slice(-2);
}

// ================= 备忘录页 =================
function renderMemo(container) {
  const page = createPageContainer();
  page.innerHTML = `
    <h1 class="page-title">${i18n.t('备忘录')}</h1>
    <p class="page-desc">${i18n.t('所见即所得备忘录，支持文字格式与图片。')}</p>
    <div class="toolbar" style="margin-bottom:12px">
      <button class="btn" id="btn-new-memo"><i class="ph ph-plus"></i> ${i18n.t('新建备忘录')}</button>
    </div>
    <div class="list" id="memo-list">
      <div class="empty-state">${i18n.t('暂无备忘录')}</div>
    </div>
  `;
  container.appendChild(page);

  async function loadMemos() {
    const items = await window.electronAPI.getMemos();
    renderList(page.querySelector('#memo-list'), items, item => ({
      class: 'list-item-clickable',
      title: item.title || i18n.t('无标题'),
      subtitle: formatTime(item.time) + (item.content ? ' · ' + truncate(stripHtml(item.content), 80) : ''),
      onClick: () => showMemoDetail(item),
      actions: [
        { text: i18n.t('删除'), icon: 'ph-trash', class: 'btn btn-danger', onClick: async () => {
          if (confirm(i18n.t('确定要删除这条备忘录吗？'))) {
            await window.electronAPI.deleteMemo(item.id);
            loadMemos();
          }
        } }
      ]
    }));
  }

  function showMemoDetail(item) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">${escapeHtml(item.title || i18n.t('无标题'))}</div>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="memo-content-body">${item.content || ''}</div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="btn-copy-memo"><i class="ph ph-copy"></i> ${i18n.t('复制原文')}</button>
          <button class="btn" id="btn-close-memo"><i class="ph ph-x"></i> ${i18n.t('关闭')}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    overlay.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#btn-close-memo').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#btn-copy-memo').addEventListener('click', () => {
      window.electronAPI.copyToClipboard(item.content);
    });
  }

  function showAddMemoModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width:700px; max-height:85vh">
        <div class="modal-header">
          <div class="modal-title">${i18n.t('新建备忘录')}</div>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <input type="text" class="input" id="modal-memo-title" placeholder="${i18n.t('标题（可选）')}" style="width:100%; margin-bottom:12px">
          <div class="wysiwyg-toolbar">
            <button class="btn btn-secondary btn-sm" data-cmd="bold" title="${i18n.t('加粗')}"><i class="ph ph-text-b"></i></button>
            <button class="btn btn-secondary btn-sm" data-cmd="italic" title="${i18n.t('斜体')}"><i class="ph ph-text-italic"></i></button>
            <button class="btn btn-secondary btn-sm" data-cmd="formatBlock" data-value="H2" title="${i18n.t('标题')}"><i class="ph ph-text-h"></i></button>
            <button class="btn btn-secondary btn-sm" data-cmd="insertUnorderedList" title="${i18n.t('列表')}"><i class="ph ph-list-bullets"></i></button>
            <button class="btn btn-secondary btn-sm" id="btn-upload-image" title="${i18n.t('插入图片')}"><i class="ph ph-image"></i></button>
            <button class="btn btn-secondary btn-sm" data-cmd="removeFormat" title="${i18n.t('清除格式')}"><i class="ph ph-eraser"></i></button>
          </div>
          <div class="wysiwyg-editor" id="modal-memo-editor" contenteditable="true" placeholder="${i18n.t('输入内容...')}"></div>
          <input type="file" id="modal-memo-image" accept="image/*" style="display:none">
        </div>
        <div class="modal-footer" style="justify-content:space-between">
          <span style="color:var(--text-secondary); font-size:13px">${i18n.t('支持 Ctrl+B / Ctrl+I 快捷键')}</span>
          <div style="display:flex; gap:8px">
            <button class="btn btn-secondary" id="btn-cancel-memo"><i class="ph ph-x"></i> ${i18n.t('取消')}</button>
            <button class="btn" id="btn-save-memo"><i class="ph ph-floppy-disk"></i> ${i18n.t('保存')}</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const titleInput = overlay.querySelector('#modal-memo-title');
    const editor = overlay.querySelector('#modal-memo-editor');
    const imageInput = overlay.querySelector('#modal-memo-image');

    overlay.querySelectorAll('.wysiwyg-toolbar [data-cmd]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const cmd = btn.dataset.cmd;
        const value = btn.dataset.value || null;
        document.execCommand(cmd, false, value);
        editor.focus();
      });
    });

    overlay.querySelector('#btn-upload-image').addEventListener('click', () => imageInput.click());

    imageInput.addEventListener('change', () => {
      const file = imageInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        editor.focus();
        document.execCommand('insertImage', false, reader.result);
      };
      reader.readAsDataURL(file);
      imageInput.value = '';
    });

    overlay.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#btn-cancel-memo').addEventListener('click', () => overlay.remove());

    overlay.querySelector('#btn-save-memo').addEventListener('click', async () => {
      const title = titleInput.value.trim();
      const content = editor.innerHTML.trim();
      if (!content || content === '<br>' || content === '<div><br></div>') return;

      await window.electronAPI.addMemo({ title, content, time: Date.now() });
      overlay.remove();
      loadMemos();
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    titleInput.focus();
  }

  page.querySelector('#btn-new-memo').addEventListener('click', showAddMemoModal);

  loadMemos();
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const locale = i18n.getLocale();
  const timeStr = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  if (isToday) return i18n.t('今天') + ' ' + timeStr;
  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' }) + ' ' + timeStr;
}

function truncate(text, max) {
  if (!text) return '';
  return text.length > max ? text.slice(0, max) + '...' : text;
}

function stripHtml(html) {
  if (!html) return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  let text = div.textContent || div.innerText || '';
  return text.replace(/\s+/g, ' ').trim();
}

// ================= 图片批量处理页 =================
function renderImageBatch(container) {
  const page = createPageContainer();
  page.innerHTML = `
    <h1 class="page-title">${i18n.t('图片批量处理')}</h1>
    <p class="page-desc">${i18n.t('批量压缩、转格式、改尺寸。支持 JPG / PNG / WebP / GIF / BMP / TIFF。')}</p>

    <div class="card" style="margin-bottom:16px">
      <div class="toolbar">
        <button class="btn" id="btn-select-files"><i class="ph ph-images"></i> ${i18n.t('选择图片文件')}</button>
        <button class="btn btn-secondary" id="btn-select-folder"><i class="ph ph-folder"></i> ${i18n.t('选择文件夹')}</button>
        <button class="btn btn-danger" id="btn-clear-files" disabled><i class="ph ph-trash"></i> ${i18n.t('清空')}</button>
        <span id="file-count" style="margin-left:auto; color:var(--text-secondary); font-size:14px">${i18n.t('已选择 {0} 张图片', 0)}</span>
      </div>
      <div class="image-drop-zone" id="drop-zone">
        <div class="empty-state" id="drop-placeholder">${i18n.t('拖拽图片或文件夹到此处，或点击上方按钮选择')}</div>
        <div class="image-file-list" id="file-list"></div>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px">
      <div class="form-grid">
        <div class="form-field">
          <label>${i18n.t('输出格式')}</label>
          <select class="select" id="output-format" style="width:100%">
            <option value="original">${i18n.t('保持原格式')}</option>
            <option value="jpeg">JPEG</option>
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
          </select>
        </div>
        <div class="form-field">
          <label>${i18n.t('输出质量')} <span id="quality-value" style="color:var(--text-secondary)">80</span>%</label>
          <input type="range" class="input-range" id="quality" min="1" max="100" value="80">
        </div>
        <div class="form-field">
          <label>${i18n.t('宽度（px，0 为不调整）')}</label>
          <input type="number" class="input" id="resize-width" value="0" min="0" style="width:100%">
        </div>
        <div class="form-field">
          <label>${i18n.t('高度（px，0 为不调整）')}</label>
          <input type="number" class="input" id="resize-height" value="0" min="0" style="width:100%">
        </div>
      </div>
      <div style="margin-top:12px; display:flex; align-items:center; gap:16px; flex-wrap:wrap">
        <label style="display:flex; align-items:center; gap:6px; cursor:pointer">
          <input type="checkbox" id="keep-ratio" checked> ${i18n.t('保持宽高比')}
        </label>
      </div>
      <div style="margin-top:12px">
        <label style="display:block; font-size:13px; color:var(--text-secondary); margin-bottom:6px">${i18n.t('输出位置')}</label>
        <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap">
          <label style="display:flex; align-items:center; gap:6px; cursor:pointer">
            <input type="radio" name="output-mode" value="overwrite"> ${i18n.t('覆盖原文件')}
          </label>
          <label style="display:flex; align-items:center; gap:6px; cursor:pointer">
            <input type="radio" name="output-mode" value="subdir" checked> ${i18n.t('输出到子目录')}
          </label>
          <label style="display:flex; align-items:center; gap:6px; cursor:pointer">
            <input type="radio" name="output-mode" value="custom"> ${i18n.t('自定义目录')}
          </label>
          <input type="text" class="input" id="custom-dir" placeholder="${i18n.t('选择自定义输出目录...')}" style="flex:1; min-width:220px" readonly disabled>
          <button class="btn btn-secondary btn-sm" id="btn-select-output-dir" disabled><i class="ph ph-folder-open"></i> ${i18n.t('选择目录')}</button>
        </div>
      </div>
    </div>

    <div class="toolbar">
      <button class="btn" id="btn-start-process" disabled><i class="ph ph-play"></i> ${i18n.t('开始处理')}</button>
      <span id="process-status" style="color:var(--text-secondary); font-size:14px"></span>
    </div>

    <div class="progress-bar" id="progress-bar" style="display:none">
      <div class="progress-fill" id="progress-fill"></div>
    </div>
    <div class="result-box" id="imagebatch-result" style="display:none"></div>
  `;
  container.appendChild(page);

  let filePaths = [];
  let isProcessing = false;

  const fileListEl = page.querySelector('#file-list');
  const dropZone = page.querySelector('#drop-zone');
  const dropPlaceholder = page.querySelector('#drop-placeholder');
  const fileCountEl = page.querySelector('#file-count');
  const btnClear = page.querySelector('#btn-clear-files');
  const btnStart = page.querySelector('#btn-start-process');
  const resultEl = page.querySelector('#imagebatch-result');
  const progressBar = page.querySelector('#progress-bar');
  const progressFill = page.querySelector('#progress-fill');
  const statusEl = page.querySelector('#process-status');

  function updateUI() {
    fileCountEl.textContent = i18n.t('已选择 {0} 张图片', filePaths.length);
    btnClear.disabled = filePaths.length === 0 || isProcessing;
    btnStart.disabled = filePaths.length === 0 || isProcessing;

    if (filePaths.length === 0) {
      dropPlaceholder.style.display = 'block';
      fileListEl.innerHTML = '';
      return;
    }

    dropPlaceholder.style.display = 'none';
    fileListEl.innerHTML = filePaths.map((p, i) => `
      <div class="image-file-item" data-index="${i}">
        <span class="image-file-name" title="${escapeHtml(p)}">${escapeHtml(p.split(/[\\/]/).pop())}</span>
        <button class="btn btn-danger btn-sm" data-remove="${i}"><i class="ph ph-trash"></i> ${i18n.t('删除')}</button>
      </div>
    `).join('');

    fileListEl.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.remove);
        filePaths.splice(idx, 1);
        updateUI();
      });
    });
  }

  async function addFiles(paths) {
    const valid = paths.filter(p => /\.(jpe?g|png|webp|gif|bmp|tiff?)$/i.test(p));
    const newFiles = valid.filter(p => !filePaths.includes(p));
    filePaths.push(...newFiles);
    updateUI();
    if (valid.length === 0 && paths.length > 0) {
      statusEl.textContent = i18n.t('未检测到支持的图片文件');
    } else {
      statusEl.textContent = '';
    }
  }

  page.querySelector('#btn-select-files').addEventListener('click', async () => {
    try {
      statusEl.textContent = '';
      const result = await window.electronAPI.selectImageFiles();
      if (result.error) {
        statusEl.textContent = i18n.t('选择文件失败：') + result.error;
        return;
      }
      if (result.filePaths) await addFiles(result.filePaths);
    } catch (err) {
      console.error('选择文件失败:', err);
      statusEl.textContent = i18n.t('选择文件失败：') + err.message;
    }
  });

  page.querySelector('#btn-select-folder').addEventListener('click', async () => {
    try {
      statusEl.textContent = '';
      const result = await window.electronAPI.selectImageFolder();
      if (result.error) {
        statusEl.textContent = i18n.t('选择文件夹失败：') + result.error;
        return;
      }
      if (result.filePaths) await addFiles(result.filePaths);
    } catch (err) {
      console.error('选择文件夹失败:', err);
      statusEl.textContent = i18n.t('选择文件夹失败：') + err.message;
    }
  });

  page.querySelector('#btn-clear-files').addEventListener('click', () => {
    filePaths = [];
    updateUI();
    resultEl.style.display = 'none';
  });

  page.querySelector('#quality').addEventListener('input', (e) => {
    page.querySelector('#quality-value').textContent = e.target.value;
  });

  const customDirInput = page.querySelector('#custom-dir');
  const btnSelectOutputDir = page.querySelector('#btn-select-output-dir');
  let customDir = '';

  page.querySelectorAll('input[name="output-mode"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const isCustom = radio.value === 'custom' && radio.checked;
      customDirInput.disabled = !isCustom;
      btnSelectOutputDir.disabled = !isCustom;
      if (!isCustom) {
        customDirInput.value = '';
        customDir = '';
      }
    });
  });

  btnSelectOutputDir.addEventListener('click', async () => {
    try {
      const result = await window.electronAPI.selectOutputDir();
      if (result.error) {
        statusEl.textContent = i18n.t('选择目录失败：') + result.error;
        return;
      }
      if (result.filePath) {
        customDir = result.filePath;
        customDirInput.value = result.filePath;
        statusEl.textContent = '';
      }
    } catch (err) {
      console.error('选择目录失败:', err);
      statusEl.textContent = i18n.t('选择目录失败：') + err.message;
    }
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const result = await window.electronAPI.scanDroppedPaths(Array.from(e.dataTransfer.files).map(f => f.path));
    if (result.filePaths) await addFiles(result.filePaths);
  });

  btnStart.addEventListener('click', async () => {
    if (filePaths.length === 0 || isProcessing) return;

    isProcessing = true;
    btnStart.disabled = true;
    btnClear.disabled = true;
    resultEl.style.display = 'none';
    progressBar.style.display = 'block';
    progressFill.style.width = '0%';
    statusEl.textContent = i18n.t('正在处理...');

    const outputMode = page.querySelector('input[name="output-mode"]:checked').value;
    if (outputMode === 'custom' && !customDir) {
      statusEl.textContent = i18n.t('请先选择自定义输出目录');
      isProcessing = false;
      btnStart.disabled = filePaths.length === 0;
      btnClear.disabled = filePaths.length === 0;
      progressBar.style.display = 'none';
      return;
    }

    const options = {
      inputPaths: filePaths,
      format: page.querySelector('#output-format').value,
      quality: parseInt(page.querySelector('#quality').value),
      width: parseInt(page.querySelector('#resize-width').value) || 0,
      height: parseInt(page.querySelector('#resize-height').value) || 0,
      keepRatio: page.querySelector('#keep-ratio').checked,
      outputMode,
      customDir
    };

    await window.electronAPI.processImages(options);
  });

  window.electronAPI.onImageBatchProgress((data) => {
    const pct = data.total > 0 ? Math.round((data.current / data.total) * 100) : 0;
    progressFill.style.width = pct + '%';
    statusEl.textContent = i18n.t('正在处理 {0}/{1}：{2}', data.current, data.total, data.file.split(/[\\/]/).pop());
  });

  window.electronAPI.onImageBatchComplete((data) => {
    isProcessing = false;
    btnStart.disabled = filePaths.length === 0;
    btnClear.disabled = filePaths.length === 0;
    progressBar.style.display = 'none';

    if (data.success) {
      statusEl.textContent = i18n.t('处理完成：成功 {0} 张，失败 {1} 张', data.successCount, data.failedCount);
      resultEl.style.display = 'block';
      resultEl.innerHTML = `
        <div>${i18n.t('输出目录：{0}', escapeHtml(data.outputDir))}</div>
        <div style="margin-top:8px; color:var(--success)">${i18n.t('成功 {0} 张', data.successCount)}</div>
        ${data.failedCount > 0 ? `<div style="margin-top:8px; color:var(--danger)">${i18n.t('失败 {0} 张', data.failedCount)}</div>` : ''}
        ${data.errors && data.errors.length > 0 ? `<div style="margin-top:8px; font-size:13px; color:var(--text-secondary)">${data.errors.map(e => escapeHtml(e)).join('<br>')}</div>` : ''}
      `;
    } else {
      statusEl.textContent = i18n.t('处理失败');
      resultEl.style.display = 'block';
      resultEl.textContent = data.error || i18n.t('未知错误');
    }
  });
}

// ================= 文档转换页 =================
function renderDocConvert(container) {
  const page = createPageContainer();
  page.innerHTML = `
    <h1 class="page-title">${i18n.t('文档转换')}</h1>
    <p class="page-desc">${i18n.t('支持 Markdown、HTML、TXT、Word、Excel、CSV、JSON、PDF 等格式互转，全部本地处理。')}</p>

    <div class="card">
      <div class="toolbar">
        <button class="btn" id="btn-select-doc"><i class="ph ph-file-arrow-up"></i> ${i18n.t('选择文件')}</button>
        <span id="doc-file-info" style="color:var(--text-secondary); font-size:14px">${i18n.t('未选择文件')}</span>
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <div class="form-grid">
        <div class="form-field">
          <label>${i18n.t('源格式')}</label>
          <select class="select" id="source-format" disabled style="width:100%"></select>
        </div>
        <div class="form-field">
          <label>${i18n.t('目标格式')}</label>
          <select class="select" id="target-format" style="width:100%"></select>
        </div>
      </div>
      <div style="margin-top:12px">
        <label style="display:block; font-size:13px; color:var(--text-secondary); margin-bottom:6px">${i18n.t('输出位置')}</label>
        <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap">
          <label style="display:flex; align-items:center; gap:6px; cursor:pointer">
            <input type="radio" name="doc-output-mode" value="same" checked> ${i18n.t('同目录')}
          </label>
          <label style="display:flex; align-items:center; gap:6px; cursor:pointer">
            <input type="radio" name="doc-output-mode" value="custom"> ${i18n.t('自定义目录')}
          </label>
          <input type="text" class="input" id="doc-custom-dir" placeholder="${i18n.t('选择自定义输出目录...')}" style="flex:1; min-width:220px" readonly disabled>
          <button class="btn btn-secondary btn-sm" id="btn-select-doc-output-dir" disabled><i class="ph ph-folder-open"></i> ${i18n.t('选择目录')}</button>
        </div>
      </div>
    </div>

    <div class="toolbar" style="margin-top:16px">
      <button class="btn" id="btn-convert-doc" disabled><i class="ph ph-arrows-left-right"></i> ${i18n.t('开始转换')}</button>
      <span id="doc-status" style="color:var(--text-secondary); font-size:14px"></span>
    </div>

    <div class="result-box" id="doc-result" style="display:none"></div>
  `;
  container.appendChild(page);

  const formatLabels = {
    md: 'Markdown', html: 'HTML', txt: i18n.t('纯文本'), docx: 'Word (.docx)',
    xlsx: 'Excel (.xlsx)', pptx: 'PPT (.pptx)', csv: 'CSV', json: 'JSON',
    pdf: 'PDF', odt: 'ODT', ods: 'ODS', odp: 'ODP', rtf: 'RTF'
  };

  const targetMap = {
    md: ['html', 'txt', 'docx'],
    html: ['md', 'txt', 'docx'],
    txt: ['md', 'html', 'docx'],
    docx: ['html', 'md', 'txt', 'pdf'],
    xlsx: ['csv', 'json', 'txt', 'md', 'html', 'pdf'],
    pptx: ['md', 'html', 'txt', 'pdf'],
    odt: ['pdf'],
    ods: ['pdf'],
    odp: ['pdf'],
    rtf: ['pdf', 'txt', 'html', 'md', 'docx'],
    csv: ['xlsx', 'json'],
    json: ['csv', 'xlsx', 'txt'],
    pdf: ['docx', 'md', 'html', 'txt']
  };

  const extToFormat = {
    md: 'md', markdown: 'md',
    html: 'html', htm: 'html',
    txt: 'txt', text: 'txt',
    doc: 'docx', docx: 'docx',
    xls: 'xlsx', xlsx: 'xlsx',
    ppt: 'pptx', pptx: 'pptx',
    odt: 'odt', ods: 'ods', odp: 'odp',
    rtf: 'rtf',
    csv: 'csv',
    json: 'json',
    pdf: 'pdf'
  };

  let inputPath = '';
  let sourceFormat = '';
  let customDir = '';

  const fileInfoEl = page.querySelector('#doc-file-info');
  const sourceSelect = page.querySelector('#source-format');
  const targetSelect = page.querySelector('#target-format');
  const customDirInput = page.querySelector('#doc-custom-dir');
  const btnSelectOutputDir = page.querySelector('#btn-select-doc-output-dir');
  const btnConvert = page.querySelector('#btn-convert-doc');
  const statusEl = page.querySelector('#doc-status');
  const resultEl = page.querySelector('#doc-result');

  function getExt(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    return ext;
  }

  function updateTargetOptions() {
    targetSelect.innerHTML = '';
    if (!sourceFormat || !targetMap[sourceFormat]) return;
    targetMap[sourceFormat].forEach(fmt => {
      const option = document.createElement('option');
      option.value = fmt;
      option.textContent = formatLabels[fmt] || fmt;
      targetSelect.appendChild(option);
    });
  }

  page.querySelector('#btn-select-doc').addEventListener('click', async () => {
    try {
      statusEl.textContent = '';
      resultEl.style.display = 'none';
      const result = await window.electronAPI.selectDocumentFile();
      if (result.error) {
        statusEl.textContent = i18n.t('选择失败：') + result.error;
        return;
      }
      if (!result.filePath) return;

      inputPath = result.filePath;
      const ext = getExt(inputPath);
      sourceFormat = extToFormat[ext] || '';

      if (!sourceFormat || !targetMap[sourceFormat]) {
        fileInfoEl.textContent = inputPath.split(/[\\/]/).pop() + '（' + i18n.t('不支持的格式') + '）';
        sourceSelect.innerHTML = '';
        targetSelect.innerHTML = '';
        btnConvert.disabled = true;
        sourceFormat = '';
        return;
      }

      fileInfoEl.textContent = inputPath;
      sourceSelect.innerHTML = `<option value="${sourceFormat}">${formatLabels[sourceFormat]}</option>`;
      updateTargetOptions();
      btnConvert.disabled = false;
    } catch (err) {
      console.error('选择文件失败:', err);
      statusEl.textContent = i18n.t('选择文件失败：') + err.message;
    }
  });

  page.querySelectorAll('input[name="doc-output-mode"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const isCustom = radio.value === 'custom' && radio.checked;
      customDirInput.disabled = !isCustom;
      btnSelectOutputDir.disabled = !isCustom;
      if (!isCustom) {
        customDirInput.value = '';
        customDir = '';
      }
    });
  });

  btnSelectOutputDir.addEventListener('click', async () => {
    try {
      const result = await window.electronAPI.selectDocOutputDir();
      if (result.error) {
        statusEl.textContent = i18n.t('选择目录失败：') + result.error;
        return;
      }
      if (result.filePath) {
        customDir = result.filePath;
        customDirInput.value = result.filePath;
        statusEl.textContent = '';
      }
    } catch (err) {
      console.error('选择目录失败:', err);
      statusEl.textContent = i18n.t('选择目录失败：') + err.message;
    }
  });

  btnConvert.addEventListener('click', async () => {
    if (!inputPath || !sourceFormat) return;

    const outputMode = page.querySelector('input[name="doc-output-mode"]:checked').value;
    if (outputMode === 'custom' && !customDir) {
      statusEl.textContent = i18n.t('请先选择自定义输出目录');
      return;
    }

    btnConvert.disabled = true;
    statusEl.textContent = i18n.t('正在转换...');
    resultEl.style.display = 'none';

    try {
      const result = await window.electronAPI.convertDocument({
        inputPath,
        sourceFormat,
        targetFormat: targetSelect.value,
        outputMode,
        customDir
      });

      if (result.error) {
        statusEl.textContent = i18n.t('转换失败');
        resultEl.style.display = 'block';
        resultEl.textContent = result.error;
      } else {
        statusEl.textContent = i18n.t('转换完成');
        resultEl.style.display = 'block';
        resultEl.innerHTML = `
          <div style="color:var(--success)">${i18n.t('转换成功')}</div>
          <div style="margin-top:8px; font-size:13px; color:var(--text-secondary)">${i18n.t('输出文件：{0}', escapeHtml(result.outputPath))}</div>
        `;
      }
    } catch (err) {
      console.error('转换失败:', err);
      statusEl.textContent = i18n.t('转换失败');
      resultEl.style.display = 'block';
      resultEl.textContent = err.message;
    } finally {
      btnConvert.disabled = false;
    }
  });
}

// ================= PDF 工具箱页 =================
function renderPdfToolkit(container) {
  const page = createPageContainer();
  page.innerHTML = `
    <h1 class="page-title">${i18n.t('PDF 工具箱')}</h1>
    <p class="page-desc">${i18n.t('PDF 合并、拆分、页面旋转、添加水印、提取图片，全部本地处理。')}</p>

    <div class="tabs">
      <button class="tab active" data-tab="merge"><i class="ph ph-stack"></i> ${i18n.t('合并')}</button>
      <button class="tab" data-tab="split"><i class="ph ph-scissors"></i> ${i18n.t('拆分')}</button>
      <button class="tab" data-tab="rotate"><i class="ph ph-arrows-clockwise"></i> ${i18n.t('旋转')}</button>
      <button class="tab" data-tab="watermark"><i class="ph ph-drop"></i> ${i18n.t('水印')}</button>
      <button class="tab" data-tab="extract"><i class="ph ph-images"></i> ${i18n.t('提取图片')}</button>
    </div>

    <!-- ========== 合并 ========== -->
    <div class="tab-content active" data-content="merge">
      <div class="card">
        <div class="toolbar">
          <button class="btn" id="pdf-merge-select"><i class="ph ph-file-plus"></i> ${i18n.t('选择 PDF 文件')}</button>
          <span id="pdf-merge-count" style="color:var(--text-secondary); font-size:14px">${i18n.t('未选择文件')}</span>
        </div>
        <div id="pdf-merge-list" style="margin-top:12px"></div>
      </div>
      <div class="card" style="margin-top:16px">
        <div class="form-grid">
          <div class="form-field">
            <label>${i18n.t('输出目录')}</label>
            <div style="display:flex; gap:8px; align-items:center">
              <input type="text" class="input" id="pdf-merge-outdir" placeholder="${i18n.t('选择输出目录...')}" readonly style="flex:1">
              <button class="btn btn-secondary btn-sm" id="pdf-merge-browse"><i class="ph ph-folder-open"></i></button>
            </div>
          </div>
          <div class="form-field">
            <label>${i18n.t('输出文件名')}</label>
            <input type="text" class="input" id="pdf-merge-outname" value="merged.pdf" placeholder="merged.pdf">
          </div>
        </div>
      </div>
      <div class="toolbar" style="margin-top:16px">
        <button class="btn" id="pdf-merge-btn" disabled><i class="ph ph-stack"></i> ${i18n.t('合并 PDF')}</button>
        <span id="pdf-merge-status" style="color:var(--text-secondary); font-size:14px"></span>
      </div>
      <div class="result-box" id="pdf-merge-result" style="display:none"></div>
    </div>

    <!-- ========== 拆分 ========== -->
    <div class="tab-content" data-content="split">
      <div class="card">
        <div class="toolbar">
          <button class="btn" id="pdf-split-select"><i class="ph ph-file-arrow-up"></i> ${i18n.t('选择 PDF 文件')}</button>
          <span id="pdf-split-info" style="color:var(--text-secondary); font-size:14px">${i18n.t('未选择文件')}</span>
        </div>
      </div>
      <div class="card" style="margin-top:16px">
        <div class="form-grid">
          <div class="form-field">
            <label>${i18n.t('拆分方式')}</label>
            <select class="select" id="pdf-split-mode" style="width:100%">
              <option value="each_page">${i18n.t('每页拆分为单独 PDF')}</option>
              <option value="ranges">${i18n.t('按页码范围拆分')}</option>
            </select>
          </div>
          <div class="form-field" id="pdf-split-ranges-field" style="display:none">
            <label>${i18n.t('页码范围')}</label>
            <input type="text" class="input" id="pdf-split-ranges" placeholder="1-3,5,7-9">
          </div>
        </div>
        <div style="margin-top:12px">
          <label style="display:block; font-size:13px; color:var(--text-secondary); margin-bottom:6px">${i18n.t('输出位置')}</label>
          <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap">
            <label style="display:flex; align-items:center; gap:6px; cursor:pointer">
              <input type="radio" name="pdf-split-output" value="same" checked> ${i18n.t('同目录')}
            </label>
            <label style="display:flex; align-items:center; gap:6px; cursor:pointer">
              <input type="radio" name="pdf-split-output" value="custom"> ${i18n.t('自定义目录')}
            </label>
            <input type="text" class="input" id="pdf-split-custom-dir" placeholder="${i18n.t('选择目录...')}" readonly disabled style="flex:1; min-width:220px">
            <button class="btn btn-secondary btn-sm" id="pdf-split-browse" disabled><i class="ph ph-folder-open"></i></button>
          </div>
        </div>
      </div>
      <div class="toolbar" style="margin-top:16px">
        <button class="btn" id="pdf-split-btn" disabled><i class="ph ph-scissors"></i> ${i18n.t('拆分 PDF')}</button>
        <span id="pdf-split-status" style="color:var(--text-secondary); font-size:14px"></span>
      </div>
      <div class="result-box" id="pdf-split-result" style="display:none"></div>
    </div>

    <!-- ========== 旋转 ========== -->
    <div class="tab-content" data-content="rotate">
      <div class="card">
        <div class="toolbar">
          <button class="btn" id="pdf-rotate-select"><i class="ph ph-file-arrow-up"></i> ${i18n.t('选择 PDF 文件')}</button>
          <span id="pdf-rotate-info" style="color:var(--text-secondary); font-size:14px">${i18n.t('未选择文件')}</span>
        </div>
      </div>
      <div class="card" style="margin-top:16px">
        <div class="form-grid">
          <div class="form-field">
            <label>${i18n.t('旋转角度')}</label>
            <div style="display:flex; gap:8px">
              <button class="btn btn-sm pdf-angle-btn active" data-angle="90">90°</button>
              <button class="btn btn-sm pdf-angle-btn" data-angle="180">180°</button>
              <button class="btn btn-sm pdf-angle-btn" data-angle="270">270°</button>
            </div>
          </div>
          <div class="form-field">
            <label>${i18n.t('页面范围')}</label>
            <select class="select" id="pdf-rotate-pages" style="width:100%">
              <option value="all">${i18n.t('全部页面')}</option>
              <option value="custom">${i18n.t('指定页面')}</option>
            </select>
          </div>
          <div class="form-field" id="pdf-rotate-custom-field" style="display:none">
            <label>${i18n.t('页码 (逗号分隔)')}</label>
            <input type="text" class="input" id="pdf-rotate-custom-pages" placeholder="1,3,5">
          </div>
        </div>
        <div style="margin-top:12px">
          <label style="display:block; font-size:13px; color:var(--text-secondary); margin-bottom:6px">${i18n.t('输出位置')}</label>
          <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap">
            <label style="display:flex; align-items:center; gap:6px; cursor:pointer">
              <input type="radio" name="pdf-rotate-output" value="same" checked> ${i18n.t('同目录')}
            </label>
            <label style="display:flex; align-items:center; gap:6px; cursor:pointer">
              <input type="radio" name="pdf-rotate-output" value="custom"> ${i18n.t('自定义目录')}
            </label>
            <input type="text" class="input" id="pdf-rotate-custom-dir" placeholder="${i18n.t('选择目录...')}" readonly disabled style="flex:1; min-width:220px">
            <button class="btn btn-secondary btn-sm" id="pdf-rotate-browse" disabled><i class="ph ph-folder-open"></i></button>
          </div>
        </div>
      </div>
      <div class="toolbar" style="margin-top:16px">
        <button class="btn" id="pdf-rotate-btn" disabled><i class="ph ph-arrows-clockwise"></i> ${i18n.t('旋转页面')}</button>
        <span id="pdf-rotate-status" style="color:var(--text-secondary); font-size:14px"></span>
      </div>
      <div class="result-box" id="pdf-rotate-result" style="display:none"></div>
    </div>

    <!-- ========== 水印 ========== -->
    <div class="tab-content" data-content="watermark">
      <div class="card">
        <div class="toolbar">
          <button class="btn" id="pdf-wm-select"><i class="ph ph-file-arrow-up"></i> ${i18n.t('选择 PDF 文件')}</button>
          <span id="pdf-wm-info" style="color:var(--text-secondary); font-size:14px">${i18n.t('未选择文件')}</span>
        </div>
      </div>
      <div class="card" style="margin-top:16px">
        <div class="form-grid">
          <div class="form-field" style="grid-column:1/-1">
            <label>${i18n.t('水印文字')}</label>
            <input type="text" class="input" id="pdf-wm-text" placeholder="${i18n.t('请输入水印内容...')}" value="CONFIDENTIAL">
          </div>
          <div class="form-field">
            <label>${i18n.t('字体大小')}: <span id="pdf-wm-size-val">50</span>px</label>
            <input type="range" class="input-range" id="pdf-wm-size" min="10" max="120" value="50" step="2">
          </div>
          <div class="form-field">
            <label>${i18n.t('透明度')}: <span id="pdf-wm-opacity-val">15</span>%</label>
            <input type="range" class="input-range" id="pdf-wm-opacity" min="5" max="80" value="15" step="5">
          </div>
          <div class="form-field">
            <label>${i18n.t('旋转角度')}: <span id="pdf-wm-rotation-val">45</span>°</label>
            <input type="range" class="input-range" id="pdf-wm-rotation" min="0" max="360" value="45" step="5">
          </div>
        </div>
        <div style="margin-top:12px">
          <label style="display:block; font-size:13px; color:var(--text-secondary); margin-bottom:6px">${i18n.t('输出位置')}</label>
          <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap">
            <label style="display:flex; align-items:center; gap:6px; cursor:pointer">
              <input type="radio" name="pdf-wm-output" value="same" checked> ${i18n.t('同目录')}
            </label>
            <label style="display:flex; align-items:center; gap:6px; cursor:pointer">
              <input type="radio" name="pdf-wm-output" value="custom"> ${i18n.t('自定义目录')}
            </label>
            <input type="text" class="input" id="pdf-wm-custom-dir" placeholder="${i18n.t('选择目录...')}" readonly disabled style="flex:1; min-width:220px">
            <button class="btn btn-secondary btn-sm" id="pdf-wm-browse" disabled><i class="ph ph-folder-open"></i></button>
          </div>
        </div>
      </div>
      <div class="toolbar" style="margin-top:16px">
        <button class="btn" id="pdf-wm-btn" disabled><i class="ph ph-drop"></i> ${i18n.t('添加水印')}</button>
        <span id="pdf-wm-status" style="color:var(--text-secondary); font-size:14px"></span>
      </div>
      <div class="result-box" id="pdf-wm-result" style="display:none"></div>
    </div>

    <!-- ========== 提取图片 ========== -->
    <div class="tab-content" data-content="extract">
      <div class="card">
        <div class="toolbar">
          <button class="btn" id="pdf-ext-select"><i class="ph ph-file-arrow-up"></i> ${i18n.t('选择 PDF 文件')}</button>
          <span id="pdf-ext-info" style="color:var(--text-secondary); font-size:14px">${i18n.t('未选择文件')}</span>
        </div>
      </div>
      <div class="card" style="margin-top:16px">
        <div style="margin-top:12px">
          <label style="display:block; font-size:13px; color:var(--text-secondary); margin-bottom:6px">${i18n.t('输出位置')}</label>
          <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap">
            <label style="display:flex; align-items:center; gap:6px; cursor:pointer">
              <input type="radio" name="pdf-ext-output" value="same" checked> ${i18n.t('同目录')}
            </label>
            <label style="display:flex; align-items:center; gap:6px; cursor:pointer">
              <input type="radio" name="pdf-ext-output" value="custom"> ${i18n.t('自定义目录')}
            </label>
            <input type="text" class="input" id="pdf-ext-custom-dir" placeholder="${i18n.t('选择目录...')}" readonly disabled style="flex:1; min-width:220px">
            <button class="btn btn-secondary btn-sm" id="pdf-ext-browse" disabled><i class="ph ph-folder-open"></i></button>
          </div>
        </div>
      </div>
      <div class="toolbar" style="margin-top:16px">
        <button class="btn" id="pdf-ext-btn" disabled><i class="ph ph-images"></i> ${i18n.t('提取图片')}</button>
        <span id="pdf-ext-status" style="color:var(--text-secondary); font-size:14px"></span>
      </div>
      <div class="result-box" id="pdf-ext-result" style="display:none"></div>
    </div>
  `;
  container.appendChild(page);

  // ---- helpers ----
  function getDirName(p) {
    const sep = Math.max(p.lastIndexOf('/'), p.lastIndexOf('\\'));
    return sep >= 0 ? p.substring(0, sep) : '';
  }
  function getBaseName(p) {
    const sep = Math.max(p.lastIndexOf('/'), p.lastIndexOf('\\'));
    const fn = sep >= 0 ? p.substring(sep + 1) : p;
    const dot = fn.lastIndexOf('.');
    return dot > 0 ? fn.substring(0, dot) : fn;
  }
  function joinPath(dir, name) {
    if (!dir) return name;
    const sep = dir.includes('/') && !dir.includes('\\') ? '/' : '\\';
    return dir + (dir.endsWith(sep) ? '' : sep) + name;
  }
  function getOutputDir(inputPath, mode, customDir) {
    return (mode === 'custom' && customDir) ? customDir : getDirName(inputPath);
  }
  function fmtSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
  async function loadPdfInfo(inputPath, infoEl, btnEl) {
    try {
      const result = await window.electronAPI.pdfToolkit('info', [inputPath]);
      if (result.error) {
        infoEl.textContent = i18n.t('读取失败: ') + result.error;
        if (btnEl) btnEl.disabled = true;
        return null;
      }
      const shortName = inputPath.split(/[\\/]/).pop();
      infoEl.innerHTML = escapeHtml(shortName) +
        ' · ' + i18n.t('{0} 页', result.page_count) + ' · ' + fmtSize(result.file_size);
      if (btnEl) btnEl.disabled = false;
      return result;
    } catch (err) {
      infoEl.textContent = i18n.t('读取失败: ') + err.message;
      if (btnEl) btnEl.disabled = true;
      return null;
    }
  }

  // ---- tab switching ----
  page.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      page.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      page.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      page.querySelector('[data-content="' + target + '"]').classList.add('active');
    });
  });

  // ---- output dir radios (shared logic) ----
  function setupOutputDirRadios(pageEl, namePrefix) {
    const radios = pageEl.querySelectorAll('input[name="' + namePrefix + '"]');
    const customInput = pageEl.querySelector('#' + namePrefix.replace('-output', '-custom-dir'));
    const browseBtn = pageEl.querySelector('#' + namePrefix.replace('-output', '-browse'));
    let customDir = '';
    radios.forEach(radio => {
      radio.addEventListener('change', () => {
        const isCustom = radio.value === 'custom' && radio.checked;
        if (customInput) customInput.disabled = !isCustom;
        if (browseBtn) browseBtn.disabled = !isCustom;
        if (!isCustom) { customInput.value = ''; customDir = ''; }
      });
    });
    if (browseBtn) {
      browseBtn.addEventListener('click', async () => {
        const result = await window.electronAPI.selectOutputDir();
        if (result.error) { customInput.value = i18n.t('选择失败'); return; }
        if (result.filePath) {
          customDir = result.filePath;
          customInput.value = result.filePath;
        }
      });
    }
    return {
      getMode: () => pageEl.querySelector('input[name="' + namePrefix + '"]:checked').value,
      getCustomDir: () => customDir,
    };
  }

  // ==================== 合并 ====================
  let mergeFiles = [];
  const mergeList = page.querySelector('#pdf-merge-list');
  const mergeCount = page.querySelector('#pdf-merge-count');
  const mergeBtn = page.querySelector('#pdf-merge-btn');
  const mergeStatus = page.querySelector('#pdf-merge-status');
  const mergeResult = page.querySelector('#pdf-merge-result');
  let mergeOutDir = '';

  page.querySelector('#pdf-merge-select').addEventListener('click', async () => {
    const result = await window.electronAPI.selectPdfFiles();
    if (result.error || !result.filePaths || result.filePaths.length === 0) return;
    mergeFiles = mergeFiles.concat(result.filePaths.filter(f => !mergeFiles.includes(f)));
    renderMergeList();
  });

  page.querySelector('#pdf-merge-browse').addEventListener('click', async () => {
    const result = await window.electronAPI.selectOutputDir();
    if (result.filePath) {
      mergeOutDir = result.filePath;
      page.querySelector('#pdf-merge-outdir').value = result.filePath;
    }
  });

  function renderMergeList() {
    if (mergeFiles.length === 0) {
      mergeCount.textContent = i18n.t('未选择文件');
      mergeList.innerHTML = '';
      mergeBtn.disabled = true;
      return;
    }
    mergeCount.textContent = i18n.t('{0} 个文件已选', mergeFiles.length);
    mergeBtn.disabled = mergeFiles.length < 2 || !mergeOutDir;
    mergeList.innerHTML = mergeFiles.map((f, i) => {
      const name = f.split(/[\\/]/).pop();
      return '<div style="display:flex; align-items:center; gap:8px; padding:6px 0; border-bottom:1px solid var(--border)">' +
        '<i class="ph ph-file-pdf" style="color:var(--accent); font-size:18px"></i>' +
        '<span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:13px">' + escapeHtml(name) + '</span>' +
        '<button class="btn btn-secondary btn-sm" data-remove="' + i + '"><i class="ph ph-x"></i></button>' +
        '</div>';
    }).join('');
    mergeList.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        mergeFiles.splice(parseInt(btn.dataset.remove), 1);
        renderMergeList();
      });
    });
  }

  mergeBtn.addEventListener('click', async () => {
    if (mergeFiles.length < 2) return;
    let outName = page.querySelector('#pdf-merge-outname').value.trim() || 'merged.pdf';
    if (!outName.endsWith('.pdf')) outName += '.pdf';
    const outputPath = joinPath(mergeOutDir, outName);
    mergeBtn.disabled = true;
    mergeStatus.textContent = i18n.t('正在合并...');
    mergeResult.style.display = 'none';
    try {
      const result = await window.electronAPI.pdfToolkit('merge', [outputPath, ...mergeFiles]);
      if (result.error) {
        mergeStatus.textContent = i18n.t('合并失败');
        mergeResult.style.display = 'block';
        mergeResult.textContent = result.error;
      } else {
        mergeStatus.textContent = i18n.t('合并完成');
        mergeResult.style.display = 'block';
        mergeResult.innerHTML = '<div style="color:var(--success)">' + i18n.t('合并成功，共 {0} 个文件', result.merged_count) + '</div>' +
          '<div style="margin-top:8px; font-size:13px; color:var(--text-secondary)">' + i18n.t('输出文件: {0}', escapeHtml(result.output_path)) + '</div>';
      }
    } catch (err) {
      mergeStatus.textContent = i18n.t('合并失败');
      mergeResult.style.display = 'block';
      mergeResult.textContent = err.message;
    } finally {
      mergeBtn.disabled = false;
    }
  });

  // monitor merge outdir change
  page.querySelector('#pdf-merge-outdir').addEventListener('change', () => {
    mergeBtn.disabled = mergeFiles.length < 2 || !mergeOutDir;
  });

  // ==================== 拆分 ====================
  let splitFile = '';
  const splitInfo = page.querySelector('#pdf-split-info');
  const splitBtn = page.querySelector('#pdf-split-btn');
  const splitStatus = page.querySelector('#pdf-split-status');
  const splitResult = page.querySelector('#pdf-split-result');
  const splitMode = page.querySelector('#pdf-split-mode');
  const splitRangesField = page.querySelector('#pdf-split-ranges-field');
  const splitOutput = setupOutputDirRadios(page, 'pdf-split-output');

  splitMode.addEventListener('change', () => {
    splitRangesField.style.display = splitMode.value === 'ranges' ? 'flex' : 'none';
  });

  page.querySelector('#pdf-split-select').addEventListener('click', async () => {
    const result = await window.electronAPI.selectPdfFiles();
    if (!result.filePaths || result.filePaths.length === 0) return;
    splitFile = result.filePaths[0];
    await loadPdfInfo(splitFile, splitInfo, splitBtn);
  });

  splitBtn.addEventListener('click', async () => {
    if (!splitFile) return;
    const mode = splitMode.value;
    const param = mode === 'ranges' ? page.querySelector('#pdf-split-ranges').value.trim() : '';
    if (mode === 'ranges' && !param) {
      splitStatus.textContent = i18n.t('请输入页码范围');
      return;
    }
    const outDir = getOutputDir(splitFile, splitOutput.getMode(), splitOutput.getCustomDir());
    if (!outDir) { splitStatus.textContent = i18n.t('无法确定输出目录'); return; }
    splitBtn.disabled = true;
    splitStatus.textContent = i18n.t('正在拆分...');
    splitResult.style.display = 'none';
    try {
      const result = await window.electronAPI.pdfToolkit('split', [splitFile, outDir, mode, param]);
      if (result.error) {
        splitStatus.textContent = i18n.t('拆分失败');
        splitResult.style.display = 'block';
        splitResult.textContent = result.error;
      } else {
        splitStatus.textContent = i18n.t('拆分完成');
        splitResult.style.display = 'block';
        splitResult.innerHTML = '<div style="color:var(--success)">' + i18n.t('成功拆分为 {0} 个文件', result.count) + '</div>' +
          '<div style="margin-top:8px; font-size:13px; color:var(--text-secondary); max-height:200px; overflow-y:auto">' +
          result.files.map(f => escapeHtml(f)).join('<br>') + '</div>';
      }
    } catch (err) {
      splitStatus.textContent = i18n.t('拆分失败');
      splitResult.style.display = 'block';
      splitResult.textContent = err.message;
    } finally {
      splitBtn.disabled = false;
    }
  });

  // ==================== 旋转 ====================
  let rotateFile = '';
  let rotateAngle = 90;
  const rotateInfo = page.querySelector('#pdf-rotate-info');
  const rotateBtn = page.querySelector('#pdf-rotate-btn');
  const rotateStatus = page.querySelector('#pdf-rotate-status');
  const rotateResult = page.querySelector('#pdf-rotate-result');
  const rotatePages = page.querySelector('#pdf-rotate-pages');
  const rotateCustomField = page.querySelector('#pdf-rotate-custom-field');
  const rotateOutput = setupOutputDirRadios(page, 'pdf-rotate-output');

  page.querySelectorAll('.pdf-angle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      page.querySelectorAll('.pdf-angle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      rotateAngle = parseInt(btn.dataset.angle);
    });
  });

  rotatePages.addEventListener('change', () => {
    rotateCustomField.style.display = rotatePages.value === 'custom' ? 'flex' : 'none';
  });

  page.querySelector('#pdf-rotate-select').addEventListener('click', async () => {
    const result = await window.electronAPI.selectPdfFiles();
    if (!result.filePaths || result.filePaths.length === 0) return;
    rotateFile = result.filePaths[0];
    await loadPdfInfo(rotateFile, rotateInfo, rotateBtn);
  });

  rotateBtn.addEventListener('click', async () => {
    if (!rotateFile) return;
    let pageIndices = 'all';
    if (rotatePages.value === 'custom') {
      pageIndices = page.querySelector('#pdf-rotate-custom-pages').value.trim();
      if (!pageIndices) { rotateStatus.textContent = i18n.t('请输入页码'); return; }
    }
    const outDir = getOutputDir(rotateFile, rotateOutput.getMode(), rotateOutput.getCustomDir());
    const outputPath = joinPath(outDir, getBaseName(rotateFile) + '_rotated.pdf');
    rotateBtn.disabled = true;
    rotateStatus.textContent = i18n.t('正在旋转...');
    rotateResult.style.display = 'none';
    try {
      const result = await window.electronAPI.pdfToolkit('rotate', [rotateFile, outputPath, rotateAngle, pageIndices]);
      if (result.error) {
        rotateStatus.textContent = i18n.t('旋转失败');
        rotateResult.style.display = 'block';
        rotateResult.textContent = result.error;
      } else {
        rotateStatus.textContent = i18n.t('旋转完成');
        rotateResult.style.display = 'block';
        rotateResult.innerHTML = '<div style="color:var(--success)">' + i18n.t('旋转成功，共 {0} 页', result.rotated_pages) + '</div>' +
          '<div style="margin-top:8px; font-size:13px; color:var(--text-secondary)">' + i18n.t('输出文件: {0}', escapeHtml(result.output_path)) + '</div>';
      }
    } catch (err) {
      rotateStatus.textContent = i18n.t('旋转失败');
      rotateResult.style.display = 'block';
      rotateResult.textContent = err.message;
    } finally {
      rotateBtn.disabled = false;
    }
  });

  // ==================== 水印 ====================
  let wmFile = '';
  const wmInfo = page.querySelector('#pdf-wm-info');
  const wmBtn = page.querySelector('#pdf-wm-btn');
  const wmStatus = page.querySelector('#pdf-wm-status');
  const wmResult = page.querySelector('#pdf-wm-result');
  const wmOutput = setupOutputDirRadios(page, 'pdf-wm-output');

  // sliders
  page.querySelector('#pdf-wm-size').addEventListener('input', e => {
    page.querySelector('#pdf-wm-size-val').textContent = e.target.value;
  });
  page.querySelector('#pdf-wm-opacity').addEventListener('input', e => {
    page.querySelector('#pdf-wm-opacity-val').textContent = e.target.value + '%';
  });
  page.querySelector('#pdf-wm-rotation').addEventListener('input', e => {
    page.querySelector('#pdf-wm-rotation-val').textContent = e.target.value;
  });

  page.querySelector('#pdf-wm-select').addEventListener('click', async () => {
    const result = await window.electronAPI.selectPdfFiles();
    if (!result.filePaths || result.filePaths.length === 0) return;
    wmFile = result.filePaths[0];
    await loadPdfInfo(wmFile, wmInfo, wmBtn);
  });

  wmBtn.addEventListener('click', async () => {
    if (!wmFile) return;
    const text = page.querySelector('#pdf-wm-text').value.trim();
    if (!text) { wmStatus.textContent = i18n.t('请输入水印文字'); return; }
    const fontSize = parseFloat(page.querySelector('#pdf-wm-size').value);
    const opacity = parseFloat(page.querySelector('#pdf-wm-opacity').value) / 100;
    const rotation = parseInt(page.querySelector('#pdf-wm-rotation').value);
    const outDir = getOutputDir(wmFile, wmOutput.getMode(), wmOutput.getCustomDir());
    const outputPath = joinPath(outDir, getBaseName(wmFile) + '_watermarked.pdf');
    wmBtn.disabled = true;
    wmStatus.textContent = i18n.t('正在添加水印...');
    wmResult.style.display = 'none';
    try {
      const result = await window.electronAPI.pdfToolkit('watermark', [wmFile, outputPath, text, String(fontSize), String(opacity), String(rotation)]);
      if (result.error) {
        wmStatus.textContent = i18n.t('水印添加失败');
        wmResult.style.display = 'block';
        wmResult.textContent = result.error;
      } else {
        wmStatus.textContent = i18n.t('水印添加完成');
        wmResult.style.display = 'block';
        wmResult.innerHTML = '<div style="color:var(--success)">' + i18n.t('水印添加成功') + '</div>' +
          '<div style="margin-top:8px; font-size:13px; color:var(--text-secondary)">' + i18n.t('输出文件: {0}', escapeHtml(result.output_path)) + '</div>';
      }
    } catch (err) {
      wmStatus.textContent = i18n.t('水印添加失败');
      wmResult.style.display = 'block';
      wmResult.textContent = err.message;
    } finally {
      wmBtn.disabled = false;
    }
  });

  // ==================== 提取图片 ====================
  let extFile = '';
  const extInfo = page.querySelector('#pdf-ext-info');
  const extBtn = page.querySelector('#pdf-ext-btn');
  const extStatus = page.querySelector('#pdf-ext-status');
  const extResult = page.querySelector('#pdf-ext-result');
  const extOutput = setupOutputDirRadios(page, 'pdf-ext-output');

  page.querySelector('#pdf-ext-select').addEventListener('click', async () => {
    const result = await window.electronAPI.selectPdfFiles();
    if (!result.filePaths || result.filePaths.length === 0) return;
    extFile = result.filePaths[0];
    await loadPdfInfo(extFile, extInfo, extBtn);
  });

  extBtn.addEventListener('click', async () => {
    if (!extFile) return;
    let outDir = getOutputDir(extFile, extOutput.getMode(), extOutput.getCustomDir());
    // create a subfolder named after the PDF
    outDir = joinPath(outDir, getBaseName(extFile) + '_images');
    extBtn.disabled = true;
    extStatus.textContent = i18n.t('正在提取图片...');
    extResult.style.display = 'none';
    try {
      const result = await window.electronAPI.pdfToolkit('extract-images', [extFile, outDir]);
      if (result.error) {
        extStatus.textContent = i18n.t('提取失败');
        extResult.style.display = 'block';
        extResult.textContent = result.error;
      } else if (result.count === 0) {
        extStatus.textContent = i18n.t('未找到图片');
        extResult.style.display = 'block';
        extResult.textContent = i18n.t('该 PDF 中没有嵌入的图片。');
      } else {
        extStatus.textContent = i18n.t('提取完成');
        extResult.style.display = 'block';
        extResult.innerHTML = '<div style="color:var(--success)">' + i18n.t('成功提取 {0} 张图片', result.count) + '</div>' +
          '<div style="margin-top:8px; font-size:13px; color:var(--text-secondary); max-height:200px; overflow-y:auto">' +
          result.images.map(f => escapeHtml(f)).join('<br>') + '</div>';
      }
    } catch (err) {
      extStatus.textContent = i18n.t('提取失败');
      extResult.style.display = 'block';
      extResult.textContent = err.message;
    } finally {
      extBtn.disabled = false;
    }
  });
}

// ================= 哈希页 =================
function renderHash(container) {
  const page = createPageContainer();
  page.innerHTML = `
    <h1 class="page-title">${i18n.t('哈希计算')}</h1>
    <p class="page-desc">${i18n.t('计算文本的 MD5 / SHA1 / SHA256。')}</p>
    <input type="text" class="input" id="hash-input" placeholder="${i18n.t('输入文本')}" style="width:100%; max-width:500px; margin-bottom:12px">
    <div class="toolbar">
      <button class="btn" id="btn-md5"><i class="ph ph-hash"></i> ${i18n.t('MD5')}</button>
      <button class="btn" id="btn-sha1"><i class="ph ph-hash"></i> ${i18n.t('SHA1')}</button>
      <button class="btn" id="btn-sha256"><i class="ph ph-hash"></i> ${i18n.t('SHA256')}</button>
    </div>
    <div class="result-box" id="hash-result">${i18n.t('点击按钮计算哈希')}</div>
  `;
  container.appendChild(page);

  const input = page.querySelector('#hash-input');
  const result = page.querySelector('#hash-result');

  page.querySelector('#btn-md5').addEventListener('click', async () => {
    result.textContent = await window.electronAPI.hashText(input.value, 'md5');
  });
  page.querySelector('#btn-sha1').addEventListener('click', async () => {
    result.textContent = await window.electronAPI.hashText(input.value, 'sha1');
  });
  page.querySelector('#btn-sha256').addEventListener('click', async () => {
    result.textContent = await window.electronAPI.hashText(input.value, 'sha256');
  });
}

// ================= 加密传输页 =================
function renderEncryptTransmission(container) {
  const page = createPageContainer();
  page.innerHTML = `
    <h1 class="page-title">${i18n.t('加密传输')}</h1>
    <p class="page-desc">${i18n.t('输入文本，选择加密方法与密码进行加解密。输出为纯乱码 Base64 字符串，解密时自动识别方法。')}</p>

    <div class="card" style="margin-bottom:16px">
      <div class="form-grid" style="margin-bottom:12px">
        <div class="form-field" style="min-width:200px">
          <label>${i18n.t('加密方式')}</label>
          <select class="select" id="encrypt-method" style="width:100%">
            <option value="custom-double-mix">${i18n.t('方法一：双重混淆')}</option>
            <option value="custom-xor-stream">${i18n.t('方法二：异或流混淆')}</option>
            <option value="custom-substitution">${i18n.t('方法三：字节替换表')}</option>
            <option value="custom-rolling-shift">${i18n.t('方法四：滚动移位')}</option>
            <option value="custom-block-scramble">${i18n.t('方法五：块内置换')}</option>
          </select>
        </div>
        <div class="form-field" style="min-width:240px">
          <label>${i18n.t('密码 / 密钥')}</label>
          <div style="display:flex; gap:8px">
            <input type="password" class="input" id="encrypt-password" placeholder="${i18n.t('输入加密密码')}" style="flex:1">
            <button class="btn btn-secondary btn-sm" id="btn-toggle-password" title="${i18n.t('显示/隐藏密码')}"><i class="ph ph-eye"></i></button>
          </div>
        </div>
      </div>
      <div style="display:flex; gap:12px; flex-wrap:wrap; margin-bottom:12px">
        <button class="btn" id="btn-encrypt"><i class="ph ph-lock"></i> ${i18n.t('加密')}</button>
        <button class="btn" id="btn-decrypt"><i class="ph ph-lock-key-open"></i> ${i18n.t('解密')}</button>
        <button class="btn btn-secondary" id="btn-copy-result"><i class="ph ph-copy"></i> ${i18n.t('复制结果')}</button>
        <button class="btn btn-secondary" id="btn-swap"><i class="ph ph-arrows-down-up"></i> ${i18n.t('结果转输入')}</button>
        <button class="btn btn-danger" id="btn-clear-encrypt"><i class="ph ph-trash"></i> ${i18n.t('清空')}</button>
      </div>
      <div style="color:var(--text-secondary); font-size:13px; margin-bottom:12px" id="encrypt-hint">
        ${i18n.t('提示：AES 加密使用 PBKDF2 从密码派生密钥，每次加密随机生成盐值与 IV。')}
      </div>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; align-items:stretch">
      <div class="card" style="display:flex; flex-direction:column">
        <label style="font-size:13px; color:var(--text-secondary); margin-bottom:8px">${i18n.t('原始文本 / 密文')}</label>
        <textarea class="textarea" id="encrypt-input" placeholder="${i18n.t('在此输入要加密或解密的文本...')}" style="flex:1; min-height:220px; font-family:monospace"></textarea>
      </div>
      <div class="card" style="display:flex; flex-direction:column">
        <label style="font-size:13px; color:var(--text-secondary); margin-bottom:8px">${i18n.t('结果')}</label>
        <textarea class="textarea" id="encrypt-output" placeholder="${i18n.t('加密或解密结果将显示在这里...')}" readonly style="flex:1; min-height:220px; font-family:monospace; background:var(--bg-page)"></textarea>
      </div>
    </div>
  `;
  container.appendChild(page);

  const input = page.querySelector('#encrypt-input');
  const output = page.querySelector('#encrypt-output');
  const passwordInput = page.querySelector('#encrypt-password');
  const methodSelect = page.querySelector('#encrypt-method');
  const hint = page.querySelector('#encrypt-hint');
  const togglePasswordBtn = page.querySelector('#btn-toggle-password');

  let passwordVisible = false;
  togglePasswordBtn.addEventListener('click', () => {
    passwordVisible = !passwordVisible;
    passwordInput.type = passwordVisible ? 'text' : 'password';
    togglePasswordBtn.innerHTML = passwordVisible ? '<i class="ph ph-eye-slash"></i>' : '<i class="ph ph-eye"></i>';
  });

  methodSelect.addEventListener('change', () => {
    const method = methodSelect.value;
    passwordInput.disabled = false;
    passwordInput.placeholder = i18n.t('输入加密密码');
    if (method === 'custom-double-mix') {
      hint.textContent = i18n.t('方法一：先对字节做替换表变换，再与伪随机流异或。');
    } else if (method === 'custom-xor-stream') {
      hint.textContent = i18n.t('方法二：将文本字节与由密码+盐生成的伪随机流逐字节异或。');
    } else if (method === 'custom-substitution') {
      hint.textContent = i18n.t('方法三：根据密码生成 256 字节 S-Box，对每字节做替换。');
    } else if (method === 'custom-rolling-shift') {
      hint.textContent = i18n.t('方法四：对每字节叠加伪随机流与位置偏移量，位置不同结果不同。');
    } else if (method === 'custom-block-scramble') {
      hint.textContent = i18n.t('方法五：将数据分块，每块按密码生成的置换表打乱字节顺序。');
    }
  });

  async function doEncrypt() {
    const text = input.value;
    const password = passwordInput.value;
    const method = methodSelect.value;
    output.value = '';

    if (!text) {
      output.value = i18n.t('请输入要加密的文本');
      return;
    }
    if (!password) {
      output.value = i18n.t('请输入密码');
      return;
    }

    try {
      const result = await window.electronAPI.encryptText(text, password, method);
      if (result.success) {
        output.value = result.result;
      } else {
        output.value = i18n.t('加密失败：') + result.error;
      }
    } catch (err) {
      output.value = i18n.t('加密失败：') + err.message;
    }
  }

  async function doDecrypt() {
    const text = input.value;
    const password = passwordInput.value;
    output.value = '';

    if (!text) {
      output.value = i18n.t('请输入要解密的密文');
      return;
    }

    if (!password) {
      output.value = i18n.t('请输入密码');
      return;
    }

    try {
      const result = await window.electronAPI.decryptText(text, password);
      if (result.success) {
        output.value = result.result;
      } else {
        output.value = i18n.t('解密失败：') + result.error;
      }
    } catch (err) {
      output.value = i18n.t('解密失败：') + err.message;
    }
  }

  page.querySelector('#btn-encrypt').addEventListener('click', doEncrypt);
  page.querySelector('#btn-decrypt').addEventListener('click', doDecrypt);

  page.querySelector('#btn-copy-result').addEventListener('click', () => {
    if (!output.value) return;
    window.electronAPI.copyToClipboard(output.value);
  });

  page.querySelector('#btn-swap').addEventListener('click', () => {
    if (!output.value) return;
    input.value = output.value;
    output.value = '';
  });

  page.querySelector('#btn-clear-encrypt').addEventListener('click', () => {
    input.value = '';
    output.value = '';
    passwordInput.value = '';
  });
}

// ================= 开发者工具页 =================
function renderDevTools(container) {
  const page = createPageContainer();
  page.innerHTML = `
    <h1 class="page-title">${i18n.t('开发者工具')}</h1>
    <p class="page-desc">${i18n.t('JSON 格式化、Base64 / URL 编解码、时间戳转换、进制转换等常用开发小工具。')}</p>

    <div class="tabs">
      <button class="tab active" data-tab="json"><i class="ph ph-brackets-curly"></i> JSON</button>
      <button class="tab" data-tab="base64"><i class="ph ph-text-t"></i> Base64</button>
      <button class="tab" data-tab="url"><i class="ph ph-link"></i> URL</button>
      <button class="tab" data-tab="timestamp"><i class="ph ph-clock"></i> ${i18n.t('时间戳')}</button>
      <button class="tab" data-tab="base"><i class="ph ph-number-circle-two"></i> ${i18n.t('进制')}</button>
    </div>

    <div class="tab-content active" id="tab-json">
      <div class="dev-card">
        <div class="dev-card-title"><i class="ph ph-brackets-curly"></i> ${i18n.t('JSON 格式化 / 压缩 / 校验')}</div>
        <textarea class="textarea dev-textarea" id="json-input" placeholder="${i18n.t('在此粘贴 JSON 内容...')}"></textarea>
        <div class="dev-input-row" style="margin-top:12px">
          <button class="btn" id="btn-json-format"><i class="ph ph-text-align-left"></i> ${i18n.t('格式化')}</button>
          <button class="btn btn-secondary" id="btn-json-minify"><i class="ph ph-text-outdent"></i> ${i18n.t('压缩')}</button>
          <button class="btn btn-secondary" id="btn-json-validate"><i class="ph ph-check-circle"></i> ${i18n.t('校验')}</button>
          <button class="btn btn-secondary" id="btn-json-copy"><i class="ph ph-copy"></i> ${i18n.t('复制')}</button>
          <button class="btn btn-danger" id="btn-json-clear"><i class="ph ph-trash"></i> ${i18n.t('清空')}</button>
        </div>
        <div class="dev-result" id="json-result" style="display:none"></div>
      </div>
    </div>

    <div class="tab-content" id="tab-base64">
      <div class="dev-card">
        <div class="dev-card-title"><i class="ph ph-text-t"></i> ${i18n.t('Base64 编解码')}</div>
        <textarea class="textarea dev-textarea" id="base64-input" placeholder="${i18n.t('在此输入文本...')}"></textarea>
        <div class="dev-input-row" style="margin-top:12px">
          <button class="btn" id="btn-base64-encode"><i class="ph ph-lock"></i> ${i18n.t('编码')}</button>
          <button class="btn btn-secondary" id="btn-base64-decode"><i class="ph ph-lock-key-open"></i> ${i18n.t('解码')}</button>
          <button class="btn btn-secondary" id="btn-base64-file"><i class="ph ph-image"></i> ${i18n.t('文件转 Base64')}</button>
          <button class="btn btn-secondary" id="btn-base64-copy"><i class="ph ph-copy"></i> ${i18n.t('复制')}</button>
          <button class="btn btn-danger" id="btn-base64-clear"><i class="ph ph-trash"></i> ${i18n.t('清空')}</button>
        </div>
        <div class="dev-result" id="base64-result" style="display:none"></div>
      </div>
    </div>

    <div class="tab-content" id="tab-url">
      <div class="dev-card">
        <div class="dev-card-title"><i class="ph ph-link"></i> ${i18n.t('URL 编解码')}</div>
        <textarea class="textarea dev-textarea" id="url-input" placeholder="${i18n.t('在此输入 URL 或文本...')}"></textarea>
        <div class="dev-input-row" style="margin-top:12px">
          <button class="btn" id="btn-url-encode"><i class="ph ph-lock"></i> ${i18n.t('编码')}</button>
          <button class="btn btn-secondary" id="btn-url-decode"><i class="ph ph-lock-key-open"></i> ${i18n.t('解码')}</button>
          <button class="btn btn-secondary" id="btn-url-copy"><i class="ph ph-copy"></i> ${i18n.t('复制')}</button>
          <button class="btn btn-danger" id="btn-url-clear"><i class="ph ph-trash"></i> ${i18n.t('清空')}</button>
        </div>
        <div class="dev-result" id="url-result" style="display:none"></div>
      </div>
    </div>

    <div class="tab-content" id="tab-timestamp">
      <div class="dev-card">
        <div class="dev-card-title"><i class="ph ph-clock"></i> ${i18n.t('时间戳与日期互转')}</div>
        <div class="dev-input-row">
          <input type="text" class="input" id="timestamp-input" placeholder="${i18n.t('时间戳或日期字符串')}" style="flex:1; min-width:200px">
          <select class="select" id="timestamp-unit">
            <option value="ms">${i18n.t('毫秒')}</option>
            <option value="s">${i18n.t('秒')}</option>
          </select>
          <button class="btn" id="btn-timestamp-now"><i class="ph ph-clock-clockwise"></i> ${i18n.t('当前时间')}</button>
          <button class="btn btn-secondary" id="btn-timestamp-convert"><i class="ph ph-arrows-left-right"></i> ${i18n.t('转换')}</button>
          <button class="btn btn-secondary" id="btn-timestamp-copy"><i class="ph ph-copy"></i> ${i18n.t('复制')}</button>
        </div>
        <div class="dev-result" id="timestamp-result" style="display:none"></div>
      </div>
    </div>

    <div class="tab-content" id="tab-base">
      <div class="dev-card">
        <div class="dev-card-title"><i class="ph ph-number-circle-two"></i> ${i18n.t('进制转换')}</div>
        <div class="dev-input-row">
          <input type="text" class="input" id="base-input" placeholder="${i18n.t('输入数值')}" style="flex:1; min-width:200px">
          <select class="select" id="base-from">
            <option value="10">${i18n.t('十进制')}</option>
            <option value="2">${i18n.t('二进制')}</option>
            <option value="8">${i18n.t('八进制')}</option>
            <option value="16">${i18n.t('十六进制')}</option>
          </select>
          <span style="color:var(--text-secondary)">→</span>
          <select class="select" id="base-to">
            <option value="2">${i18n.t('二进制')}</option>
            <option value="8">${i18n.t('八进制')}</option>
            <option value="10">${i18n.t('十进制')}</option>
            <option value="16">${i18n.t('十六进制')}</option>
          </select>
          <button class="btn" id="btn-base-convert"><i class="ph ph-arrows-left-right"></i> ${i18n.t('转换')}</button>
          <button class="btn btn-secondary" id="btn-base-copy"><i class="ph ph-copy"></i> ${i18n.t('复制')}</button>
        </div>
        <div class="dev-result" id="base-result" style="display:none"></div>
      </div>
    </div>
  `;
  container.appendChild(page);

  // Tabs
  page.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      page.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      page.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      page.querySelector(`#tab-${tab.dataset.tab}`).classList.add('active');
    });
  });

  function showResult(el, text, isError) {
    el.style.display = 'block';
    el.textContent = text;
    el.classList.toggle('dev-error', isError);
  }

  function copyText(text) {
    if (!text) return;
    window.electronAPI.copyToClipboard(text);
    showToast(i18n.t('已复制到剪贴板'));
  }

  // JSON
  const jsonInput = page.querySelector('#json-input');
  const jsonResult = page.querySelector('#json-result');
  page.querySelector('#btn-json-format').addEventListener('click', () => {
    const text = jsonInput.value.trim();
    if (!text) { showResult(jsonResult, i18n.t('请输入 JSON 内容'), true); return; }
    try {
      const obj = JSON.parse(text);
      showResult(jsonResult, JSON.stringify(obj, null, 2), false);
    } catch (e) {
      showResult(jsonResult, i18n.t('JSON 格式错误：') + e.message, true);
    }
  });
  page.querySelector('#btn-json-minify').addEventListener('click', () => {
    const text = jsonInput.value.trim();
    if (!text) { showResult(jsonResult, i18n.t('请输入 JSON 内容'), true); return; }
    try {
      const obj = JSON.parse(text);
      showResult(jsonResult, JSON.stringify(obj), false);
    } catch (e) {
      showResult(jsonResult, i18n.t('JSON 格式错误：') + e.message, true);
    }
  });
  page.querySelector('#btn-json-validate').addEventListener('click', () => {
    const text = jsonInput.value.trim();
    if (!text) { showResult(jsonResult, i18n.t('请输入 JSON 内容'), true); return; }
    try {
      JSON.parse(text);
      showResult(jsonResult, i18n.t('✓ JSON 格式正确'), false);
    } catch (e) {
      showResult(jsonResult, i18n.t('JSON 格式错误：') + e.message, true);
    }
  });
  page.querySelector('#btn-json-copy').addEventListener('click', () => copyText(jsonResult.textContent));
  page.querySelector('#btn-json-clear').addEventListener('click', () => {
    jsonInput.value = '';
    jsonResult.style.display = 'none';
  });

  // Base64
  const base64Input = page.querySelector('#base64-input');
  const base64Result = page.querySelector('#base64-result');
  page.querySelector('#btn-base64-encode').addEventListener('click', () => {
    const text = base64Input.value;
    try {
      showResult(base64Result, btoa(unescape(encodeURIComponent(text))), false);
    } catch (e) {
      showResult(base64Result, i18n.t('编码失败：') + e.message, true);
    }
  });
  page.querySelector('#btn-base64-decode').addEventListener('click', () => {
    const text = base64Input.value.trim();
    try {
      showResult(base64Result, decodeURIComponent(escape(atob(text))), false);
    } catch (e) {
      showResult(base64Result, i18n.t('解码失败：') + e.message, true);
    }
  });
  page.querySelector('#btn-base64-file').addEventListener('click', async () => {
    const result = await window.electronAPI.selectImageFiles();
    if (result.canceled || result.filePaths.length === 0) return;
    const read = await window.electronAPI.readImageDataUrl(result.filePaths[0]);
    if (!read.success) {
      showResult(base64Result, i18n.t('读取文件失败：') + read.error, true);
      return;
    }
    base64Input.value = read.dataUrl;
    showResult(base64Result, read.dataUrl, false);
  });
  page.querySelector('#btn-base64-copy').addEventListener('click', () => copyText(base64Result.textContent));
  page.querySelector('#btn-base64-clear').addEventListener('click', () => {
    base64Input.value = '';
    base64Result.style.display = 'none';
  });

  // URL
  const urlInput = page.querySelector('#url-input');
  const urlResult = page.querySelector('#url-result');
  page.querySelector('#btn-url-encode').addEventListener('click', () => {
    try {
      showResult(urlResult, encodeURIComponent(urlInput.value), false);
    } catch (e) {
      showResult(urlResult, i18n.t('编码失败：') + e.message, true);
    }
  });
  page.querySelector('#btn-url-decode').addEventListener('click', () => {
    try {
      showResult(urlResult, decodeURIComponent(urlInput.value), false);
    } catch (e) {
      showResult(urlResult, i18n.t('解码失败：') + e.message, true);
    }
  });
  page.querySelector('#btn-url-copy').addEventListener('click', () => copyText(urlResult.textContent));
  page.querySelector('#btn-url-clear').addEventListener('click', () => {
    urlInput.value = '';
    urlResult.style.display = 'none';
  });

  // Timestamp
  const timestampInput = page.querySelector('#timestamp-input');
  const timestampUnit = page.querySelector('#timestamp-unit');
  const timestampResult = page.querySelector('#timestamp-result');
  function convertTimestamp() {
    const value = timestampInput.value.trim();
    if (!value) { showResult(timestampResult, i18n.t('请输入时间戳或日期'), true); return; }

    // 如果是纯数字，按时间戳处理
    if (/^\d+$/.test(value)) {
      let ts = parseInt(value, 10);
      if (timestampUnit.value === 's') ts *= 1000;
      const date = new Date(ts);
      if (isNaN(date.getTime())) {
        showResult(timestampResult, i18n.t('无效的时间戳'), true);
      } else {
        showResult(timestampResult,
          i18n.t('本地时间：{0}', date.toLocaleString()) + '\n' +
          i18n.t('ISO 8601：{0}', date.toISOString()) + '\n' +
          i18n.t('毫秒：{0}', date.getTime()) + '\n' +
          i18n.t('秒：{0}', Math.floor(date.getTime() / 1000)), false);
      }
      return;
    }

    // 否则按日期字符串解析
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      showResult(timestampResult, i18n.t('无法解析日期，请尝试标准格式如 2026-07-03 12:00:00'), true);
    } else {
      showResult(timestampResult,
        i18n.t('本地时间：{0}', date.toLocaleString()) + '\n' +
        i18n.t('ISO 8601：{0}', date.toISOString()) + '\n' +
        i18n.t('毫秒：{0}', date.getTime()) + '\n' +
        i18n.t('秒：{0}', Math.floor(date.getTime() / 1000)), false);
    }
  }
  page.querySelector('#btn-timestamp-convert').addEventListener('click', convertTimestamp);
  page.querySelector('#btn-timestamp-now').addEventListener('click', () => {
    timestampInput.value = Date.now().toString();
    timestampUnit.value = 'ms';
    convertTimestamp();
  });
  page.querySelector('#btn-timestamp-copy').addEventListener('click', () => copyText(timestampResult.textContent));

  // Base conversion
  const baseInput = page.querySelector('#base-input');
  const baseFrom = page.querySelector('#base-from');
  const baseTo = page.querySelector('#base-to');
  const baseResult = page.querySelector('#base-result');
  page.querySelector('#btn-base-convert').addEventListener('click', () => {
    const value = baseInput.value.trim();
    if (!value) { showResult(baseResult, i18n.t('请输入数值'), true); return; }
    try {
      const from = parseInt(baseFrom.value, 10);
      const to = parseInt(baseTo.value, 10);
      const cleaned = value.replace(/\s/g, '').toLowerCase();
      const decimal = parseInt(cleaned, from);
      if (isNaN(decimal)) throw new Error(i18n.t('输入数值与源进制不匹配'));
      const result = decimal.toString(to).toUpperCase();
      showResult(baseResult,
        i18n.t('十进制') + '：' + decimal + '\n' +
        baseFrom.options[baseFrom.selectedIndex].text + '：' + cleaned + '\n' +
        baseTo.options[baseTo.selectedIndex].text + '：' + result, false);
    } catch (e) {
      showResult(baseResult, i18n.t('转换失败：') + e.message, true);
    }
  });
  page.querySelector('#btn-base-copy').addEventListener('click', () => copyText(baseResult.textContent));
}

// ================= 颜色工具页 =================
function renderColor(container) {
  const page = createPageContainer();
  page.innerHTML = `
    <h1 class="page-title">${i18n.t('颜色工具')}</h1>
    <p class="page-desc">${i18n.t('HEX / RGB / HSL 格式互转，点击色块可快速复用。')}</p>
    <div class="toolbar" style="margin-bottom:12px">
      <button class="btn" id="btn-pick-screen-color"><i class="ph ph-eyedropper"></i> ${i18n.t('屏幕取色')}</button>
    </div>
    <div class="card" style="display:flex; gap:24px; align-items:flex-start; flex-wrap:wrap">
      <div class="color-preview-box" id="color-preview" style="background:var(--accent)"></div>
      <div style="flex:1; min-width:260px">
        <div class="form-field" style="margin-bottom:12px">
          <label>HEX</label>
          <div style="display:flex; gap:8px">
            <input type="text" class="input" id="color-hex" value="#3B82F6" style="flex:1; font-family:monospace">
            <button class="btn btn-secondary btn-sm" data-copy="hex"><i class="ph ph-copy"></i> ${i18n.t('复制')}</button>
          </div>
        </div>
        <div class="form-field" style="margin-bottom:12px">
          <label>RGB</label>
          <div style="display:flex; gap:8px">
            <input type="text" class="input" id="color-rgb" value="rgb(59, 130, 246)" style="flex:1; font-family:monospace">
            <button class="btn btn-secondary btn-sm" data-copy="rgb"><i class="ph ph-copy"></i> ${i18n.t('复制')}</button>
          </div>
        </div>
        <div class="form-field">
          <label>HSL</label>
          <div style="display:flex; gap:8px">
            <input type="text" class="input" id="color-hsl" value="hsl(217, 91%, 60%)" style="flex:1; font-family:monospace">
            <button class="btn btn-secondary btn-sm" data-copy="hsl"><i class="ph ph-copy"></i> ${i18n.t('复制')}</button>
          </div>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <div class="toolbar" style="justify-content:space-between; margin-bottom:8px">
        <span style="font-weight:600">${i18n.t('历史记录')}</span>
        <button class="btn btn-danger btn-sm" id="btn-clear-color-history">${i18n.t('清空')}</button>
      </div>
      <div class="color-history" id="color-history">
        <div class="empty-state" style="padding:20px">${i18n.t('暂无历史记录')}</div>
      </div>
    </div>
  `;
  container.appendChild(page);

  const preview = page.querySelector('#color-preview');
  const hexInput = page.querySelector('#color-hex');
  const rgbInput = page.querySelector('#color-rgb');
  const hslInput = page.querySelector('#color-hsl');
  const historyEl = page.querySelector('#color-history');

  let history = [];
  const maxHistory = 20;

  function updatePreview(rgb) {
    preview.style.background = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  }

  function setFromHex(value) {
    const hex = normalizeHex(value);
    if (!hex) return false;
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    hexInput.value = hex;
    rgbInput.value = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    hslInput.value = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    updatePreview(rgb);
    return true;
  }

  function setFromRgb(value) {
    const rgb = parseRgb(value);
    if (!rgb) return false;
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    hexInput.value = hex;
    rgbInput.value = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    hslInput.value = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    updatePreview(rgb);
    return true;
  }

  function setFromHsl(value) {
    const hsl = parseHsl(value);
    if (!hsl) return false;
    const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    hexInput.value = hex;
    rgbInput.value = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    hslInput.value = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    updatePreview(rgb);
    return true;
  }

  function addHistory() {
    const hex = hexInput.value;
    if (!hex || history.includes(hex)) return;
    history.unshift(hex);
    if (history.length > maxHistory) history.pop();
    renderHistory();
  }

  function renderHistory() {
    if (history.length === 0) {
      historyEl.innerHTML = '<div class="empty-state" style="padding:20px">' + i18n.t('暂无历史记录') + '</div>';
      return;
    }
    historyEl.innerHTML = history.map(c => `
      <div class="color-history-item" data-color="${c}" style="background:${c}" title="${c}"></div>
    `).join('');
    historyEl.querySelectorAll('.color-history-item').forEach(item => {
      item.addEventListener('click', () => setFromHex(item.dataset.color));
    });
  }

  hexInput.addEventListener('change', () => { if (setFromHex(hexInput.value)) addHistory(); });
  rgbInput.addEventListener('change', () => { if (setFromRgb(rgbInput.value)) addHistory(); });
  hslInput.addEventListener('change', () => { if (setFromHsl(hslInput.value)) addHistory(); });

  page.querySelectorAll('[data-copy]').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.copy;
      let text = '';
      if (mode === 'hex') text = hexInput.value;
      else if (mode === 'rgb') text = rgbInput.value;
      else if (mode === 'hsl') text = hslInput.value;
      window.electronAPI.copyToClipboard(text);
    });
  });

  page.querySelector('#btn-clear-color-history').addEventListener('click', () => {
    history = [];
    renderHistory();
  });

  page.querySelector('#btn-pick-screen-color').addEventListener('click', () => {
    window.electronAPI.pickScreenColor();
  });

  window.electronAPI.onColorPickResult((data) => {
    if (data.error) {
      alert(i18n.t('取色失败：') + data.error);
      return;
    }
    if (data.hex) {
      setFromHex(data.hex);
      addHistory();
    }
  });

  setFromHex('#3B82F6');
}

// ================= 二维码页 =================
function renderQrCode(container) {
  const page = createPageContainer();
  page.innerHTML = `
    <h1 class="page-title">${i18n.t('二维码')}</h1>
    <p class="page-desc">${i18n.t('生成二维码图片，或从图片、屏幕截图中识别二维码内容。')}</p>

    <div class="tabs">
      <button class="tab active" data-tab="generate"><i class="ph ph-qr-code"></i> ${i18n.t('生成')}</button>
      <button class="tab" data-tab="decode"><i class="ph ph-scan"></i> ${i18n.t('识别')}</button>
    </div>

    <div class="tab-content active" id="tab-generate">
      <div class="toolbar" style="gap:12px; align-items:center; flex-wrap:wrap">
        <input type="text" class="input" id="qr-input" placeholder="${i18n.t('输入文本或链接')}" style="flex:1; min-width:260px; max-width:500px">
        <select class="select" id="qr-size" style="width:110px">
          <option value="200">200 x 200</option>
          <option value="400" selected>400 x 400</option>
          <option value="600">600 x 600</option>
        </select>
        <button class="btn" id="btn-generate-qr"><i class="ph ph-qr-code"></i> ${i18n.t('生成二维码')}</button>
      </div>
      <div class="preview-box" id="qr-preview">
        <span style="color:var(--text-secondary)">${i18n.t('二维码将显示在这里')}</span>
      </div>
      <div class="toolbar" id="qr-actions" style="display:none; gap:12px; align-items:center">
        <button class="btn btn-secondary" id="btn-save-qr"><i class="ph ph-download-simple"></i> ${i18n.t('保存图片')}</button>
        <span id="qr-tip" style="color:var(--text-secondary); font-size:13px"></span>
      </div>
    </div>

    <div class="tab-content" id="tab-decode">
      <div class="toolbar" style="gap:12px; align-items:center; flex-wrap:wrap">
        <button class="btn" id="btn-select-qr-image"><i class="ph ph-image"></i> ${i18n.t('选择图片')}</button>
        <button class="btn btn-secondary" id="btn-paste-qr-image"><i class="ph ph-clipboard"></i> ${i18n.t('从剪贴板粘贴')}</button>
        <button class="btn btn-secondary" id="btn-decode-screen"><i class="ph ph-camera"></i> ${i18n.t('框选屏幕识别')}</button>
      </div>
      <div class="preview-box" id="qr-decode-preview" style="min-height:220px">
        <span style="color:var(--text-secondary)">${i18n.t('选择或粘贴二维码图片')}</span>
      </div>
      <div class="result-box" id="qr-decode-result" style="display:none"></div>
      <div class="toolbar" id="qr-decode-actions" style="display:none; gap:12px; align-items:center">
        <button class="btn btn-secondary" id="btn-copy-qr-result"><i class="ph ph-copy"></i> ${i18n.t('复制结果')}</button>
        <button class="btn btn-secondary" id="btn-use-qr-result"><i class="ph ph-arrow-u-up-left"></i> ${i18n.t('用于生成')}</button>
      </div>
    </div>

    <div class="card" style="margin-top:24px">
      <div class="toolbar" style="justify-content:space-between; margin-bottom:8px">
        <span style="font-weight:600">${i18n.t('历史记录')}</span>
        <button class="btn btn-danger btn-sm" id="btn-clear-qr-history"><i class="ph ph-trash"></i> ${i18n.t('清空')}</button>
      </div>
      <div class="list" id="qr-history-list">
        <div class="empty-state">${i18n.t('暂无历史记录')}</div>
      </div>
    </div>
  `;
  container.appendChild(page);

  // Tabs
  const tabs = page.querySelectorAll('.tab');
  const tabContents = page.querySelectorAll('.tab-content');
  tabs.forEach(t => {
    t.addEventListener('click', () => {
      tabs.forEach(x => x.classList.remove('active'));
      tabContents.forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      page.querySelector(`#tab-${t.dataset.tab}`).classList.add('active');
    });
  });

  // ===== 生成 =====
  const input = page.querySelector('#qr-input');
  const sizeSelect = page.querySelector('#qr-size');
  const preview = page.querySelector('#qr-preview');
  const actions = page.querySelector('#qr-actions');
  const tip = page.querySelector('#qr-tip');
  const historyList = page.querySelector('#qr-history-list');
  let currentDataUrl = null;

  async function loadHistory() {
    const history = await window.electronAPI.getQRHistory();
    if (history.length === 0) {
      historyList.innerHTML = '<div class="empty-state">' + i18n.t('暂无历史记录') + '</div>';
      return;
    }
    historyList.innerHTML = history.map((item, i) => `
      <div class="list-item" data-index="${i}">
        <div class="list-item-content" style="cursor:pointer">
          <div class="list-item-title">${escapeHtml(item.text)}</div>
          <div class="list-item-subtitle">${new Date(item.time).toLocaleString()}</div>
        </div>
        <button class="btn btn-secondary btn-sm" data-use="${i}"><i class="ph ph-arrow-u-up-left"></i> ${i18n.t('使用')}</button>
      </div>
    `).join('');

    historyList.querySelectorAll('.list-item-content').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.closest('.list-item').dataset.index);
        input.value = history[idx].text;
        generate();
      });
    });

    historyList.querySelectorAll('[data-use]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.use);
        input.value = history[idx].text;
        input.focus();
      });
    });
  }

  async function generate() {
    const text = input.value.trim();
    if (!text) {
      preview.innerHTML = '<span style="color:var(--text-secondary)">' + i18n.t('请输入内容') + '</span>';
      actions.style.display = 'none';
      currentDataUrl = null;
      return;
    }

    preview.innerHTML = '<span style="color:var(--text-secondary)">' + i18n.t('生成中...') + '</span>';
    try {
      const size = parseInt(sizeSelect.value);
      const result = await window.electronAPI.generateQRCode(text, size);
      if (result.error) {
        preview.innerHTML = '<span style="color:var(--danger)">' + i18n.t('生成失败：') + escapeHtml(result.error) + '</span>';
        actions.style.display = 'none';
        currentDataUrl = null;
        return;
      }
      currentDataUrl = result.dataUrl;
      preview.innerHTML = `<img src="${result.dataUrl}" alt="qr" style="max-width:100%; max-height:400px;">`;
      actions.style.display = 'flex';
      tip.textContent = `${size} x ${size}`;
      await window.electronAPI.addQRHistory(text);
      loadHistory();
    } catch (err) {
      preview.innerHTML = '<span style="color:var(--danger)">' + i18n.t('生成失败：') + escapeHtml(err.message) + '</span>';
      actions.style.display = 'none';
      currentDataUrl = null;
    }
  }

  page.querySelector('#btn-generate-qr').addEventListener('click', generate);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') generate();
  });

  page.querySelector('#btn-save-qr').addEventListener('click', () => {
    if (!currentDataUrl) return;
    const link = document.createElement('a');
    link.href = currentDataUrl;
    link.download = 'qrcode.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // ===== 识别 =====
  const decodePreview = page.querySelector('#qr-decode-preview');
  const decodeResult = page.querySelector('#qr-decode-result');
  const decodeActions = page.querySelector('#qr-decode-actions');
  let lastDecodedText = '';
  let decodeCurrentDataUrl = null;

  function showDecodeResult(text, isError) {
    lastDecodedText = text;
    decodeResult.style.display = 'block';
    decodeActions.style.display = 'flex';
    if (isError) {
      decodeResult.style.color = 'var(--danger)';
      decodeResult.textContent = text;
      decodeActions.style.display = 'none';
    } else {
      decodeResult.style.color = 'var(--text-primary)';
      decodeResult.textContent = text || i18n.t('（空内容）');
    }
  }

  async function decodeFromDataUrl(dataUrl) {
    decodeCurrentDataUrl = dataUrl;
    decodePreview.innerHTML = `<img src="${dataUrl}" alt="qr decode" style="max-width:100%; max-height:360px;">`;
    decodeResult.style.display = 'none';
    decodeActions.style.display = 'none';
    decodeResult.textContent = i18n.t('识别中...');
    decodeResult.style.display = 'block';
    try {
      const result = await window.electronAPI.decodeQRCode(dataUrl);
      if (result === null) {
        showDecodeResult(i18n.t('未能识别到二维码，请尝试更清晰的图片'), true);
      } else {
        showDecodeResult(result, false);
        await window.electronAPI.addQRHistory(result);
        loadHistory();
      }
    } catch (err) {
      showDecodeResult(i18n.t('识别失败：') + err.message, true);
    }
  }

  page.querySelector('#btn-select-qr-image').addEventListener('click', async () => {
    const result = await window.electronAPI.selectImageFiles();
    if (result.canceled || result.filePaths.length === 0) return;
    const read = await window.electronAPI.readImageDataUrl(result.filePaths[0]);
    if (!read.success) {
      showDecodeResult(i18n.t('读取图片失败：') + read.error, true);
      return;
    }
    await decodeFromDataUrl(read.dataUrl);
  });

  page.querySelector('#btn-paste-qr-image').addEventListener('click', async () => {
    try {
      const items = await navigator.clipboard.read();
      let found = false;
      for (const item of items) {
        if (item.types.includes('image/png')) {
          const blob = await item.getType('image/png');
          const dataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
          await decodeFromDataUrl(dataUrl);
          found = true;
          break;
        }
      }
      if (!found) {
        showDecodeResult(i18n.t('剪贴板中没有找到图片内容'), true);
      }
    } catch (err) {
      showDecodeResult(i18n.t('读取剪贴板失败：') + err.message, true);
    }
  });

  page.querySelector('#btn-decode-screen').addEventListener('click', async () => {
    await window.electronAPI.captureScreen();
    window.electronAPI.onScreenshotResult(async (dataUrl) => {
      await decodeFromDataUrl(dataUrl);
      tabs[0].classList.remove('active');
      tabContents[0].classList.remove('active');
      tabs[1].classList.add('active');
      page.querySelector('#tab-decode').classList.add('active');
    });
  });

  page.querySelector('#btn-copy-qr-result').addEventListener('click', () => {
    if (lastDecodedText) {
      window.electronAPI.copyToClipboard(lastDecodedText);
      showToast(i18n.t('已复制到剪贴板'));
    }
  });

  page.querySelector('#btn-use-qr-result').addEventListener('click', () => {
    if (lastDecodedText) {
      input.value = lastDecodedText;
      tabs[1].classList.remove('active');
      tabContents[1].classList.remove('active');
      tabs[0].classList.add('active');
      page.querySelector('#tab-generate').classList.add('active');
      generate();
    }
  });

  // 拖拽识别
  const decodeTab = page.querySelector('#tab-decode');
  decodeTab.addEventListener('dragover', (e) => { e.preventDefault(); decodePreview.classList.add('drag-over'); });
  decodeTab.addEventListener('dragleave', (e) => { e.preventDefault(); decodePreview.classList.remove('drag-over'); });
  decodeTab.addEventListener('drop', async (e) => {
    e.preventDefault();
    decodePreview.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(files[0]);
      });
      await decodeFromDataUrl(dataUrl);
    }
  });

  page.querySelector('#btn-clear-qr-history').addEventListener('click', async () => {
    if (confirm(i18n.t('确定要清空二维码历史记录吗？'))) {
      await window.electronAPI.clearQRHistory();
      loadHistory();
    }
  });

  loadHistory();
}

// ================= 设置页 =================
function renderSettings(container) {
  const page = createPageContainer();
  const locale = i18n.getLocale();
  page.innerHTML = `
    <h1 class="page-title">${i18n.t('设置')}</h1>
    <p class="page-desc">${i18n.t('应用配置。')}</p>
    <div class="card" style="max-width:500px">
      <label style="display:flex; align-items:center; gap:8px; margin-bottom:12px">
        <input type="checkbox" id="setting-autostart"> ${i18n.t('开机启动')}
      </label>
      <label style="display:flex; align-items:center; gap:8px; margin-bottom:12px">
        <input type="checkbox" id="setting-darkmode"> ${i18n.t('深色模式')}
      </label>
      <div style="margin-bottom:16px">
        <label style="display:block; margin-bottom:8px">${i18n.t('语言')}</label>
        <select class="select" id="setting-language" style="width:100%">
          <option value="zh-CN" ${locale === 'zh-CN' ? 'selected' : ''}>${i18n.t('简体中文')}</option>
          <option value="en" ${locale === 'en' ? 'selected' : ''}>${i18n.t('English')}</option>
        </select>
      </div>
      <label style="display:block; margin-bottom:8px">${i18n.t('截图快捷键')} <span style="font-size:12px; color:var(--text-secondary)">${i18n.t('（点击输入框后按下组合键）')}</span></label>
      <input type="text" class="input" id="shortcut-input" placeholder="${i18n.t('点击此处，然后按下组合键')}" style="width:100%; margin-bottom:8px" readonly>
      <button class="btn" id="btn-save-shortcut" style="margin-bottom:16px"><i class="ph ph-floppy-disk"></i> ${i18n.t('保存快捷键')}</button>
      <div id="shortcut-message" style="font-size:13px; margin-bottom:16px; min-height:20px"></div>
      <label style="display:block; margin-bottom:8px">${i18n.t('剪贴板历史条数')}</label>
      <input type="number" class="input" value="200" style="width:100%">
    </div>
  `;
  container.appendChild(page);

  const input = page.querySelector('#shortcut-input');
  const message = page.querySelector('#shortcut-message');
  const langSelect = page.querySelector('#setting-language');

  // 加载当前快捷键
  window.electronAPI.getScreenshotShortcut().then(shortcut => {
    input.value = shortcut;
  });

  // 语言切换
  langSelect.addEventListener('change', () => {
    i18n.setLocale(langSelect.value);
  });

  // 按键自动捕获：用户按下组合键自动填入
  input.addEventListener('keydown', (e) => {
    e.preventDefault();
    e.stopPropagation();

    // 单独按 Esc 取消捕获
    if (e.key === 'Escape') {
      input.blur();
      return;
    }
    // 单独按修饰键不算
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;

    const parts = [];
    if (e.ctrlKey || e.metaKey) parts.push('Control');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');

    let keyName = e.key;
    // 转换特殊键名
    const keyMap = {
      ' ': 'Space', 'ArrowUp': 'Up', 'ArrowDown': 'Down',
      'ArrowLeft': 'Left', 'ArrowRight': 'Right',
      'Backspace': 'Backspace', 'Delete': 'Delete', 'Enter': 'Return',
      'Escape': 'Escape', 'Tab': 'Tab', 'Insert': 'Insert',
      'Home': 'Home', 'End': 'End', 'PageUp': 'PageUp', 'PageDown': 'PageDown',
      'F1': 'F1', 'F2': 'F2', 'F3': 'F3', 'F4': 'F4', 'F5': 'F5',
      'F6': 'F6', 'F7': 'F7', 'F8': 'F8', 'F9': 'F9', 'F10': 'F10',
      'F11': 'F11', 'F12': 'F12'
    };
    if (keyMap[e.key]) {
      keyName = keyMap[e.key];
    } else if (e.key.length === 1) {
      keyName = e.key.toUpperCase();
    } else {
      keyName = e.key;
    }
    parts.push(keyName);
    input.value = parts.join('+');
  });

  page.querySelector('#btn-save-shortcut').addEventListener('click', async () => {
    const result = await window.electronAPI.setScreenshotShortcut(input.value);
    if (result.success) {
      message.style.color = 'green';
      message.textContent = i18n.t('快捷键已保存：') + result.shortcut;
    } else {
      message.style.color = 'red';
      message.textContent = i18n.t('保存失败：') + result.error;
    }
  });
}

// 通用列表渲染
function renderList(container, items, renderItem) {
  if (items.length === 0) {
    container.innerHTML = '<div class="empty-state">' + i18n.t('暂无数据') + '</div>';
    return;
  }

  container.innerHTML = '';
  items.forEach(item => {
    const data = renderItem(item);
    const div = document.createElement('div');
    div.className = data.class ? `list-item ${data.class}` : 'list-item';

    if (data.onClick) {
      div.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON') {
          data.onClick(item);
        }
      });
    }

    const content = document.createElement('div');
    content.className = 'list-item-content';
    content.innerHTML = `<div class="list-item-title">${escapeHtml(data.title)}</div><div class="list-item-subtitle">${escapeHtml(data.subtitle)}</div>`;
    div.appendChild(content);

    if (data.actions) {
      data.actions.forEach(action => {
        const btn = document.createElement('button');
        btn.className = action.class || 'btn btn-secondary';
        if (action.icon) {
          btn.innerHTML = `<i class="ph ${action.icon}"></i> ${escapeHtml(action.text)}`;
        } else {
          btn.textContent = action.text;
        }
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          action.onClick(item);
        });
        div.appendChild(btn);
      });
    }

    container.appendChild(div);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ================= 颜色转换工具函数 =================
function normalizeHex(hex) {
  hex = hex.trim().toLowerCase();
  if (hex.startsWith('#')) hex = hex.slice(1);
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (!/^[0-9a-f]{6}$/.test(hex)) return null;
  return '#' + hex.toUpperCase();
}

function hexToRgb(hex) {
  const h = hex.startsWith('#') ? hex.slice(1) : hex;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16)
  };
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0').toUpperCase()).join('');
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function parseRgb(value) {
  const m = value.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+\s*)?\)/i);
  if (!m) return null;
  return { r: parseInt(m[1]), g: parseInt(m[2]), b: parseInt(m[3]) };
}

function parseHsl(value) {
  const m = value.match(/hsla?\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*[\d.]+\s*)?\)/i);
  if (!m) return null;
  return { h: parseInt(m[1]), s: parseInt(m[2]), l: parseInt(m[3]) };
}

// ================= 加密相册页 =================
function renderMediaVault(container) {
  const page = createPageContainer();
  page.innerHTML = `
    <h1 class="page-title">${i18n.t('加密相册')}</h1>
    <p class="page-desc">${i18n.t('本地加密存储图片与视频，按分类管理，访问需验证密码。')}</p>
    <div id="mediavault-container"></div>
  `;
  container.appendChild(page);

  const vaultContainer = page.querySelector('#mediavault-container');
  let sessionPassword = null;
  let categories = [];
  let currentCategoryId = null;

  let isLocked = false;

  async function initVault() {
    const initialized = await window.electronAPI.mediaVaultIsInitialized();
    if (!initialized) {
      renderInitialize();
      return;
    }
    const locked = await window.electronAPI.mediaVaultIsLocked();
    isLocked = locked;
    if (locked) renderLogin();
    else renderMain();
  }

  function renderInitialize() {
    vaultContainer.innerHTML = `
      <div class="card" style="max-width:420px">
        <h3 style="margin-bottom:12px">${i18n.t('欢迎使用加密相册')}</h3>
        <p style="color:var(--text-secondary); font-size:13px; margin-bottom:16px">${i18n.t('你可以选择为相册设置访问密码，也可以先不加密直接管理。')}</p>
        <div style="display:flex; flex-direction:column; gap:12px">
          <button class="btn" id="mv-init-lock"><i class="ph ph-lock-key"></i> ${i18n.t('设置密码保护')}</button>
          <button class="btn btn-secondary" id="mv-init-unlock"><i class="ph ph-folder-open"></i> ${i18n.t('暂不加密，直接进入')}</button>
        </div>
        <div id="mv-init-lock-panel" style="display:none; margin-top:16px; padding-top:16px; border-top:1px solid var(--border)">
          <div style="display:flex; flex-direction:column; gap:12px">
            <input type="password" class="input" id="mv-setup-pass" placeholder="${i18n.t('输入密码')}" style="width:100%">
            <input type="password" class="input" id="mv-setup-pass2" placeholder="${i18n.t('确认密码')}" style="width:100%">
            <button class="btn" id="mv-setup-btn" style="width:100%"><i class="ph ph-check"></i> ${i18n.t('确认设置并进入')}</button>
          </div>
          <div id="mv-setup-msg" style="margin-top:12px; font-size:13px; min-height:20px; color:var(--danger)"></div>
        </div>
      </div>
    `;
    vaultContainer.querySelector('#mv-init-lock').addEventListener('click', () => {
      vaultContainer.querySelector('#mv-init-lock-panel').style.display = 'block';
      vaultContainer.querySelector('#mv-setup-pass').focus();
    });
    vaultContainer.querySelector('#mv-init-unlock').addEventListener('click', async () => {
      const result = await window.electronAPI.mediaVaultSetupUnlocked();
      if (result.success) {
        isLocked = false;
        sessionPassword = null;
        await renderMain();
      } else {
        alert(result.error || i18n.t('初始化失败'));
      }
    });
    const pass = vaultContainer.querySelector('#mv-setup-pass');
    const pass2 = vaultContainer.querySelector('#mv-setup-pass2');
    const msg = vaultContainer.querySelector('#mv-setup-msg');
    vaultContainer.querySelector('#mv-setup-btn').addEventListener('click', async () => {
      if (pass.value.length < 4) { msg.textContent = i18n.t('密码至少 4 位'); return; }
      if (pass.value !== pass2.value) { msg.textContent = i18n.t('两次输入的密码不一致'); return; }
      const result = await window.electronAPI.mediaVaultSetupPassword(pass.value);
      if (result.success) {
        isLocked = true;
        sessionPassword = pass.value;
        pass.value = ''; pass2.value = '';
        await renderMain();
      } else {
        msg.textContent = result.error || i18n.t('设置失败');
      }
    });
  }

  function renderLogin() {
    vaultContainer.innerHTML = `
      <div class="card" style="max-width:420px">
        <h3 style="margin-bottom:12px">${i18n.t('加密相册已锁定')}</h3>
        <div style="display:flex; flex-direction:column; gap:12px">
          <input type="password" class="input" id="mv-login-pass" placeholder="${i18n.t('访问密码')}" style="width:100%">
          <button class="btn" id="mv-login-btn" style="width:100%"><i class="ph ph-sign-in"></i> ${i18n.t('进入相册')}</button>
        </div>
        <div id="mv-login-msg" style="margin-top:12px; font-size:13px; min-height:20px; color:var(--danger)"></div>
      </div>
    `;
    const pass = vaultContainer.querySelector('#mv-login-pass');
    const msg = vaultContainer.querySelector('#mv-login-msg');
    const btn = vaultContainer.querySelector('#mv-login-btn');
    btn.addEventListener('click', async () => {
      const result = await window.electronAPI.mediaVaultVerifyPassword(pass.value);
      if (result.success) {
        sessionPassword = pass.value;
        pass.value = '';
        await renderMain();
      } else {
        msg.textContent = result.error || i18n.t('密码错误');
      }
    });
    pass.addEventListener('keydown', (e) => { if (e.key === 'Enter') btn.click(); });
  }

  async function renderMain() {
    const result = await window.electronAPI.mediaVaultGetCategories(isLocked ? sessionPassword : null);
    if (!result.success) { lockSession(); return; }
    categories = result.categories || [];
    if (result.locked !== undefined) isLocked = result.locked;
    if (!currentCategoryId && categories.length > 0) currentCategoryId = categories[0].id;
    vaultContainer.innerHTML = `
      <div style="display:flex; gap:16px; height:calc(100vh - 180px); min-height:400px">
        <div class="card" style="width:220px; display:flex; flex-direction:column; padding:12px">
          <div class="toolbar" style="margin-bottom:8px">
            <button class="btn btn-sm" id="mv-add-category" style="flex:1"><i class="ph ph-plus"></i> ${i18n.t('分类')}</button>
          </div>
          <div id="mv-category-list" style="flex:1; overflow-y:auto"></div>
        </div>
        <div style="flex:1; display:flex; flex-direction:column; min-width:0">
          <div class="toolbar" style="justify-content:space-between; margin-bottom:12px">
            <div style="display:flex; gap:8px">
              <button class="btn" id="mv-add-media"><i class="ph ph-plus"></i> ${i18n.t('添加媒体')}</button>
              ${isLocked ? '<button class="btn btn-secondary" id="mv-change-password"><i class="ph ph-pencil-simple"></i> ' + i18n.t('修改密码') + '</button><button class="btn btn-danger" id="mv-unlock"><i class="ph ph-lock-key-open"></i> ' + i18n.t('取消保护') + '</button>' : ''}
            </div>
            <button class="btn btn-secondary" id="mv-lock"><i class="ph ${isLocked ? 'ph-lock-key' : 'ph-lock-key-open'}"></i> ${isLocked ? i18n.t('锁定') : i18n.t('未上锁')}</button>
          </div>
          <div id="mv-media-grid" style="flex:1; overflow-y:auto; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius); padding:12px"></div>
        </div>
      </div>
    `;
    vaultContainer.querySelector('#mv-add-category').addEventListener('click', showAddCategoryModal);
    vaultContainer.querySelector('#mv-add-media').addEventListener('click', addMediaFiles);
    if (isLocked) {
      vaultContainer.querySelector('#mv-change-password').addEventListener('click', showChangePasswordModal);
      vaultContainer.querySelector('#mv-unlock').addEventListener('click', showUnlockModal);
      vaultContainer.querySelector('#mv-lock').addEventListener('click', lockSession);
    } else {
      vaultContainer.querySelector('#mv-lock').addEventListener('click', showLockModal);
    }
    renderCategories();
    renderMediaGrid();
  }

  function renderCategories() {
    const list = vaultContainer.querySelector('#mv-category-list');
    if (categories.length === 0) {
      list.innerHTML = '<div class="empty-state" style="padding:20px">' + i18n.t('暂无分类') + '</div>';
      return;
    }
    list.innerHTML = categories.map(c => `
      <div class="mv-category-item ${c.id === currentCategoryId ? 'active' : ''}" data-id="${c.id}">
        <span class="mv-category-name">${escapeHtml(c.name)}</span>
        <button class="mv-category-delete" data-id="${c.id}" title="${i18n.t('删除分类')}">×</button>
      </div>
    `).join('');
    list.querySelectorAll('.mv-category-item').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.classList.contains('mv-category-delete')) return;
        currentCategoryId = el.dataset.id;
        renderCategories();
        renderMediaGrid();
      });
    });
    list.querySelectorAll('.mv-category-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const cat = categories.find(c => c.id === id);
        if (!cat) return;
        if (!confirm(i18n.t('确定删除分类“{0}”？该分类下的所有媒体将被一并删除。', cat.name))) return;
        const result = await window.electronAPI.mediaVaultDeleteCategory(sessionPassword, id);
        if (result.success) {
          categories = categories.filter(c => c.id !== id);
          if (currentCategoryId === id) currentCategoryId = categories[0]?.id || null;
          renderCategories();
          renderMediaGrid();
        } else {
          alert(result.error || i18n.t('删除失败'));
        }
      });
    });
  }

  async function renderMediaGrid() {
    const grid = vaultContainer.querySelector('#mv-media-grid');
    if (!currentCategoryId) {
      grid.innerHTML = '<div class="empty-state">' + i18n.t('请先创建分类') + '</div>';
      return;
    }
    grid.innerHTML = '<div class="empty-state">' + i18n.t('加载中...') + '</div>';
    const result = await window.electronAPI.mediaVaultGetMediaList(sessionPassword, currentCategoryId);
    if (!result.success) { grid.innerHTML = '<div class="empty-state" style="color:var(--danger)">' + i18n.t('加载失败：') + escapeHtml(result.error || i18n.t('未知错误')) + '</div>'; return; }
    const items = result.items || [];
    if (items.length === 0) {
      grid.innerHTML = '<div class="empty-state">' + i18n.t('该分类下暂无媒体，点击“添加媒体”导入文件') + '</div>';
      return;
    }
    grid.innerHTML = items.map(item => `
      <div class="mv-media-item" data-id="${item.id}" title="${escapeHtml(item.name)}">
        <div class="mv-media-thumb">
          ${item.type === 'video' ? '<span class="mv-media-badge">▶</span>' : ''}
          <img src="${escapeHtml(item.thumbnailDataUrl || '')}" alt="" onerror="this.style.display='none'">
        </div>
        <div class="mv-media-name">${escapeHtml(item.name)}</div>
      </div>
    `).join('');
    grid.querySelectorAll('.mv-media-item').forEach(el => {
      el.addEventListener('click', () => {
        const item = items.find(i => i.id === el.dataset.id);
        if (item) showMediaModal(item);
      });
    });
  }

  function showInputModal(title, placeholder) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal" style="max-width:420px">
          <div class="modal-header">
            <div class="modal-title">${escapeHtml(title)}</div>
            <button class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <input type="text" class="input" id="mv-input-value" placeholder="${escapeHtml(placeholder || '')}" style="width:100%">
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="mv-input-cancel"><i class="ph ph-x"></i> ${i18n.t('取消')}</button>
            <button class="btn" id="mv-input-confirm"><i class="ph ph-check"></i> ${i18n.t('确定')}</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      const input = overlay.querySelector('#mv-input-value');
      const close = () => { overlay.remove(); resolve(null); };
      overlay.querySelector('.modal-close').addEventListener('click', close);
      overlay.querySelector('#mv-input-cancel').addEventListener('click', close);
      overlay.querySelector('#mv-input-confirm').addEventListener('click', () => {
        const value = input.value.trim();
        overlay.remove();
        resolve(value);
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') overlay.querySelector('#mv-input-confirm').click();
        if (e.key === 'Escape') close();
      });
      overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
      input.focus();
    });
  }

  function showAddCategoryModal() {
    showInputModal(i18n.t('新建分类'), i18n.t('分类名称')).then(name => {
      if (!name) return null;
      return window.electronAPI.mediaVaultAddCategory(isLocked ? sessionPassword : null, name);
    }).then(result => {
      if (!result) return;
      if (result.success) {
        categories = result.categories;
        currentCategoryId = result.newCategoryId || currentCategoryId;
        renderCategories();
        renderMediaGrid();
      } else {
        alert(result.error || i18n.t('添加失败'));
      }
    }).catch(err => {
      alert(i18n.t('添加媒体失败：') + err.message);
    });
  }

  async function addMediaFiles() {
    if (!currentCategoryId) { alert(i18n.t('请先选择或创建一个分类')); return; }
    try {
      const selectResult = await window.electronAPI.selectMediaFiles();
      if (selectResult.canceled || !selectResult.filePaths || selectResult.filePaths.length === 0) return;
      const grid = vaultContainer.querySelector('#mv-media-grid');
      grid.innerHTML = '<div class="empty-state">' + i18n.t('正在加密导入...') + '</div>';
      let success = 0, failed = 0;
      for (const filePath of selectResult.filePaths) {
        const result = await window.electronAPI.mediaVaultAddMedia(isLocked ? sessionPassword : null, currentCategoryId, filePath);
        if (result.success) success++;
        else failed++;
      }
      renderMediaGrid();
      if (failed > 0) alert(i18n.t('导入完成：成功 {0} 个，失败 {1} 个', success, failed));
    } catch (err) {
      console.error('添加媒体失败:', err);
      alert(i18n.t('添加媒体失败：') + err.message);
      renderMediaGrid();
    }
  }

  function showMediaModal(item) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width:90vw; max-height:90vh; width:auto; min-width:300px">
        <div class="modal-header">
          <div class="modal-title">${escapeHtml(item.name)}</div>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body" id="mv-modal-body" style="display:flex; align-items:center; justify-content:center; background:#000; min-height:200px; padding:0">
          <div style="color:#fff">${i18n.t('加载中...')}</div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-danger" id="mv-delete-media"><i class="ph ph-trash"></i> ${i18n.t('删除')}</button>
          <button class="btn btn-secondary" id="mv-close-viewer"><i class="ph ph-x"></i> ${i18n.t('关闭')}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#mv-close-viewer').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#mv-delete-media').addEventListener('click', async () => {
      if (!confirm(i18n.t('确定删除该媒体文件？'))) return;
      const result = await window.electronAPI.mediaVaultDeleteMedia(isLocked ? sessionPassword : null, item.id);
      if (result.success) {
        overlay.remove();
        renderMediaGrid();
      } else {
        alert(result.error || i18n.t('删除失败'));
      }
    });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    window.electronAPI.mediaVaultGetMediaData(isLocked ? sessionPassword : null, item.id).then(result => {
      const body = overlay.querySelector('#mv-modal-body');
      if (!result.success) {
        body.innerHTML = '<div style="color:var(--danger); padding:20px">' + i18n.t('加载失败：') + escapeHtml(result.error || i18n.t('未知错误')) + '</div>';
        return;
      }
      if (item.type === 'video') {
        body.innerHTML = `<video src="${result.dataUrl}" controls style="max-width:100%; max-height:calc(90vh - 120px); display:block" autoplay></video>`;
      } else {
        body.innerHTML = `<img src="${result.dataUrl}" alt="${escapeHtml(item.name)}" style="max-width:100%; max-height:calc(90vh - 120px); display:block">`;
      }
    });
  }

  function showChangePasswordModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width:420px">
        <div class="modal-header">
          <div class="modal-title">${i18n.t('修改访问密码')}</div>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body" style="display:flex; flex-direction:column; gap:12px">
          <input type="password" class="input" id="mv-old-pass" placeholder="${i18n.t('原密码')}" style="width:100%">
          <input type="password" class="input" id="mv-new-pass" placeholder="${i18n.t('新密码')}" style="width:100%">
          <input type="password" class="input" id="mv-new-pass2" placeholder="${i18n.t('确认新密码')}" style="width:100%">
          <div id="mv-change-msg" style="font-size:13px; min-height:20px; color:var(--danger)"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="mv-cancel-change"><i class="ph ph-x"></i> ${i18n.t('取消')}</button>
          <button class="btn" id="mv-confirm-change"><i class="ph ph-check"></i> ${i18n.t('确认修改')}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    const oldPass = overlay.querySelector('#mv-old-pass');
    const newPass = overlay.querySelector('#mv-new-pass');
    const newPass2 = overlay.querySelector('#mv-new-pass2');
    const msg = overlay.querySelector('#mv-change-msg');
    overlay.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#mv-cancel-change').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#mv-confirm-change').addEventListener('click', async () => {
      if (newPass.value.length < 4) { msg.textContent = i18n.t('新密码至少 4 位'); return; }
      if (newPass.value !== newPass2.value) { msg.textContent = i18n.t('两次输入的新密码不一致'); return; }
      const result = await window.electronAPI.mediaVaultChangePassword(oldPass.value, newPass.value);
      if (result.success) {
        sessionPassword = newPass.value;
        overlay.remove();
        alert(i18n.t('密码已修改，请牢记新密码'));
      } else {
        msg.textContent = result.error || i18n.t('修改失败');
      }
    });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  }

  function lockSession() {
    sessionPassword = null;
    categories = [];
    currentCategoryId = null;
    renderLogin();
  }

  function showLockModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width:420px">
        <div class="modal-header">
          <div class="modal-title">${i18n.t('设置密码保护')}</div>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body" style="display:flex; flex-direction:column; gap:12px">
          <p style="color:var(--text-secondary); font-size:13px">${i18n.t('设置密码后，所有媒体文件和分类信息将使用密码加密。请牢记密码。')}</p>
          <input type="password" class="input" id="mv-lock-pass" placeholder="${i18n.t('输入密码')}" style="width:100%">
          <input type="password" class="input" id="mv-lock-pass2" placeholder="${i18n.t('确认密码')}" style="width:100%">
          <div id="mv-lock-msg" style="font-size:13px; min-height:20px; color:var(--danger)"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="mv-cancel-lock"><i class="ph ph-x"></i> ${i18n.t('取消')}</button>
          <button class="btn" id="mv-confirm-lock"><i class="ph ph-lock-key"></i> ${i18n.t('确认上锁')}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    const pass = overlay.querySelector('#mv-lock-pass');
    const pass2 = overlay.querySelector('#mv-lock-pass2');
    const msg = overlay.querySelector('#mv-lock-msg');
    overlay.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#mv-cancel-lock').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#mv-confirm-lock').addEventListener('click', async () => {
      if (pass.value.length < 4) { msg.textContent = i18n.t('密码至少 4 位'); return; }
      if (pass.value !== pass2.value) { msg.textContent = i18n.t('两次输入的密码不一致'); return; }
      msg.textContent = i18n.t('正在加密，请稍候...');
      const result = await window.electronAPI.mediaVaultToggleLock(null, true, pass.value);
      if (result.success) {
        isLocked = true;
        sessionPassword = pass.value;
        overlay.remove();
        await renderMain();
      } else {
        msg.textContent = result.error || i18n.t('上锁失败');
      }
    });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    pass.focus();
  }

  function showUnlockModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width:420px">
        <div class="modal-header">
          <div class="modal-title">${i18n.t('取消密码保护')}</div>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body" style="display:flex; flex-direction:column; gap:12px">
          <p style="color:var(--text-secondary); font-size:13px">${i18n.t('取消后相册将不再需要密码即可进入。媒体文件仍会保留基础加密存储。')}</p>
          <input type="password" class="input" id="mv-unlock-pass" placeholder="${i18n.t('当前密码')}" style="width:100%">
          <div id="mv-unlock-msg" style="font-size:13px; min-height:20px; color:var(--danger)"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="mv-cancel-unlock"><i class="ph ph-x"></i> ${i18n.t('取消')}</button>
          <button class="btn" id="mv-confirm-unlock"><i class="ph ph-lock-key-open"></i> ${i18n.t('确认取消保护')}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    const pass = overlay.querySelector('#mv-unlock-pass');
    const msg = overlay.querySelector('#mv-unlock-msg');
    overlay.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#mv-cancel-unlock').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#mv-confirm-unlock').addEventListener('click', async () => {
      if (!pass.value) { msg.textContent = i18n.t('请输入当前密码'); return; }
      msg.textContent = i18n.t('正在解密，请稍候...');
      const result = await window.electronAPI.mediaVaultToggleLock(pass.value, false);
      if (result.success) {
        isLocked = false;
        sessionPassword = null;
        overlay.remove();
        await renderMain();
      } else {
        msg.textContent = result.error || i18n.t('取消保护失败');
      }
    });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    pass.focus();
  }

  initVault();
}

// 启动
document.addEventListener('DOMContentLoaded', init);
