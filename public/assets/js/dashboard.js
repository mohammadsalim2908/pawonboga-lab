import {
  api,
  buildWhatsAppLink,
  categoryIcon,
  confirmDialog,
  emptyState,
  escapeHtml,
  formatDate,
  icon,
  loadingState,
  openModal,
  orderPriceText,
  PRICE_TYPE_LABEL,
  roleBadge,
  rupiah,
  servicePriceText,
  statusBadge,
  toast,
} from './ui.js';

/* -------------------------------- Konfigurasi ----------------------------- */
const NAVS = {
  admin: [
    { route: 'overview', label: 'Ringkasan', icon: 'chart', title: 'Ringkasan direktori', subtitle: 'Statistik pengguna, teknisi, dan pesanan TekniKita.' },
    { route: 'users', label: 'Pengguna', icon: 'users', title: 'Kelola pengguna', subtitle: 'Tambah akun, ubah peran, nonaktifkan, atau hapus pengguna.' },
    { route: 'technicians', label: 'Moderasi teknisi', icon: 'store', title: 'Moderasi teknisi', subtitle: 'Verifikasi mitra, atur status unggulan dan slot harian.' },
    { route: 'categories', label: 'Kategori', icon: 'filter', title: 'Kategori keahlian', subtitle: 'Kategori dipakai teknisi dan filter katalog pelanggan.' },
    { route: 'orders', label: 'Pesanan', icon: 'clipboard', title: 'Semua pesanan', subtitle: 'Pantau pesanan pelanggan ke seluruh mitra teknisi.' },
    { route: 'profile', label: 'Akun saya', icon: 'settings', title: 'Akun saya', subtitle: 'Perbarui data akun dan kata sandi.' },
  ],
  technician: [
    { route: 'overview', label: 'Ringkasan', icon: 'chart', title: 'Ringkasan teknisi', subtitle: 'Performa pesanan dan ketersediaan slot hari ini.' },
    { route: 'tech-profile', label: 'Profil teknisi', icon: 'store', title: 'Profil teknisi', subtitle: 'Informasi ini tampil di katalog pelanggan.' },
    { route: 'services', label: 'Layanan & tarif', icon: 'box', title: 'Layanan & tarif', subtitle: 'Daftar jasa beserta harga dan estimasi pengerjaan.' },
    { route: 'tech-orders', label: 'Pesanan masuk', icon: 'clipboard', title: 'Pesanan masuk', subtitle: 'Konfirmasi, kerjakan, dan selesaikan pesanan pelanggan.' },
    { route: 'profile', label: 'Akun saya', icon: 'settings', title: 'Akun saya', subtitle: 'Perbarui data akun dan kata sandi.' },
  ],
  customer: [
    { route: 'orders', label: 'Pesanan saya', icon: 'clipboard', title: 'Pesanan saya', subtitle: 'Riwayat pesanan dan status pengerjaannya.' },
    { route: 'profile', label: 'Akun saya', icon: 'settings', title: 'Akun saya', subtitle: 'Perbarui data akun dan kata sandi.' },
  ],
};

const ROLE_LABEL = { admin: 'Admin', technician: 'Teknisi', customer: 'Pelanggan' };

const state = {
  user: null,
  technician: null,
  categoriesCache: null,
  userFilters: { q: '', role: '', status: '' },
  orderStatus: '',
  services: [],
};

const els = {
  sideNav: document.getElementById('sideNav'),
  sideUser: document.getElementById('sideUser'),
  pageTitle: document.getElementById('pageTitle'),
  pageSubtitle: document.getElementById('pageSubtitle'),
  pageActions: document.getElementById('pageActions'),
  view: document.getElementById('dashView'),
};

/* --------------------------------- Helper -------------------------------- */
function setTitle(title, subtitle) {
  els.pageTitle.textContent = title;
  els.pageSubtitle.textContent = subtitle;
  document.title = `${title} — TekniKita`;
}

function setActions(html = '') {
  els.pageActions.innerHTML = html;
}

function setView(html) {
  els.view.innerHTML = html;
}

function errorView(error) {
  return `<div class="banner banner-warn">${icon('alert')}
    <span><strong>Tidak dapat memuat data</strong>${escapeHtml(error.message)}</span></div>`;
}

function statCard(label, value, hint, iconName) {
  return `<article class="stat-card">
    <div class="stat-top"><span>${escapeHtml(label)}</span>${icon(iconName)}</div>
    <strong>${typeof value === 'number' ? value.toLocaleString('id-ID') : escapeHtml(value)}</strong>
    <small>${escapeHtml(hint)}</small>
  </article>`;
}

function accountBadge(status) {
  return status === 'active'
    ? '<span class="badge badge-green">Aktif</span>'
    : '<span class="badge badge-red">Nonaktif</span>';
}

function optionsFromCategories(selectedId) {
  const categories = state.categoriesCache || [];
  return categories
    .map(
      (category) =>
        `<option value="${category.id}" ${Number(selectedId) === Number(category.id) ? 'selected' : ''}>${escapeHtml(category.name)}</option>`,
    )
    .join('');
}

async function getCategories(force = false) {
  if (!state.categoriesCache || force) {
    const data = await api('/catalog/categories');
    state.categoriesCache = data.categories;
  }
  return state.categoriesCache;
}

function bindGoto(root = document) {
  root.querySelectorAll('[data-goto]').forEach((button) => {
    button.addEventListener('click', () => {
      window.location.hash = `#/${button.dataset.goto}`;
    });
  });
}

/* ---------------------------------- Shell -------------------------------- */
function renderShell() {
  const nav = NAVS[state.user.role] || NAVS.customer;
  els.sideNav.innerHTML =
    `<span class="side-label">Menu ${ROLE_LABEL[state.user.role]}</span>` +
    nav
      .map(
        (item) =>
          `<a class="side-link" href="#/${item.route}" data-route="${item.route}">${icon(item.icon)}<span>${escapeHtml(item.label)}</span></a>`,
      )
      .join('');

  els.sideUser.innerHTML = `
    <span class="avatar-xs">${escapeHtml(state.user.name.slice(0, 2).toUpperCase())}</span>
    <div style="min-width:0">
      <strong>${escapeHtml(state.user.name)}</strong>
      <span>${ROLE_LABEL[state.user.role]}${state.technician && !state.technician.isVerified ? ' · belum terverifikasi' : ''}</span>
    </div>`;
}

