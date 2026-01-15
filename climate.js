// climate.js
// Página de Dados Climáticos – placeholder estático

(function () {
  window.renderClimatePage = renderClimatePage;

  function renderClimatePage(container) {
    const experiment = window.currentExperiment || null;

    container.innerHTML = `
      <div class="content-header">
        <div class="content-title">Dados climáticos</div>
        <div class="content-subtitle">
          Registre precipitação diária e variação de temperatura ao longo do experimento, com resumos mensais e acumulados.
        </div>
      </div>

      <!-- Header / contexto do experimento -->
      <div class="card">
        <div style="display:flex; flex-wrap:wrap; gap:10px; align-items:center; justify-content:space-between;">
          <div style="font-size:13px; color:#4b5563;">
            ${
              experiment
                ? `
              Experimento <strong>${escapeHtml(experiment.code || "")}</strong> ·
              ${escapeHtml(experiment.name || "Sem nome")}<br>
              <span style="font-size:12px; color:#6b7280;">
                Os dados abaixo serão usados para interpretar respostas de produtividade e desenvolvimento.
              </span>
            `
                : `
              <span style="color:#6b7280;">
                Nenhum experimento selecionado. Selecione um experimento na aba "Experimentos" para vincular dados climáticos.
              </span>
            `
            }
          </div>
          <button class="btn-primary" style="width:auto; padding-inline:18px;" disabled>
            Novo registro diário (em desenvolvimento)
          </button>
        </div>
      </div>

      <!-- Cards de resumo -->
      <div class="card" style="display:flex; flex-wrap:wrap; gap:12px;">
        <div style="
          flex:1 1 180px;
          display:flex;
          gap:10px;
          align-items:center;
          padding:8px 10px;
          border-radius:12px;
          background:#eff6ff;
        ">
          <div style="
            width:38px; height:38px; border-radius:999px;
            background:#1d4ed8;
            display:flex; align-items:center; justify-content:center;
            color:#eff6ff; font-size:20px;
          ">
            🌧
          </div>
          <div>
            <div style="font-size:12px; color:#1f2937;">Precipitação acumulada (ano)</div>
            <div style="font-size:18px; font-weight:700; color:#1e3a8a;">– mm</div>
          </div>
        </div>

        <div style="
          flex:1 1 180px;
          display:flex;
          gap:10px;
          align-items:center;
          padding:8px 10px;
          border-radius:12px;
          background:#fef3c7;
        ">
          <div style="
            width:38px; height:38px; border-radius:999px;
            background:#f59e0b;
            display:flex; align-items:center; justify-content:center;
            color:#fefce8; font-size:20px;
          ">
            🌡
          </div>
          <div>
            <div style="font-size:12px; color:#1f2937;">Média das máximas</div>
            <div style="font-size:18px; font-weight:700; color:#92400e;">– °C</div>
          </div>
        </div>

        <div style="
          flex:1 1 180px;
          display:flex;
          gap:10px;
          align-items:center;
          padding:8px 10px;
          border-radius:12px;
          background:#ecfdf5;
        ">
          <div style="
            width:38px; height:38px; border-radius:999px;
            background:#059669;
            display:flex; align-items:center; justify-content:center;
            color:#ecfdf5; font-size:20px;
          ">
            📈
          </div>
          <div>
            <div style="font-size:12px; color:#1f2937;">Média das mínimas</div>
            <div style="font-size:18px; font-weight:700; color:#065f46;">– °C</div>
          </div>
        </div>
      </div>

      <!-- Formulário diário (mock) -->
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <div style="font-size:14px; font-weight:600; color:#065f46;">
            Registro diário de clima (em desenvolvimento)
          </div>
          <span style="font-size:12px; color:#6b7280;">
            Estrutura do formulário para entrada manual ou importação de dados.
          </span>
        </div>

        <div style="display:flex; flex-wrap:wrap; gap:10px; font-size:13px; color:#374151;">
          <div style="flex:1 1 160px;">
            <label>Data</label>
            <input type="date" disabled />
          </div>
          <div style="flex:1 1 140px;">
            <label>Precipitação (mm)</label>
            <input type="number" step="0.1" placeholder="Ex. 12,5" disabled />
          </div>
          <div style="flex:1 1 140px;">
            <label>Temp. máxima (°C)</label>
            <input type="number" step="0.1" placeholder="Ex. 30,2" disabled />
          </div>
          <div style="flex:1 1 140px;">
            <label>Temp. mínima (°C)</label>
            <input type="number" step="0.1" placeholder="Ex. 18,4" disabled />
          </div>
        </div>

        <div style="margin-top:8px;">
          <label>Observações</label>
          <textarea rows="2" style="width:100%; padding:9px 11px; border-radius:10px; border:1px solid #e5e7eb; font-size:14px; resize:vertical;" disabled
            placeholder="Ex.: chuva localizada, evento extremo, falha de estação, etc."></textarea>
        </div>

        <div style="margin-top:10px; display:flex; gap:8px; justify-content:flex-end;">
          <button class="btn-secondary" style="opacity:0.7; cursor:default;">Cancelar</button>
          <button class="btn-primary" style="width:auto; padding-inline:18px; opacity:0.7; cursor:default;">
            Salvar registro
          </button>
        </div>
      </div>

      <!-- Resumo mensal / anual (mock) -->
<div class="card">
  <div style="font-size:14px; font-weight:600; color:#065f46; margin-bottom:6px;">
    Resumo mensal e acumulado (em desenvolvimento)
  </div>
  <p style="font-size:13px; color:#6b7280; margin-bottom:8px;">
    Esta seção apresentará precipitação total por mês, precipitação acumulada no ano, médias de temperatura
    <span style="font-weight:500;">e umidade relativa do ar</span>, servindo de base para gráficos na aba de análises.
  </p>

  <div style="overflow-x:auto;">
    <table>
      <thead>
        <tr>
          <th>Mês</th>
          <th>Precipitação (mm)</th>
          <th>Precipitação acumulada (mm)</th>
          <th>Temp. máx. média (°C)</th>
          <th>Temp. mín. média (°C)</th>
          <th>Umidade relativa média (%)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Jan</td>
          <td>–</td>
          <td>–</td>
          <td>–</td>
          <td>–</td>
          <td>–</td>
        </tr>
        <tr>
          <td>Fev</td>
          <td>–</td>
          <td>–</td>
          <td>–</td>
          <td>–</td>
          <td>–</td>
        </tr>
        <tr>
          <td>Mar</td>
          <td>–</td>
          <td>–</td>
          <td>–</td>
          <td>–</td>
          <td>–</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

      <!-- Histórico de registros -->
      <div class="card">
        <div style="font-size:14px; font-weight:600; color:#065f46; margin-bottom:6px;">
          Histórico de registros climáticos (em desenvolvimento)
        </div>
        <p style="font-size:13px; color:#6b7280; margin-bottom:8px;">
          Lista dos registros diários associados ao experimento, permitindo filtros por período (plantio, estabelecimento,
          enchimento de raízes, colheita) e exportação para análise externa.
        </p>

        <div style="
          border-radius:10px;
          border:1px dashed #d1d5db;
          padding:10px 12px;
          font-size:13px;
          color:#6b7280;
          background:#f9fafb;
        ">
          Nenhum dado climático registrado ainda.
          <br>
          <span style="font-size:12px;">
            Após definir a origem dos dados (estação própria, INMET, API) esta página será ligada ao banco de dados
            e aos gráficos da aba de análises.
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
