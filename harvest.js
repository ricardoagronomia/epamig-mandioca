// harvest.js
// Página de Colheita - VERSÃO CORRIGIDA 2026

(function () {
  let currentHarvestId = null;

  window.renderHarvestPage = renderHarvestPage;

  function renderHarvestPage(container) {
    const experiment = window.currentExperiment;

    if (!experiment) {
      container.innerHTML = `
        <div class="card">
          <p style="color:#6b7280;">
            Nenhum experimento selecionado. Selecione um experimento na página "Experimentos" para registrar colheitas.
          </p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="content-header">
        <div class="content-title">Colheita</div>
        <div class="content-subtitle">
          Registre peso total, raízes comerciais e qualidade de cada parcela na colheita.
        </div>
      </div>

      <div class="card" id="harvestHeaderCard">
        <div style="display:flex; flex-wrap:wrap; justify-content:space-between; gap:10px; align-items:center;">
          <div style="font-size:14px; color:#4b5563;">
            Experimento <strong>${escapeHtml(experiment.code || "")}</strong> · 
            ${escapeHtml(experiment.name || "Sem nome")}<br>
            <span style="font-size:12px; color:#6b7280;">
              Selecione bloco e parcela para registrar a colheita.
            </span>
          </div>
        </div>
        <div style="margin-top:10px; font-size:13px; color:#6b7280;">
          <span id="harvestCounter">– colheitas registradas</span>
        </div>
      </div>

      <div class="card" id="harvestFormCard"></div>

      <div class="card" id="harvestListCard">
        <div style="font-size:14px; font-weight:600; color:#065f46; margin-bottom:6px;">
          Registros anteriores
        </div>
        <div id="harvestList"></div>
      </div>
    `;

    setupHarvestForm(document.getElementById("harvestFormCard"), experiment);
    loadHarvestList();
  }

  function setupHarvestForm(container, experiment) {
    const isVisitor = window.currentRole === "visitor";

    container.innerHTML = `
      <div style="margin-bottom:10px;">
        <div style="font-size:14px; font-weight:600; color:#065f46; margin-bottom:6px;">
          ${currentHarvestId ? "Editar colheita" : "Nova colheita"}
        </div>
      </div>

      <div style="display:flex; flex-wrap:wrap; gap:8px; font-size:13px; color:#374151; margin-bottom:12px;">
        <div style="flex:0 0 120px;">
          <label for="harvestBlock">Bloco</label>
          <select id="harvestBlock" ${isVisitor ? "disabled" : ""}>
            <option value="1">Bloco 1</option>
            <option value="2">Bloco 2</option>
            <option value="3">Bloco 3</option>
          </select>
        </div>
        <div style="flex:0 0 160px;">
          <label for="harvestPlot">Parcela</label>
          <select id="harvestPlot" ${isVisitor ? "disabled" : ""}>
            <option value="">Selecione...</option>
            <option value="T1">T1</option>
            <option value="T2">T2</option>
            <option value="T3">T3</option>
            <option value="T4">T4</option>
            <option value="T5">T5</option>
            <option value="T6">T6</option>
            <option value="T7">T7</option>
            <option value="T8">T8</option>
            <option value="T9">T9</option>
            <option value="T10">T10</option>
            <option value="T11">T11</option>
            <option value="T12">T12</option>
          </select>
        </div>
      </div>

      <div style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
        <div style="flex:0 0 180px;">
          <label for="harvestDate">Data da colheita</label>
          <input type="date" id="harvestDate" ${isVisitor ? "disabled" : ""} />
        </div>
        <div style="flex:1 1 160px;">
          <label for="harvestWeight">Peso total (kg)</label>
          <input type="number" step="0.01" id="harvestWeight" placeholder="Ex. 15.5" ${isVisitor ? "disabled" : ""} />
        </div>
        <div style="flex:1 1 180px;">
          <label for="harvestRoots">Nº raízes comerciais</label>
          <input type="number" id="harvestRoots" placeholder="Ex. 32" ${isVisitor ? "disabled" : ""} />
        </div>
        <div style="flex:1 1 160px;">
          <label for="harvestDiameter">Diâmetro médio (cm)</label>
          <input type="number" step="0.1" id="harvestDiameter" placeholder="Ex. 6.5" ${isVisitor ? "disabled" : ""} />
        </div>
        <div style="flex:1 1 140px;">
          <label for="harvestQuality">Qualidade (1-5)</label>
          <input type="number" min="1" max="5" id="harvestQuality" placeholder="Ex. 4" ${isVisitor ? "disabled" : ""} />
        </div>
        <div style="flex:1 1 180px;">
          <label for="harvestSample">Código da amostra</label>
          <input type="text" id="harvestSample" placeholder="Ex. B1T1-V1" ${isVisitor ? "disabled" : ""} />
          <div style="font-size:11px; color:#6b7280; margin-top:2px;">
            Auto-preenchido com bloco e parcela
          </div>
        </div>
      </div>

      <div style="margin-bottom:10px;">
        <label for="harvestNotes">Observações</label>
        <textarea id="harvestNotes" rows="3" ${isVisitor ? "disabled" : ""}
          style="width:100%; padding:9px 11px; border-radius:10px; border:1px solid
