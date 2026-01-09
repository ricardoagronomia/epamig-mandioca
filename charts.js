// charts.js
// Página de Gráficos – visão geral do experimento (placeholder)

(function () {
  window.renderChartsPage = renderChartsPage;

  function renderChartsPage(container) {
    const experiment = window.currentExperiment || null;

    container.innerHTML = `
      <div class="content-header">
        <div class="content-title">Gráficos do experimento</div>
        <div class="content-subtitle">
          Visualize o desenvolvimento da cultura e os efeitos dos tratamentos a partir das métricas coletadas em campo e por drone.
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
                Use os filtros abaixo para combinar métricas de monitoramento manual, drone, colheita e clima.
              </span>
            `
                : `
              <span style="color:#6b7280;">
                Nenhum experimento selecionado. Selecione um experimento na aba "Experimentos" para visualizar gráficos.
              </span>
            `
            }
          </div>
          <button class="btn-primary" style="width:auto; padding-inline:18px;" disabled>
            Exportar gráficos (em desenvolvimento)
          </button>
        </div>
      </div>

      <!-- Filtros principais -->
      <div class="card">
        <div style="font-size:14px; font-weight:600; color:#065f46; margin-bottom:8px;">
          Filtros de visualização (em desenvolvimento)
        </div>

        <div style="display:flex; flex-wrap:wrap; gap:10px; font-size:13px; color:#374151;">
          <div style="flex:1 1 180px;">
            <label>Métrica principal</label>
            <select disabled>
              <option>Altura média</option>
              <option>Índice de cobertura</option>
              <option>Sanidade (notas)</option>
              <option>Plantas brotadas/vivas</option>
              <option>Plantas tombadas</option>
              <option>Peso de colheita (kg)</option>
              <option>Nº raízes comerciais</option>
              <option>NDVI (drone)</option>
              <option>Precipitação / temperatura</option>
            </select>
          </div>

          <div style="flex:1 1 180px;">
            <label>Quebra por</label>
            <select disabled>
              <option>Tratamento</option>
              <option>Bloco</option>
              <option>Parcela</option>
              <option>Época de avaliação</option>
            </select>
          </div>

          <div style="flex:1 1 180px;">
            <label>Período</label>
            <select disabled>
              <option>Ciclo completo</option>
              <option>Implantação</option>
              <option>Desenvolvimento vegetativo</option>
              <option>Formação de raízes</option>
              <option>Pós-colheita</option>
            </select>
          </div>

          <div style="flex:1 1 200px;">
            <label>Tipo de gráfico</label>
            <select disabled>
              <option>Linhas (evolução no tempo)</option>
              <option>Barras (comparação entre tratamentos)</option>
              <option>Boxplot simplificado</option>
              <option>Dispersão (2 variáveis)</option>
            </select>
          </div>
        </div>

        <div style="margin-top:8px; font-size:12px; color:#6b7280;">
          No futuro, estes filtros vão acionar consultas no banco de dados para gerar gráficos automaticamente,
          sem necessidade de exportar planilhas para outros softwares.
        </div>
      </div>

      <!-- Área de gráfico principal -->
      <div class="card">
        <div style="font-size:14px; font-weight:600; color:#065f46; margin-bottom:6px;">
          Gráfico principal (em desenvolvimento)
        </div>
        <p style="font-size:13px; color:#6b7280; margin-bottom:8px;">
          Área destinada ao gráfico principal da métrica selecionada, por exemplo:
          altura média × dias após o plantio, comparando tratamentos.
        </p>

        <div style="
          border-radius:12px;
          border:1px dashed #d1d5db;
          background:#f9fafb;
          height:260px;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#9ca3af;
          font-size:13px;
        ">
          Placeholder de gráfico<br>
          <span style="font-size:12px;">
            (Linha do tempo / barras / dispersão, conforme filtros)
          </span>
        </div>
      </div>

      <!-- Combinações de métricas -->
      <div class="card">
        <div style="font-size:14px; font-weight:600; color:#065f46; margin-bottom:6px;">
          Combinações de métricas (em desenvolvimento)
        </div>
        <p style="font-size:13px; color:#6b7280; margin-bottom:8px;">
          Exemplos de análises que esta aba poderá gerar:
        </p>

        <ul style="font-size:13px; color:#4b5563; padding-left:18px; margin-bottom:8px;">
          <li>Altura da cultura × precipitação acumulada no período.</li>
          <li>Índice de tombamento × intensidade de vento (se houver) ou eventos de chuva forte.</li>
          <li>NDVI médio × produtividade (kg por parcela) por tratamento.</li>
          <li>Sanidade (nota) × número de intervenções fitossanitárias.</li>
        </ul>

        <div style="
          display:grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap:10px;
        ">
          <div style="
            border-radius:10px;
            border:1px solid #e5e7eb;
            padding:10px;
            background:#ffffff;
            font-size:12px;
            color:#374151;
          ">
            <strong>Gráfico 1 – Desenvolvimento</strong><br>
            Placeholder para gráfico de altura / cobertura ao longo do tempo, por tratamento.
          </div>
          <div style="
            border-radius:10px;
            border:1px solid #e5e7eb;
            padding:10px;
            background:#ffffff;
            font-size:12px;
            color:#374151;
          ">
            <strong>Gráfico 2 – Produção</strong><br>
            Placeholder para gráfico de peso de colheita e raízes comerciais, por tratamento e bloco.
          </div>
          <div style="
            border-radius:10px;
            border:1px solid #e5e7eb;
            padding:10px;
            background:#ffffff;
            font-size:12px;
            color:#374151;
          ">
            <strong>Gráfico 3 – Integração clima × planta</strong><br>
            Placeholder para gráfico relacionando chuva/temperatura com desempenho da cultura.
          </div>
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
