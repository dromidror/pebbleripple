// Contact form handler
document.getElementById('contactForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const success = document.getElementById('formSuccess');
  success.classList.remove('d-none');

  this.reset();

  setTimeout(function () {
    success.classList.add('d-none');
  }, 4000);
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
