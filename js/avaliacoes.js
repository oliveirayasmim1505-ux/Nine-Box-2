// ====================================================================
// avaliacoes.js — Sistema de Avaliações
// Gerencia avaliações de professores (por estrelas) e estagiários
// (por comentário), com histórico paginado e controle de permissões.
// ====================================================================

// Critérios de avaliação usados no formulário de estrelas (professor)
const CRITERIOS = [
  { key: 'pontualidade',  label: 'Pontualidade' },
  { key: 'comunicacao',   label: 'Comunicação' },
  { key: 'tecnico',       label: 'Desempenho Técnico' },
  { key: 'proatividade',  label: 'Proatividade' },
  { key: 'equipe',        label: 'Trabalho em Equipe' },
];

// Objeto que armazena as notas atuais de cada critério (0 = sem nota)
const notas = {};
CRITERIOS.forEach(c => notas[c.key] = 0);

let tipoAtual = 'professor';   // Tipo de avaliação ativo no formulário
let filtroAtual = 'todos';     // Filtro aplicado no histórico
let tipoSelecionado = null;    // Tipo escolhido na tela de seleção inicial
let paginaAtual = 1;           // Página atual do histórico lateral
let paginaAtualFull = 1;       // Página atual do histórico completo
const ITENS_POR_PAGINA = 5;    // Quantidade de itens exibidos por página

// ====================================================================
// ETAPA 1 — SELEÇÃO DO TIPO DE AVALIAÇÃO
// ====================================================================

/**
 * Marca o card de tipo selecionado e habilita o botão "Próximo".
 * @param {string} tipo - 'professor', 'estagiario' ou 'historico'
 */
function selecionarTipo(tipo) {
  tipoSelecionado = tipo;

  // Destaca visualmente o card escolhido
  document.querySelectorAll('.av-tipo-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.tipo === tipo);
  });

  const btnProximo = document.getElementById('btn-proximo');
  if (btnProximo) btnProximo.disabled = false;
}

/**
 * Avança da tela de seleção para o formulário ou para o histórico completo,
 * dependendo do tipo escolhido.
 */
function irParaFormulario() {
  if (!tipoSelecionado) return;

  // Caso especial: exibe o histórico completo em vez do formulário
  if (tipoSelecionado === 'historico') {
    document.getElementById('step-tipo').style.display = 'none';
    document.getElementById('step-historico').style.display = 'flex';
    document.getElementById('av-header-title').textContent = 'Histórico de Avaliações';
    renderHistoricoFull();
    return;
  }

  // Exibe o formulário de avaliação
  document.getElementById('step-tipo').style.display = 'none';
  document.getElementById('step-form').style.display = 'block';
  document.getElementById('av-header-title').textContent =
    tipoSelecionado === 'professor' ? 'Avaliar Professor' : 'Avaliar Estagiário';

  tipoAtual = tipoSelecionado;
  setTipo(tipoSelecionado);
  initAllStars();
  renderHistorico();
}

/**
 * Retorna à tela de seleção de tipo, limpando o estado anterior.
 */
function voltarParaTipo() {
  document.getElementById('step-form').style.display = 'none';
  document.getElementById('step-historico').style.display = 'none';
  document.getElementById('step-tipo').style.display = 'flex';
  document.getElementById('av-header-title').textContent = 'Avaliações';
  tipoSelecionado = null;

  // Remove destaque visual dos cards
  document.querySelectorAll('.av-tipo-card').forEach(c => c.classList.remove('selected'));
  const btnProximo = document.getElementById('btn-proximo');
  if (btnProximo) btnProximo.disabled = true;
}

/**
 * Renderiza o histórico completo de avaliações (tela dedicada),
 * com paginação e filtro por permissão do usuário logado.
 */
