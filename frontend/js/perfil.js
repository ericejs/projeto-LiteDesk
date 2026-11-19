// Carrega e permite editar os campos básicos da conta autenticada.
document.addEventListener("DOMContentLoaded", initializeProfile);

// Preenche o formulário somente com dados confirmados pela API.
async function initializeProfile() {
  const state = document.getElementById("profile-state");
  if (!window.LiteDeskApi.isConfigured()) {
    return;
  }
  try {
    // Consulta a conta autenticada usando a sessão gerenciada pelo Back-end.
    const user = await window.LiteDeskAuth.getCurrentUser();
    document.getElementById("profile-name").value = user.name || "";
    document.getElementById("profile-email").value = user.email || "";
    document.getElementById("profile-role").value = profileRoleLabel(user.role);
    document.getElementById("profile-name").disabled = false;
    document.getElementById("profile-email").disabled = false;
    document.querySelector('#profile-form button[type="submit"]').disabled = false;
    state.hidden = true;
    document.getElementById("profile-form").addEventListener("submit", saveProfile);
  } catch (error) {
    state.textContent = error.message;
  }
}

// Traduz os perfis reconhecidos para apresentação no campo da conta.
function profileRoleLabel(role) {
  const labels = {
    solicitante: "Solicitante",
    tecnico: "Técnico",
    administrador: "Administrador"
  };
  return labels[role] || "—";
}

// Envia somente nome e e-mail para a atualização do próprio perfil.
async function saveProfile(event) {
  event.preventDefault();
  const name = document.getElementById("profile-name").value.trim();
  const email = document.getElementById("profile-email").value.trim();
  const message = document.getElementById("profile-message");
  if (!name || !email) {
    window.LiteDeskUtils.showMessage(message, "Informe um nome e um e-mail válidos.", true);
    return;
  }
  try {
    // Atualiza os campos editáveis e exibe sucesso somente após resposta positiva da API.
    await window.LiteDeskApi.updateOwnProfile({ name: name, email: email });
    window.LiteDeskUtils.showMessage(message, "Perfil atualizado pela API.", false);
  } catch (error) {
    window.LiteDeskUtils.showMessage(message, error.message, true);
  }
}
