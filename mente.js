// ═══════════════════════════════════════════
// NEXO — mente.js
// Segundo Cérebro · Zettelkasten
// ═══════════════════════════════════════════

// ── ESTADO MENTE ──
// state.mente = { roughNotes, sourceNotes, fullNotes }

function initMenteState() {
  if (!state.mente) state.mente = {};
  if (!state.mente.roughNotes)  state.mente.roughNotes  = [];
  if (!state.mente.sourceNotes) state.mente.sourceNotes = [];
  if (!state.mente.fullNotes)   state.mente.fullNotes   = [];
}

// ── RENDER MENTE ──

function renderMente() {
  initMenteState();
  renderRoughList();
  renderSourceList();
  renderFullList();
}

// ── ROUGH NOTES ──

function salvarRough() {
  const texto = document.getElementById("roughTextarea")?.value.trim();
  if (!texto) { flashElement("roughTextarea"); return; }

  state.mente.roughNotes.unshift({
    id:   Date.now(),
    texto,
    data: getTodayStr()
  });

  document.getElementById("roughTextarea").value = "";
  saveState();
  renderRoughList();
  showSaveConfirm("Rough Note salva!");
}

function renderRoughList() {
  const wrap = document.getElementById("roughList");
  if (!wrap) return;
  const notes = state.mente.roughNotes || [];

  if (!notes.length) {
    wrap.innerHTML = `<p class="helper-text">Nenhuma rough note ainda. Capture sem filtro.</p>`;
    return;
  }

  wrap.innerHTML = notes.map(n => `
    <div class="mente-note-item">
      <div class="mente-note-meta">
        <span class="mente-note-date">${formatMenteDate(n.data)}</span>
        <div class="mente-note-actions">
          <button onclick="roughToFull(${n.id})" class="mn-btn">→ Full</button>
          <button onclick="deletarRough(${n.id})" class="mn-btn del">✕</button>
        </div>
      </div>
      <div class="mente-note-text">${escapeHtml(n.texto)}</div>
    </div>`).join("");
}

function deletarRough(id) {
  state.mente.roughNotes = state.mente.roughNotes.filter(n => n.id !== id);
  saveState();
  renderRoughList();
}

function roughToFull(id) {
  const note = state.mente.roughNotes.find(n => n.id === id);
  if (!note) return;
  document.getElementById("fullTextarea").value = note.texto;
  // Navega para full note
  document.querySelectorAll(".mf-step").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".mente-panel").forEach(p => p.classList.remove("active"));
  document.querySelector('[data-step="full"]')?.classList.add("active");
  document.getElementById("mpanel-full")?.classList.add("active");
}

// ── REFINAR COM IA ──

