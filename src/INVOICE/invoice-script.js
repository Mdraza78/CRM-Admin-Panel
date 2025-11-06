// Invoice Management System with Backend Integration

// Global variables
let currentInvoiceId = null;
let allInvoices = [];
let currentEditingInvoice = null;
let currentDeleteInvoice = null;

// API Base URL
const API_BASE_URL = 'https://crm-admin-panel-production.up.railway.app/api/invoices';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Invoice Management System initializing...');
    
    // Check authentication first
    if (!checkAuthentication()) {
        console.log('Authentication failed, redirecting to login');
        return;
    }
    
    console.log('Authentication successful, initializing invoices');
    
    initializeInvoices();
    setupEventListeners();
    displayUserName();
    
    // Load sidebar state
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (sidebarCollapsed) {
        document.querySelector('.app-container').classList.add('sidebar-collapsed');
    }
    
    // Show invoices list by default
    showInvoicesList();
    
    console.log('✅ Invoice Management System initialized successfully');
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
        
        showNotification('Please login to access invoices', 'error');
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

function initializeInvoices() {
    console.log('📇 Invoice Management System initialized with backend integration');
    
    // Set today's date
    document.getElementById('invoiceDate').valueAsDate = new Date();
    
    // Get next invoice code
    initializeForm();
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
        // Set invoice as default active menu
        this.setActiveMenu('invoice');
        
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

// Navigation function
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
async function initializeForm() {
    try {
        const token = getToken();
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/code/next`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                document.getElementById('invoiceCode').value = result.nextInvoiceCode;
            }
        } else {
            // Fallback: Generate code locally
            document.getElementById('invoiceCode').value = generateInvoiceCode();
        }
    } catch (error) {
        console.error('Error fetching next invoice code:', error);
        document.getElementById('invoiceCode').value = generateInvoiceCode();
    }
}

function generateInvoiceCode() {
    const currentYear = new Date().getFullYear();
    const prefix = 'GDG';
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${currentYear}${randomNum}`;
}

function getToken() {
    return localStorage.getItem('authToken') || '';
}

// View Management
function showInvoiceGenerator() {
    document.getElementById('invoices-list').classList.add('hidden');
    document.getElementById('invoice-generator').classList.remove('hidden');
    document.getElementById('invoice-preview').classList.add('hidden');
    resetForm();
}

function showInvoicesList() {
    document.getElementById('invoices-list').classList.remove('hidden');
    document.getElementById('invoice-generator').classList.add('hidden');
    document.getElementById('invoice-preview').classList.add('hidden');
    loadInvoices();
}

function showInvoicePreview() {
    document.getElementById('invoices-list').classList.add('hidden');
    document.getElementById('invoice-generator').classList.add('hidden');
    document.getElementById('invoice-preview').classList.remove('hidden');
}

// Main Functions
async function saveInvoice() {
    try {
        const invoiceData = collectFormData();
        
        if (!validateForm(invoiceData)) {
            return;
        }

        const token = getToken();
        if (!token) {
            showNotification('Please login to save invoice', 'error');
            return;
        }

        const url = currentInvoiceId ? `${API_BASE_URL}/${currentInvoiceId}` : API_BASE_URL;
        const method = currentInvoiceId ? 'PUT' : 'POST';

        console.log(`💾 Saving invoice:`, { url, method, invoiceData });

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(invoiceData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || result.message || `HTTP error! status: ${response.status}`);
        }

        if (result.success) {
            const savedInvoice = result.data;
            
            showNotification(
                result.message || (currentInvoiceId ? 'Invoice updated successfully!' : 'Invoice created successfully!'), 
                'success'
            );
            
            // Show preview of the saved invoice
            populatePreview(savedInvoice);
            showInvoicePreview();
            
        } else {
            throw new Error(result.message || 'Failed to save invoice');
        }
        
    } catch (error) {
        console.error('❌ Error saving invoice:', error);
        showNotification(`Error: ${error.message}`, 'error');
    }
}


function collectFormData() {
    return {
        invoiceCode: document.getElementById('invoiceCode').value,
        invoiceDate: document.getElementById('invoiceDate').value,
        clientName: document.getElementById('clientName').value.trim(),
        clientCompany: document.getElementById('clientCompany').value.trim(),
        clientAddress: document.getElementById('clientAddress').value.trim(),
        scope: document.getElementById('scope').value.trim(),
        totalRecords: document.getElementById('records').value,
        price: parseFloat(document.getElementById('price').value) || 0,
        status: document.getElementById('status').value
    };
}

function validateForm(data) {
    if (!data.clientName) {
        showNotification('Client name is required', 'error');
        document.getElementById('clientName').focus();
        return false;
    }
    
    if (!data.clientCompany) {
        showNotification('Client company is required', 'error');
        document.getElementById('clientCompany').focus();
        return false;
    }
    
    if (!data.clientAddress) {
        showNotification('Client address is required', 'error');
        document.getElementById('clientAddress').focus();
        return false;
    }
    
    if (!data.price || data.price <= 0) {
        showNotification('Valid price is required', 'error');
        document.getElementById('price').focus();
        return false;
    }
    
    return true;
}

function previewInvoice() {
    const formData = collectFormData();
    if (!validateForm(formData)) return;
    
    // Create a temporary invoice object for preview
    const tempInvoice = {
        ...formData,
        _id: 'preview',
        invoiceDate: new Date(formData.invoiceDate).toISOString()
    };
    
    populatePreview(tempInvoice);
    showInvoicePreview();
}

function populatePreview(invoice) {
    // Basic info
    document.getElementById('preview-invoiceCode').textContent = invoice.invoiceCode;
    document.getElementById('preview-invoiceDate').textContent = 
        new Date(invoice.invoiceDate).toLocaleDateString();
    document.getElementById('preview-clientName').textContent = invoice.clientName;
    document.getElementById('preview-clientCompany').textContent = invoice.clientCompany;
    document.getElementById('preview-clientAddress').textContent = invoice.clientAddress;
    
    // Table data
    document.getElementById('preview-scope').textContent = invoice.scope;
    document.getElementById('preview-records').textContent = invoice.totalRecords;
    document.getElementById('preview-price').textContent = `$${invoice.price.toFixed(2)}`;
    
    // Status
    const statusElement = document.getElementById('preview-status');
    statusElement.textContent = invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1);
    statusElement.className = `status-badge ${invoice.status}`;
    
    // Store invoice ID for later use
    currentInvoiceId = invoice._id !== 'preview' ? invoice._id : null;
}

