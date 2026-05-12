// ============================================================
// PAGES.JS — Lógica das páginas: Cadastrar, Consultar, Relatórios
// ============================================================

// ============================================================
// CADASTRAR — Variáveis de estado
// ============================================================

let tipoCadAtual = 'estagiario'; // Tipo selecionado no formulário de cadastro
let fotoBase64 = null;           // Foto do usuário em base64 (preview + salvar)

// ============================================================
// CADASTRAR — Alternar tipo de usuário (Estagiário / Gestor / Admin)
// ============================================================

/**
 * Atualiza o tipo de usuário selecionado e exibe/oculta
 * os campos específicos de cada tipo (RA, Departamento).
 * @param {string} tipo - 'estagiario', 'professor' ou 'admin'
 */
function setTipoCad(tipo) {
  tipoCadAtual = tipo;

  // Atualiza visual dos botões de tipo
  document.querySelectorAll('.pg-type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tipo === tipo);
  });

  const campoRa = document.getElementById('campo-ra');
  const campoDisciplina = document.getElementById('campo-disciplina');

  // RA aparece para todos os tipos
  if (campoRa) campoRa.style.display = 'block';

  // Departamento/Área só aparece para gestor (professor)
  if (campoDisciplina) campoDisciplina.style.display = tipo === 'professor' ? 'block' : 'none';
}

// ============================================================
// CADASTRAR — Preview da foto antes de salvar
// ============================================================

/**
 * Lê o arquivo de imagem selecionado, converte para base64
 * e exibe o preview no círculo de foto.
 * @param {HTMLInputElement} input - Input file com a imagem
 */
function previewFoto(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    fotoBase64 = e.target.result;
    const preview = document.getElementById('foto-preview');
    if (!preview) return;

    // Substitui o ícone de câmera pela imagem selecionada
    preview.innerHTML = `
      <img src="${fotoBase64}" alt="Foto">
      <div class="pg-foto-overlay">
        <i class="fa-solid fa-camera"></i>
      </div>
    `;
  };
  reader.readAsDataURL(file);
}

// ============================================================
// CADASTRAR — Salvar novo usuário
// ============================================================

/**
 * Valida os campos do formulário de cadastro e salva o novo
 * usuário no localStorage com senha hasheada.
 */
