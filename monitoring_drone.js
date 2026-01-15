// monitoring_drone.js
// Página de Monitoramento Drone (layout + salvando no Supabase)

(function () {
  let lastDroneFlight = null; // guarda o último voo carregado para edição

  window.renderMonitoringDronePage = renderMonitoringDronePage;
  window.openDroneFlightModal = openDroneFlightModal;
  // window.openDroneFlightEditModal será adicionado depois

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

     <!-- Lista de registros -->
<div class="card">
  <div style="font-size:14px; font-weight:600; color:#065f46; margin-bottom:6px;">
    Registros de voos
  </div>
  <p style="font-size:13px; color:#6b7280; margin-bottom:8px;">
    Voos cadastrados para este experimento. Use as ações para revisar, editar ou excluir.
  </p>
  <div id="droneFlightsList" style="font-size:13px; color:#374151;">
    <div style="border-radius:10px; border:1px dashed #d1d5db; padding:10px 12px; font-size:13px; color:#6b7280; background:#f9fafb;">
      Nenhum voo cadastrado ainda.<br>
      <span style="font-size:12px;">
        Use o botão <strong>Novo voo</strong> para registrar o primeiro voo de drone deste experimento.
      </span>
    </div>
  </div>
</div>
    `;

    // Depois de montar o HTML, se houver experimento, carrega dados
    if (experiment && typeof loadLastDroneFlight === "function") {
    loadLastDroneFlight(experiment.id);
    }
    if (experiment && typeof loadDroneFlightsList === "function") {
    loadDroneFlightsList(experiment.id);
    }
  }
  
// --- Lista de voos do experimento ---
async function loadDroneFlightsList(experimentId) {
  if (typeof s === "undefined") return;

  const listEl = document.getElementById("droneFlightsList");
  if (!listEl) return;

  listEl.innerHTML = `<p style="font-size:13px; color:#6b7280;">Carregando voos...</p>`;

  try {
    const { data, error } = await s
      .from("drone_monitoring")
      .select("*")
      .eq("experiment_id", experimentId)
      .order("flight_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar lista de voos:", error);
      listEl.innerHTML = `<p style="font-size:13px; color:#b91c1c;">Erro ao carregar voos.</p>`;
      return;
    }

    if (!data || data.length === 0) {
      listEl.innerHTML = `
        <div style="border-radius:10px; border:1px dashed #d1d5db; padding:10px 12px; font-size:13px; color:#6b7280; background:#f9fafb;">
          Nenhum voo cadastrado ainda.<br>
          <span style="font-size:12px;">
            Use o botão <strong>Novo voo</strong> para registrar o primeiro voo de drone deste experimento.
          </span>
        </div>
      `;
      return;
    }

    const rowsHtml = data
      .map(f => {
        const date = f.flight_date || "-";
        const time = f.flight_time ? f.flight_time.slice(0,5) : "-";
        const op = f.operator_name || "-";
        const block = f.block_number != null ? f.block_number : "-";
        const ndvi = f.ndvi_mean != null ? f.ndvi_mean : "-";

        return `
          <tr>
            <td>${date}</td>
            <td>${time}</td>
            <td>${escapeHtml(op)}</td>
            <td>${block}</td>
            <td>${ndvi}</td>
            <td style="text-align:right;">
              <button type="button" class="btn-secondary" style="font-size:12px; padding:4px 8px;"
                onclick="openDroneFlightEditModal('${f.id}')">
                Editar
              </button>
              <button type="button" class="btn-danger" style="font-size:12px; padding:4px 8px; margin-left:4px;"
                onclick="confirmDeleteDroneFlight('${f.id}')">
                Excluir
              </button>
            </td>
          </tr>
        `;
      })
      .join("");

    listEl.innerHTML = `
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:13px;">
          <thead>
            <tr style="background:#f3f4f6; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:#6b7280;">
              <th style="padding:6px 8px;">Data</th>
              <th style="padding:6px 8px;">Hora</th>
              <th style="padding:6px 8px;">Operador</th>
              <th style="padding:6px 8px;">Bloco</th>
              <th style="padding:6px 8px;">NDVI</th>
              <th style="padding:6px 8px; text-align:right;">Ações</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    console.error("Erro inesperado ao carregar lista de voos:", err);
    listEl.innerHTML = `<p style="font-size:13px; color:#b91c1c;">Erro inesperado ao carregar voos.</p>`;
  }
}


  // --- Carrega o último voo do experimento ---
  async function loadLastDroneFlight(experimentId) {
    if (typeof s === "undefined") return;

    try {
      const { data, error } = await s
        .from("drone_monitoring")
        .select("*")
        .eq("experiment_id", experimentId)
        .order("flight_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Erro ao carregar voos de drone:", error);
        return;
      }

      const flight = (data && data[0]) ? data[0] : null;
      lastDroneFlight = flight || null;

      // Preenche os campos da página (somente leitura)
      fillMainFormWithFlight(flight);
    } catch (err) {
      console.error("Erro inesperado ao carregar voos de drone:", err);
    }
    // --- Edição de voo ---
