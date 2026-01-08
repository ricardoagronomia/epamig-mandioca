// monitoring.js
// Página de Monitoramento Manual (biometria, plantas úteis, plantas tombadas)

(function () {
  // Expor função principal no escopo global
  window.renderMonitoringPage = renderMonitoringPage;

  function renderMonitoringPage(container) {
    const experiment = window.currentExperiment;
    const params = new URLSearchParams(window.location.search);
    const plotFromUrl = params.get("plot") || null;

    if (!experiment) {
      container.innerHTML = `
        <div class="card">
          <p style="color:#6b7280;">
            Nenhum experimento selecionado. Selecione um experimento na página "Experimentos" para registrar monitoramentos.
          </p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="content-header">
        <div class="content-title">Monitoramento manual</div>
        <div class="content-subtitle">
          Registre medições biométricas e o estado das plantas úteis e tombadas em cada parcela.
        </div>
      </div>

      <div class="card" id="monitoringHeaderCard">
        <div style="display:flex; flex-wrap:wrap; justify-content:space-between; gap:10px; align-items:center;">
          <div style="font-size:14px; color:#4b5563;">
            Experimento <strong>${escapeHtml(experiment.code || "")}</strong> · 
            ${escapeHtml(experiment.name || "Sem nome")}<br>
            <span style="font-size:12px; color:#6b7280;">
              Use o QR code da parcela ou selecione bloco e parcela manualmente.
            </span>
          </div>
          <button id="btnNewMonitoring" class="btn-primary" style="width:auto; padding-inline:18px;">
            Novo monitoramento
          </button>
        </div>
        <div style="margin-top:10px; font-size:13px; color:#6b7280;">
          <span id="monitoringCounter">0 monitoramentos registrados nesta parcela.</span>
        </div>
      </div>

      <div class="card" id="monitoringTabsCard"></div>

      <div class="card" id="monitoringListCard">
        <div style="font-size:14px; font-weight:600; color:#065f46; margin-bottom:6px;">
          Registros anteriores
        </div>
        <div id="monitoringListEmpty" style="font-size:13px; color:#6b7280;">
          Nenhum monitoramento registrado ainda para esta parcela.
        </div>
        <div id="monitoringList"></div>
      </div>
    `;

    setupMonitoringTabs(
      document.getElementById("monitoringTabsCard"),
      experiment,
      plotFromUrl
    );

    const btnNew = document.getElementById("btnNewMonitoring");
    if (btnNew) {
      btnNew.onclick = () => openMonitoringForm(experiment, plotFromUrl);
    }
  }

  function setupMonitoringTabs(container, experiment, plotFromUrl) {
    const defaultBlock = 1;
    const defaultPlot = plotFromUrl || "";

    container.innerHTML = `
      <div style="margin-bottom:10px;">
        <div style="font-size:14px; font-weight:600; color:#065f46; margin-bottom:6px;">
          Seleção de parcela
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:8px; font-size:13px; color:#374151;">
          <div style="flex:0 0 120px;">
            <label for="monitorBlock">Bloco</label>
            <input type="number" id="monitorBlock" min="1" value="${defaultBlock}" />
          </div>
          <div style="flex:0 0 160px;">
            <label for="monitorPlot">Parcela</label>
            <input type="text" id="monitorPlot" placeholder="Ex. B1P3" value="${escapeHtml(
              defaultPlot
            )}" />
          </div>
          <div style="flex:1 1 200px; align-self:flex-end; font-size:12px; color:#6b7280;">
            Se a página foi aberta via QR code, o código da parcela é preenchido automaticamente.
          </div>
        </div>
      </div>

      <div class="tabs" id="monitoringTabs">
        <button data-tab="biometria" class="active">Biometria</button>
        <button data-tab="uteis">Plantas úteis</button>
        <button data-tab="tombadas">Plantas tombadas</button>
      </div>
      <div id="monitoringTabContent" style="margin-top:10px;"></div>
    `;

    const tabsEl = document.getElementById("monitoringTabs");
    const contentEl = document.getElementById("monitoringTabContent");

    if (!tabsEl || !contentEl) return;

    const renderCurrentTab = (tab) => {
      const state = getCurrentSelection();
      if (tab === "biometria") {
        renderMonitoringTabBiometria(contentEl, experiment, state);
      } else if (tab === "uteis") {
        renderMonitoringTabPlantasUteis(contentEl, experiment, state);
      } else if (tab === "tombadas") {
        renderMonitoringTabPlantasTombadas(contentEl, experiment, state);
      }
    };

    const getCurrentSelection = () => {
      const blockInput = document.getElementById("monitorBlock");
      const plotInput = document.getElementById("monitorPlot");
      const block =
        blockInput && blockInput.value
          ? parseInt(blockInput.value, 10)
          : defaultBlock;
      const plotCode =
        (plotInput && plotInput.value.trim()) ||
        `B${block}P1`;
      return { block, plotCode };
    };

    tabsEl.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", function () {
        tabsEl
          .querySelectorAll("button")
          .forEach((b) => b.classList.remove("active"));
        this.classList.add("active");
        const tab = this.dataset.tab;
        renderCurrentTab(tab);
      });
    });

    renderCurrentTab("biometria");
  }

  function renderMonitoringTabBiometria(container, experiment, selection) {
    container.innerHTML = `
      <div style="margin-bottom:10px; font-size:13px; color:#4b5563;">
        <strong>Parcela:</strong> ${escapeHtml(
          selection.plotCode
        )} · Bloco ${selection.block}
      </div>

      <div style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
        <div style="flex:1 1 160px;">
          <label for="monDate">Data do monitoramento</label>
          <input type="date" id="monDate" />
        </div>
        <div style="flex:1 1 140px;">
          <label for="monHeight">Altura média (m)</label>
          <input type="number" step="0.01" id="monHeight" />
        </div>
        <div style="flex:1 1 140px;">
          <label for="monStemCount">Número de hastes</label>
          <input type="number" id="monStemCount" />
        </div>
        <div style="flex:1 1 140px;">
          <label for="monStemDiameter">Diâmetro da haste (cm)</label>
          <input type="number" step="0.1" id="monStemDiameter" />
        </div>
        <div style="flex:1 1 140px;">
          <label for="monCoverage">Índice de cobertura (%)</label>
          <input type="number" step="1" id="monCoverage" />
        </div>
        <div style="flex:1 1 140px;">
          <label for="monSanity">Sanidade (1–5)</label>
          <input type="number" min="1" max="5" id="monSanity" />
        </div>
      </div>

      <div style="margin-bottom:10px;">
        <label for="monNotes">Observações</label>
        <textarea id="monNotes" rows="3" style="width:100%; padding:9px 11px; border-radius:10px; border:1px solid #e5e7eb; font-size:14px; resize:vertical;"></textarea>
      </div>

      <div style="font-size:12px; color:#6b7280; margin-bottom:8px;">
        A brotação, mortalidade e tombamento são registrados nas abas próprias, usando o mesmo bloco/parcela.
      </div>

      <button class="btn-primary" style="width:auto; padding-inline:18px;" disabled>
        Salvar biometria (ligar ao banco depois)
      </button>
    `;
  }

  function renderMonitoringTabPlantasUteis(container, experiment, selection) {
    const usefulPerPlot = experiment.usefulplantsperplot || 12;

    container.innerHTML = `
      <div style="margin-bottom:10px; font-size:13px; color:#4b5563;">
        <strong>Parcela:</strong> ${escapeHtml(
          selection.plotCode
        )} · Bloco ${selection.block}
      </div>

      <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:10px;">
        <div style="flex:1 1 140px; background:#f1f5f9; border-radius:10px; padding:8px;">
          <div style="font-size:11px; color:#6b7280;">Plantas úteis/parcelas</div>
          <div style="font-size:18px; font-weight:700; color:#0f172a;">${usefulPerPlot}</div>
        </div>
        <div style="flex:1 1 140px; background:#dcfce7; border-radius:10px; padding:8px;">
          <div style="font-size:11px; color:#047857;">Brotadas</div>
          <div style="font-size:18px; font-weight:700; color:#065f46;">–</div>
        </div>
        <div style="flex:1 1 140px; background:#eff6ff; border-radius:10px; padding:8px;">
          <div style="font-size:11px; color:#1d4ed8;">Vivas</div>
          <div style="font-size:18px; font-weight:700; color:#1e3a8a;">–</div>
        </div>
        <div style="flex:1 1 140px; background:#fee2e2; border-radius:10px; padding:8px;">
          <div style="font-size:11px; color:#b91c1c;">Mortas</div>
          <div style="font-size:18px; font-weight:700; color:#7f1d1d;">–</div>
        </div>
      </div>

      <div style="margin-bottom:10px; font-size:13px; color:#374151;">
        <button class="btn-secondary" id="btnEditSproutStatus">
          Marcar brotação e mortalidade por planta
        </button>
      </div>

      <div style="font-size:12px; color:#6b7280;">
        Use o botão acima para abrir a grade visual de plantas. Cada clique alterna entre:
        <strong>não brotou → brotou/viva → morta</strong>. Plantas mortas em avaliações anteriores ficarão bloqueadas.
      </div>
    `;

    const btn = document.getElementById("btnEditSproutStatus");
    if (btn) {
      btn.onclick = () =>
        openPlantStatusDialog(selection, usefulPerPlot);
    }
  }

  function renderMonitoringTabPlantasTombadas(container, experiment, selection) {
    const usefulPerPlot = experiment.usefulplantsperplot || 12;

    container.innerHTML = `
      <div style="margin-bottom:10px; font-size:13px; color:#4b5563;">
        <strong>Parcela:</strong> ${escapeHtml(
          selection.plotCode
        )} · Bloco ${selection.block}
      </div>

      <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:10px;">
        <div style="flex:1 1 140px; background:#fef9c3; border-radius:10px; padding:8px;">
          <div style="font-size:11px; color:#854d0e;">Plantas vivas</div>
          <div style="font-size:18px; font-weight:700; color:#713f12;">–</div>
        </div>
        <div style="flex:1 1 140px; background:#fef3c7; border-radius:10px; padding:8px;">
          <div style="font-size:11px; color:#b45309;">Tombadas</div>
          <div style="font-size:18px; font-weight:700; color:#92400e;">–</div>
        </div>
        <div style="flex:1 1 160px; background:#fffbeb; border-radius:10px; padding:8px;">
          <div style="font-size:11px; color:#92400e;">Índice de tombamento (%)</div>
          <div style="font-size:18px; font-weight:700; color:#78350f;">–</div>
        </div>
      </div>

      <div style="margin-bottom:10px; font-size:13px; color:#374151;">
        <button class="btn-secondary" id="btnEditLodgingStatus">
          Marcar plantas tombadas
        </button>
      </div>

      <div style="font-size:12px; color:#6b7280;">
        Somente plantas <strong>brotadas e vivas</strong> podem ser marcadas como tombadas.
        Plantas mortas ou que não brotaram aparecem desabilitadas.
      </div>
    `;

    const btn = document.getElementById("btnEditLodgingStatus");
    if (btn) {
      btn.onclick = () =>
        openPlantLodgingDialog(selection, usefulPerPlot);
    }
  }

  function openMonitoringForm(experiment, plotFromUrl) {
    const params = new URLSearchParams(window.location.search);
    const plot = plotFromUrl || params.get("plot") || "";

    const bodyHtml = `
      <div style="font-size:13px; color:#4b5563; margin-bottom:10px;">
        Novo monitoramento manual para o experimento
        <strong>${escapeHtml(experiment.code || "")}</strong>.
      </div>

      <div style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
        <div style="flex:0 0 120px;">
          <label for="modalMonBlock">Bloco</label>
          <input type="number" id="modalMonBlock" min="1" value="1" />
        </div>
        <div style="flex:0 0 160px;">
          <label for="modalMonPlot">Parcela</label>
          <input type="text" id="modalMonPlot" value="${escapeHtml(
            plot
          )}" placeholder="Ex. B1P3" />
        </div>
        <div style="flex:0 0 160px;">
          <label for="modalMonDate">Data</label>
          <input type="date" id="modalMonDate" />
        </div>
      </div>

      <p style="font-size:12px; color:#6b7280; margin-bottom:8px;">
        Após salvar, você poderá detalhar biometria, plantas úteis e tombadas pelas abas da página principal.
      </p>

      <button class="btn-primary" style="width:100%;" disabled>
        Salvar monitoramento (ligar ao banco depois)
      </button>
    `;

    if (typeof openModal === "function") {
      openModal("Novo monitoramento", bodyHtml);
    } else {
      alert("Função de modal não encontrada no app.");
    }
  }

  function openPlantStatusDialog(selection, usefulPerPlot) {
    const itemsHtml = Array.from({ length: usefulPerPlot }).map((_, idx) => {
      const n = idx + 1;
      return `
        <button type="button"
          class="plant-circle"
          data-index="${n}"
          style="
            width:32px; height:32px; border-radius:999px;
            border:1px solid #d1d5db;
            background:#e5e7eb;
            color:#374151;
            font-size:12px;
            display:flex; align-items:center; justify-content:center;
            cursor:pointer;
          ">
          ${n}
        </button>
      `;
    }).join("");

    const bodyHtml = `
      <div style="font-size:13px; color:#4b5563; margin-bottom:8px;">
        Marcar brotação e mortalidade – Parcela ${escapeHtml(
          selection.plotCode
        )}, bloco ${selection.block}.
      </div>

      <div style="margin-bottom:8px; font-size:12px; color:#6b7280;">
        Clique em cada planta para alternar:
        <strong>cinza</strong> (não brotou) → <strong>verde</strong> (brotou/viva) → <strong>vermelho</strong> (morta).
      </div>

      <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px;">
        ${itemsHtml}
      </div>

      <button class="btn-primary" style="width:100%;" disabled>
        Salvar brotação/mortalidade (ligar ao banco depois)
      </button>
    `;

    if (typeof openModal === "function") {
      openModal("Plantas úteis – brotação/mortalidade", bodyHtml);
    } else {
      alert("Função de modal não encontrada no app.");
    }
  }

  function openPlantLodgingDialog(selection, usefulPerPlot) {
    const itemsHtml = Array.from({ length: usefulPerPlot }).map((_, idx) => {
      const n = idx + 1;
      return `
        <button type="button"
          class="plant-circle"
          data-index="${n}"
          style="
            width:32px; height:32px; border-radius:999px;
            border:1px solid #d1d5db;
            background:#dcfce7;
            color:#065f46;
            font-size:12px;
            display:flex; align-items:center; justify-content:center;
            cursor:pointer;
          ">
          ${n}
        </button>
      `;
    }).join("");

    const bodyHtml = `
      <div style="font-size:13px; color:#4b5563; margin-bottom:8px;">
        Marcar plantas tombadas – Parcela ${escapeHtml(
          selection.plotCode
        )}, bloco ${selection.block}.
      </div>

      <div style="margin-bottom:8px; font-size:12px; color:#6b7280;">
        Apenas plantas brotadas e vivas devem ser marcadas aqui.
        Clique para alternar entre <strong>em pé</strong> e <strong>tombada</strong>.
      </div>

      <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px;">
        ${itemsHtml}
      </div>

      <button class="btn-primary" style="width:100%;" disabled>
        Salvar tombamento (ligar ao banco depois)
      </button>
    `;

    if (typeof openModal === "function") {
      openModal("Plantas tombadas", bodyHtml);
    } else {
      alert("Função de modal não encontrada no app.");
    }
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
