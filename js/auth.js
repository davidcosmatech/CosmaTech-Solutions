function initAuth() {
  const isRo = document.documentElement.lang === 'ro' || window.location.pathname.includes('/ro/');
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);

  // ==========================================
  // 1. Supabase Initialization and SDK Loader
  // ==========================================
  const supabaseConfig = window.COSMATECH_SUPABASE_CONFIG;
  let supabaseClient = null;

  function loadSupabase() {
    return new Promise((resolve) => {
      if (window.supabase) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.onload = () => resolve();
      script.onerror = () => {
        console.error('Failed to load Supabase SDK');
        resolve();
      };
      document.head.appendChild(script);
    });
  }

  // Initialize once and make every auth action wait for the SDK and client.
  const supabaseClientReady = loadSupabase().then(() => {
    if (!window.supabase?.createClient) {
      throw new Error('Could not load Supabase. Check your connection and try again.');
    }

    if (!supabaseConfig?.url || !supabaseConfig?.publishableKey) {
      throw new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in Vercel.');
    }

    supabaseClient = window.supabaseClient || window.supabase.createClient(supabaseConfig.url, supabaseConfig.publishableKey);
    window.supabaseClient = supabaseClient;

    if (!document.body.hasAttribute('data-auth-page')) {
      supabaseClient.auth.onAuthStateChange(() => {
        if (typeof updateNavbar === 'function') updateNavbar();
      });
    }
    return supabaseClient;
  });

  async function getSupabaseClient() {
    return supabaseClient || await supabaseClientReady;
  }

  // ==========================================
  // 2. Database layer (Supabase client wrapper)
  // ==========================================
  const LocalDatabase = {
    getCurrentUser() {
      try {
        const tokenStr = localStorage.getItem('sb-kzfwfdfibmhyqhxavjlr-auth-token');
        if (!tokenStr) return null;
        const tokenData = JSON.parse(tokenStr);
        if (!tokenData || !tokenData.user) return null;

        const user = tokenData.user;
        const meta = user.user_metadata || {};
        const email = user.email;
        const quotesKey = 'cosmatech_quotes_' + email.toLowerCase();
        const quotes = localStorage.getItem(quotesKey) ? JSON.parse(localStorage.getItem(quotesKey)) : [];
        return {
          name: meta.full_name || 'Client',
          email: email,
          phone: meta.phone || '',
          quotes: quotes
        };
      } catch (e) {
        return null;
      }
    },
    async registerUser(name, email, password, phone) {
      const client = await getSupabaseClient();
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: new URL(
            document.documentElement.lang === 'ro' || window.location.pathname.includes('/ro/')
              ? '../signin.html?confirmed=1'
              : 'signin.html?confirmed=1',
            window.location.href
          ).toString(),
          data: {
            full_name: name,
            phone: phone
          }
        }
      });
      if (error) throw error;
      return data;
    },
    async loginUser(email, password) {
      const client = await getSupabaseClient();
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      return data.user;
    },
    async clearSession() {
      const client = await getSupabaseClient();
      const { error } = await client.auth.signOut();
      if (error) throw error;
    },
    async updateUserProfile(name, phone) {
      const client = await getSupabaseClient();
      const { data, error } = await client.auth.updateUser({
        data: {
          full_name: name,
          phone: phone
        }
      });
      if (error) throw error;
      return data.user;
    },
    async saveQuote(quote) {
      const client = await getSupabaseClient();
      const { error } = await client.from('quote_requests').insert({
        customer_name: quote.name,
        customer_email: quote.email,
        customer_phone: quote.phone,
        service_type: quote.type,
        estimated_price: quote.price,
        details: quote.details || [],
        description: quote.notes || ''
      });

      if (error) throw error;

      return true;
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
      const navLinks = document.getElementById('navLinks');

      if (!navLinks) return;

      const basePrefix = window.location.pathname.includes('/ro/') ? '../' : '';

      // Remove existing dynamic auth items
      const existingAuthItems = navLinks.querySelectorAll('.dynamic-auth-item');
      existingAuthItems.forEach(item => item.remove());

      if (currentUser) {
        // Logged In:
        // 1. Desktop dropdown (hidden on mobile via CSS)
        const dropdownLi = document.createElement('li');
        dropdownLi.className = 'dynamic-auth-item desktop-only user-dropdown-li';
        dropdownLi.style.position = 'relative';
        dropdownLi.innerHTML = `
          <div class="user-dropdown" style="position: relative;">
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

        // 2. Mobile menu header (hidden on desktop via CSS)
        const mobileProfileLi = document.createElement('li');
        mobileProfileLi.className = 'dynamic-auth-item mobile-only';
        mobileProfileLi.style.width = '100%';
        mobileProfileLi.style.borderTop = '1px solid var(--border-glass)';
        mobileProfileLi.style.marginTop = '15px';
        mobileProfileLi.style.paddingTop = '15px';
        mobileProfileLi.innerHTML = `
          <div style="font-weight:600; font-size:0.95rem; color:#FFFFFF; padding: 5px 0; display:flex; align-items:center; gap:8px;">
            <i class="fas fa-user-circle" style="color:var(--accent-light); font-size:1.2rem;"></i> ${isRo ? 'Salut' : 'Hi'}, ${currentUser.name.split(' ')[0]}!
          </div>
        `;

        // 3. Mobile Profile Link
        const mobileProfileLinkLi = document.createElement('li');
        mobileProfileLinkLi.className = 'dynamic-auth-item mobile-only';
        mobileProfileLinkLi.innerHTML = `
          <a href="#" class="mobile-profile-trigger" style="font-weight:600; font-size:0.95rem; color:var(--text-secondary); padding: 8px 0; display:flex; align-items:center; gap:8px;"><i class="fas fa-columns"></i> ${isRo ? 'Profilul Meu' : 'My Profile'}</a>
        `;

        // 4. Mobile Logout Link
        const mobileLogoutLi = document.createElement('li');
        mobileLogoutLi.className = 'dynamic-auth-item mobile-only';
        mobileLogoutLi.innerHTML = `
          <a href="#" class="mobile-logout-trigger" style="font-weight:600; font-size:0.95rem; color:var(--text-secondary); padding: 8px 0; display:flex; align-items:center; gap:8px;"><i class="fas fa-sign-out-alt"></i> ${isRo ? 'Deconectare' : 'Logout'}</a>
        `;

        // Insert them before the mobile Request Quote button
        const mobileBtn = navLinks.querySelector('.navbar-btn-mobile');
        if (mobileBtn) {
          navLinks.insertBefore(dropdownLi, mobileBtn);
          navLinks.insertBefore(mobileProfileLi, mobileBtn);
          navLinks.insertBefore(mobileProfileLinkLi, mobileBtn);
          navLinks.insertBefore(mobileLogoutLi, mobileBtn);
        } else {
          navLinks.appendChild(dropdownLi);
          navLinks.appendChild(mobileProfileLi);
          navLinks.appendChild(mobileProfileLinkLi);
          navLinks.appendChild(mobileLogoutLi);
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
            if (dropMenu) dropMenu.style.display = 'none';
            const icon = dropBtn ? dropBtn.querySelector('.fa-chevron-down') : null;
            if (icon) icon.style.transform = 'rotate(0)';
          });
        }

        // Hook up profile & logout click handlers
        const openProf = document.getElementById('openProfileBtn');
        if (openProf) openProf.addEventListener('click', openProfileModal);

        const logBtn = document.getElementById('logoutBtn');
        if (logBtn) logBtn.addEventListener('click', handleLogout);

        const mobProf = navLinks.querySelector('.mobile-profile-trigger');
        if (mobProf) mobProf.addEventListener('click', (e) => { e.preventDefault(); openProfileModal(); });

        const mobLog = navLinks.querySelector('.mobile-logout-trigger');
        if (mobLog) mobLog.addEventListener('click', (e) => { e.preventDefault(); handleLogout(); });

      } else {
        // Logged Out:
        // Desktop / Mobile Sign In (class nav-login-link style)
        const loginLi = document.createElement('li');
        loginLi.className = 'dynamic-auth-item';
        loginLi.innerHTML = `
          <a href="${basePrefix}signin.html" id="navLoginBtn" style="font-weight:600; display:inline-flex; align-items:center; gap:6px;"><i class="fas fa-sign-in-alt"></i> ${isRo ? 'Autentificare' : 'Login'}</a>
        `;

        // Desktop / Mobile Sign Up (blue button style!)
        const signupLi = document.createElement('li');
        signupLi.className = 'dynamic-auth-item';
        signupLi.innerHTML = `
          <a href="${basePrefix}signup.html" class="btn btn-primary" id="navSignupBtn" style="padding:8px 16px; font-size:0.85rem; display:inline-flex; align-items:center; gap:6px;"><i class="fas fa-user-plus"></i> ${isRo ? 'Înregistrare' : 'Sign Up'}</a>
        `;

        // Insert them before the mobile Request Quote button
        const mobileBtn = navLinks.querySelector('.navbar-btn-mobile');
        if (mobileBtn) {
          navLinks.insertBefore(loginLi, mobileBtn);
          navLinks.insertBefore(signupLi, mobileBtn);
        } else {
          navLinks.appendChild(loginLi);
          navLinks.appendChild(signupLi);
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
        const { session } = await LocalDatabase.registerUser(name, email, password, phone);
        hideModal(authModal);
        if (session) updateNavbar();

        // Reset form
        document.getElementById('signupForm').reset();

        if (session) {
          showSuccessNotification(
            isRo ? 'Înregistrare Reușită!' : 'Registration Successful!',
            isRo ? `Contul tău a fost creat cu succes. Bun venit, <strong>${name}</strong>!`
              : `Your account has been created. Welcome, <strong>${name}</strong>!`
          );
        } else {
          showSuccessNotification(
            isRo ? 'Verifică adresa de email' : 'Check your email',
            isRo ? 'Contul a fost creat. Deschide linkul de confirmare din email înainte să te conectezi.'
              : 'Your account has been created. Open the confirmation link in your email before signing in.'
          );
        }
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
          isRo ? `Te-ai conectat cu succes ca <strong>${user.user_metadata?.full_name || user.email}</strong>.`
            : `You have successfully logged in as <strong>${user.user_metadata?.full_name || user.email}</strong>.`
        );
      } catch (err) {
        alert(err.message);
      }
    });

    async function handleLogout(e) {
      if (e) e.preventDefault();
      try {
        await LocalDatabase.clearSession();
        updateNavbar();
        showSuccessNotification(
          isRo ? 'Deconectat!' : 'Logged Out!',
          isRo ? 'Te-ai deconectat cu succes.' : 'You have been successfully logged out.'
        );
      } catch (err) {
        alert(err.message);
      }
    }

    async function openProfileModal() {
      const currentUser = LocalDatabase.getCurrentUser();
      if (!currentUser) return;

      let quoteHistory = currentUser.quotes || [];
      try {
        const client = await getSupabaseClient();
        const { data: { user } } = await client.auth.getUser();
        if (user) {
          const { data, error } = await client.from('quote_requests')
            .select('service_type, estimated_price, details, status, created_at')
            .eq('user_id', user.id).order('created_at', { ascending: false });
          if (!error) {
            quoteHistory = (data || []).map((quote) => ({
              type: quote.service_type,
              price: quote.estimated_price,
              details: Array.isArray(quote.details) ? quote.details : [],
              date: quote.created_at,
              status: quote.status
            }));
          }
        }
      } catch (error) {
        console.warn('Could not load saved quote history.', error);
      }

      // Fill profile fields
      document.getElementById('profileName').value = currentUser.name;
      document.getElementById('profilePhone').value = currentUser.phone;
      document.getElementById('profileEmail').value = currentUser.email;

      // Draw Quote Requests History
      const container = document.getElementById('profileQuotesContainer');
      const quotes = quoteHistory;

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
                <span style="font-weight: 700; color: #FFFFFF; font-size: 0.95rem;">${escapeHtml(q.type)}</span>
                <span style="font-size: 0.75rem; color: var(--text-muted);">${new Date(q.date).toLocaleString()}</span>
              </div>
              <div style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 8px;">
                ${q.details.map(item => `• ${escapeHtml(item)}`).join('<br>')}
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.04); padding-top: 8px;">
                <span style="font-size: 0.8rem; color: var(--text-muted);">Status: ${escapeHtml(q.status || 'New')}</span>
                <span style="font-weight: 800; color: var(--accent-light); font-size: 1.1rem;">${escapeHtml(q.price)}</span>
              </div>
            </div>
          `;
        }).reverse().join(''); // Show newest first
        container.innerHTML = quotesHTML;
      }

      showModal(profileModal);
    }

    // Handle user info update submit
    document.getElementById('profileUpdateForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('profileName').value;
      const phone = document.getElementById('profilePhone').value;

      try {
        await LocalDatabase.updateUserProfile(name, phone);
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
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuth);
} else {
  initAuth();
}


