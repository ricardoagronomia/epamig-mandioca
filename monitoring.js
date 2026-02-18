// monitoring.js
// Página de Monitoramento Manual (biometria individual, plantas úteis, plantas tombadas)
// Versão atualizada: suporte a múltiplas hastes com medições individuais e plantas de referência

(function () {
  // Funções auxiliares
  function formatDateShort(isoDate) {
    if (!isoDate) return '–';
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  }

  function escapeHtml(text) {
    if (!text) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
  }
  // INSERIR APÓS a função escapeHtml e ANTES de currentMonitoringId
window.renderPlantCircles = function(plantStatuses, lodgingStatuses, biometrics, options = {}) {
  const {
    size = 30,
    fontSize = 12,
    showLabels = true,
    compact = false,
    gridLayout = false  // <-- ADICIONAR ESTA LINHA
  } = options;
  
  const positions = Object.keys(plantStatuses || {}).sort((a, b) => {
    const numA = parseInt(a);
    const numB = parseInt(b);
    return numA - numB;
  });
  
  if (positions.length === 0) return '';
  
  const circlesHtml = positions.map(pos => {
    const status = plantStatuses[pos];
    const isLodged = lodgingStatuses?.[pos] === true;
    const bioData = biometrics?.[pos];
    const isSample = bioData?.is_reference_plant === true;
    
    let bgColor, borderColor, textColor;
    if (status === 'dead') {
      bgColor = '#fee2e2';
      borderColor = '#ef4444';
      textColor = '#991b1b';
    } else if (status === 'not_sprouted') {
      bgColor = '#f3f4f6';
      borderColor = '#9ca3af';
      textColor = '#6b7280';
    } else {
      bgColor = '#dcfce7';
      borderColor = '#22c55e';
      textColor = '#166534';
    }
    
    if (isLodged) {
      bgColor = '#fed7aa';
      borderColor = '#f97316';
      textColor = '#9a3412';
    }
    
    const borderWidth = isSample ? 3 : 2;
    
    return `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background-color: ${bgColor};
        border: ${borderWidth}px solid ${borderColor};
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${fontSize}px;
        font-weight: 600;
        color: ${textColor};
        ${compact ? 'margin: 1px;' : 'margin: 4px;'}
      ">
        ${showLabels ? pos : ''}
        ${isSample ? `
          <div style="
            position: absolute;
            top: -2px;
            right: -2px;
            width: 8px;
            height: 8px;
            background: #3b82f6;
            border-radius: 50%;
            border: 1px solid white;
          "></div>
        ` : ''}
      </div>
    `;
  }).join('');
  
    // Se gridLayout = true, usar grid 3x3, senão flexbox normal
  if (gridLayout) {
    return `
      <div style="
        display: grid !important;
        grid-template-columns: repeat(3, ${size}px) !important;
        grid-template-rows: repeat(3, ${size}px) !important;
        gap: ${compact ? '3px' : '6px'};
        justify-content: center;
        align-items: center;
        width: fit-content;
        margin: 0 auto;
      ">
        ${circlesHtml}
      </div>
    `;
  } else {
    return `
      <div style="
        display: flex;
        flex-wrap: wrap;
        gap: ${compact ? '2px' : '4px'};
        justify-content: center;
        align-items: center;
      ">
        ${circlesHtml}
      </div>
    `;
  }
};  

  let currentMonitoringId = null;
  let currentPlantStatuses = {}; // { position: 'not_sprouted' | 'alive' | 'dead' }
  let currentLodgingStatuses = {}; // { position: true/false }
  let currentBiometrics = {}; // { position: { height_cm, stem_count, stems: [{stem_number, height_cm, diameter_cm}], sanity, is_reference_plant } }

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

      <!-- Card de estatísticas -->
      <div class="card" style="display:flex; flex-wrap:wrap; gap:12px; align-items:center;">
        <div style="width:48px; height:48px; border-radius:14px; background:#dcfce7; display:flex; align-items:center; justify-content:center; color:#065f46; font-size:24px;">
          🌱
        </div>
        <div style="flex:1 1 180px;">
          <div style="font-size:14px; font-weight:600; color:#1f2937;">Estatísticas do experimento</div>
          <div id="monitoringSummary" style="font-size:13px; color:#6b7280;">
            Carregando estatísticas...
          </div>
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
    loadMonitoringSummary(experiment.id);
  }

  // --- Resumo estatístico do monitoramento manual ---
  async function loadMonitoringSummary(experiment_id) {
    if (typeof s === "undefined") return;

    const summaryEl = document.getElementById("monitoringSummary");
    if (!summaryEl) return;

    summaryEl.textContent = "Carregando estatísticas...";

    try {
      // 1) Contar total de monitoramentos
      const { count: monitoringCount, error: countError } = await s
        .from("monitoring_events")
        .select("*", { count: "exact", head: true })
        .eq("experiment_id", experiment_id);

      if (countError) {
        console.error("Erro ao contar monitoramentos:", countError);
      }

      // 2) Buscar TODOS os monitoramentos com suas datas
      const { data: allMonitorings, error: monError } = await s
        .from("monitoring_events")
        .select("id, plot_code, block_number, monitoring_date")
        .eq("experiment_id", experiment_id)
        .order("monitoring_date", { ascending: false });

      if (monError) {
        console.error("Erro ao buscar monitoramentos:", monError);
      }

      if (!allMonitorings || !allMonitorings.length) {
        summaryEl.innerHTML = `
          Nenhum monitoramento registrado ainda.<br>
          <span style="font-size:12px;">Use as abas acima para iniciar o primeiro monitoramento.</span>
        `;
        return;
      }

      // Pegar apenas o último monitoramento de cada parcela/bloco
      const latestByPlot = {};
      allMonitorings.forEach(m => {
        const key = `${m.block_number}_${m.plot_code}`;
        if (!latestByPlot[key]) {
          latestByPlot[key] = m;
        }
      });

      const latestMonitoringIds = Object.values(latestByPlot).map(m => m.id);

      // 3) Buscar biometrias APENAS dos últimos monitoramentos
      const { data: biometrics, error: bioError } = await s
        .from("plant_biometrics")
        .select("*")
        .in("monitoring_event_id", latestMonitoringIds);

      if (bioError) {
        console.error("Erro ao buscar biometrias:", bioError);
      }

      // 4) Buscar status APENAS dos últimos monitoramentos
      const { data: statuses, error: statusError } = await s
        .from("plant_status")
        .select("*")
        .in("monitoring_event_id", latestMonitoringIds);

      if (statusError) {
        console.error("Erro ao buscar status:", statusError);
      }

      // 5) Buscar medições das hastes para cálculo de médias
      const biometricIds = (biometrics || []).map(b => b.id);
      const { data: stemMeasurements, error: stemError } = await s
        .from("plant_stem_measurements")
        .select("*")
        .in("biometric_id", biometricIds);

      if (stemError) {
        console.error("Erro ao buscar medições de hastes:", stemError);
      }

      const totalMonitorings = typeof monitoringCount === "number" ? monitoringCount : 0;
      const bioData = biometrics || [];
      const statusData = statuses || [];
      const stemData = stemMeasurements || [];

      // Calcular total de plantas
      const totalPlots = Object.keys(latestByPlot).length;
      const totalPlants = totalPlots * 9;

      // Criar mapa de status
      const statusMap = {};
      statusData.forEach(s => {
        const key = `${s.monitoring_event_id}_${s.plant_position}`;
        statusMap[key] = s.status;
      });

      // Calcular plantas brotadas
      const sproutedPlants = bioData.filter(b => b.has_sprouted === true);
      const totalSprouted = sproutedPlants.length;

      // Contar plantas vivas = brotadas E NÃO marcadas como mortas
      const alivePlants = sproutedPlants.filter(b => {
        const key = `${b.monitoring_event_id}_${b.plant_position}`;
        const status = statusMap[key];
        return !status || status === 'alive';
      }).length;

      const alivePercentage = totalPlants > 0 
        ? ((alivePlants / totalPlants) * 100).toFixed(1)
        : "0.0";

      // Criar mapa de hastes por biometric_id
      const stemsByBiometric = {};
      stemData.forEach(stem => {
        if (!stemsByBiometric[stem.biometric_id]) {
          stemsByBiometric[stem.biometric_id] = [];
        }
        stemsByBiometric[stem.biometric_id].push(stem);
      });

      // Altura média (média das hastes de plantas VIVAS)
      const alivePlantsWithStems = sproutedPlants.filter(b => {
        const key = `${b.monitoring_event_id}_${b.plant_position}`;
        const status = statusMap[key];
        const isAlive = !status || status === 'alive';
        return isAlive && stemsByBiometric[b.id] && stemsByBiometric[b.id].length > 0;
      });

      let avgHeight = "–";
      let heightCount = 0;
      if (alivePlantsWithStems.length > 0) {
        let totalHeight = 0;
        alivePlantsWithStems.forEach(b => {
          const stems = stemsByBiometric[b.id] || [];
          stems.forEach(stem => {
            if (stem.height_cm && stem.height_cm > 0) {
              totalHeight += stem.height_cm;
              heightCount++;
            }
          });
        });
        if (heightCount > 0) {
          avgHeight = (totalHeight / heightCount).toFixed(1);
        }
      }

      // Diâmetro médio (média das hastes de plantas VIVAS)
      let avgDiameter = "–";
      let diameterCount = 0;
      if (alivePlantsWithStems.length > 0) {
        let totalDiameter = 0;
        alivePlantsWithStems.forEach(b => {
          const stems = stemsByBiometric[b.id] || [];
          stems.forEach(stem => {
            if (stem.diameter_cm && stem.diameter_cm > 0) {
              totalDiameter += stem.diameter_cm;
              diameterCount++;
            }
          });
        });
        if (diameterCount > 0) {
          avgDiameter = ((totalDiameter * 10) / diameterCount).toFixed(2);  // Converter para mm
        }
      }

      // Sanidade média (apenas plantas VIVAS)
      const plantsWithSanity = sproutedPlants.filter(b => {
        const key = `${b.monitoring_event_id}_${b.plant_position}`;
        const status = statusMap[key];
        const isAlive = !status || status === 'alive';
        return isAlive && b.sanity_score != null && b.sanity_score > 0;
      });

      const avgSanity = plantsWithSanity.length > 0
        ? (plantsWithSanity.reduce((sum, b) => sum + b.sanity_score, 0) / plantsWithSanity.length).toFixed(1)
        : "–";

      summaryEl.innerHTML = `
        <div style="display:flex; flex-wrap:wrap; gap:12px; align-items:stretch; margin-top:4px;">

          <!-- Bloco: Total de monitoramentos -->
          <div style="flex:1 1 110px; min-width:110px; padding:8px 10px; border-radius:10px; background:#f0fdf4; display:flex; align-items:center; gap:8px;">
            <div style="width:28px; height:28px; border-radius:999px; background:#dcfce7; display:flex; align-items:center; justify-content:center; font-size:16px;">
              📋
            </div>
            <div>
              <div style="font-size:18px; font-weight:600; color:#111827;">${totalMonitorings}</div>
              <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:#6b7280;">Coletas</div>
            </div>
          </div>

          <!-- Bloco: Plantas vivas -->
          <div style="flex:1 1 110px; min-width:110px; padding:8px 10px; border-radius:10px; background:#ecfdf3; display:flex; align-items:center; gap:8px;">
            <div style="width:28px; height:28px; border-radius:999px; background:#bbf7d0; display:flex; align-items:center; justify-content:center; font-size:16px;">
              🌿
            </div>
            <div>
              <div style="font-size:18px; font-weight:600; color:#14532d;">${alivePercentage}%</div>
              <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:#6b7280;">Vivas (${alivePlants}/${totalPlants})</div>
            </div>
          </div>

          <!-- Bloco: Altura média -->
          <div style="flex:1 1 110px; min-width:110px; padding:8px 10px; border-radius:10px; background:#fefce8; display:flex; align-items:center; gap:8px;">
            <div style="width:28px; height:28px; border-radius:999px; background:#fef3c7; display:flex; align-items:center; justify-content:center; font-size:16px;">
              📏
            </div>
            <div>
              <div style="font-size:18px; font-weight:600; color:#713f12;">${avgHeight}${avgHeight !== "–" ? " cm" : ""}</div>
              <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:#6b7280;">Altura${heightCount > 0 ? ` (${heightCount})` : ""}</div>
            </div>
          </div>

          <!-- Bloco: Diâmetro médio -->
          <div style="flex:1 1 110px; min-width:110px; padding:8px 10px; border-radius:10px; background:#eff6ff; display:flex; align-items:center; gap:8px;">
            <div style="width:28px; height:28px; border-radius:999px; background:#dbeafe; display:flex; align-items:center; justify-content:center; font-size:16px;">
              ⭕
            </div>
            <div>
              <div stylefont-size18px font-weight600 color1e3a8a>${avgDiameter ? (avgDiameter * 10).toFixed(2) : ''}${avgDiameter != null ? ' mm' : ''}</div>
              <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:#6b7280;">Diâmetro${diameterCount > 0 ? ` (${diameterCount})` : ""}</div>
            </div>
          </div>

          <!-- Bloco: Sanidade média -->
          <div style="flex:1 1 110px; min-width:110px; padding:8px 10px; border-radius:10px; background:#fef2f2; display:flex; align-items:center; gap:8px;">
            <div style="width:28px; height:28px; border-radius:999px; background:#fecaca; display:flex; align-items:center; justify-content:center; font-size:16px;">
              ❤️
            </div>
            <div>
              <div style="font-size:18px; font-weight:600; color:#7f1d1d;">${avgSanity}${avgSanity !== "–" ? "/5" : ""}</div>
              <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:#6b7280;">Sanidade${plantsWithSanity.length > 0 ? ` (${plantsWithSanity.length})` : ""}</div>
            </div>
          </div>

        </div>
      `;

    } catch (err) {
      console.error("Erro inesperado ao carregar estatísticas:", err);
      summaryEl.textContent = "Erro ao carregar estatísticas.";
    }
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
        <button data-tab="iniciar" class="active">${currentMonitoringId ? 'Finalizar monitoramento' : 'Iniciar monitoramento'}</button>
        <button data-tab="biometria">Biometria individual</button>
        <button data-tab="uteis">Plantas úteis</button>
        <button data-tab="tombadas">Plantas tombadas</button>
      </div>
      <div id="monitoringTabContent" style="margin-top:10px;"></div>
    `;

    const tabsEl = document.getElementById("monitoringTabs");
    const contentEl = document.getElementById("monitoringTabContent");

    if (!tabsEl || !contentEl) return;

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
      const plot_code = (plotInput && plotInput.value.trim()) || "";
      return { block, plot_code };
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
  const isEditing = !!currentMonitoringId;

  // ✅ NOVO: Se está editando, carregar dados do monitoramento atual
  if (isEditing && currentMonitoringId) {
    renderMonitoringActiveState(container, experiment, selection);
    return;
  }

  // Modo de criação normal
  container.innerHTML = `
    <div style="margin-bottom:10px; font-size:13px; color:#4b5563;">
      ${selection.plotCode ? `<strong>Parcela:</strong> ${escapeHtml(selection.plotCode)}, Bloco ${selection.block}` : 'Selecione uma parcela para começar'}
    </div>

    <div style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
      <div style="flex:0 0 180px;">
        <label for="monDate">Data do monitoramento</label>
        <input type="date" id="monDate" ${isVisitor ? 'disabled' : ''}>
      </div>
    </div>

    <div style="margin-bottom:10px;">
      <label for="monNotes">Observações gerais da parcela</label>
      <textarea id="monNotes" rows="3" ${isVisitor ? 'disabled' : ''} 
        style="width:100%; padding:9px 11px; border-radius:10px; border:1px solid #e5e7eb; font-size:14px; resize:vertical;" 
        placeholder="Condições climáticas, estado geral da parcela, etc."></textarea>
    </div>

    <div style="font-size:12px; color:#6b7280; margin-bottom:10px;">
      Após iniciar o monitoramento, você poderá registrar os dados biométricos individuais de cada planta na aba <strong>Biometria individual</strong>.
    </div>

    <button id="btnIniciarMonitoramento" class="btn-primary" style="width:auto; padding-inline:18px;" onclick="saveMonitoringInit()" ${isVisitor ? 'disabled' : ''}>
      Iniciar monitoramento
    </button>
  `;
}

async function renderMonitoringActiveState(container, experiment, selection) {
  const isVisitor = window.currentRole === "visitor";

  // Buscar dados do monitoramento atual
  const { data: monitoring, error } = await s
    .from('monitoring_events')
    .select('*')
    .eq('id', currentMonitoringId)
    .single();

  if (error || !monitoring) {
    console.error('[ERRO] Monitoramento não encontrado:', error);
    currentMonitoringId = null;
    renderMonitoringTabIniciar(container, experiment, selection);
    return;
  }

  // Calcular progresso
  await loadBiometricsData(currentMonitoringId);
  const totalPlants = 9;
  const filled = Object.keys(currentBiometrics).length;
  const progress = Math.round((filled / totalPlants) * 100);

  container.innerHTML = `
    <div style="margin-bottom:16px; padding:16px; background:#f0fdf4; border-left:4px solid #10b981; border-radius:8px;">
      <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:8px;">
        <div>
          <div style="font-size:14px; font-weight:600; color:#065f46; margin-bottom:4px;">
            ✅ Monitoramento ativo
          </div>
          <div style="font-size:13px; color:#4b5563;">
            <strong>Parcela:</strong> ${escapeHtml(monitoring.plot_code)}, Bloco ${monitoring.block_number}
            <br><strong>Data:</strong> ${formatDateShort(monitoring.monitoring_date)}
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:20px; font-weight:600; color:#10b981;">${progress}%</div>
          <div style="font-size:11px; color:#6b7280; text-transform:uppercase;">Completo</div>
        </div>
      </div>

      ${monitoring.notes ? `
        <div style="margin-top:12px; padding:10px; background:#fff; border-radius:6px; font-size:12px; color:#6b7280;">
          <strong style="color:#065f46;">Observações:</strong><br>
          ${escapeHtml(monitoring.notes)}
        </div>
      ` : ''}

      <div style="margin-top:12px; padding:10px; background:#dcfce7; border-radius:6px; font-size:12px; color:#065f46;">
        <strong>${filled}/${totalPlants} plantas</strong> com dados coletados.
        ${filled < totalPlants ? 'Continue registrando nas abas acima.' : '✅ Coleta completa!'}
      </div>
    </div>

    <div style="font-size:13px; color:#6b7280; margin-bottom:12px;">
      <strong>Próximos passos:</strong>
      <ul style="margin:8px 0; padding-left:20px;">
        <li>Use as abas <strong>Biometria</strong>, <strong>Plantas Úteis</strong> e <strong>Plantas Tombadas</strong> para registrar dados</li>
        <li>Quando terminar, clique em <strong>Finalizar e Novo Monitoramento</strong> para salvar e iniciar outro</li>
        <li>Para ajustar data ou observações, clique em <strong>Editar Informações</strong> abaixo</li>
      </ul>
    </div>

    <div style="display:flex; gap:10px; flex-wrap:wrap;">
      <button class="btn-primary" style="flex:1; min-width:200px; background:#10b981; border-color:#10b981;" 
        onclick="finishMonitoringAndStartNew()" ${isVisitor ? 'disabled' : ''}>
        ✅ Finalizar e Novo Monitoramento
      </button>

      <button class="btn-secondary" style="flex:1; min-width:200px;" 
        onclick="editCurrentMonitoring()" ${isVisitor ? 'disabled' : ''}>
        ✏️ Editar Informações (data/notas)
      </button>
    </div>

    <!-- ✅ NOVO: Botão Cancelar -->
    <div style="margin-top:12px;">
      <button class="btn-secondary" style="width:100%; background:#ef4444; border-color:#ef4444; color:#fff;" 
        onclick="cancelMonitoringEdit()" ${isVisitor ? 'disabled' : ''}>
        ❌ Cancelar Edição
      </button>
    </div>

    <div style="margin-top:16px; padding:12px; background:#fef3c7; border-radius:8px; font-size:12px; color:#92400e;">
      <strong>💡 Dica:</strong> Você pode alternar entre as abas livremente. Seus dados estão sendo salvos automaticamente.
    </div>
  `;
}

window.editCurrentMonitoring = async function editCurrentMonitoring() {
  if (!currentMonitoringId) {
    alert('Nenhum monitoramento ativo.');
    return;
  }

  // Buscar dados atuais
  const { data: monitoring, error } = await s
    .from('monitoring_events')
    .select('*')
    .eq('id', currentMonitoringId)
    .single();

  if (error || !monitoring) {
    alert('Erro ao carregar dados do monitoramento.');
    return;
  }

  const bodyHtml = `
    <div style="margin-bottom:16px;">
      <div style="font-size:13px; color:#4b5563; margin-bottom:12px;">
        <strong>Parcela:</strong> ${escapeHtml(monitoring.plot_code)}, Bloco ${monitoring.block_number}
      </div>

      <div style="margin-bottom:12px;">
        <label for="editMonDate" style="display:block; margin-bottom:4px; font-size:13px; font-weight:500;">
          Data do monitoramento
        </label>
        <input type="date" id="editMonDate" value="${monitoring.monitoring_date}" 
          style="width:100%; padding:8px; border-radius:8px; border:1px solid #e5e7eb;">
      </div>

      <div style="margin-bottom:12px;">
        <label for="editMonNotes" style="display:block; margin-bottom:4px; font-size:13px; font-weight:500;">
          Observações gerais
        </label>
        <textarea id="editMonNotes" rows="4" 
          style="width:100%; padding:8px; border-radius:8px; border:1px solid #e5e7eb; font-size:13px; resize:vertical;"
          placeholder="Condições climáticas, estado geral da parcela, etc.">${monitoring.notes || ''}</textarea>
      </div>
    </div>

    <div style="display:flex; gap:8px;">
      <button class="btn-primary" onclick="saveMonitoringEdits()" style="flex:1;">
        Salvar Alterações
      </button>
      <button class="btn-secondary" onclick="closeModal()" style="flex:1;">
        Cancelar
      </button>
    </div>
  `;

  if (typeof openModal === 'function') {
    openModal('✏️ Editar Informações do Monitoramento', bodyHtml);
  }
};

window.saveMonitoringEdits = async function saveMonitoringEdits() {
  const date = document.getElementById('editMonDate')?.value;
  const notes = document.getElementById('editMonNotes')?.value;

  if (!date) {
    alert('Informe a data do monitoramento.');
    return;
  }

  try {
    const { error } = await s
      .from('monitoring_events')
      .update({
        monitoring_date: date,
        notes: notes || null
      })
      .eq('id', currentMonitoringId);

    if (error) throw error;

    alert('Informações atualizadas com sucesso!');

    if (typeof closeModal === 'function') {
      closeModal();
    }

    // Recarregar aba Iniciar
    const experiment = window.currentExperiment;
    const contentEl = document.getElementById('monitoringTabContent');
    const blockInput = document.getElementById('monitorBlock');
    const plotInput = document.getElementById('monitorPlot');

    if (contentEl) {
      const block = blockInput?.value ? parseInt(blockInput.value, 10) : 1;
      const plotCode = plotInput?.value?.trim() || '';
      renderMonitoringTabIniciar(contentEl, experiment, { block, plotCode });
    }

    // Recarregar lista
    loadMonitoringList();

  } catch (err) {
    console.error('[ERRO] Ao atualizar:', err);
    alert('Erro ao atualizar informações.');
  }
};

  async function renderMonitoringTabBiometria(container, experiment, selection) {
  const isVisitor = window.currentRole === "visitor";

  let monitoringToUse;

  // Tentar buscar o monitoramento atual se existir
  if (currentMonitoringId) {
    console.log('[DEBUG] Tentando buscar monitoramento:', currentMonitoringId);

    const { data, error } = await s
      .from('monitoring_events')
      .select('*')
      .eq('id', currentMonitoringId)
      .single();

    if (error) {
      console.warn('[AVISO] Monitoramento não encontrado, buscando último:', error);
      // ✅ Se não encontrar, buscar o último
      currentMonitoringId = null;
    } else {
      monitoringToUse = data;
      console.log('[DEBUG] Monitoramento encontrado:', monitoringToUse.id, monitoringToUse.monitoring_date);
    }
  }

  // Se não tem monitoramento atual, buscar o último
  if (!monitoringToUse) {
    console.log('[DEBUG] Buscando último monitoramento para:', selection.plot_code, selection.block);
    monitoringToUse = await loadLatestMonitoringForPlot(experiment.id, selection.plot_code, selection.block);

    if (monitoringToUse) {
      console.log('[DEBUG] Último monitoramento encontrado:', monitoringToUse.id);
      currentMonitoringId = monitoringToUse.id;
    }
  }

  if (!monitoringToUse) {
    container.innerHTML = `
      <div style="margin-bottom:10px; font-size:13px; color:#b91c1c;">
        <strong>Parcela:</strong> ${escapeHtml(selection.plot_code)}, Bloco ${selection.block}
      </div>
      <p style="font-size:13px; color:#6b7280; margin-bottom:8px;">
        Nenhum monitoramento registrado ainda para esta parcela.
        <br>Inicie um monitoramento na aba <strong>Iniciar monitoramento</strong> primeiro.
      </p>
    `;
    return;
  }

  currentMonitoringId = monitoringToUse.id;
  await loadBiometricsData(monitoringToUse.id);

  const totalPlants = 9;
  const filled = Object.keys(currentBiometrics).length;
  const progress = Math.round((filled / totalPlants) * 100);

  container.innerHTML = `
    <div style="margin-bottom:10px; font-size:13px; color:#4b5563;">
      <strong>Parcela:</strong> ${escapeHtml(selection.plot_code)}, Bloco ${selection.block}
      <br><span style="font-size:12px; color:#6b7280;">Monitoramento de ${formatDateShort(monitoringToUse.monitoring_date)}</span>
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
      <button class="btn-secondary" onclick="openBiometricCollectionDialog()" ${isVisitor ? 'disabled' : ''}>
        Coletar dados biométricos (grade 3×3)
      </button>
    </div>

    <div style="font-size:12px; color:#6b7280;">
      Clique no botão acima para abrir a grade de plantas e registrar medições de <strong>cada haste</strong>: 
      <strong>altura (cm)</strong>, <strong>diâmetro (cm)</strong> e <strong>sanidade geral (1-5)</strong> para cada planta.
      <br>Selecione até <strong>3 plantas de referência</strong> para validação dos dados do drone.
    </div>
  `;
}

  async function renderMonitoringTabPlantasUteis(container, experiment, selection) {
  const isVisitor = window.currentRole === "visitor";

  let monitoringToUse;

  if (currentMonitoringId) {
    const { data, error } = await s
      .from('monitoring_events')
      .select('*')
      .eq('id', currentMonitoringId)
      .single();

    if (error) {
      console.warn('[AVISO] Monitoramento não encontrado, buscando último:', error);
      currentMonitoringId = null;
    } else {
      monitoringToUse = data;
    }
  }

  if (!monitoringToUse) {
    monitoringToUse = await loadLatestMonitoringForPlot(experiment.id, selection.plot_code, selection.block);
    if (monitoringToUse) {
      currentMonitoringId = monitoringToUse.id;
    }
  }

  if (!monitoringToUse) {
    container.innerHTML = `
      <div style="margin-bottom:10px; font-size:13px; color:#b91c1c;">
        <strong>Parcela:</strong> ${escapeHtml(selection.plot_code)}, Bloco ${selection.block}
      </div>
      <p style="font-size:13px; color:#6b7280; margin-bottom:8px;">
        Nenhum monitoramento registrado ainda para esta parcela.
        <br>Inicie um monitoramento primeiro.
      </p>
    `;
    return;
  }

  currentMonitoringId = monitoringToUse.id;
  await loadPlantDataForEdit(monitoringToUse.id);
  await loadBiometricsData(monitoringToUse.id);

  container.innerHTML = `
    <div style="margin-bottom:10px; font-size:13px; color:#4b5563;">
      <strong>Parcela:</strong> ${escapeHtml(selection.plot_code)}, Bloco ${selection.block}
      <br><span style="font-size:12px; color:#6b7280;">Monitoramento de ${formatDateShort(monitoringToUse.monitoring_date)}</span>
    </div>

    <div style="margin-bottom:10px; font-size:13px; color:#374151;">
      <button class="btn-secondary" onclick="openPlantStatusDialog()" ${isVisitor ? 'disabled' : ''}>
        Marcar mortalidade
      </button>
    </div>

    <div style="font-size:12px; color:#6b7280;">
      As plantas marcadas como <strong>Brotou</strong> na aba Biometria aparecem automaticamente como <strong>vivas</strong> (verde).
      <br>Clique no botão para marcar plantas que morreram (ficarão vermelhas).
    </div>
  `;
}

async function renderMonitoringTabPlantasTombadas(container, experiment, selection) {
  const isVisitor = window.currentRole === "visitor";

  let monitoringToUse;

  if (currentMonitoringId) {
    const { data, error } = await s
      .from('monitoring_events')
      .select('*')
      .eq('id', currentMonitoringId)
      .single();

    if (error) {
      console.warn('[AVISO] Monitoramento não encontrado, buscando último:', error);
      currentMonitoringId = null;
    } else {
      monitoringToUse = data;
    }
  }

  if (!monitoringToUse) {
    monitoringToUse = await loadLatestMonitoringForPlot(experiment.id, selection.plot_code, selection.block);
    if (monitoringToUse) {
      currentMonitoringId = monitoringToUse.id;
    }
  }

  if (!monitoringToUse) {
    container.innerHTML = `
      <div style="margin-bottom:10px; font-size:13px; color:#b91c1c;">
        <strong>Parcela:</strong> ${escapeHtml(selection.plot_code)}, Bloco ${selection.block}
      </div>
      <p style="font-size:13px; color:#6b7280; margin-bottom:8px;">
        Nenhum monitoramento registrado ainda para esta parcela.
        <br>Inicie um monitoramento primeiro.
      </p>
    `;
    return;
  }

  currentMonitoringId = monitoringToUse.id;
  await loadPlantDataForEdit(monitoringToUse.id);
  await loadBiometricsData(monitoringToUse.id);

  container.innerHTML = `
    <div style="margin-bottom:10px; font-size:13px; color:#4b5563;">
      <strong>Parcela:</strong> ${escapeHtml(selection.plot_code)}, Bloco ${selection.block}
      <br><span style="font-size:12px; color:#6b7280;">Monitoramento de ${formatDateShort(monitoringToUse.monitoring_date)}</span>
    </div>

    <div style="margin-bottom:10px; font-size:13px; color:#374151;">
      <button class="btn-secondary" onclick="openPlantLodgingDialog()" ${isVisitor ? 'disabled' : ''}>
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
    alert('Visitantes têm acesso somente leitura.');
    return;
  }

  if (typeof s === "undefined") {
    alert('Cliente Supabase não disponível.');
    return;
  }

  const experiment = window.currentExperiment;
  if (!experiment || !experiment.id) {
    alert('Nenhum experimento selecionado.');
    return;
  }

  const blockInput = document.getElementById('monitorBlock');
  const plotInput = document.getElementById('monitorPlot');
  const block = blockInput?.value ? parseInt(blockInput.value, 10) : 1;
  const plot_code = plotInput?.value.trim();

  if (!plot_code) {
    alert('Selecione uma parcela.');
    return;
  }

  const date = document.getElementById('monDate')?.value || null;
  const notes = document.getElementById('monNotes')?.value || null;

  if (!date) {
    alert('Informe a data do monitoramento.');
    return;
  }

  // ✅ Desabilitar botão e mostrar loading
  const btn = document.getElementById('btnIniciarMonitoramento');
  if (btn) {
    btn.disabled = true;
    btn.style.background = '#9ca3af';
    btn.style.borderColor = '#9ca3af';
    btn.style.cursor = 'wait';
    btn.innerHTML = '⏳ Iniciando...';
  }

  const payload = {
  experiment_id: experiment.id,
  plot_code: plot_code,
  block_number: block,
  monitoring_date: date,
  notes: notes || null,
};


  try {
    const isEditing = !!currentMonitoringId;

    console.log('[INFO] Salvando monitoramento...', {
      isEditing,
      currentMonitoringId,
      payload
    });

    if (currentMonitoringId) {
      // Modo de edição
      const { error } = await s
        .from('monitoring_events')
        .update(payload)
        .eq('id', currentMonitoringId);

      if (error) {
        console.error('[ERRO] Ao atualizar:', error);
        throw error;
      }

      console.log('[INFO] Monitoramento atualizado:', currentMonitoringId);
      alert('Monitoramento atualizado com sucesso.');

    } else {
      // ✅ NOVO: Carregar estado anterior ANTES de criar o novo monitoramento
      const previousState = await loadPreviousStateForNewMonitoring(
        experiment.id,
        plot_code,
        block
      );

      // Modo de criação
      const { data, error } = await s
        .from('monitoring_events')
        .insert(payload)
        .select('*');

      if (error) {
        console.error('[ERRO] Ao inserir:', error);
        throw error;
      }

      // ✅ Setar o currentMonitoringId com o novo registro
      currentMonitoringId = data[0]?.id;

      // ✅ NOVO: Copiar dados do estado anterior para o novo monitoramento
      if (currentMonitoringId && previousState && Object.keys(previousState.biometrics).length > 0) {
        await copyPreviousStateToNewMonitoring(
          currentMonitoringId,
          previousState
        );

        // Carregar os dados copiados na memória
        await loadBiometricsData(currentMonitoringId);
        await loadPlantDataForEdit(currentMonitoringId);

        // Contar plantas de referência
        const referencePlants = Object.values(currentBiometrics).filter(b => b.is_reference_plant);

        console.log('[INFO] Plantas de referência mantidas:', referencePlants.length);
      }

      console.log('[INFO] Monitoramento criado com estado anterior:', currentMonitoringId);

      const msg = previousState && previousState.previousDate && Object.keys(previousState.biometrics).length > 0
        ? `Monitoramento iniciado com dados da coleta anterior (${formatDateShort(previousState.previousDate)}).\n\nOs dados foram pré-carregados. Você pode editá-los na aba Biometria individual.\n\n⭐ ${Object.values(currentBiometrics).filter(b => b.is_reference_plant).length} planta(s) de referência mantida(s).`
        : 'Monitoramento iniciado com sucesso.\n\nAgora você pode coletar os dados biométricos na aba Biometria individual.';

      alert(msg);
    }

    // ✅ Atualizar labels da aba
    updateMonitoringTabLabels();

    // Recarregar lista
    loadMonitoringList();
    loadMonitoringSummary(experiment.id);

  } catch (err) {
    console.error('[ERRO] Ao salvar monitoramento:', err);
    alert('Erro ao salvar monitoramento.');

    // ✅ Reabilitar botão em caso de erro
    if (btn) {
      btn.disabled = false;
      btn.style.background = '';
      btn.style.borderColor = '';
      btn.style.cursor = 'pointer';
      btn.innerHTML = 'Iniciar monitoramento';
    }
  }
};
  // ============================================
