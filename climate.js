// climate.js
// Página de Dados Climáticos – placeholder estático

(function () {
  window.renderClimatePage = renderClimatePage;

  function renderClimatePage(container) {
  const experiment = window.currentExperiment || null;

  container.innerHTML = `
    <!-- Entrada rápida de dados diários -->
    <div class="card">
      <div style="font-size:14px; font-weight:600; color:#111827; margin-bottom:6px;">
        Registro diário de clima (entrada rápida)
      </div>
      <p style="font-size:13px; color:#6b7280; margin-bottom:10px;">
        Use os campos abaixo para lançar manualmente os dados diários vindos da estação do experimento
        (data, precipitação, temperatura e <span style="font-weight:500;">umidade relativa do ar</span>).
      </p>

      <div style="display:flex; flex-wrap:wrap; gap:8px; align-items:flex-end;">
        <div style="flex:1 1 120px;">
          <label for="clDate">Data</label>
          <input type="date" id="clDate">
        </div>

        <div style="flex:1 1 120px;">
          <label for="clRain">Precipitação (mm)</label>
          <input type="number" id="clRain" step="0.1" min="0" placeholder="Ex. 12.5">
        </div>

        <div style="flex:1 1 120px;">
          <label for="clTmax">Temp. máxima (°C)</label>
          <input type="number" id="clTmax" step="0.1" placeholder="Ex. 30.2">
        </div>

        <div style="flex:1 1 120px;">
          <label for="clTmin">Temp. mínima (°C)</label>
          <input type="number" id="clTmin" step="0.1" placeholder="Ex. 18.7">
        </div>

        <div style="flex:1 1 140px;">
          <label for="clRh">Umidade relativa (%)</label>
          <input type="number" id="clRh" step="1" min="0" max="100" placeholder="Ex. 75">
        </div>

        <div style="flex:0 0 auto;">
          <button class="primary" style="margin-top:4px;" disabled>
            Salvar registro diário (em desenvolvimento)
          </button>
        </div>
      </div>
    </div>

    <!-- Resumo mensal / anual (mock) -->
    <div class="card" style="margin-top:16px;">
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
              <td>Jan</td><td>–</td><td>–</td><td>–</td><td>–</td><td>–</td>
            </tr>
            <tr>
              <td>Fev</td><td>–</td><td>–</td><td>–</td><td>–</td><td>–</td>
            </tr>
            <tr>
              <td>Mar</td><td>–</td><td>–</td><td>–</td><td>–</td><td>–</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Registros diários (mock) -->
    <div class="card" style="margin-top:16px;">
      <div style="font-size:14px; font-weight:600; color:#111827; margin-bottom:6px;">
        Registros diários de clima (em desenvolvimento)
      </div>
      <p style="font-size:13px; color:#6b7280; margin-bottom:8px;">
        Abaixo serão listados os registros diários lançados, permitindo <span style="font-weight:500;">editar</span> ou
        <span style="font-weight:500;">excluir</span> cada linha.
      </p>

      <div style="overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Precipitação (mm)</th>
              <th>Temp. máxima (°C)</th>
              <th>Temp. mínima (°C)</th>
              <th>Umidade relativa (%)</th>
              <th style="width:90px;">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>–</td>
              <td>–</td>
              <td>–</td>
              <td>–</td>
              <td>–</td>
              <td>
                <button class="ghost small" disabled>Editar</button>
                <button class="ghost small" disabled>Excluir</button>
              </td>
            </tr>
          </tbody>
        </table>
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
