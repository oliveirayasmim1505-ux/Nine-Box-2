// ====================================================================
// enhancements.js — Melhorias visuais e UX globais
// Scroll-to-top, transição de página, favicon, lazy load,
// confirmação de logout, breadcrumb, empty states
// ====================================================================

(function () {

  // ====================================================================
  // FAVICON DINÂMICO
  // ====================================================================
  function injetarFavicon() {
    if (document.querySelector('link[rel="icon"]')) return;
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/svg+xml';
    // SVG inline de um chapéu de formatura
    link.href = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%231e3a8a'/%3E%3Ctext y='.9em' font-size='75' x='12' fill='white'%3E🎓%3C/text%3E%3C/svg%3E";
    document.head.appendChild(link);
  }

  // ====================================================================
  // SCROLL TO TOP
  // ====================================================================
  function injetarScrollTop() {
    if (document.getElementById('scroll-top-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'scroll-top-btn';
    btn.title = 'Voltar ao topo';
    btn.setAttribute('aria-label', 'Voltar ao topo');
    btn.innerHTML = '<i class="fa-solid fa-chevron-up" aria-hidden="true"></i>';
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    document.body.appendChild(btn);

    // Mostra/oculta conforme o scroll
    window.addEventListener('scroll', () => {
      btn.classList.toggle('visible', window.scrollY > 300);
    }, { passive: true });
  }

  // ====================================================================
  // LISTENER GLOBAL — data-action="logout"
  // Captura cliques no botão Sair da conta em qualquer página,
  // usando delegação para funcionar mesmo com elementos criados dinamicamente.
  // ====================================================================
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action="logout"]');
    if (el) {
      e.preventDefault();
      e.stopImmediatePropagation();
      abrirConfirmacaoLogout();
    }
  }, true); // true = fase de captura, roda antes da transição de página

  // ====================================================================
  // TRANSIÇÃO SUAVE ENTRE PÁGINAS
  // ====================================================================
  function injetarTransicaoPagina() {
    if (document.getElementById('page-transition-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'page-transition-overlay';
    overlay.className = 'page-transition-overlay';
    document.body.appendChild(overlay);

    // Intercepta cliques em links internos
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href]');
      if (!link) return;

      const href = link.getAttribute('href');
      // Ignora links externos, âncoras, javascript: e target="_blank"
      if (!href || href.startsWith('http') || href.startsWith('#') ||
          href.startsWith('javascript') || href.startsWith('mailto') ||
          link.target === '_blank') return;

      e.preventDefault();
      overlay.classList.add('fade-out');
      setTimeout(() => {
        window.location.href = href;
      }, 200);
    });
  }

  // ====================================================================
  // CONFIRMAÇÃO DE LOGOUT
  // ====================================================================
  function injetarConfirmacaoLogout() {
    if (document.getElementById('logout-confirm-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'logout-confirm-overlay';
    overlay.className = 'logout-confirm-overlay';
    overlay.innerHTML = `
      <div class="logout-confirm-card">
        <div class="logout-confirm-icon">
          <i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i>
        </div>
        <h4>Sair da conta?</h4>
        <p>Você será desconectado e precisará fazer login novamente para acessar o sistema.</p>
        <div class="logout-confirm-btns">
          <button class="logout-btn-cancel" onclick="fecharConfirmacaoLogout()">Cancelar</button>
          <button class="logout-btn-confirm" onclick="confirmarLogout()">Sair</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Fecha ao clicar no overlay
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) fecharConfirmacaoLogout();
    });

    // Fecha com ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) {
        fecharConfirmacaoLogout();
      }
    });
  }

  window.abrirConfirmacaoLogout = function () {
    const overlay = document.getElementById('logout-confirm-overlay');
    if (overlay) overlay.classList.add('open');
  };

  window.fecharConfirmacaoLogout = function () {
    const overlay = document.getElementById('logout-confirm-overlay');
    if (overlay) overlay.classList.remove('open');
  };

  window.confirmarLogout = function () {
    // Remove APENAS a sessão — todos os dados cadastrados ficam preservados
    localStorage.removeItem('perfilLogado');
    // Redireciona para a home (index.html)
    const isInPages = window.location.pathname.includes('/pages/');
    window.location.href = isInPages ? '../index.html' : 'index.html';
  };

  // Mostra/oculta itens do dropdown conforme sessão ativa
  // Só executa se o dropdown ainda não foi preenchido pelo script inline da página
  function atualizarDropdownUsuario() {
    const acoesEl = document.getElementById('user-dropdown-acoes');
    // Se já foi preenchido pelo script inline da página, não sobrescreve
    if (acoesEl && acoesEl.innerHTML.trim() !== '') return;
    const sessao = (() => {
      try { return JSON.parse(localStorage.getItem('perfilLogado') || 'null'); } catch(e) { return null; }
    })();
    const contatos = (() => {
      try { return JSON.parse(localStorage.getItem('contatos') || '[]'); } catch(e) { return []; }
    })();

    const nomeEl   = document.getElementById('user-dropdown-nome');
    const tipoEl   = document.getElementById('user-dropdown-tipo');
    const avatarEl = document.getElementById('user-dropdown-avatar');
    const acoesEl  = document.getElementById('user-dropdown-acoes');

    // Determina o href correto para perfil
    const isInPages = window.location.pathname.includes('/pages/');
    const perfilHref = isInPages ? '../perfil.html' : 'perfil.html';

    if (sessao) {
      const pessoa = contatos.find(c => c.id === sessao.id);
      if (pessoa) {
        if (nomeEl) nomeEl.textContent = pessoa.nome;
        if (tipoEl) tipoEl.textContent = pessoa.tipo === 'professor' ? 'Gestor' : pessoa.tipo === 'admin' ? 'Admin' : 'Estagiário';

        if (avatarEl) {
          if (pessoa.foto) {
            avatarEl.innerHTML = `<img src="${pessoa.foto}" alt="${pessoa.nome}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
          } else {
            avatarEl.innerHTML = pessoa.nome.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
            avatarEl.style.fontSize = '14px';
          }
        }

        const userBtn = document.getElementById('user-btn');
        if (userBtn) {
          if (pessoa.foto) {
            userBtn.innerHTML = `<img src="${pessoa.foto}" alt="${pessoa.nome}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
          } else {
            userBtn.innerHTML = `<i class="fa-solid fa-user" aria-hidden="true"></i>`;
          }
        }

        if (acoesEl) acoesEl.innerHTML = `
          <a href="${perfilHref}" class="user-dropdown-item">
            <i class="fa-solid fa-user-pen"></i> Editar Perfil
          </a>
          <a href="#" class="user-dropdown-item user-dropdown-sair" data-action="logout">
            <i class="fa-solid fa-right-from-bracket"></i> Sair da conta
          </a>`;
        return;
      }
    }

    if (nomeEl)   nomeEl.textContent = 'Visitante';
    if (tipoEl)   tipoEl.textContent = 'Não identificado';
    if (avatarEl) avatarEl.innerHTML = '<i class="fa-solid fa-user"></i>';

    if (acoesEl) acoesEl.innerHTML = `
      <a href="${perfilHref}" class="user-dropdown-item">
        <i class="fa-solid fa-right-to-bracket"></i> Fazer login
      </a>`;
  }

  // ====================================================================
  // LAZY LOAD DE IMAGENS
  // ====================================================================
  function ativarLazyLoad() {
    // Adiciona loading="lazy" em todas as imagens que ainda não têm
    document.querySelectorAll('img:not([loading])').forEach(img => {
      img.setAttribute('loading', 'lazy');
    });

    // Fade-in ao carregar
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.complete) {
            img.classList.add('loaded');
          } else {
            img.addEventListener('load', () => img.classList.add('loaded'), { once: true });
          }
          observer.unobserve(img);
        }
      });
    });

    document.querySelectorAll('img[loading="lazy"]').forEach(img => observer.observe(img));
  }

  // ====================================================================
  // BREADCRUMB — Gerado automaticamente por página
  // ====================================================================
  const BREADCRUMB_MAP = {
    'avaliacoes.html':    [{ label: 'Avaliações', icon: 'fa-star' }],
    'nine-box.html':      [{ label: 'Avaliações', icon: 'fa-star', href: 'avaliacoes.html' }, { label: 'Nine Box', icon: 'fa-th' }],
    'competencias.html':  [{ label: 'Avaliações', icon: 'fa-star', href: 'avaliacoes.html' }, { label: 'Competências', icon: 'fa-clipboard-check' }],
    'avaliacao-180.html': [{ label: 'Avaliações', icon: 'fa-star', href: 'avaliacoes.html' }, { label: 'Avaliação 180°', icon: 'fa-rotate' }],
    'responder-180.html': [{ label: 'Avaliações', icon: 'fa-star', href: 'avaliacoes.html' }, { label: '180°', icon: 'fa-rotate', href: 'avaliacao-180.html' }, { label: 'Responder', icon: 'fa-pen' }],
    'cadastrar.html':     [{ label: 'Cadastrar', icon: 'fa-user-plus' }],
    'consultar.html':     [{ label: 'Consultar', icon: 'fa-magnifying-glass' }],
    'relatorios.html':    [{ label: 'Relatórios', icon: 'fa-chart-bar' }],
    'contatos.html':      [{ label: 'Contatos', icon: 'fa-address-book' }],
    'sobre.html':         [{ label: 'Sobre', icon: 'fa-circle-info' }],
    'perfil.html':        [{ label: 'Perfil', icon: 'fa-user' }],
  };

  function injetarBreadcrumb() {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    const crumbs = BREADCRUMB_MAP[page];
    if (!crumbs) return; // Não mostra na home

    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    const isInPages = window.location.pathname.includes('/pages/');
    const base = isInPages ? '' : 'pages/';
    const homeHref = isInPages ? '../index.html' : 'index.html';

    const bc = document.createElement('nav');
    bc.className = 'breadcrumb';
    bc.setAttribute('aria-label', 'Navegação estrutural');

    const items = [
      `<a href="${homeHref}"><i class="fa-solid fa-home" aria-hidden="true"></i> Início</a>`
    ];

    crumbs.forEach((crumb, i) => {
      items.push('<span class="breadcrumb-sep" aria-hidden="true">›</span>');
      if (crumb.href && i < crumbs.length - 1) {
        items.push(`<a href="${base}${crumb.href}"><i class="fa-solid ${crumb.icon}" aria-hidden="true"></i> ${crumb.label}</a>`);
      } else {
        items.push(`<span class="breadcrumb-current" aria-current="page"><i class="fa-solid ${crumb.icon}" aria-hidden="true"></i> ${crumb.label}</span>`);
      }
    });

    bc.innerHTML = items.join('');
    navbar.after(bc);
  }

  // ====================================================================
  // TÍTULO DINÂMICO DA PÁGINA
  // ====================================================================
  function atualizarTitulo() {
    const sessao = (() => {
      try { return JSON.parse(localStorage.getItem('perfilLogado') || 'null'); } catch(e) { return null; }
    })();
    if (!sessao) return;

    const contatos = (() => {
      try { return JSON.parse(localStorage.getItem('contatos') || '[]'); } catch(e) { return []; }
    })();
    const pessoa = contatos.find(c => c.id === sessao.id);
    if (!pessoa) return;

    const primeiroNome = pessoa.nome.split(' ')[0];
    const tituloAtual = document.title;
    // Adiciona o nome apenas se ainda não estiver no título
    if (!tituloAtual.includes(primeiroNome)) {
      document.title = tituloAtual + ' · ' + primeiroNome;
    }
  }

  // ====================================================================
  // INTERCEPTAR BOTÕES DE SAIR
  // ====================================================================
  function interceptarBotoesSair() {
    // Substitui chamadas diretas de sairDaConta() pelo modal de confirmação
    document.querySelectorAll('[onclick*="sairDaConta"], [onclick*="sair()"]').forEach(btn => {
      btn.removeAttribute('onclick');
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        abrirConfirmacaoLogout();
      });
    });
  }

  // ====================================================================
  // INIT
  // ====================================================================
  document.addEventListener('DOMContentLoaded', () => {
    injetarFavicon();
    injetarScrollTop();
    injetarTransicaoPagina();
    injetarConfirmacaoLogout();
    injetarBreadcrumb();
    ativarLazyLoad();
    atualizarTitulo();
    // atualizarDropdownUsuario() — gerenciado pelo script inline de cada página

    // Pequeno delay para interceptar botões que podem ser criados dinamicamente
    setTimeout(interceptarBotoesSair, 300);
  });

  // Lazy load também para imagens adicionadas dinamicamente
  const imgObserver = new MutationObserver(() => ativarLazyLoad());
  document.addEventListener('DOMContentLoaded', () => {
    imgObserver.observe(document.body, { childList: true, subtree: true });
  });

})();
