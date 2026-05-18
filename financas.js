// ═══════════════════════════════════════════
// NEXO — financas.js
// Controle Financeiro Pessoal
// ═══════════════════════════════════════════

// ── ESTADO FINANÇAS ──
// state.fin = { limite, categorias, contas, lancamentos, mes }

function initFinState() {
  if (!state.fin) state.fin = {};
  const mesAtual = getMesAtual();
  if (!state.fin.mes || state.fin.mes !== mesAtual) {
    state.fin.mes        = mesAtual;
    state.fin.lancamentos = [];
  }
  if (!state.fin.limite)     state.fin.limite = 0;
  if (!state.fin.categorias) state.fin.categorias = [
    { id: 1, nome: "Alimentação",   emoji: "🍔", limite: 0 },
    { id: 2, nome: "Transporte",    emoji: "🚗", limite: 0 },
    { id: 3, nome: "Lazer",         emoji: "🎮", limite: 0 },
    { id: 4, nome: "Saúde",         emoji: "💊", limite: 0 },
    { id: 5, nome: "Outros",        emoji: "📦", limite: 0 }
  ];
  if (!state.fin.contas) state.fin.contas = [];
  if (!state.fin.lancamentos) state.fin.lancamentos = [];
}

function getMesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

function getDiasRestantesMes() {
  const hoje = new Date();
  const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth()+1, 0).getDate();
  return ultimoDia - hoje.getDate() + 1;
}

// ── CÁLCULOS ──

function calcFinTotais() {
  const lanc = state.fin.lancamentos || [];
  const receitas  = lanc.filter(l => l.tipo === "receita").reduce((a,l) => a + l.valor, 0);
  const despesas  = lanc.filter(l => l.tipo === "despesa").reduce((a,l) => a + l.valor, 0);
  const resultado = receitas - despesas;
  const limite    = state.fin.limite || 0;
  const disponivel = Math.max(0, limite - despesas);
  return { receitas, despesas, resultado, limite, disponivel };
}

function calcGastoCategoria(catId) {
  return (state.fin.lancamentos || [])
    .filter(l => l.tipo === "despesa" && l.catId === catId)
    .reduce((a,l) => a + l.valor, 0);
}

// ── RENDER FINANÇAS ──

function renderFinancas() {
  initFinState();
  renderFinHero();
  renderFinSummary();
  renderFinCategorias();
  renderFinContas();
  renderFinHistorico();
  renderFinCatOptions();
}

function renderFinHero() {
  const { disponivel, limite, despesas } = calcFinTotais();
  const pct = limite > 0 ? Math.min((despesas / limite) * 100, 100) : 0;
  const diasRestantes = getDiasRestantesMes();
  const porDia = diasRestantes > 0 ? disponivel / diasRestantes : 0;

  const heroVal  = document.getElementById("finHeroValue");
  const heroSub  = document.getElementById("finHeroSub");
  const fill     = document.getElementById("finProgressFill");
  const used     = document.getElementById("finProgressUsed");
  const left     = document.getElementById("finProgressLeft");

  if (heroVal)  heroVal.textContent  = formatBRL(disponivel);
  if (heroSub)  heroSub.textContent  = `do limite de ${formatBRL(limite)} deste mês`;
  if (fill)     { fill.style.width = pct + "%"; fill.style.background = pct > 80 ? "var(--coral)" : pct > 60 ? "var(--amber)" : "var(--cyan)"; }
  if (used)     used.textContent  = `${pct.toFixed(0)}% usado`;
  if (left)     left.textContent  = `${formatBRL(porDia)}/dia disponível`;
}

function renderFinSummary() {
  const { receitas, despesas, resultado } = calcFinTotais();
  const r = document.getElementById("finReceitas");
  const d = document.getElementById("finDespesas");
  const s = document.getElementById("finResultado");
  if (r) r.textContent = formatBRL(receitas);
  if (d) d.textContent = formatBRL(despesas);
  if (s) { s.textContent = formatBRL(resultado); s.style.color = resultado >= 0 ? "var(--green)" : "var(--coral)"; }
}

function renderFinCategorias() {
  const wrap = document.getElementById("finCategoriasList");
  if (!wrap) return;

  const cats = state.fin.categorias || [];
  if (!cats.length) { wrap.innerHTML = `<p class="helper-text">Configure categorias nas configurações.</p>`; return; }

  wrap.innerHTML = cats.map(cat => {
    const gasto   = calcGastoCategoria(cat.id);
    const limite  = cat.limite || 0;
    const pct     = limite > 0 ? Math.min((gasto / limite) * 100, 100) : 0;
    const color   = pct > 80 ? "var(--coral)" : pct > 60 ? "var(--amber)" : "var(--cyan)";

    return `<div class="fin-cat-item">
      <div class="fin-cat-head">
        <span class="fin-cat-emoji">${cat.emoji}</span>
        <span class="fin-cat-nome">${cat.nome}</span>
        <span class="fin-cat-vals">
          <span style="color:var(--coral)">${formatBRL(gasto)}</span>
          ${limite > 0 ? `<span style="color:var(--text3)"> / ${formatBRL(limite)}</span>` : ""}
        </span>
      </div>
      ${limite > 0 ? `<div class="fin-cat-bar"><div class="fin-cat-fill" style="width:${pct}%;background:${color}"></div></div>` : ""}
    </div>`;
  }).join("");
}

