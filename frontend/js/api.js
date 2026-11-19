// Reúne as chamadas HTTP para que as páginas não dependam diretamente dos detalhes da API.
window.LiteDeskApi = (function () {
  "use strict";

  // Envia uma requisição HTTP e transforma respostas inválidas em erros visíveis para a página.
  async function request(path, options) {
    const baseUrl = window.LITEDESK_CONFIG.API_BASE_URL.trim().replace(/\/+$/, "");
    if (!baseUrl) {
      throw new Error("A API ainda não está configurada. Nenhuma alteração foi salva.");
    }

    const settings = options || {};
    const headers = new Headers(settings.headers || {});
    if (settings.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    // Inclui credenciais de cookie para permitir uma futura sessão criada pelo Back-end.
    const response = await fetch(baseUrl + path, {
      ...settings,
      headers: headers,
      credentials: "include"
    });

    let responseData = null;
    if (response.status !== 204) {
      const contentType = response.headers.get("content-type") || "";
      responseData = contentType.includes("application/json")
        ? await response.json()
        : await response.text();
    }

    if (!response.ok) {
      const message = responseData && typeof responseData === "object" && responseData.message
        ? responseData.message
        : "A API respondeu com o status " + response.status + ".";
      throw new Error(message);
    }

    return responseData;
  }

  // Envia as credenciais informadas para o endpoint de autenticação.
  function login(credentials) {
    return request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials)
    });
  }

  // Consulta os dados da conta autenticada, sem armazenar tokens no navegador.
  function getCurrentUser() {
    return request("/auth/me");
  }

  // Consulta os totais de chamados agrupados pelos status aceitos pelo LiteDesk.
  function getDashboardSummary() {
    return request("/tickets/summary");
  }

  // Busca os chamados que a API permite à conta autenticada visualizar.
  function getTickets() {
    return request("/tickets");
  }

  // Busca um chamado específico pelo identificador fornecido pela API.
  function getTicket(id) {
    return request("/tickets/" + encodeURIComponent(id));
  }

  // Envia um novo chamado sem apresentar sucesso se a API não confirmar a criação.
  function createTicket(ticket) {
    return request("/tickets", {
      method: "POST",
      body: JSON.stringify(ticket)
    });
  }

  // Registra atualização e/ou solução no histórico do chamado.
  function addTicketUpdate(id, update) {
    return request("/tickets/" + encodeURIComponent(id) + "/updates", {
      method: "POST",
      body: JSON.stringify(update)
    });
  }

  // Atualiza propriedades operacionais de um chamado, como status, prioridade ou técnico.
  function updateTicket(id, changes) {
    return request("/tickets/" + encodeURIComponent(id), {
      method: "PATCH",
      body: JSON.stringify(changes)
    });
  }

  // Consulta as contas disponíveis para o administrador autenticado.
  function getUsers() {
    return request("/users");
  }

  // Cria uma conta com os dados definidos pelo administrador.
  function createUser(user) {
    return request("/users", {
      method: "POST",
      body: JSON.stringify(user)
    });
  }

  // Salva alterações de perfil ou conta para o usuário indicado.
  function updateUser(id, changes) {
    return request("/users/" + encodeURIComponent(id), {
      method: "PATCH",
      body: JSON.stringify(changes)
    });
  }

  // Envia os campos permitidos para edição da própria conta autenticada.
  function updateOwnProfile(changes) {
    return request("/users/me", {
      method: "PATCH",
      body: JSON.stringify(changes)
    });
  }

  return {
    isConfigured: function () {
      return Boolean(window.LITEDESK_CONFIG.API_BASE_URL.trim());
    },
    login: login,
    getCurrentUser: getCurrentUser,
    getDashboardSummary: getDashboardSummary,
    getTickets: getTickets,
    getTicket: getTicket,
    createTicket: createTicket,
    addTicketUpdate: addTicketUpdate,
    updateTicket: updateTicket,
    getUsers: getUsers,
    createUser: createUser,
    updateUser: updateUser,
    updateOwnProfile: updateOwnProfile
  };
}());
