// reports.js
// Página de Relatórios – consolidação geral dos dados, exportação em PDF e Excel

(function () {
  window.renderReportsPage = renderReportsPage;

  function renderReportsPage(container) {
    const experiment = window.currentExperiment || null;
    const isVisitor = window.currentRole === "visitor";

    container.innerHTML = `
      <div class="content-header">
        <div class="content-title">Relatórios</div>
        <div class="content-subtitle">
          Gere relatórios consolidados em PDF e exporte tabelas de dados em Excel para análises estatísticas e backup convencional.
        </div>
      </div>

      <!-- Contexto do experimento -->
      <div class="card">
        <div style="display:flex; flex-wrap:wrap; gap:10px; align-items:center; justify-content:space-between;">
          <div style="font-size:13px; color:#4b5563;">
            ${
              experiment
                ? `
              Experimento <strong>${escapeHtml(experiment.code || "")}</strong> ·
              ${escapeHtml(experiment.name || "Sem nome")}<br>
              <span style="font-size:12px; color:#6b7280;">
                Inclui dados de monitoramento, colheita, drone, clima, intervenções e cronograma.
              </span>
            `
                : `
              <span style="color:#6b7280;">
                Nenhum experimento selecionado. Selecione um experimento na aba "Experimentos" para visualizar relatórios.
              </span>
            `
            }
          </div>
        </div>
      </div>

      ${experiment ? `
        <!-- Seção de relatório geral em PDF -->
        <div class="card">
          <div style="font-size:14px; font-weight:600; color:#065f46; margin-bottom:6px;">
            📄 Relatório geral do experimento
          </div>
          <p style="font-size:13px; color:#6b7280; margin-bottom:12px;">
            Gera um documento consolidado em PDF contendo resumo executivo, layout experimental, cronograma,
            descrição dos tratamentos, dados de monitoramento, colheita e análise climática integrada.
          </p>

          <div style="
            border-radius:10px;
            border:1px solid #e5e7eb;
            padding:12px;
            background:#f0fdf4;
            display:flex;
            flex-direction:column;
            gap:8px;
          ">
            <div style="margin-bottom:8px;">
              <button 
                class="btn-primary" 
                style="width:100%; padding:10px; font-size:13px;" 
                onclick="generatePDFReport()"
                ${!experiment ? 'disabled' : ''}
              >
                📥 Gerar relatório em PDF
              </button>
            </div>
          </div>
        </div>

        <!-- Seção de exportação de tabelas em Excel -->
        <div class="card">
          <div style="font-size:14px; font-weight:600; color:#065f46; margin-bottom:6px;">
            📊 Exportar tabelas em Excel
          </div>
          <p style="font-size:13px; color:#6b7280; margin-bottom:12px;">
            Exporte tabelas individuais ou em lote para análise estatística externa, regressão, ANOVA ou outros cálculos.
            Formato pronto para R, Python, SPSS ou softwares de análise estatística.
          </p>

          <div style="
            display:grid;
            grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));
            gap:10px;
          ">
            <!-- Tabela: Monitoramento -->
            <div style="
              border-radius:10px;
              border:1px solid #e5e7eb;
              padding:10px;
              background:#eff6ff;
            ">
              <div style="font-size:13px; font-weight:600; color:#1e40af; margin-bottom:6px;">
                Monitoramento
              </div>
              <p style="font-size:12px; color:#4b5563; margin-bottom:8px;">
                Altura, sanidade, diâmetro e status das plantas por avaliação.
              </p>
              <button 
                class="btn-secondary" 
                style="width:100%; padding:8px; font-size:12px;" 
                onclick="exportMonitoringData()"
              >
                Exportar .xlsx
              </button>
            </div>

            <!-- Tabela: Colheita -->
            <div style="
              border-radius:10px;
              border:1px solid #e5e7eb;
              padding:10px;
              background:#fef3c7;
            ">
              <div style="font-size:13px; font-weight:600; color:#92400e; margin-bottom:6px;">
                Colheita
              </div>
              <p style="font-size:12px; color:#4b5563; margin-bottom:8px;">
                Peso total, raízes comerciais, perdas por parcela e bloco.
              </p>
              <button 
                class="btn-secondary" 
                style="width:100%; padding:8px; font-size:12px;" 
                onclick="exportHarvestData()"
              >
                Exportar .xlsx
              </button>
            </div>

            <!-- Tabela: Drone (NDVI) -->
            <div style="
              border-radius:10px;
              border:1px solid #e5e7eb;
              padding:10px;
              background:#ecfdf5;
            ">
              <div style="font-size:13px; font-weight:600; color:#065f46; margin-bottom:6px;">
                Drone (NDVI)
              </div>
              <p style="font-size:12px; color:#4b5563; margin-bottom:8px;">
                Índice de vegetação normalizado por data e tratamento.
              </p>
              <button 
                class="btn-secondary" 
                style="width:100%; padding:8px; font-size:12px;" 
                onclick="exportDroneData()"
              >
                Exportar .xlsx
              </button>
            </div>

            <!-- Tabela: Clima -->
            <div style="
              border-radius:10px;
              border:1px solid #e5e7eb;
              padding:10px;
              background:#f0f9ff;
            ">
              <div style="font-size:13px; font-weight:600; color:#0c4a6e; margin-bottom:6px;">
                Clima
              </div>
              <p style="font-size:12px; color:#4b5563; margin-bottom:8px;">
                Precipitação diária, máximas e mínimas, resumo mensal e acumulado.
              </p>
              <button 
                class="btn-secondary" 
                style="width:100%; padding:8px; font-size:12px;" 
                onclick="exportClimateData()"
              >
                Exportar .xlsx
              </button>
            </div>

            <!-- Tabela: Intervenções -->
            <div style="
              border-radius:10px;
              border:1px solid #e5e7eb;
              padding:10px;
              background:#fce7f3;
            ">
              <div style="font-size:13px; font-weight:600; color:#831843; margin-bottom:6px;">
                Intervenções
              </div>
              <p style="font-size:12px; color:#4b5563; margin-bottom:8px;">
                Histórico de adubação, controle, irrigação e outras operações.
              </p>
              <button 
                class="btn-secondary" 
                style="width:100%; padding:8px; font-size:12px;" 
                onclick="exportInterventionsData()"
              >
                Exportar .xlsx
              </button>
            </div>
            
                <!-- Tabela Linha do tempo (Cronograma + Intervenções) -->
                <div style="border-radius:10px; border:1px solid #e5e7eb; padding:10px; background:#eef2ff;">
                  <div style="font-size:13px; font-weight:600; color:#3730a3; margin-bottom:6px;">
                    Linha do tempo
                  </div>
                  <p style="font-size:12px; color:#4b5563; margin-bottom:8px;">
                    Cronograma e intervenções integrados em ordem cronológica, em uma única aba Excel.
                  </p>
                  <button class="btn-secondary"
                          style="width:100%; padding:8px; font-size:12px;"
                          onclick="exportTimelineData()">
                    Exportar .xlsx
                  </button>
                </div>

            <!-- Tabela: Resumo consolidado -->
            <div style="
              border-radius:10px;
              border:1px solid #e5e7eb;
              padding:10px;
              background:#f5f3ff;
            ">
              <div style="font-size:13px; font-weight:600; color:#6b21a8; margin-bottom:6px;">
                Resumo consolidado
              </div>
              <p style="font-size:12px; color:#4b5563; margin-bottom:8px;">
                Todas as tabelas em um único arquivo Excel (abas separadas).
              </p>
              <button 
                class="btn-primary" 
                style="width:100%; padding:8px; font-size:12px;" 
                onclick="exportAllData()"
              >
                Exportar tudo .xlsx
              </button>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Nota sobre backup e análise -->
      <div class="card" style="background:#f0fdf4; border:1px solid #86efac;">
        <div style="font-size:13px; color:#374151;">
          <strong>💡 Dica:</strong> Utilize a exportação em Excel como backup convencional de seus dados.
          As tabelas exportadas podem ser importadas em qualquer momento para reconstruir o experimento,
          fazer análises estatísticas em R ou Python, ou compartilhar com colaboradores externos.
        </div>
      </div>
    `;
  }

  // ========== FUNÇÕES DE EXPORTAÇÃO EXCEL ==========

  window.exportMonitoringData = async function() {
    const experiment = window.currentExperiment;
    if (!experiment) {
      alert('Nenhum experimento selecionado');
      return;
    }

    try {
      const { data: monitorings, error: monError } = await s
        .from("monitoring_events")
        .select("id, plot_code, block_number, monitoring_date, notes")
        .eq("experiment_id", experiment.id)
        .order("monitoring_date", { ascending: true });

      if (monError) throw monError;

      if (!monitorings || monitorings.length === 0) {
        alert('Nenhum dado de monitoramento disponível para este experimento');
        return;
      }

      const monitoringIds = monitorings.map(m => m.id);

      const { data: biometrics, error: bioError } = await s
        .from("plant_biometrics")
        .select("*")
        .in("monitoring_event_id", monitoringIds);

      if (bioError) throw bioError;

      const { data: statuses, error: statusError } = await s
        .from("plant_status")
        .select("*")
        .in("monitoring_event_id", monitoringIds);

      if (statusError) throw statusError;

      const exportData = [];
      
     // Buscar hastes usando monitoring_event_id (menos IDs)
      const { data: stemMeasurements } = await s
        .from('plant_stem_measurements')
        .select('*, plant_biometrics!inner(monitoring_event_id)')
        .in('plant_biometrics.monitoring_event_id', monitoringIds);

      const stemsByBiometric = {};
      (stemMeasurements || []).forEach(stem => {
        if (!stemsByBiometric[stem.biometric_id]) {
          stemsByBiometric[stem.biometric_id] = [];
        }
        stemsByBiometric[stem.biometric_id].push(stem);
      });

      monitorings.forEach(mon => {
        const monBiometrics = biometrics.filter(b => b.monitoring_event_id === mon.id);
        const monStatuses = statuses.filter(st => st.monitoring_event_id === mon.id);

        monBiometrics.forEach(bio => {
          const status = monStatuses.find(st => st.plant_position === bio.plant_position);

          // ✅ ORDEM CORRETA:
          // 1º - Buscar hastes
          const stems = stemsByBiometric[bio.id] || [];

          // 2º - Calcular médias
          const avgHeight = stems.length > 0 
            ? (stems.reduce((sum, s) => sum + (s.height_cm || 0), 0) / stems.length).toFixed(2)
            : '';

          const avgDiameter = stems.length > 0
            ? (stems.reduce((sum, s) => sum + (s.diameter_cm || 0), 0) / stems.length).toFixed(2)
            : '';

          // 3º - Adicionar aos dados
          exportData.push({
            'Data': mon.monitoring_date,
            'Bloco': mon.block_number,
            'Tratamento': mon.plot_code,
            'Posição': bio.plant_position,
            'Brotou': bio.has_sprouted ? 'Sim' : 'Não',
            'Folhas expandidas': bio.has_expanded_leaves ? 'Sim' : 'Não',
            'N° Hastes': bio.stem_count || '',
            'Altura Média (cm)': avgHeight,
            'Diâmetro Médio (cm)': avgDiameter,
            'Sanidade (1-5)': bio.sanity_score || '',
            'Obs. sanidade': bio.sanity_observations || '',
            'Status': status ? status.status : 'alive',
            'Observações gerais': mon.notes || ''
          });
        });
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Monitoramento");

      const filename = `${experiment.code}_monitoramento_${new Date().toISOString().slice(0,10)}.xlsx`;
      XLSX.writeFile(workbook, filename);

      alert(`✓ ${exportData.length} registros de monitoramento exportados com sucesso!`);

    } catch (err) {
      console.error('Erro ao exportar monitoramento:', err);
      alert('Erro ao exportar dados de monitoramento');
    }
  };

  window.exportHarvestData = async function() {
    const experiment = window.currentExperiment;
    if (!experiment) {
      alert('Nenhum experimento selecionado');
      return;
    }

    try {
      const { data, error } = await s
        .from("harvest_records")
        .select("*")
        .eq("experiment_id", experiment.id)
        .order("harvest_date", { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        alert('Nenhum dado de colheita disponível para este experimento');
        return;
      }

      const exportData = data.map(h => ({
        'Data da colheita': h.harvest_date,
        'Bloco': h.block_number,
        'Tratamento': h.plot_code,
        'Peso total (kg)': h.total_weight || '',
        'Raízes comerciais (unid)': h.commercial_roots || '',
        'Diâmetro médio (cm)': h.mean_diameter_cm || '',
        'Qualidade (1-5)': h.quality_score || '',
        'Código amostra': h.sample_code || '',
        'Observações': h.notes || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Colheita");

      const filename = `${experiment.code}_colheita_${new Date().toISOString().slice(0,10)}.xlsx`;
      XLSX.writeFile(workbook, filename);

      alert(`✓ ${exportData.length} registros de colheita exportados com sucesso!`);

    } catch (err) {
      console.error('Erro ao exportar colheita:', err);
      alert('Erro ao exportar dados de colheita');
    }
  };

  window.exportDroneData = async function() {
    const experiment = window.currentExperiment;
    if (!experiment) {
      alert('Nenhum experimento selecionado');
      return;
    }

    try {
      const { data, error } = await s
        .from("drone_monitoring")
        .select("*")
        .eq("experiment_id", experiment.id)
        .order("flight_date", { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        alert('Nenhum dado de drone disponível para este experimento');
        return;
      }

      const exportData = data.map(d => ({
        'Data do voo': d.flight_date,
        'Hora': d.flight_time || '',
        'Operador': d.operator_name || '',
        'Bloco': d.block_number || '',
        'Altitude (m)': d.altitude_m || '',
        'Nº imagens': d.image_count || '',
        'Índice cobertura': d.coverage_index || '',
        'NDVI médio': d.ndvi_mean || '',
        'Altura planta (m)': d.plant_height_m || '',
        'Volume copa (m³)': d.canopy_volume_m3 || '',
        'Índice área foliar': d.leaf_area_index || '',
        'Índice margem': d.margin_index || '',
        'Plantas/ha': d.stand_plants_per_ha || '',
        'Score saúde': d.health_score || '',
        'Índice vegetação': d.vegetation_index || '',
        'Sobreposição frontal (%)': d.front_overlap_pct || '',
        'Sobreposição lateral (%)': d.side_overlap_pct || '',
        'Observações': d.notes || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Drone");

      const filename = `${experiment.code}_drone_${new Date().toISOString().slice(0,10)}.xlsx`;
      XLSX.writeFile(workbook, filename);

      alert(`✓ ${exportData.length} registros de drone exportados com sucesso!`);

    } catch (err) {
      console.error('Erro ao exportar drone:', err);
      alert('Erro ao exportar dados de drone');
    }
  };

  window.exportClimateData = async function() {
    try {
      const { data, error } = await s
        .from("climate_daily")
        .select("*")
        .eq("station_code", "PADRAO")
        .order("date", { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        alert('Nenhum dado climático disponível');
        return;
      }

      const exportData = data.map(c => ({
        'Data': c.date,
        'Estação': c.station_code,
        'Precipitação (mm)': c.rain_mm || '',
        'Temp. máxima (°C)': c.tmax_c || '',
        'Temp. mínima (°C)': c.tmin_c || '',
        'Temp. média (°C)': c.tmean_c || '',
        'Umidade relativa (%)': c.rh_mean || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Clima");

      const filename = `clima_${new Date().toISOString().slice(0,10)}.xlsx`;
      XLSX.writeFile(workbook, filename);

      alert(`✓ ${exportData.length} registros climáticos exportados com sucesso!`);

    } catch (err) {
      console.error('Erro ao exportar clima:', err);
      alert('Erro ao exportar dados climáticos');
    }
  };

  window.exportInterventionsData = async function() {
    const experiment = window.currentExperiment;
    if (!experiment) {
      alert('Nenhum experimento selecionado');
      return;
    }

    try {
      const { data, error } = await s
        .from("interventions")
        .select("*")
        .eq("experiment_id", experiment.id)
        .order("intervention_date", { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        alert('Nenhuma intervenção registrada para este experimento');
        return;
      }

      const exportData = data.map(i => ({
        'Data': i.intervention_date,
        'Tipo': i.intervention_type,
        'Bloco': i.block_number || '',
        'Tratamento': i.plot_code || '',
        'Produto': i.product || '',
        'Dosagem': i.dosage || '',
        'Método': i.method || '',
        'Observações': i.notes || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Intervenções");

      const filename = `${experiment.code}_intervencoes_${new Date().toISOString().slice(0,10)}.xlsx`;
      XLSX.writeFile(workbook, filename);

      alert(`✓ ${exportData.length} intervenções exportadas com sucesso!`);

    } catch (err) {
      console.error('Erro ao exportar intervenções:', err);
      alert('Erro ao exportar dados de intervenções');
    }
  };
  
  window.exportTimelineData = async function () {
  const experiment = window.currentExperiment;
  if (!experiment) {
    alert("Nenhum experimento selecionado");
    return;
  }

  try {
    // ✅ scheduled_actions
    const { data: schedule, error: schedError } = await s
      .from('scheduled_actions')
      .select('*')
      .eq('experiment_id', experiment.id)
      .order('start_date', { ascending: true });

    if (schedError) throw schedError;

    // ✅ interventions - TODOS os campos com underscore
    const { data: interventions, error: intError } = await s
      .from('interventions')
      .select('*')
      .eq('experiment_id', experiment.id)
      .order('intervention_date', { ascending: true });

    if (intError) throw intError;

    if ((!schedule || schedule.length === 0) && (!interventions || interventions.length === 0)) {
      alert("Nenhum dado de cronograma ou intervenções disponível");
      return;
    }

    const exportData = [];

    // Cronograma
    (schedule || []).forEach(a => {
      exportData.push({
        Origem: 'Cronograma',
        Data: a.start_date || '',
        'Data início': a.start_date || '',
        'Data fim': a.end_date || '',
        Tipo: a.phase || 'Evento',
        Título: a.name || '',
        Status: a.completed_at ? 'Concluído' : 'Pendente',
        Responsável: a.owner || '',
        Descrição: a.description || ''
      });
    });

    // Intervenções
    (interventions || []).forEach(i => {
      exportData.push({
        Origem: 'Intervenção',
        Data: i.intervention_date || '',
        Tipo: i.intervention_type || '',
        Título: i.intervention_type || '',
        Bloco: i.block_number || '',
        Tratamento: i.plot_code || '',
        Produto: i.product || '',
        Dosagem: i.dosage || '',
        Método: i.method || '',
        Descrição: i.notes || ''
      });
    });

    // Ordenar cronologicamente
    exportData.sort((a, b) => new Date(a.Data) - new Date(b.Data));

    // Excel
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Linha do tempo');

    const today = new Date().toISOString().slice(0, 10);
    const filename = `${experiment.code}_linha_do_tempo_${today}.xlsx`;
    XLSX.writeFile(workbook, filename);

    alert(`${exportData.length} registros da linha do tempo exportados com sucesso!`);
  } catch (err) {
    console.error("Erro linha do tempo:", err);
    alert("Erro: " + err.message);
  }
};

  window.exportAllData = async function() {
  const experiment = window.currentExperiment;
  if (!experiment) {
    alert('Nenhum experimento selecionado');
    return;
  }

  try {
    const workbook = XLSX.utils.book_new();
    let totalSheets = 0;

    // 1. ABA EXPERIMENTO
    const expData = [{
      'Código': experiment.code,
      'Nome': experiment.name,
      'Objetivo': experiment.objective,
      'Pesquisador': experiment.researcher,
      'Colaborador': experiment.collaborator || '',
      'Data plantio': experiment.planting_date,
      'Fazenda': experiment.farm,
      'Município': experiment.municipality,
      'Latitude': experiment.latitude || '',
      'Longitude': experiment.longitude || '',
      'Altitude': experiment.altitude || '',
      'Bioma': experiment.biome,
      'Tipo solo': experiment.soil_type || '',
      'Clima': experiment.climate || '',
      'Sistema cultivo': experiment.cultivation_system,
      'N° blocos': experiment.blocks_count,
      'N° tratamentos': experiment.treatments_count,
      'Área total': experiment.total_area || '',
      'Status': experiment.status
    }];

    const wsExp = XLSX.utils.json_to_sheet(expData);
    XLSX.utils.book_append_sheet(workbook, wsExp, 'Experimento');
    totalSheets++;

    // 2. ABA TRATAMENTOS
    const { data: treatments } = await s
      .from('treatments')
      .select('*')
      .eq('experiment_id', experiment.id)
      .order('code', { ascending: true });

    if (treatments && treatments.length > 0) {
      const treatData = treatments.map(t => ({
        'Código': t.code,
        'Posição': t.position,
        'Descrição': t.description
      }));

      const ws = XLSX.utils.json_to_sheet(treatData);
      XLSX.utils.book_append_sheet(workbook, ws, 'Tratamentos');
      totalSheets++;
    }

    // 3. ABA CRONOGRAMA
    const { data: schedule } = await s
      .from('scheduled_actions')
      .select('*')
      .eq('experiment_id', experiment.id)
      .order('start_date', { ascending: true });

    if (schedule && schedule.length > 0) {
      const schedData = schedule.map(a => ({
        'Nome': a.name,
        'Fase': a.phase,
        'Data início': a.start_date || '',
        'Data fim': a.end_date || '',
        'Concluído em': a.completed_at || '',
        'Responsável': a.owner || '',
        'Descrição': a.description
      }));

      const ws = XLSX.utils.json_to_sheet(schedData);
      XLSX.utils.book_append_sheet(workbook, ws, 'Cronograma');
      totalSheets++;
    }

    // 4. ABA MONITORAMENTO (COM HASTES)
    const { data: monitorings } = await s
      .from('monitoring_events')
      .select('id, plot_code, block_number, monitoring_date, notes')
      .eq('experiment_id', experiment.id)
      .order('monitoring_date', { ascending: true });

    if (monitorings && monitorings.length > 0) {
      const monitoringIds = monitorings.map(m => m.id);

      const { data: biometrics } = await s
        .from('plant_biometrics')
        .select('*')
        .in('monitoring_event_id', monitoringIds);

      const { data: statuses } = await s
        .from('plant_status')
        .select('*')
        .in('monitoring_event_id', monitoringIds);

      const { data: stemMeasurements } = await s
        .from('plant_stem_measurements')
        .select('*, plant_biometrics!inner(monitoring_event_id)')
        .in('plant_biometrics.monitoring_event_id', monitoringIds);

      const stemsByBiometric = {};
      (stemMeasurements || []).forEach(stem => {
        if (!stemsByBiometric[stem.biometric_id]) {
          stemsByBiometric[stem.biometric_id] = [];
        }
        stemsByBiometric[stem.biometric_id].push(stem);
      });

      const monData = [];

      monitorings.forEach(mon => {
        const monBio = biometrics.filter(b => b.monitoring_event_id === mon.id);

        monBio.forEach(bio => {
          const status = statuses.find(st => 
            st.monitoring_event_id === mon.id && 
            st.plant_position === bio.plant_position
          );

          const stems = stemsByBiometric[bio.id] || [];

          const avgHeight = stems.length > 0
            ? (stems.reduce((sum, s) => sum + (s.height_cm || 0), 0) / stems.length).toFixed(2)
            : '';

          const avgDiameter = stems.length > 0
            ? (stems.reduce((sum, s) => sum + (s.diameter_cm || 0), 0) / stems.length).toFixed(2)
            : '';

          monData.push({
            'Data': mon.monitoring_date,
            'Bloco': mon.block_number,
            'Tratamento': mon.plot_code,
            'Posição': bio.plant_position,
            'Brotou': bio.has_sprouted ? 'Sim' : 'Não',
            'N° Hastes': bio.stem_count || '',
            'Altura Méd. (cm)': avgHeight,
            'Diâm. Méd. (cm)': avgDiameter,
            'Sanidade': bio.sanity_score || '',
            'Status': status ? status.status : 'alive'
          });
        });
      });

      if (monData.length > 0) {
        const ws = XLSX.utils.json_to_sheet(monData);
        XLSX.utils.book_append_sheet(workbook, ws, 'Monitoramento');
        totalSheets++;
      }
    }

    // 5. ABA COLHEITA
    const { data: harvest } = await s
      .from('harvest_records')
      .select('*')
      .eq('experiment_id', experiment.id)
      .order('harvest_date', { ascending: true });

    if (harvest && harvest.length > 0) {
      const harvestData = harvest.map(h => ({
        'Data': h.harvest_date,
        'Bloco': h.block_number,
        'Tratamento': h.plot_code,
        'Peso total (kg)': h.total_weight || '',
        'Raízes comerciais': h.commercial_roots || '',
        'Diâmetro médio (cm)': h.mean_diameter_cm || '',
        'Qualidade': h.quality_score || '',
        'Código amostra': h.sample_code || ''
      }));

      const ws = XLSX.utils.json_to_sheet(harvestData);
      XLSX.utils.book_append_sheet(workbook, ws, 'Colheita');
      totalSheets++;
    }

    // 6. ABA DRONE
    const { data: drone } = await s
      .from('drone_monitoring')
      .select('*')
      .eq('experiment_id', experiment.id)
      .order('flight_date', { ascending: true });

    if (drone && drone.length > 0) {
      const droneData = drone.map(d => ({
        'Data': d.flight_date,
        'Bloco': d.block_number || '',
        'Operador': d.operator_name || '',
        'Altitude (m)': d.altitude_m || '',
        'NDVI médio': d.ndvi_mean || '',
        'Altura planta (m)': d.plant_height_m || '',
        'IAF': d.leaf_area_index || '',
        'Plantas/ha': d.stand_plants_per_ha || ''
      }));

      const ws = XLSX.utils.json_to_sheet(droneData);
      XLSX.utils.book_append_sheet(workbook, ws, 'Drone');
      totalSheets++;
    }

    // 7. ABA CLIMA
    const { data: climate } = await s
      .from('climate_daily')
      .select('*')
      .eq('station_code', 'PADRAO')
      .order('date', { ascending: true });

    if (climate && climate.length > 0) {
      const climateData = climate.map(c => ({
        'Data': c.date,
        'Chuva (mm)': c.rain_mm || '',
        'Temp. máx (°C)': c.tmax_c || '',
        'Temp. mín (°C)': c.tmin_c || '',
        'Temp. média (°C)': c.tmean_c || '',
        'Umidade (%)': c.rh_mean || ''
      }));

      const ws = XLSX.utils.json_to_sheet(climateData);
      XLSX.utils.book_append_sheet(workbook, ws, 'Clima');
      totalSheets++;
    }

    // 8. ABA INTERVENÇÕES
    const { data: interventions } = await s
      .from('interventions')
      .select('*')
      .eq('experiment_id', experiment.id)
      .order('intervention_date', { ascending: true });

    if (interventions && interventions.length > 0) {
      const intData = interventions.map(i => ({
        'Data': i.intervention_date,
        'Tipo': i.intervention_type,
        'Bloco': i.block_number || '',
        'Tratamento': i.plot_code || '',
        'Produto': i.product || '',
        'Dosagem': i.dosage || '',
        'Método': i.method || ''
      }));

      const ws = XLSX.utils.json_to_sheet(intData);
      XLSX.utils.book_append_sheet(workbook, ws, 'Intervenções');
      totalSheets++;
    }
    
    // 9. ABA LINHA DO TEMPO (NOVA)
    const { data: timelineSchedule } = await s
      .from('scheduled_actions')
      .select('*')
      .eq('experiment_id', experiment.id)
      .order('start_date', { ascending: true });

    const { data: timelineInterventions } = await s
      .from('interventions')
      .select('*')
      .eq('experiment_id', experiment.id)
      .order('intervention_date', { ascending: true });

    const timelineData = [];

    // Cronograma
    (timelineSchedule || []).forEach(a => {
      timelineData.push({
        Origem: 'Cronograma',
        Data: a.start_date,
        Tipo: a.phase || 'Evento',
        Título: a.name,
        'Data início': a.start_date,
        'Data fim': a.end_date,
        Status: a.completed_at ? 'Concluído' : 'Pendente',
        Responsável: a.owner
      });
    });

    // Intervenções
    (timelineInterventions || []).forEach(i => {
      timelineData.push({
        Origem: 'Intervenção',
        Data: i.intervention_date,
        Tipo: i.intervention_type,
        Bloco: i.block_number,
        Tratamento: i.plot_code,
        Produto: i.product,
        Dosagem: i.dosage
      });
    });

    // Ordenar
    timelineData.sort((a, b) => new Date(a.Data) - new Date(b.Data));

    if (timelineData.length > 0) {
      const wsTimeline = XLSX.utils.json_to_sheet(timelineData);
      XLSX.utils.book_append_sheet(workbook, wsTimeline, 'Linha do tempo');
      totalSheets++;
      console.log(`${timelineData.length} registros linha do tempo`);
    }

    // 10. GERAR ARQUIVO
    var today = new Date().toISOString().slice(0, 10);
    var filename = experiment.code + '_COMPLETO_' + today + '.xlsx';
    XLSX.writeFile(workbook, filename);

    alert('Exportação completa! ' + totalSheets + ' abas geradas com todos os dados do experimento.');

  } catch(err) {
    console.error('Erro ao exportar dados consolidados:', err);
    alert('Erro ao exportar dados consolidados: ' + err.message);
  }
};

  // ========== GERAÇÃO DE RELATÓRIO EM PDF ==========

  window.generatePDFReport = async function() {
    const experiment = window.currentExperiment;
    if (!experiment) {
      alert('Nenhum experimento selecionado');
      return;
    }

    try {
      // Mostrar loading
      const button = event.target;
      const originalText = button.textContent;
      button.textContent = '⏳ Gerando PDF...';
      button.disabled = true;

      // Buscar dados
      const { data: monitorings } = await s
        .from("monitoring_events")
        .select("id, plot_code, block_number, monitoring_date, notes")
        .eq("experiment_id", experiment.id)
        .order("monitoring_date", { ascending: true });

      const monitoringIds = monitorings ? monitorings.map(m => m.id) : [];

      const { data: biometrics } = monitoringIds.length > 0 ? await s
        .from("plant_biometrics")
        .select("*")
        .in("monitoring_event_id", monitoringIds) : { data: [] };

      const { data: harvest } = await s
        .from("harvest_records")
        .select("*")
        .eq("experiment_id", experiment.id)
        .order("harvest_date", { ascending: true });

      const { data: climate } = await s
        .from("climate_daily")
        .select("*")
        .eq("station_code", "PADRAO")
        .order("date", { ascending: true });

      const { data: interventions } = await s
        .from("interventions")
        .select("*")
        .eq("experiment_id", experiment.id)
        .order("intervention_date", { ascending: true });

      const { data: schedule } = await s
        .from("scheduled_actions")
        .select("*")
        .eq("experiment_id", experiment.id)
        .order("start_date", { ascending: true });

      // Gerar HTML do relatório
      const html = generatePDFHtml(experiment, monitorings, biometrics, harvest, climate, interventions, schedule);

      // Criar PDF
      const opt = {
        margin: [12, 10, 12, 10],       // top, right, bottom, left
        filename: `${experiment.code}_relatorio_${new Date().toISOString().slice(0,10)}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 1.5, useCORS: true, logging: false },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
      }

      html2pdf().set(opt).from(html).save();

      // Restaurar botão
      button.textContent = originalText;
      button.disabled = false;

      alert('✓ Relatório PDF gerado com sucesso!');

    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      button.textContent = originalText;
      button.disabled = false;
      alert('Erro ao gerar relatório PDF: ' + err.message);
    }
  };

  function generatePDFHtml(experiment, monitorings, biometrics, harvest, climate, interventions, schedule) {
    const dataAtual = new Date().toLocaleDateString('pt-BR');

    // Calcula estatísticas de monitoramento
    const statsMonit = biometrics && biometrics.length > 0 ? {
      mediaAltura: (biometrics.reduce((sum, b) => sum + (b.height_cm || 0), 0) / biometrics.length).toFixed(2),
      mediaSanidade: (biometrics.reduce((sum, b) => sum + (b.sanity_score || 0), 0) / biometrics.length).toFixed(2),
      totalMedicoes: biometrics.length
    } : { mediaAltura: 0, mediaSanidade: 0, totalMedicoes: 0 };

    // Calcula estatísticas de colheita
    const statsColheita = harvest && harvest.length > 0 ? {
      pesoTotal: harvest.reduce((sum, h) => sum + (h.total_weight || 0), 0).toFixed(2),
      pesoMedio: (harvest.reduce((sum, h) => sum + (h.total_weight || 0), 0) / harvest.length).toFixed(2),
      qualidadeMedia: (harvest.reduce((sum, h) => sum + (h.quality_score || 0), 0) / harvest.length).toFixed(2),
      totalRegistros: harvest.length
    } : { pesoTotal: 0, pesoMedio: 0, qualidadeMedia: 0, totalRegistros: 0 };

    // Calcula estatísticas climáticas
    const statsClima = climate && climate.length > 0 ? {
      chuvaTotal: climate.reduce((sum, c) => sum + (c.rain_mm || 0), 0).toFixed(2),
      tempMedia: (climate.reduce((sum, c) => sum + (c.tmean_c || 0), 0) / climate.length).toFixed(2),
      dias: climate.length
    } : { chuvaTotal: 0, tempMedia: 0, dias: 0 };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, sans-serif; line-height: 1.5; color: #333; }
          
          .page-break { 
            display: block; 
            height: 1px; 
            page-break-after: always; 
          }
          
          .page-break { page-break-after: always; margin-bottom: 0; padding-bottom: 0; }
          
          .capa {
            padding: 40px 30px;
            text-align: center;
            min-height: 240mm;
            display: flex;
            flex-direction: column;
            justify-content: center;
            border-top: 3px solid #065f46;
            border-bottom: 3px solid #065f46;
          }
          
          .capa h1 { font-size: 36px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px; color: #065f46; }
          .capa h2 { font-size: 24px; margin-bottom: 30px; font-weight: 400; color: #333; }
          .capa .info { font-size: 13px; margin-top: 40px; line-height: 2.2; color: #555; }
          .capa .periodo { margin-top: 30px; font-size: 12px; color: #888; font-style: italic; }
          .capa .data { margin-top: 60px; font-size: 11px; color: #999; }
          
          .header {
            border-top: 2px solid #065f46;
            border-bottom: 2px solid #065f46;
            padding: 12px 0;
            margin-bottom: 20px;
            margin-top: 0;
          }
          
          .header h1 { font-size: 20px; color: #065f46; margin-bottom: 3px; font-weight: 600; }
          .header p { font-size: 11px; color: #777; margin: 0; }
          
          .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
            padding: 0;
          }
          
          .section h2 {
            font-size: 15px;
            color: #065f46;
            margin: 20px 0 10px 0;
            border-left: 3px solid #065f46;
            padding-left: 8px;
            font-weight: 600;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 15px;
          }
          
          .info-box {
            border: 1px solid #d1d5db;
            padding: 10px;
            border-radius: 4px;
            font-size: 12px;
            background: #ffffff;
          }
          
          .info-box strong { color: #065f46; display: block; margin-bottom: 3px; font-size: 11px; }
          
          .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 10px;
            margin-bottom: 15px;
            page-break-inside: avoid;  /* ← NOVO */
            break-inside: avoid;        /* ← NOVO (browsers modernos) */
          }

          .stat-card {
            border-top: 2px solid #065f46;
            border-bottom: 1px solid #e5e7eb;
            padding: 12px;
            border-radius: 0;
            background: #ffffff;
            page-break-inside: avoid;  /* ← NOVO */
            break-inside: avoid;        /* ← NOVO */
          }
          
          .stat-card .value {
            font-size: 18px;
            font-weight: bold;
            color: #065f46;
          }
          
          .stat-card .label {
            font-size: 11px;
            color: #777;
            margin-top: 3px;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            font-size: 10px;
            page-break-inside: avoid;
          }
          
          table th {
            background: #ffffff;
            border-bottom: 2px solid #065f46;
            color: #065f46;
            padding: 6px;
            text-align: left;
            font-weight: 600;
            font-size: 10px;
          }
          
          table td {
            padding: 6px;
            border-bottom: 1px solid #e5e7eb;
          }
          
          table tr:nth-child(even) { background: #f9fafb; }
          
          .layout-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
            gap: 4px;
            margin-bottom: 15px;
          }
          
          .layout-cell {
            aspect-ratio: 1;
            border: 1px solid #065f46;
            padding: 4px;
            font-size: 8px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            background: #ffffff;
            overflow: hidden;
          }
          
          .layout-cell strong { color: #065f46; font-size: 9px; }
          
          .nota {
            border-left: 3px solid #065f46;
            padding: 10px;
            margin: 15px 0;
            background: #ffffff;
            font-size: 12px;
            line-height: 1.6;
          }
          
          .footer {
            text-align: center;
            font-size: 9px;
            color: #999;
            margin-top: 15px;
            padding-top: 10px;
            border-top: 1px solid #e5e7eb;
            page-break-inside: avoid;
          }
        </style>
      </head>
      <body>
        <!-- CAPA SIMPLES -->
        <div class="capa">
          <h1>RELATÓRIO EXPERIMENTAL</h1>
          <h2>${escapeHtml(experiment.name)}</h2>
          <div class="info">
            <div><strong>Código:</strong> ${escapeHtml(experiment.code)}</div>
            <div><strong>Pesquisador:</strong> ${escapeHtml(experiment.researcher)}</div>
            <div><strong>Fazenda:</strong> ${escapeHtml(experiment.farm)}</div>
            <div><strong>Município:</strong> ${escapeHtml(experiment.municipality)}</div>
          </div>
          ${experiment.planting_date ? `
            <div class="periodo">
              Período: ${new Date(experiment.planting_date).toLocaleDateString('pt-BR')} até hoje
            </div>
          ` : ''}
          <div class="data">Gerado em ${dataAtual}</div>
        </div>

        <!-- PÁGINA 2: INFORMAÇÕES GERAIS E OBJETIVO -->
        <div class="page-break"></div>
        <div class="section">
          <div style="page-break-inside: avoid; break-inside: avoid;">
            <div class="header">
            <h1>INFORMAÇÕES GERAIS</h1>
            <p>Descrição do campo e caracterização</p>
          </div>

          <div class="info-grid">
            <div class="info-box">
              <strong>Código</strong>
              ${escapeHtml(experiment.code)}
            </div>
            <div class="info-box">
              <strong>Nome</strong>
              ${escapeHtml(experiment.name)}
            </div>
            <div class="info-box">
              <strong>Data de Plantio</strong>
              ${new Date(experiment.planting_date).toLocaleDateString('pt-BR')}
            </div>
            <div class="info-box">
              <strong>Pesquisador</strong>
              ${escapeHtml(experiment.researcher)}
            </div>
            <div class="info-box">
              <strong>Fazenda</strong>
              ${escapeHtml(experiment.farm)}
            </div>
            <div class="info-box">
              <strong>Município</strong>
              ${escapeHtml(experiment.municipality)}
            </div>
            <div class="info-box">
              <strong>Bioma</strong>
              ${escapeHtml(experiment.biome || 'Não informado')}
            </div>
            <div class="info-box">
              <strong>Tipo de Solo</strong>
              ${escapeHtml(experiment.soil_type || 'Não informado')}
            </div>
          </div>

          <h2>Objetivo do Experimento</h2>
          <div class="nota">
            ${escapeHtml(experiment.objective)}
          </div>

          <h2>Configuração Experimental</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="value">${experiment.blocks_count}</div>
              <div class="label">Blocos</div>
            </div>
            <div class="stat-card">
              <div class="value">${experiment.treatments_count}</div>
              <div class="label">Tratamentos</div>
            </div>
            <div class="stat-card">
              <div class="value">${experiment.plots_per_block || '-'}</div>
              <div class="label">Parcelas/Bloco</div>
            </div>
          </div>
        </div>

        <!-- PÁGINA 3: LAYOUT EXPERIMENTAL -->
        <div class="page-break"></div>
        <div class="section">
          <div style="page-break-inside: avoid; break-inside: avoid;">
            <div class="header">
            <h1>LAYOUT EXPERIMENTAL</h1>
            <p>Mapa visual dos blocos e tratamentos</p>
          </div>

          ${schedule && schedule.length > 0 ? `
            <h2>Cronograma de Eventos</h2>
            <table>
              <thead>
                <tr>
                  <th>Evento</th>
                  <th>Fase</th>
                  <th>Data Início</th>
                  <th>Data Fim</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${schedule.map(s => `
                  <tr>
                    <td>${escapeHtml(s.name)}</td>
                    <td>${escapeHtml(s.phase || '-')}</td>
                    <td>${s.start_date ? new Date(s.start_date).toLocaleDateString('pt-BR') : '-'}</td>
                    <td>${s.end_date ? new Date(s.end_date).toLocaleDateString('pt-BR') : '-'}</td>
                    <td>${s.completed_at ? '✓ Concluído' : '● Pendente'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<p style="color: #999; font-size: 12px;">Nenhum cronograma registrado.</p>'}
        </div>

        <!-- PÁGINA 4: MONITORAMENTO -->
        ${monitorings && monitorings.length > 0 ? `
        <div class="page-break"></div>
        <div class="section">
          <div style="page-break-inside: avoid; break-inside: avoid;">
            <div class="header">
            <h1>DESEMPENHO - MONITORAMENTO</h1>
            <p>Biometria das plantas ao longo das avaliações</p>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="value">${statsMonit.mediaAltura}</div>
              <div class="label">Altura Média (cm)</div>
            </div>
            <div class="stat-card">
              <div class="value">${statsMonit.mediaSanidade}</div>
              <div class="label">Sanidade Média (1-5)</div>
            </div>
            <div class="stat-card">
              <div class="value">${statsMonit.totalMedicoes}</div>
              <div class="label">Total de Medições</div>
            </div>
          </div>

          <h2>Avaliações Realizadas</h2>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Bloco</th>
                <th>Trat.</th>
                <th>Alt. Média (cm)</th>
                <th>Sanidade</th>
              </tr>
            </thead>
            <tbody>
              ${monitorings.slice(-15).map(m => {
                const bioMon = biometrics.filter(b => b.monitoring_event_id === m.id);
                const altMedia = bioMon.length > 0 ? (bioMon.reduce((sum, b) => sum + (b.height_cm || 0), 0) / bioMon.length).toFixed(1) : 0;
                const sanMedia = bioMon.length > 0 ? (bioMon.reduce((sum, b) => sum + (b.sanity_score || 0), 0) / bioMon.length).toFixed(1) : 0;
                return `
                  <tr>
                    <td>${new Date(m.monitoring_date).toLocaleDateString('pt-BR')}</td>
                    <td>${m.block_number}</td>
                    <td>${escapeHtml(m.plot_code)}</td>
                    <td>${altMedia}</td>
                    <td>${sanMedia}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <!-- PÁGINA 5: COLHEITA -->
        ${harvest && harvest.length > 0 ? `
        <div class="page-break"></div>
        <div class="section">
          <div style="page-break-inside: avoid; break-inside: avoid;">
            <div class="header">
            <h1>DESEMPENHO - COLHEITA</h1>
            <p>Produção e qualidade dos produtos colhidos</p>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="value">${statsColheita.pesoTotal}</div>
              <div class="label">Peso Total (kg)</div>
            </div>
            <div class="stat-card">
              <div class="value">${statsColheita.pesoMedio}</div>
              <div class="label">Peso Médio (kg)</div>
            </div>
            <div class="stat-card">
              <div class="value">${statsColheita.qualidadeMedia}</div>
              <div class="label">Qualidade Média (1-5)</div>
            </div>
          </div>

          <h2>Registros de Colheita</h2>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Bl.</th>
                <th>Trat.</th>
                <th>Peso (kg)</th>
                <th>Raízes</th>
                <th>Qualid.</th>
              </tr>
            </thead>
            <tbody>
              ${harvest.map(h => `
                <tr>
                  <td>${new Date(h.harvest_date).toLocaleDateString('pt-BR')}</td>
                  <td>${h.block_number}</td>
                  <td>${escapeHtml(h.plot_code)}</td>
                  <td>${(h.total_weight || 0).toFixed(2)}</td>
                  <td>${h.commercial_roots || '-'}</td>
                  <td>${h.quality_score || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <!-- PÁGINA 6: INTERVENÇÕES -->
        ${interventions && interventions.length > 0 ? `
        <div class="page-break"></div>
        <div class="section">
          <div style="page-break-inside: avoid; break-inside: avoid;">
            <div class="header">
            <h1>HISTÓRICO DE INTERVENÇÕES</h1>
            <p>Adubação, controle fitossanitário e irrigação</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Bl.</th>
                <th>Trat.</th>
                <th>Produto</th>
                <th>Dosagem</th>
                <th>Método</th>
              </tr>
            </thead>
            <tbody>
              ${interventions.map(i => `
                <tr>
                  <td>${new Date(i.intervention_date).toLocaleDateString('pt-BR')}</td>
                  <td>${escapeHtml(i.intervention_type)}</td>
                  <td>${i.block_number || '-'}</td>
                  <td>${escapeHtml(i.plot_code || '-')}</td>
                  <td>${escapeHtml(i.product || '-')}</td>
                  <td>${escapeHtml(i.dosage || '-')}</td>
                  <td>${escapeHtml(i.method || '-')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <!-- PÁGINA 7: CLIMA -->
        ${climate && climate.length > 0 ? `
        <div class="page-break"></div>
        <div class="section">
          <div style="page-break-inside: avoid; break-inside: avoid;">
            <div class="header">
            <h1>DADOS CLIMÁTICOS INTEGRADOS</h1>
            <p>Condições meteorológicas durante o experimento</p>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="value">${statsClima.chuvaTotal}</div>
              <div class="label">Chuva Total (mm)</div>
            </div>
            <div class="stat-card">
              <div class="value">${statsClima.tempMedia}</div>
              <div class="label">Temperatura Média (°C)</div>
            </div>
            <div class="stat-card">
              <div class="value">${statsClima.dias}</div>
              <div class="label">Dias Registrados</div>
            </div>
          </div>

          <h2>Registros Climáticos</h2>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Chuva (mm)</th>
                <th>T. Máx (°C)</th>
                <th>T. Mín (°C)</th>
                <th>T. Média (°C)</th>
                <th>UR (%)</th>
              </tr>
            </thead>
            <tbody>
              ${climate.slice(-20).map(c => `
                <tr>
                  <td>${c.date}</td>
                  <td>${(c.rain_mm || 0).toFixed(1)}</td>
                  <td>${c.tmax_c ? c.tmax_c.toFixed(1) : '-'}</td>
                  <td>${c.tmin_c ? c.tmin_c.toFixed(1) : '-'}</td>
                  <td>${c.tmean_c ? c.tmean_c.toFixed(1) : '-'}</td>
                  <td>${c.rh_mean ? c.rh_mean.toFixed(1) : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <!-- PÁGINA 8: CONCLUSÕES E RECOMENDAÇÕES -->
        <div class="page-break"></div>
        <div class="section">
          <div style="page-break-inside: avoid; break-inside: avoid;">
            <div class="header">
            <h1>CONCLUSÕES E RECOMENDAÇÕES</h1>
            <p>Análise consolidada do experimento</p>
          </div>

          <h2>Resumo Executivo</h2>
          <div class="nota">
            Este relatório consolida os dados coletados no experimento <strong>${escapeHtml(experiment.code)}</strong>, 
            conduzido em ${escapeHtml(experiment.farm)} sob a responsabilidade do pesquisador 
            <strong>${escapeHtml(experiment.researcher)}</strong>. O experimento foi iniciado em 
            ${new Date(experiment.planting_date).toLocaleDateString('pt-BR')} e engloba 
            ${experiment.blocks_count} blocos com ${experiment.treatments_count} tratamentos cada um.
          </div>

          <h2>Resultados Principais</h2>
          <ul style="font-size: 12px; line-height: 1.7; margin-left: 15px;">
            ${biometrics && biometrics.length > 0 ? `<li><strong>Monitoramento:</strong> ${statsMonit.totalMedicoes} medições com altura média de ${statsMonit.mediaAltura} cm e sanidade média de ${statsMonit.mediaSanidade}/5.</li>` : ''}
            ${harvest && harvest.length > 0 ? `<li><strong>Colheita:</strong> ${statsColheita.totalRegistros} registros com produção total de ${statsColheita.pesoTotal} kg e qualidade média de ${statsColheita.qualidadeMedia}/5.</li>` : ''}
            ${climate && climate.length > 0 ? `<li><strong>Clima:</strong> ${statsClima.dias} dias monitorados com precipitação total de ${statsClima.chuvaTotal} mm e temperatura média de ${statsClima.tempMedia}°C.</li>` : ''}
            ${interventions && interventions.length > 0 ? `<li><strong>Intervenções:</strong> ${interventions.length} operações registradas durante o ciclo do experimento.</li>` : ''}
          </ul>

          <h2 style="margin-top: 15px;">Próximas Etapas</h2>
          <div class="nota">
            Recomenda-se a continuação do monitoramento periódico, análise estatística dos dados coletados 
            e documentação complementar dos fatores externos que possam ter influenciado os resultados obtidos.
          </div>

          <div class="footer">
            <p>Relatório gerado automaticamente pelo Sistema de Monitoramento Experimental</p>
            <p>Data: ${dataAtual}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

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
