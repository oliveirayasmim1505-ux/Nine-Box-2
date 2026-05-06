// ====================================================================
// navbar.js — Navbar
// Gerencia o comportamento da barra de navegação: toggle de submenu,
// dark mode (com preferência do sistema), notificações de prazo de
// avaliações 180° e ativação automática do link da página atual.
// ====================================================================

// ====================================================================
// SUBMENU — Toggle e fechamento ao clicar fora
// ====================================================================

/**
 * Abre ou fecha o submenu de um item dropdown da navbar.
 * Fecha todos os outros submenus abertos antes de alternar o atual.
 * @param {MouseEvent} e - Evento de clique (prevenido para não navegar)
 * @param {HTMLElement} link - Link que disparou o toggle
 */
function toggleSubmenu(e, link) {
  e.preventDefault();
  const item = link.closest('.navbar-item-dropdown');
  if (!item) return;
  const isOpen = item.classList.contains('open');

  // Fecha todos os outros submenus antes de abrir o atual
  document.querySelectorAll('.navbar-item-dropdown.open').forEach(el => {
    if (el !== item) el.classList.remove('open');
  });

  item.classList.toggle('open', !isOpen);
}

// Fecha qualquer submenu aberto ao clicar fora da navbar
document.addEventListener('click', (e) => {
  if (!e.target.closest('.navbar-item-dropdown')) {
    document.querySelectorAll('.navbar-item-dropdown.open').forEach(el => {
      el.classList.remove('open');
    });
  }
});

// ====================================================================
// DARK MODE — Alternância e persistência
// ====================================================================

/**
 * Aplica ou remove o dark mode no body e atualiza o ícone do botão.
 * Também re-renderiza o gráfico radar do perfil se estiver disponível,
 * pois ele precisa ser redesenhado com as cores corretas do tema.
 * @param {boolean} ativo - true para ativar dark mode, false para claro
 */
function aplicarDarkMode(ativo) {
  document.body.classList.toggle('dark-mode', ativo);
  document.body.classList.toggle('light-mode', !ativo);

  const btn = document.getElementById('dark-mode-btn');
  if (btn) {
    btn.innerHTML = ativo
      ? '<i class="fa-solid fa-sun"></i>'
      : '<i class="fa-solid fa-moon"></i>';
    btn.title = ativo ? 'Modo claro' : 'Modo escuro';
  }

  // Re-renderiza o gráfico radar se o perfil estiver aberto (cores dependem do tema)
  if (typeof renderGraficoRadar === 'function') {
    const sessao = JSON.parse(localStorage.getItem('perfilLogado') || 'null');
    if (sessao) {
      const contatos = JSON.parse(localStorage.getItem('contatos') || '[]');
      const pessoa = contatos.find(c => c.id === sessao.id);
      if (pessoa) renderGraficoRadar(pessoa);
    }
  }
}

/**
 * Alterna o dark mode e persiste a preferência no localStorage.
 */
function toggleDarkMode() {
  const ativo = !document.body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', ativo ? '1' : '0');
  aplicarDarkMode(ativo);
}

// ====================================================================
// NOTIFICAÇÕES — Prazos de avaliações 180°
// ====================================================================

/**
 * Verifica as avaliações 180° com prazo nos próximos 7 dias e
 * atualiza o badge de contagem e o dropdown de notificações.
 * Avaliações com prazo hoje, amanhã ou em até 7 dias são exibidas.
 */
function verificarNotificacoes180() {
  const btn = document.getElementById('notif-btn');
  const lista = document.getElementById('notif-lista');
  if (!btn || !lista) return;

  const avaliacoes = JSON.parse(localStorage.getItem('avaliacoes180') || '[]');
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0); // Normaliza para meia-noite para comparação de datas

  const notifs = [];

  avaliacoes.forEach(av => {
    if (!av.fim) return;
    const fim = new Date(av.fim);
    fim.setHours(0, 0, 0, 0);
    const diffMs = fim - hoje;
    const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    // Inclui apenas avaliações que vencem hoje ou nos próximos 7 dias
    if (diffDias >= 0 && diffDias <= 7) {
      notifs.push({ av, diffDias });
    }
  });

  // Atualiza o badge com a contagem de notificações pendentes
  const badge = btn.querySelector('.notif-badge');
  if (notifs.length > 0) {
    if (badge) {
      badge.textContent = notifs.length;
      badge.style.display = 'flex';
    }
  } else {
    if (badge) badge.style.display = 'none';
  }

  // Dropdown
  if (notifs.length === 0) {
    lista.innerHTML = '<div class="notif-empty">Nenhuma notificação pendente.</div>';
  } else {
    lista.innerHTML = notifs.map(({ av, diffDias }) => {
      // Texto descritivo do prazo conforme a proximidade
      const textoData = diffDias === 0
        ? 'Vence hoje!'
        : diffDias === 1
          ? 'Vence amanhã'
          : `Vence em ${diffDias} dias`;
      return `
        <div class="notif-item" onclick="window.location.href='${window.location.pathname.includes('/pages/') ? '' : 'pages/'}avaliacao-180.html'">
          <i class="fa-solid fa-rotate notif-item-icon"></i>
          <div class="notif-item-body">
            <div class="notif-item-titulo">${av.nome}</div>
            <div class="notif-item-data">${textoData} — ${av.fim}</div>
          </div>
        </div>`;
    }).join('');
  }
}

