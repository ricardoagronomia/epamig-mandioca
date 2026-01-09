// =====================================
// SUPABASE CLIENT
// =====================================
const { createClient } = supabase;

const SUPABASE_URL = "https://zzvgecovfucnpktitszv.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dmdlY292ZnVjbnBrdGl0c3p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyOTk0NTYsImV4cCI6MjA4Mjg3NTQ1Nn0.WTtcpM3jtSa9TeVA4oEH-t_7naTrKZw83Tw6ZM0HwtI"; // anon public key
const s = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


// =====================================
// STATE
// =====================================
let currentUser = null;
let currentRole = null;
let currentPage = "experiments"; // página padrão

// =====================================
// HELPERS
// =====================================
const $ = (id) => document.getElementById(id);

function setAuthMessage(text, type) {
  const box = $("authMessage");
  box.textContent = text;
  box.className = "auth-message " + (type || "");
  box.style.display = text ? "block" : "none";
}

function formatDate(dateString) {
  if (!dateString) return "-";
  const [y, m, d] = dateString.split("T")[0].split("-");
  return `${d}/${m}/${y}`;
}

// =====================================
// INIT
// =====================================
(async () => {
  setupAuthUI();
  setupAppUI();

  const params = new URLSearchParams(window.location.search);
  const inviteToken = params.get("invite");

  if (inviteToken) {
    await showInviteAcceptScreen(inviteToken);
    return;
  }

  const { data: { session } } = await s.auth.getSession();
  if (session) {
    currentUser = session.user;
    await loadUserRole();
    showApp();
  } else {
    showAuth();
  }
})();

async function showInviteAcceptScreen(token) {
  try {
    const { data: invite, error } = await s
      .from("invitations")
      .select("*")
      .eq("token", token)
      .is("accepted_at", null)
      .single();

    if (error || !invite) {
      alert("Convite inválido ou já utilizado.");
      showAuth();
      return;
    }

    // mostra a tela de auth e pré‑preenche o formulário de cadastro
    showAuth();
    document.getElementById("tabSignup").click();

    // preenche e bloqueia o e-mail de cadastro com o e‑mail do convite
    const emailInput = document.getElementById("signupEmail");
    emailInput.value = invite.email;
    emailInput.readOnly = true;

    // guarda o token em atributo data para usar no signup
    emailInput.dataset.inviteToken = token;
  } catch (err) {
    alert("Erro ao carregar convite.");
    showAuth();
  }
}

// =====================================
// AUTH UI
// =====================================
function setupAuthUI() {
  const tabLogin = $("tabLogin");
  const tabSignup = $("tabSignup");
  const loginForm = $("loginForm");
  const signupForm = $("signupForm");

  tabLogin.onclick = () => {
    tabLogin.classList.add("active");
    tabSignup.classList.remove("active");
    loginForm.style.display = "block";
    signupForm.style.display = "none";
    setAuthMessage("", "");
  };

  tabSignup.onclick = () => {
    tabSignup.classList.add("active");
    tabLogin.classList.remove("active");
    loginForm.style.display = "none";
    signupForm.style.display = "block";
    setAuthMessage("", "");
  };

  $("btnLogin").onclick = handleLogin;
  $("btnSignup").onclick = handleSignup;
}

async function handleLogin() {
  const email = $("loginEmail").value.trim();
  const password = $("loginPassword").value;

  if (!email || !password) {
    setAuthMessage("Preencha e-mail e senha.", "error");
    return;
  }
  try {
    const { data, error } = await s.auth.signInWithPassword({ email, password });
    if (error) throw error;
    currentUser = data.user;
    await loadUserRole();
    showApp();
  } catch (err) {
    setAuthMessage(err.message || "Erro ao entrar.", "error");
  }
}

