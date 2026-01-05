// =============================
// experiments.js
// Módulo independente de Experimentos
// =============================

// estado local do módulo
let currentExperiment = null;

// usa formatDate que já existe no app.js, se disponível
function formatExperimentDate(dateString) {
  if (typeof formatDate === "function") {
    return formatDate(dateString);
  }
  if (!dateString) return "-";
  const [y, m, d] = dateString.split("T")[0].split("-");
  return `${d}/${m}/${y}`;
}

// página principal de Experimentos
async function renderExperimentsPage(container) {
  // se currentRole não existir ainda, mostra mensagem simples
  if (typeof currentRole === "undefined" || !currentRole) {
    container.innerHTML = `
      <div class="card">
        <p>Carregando permissões do usuário...</p>
      </div>
    `;
    return;
  }

  if (currentRole === "visitor") {
    container.innerHTML = `
      <div class="content-header">
        <div class="content-title">Experimentos</div>
        <div class="content-subtitle">Apenas administradores ou pesquisadores podem gerenciar experimentos.</div>
      </div>
      <div class="card">
        <p style="color:#b91c1c;">Você não tem permissão para acessar esta página.</p>
      </div>
    `;
    return;
  }

  const subtitle = document.getElementById("headerSubtitle");
  if (subtitle) subtitle.textContent = "Registro de Experimentos";

  container.innerHTML = `
    <div class="content-header">
      <div class="content-title">Experimentos</div>
      <div class="content-subtitle">
        Selecione qual experimento será usado para edição e inserção de dados.
      </div>
    </div>

    <div class="card" id="experimentsActions"
      style="margin-bottom:16px; display:flex; justify-content:space-between; align-items:center; gap:8px;">
      <div style="font-size:14px; color:#4b5563;">
        Gerencie os experimentos de campo cadastrados.
      </div>
      <button class="btn-primary" id="btnNewExperiment" style="width:auto; padding-inline:18px;">
        + Novo experimento
      </button>
    </div>

    <div id="experimentsList">
      <div class="card">
        <p>Carregando experimentos...</p>
      </div>
    </div>
  `;

  const btnNew = document.getElementById("btnNewExperiment");
  if (btnNew) {
    btnNew.onclick = () => openExperimentFormModal();
  }

  await loadExperimentsIntoList();
}

// carrega a lista de experimentos e monta os cards
async function loadExperimentsIntoList() {
  const listEl = document.getElementById("experimentsList");
  if (!listEl) return;

  if (typeof s === "undefined") {
    listEl.innerHTML = `
      <div class="card">
        <p style="color:#b91c1c;">Cliente Supabase não encontrado.</p>
      </div>
    `;
    return;
  }

  const { data, error } = await s
    .from("experiments")
    .select("*")
    .order("planting_date", { ascending: false });

  if (error) {
    listEl.innerHTML = `
      <div class="card">
        <p style="color:#b91c1c;">Erro ao carregar experimentos: ${error.message}</p>
      </div>
    `;
    return;
  }

  const experiments = data || [];

  if (!experiments.length) {
    listEl.innerHTML = `
      <div class="card" style="text-align:center; padding:32px 16px;">
        <div style="font-size:40px; margin-bottom:8px; color:#6b7280;">🧪</div>
        <div style="font-size:18px; font-weight:700; color:#111827;">
          Nenhum experimento cadastrado
        </div>
        <div style="font-size:14px; color:#6b7280; margin-top:4px;">
          Crie seu primeiro experimento para começar.
        </div>
        <button class="btn-primary" style="margin-top:12px;" onclick="openExperimentFormModal()">
          + Criar experimento
        </button>
      </div>
    `;
    return;
  }

  const cardsHtml = experiments
  .map((exp) => {
    const isSelected = currentExperiment && currentExperiment.id === exp.id;
    const status = exp.status || "active";
    const statusLabel = status === "active" ? "Ativo" : "Concluído";
    const planting = formatExperimentDate(exp.planting_date);
    const farm = exp.farm || "-";

    return `
      <div class="card" style="margin-bottom:12px;">
        <div style="display:flex; flex-wrap:wrap; justify-content:space-between;
                    gap:12px; align-items:center;">
          <div style="flex:1 1 220px; min-width:0;">
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
              <div style="font-size:18px; font-weight:700; color:var(--green-dark);">
                ${exp.code || "(sem código)"}
              </div>
              <span style="
                display:inline-flex;
                align-items:center;
                gap:4px;
                padding:2px 10px;
                border-radius:999px;
                font-size:11px;
                font-weight:600;
                background:${status === "active"
                  ? "rgba(16,185,129,0.18)"
                  : "rgba(148,163,184,0.3)"};
                color:${status === "active" ? "#065f46" : "#374151"};
              ">
                ● ${statusLabel}
              </span>
            </div>
            <div style="font-size:14px; color:#4b5563; margin-top:2px;
                        white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              ${exp.name || "Experimento sem descrição"}
            </div>
            <div style="margin-top:6px; display:flex; flex-wrap:wrap; gap:10px;
                        font-size:12px; color:#6b7280;">
              <span>Plantio: ${planting}</span>
              <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                Local: ${farm}
              </span>
            </div>
          </div>

          <div style="display:flex; flex-wrap:wrap; gap:6px; justify-content:flex-end;">
            <button
              class="${isSelected ? "btn-primary" : "btn-secondary"}"
              style="font-size:13px;"
              onclick="selectExperiment('${exp.id}')"
            >
              ${isSelected ? "Selecionado" : "Selecionar"}
            </button>

            <button
              class="btn-secondary"
              style="font-size:13px;"
              onclick="openExperimentFormModalById('${exp.id}')"
            >
              Editar
            </button>

            <button
              class="btn-secondary"
              style="font-size:13px;"
              onclick="openExperimentScheduleModal('${exp.id}')"
            >
              Cronograma
            </button>

            ${
              typeof currentRole !== "undefined" && currentRole === "admin"
                ? `<button class="btn-danger" style="font-size:13px;"
                      onclick="confirmDeleteExperiment('${exp.id}', '${escapeHtml(
                        exp.code || ""
                      )}')">
                     Excluir
                   </button>`
                : ""
            }
          </div>
        </div>
      </div>
    `;
  })
  .join("");

