// harvest.js
// Página de Colheita (placeholder estático, sem lógica ainda)

(function () {
  window.renderHarvestPage = renderHarvestPage;

  function renderHarvestPage(container) {
    const experiment = window.currentExperiment || null;
    const params = new URLSearchParams(window.location.search);
    const plotFromUrl = params.get("plot") || "";

    container.innerHTML = `
      <div class="content-header">
        <div class="content-title">Colheita</div>
        <div class="content-subtitle">
          Registre peso total, raízes comerciais e qualidade de cada parcela na colheita.
        </div>
      </div>

      <!-- Header + botão Nova Colheita -->
      <div class="card">
        <div style="display:flex; flex-wrap:wrap; gap:10px; align-items:center; justify-content:space-between;">
          <div style="font-size:13px; color:#4b5563;">
            ${
              experiment
                ? `
              Experimento <strong>${escapeHtml(experiment.code || "")}</strong> ·
              ${escapeHtml(experiment.name || "Sem nome")}<br>
              <span style="font-size:12px; color:#6b7280;">
                Use o QR code da parcela ou selecione bloco e parcela manualmente.
              </span>
            `
                : `
              <span style="color:#6b7280;">
                Nenhum experimento selecionado. Selecione um experimento na aba "Experimentos" para vincular registros de colheita.
              </span>
            `
            }
          </div>
          <button class="btn-primary" style="width:auto; padding-inline:18px;" disabled>
            Nova colheita (em desenvolvimento)
          </button>
        </div>
      </div>

      <!-- Card de estatísticas -->
      <div class="card" style="display:flex; flex-wrap:wrap; gap:12px; align-items:center;">
        <div style="
          width:48px; height:48px; border-radius:14px;
          background:#fef3c7;
          display:flex; align-items:center; justify-content:center;
          color:#92400e; font-size:24px;
        ">
          🌾
        </div>
        <div style="flex:1 1 180px;">
          <div style="font-size:14px; font-weight:600; color:#1f2937;">
            Parcelas colhidas
          </div>
          <div style="font-size:13px; color:#6b7280;">
            Em breve: número de parcelas colhidas, peso acumulado e qualidade média por experimento.
          </div>
        </div>
      </div>

      <!-- Seleção de parcela (para alinhar com fluxo do QR code) -->
      <div class="card">
        <div style="font-size:14px; font-weight:600; color:#065f46; margin-bottom:6px;">
          Seleção de parcela
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:8px; font-size:13px; color:#374151;">
          <div style="flex:0 0 120px;">
            <label for="harvestBlock">Bloco</label>
            <input type="number" id="harvestBlock" min="1" value="1" disabled />
          </div>
          <div style="flex:0 0 160px;">
            <label for="harvestPlot">Parcela</label>
            <input type="text" id="harvestPlot" placeholder="Ex. B1T1" value="${escapeHtml(
              plotFromUrl
            )}" disabled />
          </div>
          <div style="flex:1 1 220px; align-self:flex-end; font-size:12px; color:#6b7280;">
            Quando aberto via QR code, o código da parcela virá preenchido aqui (em desenvolvimento).
          </div>
        </div>
      </div>

      <!-- Formulário mockado -->
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <div style="font-size:14px; font-weight:600; color:#065f46;">
            Registro de colheita (em desenvolvimento)
          </div>
          <span style="font-size:12px; color:#6b7280;">
            Layout do formulário para cadastro/edição de colheitas.
          </span>
        </div>

        <div style="display:flex; flex-wrap:wrap; gap:10px; font-size:13px; color:#374151;">
          <div style="flex:1 1 160px;">
            <label>Data da colheita</label>
            <input type="date" disabled />
          </div>
          <div style="flex:1 1 120px;">
            <label>Bloco</label>
            <input type="number" placeholder="Ex. 1" disabled />
          </div>
          <div style="flex:1 1 160px;">
            <label>Parcela</label>
            <input type="text" placeholder="Ex. B1T1" disabled />
          </div>
          <div style="flex:1 1 160px;">
            <label>Peso total (kg)</label>
            <input type="number" step="0.1" placeholder="Ex. 15,5" disabled />
          </div>
          <div style="flex:1 1 180px;">
            <label>Nº raízes comerciais</label>
            <input type="number" placeholder="Ex. 32" disabled />
          </div>
          <div style="flex:1 1 160px;">
            <label for="harvestMeanDiameter">Diâmetro médio (cm)</label>
            <input
              type="number"
              step="0.1"
              id="harvestMeanDiameter"
              placeholder="Ex.: 6,5"
              >
          </div>
          <div style="flex:1 1 140px;">
            <label>Nota de qualidade (1–5)</label>
            <input type="number" min="1" max="5" placeholder="Ex. 4" disabled />
          </div>
          <div style="flex:1 1 180px;">
            <label>Código da amostra</label>
            <input type="text" placeholder="Ex. B1T1 - V1" disabled />
          </div>
        </div>

        <div style="margin-top:8px;">
          <label>Observações</label>
          <textarea rows="3" style="width:100%; padding:9px 11px; border-radius:10px; border:1px solid #e5e7eb; font-size:14px; resize:vertical;" disabled
            placeholder="Notas sobre a colheita, problemas de campo, qualidade visual, etc."></textarea>
        </div>

        <div style="margin-top:10px; display:flex; gap:8px; justify-content:flex-end;">
          <button class="btn-secondary" style="opacity:0.7; cursor:default;">Cancelar</button>
          <button class="btn-primary" style="width:auto; padding-inline:18px; opacity:0.7; cursor:default;">
            Salvar colheita
          </button>
        </div>
      </div>

      <!-- Lista de registros -->
      <div class="card">
        <div style="font-size:14px; font-weight:600; color:#065f46; margin-bottom:6px;">
          Registros de colheita (em desenvolvimento)
        </div>
        <p style="font-size:13px; color:#6b7280; margin-bottom:8px;">
          Nesta lista ficarão os registros de colheita por parcela, com peso total, número de raízes comerciais
          e código da amostra, além das ações de edição e exclusão (com permissão).
        </p>

        <div style="
          border-radius:10px;
          border:1px dashed #d1d5db;
          padding:10px 12px;
          font-size:13px;
          color:#6b7280;
          background:#f9fafb;
        ">
          Nenhuma colheita registrada ainda.
          <br>
          <span style="font-size:12px;">
            Após definir os indicadores com o orientador, esta página será ligada ao banco de dados,
            timeline do experimento e auditoria de alterações.
          </span>
        </div>
      </div>
    `;
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
})();
