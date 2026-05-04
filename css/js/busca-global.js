// =============================================
// BUSCA GLOBAL
// =============================================

(function () {
  // Detecta se estamos em /pages/ ou na raiz
  function getBasePath() {
    const path = window.location.pathname;
    return path.includes('/pages/') ? '../' : '';
  }

  function buscarGlobal(termo) {
    const dropdown = document.getElementById('busca-global-dropdown');
    if (!dropdown) return;

    const t = (termo || '').trim().toLowerCase();

    if (t.length < 2) {
      dropdown.classList.remove('open');
      dropdown.innerHTML = '';
      return;
    }

    const base = getBasePath();
    const resultados = [];

    // ---- CONTATOS ----
    try {
      const contatos = JSON.parse(localStorage.getItem('contatos') || '[]');
      const pessoas = contatos.filter(c =>
        (c.nome || '').toLowerCase().includes(t) ||
        (c.email || '').toLowerCase().includes(t)
      );
      if (pessoas.length > 0) {
        resultados.push({
          grupo: 'Pessoas',
          icon: 'fa-solid fa-users',
          itens: pessoas.slice(0, 5).map(c => ({
            texto: c.nome,
            sub: c.email || (c.tipo === 'professor' ? 'Professor' : 'Estagiário'),
            url: base + 'pages/consultar.html',
            icon: c.tipo === 'professor' ? 'fa-solid fa-chalkboard-user' : 'fa-solid fa-user-tie',
          })),
        });
      }
    } catch (e) {}

    // ---- AVALIAÇÕES ----
    try {
      const avaliacoes = JSON.parse(localStorage.getItem('avaliacoes') || '[]');
      const avs = avaliacoes.filter(a =>
        (a.avaliado || '').toLowerCase().includes(t)
      );
      if (avs.length > 0) {
        resultados.push({
          grupo: 'Avaliações',
          icon: 'fa-solid fa-star',
          itens: avs.slice(0, 5).map(a => ({
            texto: a.avaliado,
            sub: `Média: ${a.media || '—'} ★ — ${a.data || ''}`,
            url: base + 'pages/avaliacoes.html',
            icon: 'fa-solid fa-star',
          })),
        });
      }
    } catch (e) {}

    // ---- COMPETÊNCIAS ----
    try {
      const competencias = JSON.parse(localStorage.getItem('competencias') || '[]');
      const comps = competencias.filter(c =>
        (c.nome || '').toLowerCase().includes(t)
      );
      if (comps.length > 0) {
        resultados.push({
          grupo: 'Competências',
          icon: 'fa-solid fa-clipboard-check',
          itens: comps.slice(0, 5).map(c => ({
            texto: c.nome,
            sub: c.tipo || 'Competência',
            url: base + 'pages/competencias.html',
            icon: 'fa-solid fa-clipboard-check',
          })),
        });
      }
    } catch (e) {}

    // ---- AVALIAÇÕES 180° ----
    try {
      const av180 = JSON.parse(localStorage.getItem('avaliacoes180') || '[]');
      const avs180 = av180.filter(a =>
        (a.nome || '').toLowerCase().includes(t) ||
        (a.empresa || '').toLowerCase().includes(t) ||
        (a.gestor || '').toLowerCase().includes(t)
      );
      if (avs180.length > 0) {
        resultados.push({
          grupo: 'Avaliações 180°',
          icon: 'fa-solid fa-rotate',
          itens: avs180.slice(0, 5).map(a => ({
            texto: a.nome,
            sub: a.empresa || a.gestor || '180°',
            url: base + 'pages/avaliacao-180.html',
            icon: 'fa-solid fa-rotate',
          })),
        });
      }
    } catch (e) {}

    if (resultados.length === 0) {
      dropdown.innerHTML = '<div class="busca-global-vazio">Nenhum resultado encontrado.</div>';
      dropdown.classList.add('open');
      return;
    }

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

  // Fechar ao clicar fora
  document.addEventListener('click', (e) => {
    const wrap = document.getElementById('busca-global-wrap');
    const dropdown = document.getElementById('busca-global-dropdown');
    if (wrap && !wrap.contains(e.target) && dropdown) {
      dropdown.classList.remove('open');
    }
  });

  // Fechar com ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const dropdown = document.getElementById('busca-global-dropdown');
      const input = document.getElementById('busca-global-input');
      if (dropdown) dropdown.classList.remove('open');
      if (input) input.blur();
    }
  });

  // Expor globalmente
  window.buscarGlobal = buscarGlobal;
})();
