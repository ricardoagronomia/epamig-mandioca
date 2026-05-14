// experiments.js
// Versão simplificada para Hostinger, sem Supabase, apenas interface básica

// estado local do módulo
let currentExperiment = null;
window.currentExperiment = window.currentExperiment || null;
window.experiments = window.experiments || [];

// usa formatDate que já existe no app.js, se disponível
function formatExperimentDate(dateString) {
  if (typeof formatDate === "function") {
    return formatDate(dateString);
  }
  if (!dateString) return "-";
  const [y, m, d] = String(dateString).split("T")[0].split("-");
  if (!y || !m || !d) return String(dateString);
  return `${d}/${m}/${y}`;
}

// página principal de Experimentos (sem Supabase)
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
        <div class="content-subtitle">
          Apenas administradores ou pesquisadores podem gerenciar experimentos.
        </div>
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
        Versão temporária sem conexão com banco. Em breve: integração com MariaDB.
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
      <div class="card" style="text-align:center; padding:32px 16px;">
        <div style="font-size:40px; margin-bottom:8px; color:#6b7280;">🧪</div>
        <div style="font-size:18px; font-weight:700; color:#111827;">
          Nenhum experimento carregado da base
        </div>
        <div style="font-size:14px; color:#6b7280; margin-top:4px;">
          A integração com o banco MariaDB ainda será configurada.
        </div>
      </div>
    </div>
  `;

  const btnNew = document.getElementById("btnNewExperiment");
  if (btnNew) {
    btnNew.onclick = () => openExperimentFormModal();
  }
}

// Modal de novo / editar experimento (somente front, sem salvar em banco)
function openExperimentFormModal(exp) {
  const isEdit = !!exp;
  const title = isEdit ? "Editar experimento (modo offline)" : "Novo experimento (modo offline)";

  const plantingDate = exp?.planting_date ? exp.planting_date.split("T")[0] : "";

  const bodyHtml = `
    <form id="experimentForm">
      <div style="margin-bottom:12px;">
        <h3 style="font-size:15px; font-weight:700; color:var(--green-dark); margin-bottom:6px;">
          Informações básicas
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

        <label for="expPlantingDate">Data de plantio</label>
        <input id="expPlantingDate" type="date"
          value="${plantingDate}" />
      </div>

      <p style="font-size:13px; color:#6b7280; margin-bottom:12px;">
        Esta é uma versão apenas de interface, ainda sem salvar no banco MariaDB.
      </p>

      <button type="button" class="btn-primary" style="margin-top:10px;"
        onclick="submitExperimentFormOffline()">
        ${isEdit ? "OK" : "OK"}
      </button>
    </form>
  `;

  if (typeof openModal === "function") {
    openModal(title, bodyHtml);
  } else {
    alert("Função openModal não encontrada no app principal.");
  }
}

// Apenas fecha o modal e mostra um alerta (sem banco)
function submitExperimentFormOffline() {
  alert("Formulário de experimento preenchido (modo offline, sem salvar no banco).");

  if (typeof closeModal === "function") {
    closeModal();
  }
}

// Helper para escapar HTML (mantido do original)
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
