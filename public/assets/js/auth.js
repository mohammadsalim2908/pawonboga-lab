import { api, escapeHtml, icon, toast } from './ui.js';

/* ------------------------------ Login ----------------------------------- */
const loginForm = document.getElementById('loginForm');

if (loginForm) {
  const errorBox = document.getElementById('loginError');
  const submit = document.getElementById('loginSubmit');

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBox.classList.add('hidden');
    submit.disabled = true;
    submit.innerHTML = '<span class="spinner" style="border-color:rgba(255,255,255,.45);border-top-color:#fff"></span> Memproses…';

    try {
      await api('/auth/login', {
        method: 'POST',
        body: {
          email: loginForm.email.value.trim(),
          password: loginForm.password.value,
        },
      });
      const params = new URLSearchParams(window.location.search);
      const next = params.get('next');
      window.location.replace(next && next.startsWith('/') ? next : '/dashboard');
    } catch (error) {
      errorBox.textContent = error.message;
      errorBox.classList.remove('hidden');
      submit.disabled = false;
      submit.textContent = 'Masuk';
    }
  });
}

/* ------------------------------ Register -------------------------------- */
const registerForm = document.getElementById('registerForm');

if (registerForm) {
  const roleInput = document.getElementById('role');
  const technicianFields = document.getElementById('technicianFields');
  const errorBox = document.getElementById('registerError');
  const submit = document.getElementById('registerSubmit');
  const tabs = {
    customer: document.getElementById('tabCustomer'),
    technician: document.getElementById('tabTechnician'),
  };

  async function loadCategories() {
    try {
      const data = await api('/catalog/categories');
      document.getElementById('categoryId').innerHTML =
        '<option value="">Pilih kategori…</option>' +
        data.categories
          .map((category) => `<option value="${category.id}">${escapeHtml(category.name)}</option>`)
          .join('');
    } catch {
      document.getElementById('categoryId').innerHTML = '<option value="">Gagal memuat kategori</option>';
    }
  }

  function setRole(role) {
    roleInput.value = role;
    technicianFields.classList.toggle('hidden', role !== 'technician');
    Object.entries(tabs).forEach(([key, button]) => {
      button.classList.toggle('active', key === role);
      button.setAttribute('aria-selected', String(key === role));
    });
    technicianFields.querySelectorAll('input, select, textarea').forEach((field) => {
      field.required = role === 'technician' && ['businessName', 'categoryId', 'area', 'address', 'whatsappNumber'].includes(field.id);
    });
  }

  tabs.customer.addEventListener('click', () => setRole('customer'));
  tabs.technician.addEventListener('click', () => setRole('technician'));
  setRole(new URLSearchParams(window.location.search).get('role') === 'technician' ? 'technician' : 'customer');
  loadCategories();

  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBox.classList.add('hidden');

    const role = roleInput.value;
    const payload = {
      name: registerForm.name.value.trim(),
      email: registerForm.email.value.trim(),
      phone: registerForm.phone.value.trim(),
      password: registerForm.password.value,
      role,
    };

    if (role === 'technician') {
      Object.assign(payload, {
        businessName: registerForm.businessName.value.trim(),
        categoryId: registerForm.categoryId.value ? Number(registerForm.categoryId.value) : undefined,
        address: registerForm.address.value.trim(),
        area: registerForm.area.value.trim(),
        whatsappNumber: registerForm.whatsappNumber.value.trim(),
        tariffStart: Number(registerForm.tariffStart.value || 0),
        callFee: Number(registerForm.callFee.value || 0),
        description: registerForm.description.value.trim(),
      });
      if (!payload.businessName || !payload.categoryId || !payload.address || !payload.area || !payload.whatsappNumber) {
        errorBox.textContent = 'Nama bengkel, kategori, alamat, area, dan nomor WhatsApp wajib diisi.';
        errorBox.classList.remove('hidden');
        return;
      }
    }

    submit.disabled = true;
    submit.innerHTML = '<span class="spinner" style="border-color:rgba(255,255,255,.45);border-top-color:#fff"></span> Mendaftar…';

    try {
      await api('/auth/register', { method: 'POST', body: payload });
      window.location.replace(role === 'technician' ? '/dashboard?welcome=1' : '/dashboard');
    } catch (error) {
      errorBox.textContent = error.message;
      errorBox.classList.remove('hidden');
      submit.disabled = false;
      submit.textContent = 'Daftar';
    }
  });
}

/* Notifikasi dari halaman lain (mis. sesi berakhir). */
if (new URLSearchParams(window.location.search).get('expired')) {
  toast('Sesi Anda berakhir. Silakan masuk kembali.', 'info');
}

console.debug(icon('check') ? 'TekniKita auth siap.' : '');
