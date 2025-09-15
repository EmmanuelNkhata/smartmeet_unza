// Documents page logic (read-only)
(function(){
  
  const TYPE_LABEL = {
    agenda: 'Agenda',
    minutes: 'Minutes',
    presentation: 'Presentation',
    report: 'Report',
    other: 'Other'
  };

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

  
  function iconFor(type){
    switch(type){
      case 'agenda': return { cls: 'fa-file-word text-blue-600', bg: 'bg-blue-100' };
      case 'minutes': return { cls: 'fa-file-lines text-indigo-600', bg: 'bg-indigo-100' };
      case 'presentation': return { cls: 'fa-file-powerpoint text-orange-600', bg: 'bg-orange-100' };
      case 'report': return { cls: 'fa-file-pdf text-red-600', bg: 'bg-red-100' };
      default: return { cls: 'fa-file text-gray-600', bg: 'bg-gray-100' };
    }
  }

  function relativeTime(iso){
    const d = new Date(iso), now = new Date();
    const diff = Math.floor((now - d) / (1000*60*60*24));
    if (diff <= 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return `${diff} days ago`;
  }

  function render(docs){
    const grid = document.getElementById('documentsGrid');
    if (!grid) return;

    const q = (document.getElementById('docSearch')?.value || '').toLowerCase();
    const type = document.getElementById('docFilter')?.value || 'all';

    const all = Array.isArray(docs) ? docs : [];
    const filtered = all.filter(doc => {
      const matchesType = type === 'all' || doc.type === type;
      const matchesQuery = !q || doc.title.toLowerCase().includes(q);
      return matchesType && matchesQuery;
    });

    if (filtered.length === 0) {
      grid.innerHTML = '<div class="text-center text-gray-500 py-8">No documents found</div>';
      return;
    }

    grid.innerHTML = filtered.map(doc => {
      const icon = iconFor(doc.type);
      const badgeLabel = TYPE_LABEL[doc.type] || TYPE_LABEL.other;
      return `
        <div class="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow">
          <div class="p-4">
            <div class="flex items-start">
              <div class="flex-shrink-0 ${icon.bg} p-3 rounded-lg">
                <i class="fas ${icon.cls} text-2xl"></i>
              </div>
              <div class="ml-4 flex-1">
                <h3 class="text-sm font-medium text-gray-900 truncate">${doc.title}</h3>
                <p class="text-sm text-gray-500">Added ${relativeTime(doc.addedAt)}</p>
                <div class="mt-2 flex items-center text-xs text-gray-500">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${icon.bg} ${icon.cls.replace('fa-', 'text-')}">
                    ${badgeLabel}
                  </span>
                  <span class="ml-2">• ${doc.size}</span>
                </div>
              </div>
            </div>
            <div class="mt-4 flex justify-between items-center">
              <div class="flex gap-2">
                <a href="${doc.url}" target="_blank" rel="noopener" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  <i class="fas fa-eye mr-1"></i> View
                </a>
                <a href="${doc.url}" download class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  <i class="fas fa-download mr-1"></i> Download
                </a>
              </div>
              <div class="flex space-x-2"></div>
            </div>
          </div>
        </div>`;
    }).join('');
  }

  async function fetchDocuments(){
    try {
      const res = await fetch('/api/user/documents', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load documents');
      const data = await res.json();
      return Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : []);
    } catch (e) {
      console.warn('Documents fetch error:', e);
      showToast('Unable to load documents', 'error');
      return [];
    }
  }

  document.addEventListener('DOMContentLoaded', async function(){
    let docs = await fetchDocuments();
    render(docs);

    const search = document.getElementById('docSearch');
    const filter = document.getElementById('docFilter');
    const rerender = async () => { const d = await fetchDocuments(); render(d); };
    search?.addEventListener('input', rerender);
    filter?.addEventListener('change', rerender);
  });
})();
