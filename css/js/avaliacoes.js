// =============================================
// AVALIAÇÕES — LÓGICA COMPLETA
// =============================================

const CRITERIOS = [
  { key: 'pontualidade',  label: 'Pontualidade' },
  { key: 'comunicacao',   label: 'Comunicação' },
  { key: 'tecnico',       label: 'Desempenho Técnico' },
  { key: 'proatividade',  label: 'Proatividade' },
  { key: 'equipe',        label: 'Trabalho em Equipe' },
];

const notas = {};
CRITERIOS.forEach(c => notas[c.key] = 0);

let tipoAtual = 'professor';
let filtroAtual = 'todos';
let tipoSelecionado = null; // para a tela de seleção
let paginaAtual = 1;
let paginaAtualFull = 1;
const ITENS_POR_PAGINA = 5;

// =============================================
// ETAPA 1 — SELEÇÃO DO TIPO
// =============================================
function selecionarTipo(tipo) {
  tipoSelecionado = tipo;

  document.querySelectorAll('.av-tipo-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.tipo === tipo);
  });

  const btnProximo = document.getElementById('btn-proximo');
  if (btnProximo) btnProximo.disabled = false;
}

function irParaFormulario() {
  if (!tipoSelecionado) return;

  if (tipoSelecionado === 'historico') {
    document.getElementById('step-tipo').style.display = 'none';
    document.getElementById('step-historico').style.display = 'flex';
    document.getElementById('av-header-title').textContent = 'Histórico de Avaliações';
    renderHistoricoFull();
    return;
  }

  document.getElementById('step-tipo').style.display = 'none';
  document.getElementById('step-form').style.display = 'block';
  document.getElementById('av-header-title').textContent =
    tipoSelecionado === 'professor' ? 'Avaliar Professor' : 'Avaliar Estagiário';

  tipoAtual = tipoSelecionado;
  setTipo(tipoSelecionado);
  initAllStars();
  renderHistorico();
}

function voltarParaTipo() {
  document.getElementById('step-form').style.display = 'none';
  document.getElementById('step-historico').style.display = 'none';
  document.getElementById('step-tipo').style.display = 'flex';
  document.getElementById('av-header-title').textContent = 'Avaliações';
  tipoSelecionado = null;

  // Reset seleção visual
  document.querySelectorAll('.av-tipo-card').forEach(c => c.classList.remove('selected'));
  const btnProximo = document.getElementById('btn-proximo');
  if (btnProximo) btnProximo.disabled = true;
}

