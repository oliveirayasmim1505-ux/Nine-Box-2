// ====================================================================
// avaliacao-180.js — Avaliação 180°
// Gerencia o ciclo completo de avaliações 180°: formulário de criação/edição,
// modal de seleção de avaliados (estagiários) com checkboxes, modal de edição
// de dados do avaliado e modal de vinculação de competências.
// ====================================================================

// ID da avaliação sendo editada (null = criação nova)
let r180EditandoId = null;
let r180Avaliados = [];    // Lista de avaliados vinculados à avaliação em edição
let r180Competencias = []; // Lista de competências vinculadas à avaliação em edição

// ====================================================================
// STORAGE — Persistência no localStorage
// ====================================================================

/** Retorna todas as avaliações 180° salvas. */
function getAvaliacoes180() {
  return JSON.parse(localStorage.getItem('avaliacoes180') || '[]');
}

/** Persiste a lista de avaliações 180° no localStorage. */
function saveAvaliacoes180(data) {
  localStorage.setItem('avaliacoes180', JSON.stringify(data));
}

// ====================================================================
// FORMULÁRIO — Criação e edição de avaliação 180°
// ====================================================================

/**
 * Abre o formulário de criação ou edição de avaliação 180°.
 * Se um ID for fornecido, preenche os campos com os dados existentes.
 * @param {number|null} id - ID da avaliação a editar, ou null para nova
 */
function abrirFormulario(id = null) {
  r180EditandoId = id;
  r180Avaliados = [];
  r180Competencias = [];

  // Alterna visibilidade entre lista e formulário
  document.getElementById('tela-lista').style.display = 'none';
  document.getElementById('tela-form').style.display = 'block';

  // Limpa todos os campos do formulário
  document.getElementById('r180-nome').value = '';
  document.getElementById('r180-tipo').value = '180';
  document.getElementById('r180-empresa').value = '';
  document.getElementById('r180-setor').value = '';
  document.getElementById('r180-descricao').value = '';
  document.getElementById('r180-inicio').value = '';
  document.getElementById('r180-fim').value = '';

  popularSelectGestor();

  if (id) {
    // Modo edição: carrega dados da avaliação existente
    const av = getAvaliacoes180().find(a => a.id === id);
    if (av) {
      document.getElementById('r180-nome').value = av.nome || '';
      document.getElementById('r180-tipo').value = av.tipo || '180';
      document.getElementById('r180-empresa').value = av.empresa || '';
      document.getElementById('r180-setor').value = av.setor || '';
      document.getElementById('r180-descricao').value = av.descricao || '';
      document.getElementById('r180-inicio').value = av.inicio || '';
      document.getElementById('r180-fim').value = av.fim || '';
      document.getElementById('r180-gestor').value = av.gestorId || '';
      r180Avaliados = av.avaliados || [];
      r180Competencias = av.competencias || [];
      document.getElementById('r180-btn-texto').textContent = 'Salvar Alterações';
    }
  } else {
    document.getElementById('r180-btn-texto').textContent = 'Criar Avaliação';
  }

  renderAvaliados();
  renderCompetenciasVinculadas();
}

/**
 * Fecha o formulário e retorna à lista de avaliações,
 * limpando erros de validação e o estado de edição.
 */
function fecharFormulario() {
  document.getElementById('tela-form').style.display = 'none';
  document.getElementById('tela-lista').style.display = 'block';
  clearAllErrors('tela-form');
  r180EditandoId = null;
  renderLista180();
}

/**
 * Preenche o select de gestor responsável com os professores cadastrados.
 */
function popularSelectGestor() {
  const select = document.getElementById('r180-gestor');
  if (!select) return;
  const professores = getContatos().filter(c => c.tipo === 'professor');
  select.innerHTML = '<option value="">Selecione o gestor...</option>' +
    professores.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
}

// ====================================================================
// SALVAR — Criação e atualização de avaliação 180°
// ====================================================================

/**
 * Valida os campos do formulário e salva (cria ou atualiza) a avaliação 180°.
 * Campos obrigatórios: nome e empresa. Data de fim deve ser posterior ao início.
 */
