const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, clipboard, nativeImage, dialog, screen, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
let sharp;
try {
  sharp = require('sharp');
  console.log('[main] sharp loaded successfully');
} catch (err) {
  console.error('[main] failed to load sharp:', err.message);
  sharp = null;
}
const Store = require('electron-store');
const crypto = require('crypto');
const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);
const https = require('https');

// 文档转换依赖（可选加载，失败不影响主程序）
let mammoth, docxLib, TurndownService, XLSX, pdfParse;
try { mammoth = require('mammoth'); } catch (e) { console.error('[main] mammoth not loaded:', e.message); }
try { docxLib = require('docx'); } catch (e) { console.error('[main] docx not loaded:', e.message); }
try { TurndownService = require('turndown'); } catch (e) { console.error('[main] turndown not loaded:', e.message); }
try { XLSX = require('xlsx'); } catch (e) { console.error('[main] xlsx not loaded:', e.message); }
try { pdfParse = require('pdf-parse'); } catch (e) { console.error('[main] pdf-parse not loaded:', e.message); }

// OCR 依赖（可选加载，失败不影响主程序）
let tesseract;
try {
  tesseract = require('tesseract.js');
  console.log('[main] tesseract.js loaded successfully');
} catch (e) { console.error('[main] tesseract.js not loaded:', e.message); }

let windowsMediaOcr;
try {
  windowsMediaOcr = require('windows-media-ocr');
  console.log('[main] windows-media-ocr loaded successfully');
} catch (e) { console.error('[main] windows-media-ocr not loaded:', e.message); }

const store = new Store();

// ================= 主进程国际化 =================
const SUPPORTED_LOCALES = ['zh-CN', 'en'];
const DEFAULT_LOCALE = 'zh-CN';

const mainTranslations = {
  en: {
    '显示': 'Show',
    '截图': 'Screenshot',
    '退出': 'Quit',
    '快捷键不能为空': 'Shortcut cannot be empty',
    '快捷键格式无效或已被占用': 'Invalid shortcut format or already in use',
    '不支持的加密方式': 'Unsupported encryption method',
    '密文格式无效': 'Invalid ciphertext format',
    '密码不能为空': 'Password cannot be empty',
    '密文不能为空': 'Ciphertext cannot be empty',
    '文件不存在': 'File does not exist',
    '图片文件': 'Image Files',
    '所有支持的文档': 'All Supported Documents',
    '纯文本': 'Plain Text',
    'PDF 文件': 'PDF Files',
    '图片/视频': 'Images / Videos',
    '图片处理库未加载，请查看主进程日志': 'Image processing library not loaded, check main process logs',
    '没有选择图片': 'No image selected',
    '未选择自定义输出目录': 'Please select custom output directory',
    'docx 库未加载': 'docx library not loaded',
    'mammoth 库未加载': 'mammoth library not loaded',
    'turndown 库未加载': 'turndown library not loaded',
    'xlsx 库未加载': 'xlsx library not loaded',
    'pdf-parse 库未加载': 'pdf-parse library not loaded',
    '不支持的 Excel 输出格式': 'Unsupported Excel output format',
    '不支持的 CSV 输出格式': 'Unsupported CSV output format',
    'JSON 解析失败：': 'JSON parsing failed: ',
    'JSON 转 CSV 需要数组结构': 'JSON to CSV requires an array structure',
    '不支持的 JSON 输出格式': 'Unsupported JSON output format',
    '不支持的源格式': 'Unsupported source format',
    '未检测到 LibreOffice，请先安装 LibreOffice（https://www.libreoffice.org/download/download）': 'LibreOffice not detected, please install LibreOffice (https://www.libreoffice.org/download/download)',
    'LibreOffice 转换失败，未生成输出文件': 'LibreOffice conversion failed, no output file generated',
    'Python 转换失败': 'Python conversion failed',
    'Python 输出解析失败: ': 'Python output parsing failed: ',
    '[convert-document] Python 转换失败，回退到原生/LibreOffice:': '[convert-document] Python conversion failed, falling back to native/LibreOffice:',
    '参数不完整': 'Incomplete parameters',
    '不支持的目标格式': 'Unsupported target format',
    '至少需要 2 张截图才能拼接': 'At least 2 screenshots are required to stitch',
    '拼接失败：': 'Stitching failed: ',
    'Windows OCR 库未加载': 'Windows OCR library not loaded',
    'OCR 库未加载，请检查 tesseract.js 是否安装': 'OCR library not loaded, please check if tesseract.js is installed',
    '没有可用的 OCR 引擎': 'No OCR engine available',
    '需要密码': 'Password required',
    '已设置密码': 'Password already set',
    '密码错误': 'Wrong password',
    '相册已初始化': 'Album already initialized',
    '验证失败': 'Verification failed',
    '媒体不存在': 'Media does not exist',
    '文件已丢失': 'File is missing',
    '原密码错误': 'Old password is incorrect',
    '新密码至少 4 位': 'New password must be at least 4 characters',
    '解密失败：密码错误或密文已损坏': 'Decryption failed: wrong password or corrupted ciphertext'
  }
};

function getAppLocale() {
  return store.get('app-locale', DEFAULT_LOCALE);
}

function setAppLocale(locale) {
  if (!SUPPORTED_LOCALES.includes(locale)) return;
  store.set('app-locale', locale);
}

function mt(key) {
  const locale = getAppLocale();
  return mainTranslations[locale]?.[key] || key;
}

let mainWindow = null;
let tray = null;
let clipboardWatcher = null;
let screenshotOverlay = null;
let colorPickerOverlay = null;
let longScreenshotOverlay = null;
let longScreenshotSession = null;

const isDev = process.argv.includes('--dev');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1116,
    height: 788,
    minWidth: 800,
    minHeight: 600,
    title: 'Toolbox',
    icon: path.join(__dirname, 'assets/icon.png'),
    frame: false,
    transparent: true,
    roundedCorners: true,
    backgroundMaterial: 'none',
    thickFrame: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.setMenu(null);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-state-changed', { isMaximized: true });
  });

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-state-changed', { isMaximized: false });
  });
}

function buildTrayMenu() {
  return Menu.buildFromTemplate([
    {
      label: mt('显示'),
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createWindow();
        }
      }
    },
    {
      label: mt('截图'),
      click: () => takeScreenshot()
    },
    { type: 'separator' },
    {
      label: mt('退出'),
      click: () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);
}

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'assets/icon.png')).resize({ width: 16, height: 16 });
  tray = new Tray(icon);
  tray.setToolTip('Toolbox');
  tray.setContextMenu(buildTrayMenu());

  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    } else {
      createWindow();
    }
  });
}

const DEFAULT_SHORTCUT = 'Control+Shift+.';

function getScreenshotShortcut() {
  return store.get('screenshotShortcut', DEFAULT_SHORTCUT);
}

function registerShortcuts() {
  registerScreenshotShortcut(getScreenshotShortcut());
}

function registerScreenshotShortcut(accelerator) {
  globalShortcut.unregisterAll();
  if (accelerator && accelerator.trim()) {
    try {
      const registered = globalShortcut.register(accelerator, () => {
        takeScreenshot();
      });
      if (!registered) {
        console.error('Failed to register shortcut:', accelerator);
      }
      return registered;
    } catch (err) {
      console.error('Invalid shortcut format:', accelerator, err);
      return false;
    }
  }
  return true;
}