window.openDroneFlightEditModal = async function openDroneFlightEditModal(id) {
  if (!id) return;

  if (typeof s === "undefined") {
    alert("Cliente Supabase não encontrado.");
    return;
  }

  try {
    const { data, error } = await s
      .from("drone_monitoring")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      alert("Erro ao carregar voo para edição.");
      return;
    }

    const f = data;
    const experiment = window.currentExperiment || null;

    const bodyHtml = `
      <form id="droneFlightEditForm">
        <p style="font-size:13px; color:#4b5563; margin-bottom:10px;">
          Editar voo de drone${experiment ? ` do experimento <strong>${escapeHtml(experiment.code || "")}</strong>` : ""}.
        </p>

        <div style="display:flex; flex-wrap:wrap; gap:10px; font-size:13px; color:#374151; margin-bottom:8px;">
          <div style="flex:1 1 150px;">
            <label for="efFlightDate">Data do voo</label>
            <input type="date" id="efFlightDate" value="${f.flight_date || ""}">
          </div>
          <div style="flex:1 1 140px;">
            <label for="efFlightTime">Horário</label>
            <input type="time" id="efFlightTime" value="${f.flight_time ? f.flight_time.slice(0,5) : ""}">
          </div>
          <div style="flex:1 1 200px;">
            <label for="efOperatorName">Operador</label>
            <input type="text" id="efOperatorName" value="${escapeHtml(f.operator_name || "")}">
          </div>
        </div>

        <div style="display:flex; flex-wrap:wrap; gap:10px; font-size:13px; color:#374151; margin-bottom:8px;">
          <div style="flex:1 1 120px;">
            <label for="efBlockNumber">Bloco</label>
            <input type="number" id="efBlockNumber" min="1" value="${f.block_number != null ? f.block_number : ""}">
          </div>
          <div style="flex:1 1 120px;">
            <label for="efAltitude">Altitude (m)</label>
            <input type="number" step="0.1" id="efAltitude" value="${f.altitude_m != null ? f.altitude_m : ""}">
          </div>
          <div style="flex:1 1 140px;">
            <label for="efImageCount">Imagens capturadas</label>
            <input type="number" id="efImageCount" value="${f.image_count != null ? f.image_count : ""}">
          </div>
        </div>

        <div style="display:flex; flex-wrap:wrap; gap:10px; font-size:13px; color:#374151; margin-bottom:8px;">
          <div style="flex:1 1 140px;">
            <label for="efCoverageIndex">Índice de cobertura (%)</label>
            <input type="number" step="0.1" id="efCoverageIndex" value="${f.coverage_index != null ? f.coverage_index : ""}">
          </div>
          <div style="flex:1 1 140px;">
            <label for="efNdviMean">NDVI médio</label>
            <input type="number" step="0.01" id="efNdviMean" value="${f.ndvi_mean != null ? f.ndvi_mean : ""}">
          </div>
        </div>

        <div style="display:flex; flex-wrap:wrap; gap:10px; font-size:13px; color:#374151; margin-bottom:8px;">
          <div style="flex:1 1 140px;">
            <label for="efPlantHeight">Altura da planta (m)</label>
            <input type="number" step="0.01" id="efPlantHeight" value="${f.plant_height_m != null ? f.plant_height_m : ""}">
          </div>
          <div style="flex:1 1 140px;">
            <label for="efCanopyVolume">Volume de copa (m³)</label>
            <input type="number" step="0.1" id="efCanopyVolume" value="${f.canopy_volume_m3 != null ? f.canopy_volume_m3 : ""}">
          </div>
          <div style="flex:1 1 140px;">
            <label for="efLai">Área foliar (IAF)</label>
            <input type="number" step="0.01" id="efLai" value="${f.leaf_area_index != null ? f.leaf_area_index : ""}">
          </div>
          <div style="flex:1 1 140px;">
            <label for="efMarginIndex">Índice de margeamento</label>
            <input type="number" step="0.01" id="efMarginIndex" value="${f.margin_index != null ? f.margin_index : ""}">
          </div>
        </div>

        <div style="display:flex; flex-wrap:wrap; gap:10px; font-size:13px; color:#374151; margin-bottom:8px;">
          <div style="flex:1 1 140px;">
            <label for="efStand">Estande (plantas/ha)</label>
            <input type="number" step="1" id="efStand" value="${f.stand_plants_per_ha != null ? f.stand_plants_per_ha : ""}">
          </div>
          <div style="flex:1 1 140px;">
            <label for="efHealthScore">Sanidade (nota)</label>
            <input type="number" step="0.1" id="efHealthScore" value="${f.health_score != null ? f.health_score : ""}">
          </div>
          <div style="flex:1 1 140px;">
            <label for="efVegIndex">Índice de vegetação</label>
            <input type="number" step="0.001" id="efVegIndex" value="${f.vegetation_index != null ? f.vegetation_index : ""}">
          </div>
        </div>

        <div style="display:flex; flex-wrap:wrap; gap:10px; font-size:13px; color:#374151; margin-bottom:8px;">
          <div style="flex:1 1 160px;">
            <label>Sobreposição (%)</label>
            <div style="display:flex; gap:6px;">
              <select id="efFrontOverlap" style="flex:1">
                <option value="">Frontal</option>
                <option value="80" ${f.front_overlap_pct === 80 ? "selected" : ""}>80</option>
                <option value="85" ${f.front_overlap_pct === 85 ? "selected" : ""}>85</option>
              </select>
              <select id="efSideOverlap" style="flex:1">
                <option value="">Lateral</option>
                <option value="80" ${f.side_overlap_pct === 80 ? "selected" : ""}>80</option>
                <option value="85" ${f.side_overlap_pct === 85 ? "selected" : ""}>85</option>
              </select>
            </div>
          </div>
        </div>

        <div style="margin-top:4px;">
          <label for="efNotes">Observações</label>
          <textarea id="efNotes" rows="3" style="width:100%; padding:9px 11px; border-radius:10px; border:1px solid #e5e7eb; font-size:14px; resize:vertical;">${escapeHtml(f.notes || "")}</textarea>
        </div>

        <div style="margin-top:10px; display:flex; gap:8px; justify-content:flex-end;">
          <button type="button" class="btn-secondary" onclick="closeModal()">Cancelar</button>
          <button type="button" class="btn-primary" style="width:auto; padding-inline:18px;" onclick="updateDroneFlight('${f.id}')">
            Salvar alterações
          </button>
        </div>
      </form>
    `;

    if (typeof openModal === "function") {
      openModal("Editar voo de drone", bodyHtml);
    } else {
      alert("Função de modal não encontrada no app.");
    }
  } catch (err) {
    alert("Erro inesperado ao carregar voo para edição.");
  }
};
    window.updateDroneFlight = async function updateDroneFlight(id) {
  if (!id) return;
  if (typeof s === "undefined") {
    alert("Cliente Supabase não encontrado.");
    return;
  }

  const val = (fieldId) => {
    const el = document.getElementById(fieldId);
    return el ? el.value : "";
  };

  const flight_date = val("efFlightDate");
  if (!flight_date) {
    alert("Informe a data do voo.");
    return;
  }

  const payload = {
    flight_date,
    flight_time: val("efFlightTime") || null,
    operator_name: val("efOperatorName").trim() || null,
    block_number: val("efBlockNumber") ? parseInt(val("efBlockNumber"), 10) : null,
    altitude_m: val("efAltitude") ? parseFloat(val("efAltitude")) : null,
    image_count: val("efImageCount") ? parseInt(val("efImageCount"), 10) : null,
    coverage_index: val("efCoverageIndex") ? parseFloat(val("efCoverageIndex")) : null,
    ndvi_mean: val("efNdviMean") ? parseFloat(val("efNdviMean")) : null,
    plant_height_m: val("efPlantHeight") ? parseFloat(val("efPlantHeight")) : null,
    canopy_volume_m3: val("efCanopyVolume") ? parseFloat(val("efCanopyVolume")) : null,
    leaf_area_index: val("efLai") ? parseFloat(val("efLai")) : null,
    margin_index: val("efMarginIndex") ? parseFloat(val("efMarginIndex")) : null,
    stand_plants_per_ha: val("efStand") ? parseInt(val("efStand"), 10) : null,
    health_score: val("efHealthScore") ? parseFloat(val("efHealthScore")) : null,
    vegetation_index: val("efVegIndex") ? parseFloat(val("efVegIndex")) : null,
    front_overlap_pct: val("efFrontOverlap") ? parseInt(val("efFrontOverlap"), 10) : null,
    side_overlap_pct: val("efSideOverlap") ? parseInt(val("efSideOverlap"), 10) : null,
    notes: val("efNotes").trim() || null
  };

  try {
    const { error } = await s
      .from("drone_monitoring")
      .update(payload)
      .eq("id", id);

    if (error) {
      alert("Erro ao atualizar voo: " + (error.message || ""));
      return;
    }

    alert("Voo atualizado com sucesso.");

    if (typeof closeModal === "function") closeModal();

    // Recarrega lista e último voo
    const exp = window.currentExperiment;
    if (exp) {
      loadDroneFlightsList(exp.id);
      loadLastDroneFlight(exp.id);
    }
  } catch (err) {
    alert("Erro inesperado ao atualizar voo.");
  }
};
  
  
  // --- Exclusão de voo ---
