
// ═══════════════════════════════════════════
// NEXO — corpo.js
// Plano Thales + API Key
// ═══════════════════════════════════════════

// ── PLANO COMPLETO ──

const PLANO = {
  days: [
    {
      dow: 1, label: "Segunda", name: "Peito + Tríceps", badge: "FOCO PEITO", rest: false,
      exercises: [
        { name: "Supino reto com barra",         sets: "4×8–10",    rest: "🔴 2–3 min" },
        { name: "Supino inclinado com halteres",  sets: "4×10",      rest: "🔴 2 min" },
        { name: "Crucifixo no cabo",              sets: "3×12",      rest: "🟢 60–90s" },
        { name: "Crossover alto → baixo",         sets: "3×12",      rest: "🟢 60–90s" },
        { name: "Tríceps corda",                  sets: "3×12",      rest: "⚪ 60s" },
        { name: "Tríceps testa barra W",          sets: "3×10",      rest: "⚪ 60s" }
      ]
    },
    {
      dow: 2, label: "Terça", name: "Perna — Quadríceps", badge: "FOCO PERNA", rest: false,
      exercises: [
        { name: "Agachamento livre",              sets: "4×8",       rest: "🔴 2–3 min" },
        { name: "Leg press 45°",                  sets: "4×12",      rest: "🟡 90s–2 min" },
        { name: "Cadeira extensora",              sets: "3×15",      rest: "🟢 60–90s" },
        { name: "Afundo com halteres",            sets: "3×10 cada", rest: "🟢 60–90s" },
        { name: "Panturrilha em pé",              sets: "4×15",      rest: "⚪ 45–60s" }
      ]
    },
    {
      dow: 3, label: "Quarta", name: "Costas + Bíceps", badge: "", rest: false,
      exercises: [
        { name: "Puxada frontal (pegada larga)",  sets: "4×10",      rest: "🟡 90s–2 min" },
        { name: "Remada curvada barra",           sets: "4×8",       rest: "🔴 2 min" },
        { name: "Remada unilateral com haltere",  sets: "3×10",      rest: "🟢 60–90s" },
        { name: "Puxada corda atrás do pescoço",  sets: "3×12",      rest: "🟢 60–90s" },
        { name: "Rosca direta barra",             sets: "3×10",      rest: "⚪ 60s" },
        { name: "Rosca martelo",                  sets: "3×12",      rest: "⚪ 60s" }
      ]
    },
    {
      dow: 4, label: "Quinta", name: "Pilates", badge: "", rest: true,
      icon: "🧘", restNote: "Foco na lombar · mobilidade · core"
    },
    {
      dow: 5, label: "Sexta", name: "Peito + Ombro", badge: "FOCO PEITO", rest: false,
      exercises: [
        { name: "Supino declinado",               sets: "4×10",      rest: "🔴 2 min" },
        { name: "Fly máquina (peck-deck)",        sets: "4×12",      rest: "🟢 60–90s" },
        { name: "Crossover baixo → alto",         sets: "3×15",      rest: "⚪ 60s" },
        { name: "Desenvolvimento com halteres",   sets: "4×10",      rest: "🟡 90s" },
        { name: "Elevação lateral",               sets: "3×15",      rest: "⚪ 45–60s" }
      ]
    },
    {
      dow: 6, label: "Sábado", name: "Perna — Posterior + Glúteo", badge: "FOCO PERNA", rest: false,
      exercises: [
        { name: "Stiff / RDL com halteres",       sets: "4×10",      rest: "🔴 2 min" },
        { name: "Cadeira flexora",                sets: "4×12",      rest: "🟢 60–90s" },
        { name: "Glúteo no cabo",                 sets: "3×15 cada", rest: "🟢 60s" },
        { name: "Agachamento sumô com haltere",   sets: "3×12",      rest: "🟡 90s" },
        { name: "Panturrilha sentado",            sets: "4×20",      rest: "⚪ 45s" }
      ]
    },
    {
      dow: 0, label: "Domingo", name: "Descanso", badge: "", rest: true,
      icon: "😴", restNote: "Recuperação ativa ou caminhada leve"
    }
  ],

  meals: [
    {
      time: "07:00 — Em casa", name: "Café da manhã reforçado",
      items: [
        { food: "Ovos mexidos / estrelados",    qty: "3 unid" },
        { food: "Aveia + Amaranto em flocos",   qty: "40g cada" },
        { food: "Banana",                       qty: "1 média" },
        { food: "Leite integral",               qty: "250ml" },
        { food: "Pasta de amendoim",            qty: "1 col. sopa" }
      ]
    },
    {
      time: "08:30 — Trabalho", name: "Lanche no trabalho",
      items: [
        { food: "Pão + café com leite",         qty: "como de costume" },
        { food: "Queijo / peito de peru",       qty: "bônus proteico" }
      ]
    },
    {
      time: "12:00 — Almoço", name: "Refeição principal",
      items: [
        { food: "Arroz branco ou integral",     qty: "200g cozido" },
        { food: "Feijão / lentilha",            qty: "100g cozido" },
        { food: "Frango ou carne magra",        qty: "200g" },
        { food: "Legumes refogados",            qty: "à vontade" },
        { food: "Azeite",                       qty: "1 col. sopa" }
      ]
    },
    {
      time: "16:00 — Pré-treino", name: "Lanche pré-treino (escolha 1)",
      items: [
        { food: "Whey + Hipercalórico",         qty: "1 scoop + 1 dose" },
        { food: "OU: Amaranto + Whey + Leite",  qty: "40g · 1 scoop · 250ml" },
        { food: "OU: Banana + Pasta amendoim",  qty: "1 unid · 2 col. sopa" }
      ]
    },
    {
      time: "19:00–20:00 — TREINO 🏋️", name: "Durante o treino",
      items: [
        { food: "Água",                         qty: "500ml–1L" },
        { food: "Banana se cair energia",       qty: "1 (opcional)" }
      ]
    },
    {
      time: "20:30 — Pós-treino", name: "Jantar + recuperação",
      items: [
        { food: "Whey protein",                 qty: "30–40g" },
        { food: "Arroz / macarrão / mandioca",  qty: "150g cozido" },
        { food: "Carne moída / frango / ovo",   qty: "180g" },
        { food: "Legumes ou salada",            qty: "à vontade" }
      ]
    },
    {
      time: "22:30 — Ceia", name: "Antes de dormir",
      items: [
        { food: "Iogurte grego integral",       qty: "200g" },
        { food: "Pasta de amendoim",            qty: "2 col. sopa" },
        { food: "Aveia",                        qty: "30g" },
        { food: "Mel",                          qty: "1 col. chá" }
      ]
    }
  ],

  principles: [
    { num: "01", title: "Coma mesmo sem fome",             text: "Para ectomorfo o problema nº1 é déficit calórico sem perceber. Use alarmes para as refeições." },
    { num: "02", title: "Carboidrato é seu aliado",        text: "Arroz, batata doce, macarrão, mandioca, aveia — não tenha medo. Energia pra hipertrofiar." },
    { num: "03", title: "Sono é treino",                   text: "7–9h de sono. Sem sono não há GH endógeno e o ectomorfo perde massa facilmente." },
    { num: "04", title: "Progressão de carga obrigatória", text: "A cada 1–2 semanas adicione peso ou mais uma rep. Sem progressão não há crescimento." },
    { num: "05", title: "Peito de pombo: contraia sempre", text: "Use conexão mente-músculo. Contraia o peitoral ativamente em cada repetição — mais que o peso." },
    { num: "06", title: "Lombar protegida",                text: "Ative o core antes de compostos. O pilates semanal já ajuda muito — não pare." }
  ]
};

