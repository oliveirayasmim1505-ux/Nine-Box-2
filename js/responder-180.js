// =============================================
// RESPONDER-180.JS — Formulário de resposta
// Modelo: uma competência por página, critérios
// com botão de nota colorido (1-4) ao lado direito,
// sem campo de comentário, paginação entre competências.
// =============================================

// Notas selecionadas: { compId_criterioIdx: nota }
const notasSelecionadas = {};

// Página atual (índice da competência sendo exibida)
let paginaAtual180 = 0;
let competenciasGlobal = [];
let avaliacaoGlobal = null;

function getRespostas180() {
  try { return JSON.parse(localStorage.getItem('respostas180') || '[]'); } catch(e) { return []; }
}

function saveRespostas180(data) {
  localStorage.setItem('respostas180', JSON.stringify(data));
}

// =============================================
// SELECIONAR NOTA
// =============================================
function selecionarNota(compId, criterioIdx, nota, btn) {
  const chave = `${compId}_${criterioIdx}`;
  notasSelecionadas[chave] = nota;

  // Atualiza visual — desmarca irmãos, marca este
  const grupo = btn.closest('.resp180-nota-grupo');
  if (grupo) {
    grupo.querySelectorAll('.resp180-nota-btn').forEach(b => {
      b.classList.remove('selected');
      b.setAttribute('aria-pressed', 'false');
    });
  }
  btn.classList.add('selected');
  btn.setAttribute('aria-pressed', 'true');
}

