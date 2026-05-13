// ====================================================================
// competencias.js — CRUD de Competências
// Gerencia o cadastro, edição, remoção e listagem de competências
// utilizadas nas avaliações 180°. Dados persistidos no localStorage.
// ====================================================================

// ID da competência sendo editada (null = criação nova)
let editandoId = null;

// ====================================================================
// STORAGE — Persistência no localStorage
// ====================================================================

/** Retorna todas as competências salvas. */
function getCompetencias() {
  return JSON.parse(localStorage.getItem('competencias') || '[]');
}

/** Persiste a lista de competências no localStorage. */
function saveCompetencias(data) {
  localStorage.setItem('competencias', JSON.stringify(data));
}

// ====================================================================
// FORMULÁRIO — Criação e edição
// ====================================================================

/**
 * Abre o formulário de criação ou edição de competência.
 * Se um ID for fornecido, preenche os campos com os dados existentes.
 * @param {number|null} id - ID da competência a editar, ou null para nova
 */
function abrirFormulario(id = null) {
  editandoId = id;

  // Alterna visibilidade entre lista e formulário
  document.getElementById('tela-lista').style.display = 'none';
  document.getElementById('tela-form').style.display = 'block';
  document.getElementById('comp-header-title').textContent =
    id ? 'Editar Competência' : 'Nova Competência';
  document.getElementById('form-titulo').textContent =
    id ? 'Editar Competência' : 'Nova Competência';

  // Limpa todos os campos antes de preencher
  document.getElementById('comp-nome').value = '';
  document.getElementById('comp-de').value = '';
  document.getElementById('comp-tipo').value = '';
  document.getElementById('comp-descricao').value = '';
  document.querySelectorAll('#comp-criterios-grid textarea').forEach(t => t.value = '');

  // Modo edição: preenche com dados existentes
  if (id) {
    const comp = getCompetencias().find(c => c.id === id);
    if (comp) {
      document.getElementById('comp-nome').value = comp.nome || '';
      document.getElementById('comp-de').value = comp.de || '';
      document.getElementById('comp-tipo').value = comp.tipo || '';
      document.getElementById('comp-descricao').value = comp.descricao || '';
      const textareas = document.querySelectorAll('#comp-criterios-grid textarea');
      (comp.criterios || []).forEach((c, i) => {
        if (textareas[i]) textareas[i].value = c;
      });
    }
  }
}

/**
 * Fecha o formulário e retorna à lista de competências,
 * limpando erros de validação e o estado de edição.
 */
function fecharFormulario() {
  document.getElementById('tela-form').style.display = 'none';
  document.getElementById('tela-lista').style.display = 'block';
  document.getElementById('comp-header-title').textContent = 'Competências';
  editandoId = null;
  clearAllErrors('tela-form');
  renderLista();
}

// ====================================================================
// SALVAR — Criação e atualização
// ====================================================================

/**
 * Valida os campos obrigatórios e salva (cria ou atualiza) a competência.
 * Campos obrigatórios: nome, destinatário (de) e tipo.
 */
function salvarCompetencia() {
  const nome = document.getElementById('comp-nome').value.trim();
  const de   = document.getElementById('comp-de').value;
  const tipo = document.getElementById('comp-tipo').value;
  const descricao = document.getElementById('comp-descricao').value.trim();

  // Coleta os critérios preenchidos nos textareas da grade
  const criterios = Array.from(
    document.querySelectorAll('#comp-criterios-grid textarea')
  ).map(t => t.value.trim());

  let valido = true;

  if (!nome) {
    setFieldError('comp-nome', 'O nome da competência é obrigatório.');
    valido = false;
  } else {
    clearFieldError('comp-nome');
  }

  if (!de) {
    setFieldError('comp-de', 'Selecione a quem esta competência pertence.');
    valido = false;
  } else {
    clearFieldError('comp-de');
  }

  if (!tipo) {
    setFieldError('comp-tipo', 'Selecione o tipo da competência.');
    valido = false;
  } else {
    clearFieldError('comp-tipo');
  }

  if (!valido) {
    // Foca e anima o primeiro campo com erro
    const primeiro = document.querySelector('#tela-form .field-error');
    if (primeiro) { primeiro.classList.add('field-shake'); primeiro.focus(); setTimeout(() => primeiro.classList.remove('field-shake'), 400); }
    return;
  }

  const data = getCompetencias();

  if (editandoId) {
    // Atualiza a competência existente preservando o ID e a data original
    const idx = data.findIndex(c => c.id === editandoId);
    if (idx !== -1) {
      data[idx] = { ...data[idx], nome, de, tipo, descricao, criterios };
      showToast('Competência atualizada!');
    }
  } else {
    data.push({
      id: Date.now(),
      nome, de, tipo, descricao, criterios,
      data: new Date().toLocaleDateString('pt-BR'),
    });
    showToast('Competência criada com sucesso!');
  }

  saveCompetencias(data);
  fecharFormulario();
}

