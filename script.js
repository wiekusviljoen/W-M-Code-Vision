const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

menuToggle?.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});

navLinks?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  });
});

document.querySelector('#year').textContent = new Date().getFullYear();

const contactForm = document.querySelector('#contact-form');
const formNote = document.querySelector('#form-note');
contactForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!contactForm.reportValidity()) return;
  const data = new FormData(contactForm);
  const enquiry = [
    `Name: ${data.get('name')}`,
    `Email: ${data.get('email')}`,
    `Service: ${data.get('service')}`,
    `Project: ${data.get('message') || 'Not provided'}`
  ].join('\n');
  formNote.textContent = 'Your enquiry is ready to connect. The form is currently a demo and does not send or store submissions. Configure your business email or a secure form endpoint before publishing.';
  formNote.setAttribute('role', 'status');
  console.info('Demo enquiry preview (not sent):\n' + enquiry);
});
