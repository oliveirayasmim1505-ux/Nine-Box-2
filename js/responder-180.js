// =============================================
// RESPONDER-180.JS — Formulário de resposta
// Modelo fiel ao print: uma competência por página,
// cada critério tem 4 botões de nota (1-4) coloridos
// à direita, sem comentários, paginação no rodapé.
// =============================================

const notasSelecionadas = {};
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

  // Desmarca todos os botões do grupo e marca o clicado
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

  const criterios = (comp.criterios && comp.criterios.length > 0)
    ? comp.criterios
    : [
        'Demonstra conhecimento e aplicação prática',
        'Comunica-se de forma clara e objetiva',
        'Cumpre prazos e entregas com qualidade',
        'Colabora com a equipe e busca melhorias',
      ];

  // Monta cada linha de critério
  const criteriosHTML = criterios.map((criterio, cidx) => {
    const chave = `${comp.id}_${cidx}`;
    const notaAtual = notasSelecionadas[chave] || null;

    const notas = [
      { n: 1, cls: 'n1', title: 'Não cumpre' },
      { n: 2, cls: 'n2', title: 'Cumpre moderadamente' },
      { n: 3, cls: 'n3', title: 'Cumpre sempre' },
      { n: 4, cls: 'n4', title: 'Supera expectativas' },
    ];

    const botoesHTML = notas.map(({ n, cls, title }) => `
      <button
        class="resp180-nota-btn ${cls}${notaAtual === n ? ' selected' : ''}"
        data-nota="${n}"
        aria-label="Nota ${n}: ${title}"
        aria-pressed="${notaAtual === n}"
        onclick="selecionarNota(${comp.id}, ${cidx}, ${n}, this)"
        title="${title}"
      >${n}</button>
    `).join('');

    return `
      <div class="resp180-criterio-card">
        <div class="resp180-criterio-top">
          <span class="resp180-criterio-tag">
            <i class="fa-solid fa-square-check" aria-hidden="true"></i> Critério ${cidx + 1}
          </span>
          <span class="resp180-nota-label">Nota</span>
        </div>
        <div class="resp180-criterio-bottom">
          <p class="resp180-criterio-texto">${criterio || `Critério ${cidx + 1}`}</p>
          <div class="resp180-nota-grupo" role="group" aria-label="Nota para critério ${cidx + 1}">
            ${botoesHTML}
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Paginação numérica
  const paginacaoHTML = `
    <div class="resp180-paginacao" role="navigation" aria-label="Páginas de competências">
      ${Array.from({ length: total }, (_, i) => `
        <button
          class="resp180-pag-num${i === idx ? ' active' : ''}"
          onclick="irParaPagina(${i})"
          aria-label="Competência ${i + 1}: ${competenciasGlobal[i].nome}"
          aria-current="${i === idx ? 'page' : 'false'}"
        >${i + 1}</button>
      `).join('')}
    </div>
  `;

  const isUltima = idx === total - 1;

  container.innerHTML = `
    <div class="resp180-comp-page">

      <!-- Cabeçalho: título + descrição da competência -->
      <div class="resp180-comp-header">
        <h2 class="resp180-comp-titulo">${comp.nome}</h2>
        ${comp.descricao
          ? `<p class="resp180-comp-desc">
               <span class="resp180-desc-dot" aria-hidden="true"></span>
               ${comp.descricao}
             </p>`
          : ''}
      </div>

      <!-- Seção de critérios -->
      <div class="resp180-criterios-wrap">
        <p class="resp180-criterios-label">Critérios de Avaliação:</p>
        ${criteriosHTML}
      </div>

      <!-- Rodapé: Voltar | paginação | Próximo/Enviar -->
      <div class="resp180-rodape">
        <button
          class="resp180-btn-voltar"
          onclick="${idx === 0 ? "window.location.href='avaliacao-180.html'" : `irParaPagina(${idx - 1})`}"
        >
          Voltar
        </button>

        ${paginacaoHTML}

        ${isUltima
          ? `<button class="resp180-btn-proximo resp180-btn-enviar" onclick="enviarRespostas()">
               Enviar
             </button>`
          : `<button class="resp180-btn-proximo" onclick="irParaPagina(${idx + 1})">
               Próximo
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
        <i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
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
        <i class="fa-solid fa-clipboard-list" aria-hidden="true"></i>
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

  if (!avaliacao) { showToast('Avaliação não encontrada.', 'error'); return; }

  const competencias = avaliacao.competencias || [];
  const sessao = (() => { try { return JSON.parse(localStorage.getItem('perfilLogado') || 'null'); } catch(e) { return null; } })();
  const contatos = (() => { try { return JSON.parse(localStorage.getItem('contatos') || '[]'); } catch(e) { return []; } })();
  const respondente = sessao ? contatos.find(c => c.id === sessao.id) : null;

  const respostasComp = competencias.map(comp => {
    const criterios = comp.criterios || [];
    const qtd = criterios.length > 0 ? criterios.length : 4;
    const notas = Array.from({ length: qtd }, (_, i) => notasSelecionadas[`${comp.id}_${i}`] || null);
    const validas = notas.filter(n => n !== null);
    const media = validas.length > 0
      ? (validas.reduce((a, b) => a + b, 0) / validas.length).toFixed(2)
      : null;
    return { compId: comp.id, compNome: comp.nome, notas, media, comentario: '' };
  });

  if (!respostasComp.some(r => r.notas.some(n => n !== null))) {
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

  const btnEnviar = document.querySelector('.resp180-btn-enviar');
  if (btnEnviar) btnEnviar.disabled = true;

  const container = document.getElementById('resp180-container');
  if (container) {
    container.innerHTML = `
      <div class="resp180-sucesso">
        <i class="fa-solid fa-circle-check" aria-hidden="true"></i>
        <h3>Respostas enviadas com sucesso!</h3>
        <p>Suas respostas para <strong>${avaliacao.nome}</strong> foram registradas.</p>
        <a href="avaliacao-180.html" class="resp180-sucesso-btn">
          <i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Voltar para Avaliações 180°
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