// FUNÇÃO: finishMonitoringAndStartNew
// ============================================
window.finishMonitoringAndStartNew = function finishMonitoringAndStartNew() {
  if (!confirm('Deseja finalizar este monitoramento e iniciar um novo?\n\nOs dados do monitoramento atual serão mantidos.')) {
    return;
  }

  console.log('[INFO] Finalizando monitoramento atual:', currentMonitoringId);

  // Resetar o formulário (limpa currentMonitoringId e dados)
  resetMonitoringForm();

  // Buscar valores atuais dos selects
  const blockInput = document.getElementById('monitorBlock');
  const plotInput = document.getElementById('monitorPlot');
  
  const block = blockInput?.value ? parseInt(blockInput.value, 10) : 1;
  const plotCode = plotInput?.value?.trim() || '';

  // Re-renderizar aba Iniciar (volta ao modo de criação)
  const experiment = window.currentExperiment;
  const contentEl = document.getElementById('monitoringTabContent');
  
  if (contentEl) {
    renderMonitoringTabIniciar(contentEl, experiment, { block, plot_code: plotCode });
  }

  // ✅ Atualizar labels da aba
  updateMonitoringTabLabels();

  // Ativar aba Iniciar
  const tabsEl = document.getElementById('monitoringTabs');
  if (tabsEl) {
    tabsEl.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    tabsEl.querySelector('[data-tab="iniciar"]')?.classList.add('active');
  }

  // Recarregar lista
  loadMonitoringList();
  
  alert('Monitoramento finalizado! Você pode iniciar um novo agora.');
  console.log('[INFO] Pronto para novo monitoramento');
};