function takeScreenshot() {
  if (screenshotOverlay) {
    screenshotOverlay.focus();
    return;
  }

  const display = screen.getPrimaryDisplay();

  screenshotOverlay = new BrowserWindow({
    width: display.size.width,
    height: display.size.height,
    x: 0,
    y: 0,
    fullscreen: false,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  screenshotOverlay.loadFile(path.join(__dirname, 'screenshot-overlay.html'));
  screenshotOverlay.setFullScreen(true);
  screenshotOverlay.setIgnoreMouseEvents(false);

  screenshotOverlay.on('closed', () => {
    screenshotOverlay = null;
  });
}

async function pickScreenColor() {
  if (colorPickerOverlay) {
    colorPickerOverlay.focus();
    return;
  }

  const { desktopCapturer } = require('electron');
  const display = screen.getPrimaryDisplay();

  let dataUrl;
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: display.size.width, height: display.size.height }
    });
    if (sources.length === 0) throw new Error('No screen source found');
    dataUrl = sources[0].thumbnail.toDataURL();
  } catch (err) {
    console.error('Failed to capture screen for color picker:', err);
    if (mainWindow) {
      mainWindow.webContents.send('color-pick-result', { error: err.message });
    }
    return;
  }

  colorPickerOverlay = new BrowserWindow({
    width: display.size.width,
    height: display.size.height,
    x: 0,
    y: 0,
    fullscreen: false,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  colorPickerOverlay.loadFile(path.join(__dirname, 'color-picker-overlay.html'));
  colorPickerOverlay.setFullScreen(true);
  colorPickerOverlay.setIgnoreMouseEvents(false);

  colorPickerOverlay.webContents.once('did-finish-load', () => {
    colorPickerOverlay.webContents.send('set-screenshot', dataUrl);
  });

  colorPickerOverlay.on('closed', () => {
    colorPickerOverlay = null;
  });
}

function closeColorPicker() {
  if (colorPickerOverlay) {
    colorPickerOverlay.close();
    colorPickerOverlay = null;
  }
}

function startClipboardWatcher() {
  let lastText = '';
  clipboardWatcher = setInterval(() => {
    const text = clipboard.readText();
    if (text && text !== lastText) {
      lastText = text;
      const history = store.get('clipboardHistory', []);
      history.unshift({ id: Date.now().toString(), content: text, time: Date.now() });
      store.set('clipboardHistory', history.slice(0, 200));
      if (mainWindow && mainWindow.isVisible()) {
        mainWindow.webContents.send('clipboard-updated', history.slice(0, 200));
      }
    }
  }, 500);
}

function stopClipboardWatcher() {
  if (clipboardWatcher) {
    clearInterval(clipboardWatcher);
    clipboardWatcher = null;
  }
}

// IPC handlers
ipcMain.handle('get-app-version', () => app.getVersion());

ipcMain.handle('get-app-locale', () => getAppLocale());

ipcMain.handle('set-app-locale', (event, locale) => {
  setAppLocale(locale);
  if (tray) tray.setContextMenu(buildTrayMenu());
});

// 窗口控制
ipcMain.handle('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('window-maximize', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.handle('window-close', () => {
  if (mainWindow) {
    app.isQuiting = true;
    mainWindow.close();
  }
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

ipcMain.handle('get-screenshot-shortcut', () => {
  return getScreenshotShortcut();
});

ipcMain.handle('set-screenshot-shortcut', (event, accelerator) => {
  const clean = (accelerator || '').trim();
  if (!clean) {
    return { success: false, error: mt('快捷键不能为空') };
  }

  const oldShortcut = getScreenshotShortcut();
  const registered = registerScreenshotShortcut(clean);

  if (!registered) {
    // 注册失败，回滚到旧快捷键
    registerScreenshotShortcut(oldShortcut);
    return { success: false, error: mt('快捷键格式无效或已被占用') };
  }

  store.set('screenshotShortcut', clean);
  return { success: true, shortcut: clean };
});

ipcMain.handle('get-clipboard-history', () => {
  return store.get('clipboardHistory', []);
});

ipcMain.handle('clear-clipboard-history', () => {
  store.set('clipboardHistory', []);
  return [];
});

ipcMain.handle('copy-to-clipboard', (event, text) => {
  clipboard.writeText(text);
  return true;
});

ipcMain.handle('get-snippets', () => {
  return store.get('snippets', []);
});

ipcMain.handle('add-snippet', (event, snippet) => {
  const snippets = store.get('snippets', []);
  snippets.push({ id: Date.now().toString(), ...snippet });
  store.set('snippets', snippets);
  return snippets;
});

ipcMain.handle('delete-snippet', (event, id) => {
  const snippets = store.get('snippets', []).filter(s => s.id !== id);
  store.set('snippets', snippets);
  return snippets;
});

ipcMain.handle('get-vault-items', () => {
  return store.get('vaultItems', []);
});

ipcMain.handle('add-vault-item', (event, item) => {
  const items = store.get('vaultItems', []);
  items.push({ id: Date.now().toString(), ...item });
  store.set('vaultItems', items);
  return items;
});

ipcMain.handle('delete-vault-item', (event, id) => {
  const items = store.get('vaultItems', []).filter(i => i.id !== id);
  store.set('vaultItems', items);
  return items;
});

ipcMain.handle('get-memos', () => {
  return store.get('memos', []);
});

ipcMain.handle('add-memo', (event, memo) => {
  const memos = store.get('memos', []);
  memos.unshift({ id: Date.now().toString(), ...memo });
  store.set('memos', memos);
  return memos;
});

ipcMain.handle('delete-memo', (event, id) => {
  const memos = store.get('memos', []).filter(m => m.id !== id);
  store.set('memos', memos);
  return memos;
});

ipcMain.handle('start-clipboard-watch', () => {
  startClipboardWatcher();
  return true;
});

ipcMain.handle('stop-clipboard-watch', () => {
  stopClipboardWatcher();
  return true;
});

ipcMain.handle('hash-text', (event, text, algorithm) => {
  return crypto.createHash(algorithm).update(text).digest('hex');
});

// ================= 加密传输（自创非常规算法） =================
const CUSTOM_METHODS = [
  'custom-xor-stream',
  'custom-substitution',
  'custom-rolling-shift',
  'custom-block-scramble',
  'custom-double-mix'
];

const METHOD_TO_BYTE = {
  'custom-xor-stream': 0x01,
  'custom-substitution': 0x02,
  'custom-rolling-shift': 0x03,
  'custom-block-scramble': 0x04,
  'custom-double-mix': 0x05
};

const BYTE_TO_METHOD = {
  0x01: 'custom-xor-stream',
  0x02: 'custom-substitution',
  0x03: 'custom-rolling-shift',
  0x04: 'custom-block-scramble',
  0x05: 'custom-double-mix'
};

// 自定义种子哈希：把密码+盐混合成一个 32 位无符号整数种子
function customSeedHash(password, salt) {
  const buf = Buffer.concat([Buffer.from(password || '', 'utf8'), salt]);
  let state = 0x12345678;
  for (let i = 0; i < buf.length; i++) {
    state ^= buf[i];
    state = ((state << 7) | (state >>> 25)) >>> 0;
    state = (state * 0x9E3779B9) >>> 0;
    state ^= (state >>> 11);
  }
  if (state === 0) state = 0x9E3779B9;
  return state;
}

// 自创伪随机数生成器（基于 xorshift 变体）
class CustomPRNG {
  constructor(seed) {
    this.state = seed >>> 0;
    if (this.state === 0) this.state = 0x9E3779B9;
    // 预热
    for (let i = 0; i < 16; i++) this.next();
  }
  next() {
    let s = this.state;
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    this.state = s >>> 0;
    return this.state & 0xFF;
  }
}

function customKeystream(password, salt, length) {
  const prng = new CustomPRNG(customSeedHash(password, salt));
  const result = Buffer.alloc(length);
  for (let i = 0; i < length; i++) result[i] = prng.next();
  return result;
}

function customSBox(password, salt) {
  const prng = new CustomPRNG(customSeedHash(password, salt));
  const box = Buffer.from(Array.from({ length: 256 }, (_, i) => i));
  for (let i = 255; i > 0; i--) {
    const j = prng.next() % (i + 1);
    [box[i], box[j]] = [box[j], box[i]];
  }
  return box;
}

function inverseSBox(box) {
  const inv = Buffer.alloc(256);
  for (let i = 0; i < 256; i++) inv[box[i]] = i;
  return inv;
}

function packCustomCipher(method, salt, cipherBuffer) {
  const methodByte = METHOD_TO_BYTE[method];
  if (methodByte === undefined) throw new Error(mt('不支持的加密方式'));
  const packed = Buffer.concat([Buffer.from([methodByte]), salt, cipherBuffer]);
  return packed.toString('base64');
}

function unpackCustomCipher(cipherText) {
  const packed = Buffer.from(cipherText, 'base64');
  if (packed.length < 17) throw new Error(mt('密文格式无效'));
  const methodByte = packed[0];
  const method = BYTE_TO_METHOD[methodByte];
  if (!method) throw new Error(mt('不支持的加密方式'));
  return { method, salt: packed.slice(1, 17), cipher: packed.slice(17) };
}

function doEncryptText(text, password, method) {
  if (!CUSTOM_METHODS.includes(method)) throw new Error(mt('不支持的加密方式'));
  if (!password && password !== '') throw new Error(mt('密码不能为空'));

  const plain = Buffer.from(text || '', 'utf8');
  const salt = crypto.randomBytes(16);
  const cipher = Buffer.alloc(plain.length);

  if (method === 'custom-xor-stream') {
    const stream = customKeystream(password, salt, plain.length);
    for (let i = 0; i < plain.length; i++) cipher[i] = plain[i] ^ stream[i];
  } else if (method === 'custom-substitution') {
    const box = customSBox(password, salt);
    for (let i = 0; i < plain.length; i++) cipher[i] = box[plain[i]];
  } else if (method === 'custom-rolling-shift') {
    const stream = customKeystream(password, salt, plain.length);
    for (let i = 0; i < plain.length; i++) {
      cipher[i] = (plain[i] + stream[i] + i) & 0xFF;
    }
  } else if (method === 'custom-block-scramble') {
    const blockSize = Math.max(4, (password.length % 16) + 4);
    const streamLen = Math.ceil(plain.length / blockSize) * blockSize;
    const prng = new CustomPRNG(customSeedHash(password, salt));
    for (let blockStart = 0; blockStart < plain.length; blockStart += blockSize) {
      const currentSize = Math.min(blockSize, plain.length - blockStart);
      const perm = Array.from({ length: currentSize }, (_, i) => i);
      for (let i = currentSize - 1; i > 0; i--) {
        const j = prng.next() % (i + 1);
        [perm[i], perm[j]] = [perm[j], perm[i]];
      }
      for (let i = 0; i < currentSize; i++) {
        cipher[blockStart + perm[i]] = plain[blockStart + i];
      }
    }
  } else if (method === 'custom-double-mix') {
    const box = customSBox(password, salt);
    const stream = customKeystream(password, salt, plain.length);
    for (let i = 0; i < plain.length; i++) {
      cipher[i] = box[plain[i]] ^ stream[i];
    }
  }

  return packCustomCipher(method, salt, cipher);
}

function doDecryptText(cipherText, password) {
  if (!cipherText) throw new Error(mt('密文不能为空'));
  const parts = unpackCustomCipher(cipherText);
  const salt = parts.salt;
  const cipher = parts.cipher;
  const plain = Buffer.alloc(cipher.length);

  if (parts.method === 'custom-xor-stream') {
    const stream = customKeystream(password, salt, cipher.length);
    for (let i = 0; i < cipher.length; i++) plain[i] = cipher[i] ^ stream[i];
  } else if (parts.method === 'custom-substitution') {
    const box = inverseSBox(customSBox(password, salt));
    for (let i = 0; i < cipher.length; i++) plain[i] = box[cipher[i]];
  } else if (parts.method === 'custom-rolling-shift') {
    const stream = customKeystream(password, salt, cipher.length);
    for (let i = 0; i < cipher.length; i++) {
      plain[i] = (cipher[i] - stream[i] - i) & 0xFF;
    }
  } else if (parts.method === 'custom-block-scramble') {
    const blockSize = Math.max(4, (password.length % 16) + 4);
    const prng = new CustomPRNG(customSeedHash(password, salt));
    for (let blockStart = 0; blockStart < cipher.length; blockStart += blockSize) {
      const currentSize = Math.min(blockSize, cipher.length - blockStart);
      const perm = Array.from({ length: currentSize }, (_, i) => i);
      for (let i = currentSize - 1; i > 0; i--) {
        const j = prng.next() % (i + 1);
        [perm[i], perm[j]] = [perm[j], perm[i]];
      }
      // 逆置换：原位置 i 被放到了 perm[i]，解密时从 perm[i] 取回放到 i
      for (let i = 0; i < currentSize; i++) {
        plain[blockStart + i] = cipher[blockStart + perm[i]];
      }
    }
  } else if (parts.method === 'custom-double-mix') {
    const box = customSBox(password, salt);
    const invBox = inverseSBox(box);
    const stream = customKeystream(password, salt, cipher.length);
    for (let i = 0; i < cipher.length; i++) {
      plain[i] = invBox[cipher[i] ^ stream[i]];
    }
  }

  return plain.toString('utf8');
}

ipcMain.handle('encrypt-text', (event, text, password, method) => {
  try {
    const result = doEncryptText(text, password, method);
    return { success: true, result };
  } catch (err) {
    console.error('encrypt-text failed:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('decrypt-text', (event, cipherText, password) => {
  try {
    const result = doDecryptText(cipherText, password);
    return { success: true, result };
  } catch (err) {
    console.error('decrypt-text failed:', err);
    return { success: false, error: mt('解密失败：密码错误或密文已损坏') };
  }
});

// ================= 屏幕取色 =================
ipcMain.handle('pick-screen-color', () => pickScreenColor());

ipcMain.on('color-picked', (event, hex) => {
  closeColorPicker();
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.send('color-pick-result', { hex });
  }
});

ipcMain.on('color-pick-cancel', () => {
  closeColorPicker();
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
});

// ================= 二维码生成 =================
const QRCode = require('qrcode');

ipcMain.handle('generate-qr-code', async (event, text, size) => {
  try {
    const width = Math.max(100, Math.min(2000, parseInt(size) || 400));
    const dataUrl = await QRCode.toDataURL(text, {
      width,
      margin: 2,
      errorCorrectionLevel: 'M',
      type: 'image/png'
    });
    return { dataUrl };
  } catch (err) {
    console.error('generate-qr-code failed:', err);
    return { error: err.message };
  }
});

ipcMain.handle('get-qr-history', () => {
  return store.get('qrHistory', []);
});

ipcMain.handle('add-qr-history', (event, text) => {
  const history = store.get('qrHistory', []);
  const filtered = history.filter(item => item.text !== text);
  filtered.unshift({ text, time: Date.now() });
  store.set('qrHistory', filtered.slice(0, 50));
  return store.get('qrHistory', []);
});

ipcMain.handle('clear-qr-history', () => {
  store.set('qrHistory', []);
  return [];
});

// ================= 图片批量处理 =================
const IMAGE_EXT_REGEX = /\.(jpe?g|png|webp|gif|bmp|tiff?)$/i;

function scanImageFiles(dir) {
  const files = [];
  function walk(current) {
    let entries;
    try {
      entries = fs.readdirSync(current);
    } catch (err) {
      return;
    }
    for (const entry of entries) {
      const full = path.join(current, entry);
      let stat;
      try {
        stat = fs.statSync(full);
      } catch (err) {
        continue;
      }
      if (stat.isDirectory()) walk(full);
      else if (IMAGE_EXT_REGEX.test(full)) files.push(full);
    }
  }
  walk(dir);
  return files;
}

function getDialogParent() {
  return (mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()) ? mainWindow : undefined;
}

ipcMain.handle('select-image-files', async () => {
  try {
    const result = await dialog.showOpenDialog(getDialogParent(), {
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: mt('图片文件'), extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff'] }]
    });
    return { canceled: result.canceled, filePaths: result.filePaths || [] };
  } catch (err) {
    console.error('select-image-files failed:', err);
    return { canceled: true, error: err.message, filePaths: [] };
  }
});

ipcMain.handle('select-image-folder', async () => {
  try {
    const result = await dialog.showOpenDialog(getDialogParent(), {
      properties: ['openDirectory']
    });
    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true, filePaths: [] };
    }
    return { canceled: false, filePaths: scanImageFiles(result.filePaths[0]) };
  } catch (err) {
    console.error('select-image-folder failed:', err);
    return { canceled: true, error: err.message, filePaths: [] };
  }
});

ipcMain.handle('select-output-dir', async () => {
  try {
    const result = await dialog.showOpenDialog(getDialogParent(), {
      properties: ['openDirectory']
    });
    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true, filePath: null };
    }
    return { canceled: false, filePath: result.filePaths[0] };
  } catch (err) {
    console.error('select-output-dir failed:', err);
    return { canceled: true, error: err.message, filePath: null };
  }
});

