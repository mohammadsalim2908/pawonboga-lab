/* Helper UI bersama: fetch API, format, ikon, modal, toast. */

const ICONS = {
  wrench: '<path d="M14.5 6.5a3.5 3.5 0 1 0 3 3l-8 8a2.1 2.1 0 1 1-3-3l8-8Z"/><path d="M17 3l4 4"/>',
  smartphone:
    '<rect x="7" y="2" width="10" height="20" rx="2.5"/><path d="M11 18.5h2"/>',
  laptop:
    '<rect x="4" y="4" width="16" height="11" rx="1.8"/><path d="M2 19h20"/>',
  fridge:
    '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M6 10h12"/><path d="M9 5.5v2M9 13v2.5"/>',
  tv:
    '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M9 21h6M12 18v3"/>',
  wind:
    '<path d="M3 8h11a3 3 0 1 0-3-3"/><path d="M3 12h15a3 3 0 1 1-3 3"/><path d="M3 16h7"/>',
  star: '<path d="M12 3l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9L12 3Z"/>',
  pin: '<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
  whatsapp:
    '<path d="M21 11.5a8.5 8.5 0 0 1-12.7 7.4L3 21l2.2-5.2A8.5 8.5 0 1 1 21 11.5Z"/><path d="M8.6 10.4c0 3 2 5 5 5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/>',
  arrow: '<path d="M4 12h15"/><path d="m13 6 6 6-6 6"/>',
  check: '<path d="M4 12l5 5L20 6"/>',
  shield: '<path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3Z"/><path d="M9 12l2 2 4-4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  users:
    '<circle cx="9" cy="8" r="3.2"/><path d="M2.8 20a6.2 6.2 0 0 1 12.4 0"/><path d="M16.4 5.2a3.2 3.2 0 0 1 0 5.6"/><path d="M17.2 14.6a6.2 6.2 0 0 1 4 5.4"/>',
  box: '<path d="M21 8 12 3 3 8l9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
  logout: '<path d="M15 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h9"/><path d="M18 12H9"/><path d="m15 8 4 4-4 4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M4 20h4L18 10l-4-4L4 16v4Z"/><path d="m14 6 4 4"/>',
  trash: '<path d="M4 7h16"/><path d="M9 7V5h6v2"/><path d="m6 7 1 13h10l1-13"/><path d="M10 11v6M14 11v6"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  home: '<path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9Z"/>',
  calendar:
    '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 11h18"/>',
  money:
    '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/>',
  spark:
    '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/>',
  filter: '<path d="M3 5h18M6 12h12M10 19h4"/>',
  phone:
    '<path d="M6 3h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 4 5a2 2 0 0 1 2-2Z"/>',
  chart: '<path d="M4 20v-6M9 20V8M14 20v-9M19 20V5"/><path d="M2 20h20"/>',
  store:
    '<path d="M3 9l2-5h14l2 5"/><path d="M4 9h16v11H4z"/><path d="M9 20v-6h6v6"/>',
  alert: '<path d="M12 4l9 16H3L12 4Z"/><path d="M12 10v4M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  external: '<path d="M14 4h6v6"/><path d="m20 4-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  refresh:
    '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
  clipboard:
    '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1"/><path d="M9 10h6M9 14h6M9 18h3"/>',
  settings:
    '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/>',
  chartPie: '<path d="M12 3a9 9 0 1 0 9 9h-9V3Z"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
};

export function icon(name, extraClass = '') {
  const path = ICONS[name] || ICONS.wrench;
  return `<svg class="${extraClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}

export const CATEGORY_ICONS = ['smartphone', 'laptop', 'fridge', 'tv', 'wind'];

export function categoryIcon(name) {
  const key = String(name || '').toLowerCase();
  if (key.includes('hp') || key.includes('gadget')) return 'smartphone';
  if (key.includes('laptop') || key.includes('pc') || key.includes('komputer')) return 'laptop';
  if (key.includes('kulkas') || key.includes('cuci')) return 'fridge';
  if (key.includes('tv') || key.includes('audio')) return 'tv';
  if (key.includes('ac') || key.includes('pendingin')) return 'wind';
  return 'wrench';
}

export const rupiah = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function initials(name) {
  return String(name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}

export function formatDate(value, withTime = false) {
  if (!value) return '—';
  const date = new Date(String(value).replace(' ', 'T') + (String(value).includes('Z') ? '' : 'Z'));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    timeZone: 'Asia/Jakarta',
  });
}

export async function api(path, { method = 'GET', body } = {}) {
  const response = await fetch(`/api${path}`, {
    method,
    credentials: 'same-origin',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const error = new Error(data.error || `Permintaan gagal (${response.status}).`);
    error.status = response.status;
    error.details = data.details;
    throw error;
  }
  return data;
}

export function toast(message, type = 'success') {
  let root = document.getElementById('toastRoot');
  if (!root) {
    root = document.createElement('div');
    root.id = 'toastRoot';
    root.className = 'toast-root';
    document.body.append(root);
  }
  const item = document.createElement('div');
  item.className = `toast ${type}`;
  const iconName = type === 'error' ? 'alert' : type === 'info' ? 'info' : 'check';
  item.innerHTML = `${icon(iconName)}<span>${escapeHtml(message)}</span>`;
  root.append(item);
  setTimeout(() => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(6px)';
    item.style.transition = 'all .2s ease';
    setTimeout(() => item.remove(), 220);
  }, 4200);
}

export function openModal({ title, subtitle = '', body = '', footer = '', size = '' }) {
  let root = document.getElementById('modalRoot');
  if (!root) {
    root = document.createElement('div');
    root.id = 'modalRoot';
    document.body.append(root);
  }

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal ${size}" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
      <div class="modal-head">
        <div>
          <h3>${escapeHtml(title)}</h3>
          ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}
        </div>
        <button type="button" class="icon-btn" data-modal-close aria-label="Tutup">${icon('x')}</button>
      </div>
      <div class="modal-body">${body}</div>
      <div class="modal-foot">${footer}</div>
    </div>`;

  const dialog = backdrop.querySelector('.modal');
  let closed = false;

  function close() {
    if (closed) return;
    closed = true;
    document.removeEventListener('keydown', onKeydown);
    backdrop.remove();
    if (root && !root.children.length) root.remove();
  }

  function onKeydown(event) {
    if (event.key === 'Escape') close();
  }

  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) close();
  });
  backdrop.querySelectorAll('[data-modal-close]').forEach((button) => {
    button.addEventListener('click', close);
  });
  document.addEventListener('keydown', onKeydown);
  root.append(backdrop);

  requestAnimationFrame(() => {
    const focusable = backdrop.querySelector('input:not([type="hidden"]), select, textarea, button');
    focusable?.focus({ preventScroll: true });
  });

  return {
    dialog,
    body: backdrop.querySelector('.modal-body'),
    footer: backdrop.querySelector('.modal-foot'),
    close,
  };
}

