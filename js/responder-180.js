// =============================================
// RESPONDER-180.JS
// Dois modos:
//   - gestor: avalia múltiplos colaboradores com dropdowns
//   - estagiario: responde critério por critério com botão colorido
// =============================================

const notasSelecionadas = {};
let paginaAtual180 = 0;
let competenciasGlobal = [];
let avaliacaoGlobal = null;
let modoRespondente = 'estagiario'; // 'gestor' ou 'estagiario'

function getRespostas180() {
  try { return JSON.parse(localStorage.getItem('respostas180') || '[]'); } catch(e) { return []; }
}
function saveRespostas180(data) {
  localStorage.setItem('respostas180', JSON.stringify(data));
}

// =============================================
// SELECIONAR NOTA — modo estagiário (botão colorido)
// =============================================
function selecionarNota(compId, criterioIdx, nota, btn) {
  const chave = `${compId}_${criterioIdx}`;
  notasSelecionadas[chave] = nota;

  // Atualiza o botão colorido do critério
  const card = btn.closest('.resp180-criterio-card');
  if (!card) return;

  const display = card.querySelector('.resp180-nota-display');
  if (display) {
    display.textContent = nota;
    display.className = `resp180-nota-display n${nota}`;
  }

  // Fecha o dropdown
  const dropdown = card.querySelector('.resp180-nota-dropdown');
  if (dropdown) dropdown.classList.remove('open');
}

// Abre/fecha dropdown de nota
function toggleNotaDropdown(btn) {
  const card = btn.closest('.resp180-criterio-card');
  if (!card) return;
  const dropdown = card.querySelector('.resp180-nota-dropdown');
  if (!dropdown) return;

  // Fecha todos os outros
  document.querySelectorAll('.resp180-nota-dropdown.open').forEach(d => {
    if (d !== dropdown) d.classList.remove('open');
  });
  dropdown.classList.toggle('open');
}

// Fecha dropdowns ao clicar fora
document.addEventListener('click', (e) => {
  if (!e.target.closest('.resp180-nota-wrap')) {
    document.querySelectorAll('.resp180-nota-dropdown.open').forEach(d => d.classList.remove('open'));
  }
});

// =============================================
// SELECIONAR NOTA — modo gestor (select)
// =============================================
function selecionarNotaAvaliado(avaliadoId, compId, criterioIdx, select) {
  const chave = `${avaliadoId}_${compId}_${criterioIdx}`;
  const nota = parseInt(select.value) || null;
  if (nota) notasSelecionadas[chave] = nota;
  else delete notasSelecionadas[chave];
  select.className = 'resp180-select-nota' + (nota ? ` nota-${nota}` : '');
}

