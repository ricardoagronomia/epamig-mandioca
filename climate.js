// climate.js
// Página de Dados Climáticos

(function () {
  window.renderClimatePage = renderClimatePage;

  function renderClimatePage(container) {
    container.innerHTML = `
      <!-- Resumo rápido de clima (mock, com ícones) -->
      <div class="card" style="display:flex; flex-wrap:wrap; gap:12px; align-items:stretch; margin-bottom:16px;">
        <!-- Bloco: precipitação -->
        <div style="flex:1 1 140px; min-width:140px; padding:8px 10px; border-radius:10px; background:#eff6ff; display:flex; align-items:center; gap:8px;">
          <div style="width:28px; height:28px; border-radius:999px; background:#dbeafe; display:flex; align-items:center; justify-content:center; font-size:16px;">
            🌧
          </div>
          <div>
            <div style="font-size:18px; font-weight:600; color:#111827;">– mm</div>
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:#6b7280;">Chuva (últimos dias)</div>
          </div>
        </div>

        <!-- Bloco: temperatura média -->
        <div style="flex:1 1 140px; min-width:140px; padding:8px 10px; border-radius:10px; background:#fefce8; display:flex; align-items:center; gap:8px;">
          <div style="width:28px; height:28px; border-radius:999px; background:#fef3c7; display:flex; align-items:center; justify-content:center; font-size:16px;">
            🌡
          </div>
          <div>
            <div style="font-size:18px; font-weight:600; color:#713f12;">– °C</div>
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:#6b7280;">Temp. média</div>
          </div>
        </div>

        <!-- Bloco: umidade relativa -->
        <div style="flex:1 1 160px; min-width:160px; padding:8px 10px; border-radius:10px; background:#ecfdf3; display:flex; align-items:center; gap:8px;">
          <div style="width:28px; height:28px; border-radius:999px; background:#bbf7d0; display:flex; align-items:center; justify-content:center; font-size:16px;">
            💧
          </div>
          <div>
            <div style="font-size:18px; font-weight:600; color:#14532d;">– %</div>
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:#6b7280;">Umidade relativa</div>
          </div>
        </div>
      </div>

      <!-- Entrada rápida de dados diários -->
      <div class="card">
        <div style="font-size:14px; font-weight:600; color:#111827; margin-bottom:6px;">
          Registro diário de clima (entrada rápida)
        </div>
        <p style="font-size:13px; color:#6b7280; margin-bottom:10px;">
          Use os campos abaixo para lançar manualmente os dados diários vindos da estação
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

          <div style="flex:0 0 auto; display:flex; flex-direction:column; gap:2px;">
            <button
              type="button"
              class="btn-primary"
              style="margin-top:4px; font-size:13px; padding:6px 12px; width:auto; padding-inline:18px;"
              onclick="saveClimateDailyRecord()"
            >
              Salvar registro diário
            </button>
            <span style="font-size:11px; color:#9ca3af;">
              Funcionalidade em desenvolvimento
            </span>
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

      <!-- Registros diários -->
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
            <tbody id="climateDailyTableBody">
              <!-- preenchido dinamicamente -->
            </tbody>
          </table>
        </div>
      </div>
    `;

    if (typeof loadClimateDailyReadings === "function") {
      loadClimateDailyReadings();
    }
  }

  window.saveClimateDailyRecord = async function saveClimateDailyRecord() {
  if (typeof s === "undefined") {
    alert("Cliente Supabase não disponível.");
    return;
  }

  const date = document.getElementById("clDate")?.value || null;
  const rain_mm = document.getElementById("clRain")?.value;
  const tmax_c = document.getElementById("clTmax")?.value;
  const tmin_c = document.getElementById("clTmin")?.value;
  const rh_mean = document.getElementById("clRh")?.value;

  if (!date) {
    alert("Informe a data do registro.");
    return;
  }

  const payload = {
    station_code: "PADRAO", // depois podemos trocar por um seletor de estação
    date,                   // YYYY-MM-DD
    rain_mm: rain_mm === "" ? null : Number(rain_mm),
    tmax_c: tmax_c === "" ? null : Number(tmax_c),
    tmin_c: tmin_c === "" ? null : Number(tmin_c),
    rh_mean: rh_mean === "" ? null : Number(rh_mean),
  };

  try {
    const { error } = await s.from("climate_daily").insert(payload);
    if (error) throw error;

    // limpa campos
    document.getElementById("clRain").value = "";
    document.getElementById("clTmax").value = "";
    document.getElementById("clTmin").value = "";
    document.getElementById("clRh").value = "";

    // recarrega lista
    if (typeof loadClimateDailyReadings === "function") {
      loadClimateDailyReadings();
    }

    alert("Registro climático salvo com sucesso.");
  } catch (err) {
    console.error("Erro ao salvar registro climático:", err);
    alert("Erro ao salvar registro climático.");
  }
};

  window.loadClimateDailyReadings = async function loadClimateDailyReadings() {
  if (typeof s === "undefined") {
    console.warn("Supabase client não disponível.");
    return;
  }

  const tbody = document.querySelector("#climateDailyTableBody");
  if (!tbody) return;

  try {
    const { data, error } = await s
      .from("climate_daily")
      .select("id, date, rain_mm, tmax_c, tmin_c, rh_mean")
      .order("date", { ascending: true });

    if (error) throw error;

    const formatDate = iso => {
      if (!iso) return "";
      const [y, m, d] = iso.split("-");
      return `${d}-${m}-${y}`;
    };

    if (!data || data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; font-size:13px; color:#6b7280;">
            Nenhum registro climático diário ainda.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = data
      .map(row => `
        <tr>
          <td>${formatDate(row.date)}</td>
          <td>${row.rain_mm != null ? row.rain_mm.toFixed(1) : "–"}</td>
          <td>${row.tmax_c != null ? row.tmax_c.toFixed(1) : "–"}</td>
          <td>${row.tmin_c != null ? row.tmin_c.toFixed(1) : "–"}</td>
          <td>${row.rh_mean != null ? row.rh_mean.toFixed(0) : "–"}</td>
          <td>
            <div style="display:flex; flex-wrap:nowrap; gap:4px; justify-content:flex-end;">
              <button type="button" class="btn-secondary"
                style="font-size:12px; padding:4px 8px;"
                onclick="/* openClimateDailyEditModal('${row.id}') */">
                Editar
              </button>
              <button type="button" class="btn-danger"
                style="font-size:12px; padding:4px 8px;"
                onclick="/* confirmDeleteClimateDaily('${row.id}') */">
                Excluir
              </button>
            </div>
          </td>
        </tr>
      `)
      .join("");
  } catch (err) {
    console.error("Erro ao carregar registros climáticos diários:", err);
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; font-size:13px; color:#b91c1c;">
          Erro ao carregar registros climáticos.
        </td>
      </tr>
    `;
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
