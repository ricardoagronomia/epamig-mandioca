// monitoring_drone.js
// Página de Monitoramento Drone (layout + salvando no Supabase)

(function () {
  window.renderMonitoringDronePage = renderMonitoringDronePage;
  window.openDroneFlightModal = openDroneFlightModal;

  function renderMonitoringDronePage(container) {
    const experiment = window.currentExperiment || null;

    const subtitle = document.getElementById("headerSubtitle");
    if (subtitle) {
      subtitle.textContent = "Monitoramento por drone";
    }

    container.innerHTML = `
      <div class="content-header">
        <div class="content-title">Monitoramento por drone</div>
        <div class="content-subtitle">
          Registre voos de drone, parâmetros de captura e índices gerados (NDVI, cobertura, altura, IAF, etc.).
        </div>
      </div>

      <!-- Header + botão -->
      <div class="card">
        <div style="display:flex; flex-wrap:wrap; gap:10px; align-items:center; justify-content:space-between;">
          <div style="font-size:13px; color:#4b5563;">
            ${
              experiment
                ? `Experimento <strong>${escapeHtml(experiment.code || "")}</strong> – ${escapeHtml(experiment.name || "Sem nome")}<br>
                   <span style="font-size:12px; color:#6b7280;">
                     Configure voos de drone associados a este experimento.
                   </span>`
                : `<span style="color:#6b7280;">
                     Nenhum experimento selecionado. Selecione um experimento na aba <strong>Experimentos</strong> para vincular voos de drone.
                   </span>`
            }
          </div>
          <button
            class="btn-primary"
            style="width:auto; padding-inline:18px; ${experiment ? "" : "opacity:0.7; cursor:default;"}"
            ${experiment ? 'onclick="openDroneFlightModal()"' : "disabled"}
          >
            Novo voo
          </button>
        </div>
      </div>

      <!-- Card de estatísticas (placeholder) -->
      <div class="card" style="display:flex; flex-wrap:wrap; gap:12px; align-items:center;">
        <div style="width:48px; height:48px; border-radius:14px; background:#dbeafe; display:flex; align-items:center; justify-content:center; color:#1d4ed8; font-size:24px;">
          ✈
        </div>
        <div style="flex:1 1 180px;">
          <div style="font-size:14px; font-weight:600; color:#1f2937;">Voos de drone</div>
          <div style="font-size:13px; color:#6b7280;">
            Em breve: resumo de voos, área coberta e índices médios por experimento.
          </div>
        </div>
      </div>

      <!-- Formulário demonstrativo (somente leitura por enquanto) -->
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <div style="font-size:14px; font-weight:600; color:#065f46;">
            Layout do formulário de voo
          </div>
          <span style="font-size:12px; color:#6b7280;">
            Use o botão "Novo voo" acima para registrar um voo real.
          </span>
        </div>

        <!-- Linha 1: data, horário, operador -->
        <div style="display:flex; flex-wrap:wrap; gap:10px; font-size:13px; color:#374151;">
          <div style="flex:1 1 160px;">
            <label>Data do voo</label>
            <input type="date" disabled>
          </div>
          <div style="flex:1 1 140px;">
            <label>Horário</label>
            <input type="time" disabled>
          </div>
          <div style="flex:1 1 200px;">
            <label>Operador</label>
            <input type="text" placeholder="Nome do operador" disabled>
          </div>
        </div>

        <!-- Linha 2: bloco, altitude, imagens, índice de cobertura, NDVI -->
        <div style="display:flex; flex-wrap:wrap; gap:10px; font-size:13px; color:#374151; margin-top:10px;">
          <div style="flex:1 1 140px;">
            <label>Bloco</label>
            <select disabled>
              <option>Todos os blocos</option>
            </select>
          </div>
          <div style="flex:1 1 140px;">
            <label>Altitude (m)</label>
            <input type="number" placeholder="Ex. 80" disabled>
          </div>
          <div style="flex:1 1 140px;">
            <label>Imagens capturadas</label>
            <input type="number" placeholder="Ex. 120" disabled>
          </div>
          <div style="flex:1 1 140px;">
            <label>Índice de cobertura (%)</label>
            <input type="number" placeholder="0–100" disabled>
          </div>
          <div style="flex:1 1 140px;">
            <label>NDVI médio</label>
            <input type="number" step="0.01" placeholder="0,00–1,00" disabled>
          </div>
        </div>

        <!-- Linha 3: novas métricas do monitoramento remoto -->
        <div style="display:flex; flex-wrap:wrap; gap:10px; font-size:13px; color:#374151; margin-top:10px;">
          <div style="flex:1 1 140px; min-width:140px;">
            <label for="dronePlantHeight">Altura da planta (m)</label>
            <input type="number" step="0.01" id="dronePlantHeight" placeholder="Ex. 1,20" disabled>
          </div>
          <div style="flex:1 1 140px; min-width:140px;">
            <label for="droneCanopyVolume">Volume de copa (m³)</label>
            <input type="number" step="0.1" id="droneCanopyVolume" placeholder="Ex. 3,5" disabled>
          </div>
          <div style="flex:1 1 140px; min-width:140px;">
            <label for="droneLai">Área foliar (IAF)</label>
            <input type="number" step="0.01" id="droneLai" placeholder="Ex. 2,3" disabled>
          </div>
          <div style="flex:1 1 140px; min-width:140px;">
            <label for="droneMarginIndex">Índice de margeamento</label>
            <input type="number" step="0.01" id="droneMarginIndex" placeholder="Ex. 0,85" disabled>
          </div>
          <div style="flex:1 1 140px; min-width:140px;">
            <label for="droneStand">Estande (plantas/ha)</label>
            <input type="number" step="1" id="droneStand" placeholder="Ex. 11000" disabled>
          </div>
          <div style="flex:1 1 140px; min-width:140px;">
            <label for="droneHealth">Sanidade (nota)</label>
            <input type="number" step="0.1" id="droneHealth" placeholder="Ex. 4,5" disabled>
          </div>
          <div style="flex:1 1 140px; min-width:140px;">
            <label for="droneVegIndex">Índice de vegetação</label>
            <input type="number" step="0.001" id="droneVegIndex" placeholder="Ex. 0,78" disabled>
          </div>
          <!-- Frontal / lateral na mesma coluna -->
          <div style="flex:1 1 140px; min-width:140px;">
            <label>Sobreposição (%)</label>
            <div style="display:flex; gap:6px;">
              <select id="droneFrontOverlap" style="flex:1" disabled>
                <option>Frontal</option>
                <option value="80">80</option>
                <option value="85">85</option>
              </select>
              <select id="droneSideOverlap" style="flex:1" disabled>
                <option>Lateral</option>
                <option value="80">80</option>
                <option value="85">85</option>
              </select>
            </div>
          </div>
        </div>

        <div style="margin-top:8px;">
          <label>Observações</label>
          <textarea rows="3" style="width:100%; padding:9px 11px; border-radius:10px; border:1px solid #e5e7eb; font-size:14px; resize:vertical;" disabled
            placeholder="Notas sobre o voo, condições climáticas, problemas na captura, etc."></textarea>
        </div>
      </div>

      <!-- Lista de registros (em breve) -->
      <div class="card">
        <div style="font-size:14px; font-weight:600; color:#065f46; margin-bottom:6px;">
          Registros de voos (em breve)
        </div>
        <p style="font-size:13px; color:#6b7280; margin-bottom:8px;">
          Em breve, esta área vai listar os voos cadastrados para este experimento.
        </p>
        <div style="border-radius:10px; border:1px dashed #d1d5db; padding:10px 12px; font-size:13px; color:#6b7280; background:#f9fafb;">
          Nenhum voo cadastrado ainda.<br>
          <span style="font-size:12px;">
            Use o botão <strong>Novo voo</strong> para registrar o primeiro voo de drone deste experimento.
          </span>
        </div>
      </div>
    `;
  }

  // ---- Modal "Novo voo" ----

  function openDroneFlightModal() {
    const experiment = window.currentExperiment || null;
    if (!experiment) {
      alert("Selecione um experimento na aba Experimentos antes de registrar um voo.");
      return;
    }

    const today = new Date().toISOString().split("T")[0];

    const bodyHtml = `
      <form id="droneFlightForm">
        <p style="font-size:13px; color:#4b5563; margin-bottom:10px;">
          Novo voo de drone para o experimento <strong>${escapeHtml(experiment.code || "")}</strong>.
        </p>

        <div style="display:flex; flex-wrap:wrap; gap:10px; font-size:13px; color:#374151; margin-bottom:8px;">
          <div style="flex:1 1 150px;">
            <label for="dfFlightDate">Data do voo</label>
            <input type="date" id="dfFlightDate" value="${today}">
          </div>
          <div style="flex:1 1 140px;">
            <label for="dfFlightTime">Horário</label>
            <input type="time" id="dfFlightTime">
          </div>
          <div style="flex:1 1 200px;">
            <label for="dfOperatorName">Operador</label>
            <input type="text" id="dfOperatorName" placeholder="Nome do operador">
          </div>
        </div>

        <div style="display:flex; flex-wrap:wrap; gap:10px; font-size:13px; color:#374151; margin-bottom:8px;">
          <div style="flex:1 1 120px;">
            <label for="dfBlockNumber">Bloco</label>
            <input type="number" id="dfBlockNumber" min="1" placeholder="Ex. 1">
          </div>
          <div style="flex:1 1 120px;">
            <label for="dfAltitude">Altitude (m)</label>
            <input type="number" step="0.1" id="dfAltitude" placeholder="Ex. 80">
          </div>
          <div style="flex:1 1 140px;">
            <label for="dfImageCount">Imagens capturadas</label>
            <input type="number" id="dfImageCount" placeholder="Ex. 120">
          </div>
        </div>

        <div style="display:flex; flex-wrap:wrap; gap:10px; font-size:13px; color:#374151; margin-bottom:8px;">
          <div style="flex:1 1 140px;">
            <label for="dfCoverageIndex">Índice de cobertura (%)</label>
            <input type="number" step="0.1" id="dfCoverageIndex" placeholder="0–100">
          </div>
          <div style="flex:1 1 140px;">
            <label for="dfNdviMean">NDVI médio</label>
            <input type="number" step="0.01" id="dfNdviMean" placeholder="0,00–1,00">
          </div>
        </div>

        <div style="display:flex; flex-wrap:wrap; gap:10px; font-size:13px; color:#374151; margin-bottom:8px;">
          <div style="flex:1 1 140px;">
            <label for="dfPlantHeight">Altura da planta (m)</label>
            <input type="number" step="0.01" id="dfPlantHeight" placeholder="Ex. 1,20">
          </div>
          <div style="flex:1 1 140px;">
            <label for="dfCanopyVolume">Volume de copa (m³)</label>
            <input type="number" step="0.1" id="dfCanopyVolume" placeholder="Ex. 3,5">
          </div>
          <div style="flex:1 1 140px;">
            <label for="dfLai">Área foliar (IAF)</label>
            <input type="number" step="0.01" id="dfLai" placeholder="Ex. 2,3">
          </div>
          <div style="flex:1 1 140px;">
            <label for="dfMarginIndex">Índice de margeamento</label>
            <input type="number" step="0.01" id="dfMarginIndex" placeholder="Ex. 0,85">
          </div>
        </div>

        <div style="display:flex; flex-wrap:wrap; gap:10px; font-size:13px; color:#374151; margin-bottom:8px;">
          <div style="flex:1 1 140px;">
            <label for="dfStand">Estande (plantas/ha)</label>
            <input type="number" step="1" id="dfStand" placeholder="Ex. 11000">
          </div>
          <div style="flex:1 1 140px;">
            <label for="dfHealthScore">Sanidade (nota)</label>
            <input type="number" step="0.1" id="dfHealthScore" placeholder="Ex. 4,5">
          </div>
          <div style="flex:1 1 140px;">
            <label for="dfVegIndex">Índice de vegetação</label>
            <input type="number" step="0.001" id="dfVegIndex" placeholder="Ex. 0,78">
          </div>
        </div>

        <div style="display:flex; flex-wrap:wrap; gap:10px; font-size:13px; color:#374151; margin-bottom:8px;">
          <div style="flex:1 1 160px;">
            <label>Sobreposição (%)</label>
            <div style="display:flex; gap:6px;">
              <select id="dfFrontOverlap" style="flex:1">
                <option value="">Frontal</option>
                <option value="80">80</option>
                <option value="85">85</option>
              </select>
              <select id="dfSideOverlap" style="flex:1">
                <option value="">Lateral</option>
                <option value="80">80</option>
                <option value="85">85</option>
              </select>
            </div>
          </div>
        </div>

        <div style="margin-top:4px;">
          <label for="dfNotes">Observações</label>
          <textarea id="dfNotes" rows="3" style="width:100%; padding:9px 11px; border-radius:10px; border:1px solid #e5e7eb; font-size:14px; resize:vertical;"
            placeholder="Notas sobre o voo, condições climáticas, problemas na captura, etc."></textarea>
        </div>

        <div style="margin-top:10px; display:flex; gap:8px; justify-content:flex-end;">
          <button type="button" class="btn-secondary" onclick="closeModal()">Cancelar</button>
          <button type="button" class="btn-primary" style="width:auto; padding-inline:18px;" onclick="saveDroneFlight()">
            Salvar voo
          </button>
        </div>
      </form>
    `;

    if (typeof openModal === "function") {
      openModal("Novo voo de drone", bodyHtml);
    } else {
      alert("Função de modal não encontrada no app.");
    }
  }

  // ---- Salvar no Supabase ----

  window.saveDroneFlight = async function saveDroneFlight() {
    if (typeof s === "undefined") {
      alert("Cliente Supabase não encontrado.");
      return;
    }
    const experiment = window.currentExperiment || null;
    if (!experiment) {
      alert("Nenhum experimento selecionado.");
      return;
    }

    const val = (id) => {
      const el = document.getElementById(id);
      return el ? el.value : "";
    };

    const flight_date = val("dfFlightDate");
    const flight_time = val("dfFlightTime") || null;
    const operator_name = val("dfOperatorName").trim();
    const block_number = val("dfBlockNumber") ? parseInt(val("dfBlockNumber"), 10) : null;
    const altitude_m = val("dfAltitude") ? parseFloat(val("dfAltitude")) : null;
    const image_count = val("dfImageCount") ? parseInt(val("dfImageCount"), 10) : null;
    const coverage_index = val("dfCoverageIndex") ? parseFloat(val("dfCoverageIndex")) : null;
    const ndvi_mean = val("dfNdviMean") ? parseFloat(val("dfNdviMean")) : null;

    const plant_height_m = val("dfPlantHeight") ? parseFloat(val("dfPlantHeight")) : null;
    const canopy_volume_m3 = val("dfCanopyVolume") ? parseFloat(val("dfCanopyVolume")) : null;
    const leaf_area_index = val("dfLai") ? parseFloat(val("dfLai")) : null;
    const margin_index = val("dfMarginIndex") ? parseFloat(val("dfMarginIndex")) : null;
    const stand_plants_per_ha = val("dfStand") ? parseInt(val("dfStand"), 10) : null;
    const health_score = val("dfHealthScore") ? parseFloat(val("dfHealthScore")) : null;
    const vegetation_index = val("dfVegIndex") ? parseFloat(val("dfVegIndex")) : null;

    const front_overlap_pct = val("dfFrontOverlap") ? parseInt(val("dfFrontOverlap"), 10) : null;
    const side_overlap_pct = val("dfSideOverlap") ? parseInt(val("dfSideOverlap"), 10) : null;
    const notes = val("dfNotes").trim() || null;

    if (!flight_date) {
      alert("Informe pelo menos a data do voo.");
      return;
    }

    const payload = {
      experiment_id: experiment.id,
      flight_date,
      flight_time,
      operator_name: operator_name || null,
      block_number,
      altitude_m,
      image_count,
      coverage_index,
      ndvi_mean,
      plant_height_m,
      canopy_volume_m3,
      leaf_area_index,
      margin_index,
      stand_plants_per_ha,
      health_score,
      vegetation_index,
      front_overlap_pct,
      side_overlap_pct,
      notes
    };

    try {
      const { error } = await s.from("drone_monitoring").insert(payload);
      if (error) {
        alert("Erro ao salvar voo: " + (error.message || ""));
        return;
      }
      alert("Voo de drone registrado com sucesso.");
      if (typeof closeModal === "function") closeModal();
      // Em breve: recarregar lista de voos aqui
    } catch (err) {
      alert("Erro inesperado ao salvar voo.");
    }
  };

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