// =============================================
// RENDERIZAR PÁGINA DE COMPETÊNCIA
// =============================================
function renderPagina(idx) {
  paginaAtual180 = idx;
  const comp = competenciasGlobal[idx];
  const total = competenciasGlobal.length;
  const container = document.getElementById('resp180-container');
  if (!container || !comp) return;

  const criterios = comp.criterios && comp.criterios.length > 0
    ? comp.criterios
    : [
        'Demonstra conhecimento e aplicação prática',
        'Comunica-se de forma clara e objetiva',
        'Cumpre prazos e entregas com qualidade',
        'Colabora com a equipe e busca melhorias',
      ];

  const criteriosHTML = criterios.map((criterio, cidx) => {
    const chave = `${comp.id}_${cidx}`;
    const notaAtual = notasSelecionadas[chave] || null;

    const notas = [
      { n: 1, cor: 'n1', label: 'Não cumpre' },
      { n: 2, cor: 'n2', label: 'Cumpre moderadamente' },
      { n: 3, cor: 'n3', label: 'Cumpre sempre' },
      { n: 4, cor: 'n4', label: 'Supera expectativas' },
    ];

    const botoesHTML = notas.map(({ n, cor, label }) => `
      <button
        class="resp180-nota-btn ${cor} ${notaAtual === n ? 'selected' : ''}"
        data-nota="${n}"
        aria-label="Nota ${n}: ${label}"
        aria-pressed="${notaAtual === n ? 'true' : 'false'}"
        onclick="selecionarNota(${comp.id}, ${cidx}, ${n}, this)"
        title="${label}"
      >${n}</button>
    `).join('');

    return `
      <div class="resp180-criterio-row">
        <div class="resp180-criterio-header">
          <span class="resp180-criterio-num">Critério ${cidx + 1}</span>
          <span class="resp180-criterio-label-nota">Nota</span>
        </div>
        <div class="resp180-criterio-body">
          <p class="resp180-criterio-texto">${criterio || `Critério ${cidx + 1}`}</p>
          <div class="resp180-nota-grupo" role="group" aria-label="Selecione a nota para o critério ${cidx + 1}">
            ${botoesHTML}
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Paginação
  const paginacaoHTML = `
    <div class="resp180-paginacao">
      ${Array.from({ length: total }, (_, i) => `
        <button
          class="resp180-pag-dot ${i === idx ? 'active' : ''}"
          onclick="irParaPagina(${i})"
          aria-label="Competência ${i + 1}"
          title="${competenciasGlobal[i].nome}"
        >${i + 1}</button>
      `).join('')}
    </div>
  `;

  const isUltima = idx === total - 1;

  container.innerHTML = `
    <div class="resp180-comp-page">

      <!-- Título da competência -->
      <div class="resp180-comp-header">
        <div class="resp180-comp-header-left">
          <h2 class="resp180-comp-titulo">${comp.nome}</h2>
          ${comp.descricao ? `<p class="resp180-comp-subdesc"><i class="fa-solid fa-circle" style="font-size:7px;color:var(--success)"></i> ${comp.descricao}</p>` : ''}
        </div>
        <span class="resp180-comp-counter">${idx + 1} / ${total}</span>
      </div>

      <!-- Critérios de Avaliação -->
      <div class="resp180-criterios-titulo">Critérios de Avaliação:</div>
      <div class="resp180-criterios-lista">
        ${criteriosHTML}
      </div>

      <!-- Navegação -->
      <div class="resp180-nav">
        <button
          class="resp180-nav-btn resp180-nav-voltar"
          onclick="${idx === 0 ? "window.location.href='avaliacao-180.html'" : `irParaPagina(${idx - 1})`}"
        >
          <i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Voltar
        </button>

        ${paginacaoHTML}

        ${isUltima
          ? `<button class="resp180-nav-btn resp180-nav-enviar" onclick="enviarRespostas()">
               <i class="fa-solid fa-paper-plane" aria-hidden="true"></i> Enviar
             </button>`
          : `<button class="resp180-nav-btn resp180-nav-proximo" onclick="irParaPagina(${idx + 1})">
               Próximo <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
             </button>`
        }
      </div>

    </div>
  `;
}

// =============================================
// NAVEGAR ENTRE PÁGINAS
// =============================================
function irParaPagina(idx) {
  if (idx < 0 || idx >= competenciasGlobal.length) return;
  renderPagina(idx);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// =============================================
// RENDERIZAR FORMULÁRIO INICIAL
// =============================================
function renderFormulario(avaliacao, respondente) {
  const container = document.getElementById('resp180-container');
  if (!container) return;

  if (!avaliacao) {
    container.innerHTML = `
      <div class="resp180-erro">
        <i class="fa-solid fa-circle-exclamation"></i>
        <h3>Avaliação não encontrada</h3>
        <p>O ID informado não corresponde a nenhuma avaliação 180° cadastrada.</p>
        <a href="avaliacao-180.html">← Voltar para lista</a>
      </div>`;
    return;
  }

  const competencias = avaliacao.competencias || [];

  if (competencias.length === 0) {
    container.innerHTML = `
      <div class="resp180-erro">
        <i class="fa-solid fa-clipboard-list"></i>
        <h3>Sem competências</h3>
        <p>Esta avaliação não possui competências vinculadas.</p>
        <a href="avaliacao-180.html">← Voltar para lista</a>
      </div>`;
    return;
  }

  avaliacaoGlobal = avaliacao;
  competenciasGlobal = competencias;

  renderPagina(0);
}

// =============================================
// ENVIAR RESPOSTAS
// =============================================
function enviarRespostas() {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'));
  const avaliacoes180 = (() => { try { return JSON.parse(localStorage.getItem('avaliacoes180') || '[]'); } catch(e) { return []; } })();
  const avaliacao = avaliacoes180.find(a => a.id === id);

  if (!avaliacao) {
    showToast('Avaliação não encontrada.', 'error');
    return;
  }

  const competencias = avaliacao.competencias || [];
  const sessao = (() => { try { return JSON.parse(localStorage.getItem('perfilLogado') || 'null'); } catch(e) { return null; } })();
  const contatos = (() => { try { return JSON.parse(localStorage.getItem('contatos') || '[]'); } catch(e) { return []; } })();
  const respondente = sessao ? contatos.find(c => c.id === sessao.id) : null;

  // Montar respostas por competência
  const respostasComp = competencias.map(comp => {
    const criterios = comp.criterios || [];
    const qtdCriterios = criterios.length > 0 ? criterios.length : 4;

    const notas = [];
    for (let i = 0; i < qtdCriterios; i++) {
      notas.push(notasSelecionadas[`${comp.id}_${i}`] || null);
    }

    const notasValidas = notas.filter(n => n !== null);
    const media = notasValidas.length > 0
      ? (notasValidas.reduce((a, b) => a + b, 0) / notasValidas.length).toFixed(2)
      : null;

    return { compId: comp.id, compNome: comp.nome, notas, media, comentario: '' };
  });

  // Verifica se pelo menos uma nota foi dada
  const algumaNota = respostasComp.some(r => r.notas.some(n => n !== null));
  if (!algumaNota) {
    showToast('Selecione pelo menos uma nota antes de enviar.', 'error');
    return;
  }

  const registro = {
    id: Date.now(),
    avaliacaoId: id,
    avaliacaoNome: avaliacao.nome,
    empresa: avaliacao.empresa || '',
    respondente: respondente ? respondente.nome : 'Anônimo',
    respondenteId: respondente ? respondente.id : null,
    respostas: respostasComp,
    data: new Date().toLocaleDateString('pt-BR'),
    dataISO: new Date().toISOString(),
  };

  const respostas = getRespostas180();
  respostas.push(registro);
  saveRespostas180(respostas);

  // Desabilita botão para evitar duplo clique
  const btnEnviar = document.querySelector('.resp180-nav-enviar');
  if (btnEnviar) btnEnviar.disabled = true;

  // Tela de sucesso
  const container = document.getElementById('resp180-container');
  if (container) {
    container.innerHTML = `
      <div class="resp180-sucesso">
        <i class="fa-solid fa-circle-check"></i>
        <h3>Respostas enviadas com sucesso!</h3>
        <p>Suas respostas para a avaliação <strong>${avaliacao.nome}</strong> foram registradas.</p>
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
