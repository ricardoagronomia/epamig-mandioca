// cronograma.js
// Módulo independente para o cronograma dos experimentos

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
