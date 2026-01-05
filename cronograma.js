// cronograma.js
// Módulo independente para o cronograma dos experimentos

// Calcula diferença em dias entre duas datas (YYYY-MM-DD ou ISO)
function daysBetween(date1, date2) {
  if (!date1 || !date2) return null;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.round((d2 - d1) / oneDay);
}

// Formata data YYYY-MM-DD para DD/MM/YYYY
function formatDateBr(isoDate) {
  if (!isoDate) return "-";
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

async function openExperimentScheduleModal(experimentId) {
  if (typeof s === "undefined") {
    alert("Cliente Supabase não encontrado.");
    return;
  }

  const { data: exp, error } = await s
    .from("experiments")
    .select("*")
    .eq("id", experimentId)
    .single();

  if (error || !exp) {
    console.error("Erro ao carregar experimento para cronograma:", error);
    alert("Não foi possível carregar o cronograma deste experimento.");
    return;
  }

  const title = `Cronograma - ${exp.code || "Experimento"}`;

  const bodyHtml = `
  <div style="margin-bottom:12px;">
    <div style="font-size:13px; color:#4b5563; margin-bottom:6px;">
      Data de plantio: ${formatDateBr(exp.planting_date)}
    </div>

    <!-- Adicionar nova ação -->
    <div class="schedule-new-action"
         style="display:flex; flex-direction:column; gap:8px; margin-bottom:10px;">

      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <input id="schedName" type="text"
          placeholder="Nome da ação"
          style="flex:2 1 200px;" />

        <select id="schedPhase" style="flex:1 1 160px;">
          <option value="pre-plantio">Pré-plantio</option>
          <option value="plantio">Plantio</option>
          <option value="acompanhamento">Acompanhamento</option>
          <option value="tratos_culturais">Tratos culturais</option>
          <option value="colheita">Colheita</option>
        </select>
      </div>

      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <input id="schedOwner" type="text"
          placeholder="Responsável"
          style="flex:1 1 180px;" />

        <input id="schedDesc" type="text"
        placeholder="Descrição / observações"
        style="flex:1 1 500px;" />
      </div>

      <button type="button" id="btnAddSchedule"
        class="btn-secondary"
        style="align-self:flex-start;">
        Adicionar
      </button>
    </div>

    <!-- Cabeçalho da lista -->
    <div style="display:flex; gap:8px; font-size:12px; color:#6b7280; margin-bottom:4px;">
      <div style="width:24px;"></div>
      <div style="flex:1 1 auto;">Ação / fase / DAP / resp. / descrição</div>
      <div style="flex:0 0 120px;">Início</div>
      <div style="flex:0 0 120px;">Término</div>
      <div style="width:32px;"></div>
    </div>

    <!-- Lista de ações -->
    <div id="schedListContainer"></div>
  </div>
`;

  if (typeof openModal === "function") {
    openModal(title, bodyHtml);
  } else {
    alert("Função openModal não encontrada no app principal.");
    return;
  }

  // Inicializar UI e carregar ações existentes
  setupScheduleUI(exp);
  loadScheduleActions(exp);
}

function createScheduleRow(experiment, action) {
  const row = document.createElement("div");
  row.className = "sched-row";
  row.style.display = "flex";
  row.style.alignItems = "center";
  row.style.gap = "6px";
  row.style.marginBottom = "4px";

  // Botão status
  const statusBtn = document.createElement("button");
  statusBtn.type = "button";
  statusBtn.className = "sched-status-btn";
  statusBtn.textContent = action.completed_at ? "✔" : "○";
  row.appendChild(statusBtn);

 // Nome + DAP + resp + descrição
const nameSpan = document.createElement("span");
nameSpan.style.flex = "1 1 auto";
nameSpan.style.marginRight = "8px";

function updateNameText() {
  const dap = daysBetween(experiment.planting_date, action.start_date);
  const dapText = dap != null ? ` (DAP ${dap})` : "";

  const ownerText = action.owner ? ` • Resp.: ${action.owner}` : "";
  const descText = action.description ? ` • ${action.description}` : "";

  nameSpan.textContent = action.name + dapText + ownerText + descText;
}

updateNameText();
row.appendChild(nameSpan);
;

  // Datas
  const startInput = document.createElement("input");
  startInput.type = "date";
  startInput.value = action.start_date || "";
  row.appendChild(startInput);

  const endInput = document.createElement("input");
  endInput.type = "date";
  endInput.value = action.end_date || "";
  row.appendChild(endInput);

  // Delete
  const delBtn = document.createElement("button");
  delBtn.type = "button";
  delBtn.textContent = "🗑";
  delBtn.className = "btn-danger";
  row.appendChild(delBtn);

  // Cores de status
  function applyStatusColor() {
    row.classList.remove("sched-done", "sched-late");
    const todayStr = new Date().toISOString().slice(0, 10);

    if (action.completed_at) {
      row.classList.add("sched-done");
      statusBtn.textContent = "✔";
    } else if (action.end_date && todayStr > action.end_date) {
      row.classList.add("sched-late");
      statusBtn.textContent = "○";
    } else {
      statusBtn.textContent = "○";
    }
  }

  applyStatusColor();

  // Eventos Supabase
  statusBtn.addEventListener("click", async () => {
    const newCompleted = action.completed_at ? null : new Date().toISOString();
    const { data, error } = await s
      .from("scheduled_actions")
      .update({ completed_at: newCompleted })
      .eq("id", action.id)
      .select()
      .single();

    if (!error) {
      action.completed_at = data.completed_at;
      applyStatusColor();
    }
  });

  startInput.addEventListener("change", async () => {
  const { data, error } = await s
    .from("scheduled_actions")
    .update({ start_date: startInput.value })
    .eq("id", action.id)
    .select()
    .single();

  if (!error) {
    action.start_date = data.start_date;
    updateNameText();
  }
});

  endInput.addEventListener("change", async () => {
    const { data, error } = await s
      .from("scheduled_actions")
      .update({ end_date: endInput.value })
      .eq("id", action.id)
      .select()
      .single();

    if (!error) {
      action.end_date = data.end_date;
      applyStatusColor();
    }
  });

  delBtn.addEventListener("click", async () => {
    const { error } = await s
      .from("scheduled_actions")
      .delete()
      .eq("id", action.id);

    if (!error) {
      row.remove();
    }
  });

  return row;
} // <-- ESTA chave fecha createScheduleRow

function renderScheduleList(experiment, actions) {
  const container = document.getElementById("schedListContainer");
  if (!container) return;

  container.innerHTML = "";

  // Ordena por start_date, nulos por último
  const sorted = [...actions].sort((a, b) => {
    if (!a.start_date && !b.start_date) return 0;
    if (!a.start_date) return 1;   // a sem data vai para baixo
    if (!b.start_date) return -1;  // b sem data vai para baixo

    return a.start_date.localeCompare(b.start_date);
  });

  const phases = ["pre-plantio", "plantio", "acompanhamento", "tratos_culturais", "colheita"];

  phases.forEach((phase) => {
    const phaseActions = sorted.filter((a) => a.phase === phase);
    if (!phaseActions.length) return;

    const section = document.createElement("div");
    section.className = "sched-phase-section";
    section.style.marginBottom = "8px";

    const title = document.createElement("h4");
    title.textContent = phase.toUpperCase();
    title.style.fontSize = "13px";
    title.style.margin = "6px 0";
    section.appendChild(title);

    phaseActions.forEach((a) => {
      section.appendChild(createScheduleRow(experiment, a));
    });

    container.appendChild(section);
  });
}

async function loadScheduleActions(experiment) {
  if (typeof s === "undefined") return;

  const { data, error } = await s
    .from("scheduled_actions")
    .select("*")
    .eq("experiment_id", experiment.id)
    .order("start_date", { ascending: true });

  if (error) {
    console.error("Erro ao carregar cronograma:", error);
    return;
  }

  renderScheduleList(experiment, data || []);
}

function setupScheduleUI(experiment) {
  const btnAdd = document.getElementById("btnAddSchedule");
  const nameInput = document.getElementById("schedName");
  const phaseSelect = document.getElementById("schedPhase");
  const ownerInput = document.getElementById("schedOwner");
  const descInput = document.getElementById("schedDesc");

  if (!btnAdd || !nameInput || !phaseSelect) return;

  btnAdd.onclick = async () => {
    const name = nameInput.value.trim();
    const phase = phaseSelect.value;
    const owner = ownerInput?.value.trim() || null;
    const description = descInput?.value.trim() || null;
    if (!name) return;

    const { error } = await s
      .from("scheduled_actions")
      .insert({
        experiment_id: experiment.id,
        name,
        phase,
        owner,
        description,
        start_date: null,
        end_date: null,
        completed_at: null,
      });

    if (!error) {
      nameInput.value = "";
      if (ownerInput) ownerInput.value = "";
      if (descInput) descInput.value = "";
      loadScheduleActions(experiment);
    } else {
      console.error("Erro ao adicionar ação:", error);
    }
  };
}
async function loadScheduleSummary(experimentId) {
  if (typeof s === "undefined") return;

  const container = document.querySelector(
    `.card[data-experiment-id="${experimentId}"] .sched-summary`
  );
  if (!container) return;

  const { data, error } = await s
    .from("scheduled_actions")
    .select("end_date, completed_at")
    .eq("experiment_id", experimentId);

  if (error) {
    container.textContent = "Cronograma: erro ao carregar";
    console.error("Erro resumo cronograma:", error);
    return;
  }

  const actions = data || [];
  if (!actions.length) {
    container.textContent = "Cronograma: nenhuma ação cadastrada";
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  let done = 0;
  let late = 0;

  actions.forEach((a) => {
    if (a.completed_at) {
      done += 1;
    } else if (a.end_date && today > a.end_date) {
      late += 1;
    }
  });

  const total = actions.length;
  const partes = [`${total} ação${total !== 1 ? "s" : ""}`];
  if (late > 0) partes.push(`${late} atrasada${late !== 1 ? "s" : ""}`);
  if (done > 0) partes.push(`${done} concluída${done !== 1 ? "s" : ""}`);

  container.textContent = "Cronograma: " + partes.join(" · ");
}














