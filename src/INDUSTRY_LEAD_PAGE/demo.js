// demo.js - Complete Fixed Version with Navigation

// Global variables
let leads = [];
let filteredLeads = [];
let currentEditingLead = null;
let currentDeleteLead = null;
let currentView = 'table'; // Force table view only
let currentPage = 1;
let itemsPerPage = 6; // Change from 15 to 6 to match show.html
let uploadedFiles = [];
let totalLeadsCount = 0;

// API Base URL
const API_BASE_URL = 'https://crm-admin-panel-production.up.railway.app/api';

// ✅ ADD: Navigation function matching MAIN_PAGE/script.js
function handleNavigation(page) {
    console.log('Navigation requested to page:', page);
    // Define routes - UPDATED with your external URLs
    const routes = {
        'dashboard': '/MAIN_PAGE/index.html',
        'leads': '/show_new_demo/show.html', 
        'industry-leads': '/industry-leads',
        'deals': 'https://crm-admin-panel.vercel.app/DEAL/deal.html',
        'contacts': 'https://crm-admin-panel.vercel.app/CONTACT/contact.html',
        'invoice': 'https://crm-admin-panel.vercel.app/INVOICE/invoice.html',
        'salary': 'https://crm-admin-panel.vercel.app/main/SALARY/Salary.html'
    };
    
    const route = routes[page];
    
    if (route) {
        showNotification(`Loading ${getPageTitle(page)}...`, 'info');
        console.log('Redirecting to:', route);
        setTimeout(() => {
            window.location.href = route;
        }, 500);
    } else {
        console.warn('No route defined for page:', page);
        showNotification(`Page "${getPageTitle(page)}" is not available yet.`, 'warning');
    }
}