// ============================================
// FUNÇÃO: cancelMonitoringEdit
// ============================================
window.cancelMonitoringEdit = function cancelMonitoringEdit() {
  if (!confirm('Deseja cancelar a edição? As alterações não salvas serão perdidas.')) {
    return;
  }

  console.log('[INFO] Cancelando edição do monitoramento:', currentMonitoringId);

  // Resetar formulário (limpa currentMonitoringId e dados em memória)
  resetMonitoringForm();

  // Buscar valores atuais dos selects
  const blockInput = document.getElementById('monitorBlock');
  const plotInput = document.getElementById('monitorPlot');
  
  const block = blockInput?.value ? parseInt(blockInput.value, 10) : 1;
  const plotCode = plotInput?.value?.trim() || '';

  // Re-renderizar aba Iniciar (volta ao estado inicial)
  const experiment = window.currentExperiment;
  const contentEl = document.getElementById('monitoringTabContent');
  
  if (contentEl) {
    renderMonitoringTabIniciar(contentEl, experiment, { block, plotCode });
  }

  // Ativar aba Iniciar
  const tabsEl = document.getElementById('monitoringTabs');
  if (tabsEl) {
    tabsEl.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    tabsEl.querySelector('[data-tab="iniciar"]')?.classList.add('active');
  }
  
  console.log('[INFO] Edição cancelada. Formulário resetado.');
};

  window.openBiometricCollectionDialog = async function openBiometricCollectionDialog() {
    if (window.currentRole === "visitor") return;

    const blockInput = document.getElementById("monitorBlock");
    const plotInput = document.getElementById("monitorPlot");
    const block = blockInput?.value ? parseInt(blockInput.value, 10) : 1;
    const plot_code = plotInput?.value.trim() || "";

    // ✅ CARREGAR dados de status e tombamento ANTES de renderizar
    if (currentMonitoringId) {
      await loadPlantDataForEdit(currentMonitoringId);
    }

    const total = 9;
    const itemsHtml = Array.from({ length: total }).map((_, idx) => {
      const n = idx + 1;
      const bio = currentBiometrics[n];

      // ✅ BUSCAR status e tombamento
      const status = currentPlantStatuses[n];
      const isLodged = currentLodgingStatuses[n];

      const hasSprouted = bio?.has_sprouted === true;
      const isReference = bio?.is_reference_plant === true;

      // ✅ LÓGICA DE CORES CORRIGIDA
      let bg = '#f3f4f6';      // cinza claro - sem dados
      let color = '#6b7280';
      let borderColor = '#d1d5db';

      if (hasSprouted) {
        if (status === 'dead') {
          bg = '#fee2e2';        // 🔴 vermelho - morta
          color = '#7f1d1d';
          borderColor = '#dc2626';
        } else if (isLodged) {
          bg = '#fef3c7';        // 🟡 amarelo - tombada
          color = '#92400e';
          borderColor = '#f59e0b';
        } else {
          bg = '#dcfce7';        // 🟢 verde - viva
          color = '#065f46';
          borderColor = '#10b981';
        }
      }

      const referenceStar = isReference ? '<div style="position:absolute; top:-4px; right:-4px; font-size:16px;">⭐</div>' : '';

      return `
        <button type="button"
          class="plant-circle"
          onclick="openPlantBiometricForm(${n})"
          style="
            position:relative;
            width:42px; height:42px; border-radius:999px;
            border:2px solid ${borderColor};
            background:${bg};
            color:${color};
            font-size:14px;
            font-weight:600;
            display:flex; align-items:center; justify-content:center;
            cursor:pointer;
          ">
          ${n}
          ${referenceStar}
        </button>
      `;
    }).join("");

    // ✅ NOVO: Verificar se tem plantas de referência
    const referenceCount = Object.values(currentBiometrics).filter(b => b.is_reference_plant).length;
    const hasLoadedData = Object.keys(currentBiometrics).length > 0;

    const bodyHtml = `
      <div style="font-size:13px; color:#4b5563; margin-bottom:8px;">
        Biometria individual – Parcela ${escapeHtml(plot_code)}, bloco ${block}.
      </div>

      ${hasLoadedData && referenceCount > 0 ? `
        <div style="margin-bottom:8px; padding:8px; background:#fef3c7; border-radius:8px; border:1px solid #f59e0b;">
          <div style="font-size:12px; color:#92400e; font-weight:600;">
            ⭐ ${referenceCount} planta(s) de referência mantida(s) da coleta anterior
          </div>
          <div style="font-size:11px; color:#6b7280; margin-top:2px;">
            As plantas marcadas com ⭐ são as plantas de referência para validação com dados do drone.
          </div>
        </div>
      ` : ''}

      <div style="margin-bottom:8px; font-size:12px; color:#6b7280;">
        <strong>🟢 Verde</strong> = Viva · <strong>🔴 Vermelho</strong> = Morta · <strong>🟡 Amarelo</strong> = Tombada · <strong>⚪ Cinza</strong> = Sem dados
        <br>Clique em cada planta para registrar ou editar dados.
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
    const stemCount = bio.stem_count || 0;

    const stemFieldsHtml = stemCount > 0 ? Array.from({ length: stemCount }, (_, i) => {
      const stemNum = i + 1;
      const existingStem = bio.stems?.find(s => s.stemnumber === stemNum);
      return `
        <div style="padding:10px; margin-bottom:8px; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0;">
          <div style="font-weight:600; color:#065f46; margin-bottom:6px;">Haste ${stemNum}</div>
          <div style="display:flex; gap:8px;">
            <div style="flex:1;">
              <label for="stemHeight${stemNum}">Altura cm</label>
              <input type="number" step="0.1" id="stemHeight${stemNum}" value="${existingStem?.heightcm || ''}">
            </div>
            <div style="flex:1;">
              <label for="stemDiameter${stemNum}">Diâmetro mm</label>
              <input type="number" step="0.1" id="stemDiameter${stemNum}" value="${existingStem?.diametercm ? existingStem.diametercm * 10 : ''}">
            </div>
          </div>
        </div>
      `;
    }).join('') : `<div style="font-size:12px; color:#6b7280; padding:10px; background:#f8fafc; border-radius:8px;">Informe o número de hastes primeiro</div>`;

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
      </div>

      <div style="margin-bottom:12px;">
        <label for="bioStems">Número de hastes</label>
        <input type="number" id="bioStems" value="${bio.stem_count || ''}" 
          oninput="updateStemFields(${position})" />
        <div style="font-size:11px; color:#6b7280; margin-top:2px;">
          Após informar, serão criados campos para cada haste
        </div>
      </div>

      <div id="stemFieldsContainer" style="margin-bottom:12px;">
        ${stemFieldsHtml}
      </div>

      <div style="margin-bottom:12px;">
        <label for="bioSanity">Sanidade geral (1 a 5)</label>
        <input type="number" min="1" max="5" id="bioSanity" value="${bio.sanity_score || ''}" 
          oninput="toggleSanityObservations()" />
        <div style="font-size:11px; color:#6b7280; margin-top:2px;">
          5 = saúde perfeita · 1 = saúde muito comprometida
        </div>
      </div>

      <div id="sanityObsContainer" style="margin-bottom:12px; display:none;">
        <label for="bioSanityObs" style="color:#dc2626; font-weight:600;">
          ⚠️ Observações sobre sanidade
        </label>
        <textarea id="bioSanityObs" rows="3" 
          style="width:100%; padding:9px 11px; border-radius:8px; border:1px solid #fca5a5; font-size:13px; resize:vertical; background:#fef2f2;"
          placeholder="Descreva as anomalias: formigas, lagartas, viroses, bactérias, etc.">${bio.sanity_observations || ""}</textarea>
      </div>

      <div style="margin-bottom:12px; padding:10px; background:#fef3c7; border-radius:8px; border:1px solid #fbbf24;">
        <label style="display:flex; align-items:center; gap:8px; font-size:13px; color:#92400e; cursor:pointer;">
          <input type="checkbox" id="bioReference" ${bio.is_reference_plant ? 'checked' : ''} 
            style="width:18px; height:18px; cursor:pointer;">
          ⭐ Marcar como planta de referência (validação drone)
        </label>
        <div style="font-size:11px; color:#6b7280; margin-top:4px;">
          Selecione até 3 plantas úteis para amostragem
        </div>
      </div>

      <button class="btn-primary" style="width:100%;" onclick="savePlantBiometric(${position})">
        Salvar dados da planta ${position}
      </button>
    `;

    if (typeof openModal === "function") {
      openModal(`Biometria - Planta ${position}`, bodyHtml);
    }

    setTimeout(() => {
      toggleSanityObservations();
    }, 50);
  };

  window.updateStemFields = function updateStemFields(position) {
    const stemsInput = document.getElementById("bioStems");
    const container = document.getElementById("stemFieldsContainer");

    if (!stemsInput || !container) return;

    const stemCount = parseInt(stemsInput.value, 10) || 0;

    if (stemCount <= 0) {
      container.innerHTML = `<div style="font-size:12px; color:#6b7280; padding:10px; background:#f8fafc; border-radius:8px;">Informe o número de hastes primeiro</div>`;
      return;
    }

    const bio = currentBiometrics[position] || {};

    container.innerHTML = Array.from({ length: stemCount }, (_, i) => {
      const stemNum = i + 1;
      const existingStem = bio.stems?.find(s => s.stemnumber === stemNum);
      return `
        <div style="padding:10px; margin-bottom:8px; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0;">
          <div style="font-weight:600; color:#065f46; margin-bottom:6px;">Haste ${stemNum}</div>
          <div style="display:flex; gap:8px;">
            <div style="flex:1;">
              <label for="stemHeight${stemNum}">Altura cm</label>
              <input type="number" step="0.1" id="stemHeight${stemNum}" value="${existingStem?.heightcm || ''}">
            </div>
            <div style="flex:1;">
              <label for="stemDiameter${stemNum}">Diâmetro mm</label>
              <input type="number" step="0.1" id="stemDiameter${stemNum}" value="${existingStem?.diametercm ? existingStem.diametercm * 10 : ''}">
            </div>
          </div>
        </div>
      `;
    }).join('');
  };

  window.toggleSanityObservations = function toggleSanityObservations() {
    const sanityInput = document.getElementById("bioSanity");
    const obsContainer = document.getElementById("sanityObsContainer");

    if (!sanityInput || !obsContainer) return;

    const sanityValue = parseFloat(sanityInput.value);

    if (!isNaN(sanityValue) && sanityValue < 5) {
      obsContainer.style.display = "block";
    } else {
      obsContainer.style.display = "none";
    }
  };

  window.savePlantBiometric = async function savePlantBiometric(position) {
    if (!currentMonitoringId) {
      alert("Inicie um monitoramento primeiro.");
      return;
    }

    const sproutedCheckbox = document.getElementById("bioSprouted");
    const expandedCheckbox = document.getElementById("bioExpanded");
    const stemsInput = document.getElementById("bioStems");
    const sanity = document.getElementById("bioSanity")?.value || null;
    const sanityObs = document.getElementById("bioSanityObs")?.value || null;
    const referenceCheckbox = document.getElementById("bioReference");

    const sprouted = sproutedCheckbox ? sproutedCheckbox.checked : false;
    const expanded = expandedCheckbox ? expandedCheckbox.checked : false;
    const stemCount = stemsInput ? parseInt(stemsInput.value, 10) : 0;
    const isReference = referenceCheckbox ? referenceCheckbox.checked : false;

    // Validar limite de 3 plantas de referência
    if (isReference) {
      const { count } = await s
        .from("plant_biometrics")
        .select("*", { count: "exact", head: true })
        .eq("monitoring_event_id", currentMonitoringId)
        .eq("is_reference_plant", true);

      const currentRef = currentBiometrics[position]?.is_reference_plant ? 1 : 0;

      if (count - currentRef >= 3) {
        alert("Você já selecionou 3 plantas de referência. Desmarque uma para adicionar outra.");
        return;
      }
    }

    // Coletar dados das hastes
    const stems = [];
    for (let i = 1; i <= stemCount; i++) {
      const heightInput = document.getElementById(`stemHeight_${i}`);
      const diameterInput = document.getElementById(`stemDiameter_${i}`);

      if (heightInput || diameterInput) {
        stems.push({
          stemnumber: i,
          heightcm: heightInput?.value ? Number(heightInput.value) : null,
          diametercm: diameterInput?.value ? Number(diameterInput.value) / 10 : null  // Converter mm para cm
        });
      }
    }

    const payload = {
      monitoring_event_id: currentMonitoringId,
      plant_position: position,
      stem_count: stemCount,
      sanity_score: sanity ? Number(sanity) : null,
      sanity_observations: sanityObs,
      has_sprouted: sprouted,
      has_expanded_leaves: expanded,
      is_reference_plant: isReference
    };

    try {
      const { data: existing } = await s
        .from("plant_biometrics")
        .select("id")
        .eq("monitoring_event_id", currentMonitoringId)
        .eq("plant_position", position)
        .maybeSingle();

      let biometricId;

      if (existing) {
        const { error } = await s
          .from("plant_biometrics")
          .update(payload)
          .eq("id", existing.id);
        if (error) throw error;
        biometricId = existing.id;

        await s
          .from("plant_stem_measurements")
          .delete()
          .eq("biometric_id", biometricId);
      } else {
        const { data, error } = await s
          .from("plant_biometrics")
          .insert(payload)
          .select('*');
        if (error) throw error;
        biometricId = data[0].id;
      }

      if (stems.length > 0) {
        const stemRecords = stems.map(stem => ({
          biometric_id: biometricId,
          ...stem
        }));

        const { error: stemError } = await s
          .from("plant_stem_measurements")
          .insert(stemRecords);

        if (stemError) throw stemError;
      }

      currentBiometrics[position] = {
        ...payload,
        stems: stems
      };

      await loadBiometricsData(currentMonitoringId);

      if (typeof closeModal === "function") closeModal();
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
    const plot_code = plotInput?.value.trim() || "";

    for (let pos = 1; pos <= 9; pos++) {
      const bio = currentBiometrics[pos];

      if (bio && bio.has_sprouted === true && !currentPlantStatuses[pos]) {
        currentPlantStatuses[pos] = 'alive';
      }

      if (bio && bio.has_sprouted === false && !currentPlantStatuses[pos]) {
        currentPlantStatuses[pos] = 'not_sprouted';
      }

      if ((!bio || bio.has_sprouted === null || bio.has_sprouted === undefined) && !currentPlantStatuses[pos]) {
        currentPlantStatuses[pos] = 'not_sprouted';
      }
    }

    const total = 9;
    const itemsHtml = Array.from({ length: total }).map((_, idx) => {
      const n = idx + 1;
      const bio = currentBiometrics[n];
      let status = currentPlantStatuses[n] || 'not_sprouted';

      if (!bio || bio.has_sprouted !== true) {
        if (status === 'alive') {
          status = 'not_sprouted';
          currentPlantStatuses[n] = 'not_sprouted';
        }
      }

      let bg = '#e5e7eb';
      let color = '#374151';
      let borderColor = '#d1d5db';

      if (status === 'alive') {
        bg = '#dcfce7';
        color = '#065f46';
        borderColor = '#10b981';
      } else if (status === 'dead') {
        bg = '#fee2e2';
        color = '#991b1b';
        borderColor = '#f87171';
      }

      const canToggle = bio && bio.has_sprouted === true;

      return `
        <button type="button"
          class="plant-circle"
          onclick="${canToggle ? `togglePlantStatus(${n})` : 'void(0)'}"
          style="
            width:42px; height:42px; border-radius:999px;
            border:2px solid ${borderColor};
            background:${bg};
            color:${color};
            font-size:14px;
            font-weight:600;
            display:flex; align-items:center; justify-content:center;
            cursor:${canToggle ? 'pointer' : 'not-allowed'};
            opacity:${canToggle ? '1' : '0.5'};
          ">
          ${n}
        </button>
      `;
    }).join("");

    const bodyHtml = `
      <div style="font-size:13px; color:#4b5563; margin-bottom:8px;">
        Plantas úteis – Parcela ${escapeHtml(plot_code)}, bloco ${block}.
      </div>

      <div style="margin-bottom:10px; font-size:12px; color:#6b7280;">
        <strong>Verde</strong> = Viva · <strong>Vermelho</strong> = Morta · <strong>Cinza</strong> = Não brotou
        <br>Clique nas plantas <strong>verdes</strong> para marcar como mortas.
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
      openModal("Marcar mortalidade das plantas", bodyHtml);
    }
  };

  window.togglePlantStatus = function togglePlantStatus(position) {
    const bio = currentBiometrics[position];
    if (!bio || bio.has_sprouted !== true) return;

    const current = currentPlantStatuses[position] || 'alive';
    currentPlantStatuses[position] = current === 'alive' ? 'dead' : 'alive';

    openPlantStatusDialog();
  };

  window.savePlantStatuses = async function savePlantStatuses() {
    if (!currentMonitoringId) {
      alert("Nenhum monitoramento ativo.");
      return;
    }

    try {
      for (const [pos, status] of Object.entries(currentPlantStatuses)) {
        const position = parseInt(pos, 10);

        const { data: existing } = await s
          .from("plant_status")
          .select("id")
          .eq("monitoring_event_id", currentMonitoringId)
          .eq("plant_position", position)
          .maybeSingle();

        const payload = {
          monitoring_event_id: currentMonitoringId,
          plant_position: position,
          status: status
        };

        if (existing) {
          await s.from("plant_status").update(payload).eq("id", existing.id);
        } else {
          await s.from("plant_status").insert(payload);
        }
      }

      alert("Status das plantas salvo com sucesso.");
      if (typeof closeModal === "function") closeModal();

    } catch (err) {
      console.error("Erro ao salvar status das plantas:", err);
      alert("Erro ao salvar status das plantas.");
    }
  };

  window.openPlantLodgingDialog = async function openPlantLodgingDialog(skipReload = false) {
  if (window.currentRole === "visitor") return;

  const blockInput = document.getElementById("monitorBlock");
  const plotInput = document.getElementById("monitorPlot");
  const block = blockInput?.value ? parseInt(blockInput.value, 10) : 1;
  const plot_code = plotInput?.value.trim() || "";

  // ✅ CORREÇÃO: Só carregar do banco na primeira vez
  if (currentMonitoringId && !skipReload) {
    console.log("[DEBUG] Carregando dados do banco...");
    await loadPlantDataForEdit(currentMonitoringId);
  } else {
    console.log("[DEBUG] Pulando recarga (re-renderização)");
  }

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

    console.log(`[DEBUG] Planta ${n}: status=${status}, isLodged=${isLodged}, has_sprouted=${bio?.has_sprouted}`);

    // Só pode marcar tombamento se brotou E está viva
    const canToggle = bio && bio.has_sprouted === true && (!status || status === 'alive');

    let bg = '#e5e7eb';
    let color = '#9ca3af';
    let cursor = 'not-allowed';
    let opacity = 0.5;
    let borderColor = '#d1d5db';

    if (canToggle) {
      if (isLodged) {
        bg = '#fef3c7';        // 🟡 amarelo
        color = '#92400e';
        borderColor = '#f59e0b';
      } else {
        bg = '#dcfce7';        // 🟢 verde
        color = '#065f46';
        borderColor = '#10b981';
      }
      cursor = 'pointer';
      opacity = 1;
    }

    const clickHandler = canToggle ? `togglePlantLodging(${n})` : 'void(0)';

    return `
      <button type="button"
        class="plant-circle"
        onclick="${clickHandler}"
        style="
          width:42px; height:42px; border-radius:999px;
          border:2px solid ${borderColor};
          background:${bg};
          color:${color};
          font-size:14px;
          font-weight:600;
          display:flex; align-items:center; justify-content:center;
          cursor:${cursor};
          opacity:${opacity};
        ">
        ${n}
      </button>
    `;
  }).join("");

  const bodyHtml = `
    <div style="font-size:13px; color:#4b5563; margin-bottom:8px;">
      Plantas tombadas – Parcela ${escapeHtml(plot_code)}, bloco ${block}.
    </div>

    <div style="margin-bottom:10px; font-size:12px; color:#6b7280;">
      <strong>🟢 Verde</strong> = Não tombada · <strong>🟡 Amarelo</strong> = Tombada · <strong>⚪ Cinza</strong> = Não aplicável
      <br>Clique nas plantas <strong>vivas</strong> para marcar como tombadas.
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
    openModal("Marcar plantas tombadas", bodyHtml);
  }
};