function renderHistoricoFull() {
  const container = document.getElementById('historico-lista-full');
  if (!container) return;

  let avaliacoes = getAvaliacoes();

  // Estagiários não visualizam avaliações de professores
  if (!isGestor()) {
    avaliacoes = avaliacoes.filter(a => a.tipo !== 'professor');
  }
  avaliacoes = avaliacoes.slice().reverse(); // Mais recentes primeiro

  if (avaliacoes.length === 0) {
    container.innerHTML = '<p class="av-empty">Nenhuma avaliação registrada.</p>';
    renderPaginacao('paginacao-full', 0, 0, 'full');
    return;
  }

  // Calcula a fatia da página atual
  const totalPaginas = Math.ceil(avaliacoes.length / ITENS_POR_PAGINA);
  if (paginaAtualFull > totalPaginas) paginaAtualFull = totalPaginas;
  const inicio = (paginaAtualFull - 1) * ITENS_POR_PAGINA;
  const pagina = avaliacoes.slice(inicio, inicio + ITENS_POR_PAGINA);

  container.innerHTML = pagina.map(a => {
    const tipoLabel = a.tipo === 'professor' ? 'Professor' : 'Estagiário';

    // Avaliação de estagiário por comentário (sem estrelas)
    if (a.tipo === 'estagiario' && a.tipoAvaliacao === 'comentario') {
      return `
        <div class="av-item av-item-comentario-only">
          <div class="av-item-header">
            <span class="av-item-nome">${a.avaliado}</span>
            <div class="av-item-meta">
              <span class="av-item-tipo ${a.tipo}">${tipoLabel}</span>
              <span class="av-item-data">${a.data}</span>
            </div>
          </div>
          <p class="av-item-comentario">"${a.comentario}"</p>
        </div>`;
    }

    // Avaliação com estrelas: gera badges por critério
    const criteriosBadges = CRITERIOS
      .filter(c => a.criterios && a.criterios[c.key] > 0)
      .map(c => `<span class="av-criterio-badge">${c.label}<span class="mini-stars">${'★'.repeat(a.criterios[c.key])}</span></span>`).join('');

    return `
      <div class="av-item">
        <div class="av-item-header">
          <span class="av-item-nome">${a.avaliado}</span>
          <div class="av-item-meta">
            <span class="av-item-tipo ${a.tipo}">${tipoLabel}</span>
            <span class="av-item-data">${a.data}</span>
          </div>
        </div>
        <div class="av-item-criterios">${criteriosBadges}</div>
        <div class="av-item-media">Média: ${a.media} ★</div>
        ${a.comentario ? `<p class="av-item-comentario">"${a.comentario}"</p>` : ''}
      </div>`;
  }).join('');

  renderPaginacao('paginacao-full', paginaAtualFull, totalPaginas, 'full');
}

// ====================================================================
// PERMISSÕES — Controle de acesso por tipo de usuário
// ====================================================================

/**
 * Retorna o objeto do usuário logado buscando pelo ID salvo na sessão,
 * ou null se não houver sessão ativa.
 * @returns {object|null}
 */
function getUsuarioLogado() {
  const sessao = JSON.parse(localStorage.getItem('perfilLogado') || 'null');
  if (!sessao) return null;
  return getContatos().find(c => c.id === sessao.id) || null;
}

/**
 * Verifica se o usuário tem permissão de gestor (pode avaliar estagiários).
 * Sem login, professor, gestor e admin têm acesso total.
 * @returns {boolean}
 */
function isGestor() {
  const user = getUsuarioLogado();
  return !user || user.tipo === 'professor' || user.tipo === 'gestor' || user.tipo === 'admin';
}

/**
 * Verifica se o usuário é administrador.
 * @returns {boolean}
 */
function isAdmin() {
  const user = getUsuarioLogado();
  return !user || user.tipo === 'admin';
}

/**
 * Aplica restrições visuais na interface com base no tipo do usuário logado.
 * Estagiários não veem o botão de avaliar professor nem o filtro correspondente.
 */
function aplicarPermissoes() {
  const btnEstagiario = document.querySelector('.av-type-btn[data-type="estagiario"]');
  if (btnEstagiario) {
    if (!isGestor()) {
      // Oculta opção de avaliar estagiário para quem não é gestor
      btnEstagiario.style.display = 'none';
      setTipo('professor');
      const filtroProfessor = document.querySelector('.av-filtro[data-filtro="professor"]');
      if (filtroProfessor) filtroProfessor.style.display = 'none';
      const filtroTodos = document.querySelector('.av-filtro[data-filtro="todos"]');
      if (filtroTodos) filtroTodos.style.display = 'none';
      filtroAtual = 'estagiario';
      document.querySelectorAll('.av-filtro').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filtro === 'estagiario');
      });
    } else {
      btnEstagiario.style.display = '';
    }
  }

  // Oculta o card de estagiário na tela de seleção para não-gestores
  const cardEstagiario = document.getElementById('card-estagiario');
  if (cardEstagiario && !isGestor()) {
    cardEstagiario.style.display = 'none';
  }
}