function cadastrarPessoa() {
  const nome       = document.getElementById('cad-nome')?.value.trim();
  const email      = document.getElementById('cad-email')?.value.trim();
  const senha      = document.getElementById('cad-senha')?.value.trim();
  const disciplina = document.getElementById('cad-disciplina')?.value.trim();

  let valido = true;

  // Validação: nome obrigatório
  if (!nome) {
    setFieldError('cad-nome', 'O nome completo é obrigatório.');
    valido = false;
  } else {
    clearFieldError('cad-nome');
  }

  // Validação: e-mail acadêmico obrigatório e no formato correto
  if (!email) {
    setFieldError('cad-email', 'O e-mail acadêmico é obrigatório.');
    valido = false;
  } else if (!REGEX_EMAIL_ACADEMICO.test(email)) {
    setFieldError('cad-email', 'Use um e-mail acadêmico institucional (ex: nome@universidade.edu.br).');
    valido = false;
  } else {
    clearFieldError('cad-email');
  }

  // Validação: senha obrigatória com mínimo de 6 caracteres
  const senhaEl = document.getElementById('cad-senha');
  if (senhaEl) {
    if (!senha) {
      setFieldError('cad-senha', 'Crie uma senha para o usuário.');
      valido = false;
    } else if (senha.length < 6) {
      setFieldError('cad-senha', 'A senha deve ter pelo menos 6 caracteres.');
      valido = false;
    } else {
      clearFieldError('cad-senha');
    }
  }

  // Se algum campo inválido, foca no primeiro com erro e aplica animação
  if (!valido) {
    const primeiro = document.querySelector('.field-error');
    if (primeiro) {
      primeiro.classList.add('field-shake');
      primeiro.focus();
      setTimeout(() => primeiro.classList.remove('field-shake'), 400);
    }
    return;
  }

  // Verificar se o e-mail já está cadastrado
  const contatos = getContatos();
  if (contatos.find(c => c.email.toLowerCase() === email.toLowerCase())) {
    setFieldError('cad-email', 'Este e-mail já está cadastrado.');
    document.getElementById('cad-email').focus();
    return;
  }

  // Hash simples da senha: btoa(senha + salt)
  // Não é criptografia forte, mas protege contra leitura direta no localStorage
  const senhaHash = btoa(senha + 'portal_estagio_salt');

  // Monta o objeto do novo usuário
  contatos.push({
    id:         Date.now(),
    nome,
    email,
    senha:      senhaHash,
    tipo:       tipoCadAtual,
    ra:         document.getElementById('cad-ra')?.value.trim() || '',
    disciplina: tipoCadAtual === 'professor' ? disciplina : '',
    foto:       fotoBase64 || null,
  });
  saveContatos(contatos);

  // Faz login automático com o usuário recém-cadastrado
  const novoUsuario = contatos[contatos.length - 1];
  localStorage.setItem('perfilLogado', JSON.stringify({ id: novoUsuario.id }));

  // Limpa o formulário após cadastro bem-sucedido
  document.getElementById('cad-nome').value  = '';
  document.getElementById('cad-email').value = '';
  if (document.getElementById('cad-senha'))     document.getElementById('cad-senha').value = '';
  if (document.getElementById('cad-ra'))        document.getElementById('cad-ra').value = '';
  if (document.getElementById('cad-disciplina')) document.getElementById('cad-disciplina').value = '';

  // Reseta a foto
  fotoBase64 = null;
  const preview = document.getElementById('foto-preview');
  if (preview) preview.innerHTML = `<i class="fa-solid fa-camera"></i><span>Adicionar foto</span>`;
  document.getElementById('cad-foto').value = '';

  showToast(`${nome} cadastrado com sucesso! Você já está logado.`);

  // Redireciona para a home após 1.5s
  setTimeout(() => {
    const isInPages = window.location.pathname.includes('/pages/');
    window.location.href = isInPages ? '../index.html' : 'index.html';
  }, 1500);
}

// ============================================================
// CONSULTAR — Filtro e listagem de pessoas
// ============================================================

let filtroConsulta = 'todos'; // Filtro ativo: 'todos', 'estagiario' ou 'professor'

/**
 * Aplica o filtro de tipo e re-renderiza a lista de pessoas.
 * @param {string} tipo - 'todos', 'estagiario' ou 'professor'
 */
function filtrarPessoas(tipo) {
  if (tipo !== undefined) {
    filtroConsulta = tipo;
    document.querySelectorAll('.pg-filtro').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filtro === tipo);
    });
  }
  renderPessoas();
}

/**
 * Renderiza a lista de pessoas cadastradas com filtro e busca por nome.
 */
function renderPessoas() {
  const container = document.getElementById('lista-pessoas');
  if (!container) return;

  const busca    = (document.getElementById('busca')?.value || '').toLowerCase();
  let contatos   = getContatos();

  // Aplica filtro de tipo
  if (filtroConsulta !== 'todos') {
    contatos = contatos.filter(c => c.tipo === filtroConsulta);
  }

  // Aplica busca por nome
  if (busca) {
    contatos = contatos.filter(c => c.nome.toLowerCase().includes(busca));
  }

  if (contatos.length === 0) {
    container.innerHTML = '<p class="pg-empty">Nenhuma pessoa encontrada.</p>';
    return;
  }

  container.innerHTML = contatos.map(c => {
    // Gera iniciais para o avatar quando não há foto
    const iniciais = c.nome.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();

    // Subtítulo: mostra RA se disponível, senão departamento ou e-mail
    const sub = c.tipo === 'professor'
      ? (c.ra ? `RA: ${c.ra}` : c.disciplina ? c.disciplina : c.email)
      : (c.ra ? `RA: ${c.ra}` : c.email);

    const tipoLabel = c.tipo === 'admin' ? 'Admin' : c.tipo === 'professor' ? 'Gestor' : 'Estagiário';
    const avatarContent = c.foto ? `<img src="${c.foto}" alt="${c.nome}" loading="lazy">` : iniciais;

    return `
      <div class="pg-pessoa-item">
        <div class="pg-avatar">${avatarContent}</div>
        <div class="pg-pessoa-info">
          <div class="pg-pessoa-nome">${c.nome}</div>
          <div class="pg-pessoa-sub">${sub}</div>
        </div>
        <span class="pg-badge ${c.tipo}">${tipoLabel}</span>
        <button class="btn-danger" onclick="removerPessoa(${c.id})" title="Remover">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `;
  }).join('');
}

