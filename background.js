/**
 * Tab Marker - Background Script (Firefox Manifest V3)
 * Gerencia menus de contexto, persistência da cor e emoji no título e comunicação com abas.
 */

const PRESET_COLORS = [
  { id: 'red', name: 'Vermelho', hex: '#ef4444', emoji: '🔴' },
  { id: 'orange', name: 'Laranja', hex: '#f97316', emoji: '🟠' },
  { id: 'yellow', name: 'Amarelo', hex: '#eab308', emoji: '🟡' },
  { id: 'green', name: 'Verde', hex: '#22c55e', emoji: '🟢' },
  { id: 'cyan', name: 'Ciano', hex: '#06b6d4', emoji: '🩵' },
  { id: 'blue', name: 'Azul', hex: '#3b82f6', emoji: '🔵' },
  { id: 'purple', name: 'Roxo', hex: '#a855f7', emoji: '🟣' },
  { id: 'pink', name: 'Rosa', hex: '#ec4899', emoji: '🩷' },
  { id: 'gray', name: 'Cinza', hex: '#64748b', emoji: '⚪' }
];

// Cache em memória para acesso síncrono rápido (tabId -> { color, emoji })
const tabDataMap = new Map();

/**
 * Converte HEX em HSL para associar o emoji de círculo mais próximo a cores customizadas
 */
function hexToHsl(hex) {
  let r = 0, g = 0, b = 0;
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16) / 255;
    g = parseInt(hex[1] + hex[1], 16) / 255;
    b = parseInt(hex[2] + hex[2], 16) / 255;
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16) / 255;
    g = parseInt(hex.substring(2, 4), 16) / 255;
    b = parseInt(hex.substring(4, 6), 16) / 255;
  }

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
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

/**
 * Determina o emoji correspondente para qualquer cor HEX
 */
function getEmojiForColor(hex) {
  if (!hex) return '🔴';
  const preset = PRESET_COLORS.find((c) => c.hex.toLowerCase() === hex.toLowerCase());
  if (preset) return preset.emoji;

  const { h, s, l } = hexToHsl(hex);
  if (s < 15) {
    return l > 55 ? '⚪' : '⚫';
  }
  if ((h >= 345 && h <= 360) || (h >= 0 && h < 15)) return '🔴';
  if (h >= 15 && h < 45) return '🟠';
  if (h >= 45 && h < 70) return '🟡';
  if (h >= 70 && h < 160) return '🟢';
  if (h >= 160 && h < 200) return '🩵';
  if (h >= 200 && h < 260) return '🔵';
  if (h >= 260 && h < 315) return '🟣';
  return '🩷';
}

/**
 * Configura o menu de clique com o botão direito nas abas
 */
function setupContextMenus() {
  if (!browser.menus) return;

  browser.menus.removeAll().then(() => {
    browser.menus.create({
      id: 'tab-marker-parent',
      title: 'Marcar aba com cor',
      contexts: ['tab']
    });

    PRESET_COLORS.forEach((color) => {
      browser.menus.create({
        id: `mark-${color.id}`,
        parentId: 'tab-marker-parent',
        title: `${color.emoji} ${color.name}`,
        contexts: ['tab']
      });
    });

    browser.menus.create({
      id: 'tab-marker-separator',
      parentId: 'tab-marker-parent',
      type: 'separator',
      contexts: ['tab']
    });

    browser.menus.create({
      id: 'tab-marker-remove',
      parentId: 'tab-marker-parent',
      title: '❌ Remover marcação',
      contexts: ['tab']
    });
  }).catch((err) => {
    console.error('[Tab Marker] Erro ao criar menus:', err);
  });
}

/**
 * Define a cor e emoji de uma aba, persistindo na sessão e no storage local
 */
async function setTabColor(tabId, hexColor) {
  if (!tabId || !hexColor) return;

  const emoji = getEmojiForColor(hexColor);
  const data = { color: hexColor, emoji };

  tabDataMap.set(tabId, data);

  // 1. Grava na sessão da aba
  if (browser.sessions && browser.sessions.setTabValue) {
    try {
      await browser.sessions.setTabValue(tabId, 'tab_marker_data', JSON.stringify(data));
    } catch (e) {
      console.warn('[Tab Marker] Falha ao gravar sessions.setTabValue:', e);
    }
  }

  // 2. Grava no storage local como backup
  try {
    await browser.storage.local.set({ [`tab_${tabId}`]: data });
  } catch (e) {}

  // 3. Notifica a aba para aplicar moldura no favicon e emoji no título
  sendToTab(tabId, { action: 'applyMarker', color: hexColor, emoji });
}

/**
 * Remove a marcação da aba
 */
