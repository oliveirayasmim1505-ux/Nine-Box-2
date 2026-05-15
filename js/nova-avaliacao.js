// ============================================================
// NOVA-AVALIACAO.JS — Modal global de criação de avaliação
// Aparece apenas na página avaliacoes.html (botão flutuante)
// Fluxo: Etapa 1 (escolher tipo) → Etapa 2 (preencher formulário)
// ============================================================

// Critérios de avaliação para professores (com ícone e chave de armazenamento)
const NA_CRITERIOS = [
  { key: 'pontualidade', label: 'Pontualidade',       icon: 'fa-regular fa-clock' },
  { key: 'comunicacao',  label: 'Comunicação',        icon: 'fa-regular fa-comments' },
  { key: 'tecnico',      label: 'Desempenho Técnico', icon: 'fa-solid fa-code' },
  { key: 'proatividade', label: 'Proatividade',       icon: 'fa-solid fa-bolt' },
  { key: 'equipe',       label: 'Trabalho em Equipe', icon: 'fa-solid fa-people-group' },
];

// Estado das notas por critério (zerado ao abrir o modal)
let naNotas = {};
NA_CRITERIOS.forEach(c => naNotas[c.key] = 0);

let naTipo  = null; // 'professor' | 'estagiario'
let naEtapa = 1;    // 1 = escolha do tipo | 2 = formulário

// ============================================================
// ABRIR / FECHAR MODAL
// ============================================================

/**
 * Abre o modal de nova avaliação, resetando o estado.
 * @param {string} [tipoPreSelecionado] - Se informado, pula direto para o tipo
 */
function abrirNovaAvaliacao(tipoPreSelecionado) {
  // Reseta estado
  naEtapa = 1;
  naTipo  = null;
  NA_CRITERIOS.forEach(c => naNotas[c.key] = 0);

  _naRenderEtapa1();

  // Se um tipo foi passado como argumento, seleciona automaticamente
  if (tipoPreSelecionado) {
    _naSelecionarTipo(tipoPreSelecionado);
  }

  document.getElementById('na-modal').classList.add('open');
  document.body.style.overflow = 'hidden'; // Impede scroll da página ao fundo
}

/** Fecha o modal e restaura o scroll da página */
function fecharNovaAvaliacao() {
  document.getElementById('na-modal').classList.remove('open');
  document.body.style.overflow = '';
}

/** Fecha o modal ao clicar no overlay (fora do card) */
function _naFecharClick(e) {
  if (e.target === document.getElementById('na-modal')) fecharNovaAvaliacao();
}

// ============================================================
// ETAPA 1 — Seleção do tipo de avaliação
// ============================================================

/** Exibe a etapa 1 (cards de tipo) e reseta a seleção */
function _naRenderEtapa1() {
  naEtapa = 1;
  document.getElementById('na-etapa-1').style.display = 'flex';
  document.getElementById('na-etapa-2').style.display = 'none';
  document.getElementById('na-titulo').textContent    = 'Nova Avaliação';
  document.getElementById('na-subtitulo').textContent = 'Selecione o tipo de avaliação';

  // Remove seleção visual dos cards
  document.querySelectorAll('.na-tipo-card').forEach(c => c.classList.remove('selected'));
  naTipo = null;
  document.getElementById('na-btn-avancar').disabled = true;
}

/**
 * Seleciona um tipo de avaliação e habilita o botão Próximo.
 * @param {string} tipo - 'professor' ou 'estagiario'
 */
function _naSelecionarTipo(tipo) {
  naTipo = tipo;
  document.querySelectorAll('.na-tipo-card').forEach(c => {
    c.classList.toggle('selected', c.dataset.tipo === tipo);
  });
  document.getElementById('na-btn-avancar').disabled = false;
}

/** Avança para a etapa 2 se um tipo estiver selecionado */
function _naAvancar() {
  if (!naTipo) return;
  _naRenderEtapa2();
}

// ============================================================
// ETAPA 2 — Formulário de avaliação
// ============================================================

