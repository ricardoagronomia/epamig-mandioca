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
              🌿 Status das plantas por tratamento
            </div>
            <p style="font-size:12px; color:#6b7280; margin-bottom:10px;">
                Detalhamento: vivas, mortas e que não vingaram.
            </p>
            <div style="position:relative; height:240px;">
              <canvas id="chartSurvival"></canvas>
            </div>
          </div>

          <div class="card">
            <div style="font-size:14px; font-weight:600; color:#065f46; margin-bottom:6px;">
              ⚠️ Plantas tombadas por tratamento
            </div>
            <p style="font-size:12px; color:#6b7280; margin-bottom:10px;">
              Percentual de plantas vivas que tombaram (afeta manejo e produtividade).
            </p>
            <div style="position:relative; height:240px;">
              <canvas id="chartLodging"></canvas>
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
  async function generateLodgingChart(latestByPlot, biometrics, statuses, experimentId) {
  const ctx = document.getElementById('chartLodging');
  if (!ctx) return;

  // Buscar dados de tombamento
  const latestMonitoringIds = Object.values(latestByPlot).map(m => m.id);
  
  const { data: lodgingData, error: lodgingError } = await s
    .from('plant_lodging')
    .select('*')
    .in('monitoring_event_id', latestMonitoringIds);

  if (lodgingError) {
    console.error('Erro ao buscar tombamento:', lodgingError);
    return;
  }

  // Criar mapa de status
  const statusMap = {};
  statuses.forEach(s => {
    const key = `${s.monitoring_event_id}_${s.plant_position}`;
    statusMap[key] = s.status;
  });

  // Criar mapa de tombamento
  const lodgingMap = {};
  (lodgingData || []).forEach(l => {
    const key = `${l.monitoring_event_id}_${l.plant_position}`;
    lodgingMap[key] = l.is_lodged;
  });

  const dataByTreatment = {};

  Object.values(latestByPlot).forEach(mon => {
    const treatment = mon.plot_code;
    
    if (!dataByTreatment[treatment]) {
      dataByTreatment[treatment] = { 
        lodged: 0,    // Tombadas
        notLodged: 0  // Eretas
      };
    }

    const plantsBio = biometrics.filter(b => b.monitoring_event_id === mon.id);

    // Para cada posição de planta (1-9)
    for (let position = 1; position <= 9; position++) {
      const bio = plantsBio.find(b => b.plant_position === position);
      const key = `${mon.id}_${position}`;
      const status = statusMap[key];
      const isLodged = lodgingMap[key];

      // Considerar apenas plantas vivas (brotadas e não mortas)
      const isAlive = bio && bio.has_sprouted === true && (!status || status === 'alive');

      if (isAlive) {
        if (isLodged === true) {
          dataByTreatment[treatment].lodged++;
        } else {
          dataByTreatment[treatment].notLodged++;
        }
      }
    }
  });

  // Ordenar tratamentos
  const treatments = Object.keys(dataByTreatment).sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.replace(/\D/g, '')) || 0;
    return numA - numB;
  });

  // Calcular percentuais
  const lodgingPercentages = treatments.map(t => {
    const { lodged, notLodged } = dataByTreatment[t];
    const total = lodged + notLodged;
    return total > 0 ? (lodged / total) * 100 : 0;
  });

  chartInstances.lodging = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: treatments,
      datasets: [
        {
          label: 'Eretas',
          data: treatments.map(t => dataByTreatment[t].notLodged),
          backgroundColor: '#10b981',
          borderRadius: 4
        },
        {
          label: 'Tombadas',
          data: treatments.map(t => dataByTreatment[t].lodged),
          backgroundColor: '#f59e0b',
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked: true,
          title: { display: true, text: 'Tratamentos' }
        },
        y: { 
          stacked: true,
          beginAtZero: true,
          title: { display: true, text: 'Número de plantas vivas' }
        }
      },
      plugins: {
        legend: { 
          display: true, 
          position: 'bottom',
          labels: {
            boxWidth: 15,
            padding: 10
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              const treatment = context.label;
              const data = dataByTreatment[treatment];
              const total = data.lodged + data.notLodged;
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${label}: ${value} plantas (${percentage}%)`;
            },
            footer: function(tooltipItems) {
              if (tooltipItems.length > 0) {
                const treatment = tooltipItems[0].label;
                const data = dataByTreatment[treatment];
                const total = data.lodged + data.notLodged;
                const lodgingRate = total > 0 ? ((data.lodged / total) * 100).toFixed(1) : 0;
                return `\nTaxa de tombamento: ${lodgingRate}%`;
              }
              return '';
            }
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
      const numB = parseInt(b.label.replace(/\D/g, '')) || 0;  // ✅ Corrigido
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
  // ✅ NOVA FUNÇÃO 1: Gráfico de Status (substitui o antigo de sobrevivência)
async function generateSurvivalChart(latestByPlot, biometrics, statuses) {
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
      dataByTreatment[treatment] = { 
        alive: 0,      // Brotou e está viva
        dead: 0,       // Brotou mas morreu
        notSprouted: 0 // Nunca brotou
      };
    }

    const plantsBio = biometrics.filter(b => b.monitoring_event_id === mon.id);

    // Para cada posição de planta (1-9)
    for (let position = 1; position <= 9; position++) {
      const bio = plantsBio.find(b => b.plant_position === position);
      const key = `${mon.id}_${position}`;
      const status = statusMap[key];

      if (!bio || bio.has_sprouted === false) {
        // Nunca brotou
        dataByTreatment[treatment].notSprouted++;
      } else if (status === 'dead') {
        // Brotou mas morreu
        dataByTreatment[treatment].dead++;
      } else {
        // Brotou e está viva
        dataByTreatment[treatment].alive++;
      }
    }
  });

  // Ordenar tratamentos
  const treatments = Object.keys(dataByTreatment).sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.replace(/\D/g, '')) || 0;
    return numA - numB;
  });

  chartInstances.survival = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: treatments,
      datasets: [
        {
          label: 'Vivas',
          data: treatments.map(t => dataByTreatment[t].alive),
          backgroundColor: '#10b981',
          borderRadius: 4
        },
        {
          label: 'Mortas',
          data: treatments.map(t => dataByTreatment[t].dead),
          backgroundColor: '#ef4444',
          borderRadius: 4
        },
        {
          label: 'Não vingaram',
          data: treatments.map(t => dataByTreatment[t].notSprouted),
          backgroundColor: '#9ca3af',
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked: true,
          title: { display: true, text: 'Tratamentos' }
        },
        y: { 
          stacked: true,
          beginAtZero: true,
          title: { display: true, text: 'Número de plantas' }
        }
      },
      plugins: {
        legend: { 
          display: true, 
          position: 'bottom',
          labels: {
            boxWidth: 15,
            padding: 10
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              const treatment = context.label;
              const data = dataByTreatment[treatment];
              const total = data.alive + data.dead + data.notSprouted;
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value} plantas (${percentage}%)`;
            },
            footer: function(tooltipItems) {
              if (tooltipItems.length > 0) {
                const treatment = tooltipItems[0].label;
                const data = dataByTreatment[treatment];
                const total = data.alive + data.dead + data.notSprouted;
                const survivalRate = ((data.alive / total) * 100).toFixed(1);
                return `\nTaxa de sobrevivência: ${survivalRate}%`;
              }
              return '';
            }
          }
        }
      }
    }
  });
}