ipcMain.handle('read-image-data-url', async (event, filePath) => {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      throw new Error(mt('文件不存在'));
    }
    const ext = path.extname(filePath).slice(1).toLowerCase();
    const mimeMap = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
      webp: 'image/webp', gif: 'image/gif', bmp: 'image/bmp',
      tiff: 'image/tiff', tif: 'image/tiff'
    };
    const mime = mimeMap[ext] || 'image/png';
    const buffer = fs.readFileSync(filePath);
    return { success: true, dataUrl: `data:${mime};base64,${buffer.toString('base64')}` };
  } catch (err) {
    console.error('read-image-data-url failed:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('scan-dropped-paths', async (event, paths) => {
  const files = [];
  for (const p of paths) {
    if (!p) continue;
    let stat;
    try {
      stat = fs.statSync(p);
    } catch (err) {
      continue;
    }
    if (stat.isDirectory()) {
      files.push(...scanImageFiles(p));
    } else if (IMAGE_EXT_REGEX.test(p)) {
      files.push(p);
    }
  }
  return { filePaths: [...new Set(files)] };
});

ipcMain.handle('process-images', async (event, options) => {
  if (!sharp) {
    event.sender.send('image-batch-complete', { success: false, error: mt('图片处理库未加载，请查看主进程日志') });
    return;
  }
  const { inputPaths, format, quality, width, height, keepRatio, outputMode, customDir } = options;
  if (!inputPaths || inputPaths.length === 0) {
    event.sender.send('image-batch-complete', { success: false, error: mt('没有选择图片') });
    return;
  }

  if (outputMode === 'custom' && !customDir) {
    event.sender.send('image-batch-complete', { success: false, error: mt('未选择自定义输出目录') });
    return;
  }

  const errors = [];
  let successCount = 0;
  let failedCount = 0;
  const outputDirs = new Set();

  for (let i = 0; i < inputPaths.length; i++) {
    const inputPath = inputPaths[i];
    event.sender.send('image-batch-progress', { current: i + 1, total: inputPaths.length, file: inputPath });

    try {
      const originalExt = path.extname(inputPath).slice(1).toLowerCase();
      const targetFormat = format === 'original' ? originalExt : format;
      const outputExt = targetFormat === 'jpeg' ? 'jpg' : targetFormat;
      const baseName = path.basename(inputPath, path.extname(inputPath));

      let outputPath;
      let tempReplace = false;
      if (outputMode === 'overwrite') {
        // sharp 不允许输入输出同名，格式未变时需中转临时文件再覆盖
        const candidate = path.join(path.dirname(inputPath), `${baseName}.${outputExt}`);
        if (path.resolve(candidate) === path.resolve(inputPath)) {
          outputPath = inputPath + '.toolbox-tmp';
          tempReplace = true;
        } else {
          outputPath = candidate;
        }
      } else if (outputMode === 'custom' && customDir) {
        if (!fs.existsSync(customDir)) {
          fs.mkdirSync(customDir, { recursive: true });
        }
        outputPath = path.join(customDir, `${baseName}.${outputExt}`);
        outputDirs.add(customDir);
      } else {
        const outputDir = path.join(path.dirname(inputPath), 'output');
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        outputPath = path.join(outputDir, `${baseName}.${outputExt}`);
        outputDirs.add(outputDir);
      }

      const isAnimatedGif = targetFormat === 'gif';
      let transformer = sharp(inputPath, { animated: isAnimatedGif });

      const resizeWidth = width > 0 ? width : undefined;
      const resizeHeight = height > 0 ? height : undefined;
      if (resizeWidth || resizeHeight) {
        transformer = transformer.resize({
          width: resizeWidth,
          height: resizeHeight,
          fit: keepRatio ? 'inside' : 'fill',
          withoutEnlargement: true
        });
      }

      if (targetFormat === 'jpeg' || targetFormat === 'jpg') {
        transformer = transformer.jpeg({ quality, mozjpeg: true });
      } else if (targetFormat === 'png') {
        transformer = transformer.png({ compressionLevel: Math.max(0, Math.min(9, Math.round((100 - quality) / 11))) });
      } else if (targetFormat === 'webp') {
        transformer = transformer.webp({ quality });
      } else if (targetFormat === 'gif') {
        transformer = transformer.gif();
      } else if (targetFormat === 'tiff') {
        transformer = transformer.tiff({ quality });
      }

      await transformer.toFile(outputPath);

      if (tempReplace) {
        fs.copyFileSync(outputPath, inputPath);
        fs.unlinkSync(outputPath);
      }
      successCount++;
    } catch (err) {
      failedCount++;
      errors.push(`${path.basename(inputPath)}: ${err.message}`);
    }
  }

  event.sender.send('image-batch-complete', {
    success: true,
    total: inputPaths.length,
    successCount,
    failedCount,
    outputDir: outputDirs.size > 0 ? [...outputDirs][0] : path.dirname(inputPaths[0]),
    errors
  });
});

