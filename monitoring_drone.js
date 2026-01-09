// monitoring_drone.js
// Página de Monitoramento Drone (placeholder estático, sem lógica ainda)

(function () {
  window.renderMonitoringDronePage = renderMonitoringDronePage;

  function renderMonitoringDronePage(container) {
    const experiment = window.currentExperiment || null;

    container.innerHTML = `
      <div class="content-header">
        <div class="content-title">Monitoramento por drone</div>
        <div class="content-subtitle">
          Registre voos de drone, parâmetros de captura e índices gerados (NDVI, cobertura, etc.).
        </div>
      </div>

      <!-- Header + botão Novo Voo -->
      <div class="card">
        <div style="display:flex; flex-wrap:wrap; gap:10px; align-items:center; justify-content:space-between;">
          <div style="font-size:13px; color:#4b5563;">
            ${experiment
              ? `
                Experimento <strong>${escapeHtml(experiment.code || "")}</strong> ·
                ${escapeHtml(experiment.name || "Sem nome")}<br>
                <span style="font-size:12px; color:#6b7280;">
                  Configure voos de drone associados a este experimento.
                </span>
              `
              : `
                <span style="color:#6b7280;">
                  Nenhum experimento selecionado. Selecione um experimento na aba "Experimentos" para vincular voos de drone.
                </span>
              `}
          </div>
          <button class="btn-primary" style="width:auto; padding-inline:18px;" disabled>
            Novo voo (em desenvolvimento)
          </button>
        </div>
      </div>

      <!-- Card de estatísticas -->
      <div class="card" style="display:flex; flex-wrap:wrap; gap:12px; align-items:center;">
        <div style="
          width:48px; height:48px; border-radius:14px;
          background:#dbeafe;
          display:flex; align-items:center; justify-content:center;
          color:#1d4ed8; font-size:24px;
        ">
          ✈️
        </div>
        <div style="flex:1 1 180px;">
          <div style="font-size:14px; font-weight:600; color:#1f2937;">
            Voos de drone
          </div>
          <div style="font-size:13px; color:#6b7280;">
            Em breve: resumo de voos realizados, área coberta e índices médios por experimento.
          </div>
        </div>
      </div>

      <!-- Formulário mockado (somente leitura, para demonstração) -->
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <div style="font-size:14px; font-weight:600; color:#065f46;">
            Configuração de voo (em desenvolvimento)
          </div>
          <span style="font-size:12px; color:#6b7280;">
            Layout do formulário para cadastro/edição de voos.
          </span>
        </div>

        <div style="display:flex; flex-wrap:wrap; gap:10px; font-size:13px; color:#374151;">
          <div style="flex:1 1 160px;">
            <label>Data do voo</label>
            <input type="date" disabled />
          </div>
          <div style="flex:1 1 140px;">
            <label>Horário</label>
            <input type="time" disabled />
          </div>
          <div style="flex:1 1 200px;">
            <label>Operador</label>
            <input type="text" placeholder="Nome do operador" disabled />
          </div>
          <div style="flex:1 1 140px;">
            <label>Bloco</label>
            <select disabled>
              <option>Todos os blocos</option>
            </select>
          </div>
          <div style="flex:1 1 140px;">
            <label>Altitude (m)</label>
            <input type="number" placeholder="Ex. 80" disabled />
          </div>
          <div style="flex:1 1 140px;">
            <label>Imagens capturadas</label>
            <input type="number" placeholder="Ex. 120" disabled />
          </div>
          <div style="flex:1 1 140px;">
            <label>Índice de cobertura (%)</label>
            <input type="number" placeholder="0–100" disabled />
          </div>
          <div style="flex:1 1 140px;">
            <label>NDVI médio</label>
            <input type="number" step="0.01" placeholder="0,00–1,00" disabled />
          </div>
        </div>

        <div style="margin-top:8px;">
          <label>Observações</label>
          <textarea rows="3" style="width:100%; padding:9px 11px; border-radius:10px; border:1px solid #e5e7eb; font-size:14px; resize:vertical;" disabled
            placeholder="Notas sobre o voo, condições climáticas, problemas na captura, etc."></textarea>
        </div>

        <div style="margin-top:10px; display:flex; gap:8px; justify-content:flex-end;">
          <button class="btn-secondary" style="opacity:0.7; cursor:default;">Cancelar</button>
          <button class="btn-primary" style="width:auto; padding-inline:18px; opacity:0.7; cursor:default;">
            Salvar voo
          </button>
        </div>
      </div>

      <!-- Lista de registros -->
      <div class="card">
        <div style="font-size:14px; font-weight:600; color:#065f46; margin-bottom:6px;">
          Registros de voos (em desenvolvimento)
        </div>
        <p style="font-size:13px; color:#6b7280; margin-bottom:8px;">
          Aqui serão listados os voos cadastrados para este experimento, com horário, operador, bloco, quantidade de imagens e índices calculados.
        </p>

        <div style="
          border-radius:10px;
          border:1px dashed #d1d5db;
          padding:10px 12px;
          font-size:13px;
          color:#6b7280;
          background:#f9fafb;
        ">
          Nenhum voo cadastrado ainda.
          <br>
          <span style="font-size:12px;">
            Após definir as métricas com o orientador, esta seção será ligada ao banco de dados
            para registrar voos, permitir edição e exclusão (com controle de permissões).
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