// ✅ NOVA FUNÇÃO 2: Gráfico de Tombamento
async function generateLodgingChart(latestByPlot, biometrics, statuses) {
  const ctx = document.getElementById('chartLodging');
  if (!ctx) return;

  // Buscar dados de tombamento
  const latestMonitoringIds = Object.values(latestByPlot).map(m => m.id);
  
  const { data: lodgingData, error: lodgingError } = await s
    .from('plant_lodging')
    .select('*')
    .in('monitoring_event_id', latestMonitoringIds);

  if (lodgingError) {
    console.error('Erro ao buscar tombamento:', lodgingError);
    return;
  }

  // Criar mapa de status
  const statusMap = {};
  statuses.forEach(s => {
    const key = `${s.monitoring_event_id}_${s.plant_position}`;
    statusMap[key] = s.status;
  });

  // Criar mapa de tombamento
  const lodgingMap = {};
  (lodgingData || []).forEach(l => {
    const key = `${l.monitoring_event_id}_${l.plant_position}`;
    lodgingMap[key] = l.is_lodged;
  });

  const dataByTreatment = {};

  Object.values(latestByPlot).forEach(mon => {
    const treatment = mon.plot_code;
    
    if (!dataByTreatment[treatment]) {
      dataByTreatment[treatment] = { 
        lodged: 0,    // Tombadas
        notLodged: 0  // Eretas
      };
    }

    const plantsBio = biometrics.filter(b => b.monitoring_event_id === mon.id);

    // Para cada posição de planta (1-9)
    for (let position = 1; position <= 9; position++) {
      const bio = plantsBio.find(b => b.plant_position === position);
      const key = `${mon.id}_${position}`;
      const status = statusMap[key];
      const isLodged = lodgingMap[key];

      // Considerar apenas plantas vivas (brotadas e não mortas)
      const isAlive = bio && bio.has_sprouted === true && (!status || status === 'alive');

      if (isAlive) {
        if (isLodged === true) {
          dataByTreatment[treatment].lodged++;
        } else {
          dataByTreatment[treatment].notLodged++;
        }
      }
    }
  });

  // Ordenar tratamentos
  const treatments = Object.keys(dataByTreatment).sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.replace(/\D/g, '')) || 0;
    return numA - numB;
  });

  chartInstances.lodging = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: treatments,
      datasets: [
        {
          label: 'Eretas',
          data: treatments.map(t => dataByTreatment[t].notLodged),
          backgroundColor: '#10b981',
          borderRadius: 4
        },
        {
          label: 'Tombadas',
          data: treatments.map(t => dataByTreatment[t].lodged),
          backgroundColor: '#f59e0b',
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked: true,
          title: { display: true, text: 'Tratamentos' }
        },
        y: { 
          stacked: true,
          beginAtZero: true,
          title: { display: true, text: 'Número de plantas vivas' }
        }
      },
      plugins: {
        legend: { 
          display: true, 
          position: 'bottom',
          labels: {
            boxWidth: 15,
            padding: 10
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              const treatment = context.label;
              const data = dataByTreatment[treatment];
              const total = data.lodged + data.notLodged;
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${label}: ${value} plantas (${percentage}%)`;
            },
            footer: function(tooltipItems) {
              if (tooltipItems.length > 0) {
                const treatment = tooltipItems[0].label;
                const data = dataByTreatment[treatment];
                const total = data.lodged + data.notLodged;
                const lodgingRate = total > 0 ? ((data.lodged / total) * 100).toFixed(1) : 0;
                return `\nTaxa de tombamento: ${lodgingRate}%`;
              }
              return '';
            }
          }
        }
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

    // Buscar dados climáticos mensais
    const climateData = await getClimateMonthlyData(climateVar, experimentId);
    if (!climateData || climateData.length === 0) {
      console.warn('Sem dados climáticos disponíveis');
      return;
    }

    // Agrupar monitoramentos por mês
    const monitoringsByMonth = {};
    
    allMonitorings.forEach(mon => {
      const date = new Date(mon.monitoring_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monitoringsByMonth[monthKey]) {
        monitoringsByMonth[monthKey] = [];
      }
      monitoringsByMonth[monthKey].push(mon);
    });

    // Calcular média de cada tratamento por mês
    const treatmentsByMonth = {};
    
    Object.keys(monitoringsByMonth).forEach(monthKey => {
      const monitorings = monitoringsByMonth[monthKey];
      
      const treatmentValues = {};
      
      monitorings.forEach(mon => {
        const treatment = mon.plot_code;
        
        if (!treatmentValues[treatment]) {
          treatmentValues[treatment] = [];
        }
        
        const value = getPlantMetricValueForMonitoring(plantMetric, mon, biometrics, statuses);
        treatmentValues[treatment].push(value);
      });
      
      // Calcular média de cada tratamento neste mês
      Object.keys(treatmentValues).forEach(treatment => {
        if (!treatmentsByMonth[treatment]) {
          treatmentsByMonth[treatment] = {};
        }
        
        const values = treatmentValues[treatment];
        const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
        treatmentsByMonth[treatment][monthKey] = avg;
      });
    });

    // Ordenar tratamentos
    const sortedTreatments = Object.keys(treatmentsByMonth).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numA - numB;
    });

    // Criar labels dos meses
    const monthLabels = climateData.map(d => d.label);
    const monthKeys = climateData.map(d => d.monthKey);

    // Configuração
    const config = getMetricConfig(plantMetric, climateVar);
    const colors = [
      '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
      '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1',
      '#84cc16', '#f43f5e'
    ];

    // Dataset das barras (dados climáticos)
    const datasets = [{
      type: 'bar',
      label: config.climateLabel,
      data: climateData.map(d => d.value),
      backgroundColor: 'rgba(37, 99, 235, 0.3)',
      borderColor: '#2563eb',
      borderWidth: 1,
      borderRadius: 4,
      yAxisID: 'y1'
    }];

    // Datasets das linhas (tratamentos)
    sortedTreatments.forEach((treatment, idx) => {
      const treatmentData = monthKeys.map(monthKey => {
        return treatmentsByMonth[treatment][monthKey] || null;
      });

      datasets.push({
        type: 'line',
        label: treatment,
        data: treatmentData,
        borderColor: colors[idx % colors.length],
        backgroundColor: colors[idx % colors.length],
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: colors[idx % colors.length],
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        yAxisID: 'y',
        spanGaps: true
      });
    });

    chartInstances.combo = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: monthLabels,
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
            title: { 
              display: true, 
              text: config.plantAxisLabel, 
              color: '#065f46', 
              font: { weight: 'bold', size: 13 } 
            },
            ticks: {
              color: '#065f46',
              font: { weight: 600 }
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            beginAtZero: config.climateBeginAtZero,
            title: { 
              display: true, 
              text: config.climateAxisLabel, 
              color: '#2563eb', 
              font: { weight: 'bold', size: 13 } 
            },
            grid: { 
              drawOnChartArea: false 
            },
            ticks: {
              color: '#2563eb',
              font: { weight: 600 }
            }
          },
          x: {
            ticks: {
              font: { size: 11 }
            }
          }
        },
        plugins: {
          legend: { 
            display: true, 
            position: 'top',
            labels: { 
              boxWidth: 15, 
              padding: 10, 
              font: { size: 11 },
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                
                if (context.dataset.type === 'bar') {
                  return `${label}: ${value.toFixed(1)}`;
                } else {
                  const unit = getPlantMetricUnit(plantMetric);
                  return `${label}: ${value.toFixed(1)} ${unit}`;
                }
              }
            }
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

  async function getClimateMonthlyData(climateVar, experimentId) {
    try {
      const { data, error } = await s
        .from("climate_daily")
        .select("date, rain_mm, tmax_c, tmin_c, tmean_c, rh_mean")
        .eq("station_code", "PADRAO")
        .order("date", { ascending: true });

      if (error || !data || data.length === 0) {
        console.warn('Sem dados climáticos');
        return null;
      }

      // Agrupar por mês
      const monthlyData = {};
      
      data.forEach(d => {
        if (!d.date) return;
        
        const date = new Date(d.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            precipSum: 0,
            tmaxSum: 0,
            tmaxCount: 0,
            tminSum: 0,
            tminCount: 0,
            tmeanSum: 0,
            tmeanCount: 0,
            rhSum: 0,
            rhCount: 0,
            year: date.getFullYear(),
            month: date.getMonth()
          };
        }
        
        const m = monthlyData[monthKey];
        
        if (d.rain_mm != null) m.precipSum += d.rain_mm;
        
        if (d.tmax_c != null) {
          m.tmaxSum += d.tmax_c;
          m.tmaxCount++;
        }
        
        if (d.tmin_c != null) {
          m.tminSum += d.tmin_c;
          m.tminCount++;
        }
        
        if (d.tmean_c != null) {
          m.tmeanSum += d.tmean_c;
          m.tmeanCount++;
        }
        
        if (d.rh_mean != null) {
          m.rhSum += d.rh_mean;
          m.rhCount++;
        }
      });

      // Converter para array e calcular valores finais
      const result = [];
      const nomesMeses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      
      Object.keys(monthlyData).sort().forEach(monthKey => {
        const m = monthlyData[monthKey];
        let value = 0;
        
        if (climateVar === 'precip_accum') {
          value = m.precipSum;
        } else if (climateVar === 'temp_avg') {
          value = m.tmeanCount > 0 ? m.tmeanSum / m.tmeanCount : 
                  (m.tmaxCount > 0 && m.tminCount > 0 ? (m.tmaxSum / m.tmaxCount + m.tminSum / m.tminCount) / 2 : 0);
        } else if (climateVar === 'temp_max') {
          value = m.tmaxCount > 0 ? m.tmaxSum / m.tmaxCount : 0;
        } else if (climateVar === 'temp_min') {
          value = m.tminCount > 0 ? m.tminSum / m.tminCount : 0;
        } else if (climateVar === 'humidity') {
          value = m.rhCount > 0 ? m.rhSum / m.rhCount : 0;
        }
        
        result.push({
          monthKey: monthKey,
          label: `${nomesMeses[m.month]}/${m.year}`,
          value: value
        });
      });
      
      return result;
      
    } catch (err) {
      console.error("Erro ao buscar dados climáticos mensais:", err);
      return null;
    }
  }

  function getPlantMetricUnit(plantMetric) {
    const units = {
      height: 'cm',
      survival: '%',
      sanity: '/5',
      diameter: 'cm'
    };
    return units[plantMetric] || '';
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
      .replace(/'/g, "&#039;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
})();
