// demo.js - Complete Fixed Version with Navigation

// Global variables
let leads = [];
let filteredLeads = [];
let currentEditingLead = null;
let currentDeleteLead = null;
let currentView = 'cards';
let currentPage = 1;
let itemsPerPage = 12;
let uploadedFiles = [];
let totalLeadsCount = 0;

// API Base URL
const API_BASE_URL = 'https://crm-admin-panel-production.up.railway.app/api';

// ✅ ADD: Navigation function matching MAIN_PAGE/script.js
function handleNavigation(page) {
    console.log(`Navigation requested to: ${page}`);
    
    const routes = {
        'dashboard': '/MAIN_PAGE/index.html',
        'leads': '/show_new_demo/show.html',
        'industry-leads': '/INDUSTRY_LEAD_PAGE/demo.html',
        'deals': '/DEAL/deal.html',
        'contacts': '/CONTACT/contact.html',
        'invoice': '/INVOICE/invoice.html',
        'reports': '/REPORTS/reports.html',
        'settings': '/SETTINGS/setting.html',
        'salary': '/SALARY/Salary.html'
    };
    
    const route = routes[page];
    
    if (route) {
        showNotification(`Loading ${getPageTitle(page)}...`, 'info');
        setTimeout(() => {
            console.log(`Redirecting to: ${route}`);
            window.location.href = route;
        }, 500);
    } else {
        console.warn(`No route defined for page: ${page}`);
        showNotification(`Page ${page} is not available yet`, 'warning');
    }
}

// ✅ ADD: Get page title function
function getPageTitle(page) {
    const titles = {
        'dashboard': 'Dashboard',
        'leads': 'Leads Management',
        'industry-leads': 'Industry Leads',
        'deals': 'Deals Pipeline',
        'contacts': 'Contacts',
        'invoice': 'Invoices',
        'reports': 'Reports',
        'settings': 'Settings',
        'salary': 'Salary'
    };
    return titles[page] || page.replace('-', ' ');
}

// ✅ ADD: Navigation event listeners setup
function setupNavigationEventListeners() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.dataset.page;
            console.log(`Nav link clicked: ${page}`);
            
            if (page && page !== 'unknown') {
                handleNavigation(page);
            } else {
                console.warn('No valid page specified for navigation');
                showNotification('Navigation not available', 'warning');
            }
        });
    });
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Demo.js - DOM Content Loaded');
    initializeLeads();
    setupEventListeners();
    displayUserName();
    
    // Load leads and stats immediately
    loadLeads().then(() => {
        console.log('Leads and stats loaded successfully');
    }).catch(error => {
        console.error('Failed to load leads:', error);
    });
    
    // Load sidebar state
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (sidebarCollapsed) {
        document.querySelector('.app-container').classList.add('sidebar-collapsed');
    }
});

function initializeLeads() {
    console.log('Industry Leads System initialized with backend integration');
    setupNavigationEventListeners(); // ✅ ADD THIS LINE
}

function setupEventListeners() {
    // ✅ ADD: Navigation event listeners
    setupNavigationEventListeners();

    // Modal close events
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-overlay')) {
            closeAllModals();
        }
    });

    // Escape key to close modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.user-profile') && !e.target.closest('.user-dropdown')) {
            closeAllDropdowns();
        }
        if (!e.target.closest('.notifications') && !e.target.closest('.notifications-dropdown')) {
            closeAllDropdowns();
        }
    });
}

function displayUserName() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const userNameElement = document.getElementById('userDisplayName');
    
    if (userData && userData.name) {
        userNameElement.textContent = userData.name;
    } else {
        userNameElement.textContent = 'User';
    }
}

