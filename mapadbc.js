// mapadbc.js
// Depende do cliente Supabase global "s" definido em app.js
// Estado temporário do Mapa DBC (por experimento)
const dbcState = {
  experimentId: null,
  plotsByKey: {} // key: `${block}-${parcelaNum}` -> { id, plot_code, block_number, treatment_id }
};

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
  dbcExperimentSelect.addEventListener("change", async () => {
  const expId = dbcExperimentSelect.value;
  if (!expId) {
    dbcState.experimentId = null;
    dbcState.plotsByKey = {};
    dbcMapArea.innerHTML = `
      <p style="color:#6b7280;font-size:14px;">
        Selecione um experimento para carregar o mapa DBC.
      </p>
    `;
    return;
  }

  dbcState.experimentId = expId;
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
  const { data: treatments, error: trError } = await s
    .from("treatments")
    .select("id, code, position, description")
    .eq("experiment_id", expId)
    .order("code", { ascending: true });

  if (trError) {
    dbcMapArea.innerHTML = `
      <p style="color:#b91c1c;font-size:14px;">
        Erro ao carregar tratamentos deste experimento.
      </p>
    `;
    return;
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
});

