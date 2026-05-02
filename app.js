// ═══════════════════════════════════════════
// NEXO 2.0 — app.js
// Sistema Operacional Pessoal
// ═══════════════════════════════════════════

const STORAGE_KEY = "nexo.v20";

// ── ESTADO GLOBAL ──
let state = {
  user: { name: "", vaultName: "MeuVault", vaultFolder: "Nexo" },
  today: {
    date: "",
    energy: 5,
    focus: 5,
    mood: 5,
    risk: "nenhum",
    focusText: "",
    checkedIn: false,
    lastDump: "",
    lastResponse: ""
  },
  memory: "",
  history: []   // array de check-ins anteriores
};

// ── LOAD / SAVE ──

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved) {
      state = deepMerge(state, saved);
    }
  } catch (e) {
    console.error("NEXO: erro ao carregar estado", e);
  }

  // Se a data salva não é hoje, abre dia novo (preserva histórico e memória)
  const todayStr = getTodayStr();
  if (state.today.date !== todayStr) {
    if (state.today.checkedIn) {
      archiveToday();
    }
    resetToday(todayStr);
  }

  applyState();
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function deepMerge(target, source) {
  const out = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      out[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      out[key] = source[key];
    }
  }
  return out;
}

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

function archiveToday() {
  // Evita duplicatas
  if (!state.history.find(h => h.date === state.today.date)) {
    state.history.unshift({ ...state.today });
    // Guarda só 90 dias
    if (state.history.length > 90) state.history.pop();
  }
}

function resetToday(dateStr) {
  state.today = {
    date: dateStr,
    energy: 5,
    focus: 5,
    mood: 5,
    risk: "nenhum",
    focusText: "",
    checkedIn: false,
    lastDump: "",
    lastResponse: ""
  };
}

// ── APPLY STATE → UI ──

function applyState() {
  // Header
  const todayDate = document.getElementById("todayDate");
  if (todayDate) {
    todayDate.textContent = new Intl.DateTimeFormat("pt-BR", { dateStyle: "full" }).format(new Date());
  }

  // Sliders
  setSlider("energySlider", "energyVal", state.today.energy);
  setSlider("focusSlider",  "focusVal",  state.today.focus);
  setSlider("moodSlider",   "moodVal",   state.today.mood);

  const riskSel = document.getElementById("riskSelect");
  if (riskSel) riskSel.value = state.today.risk;

  const focusTxt = document.getElementById("focusText");
  if (focusTxt) focusTxt.value = state.today.focusText;

  const dumpTxt = document.getElementById("dumpTextarea");
  if (dumpTxt) dumpTxt.value = state.today.lastDump;

  // Memória
  const memTxt = document.getElementById("memoryTextarea");
  if (memTxt) memTxt.value = state.memory;

  // Config
  const userName = document.getElementById("userName");
  if (userName) userName.value = state.user.name;
  const vaultName = document.getElementById("vaultNameInput");
  if (vaultName) vaultName.value = state.user.vaultName;
  const vaultFolder = document.getElementById("vaultFolder");
  if (vaultFolder) vaultFolder.value = state.user.vaultFolder;

  // Score
  updateScore();

  // Streak
  updateStreak();

  // Insights
  renderInsights();

  // Alerta preditivo
  renderPredictiveAlert();

  // Histórico
  renderHistory();
}

function setSlider(sliderId, valId, value) {
  const slider = document.getElementById(sliderId);
  const valEl  = document.getElementById(valId);
  if (slider) slider.value = value;
  if (valEl)  valEl.textContent = value;
}

// ── SCORE ──

function calcScore() {
  let s = 0;
  if (state.today.checkedIn)             s += 30;
  if (state.today.focusText)             s += 25;
  if (state.today.risk !== "nenhum")     s += 15;
  s += Math.round((state.today.energy / 10) * 15);
  s += Math.round((state.today.mood   / 10) * 15);
  return Math.min(s, 100);
}