// ====================================================================
// TIPO — Alternância entre formulário de professor e estagiário
// ====================================================================

/**
 * Alterna o formulário entre o modo professor (estrelas) e estagiário (comentário).
 * Atualiza labels, visibilidade de seções e o select de avaliados.
 * @param {string} tipo - 'professor' ou 'estagiario'
 */
function setTipo(tipo) {
  tipoAtual = tipo;

  document.querySelectorAll('.av-type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === tipo);
  });

  const label = document.getElementById('avaliado-label');
  if (label) label.textContent = tipo === 'professor' ? 'Professor' : 'Estagiário';

  const criteriosProfessor = document.getElementById('criterios-professor');
  const criteriosEstagiario = document.getElementById('criterios-estagiario');
  const mediaBox = document.getElementById('media-box');
  const comentarioLabel = document.getElementById('comentario-label');
  const comentarioField = document.getElementById('comentario');
  const btnText = document.getElementById('btn-text');

  if (tipo === 'estagiario') {
    // Modo estagiário: oculta estrelas, exibe campo de comentário obrigatório
    if (criteriosProfessor) criteriosProfessor.style.display = 'none';
    if (criteriosEstagiario) criteriosEstagiario.style.display = 'block';
    if (mediaBox) mediaBox.style.display = 'none';
    if (comentarioLabel) comentarioLabel.innerHTML = 'Comentário sobre o estagiário <span class="av-obrigatorio">(obrigatório)</span>';
    if (comentarioField) {
      comentarioField.placeholder = 'Descreva o desempenho do estagiário nos aspectos acima. Seja específico e construtivo...';
      comentarioField.rows = 6;
    }
    if (btnText) btnText.textContent = 'Enviar Comentário';
  } else {
    // Modo professor: exibe estrelas e campo de comentário opcional
    if (criteriosProfessor) criteriosProfessor.style.display = 'block';
    if (criteriosEstagiario) criteriosEstagiario.style.display = 'none';
    if (mediaBox) mediaBox.style.display = 'flex';
    if (comentarioLabel) comentarioLabel.innerHTML = 'Comentário <span class="av-opcional">(opcional)</span>';
    if (comentarioField) {
      comentarioField.placeholder = 'Descreva sua avaliação...';
      comentarioField.rows = 3;
    }
    if (btnText) btnText.textContent = 'Enviar Avaliação';
  }

  popularSelect();
}

// ====================================================================
// SELECT — Popula o dropdown de avaliados
// ====================================================================

/**
 * Preenche o select de avaliados com os contatos do tipo atual
 * (professor ou estagiário).
 */
function popularSelect() {
  const select = document.getElementById('avaliado');
  if (!select) return;

  const contatos = getContatos();
  const filtrados = tipoAtual ? contatos.filter(c => c.tipo === tipoAtual) : contatos;

  if (filtrados.length === 0) {
    select.innerHTML = `<option value="">Nenhum ${tipoAtual === 'professor' ? 'professor' : 'estagiário'} cadastrado</option>`;
    return;
  }

  select.innerHTML = '<option value="">Selecione...</option>' +
    filtrados.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
}

// ====================================================================
// ESTRELAS — Interação e renderização
// ====================================================================

/**
 * Inicializa todos os grupos de estrelas do formulário.
 * Clona os elementos para evitar listeners duplicados ao reinicializar.
 */
function initAllStars() {
  document.querySelectorAll('.stars').forEach(group => {
    const criterio = group.dataset.criterio;

    // Clona o grupo para remover listeners antigos
    const newGroup = group.cloneNode(true);
    group.parentNode.replaceChild(newGroup, group);
    const freshSpans = Array.from(newGroup.querySelectorAll('span'));

    freshSpans.forEach((star, i) => {
      star.addEventListener('click', () => {
        // Clique na mesma nota já selecionada limpa a seleção (toggle)
        if (notas[criterio] === i + 1) {
          notas[criterio] = 0;
        } else {
          notas[criterio] = i + 1;
        }
        renderStars(freshSpans, notas[criterio]);
        atualizarMedia();
      });
    });

    renderStars(freshSpans, notas[criterio] || 0);
  });
}

