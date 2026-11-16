import {
  api,
  buildWhatsAppLink,
  categoryIcon,
  copyText,
  escapeHtml,
  formatDate,
  icon,
  openModal,
  rupiah,
  toast,
} from './ui.js';

const state = {
  technicians: [],
  categories: [],
  user: null,
  q: '',
  category: 'all',
  sort: 'recommended',
  loading: false,
};

const els = {
  grid: document.getElementById('catalogGrid'),
  chips: document.getElementById('categoryChips'),
  search: document.getElementById('searchInput'),
  sort: document.getElementById('sortSelect'),
  authArea: document.getElementById('authArea'),
  heroStats: document.getElementById('heroStats'),
  resultMeta: document.getElementById('resultMeta'),
};

let searchTimer = null;

/* --------------------------------- Sesi ---------------------------------- */
async function loadSession() {
  try {
    const data = await api('/auth/me');
    state.user = data.user;
  } catch {
    state.user = null;
  }
  renderAuthArea();
}

function renderAuthArea() {
  if (!state.user) {
    els.authArea.innerHTML = `
      <a class="btn btn-ghost btn-sm" href="/login">Masuk</a>
      <a class="btn btn-primary btn-sm" href="/register">Daftar</a>`;
    return;
  }
  const roleLabel = { admin: 'Admin', technician: 'Teknisi', customer: 'Pelanggan' }[state.user.role] || '';
  els.authArea.innerHTML = `
    <a class="user-chip" href="/dashboard" title="Buka dashboard">
      <span class="avatar-xs">${escapeHtml(state.user.name.slice(0, 2).toUpperCase())}</span>
      <span>${escapeHtml(state.user.name.split(' ')[0])}<br><span class="muted" style="font-weight:600;font-size:.68rem">${roleLabel}</span></span>
    </a>
    <a class="btn btn-outline btn-sm" href="/dashboard">Dashboard</a>`;
}

/* ------------------------------- Pemuatan -------------------------------- */
async function loadSummary() {
  try {
    const data = await api('/catalog/summary');
    els.heroStats.innerHTML = `
      <div class="stat-pill">${icon('store')}<span><strong>${data.totalTechnicians}</strong>teknisi aktif</span></div>
      <div class="stat-pill">${icon('clock')}<span><strong>${data.totalSlots}</strong>slot hari ini</span></div>
      <div class="stat-pill">${icon('wrench')}<span><strong>${data.totalCategories}</strong>kategori layanan</span></div>`;
  } catch {
    els.heroStats.innerHTML = '';
  }
}

async function loadCategories() {
  try {
    const data = await api('/catalog/categories');
    state.categories = data.categories;
  } catch {
    state.categories = [];
  }

  els.chips.innerHTML =
    `<button type="button" class="chip ${state.category === 'all' ? 'active' : ''}" data-category="all">${icon('spark')} Semua kategori</button>` +
    state.categories
      .map(
        (category) => `<button type="button" class="chip ${String(state.category) === String(category.id) ? 'active' : ''}" data-category="${category.id}">
          ${icon(categoryIcon(category.name))} ${escapeHtml(category.name)}
          <span style="opacity:.65">(${category.technician_count})</span>
        </button>`,
      )
      .join('');
}

async function loadCatalog() {
  state.loading = true;
  els.grid.innerHTML = `<div class="loading-block" style="grid-column:1/-1"><span class="spinner"></span>Memuat teknisi…</div>`;

  const params = new URLSearchParams();
  if (state.q) params.set('q', state.q);
  if (state.category !== 'all') params.set('category', state.category);
  params.set('sort', state.sort);

  try {
    const data = await api(`/catalog?${params.toString()}`);
    state.technicians = data.technicians;
    renderCatalog();
  } catch (error) {
    els.grid.innerHTML = `<div class="empty" style="grid-column:1/-1">${icon('alert')}<p>${escapeHtml(error.message)}</p>
      <button class="btn btn-outline btn-sm" data-retry>Coba lagi</button></div>`;
    els.grid.querySelector('[data-retry]')?.addEventListener('click', loadCatalog);
  } finally {
    state.loading = false;
  }
}

