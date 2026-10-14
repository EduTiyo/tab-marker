/**
 * Tab Marker - Popup Script
 * Controla a seleção de cores rápidas, seletor customizado e remoção de marcação na aba ativa.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const presetGrid = document.getElementById('presetGrid');
  const customColorInput = document.getElementById('customColorInput');
  const customColorPreview = document.getElementById('customColorPreview');
  const hexInput = document.getElementById('hexInput');
  const applyCustomBtn = document.getElementById('applyCustomBtn');
  const removeMarkerBtn = document.getElementById('removeMarkerBtn');
  const statusIndicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');

  let activeTabId = null;
  let currentColor = null;
  let presetColors = [];

  // 1. Identifica a aba ativa atual
  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (tabs && tabs.length > 0) {
      activeTabId = tabs[0].id;
    }
  } catch (err) {
    console.error('[Tab Marker] Falha ao obter aba ativa:', err);
  }

  // 2. Busca as cores pré-definidas do background
  try {
    const res = await browser.runtime.sendMessage({ action: 'getPresetColors' });
    if (res && res.colors) {
      presetColors = res.colors;
    }
  } catch (err) {
    presetColors = [
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
  }

  // 3. Renderiza a grade de botões de cores pré-definidas
  function renderPresets() {
    presetGrid.innerHTML = '';
    presetColors.forEach((color) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'color-btn';
      btn.style.backgroundColor = color.hex;
      btn.title = `${color.emoji} ${color.name}`;
      btn.setAttribute('aria-label', color.name);
      btn.dataset.hex = color.hex.toLowerCase();

      btn.addEventListener('click', () => {
        applyColor(color.hex);
      });

      presetGrid.appendChild(btn);
    });
  }

  // 4. Atualiza a interface gráfica com base na cor atual
  function updateUIState(color, emoji) {
    currentColor = color ? color.toLowerCase() : null;

    const buttons = presetGrid.querySelectorAll('.color-btn');
    let matchedPreset = null;

    buttons.forEach((btn) => {
      if (currentColor && btn.dataset.hex === currentColor) {
        btn.classList.add('selected');
        matchedPreset = btn.title;
      } else {
        btn.classList.remove('selected');
      }
    });

    if (currentColor) {
      statusIndicator.style.backgroundColor = currentColor;
      statusIndicator.classList.add('active');
      statusText.textContent = matchedPreset || `${emoji || '🎨'} ${currentColor.toUpperCase()}`;
      removeMarkerBtn.disabled = false;

      // Sincroniza inputs
      customColorInput.value = currentColor;
      customColorPreview.style.backgroundColor = currentColor;
      hexInput.value = currentColor.toUpperCase();
    } else {
      statusIndicator.style.backgroundColor = '#94a3b8';
      statusIndicator.classList.remove('active');
      statusText.textContent = 'Sem cor';
      removeMarkerBtn.disabled = true;
    }
  }

  // 5. Aplica a cor selecionada na aba
  async function applyColor(hex) {
    if (!activeTabId || !hex) return;
    updateUIState(hex);

    try {
      await browser.runtime.sendMessage({
        action: 'setTabColor',
        tabId: activeTabId,
        color: hex
      });

      // Atualiza estado final após envio
      const res = await browser.runtime.sendMessage({
        action: 'getTabColor',
        tabId: activeTabId
      });
      if (res) {
        updateUIState(res.color, res.emoji);
      }
    } catch (err) {
      console.error('[Tab Marker] Erro ao aplicar cor:', err);
    }
  }

  // 6. Remove a cor da aba
  async function removeColor() {
    if (!activeTabId) return;
    updateUIState(null);

    try {
      await browser.runtime.sendMessage({
        action: 'clearTabColor',
        tabId: activeTabId
      });
    } catch (err) {
      console.error('[Tab Marker] Erro ao remover cor:', err);
    }
  }

  // 7. Eventos do seletor customizado e input HEX
  customColorInput.addEventListener('input', (e) => {
    const val = e.target.value.toUpperCase();
    customColorPreview.style.backgroundColor = val;
    hexInput.value = val;
  });

  hexInput.addEventListener('input', (e) => {
    let val = e.target.value.trim();
    if (!val.startsWith('#')) {
      val = '#' + val;
    }
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      customColorInput.value = val;
      customColorPreview.style.backgroundColor = val;
    }
  });

  applyCustomBtn.addEventListener('click', () => {
    let val = hexInput.value.trim();
    if (!val.startsWith('#')) {
      val = '#' + val;
    }
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      applyColor(val);
    } else {
      hexInput.focus();
    }
  });

  removeMarkerBtn.addEventListener('click', () => {
    removeColor();
  });

  // Renderiza botões e carrega cor salva para a aba
  renderPresets();

  if (activeTabId) {
    try {
      const res = await browser.runtime.sendMessage({
        action: 'getTabColor',
        tabId: activeTabId
      });
      if (res && res.color) {
        updateUIState(res.color, res.emoji);
      }
    } catch (err) {}
  }
});
