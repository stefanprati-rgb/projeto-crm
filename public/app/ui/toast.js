export function showToast(message, type = 'info') {
  const c = document.querySelector('.toast-container');
  if (!c) return;
  const id = `toast-${Date.now()}`;
  const color = type === 'danger' ? 'danger' : type === 'success' ? 'success' : 'primary';
  const html = `
    <div id="${id}" class="toast align-items-center text-white bg-${color} border-0" role="alert">
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>`;
  c.insertAdjacentHTML('beforeend', html);
  const el = document.getElementById(id);
  const t = new bootstrap.Toast(el, { delay: 3000 });
  t.show();
  el.addEventListener('hidden.bs.toast', () => el.remove());
}
