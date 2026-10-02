(() => {
  const quoteStatuses = ['New', 'Contacted', 'Quoted', 'Accepted', 'Declined'];
  const jobStatuses = ['To Do', 'In Progress', 'Waiting', 'Complete'];
  let client;
  let requests = [];
  let jobs = [];

  const byId = (id) => document.getElementById(id);
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
  const optionsHtml = (items, selected) => items.map((item) =>
    `<option value="${escapeHtml(item)}" ${item === selected ? 'selected' : ''}>${escapeHtml(item)}</option>`
  ).join('');

  function showMessage(message, kind = 'success') {
    const box = byId('adminMessage');
    box.textContent = message;
    box.className = `admin-message ${kind}`;
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function clearMessage() {
    const box = byId('adminMessage');
    box.textContent = '';
    box.className = 'admin-message';
  }

  function asText(value) {
    if (Array.isArray(value)) return value.map((item) => String(item)).join('\n');
    return value ? String(value) : '';
  }

  function renderRequests() {
    const body = byId('quoteRows');
    if (!requests.length) {
      body.innerHTML = '<tr><td colspan="6" class="admin-empty">No quote requests yet. New website and hosting requests will appear here.</td></tr>';
      return;
    }

    body.innerHTML = requests.map((request) => {
      const date = request.created_at ? new Date(request.created_at).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      }) : '—';
      const relatedJob = jobs.find((job) => job.quote_id === request.id);
      const details = [asText(request.details), request.description].filter(Boolean).join('\n');
      return `<tr>
        <td>${escapeHtml(date)}</td>
        <td><strong>${escapeHtml(request.customer_name)}</strong><span class="admin-small">${escapeHtml(request.customer_email)}</span><span class="admin-small">${escapeHtml(request.customer_phone)}</span></td>
        <td><strong>${escapeHtml(request.service_type)}</strong><div class="admin-detail">${escapeHtml(details || 'No extra details provided')}</div></td>
        <td>${escapeHtml(request.estimated_price)}</td>
        <td><select class="form-control admin-status" data-request-status="${escapeHtml(request.id)}" aria-label="Request status">${optionsHtml(quoteStatuses, request.status)}</select></td>
        <td><div class="admin-inline-actions"><button class="btn btn-secondary" data-save-request="${escapeHtml(request.id)}" type="button">Save status</button>${relatedJob
          ? '<span class="admin-small">Job created</span>'
          : `<button class="btn btn-primary" data-create-job="${escapeHtml(request.id)}" type="button">Create job</button>`}</div></td>
      </tr>`;
    }).join('');

    body.querySelectorAll('[data-save-request]').forEach((button) => {
      button.addEventListener('click', () => updateRequestStatus(button.dataset.saveRequest, button));
    });
    body.querySelectorAll('[data-create-job]').forEach((button) => {
      button.addEventListener('click', () => createJobFromRequest(button.dataset.createJob, button));
    });
  }

  function renderJobs() {
    const body = byId('jobRows');
    if (!jobs.length) {
      body.innerHTML = '<tr><td colspan="6" class="admin-empty">No jobs yet. Create one here or turn an accepted quote into a job.</td></tr>';
      return;
    }

    body.innerHTML = jobs.map((job) => `<tr data-job-row="${escapeHtml(job.id)}">
      <td><input class="form-control" data-job-title value="${escapeHtml(job.title)}" maxlength="160" aria-label="Job title"></td>
      <td><strong>${escapeHtml(job.customer_name || '—')}</strong><span class="admin-small">${escapeHtml(job.customer_email || '')}</span><span class="admin-small">${escapeHtml(job.customer_phone || '')}</span></td>
      <td><input class="form-control" data-job-due type="date" value="${escapeHtml(job.due_date || '')}" aria-label="Job due date"></td>
      <td><select class="form-control admin-status" data-job-status aria-label="Job status">${optionsHtml(jobStatuses, job.status)}</select></td>
      <td><textarea class="form-control" data-job-description rows="3" maxlength="5000" aria-label="Job notes">${escapeHtml(job.description || '')}</textarea></td>
      <td><button class="btn btn-secondary" type="button" data-save-job="${escapeHtml(job.id)}">Save</button></td>
    </tr>`).join('');

    body.querySelectorAll('[data-save-job]').forEach((button) => {
      button.addEventListener('click', () => saveJob(button.dataset.saveJob, button));
    });
  }

  function renderMetrics() {
    byId('metricNewQuotes').textContent = requests.filter((request) => request.status === 'New').length;
    byId('metricAcceptedQuotes').textContent = requests.filter((request) => request.status === 'Accepted').length;
    byId('metricOpenJobs').textContent = jobs.filter((job) => job.status !== 'Complete').length;
    byId('metricCompletedJobs').textContent = jobs.filter((job) => job.status === 'Complete').length;
  }

  async function loadWorkspace() {
    clearMessage();
    const [requestResult, jobResult] = await Promise.all([
      client.from('quote_requests').select('*').order('created_at', { ascending: false }),
      client.from('jobs').select('*').order('due_date', { ascending: true, nullsFirst: false }).order('created_at', { ascending: false })
    ]);
    if (requestResult.error) throw requestResult.error;
    if (jobResult.error) throw jobResult.error;
    requests = requestResult.data || [];
    jobs = jobResult.data || [];
    renderRequests();
    renderJobs();
    renderMetrics();
  }

  async function updateRequestStatus(id, button) {
    const status = document.querySelector(`[data-request-status="${CSS.escape(id)}"]`)?.value;
    if (!quoteStatuses.includes(status)) return;
    button.disabled = true;
    try {
      const { error } = await client.from('quote_requests').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      await loadWorkspace();
      showMessage('Quote request status saved.');
    } catch (error) {
      showMessage(error.message || 'Could not save this request.', 'error');
    } finally {
      button.disabled = false;
    }
  }

  async function createJobFromRequest(id, button) {
    const request = requests.find((item) => item.id === id);
    if (!request) return;
    button.disabled = true;
    try {
      const { error: updateError } = await client.from('quote_requests')
        .update({ status: 'Accepted', updated_at: new Date().toISOString() }).eq('id', request.id);
      if (updateError) throw updateError;
      const { error: insertError } = await client.from('jobs').insert({
        quote_id: request.id,
        title: `${request.service_type} — ${request.customer_name}`,
        customer_name: request.customer_name,
        customer_email: request.customer_email,
        customer_phone: request.customer_phone,
        description: [asText(request.details), request.description].filter(Boolean).join('\n')
      });
      if (insertError) throw insertError;
      await loadWorkspace();
      showMessage('Job created from the quote request.');
    } catch (error) {
      showMessage(error.message || 'Could not create a job from this request.', 'error');
    } finally {
      button.disabled = false;
    }
  }

  async function saveJob(id, button) {
    const row = button.closest('[data-job-row]');
    const title = row.querySelector('[data-job-title]').value.trim();
    if (!title) {
      showMessage('Each job needs a title.', 'error');
      return;
    }
    button.disabled = true;
    try {
      const { error } = await client.from('jobs').update({
        title,
        due_date: row.querySelector('[data-job-due]').value || null,
        status: row.querySelector('[data-job-status]').value,
        description: row.querySelector('[data-job-description]').value.trim(),
        updated_at: new Date().toISOString()
      }).eq('id', id);
      if (error) throw error;
      await loadWorkspace();
      showMessage('Job updated.');
    } catch (error) {
      showMessage(error.message || 'Could not update this job.', 'error');
    } finally {
      button.disabled = false;
    }
  }

  async function addJob(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('button[type="submit"]');
    const title = byId('jobTitle').value.trim();
    if (!title) return;
    button.disabled = true;
    try {
      const { error } = await client.from('jobs').insert({
        title,
        customer_name: byId('jobCustomer').value.trim(),
        customer_email: byId('jobEmail').value.trim(),
        due_date: byId('jobDueDate').value || null,
        description: byId('jobDescription').value.trim()
      });
      if (error) throw error;
      form.reset();
      await loadWorkspace();
      showMessage('Job added to your list.');
    } catch (error) {
      showMessage(error.message || 'Could not add this job.', 'error');
    } finally {
      button.disabled = false;
    }
  }

  async function initialize() {
    const loading = byId('adminLoading');
    const workspace = byId('adminWorkspace');
    try {
      client = window.supabaseClient;
      if (!client) throw new Error('The Supabase client could not start. Reload and try again.');
      const { data: { session }, error: sessionError } = await client.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) {
        window.location.href = 'signin.html';
        return;
      }

      const { data: membership, error: membershipError } = await client.from('admin_users')
        .select('user_id').eq('user_id', session.user.id).maybeSingle();
      if (membershipError) {
        throw new Error('Admin access has not been set up for this project yet. Apply the admin setup in supabase/schema.sql and add your website account to admin_users.');
      }
      if (!membership) {
        throw new Error('This account is not on the admin list. Ask the project owner to grant admin access to your website account.');
      }

      loading.classList.add('admin-hidden');
      workspace.classList.remove('admin-hidden');
      await loadWorkspace();
    } catch (error) {
      loading.textContent = error.message || 'Could not open the admin workspace.';
      loading.classList.remove('admin-hidden');
      loading.classList.add('admin-message', 'error');
    }
  }

  byId('refreshAdmin').addEventListener('click', async () => {
    try { await loadWorkspace(); showMessage('Workspace refreshed.'); }
    catch (error) { showMessage(error.message || 'Could not refresh the workspace.', 'error'); }
  });
  byId('newJobForm').addEventListener('submit', addJob);
  byId('adminLogout').addEventListener('click', async () => {
    const { error } = await window.supabaseClient.auth.signOut();
    if (error) showMessage(error.message, 'error');
    else window.location.href = 'signin.html';
  });

  document.addEventListener('DOMContentLoaded', initialize);
})();