/** Exibe a etapa 2 com o formulário adequado ao tipo selecionado */
function _naRenderEtapa2() {
  naEtapa = 2;
  document.getElementById('na-etapa-1').style.display = 'none';
  document.getElementById('na-etapa-2').style.display = 'block';

  const isProfessor = naTipo === 'professor';

  // Atualiza título e subtítulo do modal
  document.getElementById('na-titulo').textContent    = isProfessor ? 'Avaliar Gestor' : 'Avaliar Estagiário';
  document.getElementById('na-subtitulo').textContent = isProfessor
    ? 'Avalie por critérios com estrelas'
    : 'Escreva um comentário sobre o desempenho';

  // Popula o select com as pessoas do tipo correto
  _naPopularSelect();

  // Mostra/oculta seções conforme o tipo
  document.getElementById('na-criterios-wrap').style.display = isProfessor ? 'block' : 'none';
  document.getElementById('na-media-wrap').style.display     = isProfessor ? 'flex'  : 'none';
  document.getElementById('na-aspectos-wrap').style.display  = isProfessor ? 'none'  : 'block';

  // Ajusta label e placeholder do comentário
  const comentLabel = document.getElementById('na-comentario-label');
  const comentInput = document.getElementById('na-comentario');
  if (isProfessor) {
    comentLabel.innerHTML    = 'Comentário <span class="av-opcional">(opcional)</span>';
    comentInput.placeholder  = 'Descreva sua avaliação...';
    comentInput.rows         = 3;
  } else {
    comentLabel.innerHTML    = 'Comentário <span class="av-obrigatorio">(obrigatório)</span>';
    comentInput.placeholder  = 'Descreva o desempenho do estagiário de forma específica e construtiva...';
    comentInput.rows         = 5;
  }

  // Reseta campos e notas
  document.getElementById('na-avaliado').value    = '';
  document.getElementById('na-comentario').value  = '';
  document.getElementById('na-media-valor').textContent = '—';
  NA_CRITERIOS.forEach(c => naNotas[c.key] = 0);

  // Inicializa as estrelas clicáveis
  _naInitStars();
}

/**
 * Popula o select de avaliados com as pessoas do tipo atual.
 */
function _naPopularSelect() {
  const select   = document.getElementById('na-avaliado');
  const contatos = getContatos().filter(c => c.tipo === naTipo);

  if (contatos.length === 0) {
    select.innerHTML = `<option value="">Nenhum ${naTipo === 'professor' ? 'professor' : 'estagiário'} cadastrado</option>`;
    return;
  }
  select.innerHTML = '<option value="">Selecione...</option>' +
    contatos.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
}

// ============================================================
// ESTRELAS — Avaliação por critérios (apenas para professor)
// ============================================================

/**
 * Inicializa as estrelas clicáveis do formulário.
 * Clona os grupos para remover listeners antigos e evitar duplicatas.
 */
function _naInitStars() {
  document.querySelectorAll('#na-criterios-wrap .na-stars').forEach(group => {
    const criterio = group.dataset.criterio;

    // Clona o grupo para remover event listeners anteriores
    const clone = group.cloneNode(true);
    group.parentNode.replaceChild(clone, group);
    const spans = Array.from(clone.querySelectorAll('span'));

    spans.forEach((star, i) => {
      star.addEventListener('click', () => {
        // Toggle: clicar na mesma estrela limpa a nota
        naNotas[criterio] = naNotas[criterio] === i + 1 ? 0 : i + 1;
        _naRenderStars(spans, naNotas[criterio]);
        _naAtualizarMedia();
      });
    });

    // Inicia todas as estrelas vazias
    _naRenderStars(spans, 0);
  });
}

/**
 * Atualiza o visual das estrelas de acordo com o valor selecionado.
 * @param {HTMLElement[]} spans - Array de elementos <span> das estrelas
 * @param {number}        valor - Nota de 0 a 5
 */
function _naRenderStars(spans, valor) {
  spans.forEach((s, i) => s.classList.toggle('active', i < valor));
}

/**
 * Recalcula e exibe a média geral das notas preenchidas.
 */
function _naAtualizarMedia() {
  const valores = NA_CRITERIOS.map(c => naNotas[c.key]).filter(v => v > 0);
  const el      = document.getElementById('na-media-valor');
  if (!el) return;

  if (valores.length === 0) {
    el.textContent = '—';
    return;
  }
  const media    = valores.reduce((a, b) => a + b, 0) / valores.length;
  el.textContent = media.toFixed(1) + ' ★';
}

// ============================================================
// SALVAR — Valida e persiste a avaliação no localStorage
// ============================================================

/**
 * Valida os campos preenchidos e salva a avaliação.
 * Comportamento diferente para professor (estrelas) e estagiário (comentário).
 */