async function handleSignup() {
  const emailInput = $("signupEmail");
  const email = emailInput.value.trim();
  const password = $("signupPassword").value;
  const inviteToken = emailInput.dataset.inviteToken || null;

  if (!email || !password) {
    setAuthMessage("Preencha e-mail e senha.", "error");
    return;
  }
  if (password.length < 6) {
    setAuthMessage("Senha deve ter no mínimo 6 caracteres.", "error");
    return;
  }

  try {
    // se veio de convite, valida o token e obtém role
    let roleToSet = "visitor";
    if (inviteToken) {
      const { data: invite, error: inviteError } = await s
        .from("invitations")
        .select("*")
        .eq("token", inviteToken)
        .is("accepted_at", null)
        .single();

      if (inviteError || !invite) {
        setAuthMessage("Convite inválido ou já utilizado.", "error");
        return;
      }

      // garante que o e-mail digitado == e-mail do convite
      if (invite.email.toLowerCase() !== email.toLowerCase()) {
        setAuthMessage("E-mail não confere com o e-mail convidado.", "error");
        return;
      }

      roleToSet = invite.role;
    }

    const { data, error } = await s.auth.signUp({ email, password });
    if (error) throw error;

    await s.from("user_profiles").upsert({ id: data.user.id, email });
    await s.from("user_roles").upsert({ user_id: data.user.id, role: roleToSet });

    // marca convite como aceito, se houver
    if (inviteToken) {
      await s
        .from("invitations")
        .update({ accepted_at: new Date().toISOString() })
        .eq("token", inviteToken);
    }

    setAuthMessage("Conta criada com sucesso. Faça login.", "success");
    $("tabLogin").click();
  } catch (err) {
    setAuthMessage(err.message || "Erro ao cadastrar.", "error");
  }
}

function showAuth() {
  $("authScreen").style.display = "block";
  $("appScreen").style.display = "none";
}

// =====================================
// APP UI
// =====================================
function setupAppUI() {
  $("btnLogout").onclick = async () => {
    await s.auth.signOut();
    currentUser = null;
    currentRole = null;
    showAuth();
  };

  $("modalClose").onclick = closeModal;
  $("modalRoot").onclick = (ev) => {
    if (ev.target.id === "modalRoot") closeModal();
  };

  document.querySelectorAll(".sidebar-item").forEach((item) => {
    item.addEventListener("click", () => {
      if (item.classList.contains("disabled")) return;
      document.querySelectorAll(".sidebar-item").forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      currentPage = item.dataset.page;
      renderPage();
    });
  });
}

async function loadUserRole() {
  const { data } = await s
    .from("user_roles")
    .select("role")
    .eq("user_id", currentUser.id)
    .single();
  currentRole = data?.role || "visitor";
}

function showApp() {
  $("authScreen").style.display = "none";
  $("appScreen").style.display = "flex";

  // preenche e-mail + role no cabeçalho
  if (currentUser) {
    const el = $("userEmail");
    if (el) el.textContent = `${currentUser.email} · ${roleLabel(currentRole)}`;
  }

  const subtitle = document.getElementById("headerSubtitle");
  if (subtitle) subtitle.textContent = "Painel geral";

  // ========= VISIBILIDADE DO MENU POR ROLE =========

  // Mapa DBC: liberado para todas as roles (inclusive visitor)
  const elDbc = document.querySelector('[data-page="dbc-map"]');
  if (elDbc) elDbc.classList.remove("disabled");

  // Experimentos: admin + pesquisador
  if (currentRole === "admin" || currentRole === "collaborator") {
    const elExperiments = document.querySelector('[data-page="experiments"]');
    if (elExperiments) elExperiments.classList.remove("disabled");
    const elNew = document.querySelector('[data-page="new-experiment"]');
    if (elNew) elNew.classList.remove("disabled");
  }
  
  // Monitoramento: admin + pesquisador (ajuste se quiser outra regra)
  if (currentRole === "admin" || currentRole === "collaborator") {
    const elMonitoring = document.querySelector('[data-page="monitoring"]');
    if (elMonitoring) elMonitoring.classList.remove("disabled");
  }
  const elMonitoringDrone = document.querySelector('[data-page="monitoring-drone"]');
  if (elMonitoringDrone) elMonitoringDrone.classList.remove("disabled");
}

  // Usuários: só admin
  if (currentRole === "admin") {
    const elUsers = document.querySelector('[data-page="users"]');
    if (elUsers) elUsers.classList.remove("disabled");
  }

  // Convites: admin + pesquisador
  if (currentRole === "admin" || currentRole === "collaborator") {
    const elInvites = document.querySelector('[data-page="invites"]');
    if (elInvites) elInvites.classList.remove("disabled");
  }

  // ========= FIM DAS REGRAS =========

  setupNavigation();

  // garante que experimentos sejam carregados em background
  if (typeof loadExperimentsIntoList === "function") {
    loadExperimentsIntoList().catch(() => {});
  }

  navigateTo("experiments");
}

