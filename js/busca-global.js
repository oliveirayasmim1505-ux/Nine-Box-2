// ============================================================
// BUSCA-GLOBAL.JS — Busca em tempo real no header
// Pesquisa em: pessoas, avaliações, competências e avaliações 180°
// Encapsulado em IIFE para não poluir o escopo global
// ============================================================

(function () {

  /**
   * Escapa caracteres HTML para prevenir XSS ao inserir texto no DOM.
   * @param {string} str
   * @returns {string}
   */
  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Detecta se a página atual está dentro da pasta /pages/
   * para montar os links relativos corretamente.
   * @returns {string} '../' se estiver em /pages/, '' se estiver na raiz
   */
  function getBasePath() {
    return window.location.pathname.includes('/pages/') ? '../' : '';
  }

  // Timer do debounce para evitar múltiplos JSON.parse por keystroke
  let debounceTimer = null;

  /**
   * Executa a busca global com debounce de 250ms.
   * Chamada pelo atributo oninput do campo de busca no HTML.
   * @param {string} termo - Texto digitado pelo usuário
   */
  function buscarGlobal(termo) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => _executarBusca(termo), 250);
  }

  function _executarBusca(termo) {
    const dropdown = document.getElementById('busca-global-dropdown');
    if (!dropdown) return;

    const t = (termo || '').trim().toLowerCase();

    // Oculta o dropdown se o termo for muito curto
    if (t.length < 2) {
      dropdown.classList.remove('open');
      dropdown.innerHTML = '';
      return;
    }

    const base       = getBasePath();
    const resultados = [];

    // ---- Busca em Pessoas (contatos cadastrados) ----
    try {
      const contatos = JSON.parse(localStorage.getItem('contatos') || '[]');
      const pessoas  = contatos.filter(c =>
        (c.nome  || '').toLowerCase().includes(t) ||
        (c.email || '').toLowerCase().includes(t)
      );
      if (pessoas.length > 0) {
        resultados.push({
          grupo: 'Pessoas',
          icon:  'fa-solid fa-users',
          itens: pessoas.slice(0, 5).map(c => ({
            texto: escapeHtml(c.nome),
            sub:   escapeHtml(c.email || (c.tipo === 'professor' ? 'Gestor' : 'Estagiário')),
            url:   base + 'pages/consultar.html',
            icon:  c.tipo === 'professor' ? 'fa-solid fa-chalkboard-user' : 'fa-solid fa-user-tie',
          })),
        });
      }
    } catch (e) {}

    // ---- Busca em Avaliações (professor/estagiário) ----
    try {
      const avaliacoes = JSON.parse(localStorage.getItem('avaliacoes') || '[]');
      const avs        = avaliacoes.filter(a =>
        (a.avaliado || '').toLowerCase().includes(t)
      );
      if (avs.length > 0) {
        resultados.push({
          grupo: 'Avaliações',
          icon:  'fa-solid fa-star',
          itens: avs.slice(0, 5).map(a => ({
            texto: escapeHtml(a.avaliado),
            sub:   escapeHtml(`Média: ${a.media || '—'} ★ — ${a.data || ''}`),
            url:   base + 'pages/avaliacoes.html',
            icon:  'fa-solid fa-star',
          })),
        });
      }
    } catch (e) {}

    // ---- Busca em Competências ----
    try {
      const competencias = JSON.parse(localStorage.getItem('competencias') || '[]');
      const comps        = competencias.filter(c =>
        (c.nome || '').toLowerCase().includes(t)
      );
      if (comps.length > 0) {
        resultados.push({
          grupo: 'Competências',
          icon:  'fa-solid fa-clipboard-check',
          itens: comps.slice(0, 5).map(c => ({
            texto: escapeHtml(c.nome),
            sub:   escapeHtml(c.tipo || 'Competência'),
            url:   base + 'pages/competencias.html',
            icon:  'fa-solid fa-clipboard-check',
          })),
        });
      }
    } catch (e) {}

    // ---- Busca em Avaliações 180° ----
    try {
      const av180  = JSON.parse(localStorage.getItem('avaliacoes180') || '[]');
      const avs180 = av180.filter(a =>
        (a.nome    || '').toLowerCase().includes(t) ||
        (a.empresa || '').toLowerCase().includes(t) ||
        (a.gestor  || '').toLowerCase().includes(t)
      );
      if (avs180.length > 0) {
        resultados.push({
          grupo: 'Avaliações 180°',
          icon:  'fa-solid fa-rotate',
          itens: avs180.slice(0, 5).map(a => ({
            texto: escapeHtml(a.nome),
            sub:   escapeHtml(a.empresa || a.gestor || '180°'),
            url:   base + 'pages/avaliacao-180.html',
            icon:  'fa-solid fa-rotate',
          })),
        });
      }
    } catch (e) {}

    // Nenhum resultado encontrado
    if (resultados.length === 0) {
      dropdown.innerHTML = '<div class="busca-global-vazio">Nenhum resultado encontrado.</div>';
      dropdown.classList.add('open');
      return;
    }

    // Renderiza os grupos e itens no dropdown
    dropdown.innerHTML = resultados.map(grupo => `
      <div class="busca-global-grupo">
        <span><i class="${grupo.icon}"></i> ${grupo.grupo}</span>
      </div>
      ${grupo.itens.map(item => `
        <a class="busca-global-item" href="${item.url}">
          <i class="${item.icon} busca-global-item-icon"></i>
          <div class="busca-global-item-body">
            <div class="busca-global-item-texto">${item.texto}</div>
            <div class="busca-global-item-sub">${item.sub}</div>
          </div>
        </a>
      `).join('')}
    `).join('');

    dropdown.classList.add('open');
  }

  // Fecha o dropdown ao clicar fora da área de busca
  document.addEventListener('click', (e) => {
    const wrap     = document.getElementById('busca-global-wrap');
    const dropdown = document.getElementById('busca-global-dropdown');
    if (wrap && !wrap.contains(e.target) && dropdown) {
      dropdown.classList.remove('open');
    }
  });

  // Fecha o dropdown ao pressionar ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const dropdown = document.getElementById('busca-global-dropdown');
      const input    = document.getElementById('busca-global-input');
      if (dropdown) dropdown.classList.remove('open');
      if (input)    input.blur();
    }
  });

  // Expõe a função globalmente para uso no atributo oninput do HTML
  window.buscarGlobal = buscarGlobal;

})();
