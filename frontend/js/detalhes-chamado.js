// Carrega os detalhes e as ações disponíveis para o chamado selecionado.
document.addEventListener("DOMContentLoaded", initializeTicketDetails);

let activeTicketId = "";
let activeTicket = null;

// Valida o identificador da URL e conecta os formulários de atualização do chamado.
async function initializeTicketDetails() {
  activeTicketId = new URLSearchParams(window.location.search).get("id") || "";
  document.getElementById("update-form").addEventListener("submit", submitTicketUpdate);
  const controls = document.getElementById("ticket-controls");
  if (controls) {
    controls.addEventListener("submit", submitTicketControls);
    document.getElementById("assume-ticket").addEventListener("click", assumeTicket);
  }

  if (!activeTicketId) {
    showTicketError("Selecione um chamado na lista para consultar os detalhes.");
    return;
  }

  try {
    // Busca o registro pelo identificador da URL usando o serviço central de API.
    const ticket = await window.LiteDeskApi.getTicket(activeTicketId);
    activeTicket = ticket;
    renderTicketDetails(ticket);
    await configureTicketControls();
  } catch (error) {
    showTicketError(error.message);
  }
}

// Apresenta os dados recebidos sem preencher campos ausentes com conteúdo fictício.
function renderTicketDetails(ticket) {
  document.getElementById("ticket-number").textContent = ticket.number || ticket.id || "Chamado";
  document.getElementById("ticket-title").textContent = ticket.title || "Título indisponível";
  document.getElementById("ticket-description").textContent = ticket.description || "Descrição não informada.";
  document.getElementById("ticket-requester").textContent = ticket.requester || "—";
  document.getElementById("ticket-assignee").textContent = ticket.assignee || "—";
  document.getElementById("ticket-category").textContent = ticket.category || "—";
  document.getElementById("ticket-priority").textContent = ticket.priority || "—";
  document.getElementById("ticket-created").textContent = window.LiteDeskUtils.formatDate(ticket.createdAt);
  document.getElementById("ticket-id").textContent = ticket.number || ticket.id || "—";
  const status = document.getElementById("ticket-status");
  status.textContent = ticket.status || "—";
  status.className = "status-badge " + window.LiteDeskUtils.statusClass(ticket.status);
  renderTicketHistory(ticket.history);
}

// Cria itens do histórico com conteúdo textual para evitar interpretar dados como marcação HTML.
function renderTicketHistory(history) {
  const list = document.getElementById("ticket-history");
  const state = document.getElementById("history-state");
  list.replaceChildren();
  if (!Array.isArray(history) || history.length === 0) {
    state.textContent = "Ainda não há movimentações disponíveis.";
    state.hidden = false;
    return;
  }
  history.forEach(function (entry) {
    const item = document.createElement("li");
    item.className = "history-item";
    const author = document.createElement("strong");
    author.textContent = entry.author || "Atualização";
    const description = document.createElement("p");
    description.textContent = entry.description || entry.solution || "";
    item.append(author, description);
    if (entry.createdAt) {
      const date = document.createElement("time");
      date.dateTime = entry.createdAt;
      date.textContent = window.LiteDeskUtils.formatDate(entry.createdAt);
      item.appendChild(date);
    }
    list.appendChild(item);
  });
  state.hidden = true;
}

// Exibe falhas de carregamento no conteúdo da página sem ocultar a causa.
function showTicketError(message) {
  document.getElementById("ticket-description").textContent = message;
  document.getElementById("history-state").textContent = message;
  document.getElementById("history-state").hidden = false;
  document.querySelectorAll("#update-form input, #update-form textarea, #update-form button").forEach(function (control) {
    control.disabled = true;
  });
}

// Exibe os controles operacionais apenas para técnico ou administrador autenticado.
async function configureTicketControls() {
  try {
    // Consulta a conta autenticada antes de expor as ações técnicas na interface.
    const user = await window.LiteDeskAuth.getCurrentUser();
    if (user.role !== "tecnico" && user.role !== "administrador") {
      return;
    }
    const controls = document.getElementById("ticket-controls");
    controls.hidden = false;
    document.getElementById("control-status").value = activeTicket.status || "";
    document.getElementById("control-priority").value = activeTicket.priority || "";
  } catch (error) {
    const message = document.getElementById("ticket-control-message");
    window.LiteDeskUtils.showMessage(message, error.message, true);
  }
}

// Envia status e prioridade escolhidos nos valores permitidos pelo sistema.
async function submitTicketControls(event) {
  event.preventDefault();
  const message = document.getElementById("ticket-control-message");
  const status = document.getElementById("control-status").value;
  const priority = document.getElementById("control-priority").value;
  const validStatuses = ["Aberto", "Pendente", "Em atendimento", "Finalizado"];
  const validPriorities = ["Baixa", "Média", "Alta", "Crítica"];
  if (!validStatuses.includes(status) || !validPriorities.includes(priority)) {
    window.LiteDeskUtils.showMessage(message, "Selecione um status e uma prioridade válidos.", true);
    return;
  }
  try {
    // Solicita à API a alteração operacional e recarrega o chamado após a confirmação.
    await window.LiteDeskApi.updateTicket(activeTicketId, { status: status, priority: priority });
    window.LiteDeskUtils.showMessage(message, "Chamado atualizado pela API.", false);
    window.location.reload();
  } catch (error) {
    window.LiteDeskUtils.showMessage(message, error.message, true);
  }
}

// Solicita à API que associe o usuário autenticado como técnico responsável.
async function assumeTicket() {
  try {
    // A API valida a permissão e registra a atribuição do chamado ao técnico.
    await window.LiteDeskApi.updateTicket(activeTicketId, { assume: true });
    window.LiteDeskUtils.showMessage(document.getElementById("ticket-control-message"), "Chamado assumido pela API.", false);
    window.location.reload();
  } catch (error) {
    window.LiteDeskUtils.showMessage(document.getElementById("ticket-control-message"), error.message, true);
  }
}

// Envia a atualização e/ou a solução preenchida no formulário para o histórico do chamado.
async function submitTicketUpdate(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const message = document.getElementById("update-message");
  const formData = new FormData(form);
  const update = {
    description: String(formData.get("update")).trim(),
    solution: String(formData.get("solution")).trim()
  };
  if (!update.description && !update.solution) {
    window.LiteDeskUtils.showMessage(message, "Informe uma atualização ou uma solução antes de enviar.", true);
    return;
  }
  try {
    // Registra a movimentação pela API e só então confirma o envio na interface.
    await window.LiteDeskApi.addTicketUpdate(activeTicketId, update);
    form.reset();
    window.LiteDeskUtils.showMessage(message, "Atualização registrada pela API.", false);
    window.location.reload();
  } catch (error) {
    window.LiteDeskUtils.showMessage(message, error.message, true);
  }
}
