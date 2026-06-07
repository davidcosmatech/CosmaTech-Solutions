document.addEventListener('DOMContentLoaded', async () => {
  // Check if user is already authenticated and redirect to dashboard
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    window.location.href = 'dashboard.html';
    return;
  }

  const signUpForm = document.getElementById('signUpForm');
  const firstNameInput = document.getElementById('firstName');
  const lastNameInput = document.getElementById('lastName');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const termsInput = document.getElementById('terms');
  const errorAlert = document.getElementById('errorAlert');
  const errorMessage = document.getElementById('errorMessage');
  const submitBtn = document.getElementById('submitBtn');
  const termsLink = document.getElementById('termsLink');

  // Password Toggles
  const passwordToggle = document.getElementById('passwordToggle');
  const toggleIcon = document.getElementById('toggleIcon');
  if (passwordToggle) {
    passwordToggle.addEventListener('click', () => {
      const isPassword = passwordInput.getAttribute('type') === 'password';
      passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
      toggleIcon.className = isPassword ? 'far fa-eye-slash' : 'far fa-eye';
    });
  }

  const confirmPasswordToggle = document.getElementById('confirmPasswordToggle');
  const confirmToggleIcon = document.getElementById('confirmToggleIcon');
  if (confirmPasswordToggle) {
    confirmPasswordToggle.addEventListener('click', () => {
      const isPassword = confirmPasswordInput.getAttribute('type') === 'password';
      confirmPasswordInput.setAttribute('type', isPassword ? 'text' : 'password');
      confirmToggleIcon.className = isPassword ? 'far fa-eye-slash' : 'far fa-eye';
    });
  }

  // Show/Hide error helper
  function showError(msg) {
    errorMessage.innerText = msg;
    errorAlert.style.display = 'flex';
  }

  function hideError() {
    errorAlert.style.display = 'none';
  }

  // Email validation helper
  function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.toLowerCase());
  }

  // Phone validation helper
  function isValidPhone(phone) {
    const clean = phone.replace(/[^0-9+]/g, '');
    return clean.length >= 7 && clean.length <= 15;
  }

  // Handle Form Submit
  if (signUpForm) {
    signUpForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideError();

      const firstName = firstNameInput.value.trim();
      const lastName = lastNameInput.value.trim();
      const email = emailInput.value.trim();
      const phone = phoneInput.value.trim();
      const password = passwordInput.value;
      const confirmPassword = confirmPasswordInput.value;
      const termsChecked = termsInput.checked;

      // Validations
      if (!firstName) {
        showError('First Name is required.');
        firstNameInput.focus();
        return;
      }

      if (!lastName) {
        showError('Last Name is required.');
        lastNameInput.focus();
        return;
      }

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

      if (!phone) {
        showError('Phone Number is required.');
        phoneInput.focus();
        return;
      }

      if (!isValidPhone(phone)) {
        showError('Please enter a valid phone number.');
        phoneInput.focus();
        return;
      }

      if (!password) {
        showError('Password is required.');
        passwordInput.focus();
        return;
      }

      if (password.length < 8) {
        showError('Password must be at least 8 characters long.');
        passwordInput.focus();
        return;
      }

      if (password !== confirmPassword) {
        showError('Passwords do not match.');
        confirmPasswordInput.focus();
        return;
      }

      if (!termsChecked) {
        showError('You must agree to the Terms & Conditions.');
        return;
      }

      // Enable Loading State
      submitBtn.classList.add('btn-loading');
      submitBtn.disabled = true;

      const fullName = `${firstName} ${lastName}`;

      try {
        const { data, error } = await supabaseClient.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phone
            }
          }
        });

        if (error) {
          throw error;
        }

        // Handle auto-signin vs email confirmation flow
        if (data.session) {
          window.location.href = 'dashboard.html';
        } else {
          alert('Account created! Please check your email for the confirmation link to activate your account.');
          window.location.href = 'signin.html';
        }

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
