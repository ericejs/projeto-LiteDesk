// Organiza as integrações de autenticação e apresentação dos itens conforme o perfil.
window.LiteDeskAuth = (function () {
  "use strict";
  let currentUserRequest = null;

  // Reutiliza a consulta da conta para evitar chamadas duplicadas dentro da mesma página.
  function getCurrentUser() {
    if (!currentUserRequest) {
      currentUserRequest = window.LiteDeskApi.getCurrentUser();
    }
    return currentUserRequest;
  }

  // Confirma se a conta possui o perfil administrativo esperado pelo gerenciamento de usuários.
  function isAdministrator(user) {
    return Boolean(user && user.role === "administrador");
  }

  // Exibe itens administrativos somente após a API confirmar o perfil da conta autenticada.
  function updateRoleNavigation(user) {
    document.querySelectorAll("[data-admin-only]").forEach(function (element) {
      element.hidden = !isAdministrator(user);
    });
    document.querySelectorAll(".nav-login-link").forEach(function (element) {
      element.hidden = Boolean(user);
    });
  }

  // Carrega a conta autenticada quando existe uma API configurada e sinaliza falhas de conexão.
  async function initialize() {
    updateRoleNavigation(null);
    if (!window.LiteDeskApi.isConfigured()) {
      return;
    }
    try {
      const user = await getCurrentUser();
      updateRoleNavigation(user);
    } catch (error) {
      const status = document.querySelector("[data-connection-status]");
      if (status) {
        status.textContent = error.message;
      }
    }
  }

  // Informa se a URL da API foi preenchida na configuração central.
  function isConfigured() {
    return window.LiteDeskApi.isConfigured();
  }

  return {
    getCurrentUser: getCurrentUser,
    isAdministrator: isAdministrator,
    isConfigured: isConfigured,
    initialize: initialize
  };
}());