/* ------------------------------- Render ---------------------------------- */
function slotDots(slots) {
  const total = Math.min(Math.max(slots, 3), 6);
  return Array.from({ length: total }, (_, index) => `<span class="slot-dot ${index < slots ? '' : 'off'}"></span>`).join('');
}

function renderCatalog() {
  els.resultMeta.textContent = `${state.technicians.length} teknisi ditemukan`;

  if (!state.technicians.length) {
    els.grid.innerHTML = `<div class="empty" style="grid-column:1/-1">${icon('search')}
      <p>Tidak ada teknisi yang cocok dengan pencarian Anda.</p>
      <small>Coba kata kunci lain atau pilih semua kategori.</small></div>`;
    return;
  }

  els.grid.innerHTML = state.technicians
    .map((tech, index) => {
      const full = tech.slots_available <= 0;
      return `
      <article class="tech-card" data-tech="${tech.id}">
        <div class="tech-head">
          <div class="avatar tone-${(index % 6) + 1}">${icon(categoryIcon(tech.category_name))}</div>
          <div style="min-width:0">
            <h3>${escapeHtml(tech.business_name)}</h3>
            <div class="tech-meta">
              <span class="badge">${escapeHtml(tech.category_name)}</span>
              ${tech.is_featured ? `<span class="badge badge-featured">${icon('star')} Unggulan</span>` : ''}
              ${full ? '<span class="badge badge-red">Slot penuh</span>' : `<span class="badge badge-green">${tech.slots_available} slot</span>`}
            </div>
          </div>
        </div>
        <p class="tech-desc">${escapeHtml(tech.description)}</p>
        <div class="tech-facts">
          <span>${icon('pin')} ${escapeHtml(tech.area)} — ${escapeHtml(tech.address)}</span>
          <span>${icon('box')} ${tech.service_count} layanan terdaftar · ${icon('users')} ${escapeHtml(tech.owner_name)}</span>
        </div>
        <div class="price-row">
          <div><span>Tarif mulai</span><strong>${rupiah(tech.tariff_start)}</strong></div>
          <div><span>Biaya panggil</span><strong>${rupiah(tech.call_fee)}</strong></div>
        </div>
        <div class="slots-line">
          <span>Slot hari ini</span>
          <span class="slot-dots">${slotDots(tech.slots_available)}</span>
        </div>
        <div class="card-actions">
          <button type="button" class="btn btn-outline" data-detail="${tech.id}">Detail</button>
          <button type="button" class="btn btn-wa" data-book="${tech.id}" ${full ? 'disabled' : ''}>
            ${icon('whatsapp')} ${full ? 'Slot penuh' : 'Pesan'}
          </button>
        </div>
      </article>`;
    })
    .join('');
}

