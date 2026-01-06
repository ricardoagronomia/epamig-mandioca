// mapadbc.js
// Depende do cliente Supabase global "s" definido em app.js
// Estado temporário do Mapa DBC (por experimento)
const dbcState = {
  experimentId: null,
  plotsByKey: {} // key: `${block}-${parcelaNum}` -> { id, plot_code, block_number, treatment_id }
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
        Escolha um experimento para visualizar o mapa de blocos.
      </div>
    </div>

    <div class="card">
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
  `;

  const dbcExperimentSelect = document.getElementById("dbcExperimentSelect");
  const dbcMapArea = document.getElementById("dbcMapArea");
  const dbcSaveBtn = document.getElementById("dbcSaveBtn");
  
  if (window.currentRole === "visitor") {
  dbcSaveBtn.disabled = true;
  dbcSaveBtn.title = "Somente pesquisadores podem editar o mapa.";
    }
  
    dbcSaveBtn.addEventListener("click", async () => {
    if (window.currentRole === "visitor") {
      alert("Você não tem permissão para salvar o mapa DBC.");
      return;
    }

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

    console.log("rows", rows);
    console.log("upsert error", error);
    if (error) {
      console.log("upsert message:", error.message);
      console.log("upsert details:", error.details);
    }

    dbcSaveBtn.disabled = false;
    dbcSaveBtn.textContent = "Salvar mapa";

    if (error) {
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

    const experimentsItem = document.querySelector('[data-page="experiments"]');
    if (experimentsItem) {
      experimentsItem.click();
    }
  });
} // fecha renderDbcMapPage

// helper fora da função
function extractParcelaFromCode(plotCode) {
  if (!plotCode) return null;
  const match = String(plotCode).match(/P(\d+)/i);
  if (!match) return null;
  return Number(match[1]);
}



