// Prepara os filtros e carrega a lista de chamados permitidos pela API.
document.addEventListener("DOMContentLoaded", initializeTicketList);

let loadedTickets = [];

// Carrega os chamados e conecta os controles de pesquisa e status à tabela.
async function initializeTicketList() {
  document.getElementById("ticket-search").addEventListener("input", renderFilteredTickets);
  document.getElementById("status-filter").addEventListener("change", renderFilteredTickets);
  try {
    // Solicita à API a lista de chamados autorizada para a conta atual.
    const response = await window.LiteDeskApi.getTickets();
    loadedTickets = Array.isArray(response) ? response : response.items;
    if (!Array.isArray(loadedTickets)) {
      throw new Error("A API retornou uma lista de chamados inválida.");
    }
    renderFilteredTickets();
  } catch (error) {
    setTicketListState(error.message);
  }
}

// Renderiza apenas os registros que correspondem aos filtros atuais.
function renderFilteredTickets() {
  const search = document.getElementById("ticket-search").value.trim().toLocaleLowerCase("pt-BR");
  const status = document.getElementById("status-filter").value;
  const filtered = loadedTickets.filter(function (ticket) {
    const searchable = [ticket.number, ticket.title, ticket.requester, ticket.assignee]
      .filter(Boolean).join(" ").toLocaleLowerCase("pt-BR");
    return (!search || searchable.includes(search)) && (!status || ticket.status === status);
  });
  renderTickets(filtered);
}

// Monta as linhas usando textContent para exibir os dados recebidos sem interpretar HTML.
function renderTickets(tickets) {
  const body = document.getElementById("tickets-body");
  body.replaceChildren();

  if (tickets.length === 0) {
    setTicketListState(loadedTickets.length ? "Nenhum chamado corresponde aos filtros." : "Nenhum chamado disponível.");
    return;
  }

  tickets.forEach(function (ticket) {
    const row = document.createElement("tr");
    const values = [
      { text: ticket.number || ticket.id || "—", className: "ticket-number" },
      { text: ticket.title || "—", className: "ticket-title-cell" },
      { text: ticket.requester || "—" },
      { text: ticket.assignee || "—" },
      { text: ticket.priority || "—", className: "priority-badge priority-" + normalizeClass(ticket.priority) },
      { text: ticket.status || "—", className: "status-badge " + window.LiteDeskUtils.statusClass(ticket.status) },
      { text: window.LiteDeskUtils.formatDate(ticket.createdAt) }
    ];

    values.forEach(function (value) {
      const cell = document.createElement("td");
      cell.textContent = value.text;
      if (value.className) {
        cell.className = value.className;
      }
      row.appendChild(cell);
    });

    const actionCell = document.createElement("td");
    const link = document.createElement("a");
    link.className = "view-link";
    link.href = "detalhes-chamado.html?id=" + encodeURIComponent(ticket.id);
    link.textContent = "Visualizar";
    link.setAttribute("aria-label", "Visualizar detalhes do chamado " + (ticket.number || ticket.id || ""));
    actionCell.appendChild(link);
    row.appendChild(actionCell);
    body.appendChild(row);
  });
  setTicketListState("");
}

// Atualiza a mensagem de estado da tabela sem deixar registros antigos aparentarem estar atualizados.
function setTicketListState(message) {
  const state = document.getElementById("tickets-state");
  state.textContent = message;
  state.hidden = !message;
  if (message) {
    document.getElementById("tickets-body").replaceChildren();
  }
}

// Gera um fragmento de classe apenas para as etiquetas visuais de prioridade.
function normalizeClass(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