/* ------------------------------- Detail ---------------------------------- */
async function openDetail(techId) {
  const modal = openModal({
    title: 'Detail teknisi',
    body: `<div class="loading-block"><span class="spinner"></span>Memuat profil…</div>`,
    size: 'modal-lg',
  });

  try {
    const { technician, services } = await api(`/catalog/${techId}`);
    const full = technician.slots_available <= 0;

    const serviceList = services.length
      ? services
          .map(
            (service) => `<div class="service-item">
              <div>
                <h4>${escapeHtml(service.name)}</h4>
                <p>${escapeHtml(service.description)} · ± ${service.estimated_minutes} menit</p>
              </div>
              <strong>${rupiah(service.price)}</strong>
            </div>`,
          )
          .join('')
      : `<p class="muted" style="font-size:.82rem">Teknisi ini belum menambahkan rincian layanan. Tarif mulai tetap berlaku.</p>`;

    modal.body.innerHTML = `
      <div class="tech-head" style="margin-bottom:.9rem">
        <div class="avatar tone-${(technician.id % 6) + 1}">${icon(categoryIcon(technician.category_name))}</div>
        <div>
          <h3 style="font-size:1.05rem">${escapeHtml(technician.business_name)}</h3>
          <div class="tech-meta">
            <span class="badge">${escapeHtml(technician.category_name)}</span>
            ${technician.is_featured ? `<span class="badge badge-featured">${icon('star')} Unggulan</span>` : ''}
            <span class="badge badge-green">${icon('shield')} Terverifikasi</span>
            <span class="badge badge-gray">${Number(technician.rating).toFixed(1)} rating</span>
          </div>
        </div>
      </div>
      <p style="font-size:.86rem;color:#475569">${escapeHtml(technician.description)}</p>
      <div class="tech-facts" style="margin-top:.7rem">
        <span>${icon('pin')} ${escapeHtml(technician.address)} (${escapeHtml(technician.area)})</span>
        <span>${icon('users')} Pengelola: ${escapeHtml(technician.owner_name)}</span>
        <span>${icon('phone')} WhatsApp: ${escapeHtml(technician.whatsapp_number)}</span>
      </div>
      <div class="price-row" style="margin-top:.9rem">
        <div><span>Tarif servis mulai</span><strong>${rupiah(technician.tariff_start)}</strong></div>
        <div><span>Biaya panggil ke rumah</span><strong>${rupiah(technician.call_fee)}</strong></div>
      </div>
      <div class="price-summary" style="margin-top:.75rem">
        <div><span>Slot tersedia hari ini</span><strong>${technician.slots_available} slot</strong></div>
        <div><span>Estimasi datang ke bengkel</span><strong>${rupiah(technician.tariff_start)}</strong></div>
        <div class="total"><span>Estimasi panggil ke rumah</span><span>${rupiah(technician.tariff_start + technician.call_fee)}</span></div>
      </div>
      <h4 style="margin:1rem 0 .35rem;font-size:.9rem">Layanan &amp; tarif</h4>
      ${serviceList}`;

    modal.footer.innerHTML = `
      <button type="button" class="btn btn-outline" data-modal-close>Tutup</button>
      <button type="button" class="btn btn-wa" id="detailBook" ${full ? 'disabled' : ''}>
        ${icon('whatsapp')} ${full ? 'Slot penuh hari ini' : 'Pesan via WhatsApp'}
      </button>`;
    modal.footer.querySelector('[data-modal-close]').addEventListener('click', modal.close);
    modal.footer.querySelector('#detailBook')?.addEventListener('click', () => {
      modal.close();
      openBooking(techId);
    });
  } catch (error) {
    modal.body.innerHTML = `<div class="form-error">${escapeHtml(error.message)}</div>`;
  }
}

/* ------------------------------- Booking --------------------------------- */
function openAuthPrompt() {
  const modal = openModal({
    title: 'Masuk untuk memesan',
    subtitle: 'Pesanan tersimpan agar teknisi dan Anda punya catatan yang sama.',
    body: `<p style="font-size:.88rem;color:#475569">
        Buat akun pelanggan gratis atau masuk dengan akun yang sudah ada. Setelah itu Anda bisa
        mengirim pesanan ke WhatsApp teknisi dengan satu klik.
      </p>`,
    footer: `
      <button type="button" class="btn btn-outline" data-modal-close>Nanti saja</button>
      <a class="btn btn-outline" href="/register">Daftar akun</a>
      <a class="btn btn-primary" href="/login?next=/">Masuk</a>`,
  });
  modal.footer.querySelector('[data-modal-close]').addEventListener('click', modal.close);
}