function updateScore() {
  const score = calcScore();
  const fill  = document.getElementById("scoreFill");
  const num   = document.getElementById("scoreNum");
  if (!fill || !num) return;

  const circ   = 163.4;
  const offset = circ - (score / 100) * circ;
  fill.style.strokeDashoffset = offset;
  num.textContent = score;

  const color =
    score < 35 ? "var(--coral)" :
    score < 65 ? "var(--amber)" :
    "var(--cyan)";

  fill.style.stroke = color;
  num.style.color   = color;
}

// ── STREAK ──

function updateStreak() {
  let streak = 0;
  const today = getTodayStr();

  // Conta dias consecutivos com check-in (inclui hoje se fez)
  const allDays = [...state.history];
  if (state.today.checkedIn) allDays.unshift({ date: today, checkedIn: true });

  const checkedDates = new Set(allDays.filter(d => d.checkedIn).map(d => d.date));
  let cur = new Date();

  while (true) {
    const ds = cur.toISOString().split("T")[0];
    if (checkedDates.has(ds)) {
      streak++;
      cur.setDate(cur.getDate() - 1);
    } else {
      break;
    }
  }

  const el = document.getElementById("sidebarStreak");
  if (el) el.textContent = streak;
}

// ── INSIGHTS DO DIA ──

function renderInsights() {
  const grid = document.getElementById("insightsGrid");
  if (!grid) return;

  const e = state.today.energy;
  const f = state.today.focus;
  const r = state.today.risk;
  const name = state.user.name ? state.user.name.split(" ")[0] : null;

  const greeting = name ? `Olá, ${name}.` : "";

  let nextAction = state.today.focusText
    ? `Avance 10 min em: ${state.today.focusText}`
    : "Defina um foco principal";

  let variance = "";
  if (e <= 3 && r !== "nenhum") {
    variance = `⚠ Energia crítica + risco ${r}. Corte o plano pela metade.`;
  } else if (e >= 8 && f >= 7) {
    variance = "✦ Janela de alta performance. Priorize trabalho profundo.";
  } else if (e <= 4) {
    variance = "Energia baixa. Proteção > ambição hoje.";
  } else {
    variance = "Condições normais. Siga o plano.";
  }

  const cards = [
    { label: "Próxima ação", value: nextAction },
    { label: "Risco", value: r !== "nenhum" ? `Vigiar: ${r}` : "Nenhum definido" },
    { label: "Leitura do sistema", value: variance }
  ];

  grid.innerHTML = cards.map(c => `
    <div class="insight-item">
      <div class="i-label">${c.label}</div>
      <div class="i-value">${c.value}</div>
    </div>
  `).join("");
}

// ── ALERTA PREDITIVO ──

function renderPredictiveAlert() {
  const card    = document.getElementById("alertCard");
  const content = document.getElementById("alertContent");
  if (!card || !content) return;

  const alert = generatePredictiveAlert();
  if (alert) {
    content.textContent = alert;
    card.style.display = "block";
  } else {
    card.style.display = "none";
  }
}

function generatePredictiveAlert() {
  if (state.history.length < 5) return null;

  const e = state.today.energy;
  const r = state.today.risk;
  const dow = new Date().getDay(); // 0=dom,...,6=sab
  const dayNames = ["dom","seg","ter","qua","qui","sex","sab"];

  // Analisa histórico: mesmo dia da semana
  const sameDow = state.history.filter(h => {
    const d = new Date(h.date + "T12:00:00");
    return d.getDay() === dow;
  });

  if (sameDow.length >= 2) {
    const avgEnergy = avg(sameDow.map(h => h.energy));
    if (avgEnergy <= 4 && e >= 7) {
      return `⚡ Padrão detectado: suas ${dayNames[dow]}s costumam ter energia baixa (média ${avgEnergy.toFixed(1)}). Aproveite enquanto está em ${e}/10.`;
    }
  }

  // Sequência de energia baixa
  const last3 = state.history.slice(0, 3);
  if (last3.length === 3 && last3.every(h => h.energy <= 4)) {
    return `📉 3 dias seguidos com energia ≤4. Considere descanso ativo hoje — o sistema está em recuperação.`;
  }

  // Risco recorrente
  if (r !== "nenhum") {
    const sameRisk = state.history.filter(h => h.risk === r);
    if (sameRisk.length >= 3) {
      return `🔁 "${r}" apareceu como risco em ${sameRisk.length} dos últimos dias. Isso pode ser um padrão estrutural, não pontual.`;
    }
  }

  // Edge positivo
  if (e >= 8 && state.today.focus >= 7) {
    const highDays = state.history.filter(h => h.energy >= 8).length;
    return `✦ Energia alta hoje (${e}/10). Nos últimos registros, dias assim foram ${highDays}. Use bem esse edge.`;
  }

  return null;
}

