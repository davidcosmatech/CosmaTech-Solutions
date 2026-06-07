document.addEventListener('DOMContentLoaded', () => {
  const isRo = document.documentElement.lang === 'ro' || window.location.pathname.includes('/ro/');

  // ==========================================
  // 1. Password Hashing Helper (SHA-256)
  // ==========================================
  async function hashPassword(password) {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // ==========================================
  // 2. Database layer (localStorage wrapper)
  // ==========================================
  const LocalDatabase = {
    getUsers() {
      const users = localStorage.getItem('cosmatech_users');
      return users ? JSON.parse(users) : {};
    },
    saveUsers(users) {
      localStorage.setItem('cosmatech_users', JSON.stringify(users));
    },
    async registerUser(name, email, password, phone) {
      const users = this.getUsers();
      const lowerEmail = email.toLowerCase().trim();
      if (users[lowerEmail]) {
        throw new Error(isRo ? 'Acest email este deja înregistrat.' : 'This email is already registered.');
      }
      const passwordHash = await hashPassword(password);
      users[lowerEmail] = {
        name: name.trim(),
        email: lowerEmail,
        phone: phone.trim(),
        passwordHash,
        quotes: []
      };
      this.saveUsers(users);
      this.setSession(lowerEmail);
      return users[lowerEmail];
    },
    async loginUser(email, password) {
      const users = this.getUsers();
      const lowerEmail = email.toLowerCase().trim();
      const user = users[lowerEmail];
      if (!user) {
        throw new Error(isRo ? 'Email sau parolă incorectă.' : 'Invalid email or password.');
      }
      const hash = await hashPassword(password);
      if (user.passwordHash !== hash) {
        throw new Error(isRo ? 'Email sau parolă incorectă.' : 'Invalid email or password.');
      }
      this.setSession(lowerEmail);
      return user;
    },
    getCurrentUser() {
      const session = localStorage.getItem('cosmatech_session');
      if (!session) return null;
      const users = this.getUsers();
      return users[session] || null;
    },
    setSession(email) {
      localStorage.setItem('cosmatech_session', email);
    },
    clearSession() {
      localStorage.removeItem('cosmatech_session');
    },
    updateUserProfile(name, phone) {
      const currentUser = this.getCurrentUser();
      if (!currentUser) throw new Error('Not logged in');
      const users = this.getUsers();
      const email = currentUser.email;
      users[email].name = name.trim();
      users[email].phone = phone.trim();
      this.saveUsers(users);
      return users[email];
    },
    saveQuote(quote) {
      const currentUser = this.getCurrentUser();
      if (!currentUser) return;
      const users = this.getUsers();
      const email = currentUser.email;
      if (!users[email].quotes) users[email].quotes = [];
      users[email].quotes.push(quote);
      this.saveUsers(users);
    }
  };

  // Expose to window for main.js access
  window.LocalDatabase = LocalDatabase;

  // Only run dynamic UI injection and navbar setup on non-auth pages
  if (!document.body.hasAttribute('data-auth-page')) {
    // ==========================================
    // 3. Dynamic UI Injection (Modals)
    // ==========================================
    const modalsContainer = document.createElement('div');
    modalsContainer.id = 'authModalsContainer';
    modalsContainer.innerHTML = `
      <!-- Auth Modal (Login / Signup) -->
      <div id="authModal" class="modal-backdrop">
        <div class="modal-window glass-card" style="max-width: 450px;">
          <button class="modal-close" id="authModalClose" aria-label="Close">&times;</button>
          <div class="modal-body">
            <div class="auth-tabs" style="display: flex; gap: 20px; border-bottom: 1px solid var(--border-glass); margin-bottom: 24px; padding-bottom: 12px;">
              <h3 class="auth-tab active" data-tab="login" style="cursor: pointer; font-size: 1.25rem; position: relative;">${isRo ? 'Conectare' : 'Login'}</h3>
              <h3 class="auth-tab" data-tab="signup" style="cursor: pointer; font-size: 1.25rem; color: var(--text-secondary); position: relative;">${isRo ? 'Înregistrare' : 'Sign Up'}</h3>
            </div>
            
            <!-- Login Form -->
            <form id="loginForm" class="auth-form active-form">
              <div class="form-group">
                <label>${isRo ? 'Email' : 'Email'} *</label>
                <input type="email" id="loginEmail" class="form-control" required placeholder="john@example.com">
              </div>
              <div class="form-group">
                <label>${isRo ? 'Parolă' : 'Password'} *</label>
                <input type="password" id="loginPassword" class="form-control" required placeholder="••••••••">
              </div>
              <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;">${isRo ? 'Conectează-te' : 'Log In'}</button>
            </form>

            <!-- Signup Form -->
            <form id="signupForm" class="auth-form" style="display: none;">
              <div class="form-group">
                <label>${isRo ? 'Nume Complet' : 'Full Name'} *</label>
                <input type="text" id="signupName" class="form-control" required placeholder="John Doe">
              </div>
              <div class="form-group">
                <label>${isRo ? 'Email' : 'Email'} *</label>
                <input type="email" id="signupEmail" class="form-control" required placeholder="john@example.com">
              </div>
              <div class="form-group">
                <label>${isRo ? 'Telefon' : 'Phone'} *</label>
                <input type="tel" id="signupPhone" class="form-control" required placeholder="07123 456789">
              </div>
              <div class="form-group">
                <label>${isRo ? 'Parolă' : 'Password'} *</label>
                <input type="password" id="signupPassword" class="form-control" required placeholder="••••••••">
              </div>
              <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;">${isRo ? 'Creează Cont' : 'Sign Up'}</button>
            </form>
          </div>
        </div>
      </div>

      <!-- User Profile Modal -->
      <div id="profileModal" class="modal-backdrop">
        <div class="modal-window glass-card" style="max-width: 700px; width: 95%;">
          <button class="modal-close" id="profileModalClose" aria-label="Close">&times;</button>
          <div class="modal-body" style="padding: 30px;">
            <h3 style="margin-bottom: 24px; font-size: 1.6rem;" class="text-gradient">${isRo ? 'Contul Meu' : 'My Account'}</h3>
            
            <div class="profile-layout" style="display: grid; grid-template-columns: 1fr; gap: 24px;">
              <!-- User Profile Details -->
              <div class="glass-card" style="padding: 24px; border-radius: 12px; background: rgba(255,255,255,0.01);">
                <h4 style="margin-bottom: 16px; border-bottom: 1px solid var(--border-glass); padding-bottom: 8px; font-size:1.1rem; color:#FFFFFF;">${isRo ? 'Informații Personale' : 'Personal Information'}</h4>
                <form id="profileUpdateForm">
                  <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div class="form-group">
                      <label>${isRo ? 'Nume Complet' : 'Full Name'}</label>
                      <input type="text" id="profileName" class="form-control" required>
                    </div>
                    <div class="form-group">
                      <label>${isRo ? 'Telefon' : 'Phone'}</label>
                      <input type="tel" id="profilePhone" class="form-control" required>
                    </div>
                  </div>
                  <div class="form-group" style="margin-top: 12px;">
                    <label>Email (${isRo ? 'Nu se poate modifica' : 'Cannot be changed'})</label>
                    <input type="email" id="profileEmail" class="form-control" disabled style="opacity: 0.6;">
                  </div>
                  <button type="submit" class="btn btn-secondary" style="padding: 8px 20px; font-size: 0.9rem; margin-top: 10px;">${isRo ? 'Salvează Modificările' : 'Save Changes'}</button>
                </form>
              </div>

              <!-- Quote History -->
              <div class="glass-card" style="padding: 24px; border-radius: 12px; background: rgba(255,255,255,0.01); max-height: 300px; display: flex; flex-direction: column;">
                <h4 style="margin-bottom: 16px; border-bottom: 1px solid var(--border-glass); padding-bottom: 8px; font-size:1.1rem; color:#FFFFFF;">${isRo ? 'Istoric Cereri Ofertă' : 'Quote Request History'}</h4>
                <div id="profileQuotesContainer" style="overflow-y: auto; flex-grow: 1;">
                  <!-- Dynamic Quotes List -->
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modalsContainer);

    const authModal = document.getElementById('authModal');
    const profileModal = document.getElementById('profileModal');
    const authTabs = document.querySelectorAll('.auth-tab');
    const authForms = document.querySelectorAll('.auth-form');

    // ==========================================
    // 4. Modal Event Listeners
    // ==========================================
    function showModal(modal) {
      modal.classList.add('show');
      document.body.style.overflow = 'hidden';
    }

    function hideModal(modal) {
      modal.classList.remove('show');
      document.body.style.overflow = 'auto';
    }

    document.getElementById('authModalClose').addEventListener('click', () => hideModal(authModal));
    document.getElementById('profileModalClose').addEventListener('click', () => hideModal(profileModal));
    
    authModal.addEventListener('click', (e) => {
      if (e.target === authModal) hideModal(authModal);
    });
    
    profileModal.addEventListener('click', (e) => {
      if (e.target === profileModal) hideModal(profileModal);
    });

    // Switch Tabs in Login / Signup modal
    authTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        authTabs.forEach(t => {
          t.classList.remove('active');
          t.style.color = 'var(--text-secondary)';
        });
        tab.classList.add('active');
        tab.style.color = '#FFFFFF';

        const targetTab = tab.getAttribute('data-tab');
        authForms.forEach(form => {
          form.style.display = 'none';
          form.classList.remove('active-form');
        });

        const activeForm = document.getElementById(targetTab + 'Form');
        activeForm.style.display = 'block';
        activeForm.classList.add('active-form');
      });
    });

    // Open modal triggers helper
    function triggerAuth(tabType) {
      const targetTab = document.querySelector(`.auth-tab[data-tab="${tabType}"]`);
      if (targetTab) targetTab.click();
      showModal(authModal);
    }

    // ==========================================
    // 5. Navbar UI Sync Engine
    // ==========================================
    function updateNavbar() {
      const currentUser = LocalDatabase.getCurrentUser();
      const actions = document.querySelector('.navbar-actions');
      const navLinks = document.getElementById('navLinks');

      if (!actions) return;

      // Desktop Navbar Auth Buttons
      let authWrapper = document.getElementById('navbarAuthWrapper');
      if (!authWrapper) {
        authWrapper = document.createElement('div');
        authWrapper.id = 'navbarAuthWrapper';
        authWrapper.style.display = 'flex';
        authWrapper.style.alignItems = 'center';
        actions.insertBefore(authWrapper, actions.firstChild);
      }

      // Mobile Navbar Auth Buttons
      let mobileAuthWrapper = document.getElementById('mobileAuthWrapper');
      if (navLinks && !mobileAuthWrapper) {
        mobileAuthWrapper = document.createElement('div');
        mobileAuthWrapper.id = 'mobileAuthWrapper';
        mobileAuthWrapper.className = 'mobile-auth-wrapper';
        mobileAuthWrapper.style.width = '100%';
        mobileAuthWrapper.style.borderTop = '1px solid var(--border-glass)';
        mobileAuthWrapper.style.marginTop = '15px';
        mobileAuthWrapper.style.paddingTop = '15px';
        mobileAuthWrapper.style.display = 'flex';
        mobileAuthWrapper.style.flexDirection = 'column';
        mobileAuthWrapper.style.gap = '10px';

        const mobileBtn = navLinks.querySelector('.navbar-btn-mobile');
        if (mobileBtn) {
          navLinks.insertBefore(mobileAuthWrapper, mobileBtn);
        } else {
          navLinks.appendChild(mobileAuthWrapper);
        }
      }

      if (currentUser) {
        // Logged In Desktop navbar
        authWrapper.innerHTML = `
          <div class="user-dropdown" style="position: relative; margin-right: 15px;">
            <a href="#" id="userDropdownBtn" style="font-weight:600; font-size:0.9rem; color:#FFFFFF; cursor:pointer; display:inline-flex; align-items:center; gap:6px; padding: 6px 0;">
              <i class="fas fa-user-circle" style="font-size:1.2rem; color:var(--accent-light);"></i> 
              <span>Hi, ${currentUser.name.split(' ')[0]}</span>
              <i class="fas fa-chevron-down" style="font-size:0.75rem; transition:transform var(--transition-fast);"></i>
            </a>
            <ul class="dropdown-menu" id="userDropdownMenu">
              <li class="dropdown-item" id="openProfileBtn"><i class="fas fa-columns"></i> ${isRo ? 'Profilul Meu' : 'My Profile'}</li>
              <li class="dropdown-item" id="logoutBtn" style="border-top: 1px solid var(--border-glass);"><i class="fas fa-sign-out-alt"></i> ${isRo ? 'Deconectare' : 'Logout'}</li>
            </ul>
          </div>
        `;

        // Logged In Mobile sidebar
        if (mobileAuthWrapper) {
          mobileAuthWrapper.innerHTML = `
            <div style="font-weight:600; font-size:0.95rem; color:#FFFFFF; padding: 10px 0; border-bottom: 1px solid var(--border-glass); margin-bottom: 10px; display:flex; align-items:center; gap:8px;">
              <i class="fas fa-user-circle" style="color:var(--accent-light); font-size:1.2rem;"></i> ${isRo ? 'Salut' : 'Hi'}, ${currentUser.name.split(' ')[0]}!
            </div>
            <a href="#" class="mobile-profile-trigger" style="font-weight:600; font-size:0.95rem; color:var(--text-secondary); padding: 8px 0; display:flex; align-items:center; gap:8px;"><i class="fas fa-columns"></i> ${isRo ? 'Profilul Meu' : 'My Profile'}</a>
            <a href="#" class="mobile-logout-trigger" style="font-weight:600; font-size:0.95rem; color:var(--text-secondary); padding: 8px 0; display:flex; align-items:center; gap:8px;"><i class="fas fa-sign-out-alt"></i> ${isRo ? 'Deconectare' : 'Logout'}</a>
          `;
        }

        // Add Dropdown toggle events
        const dropBtn = document.getElementById('userDropdownBtn');
        const dropMenu = document.getElementById('userDropdownMenu');
        if (dropBtn && dropMenu) {
          dropBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isDisplayed = dropMenu.style.display === 'flex';
            dropMenu.style.display = isDisplayed ? 'none' : 'flex';
            dropBtn.querySelector('.fa-chevron-down').style.transform = isDisplayed ? 'rotate(0)' : 'rotate(180deg)';
          });
          
          document.addEventListener('click', () => {
            dropMenu.style.display = 'none';
            const icon = dropBtn.querySelector('.fa-chevron-down');
            if (icon) icon.style.transform = 'rotate(0)';
          });
        }

        // Hook up profile & logout click handlers
        const openProf = document.getElementById('openProfileBtn');
        if (openProf) openProf.addEventListener('click', openProfileModal);

        const logBtn = document.getElementById('logoutBtn');
        if (logBtn) logBtn.addEventListener('click', handleLogout);

        if (mobileAuthWrapper) {
          const mobProf = mobileAuthWrapper.querySelector('.mobile-profile-trigger');
          if (mobProf) mobProf.addEventListener('click', (e) => { e.preventDefault(); openProfileModal(); });
          
          const mobLog = mobileAuthWrapper.querySelector('.mobile-logout-trigger');
          if (mobLog) mobLog.addEventListener('click', (e) => { e.preventDefault(); handleLogout(); });
        }

      } else {
        // Logged Out Desktop navbar
        authWrapper.innerHTML = `
          <a href="#" id="navLoginBtn" style="font-weight:600; font-size:0.9rem; color:var(--text-secondary); margin-right:20px; cursor:pointer; display:inline-flex; align-items:center; gap:6px;"><i class="fas fa-sign-in-alt"></i> ${isRo ? 'Autentificare' : 'Login'}</a>
          <a href="#" class="btn btn-secondary" id="navSignupBtn" style="padding:8px 16px; font-size:0.85rem; margin-right:15px; display:inline-flex; align-items:center; gap:6px;"><i class="fas fa-user-plus"></i> ${isRo ? 'Înregistrare' : 'Sign Up'}</a>
        `;

        // Logged Out Mobile sidebar
        if (mobileAuthWrapper) {
          mobileAuthWrapper.innerHTML = `
            <a href="#" class="mobile-login-trigger" style="font-weight:600; font-size:0.95rem; color:var(--text-secondary); padding: 10px 0; display:flex; align-items:center; gap:8px;"><i class="fas fa-sign-in-alt"></i> ${isRo ? 'Autentificare' : 'Login'}</a>
            <a href="#" class="mobile-signup-trigger" style="font-weight:600; font-size:0.95rem; color:var(--text-secondary); padding: 10px 0; display:flex; align-items:center; gap:8px;"><i class="fas fa-user-plus"></i> ${isRo ? 'Înregistrare' : 'Sign Up'}</a>
          `;
        }

        // Add click events to triggers
        document.getElementById('navLoginBtn').addEventListener('click', (e) => { e.preventDefault(); triggerAuth('login'); });
        document.getElementById('navSignupBtn').addEventListener('click', (e) => { e.preventDefault(); triggerAuth('signup'); });

        if (mobileAuthWrapper) {
          mobileAuthWrapper.querySelector('.mobile-login-trigger').addEventListener('click', (e) => { e.preventDefault(); triggerAuth('login'); });
          mobileAuthWrapper.querySelector('.mobile-signup-trigger').addEventListener('click', (e) => { e.preventDefault(); triggerAuth('signup'); });
        }
      }
    }

    // ==========================================
    // 6. Action Handlers (Signup, Login, Logout, Profile)
    // ==========================================
    document.getElementById('signupForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('signupName').value;
      const email = document.getElementById('signupEmail').value;
      const phone = document.getElementById('signupPhone').value;
      const password = document.getElementById('signupPassword').value;

      try {
        await LocalDatabase.registerUser(name, email, password, phone);
        hideModal(authModal);
        updateNavbar();
        
        // Reset form
        document.getElementById('signupForm').reset();
        
        showSuccessNotification(
          isRo ? 'Înregistrare Reușită!' : 'Registration Successful!',
          isRo ? `Contul tău a fost creat cu succes. Bun venit, <strong>${name}</strong>!`
               : `Your account has been successfully created. Welcome, <strong>${name}</strong>!`
        );
      } catch (err) {
        alert(err.message);
      }
    });

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;

      try {
        const user = await LocalDatabase.loginUser(email, password);
        hideModal(authModal);
        updateNavbar();
        
        // Reset form
        document.getElementById('loginForm').reset();

        showSuccessNotification(
          isRo ? 'Conectare Reușită!' : 'Login Successful!',
          isRo ? `Te-ai conectat cu succes ca <strong>${user.name}</strong>.`
               : `You have successfully logged in as <strong>${user.name}</strong>.`
        );
      } catch (err) {
        alert(err.message);
      }
    });

    function handleLogout(e) {
      if (e) e.preventDefault();
      LocalDatabase.clearSession();
      updateNavbar();
      showSuccessNotification(
        isRo ? 'Deconectat!' : 'Logged Out!',
        isRo ? 'Te-ai deconectat cu succes.' : 'You have been successfully logged out.'
      );
    }

    function openProfileModal() {
      const currentUser = LocalDatabase.getCurrentUser();
      if (!currentUser) return;

      // Fill profile fields
      document.getElementById('profileName').value = currentUser.name;
      document.getElementById('profilePhone').value = currentUser.phone;
      document.getElementById('profileEmail').value = currentUser.email;

      // Draw Quote Requests History
      const container = document.getElementById('profileQuotesContainer');
      const quotes = currentUser.quotes || [];

      if (quotes.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; color: var(--text-muted); padding: 30px 10px; font-size: 0.9rem;">
            <i class="far fa-folder-open" style="font-size: 2rem; margin-bottom: 12px; display: block; opacity: 0.5;"></i>
            ${isRo ? 'Nu ai depus nicio cerere de ofertă încă.' : 'You have not submitted any quote requests yet.'}
          </div>
        `;
      } else {
        // Build quote list items
        const quotesHTML = quotes.map((q, idx) => {
          return `
            <div class="profile-quote-card" style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-glass); border-radius: 8px; padding: 14px; margin-bottom: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
                <span style="font-weight: 700; color: #FFFFFF; font-size: 0.95rem;">${q.type}</span>
                <span style="font-size: 0.75rem; color: var(--text-muted);">${new Date(q.date).toLocaleString()}</span>
              </div>
              <div style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 8px;">
                ${q.details.map(item => `• ${item}`).join('<br>')}
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.04); padding-top: 8px;">
                <span style="font-size: 0.8rem; color: var(--text-muted);">${isRo ? 'Status: În curs' : 'Status: Pending'}</span>
                <span style="font-weight: 800; color: var(--accent-light); font-size: 1.1rem;">${q.price}</span>
              </div>
            </div>
          `;
        }).reverse().join(''); // Show newest first
        container.innerHTML = quotesHTML;
      }

      showModal(profileModal);
    }

    // Handle user info update submit
    document.getElementById('profileUpdateForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('profileName').value;
      const phone = document.getElementById('profilePhone').value;

      try {
        LocalDatabase.updateUserProfile(name, phone);
        updateNavbar();
        hideModal(profileModal);
        showSuccessNotification(
          isRo ? 'Profil Actualizat!' : 'Profile Updated!',
          isRo ? 'Datele tale de contact au fost actualizate.' : 'Your contact details have been successfully updated.'
        );
      } catch (err) {
        alert(err.message);
      }
    });

    // Reusable Success Notification Helper
    function showSuccessNotification(title, htmlContent) {
      const notificationBackdrop = document.createElement('div');
      notificationBackdrop.className = 'modal-backdrop show';
      notificationBackdrop.style.zIndex = '3000';
      
      notificationBackdrop.innerHTML = `
        <div class="modal-window glass-card animate-on-scroll show" style="max-width: 420px; text-align: center; margin: auto;">
          <div class="modal-body">
            <div class="service-icon" style="margin: 0 auto 20px; width: 56px; height: 56px; border-radius: 50%; font-size: 1.35rem; background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.2); color: #10B981; display:flex; align-items:center; justify-content:center;">
              <i class="fas fa-check"></i>
            </div>
            <h3 style="margin-bottom: 12px; font-size: 1.3rem; color: #FFFFFF;">${title}</h3>
            <p style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.6; margin-bottom: 24px;">${htmlContent}</p>
            <button class="btn btn-primary btn-close-notify" style="width: 100%; padding: 10px 20px;">${isRo ? 'Am înțeles' : 'Got it'}</button>
          </div>
        </div>
      `;

      document.body.appendChild(notificationBackdrop);
      document.body.style.overflow = 'hidden';

      const closeBtn = notificationBackdrop.querySelector('.btn-close-notify');
      closeBtn.addEventListener('click', () => {
        notificationBackdrop.remove();
        document.body.style.overflow = 'auto';
      });
    }

    // Initialize Navbar UI on load
    updateNavbar();
  }
});
