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
        Data de plantio: ${exp.planting_date || "-"}
      </div>

      <!-- Adicionar nova ação -->
      <div class="schedule-new-action"
           style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:10px;">
        <input id="schedName" type="text"
          placeholder="Nome da ação"
          style="flex:2 1 160px;" />

        <select id="schedPhase" style="flex:1 1 140px;">
          <option value="pre-plantio">Pré-plantio</option>
          <option value="plantio">Plantio</option>
          <option value="acompanhamento">Acompanhamento</option>
          <option value="tratos_culturais">Tratos culturais</option>
          <option value="colheita">Colheita</option>
        </select>


        <button type="button" id="btnAddSchedule"
          class="btn-secondary"
          style="flex:0 0 auto; align-self:flex-start;">
          Adicionar
        </button>
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

  // Nome + DAP
  const nameSpan = document.createElement("span");
  nameSpan.style.flex = "1 1 auto";
  nameSpan.style.marginRight = "8px";
  const dap = daysBetween(experiment.planting_date, action.start_date);
  const dapText = dap != null ? ` (DAP ${dap})` : "";
  nameSpan.textContent = action.name + dapText;
  row.appendChild(nameSpan);

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
      const dap = daysBetween(experiment.planting_date, action.start_date);
      const dapText = dap != null ? ` (DAP ${dap})` : "";
      nameSpan.textContent = action.name + dapText;
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

  const phases = ["pre-plantio", "plantio", "acompanhamento", "tratos", "colheita"];

  phases.forEach((phase) => {
    const phaseActions = actions.filter((a) => a.phase === phase);
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

  if (!btnAdd || !nameInput || !phaseSelect) return;

  btnAdd.onclick = async () => {
    const name = nameInput.value.trim();
    const phase = phaseSelect.value;
    if (!name) return;

    const { error } = await s
      .from("scheduled_actions")
      .insert({
        experiment_id: experiment.id,
        name,
        phase,
        start_date: null,
        end_date: null,
        completed_at: null,
      });

    if (!error) {
      nameInput.value = "";
      loadScheduleActions(experiment);
    } else {
      console.error("Erro ao adicionar ação:", error);
    }
  };
}

