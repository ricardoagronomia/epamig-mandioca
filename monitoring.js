// monitoring.js
// Página de Monitoramento Manual (biometria, plantas úteis, plantas tombadas)

(function () {
  let currentMonitoringId = null;
  let currentPlantStatuses = {}; // { position: 'not_sprouted' | 'alive' | 'dead' }
  let currentLodgingStatuses = {}; // { position: true/false }

  window.renderMonitoringPage = renderMonitoringPage;

  function renderMonitoringPage(container) {
    const experiment = window.currentExperiment;
    const isVisitor = window.currentRole === "visitor";

    if (!experiment) {
      container.innerHTML = `
        <div class="card">
          <p style="color:#6b7280;">
            Nenhum experimento selecionado. Selecione um experimento na página "Experimentos" para registrar monitoramentos.
          </p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="content-header">
        <div class="content-title">Monitoramento manual</div>
        <div class="content-subtitle">
          Registre medições biométricas e o estado das plantas úteis e tombadas em cada parcela.
        </div>
      </div>

      <div class="card" id="monitoringHeaderCard">
        <div style="display:flex; flex-wrap:wrap; justify-content:space-between; gap:10px; align-items:center;">
          <div style="font-size:14px; color:#4b5563;">
            Experimento <strong>${escapeHtml(experiment.code || "")}</strong> · 
            ${escapeHtml(experiment.name || "Sem nome")}<br>
            <span style="font-size:12px; color:#6b7280;">
              Selecione bloco e parcela para registrar medições.
            </span>
          </div>
        </div>
        <div style="margin-top:10px; font-size:13px; color:#6b7280;">
          <span id="monitoringCounter">– monitoramentos registrados</span>
        </div>
      </div>

      <div class="card" id="monitoringTabsCard"></div>

      <div class="card" id="monitoringListCard">
        <div style="font-size:14px; font-weight:600; color:#065f46; margin-bottom:6px;">
          Registros anteriores
        </div>
        <div id="monitoringList"></div>
      </div>
    `;

    setupMonitoringTabs(document.getElementById("monitoringTabsCard"), experiment);
    loadMonitoringList();
  }

  function setupMonitoringTabs(container, experiment) {
    const isVisitor = window.currentRole === "visitor";

    container.innerHTML = `
      <div style="margin-bottom:10px;">
        <div style="font-size:14px; font-weight:600; color:#065f46; margin-bottom:6px;">
          Seleção de parcela
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:8px; font-size:13px; color:#374151;">
          <div style="flex:0 0 120px;">
            <label for="monitorBlock">Bloco</label>
            <input type="number" id="monitorBlock" min="1" value="1" ${isVisitor ? "disabled" : ""} />
          </div>
          <div style="flex:0 0 160px;">
            <label for="monitorPlot">Parcela</label>
            <input type="text" id="monitorPlot" placeholder="Ex. B1P3" ${isVisitor ? "disabled" : ""} />
          </div>
        </div>
      </div>

      <div class="tabs" id="monitoringTabs">
        <button data-tab="biometria" class="active">Biometria</button>
        <button data-tab="uteis">Plantas úteis</button>
        <button data-tab="tombadas">Plantas tombadas</button>
      </div>
      <div id="monitoringTabContent" style="margin-top:10px;"></div>
    `;

    const tabsEl = document.getElementById("monitoringTabs");
    const contentEl = document.getElementById("monitoringTabContent");

    if (!tabsEl || !contentEl) return;

    const renderCurrentTab = async (tab) => {
      const state = getCurrentSelection();
      if (tab === "biometria") {
        renderMonitoringTabBiometria(contentEl, experiment, state);
      } else if (tab === "uteis") {
        await renderMonitoringTabPlantasUteis(contentEl, experiment, state);
      } else if (tab === "tombadas") {
        await renderMonitoringTabPlantasTombadas(contentEl, experiment, state);
      }
    };

    const getCurrentSelection = () => {
      const blockInput = document.getElementById("monitorBlock");
      const plotInput = document.getElementById("monitorPlot");
      const block = blockInput && blockInput.value ? parseInt(blockInput.value, 10) : 1;
      const plotCode = (plotInput && plotInput.value.trim()) || `B${block}P1`;
      return { block, plotCode };
    };

    tabsEl.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", function () {
        tabsEl.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
        this.classList.add("active");
        const tab = this.dataset.tab;
        renderCurrentTab(tab);
      });
    });

    renderCurrentTab("biometria");
  }

  function renderMonitoringTabBiometria(container, experiment, selection) {
    const isVisitor = window.currentRole === "visitor";

    container.innerHTML = `
      <div style="margin-bottom:10px; font-size:13px; color:#4b5563;">
        <strong>Parcela:</strong> ${escapeHtml(selection.plotCode)} · Bloco ${selection.block}
      </div>

      <div style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
        <div style="flex:1 1 160px;">
          <label for="monDate">Data do monitoramento</label>
          <input type="date" id="monDate" ${isVisitor ? "disabled" : ""} />
        </div>
        <div style="flex:1 1 140px;">
          <label for="monHeight">Altura média (m)</label>
          <input type="number" step="0.01" id="monHeight" ${isVisitor ? "disabled" : ""} />
        </div>
        <div style="flex:1 1 140px;">
          <label for="monStemCount">Número de hastes</label>
          <input type="number" id="monStemCount" ${isVisitor ? "disabled" : ""} />
        </div>
        <div style="flex:1 1 140px;">
          <label for="monStemDiameter">Diâmetro da haste (cm)</label>
          <input type="number" step="0.1" id="monStemDiameter" ${isVisitor ? "disabled" : ""} />
        </div>
        <div style="flex:1 1 140px;">
          <label for="monSanity">Sanidade (1–5)</label>
          <input type="number" min="1" max="5" id="monSanity" ${isVisitor ? "disabled" : ""} />
        </div>
      </div>

      <div style="margin-bottom:10px;">
        <label for="monNotes">Observações</label>
        <textarea id="monNotes" rows="3" ${isVisitor ? "disabled" : ""}
          style="width:100%; padding:9px 11px; border-radius:10px; border:1px solid #e5e7eb; font-size:14px; resize:vertical;"></textarea>
      </div>

      <button class="btn-primary" style="width:auto; padding-inline:18px;" 
        onclick="saveMonitoringBiometria()" ${isVisitor ? "disabled" : ""}>
        Salvar biometria
      </button>
      ${currentMonitoringId ? `
        <button class="btn-secondary" style="margin-left:8px;" onclick="clearMonitoringForm()">
          Cancelar edição
        </button>
      ` : ""}
    `;
  }

  async function renderMonitoringTabPlantasUteis(container, experiment, selection) {
    const isVisitor = window.currentRole === "visitor";

    // Buscar último monitoramento desta parcela
    const latest = await loadLatestMonitoringForPlot(experiment.id, selection.plotCode);
    
    if (!latest) {
      container.innerHTML = `
        <div style="margin-bottom:10px; font-size:13px; color:#b91c1c;">
          <strong>Parcela:</strong> ${escapeHtml(selection.plotCode)} · Bloco ${selection.block}
        </div>
        <p style="font-size:13px; color:#6b7280; margin-bottom:8px;">
          Nenhum monitoramento registrado ainda para esta parcela.
          <br>Salve primeiro a <strong>biometria</strong> (aba Biometria) antes de registrar o status das plantas.
        </p>
      `;
      return;
    }

    // Usar esse monitoramento como contexto
    currentMonitoringId = latest.id;

    // Carregar dados de plantas desse monitoramento
    await loadPlantDataForEdit(latest.id);

    container.innerHTML = `
      <div style="margin-bottom:10px; font-size:13px; color:#4b5563;">
        <strong>Parcela:</strong> ${escapeHtml(selection.plotCode)} · Bloco ${selection.block}
        <br><span style="font-size:12px; color:#6b7280;">Monitoramento de ${formatDateShort(latest.monitoring_date)}</span>
      </div>

      <div style="margin-bottom:10px; font-size:13px; color:#374151;">
        <button class="btn-secondary" onclick="openPlantStatusDialog()" ${isVisitor ? "disabled" : ""}>
          Marcar brotação e mortalidade por planta
        </button>
      </div>

      <div style="font-size:12px; color:#6b7280;">
        Use o botão acima para abrir a grade visual de plantas (3×3).
        Cada clique alterna entre: <strong>cinza</strong> (não brotou) → <strong>verde</strong> (brotou/viva) → <strong>vermelho</strong> (morta).
      </div>
    `;
  }

  async function renderMonitoringTabPlantasTombadas(container, experiment, selection) {
    const isVisitor = window.currentRole === "visitor";

    const latest = await loadLatestMonitoringForPlot(experiment.id, selection.plotCode);
    
    if (!latest) {
      container.innerHTML = `
        <div style="margin-bottom:10px; font-size:13px; color:#b91c1c;">
          <strong>Parcela:</strong> ${escapeHtml(selection.plotCode)} · Bloco ${selection.block}
        </div>
        <p style="font-size:13px; color:#6b7280; margin-bottom:8px;">
          Nenhum monitoramento registrado ainda para esta parcela.
          <br>Salve primeiro a <strong>biometria</strong> antes de registrar tombamento.
        </p>
      `;
      return;
    }

    currentMonitoringId = latest.id;
    await loadPlantDataForEdit(latest.id);

    container.innerHTML = `
      <div style="margin-bottom:10px; font-size:13px; color:#4b5563;">
        <strong>Parcela:</strong> ${escapeHtml(selection.plotCode)} · Bloco ${selection.block}
        <br><span style="font-size:12px; color:#6b7280;">Monitoramento de ${formatDateShort(latest.monitoring_date)}</span>
      </div>

      <div style="margin-bottom:10px; font-size:13px; color:#374151;">
        <button class="btn-secondary" onclick="openPlantLodgingDialog()" ${isVisitor ? "disabled" : ""}>
          Marcar plantas tombadas
        </button>
      </div>

      <div style="font-size:12px; color:#6b7280;">
        Somente plantas <strong>brotadas e vivas</strong> podem ser marcadas como tombadas.
      </div>
    `;
  }

  window.saveMonitoringBiometria = async function saveMonitoringBiometria() {
    if (window.currentRole === "visitor") {
      alert("Visitantes têm acesso somente leitura.");
      return;
    }

    if (typeof s === "undefined") {
      alert("Cliente Supabase não disponível.");
      return;
    }

    const experiment = window.currentExperiment;
    if (!experiment || !experiment.id) {
      alert("Nenhum experimento selecionado.");
      return;
    }

    const blockInput = document.getElementById("monitorBlock");
    const plotInput = document.getElementById("monitorPlot");
    const block = blockInput?.value ? parseInt(blockInput.value, 10) : 1;
    const plotCode = plotInput?.value.trim() || `B${block}P1`;

    const date = document.getElementById("monDate")?.value || null;
    const height = document.getElementById("monHeight")?.value || null;
    const stemCount = document.getElementById("monStemCount")?.value || null;
    const stemDiameter = document.getElementById("monStemDiameter")?.value || null;
    const sanity = document.getElementById("monSanity")?.value || null;
    const notes = document.getElementById("monNotes")?.value || null;

    if (!date) {
      alert("Informe a data do monitoramento.");
      return;
    }

    const payload = {
      experiment_id: experiment.id,
      plot_code: plotCode,
      block_number: block,
      monitoring_date: date,
      height_m: height ? Number(height) : null,
      stem_count: stemCount ? Number(stemCount) : null,
      stem_diameter_cm: stemDiameter ? Number(stemDiameter) : null,
      sanity_score: sanity ? Number(sanity) : null,
      notes: notes || null,
    };

    try {
      if (currentMonitoringId) {
        const { error } = await s
          .from("monitoring_events")
          .update(payload)
          .eq("id", currentMonitoringId);
        if (error) throw error;
      } else {
        const { data, error } = await s.from("monitoring_events").insert(payload).select();
        if (error) throw error;
        currentMonitoringId = data[0]?.id;
      }

      clearMonitoringForm();
      loadMonitoringList();
      alert("Biometria salva com sucesso.");
    } catch (err) {
      console.error("Erro ao salvar monitoramento:", err);
      alert("Erro ao salvar monitoramento.");
    }
  };

  window.openPlantStatusDialog = function openPlantStatusDialog() {
    if (window.currentRole === "visitor") return;

    const blockInput = document.getElementById("monitorBlock");
    const plotInput = document.getElementById("monitorPlot");
    const block = blockInput?.value ? parseInt(blockInput.value, 10) : 1;
    const plotCode = plotInput?.value.trim() || `B${block}P1`;

    const total = 9;
    const itemsHtml = Array.from({ length: total }).map((_, idx) => {
      const n = idx + 1;
      const status = currentPlantStatuses[n] || 'not_sprouted';
      let bg = '#e5e7eb';
      let color = '#374151';
      if (status === 'alive') {
        bg = '#dcfce7';
        color = '#065f46';
      } else if (status === 'dead') {
        bg = '#fee2e2';
        color = '#7f1d1d';
      }

      return `
        <button type="button"
          class="plant-circle"
          data-index="${n}"
          onclick="togglePlantStatus(${n})"
          style="
            width:34px; height:34px; border-radius:999px;
            border:1px solid #d1d5db;
            background:${bg};
            color:${color};
            font-size:13px;
            display:flex; align-items:center; justify-content:center;
            cursor:pointer;
          ">
          ${n}
        </button>
      `;
    }).join("");

    const bodyHtml = `
      <div style="font-size:13px; color:#4b5563; margin-bottom:8px;">
        Marcar brotação e mortalidade – Parcela ${escapeHtml(plotCode)}, bloco ${block}.
      </div>

      <div style="margin-bottom:8px; font-size:12px; color:#6b7280;">
        Clique em cada planta para alternar:
        <strong>cinza</strong> (não brotou) → <strong>verde</strong> (brotou/viva) → <strong>vermelho</strong> (morta).
      </div>

      <div style="
        display:grid;
        grid-template-columns: repeat(3, 1fr);
        gap:8px;
        justify-items:center;
        margin-bottom:12px;
      ">
        ${itemsHtml}
      </div>

      <button class="btn-primary" style="width:100%;" onclick="savePlantStatuses()">
        Salvar brotação/mortalidade
      </button>
    `;

    if (typeof openModal === "function") {
      openModal("Plantas úteis – brotação/mortalidade", bodyHtml);
    }
  };

  window.togglePlantStatus = function togglePlantStatus(position) {
    const current = currentPlantStatuses[position] || 'not_sprouted';
    let next = 'not_sprouted';
    
    if (current === 'not_sprouted') next = 'alive';
    else if (current === 'alive') next = 'dead';
    else next = 'not_sprouted';

    currentPlantStatuses[position] = next;
    openPlantStatusDialog(); // re-render
  };

  window.savePlantStatuses = async function savePlantStatuses() {
    if (!currentMonitoringId) {
      alert("Salve primeiro a biometria antes de registrar status das plantas.");
      return;
    }

    try {
      // Apagar registros antigos
      await s.from("plant_status").delete().eq("monitoring_event_id", currentMonitoringId);

      // Inserir novos
      const records = Object.entries(currentPlantStatuses).map(([pos, status]) => ({
        monitoring_event_id: currentMonitoringId,
        plant_position: Number(pos),
        status: status,
      }));

      if (records.length > 0) {
        const { error } = await s.from("plant_status").insert(records);
        if (error) throw error;
      }

      if (typeof closeModal === "function") closeModal();
      alert("Status das plantas salvo com sucesso.");
    } catch (err) {
      console.error("Erro ao salvar plant_status:", err);
      alert("Erro ao salvar status das plantas.");
    }
  };

  window.openPlantLodgingDialog = function openPlantLodgingDialog() {
    if (window.currentRole === "visitor") return;

    const blockInput = document.getElementById("monitorBlock");
    const plotInput = document.getElementById("monitorPlot");
    const block = blockInput?.value ? parseInt(blockInput.value, 10) : 1;
    const plotCode = plotInput?.value.trim() || `B${block}P1`;

    const total = 9;
    const itemsHtml = Array.from({ length: total }).map((_, idx) => {
      const n = idx + 1;
      const isLodged = currentLodgingStatuses[n] || false;
      const bg = isLodged ? '#fef3c7' : '#dcfce7';
      const color = isLodged ? '#92400e' : '#065f46';

      return `
        <button type="button"
          class="plant-circle"
          data-index="${n}"
          onclick="toggleLodging(${n})"
          style="
            width:34px; height:34px; border-radius:999px;
            border:1px solid #d1d5db;
            background:${bg};
            color:${color};
            font-size:13px;
            display:flex; align-items:center; justify-content:center;
            cursor:pointer;
          ">
          ${n}
        </button>
      `;
    }).join("");

    const bodyHtml = `
      <div style="font-size:13px; color:#4b5563; margin-bottom:8px;">
        Marcar plantas tombadas – Parcela ${escapeHtml(plotCode)}, bloco ${block}.
      </div>

      <div style="margin-bottom:8px; font-size:12px; color:#6b7280;">
        Clique para alternar entre <strong>em pé</strong> (verde) e <strong>tombada</strong> (amarelo).
      </div>

      <div style="
        display:grid;
        grid-template-columns: repeat(3, 1fr);
        gap:8px;
        justify-items:center;
        margin-bottom:12px;
      ">
        ${itemsHtml}
      </div>

      <button class="btn-primary" style="width:100%;" onclick="savePlantLodging()">
        Salvar tombamento
      </button>
    `;

    if (typeof openModal === "function") {
      openModal("Plantas tombadas", bodyHtml);
    }
  };

  window.toggleLodging = function toggleLodging(position) {
    currentLodgingStatuses[position] = !currentLodgingStatuses[position];
    openPlantLodgingDialog(); // re-render
  };

  window.savePlantLodging = async function savePlantLodging() {
    if (!currentMonitoringId) {
      alert("Salve primeiro a biometria antes de registrar tombamento.");
      return;
    }

    try {
      await s.from("plant_lodging").delete().eq("monitoring_event_id", currentMonitoringId);

      const records = Object.entries(currentLodgingStatuses).map(([pos, lodged]) => ({
        monitoring_event_id: currentMonitoringId,
        plant_position: Number(pos),
        is_lodged: lodged,
      }));

      if (records.length > 0) {
        const { error } = await s.from("plant_lodging").insert(records);
        if (error) throw error;
      }

      if (typeof closeModal === "function") closeModal();
      alert("Tombamento salvo com sucesso.");
    } catch (err) {
      console.error("Erro ao salvar plant_lodging:", err);
      alert("Erro ao salvar tombamento.");
    }
  };

  async function loadMonitoringList() {
    if (typeof s === "undefined") return;

    const experiment = window.currentExperiment;
    if (!experiment || !experiment.id) return;

    const listDiv = document.getElementById("monitoringList");
    const counterSpan = document.getElementById("monitoringCounter");

    if (!listDiv) return;

    try {
      const { data, error } = await s
        .from("monitoring_events")
        .select("*")
        .eq("experiment_id", experiment.id)
        .order("monitoring_date", { ascending: false });

      if (error) throw error;

      if (counterSpan) {
        counterSpan.textContent = `${(data || []).length} monitoramentos registrados`;
      }

      if (!data || data.length === 0) {
        listDiv.innerHTML = `
          <p style="font-size:13px; color:#6b7280;">
            Nenhum monitoramento registrado ainda.
          </p>
        `;
        return;
      }

      const formatDate = (iso) => {
        if (!iso) return "";
        const [y, m, d] = iso.split("-");
        return `${d}/${m}/${y}`;
      };

      const isVisitor = window.currentRole === "visitor";

      listDiv.innerHTML = `
        <div style="overflow-x:auto;">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Parcela</th>
                <th>Bloco</th>
                <th>Altura (m)</th>
                <th>Hastes</th>
                <th>Sanidade</th>
                <th style="width:90px;">Ações</th>
              </tr>
            </thead>
            <tbody>
              ${data.map((row) => `
                <tr>
                  <td>${formatDate(row.monitoring_date)}</td>
                  <td>${row.plot_code}</td>
                  <td>${row.block_number}</td>
                  <td>${row.height_m != null ? row.height_m.toFixed(2) : "–"}</td>
                  <td>${row.stem_count || "–"}</td>
                  <td>${row.sanity_score || "–"}</td>
                  <td>
                    <div style="display:flex; flex-wrap:nowrap; gap:4px; justify-content:flex-end;">
                      ${
                        isVisitor
                          ? `<span style="font-size:11px; color:#9ca3af;">Somente leitura</span>`
                          : `
                            <button type="button" class="btn-secondary"
                              style="font-size:12px; padding:4px 8px;"
                              onclick='editMonitoring(${JSON.stringify(row)})'>
                              Editar
                            </button>
                            <button type="button" class="btn-danger"
                              style="font-size:12px; padding:4px 8px;"
                              onclick="confirmDeleteMonitoring('${row.id}')">
                              Excluir
                            </button>
                          `
                      }
                    </div>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      console.error("Erro ao carregar monitoramentos:", err);
      listDiv.innerHTML = `
        <p style="font-size:13px; color:#b91c1c;">
          Erro ao carregar monitoramentos.
        </p>
      `;
    }
  }

  async function loadLatestMonitoringForPlot(experimentId, plotCode) {
    if (!plotCode || !experimentId) return null;

    try {
      const { data, error } = await s
        .from("monitoring_events")
        .select("*")
        .eq("experiment_id", experimentId)
        .eq("plot_code", plotCode)
        .order("monitoring_date", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return data || null;
    } catch (err) {
      console.error("Erro ao buscar último monitoramento:", err);
      return null;
    }
  }

  window.editMonitoring = function editMonitoring(row) {
    if (window.currentRole === "visitor") return;

    currentMonitoringId = row.id;

    document.getElementById("monitorBlock").value = row.block_number || 1;
    document.getElementById("monitorPlot").value = row.plot_code || "";
    document.getElementById("monDate").value = row.monitoring_date || "";
    document.getElementById("monHeight").value = row.height_m || "";
    document.getElementById("monStemCount").value = row.stem_count || "";
    document.getElementById("monStemDiameter").value = row.stem_diameter_cm || "";
    document.getElementById("monSanity").value = row.sanity_score || "";
    document.getElementById("monNotes").value = row.notes || "";

    // Carregar plant_status e plant_lodging
    loadPlantDataForEdit(row.id);

    // Re-render aba biometria para mostrar botão cancelar
    const tabsEl = document.getElementById("monitoringTabs");
    if (tabsEl) {
      tabsEl.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
      tabsEl.querySelector('[data-tab="biometria"]')?.classList.add("active");
      const experiment = window.currentExperiment;
      const blockInput = document.getElementById("monitorBlock");
      const plotInput = document.getElementById("monitorPlot");
      const block = blockInput?.value ? parseInt(blockInput.value, 10) : 1;
      const plotCode = plotInput?.value.trim() || "";
      renderMonitoringTabBiometria(
        document.getElementById("monitoringTabContent"),
        experiment,
        { block, plotCode }
      );
    }
  };

  async function loadPlantDataForEdit(monitoringId) {
    try {
      const { data: statuses } = await s
        .from("plant_status")
        .select("*")
        .eq("monitoring_event_id", monitoringId);

      const { data: lodging } = await s
        .from("plant_lodging")
        .select("*")
        .eq("monitoring_event_id", monitoringId);

      currentPlantStatuses = {};
      currentLodgingStatuses = {};

      (statuses || []).forEach((s) => {
        currentPlantStatuses[s.plant_position] = s.status;
      });

      (lodging || []).forEach((l) => {
        currentLodgingStatuses[l.plant_position] = l.is_lodged;
      });
    } catch (err) {
      console.error("Erro ao carregar dados de plantas:", err);
    }
  }

  window.clearMonitoringForm = function clearMonitoringForm() {
    currentMonitoringId = null;
    currentPlantStatuses = {};
    currentLodgingStatuses = {};

    document.getElementById("monitorBlock").value = 1;
    document.getElementById("monitorPlot").value = "";
    document.getElementById("monDate").value = "";
    document.getElementById("monHeight").value = "";
    document.getElementById("monStemCount").value = "";
    document.getElementById("monStemDiameter").value = "";
    document.getElementById("monSanity").value = "";
    document.getElementById("monNotes").value = "";

    const experiment = window.currentExperiment;
    const block = 1;
    const plotCode = "";
    renderMonitoringTabBiometria(
      document.getElementById("monitoringTabContent"),
      experiment,
      { block, plotCode }
    );
  };

  window.confirmDeleteMonitoring = async function confirmDeleteMonitoring(id) {
    if (window.currentRole === "visitor") {
      alert("Visitantes não podem excluir monitoramentos.");
      return;
    }

    if (!id) return;
    if (!confirm("Deseja excluir este monitoramento?")) return;

    if (typeof s === "undefined") {
      alert("Cliente Supabase não disponível.");
      return;
    }

    try {
      const { error } = await s.from("monitoring_events").delete().eq("id", id);
      if (error) throw error;

      loadMonitoringList();
    } catch (err) {
      console.error("Erro ao excluir monitoramento:", err);
      alert("Erro ao excluir monitoramento.");
    }
  };

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "'")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function formatDateShort(iso) {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }
})();
