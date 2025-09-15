// Clean Feedback Form Handling (no demo data)

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('feedbackForm');
  if (!form) return;

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const comments = document.getElementById('comments');
    const anon = document.getElementById('anonymous');
    const error = document.getElementById('comments-error');
    if (!comments.value.trim()){
      error && error.classList.remove('hidden');
      comments.classList.add('border-red-500');
      return;
    }
    error && error.classList.add('hidden');
    comments.classList.remove('border-red-500');

    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    const submitSpinner = document.getElementById('submitSpinner');
    submitBtn.disabled = true; submitText.textContent = 'Submitting...'; submitSpinner.classList.remove('hidden');

    const payload = {
      comments: comments.value.trim(),
      anonymous: !!(anon && anon.checked),
      user: (window.userData && window.userData.email) || null,
      createdAt: new Date().toISOString()
    };

    try {
      // Send to backend (placeholder endpoint)
      const res = await fetch('/api/feedback', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Failed');
      comments.value=''; if (anon) anon.checked=false;
      showInlineToast('Thank you for your feedback!', 'success');
    } catch(err){
      showInlineToast('Failed to submit. Please try again.', 'error');
    } finally {
      submitBtn.disabled = false; submitText.textContent = 'Submit Feedback'; submitSpinner.classList.add('hidden');
    }
  });
});

function showInlineToast(message, type){
  let box = document.getElementById('inlineToast');
  if (!box){
    box = document.createElement('div');
    box.id = 'inlineToast';
    box.className = 'fixed top-4 right-4 px-4 py-2 rounded-md text-white shadow-md z-50';
    document.body.appendChild(box);
  }
  box.textContent = message;
  box.className = `fixed top-4 right-4 px-4 py-2 rounded-md text-white shadow-md z-50 ${type==='success'?'bg-green-600':'bg-red-600'}`;
  box.classList.remove('hidden');
  setTimeout(()=> box.classList.add('hidden'), 3000);
}