/**
 * Atualiza o estado visual das estrelas de um grupo.
 * @param {HTMLElement[]} spans - Array de elementos de estrela
 * @param {number} valor - Quantidade de estrelas ativas (0–5)
 */
function renderStars(spans, valor) {
  spans.forEach((s, i) => {
    s.classList.toggle('active', i < valor);
  });
}

/**
 * Destaca estrelas até o índice informado (usado em hover).
 * @param {HTMLElement[]} spans - Array de elementos de estrela
 * @param {number} upTo - Índice até onde destacar
 */
function highlightGroup(spans, upTo) {
  spans.forEach((s, i) => s.classList.toggle('active', i <= upTo));
}

// ====================================================================
// MÉDIA — Cálculo e exibição
// ====================================================================

/**
 * Recalcula e exibe a média geral das notas preenchidas.
 * Exibe "—" se nenhum critério foi avaliado.
 */
function atualizarMedia() {
  const valores = CRITERIOS.map(c => notas[c.key]).filter(v => v > 0);
  const mediaEl = document.getElementById('media-geral');
  if (!mediaEl) return;

  if (valores.length === 0) { mediaEl.textContent = '—'; return; }

  const media = valores.reduce((a, b) => a + b, 0) / valores.length;
  mediaEl.textContent = media.toFixed(1) + ' ★';
}

// ====================================================================
// SALVAR — Estagiário (somente comentário)
// ====================================================================

/**
 * Valida e salva uma avaliação de estagiário baseada em comentário textual.
 * Exige comentário com no mínimo 20 caracteres.
 */
function salvarEstagiario() {
  const select = document.getElementById('avaliado');
  const comentario = document.getElementById('comentario');
  if (!select || !comentario) return;

  if (!select.value) {
    showToast('Selecione o estagiário a ser avaliado.', 'error');
    return;
  }

  const texto = comentario.value.trim();
  if (!texto) {
    showToast('O comentário é obrigatório para avaliação de estagiários.', 'error');
    return;
  }
  if (texto.length < 20) {
    showToast('Escreva um comentário mais detalhado (mínimo 20 caracteres).', 'error');
    return;
  }

  const contatos = getContatos();
  const avaliado = contatos.find(c => c.id == select.value);

  const avaliacoes = getAvaliacoes();
  avaliacoes.push({
    id: Date.now(),
    tipo: 'estagiario',
    avaliado: avaliado ? avaliado.nome : 'Desconhecido',
    criterios: {},
    media: null,
    comentario: texto,
    data: new Date().toLocaleDateString('pt-BR'),
    tipoAvaliacao: 'comentario', // Distingue do tipo com estrelas
  });
  saveAvaliacoes(avaliacoes);

  // Limpa o formulário após salvar
  comentario.value = '';
  select.value = '';
  showToast('Comentário enviado com sucesso!');
  renderHistorico();
}

// ====================================================================
// SALVAR — Professor (com estrelas)
// ====================================================================

/**
 * Valida e salva uma avaliação de professor com notas por critério.
 * Exige pelo menos um critério avaliado.
 * @param {string} tipo - Tipo do avaliado ('professor' ou outro)
 */