// ================= 文档转换 =================
const DOC_EXT_TO_FORMAT = {
  md: 'md', markdown: 'md',
  html: 'html', htm: 'html',
  txt: 'txt', text: 'txt',
  docx: 'docx',
  xlsx: 'xlsx', xls: 'xlsx',
  csv: 'csv',
  json: 'json',
  pdf: 'pdf'
};

function getDocFormat(ext) {
  return DOC_EXT_TO_FORMAT[ext.toLowerCase()] || '';
}

function stripHtmlTags(html) {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function escapeHtmlText(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function textToHtml(text) {
  return escapeHtmlText(text).split(/\r?\n/).map(line => line || '<br>').join('<br>');
}

function htmlToText(html) {
  return stripHtmlTags(html);
}

function mdToText(md) {
  const { marked } = require('marked');
  return stripHtmlTags(marked.parse(md || ''));
}

function textToMd(text) {
  // 转义 Markdown 特殊字符
  return text.replace(/([\\*_{}\[\]()#+\-.!`])/g, '\\$1');
}

async function createDocxFromText(text, outputPath) {
  if (!docxLib) throw new Error(mt('docx 库未加载'));
  const { Document, Packer, Paragraph } = docxLib;
  const paragraphs = (text || '').split(/\r?\n/).map(line => new Paragraph(line));
  const doc = new Document({ sections: [{ children: paragraphs }] });
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
}

async function createDocxFromHtml(html, outputPath) {
  if (!docxLib) throw new Error(mt('docx 库未加载'));
  const { Document, Packer, Paragraph } = docxLib;
  const text = htmlToText(html);
  const paragraphs = text.split(/\r?\n/).map(line => new Paragraph(line));
  const doc = new Document({ sections: [{ children: paragraphs }] });
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
}

async function convertDocxToHtml(inputPath) {
  if (!mammoth) throw new Error(mt('mammoth 库未加载'));
  const result = await mammoth.convertToHtml({ path: inputPath });
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Converted</title></head><body>${result.value}</body></html>`;
}

async function convertDocxToText(inputPath) {
  if (!mammoth) throw new Error(mt('mammoth 库未加载'));
  const result = await mammoth.extractRawText({ path: inputPath });
  return result.value;
}

function htmlToMarkdown(html) {
  if (!TurndownService) throw new Error(mt('turndown 库未加载'));
  const service = new TurndownService();
  return service.turndown(html);
}

async function convertXlsx(inputPath, targetFormat) {
  if (!XLSX) throw new Error(mt('xlsx 库未加载'));
  const workbook = XLSX.readFile(inputPath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  if (targetFormat === 'csv') {
    return XLSX.utils.sheet_to_csv(worksheet);
  } else if (targetFormat === 'json') {
    const json = XLSX.utils.sheet_to_json(worksheet);
    return JSON.stringify(json, null, 2);
  } else if (targetFormat === 'txt') {
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    return rows.map(row => row.join('\t')).join('\n');
  }
  throw new Error(mt('不支持的 Excel 输出格式'));
}

async function convertCsv(inputPath, targetFormat, outputPath) {
  if (!XLSX) throw new Error(mt('xlsx 库未加载'));
  const workbook = XLSX.readFile(inputPath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  if (targetFormat === 'json') {
    const json = XLSX.utils.sheet_to_json(worksheet);
    return JSON.stringify(json, null, 2);
  } else if (targetFormat === 'xlsx') {
    const newWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWorkbook, worksheet, 'Sheet1');
    XLSX.writeFile(newWorkbook, outputPath);
    return null;
  }
  throw new Error(mt('不支持的 CSV 输出格式'));
}

async function convertJson(inputPath, targetFormat, outputPath) {
  const text = fs.readFileSync(inputPath, 'utf8');
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error(mt('JSON 解析失败：') + e.message);
  }
  if (targetFormat === 'txt') {
    return JSON.stringify(data, null, 2);
  } else if (targetFormat === 'csv') {
    if (!Array.isArray(data)) throw new Error(mt('JSON 转 CSV 需要数组结构'));
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const lines = [headers.join(',')];
    for (const row of data) {
      lines.push(headers.map(h => {
        const val = row[h] === undefined || row[h] === null ? '' : String(row[h]);
        return `"${val.replace(/"/g, '""')}"`;
      }).join(','));
    }
    return lines.join('\n');
  } else if (targetFormat === 'xlsx') {
    if (!XLSX) throw new Error(mt('xlsx 库未加载'));
    const worksheet = XLSX.utils.json_to_sheet(Array.isArray(data) ? data : [data]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, outputPath);
    return null;
  }
  throw new Error(mt('不支持的 JSON 输出格式'));
}

async function convertPdfToText(inputPath) {
  if (!pdfParse) throw new Error(mt('pdf-parse 库未加载'));
  const buffer = fs.readFileSync(inputPath);
  const data = await pdfParse(buffer);
  return data.text;
}

async function doConvertDocument(inputPath, sourceFormat, targetFormat, outputPath) {
  const { marked } = require('marked');

  if (sourceFormat === 'md') {
    const text = fs.readFileSync(inputPath, 'utf8');
    if (targetFormat === 'html') {
      fs.writeFileSync(outputPath, marked.parse(text), 'utf8');
    } else if (targetFormat === 'txt') {
      fs.writeFileSync(outputPath, mdToText(text), 'utf8');
    } else if (targetFormat === 'docx') {
      await createDocxFromText(mdToText(text), outputPath);
    }
  } else if (sourceFormat === 'html') {
    const text = fs.readFileSync(inputPath, 'utf8');
    if (targetFormat === 'md') {
      fs.writeFileSync(outputPath, htmlToMarkdown(text), 'utf8');
    } else if (targetFormat === 'txt') {
      fs.writeFileSync(outputPath, htmlToText(text), 'utf8');
    } else if (targetFormat === 'docx') {
      await createDocxFromHtml(text, outputPath);
    }
  } else if (sourceFormat === 'txt') {
    const text = fs.readFileSync(inputPath, 'utf8');
    if (targetFormat === 'md') {
      fs.writeFileSync(outputPath, textToMd(text), 'utf8');
    } else if (targetFormat === 'html') {
      fs.writeFileSync(outputPath, textToHtml(text), 'utf8');
    } else if (targetFormat === 'docx') {
      await createDocxFromText(text, outputPath);
    }
  } else if (sourceFormat === 'docx') {
    if (targetFormat === 'html') {
      fs.writeFileSync(outputPath, await convertDocxToHtml(inputPath), 'utf8');
    } else if (targetFormat === 'md') {
      const html = await convertDocxToHtml(inputPath);
      fs.writeFileSync(outputPath, htmlToMarkdown(html), 'utf8');
    } else if (targetFormat === 'txt') {
      fs.writeFileSync(outputPath, await convertDocxToText(inputPath), 'utf8');
    }
  } else if (sourceFormat === 'xlsx') {
    const result = await convertXlsx(inputPath, targetFormat);
    if (result !== null) fs.writeFileSync(outputPath, result, 'utf8');
  } else if (sourceFormat === 'csv') {
    if (targetFormat === 'json') {
      const result = await convertCsv(inputPath, targetFormat, outputPath);
      fs.writeFileSync(outputPath, result, 'utf8');
    } else if (targetFormat === 'xlsx') {
      await convertCsv(inputPath, targetFormat, outputPath);
    }
  } else if (sourceFormat === 'json') {
    const result = await convertJson(inputPath, targetFormat, outputPath);
    if (result !== null) fs.writeFileSync(outputPath, result, 'utf8');
  } else if (sourceFormat === 'pdf') {
    if (targetFormat === 'txt') {
      fs.writeFileSync(outputPath, await convertPdfToText(inputPath), 'utf8');
    }
  } else {
    throw new Error(mt('不支持的源格式'));
  }
}