async function openBooking(techId) {
  if (!state.user) {
    openAuthPrompt();
    return;
  }
  if (state.user.role !== 'customer') {
    toast('Hanya akun pelanggan yang dapat membuat pesanan baru.', 'error');
    return;
  }

  const modal = openModal({
    title: 'Buat pesanan',
    subtitle: 'Ringkasan pesanan otomatis dikirim ke WhatsApp teknisi.',
    body: `<div class="loading-block"><span class="spinner"></span>Menyiapkan formulir…</div>`,
    footer: '',
    size: 'modal-lg',
  });

  let data;
  try {
    data = await api(`/catalog/${techId}`);
  } catch (error) {
    modal.body.innerHTML = `<div class="form-error">${escapeHtml(error.message)}</div>`;
    return;
  }

  const { technician, services } = data;
  const today = new Date().toISOString().slice(0, 10);
  const serviceOptions = [
    `<option value="">Servis umum (tarif mulai ${rupiah(technician.tariff_start)})</option>`,
    ...services.map((service) => `<option value="${service.id}">${escapeHtml(service.name)} — ${rupiah(service.price)}</option>`),
  ].join('');

  modal.body.innerHTML = `
    <form id="bookingForm" class="form-grid" novalidate>
      <div id="bookingError" class="form-error hidden" role="alert"></div>
      <div class="price-summary">
        <div><span>Teknisi</span><strong>${escapeHtml(technician.business_name)}</strong></div>
        <div><span>Kategori</span><strong>${escapeHtml(technician.category_name)}</strong></div>
        <div><span>Slot tersedia</span><strong>${technician.slots_available} slot</strong></div>
      </div>

      <fieldset class="field" style="border:none;padding:0;margin:0">
        <legend class="label" style="margin-bottom:.35rem">Mode layanan</legend>
        <div class="form-row">
          <label class="checkbox" style="padding:.55rem .7rem;border:1px solid var(--line);border-radius:11px;background:#fff">
            <input type="radio" name="mode" value="home" checked />
            <span><strong>Panggil ke rumah</strong><br><span class="muted" style="font-size:.72rem">+ ${rupiah(technician.call_fee)} biaya panggil</span></span>
          </label>
          <label class="checkbox" style="padding:.55rem .7rem;border:1px solid var(--line);border-radius:11px;background:#fff">
            <input type="radio" name="mode" value="workshop" />
            <span><strong>Datang ke bengkel</strong><br><span class="muted" style="font-size:.72rem">tanpa biaya panggil</span></span>
          </label>
        </div>
      </fieldset>

      <div class="field">
        <label for="serviceId">Layanan</label>
        <select class="select" id="serviceId" name="serviceId">${serviceOptions}</select>
      </div>

      <div class="form-row">
        <div class="field">
          <label for="scheduledDate">Rencana kedatangan</label>
          <input class="input" type="date" id="scheduledDate" name="scheduledDate" min="${today}" />
        </div>
        <div class="field">
          <label for="address">Alamat / patokan</label>
          <input class="input" id="address" name="address" placeholder="Jl. Ikan Tongkol No. 8, Banyuwangi" />
          <span class="hint">Wajib untuk panggil ke rumah.</span>
        </div>
      </div>

      <div class="field">
        <label for="complaint">Keluhan perangkat</label>
        <textarea class="textarea" id="complaint" name="complaint" maxlength="1000" placeholder="Contoh: layar HP pecah setelah terjatuh, masih bisa menyala."></textarea>
      </div>

      <div class="price-summary" id="estimateBox"></div>
    </form>`;

  modal.footer.innerHTML = `
    <button type="button" class="btn btn-outline" data-modal-close>Batal</button>
    <button type="button" class="btn btn-primary" id="submitBooking">${icon('whatsapp')} Buat pesanan</button>`;
  modal.footer.querySelector('[data-modal-close]').addEventListener('click', modal.close);

  const form = modal.body.querySelector('#bookingForm');
  const serviceSelect = form.querySelector('#serviceId');
  const estimateBox = form.querySelector('#estimateBox');

  function currentTotal() {
    const selected = services.find((service) => String(service.id) === serviceSelect.value);
    const base = selected ? selected.price : technician.tariff_start;
    const mode = form.querySelector('input[name="mode"]:checked').value;
    const fee = mode === 'home' ? technician.call_fee : 0;
    return { base, fee, total: base + fee, selected };
  }

  function updateEstimate() {
    const { base, fee, total } = currentTotal();
    estimateBox.innerHTML = `
      <div><span>Tarif jasa</span><strong>${rupiah(base)}</strong></div>
      <div><span>Biaya panggil</span><strong>${fee ? rupiah(fee) : 'Gratis'}</strong></div>
      <div class="total"><span>Estimasi total</span><span>${rupiah(total)}</span></div>`;
  }

  form.addEventListener('change', updateEstimate);
  updateEstimate();

  modal.footer.querySelector('#submitBooking').addEventListener('click', async (event) => {
    const button = event.currentTarget;
    const errorBox = form.querySelector('#bookingError');
    errorBox.classList.add('hidden');
    button.disabled = true;
    button.innerHTML = '<span class="spinner"></span> Mengirim…';

    try {
      const payload = {
        technicianId: technician.id,
        serviceId: serviceSelect.value ? Number(serviceSelect.value) : null,
        mode: form.querySelector('input[name="mode"]:checked').value,
        complaint: form.querySelector('#complaint').value.trim(),
        address: form.querySelector('#address').value.trim(),
        scheduledDate: form.querySelector('#scheduledDate').value || undefined,
      };
      const result = await api('/orders', { method: 'POST', body: payload });
      renderSuccess(modal, result, technician);
    } catch (error) {
      errorBox.textContent = error.message;
      errorBox.classList.remove('hidden');
      button.disabled = false;
      button.innerHTML = `${icon('whatsapp')} Buat pesanan`;
      loadCatalog();
    }
  });
}

