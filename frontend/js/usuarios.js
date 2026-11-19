// Controla o gerenciamento de usuários, disponível somente a uma conta administradora.
document.addEventListener("DOMContentLoaded", initializeUsersPage);

let usersList = [];

// Confirma o perfil por meio da API antes de carregar ou exibir controles administrativos.
async function initializeUsersPage() {
  const accessState = document.getElementById("users-access-state");
  if (!window.LiteDeskApi.isConfigured()) {
    accessState.textContent = "Apenas administradores autenticados podem acessar esta página. A API ainda não está configurada.";
    return;
  }
  try {
    // Consulta a sessão autenticada; a permissão real continua sendo responsabilidade do Back-end.
    const user = await window.LiteDeskAuth.getCurrentUser();
    if (!window.LiteDeskAuth.isAdministrator(user)) {
      accessState.textContent = "Acesso restrito a administradores.";
      return;
    }

    accessState.hidden = true;
    document.getElementById("user-management").hidden = false;
    document.getElementById("toggle-user-form").hidden = false;
    document.getElementById("toggle-user-form").addEventListener("click", openCreateUserForm);
    document.getElementById("cancel-user-form").addEventListener("click", closeUserForm);
    document.getElementById("user-form").addEventListener("submit", saveUser);
    document.getElementById("users-body").addEventListener("click", handleUserAction);
    await loadUsers();
  } catch (error) {
    accessState.textContent = error.message;
  }
}

// Carrega os usuários permitidos pela API para a tabela administrativa.
async function loadUsers() {
  const state = document.getElementById("users-list-state");
  try {
    // Solicita a lista de contas ao serviço central de API.
    const response = await window.LiteDeskApi.getUsers();
    usersList = Array.isArray(response) ? response : response.items;
    if (!Array.isArray(usersList)) {
      throw new Error("A API retornou uma lista de usuários inválida.");
    }
    renderUsers();
  } catch (error) {
    state.textContent = error.message;
    state.hidden = false;
  }
}

// Renderiza contas com elementos de texto e ações associadas ao identificador retornado pela API.
function renderUsers() {
  const body = document.getElementById("users-body");
  const state = document.getElementById("users-list-state");
  body.replaceChildren();
  if (usersList.length === 0) {
    state.textContent = "Nenhum usuário disponível.";
    state.hidden = false;
    return;
  }

  usersList.forEach(function (user) {
    const row = document.createElement("tr");
    [user.name || "—", user.email || "—", roleLabel(user.role)].forEach(function (value) {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
    });

    const accountCell = document.createElement("td");
    const accountBadge = document.createElement("span");
    accountBadge.className = "account-badge " + (user.active ? "account-active" : "account-inactive");
    accountBadge.textContent = user.active ? "Ativa" : "Desativada";
    accountCell.appendChild(accountBadge);
    row.appendChild(accountCell);

    const actionsCell = document.createElement("td");
    const actions = document.createElement("div");
    actions.className = "user-action-group";
    actions.appendChild(createUserAction("Editar", "edit", user.id));
    actions.appendChild(createUserAction(user.active ? "Desativar" : "Ativar", "toggle", user.id));
    actionsCell.appendChild(actions);
    row.appendChild(actionsCell);
    body.appendChild(row);
  });
  state.hidden = true;
}

// Cria um botão administrativo com ação e identificador explícitos.
function createUserAction(label, action, id) {
  const button = document.createElement("button");
  button.className = "user-row-action";
  button.type = "button";
  button.dataset.action = action;
  button.dataset.userId = id;
  button.textContent = label;
  return button;
}

// Converte os três perfis permitidos em rótulos legíveis sem aceitar perfis alternativos.
function roleLabel(role) {
  const labels = {
    solicitante: "Solicitante",
    tecnico: "Técnico",
    administrador: "Administrador"
  };
  return labels[role] || "—";
}

// Prepara o formulário vazio para criação de uma nova conta.
function openCreateUserForm() {
  const form = document.getElementById("user-form");
  form.reset();
  form.elements.id.value = "";
  document.getElementById("user-form-title").textContent = "Criar usuário";
  form.hidden = false;
  document.getElementById("user-name").focus();
}

// Fecha o formulário e remove qualquer identificador de edição selecionado.
function closeUserForm() {
  const form = document.getElementById("user-form");
  form.reset();
  form.elements.id.value = "";
  form.hidden = true;
}

// Valida os campos e escolhe criação ou edição conforme o estado do formulário.
async function saveUser(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const id = String(data.get("id") || "");
  const role = String(data.get("role"));
  const allowedRoles = ["solicitante", "tecnico", "administrador"];
  const changes = {
    name: String(data.get("name")).trim(),
    email: String(data.get("email")).trim(),
    role: role,
    active: data.get("active") === "true"
  };
  const message = document.getElementById("user-form-message");

  if (!changes.name || !changes.email || !allowedRoles.includes(role)) {
    window.LiteDeskUtils.showMessage(message, "Informe nome, e-mail e um perfil válido.", true);
    return;
  }

  try {
    if (id) {
      // Atualiza a conta existente e espera a confirmação da API.
      await window.LiteDeskApi.updateUser(id, changes);
    } else {
      // Cria a conta somente após autorização e confirmação do serviço.
      await window.LiteDeskApi.createUser(changes);
    }
    closeUserForm();
    await loadUsers();
  } catch (error) {
    window.LiteDeskUtils.showMessage(message, error.message, true);
  }
}

// Encaminha as ações de edição e ativação ao serviço de usuários.
async function handleUserAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }
  const user = usersList.find(function (item) {
    return String(item.id) === button.dataset.userId;
  });
  if (!user) {
    return;
  }

  if (button.dataset.action === "edit") {
    const form = document.getElementById("user-form");
    form.elements.id.value = user.id;
    form.elements.name.value = user.name || "";
    form.elements.email.value = user.email || "";
    form.elements.role.value = user.role || "";
    form.elements.active.value = String(Boolean(user.active));
    document.getElementById("user-form-title").textContent = "Editar usuário";
    form.hidden = false;
    document.getElementById("user-name").focus();
    return;
  }

  try {
    // Altera somente o estado da conta selecionada; o servidor valida a permissão.
    await window.LiteDeskApi.updateUser(user.id, { active: !user.active });
    await loadUsers();
  } catch (error) {
    const state = document.getElementById("users-list-state");
    state.textContent = error.message;
    state.hidden = false;
  }
}
