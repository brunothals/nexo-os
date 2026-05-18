// ═══════════════════════════════════════════
// NEXO — investimentos.js
// Analista Pessoal de Investimentos do Thales
// ═══════════════════════════════════════════

const INVEST_SYSTEM = `Você é o analista pessoal de investimentos e alavancagem de banca do Thales, baseado no Brasil. Seu trabalho é identificar as melhores oportunidades de multiplicar capital — de forma ampla: mercado financeiro tradicional, cripto, ativos digitais, monetização online e qualquer oportunidade legítima de retorno.

## PERFIL DO THALES
- Perfil de risco: Moderado (aceita risco calculado por retorno maior)
- Capital disponível: até R$ 200 por mês
- Localização: Brasil
- Interesse: qualquer mercado com retorno real — renda fixa, bolsa, cripto, memecoins, DeFi, monetização de redes sociais, ativos digitais

## REGRAS
- Seja direto e opinativo — não fique em cima do muro
- Adapte tudo para quem tem R$ 200, não para grandes investidores
- Quando citar cripto ou memecoin, sempre sinalize o risco real
- Nunca prometa retorno garantido
- Se não tiver dados atuais confiáveis sobre algo, diga claramente
- Linguagem simples, sem jargão desnecessário
- Inclua sempre oportunidades de alavancagem digital — o Thales tem interesse em monetização online também`;

const INVEST_PROMPT_ANALISE = `Entregue o relatório completo de análise de banca de hoje no seguinte formato:

📅 ANÁLISE DE BANCA — [DATA DE HOJE]
Perfil: Moderado | Capital: R$ 200/mês

🌐 CENÁRIO GLOBAL AGORA
Situação do FED e SELIC, inflação, tensões geopolíticas relevantes, sentimento geral do mercado. Como isso impacta as oportunidades desta semana.

🏆 TOP 3 OPORTUNIDADES DO MOMENTO
As 3 melhores apostas para R$ 200 agora, ranqueadas por potencial de retorno vs risco. Para cada uma:
→ O que é | Por que agora | Quanto alocar | Risco: Baixo/Médio/Alto

🟢 RENDA FIXA
Melhor opção hoje para perfil moderado. Compare com CDI. Vale a pena ou tem coisa melhor?

🔵 BOLSA & FIIs
1 ação e 1 FII em destaque. Por que esse momento?

🟠 CRIPTO
Situação BTC e ETH. 1 altcoin com catalisador próximo. Alguma memecoin com volume relevante?

💻 ALAVANCAGEM DIGITAL
Oportunidades além do mercado financeiro: monetização no X, crescimento de perfil com receita, afiliados, NFTs com liquidez, airdrops legítimos, qualquer oportunidade digital de gerar retorno com pouco capital.

🔮 RADAR DAS PRÓXIMAS 2-4 SEMANAS
Eventos que podem mover o mercado: COPOM/FED, halvings, upgrades de rede, resultados, lançamentos. O que o Thales precisa ficar de olho?

⚠️ ALERTAS — O QUE EVITAR AGORA
O que está supervalorizado, com sinal de pump and dump, rug pull, ou risco regulatório.

💡 PLANO DA SEMANA — R$ 200
Como distribuir os R$ 200 esta semana? Valores exatos em reais para cada alocação.

🎯 DIAGNÓSTICO DO MOMENTO
1 parágrafo direto: o mercado está favorável ou adverso para o Thales agora? O que fazer?`;

// ── ESTADO ──

function initInvestState() {
  if (!state.invest) state.invest = { historico: [] };
  if (!state.invest.historico) state.invest.historico = [];
}

// ── CHAMADA IA ──

