// Room Booking Module - API-driven (no demo/localStorage)
(function() {
  // Elements
  const newBookingBtn = document.getElementById('newBookingBtn');
  const bookingModal = document.getElementById('bookingModal');
  const bookingForm = document.getElementById('bookingForm');
  const cancelBookingBtn = document.getElementById('cancelBooking');

  const bookingTitle = document.getElementById('bookingTitle');
  const bookingVenue = document.getElementById('bookingVenue');
  const bookingDate = document.getElementById('bookingDate');
  const startTimeSel = document.getElementById('startTime');
  const endTimeSel = document.getElementById('endTime');
  const bookingDescription = document.getElementById('bookingDescription');

  const viewModal = document.getElementById('viewBookingModal');
  const viewTitle = document.getElementById('viewTitle');
  const viewVenue = document.getElementById('viewVenue');
  const viewDate = document.getElementById('viewDate');
  const viewTime = document.getElementById('viewTime');
  const viewDescription = document.getElementById('viewDescription');
  const viewBookedBy = document.getElementById('viewBookedBy');
  const viewBookingId = document.getElementById('viewBookingId');
  const bookingStatus = document.getElementById('bookingStatus');
  const bookingActions = document.getElementById('bookingActions');

  const tbody = document.getElementById('bookingsTbody');

  // State
  let bookings = [];
  let editingId = null;
  let submitBtnEl = null;

  // API helpers
  async function apiGet(url){
    const email = (localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail') || '');
    const headers = email ? { 'x-user-email': email } : {};
    const r = await fetch(url, { credentials: 'include', headers });
    if(!r.ok) throw new Error('HTTP '+r.status); return r.json();
  }
  async function apiPost(url, body){
    const email = (localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail') || '');
    const headers = { 'Content-Type':'application/json' };
    if (email) headers['x-user-email'] = email;
    const r = await fetch(url, { method:'POST', credentials:'include', headers, body: JSON.stringify(body)});
    if(!r.ok) throw new Error('HTTP '+r.status); return r.json();
  }
  async function apiPatch(url, body){
    const email = (localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail') || '');
    const headers = { 'Content-Type':'application/json' };
    if (email) headers['x-user-email'] = email;
    const r = await fetch(url, { method:'PATCH', credentials:'include', headers, body: JSON.stringify(body)});
    if(!r.ok) throw new Error('HTTP '+r.status); return r.json();
  }
  async function apiDelete(url){
    const email = (localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail') || '');
    const headers = email ? { 'x-user-email': email } : {};
    const r = await fetch(url, { method:'DELETE', credentials:'include', headers });
    if(!r.ok) throw new Error('HTTP '+r.status); return true;
  }

  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-md text-white font-medium shadow-lg ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // Dates/times
  function setMinDateToday() {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth()+1).padStart(2,'0');
    const d = String(today.getDate()).padStart(2,'0');
    bookingDate.min = `${y}-${m}-${d}`;
  }

  function minutesFromTime(t) { const [h,m] = t.split(':').map(Number); return h*60 + m; }

  function populateTimeSelects() {
    // Available hours 14:00 - 19:00 in 30-min increments (adjust to your policy)
    const times = [];
    for (let h=14; h<=19; h++) {
      for (let m of [0,30]) {
        if (h===19 && m>0) continue;
        const hh = String(h).padStart(2,'0');
        const mm = String(m).padStart(2,'0');
        times.push(`${hh}:${mm}`);
      }
    }
    startTimeSel.innerHTML = '';
    endTimeSel.innerHTML = '';
    times.forEach(t => {
      const opt1 = document.createElement('option'); opt1.value = t; opt1.textContent = t; startTimeSel.appendChild(opt1);
      const opt2 = document.createElement('option'); opt2.value = t; opt2.textContent = t; endTimeSel.appendChild(opt2);
    });
    startTimeSel.value = '14:00';
    adjustEndTimeOptions();
  }

  function adjustEndTimeOptions() {
    const start = startTimeSel.value;
    const startMin = minutesFromTime(start);
    Array.from(endTimeSel.options).forEach(opt => {
      const m = minutesFromTime(opt.value);
      opt.disabled = m <= startMin;
    });
    const firstValid = Array.from(endTimeSel.options).find(o => !o.disabled);
    if (firstValid) endTimeSel.value = firstValid.value;
  }

  function statusBadgeClass(st){
    if (!st) return 'bg-gray-100 text-gray-800';
    const s = st.toLowerCase();
    if (s === 'approved') return 'bg-green-100 text-green-800';
    if (s === 'pending') return 'bg-yellow-100 text-yellow-800';
    if (s === 'cancelled' || s === 'rejected') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  }

  function fmtDateHuman(d){ try{ return new Date(d + 'T00:00:00').toLocaleDateString(); } catch(e){ return d; } }

  function renderTable(){
    if (!tbody) return;
    if (!Array.isArray(bookings) || bookings.length === 0){
      tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-10 text-center text-gray-500">No bookings yet</td></tr>`;
      return;
    }
    const sorted = bookings.slice().sort((a,b)=>{
      const ad = (a.date||'') + ' ' + (a.startTime||'00:00');
      const bd = (b.date||'') + ' ' + (b.startTime||'00:00');
      return bd.localeCompare(ad);
    });
    tbody.innerHTML = sorted.map(b=>{
      const dateHuman = fmtDateHuman(b.date);
      const statusClass = statusBadgeClass(b.status);
      const statusLabel = (b.status||'').charAt(0).toUpperCase() + (b.status||'').slice(1);
      let actions = `<button class="text-blue-600 hover:text-blue-900 mr-3" data-action="view" data-id="${b.id}">View</button>`;
      if (b.status && b.status.toLowerCase() === 'pending'){
        actions += `<button class="text-green-600 hover:text-green-800 mr-3" data-action="approve" data-id="${b.id}">Approve</button>`;
        actions += `<button class="text-red-600 hover:text-red-800 mr-3" data-action="reject" data-id="${b.id}">Reject</button>`;
      }
      actions += `<button class="text-blue-600 hover:text-blue-900 mr-3" data-action="edit" data-id="${b.id}">Edit</button>`;
      actions += `<button class="text-red-600 hover:text-red-800" data-action="delete" data-id="${b.id}">Delete</button>`;
      const time = `${b.startTime||''} - ${b.endTime||''}`.trim();
      return `
        <tr>
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${dateHuman}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${time}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${b.venue||''}</td>
          <td class="px-6 py-4 text-sm text-gray-500">${b.title||''}</td>
          <td class="px-6 py-4 whitespace-nowrap"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">${statusLabel}</span></td>
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">${actions}</td>
        </tr>`;
    }).join('');
  }

  function openBookingModal(dateStr) {
    if (dateStr) bookingDate.value = dateStr;
    bookingModal.classList.remove('hidden');
  }
  function closeBookingModal() {
    bookingModal.classList.add('hidden');
    bookingForm.reset();
    populateTimeSelects();
    editingId = null;
    if (submitBtnEl) {
      submitBtnEl.textContent = 'Submit Booking Request';
      setSubmitEnabled(false);
    }
  }

  function openViewModal(booking) {
    viewTitle.textContent = booking.title || '';
    viewVenue.textContent = booking.venue || '';
    viewDate.textContent = fmtDateHuman(booking.date);
    viewTime.textContent = `${booking.startTime || ''} - ${booking.endTime || ''}`;
    viewDescription.textContent = booking.description || '-';
    viewBookedBy.textContent = booking.bookedBy || '-';
    viewBookingId.textContent = booking.id || '';

    const st = (booking.status||'').toLowerCase();
    let badge = 'bg-gray-100 text-gray-800';
    if (st === 'approved') badge = 'bg-green-100 text-green-800';
    else if (st === 'pending') badge = 'bg-yellow-100 text-yellow-800';
    else if (st === 'cancelled' || st === 'rejected') badge = 'bg-red-100 text-red-800';
    bookingStatus.className = `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${badge}`;
    bookingStatus.textContent = st ? (st.charAt(0).toUpperCase()+st.slice(1)) : '—';

    bookingActions.innerHTML = '';
    if (st === 'pending') {
      bookingActions.appendChild(actionBtn('Approve','bg-green-600 hover:bg-green-700 text-white', () => updateStatus(booking.id, 'approved')));
      bookingActions.appendChild(actionBtn('Reject','bg-red-600 hover:bg-red-700 text-white', () => updateStatus(booking.id, 'rejected')));
    }
    bookingActions.appendChild(actionBtn('Edit','bg-blue-600 hover:bg-blue-700 text-white', () => { closeViewModal(); openEditBooking(booking); }));
    bookingActions.appendChild(actionBtn('Delete','bg-red-600 hover:bg-red-700 text-white', () => deleteBooking(booking.id)));

    viewModal.classList.remove('hidden');
  }
  function closeViewModal() { viewModal.classList.add('hidden'); bookingActions.innerHTML = ''; }

  function actionBtn(text, classes, handler) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `inline-flex justify-center rounded-md py-2 px-4 text-sm font-medium ${classes}`;
    b.textContent = text;
    b.addEventListener('click', handler);
    return b;
  }

  function setSubmitEnabled(enabled){
    if (!submitBtnEl) return;
    submitBtnEl.disabled = !enabled;
    submitBtnEl.classList.toggle('opacity-50', !enabled);
    submitBtnEl.classList.toggle('cursor-not-allowed', !enabled);
  }

  function validateBooking({ title, venue, date, startTime, endTime }) {
    if (!title || title.trim().length < 3) return 'Please enter a valid title';
    if (!venue) return 'Please select a venue';
    if (!date) return 'Please select a date';
    if (!startTime || !endTime) return 'Please select start and end time';
    if (minutesFromTime(endTime) <= minutesFromTime(startTime)) return 'End time must be after start time';
    return '';
  }

  function buildPayloadFromForm(){
    return {
      title: (bookingTitle.value||'').trim(),
      venue: bookingVenue.value,
      date: bookingDate.value,
      startTime: startTimeSel.value,
      endTime: endTimeSel.value,
      description: (bookingDescription.value||'').trim(),
      type: 'physical'
    };
  }

  async function fetchBookings(){
    try {
      const data = await apiGet('/api/admin/venues/bookings');
      bookings = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : []);
    } catch (e) {
      bookings = [];
      showToast('Unable to load bookings', 'error');
    }
    renderTable();
  }

  async function createBooking(){
    const payload = buildPayloadFromForm();
    const err = validateBooking(payload);
    if (err){ showToast(err, 'error'); return; }
    try {
      // include identity for audit/auto-approval purposes
      payload.bookedBy = (localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail') || '');
      payload.role = (localStorage.getItem('userRole') || sessionStorage.getItem('userRole') || 'admin');
      await apiPost('/api/admin/venues/bookings', payload);
      closeBookingModal();
      await fetchBookings();
      showToast('Booking created', 'success');
    } catch (e) {
      showToast('Failed to create booking', 'error');
    }
  }

  async function updateStatus(id, status){
    try {
      await apiPatch(`/api/admin/venues/bookings/${encodeURIComponent(id)}`, { status });
      closeViewModal();
      await fetchBookings();
      showToast(`Booking ${status}`, 'success');
    } catch (e) {
      showToast('Failed to update status', 'error');
    }
  }

  async function deleteBooking(id){
    if (!confirm('Delete this booking? This action cannot be undone.')) return;
    try {
      await apiDelete(`/api/admin/venues/bookings/${encodeURIComponent(id)}`);
      closeViewModal();
      await fetchBookings();
      showToast('Booking deleted', 'success');
    } catch (e) {
      showToast('Failed to delete booking', 'error');
    }
  }

  function openEditBooking(booking){
    editingId = booking.id;
    bookingTitle.value = booking.title || '';
    bookingVenue.value = booking.venue || '';
    bookingDate.value = booking.date || '';
    startTimeSel.value = booking.startTime || '14:00';
    adjustEndTimeOptions();
    endTimeSel.value = booking.endTime || startTimeSel.value;
    bookingDescription.value = booking.description || '';
    if (submitBtnEl) submitBtnEl.textContent = 'Save Changes';
    bookingModal.classList.remove('hidden');
  }

  async function saveEdit(){
    if (!editingId) return;
    const payload = buildPayloadFromForm();
    const err = validateBooking(payload);
    if (err){ showToast(err, 'error'); return; }
    try {
      await apiPatch(`/api/admin/venues/bookings/${encodeURIComponent(editingId)}`, payload);
      closeBookingModal();
      await fetchBookings();
      showToast('Booking updated', 'success');
    } catch (e) {
      showToast('Failed to update booking', 'error');
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    setMinDateToday();
    populateTimeSelects();
    submitBtnEl = bookingForm ? bookingForm.querySelector('button[type="submit"]') : null;
    if (submitBtnEl) {
      submitBtnEl.disabled = true;
      submitBtnEl.classList.add('opacity-50','cursor-not-allowed');
    }

    // Enable submit when required fields present
    function updateSubmitState(){
      const payload = buildPayloadFromForm();
      const err = validateBooking({ ...payload, startTime: startTimeSel.value, endTime: endTimeSel.value });
      setSubmitEnabled(!err);
    }

    bookingTitle?.addEventListener('input', updateSubmitState);
    bookingVenue?.addEventListener('change', updateSubmitState);
    bookingDate?.addEventListener('change', updateSubmitState);
    startTimeSel?.addEventListener('change', ()=>{ adjustEndTimeOptions(); updateSubmitState(); });
    endTimeSel?.addEventListener('change', updateSubmitState);

    newBookingBtn?.addEventListener('click', () => openBookingModal());
    cancelBookingBtn?.addEventListener('click', closeBookingModal);

    // Close modals on outside click
    window.addEventListener('click', (e) => {
      if (e.target === bookingModal) closeBookingModal();
      if (e.target === viewModal) closeViewModal();
    });

    bookingForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (editingId) await saveEdit(); else await createBooking();
    });

    // Table actions
    tbody?.addEventListener('click', function(e){
      const btn = e.target.closest('button[data-action]'); if (!btn) return;
      const id = btn.getAttribute('data-id');
      const action = btn.getAttribute('data-action');
      const booking = bookings.find(x => String(x.id) === String(id));
      if (!booking) return;
      if (action === 'view') openViewModal(booking);
      if (action === 'approve') updateStatus(id, 'approved');
      if (action === 'reject') updateStatus(id, 'rejected');
      if (action === 'edit') openEditBooking(booking);
      if (action === 'delete') deleteBooking(id);
    });

    // Initial fetch
    fetchBookings();
  });
})();
