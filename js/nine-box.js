// ====================================================================
// nine-box.js — Nine Box Grid
// Gerencia o posicionamento de professores e estagiários na matriz
// Nine Box (Performance × Potencial), com grid visual interativo,
// filtros por tipo, modal de detalhes e edição/remoção de registros.
// ====================================================================

let nbTipo = 'professor';  // Tipo selecionado no formulário: 'professor' ou 'estagiario'
let nbFiltro = 'todos';    // Filtro aplicado no grid visual
let nbPerf = null;         // Nível de performance selecionado (1, 2 ou 3)
let nbPot = null;          // Nível de potencial selecionado (1, 2 ou 3)

// Mapeamento das 9 células da matriz com seus nomes
const NB_CATEGORIAS = {
  '1-1': { nome: 'Baixo Desempenho',    icon: '' },
  '2-1': { nome: 'Eficaz',              icon: '' },
  '3-1': { nome: 'Especialista',        icon: '' },
  '1-2': { nome: 'Em Desenvolvimento',  icon: '' },
  '2-2': { nome: 'Sólido',              icon: '' },
  '3-2': { nome: 'Alto Desempenho',     icon: '' },
  '1-3': { nome: 'Alto Potencial',      icon: '' },
  '2-3': { nome: 'Talento Emergente',   icon: '' },
  '3-3': { nome: 'Talento Excepcional', icon: '' },
};

// Rótulos de exibição para os níveis de performance e potencial
const PERF_LABELS = { 1: 'Baixo', 2: 'Médio', 3: 'Alto' };
const POT_LABELS  = { 1: 'Baixo', 2: 'Médio', 3: 'Alto' };

// ====================================================================
// STORAGE — Persistência no localStorage
// ====================================================================

/** Retorna todos os registros do Nine Box. */
function getNBData() {
  return JSON.parse(localStorage.getItem('nineBoxAvaliacoes') || '[]');
}

/** Persiste os registros do Nine Box no localStorage. */
function saveNBData(data) {
  localStorage.setItem('nineBoxAvaliacoes', JSON.stringify(data));
}

// ====================================================================
// TIPO — Alternância entre professor e estagiário
// ====================================================================

/**
 * Define o tipo de pessoa a ser avaliada e atualiza o select de pessoas.
 * @param {string} tipo - 'professor' ou 'estagiario'
 */
function setTipoNB(tipo) {
  nbTipo = tipo;

  document.querySelectorAll('.nb-toggle-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === tipo);
  });

  // Atualiza o label do select conforme o tipo
  const label = document.getElementById('nb-pessoa-label');
  if (label) label.textContent = tipo === 'professor' ? 'Professor' : 'Estagiário';

  popularSelectNB();
}

// ====================================================================
// SELECT — Popula o dropdown de pessoas
// ====================================================================

/**
 * Preenche o select de pessoas com os contatos do tipo atual (professor ou estagiário).
 */
function popularSelectNB() {
  const select = document.getElementById('nb-pessoa');
  if (!select) return;

  const contatos = getContatos().filter(c => c.tipo === nbTipo);

  if (contatos.length === 0) {
    select.innerHTML = `<option value="">Nenhum ${nbTipo === 'professor' ? 'professor' : 'estagiário'} cadastrado</option>`;
    return;
  }

  select.innerHTML = '<option value="">Selecione...</option>' +
    contatos.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
}

// ====================================================================
// EIXOS — Seleção de performance e potencial
// ====================================================================

/**
 * Registra a seleção de um nível em um dos eixos (performance ou potencial).
 * Atualiza os botões visualmente, o preview da categoria e destaca a célula no grid.
 * @param {string} axis - 'perf' para performance, 'pot' para potencial
 * @param {number} val - Nível selecionado (1, 2 ou 3)
 */
function selectAxis(axis, val) {
  if (axis === 'perf') {
    nbPerf = val;
    document.querySelectorAll('#perf-btns .nb-axis-btn').forEach(btn => {
      btn.classList.toggle('selected', parseInt(btn.dataset.val) === val);
    });
  } else {
    nbPot = val;
    document.querySelectorAll('#pot-btns .nb-axis-btn').forEach(btn => {
      btn.classList.toggle('selected', parseInt(btn.dataset.val) === val);
    });
  }

  atualizarPreview();
  destacarBox();
}

