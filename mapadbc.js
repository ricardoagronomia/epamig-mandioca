// mapadbc.js
// Depende do cliente Supabase global "s" definido em app.js

// Estado temporário do Mapa DBC (por experimento)
const dbcState = {
  experimentId: null,
  experimentName: "",
  plotsByTemplateId: {} // agora indexado por plot_template_id
};

let qrInitialized = false;

const DEFAULT_TREATMENTS = [
  { code: "AMARELA",    position: "VERTICAL"   },
  { code: "AMARELA",    position: "INCLINADA" },
  { code: "AMARELA",    position: "HORIZONTAL" },

  { code: "AMARELINHA", position: "VERTICAL"   },
  { code: "AMARELINHA", position: "INCLINADA" },
  { code: "AMARELINHA", position: "HORIZONTAL" },

  { code: "CACAU",      position: "VERTICAL"   },
  { code: "CACAU",      position: "INCLINADA" },
  { code: "CACAU",      position: "HORIZONTAL" },

  { code: "SABARÁ",     position: "VERTICAL"   },
  { code: "SABARÁ",     position: "INCLINADA" },
  { code: "SABARÁ",     position: "HORIZONTAL" }
];

function renderDbcMapPage(container) {
  container.innerHTML = `
    <div class="content-header">
      <div class="content-title">Mapa DBC</div>
      <div class="content-subtitle">
        Configure o croqui e gere as etiquetas das parcelas.
      </div>
    </div>

    <div class="card">
      <div style="display:flex;gap:8px;margin-bottom:12px;">
        <button id="dbcTabMapBtn" class="btn-secondary">Croqui</button>
        <button id="dbcTabQrBtn" class="btn-secondary">QR Codes</button>
      </div>

      <div id="dbcTabMapArea">
        <div style="margin-bottom:12px;">
          <label for="dbcExperimentSelect">Experimento</label>
          <select id="dbcExperimentSelect">
            <option value="">Carregando experimentos...</option>
          </select>
        </div>

        <div id="dbcMapArea">
          <p style="color:#6b7280;font-size:14px;">
            Selecione um experimento para carregar o mapa DBC.
          </p>
        </div>

        <div style="margin-top:12px; text-align:right;">
          <button id="dbcSaveBtn" class="btn-primary" style="width:auto;">
            Salvar mapa
          </button>
        </div>
      </div>

      <div id="dbcTabQrArea" style="display:none;"></div>
    </div>
  `;

  const dbcExperimentSelect = document.getElementById("dbcExperimentSelect");
  const dbcMapArea = document.getElementById("dbcMapArea");
  const dbcSaveBtn = document.getElementById("dbcSaveBtn");
  const dbcTabMapBtn  = document.getElementById("dbcTabMapBtn");
  const dbcTabQrBtn   = document.getElementById("dbcTabQrBtn");
  const dbcTabMapArea = document.getElementById("dbcTabMapArea");
  const dbcTabQrArea  = document.getElementById("dbcTabQrArea");

  // Tabs
  dbcTabMapBtn.addEventListener("click", () => {
    dbcTabMapBtn.classList.add("active");
    dbcTabQrBtn.classList.remove("active");
    dbcTabMapArea.style.display = "block";
    dbcTabQrArea.style.display = "none";
  });

  dbcTabQrBtn.addEventListener("click", () => {
    dbcTabQrBtn.classList.add("active");
    dbcTabMapBtn.classList.remove("active");
    dbcTabMapArea.style.display = "none";
    dbcTabQrArea.style.display = "block";

    if (!qrInitialized) {
      initDbcQrArea();
      qrInitialized = true;
    }
  });

  // 1) Buscar experimentos no Supabase
  (async () => {
    const { data: experiments, error } = await s
      .from("experiments")
      .select("id, name")
      .order("created_at", { ascending: false });

    if (error) {
      dbcExperimentSelect.innerHTML = `<option value="">Erro ao carregar experimentos</option>`;
      dbcMapArea.innerHTML = `
        <p style="color:#b91c1c;font-size:14px;">
          Não foi possível carregar a lista de experimentos.
        </p>
      `;
      return;
    }

    if (!experiments || experiments.length === 0) {
      dbcExperimentSelect.innerHTML = `<option value="">Nenhum experimento encontrado</option>`;
      return;
    }

    dbcExperimentSelect.innerHTML = `
      <option value="">Selecione um experimento...</option>
      ${experiments
        .map((exp) => `<option value="${exp.id}">${exp.name}</option>`)
        .join("")}
    `;
  })();

  // 2) Reagir à mudança do select: carregar croqui fixo (plot_templates) + vínculos (plots)
  dbcExperimentSelect.addEventListener("change", async () => {
    const expId = dbcExperimentSelect.value;
    const expName =
      dbcExperimentSelect.options[dbcExperimentSelect.selectedIndex]?.text || "";

    // sempre que mudar de experimento, força recriar a aba QR
    qrInitialized = false;
    const qrArea = document.getElementById("dbcTabQrArea");
    if (qrArea) {
      qrArea.innerHTML = "";
    }

    if (!expId) {
      dbcState.experimentId = null;
      dbcState.experimentName = "";
      dbcState.plotsByTemplateId = {};
      dbcMapArea.innerHTML = `
        <p style="color:#6b7280;font-size:14px;">
          Selecione um experimento para carregar o mapa DBC.
        </p>
      `;
      return;
    }

    dbcState.experimentId = expId;
    dbcState.experimentName = expName;
    dbcState.plotsByTemplateId = {};

    // 1) Croqui fixo
    const { data: templates, error: tplError } = await s
      .from("plot_templates")
      .select("id, block_number, plot_code, treatment_code, position")
      .order("block_number", { ascending: true });

    if (tplError || !templates) {
      dbcMapArea.innerHTML = `
        <p style="color:#b91c1c;font-size:14px;">
          Erro ao carregar croqui fixo (plot_templates).
        </p>
      `;
      return;
    }

    // 2) Vínculos existentes deste experimento
    const { data: plots, error: plotsError } = await s
      .from("plots")
      .select("id, plot_template_id, treatment_id")
      .eq("experiment_id", expId);

    if (plotsError) {
      dbcMapArea.innerHTML = `
        <p style="color:#b91c1c;font-size:14px;">
          Erro ao carregar parcelas (plots) deste experimento.
        </p>
      `;
      return;
    }

    const plotsByTemplateId = {};
    (plots || []).forEach((p) => {
      plotsByTemplateId[p.plot_template_id] = p;
      dbcState.plotsByTemplateId[p.plot_template_id] = {
        id: p.id,
        experiment_id: expId,
        plot_template_id: p.plot_template_id,
        treatment_id: p.treatment_id
      };
    });

    // 3) Treatments do experimento
    let { data: treatments, error: trError } = await s
      .from("treatments")
      .select("id, code, position, description")
      .eq("experiment_id", expId)
      .order("code", { ascending: true });

    if (trError) {
      return;
    }

    // Se não houver treatments, cria a partir da tabela default_treatments
    if (!treatments || treatments.length === 0) {
      const { error: rpcError } = await s.rpc(
        "create_treatments_from_default",
        { p_experiment_id: expId }
      );

      if (rpcError) {
        dbcMapArea.innerHTML = `
          <p style="color:#b91c1c;font-size:14px;">
            Erro ao criar tratamentos padrão para este experimento.
          </p>
        `;
        return;
      }

      const res2 = await s
        .from("treatments")
        .select("id, code, position, description")
        .eq("experiment_id", expId)
        .order("code", { ascending: true });

      treatments = res2.data || [];
    }

    // 4) Montar blocos com grid baseado em plot_templates
    const colorMap = {
      AMARELA: "#fde68a",
      AMARELINHA: "#bbf7d0",
      CACAU: "#bfdbfe",
      SABARÁ: "#fecaca"
    };

    const blockNumbers = [1, 2, 3];

    dbcMapArea.innerHTML = blockNumbers
      .map((block) => {
        const templatesDoBloco = templates.filter(
          (t) => t.block_number === block
        );

        const cellsHtml = templatesDoBloco
          .map((tpl) => {
            const existing = plotsByTemplateId[tpl.id] || null;
            const bgColor = colorMap[tpl.treatment_code] || "#e5e7eb";

            const statusText = existing ? "Vínculo salvo" : "Sem vínculo";

            return `
              <div class="dbc-plot-cell"
                   style="background:${bgColor};border-radius:6px;padding:6px;">
                <div style="font-weight:700;font-size:14px;">
                  ${tpl.treatment_code} ${tpl.position}
                </div>
                <div style="font-size:13px;color:#111827;">
                  ${tpl.plot_code}
                </div>
                <div style="font-size:11px;color:#4b5563;margin-top:4px;">
                  ${statusText}
                </div>
                <div style="margin-top:6px;">
                  <select
                    data-template-id="${tpl.id}"
                    class="dbc-plot-select">
                    <option value="">Selecione tratamento...</option>
                    ${treatments
                      .map((t) => {
                        const label = `${(t.code || "").toUpperCase()} ${
                          t.position
                            ? "· " + t.position.toUpperCase()
                            : ""
                        }`;
                        const selected =
                          existing && existing.treatment_id === t.id
                            ? "selected"
                            : "";
                        return `<option value="${t.id}" ${selected}>${label}</option>`;
                      })
                      .join("")}
                  </select>
                </div>
              </div>
            `;
          })
          .join("");

        return `
          <div class="card" style="margin-bottom:12px;">
            <div style="font-weight:600;color:#064e3b;margin-bottom:6px;">
              Bloco ${block}
            </div>
            <div class="dbc-block-grid">
              ${cellsHtml}
            </div>
          </div>
        `;
      })
      .join("");

    // 5) Ligar eventos de change nos selects para atualizar o estado em memória
    dbcMapArea.querySelectorAll(".dbc-plot-select").forEach((sel) => {
      sel.addEventListener("change", () => {
        const templateId = Number(sel.dataset.templateId);
        const treatmentId = sel.value || null;

        if (!dbcState.plotsByTemplateId) {
          dbcState.plotsByTemplateId = {};
        }
        if (!dbcState.plotsByTemplateId[templateId]) {
          dbcState.plotsByTemplateId[templateId] = {
            id: null,
            experiment_id: dbcState.experimentId,
            plot_template_id: templateId,
            treatment_id: null
          };
        }

        dbcState.plotsByTemplateId[templateId].treatment_id = treatmentId;
      });
    });
  }); // fecha change do experimento

  // Botão salvar
  dbcSaveBtn.addEventListener("click", async () => {
    if (!dbcState.experimentId) {
      alert("Selecione um experimento antes de salvar o mapa.");
      return;
    }

    const rows = Object.values(dbcState.plotsByTemplateId || {})
      .filter((p) => p.treatment_id)
      .map((p) => {
        const base = {
          experiment_id: dbcState.experimentId,
          plot_template_id: p.plot_template_id,
          treatment_id: p.treatment_id
        };
        if (p.id) base.id = p.id;
        return base;
      });

    if (rows.length === 0) {
      alert("Nenhuma parcela com tratamento selecionado para salvar.");
      return;
    }

    dbcSaveBtn.disabled = true;
    dbcSaveBtn.textContent = "Salvando...";

    const { data, error } = await s
      .from("plots")
      .upsert(rows, { onConflict: "experiment_id,plot_template_id" })
      .select("id, experiment_id, plot_template_id, treatment_id");

    dbcSaveBtn.disabled = false;
    dbcSaveBtn.textContent = "Salvar mapa";

    if (error) {
      console.log(
        "UPSERT plots error (string):",
        JSON.stringify(error, null, 2)
      );
      alert("Erro ao salvar mapa de parcelas. Veja o console.");
      return;
    }

    (data || []).forEach((row) => {
      if (!dbcState.plotsByTemplateId[row.plot_template_id]) {
        dbcState.plotsByTemplateId[row.plot_template_id] = {
          id: row.id,
          experiment_id: row.experiment_id,
          plot_template_id: row.plot_template_id,
          treatment_id: row.treatment_id
        };
      } else {
        dbcState.plotsByTemplateId[row.plot_template_id].id = row.id;
      }
    });

    alert("Mapa salvo com sucesso.");
  });
} // fecha renderDbcMapPage

