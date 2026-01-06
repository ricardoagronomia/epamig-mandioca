// mapadbc.js
// Depende do cliente Supabase global "s" definido em app.js
// Estado temporário do Mapa DBC (por experimento)
const dbcState = {
  experimentId: null,
  experimentName: "",   // <== novo
  plotsByKey: {}
};

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

      <div id="dbcTabQrArea" style="display:none;">
        </div>
    </div>
  `;

const dbcExperimentSelect = document.getElementById("dbcExperimentSelect");
const dbcMapArea = document.getElementById("dbcMapArea");
const dbcSaveBtn = document.getElementById("dbcSaveBtn");
const dbcTabMapBtn  = document.getElementById("dbcTabMapBtn");
const dbcTabQrBtn   = document.getElementById("dbcTabQrBtn");
const dbcTabMapArea = document.getElementById("dbcTabMapArea");
const dbcTabQrArea  = document.getElementById("dbcTabQrArea");

let qrInitialized = false;

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

  // *** DAQUI PRA BAIXO continua exatamente o código que já existia ***
  // buscar experimentos, listener de change, salvar etc.
  // (não coloque mais nenhum initDbcQrArea aqui dentro)

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

   // 2) Reagir à mudança do select: desenhar blocos 1–3 com grade 3×4
dbcExperimentSelect.addEventListener("change", async () => {
  const expId = dbcExperimentSelect.value;
  const expName =
    dbcExperimentSelect.options[dbcExperimentSelect.selectedIndex]?.text || "";

  if (!expId) {
    dbcState.experimentId = null;
    dbcState.experimentName = "";   // zera nome também
    dbcState.plotsByKey = {};
    dbcMapArea.innerHTML = `
      <p style="color:#6b7280;font-size:14px;">
        Selecione um experimento para carregar o mapa DBC.
      </p>
    `;
    return;
  }

  dbcState.experimentId = expId;
  dbcState.experimentName = expName;  // guarda nome visível
  dbcState.plotsByKey = {};

    // 1) Buscar plots existentes
    const { data: plots, error: plotsError } = await s
      .from("plots")
      .select("id, plot_code, block_number, treatment_id")
      .eq("experiment_id", expId)
      .order("block_number", { ascending: true });

    if (plotsError) {
      dbcMapArea.innerHTML = `
        <p style="color:#b91c1c;font-size:14px;">
          Erro ao carregar parcelas (plots) deste experimento.
        </p>
      `;
      return;
    }

        // 2) Buscar treatments do experimento
let { data: treatments, error: trError } = await s
  .from("treatments")
  .select("id, code, position, description")
  .eq("experiment_id", expId)
  .order("code", { ascending: true });

if (trError) {
  // ... mensagem de erro como já está
  return;
}

// Se não houver tratamentos, cria a partir da tabela default_treatments
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

  // recarrega os treatments já criados
  const res2 = await s
    .from("treatments")
    .select("id, code, position, description")
    .eq("experiment_id", expId)
    .order("code", { ascending: true });

  treatments = res2.data || [];
}

    // Indexar plots por chave `${block}-${parcelaNum}`
    (plots || []).forEach((p) => {
      const parcelaNum = extractParcelaFromCode(p.plot_code);
      if (!parcelaNum) return;
      const key = `${p.block_number}-${parcelaNum}`;
      dbcState.plotsByKey[key] = {
        id: p.id,
        plot_code: p.plot_code,
        block_number: p.block_number,
        treatment_id: p.treatment_id
      };
    });

    // 3) Montar blocos e grade 3×4 com selects de tratamento
    const blockNumbers = [1, 2, 3];

    dbcMapArea.innerHTML = blockNumbers
      .map((block) => {
        const cellsHtml = Array.from({ length: 12 }, (_, i) => {
          const parcelaNum = i + 1; // 1..12
          const parcelaLabel = String(parcelaNum).padStart(2, "0");
          const key = `${block}-${parcelaNum}`;
          const existing = dbcState.plotsByKey[key];

          const statusText = existing
            ? `Plot salvo (id: ${existing.id.slice(0, 8)}...)`
            : `Sem plot cadastrado`;

          const selectId = `dbc-select-${block}-${parcelaNum}`;

          return `
            <div class="dbc-plot-cell">
              <div class="dbc-plot-label-main">Parcela ${parcelaLabel}</div>
              <div class="dbc-plot-label-sub">Bloco ${block}</div>
              <div class="dbc-plot-label-sub" style="margin-top:4px;color:#6b7280;">
                ${statusText}
              </div>
              <div style="margin-top:6px;">
                <select id="${selectId}" data-block="${block}" data-parcela="${parcelaNum}" class="dbc-plot-select">
                  <option value="">Selecione tratamento...</option>
                  ${treatments
                    .map((t) => {
                      const label = `${(t.code || '').toUpperCase()} ${t.position ? '· ' + t.position.toUpperCase() : ''}`;
                      const selected = existing && existing.treatment_id === t.id ? 'selected' : '';
                      return `<option value="${t.id}" ${selected}>${label}</option>`;
                    })
                    .join("")}
                </select>
              </div>
            </div>
          `;
        }).join("");

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

    // 4) Ligar eventos de change nos selects para atualizar o estado em memória
    dbcMapArea.querySelectorAll(".dbc-plot-select").forEach((sel) => {
      sel.addEventListener("change", () => {
        const block = Number(sel.dataset.block);
        const parcelaNum = Number(sel.dataset.parcela);
        const key = `${block}-${parcelaNum}`;
        const treatmentId = sel.value || null;

        // garante que há um objeto no estado
        if (!dbcState.plotsByKey[key]) {
          const parcelaLabel = String(parcelaNum).padStart(2, "0");
          dbcState.plotsByKey[key] = {
            id: null,
            plot_code: `B${block}P${parcelaLabel}`,
            block_number: block,
            treatment_id: null
          };
        }

        dbcState.plotsByKey[key].treatment_id = treatmentId;
      });
    });
  }); // fecha o addEventListener de change do experimento
  
      dbcSaveBtn.addEventListener("click", async () => {
    if (!dbcState.experimentId) {
      alert("Selecione um experimento antes de salvar o mapa.");
      return;
    }

    const rows = Object.values(dbcState.plotsByKey)
      .filter((p) => p.treatment_id)
      .map((p) => {
        const base = {
          experiment_id: dbcState.experimentId,
          block_number: p.block_number,
          plot_code: p.plot_code,
          treatment_id: p.treatment_id
        };

        if (p.id) {
          base.id = p.id;
        }

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
      .upsert(rows, { onConflict: "id" })
      .select("id, experiment_id, block_number, plot_code, treatment_id");

    dbcSaveBtn.disabled = false;
    dbcSaveBtn.textContent = "Salvar mapa";

    if (error) {
      console.error(error);
      alert("Erro ao salvar mapa de parcelas.");
      return;
    }

    (data || []).forEach((row) => {
      const parcelaNum = extractParcelaFromCode(row.plot_code);
      if (!parcelaNum) return;
      const key = `${row.block_number}-${parcelaNum}`;
      if (!dbcState.plotsByKey[key]) return;
      dbcState.plotsByKey[key].id = row.id;
    });

    alert("Mapa salvo com sucesso.");
   
  });
} // fecha renderDbcMapPage

// helper fora da função
function extractParcelaFromCode(plotCode) {
  if (!plotCode) return null;
  const match = String(plotCode).match(/P(\d+)/i);
  if (!match) return null;
  return Number(match[1]);
}

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
}