function avg(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// ── HISTÓRICO ──

function renderHistory() {
  const list = document.getElementById("historyList");
  if (!list) return;

  const items = state.history.slice(0, 30);

  if (!items.length) {
    list.innerHTML = `<p class="helper-text">Nenhum check-in registrado ainda. Comece hoje!</p>`;
    return;
  }

  list.innerHTML = items.map(h => {
    const d = new Date(h.date + "T12:00:00");
    const dateStr = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    const dayStr  = d.toLocaleDateString("pt-BR", { weekday: "short" });
    return `
      <div class="history-item">
        <span class="history-date">${dayStr} ${dateStr}</span>
        <span class="history-focus">${h.focusText || "—"}</span>
        <span class="history-badge badge-energy">⚡${h.energy}</span>
        <span class="history-badge badge-risk">${h.risk !== "nenhum" ? h.risk : "—"}</span>
        <span class="history-badge badge-score">${calcScoreFor(h)}%</span>
      </div>`;
  }).join("");
}

function calcScoreFor(h) {
  let s = 0;
  if (h.checkedIn)            s += 30;
  if (h.focusText)            s += 25;
  if (h.risk !== "nenhum")    s += 15;
  s += Math.round((h.energy / 10) * 15);
  s += Math.round((h.mood   / 10) * 15);
  return Math.min(s, 100);
}

// ═══════════════════════════════════════════
// GRÁFICOS — VIEW PADRÕES
// ═══════════════════════════════════════════

let lineChartInstance = null;

function renderPatterns() {
  renderLineChart();
  renderHeatmap();
  renderPatternInsights();
  renderAverages();
}

function renderLineChart() {
  const canvas = document.getElementById("lineChart");
  if (!canvas) return;

  const data = state.history.slice(0, 30).reverse();

  if (lineChartInstance) lineChartInstance.destroy();

  if (data.length === 0) {
    canvas.style.display = "none";
    return;
  }
  canvas.style.display = "block";

  const labels  = data.map(h => {
    const d = new Date(h.date + "T12:00:00");
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  });

  lineChartInstance = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Energia",
          data: data.map(h => h.energy),
          borderColor: "#00e5ff",
          backgroundColor: "rgba(0,229,255,0.06)",
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: "#00e5ff"
        },
        {
          label: "Foco",
          data: data.map(h => h.focus),
          borderColor: "#b388ff",
          backgroundColor: "rgba(179,136,255,0.06)",
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: "#b388ff"
        },
        {
          label: "Humor",
          data: data.map(h => h.mood),
          borderColor: "#69ff47",
          backgroundColor: "rgba(105,255,71,0.06)",
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: "#69ff47"
        }
      ]
    },
    options: {
      responsive: true,
      interaction: { mode: "index", intersect: false },
      plugins: { legend: { display: false } },
      scales: {
        x: {
          ticks: { color: "#3d4a7a", font: { family: "Space Mono", size: 10 }, maxRotation: 0 },
          grid: { color: "rgba(255,255,255,0.03)" }
        },
        y: {
          min: 0, max: 10,
          ticks: { color: "#3d4a7a", font: { family: "Space Mono", size: 10 }, stepSize: 2 },
          grid: { color: "rgba(255,255,255,0.04)" }
        }
      }
    }
  });
}

