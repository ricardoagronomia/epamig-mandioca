// ============================================
// SUPABASE & GLOBAL STATE
// ============================================
const s = window.supabase.createClient('https://zzvgecovfucnpktitszv.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dmdlY292ZnVjbnBrdGl0c3p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyOTk0NTYsImV4cCI6MjA4Mjg3NTQ1Nn0.WTtcpM3jtSa9TeVA4oEH-t_7naTrKZw83Tw6ZM0HwtI');
const $ = i => document.getElementById(i);

let user = null;
let userRole = null;
let currentExperiment = null;
let currentPage = 'experiments';
let currentStep = 0;
let expData = {};
let editingExpId = null;

const steps = ['Identificação', 'Localização', 'Ambiente', 'Delineamento', 'Variedades', 'Tratamentos', 'Dimensões', 'Mapa DBC', 'Cronograma', 'Revisão'];

const phaseLabels = {
    'pre_planting': 'Pré-Plantio',
    'planting': 'Plantio',
    'monitoring': 'Acompanhamento',
    'cultural_practices': 'Tratos Culturais',
    'harvest': 'Colheita'
};

const roleLabels = {
    'admin': 'Administrador',
    'collaborator': 'Pesquisador',
    'visitor': 'Visitante'
};

// ============================================
// UTILITIES
// ============================================
function formatDate(dateString) {
    if(!dateString) return '-';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

function m(t,c){const d=$('msg');d.textContent=t;d.className='message '+c;d.style.display='block';setTimeout(()=>d.style.display='none',5e3);}

function getBaseUrl(){
    if(window.location.protocol === 'file:'){
        return 'LOCAL_FILE_SYSTEM';
    }
    return window.location.origin;
}

// ============================================
// INIT & AUTH
// ============================================
(async()=>{
    const urlParams = new URLSearchParams(window.location.search);
    const inviteToken = urlParams.get('invite');
    
    if(inviteToken){
        showInviteAcceptScreen(inviteToken);
        return;
    }
    
    const {data:{session}}=await s.auth.getSession();
    if(session){
        user=session.user;
        await loadUserRole();
        showApp();
    } else {
        $('authScreen').style.display='block';
    }
})();

async function loadUserRole(){
    const {data} = await s.from('user_roles').select('role').eq('user_id', user.id).single();
    userRole = data?.role || 'visitor';
}

async function showInviteAcceptScreen(token){
    try {
        const {data: invite, error} = await s.from('invitations')
            .select('*')
            .eq('token', token)
            .is('accepted_at', null)
            .order('created_at', {ascending: false})
            .limit(1)
            .single();
        
        if(error || !invite){
            alert('❌ Convite inválido ou já aceito');
            window.location.href = window.location.origin;
            return;
        }
        
        if(new Date(invite.expires_at) < new Date()){
            alert('❌ Convite expirado');
            window.location.href = window.location.origin;
            return;
        }
        
        document.body.innerHTML = `
            <div style="max-width:500px;margin:100px auto;background:#fff;padding:40px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
                <div style="text-align:center;margin-bottom:32px;">
                    <div style="width:80px;height:80px;margin:0 auto 16px;background:linear-gradient(135deg,#166534 0%,#15803d 100%);border-radius:20px;display:flex;align-items:center;justify-content:center;">
                        <svg viewBox="0 0 24 24" width="48" height="48" fill="white" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                        </svg>
                    </div>
                    <h1 style="color:#166534;font-size:24px;margin-bottom:8px;">Você foi convidado!</h1>
                    <p style="color:#6b7280;font-size:14px;">Convite para <strong>${roleLabels[invite.role]}</strong></p>
                </div>
                
                <div style="background:#f9fafb;padding:20px;border-radius:8px;margin-bottom:24px;">
                    <p style="font-size:14px;color:#374151;margin-bottom:16px;"><strong>E-mail:</strong> ${invite.email}</p>
                    <p style="font-size:14px;color:#374151;margin-bottom:16px;"><strong>Role:</strong> ${roleLabels[invite.role]}</p>
                    <p style="font-size:14px;color:#374151;"><strong>Expira em:</strong> ${formatDate(invite.expires_at.split('T')[0])}</p>
                </div>
                
                <h3 style="font-size:16px;color:#166534;margin-bottom:16px;">Criar sua conta</h3>
                <input type="email" id="inviteEmail" value="${invite.email}" readonly style="width:100%;padding:10px;margin-bottom:12px;border:1px solid #d1d5db;border-radius:8px;background:#f3f4f6;font-size:14px;">
                <input type="password" id="invitePassword" placeholder="Senha (mínimo 6 caracteres)" style="width:100%;padding:10px;margin-bottom:12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;">
                <input type="password" id="invitePasswordConfirm" placeholder="Confirme a senha" style="width:100%;padding:10px;margin-bottom:20px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;">
                
                <button id="btnAcceptInvite" style="width:100%;padding:12px;background:#166534;color:white;border:none;border-radius:8px;font-weight:600;font-size:15px;cursor:pointer;">
                    ✓ Aceitar Convite e Criar Conta
                </button>
                
                <p style="text-align:center;margin-top:16px;font-size:13px;color:#6b7280;">
                    Já tem conta? <a href="${window.location.origin}" style="color:#166534;font-weight:600;">Fazer login</a>
                </p>
            </div>
        `;
        
        document.getElementById('btnAcceptInvite').onclick = () => acceptInvite(token, invite);
        
    } catch(x) {
        alert('Erro ao carregar convite: ' + x.message);
        window.location.href = window.location.origin;
    }
}

async function acceptInvite(token, invite){
    const email = document.getElementById('inviteEmail').value;
    const password = document.getElementById('invitePassword').value;
    const passwordConfirm = document.getElementById('invitePasswordConfirm').value;
    
    if(!password || password.length < 6){
        return alert('Senha deve ter no mínimo 6 caracteres');
    }
    
    if(password !== passwordConfirm){
        return alert('As senhas não coincidem');
    }
    
    try {
        const {data: authData, error: authError} = await s.auth.signUp({
            email: email,
            password: password
        });
        
        if(authError) throw authError;
        
        await s.from('user_profiles').upsert([{
            id: authData.user.id,
            email: email
        }]);
        
        await s.from('user_roles').insert([{
            user_id: authData.user.id,
            role: invite.role
        }]);
        
        await s.from('invitations').update({
            accepted_at: new Date().toISOString()
        }).eq('email', invite.email).is('accepted_at', null);
        
        alert('✅ Conta criada com sucesso!\n\nFaça login para acessar o sistema.');
        window.location.href = window.location.origin;
        
    } catch(x) {
        alert('Erro ao criar conta: ' + x.message);
    }
}

// Função para corrigir role manualmente via SQL (caso necessário)
async function fixUserRole(email, correctRole){
    try {
        // Buscar user_id pelo email
        const {data: profile} = await s.from('user_profiles').select('id').eq('email', email).single();
        if(!profile) throw new Error('Usuário não encontrado');
        
        // Atualizar role
        const {error} = await s.from('user_roles').update({role: correctRole}).eq('user_id', profile.id);
        if(error) throw error;
        
        console.log(`✅ Role de ${email} corrigido para ${correctRole}`);
    } catch(x) {
        console.error('Erro ao corrigir role:', x);
    }
}


// BOTÕES DE LOGIN E CADASTRO
$('t1').onclick=()=>{$('t1').className='active';$('t2').className='';$('f1').classList.remove('hidden');$('f2').classList.add('hidden')};
$('t2').onclick=()=>{$('t2').className='active';$('t1').className='';$('f2').classList.remove('hidden');$('f1').classList.add('hidden')};

$('b1').onclick=async()=>{
    const e=$('e1').value,p=$('p1').value;
    if(!e||!p)return m('Preencha tudo!','error');
    try{
        const {data,error}=await s.auth.signInWithPassword({email:e,password:p});
        if(error)throw error;
        user=data.user;
        await loadUserRole();
        showApp()
    }catch(x){
        m('Erro: '+x.message,'error')
    }
};

$('b2').onclick=async()=>{
    const e=$('e2').value,p=$('p2').value;
    if(!e||!p)return m('Preencha tudo!','error');
    if(p.length<6)return m('Senha mínimo 6!','error');
    try{
        const {data,error}=await s.auth.signUp({email:e,password:p});
        if(error)throw error;
        await s.from('user_profiles').insert([{id:data.user.id,email:e}]);
        await s.from('user_roles').insert([{user_id:data.user.id,role:'visitor'}]);
        m('✅ Criado! Faça login.','success');
        setTimeout(()=>$('t1').click(),2e3)
    }catch(x){
        m('Erro: '+x.message,'error')
    }
};

$('btnLogout').onclick=async()=>{await s.auth.signOut();location.reload()};

function showApp(){
    $('authScreen').style.display='none';
    $('appScreen').style.display='flex';
    $('userEmail').textContent=`${user.email} (${roleLabels[userRole]})`;
    
    if(userRole === 'admin' || userRole === 'collaborator'){
        document.querySelector('[data-page="new-experiment"]').classList.remove('disabled');
        document.querySelector('[data-page="usuarios"]').classList.remove('disabled');
    }
    
    navigateTo('experiments');
    setupNavigation();
}

function setupNavigation(){
    document.querySelectorAll('.sidebar-item').forEach(item=>{
        item.addEventListener('click',function(){
            if(this.classList.contains('disabled')) return;
            const page = this.dataset.page;
            navigateTo(page);
        });
    });
}

function navigateTo(page){
    currentPage = page;
    document.querySelectorAll('.sidebar-item').forEach(item=>{
        item.classList.remove('active');
        if(item.dataset.page === page) item.classList.add('active');
    });
    renderPage(page);
}

function setCurrentExperiment(exp){
    currentExperiment = exp;
    $('headerSubtitle').textContent = exp ? `${exp.code} - ${exp.name}` : 'Pesquisa de Campo';
    
    document.querySelectorAll('#expMenuSection .sidebar-item').forEach(item=>{
        if(exp) {
            item.classList.remove('disabled');
        } else {
            item.classList.add('disabled');
        }
    });
}

function renderPage(page){
    const content = $('contentArea');
    
    switch(page){
        case 'experiments':
            renderExperimentsPage(content);
            break;
        case 'new-experiment':
            if(userRole === 'visitor'){
                content.innerHTML='<div class="card"><p style="text-align:center;color:#991b1b;">❌ Você não tem permissão</p></div>';
            } else {
                openNewExperimentModal();
            }
            break;
        case 'usuarios':
            renderUsuariosPage(content);
            break;
        case 'identificacao':
            renderIdentificacaoPage(content);
            break;
        case 'dados-gerais':
            renderDadosGeraisPage(content);
            break;
        case 'mapa-dbc':
            renderMapaDBCPage(content);
            break;
        case 'monitoramento':
            renderMonitoramentoPage(content);
            break;
        case 'colheita':
            renderColheitaPage(content);
            break;
        default:
            content.innerHTML = `
                <div class="content-header">
                    <div class="content-title">Em Desenvolvimento</div>
                    <div class="content-subtitle">Esta página está sendo construída</div>
                </div>
                <div class="card">
                    <p style="text-align:center;color:#6b7280;padding:40px;">
                        Página "${page}" em desenvolvimento
                    </p>
                </div>
            `;
    }
}

async function renderExperimentsPage(content){
    const canCreate = userRole === 'admin' || userRole === 'collaborator';
    
    content.innerHTML = `
        <div class="content-header">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <div class="content-title">Meus Experimentos</div>
                    <div class="content-subtitle">Gerencie seus experimentos de campo</div>
                </div>
                ${canCreate ? '<button class="btn-primary" onclick="openNewExperimentModal()">+ Novo Experimento</button>' : ''}
            </div>
        </div>
        <div id="expListContainer"></div>
    `;
    await loadExperimentsList();
}

async function loadExperimentsList(){
    let query = s.from('experiments').select('*');
    
    if(userRole === 'collaborator'){
        query = query.eq('created_by', user.id);
    }
    
    const {data} = await query.order('created_at',{ascending:false});
    const container = document.getElementById('expListContainer');
    
    if(!data || data.length===0){
        container.innerHTML='<div class="card"><p style="text-align:center;color:#6b7280;">Nenhum experimento disponível.</p></div>';
        return;
    }
    
    container.innerHTML='';
    data.forEach(e=>{
        const canEdit = userRole === 'admin' || e.created_by === user.id;
        const card=document.createElement('div');
        card.className='exp-card';
        card.innerHTML=`
            <h3>${e.code} - ${e.name}</h3>
            <p style="color:#6b7280;margin-bottom:10px;font-size:14px;">${e.objective}</p>
            <p style="font-size:13px;color:#9ca3af;">📅 Plantio: ${formatDate(e.planting_date)} | 📍 ${e.farm}</p>
            <div class="exp-actions">
                <button class="btn-select" onclick="selectExperiment('${e.id}')">Selecionar</button>
                ${canEdit ? `
                    <button class="btn-icon" title="Editar" onclick="editExperiment('${e.id}')">
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                    </button>
                    <button class="btn-icon" title="Excluir" onclick="deleteExperiment('${e.id}','${e.code}')">
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                    </button>
                ` : ''}
            </div>
        `;
        container.appendChild(card);
    });
}

async function selectExperiment(id){
    const {data}=await s.from('experiments').select('*').eq('id',id).single();
    setCurrentExperiment(data);
    navigateTo('identificacao');
}

async function deleteExperiment(id,code){
    if(userRole === 'visitor') return alert('Você não tem permissão');
    if(!confirm(`Excluir "${code}"?`))return;
    try{
        const {error}=await s.from('experiments').delete().eq('id',id);
        if(error)throw error;
        alert('✅ Excluído!');
        renderExperimentsPage($('contentArea'));
    }catch(x){
        alert('Erro: '+x.message);
    }
}
// ============================================
// USUARIOS PAGE
// ============================================
async function renderUsuariosPage(content){
    if(userRole === 'visitor'){
        content.innerHTML='<div class="card"><p style="text-align:center;color:#991b1b;">❌ Acesso negado</p></div>';
        return;
    }
    
    content.innerHTML=`
        <div class="content-header">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <div class="content-title">Gestão de Usuários</div>
                    <div class="content-subtitle">Gerencie usuários e convites</div>
                </div>
                <button class="btn-primary" onclick="openInviteModal()">✉️ Convidar Usuário</button>
            </div>
        </div>
        
        <div class="card">
            <h3>👥 Usuários Ativos</h3>
            <div id="usersList"></div>
        </div>
        
        <div class="card">
            <h3>⏳ Convites Pendentes</h3>
            <div id="pendingInvitesList"></div>
        </div>
        
        <div class="card">
            <h3>✅ Convites Aceitos</h3>
            <div id="acceptedInvitesList"></div>
        </div>
    `;
    
    await loadUsersList();
    await loadPendingInvites();
    await loadAcceptedInvites();
}

async function loadUsersList(){
    const {data: roles} = await s.from('user_roles').select('user_id, role, created_at').order('created_at', {ascending: false});
    
    if(!roles || roles.length === 0){
        document.getElementById('usersList').innerHTML='<p style="color:#6b7280;padding:20px;">Nenhum usuário</p>';
        return;
    }
    
    const userIds = roles.map(r => r.user_id);
    const {data: profiles} = await s.from('user_profiles')
        .select('id, email')
        .in('id', userIds);
    
    const usersWithEmails = roles.map(role => {
        const profile = profiles?.find(p => p.id === role.user_id);
        return {
            ...role,
            email: profile?.email || 'N/A'
        };
    });
    
    const container = document.getElementById('usersList');
    container.innerHTML = `
        <table style="width:100%;border-collapse:collapse;">
            <thead>
                <tr style="border-bottom:2px solid #e5e7eb;">
                    <th style="text-align:left;padding:12px;font-size:13px;color:#6b7280;">E-mail</th>
                    <th style="text-align:left;padding:12px;font-size:13px;color:#6b7280;">Role</th>
                    <th style="text-align:left;padding:12px;font-size:13px;color:#6b7280;">Ações</th>
                </tr>
            </thead>
            <tbody>
                ${usersWithEmails.map(u => `
                    <tr style="border-bottom:1px solid #e5e7eb;">
                        <td style="padding:12px;font-size:14px;">${u.email}</td>
                        <td style="padding:12px;font-size:14px;">
                            <span style="background:#${u.role==='admin'?'166534':u.role==='collaborator'?'2563eb':'6b7280'};color:white;padding:4px 8px;border-radius:4px;font-size:12px;">
                                ${roleLabels[u.role]}
                            </span>
                        </td>
                        <td style="padding:12px;">
                            ${userRole === 'admin' && u.user_id !== user.id ? `
                                <button class="btn-secondary" style="padding:6px 12px;font-size:12px;margin-right:8px;" onclick="changeUserRole('${u.user_id}', '${u.role}')">
                                    ✏️ Alterar Role
                                </button>
                                <button class="btn-icon" style="background:#dc2626;color:white;padding:6px 12px;border-radius:6px;" title="Excluir" onclick="deleteUser('${u.user_id}', '${u.email}')">
                                    🗑️
                                </button>
                            ` : '-'}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function loadPendingInvites(){
    const {data: invites} = await s.from('invitations')
        .select('*')
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', {ascending: false});
    
    const container = document.getElementById('pendingInvitesList');
    if(!invites || invites.length === 0){
        container.innerHTML='<p style="color:#6b7280;padding:20px;">Nenhum convite pendente</p>';
        return;
    }
    
    container.innerHTML = `
        <table style="width:100%;border-collapse:collapse;">
            <thead>
                <tr style="border-bottom:2px solid #e5e7eb;">
                    <th style="text-align:left;padding:12px;font-size:13px;color:#6b7280;">E-mail</th>
                    <th style="text-align:left;padding:12px;font-size:13px;color:#6b7280;">Role</th>
                    <th style="text-align:left;padding:12px;font-size:13px;color:#6b7280;">Expira em</th>
                    <th style="text-align:left;padding:12px;font-size:13px;color:#6b7280;">Ações</th>
                </tr>
            </thead>
            <tbody>
                ${invites.map(inv => `
                    <tr style="border-bottom:1px solid #e5e7eb;">
                        <td style="padding:12px;font-size:14px;">${inv.email}</td>
                        <td style="padding:12px;font-size:14px;">
                            <span style="background:#${inv.role==='admin'?'166534':inv.role==='collaborator'?'2563eb':'6b7280'};color:white;padding:4px 8px;border-radius:4px;font-size:12px;">
                                ${roleLabels[inv.role]}
                            </span>
                        </td>
                        <td style="padding:12px;font-size:14px;">${formatDate(inv.expires_at.split('T')[0])}</td>
                        <td style="padding:12px;">
                            <button class="btn-icon" title="Copiar Link" onclick="copyInviteLink('${inv.token}')">
                                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                            </button>
                            <button class="btn-icon" title="Cancelar" onclick="cancelInvite('${inv.id}')">
                                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function loadAcceptedInvites(){
    const {data: invites} = await s.from('invitations')
        .select('*')
        .not('accepted_at', 'is', null)
        .order('accepted_at', {ascending: false})
        .limit(20);
    
    const container = document.getElementById('acceptedInvitesList');
    if(!invites || invites.length === 0){
        container.innerHTML='<p style="color:#6b7280;padding:20px;">Nenhum convite aceito ainda</p>';
        return;
    }
    
    container.innerHTML = `
        <table style="width:100%;border-collapse:collapse;">
            <thead>
                <tr style="border-bottom:2px solid #e5e7eb;">
                    <th style="text-align:left;padding:12px;font-size:13px;color:#6b7280;">E-mail</th>
                    <th style="text-align:left;padding:12px;font-size:13px;color:#6b7280;">Role</th>
                    <th style="text-align:left;padding:12px;font-size:13px;color:#6b7280;">Aceito em</th>
                </tr>
            </thead>
            <tbody>
                ${invites.map(inv => `
                    <tr style="border-bottom:1px solid #e5e7eb;opacity:0.7;">
                        <td style="padding:12px;font-size:14px;">${inv.email}</td>
                        <td style="padding:12px;font-size:14px;">
                            <span style="background:#${inv.role==='admin'?'166534':inv.role==='collaborator'?'2563eb':'6b7280'};color:white;padding:4px 8px;border-radius:4px;font-size:12px;">
                                ${roleLabels[inv.role]}
                            </span>
                        </td>
                        <td style="padding:12px;font-size:14px;">${formatDate(inv.accepted_at.split('T')[0])}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function openInviteModal(){
    const canInviteAdmin = userRole === 'admin';
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:500px;">
            <div class="modal-header">
                <h2>Convidar Usuário</h2>
                <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
            </div>
            <div style="margin-bottom:16px;">
                <label>E-mail *</label>
                <input type="email" id="inviteEmail" placeholder="usuario@exemplo.com">
            </div>
            <div style="margin-bottom:16px;">
                <label>Role *</label>
                <select id="inviteRole">
                    ${canInviteAdmin ? '<option value="admin">Administrador</option>' : ''}
                    <option value="collaborator" selected>Pesquisador</option>
                    <option value="visitor">Visitante</option>
                </select>
            </div>
            <button class="btn-primary" onclick="sendInvite()">✉️ Enviar Convite</button>
        </div>
    `;
    document.body.appendChild(modal);
}

async function sendInvite(){
    const email = document.getElementById('inviteEmail').value.trim();
    const role = document.getElementById('inviteRole').value;
    
    if(!email) return alert('Digite um e-mail');
    
    if(userRole === 'collaborator' && role === 'admin'){
        return alert('Você não pode convidar administradores');
    }
    
    try {
        const {data, error} = await s.from('invitations').insert([{
            email: email,
            role: role,
            invited_by: user.id
        }]).select().single();
        
        if(error) throw error;
        
        const baseUrl = getBaseUrl();
        const inviteLink = `${baseUrl}?invite=${data.token}`;
        
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.style.zIndex = '2000';
        modal.innerHTML = `
            <div class="modal-content" style="max-width:600px;">
                <div class="modal-header">
                    <h2>✅ Convite Enviado!</h2>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div style="margin-bottom:20px;">
                    <p style="margin-bottom:12px;color:#374151;"><strong>Destinatário:</strong> ${email}</p>
                    <p style="margin-bottom:20px;color:#374151;"><strong>Role:</strong> ${roleLabels[role]}</p>
                    
                    <label style="display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:8px;">Link do Convite:</label>
                    
                    <div style="background:#f0fdf4;border:2px solid #166534;border-radius:8px;padding:16px;margin-bottom:16px;">
                        <input type="text" id="inviteLinkInput" value="${inviteLink}" readonly 
                            style="width:100%;padding:10px;border:1px solid #166534;border-radius:6px;font-size:13px;background:#fff;margin-bottom:8px;font-family:monospace;">
                        <a href="${inviteLink}" target="_blank" 
                            style="color:#166534;font-size:13px;word-break:break-all;text-decoration:underline;font-weight:600;">
                            🔗 Clique aqui para testar o link
                        </a>
                    </div>
                    
                    <button onclick="copyInviteLinkFromModal('${inviteLink}')" 
                        style="width:100%;padding:10px;background:#166534;color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;font-size:14px;margin-bottom:12px;">
                        📋 Copiar Link
                    </button>
                    
                    <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px;border-radius:4px;">
                        <p style="font-size:13px;color:#92400e;">
                            💡 <strong>Envie este link para ${email}</strong><br>
                            Válido por 7 dias
                        </p>
                    </div>
                </div>
                <button class="btn-primary" onclick="this.closest('.modal').remove();renderUsuariosPage(document.getElementById('contentArea'))">
                    Fechar
                </button>
            </div>
        `;
        
        document.querySelectorAll('.modal').forEach(m => m.remove());
        document.body.appendChild(modal);
        
    } catch(x) {
        alert('Erro: ' + x.message);
    }
}

window.copyInviteLinkFromModal = async function(link){
    try {
        await navigator.clipboard.writeText(link);
        alert('✅ Link copiado!\n\nCole no WhatsApp, E-mail ou onde preferir.');
    } catch(x) {
        alert('❌ Erro ao copiar');
    }
}

async function copyInviteLink(token){
    const baseUrl = getBaseUrl();
    const link = `${baseUrl}?invite=${token}`;
    await navigator.clipboard.writeText(link);
    alert('✅ Link copiado!');
}

async function cancelInvite(id){
    if(!confirm('Cancelar este convite?')) return;
    try {
        const {error} = await s.from('invitations').delete().eq('id', id);
        if(error) throw error;
        alert('✅ Convite cancelado');
        renderUsuariosPage($('contentArea'));
    } catch(x) {
        alert('Erro: ' + x.message);
    }
}

async function changeUserRole(userId, currentRole){
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:400px;">
            <div class="modal-header">
                <h2>Alterar Role</h2>
                <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
            </div>
            <div style="margin-bottom:16px;">
                <label>Role Atual: <strong>${roleLabels[currentRole]}</strong></label>
            </div>
            <div style="margin-bottom:16px;">
                <label>Nova Role *</label>
                <select id="newRoleSelect">
                    <option value="admin" ${currentRole==='admin'?'selected':''}>Administrador</option>
                    <option value="collaborator" ${currentRole==='collaborator'?'selected':''}>Pesquisador</option>
                    <option value="visitor" ${currentRole==='visitor'?'selected':''}>Visitante</option>
                </select>
            </div>
            <button class="btn-primary" onclick="confirmChangeRole('${userId}')">Alterar</button>
        </div>
    `;
    document.body.appendChild(modal);
}

async function confirmChangeRole(userId){
    const newRole = document.getElementById('newRoleSelect').value;
    try {
        const {error} = await s.from('user_roles').update({role: newRole}).eq('user_id', userId);
        if(error) throw error;
        alert('✅ Role alterado com sucesso!');
        document.querySelectorAll('.modal').forEach(m => m.remove());
        renderUsuariosPage($('contentArea'));
    } catch(x) {
        alert('Erro ao alterar role: ' + x.message);
    }
}

async function deleteUser(userId, email){
    if(!confirm(`⚠️ ATENÇÃO!\n\nDeseja realmente EXCLUIR o usuário:\n${email}\n\nEsta ação NÃO pode ser desfeita!`)){
        return;
    }
    
    try {
        // Deletar role
        const {error: roleError} = await s.from('user_roles').delete().eq('user_id', userId);
        if(roleError) throw roleError;
        
        // Deletar perfil
        const {error: profileError} = await s.from('user_profiles').delete().eq('id', userId);
        if(profileError) throw profileError;
        
        // Nota: Para deletar da tabela auth.users, seria necessário usar Admin API
        // Por enquanto, apenas removemos do sistema (role + profile)
        
        alert('✅ Usuário removido do sistema!');
        renderUsuariosPage($('contentArea'));
    } catch(x) {
        alert('Erro ao excluir: ' + x.message);
    }
}

// ============================================
// OTHER PAGES
// ============================================
function renderIdentificacaoPage(content){
    if(!currentExperiment){
        content.innerHTML='<div class="card"><p style="text-align:center;color:#6b7280;">Selecione um experimento</p></div>';
        return;
    }
    content.innerHTML=`
        <div class="content-header">
            <div class="content-title">Identificação</div>
            <div class="content-subtitle">Visão geral do experimento</div>
        </div>
        <div class="card">
            <h3>Informações Básicas</h3>
            <p><strong>Código:</strong> ${currentExperiment.code}</p>
            <p><strong>Nome:</strong> ${currentExperiment.name}</p>
            <p><strong>Data de Plantio:</strong> ${formatDate(currentExperiment.planting_date)}</p>
            <p><strong>Local:</strong> ${currentExperiment.farm}, ${currentExperiment.municipality}</p>
        </div>
    `;
}

function renderDadosGeraisPage(content){
    content.innerHTML=`
        <div class="content-header">
            <div class="content-title">Dados Gerais</div>
        </div>
        <div class="card">
            <p style="color:#6b7280;">Em desenvolvimento...</p>
        </div>
    `;
}

function renderMapaDBCPage(content){
    if(!currentExperiment){
        content.innerHTML=`<div class="card"><p style="text-align:center;color:#6b7280;">Selecione um experimento</p></div>`;
        return;
    }
    
    content.innerHTML = `
        <div class="content-header">
            <div class="content-title">Mapa DBC</div>
            <div class="content-subtitle">Visualize a distribuição dos tratamentos</div>
        </div>
        <div class="card">
            <p style="color:#6b7280;">Funcionalidade em desenvolvimento...</p>
            <p style="color:#6b7280;margin-top:12px;">O mapa será configurado durante a criação/edição do experimento.</p>
        </div>
    `;
}

function renderMonitoramentoPage(content){
    content.innerHTML=`
        <div class="content-header">
            <div class="content-title">Monitoramento Manual</div>
        </div>
        <div class="card">
            <p style="color:#6b7280;">Em desenvolvimento...</p>
        </div>
    `;
}

function renderColheitaPage(content){
    content.innerHTML=`
        <div class="content-header">
            <div class="content-title">Colheita</div>
        </div>
        <div class="card">
            <p style="color:#6b7280;">Em desenvolvimento...</p>
        </div>
    `;
}
// ============================================
// EXPERIMENT WIZARD
// ============================================
function openNewExperimentModal(){
    if(userRole === 'visitor') return alert('Sem permissão');
    editingExpId=null;
    expData={collaborators:[],varieties:[],treatments:[],schedule:[]};
    currentStep=0;
    $('modalTitle').textContent='Novo Experimento';
    renderWizard();
    $('expModal').classList.add('active');
}

async function editExperiment(id){
    if(userRole === 'visitor') return alert('Sem permissão');
    try{
        editingExpId=id;
        const {data,error}=await s.from('experiments').select('*').eq('id',id).single();
        if(error)throw error;
        
        const {data:varieties}=await s.from('varieties').select('*').eq('experiment_id',id);
        const {data:schedule}=await s.from('experiment_schedule').select('*').eq('experiment_id',id);
        
        expData={
            code:data.code||'',
            name:data.name||'',
            objective:data.objective||'',
            collaborators:data.collaborator?data.collaborator.split(',').map(r=>r.trim()).filter(r=>r):[],
            planting_date:data.planting_date||'',
            farm:data.farm||'',
            municipality:data.municipality||'',
            latitude:data.latitude||'',
            longitude:data.longitude||'',
            soil_type:data.soil_type||'',
            climate:data.climate||'',
            varieties_count:varieties.length||4,
            treatments_count:3,
            blocks_count:data.blocks_count||3,
            plots_per_block:data.plots_per_block||12,
            useful_plants_per_plot:data.useful_plants_per_plot||4,
            plot_length:data.plot_length||'',
            plot_width:data.plot_width||'',
            row_spacing:data.row_spacing||'',
            plant_spacing:data.plant_spacing||'',
            varieties:varieties||[],
            treatments:[],
            schedule:schedule||[]
        };
        currentStep=0;
        $('modalTitle').textContent='Editar Experimento';
        renderWizard();
        $('expModal').classList.add('active');
    }catch(x){
        alert('Erro: '+x.message);
    }
}

$('closeModal').onclick=()=>$('expModal').classList.remove('active');
$('btnPrev').onclick=()=>{if(currentStep>0){saveStepData();currentStep--;renderWizard()}};
$('btnNext').onclick=()=>{if(currentStep<steps.length-1){saveStepData();currentStep++;renderWizard()}};
$('btnSave').onclick=saveExperiment;

function renderWizard(){
    const stepsHtml=steps.map((s,i)=>`<span class="wizard-step ${i===currentStep?'active':i<currentStep?'completed':'pending'}">${i+1}. ${s}</span>`).join('');
    $('wizardSteps').innerHTML=stepsHtml;
    
    const content=$('wizardContent');
    
    if(currentStep===0){
        content.innerHTML=`
            <div class="form-grid">
                <div class="form-grid cols-2">
                    <div><label>Código *</label><input type="text" id="exp_code" value="${expData.code||''}"></div>
                    <div><label>Data de Plantio *</label><input type="date" id="exp_date" value="${expData.planting_date||''}"></div>
                </div>
                <div><label>Nome *</label><input type="text" id="exp_name" value="${expData.name||''}"></div>
                <div><label>Objetivo *</label><textarea id="exp_obj" rows="3">${expData.objective||''}</textarea></div>
                <div>
                    <label>Pesquisadores *</label>
                    <div class="input-group">
                        <input type="text" id="collaborator_input" placeholder="Nome">
                        <button class="btn-primary btn-add" style="width:auto;padding:10px 16px;" id="addcollaboratorBtn">+</button>
                    </div>
                    <div id="collaboratorList" class="item-list hidden"></div>
                </div>
            </div>
        `;
        setTimeout(()=>{$('addcollaboratorBtn').onclick=addcollaborator;rendercollaborators()},0);
    }
    else if(currentStep===1){
        content.innerHTML=`
            <div class="form-grid">
                <div class="form-grid cols-2">
                    <div><label>Fazenda *</label><input type="text" id="exp_farm" value="${expData.farm||''}"></div>
                    <div><label>Município/Estado *</label><input type="text" id="exp_city" value="${expData.municipality||''}"></div>
                </div>
                <div>
                    <label>Coordenadas (opcional)</label>
                    <div class="form-grid cols-2">
                        <input type="text" id="exp_lat" placeholder="Latitude" value="${expData.latitude||''}">
                        <input type="text" id="exp_lng" placeholder="Longitude" value="${expData.longitude||''}">
                    </div>
                </div>
            </div>
        `;
    }
    else if(currentStep===2){
        content.innerHTML=`
            <div class="form-grid cols-2">
                <div><label>Tipo de Solo</label><input type="text" id="exp_soil" value="${expData.soil_type||''}"></div>
                <div><label>Clima</label><input type="text" id="exp_climate" value="${expData.climate||''}"></div>
            </div>
        `;
    }
    else if(currentStep===3){
        content.innerHTML=`
            <div class="form-grid cols-4">
                <div><label>Variedades *</label><input type="number" min="1" id="exp_varieties" value="${expData.varieties_count||4}"></div>
                <div><label>Tratamentos *</label><input type="number" min="1" id="exp_treatments" value="${expData.treatments_count||3}"></div>
                <div><label>Blocos *</label><input type="number" min="1" id="exp_blocks" value="${expData.blocks_count||3}"></div>
                <div><label>Parcelas/Bloco *</label><input type="number" min="1" id="exp_plots" value="${expData.plots_per_block||12}"></div>
            </div>
            <div style="margin-top:16px;"><label>Plantas Úteis/Parcela *</label><input type="number" min="1" id="exp_plants" value="${expData.useful_plants_per_plot||4}"></div>
        `;
    }
    else if(currentStep===4){
        content.innerHTML=`
            <div style="background:#f9fafb;padding:16px;border-radius:8px;margin-bottom:16px;border:1px solid #e5e7eb;">
                <h4 style="margin-bottom:12px;font-size:15px;">Adicionar Variedade</h4>
                <div class="form-grid cols-3">
                    <div><label>Nome *</label><input type="text" id="var_name"></div>
                    <div><label>Uso</label><select id="var_use"><option value="mesa">Mesa</option><option value="industrial">Industrial</option><option value="duplo">Duplo</option></select></div>
                    <div><label>Cor Polpa</label><select id="var_color"><option value="branca">Branca</option><option value="creme">Creme</option><option value="amarela">Amarela</option><option value="roxa">Roxa</option></select></div>
                </div>
                <button class="btn-primary" id="addVarietyBtn" style="margin-top:12px;">+ Adicionar</button>
            </div>
            <div id="varList"></div>
        `;
        setTimeout(()=>{$('addVarietyBtn').onclick=addVariety;renderVarieties()},0);
    }
    else if(currentStep===5){
        generateTreatments();
        content.innerHTML=`
            <p style="margin-bottom:16px;font-size:14px;color:#6b7280;">Tratamentos: <strong style="color:#166534;">${expData.treatments.length}</strong></p>
            <div style="max-height:400px;overflow-y:auto;border:1px solid #e5e7eb;border-radius:8px;padding:12px;">
                ${expData.treatments.map(t=>`<div style="padding:10px;background:#f9fafb;margin-bottom:6px;border-radius:6px;font-size:14px;"><strong>${t.code}</strong> - ${t.variety} (${t.position})</div>`).join('')}
            </div>
        `;
    }
else if(currentStep===6){
    content.innerHTML=`
        <div class="form-grid">
            <div class="form-grid cols-2">
                <div><label>Comprimento Parcela (m)</label><input type="number" step="0.1" id="exp_length" value="${expData.plot_length||''}"></div>
                <div><label>Largura Parcela (m)</label><input type="number" step="0.1" id="exp_width" value="${expData.plot_width||''}"></div>
            </div>
            <div class="form-grid cols-2">
                <div><label>Espaçamento Entre Linhas (m)</label><input type="number" step="0.1" id="exp_row" value="${expData.row_spacing||''}"></div>
                <div><label>Espaçamento Entre Plantas (m)</label><input type="number" step="0.1" id="exp_plant" value="${expData.plant_spacing||''}"></div>
            </div>
        </div>
    `;
}
else if(currentStep===7){
    if(!expData.plotMap || expData.plotMap.length === 0){
        expData.plotMap = [];
        for(let b = 1; b <= 3; b++){
            let plotIndex = 1;
            for(let r = 1; r <= 3; r++){
                for(let c = 1; c <= 4; c++){
                    expData.plotMap.push({
                        block: b,
                        row: r,
                        col: c,
                        treatment_id: null,
                        plot_code: `B${b}P${plotIndex}`
                    });
                    plotIndex++;
                }
            }
        }
    }
    
    content.innerHTML = `
        <div class="space-y-6">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div class="flex items-start gap-3">
                    <div class="text-2xl">📐</div>
                    <div>
                        <h3 class="font-bold text-primary mb-1">Mapa do Delineamento em Blocos Casualizados</h3>
                        <p class="text-sm text-muted">
                            Distribua os <strong>${expData.treatments.length} tratamentos</strong> nas parcelas de cada bloco.
                        </p>
                    </div>
                </div>
            </div>
            
            <div class="flex flex-wrap gap-2 justify-between items-center">
                <div class="text-sm text-muted">
                    <strong>Layout:</strong> 3 linhas × 4 colunas
                </div>
                <div class="flex gap-2">
                    <button onclick="randomizePlotMap()" class="px-4 py-2 bg-accent text-white rounded-lg text-sm font-semibold">
                        🎲 Casualizar Tudo
                    </button>
                    <button onclick="clearPlotMap()" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold">
                        🗑️ Limpar
                    </button>
                </div>
            </div>
            
            <div class="space-y-6">
                ${[1, 2, 3].map(blockNum => `
                    <div class="bg-white border-2 border-gray-200 rounded-xl p-4">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-bold text-primary">Bloco ${blockNum}</h3>
                            <button onclick="randomizeBlock(${blockNum})" class="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                                🎲 Casualizar
                            </button>
                        </div>
                        
                        <div class="grid grid-cols-4 gap-2">
                            ${expData.plotMap.filter(p => p.block === blockNum).map(plot => `
                                <div class="border-2 ${plot.treatment_id ? 'border-primary bg-green-50' : 'border-gray-300 bg-gray-50'} rounded-lg p-3">
                                    <div class="text-xs font-bold text-muted mb-2">${plot.plot_code}</div>
                                    <select 
                                        onchange="updatePlotTreatment(${blockNum}, ${plot.row}, ${plot.col}, this.value)"
                                        class="w-full text-xs border border-gray-300 rounded p-1.5 bg-white"
                                    >
                                        <option value="">Selecione...</option>
                                        ${expData.treatments.map(t => `
                                            <option value="${t.id}" ${plot.treatment_id === t.id ? 'selected' : ''}>
                                                T${t.id} - ${t.variety_name} (${t.position})
                                            </option>
                                        `).join('')}
                                    </select>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div id="validation-block-${blockNum}" class="mt-3 text-sm"></div>
                    </div>
                `).join('')}
            </div>
            
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 class="font-bold text-sm text-primary mb-3">📋 Legenda de Tratamentos</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                    ${expData.treatments.map(t => `
                        <div class="flex items-center gap-2 bg-white p-2 rounded border border-gray-200">
                            <span class="font-bold text-primary">T${t.id}:</span>
                            <span class="text-muted">${t.variety_name} - ${t.position}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    setTimeout(() => validateAllBlocks(), 100);
}
else if(currentStep===8){
        content.innerHTML=`
            <div style="background:#f9fafb;padding:16px;border-radius:8px;margin-bottom:16px;border:1px solid #e5e7eb;">
                <h4 style="margin-bottom:12px;font-size:15px;">Adicionar Atividade</h4>
                <div class="form-grid">
                    <div class="form-grid cols-3">
                        <div><label>Nome *</label><input type="text" id="activity_name" placeholder="Ex: Adubação"></div>
                        <div><label>Fase *</label><select id="activity_phase"><option value="pre_planting">Pré-Plantio</option><option value="planting">Plantio</option><option value="monitoring" selected>Acompanhamento</option><option value="cultural_practices">Tratos Culturais</option><option value="harvest">Colheita</option></select></div>
                        <div><label>Data Início *</label><input type="date" id="activity_start"></div>
                    </div>
                    <div><label>Data Término</label><input type="date" id="activity_end"></div>
                </div>
                <button class="btn-primary btn-add-activity" id="addActivityBtn">+ Adicionar</button>
            </div>
            <div id="scheduleList"></div>
        `;
        setTimeout(()=>{$('addActivityBtn').onclick=addActivity;renderSchedule()},0);
    }
    else if(currentStep===9){
        const scheduleByPhase={};
        (expData.schedule||[]).forEach(item=>{
            if(!scheduleByPhase[item.phase])scheduleByPhase[item.phase]=[];
            scheduleByPhase[item.phase].push(item);
        });
        let scheduleHtml='';
        Object.keys(phaseLabels).forEach(phase=>{
            const items=scheduleByPhase[phase]||[];
            if(items.length>0){
                scheduleHtml+=`<div class="schedule-phase"><div class="schedule-phase-title">${phaseLabels[phase]}</div>${items.map(item=>`<div class="schedule-item"><div class="schedule-item-info"><div class="schedule-item-name">${item.activity_name}</div><div class="schedule-item-dates">${formatDate(item.start_date)}${item.end_date?' - '+formatDate(item.end_date):''}</div></div></div>`).join('')}</div>`;
            }
        });
        content.innerHTML=`
            <div class="review-section">
                <h3 style="color:#166534;margin-bottom:16px;">Revisão Final</h3>
                <div class="review-item"><strong>Código:</strong> ${expData.code}</div>
                <div class="review-item"><strong>Nome:</strong> ${expData.name}</div>
                <div class="review-item"><strong>Data Plantio:</strong> ${formatDate(expData.planting_date)}</div>
                <div class="review-item"><strong>Local:</strong> ${expData.farm}, ${expData.municipality}</div>
                <div class="review-item"><strong>Variedades:</strong> ${expData.varieties?.length||0}</div>
                <div class="review-item"><strong>Atividades:</strong> ${expData.schedule?.length||0}</div>
                ${scheduleHtml?`<div style="margin-top:20px;"><h4 style="font-size:15px;color:#166534;margin-bottom:12px;">Cronograma</h4>${scheduleHtml}</div>`:''}
                <p style="margin-top:16px;color:#166534;font-weight:600;">✓ Pronto para salvar!</p>
            </div>
        `;
    }

    $('btnPrev').classList.toggle('hidden',currentStep===0);
    $('btnNext').classList.toggle('hidden',currentStep===steps.length-1);
    $('btnSave').classList.toggle('hidden',currentStep!==steps.length-1);
}

function rendercollaborators(){
    const list=$('collaboratorList');
    if(!expData.collaborators||expData.collaborators.length===0){list.classList.add('hidden');return;}
    list.classList.remove('hidden');
    list.innerHTML='';
    expData.collaborators.forEach((r,i)=>{
        const item=document.createElement('div');
        item.className='item';
        item.innerHTML=`<span>${r}</span><button class="btn-remove">✕</button>`;
        item.querySelector('.btn-remove').onclick=()=>{expData.collaborators.splice(i,1);rendercollaborators()};
        list.appendChild(item);
    });
}

function addcollaborator(){
    const input=$('collaborator_input');
    const name=input.value.trim();
    if(!name)return alert('Digite um nome!');
    if(!expData.collaborators)expData.collaborators=[];
    expData.collaborators.push(name);
    input.value='';
    rendercollaborators();
}

function renderVarieties(){
    const list=$('varList');
    if(!expData.varieties||expData.varieties.length===0){
        list.innerHTML='<p style="color:#9ca3af;text-align:center;padding:20px;">Nenhuma variedade.</p>';
        return;
    }
    list.innerHTML='';
    expData.varieties.forEach((v,i)=>{
        const item=document.createElement('div');
        item.className='item';
        item.innerHTML=`<div><strong>${v.name}</strong> - ${v.use_type} | ${v.pulp_color}</div><button class="btn-remove">✕</button>`;
        item.querySelector('.btn-remove').onclick=()=>{expData.varieties.splice(i,1);renderVarieties()};
        list.appendChild(item);
    });
}

function addVariety(){
    const name=$('var_name').value.trim();
    if(!name)return alert('Nome obrigatório!');
    if(!expData.varieties)expData.varieties=[];
    expData.varieties.push({name:name,use_type:$('var_use').value,pulp_color:$('var_color').value});
    $('var_name').value='';
    renderVarieties();
}

function renderSchedule(){
    const list=$('scheduleList');
    if(!expData.schedule||expData.schedule.length===0){
        list.innerHTML='<p style="color:#9ca3af;text-align:center;padding:20px;">Nenhuma atividade.</p>';
        return;
    }
    const scheduleByPhase={};
    expData.schedule.forEach(item=>{
        if(!scheduleByPhase[item.phase])scheduleByPhase[item.phase]=[];
        scheduleByPhase[item.phase].push(item);
    });
    list.innerHTML='';
    Object.keys(phaseLabels).forEach(phase=>{
        const items=scheduleByPhase[phase]||[];
        if(items.length>0){
            const phaseDiv=document.createElement('div');
            phaseDiv.className='schedule-phase';
            phaseDiv.innerHTML=`<div class="schedule-phase-title">${phaseLabels[phase]}</div>`;
            items.forEach(item=>{
                const itemDiv=document.createElement('div');
                itemDiv.className='schedule-item';
                itemDiv.innerHTML=`<div class="schedule-item-info"><div class="schedule-item-name">${item.activity_name}</div><div class="schedule-item-dates">${formatDate(item.start_date)}${item.end_date?' - '+formatDate(item.end_date):''}</div></div><button class="btn-icon" title="Remover"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>`;
                const globalIdx=expData.schedule.findIndex(s=>s===item);
                itemDiv.querySelector('.btn-icon').onclick=()=>{expData.schedule.splice(globalIdx,1);renderSchedule()};
                phaseDiv.appendChild(itemDiv);
            });
            list.appendChild(phaseDiv);
        }
    });
}

function addActivity(){
    const name=$('activity_name').value.trim();
    const phase=$('activity_phase').value;
    const start=$('activity_start').value;
    const end=$('activity_end').value;
    if(!name||!start)return alert('Nome e Data Início obrigatórios!');
    if(!expData.schedule)expData.schedule=[];
    expData.schedule.push({activity_name:name,phase:phase,start_date:start,end_date:end||null});
    $('activity_name').value='';
    $('activity_start').value='';
    $('activity_end').value='';
    renderSchedule();
}

function generateTreatments(){
    const positions = ['vertical', 'inclinada', 'horizontal'];
    let treatments = [];
    let counter = 1;
    if(!expData.varieties || expData.varieties.length === 0) return;
    
    expData.varieties.forEach(v => {
        positions.forEach(p => {
            treatments.push({
                code: `T${counter}`,
                id: counter,
                variety: v.name,
                variety_name: v.name,
                position: p
            });
            counter++;
        });
    });
    expData.treatments = treatments;
}

function saveStepData(){
    if(currentStep===0){
        expData.code=$('exp_code').value;
        expData.name=$('exp_name').value;
        expData.objective=$('exp_obj').value;
        expData.planting_date=$('exp_date').value;
    }
    else if(currentStep===1){
        expData.farm=$('exp_farm').value;
        expData.municipality=$('exp_city').value;
        expData.latitude=$('exp_lat').value;
        expData.longitude=$('exp_lng').value;
    }
    else if(currentStep===2){
        expData.soil_type=$('exp_soil').value;
        expData.climate=$('exp_climate').value;
    }
    else if(currentStep===3){
        expData.varieties_count=parseInt($('exp_varieties').value)||4;
        expData.treatments_count=parseInt($('exp_treatments').value)||3;
        expData.blocks_count=parseInt($('exp_blocks').value)||3;
        expData.plots_per_block=parseInt($('exp_plots').value)||12;
        expData.useful_plants_per_plot=parseInt($('exp_plants').value)||4;
    }
    else if(currentStep===6){
        expData.plot_length=parseFloat($('exp_length').value)||null;
        expData.plot_width=parseFloat($('exp_width').value)||null;
        expData.row_spacing=parseFloat($('exp_row').value)||null;
        expData.plant_spacing=parseFloat($('exp_plant').value)||null;
    }
}

async function saveExperiment(){
    if(!expData.code||!expData.name||!expData.objective||!expData.planting_date){
        alert('Preencha campos obrigatórios!');
        return;
    }
    try{
        const expPayload={
            code:expData.code,
            name:expData.name,
            objective:expData.objective,
            researcher:expData.researchers?.join(', ')||'',
            planting_date:expData.planting_date,
            farm:expData.farm,
            municipality:expData.municipality,
            latitude:expData.latitude||null,
            longitude:expData.longitude||null,
            soil_type:expData.soil_type,
            climate:expData.climate,
            blocks_count:expData.blocks_count,
            treatments_count:expData.varieties_count*expData.treatments_count,
            plots_per_block:expData.plots_per_block,
            useful_plants_per_plot:expData.useful_plants_per_plot,
            plot_length:expData.plot_length||null,
            plot_width:expData.plot_width||null,
            row_spacing:expData.row_spacing||null,
            plant_spacing:expData.plant_spacing||null,
            plot_map: expData.plotMap ? JSON.stringify(expData.plotMap) : null,
            created_by:user.id,
            status:'active'
        };
        let exp;
        if(editingExpId){
            const {data,error}=await s.from('experiments').update(expPayload).eq('id',editingExpId).select().single();
            if(error)throw error;
            exp=data;
            await s.from('varieties').delete().eq('experiment_id',editingExpId);
            await s.from('treatments').delete().eq('experiment_id',editingExpId);
            await s.from('experiment_schedule').delete().eq('experiment_id',editingExpId);
            alert('✅ Atualizado!');
        }else{
            const {data,error}=await s.from('experiments').insert([expPayload]).select().single();
            if(error)throw error;
            exp=data;
            alert('✅ Criado!');
        }
        if(expData.varieties&&expData.varieties.length>0){
            const {data:vars}=await s.from('varieties').insert(expData.varieties.map(v=>({experiment_id:exp.id,name:v.name,use_type:v.use_type,pulp_color:v.pulp_color}))).select();
            const treats=expData.treatments.map(t=>{
                const v=vars.find(vr=>vr.name===t.variety);
                return{experiment_id:exp.id,code:t.code,variety_id:v.id,position:t.position};
            });
            await s.from('treatments').insert(treats);
        }
        if(expData.schedule&&expData.schedule.length>0){
            await s.from('experiment_schedule').insert(expData.schedule.map(item=>({experiment_id:exp.id,activity_name:item.activity_name,phase:item.phase,start_date:item.start_date,end_date:item.end_date})));
        }
        if(!editingExpId){
            const plots=[];
            for(let b=1;b<=expData.blocks_count;b++){
                for(let p=1;p<=expData.plots_per_block;p++){
                    plots.push({experiment_id:exp.id,plot_code:`B${b}T${p}`,block_number:b});
                }
            }
            await s.from('plots').insert(plots);
        }
        $('expModal').classList.remove('active');
        renderExperimentsPage($('contentArea'));
    }catch(x){
        alert('Erro: '+x.message);
        console.error(x);
    }
}

// ============================================
// FUNÇÕES DO MAPA DBC
// ============================================
function updatePlotTreatment(block, row, col, treatmentId){
    const plot = expData.plotMap.find(p => p.block === block && p.row === row && p.col === col);
    if(plot){
        plot.treatment_id = treatmentId || null;
        renderWizard();
    }
}

function validateAllBlocks(){
    for(let b = 1; b <= 3; b++){
        validateBlock(b);
    }
}

function validateBlock(blockNum){
    const blockPlots = expData.plotMap.filter(p => p.block === blockNum);
    const assignedTreatments = blockPlots.map(p => p.treatment_id).filter(t => t);
    const uniqueTreatments = [...new Set(assignedTreatments)];
    
    const validationDiv = document.getElementById(`validation-block-${blockNum}`);
    if(!validationDiv) return;
    
    const missingCount = expData.treatments.length - assignedTreatments.length;
    const hasDuplicates = assignedTreatments.length !== uniqueTreatments.length;
    
    if(assignedTreatments.length === 0){
        validationDiv.innerHTML = '<span style="color:#6b7280">⚪ Nenhum tratamento atribuído</span>';
    } else if(hasDuplicates){
        validationDiv.innerHTML = '<span style="color:#dc2626">❌ Tratamentos duplicados neste bloco!</span>';
    } else if(missingCount > 0){
        validationDiv.innerHTML = `<span style="color:#d97706">⚠️ Faltam ${missingCount} tratamento(s)</span>`;
    } else {
        validationDiv.innerHTML = '<span style="color:#16a34a">✅ Bloco completo e válido</span>';
    }
}

function randomizeBlock(blockNum){
    const blockPlots = expData.plotMap.filter(p => p.block === blockNum);
    const treatments = [...expData.treatments].sort(() => Math.random() - 0.5);
    
    blockPlots.forEach((plot, index) => {
        if(index < treatments.length){
            plot.treatment_id = treatments[index].id;
        }
    });
    
    renderWizard();
}

function randomizePlotMap(){
    for(let b = 1; b <= 3; b++){
        randomizeBlock(b);
    }
}

function clearPlotMap(){
    if(confirm('Tem certeza que deseja limpar todo o mapa?')){
        expData.plotMap.forEach(p => p.treatment_id = null);
        renderWizard();
    }
}