// ── CORPO STATE ──

function initCorpoState() {
  if (!state.corpo) state.corpo = {};
  const weekKey = getWeekKey();
  if (state.corpo.currentWeek !== weekKey) {
    state.corpo.currentWeek = weekKey;
    state.corpo.weekDone    = {};
    state.corpo.exChecked   = {};
  }
  const todayKey = getTodayStr();
  if (state.corpo.mealDate !== todayKey) {
    state.corpo.mealDate    = todayKey;
    state.corpo.mealChecked = {};
  }
}

function getWeekKey() {
  const d   = new Date();
  const mon = new Date(d);
  mon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return mon.toISOString().split("T")[0];
}

// ── RENDER CORPO ──

function renderCorpo() {
  initCorpoState();
  renderWeekProgress();
  renderTrainDays();
  renderMeals();
  renderPrinciples();
}

function renderWeekProgress() {
  const wrap = document.getElementById("weekProgress");
  if (!wrap) return;
  const todayDow = new Date().getDay();
  const order    = [1,2,3,4,5,6,0];
  wrap.innerHTML = order.map(dow => {
    const day    = PLANO.days.find(d => d.dow === dow);
    const isDone = state.corpo.weekDone && state.corpo.weekDone[dow];
    const isRest = day.rest;
    const isToday= dow === todayDow;
    let cls = "week-day" + (isRest ? " rest" : "") + (isToday ? " today" : "") + (isDone ? " done" : "");
    const icon = isRest ? (day.icon || "😴") : (isDone ? "✓" : "🏋️");
    return `<div class="${cls}" onclick="toggleWeekDay(${dow})">
      <span class="wd-label">${day.label.slice(0,3)}</span>
      <span class="wd-icon">${icon}</span>
      ${isDone ? '<span class="wd-check">FEITO</span>' : ""}
    </div>`;
  }).join("");
}

