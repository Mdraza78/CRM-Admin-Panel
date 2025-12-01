// contact.js - Updated to match deal page structure and functionality

// Global variables
let contacts = [];
let filteredContacts = [];
let currentContactId = null;
let currentEditingContact = null;
let currentDeleteContact = null;
let currentView = 'table'; // Force table view only
let currentPage = 1;
let itemsPerPage = 5;
let totalContactsCount = 0;

// API Base URL
const API_BASE_URL = 'https://crm-admin-panel-production.up.railway.app/api/contacts';

// Navigation function matching deal.js
function handleNavigation(page) {
    console.log(`Navigation requested to: ${page}`);
    
    const routes = {
        'dashboard': '/MAIN_PAGE/index.html',
        'leads': '/show_new_demo/show.html',
        'industry-leads': '/INDUSTRY_LEAD_PAGE/demo.html',
        'deals': '/DEAL/deal.html',
        'contacts': '/CONTACT/contact.html',
        'invoice': '/INVOICE/invoice.html',
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

// Get page title function
function getPageTitle(page) {
    const titles = {
        'dashboard': 'Dashboard',
        'leads': 'Leads Management',
        'industry-leads': 'Industry Leads',
        'deals': 'Deals Pipeline',
        'contacts': 'Contacts',
        'invoice': 'Invoices',
        'salary': 'Salary'
    };
    return titles[page] || page.replace('-', ' ');
}

// Navigation event listeners setup
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
    initializeApp();
    setupEventListeners();
    displayUserName();
    
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

function initializeApp() {
    console.log('Contact Management System initialized with backend integration');
    setupNavigationEventListeners();
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
    // Navigation event listeners
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
    });

    // Form validation
    document.addEventListener('input', handleFormValidation);
}