/**
 * Remove uma pessoa após confirmação do usuário.
 * @param {number} id - ID da pessoa a remover
 */
function removerPessoa(id) {
  if (!confirm('Tem certeza que deseja remover esta pessoa? Esta ação não pode ser desfeita.')) return;
  const contatos = getContatos().filter(c => c.id !== id);
  saveContatos(contatos);
  renderPessoas();
  showToast('Pessoa removida.');
}

// ============================================================
// RELATÓRIOS — Filtro, resumo e tabela
// ============================================================

let filtroRel = 'todos'; // Filtro ativo nos relatórios

/**
 * Aplica o filtro de tipo nos relatórios e re-renderiza.
 * @param {string} tipo - 'todos', 'professor' ou 'estagiario'
 */
function filtrarRel(tipo) {
  if (tipo !== undefined) {
    filtroRel = tipo;
    document.querySelectorAll('.pg-filtro').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filtro === tipo);
    });
  }
  renderRelatorio();
}

/** Renderiza o resumo e a tabela de relatórios */
function renderRelatorio() {
  renderResumo();
  renderTabela();
}

/**
 * Renderiza os cards de resumo com totais de avaliações,
 * médias, Nine Box e avaliações 180°.
 */
function renderResumo() {
  const container = document.getElementById('rel-resumo');
  if (!container) return;

  const avaliacoes    = getAvaliacoes();
  const nineBox       = (() => { try { return JSON.parse(localStorage.getItem('nineBoxAvaliacoes') || '[]'); } catch(e) { return []; } })();
  const avaliacoes180 = (() => { try { return JSON.parse(localStorage.getItem('avaliacoes180')     || '[]'); } catch(e) { return []; } })();
  const respostas180  = (() => { try { return JSON.parse(localStorage.getItem('respostas180')      || '[]'); } catch(e) { return []; } })();

  const totalProf = avaliacoes.filter(a => a.tipo === 'professor').length;
  const totalEst  = avaliacoes.filter(a => a.tipo === 'estagiario').length;
  const total     = totalProf + totalEst;

  // Calcula média geral apenas das avaliações com nota
  const medias     = avaliacoes.map(a => a.media).filter(Boolean);
  const mediaGeral = medias.length
    ? (medias.reduce((a, b) => a + b, 0) / medias.length).toFixed(1)
    : '—';

  const superstars = nineBox.filter(n => n.categoria === 'Superstar').length;

  container.innerHTML = `
    <div class="rel-stat">
      <span class="rel-stat-label">Total de Avaliações</span>
      <span class="rel-stat-valor">${total}</span>
    </div>
    <div class="rel-stat">
      <span class="rel-stat-label">Professores Avaliados</span>
      <span class="rel-stat-valor">${totalProf}</span>
    </div>
    <div class="rel-stat">
      <span class="rel-stat-label">Estagiários Avaliados</span>
      <span class="rel-stat-valor">${totalEst}</span>
    </div>
    <div class="rel-stat">
      <span class="rel-stat-label">Média Geral</span>
      <span class="rel-stat-valor">${mediaGeral}${medias.length ? ' ★' : ''}</span>
    </div>
    <div class="rel-stat">
      <span class="rel-stat-label">No Nine Box</span>
      <span class="rel-stat-valor">${nineBox.length}</span>
    </div>
    <div class="rel-stat">
      <span class="rel-stat-label">Superstars</span>
      <span class="rel-stat-valor">${superstars}</span>
    </div>
    <div class="rel-stat">
      <span class="rel-stat-label">Avaliações 180°</span>
      <span class="rel-stat-valor">${avaliacoes180.length}</span>
    </div>
    <div class="rel-stat">
      <span class="rel-stat-label">Respostas 180°</span>
      <span class="rel-stat-valor">${respostas180.length}</span>
    </div>
  `;
}