listEl.innerHTML = cardsHtml;

async function openExperimentFormModalById(id) {
  if (!id || typeof s === "undefined") {
    return;
  }

  const { data, error } = await s
    .from("experiments")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    alert("Erro ao carregar experimento: " + error.message);
    return;
  }

  openExperimentFormModal(data);
}

// seleciona um experimento (apenas no front, por enquanto)
function selectExperiment(id) {
  if (!id || typeof s === "undefined") return;

  s.from("experiments")
    .select("*")
    .eq("id", id)
    .single()
    .then(({ data, error }) => {
      if (!error && data) {
        currentExperiment = data;
        loadExperimentsIntoList();
        alert(`Experimento "${data.code || ""}" selecionado.`);
      }
    });
}

// confirmação e exclusão
function confirmDeleteExperiment(id, code) {
  if (typeof currentRole === "undefined" || currentRole !== "admin") {
    alert("Apenas administradores podem excluir experimentos.");
    return;
  }
  if (!confirm(`Tem certeza que deseja excluir o experimento "${code}"? Esta ação não pode ser desfeita.`)) {
    return;
  }
  deleteExperiment(id);
}

async function deleteExperiment(id) {
  if (typeof s === "undefined") return;
  const { error } = await s.from("experiments").delete().eq("id", id);
  if (error) {
    alert("Erro ao excluir experimento: " + error.message);
    return;
  }
  if (currentExperiment && currentExperiment.id === id) {
    currentExperiment = null;
  }
  await loadExperimentsIntoList();
}

// =============================
// Modal de novo / editar experimento
// usa openModal e closeModal já existentes no app.js
// =============================