function renderSuccess(modal, result, technician) {
  const { order, whatsapp } = result;

  modal.body.innerHTML = `
    <div class="banner banner-info" style="margin-bottom:.8rem">
      ${icon('check')}
      <span><strong>Pesanan ${escapeHtml(order.code)} tersimpan.</strong>
      Slot teknisi sudah dikurangi 1. Lanjutkan ke WhatsApp agar teknisi dapat mengonfirmasi jadwal.</span>
    </div>
    <div class="price-summary" style="margin-bottom:.8rem">
      <div><span>Teknisi</span><strong>${escapeHtml(technician.business_name)}</strong></div>
      <div><span>Layanan</span><strong>${escapeHtml(order.service_name)}</strong></div>
      <div><span>Mode</span><strong>${order.service_mode === 'home' ? 'Panggil ke rumah' : 'Datang ke bengkel'}</strong></div>
      <div class="total"><span>Estimasi total</span><span>${rupiah(order.estimated_total)}</span></div>
    </div>
    <label class="label" for="waPreview">Pratinjau pesan WhatsApp</label>
    <pre class="message-preview" id="waPreview">${escapeHtml(whatsapp.message)}</pre>
    <p class="muted" style="font-size:.74rem;margin-top:.5rem">Pesan berisi nomor simulasi teknisi. Di production, nomor berasal dari profil mitra.</p>`;

  modal.footer.innerHTML = `
    <button type="button" class="btn btn-outline" data-modal-close>Tutup</button>
    <button type="button" class="btn btn-outline" id="copyMessage">${icon('copy')} Salin teks</button>
    <a class="btn btn-wa" href="${escapeHtml(whatsapp.url)}" target="_blank" rel="noopener noreferrer">
      ${icon('external')} Buka WhatsApp
    </a>`;

  modal.footer.querySelector('[data-modal-close]').addEventListener('click', modal.close);
  modal.footer.querySelector('#copyMessage').addEventListener('click', async () => {
    const ok = await copyText(whatsapp.message);
    toast(ok ? 'Teks pesan disalin.' : 'Tidak dapat menyalin otomatis. Silakan salin manual.', ok ? 'success' : 'error');
  });

  loadCatalog();
  loadSummary();
  toast(`Pesanan ${order.code} berhasil dibuat.`);
}

/* -------------------------------- Events --------------------------------- */
function bindEvents() {
  els.search.addEventListener('input', (event) => {
    state.q = event.target.value.trim();
    clearTimeout(searchTimer);
    searchTimer = setTimeout(loadCatalog, 250);
  });

  els.sort.addEventListener('change', (event) => {
    state.sort = event.target.value;
    loadCatalog();
  });

  els.chips.addEventListener('click', (event) => {
    const chip = event.target.closest('[data-category]');
    if (!chip) return;
    state.category = chip.dataset.category;
    els.chips.querySelectorAll('.chip').forEach((item) => item.classList.toggle('active', item === chip));
    loadCatalog();
  });

  els.grid.addEventListener('click', (event) => {
    const detail = event.target.closest('[data-detail]');
    if (detail) {
      openDetail(Number(detail.dataset.detail));
      return;
    }
    const book = event.target.closest('[data-book]');
    if (book && !book.disabled) openBooking(Number(book.dataset.book));
  });

  document.getElementById('year').textContent = new Date().getFullYear();
}

async function init() {
  bindEvents();
  await Promise.all([loadSession(), loadCategories(), loadSummary(), loadCatalog()]);
  const params = new URLSearchParams(window.location.search);
  if (params.get('verified')) toast('Akun teknisi dibuat. Menunggu verifikasi admin.', 'info');
}

init();
