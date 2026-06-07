document.addEventListener('DOMContentLoaded', async () => {
  // Check if user is already authenticated and redirect to dashboard
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    window.location.href = 'dashboard.html';
    return;
  }

  const signInForm = document.getElementById('signInForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const passwordToggle = document.getElementById('passwordToggle');
  const toggleIcon = document.getElementById('toggleIcon');
  const errorAlert = document.getElementById('errorAlert');
  const errorMessage = document.getElementById('errorMessage');
  const submitBtn = document.getElementById('submitBtn');
  const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');

  // Toggle Password Visibility
  if (passwordToggle) {
    passwordToggle.addEventListener('click', () => {
      const isPassword = passwordInput.getAttribute('type') === 'password';
      passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
      toggleIcon.className = isPassword ? 'far fa-eye-slash' : 'far fa-eye';
    });
  }

  // Show error helper
  function showError(msg) {
    errorMessage.innerText = msg;
    errorAlert.style.display = 'flex';
  }

  // Hide error helper
  function hideError() {
    errorAlert.style.display = 'none';
  }

  // Email validation helper
  function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.toLowerCase());
  }

  // Forgot Password trigger
  if (forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();
      if (!email) {
        showError('Please enter your email address to reset password.');
        emailInput.focus();
        return;
      }
      if (!isValidEmail(email)) {
        showError('Please enter a valid email address.');
        emailInput.focus();
        return;
      }

      try {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/signin.html',
        });
        if (error) throw error;
        alert('Password recovery link has been sent to your email.');
      } catch (err) {
        showError(err.message);
      }
    });
  }

  // Handle Signin Submission
  if (signInForm) {
    signInForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideError();

      const email = emailInput.value.trim();
      const password = passwordInput.value;

      // Validation
      if (!email) {
        showError('Email Address is required.');
        emailInput.focus();
        return;
      }

      if (!isValidEmail(email)) {
        showError('Please enter a valid email address.');
        emailInput.focus();
        return;
      }

      if (!password) {
        showError('Password is required.');
        passwordInput.focus();
        return;
      }

      // Enable Loading State
      submitBtn.classList.add('btn-loading');
      submitBtn.disabled = true;

      try {
        const { error } = await supabaseClient.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          throw error;
        }

        // Redirect to dashboard on success
        window.location.href = 'dashboard.html';

      } catch (err) {
        submitBtn.classList.remove('btn-loading');
        submitBtn.disabled = false;
        showError(err.message);
      }
    });
  }

  // Interactive radial mouse glow inside glass-card
  const card = document.querySelector('.glass-card');
  if (card) {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  }
});