// ================= LibreOffice 文档转换 =================
const LIBRE_OFFICE_CANDIDATES = [
  // Windows
  'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
  'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
  // macOS
  '/Applications/LibreOffice.app/Contents/MacOS/soffice',
  '/usr/bin/soffice',
  // Linux
  '/usr/bin/soffice',
  '/usr/lib/libreoffice/program/soffice',
  '/usr/lib64/libreoffice/program/soffice'
];

let libreOfficePath = null;

function findLibreOffice() {
  if (libreOfficePath && fs.existsSync(libreOfficePath)) return libreOfficePath;
  for (const candidate of LIBRE_OFFICE_CANDIDATES) {
    if (fs.existsSync(candidate)) {
      libreOfficePath = candidate;
      return candidate;
    }
  }
  // 尝试 PATH 中的 soffice
  try {
    const { execSync } = require('child_process');
    if (process.platform !== 'win32') {
      const result = execSync('which soffice', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
      if (result && fs.existsSync(result)) {
        libreOfficePath = result;
        return result;
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
}

function isLibreOfficeSource(format) {
  return ['docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 'odt', 'ods', 'odp', 'rtf'].includes(format);
}

async function convertWithLibreOffice(inputPath, targetFormat, outputPath) {
  const soffice = findLibreOffice();
  if (!soffice) {
    throw new Error(mt('未检测到 LibreOffice，请先安装 LibreOffice（https://www.libreoffice.org/download/download）'));
  }

  const outputDir = path.dirname(outputPath);
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const tempName = `${baseName}.${targetFormat}`;
  const tempPath = path.join(outputDir, tempName);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 如果临时输出路径和最终路径不同，先删除可能存在的临时文件
  if (tempPath !== outputPath && fs.existsSync(tempPath)) {
    fs.unlinkSync(tempPath);
  }

  await execFileAsync(soffice, [
    '--headless',
    '--convert-to', targetFormat,
    '--outdir', outputDir,
    inputPath
  ]);

  if (!fs.existsSync(tempPath)) {
    throw new Error(mt('LibreOffice 转换失败，未生成输出文件'));
  }

  // 如果用户自定义了输出文件名（理论上这里不会），需要重命名
  if (tempPath !== outputPath) {
    fs.renameSync(tempPath, outputPath);
  }
}

// ================= Python 文档转换后端 =================
function getPythonExecutablePath() {
  // 优先使用打包后的 Python 运行时（生产环境）
  const packagedPython = path.join(process.resourcesPath, 'python', 'runtime', 'python.exe');
  if (fs.existsSync(packagedPython)) {
    return packagedPython;
  }

  // 开发环境：检查项目内的 runtime 目录
  const devRuntime = path.join(__dirname, 'python', 'runtime', 'python.exe');
  if (fs.existsSync(devRuntime)) {
    return devRuntime;
  }

  // 开发环境回退到系统 Python
  return process.platform === 'win32' ? 'python' : 'python3';
}

function getConvertScriptPath() {
  // 生产环境脚本路径
  const packagedScript = path.join(process.resourcesPath, 'python', 'convert.py');
  if (fs.existsSync(packagedScript)) {
    return packagedScript;
  }
  // 开发环境脚本路径
  return path.join(__dirname, 'python', 'convert.py');
}

function callPython(args, options = {}) {
  const python = getPythonExecutablePath();
  const script = getConvertScriptPath();
  const timeout = options.timeout || 120000;

  return new Promise((resolve, reject) => {
    execFile(python, [script, ...args], {
      timeout,
      maxBuffer: 50 * 1024 * 1024,
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
        PYTHONUTF8: '1'
      }
    }, (error, stdout, stderr) => {
      if (error) {
        const errMsg = (stderr && stderr.trim()) || error.message;
        reject(new Error(errMsg));
        return;
      }
      try {
        const result = JSON.parse(stdout);
        if (!result.success) {
          reject(new Error(result.error || mt('Python 转换失败')));
        } else {
          resolve(result.data);
        }
      } catch (e) {
        reject(new Error(mt('Python 输出解析失败: ') + stdout));
      }
    });
  });
}

async function checkPythonBackend() {
  try {
    return await callPython(['health'], { timeout: 10000 });
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

const PYTHON_SUPPORTED_CONVERSIONS = {
  pdf: ['docx', 'md', 'html', 'txt'],
  docx: ['md', 'html', 'txt'],
  pptx: ['md', 'html', 'txt'],
  xlsx: ['md', 'html', 'csv', 'json', 'txt']
};

function isPythonConversion(sourceFormat, targetFormat) {
  return PYTHON_SUPPORTED_CONVERSIONS[sourceFormat]?.includes(targetFormat) || false;
}

async function convertWithPython(inputPath, sourceFormat, targetFormat, outputPath) {
  await callPython(['convert', inputPath, sourceFormat, targetFormat, outputPath]);
}

ipcMain.handle('python-backend-health', async () => {
  return checkPythonBackend();
});

// ================= 文档转换对话框 =================
ipcMain.handle('select-document-file', async () => {
  try {
    const result = await dialog.showOpenDialog(getDialogParent(), {
      properties: ['openFile'],
      filters: [
        { name: mt('所有支持的文档'), extensions: ['md', 'markdown', 'html', 'htm', 'txt', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp', 'rtf', 'csv', 'json', 'pdf'] },
        { name: 'Markdown', extensions: ['md', 'markdown'] },
        { name: 'HTML', extensions: ['html', 'htm'] },
        { name: 'Word / Writer', extensions: ['doc', 'docx', 'odt', 'rtf'] },
        { name: 'Excel / Calc', extensions: ['xls', 'xlsx', 'ods', 'csv'] },
        { name: 'PPT / Impress', extensions: ['ppt', 'pptx', 'odp'] },
        { name: 'JSON', extensions: ['json'] },
        { name: 'PDF', extensions: ['pdf'] },
        { name: mt('纯文本'), extensions: ['txt'] }
      ]
    });
    return { canceled: result.canceled, filePath: result.filePaths[0] || null };
  } catch (err) {
    console.error('select-document-file failed:', err);
    return { canceled: true, error: err.message };
  }
});

ipcMain.handle('select-doc-output-dir', async () => {
  try {
    const result = await dialog.showOpenDialog(getDialogParent(), {
      properties: ['openDirectory']
    });
    return { canceled: result.canceled, filePath: result.filePaths[0] || null };
  } catch (err) {
    console.error('select-doc-output-dir failed:', err);
    return { canceled: true, error: err.message };
  }
});

ipcMain.handle('convert-document', async (event, options) => {
  try {
    const { inputPath, sourceFormat, targetFormat, outputMode, customDir } = options;
    if (!inputPath || !sourceFormat || !targetFormat) throw new Error(mt('参数不完整'));

    const extMap = { md: 'md', html: 'html', txt: 'txt', docx: 'docx', xlsx: 'xlsx', csv: 'csv', json: 'json', pdf: 'pdf' };
    const outputExt = extMap[targetFormat];
    if (!outputExt) throw new Error(mt('不支持的目标格式'));

    const baseName = path.basename(inputPath, path.extname(inputPath));
    let outputPath;
    if (outputMode === 'custom' && customDir) {
      if (!fs.existsSync(customDir)) fs.mkdirSync(customDir, { recursive: true });
      outputPath = path.join(customDir, `${baseName}.${outputExt}`);
    } else {
      outputPath = path.join(path.dirname(inputPath), `${baseName}.${outputExt}`);
    }

    // 优先使用 Python 后端处理支持的转换（表格/排版保留更好）
    if (isPythonConversion(sourceFormat, targetFormat)) {
      try {
        await convertWithPython(inputPath, sourceFormat, targetFormat, outputPath);
        return { outputPath };
      } catch (pyErr) {
        console.error(mt('[convert-document] Python 转换失败，回退到原生/LibreOffice:') + pyErr.message);
        // 继续走后续回退逻辑
      }
    }

    // Office 文档转 PDF 等格式走 LibreOffice
    // docx/xlsx 除 PDF 外保持原生转换；其余 Office 格式（doc/xls/ppt/odt/ods/odp/rtf）统一走 LibreOffice
    if ((isLibreOfficeSource(sourceFormat) && !['docx', 'xlsx'].includes(sourceFormat)) ||
        (targetFormat === 'pdf' && isLibreOfficeSource(sourceFormat))) {
      await convertWithLibreOffice(inputPath, targetFormat, outputPath);
    } else {
      await doConvertDocument(inputPath, sourceFormat, targetFormat, outputPath);
    }
    return { outputPath };
  } catch (err) {
    console.error('convert-document failed:', err);
    return { error: err.message };
  }
});

// ================= PDF 工具箱 =================
ipcMain.handle('select-pdf-files', async () => {
  try {
    const result = await dialog.showOpenDialog(getDialogParent(), {
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: mt('PDF 文件'), extensions: ['pdf'] }]
    });
    return { canceled: result.canceled, filePaths: result.filePaths || [] };
  } catch (err) {
    console.error('select-pdf-files failed:', err);
    return { canceled: true, error: err.message, filePaths: [] };
  }
});

ipcMain.handle('pdf-toolkit', async (event, { action, params }) => {
  try {
    return await callPython(['pdf-toolkit', action, ...params], { timeout: 300000 });
  } catch (err) {
    console.error('[pdf-toolkit] failed:', err.message);
    return { error: err.message };
  }
});

ipcMain.handle('capture-screen', async () => {
  takeScreenshot('region');
  return null;
});

ipcMain.on('screenshot-region', async (event, region) => {
  if (!screenshotOverlay) return;

  const { desktopCapturer } = require('electron');
  const display = screen.getPrimaryDisplay();
  const scaleFactor = display.scaleFactor || 1;

  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: Math.floor(display.size.width * scaleFactor), height: Math.floor(display.size.height * scaleFactor) }
    });

    if (sources.length === 0) throw new Error('No screen source found');

    const fullImage = sources[0].thumbnail;
    const x = Math.max(0, Math.round(region.x * scaleFactor));
    const y = Math.max(0, Math.round(region.y * scaleFactor));
    const maxW = fullImage.getSize().width;
    const maxH = fullImage.getSize().height;
    const cropped = fullImage.crop({
      x,
      y,
      width: Math.min(Math.round(region.width * scaleFactor), maxW - x),
      height: Math.min(Math.round(region.height * scaleFactor), maxH - y)
    });

    const dataUrl = cropped.toDataURL();

    // 截图完成后自动写入剪贴板
    clipboard.writeImage(cropped);

    screenshotOverlay.close();
    screenshotOverlay = null;

    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send('screenshot-result', dataUrl);
    }
  } catch (err) {
    console.error('Failed to capture region:', err);
    if (screenshotOverlay) {
      screenshotOverlay.close();
      screenshotOverlay = null;
    }
  }
});

ipcMain.on('screenshot-cancel', () => {
  if (screenshotOverlay) {
    screenshotOverlay.close();
    screenshotOverlay = null;
  }
});

// ================= 长截图 =================
function createLongScreenshotOverlay() {
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;

  longScreenshotOverlay = new BrowserWindow({
    width,
    height,
    x: display.workArea.x,
    y: display.workArea.y,
    fullscreen: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    focusable: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  longScreenshotOverlay.loadFile(path.join(__dirname, 'long-screenshot-overlay.html'));
  longScreenshotOverlay.setMenu(null);
  longScreenshotOverlay.setFullScreen(true);
  longScreenshotOverlay.setIgnoreMouseEvents(false);

  longScreenshotOverlay.on('closed', () => {
    longScreenshotOverlay = null;
    cleanupLongScreenshotSession();
  });
}

function cleanupLongScreenshotSession() {
  if (longScreenshotSession) {
    if (longScreenshotSession.timer) {
      clearTimeout(longScreenshotSession.timer);
    }
    longScreenshotSession = null;
  }
  // Unregister long screenshot global shortcuts
  try {
    if (globalShortcut.isRegistered('F9')) globalShortcut.unregister('F9');
    if (globalShortcut.isRegistered('F10')) globalShortcut.unregister('F10');
  } catch (err) {
    console.error('[long-screenshot] failed to unregister global shortcuts:', err);
  }
}

async function captureLongScreenshotFrame() {
  if (!longScreenshotSession || !longScreenshotOverlay) return;

  const { desktopCapturer } = require('electron');
  const display = screen.getPrimaryDisplay();
  const scaleFactor = display.scaleFactor || 1;
  const { region } = longScreenshotSession;

  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: {
        width: Math.floor(display.size.width * scaleFactor),
        height: Math.floor(display.size.height * scaleFactor)
      }
    });

    if (sources.length === 0) return;

    // Re-check session after async operation (might have been cleared by F9)
    if (!longScreenshotSession) return;

    const fullImage = sources[0].thumbnail;
    const x = Math.max(0, Math.round(region.x * scaleFactor));
    const y = Math.max(0, Math.round(region.y * scaleFactor));
    const maxW = fullImage.getSize().width;
    const maxH = fullImage.getSize().height;

    const cropped = fullImage.crop({
      x,
      y,
      width: Math.min(Math.round(region.width * scaleFactor), maxW - x),
      height: Math.min(Math.round(region.height * scaleFactor), maxH - y)
    });

    // Compute a quick hash of the frame to detect duplicates
    const pngBuffer = cropped.toPNG();
    const frameHash = quickImageHash(pngBuffer);

    // Skip if identical to the previous frame (user didn't scroll)
    if (longScreenshotSession.lastHash && frameHash === longScreenshotSession.lastHash) {
      console.log('[long-screenshot] skipped duplicate frame');
      return;
    }

    const framePath = path.join(longScreenshotSession.tempDir, `frame_${String(longScreenshotSession.frameCount).padStart(4, '0')}.png`);
    fs.writeFileSync(framePath, pngBuffer);
    longScreenshotSession.frameCount += 1;
    longScreenshotSession.frames.push(framePath);
    longScreenshotSession.lastHash = frameHash;

    console.log('[long-screenshot] captured frame', longScreenshotSession.frameCount, '->', framePath);
  } catch (err) {
    console.error('[long-screenshot] failed to capture frame:', err);
  }
}

