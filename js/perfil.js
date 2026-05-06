// ====================================================================
// perfil.js — Perfil do Usuário
// Gerencia o fluxo de login/logout, exibição e edição do perfil,
// troca de foto, visualização de avaliações recebidas e alternância
// entre as abas de dados e avaliações.
// ====================================================================

// Mapeamento de chaves de critério para rótulos legíveis
const CRITERIOS_LABEL = {
  pontualidade: 'Pontualidade',
  comunicacao:  'Comunicação',
  tecnico:      'Desempenho Técnico',
  proatividade: 'Proatividade',
  equipe:       'Trabalho em Equipe',
};

// ====================================================================
// STORAGE — Sessão do usuário logado
// ====================================================================

/** Retorna os dados da sessão ativa (apenas o ID do usuário). */
function getPerfil() {
  return JSON.parse(localStorage.getItem('perfilLogado') || 'null');
}

/** Persiste os dados da sessão no localStorage. */
function savePerfil(dados) {
  localStorage.setItem('perfilLogado', JSON.stringify(dados));
}

/** Remove a sessão ativa do localStorage (logout). */
function clearPerfil() {
  localStorage.removeItem('perfilLogado');
}

// ====================================================================
// LOGIN
// ====================================================================

/**
 * Valida os campos de login, busca o usuário pelo e-mail e verifica a senha.
 * Suporta senhas antigas (texto puro) e novas (hash btoa com salt).
 * Em caso de sucesso, salva a sessão e exibe o perfil.
 */
function entrar() {
  const emailInput = document.getElementById('login-email');
  const senhaInput = document.getElementById('login-senha');
  const email = emailInput?.value.trim().toLowerCase();
  const senha = senhaInput?.value.trim();

  let valido = true;

  if (!email) {
    setFieldError('login-email', 'Digite seu e-mail acadêmico.');
    valido = false;
  } else if (!REGEX_EMAIL_ACADEMICO.test(email)) {
    setFieldError('login-email', 'Use um e-mail acadêmico institucional (ex: nome@universidade.edu.br).');
    valido = false;
  } else {
    clearFieldError('login-email');
  }

  if (!senha) {
    setFieldError('login-senha', 'Digite sua senha.');
    valido = false;
  } else {
    clearFieldError('login-senha');
  }

  if (!valido) {
    const primeiro = document.querySelector('#tela-login .field-error');
    if (primeiro) { primeiro.classList.add('field-shake'); primeiro.focus(); setTimeout(() => primeiro.classList.remove('field-shake'), 400); }
    return;
  }

  // Busca o usuário pelo e-mail nos contatos cadastrados
  const contatos = getContatos();
  const pessoa = contatos.find(c => c.email.toLowerCase() === email);

  if (!pessoa) {
    setFieldError('login-email', 'E-mail não encontrado. Verifique ou peça para ser cadastrado.');
    document.getElementById('login-email').focus();
    return;
  }

  // Verifica a senha: compatível com hash btoa (novo) e texto puro (legado)
  if (pessoa.senha) {
    const senhaHash = btoa(senha + 'portal_estagio_salt');
    const senhaValida = (pessoa.senha === senhaHash) || (pessoa.senha === senha);
    if (!senhaValida) {
      setFieldError('login-senha', 'Senha incorreta. Tente novamente.');
      document.getElementById('login-senha').focus();
      return;
    }
  }

  // Login bem-sucedido: salva sessão e exibe o perfil
  clearFieldError('login-email');
  clearFieldError('login-senha');
  savePerfil({ id: pessoa.id });
  mostrarPerfil(pessoa);
}

// ====================================================================
// LOGOUT
// ====================================================================

/**
 * Encerra a sessão do usuário, limpa os campos e exibe a tela de login.
 */
function sair() {
  clearPerfil();
  document.getElementById('tela-perfil').style.display = 'none';
  document.getElementById('tela-login').style.display = 'block';
  document.getElementById('login-email').value = '';
  const senhaEl = document.getElementById('login-senha');
  if (senhaEl) senhaEl.value = '';
  clearAllErrors('tela-login');
}

// ====================================================================
// EXIBIÇÃO DO PERFIL
// ====================================================================

/**
 * Preenche e exibe a tela de perfil com os dados do usuário logado.
 * Atualiza foto, nome, tipo, campos de edição, stats e avaliações.
 * @param {object} pessoa - Objeto do contato logado
 */
