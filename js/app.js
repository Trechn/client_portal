/* ==========================================================================
   STATE MANAGEMENT & STORAGE INITIALIZATION
   ========================================================================== */

// Key used to store array of client objects in browser LocalStorage
const STORAGE_KEY = 'client_dashboard_data';

// App State: Keeps an array of clients and tracks which client detail page is currently open
let clients = JSON.parse(localStorage.getItem(STORAGE_KEY)) || getInitialDemoData();
let activeClientId = null;

// Save state to LocalStorage
function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
  updateStats();
}

// Stores the ID of the client being edited (null = creating new)
let editingClientId = null; 

/* ==========================================================================
   DOM ELEMENT SELECTION
   ========================================================================== */
const navTableViewBtn = document.getElementById('nav-table-view');
const navGridViewBtn = document.getElementById('nav-grid-view');
const sectionTableView = document.getElementById('section-table-view');
const sectionGridView = document.getElementById('section-grid-view');
const sectionDetailView = document.getElementById('section-detail-view');
const viewTitle = document.getElementById('view-title');

const tableBody = document.getElementById('table-body');
const gridCardsContainer = document.getElementById('grid-cards-container');
const detailContent = document.getElementById('detail-content');
const btnBackToTable = document.getElementById('btn-back-to-table');

const modalBackdrop = document.getElementById('modal-backdrop');
const btnOpenModal = document.getElementById('btn-open-modal');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancelModal = document.getElementById('btn-cancel-modal');
const clientForm = document.getElementById('client-form');

const statTotal = document.getElementById('stat-total');
const statActive = document.getElementById('stat-active');

const sidebar = document.getElementById('sidebar');
const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');

const modalTitle = document.getElementById('modal-title');
const btnSubmitClient = clientForm.querySelector('button[type="submit"]');

// Data Export / Import Modal Elements
const dataModalBackdrop = document.getElementById('data-modal-backdrop');
const btnOpenDataModal = document.getElementById('btn-open-data-modal');
const btnCloseDataModal = document.getElementById('btn-close-data-modal');
const btnCancelDataModal = document.getElementById('btn-cancel-data-modal');
const btnExportJson = document.getElementById('btn-export-json');
const btnTriggerImport = document.getElementById('btn-trigger-import');
const inputImportJson = document.getElementById('input-import-json');
const importFeedback = document.getElementById('import-feedback');

// Search Modal Elements
const btnOpenSearchModal = document.getElementById('btn-open-search-modal');
const searchModalBackdrop = document.getElementById('search-modal-backdrop');
const btnCloseSearchModal = document.getElementById('btn-close-search-modal');
const globalSearchInput = document.getElementById('global-search-input');
const btnClearSearch = document.getElementById('btn-clear-search');
const searchResultsMeta = document.getElementById('search-results-meta');
const searchResultsGrid = document.getElementById('search-results-grid');

/* ==========================================================================
   NAVIGATION & VIEW SWITCHING LOGIC
   ========================================================================== */

function switchView(viewName) {
  // Hide all sections first
  sectionTableView.classList.remove('active');
  sectionGridView.classList.remove('active');
  sectionDetailView.classList.remove('active');
  
  // Reset active classes on sidebar buttons
  navTableViewBtn.classList.remove('active');
  navGridViewBtn.classList.remove('active');

  if (viewName === 'table') {
    sectionTableView.classList.add('active');
    navTableViewBtn.classList.add('active');
    viewTitle.textContent = 'Spreadsheet Directory';
    renderTable();
  } else if (viewName === 'grid') {
    sectionGridView.classList.add('active');
    navGridViewBtn.classList.add('active');
    viewTitle.textContent = 'Client Cards Grid';
    renderGrid();
  } else if (viewName === 'detail') {
    sectionDetailView.classList.add('active');
    viewTitle.textContent = 'Client Profile & Task Manager';
  }
}