function _salvar(tipo) {
  const select = document.getElementById('avaliado');
  const comentario = document.getElementById('comentario');
  if (!select || !comentario) return;

  if (!select.value) {
    showToast('Selecione quem será avaliado.', 'error');
    return;
  }

  const algumaNota = CRITERIOS.some(c => notas[c.key] > 0);
  if (!algumaNota) {
    showToast('Avalie pelo menos um critério.', 'error');
    return;
  }

  const contatos = getContatos();
  const avaliado = contatos.find(c => c.id == select.value);

  // Copia as notas atuais para o registro (snapshot)
  const criteriosSnapshot = {};
  CRITERIOS.forEach(c => criteriosSnapshot[c.key] = notas[c.key]);

  // Calcula a média apenas dos critérios preenchidos
  const notasPreenchidas = CRITERIOS.map(c => notas[c.key]).filter(v => v > 0);
  const media = notasPreenchidas.reduce((a, b) => a + b, 0) / notasPreenchidas.length;

  const avaliacoes = getAvaliacoes();
  avaliacoes.push({
    id: Date.now(),
    tipo,
    avaliado: avaliado ? avaliado.nome : 'Desconhecido',
    criterios: criteriosSnapshot,
    media: parseFloat(media.toFixed(1)),
    comentario: comentario.value.trim(),
    data: new Date().toLocaleDateString('pt-BR'),
  });
  saveAvaliacoes(avaliacoes);

  // Reseta todas as estrelas e campos do formulário
  CRITERIOS.forEach(c => {
    notas[c.key] = 0;
    const group = document.querySelector(`.stars[data-criterio="${c.key}"]`);
    if (group) renderStars(Array.from(group.querySelectorAll('span')), 0);
  });
  comentario.value = '';
  select.value = '';
  const mediaEl = document.getElementById('media-geral');
  if (mediaEl) mediaEl.textContent = '—';

  showToast('Avaliação enviada com sucesso!');
  renderHistorico();
}

// ====================================================================
// SALVAR — Unificado (decide qual fluxo usar)
// ====================================================================

/**
 * Ponto de entrada unificado para salvar avaliação.
 * Delega para salvarEstagiario() ou _salvar() conforme o tipo atual.
 */
function salvarAvaliacaoUnificada() {
  if (tipoAtual === 'estagiario') {
    salvarEstagiario();
  } else {
    _salvar(tipoAtual);
  }
}

// Aliases para compatibilidade com chamadas diretas do HTML
function salvarAvaliacao() { salvarAvaliacaoUnificada(); }

/**
 * Salva diretamente para um tipo específico (sem passar pela seleção).
 * @param {string} tipo - 'professor' ou 'estagiario'
 */
function salvarDireto(tipo) {
  tipoAtual = tipo;
  _salvar(tipo);
}

// ====================================================================
// FILTRO — Histórico lateral
// ====================================================================

/**
 * Aplica filtro por tipo no histórico lateral e reseta para a primeira página.
 * @param {string} tipo - 'todos', 'professor' ou 'estagiario'
 */
function filtrar(tipo) {
  filtroAtual = tipo;
  paginaAtual = 1;
  document.querySelectorAll('.av-filtro').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filtro === tipo);
  });
  renderHistorico();
}

// ====================================================================
// HISTÓRICO — Renderização lateral (dentro do formulário)
// ====================================================================

/**
 * Renderiza o histórico de avaliações no painel lateral do formulário,
 * aplicando filtro de permissão e paginação.
 */
function renderHistorico() {
  const container = document.getElementById('historico-lista');
  if (!container) return;

  let avaliacoes = getAvaliacoes();

  // Estagiário logado não vê avaliações de professores
  if (!isGestor()) {
    avaliacoes = avaliacoes.filter(a => a.tipo !== 'professor');
  }

  if (filtroAtual !== 'todos') {
    avaliacoes = avaliacoes.filter(a => a.tipo === filtroAtual);
  }
  avaliacoes = avaliacoes.slice().reverse();

  if (avaliacoes.length === 0) {
    container.innerHTML = '<p class="av-empty">Nenhuma avaliação encontrada.</p>';
    renderPaginacao('paginacao-historico', 0, 0, 'historico');
    return;
  }

  const totalPaginas = Math.ceil(avaliacoes.length / ITENS_POR_PAGINA);
  if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;
  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const pagina = avaliacoes.slice(inicio, inicio + ITENS_POR_PAGINA);

  container.innerHTML = pagina.map(a => {
    const tipoLabel = a.tipo === 'professor' ? 'Professor' : 'Estagiário';

    // Avaliação de estagiário por comentário
    if (a.tipo === 'estagiario' && a.tipoAvaliacao === 'comentario') {
      return `
        <div class="av-item av-item-comentario-only">
          <div class="av-item-header">
            <span class="av-item-nome">${a.avaliado}</span>
            <div class="av-item-meta">
              <span class="av-item-tipo ${a.tipo}">${tipoLabel}</span>
              <span class="av-item-data">${a.data}</span>
            </div>
          </div>
          <div class="av-item-tipo-avaliacao">
            <i class="fa-regular fa-comment"></i> Avaliação por Comentário
          </div>
          <p class="av-item-comentario">"${a.comentario}"</p>
        </div>`;
    }

    // Avaliação com estrelas: gera badges por critério
    const criteriosBadges = CRITERIOS
      .filter(c => a.criterios && a.criterios[c.key] > 0)
      .map(c => `
        <span class="av-criterio-badge">
          ${c.label}
          <span class="mini-stars">${'★'.repeat(a.criterios[c.key])}</span>
        </span>`).join('');

    return `
      <div class="av-item">
        <div class="av-item-header">
          <span class="av-item-nome">${a.avaliado}</span>
          <div class="av-item-meta">
            <span class="av-item-tipo ${a.tipo}">${tipoLabel}</span>
            <span class="av-item-data">${a.data}</span>
          </div>
        </div>
        <div class="av-item-criterios">${criteriosBadges}</div>
        <div class="av-item-media">Média: ${a.media} ★</div>
        ${a.comentario ? `<p class="av-item-comentario">"${a.comentario}"</p>` : ''}
      </div>`;
  }).join('');

  renderPaginacao('paginacao-historico', paginaAtual, totalPaginas, 'historico');
}

