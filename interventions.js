// interventions.js
// Página de Intervenções (diário de campo)

(function () {
  let currentInterventionEditId = null;

  window.renderInterventionsPage = renderInterventionsPage;

  function renderInterventionsPage(container) {
    const experiment = window.currentExperiment || null;
    const isVisitor = window.currentRole === "visitor";

    container.innerHTML = `
      <div class="content-header">
        <div class="content-title">Intervenções</div>
        <div class="content-subtitle">
          Diário de campo com adubações, tratos culturais, controles e outras operações na área experimental.
        </div>
      </div>

      <!-- Header do experimento atual -->
      <div class="card">
        <div style="display:flex; flex-wrap:wrap; gap:10px; align-items:center; justify-content:space-between;">
          <div style="font-size:13px; color:#4b5563;">
            ${
              experiment
                ? `
              Experimento <strong>${escapeHtml(experiment.code || "")}</strong> ·
              ${escapeHtml(experiment.name || "Sem nome")}<br>
              <span style="font-size:12px; color:#6b7280;">
                Registre intervenções aplicadas em todos os blocos, em um bloco específico ou em parcelas pontuais.
              </span>
            `
                : `
              <span style="color:#6b7280;">
                Nenhum experimento selecionado. Selecione um experimento na aba "Experimentos" para vincular intervenções.
              </span>
            `
            }
          </div>
        </div>
      </div>

      <!-- Card de estatísticas rápidas -->
      <div class="card" style="display:flex; flex-wrap:wrap; gap:12px; align-items:center;">
        <div style="
          width:48px; height:48px; border-radius:14px;
          background:#fef3c7;
          display:flex; align-items:center; justify-content:center;
          color:#b45309; font-size:24px;
        ">
          📅
        </div>
        <div style="flex:1 1 220px;">
          <div style="font-size:14px; font-weight:600; color:#1f2937;">
            <span id="interventionCount">–</span> intervenções registradas
          </div>
          <div style="font-size:13px; color:#6b7280;">
            ${experiment ? `Experimento ${escapeHtml(experiment.code || "")}` : "Selecione um experimento"}
          </div>
        </div>
      </div>

      <!-- Formulário de registro -->
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <div style="font-size:14px; font-weight:600; color:#065f46;">
            Registro de intervenção
          </div>
        </div>

        <div style="display:flex; flex-wrap:wrap; gap:10px; font-size:13px; color:#374151;">
          <div style="flex:1 1 160px;">
            <label for="intDate">Data</label>
            <input type="date" id="intDate" ${isVisitor ? "disabled" : ""} />
          </div>

          <div style="flex:1 1 200px;">
            <label for="intType">Tipo de intervenção</label>
            <select id="intType" ${isVisitor ? "disabled" : ""}>
              <option value="adubacao_cobertura">Adubação de cobertura</option>
              <option value="adubacao_foliar">Adubação foliar</option>
              <option value="controle_plantas_daninhas">Controle de plantas daninhas</option>
              <option value="controle_pragas">Controle de pragas</option>
              <option value="controle_doencas">Controle de doenças</option>
              <option value="irrigacao">Irrigação</option>
              <option value="capina_manual">Capina manual</option>
              <option value="amontoa">Amontoa</option>
              <option value="outro">Outro</option>
            </select>
          </div>

          <div style="flex:1 1 120px;">
            <label for="intBlock">Bloco</label>
            <select id="intBlock" ${isVisitor ? "disabled" : ""}>
              <option value="">Todos</option>
              <option value="1">Bloco 1</option>
              <option value="2">Bloco 2</option>
              <option value="3">Bloco 3</option>
              <option value="4">Bloco 4</option>
            </select>
          </div>

          <div style="flex:1 1 160px;">
            <label for="intPlot">Parcela</label>
            <input type="text" id="intPlot" placeholder="Ex: B1P1 ou vazio" ${isVisitor ? "disabled" : ""} />
          </div>

          <div style="flex:1 1 200px;">
            <label for="intProduct">Produto/insumo</label>
            <input type="text" id="intProduct" placeholder="Nome comercial ou ingrediente" ${isVisitor ? "disabled" : ""} />
          </div>

          <div style="flex:1 1 180px;">
            <label for="intDosage">Dosagem</label>
            <input type="text" id="intDosage" placeholder="Ex. 2 L/ha, 200 kg/ha" ${isVisitor ? "disabled" : ""} />
          </div>

          <div style="flex:1 1 180px;">
            <label for="intMethod">Método de aplicação</label>
            <input type="text" id="intMethod" placeholder="Ex. costal, tratorizado" ${isVisitor ? "disabled" : ""} />
          </div>
        </div>

        <div style="margin-top:8px;">
          <label for="intNotes">Observações</label>
          <textarea id="intNotes" rows="3" 
            style="width:100%; padding:9px 11px; border-radius:10px; border:1px solid #e5e7eb; font-size:14px; resize:vertical;"
            placeholder="Detalhes da operação, condições climáticas, histórico da área, etc."
            ${isVisitor ? "disabled" : ""}></textarea>
        </div>

        <div style="margin-top:10px; display:flex; gap:8px; justify-content:flex-end;">
          <button class="btn-secondary" onclick="clearInterventionForm()" ${isVisitor ? "disabled" : ""}>
            Cancelar
          </button>
          <button class="btn-primary" style="width:auto; padding-inline:18px;" 
            onclick="saveIntervention()" ${isVisitor ? "disabled" : ""}>
            Salvar intervenção
          </button>
        </div>
      </div>

      <!-- Lista de intervenções -->
      <div class="card">
        <div style="font-size:14px; font-weight:600; color:#065f46; margin-bottom:6px;">
          Diário de campo
        </div>
        <p style="font-size:13px; color:#6b7280; margin-bottom:8px;">
          Intervenções registradas no experimento, com tipo, data, área alvo e dosagem.
        </p>

        <div style="overflow-x:auto;">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Bloco</th>
                <th>Parcela</th>
                <th>Produto</th>
                <th>Dosagem</th>
                <th style="width:90px;">Ações</th>
              </tr>
            </thead>
            <tbody id="interventionsTableBody">
              <!-- preenchido dinamicamente -->
            </tbody>
          </table>
        </div>
      </div>
    `;

    if (typeof loadInterventions === "function") {
      loadInterventions();
    }
  }

  window.saveIntervention = async function saveIntervention() {
    if (window.currentRole === "visitor") {
      alert("Visitantes têm acesso somente leitura.");
      return;
    }

    if (typeof s === "undefined") {
      alert("Cliente Supabase não disponível.");
      return;
    }

    const experiment = window.currentExperiment;
    if (!experiment || !experiment.id) {
      alert("Nenhum experimento selecionado.");
      return;
    }

    const date = document.getElementById("intDate")?.value || null;
    const type = document.getElementById("intType")?.value || null;
    const block = document.getElementById("intBlock")?.value || null;
    const plot = document.getElementById("intPlot")?.value || null;
    const product = document.getElementById("intProduct")?.value || null;
    const dosage = document.getElementById("intDosage")?.value || null;
    const method = document.getElementById("intMethod")?.value || null;
    const notes = document.getElementById("intNotes")?.value || null;

    if (!date || !type) {
      alert("Informe ao menos a data e o tipo de intervenção.");
      return;
    }

    const payload = {
      experiment_id: experiment.id,
      intervention_date: date,  
      intervention_type: type,
      block_number: block || null,
      plot_code: plot || null,
      product: product || null,
      dosage: dosage || null,
      method: method || null,
      notes: notes || null,
    };

    try {
      if (currentInterventionEditId) {
        const { error } = await s
          .from("interventions")
          .update(payload)
          .eq("id", currentInterventionEditId);
        if (error) throw error;
      } else {
        const { error } = await s.from("interventions").insert(payload);
        if (error) throw error;
      }

      clearInterventionForm();
      if (typeof loadInterventions === "function") {
        loadInterventions();
      }
      alert("Intervenção salva com sucesso.");
    } catch (err) {
      console.error("Erro ao salvar intervenção:", err);
      alert("Erro ao salvar intervenção.");
    }
  };

  window.loadInterventions = async function loadInterventions() {
    if (typeof s === "undefined") {
      console.warn("Supabase client não disponível.");
      return;
    }

    const experiment = window.currentExperiment;
    const tbody = document.querySelector("#interventionsTableBody");
    const countSpan = document.getElementById("interventionCount");

    if (!tbody) return;

    if (!experiment || !experiment.id) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; font-size:13px; color:#6b7280;">
            Nenhum experimento selecionado.
          </td>
        </tr>
      `;
      if (countSpan) countSpan.textContent = "–";
      return;
    }

    try {
      const { data, error } = await s
        .from("interventions")
        .select("*")
        .eq("experiment_id", experiment.id)
        .order("intervention_date", { ascending: false });

      if (error) throw error;

      if (countSpan) countSpan.textContent = (data || []).length;

      if (!data || data.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align:center; font-size:13px; color:#6b7280;">
              Nenhuma intervenção registrada ainda.
            </td>
          </tr>
        `;
        return;
      }

      const formatDate = (iso) => {
        if (!iso) return "";
        const [y, m, d] = iso.split("-");
        return `${d}/${m}/${y}`;
      };

      const typeLabel = (type) => {
        const labels = {
          adubacao_cobertura: "Adubação cobertura",
          adubacao_foliar: "Adubação foliar",
          controle_plantas_daninhas: "Controle daninhas",
          controle_pragas: "Controle pragas",
          controle_doencas: "Controle doenças",
          irrigacao: "Irrigação",
          capina_manual: "Capina manual",
          amontoa: "Amontoa",
          outro: "Outro",
        };
        return labels[type] || type;
      };

      const isVisitor = window.currentRole === "visitor";

      tbody.innerHTML = data
        .map(
          (row) => `
          <tr>
            <td>${formatDate(row.intervention_date)}</td>  // <<< era row.date
            <td>${typeLabel(row.intervention_type)}</td>
            <td>${row.block_number ? "Bloco " + row.block_number : "Todos"}</td>
            <td>${row.plot_code || "–"}</td>
            <td>${row.product || "–"}</td>  // <<< era row.product_name
            <td>${row.dosage || "–"}</td>
            <td>
              <div style="display:flex; flex-wrap:nowrap; gap:4px; justify-content:flex-end;">
                ${
                  isVisitor
                    ? `<span style="font-size:11px; color:#9ca3af;">Somente leitura</span>`
                    : `
                      <button type="button" class="btn-secondary"
                        style="font-size:12px; padding:4px 8px;"
                        onclick='openInterventionEdit(${JSON.stringify(row)})'>
                        Editar
                      </button>
                      <button type="button" class="btn-danger"
                        style="font-size:12px; padding:4px 8px;"
                        onclick="confirmDeleteIntervention('${row.id}')">
                        Excluir
                      </button>
                    `
                }
              </div>
            </td>
          </tr>
        `
        )
        .join("");
     } catch (err) {
    console.error("Erro ao carregar intervenções:", err);
    console.error("Detalhes do erro:", err.message, err.details, err.hint);
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; font-size:13px; color:#b91c1c;">
          Erro ao carregar intervenções: ${err.message || "Erro desconhecido"}
        </td>
      </tr>
    `;
  }

  };

  window.openInterventionEdit = function openInterventionEdit(row) {
    if (window.currentRole === "visitor") return;

    currentInterventionEditId = row.id;

    document.getElementById("intDate").value = row.intervention_date || "";  // <<< era row.date
    document.getElementById("intType").value = row.intervention_type || "";
    document.getElementById("intBlock").value = row.block_number || "";
    document.getElementById("intPlot").value = row.plot_code || "";
    document.getElementById("intProduct").value = row.product || "";  // <<< era row.product_name
    document.getElementById("intDosage").value = row.dosage || "";
    document.getElementById("intMethod").value = row.method || "";  // <<< era row.application_method
    document.getElementById("intNotes").value = row.notes || "";

    const btn = document.querySelector('button[onclick="saveIntervention()"]');
    if (btn) btn.textContent = "Atualizar intervenção";
  };

  window.clearInterventionForm = function clearInterventionForm() {
    currentInterventionEditId = null;

    document.getElementById("intDate").value = "";
    document.getElementById("intType").value = "adubacao_cobertura";
    document.getElementById("intBlock").value = "";
    document.getElementById("intPlot").value = "";
    document.getElementById("intProduct").value = "";
    document.getElementById("intDosage").value = "";
    document.getElementById("intMethod").value = "";
    document.getElementById("intNotes").value = "";

    const btn = document.querySelector('button[onclick="saveIntervention()"]');
    if (btn) btn.textContent = "Salvar intervenção";
  };

  window.confirmDeleteIntervention = async function confirmDeleteIntervention(id) {
    if (window.currentRole === "visitor") {
      alert("Visitantes não podem excluir intervenções.");
      return;
    }

    if (!id) return;
    if (!confirm("Deseja excluir esta intervenção?")) return;

    if (typeof s === "undefined") {
      alert("Cliente Supabase não disponível.");
      return;
    }

    try {
      const { error } = await s.from("interventions").delete().eq("id", id);
      if (error) throw error;

      if (typeof loadInterventions === "function") {
        loadInterventions();
      }
    } catch (err) {
      console.error("Erro ao excluir intervenção:", err);
      alert("Erro ao excluir intervenção.");
    }
  };

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "'")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
})();