function toggleWeekDay(dow) {
  const day = PLANO.days.find(d => d.dow === dow);
  if (day.rest) return;
  if (!state.corpo.weekDone) state.corpo.weekDone = {};
  state.corpo.weekDone[dow] = !state.corpo.weekDone[dow];
  saveState();
  renderWeekProgress();
}

function renderTrainDays() {
  const wrap = document.getElementById("trainDays");
  if (!wrap) return;
  const todayDow = new Date().getDay();
  const order    = [1,2,3,4,5,6,0];
  wrap.innerHTML = order.map(dow => {
    const day     = PLANO.days.find(d => d.dow === dow);
    const isToday = dow === todayDow;
    if (day.rest) {
      return `<div class="rest-day-block">
        <div class="rd-icon">${day.icon || "😴"}</div>
        <div class="rd-name">${day.label} — ${day.name}</div>
        <div class="rd-label">${day.restNote || ""}</div>
      </div>`;
    }
    const checked   = (state.corpo.exChecked && state.corpo.exChecked[dow]) || {};
    const total     = day.exercises.length;
    const doneCount = Object.values(checked).filter(Boolean).length;
    const isOpen    = isToday;
    return `<div class="train-day-block${isOpen ? " open" : ""}" id="tdb-${dow}">
      <div class="train-day-header" onclick="toggleTrainDay(${dow})">
        <div class="tdh-left">
          <span class="tdh-label">${day.label}${isToday ? " · HOJE" : ""}</span>
          <span class="tdh-name">${day.name}</span>
        </div>
        <div class="tdh-right">
          ${day.badge ? `<span class="tdh-badge">${day.badge}</span>` : ""}
          <span class="tdh-badge" style="background:rgba(105,255,71,0.1);color:var(--green);border-color:rgba(105,255,71,0.2)">${doneCount}/${total}</span>
          <span class="tdh-arrow">▾</span>
        </div>
      </div>
      <div class="train-day-exercises">
        ${day.exercises.map((ex, i) => {
          const done = checked[i] || false;
          return `<div class="exercise-item">
            <div class="ex-check${done ? " checked" : ""}" onclick="toggleExercise(${dow},${i})">${done ? "✓" : ""}</div>
            <div class="ex-body">
              <div class="ex-name"${done ? ' style="text-decoration:line-through;opacity:0.45"' : ""}>${ex.name}</div>
              <div class="ex-meta-row">
                <span class="ex-sets-badge">${ex.sets}</span>
                <span class="ex-rest-badge">${ex.rest}</span>
              </div>
            </div>
          </div>`;
        }).join("")}
        ${doneCount === total ? `<div style="text-align:center;padding:10px;font-size:0.78rem;color:var(--green)">✦ Treino completo! Marque o dia como feito acima.</div>` : ""}
      </div>
    </div>`;
  }).join("");
}

function toggleTrainDay(dow) {
  const el = document.getElementById(`tdb-${dow}`);
  if (el) el.classList.toggle("open");
}

function toggleExercise(dow, idx) {
  if (!state.corpo.exChecked)      state.corpo.exChecked = {};
  if (!state.corpo.exChecked[dow]) state.corpo.exChecked[dow] = {};
  state.corpo.exChecked[dow][idx] = !state.corpo.exChecked[dow][idx];
  saveState();
  renderTrainDays();
  renderWeekProgress();
}

