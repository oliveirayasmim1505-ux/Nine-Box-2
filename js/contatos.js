// ====================================================================
// contatos.js — Agenda de Contatos Externos
// Gerencia o CRUD completo de contatos (empresas, parceiros, fornecedores),
// com visualização em grid ou lista, filtros por categoria, busca textual
// e modais de criação, edição, visualização e exclusão.
// ====================================================================

// Categorias disponíveis com suas cores e rótulos
const CATEGORIAS = {
  empresa:    { label: 'Empresa',    cor: '#3b82f6', bg: '#dbeafe' },
  parceiro:   { label: 'Parceiro',   cor: '#059669', bg: '#d1fae5' },
  fornecedor: { label: 'Fornecedor', cor: '#d97706', bg: '#fef3c7' },
  outro:      { label: 'Outro',      cor: '#7c3aed', bg: '#ede9fe' },
};

let filtroAtual = 'todos';       // Categoria ativa no filtro
let viewAtual = 'grid';          // Modo de exibição: 'grid' ou 'list'
let idEditando = null;           // ID do contato sendo editado (null = novo)
let idExcluindo = null;          // ID do contato aguardando confirmação de exclusão
let idVendo = null;              // ID do contato aberto no modal de detalhes
let fotoBase64Contato = null;    // Foto do contato em base64 (upload)

// ====================================================================
// STORAGE — Persistência no localStorage
// ====================================================================

/** Retorna todos os contatos da agenda. */
function getContatosAgenda() {
  return JSON.parse(localStorage.getItem('contatosAgenda') || '[]');
}

/** Persiste a lista de contatos no localStorage. */
function saveContatosAgenda(lista) {
  localStorage.setItem('contatosAgenda', JSON.stringify(lista));
}

// ====================================================================
// INICIALIZAÇÃO
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
  renderStats();
  renderLista();
});

// ====================================================================
// ESTATÍSTICAS — Contagem por categoria
// ====================================================================

/**
 * Renderiza os cards de estatísticas (total e contagem por categoria)
 * no topo da página. Oculta o container se não houver contatos.
 */
