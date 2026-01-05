// =============================
// experiments.js - VERSÃO CORRIGIDA
// =============================

// Configuração do módulo
const ExperimentsModule = (function() {
  // Estado privado
  let currentExperiment = null;
  let currentUser = null;
  let currentRole = null;
  let supabaseClient = null;
  
  // Inicializar módulo
  function init(supabase, user, role) {
    supabaseClient = supabase;
    currentUser = user;
    currentRole = role;
    console.log('Módulo de experimentos inicializado');
  }
  
  // Formatar data com fallback
  function formatExperimentDate(dateString) {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "-";
      return date.toLocaleDateString('pt-BR');
    } catch {
      return "-";
    }
  }
  
  // Sanitizar HTML
  function escapeHtml(str) {
    if (!str) return "";
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
  
  // Validar permissões
  function checkPermission(requiredRole) {
    if (!currentRole) return false;
    const hierarchy = { visitor: 0, collaborator: 1, admin: 2 };
    return hierarchy[currentRole] >= hierarchy[requiredRole];
  }
  
  // Página principal de Experimentos
  async function renderExperimentsPage(container) {
    if (!container) {
      console.error('Container não fornecido');
      return;
    }
    
    if (!currentRole) {
      container.innerHTML = `
        <div class="card">
          <p>Carregando permissões do usuário...</p>
        </div>
      `;
      return;
    }
    
    if (currentRole === "visitor") {
      container.innerHTML = `
        <div class="content-header">
          <div class="content-title">Experimentos</div>
          <div class="content-subtitle">Apenas administradores ou pesquisadores podem gerenciar experimentos.</div>
        </div>
        <div class="card">
          <p style="color:#b91c1c;">Você não tem permissão para acessar esta página.</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = `
      <div class="content-header">
        <div class="content-title">Experimentos</div>
        <div class="content-subtitle">
          Selecione qual experimento será usado para edição e inserção de dados.
        </div>
      </div>
      
      <div class="card" id="experimentsActions">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
          <div style="font-size:14px; color:#4b5563;">
            Gerencie os experimentos de campo cadastrados.
          </div>
          <button class="btn-primary" id="btnNewExperiment">
            + Novo experimento
          </button>
        </div>
      </div>
      
      <div id="experimentsList">
        <div class="card">
          <p>Carregando experimentos...</p>
        </div>
      </div>
    `;
    
    // Event listeners
    const btnNew = document.getElementById('btnNewExperiment');
    if (btnNew) {
      btnNew.addEventListener('click', () => openExperimentFormModal());
    }
    
    await loadExperimentsIntoList();
  }
  
  // Carregar lista de experimentos
  async function loadExperimentsIntoList() {
    const listEl = document.getElementById('experimentsList');
    if (!listEl) return;
    
    if (!supabaseClient) {
      listEl.innerHTML = `
        <div class="card">
          <p style="color:#b91c1c;">Cliente Supabase não configurado.</p>
        </div>
      `;
      return;
    }
    
    try {
      const { data: experiments, error } = await supabaseClient
        .from('experiments')
        .select('*')
        .order('planting_date', { ascending: false });
      
      if (error) throw error;
      
      if (!experiments || experiments.length === 0) {
        listEl.innerHTML = `
          <div class="card" style="text-align:center; padding:32px 16px;">
            <div style="font-size:40px; margin-bottom:8px; color:#6b7280;">🧪</div>
            <div style="font-size:18px; font-weight:700; color:#111827;">
              Nenhum experimento cadastrado
            </div>
            <div style="font-size:14px; color:#6b7280; margin-top:4px;">
              Crie seu primeiro experimento para começar.
            </div>
            <button class="btn-primary" style="margin-top:12px;" onclick="ExperimentsModule.openExperimentFormModal()">
              + Criar experimento
            </button>
          </div>
        `;
        return;
      }
      
      // Criar cards
      const cardsHtml = experiments.map(exp => createExperimentCard(exp)).join('');
      listEl.innerHTML = cardsHtml;
      
      // Adicionar event listeners aos cards
      attachEventListenersToCards(experiments);
      
    } catch (error) {
      console.error('Erro ao carregar experimentos:', error);
      listEl.innerHTML = `
        <div class="card">
          <p style="color:#b91c1c;">Erro ao carregar experimentos: ${escapeHtml(error.message)}</p>
        </div>
      `;
    }
  }
  
  // Criar card de experimento
  function createExperimentCard(exp) {
    const isSelected = currentExperiment && currentExperiment.id === exp.id;
    const status = exp.status || "active";
    const statusLabel = status === "active" ? "Ativo" : "Concluído";
    const planting = formatExperimentDate(exp.planting_date);
    const farm = exp.farm || "-";
    
    return `
      <div class="card experiment-card" data-id="${escapeHtml(exp.id)}">
        <div class="experiment-card-content">
          <div class="experiment-card-header">
            <div class="experiment-code">${escapeHtml(exp.code || "(sem código)")}</div>
            <span class="experiment-status status-${status}">
              ● ${escapeHtml(statusLabel)}
            </span>
          </div>
          <div class="experiment-name">${escapeHtml(exp.name || "Experimento sem descrição")}</div>
          <div class="experiment-details">
            <span>Plantio: ${escapeHtml(planting)}</span>
            <span>Local: ${escapeHtml(farm)}</span>
          </div>
        </div>
        
        <div class="experiment-actions">
          <button class="btn-${isSelected ? 'primary' : 'secondary'}" data-action="select">
            ${isSelected ? "Selecionado" : "Selecionar"}
          </button>
          <button class="btn-secondary" data-action="edit">
            Editar
          </button>
          <button class="btn-secondary" data-action="schedule">
            Cronograma
          </button>
          ${checkPermission('admin') ? `
            <button class="btn-danger" data-action="delete">
              Excluir
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  // Anexar event listeners aos cards
  function attachEventListenersToCards(experiments) {
    document.querySelectorAll('.experiment-card').forEach(card => {
      const id = card.dataset.id;
      const experiment = experiments.find(e => e.id === id);
      if (!experiment) return;
      
      card.querySelectorAll('button[data-action]').forEach(button => {
        const action = button.dataset.action;
        
        button.addEventListener('click', (e) => {
          e.stopPropagation();
          
          switch(action) {
            case 'select':
              selectExperiment(experiment);
              break;
            case 'edit':
              openExperimentFormModal(experiment);
              break;
            case 'schedule':
              openExperimentScheduleModal(experiment.id);
              break;
            case 'delete':
              confirmDeleteExperiment(experiment.id, experiment.code);
              break;
          }
        });
      });
    });
  }
  
  // Selecionar experimento
  async function selectExperiment(experiment) {
    currentExperiment = experiment;
    
    // Atualizar UI sem recarregar tudo
    document.querySelectorAll('.experiment-card').forEach(card => {
      const isSelected = card.dataset.id === experiment.id;
      const selectBtn = card.querySelector('[data-action="select"]');
      if (selectBtn) {
        selectBtn.className = isSelected ? 'btn-primary' : 'btn-secondary';
        selectBtn.textContent = isSelected ? 'Selecionado' : 'Selecionar';
      }
    });
    
    // Notificar app principal
    if (window.experimentSelectedCallback) {
      window.experimentSelectedCallback(experiment);
    }
    
    // Feedback
    showNotification(`Experimento "${experiment.code || ''}" selecionado.`, 'success');
  }
  
  // Confirmar exclusão
  async function confirmDeleteExperiment(id, code) {
    if (!checkPermission('admin')) {
      showNotification('Apenas administradores podem excluir experimentos.', 'error');
      return;
    }
    
    if (!confirm(`Tem certeza que deseja excluir o experimento "${code}"? Esta ação não pode ser desfeita.`)) {
      return;
    }
    
    await deleteExperiment(id);
  }
  
  // Excluir experimento
  async function deleteExperiment(id) {
    if (!supabaseClient) return;
    
    try {
      const { error } = await supabaseClient
        .from('experiments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      if (currentExperiment && currentExperiment.id === id) {
        currentExperiment = null;
      }
      
      showNotification('Experimento excluído com sucesso.', 'success');
      await loadExperimentsIntoList();
      
    } catch (error) {
      console.error('Erro ao excluir experimento:', error);
      showNotification(`Erro ao excluir: ${error.message}`, 'error');
    }
  }
  
  // Abrir modal de edição
  async function openExperimentFormModalById(id) {
    if (!id || !supabaseClient || !checkPermission('collaborator')) return;
    
    try {
      const { data: experiment, error } = await supabaseClient
        .from('experiments')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      openExperimentFormModal(experiment);
      
    } catch (error) {
      console.error('Erro ao carregar experimento:', error);
      showNotification(`Erro: ${error.message}`, 'error');
    }
  }
  
  // Helper para mostrar notificações
  function showNotification(message, type = 'info') {
    const types = {
      success: { bg: '#10b981', color: '#fff' },
      error: { bg: '#ef4444', color: '#fff' },
      info: { bg: '#3b82f6', color: '#fff' }
    };
    
    const style = types[type] || types.info;
    alert(message); // Substituir por sistema de notificações real
  }
  
  // Interface pública do módulo
  return {
    init,
    renderExperimentsPage,
    openExperimentFormModal: (exp) => {
      if (!checkPermission('collaborator')) {
        showNotification('Você não tem permissão para criar/editar experimentos.', 'error');
        return;
      }
      // Implementação do modal aqui...
    },
    openExperimentScheduleModal: (id) => {
      // Implementação do cronograma aqui...
    },
    getCurrentExperiment: () => currentExperiment,
    setCurrentExperiment: (exp) => { currentExperiment = exp; },
    checkPermission
  };
})();

// Expor globalmente se necessário
window.ExperimentsModule = ExperimentsModule;
