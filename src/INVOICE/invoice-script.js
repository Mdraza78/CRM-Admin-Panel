// invoice.js - Updated to match deal page structure and functionality

// Global variables
let invoices = [];
let filteredInvoices = [];
let currentInvoiceId = null;
let currentEditingInvoice = null;
let currentDeleteInvoice = null;
let currentView = 'table'; // Force table view only
let currentPage = 1;
let itemsPerPage = 5;
let totalInvoicesCount = 0;

// API Base URL
const API_BASE_URL = 'https://crm-admin-panel-production.up.railway.app/api/invoices';

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
    console.log('Invoice.js - DOM Content Loaded');
    initializeApp();
    setupEventListeners();
    displayUserName();
    
    // Load invoices immediately
    loadInvoices().then(() => {
        console.log('Invoices loaded successfully');
    }).catch(error => {
        console.error('Failed to load invoices:', error);
    });
    
    // Load sidebar state
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (sidebarCollapsed) {
        document.querySelector('.app-container').classList.add('sidebar-collapsed');
    }
});

function initializeApp() {
    console.log('Invoice Management System initialized with backend integration');
    setupNavigationEventListeners();
    initializeForm();
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
    
    // Set today's date
    document.getElementById('invoiceDate').valueAsDate = new Date();
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

        const search = document.querySelector('.search-input')?.value || '';
        const statusFilter = document.getElementById('statusFilter')?.value || 'all';
        const clientFilter = document.getElementById('clientFilter')?.value || '';
        const sortBy = document.getElementById('sortBy')?.value || 'created_desc';

        // Parse sort parameters
        let sortField = 'createdAt';
        let sortOrder = 'desc';
        
        if (sortBy === 'code_asc') {
            sortField = 'invoiceCode';
            sortOrder = 'asc';
        } else if (sortBy === 'code_desc') {
            sortField = 'invoiceCode';
            sortOrder = 'desc';
        } else if (sortBy === 'amount_desc') {
            sortField = 'price';
            sortOrder = 'desc';
        } else if (sortBy === 'amount_asc') {
            sortField = 'price';
            sortOrder = 'asc';
        } else if (sortBy === 'created_asc') {
            sortField = 'createdAt';
            sortOrder = 'asc';
        }

        // For client-side pagination
        const params = new URLSearchParams({
            limit: 1000,
            ...(search && { search }),
            ...(statusFilter !== 'all' && { status: statusFilter }),
            sortBy: sortField,
            sortOrder: sortOrder
        });

        console.log('🔍 Loading ALL invoices for client-side pagination');

        const response = await fetch(`${API_BASE_URL}?${params}`, {
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
            invoicesLength: result.data ? result.data.length : 0
        });

        if (result.success && result.data) {
            invoices = result.data.map(invoice => ({
                id: invoice._id,
                invoiceCode: invoice.invoiceCode,
                invoiceDate: invoice.invoiceDate,
                clientName: invoice.clientName,
                clientCompany: invoice.clientCompany,
                price: invoice.price,
                status: invoice.status,
                scope: invoice.scope,
                totalRecords: invoice.totalRecords,
                clientAddress: invoice.clientAddress,
                createdAt: invoice.createdAt
            }));

            // Apply client filter locally
            filteredInvoices = [...invoices];
            if (clientFilter) {
                filteredInvoices = filteredInvoices.filter(invoice => 
                    invoice.clientName.toLowerCase().includes(clientFilter.toLowerCase()) ||
                    invoice.clientCompany.toLowerCase().includes(clientFilter.toLowerCase())
                );
            }
            
            totalInvoicesCount = filteredInvoices.length;
            
            // Update total records display
            document.getElementById('totalRecords').textContent = totalInvoicesCount;
            
            console.log('🔄 Stored ALL invoices for client-side pagination:', {
                totalInvoicesCount: totalInvoicesCount,
                invoicesLength: invoices.length,
                filteredInvoicesLength: filteredInvoices.length
            });
            
            renderInvoicesTable();
            
            // Use client-side pagination calculations
            updatePagination({
                currentPage: currentPage,
                totalPages: Math.ceil(totalInvoicesCount / itemsPerPage),
                totalInvoices: totalInvoicesCount,
                hasPrev: currentPage > 1,
                hasNext: currentPage < Math.ceil(totalInvoicesCount / itemsPerPage)
            });
            
        } else {
            throw new Error(result.message || 'Failed to load invoices');
        }
    } catch (error) {
        console.error('Error loading invoices:', error);
        showNotification('Failed to load invoices: ' + error.message, 'error');
        
        // Fallback: Try to render with empty data
        invoices = [];
        filteredInvoices = [];
        renderInvoicesTable();
        
        // Update pagination for error state
        updatePagination({
            currentPage: 1,
            totalPages: 1,
            totalInvoices: 0,
            hasPrev: false,
            hasNext: false
        });
    } finally {
        showLoading(false);
    }
}

