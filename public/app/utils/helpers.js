export const cleanDoc = (v) => String(v ?? '').replace(/[.\-/]/g, '');
export const normalizeStatus = (s) => String(s ?? 'PENDENTE').toUpperCase().trim().replace(/\s+/g, '_');
export const statusBadge = (status) => {
  const s = (status || 'PENDENTE').toLowerCase().replace(/_/g, '-');
  const text = (status || 'Pendente').replace(/_/g, ' ');
  return `<span class="status-badge status-${s}">${text}</span>`;
};
