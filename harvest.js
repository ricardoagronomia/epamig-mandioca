// harvest.js
// Página de Colheita

(function () {
  let currentHarvestId = null;

  window.renderHarvestPage = renderHarvestPage;

  function renderHarvestPage(container) {
    const experiment = window.currentExperiment;

    if (!experiment) {
      container.innerHTML = `
        <div class="card">
          <p style="color:#6b7280;">
            Nenhum experimento selecionado. Selecione um experimento na página "Experimentos" para registrar colheitas.
          </p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="content-header">
        <div class="content-title">Colheita</div>
        <div class="content-subtitle">
          Registre peso total, raízes comerciais e qualidade de cada parcela na colheita.
        </div>
      </div>

      <div class="card" id="harvestHeaderCard">
        <div style="display:flex; flex-wrap:wrap; justify-content:space-between; gap:10px; align-items:center;">
          <div style="font-size:14px; color:#4b5563;">
            Experimento <strong>${escapeHtml(experiment.code || "")}</strong> · 
            ${escapeHtml(experiment.name || "Sem nome")}<br>
            <span style="font-size:12px; color:#6b7280;">
              Selecione bloco e parcela para registrar a colheita.
            </span>
          </div>
        </div>
        <div style="margin-top:10px; font-size:13px; color:#6b7280;">
          <span id="harvestCounter">– colheitas registradas</span>
        </div>
      </div>

      <div class="card" id="harvestFormCard"></div>

      <div class="card" id="harvestListCard">
        <div style="font-size:14px; font-weight:600; color:#065f46; margin-bottom:6px;">
          Registros anteriores
        </div>
        <div id="harvestList"></div>
      </div>
    `;

    setupHarvestForm(document.getElementById("harvestFormCard"), experiment);
    loadHarvestList();
  }

  function setupHarvestForm(container, experiment) {
    const isVisitor = window.currentRole === "visitor";

    container.innerHTML = `
      <div style="margin-bottom:10px;">
        <div style="font-size:14px; font-weight:600; color:#065f46; margin-bottom:6px;">
          ${currentHarvestId ? "Editar colheita" : "Nova colheita"}
        </div>
      </div>

      <div style="display:flex; flex-wrap:wrap; gap:8px; font-size:13px; color:#374151; margin-bottom:12px;">
        <div style="flex:0 0 120px;">
          <label for="harvestBlock">Bloco</label>
          <select id="harvestBlock" ${isVisitor ? "disabled" : ""}>
            <option value="1">Bloco 1</option>
            <option value="2">Bloco 2</option>
            <option value="3">Bloco 3</option>
          </select>
        </div>
        <div style="flex:0 0 160px;">
          <label for="harvestPlot">Parcela</label>
          <select id="harvestPlot" ${isVisitor ? "disabled" : ""}>
            <option value="">Selecione...</option>
            <option value="T1">T1</option>
            <option value="T2">T2</option>
            <option value="T3">T3</option>
            <option value="T4">T4</option>
            <option value="T5">T5</option>
            <option value="T6">T6</option>
            <option value="T7">T7</option>
            <option value="T8">T8</option>
            <option value="T9">T9</option>
            <option value="T10">T10</option>
            <option value="T11">T11</option>
            <option value="T12">T12</option>
          </select>
        </div>
      </div>

      <div style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
        <div style="flex:0 0 180px;">
          <label for="harvestDate">Data da colheita</label>
          <input type="date" id="harvestDate" ${isVisitor ? "disabled" : ""} />
        </div>
        <div style="flex:1 1 160px;">
          <label for="harvestWeight">Peso total (kg)</label>
          <input type="number" step="0.01" id="harvestWeight" placeholder="Ex. 15.5" ${isVisitor ? "disabled" : ""} />
        </div>
        <div style="flex:1 1 180px;">
          <label for="harvestRoots">Nº raízes comerciais</label>
          <input type="number" id="harvestRoots" placeholder="Ex. 32" ${isVisitor ? "disabled" : ""} />
        </div>
        <div style="flex:1 1 160px;">
          <label for="harvestDiameter">Diâmetro médio (cm)</label>
          <input type="number" step="0.1" id="harvestDiameter" placeholder="Ex. 6.5" ${isVisitor ? "disabled" : ""} />
        </div>
        <div style="flex:1 1 140px;">
          <label for="harvestQuality">Qualidade (1-5)</label>
          <input type="number" min="1" max="5" id="harvestQuality" placeholder="Ex. 4" ${isVisitor ? "disabled" : ""} />
        </div>
        <div style="flex:1 1 180px;">
          <label for="harvestSample">Código da amostra</label>
          <input type="text" id="harvestSample" placeholder="Ex. B1T1-V1" ${isVisitor ? "disabled" : ""} />
        </div>
      </div>

      <div style="margin-bottom:10px;">
        <label for="harvestNotes">Observações</label>
        <textarea id="harvestNotes" rows="3" ${isVisitor ? "disabled" : ""}
          style="width:100%; padding:9px 11px; border-radius:10px; border:1px solid #e5e7eb; font-size:14px; resize:vertical;"
          placeholder="Notas sobre a colheita, problemas de campo, qualidade visual, etc."></textarea>
      </div>

      <div style="display:flex; gap:8px; justify-content:flex-end;">
        ${currentHarvestId ? `
          <button class="btn-secondary" onclick="clearHarvestForm()" ${isVisitor ? "disabled" : ""}>
            Cancelar
          </button>
        ` : ''}
        <button class="btn-primary" style="width:auto; padding-inline:18px;" 
          onclick="saveHarvest()" ${isVisitor ? "disabled" : ""}>
          ${currentHarvestId ? "Atualizar colheita" : "Salvar colheita"}
        </button>
      </div>
    `;
  }

  window.saveHarvest = async function saveHarvest() {
    if (window.currentRole === "visitor") {
      alert("Visitantes têm acesso somente leitura.");
      return;
    }

    const experiment = window.currentExperiment;
    if (!experiment || !experiment.id) {
      alert("Nenhum experimento selecionado.");
      return;
    }

    const block = parseInt(document.getElementById("harvestBlock")?.value, 10) || 1;
    const plotCode = document.getElementById("harvestPlot")?.value.trim();
    const date = document.getElementById("harvestDate")?.value || null;
    const weight = document.getElementById("harvestWeight")?.value || null;
    const roots = document.getElementById("harvestRoots")?.value || null;
    const diameter = document.getElementById("harvestDiameter")?.value || null;
    const quality = document.getElementById("harvestQuality")?.value || null;
    const sample = document.getElementById("harvestSample")?.value.trim() || null;
    const notes = document.getElementById("harvestNotes")?.value.trim() || null;

    if (!plotCode) {
      alert("Selecione uma parcela.");
      return;
    }

    if (!date) {
      alert("Informe a data da colheita.");
      return;
    }

    const payload = {
      experiment_id: experiment.id,
      plot_code: plotCode,
      block_number: block,
      harvest_date: date,
      total_weight_kg: weight ? Number(weight) : null,
      commercial_roots_count: roots ? Number(roots) : null,
      mean_diameter_cm: diameter ? Number(diameter) : null,
      quality_score: quality ? Number(quality) : null,
      sample_code: sample,
      notes: notes,
    };

    try {
      const isEditing = !!currentHarvestId;

      if (currentHarvestId) {
        const { error } = await s
          .from("harvest_records")
          .update(payload)
          .eq("id", currentHarvestId);
        if (error) throw error;
      } else {
        const { error } = await s.from("harvest_records").insert(payload);
        if (error) throw error;
      }

      loadHarvestList();

      if (isEditing) {
        alert("Colheita atualizada com sucesso.");
        clearHarvestForm();
      } else {
        alert("Colheita registrada com sucesso.");
        // Limpar apenas os campos, não o formulário todo
        document.getElementById("harvestDate").value = "";
        document.getElementById("harvestWeight").value = "";
        document.getElementById("harvestRoots").value = "";
        document.getElementById("harvestDiameter").value = "";
        document.getElementById("harvestQuality").value = "";
        document.getElementById("harvestSample").value = "";
        document.getElementById("harvestNotes").value = "";
      }
    } catch (err) {
      console.error("Erro ao salvar colheita:", err);
      alert("Erro ao salvar colheita.");
    }
  };

  async function loadHarvestList() {
    const experiment = window.currentExperiment;
    if (!experiment || !experiment.id) return;

    const listDiv = document.getElementById("harvestList");
    const counterSpan = document.getElementById("harvestCounter");

    if (!listDiv) return;

    try {
      const { data, error } = await s
        .from("harvest_records")
        .select("*")
        .eq("experiment_id", experiment.id)
        .order("harvest_date", { ascending: false });

      if (error) throw error;

      // Ordenar por data, bloco e parcela
      const sortedData = (data || []).sort((a, b) => {
        if (a.harvest_date !== b.harvest_date) {
          return b.harvest_date.localeCompare(a.harvest_date);
        }
        if (a.block_number !== b.block_number) {
          return a.block_number - b.block_number;
        }
        const numA = parseInt(a.plot_code.replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(b.plot_code.replace(/\D/g, ''), 10) || 0;
        return numA - numB;
      });

      if (counterSpan) {
        counterSpan.textContent = `${sortedData.length} colheitas registradas`;
      }

      if (!sortedData || sortedData.length === 0) {
        listDiv.innerHTML = `<p style="font-size:13px; color:#6b7280;">Nenhuma colheita registrada ainda.</p>`;
        return;
      }

      const formatDate = (iso) => {
        if (!iso) return "";
        const [y, m, d] = iso.split("-");
        return `${d}/${m}/${y}`;
      };

      const isVisitor = window.currentRole === "visitor";

      listDiv.innerHTML = `
        <div style="overflow-x:auto;">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Parcela</th>
                <th>Bloco</th>
                <th>Peso (kg)</th>
                <th>Raízes</th>
                <th>Diâm. (cm)</th>
                <th>Qualidade</th>
                <th>Amostra</th>
                <th style="width:180px;">Ações</th>
              </tr>
            </thead>
            <tbody>
              ${sortedData.map((row) => `
                <tr>
                  <td>${formatDate(row.harvest_date)}</td>
                  <td>${row.plot_code}</td>
                  <td>${row.block_number}</td>
                  <td>${row.total_weight_kg || "-"}</td>
                  <td>${row.commercial_roots_count || "-"}</td>
                  <td>${row.mean_diameter_cm || "-"}</td>
                  <td>${row.quality_score || "-"}</td>
                  <td>${row.sample_code || "-"}</td>
                  <td>
                    <div style="display:flex; gap:4px; align-items:center; justify-content:flex-start;">
                      ${
                        isVisitor
                          ? `<span style="font-size:11px; color:#9ca3af;">Somente leitura</span>`
                          : `
                            <button type="button" class="btn-secondary"
                              style="font-size:11px; padding:4px 6px; white-space:nowrap;"
                              onclick="editHarvest('${row.id}')">
                              ✏️ Editar
                            </button>
                            <button type="button" class="btn-danger"
                              style="font-size:11px; padding:4px 6px; white-space:nowrap;"
                              onclick="confirmDeleteHarvest('${row.id}')">
                              🗑️ Excluir
                            </button>
                          `
                      }
                    </div>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      console.error("Erro ao carregar colheitas:", err);
      listDiv.innerHTML = `<p style="font-size:13px; color:#b91c1c;">Erro ao carregar colheitas.</p>`;
    }
  }

  window.editHarvest = async function editHarvest(id) {
    if (window.currentRole === "visitor") return;

    try {
      const { data: row, error } = await s
        .from("harvest_records")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (!row) {
        alert("Colheita não encontrada.");
        return;
      }

      currentHarvestId = row.id;

      const experiment = window.currentExperiment;
      setupHarvestForm(document.getElementById("harvestFormCard"), experiment);

      setTimeout(() => {
        document.getElementById("harvestBlock").value = String(row.block_number || 1);
        document.getElementById("harvestPlot").value = row.plot_code || "";
        document.getElementById("harvestDate").value = row.harvest_date || "";
        document.getElementById("harvestWeight").value = row.total_weight_kg || "";
        document.getElementById("harvestRoots").value = row.commercial_roots_count || "";
        document.getElementById("harvestDiameter").value = row.mean_diameter_cm || "";
        document.getElementById("harvestQuality").value = row.quality_score || "";
        document.getElementById("harvestSample").value = row.sample_code || "";
        document.getElementById("harvestNotes").value = row.notes || "";
      }, 50);
    } catch (err) {
      console.error("Erro ao carregar colheita para edição:", err);
      alert("Erro ao carregar colheita.");
    }
  };

  window.clearHarvestForm = function clearHarvestForm() {
    currentHarvestId = null;
    const experiment = window.currentExperiment;
    setupHarvestForm(document.getElementById("harvestFormCard"), experiment);
  };

  window.confirmDeleteHarvest = async function confirmDeleteHarvest(id) {
    if (window.currentRole === "visitor") {
      alert("Visitantes não podem excluir colheitas.");
      return;
    }

    if (!confirm("Deseja excluir este registro de colheita?")) return;

    try {
      const { error } = await s.from("harvest_records").delete().eq("id", id);
      if (error) throw error;
      loadHarvestList();
    } catch (err) {
      console.error("Erro ao excluir colheita:", err);
      alert("Erro ao excluir colheita.");
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