// ====================================================================
// PREVIEW — Exibe o nome da categoria resultante
// ====================================================================

/**
 * Atualiza o painel de preview com o nome da categoria correspondente
 * à combinação atual de performance e potencial.
 * Oculta o preview se algum eixo ainda não foi selecionado.
 */
function atualizarPreview() {
  const preview = document.getElementById('nb-preview');
  const catEl = document.getElementById('nb-preview-cat');
  if (!preview || !catEl) return;

  if (nbPerf && nbPot) {
    const cat = NB_CATEGORIAS[`${nbPerf}-${nbPot}`];
    catEl.textContent = cat.nome;
    preview.style.display = 'flex';
  } else {
    preview.style.display = 'none';
  }
}

// ====================================================================
// GRID — Destaque visual da célula selecionada
// ====================================================================

/**
 * Remove o destaque de todas as células e aplica na célula correspondente
 * à combinação atual de performance e potencial.
 * Rola suavemente até a célula destacada.
 */
function destacarBox() {
  document.querySelectorAll('.nb-box').forEach(b => b.classList.remove('highlight'));

  if (nbPerf && nbPot) {
    const box = document.getElementById(`nb-box-${nbPerf}-${nbPot}`);
    if (box) {
      box.classList.add('highlight');
      box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
}

// ====================================================================
// CLIQUE NA CÉLULA DO GRID
// ====================================================================

/**
 * Ao clicar em uma célula do grid, seleciona automaticamente os eixos
 * correspondentes se já houver uma pessoa selecionada no formulário.
 * @param {number} perf - Nível de performance da célula clicada
 * @param {number} pot - Nível de potencial da célula clicada
 */
function clickBox(perf, pot) {
  // Só age se já houver uma pessoa selecionada no formulário
  const select = document.getElementById('nb-pessoa');
  if (select && select.value) {
    nbPerf = perf;
    nbPot = pot;

    // Sincroniza os botões de eixo com a célula clicada
    document.querySelectorAll('#perf-btns .nb-axis-btn').forEach(btn => {
      btn.classList.toggle('selected', parseInt(btn.dataset.val) === perf);
    });
    document.querySelectorAll('#pot-btns .nb-axis-btn').forEach(btn => {
      btn.classList.toggle('selected', parseInt(btn.dataset.val) === pot);
    });

    atualizarPreview();
    destacarBox();
    showToast(`Posição selecionada: ${NB_CATEGORIAS[`${perf}-${pot}`].nome}. Clique em Salvar.`, 'info');
  }
}

// ====================================================================
// SALVAR — Criação ou atualização de posicionamento
// ====================================================================

/**
 * Valida os campos e salva (cria ou atualiza) o posicionamento de uma pessoa no Nine Box.
 * Se a pessoa já tiver um registro, ele é substituído.
 * Reseta o formulário após salvar e atualiza o grid.
 */
function salvarNB() {
  const select = document.getElementById('nb-pessoa');
  const comentario = document.getElementById('nb-comentario');

  if (!select?.value) {
    showToast('Selecione uma pessoa para avaliar.', 'error');
    return;
  }
  if (!nbPerf) {
    showToast('Selecione o nível de Performance.', 'error');
    return;
  }
  if (!nbPot) {
    showToast('Selecione o nível de Potential.', 'error');
    return;
  }

  const contatos = getContatos();
  const pessoa = contatos.find(c => c.id == select.value);
  const cat = NB_CATEGORIAS[`${nbPerf}-${nbPot}`];

  const data = getNBData();
  // Verifica se já existe um registro para esta pessoa (para atualizar em vez de duplicar)
  const existeIdx = data.findIndex(a => a.pessoaId == select.value);

  const registro = {
    id: existeIdx >= 0 ? data[existeIdx].id : Date.now(),
    pessoaId: select.value,
    tipo: nbTipo,
    pessoa: pessoa ? pessoa.nome : 'Desconhecido',
    performance: nbPerf,
    potential: nbPot,
    categoria: cat.nome,
    comentario: comentario?.value.trim() || '',
    data: new Date().toLocaleDateString('pt-BR'),
  };

  if (existeIdx >= 0) {
    data[existeIdx] = registro;
    showToast(`${pessoa?.nome} atualizado no Nine Box!`);
  } else {
    data.push(registro);
    showToast(`${pessoa?.nome} posicionado como ${cat.nome}!`);
  }

  saveNBData(data);

  // Feedback visual: desabilita o botão brevemente para evitar duplo clique
  const btnNB = document.querySelector('[onclick="salvarNB()"]');
  if (btnNB) { btnNB.disabled = true; setTimeout(() => btnNB.disabled = false, 800); }

  // Reseta o formulário após salvar
  select.value = '';
  if (comentario) comentario.value = '';
  nbPerf = null;
  nbPot = null;
  document.querySelectorAll('.nb-axis-btn').forEach(b => b.classList.remove('selected'));
  document.querySelectorAll('.nb-box').forEach(b => b.classList.remove('highlight'));
  document.getElementById('nb-preview').style.display = 'none';

  renderNBGrid();
}

// ====================================================================
// GRID — Renderização dos chips de pessoas
// ====================================================================

/**
 * Limpa e re-renderiza todos os chips de pessoas no grid Nine Box.
 * Aplica o filtro de tipo (professor/estagiário/todos) antes de renderizar.
 */
function renderNBGrid() {
  // Limpa o conteúdo de todas as células do grid
  for (let p = 1; p <= 3; p++) {
    for (let pt = 1; pt <= 3; pt++) {
      const el = document.getElementById(`nb-people-${p}-${pt}`);
      if (el) el.innerHTML = '';
    }
  }

  let data = getNBData();
  if (nbFiltro !== 'todos') {
    data = data.filter(a => a.tipo === nbFiltro);
  }

  // Cria um chip para cada pessoa e insere na célula correspondente
  data.forEach(av => {
    const container = document.getElementById(`nb-people-${av.performance}-${av.potential}`);
    if (!container) return;

    const chip = document.createElement('div');
    chip.className = `nb-chip ${av.tipo}`;
    chip.innerHTML = `
      <span class="nb-chip-dot"></span>
      <span class="nb-chip-name">${av.pessoa}</span>
    `;
    chip.title = `${av.pessoa} — ${av.categoria}`;
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      abrirModal(av);
    });

    container.appendChild(chip);
  });
}

