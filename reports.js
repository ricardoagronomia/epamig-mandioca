// reports.js
// Página de Relatórios – consolidação geral dos dados, exportação em PDF e Excel

(function () {
  window.renderReportsPage = renderReportsPage;

  function renderReportsPage(container) {
    const experiment = window.currentExperiment || null;

    container.innerHTML = `
      <div class="content-header">
        <div class="content-title">Relatórios</div>
        <div class="content-subtitle">
          Gere relatórios consolidados em PDF e exporte tabelas de dados em Excel para análises estatísticas e backup convencional.
        </div>
      </div>

      <!-- Contexto do experimento -->
      <div class="card">
        <div style="display:flex; flex-wrap:wrap; gap:10px; align-items:center; justify-content:space-between;">
          <div style="font-size:13px; color:#4b5563;">
            ${
              experiment
                ? `
              Experimento <strong>${escapeHtml(experiment.code || "")}</strong> ·
              ${escapeHtml(experiment.name || "Sem nome")}<br>
              <span style="font-size:12px; color:#6b7280;">
                Inclui dados de monitoramento, colheita, drone, clima, intervenções e cronograma.
              </span>
            `
                : `
              <span style="color:#6b7280;">
                Nenhum experimento selecionado. Selecione um experimento na aba "Experimentos" para gerar relatórios.
              </span>
            `
            }
          </div>
        </div>
      </div>

      <!-- Seção de relatório geral em PDF -->
      <div class="card">
        <div style="font-size:14px; font-weight:600; color:#065f46; margin-bottom:6px;">
          📄 Relatório geral do experimento (em desenvolvimento)
        </div>
        <p style="font-size:13px; color:#6b7280; margin-bottom:12px;">
          Gera um documento consolidado em PDF contendo resumo executivo, layout experimental, cronograma,
          descrição dos tratamentos, dados de monitoramento, colheita e análise climática integrada.
        </p>

        <div style="
          border-radius:10px;
          border:1px solid #e5e7eb;
          padding:12px;
          background:#f0fdf4;
          display:flex;
          flex-direction:column;
          gap:8px;
        ">
          <div style="font-size:13px; color:#374151;">
            <strong>Conteúdo do relatório:</strong>
          </div>

          <ul style="font-size:12px; color:#4b5563; padding-left:18px; margin:0;">
            <li>Capa com código, nome e período do experimento.</li>
            <li>Resumo executivo (objetivos, principais resultados).</li>
            <li>Descrição do campo (localização, solo, clima local).</li>
            <li>Layout experimental (mapa visual dos blocos e tratamentos).</li>
            <li>Cronograma de eventos (plantio, avaliações, colheita).</li>
            <li>Descrição dos tratamentos (formulações, doses, datas de aplicação).</li>
            <li>Tabelas e gráficos de desempenho (altura, sanidade, produção).</li>
            <li>Dados climáticos integrados (chuva, temperatura, variabilidade).</li>
            <li>Conclusões e recomendações.</li>
            <li>Histórico de intervenções (adubação, controle, irrigação).</li>
          </ul>

          <div style="margin-top:8px;">
            <button class="btn-primary" style="width:100%; padding:10px; font-size:13px;" disabled>
              Gerar relatório em PDF
            </button>
          </div>
        </div>
      </div>

      <!-- Seção de exportação de tabelas em Excel -->
      <div class="card">
        <div style="font-size:14px; font-weight:600; color:#065f46; margin-bottom:6px;">
          📊 Exportar tabelas em Excel (em desenvolvimento)
        </div>
        <p style="font-size:13px; color:#6b7280; margin-bottom:12px;">
          Exporte tabelas individuais ou em lote para análise estatística externa, regressão, ANOVA ou outros cálculos.
          Formato pronto para R, Python, SPSS ou softwares de análise estatística.
        </p>

        <div style="
          display:grid;
          grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));
          gap:10px;
        ">
          <!-- Tabela: Monitoramento -->
          <div style="
            border-radius:10px;
            border:1px solid #e5e7eb;
            padding:10px;
            background:#eff6ff;
          ">
            <div style="font-size:13px; font-weight:600; color:#1e40af; margin-bottom:6px;">
              Monitoramento
            </div>
            <p style="font-size:12px; color:#4b5563; margin-bottom:8px;">
              Altura, cobertura, sanidade, plantas vivas/tombadas por avaliação.
            </p>
            <button class="btn-secondary" style="width:100%; padding:8px; font-size:12px;" disabled>
              Exportar .xlsx
            </button>
          </div>

          <!-- Tabela: Colheita -->
          <div style="
            border-radius:10px;
            border:1px solid #e5e7eb;
            padding:10px;
            background:#fef3c7;
          ">
            <div style="font-size:13px; font-weight:600; color:#92400e; margin-bottom:6px;">
              Colheita
            </div>
            <p style="font-size:12px; color:#4b5563; margin-bottom:8px;">
              Peso total, raízes comerciais, perdas por parcela e bloco.
            </p>
            <button class="btn-secondary" style="width:100%; padding:8px; font-size:12px;" disabled>
              Exportar .xlsx
            </button>
          </div>

          <!-- Tabela: Drone (NDVI) -->
          <div style="
            border-radius:10px;
            border:1px solid #e5e7eb;
            padding:10px;
            background:#ecfdf5;
          ">
            <div style="font-size:13px; font-weight:600; color:#065f46; margin-bottom:6px;">
              Drone (NDVI)
            </div>
            <p style="font-size:12px; color:#4b5563; margin-bottom:8px;">
              Índice de vegetação normalizado por data e tratamento.
            </p>
            <button class="btn-secondary" style="width:100%; padding:8px; font-size:12px;" disabled>
              Exportar .xlsx
            </button>
          </div>

          <!-- Tabela: Clima -->
          <div style="
            border-radius:10px;
            border:1px solid #e5e7eb;
            padding:10px;
            background:#f0f9ff;
          ">
            <div style="font-size:13px; font-weight:600; color:#0c4a6e; margin-bottom:6px;">
              Clima
            </div>
            <p style="font-size:12px; color:#4b5563; margin-bottom:8px;">
              Precipitação diária, máximas e mínimas, resumo mensal e acumulado.
            </p>
            <button class="btn-secondary" style="width:100%; padding:8px; font-size:12px;" disabled>
              Exportar .xlsx
            </button>
          </div>

          <!-- Tabela: Intervenções -->
          <div style="
            border-radius:10px;
            border:1px solid #e5e7eb;
            padding:10px;
            background:#fce7f3;
          ">
            <div style="font-size:13px; font-weight:600; color:#831843; margin-bottom:6px;">
              Intervenções
            </div>
            <p style="font-size:12px; color:#4b5563; margin-bottom:8px;">
              Histórico de adubação, controle, irrigação e outras operações.
            </p>
            <button class="btn-secondary" style="width:100%; padding:8px; font-size:12px;" disabled>
              Exportar .xlsx
            </button>
          </div>

          <!-- Tabela: Resumo consolidado -->
          <div style="
            border-radius:10px;
            border:1px solid #e5e7eb;
            padding:10px;
            background:#f5f3ff;
          ">
            <div style="font-size:13px; font-weight:600; color:#6b21a8; margin-bottom:6px;">
              Resumo consolidado
            </div>
            <p style="font-size:12px; color:#4b5563; margin-bottom:8px;">
              Todas as tabelas em um único arquivo Excel (abas separadas).
            </p>
            <button class="btn-primary" style="width:100%; padding:8px; font-size:12px;" disabled>
              Exportar tudo .xlsx
            </button>
          </div>
        </div>
      </div>

      <!-- Seção de configurações de relatório -->
      <div class="card">
        <div style="font-size:14px; font-weight:600; color:#065f46; margin-bottom:6px;">
          ⚙️ Opções de geração (em desenvolvimento)
        </div>
        <p style="font-size:13px; color:#6b7280; margin-bottom:10px;">
          Personalize o conteúdo e formato dos relatórios antes de gerar.
        </p>

        <div style="display:flex; flex-wrap:wrap; gap:12px;">
          <label style="display:flex; align-items:center; gap:6px; font-size:13px; color:#374151;">
            <input type="checkbox" disabled />
            Incluir gráficos (altura, sanidade, produção)
          </label>
          <label style="display:flex; align-items:center; gap:6px; font-size:13px; color:#374151;">
            <input type="checkbox" disabled />
            Incluir análise de clima integrada
          </label>
          <label style="display:flex; align-items:center; gap:6px; font-size:13px; color:#374151;">
            <input type="checkbox" disabled />
            Incluir recomendações técnicas
          </label>
          <label style="display:flex; align-items:center; gap:6px; font-size:13px; color:#374151;">
            <input type="checkbox" disabled />
            Incluir logotipo/marca
          </label>
        </div>
      </div>

      <!-- Seção de histórico de relatórios -->
      <div class="card">
        <div style="font-size:14px; font-weight:600; color:#065f46; margin-bottom:6px;">
          📋 Histórico de relatórios (em desenvolvimento)
        </div>
        <p style="font-size:13px; color:#6b7280; margin-bottom:8px;">
          Rastreia relatórios gerados, datas e versões, permitindo comparações entre períodos ou iterações do experimento.
        </p>

        <div style="
          border-radius:10px;
          border:1px dashed #d1d5db;
          padding:10px 12px;
          font-size:13px;
          color:#6b7280;
          background:#f9fafb;
        ">
          Nenhum relatório gerado ainda.
          <br>
          <span style="font-size:12px;">
            Assim que você gerar o primeiro relatório, ele será listado aqui com data, tipo (PDF/Excel) e opção de download.
          </span>
        </div>
      </div>

      <!-- Nota sobre backup e análise -->
      <div class="card" style="background:#f0fdf4; border:1px solid #86efac;">
        <div style="font-size:13px; color:#374151;">
          <strong>💡 Dica:</strong> Utilize a exportação em Excel como backup convencional de seus dados.
          As tabelas exportadas podem ser importadas em qualquer momento para reconstruir o experimento,
          fazer análises estatísticas em R ou Python, ou compartilhar com colaboradores externos.
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