async function saveInvoiceToAPI(invoiceData, isUpdate = false) {
    try {
        const token = getToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const url = isUpdate 
            ? `${API_BASE_URL}/${currentInvoiceId}`
            : API_BASE_URL;
        
        const method = isUpdate ? 'PUT' : 'POST';

        console.log(`💾 Saving invoice:`, { url, method, invoiceData });

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(invoiceData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Invoice saved successfully');
            return result.data;
        } else {
            throw new Error(result.message || 'Failed to save invoice');
        }
    } catch (error) {
        console.error('❌ Error saving invoice:', error);
        throw error;
    }
}

async function deleteInvoiceFromAPI(invoiceId) {
    try {
        const token = getToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        console.log(`🗑️ Deleting invoice: ${invoiceId}`);

        const response = await fetch(`${API_BASE_URL}/${invoiceId}`, {
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
            throw new Error(result.message || 'Failed to delete invoice');
        }

        console.log('✅ Invoice deleted successfully');
        return result;
    } catch (error) {
        console.error('❌ Error deleting invoice:', error);
        throw error;
    }
}

// Invoice Management Functions
function showInvoiceGenerator() {
    currentInvoiceId = null;
    currentEditingInvoice = null;
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

function editInvoice(invoiceId) {
    const invoice = invoices.find(i => i.id === invoiceId);
    if (!invoice) return;
    
    currentInvoiceId = invoiceId;
    currentEditingInvoice = invoice;
    
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
    
    showInvoiceGenerator();
}

function populateInvoiceForm(invoice) {
    document.getElementById('invoiceCode').value = invoice.invoiceCode;
    document.getElementById('invoiceDate').value = invoice.invoiceDate.split('T')[0];
    document.getElementById('clientName').value = invoice.clientName;
    document.getElementById('clientCompany').value = invoice.clientCompany;
    document.getElementById('clientAddress').value = invoice.clientAddress;
    document.getElementById('scope').value = invoice.scope;
    document.getElementById('records').value = invoice.totalRecords;
    document.getElementById('price').value = invoice.price;
    document.getElementById('status').value = invoice.status;
}

function resetForm() {
    const form = document.getElementById('invoiceForm');
    if (form) form.reset();
    document.getElementById('invoiceDate').valueAsDate = new Date();
    initializeForm();
    document.getElementById('status').value = 'draft';
}

async function saveInvoice() {
    try {
        const formData = collectFormData();
        
        // Validation
        if (!validateForm(formData)) {
            return;
        }

        showLoading(true);

        const savedInvoice = await saveInvoiceToAPI(formData, !!currentInvoiceId);

        showNotification(
            `Invoice ${currentInvoiceId ? 'updated' : 'created'} successfully`, 
            'success'
        );

        // Show preview of the saved invoice
        populatePreview(savedInvoice);
        showInvoicePreview();
        
    } catch (error) {
        console.error('Error saving invoice:', error);
        showNotification('Failed to save invoice: ' + error.message, 'error');
    } finally {
        showLoading(false);
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
        id: 'preview',
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
    currentInvoiceId = invoice.id !== 'preview' ? invoice.id : null;
}

function createNewInvoice() {
    currentInvoiceId = null;
    resetForm();
    showInvoiceGenerator();
}

function viewInvoice(invoiceId) {
    const invoice = invoices.find(i => i.id === invoiceId);
    if (!invoice) return;
    
    populatePreview(invoice);
    showInvoicePreview();
}

function deleteInvoice(invoiceId) {
    const invoice = invoices.find(i => i.id === invoiceId);
    if (!invoice) return;
    
    currentDeleteInvoice = {
        id: invoiceId,
        code: invoice.invoiceCode
    };
    
    document.getElementById('deleteItemName').textContent = invoice.invoiceCode;
    document.getElementById('deleteModal').style.display = 'flex';
}

async function confirmDelete() {
    if (!currentDeleteInvoice) return;
    
    try {
        showLoading(true);
        await deleteInvoiceFromAPI(currentDeleteInvoice.id);
        
        showNotification('Invoice deleted successfully', 'success');
        closeDeleteModal();
        await loadInvoices();
        
    } catch (error) {
        console.error('Error deleting invoice:', error);
        showNotification('Failed to delete invoice: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Rendering Functions
function renderInvoicesTable() {
    const tbody = document.getElementById('invoicesTableBody');
    if (!tbody) {
        console.error('Invoices table body not found');
        return;
    }
    
    tbody.innerHTML = '';

    console.log('🎯 Rendering table - CLIENT-SIDE PAGINATION:', {
        totalInvoicesCount: totalInvoicesCount,
        filteredInvoicesLength: filteredInvoices.length,
        currentPage: currentPage,
        itemsPerPage: itemsPerPage,
        totalPages: Math.ceil(totalInvoicesCount / itemsPerPage)
    });

    // If no invoices, show empty state
    if (filteredInvoices.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="no-data">
                    <div class="no-invoices-message">
                        <i class="fas fa-file-invoice"></i>
                        <h3>No Invoices Found</h3>
                        <p>Get started by creating your first invoice</p>
                        <button class="btn-primary" onclick="showInvoiceGenerator()">
                            <i class="fas fa-plus"></i> Create First Invoice
                        </button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    // Calculate pagination indices for client-side pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredInvoices.length);
    
    console.log('📄 Pagination slice:', {
        startIndex: startIndex,
        endIndex: endIndex,
        calculation: `(${currentPage} - 1) * ${itemsPerPage} = ${startIndex} to min(${startIndex} + ${itemsPerPage}, ${filteredInvoices.length}) = ${endIndex}`,
        expectedRecords: endIndex - startIndex
    });

    // Get only the invoices for the current page
    const invoicesToRender = filteredInvoices.slice(startIndex, endIndex);

    console.log('🔄 Invoices to render for page', currentPage, ':', invoicesToRender.length, 'records');

    // Render the paginated invoices
    invoicesToRender.forEach((invoice, index) => {
        const actualIndex = startIndex + index;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" value="${invoice.id}" onchange="toggleInvoiceSelection()"></td>
            <td>${escapeHtml(invoice.invoiceCode)}</td>
            <td>${formatDateShort(invoice.invoiceDate)}</td>
            <td>${escapeHtml(invoice.clientName)}</td>
            <td>${escapeHtml(invoice.clientCompany)}</td>
            <td>$${invoice.price.toFixed(2)}</td>
            <td><span class="status-badge ${invoice.status}">${escapeHtml(invoice.status)}</span></td>
            <td>
                <div class="table-actions">
                    <button class="table-action-btn view" onclick="viewInvoice('${invoice.id}')" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="table-action-btn edit" onclick="editInvoice('${invoice.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="table-action-btn delete" onclick="deleteInvoice('${invoice.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });

    console.log('✅ Successfully rendered', invoicesToRender.length, 'invoices for page', currentPage);
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
function filterInvoices() {
    currentPage = 1;
    loadInvoices();
}

function resetFilters() {
    document.getElementById('statusFilter').value = 'all';
    document.getElementById('clientFilter').value = '';
    document.querySelector('.search-input').value = '';
    
    currentPage = 1;
    loadInvoices();
    
    showNotification('Filters reset', 'info');
}

function sortInvoices() {
    currentPage = 1;
    loadInvoices();
}

function performSearch(query) {
    currentPage = 1;
    loadInvoices();
}

// Bulk Operations
function selectAllInvoices(checkbox) {
    const checkboxes = document.querySelectorAll('#invoicesTableBody input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.checked = checkbox.checked;
    });
    toggleInvoiceSelection();
}

function toggleInvoiceSelection() {
    const selectedCheckboxes = document.querySelectorAll('#invoicesTableBody input[type="checkbox"]:checked');
    const bulkActions = document.getElementById('bulkActions');
    const selectedCount = document.querySelector('.selected-count');
    
    if (selectedCheckboxes.length > 0 && bulkActions && selectedCount) {
        bulkActions.style.display = 'flex';
        selectedCount.textContent = `${selectedCheckboxes.length} invoice${selectedCheckboxes.length > 1 ? 's' : ''} selected`;
    } else if (bulkActions) {
        bulkActions.style.display = 'none';
    }
}

async function bulkUpdateStatus(status) {
    const selectedCheckboxes = document.querySelectorAll('#invoicesTableBody input[type="checkbox"]:checked');
    const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.value);
    
    if (selectedIds.length === 0) {
        showNotification('Please select invoices to update', 'warning');
        return;
    }

    try {
        showLoading(true);
        
        // Update each invoice individually
        for (const invoiceId of selectedIds) {
            const invoice = invoices.find(i => i.id === invoiceId);
            if (invoice) {
                const invoiceData = {
                    ...invoice,
                    status: status
                };
                await saveInvoiceToAPI(invoiceData, true);
            }
        }
        
        showNotification(`${selectedIds.length} invoices updated to ${status}`, 'success');
        toggleInvoiceSelection();
        await loadInvoices();
        
    } catch (error) {
        console.error('Error bulk updating invoices:', error);
        showNotification('Failed to update invoices: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function bulkDeleteInvoices() {
    const selectedCheckboxes = document.querySelectorAll('#invoicesTableBody input[type="checkbox"]:checked');
    const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.value);
    
    if (selectedIds.length === 0) {
        showNotification('Please select invoices to delete', 'warning');
        return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedIds.length} invoice${selectedIds.length > 1 ? 's' : ''}?`)) {
        return;
    }

    try {
        showLoading(true);
        
        // Delete each invoice individually
        for (const invoiceId of selectedIds) {
            await deleteInvoiceFromAPI(invoiceId);
        }
        
        showNotification(`${selectedIds.length} invoices deleted successfully`, 'success');
        toggleInvoiceSelection();
        await loadInvoices();
        
    } catch (error) {
        console.error('Error bulk deleting invoices:', error);
        showNotification('Failed to delete invoices: ' + error.message, 'error');
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
    const totalPages = Math.ceil(totalInvoicesCount / itemsPerPage);
    const startIndex = ((currentPage - 1) * itemsPerPage) + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, totalInvoicesCount);
    
    console.log('📊 Pagination calculations:', {
        totalInvoicesCount: totalInvoicesCount,
        itemsPerPage: itemsPerPage,
        totalPages: totalPages,
        currentPage: currentPage,
        startIndex: startIndex,
        endIndex: endIndex
    });
    
    startElement.textContent = startIndex;
    endElement.textContent = endIndex;
    totalElement.textContent = totalInvoicesCount;
    
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
        totalPages: Math.ceil(totalInvoicesCount / itemsPerPage)
    });
    
    if (newPage < 1 || newPage > Math.ceil(totalInvoicesCount / itemsPerPage)) {
        console.warn('Cannot navigate to page:', newPage);
        return;
    }
    
    goToPage(newPage);
}

function goToPage(page) {
    if (page < 1 || page > Math.ceil(totalInvoicesCount / itemsPerPage)) {
        console.warn('Invalid page number:', page);
        return;
    }
    
    console.log('🔄 Navigating to page:', page, 'from current page:', currentPage);
    currentPage = page;
    renderInvoicesTable();
    
    // Update pagination UI
    updatePagination({
        currentPage: currentPage,
        totalPages: Math.ceil(totalInvoicesCount / itemsPerPage),
        totalInvoices: totalInvoicesCount,
        hasPrev: currentPage > 1,
        hasNext: currentPage < Math.ceil(totalInvoicesCount / itemsPerPage)
    });
}

function previousPage() {
    changePage(-1);
}

function nextPage() {
    changePage(1);
}

// Modal Management
function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    currentDeleteInvoice = null;
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        modal.style.display = 'none';
        modal.classList.remove('show');
    });
    currentInvoiceId = null;
    currentEditingInvoice = null;
    currentDeleteInvoice = null;
}

// Utility Functions
function formatDateShort(dateString) {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
    } catch (error) {
        return dateString;
    }
}

function showLoading(show) {
    const loadingState = document.querySelector('.loading-state');
    const emptyState = document.querySelector('.empty-state');
    
    if (show) {
        document.body.style.cursor = 'wait';
        if (loadingState) loadingState.style.display = 'block';
        if (emptyState) emptyState.style.display = 'none';
        console.log('⏳ Showing loading state');
    } else {
        document.body.style.cursor = 'default';
        if (loadingState) loadingState.style.display = 'none';
        console.log('✅ Hiding loading state');
    }
}

// Form Validation
function validateForm() {
    const requiredFields = [
        { id: 'clientName', name: 'Client Name' },
        { id: 'clientCompany', name: 'Client Company' },
        { id: 'clientAddress', name: 'Client Address' },
        { id: 'price', name: 'Price' }
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
    
    // Price validation
    const price = parseFloat(document.getElementById('price').value);
    if (price <= 0) {
        const element = document.getElementById('price');
        element.style.borderColor = '#dc3545';
        element.style.boxShadow = '0 0 0 4px rgba(220, 53, 69, 0.1)';
        showNotification('Price must be greater than 0', 'error');
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

function printInvoice() {
    window.print();
}

console.log('Invoice Management System initialized with new modal-based structure');