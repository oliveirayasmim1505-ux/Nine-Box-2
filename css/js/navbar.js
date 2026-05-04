// =============================================
// NAVBAR — ATIVAÇÃO AUTOMÁTICA POR URL + USUÁRIO LOGADO + SUBMENU + DARK MODE
// =============================================

// ---- SUBMENU TOGGLE ----
function toggleSubmenu(e, link) {
  e.preventDefault();
  const item = link.closest('.navbar-item-dropdown');
  if (!item) return;
  const isOpen = item.classList.contains('open');

  // Fechar todos os outros submenus
  document.querySelectorAll('.navbar-item-dropdown.open').forEach(el => {
    if (el !== item) el.classList.remove('open');
  });

  item.classList.toggle('open', !isOpen);
}

// Fechar submenu ao clicar fora
document.addEventListener('click', (e) => {
  if (!e.target.closest('.navbar-item-dropdown')) {
    document.querySelectorAll('.navbar-item-dropdown.open').forEach(el => {
      el.classList.remove('open');
    });
  }
});

// ---- DARK MODE ----
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

  // Re-renderizar gráfico radar se disponível
  if (typeof renderGraficoRadar === 'function') {
    const sessao = JSON.parse(localStorage.getItem('perfilLogado') || 'null');
    if (sessao) {
      const contatos = JSON.parse(localStorage.getItem('contatos') || '[]');
      const pessoa = contatos.find(c => c.id === sessao.id);
      if (pessoa) renderGraficoRadar(pessoa);
    }
  }
}

function toggleDarkMode() {
  const ativo = !document.body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', ativo ? '1' : '0');
  aplicarDarkMode(ativo);
}

// ---- NOTIFICAÇÕES DE PRAZO (AVALIAÇÕES 180°) ----
function verificarNotificacoes180() {
  const btn = document.getElementById('notif-btn');
  const lista = document.getElementById('notif-lista');
  if (!btn || !lista) return;

  const avaliacoes = JSON.parse(localStorage.getItem('avaliacoes180') || '[]');
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const notifs = [];

  avaliacoes.forEach(av => {
    if (!av.fim) return;
    const fim = new Date(av.fim);
    fim.setHours(0, 0, 0, 0);
    const diffMs = fim - hoje;
    const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDias >= 0 && diffDias <= 7) {
      notifs.push({ av, diffDias });
    }
  });

  // Badge
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

function toggleNotifDropdown() {
  const dropdown = document.getElementById('notif-dropdown');
  if (!dropdown) return;
  const isOpen = dropdown.classList.contains('open');
  // Fechar user-dropdown se aberto
  const userDropdown = document.getElementById('user-dropdown');
  if (userDropdown) userDropdown.classList.remove('open');
  dropdown.classList.toggle('open', !isOpen);
}

// Fechar notif dropdown ao clicar fora
document.addEventListener('click', (e) => {
  const wrap = document.getElementById('notif-wrap');
  if (wrap && !wrap.contains(e.target)) {
    const dropdown = document.getElementById('notif-dropdown');
    if (dropdown) dropdown.classList.remove('open');
  }
});

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  const page = path.split('/').pop() || 'index.html';

  // Ativar link correto (links normais)
  document.querySelectorAll('.navbar-link:not(.navbar-link-dropdown)').forEach(link => {
    link.classList.remove('active');
    const href = link.getAttribute('href');
    if (!href) return;
    const hrefPage = href.split('/').pop();

    if ((page === 'index.html' || page === '') && (hrefPage === 'index.html' || href === 'index.html' || href === '../index.html')) {
      link.classList.add('active');
      return;
    }
    if (hrefPage && hrefPage !== 'index.html' && page === hrefPage) {
      link.classList.add('active');
    }
  });

  // Ativar submenu links e marcar pai como ativo se filho estiver ativo
  document.querySelectorAll('.navbar-submenu-link').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    const hrefPage = href.split('/').pop();
    if (hrefPage && page === hrefPage) {
      link.classList.add('active');
      // Marcar o link pai como ativo também
      const parentItem = link.closest('.navbar-item-dropdown');
      if (parentItem) {
        const parentLink = parentItem.querySelector('.navbar-link-dropdown');
        if (parentLink) parentLink.classList.add('active');
      }
    }
  });

  // Mostrar nome do usuário logado no link do Perfil
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
          const icon = perfilLink.querySelector('i');
          if (icon) icon.className = 'fa-solid fa-circle-user';
        }
      }
    }
  } catch (e) {}

  // Aplicar dark mode salvo
  const darkSalvo = localStorage.getItem('darkMode');
  if (darkSalvo === '1') {
    aplicarDarkMode(true);
  } else if (darkSalvo === null) {
    // Respeitar preferência do sistema se não houver preferência salva
    const prefereEscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
    aplicarDarkMode(prefereEscuro);
  }

  // Verificar notificações de prazo
  verificarNotificacoes180();
});