async function loadLeads() {
    try {
        showLoading(true);
        
        const token = localStorage.getItem('authToken');
        if (!token) {
            showNotification('Please login to access leads', 'error');
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
            return;
        }

        const search = document.querySelector('.search-input')?.value || '';
        const sourceFilter = document.getElementById('sourceFilter')?.value || '';
        const statusFilter = document.getElementById('statusFilter')?.value || '';
        const countryFilter = document.getElementById('countryFilter')?.value || '';
        const sortBy = document.getElementById('sortBy')?.value || 'created_desc';

        // Parse sort parameters
        let sortField = 'createdAt';
        let sortOrder = 'desc';
        
        if (sortBy === 'name_asc') {
            sortField = 'contactName';
            sortOrder = 'asc';
        } else if (sortBy === 'name_desc') {
            sortField = 'contactName';
            sortOrder = 'desc';
        } else if (sortBy === 'company_asc') {
            sortField = 'companyName';
            sortOrder = 'asc';
        } else if (sortBy === 'created_asc') {
            sortField = 'createdAt';
            sortOrder = 'asc';
        }

        const params = new URLSearchParams({
            page: currentPage,
            limit: itemsPerPage,
            ...(search && { search }),
            ...(sourceFilter && { leadSource: sourceFilter }),
            ...(statusFilter && { leadStatus: statusFilter }),
            ...(countryFilter && { companyCountry: countryFilter }),
            sortBy: sortField,
            sortOrder: sortOrder
        });

        const response = await fetch(`${API_BASE_URL}/industry-leads?${params}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            leads = result.data.map(lead => ({
                id: lead._id,
                contactName: lead.contactName,
                clientEmail: lead.clientEmail,
                jobTitle: lead.jobTitle,
                companyName: lead.companyName,
                companyWebsite: lead.companyWebsite,
                companyCountry: lead.companyCountry,
                clientPhone: lead.clientPhone,
                companyPhone: lead.companyPhone,
                industryType: lead.industryType,
                companySize: lead.companySize,
                annualRevenue: lead.annualRevenue,
                leadSource: lead.leadSource,
                leadStatus: lead.leadStatus,
                isProspect: lead.isProspect,
                emailMessage: lead.emailMessage,
                leadNotes: lead.leadNotes,
                createdDate: lead.createdAt,
                lastContactDate: lead.lastContactDate,
                attachments: lead.attachments || []
            }));

            filteredLeads = [...leads];
            totalLeadsCount = result.pagination.totalLeads;
            
            // Update stats with real data from backend
            updateStats(result.stats);
            renderLeads();
            updatePagination(result.pagination);
        } else {
            throw new Error(result.message || 'Failed to load leads');
        }
    } catch (error) {
        console.error('Error loading leads:', error);
        showNotification('Failed to load leads: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function saveLeadToAPI(leadData, isUpdate = false) {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('Authentication required');
        }

        const url = isUpdate 
            ? `${API_BASE_URL}/industry-leads/${currentEditingLead.id}`
            : `${API_BASE_URL}/industry-leads`;
        
        const method = isUpdate ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(leadData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
            return result.data;
        } else {
            throw new Error(result.message || 'Failed to save lead');
        }
    } catch (error) {
        console.error('Error saving lead:', error);
        throw error;
    }
}

async function deleteLeadFromAPI(leadId) {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await fetch(`${API_BASE_URL}/industry-leads/${leadId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Failed to delete lead');
        }

        return result;
    } catch (error) {
        console.error('Error deleting lead:', error);
        throw error;
    }
}

async function bulkUpdateStatusAPI(leadIds, status) {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await fetch(`${API_BASE_URL}/industry-leads/bulk-status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ leadIds, status })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Failed to update leads');
        }

        return result;
    } catch (error) {
        console.error('Error bulk updating leads:', error);
        throw error;
    }
}

async function bulkDeleteLeadsAPI(leadIds) {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await fetch(`${API_BASE_URL}/industry-leads/bulk-delete`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ leadIds })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Failed to delete leads');
        }

        return result;
    } catch (error) {
        console.error('Error bulk deleting leads:', error);
        throw error;
    }
}

// Lead Management Functions
function addNewLead() {
    currentEditingLead = null;
    document.getElementById('leadModalTitle').textContent = 'Add New Industry Lead';
    
    // Clear form
    clearLeadForm();
    
    const modal = document.getElementById('leadModal');
    modal.style.display = 'flex';
    modal.classList.add('show');
}

function editLead(leadId) {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;
    
    currentEditingLead = lead;
    document.getElementById('leadModalTitle').textContent = 'Edit Industry Lead';
    
    // Populate form
    populateLeadForm(lead);
    
    const modal = document.getElementById('leadModal');
    modal.style.display = 'flex';
    modal.classList.add('show');
}

function populateLeadForm(lead) {
    document.getElementById('contactName').value = lead.contactName || '';
    document.getElementById('clientEmail').value = lead.clientEmail || '';
    document.getElementById('jobTitle').value = lead.jobTitle || '';
    document.getElementById('clientPhone').value = lead.clientPhone || '';
    document.getElementById('companyName').value = lead.companyName || '';
    document.getElementById('companyWebsite').value = lead.companyWebsite || '';
    document.getElementById('companyCountry').value = lead.companyCountry || '';
    document.getElementById('companyPhone').value = lead.companyPhone || '';
    document.getElementById('industryType').value = lead.industryType || '';
    document.getElementById('companySize').value = lead.companySize || '';
    document.getElementById('annualRevenue').value = lead.annualRevenue || '';
    document.getElementById('leadSource').value = lead.leadSource || '';
    document.getElementById('leadStatus').value = lead.leadStatus || 'new';
    document.getElementById('isProspect').checked = lead.isProspect || false;
    document.getElementById('emailMessage').value = lead.emailMessage || '';
    document.getElementById('leadNotes').value = lead.leadNotes || '';
}

function clearLeadForm() {
    const form = document.getElementById('leadForm');
    form.reset();
    uploadedFiles = [];
    updateUploadedFilesDisplay();
}

async function saveLead() {
    try {
        const formData = getLeadFormData();
        
        // Validation
        if (!formData.contactName || !formData.clientEmail || !formData.companyName || !formData.leadSource) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        if (!isValidEmail(formData.clientEmail)) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }

        showLoading(true);

        // Prepare data for API
        const apiData = {
            contactName: formData.contactName,
            clientEmail: formData.clientEmail,
            jobTitle: formData.jobTitle,
            companyName: formData.companyName,
            companyWebsite: formData.companyWebsite,
            companyCountry: formData.companyCountry,
            clientPhone: formData.clientPhone,
            companyPhone: formData.companyPhone,
            industryType: formData.industryType,
            companySize: formData.companySize,
            annualRevenue: formData.annualRevenue,
            leadSource: formData.leadSource,
            leadStatus: formData.leadStatus,
            isProspect: formData.isProspect,
            emailMessage: formData.emailMessage,
            leadNotes: formData.leadNotes,
            attachments: uploadedFiles
        };

        const savedLead = await saveLeadToAPI(apiData, !!currentEditingLead);

        showNotification(
            `Industry lead ${currentEditingLead ? 'updated' : 'added'} successfully`, 
            'success'
        );

        closeLeadModal();
        await loadLeads(); // This will reload stats too
        
    } catch (error) {
        console.error('Error saving lead:', error);
        showNotification('Failed to save lead: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function confirmDelete() {
    if (!currentDeleteLead) return;
    
    try {
        showLoading(true);
        await deleteLeadFromAPI(currentDeleteLead.id);
        
        showNotification('Industry lead deleted successfully', 'success');
        closeDeleteModal();
        await loadLeads(); // This will reload stats too
        
    } catch (error) {
        console.error('Error deleting lead:', error);
        showNotification('Failed to delete lead: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Manual stats refresh function
async function refreshStats() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/industry-leads?page=1&limit=1`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                updateStats(result.stats);
            }
        }
    } catch (error) {
        console.error('Error refreshing stats:', error);
        calculateStatsFromLeads(); // Fallback to local calculation
    }
}