function displayUserName() {
    try {
        const userData = getUserData();
        const userNameElement = document.getElementById('userDisplayName');
        
        console.log('👤 Displaying user name for:', userData);
        
        let displayName = 'User';
        
        if (userData) {
            displayName = userData.name || userData.username || userData.email || 'User';
            console.log('✅ User name found:', displayName);
        } else {
            console.warn('❌ No user data found in localStorage');
        }
        
        if (userNameElement) {
            userNameElement.textContent = displayName;
        }
        
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
        
        const userData = getUserData();
        if (!userData || !userData.id) {
            showNotification('Please login to access contacts', 'error');
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
            return;
        }

        const search = document.querySelector('.search-input')?.value || '';
        const statusFilter = document.getElementById('statusFilter')?.value || '';
        const sortBy = document.getElementById('sortBy')?.value || 'created_desc';

        // Parse sort parameters
        let sortField = 'createdAt';
        let sortOrder = 'desc';
        
        if (sortBy === 'name_asc') {
            sortField = 'firstName';
            sortOrder = 'asc';
        } else if (sortBy === 'name_desc') {
            sortField = 'firstName';
            sortOrder = 'desc';
        } else if (sortBy === 'company_asc') {
            sortField = 'company';
            sortOrder = 'asc';
        } else if (sortBy === 'company_desc') {
            sortField = 'company';
            sortOrder = 'desc';
        } else if (sortBy === 'created_asc') {
            sortField = 'createdAt';
            sortOrder = 'asc';
        }

        // For client-side pagination
        const params = new URLSearchParams({
            limit: 1000,
            ...(search && { search }),
            ...(statusFilter && { status: statusFilter }),
            sortBy: sortField,
            sortOrder: sortOrder
        });

        console.log('🔍 Loading ALL contacts for client-side pagination');

        const response = await fetch(`${API_BASE_URL}?${params}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'user-id': userData.id
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        console.log('📊 Server response - ALL DATA:', {
            success: result.success,
            contactsLength: result.data ? result.data.length : 0
        });

        if (result.success && result.data) {
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
                owner: contact.owner || 'Unassigned',
                notes: contact.notes,
                createdAt: contact.createdAt
            }));

            filteredContacts = [...contacts];
            totalContactsCount = contacts.length;
            
            // Update total records display
            document.getElementById('totalRecords').textContent = totalContactsCount;
            
            console.log('🔄 Stored ALL contacts for client-side pagination:', {
                totalContactsCount: totalContactsCount,
                contactsLength: contacts.length
            });
            
            renderContactsTable();
            loadOwnersList();
            
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
        renderContactsTable();
        
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

async function loadOwnersList() {
    try {
        const userData = getUserData();
        if (!userData || !userData.id) return;

        const response = await fetch(`${API_BASE_URL}/owners/list`, {
            method: 'GET',
            headers: {
                'user-id': userData.id
            }
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                populateOwnerFilter(result.data);
            }
        }
    } catch (error) {
        console.error('Error loading owners list:', error);
    }
}

function populateOwnerFilter(owners) {
    const ownerFilter = document.getElementById('ownerFilter');
    // Keep the "All Owners" option
    const allOwnersOption = ownerFilter.querySelector('option[value=""]');
    ownerFilter.innerHTML = '';
    ownerFilter.appendChild(allOwnersOption);
    
    owners.forEach(owner => {
        const option = document.createElement('option');
        option.value = owner;
        option.textContent = owner;
        ownerFilter.appendChild(option);
    });
}

async function saveContactToAPI(contactData, isUpdate = false) {
    try {
        const userData = getUserData();
        if (!userData || !userData.id) {
            throw new Error('Authentication required');
        }

        const url = isUpdate 
            ? `${API_BASE_URL}/${currentContactId}`
            : API_BASE_URL;
        
        const method = isUpdate ? 'PUT' : 'POST';

        console.log(`💾 Saving contact:`, { url, method, contactData });

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'user-id': userData.id
            },
            body: JSON.stringify(contactData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Contact saved successfully');
            return result.data;
        } else {
            throw new Error(result.message || 'Failed to save contact');
        }
    } catch (error) {
        console.error('❌ Error saving contact:', error);
        throw error;
    }
}

async function deleteContactFromAPI(contactId) {
    try {
        const userData = getUserData();
        if (!userData || !userData.id) {
            throw new Error('Authentication required');
        }

        console.log(`🗑️ Deleting contact: ${contactId}`);

        const response = await fetch(`${API_BASE_URL}/${contactId}`, {
            method: 'DELETE',
            headers: {
                'user-id': userData.id
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

        console.log('✅ Contact deleted successfully');
        return result;
    } catch (error) {
        console.error('❌ Error deleting contact:', error);
        throw error;
    }
}

// Contact Management Functions
function addNewContact() {
    currentContactId = null;
    currentEditingContact = null;
    document.getElementById('contactModalTitle').textContent = 'Create New Contact';
    
    // Clear form
    clearContactForm();
    
    const modal = document.getElementById('contactModal');
    modal.style.display = 'flex';
    modal.classList.add('show');
}

function editContact(contactId) {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;
    
    currentContactId = contactId;
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
    document.getElementById('company').value = contact.company || '';
    document.getElementById('email').value = contact.email || '';
    document.getElementById('phone').value = contact.phone || '';
    document.getElementById('status').value = contact.status || 'Lead';
    document.getElementById('owner').value = contact.owner || 'Unassigned';
    document.getElementById('notes').value = contact.notes || '';
}

function clearContactForm() {
    const form = document.getElementById('contactForm');
    if (form) form.reset();
    document.getElementById('status').value = 'Lead';
    document.getElementById('owner').value = 'Unassigned';
}

async function saveContact() {
    try {
        const formData = collectFormData();
        
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

        const savedContact = await saveContactToAPI(formData, !!currentContactId);

        showNotification(
            `Contact ${currentContactId ? 'updated' : 'created'} successfully`, 
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

function collectFormData() {
    return {
        firstName: document.getElementById('firstName')?.value.trim() || '',
        lastName: document.getElementById('lastName')?.value.trim() || '',
        jobTitle: document.getElementById('jobTitle')?.value.trim() || '',
        company: document.getElementById('company')?.value.trim() || '',
        email: document.getElementById('email')?.value.trim() || '',
        phone: document.getElementById('phone')?.value.trim() || '',
        status: document.getElementById('status')?.value || 'Lead',
        owner: document.getElementById('owner')?.value.trim() || 'Unassigned',
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
    
    document.getElementById('deleteContactName').textContent = currentDeleteContact.name;
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

// Rendering Functions
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
                <td colspan="8" class="no-data">
                    <div class="no-contacts-message">
                        <i class="fas fa-users"></i>
                        <h3>No Contacts Found</h3>
                        <p>Get started by creating your first contact</p>
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
            <td class="contact-name-cell">
                <div class="contact-name">${escapeHtml(contact.fullName)}</div>
                ${contact.jobTitle ? `<div class="job-title">${escapeHtml(contact.jobTitle)}</div>` : ''}
            </td>
            <td>${escapeHtml(contact.company)}</td>
            <td class="email-cell">
                <a href="mailto:${escapeHtml(contact.email)}" class="email-link">${escapeHtml(contact.email)}</a>
            </td>
            <td>${escapeHtml(contact.phone || 'N/A')}</td>
            <td><span class="status-badge ${contact.status.toLowerCase()}">${escapeHtml(contact.status)}</span></td>
            <td>${escapeHtml(contact.owner)}</td>
            <td>
                <div class="table-actions">
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
        
        // Update each contact individually
        for (const contactId of selectedIds) {
            const contact = contacts.find(c => c.id === contactId);
            if (contact) {
                const contactData = {
                    ...contact,
                    status: status
                };
                await saveContactToAPI(contactData, true);
            }
        }
        
        showNotification(`${selectedIds.length} contacts updated to ${status}`, 'success');
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
        
        // Delete each contact individually
        for (const contactId of selectedIds) {
            await deleteContactFromAPI(contactId);
        }
        
        showNotification(`${selectedIds.length} contacts deleted successfully`, 'success');
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
    renderContactsTable();
    
    // Update pagination UI
    updatePagination({
        currentPage: currentPage,
        totalPages: Math.ceil(totalContactsCount / itemsPerPage),
        totalContacts: totalContactsCount,
        hasPrev: currentPage > 1,
        hasNext: currentPage < Math.ceil(totalContactsCount / itemsPerPage)
    });
}

function previousPage() {
    changePage(-1);
}

function nextPage() {
    changePage(1);
}

// Modal Management
function closeContactModal() {
    document.getElementById('contactModal').style.display = 'none';
    currentContactId = null;
    currentEditingContact = null;
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    currentDeleteContact = null;
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        modal.style.display = 'none';
        modal.classList.remove('show');
    });
    currentContactId = null;
    currentEditingContact = null;
    currentDeleteContact = null;
}

// Utility Functions
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

// Form Validation
function validateForm() {
    const requiredFields = [
        { id: 'firstName', name: 'First Name' },
        { id: 'lastName', name: 'Last Name' },
        { id: 'company', name: 'Company' },
        { id: 'email', name: 'Email' }
    ];
    
    let isValid = true;
    let firstErrorField = null;
    
    requiredFields.forEach(field => {
        const element = document.getElementById(field.id);
        const value = element.value.trim();
        
        if (!value) {
            element.style.borderColor = '#dc3545';
            element.style.boxShadow = '0 0 0 4px rgba(220, 53, 69, 0.1)';
            
            if (!firstErrorField) {
                firstErrorField = element;
            }
            isValid = false;
        } else {
            element.style.borderColor = '#e9ecef';
            element.style.boxShadow = '';
        }
    });
    
    // Email validation
    const email = document.getElementById('email').value.trim();
    if (email && !isValidEmail(email)) {
        const element = document.getElementById('email');
        element.style.borderColor = '#dc3545';
        element.style.boxShadow = '0 0 0 4px rgba(220, 53, 69, 0.1)';
        showNotification('Please enter a valid email address', 'error');
        isValid = false;
    }
    
    if (!isValid) {
        if (firstErrorField) {
            firstErrorField.focus();
        }
        showNotification('Please fill in all required fields', 'error');
    }
    
    return isValid;
}

function handleFormValidation(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
        if (e.target.value.trim()) {
            e.target.style.borderColor = '#e9ecef';
            e.target.style.boxShadow = '';
        }
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

    const firstLetter = name.charAt(0).toUpperCase();
    const backgroundColor = getAvatarColor();

    if (element.tagName === 'IMG') {
        const canvas = document.createElement('canvas');
        const size = 200;
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');

        const gradient = context.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, '#00BCD4');
        gradient.addColorStop(1, '#1E88E5');

        context.fillStyle = gradient;
        context.fillRect(0, 0, size, size);

        context.fillStyle = '#FFFFFF';
        context.font = `bold ${size * 0.4}px Inter, Arial, sans-serif`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(firstLetter, size / 2, size / 2);

        element.src = canvas.toDataURL();
        element.alt = name;
    } else {
        element.style.background = backgroundColor;
        const letterSpan = element.querySelector('.avatar-letter');
        if (letterSpan) {
            letterSpan.textContent = firstLetter;
        } else {
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
        
        const sidebarAvatar = document.getElementById('userAvatar');
        if (sidebarAvatar) {
            createLetterAvatar(userName, sidebarAvatar);
        }

    } catch (error) {
        console.error('Error updating avatar:', error);
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
            sidebarToggleIcon.className = 'fas fa-chevron-right';
            console.log('🔧 Sidebar collapsed - showing right chevron');
        } else {
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
    document.querySelectorAll('.user-dropdown').forEach(dropdown => {
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

// Export function
async function exportContacts() {
    try {
        const userData = getUserData();
        if (!userData || !userData.id) {
            showNotification('Please login to export contacts', 'error');
            return;
        }

        showNotification('Export feature coming soon', 'info');
    } catch (error) {
        console.error('Error exporting contacts:', error);
        showNotification('Failed to export contacts: ' + error.message, 'error');
    }
}

console.log('Contact Management System initialized with new modal-based structure');