// navegação da sidebar
function setupNavigation() {
  document.querySelectorAll(".sidebar-item").forEach(item => {
    item.addEventListener("click", function () {
      if (this.classList.contains("disabled")) return;
      const page = this.dataset.page;
      navigateTo(page);
    });
  });
}

function navigateTo(page) {
  currentPage = page;

  document.querySelectorAll(".sidebar-item").forEach(item => {
    item.classList.toggle("active", item.dataset.page === page);
  });

  renderPage(page);
}

function renderPage(page) {
  const container = $("contentArea");

  if (page === "users") {
    renderUsersPage(container);
    return;
  }

  if (page === "invites") {
    renderInvitesPage(container);
    return;
  }

  if (page === "experiments") {
    if (typeof renderExperimentsPage === "function") {
      renderExperimentsPage(container);
    } else {
      container.innerHTML = `<div class="card"><p>Módulo de experimentos não carregado.</p></div>`;
    }
    return;
  }

  if (page === "dbc-map") {
    if (typeof renderDbcMapPage === "function") {
      renderDbcMapPage(container);
    } else {
      container.innerHTML = `<div class="card"><p>Módulo de Mapa DBC não carregado.</p></div>`;
    }
    return;
  }

  if (page === "experiment-dashboard") {
    if (typeof renderExperimentDashboardPage === "function") {
      renderExperimentDashboardPage(container);
    } else {
      container.innerHTML = `<div class="card"><p>Dashboard de experimento não carregada.</p></div>`;
    }
    return;
  }

  if (page === "monitoring") {
    if (typeof renderMonitoringPage === "function") {
      renderMonitoringPage(container);
    } else {
      container.innerHTML = '<div class="card"><p>Módulo de monitoramento não carregado.</p></div>';
    }
    return;
  }

  if (page === "monitoring-drone") {
    if (typeof renderMonitoringDronePage === "function") {
      renderMonitoringDronePage(container);
    } else {
      container.innerHTML = '<div class="card"><p>Página de monitoramento por drone não carregada.</p></div>';
    }
    return;
  }

  // fallback
  container.innerHTML = `<div class="card"><p>Em desenvolvimento...</p></div>`;
}

// =====================================
// USERS PAGE
// =====================================
function roleLabel(role) {
  if (role === "admin") return "Administrador";
  if (role === "collaborator") return "Pesquisador";
  return "Visitante";
}