function openExperimentFormModal(exp) {
  const isEdit = !!exp;
  const title = isEdit ? "Editar experimento" : "Novo experimento";

  // valores padrão se não houver experimento ainda
  const blocks = exp?.blocks_count ?? 3;
  const plotsPerBlock = exp?.plots_per_block ?? 12;

  const plantsPerRow = 5;
  const plantsPerCol = 5;
  const usefulPlantsPerRow = 3;
  const usefulPlantsPerCol = 3;
  const usefulPlantsTotal =
    exp?.userful_plants_per_plot ??
    usefulPlantsPerRow * usefulPlantsPerCol;

  const plotLength = exp?.plot_length || "";
  const plotWidth = exp?.plot_width || "";
  const rowSpacing = exp?.row_spacing || "";

  const bodyHtml = `
    <form id="experimentForm">
      <!-- LOCALIZAÇÃO -->
      <div style="margin-bottom:12px;">
        <h3 style="font-size:15px; font-weight:700; color:var(--green-dark); margin-bottom:6px;">
          Localização
        </h3>

        <label for="expCode">Código do experimento</label>
        <input id="expCode" type="text"
          value="${escapeHtml(exp?.code || "")}"
          placeholder="Ex.: 001" />

        <label for="expName">Nome do experimento</label>
        <input id="expName" type="text"
          value="${escapeHtml(exp?.name || "")}"
          placeholder="Ex.: Posições de plantio em mandioca" />

        <label for="expObjective">Objetivo</label>
        <textarea id="expObjective" rows="3"
          style="width:100%; padding:9px 11px; border-radius:10px; border:1px solid var(--gray-200); font-size:14px; resize:vertical;"
          placeholder="Descreva o objetivo do experimento...">${escapeHtml(exp?.objective || "")}</textarea>

        <label for="expResearcher">Pesquisadores responsáveis</label>
<textarea id="expResearcher" rows="2"
  style="width:100%; padding:9px 11px; border-radius:10px; border:1px solid var(--gray-200); font-size:14px; resize:vertical;"
  placeholder="Ex.: Ricardo L. Ribeiro; (um por linha ou separados por ponto e vírgula)">
${escapeHtml(exp?.researcher || "")}</textarea>

        <label for="expPlantingDate">Data de plantio</label>
        <input id="expPlantingDate" type="date"
          value="${exp?.planting_date ? exp.planting_date.split("T")[0] : ""}" />
      </div>

      <!-- AMBIENTE -->
      <div style="margin-bottom:12px;">
        <h3 style="font-size:15px; font-weight:700; color:var(--green-dark); margin-bottom:6px;">
          Ambiente
        </h3>

        <label for="expFarm">Local / fazenda</label>
        <input id="expFarm" type="text"
          value="${escapeHtml(exp?.farm || "")}"
          placeholder="Ex.: EPAMIG ITAP" />

        <label for="expmunicipality">Município / Estado</label>
        <input id="expmunicipality" type="text"
          value="${escapeHtml(exp?.municipality || "")}"
          placeholder="Ex.: Pitangui - MG" />

        <label for="expLatitude">Latitude (DMS)</label>
        <input id="expLatitude" type="text"
          value="${escapeHtml(exp?.latitude || "")}"
          placeholder="Ex.: 19º44'24&quot;S" />

        <label for="expLongitude">Longitude (DMS)</label>
        <input id="expLongitude" type="text"
          value="${escapeHtml(exp?.longitude || "")}"
          placeholder="Ex.: 44º53'41&quot;O" />

        <label for="expSoilType">Tipo de solo</label>
        <input id="expSoilType" type="text"
          value="${escapeHtml(exp?.soil_type || "")}"
          placeholder="Ex.: Latossolo Vermelho-Amarelo" />

        <label for="expClimate">Clima</label>
        <input id="expClimate" type="text"
          value="${escapeHtml(exp?.climate || "")}"
          placeholder="Ex.: Cwa - Subtropical úmido com inverno seco" />
      </div>

      <!-- DELINEAMENTO E DIMENSÕES -->
      <div style="margin-bottom:12px;">
        <h3 style="font-size:15px; font-weight:700; color:var(--green-dark); margin-bottom:6px;">
          Delineamento e dimensões
        </h3>

        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <div style="flex:1 1 120px;">
            <label for="expBlocks">Número de blocos</label>
            <input id="expBlocks" type="number" min="1"
              value="${blocks}" />
          </div>
          <div style="flex:1 1 120px;">
            <label for="expPlotsPerBlock">Parcelas por bloco</label>
            <input id="expPlotsPerBlock" type="number" min="1"
              value="${plotsPerBlock}" />
          </div>
        </div>

        <div style="margin-top:8px; padding:8px 10px; border-radius:10px; background:var(--gray-50); font-size:13px; color:#4b5563;">
          Variedades fixas: Amarela, Amarelinha, Cacau, Sabará.<br/>
          Tratamentos fixos: vertical, inclinada, horizontal.
        </div>

        <div style="margin-top:10px;">
          <div style="font-size:13px; font-weight:600; margin-bottom:4px;">Disposição das plantas na parcela</div>
          <div style="display:flex; flex-wrap:wrap; gap:8px;">
  <div style="flex:1 1 120px;">
    <label for="expPlotLength">Comprimento (m)</label>
    <input id="expPlotLength" type="number" step="0.01" min="0"
      value="${plotLength}" />
  </div>
  <div style="flex:1 1 120px;">
    <label for="expPlotWidth">Largura (m)</label>
    <input id="expPlotWidth" type="number" step="0.01" min="0"
      value="${plotWidth}" />
  </div>
  <div style="flex:1 1 120px;">
    <label for="expRowSpacing">Espaç. linhas (m)</label>
    <input id="expRowSpacing" type="number" step="0.01" min="0"
      value="${rowSpacing}" />
  </div>
  <div style="flex:1 1 120px;">
    <label for="expPlantSpacing">Espaç. plantas (m)</label>
    <input id="expPlantSpacing" type="number" step="0.01" min="0"
      value="1.00" />
  </div>
</div>
        </div>

        <div style="margin-top:10px;">
          <div style="font-size:13px; font-weight:600; margin-bottom:4px;">Áreas (calculadas)</div>
          <div style="display:flex; flex-wrap:wrap; gap:8px; font-size:13px;">
            <div style="flex:1 1 140px;">
              <label>Plantas úteis/parcela</label>
              <input id="expUsefulPlantsTotal" type="number" min="1"
                value="${usefulPlantsTotal}" />
            </div>
            <div style="flex:1 1 140px;">
              <label>Área/parcela (m²)</label>
              <input id="expPlotArea" type="number" step="0.01" min="0"
                value="${exp?.plot_area || ""}" />
            </div>
            <div style="flex:1 1 160px;">
              <label>Área total (m²)</label>
              <input id="expTotalArea" type="number" step="0.01" min="0"
                value="${exp?.total_area || ""}" />
            </div>
          </div>
          <p style="font-size:12px; color:#6b7280; margin-top:4px;">
            Dica: após informar comprimento e largura, ajuste a área/parcela e área total manualmente se necessário.
          </p>
        </div>
      </div>
          
      <button type="button" class="btn-primary" style="margin-top:10px;"
        onclick="submitExperimentForm('${exp?.id || ""}')">
        ${isEdit ? "Salvar alterações" : "Criar experimento"}
      </button>
    </form>
  `;

  if (typeof openModal === "function") {
    openModal(title, bodyHtml);
  } else {
    alert("Função openModal não encontrada no app principal.");
  }
}