function createNewInvoice() {
    currentInvoiceId = null;
    resetForm();
    showInvoiceGenerator();
}

function resetForm() {
    document.getElementById('invoiceForm').reset();
    document.getElementById('invoiceDate').valueAsDate = new Date();
    initializeForm();
    document.getElementById('status').value = 'draft';
}

// Update the loadInvoices function to handle API errors gracefully
async function loadInvoices() {
    try {
        showLoading(true);
        
        const token = getToken();
        if (!token) {
            showNotification('Please login to access invoices', 'error');
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
            return;
        }

        const response = await fetch(API_BASE_URL, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            console.log(`✅ Successfully loaded ${result.data.length} invoices`);
            
            allInvoices = result.data.map(invoice => ({
                _id: invoice._id,
                invoiceCode: invoice.invoiceCode,
                invoiceDate: invoice.invoiceDate,
                clientName: invoice.clientName,
                clientCompany: invoice.clientCompany,
                price: invoice.price,
                status: invoice.status,
                scope: invoice.scope,
                totalRecords: invoice.totalRecords,
                clientAddress: invoice.clientAddress
            }));

            renderInvoicesTable(allInvoices);
            
        } else {
            throw new Error(result.message || 'Failed to load invoices');
        }
    } catch (error) {
        console.error('❌ Error loading invoices:', error);
        showNotification('Failed to load invoices: ' + error.message, 'error');
        // Load sample data for demonstration
        loadSampleData();
    } finally {
        showLoading(false);
    }
}

function loadSampleData() {
    allInvoices = [
        {
            _id: '1',
            invoiceCode: 'GDG20250001',
            invoiceDate: '2025-10-16T00:00:00.000Z',
            clientName: 'Md Raza',
            clientCompany: 'Deloitte',
            price: 5000.00,
            status: 'draft',
            scope: 'Data enrichment services',
            totalRecords: '10,000',
            clientAddress: '123 Business Ave, New York, NY'
        },
        {
            _id: '2',
            invoiceCode: 'GDG20250002',
            invoiceDate: '2025-10-15T00:00:00.000Z',
            clientName: 'Sarah Wilson',
            clientCompany: 'TechStart Inc',
            price: 7500.00,
            status: 'sent',
            scope: 'Data enrichment services',
            totalRecords: '15,000',
            clientAddress: '456 Tech Street, San Francisco, CA'
        }
    ];
    renderInvoicesTable(allInvoices);
}