function quickImageHash(buffer) {
  // Sample every 1000th byte for a fast fingerprint
  const step = Math.max(1, Math.floor(buffer.length / 500));
  const parts = [];
  for (let i = 0; i < buffer.length; i += step) {
    parts.push(buffer[i]);
  }
  return parts.join(',');
}

async function finishLongScreenshot() {
  if (!longScreenshotSession) return;

  const { frames, tempDir } = longScreenshotSession;

  cleanupLongScreenshotSession();

  if (longScreenshotOverlay) {
    longScreenshotOverlay.close();
    longScreenshotOverlay = null;
  }
  if (frames.length < 2) {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send('long-screenshot-error', mt('至少需要 2 张截图才能拼接'));
    }
    return;
  }

  const outputPath = path.join(tempDir, 'long_screenshot_result.png');

  try {
    await callPython(['long-screenshot', outputPath, ...frames]);
    const dataUrl = `data:image/png;base64,${fs.readFileSync(outputPath).toString('base64')}`;

    // 拼接完成后自动写入剪贴板
    clipboard.writeImage(nativeImage.createFromPath(outputPath));

    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send('long-screenshot-result', dataUrl);
    }
  } catch (err) {
    console.error('[long-screenshot] stitch failed:', err);
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send('long-screenshot-error', mt('拼接失败：') + err.message);
    }
  }
}

ipcMain.handle('start-long-screenshot', async () => {
  if (longScreenshotOverlay) return;
  if (mainWindow) {
    mainWindow.hide();
  }
  createLongScreenshotOverlay();
});