// ====================================================================
// REMOVER
// ====================================================================

/**
 * Remove uma competência após confirmação do usuário.
 * @param {number} id - ID da competência a remover
 */
function removerCompetencia(id) {
  if (!confirm('Remover esta competência?')) return;
  const data = getCompetencias().filter(c => c.id !== id);
  saveCompetencias(data);
  renderLista();
  showToast('Competência removida.');
}

// ====================================================================
// LISTA — Renderização dos cards
// ====================================================================

/**
 * Renderiza a lista de competências cadastradas como cards.
 * Exibe estado vazio com botão de criação quando não há registros.
 */
function renderLista() {
  const container = document.getElementById('comp-lista-container');
  if (!container) return;

  const data = getCompetencias();

  if (data.length === 0) {
    container.innerHTML = `
      <div class="comp-empty">
        <i class="fa-solid fa-clipboard-list"></i>
        <p>Nenhuma competência cadastrada ainda.</p>
        <button class="comp-btn-novo" onclick="abrirFormulario()">
          <i class="fa-solid fa-plus"></i> Criar primeira competência
        </button>
      </div>`;
    return;
  }

  // Mapeamentos de rótulos para exibição nos badges
  const tipoLabel = { desempenho: 'Desempenho', comportamento: 'Comportamento', tecnica: 'Técnica', lideranca: 'Liderança' };
  const deLabel   = { gestor: 'Gestor', professor: 'Gestor', estagiario: 'Estagiário', todos: 'Todos' };

  container.innerHTML = data.map(c => `
    <div class="comp-card">
      <div class="comp-card-icon">
        <i class="fa-solid fa-clipboard-check"></i>
      </div>
      <div class="comp-card-info">
        <div class="comp-card-nome">${c.nome}</div>
        ${c.descricao ? `<div class="comp-card-desc">${c.descricao}</div>` : ''}
        <div class="comp-card-badges">
          ${c.de ? `<span class="comp-badge comp-badge-de">${deLabel[c.de] || c.de}</span>` : ''}
          ${c.tipo ? `<span class="comp-badge comp-badge-tipo">${tipoLabel[c.tipo] || c.tipo}</span>` : ''}
          <span class="comp-badge" style="background:#f1f5f9;color:var(--text-muted)">${c.data}</span>
        </div>
      </div>
      <div class="comp-card-actions">
        <button class="comp-btn-edit" onclick="abrirFormulario(${c.id})">
          <i class="fa-solid fa-pen"></i> Editar
        </button>
        <button class="comp-btn-del" onclick="removerCompetencia(${c.id})">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
}

// ====================================================================
// INICIALIZAÇÃO
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
  renderLista();
  // Validação em tempo real nos campos obrigatórios
  addLiveValidation('comp-nome', v => v.trim().length > 0, 'O nome da competência é obrigatório.');
  addLiveValidation('comp-de',   v => v !== '',            'Selecione a quem esta competência pertence.');
  addLiveValidation('comp-tipo', v => v !== '',            'Selecione o tipo da competência.');

  // ---- RESTRIÇÕES PARA ESTAGIÁRIO ----
  aplicarRestricoesCompEstagiario();
});

/**
 * Para estagiários: oculta o botão "Nova Competência" e os botões
 * de editar/remover nos cards. Apenas visualização é permitida.
 */
function aplicarRestricoesCompEstagiario() {
  if (!usuarioIsEstagiario()) return;

  // Oculta o botão de nova competência no header
  const btnNovo = document.querySelector('.comp-btn-novo-header, [onclick*="abrirFormulario()"]');
  if (btnNovo) btnNovo.style.display = 'none';

  // Observa o DOM para ocultar botões nos cards quando forem renderizados
  const observer = new MutationObserver(() => {
    document.querySelectorAll('.comp-card-actions').forEach(el => {
      el.style.display = 'none';
    });
    // Oculta também o botão "Criar primeira competência" no estado vazio
    const btnEmpty = document.querySelector('.comp-empty .comp-btn-novo');
    if (btnEmpty) btnEmpty.style.display = 'none';
  });
  const container = document.getElementById('comp-lista-container');
  if (container) observer.observe(container, { childList: true, subtree: true });
}