function salvarAvaliacao180() {
  const nome     = document.getElementById('r180-nome').value.trim();
  const tipo     = document.getElementById('r180-tipo').value;
  const empresa  = document.getElementById('r180-empresa').value.trim();
  const gestorId = document.getElementById('r180-gestor').value;
  const setor    = document.getElementById('r180-setor').value.trim();
  const inicio   = document.getElementById('r180-inicio').value;
  const fim      = document.getElementById('r180-fim').value;
  const descricao = document.getElementById('r180-descricao').value.trim();

  let valido = true;

  if (!nome) {
    setFieldError('r180-nome', 'O nome da avaliação é obrigatório.');
    valido = false;
  } else {
    clearFieldError('r180-nome');
  }

  if (!empresa) {
    setFieldError('r180-empresa', 'O nome da empresa é obrigatório.');
    valido = false;
  } else {
    clearFieldError('r180-empresa');
  }

  // Valida que a data de fim não é anterior à de início
  if (inicio && fim && fim < inicio) {
    setFieldError('r180-fim', 'A data de fim deve ser posterior à data de início.');
    valido = false;
  } else {
    clearFieldError('r180-fim');
  }

  if (!valido) {
    // Foca e anima o primeiro campo com erro
    const primeiro = document.querySelector('#tela-form .field-error');
    if (primeiro) { primeiro.classList.add('field-shake'); primeiro.focus(); setTimeout(() => primeiro.classList.remove('field-shake'), 400); }
    return;
  }

  const contatos = getContatos();
  const gestor = contatos.find(c => c.id == gestorId);

  const data = getAvaliacoes180();
  const tipoLabels = { '180': '180° (Gestor × Colaborador)', '90': '90° (Autoavaliação)', 'equipe': 'Equipe (para gestores)' };

  const registro = {
    id: r180EditandoId || Date.now(),
    nome, tipo,
    tipoLabel: tipoLabels[tipo] || tipo,
    empresa, gestorId,
    gestor: gestor ? gestor.nome : '',
    setor, inicio, fim, descricao,
    avaliados: r180Avaliados,
    competencias: r180Competencias,
    dataCriacao: new Date().toLocaleDateString('pt-BR'),
    status: 'ativo',
  };

  if (r180EditandoId) {
    const idx = data.findIndex(a => a.id === r180EditandoId);
    if (idx !== -1) data[idx] = registro;
    showToast('Avaliação atualizada!');
  } else {
    data.push(registro);
    showToast('Avaliação 180° criada com sucesso!');
  }

  saveAvaliacoes180(data);
  fecharFormulario();
}

/**
 * Remove uma avaliação 180° após confirmação do usuário.
 * @param {number} id - ID da avaliação a remover
 */
function removerAvaliacao180(id) {
  if (!confirm('Remover esta avaliação 180°?')) return;
  const data = getAvaliacoes180().filter(a => a.id !== id);
  saveAvaliacoes180(data);
  renderLista180();
  showToast('Avaliação removida.');
}

// ====================================================================
// LISTA — Renderização dos cards de avaliações 180°
// ====================================================================

/**
 * Renderiza a lista de avaliações 180° cadastradas.
 * Exibe estado vazio com botão de criação quando não há registros.
 */