ipcMain.on('long-screenshot-start', async (event, region) => {
  if (!longScreenshotOverlay) return;

  const tempDir = path.join(os.tmpdir(), `toolbox-long-screenshot-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  longScreenshotSession = {
    region,
    tempDir,
    frames: [],
    frameCount: 0,
    timer: null,
    lastHash: null,
    capturing: false
  };

  // Capture first frame immediately
  await captureLongScreenshotFrame();

  // Then capture using recursive setTimeout (waits for each capture to finish)
  longScreenshotSession.timer = setTimeout(function tick() {
    if (!longScreenshotSession || longScreenshotSession.capturing) {
      // Previous capture still running, try again shortly
      if (longScreenshotSession) {
        longScreenshotSession.timer = setTimeout(tick, 200);
      }
      return;
    }
    longScreenshotSession.capturing = true;
    captureLongScreenshotFrame().then(() => {
      if (longScreenshotSession) {
        longScreenshotSession.capturing = false;
        longScreenshotSession.timer = setTimeout(tick, 600);
      }
    });
  }, 600);

  // Make overlay mouse-transparent so user can scroll the target window
  longScreenshotOverlay.setIgnoreMouseEvents(true, { forward: true });

  // Register global shortcuts so user can stop/cancel even when target window is focused
  try {
    globalShortcut.register('F9', () => {
      if (longScreenshotSession) finishLongScreenshot();
    });
    globalShortcut.register('F10', () => {
      if (longScreenshotSession) {
        cleanupLongScreenshotSession();
        if (longScreenshotOverlay) {
          longScreenshotOverlay.close();
          longScreenshotOverlay = null;
        }
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    });
  } catch (err) {
    console.error('[long-screenshot] failed to register global shortcuts:', err);
  }
});

ipcMain.on('long-screenshot-stop', async () => {
  await finishLongScreenshot();
});

ipcMain.on('long-screenshot-cancel', () => {
  cleanupLongScreenshotSession();
  if (longScreenshotOverlay) {
    longScreenshotOverlay.close();
    longScreenshotOverlay = null;
  }
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
});

// ================= OCR 文字识别 =================
function normalizeOcrText(text) {
  if (!text) return '';
  let s = text;
  // Windows OCR 会在相邻中文字符之间插入空格，这里把它们合并
  do {
    const next = s.replace(/([\u4e00-\u9fa5])\s+([\u4e00-\u9fa5])/g, '$1$2');
    if (next === s) break;
    s = next;
  } while (true);
  return s.trim();
}

async function recognizeImageWithWindowsOcr(dataUrl, language = 'zh-CN') {
  if (!windowsMediaOcr) throw new Error(mt('Windows OCR 库未加载'));
  const { ocr } = windowsMediaOcr;
  const image = nativeImage.createFromDataURL(dataUrl);
  const buffer = image.toPNG();
  const tempPath = path.join(app.getPath('temp'), `toolbox-ocr-${Date.now()}-${Math.random().toString(36).slice(2)}.png`);
  fs.writeFileSync(tempPath, buffer);
  try {
    const result = await ocr(tempPath, { language });
    return (result && result.Text) || '';
  } finally {
    try { fs.unlinkSync(tempPath); } catch (e) { /* ignore */ }
  }
}

async function recognizeImageWithTesseract(dataUrl, langs = 'chi_sim+eng') {
  if (!tesseract) throw new Error(mt('OCR 库未加载，请检查 tesseract.js 是否安装'));
  const { createWorker, OEM } = tesseract;
  const worker = await createWorker(langs, OEM.LSTM_ONLY, {
    logger: (m) => console.log('[tesseract]', m.status, m.progress),
    errorHandler: (err) => console.error('[tesseract] worker error:', err)
  });
  try {
    const { data: { text } } = await worker.recognize(dataUrl);
    return text || '';
  } finally {
    await worker.terminate();
  }
}

async function recognizeImageWithPython(dataUrl, modelType = 'mobile') {
  // 将 dataUrl 写入临时文件，调用 Python RapidOCR 进行识别
  const image = nativeImage.createFromDataURL(dataUrl);
  const buffer = image.toPNG();
  const tempPath = path.join(app.getPath('temp'), `toolbox-ocr-${Date.now()}-${Math.random().toString(36).slice(2)}.png`);
  fs.writeFileSync(tempPath, buffer);
  try {
    const result = await callPython(['ocr', tempPath, modelType], { timeout: 60000 });
    return (result && result.text) || '';
  } finally {
    try { fs.unlinkSync(tempPath); } catch (e) { /* ignore */ }
  }
}

async function recognizeImage(dataUrl, options = {}) {
  const { language = 'zh-CN', langs = 'chi_sim+eng', modelType = 'mobile' } = options;

  // 最高优先级：Python RapidOCR（PP-OCRv4，精度最高）
  try {
    const text = await recognizeImageWithPython(dataUrl, modelType);
    if (text && text.length > 0) {
      console.log('[ocr] recognized by Python RapidOCR, length:', text.length);
      return { engine: 'rapidocr', text };
    }
    console.log('[ocr] Python RapidOCR returned empty, fallback to Windows OCR');
  } catch (err) {
    console.error('[ocr] Python RapidOCR failed, fallback to Windows OCR:', err.message);
  }

  // 其次使用 Windows 原生 OCR
  if (windowsMediaOcr) {
    try {
      const text = normalizeOcrText(await recognizeImageWithWindowsOcr(dataUrl, language));
      if (text && text.length > 0) {
        console.log('[ocr] recognized by Windows OCR, length:', text.length);
        return { engine: 'windows', text };
      }
      console.log('[ocr] Windows OCR returned empty, fallback to tesseract.js');
    } catch (err) {
      console.error('[ocr] Windows OCR failed, fallback to tesseract.js:', err.message);
    }
  }

  // 最后使用 tesseract.js
  if (tesseract) {
    const text = normalizeOcrText(await recognizeImageWithTesseract(dataUrl, langs));
    console.log('[ocr] recognized by tesseract.js, length:', text.length);
    return { engine: 'tesseract', text };
  }

  throw new Error(mt('没有可用的 OCR 引擎'));
}

ipcMain.handle('ocr-recognize', async (event, dataUrl, langs, modelType) => {
  try {
    const { text, engine } = await recognizeImage(dataUrl, { language: 'zh-CN', langs, modelType });
    return { success: true, text, engine };
  } catch (err) {
    console.error('ocr-recognize failed:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.on('screenshot-ocr-region', async (event, region) => {
  if (!screenshotOverlay) return;

  const { desktopCapturer } = require('electron');
  const display = screen.getPrimaryDisplay();
  const scaleFactor = display.scaleFactor || 1;

  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: Math.floor(display.size.width * scaleFactor), height: Math.floor(display.size.height * scaleFactor) }
    });

    if (sources.length === 0) throw new Error('No screen source found');

    const fullImage = sources[0].thumbnail;
    const x = Math.max(0, Math.round(region.x * scaleFactor));
    const y = Math.max(0, Math.round(region.y * scaleFactor));
    const maxW = fullImage.getSize().width;
    const maxH = fullImage.getSize().height;
    const cropped = fullImage.crop({
      x,
      y,
      width: Math.min(Math.round(region.width * scaleFactor), maxW - x),
      height: Math.min(Math.round(region.height * scaleFactor), maxH - y)
    });

    const dataUrl = cropped.toDataURL();

    screenshotOverlay.close();
    screenshotOverlay = null;

    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }

    const { text } = await recognizeImage(dataUrl, { language: 'zh-CN' });
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('ocr-result', { success: true, text, dataUrl });
    }
  } catch (err) {
    console.error('Failed to OCR region:', err);
    if (screenshotOverlay) {
      screenshotOverlay.close();
      screenshotOverlay = null;
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send('ocr-result', { success: false, error: err.message });
    }
  }
});

// ================= 加密相册 =================
const VIDEO_THUMB_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" fill="#334155"/><circle cx="80" cy="80" r="36" fill="none" stroke="#f8fafc" stroke-width="4"/><polygon points="68,62 108,80 68,98" fill="#f8fafc"/></svg>`;
const VIDEO_THUMB_DATA_URL = 'data:image/svg+xml;base64,' + Buffer.from(VIDEO_THUMB_SVG).toString('base64');

const MEDIA_VAULT_DIR = path.join(app.getPath('userData'), 'media-vault');
const MEDIA_VAULT_FILES_DIR = path.join(MEDIA_VAULT_DIR, 'files');

function ensureMediaVaultDirs() {
  if (!fs.existsSync(MEDIA_VAULT_FILES_DIR)) {
    fs.mkdirSync(MEDIA_VAULT_FILES_DIR, { recursive: true });
  }
}

function deriveVaultKey(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
}

function hashVaultPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('base64');
}

function encryptWithVaultKey(data, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]);
}

