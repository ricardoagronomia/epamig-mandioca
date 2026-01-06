// =====================================
// QR CODES PAGE
// =====================================
async function renderQrCodesPage(container) {
  // Permissão: admin e colaborador podem acessar
  if (currentRole !== "admin" && currentRole !== "collaborator") {
    container.innerHTML = `
      <div class="content-header">
        <div class="content-title">QR Code das Parcelas</div>
        <div class="content-subtitle">
          Apenas administradores e pesquisadores podem acessar esta página.
        </div>
      </div>
      <div class="card">
        <p style="color:#b91c1c;">
          Você não tem permissão para acessar esta página.
        </p>
      </div>
    `;
    return;
  }

  // HTML da página (o que definimos antes)
  container.innerHTML = `
    <div class="content-header">
      <div class="content-title">QR Code das Parcelas</div>
      <div class="content-subtitle">
        Gere etiquetas com QR Code para identificação das parcelas em campo.
      </div>
    </div>

    <div class="card">
      <div style="
        display:flex;
        flex-wrap:wrap;
        gap:16px;
        align-items:flex-end;
        margin-bottom:16px;
      ">
        <div style="flex:1 1 220px; max-width:260px;">
          <label for="qrExperimentSelect">Experimento</label>
          <select id="qrExperimentSelect">
            <option value="">Selecione um experimento</option>
          </select>
        </div>

        <div style="flex:0 0 160px;">
          <label for="qrBlockFilter">Bloco</label>
          <select id="qrBlockFilter">
            <option value="all">Todos os blocos</option>
            <option value="1">Bloco 1</option>
            <option value="2">Bloco 2</option>
            <option value="3">Bloco 3</option>
          </select>
        </div>

        <div style="flex:0 0 220px;">
          <label for="qrFormatSelect">Formato de impressão</label>
          <select id="qrFormatSelect">
            <option value="a4-6">A4 – 6 etiquetas por página</option>
            <option value="label-100x70">Etiqueta térmica 100×70 mm (1 etiqueta)</option>
          </select>
        </div>

        <div id="qrSingleLabelWrapper" style="flex:0 0 220px; display:none;">
          <label for="qrSinglePlotSelect">Parcela para etiqueta única</label>
          <select id="qrSinglePlotSelect">
            <option value="">Selecione a parcela</option>
          </select>
        </div>

        <div style="
          flex:0 0 auto;
          margin-left:auto;
          display:flex;
          gap:8px;
          justify-content:flex-end;
        ">
          <button id="qrPreviewBtn" class="btn-secondary">
            Atualizar visualização
          </button>
          <button id="qrPrintBtn" class="btn-primary">
            Imprimir / Baixar
          </button>
        </div>
      </div>

      <p id="qrInfoMessage" style="font-size:13px; color:#6b7280; margin:0 0 12px 0;">
        Selecione o experimento para carregar as parcelas e gerar as etiquetas.
      </p>

      <div id="qrLabelsWrapper" style="
        display:grid;
        grid-template-columns:repeat(auto-fill,minmax(230px,1fr));
        gap:12px;
      ">
      </div>
    </div>
  `;

  // Aqui, na próxima etapa, vamos:
  // - carregar lista de experimentos no qrExperimentSelect
  // - carregar parcelas do experimento escolhido
  // - preencher qrSinglePlotSelect
  // - desenhar etiquetas dentro de qrLabelsWrapper
  // - conectar qrFormatSelect, qrPreviewBtn e qrPrintBtn
}