// -----------------------------------------------
// FUNÇÃO CORRIGIDA: togglePlantLodging
// -----------------------------------------------

window.togglePlantLodging = function togglePlantLodging(position) {
  console.log("[DEBUG] togglePlantLodging chamado para planta:", position);
  console.log("[DEBUG] Estado atual antes do toggle:", currentLodgingStatuses[position]);

  const bio = currentBiometrics[position];
  const status = currentPlantStatuses[position] || 'not_sprouted';

  const isAlive = bio && bio.has_sprouted === true && (!status || status === 'alive');
  if (!isAlive) {
    console.log("[DEBUG] Planta não pode ser marcada (não está viva)");
    return;
  }

  // ✅ Alternar estado de tombamento
  currentLodgingStatuses[position] = !currentLodgingStatuses[position];

  console.log("[DEBUG] Novo estado após toggle:", currentLodgingStatuses[position]);

  // ✅ CORREÇÃO: Re-renderizar SEM recarregar do banco
  openPlantLodgingDialog(true);  // true = skipReload
};
  
  window.savePlantLodging = async function savePlantLodging() {
    if (!currentMonitoringId) {
      alert("Nenhum monitoramento ativo.");
      return;
    }

    try {
      for (const [pos, isLodged] of Object.entries(currentLodgingStatuses)) {
        const position = parseInt(pos, 10);

        const { data: existing } = await s
          .from("plant_lodging")
          .select("id")
          .eq("monitoring_event_id", currentMonitoringId)
          .eq("plant_position", position)
          .maybeSingle();

        const payload = {
          monitoring_event_id: currentMonitoringId,
          plant_position: position,
          is_lodged: isLodged
        };

        if (existing) {
          await s.from("plant_lodging").update(payload).eq("id", existing.id);
        } else {
          await s.from("plant_lodging").insert(payload);
        }
      }

      alert("Tombamento salvo com sucesso.");
      if (typeof closeModal === "function") closeModal();

    } catch (err) {
      console.error("Erro ao salvar tombamento:", err);
      alert("Erro ao salvar tombamento.");
    }
  };

  async function loadBiometricsData(monitoringId) {
  try {
    const { data: bioData } = await s
      .from("plant_biometrics")
      .select("*")
      .eq("monitoring_event_id", monitoringId);

    currentBiometrics = {};
    
    if (!bioData || bioData.length === 0) {
      return;
    }
    
    for (const bio of bioData) {
      const { data: stems } = await s
        .from("plant_stem_measurements")
        .select("*")
        .eq("biometric_id", bio.id)
        .order("stem_number");
      
      currentBiometrics[bio.plant_position] = {
        ...bio,
        stems: stems || []
      };
    }
  } catch (err) {
    console.error("Erro ao carregar biométricos:", err);
  }
}

  async function loadPlantDataForEdit(monitoringId) {
    try {
      const { data: statusData } = await s
        .from("plant_status")
        .select("*")
        .eq("monitoring_event_id", monitoringId);

      currentPlantStatuses = {};
      (statusData || []).forEach(s => {
        currentPlantStatuses[s.plant_position] = s.status;
      });

      const { data: lodgingData } = await s
        .from("plant_lodging")
        .select("*")
        .eq("monitoring_event_id", monitoringId);

      currentLodgingStatuses = {};
      (lodgingData || []).forEach(l => {
        currentLodgingStatuses[l.plant_position] = l.is_lodged;
      });
    } catch (err) {
      console.error("Erro ao carregar dados das plantas:", err);
    }
  }

  async function loadLatestMonitoringForPlot(experiment_id, plot_code, blockNumber) {
    if (!plot_code) return null;

    try {
      const { data, error } = await s
        .from("monitoring_events")
        .select("*")
        .eq("experiment_id", experiment_id)
        .eq("plot_code", plot_code)
        .eq("block_number", blockNumber)
        .order("monitoring_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error("Erro ao buscar último monitoramento:", err);
      return null;
    }
  }


  // ============================================
  // NOVAS FUNÇÕES: Carregar estado anterior
  // ============================================

  async function loadPreviousStateForNewMonitoring(experiment_id, plot_code, blockNumber) {
    if (!plot_code) return { biometrics: {}, statuses: {}, lodging: {} };

    try {
      // Buscar o último monitoramento FINALIZADO (não o atual)
      const { data: previousMonitoring, error } = await s
        .from("monitoring_events")
        .select("*")
        .eq("experiment_id", experiment_id)
        .eq("plot_code", plot_code)
        .eq("block_number", blockNumber)
        .order("monitoring_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !previousMonitoring) {
        console.log('[INFO] Nenhum monitoramento anterior encontrado');
        return { biometrics: {}, statuses: {}, lodging: {} };
      }

      console.log('[INFO] Carregando estado anterior do monitoramento:', previousMonitoring.id);

      // Carregar biometrias do monitoramento anterior
      const { data: bioData } = await s
        .from("plant_biometrics")
        .select("*")
        .eq("monitoring_event_id", previousMonitoring.id);

      const previousBiometrics = {};

      if (bioData && bioData.length > 0) {
        for (const bio of bioData) {
          const { data: stems } = await s
            .from("plant_stem_measurements")
            .select("*")
            .eq("biometric_id", bio.id)
            .order("stem_number");

          previousBiometrics[bio.plant_position] = {
            has_sprouted: bio.has_sprouted,
            has_expanded_leaves: bio.has_expanded_leaves,
            stem_count: bio.stem_count,
            sanity_score: bio.sanity_score,
            sanity_observations: bio.sanity_observations,
            is_reference_plant: bio.is_reference_plant || false, // ✅ Manter plantas de referência
            stems: stems || []
          };
        }
      }

      // Carregar status do monitoramento anterior
      const { data: statusData } = await s
        .from("plant_status")
        .select("*")
        .eq("monitoring_event_id", previousMonitoring.id);

      const previousStatuses = {};
      (statusData || []).forEach(s => {
        previousStatuses[s.plant_position] = s.status;
      });

      // Carregar tombamento do monitoramento anterior (NÃO será copiado, apenas para referência)
      const { data: lodgingData } = await s
        .from("plant_lodging")
        .select("*")
        .eq("monitoring_event_id", previousMonitoring.id);

      const previousLodging = {};
      (lodgingData || []).forEach(l => {
        previousLodging[l.plant_position] = false; // ✅ Zerar tombamento no novo monitoramento
      });

      console.log('[INFO] Estado anterior carregado:', {
        biometrics: Object.keys(previousBiometrics).length,
        statuses: Object.keys(previousStatuses).length
      });

      return {
        biometrics: previousBiometrics,
        statuses: previousStatuses,
        lodging: previousLodging,
        previousDate: previousMonitoring.monitoring_date
      };

    } catch (err) {
      console.error("Erro ao carregar estado anterior:", err);
      return { biometrics: {}, statuses: {}, lodging: {} };
    }
  }

  async function copyPreviousStateToNewMonitoring(newMonitoringId, previousState) {
    if (!newMonitoringId || !previousState) return;

    try {
      console.log('[INFO] Copiando estado anterior para novo monitoramento:', newMonitoringId);

      // ✅ Copiar biometrias (INCLUINDO plantas mortas)
      const biometricsToInsert = [];
      for (const [position, bioData] of Object.entries(previousState.biometrics)) {
        const payload = {
          monitoring_event_id: newMonitoringId,
          plant_position: parseInt(position),
          stem_count: bioData.stem_count || 0,
          sanity_score: bioData.sanity_score,
          sanity_observations: bioData.sanity_observations,
          has_sprouted: bioData.has_sprouted,
          has_expanded_leaves: bioData.has_expanded_leaves,
          is_reference_plant: bioData.is_reference_plant || false
        };
        biometricsToInsert.push(payload);
      }

      if (biometricsToInsert.length > 0) {
        const { data: insertedBio, error: bioError } = await s
          .from("plant_biometrics")
          .insert(biometricsToInsert)
          .select('*');

        if (bioError) {
          console.error('[ERRO] Ao copiar biometrias:', bioError);
        } else {
          // Copiar medições de hastes
          for (const bio of insertedBio) {
            const oldBioData = previousState.biometrics[bio.plant_position];
            if (oldBioData && oldBioData.stems && oldBioData.stems.length > 0) {
              const stemsToInsert = oldBioData.stems.map(stem => ({
                biometric_id: bio.id,
                stem_number: stem.stem_number,
                height_cm: stem.height_cm,
                diameter_cm: stem.diameter_cm
              }));

              const { error: stemError } = await s
                .from("plant_stem_measurements")
                .insert(stemsToInsert);

              if (stemError) {
                console.error('[ERRO] Ao copiar hastes:', stemError);
              }
            }
          }
        }
      }

      // ✅ Copiar TODOS os status (incluindo plantas mortas)
      const statusToInsert = [];
      for (const [position, status] of Object.entries(previousState.statuses)) {
        statusToInsert.push({
          monitoring_event_id: newMonitoringId,
          plant_position: parseInt(position),
          status: status  // Copia 'alive', 'dead' ou 'not_sprouted'
        });
      }

      if (statusToInsert.length > 0) {
        const { error: statusError } = await s
          .from("plant_status")
          .insert(statusToInsert);

        if (statusError) {
          console.error('[ERRO] Ao copiar status:', statusError);
        }
      }

      // ❌ NÃO copiar tombamento - usuário marca novamente se necessário

      console.log('[INFO] Estado anterior copiado com sucesso');

    } catch (err) {
      console.error('[ERRO] Ao copiar estado anterior:', err);
    }
  }

  function updateMonitoringTabLabels() {
    const tabsEl = document.getElementById("monitoringTabs");
    if (!tabsEl) return;

    const iniciarBtn = tabsEl.querySelector('[data-tab="iniciar"]');
    if (!iniciarBtn) return;

    if (currentMonitoringId) {
      iniciarBtn.textContent = 'Finalizar monitoramento';
      iniciarBtn.style.background = '#10b981';
      iniciarBtn.style.borderColor = '#10b981';
      iniciarBtn.style.color = '#fff';
    } else {
      iniciarBtn.textContent = 'Iniciar monitoramento';
      iniciarBtn.style.background = '';
      iniciarBtn.style.borderColor = '';
      iniciarBtn.style.color = '';
    }
  }

  async function loadMonitoringList() {
  const experiment = window.currentExperiment;
  if (!experiment || typeof s === "undefined") return;

  const listEl = document.getElementById("monitoringList");
  const counterEl = document.getElementById("monitoringCounter");
  if (!listEl) return;

  try {
    const { data, error } = await s
      .from("monitoring_events")
      .select("*")
      .eq("experiment_id", experiment.id)
      .order("monitoring_date", { ascending: false })
      .order("block_number", { ascending: true });

    if (error) throw error;

    // Ordenar tratamento manualmente
    const sortedData = data.sort((a, b) => {
      const dateCompare = new Date(b.monitoring_date) - new Date(a.monitoring_date);
      if (dateCompare !== 0) return dateCompare;
      const blockCompare = a.block_number - b.block_number;
      if (blockCompare !== 0) return blockCompare;
      const plotA = parseInt(a.plot_code.replace(/\D/g, ''), 10);
      const plotB = parseInt(b.plot_code.replace(/\D/g, ''), 10);
      return plotA - plotB;
    });

    if (counterEl) {
      counterEl.textContent = sortedData.length + " monitoramento" + (sortedData.length !== 1 ? 's' : '') + " registrado" + (sortedData.length !== 1 ? 's' : '');
    }

    if (!sortedData || sortedData.length === 0) {
      listEl.innerHTML = '<div style="font-size:13px; color:#6b7280;">Nenhum monitoramento registrado ainda.</div>';
      return;
    }

    // ✅ CORREÇÃO: Use concatenação de strings com + 
    const items = [];
    for (const m of sortedData) {
      let html = '<div style="padding:10px; margin-bottom:8px; border-radius:8px; background:#f9fafb; border:1px solid #e5e7eb;">';
      html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">';
      html += '<div style="font-size:13px; font-weight:600; color:#065f46;">';
      html += formatDateShort(m.monitoring_date) + ' · Parcela ' + escapeHtml(m.plot_code) + ' · Bloco ' + m.block_number;
      html += '</div>';
      html += '<div style="display:flex; gap:6px;">';
      html += '<button onclick="editMonitoring(\'' + m.id + '\')">Editar</button>';
      html += '<button onclick="deleteMonitoring(\'' + m.id + '\')">Excluir</button>';
      html += '</div></div>';
      if (m.notes) {
        html += '<div style="font-size:12px; color:#6b7280;">' + escapeHtml(m.notes) + '</div>';
      }
      html += '</div>';
      items.push(html);
    }
    listEl.innerHTML = items.join('');

  } catch (err) {
    console.error("Erro ao carregar lista de monitoramentos:", err);
    listEl.innerHTML = '<div style="font-size:13px; color:#b91c1c;">Erro ao carregar monitoramentos.</div>';
  }
}
// ==========================================
// EDITAR MONITORAMENTO DA LISTA
// ==========================================
window.editMonitoring = async function editMonitoring(monitoringId) {
  if (window.currentRole === "visitor") {
    alert("Visitantes têm acesso somente leitura.");
    return;
  }

  try {
    // Buscar dados do monitoramento
    const { data: monitoring, error } = await s
      .from("monitoring_events")
      .select("*")
      .eq("id", monitoringId)
      .single();

    if (error || !monitoring) {
      alert("Erro ao carregar monitoramento.");
      return;
    }

    // Carregar dados de biometria e status
    await loadBiometricsData(monitoringId);
    await loadPlantDataForEdit(monitoringId);

    // Setar como monitoramento atual
    currentMonitoringId = monitoringId;

    // Ajustar selects para o bloco e parcela corretos
    const blockInput = document.getElementById("monitorBlock");
    const plotInput = document.getElementById("monitorPlot");

    if (blockInput) blockInput.value = monitoring.block_number;
    if (plotInput) plotInput.value = monitoring.plot_code;

    // Atualizar labels da aba
    updateMonitoringTabLabels();

    // Mudar para a aba "Iniciar monitoramento"
    const tabsEl = document.getElementById("monitoringTabs");
    const contentEl = document.getElementById("monitoringTabContent");

    if (tabsEl) {
      tabsEl.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      tabsEl.querySelector('[data-tab="iniciar"]')?.classList.add("active");
    }

    if (contentEl) {
      const experiment = window.currentExperiment;
      renderMonitoringTabIniciar(contentEl, experiment, {
        block: monitoring.block_number,
        plotCode: monitoring.plot_code
      });
    }

    // ✅ CORREÇÃO: Scroll melhorado com múltiplas tentativas
    setTimeout(() => {
      // Tentar rolar para o card de monitoramento
      const monitoringCard = document.getElementById('monitoringHeaderCard') || 
                            document.getElementById('monitoringTabsCard');
      
      if (monitoringCard) {
        monitoringCard.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start'
        });
      } else {
        // Fallback: rolar para o topo da página
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Tentar também no container principal
        const mainContent = document.querySelector('.main-content') || 
                           document.querySelector('main') ||
                           document.body;
        if (mainContent) {
          mainContent.scrollTop = 0;
        }
      }
    }, 200);

  } catch (err) {
    console.error("Erro ao editar monitoramento:", err);
    alert("Erro ao carregar monitoramento para edição.");
  }
};

