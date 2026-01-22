// monitoring.js
// Página de Monitoramento Manual (biometria individual, plantas úteis, plantas tombadas)

(function () {
  let currentMonitoringId = null;
  let currentPlantStatuses = {}; // { position: 'not_sprouted' | 'alive' | 'dead' }
  let currentLodgingStatuses = {}; // { position: true/false }
  let currentBiometrics = {}; // { position: { height_cm, stem_count, diameters: [d1,d2,d3], sanity } }

  window.renderMonitoringPage = renderMonitoringPage;

  function renderMonitoringPage(container) {
    const experiment = window.currentExperiment;

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
          Registre medições biométricas individuais e o estado das plantas úteis e tombadas em cada parcela.
        </div>
      </div>

      <div class="card" id="monitoringHeaderCard">
        <div style="display:flex; flex-wrap:wrap; justify-content:space-between; gap:10px; align-items:center;">
          <div style="font-size:14px; color:#4b5563;">
            Experimento <strong>${escapeHtml(experiment.code || "")}</strong> · 
            ${escapeHtml(experiment.name || "Sem nome")}<br>
            <span style="font-size:12px; color:#6b7280;">
              Selecione bloco e parcela para registrar medições individuais por planta.
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
            <select id="monitorBlock" ${isVisitor ? "disabled" : ""}>
              <option value="1">Bloco 1</option>
              <option value="2">Bloco 2</option>
              <option value="3">Bloco 3</option>
            </select>
          </div>
          <div style="flex:0 0 160px;">
            <label for="monitorPlot">Parcela</label>
            <select id="monitorPlot" ${isVisitor ? "disabled" : ""}>
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
      </div>

      <div class="tabs" id="monitoringTabs">
        <button data-tab="iniciar" class="active">Iniciar monitoramento</button>
        <button data-tab="biometria">Biometria individual</button>
        <button data-tab="uteis">Plantas úteis</button>
        <button data-tab="tombadas">Plantas tombadas</button>
      </div>
      <div id="monitoringTabContent" style="margin-top:10px;"></div>
    `;

    const tabsEl = document.getElementById("monitoringTabs");
    const contentEl = document.getElementById("monitoringTabContent");

    if (!tabsEl || !contentEl) return;

    // Detectar mudanças de bloco ou parcela e resetar formulário
    const blockInput = document.getElementById("monitorBlock");
    const plotInput = document.getElementById("monitorPlot");

    if (blockInput) {
      blockInput.addEventListener("change", () => {
        resetMonitoringForm();
        const tab = tabsEl.querySelector("button.active")?.dataset.tab || "iniciar";
        renderCurrentTab(tab);
      });
    }

if (plotInput) {
  plotInput.addEventListener("change", () => {
    resetMonitoringForm();
    const tab = tabsEl.querySelector("button.active")?.dataset.tab || "iniciar";
    renderCurrentTab(tab);
  });
}

    const renderCurrentTab = async (tab) => {
      const state = getCurrentSelection();
      if (tab === "iniciar") {
        renderMonitoringTabIniciar(contentEl, experiment, state);
      } else if (tab === "biometria") {
        await renderMonitoringTabBiometria(contentEl, experiment, state);
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
      const plotCode = (plotInput && plotInput.value.trim()) || "";
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

    renderCurrentTab("iniciar");
  }
  
  function resetMonitoringForm() {
  currentMonitoringId = null;
  currentPlantStatuses = {};
  currentLodgingStatuses = {};
  currentBiometrics = {};
}

  function renderMonitoringTabIniciar(container, experiment, selection) {
  const isVisitor = window.currentRole === "visitor";

  container.innerHTML = `
    <div style="margin-bottom:10px; font-size:13px; color:#4b5563;">
      ${selection.plotCode ? `<strong>Parcela:</strong> ${escapeHtml(selection.plotCode)} · Bloco ${selection.block}` : "Selecione uma parcela para começar"}
    </div>

    <div style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
      <div style="flex:0 0 180px;">
        <label for="monDate">Data do monitoramento</label>
        <input type="date" id="monDate" ${isVisitor ? "disabled" : ""} />
      </div>
    </div>

    <div style="margin-bottom:10px;">
      <label for="monNotes">Observações gerais da parcela</label>
      <textarea id="monNotes" rows="3" ${isVisitor ? "disabled" : ""}
        style="width:100%; padding:9px 11px; border-radius:10px; border:1px solid #e5e7eb; font-size:14px; resize:vertical;"
        placeholder="Condições climáticas, estado geral da parcela, etc."></textarea>
    </div>

    <div style="font-size:12px; color:#6b7280; margin-bottom:10px;">
      Após iniciar o monitoramento, você poderá registrar os dados biométricos individuais de cada planta na aba <strong>Biometria individual</strong>.
    </div>

    <button class="btn-primary" style="width:auto; padding-inline:18px;" 
      onclick="saveMonitoringInit()" ${isVisitor ? "disabled" : ""}>
      ${currentMonitoringId ? "Atualizar informações gerais" : "Iniciar monitoramento"}
    </button>
    ${currentMonitoringId ? `
      <button class="btn-secondary" style="margin-left:8px;" onclick="clearMonitoringForm()">
        Cancelar edição
      </button>
    ` : ""}
  `;
}

  async function renderMonitoringTabBiometria(container, experiment, selection) {
    const isVisitor = window.currentRole === "visitor";

    const latest = await loadLatestMonitoringForPlot(experiment.id, selection.plotCode, selection.block); // ✅ adicionar selection.block
    
    if (!latest) {
      container.innerHTML = `
        <div style="margin-bottom:10px; font-size:13px; color:#b91c1c;">
          <strong>Parcela:</strong> ${escapeHtml(selection.plotCode)} · Bloco ${selection.block}
        </div>
        <p style="font-size:13px; color:#6b7280; margin-bottom:8px;">
          Nenhum monitoramento registrado ainda para esta parcela.
          <br>Inicie um monitoramento na aba <strong>"Iniciar monitoramento"</strong> primeiro.
        </p>
      `;
      return;
    }

    currentMonitoringId = latest.id;
    await loadBiometricsData(latest.id);

    // Calcular progresso
    const totalPlants = 9;
    const filled = Object.keys(currentBiometrics).length;
    const progress = Math.round((filled / totalPlants) * 100);

    container.innerHTML = `
      <div style="margin-bottom:10px; font-size:13px; color:#4b5563;">
        <strong>Parcela:</strong> ${escapeHtml(selection.plotCode)} · Bloco ${selection.block}
        <br><span style="font-size:12px; color:#6b7280;">Monitoramento de ${formatDateShort(latest.monitoring_date)}</span>
      </div>

      <div style="margin-bottom:12px; padding:10px; background:#f1f5f9; border-radius:10px;">
        <div style="font-size:12px; color:#6b7280; margin-bottom:4px;">
          Progresso: <strong>${filled}/${totalPlants} plantas</strong> (${progress}%)
        </div>
        <div style="width:100%; height:8px; background:#e5e7eb; border-radius:4px; overflow:hidden;">
          <div style="width:${progress}%; height:100%; background:#10b981; transition:width 0.3s;"></div>
        </div>
      </div>

      <div style="margin-bottom:10px; font-size:13px; color:#374151;">
        <button class="btn-secondary" onclick="openBiometricCollectionDialog()" ${isVisitor ? "disabled" : ""}>
          Coletar dados biométricos (grade 3×3)
        </button>
      </div>

      <div style="font-size:12px; color:#6b7280;">
        Clique no botão acima para abrir a grade de plantas e registrar:
        <strong>altura (cm)</strong>, <strong>nº hastes</strong>, <strong>3 medidas de diâmetro (cm)</strong> e <strong>sanidade (1-5)</strong> para cada planta.
      </div>
    `;
  }

  async function renderMonitoringTabPlantasUteis(container, experiment, selection) {
  const isVisitor = window.currentRole === "visitor";

  const latest = await loadLatestMonitoringForPlot(experiment.id, selection.plotCode, selection.block); // ✅ adicionar selection.block
  
  if (!latest) {
    container.innerHTML = `
      <div style="margin-bottom:10px; font-size:13px; color:#b91c1c;">
        <strong>Parcela:</strong> ${escapeHtml(selection.plotCode)} · Bloco ${selection.block}
      </div>
      <p style="font-size:13px; color:#6b7280; margin-bottom:8px;">
        Nenhum monitoramento registrado ainda para esta parcela.
        <br>Inicie um monitoramento primeiro.
      </p>
    `;
    return;
  }

  currentMonitoringId = latest.id;
  await loadPlantDataForEdit(latest.id);
  await loadBiometricsData(latest.id);

  container.innerHTML = `
    <div style="margin-bottom:10px; font-size:13px; color:#4b5563;">
      <strong>Parcela:</strong> ${escapeHtml(selection.plotCode)} · Bloco ${selection.block}
      <br><span style="font-size:12px; color:#6b7280;">Monitoramento de ${formatDateShort(latest.monitoring_date)}</span>
    </div>

    <div style="margin-bottom:10px; font-size:13px; color:#374151;">
      <button class="btn-secondary" onclick="openPlantStatusDialog()" ${isVisitor ? "disabled" : ""}>
        Marcar mortalidade
      </button>
    </div>

    <div style="font-size:12px; color:#6b7280;">
      As plantas marcadas como <strong>"Brotou"</strong> na aba Biometria aparecem automaticamente como <strong>vivas</strong> (verde).
      <br>Clique no botão para marcar plantas que morreram (ficarão vermelhas).
    </div>
  `;
}

  async function renderMonitoringTabPlantasTombadas(container, experiment, selection) {
  const isVisitor = window.currentRole === "visitor";

  const latest = await loadLatestMonitoringForPlot(experiment.id, selection.plotCode, selection.block); // ✅ adicionar selection.block
    
  if (!latest) {
    container.innerHTML = `
      <div style="margin-bottom:10px; font-size:13px; color:#b91c1c;">
        <strong>Parcela:</strong> ${escapeHtml(selection.plotCode)} · Bloco ${selection.block}
      </div>
      <p style="font-size:13px; color:#6b7280; margin-bottom:8px;">
        Nenhum monitoramento registrado ainda para esta parcela.
        <br>Inicie um monitoramento primeiro.
      </p>
    `;
    return;
  }

  currentMonitoringId = latest.id;
  await loadPlantDataForEdit(latest.id);
  await loadBiometricsData(latest.id);

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
      <br>Plantas aparecem automaticamente baseadas nos dados de biometria e mortalidade.
    </div>
  `;
}

  window.saveMonitoringInit = async function saveMonitoringInit() {
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
  const plotCode = plotInput?.value.trim();

  if (!plotCode) {
    alert("Selecione uma parcela.");
    return;
  }

  const date = document.getElementById("monDate")?.value || null;
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
    notes: notes || null,
  };

  try {
    const isEditing = !!currentMonitoringId; // Salva o estado ANTES de modificar
    
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

    loadMonitoringList();

    // Agora sim a mensagem correta
    if (isEditing) {
      alert("Monitoramento atualizado com sucesso.");
    } else {
      alert("Monitoramento iniciado com sucesso. Agora você pode coletar os dados biométricos na aba 'Biometria individual'.");
    }
    
  } catch (err) {
    console.error("Erro ao salvar monitoramento:", err);
    alert("Erro ao salvar monitoramento.");
  }
};

  window.openBiometricCollectionDialog = function openBiometricCollectionDialog() {
    if (window.currentRole === "visitor") return;

    const blockInput = document.getElementById("monitorBlock");
    const plotInput = document.getElementById("monitorPlot");
    const block = blockInput?.value ? parseInt(blockInput.value, 10) : 1;
    const plotCode = plotInput?.value.trim() || "";

    const total = 9;
    const itemsHtml = Array.from({ length: total }).map((_, idx) => {
      const n = idx + 1;
      const hasBio = currentBiometrics[n];
      const bg = hasBio ? '#dcfce7' : '#f3f4f6';
      const color = hasBio ? '#065f46' : '#6b7280';

      return `
        <button type="button"
          class="plant-circle"
          onclick="openPlantBiometricForm(${n})"
          style="
            width:42px; height:42px; border-radius:999px;
            border:2px solid ${hasBio ? '#10b981' : '#d1d5db'};
            background:${bg};
            color:${color};
            font-size:14px;
            font-weight:600;
            display:flex; align-items:center; justify-content:center;
            cursor:pointer;
          ">
          ${n}
        </button>
      `;
    }).join("");

    const bodyHtml = `
      <div style="font-size:13px; color:#4b5563; margin-bottom:8px;">
        Biometria individual – Parcela ${escapeHtml(plotCode)}, bloco ${block}.
      </div>

      <div style="margin-bottom:8px; font-size:12px; color:#6b7280;">
        Clique em cada planta para registrar: <strong>altura, hastes, 3 diâmetros, sanidade</strong>.
        Plantas com dados preenchidos ficam verdes.
      </div>

      <div style="
        display:grid;
        grid-template-columns: repeat(3, 1fr);
        gap:10px;
        justify-items:center;
        margin-bottom:12px;
      ">
        ${itemsHtml}
      </div>

      <button class="btn-secondary" style="width:100%;" onclick="closeModal()">
        Fechar
      </button>
    `;

    if (typeof openModal === "function") {
      openModal("Biometria individual das plantas", bodyHtml);
    }
  };

  window.openPlantBiometricForm = function openPlantBiometricForm(position) {
  const bio = currentBiometrics[position] || {};

  const bodyHtml = `
    <div style="font-size:14px; font-weight:600; color:#065f46; margin-bottom:8px;">
      Planta ${position}
    </div>

    <div style="margin-bottom:12px; padding:10px; background:#f0fdf4; border-radius:8px; border:1px solid #bbf7d0;">
      <div style="font-size:13px; font-weight:600; color:#065f46; margin-bottom:6px;">
        Estágio fenológico
      </div>
      <div style="display:flex; gap:12px;">
        <label style="display:flex; align-items:center; gap:6px; font-size:13px; color:#374151; cursor:pointer;">
          <input type="checkbox" id="bioSprouted" ${bio.has_sprouted ? 'checked' : ''} 
            style="width:16px; height:16px; cursor:pointer;">
          🌱 Brotou
        </label>
        <label style="display:flex; align-items:center; gap:6px; font-size:13px; color:#374151; cursor:pointer;">
          <input type="checkbox" id="bioExpanded" ${bio.has_expanded_leaves ? 'checked' : ''} 
            style="width:16px; height:16px; cursor:pointer;">
          🍃 Expandiu folhas
        </label>
      </div>
      <div style="font-size:11px; color:#6b7280; margin-top:4px;">
        Deixe desmarcado se ainda não ocorreu
      </div>
    </div>

    <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:10px;">
      <div style="flex:1 1 140px;">
        <label for="bioHeight">Altura (cm)</label>
        <input type="number" step="0.1" id="bioHeight" value="${bio.height_cm || ""}" />
      </div>
      <div style="flex:1 1 120px;">
        <label for="bioStems">Nº hastes</label>
        <input type="number" id="bioStems" value="${bio.stem_count || ""}" />
      </div>
    </div>

    <div style="margin-bottom:10px;">
      <label style="font-size:13px; font-weight:600; color:#4b5563; display:block; margin-bottom:4px;">
        Diâmetro do caule (cm) - 3 medições
      </label>
      <div style="display:flex; gap:8px;">
        <div style="flex:1;">
          <input type="number" step="0.01" id="bioDiam1" placeholder="Medida 1" value="${bio.stem_diameter_1_cm || ""}" />
        </div>
        <div style="flex:1;">
          <input type="number" step="0.01" id="bioDiam2" placeholder="Medida 2" value="${bio.stem_diameter_2_cm || ""}" />
        </div>
        <div style="flex:1;">
          <input type="number" step="0.01" id="bioDiam3" placeholder="Medida 3" value="${bio.stem_diameter_3_cm || ""}" />
        </div>
      </div>
    </div>

    <div style="margin-bottom:12px;">
      <label for="bioSanity">Sanidade (1 a 5)</label>
      <input type="number" min="1" max="5" id="bioSanity" value="${bio.sanity_score || ""}" />
    </div>

    <button class="btn-primary" style="width:100%;" onclick="savePlantBiometric(${position})">
      Salvar dados da planta ${position}
    </button>
  `;

  if (typeof openModal === "function") {
    openModal(`Biometria - Planta ${position}`, bodyHtml);
  }
};

  window.savePlantBiometric = async function savePlantBiometric(position) {
  if (!currentMonitoringId) {
    alert("Inicie um monitoramento primeiro.");
    return;
  }

  const height = document.getElementById("bioHeight")?.value || null;
  const stems = document.getElementById("bioStems")?.value || null;
  const diam1 = document.getElementById("bioDiam1")?.value || null;
  const diam2 = document.getElementById("bioDiam2")?.value || null;
  const diam3 = document.getElementById("bioDiam3")?.value || null;
  const sanity = document.getElementById("bioSanity")?.value || null;
  
  // ✅ CORRIGIDO: usar checked diretamente, não OR null
  const sproutedCheckbox = document.getElementById("bioSprouted");
  const expandedCheckbox = document.getElementById("bioExpanded");
  
  const sprouted = sproutedCheckbox ? sproutedCheckbox.checked : false;
  const expanded = expandedCheckbox ? expandedCheckbox.checked : false;

  const payload = {
    monitoring_event_id: currentMonitoringId,
    plant_position: position,
    height_cm: height ? Number(height) : null,
    stem_count: stems ? Number(stems) : null,
    stem_diameter_1_cm: diam1 ? Number(diam1) : null,
    stem_diameter_2_cm: diam2 ? Number(diam2) : null,
    stem_diameter_3_cm: diam3 ? Number(diam3) : null,
    sanity_score: sanity ? Number(sanity) : null,
    has_sprouted: sprouted,  // ✅ Agora salva true/false corretamente
    has_expanded_leaves: expanded,  // ✅ Agora salva true/false corretamente
  };

  try {
    // Verificar se já existe
    const { data: existing } = await s
      .from("plant_biometrics")
      .select("id")
      .eq("monitoring_event_id", currentMonitoringId)
      .eq("plant_position", position)
      .maybeSingle();

    if (existing) {
      const { error } = await s
        .from("plant_biometrics")
        .update(payload)
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await s.from("plant_biometrics").insert(payload);
      if (error) throw error;
    }

    // Atualizar cache local
    currentBiometrics[position] = payload;

    if (typeof closeModal === "function") closeModal();
    
    // Reabrir lista de plantas
    setTimeout(() => openBiometricCollectionDialog(), 100);
    
  } catch (err) {
    console.error("Erro ao salvar biometria da planta:", err);
    alert("Erro ao salvar dados da planta.");
  }
};

  window.openPlantStatusDialog = function openPlantStatusDialog() {
  if (window.currentRole === "visitor") return;

  const blockInput = document.getElementById("monitorBlock");
  const plotInput = document.getElementById("monitorPlot");
  const block = blockInput?.value ? parseInt(blockInput.value, 10) : 1;
  const plotCode = plotInput?.value.trim() || "";

  // Sincronizar status com dados de brotação da biometria
  for (let pos = 1; pos <= 9; pos++) {
    const bio = currentBiometrics[pos];
    
    // Se planta brotou na biometria e ainda não tem status definido, marca como 'alive'
    if (bio && bio.has_sprouted === true && !currentPlantStatuses[pos]) {
      currentPlantStatuses[pos] = 'alive';
    }
    
    // Se não brotou e não tem status, marca como 'not_sprouted'
    if (bio && bio.has_sprouted === false && !currentPlantStatuses[pos]) {
      currentPlantStatuses[pos] = 'not_sprouted';
    }
    
    // Se não tem informação de brotação na biometria, mantém como 'not_sprouted'
    if (bio && bio.has_sprouted === null && !currentPlantStatuses[pos]) {
      currentPlantStatuses[pos] = 'not_sprouted';
    }
  }

  const total = 9;
  const itemsHtml = Array.from({ length: total }).map((_, idx) => {
    const n = idx + 1;
    const bio = currentBiometrics[n];
    let status = currentPlantStatuses[n] || 'not_sprouted';
    
    // FORÇAR cinza se não tem informação de brotação na biometria
    if (!bio || bio.has_sprouted !== true) {
      // Só permite status 'dead' ou 'not_sprouted' se não brotou
      if (status === 'alive') {
        status = 'not_sprouted';
        currentPlantStatuses[n] = 'not_sprouted';
      }
    }
    
    let bg = '#e5e7eb'; // cinza - não brotou
    let color = '#374151';
    let borderColor = '#d1d5db';
    
    if (status === 'alive') {
      bg = '#dcfce7'; // verde - viva
      color = '#065f46';
      borderColor = '#10b981';
    } else if (status === 'dead') {
      bg = '#fee2e2'; // vermelho - morta
      color = '#7f1d1d';
      borderColor = '#dc2626';
    }

    // Indicador se foi marcada como brotada na biometria
    const sproutedMark = bio?.has_sprouted === true ? '<div style="font-size:9px;">🌱</div>' : '';

    return `
      <button type="button"
        class="plant-circle"
        data-index="${n}"
        onclick="togglePlantStatus(${n})"
        style="
          width:40px; height:40px; border-radius:999px;
          border:2px solid ${borderColor};
          background:${bg};
          color:${color};
          font-size:13px;
          font-weight:600;
          display:flex; 
          flex-direction:column;
          align-items:center; 
          justify-content:center;
          cursor:pointer;
          position:relative;
        ">
        <div>${n}</div>
        ${sproutedMark}
      </button>
    `;
  }).join("");

  const bodyHtml = `
    <div style="font-size:13px; color:#4b5563; margin-bottom:8px;">
      Marcar mortalidade – Parcela ${escapeHtml(plotCode)}, bloco ${block}.
    </div>

    <div style="margin-bottom:10px; padding:8px; background:#f0fdf4; border-radius:8px; font-size:12px; color:#065f46;">
      🌱 = Planta marcada como brotada na biometria
    </div>

    <div style="margin-bottom:8px; font-size:12px; color:#6b7280;">
      Plantas <strong>brotadas</strong> (🌱) aparecem em <strong style="color:#10b981;">verde</strong>.
      <br>Plantas <strong>sem brotação indicada</strong> ficam em <strong style="color:#9ca3af;">cinza</strong>.
      <br>Clique para alternar: <strong style="color:#10b981;">Verde (viva)</strong> → <strong style="color:#dc2626;">Vermelho (morta)</strong> → <strong style="color:#9ca3af;">Cinza (não brotou)</strong>
    </div>

    <div style="
      display:grid;
      grid-template-columns: repeat(3, 1fr);
      gap:10px;
      justify-items:center;
      margin-bottom:12px;
    ">
      ${itemsHtml}
    </div>

    <button class="btn-primary" style="width:100%;" onclick="savePlantStatuses()">
      Salvar mortalidade
    </button>
  `;

  if (typeof openModal === "function") {
    openModal("Plantas úteis – mortalidade", bodyHtml);
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
      alert("Inicie um monitoramento primeiro.");
      return;
    }

    try {
      await s.from("plant_status").delete().eq("monitoring_event_id", currentMonitoringId);

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
  const plotCode = plotInput?.value.trim() || "";

  // Sincronizar status com dados de brotação
  for (let pos = 1; pos <= 9; pos++) {
    const bio = currentBiometrics[pos];
    if (bio && bio.has_sprouted === true && !currentPlantStatuses[pos]) {
      currentPlantStatuses[pos] = 'alive';
    }
  }

  const total = 9;
  const itemsHtml = Array.from({ length: total }).map((_, idx) => {
    const n = idx + 1;
    const bio = currentBiometrics[n];
    const status = currentPlantStatuses[n] || 'not_sprouted';
    const isLodged = currentLodgingStatuses[n] || false;
    
    // Só pode marcar tombamento se brotou E está viva
    const canToggle = (bio?.has_sprouted === true) && (status === 'alive');
    
    let bg = '#e5e7eb'; // cinza - não disponível
    let color = '#9ca3af';
    let cursor = 'not-allowed';
    let opacity = '0.5';
    let borderColor = '#d1d5db';
    
    if (canToggle) {
      bg = isLodged ? '#fef3c7' : '#dcfce7'; // amarelo se tombada, verde se em pé
      color = isLodged ? '#92400e' : '#065f46';
      borderColor = isLodged ? '#f59e0b' : '#10b981';
      cursor = 'pointer';
      opacity = '1';
    }

    const sproutedMark = bio?.has_sprouted === true ? '<div style="font-size:9px;">🌱</div>' : '';
    const deadMark = status === 'dead' ? '<div style="font-size:9px;">❌</div>' : '';

    return `
      <button type="button"
        class="plant-circle"
        data-index="${n}"
        onclick="${canToggle ? `toggleLodging(${n})` : 'return false;'}"
        style="
          width:40px; height:40px; border-radius:999px;
          border:2px solid ${borderColor};
          background:${bg};
          color:${color};
          font-size:13px;
          font-weight:600;
          display:flex; 
          flex-direction:column;
          align-items:center; 
          justify-content:center;
          cursor:${cursor};
          opacity:${opacity};
        ">
        <div>${n}</div>
        ${sproutedMark}${deadMark}
      </button>
    `;
  }).join("");

  const bodyHtml = `
    <div style="font-size:13px; color:#4b5563; margin-bottom:8px;">
      Marcar plantas tombadas – Parcela ${escapeHtml(plotCode)}, bloco ${block}.
    </div>

    <div style="margin-bottom:10px; padding:8px; background:#f0fdf4; border-radius:8px; font-size:12px; color:#065f46;">
      🌱 = Brotou · ❌ = Morta · <span style="color:#9ca3af;">Cinza</span> = Não brotou ou morta
    </div>

    <div style="margin-bottom:8px; font-size:12px; color:#6b7280;">
      Apenas plantas <strong style="color:#10b981;">brotadas e vivas</strong> (🌱 verde) podem ser marcadas.
      <br>Plantas <strong>sem brotação</strong> ou <strong>mortas</strong> ficam em <strong style="color:#9ca3af;">cinza</strong>.
      <br>Clique para alternar: <strong style="color:#10b981;">Verde (em pé)</strong> ↔ <strong style="color:#f59e0b;">Amarelo (tombada)</strong>
    </div>

    <div style="
      display:grid;
      grid-template-columns: repeat(3, 1fr);
      gap:10px;
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
      alert("Inicie um monitoramento primeiro.");
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
          <th>Plantas medidas</th>
          <th style="width:180px;">Ações</th>
        </tr>
      </thead>
      <tbody>
        ${data.map((row) => `
          <tr>
            <td>${formatDate(row.monitoring_date)}</td>
            <td>${row.plot_code}</td>
            <td>${row.block_number}</td>
            <td id="plantCount_${row.id}">...</td>
            <td>
              <div style="display:flex; gap:4px; align-items:center; justify-content:flex-start;">
                <button type="button" class="btn-secondary"
                  style="font-size:11px; padding:4px 6px; white-space:nowrap;"
                  onclick="viewPlantDetails('${row.id}')">
                  👁️ Ver
                </button>
                ${
                  isVisitor
                    ? ``
                    : `
                      <button type="button" class="btn-secondary"
                        style="font-size:11px; padding:4px 6px; white-space:nowrap;"
                        onclick="editMonitoring('${row.id}')">
                        ✏️ Editar
                      </button>
                      <button type="button" class="btn-danger"
                        style="font-size:11px; padding:4px 6px; white-space:nowrap;"
                        onclick="confirmDeleteMonitoring('${row.id}')">
                        🗑️ Excluir
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

    // Carregar contagem de plantas medidas para cada monitoramento
    data.forEach(async (row) => {
      const { data: bioData } = await s
        .from("plant_biometrics")
        .select("id")
        .eq("monitoring_event_id", row.id);
      
      const cell = document.getElementById(`plantCount_${row.id}`);
      if (cell) {
        cell.textContent = `${(bioData || []).length}/9`;
      }
    });

  } catch (err) {
    console.error("Erro ao carregar monitoramentos:", err);
    listDiv.innerHTML = `
      <p style="font-size:13px; color:#b91c1c;">
        Erro ao carregar monitoramentos.
      </p>
    `;
  }
}

  async function loadLatestMonitoringForPlot(experimentId, plotCode, blockNumber) {
  if (!plotCode || !experimentId || !blockNumber) return null;

  try {
    const { data, error } = await s
      .from("monitoring_events")
      .select("*")
      .eq("experiment_id", experimentId)
      .eq("plot_code", plotCode)
      .eq("block_number", blockNumber)  // ✅ ADICIONAR ESTA LINHA
      .order("monitoring_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } catch (err) {
    console.error("Erro ao buscar último monitoramento:", err);
    return null;
  }
}

  async function loadBiometricsData(monitoringId) {
    try {
      const { data } = await s
        .from("plant_biometrics")
        .select("*")
        .eq("monitoring_event_id", monitoringId);

      currentBiometrics = {};
      (data || []).forEach((b) => {
        currentBiometrics[b.plant_position] = b;
      });
    } catch (err) {
      console.error("Erro ao carregar dados biométricos:", err);
    }
  }

  window.editMonitoring = async function editMonitoring(id) {
    if (window.currentRole === "visitor") return;

    try {
      const { data: row, error } = await s
        .from("monitoring_events")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (!row) {
        alert("Monitoramento não encontrado.");
        return;
      }

      currentMonitoringId = row.id;

      await loadPlantDataForEdit(row.id);
      await loadBiometricsData(row.id);

      const tabsEl = document.getElementById("monitoringTabs");
      if (tabsEl) {
        tabsEl.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
        tabsEl.querySelector('[data-tab="iniciar"]')?.classList.add("active");
        
        const experiment = window.currentExperiment;
        const block = parseInt(row.block_number, 10) || 1;
        const plotCode = row.plot_code || "";
        
        renderMonitoringTabIniciar(
          document.getElementById("monitoringTabContent"),
          experiment,
          { block, plotCode }
        );
      }

      setTimeout(() => {
        const blockSelect = document.getElementById("monitorBlock");
        const plotSelect = document.getElementById("monitorPlot");
        
        if (blockSelect) blockSelect.value = String(row.block_number || 1);
        if (plotSelect) plotSelect.value = row.plot_code || "";
        
        const dateInput = document.getElementById("monDate");
        if (dateInput) dateInput.value = row.monitoring_date || "";
        
        const notesInput = document.getElementById("monNotes");
        if (notesInput) notesInput.value = row.notes || "";
      }, 50);

    } catch (err) {
      console.error("Erro ao carregar monitoramento para edição:", err);
      alert("Erro ao carregar monitoramento.");
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
    currentBiometrics = {};

    document.getElementById("monitorBlock").value = "1";
    document.getElementById("monitorPlot").value = "";
    document.getElementById("monDate").value = "";
    document.getElementById("monNotes").value = "";

    const experiment = window.currentExperiment;
    renderMonitoringTabIniciar(
      document.getElementById("monitoringTabContent"),
      experiment,
      { block: 1, plotCode: "" }
    );
  };

  window.confirmDeleteMonitoring = async function confirmDeleteMonitoring(id) {
    if (window.currentRole === "visitor") {
      alert("Visitantes não podem excluir monitoramentos.");
      return;
    }

    if (!id) return;
    if (!confirm("Deseja excluir este monitoramento e todos os dados biométricos associados?")) return;

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
  window.viewPlantDetails = async function viewPlantDetails(monitoringId) {
  try {
    // Buscar dados do evento
    const { data: event, error: eventError } = await s
      .from("monitoring_events")
      .select("*")
      .eq("id", monitoringId)
      .single();

    if (eventError) throw eventError;

    // Buscar biometria individual
    const { data: biometrics } = await s
      .from("plant_biometrics")
      .select("*")
      .eq("monitoring_event_id", monitoringId)
      .order("plant_position");

    // Buscar status
    const { data: statuses } = await s
      .from("plant_status")
      .select("*")
      .eq("monitoring_event_id", monitoringId);

    // Buscar acamamento
    const { data: lodging } = await s
      .from("plant_lodging")
      .select("*")
      .eq("monitoring_event_id", monitoringId);

    // Criar mapas para acesso rápido
    const bioMap = {};
    const statusMap = {};
    const lodgingMap = {};

    (biometrics || []).forEach(b => bioMap[b.plant_position] = b);
    (statuses || []).forEach(s => statusMap[s.plant_position] = s.status);
    (lodging || []).forEach(l => lodgingMap[l.plant_position] = l.is_lodged);

    // Gerar linhas da tabela (9 plantas)
    const rows = Array.from({ length: 9 }, (_, i) => {
    const pos = i + 1;
    const bio = bioMap[pos];
    const status = statusMap[pos] || '-';
    const isLodged = lodgingMap[pos] || false;

    // Labels de status
    let statusLabel = '-';
    if (status === 'not_sprouted') statusLabel = '🌱 Não brotou';
    else if (status === 'alive') statusLabel = '✅ Viva';
    else if (status === 'dead') statusLabel = '❌ Morta';

    const lodgingLabel = isLodged ? '⚠️ Sim' : '-';
  
    // Labels fenológicos
    const sproutedLabel = bio?.has_sprouted ? '✅' : '-';
    const expandedLabel = bio?.has_expanded_leaves ? '✅' : '-';

    return `
      <tr>
        <td style="text-align:center; font-weight:600;">${pos}</td>
        <td style="text-align:center;">${sproutedLabel}</td>
        <td style="text-align:center;">${expandedLabel}</td>
        <td style="text-align:center;">${bio?.height_cm || '-'}</td>
        <td style="text-align:center;">${bio?.stem_count || '-'}</td>
        <td style="text-align:center;">${bio?.stem_diameter_1_cm || '-'}</td>
        <td style="text-align:center;">${bio?.stem_diameter_2_cm || '-'}</td>
        <td style="text-align:center;">${bio?.stem_diameter_3_cm || '-'}</td>
        <td style="text-align:center;">${bio?.sanity_score || '-'}</td>
        <td style="text-align:center;">${statusLabel}</td>
        <td style="text-align:center;">${lodgingLabel}</td>
      </tr>
    `;
  }).join("");

    const bodyHtml = `
      <div style="margin-bottom:12px; padding:10px; background:#f1f5f9; border-radius:8px;">
        <div style="font-size:13px; color:#374151;">
          <strong>Parcela:</strong> ${escapeHtml(event.plot_code)} · 
          <strong>Bloco:</strong> ${event.block_number} · 
          <strong>Data:</strong> ${formatDateShort(event.monitoring_date)}
        </div>
        ${event.notes ? `
          <div style="margin-top:6px; font-size:12px; color:#6b7280;">
            <strong>Observações:</strong> ${escapeHtml(event.notes)}
          </div>
        ` : ''}
      </div>

      <div style="overflow-x:auto; max-height:400px; overflow-y:auto;">
        <table style="font-size:12px;">
          <thead style="position:sticky; top:0; background:#fff;">
            <tr>
              <th style="text-align:center;">Pos.</th>
              <th style="text-align:center;">Brotou</th>
              <th style="text-align:center;">Expandiu</th>
              <th style="text-align:center;">Altura<br>(cm)</th>
              <th style="text-align:center;">Hastes</th>
              <th style="text-align:center;">Diâm. 1<br>(cm)</th>
              <th style="text-align:center;">Diâm. 2<br>(cm)</th>
              <th style="text-align:center;">Diâm. 3<br>(cm)</th>
              <th style="text-align:center;">Sanidade<br>(1-5)</th>
              <th style="text-align:center;">Status</th>
              <th style="text-align:center;">Tombada</th>
            </tr>
          </thead>

          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>

      <button class="btn-secondary" style="width:100%; margin-top:12px;" onclick="closeModal()">
        Fechar
      </button>
    `;

    if (typeof openModal === "function") {
      openModal(`Dados individuais das plantas · ${event.plot_code}`, bodyHtml);
    }

  } catch (err) {
    console.error("Erro ao carregar detalhes das plantas:", err);
    alert("Erro ao carregar dados das plantas.");
  }
};
})();
