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
                Gerar relatório em PDF (em breve)
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
      // Buscar dados de monitoramento
      const { data: monitorings, error: monError } = await s
        .from("monitoring_events")
        .select("id, plot_code, block_number, monitoring_date")
        .eq("experiment_id", experiment.id)
        .order("monitoring_date", { ascending: true });

      if (monError) throw monError;

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

      // Preparar dados para export
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
            'Altura (cm)': bio.height_cm || '',
            'Sanidade (1-5)': bio.sanity_score || '',
            'Diâmetro 1 (cm)': bio.stem_diameter_1_cm || '',
            'Diâmetro 2 (cm)': bio.stem_diameter_2_cm || '',
            'Diâmetro 3 (cm)': bio.stem_diameter_3_cm || '',
            'Status': status ? status.status : 'alive',
            'Observações': bio.notes || ''
          });
        });
      });

      // Criar planilha
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Monitoramento");

      // Download
      const filename = `${experiment.code}_monitoramento_${new Date().toISOString().slice(0,10)}.xlsx`;
      XLSX.writeFile(workbook, filename);

      alert(`✓ Dados de monitoramento exportados com sucesso!`);

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
        .from("harvest_data")
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
        'Peso total (kg)': h.total_weight_kg || '',
        'Raízes comerciais (kg)': h.commercial_roots_kg || '',
        'Raízes não comerciais (kg)': h.non_commercial_roots_kg || '',
        'Número de raízes': h.roots_count || '',
        'Observações': h.notes || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Colheita");

      const filename = `${experiment.code}_colheita_${new Date().toISOString().slice(0,10)}.xlsx`;
      XLSX.writeFile(workbook, filename);

      alert(`✓ Dados de colheita exportados com sucesso!`);

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
        'Bloco': d.block_number,
        'Tratamento': d.plot_code,
        'NDVI': d.ndvi_value || '',
        'Cobertura vegetal (%)': d.canopy_coverage_percent || '',
        'Observações': d.notes || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Drone");

      const filename = `${experiment.code}_drone_${new Date().toISOString().slice(0,10)}.xlsx`;
      XLSX.writeFile(workbook, filename);

      alert(`✓ Dados de drone exportados com sucesso!`);

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

      alert(`✓ Dados climáticos exportados com sucesso!`);

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
        'Descrição': i.description || '',
        'Produto/Insumo': i.product_name || '',
        'Dose/Quantidade': i.dosage || '',
        'Observações': i.notes || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Intervenções");

      const filename = `${experiment.code}_intervencoes_${new Date().toISOString().slice(0,10)}.xlsx`;
      XLSX.writeFile(workbook, filename);

      alert(`✓ Dados de intervenções exportados com sucesso!`);

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

      // 1. Monitoramento
      const { data: monitorings } = await s
        .from("monitoring_events")
        .select("id, plot_code, block_number, monitoring_date")
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
              'Altura (cm)': bio.height_cm || '',
              'Sanidade': bio.sanity_score || '',
              'Diâmetro 1': bio.stem_diameter_1_cm || '',
              'Status': status ? status.status : 'alive'
            });
          });
        });

        if (monData.length > 0) {
          const ws = XLSX.utils.json_to_sheet(monData);
          XLSX.utils.book_append_sheet(workbook, ws, "Monitoramento");
        }
      }

      // 2. Colheita
      const { data: harvest } = await s
        .from("harvest_data")
        .select("*")
        .eq("experiment_id", experiment.id);

      if (harvest && harvest.length > 0) {
        const harvestData = harvest.map(h => ({
          'Data': h.harvest_date,
          'Bloco': h.block_number,
          'Tratamento': h.plot_code,
          'Peso total (kg)': h.total_weight_kg || '',
          'Raízes comerciais (kg)': h.commercial_roots_kg || ''
        }));
        const ws = XLSX.utils.json_to_sheet(harvestData);
        XLSX.utils.book_append_sheet(workbook, ws, "Colheita");
      }

      // 3. Drone
      const { data: drone } = await s
        .from("drone_monitoring")
        .select("*")
        .eq("experiment_id", experiment.id);

      if (drone && drone.length > 0) {
        const droneData = drone.map(d => ({
          'Data': d.flight_date,
          'Bloco': d.block_number,
          'Tratamento': d.plot_code,
          'NDVI': d.ndvi_value || '',
          'Cobertura (%)': d.canopy_coverage_percent || ''
        }));
        const ws = XLSX.utils.json_to_sheet(droneData);
        XLSX.utils.book_append_sheet(workbook, ws, "Drone");
      }

      // 4. Clima
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
      }

      // 5. Intervenções
      const { data: interventions } = await s
        .from("interventions")
        .select("*")
        .eq("experiment_id", experiment.id);

      if (interventions && interventions.length > 0) {
        const intData = interventions.map(i => ({
          'Data': i.intervention_date,
          'Tipo': i.intervention_type,
          'Descrição': i.description || '',
          'Produto': i.product_name || ''
        }));
        const ws = XLSX.utils.json_to_sheet(intData);
        XLSX.utils.book_append_sheet(workbook, ws, "Intervenções");
      }

      // Download do arquivo consolidado
      const filename = `${experiment.code}_consolidado_${new Date().toISOString().slice(0,10)}.xlsx`;
      XLSX.writeFile(workbook, filename);

      alert(`✓ Todos os dados exportados com sucesso em ${workbook.SheetNames.length} abas!`);

    } catch (err) {
      console.error('Erro ao exportar dados consolidados:', err);
      alert('Erro ao exportar dados consolidados');
    }
  };

  window.generatePDFReport = function() {
    alert('Funcionalidade de relatório PDF em desenvolvimento.\n\nEm breve você poderá gerar relatórios completos em PDF com gráficos, tabelas e análises consolidadas.');
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