function renderHeatmap() {
  const wrap = document.getElementById("heatmapWrap");
  if (!wrap) return;

  const dias    = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
  const risks   = ["alimentacao","impulsos","gastos","procrastinacao","sono","treino","nenhum"];
  const riskNames = { alimentacao:"Aliment.",impulsos:"Impulsos",gastos:"Gastos",procrastinacao:"Procrast.",sono:"Sono",treino:"Treino",nenhum:"Sem risco" };

  // Monta matriz: risk × day_of_week → count
  const matrix = {};
  risks.forEach(r => { matrix[r] = Array(7).fill(0); });

  state.history.forEach(h => {
    const d = new Date(h.date + "T12:00:00");
    const dow = d.getDay();
    const r   = h.risk || "nenhum";
    if (matrix[r]) matrix[r][dow]++;
  });

  // Encontra max para normalizar cor
  let maxVal = 1;
  risks.forEach(r => { matrix[r].forEach(v => { if (v > maxVal) maxVal = v; }); });

  let html = `<table class="heatmap-table">
    <thead><tr><th></th>${dias.map(d => `<th>${d}</th>`).join("")}</tr></thead>
    <tbody>`;

  risks.filter(r => r !== "nenhum").forEach(r => {
    html += `<tr><td style="font-family:var(--font-mono);font-size:0.62rem;color:var(--text3);padding:4px 8px 4px 0;white-space:nowrap">${riskNames[r]}</td>`;
    matrix[r].forEach(v => {
      const intensity = maxVal > 0 ? v / maxVal : 0;
      const alpha     = 0.1 + intensity * 0.85;
      const bg        = v === 0
        ? "var(--surface2)"
        : `rgba(255,107,87,${alpha})`;
      const tc        = v === 0 ? "var(--text3)" : "#fff";
      html += `<td class="heatmap-cell" style="background:${bg};color:${tc}">${v || "·"}</td>`;
    });
    html += `</tr>`;
  });

  html += `</tbody></table>`;
  wrap.innerHTML = html;
}

function renderPatternInsights() {
  const grid = document.getElementById("patternsGrid");
  if (!grid) return;

  const patterns = detectPatterns();

  if (!patterns.length) {
    grid.innerHTML = `<p class="helper-text">Registre pelo menos 7 check-ins para detectar padrões.</p>`;
    return;
  }

  grid.innerHTML = patterns.map(p => `
    <div class="pattern-item">
      <span class="pattern-icon">${p.icon}</span>
      <span class="pattern-text">${p.text}</span>
    </div>`).join("");
}