// Call this on page load and after operations
refreshStats();

function getLeadFormData() {
    return {
        contactName: document.getElementById('contactName').value.trim(),
        clientEmail: document.getElementById('clientEmail').value.trim(),
        jobTitle: document.getElementById('jobTitle').value.trim(),
        clientPhone: document.getElementById('clientPhone').value.trim(),
        companyName: document.getElementById('companyName').value.trim(),
        companyWebsite: document.getElementById('companyWebsite').value.trim(),
        companyCountry: document.getElementById('companyCountry').value,
        companyPhone: document.getElementById('companyPhone').value.trim(),
        industryType: document.getElementById('industryType').value,
        companySize: document.getElementById('companySize').value,
        annualRevenue: document.getElementById('annualRevenue').value,
        leadSource: document.getElementById('leadSource').value,
        leadStatus: document.getElementById('leadStatus').value,
        isProspect: document.getElementById('isProspect').checked,
        emailMessage: document.getElementById('emailMessage').value.trim(),
        leadNotes: document.getElementById('leadNotes').value.trim()
    };
}

function deleteLead(leadId) {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;
    
    currentDeleteLead = {
        id: leadId,
        name: lead.contactName
    };
    
    document.getElementById('deleteItemName').textContent = lead.contactName;
    document.getElementById('deleteModal').style.display = 'flex';
}

