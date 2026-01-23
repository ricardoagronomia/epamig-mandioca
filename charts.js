  // Gráfico 5: Combinado personalizável (barras agrupadas + linha climática)
  async function generateComboChart(latestByPlot, biometrics, statuses, allMonitorings, experimentId) {
    const ctx = document.getElementById('chartCombo');
    if (!ctx) return;

    // Destruir gráfico anterior
    if (chartInstances.combo) {
      chartInstances.combo.destroy();
    }

    const plantMetric = document.getElementById('selectPlantMetric')?.value || 'height';
    const climateVar = document.getElementById('selectClimateVar')?.value || 'precip_accum';

    // 1) Agrupar monitoramentos por data (períodos de coleta)
    const dateGroups = {};
    allMonitorings.forEach(mon => {
      if (!dateGroups[mon.monitoring_date]) {
        dateGroups[mon.monitoring_date] = [];
      }
      dateGroups[mon.monitoring_date].push(mon);
    });

    const sortedDates = Object.keys(dateGroups).sort((a, b) => new Date(a) - new Date(b));

    // 2) Obter dados da planta por tratamento e período
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

    // 3) Ordenar tratamentos
    const sortedTreatments = Object.keys(treatmentData).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numA - numB;
    });

    // 4) Buscar dados climáticos por período
    const climateDataByPeriod = await getClimateDataByPeriod(climateVar, experimentId, sortedDates);

    // 5) Configurar cores e labels
    const config = getMetricConfig(plantMetric, climateVar);
    const colors = [
      '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
      '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1',
      '#84cc16', '#f43f5e'
    ];

    // 6) Criar datasets (barras por tratamento)
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

    // 7) Adicionar linha climática
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

    // 8) Labels do eixo X (períodos)
    const periodLabels = sortedDates.map((date, idx) => {
      const d = new Date(date);
      return `P${idx + 1} (${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')})`;
    });

    // 9) Criar gráfico
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
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                
                if (context.dataset.type === 'line') {
                  return `${label}: ${value.toFixed(1)}`;
                }
                
                return `${label}: ${value.toFixed(2)}`;
              }
            }
          }
        }
      }
    });
  }

  // Helper: Obter valor da métrica para um monitoramento específico
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

  // Helper: Obter dados climáticos por período
  async function getClimateDataByPeriod(climateVar, experimentId, monitoringDates) {
    try {
      const { data, error } = await s
        .from("climate_data")
        .select("observation_date, precipitation_mm, temp_max_c, temp_min_c, humidity_percent")
        .eq("experiment_id", experimentId)
        .order("observation_date", { ascending: true });

      if (error || !data || data.length === 0) return null;

      // Para cada data de monitoramento, calcular o valor climático acumulado/médio até aquela data
      const result = [];

      monitoringDates.forEach(monDate => {
        const monDateObj = new Date(monDate);
        
        // Filtrar dados climáticos até essa data
        const climateUpToDate = data.filter(d => new Date(d.observation_date) <= monDateObj);

        if (climateUpToDate.length === 0) {
          result.push(0);
          return;
        }

        if (climateVar === 'precip_accum') {
          // Precipitação acumulada até o período
          const accum = climateUpToDate.reduce((sum, d) => sum + (d.precipitation_mm || 0), 0);
          result.push(accum);

        } else if (climateVar === 'temp_avg') {
          // Temperatura média do período
          const temps = climateUpToDate.map(d => ((d.temp_max_c || 0) + (d.temp_min_c || 0)) / 2);
          const avg = temps.reduce((sum, t) => sum + t, 0) / temps.length;
          result.push(avg);

        } else if (climateVar === 'temp_max') {
          // Temperatura máxima média do período
          const temps = climateUpToDate.map(d => d.temp_max_c || 0).filter(t => t > 0);
          const avg = temps.length > 0 ? temps.reduce((sum, t) => sum + t, 0) / temps.length : 0;
          result.push(avg);

        } else if (climateVar === 'temp_min') {
          // Temperatura mínima média do período
          const temps = climateUpToDate.map(d => d.temp_min_c || 0).filter(t => t > 0);
          const avg = temps.length > 0 ? temps.reduce((sum, t) => sum + t, 0) / temps.length : 0;
          result.push(avg);

        } else if (climateVar === 'humidity') {
          // Umidade média do período
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