function detectPatterns() {
  const h = state.history;
  if (h.length < 5) return [];

  const patterns = [];

  // Padrão 1: dia da semana com energia baixa
  const byDow = Array.from({ length: 7 }, (_, i) => {
    const days = h.filter(d => new Date(d.date + "T12:00:00").getDay() === i);
    return { dow: i, avg: days.length ? avg(days.map(d => d.energy)) : null, count: days.length };
  });
  const dowNames = ["Domingos","Segundas","Terças","Quartas","Quintas","Sextas","Sábados"];
  byDow.filter(d => d.count >= 2 && d.avg !== null && d.avg <= 4).forEach(d => {
    patterns.push({ icon: "📉", text: `<strong>${dowNames[d.dow]}</strong> têm energia média de ${d.avg.toFixed(1)}/10. Planeje menos para esse dia.` });
  });

  // Padrão 2: risco mais frequente
  const riskCount = {};
  h.forEach(d => { if (d.risk !== "nenhum") riskCount[d.risk] = (riskCount[d.risk] || 0) + 1; });
  const topRisk = Object.entries(riskCount).sort((a, b) => b[1] - a[1])[0];
  if (topRisk && topRisk[1] >= 3) {
    patterns.push({ icon: "🔁", text: `<strong>${topRisk[0]}</strong> apareceu ${topRisk[1]}x como risco principal. Pode ser um padrão estrutural.` });
  }

  // Padrão 3: correlação energia x foco
  const highEnergy = h.filter(d => d.energy >= 7);
  const lowEnergy  = h.filter(d => d.energy <= 4);
  if (highEnergy.length >= 3 && lowEnergy.length >= 3) {
    const avgFocusHigh = avg(highEnergy.map(d => d.focus));
    const avgFocusLow  = avg(lowEnergy.map(d => d.focus));
    if (avgFocusHigh - avgFocusLow >= 2) {
      patterns.push({ icon: "⚡", text: `Quando sua energia está alta (≥7), seu foco também sobe — média de <strong>${avgFocusHigh.toFixed(1)}</strong> vs <strong>${avgFocusLow.toFixed(1)}</strong>. Energia é o gatilho do foco.` });
    }
  }

  // Padrão 4: tendência de humor
  if (h.length >= 7) {
    const recent = h.slice(0, 7);
    const older  = h.slice(7, 14);
    if (older.length >= 3) {
      const moodRecent = avg(recent.map(d => d.mood));
      const moodOlder  = avg(older.map(d => d.mood));
      if (moodRecent - moodOlder >= 1.5) {
        patterns.push({ icon: "📈", text: `Humor em tendência de alta — média de <strong>${moodRecent.toFixed(1)}</strong> na última semana vs <strong>${moodOlder.toFixed(1)}</strong> na anterior.` });
      } else if (moodOlder - moodRecent >= 1.5) {
        patterns.push({ icon: "📉", text: `Humor em queda — média de <strong>${moodRecent.toFixed(1)}</strong> na última semana vs <strong>${moodOlder.toFixed(1)}</strong> na anterior. Vale atenção.` });
      }
    }
  }

  // Padrão 5: sequência de dias sem check-in
  if (h.length >= 2) {
    const dates = h.map(d => new Date(d.date + "T12:00:00").getTime()).sort((a,b) => b - a);
    let maxGap = 0;
    for (let i = 0; i < dates.length - 1; i++) {
      const gap = Math.round((dates[i] - dates[i+1]) / 86400000);
      if (gap > maxGap) maxGap = gap;
    }
    if (maxGap >= 3) {
      patterns.push({ icon: "🕳", text: `Maior lacuna detectada: <strong>${maxGap} dias</strong> sem check-in. Consistência gera padrões mais ricos.` });
    }
  }

  return patterns;
}

function renderAverages() {
  const grid = document.getElementById("averagesGrid");
  if (!grid) return;

  const last7 = state.history.slice(0, 7);

  if (!last7.length) {
    grid.innerHTML = `<p class="helper-text">Sem dados suficientes ainda.</p>`;
    return;
  }

  const items = [
    { label: "Energia",  value: avg(last7.map(h => h.energy)).toFixed(1) },
    { label: "Foco",     value: avg(last7.map(h => h.focus)).toFixed(1) },
    { label: "Humor",    value: avg(last7.map(h => h.mood)).toFixed(1) },
    { label: "Score",    value: Math.round(avg(last7.map(h => calcScoreFor(h)))) + "%" }
  ];

  grid.innerHTML = items.map(i => `
    <div class="avg-item">
      <div class="avg-num">${i.value}</div>
      <div class="avg-label">${i.label}</div>
    </div>`).join("");
}

// ═══════════════════════════════════════════
// IA — INTEGRAÇÃO CLAUDE API
// ═══════════════════════════════════════════