function currentRoute() {
  const nav = NAVS[state.user.role] || NAVS.customer;
  const requested = window.location.hash.replace(/^#\/?/, '');
  const route = nav.some((item) => item.route === requested) ? requested : nav[0].route;
  return { nav, route };
}

async function route() {
  const { nav, route: name } = currentRoute();
  const item = nav.find((entry) => entry.route === name) || nav[0];

  els.sideNav.querySelectorAll('.side-link').forEach((link) => {
    link.classList.toggle('active', link.dataset.route === name);
  });

  setTitle(item.title, item.subtitle);
  setActions('');
  els.view.innerHTML = loadingState();

  try {
    await VIEWS[name]();
    bindGoto(els.view);
  } catch (error) {
    if (error.status === 401) {
      window.location.replace('/login?expired=1');
      return;
    }
    els.view.innerHTML = errorView(error);
  }
}

/* ------------------------------ Kartu pesanan ---------------------------- */
function orderRows(orders, mode) {
  return orders
    .map((order) => {
      const actions = [];
      if (mode === 'technician') {
        if (order.status === 'pending') {
          actions.push(`<button class="btn btn-primary btn-sm" data-order-action="confirmed" data-id="${order.id}">Terima</button>`);
          actions.push(`<button class="btn btn-outline btn-sm" data-order-action="cancelled" data-id="${order.id}">Tolak</button>`);
        } else if (order.status === 'confirmed') {
          actions.push(`<button class="btn btn-primary btn-sm" data-order-action="in_progress" data-id="${order.id}">Mulai</button>`);
          actions.push(`<button class="btn btn-outline btn-sm" data-order-action="cancelled" data-id="${order.id}">Batal</button>`);
        } else if (order.status === 'in_progress') {
          actions.push(`<button class="btn btn-wa btn-sm" data-order-action="completed" data-id="${order.id}">Selesaikan</button>`);
        }
        if (order.customer_phone) {
          actions.push(
            `<a class="btn btn-ghost btn-sm" href="https://wa.me/${String(order.customer_phone).replace(/\D/g, '')}" target="_blank" rel="noopener noreferrer" title="Chat pelanggan">${icon('whatsapp')}</a>`,
          );
        }
      } else if (mode === 'customer') {
        if (['pending', 'confirmed'].includes(order.status)) {
          actions.push(`<button class="btn btn-outline btn-sm" data-cancel-order="${order.id}">Batalkan</button>`);
        }
        actions.push(
          `<a class="btn btn-wa btn-sm" href="${escapeHtml(buildWhatsAppLink(order))}" target="_blank" rel="noopener noreferrer">${icon('whatsapp')} WhatsApp</a>`,
        );
      }

      return `<tr>
        <td>
          <span class="order-code">${escapeHtml(order.code)}</span>
          <div class="table-sub">${formatDate(order.created_at, true)}</div>
        </td>
        <td>
          <div class="table-main">${escapeHtml(mode === 'customer' ? order.technician_name : order.customer_name)}</div>
          <div class="table-sub">${escapeHtml(mode === 'customer' ? (order.category_name || 'Teknisi') : order.customer_phone || '—')}</div>
        </td>
        <td>
          <div class="table-main">${escapeHtml(order.service_name || 'Servis umum')}</div>
          <div class="table-sub">${order.service_mode === 'home' ? 'Panggil ke rumah' : 'Datang ke lokasi teknisi'}${order.scheduled_date ? ` · ${formatDate(order.scheduled_date)}` : ''}</div>
        </td>
        <td>${escapeHtml(order.complaint || '—')}</td>
        <td class="nowrap"><strong>${orderPriceText(order)}</strong></td>
        <td>${statusBadge(order.status)}</td>
        <td><div class="row-actions">${actions.join('') || '<span class="muted">—</span>'}</div></td>
      </tr>`;
    })
    .join('');
}

async function bindOrderActions(container, reload, mode) {
  // onclick (bukan addEventListener) agar handler tidak menumpuk saat tabel dirender ulang.
  container.onclick = async (event) => {
    const action = event.target.closest('[data-order-action]');
    if (action) {
      action.disabled = true;
      try {
        await api(`/technician/orders/${action.dataset.id}`, {
          method: 'PATCH',
          body: { status: action.dataset.orderAction },
        });
        toast('Status pesanan diperbarui.');
        await reload();
      } catch (error) {
        toast(error.message, 'error');
        action.disabled = false;
      }
      return;
    }

    const cancel = event.target.closest('[data-cancel-order]');
    if (cancel && mode === 'customer') {
      const ok = await confirmDialog({
        title: 'Batalkan pesanan?',
        message: 'Slot teknisi akan dikembalikan. Tindakan ini tidak dapat dibatalkan.',
        confirmLabel: 'Ya, batalkan',
      });
      if (!ok) return;
      try {
        await api(`/orders/${cancel.dataset.cancelOrder}/cancel`, { method: 'PATCH', body: { action: 'cancel' } });
        toast('Pesanan dibatalkan dan slot dikembalikan.');
        await reload();
      } catch (error) {
        toast(error.message, 'error');
      }
    }
  };
}

/* ------------------------------- Admin: overview ------------------------- */
async function adminOverview() {
  const { users, directory, recentOrders } = await api('/admin/stats');

  setView(`
    <div class="stats-grid">
      ${statCard('Total pengguna', users.total, `${users.customers} pelanggan · ${users.technicians} teknisi · ${users.admins} admin`, 'users')}
      ${statCard('Teknisi terverifikasi', directory.verifiedTechnicians, `${directory.pendingTechnicians} menunggu verifikasi`, 'store')}
      ${statCard('Slot hari ini', directory.totalSlots, 'akumulasi seluruh teknisi aktif', 'clock')}
      ${statCard('Total pesanan', directory.orders, `${directory.pendingOrders} menunggu konfirmasi`, 'clipboard')}
      ${statCard('Pendapatan selesai', rupiah(directory.revenue), 'dari pesanan berstatus selesai', 'money')}
      ${statCard('Kategori keahlian', directory.categories, `${users.suspended} akun nonaktif`, 'filter')}
    </div>

    ${directory.pendingTechnicians > 0 ? `
      <div class="banner banner-warn">${icon('alert')}
        <span><strong>${directory.pendingTechnicians} teknisi menunggu verifikasi</strong>
        Tinjau profilnya agar dapat tampil di katalog publik.</span>
      </div>` : ''}

    <div class="dash-grid">
      <section class="panel">
        <div class="panel-head">
          <div><h3>Pesanan terbaru</h3><p>6 pesanan terakhir dari seluruh mitra.</p></div>
          <button class="btn btn-outline btn-sm" data-goto="orders">Lihat semua</button>
        </div>
        <div class="table-wrap">
          ${recentOrders.length ? `<table class="data">
            <thead><tr><th>Kode</th><th>Pelanggan</th><th>Teknisi</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>${recentOrders
              .map(
                (order) => `<tr>
                  <td><span class="order-code">${escapeHtml(order.code)}</span><div class="table-sub">${formatDate(order.created_at)}</div></td>
                  <td>${escapeHtml(order.customer_name)}</td>
                  <td>${escapeHtml(order.technician_name)}</td>
                  <td class="nowrap">${rupiah(order.estimated_total)}</td>
                  <td>${statusBadge(order.status)}</td>
                </tr>`,
              )
              .join('')}</tbody>
          </table>` : emptyState('Belum ada pesanan.', 'clipboard')}
        </div>
      </section>

      <section class="panel">
        <div class="panel-head"><div><h3>Aksi cepat</h3><p>Pekerjaan admin yang paling sering dipakai.</p></div></div>
        <div class="panel-body" style="display:grid;gap:.55rem">
          <button class="btn btn-primary" data-goto="users">${icon('plus')} Tambah / kelola pengguna</button>
          <button class="btn btn-outline" data-goto="technicians">${icon('shield')} Verifikasi teknisi (${directory.pendingTechnicians})</button>
          <button class="btn btn-outline" data-goto="categories">${icon('filter')} Atur kategori keahlian</button>
          <button class="btn btn-outline" data-goto="orders">${icon('clipboard')} Pantau pesanan</button>
        </div>
      </section>
    </div>`);
}

/* -------------------------------- Admin: users --------------------------- */
function userRow(user) {
  return `<tr>
    <td>
      <div class="table-main">${escapeHtml(user.name)}</div>
      <div class="table-sub">${escapeHtml(user.email)} · ${escapeHtml(user.phone)}</div>
    </td>
    <td>${roleBadge(user.role)}</td>
    <td>${accountBadge(user.status)}</td>
    <td>${
      user.business_name
        ? `<div class="table-main">${escapeHtml(user.business_name)}</div><div class="table-sub">${escapeHtml(user.category_name || '—')}${user.is_verified ? ' · terverifikasi' : ' · menunggu verifikasi'}</div>`
        : '<span class="muted">—</span>'
    }</td>
    <td class="table-sub nowrap">${formatDate(user.created_at)}</td>
    <td>
      <div class="row-actions">
        <button class="btn btn-outline btn-sm" data-user-edit="${user.id}">${icon('edit')} Edit</button>
        <button class="btn btn-outline btn-sm" data-user-toggle="${user.id}" data-status="${user.status}">
          ${user.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
        </button>
        <button class="btn btn-danger btn-sm" data-user-delete="${user.id}" data-name="${escapeHtml(user.name)}">${icon('trash')}</button>
      </div>
    </td>
  </tr>`;
}

async function loadUsers() {
  const table = document.getElementById('usersTable');
  if (!table) return;
  table.innerHTML = loadingState('Memuat pengguna…');

  const params = new URLSearchParams();
  if (state.userFilters.q) params.set('q', state.userFilters.q);
  if (state.userFilters.role) params.set('role', state.userFilters.role);
  if (state.userFilters.status) params.set('status', state.userFilters.status);

  try {
    const { users } = await api(`/admin/users?${params.toString()}`);
    table.innerHTML = users.length
      ? `<table class="data">
          <thead><tr><th>Pengguna</th><th>Peran</th><th>Status</th><th>Profil teknisi</th><th>Terdaftar</th><th style="text-align:right">Aksi</th></tr></thead>
          <tbody>${users.map(userRow).join('')}</tbody>
        </table>`
      : emptyState('Tidak ada pengguna yang cocok dengan filter.', 'users');

    table.onclick = async (event) => {
      const edit = event.target.closest('[data-user-edit]');
      if (edit) {
        const user = users.find((item) => item.id === Number(edit.dataset.userEdit));
        openUserModal(user);
        return;
      }

      const toggle = event.target.closest('[data-user-toggle]');
      if (toggle) {
        const next = toggle.dataset.status === 'active' ? 'suspended' : 'active';
        toggle.disabled = true;
        try {
          await api(`/admin/users/${toggle.dataset.userToggle}`, { method: 'PATCH', body: { status: next } });
          toast(next === 'active' ? 'Akun diaktifkan.' : 'Akun dinonaktifkan.');
          await loadUsers();
        } catch (error) {
          toast(error.message, 'error');
          toggle.disabled = false;
        }
        return;
      }

      const remove = event.target.closest('[data-user-delete]');
      if (remove) {
        const ok = await confirmDialog({
          title: 'Hapus pengguna?',
          message: `${remove.dataset.name} akan dihapus permanen. Pesanan lama tetap tersimpan tanpa tautan akun.`,
        });
        if (!ok) return;
        try {
          await api(`/admin/users/${remove.dataset.userDelete}`, { method: 'DELETE' });
          toast('Pengguna dihapus.');
          await loadUsers();
        } catch (error) {
          toast(error.message, 'error');
        }
      }
    };
  } catch (error) {
    table.innerHTML = `<div class="form-error" style="margin:1rem">${escapeHtml(error.message)}</div>`;
  }
}

async function adminUsers() {
  await getCategories();
  setActions(`<button class="btn btn-primary btn-sm" id="addUserBtn">${icon('plus')} Tambah pengguna</button>`);
  setView(`
    <div class="filter-bar">
      <div class="search-wrap">
        ${icon('search')}
        <input class="input" id="userSearch" type="search" placeholder="Cari nama, email, atau nama teknisi…" value="${escapeHtml(state.userFilters.q)}" />
      </div>
      <select class="select" id="userRoleFilter">
        <option value="">Semua peran</option>
        <option value="admin" ${state.userFilters.role === 'admin' ? 'selected' : ''}>Admin</option>
        <option value="technician" ${state.userFilters.role === 'technician' ? 'selected' : ''}>Teknisi</option>
        <option value="customer" ${state.userFilters.role === 'customer' ? 'selected' : ''}>Pelanggan</option>
      </select>
      <select class="select" id="userStatusFilter">
        <option value="">Semua status</option>
        <option value="active" ${state.userFilters.status === 'active' ? 'selected' : ''}>Aktif</option>
        <option value="suspended" ${state.userFilters.status === 'suspended' ? 'selected' : ''}>Nonaktif</option>
      </select>
    </div>
    <section class="panel"><div class="table-wrap" id="usersTable">${loadingState()}</div></section>`);

  document.getElementById('addUserBtn').addEventListener('click', () => openUserModal(null));

  let timer = null;
  document.getElementById('userSearch').addEventListener('input', (event) => {
    state.userFilters.q = event.target.value.trim();
    clearTimeout(timer);
    timer = setTimeout(loadUsers, 250);
  });
  document.getElementById('userRoleFilter').addEventListener('change', (event) => {
    state.userFilters.role = event.target.value;
    loadUsers();
  });
  document.getElementById('userStatusFilter').addEventListener('change', (event) => {
    state.userFilters.status = event.target.value;
    loadUsers();
  });

  await loadUsers();
}

async function openUserModal(user) {
  const isEdit = Boolean(user);
  await getCategories();

  const modal = openModal({
    title: isEdit ? 'Edit pengguna' : 'Tambah pengguna',
    subtitle: isEdit ? user.email : 'Admin dapat membuat akun untuk peran apa pun.',
    size: 'modal-lg',
    body: `
      <form id="userForm" class="form-grid" novalidate>
        <div id="userFormError" class="form-error hidden" role="alert"></div>
        <div class="form-row">
          <div class="field">
            <label for="ufName">Nama lengkap</label>
            <input class="input" id="ufName" value="${escapeHtml(user?.name || '')}" required />
          </div>
          <div class="field">
            <label for="ufPhone">Nomor telepon</label>
            <input class="input" id="ufPhone" value="${escapeHtml(user?.phone || '')}" placeholder="0812xxxxxxx" required />
          </div>
        </div>
        <div class="field">
          <label for="ufEmail">Email</label>
          <input class="input" type="email" id="ufEmail" value="${escapeHtml(user?.email || '')}" required />
        </div>
        <div class="form-row">
          <div class="field">
            <label for="ufRole">Peran</label>
            <select class="select" id="ufRole">
              <option value="customer" ${user?.role === 'customer' ? 'selected' : ''}>Pelanggan</option>
              <option value="technician" ${user?.role === 'technician' ? 'selected' : ''}>Teknisi</option>
              <option value="admin" ${user?.role === 'admin' ? 'selected' : ''}>Admin</option>
            </select>
          </div>
          <div class="field">
            <label for="ufStatus">Status akun</label>
            <select class="select" id="ufStatus">
              <option value="active" ${!user || user.status === 'active' ? 'selected' : ''}>Aktif</option>
              <option value="suspended" ${user?.status === 'suspended' ? 'selected' : ''}>Nonaktif</option>
            </select>
          </div>
        </div>
        <div class="field">
          <label for="ufPassword">${isEdit ? 'Kata sandi baru (opsional)' : 'Kata sandi'}</label>
          <input class="input" type="password" id="ufPassword" placeholder="${isEdit ? 'Biarkan kosong jika tidak diubah' : 'Minimal 8 karakter'}" autocomplete="new-password" />
        </div>

        <div id="ufTechFields" class="form-grid ${user?.role === 'technician' ? '' : 'hidden'}">
          <div class="field">
            <label for="ufBusiness">Nama teknisi / usaha</label>
            <input class="input" id="ufBusiness" value="${escapeHtml(user?.business_name || '')}" />
          </div>
          <div class="form-row">
            <div class="field">
              <label for="ufCategory">Kategori keahlian</label>
              <select class="select" id="ufCategory">
                <option value="">Pilih kategori…</option>
                ${optionsFromCategories(user?.category_id)}
              </select>
            </div>
            <div class="field">
              <label for="ufWhatsapp">Nomor WhatsApp</label>
              <input class="input" id="ufWhatsapp" placeholder="6281200000000" inputmode="numeric" />
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label for="ufTariff">Tarif mulai (Rp)</label>
              <input class="input" type="number" min="0" step="1000" id="ufTariff" value="${user?.tariff_start ?? 50000}" />
            </div>
            <div class="field">
              <label for="ufCallFee">Biaya panggil (Rp)</label>
              <input class="input" type="number" min="0" step="1000" id="ufCallFee" value="20000" />
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label for="ufArea">Area layanan</label>
              <input class="input" id="ufArea" placeholder="Banyuwangi Kota" />
            </div>
            <div class="field">
              <label for="ufAddress">Alamat teknisi</label>
              <input class="input" id="ufAddress" placeholder="Jl. Ahmad Yani No. 14" />
            </div>
          </div>
          <div class="field">
            <label for="ufDesc">Deskripsi keahlian</label>
            <textarea class="textarea" id="ufDesc" placeholder="Kerusakan yang ditangani…"></textarea>
          </div>
        </div>
      </form>`,
    footer: `
      <button type="button" class="btn btn-outline" data-modal-close>Batal</button>
      <button type="button" class="btn btn-primary" id="saveUser">${icon('check')} Simpan</button>`,
  });

  const form = modal.body.querySelector('#userForm');
  const errorBox = form.querySelector('#userFormError');
  const roleSelect = form.querySelector('#ufRole');
  const techFields = form.querySelector('#ufTechFields');

  roleSelect.addEventListener('change', () => {
    techFields.classList.toggle('hidden', roleSelect.value !== 'technician');
  });

  modal.footer.querySelector('[data-modal-close]').addEventListener('click', modal.close);
  modal.footer.querySelector('#saveUser').addEventListener('click', async (event) => {
    const button = event.currentTarget;
    errorBox.classList.add('hidden');
    button.disabled = true;

    const payload = {
      name: form.querySelector('#ufName').value.trim(),
      email: form.querySelector('#ufEmail').value.trim(),
      phone: form.querySelector('#ufPhone').value.trim(),
      role: roleSelect.value,
      status: form.querySelector('#ufStatus').value,
    };
    const password = form.querySelector('#ufPassword').value;
    if (password) payload.password = password;

    if (payload.role === 'technician') {
      Object.assign(payload, {
        businessName: form.querySelector('#ufBusiness').value.trim(),
        categoryId: form.querySelector('#ufCategory').value ? Number(form.querySelector('#ufCategory').value) : undefined,
        whatsappNumber: form.querySelector('#ufWhatsapp').value.trim() || undefined,
        tariffStart: Number(form.querySelector('#ufTariff').value || 0),
        callFee: Number(form.querySelector('#ufCallFee').value || 0),
        area: form.querySelector('#ufArea').value.trim() || undefined,
        address: form.querySelector('#ufAddress').value.trim() || undefined,
        description: form.querySelector('#ufDesc').value.trim() || undefined,
      });
      if (!payload.businessName || !payload.categoryId) {
        errorBox.textContent = 'Nama teknisi/usaha dan kategori wajib diisi untuk peran teknisi.';
        errorBox.classList.remove('hidden');
        button.disabled = false;
        return;
      }
    }

    try {
      if (isEdit) {
        await api(`/admin/users/${user.id}`, { method: 'PATCH', body: payload });
        toast('Data pengguna diperbarui.');
      } else {
        if (!password) {
          errorBox.textContent = 'Kata sandi wajib diisi untuk akun baru.';
          errorBox.classList.remove('hidden');
          button.disabled = false;
          return;
        }
        await api('/admin/users', { method: 'POST', body: payload });
        toast('Pengguna baru dibuat.');
      }
      modal.close();
      await loadUsers();
    } catch (error) {
      errorBox.textContent = error.message;
      errorBox.classList.remove('hidden');
      button.disabled = false;
    }
  });
}

/* ----------------------------- Admin: technicians ------------------------ */
async function adminTechnicians() {
  setView(`
    <div class="filter-bar">
      <div class="search-wrap">${icon('search')}
        <input class="input" id="techSearch" type="search" placeholder="Cari nama teknisi, area, atau email…" />
      </div>
    </div>
    <section class="panel"><div class="table-wrap" id="techTable">${loadingState()}</div></section>`);

  let timer = null;
  const search = document.getElementById('techSearch');
  search.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(loadTechnicians, 250);
  });

  async function loadTechnicians() {
    const table = document.getElementById('techTable');
    table.innerHTML = loadingState('Memuat teknisi…');
    try {
      const { technicians } = await api(`/admin/technicians?q=${encodeURIComponent(search.value.trim())}`);
      table.innerHTML = technicians.length
        ? `<table class="data">
            <thead><tr><th>Teknisi</th><th>Kategori</th><th>Tarif</th><th>Slot</th><th>Status</th><th>Unggulan</th><th style="text-align:right">Aksi</th></tr></thead>
            <tbody>${technicians
              .map(
                (tech) => `<tr>
                  <td>
                    <div class="table-main">${escapeHtml(tech.business_name)}</div>
                    <div class="table-sub">${escapeHtml(tech.owner_name)} · ${escapeHtml(tech.email)} · ${escapeHtml(tech.area)}</div>
                  </td>
                  <td>${escapeHtml(tech.category_name)}</td>
                  <td class="nowrap"><div>Mulai ${rupiah(tech.tariff_start)}</div><div class="table-sub">Panggil ${rupiah(tech.call_fee)}</div></td>
                  <td>
                    <div style="display:flex;gap:.3rem;align-items:center">
                      <input class="input" type="number" min="0" max="50" value="${tech.slots_available}" style="width:70px;padding:.3rem .45rem" data-slot-input="${tech.id}" aria-label="Slot ${escapeHtml(tech.business_name)}" />
                      <button class="btn btn-outline btn-sm" data-save-slot="${tech.id}">Simpan</button>
                    </div>
                  </td>
                  <td>${tech.is_verified ? '<span class="badge badge-green">Terverifikasi</span>' : '<span class="badge badge-red">Menunggu</span>'}</td>
                  <td>${tech.is_featured ? '<span class="badge badge-featured">Unggulan</span>' : '<span class="badge badge-gray">Reguler</span>'}</td>
                  <td>
                    <div class="row-actions">
                      <button class="btn ${tech.is_verified ? 'btn-outline' : 'btn-primary'} btn-sm" data-verify="${tech.id}" data-value="${tech.is_verified ? '0' : '1'}">
                        ${tech.is_verified ? 'Batalkan verifikasi' : 'Verifikasi'}
                      </button>
                      <button class="btn btn-outline btn-sm" data-feature="${tech.id}" data-value="${tech.is_featured ? '0' : '1'}">
                        ${tech.is_featured ? 'Jadikan reguler' : 'Jadikan unggulan'}
                      </button>
                    </div>
                  </td>
                </tr>`,
              )
              .join('')}</tbody>
          </table>`
        : emptyState('Belum ada teknisi terdaftar.', 'store');

      table.onclick = async (event) => {
        const verify = event.target.closest('[data-verify]');
        const feature = event.target.closest('[data-feature]');
        const slot = event.target.closest('[data-save-slot]');

        try {
          if (verify) {
            await api(`/admin/technicians/${verify.dataset.verify}`, {
              method: 'PATCH',
              body: { isVerified: verify.dataset.value === '1' },
            });
            toast('Status verifikasi diperbarui.');
            await loadTechnicians();
          } else if (feature) {
            await api(`/admin/technicians/${feature.dataset.feature}`, {
              method: 'PATCH',
              body: { isFeatured: feature.dataset.value === '1' },
            });
            toast('Status unggulan diperbarui.');
            await loadTechnicians();
          } else if (slot) {
            const input = table.querySelector(`[data-slot-input="${slot.dataset.saveSlot}"]`);
            await api(`/admin/technicians/${slot.dataset.saveSlot}`, {
              method: 'PATCH',
              body: { slotsAvailable: Number(input.value) },
            });
            toast('Slot harian diperbarui.');
          }
        } catch (error) {
          toast(error.message, 'error');
        }
      };
    } catch (error) {
      table.innerHTML = `<div class="form-error" style="margin:1rem">${escapeHtml(error.message)}</div>`;
    }
  }

  await loadTechnicians();
}

