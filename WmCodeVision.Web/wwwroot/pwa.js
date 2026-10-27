(() => {
  // Resolve against this script, so virtual directories and subfolder hosting work.
  const base = new URL('.', document.currentScript.src);
  if ('serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(new URL('service-worker.js', base), {
        scope: base.href, updateViaCache: 'none'
      }).catch(error => console.warn('Offline support could not be enabled.', error));
    });
  }
  // Never imply that a contact message has been sent while offline.
  const form = document.querySelector('form');
  if (form) {
    const notice = document.createElement('p');
    notice.setAttribute('role', 'status');
    notice.textContent = 'You are offline. Reconnect before sending your enquiry. Videos also need an internet connection.';
    form.prepend(notice);
    const update = () => { notice.hidden = navigator.onLine; };
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    update();
    form.addEventListener('submit', event => {
      if (!navigator.onLine) { event.preventDefault(); notice.hidden = false; }
    });
  }
})();
