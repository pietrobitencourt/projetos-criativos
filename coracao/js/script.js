// ============================================================
//  Coração de "eu te amo" em vários idiomas
//  (versão para navegador do programa em Python/turtle)
//
//  Como funciona:
//   1. Calcula o formato do coração (mesma fórmula do Python).
//   2. Divide o coração em linhas horizontais e encaixa frases em cada
//      uma, medindo a largura real do texto para não haver sobreposição.
//   3. Anima: primeiro o contorno (girando a partir do topo), depois o
//      miolo. Cada frase surge brilhando e esmaece até o vermelho.
// ============================================================
(function () {
  "use strict";

  // ---------- CONFIGURAÇÕES (pode mexer) ----------
  const CFG = {
    bg: "#050008",                     // cor de fundo
    fontFamily: '"Segoe UI", system-ui, -apple-system, "Noto Sans", "Helvetica Neue", Arial, sans-serif',
    sizes: [12, 13, 15, 16, 17],       // tamanhos de letra (px) sorteados
    minPx: 9,                          // menor tamanho permitido (celulares)
    gap: 10,                           // espaço mínimo entre frases (px)
    rowGap: 1.0,                       // altura da linha (maior = mais afastadas)
    margin: 0.92,                      // quanto da tela o coração ocupa (0 a 1)

    // animação (1 quadro = 16 ms, ~60 quadros por segundo)
    outlineDelay: 4,                   // quadros entre frases do contorno
    interiorDelay: 2,                  // quadros entre frases do miolo
    fadeFrames: 24,                    // duração do brilho -> vermelho
    rise: 4,                           // quadros para "acender" até o brilho
    flash: [255, 220, 205],            // cor do brilho (R, G, B)

    // tocar/clicar no coração repete a animação? (true = sim, false = não)
    replayOnTap: false,

    colors: ["#ff1a3c", "#ff3355", "#ff5533", "#ff7a2f", "#e8103a"],
    seed: 11,                          // semente: o desenho sai sempre igual
    refWidth: 604,                     // largura de referência do coração (px)
  };

  const MS_PER_FRAME = 16;

  // ---------- ELEMENTOS ----------
  const canvas = document.getElementById("coracao");
  const ctx = canvas.getContext("2d");
  const msgEl = document.getElementById("mensagem");

  // ---------- UTILIDADES ----------
  // Gerador de números aleatórios com semente (resultado repetível)
  function makeRng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hexToRgb(hex) {
    return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  }

  function mix(c1, c2, f) {
    f = Math.max(0, Math.min(1, f));
    const c = c1.map((v, i) => Math.round(v + (c2[i] - v) * f));
    return "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")";
  }

  const BG_RGB = hexToRgb(CFG.bg);

  // ---------- FORMATO DO CORAÇÃO ----------
  function heartPoint(a) {
    const x = 16 * Math.pow(Math.sin(a), 3);
    const y =
      13 * Math.cos(a) -
      5 * Math.cos(2 * a) -
      2 * Math.cos(3 * a) -
      Math.cos(4 * a);
    return [x, y];
  }

  // Contorno já ajustado e centralizado na área disponível.
  // (y cresce para cima, como na matemática; na hora de desenhar invertemos)
  function buildOutline(W, H, hasMsg) {
    const raw = [];
    for (let i = 0; i < 720; i++) raw.push(heartPoint((2 * Math.PI * i) / 720));
    const xs = raw.map((p) => p[0]);
    const ys = raw.map((p) => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);

    const availW = W * CFG.margin;
    const availH = H * CFG.margin - (hasMsg ? H * 0.08 : 0);
    const sc = Math.min(availW / (maxX - minX), availH / (maxY - minY));
    const cx = (maxX + minX) / 2;
    const cy = (maxY + minY) / 2;

    return {
      poly: raw.map((p) => [(p[0] - cx) * sc, (p[1] - cy) * sc]),
      width: (maxX - minX) * sc,
      shiftY: hasMsg ? -H * 0.03 : 0, // sobe um pouco para caber a mensagem
    };
  }

  // Trechos [esquerda, direita] do coração na altura y
  function intervals(poly, y) {
    const xs = [];
    const n = poly.length;
    for (let i = 0; i < n; i++) {
      const [x1, y1] = poly[i];
      const [x2, y2] = poly[(i + 1) % n];
      if ((y1 <= y && y < y2) || (y2 <= y && y < y1)) {
        xs.push(x1 + ((y - y1) * (x2 - x1)) / (y2 - y1));
      }
    }
    xs.sort((a, b) => a - b);
    const out = [];
    for (let i = 0; i + 1 < xs.length; i += 2) out.push([xs[i], xs[i + 1]]);
    return out;
  }

  // Trechos da linha, garantindo que o texto não passe da borda
  function rowIntervals(poly, y, h) {
    const result = [];
    for (let [left, right] of intervals(poly, y)) {
      for (const other of [intervals(poly, y + h / 2), intervals(poly, y - h / 2)]) {
        let best = null, bestOv = 0;
        for (const [a, b] of other) {
          const ov = Math.min(b, right) - Math.max(a, left);
          if (ov > bestOv) { best = [a, b]; bestOv = ov; }
        }
        if (best) {
          left = Math.max(left, best[0]);
          right = Math.min(right, best[1]);
        }
      }
      if (right - left > 40) result.push([left + 4, right - 4]);
    }
    return result;
  }

  // ---------- MONTA A LISTA DE FRASES ----------
  function build(W, H) {
    const hasMsg = MENSAGEM.trim() !== "";
    const rng = makeRng(CFG.seed);
    const pick = (arr) => arr[Math.floor(rng() * arr.length)];
    const uniform = (a, b) => a + (b - a) * rng();

    const { poly, width: heartW, shiftY } = buildOutline(W, H, hasMsg);

    // tamanhos de letra proporcionais ao tamanho do coração
    const k = Math.max(0.5, Math.min(1.6, heartW / CFG.refWidth));
    const sizesPx = CFG.sizes.map((s) => Math.max(CFG.minPx, Math.round(s * k)));
    const rowH = Math.max(...sizesPx) * 1.3 * CFG.rowGap;

    // medida de texto (guardada em cache)
    const widths = new Map();
    function measure(text, px) {
      const key = text + "|" + px;
      if (!widths.has(key)) {
        ctx.font = "bold " + px + "px " + CFG.fontFamily;
        widths.set(key, ctx.measureText(text).width);
      }
      return widths.get(key);
    }

    // quantas vezes cada frase já foi usada (para todas aparecerem)
    const used = new Map(FRASES.map((p) => [p, 0]));
    function pickPhrase(already) {
      const pool = FRASES.filter((p) => !already.includes(p));
      const least = Math.min(...pool.map((p) => used.get(p)));
      return pick(pool.filter((p) => used.get(p) === least));
    }

    // sorteia frases e escolhe a combinação que melhor preenche a linha
    function packRow(width) {
      let best = null;
      for (let t = 0; t < 40; t++) {
        const row = [];
        let usedW = 0;
        for (;;) {
          const text = pickPhrase(row.map((r) => r.text));
          const px = pick(sizesPx);
          const w = measure(text, px);
          const need = row.length ? w + CFG.gap : w;
          if (usedW + need > width) break;
          row.push({ text, px, w });
          usedW += need;
        }
        if (row.length && (best === null || width - usedW < best.left)) {
          best = { left: width - usedW, row };
        }
      }
      if (!best) return [];
      best.row.forEach((r) => used.set(r.text, used.get(r.text) + 1));
      return best.row;
    }

    // linhas de cima para baixo
    let top = -Infinity, bottom = Infinity;
    for (const [, y] of poly) { top = Math.max(top, y); bottom = Math.min(bottom, y); }
    const ys = [];
    for (let y = top - rowH / 2; y > bottom + rowH / 3; y -= rowH) ys.push(y);

    const items = [];
    ys.forEach((y, n) => {
      for (const [left, right] of rowIntervals(poly, y, rowH)) {
        const row = packRow(right - left);
        if (!row.length) continue;
        const total = row.reduce((s, r) => s + r.w, 0);
        const gap = row.length > 1 ? (right - left - total) / (row.length - 1) : 0;
        let x = row.length > 1 ? left : (left + right - total) / 2;
        row.forEach((r, i) => {
          // contorno = primeira e última frase da linha + linhas das pontas
          const edge = i === 0 || i === row.length - 1 || n < 2 || n >= ys.length - 2;
          items.push({
            x: x + r.w / 2,
            y: y,
            text: r.text,
            px: r.px,
            rgb: hexToRgb(pick(CFG.colors)),
            edge,
          });
          x += r.w + gap;
        });
      }
    });

    // ---------- ORDEM E TEMPO DE APARIÇÃO ----------
    const outline = items.filter((it) => it.edge);
    const inside = items.filter((it) => !it.edge);
    // contorno: ângulo medido a partir do topo, no sentido horário
    const ang = (it) => (Math.atan2(it.x, it.y) + 2 * Math.PI) % (2 * Math.PI);
    outline.sort((a, b) => ang(a) - ang(b));
    // miolo: de cima para baixo, com uma "bagunça" para parecer natural
    inside.forEach((it) => (it.sortKey = -it.y + uniform(-2.2, 2.2) * rowH));
    inside.sort((a, b) => a.sortKey - b.sortKey);

    const plan = [];
    outline.forEach((it, i) => { it.start = i * CFG.outlineDelay; plan.push(it); });
    const base = outline.length * CFG.outlineDelay + 20;
    inside.forEach((it, j) => { it.start = base + j * CFG.interiorDelay; plan.push(it); });
    plan.sort((a, b) => a.start - b.start);

    const lastStart = plan.length ? plan[plan.length - 1].start : 0;
    return { plan, shiftY, endFrame: lastStart + CFG.fadeFrames };
  }

  // ---------- DESENHO ----------
  let W = 0, H = 0;
  let layout = null;
  let t0 = 0;
  let rafId = 0;

  function colorAt(age, rgb) {
    if (age < CFG.rise) return mix(BG_RGB, CFG.flash, age / CFG.rise);
    return mix(CFG.flash, rgb, (age - CFG.rise) / (CFG.fadeFrames - CFG.rise));
  }

  function draw(frame) {
    ctx.fillStyle = CFG.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const cx = W / 2;
    const cy = H / 2 + layout.shiftY;

    for (const it of layout.plan) {
      if (it.start > frame) break;
      const age = frame - it.start;
      ctx.font = "bold " + it.px + "px " + CFG.fontFamily;
      ctx.fillStyle = age >= CFG.fadeFrames
        ? "rgb(" + it.rgb[0] + "," + it.rgb[1] + "," + it.rgb[2] + ")"
        : colorAt(age, it.rgb);
      // no canvas o eixo Y cresce para baixo, por isso cy - y
      ctx.fillText(it.text, cx + it.x, cy - it.y);
    }
  }

  function loop(now) {
    const frame = (now - t0) / MS_PER_FRAME;
    draw(frame);
    if (frame >= layout.endFrame) {
      msgEl.classList.add("visivel");
      rafId = 0;
      return;
    }
    rafId = requestAnimationFrame(loop);
  }

  function start() {
    cancelAnimationFrame(rafId);
    msgEl.classList.remove("visivel");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {            // quem prefere menos movimento vê o coração pronto
      draw(layout.endFrame);
      msgEl.classList.add("visivel");
      return;
    }
    t0 = performance.now();
    rafId = requestAnimationFrame(loop);
  }

  function resize(replay) {
    const dpr = window.devicePixelRatio || 1;
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layout = build(W, H);
    if (replay) {
      start();
    } else {                 // animação já terminou: só redesenha o coração pronto
      cancelAnimationFrame(rafId);
      draw(layout.endFrame);
      msgEl.classList.add("visivel");
    }
  }

  // ---------- EVENTOS ----------
  msgEl.textContent = MENSAGEM;

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => resize(rafId !== 0), 150);
  });

  // tocar ou clicar repete a animação (só se replayOnTap estiver true)
  if (CFG.replayOnTap) {
    canvas.style.cursor = "pointer";
    canvas.addEventListener("click", () => resize(true));
  }

  // espera as fontes do sistema ficarem prontas e começa
  const ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  ready.then(() => resize(true));
})();