/* ------------------------------ Admin: categories ------------------------ */
async function adminCategories() {
  setActions(`<button class="btn btn-primary btn-sm" id="addCategoryBtn">${icon('plus')} Kategori baru</button>`);
  setView(`<section class="panel"><div class="table-wrap" id="categoryTable">${loadingState()}</div></section>`);

  async function loadCategories() {
    const table = document.getElementById('categoryTable');
    table.innerHTML = loadingState('Memuat kategori…');
    try {
      const { categories } = await api('/admin/categories');
      table.innerHTML = categories.length
        ? `<table class="data">
            <thead><tr><th>Kategori</th><th>Deskripsi</th><th>Pemilik</th><th>Teknisi</th><th>Urutan</th><th style="text-align:right">Aksi</th></tr></thead>
            <tbody>${categories
              .map(
                (category) => `<tr>
                  <td><div class="table-main">${escapeHtml(category.name)}</div><div class="table-sub">${escapeHtml(category.icon)}</div></td>
                  <td class="table-sub">${escapeHtml(category.description || '—')}</td>
                  <td class="table-sub">${category.is_private ? `Pribadi · ${escapeHtml(category.owner_name || 'teknisi')}` : '<span class="badge badge-gray">Umum</span>'}</td>
                  <td>${category.technician_count}</td>
                  <td>${category.sort_order}</td>
                  <td><div class="row-actions">
                    <button class="btn btn-outline btn-sm" data-cat-edit="${category.id}">${icon('edit')} Edit</button>
                    <button class="btn btn-danger btn-sm" data-cat-delete="${category.id}" data-name="${escapeHtml(category.name)}">${icon('trash')}</button>
                  </div></td>
                </tr>`,
              )
              .join('')}</tbody>
          </table>`
        : emptyState('Belum ada kategori.', 'filter');

      table.onclick = async (event) => {
        const edit = event.target.closest('[data-cat-edit]');
        const remove = event.target.closest('[data-cat-delete]');

        if (edit) {
          const category = categories.find((item) => item.id === Number(edit.dataset.catEdit));
          openCategoryModal(category, loadCategories);
          return;
        }
        if (remove) {
          const ok = await confirmDialog({
            title: 'Hapus kategori?',
            message: `Kategori ${remove.dataset.name} hanya bisa dihapus jika tidak dipakai teknisi.`,
          });
          if (!ok) return;
          try {
            await api(`/admin/categories/${remove.dataset.catDelete}`, { method: 'DELETE' });
            toast('Kategori dihapus.');
            state.categoriesCache = null;
            await loadCategories();
          } catch (error) {
            toast(error.message, 'error');
          }
        }
      };
    } catch (error) {
      table.innerHTML = `<div class="form-error" style="margin:1rem">${escapeHtml(error.message)}</div>`;
    }
  }

  document.getElementById('addCategoryBtn').addEventListener('click', () => openCategoryModal(null, loadCategories));
  await loadCategories();
}