function renderLista180() {
  const container = document.getElementById('r180-lista-container');
  if (!container) return;

  const data = getAvaliacoes180();

  if (data.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:60px 20px;color:var(--text-muted)">
        <i class="fa-solid fa-clipboard-list" style="font-size:48px;color:var(--border);display:block;margin-bottom:16px"></i>
        <p style="font-size:15px;margin:0 0 16px">Nenhuma avaliação 180° criada ainda.</p>
        <button class="r180-btn-novo" onclick="abrirFormulario()" style="margin:0 auto">
          <i class="fa-solid fa-plus"></i> Criar primeira avaliação
        </button>
      </div>`;
    return;
  }

  container.innerHTML = data.map(a => `
    <div class="r180-item-card">
      <div class="r180-item-icon"><i class="fa-solid fa-rotate"></i></div>
      <div class="r180-item-info">
        <div class="r180-item-nome">${a.nome}</div>
        <div class="r180-item-meta">
          <span><i class="fa-solid fa-building"></i> ${a.empresa || '—'}</span>
          <span><i class="fa-solid fa-user-tie"></i> ${a.gestor || '—'}</span>
          <span><i class="fa-solid fa-sitemap"></i> ${a.setor || '—'}</span>
          ${a.inicio ? `<span><i class="fa-solid fa-calendar"></i> ${a.inicio} → ${a.fim || '?'}</span>` : ''}
        </div>
        <div class="r180-item-badges">
          <span class="r180-badge r180-badge-tipo">${a.tipoLabel || a.tipo}</span>
          <span class="r180-badge r180-badge-ativo">${a.avaliados?.length || 0} avaliados</span>
          <span class="r180-badge" style="background:#f5f3ff;color:#5b21b6">${a.competencias?.length || 0} competências</span>
        </div>
      </div>
      <div class="r180-item-actions">
        <a href="responder-180.html?id=${a.id}" class="r180-btn-responder" title="Responder avaliação">
          <i class="fa-solid fa-pen-to-square"></i> Responder
        </a>
        <button class="r180-btn-icon edit" onclick="abrirFormulario(${a.id})" title="Editar">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="r180-btn-icon del" onclick="removerAvaliacao180(${a.id})" title="Remover">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>`).join('');
}

// ====================================================================
// MODAL DE AVALIADOS — Seleção por checkboxes
// ====================================================================

/**
 * Abre o modal de seleção de avaliados.
 * Atualiza o título com o nome do gestor selecionado e inicia na etapa 1 (checkboxes).
 */
function abrirModalAvaliado() {
  // Atualiza título com nome do gestor
  const gestorSelect = document.getElementById('r180-gestor');
  const gestorNome = gestorSelect.options[gestorSelect.selectedIndex]?.text || '';
  const titulo = document.getElementById('modal-avaliado-titulo');
  if (titulo) titulo.textContent = gestorNome
    ? `Avaliados — Gestor(a) ${gestorNome}`
    : 'Avaliados';

  // Reseta o checkbox "Selecionar Todos"
  const checkTodos = document.getElementById('check-todos');
  if (checkTodos) checkTodos.checked = false;

  // Sempre começa na etapa 1 (lista de checkboxes)
  const etapa1 = document.getElementById('modal-etapa-selecao');
  const etapa2 = document.getElementById('modal-etapa-lista');
  if (etapa1) etapa1.style.display = 'block';
  if (etapa2) etapa2.style.display = 'none';

  renderCheckLista();
  document.getElementById('modal-avaliado').classList.add('open');
}

/**
 * Fecha o modal de avaliados ao clicar no overlay ou chamar diretamente.
 * @param {Event|null} e - Evento de clique (opcional)
 */
function fecharModalAvaliado(e) {
  if (!e || e.target === document.getElementById('modal-avaliado')) {
    document.getElementById('modal-avaliado').classList.remove('open');
  }
}

/**
 * Renderiza a lista de estagiários com checkboxes no modal de seleção.
 * Marca como selecionados os que já estão em r180Avaliados.
 * Exibe tags de empresa, gestor e setor conforme preenchidos no formulário.
 */
function renderCheckLista() {
  const container = document.getElementById('modal-check-lista');
  if (!container) return;

  const empresa = document.getElementById('r180-empresa').value.trim();
  const gestorSelect = document.getElementById('r180-gestor');
  const gestorNome = gestorSelect.options[gestorSelect.selectedIndex]?.text || '';
  const setor = document.getElementById('r180-setor').value.trim();

  const estagiarios = getContatos().filter(c => c.tipo === 'estagiario');

  if (estagiarios.length === 0) {
    container.innerHTML = '<p class="r180-empty-small">Nenhum estagiário cadastrado.</p>';
    return;
  }

  container.innerHTML = estagiarios.map(e => {
    const jaSelecionado = r180Avaliados.find(a => a.id == e.id);
    return `
      <label class="r180-check-item ${jaSelecionado ? 'selecionado' : ''}"
             onclick="toggleCheckItem(this)">
        <div class="r180-check-avatar">
          <i class="fa-solid fa-user"></i>
        </div>
        <div class="r180-check-info">
          <div class="r180-check-nome">${e.nome}</div>
          <div class="r180-check-tags">
            ${empresa ? `<span class="r180-tag r180-tag-empresa">Empresa: <strong>${empresa}</strong></span>` : ''}
            ${gestorNome ? `<span class="r180-tag r180-tag-gestor">Gestor: <strong>${gestorNome}</strong></span>` : ''}
            ${setor ? `<span class="r180-tag r180-tag-setor">Dpto: <strong>${setor}</strong></span>` : ''}
          </div>
        </div>
        <input type="checkbox" value="${e.id}" ${jaSelecionado ? 'checked' : ''}
               onclick="event.stopPropagation()">
      </label>`;
  }).join('');
}

/**
 * Alterna o estado de seleção de um item de checkbox no modal.
 * Atualiza também o estado do checkbox "Selecionar Todos".
 * @param {HTMLElement} label - Elemento label clicado
 */
function toggleCheckItem(label) {
  const cb = label.querySelector('input[type="checkbox"]');
  cb.checked = !cb.checked;
  label.classList.toggle('selecionado', cb.checked);

  // Sincroniza o estado do "Selecionar Todos" com a seleção atual
  const todos = document.querySelectorAll('#modal-check-lista input[type="checkbox"]');
  const marcados = document.querySelectorAll('#modal-check-lista input[type="checkbox"]:checked');
  const checkTodos = document.getElementById('check-todos');
  if (checkTodos) checkTodos.checked = todos.length > 0 && todos.length === marcados.length;
}

/**
 * Marca ou desmarca todos os checkboxes da lista de avaliados.
 * @param {HTMLInputElement} cb - Checkbox "Selecionar Todos"
 */
function toggleSelecionarTodos(cb) {
  document.querySelectorAll('#modal-check-lista .r180-check-item').forEach(item => {
    const input = item.querySelector('input[type="checkbox"]');
    input.checked = cb.checked;
    item.classList.toggle('selecionado', cb.checked);
  });
}

/**
 * Confirma a seleção de avaliados marcados, adiciona à lista r180Avaliados
 * (evitando duplicatas) e avança para a etapa 2 (lista de confirmados).
 */
function confirmarAvaliados() {
  const empresa = document.getElementById('r180-empresa').value.trim();
  const gestorSelect = document.getElementById('r180-gestor');
  const gestorNome = gestorSelect.options[gestorSelect.selectedIndex]?.text || '';
  const setor = document.getElementById('r180-setor').value.trim();

  const selecionados = document.querySelectorAll('#modal-check-lista input[type="checkbox"]:checked');

  selecionados.forEach(cb => {
    const id = parseInt(cb.value);
    if (r180Avaliados.find(a => a.id == id)) return; // Evita duplicata

    const pessoa = getContatos().find(c => c.id == id);
    if (!pessoa) return;

    r180Avaliados.push({
      id: pessoa.id,
      nome: pessoa.nome,
      empresa,
      gestor: gestorNome,
      setor,
      cargo: '',
    });
  });

  renderAvaliados();

  // Avança para etapa 2: lista de confirmados
  document.getElementById('modal-etapa-selecao').style.display = 'none';
  document.getElementById('modal-etapa-lista').style.display = 'block';
  renderListaConfirmados();

  const qtd = selecionados.length;
  if (qtd > 0) showToast(`${qtd} avaliado${qtd > 1 ? 's' : ''} adicionado${qtd > 1 ? 's' : ''}!`);
}

/** Retorna da etapa 2 (confirmados) para a etapa 1 (checkboxes). */
function voltarParaSelecao() {
  document.getElementById('modal-etapa-lista').style.display = 'none';
  document.getElementById('modal-etapa-selecao').style.display = 'block';
  renderCheckLista();
}

/**
 * Renderiza a lista de avaliados já confirmados na etapa 2 do modal.
 * Exibe botões de editar e remover para cada item.
 */
function renderListaConfirmados() {
  const container = document.getElementById('modal-lista-confirmados');
  if (!container) return;

  if (r180Avaliados.length === 0) {
    container.innerHTML = '<p class="r180-empty-small">Nenhum avaliado adicionado.</p>';
    return;
  }

  container.innerHTML = r180Avaliados.map(a => `
    <div class="r180-check-item-confirmed">
      <div class="r180-check-avatar">
        <i class="fa-solid fa-user"></i>
      </div>
      <div class="r180-check-info">
        <div class="r180-check-nome">${a.nome}</div>
        <div class="r180-check-tags">
          ${a.empresa ? `<span class="r180-tag">Empresa: <strong>${a.empresa}</strong></span>` : ''}
          ${a.gestor ? `<span class="r180-tag">Gestor: <strong>${a.gestor}</strong></span>` : ''}
          ${a.setor ? `<span class="r180-tag">Dpto: <strong>${a.setor}</strong></span>` : ''}
          ${a.cargo ? `<span class="r180-tag">Cargo: <strong>${a.cargo}</strong></span>` : ''}
        </div>
      </div>
      <div class="r180-confirmed-actions">
        <button class="r180-btn-icon edit" onclick="editarAvaliado(${a.id})" title="Editar">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="r180-btn-icon del" onclick="removerAvaliadoModal(${a.id})" title="Remover">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>`).join('');
}

/**
 * Remove um avaliado da lista r180Avaliados pelo ID.
 * Atualiza a lista confirmada e o painel do formulário.
 * @param {number} id - ID do avaliado a remover
 */
function removerAvaliadoModal(id) {
  r180Avaliados = r180Avaliados.filter(a => a.id != id);
  renderListaConfirmados();
  renderAvaliados();
  showToast('Avaliado removido.');
}

/** Abre o modal de confirmação antes de salvar edição de avaliado. */
function pedirConfirmacaoEdicao() {
  document.getElementById('modal-confirmar-edicao').classList.add('open');
}

/**
 * Fecha o modal de confirmação de edição ao clicar no overlay ou chamar diretamente.
 * @param {Event|null} e
 */
function fecharConfirmacaoEdicao(e) {
  if (!e || e.target === document.getElementById('modal-confirmar-edicao')) {
    document.getElementById('modal-confirmar-edicao').classList.remove('open');
  }
}

/**
 * Aplica as alterações feitas no modal de edição ao objeto do avaliado em r180Avaliados.
 * Fecha ambos os modais (edição e confirmação) e atualiza as listas.
 */
function salvarEdicaoAvaliado() {
  const id = parseInt(document.getElementById('edit-av-id').value);
  const av = r180Avaliados.find(a => a.id == id);
  if (!av) return;

  // Atualiza todos os campos editáveis do avaliado
  av.nome       = document.getElementById('edit-av-nome').value.trim();
  av.ra         = document.getElementById('edit-av-ra').value.trim();
  av.cpf        = document.getElementById('edit-av-cpf').value.trim();
  av.email      = document.getElementById('edit-av-email').value.trim();
  av.nascimento = document.getElementById('edit-av-nascimento').value;
  av.genero     = document.getElementById('edit-av-genero').value;
  av.cargo      = document.getElementById('edit-av-cargo').value.trim();
  av.setor      = document.getElementById('edit-av-departamento').value.trim();
  av.empresa    = document.getElementById('edit-av-empresa').value.trim();
  av.gestor     = document.getElementById('edit-av-gestor').value;

  // Fecha ambos os modais
  document.getElementById('modal-confirmar-edicao').classList.remove('open');
  document.getElementById('modal-editar-avaliado').classList.remove('open');

  renderListaConfirmados();
  renderAvaliados();
  showToast('Avaliado atualizado com sucesso!');
}

/**
 * Fecha o modal de edição de avaliado ao clicar no overlay ou chamar diretamente.
 * @param {Event|null} e
 */
function fecharModalEditarAvaliado(e) {
  if (!e || e.target === document.getElementById('modal-editar-avaliado')) {
    document.getElementById('modal-editar-avaliado').classList.remove('open');
  }
}

/**
 * Abre o modal de edição de um avaliado específico, preenchendo todos os campos
 * com os dados atuais e populando o select de gestores.
 * @param {number} id - ID do avaliado a editar
 */
function editarAvaliado(id) {
  const av = r180Avaliados.find(a => a.id == id);
  if (!av) return;

  // Preenche o modal com os dados atuais do avaliado
  document.getElementById('edit-av-id').value = id;
  document.getElementById('edit-av-nome').value = av.nome || '';
  document.getElementById('edit-av-ra').value = av.ra || '';
  document.getElementById('edit-av-cpf').value = av.cpf || '';
  document.getElementById('edit-av-email').value = av.email || '';
  document.getElementById('edit-av-nascimento').value = av.nascimento || '';
  document.getElementById('edit-av-genero').value = av.genero || '';
  document.getElementById('edit-av-cargo').value = av.cargo || '';
  document.getElementById('edit-av-departamento').value = av.setor || '';
  document.getElementById('edit-av-empresa').value = av.empresa || '';

  // Popula o select de gestor e pré-seleciona o atual
  const gestorSelect = document.getElementById('edit-av-gestor');
  const professores = getContatos().filter(c => c.tipo === 'professor');
  gestorSelect.innerHTML = '<option value="">Selecione...</option>' +
    professores.map(p => `<option value="${p.nome}" ${p.nome === av.gestor ? 'selected' : ''}>${p.nome}</option>`).join('');

  document.getElementById('modal-editar-avaliado').classList.add('open');
}

/**
 * Fecha o modal de avaliados e abre a página de cadastro em nova aba.
 * Permite criar um novo estagiário sem perder o formulário atual.
 */
function abrirCriarAvaliado() {
  fecharModalAvaliado();
  window.open('cadastrar.html', '_blank');
}

/**
 * Remove um avaliado diretamente do painel do formulário (fora do modal).
 * @param {number} id - ID do avaliado a remover
 */
function removerAvaliado(id) {
  r180Avaliados = r180Avaliados.filter(a => a.id != id);
  renderAvaliados();
}

/**
 * Renderiza a lista de avaliados vinculados no painel do formulário principal.
 */
function renderAvaliados() {
  const container = document.getElementById('r180-avaliados-lista');
  if (!container) return;

  if (r180Avaliados.length === 0) {
    container.innerHTML = '<p class="r180-empty-small">Nenhum avaliado adicionado.</p>';
    return;
  }

  container.innerHTML = r180Avaliados.map(a => `
    <div class="r180-avaliado-item">
      <div class="r180-avaliado-avatar">
        <i class="fa-solid fa-user"></i>
      </div>
      <div class="r180-avaliado-info">
        <div class="r180-avaliado-nome">${a.nome}</div>
        <div class="r180-avaliado-tags">
          ${a.empresa ? `<span class="r180-tag">Empresa: <strong>${a.empresa}</strong></span>` : ''}
          ${a.gestor ? `<span class="r180-tag">Gestor: <strong>${a.gestor}</strong></span>` : ''}
          ${a.setor ? `<span class="r180-tag">Dpto: <strong>${a.setor}</strong></span>` : ''}
          ${a.cargo ? `<span class="r180-tag">Cargo: <strong>${a.cargo}</strong></span>` : ''}
        </div>
      </div>
      <button class="r180-btn-icon del" onclick="removerAvaliado(${a.id})" title="Remover">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>`).join('');
}

// ====================================================================
// COMPETÊNCIAS VINCULADAS — Modal de seleção
// ====================================================================

/**
 * Abre o modal de seleção de competências, limpando a busca e renderizando a lista.
 */
function abrirModalCompetencia() {
  document.getElementById('modal-comp-busca').value = '';
  renderCompetenciasModal('');
  document.getElementById('modal-competencia').classList.add('open');
}

/**
 * Fecha o modal de competências ao clicar no overlay ou chamar diretamente.
 * @param {Event|null} e
 */
function fecharModalCompetencia(e) {
  if (!e || e.target === document.getElementById('modal-competencia')) {
    document.getElementById('modal-competencia').classList.remove('open');
  }
}

/**
 * Filtra a lista de competências no modal conforme o texto digitado.
 * @param {string} busca - Texto de busca digitado pelo usuário
 */
function filtrarCompetenciasModal(busca) {
  renderCompetenciasModal(busca.toLowerCase());
}

/**
 * Renderiza a lista de competências disponíveis no modal com checkboxes.
 * Marca como selecionadas as que já estão em r180Competencias.
 * @param {string} busca - Texto de filtro (já em minúsculas)
 */
function renderCompetenciasModal(busca) {
  const container = document.getElementById('modal-comp-lista');
  if (!container) return;

  let comps = getCompetencias();
  if (busca) {
    comps = comps.filter(c =>
      c.nome.toLowerCase().includes(busca) ||
      (c.descricao || '').toLowerCase().includes(busca)
    );
  }

  if (comps.length === 0) {
    container.innerHTML = `
      <div class="r180-comp-empty">
        <div class="r180-comp-empty-icon">
          <i class="fa-solid fa-circle-question"></i>
        </div>
        <div class="r180-comp-empty-text">
          <strong>Nenhuma competência selecionada</strong>
          <span>Selecione uma ou mais competências na barra de pesquisa para criar uma nova avaliação.</span>
        </div>
      </div>`;
    return;
  }

  const tipoLabel = { desempenho: 'Desempenho', comportamento: 'Comportamento', tecnica: 'Técnica', lideranca: 'Liderança' };

  container.innerHTML = comps.map(c => {
    const jaSelecionada = r180Competencias.find(x => x.id == c.id);
    return `
      <label class="r180-comp-check-item ${jaSelecionada ? 'selecionado' : ''}"
             onclick="toggleCompCheck(this)">
        <div class="r180-comp-check-icon">
          <i class="fa-solid fa-chart-line"></i>
        </div>
        <div class="r180-comp-check-info">
          <div class="r180-comp-check-nome">${c.nome}</div>
          ${c.tipo ? `<div class="r180-comp-check-desc">${tipoLabel[c.tipo] || c.tipo}${c.descricao ? ' — ' + c.descricao : ''}</div>` : ''}
        </div>
        <input type="checkbox" value="${c.id}" ${jaSelecionada ? 'checked' : ''}
               onclick="event.stopPropagation()">
      </label>`;
  }).join('');
}

/**
 * Alterna o estado de seleção de um item de competência no modal.
 * @param {HTMLElement} label - Elemento label clicado
 */
function toggleCompCheck(label) {
  const cb = label.querySelector('input[type="checkbox"]');
  cb.checked = !cb.checked;
  label.classList.toggle('selecionado', cb.checked);
}

/**
 * Confirma as competências selecionadas no modal, adicionando-as a r180Competencias
 * (sem duplicatas), e fecha o modal.
 */
function confirmarCompetencias() {
  const selecionados = document.querySelectorAll('#modal-comp-lista input[type="checkbox"]:checked');

  selecionados.forEach(cb => {
    const id = parseInt(cb.value);
    if (r180Competencias.find(c => c.id == id)) return; // Evita duplicata

    const comp = getCompetencias().find(c => c.id == id);
    if (!comp) return;

    r180Competencias.push({ id: comp.id, nome: comp.nome, tipo: comp.tipo, descricao: comp.descricao });
  });

  renderCompetenciasVinculadas();
  fecharModalCompetencia();

  const qtd = selecionados.length;
  if (qtd > 0) showToast(`${qtd} competência${qtd > 1 ? 's' : ''} adicionada${qtd > 1 ? 's' : ''}!`);
}

/**
 * Fecha o modal de competências e abre a página de competências em nova aba.
 * Permite criar novas competências sem perder o formulário atual.
 */
function irParaCriarCompetencia() {
  fecharModalCompetencia();
  window.open('competencias.html', '_blank');
}

/**
 * Remove uma competência vinculada pelo ID e atualiza o painel do formulário.
 * @param {number} id - ID da competência a remover
 */
function removerCompetenciaVinculada(id) {
  r180Competencias = r180Competencias.filter(c => c.id != id);
  renderCompetenciasVinculadas();
}

/**
 * Renderiza a lista de competências vinculadas no painel do formulário principal.
 */
function renderCompetenciasVinculadas() {
  const container = document.getElementById('r180-competencias-lista');
  if (!container) return;

  if (r180Competencias.length === 0) {
    container.innerHTML = '<p class="r180-empty-small">Nenhuma competência adicionada.</p>';
    return;
  }

  const tipoLabel = { desempenho: 'Competência de Desempenho', comportamento: 'Comportamento', tecnica: 'Técnica', lideranca: 'Liderança' };

  container.innerHTML = r180Competencias.map(c => `
    <div class="r180-comp-item">
      <div class="r180-comp-icon"><i class="fa-solid fa-chart-line"></i></div>
      <div class="r180-comp-info">
        <div class="r180-comp-nome">${c.nome}</div>
        ${c.tipo ? `<span class="r180-comp-badge">${tipoLabel[c.tipo] || c.tipo}</span>` : ''}
        ${c.descricao ? `<div class="r180-comp-desc">${c.descricao}</div>` : ''}
      </div>
      <div class="r180-comp-actions">
        <button class="r180-btn-icon del" onclick="removerCompetenciaVinculada(${c.id})" title="Remover">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>`).join('');
}

// ====================================================================
// EVENTOS GLOBAIS E INICIALIZAÇÃO
// ====================================================================

// Fecha modais abertos ao pressionar ESC
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    fecharModalAvaliado();
    fecharModalCompetencia();
  }
});

// Inicializa a lista e configura validação ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
  renderLista180();
  addLiveValidation('r180-nome',    v => v.trim().length > 0, 'O nome da avaliação é obrigatório.');
  addLiveValidation('r180-empresa', v => v.trim().length > 0, 'O nome da empresa é obrigatório.');
});