/**
 * Renderiza a tabela de avaliações com filtro e busca por nome.
 * Também chama renderTabela180 para exibir respostas 180°.
 */
function renderTabela() {
  const tbody = document.getElementById('rel-tbody');
  if (!tbody) return;

  const busca      = (document.getElementById('busca-rel')?.value || '').toLowerCase();
  let avaliacoes   = getAvaliacoes().slice().reverse(); // Mais recentes primeiro

  if (filtroRel !== 'todos') {
    avaliacoes = avaliacoes.filter(a => a.tipo === filtroRel);
  }
  if (busca) {
    avaliacoes = avaliacoes.filter(a => a.avaliado.toLowerCase().includes(busca));
  }

  if (avaliacoes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="pg-empty">Nenhuma avaliação encontrada.</td></tr>';
  } else {
    // Função auxiliar para renderizar estrelas preenchidas/vazias
    const estrelas = n => n > 0
      ? `<span class="rel-estrelas">${'★'.repeat(n)}${'☆'.repeat(5 - n)}</span>`
      : '<span style="color:#ccc">—</span>';

    tbody.innerHTML = avaliacoes.map(a => {
      const c         = a.criterios || {};
      const tipoLabel = a.tipo === 'professor' ? 'Gestor' : 'Estagiário';

      // Avaliação de estagiário: exibe apenas o comentário
      if (a.tipoAvaliacao === 'comentario') {
        return `
          <tr>
            <td><strong>${a.avaliado}</strong></td>
            <td><span class="pg-badge ${a.tipo}">${tipoLabel}</span></td>
            <td colspan="3" style="color:var(--text-muted);font-style:italic;font-size:12px">${a.comentario || '—'}</td>
            <td>${a.data}</td>
          </tr>`;
      }

      // Avaliação de professor: exibe estrelas por critério e média
      return `
        <tr>
          <td><strong>${a.avaliado}</strong></td>
          <td><span class="pg-badge ${a.tipo}">${tipoLabel}</span></td>
          <td>
            <div style="display:flex;gap:4px;flex-wrap:wrap">
              ${estrelas(c.pontualidade || 0)}
              ${estrelas(c.comunicacao  || 0)}
              ${estrelas(c.tecnico      || 0)}
              ${estrelas(c.proatividade || 0)}
              ${estrelas(c.equipe       || 0)}
            </div>
          </td>
          <td class="rel-media">${a.media} ★</td>
          ${a.comentario
            ? `<td style="font-size:12px;color:var(--text-muted);font-style:italic">"${a.comentario}"</td>`
            : '<td>—</td>'}
          <td>${a.data}</td>
        </tr>`;
    }).join('');
  }

  // Renderiza também a seção de respostas 180°
  renderTabela180(busca);
}

/**
 * Renderiza a seção de respostas das avaliações 180°
 * abaixo da tabela principal de relatórios.
 * @param {string} busca - Termo de busca atual
 */
