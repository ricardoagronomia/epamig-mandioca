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
      </div>

      <div id="dbcTabQrArea" style="display:none;"></div>
    </div>
  `;

  const dbcExperimentSelect = document.getElementById("dbcExperimentSelect");
  const dbcMapArea = document.getElementById("dbcMapArea");
  const dbcTabMapBtn  = document.getElementById("dbcTabMapBtn");
  const dbcTabQrBtn   = document.getElementById("dbcTabQrBtn");
  const dbcTabMapArea = document.getElementById("dbcTabMapArea");
  const dbcTabQrArea  = document.getElementById("dbcTabQrArea");

  // Detecta se é visitante
  const isVisitor = (typeof currentRole !== "undefined" && currentRole === "visitor");

  // Opção 1: TRAVAR o botão (fica visível porém desativado)
  if (isVisitor) {
    dbcTabQrBtn.disabled = true;
    dbcTabQrBtn.classList.add("disabled");
    dbcTabQrBtn.title = "QR Codes disponíveis apenas para pesquisadores e administradores.";
  }

  // Tabs
  dbcTabMapBtn.addEventListener("click", () => {
    dbcTabMapBtn.classList.add("active");
    dbcTabQrBtn.classList.remove("active");
    dbcTabMapArea.style.display = "block";
    dbcTabQrArea.style.display = "none";
  });

  dbcTabQrBtn.addEventListener("click", () => {
    if (isVisitor) return; // visitante não entra na aba QR

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
  .order("block_number", { ascending: true })
  .order("id", { ascending: true });

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
            const bgColor = colorMap[tpl.treatment_code] || "#e5e7eb";

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
      Experimento: ${dbcState.experimentName || "—"}
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
    
   }); // fecha change do experimento
} // fecha renderDbcMapPage

// ===============================
// Área de QR Codes dentro do Mapa
// ===============================
async function initDbcQrArea() {
  const area = document.getElementById("dbcTabQrArea");
  if (!area) return;

  if (!dbcState.experimentId) {
    area.innerHTML = `
      <p style="color:#b91c1c;font-size:14px;">
        Selecione um experimento na aba Croqui antes de gerar QR Codes.
      </p>
    `;
    return;
  }

  const expId = dbcState.experimentId;
  const expName = dbcState.experimentName || "Experimento sem nome";

  // 1) Buscar croqui fixo em ordem
  const { data: templates, error: tplError } = await s
    .from("plot_templates")
    .select("id, block_number, plot_code, treatment_code, position")
    .order("block_number", { ascending: true })
    .order("id", { ascending: true });

  if (tplError || !templates) {
    area.innerHTML = `
      <p style="color:#b91c1c;font-size:14px;">
        Erro ao carregar croqui fixo (plot_templates) para gerar QR Codes.
      </p>
    `;
    return;
  }

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
  const qrPreviewBtn = document.getElementById("qrPreviewBtn");
  const qrPrintBtn = document.getElementById("qrPrintBtn");

  // monta lista de parcelas para selects / filtros
  const parcels = templates.map((tpl) => ({
    block: tpl.block_number,
    plotCode: tpl.plot_code,
    treatmentCode: tpl.treatment_code,
    position: tpl.position,
    templateId: tpl.id
  }));

  // Preenche o select de parcela única
  if (qrSinglePlotSelect) {
    qrSinglePlotSelect.innerHTML = `
      <option value="">Selecione a parcela</option>
      ${parcels
        .map(
          (p) =>
            `<option value="${p.templateId}">
              ${p.plotCode} · ${p.treatmentCode} ${p.position}
             </option>`
        )
        .join("")}
    `;
  }

  // Alterna exibição do wrapper conforme formato
  qrFormatSelect.addEventListener("change", () => {
    const fmt = qrFormatSelect.value;
    qrSingleWrapper.style.display =
      fmt === "label-100x70" ? "block" : "none";
  });

  // Função para montar URL do QR (ajuste a base depois)
  function buildQrUrl(expId, templateId) {
    const base = "https://seusite.app/coleta";
    return `${base}?exp=${encodeURIComponent(expId)}&pt=${encodeURIComponent(
      templateId
    )}`;
  }

  // Renderização das etiquetas na visualização
  function renderQrLabels() {
    const blockFilter = qrBlockFilter.value;
    const fmt = qrFormatSelect.value;          // "a4-6" ou "label-100x70"
    const singleTemplateId = qrSinglePlotSelect.value;

    let list = parcels.slice();

    // filtro por bloco
    if (blockFilter !== "all") {
      const blockNum = Number(blockFilter);
      list = list.filter((p) => p.block === blockNum);
    }

    // etiqueta térmica: apenas a parcela escolhida
    if (fmt === "label-100x70") {
      if (!singleTemplateId) {
        qrLabelsWrapper.innerHTML = `
          <p style="color:#6b7280;font-size:14px;">
            Selecione a parcela para gerar a etiqueta térmica 100×70 mm.
          </p>
        `;
        return;
      }
      const idNum = Number(singleTemplateId);
      list = list.filter((p) => p.templateId === idNum);
    }

    if (list.length === 0) {
      qrLabelsWrapper.innerHTML = `
        <p style="color:#6b7280;font-size:14px;">
          Nenhuma parcela para os filtros selecionados.
        </p>
      `;
      return;
    }

    // MONTA HTML
    if (fmt === "label-100x70") {
      // etiqueta ÚNICA por página, 100×70, QR à esquerda e textos à direita
      qrLabelsWrapper.innerHTML = list
        .map((p) => {
          return `
            <div class="qr-label-single-page qr-label-card" style="
              display:flex;
              flex-direction:row;
              align-items:center;
              gap:6mm;
            ">
              <div id="qr-${p.templateId}" style="width:32mm;height:32mm;"></div>
              <div style="display:flex;flex-direction:column;gap:2mm;">
                <div style="font-weight:700;font-size:15px;">
                  ${p.treatmentCode} ${p.position}
                </div>
                <div style="font-size:14px;color:#111827;">
                  ${p.plotCode}
                </div>
                <div style="font-size:12px;color:#4b5563;">
                  Experimento: ${expName}
                </div>
              </div>
            </div>
          `;
        })
        .join("");
    } else {
      // A4 – 6 por página (2 x 3)
      const cardsHtml = list
        .map((p) => {
          return `
            <div class="qr-label-card" style="
              display:flex;
              flex-direction:row;
              align-items:center;
              gap:6mm;
            ">
              <div id="qr-${p.templateId}" style="width:32mm;height:32mm;"></div>
              <div style="display:flex;flex-direction:column;gap:2mm;">
                <div style="font-weight:700;font-size:15px;">
                  ${p.treatmentCode} ${p.position}
                </div>
                <div style="font-size:14px;color:#111827;">
                  ${p.plotCode}
                </div>
                <div style="font-size:12px;color:#4b5563;">
                  Experimento: ${expName}
                </div>
              </div>
            </div>
          `;
        })
        .join("");

      qrLabelsWrapper.innerHTML = `
        <div class="qr-label-sheet">
          ${cardsHtml}
        </div>
      `;
    }

    // GERAR QRCODES DEPOIS DO innerHTML
    list.forEach((p) => {
      const url = buildQrUrl(expId, p.templateId);
      const container = document.getElementById(`qr-${p.templateId}`);
      if (container) {
        container.innerHTML = "";
        new QRCode(container, {
          text: url,
          width: 120,   // ~32mm
          height: 120,
        });
      }
    });
  }

  // eventos de preview
  if (qrPreviewBtn) {
    qrPreviewBtn.addEventListener("click", renderQrLabels);
  }
  qrBlockFilter.addEventListener("change", renderQrLabels);
  qrFormatSelect.addEventListener("change", renderQrLabels);
  qrSinglePlotSelect.addEventListener("change", renderQrLabels);

  // botão imprimir
  if (qrPrintBtn) {
    qrPrintBtn.addEventListener("click", () => {
      window.print();
    });
  }

  // primeira renderização
  renderQrLabels();
} // fecha initDbcQrArea

