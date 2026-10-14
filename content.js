/**
 * Tab Marker - Content Script
 * Aplica emoji colorido de alto contraste diretamente no título da aba,
 * mantendo o favicon original do site 100% limpo e intocado.
 */

(() => {
  if (window.__tabMarkerInitialized) return;
  window.__tabMarkerInitialized = true;

  let currentEmoji = null;
  let isApplyingMarker = false;
  let titleObserver = null;

  const BADGE_LINK_ID = 'tab-marker-favicon-link';
  const EMOJI_PREFIX_REGEX = /^([🔴🟠🟡🟢🩵🔵🟣🩷⚪⚫🔘🔷🌐])\s*/u;

  /**
   * Obtém o título limpo da página sem emojis de marcação
   */
  function getCleanTitle() {
    return document.title.replace(EMOJI_PREFIX_REGEX, '').trim();
  }

  /**
   * Atualiza o título da aba com o emoji de círculo colorido
   */
  function updateTabTitle(emoji) {
    const cleanTitle = getCleanTitle();

    if (!window.__tabMarkerOriginalTitle && cleanTitle) {
      window.__tabMarkerOriginalTitle = cleanTitle;
    }

    if (emoji) {
      document.title = `${emoji} ${cleanTitle}`;
    } else {
      document.title = window.__tabMarkerOriginalTitle || cleanTitle;
    }
  }

  /**
   * Inicia observador de título para garantir persistência caso a página altere seu título dinamicamente
   */
  function startTitleObserver() {
    if (titleObserver) return;

    const titleEl = document.querySelector('title');
    if (!titleEl) return;

    titleObserver = new MutationObserver(() => {
      if (isApplyingMarker || !currentEmoji) return;

      if (!document.title.startsWith(currentEmoji)) {
        isApplyingMarker = true;
        updateTabTitle(currentEmoji);
        setTimeout(() => {
          isApplyingMarker = false;
        }, 50);
      }
    });

    titleObserver.observe(titleEl, {
      childList: true,
      characterData: true,
      subtree: true
    });
  }

  function stopTitleObserver() {
    if (titleObserver) {
      titleObserver.disconnect();
      titleObserver = null;
    }
  }

  /**
   * Garante que qualquer favicon customizado anterior seja removido e o original restaurado
   */
  function cleanupCustomFavicon() {
    const badgeLink = document.getElementById(BADGE_LINK_ID);
    if (badgeLink) {
      badgeLink.remove();
    }

    const disabledLinks = document.querySelectorAll("link[data-tab-marker-original-rel]");
    disabledLinks.forEach((link) => {
      const originalRel = link.getAttribute('data-tab-marker-original-rel');
      if (originalRel) {
        link.rel = originalRel;
        link.removeAttribute('data-tab-marker-original-rel');
      }
    });
  }

  /**
   * Aplica o marcador na aba (emoji de círculo colorido no título)
   */
  function applyMarker(emoji) {
    if (!emoji) return;
    currentEmoji = emoji;

    try {
      isApplyingMarker = true;

      // 1. Aplica o emoji colorido no início do título
      updateTabTitle(emoji);
      startTitleObserver();

      // 2. Garante que o favicon original permaneça limpo (sem bordas ou sobreposições)
      cleanupCustomFavicon();
    } catch (err) {
      console.error('[Tab Marker] Erro ao aplicar marcador:', err);
    } finally {
      setTimeout(() => {
        isApplyingMarker = false;
      }, 50);
    }
  }

  /**
   * Remove o marcador e restaura o título original
   */
  function removeMarker() {
    currentEmoji = null;

    stopTitleObserver();
    updateTabTitle(null);
    cleanupCustomFavicon();
  }

  // Ouvinte de mensagens do Background / Popup
  browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'applyMarker') {
      applyMarker(request.emoji);
      sendResponse({ success: true });
    } else if (request.action === 'removeMarker') {
      removeMarker();
      sendResponse({ success: true });
    }
    return false;
  });

  // Consulta estado inicial da aba ao carregar
  browser.runtime.sendMessage({ action: 'getTabColor' })
    .then((response) => {
      if (response && response.emoji) {
        applyMarker(response.emoji);
      }
    })
    .catch(() => {});
})();
