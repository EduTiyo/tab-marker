# 🔴 Tab Marker - Extensão para Firefox

**Tab Marker** é uma extensão leve e elegante para o Mozilla Firefox (Manifest V3) que permite adicionar um marcador circular colorido de alto contraste no canto superior direito do favicon das abas. Isso facilita a identificação visual, categorização e organização de abas abertas no navegador.

---

## ✨ Funcionalidades

- **Identificação Visual por Emojis Coloridos no Título (ex: `🔴`, `🟡`, `🟢`)**:
  - Aparece no início do título da aba em tamanho total da fonte (~14px), renderizado nativamente pelo sistema operacional.
  - O **favicon original do site fica 100% limpo, original e intocado** (sem bordas ou sobreposições que poluam o logo).
  - Máxima visibilidade e legibilidade mesmo em grupos de abas e abas compactas.
- **Dupla Forma de Interação**:
  - **Menu de Contexto da Aba**: Clique com o botão direito em qualquer aba e escolha diretamente a cor desejada ou selecione *Remover marcação*.
  - **Popup na Barra de Ferramentas**: Clique no ícone da extensão para ver o status da aba ativa, selecionar cores rápidas, usar o seletor livre (color picker/HEX) ou remover a cor.
- **Persistência Vinculada à Aba**: A marcação permanece ativa ao recarregar a página (`F5`), ao navegar por links diferentes na mesma aba e ao restaurar sessões do Firefox (através da API nativa `browser.sessions`).
- **Resiliente a Sites Modernos (SPAs & Favicons Dinâmicos)**: Utiliza `MutationObserver` e bypass inteligente de CORS via script de background para garantir compatibilidade com sites que atualizam seus favicons dinamicamente (como Gmail, YouTube, Slack, GitHub, etc.).

---

## 🎨 Cores Pré-definidas

| Cor | Hex | Indicador |
|---|---|---|
| Vermelho | `#ef4444` | 🔴 |
| Laranja | `#f97316` | 🟠 |
| Amarelo | `#eab308` | 🟡 |
| Verde | `#22c55e` | 🟢 |
| Ciano | `#06b6d4` | 🌐 |
| Azul | `#3b82f6` | 🔵 |
| Roxo | `#a855f7` | 🟣 |
| Rosa | `#ec4899` | 🌸 |
| Cinza | `#64748b` | ⚪ |
| *Personalizada* | *Qualquer HEX* | 🎨 |

---

## 🚀 Como Instalar no Firefox (Modo de Desenvolvimento)

Para testar e utilizar a extensão localmente no Firefox:

1. Abra o **Mozilla Firefox**.
2. Na barra de endereços, digite:
   ```text
   about:debugging#/runtime/this-firefox
   ```
   e pressione `Enter`.
3. Clique no botão **"Carregar extensão temporária..."** (*Load Temporary Add-on...*).
4. Navegue até a pasta deste projeto:
   ```text
   /Users/eduardotiyo/Documents/tab-marker
   ```
5. Selecione o arquivo `manifest.json`.
6. Pronto! A extensão será carregada imediatamente. O menu de contexto de clique direito nas abas e o ícone na barra de ferramentas já estarão ativos.

---

## 📁 Estrutura de Arquivos

```text
tab-marker/
├── manifest.json         # Configuração Manifest V3 do Firefox
├── background.js         # Gerencia menus da aba, eventos de ciclo de vida e sessões
├── content.js            # Manipula o canvas do favicon na página e observa mudanças
├── generate_icons.py     # Script Python para regeneração dos ícones do plugin
├── icons/                # Ícones da extensão
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   └── icon-128.png
├── popup/                # Interface da janela popup
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── .gitignore
└── README.md
```

---

## 📦 Como Empacotar para Instalação Permanente (.zip / .xpi)

Para gerar o arquivo compactado para distribuição ou envio ao [Firefox Add-ons (AMO)](https://addons.mozilla.org/):

No terminal, dentro da pasta `tab-marker`:
```bash
zip -r -FS tab-marker.zip manifest.json background.js content.js icons popup
```
Ou com a ferramenta oficial da Mozilla (`web-ext`):
```bash
npx web-ext build
```
