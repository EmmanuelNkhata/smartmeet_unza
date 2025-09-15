// Settings page interactions
(function(){
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

  function openModal(id){ const m = document.getElementById(id); if (m) { m.classList.remove('hidden'); m.classList.add('flex'); document.body.classList.add('overflow-hidden'); } }
  function closeModal(id){ const m = document.getElementById(id); if (m) { m.classList.add('hidden'); m.classList.remove('flex'); document.body.classList.remove('overflow-hidden'); } }

  document.addEventListener('DOMContentLoaded', function(){
    // Card click bindings
    document.getElementById('cardProfile')?.addEventListener('click', () => openModal('profileModal'));
    document.getElementById('cardPassword')?.addEventListener('click', () => openModal('passwordModal'));
    document.getElementById('cardNotifications')?.addEventListener('click', () => openModal('notificationsModal'));

    // Generic close buttons
    document.querySelectorAll('[data-close]')?.forEach(btn => {
      btn.addEventListener('click', () => closeModal(btn.getAttribute('data-close')));
    });

    // Overlay click to close
    ['profileModal','passwordModal','notificationsModal'].forEach(id => {
      const el = document.getElementById(id);
      el?.addEventListener('click', (e) => { if (e.target.id === id) closeModal(id); });
    });

    // Profile form submission
    document.getElementById('profileForm')?.addEventListener('submit', function(e){
      e.preventDefault();
      // Simulate save
      closeModal('profileModal');
      showToast('Profile information updated', 'success');
      // Update header name if changed
      const fn = document.getElementById('firstName')?.value || '';
      const ln = document.getElementById('lastName')?.value || '';
      if (window.updateUserData) window.updateUserData({ name: `${fn} ${ln}`.trim() });
    });

    // Password form submission
    document.getElementById('passwordForm')?.addEventListener('submit', function(e){
      e.preventDefault();
      closeModal('passwordModal');
      showToast('Password updated successfully', 'success');
    });

    // Notifications form submission
    document.getElementById('notificationsForm')?.addEventListener('submit', function(e){
      e.preventDefault();
      closeModal('notificationsModal');
      showToast('Notification preferences saved', 'success');
    });

    // Profile photo change preview
    document.getElementById('profilePhotoInput')?.addEventListener('change', function(e){
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(evt){
        const img = document.getElementById('profileImage');
        const initials = document.getElementById('profileInitials');
        if (img) { img.src = evt.target.result; img.classList.remove('hidden'); }
        if (initials) initials.classList.add('hidden');
        showToast('Profile photo updated', 'success');
      };
      reader.readAsDataURL(file);
    });
  });
})();
