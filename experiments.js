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
                onclick="openExperimentFormModal(${safeJson(exp)})"
              >
                Editar
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

  const bodyHtml = `
    <form id="experimentForm">
      <label for="expCode">Código do experimento</label>
      <input id="expCode" type="text" value="${escapeHtml(exp?.code || "")}"
        placeholder="Ex.: EXP-2025-01" />

      <label for="expName">Título / descrição</label>
      <input id="expName" type="text" value="${escapeHtml(exp?.name || "")}"
        placeholder="Ex.: Mandioca DBC 4x3 - ITAP" />

      <label for="expPlantingDate">Data de plantio</label>
      <input id="expPlantingDate" type="date"
        value="${exp?.planting_date ? exp.planting_date.split("T")[0] : ""}" />

      <label for="expFarm">Local / fazenda</label>
      <input id="expFarm" type="text" value="${escapeHtml(exp?.farm || "")}"
        placeholder="Ex.: EPAMIG-ITAP - Olericultura" />

      <label for="expStatus">Status</label>
      <select id="expStatus">
        <option value="active" ${exp?.status === "active" ? "selected" : ""}>Ativo</option>
        <option value="finished" ${exp?.status === "finished" ? "selected" : ""}>Concluído</option>
      </select>

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

  const code = document.getElementById("expCode").value.trim();
  const name = document.getElementById("expName").value.trim();
  const planting_date = document.getElementById("expPlantingDate").value || null;
  const farm = document.getElementById("expFarm").value.trim();
  const status = document.getElementById("expStatus").value;

  if (!code || !planting_date) {
    alert("Preencha pelo menos código e data de plantio.");
    return;
  }

  const payload = {
    code,
    name,
    planting_date,
    farm,
    status,
    created_by: typeof currentUser !== "undefined" && currentUser ? currentUser.id : null,
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

// serializa objeto para usar em atributo HTML sem quebrar aspas
function safeJson(obj) {
  if (!obj) return "null";
  return "'" + JSON.stringify(obj).replace(/'/g, "\\'").replace(/"/g, "&quot;") + "'";
}
