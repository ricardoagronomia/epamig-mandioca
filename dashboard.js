function renderExperimentDashboardPage(container) {
  const experiment = window.currentExperiment;

  if (!experiment) {
    container.innerHTML = `
      <div class="card">
        <p>Nenhum experimento selecionado.</p>
      </div>
    `;
    return;
  }

  const dap = experiment.dap;
  const plantingDate = experiment.planting_date_formatted;
  const todayDate = experiment.today_formatted;

  container.innerHTML = `
    <div class="content-header">
      <div class="content-title">Identificação do experimento</div>
      <div class="content-subtitle">
        ${experiment.code || "Sem código"} · ${experiment.name || "Sem nome definido"}
      </div>
    </div>

    <div class="card" style="display:flex;flex-wrap:wrap;gap:16px;align-items:stretch;margin-bottom:16px;">
      <div class="dap-calendar" style="
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
          text-transform:uppercase;
        ">
          DAP
        </div>
        <div style="
          flex:1;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:40px;
          font-weight:700;
          color:#065f46;
        ">
          ${dap ?? "-"}
        </div>
        <div style="
          padding:6px 10px;
          border-top:1px solid #e5e7eb;
          font-size:11px;
          color:#374151;
          display:flex;
          flex-direction:column;
          gap:2px;
        ">
          <div>Plantio: <strong>${plantingDate || "—"}</strong></div>
          <div>Hoje: <strong>${todayDate || "—"}</strong></div>
          <div style="font-size:10px;color:#6b7280;">dias após o plantio</div>
        </div>
      </div>

      <div class="card" style="
        flex:1 1 220px;
        margin-bottom:0;
      ">
        <div style="font-size:14px;font-weight:600;color:#065f46;margin-bottom:6px;">
          Identificação básica
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;font-size:13px;color:#374151;">
          <div style="flex:1 1 160px;">
            <div style="font-weight:500;">Código</div>
            <div>${experiment.code || "—"}</div>
          </div>
          <div style="flex:2 1 200px;">
            <div style="font-weight:500;">Nome</div>
            <div>${experiment.name || "—"}</div>
          </div>
          <div style="flex:1 1 160px;">
            <div style="font-weight:500;">Local</div>
            <div>${experiment.farm || "—"}</div>
          </div>
          <div style="flex:1 1 160px;">
            <div style="font-weight:500;">Município / UF</div>
            <div>${experiment.municipality || "—"}</div>
          </div>
          <div style="flex:1 1 140px;">
            <div style="font-weight:500;">Área total (m²)</div>
            <div>${experiment.total_area || "—"}</div>
          </div>
          <div style="flex:1 1 140px;">
            <div style="font-weight:500;">Área útil (m²)</div>
            <div>${experiment.plot_area || "—"}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div style="font-size:14px;font-weight:600;color:#065f46;margin-bottom:8px;">
        Linha do tempo do experimento
      </div>
      <div id="experimentTimeline">
        <p style="font-size:13px;color:#6b7280;">
          Carregando eventos do cronograma e registros de campo...
        </p>
      </div>
    </div>
  `;
}
