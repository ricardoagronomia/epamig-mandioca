// charts.js
// Página de Gráficos – visualizações interativas do experimento

(function () {
  window.renderChartsPage = renderChartsPage;

  let chartInstances = {};
  let cachedData = null;

  function renderChartsPage(container) {
    const experiment = window.currentExperiment || null;

    Object.values(chartInstances).forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        chart.destroy();
      }
    });
    chartInstances = {};

    container.innerHTML = `
      <div class="content-header">
        <div class="content-title">Gráficos do experimento</div>
        <div class="content-subtitle">
          Visualize o desenvolvimento da cultura e os efeitos dos tratamentos a partir das métricas coletadas em campo e por drone.
        </div>
      </div>

      <div class="card">
        <div style="display:flex; flex-wrap:wrap; gap:10px; align-items:center; justify-content:space-between;">
          <div style="font-size:13px; color:#4b5563;">
            ${
              experiment
                ? `
              Experimento <strong>${escapeHtml(experiment.code || "")}</strong> ·
              ${escapeHtml(experiment.name || "Sem nome")}<br>
              <span style="font-size:12px; color:#6b7280;">
                Gráficos gerados automaticamente a partir dos dados de monitoramento manual, drone e clima.
              </span>
            `
                : `
              <span style="color:#6b7280;">
                Nenhum experimento selecionado. Selecione um experimento na aba "Experimentos" para visualizar gráficos.
              </span>
            `
            }
          </div>
        </div>
      </div>

      ${experiment ? `
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); gap:16px;">
          
          <div class="card">
            <div style="font-size:14px; font-weight:600; color:#065f46; margin-bottom:6px;">
              📏 Evolução da altura média
            </div>
            <p style="font-size:12px; color:#6b7280; margin-bottom:10px;">
              Altura média por tratamento ao longo do tempo.
            </p>
            <div style="position:relative; height:240px;">
              <canvas id="chartHeight"></canvas>
            </div>
          </div>

          <div class="card">
            <div style="font-size:14px; font-weight:600; color:#065f46; margin-bottom:6px;">
              🌿 Taxa de sobrevivência
            </div>
            <p style="font-size:12px; color:#6b7280; margin-bottom:10px;">
              Percentual de plantas vivas por tratamento.
            </p>
            <div style="position:relative; height:240px;">
              <canvas id="chartSurvival"></canvas>
            </div>
          </div>

          <div class="card">
            <div style="font-size:14px; font-weight:600; color:#065f46; margin-bottom:6px;">
              ❤️ Sanidade média
            </div>
            <p style="font-size:12px; color:#6b7280; margin-bottom:10px;">
              Nota média de sanidade (1-5) por tratamento.
            </p>
            <div style="position:relative; height:240px;">
              <canvas id="chartSanity"></canvas>
            </div>
          </div>

          <div class="card">
            <div style="font-size:14px; font-weight:600; color:#065f46; margin-bottom:6px;">
              ⭕ Diâmetro médio do caule
            </div>
            <p style="font-size:12px; color:#6b7280; margin-bottom:10px;">
              Média dos três diâmetros medidos.
            </p>
            <div style="position:relative; height:240px;">
              <canvas id="chartDiameter"></canvas>
            </div>
          </div>

        </div>

        <div class="card" style="margin-top:16px;">
          <div style="font-size:15px; font-weight:700; color:#065f46; margin-bottom:10px;">
            🌦️ Gráfico combinado: Planta × Clima
          </div>
          
          <div style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:14px; align-items:end;">
            <div style="flex:1 1 180px; min-width:180px;">
              <label style="font-size:12px; font-weight:600; color:#374151; display:block; margin-bottom:4px;">
                Métrica da planta
              </label>
              <select id="selectPlantMetric" style="width:100%; padding:7px; border-radius:8px; border:1px solid #d1d5db; font-size:13px;">
                <option value="height">📏 Altura média (cm)</option>
                <option value="survival">🌿 Taxa de sobrevivência (%)</option>
                <option value="sanity">❤️ Sanidade (1-5)</option>
                <option value="diameter">⭕ Diâmetro do caule (cm)</option>
              </select>
            </div>

            <div style="flex:1 1 180px; min-width:180px;">
              <label style="font-size:12px; font-weight:600; color:#374151; display:block; margin-bottom:4px;">
                Variável climática
              </label>
              <select id="selectClimateVar" style="width:100%; padding:7px; border-radius:8px; border:1px solid #d1d5db; font-size:13px;">
                <option value="precip_accum">🌧️ Precipitação acumulada (mm)</option>
                <option value="temp_avg">🌡️ Temperatura média (°C)</option>
                <option value="temp_max">🔥 Temperatura máxima (°C)</option>
                <option value="temp_min">❄️ Temperatura mínima (°C)</option>
                <option value="humidity">💧 Umidade relativa média (%)</option>
              </select>
            </div>

            <button id="btnUpdateComboChart" class="btn-primary" style="width:auto; padding:7px 18px; height:36px; font-size:13px;">
              Atualizar
            </button>
          </div>

          <div style="position:relative; height:280px;">
            <canvas id="chartCombo"></canvas>
          </div>
        </div>

      ` : ''}
    `;

    if (experiment) {
      loadChartsData(experiment.id);
      
      const btnUpdate = document.getElementById('btnUpdateComboChart');
      if (btnUpdate) {
        btnUpdate.addEventListener('click', () => {
          if (cachedData) {
            generateComboChart(
              cachedData.latestByPlot,
              cachedData.biometrics,
              cachedData.statuses,
              cachedData.allMonitorings,
              cachedData.experimentId
            );
          }
        });
      }
    }
  }

  async function loadChartsData(experimentId) {
    if (typeof s === "undefined") {
      console.error("Supabase client não disponível");
      return;
    }

    try {
      const { data: allMonitorings, error: monError } = await s
        .from("monitoring_events")
        .select("id, plot_code, block_number, monitoring_date")
        .eq("experiment_id", experimentId)
        .order("monitoring_date", { ascending: true });

      if (monError) throw monError;
      if (!allMonitorings || !allMonitorings.length) return;

      const latestByPlot = {};
      [...allMonitorings].reverse().forEach(m => {
        const key = `${m.block_number}_${m.plot_code}`;
        if (!latestByPlot[key]) {
          latestByPlot[key] = m;
        }
      });

      const allMonitoringIds = allMonitorings.map(m => m.id);
      const latestMonitoringIds = Object.values(latestByPlot).map(m => m.id);

      const { data: biometrics, error: bioError } = await s
        .from("plant_biometrics")
        .select("*")
        .in("monitoring_event_id", allMonitoringIds);

      if (bioError) throw bioError;

      const { data: statuses, error: statusError } = await s
        .from("plant_status")
        .select("*")
        .in("monitoring_event_id", latestMonitoringIds);

      if (statusError) throw statusError;

      cachedData = {
        latestByPlot,
        biometrics,
        statuses,
        allMonitorings,
        experimentId
      };

      generateHeightChart(allMonitorings, biometrics);
      generateSurvivalChart(latestByPlot, biometrics, statuses);
      generateSanityChart(latestByPlot, biometrics, statuses);
      generateDiameterChart(latestByPlot, biometrics, statuses);
      generateComboChart(latestByPlot, biometrics, statuses, allMonitorings, experimentId);

    } catch (err) {
      console.error("Erro ao carregar dados dos gráficos:", err);
    }
  }

  function generateHeightChart(monitorings, biometrics) {
    const ctx = document.getElementById('chartHeight');
    if (!ctx) return;

    const dataByTreatment = {};

    monitorings.forEach(mon => {
      const treatmentKey = mon.plot_code;
      
      if (!dataByTreatment[treatmentKey]) {
        dataByTreatment[treatmentKey] = {};
      }

      const plantsBio = biometrics.filter(b => 
        b.monitoring_event_id === mon.id && 
        b.has_sprouted === true &&
        b.height_cm != null &&
        b.height_cm > 0
      );

      if (plantsBio.length > 0) {
        const avgHeight = plantsBio.reduce((sum, b) => sum + b.height_cm, 0) / plantsBio.length;
        
        if (!dataByTreatment[treatmentKey][mon.monitoring_date]) {
          dataByTreatment[treatmentKey][mon.monitoring_date] = [];
        }
        dataByTreatment[treatmentKey][mon.monitoring_date].push(avgHeight);
      }
    });

    const finalData = {};
    
    Object.keys(dataByTreatment).forEach(treatment => {
      finalData[treatment] = [];
      
      Object.keys(dataByTreatment[treatment]).forEach(date => {
        const heights = dataByTreatment[treatment][date];
        const avgAcrossBlocks = heights.reduce((sum, h) => sum + h, 0) / heights.length;
        
        finalData[treatment].push({
          date: date,
          height: avgAcrossBlocks
        });
      });
      
      finalData[treatment].sort((a, b) => new Date(a.date) - new Date(b.date));
    });

    const colors = [
      '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
      '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1',
      '#84cc16', '#f43f5e'
    ];

    const sortedTreatments = Object.keys(finalData).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numA - numB;
    });

    const datasets = sortedTreatments.map((treatment, idx) => {
      return {
        label: treatment,
        data: finalData[treatment].map(d => ({ x: d.date, y: d.height })),
        borderColor: colors[idx % colors.length],
        backgroundColor: colors[idx % colors.length] + '20',
        borderWidth: 2,
        tension: 0.3,
        fill: false
      };
    });

    chartInstances.height = new Chart(ctx, {
      type: 'line',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'time',
            time: { unit: 'day', displayFormats: { day: 'dd/MM' } },
            title: { display: true, text: 'Data do monitoramento' }
          },
          y: {
            title: { display: true, text: 'Altura média (cm)' },
            beginAtZero: true
          }
        },
        plugins: {
          legend: { display: true, position: 'bottom' },
          tooltip: {
            callbacks: {
              label: (context) => `${context.dataset.label}: ${context.parsed.y.toFixed(1)} cm`
            }
          }
        }
      }
    });
  }

  function generateSurvivalChart(latestByPlot, biometrics, statuses) {
    const ctx = document.getElementById('chartSurvival');
    if (!ctx) return;

    const statusMap = {};
    statuses.forEach(s => {
      const key = `${s.monitoring_event_id}_${s.plant_position}`;
      statusMap[key] = s.status;
    });

    const dataByTreatment = {};

    Object.values(latestByPlot).forEach(mon => {
      const treatment = mon.plot_code;
      
      if (!dataByTreatment[treatment]) {
        dataByTreatment[treatment] = { alive: 0, total: 0 };
      }

      const plantsBio = biometrics.filter(b => b.monitoring_event_id === mon.id);
      const sproutedPlants = plantsBio.filter(b => b.has_sprouted === true);
      
      const alivePlants = sproutedPlants.filter(b => {
        const key = `${b.monitoring_event_id}_${b.plant_position}`;
        const status = statusMap[key];
        return !status || status === 'alive';
      }).length;

      dataByTreatment[treatment].alive += alivePlants;
      dataByTreatment[treatment].total += 9;
    });

    const survivalData = [];

    Object.keys(dataByTreatment).forEach(treatment => {
      const { alive, total } = dataByTreatment[treatment];
      const survivalRate = (alive / total) * 100;
      survivalData.push({ label: treatment, rate: survivalRate });
    });

    survivalData.sort((a, b) => {
      const numA = parseInt(a.label.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.label.replace(/\D/g, '')) || 0;
      return numA - numB;
    });

    chartInstances.survival = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: survivalData.map(d => d.label),
        datasets: [{
          label: 'Taxa de sobrevivência (%)',
          data: survivalData.map(d => d.rate),
          backgroundColor: survivalData.map(d => 
            d.rate >= 80 ? '#10b981' : d.rate >= 60 ? '#f59e0b' : '#ef4444'
          ),
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { 
            beginAtZero: true, 
            max: 100,
            title: { display: true, text: 'Sobrevivência (%)' }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `${context.parsed.y.toFixed(1)}%`
            }
          }
        }
      }
    });
  }

  function generateSanityChart(latestByPlot, biometrics, statuses) {
    const ctx = document.getElementById('chartSanity');
    if (!ctx) return;

    const dataByTreatment = {};

    Object.values(latestByPlot).forEach(mon => {
      const treatment = mon.plot_code;
      
      if (!dataByTreatment[treatment]) {
        dataByTreatment[treatment] = [];
      }

      const plantsBio = biometrics.filter(b => 
        b.monitoring_event_id === mon.id &&
        b.has_sprouted === true &&
        b.sanity_score != null &&
        b.sanity_score > 0
      );

      if (plantsBio.length > 0) {
        const avgSanity = plantsBio.reduce((sum, b) => sum + b.sanity_score, 0) / plantsBio.length;
        dataByTreatment[treatment].push(avgSanity);
      }
    });

    const sanityData = [];
    Object.keys(dataByTreatment).forEach(treatment => {
      const values = dataByTreatment[treatment];
      if (values.length > 0) {
        const avgSanity = values.reduce((sum, v) => sum + v, 0) / values.length;
        sanityData.push({ label: treatment, sanity: avgSanity });
      }
    });

    sanityData.sort((a, b) => {
      const numA = parseInt(a.label.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.label.replace(/\D/g, '')) || 0;
      return numA - numB;
    });

    if (sanityData.length === 0) return;

    chartInstances.sanity = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sanityData.map(d => d.label),
        datasets: [{
          label: 'Sanidade média',
          data: sanityData.map(d => d.sanity),
          backgroundColor: '#ec4899',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { 
            beginAtZero: true,
            max: 5,
            title: { display: true, text: 'Nota (1-5)' }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  function generateDiameterChart(latestByPlot, biometrics, statuses) {
    const ctx = document.getElementById('chartDiameter');
    if (!ctx) return;

    const dataByTreatment = {};

    Object.values(latestByPlot).forEach(mon => {
      const treatment = mon.plot_code;
      
      if (!dataByTreatment[treatment]) {
        dataByTreatment[treatment] = [];
      }

      const plantsBio = biometrics.filter(b => 
        b.monitoring_event_id === mon.id &&
        b.has_sprouted === true &&
        (
          (b.stem_diameter_1_cm != null && b.stem_diameter_1_cm > 0) ||
          (b.stem_diameter_2_cm != null && b.stem_diameter_2_cm > 0) ||
          (b.stem_diameter_3_cm != null && b.stem_diameter_3_cm > 0)
        )
      );

      if (plantsBio.length > 0) {
        let totalDiameters = 0;
        let diameterCount = 0;
        
        plantsBio.forEach(b => {
          if (b.stem_diameter_1_cm && b.stem_diameter_1_cm > 0) { 
            totalDiameters += b.stem_diameter_1_cm; 
            diameterCount++; 
          }
          if (b.stem_diameter_2_cm && b.stem_diameter_2_cm > 0) { 
            totalDiameters += b.stem_diameter_2_cm; 
            diameterCount++; 
          }
          if (b.stem_diameter_3_cm && b.stem_diameter_3_cm > 0) { 
            totalDiameters += b.stem_diameter_3_cm; 
            diameterCount++; 
          }
        });

        if (diameterCount > 0) {
          const avgDiameter = totalDiameters / diameterCount;
          dataByTreatment[treatment].push(avgDiameter);
        }
      }
    });

    const diameterData = [];
    Object.keys(dataByTreatment).forEach(treatment => {
      const values = dataByTreatment[treatment];
      if (values.length > 0) {
        const avgDiameter = values.reduce((sum, v) => sum + v, 0) / values.length;
        diameterData.push({ label: treatment, diameter: avgDiameter });
      }
    });

    diameterData.sort((a, b) => {
      const numA = parseInt(a.label.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numA - numB;
    });

    if (diameterData.length === 0) return;

    chartInstances.diameter = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: diameterData.map(d => d.label),
        datasets: [{
          label: 'Diâmetro médio (cm)',
          data: diameterData.map(d => d.diameter),
          backgroundColor: '#3b82f6',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { 
            beginAtZero: true,
            title: { display: true, text: 'Diâmetro (cm)' }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  async function generateComboChart(latestByPlot, biometrics, statuses, allMonitorings, experimentId) {
    const ctx = document.getElementById('chartCombo');
    if (!ctx) return;

    if (chartInstances.combo) {
      chartInstances.combo.destroy();
    }

    const plantMetric = document.getElementById('selectPlantMetric')?.value || 'height';
    const climateVar = document.getElementById('selectClimateVar')?.value || 'precip_accum';

    const dateGroups = {};
    allMonitorings.forEach(mon => {
      if (!dateGroups[mon.monitoring_date]) {
        dateGroups[mon.monitoring_date] = [];
      }
      dateGroups[mon.monitoring_date].push(mon);
    });

    const sortedDates = Object.keys(dateGroups).sort((a, b) => new Date(a) - new Date(b));

    const treatmentData = {};
    
    sortedDates.forEach(date => {
      const monitorings = dateGroups[date];
      
      monitorings.forEach(mon => {
        const treatment = mon.plot_code;
        
        if (!treatmentData[treatment]) {
          treatmentData[treatment] = [];
        }

        const value = getPlantMetricValueForMonitoring(plantMetric, mon, biometrics, statuses);
        treatmentData[treatment].push(value);
      });
    });

    const sortedTreatments = Object.keys(treatmentData).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numA - numB;
    });

    const climateDataByPeriod = await getClimateDataByPeriod(climateVar, experimentId, sortedDates);

    const config = getMetricConfig(plantMetric, climateVar);
    const colors = [
      '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
      '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1',
      '#84cc16', '#f43f5e'
    ];

    const datasets = sortedTreatments.map((treatment, idx) => {
      return {
        type: 'bar',
        label: treatment,
        data: treatmentData[treatment],
        backgroundColor: colors[idx % colors.length],
        borderRadius: 4,
        yAxisID: 'y'
      };
    });

    if (climateDataByPeriod && climateDataByPeriod.length > 0) {
      datasets.push({
        type: 'line',
        label: config.climateLabel,
        data: climateDataByPeriod,
        borderColor: '#dc2626',
        backgroundColor: 'transparent',
        borderWidth: 3,
        tension: 0.4,
        yAxisID: 'y1',
        pointRadius: 5,
        pointBackgroundColor: '#dc2626',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      });
    }

    const periodLabels = sortedDates.map((date, idx) => {
      const d = new Date(date);
      return `P${idx + 1} (${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')})`;
    });

    chartInstances.combo = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: periodLabels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            beginAtZero: config.plantBeginAtZero,
            max: config.plantMax,
            title: { display: true, text: config.plantAxisLabel, color: '#065f46', font: { weight: 'bold' } }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            beginAtZero: config.climateBeginAtZero,
            title: { display: true, text: config.climateAxisLabel, color: '#dc2626', font: { weight: 'bold' } },
            grid: { drawOnChartArea: false }
          }
        },
        plugins: {
          legend: { 
            display: true, 
            position: 'top',
            labels: { boxWidth: 12, padding: 8, font: { size: 11 } }
          }
        }
      }
    });
  }

  function getPlantMetricValueForMonitoring(metric, monitoring, biometrics, statuses) {
    const plantsBio = biometrics.filter(b => b.monitoring_event_id === monitoring.id);

    if (metric === 'height') {
      const validPlants = plantsBio.filter(b => 
        b.has_sprouted === true &&
        b.height_cm != null &&
        b.height_cm > 0
      );
      
      if (validPlants.length === 0) return 0;
      return validPlants.reduce((sum, b) => sum + b.height_cm, 0) / validPlants.length;

    } else if (metric === 'survival') {
      const statusMap = {};
      statuses.forEach(s => {
        const key = `${s.monitoring_event_id}_${s.plant_position}`;
        statusMap[key] = s.status;
      });

      const sproutedPlants = plantsBio.filter(b => b.has_sprouted === true);
      const alivePlants = sproutedPlants.filter(b => {
        const key = `${b.monitoring_event_id}_${b.plant_position}`;
        const status = statusMap[key];
        return !status || status === 'alive';
      }).length;

      return (alivePlants / 9) * 100;

    } else if (metric === 'sanity') {
      const validPlants = plantsBio.filter(b => 
        b.has_sprouted === true &&
        b.sanity_score != null &&
        b.sanity_score > 0
      );
      
      if (validPlants.length === 0) return 0;
      return validPlants.reduce((sum, b) => sum + b.sanity_score, 0) / validPlants.length;

    } else if (metric === 'diameter') {
      const validPlants = plantsBio.filter(b => 
        b.has_sprouted === true &&
        (
          (b.stem_diameter_1_cm != null && b.stem_diameter_1_cm > 0) ||
          (b.stem_diameter_2_cm != null && b.stem_diameter_2_cm > 0) ||
          (b.stem_diameter_3_cm != null && b.stem_diameter_3_cm > 0)
        )
      );

      if (validPlants.length === 0) return 0;

      let totalDiameters = 0;
      let diameterCount = 0;
      
      validPlants.forEach(b => {
        if (b.stem_diameter_1_cm && b.stem_diameter_1_cm > 0) { 
          totalDiameters += b.stem_diameter_1_cm; 
          diameterCount++; 
        }
        if (b.stem_diameter_2_cm && b.stem_diameter_2_cm > 0) { 
          totalDiameters += b.stem_diameter_2_cm; 
          diameterCount++; 
        }
        if (b.stem_diameter_3_cm && b.stem_diameter_3_cm > 0) { 
          totalDiameters += b.stem_diameter_3_cm; 
          diameterCount++; 
        }
      });

      return diameterCount > 0 ? totalDiameters / diameterCount : 0;
    }

    return 0;
  }

  async function getClimateDataByPeriod(climateVar, experimentId, monitoringDates) {
    try {
      const { data, error } = await s
        .from("climate_data")
        .select("observation_date, precipitation_mm, temp_max_c, temp_min_c, humidity_percent")
        .eq("experiment_id", experimentId)
        .order("observation_date", { ascending: true });

      if (error || !data || data.length === 0) return null;

      const result = [];

      monitoringDates.forEach(monDate => {
        const monDateObj = new Date(monDate);
        
        const climateUpToDate = data.filter(d => new Date(d.observation_date) <= monDateObj);

        if (climateUpToDate.length === 0) {
          result.push(0);
          return;
        }

        if (climateVar === 'precip_accum') {
          const accum = climateUpToDate.reduce((sum, d) => sum + (d.precipitation_mm || 0), 0);
          result.push(accum);

        } else if (climateVar === 'temp_avg') {
          const temps = climateUpToDate.map(d => ((d.temp_max_c || 0) + (d.temp_min_c || 0)) / 2);
          const avg = temps.reduce((sum, t) => sum + t, 0) / temps.length;
          result.push(avg);

        } else if (climateVar === 'temp_max') {
          const temps = climateUpToDate.map(d => d.temp_max_c || 0).filter(t => t > 0);
          const avg = temps.length > 0 ? temps.reduce((sum, t) => sum + t, 0) / temps.length : 0;
          result.push(avg);

        } else if (climateVar === 'temp_min') {
          const temps = climateUpToDate.map(d => d.temp_min_c || 0).filter(t => t > 0);
          const avg = temps.length > 0 ? temps.reduce((sum, t) => sum + t, 0) / temps.length : 0;
          result.push(avg);

        } else if (climateVar === 'humidity') {
          const humidity = climateUpToDate.map(d => d.humidity_percent || 0).filter(h => h > 0);
          const avg = humidity.length > 0 ? humidity.reduce((sum, h) => sum + h, 0) / humidity.length : 0;
          result.push(avg);
        }
      });

      return result;

    } catch (err) {
      console.error("Erro ao buscar dados climáticos:", err);
      return null;
    }
  }

  function getMetricConfig(plantMetric, climateVar) {
    const configs = {
      height: {
        plantLabel: 'Altura média (cm)',
        plantAxisLabel: 'Altura (cm)',
        plantColor: '#10b981',
        plantBeginAtZero: true,
        plantMax: null
      },
      survival: {
        plantLabel: 'Taxa de sobrevivência (%)',
        plantAxisLabel: 'Sobrevivência (%)',
        plantColor: '#10b981',
        plantBeginAtZero: true,
        plantMax: 100
      },
      sanity: {
        plantLabel: 'Sanidade média',
        plantAxisLabel: 'Sanidade (1-5)',
        plantColor: '#ec4899',
        plantBeginAtZero: true,
        plantMax: 5
      },
      diameter: {
        plantLabel: 'Diâmetro médio (cm)',
        plantAxisLabel: 'Diâmetro (cm)',
        plantColor: '#3b82f6',
        plantBeginAtZero: true,
        plantMax: null
      }
    };

    const climateConfigs = {
      precip_accum: {
        climateLabel: 'Precipitação acumulada (mm)',
        climateAxisLabel: 'Precipitação (mm)',
        climateColor: '#3b82f6',
        climateBeginAtZero: true
      },
      temp_avg: {
        climateLabel: 'Temperatura média (°C)',
        climateAxisLabel: 'Temperatura (°C)',
        climateColor: '#f59e0b',
        climateBeginAtZero: false
      },
      temp_max: {
        climateLabel: 'Temperatura máxima (°C)',
        climateAxisLabel: 'Temp. máxima (°C)',
        climateColor: '#ef4444',
        climateBeginAtZero: false
      },
      temp_min: {
        climateLabel: 'Temperatura mínima (°C)',
        climateAxisLabel: 'Temp. mínima (°C)',
        climateColor: '#06b6d4',
        climateBeginAtZero: false
      },
      humidity: {
        climateLabel: 'Umidade relativa média (%)',
        climateAxisLabel: 'Umidade (%)',
        climateColor: '#8b5cf6',
        climateBeginAtZero: true
      }
    };

    return {
      ...configs[plantMetric],
      ...climateConfigs[climateVar]
    };
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "'")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
})();