// ✅ ADD: Get page title function
function getPageTitle(page) {
    const titles = {
        'dashboard': 'Dashboard',
        'leads': 'Show Leads', 
        'industry-leads': 'Industry Leads',
        'deals': 'Deals Pipeline',
        'contacts': 'Contacts',
        'invoice': 'Invoices',
        'salary': 'Salary'
    };
    return titles[page] || page.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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
    displayUserName(); // This will now also update the avatar
    
    // Load leads immediately
    loadLeads().then(() => {
        console.log('Leads loaded successfully');
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

function getUserData() {
    try {
        const userDataString = localStorage.getItem('userData');
        console.log('👤 Raw userData from localStorage:', userDataString);
        
        if (!userDataString) {
            console.warn('❌ No user data found in localStorage');
            return null;
        }
        
        const userData = JSON.parse(userDataString);
        console.log('👤 Parsed userData:', userData);
        
        // Validate required fields
        if (userData && userData.id && userData.name) {
            return userData;
        } else {
            console.warn('❌ User data missing required fields');
            return null;
        }
        
    } catch (error) {
        console.error('❌ Error parsing user data:', error);
        return null;
    }
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
    try {
        const userData = getUserData();
        const userNameElement = document.getElementById('userDisplayName');
        
        console.log('👤 Displaying user name for:', userData);
        
        let displayName = 'User';
        
        if (userData) {
            // Priority: name -> username -> email -> 'User'
            displayName = userData.name || userData.username || userData.email || 'User';
            console.log('✅ User name found:', displayName);
        } else {
            console.warn('❌ No user data found in localStorage');
        }
        
        // Always update the display name
        if (userNameElement) {
            userNameElement.textContent = displayName;
        }
        
        // Update avatar with letter
        updateUserAvatar();
        
    } catch (error) {
        console.error('❌ Error displaying user name:', error);
        const userNameElement = document.getElementById('userDisplayName');
        if (userNameElement) {
            userNameElement.textContent = 'User';
        }
        updateUserAvatar();
    }
}

async function loadLeads() {
    try {
        showLoading(true);
        
        const token = getToken();
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
        } else if (sortBy === 'status_asc') {
            sortField = 'leadStatus';
            sortOrder = 'asc';
        }

        // For client-side pagination, we need to get ALL data first
        const params = new URLSearchParams({
            limit: 1000, // Get a large number to ensure we get all records
            ...(search && { search }),
            ...(sourceFilter && { leadSource: sourceFilter }),
            ...(statusFilter && { leadStatus: statusFilter }),
            ...(countryFilter && { companyCountry: countryFilter }),
            sortBy: sortField,
            sortOrder: sortOrder
        });

        console.log('🔍 Loading ALL industry leads for client-side pagination');

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

        console.log('📊 Server response - ALL DATA:', {
            success: result.success,
            dataLength: result.data ? result.data.length : 0,
            totalLeads: result.pagination ? result.pagination.totalLeads : result.data.length
        });

        if (result.success) {
            // Store ALL leads from server for client-side pagination
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
            totalLeadsCount = result.pagination ? result.pagination.totalLeads : result.data.length;
            
            // Update total records display
            document.getElementById('totalRecords').textContent = totalLeadsCount;
            
            console.log('🔄 Stored ALL leads for client-side pagination:', {
                totalLeadsCount: totalLeadsCount,
                leadsLength: leads.length
            });
            
            renderLeads();
            
            // Use client-side pagination calculations
            updatePagination({
                currentPage: currentPage,
                totalPages: Math.ceil(totalLeadsCount / itemsPerPage),
                totalLeads: totalLeadsCount,
                hasPrev: currentPage > 1,
                hasNext: currentPage < Math.ceil(totalLeadsCount / itemsPerPage)
            });
            
        } else {
            throw new Error(result.message || 'Failed to load leads');
        }
    } catch (error) {
        console.error('Error loading leads:', error);
        showNotification('Failed to load leads: ' + error.message, 'error');
        
        // Fallback: Try to render with empty data
        leads = [];
        filteredLeads = [];
        renderLeads();
        
        // Update pagination for error state
        updatePagination({
            currentPage: 1,
            totalPages: 1,
            totalLeads: 0,
            hasPrev: false,
            hasNext: false
        });
    } finally {
        showLoading(false);
    }
}

function getToken() {
    return localStorage.getItem('authToken') || '';
}

async function saveLeadToAPI(leadData, isUpdate = false) {
    try {
        const token = getToken();
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
        const token = getToken();
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
        const token = getToken();
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
        const token = getToken();
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
    document.getElementById('clientEmail').value = lead.clientEmail || '';
    document.getElementById('contactName').value = lead.contactName || '';
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
    if (form) form.reset();
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
            leadNotes: formData.leadNotes
        };

        const savedLead = await saveLeadToAPI(apiData, !!currentEditingLead);

        showNotification(
            `Industry lead ${currentEditingLead ? 'updated' : 'added'} successfully`, 
            'success'
        );

        closeLeadModal();
        await loadLeads();
        
    } catch (error) {
        console.error('Error saving lead:', error);
        showNotification('Failed to save lead: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

function getLeadFormData() {
    return {
        contactName: document.getElementById('contactName')?.value.trim() || '',
        clientEmail: document.getElementById('clientEmail')?.value.trim() || '',
        jobTitle: document.getElementById('jobTitle')?.value.trim() || '',
        clientPhone: document.getElementById('clientPhone')?.value.trim() || '',
        companyName: document.getElementById('companyName')?.value.trim() || '',
        companyWebsite: document.getElementById('companyWebsite')?.value.trim() || '',
        companyCountry: document.getElementById('companyCountry')?.value || '',
        companyPhone: document.getElementById('companyPhone')?.value.trim() || '',
        industryType: document.getElementById('industryType')?.value || '',
        companySize: document.getElementById('companySize')?.value || '',
        annualRevenue: document.getElementById('annualRevenue')?.value || '',
        leadSource: document.getElementById('leadSource')?.value || '',
        leadStatus: document.getElementById('leadStatus')?.value || 'new',
        isProspect: document.getElementById('isProspect')?.checked || false,
        emailMessage: document.getElementById('emailMessage')?.value.trim() || '',
        leadNotes: document.getElementById('leadNotes')?.value.trim() || ''
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
        await loadLeads();
        
    } catch (error) {
        console.error('Error deleting lead:', error);
        showNotification('Failed to delete lead: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function viewLeadDetails(leadId) {
    try {
        const token = getToken();
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
    if (!content) return;
    
    content.innerHTML = `
        <div class="details-section">
            <h4><i class="fas fa-user"></i> Contact Information</h4>
            <div class="detail-row">
                <span class="detail-label">Name:</span>
                <span class="detail-value">${escapeHtml(lead.contactName)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${escapeHtml(lead.clientEmail)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Job Title:</span>
                <span class="detail-value">${escapeHtml(lead.jobTitle || 'N/A')}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Phone:</span>
                <span class="detail-value">${escapeHtml(lead.clientPhone || 'N/A')}</span>
            </div>
        </div>
        
        <div class="details-section">
            <h4><i class="fas fa-building"></i> Company Information</h4>
            <div class="detail-row">
                <span class="detail-label">Company:</span>
                <span class="detail-value">${escapeHtml(lead.companyName)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Website:</span>
                <span class="detail-value">${escapeHtml(lead.companyWebsite || 'N/A')}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Country:</span>
                <span class="detail-value">${escapeHtml(lead.companyCountry || 'N/A')}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Company Phone:</span>
                <span class="detail-value">${escapeHtml(lead.companyPhone || 'N/A')}</span>
            </div>
        </div>
        
        <div class="details-section">
            <h4><i class="fas fa-industry"></i> Industry Information</h4>
            <div class="detail-row">
                <span class="detail-label">Industry Type:</span>
                <span class="detail-value">${escapeHtml(lead.industryType || 'N/A')}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Company Size:</span>
                <span class="detail-value">${escapeHtml(lead.companySize || 'N/A')}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Annual Revenue:</span>
                <span class="detail-value">${escapeHtml(lead.annualRevenue || 'N/A')}</span>
            </div>
        </div>
        
        <div class="details-section">
            <h4><i class="fas fa-info-circle"></i> Lead Status</h4>
            <div class="detail-row">
                <span class="detail-label">Source:</span>
                <span class="detail-value">${escapeHtml(lead.leadSource)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value">${escapeHtml(lead.leadStatus)}</span>
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
            <div class="message-content">${escapeHtml(lead.emailMessage)}</div>
        </div>
        ` : ''}
        
        ${lead.leadNotes ? `
        <div class="communication-section">
            <h4><i class="fas fa-sticky-note"></i> Notes</h4>
            <div class="message-content">${escapeHtml(lead.leadNotes)}</div>
        </div>
        ` : ''}
    `;
}

// Rendering Functions
function renderLeads() {
    console.log('Rendering industry leads. Current view:', currentView);
    
    // Only render table view
    renderLeadsTable();
}

function renderLeadsTable() {
    const tbody = document.getElementById('industryLeadsTableBody');
    if (!tbody) {
        console.error('Industry leads table body not found');
        return;
    }
    
    tbody.innerHTML = '';

    console.log('🎯 Rendering table - CLIENT-SIDE PAGINATION:', {
        totalLeadsCount: totalLeadsCount,
        leadsLength: leads.length,
        currentPage: currentPage,
        itemsPerPage: itemsPerPage,
        totalPages: Math.ceil(totalLeadsCount / itemsPerPage)
    });

    // If no leads, show empty state
    if (leads.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" class="no-data">
                    <div class="no-leads-message">
                        <i class="fas fa-headset"></i>
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

    // Calculate pagination indices for client-side pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, leads.length);
    
    console.log('📄 Pagination slice:', {
        startIndex: startIndex,
        endIndex: endIndex,
        calculation: `(${currentPage} - 1) * ${itemsPerPage} = ${startIndex} to min(${startIndex} + ${itemsPerPage}, ${leads.length}) = ${endIndex}`,
        expectedRecords: endIndex - startIndex
    });

    // Get only the leads for the current page
    const leadsToRender = leads.slice(startIndex, endIndex);

    console.log('🔄 Leads to render for page', currentPage, ':', leadsToRender.length, 'records');

    // Render the paginated leads
    leadsToRender.forEach((lead, index) => {
        const actualIndex = startIndex + index;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" value="${lead.id}" onchange="toggleLeadSelection()"></td>
            <td>${escapeHtml(lead.contactName)}</td>
            <td>${escapeHtml(lead.clientEmail)}</td>
            <td>${escapeHtml(lead.jobTitle || 'NA')}</td>
            <td>${escapeHtml(lead.companyName)}</td>
            <td>${escapeHtml(lead.industryType || 'NA')}</td>
            <td>${escapeHtml(lead.companySize || 'NA')}</td>
            <td><span class="lead-source-badge ${lead.leadSource}">${escapeHtml(lead.leadSource)}</span></td>
            <td><span class="status-badge ${lead.leadStatus}">${escapeHtml(lead.leadStatus)}</span></td>
            <td>${formatDate(lead.createdDate)}</td>
            <td>
                <div class="table-actions">
                    <button class="table-action-btn view" onclick="viewLeadDetails('${lead.id}')" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="table-action-btn edit" onclick="editLead('${lead.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="table-action-btn delete" onclick="deleteLead('${lead.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });

    console.log('✅ Successfully rendered', leadsToRender.length, 'leads for page', currentPage);
}

function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return unsafe
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
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
    
    if (selectedCheckboxes.length > 0 && bulkActions && selectedCount) {
        bulkActions.style.display = 'flex';
        selectedCount.textContent = `${selectedCheckboxes.length} lead${selectedCheckboxes.length > 1 ? 's' : ''} selected`;
    } else if (bulkActions) {
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
        await loadLeads();
        
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
        await loadLeads();
        
    } catch (error) {
        console.error('Error bulk deleting leads:', error);
        showNotification('Failed to delete leads: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Pagination
function updatePagination(paginationData) {
    const startElement = document.getElementById('paginationStart');
    const endElement = document.getElementById('paginationEnd');
    const totalElement = document.getElementById('paginationTotal');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (!startElement || !endElement || !totalElement || !prevBtn || !nextBtn) {
        console.warn('Pagination elements not found in DOM');
        return;
    }
    
    // Always calculate based on client-side data to ensure consistency
    const totalPages = Math.ceil(totalLeadsCount / itemsPerPage);
    const startIndex = ((currentPage - 1) * itemsPerPage) + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, totalLeadsCount);
    
    console.log('📊 Pagination calculations:', {
        totalLeadsCount: totalLeadsCount,
        itemsPerPage: itemsPerPage,
        totalPages: totalPages,
        currentPage: currentPage,
        startIndex: startIndex,
        endIndex: endIndex
    });
    
    startElement.textContent = startIndex;
    endElement.textContent = endIndex;
    totalElement.textContent = totalLeadsCount;
    
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
    
    renderPaginationNumbers(totalPages);
}

function renderPaginationNumbers(totalPages) {
    const container = document.getElementById('paginationNumbers');
    if (!container) {
        console.warn('Pagination numbers container not found');
        return;
    }
    
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
    console.log('🔄 Changing page:', {
        from: currentPage,
        to: newPage,
        direction: direction,
        totalPages: Math.ceil(totalLeadsCount / itemsPerPage)
    });
    
    if (newPage < 1 || newPage > Math.ceil(totalLeadsCount / itemsPerPage)) {
        console.warn('Cannot navigate to page:', newPage);
        return;
    }
    
    goToPage(newPage);
}

function goToPage(page) {
    if (page < 1 || page > Math.ceil(totalLeadsCount / itemsPerPage)) {
        console.warn('Invalid page number:', page);
        return;
    }
    
    console.log('🔄 Navigating to page:', page, 'from current page:', currentPage);
    currentPage = page;
    renderLeads();
    
    // Update pagination UI
    updatePagination({
        currentPage: currentPage,
        totalPages: Math.ceil(totalLeadsCount / itemsPerPage),
        totalLeads: totalLeadsCount,
        hasPrev: currentPage > 1,
        hasNext: currentPage < Math.ceil(totalLeadsCount / itemsPerPage)
    });
}

// File Upload
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
    if (!container) return;
    
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
    if (show) {
        document.body.style.cursor = 'wait';
    } else {
        document.body.style.cursor = 'default';
    }
}

// Avatar color function
function getAvatarColor() {
    return 'linear-gradient(135deg, #00BCD4 0%, #1E88E5 100%)';
}

// Create letter avatar function
function createLetterAvatar(name, element) {
    if (!name || name === 'User' || name === 'Loading...') {
        name = 'User';
    }

    // Get first letter of the name
    const firstLetter = name.charAt(0).toUpperCase();
    const backgroundColor = getAvatarColor();

    if (element.tagName === 'IMG') {
        // For image elements, create canvas avatar
        const canvas = document.createElement('canvas');
        const size = 200;
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');

        // Create gradient for canvas
        const gradient = context.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, '#00BCD4');
        gradient.addColorStop(1, '#1E88E5');

        // Draw background with gradient
        context.fillStyle = gradient;
        context.fillRect(0, 0, size, size);

        // Draw letter
        context.fillStyle = '#FFFFFF';
        context.font = `bold ${size * 0.4}px Inter, Arial, sans-serif`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(firstLetter, size / 2, size / 2);

        element.src = canvas.toDataURL();
        element.alt = name;
    } else {
        // For div elements (like in sidebar), use CSS gradient directly
        element.style.background = backgroundColor;
        const letterSpan = element.querySelector('.avatar-letter');
        if (letterSpan) {
            letterSpan.textContent = firstLetter;
        } else {
            // If no span exists, create one (for sidebar avatar)
            const newLetterSpan = document.createElement('span');
            newLetterSpan.className = 'avatar-letter';
            newLetterSpan.textContent = firstLetter;
            element.innerHTML = '';
            element.appendChild(newLetterSpan);
        }
    }
}

// Update user avatar function
function updateUserAvatar() {
    try {
        const userData = getUserData();
        const userName = userData ? (userData.name || userData.username || userData.email || 'User') : 'User';
        
        console.log('Updating avatar for user:', userName);
        
        // Update sidebar avatar (div element)
        const sidebarAvatar = document.getElementById('userAvatar');
        if (sidebarAvatar) {
            createLetterAvatar(userName, sidebarAvatar);
        }

    } catch (error) {
        console.error('Error updating avatar:', error);
        // Fallback with gradient color
        const sidebarAvatar = document.getElementById('userAvatar');
        if (sidebarAvatar) {
            sidebarAvatar.style.background = 'linear-gradient(135deg, #00BCD4 0%, #1E88E5 100%)';
            const letterSpan = sidebarAvatar.querySelector('.avatar-letter');
            if (letterSpan) {
                letterSpan.textContent = 'U';
            }
        }
    }
}

// Notification System
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.toast-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `toast-notification toast-${type}`;
    notification.innerHTML = `
        <div class="toast-content">
            <i class="fas ${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 4 seconds
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
    
    console.log(`💬 Notification: ${type} - ${message}`);
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
        info: 'linear-gradient(135deg, #00BCD4 0%, #1E88E5 100%)'
    };
    return colors[type] || colors.info;
}

// Dashboard Functions
function toggleSidebar() {
    const appContainer = document.querySelector('.app-container');
    const sidebarToggleIcon = document.getElementById('sidebarToggleIcon');
    const floatingToggleIcon = document.getElementById('floatingToggleIcon');
    
    const isCollapsed = appContainer.classList.toggle('sidebar-collapsed');
    
    // Update sidebar toggle icon based on sidebar state
    if (sidebarToggleIcon) {
        if (isCollapsed) {
            // Sidebar is collapsed - change to right chevron
            sidebarToggleIcon.className = 'fas fa-chevron-right';
            console.log('🔧 Sidebar collapsed - showing right chevron');
        } else {
            // Sidebar is expanded - change to left chevron
            sidebarToggleIcon.className = 'fas fa-chevron-left';
            console.log('🔧 Sidebar expanded - showing left chevron');
        }
    }
    
    // Update floating button icon - ALWAYS show right chevron (pointing towards hidden sidebar)
    if (floatingToggleIcon) {
        floatingToggleIcon.className = 'fas fa-chevron-right';
    }
    
    // Force button visibility
    const toggleBtn = document.querySelector('.sidebar-toggle-btn');
    const toggleSticky = document.querySelector('.sidebar-toggle-sticky');
    
    if (toggleBtn) {
        toggleBtn.style.display = 'flex';
        toggleBtn.style.visibility = 'visible';
        toggleBtn.style.opacity = '1';
    }
    
    if (toggleSticky) {
        toggleSticky.style.display = 'flex';
        toggleSticky.style.visibility = 'visible';
        toggleSticky.style.opacity = '1';
    }
    
    // Save sidebar state to localStorage
    localStorage.setItem('sidebarCollapsed', isCollapsed);
    
    console.log('🔧 Sidebar toggled:', isCollapsed ? 'collapsed' : 'expanded');
}

function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    const isVisible = dropdown.classList.contains('show');
    closeAllDropdowns();
    if (!isVisible) {
        dropdown.classList.add('show');
        console.log('👤 Opening user menu');
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
        const userData = getUserData();
        const userName = userData ? userData.name : 'User';
        
        showNotification(`Goodbye, ${userName}! Logging out...`, 'info');
        
        // Clear storage
        localStorage.removeItem('userData');
        localStorage.removeItem('authToken');
        localStorage.removeItem('loginTime');
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('savedEmail');
        
        // Redirect to login page
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
        
        console.log('🚪 User logged out');
    }
}

console.log('Industry Leads Management System initialized with backend integration');