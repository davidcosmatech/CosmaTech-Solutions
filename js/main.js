document.addEventListener('DOMContentLoaded', () => {
  const isRo = document.documentElement.lang === 'ro' || window.location.pathname.includes('/ro/');
  
  // ==========================================
  // 1. Mobile Meniu Toggle
  // ==========================================
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      navLinks.classList.toggle('active');
      const icon = menuToggle.querySelector('i');
      if (icon) {
        if (navLinks.classList.contains('active')) {
          icon.classList.remove('fa-bars');
          icon.classList.add('fa-times');
        } else {
          icon.classList.remove('fa-times');
          icon.classList.add('fa-bars');
        }
      }
    });

    document.addEventListener('click', (e) => {
      if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
        navLinks.classList.remove('active');
        const icon = menuToggle.querySelector('i');
        if (icon) {
          icon.classList.remove('fa-times');
          icon.classList.add('fa-bars');
        }
      }
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        const icon = menuToggle.querySelector('i');
        if (icon) {
          icon.classList.remove('fa-times');
          icon.classList.add('fa-bars');
        }
      });
    });
  }

  // ==========================================
  // 2. Sticky Navbar scroll
  // ==========================================
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }

  // ==========================================
  // 3. Scroll reveal IntersectionObserver & Hover Glow
  // ==========================================
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const animationObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.animate-on-scroll, .timeline-item, .roadmap-node, .process-card-pc').forEach(el => {
    animationObserver.observe(el);
  });

  // Hover light reflection
  document.querySelectorAll('.glass-card, .pc-card, .selector-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  // ==========================================
  // 4. Wizard Setup Helper Engine (State Machine)
  // ==========================================
  
  function setupWizard(modalId, calculateFn, stepsCount) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    const btnPrev = modal.querySelector('.quote-prev');
    const btnNext = modal.querySelector('.quote-next');
    const steps = modal.querySelectorAll('.quote-step-content');
    const progressDots = modal.querySelectorAll('.step-dot');
    const progressBar = modal.querySelector('.step-progress-bar');
    let currentStep = 0;

    function updateStep() {
      // Toggle active step and replay fade-in
      steps.forEach((step, idx) => {
        step.classList.remove('active');
        if (idx === currentStep) {
          void step.offsetWidth;
          step.classList.add('active');
        }
      });

      // Toggle dots
      progressDots.forEach((dot, index) => {
        dot.classList.remove('active', 'completed');
        if (index === currentStep) {
          dot.classList.add('active');
        } else if (index < currentStep) {
          dot.classList.add('completed');
        }
      });

      // Progress bar percentage
      if (progressBar) {
        const percent = (currentStep / (stepsCount - 1)) * 100;
        progressBar.style.width = `${percent}%`;
      }

      // Hide/Show Back button
      if (btnPrev) {
        btnPrev.style.visibility = (currentStep === 0) ? 'hidden' : 'visible';
      }

      // Toggle Next/Submit labels
      if (btnNext) {
        if (currentStep === stepsCount - 1) {
          btnNext.textContent = isRo ? 'Trimite Solicitarea' : 'Submit Request';
        } else {
          btnNext.textContent = 'Next';
        }
      }
    }

    function validateStep(stepIndex) {
      if (stepIndex === stepsCount - 2) {
        // Target specific input within modal
        const name = modal.querySelector('.quote-name').value.trim();
        const email = modal.querySelector('.quote-email').value.trim();
        const phone = modal.querySelector('.quote-phone').value.trim();

        if (!name || !email || !phone) {
          alert(isRo ? 'Te rugăm să completezi Numele, Email-ul și Telefonul.' : 'Please fill in your Name, Email, and Phone number.');
          return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          alert(isRo ? 'Te rugăm să introduci o adresă de email validă.' : 'Please enter a valid email address.');
          return false;
        }
      }
      return true;
    }

    if (btnNext) {
      btnNext.addEventListener('click', async () => {
        if (!validateStep(currentStep)) return;

        if (currentStep < stepsCount - 1) {
          currentStep++;
          if (currentStep === stepsCount - 1) {
            calculateFn(modal);
          }
          updateStep();
        } else {
          btnNext.disabled = true;
          btnNext.classList.add('btn-loading');
          try {
            await submitWizard(modal);
          } catch (error) {
            alert(isRo
              ? 'Solicitarea nu a putut fi salvată. Verifică conexiunea și încearcă din nou.'
              : 'Your request could not be saved. Check your connection and try again.');
          } finally {
            btnNext.disabled = false;
            btnNext.classList.remove('btn-loading');
          }
        }
      });
    }

    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        if (currentStep > 0) {
          currentStep--;
          updateStep();
        }
      });
    }

    // Toggle selected checkboxes visual styles
    modal.querySelectorAll('.feature-checkbox-label input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const label = checkbox.closest('.feature-checkbox-label');
        if (label) {
          if (checkbox.checked) {
            label.classList.add('selected');
          } else {
            label.classList.remove('selected');
          }
        }
      });
    });

    // Toggle selector cards visual selected styles
    modal.querySelectorAll('.selector-card[data-value]').forEach(card => {
      card.addEventListener('click', () => {
        const siblingCards = card.parentElement.querySelectorAll('.selector-card[data-value]');
        siblingCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        
        const inputId = card.getAttribute('data-input-target');
        const hiddenInput = modal.querySelector('#' + inputId);
        if (hiddenInput) {
          hiddenInput.value = card.getAttribute('data-value');
        }
      });
    });

    modal.resetWizard = function() {
      currentStep = 0;
      modal.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea').forEach(input => {
        input.value = '';
      });
      modal.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
        const label = checkbox.closest('.feature-checkbox-label');
        if (label) label.classList.remove('selected');
      });
      modal.querySelectorAll('.selector-card[data-value]').forEach(card => {
        if (card.getAttribute('data-default') === 'true') {
          card.classList.add('selected');
          const inputId = card.getAttribute('data-input-target');
          const hiddenInput = modal.querySelector('#' + inputId);
          if (hiddenInput) hiddenInput.value = card.getAttribute('data-value');
        } else {
          card.classList.remove('selected');
        }
      });
      updateStep();
    };
  }

  // ==========================================
  // 5. Cost Estimation Formulas
  // ==========================================
  
  // 5a. Web Development Modal Calculator
  function calculateWebdevPrice(modal) {
    const scale = modal.querySelector('#webScaleInput').value;
    const design = modal.querySelector('#webDesignInput').value;
    
    let base = 249;
    let scaleText = isRo ? 'Site Prezentare (1-4 pagini)' : 'Presentation Site (1-4 pages)';
    
    if (scale === 'medium') {
      base = 399;
      scaleText = isRo ? 'Site Business Mediu (5-10 pagini)' : 'Medium Business Site (5-10 pages)';
    } else if (scale === 'ecommerce') {
      base = 699;
      scaleText = isRo ? 'Magazin Online / E-commerce' : 'E-commerce Store';
    } else if (scale === 'customapp') {
      base = 999;
      scaleText = isRo ? 'Aplicație Web Personalizată' : 'Custom Web Application';
    }

    let extraCost = 0;
    let items = [`${scaleText} - £${base}`];

    // Check checkboxes
    const features = isRo ? [
      { id: 'featBlog', val: 80, text: 'Secțiune Blog / Știri (+£80)' },
      { id: 'featAuth', val: 150, text: 'Sistem Conturi Utilizatori (+£150)' },
      { id: 'featPay', val: 120, text: 'Plăți online cu cardul (+£120)' },
      { id: 'featChat', val: 40, text: 'Integrare WhatsApp Chat (+£40)' },
      { id: 'featLang', val: 100, text: 'Site Multilingv (2 limbi) (+£100)' },
      { id: 'featSeo', val: 70, text: 'Pachet SEO Avansat (+£70)' }
    ] : [
      { id: 'featBlog', val: 80, text: 'Blog / News Section (+£80)' },
      { id: 'featAuth', val: 150, text: 'User Account System (+£150)' },
      { id: 'featPay', val: 120, text: 'Online Card Payments (+£120)' },
      { id: 'featChat', val: 40, text: 'WhatsApp Chat Integration (+£40)' },
      { id: 'featLang', val: 100, text: 'Multilingual Site (2 languages) (+£100)' },
      { id: 'featSeo', val: 70, text: 'Advanced SEO Package (+£70)' }
    ];

    features.forEach(f => {
      const checkbox = modal.querySelector('#' + f.id);
      if (checkbox && checkbox.checked) {
        extraCost += f.val;
        items.push(f.text);
      }
    });

    let designText = isRo ? 'Logo Existent (Inclus)' : 'Existing Logo (Included)';
    if (design === 'needed') {
      extraCost += 80;
      designText = isRo ? 'Asistență creare Logo (+£80)' : 'Logo Creation Support (+£80)';
    } else if (design === 'branding') {
      extraCost += 150;
      designText = isRo ? 'Identitate Vizuală Completă (+£150)' : 'Complete Brand Identity (+£150)';
    }
    items.push(designText);

    const total = base + extraCost;
    
    modal.querySelector('#webSummaryService').textContent = isRo ? 'Web Development' : 'Web Development';
    modal.querySelector('#webSummaryTotal').textContent = `£${total}`;
    modal.querySelector('#webSummaryItems').innerHTML = items.map(i => `<div class="summary-row"><span>${i}</span></div>`).join('');
  }

  // 5b. Hosting Modal Calculator
  function calculateHostingPrice(modal) {
    const plan = modal.querySelector('#hostPlanInput').value;
    const domain = modal.querySelector('#hostDomainInput').value;
    const cycle = modal.querySelector('#hostCycleInput').value;

    let cost = 5.99;
    let planText = isRo ? 'Abonament Starter Cloud' : 'Starter Cloud Subscription';

    if (plan === 'business') {
      cost = 12.99;
      planText = isRo ? 'Abonament Business Cloud' : 'Business Cloud Subscription';
    } else if (plan === 'ecommerce') {
      cost = 24.99;
      planText = isRo ? 'Abonament E-commerce Cloud' : 'E-commerce Cloud Subscription';
    }

    let domainCost = 0;
    let domainText = isRo ? 'Domeniu existent' : 'Existing domain';

    if (domain === 'ukcom') {
      domainCost = 10;
      domainText = isRo ? 'Înregistrare Domeniu .com / .co.uk (+£10.00/an)' : 'Domain Registration .com / .co.uk (+£10.00/yr)';
    } else if (domain === 'ro') {
      domainCost = 12;
      domainText = isRo ? 'Înregistrare Domeniu .ro (+£12.00/an)' : 'Domain Registration .ro (+£12.00/yr)';
    }

    let cycleText = isRo ? 'Facturare lunară' : 'Monthly billing';
    let totalText = '';

    if (cycle === 'yearly') {
      cycleText = isRo ? 'Facturare Anuală (10% Discount)' : 'Annual Billing (10% Discount)';
      const discountedYear = (cost * 12) * 0.90;
      const total = discountedYear + domainCost;
      totalText = isRo ? `£${total.toFixed(2)} / an` : `£${total.toFixed(2)} / yr`;
    } else {
      totalText = isRo ? `£${cost} / lună${domainCost > 0 ? ' + £' + domainCost + ' inițial' : ''}`
                       : `£${cost} / month${domainCost > 0 ? ' + £' + domainCost + ' initial' : ''}`;
    }

    const items = [
      `${planText} (${cycleText})`,
      domainText
    ];

    modal.querySelector('#hostSummaryService').textContent = isRo ? 'Hosting & Domenii' : 'Hosting & Domains';
    modal.querySelector('#hostSummaryTotal').textContent = totalText;
    modal.querySelector('#hostSummaryItems').innerHTML = items.map(i => `<div class="summary-row"><span>${i}</span></div>`).join('');
  }

  // ==========================================
  // 6. Init Wizards
  // ==========================================
  setupWizard('webdevModal', calculateWebdevPrice, 5);
  setupWizard('hostingModal', calculateHostingPrice, 5);

  // ==========================================
  // 7. Modal Managers (Open & Close Events)
  // ==========================================
  const selectorModal = document.getElementById('selectorModal');
  const allModalBackdrops = document.querySelectorAll('.modal-backdrop');

  const closeAllModals = () => {
    allModalBackdrops.forEach(backdrop => {
      backdrop.classList.remove('show');
    });
    document.body.style.overflow = 'auto';
  };

  // Click triggers to open modals
  document.querySelectorAll('.btn-quote-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      closeAllModals();
      if (selectorModal) {
        selectorModal.classList.add('show');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  // Direct specialised triggers
  // Web Development triggers
  document.querySelectorAll('.btn-quote-web').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      closeAllModals();
      const modal = document.getElementById('webdevModal');
      if (modal) {
        modal.resetWizard();
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  // Hosting triggers
  document.querySelectorAll('.btn-quote-hosting').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      closeAllModals();
      const modal = document.getElementById('hostingModal');
      if (modal) {
        modal.resetWizard();
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  // Bridge selector choices inside selector modal
  document.querySelectorAll('.bridge-selector-card[data-bridge-to]').forEach(card => {
    card.addEventListener('click', () => {
      const targetModalId = card.getAttribute('data-bridge-to') + 'Modal';
      closeAllModals();
      const targetModal = document.getElementById(targetModalId);
      if (targetModal) {
        targetModal.resetWizard();
        targetModal.classList.add('show');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  // Close modals clicking Close Button or outside window
  allModalBackdrops.forEach(backdrop => {
    const closeBtn = backdrop.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeAllModals);
    }
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeAllModals();
      }
    });
  });

  async function submitWizard(modal) {
    const nameInput = modal.querySelector('.quote-name');
    const emailInput = modal.querySelector('.quote-email');
    const phoneInput = modal.querySelector('.quote-phone');
    const name = nameInput ? nameInput.value : 'Client';
    const email = emailInput ? emailInput.value : 'email';
    const phone = phoneInput ? phoneInput.value : '';
    
    let serviceType = 'Quote Estimate';
    let totalPrice = 'TBD';
    let detailsList = [];

    const id = modal.id;
    if (id === 'webdevModal') {
      serviceType = modal.querySelector('#webSummaryService') ? modal.querySelector('#webSummaryService').textContent : 'Web Development';
      totalPrice = modal.querySelector('#webSummaryTotal') ? modal.querySelector('#webSummaryTotal').textContent : '';
      const items = modal.querySelectorAll('#webSummaryItems .summary-row span');
      items.forEach(el => detailsList.push(el.textContent));
    } else if (id === 'hostingModal') {
      serviceType = modal.querySelector('#hostSummaryService') ? modal.querySelector('#hostSummaryService').textContent : 'Hosting';
      totalPrice = modal.querySelector('#hostSummaryTotal') ? modal.querySelector('#hostSummaryTotal').textContent : '';
      const items = modal.querySelectorAll('#hostSummaryItems .summary-row span');
      items.forEach(el => detailsList.push(el.textContent));
    }

    const notesInput = modal.querySelector('.quote-notes');
    if (!window.LocalDatabase?.saveQuote) {
      throw new Error('Quote storage is unavailable.');
    }
    await window.LocalDatabase.saveQuote({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      type: serviceType,
      price: totalPrice,
      details: detailsList,
      notes: notesInput ? notesInput.value.trim() : '',
      date: new Date().toISOString()
    });

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);

    closeAllModals();
    
    showSuccessNotification(
      isRo ? 'Solicitare trimisă!' : 'Request Sent!',
      isRo ? `Mulțumim, <strong>${safeName}</strong>. Solicitarea ta a fost înregistrată cu succes.<br>Te vom contacta la <strong>${safeEmail}</strong> în curând.`
           : `Thank you, <strong>${safeName}</strong>. Your request has been saved successfully.<br>We will contact you at <strong>${safeEmail}</strong> soon.`
    );
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }

  // ==========================================
  // 8. Contact message forms
  // ==========================================
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      
      if (!name || !email) {
        alert(isRo ? 'Te rugăm să completezi câmpurile obligatorii.' : 'Please fill in the required fields.');
        return;
      }

      showSuccessNotification(
        isRo ? 'Mesaj Trimis cu Succes!' : 'Message Sent Successfully!',
        isRo ? `Mulțumim, <strong>${name}</strong>, pentru că ai contactat CosmaTech Solutions. Mesajul tău a fost înregistrat, iar inginerii noștri îți vor răspunde la adresa <strong>${email}</strong> în maximum 24 de ore.`
             : `Thank you, <strong>${name}</strong>, for contacting CosmaTech Solutions. Your message has been recorded, and our engineers will reply to you at <strong>${email}</strong> within 24 hours.`
      );

      contactForm.reset();
    });
  }

  function showSuccessNotification(title, htmlContent) {
    const notificationBackdrop = document.createElement('div');
    notificationBackdrop.className = 'modal-backdrop show';
    notificationBackdrop.style.zIndex = '3000';
    
    notificationBackdrop.innerHTML = `
      <div class="modal-window glass-card animate-on-scroll show" style="max-width: 450px; text-align: center; margin: auto;">
        <div class="modal-body">
          <div class="service-icon" style="margin: 0 auto 20px; width: 64px; height: 64px; border-radius: 50%; font-size: 1.5rem; background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.2); color: #10B981; display:flex; align-items:center; justify-content:center;">
            <i class="fas fa-check"></i>
          </div>
          <h3 style="margin-bottom: 12px; font-size: 1.4rem; color: #FFFFFF;">${title}</h3>
          <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.6; margin-bottom: 24px;">${htmlContent}</p>
          <button class="btn btn-primary btn-close-notify" style="width: 100%;">${isRo ? 'Am înțeles' : 'Got it'}</button>
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

});
