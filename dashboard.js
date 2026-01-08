// dashboard.js

function renderExperimentDashboardPage(container) {
  const experiment = window.currentExperiment;

  // fallback seguro
  if (!experiment) {
    container.innerHTML = `
      <div class="content-header">
        <div class="content-title">Identificação do experimento</div>
        <div class="content-subtitle">
          Nenhum experimento selecionado. Volte à guia <strong>Experimentos</strong> e escolha um experimento.
        </div>
      </div>
      <div class="card">
        <p style="color:#6b7280; font-size:13px;">
          Selecione um experimento na lista para visualizar a identificação e a linha do tempo.
        </p>
      </div>
    `;
    return;
  }

  // pequenos helpers locais
  const code = experiment.code || "Sem código";
  const name = experiment.name || "Sem nome definido";
  const farm = experiment.farm || "-";
  const municipality = experiment.municipality || "-";
  const totalArea = experiment.total_area ?? experiment.totalarea ?? "-";
  const plotArea = experiment.plot_area ?? experiment.plotarea ?? "-";
  const soilType = experiment.soil_type ?? experiment.soiltype ?? "-";
  const plantingDateRaw = experiment.planting_date || experiment.plantingdate || null;

  const todayIso = getTodayIsoLocal();

  const plantingDate = typeof formatExperimentDate === "function"
    ? formatExperimentDate(plantingDateRaw)
    : (plantingDateRaw || "-");

  const todayFormatted = typeof formatExperimentDate === "function"
    ? formatExperimentDate(todayIso)
    : todayIso;

  const dap = calculateDAP(plantingDateRaw, todayIso);
  container.innerHTML = `
    <div class="content-header">
      <div class="content-title">Identificação do experimento</div>
      <div class="content-subtitle">
        ${escapeHtml(code)} · ${escapeHtml(name)}
      </div>
    </div>

    <!-- Cabeçalho com DAP e info básica -->
    <div class="card" style="display:flex; flex-wrap:wrap; gap:16px; align-items:stretch; margin-bottom:16px;">
      <!-- Bloco DAP -->
      <div class="dap-calendar"
           style="
             flex:0 0 180px;
             border-radius:16px;
             border:1px solid #e5e7eb;
             background:#f9fafb;
             display:flex;
             flex-direction:column;
             overflow:hidden;
           ">
        <div style="
             background:#065f46;
             color:#ecfdf5;
             text-align:center;
             padding:6px 8px;
             font-size:12px;
             font-weight:600;
             letter-spacing:0.06em;
             text-transform:uppercase;">
          DAP
        </div>
        <div style="
             flex:1;
             display:flex;
             align-items:center;
             justify-content:center;
             font-size:40px;
             font-weight:700;
             color:#065f46;">
          ${dap != null ? dap : "–"}
        </div>
        <div style="
             padding:6px 10px;
             border-top:1px solid #e5e7eb;
             font-size:11px;
             color:#374151;
             display:flex;
             flex-direction:column;
             gap:2px;">
          <div>Plantio: <strong>${escapeHtml(plantingDate)}</strong></div>
          <div>Hoje: <strong>${escapeHtml(todayFormatted)}</strong></div>
          <div style="font-size:10px; color:#6b7280;">
            dias após o plantio
          </div>
        </div>
      </div>

      <!-- Card de identificação básica -->
      <div class="card" style="flex:1 1 220px; margin-bottom:0;">
        <div style="font-size:14px; font-weight:600; color:#065f46; margin-bottom:6px;">
          Identificação básica
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:8px; font-size:13px; color:#374151;">
          <div style="flex:1 1 160px;">
            <div style="font-weight:500;">Código</div>
            <div>${escapeHtml(code)}</div>
          </div>
          <div style="flex:2 1 200px;">
            <div style="font-weight:500;">Nome</div>
            <div>${escapeHtml(name)}</div>
          </div>
          <div style="flex:1 1 160px;">
            <div style="font-weight:500;">Local</div>
            <div>${escapeHtml(farm)}</div>
          </div>
          <div style="flex:1 1 160px;">
            <div style="font-weight:500;">Município / UF</div>
            <div>${escapeHtml(municipality)}</div>
          </div>
          <div style="flex:1 1 140px;">
            <div style="font-weight:500;">Área total (m²)</div>
              <div>${escapeHtml(String(totalArea))}</div>
            </div>
            <div style="flex:1 1 140px;">
            <div style="font-weight:500;">Área útil/parcela (m²)</div>
            <div>${escapeHtml(String(plotArea))}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Card extra: informações complementares (objetivo etc.) -->
    <div class="card">
      <div style="font-size:14px; font-weight:600; color:#065f46; margin-bottom:6px;">
        Detalhes do experimento
      </div>
      <div style="font-size:13px; color:#374151; display:flex; flex-direction:column; gap:6px;">
        <div>
          <div style="font-weight:500;">Objetivo</div>
          <div>${escapeHtml(experiment.objective || "–")}</div>
        </div>
        <div>
          <div style="font-weight:500;">Pesquisadores responsáveis</div>
          <div>${escapeHtml(experiment.researcher || "–")}</div>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:8px;">
          <div style="flex:1 1 160px;">
            <div style="font-weight:500;">Tipo de solo</div>
            <div>${escapeHtml(soilType)}</div>
          </div>
          <div style="flex:1 1 160px;">
            <div style="font-weight:500;">Clima</div>
            <div>${escapeHtml(experiment.climate || "–")}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Linha do tempo -->
    <div class="card">
      <div style="font-size:14px; font-weight:600; color:#065f46; margin-bottom:8px;">
        Linha do tempo do experimento
      </div>
      <div id="experimentTimeline">
        <p style="font-size:13px; color:#6b7280;">
          Carregando eventos do cronograma e registros de campo...
        </p>
      </div>
    </div>
  `;

  // após montar o HTML, carrega a timeline
  loadExperimentTimeline(experiment.id);
}

