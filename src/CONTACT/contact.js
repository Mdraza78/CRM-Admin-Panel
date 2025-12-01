// contact.js - Fixed to original design with only 7 columns

// Global variables
let contacts = [];
let filteredContacts = [];
let currentEditingContact = null;
let currentDeleteContact = null;
let currentPage = 1;
let itemsPerPage = 6;
let totalContactsCount = 0;

// API Base URL
const API_BASE_URL = 'https://crm-admin-panel-production.up.railway.app/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Contact.js - DOM Content Loaded');
    setupEventListeners();
    displayUserName();
    
    // Load contacts immediately
    loadContacts().then(() => {
        console.log('Contacts loaded successfully');
    }).catch(error => {
        console.error('Failed to load contacts:', error);
        showNotification('Failed to load contacts: ' + error.message, 'error');
    });
    
    // Load sidebar state
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (sidebarCollapsed) {
        document.querySelector('.app-container').classList.add('sidebar-collapsed');
    }
});

function getToken() {
    const token = localStorage.getItem('authToken');
    console.log('🔑 Token available:', !!token);
    return token || '';
}

function getUserData() {
    try {
        const userDataString = localStorage.getItem('userData');
        if (!userDataString) {
            console.warn('❌ No user data found in localStorage');
            return null;
        }
        
        const userData = JSON.parse(userDataString);
        if (userData && userData.id) {
            return userData;
        }
        return null;
        
    } catch (error) {
        console.error('❌ Error parsing user data:', error);
        return null;
    }
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.dataset.page;
            if (page && page !== 'unknown') {
                handleNavigation(page);
            }
        });
    });

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
}

function handleNavigation(page) {
    console.log('Navigation requested to page:', page);
    const routes = {
        'dashboard': '/MAIN_PAGE/index.html',
        'leads': '/show_new_demo/show.html', 
        'industry-leads': '/INDUSTRY_LEAD_PAGE/demo.html',
        'deals': 'https://crm-admin-panel.vercel.app/DEAL/deal.html',
        'contacts': 'https://crm-admin-panel.vercel.app/CONTACT/contact.html',
        'invoice': 'https://crm-admin-panel.vercel.app/INVOICE/invoice.html',
        'salary': 'https://crm-admin-panel.vercel.app/main/SALARY/Salary.html'
    };
    
    const route = routes[page];
    if (route) {
        showNotification(`Loading ${getPageTitle(page)}...`, 'info');
        setTimeout(() => {
            window.location.href = route;
        }, 500);
    }
}

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