function renderTabela180(busca) {
  // Cria ou localiza o container da seção 180°
  let secao180 = document.getElementById('rel-secao-180');
  const tableWrap = document.querySelector('.rel-table-wrap');
  if (!tableWrap) return;

  if (!secao180) {
    secao180 = document.createElement('div');
    secao180.id = 'rel-secao-180';
    tableWrap.after(secao180);
  }

  const respostas180  = (() => { try { return JSON.parse(localStorage.getItem('respostas180') || '[]'); } catch(e) { return []; } })();
  let lista = respostas180.slice().reverse();

  if (busca) {
    lista = lista.filter(r =>
      (r.respondente  || '').toLowerCase().includes(busca) ||
      (r.avaliacaoNome || '').toLowerCase().includes(busca)
    );
  }

  if (lista.length === 0) {
    secao180.innerHTML = `
      <h4 style="margin:28px 0 12px;font-size:15px;font-weight:700;color:var(--primary);display:flex;align-items:center;gap:8px">
        <i class="fa-solid fa-rotate"></i> Avaliações 180° — Respostas
      </h4>
      <p class="pg-empty">Nenhuma resposta 180° registrada.</p>`;
    return;
  }

  const linhas = lista.map(r => {
    const respostas   = r.respostas || [];
    const todasNotas  = respostas.flatMap(rc => (rc.notas || []).filter(n => n !== null));
    const mediaGeral  = todasNotas.length
      ? (todasNotas.reduce((a, b) => a + b, 0) / todasNotas.length).toFixed(1)
      : '—';

    // Resumo de competências com média individual
    const compResumo = respostas.map(rc =>
      `<span style="font-size:11px;background:#eff6ff;color:#1e40af;padding:2px 8px;border-radius:100px;margin:2px;display:inline-block">
        ${rc.compNome}: ${rc.media ? rc.media + ' ★' : '—'}
      </span>`
    ).join('');

    return `
      <tr>
        <td><strong>${r.respondente || 'Anônimo'}</strong></td>
        <td style="font-size:12px;color:var(--text-muted)">${r.avaliacaoNome || '—'}</td>
        <td><div style="display:flex;flex-wrap:wrap;gap:2px">${compResumo}</div></td>
        <td class="rel-media">${mediaGeral !== '—' ? mediaGeral + ' ★' : '—'}</td>
        <td>${r.data || '—'}</td>
      </tr>`;
  }).join('');

  secao180.innerHTML = `
    <h4 style="margin:28px 0 12px;font-size:15px;font-weight:700;color:var(--primary);display:flex;align-items:center;gap:8px">
      <i class="fa-solid fa-rotate"></i> Avaliações 180° — Respostas
    </h4>
    <div class="rel-table-wrap">
      <table class="rel-table">
        <thead>
          <tr>
            <th>Respondente</th>
            <th>Avaliação</th>
            <th>Competências</th>
            <th>Média Geral</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>`;
}

// ============================================================
// RELATÓRIOS — Exportar CSV
// ============================================================

/**
 * Gera e faz download de um arquivo CSV com todas as avaliações.
 * Inclui BOM UTF-8 para compatibilidade com Excel.
 */
function exportarCSV() {
  const avaliacoes = getAvaliacoes();
  if (avaliacoes.length === 0) {
    showToast('Nenhuma avaliação para exportar.', 'error');
    return;
  }

  // Cabeçalho do CSV
  const linhas = [
    ['Avaliado', 'Tipo', 'Pontualidade', 'Comunicação', 'Técnico', 'Proatividade', 'Equipe', 'Média', 'Comentário', 'Data']
  ];

  avaliacoes.forEach(a => {
    const c = a.criterios || {};
    linhas.push([
      a.avaliado,
      a.tipo === 'professor' ? 'Professor' : 'Estagiário',
      c.pontualidade || '',
      c.comunicacao  || '',
      c.tecnico      || '',
      c.proatividade || '',
      c.equipe       || '',
      a.media        || '',
      a.comentario   || '',
      a.data,
    ]);
  });

  // Converte para string CSV com aspas em cada campo
  const csv  = linhas.map(l => l.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `avaliacoes_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Exportado com sucesso!');
}

// ============================================================
// INIT — Inicialização ao carregar a página
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // Inicia o formulário de cadastro com o tipo padrão (estagiário)
  setTipoCad('estagiario');

  // Validação em tempo real nos campos do cadastro
  addLiveValidation('cad-nome',  v => v.trim().length > 0,                              'O nome completo é obrigatório.');
  addLiveValidation('cad-email', v => !v.trim() || REGEX_EMAIL_ACADEMICO.test(v.trim()), 'Use um e-mail acadêmico institucional.');
  addLiveValidation('cad-senha', v => !v || v.length >= 6,                              'A senha deve ter pelo menos 6 caracteres.');

  // Renderiza a lista de pessoas (página Consultar)
  renderPessoas();

  // Renderiza os relatórios (página Relatórios)
  renderRelatorio();
});
