// cronograma.js
// Módulo independente para o cronograma dos experimentos
// Calcula diferença em dias entre duas datas (YYYY-MM-DD ou ISO)
function daysBetween(date1, date2) {
  if (!date1 || !date2) return null;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.round((d2 - d1) / oneDay);
}

async function openExperimentScheduleModal(experimentId) {
  if (typeof s === "undefined") {
    alert("Cliente Supabase não encontrado.");
    return;
  }

  const { data: exp, error } = await s
    .from("experiments")
    .select("*")
    .eq("id", experimentId)
    .single();

  if (error || !exp) {
    console.error("Erro ao carregar experimento para cronograma:", error);
    alert("Não foi possível carregar o cronograma deste experimento.");
    return;
  }

  const title = `Cronograma - ${exp.code || "Experimento"}`;

  const bodyHtml = `
    <div style="margin-bottom:12px;">
      <div style="font-size:13px; color:#4b5563; margin-bottom:6px;">
        Data de plantio: ${exp.planting_date || "-"}
      </div>

      <p style="font-size:13px; color:#6b7280; margin-bottom:10px;">
        Aqui será exibido e editado o cronograma de ações deste experimento.
      </p>

      <div>
        <em style="font-size:13px; color:#9ca3af;">
          (Protótipo) Ainda vamos implementar a lista de ações, datas e status aqui.
        </em>
      </div>
    </div>
  `;

  if (typeof openModal === "function") {
    openModal(title, bodyHtml);
  } else {
    alert("Função openModal não encontrada no app principal.");
  }
}