navTableViewBtn.addEventListener('click', () => switchView('table'));
navGridViewBtn.addEventListener('click', () => switchView('grid'));
btnBackToTable.addEventListener('click', () => switchView('table'));

/* ==========================================================================
   SIDEBAR COLLAPSE / EXPAND LOGIC
   ========================================================================== */
const SIDEBAR_STATE_KEY = 'client_dashboard_sidebar_collapsed';

// Restore saved sidebar state on page load
if (localStorage.getItem(SIDEBAR_STATE_KEY) === 'true') {
  sidebar.classList.add('collapsed');
}

// Toggle collapsed class & save preference
btnToggleSidebar.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
  const isCollapsed = sidebar.classList.contains('collapsed');
  localStorage.setItem(SIDEBAR_STATE_KEY, isCollapsed);
});

/* ==========================================================================
   VIEW 1: RENDERING THE SPREADSHEET TABLE
   ========================================================================== */

function renderTable() {
  tableBody.innerHTML = '';

  if (clients.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="10" style="text-align:center; color: var(--text-muted);">No clients registered yet.</td></tr>`;
    return;
  }

  // Iterate over each client object and create table row (tr) HTML
  clients.forEach(client => {
    const tr = document.createElement('tr');
    
    tr.innerHTML = `
      <td><a class="link-client-name" data-id="${client.id}">${escapeHtml(client.name)}</a></td>
      <td>${escapeHtml(client.invoice)}</td>
      <td>${escapeHtml(client.phone)}</td>
      <td>${escapeHtml(client.email)}</td>
      <td>${escapeHtml(client.address)}</td>
      <td>${escapeHtml(client.comments)}</td>
      <td>${escapeHtml(client.contactDate)}</td>
      <td><span class="badge badge-${slugify(client.projectStatus)}">${client.projectStatus}</span></td>
      <td><span class="badge badge-${slugify(client.paymentStatus)}">${client.paymentStatus}</span></td>
      <td>
        <button class="btn btn-danger btn-delete" data-id="${client.id}">Delete</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  // Attach click listeners to view client detail or delete row
  tableBody.querySelectorAll('.link-client-name').forEach(link => {
    link.addEventListener('click', (e) => {
      openClientDetail(e.target.dataset.id);
    });
  });

  tableBody.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      deleteClient(e.target.dataset.id);
    });
  });
}

/* ==========================================================================
   VIEW 2: RENDERING THE CARDS GRID
   ========================================================================== */

function renderGrid() {
  gridCardsContainer.innerHTML = '';

  if (clients.length === 0) {
    gridCardsContainer.innerHTML = `<p style="color: var(--text-muted);">No clients registered yet.</p>`;
    return;
  }

  clients.forEach(client => {
    const card = document.createElement('div');
    card.className = 'client-card';
    card.innerHTML = `
      <div class="card-header">
        <h3>${escapeHtml(client.name)}</h3>
        <span class="badge badge-${slugify(client.projectStatus)}">${client.projectStatus}</span>
      </div>
      <div class="card-body">
        <p><strong>Invoice:</strong> ${escapeHtml(client.invoice)}</p>
        <p><strong>Email:</strong> ${escapeHtml(client.email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(client.phone)}</p>
        <p><strong>Payment:</strong> <span class="badge badge-${slugify(client.paymentStatus)}">${client.paymentStatus}</span></p>
      </div>
      <div class="card-footer">
        <button class="btn btn-secondary btn-open-detail" data-id="${client.id}">View Details</button>
        <button class="btn btn-danger btn-delete" data-id="${client.id}">Delete</button>
      </div>
    `;
    gridCardsContainer.appendChild(card);
  });

  gridCardsContainer.querySelectorAll('.btn-open-detail').forEach(btn => {
    btn.addEventListener('click', (e) => openClientDetail(e.target.dataset.id));
  });

  gridCardsContainer.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => deleteClient(e.target.dataset.id));
  });
}

/* ==========================================================================
   VIEW 3: CLIENT DETAIL & BASIC TASK MANAGEMENT
   ========================================================================== */