function buildContext() {
  const name = state.user.name ? `Nome do usuário: ${state.user.name}\n` : "";
  const memory = state.memory
    ? `\nMemória histórica:\n${state.memory}\n`
    : "";
  return `${name}Contexto do sistema NEXO:
- Data: ${state.today.date}
- Energia: ${state.today.energy}/10
- Foco: ${state.today.focus}/10
- Humor: ${state.today.mood}/10
- Risco do dia: ${state.today.risk}
- Foco principal: ${state.today.focusText || "não definido"}
${memory}`;
}

const PROMPTS = {
  plan(dump) {
    return `${buildContext()}
Despejo mental:
${dump}

Transforme esse despejo mental em um plano operacional claro para hoje.
Organize em seções: AGORA, DEPOIS, EVITAR, REGISTRAR.
Seja direto, use bullets curtos, priorize o que reduz fricção. Máximo 200 palavras.`;
  },
  risk(dump) {
    return `${buildContext()}
Despejo mental:
${dump}

Analise como sinais de risco. Procure gatilhos de impulso, procrastinação, sobrecarga, gastos impulsivos.
Responda com três seções: ALERTA, CAUSA PROVÁVEL, DEFESA PRÁTICA.
Seja preciso e conciso.`;
  },
  memory(dump) {
    return `${buildContext()}
Despejo mental:
${dump}

Extraia somente aprendizados duradouros para guardar na memória pessoal.
Responda APENAS com bullets começando com •. Sem introdução, sem conclusão. Máximo 5 bullets curtos.`;
  },
  reflect(dump) {
    return `${buildContext()}
Despejo mental:
${dump}

Faça uma reflexão profunda sobre o que esse despejo revela sobre padrões, crenças ou bloqueios do usuário.
Tom: direto, sem julgamento, como um coach experiente. Máximo 150 palavras.`;
  }
};

async function callClaude(type) {
  const dump = document.getElementById("dumpTextarea").value.trim();
  if (!dump) {
    flashElement("dumpTextarea");
    return;
  }

  state.today.lastDump = dump;
  saveState();

  const statusBar  = document.getElementById("aiStatus");
  const statusText = document.getElementById("aiStatusText");
  const responseEl = document.getElementById("aiResponse");
  const textEl     = document.getElementById("aiResponseText");
  const labelEl    = document.getElementById("aiResponseLabel");
  const saveBtn    = document.getElementById("btnSaveToMemory");

  const labels = { plan: "Planejando", risk: "Analisando risco", memory: "Extraindo memória", reflect: "Refletindo" };

  statusBar.style.display = "flex";
  statusText.textContent  = labels[type] + "...";
  responseEl.style.display = "block";
  labelEl.textContent      = labels[type].toUpperCase();
  textEl.innerHTML         = '<span class="cursor"></span>';
  saveBtn.style.display    = "none";

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        stream: true,
        messages: [{ role: "user", content: PROMPTS[type](dump) }]
      })
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${resp.status}`);
    }

    const reader  = resp.body.getReader();
    const decoder = new TextDecoder();
    let fullText  = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      for (const line of chunk.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === "content_block_delta" && parsed.delta?.text) {
            fullText += parsed.delta.text;
            textEl.innerHTML = fullText.replace(/\n/g, "<br>") + '<span class="cursor"></span>';
          }
        } catch (_) {}
      }
    }

    textEl.innerHTML = fullText.replace(/\n/g, "<br>");
    statusText.textContent = "✓ pronto";
    state.today.lastResponse = fullText;
    saveState();

    // Mostra botão "Salvar na memória" se for analysis de memória
    if (type === "memory") {
      saveBtn.style.display = "block";
      saveBtn.onclick = () => {
        appendToMemory(fullText);
        saveBtn.textContent = "✓ Salvo!";
        setTimeout(() => {
          saveBtn.textContent = "+ Salvar na memória";
        }, 2000);
      };
    }

  } catch (err) {
    textEl.innerHTML = `<span style="color:var(--coral)">Erro: ${err.message}</span>`;
    statusText.textContent = "erro";
    console.error("NEXO IA error:", err);
  }
}

function appendToMemory(text) {
  const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
  const separator = `\n\n— ${today} —\n`;
  state.memory = state.memory
    ? state.memory + separator + text
    : text;

  const memTxt = document.getElementById("memoryTextarea");
  if (memTxt) memTxt.value = state.memory;
  saveState();
  updateScore();
}

// ═══════════════════════════════════════════
// MICROFONE
// ═══════════════════════════════════════════

function setupMic() {
  const btn   = document.getElementById("micBtn");
  const input = document.getElementById("dumpTextarea");
  if (!btn) return;

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { btn.style.display = "none"; return; }

  const rec = new SR();
  rec.lang  = "pt-BR";
  rec.interimResults = true;
  let recording = false;

  btn.addEventListener("click", () => {
    if (recording) rec.stop(); else rec.start();
  });

  rec.onstart = () => {
    recording = true;
    btn.textContent = "⏹";
    btn.classList.add("recording");
  };
  rec.onresult = e => {
    input.value = Array.from(e.results).map(r => r[0].transcript).join("");
  };
  rec.onend = () => {
    recording = false;
    btn.textContent = "🎙";
    btn.classList.remove("recording");
  };
}

// ═══════════════════════════════════════════
// EXPORTAÇÃO OBSIDIAN
// ═══════════════════════════════════════════

function exportObsidian() {
  const dateStr  = state.today.date || getTodayStr();
  const vault    = state.user.vaultName || "MeuVault";
  const folder   = state.user.vaultFolder || "Nexo";
  const response = document.getElementById("aiResponseText")?.textContent || state.today.lastResponse || "";

  const md = `---
