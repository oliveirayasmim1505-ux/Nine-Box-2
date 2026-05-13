// ====================================================================
// tour.js — Tour Guiado Interativo
// Sistema de tutorial para novos usuários com destaque de elementos
// e instruções passo a passo
// ====================================================================

(function() {
  'use strict';

  // ====================================================================
  // CONFIGURAÇÃO DO TOUR
  // ====================================================================
  
  const TOURS = {
    // Tour principal para novos usuários
    principal: [
      {
        target: 'header h2',
        title: '👋 Bem-vindo ao Portal de Estágio!',
        content: 'Este é seu sistema completo para gerenciar avaliações, competências e desenvolvimento de talentos.',
        position: 'bottom',
        showSkip: true
      },
      {
        target: '.busca-global-wrap',
        title: '🔍 Busca Global',
        content: 'Use a busca para encontrar rapidamente pessoas, avaliações e competências em todo o sistema.',
        position: 'bottom'
      },
      {
        target: '#dark-mode-btn',
        title: '🌙 Modo Escuro',
        content: 'Alterne entre modo claro e escuro para melhor conforto visual. Sua preferência é salva automaticamente.',
        position: 'bottom'
      },
      {
        target: '#notif-btn',
        title: '🔔 Notificações',
        content: 'Receba alertas sobre prazos de avaliações 180° e outras atividades importantes.',
        position: 'bottom'
      },
      {
        target: '#user-btn',
        title: '👤 Perfil',
        content: 'Acesse seu perfil, edite informações e faça logout por aqui.',
        position: 'bottom'
      },
      {
        target: '.navbar',
        title: '📍 Menu de Navegação',
        content: 'Navegue entre as diferentes seções do sistema. Os itens estão organizados por funcionalidade.',
        position: 'bottom',
        highlight: 'full'
      },
      {
        target: '.navbar-item:nth-child(2)',
        title: '➕ Cadastrar',
        content: 'Cadastre novos gestores e estagiários no sistema.',
        position: 'bottom'
      },
      {
        target: '.navbar-item:nth-child(5)',
        title: '⭐ Avaliações',
        content: 'Acesse todas as ferramentas de avaliação: avaliações individuais, Nine Box, competências e avaliação 180°.',
        position: 'bottom'
      },
      {
        target: '.dash-stats',
        title: '📊 Estatísticas',
        content: 'Acompanhe em tempo real o número de gestores, estagiários, avaliações e pessoas no Nine Box.',
        position: 'top'
      },
      {
        target: '.container',
        title: '🎯 Acesso Rápido',
        content: 'Use estes cards para acessar rapidamente as principais funcionalidades do sistema.',
        position: 'top'
      },
      {
        target: 'body',
        title: '✅ Pronto para começar!',
        content: 'Você já conhece o básico. Explore o sistema e descubra todas as funcionalidades. Você pode rever este tour a qualquer momento clicando em "Ajuda" no menu.',
        position: 'center',
        showSkip: false,
        isLast: true
      }
    ],
    
    // Tour específico para avaliações
    avaliacoes: [
      {
        target: '.av-form-card',
        title: '📝 Nova Avaliação',
        content: 'Crie avaliações para gestores ou estagiários. Escolha o tipo, selecione a pessoa e avalie as competências.',
        position: 'right'
      },
      {
        target: '.av-historico-card',
        title: '📚 Histórico',
        content: 'Visualize todas as avaliações realizadas. Use os filtros para encontrar avaliações específicas.',
        position: 'left'
      }
    ]
  };

  // ====================================================================
  // ESTADO DO TOUR
  // ====================================================================
  
  let tourAtivo = null;
  let passoAtual = 0;
  let overlay = null;
  let tooltip = null;

  // ====================================================================
  // CRIAÇÃO DOS ELEMENTOS DO TOUR
  // ====================================================================
  
  function criarOverlay() {
    overlay = document.createElement('div');
    overlay.className = 'tour-overlay';
    overlay.innerHTML = `
      <div class="tour-highlight"></div>
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  function criarTooltip() {
    tooltip = document.createElement('div');
    tooltip.className = 'tour-tooltip';
    tooltip.innerHTML = `
      <div class="tour-tooltip-header">
        <h4 class="tour-tooltip-title"></h4>
        <button class="tour-tooltip-close" onclick="window.tourGuiado.fechar()" aria-label="Fechar tour">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div class="tour-tooltip-content"></div>
      <div class="tour-tooltip-footer">
        <div class="tour-tooltip-progress">
          <span class="tour-tooltip-step"></span>
        </div>
        <div class="tour-tooltip-actions">
          <button class="tour-btn-skip" onclick="window.tourGuiado.pular()">Pular tour</button>
          <button class="tour-btn-prev" onclick="window.tourGuiado.anterior()">
            <i class="fa-solid fa-chevron-left"></i> Anterior
          </button>
          <button class="tour-btn-next" onclick="window.tourGuiado.proximo()">
            Próximo <i class="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(tooltip);
    return tooltip;
  }

  // ====================================================================
  // POSICIONAMENTO DO TOOLTIP
  // ====================================================================
  
  function posicionarTooltip(target, position) {
    if (!tooltip || !target) return;

    const rect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const spacing = 20;

    tooltip.style.position = 'fixed';
    tooltip.style.zIndex = '10002';

    // Remove classes de posição anteriores
    tooltip.classList.remove('tour-tooltip-top', 'tour-tooltip-bottom', 'tour-tooltip-left', 'tour-tooltip-right', 'tour-tooltip-center');

    if (position === 'center') {
      tooltip.classList.add('tour-tooltip-center');
      tooltip.style.top = '50%';
      tooltip.style.left = '50%';
      tooltip.style.transform = 'translate(-50%, -50%)';
      return;
    }

    switch (position) {
      case 'top':
        tooltip.classList.add('tour-tooltip-top');
        tooltip.style.top = `${rect.top - tooltipRect.height - spacing}px`;
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.transform = 'translateX(-50%)';
        break;
      
      case 'bottom':
        tooltip.classList.add('tour-tooltip-bottom');
        tooltip.style.top = `${rect.bottom + spacing}px`;
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.transform = 'translateX(-50%)';
        break;
      
      case 'left':
        tooltip.classList.add('tour-tooltip-left');
        tooltip.style.top = `${rect.top + rect.height / 2}px`;
        tooltip.style.left = `${rect.left - tooltipRect.width - spacing}px`;
        tooltip.style.transform = 'translateY(-50%)';
        break;
      
      case 'right':
        tooltip.classList.add('tour-tooltip-right');
        tooltip.style.top = `${rect.top + rect.height / 2}px`;
        tooltip.style.left = `${rect.right + spacing}px`;
        tooltip.style.transform = 'translateY(-50%)';
        break;
    }

    // Ajusta se sair da tela
    const finalRect = tooltip.getBoundingClientRect();
    if (finalRect.right > window.innerWidth - 10) {
      tooltip.style.left = `${window.innerWidth - finalRect.width - 10}px`;
      tooltip.style.transform = 'none';
    }
    if (finalRect.left < 10) {
      tooltip.style.left = '10px';
      tooltip.style.transform = 'none';
    }
    if (finalRect.bottom > window.innerHeight - 10) {
      tooltip.style.top = `${window.innerHeight - finalRect.height - 10}px`;
    }
    if (finalRect.top < 10) {
      tooltip.style.top = '10px';
    }
  }

  // ====================================================================
  // DESTAQUE DO ELEMENTO
  // ====================================================================
  
  function destacarElemento(target, highlight) {
    const highlightEl = overlay.querySelector('.tour-highlight');
    if (!highlightEl || !target) return;

    const rect = target.getBoundingClientRect();
    const padding = 8;

    if (highlight === 'full') {
      // Destaca o elemento completo
      highlightEl.style.top = `${rect.top - padding}px`;
      highlightEl.style.left = `${rect.left - padding}px`;
      highlightEl.style.width = `${rect.width + padding * 2}px`;
      highlightEl.style.height = `${rect.height + padding * 2}px`;
    } else {
      // Destaque padrão
      highlightEl.style.top = `${rect.top - padding}px`;
      highlightEl.style.left = `${rect.left - padding}px`;
      highlightEl.style.width = `${rect.width + padding * 2}px`;
      highlightEl.style.height = `${rect.height + padding * 2}px`;
    }

    highlightEl.style.display = 'block';
    
    // Scroll suave até o elemento
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // ====================================================================
  // CONTROLE DO TOUR
  // ====================================================================
  
  function mostrarPasso(index) {
    if (!tourAtivo || index < 0 || index >= tourAtivo.length) return;

    const passo = tourAtivo[index];
    passoAtual = index;

    // Atualiza conteúdo do tooltip
    tooltip.querySelector('.tour-tooltip-title').textContent = passo.title;
    tooltip.querySelector('.tour-tooltip-content').textContent = passo.content;
    tooltip.querySelector('.tour-tooltip-step').textContent = `${index + 1} de ${tourAtivo.length}`;

    // Controla visibilidade dos botões
    const btnPrev = tooltip.querySelector('.tour-btn-prev');
    const btnNext = tooltip.querySelector('.tour-btn-next');
    const btnSkip = tooltip.querySelector('.tour-btn-skip');

    btnPrev.style.display = index === 0 ? 'none' : 'flex';
    btnSkip.style.display = passo.showSkip !== false ? 'inline-flex' : 'none';
    
    if (passo.isLast) {
      btnNext.innerHTML = 'Concluir <i class="fa-solid fa-check"></i>';
    } else {
      btnNext.innerHTML = 'Próximo <i class="fa-solid fa-chevron-right"></i>';
    }

    // Encontra e destaca o elemento alvo
    const target = passo.target === 'body' ? document.body : document.querySelector(passo.target);
    
    if (target && passo.target !== 'body') {
      destacarElemento(target, passo.highlight);
      posicionarTooltip(target, passo.position || 'bottom');
    } else {
      // Sem destaque (para mensagens centralizadas)
      overlay.querySelector('.tour-highlight').style.display = 'none';
      posicionarTooltip(document.body, 'center');
    }

    // Mostra overlay e tooltip
    overlay.classList.add('tour-overlay-active');
    tooltip.classList.add('tour-tooltip-active');
  }

  // ====================================================================
  // API PÚBLICA
  // ====================================================================
  
  window.tourGuiado = {
    iniciar: function(nomeTour = 'principal') {
      if (!TOURS[nomeTour]) {
        console.warn(`Tour "${nomeTour}" não encontrado`);
        return;
      }

      tourAtivo = TOURS[nomeTour];
      passoAtual = 0;

      if (!overlay) criarOverlay();
      if (!tooltip) criarTooltip();

      mostrarPasso(0);

      // Salva que o usuário já viu o tour
      localStorage.setItem('tourVisto_' + nomeTour, 'true');
    },

    proximo: function() {
      if (!tourAtivo) return;
      
      if (passoAtual < tourAtivo.length - 1) {
        mostrarPasso(passoAtual + 1);
      } else {
        this.fechar();
      }
    },

    anterior: function() {
      if (!tourAtivo || passoAtual === 0) return;
      mostrarPasso(passoAtual - 1);
    },

    pular: function() {
      this.fechar();
      showToast('Tour cancelado. Você pode reiniciá-lo a qualquer momento.', 'info');
    },

    fechar: function() {
      if (overlay) overlay.classList.remove('tour-overlay-active');
      if (tooltip) tooltip.classList.remove('tour-tooltip-active');
      tourAtivo = null;
      passoAtual = 0;
    },

    jaVisto: function(nomeTour = 'principal') {
      return localStorage.getItem('tourVisto_' + nomeTour) === 'true';
    },

    resetar: function(nomeTour = 'principal') {
      localStorage.removeItem('tourVisto_' + nomeTour);
      showToast('Tour resetado! Recarregue a página para vê-lo novamente.', 'success');
    }
  };

  // ====================================================================
  // INICIALIZAÇÃO AUTOMÁTICA
  // ====================================================================
  
  document.addEventListener('DOMContentLoaded', () => {
    // Verifica se é a primeira visita do usuário
    const primeiraVisita = !localStorage.getItem('tourVisto_principal');
    const sessao = (() => {
      try { return JSON.parse(localStorage.getItem('perfilLogado') || 'null'); } catch(e) { return null; }
    })();

    // Inicia o tour automaticamente para novos usuários logados
    if (primeiraVisita && sessao && window.location.pathname.includes('index.html')) {
      setTimeout(() => {
        window.tourGuiado.iniciar('principal');
      }, 1000);
    }
  });

  // Reposiciona tooltip ao redimensionar janela
  window.addEventListener('resize', () => {
    if (tourAtivo && passoAtual >= 0) {
      mostrarPasso(passoAtual);
    }
  });

})();