function decryptWithVaultKey(data, key) {
  const iv = data.slice(0, 16);
  const authTag = data.slice(16, 32);
  const encrypted = data.slice(32);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

function getMasterKey() {
  const mk = store.get('mediaVault.masterKey');
  if (mk) return Buffer.from(mk, 'base64');
  const key = crypto.randomBytes(32);
  store.set('mediaVault.masterKey', key.toString('base64'));
  return key;
}

function isVaultLocked() {
  return !!store.get('mediaVault.passwordHash');
}

function getVaultKeyForSession(password) {
  if (password) {
    const salt = Buffer.from(store.get('mediaVault.salt'), 'base64');
    return deriveVaultKey(password, salt);
  }
  if (!isVaultLocked()) return getMasterKey();
  throw new Error(mt('需要密码'));
}

function loadVaultMetadata(password) {
  const key = getVaultKeyForSession(password);
  const encrypted = Buffer.from(store.get('mediaVault.metadata'), 'base64');
  const json = decryptWithVaultKey(encrypted, key).toString('utf8');
  return JSON.parse(json);
}

function saveVaultMetadata(metadata, password) {
  const key = getVaultKeyForSession(password);
  const encrypted = encryptWithVaultKey(Buffer.from(JSON.stringify(metadata), 'utf8'), key);
  store.set('mediaVault.metadata', encrypted.toString('base64'));
}

async function reencryptAllFiles(oldKey, newKey) {
  ensureMediaVaultDirs();
  const files = fs.readdirSync(MEDIA_VAULT_FILES_DIR);
  for (const file of files) {
    if (!file.endsWith('.enc')) continue;
    const filePath = path.join(MEDIA_VAULT_FILES_DIR, file);
    const encrypted = fs.readFileSync(filePath);
    const decrypted = decryptWithVaultKey(encrypted, oldKey);
    const reEncrypted = encryptWithVaultKey(decrypted, newKey);
    fs.writeFileSync(filePath, reEncrypted);
  }
}

ipcMain.handle('media-vault:is-locked', () => {
  return isVaultLocked();
});

ipcMain.handle('media-vault:is-initialized', () => {
  return !!store.get('mediaVault.metadata');
});

ipcMain.handle('media-vault:setup-password', (event, password) => {
  try {
    if (isVaultLocked()) return { success: false, error: mt('已设置密码') };
    const salt = crypto.randomBytes(32);
    const passwordHash = hashVaultPassword(password, salt);
    const key = deriveVaultKey(password, salt);
    let metadata;
    if (store.get('mediaVault.metadata')) {
      metadata = loadVaultMetadata(null);
      store.delete('mediaVault.masterKey');
    } else {
      metadata = { categories: [], media: [] };
    }
    const encrypted = encryptWithVaultKey(Buffer.from(JSON.stringify(metadata), 'utf8'), key);
    store.set('mediaVault.salt', salt.toString('base64'));
    store.set('mediaVault.passwordHash', passwordHash);
    store.set('mediaVault.metadata', encrypted.toString('base64'));
    ensureMediaVaultDirs();
    return { success: true, locked: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('media-vault:setup-unlocked', () => {
  try {
    if (store.get('mediaVault.metadata')) return { success: false, error: mt('相册已初始化') };
    const key = getMasterKey();
    const metadata = { categories: [], media: [] };
    const encrypted = encryptWithVaultKey(Buffer.from(JSON.stringify(metadata), 'utf8'), key);
    store.set('mediaVault.metadata', encrypted.toString('base64'));
    ensureMediaVaultDirs();
    return { success: true, locked: false };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('media-vault:verify-password', (event, password) => {
  try {
    const salt = Buffer.from(store.get('mediaVault.salt'), 'base64');
    const hash = hashVaultPassword(password, salt);
    if (hash !== store.get('mediaVault.passwordHash')) return { success: false, error: mt('密码错误') };
    loadVaultMetadata(password);
    return { success: true };
  } catch (err) {
    return { success: false, error: mt('密码错误') };
  }
});

ipcMain.handle('media-vault:get-categories', (event, password) => {
  try {
    const metadata = loadVaultMetadata(password || null);
    return { success: true, categories: metadata.categories, locked: isVaultLocked() };
  } catch (err) {
    return { success: false, error: mt('验证失败') };
  }
});

ipcMain.handle('media-vault:add-category', (event, password, name) => {
  try {
    const metadata = loadVaultMetadata(password || null);
    const id = crypto.randomUUID();
    metadata.categories.push({ id, name, createdAt: Date.now() });
    saveVaultMetadata(metadata, password || null);
    return { success: true, categories: metadata.categories, newCategoryId: id };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('media-vault:delete-category', (event, password, id) => {
  try {
    const metadata = loadVaultMetadata(password || null);
    const toDelete = metadata.media.filter(m => m.categoryId === id);
    for (const m of toDelete) {
      const filePath = path.join(MEDIA_VAULT_FILES_DIR, `${m.fileId}.enc`);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    metadata.media = metadata.media.filter(m => m.categoryId !== id);
    metadata.categories = metadata.categories.filter(c => c.id !== id);
    saveVaultMetadata(metadata, password || null);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('media-vault:add-media', async (event, password, categoryId, filePath) => {
  try {
    const metadata = loadVaultMetadata(password || null);
    const ext = path.extname(filePath).toLowerCase();
    const name = path.basename(filePath);
    const videoExts = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v', '.mpeg', '.mpg'];
    const type = videoExts.includes(ext) ? 'video' : 'image';
    const fileId = crypto.randomUUID();
    const key = getVaultKeyForSession(password || null);
    const data = fs.readFileSync(filePath);
    const encrypted = encryptWithVaultKey(data, key);
    ensureMediaVaultDirs();
    const targetPath = path.join(MEDIA_VAULT_FILES_DIR, `${fileId}.enc`);
    fs.writeFileSync(targetPath, encrypted);
    metadata.media.push({ id: crypto.randomUUID(), categoryId, name, type, fileId, size: data.length, createdAt: Date.now() });
    saveVaultMetadata(metadata, password || null);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('media-vault:get-media-list', async (event, password, categoryId) => {
  try {
    const metadata = loadVaultMetadata(password || null);
    const items = metadata.media.filter(m => m.categoryId === categoryId).sort((a, b) => b.createdAt - a.createdAt);
    const key = getVaultKeyForSession(password || null);
    const resultItems = [];
    for (const item of items) {
      const filePath = path.join(MEDIA_VAULT_FILES_DIR, `${item.fileId}.enc`);
      let thumbnailDataUrl = '';
      if (item.type === 'image' && fs.existsSync(filePath)) {
        try {
          const encrypted = fs.readFileSync(filePath);
          const decrypted = decryptWithVaultKey(encrypted, key);
          if (sharp) {
            const thumb = await sharp(decrypted, { failOnError: false }).resize(200, 200, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();
            thumbnailDataUrl = `data:image/jpeg;base64,${thumb.toString('base64')}`;
          } else {
            thumbnailDataUrl = `data:image/jpeg;base64,${decrypted.toString('base64')}`;
          }
        } catch (e) {
          thumbnailDataUrl = '';
        }
      } else if (item.type === 'video') {
        thumbnailDataUrl = VIDEO_THUMB_DATA_URL;
      }
      resultItems.push({ ...item, thumbnailDataUrl });
    }
    return { success: true, items: resultItems };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('media-vault:get-media-data', async (event, password, mediaId) => {
  try {
    const metadata = loadVaultMetadata(password || null);
    const item = metadata.media.find(m => m.id === mediaId);
    if (!item) return { success: false, error: mt('媒体不存在') };
    const filePath = path.join(MEDIA_VAULT_FILES_DIR, `${item.fileId}.enc`);
    if (!fs.existsSync(filePath)) return { success: false, error: mt('文件已丢失') };
    const key = getVaultKeyForSession(password || null);
    const encrypted = fs.readFileSync(filePath);
    const decrypted = decryptWithVaultKey(encrypted, key);
    const mime = item.type === 'video' ? 'video/mp4' : 'image/jpeg';
    const dataUrl = `data:${mime};base64,${decrypted.toString('base64')}`;
    return { success: true, dataUrl };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('media-vault:delete-media', (event, password, mediaId) => {
  try {
    const metadata = loadVaultMetadata(password || null);
    const item = metadata.media.find(m => m.id === mediaId);
    if (item) {
      const filePath = path.join(MEDIA_VAULT_FILES_DIR, `${item.fileId}.enc`);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      metadata.media = metadata.media.filter(m => m.id !== mediaId);
      saveVaultMetadata(metadata, password || null);
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('media-vault:change-password', async (event, oldPassword, newPassword) => {
  try {
    const salt = Buffer.from(store.get('mediaVault.salt'), 'base64');
    const oldHash = hashVaultPassword(oldPassword, salt);
    if (oldHash !== store.get('mediaVault.passwordHash')) return { success: false, error: mt('原密码错误') };
    const metadata = loadVaultMetadata(oldPassword);
    const newSalt = crypto.randomBytes(32);
    const newKey = deriveVaultKey(newPassword, newSalt);
    const newHash = hashVaultPassword(newPassword, newSalt);
    const oldKey = deriveVaultKey(oldPassword, salt);
    ensureMediaVaultDirs();
    await reencryptAllFiles(oldKey, newKey);
    const encryptedMetadata = encryptWithVaultKey(Buffer.from(JSON.stringify(metadata), 'utf8'), newKey);
    store.set('mediaVault.salt', newSalt.toString('base64'));
    store.set('mediaVault.passwordHash', newHash);
    store.set('mediaVault.metadata', encryptedMetadata.toString('base64'));
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('media-vault:toggle-lock', async (event, password, enable, newPassword) => {
  try {
    const currentlyLocked = isVaultLocked();
    if (enable === currentlyLocked) return { success: true, locked: currentlyLocked };
    if (enable) {
      // 不上锁 -> 上锁
      if (!newPassword || newPassword.length < 4) throw new Error(mt('新密码至少 4 位'));
      const oldKey = getMasterKey();
      const salt = crypto.randomBytes(32);
      const newKey = deriveVaultKey(newPassword, salt);
      const passwordHash = hashVaultPassword(newPassword, salt);
      const metadata = loadVaultMetadata(null);
      await reencryptAllFiles(oldKey, newKey);
      store.delete('mediaVault.masterKey');
      store.set('mediaVault.salt', salt.toString('base64'));
      store.set('mediaVault.passwordHash', passwordHash);
      saveVaultMetadata(metadata, newPassword);
      return { success: true, locked: true };
    } else {
      // 上锁 -> 不上锁
      const salt = Buffer.from(store.get('mediaVault.salt'), 'base64');
      const oldKey = deriveVaultKey(password, salt);
      const newKey = getMasterKey();
      const metadata = loadVaultMetadata(password);
      await reencryptAllFiles(oldKey, newKey);
      store.delete('mediaVault.salt');
      store.delete('mediaVault.passwordHash');
      saveVaultMetadata(metadata, null);
      return { success: true, locked: false };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('select-media-files', async () => {
  try {
    const result = await dialog.showOpenDialog(getDialogParent(), {
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: mt('图片/视频'), extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv', 'm4v', 'mpeg', 'mpg'] }]
    });
    return { canceled: result.canceled, filePaths: result.filePaths || [] };
  } catch (err) {
    return { canceled: true, error: err.message };
  }
});

app.whenReady().then(() => {
  // 备忘录已切换为 HTML 格式，清空旧 Markdown 数据（仅一次）
  if (store.get('memoFormat') !== 'html') {
    store.set('memos', []);
    store.set('memoFormat', 'html');
    console.log('[main] cleared old markdown memos, switched to html format');
  }

  createWindow();
  createTray();
  registerShortcuts();
  startClipboardWatcher();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow) {
      mainWindow.show();
    }
  });
});

app.on('window-all-closed', () => {
  // Keep app running in tray
});

app.on('before-quit', () => {
  app.isQuiting = true;
  stopClipboardWatcher();
  globalShortcut.unregisterAll();
});
