// mapadbc.js
// Depende do cliente Supabase global "s" definido em app.js

// Estado temporário do Mapa DBC (por experimento)
const dbcState = {
  experimentId: null,
  experimentName: "",
  plotsByTemplateId: {} // agora indexado por plot_template_id
};

let qrInitialized = false;

const DEFAULT_TREATMENTS = [
  { code: "AMARELA",    position: "VERTICAL"   },
  { code: "AMARELA",    position: "INCLINADA" },
  { code: "AMARELA",    position: "HORIZONTAL" },

  { code: "AMARELINHA", position: "VERTICAL"   },
  { code: "AMARELINHA", position: "INCLINADA" },
  { code: "AMARELINHA", position: "HORIZONTAL" },

  { code: "CACAU",      position: "VERTICAL"   },
  { code: "CACAU",      position: "INCLINADA" },
  { code: "CACAU",      position: "HORIZONTAL" },

  { code: "SABARÁ",     position: "VERTICAL"   },
  { code: "SABARÁ",     position: "INCLINADA" },
  { code: "SABARÁ",     position: "HORIZONTAL" }
];

// INSERIR APÓS DEFAULT_TREATMENTS e ANTES de function renderDbcPage
async function loadLatestMonitoringData(experimentId) {
  // 1. Buscar parcelas do experimento
  const { data: plots, error: plotsError } = await s
    .from('plots')
    .select('id, plot_template_id')
    .eq('experiment_id', experimentId);
  
  if (plotsError || !plots) {
    console.log('Erro ao buscar plots:', plotsError);
    return {};
  }
  
  console.log('Plots encontrados:', plots);
  
  // 2. Buscar templates para fazer o match com plot_code
  const { data: templates, error: tplError } = await s
    .from('plot_templates')
    .select('id, block_number, plot_code');
  
  if (tplError || !templates) {
    console.log('Erro ao buscar templates:', tplError);
    return {};
  }
  
  console.log('Templates:', templates);
  
  // 3. Buscar eventos de monitoramento deste experimento
  const { data: monitoringEvents, error: eventsError } = await s
    .from('monitoring_events')
    .select('id, plot_code, block_number, monitoring_date')
    .eq('experiment_id', experimentId)
    .order('monitoring_date', { ascending: false });
  
  if (eventsError || !monitoringEvents || monitoringEvents.length === 0) {
    console.log('Erro ou sem eventos:', eventsError, monitoringEvents);
    return {};
  }
  
  console.log('Monitoring Events:', monitoringEvents);
  
  // 4. Agrupar eventos por plot_code+block (pegar só o mais recente)
  const latestEventByPlot = {};
  monitoringEvents.forEach(evt => {
    const key = `B${evt.block_number}${evt.plot_code}`;
    if (!latestEventByPlot[key]) {
      latestEventByPlot[key] = evt;
    }
  });
  
  console.log('Latest Event By Plot (key format):', latestEventByPlot);
  
  const eventIds = Object.values(latestEventByPlot).map(e => e.id);
  if (eventIds.length === 0) return {};
  
  // 5. Buscar status das plantas
  const { data: plantStatuses, error: statusError } = await s
    .from('plant_status')
    .select('monitoring_event_id, plant_position, status')
    .in('monitoring_event_id', eventIds);
  
  console.log('Plant Statuses:', plantStatuses);
  
  // 6. Buscar tombamento
  const { data: plantLodging, error: lodgingError } = await s
    .from('plant_lodging')
    .select('monitoring_event_id, plant_position, is_lodged')
    .in('monitoring_event_id', eventIds);
  
  // 7. Buscar biometria
  const { data: plantBiometrics, error: bioError } = await s
    .from('plant_biometrics')
    .select('monitoring_event_id, plant_position, height_cm, stem_diameter_1_cm, sanity_score, is_reference_plant')
    .in('monitoring_event_id', eventIds);
  
  // 8. Organizar dados por monitoring_event_id
  const statusByEvent = {};
  const lodgingByEvent = {};
  const biometricsByEvent = {};
  
  (plantStatuses || []).forEach(ps => {
    if (!statusByEvent[ps.monitoring_event_id]) {
      statusByEvent[ps.monitoring_event_id] = {};
    }
    statusByEvent[ps.monitoring_event_id][ps.plant_position] = ps.status;
  });
  
  (plantLodging || []).forEach(pl => {
    if (!lodgingByEvent[pl.monitoring_event_id]) {
      lodgingByEvent[pl.monitoring_event_id] = {};
    }
    lodgingByEvent[pl.monitoring_event_id][pl.plant_position] = pl.is_lodged === true;
  });
  
  (plantBiometrics || []).forEach(pb => {
    if (!biometricsByEvent[pb.monitoring_event_id]) {
      biometricsByEvent[pb.monitoring_event_id] = {};
    }
    biometricsByEvent[pb.monitoring_event_id][pb.plant_position] = {
      height_cm: pb.height_cm,
      stem_diameter_1_cm: pb.stem_diameter_1_cm,
      sanity_score: pb.sanity_score,
      is_reference_plant: pb.is_reference_plant === true
    };
  });
  
  // 9. Criar índice template por plot_code
  const templateByCode = {};
  templates.forEach(tpl => {
    templateByCode[tpl.plot_code] = tpl;
  });
  
  console.log('Template By Code:', templateByCode);
  
  // 10. Montar estrutura final indexada por plot_template_id
  const monitoringByTemplateId = {};
  
  Object.entries(latestEventByPlot).forEach(([plotKey, event]) => {
    console.log('Tentando mapear:', plotKey, '-> template:', templateByCode[plotKey]);
    const template = templateByCode[plotKey];
    if (template) {
      monitoringByTemplateId[template.id] = {
        plot_code: event.plot_code,
        monitoring_date: event.monitoring_date,
        plant_statuses: statusByEvent[event.id] || {},
        lodging_statuses: lodgingByEvent[event.id] || {},
        biometrics: biometricsByEvent[event.id] || {}
      };
    }
  });
  
  console.log('FINAL - Monitoring By Template ID:', monitoringByTemplateId);
  // Debug específico de alguns tratamentos
const sampleIds = Object.keys(monitoringByTemplateId).slice(0, 3);
sampleIds.forEach(templateId => {
  const data = monitoringByTemplateId[templateId];
  console.log('=== DETALHES DO TEMPLATE:', templateId, '===');
  console.log('plot_code:', data.plot_code);
  console.log('plant_statuses:', data.plant_statuses);
  console.log('Keys de plant_statuses:', Object.keys(data.plant_statuses || {}));
  console.log('Quantidade de plantas:', Object.keys(data.plant_statuses || {}).length);
});
  
  return monitoringByTemplateId;
}