function _naSalvar() {
  const selectEl = document.getElementById('na-avaliado');
  const comentEl = document.getElementById('na-comentario');

  // Validação: pessoa selecionada
  if (!selectEl.value) {
    setFieldError('na-avaliado', `Selecione o ${naTipo === 'professor' ? 'professor' : 'estagiário'} a avaliar.`);
    selectEl.focus();
    return;
  }
  clearFieldError('na-avaliado');

  const contatos = getContatos();
  const avaliado = contatos.find(c => c.id == selectEl.value);

  if (naTipo === 'estagiario') {
    // Avaliação de estagiário: comentário obrigatório com mínimo de 20 caracteres
    const texto = comentEl.value.trim();
    if (!texto) {
      setFieldError('na-comentario', 'O comentário é obrigatório para avaliação de estagiários.');
      comentEl.focus();
      return;
    }
    if (texto.length < 20) {
      setFieldError('na-comentario', 'Escreva um comentário mais detalhado (mínimo 20 caracteres).');
      comentEl.focus();
      return;
    }
    clearFieldError('na-comentario');

    const avaliacoes = getAvaliacoes();
    avaliacoes.push({
      id:            Date.now(),
      tipo:          'estagiario',
      avaliado:      avaliado ? avaliado.nome : 'Desconhecido',
      criterios:     {},
      media:         null,
      comentario:    texto,
      data:          new Date().toLocaleDateString('pt-BR'),
      tipoAvaliacao: 'comentario',
    });
    saveAvaliacoes(avaliacoes);
    showToast('Avaliação enviada com sucesso!');

  } else {
    // Avaliação de professor: pelo menos um critério com estrela
    const algumaNota = NA_CRITERIOS.some(c => naNotas[c.key] > 0);
    if (!algumaNota) {
      showToast('Avalie pelo menos um critério com estrelas.', 'error');
      return;
    }

    // Monta snapshot dos critérios e calcula média
    const criteriosSnapshot = {};
    NA_CRITERIOS.forEach(c => criteriosSnapshot[c.key] = naNotas[c.key]);
    const notasPreenchidas = NA_CRITERIOS.map(c => naNotas[c.key]).filter(v => v > 0);
    const media = notasPreenchidas.reduce((a, b) => a + b, 0) / notasPreenchidas.length;

    const avaliacoes = getAvaliacoes();
    avaliacoes.push({
      id:        Date.now(),
      tipo:      'professor',
      avaliado:  avaliado ? avaliado.nome : 'Desconhecido',
      criterios: criteriosSnapshot,
      media:     parseFloat(media.toFixed(1)),
      comentario: comentEl.value.trim(),
      data:      new Date().toLocaleDateString('pt-BR'),
    });
    saveAvaliacoes(avaliacoes);
    showToast('Avaliação enviada com sucesso!');
  }

  fecharNovaAvaliacao();

  // Atualiza listas na página atual se as funções estiverem disponíveis
  if (typeof renderHistorico     === 'function') renderHistorico();
  if (typeof renderHistoricoFull === 'function') renderHistoricoFull();
  if (typeof renderRelatorio     === 'function') renderRelatorio();
}

// ============================================================
// INJETAR MODAL NO DOM — Criado dinamicamente para funcionar em qualquer página
// ============================================================

/**
 * Cria e insere o modal de nova avaliação no body da página.
 * Só executa uma vez (verifica se já existe).
 */