function renderFinContas() {
  const wrap = document.getElementById("finContasList");
  if (!wrap) return;

  const contas = (state.fin.contas || []).filter(c => !c.paga);
  if (!contas.length) { wrap.innerHTML = `<p class="helper-text">Nenhuma conta pendente. 🎉</p>`; return; }

  const total = contas.reduce((a,c) => a + c.valor, 0);
  const proxVenc = contas.sort((a,b) => new Date(a.venc) - new Date(b.venc))[0];

  wrap.innerHTML = `
    <div class="fin-contas-header">
      <span>${contas.length} contas a pagar</span>
      <span>Total ${formatBRL(total)} | Até ${formatDate(proxVenc?.venc)}</span>
    </div>
    ${contas.map(c => `
      <div class="fin-conta-item">
        <div class="fin-conta-info">
          <span class="fin-conta-nome">${c.nome}</span>
          <span class="fin-conta-venc">vence ${formatDate(c.venc)}</span>
        </div>
        <div class="fin-conta-right">
          <span class="fin-conta-val">${formatBRL(c.valor)}</span>
          <button class="fin-conta-pay" onclick="pagarConta(${c.id})">✓ Pagar</button>
        </div>
      </div>`).join("")}
  `;
}

function renderFinHistorico() {
  const wrap = document.getElementById("finHistorico");
  if (!wrap) return;

  const lanc = [...(state.fin.lancamentos || [])].reverse();
  if (!lanc.length) { wrap.innerHTML = `<p class="helper-text">Nenhum lançamento este mês.</p>`; return; }

  wrap.innerHTML = lanc.slice(0,20).map(l => {
    const cat = (state.fin.categorias||[]).find(c => c.id === l.catId);
    const isReceita = l.tipo === "receita";
    return `<div class="fin-lanc-item">
      <span class="fin-lanc-emoji">${cat?.emoji || (isReceita ? "💰" : "💸")}</span>
      <div class="fin-lanc-info">
        <span class="fin-lanc-desc">${l.desc}</span>
        <span class="fin-lanc-cat">${cat?.nome || (isReceita ? "Receita" : "Despesa")} · ${formatDate(l.data)}</span>
      </div>
      <span class="fin-lanc-val" style="color:${isReceita ? "var(--green)" : "var(--coral)"}">
        ${isReceita ? "+" : "−"}${formatBRL(l.valor)}
      </span>
      <button class="fin-lanc-del" onclick="deletarLancamento(${l.id})">✕</button>
    </div>`;
  }).join("");
}

function renderFinCatOptions() {
  const sel = document.getElementById("finCat");
  if (!sel) return;
  const cats = state.fin.categorias || [];
  sel.innerHTML = `<option value="">Categoria...</option>` +
    cats.map(c => `<option value="${c.id}">${c.emoji} ${c.nome}</option>`).join("");
}

// ── MODAL CONFIG ──

function openFinConfig() {
  initFinState();
  const modal = document.getElementById("finModal");
  if (modal) modal.style.display = "flex";

  const limInput = document.getElementById("finLimiteInput");
  if (limInput) limInput.value = state.fin.limite || "";

  renderCategoriasConfig();
  renderContasConfig();
}

function renderCategoriasConfig() {
  const wrap = document.getElementById("finCategoriasConfig");
  if (!wrap) return;
  const cats = state.fin.categorias || [];
  wrap.innerHTML = cats.map((cat, i) => `
    <div class="fin-config-row">
      <input type="text" class="input-field" value="${cat.emoji}" style="width:48px;text-align:center" data-cat-emoji="${i}">
      <input type="text" class="input-field" value="${cat.nome}" placeholder="Nome" data-cat-nome="${i}" style="flex:1">
      <input type="number" class="input-field" value="${cat.limite || ""}" placeholder="Limite R$" data-cat-limite="${i}" style="width:110px">
      <button class="btn-danger" onclick="removerCategoria(${cat.id})" style="padding:6px 10px;font-size:0.7rem">✕</button>
    </div>`).join("");
}

function renderContasConfig() {
  const wrap = document.getElementById("finContasConfig");
  if (!wrap) return;
  const contas = state.fin.contas || [];
  wrap.innerHTML = contas.map((c, i) => `
    <div class="fin-config-row">
      <input type="text" class="input-field" value="${c.nome}" placeholder="Nome da conta" data-conta-nome="${i}" style="flex:1">
      <input type="number" class="input-field" value="${c.valor}" placeholder="R$" data-conta-valor="${i}" style="width:100px">
      <input type="date" class="input-field" value="${c.venc}" data-conta-venc="${i}" style="width:140px">
      <button class="btn-danger" onclick="removerConta(${c.id})" style="padding:6px 10px;font-size:0.7rem">✕</button>
    </div>`).join("");
}