async function renderUsersPage(container) {
  if (currentRole !== "admin") {
    container.innerHTML = `
      <div class="content-header">
        <div class="content-title">Gestão de Usuários</div>
        <div class="content-subtitle">
          Apenas administradores podem gerenciar usuários.
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

  // ===== DAQUI PRA BAIXO É O ORIGINAL =====
  container.innerHTML = `
    <div class="content-header">
      <div class="content-title">Gestão de Usuários</div>
      <div class="content-subtitle">
        Gerencie perfis e permissões de acesso.
      </div>
    </div>
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <div style="font-size:14px;color:#4b5563;">
          Usuários cadastrados no sistema.
        </div>
        <button class="btn-link" onclick="openInviteModal()">Convidar usuário</button>
      </div>
      <div id="usersTableWrapper"><p>Carregando...</p></div>
    </div>
  `;

  const usersTableWrapper = document.getElementById("usersTableWrapper");

  const { data: roles } = await s
    .from("user_roles")
    .select("user_id, role, created_at")
    .order("created_at", { ascending: false });

  if (!roles || roles.length === 0) {
    usersTableWrapper.innerHTML = `<p style="color:#6b7280;">Nenhum usuário.</p>`;
    return;
  }

  const userIds = roles.map(r => r.user_id);

  const { data: profiles } = await s
    .from("user_profiles")
    .select("id, email")
    .in("id", userIds);

  const usersWithEmail = roles.map(r => {
    const p = profiles?.find(p => p.id === r.user_id);
    return { ...r, email: p?.email || "" };
  });

  const rows = usersWithEmail.map(u => {
    const canManage = currentRole === "admin" && u.user_id !== currentUser.id;
    return `
      <tr>
        <td>${u.email}</td>
        <td><span class="tag-role ${u.role}">${roleLabel(u.role)}</span></td>
        <td>${formatDate(u.created_at)}</td>
        <td>
          ${
            canManage
              ? `
                <button class="btn-secondary" onclick="openChangeRoleModal('${u.user_id}','${u.role}')">
                  Alterar role
                </button>
                <button class="btn-danger" style="margin-left:4px;" onclick="removeUser('${u.user_id}','${u.email}')">
                  Remover
                </button>
              `
              : "-"
          }
        </td>
      </tr>
    `;
  }).join("");

  usersTableWrapper.innerHTML = `
    <div style="overflow-x:auto;">
      <table>
        <thead>
          <tr>
            <th>E-mail</th>
            <th>Role</th>
            <th>Criado em</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

// =====================================
// INVITES PAGE
// =====================================
async function renderInvitesPage(container) {
  // visitante não pode
  if (currentRole === "visitor") {
    container.innerHTML = `
      <div class="content-header">
        <div class="content-title">Convites</div>
        <div class="content-subtitle">
          Apenas administradores e pesquisadores podem gerenciar convites.
        </div>
      </div>
      <div class="card">
        <p style="color:#6b7280;">
          Você não tem permissão para acessar esta página.
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="content-header">
      <div class="content-title">Convites</div>
      <div class="content-subtitle">
        Envie convites para novos usuários acessarem o sistema.
      </div>
    </div>
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <div style="font-size:14px;color:#4b5563;">
          Convites pendentes e históricos recentes.
        </div>
        <button class="btn-link" onclick="openInviteModal()">Novo convite</button>
      </div>
      <div id="invitesWrapper"><p>Carregando...</p></div>
    </div>
  `;

  const invitesWrapper = document.getElementById("invitesWrapper");

  const { data: invites } = await s
    .from("invitations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (!invites || invites.length === 0) {
    invitesWrapper.innerHTML = `<p style="color:#6b7280;">Nenhum convite.</p>`;
    return;
  }

  const rows = invites.map(inv => {
    const isPending =
      !inv.accepted_at && new Date(inv.expires_at) > new Date();
    const status = isPending
      ? "Pendente"
      : inv.accepted_at
      ? "Aceito"
      : "Expirado/Cancelado";

    return `
      <tr>
        <td>${inv.email}</td>
        <td><span class="tag-role ${inv.role}">${roleLabel(inv.role)}</span></td>
        <td>${formatDate(inv.expires_at)}</td>
        <td>${status}</td>
        <td>
          ${
            isPending
              ? `<button class="btn-secondary" onclick="cancelInvite('${inv.id}')">Cancelar</button>`
              : "-"
          }
        </td>
      </tr>
    `;
  }).join("");

  invitesWrapper.innerHTML = `
    <div style="overflow-x:auto;">
      <table>
        <thead>
          <tr>
            <th>E-mail</th>
            <th>Role</th>
            <th>Expira em</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

// =====================================
// MODAIS
// =====================================
function openModal(title, bodyHtml) {
  $("modalTitle").textContent = title;
  $("modalBody").innerHTML = bodyHtml;
  $("modalRoot").classList.add("active");
}

function closeModal() {
  $("modalRoot").classList.remove("active");
  $("modalBody").innerHTML = "";
}

// Invite modal
window.openInviteModal = function () {
  if (currentRole !== "admin" && currentRole !== "collaborator") return;
  openModal(
    "Convidar usuário",
    `
    <label for="inviteEmail">E-mail</label>
    <input type="email" id="inviteEmail" placeholder="usuario@exemplo.com">
    <label for="inviteRole">Role</label>
    <select id="inviteRole">
      <option value="collaborator">Pesquisador</option>
      <option value="visitor">Visitante</option>
      <option value="admin">Administrador</option>
    </select>
    <button class="btn-primary" style="margin-top:4px;" onclick="sendInvite()">Enviar convite</button>
  `
  );
};

window.sendInvite = async function () {
  if (currentRole !== "admin" && currentRole !== "collaborator") {
    alert("Apenas administradores e pesquisadores podem enviar convites.");
    return;
  }

  const email = document.getElementById("inviteEmail").value.trim();
  const role = document.getElementById("inviteRole").value;

  if (!email) {
    alert("Informe um e-mail para o convite.");
    return;
  }

  // colaborador NÃO pode criar admin
  if (currentRole !== "admin" && role === "admin") {
    alert("Apenas administradores podem convidar administradores.");
    return;
  }

  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const token = crypto.randomUUID();
    const { error } = await s.from("invitations").insert({
      email,
      role,
      token,
      invited_by: currentUser.id,
      // você pode adicionar expires_at aqui depois
      // expires_at: expiresAt.toISOString()
    });
    if (error) throw error;

    const link = `${window.location.origin}?invite=${token}`;

    // reabre o corpo do modal mostrando o link gerado
    $("modalBody").innerHTML = `
      <p style="font-size:14px;color:#374151;margin-bottom:8px;">
        Convite criado para <strong>${email}</strong> como <strong>${roleLabel(role)}</strong>.
      </p>
      ...
    `;

    try { await navigator.clipboard.writeText(link); } catch (_) {}

    renderInvitesPage($("contentArea"));
  } catch (err) {
    alert(err.message || "Erro ao enviar convite.");
  }
};

window.copyInviteLinkFromModal = async function () {
  const field = document.getElementById("inviteLinkField");
  if (!field) return;
  try {
    await navigator.clipboard.writeText(field.value);
    alert("Link copiado para a área de transferência.");
  } catch (err) {
    alert("Não foi possível copiar automaticamente. Copie o texto do campo manualmente.");
  }
};

// Change role modal
window.openChangeRoleModal = function (userId, current) {
  openModal(
    "Alterar role",
    `
    <p style="font-size:13px;color:#4b5563;margin-bottom:8px;">
      Role atual: <strong>${roleLabel(current)}</strong>
    </p>
    <label for="newRole">Nova role</label>
    <select id="newRole">
      <option value="admin" ${current === "admin" ? "selected" : ""}>Administrador</option>
      <option value="collaborator" ${current === "collaborator" ? "selected" : ""}>Pesquisador</option>
      <option value="visitor" ${current === "visitor" ? "selected" : ""}>Visitante</option>
    </select>
    <button class="btn-primary" style="margin-top:4px;" onclick="confirmChangeRole('${userId}')">
      Salvar
    </button>
  `
  );
};

window.confirmChangeRole = async function (userId) {
  const newRole = $("newRole").value;
  try {
    const { error } = await s
      .from("user_roles")
      .update({ role: newRole })
      .eq("user_id", userId);
    if (error) throw error;
    closeModal();
    renderUsersPage($("contentArea"));
  } catch (err) {
    alert(err.message || "Erro ao alterar role.");
  }
};

// Remove user
window.removeUser = async function (userId, email) {
  if (!confirm(`Remover usuário ${email}?`)) return;
  try {
    await s.from("user_roles").delete().eq("user_id", userId);
    await s.from("user_profiles").delete().eq("id", userId);
    // não remove de auth.users aqui (exigiria chave de serviço)
    renderUsersPage($("contentArea"));
  } catch (err) {
    alert(err.message || "Erro ao remover usuário.");
  }
};

// Cancel invite
window.cancelInvite = async function (id) {
  if (!confirm("Cancelar este convite?")) return;
  try {
    const { error } = await s.from("invitations").delete().eq("id", id);
    if (error) throw error;
    renderInvitesPage($("contentArea"));
  } catch (err) {
    alert(err.message || "Erro ao cancelar convite.");
  }
};









































