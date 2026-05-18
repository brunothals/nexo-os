const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT || 4281);

const envPath = path.join(root, ".env");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf8").split(/\r?\n/).forEach((line) => {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim();
    }
  });
}

const openAiKey = process.env.OPENAI_API_KEY || "";
const openAiModel = process.env.OPENAI_MODEL || "gpt-5-mini";
const obsidianMemoryDir = path.resolve(process.env.OBSIDIAN_MEMORY_DIR || path.join(root, "obsidian-memory"));
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml"
};

function sendJson(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Payload muito grande"));
        request.destroy();
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function extractOutputText(responseJson) {
  if (responseJson.output_text) return responseJson.output_text;
  return (responseJson.output || [])
    .flatMap((item) => item.content || [])
    .filter((content) => content.type === "output_text")
    .map((content) => content.text)
    .join("");
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function safeFileName(value) {
  return String(value || "nota")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "nota";
}

async function handleObsidianStatus(response) {
  ensureDir(obsidianMemoryDir);
  sendJson(response, 200, {
    ready: true,
    dir: obsidianMemoryDir
  });
}

async function handleObsidianSave(request, response) {
  let payload;
  try {
    payload = JSON.parse(await readBody(request));
  } catch {
    sendJson(response, 400, { error: "JSON invalido." });
    return;
  }

  const date = safeFileName(payload.date || new Date().toISOString().slice(0, 10));
  const markdown = String(payload.markdown || "").trim();
  const memory = String(payload.memory || "").trim();

  if (!markdown && !memory) {
    sendJson(response, 400, { error: "Nada para salvar." });
    return;
  }

  const dailyDir = path.join(obsidianMemoryDir, "Daily");
  const memoryDir = path.join(obsidianMemoryDir, "Memory");
  ensureDir(dailyDir);
  ensureDir(memoryDir);

  const written = [];
  if (markdown) {
    const dailyPath = path.join(dailyDir, `${date}.md`);
    fs.writeFileSync(dailyPath, markdown, "utf8");
    written.push(dailyPath);
  }
  if (memory) {
    const memoryPath = path.join(memoryDir, "perfil.md");
    fs.writeFileSync(memoryPath, `# Memoria do assistente\n\n${memory}\n`, "utf8");
    written.push(memoryPath);
  }

  const indexPath = path.join(obsidianMemoryDir, "README.md");
  if (!fs.existsSync(indexPath)) {
    fs.writeFileSync(indexPath, [
      "# FitDia Memoria",
      "",
      "Vault separada para o app FitDia.",
      "",
      "- `Daily/`: resumos diarios do app.",
      "- `Memory/perfil.md`: memoria editavel do assistente.",
      "",
      "Abra esta pasta como uma vault separada no Obsidian para manter suas notas pessoais isoladas."
    ].join("\n"), "utf8");
  }

  sendJson(response, 200, { ok: true, dir: obsidianMemoryDir, written });
}

async function handleGptStatus(response) {
  sendJson(response, 200, {
    ready: Boolean(openAiKey),
    model: openAiModel
  });
}

async function handleGpt(request, response) {
  if (!openAiKey) {
    sendJson(response, 500, {
      error: "OPENAI_API_KEY nao configurada no servidor local."
    });
    return;
  }

  let payload;
  try {
    payload = JSON.parse(await readBody(request));
  } catch {
    sendJson(response, 400, { error: "JSON invalido." });
    return;
  }

  const message = String(payload.message || "").trim();
  const context = String(payload.context || "").trim();
  if (!message) {
    sendJson(response, 400, { error: "Mensagem vazia." });
    return;
  }

  const instructions = [
    "Voce e um assistente pessoal privado do usuario, inspirado em um copiloto sempre presente.",
    "Responda em portugues do Brasil, com tom direto, pratico, acolhedor e levemente conversacional.",
    "Use os dados do dia e a memoria local para organizar rotina, treino, alimentacao, pensamentos, impulsos e gastos.",
    "Ajude como um assistente vivo: perceba padroes, faca no maximo uma pergunta por resposta e sugira uma proxima acao pequena.",
    "Quando o usuario pedir para aprender sobre ele, extraia memorias úteis e duradouras, sem guardar dados sensiveis desnecessarios.",
    "Nao ofereca diagnostico medico, psicologico, juridico ou financeiro. Quando houver risco, recomende ajuda profissional.",
    "Se o usuario pedir plano alimentar ou treino, seja conservador e sugira validar com profissional."
  ].join(" ");

  const input = context
    ? `${message}\n\nContexto atual do meu dia:\n${context}`
    : message;

  response.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive"
  });

  try {
    const upstream = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: openAiModel,
        instructions,
        input,
        stream: true,
        max_output_tokens: 900
      })
    });

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text();
      response.write(`event: error\ndata: ${JSON.stringify({ error: text || "Falha na OpenAI." })}\n\n`);
      response.end();
      return;
    }

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";

      for (const part of parts) {
        const dataLine = part.split("\n").find((line) => line.startsWith("data: "));
        if (!dataLine) continue;
        const raw = dataLine.slice(6);
        if (raw === "[DONE]") continue;
        let event;
        try {
          event = JSON.parse(raw);
        } catch {
          continue;
        }

        if (event.type === "response.output_text.delta" && event.delta) {
          response.write(`data: ${JSON.stringify({ delta: event.delta })}\n\n`);
        }

        if (event.type === "response.completed" && event.response) {
          response.write(`event: done\ndata: ${JSON.stringify({
            id: event.response.id,
            text: extractOutputText(event.response)
          })}\n\n`);
        }

        if (event.type === "response.failed") {
          response.write(`event: error\ndata: ${JSON.stringify({ error: event.response?.error?.message || "Resposta falhou." })}\n\n`);
        }
      }
    }
    response.end();
  } catch (error) {
    response.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
    response.end();
  }
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (url.pathname === "/api/gpt/status" && request.method === "GET") {
    handleGptStatus(response);
    return;
  }

  if (url.pathname === "/api/gpt" && request.method === "POST") {
    handleGpt(request, response);
    return;
  }

  if (url.pathname === "/api/obsidian/status" && request.method === "GET") {
    handleObsidianStatus(response);
    return;
  }

  if (url.pathname === "/api/obsidian/save" && request.method === "POST") {
    handleObsidianSave(request, response);
    return;
  }

  const requestPath = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname.slice(1));
  const safePath = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(root, safePath);

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Arquivo nao encontrado");
      return;
    }
    response.writeHead(200, { "Content-Type": types[path.extname(filePath)] || "application/octet-stream" });
    response.end(data);
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`FitDia rodando em http://localhost:${port}`);
});
