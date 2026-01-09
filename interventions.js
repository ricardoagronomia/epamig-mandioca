// interventions.js
// Página de Intervenções (diário de campo) – placeholder estático

(function () {
  window.renderInterventionsPage = renderInterventionsPage;

  function renderInterventionsPage(container) {
    const experiment = window.currentExperiment || null;

    container.innerHTML = `
      <div class="content-header">
        <div class="content-title">Intervenções</div>
        <div class="content-subtitle">
          Diário de campo com adubações, tratos culturais, controles e outras operações na área experimental.
        </div>
      </div>

      <!-- Header + botão Nova Intervenção -->
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
          <button class="btn-primary" style="width:auto; padding-inline:18px;" disabled>
            Nova intervenção (em desenvolvimento)
          </button>
        </div>
      </div>

      <!-- Card de estatísticas -->
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
            Intervenções registradas
          </div>
          <div style="font-size:13px; color:#6b7280;">
            Em breve: resumo por tipo de intervenção, blocos afetados e datas das últimas operações.
          </div>
        </div>
      </div>

      <!-- Formulário mockado -->
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <div style="font-size:14px; font-weight:600; color:#065f46;">
            Registro de intervenção (em desenvolvimento)
          </div>
          <span style="font-size:12px; color:#6b7280;">
            Layout do formulário para cadastro/edição de intervenções agrícolas.
          </span>
        </div>

        <div style="display:flex; flex-wrap:wrap; gap:10px; font-size:13px; color:#374151;">
          <div style="flex:1 1 160px;">
            <label>Data</label>
            <input type="date" disabled />
          </div>

          <div style="flex:1 1 200px;">
            <label>Tipo de intervenção</label>
            <select disabled>
              <option>Adubação de cobertura</option>
              <option>Adubação foliar</option>
              <option>Controle de plantas daninhas</option>
              <option>Controle de pragas</option>
              <option>Controle de doenças</option>
              <option>Irrigação</option>
              <option>Capina manual</option>
              <option>Amontoa</option>
              <option>Outro</option>
            </select>
          </div>

          <div style="flex:1 1 120px;">
            <label>Bloco</label>
            <select disabled>
              <option>Todos</option>
              <option>Bloco 1</option>
              <option>Bloco 2</option>
              <option>Bloco 3</option>
            </select>
          </div>

          <div style="flex:1 1 160px;">
            <label>Parcela</label>
            <select disabled>
              <option>Todas</option>
              <option>B1P1</option>
              <option>B1P2</option>
            </select>
          </div>

          <div style="flex:1 1 200px;">
            <label>Produto/insumo</label>
            <input type="text" placeholder="Nome comercial ou ingrediente ativo" disabled />
          </div>

          <div style="flex:1 1 180px;">
            <label>Dosagem</label>
            <input type="text" placeholder="Ex. 2 L/ha, 200 kg/ha" disabled />
          </div>

          <div style="flex:1 1 180px;">
            <label>Método de aplicação</label>
            <input type="text" placeholder="Ex. costal, tratorizado, manual" disabled />
          </div>
        </div>

        <div style="margin-top:8px;">
          <label>Observações</label>
          <textarea rows="3" style="width:100%; padding:9px 11px; border-radius:10px; border:1px solid #e5e7eb; font-size:14px; resize:vertical;" disabled
            placeholder="Detalhes da operação, condições climáticas, histórico da área, etc."></textarea>
        </div>

        <div style="margin-top:10px; display:flex; gap:8px; justify-content:flex-end;">
          <button class="btn-secondary" style="opacity:0.7; cursor:default;">Cancelar</button>
          <button class="btn-primary" style="width:auto; padding-inline:18px; opacity:0.7; cursor:default;">
            Salvar intervenção
          </button>
        </div>
      </div>

      <!-- Lista de intervenções -->
      <div class="card">
        <div style="font-size:14px; font-weight:600; color:#065f46; margin-bottom:6px;">
          Diário de campo (em desenvolvimento)
        </div>
        <p style="font-size:13px; color:#6b7280; margin-bottom:8px;">
          Aqui serão listadas as intervenções registradas, com tipo, data, área alvo (todos / bloco / parcela),
          produto e dosagem, além das ações de edição e exclusão (com controle por nível de acesso).
        </p>

        <div style="
          border-radius:10px;
          border:1px dashed #d1d5db;
          padding:10px 12px;
          font-size:13px;
          color:#6b7280;
          background:#f9fafb;
        ">
          Nenhuma intervenção registrada ainda.
          <br>
          <span style="font-size:12px;">
            Após definir os detalhes com o orientador, esta página será ligada ao banco de dados,
            timeline do experimento e auditoria de alterações.
          </span>
        </div>
      </div>
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
