export const TicketUIHelper = {
  getStatusBadge(status) {
    const styles = {
      'aberto': 'bg-blue-100 text-blue-800 border-blue-200',
      'em_andamento': 'bg-orange-100 text-orange-800 border-orange-200',
      'fechado': 'bg-green-100 text-green-800 border-green-200'
    };
    const label = status?.replace('_', ' ').toUpperCase() || 'N/A';
    return `<span class="px-2 py-1 rounded-full text-xs font-semibold border ${styles[status] || 'bg-gray-100 text-gray-800'}">${label}</span>`;
  },

  getPriorityBadge(prioridade) {
    const styles = {
      'baixa': 'bg-gray-100 text-gray-600',
      'media': 'bg-yellow-100 text-yellow-800',
      'alta': 'bg-red-100 text-red-800'
    };
    return `<span class="px-2 py-1 rounded-full text-xs font-bold ${styles[prioridade] || 'bg-gray-100'}">${prioridade?.toUpperCase() || 'N/A'}</span>`;
  },

  formatDate(timestamp) {
    if (!timestamp) return '-';
    return new Date(timestamp.seconds * 1000).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  getTimelineItemHTML(item) {
    return `
      <div class="relative pl-4 pb-4 border-l-2 border-b py-4">
        <p class="text-xs text-gray-500 mb-1">${this.formatDate(item.data)}</p>
        <p class="text-sm font-medium text-gray-900">${item.mensagem}</p>
        <p class="text-xs text-gray-400">Por: ${item.autor || 'Sistema'}</p>
      </div>
    `;
  }
};
