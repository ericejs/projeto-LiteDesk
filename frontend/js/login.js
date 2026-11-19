// Conecta o formulário de acesso ao serviço de autenticação.
document.addEventListener("DOMContentLoaded", initializeLoginForm);

// Registra o envio do formulário sem criar credenciais ou sessão simuladas.
function initializeLoginForm() {
  document.getElementById("login-form").addEventListener("submit", submitLogin);
}

// Envia as credenciais à API e mantém a pessoa na tela se a autenticação falhar.
async function submitLogin(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const message = document.getElementById("login-message");
  const submitButton = form.querySelector('button[type="submit"]');
  const data = new FormData(form);
  const credentials = {
    email: String(data.get("email")).trim(),
    password: String(data.get("password"))
  };
  submitButton.disabled = true;

  try {
    // Encaminha as credenciais à API; a sessão deverá ser mantida pelo Back-end em cookie seguro.
    await window.LiteDeskApi.login(credentials);
    window.location.href = "dashboard.html";
  } catch (error) {
    window.LiteDeskUtils.showMessage(message, error.message, true);
    submitButton.disabled = false;
  }
}