function mostrarPerfil(pessoa) {
  document.getElementById('tela-login').style.display = 'none';
  document.getElementById('tela-perfil').style.display = 'flex';

  // Exibe foto ou iniciais no avatar
  const fotoEl = document.getElementById('pf-foto-preview');
  const iniciaisEl = document.getElementById('pf-foto-iniciais');
  const iniciais = pessoa.nome.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();

  if (pessoa.foto) {
    iniciaisEl.style.display = 'none';
    fotoEl.querySelectorAll('img').forEach(el => el.remove()); // Remove foto anterior
    const img = document.createElement('img');
    img.src = pessoa.foto;
    img.alt = pessoa.nome;
    fotoEl.insertBefore(img, fotoEl.querySelector('.pf-foto-overlay'));
  } else {
    iniciaisEl.textContent = iniciais;
  }

  // Nome e badge de tipo
  document.getElementById('pf-nome-display').textContent = pessoa.nome;
  const badge = document.getElementById('pf-tipo-badge');
  const tipoTexto = pessoa.tipo === 'admin' ? 'Admin' : pessoa.tipo === 'professor' ? 'Gestor' : 'Estagiário';
  badge.textContent = tipoTexto;
  badge.className = `pg-badge pf-tipo-badge ${pessoa.tipo}`;

  // Preenche os campos de edição
  document.getElementById('pf-nome').value = pessoa.nome;
  document.getElementById('pf-email').value = pessoa.email;

  // Campo de disciplina: visível apenas para professores
  const campoDis = document.getElementById('pf-campo-disciplina');
  if (campoDis) campoDis.style.display = pessoa.tipo === 'professor' ? 'block' : 'none';
  if (pessoa.tipo === 'professor') {
    const disc = document.getElementById('pf-disciplina');
    if (disc) disc.value = pessoa.disciplina || '';
  }

  // Campo de RA: visível para todos os tipos
  const campoRaPerfil = document.getElementById('pf-campo-ra');
  if (campoRaPerfil) {
    campoRaPerfil.style.display = 'block';
    const raInput = document.getElementById('pf-ra');
    if (raInput) raInput.value = pessoa.ra || '';
  }

  document.getElementById('pf-bio').value = pessoa.bio || '';

  renderStats(pessoa);
  renderAvaliacoesPerfil(pessoa);

  // Seção de dados extras: visível apenas para professores
  const dadosSection = document.getElementById('pf-dados-section');
  if (dadosSection) {
    dadosSection.style.display = pessoa.tipo === 'professor' ? 'block' : 'none';
  }
}

// ====================================================================
// ESTATÍSTICAS DO PERFIL
// ====================================================================

/**
 * Renderiza os cards de estatísticas do perfil: total de avaliações recebidas,
 * média geral e tipo do usuário.
 * @param {object} pessoa - Objeto do contato logado
 */
function renderStats(pessoa) {
  const container = document.getElementById('pf-stats');
  if (!container) return;

  // Filtra avaliações onde o nome do avaliado corresponde ao usuário logado
  const avaliacoes = getAvaliacoes().filter(a =>
    a.avaliado.toLowerCase() === pessoa.nome.toLowerCase()
  );

  const total = avaliacoes.length;
  const media = total > 0
    ? (avaliacoes.reduce((s, a) => s + a.media, 0) / total).toFixed(1)
    : null;

  container.innerHTML = `
    <div class="pf-stat">
      <span class="pf-stat-label">Avaliações recebidas</span>
      <span class="pf-stat-valor">${total}</span>
    </div>
    <div class="pf-stat">
      <span class="pf-stat-label">Média geral</span>
      <span class="pf-stat-valor ${media ? 'stars' : ''}">${media ? media + ' ★' : '—'}</span>
    </div>
    <div class="pf-stat">
      <span class="pf-stat-label">Tipo</span>
      <span class="pf-stat-valor">${pessoa.tipo === 'admin' ? 'Admin' : pessoa.tipo === 'professor' ? 'Gestor' : 'Estagiário'}</span>
    </div>
  `;
}

// ====================================================================
// AVALIAÇÕES RECEBIDAS
// ====================================================================

/**
 * Renderiza o histórico de avaliações recebidas pelo usuário logado.
 * Também dispara a renderização do gráfico radar se disponível.
 * @param {object} pessoa - Objeto do contato logado
 */
function renderAvaliacoesPerfil(pessoa) {
  const container = document.getElementById('pf-avaliacoes-lista');
  if (!container) return;

  // Renderiza o gráfico radar de competências se a função estiver disponível
  if (typeof renderGraficoRadar === 'function') {
    renderGraficoRadar(pessoa);
  }

  // Filtra avaliações recebidas por esta pessoa (comparação case-insensitive)
  const avaliacoes = getAvaliacoes()
    .filter(a => a.avaliado.toLowerCase() === pessoa.nome.toLowerCase())
    .reverse(); // Mais recentes primeiro

  if (avaliacoes.length === 0) {
    container.innerHTML = '<p class="pg-empty">Nenhuma avaliação recebida ainda.</p>';
    return;
  }

  container.innerHTML = avaliacoes.map(a => {
    // Gera badges para cada critério com nota > 0
    const badges = Object.entries(a.criterios || {})
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `
        <span class="pf-av-badge">
          ${CRITERIOS_LABEL[k] || k}
          <span class="mini-stars">${'★'.repeat(v)}</span>
        </span>
      `).join('');

    return `
      <div class="pf-av-item">
        <div class="pf-av-header">
          <span class="pf-av-media">Média: ${a.media} ★</span>
          <span class="pf-av-data">${a.data}</span>
        </div>
        <div class="pf-av-criterios">${badges}</div>
        ${a.comentario ? `<p class="pf-av-comentario">"${a.comentario}"</p>` : ''}
      </div>
    `;
  }).join('');
}

