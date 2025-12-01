// contact.js - Complete Fixed Version with Same Structure as demo.js

// Global variables
let contacts = [];
let filteredContacts = [];
let currentEditingContact = null;
let currentDeleteContact = null;
let currentView = 'table'; // Force table view only
let currentPage = 1;
let itemsPerPage = 6; // Change from 15 to 6 to match demo.html
let totalContactsCount = 0;

// API Base URL
const API_BASE_URL = 'https://crm-admin-panel-production.up.railway.app/api';

// ✅ ADD: Navigation function matching demo.js
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
    console.log('Contact.js - DOM Content Loaded');
    initializeContacts();
    setupEventListeners();
    displayUserName(); // This will now also update the avatar
    
    // Load contacts immediately
    loadContacts().then(() => {
        console.log('Contacts loaded successfully');
    }).catch(error => {
        console.error('Failed to load contacts:', error);
    });
    
    // Load sidebar state
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (sidebarCollapsed) {
        document.querySelector('.app-container').classList.add('sidebar-collapsed');
    }
});

function initializeContacts() {
    console.log('Contact Management System initialized with backend integration');
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

async function loadContacts() {
    try {
        showLoading(true);
        
        const token = getToken();
        if (!token) {
            showNotification('Please login to access contacts', 'error');
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
            return;
        }

        const search = document.querySelector('.search-input')?.value || '';
        const statusFilter = document.getElementById('statusFilter')?.value || '';
        const ownerFilter = document.getElementById('ownerFilter')?.value || '';
        const companyFilter = document.getElementById('companyFilter')?.value || '';
        const sortBy = document.getElementById('sortBy')?.value || 'created_desc';

        // Parse sort parameters
        let sortField = 'createdAt';
        let sortOrder = 'desc';
        
        if (sortBy === 'name_asc') {
            sortField = 'fullName';
            sortOrder = 'asc';
        } else if (sortBy === 'name_desc') {
            sortField = 'fullName';
            sortOrder = 'desc';
        } else if (sortBy === 'company_asc') {
            sortField = 'company';
            sortOrder = 'asc';
        } else if (sortBy === 'created_asc') {
            sortField = 'createdAt';
            sortOrder = 'asc';
        } else if (sortBy === 'status_asc') {
            sortField = 'status';
            sortOrder = 'asc';
        }

        // For client-side pagination, we need to get ALL data first
        const params = new URLSearchParams({
            limit: 1000, // Get a large number to ensure we get all records
            ...(search && { search }),
            ...(statusFilter && { status: statusFilter }),
            ...(ownerFilter && { owner: ownerFilter }),
            ...(companyFilter && { company: companyFilter }),
            sortBy: sortField,
            sortOrder: sortOrder
        });

        console.log('🔍 Loading ALL contacts for client-side pagination');

        const response = await fetch(`${API_BASE_URL}/contacts?${params}`, {
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
            totalContacts: result.pagination ? result.pagination.totalContacts : result.data.length
        });

        if (result.success) {
            // Store ALL contacts from server for client-side pagination
            contacts = result.data.map(contact => ({
                id: contact._id,
                firstName: contact.firstName,
                lastName: contact.lastName,
                fullName: contact.fullName || `${contact.firstName} ${contact.lastName}`,
                jobTitle: contact.jobTitle,
                company: contact.company,
                email: contact.email,
                phone: contact.phone,
                status: contact.status,
                owner: contact.owner,
                notes: contact.notes,
                createdDate: contact.createdAt,
                department: contact.department,
                website: contact.website,
                source: contact.source,
                street: contact.street,
                city: contact.city,
                state: contact.state,
                country: contact.country
            }));

            filteredContacts = [...contacts];
            totalContactsCount = result.pagination ? result.pagination.totalContacts : result.data.length;
            
            // Update total records display
            document.getElementById('totalRecords').textContent = totalContactsCount;
            
            console.log('🔄 Stored ALL contacts for client-side pagination:', {
                totalContactsCount: totalContactsCount,
                contactsLength: contacts.length
            });
            
            renderContacts();
            
            // Use client-side pagination calculations
            updatePagination({
                currentPage: currentPage,
                totalPages: Math.ceil(totalContactsCount / itemsPerPage),
                totalContacts: totalContactsCount,
                hasPrev: currentPage > 1,
                hasNext: currentPage < Math.ceil(totalContactsCount / itemsPerPage)
            });
            
        } else {
            throw new Error(result.message || 'Failed to load contacts');
        }
    } catch (error) {
        console.error('Error loading contacts:', error);
        showNotification('Failed to load contacts: ' + error.message, 'error');
        
        // Fallback: Try to render with empty data
        contacts = [];
        filteredContacts = [];
        renderContacts();
        
        // Update pagination for error state
        updatePagination({
            currentPage: 1,
            totalPages: 1,
            totalContacts: 0,
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

async function saveContactToAPI(contactData, isUpdate = false) {
    try {
        const token = getToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const url = isUpdate 
            ? `${API_BASE_URL}/contacts/${currentEditingContact.id}`
            : `${API_BASE_URL}/contacts`;
        
        const method = isUpdate ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(contactData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
            return result.data;
        } else {
            throw new Error(result.message || 'Failed to save contact');
        }
    } catch (error) {
        console.error('Error saving contact:', error);
        throw error;
    }
}

async function deleteContactFromAPI(contactId) {
    try {
        const token = getToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await fetch(`${API_BASE_URL}/contacts/${contactId}`, {
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
            throw new Error(result.message || 'Failed to delete contact');
        }

        return result;
    } catch (error) {
        console.error('Error deleting contact:', error);
        throw error;
    }
}

async function bulkUpdateStatusAPI(contactIds, status) {
    try {
        const token = getToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await fetch(`${API_BASE_URL}/contacts/bulk-status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ contactIds, status })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Failed to update contacts');
        }

        return result;
    } catch (error) {
        console.error('Error bulk updating contacts:', error);
        throw error;
    }
}

async function bulkDeleteContactsAPI(contactIds) {
    try {
        const token = getToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await fetch(`${API_BASE_URL}/contacts/bulk-delete`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ contactIds })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Failed to delete contacts');
        }

        return result;
    } catch (error) {
        console.error('Error bulk deleting contacts:', error);
        throw error;
    }
}

// Contact Management Functions
function addNewContact() {
    currentEditingContact = null;
    document.getElementById('contactModalTitle').textContent = 'Add New Contact';
    
    // Clear form
    clearContactForm();
    
    const modal = document.getElementById('contactModal');
    modal.style.display = 'flex';
    modal.classList.add('show');
}

function editContact(contactId) {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;
    
    currentEditingContact = contact;
    document.getElementById('contactModalTitle').textContent = 'Edit Contact';
    
    // Populate form
    populateContactForm(contact);
    
    const modal = document.getElementById('contactModal');
    modal.style.display = 'flex';
    modal.classList.add('show');
}

function populateContactForm(contact) {
    document.getElementById('firstName').value = contact.firstName || '';
    document.getElementById('lastName').value = contact.lastName || '';
    document.getElementById('jobTitle').value = contact.jobTitle || '';
    document.getElementById('phone').value = contact.phone || '';
    document.getElementById('company').value = contact.company || '';
    document.getElementById('department').value = contact.department || '';
    document.getElementById('email').value = contact.email || '';
    document.getElementById('website').value = contact.website || '';
    document.getElementById('status').value = contact.status || 'Lead';
    document.getElementById('owner').value = contact.owner || '';
    document.getElementById('source').value = contact.source || '';
    document.getElementById('street').value = contact.street || '';
    document.getElementById('city').value = contact.city || '';
    document.getElementById('state').value = contact.state || '';
    document.getElementById('country').value = contact.country || '';
    document.getElementById('notes').value = contact.notes || '';
}

function clearContactForm() {
    const form = document.getElementById('contactForm');
    if (form) form.reset();
}

async function saveContact() {
    try {
        const formData = getContactFormData();
        
        // Validation
        if (!formData.firstName || !formData.lastName || !formData.company || !formData.email) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        if (!isValidEmail(formData.email)) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }

        showLoading(true);

        // Prepare data for API
        const apiData = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            jobTitle: formData.jobTitle,
            company: formData.company,
            email: formData.email,
            phone: formData.phone,
            status: formData.status,
            owner: formData.owner,
            department: formData.department,
            website: formData.website,
            source: formData.source,
            street: formData.street,
            city: formData.city,
            state: formData.state,
            country: formData.country,
            notes: formData.notes
        };

        const savedContact = await saveContactToAPI(apiData, !!currentEditingContact);

        showNotification(
            `Contact ${currentEditingContact ? 'updated' : 'added'} successfully`, 
            'success'
        );

        closeContactModal();
        await loadContacts();
        
    } catch (error) {
        console.error('Error saving contact:', error);
        showNotification('Failed to save contact: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

function getContactFormData() {
    return {
        firstName: document.getElementById('firstName')?.value.trim() || '',
        lastName: document.getElementById('lastName')?.value.trim() || '',
        jobTitle: document.getElementById('jobTitle')?.value.trim() || '',
        phone: document.getElementById('phone')?.value.trim() || '',
        company: document.getElementById('company')?.value.trim() || '',
        department: document.getElementById('department')?.value.trim() || '',
        email: document.getElementById('email')?.value.trim() || '',
        website: document.getElementById('website')?.value.trim() || '',
        status: document.getElementById('status')?.value || 'Lead',
        owner: document.getElementById('owner')?.value || '',
        source: document.getElementById('source')?.value || '',
        street: document.getElementById('street')?.value.trim() || '',
        city: document.getElementById('city')?.value.trim() || '',
        state: document.getElementById('state')?.value.trim() || '',
        country: document.getElementById('country')?.value || '',
        notes: document.getElementById('notes')?.value.trim() || ''
    };
}

function deleteContact(contactId) {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;
    
    currentDeleteContact = {
        id: contactId,
        name: contact.fullName || `${contact.firstName} ${contact.lastName}`
    };
    
    document.getElementById('deleteItemName').textContent = currentDeleteContact.name;
    document.getElementById('deleteModal').style.display = 'flex';
}

async function confirmDelete() {
    if (!currentDeleteContact) return;
    
    try {
        showLoading(true);
        await deleteContactFromAPI(currentDeleteContact.id);
        
        showNotification('Contact deleted successfully', 'success');
        closeDeleteModal();
        await loadContacts();
        
    } catch (error) {
        console.error('Error deleting contact:', error);
        showNotification('Failed to delete contact: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function viewContactDetails(contactId) {
    try {
        const token = getToken();
        if (!token) {
            showNotification('Please login to view contact details', 'error');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/contacts/${contactId}`, {
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
            const contact = result.data;
            renderContactDetails(contact);
            document.getElementById('contactDetailsModal').style.display = 'flex';
        } else {
            throw new Error(result.message || 'Failed to load contact details');
        }
    } catch (error) {
        console.error('Error loading contact details:', error);
        showNotification('Failed to load contact details: ' + error.message, 'error');
    }
}

function renderContactDetails(contact) {
    const content = document.getElementById('contactDetailsContent');
    if (!content) return;
    
    content.innerHTML = `
        <div class="details-section">
            <h4><i class="fas fa-user"></i> Personal Information</h4>
            <div class="detail-row">
                <span class="detail-label">Name:</span>
                <span class="detail-value">${escapeHtml(contact.fullName || `${contact.firstName} ${contact.lastName}`)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${escapeHtml(contact.email)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Job Title:</span>
                <span class="detail-value">${escapeHtml(contact.jobTitle || 'N/A')}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Phone:</span>
                <span class="detail-value">${escapeHtml(contact.phone || 'N/A')}</span>
            </div>
        </div>
        
        <div class="details-section">
            <h4><i class="fas fa-building"></i> Company Information</h4>
            <div class="detail-row">
                <span class="detail-label">Company:</span>
                <span class="detail-value">${escapeHtml(contact.company)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Department:</span>
                <span class="detail-value">${escapeHtml(contact.department || 'N/A')}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Website:</span>
                <span class="detail-value">${escapeHtml(contact.website || 'N/A')}</span>
            </div>
        </div>
        
        <div class="details-section">
            <h4><i class="fas fa-info-circle"></i> Contact Details</h4>
            <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value"><span class="status-badge ${contact.status}">${contact.status}</span></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Owner:</span>
                <span class="detail-value">${escapeHtml(contact.owner || 'Unassigned')}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Source:</span>
                <span class="detail-value">${escapeHtml(contact.source || 'N/A')}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Created:</span>
                <span class="detail-value">${formatDate(contact.createdAt)}</span>
            </div>
        </div>
        
        ${contact.street || contact.city || contact.state || contact.country ? `
        <div class="details-section">
            <h4><i class="fas fa-map-marker-alt"></i> Address Information</h4>
            ${contact.street ? `
            <div class="detail-row">
                <span class="detail-label">Street:</span>
                <span class="detail-value">${escapeHtml(contact.street)}</span>
            </div>
            ` : ''}
            ${contact.city ? `
            <div class="detail-row">
                <span class="detail-label">City:</span>
                <span class="detail-value">${escapeHtml(contact.city)}</span>
            </div>
            ` : ''}
            ${contact.state ? `
            <div class="detail-row">
                <span class="detail-label">State:</span>
                <span class="detail-value">${escapeHtml(contact.state)}</span>
            </div>
            ` : ''}
            ${contact.country ? `
            <div class="detail-row">
                <span class="detail-label">Country:</span>
                <span class="detail-value">${escapeHtml(contact.country)}</span>
            </div>
            ` : ''}
        </div>
        ` : ''}
        
        ${contact.notes ? `
        <div class="communication-section">
            <h4><i class="fas fa-sticky-note"></i> Notes</h4>
            <div class="message-content">${escapeHtml(contact.notes)}</div>
        </div>
        ` : ''}
    `;
}

// Rendering Functions
function renderContacts() {
    console.log('Rendering contacts. Current view:', currentView);
    
    // Only render table view
    renderContactsTable();
}

function renderContactsTable() {
    const tbody = document.getElementById('contactsTableBody');
    if (!tbody) {
        console.error('Contacts table body not found');
        return;
    }
    
    tbody.innerHTML = '';

    console.log('🎯 Rendering table - CLIENT-SIDE PAGINATION:', {
        totalContactsCount: totalContactsCount,
        contactsLength: contacts.length,
        currentPage: currentPage,
        itemsPerPage: itemsPerPage,
        totalPages: Math.ceil(totalContactsCount / itemsPerPage)
    });

    // If no contacts, show empty state
    if (contacts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="no-data">
                    <div class="no-contacts-message">
                        <i class="fas fa-users"></i>
                        <h3>No Contacts Found</h3>
                        <p>Get started by adding your first contact</p>
                        <button class="btn-primary" onclick="addNewContact()">
                            <i class="fas fa-plus"></i> Add New Contact
                        </button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    // Calculate pagination indices for client-side pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, contacts.length);
    
    console.log('📄 Pagination slice:', {
        startIndex: startIndex,
        endIndex: endIndex,
        calculation: `(${currentPage} - 1) * ${itemsPerPage} = ${startIndex} to min(${startIndex} + ${itemsPerPage}, ${contacts.length}) = ${endIndex}`,
        expectedRecords: endIndex - startIndex
    });

    // Get only the contacts for the current page
    const contactsToRender = contacts.slice(startIndex, endIndex);

    console.log('🔄 Contacts to render for page', currentPage, ':', contactsToRender.length, 'records');

    // Render the paginated contacts
    contactsToRender.forEach((contact, index) => {
        const actualIndex = startIndex + index;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" value="${contact.id}" onchange="toggleContactSelection()"></td>
            <td>${escapeHtml(contact.fullName || `${contact.firstName} ${contact.lastName}`)}</td>
            <td>${escapeHtml(contact.email)}</td>
            <td>${escapeHtml(contact.jobTitle || 'NA')}</td>
            <td>${escapeHtml(contact.company)}</td>
            <td>${escapeHtml(contact.phone || 'NA')}</td>
            <td><span class="status-badge ${contact.status}">${escapeHtml(contact.status)}</span></td>
            <td>${escapeHtml(contact.owner || 'Unassigned')}</td>
            <td>${formatDate(contact.createdDate)}</td>
            <td>
                <div class="table-actions">
                    <button class="table-action-btn view" onclick="viewContactDetails('${contact.id}')" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="table-action-btn edit" onclick="editContact('${contact.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="table-action-btn delete" onclick="deleteContact('${contact.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });

    console.log('✅ Successfully rendered', contactsToRender.length, 'contacts for page', currentPage);
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
function filterContacts() {
    currentPage = 1;
    loadContacts();
}

function resetFilters() {
    document.getElementById('statusFilter').value = '';
    document.getElementById('ownerFilter').value = '';
    document.getElementById('companyFilter').value = '';
    document.querySelector('.search-input').value = '';
    
    currentPage = 1;
    loadContacts();
    
    showNotification('Filters reset', 'info');
}

function sortContacts() {
    currentPage = 1;
    loadContacts();
}

function performSearch(query) {
    currentPage = 1;
    loadContacts();
}

function sortTable(column) {
    // Implement table sorting if needed
    console.log('Sorting by column:', column);
}

// Bulk Operations
function selectAllContacts(checkbox) {
    const checkboxes = document.querySelectorAll('#contactsTableBody input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.checked = checkbox.checked;
    });
    toggleContactSelection();
}

function toggleContactSelection() {
    const selectedCheckboxes = document.querySelectorAll('#contactsTableBody input[type="checkbox"]:checked');
    const bulkActions = document.getElementById('bulkActions');
    const selectedCount = document.querySelector('.selected-count');
    
    if (selectedCheckboxes.length > 0 && bulkActions && selectedCount) {
        bulkActions.style.display = 'flex';
        selectedCount.textContent = `${selectedCheckboxes.length} contact${selectedCheckboxes.length > 1 ? 's' : ''} selected`;
    } else if (bulkActions) {
        bulkActions.style.display = 'none';
    }
}

async function bulkUpdateStatus(status) {
    const selectedCheckboxes = document.querySelectorAll('#contactsTableBody input[type="checkbox"]:checked');
    const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.value);
    
    if (selectedIds.length === 0) {
        showNotification('Please select contacts to update', 'warning');
        return;
    }

    try {
        showLoading(true);
        const result = await bulkUpdateStatusAPI(selectedIds, status);
        
        showNotification(`${result.modifiedCount} contacts updated to ${status}`, 'success');
        toggleContactSelection();
        await loadContacts();
        
    } catch (error) {
        console.error('Error bulk updating contacts:', error);
        showNotification('Failed to update contacts: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function bulkDeleteContacts() {
    const selectedCheckboxes = document.querySelectorAll('#contactsTableBody input[type="checkbox"]:checked');
    const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.value);
    
    if (selectedIds.length === 0) {
        showNotification('Please select contacts to delete', 'warning');
        return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedIds.length} contact${selectedIds.length > 1 ? 's' : ''}?`)) {
        return;
    }

    try {
        showLoading(true);
        const result = await bulkDeleteContactsAPI(selectedIds);
        
        showNotification(`${result.deletedCount} contacts deleted successfully`, 'success');
        toggleContactSelection();
        await loadContacts();
        
    } catch (error) {
        console.error('Error bulk deleting contacts:', error);
        showNotification('Failed to delete contacts: ' + error.message, 'error');
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
    const totalPages = Math.ceil(totalContactsCount / itemsPerPage);
    const startIndex = ((currentPage - 1) * itemsPerPage) + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, totalContactsCount);
    
    console.log('📊 Pagination calculations:', {
        totalContactsCount: totalContactsCount,
        itemsPerPage: itemsPerPage,
        totalPages: totalPages,
        currentPage: currentPage,
        startIndex: startIndex,
        endIndex: endIndex
    });
    
    startElement.textContent = startIndex;
    endElement.textContent = endIndex;
    totalElement.textContent = totalContactsCount;
    
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
        totalPages: Math.ceil(totalContactsCount / itemsPerPage)
    });
    
    if (newPage < 1 || newPage > Math.ceil(totalContactsCount / itemsPerPage)) {
        console.warn('Cannot navigate to page:', newPage);
        return;
    }
    
    goToPage(newPage);
}

function goToPage(page) {
    if (page < 1 || page > Math.ceil(totalContactsCount / itemsPerPage)) {
        console.warn('Invalid page number:', page);
        return;
    }
    
    console.log('🔄 Navigating to page:', page, 'from current page:', currentPage);
    currentPage = page;
    renderContacts();
    
    // Update pagination UI
    updatePagination({
        currentPage: currentPage,
        totalPages: Math.ceil(totalContactsCount / itemsPerPage),
        totalContacts: totalContactsCount,
        hasPrev: currentPage > 1,
        hasNext: currentPage < Math.ceil(totalContactsCount / itemsPerPage)
    });
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

// Modal Management
function closeContactModal() {
    document.getElementById('contactModal').style.display = 'none';
    currentEditingContact = null;
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    currentDeleteContact = null;
}

function closeContactDetailsModal() {
    document.getElementById('contactDetailsModal').style.display = 'none';
}

function editContactFromDetails() {
    const contactId = currentEditingContact ? currentEditingContact.id : null;
    closeContactDetailsModal();
    if (contactId) {
        editContact(contactId);
    }
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        modal.style.display = 'none';
        modal.classList.remove('show');
    });
    currentEditingContact = null;
    currentDeleteContact = null;
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

console.log('Contact Management System initialized with backend integration');