// ===============================
// Área de QR Codes dentro do Mapa
// ===============================
function initDbcQrArea() {
  const area = document.getElementById("dbcTabQrArea");
  if (!area) return;

  const expName = dbcState.experimentName || "nenhum experimento selecionado";

  area.innerHTML = `
    <div class="content-header" style="margin-top:0;">
      <div class="content-title">QR Code das Parcelas</div>
      <div class="content-subtitle">
        Etiquetas para o experimento: <strong>${expName}</strong>.
      </div>
    </div>

    <div class="card">
      <div style="
        display:flex;
        flex-wrap:wrap;
        gap:16px;
        align-items:flex-end;
        margin-bottom:16px;
      ">
        <div style="flex:0 0 160px;">
          <label for="qrBlockFilter">Bloco</label>
          <select id="qrBlockFilter">
            <option value="all">Todos os blocos</option>
            <option value="1">Bloco 1</option>
            <option value="2">Bloco 2</option>
            <option value="3">Bloco 3</option>
          </select>
        </div>

        <div style="flex:0 0 220px;">
          <label for="qrFormatSelect">Formato de impressão</label>
          <select id="qrFormatSelect">
            <option value="a4-6">A4 – 6 etiquetas por página</option>
            <option value="label-100x70">Etiqueta térmica 100×70 mm (1 etiqueta)</option>
          </select>
        </div>

        <div id="qrSingleLabelWrapper" style="flex:0 0 220px; display:none;">
          <label for="qrSinglePlotSelect">Parcela para etiqueta única</label>
          <select id="qrSinglePlotSelect">
            <option value="">Selecione a parcela</option>
          </select>
        </div>

        <div style="
          flex:0 0 auto;
          margin-left:auto;
          display:flex;
          gap:8px;
          justify-content:flex-end;
        ">
          <button id="qrPreviewBtn" class="btn-secondary">
            Atualizar visualização
          </button>
          <button id="qrPrintBtn" class="btn-primary">
            Imprimir / Baixar
          </button>
        </div>
      </div>

      <div id="qrLabelsWrapper" style="
        display:grid;
        grid-template-columns:repeat(auto-fill,minmax(230px,1fr));
        gap:12px;
      ">
      </div>
    </div>
  `;

  const qrBlockFilter = document.getElementById("qrBlockFilter");
  const qrFormatSelect = document.getElementById("qrFormatSelect");
  const qrSingleWrapper = document.getElementById("qrSingleLabelWrapper");
  const qrSinglePlotSelect = document.getElementById("qrSinglePlotSelect");
  const qrLabelsWrapper = document.getElementById("qrLabelsWrapper");

  const parcels = buildQrParcelsFromState(); // ainda baseado no estado atual (ajustar depois para templates, se quiser)

  if (qrSinglePlotSelect) {
    qrSinglePlotSelect.innerHTML = `
      <option value="">Selecione a parcela</option>
      ${parcels
        .map(
          (p) =>
            `<option value="${p.key}">${p.code} · Bloco ${p.block}</option>`
        )
        .join("")}
    `;
  }

  qrFormatSelect.addEventListener("change", () => {
    const fmt = qrFormatSelect.value;
    if (fmt === "label-100x70") {
      qrSingleWrapper.style.display = "block";
    } else {
      qrSingleWrapper.style.display = "none";
    }
  });

  qrLabelsWrapper.innerHTML =
    parcels.length === 0
      ? `<p style="color:#6b7280;font-size:14px;">Nenhuma parcela carregada para este experimento.</p>`
      : parcels
          .map(
            (p) => `
      <div class="card" style="padding:12px;">
        <div style="font-weight:600;color:#065f46;">${p.code}</div>
        <div style="font-size:13px;color:#4b5563;">Bloco ${p.block}</div>
      </div>
    `
          )
          .join("");
}

// Usa temporariamente o estado antigo para QR.
// Depois dá para migrar para usar plot_templates também.
function buildQrParcelsFromState() {
  const plotsByKey = {}; // placeholder, pode ser adaptado quando migrar o QR
  const items = [];

  Object.keys(plotsByKey).forEach((key) => {
    const [blockStr, parcelaStr] = key.split("-");
    const block = Number(blockStr);
    const parcelaNum = Number(parcelaStr);
    if (!block || !parcelaNum) return;

    const parcelaLabel = String(parcelaNum).padStart(2, "0");
    const code = `B${block}T${parcelaLabel}`;
    items.push({
      block,
      parcelaNum,
      code,
      key
    });
  });

  items.sort((a, b) => {
    if (a.block !== b.block) return a.block - b.block;
    return a.parcelaNum - b.parcelaNum;
  });

  return items;
}
