// Contact Management System with Backend Integration

// Global variables
let contacts = [];
let filteredContacts = [];
let currentEditingContact = null;
let currentDeleteContact = null;
let currentPage = 1;
let itemsPerPage = 4;
let totalContacts = 0;

// API Base URL
const API_BASE_URL = 'https://crm-admin-panel-production.up.railway.app/api/contacts';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Contact Management System initializing...');
    
    // Check authentication first
    if (!checkAuthentication()) {
        console.log('Authentication failed, redirecting to login');
        return;
    }
    
    console.log('Authentication successful, initializing contacts');
    
    initializeContacts();
    setupEventListeners();
    displayUserName();
    loadContacts();
    
    // Load sidebar state
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (sidebarCollapsed) {
        document.querySelector('.app-container').classList.add('sidebar-collapsed');
    }
    
    console.log('✅ Contact Management System initialized successfully');
});

function checkAuthentication() {
    console.log('🔐 Checking authentication...');
    
    const userData = getUserData();
    const token = localStorage.getItem('authToken');
    
    console.log('🔐 Auth check - UserData:', userData);
    console.log('🔐 Auth check - Token:', !!token);
    
    if (!userData || !token) {
        console.warn('❌ Authentication failed: Missing userData or token');
        
        // Clear any inconsistent data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        localStorage.removeItem('authToken');
        
        showNotification('Please login to access contacts', 'error');
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
        return false;
    }
    
    console.log('✅ Authentication successful');
    return true;
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

function initializeContacts() {
    console.log('📇 Contact Management System initialized with backend integration');
}

function setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
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

    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.dataset.page;
            console.log(`🔄 Navigation clicked: ${page}`);
            handleNavigation(page);
        });
    });

    // Initialize active menu manager
    window.activeMenuManager = new ActiveMenuManager();
    
    console.log('✅ Event listeners setup complete');
}

// Active Menu Manager
class ActiveMenuManager {
    constructor() {
        this.currentActiveMenu = null;
        this.init();
    }