async function confirmDelete() {
    if (!currentDeleteLead) return;
    
    try {
        showLoading(true);
        await deleteLeadFromAPI(currentDeleteLead.id);
        
        showNotification('Industry lead deleted successfully', 'success');
        closeDeleteModal();
        await loadLeads(); // Reload leads from server
        
    } catch (error) {
        console.error('Error deleting lead:', error);
        showNotification('Failed to delete lead: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function viewLeadDetails(leadId) {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            showNotification('Please login to view lead details', 'error');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/industry-leads/${leadId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            const lead = result.data;
            renderLeadDetails(lead);
            document.getElementById('leadDetailsModal').style.display = 'flex';
        } else {
            throw new Error(result.message || 'Failed to load lead details');
        }
    } catch (error) {
        console.error('Error loading lead details:', error);
        showNotification('Failed to load lead details: ' + error.message, 'error');
    }
}

function renderLeadDetails(lead) {
    const content = document.getElementById('leadDetailsContent');
    content.innerHTML = `
        <div class="details-section">
            <h4><i class="fas fa-user"></i> Contact Information</h4>
            <div class="detail-row">
                <span class="detail-label">Name:</span>
                <span class="detail-value">${lead.contactName}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${lead.clientEmail}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Job Title:</span>
                <span class="detail-value">${lead.jobTitle || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Phone:</span>
                <span class="detail-value">${lead.clientPhone || 'N/A'}</span>
            </div>
        </div>
        
        <div class="details-section">
            <h4><i class="fas fa-building"></i> Company Information</h4>
            <div class="detail-row">
                <span class="detail-label">Company:</span>
                <span class="detail-value">${lead.companyName}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Website:</span>
                <span class="detail-value">${lead.companyWebsite || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Country:</span>
                <span class="detail-value">${lead.companyCountry || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Company Phone:</span>
                <span class="detail-value">${lead.companyPhone || 'N/A'}</span>
            </div>
        </div>
        
        <div class="details-section">
            <h4><i class="fas fa-industry"></i> Industry Information</h4>
            <div class="detail-row">
                <span class="detail-label">Industry Type:</span>
                <span class="detail-value">${lead.industryType || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Company Size:</span>
                <span class="detail-value">${lead.companySize || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Annual Revenue:</span>
                <span class="detail-value">${lead.annualRevenue || 'N/A'}</span>
            </div>
        </div>
        
        <div class="details-section">
            <h4><i class="fas fa-info-circle"></i> Lead Status</h4>
            <div class="detail-row">
                <span class="detail-label">Source:</span>
                <span class="detail-value">${lead.leadSource}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value">${lead.leadStatus}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Qualified Prospect:</span>
                <span class="detail-value">${lead.isProspect ? 'Yes' : 'No'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Created:</span>
                <span class="detail-value">${formatDate(lead.createdAt)}</span>
            </div>
        </div>
        
        ${lead.emailMessage ? `
        <div class="communication-section">
            <h4><i class="fas fa-envelope"></i> Email Communication</h4>
            <div class="message-content">${lead.emailMessage}</div>
        </div>
        ` : ''}
        
        ${lead.leadNotes ? `
        <div class="communication-section">
            <h4><i class="fas fa-sticky-note"></i> Notes</h4>
            <div class="message-content">${lead.leadNotes}</div>
        </div>
        ` : ''}
    `;
}

// Rendering Functions
function renderLeads() {
    if (currentView === 'cards') {
        renderLeadsCards();
    } else {
        renderLeadsTable();
    }
}

