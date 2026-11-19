// Conecta o formulário para enviar chamados à API quando ela estiver configurada.
document.addEventListener("DOMContentLoaded", initializeNewTicketForm);

// Valida as listas permitidas antes de enviar os dados do formulário.
function initializeNewTicketForm() {
  document.getElementById("new-ticket-form").addEventListener("submit", submitNewTicket);
}

// Envia a solicitação e informa com clareza quando o registro não puder ser concluído.
async function submitNewTicket(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const message = document.getElementById("new-ticket-message");
  const formData = new FormData(form);
  const categories = ["Hardware", "Software", "Rede", "Acesso/Permissão", "Outros"];
  const priorities = ["Baixa", "Média", "Alta", "Crítica"];
  const ticket = {
    title: String(formData.get("title")).trim(),
    description: String(formData.get("description")).trim(),
    category: String(formData.get("category")),
    priority: String(formData.get("priority"))
  };

  if (!ticket.title || !ticket.description || !categories.includes(ticket.category) || !priorities.includes(ticket.priority)) {
    window.LiteDeskUtils.showMessage(message, "Revise os campos e selecione uma categoria e prioridade válidas.", true);
    return;
  }

  try {
    // Solicita à API a criação do chamado; apenas uma resposta bem-sucedida confirma o registro.
    await window.LiteDeskApi.createTicket(ticket);
    form.reset();
    window.LiteDeskUtils.showMessage(message, "Chamado registrado pela API.", false);
  } catch (error) {
    window.LiteDeskUtils.showMessage(message, error.message, true);
  }
}