function salvarFinConfig() {
  // Limite
  state.fin.limite = Number(document.getElementById("finLimiteInput")?.value || 0);

  // Categorias
  const emojis  = document.querySelectorAll("[data-cat-emoji]");
  const nomes   = document.querySelectorAll("[data-cat-nome]");
  const limites = document.querySelectorAll("[data-cat-limite]");
  emojis.forEach((el, i) => {
    if (state.fin.categorias[i]) {
      state.fin.categorias[i].emoji  = el.value || "📦";
      state.fin.categorias[i].nome   = nomes[i]?.value || "Categoria";
      state.fin.categorias[i].limite = Number(limites[i]?.value || 0);
    }
  });

  // Contas
  const cNomes  = document.querySelectorAll("[data-conta-nome]");
  const cVals   = document.querySelectorAll("[data-conta-valor]");
  const cVencs  = document.querySelectorAll("[data-conta-venc]");
  cNomes.forEach((el, i) => {
    if (state.fin.contas[i]) {
      state.fin.contas[i].nome  = el.value;
      state.fin.contas[i].valor = Number(cVals[i]?.value || 0);
      state.fin.contas[i].venc  = cVencs[i]?.value || "";
    }
  });

  saveState();
  document.getElementById("finModal").style.display = "none";
  renderFinancas();
}

function adicionarCategoria() {
  if (!state.fin.categorias) state.fin.categorias = [];
  const newId = Date.now();
  state.fin.categorias.push({ id: newId, nome: "Nova categoria", emoji: "📦", limite: 0 });
  renderCategoriasConfig();
}

function removerCategoria(id) {
  state.fin.categorias = (state.fin.categorias||[]).filter(c => c.id !== id);
  renderCategoriasConfig();
}

function adicionarContaConfig() {
  if (!state.fin.contas) state.fin.contas = [];
  state.fin.contas.push({ id: Date.now(), nome: "", valor: 0, venc: "", paga: false });
  renderContasConfig();
}

function removerConta(id) {
  state.fin.contas = (state.fin.contas||[]).filter(c => c.id !== id);
  renderContasConfig();
}

// ── LANÇAMENTOS ──

function addLancamento(tipo) {
  const desc  = document.getElementById("finDesc")?.value.trim();
  const valor = Number(document.getElementById("finValue")?.value || 0);
  const catId = Number(document.getElementById("finCat")?.value || 0);

  if (!desc || valor <= 0) {
    flashElement("finDesc");
    return;
  }

  if (!state.fin.lancamentos) state.fin.lancamentos = [];
  state.fin.lancamentos.push({
    id:    Date.now(),
    tipo,
    desc,
    valor,
    catId,
    data: getTodayStr()
  });

  // Limpa campos
  document.getElementById("finDesc").value  = "";
  document.getElementById("finValue").value = "";

  saveState();
  renderFinancas();
}

function deletarLancamento(id) {
  state.fin.lancamentos = (state.fin.lancamentos||[]).filter(l => l.id !== id);
  saveState();
  renderFinancas();
}

function pagarConta(id) {
  const conta = (state.fin.contas||[]).find(c => c.id === id);
  if (!conta) return;
  conta.paga = true;

  // Registra como despesa
  if (!state.fin.lancamentos) state.fin.lancamentos = [];
  state.fin.lancamentos.push({
    id:    Date.now(),
    tipo:  "despesa",
    desc:  conta.nome,
    valor: conta.valor,
    catId: 0,
    data:  getTodayStr()
  });

  saveState();
  renderFinancas();
}

// ── UTILS ──

function formatBRL(val) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val || 0);
}

function formatDate(str) {
  if (!str) return "—";
  const d = new Date(str + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

// ── SETUP FINANCAS ──

function setupFinancas() {
  document.getElementById("btnFinConfig")?.addEventListener("click", openFinConfig);
  document.getElementById("finModalClose")?.addEventListener("click", () => {
    document.getElementById("finModal").style.display = "none";
  });
  document.getElementById("finSaveConfig")?.addEventListener("click", salvarFinConfig);
  document.getElementById("btnAddCategoria")?.addEventListener("click", adicionarCategoria);
  document.getElementById("btnAddContaConfig")?.addEventListener("click", adicionarContaConfig);
  document.getElementById("btnAddReceita")?.addEventListener("click", () => addLancamento("receita"));
  document.getElementById("btnAddDespesa")?.addEventListener("click", () => addLancamento("despesa"));
  document.getElementById("btnAddConta")?.addEventListener("click", () => {
    openFinConfig();
    setTimeout(() => document.getElementById("finContasConfig")?.scrollIntoView({ behavior: "smooth" }), 200);
  });
}

document.addEventListener("DOMContentLoaded", setupFinancas);
