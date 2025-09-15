// SmartMeet UNZA - Common UI for Notifications and Profile
(function(){
  const NOTIFS_KEY = 'sm_notifs_v1';
  const ROLE_KEY = 'sm_role_v1';

  function loadNotifs(){
    try { return JSON.parse(localStorage.getItem(NOTIFS_KEY) || '[]'); }
    catch(e){ return []; }
  }
  function saveNotifs(list){ localStorage.setItem(NOTIFS_KEY, JSON.stringify(list)); }

  function renderNotifUI(){
    const itemsEl = document.getElementById('notifItems');
    const badge = document.getElementById('notifCountBadge');
    const list = loadNotifs();
    const unread = list.filter(n => n.unread).length;
    if (badge){
      if (unread > 0){ badge.textContent = String(unread); badge.classList.remove('hidden'); }
      else { badge.classList.add('hidden'); }
    }
    if (itemsEl){
      if (list.length === 0){
        itemsEl.innerHTML = '<div class="px-4 py-6 text-center text-sm text-gray-500">No notifications</div>';
      } else {
        itemsEl.innerHTML = list.map(n => `
          <div class="px-4 py-3 ${n.unread ? 'bg-blue-50' : ''} border-b border-gray-100">
            <div class="flex items-start">
              <div class="flex-shrink-0 pt-1"><div class="w-2 h-2 ${n.unread ? 'bg-blue-500' : 'bg-transparent'} rounded-full"></div></div>
              <div class="ml-3">
                <p class="text-sm ${n.unread ? 'font-medium text-gray-900' : 'text-gray-800'}">${escapeHtml(n.text||'Notification')}</p>
                <p class="text-xs text-gray-400 mt-1">${n.timestamp ? new Date(n.timestamp).toLocaleString() : ''}</p>
              </div>
            </div>
          </div>`).join('');
      }
    }
  }

  function markAllRead(){ const list = loadNotifs(); list.forEach(n => n.unread = false); saveNotifs(list); renderNotifUI(); }
  function addNotification(text){
    const list = loadNotifs();
    list.unshift({ id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), text, timestamp: new Date().toISOString(), unread: true });
    saveNotifs(list);
    renderNotifUI();
  }

  function wireNotifications(){
    const markBtn = document.getElementById('markAllReadBtn');
    markBtn && markBtn.addEventListener('click', (e)=>{ e.preventDefault(); markAllRead(); });

    const notifBtn = document.getElementById('notifBellBtn');
    const notifMenu = document.getElementById('notifMenu');
    if (notifBtn && notifMenu){
      // Mobile toggle on click
      notifBtn.addEventListener('click', (e)=>{
        if (window.innerWidth <= 768){ e.preventDefault(); notifMenu.classList.toggle('hidden'); }
      });
      // Close on outside click (mobile only)
      document.addEventListener('click', (e)=>{
        if (!notifMenu.classList.contains('hidden') && window.innerWidth <= 768){
          const within = notifMenu.contains(e.target) || notifBtn.contains(e.target);
          if (!within) notifMenu.classList.add('hidden');
        }
      });
    }
  }

  function restoreProfilePhoto(){
    try {
      const img = document.getElementById('profileImage');
      const def = document.getElementById('defaultAvatar');
      const saved = localStorage.getItem('sm_profile_photo');
      if (img && saved){ img.src = saved; img.classList.remove('hidden'); if (def) def.classList.add('hidden'); }
    } catch(e){}
  }

  function wirePhotoUpload(){
    const input = document.getElementById('profilePhotoUpload');
    const img = document.getElementById('profileImage');
    const def = document.getElementById('defaultAvatar');
    if (!input) return;
    input.addEventListener('change', (e)=>{
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev)=>{
        if (img){ img.src = ev.target.result; img.classList.remove('hidden'); }
        if (def) def.classList.add('hidden');
        try { localStorage.setItem('sm_profile_photo', ev.target.result); } catch(err){}
      };
      reader.readAsDataURL(file);
    });
  }

  function wireProfile(){
    const profileBtn = document.getElementById('profileBtn');
    const profileMenu = document.getElementById('profileMenu');
    const signOutBtn = document.getElementById('signOutBtn');
    if (profileBtn && profileMenu){
      function toggle(show){
        const s = show !== undefined ? show : profileMenu.classList.contains('hidden');
        if (s){ profileMenu.classList.remove('hidden'); profileBtn.setAttribute('aria-expanded','true'); }
        else { profileMenu.classList.add('hidden'); profileBtn.setAttribute('aria-expanded','false'); }
      }
      profileBtn.addEventListener('click', (e)=>{ e.stopPropagation(); toggle(); });
      document.addEventListener('click', (e)=>{ if (!profileMenu.classList.contains('hidden')){ const within = profileMenu.contains(e.target) || profileBtn.contains(e.target); if (!within) toggle(false); } });
      document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') toggle(false); });
    }
    if (signOutBtn){
      signOutBtn.addEventListener('click', ()=>{
        try { localStorage.removeItem(ROLE_KEY); } catch(e){}
        // Optionally clear other app state keys here
        try {
          const here = window.location.pathname;
          if (/\/admin\//.test(here)) window.location.href = '../public/index.html';
          else window.location.href = '/public/index.html';
        } catch(e){ window.location.href = '../public/index.html'; }
      });
    }
    restoreProfilePhoto();
    wirePhotoUpload();
  }

  function escapeHtml(str){
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function init(){
    renderNotifUI();
    wireNotifications();
    wireProfile();
  }

  // Expose helpers
  window.SMCommonUI = { init, renderNotifUI, addNotification, markAllRead };

  document.addEventListener('DOMContentLoaded', init);
})();

// Smooth page transitions and link prefetching across admin pages
(function(){
  try {
    var STYLE_ID = 'sm-smooth-style';
    if (!document.getElementById(STYLE_ID)){
      var st = document.createElement('style');
      st.id = STYLE_ID;
      st.textContent = 'body.page-fade{opacity:0} body.page-fade.page-fade-in{opacity:1;transition:opacity .18s ease} body.page-fade.is-leaving{opacity:0}';
      document.head.appendChild(st);
    }

    document.addEventListener('DOMContentLoaded', function(){
      document.body.classList.add('page-fade');
      requestAnimationFrame(function(){ document.body.classList.add('page-fade-in'); });
    });

    function sameOrigin(href){ try{ var u=new URL(href, window.location.href); return u.origin===window.location.origin; }catch(e){ return false; } }
    function isAnchor(a){ var href=(a && a.getAttribute('href'))||''; return href.startsWith('#'); }

    document.addEventListener('click', function(e){
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      if (a.target && a.target !== '' && a.target !== '_self') return;
      if (a.hasAttribute('download')) return;
      var href = a.getAttribute('href') || '';
      if (!href || isAnchor(a) || !sameOrigin(href)) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      document.body.classList.add('is-leaving');
      setTimeout(function(){ window.location.href = href; }, 180);
    });

    var prefetched = new Set();
    function prefetch(href){
      try{
        if (prefetched.has(href)) return;
        var l = document.createElement('link'); l.rel = 'prefetch'; l.href = href; document.head.appendChild(l);
        prefetched.add(href);
      } catch(e){}
    }
    document.addEventListener('mouseover', function(e){
      var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
      var href = a.getAttribute('href') || '';
      if (sameOrigin(href) && !isAnchor(a)) prefetch(href);
    });
    document.addEventListener('touchstart', function(e){
      var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
      var href = a.getAttribute('href') || '';
      if (sameOrigin(href) && !isAnchor(a)) prefetch(href);
    }, { passive: true });
  } catch(e){}
})();
