// My Meetings page logic (API-driven, no demo bootstrapping)
(function() {
  let MEETINGS = [];

  function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message') || document.getElementById('toastMessage');
    if (toast && toastMessage) {
      toastMessage.textContent = message;
      toast.className = `fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 flex items-center ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`;
      toast.classList.remove('hidden');
      setTimeout(() => toast.classList.add('hidden'), 2500);
    } else {
      console.log(`[${type}] ${message}`);
    }
  }

  function formatDateRange(startISO, endISO) {
    const s = new Date(startISO), e = new Date(endISO);
    const opts = { weekday: 'short', month: 'short', day: 'numeric' };
    const time = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${s.toLocaleDateString([], opts)}, ${time(s)} - ${time(e)}`;
  }

  function isPast(meeting) {
    return new Date(meeting.end) < new Date();
  }

  function canJoin(meeting) {
    const now = new Date();
    const start = new Date(meeting.start);
    const end = new Date(meeting.end);
    return now >= new Date(start.getTime() - 15*60*1000) && now <= end; // 15 min early until end
  }

  function card(m) {
    const isVirtual = !!m.link;
    const joinable = isVirtual && canJoin(m);
    return `
      <div class="bg-white rounded-lg shadow p-4">
        <div class="flex items-start">
          <div class="flex-shrink-0 h-12 w-12 rounded-full ${m.createdBy && m.createdBy !== 'user' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'} flex items-center justify-center">
            <i class="fas ${isVirtual ? 'fa-video' : 'fa-users'}"></i>
          </div>
          <div class="ml-4 flex-1">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 class="text-md font-medium text-gray-900">${m.title}</h3>
                <div class="mt-1 flex flex-wrap items-center text-sm text-gray-500 gap-2">
                  <span class="flex items-center"><i class="far fa-clock mr-1"></i> ${formatDateRange(m.start, m.end)}</span>
                  <span class="hidden sm:inline">•</span>
                  <span class="flex items-center"><i class="fas ${isVirtual ? 'fa-video' : 'fa-map-marker-alt'} mr-1"></i> ${m.location || (isVirtual ? 'Online' : '')}</span>
                </div>
              </div>
              <div class="mt-3 sm:mt-0 flex gap-2">
                ${isVirtual ? `<button data-id="${m.id}" class="join-btn px-3 py-1.5 ${joinable ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'} text-sm rounded-md"><i class="fas fa-sign-in-alt mr-1"></i>Join</button>` : ''}
                <button data-id="${m.id}" class="details-btn px-3 py-1.5 bg-white border border-gray-300 text-sm rounded-md hover:bg-gray-50"><i class="fas fa-ellipsis-h"></i></button>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  }

  function renderLists() {
    const me = (window.userData && window.userData.email) || null;
    const mine = MEETINGS.filter(m => {
      if (!me) return true; // until auth is fully wired, show all
      return (Array.isArray(m.attendees) && m.attendees.includes(me)) || (m.organizer && m.organizer === me);
    });

    const upcoming = mine.filter(m => !isPast(m)).sort((a,b) => new Date(a.start) - new Date(b.start));
    const past = mine.filter(m => isPast(m)).sort((a,b) => new Date(b.end) - new Date(a.end));

    const upcomingEl = document.getElementById('upcomingList');
    const pastEl = document.getElementById('pastList');

    if (upcomingEl) upcomingEl.innerHTML = upcoming.length ? upcoming.map(card).join('') : `<div class="text-center text-gray-500 py-6">No upcoming meetings</div>`;
    if (pastEl) pastEl.innerHTML = past.length ? past.map(card).join('') : `<div class="text-center text-gray-500 py-6">No past meetings</div>`;

    // Bind actions
    document.querySelectorAll('.join-btn').forEach(btn => btn.addEventListener('click', onJoin));
    document.querySelectorAll('.details-btn').forEach(btn => btn.addEventListener('click', onDetails));
  }

  function onJoin(e) {
    const id = e.currentTarget.getAttribute('data-id');
    const m = MEETINGS.find(x => String(x.id) === String(id));
    if (!m) return;
    if (m.link && canJoin(m)) {
      window.open(m.link, '_blank');
      showToast('Opening meeting link...', 'success');
    } else if (m.link) {
      showToast('This meeting is not joinable right now', 'error');
    } else {
      showToast('No online link. Check location details.', 'error');
    }
  }

  function onDetails(e) {
    const id = e.currentTarget.getAttribute('data-id');
    const m = MEETINGS.find(x => String(x.id) === String(id));
    if (!m) return;
    const modal = document.getElementById('meetingDetailsModal');
    if (!modal) return;
    modal.querySelector('#detailsTitle').textContent = m.title || '';
    modal.querySelector('#detailsTime').textContent = formatDateRange(m.start, m.end);
    modal.querySelector('#detailsLocation').textContent = m.location || (m.link ? 'Online' : '-');
    modal.querySelector('#detailsOrganizer').textContent = m.organizer || (m.createdBy || '-');
    modal.querySelector('#detailsDescription').textContent = m.description || '-';

    const joinBtn = document.getElementById('detailsJoinBtn');
    if (joinBtn) {
      joinBtn.disabled = !(m.link && canJoin(m));
      joinBtn.classList.toggle('opacity-50', joinBtn.disabled);
      joinBtn.onclick = () => {
        if (m.link && canJoin(m)) {
          window.open(m.link, '_blank');
          showToast('Opening meeting link...', 'success');
          closeDetails();
        } else {
          showToast('This meeting is not joinable right now', 'error');
        }
      };
    }

    modal.classList.remove('hidden');
    if (!modal.classList.contains('flex')) modal.classList.add('flex');
    document.body.classList.add('overflow-hidden');
  }

  function closeDetails() {
    const modal = document.getElementById('meetingDetailsModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      document.body.classList.remove('overflow-hidden');
    }
  }

  function setupTabs() {
    const tabAll = document.getElementById('tabAll');
    const tabUpcoming = document.getElementById('tabUpcoming');
    const tabPast = document.getElementById('tabPast');
    const allSection = document.getElementById('allSection');
    const upSection = document.getElementById('upcomingSection');
    const pastSection = document.getElementById('pastSection');

    function select(tab) {
      [tabAll, tabUpcoming, tabPast].forEach(el => el?.classList.remove('border-blue-500', 'text-blue-600'));
      [allSection, upSection, pastSection].forEach(el => el?.classList.add('hidden'));
      switch (tab) {
        case 'all':
          tabAll?.classList.add('border-blue-500', 'text-blue-600');
          allSection?.classList.remove('hidden');
          break;
        case 'upcoming':
          tabUpcoming?.classList.add('border-blue-500', 'text-blue-600');
          upSection?.classList.remove('hidden');
          break;
        case 'past':
          tabPast?.classList.add('border-blue-500', 'text-blue-600');
          pastSection?.classList.remove('hidden');
          break;
      }
    }

    tabAll?.addEventListener('click', () => select('all'));
    tabUpcoming?.addEventListener('click', () => select('upcoming'));
    tabPast?.addEventListener('click', () => select('past'));

    select('upcoming');
  }

  async function fetchMeetings() {
    try {
      const res = await fetch('/api/user/meetings', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load meetings');
      const data = await res.json();
      if (Array.isArray(data)) {
        MEETINGS = data;
      } else if (Array.isArray(data.items)) {
        MEETINGS = data.items;
      } else {
        MEETINGS = [];
      }
    } catch (e) {
      console.warn('Meetings fetch error:', e);
      MEETINGS = [];
      showToast('Unable to load meetings', 'error');
    }
  }

  document.addEventListener('DOMContentLoaded', async function() {
    setupTabs();
    await fetchMeetings();
    renderLists();

    document.getElementById('closeDetailsModal')?.addEventListener('click', closeDetails);
    document.getElementById('meetingDetailsModal')?.addEventListener('click', (e) => { if (e.target.id === 'meetingDetailsModal') closeDetails(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDetails(); });
  });
})();