// ====================================================================
// FOTO DO PERFIL
// ====================================================================

/**
 * Lê o arquivo de imagem selecionado, atualiza o avatar visualmente
 * e salva a nova foto no contato correspondente.
 * @param {HTMLInputElement} input - Input de arquivo de imagem
 */
function trocarFoto(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const novaFoto = e.target.result;

    // Atualiza o avatar na tela
    const fotoEl = document.getElementById('pf-foto-preview');
    document.getElementById('pf-foto-iniciais').style.display = 'none';
    fotoEl.querySelectorAll('img').forEach(el => el.remove());
    const img = document.createElement('img');
    img.src = novaFoto;
    img.alt = 'Foto';
    fotoEl.insertBefore(img, fotoEl.querySelector('.pf-foto-overlay'));

    // Persiste a nova foto no contato
    const sessao = getPerfil();
    if (!sessao) return;
    const contatos = getContatos();
    const idx = contatos.findIndex(c => c.id === sessao.id);
    if (idx !== -1) {
      contatos[idx].foto = novaFoto;
      saveContatos(contatos);
      showToast('Foto atualizada!');
    }
  };
  reader.readAsDataURL(file);
}

// ====================================================================
// SALVAR PERFIL
// ====================================================================

/**
 * Valida e salva as alterações de nome, senha, RA, disciplina e bio do usuário.
 * A senha só é atualizada se um novo valor for fornecido (mínimo 6 caracteres).
 * A senha é armazenada com hash btoa + salt.
 */
function salvarPerfil() {
  const sessao = getPerfil();
  if (!sessao) return;

  const nome = document.getElementById('pf-nome')?.value.trim();
  const novaSenha = document.getElementById('pf-senha')?.value.trim();

  let valido = true;

  if (!nome) {
    setFieldError('pf-nome', 'O nome não pode ficar vazio.');
    valido = false;
  } else {
    clearFieldError('pf-nome');
  }

  if (novaSenha && novaSenha.length < 6) {
    setFieldError('pf-senha', 'A senha deve ter pelo menos 6 caracteres.');
    valido = false;
  } else {
    clearFieldError('pf-senha');
  }

  if (!valido) {
    const primeiro = document.querySelector('#tab-dados .field-error');
    if (primeiro) { primeiro.classList.add('field-shake'); primeiro.focus(); setTimeout(() => primeiro.classList.remove('field-shake'), 400); }
    return;
  }

  const contatos = getContatos();
  const idx = contatos.findIndex(c => c.id === sessao.id);
  if (idx === -1) return;

  const pessoa = contatos[idx];
  // Gera novo hash apenas se uma nova senha foi fornecida; caso contrário, mantém a atual
  const senhaFinal = novaSenha ? btoa(novaSenha + 'portal_estagio_salt') : pessoa.senha;

  contatos[idx] = {
    ...pessoa,
    nome,
    senha: senhaFinal,
    ra: document.getElementById('pf-ra')?.value.trim() || pessoa.ra || '',
    disciplina: pessoa.tipo === 'professor'
      ? (document.getElementById('pf-disciplina')?.value.trim() || '')
      : pessoa.disciplina,
    bio: document.getElementById('pf-bio')?.value.trim() || '',
  };

  saveContatos(contatos);
  document.getElementById('pf-nome-display').textContent = nome;
  showToast('Perfil salvo com sucesso!');
}

// ====================================================================
// ABAS — Dados e Avaliações
// ====================================================================

/**
 * Alterna entre as abas "Dados" e "Avaliações" do perfil.
 * @param {string} tab - 'dados' ou 'avaliacoes'
 */
function setTab(tab) {
  document.querySelectorAll('.pf-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.getElementById('tab-dados').style.display = tab === 'dados' ? 'block' : 'none';
  document.getElementById('tab-avaliacoes').style.display = tab === 'avaliacoes' ? 'block' : 'none';
}

// ====================================================================
// INICIALIZAÇÃO
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Validação em tempo real nos campos do login
  addLiveValidation('login-email', v => !v.trim() || REGEX_EMAIL_ACADEMICO.test(v.trim()), 'Use um e-mail acadêmico institucional.');
  addLiveValidation('login-senha', v => v.trim().length > 0, 'A senha é obrigatória.');

  // Validação em tempo real nos campos de edição do perfil
  addLiveValidation('pf-nome',  v => v.trim().length > 0, 'O nome não pode ficar vazio.');
  addLiveValidation('pf-senha', v => !v.trim() || v.trim().length >= 6, 'A senha deve ter pelo menos 6 caracteres.');

  const sessao = getPerfil();
  if (sessao) {
    // Sessão ativa: tenta carregar o perfil do usuário
    const contatos = getContatos();
    const pessoa = contatos.find(c => c.id === sessao.id);
    if (pessoa) {
      mostrarPerfil(pessoa);
      return;
    }
    // Sessão inválida (usuário removido): limpa e exibe login
    clearPerfil();
  }
  // Sem sessão: exibe a tela de login
  document.getElementById('tela-login').style.display = 'block';
});