// ====================================================================
// PAGINAÇÃO
// ====================================================================

/**
 * Renderiza os controles de paginação abaixo de uma lista de histórico.
 * Cria o container dinamicamente se ele não existir no DOM.
 * @param {string} containerId - ID do elemento de paginação
 * @param {number} paginaAtualLocal - Página atualmente exibida
 * @param {number} totalPaginas - Total de páginas disponíveis
 * @param {string} tipo - 'full' ou 'historico' (define qual função de navegação usar)
 */
function renderPaginacao(containerId, paginaAtualLocal, totalPaginas, tipo) {
  let pag = document.getElementById(containerId);

  // Cria o container de paginação se ainda não existir no DOM
  if (!pag) {
    pag = document.createElement('div');
    pag.id = containerId;
    pag.className = 'av-paginacao';
    const listaId = tipo === 'full' ? 'historico-lista-full' : 'historico-lista';
    const lista = document.getElementById(listaId);
    if (lista && lista.parentNode) {
      lista.parentNode.insertBefore(pag, lista.nextSibling);
    }
  }
  if (!pag) return;

  if (totalPaginas <= 1) {
    pag.innerHTML = '';
    pag.style.display = 'none';
    return;
  }

  // Usa função de navegação diferente para o histórico completo vs. lateral
  const fnAnterior = tipo === 'full' ? 'irPaginaFull' : 'irPagina';
  pag.style.display = 'flex';
  pag.innerHTML = `
    <button class="av-pag-btn" ${paginaAtualLocal <= 1 ? 'disabled' : ''}
            onclick="${fnAnterior}(${paginaAtualLocal - 1})">
      <i class="fa-solid fa-chevron-left"></i> Anterior
    </button>
    <span class="av-pag-info">Página ${paginaAtualLocal} de ${totalPaginas}</span>
    <button class="av-pag-btn" ${paginaAtualLocal >= totalPaginas ? 'disabled' : ''}
            onclick="${fnAnterior}(${paginaAtualLocal + 1})">
      Próximo <i class="fa-solid fa-chevron-right"></i>
    </button>
  `;
}

/** Navega para uma página específica no histórico lateral. */
function irPagina(p) {
  paginaAtual = p;
  renderHistorico();
}

/** Navega para uma página específica no histórico completo. */
function irPaginaFull(p) {
  paginaAtualFull = p;
  renderHistoricoFull();
}

// ====================================================================
// INICIALIZAÇÃO
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Aplica restrições visuais conforme o tipo do usuário logado
  aplicarPermissoes();

  // Compatibilidade com páginas que não usam a tela de seleção (step-tipo)
  if (!document.getElementById('step-tipo')) {
    if (!document.querySelector('.av-type-btn')) {
      popularSelect();
      initAllStars();
    } else {
      setTipo('professor');
      initAllStars();
    }
    renderHistorico();
  }
});
