// Carrega os quatro indicadores do painel a partir da API.
document.addEventListener("DOMContentLoaded", loadDashboard);

// Consulta os totais dos quatro status permitidos e preserva o estado vazio em caso de falha.
async function loadDashboard() {
  const state = document.getElementById("dashboard-state");
  try {
    // Solicita o resumo oficial à API, sem calcular ou inventar totais no navegador.
    const summary = await window.LiteDeskApi.getDashboardSummary();
    const statuses = ["aberto", "pendente", "em atendimento", "finalizado"];

    statuses.forEach(function (status) {
      const count = summary && summary[status];
      if (!Number.isInteger(count) || count < 0) {
        throw new Error("A API não retornou totais válidos para o painel.");
      }
      document.querySelector('[data-metric="' + status + '"]').textContent = String(count);
    });

    window.LiteDeskUtils.showMessage(state, "", false);
    state.hidden = true;
  } catch (error) {
    window.LiteDeskUtils.showMessage(state, error.message, true);
  }
}