function openClientDetail(id) {
  activeClientId = id;
  const client = clients.find(c => c.id === id);
  if (!client) return;

  switchView('detail');

  detailContent.innerHTML = `
    <div class="detail-grid">
      <!-- Left Panel: Client Profile Data -->
      <div class="detail-panel">
        <div class="detail-panel-header">
          <h3>Client Profile Details</h3>
          <button class="btn btn-secondary btn-sm" id="btn-edit-client">✏️ Edit</button>
        </div>
        <div class="info-row"><span class="info-label">Client Name:</span> <strong>${escapeHtml(client.name)}</strong></div>
        <div class="info-row"><span class="info-label">Invoice Number:</span> <span>${escapeHtml(client.invoice)}</span></div>
        <div class="info-row"><span class="info-label">Phone Number:</span> <span>${escapeHtml(client.phone)}</span></div>
        <div class="info-row"><span class="info-label">Email Address:</span> <span>${escapeHtml(client.email)}</span></div>
        <div class="info-row"><span class="info-label">Address:</span> <span>${escapeHtml(client.address)}</span></div>
        <div class="info-row"><span class="info-label">Contact Date:</span> <span>${escapeHtml(client.contactDate)}</span></div>
        <div class="info-row"><span class="info-label">Project Status:</span> <span class="badge badge-${slugify(client.projectStatus)}">${client.projectStatus}</span></div>
        <div class="info-row"><span class="info-label">Payment Status:</span> <span class="badge badge-${slugify(client.paymentStatus)}">${client.paymentStatus}</span></div>
        <div class="info-row"><span class="info-label">Comments:</span> <span>${escapeHtml(client.comments || 'N/A')}</span></div>
      </div>

      <!-- Right Panel: Task Management for this Client -->
      <div class="detail-panel">
        <h3>Project Tasks</h3>
        <div class="task-input-box">
          <input type="text" id="new-task-input" placeholder="Add a new task (e.g., Send wireframe draft)...">
          <button class="btn btn-primary" id="btn-add-task">Add</button>
        </div>
        <ul class="task-list" id="task-list-container">
          <!-- Dynamically populated tasks -->
        </ul>
      </div>
    </div>
  `;

  renderTasks(client);

  // Add Task Button Click Listener
  document.getElementById('btn-add-task').addEventListener('click', () => {
    const input = document.getElementById('new-task-input');
    if (input.value.trim()) {
      client.tasks.push({ id: Date.now().toString(), text: input.value.trim(), completed: false });
      saveToStorage();
      renderTasks(client);
      input.value = '';
    }
  });

  // Edit Client Button Click Listener
  document.getElementById('btn-edit-client').addEventListener('click', () => {
    openEditModal(client);
  });
}

