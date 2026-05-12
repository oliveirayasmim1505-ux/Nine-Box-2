// =============================================
// RESPONDER-180.JS — Formulário de resposta
// Modelo do print: uma competência por página,
// critérios em grid 2x2, legenda colorida,
// lista de avaliados com dropdowns por critério.
// =============================================

// { avaliadoId_compId_criterioIdx: nota }
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
// SELECIONAR NOTA (dropdown)
// =============================================
function selecionarNotaAvaliado(avaliadoId, compId, criterioIdx, select) {
  const chave = `${avaliadoId}_${compId}_${criterioIdx}`;
  const nota = parseInt(select.value) || null;
  if (nota) {
    notasSelecionadas[chave] = nota;
  } else {
    delete notasSelecionadas[chave];
  }
  // Aplica cor ao select conforme a nota
  select.className = 'resp180-select-nota' + (nota ? ` nota-${nota}` : '');
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

  const avaliados = avaliacaoGlobal.avaliados || [];

  const criterios = (comp.criterios && comp.criterios.length > 0)
    ? comp.criterios
    : [
        'Demonstra conhecimento e aplicação prática',
        'Comunica-se de forma clara e objetiva',
        'Cumpre prazos e entregas com qualidade',
        'Colabora com a equipe e busca melhorias',
      ];

  // Grid 2x2 de critérios
  const criteriosGridHTML = criterios.map((texto, i) => `
    <div class="resp180-criterio-grid-item">
      <div class="resp180-criterio-grid-header">
        <i class="fa-solid fa-square-check" aria-hidden="true"></i> Critério ${i + 1}
      </div>
      <p class="resp180-criterio-grid-texto">${texto || `Critério ${i + 1}`}</p>
    </div>
  `).join('');

  // Legenda das notas
  const legendaHTML = `
    <div class="resp180-legenda-info">
      <i class="fa-solid fa-circle" style="font-size:8px;color:var(--primary-light)"></i>
      Os critérios são avaliados de 1 a 4, segundo a seguinte métrica:
    </div>
    <div class="resp180-legenda-grid">
      <div class="resp180-legenda-btn n1">Nota 1 – Não cumpre o requisito</div>
      <div class="resp180-legenda-btn n3">Nota 3 – Cumpre sempre</div>
      <div class="resp180-legenda-btn n2">Nota 2 – Cumpre moderadamente</div>
      <div class="resp180-legenda-btn n4">Nota 4 – Cumpre o requisito e supera expectativas</div>
    </div>
  `;

  // Opções do dropdown
  const opcoesSelect = `
    <option value="">Selecione</option>
    <option value="1">1</option>
    <option value="2">2</option>
    <option value="3">3</option>
    <option value="4">4</option>
  `;

  // Lista de avaliados
  const avaliadosHTML = avaliados.length === 0
    ? `<p class="resp180-sem-avaliados">Nenhum avaliado vinculado a esta avaliação.</p>`
    : avaliados.map(av => {
        const iniciais = av.nome.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();

        const dropdownsHTML = criterios.map((_, cidx) => {
          const chave = `${av.id}_${comp.id}_${cidx}`;
          const notaAtual = notasSelecionadas[chave] || '';
          const classeNota = notaAtual ? ` nota-${notaAtual}` : '';
          return `
            <div class="resp180-avaliado-criterio">
              <span class="resp180-avaliado-criterio-label">Critério ${cidx + 1}
                <i class="fa-solid fa-circle-info resp180-tooltip-icon" title="${criterios[cidx]}"></i>
              </span>
              <select
                class="resp180-select-nota${classeNota}"
                onchange="selecionarNotaAvaliado(${av.id}, ${comp.id}, ${cidx}, this)"
                aria-label="Nota critério ${cidx + 1} para ${av.nome}"
              >
                ${opcoesSelect.replace(`value="${notaAtual}"`, `value="${notaAtual}" selected`)}
              </select>
            </div>
          `;
        }).join('');

        return `
          <div class="resp180-avaliado-card">
            <div class="resp180-avaliado-info">
              <div class="resp180-avaliado-avatar">${iniciais}</div>
              <div class="resp180-avaliado-dados">
                <span class="resp180-avaliado-nome">${av.nome}</span>
                ${av.cargo ? `<span class="resp180-avaliado-cargo">Cargo: ${av.cargo}</span>` : ''}
              </div>
            </div>
            <div class="resp180-avaliado-dropdowns">
              ${dropdownsHTML}
            </div>
          </div>
        `;
      }).join('');

  // Paginação
  const paginacaoHTML = `
    <div class="resp180-paginacao">
      ${Array.from({ length: total }, (_, i) => `
        <button
          class="resp180-pag-num${i === idx ? ' active' : ''}"
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

      <!-- Cabeçalho: título + descrição -->
      <div class="resp180-comp-header">
        <h2 class="resp180-comp-titulo">${comp.nome}</h2>
        ${comp.descricao
          ? `<p class="resp180-comp-desc">
               <span class="resp180-desc-dot"></span>${comp.descricao}
             </p>`
          : ''}
      </div>

      <!-- Grid 2x2 de critérios -->
      <div class="resp180-criterios-section">
        <p class="resp180-criterios-label">Critérios de Avaliação:</p>
        <div class="resp180-criterios-grid">
          ${criteriosGridHTML}
        </div>
      </div>

      <!-- Legenda das notas -->
      <div class="resp180-legenda-section">
        ${legendaHTML}
      </div>

      <!-- Lista de avaliados -->
      <div class="resp180-avaliados-section">
        <p class="resp180-avaliados-label">Avaliados:</p>
        ${avaliadosHTML}
      </div>

      <!-- Rodapé: Voltar | paginação | Próximo/Enviar -->
      <div class="resp180-rodape">
        <button
          class="resp180-btn-voltar"
          onclick="${idx === 0 ? "window.location.href='avaliacao-180.html'" : `irParaPagina(${idx - 1})`}"
        >Voltar</button>

        ${paginacaoHTML}

        ${isUltima
          ? `<button class="resp180-btn-proximo resp180-btn-enviar" onclick="enviarRespostas()">Enviar</button>`
          : `<button class="resp180-btn-proximo" onclick="irParaPagina(${idx + 1})">Próximo</button>`
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

  if (!avaliacao) { showToast('Avaliação não encontrada.', 'error'); return; }

  const competencias = avaliacao.competencias || [];
  const avaliados = avaliacao.avaliados || [];
  const sessao = (() => { try { return JSON.parse(localStorage.getItem('perfilLogado') || 'null'); } catch(e) { return null; } })();
  const contatos = (() => { try { return JSON.parse(localStorage.getItem('contatos') || '[]'); } catch(e) { return []; } })();
  const respondente = sessao ? contatos.find(c => c.id === sessao.id) : null;

  // Verifica se pelo menos uma nota foi dada
  if (Object.keys(notasSelecionadas).length === 0) {
    showToast('Selecione pelo menos uma nota antes de enviar.', 'error');
    return;
  }

  // Monta respostas por avaliado × competência
  const respostasComp = avaliados.map(av => {
    return competencias.map(comp => {
      const criterios = comp.criterios || [];
      const qtd = criterios.length > 0 ? criterios.length : 4;
      const notas = Array.from({ length: qtd }, (_, i) =>
        notasSelecionadas[`${av.id}_${comp.id}_${i}`] || null
      );
      const validas = notas.filter(n => n !== null);
      const media = validas.length > 0
        ? (validas.reduce((a, b) => a + b, 0) / validas.length).toFixed(2)
        : null;
      return { avaliadoId: av.id, avaliadoNome: av.nome, compId: comp.id, compNome: comp.nome, notas, media, comentario: '' };
    });
  }).flat();

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