    init() {
        // Set contacts as default active menu
        this.setActiveMenu('contacts');
        
        // Add click event listeners to all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                this.setActiveMenu(page);
                
                // Handle navigation
                this.navigateToPage(page, link.getAttribute('href'));
            });
        });

        // Load saved active menu from session storage
        this.loadSavedActiveMenu();
    }

    setActiveMenu(page) {
        // Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        // Add active class to clicked nav link
        const activeLink = document.querySelector(`.nav-link[data-page="${page}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
            this.currentActiveMenu = page;
            
            // Save to session storage
            this.saveActiveMenu(page);
        }
    }

    saveActiveMenu(page) {
        sessionStorage.setItem('activeMenu', page);
    }

    loadSavedActiveMenu() {
        const savedMenu = sessionStorage.getItem('activeMenu');
        if (savedMenu) {
            this.setActiveMenu(savedMenu);
        }
    }

    navigateToPage(page, href) {
        console.log(`🔄 Navigating to: ${page}`);
        
        if (href && href !== '#' && !href.includes('javascript')) {
            showNotification(`Loading ${this.getPageTitle(page)}...`, 'info');
            // window.location.href = href; // Uncomment for actual navigation
        }
    }

    getPageTitle(page) {
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
}

// Update the handleNavigation function in script.js
function handleNavigation(page) {
    console.log(`Navigation requested to: ${page}`);
    
    // Define navigation routes with actual file paths
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
            window.location.href = route;
        }, 500);
    } else {
        console.warn(`No route defined for page: ${page}`);
        showNotification(`Page ${page} is not available yet`, 'warning');
    }
}

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

function displayUserName() {
    const userData = getUserData();
    const userNameElement = document.getElementById('userDisplayName');
    
    console.log('👤 Displaying user name for:', userData);
    
    if (userData && userData.name) {
        userNameElement.textContent = userData.name;
        console.log('✅ User name displayed:', userData.name);
    } else {
        // If no name found, try other fields
        const displayName = userData?.username || userData?.email || 'User';
        userNameElement.textContent = displayName;
        console.log('✅ Fallback name displayed:', displayName);
    }
    
    // Make the name clickable to open profile
    userNameElement.style.cursor = 'pointer';
    userNameElement.title = 'Click to view profile';
    
    // Add click event to open profile
    userNameElement.onclick = function(e) {
        e.stopPropagation();
        showNotification('Profile feature coming soon', 'info');
    };
}

// API Functions
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
        const ownerFilter = document.getElementById('ownerFilter')?.value || '';

        const params = new URLSearchParams({
            page: currentPage,
            limit: itemsPerPage,
            ...(search && { search }),
            ...(statusFilter && { status: statusFilter }),
            ...(ownerFilter && { owner: ownerFilter }),
            sortBy: 'createdAt',
            sortOrder: 'desc'
        });

        console.log(`📡 Loading contacts with params:`, Object.fromEntries(params));

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

        if (result.success) {
            console.log(`✅ Successfully loaded ${result.data.length} contacts`);
            
            contacts = result.data.map(contact => ({
                id: contact._id,
                firstName: contact.firstName,
                lastName: contact.lastName,
                fullName: contact.fullName,
                jobTitle: contact.jobTitle,
                company: contact.company,
                email: contact.email,
                phone: contact.phone,
                status: contact.status,
                owner: contact.owner,
                notes: contact.notes,
                createdAt: contact.createdAt
            }));

            filteredContacts = [...contacts];
            totalContacts = result.total;
            
            renderContacts();
            updatePagination(result.pagination);
            loadOwnersList();
            
        } else {
            throw new Error(result.message || 'Failed to load contacts');
        }
    } catch (error) {
        console.error('❌ Error loading contacts:', error);
        showNotification('Failed to load contacts: ' + error.message, 'error');
        
        // Fallback: Show empty state
        contacts = [];
        filteredContacts = [];
        renderContacts();
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
            ? `${API_BASE_URL}/${currentEditingContact.id}`
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
    currentEditingContact = null;
    document.getElementById('contactModalTitle').textContent = 'Add New Contact';
    clearContactForm();
    
    const modal = document.getElementById('contactModal');
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    console.log('➕ Opening add contact modal');
}

function editContact(contactId) {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) {
        console.warn(`❌ Contact not found: ${contactId}`);
        return;
    }
    
    currentEditingContact = contact;
    document.getElementById('contactModalTitle').textContent = 'Edit Contact';
    populateContactForm(contact);
    
    const modal = document.getElementById('contactModal');
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    console.log('✏️ Opening edit contact modal for:', contact.fullName);
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
    form.reset();
    document.getElementById('status').value = 'Lead';
    document.getElementById('owner').value = 'Unassigned';
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

        const savedContact = await saveContactToAPI(formData, !!currentEditingContact);

        showNotification(
            `Contact ${currentEditingContact ? 'updated' : 'added'} successfully`, 
            'success'
        );

        closeContactModal();
        await loadContacts(); // Reload contacts from server
        
    } catch (error) {
        console.error('❌ Error saving contact:', error);
        showNotification('Failed to save contact: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

function getContactFormData() {
    return {
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        jobTitle: document.getElementById('jobTitle').value.trim(),
        company: document.getElementById('company').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        status: document.getElementById('status').value,
        owner: document.getElementById('owner').value,
        notes: document.getElementById('notes').value.trim()
    };
}

function deleteContact(contactId) {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) {
        console.warn(`❌ Contact not found for deletion: ${contactId}`);
        return;
    }
    
    currentDeleteContact = {
        id: contactId,
        name: contact.fullName || `${contact.firstName} ${contact.lastName}`
    };
    
    document.getElementById('deleteContactName').textContent = currentDeleteContact.name;
    const modal = document.getElementById('deleteModal');
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    console.log('🗑️ Opening delete confirmation for:', currentDeleteContact.name);
}

async function confirmDelete() {
    if (!currentDeleteContact) return;
    
    try {
        showLoading(true);
        await deleteContactFromAPI(currentDeleteContact.id);
        
        showNotification('Contact deleted successfully', 'success');
        closeDeleteModal();
        await loadContacts(); // Reload contacts from server
        
    } catch (error) {
        console.error('❌ Error deleting contact:', error);
        showNotification('Failed to delete contact: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Rendering Functions
function renderContacts() {
    const tbody = document.getElementById('contactsTableBody');
    const emptyState = document.getElementById('emptyState');
    const loadingState = document.getElementById('loadingState');
    
    // Hide loading state
    loadingState.style.display = 'none';
    
    if (contacts.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        console.log('📭 No contacts to display');
        return;
    }
    
    emptyState.style.display = 'none';
    tbody.innerHTML = '';
    
    console.log(`🔄 Rendering ${contacts.length} contacts`);
    
    contacts.forEach(contact => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="contact-name">
                    <strong>${contact.firstName} ${contact.lastName}</strong>
                    ${contact.jobTitle ? `<div class="job-title">${contact.jobTitle}</div>` : ''}
                </div>
            </td>
            <td>${contact.company}</td>
            <td>
                <a href="mailto:${contact.email}" class="email-link">${contact.email}</a>
            </td>
            <td>${contact.phone || 'N/A'}</td>
            <td>
                <span class="status-badge ${contact.status}">${contact.status}</span>
            </td>
            <td>${contact.owner}</td>
            <td>
                <div class="table-actions">
                    <button class="table-action-btn edit" onclick="event.stopPropagation(); editContact('${contact.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="table-action-btn delete" onclick="event.stopPropagation(); deleteContact('${contact.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Filtering and Search
function filterContacts() {
    currentPage = 1;
    console.log('🔍 Applying filters');
    loadContacts();
}

function performSearch(query) {
    currentPage = 1;
    console.log(`🔍 Performing search: "${query}"`);
    loadContacts();
}

// Pagination
function updatePagination(paginationData) {
    const startElement = document.getElementById('paginationStart');
    const endElement = document.getElementById('paginationEnd');
    const totalElement = document.getElementById('paginationTotal');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (!startElement || !endElement || !totalElement) {
        console.warn('❌ Pagination elements not found');
        return;
    }
    
    const startIndex = ((currentPage - 1) * itemsPerPage) + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, totalContacts);
    
    startElement.textContent = startIndex;
    endElement.textContent = endIndex;
    totalElement.textContent = totalContacts;
    
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= paginationData.pages;
    
    renderPaginationNumbers(paginationData.pages);
    
    console.log(`📄 Pagination: Page ${currentPage} of ${paginationData.pages}`);
}

function renderPaginationNumbers(totalPages) {
    const container = document.getElementById('paginationNumbers');
    if (!container) {
        console.warn('❌ Pagination numbers container not found');
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
    goToPage(newPage);
}

function goToPage(page) {
    currentPage = page;
    console.log(`📄 Changing to page: ${page}`);
    loadContacts();
}

// Export Function
function exportContacts() {
    console.log('📤 Exporting contacts');
    showNotification('Export feature coming soon', 'info');
}

// Utility Functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showLoading(show) {
    const loadingState = document.getElementById('loadingState');
    const contactsSection = document.querySelector('.contacts-section');
    
    if (show) {
        contactsSection.style.opacity = '0.6';
        loadingState.style.display = 'block';
        console.log('⏳ Showing loading state');
    } else {
        contactsSection.style.opacity = '1';
        loadingState.style.display = 'none';
        console.log('✅ Hiding loading state');
    }
}

// Modal Management
function closeContactModal() {
    const modal = document.getElementById('contactModal');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
    currentEditingContact = null;
    console.log('❌ Closing contact modal');
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
    currentDeleteContact = null;
    console.log('❌ Closing delete modal');
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    });
    currentEditingContact = null;
    currentDeleteContact = null;
    console.log('❌ Closing all modals');
}

// Sidebar and Dashboard Functions
function toggleSidebar() {
    const appContainer = document.querySelector('.app-container');
    appContainer.classList.toggle('sidebar-collapsed');
    localStorage.setItem('sidebarCollapsed', appContainer.classList.contains('sidebar-collapsed'));
    console.log('📱 Sidebar toggled');
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

function toggleNotifications() {
    const dropdown = document.getElementById('notificationsDropdown');
    const isVisible = dropdown.classList.contains('show');
    closeAllDropdowns();
    if (!isVisible) {
        dropdown.classList.add('show');
        console.log('🔔 Opening notifications');
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

function markAllRead() {
    const badge = document.getElementById('notificationCount');
    badge.textContent = '0';
    badge.style.display = 'none';
    closeAllDropdowns();
    showNotification('All notifications marked as read', 'success');
    console.log('📬 All notifications marked as read');
}

function viewNotification(id) {
    closeAllDropdowns();
    showNotification(`Viewing notification ${id}`, 'info');
    console.log(`👀 Viewing notification: ${id}`);
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

console.log('✅ Contact Management System fully initialized');