function renderTasks(client) {
  const container = document.getElementById('task-list-container');
  container.innerHTML = '';

  if (!client.tasks || client.tasks.length === 0) {
    container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem;">No tasks created for this project yet.</p>`;
    return;
  }

  client.tasks.forEach(task => {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''}`;
    li.innerHTML = `
      <div>
        <input type="checkbox" ${task.completed ? 'checked' : ''} class="chk-task-toggle" data-taskid="${task.id}">
        <span style="margin-left: 8px;">${escapeHtml(task.text)}</span>
      </div>
      <button class="btn btn-danger btn-delete-task" data-taskid="${task.id}">&times;</button>
    `;
    container.appendChild(li);
  });

  // Toggle Checkbox Listener
  container.querySelectorAll('.chk-task-toggle').forEach(chk => {
    chk.addEventListener('change', (e) => {
      const task = client.tasks.find(t => t.id === e.target.dataset.taskid);
      if (task) {
        task.completed = e.target.checked;
        saveToStorage();
        renderTasks(client);
      }
    });
  });

  // Delete Task Listener
  container.querySelectorAll('.btn-delete-task').forEach(btn => {
    btn.addEventListener('click', (e) => {
      client.tasks = client.tasks.filter(t => t.id !== e.target.dataset.taskid);
      saveToStorage();
      renderTasks(client);
    });
  });
}

/* ==========================================================================
   CLIENT REGISTRATION & FORM MODAL LOGIC
   ========================================================================== */

function openModal() {
  editingClientId = null;
  modalTitle.textContent = 'Register New Client';
  btnSubmitClient.textContent = 'Save Client';
  modalBackdrop.classList.add('active');
}

function openEditModal(client) {
  editingClientId = client.id;
  modalTitle.textContent = 'Edit Client Profile';
  btnSubmitClient.textContent = 'Update Client';

  // Pre-fill all form inputs with the client's current data
  document.getElementById('clientName').value = client.name;
  document.getElementById('invoice').value = client.invoice;
  document.getElementById('phoneNumber').value = client.phone;
  document.getElementById('email').value = client.email;
  document.getElementById('address').value = client.address;
  document.getElementById('comments').value = client.comments;
  document.getElementById('contactDate').value = client.contactDate;
  document.getElementById('projectStatus').value = client.projectStatus;
  document.getElementById('paymentStatus').value = client.paymentStatus;

  modalBackdrop.classList.add('active');
}

function closeModal() {
  modalBackdrop.classList.remove('active');
  clientForm.reset();
  editingClientId = null; // Always reset edit state on close
}

btnOpenModal.addEventListener('click', openModal);
btnCloseModal.addEventListener('click', closeModal);
btnCancelModal.addEventListener('click', closeModal);

clientForm.addEventListener('submit', (e) => {
  e.preventDefault();

  // Gather values from the form inputs
  const formData = {
    name: document.getElementById('clientName').value.trim(),
    invoice: document.getElementById('invoice').value.trim(),
    phone: document.getElementById('phoneNumber').value.trim(),
    email: document.getElementById('email').value.trim(),
    address: document.getElementById('address').value.trim(),
    comments: document.getElementById('comments').value.trim(),
    contactDate: document.getElementById('contactDate').value,
    projectStatus: document.getElementById('projectStatus').value,
    paymentStatus: document.getElementById('paymentStatus').value
  };

  if (editingClientId) {
    // UPDATE EXISTING CLIENT (preserving id and existing tasks array)
    const index = clients.findIndex(c => c.id === editingClientId);
    if (index !== -1) {
      clients[index] = { ...clients[index], ...formData };
    }
    const updatedId = editingClientId;
    saveToStorage();
    closeModal();
    openClientDetail(updatedId); // Re-render detail view immediately with updated info
  } else {
    // CREATE NEW CLIENT
    const newClient = {
      id: Date.now().toString(),
      ...formData,
      tasks: []
    };
    clients.unshift(newClient);
    saveToStorage();
    closeModal();

    if (sectionGridView.classList.contains('active')) {
      renderGrid();
    } else {
      switchView('table');
    }
  }
});

function deleteClient(id) {
  if (confirm('Are you sure you want to delete this client record?')) {
    clients = clients.filter(c => c.id !== id);
    saveToStorage();
    if (sectionGridView.classList.contains('active')) {
      renderGrid();
    } else {
      renderTable();
    }
  }
}

/* ==========================================================================
   UTILITY & HELPER FUNCTIONS
   ========================================================================== */

function updateStats() {
  statTotal.textContent = clients.length;
  const activeCount = clients.filter(c => c.projectStatus === 'In Progress').length;
  statActive.textContent = activeCount;
}

function slugify(text) {
  return text.toLowerCase().replace(/\s+/g, '-');
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, match => {
    const escapeMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return escapeMap[match];
  });
}

// Initial Mock Data to showcase UI upon first run
function getInitialDemoData() {
  return [
    {
      id: '1',
      name: 'Starlight Tech Solutions',
      invoice: 'INV-2024-001',
      phone: '+1 (555) 234-5678',
      email: 'admin@starlighttech.io',
      address: '742 Evergreen Terrace, Springfield',
      comments: 'Redesign landing page and integrate checkout UI.',
      contactDate: '2024-10-12',
      projectStatus: 'In Progress',
      paymentStatus: 'Pending',
      tasks: [
        { id: '101', text: 'Create high-fidelity Figma mockup', completed: true },
        { id: '102', text: 'Develop responsive front-end dashboard', completed: false }
      ]
    },
    {
      id: '2',
      name: 'Apex Horizon Marketing',
      invoice: 'INV-2024-002',
      phone: '+1 (555) 987-6543',
      email: 'billing@apexhorizon.com',
      address: '100 Market St, San Francisco, CA',
      comments: 'Monthly maintenance contract.',
      contactDate: '2024-10-01',
      projectStatus: 'Completed',
      paymentStatus: 'Paid',
      tasks: [
        { id: '103', text: 'Update SEO meta tags', completed: true }
      ]
    }
  ];
}

/* ==========================================================================
   DATA EXPORT & IMPORT (JSON BACKUP / RESTORE)
   ========================================================================== */

function openDataModal() {
  importFeedback.textContent = '';
  importFeedback.className = 'import-feedback';
  dataModalBackdrop.classList.add('active');
}

function closeDataModal() {
  dataModalBackdrop.classList.remove('active');
  inputImportJson.value = ''; // Reset file input so same file can be re-selected
}

btnOpenDataModal.addEventListener('click', openDataModal);
btnCloseDataModal.addEventListener('click', closeDataModal);
btnCancelDataModal.addEventListener('click', closeDataModal);

// 1. EXPORT: Convert clients array to a downloadable .json file
btnExportJson.addEventListener('click', () => {
  const jsonString = JSON.stringify(clients, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  // Create a temporary invisible <a> link and trigger click to download
  const downloadLink = document.createElement('a');
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  downloadLink.href = url;
  downloadLink.download = `client-dashboard-backup-${today}.json`;

  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
});

// 2. IMPORT: Trigger hidden file picker when styled button is clicked
btnTriggerImport.addEventListener('click', () => {
  inputImportJson.click();
});

// 3. IMPORT: Read & validate uploaded JSON file
inputImportJson.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = (event) => {
    try {
      const importedData = JSON.parse(event.target.result);

      // Basic validation: Make sure it's an array of objects with at least a name
      if (!Array.isArray(importedData)) {
        throw new Error('Invalid format: Expected a list of clients.');
      }

      // Normalize imported items so missing tasks/ids don't break the UI
      const sanitizedClients = importedData.map((item, index) => ({
        id: item.id ? String(item.id) : `${Date.now()}-${index}`,
        name: item.name || 'Unnamed Client',
        invoice: item.invoice || 'N/A',
        phone: item.phone || '',
        email: item.email || '',
        address: item.address || '',
        comments: item.comments || '',
        contactDate: item.contactDate || '',
        projectStatus: item.projectStatus || 'Not Started',
        paymentStatus: item.paymentStatus || 'Pending',
        tasks: Array.isArray(item.tasks) ? item.tasks : []
      }));

      // Check which radio button is selected ('replace' or 'merge')
      const selectedMode = document.querySelector('input[name="importMode"]:checked').value;

      if (selectedMode === 'replace') {
        clients = sanitizedClients;
      } else {
        // Merge: Avoid duplicate IDs by generating fresh IDs for merged items if needed
        const existingIds = new Set(clients.map(c => c.id));
        const mergedItems = sanitizedClients.map((client, idx) => {
          if (existingIds.has(client.id)) {
            return { ...client, id: `${Date.now()}-${idx}` };
          }
          return client;
        });
        clients = [...mergedItems, ...clients];
      }

      saveToStorage();

      // Refresh active view
      if (sectionGridView.classList.contains('active')) {
        renderGrid();
      } else {
        switchView('table');
      }

      importFeedback.textContent = `Successfully imported ${sanitizedClients.length} client(s)!`;
      importFeedback.className = 'import-feedback success';
    } catch (err) {
      importFeedback.textContent = `Error reading file: ${err.message}`;
      importFeedback.className = 'import-feedback error';
    }
  };

  reader.readAsText(file);
});

/* ==========================================================================
   GLOBAL SEARCH POPUP & ALL-FIELDS FILTERING
   ========================================================================== */

function openSearchModal() {
  searchModalBackdrop.classList.add('active');
  globalSearchInput.value = '';
  renderSearchResults('');
  // Focus input immediately so the user can start typing right away
  setTimeout(() => globalSearchInput.focus(), 50);
}

function closeSearchModal() {
  searchModalBackdrop.classList.remove('active');
}

function renderSearchResults(query) {
  const cleanQuery = query.trim().toLowerCase();

  // Filter across ALL client fields (plus task descriptions)
  const matches = clients.filter(client => {
    if (!cleanQuery) return true;

    const taskText = Array.isArray(client.tasks)
      ? client.tasks.map(t => t.text).join(' ')
      : '';

    const searchableContent = [
      client.name,
      client.invoice,
      client.phone,
      client.email,
      client.address,
      client.comments,
      client.contactDate,
      client.projectStatus,
      client.paymentStatus,
      taskText
    ]
      .join(' ')
      .toLowerCase();

    return searchableContent.includes(cleanQuery);
  });

  // Update result counter label
  searchResultsMeta.textContent = cleanQuery
    ? `Found ${matches.length} matching client(s)`
    : `Showing all ${matches.length} client(s)`;

  searchResultsGrid.innerHTML = '';

  if (matches.length === 0) {
    searchResultsGrid.innerHTML = `
      <p style="color: var(--text-muted); grid-column: 1 / -1; padding: 20px 0;">
        No clients match "${escapeHtml(query)}".
      </p>`;
    return;
  }

  // Render 2-column client cards using your existing card classes
  matches.forEach(client => {
    const card = document.createElement('div');
    card.className = 'client-card';
    card.innerHTML = `
      <div class="card-header">
        <h3>${escapeHtml(client.name)}</h3>
        <span class="badge badge-${slugify(client.projectStatus)}">${client.projectStatus}</span>
      </div>
      <div class="card-body">
        <p><strong>Invoice:</strong> ${escapeHtml(client.invoice)}</p>
        <p><strong>Email:</strong> ${escapeHtml(client.email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(client.phone || 'N/A')}</p>
        <p><strong>Address:</strong> ${escapeHtml(client.address || 'N/A')}</p>
        <p><strong>Payment:</strong> <span class="badge badge-${slugify(client.paymentStatus)}">${client.paymentStatus}</span></p>
      </div>
      <div class="card-footer">
        <button class="btn btn-primary btn-sm btn-search-open-detail" data-id="${client.id}">Open Profile</button>
      </div>
    `;
    searchResultsGrid.appendChild(card);
  });

  // Clicking "Open Profile" closes the search popup and opens that client's detail view
  searchResultsGrid.querySelectorAll('.btn-search-open-detail').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetId = e.target.dataset.id;
      closeSearchModal();
      openClientDetail(targetId);
    });
  });
}

btnOpenSearchModal.addEventListener('click', openSearchModal);
btnCloseSearchModal.addEventListener('click', closeSearchModal);

// Close popup if clicking outside the modal box
searchModalBackdrop.addEventListener('click', (e) => {
  if (e.target === searchModalBackdrop) closeSearchModal();
});

// Close popup when pressing Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && searchModalBackdrop.classList.contains('active')) {
    closeSearchModal();
  }
});

// Filter live on every keystroke
globalSearchInput.addEventListener('input', (e) => {
  renderSearchResults(e.target.value);
});

// Clear search input button
btnClearSearch.addEventListener('click', () => {
  globalSearchInput.value = '';
  renderSearchResults('');
  globalSearchInput.focus();
});

// App Kickoff on DOM Load
document.addEventListener('DOMContentLoaded', () => {
  renderTable();
  updateStats();
});