async function submitExperimentForm(id) {
  if (typeof s === "undefined") return;

  // helper para ler valor com segurança
  const val = (id) => {
    const el = document.getElementById(id);
    return el ? el.value : "";
  };

  // CAMPOS BÁSICOS
  const code = val("expCode").trim();
  const name = val("expName").trim();
  const objective = val("expObjective").trim();
  const researcher = val("expResearcher").trim();
  const planting_date = val("expPlantingDate") || null;

  // AMBIENTE / LOCAL
  const farm = val("expFarm").trim();
  const municipality = val("expmunicipality").trim();
  const latitude = val("expLatitude").trim();
  const longitude = val("expLongitude").trim();
  const soil_type = val("expSoilType").trim();
  const climate = val("expClimate").trim();

  // DELINEAMENTO
  const blocks_count = parseInt(val("expBlocks") || "0", 10);
  const plots_per_block = parseInt(val("expPlotsPerBlock") || "0", 10);

  const usefulRow = parseInt(val("expUsefulRow") || "0", 10);
  const usefulCol = parseInt(val("expUsefulCol") || "0", 10);
  const useful_plants_per_plot = parseInt(
    val("expUsefulPlantsTotal") || usefulRow * usefulCol || "0",
    10
  );

  // DIMENSÕES
  const plot_length = parseFloat(val("expPlotLength") || "0");
  const plot_width = parseFloat(val("expPlotWidth") || "0");
  const row_spacing = parseFloat(val("expRowSpacing") || "0");

  // ÁREAS (CALCULADAS SE ESTIVEREM VAZIAS)
  let plot_area = parseFloat(val("expPlotArea") || "0");
  if (!plot_area && plot_length && plot_width) {
    plot_area = plot_length * plot_width;
  }

  let total_area = parseFloat(val("expTotalArea") || "0");
  if (!total_area && plot_area && blocks_count && plots_per_block) {
    total_area = plot_area * blocks_count * plots_per_block;
  }

  const status = (document.getElementById("expStatus")?.value) || "active";

  if (!code || !planting_date || !objective) {
    alert("Preencha pelo menos código, data de plantio e objetivo.");
    return;
  }

  const payload = {
    code,
    name,
    objective,
    researcher,
    planting_date,
    farm,
    municipality,
    latitude,
    longitude,
    soil_type,
    climate,
    blocks_count,
    plots_per_block,
    useful_plants_per_plot,
    treatments_count: 3,
    plot_length,
    plot_width,
    row_spacing,
    plot_area,
    total_area,
    status,
    created_by:
      typeof currentUser !== "undefined" && currentUser ? currentUser.id : null,
  };

  let error;
  if (id) {
    ({ error } = await s.from("experiments").update(payload).eq("id", id));
  } else {
    ({ error } = await s.from("experiments").insert(payload));
  }

  if (error) {
    alert("Erro ao salvar experimento: " + error.message);
    return;
  }

  if (typeof closeModal === "function") {
    closeModal();
  }
  await loadExperimentsIntoList();
}