async function refinarComIA() {
  const texto = document.getElementById("roughTextarea")?.value.trim();
  if (!texto) { flashElement("roughTextarea"); return; }

  const apiKey = getApiKey();
  if (!apiKey) {
    const area = document.getElementById("roughAiResponse");
    const text = document.getElementById("roughAiText");
    if (area) area.style.display = "block";
    if (text) text.innerHTML = `<span style="color:var(--amber)">⚠ Configure sua chave de API na tela Config primeiro.</span>`;
    return;
  }

  const area = document.getElementById("roughAiResponse");
  const text = document.getElementById("roughAiText");
  const btn  = document.getElementById("btnRefinaIA");

  if (area) area.style.display = "block";
  if (text) text.innerHTML = '<span class="cursor"></span>';
  if (btn)  { btn.textContent = "Refinando..."; btn.disabled = true; }

  const prompt = `Você é um especialista em Zettelkasten e Segundo Cérebro.

Transforme esta rough note em uma micronotas cristalizada seguindo estas regras:
1. AUTORIA TOTAL: Reescreva completamente nas suas próprias palavras — sem cópia
2. MICRONOTA: Deve caber em uma rolagem de tela — um raciocínio singular e completo  
3. SIMPLICIDADE: Clara o suficiente para um leigo entender na primeira leitura
4. Sugira 3 a 5 tags estruturais no final (formato: #tag1 #tag2 #tag3)

Contexto do usuário:
${state.memory ? `Memória: ${state.memory.slice(0,300)}` : ""}

Rough note:
${texto}

Responda APENAS com a nota refinada + tags. Sem introdução, sem explicação.`;

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
        max_tokens: 600,
        stream: true,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!resp.ok) throw new Error("API error " + resp.status);

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
            if (text) text.innerHTML = fullText.replace(/\n/g, "<br>") + '<span class="cursor"></span>';
          }
        } catch (_) {}
      }
    }

    if (text) text.innerHTML = fullText.replace(/\n/g, "<br>");

    // Botão para mover para Full Note
    const moveBtn = document.getElementById("btnRoughToFull");
    if (moveBtn) {
      moveBtn.style.display = "block";
      moveBtn.onclick = () => {
        document.getElementById("fullTextarea").value = fullText;
        // Extrai tags se houver
        const tagsMatch = fullText.match(/#[\w\u00C0-\u024F]+/g);
        if (tagsMatch) {
          document.getElementById("tagsInput").value = tagsMatch.join(", ").replace(/#/g, "");
        }
        navigateTo("mente");
        setTimeout(() => {
          document.querySelectorAll(".mf-step").forEach(s => s.classList.remove("active"));
          document.querySelectorAll(".mente-panel").forEach(p => p.classList.remove("active"));
          document.querySelector('[data-step="full"]')?.classList.add("active");
          document.getElementById("mpanel-full")?.classList.add("active");
        }, 100);
      };
    }

  } catch (err) {
    if (text) text.innerHTML = `<span style="color:var(--coral)">Erro: ${err.message}</span>`;
  } finally {
    if (btn) { btn.textContent = "✦ Refinar com IA"; btn.disabled = false; }
  }
}

// ── SOURCE MATERIAL ──

function salvarSource() {
  const titulo = document.getElementById("sourceTitle")?.value.trim();
  const texto  = document.getElementById("sourceTextarea")?.value.trim();
  const url    = document.getElementById("sourceUrl")?.value.trim();

  if (!texto) { flashElement("sourceTextarea"); return; }

  state.mente.sourceNotes.unshift({
    id:     Date.now(),
    titulo: titulo || "Sem título",
    texto,
    url,
    data:   getTodayStr()
  });

  document.getElementById("sourceTitle").value    = "";
  document.getElementById("sourceTextarea").value = "";
  document.getElementById("sourceUrl").value      = "";
  saveState();
  renderSourceList();
  showSaveConfirm("Source Material salvo!");
}

function renderSourceList() {
  const wrap = document.getElementById("sourceList");
  if (!wrap) return;
  const notes = state.mente.sourceNotes || [];

  if (!notes.length) {
    wrap.innerHTML = `<p class="helper-text">Nenhum source material ainda. Cole fontes brutas aqui.</p>`;
    return;
  }

  wrap.innerHTML = notes.map(n => `
    <div class="mente-note-item source">
      <div class="mente-note-meta">
        <span class="mente-note-date">${formatMenteDate(n.data)}</span>
        <div class="mente-note-actions">
          <button onclick="deletarSource(${n.id})" class="mn-btn del">✕</button>
        </div>
      </div>
      <div class="mente-note-title">${escapeHtml(n.titulo)}</div>
      <div class="mente-note-text">${escapeHtml(n.texto.slice(0, 200))}${n.texto.length > 200 ? "..." : ""}</div>
      ${n.url ? `<a class="mente-note-url" href="${n.url}" target="_blank">${n.url}</a>` : ""}
    </div>`).join("");
}

function deletarSource(id) {
  state.mente.sourceNotes = state.mente.sourceNotes.filter(n => n.id !== id);
  saveState();
  renderSourceList();
}

// ── FULL NOTES ──