function renderMeals() {
  const wrap = document.getElementById("mealsList");
  if (!wrap) return;
  wrap.innerHTML = PLANO.meals.map((meal, i) => {
    const done = (state.corpo.mealChecked && state.corpo.mealChecked[i]) || false;
    return `<div class="meal-item">
      <div class="meal-check${done ? " checked" : ""}" onclick="toggleMeal(${i})">${done ? "✓" : ""}</div>
      <div class="meal-body">
        <div class="meal-time-label">${meal.time}</div>
        <div class="meal-name-label"${done ? ' style="text-decoration:line-through;opacity:0.45"' : ""}>${meal.name}</div>
        <div class="meal-items-list">
          ${meal.items.map(it => `<div class="meal-food"><span>${it.food}</span><span>${it.qty}</span></div>`).join("")}
        </div>
      </div>
    </div>`;
  }).join("");
}

function toggleMeal(idx) {
  if (!state.corpo.mealChecked) state.corpo.mealChecked = {};
  state.corpo.mealChecked[idx] = !state.corpo.mealChecked[idx];
  saveState();
  renderMeals();
}

function renderPrinciples() {
  const wrap = document.getElementById("principlesList");
  if (!wrap) return;
  wrap.innerHTML = PLANO.principles.map(p => `
    <div class="principle-item">
      <span class="p-num">${p.num}</span>
      <div><strong>${p.title}</strong><p>${p.text}</p></div>
    </div>`).join("");
}

// ── CORPO TABS ──

function setupCorpoTabs() {
  document.querySelectorAll(".corpo-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".corpo-tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".corpo-panel").forEach(p => p.classList.remove("active"));
      tab.classList.add("active");
      const panel = document.getElementById(`tab-${tab.dataset.tab}`);
      if (panel) panel.classList.add("active");
    });
  });
}

// ═══════════════════════════════════════════
// API KEY
// ═══════════════════════════════════════════

function getApiKey() {
  return state.apiKey || localStorage.getItem("nexo.apikey") || "";
}

function saveApiKey(key) {
  state.apiKey = key;
  localStorage.setItem("nexo.apikey", key);
}

function setupApiKeyField() {
  const configView = document.getElementById("view-config");
  if (!configView) return;

  const section = document.createElement("div");
  section.className = "card";
  section.innerHTML = `
    <div class="card-label">CHAVE DE API — ANTHROPIC</div>
    <p class="helper-text" style="margin-bottom:10px">
      Sua chave fica salva só no seu navegador. Nunca vai para o GitHub.<br>
      Obtenha em <a href="https://console.anthropic.com" target="_blank" style="color:var(--cyan)">console.anthropic.com</a>
    </p>
    <label class="field-label">API Key</label>
    <div class="api-key-wrap">
      <input type="password" class="api-key-input" id="apiKeyInput" placeholder="sk-ant-...">
      <button class="api-key-toggle" id="apiKeyToggle">mostrar</button>
    </div>
    <button class="btn-primary" id="saveApiKeyBtn" style="margin-top:10px;max-width:160px">Salvar chave</button>
    <p class="helper-text" id="apiKeyStatus" style="margin-top:8px"></p>
  `;

  // Insert as first card in config
  const firstCard = configView.querySelector(".card");
  if (firstCard) {
    configView.insertBefore(section, firstCard);
  } else {
    configView.appendChild(section);
  }

  const input = document.getElementById("apiKeyInput");
  if (input) input.value = getApiKey();

  document.getElementById("apiKeyToggle")?.addEventListener("click", () => {
    const inp = document.getElementById("apiKeyInput");
    const btn = document.getElementById("apiKeyToggle");
    if (!inp) return;
    if (inp.type === "password") { inp.type = "text";     btn.textContent = "ocultar"; }
    else                         { inp.type = "password"; btn.textContent = "mostrar"; }
  });

  document.getElementById("saveApiKeyBtn")?.addEventListener("click", () => {
    const key    = document.getElementById("apiKeyInput")?.value.trim() || "";
    const status = document.getElementById("apiKeyStatus");
    if (!key.startsWith("sk-")) {
      status.textContent = "⚠ Chave inválida — deve começar com sk-ant-";
      status.style.color = "var(--coral)";
      return;
    }
    saveApiKey(key);
    status.textContent = "✓ Chave salva com segurança no seu navegador.";
    status.style.color = "var(--green)";
  });
}