// =============================
// Helpers de segurança simples
// =============================

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function daysBetween(date1, date2) {
  if (!date1 || !date2) return null;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.round((d2 - d1) / oneDay);
}
function createScheduleRow(experiment, action) {
  const row = document.createElement('div');
  row.className = 'sched-row';

  // Botão status
  const statusBtn = document.createElement('button');
  statusBtn.type = 'button';
  statusBtn.className = 'sched-status-btn';
  statusBtn.textContent = action.completed_at ? '✔' : '○';
  row.appendChild(statusBtn);

  // Nome + DAP
  const nameSpan = document.createElement('span');
  nameSpan.style.flex = '1 1 auto';
  nameSpan.style.marginRight = '8px';
  const dap = daysBetween(experiment.planting_date, action.start_date);
  const dapText = dap != null ? ` (DAP ${dap})` : '';
  nameSpan.textContent = action.name + dapText;
  row.appendChild(nameSpan);

  // Datas
  const startInput = document.createElement('input');
  startInput.type = 'date';
  startInput.value = action.start_date || '';
  startInput.style.marginRight = '4px';
  row.appendChild(startInput);

  const endInput = document.createElement('input');
  endInput.type = 'date';
  endInput.value = action.end_date || '';
  endInput.style.marginRight = '4px';
  row.appendChild(endInput);

  // Delete
  const delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.textContent = '🗑';
  delBtn.className = 'btn-danger';
  row.appendChild(delBtn);

  // Cores de status
  function applyStatusColor() {
    row.classList.remove('sched-done', 'sched-late');
    const todayStr = new Date().toISOString().slice(0, 10);

    if (action.completed_at) {
      row.classList.add('sched-done');
      statusBtn.textContent = '✔';
    } else if (action.end_date && todayStr > action.end_date) {
      row.classList.add('sched-late');
      statusBtn.textContent = '○';
    } else {
      statusBtn.textContent = '○';
    }
  }

  applyStatusColor();

  // Eventos
  statusBtn.addEventListener('click', async () => {
    const newCompleted = action.completed_at ? null : new Date().toISOString();
    const { data, error } = await supabase
      .from('scheduled_actions')
      .update({ completed_at: newCompleted })
      .eq('id', action.id)
      .select()
      .single();

    if (!error) {
      action.completed_at = data.completed_at;
      applyStatusColor();
    }
  });

  startInput.addEventListener('change', async () => {
    const { data, error } = await supabase
      .from('scheduled_actions')
      .update({ start_date: startInput.value })
      .eq('id', action.id)
      .select()
      .single();
    if (!error) {
      action.start_date = data.start_date;
      const dap = daysBetween(experiment.planting_date, action.start_date);
      const dapText = dap != null ? ` (DAP ${dap})` : '';
      nameSpan.textContent = action.name + dapText;
    }
  });

  endInput.addEventListener('change', async () => {
    const { data, error } = await supabase
      .from('scheduled_actions')
      .update({ end_date: endInput.value })
      .eq('id', action.id)
      .select()
      .single();
    if (!error) {
      action.end_date = data.end_date;
      applyStatusColor();
    }
  });

  delBtn.addEventListener('click', async () => {
    const { error } = await supabase
      .from('scheduled_actions')
      .delete()
      .eq('id', action.id);
    if (!error) {
      row.remove();
    }
  });

  return row;
}
function renderScheduleList(experiment, actions) {
  const container = document.getElementById('schedListContainer');
  if (!container) return;

  container.innerHTML = '';

  const phases = ['pre-plantio', 'plantio', 'acompanhamento', 'tratos', 'colheita'];

  phases.forEach(phase => {
    const phaseActions = actions.filter(a => a.phase === phase);
    if (!phaseActions.length) return;

    const section = document.createElement('div');
    section.className = 'sched-phase-section';
    section.style.marginBottom = '8px';

    const title = document.createElement('h4');
    title.textContent = phase.toUpperCase();
    title.style.fontSize = '13px';
    title.style.margin = '6px 0';
    section.appendChild(title);

    phaseActions.forEach(a => {
      const row = createScheduleRow(experiment, a);
      section.appendChild(row);
    });

    container.appendChild(section);
  });
}
function setupScheduleUI(experiment) {
  const btnAdd = document.getElementById('btnAddSchedule');
  const nameInput = document.getElementById('schedName');
  const phaseSelect = document.getElementById('schedPhase');

  if (!btnAdd || !nameInput || !phaseSelect) return;

  btnAdd.onclick = async () => {
    const name = nameInput.value.trim();
    const phase = phaseSelect.value;
    if (!name) return;

    const { data, error } = await supabase
      .from('scheduled_actions')
      .insert({
        experiment_id: experiment.id,
        name,
        phase,
        start_date: null,
        end_date: null,
        completed_at: null,
      })
      .select()
      .single();

    if (!error && data) {
      nameInput.value = '';
      loadScheduleActions(experiment);
    } else {
      console.error('Erro ao adicionar ação:', error);
    }
  };
}
async function loadScheduleActions(experiment) {
  const { data, error } = await supabase
    .from('scheduled_actions')
    .select('*')
    .eq('experiment_id', experiment.id)
    .order('start_date', { ascending: true });

  if (error) {
    console.error('Erro ao carregar cronograma:', error);
    return;
  }
  async function openExperimentScheduleModal(experimentId) {
  // buscar experimento para ter planting_date e code
  const { data: exp, error } = await supabase
    .from('experiments')
    .select('*')
    .eq('id', experimentId)
    .single();

  if (error || !exp) {
    console.error('Erro ao carregar experimento para cronograma:', error);
    alert('Não foi possível carregar o cronograma deste experimento.');
    return;
  }

  const title = `Cronograma - ${exp.code || 'Experimento'}`;

  const bodyHtml = `
    <div style="margin-bottom:12px;">
      <div style="font-size:13px; color:#4b5563; margin-bottom:6px;">
        Data de plantio: ${exp.planting_date || '-'}
      </div>

      <div class="schedule-new-action" style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:10px;">
        <input id="schedName" type="text"
          placeholder="Nome da ação"
          style="flex:2 1 160px;" />

        <select id="schedPhase" style="flex:1 1 140px;">
          <option value="pre-plantio">Pré-plantio</option>
          <option value="plantio">Plantio</option>
          <option value="acompanhamento">Acompanhamento</option>
          <option value="tratos">Tratos culturais</option>
          <option value="colheita">Colheita</option>
        </select>

        <button type="button" id="btnAddSchedule"
          class="btn-secondary"
          style="flex:0 0 auto; align-self:flex-start;">
          Adicionar
        </button>
      </div>

      <div id="schedListContainer"></div>
    </div>
  `;

  if (typeof openModal === 'function') {
    openModal(title, bodyHtml);
  } else {
    alert('Função openModal não encontrada no app principal.');
    return;
  }

  // agora que o HTML foi colocado no DOM, inicializar cronograma
  setupScheduleUI(exp);
  loadScheduleActions(exp);
}

  renderScheduleList(experiment, data || []);
}

// serializa objeto para usar em atributo HTML sem quebrar aspas
function safeJson(obj) {
  if (!obj) return "null";
  return "'" + JSON.stringify(obj).replace(/'/g, "\\'").replace(/"/g, "&quot;") + "'";
}













