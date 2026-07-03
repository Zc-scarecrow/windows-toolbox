(function () {
  const STORAGE_KEY = 'app-locale';
  const DEFAULT_LOCALE = 'zh-CN';
  const SUPPORTED_LOCALES = ['zh-CN', 'en'];

  let currentLocale = localStorage.getItem(STORAGE_KEY) || DEFAULT_LOCALE;
  if (!SUPPORTED_LOCALES.includes(currentLocale)) currentLocale = DEFAULT_LOCALE;

  const translations = {
    en: {
      // ===== Global / Sidebar =====
      '核心工具': 'Core Tools',
      '首页': 'Home',
      '截图': 'Screenshot',
      '剪贴板': 'Clipboard',
      '密码箱': 'Password Vault',
      '扩展工具': 'Extensions',
      '备忘录': 'Memo',
      '图片处理': 'Image Processing',
      '加密相册': 'Encrypted Album',
      '文档转换': 'Document Conversion',
      'PDF 工具箱': 'PDF Toolkit',
      '颜色工具': 'Color Tool',
      '二维码': 'QR Code',
      '加密传输': 'Encrypted Transfer',
      '开发专用': 'Developer',
      '哈希计算': 'Hash',
      '开发者工具': 'Developer Tools',
      '设置': 'Settings',
      '最小化': 'Minimize',
      '最大化': 'Maximize',
      '关闭': 'Close',
      '还原': 'Restore',

      // ===== Common =====
      '暂无数据': 'No data',
      'OCR 识别结果': 'OCR Result',
      '复制文本': 'Copy Text',
      '已复制': 'Copied',
      '识别失败：': 'Recognition failed: ',
      '（未识别到文字）': '(No text recognized)',
      '提示': 'Prompt',
      '复制': 'Copy',
      '删除': 'Delete',
      '取消': 'Cancel',
      '保存': 'Save',
      '确定': 'Confirm',
      '添加': 'Add',
      '清空': 'Clear',
      '选择目录': 'Select Directory',
      '历史记录': 'History',
      '加载中...': 'Loading...',
      '未知错误': 'Unknown error',
      'OCR 识别失败': 'OCR Recognition Failed',
      '识别失败': 'Recognition Failed',
      '加载失败：': 'Load failed: ',

      // ===== Home =====
      '实用 Windows 桌面小工具箱': 'Practical Windows Desktop Toolbox',
      '长截图、OCR、贴图': 'Long screenshot, OCR, pin',
      '历史记录、快捷短语': 'History, snippets',
      '本地安全存储账号密码': 'Local secure storage for accounts and passwords',
      '临时记录、灵感、便签': 'Notes, ideas, sticky notes',
      'Word / Excel / PDF / Markdown 互转': 'Word / Excel / PDF / Markdown conversion',
      '合并、拆分、旋转、水印、提取图片': 'Merge, split, rotate, watermark, extract images',
      '文本对称加密与解密': 'Text symmetric encryption and decryption',
      'JSON、Base64、URL、时间戳、进制': 'JSON, Base64, URL, timestamp, base conversion',

      // ===== Screenshot =====
      '截图工具': 'Screenshot Tool',
      '按快捷键或点击按钮开始区域截图，拖拽选择区域后可确认截图或识别文字。': 'Press shortcut or click button to start area screenshot, drag to select area, then confirm or recognize text.',
      '区域截图': 'Area Screenshot',
      '长截图': 'Long Screenshot',
      '贴图': 'Pin',
      'OCR': 'OCR',
      '截图将显示在这里': 'Screenshot will be shown here',
      '请在屏幕上拖拽选择要滚动的区域，开始捕获后按 F9 完成 / F10 取消': 'Drag on screen to select scroll area, press F9 to finish / F10 to cancel after capture starts',
      '长截图完成': 'Long screenshot completed',
      '请先截取一张图片': 'Please take a screenshot first',
      '识别中...': 'Recognizing...',
      '长截图失败：': 'Long screenshot failed: ',

      // ===== Clipboard =====
      '历史记录与快捷短语管理。': 'History and snippet management.',
      '快捷短语': 'Snippets',
      '正在监听剪贴板': 'Listening to clipboard',
      '清空历史': 'Clear History',
      '复制任意文本即可记录到历史': 'Copy any text to record to history',
      '内容': 'Content',
      '暂无快捷短语': 'No snippets',

      // ===== Password =====
      '本地安全存储账号密码，数据仅保存在本机。': 'Locally secure storage for accounts and passwords, data only saved on this device.',
      '标题（如 GitHub）': 'Title (e.g. GitHub)',
      '网站': 'Website',
      '应用': 'App',
      '邮箱': 'Email',
      '银行卡': 'Bank Card',
      '其他': 'Other',
      '账号 / 用户名 / 邮箱': 'Account / Username / Email',
      '密码': 'Password',
      '网址（可选）': 'URL (optional)',
      '备注（可选）': 'Note (optional)',
      '暂无存储项': 'No stored items',
      '分类': 'Category',
      '账号': 'Account',
      '显示': 'Show',
      '隐藏': 'Hide',
      '网址': 'URL',
      '备注': 'Note',
      '确定删除该密码项？': 'Confirm delete this password item?',
      '无账号': 'No account',

      // ===== Memo =====
      '备忘录': 'Memo',
      '所见即所得备忘录，支持文字格式与图片。': 'WYSIWYG memo, supports text formatting and images.',
      '新建备忘录': 'New Memo',
      '暂无备忘录': 'No memos',
      '无标题': 'Untitled',
      '确定要删除这条备忘录吗？': 'Confirm delete this memo?',
      '复制原文': 'Copy Original',
      '标题（可选）': 'Title (optional)',
      '加粗': 'Bold',
      '斜体': 'Italic',
      '标题': 'Heading',
      '列表': 'List',
      '插入图片': 'Insert Image',
      '清除格式': 'Clear Format',
      '输入内容...': 'Enter content...',
      '支持 Ctrl+B / Ctrl+I 快捷键': 'Supports Ctrl+B / Ctrl+I shortcuts',
      '今天': 'Today',

      // ===== Image Batch =====
      '图片批量处理': 'Image Batch Processing',
      '批量压缩、转格式、改尺寸。支持 JPG / PNG / WebP / GIF / BMP / TIFF。': 'Batch compress, convert format, resize. Supports JPG / PNG / WebP / GIF / BMP / TIFF.',
      '选择图片文件': 'Select Image Files',
      '选择文件夹': 'Select Folder',
      '已选择 {0} 张图片': '{0} images selected',
      '拖拽图片或文件夹到此处，或点击上方按钮选择': 'Drag images or folders here, or click buttons above',
      '输出格式': 'Output Format',
      '保持原格式': 'Keep Original',
      '输出质量': 'Output Quality',
      '宽度（px，0 为不调整）': 'Width (px, 0 = no change)',
      '高度（px，0 为不调整）': 'Height (px, 0 = no change)',
      '保持宽高比': 'Keep Aspect Ratio',
      '输出位置': 'Output Location',
      '覆盖原文件': 'Overwrite Original',
      '输出到子目录': 'Output to Subdirectory',
      '自定义目录': 'Custom Directory',
      '选择自定义输出目录...': 'Select custom output directory...',
      '开始处理': 'Start Processing',
      '未检测到支持的图片文件': 'No supported image files detected',
      '选择文件失败：': 'Select files failed: ',
      '选择文件夹失败：': 'Select folder failed: ',
      '选择目录失败：': 'Select directory failed: ',
      '请先选择自定义输出目录': 'Please select custom output directory first',
      '正在处理...': 'Processing...',
      '正在处理 {0}/{1}：{2}': 'Processing {0}/{1}: {2}',
      '处理完成：成功 {0} 张，失败 {1} 张': 'Completed: {0} success, {1} failed',
      '处理失败': 'Processing failed',
      '输出目录：{0}': 'Output directory: {0}',
      '成功 {0} 张': '{0} succeeded',
      '失败 {0} 张': '{0} failed',

      // ===== Document Conversion =====
      '文档转换': 'Document Conversion',
      '支持 Markdown、HTML、TXT、Word、Excel、CSV、JSON、PDF 等格式互转，全部本地处理。': 'Supports conversion between Markdown, HTML, TXT, Word, Excel, CSV, JSON, PDF, all processed locally.',
      '选择文件': 'Select File',
      '纯文本': 'Plain Text',
      '未选择文件': 'No file selected',
      '源格式': 'Source Format',
      '目标格式': 'Target Format',
      '同目录': 'Same Directory',
      '选择自定义输出目录...': 'Select custom output directory...',
      '开始转换': 'Start Conversion',
      '选择失败：': 'Selection failed: ',
      '不支持的格式': 'Unsupported format',
      '选择文件失败：': 'Select file failed: ',
      '请先选择自定义输出目录': 'Please select custom output directory first',
      '正在转换...': 'Converting...',
      '转换失败': 'Conversion failed',
      '转换完成': 'Conversion completed',
      '转换成功': 'Conversion successful',
      '输出文件：{0}': 'Output file: {0}',

      // ===== PDF Toolkit =====
      'PDF 工具箱': 'PDF Toolkit',
      'PDF 合并、拆分、页面旋转、添加水印、提取图片，全部本地处理。': 'PDF merge, split, rotate, watermark, extract images, all processed locally.',
      '合并': 'Merge',
      '拆分': 'Split',
      '旋转': 'Rotate',
      '水印': 'Watermark',
      '提取图片': 'Extract Images',
      '选择 PDF 文件': 'Select PDF File',
      '输出目录': 'Output Directory',
      '选择输出目录...': 'Select output directory...',
      '输出文件名': 'Output Filename',
      '合并 PDF': 'Merge PDF',
      '拆分方式': 'Split Mode',
      '每页拆分为单独 PDF': 'Each page as separate PDF',
      '按页码范围拆分': 'Split by page ranges',
      '页码范围': 'Page Ranges',
      '选择目录...': 'Select directory...',
      '拆分 PDF': 'Split PDF',
      '旋转角度': 'Rotation Angle',
      '页面范围': 'Page Range',
      '全部页面': 'All Pages',
      '指定页面': 'Custom Pages',
      '页码 (逗号分隔)': 'Pages (comma separated)',
      '旋转页面': 'Rotate Pages',
      '水印文字': 'Watermark Text',
      '请输入水印内容...': 'Enter watermark content...',
      '字体大小': 'Font size',
      '透明度': 'Opacity',
      '添加水印': 'Add Watermark',
      '读取失败: ': 'Read failed: ',
      '{0} 页': '{0} pages',
      '选择失败': 'Selection failed',
      '正在合并...': 'Merging...',
      '合并失败': 'Merge failed',
      '合并完成': 'Merge completed',
      '合并成功，共 {0} 个文件': 'Merge successful, {0} files',
      '输出文件: {0}': 'Output file: {0}',
      '{0} 个文件已选': '{0} files selected',
      '请输入页码范围': 'Please enter page ranges',
      '无法确定输出目录': 'Cannot determine output directory',
      '正在拆分...': 'Splitting...',
      '拆分失败': 'Split failed',
      '拆分完成': 'Split completed',
      '成功拆分为 {0} 个文件': 'Split into {0} files successfully',
      '请输入页码': 'Please enter page numbers',
      '正在旋转...': 'Rotating...',
      '旋转失败': 'Rotation failed',
      '旋转完成': 'Rotation completed',
      '旋转成功，共 {0} 页': 'Rotation successful, {0} pages',
      '请输入水印文字': 'Please enter watermark text',
      '正在添加水印...': 'Adding watermark...',
      '水印添加失败': 'Watermark failed',
      '水印添加完成': 'Watermark completed',
      '水印添加成功': 'Watermark added successfully',
      '正在提取图片...': 'Extracting images...',
      '提取失败': 'Extraction failed',
      '未找到图片': 'No images found',
      '该 PDF 中没有嵌入的图片。': 'No embedded images in this PDF.',
      '提取完成': 'Extraction completed',
      '成功提取 {0} 张图片': 'Extracted {0} images successfully',

      // ===== Hash =====
      '哈希计算': 'Hash Calculation',
      '计算文本的 MD5 / SHA1 / SHA256。': 'Calculate text MD5 / SHA1 / SHA256.',
      '输入文本': 'Enter text',
      'MD5': 'MD5',
      'SHA1': 'SHA1',
      'SHA256': 'SHA256',
      '点击按钮计算哈希': 'Click button to calculate hash',

      // ===== Encrypt Transmission =====
      '加密传输': 'Encrypted Transfer',
      '输入文本，选择加密方法与密码进行加解密。输出为纯乱码 Base64 字符串，解密时自动识别方法。': 'Enter text, select encryption method and password. Output is Base64, decryption auto-detects method.',
      '加密方式': 'Encryption Method',
      '方法一：双重混淆': 'Method 1: Double Mix',
      '方法二：异或流混淆': 'Method 2: XOR Stream',
      '方法三：字节替换表': 'Method 3: Byte Substitution',
      '方法四：滚动移位': 'Method 4: Rolling Shift',
      '方法五：块内置换': 'Method 5: Block Scramble',
      '密码 / 密钥': 'Password / Key',
      '输入加密密码': 'Enter encryption password',
      '显示/隐藏密码': 'Show/Hide password',
      '加密': 'Encrypt',
      '解密': 'Decrypt',
      '复制结果': 'Copy Result',
      '结果转输入': 'Result to Input',
      '提示：AES 加密使用 PBKDF2 从密码派生密钥，每次加密随机生成盐值与 IV。': 'Hint: AES uses PBKDF2 to derive key, random salt and IV each time.',
      '原始文本 / 密文': 'Plaintext / Ciphertext',
      '在此输入要加密或解密的文本...': 'Enter text to encrypt or decrypt...',
      '结果': 'Result',
      '加密或解密结果将显示在这里...': 'Encryption/decryption result will be shown here...',
      '请输入要加密的文本': 'Please enter text to encrypt',
      '请输入密码': 'Please enter password',
      '加密失败：': 'Encryption failed: ',
      '请输入要解密的密文': 'Please enter ciphertext to decrypt',
      '解密失败：': 'Decryption failed: ',
      '方法一：先对字节做替换表变换，再与伪随机流异或。': 'Method 1: Substitute bytes then XOR with pseudo-random stream.',
      '方法二：将文本字节与由密码+盐生成的伪随机流逐字节异或。': 'Method 2: XOR text bytes with password+salt pseudo-random stream.',
      '方法三：根据密码生成 256 字节 S-Box，对每字节做替换。': 'Method 3: Generate 256-byte S-Box from password, substitute each byte.',
      '方法四：对每字节叠加伪随机流与位置偏移量，位置不同结果不同。': 'Method 4: Add pseudo-random stream and position offset to each byte.',
      '方法五：将数据分块，每块按密码生成的置换表打乱字节顺序。': 'Method 5: Split data into blocks, scramble bytes per password-derived permutation.',

      // ===== Developer Tools =====
      'JSON 格式化、Base64 / URL 编解码、时间戳转换、进制转换等常用开发小工具。': 'JSON format, Base64/URL encode/decode, timestamp conversion, base conversion, etc.',
      '时间戳': 'Timestamp',
      '进制': 'Base',
      'JSON 格式化 / 压缩 / 校验': 'JSON Format / Minify / Validate',
      '在此粘贴 JSON 内容...': 'Paste JSON here...',
      '格式化': 'Format',
      '压缩': 'Minify',
      '校验': 'Validate',
      '请输入 JSON 内容': 'Please enter JSON content',
      'JSON 格式错误：': 'JSON format error: ',
      '✓ JSON 格式正确': '✓ Valid JSON',
      'Base64 编解码': 'Base64 Encode/Decode',
      '在此输入文本...': 'Enter text here...',
      '编码': 'Encode',
      '解码': 'Decode',
      '文件转 Base64': 'File to Base64',
      '编码失败：': 'Encoding failed: ',
      '解码失败：': 'Decoding failed: ',
      '读取文件失败：': 'Read file failed: ',
      'URL 编解码': 'URL Encode/Decode',
      '在此输入 URL 或文本...': 'Enter URL or text here...',
      '时间戳与日期互转': 'Timestamp and Date Conversion',
      '时间戳或日期字符串': 'Timestamp or date string',
      '毫秒': 'Milliseconds',
      '秒': 'Seconds',
      '当前时间': 'Current Time',
      '转换': 'Convert',
      '请输入时间戳或日期': 'Please enter timestamp or date',
      '无效的时间戳': 'Invalid timestamp',
      '本地时间：{0}': 'Local time: {0}',
      'ISO 8601：{0}': 'ISO 8601: {0}',
      '毫秒：{0}': 'Milliseconds: {0}',
      '秒：{0}': 'Seconds: {0}',
      '无法解析日期，请尝试标准格式如 2026-07-03 12:00:00': 'Cannot parse date, try standard format like 2026-07-03 12:00:00',
      '进制转换': 'Base Conversion',
      '输入数值': 'Enter value',
      '请输入数值': 'Please enter a value',
      '十进制': 'Decimal',
      '二进制': 'Binary',
      '八进制': 'Octal',
      '十六进制': 'Hexadecimal',
      '转换失败：': 'Conversion failed: ',
      '输入数值与源进制不匹配': 'Input value does not match source base',
      '已复制到剪贴板': 'Copied to clipboard',

      // ===== Color =====
      'HEX / RGB / HSL 格式互转，点击色块可快速复用。': 'Convert between HEX/RGB/HSL, click color to reuse.',
      '屏幕取色': 'Screen Color Picker',
      '暂无历史记录': 'No history',
      '取色失败：': 'Color pick failed: ',

      // ===== QR Code =====
      '生成二维码图片，或从图片、屏幕截图中识别二维码内容。': 'Generate QR code image, or decode from image/screenshot.',
      '生成': 'Generate',
      '识别': 'Decode',
      '输入文本或链接': 'Enter text or link',
      '生成二维码': 'Generate QR Code',
      '二维码将显示在这里': 'QR code will be shown here',
      '保存图片': 'Save Image',
      '选择图片': 'Select Image',
      '从剪贴板粘贴': 'Paste from Clipboard',
      '框选屏幕识别': 'Select Screen Area',
      '选择或粘贴二维码图片': 'Select or paste QR code image',
      '复制结果': 'Copy Result',
      '用于生成': 'Use to Generate',
      '使用': 'Use',
      '请输入内容': 'Please enter content',
      '生成中...': 'Generating...',
      '生成失败：': 'Generation failed: ',
      '未能识别到二维码，请尝试更清晰的图片': 'Could not recognize QR code, try a clearer image',
      '（空内容）': '(Empty content)',
      '读取图片失败：': 'Read image failed: ',
      '剪贴板中没有找到图片内容': 'No image found in clipboard',
      '读取剪贴板失败：': 'Read clipboard failed: ',
      '确定要清空二维码历史记录吗？': 'Confirm clear QR code history?',

      // ===== Media Vault =====
      '本地加密存储图片与视频，按分类管理，访问需验证密码。': 'Locally encrypt and store images and videos, manage by category, password required.',
      '欢迎使用加密相册': 'Welcome to Encrypted Album',
      '你可以选择为相册设置访问密码，也可以先不加密直接管理。': 'You can set an access password or manage without encryption.',
      '设置密码保护': 'Set Password Protection',
      '暂不加密，直接进入': 'Enter without encryption',
      '输入密码': 'Enter password',
      '确认密码': 'Confirm password',
      '确认设置并进入': 'Confirm and Enter',
      '初始化失败': 'Initialization failed',
      '密码至少 4 位': 'Password at least 4 characters',
      '两次输入的密码不一致': 'Passwords do not match',
      '设置失败': 'Setup failed',
      '加密相册已锁定': 'Encrypted Album Locked',
      '访问密码': 'Access password',
      '进入相册': 'Enter Album',
      '密码错误': 'Wrong password',
      '添加媒体': 'Add Media',
      '修改密码': 'Change Password',
      '取消保护': 'Remove Protection',
      '锁定': 'Lock',
      '未上锁': 'Unlocked',
      '请先创建分类': 'Please create a category first',
      '该分类下暂无媒体，点击“添加媒体”导入文件': 'No media in this category, click "Add Media" to import',
      '新建分类': 'New Category',
      '暂无分类': 'No categories',
      '添加失败': 'Add failed',
      '分类名称': 'Category name',
      '删除分类': 'Delete category',
      '确定删除分类“{0}”？该分类下的所有媒体将被一并删除。': 'Confirm delete category "{0}"? All media in it will be deleted.',
      '删除失败': 'Delete failed',
      '请先选择或创建一个分类': 'Please select or create a category first',
      '正在加密导入...': 'Encrypting import...',
      '导入完成：成功 {0} 个，失败 {1} 个': 'Import completed: {0} success, {1} failed',
      '添加媒体失败：': 'Add media failed: ',
      '确定删除该媒体文件？': 'Confirm delete this media file?',
      '修改访问密码': 'Change Access Password',
      '原密码': 'Old password',
      '新密码': 'New password',
      '确认新密码': 'Confirm new password',
      '确认修改': 'Confirm Change',
      '新密码至少 4 位': 'New password at least 4 characters',
      '两次输入的新密码不一致': 'New passwords do not match',
      '密码已修改，请牢记新密码': 'Password changed, please remember it',
      '修改失败': 'Change failed',
      '设置密码后，所有媒体文件和分类信息将使用密码加密。请牢记密码。': 'After setting password, all media and categories will be encrypted. Please remember it.',
      '确认上锁': 'Confirm Lock',
      '正在加密，请稍候...': 'Encrypting, please wait...',
      '上锁失败': 'Lock failed',
      '取消密码保护': 'Remove Password Protection',
      '取消后相册将不再需要密码即可进入。媒体文件仍会保留基础加密存储。': 'After removing, album won\'t require password. Media will still be basically encrypted.',
      '当前密码': 'Current password',
      '确认取消保护': 'Confirm Remove Protection',
      '请输入当前密码': 'Please enter current password',
      '正在解密，请稍候...': 'Decrypting, please wait...',
      '取消保护失败': 'Remove protection failed',

      // ===== Overlays =====
      '拖拽选择区域 · Enter 确认 · O OCR 识别 · Esc 取消': 'Drag to select area · Enter confirm · O OCR · Esc cancel',
      '确认 (Enter)': 'Confirm (Enter)',
      'OCR 识别 (O)': 'OCR (O)',
      '取消 (Esc)': 'Cancel (Esc)',
      '拖拽选择滚动区域 · Enter 开始捕获 · Esc 取消': 'Drag to select scroll area · Enter start capture · Esc cancel',
      '正在捕获... 滚动目标窗口，按 F9 完成 / F10 取消': 'Capturing... scroll target window, press F9 finish / F10 cancel',
      '开始捕获 (Enter)': 'Start Capture (Enter)',
      '移动鼠标查看颜色，点击选取，按 Esc 取消': 'Move mouse to view color, click to pick, Esc to cancel',

      // ===== Settings =====
      '应用配置。': 'App configuration.',
      '开机启动': 'Launch on startup',
      '深色模式': 'Dark mode',
      '截图快捷键': 'Screenshot shortcut',
      '（点击输入框后按下组合键）': '(Click input then press key combination)',
      '点击此处，然后按下组合键': 'Click here, then press key combination',
      '保存快捷键': 'Save Shortcut',
      '快捷键已保存：': 'Shortcut saved: ',
      '保存失败：': 'Save failed: ',
      '剪贴板历史条数': 'Clipboard history count',
      '语言': 'Language',
      '简体中文': 'Simplified Chinese',
      'English': 'English',
      '切换语言': 'Switch Language'
    }
  };

  function t(key, ...args) {
    if (typeof key !== 'string') return String(key);
    let str = translations[currentLocale]?.[key];
    if (str === undefined) str = key;
    args.forEach((arg, i) => {
      str = str.replace(new RegExp('\\{' + i + '\\}', 'g'), String(arg));
    });
    return str;
  }

  function getLocale() {
    return currentLocale;
  }

  function setLocale(locale) {
    if (!SUPPORTED_LOCALES.includes(locale)) return;
    if (locale === currentLocale) return;
    currentLocale = locale;
    localStorage.setItem(STORAGE_KEY, locale);
    applyI18nToDocument();
    document.documentElement.lang = locale === 'zh-CN' ? 'zh-CN' : 'en';
    if (window.electronAPI && window.electronAPI.setAppLocale) {
      try { window.electronAPI.setAppLocale(locale); } catch (e) {}
    }
    window.dispatchEvent(new CustomEvent('locale-changed', { detail: { locale } }));
  }

  function toggleLocale() {
    setLocale(currentLocale === 'zh-CN' ? 'en' : 'zh-CN');
  }

  function applyI18nToDocument() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const attr = el.dataset.i18nAttr;
      if (attr) {
        el.setAttribute(attr, t(key));
      } else {
        el.textContent = t(key);
      }
    });
  }

  window.i18n = {
    t,
    getLocale,
    setLocale,
    toggleLocale,
    applyI18nToDocument,
    getSupportedLocales: () => SUPPORTED_LOCALES
  };

  document.addEventListener('DOMContentLoaded', () => {
    applyI18nToDocument();
    document.documentElement.lang = currentLocale === 'zh-CN' ? 'zh-CN' : 'en';
  });
})();