// ═══════════════════════════════════════════
// OVERRIDE: callClaude com API key + cabeçalhos corretos
// ═══════════════════════════════════════════

async function callClaude(type) {
  const apiKey = getApiKey();

  // Sem chave → mostra aviso
  if (!apiKey) {
    const area = document.getElementById("aiResponse");
    const text = document.getElementById("aiResponseText");
    if (area) area.style.display = "block";
    if (text) text.innerHTML = `<span style="color:var(--amber)">⚠ Configure sua chave de API na tela <strong>Config</strong> primeiro.</span>`;
    const badge = document.getElementById("statusBadge");
    if (badge) { badge.textContent = "sem chave"; badge.className = "status-badge"; }
    return;
  }

  const dump = document.getElementById("dumpTextarea")?.value.trim();
  if (!dump) { flashElement("dumpTextarea"); return; }

  state.today.lastDump = dump;
  saveState();

  const statusBar  = document.getElementById("aiStatus");
  const statusText = document.getElementById("aiStatusText");
  const responseEl = document.getElementById("aiResponse");
  const textEl     = document.getElementById("aiResponseText");
  const labelEl    = document.getElementById("aiResponseLabel");
  const saveBtn    = document.getElementById("btnSaveToMemory");
  const badge      = document.getElementById("statusBadge");

  const labels = { plan: "Planejando", risk: "Analisando risco", memory: "Extraindo memória", reflect: "Refletindo" };

  if (statusBar)  statusBar.style.display  = "flex";
  if (statusText) statusText.textContent   = (labels[type] || type) + "...";
  if (responseEl) responseEl.style.display = "block";
  if (labelEl)    labelEl.textContent      = (labels[type] || type).toUpperCase();
  if (textEl)     textEl.innerHTML         = '<span class="cursor"></span>';
  if (saveBtn)    saveBtn.style.display    = "none";
  if (badge)      { badge.textContent = labels[type] + "..."; badge.className = "status-badge loading"; }

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
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
      for (const line of decoder.decode(value).split("\n")) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === "content_block_delta" && parsed.delta?.text) {
            fullText += parsed.delta.text;
            if (textEl) textEl.innerHTML = fullText.replace(/\n/g, "<br>") + '<span class="cursor"></span>';
          }
        } catch (_) {}
      }
    }

    if (textEl) textEl.innerHTML = fullText.replace(/\n/g, "<br>");
    if (statusText) statusText.textContent = "✓ pronto";
    if (badge) { badge.textContent = "✓ pronto"; badge.className = "status-badge done"; }
    state.today.lastResponse = fullText;
    saveState();

    if (type === "memory" && saveBtn) {
      saveBtn.style.display = "block";
      saveBtn.onclick = () => {
        appendToMemory(fullText);
        saveBtn.textContent = "✓ Salvo!";
        setTimeout(() => { saveBtn.textContent = "+ Salvar na memória"; }, 2000);
      };
    }

  } catch (err) {
    if (textEl)     textEl.innerHTML         = `<span style="color:var(--coral)">Erro: ${err.message}</span>`;
    if (statusText) statusText.textContent   = "erro";
    if (badge)      { badge.textContent = "erro"; badge.className = "status-badge"; }
    console.error("NEXO IA error:", err);
  }
}

// ═══════════════════════════════════════════
// OVERRIDE: navigateTo com corpo
// ═══════════════════════════════════════════

function navigateTo(viewId) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  const view = document.getElementById(`view-${viewId}`);
  const btn  = document.querySelector(`[data-view="${viewId}"]`);
  if (view) view.classList.add("active");
  if (btn)  btn.classList.add("active");
  if (viewId === "padroes")  renderPatterns();
  if (viewId === "memoria")  renderHistory();
  if (viewId === "corpo")    renderCorpo();
  if (viewId === "financas") renderFinancas();
  if (viewId === "mente")    renderMente();
}

// ── BOOT EXTRA ──
document.addEventListener("DOMContentLoaded", () => {
  setupCorpoTabs();
  setupApiKeyField();
});
