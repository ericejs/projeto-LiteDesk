// Compartilha funções pequenas de apresentação utilizadas pelas páginas do LiteDesk.
window.LiteDeskUtils = (function () {
  "use strict";

  // Atualiza uma região de estado e garante que erros continuem visíveis para a pessoa usuária.
  function showMessage(element, message, isError) {
    if (!element) {
      return;
    }
    element.textContent = message;
    element.classList.toggle("message-error", Boolean(isError));
  }

  // Converte uma data válida para o formato local sem inventar valor para datas ausentes.
  function formatDate(value) {
    if (!value) {
      return "—";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "—";
    }
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(date);
  }

  // Normaliza textos para associar estilos sem alterar o conteúdo original exibido.
  function statusClass(value) {
    return {
      "Aberto": "status-aberto",
      "Pendente": "status-pendente",
      "Em atendimento": "status-em-atendimento",
      "Finalizado": "status-finalizado"
    }[value] || "";
  }

  // Informa no cabeçalho se a API ainda precisa ser configurada.
  function initializeConnectionLabel() {
    const label = document.querySelector("[data-connection-status]");
    if (label && window.LiteDeskApi.isConfigured()) {
      label.textContent = "API configurada";
    }
  }

  // Inicializa os elementos compartilhados quando cada página estiver pronta.
  function initialize() {
    initializeConnectionLabel();
    if (window.LiteDeskAuth) {
      window.LiteDeskAuth.initialize();
    }
  }

  document.addEventListener("DOMContentLoaded", initialize);

  return {
    showMessage: showMessage,
    formatDate: formatDate,
    statusClass: statusClass
  };
}());