function renderHistoricoFull() {
  const container = document.getElementById('historico-lista-full');
  if (!container) return;

  let avaliacoes = getAvaliacoes();
  if (!isGestor()) {
    avaliacoes = avaliacoes.filter(a => a.tipo !== 'professor');
  }
  avaliacoes = avaliacoes.slice().reverse();

  if (avaliacoes.length === 0) {
    container.innerHTML = '<p class="av-empty">Nenhuma avaliação registrada.</p>';
    renderPaginacao('paginacao-full', 0, 0, 'full');
    return;
  }

  const totalPaginas = Math.ceil(avaliacoes.length / ITENS_POR_PAGINA);
  if (paginaAtualFull > totalPaginas) paginaAtualFull = totalPaginas;
  const inicio = (paginaAtualFull - 1) * ITENS_POR_PAGINA;
  const pagina = avaliacoes.slice(inicio, inicio + ITENS_POR_PAGINA);

  container.innerHTML = pagina.map(a => {
    const tipoLabel = a.tipo === 'professor' ? 'Professor' : 'Estagiário';

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

// =============================================
// PERMISSÕES — só gestor/professor avalia estagiário
// =============================================
function getUsuarioLogado() {
  const sessao = JSON.parse(localStorage.getItem('perfilLogado') || 'null');
  if (!sessao) return null;
  return getContatos().find(c => c.id === sessao.id) || null;
}

function isGestor() {
  const user = getUsuarioLogado();
  // Sem login = acesso total; professor ou gestor = pode avaliar estagiário
  return !user || user.tipo === 'professor' || user.tipo === 'gestor';
}

function aplicarPermissoes() {
  // Ocultar botão de avaliar estagiário no toggle (formulário antigo)
  const btnEstagiario = document.querySelector('.av-type-btn[data-type="estagiario"]');
  if (btnEstagiario) {
    if (!isGestor()) {
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

  // Ocultar card de estagiário na tela de seleção
  const cardEstagiario = document.getElementById('card-estagiario');
  if (cardEstagiario && !isGestor()) {
    cardEstagiario.style.display = 'none';
  }
}

// =============================================
// TIPO (professor / estagiário)
// =============================================
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

// =============================================
// POPULAR SELECT
// =============================================
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

// =============================================
// STARS
// =============================================
function initAllStars() {
  document.querySelectorAll('.stars').forEach(group => {
    const criterio = group.dataset.criterio;
    const spans = group.querySelectorAll('span');

    spans.forEach((star, i) => {
      star.addEventListener('mouseover', () => highlightGroup(spans, i));
      star.addEventListener('mouseout', () => highlightGroup(spans, notas[criterio] - 1));
      star.addEventListener('click', () => {
        notas[criterio] = i + 1;
        highlightGroup(spans, i);
        atualizarMedia();
      });
    });
  });
}

function highlightGroup(spans, upTo) {
  spans.forEach((s, i) => s.classList.toggle('active', i <= upTo));
}

// =============================================
// MÉDIA GERAL
// =============================================
function atualizarMedia() {
  const valores = CRITERIOS.map(c => notas[c.key]).filter(v => v > 0);
  const mediaEl = document.getElementById('media-geral');
  if (!mediaEl) return;

  if (valores.length === 0) { mediaEl.textContent = '—'; return; }

  const media = valores.reduce((a, b) => a + b, 0) / valores.length;
  mediaEl.textContent = media.toFixed(1) + ' ★';
}

// =============================================
// SALVAR ESTAGIÁRIO — só comentário
// =============================================
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
    tipoAvaliacao: 'comentario',
  });
  saveAvaliacoes(avaliacoes);

  comentario.value = '';
  select.value = '';
  showToast('Comentário enviado com sucesso!');
  renderHistorico();
}

// =============================================
// SALVAR PROFESSOR — com estrelas
// =============================================
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

  const criteriosSnapshot = {};
  CRITERIOS.forEach(c => criteriosSnapshot[c.key] = notas[c.key]);

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

  CRITERIOS.forEach(c => {
    notas[c.key] = 0;
    const group = document.querySelector(`.stars[data-criterio="${c.key}"]`);
    if (group) highlightGroup(group.querySelectorAll('span'), -1);
  });
  comentario.value = '';
  select.value = '';
  const mediaEl = document.getElementById('media-geral');
  if (mediaEl) mediaEl.textContent = '—';

  showToast('Avaliação enviada com sucesso!');
  renderHistorico();
}

// =============================================
// SALVAR UNIFICADO
// =============================================
function salvarAvaliacaoUnificada() {
  if (tipoAtual === 'estagiario') {
    salvarEstagiario();
  } else {
    _salvar(tipoAtual);
  }
}

function salvarAvaliacao() { salvarAvaliacaoUnificada(); }

function salvarDireto(tipo) {
  tipoAtual = tipo;
  _salvar(tipo);
}

// =============================================
// FILTRO
// =============================================
function filtrar(tipo) {
  filtroAtual = tipo;
  paginaAtual = 1; // reset ao filtrar
  document.querySelectorAll('.av-filtro').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filtro === tipo);
  });
  renderHistorico();
}

// =============================================
// RENDERIZAR HISTÓRICO
// =============================================
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

// =============================================
// PAGINAÇÃO
// =============================================
function renderPaginacao(containerId, paginaAtualLocal, totalPaginas, tipo) {
  // Garante que o container existe; se não, cria após o historico-lista correspondente
  let pag = document.getElementById(containerId);
  if (!pag) {
    pag = document.createElement('div');
    pag.id = containerId;
    pag.className = 'av-paginacao';
    // Tenta inserir após o container de lista correspondente
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

function irPagina(p) {
  paginaAtual = p;
  renderHistorico();
}

function irPaginaFull(p) {
  paginaAtualFull = p;
  renderHistoricoFull();
}

// =============================================
// INIT
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  // Aplicar permissões na tela de seleção
  aplicarPermissoes();

  // Se não tem tela de seleção (páginas antigas), inicializa direto
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
