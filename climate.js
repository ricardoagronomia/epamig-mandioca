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
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:#6b7280;">Chuva (últimos 7 dias)</div>
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

          <div style="flex:1 1 100px;">
            <label for="clRain">Precipitação (mm)</label>
            <input type="number" id="clRain" step="0.1" min="0" placeholder="Ex. 12.5">
          </div>

          <div style="flex:1 1 100px;">
            <label for="clTmax">Temp. máxima (°C)</label>
            <input type="number" id="clTmax" step="0.1" placeholder="Ex. 30.2">
          </div>

          <div style="flex:1 1 100px;">
            <label for="clTmin">Temp. mínima (°C)</label>
            <input type="number" id="clTmin" step="0.1" placeholder="Ex. 18.7">
          </div>

          <div style="flex:1 1 100px;">
            <label for="clTmean">Temp. média (°C)</label>
            <input type="number" id="clTmean" step="0.1" placeholder="Ex. 24.5">
          </div>

          <div style="flex:1 1 100px;">
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

      <!-- Importação de arquivo Excel/CSV -->
      <div class="card" style="margin-top:16px; border-left:3px solid #059669;">
        <div style="font-size:14px; font-weight:600; color:#065f46; margin-bottom:6px;">
          📊 Importação em lote (Excel/CSV)
        </div>
        <p style="font-size:13px; color:#6b7280; margin-bottom:10px;">
          Importe múltiplos registros de uma planilha Excel (.xlsx, .xls) ou arquivo CSV. 
          O sistema reconhece automaticamente colunas com nomes variados (data/date, chuva/rain_mm, etc).
        </p>

        <div style="display:flex; flex-wrap:wrap; gap:8px; align-items:center;">
          <input 
            type="file" 
            id="climateFileInput" 
            accept=".xlsx,.xls,.csv"
            style="flex:1 1 200px; padding:6px; border:1px solid #d1d5db; border-radius:6px; font-size:13px;"
            ${isVisitor ? "disabled" : ""}
          >
          <button
            type="button"
            class="btn-primary"
            style="font-size:13px; padding:6px 16px;"
            onclick="importClimateFile()"
            ${isVisitor ? "disabled title='Somente leitura para visitantes'" : ""}
          >
            Importar registros
          </button>
          <button
            type="button"
            class="btn-secondary"
            style="font-size:13px; padding:6px 16px;"
            onclick="downloadExampleTemplate()"
          >
            Baixar modelo Excel
          </button>
        </div>

        <div id="importProgress" style="margin-top:10px; font-size:12px; color:#6b7280;"></div>
      </div>

      <!-- Resumo mensal / anual -->
      <div class="card" style="margin-top:16px;">
        <div style="font-size:14px; font-weight:600; color:#065f46; margin-bottom:6px;">
          Resumo mensal e acumulado
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
                <th>Temp. média (°C)</th>
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
          Registros diários de clima
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
                <th>Temp. média (°C)</th>
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

    if (window.currentRole === "visitor") {
      alert("Visitantes têm acesso somente leitura aos dados climáticos.");
      return;
    }

    const date = document.getElementById("clDate")?.value || null;
    const rain_mm = document.getElementById("clRain")?.value;
    const tmax_c = document.getElementById("clTmax")?.value;
    const tmin_c = document.getElementById("clTmin")?.value;
    const tmean_c = document.getElementById("clTmean")?.value;
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
      tmean_c: tmean_c === "" ? null : Number(tmean_c),
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
      document.getElementById("clTmean").value = "";
      document.getElementById("clRh").value = "";

      currentClimateEditId = null;
      const btn = document.querySelector('button[onclick="saveClimateDailyRecord()"]');
      if (btn) btn.textContent = "Salvar registro diário";

      if (typeof loadClimateDailyReadings === "function") {
        loadClimateDailyReadings();
      }
      if (typeof loadClimateMonthlySummary === "function") {
        loadClimateMonthlySummary();
      }
      if (typeof loadClimateQuickSummary === "function") {
        loadClimateQuickSummary();
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
        .select("date, rain_mm, tmax_c, tmin_c, tmean_c, rh_mean")
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
            <td colspan="7" style="text-align:center; font-size:13px; color:#6b7280;">
              Nenhum registro climático diário ainda.
            </td>
          </tr>
        `;
        return;
      }

      const isVisitor = window.currentRole === "visitor";

      tbody.innerHTML = data.map((row) => `
  <tr>
    <td>${formatDate(row.date)}</td>
    <td>${row.rain_mm != null ? row.rain_mm.toFixed(1) : "–"}</td>
    <!-- ... outros campos ... -->
    <td>
      <div style="display:flex; gap:4px;">
        ${isVisitor ? '' : `
          <button class="btn-secondary" style="font-size:12px; padding:4px 8px;"
            onclick="confirmDeleteClimateDaily('${row.id}')">
            Editar
          </button>
          <button class="btn-danger" style="font-size:12px; padding:4px 8px;"
            onclick="confirmDeleteClimateDaily('${row.id}')">
            Excluir
          </button>
        `}
      </div>
    </td>
  </tr>
`).join("");

    } catch (err) {
      console.error("Erro ao carregar registros climáticos diários:", err);
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; font-size:13px; color:#b91c1c;">
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

    const dataInicio = "2025-11-01";
    const dataFim = "2026-11-30";

    try {
      const { data, error } = await s
        .from("climate_daily")
        .select("date, rain_mm, tmax_c, tmin_c, tmean_c, rh_mean")
        .gte("date", dataInicio)
        .lte("date", dataFim)
        .order("date", { ascending: true });
       
      console.log("Dados carregados:", data);

      if (error) throw error;

      const monthSlots = [];
      for (let i = 0; i < 13; i++) {
        const base = new Date(2025, 10, 1);
        const d = new Date(base.getFullYear(), base.getMonth() + i, 1);
        monthSlots.push({
          year: d.getFullYear(),
          month: d.getMonth(),
          rainSum: 0,
          tmaxSum: 0,
          tmaxCount: 0,
          tminSum: 0,
          tminCount: 0,
          tmeanSum: 0,      
          tmeanCount: 0,
          rhSum: 0,
          rhCount: 0,
        });
      }

      let chuvaTotalPeriodo = 0;

      (data || []).forEach((row) => {
        if (!row.date) return;
        const d = new Date(row.date + "T00:00:00");
        const y = d.getFullYear();
        const m = d.getMonth();

        const slot = monthSlots.find((s) => s.year === y && s.month === m);
        if (!slot) return;

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
        if (row.tmean_c != null) {
        slot.tmeanSum += Number(row.tmean_c);
        slot.tmeanCount += 1;
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
        const tmean = s.tmeanCount ? (s.tmeanSum / s.tmeanCount).toFixed(1) : "–";
        const rh = s.rhCount ? (s.rhSum / s.rhCount).toFixed(0) : "–";

        return `
          <tr>
            <td>${nomesMeses[s.month]}</td>
            <td>${rain}</td>
            <td>${rainAcum}</td>
            <td>${tmax}</td>
            <td>${tmin}</td>
            <td>${tmean}</td>
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

  const hoje = new Date();
  hoje.setHours(23, 59, 59, 999);  // Final do dia

  const inicio = new Date(hoje);
  inicio.setDate(hoje.getDate() - 6);  // 7 dias COMPLETOS
  inicio.setHours(0, 0, 0, 0);         // Início do dia

  const fmt = (d) => d.toISOString().slice(0, 10);
  const dataInicio = fmt(inicio);
  const dataFim = fmt(hoje);

  console.log(`Resumo 7 dias: ${dataInicio} a ${dataFim}`);  // DEBUG

  try {
    const { data, error } = await s
      .from("climate_daily")
      .select("date, rain_mm, tmax_c, tmin_c, rh_mean")
      .gte("date", dataInicio)
      .lte("date", dataFim)
      .order("date");

    console.log("Dados 7 dias:", data?.length || 0, "registros");  // DEBUG

    if (error) throw error;

    let rainSum = 0, rainCount = 0;
    let tempSum = 0, tempCount = 0;
    let rhSum = 0, rhCount = 0;

    (data || []).forEach((row) => {
      if (row.rain_mm != null && !isNaN(row.rain_mm)) {
        rainSum += Number(row.rain_mm);
        rainCount += 1;
      }
      if (row.tmax_c != null && row.tmin_c != null && 
          !isNaN(row.tmax_c) && !isNaN(row.tmin_c)) {
        tempSum += (Number(row.tmax_c) + Number(row.tmin_c)) / 2;
        tempCount += 1;
      }
      if (row.rh_mean != null && !isNaN(row.rh_mean)) {
        rhSum += Number(row.rh_mean);
        rhCount += 1;
      }
    });

    const rainText = rainCount ? rainSum.toFixed(1) + " mm" : "0.0 mm";
    const tempText = tempCount ? (tempSum / tempCount).toFixed(1) + " °C" : "– °C";
    const rhText = rhCount ? Math.round(rhSum / rhCount) + " %" : "– %";

    document.getElementById("clQuickRain").textContent = rainText;
    document.getElementById("clQuickTemp").textContent = tempText;
    document.getElementById("clQuickRh").textContent = rhText;

    console.log(`Resumo: Chuva=${rainText}, Temp=${tempText}, RH=${rhText}`);  // DEBUG

  } catch (err) {
    console.error("Erro resumo clima:", err);
  }
};

  window.openClimateDailyEdit = function openClimateDailyEdit(row) {
    if (window.currentRole === "visitor") {
      return;
    }
    currentClimateEditId = row.id;

    document.getElementById("clDate").value = row.date || "";
    document.getElementById("clRain").value = row.rain_mm ?? "";
    document.getElementById("clTmax").value = row.tmax_c ?? "";
    document.getElementById("clTmin").value = row.tmin_c ?? "";
    document.getElementById("clTmean").value = row.tmean_c ?? "";
    document.getElementById("clRh").value = row.rh_mean ?? "";

    const btn = document.querySelector('button[onclick="saveClimateDailyRecord()"]');
    if (btn) btn.textContent = "Atualizar registro diário";
  };

  window.confirmDeleteClimateDaily = async function confirmDeleteClimateDaily(id) {
    if (window.currentRole === "visitor") {
      alert("Visitantes não podem excluir registros climáticos.");
      return;
    }
    if (!id) return;
      
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
      if (typeof loadClimateMonthlySummary === "function") {
        loadClimateMonthlySummary();
      }
      if (typeof loadClimateQuickSummary === "function") {
        loadClimateQuickSummary();
      }
    } catch (err) {
      console.error("Erro ao excluir registro climático:", err);
      alert("Erro ao excluir registro climático.");
    }
  };

  window.downloadExampleTemplate = function downloadExampleTemplate() {
    const templateData = [
      {
        date: "2026-01-28",
        rain_mm: 12.5,
        tmax_c: 30.2,
        tmin_c: 18.7,
        tmean_c: 24.5,
        rh_mean: 75
      },
      {
        date: "2026-01-29",
        rain_mm: 0,
        tmax_c: 32.1,
        tmin_c: 19.5,
        tmean_c: 25.8,
        rh_mean: 68
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dados Climáticos");

    worksheet['!cols'] = [
      { wch: 12 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 }
    ];

    XLSX.writeFile(workbook, "modelo_dados_climaticos.xlsx");
  };

  window.importClimateFile = async function importClimateFile() {
    if (typeof XLSX === "undefined") {
      alert("Biblioteca de importação não carregada. Recarregue a página.");
      return;
    }

    if (typeof s === "undefined") {
      alert("Cliente Supabase não disponível.");
      return;
    }

    if (window.currentRole === "visitor") {
      alert("Visitantes não podem importar dados.");
      return;
    }

    const fileInput = document.getElementById("climateFileInput");
    const file = fileInput?.files?.[0];

    if (!file) {
      alert("Selecione um arquivo Excel ou CSV para importar.");
      return;
    }

    const progressDiv = document.getElementById("importProgress");
    if (progressDiv) progressDiv.textContent = "Processando arquivo...";

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (!jsonData || jsonData.length === 0) {
        alert("O arquivo está vazio ou não contém dados válidos.");
        if (progressDiv) progressDiv.textContent = "";
        return;
      }

      // Mapeamento flexível de colunas
      const columnMapping = {
        date: ['date', 'data', 'dia', 'fecha', 'day'],
        rain_mm: ['rain_mm', 'rain', 'chuva', 'precipitacao', 'precipitação', 'prec', 'pluviosidade'],
        tmax_c: ['tmax_c', 'tmax', 'temp_max', 'temperatura_maxima', 'temperatura máxima', 'max_temp'],
        tmin_c: ['tmin_c', 'tmin', 'temp_min', 'temperatura_minima', 'temperatura mínima', 'min_temp'],
        tmean_c: ['tmean_c', 'tmean', 'temp_media', 'temperatura_media', 'temperatura média', 'mean_temp', 'avg_temp'],
        rh_mean: ['rh_mean', 'rh', 'umidade', 'ur', 'umidade_relativa', 'humidity', 'relative_humidity']
      };

      function findColumn(row, possibleNames) {
        const keys = Object.keys(row);
        for (const key of keys) {
          const normalizedKey = key.toLowerCase().trim();
          if (possibleNames.some(name => normalizedKey.includes(name))) {
            return key;
          }
        }
        return null;
      }

      const firstRow = jsonData[0];
      const detectedColumns = {
        date: findColumn(firstRow, columnMapping.date),
        rain_mm: findColumn(firstRow, columnMapping.rain_mm),
        tmax_c: findColumn(firstRow, columnMapping.tmax_c),
        tmin_c: findColumn(firstRow, columnMapping.tmin_c),
        tmean_c: findColumn(firstRow, columnMapping.tmean_c),
        rh_mean: findColumn(firstRow, columnMapping.rh_mean)
      };

      if (!detectedColumns.date) {
        alert("Coluna de data não encontrada. Certifique-se de que existe uma coluna com 'date', 'data' ou 'dia'.");
        if (progressDiv) progressDiv.textContent = "";
        return;
      }

      // Validar e preparar dados usando as colunas detectadas
      const validRecords = [];
      const errors = [];

      jsonData.forEach((row, index) => {
        const lineNum = index + 2;

        const dateValue = row[detectedColumns.date];
        if (!dateValue) {
          errors.push(`Linha ${lineNum}: data ausente`);
          return;
        }

        let dateStr = dateValue;
        if (typeof dateStr === "number") {
          const excelEpoch = new Date(1900, 0, 1);
          const dateObj = new Date(excelEpoch.getTime() + (dateStr - 2) * 86400000);
          dateStr = dateObj.toISOString().split("T")[0];
        } else if (typeof dateStr === "string") {
          dateStr = dateStr.trim();
          if (dateStr.includes("/")) {
            const parts = dateStr.split("/");
            if (parts.length === 3) {
              const day = parseInt(parts[0]);
              const month = parseInt(parts[1]);
              if (day > 12) {
                dateStr = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
              } else if (month > 12) {
                dateStr = `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
              } else {
                dateStr = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
              }
            }
          }
        }

        const getNumericValue = (colName) => {
          if (!colName || !row[colName]) return null;
          const val = row[colName];
          if (val === "" || val === null || val === undefined) return null;
          return Number(val);
        };

        const record = {
          station_code: "PADRAO",
          date: dateStr,
          rain_mm: getNumericValue(detectedColumns.rain_mm),
          tmax_c: getNumericValue(detectedColumns.tmax_c),
          tmin_c: getNumericValue(detectedColumns.tmin_c),
          tmean_c: getNumericValue(detectedColumns.tmean_c),
          rh_mean: getNumericValue(detectedColumns.rh_mean)
        };

        validRecords.push(record);
      });

      if (errors.length > 0) {
        const showErrors = errors.slice(0, 5).join("\n");
        const moreErrors = errors.length > 5 ? `\n... e mais ${errors.length - 5} erros` : "";
        alert(`Encontrados erros:\n${showErrors}${moreErrors}\n\nRegistros válidos serão importados.`);
      }

      if (validRecords.length === 0) {
        alert("Nenhum registro válido encontrado no arquivo.");
        if (progressDiv) progressDiv.textContent = "";
        return;
      }

      const confirmMsg = `Confirma a importação de ${validRecords.length} registro(s)?\n\n` +
                         `Observação: Se já existir um registro com a mesma data, ele será atualizado.`;
      
      if (!confirm(confirmMsg)) {
        if (progressDiv) progressDiv.textContent = "Importação cancelada.";
        setTimeout(() => {
          if (progressDiv) progressDiv.textContent = "";
        }, 3000);
        return;
      }

      if (progressDiv) progressDiv.textContent = `Importando ${validRecords.length} registro(s)...`;

      const { data: insertedData, error } = await s
        .from("climate_daily")
        .upsert(validRecords, { 
          onConflict: 'station_code,date',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error("Erro na importação:", error);
        alert(`Erro ao importar dados: ${error.message}`);
        if (progressDiv) progressDiv.textContent = "";
        return;
      }

      if (progressDiv) {
        progressDiv.innerHTML = `<span style="color:#059669; font-weight:600;">✓ ${validRecords.length} registro(s) importado(s) com sucesso!</span>`;
        setTimeout(() => {
          progressDiv.textContent = "";
        }, 5000);
      }

      fileInput.value = "";

      if (typeof loadClimateDailyReadings === "function") {
        loadClimateDailyReadings();
      }
      if (typeof loadClimateMonthlySummary === "function") {
        loadClimateMonthlySummary();
      }
      if (typeof loadClimateQuickSummary === "function") {
        loadClimateQuickSummary();
      }

    } catch (err) {
      console.error("Erro ao processar arquivo:", err);
      alert(`Erro ao processar arquivo: ${err.message}`);
      if (progressDiv) progressDiv.textContent = "";
    }
  };

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

})();