window.renderDbcPage = function (container) {
  container.innerHTML = `
    <div class="content-header">
      <div class="content-title">Mapa DBC</div>
      <div class="content-subtitle">
        Configure o croqui e gere as etiquetas das parcelas.
      </div>
    </div>

    <div class="card">
      <div style="display:flex;gap:8px;margin-bottom:12px;">
        <button id="dbcTabMapBtn" class="btn-secondary">Croqui</button>
        <button id="dbcTabQrBtn" class="btn-secondary">QR Codes</button>
      </div>

      <div id="dbcTabMapArea">
        <div style="margin-bottom:12px;">
          <label for="dbcExperimentSelect">Experimento</label>
          <select id="dbcExperimentSelect">
            <option value="">Carregando experimentos...</option>
          </select>
        </div>

        <div id="dbcMapArea">
          <p style="color:#6b7280;font-size:14px;">
            Selecione um experimento para carregar o mapa DBC.
          </p>
        </div>       
      </div>

      <div id="dbcTabQrArea" style="display:none;"></div>
    </div>
  `;

  const dbcExperimentSelect = document.getElementById("dbcExperimentSelect");
  const dbcMapArea = document.getElementById("dbcMapArea");
  const dbcTabMapBtn  = document.getElementById("dbcTabMapBtn");
  const dbcTabQrBtn   = document.getElementById("dbcTabQrBtn");
  const dbcTabMapArea = document.getElementById("dbcTabMapArea");
  const dbcTabQrArea  = document.getElementById("dbcTabQrArea");

  // Detecta se é visitante
  const isVisitor = (typeof currentRole !== "undefined" && currentRole === "visitor");

  // Opção 1: TRAVAR o botão (fica visível porém desativado)
  if (isVisitor) {
    dbcTabQrBtn.disabled = true;
    dbcTabQrBtn.classList.add("disabled");
    dbcTabQrBtn.title = "QR Codes disponíveis apenas para pesquisadores e administradores.";
  }

  // Tabs
  dbcTabMapBtn.addEventListener("click", () => {
    dbcTabMapBtn.classList.add("active");
    dbcTabQrBtn.classList.remove("active");
    dbcTabMapArea.style.display = "block";
    dbcTabQrArea.style.display = "none";
  });

  dbcTabQrBtn.addEventListener("click", () => {
    if (isVisitor) return; // visitante não entra na aba QR

    dbcTabQrBtn.classList.add("active");
    dbcTabMapBtn.classList.remove("active");
    dbcTabMapArea.style.display = "none";
    dbcTabQrArea.style.display = "block";

    if (!qrInitialized) {
      initDbcQrArea();
      qrInitialized = true;
    }
  });

  // 1) Buscar experimentos no Supabase
  (async () => {
    const { data: experiments, error } = await s
      .from("experiments")
      .select("id, name")
      .order("created_at", { ascending: false });

    if (error) {
      dbcExperimentSelect.innerHTML = `<option value="">Erro ao carregar experimentos</option>`;
      dbcMapArea.innerHTML = `
        <p style="color:#b91c1c;font-size:14px;">
          Não foi possível carregar a lista de experimentos.
        </p>
      `;
      return;
    }

    if (!experiments || experiments.length === 0) {
      dbcExperimentSelect.innerHTML = `<option value="">Nenhum experimento encontrado</option>`;
      return;
    }

    dbcExperimentSelect.innerHTML = `
      <option value="">Selecione um experimento...</option>
      ${experiments
        .map((exp) => `<option value="${exp.id}">${exp.name}</option>`)
        .join("")}
    `;
  })();

  // 2) Reagir à mudança do select: carregar croqui fixo (plot_templates) + vínculos (plots)
  dbcExperimentSelect.addEventListener("change", async () => {
    const expId = dbcExperimentSelect.value;
    const expName =
      dbcExperimentSelect.options[dbcExperimentSelect.selectedIndex]?.text || "";

    // sempre que mudar de experimento, força recriar a aba QR
    qrInitialized = false;
    const qrArea = document.getElementById("dbcTabQrArea");
    if (qrArea) {
      qrArea.innerHTML = "";
    }

    if (!expId) {
      dbcState.experimentId = null;
      dbcState.experimentName = "";
      dbcState.plotsByTemplateId = {};
      dbcMapArea.innerHTML = `
        <p style="color:#6b7280;font-size:14px;">
          Selecione um experimento para carregar o mapa DBC.
        </p>
      `;
      return;
    }

    dbcState.experimentId = expId;
    dbcState.experimentName = expName;
    dbcState.plotsByTemplateId = {};

       // 1) Croqui fixo
    const { data: templates, error: tplError } = await s
      .from("plot_templates")
      .select("id, block_number, plot_code, treatment_code, position")
      .order("block_number", { ascending: true })
      .order("id", { ascending: true });

    if (tplError || !templates) {
      dbcMapArea.innerHTML = `
        <p style="color:#b91c1c;font-size:14px;">
          Erro ao carregar croqui fixo (plot_templates).
        </p>
      `;
      return;
    }

    // 2) Vínculos existentes deste experimento
    const { data: plots, error: plotsError } = await s
      .from("plots")
      .select("id, plot_template_id, treatment_id")
      .eq("experiment_id", expId);

    if (plotsError) {
      dbcMapArea.innerHTML = `
        <p style="color:#b91c1c;font-size:14px;">
          Erro ao carregar parcelas (plots) deste experimento.
        </p>
      `;
      return;
    }

    const plotsByTemplateId = {};
    (plots || []).forEach((p) => {
      plotsByTemplateId[p.plot_template_id] = p;
      dbcState.plotsByTemplateId[p.plot_template_id] = {
        id: p.id,
        experiment_id: expId,
        plot_template_id: p.plot_template_id,
        treatment_id: p.treatment_id
      };
    });

    // 3) Treatments do experimento
    let { data: treatments, error: trError } = await s
      .from("treatments")
      .select("id, code, position, description")
      .eq("experiment_id", expId)
      .order("code", { ascending: true });

    if (trError) {
      return;
    }

    // Se não houver treatments, cria a partir da tabela default_treatments
    if (!treatments || treatments.length === 0) {
      const { error: rpcError } = await s.rpc(
        "create_treatments_from_default",
        { p_experiment_id: expId }
      );

      if (rpcError) {
        dbcMapArea.innerHTML = `
          <p style="color:#b91c1c;font-size:14px;">
            Erro ao criar tratamentos padrão para este experimento.
          </p>
        `;
        return;
      }

      const res2 = await s
        .from("treatments")
        .select("id, code, position, description")
        .eq("experiment_id", expId)
        .order("code", { ascending: true });

      treatments = res2.data || [];
    }

        // 4) Carregar dados de monitoramento
    const monitoringData = await loadLatestMonitoringData(expId);
    // DEBUG - remover depois
    console.log('=== DEBUG MONITORING DATA ===');
    console.log('Experiment ID:', expId);
    console.log('Monitoring Data:', monitoringData);
    console.log('Templates:', templates);
    console.log('window.renderPlantCircles exists?', typeof window.renderPlantCircles);
    
    // 5) Montar blocos com grid baseado em plot_templates
    const colorMap = {
      AMARELA: "#fde68a",
      AMARELINHA: "#bbf7d0",
      CACAU: "#bfdbfe",
      SABARÁ: "#fecaca"
    };
        const blockNumbers = [1, 2, 3];
    
    // ORDEM FIXA DOS TRATAMENTOS POR BLOCO (4 colunas x 3 linhas)
    const blockLayout = {
      1: ['T12', 'T9', 'T4', 'T1', 'T3', 'T11', 'T6', 'T8', 'T2', 'T10', 'T7', 'T5'],
      2: ['T2', 'T7', 'T11', 'T3', 'T6', 'T1', 'T5', 'T10', 'T4', 'T12', 'T8', 'T9'],
      3: ['T8', 'T5', 'T6', 'T10', 'T7', 'T2', 'T12', 'T9', 'T4', 'T11', 'T3', 'T1']
    };
    
    // LEGENDA
    const legendHtml = `
      <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
        <div style="font-weight: 600; margin-bottom: 12px; font-size: 14px;">
          Legenda - Status das Plantas:
        </div>
        <div style="display: flex; gap: 24px; flex-wrap: wrap; align-items: center;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 24px; height: 24px; border-radius: 50%; background-color: #dcfce7; border: 2px solid #22c55e;"></div>
            <span style="font-size: 13px;">Viva</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 24px; height: 24px; border-radius: 50%; background-color: #fee2e2; border: 2px solid #ef4444;"></div>
            <span style="font-size: 13px;">Morta</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 24px; height: 24px; border-radius: 50%; background-color: #f3f4f6; border: 2px solid #9ca3af;"></div>
            <span style="font-size: 13px;">Não brotou</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 24px; height: 24px; border-radius: 50%; background-color: #fed7aa; border: 2px solid #f97316;"></div>
            <span style="font-size: 13px;">Tombada</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="position: relative; width: 24px; height: 24px; border-radius: 50%; background-color: #dcfce7; border: 3px solid #22c55e;">
              <div style="position: absolute; top: -2px; right: -2px; width: 8px; height: 8px; background: #3b82f6; border-radius: 50%; border: 1px solid white;"></div>
            </div>
            <span style="font-size: 13px;">Amostra (borda grossa + ponto azul)</span>
          </div>
        </div>
      </div>
    `;
    
    // BOTÃO DE ATUALIZAR
    const refreshButtonHtml = `
      <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
        <h2 style="font-size: 20px; font-weight: 600; color: #111827;">
          Mapa DBC - ${expName}
        </h2>
        <button id="btnRefreshDbcMap" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 14px; display: flex; align-items: center; gap: 6px;">
          <span>🔄</span>
          <span>Atualizar Dados</span>
        </button>
      </div>
    `;
    
    dbcMapArea.innerHTML = refreshButtonHtml + legendHtml + blockNumbers
      .map((block) => {
        // Criar índice de templates por plot_code
        const templatesByCode = {};
        templates.forEach(tpl => {
          if (tpl.block_number === block) {
            templatesByCode[tpl.plot_code] = tpl;
          }
        });
        
        // Montar células na ordem fixa
        const orderedLayout = blockLayout[block];
        const cellsHtml = orderedLayout
          .map((plotCode) => {
            const tpl = templatesByCode[`B${block}${plotCode}`];
            if (!tpl) return ''; // caso não exista
            
            const bgColor = colorMap[tpl.treatment_code] || "#e5e7eb";
            
                       // Buscar dados de monitoramento
            const monitoring = monitoringData[tpl.id];

            // DEBUG
            console.log(`Tratamento ${tpl.plot_code}:`, {
              template_id: tpl.id,
              has_monitoring: !!monitoring,
              plant_statuses: monitoring?.plant_statuses,
              num_plants: monitoring ? Object.keys(monitoring.plant_statuses || {}).length : 0
            });

            // Gerar círculos das plantas
            let circlesHtml = '';
            if (monitoring) {
              // Criar objeto com as 9 posições (1 a 9)
              let statuses = {};
              let lodging = {};
              let bio = {};
  
              // Inicializar todas as 9 posições como 'not_sprouted' (sem dados)
              for (let i = 1; i <= 9; i++) {
                statuses[i] = 'not_sprouted';
                lodging[i] = false;
                bio[i] = null;
              }
  
              // Sobrescrever com dados reais de plant_statuses
              if (monitoring.plant_statuses && Object.keys(monitoring.plant_statuses).length > 0) {
                Object.entries(monitoring.plant_statuses).forEach(([pos, status]) => {
                  statuses[pos] = status;
                });
              }
  
              // Sobrescrever com dados de biometrics (se tiver biometria, está viva)
              if (monitoring.biometrics && Object.keys(monitoring.biometrics).length > 0) {
                Object.entries(monitoring.biometrics).forEach(([pos, bioData]) => {
                  bio[pos] = bioData;
                  // Se tem biometria mas não tem status definido, assume viva
                  if (statuses[pos] === 'not_sprouted') {
                    statuses[pos] = 'alive';
                  }
                });
              }
  
              // Sobrescrever com dados de tombamento
              if (monitoring.lodging_statuses && Object.keys(monitoring.lodging_statuses).length > 0) {
                Object.entries(monitoring.lodging_statuses).forEach(([pos, isLodged]) => {
                  lodging[pos] = isLodged;
                });
              }
  
              if (window.renderPlantCircles && Object.keys(statuses).length > 0) {
                circlesHtml = window.renderPlantCircles(
                  statuses,
                  monitoring.lodging_statuses,
                  monitoring.biometrics,
                  {
                    size: 24,
                    fontSize: 10,
                    showLabels: true,
                    compact: true,
                    gridLayout: true
                  }
                );
              } else {
                circlesHtml = `
                  <div style="text-align: center; color: #9ca3af; font-size: 11px; padding: 8px;">
                    Sem dados
                  </div>
                `;
              }
            } else {
              circlesHtml = `
                <div style="text-align: center; color: #9ca3af; font-size: 11px; padding: 8px;">
                  Sem dados
                </div>
              `;
            }
            
            return `
              <div style="position: relative; background-color: ${bgColor}; padding: 10px; border-radius: 8px; border: 2px solid #d1d5db; min-height: 140px; display: flex; flex-direction: column;">
                <div style="font-weight: 600; font-size: 12px; margin-bottom: 2px; text-align: center;">
                  ${tpl.plot_code}
                </div>
                <div style="font-size: 10px; color: #6b7280; text-align: center; margin-bottom: 6px; line-height: 1.2;">
                  ${tpl.treatment_code} ${tpl.position}
                </div>
                <div style="flex: 1; display: flex; align-items: center; justify-content: center;">
                  ${circlesHtml}
                </div>
              </div>
            `;
          })
          .join("");
        
        return `
          <div style="margin-bottom: 32px;">
            <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #374151;">
              Bloco ${block}
            </h3>
            <div style="display: grid; grid-template-columns: repeat(4, minmax(180px, 1fr)); gap: 12px;">
              ${cellsHtml}
            </div>
          </div>
        `;
      })
      .join("");
    
    // Event listener do botão atualizar
    setTimeout(() => {
      document.getElementById('btnRefreshDbcMap')?.addEventListener('click', async () => {
        const btn = document.getElementById('btnRefreshDbcMap');
        if (btn) {
          btn.disabled = true;
          btn.innerHTML = '<span>⏳</span><span>Atualizando...</span>';
        }
        dbcExperimentSelect.dispatchEvent(new Event('change'));
      });
    }, 100);
  }); // <- fecha o change do experimento

} // fecha renderDbcPage