window.confirmDeleteDroneFlight = async function confirmDeleteDroneFlight(id) {
  if (!id) return;
  if (!window.currentExperiment) {
    alert("Nenhum experimento selecionado.");
    return;
  }

  const ok = confirm("Tem certeza que deseja excluir este voo de drone?");
  if (!ok) return;

  if (typeof s === "undefined") {
    alert("Cliente Supabase não encontrado.");
    return;
  }

  try {
    const { error } = await s
      .from("drone_monitoring")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Erro ao excluir voo: " + (error.message || ""));
      return;
    }

    alert("Voo excluído com sucesso.");

    // Recarrega formulário principal (último voo) e lista
    const exp = window.currentExperiment;
    if (exp) {
      loadLastDroneFlight(exp.id);
      loadDroneFlightsList(exp.id);
    }
  } catch (err) {
    alert("Erro inesperado ao excluir voo.");
  }
};

  function fillMainFormWithFlight(flight) {
    const setVal = (id, value) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.value = value != null ? value : "";
    };

    if (!flight) {
      setVal("dronePlantHeight", "");
      setVal("droneCanopyVolume", "");
      setVal("droneLai", "");
      setVal("droneMarginIndex", "");
      setVal("droneStand", "");
      setVal("droneHealth", "");
      setVal("droneVegIndex", "");
      const frontEl = document.getElementById("droneFrontOverlap");
      if (frontEl) frontEl.value = "";
      const sideEl = document.getElementById("droneSideOverlap");
      if (sideEl) sideEl.value = "";
      return;
    }

    setVal("dronePlantHeight", flight.plant_height_m);
    setVal("droneCanopyVolume", flight.canopy_volume_m3);
    setVal("droneLai", flight.leaf_area_index);
    setVal("droneMarginIndex", flight.margin_index);
    setVal("droneStand", flight.stand_plants_per_ha);
    setVal("droneHealth", flight.health_score);
    setVal("droneVegIndex", flight.vegetation_index);

    const frontEl = document.getElementById("droneFrontOverlap");
    if (frontEl && flight.front_overlap_pct != null) {
      frontEl.value = String(flight.front_overlap_pct);
    }
    const sideEl = document.getElementById("droneSideOverlap");
    if (sideEl && flight.side_overlap_pct != null) {
      sideEl.value = String(flight.side_overlap_pct);
    }
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
    // ... seu código atual de salvar (insert em drone_monitoring) ...
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