function renderInvoicesTable(invoices) {
    const tbody = document.getElementById('invoicesTableBody');
    const emptyState = document.getElementById('emptyState');
    const loadingState = document.getElementById('loadingState');
    
    // Hide loading state
    loadingState.style.display = 'none';
    
    if (invoices.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        console.log('📭 No invoices to display');
        return;
    }
    
    emptyState.style.display = 'none';
    tbody.innerHTML = '';
    
    console.log(`🔄 Rendering ${invoices.length} invoices`);
    
    invoices.forEach(invoice => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${invoice.invoiceCode}</td>
            <td>${new Date(invoice.invoiceDate).toLocaleDateString()}</td>
            <td>${invoice.clientName}</td>
            <td>${invoice.clientCompany}</td>
            <td>$${invoice.price.toFixed(2)}</td>
            <td><span class="status-badge ${invoice.status}">${invoice.status}</span></td>
            <td class="actions">
                <button class="action-btn view" onclick="viewInvoice('${invoice._id}')" title="View">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn edit" onclick="editInvoice('${invoice._id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete" onclick="confirmDeleteInvoice('${invoice._id}', '${invoice.invoiceCode}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

async function viewInvoice(invoiceId) {
    try {
        const token = getToken();
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/${invoiceId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || result.message || 'Failed to load invoice');
        }

        if (result.success) {
            const invoice = result.data;
            populatePreview(invoice);
            showInvoicePreview();
        } else {
            throw new Error(result.message || 'Failed to load invoice');
        }
        
    } catch (error) {
        console.error('Error viewing invoice:', error);
        showNotification('Failed to load invoice: ' + error.message, 'error');
    }
}

async function editInvoice(invoiceId) {
    try {
        const token = getToken();
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/${invoiceId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || result.message || 'Failed to load invoice for editing');
        }

        if (result.success) {
            const invoice = result.data;
            
            // Populate form with invoice data
            document.getElementById('invoiceCode').value = invoice.invoiceCode;
            document.getElementById('invoiceDate').value = invoice.invoiceDate.split('T')[0];
            document.getElementById('clientName').value = invoice.clientName;
            document.getElementById('clientCompany').value = invoice.clientCompany;
            document.getElementById('clientAddress').value = invoice.clientAddress;
            document.getElementById('scope').value = invoice.scope;
            document.getElementById('records').value = invoice.totalRecords;
            document.getElementById('price').value = invoice.price;
            document.getElementById('status').value = invoice.status;
            
            currentInvoiceId = invoiceId;
            showInvoiceGenerator();
        } else {
            throw new Error(result.message || 'Failed to load invoice for editing');
        }
        
    } catch (error) {
        console.error('Error editing invoice:', error);
        showNotification('Failed to load invoice for editing: ' + error.message, 'error');
    }
}

function confirmDeleteInvoice(invoiceId, invoiceCode) {
    currentDeleteInvoice = {
        id: invoiceId,
        code: invoiceCode
    };
    
    document.getElementById('deleteItemName').textContent = invoiceCode;
    document.getElementById('deleteModal').style.display = 'flex';
    
    document.getElementById('confirmDeleteBtn').onclick = () => deleteInvoice(invoiceId);
}

async function deleteInvoice(invoiceId) {
    try {
        const token = getToken();
        if (!token) {
            showNotification('Please login to delete invoice', 'error');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/${invoiceId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || result.message || `HTTP error! status: ${response.status}`);
        }

        if (result.success) {
            showNotification(result.message || 'Invoice deleted successfully', 'success');
            closeDeleteModal();
            loadInvoices(); // Refresh the list
        } else {
            throw new Error(result.message || 'Failed to delete invoice');
        }
        
    } catch (error) {
        console.error('❌ Error deleting invoice:', error);
        showNotification('Failed to delete invoice: ' + error.message, 'error');
    }
}


function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    currentDeleteInvoice = null;
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
    currentDeleteInvoice = null;
}

function filterInvoices() {
    const statusFilter = document.getElementById('statusFilter').value;
    
    let filteredInvoices = allInvoices;
    
    if (statusFilter !== 'all') {
        filteredInvoices = allInvoices.filter(invoice => invoice.status === statusFilter);
    }
    
    renderInvoicesTable(filteredInvoices);
}

function printInvoice() {
    window.print();
}

function showLoading(show) {
    const loadingState = document.getElementById('loadingState');
    const invoicesSection = document.querySelector('.form-container');
    
    if (show) {
        invoicesSection.style.opacity = '0.6';
        loadingState.style.display = 'block';
        console.log('⏳ Showing loading state');
    } else {
        invoicesSection.style.opacity = '1';
        loadingState.style.display = 'none';
        console.log('✅ Hiding loading state');
    }
}

// Dashboard Functions
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

console.log('✅ Invoice Management System fully initialized');