/**
 * Abre ou fecha o dropdown de notificações.
 * Fecha o dropdown de usuário se estiver aberto.
 */
function toggleNotifDropdown() {
  const dropdown = document.getElementById('notif-dropdown');
  if (!dropdown) return;
  const isOpen = dropdown.classList.contains('open');
  // Fecha o dropdown de usuário se estiver aberto simultaneamente
  const userDropdown = document.getElementById('user-dropdown');
  if (userDropdown) userDropdown.classList.remove('open');
  dropdown.classList.toggle('open', !isOpen);
}

// Fecha o dropdown de notificações ao clicar fora do wrapper
document.addEventListener('click', (e) => {
  const wrap = document.getElementById('notif-wrap');
  if (wrap && !wrap.contains(e.target)) {
    const dropdown = document.getElementById('notif-dropdown');
    if (dropdown) dropdown.classList.remove('open');
  }
});

// ====================================================================
// INICIALIZAÇÃO — Ativação de links e configurações iniciais
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  const page = path.split('/').pop() || 'index.html';

  // Ativa o link da navbar correspondente à página atual (links normais)
  document.querySelectorAll('.navbar-link:not(.navbar-link-dropdown)').forEach(link => {
    link.classList.remove('active');
    const href = link.getAttribute('href');
    if (!href) return;
    const hrefPage = href.split('/').pop();

    // Trata o caso especial da página inicial (index.html ou raiz)
    if ((page === 'index.html' || page === '') && (hrefPage === 'index.html' || href === 'index.html' || href === '../index.html')) {
      link.classList.add('active');
      return;
    }
    if (hrefPage && hrefPage !== 'index.html' && page === hrefPage) {
      link.classList.add('active');
    }
  });

  // Ativa links de submenu e marca o item pai como ativo se um filho estiver ativo
  document.querySelectorAll('.navbar-submenu-link').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    const hrefPage = href.split('/').pop();
    if (hrefPage && page === hrefPage) {
      link.classList.add('active');
      // Marca o link pai (dropdown) como ativo também
      const parentItem = link.closest('.navbar-item-dropdown');
      if (parentItem) {
        const parentLink = parentItem.querySelector('.navbar-link-dropdown');
        if (parentLink) parentLink.classList.add('active');
      }
    }
  });

  // Exibe o primeiro nome do usuário logado no link do Perfil
  try {
    const sessao = JSON.parse(localStorage.getItem('perfilLogado') || 'null');
    if (sessao) {
      const contatos = JSON.parse(localStorage.getItem('contatos') || '[]');
      const pessoa = contatos.find(c => c.id === sessao.id);
      if (pessoa) {
        const perfilLink = document.querySelector('.navbar-link[href*="perfil"]');
        if (perfilLink) {
          const span = perfilLink.querySelector('span');
          if (span) {
            const primeiroNome = pessoa.nome.split(' ')[0];
            span.textContent = primeiroNome;
          }
          // Troca o ícone padrão pelo ícone de usuário logado
          const icon = perfilLink.querySelector('i');
          if (icon) icon.className = 'fa-solid fa-circle-user';
        }
      }
    }
  } catch (e) {}

  // Aplica o dark mode salvo antes de renderizar para evitar flash de tema errado
  const darkSalvo = localStorage.getItem('darkMode');
  const prefereEscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
  // Usa a preferência salva; se não houver, respeita a preferência do sistema
  const deveAtivar = darkSalvo === '1' || (darkSalvo === null && prefereEscuro);

  // Remove a classe temporária do <html> (aplicada inline para evitar flash) e aplica no body
  document.documentElement.classList.remove('dark-mode-early');
  aplicarDarkMode(deveAtivar);

  // Verifica e exibe notificações de prazo das avaliações 180°
  verificarNotificacoes180();
});