async function clearTabColor(tabId) {
  if (!tabId) return;

  tabDataMap.delete(tabId);

  if (browser.sessions && browser.sessions.removeTabValue) {
    try {
      await browser.sessions.removeTabValue(tabId, 'tab_marker_data');
    } catch (e) {}
  }

  try {
    await browser.storage.local.remove([`tab_${tabId}`]);
  } catch (e) {}

  sendToTab(tabId, { action: 'removeMarker' });
}

/**
 * Obtém os dados de marcação salvos para a aba
 */
async function getTabColor(tabId) {
  if (!tabId) return null;

  if (tabDataMap.has(tabId)) {
    return tabDataMap.get(tabId);
  }

  if (browser.sessions && browser.sessions.getTabValue) {
    try {
      const val = await browser.sessions.getTabValue(tabId, 'tab_marker_data');
      if (val) {
        const parsed = typeof val === 'string' ? JSON.parse(val) : val;
        tabDataMap.set(tabId, parsed);
        return parsed;
      }
    } catch (e) {}
  }

  try {
    const stored = await browser.storage.local.get([`tab_${tabId}`]);
    if (stored[`tab_${tabId}`]) {
      const parsed = stored[`tab_${tabId}`];
      tabDataMap.set(tabId, parsed);
      return parsed;
    }
  } catch (e) {}

  return null;
}

/**
 * Envia mensagem segura para o content script da aba, com injeção automática de fallback
 */
async function sendToTab(tabId, message) {
  try {
    await browser.tabs.sendMessage(tabId, message);
  } catch (err) {
    try {
      const tab = await browser.tabs.get(tabId);
      if (tab && tab.url && !tab.url.startsWith('about:') && !tab.url.startsWith('moz-extension:')) {
        await browser.scripting.executeScript({
          target: { tabId },
          files: ['content.js']
        });
        setTimeout(() => {
          browser.tabs.sendMessage(tabId, message).catch(() => {});
        }, 80);
      }
    } catch (injectErr) {}
  }
}

/**
 * Converte favicon de URL remota para DataURL (burlar CORS para o canvas)
 */
async function fetchFaviconAsDataUrl(url) {
  const response = await fetch(url, { mode: 'cors', credentials: 'omit' });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Evento de clique no Menu de Contexto
if (browser.menus && browser.menus.onClicked) {
  browser.menus.onClicked.addListener(async (info, tab) => {
    if (!tab || !tab.id) return;

    if (info.menuItemId.startsWith('mark-')) {
      const colorId = info.menuItemId.replace('mark-', '');
      const colorObj = PRESET_COLORS.find((c) => c.id === colorId);
      if (colorObj) {
        await setTabColor(tab.id, colorObj.hex);
      }
    } else if (info.menuItemId === 'tab-marker-remove') {
      await clearTabColor(tab.id);
    }
  });
}

// Evento de atualização de abas (navegações, reload, mudanças de favicon ou título)
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' || changeInfo.favIconUrl || changeInfo.title) {
    const data = await getTabColor(tabId);
    if (data && data.color) {
      sendToTab(tabId, { action: 'applyMarker', color: data.color, emoji: data.emoji });
    }
  }
});

// Evento de fechamento de abas
browser.tabs.onRemoved.addListener((tabId) => {
  tabDataMap.delete(tabId);
  browser.storage.local.remove([`tab_${tabId}`]).catch(() => {});
});

// Evento de substituição de abas
if (browser.tabs.onReplaced) {
  browser.tabs.onReplaced.addListener(async (addedTabId, removedTabId) => {
    const data = await getTabColor(removedTabId);
    if (data) {
      await setTabColor(addedTabId, data.color);
      clearTabColor(removedTabId);
    }
  });
}

// Ouvinte de mensagens da extensão (popup e content script)
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getTabColor') {
    const targetTabId = request.tabId || (sender.tab && sender.tab.id);
    if (!targetTabId) {
      return Promise.resolve({ color: null, emoji: null });
    }
    return getTabColor(targetTabId).then((data) => {
      if (data) {
        return { color: data.color, emoji: data.emoji };
      }
      return { color: null, emoji: null };
    });
  }

  if (request.action === 'setTabColor') {
    const targetTabId = request.tabId || (sender.tab && sender.tab.id);
    return setTabColor(targetTabId, request.color).then(() => ({ success: true }));
  }

  if (request.action === 'clearTabColor') {
    const targetTabId = request.tabId || (sender.tab && sender.tab.id);
    return clearTabColor(targetTabId).then(() => ({ success: true }));
  }

  if (request.action === 'getPresetColors') {
    return Promise.resolve({ colors: PRESET_COLORS });
  }

  if (request.action === 'fetchFaviconAsDataUrl') {
    return fetchFaviconAsDataUrl(request.url)
      .then((dataUrl) => ({ success: true, dataUrl }))
      .catch((err) => ({ success: false, error: err.message }));
  }

  return false;
});

// Inicialização
setupContextMenus();
browser.runtime.onInstalled.addListener(() => {
  setupContextMenus();
});