function _naInjetarModal() {
  if (document.getElementById('na-modal')) return;

  const modal = document.createElement('div');
  modal.id        = 'na-modal';
  modal.className = 'na-modal-overlay';
  modal.setAttribute('onclick', '_naFecharClick(event)');

  modal.innerHTML = `
    <div class="na-modal">

      <!-- Cabeçalho com título dinâmico e botão de fechar -->
      <div class="na-modal-header">
        <div class="na-modal-header-text">
          <h4 id="na-titulo">Nova Avaliação</h4>
          <p id="na-subtitulo">Selecione o tipo de avaliação</p>
        </div>
        <button class="na-close-btn" onclick="fecharNovaAvaliacao()" title="Fechar">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- ETAPA 1: Cards de seleção do tipo -->
      <div id="na-etapa-1" class="na-etapa">
        <div class="na-tipo-cards">

          <div class="na-tipo-card" data-tipo="professor" onclick="_naSelecionarTipo('professor')">
            <div class="na-tipo-icon">
              <i class="fa-solid fa-chalkboard-user"></i>
            </div>
            <span class="na-tipo-nome">Gestor</span>
            <span class="na-tipo-desc">Avaliação por critérios com estrelas</span>
          </div>

          <div class="na-tipo-card" data-tipo="estagiario" id="na-card-estagiario" onclick="_naSelecionarTipo('estagiario')">
            <div class="na-tipo-icon">
              <i class="fa-solid fa-user-tie"></i>
            </div>
            <span class="na-tipo-nome">Estagiário</span>
            <span class="na-tipo-desc">Avaliação qualitativa por comentário</span>
          </div>

        </div>

        <div class="na-etapa-footer">
          <button class="na-btn-cancelar" onclick="fecharNovaAvaliacao()">Cancelar</button>
          <button class="na-btn-avancar" id="na-btn-avancar" onclick="_naAvancar()" disabled>
            Próximo <i class="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>

      <!-- ETAPA 2: Formulário de avaliação -->
      <div id="na-etapa-2" class="na-etapa" style="display:none">

        <!-- Select para escolher quem será avaliado -->
        <div class="na-field">
          <label for="na-avaliado" id="na-avaliado-label">Selecionar pessoa</label>
          <select id="na-avaliado">
            <option value="">Selecione...</option>
          </select>
        </div>

        <!-- Critérios com estrelas (visível apenas para professor) -->
        <div id="na-criterios-wrap">
          <p class="na-section-title">Critérios de Avaliação</p>
          ${NA_CRITERIOS.map(c => `
          <div class="na-criterio">
            <span class="na-criterio-label">
              <i class="${c.icon}"></i> ${c.label}
            </span>
            <div class="na-stars stars" data-criterio="${c.key}" role="group">
              <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
            </div>
          </div>`).join('')}
        </div>

        <!-- Média calculada automaticamente (visível apenas para professor) -->
        <div id="na-media-wrap" class="na-media-box">
          <span>Média geral</span>
          <span id="na-media-valor" class="na-media-valor">—</span>
        </div>

        <!-- Aspectos para guiar o comentário (visível apenas para estagiário) -->
        <div id="na-aspectos-wrap" style="display:none">
          <p class="na-section-title">Aspectos para Comentar</p>
          <div class="na-aspectos-lista">
            <div class="na-aspecto"><i class="fa-regular fa-clock"></i> Pontualidade</div>
            <div class="na-aspecto"><i class="fa-regular fa-comments"></i> Comunicação</div>
            <div class="na-aspecto"><i class="fa-solid fa-code"></i> Desempenho Técnico</div>
            <div class="na-aspecto"><i class="fa-solid fa-bolt"></i> Proatividade</div>
            <div class="na-aspecto"><i class="fa-solid fa-people-group"></i> Trabalho em Equipe</div>
          </div>
        </div>

        <!-- Campo de comentário (opcional para professor, obrigatório para estagiário) -->
        <div class="na-field">
          <label for="na-comentario" id="na-comentario-label">Comentário</label>
          <textarea id="na-comentario" rows="3" placeholder="Descreva sua avaliação..."></textarea>
        </div>

        <div class="na-etapa-footer">
          <button class="na-btn-cancelar" onclick="_naRenderEtapa1()">
            <i class="fa-solid fa-arrow-left"></i> Voltar
          </button>
          <button class="na-btn-salvar" onclick="_naSalvar()">
            <i class="fa-solid fa-paper-plane"></i> Enviar Avaliação
          </button>
        </div>

      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Fecha o modal ao pressionar ESC
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.getElementById('na-modal').classList.contains('open')) {
      fecharNovaAvaliacao();
    }
  });
}

// ============================================================
// BOTÃO FLUTUANTE (FAB) — Aparece em páginas de avaliação
// ============================================================

/**
 * Cria e insere o botão flutuante "Nova Avaliação" no canto inferior direito.
 * Exibido nas páginas de avaliação.
 */
function _naInjetarFab() {
  if (document.getElementById('na-fab')) return;

  // Verifica se está em uma das páginas de avaliação
  const path = window.location.pathname;
  const paginasPermitidas = ['avaliacoes.html', 'avaliar-professor.html', 'avaliar-estagiario.html'];
  if (!paginasPermitidas.some(p => path.includes(p))) return;

  const fab       = document.createElement('button');
  fab.id          = 'na-fab';
  fab.className   = 'na-fab';
  fab.title       = 'Nova Avaliação';
  fab.innerHTML   = '<i class="fa-solid fa-plus"></i><span>Nova Avaliação</span>';
  fab.setAttribute('onclick', 'abrirNovaAvaliacao()');
  document.body.appendChild(fab);
}

// ============================================================
// INIT — Injeta modal e FAB ao carregar a página
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  _naInjetarModal();
  _naInjetarFab();
});