function salvarFull() {
  const titulo = document.getElementById("fullTitle")?.value.trim();
  const texto  = document.getElementById("fullTextarea")?.value.trim();
  const status = document.getElementById("fullStatus")?.value || "draft";
  const tags   = document.getElementById("tagsInput")?.value
    .split(",").map(t => t.trim().replace(/^#/, "")).filter(Boolean);

  if (!titulo || !texto) {
    flashElement(!titulo ? "fullTitle" : "fullTextarea");
    return;
  }

  // Verifica se é edição ou nova nota
  const existing = state.mente.fullNotes.find(n => n.titulo === titulo);
  if (existing) {
    existing.texto  = texto;
    existing.status = status;
    existing.tags   = tags;
    existing.updatedAt = getTodayStr();
  } else {
    state.mente.fullNotes.unshift({
      id:        Date.now(),
      titulo,
      texto,
      status,
      tags,
      data:      getTodayStr(),
      updatedAt: getTodayStr()
    });
  }

  document.getElementById("fullTitle").value    = "";
  document.getElementById("fullTextarea").value = "";
  document.getElementById("tagsInput").value    = "";
  document.getElementById("fullStatus").value   = "draft";
  saveState();
  renderFullList();
  showSaveConfirm("Full Note salva!");
}

function renderFullList() {
  const wrap = document.getElementById("fullList");
  if (!wrap) return;
  const notes = state.mente.fullNotes || [];

  if (!notes.length) {
    wrap.innerHTML = `<p class="helper-text">Nenhuma full note ainda. Conhecimento cristalizado aparece aqui.</p>`;
    return;
  }

  const statusColor = { draft: "var(--text3)", developing: "var(--amber)", developed: "var(--green)" };
  const statusLabel = { draft: "Draft", developing: "Developing", developed: "Developed" };

  wrap.innerHTML = notes.map(n => `
    <div class="mente-note-item full">
      <div class="mente-note-meta">
        <span class="mente-note-date">${formatMenteDate(n.updatedAt || n.data)}</span>
        <div class="mente-note-actions">
          <span style="font-size:0.6rem;color:${statusColor[n.status]};font-family:var(--font-mono)">${statusLabel[n.status]}</span>
          <button onclick="editarFull(${n.id})" class="mn-btn">✎</button>
          <button onclick="exportarFullNote(${n.id})" class="mn-btn">↗</button>
          <button onclick="deletarFull(${n.id})" class="mn-btn del">✕</button>
        </div>
      </div>
      <div class="mente-note-title">${escapeHtml(n.titulo)}</div>
      <div class="mente-note-text">${escapeHtml(n.texto.slice(0, 180))}${n.texto.length > 180 ? "..." : ""}</div>
      ${n.tags?.length ? `<div class="mente-tags">${n.tags.map(t => `<span class="mente-tag">#${t}</span>`).join("")}</div>` : ""}
    </div>`).join("");
}

function editarFull(id) {
  const note = state.mente.fullNotes.find(n => n.id === id);
  if (!note) return;
  document.getElementById("fullTitle").value    = note.titulo;
  document.getElementById("fullTextarea").value = note.texto;
  document.getElementById("fullStatus").value   = note.status;
  document.getElementById("tagsInput").value    = (note.tags||[]).join(", ");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deletarFull(id) {
  state.mente.fullNotes = state.mente.fullNotes.filter(n => n.id !== id);
  saveState();
  renderFullList();
}

// ── SUGERIR TAGS COM IA ──

async function sugerirTags() {
  const texto = document.getElementById("fullTextarea")?.value.trim();
  if (!texto) { flashElement("fullTextarea"); return; }

  const apiKey = getApiKey();
  if (!apiKey) return;

  const btn = document.getElementById("btnSuggestTags");
  if (btn) { btn.textContent = "Gerando..."; btn.disabled = true; }

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
        max_tokens: 100,
        messages: [{
          role: "user",
          content: `Sugira de 3 a 5 tags estruturais para esta nota. Responda APENAS com as tags separadas por vírgula, sem # e sem explicação.\n\nNota:\n${texto}`
        }]
      })
    });

    const data = await resp.json();
    const tags = data.content?.[0]?.text?.trim() || "";

    const sugWrap = document.getElementById("tagsSuggested");
    if (sugWrap && tags) {
      sugWrap.style.display = "flex";
      sugWrap.style.flexWrap = "wrap";
      sugWrap.style.gap = "6px";
      sugWrap.innerHTML = tags.split(",").map(t => t.trim()).filter(Boolean).map(t =>
        `<span class="mente-tag" style="cursor:pointer" onclick="addTag('${t}')">#${t}</span>`
      ).join("");
    }
  } catch (err) {
    console.error("Tags IA error:", err);
  } finally {
    if (btn) { btn.textContent = "✦ Sugerir tags com IA"; btn.disabled = false; }
  }
}