async function callClaudeInvest(userQuestion) {
  const apiKey = getApiKey();
  if (!apiKey) {
    showInvestError("⚠ Configure sua chave de API na tela Config primeiro.");
    return;
  }

  const statusText = document.getElementById("investStatusText");
  const responseEl = document.getElementById("investResponse");
  const textEl     = document.getElementById("investResponseText");
  const labelEl    = document.getElementById("investResponseLabel");

  if (statusText) statusText.textContent  = "Analisando mercado...";
  if (responseEl) responseEl.style.display = "block";
  if (labelEl)    labelEl.textContent = "NEXO INVEST";
  if (textEl)     textEl.innerHTML = '<span class="cursor"></span>';

  // Desabilita botões durante chamada
  setInvestBtnsDisabled(true);

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
        max_tokens: 2000,
        stream: true,
        system: INVEST_SYSTEM,
        messages: [{ role: "user", content: userQuestion }]
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
            if (textEl) textEl.innerHTML = formatInvestResponse(fullText) + '<span class="cursor"></span>';
          }
        } catch (_) {}
      }
    }

    if (textEl) textEl.innerHTML = formatInvestResponse(fullText);
    if (statusText) statusText.textContent = "✓ análise completa";

    // Salva no histórico
    initInvestState();
    state.invest.historico.unshift({
      id: Date.now(),
      data: getTodayStr(),
      pergunta: userQuestion.slice(0, 80),
      resposta: fullText
    });
    if (state.invest.historico.length > 10) state.invest.historico.pop();
    saveState();
    renderInvestHistorico();

  } catch (err) {
    if (textEl) textEl.innerHTML = `<span style="color:var(--coral)">Erro: ${err.message}</span>`;
    if (statusText) statusText.textContent = "erro";
    console.error("NEXO INVEST error:", err);
  } finally {
    setInvestBtnsDisabled(false);
  }
}

function formatInvestResponse(text) {
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^(📅|🌐|🏆|🟢|🔵|🟠|💻|🔮|⚠️|💡|🎯).+$/gm, '<span class="invest-section-head">$&</span>')
    .replace(/^(→.+)$/gm, '<span class="invest-arrow">$1</span>')
    .replace(/\n/g, "<br>");
}

function showInvestError(msg) {
  const responseEl = document.getElementById("investResponse");
  const textEl     = document.getElementById("investResponseText");
  const labelEl    = document.getElementById("investResponseLabel");
  if (responseEl) responseEl.style.display = "block";
  if (labelEl)    labelEl.textContent = "NEXO INVEST";
  if (textEl)     textEl.innerHTML = `<span style="color:var(--amber)">${msg}</span>`;
}

function setInvestBtnsDisabled(disabled) {
  ["btnAnaliseHoje", "btnPerguntaInvest"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = disabled;
  });
}

// ── RENDER HISTÓRICO ──

function renderInvestHistorico() {
  initInvestState();
  const wrap = document.getElementById("investHistoricoList");
  if (!wrap) return;

  const hist = state.invest.historico || [];
  if (!hist.length) {
    wrap.innerHTML = `<p class="helper-text">Nenhuma análise salva ainda. Clique em "Análise de Hoje" para começar.</p>`;
    return;
  }

  wrap.innerHTML = hist.map(h => `
    <div class="invest-hist-item" onclick="expandirAnalise(${h.id})">
      <div class="invest-hist-meta">
        <span class="invest-hist-data">${formatInvestDate(h.data)}</span>
        <span class="invest-hist-toggle">↓ ver</span>
      </div>
      <div class="invest-hist-pergunta">${h.pergunta}${h.pergunta.length >= 80 ? "..." : ""}</div>
      <div class="invest-hist-body" id="hist-body-${h.id}" style="display:none">
        <div class="invest-hist-text">${formatInvestResponse(h.resposta)}</div>
      </div>
    </div>
  `).join("");
}

function expandirAnalise(id) {
  const body = document.getElementById(`hist-body-${id}`);
  if (!body) return;
  const isOpen = body.style.display !== "none";
  body.style.display = isOpen ? "none" : "block";
  const item = body.closest(".invest-hist-item");
  const toggle = item?.querySelector(".invest-hist-toggle");
  if (toggle) toggle.textContent = isOpen ? "↓ ver" : "↑ fechar";
}

function formatInvestDate(str) {
  if (!str) return "—";
  const d = new Date(str + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

// ── RENDER INVESTIMENTOS ──

function renderInvestimentos() {
  initInvestState();
  renderInvestHistorico();
}

// ── SETUP ──

function setupInvestimentos() {
  document.getElementById("btnAnaliseHoje")?.addEventListener("click", () => {
    const hoje = new Date().toLocaleDateString("pt-BR", { dateStyle: "full" });
    callClaudeInvest(`${INVEST_PROMPT_ANALISE}\n\nData de hoje: ${hoje}`);
  });

  document.getElementById("btnPerguntaInvest")?.addEventListener("click", () => {
    const input = document.getElementById("investPergunta");
    const q = input?.value.trim();
    if (!q) { flashElement("investPergunta"); return; }
    callClaudeInvest(q);
    if (input) input.value = "";
  });

  document.getElementById("investPergunta")?.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      document.getElementById("btnPerguntaInvest")?.click();
    }
  });
}

document.addEventListener("DOMContentLoaded", setupInvestimentos);
