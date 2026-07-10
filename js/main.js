// Contact form handler
document.getElementById('contactForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const CONTACT_URL = 'https://images-broker-a0gbdfc0g3fqa8d2.israelcentral-01.azurewebsites.net/api/contact/send';
  const success = document.getElementById('formSuccess');
  const submitBtn = this.querySelector('button[type="submit"]');

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const message = document.getElementById('message').value.trim();

  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';

  try {
    const response = await fetch(CONTACT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, message }),
    });

    const data = await response.json();

    if (response.ok) {
      success.textContent = "Thanks! We'll get back to you soon.";
      success.classList.remove('d-none', 'alert-danger');
      success.classList.add('alert-success');
      this.reset();
    } else {
      success.textContent = data.error || 'Something went wrong. Please try again.';
      success.classList.remove('d-none', 'alert-success');
      success.classList.add('alert-danger');
    }
  } catch (err) {
    success.textContent = 'Network error. Please try again later.';
    success.classList.remove('d-none', 'alert-success');
    success.classList.add('alert-danger');
  }

  submitBtn.disabled = false;
  submitBtn.textContent = 'Send Message';

  setTimeout(function () {
    success.classList.add('d-none');
  }, 5000);
});

// Close mobile nav on link click
document.querySelectorAll('.navbar-nav .nav-link').forEach(function (link) {
  link.addEventListener('click', function () {
    const navCollapse = document.getElementById('navLinks');
    const bsCollapse = bootstrap.Collapse.getInstance(navCollapse);
    if (bsCollapse) {
      bsCollapse.hide();
    }
  });
});