export function confirmDialog({ title, message, confirmLabel = 'Hapus', danger = true }) {
  return new Promise((resolve) => {
    const modal = openModal({
      title,
      body: `<p style="font-size:.88rem;color:#475569">${escapeHtml(message)}</p>`,
      footer: `
        <button type="button" class="btn btn-outline" data-cancel>Batal</button>
        <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-confirm>${escapeHtml(confirmLabel)}</button>`,
    });

    const finish = (value) => {
      modal.close();
      resolve(value);
    };
    modal.footer.querySelector('[data-cancel]').addEventListener('click', () => finish(false));
    modal.footer.querySelector('[data-confirm]').addEventListener('click', () => finish(true));
    modal.dialog.closest('.modal-backdrop').addEventListener('click', (event) => {
      if (event.target.classList.contains('modal-backdrop')) resolve(false);
    });
  });
}

export const STATUS_LABELS = {
  pending: { label: 'Menunggu konfirmasi', className: 'badge-blue' },
  confirmed: { label: 'Dikonfirmasi', className: 'badge' },
  in_progress: { label: 'Sedang dikerjakan', className: 'badge-featured' },
  completed: { label: 'Selesai', className: 'badge-green' },
  cancelled: { label: 'Dibatalkan', className: 'badge-red' },
};

export function statusBadge(status) {
  const info = STATUS_LABELS[status] || { label: status, className: 'badge-gray' };
  return `<span class="badge ${info.className}">${escapeHtml(info.label)}</span>`;
}

export function roleBadge(role) {
  const map = {
    admin: { label: 'Admin', className: 'badge-blue' },
    technician: { label: 'Teknisi', className: 'badge' },
    customer: { label: 'Pelanggan', className: 'badge-green' },
  };
  const info = map[role] || { label: role, className: 'badge-gray' };
  return `<span class="badge ${info.className}">${escapeHtml(info.label)}</span>`;
}

export function emptyState(text, iconName = 'box') {
  return `<div class="empty">${icon(iconName)}<p>${escapeHtml(text)}</p></div>`;
}

export function loadingState(text = 'Memuat data…') {
  return `<div class="loading-block"><span class="spinner"></span>${escapeHtml(text)}</div>`;
}

export const PRICE_TYPE_LABEL = {
  fixed: 'Harga tetap',
  starting: 'Mulai dari',
  quote: 'Sesuai diagnosa',
};

/** Label harga sebuah layanan (mendukung harga tetap / mulai dari / sesuai diagnosa). */
export function servicePriceText(service) {
  if (!service) return '—';
  if (service.price_type === 'quote') return 'Sesuai diagnosa';
  if (service.price_type === 'starting') return `Mulai ${rupiah(service.price)}`;
  return rupiah(service.price);
}

/** Label total pesanan berdasarkan snapshot price_type. */
export function orderPriceText(order) {
  if (!order) return '—';
  if (order.price_type === 'quote') return 'Sesuai diagnosa';
  if (order.price_type === 'starting') return `Mulai ${rupiah(order.estimated_total)}`;
  return rupiah(order.estimated_total);
}

export function buildWhatsAppLink(order) {
  const modeLabel = order.service_mode === 'home' ? 'Panggil ke Rumah' : 'Datang ke Lokasi Teknisi';
  const lines = [
    '*Pesanan TekniKita*',
    `Kode: ${order.code}`,
    '',
    `Halo ${order.technician_name}, saya ${order.customer_name} ingin memesan jasa servis melalui TekniKita.`,
    '',
    `Layanan: ${order.service_name || 'Servis umum'}`,
    `Mode: ${modeLabel}`,
    order.scheduled_date ? `Jadwal: ${String(order.scheduled_date).slice(0, 10)}` : null,
    order.customer_address ? `Alamat: ${order.customer_address}` : null,
    order.complaint ? `Keluhan: ${order.complaint}` : null,
    `Perkiraan biaya: ${
      order.price_type === 'quote'
        ? 'menyesuaikan hasil diagnosa teknisi'
        : order.price_type === 'starting'
          ? `mulai dari ${rupiah(order.estimated_total)}`
          : rupiah(order.estimated_total)
    }`,
    '',
    'Mohon konfirmasi ketersediaan dan jadwalnya. Terima kasih.',
  ].filter((line) => line !== null);
  return `https://wa.me/${String(order.technician_phone).replace(/\D/g, '')}?text=${encodeURIComponent(lines.join('\n'))}`;
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.append(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  }
}
