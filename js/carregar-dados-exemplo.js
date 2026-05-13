// ====================================================================
// carregar-dados-exemplo.js — Carrega dados de exemplo automaticamente
// Garante que sempre haja dados para demonstração do sistema
// ====================================================================

(function() {
  'use strict';

  /**
   * Verifica se já existem dados no sistema
   */
  function verificarDados() {
    const contatos = JSON.parse(localStorage.getItem('contatos') || '[]');
    const avaliacoes = JSON.parse(localStorage.getItem('avaliacoes') || '[]');
    const nineBox = JSON.parse(localStorage.getItem('nineBoxAvaliacoes') || '[]');
    
    return {
      temContatos: contatos.length > 0,
      temAvaliacoes: avaliacoes.length > 0,
      temNineBox: nineBox.length > 0
    };
  }

  /**
   * Carrega dados de exemplo se não houver dados no sistema
   */
  function carregarDadosSeNecessario() {
    const dados = verificarDados();
    
    // Se já tem dados, não faz nada
    if (dados.temContatos && dados.temAvaliacoes && dados.temNineBox) {
      console.log('✅ Sistema já possui dados');
      return;
    }

    console.log('📦 Carregando dados de exemplo...');
    
    // Contatos de exemplo
    const contatosExemplo = [
      {
        id: 1001,
        nome: "Prof. João Silva",
        email: "joao.silva@universidade.edu",
        tipo: "professor",
        disciplina: "Engenharia de Software",
        foto: null
      },
      {
        id: 1002,
        nome: "Prof. Maria Santos",
        email: "maria.santos@universidade.edu",
        tipo: "professor",
        disciplina: "Banco de Dados",
        foto: null
      },
      {
        id: 1003,
        nome: "Ana Costa",
        email: "ana.costa@email.com",
        tipo: "estagiario",
        matricula: "2021001",
        foto: null
      },
      {
        id: 1004,
        nome: "Carlos Oliveira",
        email: "carlos.oliveira@email.com",
        tipo: "estagiario",
        matricula: "2021002",
        foto: null
      },
      {
        id: 1005,
        nome: "Prof. Pedro Lima",
        email: "pedro.lima@universidade.edu",
        tipo: "professor",
        disciplina: "Algoritmos",
        foto: null
      },
      {
        id: 1006,
        nome: "Beatriz Ferreira",
        email: "beatriz.ferreira@email.com",
        tipo: "estagiario",
        matricula: "2021003",
        foto: null
      },
      {
        id: 1007,
        nome: "Admin Sistema",
        email: "admin@sistema.com",
        tipo: "admin",
        senha: "admin123",
        foto: null
      }
    ];

    // Avaliações de exemplo
    const avaliacoesExemplo = [
      {
        id: 3001,
        tipo: "professor",
        avaliado: "Prof. João Silva",
        criterios: {
          pontualidade: 5,
          comunicacao: 4,
          tecnico: 5,
          proatividade: 4,
          equipe: 5
        },
        media: 4.6,
        comentario: "Excelente professor, muito dedicado às aulas e aos alunos.",
        data: "26/04/2026"
      },
      {
        id: 3002,
        tipo: "estagiario",
        avaliado: "Ana Costa",
        criterios: {},
        media: null,
        comentario: "Estagiária muito dedicada e pontual. Demonstra grande interesse em aprender e sempre busca feedback para melhorar. Sua comunicação é clara e ela se integra bem com a equipe.",
        data: "26/04/2026",
        tipoAvaliacao: "comentario"
      },
      {
        id: 3003,
        tipo: "professor",
        avaliado: "Prof. Maria Santos",
        criterios: {
          pontualidade: 5,
          comunicacao: 5,
          tecnico: 5,
          proatividade: 5,
          equipe: 5
        },
        media: 5.0,
        comentario: "Professora excepcional! Domínio completo da disciplina e excelente didática.",
        data: "27/04/2026"
      },
      {
        id: 3004,
        tipo: "estagiario",
        avaliado: "Carlos Oliveira",
        criterios: {},
        media: null,
        comentario: "Estagiário proativo e com ótimo desempenho técnico. Sempre disposto a ajudar os colegas e busca constantemente aprimorar suas habilidades.",
        data: "27/04/2026",
        tipoAvaliacao: "comentario"
      },
      {
        id: 3005,
        tipo: "professor",
        avaliado: "Prof. Pedro Lima",
        criterios: {
          pontualidade: 4,
          comunicacao: 5,
          tecnico: 5,
          proatividade: 5,
          equipe: 4
        },
        media: 4.6,
        comentario: "Professor muito competente, com excelente conhecimento técnico.",
        data: "28/04/2026"
      },
      {
        id: 3006,
        tipo: "estagiario",
        avaliado: "Beatriz Ferreira",
        criterios: {},
        media: null,
        comentario: "Demonstra grande potencial e comprometimento. Tem facilidade para trabalhar em equipe e sempre entrega suas tarefas no prazo.",
        data: "28/04/2026",
        tipoAvaliacao: "comentario"
      }
    ];

    // Nine Box de exemplo
    const nineBoxExemplo = [
      {
        id: 2001,
        pessoaId: 1001,
        tipo: "professor",
        pessoa: "Prof. João Silva",
        performance: 3,
        potential: 2,
        comentario: "Excelente professor, muito dedicado às aulas. Alto desempenho atual.",
        data: "27/04/2026",
        categoria: "Especialista"
      },
      {
        id: 2002,
        pessoaId: 1003,
        tipo: "estagiario",
        pessoa: "Ana Costa",
        performance: 2,
        potential: 3,
        comentario: "Demonstra muito potencial, está sempre buscando aprender mais. Grande promessa para o futuro.",
        data: "27/04/2026",
        categoria: "Estrela"
      },
      {
        id: 2003,
        pessoaId: 1002,
        tipo: "professor",
        pessoa: "Prof. Maria Santos",
        performance: 3,
        potential: 3,
        comentario: "Professora excepcional com grande potencial de liderança. Referência na instituição.",
        data: "27/04/2026",
        categoria: "Superstar"
      },
      {
        id: 2004,
        pessoaId: 1004,
        tipo: "estagiario",
        pessoa: "Carlos Oliveira",
        performance: 2,
        potential: 2,
        comentario: "Bom desempenho e potencial equilibrado. Desenvolvimento consistente.",
        data: "28/04/2026",
        categoria: "Profissional Sólido"
      },
      {
        id: 2005,
        pessoaId: 1005,
        tipo: "professor",
        pessoa: "Prof. Pedro Lima",
        performance: 3,
        potential: 2,
        comentario: "Professor experiente com excelente desempenho técnico.",
        data: "28/04/2026",
        categoria: "Especialista"
      },
      {
        id: 2006,
        pessoaId: 1006,
        tipo: "estagiario",
        pessoa: "Beatriz Ferreira",
        performance: 2,
        potential: 3,
        comentario: "Grande potencial de crescimento. Demonstra interesse e dedicação.",
        data: "28/04/2026",
        categoria: "Estrela"
      }
    ];

    // Competências de exemplo
    const competenciasExemplo = [
      {
        id: 4001,
        nome: "Comunicação Efetiva",
        tipo: "comportamental",
        de: "professor",
        criterios: [
          { id: 1, texto: "Expressa ideias de forma clara e objetiva", peso: 1 },
          { id: 2, texto: "Escuta ativamente e demonstra empatia", peso: 1 },
          { id: 3, texto: "Adapta comunicação ao público", peso: 1 }
        ],
        escala: [
          { nivel: 1, descricao: "Raramente se comunica de forma clara" },
          { nivel: 2, descricao: "Comunica-se adequadamente na maioria das vezes" },
          { nivel: 3, descricao: "Comunica-se de forma clara e efetiva" },
          { nivel: 4, descricao: "Excelente comunicador, referência para outros" },
          { nivel: 5, descricao: "Comunicação excepcional, inspira e engaja" }
        ]
      },
      {
        id: 4002,
        nome: "Trabalho em Equipe",
        tipo: "comportamental",
        de: "estagiario",
        criterios: [
          { id: 1, texto: "Colabora ativamente com colegas", peso: 1 },
          { id: 2, texto: "Compartilha conhecimento e ajuda outros", peso: 1 },
          { id: 3, texto: "Respeita opiniões divergentes", peso: 1 }
        ],
        escala: [
          { nivel: 1, descricao: "Dificuldade em trabalhar em equipe" },
          { nivel: 2, descricao: "Colabora quando solicitado" },
          { nivel: 3, descricao: "Bom colaborador, trabalha bem em equipe" },
          { nivel: 4, descricao: "Excelente em equipe, facilita colaboração" },
          { nivel: 5, descricao: "Líder natural, inspira trabalho em equipe" }
        ]
      },
      {
        id: 4003,
        nome: "Conhecimento Técnico",
        tipo: "tecnica",
        de: "professor",
        criterios: [
          { id: 1, texto: "Domina os conceitos da disciplina", peso: 1 },
          { id: 2, texto: "Mantém-se atualizado com novas tecnologias", peso: 1 },
          { id: 3, texto: "Aplica conhecimento na prática", peso: 1 }
        ],
        escala: [
          { nivel: 1, descricao: "Conhecimento básico insuficiente" },
          { nivel: 2, descricao: "Conhecimento adequado para função" },
          { nivel: 3, descricao: "Bom domínio técnico" },
          { nivel: 4, descricao: "Excelente conhecimento, referência técnica" },
          { nivel: 5, descricao: "Especialista reconhecido na área" }
        ]
      }
    ];

    // Avaliações 180° de exemplo
    const avaliacoes180Exemplo = [
      {
        id: 5001,
        nome: "Avaliação 180° - Prof. João Silva",
        avaliado: "Prof. João Silva",
        avaliadoId: 1001,
        tipo: "professor",
        inicio: "01/05/2026",
        fim: "15/05/2026",
        status: "ativa",
        competencias: [
          { id: 4001, nome: "Comunicação Efetiva" },
          { id: 4003, nome: "Conhecimento Técnico" }
        ],
        avaliadores: [
          { id: 1002, nome: "Prof. Maria Santos", tipo: "par", respondeu: true },
          { id: 1005, nome: "Prof. Pedro Lima", tipo: "par", respondeu: false },
          { id: 1003, nome: "Ana Costa", tipo: "subordinado", respondeu: true }
        ],
        respostas: [
          {
            avaliadorId: 1002,
            avaliadorNome: "Prof. Maria Santos",
            data: "03/05/2026",
            notas: { 4001: 5, 4003: 5 },
            comentario: "Excelente colega, sempre disposto a ajudar."
          },
          {
            avaliadorId: 1003,
            avaliadorNome: "Ana Costa",
            data: "04/05/2026",
            notas: { 4001: 4, 4003: 5 },
            comentario: "Professor muito competente e atencioso."
          }
        ]
      },
      {
        id: 5002,
        nome: "Avaliação 180° - Ana Costa",
        avaliado: "Ana Costa",
        avaliadoId: 1003,
        tipo: "estagiario",
        inicio: "01/05/2026",
        fim: "15/05/2026",
        status: "ativa",
        competencias: [
          { id: 4002, nome: "Trabalho em Equipe" }
        ],
        avaliadores: [
          { id: 1001, nome: "Prof. João Silva", tipo: "superior", respondeu: true },
          { id: 1004, nome: "Carlos Oliveira", tipo: "par", respondeu: false }
        ],
        respostas: [
          {
            avaliadorId: 1001,
            avaliadorNome: "Prof. João Silva",
            data: "05/05/2026",
            notas: { 4002: 5 },
            comentario: "Estagiária exemplar, muito dedicada."
          }
        ]
      }
    ];

    // Salva os dados
    if (!dados.temContatos) {
      localStorage.setItem('contatos', JSON.stringify(contatosExemplo));
      console.log('✅ Contatos carregados:', contatosExemplo.length);
    }

    if (!dados.temAvaliacoes) {
      localStorage.setItem('avaliacoes', JSON.stringify(avaliacoesExemplo));
      console.log('✅ Avaliações carregadas:', avaliacoesExemplo.length);
    }

    if (!dados.temNineBox) {
      localStorage.setItem('nineBoxAvaliacoes', JSON.stringify(nineBoxExemplo));
      console.log('✅ Nine Box carregado:', nineBoxExemplo.length);
    }

    // Sempre atualiza competências (não verifica se existe)
    const competenciasAtuais = JSON.parse(localStorage.getItem('competencias') || '[]');
    if (competenciasAtuais.length === 0) {
      localStorage.setItem('competencias', JSON.stringify(competenciasExemplo));
      console.log('✅ Competências carregadas:', competenciasExemplo.length);
    }

    // Sempre atualiza avaliações 180° (não verifica se existe)
    const avaliacoes180Atuais = JSON.parse(localStorage.getItem('avaliacoes180') || '[]');
    if (avaliacoes180Atuais.length === 0) {
      localStorage.setItem('avaliacoes180', JSON.stringify(avaliacoes180Exemplo));
      console.log('✅ Avaliações 180° carregadas:', avaliacoes180Exemplo.length);
    }

    console.log('✅ Dados de exemplo carregados com sucesso!');
  }

  // Carrega os dados ao iniciar
  carregarDadosSeNecessario();

})();
