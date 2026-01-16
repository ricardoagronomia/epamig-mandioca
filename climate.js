// climate.js
// Página de Dados Climáticos

(function () {
  let currentClimateEditId = null;

  window.renderClimatePage = renderClimatePage;

  function renderClimatePage(container) {
    const isVisitor = window.currentRole === "visitor";
    container.innerHTML = `
      <!-- Resumo rápido de clima (mock, com ícones) -->
      <div class="card" style="display:flex; flex-wrap:wrap; gap:12px; align-items:stretch; margin-bottom:16px;">
        <!-- Bloco: precipitação -->
        <div style="flex:1 1 140px; min-width:140px; padding:8px 10px; border-radius:10px; background:#eff6ff; display:flex; align-items:center; gap:8px;">
          <div style="width:28px; height:28px; border-radius:999px; background:#dbeafe; display:flex; align-items:center; justify-content:center; font-size:16px;">
            🌧
          </div>
          <div>
            <div style="font-size:18px; font-weight:600; color:#111827;" id="clQuickRain">– mm</div>
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:#6b7280;">Chuva (últimos dias)</div>
          </div>
        </div>

        <!-- Bloco: temperatura média -->
        <div style="flex:1 1 140px; min-width:140px; padding:8px 10px; border-radius:10px; background:#fefce8; display:flex; align-items:center; gap:8px;">
          <div style="width:28px; height:28px; border-radius:999px; background:#fef3c7; display:flex; align-items:center; justify-content:center; font-size:16px;">
            🌡
          </div>
          <div>
            <div style="font-size:18px; font-weight:600; color:#713f12;" id="clQuickTemp">– °C</div>
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:#6b7280;">Temp. média</div>
          </div>
        </div>

        <!-- Bloco: umidade relativa -->
        <div style="flex:1 1 160px; min-width:160px; padding:8px 10px; border-radius:10px; background:#ecfdf3; display:flex; align-items:center; gap:8px;">
          <div style="width:28px; height:28px; border-radius:999px; background:#bbf7d0; display:flex; align-items:center; justify-content:center; font-size:16px;">
            💧
          </div>
          <div>
            <div style="font-size:18px; font-weight:600; color:#14532d;" id="clQuickRh">– %</div>
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
              ${isVisitor ? "disabled title='Somente leitura para visitantes'" : ""}
            >
              Salvar registro diário
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
            <tbody id="climateMonthlyTableBody">
              <!-- preenchido dinamicamente -->
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
    if (typeof loadClimateMonthlySummary === "function") {
    loadClimateMonthlySummary();
    }
    if (typeof loadClimateQuickSummary === "function") {
      loadClimateQuickSummary();
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
    station_code: "PADRAO",
    date,
    rain_mm: rain_mm === "" ? null : Number(rain_mm),
    tmax_c: tmax_c === "" ? null : Number(tmax_c),
    tmin_c: tmin_c === "" ? null : Number(tmin_c),
    rh_mean: rh_mean === "" ? null : Number(rh_mean),
  };

  try {
    if (currentClimateEditId) {
      const { error } = await s
        .from("climate_daily")
        .update(payload)
        .eq("id", currentClimateEditId);
      if (error) throw error;
    } else {
      const { error } = await s.from("climate_daily").insert(payload);
      if (error) throw error;
    }

    document.getElementById("clRain").value = "";
    document.getElementById("clTmax").value = "";
    document.getElementById("clTmin").value = "";
    document.getElementById("clRh").value = "";
    // mantém a data para facilitar lançamentos em série

    currentClimateEditId = null;
    const btn = document.querySelector('button[onclick="saveClimateDailyRecord()"]');
    if (btn) btn.textContent = "Salvar registro diário";

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
  console.log("loadClimateDailyReadings: chamada ao entrar na página de clima");

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

    console.log("climate_daily data:", data, "error:", error);

    const formatDate = (iso) => {
      if (!iso) return "";
      const [y, m, d] = iso.split("-");
      return `${d}-${m}-${y}`;
    };

    if (error) throw error;

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

    const isVisitor = window.currentRole === "visitor";

    tbody.innerHTML = data
      .map(
        (row) => `
        <tr>
          <td>${formatDate(row.date)}</td>
          <td>${row.rain_mm != null ? row.rain_mm.toFixed(1) : "–"}</td>
          <td>${row.tmax_c != null ? row.tmax_c.toFixed(1) : "–"}</td>
          <td>${row.tmin_c != null ? row.tmin_c.toFixed(1) : "–"}</td>
          <td>${row.rh_mean != null ? row.rh_mean.toFixed(0) : "–"}</td>
          <td>
            <div style="display:flex; flex-wrap:nowrap; gap:4px; justify-content:flex-end;">
              ${
                isVisitor
                  ? `<span style="font-size:11px; color:#9ca3af;">Somente leitura</span>`
                  : `
                    <button type="button" class="btn-secondary"
                      style="font-size:12px; padding:4px 8px;"
                      onclick='openClimateDailyEdit(${JSON.stringify(row)})'>
                      Editar
                    </button>
                    <button type="button" class="btn-danger"
                      style="font-size:12px; padding:4px 8px;"
                      onclick="confirmDeleteClimateDaily('${row.id}')">
                      Excluir
                    </button>
                  `
              }
            </div>
          </td>
        </tr>
      `,
      )
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
  
  window.loadClimateMonthlySummary = async function loadClimateMonthlySummary() {
  if (typeof s === "undefined") {
    console.warn("Supabase client não disponível.");
    return;
  }

  const tbody = document.querySelector("#climateMonthlyTableBody");
  if (!tbody) return;

  // período fixo do experimento: nov/2025 a nov/2026
  const dataInicio = "2025-11-01";
  const dataFim = "2026-11-30";

  try {
    const { data, error } = await s
      .from("climate_daily")
      .select("date, rain_mm, tmax_c, tmin_c, rh_mean")
      .gte("date", dataInicio)
      .lte("date", dataFim)
      .order("date", { ascending: true });

    if (error) throw error;

    // ordem fixa de meses do experimento: nov/2025 a nov/2026 (13 meses)
    const monthSlots = [];
    for (let i = 0; i < 13; i++) {          // <<< 13 em vez de 12
      const base = new Date(2025, 10, 1);   // nov/2025
      const d = new Date(base.getFullYear(), base.getMonth() + i, 1);
      monthSlots.push({
        year: d.getFullYear(),
        month: d.getMonth(),
        rainSum: 0,
        tmaxSum: 0,
        tmaxCount: 0,
        tminSum: 0,
        tminCount: 0,
        rhSum: 0,
        rhCount: 0,
      });
    }

    let chuvaTotalPeriodo = 0; // <<< Faltava isto

    // ao percorrer os registros:
    (data || []).forEach((row) => {
      if (!row.date) return;
      const d = new Date(row.date + "T00:00:00");
      const y = d.getFullYear();
      const m = d.getMonth();

      // achar o slot certo (ano+mês)
      const slot = monthSlots.find((s) => s.year === y && s.month === m);
      if (!slot) return; // fora do intervalo nov/25–nov/26

      if (row.rain_mm != null) {
        slot.rainSum += Number(row.rain_mm);
        chuvaTotalPeriodo += Number(row.rain_mm);
      }
      if (row.tmax_c != null) {
        slot.tmaxSum += Number(row.tmax_c);
        slot.tmaxCount += 1;
      }
      if (row.tmin_c != null) {
        slot.tminSum += Number(row.tmin_c);
        slot.tminCount += 1;
      }
      if (row.rh_mean != null) {
        slot.rhSum += Number(row.rh_mean);
        slot.rhCount += 1;
      }
    });

    const nomesMeses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

    let acumulado = 0;
    const linhas = monthSlots.map((s) => {
      acumulado += s.rainSum;

      const rain = s.rainSum > 0 ? s.rainSum.toFixed(1) : "–";
      const rainAcum = acumulado > 0 ? acumulado.toFixed(1) : "–";
      const tmax = s.tmaxCount ? (s.tmaxSum / s.tmaxCount).toFixed(1) : "–";
      const tmin = s.tminCount ? (s.tminSum / s.tminCount).toFixed(1) : "–";
      const rh = s.rhCount ? (s.rhSum / s.rhCount).toFixed(0) : "–";

      return `
        <tr>
          <td>${nomesMeses[s.month]}</td>
          <td>${rain}</td>
          <td>${rainAcum}</td>
          <td>${tmax}</td>
          <td>${tmin}</td>
          <td>${rh}</td>
        </tr>
      `;
    }).join("");

    tbody.innerHTML = linhas;

    const totalSpan = document.getElementById("climateTotalRainSpan");
    if (totalSpan) {
      totalSpan.textContent = chuvaTotalPeriodo.toFixed(1) + " mm";
    }
  } catch (err) {
    console.error("Erro ao carregar resumo mensal de clima:", err);
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; font-size:13px; color:#b91c1c;">
            Erro ao carregar resumo mensal.
          </td>
        </tr>
      `;
    }
  }
};
  window.loadClimateQuickSummary = async function loadClimateQuickSummary() {
  if (typeof s === "undefined") return;

  // últimos 7 dias
  const hoje = new Date();
  const inicio = new Date();
  inicio.setDate(hoje.getDate() - 6); // hoje + 6 dias anteriores

  const fmt = (d) => d.toISOString().slice(0, 10); // yyyy-mm-dd
  const dataInicio = fmt(inicio);
  const dataFim = fmt(hoje);

  try {
    const { data, error } = await s
      .from("climate_daily")
      .select("rain_mm, tmax_c, tmin_c, rh_mean")
      .gte("date", dataInicio)
      .lte("date", dataFim);

    if (error) throw error;

    let rainSum = 0;
    let rainCount = 0;
    let tempSum = 0;
    let tempCount = 0;
    let rhSum = 0;
    let rhCount = 0;

    (data || []).forEach((row) => {
      if (row.rain_mm != null) {
        rainSum += Number(row.rain_mm);
        rainCount += 1;
      }
      // média simples da diária: (tmax + tmin) / 2
      if (row.tmax_c != null && row.tmin_c != null) {
        tempSum += (Number(row.tmax_c) + Number(row.tmin_c)) / 2;
        tempCount += 1;
      }
      if (row.rh_mean != null) {
        rhSum += Number(row.rh_mean);
        rhCount += 1;
      }
    });

    const rainText = rainCount ? rainSum.toFixed(1) + " mm" : "– mm";
    const tempText = tempCount ? (tempSum / tempCount).toFixed(1) + " °C" : "– °C";
    const rhText = rhCount ? (rhSum / rhCount).toFixed(0) + " %" : "– %";

    // preencher os 3 blocos do card
    const rainSpan = document.getElementById("clQuickRain");
    const tempSpan = document.getElementById("clQuickTemp");
    const rhSpan = document.getElementById("clQuickRh");

    if (rainSpan) rainSpan.textContent = rainText;
    if (tempSpan) tempSpan.textContent = tempText;
    if (rhSpan) rhSpan.textContent = rhText;
  } catch (err) {
    console.error("Erro no resumo rápido de clima:", err);
  }
};

  window.openClimateDailyEdit = function openClimateDailyEdit(row) {
  currentClimateEditId = row.id;

  document.getElementById("clDate").value = row.date || "";
  document.getElementById("clRain").value = row.rain_mm ?? "";
  document.getElementById("clTmax").value = row.tmax_c ?? "";
  document.getElementById("clTmin").value = row.tmin_c ?? "";
  document.getElementById("clRh").value = row.rh_mean ?? "";

  const btn = document.querySelector('button[onclick="saveClimateDailyRecord()"]');
  if (btn) btn.textContent = "Atualizar registro diário";
};

  window.confirmDeleteClimateDaily = async function confirmDeleteClimateDaily(id) {
  if (!id) return;
  if (!confirm("Deseja excluir este registro climático diário?")) return;

  if (typeof s === "undefined") {
    alert("Cliente Supabase não disponível.");
    return;
  }

  try {
    const { error } = await s
      .from("climate_daily")
      .delete()
      .eq("id", id);

    if (error) throw error;

    if (typeof loadClimateDailyReadings === "function") {
      loadClimateDailyReadings();
    }
  } catch (err) {
    console.error("Erro ao excluir registro climático:", err);
    alert("Erro ao excluir registro climático.");
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
