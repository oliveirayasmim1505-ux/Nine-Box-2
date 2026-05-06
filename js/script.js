// ============================================================
// SCRIPT.JS — Funções globais compartilhadas por todas as páginas
// Inclui: storage helpers, toast, validação inline
// ============================================================

// ============================================================
// STORAGE — Leitura e escrita no localStorage
// ============================================================

/** Retorna a lista de contatos/usuários cadastrados */
function getContatos() {
  return JSON.parse(localStorage.getItem('contatos') || '[]');
}

/** Salva a lista de contatos no localStorage */
function saveContatos(contatos) {
  localStorage.setItem('contatos', JSON.stringify(contatos));
}

/** Retorna a lista de avaliações (professor/estagiário) */
function getAvaliacoes() {
  return JSON.parse(localStorage.getItem('avaliacoes') || '[]');
}

/** Salva a lista de avaliações no localStorage */
function saveAvaliacoes(avaliacoes) {
  localStorage.setItem('avaliacoes', JSON.stringify(avaliacoes));
}

// ============================================================
// TOAST — Notificação visual temporária na parte inferior
// ============================================================

/**
 * Exibe uma mensagem de feedback ao usuário.
 * @param {string} msg    - Texto da mensagem
 * @param {string} type   - 'success' (padrão), 'error' ou 'info'
 */
function showToast(msg, type = 'success') {
  // Cria o elemento se ainda não existir no DOM
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }

  toast.textContent = msg;
  toast.className = 'toast show ' + type;

  // Remove a classe 'show' após 3 segundos (fade out via CSS)
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ============================================================
// VALIDAÇÃO INLINE — Sistema centralizado de erros nos campos
// ============================================================

/**
 * Marca um campo como inválido, exibindo uma mensagem de erro abaixo dele.
 * @param {string|HTMLElement} campo    - ID ou referência ao elemento
 * @param {string}             mensagem - Texto do erro a exibir
 */
function setFieldError(campo, mensagem) {
  const el = typeof campo === 'string' ? document.getElementById(campo) : campo;
  if (!el) return;

  el.classList.add('field-error');
  el.classList.remove('field-ok');

  // Cria ou reutiliza o span de mensagem de erro logo após o campo
  let span = el.parentElement.querySelector('.field-error-msg');
  if (!span) {
    span = document.createElement('span');
    span.className = 'field-error-msg';
    el.after(span);
  }
  span.textContent = mensagem;
  span.style.display = 'block';
}

/**
 * Remove o estado de erro de um campo, marcando-o como válido.
 * @param {string|HTMLElement} campo - ID ou referência ao elemento
 */
function clearFieldError(campo) {
  const el = typeof campo === 'string' ? document.getElementById(campo) : campo;
  if (!el) return;

  el.classList.remove('field-error');
  el.classList.add('field-ok');

  const span = el.parentElement.querySelector('.field-error-msg');
  if (span) span.style.display = 'none';
}

/**
 * Remove todos os erros de validação dentro de um container.
 * Útil ao fechar ou resetar um formulário/modal.
 * @param {string|HTMLElement} container - ID ou referência ao elemento pai
 */
function clearAllErrors(container) {
  const el = typeof container === 'string' ? document.getElementById(container) : container;
  if (!el) return;

  el.querySelectorAll('.field-error').forEach(f => {
    f.classList.remove('field-error', 'field-ok');
  });
  el.querySelectorAll('.field-error-msg').forEach(s => {
    s.style.display = 'none';
  });
}

/**
 * Valida um campo com uma função customizada e aplica o estado visual.
 * @param {string|HTMLElement} campo     - ID ou referência ao elemento
 * @param {Function}           validador - Função que recebe o valor e retorna true/false
 * @param {string}             mensagem  - Mensagem de erro se inválido
 * @returns {boolean} true se válido, false se inválido
 */
function validateField(campo, validador, mensagem) {
  const el = typeof campo === 'string' ? document.getElementById(campo) : campo;
  if (!el) return true;

  if (!validador(el.value)) {
    setFieldError(el, mensagem);
    return false;
  }
  clearFieldError(el);
  return true;
}

// ============================================================
// REGEX — Padrões de validação reutilizáveis
// ============================================================

/**
 * Valida e-mails de instituições acadêmicas brasileiras.
 * Aceita domínios como .edu.br, usp.br, unicamp.br, ifsp.edu.br, etc.
 */
const REGEX_EMAIL_ACADEMICO = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(edu|edu\.br|ac\.br|ifsp\.edu\.br|usp\.br|unicamp\.br|unesp\.br|ufmg\.br|ufsc\.br|ufrj\.br|unb\.br|ufpr\.br|ufba\.br|ufpe\.br|ufc\.br|ufam\.br|ufpa\.br|ufes\.br|ufg\.br|ufms\.br|ufmt\.br|ufpb\.br|ufrn\.br|ufal\.br|ufpi\.br|ufrr\.br|ufro\.br|ufac\.br|ufap\.br|uft\.br|furg\.br|ufpel\.br|ufsm\.br|ufcspa\.br|utfpr\.br|cefet|fatec|etec|senai|senac|fiap|fei|mackenzie|puc|unifesp|unifei|unifal|unifap|unir|unirio|ufop|ufv|ufjf|ufsj|ufla|uftm|unimontes|uemg|ufob|ufca|ufnt|ufr|ufcat|ufopa|unifesspa|unipampa|uffs|ufcspa)(\.[a-zA-Z]{2,})?$/i;

/** Valida qualquer e-mail no formato básico usuario@dominio.ext */
const REGEX_EMAIL_SIMPLES = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ============================================================
// VALIDAÇÃO EM TEMPO REAL — Aplica validação ao sair do campo (blur)
// ============================================================

/**
 * Adiciona validação automática a um campo: valida ao sair (blur)
 * e re-valida enquanto o usuário digita se já havia erro.
 * @param {string}   id        - ID do campo HTML
 * @param {Function} validador - Função que recebe o valor e retorna true/false
 * @param {string}   mensagem  - Mensagem de erro se inválido
 */
function addLiveValidation(id, validador, mensagem) {
  const el = document.getElementById(id);
  if (!el) return;

  // Valida ao perder o foco
  el.addEventListener('blur', () => validateField(el, validador, mensagem));

  // Re-valida enquanto digita, mas só se já tiver erro (evita mostrar erro antes de terminar)
  el.addEventListener('input', () => {
    if (el.classList.contains('field-error')) {
      validateField(el, validador, mensagem);
    }
  });
}

// ============================================================
// INIT — Funções legadas (compatibilidade com páginas antigas)
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // Estas funções existem para compatibilidade com versões antigas do sistema
  // que usavam IDs genéricos como #lista e #avaliacoes
  if (typeof renderLista === 'function') renderLista();
  if (typeof renderAvaliacoes === 'function') renderAvaliacoes();
  if (typeof populateProfessores === 'function') populateProfessores();
  if (typeof initStars === 'function') initStars();
});