function renderStats() {
  const lista = getContatosAgenda();
  const container = document.getElementById('ct-stats');
  if (!container) return;

  const total = lista.length;

  // Inicializa contadores zerados para cada categoria
  const porCategoria = {};
  Object.keys(CATEGORIAS).forEach(k => porCategoria[k] = 0);
  lista.forEach(c => { if (porCategoria[c.categoria] !== undefined) porCategoria[c.categoria]++; });

  if (total === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <div class="ct-stat">
      <i class="fa-solid fa-address-book"></i>
      <div><span class="ct-stat-val">${total}</span><span class="ct-stat-label">Total</span></div>
    </div>
    ${Object.entries(CATEGORIAS).map(([k, v]) => porCategoria[k] > 0 ? `
    <div class="ct-stat">
      <i class="fa-solid fa-tag" style="color:${v.cor}"></i>
      <div><span class="ct-stat-val">${porCategoria[k]}</span><span class="ct-stat-label">${v.label}</span></div>
    </div>` : '').join('')}
  `;
}

// ====================================================================
// FILTRO E BUSCA
// ====================================================================

/**
 * Aplica um filtro por categoria e re-renderiza a lista.
 * @param {string} filtro - Chave da categoria ou 'todos'
 */
function filtrarContatos(filtro) {
  if (filtro !== undefined) {
    filtroAtual = filtro;
    // Atualiza o estado visual dos botões de filtro
    document.querySelectorAll('.pg-filtro').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filtro === filtro);
    });
  }
  renderLista();
}

/**
 * Alterna entre os modos de visualização grid e lista.
 * @param {string} view - 'grid' ou 'list'
 */
function setView(view) {
  viewAtual = view;
  document.getElementById('btn-view-grid').classList.toggle('active', view === 'grid');
  document.getElementById('btn-view-list').classList.toggle('active', view === 'list');
  const container = document.getElementById('ct-container');
  container.className = view === 'grid' ? 'ct-grid' : 'ct-list';
  renderLista();
}

// ====================================================================
// RENDERIZAR LISTA
// ====================================================================

/**
 * Renderiza os contatos filtrados e buscados no container principal.
 * Aplica filtro de categoria, busca textual e delega para o template correto
 * conforme o modo de visualização (grid ou lista).
 */
function renderLista() {
  const container = document.getElementById('ct-container');
  if (!container) return;

  let lista = getContatosAgenda();
  const busca = document.getElementById('ct-busca')?.value.trim().toLowerCase() || '';

  // Filtra por categoria selecionada
  if (filtroAtual !== 'todos') {
    lista = lista.filter(c => c.categoria === filtroAtual);
  }

  // Filtra por texto de busca (nome, empresa, e-mail ou cargo)
  if (busca) {
    lista = lista.filter(c =>
      c.nome.toLowerCase().includes(busca) ||
      (c.empresa || '').toLowerCase().includes(busca) ||
      (c.email || '').toLowerCase().includes(busca) ||
      (c.cargo || '').toLowerCase().includes(busca)
    );
  }

  if (lista.length === 0) {
    container.innerHTML = `
      <div class="ct-empty">
        <i class="fa-solid fa-address-book"></i>
        <p>${busca || filtroAtual !== 'todos' ? 'Nenhum contato encontrado.' : 'Nenhum contato cadastrado ainda.'}</p>
        ${!busca && filtroAtual === 'todos' ? `<button class="ct-btn-novo" onclick="abrirModal()"><i class="fa-solid fa-plus"></i> Criar primeiro contato</button>` : ''}
      </div>`;
    return;
  }

  if (viewAtual === 'grid') {
    container.innerHTML = lista.map(c => renderCardGrid(c)).join('');
  } else {
    container.innerHTML = lista.map(c => renderCardList(c)).join('');
  }
}

function renderCardGrid(c) {
  const cat = CATEGORIAS[c.categoria] || CATEGORIAS.outro;
  // Gera iniciais a partir das duas primeiras palavras do nome
  const iniciais = c.nome.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
  const avatar = c.foto
    ? `<img src="${c.foto}" alt="${c.nome}">`
    : `<span>${iniciais}</span>`;

  return `
    <div class="ct-card" onclick="verContato(${c.id})">
      <div class="ct-card-actions">
        <button class="ct-action-btn" onclick="event.stopPropagation(); editarContato(${c.id})" title="Editar">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="ct-action-btn ct-action-danger" onclick="event.stopPropagation(); pedirExclusao(${c.id})" title="Excluir">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
      <div class="ct-card-avatar" style="background:${c.foto ? 'transparent' : `linear-gradient(135deg, ${cat.cor}, ${cat.cor}cc)`}">
        ${avatar}
      </div>
      <div class="ct-card-nome">${c.nome}</div>
      ${c.cargo ? `<div class="ct-card-cargo">${c.cargo}</div>` : ''}
      ${c.empresa ? `<div class="ct-card-empresa"><i class="fa-solid fa-building"></i> ${c.empresa}</div>` : ''}
      <span class="ct-badge" style="background:${cat.bg};color:${cat.cor}">${cat.label}</span>
      <div class="ct-card-contatos">
        ${c.email ? `<a href="mailto:${c.email}" onclick="event.stopPropagation()" title="${c.email}"><i class="fa-solid fa-envelope"></i></a>` : ''}
        ${c.telefone ? `<a href="tel:${c.telefone}" onclick="event.stopPropagation()" title="${c.telefone}"><i class="fa-solid fa-phone"></i></a>` : ''}
        ${c.site ? `<a href="${c.site}" target="_blank" onclick="event.stopPropagation()" title="${c.site}"><i class="fa-solid fa-globe"></i></a>` : ''}
      </div>
    </div>`;
}

function renderCardList(c) {
  const cat = CATEGORIAS[c.categoria] || CATEGORIAS.outro;
  const iniciais = c.nome.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
  const avatar = c.foto
    ? `<img src="${c.foto}" alt="${c.nome}">`
    : iniciais;

  return `
    <div class="ct-list-item" onclick="verContato(${c.id})">
      <div class="ct-list-avatar" style="background:${c.foto ? 'transparent' : `linear-gradient(135deg, ${cat.cor}, ${cat.cor}cc)`}">
        ${c.foto ? `<img src="${c.foto}" alt="${c.nome}">` : iniciais}
      </div>
      <div class="ct-list-info">
        <div class="ct-list-nome">${c.nome}</div>
        <div class="ct-list-sub">
          ${c.cargo ? `<span>${c.cargo}</span>` : ''}
          ${c.cargo && c.empresa ? '<span class="ct-sep">·</span>' : ''}
          ${c.empresa ? `<span>${c.empresa}</span>` : ''}
        </div>
      </div>
      <div class="ct-list-meta">
        ${c.email ? `<span class="ct-list-contact"><i class="fa-solid fa-envelope"></i> ${c.email}</span>` : ''}
        ${c.telefone ? `<span class="ct-list-contact"><i class="fa-solid fa-phone"></i> ${c.telefone}</span>` : ''}
      </div>
      <span class="ct-badge" style="background:${cat.bg};color:${cat.cor}">${cat.label}</span>
      <div class="ct-list-actions">
        <button class="ct-action-btn" onclick="event.stopPropagation(); editarContato(${c.id})" title="Editar">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="ct-action-btn ct-action-danger" onclick="event.stopPropagation(); pedirExclusao(${c.id})" title="Excluir">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>`;
}

// ====================================================================
// MODAL CRIAR / EDITAR
// ====================================================================

/**
 * Abre o modal de criação ou edição de contato.
 * Limpa todos os campos e, se um ID for fornecido, preenche com os dados existentes.
 * Configura validação em tempo real nos campos de e-mail e site.
 * @param {number|null} id - ID do contato a editar, ou undefined/null para novo
 */
function abrirModal(id) {
  idEditando = id || null;
  fotoBase64Contato = null;

  const modal = document.getElementById('ct-modal');
  const titulo = document.getElementById('ct-modal-titulo');
  const btnTexto = document.getElementById('ct-btn-texto');

  // Limpa todos os campos de texto do formulário
  ['ct-nome','ct-cargo','ct-empresa','ct-email','ct-telefone','ct-cidade','ct-site','ct-obs'].forEach(f => {
    const el = document.getElementById(f);
    if (el) el.value = '';
  });
  document.getElementById('ct-categoria').value = 'empresa';
  document.getElementById('ct-estado').value = '';

  // Reseta o preview de foto para o ícone padrão
  const preview = document.getElementById('ct-foto-preview');
  preview.innerHTML = `<i class="fa-solid fa-camera" id="ct-foto-icon"></i><div class="ct-foto-overlay"><i class="fa-solid fa-camera"></i></div>`;

  if (id) {
    titulo.textContent = 'Editar Contato';
    btnTexto.textContent = 'Salvar Alterações';
    const lista = getContatosAgenda();
    const c = lista.find(x => x.id === id);
    if (c) {
      document.getElementById('ct-nome').value = c.nome || '';
      document.getElementById('ct-categoria').value = c.categoria || 'empresa';
      document.getElementById('ct-cargo').value = c.cargo || '';
      document.getElementById('ct-empresa').value = c.empresa || '';
      document.getElementById('ct-email').value = c.email || '';
      document.getElementById('ct-telefone').value = c.telefone || '';
      document.getElementById('ct-cidade').value = c.cidade || '';
      document.getElementById('ct-estado').value = c.estado || '';
      document.getElementById('ct-site').value = c.site || '';
      document.getElementById('ct-obs').value = c.obs || '';
      if (c.foto) {
        fotoBase64Contato = c.foto;
        preview.innerHTML = `<img src="${c.foto}" alt="${c.nome}"><div class="ct-foto-overlay"><i class="fa-solid fa-camera"></i></div>`;
      }
    }
  } else {
    titulo.textContent = 'Novo Contato';
    btnTexto.textContent = 'Criar Contato';
  }

  modal.classList.add('open');
  document.getElementById('ct-nome').focus();

  // Validação em tempo real: nome obrigatório, e-mail e URL opcionais mas com formato
  addLiveValidation('ct-nome',  v => v.trim().length > 0,          'O nome é obrigatório.');
  addLiveValidation('ct-email', v => !v.trim() || REGEX_EMAIL_SIMPLES.test(v.trim()), 'Digite um e-mail válido.');
  addLiveValidation('ct-site',  v => !v.trim() || /^https?:\/\/.+/.test(v.trim()), 'A URL deve começar com http:// ou https://');
}

/** Fecha o modal de criação/edição e limpa erros de validação. */
function fecharModal() {
  document.getElementById('ct-modal').classList.remove('open');
  clearAllErrors('ct-modal');
  idEditando = null;
  fotoBase64Contato = null;
}

/**
 * Fecha o modal ao clicar no overlay (fora do conteúdo).
 * @param {MouseEvent} e
 */
function fecharModalClick(e) {
  if (e.target === document.getElementById('ct-modal')) fecharModal();
}

/**
 * Lê o arquivo de imagem selecionado e atualiza o preview de foto do contato.
 * @param {HTMLInputElement} input - Input de arquivo
 */
function previewFotoContato(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    fotoBase64Contato = e.target.result;
    const preview = document.getElementById('ct-foto-preview');
    preview.innerHTML = `<img src="${fotoBase64Contato}" alt="foto"><div class="ct-foto-overlay"><i class="fa-solid fa-camera"></i></div>`;
  };
  reader.readAsDataURL(file);
}

/**
 * Aplica máscara de telefone brasileiro ao campo enquanto o usuário digita.
 * Suporta formatos (XX) XXXX-XXXX e (XX) XXXXX-XXXX.
 * @param {HTMLInputElement} input
 */
function mascaraTelefone(input) {
  let v = input.value.replace(/\D/g, '').slice(0, 11); // Remove não-dígitos e limita a 11
  if (v.length > 10) {
    v = v.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  } else if (v.length > 6) {
    v = v.replace(/^(\d{2})(\d{4})(\d*)$/, '($1) $2-$3');
  } else if (v.length > 2) {
    v = v.replace(/^(\d{2})(\d*)$/, '($1) $2');
  }
  input.value = v;
}

/**
 * Valida os campos do formulário e salva (cria ou atualiza) o contato.
 * Campos obrigatórios: nome. E-mail e site são opcionais mas validados se preenchidos.
 */
function salvarContato() {
  const nomeEl  = document.getElementById('ct-nome');
  const emailEl = document.getElementById('ct-email');
  const siteEl  = document.getElementById('ct-site');
  const nome  = nomeEl.value.trim();
  const email = emailEl.value.trim();
  const site  = siteEl.value.trim();

  let valido = true;

  // Nome é obrigatório
  if (!nome) {
    setFieldError('ct-nome', 'O nome é obrigatório.');
    valido = false;
  } else {
    clearFieldError('ct-nome');
  }

  // E-mail: formato simples (campo opcional)
  if (email && !REGEX_EMAIL_SIMPLES.test(email)) {
    setFieldError('ct-email', 'Digite um e-mail válido (ex: contato@empresa.com).');
    valido = false;
  } else {
    clearFieldError('ct-email');
  }

  // Site: URL básica com protocolo (campo opcional)
  if (site && !/^https?:\/\/.+/.test(site)) {
    setFieldError('ct-site', 'A URL deve começar com http:// ou https://');
    valido = false;
  } else {
    clearFieldError('ct-site');
  }

  if (!valido) {
    // Foca e anima o primeiro campo com erro
    const primeiro = document.querySelector('#ct-modal .field-error');
    if (primeiro) { primeiro.classList.add('field-shake'); primeiro.focus(); setTimeout(() => primeiro.classList.remove('field-shake'), 400); }
    return;
  }

  const lista = getContatosAgenda();

  const dados = {
    nome,
    categoria: document.getElementById('ct-categoria').value,
    cargo:     document.getElementById('ct-cargo').value.trim(),
    empresa:   document.getElementById('ct-empresa').value.trim(),
    email,
    telefone:  document.getElementById('ct-telefone').value.trim(),
    cidade:    document.getElementById('ct-cidade').value.trim(),
    estado:    document.getElementById('ct-estado').value,
    site,
    obs:       document.getElementById('ct-obs').value.trim(),
    foto:      fotoBase64Contato || null,
  };

  if (idEditando) {
    // Atualiza o contato existente preservando o ID e data de criação
    const idx = lista.findIndex(x => x.id === idEditando);
    if (idx !== -1) {
      lista[idx] = { ...lista[idx], ...dados };
      showToast('Contato atualizado!');
    }
  } else {
    lista.push({ id: Date.now(), criadoEm: new Date().toLocaleDateString('pt-BR'), ...dados });
    showToast('Contato criado!');
  }

  saveContatosAgenda(lista);
  fecharModal();
  renderStats();
  renderLista();
}

// ====================================================================
// MODAL VER DETALHES
// ====================================================================

/**
 * Abre o modal de visualização com todos os dados de um contato.
 * @param {number} id - ID do contato a exibir
 */
function verContato(id) {
  idVendo = id;
  const lista = getContatosAgenda();
  const c = lista.find(x => x.id === id);
  if (!c) return;

  const cat = CATEGORIAS[c.categoria] || CATEGORIAS.outro;
  const iniciais = c.nome.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();

  document.getElementById('ct-ver-body').innerHTML = `
    <div class="ct-ver-topo">
      <div class="ct-ver-avatar" style="background:${c.foto ? 'transparent' : `linear-gradient(135deg, ${cat.cor}, ${cat.cor}cc)`}">
        ${c.foto ? `<img src="${c.foto}" alt="${c.nome}">` : `<span>${iniciais}</span>`}
      </div>
      <div class="ct-ver-info">
        <h3>${c.nome}</h3>
        ${c.cargo ? `<p class="ct-ver-cargo">${c.cargo}</p>` : ''}
        <span class="ct-badge" style="background:${cat.bg};color:${cat.cor}">${cat.label}</span>
      </div>
    </div>
    <div class="ct-ver-detalhes">
      ${c.empresa ? `<div class="ct-ver-linha"><i class="fa-solid fa-building"></i><div><span class="ct-ver-label">Empresa</span><span>${c.empresa}</span></div></div>` : ''}
      ${c.email ? `<div class="ct-ver-linha"><i class="fa-solid fa-envelope"></i><div><span class="ct-ver-label">E-mail</span><a href="mailto:${c.email}">${c.email}</a></div></div>` : ''}
      ${c.telefone ? `<div class="ct-ver-linha"><i class="fa-solid fa-phone"></i><div><span class="ct-ver-label">Telefone</span><a href="tel:${c.telefone}">${c.telefone}</a></div></div>` : ''}
      ${(c.cidade || c.estado) ? `<div class="ct-ver-linha"><i class="fa-solid fa-location-dot"></i><div><span class="ct-ver-label">Localização</span><span>${[c.cidade, c.estado].filter(Boolean).join(' — ')}</span></div></div>` : ''}
      ${c.site ? `<div class="ct-ver-linha"><i class="fa-solid fa-globe"></i><div><span class="ct-ver-label">Site / LinkedIn</span><a href="${c.site}" target="_blank">${c.site}</a></div></div>` : ''}
      ${c.obs ? `<div class="ct-ver-linha ct-ver-obs"><i class="fa-solid fa-note-sticky"></i><div><span class="ct-ver-label">Observações</span><span>${c.obs}</span></div></div>` : ''}
      ${c.criadoEm ? `<div class="ct-ver-linha"><i class="fa-regular fa-calendar"></i><div><span class="ct-ver-label">Criado em</span><span>${c.criadoEm}</span></div></div>` : ''}
    </div>
  `;

  document.getElementById('ct-modal-ver').classList.add('open');
}

/** Fecha o modal de visualização de detalhes. */
function fecharModalVer() {
  document.getElementById('ct-modal-ver').classList.remove('open');
  idVendo = null;
}

/**
 * Fecha o modal de visualização ao clicar no overlay.
 * @param {MouseEvent} e
 */
function fecharModalVerClick(e) {
  if (e.target === document.getElementById('ct-modal-ver')) fecharModalVer();
}

/**
 * Fecha o modal de visualização e abre o modal de edição para o mesmo contato.
 * Usa setTimeout para garantir que o modal de visualização feche antes de abrir o de edição.
 */
function editarDoVer() {
  const id = idVendo;
  fecharModalVer();
  setTimeout(() => editarContato(id), 100); // Aguarda o modal fechar antes de abrir o próximo
}

// ====================================================================
// EDITAR
// ====================================================================

/**
 * Abre o modal de edição para o contato com o ID informado.
 * @param {number} id - ID do contato a editar
 */
function editarContato(id) {
  abrirModal(id);
}

// ====================================================================
// EXCLUIR
// ====================================================================

/**
 * Abre o modal de confirmação de exclusão para o contato informado.
 * @param {number} id - ID do contato a excluir
 */
function pedirExclusao(id) {
  idExcluindo = id;
  document.getElementById('ct-modal-excluir').classList.add('open');
}

/** Fecha o modal de confirmação de exclusão sem excluir. */
function fecharModalExcluir() {
  document.getElementById('ct-modal-excluir').classList.remove('open');
  idExcluindo = null;
}

/**
 * Fecha o modal de exclusão ao clicar no overlay.
 * @param {MouseEvent} e
 */
function fecharModalExcluirClick(e) {
  if (e.target === document.getElementById('ct-modal-excluir')) fecharModalExcluir();
}

/**
 * Confirma e executa a exclusão do contato pendente.
 * Atualiza as estatísticas e a lista após remover.
 */
function confirmarExclusao() {
  if (!idExcluindo) return;
  const lista = getContatosAgenda().filter(c => c.id !== idExcluindo);
  saveContatosAgenda(lista);
  fecharModalExcluir();
  renderStats();
  renderLista();
  showToast('Contato excluído.');
}