function renderLeadsCards() {
    const grid = document.getElementById('industryLeadsGrid');
    
    if (leads.length === 0) {
        grid.innerHTML = `
            <div class="no-leads-message">
                <i class="fas fa-inbox"></i>
                <h3>No Industry Leads Found</h3>
                <p>Get started by adding your first industry lead</p>
                <button class="btn-primary" onclick="addNewLead()">
                    <i class="fas fa-plus"></i> Add New Lead
                </button>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = '';
    
    leads.forEach(lead => {
        const card = document.createElement('div');
        card.className = 'industry-lead-card';
        card.onclick = () => viewLeadDetails(lead.id);
        
        card.innerHTML = `
            <div class="industry-lead-card-header">
                <div class="lead-info">
                    <h3>${lead.contactName}</h3>
                    <p>${lead.jobTitle || 'No title specified'}</p>
                    <p class="company-name">${lead.companyName}</p>
                </div>
                <span class="lead-source-badge ${lead.leadSource}">${lead.leadSource}</span>
            </div>
            <div class="industry-lead-card-body">
                <div class="industry-info">
                    <h4><i class="fas fa-industry"></i> ${lead.industryType || 'General Industry'}</h4>
                    <div class="detail-item">
                        <i class="fas fa-users"></i>
                        <span class="label">Size:</span>
                        <span class="value">${lead.companySize || 'N/A'}</span>
                    </div>
                    ${lead.annualRevenue ? `
                        <div class="detail-item">
                            <i class="fas fa-dollar-sign"></i>
                            <span class="label">Revenue:</span>
                            <span class="value">${lead.annualRevenue}</span>
                        </div>
                    ` : ''}
                </div>
                <div class="lead-details">
                    <div class="detail-item">
                        <i class="fas fa-envelope"></i>
                        <span class="label">Email:</span>
                        <span class="value">${lead.clientEmail}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-phone"></i>
                        <span class="label">Phone:</span>
                        <span class="value">${lead.clientPhone || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-globe"></i>
                        <span class="label">Country:</span>
                        <span class="value">${lead.companyCountry || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-calendar"></i>
                        <span class="label">Created:</span>
                        <span class="value">${formatDate(lead.createdDate)}</span>
                    </div>
                </div>
            </div>
            <div class="industry-lead-card-actions">
                <div class="card-actions-left">
                    <button class="action-btn edit" onclick="event.stopPropagation(); editLead('${lead.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="action-btn delete" onclick="event.stopPropagation(); deleteLead('${lead.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
                <span class="status-badge ${lead.leadStatus}">${lead.leadStatus}</span>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

function renderLeadsTable() {
    const tbody = document.getElementById('industryLeadsTableBody');
    
    if (leads.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="no-data">
                    <div class="no-leads-message">
                        <i class="fas fa-inbox"></i>
                        <h3>No Industry Leads Found</h3>
                        <p>Get started by adding your first industry lead</p>
                        <button class="btn-primary" onclick="addNewLead()">
                            <i class="fas fa-plus"></i> Add New Lead
                        </button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = '';
    
    leads.forEach(lead => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" value="${lead.id}" onchange="toggleLeadSelection()"></td>
            <td>${lead.contactName}</td>
            <td>${lead.jobTitle || 'N/A'}</td>
            <td>${lead.companyName}</td>
            <td>${lead.clientEmail}</td>
            <td>${lead.clientPhone || 'N/A'}</td>
            <td><span class="lead-source-badge ${lead.leadSource}">${lead.leadSource}</span></td>
            <td><span class="status-badge ${lead.leadStatus}">${lead.leadStatus}</span></td>
            <td>${formatDate(lead.createdDate)}</td>
            <td>
                <div class="table-actions">
                    <button class="table-action-btn" onclick="viewLeadDetails('${lead.id}')" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="table-action-btn" onclick="editLead('${lead.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="table-action-btn" onclick="deleteLead('${lead.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// View Management
function switchView(view) {
    currentView = view;
    
    // Update view buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-view="${view}"]`).classList.add('active');
    
    // Update view containers
    document.querySelectorAll('.industry-leads-cards-view, .industry-leads-table-view').forEach(container => {
        container.classList.remove('active');
    });
    
    if (view === 'cards') {
        document.getElementById('cardsView').classList.add('active');
        itemsPerPage = 12;
    } else {
        document.getElementById('tableView').classList.add('active');
        itemsPerPage = 15;
    }
    
    currentPage = 1;
    loadLeads();
}

// Filtering and Sorting
function filterLeads() {
    currentPage = 1;
    loadLeads();
}

function resetFilters() {
    document.getElementById('sourceFilter').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('countryFilter').value = '';
    document.querySelector('.search-input').value = '';
    
    currentPage = 1;
    loadLeads();
    
    showNotification('Filters reset', 'info');
}

function sortLeads() {
    currentPage = 1;
    loadLeads();
}

function performSearch(query) {
    currentPage = 1;
    loadLeads();
}

// Bulk Operations
function selectAllLeads(checkbox) {
    const checkboxes = document.querySelectorAll('#industryLeadsTableBody input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.checked = checkbox.checked;
    });
    toggleLeadSelection();
}

function toggleLeadSelection() {
    const selectedCheckboxes = document.querySelectorAll('#industryLeadsTableBody input[type="checkbox"]:checked');
    const bulkActions = document.getElementById('bulkActions');
    const selectedCount = document.querySelector('.selected-count');
    
    if (selectedCheckboxes.length > 0) {
        bulkActions.style.display = 'flex';
        selectedCount.textContent = `${selectedCheckboxes.length} lead${selectedCheckboxes.length > 1 ? 's' : ''} selected`;
    } else {
        bulkActions.style.display = 'none';
    }
}

async function bulkUpdateStatus(status) {
    const selectedCheckboxes = document.querySelectorAll('#industryLeadsTableBody input[type="checkbox"]:checked');
    const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.value);
    
    if (selectedIds.length === 0) {
        showNotification('Please select leads to update', 'warning');
        return;
    }

    try {
        showLoading(true);
        const result = await bulkUpdateStatusAPI(selectedIds, status);
        
        showNotification(`${result.modifiedCount} leads updated to ${status}`, 'success');
        toggleLeadSelection();
        await loadLeads(); // Reload leads from server
        
    } catch (error) {
        console.error('Error bulk updating leads:', error);
        showNotification('Failed to update leads: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function bulkDeleteLeads() {
    const selectedCheckboxes = document.querySelectorAll('#industryLeadsTableBody input[type="checkbox"]:checked');
    const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.value);
    
    if (selectedIds.length === 0) {
        showNotification('Please select leads to delete', 'warning');
        return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedIds.length} lead${selectedIds.length > 1 ? 's' : ''}?`)) {
        return;
    }

    try {
        showLoading(true);
        const result = await bulkDeleteLeadsAPI(selectedIds);
        
        showNotification(`${result.deletedCount} leads deleted successfully`, 'success');
        toggleLeadSelection();
        await loadLeads(); // Reload leads from server
        
    } catch (error) {
        console.error('Error bulk deleting leads:', error);
        showNotification('Failed to delete leads: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Pagination
function updatePagination(paginationData) {
    const startIndex = ((currentPage - 1) * itemsPerPage) + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, paginationData.totalLeads);
    
    document.getElementById('paginationStart').textContent = startIndex;
    document.getElementById('paginationEnd').textContent = endIndex;
    document.getElementById('paginationTotal').textContent = paginationData.totalLeads;
    
    document.getElementById('prevBtn').disabled = !paginationData.hasPrev;
    document.getElementById('nextBtn').disabled = !paginationData.hasNext;
    
    renderPaginationNumbers(paginationData.totalPages);
}

function renderPaginationNumbers(totalPages) {
    const container = document.getElementById('paginationNumbers');
    container.innerHTML = '';
    
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-number ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.onclick = () => goToPage(i);
        container.appendChild(pageBtn);
    }
}

function changePage(direction) {
    const newPage = currentPage + direction;
    goToPage(newPage);
}

function goToPage(page) {
    currentPage = page;
    loadLeads();
}

function updateStats(stats) {
    console.log('Updating stats with:', stats);
    
    if (!stats) {
        console.error('No stats provided');
        // Calculate stats from current leads as fallback
        calculateStatsFromLeads();
        return;
    }

    // Animate the values with smooth counting
    animateCounter('totalLeads', stats.totalLeads || 0);
    animateCounter('qualifiedLeads', stats.qualifiedLeads || 0);
    animateCounter('convertedLeads', stats.convertedLeads || 0);
    animatePercentage('conversionRate', stats.conversionRate || 0);
}

// Smooth counter animation for numbers
function animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    const currentValue = parseInt(element.textContent) || 0;
    
    // If values are the same, no need to animate
    if (currentValue === targetValue) {
        return;
    }

    const duration = 1500; // 1.5 seconds
    const frameRate = 60; // 60 FPS
    const totalFrames = (duration / 1000) * frameRate;
    const increment = (targetValue - currentValue) / totalFrames;
    
    let currentFrame = 0;
    let displayedValue = currentValue;

    const counter = setInterval(() => {
        currentFrame++;
        displayedValue += increment;
        
        if (currentFrame >= totalFrames) {
            displayedValue = targetValue;
            clearInterval(counter);
        }
        
        element.textContent = Math.round(displayedValue);
    }, 1000 / frameRate);
}

// Smooth animation for percentage
function animatePercentage(elementId, targetPercentage) {
    const element = document.getElementById(elementId);
    const currentText = element.textContent;
    const currentPercentage = parseFloat(currentText) || 0;
    
    // If values are the same, no need to animate
    if (currentPercentage === targetPercentage) {
        element.textContent = `${targetPercentage}%`;
        return;
    }

    const duration = 1500; // 1.5 seconds
    const frameRate = 60; // 60 FPS
    const totalFrames = (duration / 1000) * frameRate;
    const increment = (targetPercentage - currentPercentage) / totalFrames;
    
    let currentFrame = 0;
    let displayedPercentage = currentPercentage;

    const counter = setInterval(() => {
        currentFrame++;
        displayedPercentage += increment;
        
        if (currentFrame >= totalFrames) {
            displayedPercentage = targetPercentage;
            clearInterval(counter);
        }
        
        element.textContent = `${displayedPercentage.toFixed(1)}%`;
    }, 1000 / frameRate);
}

// Fallback function to calculate stats from current leads
function calculateStatsFromLeads() {
    console.log('Calculating stats from current leads...');
    
    const totalLeads = leads.length;
    const qualifiedLeads = leads.filter(lead => 
        lead.leadStatus === 'qualified' || lead.isProspect === true
    ).length;
    const convertedLeads = leads.filter(lead => 
        lead.leadStatus === 'converted'
    ).length;
    
    const conversionRate = totalLeads > 0 
        ? ((convertedLeads / totalLeads) * 100).toFixed(1)
        : 0;

    const calculatedStats = {
        totalLeads,
        qualifiedLeads,
        convertedLeads,
        conversionRate: parseFloat(conversionRate)
    };

    console.log('Calculated stats from leads:', calculatedStats);
    
    // Update the UI with animated stats
    animateCounter('totalLeads', totalLeads);
    animateCounter('qualifiedLeads', qualifiedLeads);
    animateCounter('convertedLeads', convertedLeads);
    animatePercentage('conversionRate', parseFloat(conversionRate));
}

function animateValue(elementId, endValue) {
    const element = document.getElementById(elementId);
    const startValue = parseInt(element.textContent) || 0;
    const duration = 1000;
    const step = (endValue - startValue) / (duration / 16);
    let currentValue = startValue;
    
    const timer = setInterval(() => {
        currentValue += step;
        if ((step > 0 && currentValue >= endValue) || (step < 0 && currentValue <= endValue)) {
            currentValue = endValue;
            clearInterval(timer);
        }
        element.textContent = Math.round(currentValue);
    }, 16);
}

// File Upload (Keep existing file upload functions)
function selectEmailFile() {
    document.getElementById('emailAttachment').click();
}

function handleFileSelect(input) {
    const files = Array.from(input.files);
    
    files.forEach(file => {
        if (file.size > 10 * 1024 * 1024) {
            showNotification(`File ${file.name} is too large. Maximum size is 10MB.`, 'error');
            return;
        }
        
        const fileObj = {
            id: Date.now() + Math.random(),
            name: file.name,
            size: file.size,
            type: file.type,
            file: file
        };
        uploadedFiles.push(fileObj);
    });
    
    updateUploadedFilesDisplay();
    input.value = '';
}

function updateUploadedFilesDisplay() {
    const container = document.getElementById('uploadedFiles');
    container.innerHTML = '';
    
    uploadedFiles.forEach(file => {
        const fileDiv = document.createElement('div');
        fileDiv.className = 'uploaded-file';
        fileDiv.innerHTML = `
            <div class="file-info">
                <i class="fas fa-file"></i>
                <span>${file.name} (${formatFileSize(file.size)})</span>
            </div>
            <button class="remove-file" onclick="removeFile(${file.id})">×</button>
        `;
        container.appendChild(fileDiv);
    });
}

function removeFile(fileId) {
    uploadedFiles = uploadedFiles.filter(file => file.id !== fileId);
    updateUploadedFilesDisplay();
}

// Import/Export Functions
async function exportLeads() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            showNotification('Please login to export leads', 'error');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/industry-leads/export/csv`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'industry_leads.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showNotification('Industry leads exported successfully', 'success');
    } catch (error) {
        console.error('Error exporting leads:', error);
        showNotification('Failed to export leads: ' + error.message, 'error');
    }
}

function importLeads() {
    showNotification('Import industry leads feature coming soon', 'info');
}

// Modal Management
function closeLeadModal() {
    document.getElementById('leadModal').style.display = 'none';
    currentEditingLead = null;
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    currentDeleteLead = null;
}

function closeLeadDetailsModal() {
    document.getElementById('leadDetailsModal').style.display = 'none';
}

function editLeadFromDetails() {
    const leadId = currentEditingLead ? currentEditingLead.id : null;
    closeLeadDetailsModal();
    if (leadId) {
        editLead(leadId);
    }
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        modal.style.display = 'none';
        modal.classList.remove('show');
    });
    currentEditingLead = null;
    currentDeleteLead = null;
}

// Utility Functions
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    } catch (error) {
        return dateString;
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showLoading(show) {
    // You can implement a loading spinner here
    if (show) {
        document.body.style.cursor = 'wait';
    } else {
        document.body.style.cursor = 'default';
    }
}

// Notification System (Keep existing notification functions)
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `toast-notification toast-${type}`;
    notification.innerHTML = `
        <div class="toast-content">
            <i class="fas ${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 16px 20px;
        border-radius: 10px;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        font-size: 14px;
        font-weight: 500;
        max-width: 400px;
        transform: translateX(100%);
        transition: transform 0.4s ease;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 400);
        }
    }, 4000);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    return icons[type] || icons.info;
}

function getNotificationColor(type) {
    const colors = {
        success: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
        error: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
        warning: 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)',
        info: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    };
    return colors[type] || colors.info;
}

// Dashboard Functions (Keep existing sidebar functions)
function toggleSidebar() {
    const appContainer = document.querySelector('.app-container');
    appContainer.classList.toggle('sidebar-collapsed');
    localStorage.setItem('sidebarCollapsed', appContainer.classList.contains('sidebar-collapsed'));
}

function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    const isVisible = dropdown.classList.contains('show');
    closeAllDropdowns();
    if (!isVisible) {
        dropdown.classList.add('show');
    }
}

function toggleNotifications() {
    const dropdown = document.getElementById('notificationsDropdown');
    const isVisible = dropdown.classList.contains('show');
    closeAllDropdowns();
    if (!isVisible) {
        dropdown.classList.add('show');
    }
}

function closeAllDropdowns() {
    document.querySelectorAll('.user-dropdown, .notifications-dropdown').forEach(dropdown => {
        dropdown.classList.remove('show');
    });
}

function viewProfile() {
    closeAllDropdowns();
    showNotification('Profile feature coming soon', 'info');
}

function openSettings() {
    closeAllDropdowns();
    showNotification('Opening settings...', 'info');
}

function openHelp() {
    closeAllDropdowns();
    showNotification('Opening help center...', 'info');
}

function logout() {
    closeAllDropdowns();
    if (confirm('Are you sure you want to logout?')) {
        const userData = JSON.parse(localStorage.getItem('userData'));
        const userName = userData ? userData.name : 'User';
        
        showNotification(`Goodbye, ${userName}! Logging out...`, 'info');
        
        // Clear storage
        localStorage.removeItem('userData');
        localStorage.removeItem('authToken');
        localStorage.removeItem('loginTime');
        
        // Redirect to login page
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
    }
}

function markAllRead() {
    const badge = document.getElementById('notificationCount');
    badge.textContent = '0';
    badge.style.display = 'none';
    closeAllDropdowns();
    showNotification('All notifications marked as read', 'success');
}

function viewNotification(id) {
    closeAllDropdowns();
    showNotification(`Viewing notification ${id}`, 'info');
}

console.log('Industry Leads Management System initialized with backend integration');