// =============================================
// RENDERIZAR PÁGINA — modo estagiário
// =============================================
function renderPaginaEstagiario(idx) {
  paginaAtual180 = idx;
  const comp = competenciasGlobal[idx];
  const total = competenciasGlobal.length;
  const container = document.getElementById('resp180-container');
  if (!container || !comp) return;

  const criterios = (comp.criterios && comp.criterios.length > 0)
    ? comp.criterios
    : [
        'Demonstra conhecimento e aplicação prática',
        'Comunica-se de forma clara e objetiva',
        'Cumpre prazos e entregas com qualidade',
        'Colabora com a equipe e busca melhorias',
      ];

  const notasOpcoes = [
    { n: 1, label: 'Não cumpre o requisito',              cls: 'n1' },
    { n: 2, label: 'Cumpre moderadamente',                cls: 'n2' },
    { n: 3, label: 'Cumpre sempre',                       cls: 'n3' },
    { n: 4, label: 'Cumpre e supera expectativas',        cls: 'n4' },
  ];

  const criteriosHTML = criterios.map((texto, cidx) => {
    const chave = `${comp.id}_${cidx}`;
    const notaAtual = notasSelecionadas[chave] || null;
    const clsAtual = notaAtual ? `n${notaAtual}` : '';
    const textoAtual = notaAtual || '—';

    const opcoesHTML = notasOpcoes.map(({ n, label, cls }) => `
      <button
        class="resp180-nota-opcao ${cls}${notaAtual === n ? ' selected' : ''}"
        onclick="selecionarNota(${comp.id}, ${cidx}, ${n}, this)"
        aria-label="Nota ${n}: ${label}"
      >
        <span class="resp180-nota-opcao-num">${n}</span>
        <span class="resp180-nota-opcao-label">${label}</span>
      </button>
    `).join('');

    return `
      <div class="resp180-criterio-card">
        <div class="resp180-criterio-top">
          <span class="resp180-criterio-tag">
            <i class="fa-solid fa-square-check" aria-hidden="true"></i> Critério ${cidx + 1}
          </span>
          <span class="resp180-nota-label-topo">Nota</span>
        </div>
        <div class="resp180-criterio-bottom">
          <p class="resp180-criterio-texto">${texto}</p>
          <div class="resp180-nota-wrap">
            <button
              class="resp180-nota-display-btn ${clsAtual}"
              onclick="toggleNotaDropdown(this)"
              aria-haspopup="true"
              aria-label="Selecionar nota para critério ${cidx + 1}"
            >
              <span class="resp180-nota-display ${clsAtual}">${textoAtual}</span>
              <i class="fa-solid fa-chevron-down resp180-nota-chevron" aria-hidden="true"></i>
            </button>
            <div class="resp180-nota-dropdown" role="listbox">
              ${opcoesHTML}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  const paginacaoHTML = `
    <div class="resp180-paginacao">
      ${Array.from({ length: total }, (_, i) => `
        <button
          class="resp180-pag-num${i === idx ? ' active' : ''}"
          onclick="irParaPagina(${i})"
          title="${competenciasGlobal[i].nome}"
        >${i + 1}</button>
      `).join('')}
    </div>
  `;

  const isUltima = idx === total - 1;

  container.innerHTML = `
    <div class="resp180-comp-page">
      <div class="resp180-comp-header">
        <h2 class="resp180-comp-titulo">${comp.nome}</h2>
        ${comp.descricao
          ? `<p class="resp180-comp-desc"><span class="resp180-desc-dot"></span>${comp.descricao}</p>`
          : ''}
      </div>

      <div class="resp180-criterios-section">
        <p class="resp180-criterios-label">Critérios de Avaliação:</p>
        ${criteriosHTML}
      </div>

      <div class="resp180-observacao-section">
        <p class="resp180-observacao-label">NÃO PRECISA DE OBSERVAÇÃO</p>
      </div>

      <div class="resp180-rodape">
        <button class="resp180-btn-voltar"
          onclick="${idx === 0 ? "window.location.href='avaliacao-180.html'" : `irParaPagina(${idx - 1})`}"
        >Voltar</button>
        ${paginacaoHTML}
        ${isUltima
          ? `<button class="resp180-btn-proximo resp180-btn-enviar" onclick="enviarRespostas()">Próximo</button>`
          : `<button class="resp180-btn-proximo" onclick="irParaPagina(${idx + 1})">Próximo</button>`
        }
      </div>
    </div>
  `;
}

// =============================================
// RENDERIZAR PÁGINA — modo gestor
// =============================================
function renderPaginaGestor(idx) {
  paginaAtual180 = idx;
  const comp = competenciasGlobal[idx];
  const total = competenciasGlobal.length;
  const container = document.getElementById('resp180-container');
  if (!container || !comp) return;

  const avaliados = avaliacaoGlobal.avaliados || [];
  const criterios = (comp.criterios && comp.criterios.length > 0)
    ? comp.criterios
    : ['Demonstra conhecimento e aplicação prática','Comunica-se de forma clara e objetiva','Cumpre prazos e entregas com qualidade','Colabora com a equipe e busca melhorias'];

  const criteriosGridHTML = criterios.map((texto, i) => `
    <div class="resp180-criterio-grid-item">
      <div class="resp180-criterio-grid-header">
        <i class="fa-solid fa-square-check"></i> Critério ${i + 1}
      </div>
      <p class="resp180-criterio-grid-texto">${texto}</p>
    </div>
  `).join('');

  const legendaHTML = `
    <div class="resp180-legenda-info">
      <i class="fa-solid fa-circle-info" style="font-size:12px;color:var(--primary-light)"></i>
      Os critérios são avaliados de 1 a 4, segundo a seguinte métrica:
    </div>
    <div class="resp180-legenda-grid">
      <div class="resp180-legenda-btn n1">Nota 1 — Não cumpre o requisito</div>
      <div class="resp180-legenda-btn n3">Nota 3 — Cumpre sempre</div>
      <div class="resp180-legenda-btn n2">Nota 2 — Cumpre moderadamente</div>
      <div class="resp180-legenda-btn n4">Nota 4 — Cumpre o requisito e supera expectativas</div>
    </div>
  `;

  const opcoesSelect = `<option value="">Selecione</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option>`;

  const avaliadosHTML = avaliados.length === 0
    ? `<p class="resp180-sem-avaliados">Nenhum avaliado vinculado.</p>`
    : avaliados.map(av => {
        const iniciais = av.nome.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
        const dropdownsHTML = criterios.map((_, cidx) => {
          const chave = `${av.id}_${comp.id}_${cidx}`;
          const notaAtual = notasSelecionadas[chave] || '';
          return `
            <div class="resp180-avaliado-criterio">
              <span class="resp180-avaliado-criterio-label">Critério ${cidx + 1} <i class="fa-solid fa-circle-dot" style="font-size:6px;"></i></span>
              <select class="resp180-select-nota${notaAtual ? ` nota-${notaAtual}` : ''}"
                onchange="selecionarNotaAvaliado(${av.id}, ${comp.id}, ${cidx}, this)">
                ${opcoesSelect.replace(`value="${notaAtual}"`, `value="${notaAtual}" selected`)}
              </select>
            </div>`;
        }).join('');
        return `
          <div class="resp180-avaliado-card">
            <div class="resp180-avaliado-info">
              <div class="resp180-avaliado-avatar">${iniciais}</div>
              <div class="resp180-avaliado-dados">
                <span class="resp180-avaliado-nome">${av.nome}</span>
                ${av.cargo ? `<span class="resp180-avaliado-cargo">Cargo: ${av.cargo}</span>` : `<span class="resp180-avaliado-cargo">Sem cargo definido</span>`}
              </div>
            </div>
            <div class="resp180-avaliado-dropdowns">${dropdownsHTML}</div>
            <div class="resp180-avaliado-obs">
              <label class="resp180-obs-label">Observações:</label>
              <textarea class="resp180-obs-textarea" placeholder="Comentário (Opcional)" rows="2"></textarea>
            </div>
          </div>`;
      }).join('');

  const paginacaoHTML = `
    <div class="resp180-paginacao">
      ${Array.from({ length: total }, (_, i) => `
        <button class="resp180-pag-num${i === idx ? ' active' : ''}" onclick="irParaPagina(${i})" title="${competenciasGlobal[i].nome}">${i + 1}</button>
      `).join('')}
    </div>`;

  const isUltima = idx === total - 1;

  container.innerHTML = `
    <div class="resp180-comp-page">
      <div class="resp180-comp-header">
        <h2 class="resp180-comp-titulo">${comp.nome}</h2>
        ${comp.descricao ? `<p class="resp180-comp-desc"><span class="resp180-desc-dot"></span>${comp.descricao}</p>` : ''}
      </div>
      <div class="resp180-criterios-section resp180-criterios-grid-wrap">
        <p class="resp180-criterios-label">Critérios de Avaliação:</p>
        <div class="resp180-criterios-grid">${criteriosGridHTML}</div>
      </div>
      <div class="resp180-legenda-section">${legendaHTML}</div>
      <div class="resp180-avaliados-section">
        <p class="resp180-avaliados-label">Avaliados:</p>
        ${avaliadosHTML}
      </div>
      <div class="resp180-observacao-section">
        <p class="resp180-observacao-label">NÃO PRECISA DE OBSERVAÇÃO</p>
      </div>
      <div class="resp180-rodape">
        <button class="resp180-btn-voltar"
          onclick="${idx === 0 ? "window.location.href='avaliacao-180.html'" : `irParaPagina(${idx - 1})`}"
        >Voltar</button>
        ${paginacaoHTML}
        ${isUltima
          ? `<button class="resp180-btn-proximo resp180-btn-enviar" onclick="enviarRespostas()">Enviar</button>`
          : `<button class="resp180-btn-proximo" onclick="irParaPagina(${idx + 1})">Próximo</button>`
        }
      </div>
    </div>`;
}

// =============================================
// NAVEGAR
// =============================================
function irParaPagina(idx) {
  if (idx < 0 || idx >= competenciasGlobal.length) return;
  if (modoRespondente === 'gestor') renderPaginaGestor(idx);
  else renderPaginaEstagiario(idx);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// =============================================
// INIT FORMULÁRIO
// =============================================
function renderFormulario(avaliacao, respondente) {
  const container = document.getElementById('resp180-container');
  if (!container) return;

  if (!avaliacao) {
    container.innerHTML = `<div class="resp180-erro"><i class="fa-solid fa-circle-exclamation"></i><h3>Avaliação não encontrada</h3><p>O ID informado não corresponde a nenhuma avaliação 180° cadastrada.</p><a href="avaliacao-180.html">← Voltar</a></div>`;
    return;
  }
  if (!avaliacao.competencias || avaliacao.competencias.length === 0) {
    container.innerHTML = `<div class="resp180-erro"><i class="fa-solid fa-clipboard-list"></i><h3>Sem competências</h3><p>Esta avaliação não possui competências vinculadas.</p><a href="avaliacao-180.html">← Voltar</a></div>`;
    return;
  }

  avaliacaoGlobal = avaliacao;
  competenciasGlobal = avaliacao.competencias;

  // Define o modo: gestor se o respondente for professor/admin, estagiário caso contrário
  modoRespondente = (respondente && (respondente.tipo === 'professor' || respondente.tipo === 'admin'))
    ? 'gestor'
    : 'estagiario';

  if (modoRespondente === 'gestor') renderPaginaGestor(0);
  else renderPaginaEstagiario(0);
}

// =============================================
// ENVIAR
// =============================================
function enviarRespostas() {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'));
  const avaliacoes180 = (() => { try { return JSON.parse(localStorage.getItem('avaliacoes180') || '[]'); } catch(e) { return []; } })();
  const avaliacao = avaliacoes180.find(a => a.id === id);
  if (!avaliacao) { showToast('Avaliação não encontrada.', 'error'); return; }

  if (Object.keys(notasSelecionadas).length === 0) {
    showToast('Selecione pelo menos uma nota antes de enviar.', 'error');
    return;
  }

  const sessao = (() => { try { return JSON.parse(localStorage.getItem('perfilLogado') || 'null'); } catch(e) { return null; } })();
  const contatos = (() => { try { return JSON.parse(localStorage.getItem('contatos') || '[]'); } catch(e) { return []; } })();
  const respondente = sessao ? contatos.find(c => c.id === sessao.id) : null;

  const competencias = avaliacao.competencias || [];
  const avaliados = modoRespondente === 'gestor' ? (avaliacao.avaliados || []) : [{ id: respondente?.id || 0, nome: respondente?.nome || 'Anônimo' }];

  const respostasComp = avaliados.flatMap(av =>
    competencias.map(comp => {
      const criterios = comp.criterios || [];
      const qtd = criterios.length > 0 ? criterios.length : 4;
      const prefix = modoRespondente === 'gestor' ? `${av.id}_` : '';
      const notas = Array.from({ length: qtd }, (_, i) => notasSelecionadas[`${prefix}${comp.id}_${i}`] || null);
      const validas = notas.filter(n => n !== null);
      const media = validas.length > 0 ? (validas.reduce((a, b) => a + b, 0) / validas.length).toFixed(2) : null;
      return { avaliadoId: av.id, avaliadoNome: av.nome, compId: comp.id, compNome: comp.nome, notas, media, comentario: '' };
    })
  );

  const registro = {
    id: Date.now(),
    avaliacaoId: id,
    avaliacaoNome: avaliacao.nome,
    empresa: avaliacao.empresa || '',
    respondente: respondente ? respondente.nome : 'Anônimo',
    respondenteId: respondente ? respondente.id : null,
    modo: modoRespondente,
    respostas: respostasComp,
    data: new Date().toLocaleDateString('pt-BR'),
    dataISO: new Date().toISOString(),
  };

  const respostas = getRespostas180();
  respostas.push(registro);
  saveRespostas180(respostas);

  const btnEnviar = document.querySelector('.resp180-btn-enviar');
  if (btnEnviar) btnEnviar.disabled = true;

  const container = document.getElementById('resp180-container');
  if (container) {
    container.innerHTML = `
      <div class="resp180-sucesso">
        <i class="fa-solid fa-circle-check"></i>
        <h3>Respostas enviadas com sucesso!</h3>
        <p>Suas respostas para <strong>${avaliacao.nome}</strong> foram registradas.</p>
        <a href="avaliacao-180.html" class="resp180-sucesso-btn">
          <i class="fa-solid fa-arrow-left"></i> Voltar para Avaliações 180°
        </a>
      </div>`;
  }
  showToast('Respostas enviadas!');
}

// =============================================
// INIT
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'));
  const avaliacoes180 = (() => { try { return JSON.parse(localStorage.getItem('avaliacoes180') || '[]'); } catch(e) { return []; } })();
  const avaliacao = avaliacoes180.find(a => a.id === id) || null;
  const sessao = (() => { try { return JSON.parse(localStorage.getItem('perfilLogado') || 'null'); } catch(e) { return null; } })();
  const contatos = (() => { try { return JSON.parse(localStorage.getItem('contatos') || '[]'); } catch(e) { return []; } })();
  const respondente = sessao ? contatos.find(c => c.id === sessao.id) : null;
  renderFormulario(avaliacao, respondente);
});
