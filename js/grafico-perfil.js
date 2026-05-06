// =============================================
// GRÁFICO RADAR — PERFIL
// =============================================

(function () {
  const CRITERIOS_RADAR = [
    { key: 'pontualidade',  label: 'Pontualidade' },
    { key: 'comunicacao',   label: 'Comunicação' },
    { key: 'tecnico',       label: 'Técnico' },
    { key: 'proatividade',  label: 'Proatividade' },
    { key: 'equipe',        label: 'Equipe' },
  ];

  function renderGraficoRadar(pessoa) {
    const wrap = document.getElementById('pf-grafico-wrap');
    const canvas = document.getElementById('pf-radar-canvas');
    if (!wrap || !canvas) return;

    // Busca avaliações recebidas pela pessoa
    const avaliacoes = (JSON.parse(localStorage.getItem('avaliacoes') || '[]'))
      .filter(a =>
        a.avaliado &&
        a.avaliado.toLowerCase() === pessoa.nome.toLowerCase() &&
        a.criterios
      );

    if (avaliacoes.length === 0) {
      wrap.style.display = 'none';
      return;
    }

    // Calcula médias por critério
    const medias = {};
    CRITERIOS_RADAR.forEach(c => {
      const vals = avaliacoes
        .map(a => a.criterios[c.key])
        .filter(v => v && v > 0);
      medias[c.key] = vals.length > 0
        ? vals.reduce((s, v) => s + v, 0) / vals.length
        : 0;
    });

    wrap.style.display = 'block';

    // Detecta dark mode
    const isDark = document.body.classList.contains('dark-mode');

    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const cx = W / 2;
    const cy = H / 2;
    const raio = Math.min(W, H) * 0.34;
    const n = CRITERIOS_RADAR.length;
    const niveis = 5; // máximo de estrelas

    // Cores adaptadas ao tema
    const corGrade    = isDark ? 'rgba(148,163,184,0.25)' : 'rgba(30,58,138,0.12)';
    const corFundo    = isDark ? 'rgba(30,58,138,0.18)'   : 'rgba(219,234,254,0.5)';
    const corDados    = isDark ? 'rgba(96,165,250,0.55)'  : 'rgba(59,130,246,0.35)';
    const corBorda    = isDark ? '#60a5fa'                 : '#3b82f6';
    const corLabel    = isDark ? '#cbd5e1'                 : '#1e3a8a';
    const corValor    = isDark ? '#93c5fd'                 : '#1d4ed8';
    const corPonto    = isDark ? '#93c5fd'                 : '#2563eb';

    // Ângulo de cada eixo (começa no topo)
    function angulo(i) {
      return (Math.PI * 2 * i) / n - Math.PI / 2;
    }

    function ponto(nivel, i) {
      const r = (nivel / niveis) * raio;
      const a = angulo(i);
      return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
    }

    // ---- POLÍGONOS DE GRADE ----
    for (let nv = 1; nv <= niveis; nv++) {
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const p = ponto(nv, i);
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.strokeStyle = corGrade;
      ctx.lineWidth = 1;
      ctx.stroke();
      if (nv === niveis) {
        ctx.fillStyle = corFundo;
        ctx.fill();
      }
    }

    // ---- LINHAS DOS EIXOS ----
    for (let i = 0; i < n; i++) {
      const p = ponto(niveis, i);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = corGrade;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // ---- POLÍGONO DE DADOS ----
    ctx.beginPath();
    CRITERIOS_RADAR.forEach((c, i) => {
      const val = medias[c.key];
      const r = (val / niveis) * raio;
      const a = angulo(i);
      const x = cx + r * Math.cos(a);
      const y = cy + r * Math.sin(a);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = corDados;
    ctx.fill();
    ctx.strokeStyle = corBorda;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // ---- PONTOS NOS VÉRTICES ----
    CRITERIOS_RADAR.forEach((c, i) => {
      const val = medias[c.key];
      const r = (val / niveis) * raio;
      const a = angulo(i);
      const x = cx + r * Math.cos(a);
      const y = cy + r * Math.sin(a);
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = corPonto;
      ctx.fill();
    });

    // ---- LABELS E VALORES ----
    ctx.font = '600 11px Poppins, Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    CRITERIOS_RADAR.forEach((c, i) => {
      const a = angulo(i);
      const labelR = raio + 28;
      const lx = cx + labelR * Math.cos(a);
      const ly = cy + labelR * Math.sin(a);

      ctx.fillStyle = corLabel;
      ctx.font = '600 11px Poppins, Inter, sans-serif';
      ctx.fillText(c.label, lx, ly);

      // Valor abaixo do label
      const val = medias[c.key];
      if (val > 0) {
        ctx.fillStyle = corValor;
        ctx.font = '700 10px Poppins, Inter, sans-serif';
        ctx.fillText(val.toFixed(1) + ' ★', lx, ly + 14);
      }
    });
  }

  // Expor globalmente
  window.renderGraficoRadar = renderGraficoRadar;
})();
