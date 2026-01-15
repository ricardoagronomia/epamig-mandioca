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

    // Depois de montar o HTML, se houver experimento, carrega o último voo
    if (experiment && typeof loadLastDroneFlight === "function") {
      loadLastDroneFlight(experiment.id);
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
  }

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

        <!-- ... resto do modal (seu código atual) ... -->
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
