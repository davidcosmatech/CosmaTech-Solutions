document.addEventListener('DOMContentLoaded', async () => {
  // Check if user is authenticated
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = 'signin.html';
    return;
  }

  // UI Element Bindings
  const navUserName = document.getElementById('navUserName');
  const profileCardName = document.getElementById('profileCardName');
  const profileCardEmail = document.getElementById('profileCardEmail');
  const fullNameInput = document.getElementById('fullName');
  const phoneInput = document.getElementById('phone');
  const profileUpdateForm = document.getElementById('profileUpdateForm');
  const saveProfileBtn = document.getElementById('saveProfileBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const quotesContainer = document.getElementById('quotesContainer');
  const quoteCountBadge = document.getElementById('quoteCountBadge');
  const successAlert = document.getElementById('successAlert');
  const successMessage = document.getElementById('successMessage');
  const errorAlert = document.getElementById('errorAlert');
  const errorMessage = document.getElementById('errorMessage');

  // Load local quotes helper
  function getUserQuotes(email) {
    const quotes = localStorage.getItem('cosmatech_quotes_' + email.toLowerCase());
    return quotes ? JSON.parse(quotes) : [];
  }

  // Populate user data
  function populateUserData(user) {
    const meta = user.user_metadata || {};
    const fullName = meta.full_name || 'Client';
    const phone = meta.phone || '';
    const email = user.email;

    const firstName = fullName.split(' ')[0];
    if (navUserName) navUserName.innerText = firstName;
    if (profileCardName) profileCardName.innerText = fullName;
    if (profileCardEmail) profileCardEmail.innerText = email;
    if (fullNameInput) fullNameInput.value = fullName;
    if (phoneInput) phoneInput.value = phone;

    // Load and render quotes
    const quotes = getUserQuotes(email);
    renderQuotes(quotes);
  }

  // Render quote list helper
  function renderQuotes(quotes) {
    if (quoteCountBadge) {
      quoteCountBadge.innerText = `${quotes.length} Total`;
    }

    if (!quotesContainer) return;

    if (quotes.length === 0) {
      quotesContainer.innerHTML = `
        <div class="empty-state">
          <i class="far fa-folder-open"></i>
          <h4>No quote requests found</h4>
          <p>When you submit a quote request from the Services page, it will display here.</p>
        </div>
      `;
      return;
    }

    // Generate quotes markup (newest first)
    quotesContainer.innerHTML = quotes.map((q) => {
      const dateStr = new Date(q.date).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const detailsHTML = q.details && q.details.length > 0
        ? q.details.map(item => `• ${item}`).join('<br>')
        : 'No options selected';

      return `
        <div class="quote-card animate-on-scroll show">
          <div class="quote-header">
            <div>
              <span class="quote-type">${q.type}</span>
              <div class="quote-date" style="margin-top: 4px;">Submitted: ${dateStr}</div>
            </div>
            <span class="quote-status-badge status-pending">
              <i class="far fa-clock"></i> Pending
            </span>
          </div>
          <div class="quote-details-list">
            ${detailsHTML}
          </div>
          <div class="quote-footer">
            <span style="font-size: 0.85rem; color: var(--text-muted);">Estimates are subject to full inspection</span>
            <span class="quote-price-tag">${q.price}</span>
          </div>
        </div>
      `;
    }).reverse().join('');
  }

  // Notification helpers
  function showSuccess(msg) {
    if (successAlert && successMessage) {
      successMessage.innerText = msg;
      successAlert.style.display = 'flex';
      if (errorAlert) errorAlert.style.display = 'none';
      
      setTimeout(() => {
        successAlert.style.display = 'none';
      }, 5000);
    }
  }

  function showError(msg) {
    if (errorAlert && errorMessage) {
      errorMessage.innerText = msg;
      errorAlert.style.display = 'flex';
      if (successAlert) successAlert.style.display = 'none';
    }
  }

  // Handle Profile Updates
  if (profileUpdateForm) {
    profileUpdateForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const nameVal = fullNameInput.value.trim();
      const phoneVal = phoneInput.value.trim();

      if (!nameVal) {
        showError('Full Name is required.');
        fullNameInput.focus();
        return;
      }

      if (!phoneVal) {
        showError('Phone Number is required.');
        phoneInput.focus();
        return;
      }

      saveProfileBtn.classList.add('btn-loading');
      saveProfileBtn.disabled = true;

      try {
        const { data, error } = await supabaseClient.auth.updateUser({
          data: {
            full_name: nameVal,
            phone: phoneVal
          }
        });

        if (error) throw error;

        saveProfileBtn.classList.remove('btn-loading');
        saveProfileBtn.disabled = false;
        
        showSuccess('Profile updated successfully!');
        populateUserData(data.user);
      } catch (err) {
        saveProfileBtn.classList.remove('btn-loading');
        saveProfileBtn.disabled = false;
        showError(err.message);
      }
    });
  }

  // Handle Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
        window.location.href = 'signin.html';
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // Initialize view
  populateUserData(session.user);

  // Interactive radial mouse glow inside glass-cards
  document.querySelectorAll('.glass-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });
});
