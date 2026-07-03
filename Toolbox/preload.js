const { contextBridge, ipcRenderer } = require('electron');
const { marked } = require('marked');
const jsQR = require('jsqr');

function decodeQRCodeFromDataUrl(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, canvas.width, canvas.height, { inversionAttempts: 'attemptBoth' });
      resolve(code ? code.data : null);
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

contextBridge.exposeInMainWorld('electronAPI', {
  // App
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppLocale: () => ipcRenderer.invoke('get-app-locale'),
  setAppLocale: (locale) => ipcRenderer.invoke('set-app-locale', locale),

  // Window controls
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  windowIsMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  onWindowStateChanged: (callback) => ipcRenderer.on('window-state-changed', (event, state) => callback(state)),

  // Shortcut
  getScreenshotShortcut: () => ipcRenderer.invoke('get-screenshot-shortcut'),
  setScreenshotShortcut: (accelerator) => ipcRenderer.invoke('set-screenshot-shortcut', accelerator),

  // Clipboard
  getClipboardHistory: () => ipcRenderer.invoke('get-clipboard-history'),
  clearClipboardHistory: () => ipcRenderer.invoke('clear-clipboard-history'),
  copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text),
  startClipboardWatch: () => ipcRenderer.invoke('start-clipboard-watch'),
  stopClipboardWatch: () => ipcRenderer.invoke('stop-clipboard-watch'),
  onClipboardUpdated: (callback) => ipcRenderer.on('clipboard-updated', (event, history) => callback(history)),

  // Snippets
  getSnippets: () => ipcRenderer.invoke('get-snippets'),
  addSnippet: (snippet) => ipcRenderer.invoke('add-snippet', snippet),
  deleteSnippet: (id) => ipcRenderer.invoke('delete-snippet', id),

  // Vault
  getVaultItems: () => ipcRenderer.invoke('get-vault-items'),
  addVaultItem: (item) => ipcRenderer.invoke('add-vault-item', item),
  deleteVaultItem: (id) => ipcRenderer.invoke('delete-vault-item', id),

  // Screenshot
  captureScreen: () => ipcRenderer.invoke('capture-screen'),
  onTakeScreenshot: (callback) => ipcRenderer.on('take-screenshot', () => callback()),
  onScreenshotResult: (callback) => ipcRenderer.on('screenshot-result', (event, dataUrl) => callback(dataUrl)),

  // Long screenshot
  startLongScreenshot: () => ipcRenderer.invoke('start-long-screenshot'),
  onLongScreenshotResult: (callback) => ipcRenderer.on('long-screenshot-result', (event, dataUrl) => callback(dataUrl)),
  onLongScreenshotError: (callback) => ipcRenderer.on('long-screenshot-error', (event, error) => callback(error)),

  // OCR
  recognizeOcr: (dataUrl, langs, modelType) => ipcRenderer.invoke('ocr-recognize', dataUrl, langs, modelType),
  onOcrResult: (callback) => ipcRenderer.on('ocr-result', (event, data) => callback(data)),

  // Memo
  getMemos: () => ipcRenderer.invoke('get-memos'),
  addMemo: (memo) => ipcRenderer.invoke('add-memo', memo),
  deleteMemo: (id) => ipcRenderer.invoke('delete-memo', id),

  // Hash
  hashText: (text, algorithm) => ipcRenderer.invoke('hash-text', text, algorithm),

  // Encrypt transmission
  encryptText: (text, password, method) => ipcRenderer.invoke('encrypt-text', text, password, method),
  decryptText: (cipherText, password) => ipcRenderer.invoke('decrypt-text', cipherText, password),

  // Color picker
  pickScreenColor: () => ipcRenderer.invoke('pick-screen-color'),
  onColorPickResult: (callback) => ipcRenderer.on('color-pick-result', (event, data) => callback(data)),

  // QR Code
  generateQRCode: (text, size) => ipcRenderer.invoke('generate-qr-code', text, size),
  getQRHistory: () => ipcRenderer.invoke('get-qr-history'),
  addQRHistory: (text) => ipcRenderer.invoke('add-qr-history', text),
  clearQRHistory: () => ipcRenderer.invoke('clear-qr-history'),
  readImageDataUrl: (filePath) => ipcRenderer.invoke('read-image-data-url', filePath),
  decodeQRCode: (dataUrl) => decodeQRCodeFromDataUrl(dataUrl),

  // Image batch processing
  selectImageFiles: () => ipcRenderer.invoke('select-image-files'),
  selectImageFolder: () => ipcRenderer.invoke('select-image-folder'),
  selectOutputDir: () => ipcRenderer.invoke('select-output-dir'),
  scanDroppedPaths: (paths) => ipcRenderer.invoke('scan-dropped-paths', paths),
  processImages: (options) => ipcRenderer.invoke('process-images', options),
  onImageBatchProgress: (callback) => ipcRenderer.on('image-batch-progress', (event, data) => callback(data)),
  onImageBatchComplete: (callback) => ipcRenderer.on('image-batch-complete', (event, data) => callback(data)),

  // Document conversion
  selectDocumentFile: () => ipcRenderer.invoke('select-document-file'),
  selectDocOutputDir: () => ipcRenderer.invoke('select-doc-output-dir'),
  convertDocument: (options) => ipcRenderer.invoke('convert-document', options),
  pythonBackendHealth: () => ipcRenderer.invoke('python-backend-health'),

  // PDF Toolkit
  selectPdfFiles: () => ipcRenderer.invoke('select-pdf-files'),
  pdfToolkit: (action, params) => ipcRenderer.invoke('pdf-toolkit', { action, params }),

  // Media Vault
  mediaVaultIsLocked: () => ipcRenderer.invoke('media-vault:is-locked'),
  mediaVaultIsInitialized: () => ipcRenderer.invoke('media-vault:is-initialized'),
  mediaVaultSetupPassword: (password) => ipcRenderer.invoke('media-vault:setup-password', password),
  mediaVaultSetupUnlocked: () => ipcRenderer.invoke('media-vault:setup-unlocked'),
  mediaVaultVerifyPassword: (password) => ipcRenderer.invoke('media-vault:verify-password', password),
  mediaVaultGetCategories: (password) => ipcRenderer.invoke('media-vault:get-categories', password),
  mediaVaultAddCategory: (password, name) => ipcRenderer.invoke('media-vault:add-category', password, name),
  mediaVaultDeleteCategory: (password, id) => ipcRenderer.invoke('media-vault:delete-category', password, id),
  mediaVaultGetMediaList: (password, categoryId) => ipcRenderer.invoke('media-vault:get-media-list', password, categoryId),
  mediaVaultAddMedia: (password, categoryId, filePath) => ipcRenderer.invoke('media-vault:add-media', password, categoryId, filePath),
  mediaVaultDeleteMedia: (password, mediaId) => ipcRenderer.invoke('media-vault:delete-media', password, mediaId),
  mediaVaultGetMediaData: (password, mediaId) => ipcRenderer.invoke('media-vault:get-media-data', password, mediaId),
  mediaVaultChangePassword: (oldPassword, newPassword) => ipcRenderer.invoke('media-vault:change-password', oldPassword, newPassword),
  mediaVaultToggleLock: (password, enable, newPassword) => ipcRenderer.invoke('media-vault:toggle-lock', password, enable, newPassword),
  selectMediaFiles: () => ipcRenderer.invoke('select-media-files'),

  // Markdown
  parseMarkdown: (text) => marked.parse(text || '')
});