// ===============================
// Área de QR Codes dentro do Mapa
// ===============================
async function initDbcQrArea() {
  const area = document.getElementById("dbcTabQrArea");
  if (!area) return;

  if (!dbcState.experimentId) {
    area.innerHTML = `
      <p style="color:#b91c1c;font-size:14px;">
        Selecione um experimento na aba Croqui antes de gerar QR Codes.
      </p>
    `;
    return;
  }

  const expId = dbcState.experimentId;
  const expName = dbcState.experimentName || "Experimento sem nome";

  // 1) Buscar croqui fixo em ordem
  const { data: templates, error: tplError } = await s
    .from("plot_templates")
    .select("id, block_number, plot_code, treatment_code, position")
    .order("block_number", { ascending: true })
    .order("id", { ascending: true });

  if (tplError || !templates) {
    area.innerHTML = `
      <p style="color:#b91c1c;font-size:14px;">
        Erro ao carregar croqui fixo (plot_templates) para gerar QR Codes.
      </p>
    `;
    return;
  }

  area.innerHTML = `
    <div class="content-header" style="margin-top:0;">
      <div class="content-title">QR Code das Parcelas</div>
      <div class="content-subtitle">
        Etiquetas para o experimento: <strong>${expName}</strong>.
      </div>
    </div>

    <div class="card">
      <div style="
        display:flex;
        flex-wrap:wrap;
        gap:16px;
        align-items:flex-end;
        margin-bottom:16px;
      ">
        <div style="flex:0 0 160px;">
          <label for="qrBlockFilter">Bloco</label>
          <select id="qrBlockFilter">
            <option value="all">Todos os blocos</option>
            <option value="1">Bloco 1</option>
            <option value="2">Bloco 2</option>
            <option value="3">Bloco 3</option>
          </select>
        </div>

        <div style="flex:0 0 220px;">
          <label for="qrFormatSelect">Formato de impressão</label>
          <select id="qrFormatSelect">
            <option value="a4-6">A4 – 6 etiquetas por página</option>
            <option value="label-100x70">Etiqueta térmica 100×70 mm (1 etiqueta)</option>
          </select>
        </div>

        <div id="qrSingleLabelWrapper" style="flex:0 0 220px; display:none;">
          <label for="qrSinglePlotSelect">Parcela para etiqueta única</label>
          <select id="qrSinglePlotSelect">
            <option value="">Selecione a parcela</option>
          </select>
        </div>

        <div style="
          flex:0 0 auto;
          margin-left:auto;
          display:flex;
          gap:8px;
          justify-content:flex-end;
        ">
          <button id="qrPreviewBtn" class="btn-secondary">
            Atualizar visualização
          </button>
          <button id="qrPrintBtn" class="btn-primary">
            Imprimir / Baixar
          </button>
        </div>
      </div>

      <div id="qrLabelsWrapper" style="
        display:grid;
        grid-template-columns:repeat(auto-fill,minmax(230px,1fr));
        gap:12px;
      ">
      </div>
    </div>
  `;

    const qrBlockFilter = document.getElementById("qrBlockFilter");
  const qrFormatSelect = document.getElementById("qrFormatSelect");
  const qrSingleWrapper = document.getElementById("qrSingleLabelWrapper");
  const qrSinglePlotSelect = document.getElementById("qrSinglePlotSelect");
  const qrLabelsWrapper = document.getElementById("qrLabelsWrapper");
  const qrPreviewBtn = document.getElementById("qrPreviewBtn");
  const qrPrintBtn = document.getElementById("qrPrintBtn");

  // monta lista de parcelas para selects / filtros
  const parcels = templates.map((tpl) => ({
    block: tpl.block_number,
    plotCode: tpl.plot_code,
    treatmentCode: tpl.treatment_code,
    position: tpl.position,
    templateId: tpl.id
  }));

  // Preenche o select de parcela única
  if (qrSinglePlotSelect) {
    qrSinglePlotSelect.innerHTML = `
      <option value="">Selecione a parcela</option>
      ${parcels
        .map(
          (p) =>
            `<option value="${p.templateId}">
              ${p.plotCode} · ${p.treatmentCode} ${p.position}
             </option>`
        )
        .join("")}
    `;
  }

  // Alterna exibição do wrapper conforme formato
  qrFormatSelect.addEventListener("change", () => {
    const fmt = qrFormatSelect.value;
    qrSingleWrapper.style.display =
      fmt === "label-100x70" ? "block" : "none";
  });

  // Função para montar URL do QR (ajuste a base depois)
  function buildQrUrl(expId, templateId) {
    const base = window.location.origin;
    return `${base}?exp=${encodeURIComponent(expId)}&pt=${encodeURIComponent(
      templateId
    )}`;
  }

  // Renderização das etiquetas na visualização
  function renderQrLabels() {
    const blockFilter = qrBlockFilter.value;
    const fmt = qrFormatSelect.value;          // "a4-6" ou "label-100x70"
    const singleTemplateId = qrSinglePlotSelect.value;

    let list = parcels.slice();

    // filtro por bloco
    if (blockFilter !== "all") {
      const blockNum = Number(blockFilter);
      list = list.filter((p) => p.block === blockNum);
    }

    // etiqueta térmica: apenas a parcela escolhida
    if (fmt === "label-100x70") {
      if (!singleTemplateId) {
        qrLabelsWrapper.innerHTML = `
          <p style="color:#6b7280;font-size:14px;">
            Selecione a parcela para gerar a etiqueta térmica 100×70 mm.
          </p>
        `;
        return;
      }
      const idNum = Number(singleTemplateId);
      list = list.filter((p) => p.templateId === idNum);
    }

    if (list.length === 0) {
      qrLabelsWrapper.innerHTML = `
        <p style="color:#6b7280;font-size:14px;">
          Nenhuma parcela para os filtros selecionados.
        </p>
      `;
      return;
    }

    // MONTA HTML
    if (fmt === "label-100x70") {
      // etiqueta ÚNICA por página, 100×70, QR à esquerda e textos à direita
      qrLabelsWrapper.innerHTML = list
        .map((p) => {
          return `
            <div class="qr-label-single-page qr-label-card" style="
              display:flex;
              flex-direction:row;
              align-items:center;
              gap:6mm;
            ">
              <div id="qr-${p.templateId}" style="width:32mm;height:32mm;"></div>
              <div style="display:flex;flex-direction:column;gap:2mm;">
                <div style="font-weight:700;font-size:15px;">
                  ${p.treatmentCode} ${p.position}
                </div>
                <div style="font-size:14px;color:#111827;">
                  ${p.plotCode}
                </div>
                <div style="font-size:12px;color:#4b5563;">
                  Experimento: ${expName}
                </div>
              </div>
            </div>
          `;
        })
        .join("");
    } else {
      // A4 – 6 por página (2 x 3)
      const cardsHtml = list
        .map((p) => {
          return `
            <div class="qr-label-card" style="
              display:flex;
              flex-direction:row;
              align-items:center;
              gap:6mm;
            ">
              <div id="qr-${p.templateId}" style="width:32mm;height:32mm;"></div>
              <div style="display:flex;flex-direction:column;gap:2mm;">
                <div style="font-weight:700;font-size:15px;">
                  ${p.treatmentCode} ${p.position}
                </div>
                <div style="font-size:14px;color:#111827;">
                  ${p.plotCode}
                </div>
                <div style="font-size:12px;color:#4b5563;">
                  Experimento: ${expName}
                </div>
              </div>
            </div>
          `;
        })
        .join("");

      qrLabelsWrapper.innerHTML = `
        <div class="qr-label-sheet">
          ${cardsHtml}
        </div>
      `;
    }

    // GERAR QRCODES DEPOIS DO innerHTML
    list.forEach((p) => {
      const url = buildQrUrl(expId, p.templateId);
      const container = document.getElementById(`qr-${p.templateId}`);
      if (container) {
        container.innerHTML = "";
        new QRCode(container, {
          text: url,
          width: 120,   // ~32mm
          height: 120,
        });
      }
    });
  }

  // eventos de preview
  if (qrPreviewBtn) {
    qrPreviewBtn.addEventListener("click", renderQrLabels);
  }
  qrBlockFilter.addEventListener("change", renderQrLabels);
  qrFormatSelect.addEventListener("change", renderQrLabels);
  qrSinglePlotSelect.addEventListener("change", renderQrLabels);

  // botão imprimir
  if (qrPrintBtn) {
    qrPrintBtn.addEventListener("click", () => {
      window.print();
    });
  }

  // primeira renderização
  renderQrLabels();
} // fecha initDbcQrArea