// ====================================================================
// FILTRO — Por tipo de pessoa
// ====================================================================

/**
 * Aplica filtro por tipo no grid e atualiza os botões de filtro.
 * @param {string} filtro - 'todos', 'professor' ou 'estagiario'
 */
function filtrarNB(filtro) {
  nbFiltro = filtro;
  document.querySelectorAll('.nb-filtro').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filtro === filtro);
  });
  renderNBGrid();
}

// ====================================================================
// MODAL DE DETALHES
// ====================================================================

/**
 * Abre o modal de detalhes de um registro do Nine Box.
 * Exibe nome, categoria, tipo, níveis de performance/potencial, data e comentário.
 * @param {object} av - Objeto do registro do Nine Box
 */
function abrirModal(av) {
  const overlay = document.getElementById('nb-modal');
  const header  = document.getElementById('nb-modal-header');
  const body    = document.getElementById('nb-modal-body');
  const cat     = NB_CATEGORIAS[`${av.performance}-${av.potential}`];

  header.innerHTML = `
    <h4>${av.pessoa}</h4>
    <span class="nb-modal-cat">${cat.nome}</span>
  `;

  body.innerHTML = `
    <div class="nb-modal-row">
      <span>Tipo</span>
      <span>${av.tipo === 'professor' ? 'Professor' : 'Estagiário'}</span>
    </div>
    <div class="nb-modal-row">
      <span>Performance</span>
      <span>${PERF_LABELS[av.performance]}</span>
    </div>
    <div class="nb-modal-row">
      <span>Potential</span>
      <span>${POT_LABELS[av.potential]}</span>
    </div>
    <div class="nb-modal-row">
      <span>Data</span>
      <span>${av.data}</span>
    </div>
    ${av.comentario ? `<div class="nb-modal-comentario">"${av.comentario}"</div>` : ''}
    <div class="nb-modal-actions">
      <button class="nb-modal-btn edit" onclick="editarNB('${av.pessoaId}')">
        <i class="fa-solid fa-pen"></i> Editar
      </button>
      <button class="nb-modal-btn remove" onclick="removerNB('${av.pessoaId}')">
        <i class="fa-solid fa-trash"></i> Remover
      </button>
    </div>
  `;

  overlay.classList.add('open');
}