tags: [nexo/diario${state.today.risk !== "nenhum" ? `, risco/${state.today.risk}` : ""}]
energia: ${state.today.energy}
foco_nivel: ${state.today.focus}
humor: ${state.today.mood}
foco: "${state.today.focusText || "Não definido"}"
score: ${calcScore()}
data: ${dateStr}
---

# NEXO OS — ${dateStr}

## Sistema do Dia
| Campo | Valor |
|---|---|
| Energia | ${state.today.energy}/10 |
| Foco | ${state.today.focus}/10 |
| Humor | ${state.today.mood}/10 |
| Risco | ${state.today.risk} |
| Score | ${calcScore()}% |

## Foco Principal
${state.today.focusText || "*Não definido.*"}

## Despejo Mental
${state.today.lastDump || "*Nenhum registro.*"}

## Análise do Copiloto
${response || "*Nenhuma análise gerada.*"}

## Memória e Aprendizados
${state.memory || "*Nenhuma memória consolidada.*"}
`;

  const uri = `obsidian://new?vault=${encodeURIComponent(vault)}&file=${encodeURIComponent(folder + "/" + dateStr)}&content=${encodeURIComponent(md)}`;
  window.open(uri, "_self");
}

// ═══════════════════════════════════════════
// EXPORT JSON
// ═══════════════════════════════════════════

