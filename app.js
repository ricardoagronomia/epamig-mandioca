// app.js - versão Hostinger com "Admin Local"

// Usuário fixo (temporário) para pular login
window.currentUser = { id: 'local-admin', email: 'admin@local' };
window.currentRole = 'admin';

// Página inicial
var currentPage = 'experiments';

// Utilitário de data (usado em outros módulos)
window.formatDate = function (d) {
  if (!d) return '-';
  var str = String(d).split('T')[0];
  var parts = str.split('-');
  if (parts.length !== 3) return str;
  return parts[2] + '/' + parts[1] + '/' + parts[0];
};

// Modal genérico
window.openModal = function (title, bodyHtml) {
  var root = document.getElementById('modalRoot');
  if (!root) return;
  var t = document.getElementById('modalTitle');
  var b = document.getElementById('modalBody');
  if (t) t.innerHTML = title;
  if (b) b.innerHTML = bodyHtml;
  root.style.display = 'flex';
};

window.closeModal = function () {
  var root = document.getElementById('modalRoot');
  if (root) root.style.display = 'none';
};

// Quando a página carrega
document.addEventListener('DOMContentLoaded', function () {
  var auth = document.getElementById('authScreen');
  var app = document.getElementById('appScreen');

  // Pula a tela de login e mostra o app direto
  if (auth) auth.style.display = 'none';
  if (app) app.style.display = 'flex';

  // Mostra o "Admin Local" no canto superior direito
  var el = document.getElementById('userEmail');
  if (el) el.innerHTML = 'Admin Local';

  // Botão de "sair" só recarrega a página por enquanto
  var btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.onclick = function () {
      location.reload();
    };
  }

  // Modal (fechar ao clicar no X ou fora)
  var mc = document.getElementById('modalClose');
  if (mc) mc.onclick = closeModal;

  var mr = document.getElementById('modalRoot');
  if (mr) {
    mr.addEventListener('click', function (e) {
      if (e.target.id === 'modalRoot') closeModal();
    });
  }

  // Navegação lateral (sidebar)
  var items = document.querySelectorAll('.sidebar-item');
  items.forEach(function (item) {
    item.addEventListener('click', function () {
      items.forEach(function (i) {
        i.classList.remove('active');
      });
      item.classList.add('active');
      currentPage = item.dataset.page;
      renderPage();
    });
  });

  // Marca Experimentos como ativo por padrão
  var first = document.querySelector('.sidebar-item[data-page="experiments"]');
  if (first) first.classList.add('active');

  renderPage();
});

// Roteador de páginas
function renderPage() {
  var area = document.getElementById('contentArea');
  if (!area) return;

  area.innerHTML = '\nCarregando...\n';

  var map = {
    experiments: 'renderExperimentsPage',
    dbc: 'renderDbcPage',
    dashboard: 'renderDashboardPage',
    monitoring: 'renderMonitoringPage',
    'monitoring-drone': 'renderDronePage',
    harvest: 'renderHarvestPage',
    interventions: 'renderInterventionsPage',
    climate: 'renderClimatePage',
    charts: 'renderChartsPage',
    reports: 'renderReportsPage',
    cronograma: 'renderCronogramaPage'
  };

  var fnName = map[currentPage];
  if (fnName && typeof window[fnName] === 'function') {
    window[fnName](area);
  } else {
    area.innerHTML = '\nMódulo **' + currentPage + '** não carregado.\n';
  }
}