/**
 * Fecha o modal de detalhes ao clicar no overlay ou chamar diretamente.
 * @param {MouseEvent|null} e
 */
function fecharModal(e) {
  if (!e || e.target === document.getElementById('nb-modal') || e.type === 'click') {
    document.getElementById('nb-modal').classList.remove('open');
  }
}

// ====================================================================
// EDITAR / REMOVER
// ====================================================================

/**
 * Carrega os dados de um registro existente no formulário para edição.
 * Fecha o modal, muda o tipo, seleciona a pessoa e preenche os eixos.
 * @param {string|number} pessoaId - ID da pessoa a editar
 */
function editarNB(pessoaId) {
  fecharModal();
  const data = getNBData();
  const av = data.find(a => a.pessoaId == pessoaId);
  if (!av) return;

  // Muda o tipo e popula o select antes de selecionar a pessoa
  setTipoNB(av.tipo);

  setTimeout(() => {
    const select = document.getElementById('nb-pessoa');
    if (select) select.value = av.pessoaId;

    // Preenche os eixos com os valores do registro
    selectAxis('perf', av.performance);
    selectAxis('pot', av.potential);

    const comentario = document.getElementById('nb-comentario');
    if (comentario) comentario.value = av.comentario || '';

    showToast('Edite os valores e clique em Salvar.', 'info');
  }, 100);
}

/**
 * Remove o registro de uma pessoa do Nine Box e atualiza o grid.
 * @param {string|number} pessoaId - ID da pessoa a remover
 */
function removerNB(pessoaId) {
  fecharModal();
  let data = getNBData();
  const av = data.find(a => a.pessoaId == pessoaId);
  data = data.filter(a => a.pessoaId != pessoaId);
  saveNBData(data);
  renderNBGrid();
  showToast(`${av?.pessoa || 'Pessoa'} removido do Nine Box.`);
}

// ====================================================================
// CARREGAR AO SELECIONAR PESSOA
// ====================================================================

/**
 * Ao selecionar uma pessoa no formulário, carrega automaticamente
 * o registro existente (se houver) ou limpa os eixos para nova entrada.
 */
function onSelectPessoa() {
  const select = document.getElementById('nb-pessoa');
  if (!select?.value) return;

  const data = getNBData();
  const av = data.find(a => a.pessoaId == select.value);

  if (av) {
    // Pessoa já posicionada: carrega os valores existentes
    selectAxis('perf', av.performance);
    selectAxis('pot', av.potential);
    const comentario = document.getElementById('nb-comentario');
    if (comentario) comentario.value = av.comentario || '';
    showToast('Avaliação existente carregada.', 'info');
  } else {
    // Pessoa nova: limpa todas as seleções
    nbPerf = null;
    nbPot = null;
    document.querySelectorAll('.nb-axis-btn').forEach(b => b.classList.remove('selected'));
    document.querySelectorAll('.nb-box').forEach(b => b.classList.remove('highlight'));
    document.getElementById('nb-preview').style.display = 'none';
  }
}

// ====================================================================
// INICIALIZAÇÃO
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
  setTipoNB('professor');
  renderNBGrid();

  const select = document.getElementById('nb-pessoa');
  if (select) select.addEventListener('change', onSelectPessoa);

  // Fecha o modal ao pressionar ESC
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') fecharModal();
  });
});
