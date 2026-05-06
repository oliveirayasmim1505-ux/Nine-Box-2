// ============================================================
// DADOS.JS — Exportar e importar backup completo do sistema
// Salva/restaura todos os dados do localStorage em formato JSON
// ============================================================

/**
 * Exporta todos os dados do sistema para um arquivo .json.
 * O arquivo inclui: contatos, avaliações, Nine Box, competências,
 * avaliações 180° e respostas 180°.
 */
function exportarDados() {
  // Chaves do localStorage que fazem parte do backup
  const chaves = [
    'contatos',
    'avaliacoes',
    'nineBoxAvaliacoes',
    'competencias',
    'avaliacoes180',
    'respostas180',
  ];

  const backup = {};

  // Lê cada chave e converte de string JSON para objeto
  chaves.forEach(chave => {
    const valor = localStorage.getItem(chave);
    if (valor) {
      try {
        backup[chave] = JSON.parse(valor);
      } catch (e) {
        // Se não for JSON válido, salva como string mesmo
        backup[chave] = valor;
      }
    } else {
      backup[chave] = []; // Chave vazia → array vazio
    }
  });

  // Metadados do backup
  backup._exportadoEm = new Date().toISOString();
  backup._versao      = '2.0';

  // Gera o arquivo e dispara o download
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `portal-estagio-backup-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(url);

  showToast('Dados exportados com sucesso!');
}

/**
 * Importa dados de um arquivo .json previamente exportado.
 * Substitui os dados atuais do localStorage pelos do arquivo.
 * Recarrega a página após 1.5s para refletir as mudanças.
 */
function importarDados() {
  // Cria um input file invisível para abrir o seletor de arquivo
  const input  = document.createElement('input');
  input.type   = 'file';
  input.accept = '.json,application/json';

  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const dados = JSON.parse(ev.target.result);

        // Verifica se o arquivo tem o formato esperado
        if (!dados || typeof dados !== 'object') {
          showToast('Arquivo inválido.', 'error');
          return;
        }

        const chaves = [
          'contatos',
          'avaliacoes',
          'nineBoxAvaliacoes',
          'competencias',
          'avaliacoes180',
          'respostas180',
        ];

        let importados = 0;

        // Restaura cada chave encontrada no arquivo
        chaves.forEach(chave => {
          if (dados[chave] !== undefined) {
            localStorage.setItem(chave, JSON.stringify(dados[chave]));
            importados++;
          }
        });

        if (importados === 0) {
          showToast('Nenhum dado reconhecido no arquivo.', 'error');
          return;
        }

        showToast(`Dados importados com sucesso! (${importados} categorias)`);

        // Recarrega a página para refletir os dados importados
        setTimeout(() => location.reload(), 1500);

      } catch (err) {
        showToast('Erro ao ler o arquivo JSON.', 'error');
      }
    };

    reader.readAsText(file);
  };

  input.click();
}
