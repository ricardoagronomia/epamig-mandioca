// mapadbc.js
// Versão simplificada para Hostinger, sem Supabase, apenas placeholder do Mapa DBC

// Estado temporário do Mapa DBC (por experimento)
const dbcState = {
  experimentId: null,
  experimentName: "",
  plotsByTemplateId: {}
};

let qrInitialized = false;

// Tratamentos padrão (mantido se quiser usar depois)
const DEFAULT_TREATMENTS = [
  { code: "AMARELA",    position: "VERTICAL"   },
  { code: "AMARELA",    position: "INCLINADA" },
  { code: "AMARELA",    position: "HORIZONTAL" },

  { code: "AMARELINHA", position: "VERTICAL"   },
  { code: "AMARELINHA", position: "INCLINADA" },
  { code: "AMARELINHA", position: "HORIZONTAL" },

  { code: "CACAU",      position: "VERTICAL"   },
  { code: "CACAU",      position: "INCLINADA" },
  { code: "CACAU",      position: "HORIZONTAL" },

  { code: "SABARÁ",     position: "VERTICAL"   },
  { code: "SABARÁ",     position: "INCLINADA" },
  { code: "SABARÁ",     position: "HORIZONTAL" }
];

// Função principal do Mapa DBC (placeholder)
function renderDbcMapPage(container) {
  container.innerHTML = `
    <div class="card">
      <h2>Mapa DBC</h2>
      <p style="margin-top:8px;">
        Versão temporária sem conexão com o banco. Em breve: croqui, tratamentos e QR Codes
        integrados ao MariaDB na Hostinger.
      </p>
    </div>
  `;
}

// Gancho simples para o roteador do app
window.renderDbcPage = function (container) {
  renderDbcMapPage(container);
};