// ==========================================
// EXCLUIR MONITORAMENTO DA LISTA
// ==========================================
window.deleteMonitoring = async function deleteMonitoring(monitoringId) {
  if (window.currentRole === "visitor") {
    alert("Visitantes têm acesso somente leitura.");
    return;
  }

  if (!confirm("Tem certeza que deseja excluir este monitoramento?\n\nEsta ação não pode ser desfeita e removerá:\n- Dados do monitoramento\n- Biometrias das plantas\n- Status de mortalidade\n- Plantas tombadas")) {
    return;
  }

  try {
    // 1. Buscar todas as biometrias deste monitoramento
    const { data: biometrics, error: bioError } = await s
      .from("plant_biometrics")
      .select("id")
      .eq("monitoring_event_id", monitoringId);

    if (bioError) throw bioError;

    // 2. Deletar medições das hastes (se houver)
    if (biometrics && biometrics.length > 0) {
      const biometricIds = biometrics.map(b => b.id);

      const { error: stemError } = await s
        .from("plant_stem_measurements")
        .delete()
        .in("biometric_id", biometricIds);

      if (stemError) throw stemError;
    }

    // 3. Deletar biometrias
    const { error: delBioError } = await s
      .from("plant_biometrics")
      .delete()
      .eq("monitoring_event_id", monitoringId);

    if (delBioError) throw delBioError;

    // 4. Deletar status das plantas
    const { error: statusError } = await s
      .from("plant_status")
      .delete()
      .eq("monitoring_event_id", monitoringId);

    if (statusError) throw statusError;

    // 5. Deletar plantas tombadas
    const { error: lodgingError } = await s
      .from("plant_lodging")
      .delete()
      .eq("monitoring_event_id", monitoringId);

    if (lodgingError) throw lodgingError;

    // 6. Deletar o monitoramento
    const { error: delError } = await s
      .from("monitoring_events")
      .delete()
      .eq("id", monitoringId);

    if (delError) throw delError;

    alert("Monitoramento excluído com sucesso!");

    // Se estiver editando este monitoramento, resetar
    if (currentMonitoringId === monitoringId) {
      resetMonitoringForm();

      const experiment = window.currentExperiment;
      const contentEl = document.getElementById("monitoringTabContent");
      const blockInput = document.getElementById("monitorBlock");
      const plotInput = document.getElementById("monitorPlot");

      if (contentEl && experiment) {
        const block = blockInput?.value ? parseInt(blockInput.value, 10) : 1;
        const plotCode = plotInput?.value?.trim() || "";
        renderMonitoringTabIniciar(contentEl, experiment, { block, plotCode });
      }
    }

    // Recarregar lista e estatísticas
    loadMonitoringList();
    const experiment = window.currentExperiment;
    if (experiment) {
      loadMonitoringSummary(experiment.id);
    }

  } catch (err) {
    console.error("Erro ao excluir monitoramento:", err);
    alert("Erro ao excluir monitoramento. Tente novamente.");
  }
};

  window.clearMonitoringForm = function clearMonitoringForm() {
    resetMonitoringForm();

    const dateInput = document.getElementById("monDate");
    const notesInput = document.getElementById("monNotes");

    if (dateInput) dateInput.value = '';
    if (notesInput) notesInput.value = '';
  };

})();