function displayUserName() {
    try {
        const userData = getUserData();
        const userNameElement = document.getElementById('userDisplayName');
        
        let displayName = 'User';
        if (userData) {
            displayName = userData.name || userData.username || userData.email || 'User';
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

// MAIN FUNCTION: Load Contacts
async function loadContacts() {
    try {
        console.log('📡 Loading contacts...');
        
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

        console.log('🔍 Filters:', { search, statusFilter, ownerFilter });

        // Fetch from API
        const response = await fetch(`${API_BASE_URL}/contacts`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('📡 Response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('📊 Server response received');

        if (result.success) {
            // Get contacts data
            let contactsData = result.data || result.contacts || [];
            console.log(`✅ Successfully loaded ${contactsData.length} contacts`);
            
            // Transform data to match our structure
            contacts = contactsData.map(contact => ({
                id: contact._id || contact.id,
                firstName: contact.firstName || '',
                lastName: contact.lastName || '',
                fullName: contact.fullName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
                jobTitle: contact.jobTitle || '',
                company: contact.company || '',
                email: contact.email || '',
                phone: contact.phone || '',
                status: contact.status || 'Lead',
                owner: contact.owner || 'Unassigned',
                notes: contact.notes || '',
                createdDate: contact.createdAt || contact.createdDate || new Date().toISOString()
            }));

            // Apply filters
            filteredContacts = [...contacts];
            
            if (search) {
                const searchLower = search.toLowerCase();
                filteredContacts = filteredContacts.filter(contact => 
                    (contact.fullName && contact.fullName.toLowerCase().includes(searchLower)) ||
                    (contact.email && contact.email.toLowerCase().includes(searchLower)) ||
                    (contact.company && contact.company.toLowerCase().includes(searchLower)) ||
                    (contact.phone && contact.phone.includes(search))
                );
            }
            
            if (statusFilter) {
                filteredContacts = filteredContacts.filter(contact => 
                    contact.status === statusFilter
                );
            }
            
            if (ownerFilter) {
                filteredContacts = filteredContacts.filter(contact => 
                    contact.owner === ownerFilter
                );
            }
            
            totalContactsCount = filteredContacts.length;
            
            // Update total records display
            document.getElementById('totalRecords').textContent = totalContactsCount;
            
            console.log(`🔄 ${filteredContacts.length} contacts after filtering`);
            
            renderContacts();
            updatePagination();
            
        } else {
            throw new Error(result.message || 'Failed to load contacts');
        }
    } catch (error) {
        console.error('❌ Error loading contacts:', error);
        showNotification('Failed to load contacts: ' + error.message, 'error');
        
        // Fallback to empty state
        contacts = [];
        filteredContacts = [];
        renderContacts();
        updatePagination();
    }
}

// Render Contacts Table (7 columns only)
function renderContacts() {
    console.log('🔄 Rendering contacts table');
    
    const tbody = document.getElementById('contactsTableBody');
    if (!tbody) {
        console.error('Contacts table body not found');
        return;
    }
    
    tbody.innerHTML = '';

    // If no contacts, show empty state
    if (filteredContacts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="no-data" style="text-align: center; padding: 40px;">
                    <i class="fas fa-users" style="font-size: 48px; color: #cbd5e1; margin-bottom: 20px;"></i>
                    <h3 style="color: #374151; margin-bottom: 10px;">No Contacts Found</h3>
                    <p style="color: #6b7280; margin-bottom: 20px;">Get started by adding your first contact</p>
                    <button class="btn-primary" onclick="addNewContact()">
                        <i class="fas fa-plus"></i> Add New Contact
                    </button>
                </td>
            </tr>
        `;
        return;
    }

    // Calculate pagination indices
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredContacts.length);
    
    // Get only the contacts for the current page
    const contactsToRender = filteredContacts.slice(startIndex, endIndex);

    console.log(`📄 Rendering ${contactsToRender.length} contacts for page ${currentPage}`);

    // Render the paginated contacts
    contactsToRender.forEach(contact => {
        const row = document.createElement('tr');
        
        // Format phone number
        let phoneDisplay = 'NA';
        if (contact.phone) {
            phoneDisplay = contact.phone;
        }
        
        // Create full name
        const fullName = contact.fullName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unknown';
        
        row.innerHTML = `
            <td><strong>${escapeHtml(fullName)}</strong></td>
            <td>${escapeHtml(contact.company || 'NA')}</td>
            <td><a href="mailto:${contact.email}" class="email-link">${escapeHtml(contact.email || 'NA')}</a></td>
            <td>${escapeHtml(phoneDisplay)}</td>
            <td><span class="status-badge ${contact.status}">${escapeHtml(contact.status)}</span></td>
            <td>${escapeHtml(contact.owner || 'Unassigned')}</td>
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

    console.log('✅ Successfully rendered contacts table');
}

// Update Pagination
function updatePagination() {
    const startElement = document.getElementById('paginationStart');
    const endElement = document.getElementById('paginationEnd');
    const totalElement = document.getElementById('paginationTotal');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (!startElement || !endElement || !totalElement || !prevBtn || !nextBtn) {
        console.warn('Pagination elements not found');
        return;
    }
    
    const totalPages = Math.ceil(totalContactsCount / itemsPerPage);
    const startIndex = totalContactsCount > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0;
    const endIndex = Math.min(currentPage * itemsPerPage, totalContactsCount);
    
    startElement.textContent = startIndex;
    endElement.textContent = endIndex;
    totalElement.textContent = totalContactsCount;
    
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages || totalPages === 0;
    
    renderPaginationNumbers(totalPages);
}

function renderPaginationNumbers(totalPages) {
    const container = document.getElementById('paginationNumbers');
    if (!container) return;
    
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
    const totalPages = Math.ceil(totalContactsCount / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderContacts();
    updatePagination();
}

// Contact Management Functions
function addNewContact() {
    currentEditingContact = null;
    document.getElementById('contactModalTitle').textContent = 'Add New Contact';
    clearContactForm();
    
    const modal = document.getElementById('contactModal');
    modal.style.display = 'flex';
}

function editContact(contactId) {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;
    
    currentEditingContact = contact;
    document.getElementById('contactModalTitle').textContent = 'Edit Contact';
    populateContactForm(contact);
    
    const modal = document.getElementById('contactModal');
    modal.style.display = 'flex';
}

function populateContactForm(contact) {
    document.getElementById('firstName').value = contact.firstName || '';
    document.getElementById('lastName').value = contact.lastName || '';
    document.getElementById('jobTitle').value = contact.jobTitle || '';
    document.getElementById('company').value = contact.company || '';
    document.getElementById('email').value = contact.email || '';
    document.getElementById('phone').value = contact.phone || '';
    document.getElementById('status').value = contact.status || 'Lead';
    document.getElementById('owner').value = contact.owner || '';
    document.getElementById('notes').value = contact.notes || '';
}

function clearContactForm() {
    const form = document.getElementById('contactForm');
    if (form) {
        form.reset();
        document.getElementById('status').value = 'Lead';
    }
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

        const token = getToken();
        if (!token) {
            showNotification('Please login to save contact', 'error');
            return;
        }

        const url = currentEditingContact 
            ? `${API_BASE_URL}/contacts/${currentEditingContact.id}`
            : `${API_BASE_URL}/contacts`;
        
        const method = currentEditingContact ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
            showNotification(
                `Contact ${currentEditingContact ? 'updated' : 'added'} successfully`, 
                'success'
            );
            closeContactModal();
            await loadContacts();
        } else {
            throw new Error(result.message || 'Failed to save contact');
        }
        
    } catch (error) {
        console.error('❌ Error saving contact:', error);
        showNotification('Failed to save contact: ' + error.message, 'error');
    }
}

function getContactFormData() {
    return {
        firstName: document.getElementById('firstName')?.value.trim() || '',
        lastName: document.getElementById('lastName')?.value.trim() || '',
        jobTitle: document.getElementById('jobTitle')?.value.trim() || '',
        company: document.getElementById('company')?.value.trim() || '',
        email: document.getElementById('email')?.value.trim() || '',
        phone: document.getElementById('phone')?.value.trim() || '',
        status: document.getElementById('status')?.value || 'Lead',
        owner: document.getElementById('owner')?.value.trim() || '',
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
        const token = getToken();
        if (!token) {
            showNotification('Please login to delete contact', 'error');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/contacts/${currentDeleteContact.id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
            showNotification('Contact deleted successfully', 'success');
            closeDeleteModal();
            await loadContacts();
        } else {
            throw new Error(result.message || 'Failed to delete contact');
        }
        
    } catch (error) {
        console.error('❌ Error deleting contact:', error);
        showNotification('Failed to delete contact: ' + error.message, 'error');
    }
}

// Filtering and Search
function filterContacts() {
    console.log('🔍 Filtering contacts');
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
    console.log('🔍 Searching:', query);
    currentPage = 1;
    loadContacts();
}

function sortTable(column) {
    console.log('Sorting by:', column);
    // You can implement client-side sorting here if needed
}

// Utility Functions
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

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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

function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.style.display = 'none';
    });
    currentEditingContact = null;
    currentDeleteContact = null;
}

// Sidebar Functions
function toggleSidebar() {
    const appContainer = document.querySelector('.app-container');
    const sidebarToggleIcon = document.getElementById('sidebarToggleIcon');
    const floatingToggleIcon = document.getElementById('floatingToggleIcon');
    
    const isCollapsed = appContainer.classList.toggle('sidebar-collapsed');
    
    if (sidebarToggleIcon) {
        sidebarToggleIcon.className = isCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left';
    }
    
    if (floatingToggleIcon) {
        floatingToggleIcon.className = 'fas fa-chevron-right';
    }
    
    localStorage.setItem('sidebarCollapsed', isCollapsed);
}

// User Menu Functions
function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    const isVisible = dropdown.classList.contains('show');
    closeAllDropdowns();
    if (!isVisible) {
        dropdown.classList.add('show');
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
        showNotification('Logging out...', 'info');
        
        localStorage.removeItem('userData');
        localStorage.removeItem('authToken');
        
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
    }
}

// Avatar Functions
function updateUserAvatar() {
    try {
        const userData = getUserData();
        const userName = userData ? (userData.name || userData.username || userData.email || 'User') : 'User';
        
        const sidebarAvatar = document.getElementById('userAvatar');
        if (sidebarAvatar) {
            sidebarAvatar.style.background = 'linear-gradient(135deg, #00BCD4 0%, #1E88E5 100%)';
            const letterSpan = sidebarAvatar.querySelector('.avatar-letter');
            if (letterSpan) {
                letterSpan.textContent = userName.charAt(0).toUpperCase();
            }
        }
    } catch (error) {
        console.error('Error updating avatar:', error);
    }
}

// Notification System
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `toast-notification toast-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 25px;
        right: 25px;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-width: 300px;
        max-width: 400px;
        color: white;
        font-family: 'Inter', sans-serif;
        font-weight: 500;
    `;
    
    // Set background based on type
    if (type === 'success') {
        notification.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    } else if (type === 'error') {
        notification.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    } else if (type === 'warning') {
        notification.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
    } else {
        notification.style.background = 'linear-gradient(135deg, #00BCD4 0%, #1E88E5 100%)';
    }
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas ${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: white; cursor: pointer; font-size: 20px; margin-left: 15px;">×</button>
    `;
    
    // Remove existing notifications
    const existingNotification = document.querySelector('.toast-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Add to document
    document.body.appendChild(notification);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
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

console.log('✅ Contact Management System initialized with original 7-column design');