function exportJSON() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `nexo-backup-${getTodayStr()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════
// NAVEGAÇÃO
// ═══════════════════════════════════════════

function navigateTo(viewId) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));

  const view = document.getElementById(`view-${viewId}`);
  const btn  = document.querySelector(`[data-view="${viewId}"]`);
  if (view) view.classList.add("active");
  if (btn)  btn.classList.add("active");

  if (viewId === "padroes") renderPatterns();
  if (viewId === "memoria") renderHistory();
}

// ═══════════════════════════════════════════
// UTILITÁRIOS
// ═══════════════════════════════════════════

function flashElement(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.borderColor = "var(--coral)";
  el.focus();
  setTimeout(() => (el.style.borderColor = ""), 1200);
}

function showDialog(title, msg, onConfirm) {
  document.getElementById("dialogTitle").textContent   = title;
  document.getElementById("dialogMsg").textContent     = msg;
  document.getElementById("overlay").style.display     = "flex";
  document.getElementById("dialogConfirm").onclick = () => {
    closeDialog();
    onConfirm();
  };
}

function closeDialog() {
  document.getElementById("overlay").style.display = "none";
}

// ═══════════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════════

function setupListeners() {
  // NAV
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => navigateTo(btn.dataset.view));
  });

  // SLIDERS CHECK-IN
  ["energy", "focus", "mood"].forEach(key => {
    const slider = document.getElementById(`${key}Slider`);
    const valEl  = document.getElementById(`${key}Val`);
    if (slider) {
      slider.addEventListener("input", e => {
        if (valEl) valEl.textContent = e.target.value;
      });
    }
  });

  // SALVAR CHECK-IN
  document.getElementById("saveCheckinBtn")?.addEventListener("click", () => {
    state.today.energy    = Number(document.getElementById("energySlider").value);
    state.today.focus     = Number(document.getElementById("focusSlider").value);
    state.today.mood      = Number(document.getElementById("moodSlider").value);
    state.today.risk      = document.getElementById("riskSelect").value;
    state.today.focusText = document.getElementById("focusText").value.trim();
    state.today.checkedIn = true;
    saveState();
    updateScore();
    updateStreak();
    renderInsights();
    renderPredictiveAlert();

    const btn = document.getElementById("saveCheckinBtn");
    btn.textContent = "✓ Check-in registrado!";
    setTimeout(() => (btn.textContent = "Registrar check-in"), 2000);
  });

  // BOTÕES IA
  document.getElementById("btnPlan")?.addEventListener("click",    () => callClaude("plan"));
  document.getElementById("btnRisk")?.addEventListener("click",    () => callClaude("risk"));
  document.getElementById("btnMemory")?.addEventListener("click",  () => callClaude("memory"));
  document.getElementById("btnReflect")?.addEventListener("click", () => callClaude("reflect"));

  // RESET DIA
  document.getElementById("resetDayBtn")?.addEventListener("click", () => {
    showDialog(
      "Reiniciar o dia?",
      "Apaga o check-in e o despejo de hoje. Memória e histórico são preservados.",
      () => {
        if (state.today.checkedIn) archiveToday();
        resetToday(getTodayStr());
        saveState();
        applyState();
      }
    );
  });

  // SALVAR MEMÓRIA
  document.getElementById("saveMemoryBtn")?.addEventListener("click", () => {
    state.memory = document.getElementById("memoryTextarea").value;
    saveState();
    updateScore();
    const btn = document.getElementById("saveMemoryBtn");
    btn.textContent = "✓ Salvo";
    setTimeout(() => (btn.textContent = "Salvar memória"), 1800);
  });

  // OBSIDIAN EXPORT
  document.getElementById("exportObsidian")?.addEventListener("click", exportObsidian);

  // CONFIG
  document.getElementById("userName")?.addEventListener("input", e => {
    state.user.name = e.target.value;
    saveState();
  });
  document.getElementById("vaultNameInput")?.addEventListener("input", e => {
    state.user.vaultName = e.target.value;
    saveState();
  });
  document.getElementById("vaultFolder")?.addEventListener("input", e => {
    state.user.vaultFolder = e.target.value;
    saveState();
  });

  // EXPORT JSON
  document.getElementById("exportJsonBtn")?.addEventListener("click", exportJSON);

  // NUKE
  document.getElementById("nukeBtn")?.addEventListener("click", () => {
    showDialog(
      "Apagar tudo?",
      "Remove todo o histórico, memória e configurações. Ação irreversível.",
      () => {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
      }
    );
  });

  // DIALOG
  document.getElementById("dialogCancel")?.addEventListener("click", closeDialog);
  document.getElementById("overlay")?.addEventListener("click", e => {
    if (e.target === document.getElementById("overlay")) closeDialog();
  });
}

// ═══════════════════════════════════════════
// BOOT
// ═══════════════════════════════════════════

document.addEventListener("DOMContentLoaded", () => {
  loadState();
  setupListeners();
  setupMic();
});