function addTag(tag) {
  const input = document.getElementById("tagsInput");
  if (!input) return;
  const current = input.value.trim();
  input.value = current ? current + ", " + tag : tag;
}

// ── EXPORTAR PARA OBSIDIAN ──

function exportarFullNote(id) {
  const note = state.mente.fullNotes.find(n => n.id === id);
  if (!note) return;

  const vault  = state.user?.vaultName || "MeuVault";
  const folder = "Nexo/6-Full Notes";
  const tags   = (note.tags||[]).map(t => `  - ${t}`).join("\n");

  const md = `---
title: "${note.titulo}"
status: ${note.status}
data: ${note.data}
updated: ${note.updatedAt || note.data}
tags:
${tags || "  - sem-tag"}
---

# ${note.titulo}

${note.texto}

---
*Exportado via NEXO OS · ${new Date().toLocaleDateString("pt-BR")}*
`;

  const uri = `obsidian://new?vault=${encodeURIComponent(vault)}&file=${encodeURIComponent(folder + "/" + note.titulo)}&content=${encodeURIComponent(md)}`;
  window.open(uri, "_self");
}

function exportarTodasFullNotes() {
  const notes = state.mente.fullNotes || [];
  if (!notes.length) return;
  // Exporta a mais recente
  exportarFullNote(notes[0].id);
}

// ── TABS MENTE ──

function setupMenteTabs() {
  document.querySelectorAll(".mf-step").forEach(step => {
    step.addEventListener("click", () => {
      document.querySelectorAll(".mf-step").forEach(s => s.classList.remove("active"));
      document.querySelectorAll(".mente-panel").forEach(p => p.classList.remove("active"));
      step.classList.add("active");
      const panel = document.getElementById(`mpanel-${step.dataset.step}`);
      if (panel) panel.classList.add("active");
    });
  });
}

// ── UTILS ──

function formatMenteDate(str) {
  if (!str) return "—";
  const d = new Date(str + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function escapeHtml(str) {
  return (str || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function showSaveConfirm(msg) {
  // Flash verde no topo da view
  const flash = document.createElement("div");
  flash.textContent = "✓ " + msg;
  flash.style.cssText = `position:fixed;top:20px;right:20px;background:var(--green);color:var(--bg);padding:10px 16px;border-radius:8px;font-weight:700;font-size:0.78rem;z-index:999;font-family:var(--font-head);animation:fadeIn 0.2s ease`;
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 2000);
}

// ── SETUP MENTE ──

function setupMente() {
  setupMenteTabs();

  document.getElementById("btnSalvaRough")?.addEventListener("click", salvarRough);
  document.getElementById("btnRefinaIA")?.addEventListener("click", refinarComIA);
  document.getElementById("btnSalvaSource")?.addEventListener("click", salvarSource);
  document.getElementById("btnSalvaFull")?.addEventListener("click", salvarFull);
  document.getElementById("btnSuggestTags")?.addEventListener("click", sugerirTags);
  document.getElementById("btnExportFull")?.addEventListener("click", () => salvarFull() || exportarTodasFullNotes());
  document.getElementById("btnExportMente")?.addEventListener("click", exportarTodasFullNotes);
}

document.addEventListener("DOMContentLoaded", setupMente);