/**
 * Calcula DAP (dias após o plantio) a partir de duas datas em ISO (YYYY-MM-DD).
 * Retorna número inteiro ou null se não conseguir calcular.
 */
function calculateDAP(plantingDateIso, todayIso) {
  if (!plantingDateIso) return null;
  const p = new Date(plantingDateIso);
  const t = todayIso ? new Date(todayIso) : new Date();
  if (Number.isNaN(p.getTime()) || Number.isNaN(t.getTime())) return null;
  const diffMs = t - p;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.max(0, Math.round(diffMs / oneDay));
}

/**
 * Stub para carregar linha do tempo (cronograma + registros de campo)
 * Depois você pode conectar ao Supabase usando as mesmas tabelas de cronograma.js.
 */
async function loadExperimentTimeline(experimentId) {
  const timelineEl = document.getElementById("experimentTimeline");
  if (!timelineEl) return;

  // exemplo simples de placeholder
  if (typeof s === "undefined") {
    timelineEl.innerHTML = `
      <p style="font-size:13px; color:#b91c1c;">
        Cliente Supabase não encontrado. Não foi possível carregar a linha do tempo.
      </p>
    `;
    return;
  }

  try {
    // TODO: conectar com Supabase para buscar:
    // - tabela scheduled_actions (cronograma)
    // - tabela de registros de campo (quando existir)
    //
    // Exemplo (baseado em cronograma.js):
    // const { data: actions, error } = await s
    //   .from("scheduled_actions")
    //   .select("*")
    //   .eq("experiment_id", experimentId)
    //   .order("start_date", { ascending: true });
    //
    // if (error) throw error;

    // Por enquanto, só mostra uma mensagem amigável:
    timelineEl.innerHTML = `
      <p style="font-size:13px; color:#6b7280;">
        Integração da linha do tempo ainda não implementada.
        Use a guia <strong>Cronograma</strong> nos cartões de experimentos para editar as ações.
      </p>
    `;
  } catch (err) {
    console.error("Erro ao carregar linha do tempo:", err);
    timelineEl.innerHTML = `
      <p style="font-size:13px; color:#b91c1c;">
        Erro ao carregar linha do tempo do experimento.
      </p>
    `;
  }
}

// Caso ainda não tenha escapeHtml disponível aqui, reutiliza o do experiments.js
if (typeof escapeHtml !== "function") {
  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
}
function getTodayIsoLocal() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