function openCategoryModal(category, reload) {
  const modal = openModal({
    title: category ? 'Edit kategori' : 'Kategori baru',
    body: `<form id="categoryForm" class="form-grid">
      <div id="categoryError" class="form-error hidden" role="alert"></div>
      <div class="field">
        <label for="catName">Nama kategori</label>
        <input class="input" id="catName" value="${escapeHtml(category?.name || '')}" placeholder="Contoh: HP & Gadget" />
      </div>
      <div class="field">
        <label for="catDesc">Deskripsi singkat</label>
        <input class="input" id="catDesc" value="${escapeHtml(category?.description || '')}" placeholder="Servis ponsel, tablet, dan wearable" />
      </div>
      <div class="form-row">
        <div class="field">
          <label for="catIcon">Ikon</label>
          <select class="select" id="catIcon">
            ${['smartphone', 'laptop', 'fridge', 'tv', 'wind', 'wrench'].map((name) => `<option value="${name}" ${category?.icon === name ? 'selected' : ''}>${name}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label for="catSort">Urutan tampil</label>
          <input class="input" type="number" min="0" max="999" id="catSort" value="${category?.sort_order ?? 0}" />
        </div>
      </div>
    </form>`,
    footer: `<button type="button" class="btn btn-outline" data-modal-close>Batal</button>
      <button type="button" class="btn btn-primary" id="saveCategory">Simpan</button>`,
  });

  modal.footer.querySelector('[data-modal-close]').addEventListener('click', modal.close);
  modal.footer.querySelector('#saveCategory').addEventListener('click', async () => {
    const errorBox = modal.body.querySelector('#categoryError');
    errorBox.classList.add('hidden');
    const payload = {
      name: modal.body.querySelector('#catName').value.trim(),
      description: modal.body.querySelector('#catDesc').value.trim(),
      icon: modal.body.querySelector('#catIcon').value,
      sortOrder: Number(modal.body.querySelector('#catSort').value || 0),
    };
    try {
      if (category) {
        await api(`/admin/categories/${category.id}`, { method: 'PATCH', body: payload });
        toast('Kategori diperbarui.');
      } else {
        await api('/admin/categories', { method: 'POST', body: payload });
        toast('Kategori dibuat.');
      }
      state.categoriesCache = null;
      modal.close();
      await reload();
    } catch (error) {
      errorBox.textContent = error.message;
      errorBox.classList.remove('hidden');
    }
  });
}

/* -------------------------------- Admin: orders -------------------------- */
async function adminOrders() {
  await getCategories();
  setView(`
    <div class="filter-bar">
      <select class="select" id="adminOrderFilter">
        ${['', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled']
          .map((status) => `<option value="${status}" ${state.orderStatus === status ? 'selected' : ''}>${status ? status.replace('_', ' ') : 'Semua status'}</option>`)
          .join('')}
      </select>
    </div>
    <section class="panel"><div class="table-wrap" id="adminOrderTable">${loadingState()}</div></section>`);

  const filter = document.getElementById('adminOrderFilter');
  filter.addEventListener('change', () => {
    state.orderStatus = filter.value;
    load();
  });

  async function load() {
    const table = document.getElementById('adminOrderTable');
    table.innerHTML = loadingState('Memuat pesanan…');
    try {
      const params = state.orderStatus ? `?status=${state.orderStatus}` : '';
      const { orders } = await api(`/admin/orders${params}`);
      table.innerHTML = orders.length
        ? `<table class="data">
            <thead><tr><th>Kode</th><th>Pelanggan</th><th>Layanan</th><th>Keluhan</th><th>Total</th><th>Status</th><th>Teknisi</th></tr></thead>
            <tbody>${orders
              .map(
                (order) => `<tr>
                  <td><span class="order-code">${escapeHtml(order.code)}</span><div class="table-sub">${formatDate(order.created_at, true)}</div></td>
                  <td><div class="table-main">${escapeHtml(order.customer_name)}</div><div class="table-sub">${escapeHtml(order.customer_phone || '—')}</div></td>
                  <td><div>${escapeHtml(order.service_name || 'Servis umum')}</div><div class="table-sub">${order.service_mode === 'home' ? 'Panggil ke rumah' : 'Datang ke lokasi teknisi'}</div></td>
                  <td class="table-sub" style="max-width:220px">${escapeHtml(order.complaint || '—')}</td>
                  <td class="nowrap">${orderPriceText(order)}</td>
                  <td>${statusBadge(order.status)}</td>
                  <td class="table-sub">${escapeHtml(order.technician_name)}</td>
                </tr>`,
              )
              .join('')}</tbody>
          </table>`
        : emptyState('Belum ada pesanan pada filter ini.', 'clipboard');
    } catch (error) {
      table.innerHTML = `<div class="form-error" style="margin:1rem">${escapeHtml(error.message)}</div>`;
    }
  }

  await load();
}

/* ----------------------------- Teknisi: overview ------------------------- */
async function techOverview() {
  const [overview, profileData, ordersData] = await Promise.all([
    api('/technician/overview'),
    api('/technician/profile'),
    api('/technician/orders'),
  ]);
  const profile = profileData.profile;
  const { stats } = overview;

  setView(`
    ${!overview.isVerified ? `<div class="banner banner-warn">${icon('alert')}
      <span><strong>Profil Anda menunggu verifikasi admin.</strong>
      Selama belum diverifikasi, profil Anda belum tampil di katalog pelanggan. Lengkapi profil teknisi agar cepat disetujui.</span></div>` : ''}

    <div class="stats-grid">
      ${statCard('Total pesanan', stats.totalOrders, `${stats.pending} menunggu konfirmasi`, 'clipboard')}
      ${statCard('Sedang dikerjakan', stats.inProgress, `${stats.confirmed} sudah dikonfirmasi`, 'clock')}
      ${statCard('Pesanan selesai', stats.completed, `${stats.cancelled} dibatalkan`, 'check')}
      ${statCard('Pendapatan selesai', rupiah(stats.revenue), 'estimasi dari pesanan selesai', 'money')}
      ${statCard('Layanan aktif', `${overview.services.active}/${overview.services.total}`, 'layanan tampil di katalog', 'box')}
      ${statCard('Slot hari ini', overview.slotsAvailable, overview.isFeatured ? 'teknisi unggulan' : 'teknisi reguler', 'clock')}
    </div>

    <div class="dash-grid">
      <section class="panel">
        <div class="panel-head"><div><h3>Ketersediaan hari ini</h3><p>Pelanggan melihat angka ini secara real-time.</p></div></div>
        <div class="panel-body">
          <form id="slotQuickForm" style="display:flex;gap:.5rem;align-items:flex-end;flex-wrap:wrap">
            <div class="field" style="flex:1 1 140px">
              <label for="slotQuick">Slot tersedia</label>
              <input class="input" type="number" min="0" max="50" id="slotQuick" value="${overview.slotsAvailable}" />
              <span class="hint">0 = tampil sebagai “Slot penuh”.</span>
            </div>
            <button class="btn btn-primary" type="submit">Perbarui slot</button>
          </form>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head"><div><h3>Pesanan terbaru</h3><p>5 pesanan masuk terakhir.</p></div>
          <button class="btn btn-outline btn-sm" data-goto="tech-orders">Lihat semua</button></div>
        <div class="table-wrap">
          ${ordersData.orders.length ? `<table class="data">
            <thead><tr><th>Kode</th><th>Pelanggan</th><th>Status</th><th>Total</th></tr></thead>
            <tbody>${ordersData.orders
              .slice(0, 5)
              .map(
                (order) => `<tr>
                  <td><span class="order-code">${escapeHtml(order.code)}</span></td>
                  <td>${escapeHtml(order.customer_name)}</td>
                  <td>${statusBadge(order.status)}</td>
                  <td class="nowrap">${orderPriceText(order)}</td>
                </tr>`,
              )
              .join('')}</tbody></table>` : emptyState('Belum ada pesanan masuk.', 'clipboard')}
        </div>
      </section>
    </div>

    ${profile ? `<section class="panel" style="margin-top:1rem">
      <div class="panel-head"><div><h3>Profil publik teknisi</h3><p>Tampilan ringkas seperti di katalog pelanggan.</p></div>
        <button class="btn btn-outline btn-sm" data-goto="tech-profile">${icon('edit')} Edit profil</button></div>
      <div class="panel-body">
        <div class="tech-head">
          <div class="avatar tone-2">${icon(categoryIcon(profile.category_name))}</div>
          <div>
            <h3>${escapeHtml(profile.business_name)}</h3>
            <div class="tech-meta">
              <span class="badge">${escapeHtml(profile.category_name)}</span>
              ${overview.isVerified ? '<span class="badge badge-green">Terverifikasi</span>' : '<span class="badge badge-red">Menunggu verifikasi</span>'}
              ${overview.isFeatured ? '<span class="badge badge-featured">Unggulan</span>' : ''}
            </div>
          </div>
        </div>
        <p class="tech-desc" style="margin-top:.7rem;min-height:auto">${escapeHtml(profile.description)}</p>
        <div class="tech-facts" style="margin-top:.5rem">
          <span>${icon('pin')} ${escapeHtml(profile.address)} (${escapeHtml(profile.area)})</span>
          ${profile.maps_url ? `<a href="${escapeHtml(profile.maps_url)}" target="_blank" rel="noopener noreferrer">${icon('pin')} Lihat lokasi di Google Maps</a>` : ''}
          <span>${icon('phone')} WhatsApp ${escapeHtml(profile.whatsapp_number)}</span>
          <span>${icon('money')} Mulai ${rupiah(profile.tariff_start)} · panggil ${rupiah(profile.call_fee)}</span>
        </div>
      </div>
    </section>` : ''}`);

  document.getElementById('slotQuickForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      await api('/technician/availability', {
        method: 'PATCH',
        body: { slotsAvailable: Number(document.getElementById('slotQuick').value || 0) },
      });
      toast('Slot harian diperbarui.');
    } catch (error) {
      toast(error.message, 'error');
    }
  });
}

/* ----------------------------- Teknisi: profile -------------------------- */
async function techProfile() {
  const [profileData, categoryData] = await Promise.all([api('/technician/profile'), api('/technician/categories')]);
  const { profile } = profileData;
  const categoryOptions = categoryData.categories
    .map(
      (category) =>
        `<option value="${category.id}" ${Number(profile?.category_id) === category.id ? 'selected' : ''}>${escapeHtml(category.name)}${category.is_own ? ' (pribadi)' : ''}</option>`,
    )
    .join('');

  if (!profile) {
    setView(`<div class="banner banner-warn">${icon('alert')}
      <span><strong>Profil teknisi belum tersedia.</strong>Hubungi admin untuk melengkapi profil Anda.</span></div>`);
    return;
  }

  setView(`
    ${!profile.is_verified ? `<div class="banner banner-warn">${icon('alert')}
      <span><strong>Belum terverifikasi.</strong>Profil tidak tampil di katalog sampai admin menyetujui.</span></div>` : ''}
    <section class="panel" style="max-width:820px">
      <div class="panel-head"><div><h3>Informasi teknisi</h3><p>Semua kolom di bawah tampil di katalog pelanggan.</p></div></div>
      <div class="panel-body">
        <form id="techProfileForm" class="form-grid" novalidate>
          <div id="techProfileError" class="form-error hidden" role="alert"></div>
          <div id="techProfileSuccess" class="form-success hidden" role="status"></div>
          <div class="field">
            <label for="tpBusiness">Nama teknisi / usaha</label>
            <input class="input" id="tpBusiness" value="${escapeHtml(profile.business_name)}" placeholder="Contoh: Rizky Cell & Gadget Repair" required />
            <span class="hint">Nama yang dilihat pelanggan di katalog.</span>
          </div>
          <div class="form-row">
            <div class="field">
              <label for="tpCategory">Kategori keahlian</label>
              <div style="display:flex;gap:.4rem">
                <select class="select" id="tpCategory" required>${categoryOptions}</select>
                <button type="button" class="btn btn-outline" id="tpAddCategory" title="Buat kategori pribadi">${icon('plus')} Kategori</button>
              </div>
              <span class="hint">Kategori buatan Anda bersifat pribadi: tidak muncul di akun teknisi lain.</span>
            </div>
            <div class="field">
              <label for="tpWhatsapp">Nomor WhatsApp</label>
              <input class="input" id="tpWhatsapp" value="${escapeHtml(profile.whatsapp_number)}" inputmode="numeric" required />
              <span class="hint">Format internasional, contoh 6281200000000.</span>
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label for="tpTariff">Tarif servis mulai (Rp)</label>
              <input class="input" type="number" min="0" step="1000" id="tpTariff" value="${profile.tariff_start}" required />
            </div>
            <div class="field">
              <label for="tpCallFee">Biaya panggil ke rumah (Rp)</label>
              <input class="input" type="number" min="0" step="1000" id="tpCallFee" value="${profile.call_fee}" required />
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label for="tpArea">Area layanan</label>
              <input class="input" id="tpArea" value="${escapeHtml(profile.area)}" placeholder="Contoh: Banyuwangi Kota, Genteng" required />
              <span class="hint">Wilayah yang Anda jangkau (kecamatan/kota), minimal 3 karakter. Pelanggan memakai ini saat mencari teknisi.</span>
            </div>
            <div class="field">
              <label for="tpSlots">Slot tersedia hari ini</label>
              <input class="input" type="number" min="0" max="50" id="tpSlots" value="${profile.slots_available}" required />
            </div>
          </div>
          <div class="field">
            <label for="tpAddress">Alamat teknisi / lokasi layanan</label>
            <input class="input" id="tpAddress" value="${escapeHtml(profile.address)}" placeholder="Jl. Ahmad Yani No. 14, Banyuwangi Kota" required />
            <span class="hint">Alamat lengkap atau patokan lokasi Anda.</span>
          </div>
          <div class="field">
            <label for="tpMaps">Tautan Google Maps (opsional)</label>
            <input class="input" id="tpMaps" value="${escapeHtml(profile.maps_url || '')}" placeholder="https://maps.app.goo.gl/xxxx" />
            <span class="hint">Buka lokasi Anda di Google Maps → Bagikan → tempel tautannya di sini. Pelanggan bisa langsung membuka rute.</span>
          </div>
          <div class="field">
            <label for="tpDescription">Deskripsi keahlian</label>
            <textarea class="textarea" id="tpDescription" rows="5" required placeholder="Contoh: Ganti LCD, baterai kembung, konektor cas, dan HP mati total semua merek. Melayani servis di rumah untuk area Banyuwangi Kota, garansi servis 30 hari.">${escapeHtml(profile.description)}</textarea>
            <span class="hint">Ceritakan keahlian, merek yang biasa Anda tangani, dan jaminan/garansi agar pelanggan yakin.</span>
          </div>
          <div class="dash-actions">
            <button class="btn btn-primary" type="submit">${icon('check')} Simpan profil</button>
            <a class="btn btn-outline" href="/#katalog">Lihat katalog publik</a>
          </div>
        </form>
      </div>
    </section>`);

  const form = document.getElementById('techProfileForm');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const errorBox = form.querySelector('#techProfileError');
    const successBox = form.querySelector('#techProfileSuccess');
    errorBox.classList.add('hidden');
    successBox.classList.add('hidden');

    try {
      await api('/technician/profile', {
        method: 'PUT',
        body: {
          businessName: form.querySelector('#tpBusiness').value.trim(),
          categoryId: Number(form.querySelector('#tpCategory').value),
          description: form.querySelector('#tpDescription').value.trim(),
          address: form.querySelector('#tpAddress').value.trim(),
          mapsUrl: form.querySelector('#tpMaps').value.trim(),
          area: form.querySelector('#tpArea').value.trim(),
          whatsappNumber: form.querySelector('#tpWhatsapp').value.trim(),
          tariffStart: Number(form.querySelector('#tpTariff').value || 0),
          callFee: Number(form.querySelector('#tpCallFee').value || 0),
          slotsAvailable: Number(form.querySelector('#tpSlots').value || 0),
        },
      });
      successBox.textContent = 'Profil teknisi berhasil disimpan.';
      successBox.classList.remove('hidden');
      toast('Profil teknisi diperbarui.');
    } catch (error) {
      errorBox.textContent = error.message;
      errorBox.classList.remove('hidden');
    }
  });

  document.getElementById('tpAddCategory')?.addEventListener('click', () => {
    openNewCategoryModal((category) => {
      const select = document.getElementById('tpCategory');
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = `${category.name} (pribadi)`;
      option.selected = true;
      select.append(option);
    });
  });
}

/** Teknisi membuat kategori pribadi (tidak terlihat oleh teknisi lain). */
function openNewCategoryModal(onCreated) {
  const modal = openModal({
    title: 'Kategori keahlian baru',
    subtitle: 'Kategori ini hanya tersedia untuk akun Anda.',
    body: `<form id="newCategoryForm" class="form-grid">
      <div id="newCategoryError" class="form-error hidden" role="alert"></div>
      <div class="field">
        <label for="ncName">Nama kategori</label>
        <input class="input" id="ncName" placeholder="Contoh: Servis Tablet & iPad" />
        <span class="hint">Tulis keahlian yang belum ada di daftar, mis. “Instalasi Listrik Rumah”.</span>
      </div>
    </form>`,
    footer: `<button type="button" class="btn btn-outline" data-modal-close>Batal</button>
      <button type="button" class="btn btn-primary" id="saveNewCategory">Simpan</button>`,
  });

  modal.footer.querySelector('[data-modal-close]').addEventListener('click', modal.close);
  modal.footer.querySelector('#saveNewCategory').addEventListener('click', async () => {
    const errorBox = modal.body.querySelector('#newCategoryError');
    errorBox.classList.add('hidden');
    try {
      const { category } = await api('/technician/categories', {
        method: 'POST',
        body: { name: modal.body.querySelector('#ncName').value.trim(), icon: 'wrench' },
      });
      toast('Kategori pribadi dibuat dan dipilih.');
      modal.close();
      onCreated(category);
    } catch (error) {
      errorBox.textContent = error.message;
      errorBox.classList.remove('hidden');
    }
  });
}

/* ----------------------------- Teknisi: services ------------------------- */
async function techServices() {
  setActions(`<button class="btn btn-primary btn-sm" id="addServiceBtn">${icon('plus')} Layanan baru</button>`);
  setView(`<section class="panel"><div class="table-wrap" id="serviceTable">${loadingState()}</div></section>`);

  async function loadServices() {
    const table = document.getElementById('serviceTable');
    table.innerHTML = loadingState('Memuat layanan…');
    try {
      const { services } = await api('/technician/services');
      state.services = services;
      table.innerHTML = services.length
        ? `<table class="data">
            <thead><tr><th>Layanan</th><th>Harga</th><th>Estimasi</th><th>Status</th><th style="text-align:right">Aksi</th></tr></thead>
            <tbody>${services
              .map(
                (service) => `<tr>
                  <td><div class="table-main">${escapeHtml(service.name)}</div><div class="table-sub">${escapeHtml(service.description || '—')}</div></td>
                  <td class="nowrap">
                    <div>${servicePriceText(service)}</div>
                    <div class="table-sub">${PRICE_TYPE_LABEL[service.price_type] || 'Harga tetap'} · ${service.includes_parts ? 'termasuk komponen' : 'jasa saja'}</div>
                  </td>
                  <td class="nowrap">${service.estimated_minutes} menit</td>
                  <td>${service.is_active ? '<span class="badge badge-green">Aktif</span>' : '<span class="badge badge-gray">Nonaktif</span>'}</td>
                  <td><div class="row-actions">
                    <button class="btn btn-outline btn-sm" data-service-edit="${service.id}">${icon('edit')} Edit</button>
                    <button class="btn btn-danger btn-sm" data-service-delete="${service.id}" data-name="${escapeHtml(service.name)}">${icon('trash')}</button>
                  </div></td>
                </tr>`,
              )
              .join('')}</tbody>
          </table>`
        : emptyState('Belum ada layanan. Tambahkan layanan agar pelanggan tahu tarif Anda.', 'box');

      table.onclick = async (event) => {
        const edit = event.target.closest('[data-service-edit]');
        if (edit) {
          openServiceModal(services.find((item) => item.id === Number(edit.dataset.serviceEdit)), loadServices);
          return;
        }
        const remove = event.target.closest('[data-service-delete]');
        if (remove) {
          const ok = await confirmDialog({
            title: 'Hapus layanan?',
            message: `Layanan ${remove.dataset.name} akan dihapus dari katalog Anda.`,
          });
          if (!ok) return;
          try {
            await api(`/technician/services/${remove.dataset.serviceDelete}`, { method: 'DELETE' });
            toast('Layanan dihapus.');
            await loadServices();
          } catch (error) {
            toast(error.message, 'error');
          }
        }
      };
    } catch (error) {
      table.innerHTML = `<div class="form-error" style="margin:1rem">${escapeHtml(error.message)}</div>`;
    }
  }

  document.getElementById('addServiceBtn').addEventListener('click', () => openServiceModal(null, loadServices));
  await loadServices();
}

function openServiceModal(service, reload) {
  const modal = openModal({
    title: service ? 'Edit layanan' : 'Layanan baru',
    subtitle: 'Pelanggan memilih layanan ini saat memesan.',
    body: `<form id="serviceForm" class="form-grid">
      <div id="serviceError" class="form-error hidden" role="alert"></div>
      <div class="field">
        <label for="svName">Nama layanan</label>
        <input class="input" id="svName" value="${escapeHtml(service?.name || '')}" placeholder="Ganti LCD / Touchscreen" />
      </div>
      <div class="field">
        <label for="svDesc">Deskripsi</label>
        <input class="input" id="svDesc" value="${escapeHtml(service?.description || '')}" placeholder="Garansi pemasangan 30 hari" />
      </div>
      <div class="field">
        <label for="svPriceType">Tipe harga</label>
        <select class="select" id="svPriceType">
          <option value="fixed" ${(service?.price_type ?? 'fixed') === 'fixed' ? 'selected' : ''}>Harga tetap — pelanggan langsung tahu biayanya</option>
          <option value="starting" ${service?.price_type === 'starting' ? 'selected' : ''}>Mulai dari — harga final setelah pengecekan</option>
          <option value="quote" ${service?.price_type === 'quote' ? 'selected' : ''}>Sesuai diagnosa — biaya belum bisa ditentukan</option>
        </select>
        <span class="hint">Gunakan “sesuai diagnosa” untuk servis yang biayanya bergantung pada kerusakan.</span>
      </div>
      <div class="form-row">
        <div class="field">
          <label for="svPrice">Harga (Rp)</label>
          <input class="input" type="number" min="0" step="5000" id="svPrice" value="${service?.price ?? 100000}" />
          <span class="hint" id="svPriceHint">Tampil sebagai “Mulai Rp …” di katalog.</span>
        </div>
        <div class="field">
          <label for="svIncludesParts">Cakupan harga</label>
          <select class="select" id="svIncludesParts">
            <option value="0" ${service && service.includes_parts ? '' : 'selected'}>Jasa saja (komponen terpisah)</option>
            <option value="1" ${service?.includes_parts ? 'selected' : ''}>Termasuk komponen / spare part</option>
          </select>
        </div>
      </div>
      <div class="field">
        <label for="svMinutes">Estimasi pengerjaan (menit)</label>
        <input class="input" type="number" min="10" max="2880" step="10" id="svMinutes" value="${service?.estimated_minutes ?? 60}" />
      </div>
      <label class="checkbox">
        <input type="checkbox" id="svActive" ${service ? (service.is_active ? 'checked' : '') : 'checked'} />
        <span>Tampilkan layanan ini di katalog</span>
      </label>
    </form>`,
    footer: `<button type="button" class="btn btn-outline" data-modal-close>Batal</button>
      <button type="button" class="btn btn-primary" id="saveService">Simpan</button>`,
  });

  const priceTypeSelect = modal.body.querySelector('#svPriceType');
  const priceInput = modal.body.querySelector('#svPrice');
  const priceHint = modal.body.querySelector('#svPriceHint');

  function syncPriceField() {
    const quote = priceTypeSelect.value === 'quote';
    priceInput.disabled = quote;
    priceInput.style.opacity = quote ? '.5' : '1';
    priceHint.textContent = quote
      ? 'Harga tidak ditampilkan; pelanggan melihat “Sesuai diagnosa”.'
      : priceTypeSelect.value === 'starting'
        ? 'Tampil sebagai “Mulai Rp …” di katalog.'
        : 'Harga tetap yang tampil di katalog.';
  }
  priceTypeSelect.addEventListener('change', syncPriceField);
  syncPriceField();

  modal.footer.querySelector('[data-modal-close]').addEventListener('click', modal.close);
  modal.footer.querySelector('#saveService').addEventListener('click', async () => {
    const errorBox = modal.body.querySelector('#serviceError');
    errorBox.classList.add('hidden');
    const payload = {
      name: modal.body.querySelector('#svName').value.trim(),
      description: modal.body.querySelector('#svDesc').value.trim(),
      priceType: priceTypeSelect.value,
      includesParts: modal.body.querySelector('#svIncludesParts').value === '1',
      price: Number(modal.body.querySelector('#svPrice').value || 0),
      estimatedMinutes: Number(modal.body.querySelector('#svMinutes').value || 60),
      isActive: modal.body.querySelector('#svActive').checked,
    };
    try {
      if (service) {
        await api(`/technician/services/${service.id}`, { method: 'PUT', body: payload });
        toast('Layanan diperbarui.');
      } else {
        await api('/technician/services', { method: 'POST', body: payload });
        toast('Layanan ditambahkan.');
      }
      modal.close();
      await reload();
    } catch (error) {
      errorBox.textContent = error.message;
      errorBox.classList.remove('hidden');
    }
  });
}

/* ------------------------------ Teknisi: orders -------------------------- */
async function techOrders() {
  setView(`
    <div class="filter-bar">
      <select class="select" id="techOrderFilter">
        ${['', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled']
          .map((status) => `<option value="${status}" ${state.orderStatus === status ? 'selected' : ''}>${status ? status.replace('_', ' ') : 'Semua status'}</option>`)
          .join('')}
      </select>
    </div>
    <section class="panel"><div class="table-wrap" id="techOrderTable">${loadingState()}</div></section>`);

  const filter = document.getElementById('techOrderFilter');
  filter.addEventListener('change', () => {
    state.orderStatus = filter.value;
    load();
  });

  async function load() {
    const table = document.getElementById('techOrderTable');
    table.innerHTML = loadingState('Memuat pesanan…');
    try {
      const params = state.orderStatus ? `?status=${state.orderStatus}` : '';
      const { orders } = await api(`/technician/orders${params}`);
      table.innerHTML = orders.length
        ? `<table class="data">
            <thead><tr><th>Kode</th><th>Pelanggan</th><th>Layanan</th><th>Keluhan</th><th>Total</th><th>Status</th><th style="text-align:right">Aksi</th></tr></thead>
            <tbody>${orderRows(orders, 'technician')}</tbody>
          </table>`
        : emptyState('Belum ada pesanan pada filter ini.', 'clipboard');
      await bindOrderActions(table, load, 'technician');
    } catch (error) {
      table.innerHTML = `<div class="form-error" style="margin:1rem">${escapeHtml(error.message)}</div>`;
    }
  }

  await load();
}

/* ------------------------------ Pelanggan: orders ------------------------ */
async function customerOrders() {
  setView(`
    <div class="banner banner-info">${icon('info')}
      <span><strong>Alur pesanan</strong>Setelah memesan dari katalog, lanjutkan chat WhatsApp dengan teknisi. Status pesanan diperbarui teknisi setelah konfirmasi.</span>
    </div>
    <section class="panel"><div class="table-wrap" id="customerOrderTable">${loadingState()}</div></section>`);

  async function load() {
    const table = document.getElementById('customerOrderTable');
    table.innerHTML = loadingState('Memuat pesanan…');
    try {
      const { orders } = await api('/orders/mine');
      if (!orders.length) {
        table.innerHTML = `<div class="empty">${icon('clipboard')}
          <p>Belum ada pesanan.</p>
          <a class="btn btn-primary btn-sm" href="/#katalog">Cari teknisi</a></div>`;
        return;
      }
      table.innerHTML = `<table class="data">
        <thead><tr><th>Kode</th><th>Teknisi</th><th>Layanan</th><th>Keluhan</th><th>Total</th><th>Status</th><th style="text-align:right">Aksi</th></tr></thead>
        <tbody>${orderRows(orders, 'customer')}</tbody></table>`;
      await bindOrderActions(table, load, 'customer');
    } catch (error) {
      table.innerHTML = `<div class="form-error" style="margin:1rem">${escapeHtml(error.message)}</div>`;
    }
  }

  await load();
}

/* ------------------------------- Akun (semua peran) ---------------------- */
async function accountProfile() {
  setView(`
    <div class="dash-grid">
      <section class="panel">
        <div class="panel-head"><div><h3>Data akun</h3><p>Nama dipakai pada pesan pesanan ke teknisi.</p></div></div>
        <div class="panel-body">
          <form id="accountForm" class="form-grid">
            <div id="accountError" class="form-error hidden" role="alert"></div>
            <div id="accountSuccess" class="form-success hidden" role="status"></div>
            <div class="field">
              <label for="acName">Nama lengkap</label>
              <input class="input" id="acName" value="${escapeHtml(state.user.name)}" required />
            </div>
            <div class="field">
              <label for="acPhone">Nomor telepon</label>
              <input class="input" id="acPhone" value="${escapeHtml(state.user.phone)}" required />
            </div>
            <div class="field">
              <label>Email</label>
              <input class="input" value="${escapeHtml(state.user.email)}" disabled />
              <span class="hint">Email hanya dapat diubah oleh admin.</span>
            </div>
            <div class="field">
              <label>Peran</label>
              <div>${roleBadge(state.user.role)}</div>
            </div>
            <div><button class="btn btn-primary" type="submit">${icon('check')} Simpan data</button></div>
          </form>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head"><div><h3>Ubah kata sandi</h3><p>Gunakan minimal 8 karakter yang sulit ditebak.</p></div></div>
        <div class="panel-body">
          <form id="passwordForm" class="form-grid">
            <div id="passwordError" class="form-error hidden" role="alert"></div>
            <div id="passwordSuccess" class="form-success hidden" role="status"></div>
            <div class="field">
              <label for="pwCurrent">Kata sandi saat ini</label>
              <input class="input" type="password" id="pwCurrent" autocomplete="current-password" required />
            </div>
            <div class="field">
              <label for="pwNew">Kata sandi baru</label>
              <input class="input" type="password" id="pwNew" autocomplete="new-password" required />
            </div>
            <div><button class="btn btn-outline" type="submit">${icon('lock')} Perbarui kata sandi</button></div>
          </form>
        </div>
      </section>
    </div>`);

  const accountForm = document.getElementById('accountForm');
  accountForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const errorBox = accountForm.querySelector('#accountError');
    const successBox = accountForm.querySelector('#accountSuccess');
    errorBox.classList.add('hidden');
    successBox.classList.add('hidden');
    try {
      const { user } = await api('/profile', {
        method: 'PUT',
        body: { name: accountForm.querySelector('#acName').value.trim(), phone: accountForm.querySelector('#acPhone').value.trim() },
      });
      state.user = { ...state.user, ...user };
      renderShell();
      successBox.textContent = 'Data akun diperbarui.';
      successBox.classList.remove('hidden');
      toast('Data akun diperbarui.');
    } catch (error) {
      errorBox.textContent = error.message;
      errorBox.classList.remove('hidden');
    }
  });

  const passwordForm = document.getElementById('passwordForm');
  passwordForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const errorBox = passwordForm.querySelector('#passwordError');
    const successBox = passwordForm.querySelector('#passwordSuccess');
    errorBox.classList.add('hidden');
    successBox.classList.add('hidden');
    try {
      await api('/profile/password', {
        method: 'PUT',
        body: {
          currentPassword: passwordForm.querySelector('#pwCurrent').value,
          newPassword: passwordForm.querySelector('#pwNew').value,
        },
      });
      passwordForm.reset();
      successBox.textContent = 'Kata sandi berhasil diubah.';
      successBox.classList.remove('hidden');
      toast('Kata sandi diperbarui.');
    } catch (error) {
      errorBox.textContent = error.message;
      errorBox.classList.remove('hidden');
    }
  });
}

/* ---------------------------------- Router ------------------------------- */
const VIEWS = {
  overview: () => (state.user.role === 'admin' ? adminOverview() : techOverview()),
  users: adminUsers,
  technicians: adminTechnicians,
  categories: adminCategories,
  orders: () => (state.user.role === 'customer' ? customerOrders() : adminOrders()),
  'tech-profile': techProfile,
  services: techServices,
  'tech-orders': techOrders,
  profile: accountProfile,
};

async function boot() {
  try {
    const session = await api('/auth/me');
    state.user = session.user;
    state.technician = session.technician;
  } catch {
    window.location.replace('/login?expired=1');
    return;
  }

  renderShell();
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {
      /* abaikan */
    }
    window.location.replace('/');
  });

  window.addEventListener('hashchange', route);
  await route();

  if (new URLSearchParams(window.location.search).get('welcome')) {
    toast('Akun teknisi dibuat. Profil menunggu verifikasi admin.', 'info');
  }
}

boot();
