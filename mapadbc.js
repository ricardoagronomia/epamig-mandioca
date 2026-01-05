// mapadbc.js
// Depende do cliente Supabase global "s" definido em app.js

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
  `;

  const dbcExperimentSelect = document.getElementById("dbcExperimentSelect");
  const dbcMapArea = document.getElementById("dbcMapArea");

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
  dbcExperimentSelect.addEventListener("change", () => {
    const expId = dbcExperimentSelect.value;
    if (!expId) {
      dbcMapArea.innerHTML = `
        <p style="color:#6b7280;font-size:14px;">
          Selecione um experimento para carregar o mapa DBC.
        </p>
      `;
      return;
    }

    const blockNumbers = [1, 2, 3];

    dbcMapArea.innerHTML = blockNumbers
      .map((block) => {
        const cellsHtml = Array.from({ length: 12 }, (_, i) => {
          const parcelaNum = String(i + 1).padStart(2, "0");
          return `
            <div class="dbc-plot-cell">
              <div class="dbc-plot-label-main">Parcela ${parcelaNum}</div>
              <div class="dbc-plot-label-sub">Bloco ${block}</div>
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
  });
}
