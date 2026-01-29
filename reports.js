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
            <div style="font-size:13px; color:#374151;">
              <strong>Conteúdo do relatório:</strong>
            </div>

            <ul style="font-size:12px; color:#4b5563; padding-left:18px; margin:0;">
              <li>Capa com código, nome e período do experimento.</li>
              <li>Resumo executivo (objetivos, principais resultados).</li>
              <li>Descrição do campo (localização, solo, clima local).</li>
              <li>Layout experimental (mapa visual dos blocos e tratamentos).</li>
              <li>Cronograma de eventos (plantio, avaliações, colheita).</li>
              <li>Descrição dos tratamentos (formulações, doses, datas de aplicação).</li>
              <li>Tabelas e gráficos de desempenho (altura, sanidade, produção).</li>
              <li>Dados climáticos integrados (chuva, temperatura, variabilidade).</li>
              <li>Conclusões e recomendações.</li>
              <li>Histórico de intervenções (adubação, controle, irrigação).</li>
            </ul>

            <div style="margin-top:8px;">
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

      monitorings.forEach(mon => {
        const monBiometrics = biometrics.filter(b => b.monitoring_event_id === mon.id);
        const monStatuses = statuses.filter(st => st.monitoring_event_id === mon.id);

        monBiometrics.forEach(bio => {
          const status = monStatuses.find(st => st.plant_position === bio.plant_position);

          exportData.push({
            'Data': mon.monitoring_date,
            'Bloco': mon.block_number,
            'Tratamento': mon.plot_code,
            'Posição': bio.plant_position,
            'Brotou': bio.has_sprouted ? 'Sim' : 'Não',
            'Folhas expandidas': bio.has_expanded_leaves ? 'Sim' : 'Não',
            'Altura (cm)': bio.height_cm || '',
            'Contagem de hastes': bio.stem_count || '',
            'Diâmetro 1 (cm)': bio.stem_diameter_1_cm || '',
            'Diâmetro 2 (cm)': bio.stem_diameter_2_cm || '',
            'Diâmetro 3 (cm)': bio.stem_diameter_3_cm || '',
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

  window.exportAllData = async function() {
    const experiment = window.currentExperiment;
    if (!experiment) {
      alert('Nenhum experimento selecionado');
      return;
    }

    try {
      const workbook = XLSX.utils.book_new();
      let totalSheets = 0;

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
        'Nº blocos': experiment.blocks_count,
        'Nº tratamentos': experiment.treatments_count,
        'Área total': experiment.total_area || '',
        'Status': experiment.status
      }];
      const wsExp = XLSX.utils.json_to_sheet(expData);
      XLSX.utils.book_append_sheet(workbook, wsExp, "Experimento");
      totalSheets++;

      const { data: treatments } = await s
        .from("treatments")
        .select("*")
        .eq("experiment_id", experiment.id)
        .order("code", { ascending: true });

      if (treatments && treatments.length > 0) {
        const treatData = treatments.map(t => ({
          'Código': t.code,
          'Posição': t.position,
          'Descrição': t.description || ''
        }));
        const ws = XLSX.utils.json_to_sheet(treatData);
        XLSX.utils.book_append_sheet(workbook, ws, "Tratamentos");
        totalSheets++;
      }

      const { data: schedule } = await s
        .from("scheduled_actions")
        .select("*")
        .eq("experiment_id", experiment.id)
        .order("start_date", { ascending: true });

      if (schedule && schedule.length > 0) {
        const schedData = schedule.map(a => ({
          'Nome': a.name,
          'Fase': a.phase,
          'Data início': a.start_date || '',
          'Data fim': a.end_date || '',
          'Concluído em': a.completed_at || '',
          'Responsável': a.owner || '',
          'Descrição': a.description || ''
        }));
        const ws = XLSX.utils.json_to_sheet(schedData);
        XLSX.utils.book_append_sheet(workbook, ws, "Cronograma");
        totalSheets++;
      }

      const { data: monitorings } = await s
        .from("monitoring_events")
        .select("id, plot_code, block_number, monitoring_date, notes")
        .eq("experiment_id", experiment.id)
        .order("monitoring_date", { ascending: true });

      if (monitorings && monitorings.length > 0) {
        const monitoringIds = monitorings.map(m => m.id);
        const { data: biometrics } = await s
          .from("plant_biometrics")
          .select("*")
          .in("monitoring_event_id", monitoringIds);

        const { data: statuses } = await s
          .from("plant_status")
          .select("*")
          .in("monitoring_event_id", monitoringIds);

        const monData = [];
        monitorings.forEach(mon => {
          const monBio = biometrics.filter(b => b.monitoring_event_id === mon.id);
          monBio.forEach(bio => {
            const status = statuses.find(st => st.monitoring_event_id === mon.id && st.plant_position === bio.plant_position);
            monData.push({
              'Data': mon.monitoring_date,
              'Bloco': mon.block_number,
              'Tratamento': mon.plot_code,
              'Posição': bio.plant_position,
              'Brotou': bio.has_sprouted ? 'Sim' : 'Não',
              'Altura (cm)': bio.height_cm || '',
              'Hastes': bio.stem_count || '',
              'Diâm. 1': bio.stem_diameter_1_cm || '',
              'Diâm. 2': bio.stem_diameter_2_cm || '',
              'Diâm. 3': bio.stem_diameter_3_cm || '',
              'Sanidade': bio.sanity_score || '',
              'Status': status ? status.status : 'alive'
            });
          });
        });

        if (monData.length > 0) {
          const ws = XLSX.utils.json_to_sheet(monData);
          XLSX.utils.book_append_sheet(workbook, ws, "Monitoramento");
          totalSheets++;
        }
      }

      const { data: harvest } = await s
        .from("harvest_records")
        .select("*")
        .eq("experiment_id", experiment.id)
        .order("harvest_date", { ascending: true });

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
        XLSX.utils.book_append_sheet(workbook, ws, "Colheita");
        totalSheets++;
      }

      const { data: drone } = await s
        .from("drone_monitoring")
        .select("*")
        .eq("experiment_id", experiment.id)
        .order("flight_date", { ascending: true });

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
        XLSX.utils.book_append_sheet(workbook, ws, "Drone");
        totalSheets++;
      }

      const { data: climate } = await s
        .from("climate_daily")
        .select("*")
        .eq("station_code", "PADRAO")
        .order("date", { ascending: true });

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
        XLSX.utils.book_append_sheet(workbook, ws, "Clima");
        totalSheets++;
      }

      const { data: interventions } = await s
        .from("interventions")
        .select("*")
        .eq("experiment_id", experiment.id)
        .order("intervention_date", { ascending: true });

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
        XLSX.utils.book_append_sheet(workbook, ws, "Intervenções");
        totalSheets++;
      }

      const filename = `${experiment.code}_COMPLETO_${new Date().toISOString().slice(0,10)}.xlsx`;
      XLSX.writeFile(workbook, filename);

      alert(`✓ Exportação completa!\n\n${totalSheets} abas geradas com todos os dados do experimento.`);

    } catch (err) {
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
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = '⏳ Gerando PDF...';
    button.disabled = true;

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

    const html = generatePDFHtml(experiment, monitorings, biometrics, harvest, climate, interventions, schedule);

    const opt = {
      margin: [15, 15, 18, 15], // top, left, bottom, right (mm)
      filename: `${experiment.code}_relatorio_${new Date().toISOString().slice(0,10)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
      pagebreak: { mode: ['css'] }
    };

    html2pdf().set(opt).from(html).save();

    button.textContent = originalText;
    button.disabled = false;

    alert('✓ Relatório PDF gerado com sucesso!');
  } catch (err) {
    console.error('Erro ao gerar PDF:', err);
    if (event && event.target) {
      const button = event.target;
      button.textContent = '📥 Gerar relatório em PDF';
      button.disabled = false;
    }
    alert('Erro ao gerar relatório PDF: ' + err.message);
  }
};

function generatePDFHtml(experiment, monitorings, biometrics, harvest, climate, interventions, schedule) {
  const dataAtual = new Date().toLocaleDateString('pt-BR');

  const statsMonit = biometrics && biometrics.length > 0 ? {
    mediaAltura: (biometrics.reduce((sum, b) => sum + (b.height_cm || 0), 0) / biometrics.length).toFixed(1),
    mediaSanidade: (biometrics.reduce((sum, b) => sum + (b.sanity_score || 0), 0) / biometrics.length).toFixed(1),
    totalMedicoes: biometrics.length
  } : { mediaAltura: "–", mediaSanidade: "–", totalMedicoes: 0 };

  const statsColheita = harvest && harvest.length > 0 ? {
    pesoTotal: harvest.reduce((sum, h) => sum + (h.total_weight || 0), 0).toFixed(1),
    pesoMedio: (harvest.reduce((sum, h) => sum + (h.total_weight || 0), 0) / harvest.length).toFixed(1),
    qualidadeMedia: (harvest.reduce((sum, h) => sum + (h.quality_score || 0), 0) / harvest.length).toFixed(1),
    totalRegistros: harvest.length
  } : { pesoTotal: "–", pesoMedio: "–", qualidadeMedia: "–", totalRegistros: 0 };

  const statsClima = climate && climate.length > 0 ? (() => {
    const chuvaTotal = climate.reduce((sum, c) => sum + (c.rain_mm || 0), 0);
    const tempMedia = climate.reduce((sum, c) => sum + (c.tmean_c || 0), 0) / climate.length;
    const umidMedia = climate.reduce((sum, c) => sum + (c.rh_mean || 0), 0) / climate.length;
    return {
      chuvaTotal: chuvaTotal.toFixed(1),
      tempMedia: tempMedia.toFixed(1),
      umidMedia: umidMedia.toFixed(0),
      dias: climate.length
    };
  })() : { chuvaTotal: "–", tempMedia: "–", umidMedia: "–", dias: 0 };

  const statsDrone = (() => {
    if (!monitorings || !biometrics) return { alturaMedia: "–" };
    if (!window.droneSummaryCache) return { alturaMedia: "–" };
    return window.droneSummaryCache;
  })();

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { box-sizing: border-box; }
        html, body {
          margin: 0;
          padding: 0;
          font-family: 'Segoe UI', Tahoma, Geneva, sans-serif;
          color: #111827;
          line-height: 1.45;
          font-size: 11px;
        }
        @page {
          size: A4;
          margin: 15mm 15mm 18mm 15mm;
        }
        .page-break { page-break-after: always; }
        .wrapper {
          padding: 4mm 2mm 2mm 2mm;
        }
        .capa {
          min-height: 260mm;
          border-top: 2px solid #065f46;
          border-bottom: 2px solid #065f46;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 10mm 15mm;
        }
        .capa h1 {
          font-size: 20px;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #065f46;
          margin-bottom: 4mm;
        }
        .capa h2 {
          font-size: 16px;
          margin-bottom: 6mm;
        }
        .capa .info {
          font-size: 11px;
          color: #374151;
          line-height: 1.9;
        }
        .capa .periodo {
          margin-top: 6mm;
          font-size: 10px;
          color: #6b7280;
          font-style: italic;
        }
        .capa .data {
          margin-top: 10mm;
          font-size: 10px;
          color: #9ca3af;
        }
        .header {
          border-top: 1px solid #065f46;
          border-bottom: 1px solid #065f46;
          padding: 3mm 0;
          margin-bottom: 4mm;
        }
        .header h1 {
          font-size: 14px;
          color: #065f46;
          margin: 0 0 1mm 0;
        }
        .header p {
          font-size: 10px;
          color: #6b7280;
          margin: 0;
        }
        .section {
          margin-bottom: 6mm;
          page-break-inside: avoid;
        }
        .section h2 {
          font-size: 12px;
          color: #065f46;
          margin: 3mm 0 2mm 0;
          border-left: 2px solid #065f46;
          padding-left: 2mm;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3mm;
          margin-top: 2mm;
        }
        .info-box {
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          padding: 3mm;
          font-size: 10px;
        }
        .info-box strong {
          display: block;
          font-size: 9px;
          color: #065f46;
          margin-bottom: 1mm;
        }
        .stats-row {
          display: flex;
          flex-wrap: wrap;
          gap: 3mm;
          margin-top: 2mm;
        }
        .stat-card {
          flex: 1 1 30mm;
          min-width: 30mm;
          border-radius: 4px;
          border: 1px solid #e5e7eb;
          padding: 3mm;
          page-break-inside: avoid;
        }
        .stat-card .label {
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #6b7280;
          margin-bottom: 1mm;
        }
        .stat-card .value {
          font-size: 13px;
          font-weight: 600;
          color: #111827;
        }
        .stat-card .hint {
          font-size: 9px;
          color: #6b7280;
          margin-top: 0.5mm;
        }
        .nota {
          border-left: 2px solid #065f46;
          padding: 2mm 3mm;
          background: #f9fafb;
          border-radius: 3px;
          font-size: 10px;
          margin-top: 2mm;
        }
        ul.resumo {
          font-size: 10px;
          padding-left: 4mm;
          margin-top: 1mm;
        }
        ul.resumo li {
          margin-bottom: 1mm;
        }
        .footer {
          text-align: center;
          font-size: 9px;
          color: #9ca3af;
          margin-top: 6mm;
          padding-top: 2mm;
          border-top: 1px solid #e5e7eb;
          page-break-inside: avoid;
        }
      </style>
    </head>
    <body>
      <!-- CAPA -->
      <div class="wrapper">
        <div class="capa">
          <h1>Relatório experimental</h1>
          <h2>${escapeHtml(experiment.name)}</h2>
          <div class="info">
            <div><strong>Código:</strong> ${escapeHtml(experiment.code)}</div>
            <div><strong>Pesquisador:</strong> ${escapeHtml(experiment.researcher || "-")}</div>
            <div><strong>Fazenda:</strong> ${escapeHtml(experiment.farm || "-")}</div>
            <div><strong>Município:</strong> ${escapeHtml(experiment.municipality || "-")}</div>
          </div>
          ${experiment.planting_date ? `
            <div class="periodo">
              Período: ${new Date(experiment.planting_date).toLocaleDateString('pt-BR')} até hoje
            </div>
          ` : ''}
          <div class="data">Gerado em ${dataAtual}</div>
        </div>
      </div>

      <!-- PÁGINA 2: Identificação e detalhes -->
      <div class="page-break"></div>
      <div class="wrapper">
        <div class="section">
          <div class="header">
            <h1>Informações gerais do experimento</h1>
            <p>Identificação, descrição do campo e configuração experimental</p>
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
              <strong>Data de plantio</strong>
              ${experiment.planting_date ? new Date(experiment.planting_date).toLocaleDateString('pt-BR') : "-"}
            </div>
            <div class="info-box">
              <strong>Pesquisador</strong>
              ${escapeHtml(experiment.researcher || "-")}
            </div>
            <div class="info-box">
              <strong>Fazenda</strong>
              ${escapeHtml(experiment.farm || "-")}
            </div>
            <div class="info-box">
              <strong>Município</strong>
              ${escapeHtml(experiment.municipality || "-")}
            </div>
            <div class="info-box">
              <strong>Bioma</strong>
              ${escapeHtml(experiment.biome || "Não informado")}
            </div>
            <div class="info-box">
              <strong>Tipo de solo</strong>
              ${escapeHtml(experiment.soil_type || "Não informado")}
            </div>
          </div>

          <h2>Objetivo do experimento</h2>
          <div class="nota">
            ${escapeHtml(experiment.objective || "Objetivo não informado.")}
          </div>

          <h2>Configuração experimental</h2>
          <div class="stats-row">
            <div class="stat-card">
              <div class="label">Blocos</div>
              <div class="value">${experiment.blocks_count || "-"}</div>
            </div>
            <div class="stat-card">
              <div class="label">Tratamentos</div>
              <div class="value">${experiment.treatments_count || "-"}</div>
            </div>
            <div class="stat-card">
              <div class="label">Parcelas por bloco</div>
              <div class="value">${experiment.plots_per_block || "-"}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Descrição do campo</h2>
          <div class="nota">
            Local: ${escapeHtml(experiment.farm || "-")}, município de ${escapeHtml(experiment.municipality || "-")}.<br>
            Solo: ${escapeHtml(experiment.soil_type || "não informado")}. Clima local: ${escapeHtml(experiment.climate || "não informado")}.
          </div>
        </div>
      </div>

      <!-- PÁGINA 3: Cronograma (resumo) -->
      <div class="page-break"></div>
      <div class="wrapper">
        <div class="section">
          <div class="header">
            <h1>Cronograma de eventos</h1>
            <p>Principais marcos: plantio, avaliações, tratos culturais e colheita</p>
          </div>

          <div class="nota">
            O cronograma abaixo resume as fases cadastradas no sistema (pré-plantio, plantio, acompanhamento, tratos
            culturais e colheita), permitindo rastrear a evolução do experimento ao longo do tempo.
          </div>

          ${schedule && schedule.length > 0 ? `
          <ul class="resumo">
            ${schedule.map(a => `
              <li>
                ${escapeHtml(a.name || "Evento")}
                ${a.start_date ? ` – início em ${new Date(a.start_date).toLocaleDateString('pt-BR')}` : ""}
                ${a.phase ? ` · fase: ${escapeHtml(a.phase)}` : ""}
                ${a.completed_at ? " · concluído" : ""}
              </li>
            `).join('')}
          </ul>
          ` : `
          <p style="font-size:10px; color:#6b7280; margin-top:2mm;">
            Nenhum evento de cronograma foi cadastrado para este experimento.
          </p>`}
        </div>
      </div>

      <!-- PÁGINA 4: Monitoramento manual (resumo) -->
      ${biometrics && biometrics.length > 0 ? `
      <div class="page-break"></div>
      <div class="wrapper">
        <div class="section">
          <div class="header">
            <h1>Desempenho – monitoramento manual</h1>
            <p>Resumo das coletas, vigor e sanidade das plantas</p>
          </div>

          <div class="nota">
            Os indicadores abaixo seguem o mesmo padrão do módulo de <strong>Monitoramento manual</strong>:
            número de coletas, porcentagem de plantas vivas em relação às plantas plantadas, altura média,
            diâmetro médio do caule e sanidade média das plantas úteis.
          </div>

          <div class="stats-row">
            <div class="stat-card">
              <div class="label">Coletas</div>
              <div class="value">${statsMonit.totalMedicoes}</div>
              <div class="hint">Medições individuais de plantas</div>
            </div>
            <div class="stat-card">
              <div class="label">Altura média</div>
              <div class="value">${statsMonit.mediaAltura !== "–" ? statsMonit.mediaAltura + " cm" : "–"}</div>
            </div>
            <div class="stat-card">
              <div class="label">Sanidade média</div>
              <div class="value">${statsMonit.mediaSanidade !== "–" ? statsMonit.mediaSanidade + "/5" : "–"}</div>
            </div>
          </div>
        </div>
      </div>
      ` : ''}

      <!-- PÁGINA 5: Colheita (resumo) -->
      ${harvest && harvest.length > 0 ? `
      <div class="page-break"></div>
      <div class="wrapper">
        <div class="section">
          <div class="header">
            <h1>Desempenho – colheita</h1>
            <p>Resumo da produção e qualidade das raízes colhidas</p>
          </div>

          <div class="nota">
            Estes indicadores sintetizam os dados de colheita registrados no sistema, em alinhamento com a página
            de <strong>Colheita</strong>: peso total, peso médio por parcela e nota média de qualidade das raízes.
          </div>

          <div class="stats-row">
            <div class="stat-card">
              <div class="label">Produção total</div>
              <div class="value">${statsColheita.pesoTotal !== "–" ? statsColheita.pesoTotal + " kg" : "–"}</div>
            </div>
            <div class="stat-card">
              <div class="label">Peso médio</div>
              <div class="value">${statsColheita.pesoMedio !== "–" ? statsColheita.pesoMedio + " kg" : "–"}</div>
            </div>
            <div class="stat-card">
              <div class="label">Qualidade média</div>
              <div class="value">${statsColheita.qualidadeMedia !== "–" ? statsColheita.qualidadeMedia + "/5" : "–"}</div>
            </div>
          </div>
        </div>
      </div>
      ` : ''}

      <!-- PÁGINA 6: Intervenções (resumo) -->
      ${interventions && interventions.length > 0 ? `
      <div class="page-break"></div>
      <div class="wrapper">
        <div class="section">
          <div class="header">
            <h1>Histórico de intervenções</h1>
            <p>Adubações, controles e demais operações registradas</p>
          </div>

          <div class="nota">
            Foram registradas ${interventions.length} intervenções durante o ciclo do experimento,
            incluindo operações de adubação, controle fitossanitário, irrigação e outras práticas culturais.
          </div>

          <ul class="resumo">
            <li>Primeira intervenção: ${new Date(interventions[0].intervention_date).toLocaleDateString('pt-BR')}</li>
            <li>Última intervenção: ${new Date(interventions[interventions.length - 1].intervention_date).toLocaleDateString('pt-BR')}</li>
          </ul>
        </div>
      </div>
      ` : ''}

      <!-- PÁGINA 7: Clima (resumo) -->
      ${climate && climate.length > 0 ? `
      <div class="page-break"></div>
      <div class="wrapper">
        <div class="section">
          <div class="header">
            <h1>Dados climáticos integrados</h1>
            <p>Resumo de chuva, temperatura e umidade ao longo do experimento</p>
          </div>

          <div class="nota">
            Os indicadores abaixo seguem o mesmo conceito dos resumos de clima do sistema:
            chuva total acumulada no período considerado, temperatura média e umidade relativa média.
          </div>

          <div class="stats-row">
            <div class="stat-card">
              <div class="label">Chuva total</div>
              <div class="value">${statsClima.chuvaTotal !== "–" ? statsClima.chuvaTotal + " mm" : "–"}</div>
            </div>
            <div class="stat-card">
              <div class="label">Temperatura média</div>
              <div class="value">${statsClima.tempMedia !== "–" ? statsClima.tempMedia + " °C" : "–"}</div>
            </div>
            <div class="stat-card">
              <div class="label">Umidade relativa média</div>
              <div class="value">${statsClima.umidMedia !== "–" ? statsClima.umidMedia + " %" : "–"}</div>
              <div class="hint">${statsClima.dias} dia(s) com registro</div>
            </div>
          </div>
        </div>
      </div>
      ` : ''}

      <!-- PÁGINA FINAL: Conclusões -->
      <div class="page-break"></div>
      <div class="wrapper">
        <div class="section">
          <div class="header">
            <h1>Conclusões e recomendações</h1>
            <p>Resumo executivo dos principais resultados e próximos passos</p>
          </div>

          <h2>Resumo executivo</h2>
          <div class="nota">
            Este relatório consolida informações do experimento <strong>${escapeHtml(experiment.code)}</strong>,
            conduzido em ${escapeHtml(experiment.farm || "-")} sob responsabilidade de
            <strong>${escapeHtml(experiment.researcher || "-")}</strong>. O experimento foi iniciado em
            ${experiment.planting_date ? new Date(experiment.planting_date).toLocaleDateString('pt-BR') : "-"}
            e estruturado com ${experiment.blocks_count || "-"} bloco(s) e
            ${experiment.treatments_count || "-"} tratamento(s).
          </div>

          <h2>Principais resultados</h2>
          <ul class="resumo">
            ${biometrics && biometrics.length > 0 ? `
              <li><strong>Monitoramento:</strong> ${statsMonit.totalMedicoes} medições com altura média de ${statsMonit.mediaAltura !== "–" ? statsMonit.mediaAltura + " cm" : "–"} e sanidade média de ${statsMonit.mediaSanidade !== "–" ? statsMonit.mediaSanidade + "/5" : "–"}.</li>
            ` : ""}
            ${harvest && harvest.length > 0 ? `
              <li><strong>Colheita:</strong> ${statsColheita.totalRegistros} registros, produção total de ${statsColheita.pesoTotal !== "–" ? statsColheita.pesoTotal + " kg" : "–"} e qualidade média de ${statsColheita.qualidadeMedia !== "–" ? statsColheita.qualidadeMedia + "/5" : "–"}.</li>
            ` : ""}
            ${climate && climate.length > 0 ? `
              <li><strong>Clima:</strong> ${statsClima.dias} dia(s) monitorados, chuva total de ${statsClima.chuvaTotal !== "–" ? statsClima.chuvaTotal + " mm" : "–"} e temperatura média de ${statsClima.tempMedia !== "–" ? statsClima.tempMedia + " °C" : "–"}.</li>
            ` : ""}
            ${interventions && interventions.length > 0 ? `
              <li><strong>Intervenções:</strong> ${interventions.length} operações registradas ao longo do ciclo.</li>
            ` : ""}
          </ul>

          <h2>Recomendações gerais</h2>
          <div class="nota">
            Recomenda-se utilizar estes resultados como base para análises estatísticas detalhadas e comparação entre
            tratamentos, bem como registrar em relatórios técnicos e artigos científicos. Novos ciclos experimentais
            podem aprofundar a avaliação de manejo, genótipos e respostas às condições climáticas locais.
          </div>

          <div class="footer">
            Sistema MandiocaTrack – Relatório gerado automaticamente em ${dataAtual}
          </div>
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
