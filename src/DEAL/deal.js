// deal.js - Updated for new modal-based structure

// Global variables
let deals = [];
let filteredDeals = [];
let currentDealId = null;
let currentEditingLead = null; // Changed from currentDealId for consistency
let currentDeleteLead = null;
let currentView = 'table'; // Force table view only
let currentPage = 1;
let itemsPerPage = 5; // Changed from 6 to match demo.js
let uploadedFiles = [];
let totalDealsCount = 0;
let currentActivityType = 'past';

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
    console.log('Deal.js - DOM Content Loaded');
    initializeApp();
    setupEventListeners();
    displayUserName();
    
    // Load deals immediately
    loadDeals().then(() => {
        console.log('Deals loaded successfully');
    }).catch(error => {
        console.error('Failed to load deals:', error);
    });
    
    // Load sidebar state
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (sidebarCollapsed) {
        document.querySelector('.app-container').classList.add('sidebar-collapsed');
    }
});

function initializeApp() {
    console.log('Deal Management System initialized with backend integration');
    setupNavigationEventListeners();
    setMinCloseDate();
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
    });

    // File upload
    const fileInput = document.getElementById('dealAttachments');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }

    // Drag and drop
    const uploadArea = document.querySelector('.file-upload-area');
    if (uploadArea) {
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('drop', handleFileDrop);
        uploadArea.addEventListener('dragleave', handleDragLeave);
    }

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

function setMinCloseDate() {
    const closeDateInput = document.getElementById('closeDate');
    if (closeDateInput) {
        const today = new Date().toISOString().split('T')[0];
        closeDateInput.min = today;
    }
}

// FIXED: Remove showDealsList function since we don't have separate list/form elements
// Instead, we'll just close the modal and refresh the table
function showDealsList() {
    // Just close any open modals and refresh the table
    closeAllModals();
    loadDeals();
}

async function loadDeals() {
    try {
        showLoading(true);
        
        const token = getToken();
        if (!token) {
            showNotification('Please login to access deals', 'error');
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
            return;
        }

        const search = document.querySelector('.search-input')?.value || '';
        const stageFilter = document.getElementById('stageFilter')?.value || '';
        const priorityFilter = document.getElementById('priorityFilter')?.value || '';
        const sortBy = document.getElementById('sortBy')?.value || 'created_desc';

        // Parse sort parameters
        let sortField = 'createdAt';
        let sortOrder = 'desc';
        
        if (sortBy === 'title_asc') {
            sortField = 'title';
            sortOrder = 'asc';
        } else if (sortBy === 'title_desc') {
            sortField = 'title';
            sortOrder = 'desc';
        } else if (sortBy === 'value_desc') {
            sortField = 'value';
            sortOrder = 'desc';
        } else if (sortBy === 'value_asc') {
            sortField = 'value';
            sortOrder = 'asc';
        } else if (sortBy === 'created_asc') {
            sortField = 'createdAt';
            sortOrder = 'asc';
        }

        // For client-side pagination
        const params = new URLSearchParams({
            limit: 1000,
            ...(search && { search }),
            ...(stageFilter && { stage: stageFilter }),
            ...(priorityFilter && { priority: priorityFilter }),
            sortBy: sortField,
            sortOrder: sortOrder
        });

        console.log('🔍 Loading ALL deals for client-side pagination');

        const response = await fetch(`${API_BASE_URL}/deals?${params}`, {
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
            dealsLength: result.deals ? result.deals.length : 0
        });

        if (result.deals) {
            deals = result.deals.map(deal => ({
                id: deal._id,
                title: deal.title,
                value: deal.value,
                stage: deal.stage,
                closeDate: deal.closeDate,
                assignedOwner: deal.assignedOwner,
                priority: deal.priority,
                companyName: deal.companyName,
                primaryContact: deal.primaryContact,
                contactEmail: deal.contactEmail,
                contactPhone: deal.contactPhone,
                secondaryContacts: deal.secondaryContacts ? deal.secondaryContacts.join(', ') : '',
                winProbability: deal.winProbability,
                grossMargin: deal.grossMargin,
                notes: deal.notes,
                attachments: deal.attachments || [],
                activities: deal.activities || [],
                created: deal.createdAt,
                modified: deal.updatedAt,
                createdBy: deal.createdBy
            }));

            filteredDeals = [...deals];
            totalDealsCount = deals.length;
            
            // Update total records display
            document.getElementById('totalRecords').textContent = totalDealsCount;
            
            console.log('🔄 Stored ALL deals for client-side pagination:', {
                totalDealsCount: totalDealsCount,
                dealsLength: deals.length
            });
            
            renderDealsTable();
            
            // Use client-side pagination calculations
            updatePagination({
                currentPage: currentPage,
                totalPages: Math.ceil(totalDealsCount / itemsPerPage),
                totalDeals: totalDealsCount,
                hasPrev: currentPage > 1,
                hasNext: currentPage < Math.ceil(totalDealsCount / itemsPerPage)
            });
            
        } else {
            throw new Error(result.message || 'Failed to load deals');
        }
    } catch (error) {
        console.error('Error loading deals:', error);
        showNotification('Failed to load deals: ' + error.message, 'error');
        
        // Fallback: Try to render with empty data
        deals = [];
        filteredDeals = [];
        renderDealsTable();
        
        // Update pagination for error state
        updatePagination({
            currentPage: 1,
            totalPages: 1,
            totalDeals: 0,
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

async function saveDealToAPI(dealData, isUpdate = false) {
    try {
        const token = getToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const url = isUpdate 
            ? `${API_BASE_URL}/deals/${currentDealId}`
            : `${API_BASE_URL}/deals`;
        
        const method = isUpdate ? 'PUT' : 'POST';

        // Prepare data for API
        const apiData = {
            title: dealData.title,
            value: dealData.value,
            stage: dealData.stage,
            closeDate: dealData.closeDate,
            assignedOwner: dealData.assignedOwner,
            priority: dealData.priority,
            companyName: dealData.companyName,
            primaryContact: dealData.primaryContact,
            contactEmail: dealData.contactEmail,
            contactPhone: dealData.contactPhone,
            secondaryContacts: dealData.secondaryContacts ? dealData.secondaryContacts.split('\n').filter(s => s.trim()) : [],
            winProbability: dealData.winProbability,
            grossMargin: dealData.grossMargin,
            notes: dealData.notes,
            attachments: uploadedFiles.map(file => file.name)
        };

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(apiData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        return result;
    } catch (error) {
        console.error('Error saving deal:', error);
        throw error;
    }
}

async function deleteDealFromAPI(dealId) {
    try {
        const token = getToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await fetch(`${API_BASE_URL}/deals/${dealId}`, {
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
        
        if (!result.message) {
            throw new Error('Failed to delete deal');
        }

        return result;
    } catch (error) {
        console.error('Error deleting deal:', error);
        throw error;
    }
}

async function updateDealStageAPI(dealId, stage) {
    try {
        const token = getToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await fetch(`${API_BASE_URL}/deals/${dealId}/stage`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ stage })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error updating deal stage:', error);
        throw error;
    }
}

// Deal Management Functions
function AddDeals() {
    currentDealId = null;
    currentEditingLead = null;
    document.getElementById('formTitle').textContent = 'Create New Deal';
    
    // Clear form
    clearDealForm();
    
    const modal = document.getElementById('dealForm');
    modal.style.display = 'flex';
    modal.classList.add('show');
    
    // Hide win/lost buttons for new deals
    document.getElementById('markWonBtn').style.display = 'none';
    document.getElementById('markLostBtn').style.display = 'none';
}

function editDeal(dealId) {
    const deal = deals.find(d => d.id === dealId);
    if (!deal) return;
    
    currentDealId = dealId;
    currentEditingLead = deal;
    document.getElementById('formTitle').textContent = 'Edit Deal';
    
    // Populate form
    populateDealForm(deal);
    
    const modal = document.getElementById('dealForm');
    modal.style.display = 'flex';
    modal.classList.add('show');
    
    // Show win/lost buttons for existing deals
    document.getElementById('markWonBtn').style.display = 'inline-block';
    document.getElementById('markLostBtn').style.display = 'inline-block';
}

function populateDealForm(deal) {
    document.getElementById('dealTitle').value = deal.title || '';
    document.getElementById('dealValue').value = deal.value || '';
    document.getElementById('dealStage').value = deal.stage || 'Prospecting';
    document.getElementById('closeDate').value = deal.closeDate ? deal.closeDate.split('T')[0] : '';
    document.getElementById('assignedOwner').value = deal.assignedOwner || '';
    document.getElementById('priority').value = deal.priority || 'Medium';
    document.getElementById('companyName').value = deal.companyName || '';
    document.getElementById('primaryContact').value = deal.primaryContact || '';
    document.getElementById('contactEmail').value = deal.contactEmail || '';
    document.getElementById('contactPhone').value = deal.contactPhone || '';
    document.getElementById('secondaryContacts').value = deal.secondaryContacts || '';
    document.getElementById('winProbability').value = deal.winProbability || '';
    document.getElementById('grossMargin').value = deal.grossMargin || '';
    document.getElementById('dealNotes').value = deal.notes || '';
    
    // Populate attachments
    uploadedFiles = [];
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = '';
    if (deal.attachments && deal.attachments.length > 0) {
        deal.attachments.forEach(fileName => {
            const fileObj = {
                id: Date.now() + Math.random(),
                name: fileName,
                size: 0, // Unknown size from API
                type: 'unknown',
                file: null
            };
            uploadedFiles.push(fileObj);
            addFileToList(fileName);
        });
    }
}

function clearDealForm() {
    const form = document.getElementById('dealFormContent');
    if (form) form.reset();
    uploadedFiles = [];
    updateUploadedFilesDisplay();
}

async function saveDeal() {
    try {
        const formData = collectFormData();
        
        // Validation
        if (!formData.title || !formData.value || !formData.stage || !formData.closeDate || 
            !formData.companyName || !formData.primaryContact) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }

        showLoading(true);

        const savedDeal = await saveDealToAPI(formData, !!currentDealId);

        showNotification(
            `Deal ${currentDealId ? 'updated' : 'created'} successfully`, 
            'success'
        );

        cancelForm();
        await loadDeals();
        
    } catch (error) {
        console.error('Error saving deal:', error);
        showNotification('Failed to save deal: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

function collectFormData() {
    return {
        title: document.getElementById('dealTitle')?.value.trim() || '',
        value: parseFloat(document.getElementById('dealValue').value) || 0,
        stage: document.getElementById('dealStage')?.value || '',
        closeDate: document.getElementById('closeDate')?.value || '',
        assignedOwner: document.getElementById('assignedOwner')?.value.trim() || '',
        priority: document.getElementById('priority')?.value || 'Medium',
        companyName: document.getElementById('companyName')?.value.trim() || '',
        primaryContact: document.getElementById('primaryContact')?.value.trim() || '',
        contactEmail: document.getElementById('contactEmail')?.value.trim() || '',
        contactPhone: document.getElementById('contactPhone')?.value.trim() || '',
        secondaryContacts: document.getElementById('secondaryContacts')?.value.trim() || '',
        winProbability: parseInt(document.getElementById('winProbability').value) || 0,
        grossMargin: parseFloat(document.getElementById('grossMargin').value) || 0,
        notes: document.getElementById('dealNotes')?.value.trim() || ''
    };
}

function deleteDeal(leadId) {
    const lead = deals.find(l => l.id === leadId);
    if (!lead) return;
    
    currentDeleteLead = {
        id: leadId,
        name: lead.title
    };
    
    document.getElementById('deleteDealName').textContent = lead.title;
    document.getElementById('deleteModal').style.display = 'flex';
}

async function confirmDelete() {
    if (!currentDeleteLead) return;
    
    try {
        showLoading(true);
        await deleteDealFromAPI(currentDeleteLead.id);
        
        showNotification('Deal deleted successfully', 'success');
        closeDeleteModal();
        await loadDeals();
        
    } catch (error) {
        console.error('Error deleting deal:', error);
        showNotification('Failed to delete deal: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function markAsWon() {
    if (currentDealId) {
        try {
            showLoading(true);
            await updateDealStageAPI(currentDealId, 'Won');
            
            showNotification('Deal marked as Won!', 'success');
            cancelForm();
            await loadDeals();
            
        } catch (error) {
            console.error('Error marking deal as won:', error);
            showNotification('Failed to update deal: ' + error.message, 'error');
        } finally {
            showLoading(false);
        }
    }
}

async function markAsLost() {
    if (currentDealId) {
        try {
            showLoading(true);
            await updateDealStageAPI(currentDealId, 'Lost');
            
            showNotification('Deal marked as Lost', 'info');
            cancelForm();
            await loadDeals();
            
        } catch (error) {
            console.error('Error marking deal as lost:', error);
            showNotification('Failed to update deal: ' + error.message, 'error');
        } finally {
            showLoading(false);
        }
    }
}

// File Upload
function selectEmailFile() {
    document.getElementById('dealAttachments').click();
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
    const container = document.getElementById('fileList');
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

function handleDragOver(e) {
    e.preventDefault();
    const uploadArea = e.currentTarget;
    uploadArea.style.borderColor = '#667eea';
    uploadArea.style.background = 'linear-gradient(135deg, #f0f8ff 0%, #e6f2ff 100%)';
}

function handleDragLeave(e) {
    e.preventDefault();
    const uploadArea = e.currentTarget;
    uploadArea.style.borderColor = '#e9ecef';
    uploadArea.style.background = 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)';
}

function handleFileDrop(e) {
    e.preventDefault();
    const uploadArea = e.currentTarget;
    uploadArea.style.borderColor = '#e9ecef';
    uploadArea.style.background = 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)';
    
    const files = Array.from(e.dataTransfer.files);
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
}

function addFileToList(fileName) {
    const fileList = document.getElementById('fileList');
    const fileDiv = document.createElement('div');
    fileDiv.className = 'uploaded-file';
    fileDiv.innerHTML = `
        <div class="file-info">
            <i class="fas fa-file"></i>
            <span>${fileName}</span>
        </div>
        <button class="remove-file" onclick="removeFileByName('${fileName}')">×</button>
    `;
    fileList.appendChild(fileDiv);
}

function removeFileByName(fileName) {
    uploadedFiles = uploadedFiles.filter(file => file.name !== fileName);
    updateUploadedFilesDisplay();
}

// Rendering Functions
function renderDealsTable() {
    const tbody = document.getElementById('dealsTableBody');
    if (!tbody) {
        console.error('Deals table body not found');
        return;
    }
    
    tbody.innerHTML = '';

    console.log('🎯 Rendering table - CLIENT-SIDE PAGINATION:', {
        totalDealsCount: totalDealsCount,
        dealsLength: deals.length,
        currentPage: currentPage,
        itemsPerPage: itemsPerPage,
        totalPages: Math.ceil(totalDealsCount / itemsPerPage)
    });

    // If no deals, show empty state
    if (deals.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="no-data">
                    <div class="no-leads-message">
                        <i class="fas fa-handshake"></i>
                        <h3>No Deals Found</h3>
                        <p>Get started by creating your first deal</p>
                        <button class="btn-primary" onclick="AddDeals()">
                            <i class="fas fa-plus"></i> Add New Deal
                        </button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    // Calculate pagination indices for client-side pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, deals.length);
    
    console.log('📄 Pagination slice:', {
        startIndex: startIndex,
        endIndex: endIndex,
        calculation: `(${currentPage} - 1) * ${itemsPerPage} = ${startIndex} to min(${startIndex} + ${itemsPerPage}, ${deals.length}) = ${endIndex}`,
        expectedRecords: endIndex - startIndex
    });

    // Get only the deals for the current page
    const dealsToRender = deals.slice(startIndex, endIndex);

    console.log('🔄 Deals to render for page', currentPage, ':', dealsToRender.length, 'records');

    // Render the paginated deals
    dealsToRender.forEach((deal, index) => {
        const actualIndex = startIndex + index;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" value="${deal.id}" onchange="toggleDealSelection()"></td>
            <td>${escapeHtml(deal.title)}</td>
            <td>${escapeHtml(deal.companyName)}</td>
            <td>$${deal.value.toLocaleString()}</td>
            <td><span class="stage-badge ${deal.stage.toLowerCase()}">${escapeHtml(deal.stage)}</span></td>
            <td>${formatDateShort(deal.closeDate)}</td>
            <td><span class="priority-badge ${deal.priority.toLowerCase()}">${escapeHtml(deal.priority)}</span></td>
            <td>${escapeHtml(deal.assignedOwner || '-')}</td>
            <td>
                <div class="table-actions">
                    <button class="table-action-btn edit" onclick="editDeal('${deal.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="table-action-btn delete" onclick="deleteDeal('${deal.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });

    console.log('✅ Successfully rendered', dealsToRender.length, 'deals for page', currentPage);
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
function filterDeals() {
    currentPage = 1;
    loadDeals();
}

function resetFilters() {
    document.getElementById('stageFilter').value = '';
    document.getElementById('priorityFilter').value = '';
    document.querySelector('.search-input').value = '';
    
    currentPage = 1;
    loadDeals();
    
    showNotification('Filters reset', 'info');
}

function sortDeals() {
    currentPage = 1;
    loadDeals();
}

function searchDeals(query) {
    currentPage = 1;
    loadDeals();
}

// Bulk Operations
function selectAllDeals(checkbox) {
    const checkboxes = document.querySelectorAll('#dealsTableBody input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.checked = checkbox.checked;
    });
    toggleDealSelection();
}

function toggleDealSelection() {
    const selectedCheckboxes = document.querySelectorAll('#dealsTableBody input[type="checkbox"]:checked');
    const bulkActions = document.getElementById('bulkActions');
    const selectedCount = document.querySelector('.selected-count');
    
    if (selectedCheckboxes.length > 0 && bulkActions && selectedCount) {
        bulkActions.style.display = 'flex';
        selectedCount.textContent = `${selectedCheckboxes.length} deal${selectedCheckboxes.length > 1 ? 's' : ''} selected`;
    } else if (bulkActions) {
        bulkActions.style.display = 'none';
    }
}

async function bulkUpdateStage(stage) {
    const selectedCheckboxes = document.querySelectorAll('#dealsTableBody input[type="checkbox"]:checked');
    const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.value);
    
    if (selectedIds.length === 0) {
        showNotification('Please select deals to update', 'warning');
        return;
    }

    try {
        showLoading(true);
        
        // Update each deal individually
        for (const dealId of selectedIds) {
            await updateDealStageAPI(dealId, stage);
        }
        
        showNotification(`${selectedIds.length} deals updated to ${stage}`, 'success');
        toggleDealSelection();
        await loadDeals();
        
    } catch (error) {
        console.error('Error bulk updating deals:', error);
        showNotification('Failed to update deals: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function bulkDeleteDeals() {
    const selectedCheckboxes = document.querySelectorAll('#dealsTableBody input[type="checkbox"]:checked');
    const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.value);
    
    if (selectedIds.length === 0) {
        showNotification('Please select deals to delete', 'warning');
        return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedIds.length} deal${selectedIds.length > 1 ? 's' : ''}?`)) {
        return;
    }

    try {
        showLoading(true);
        
        // Delete each deal individually
        for (const dealId of selectedIds) {
            await deleteDealFromAPI(dealId);
        }
        
        showNotification(`${selectedIds.length} deals deleted successfully`, 'success');
        toggleDealSelection();
        await loadDeals();
        
    } catch (error) {
        console.error('Error bulk deleting deals:', error);
        showNotification('Failed to delete deals: ' + error.message, 'error');
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
    const totalPages = Math.ceil(totalDealsCount / itemsPerPage);
    const startIndex = ((currentPage - 1) * itemsPerPage) + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, totalDealsCount);
    
    console.log('📊 Pagination calculations:', {
        totalDealsCount: totalDealsCount,
        itemsPerPage: itemsPerPage,
        totalPages: totalPages,
        currentPage: currentPage,
        startIndex: startIndex,
        endIndex: endIndex
    });
    
    startElement.textContent = startIndex;
    endElement.textContent = endIndex;
    totalElement.textContent = totalDealsCount;
    
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
        totalPages: Math.ceil(totalDealsCount / itemsPerPage)
    });
    
    if (newPage < 1 || newPage > Math.ceil(totalDealsCount / itemsPerPage)) {
        console.warn('Cannot navigate to page:', newPage);
        return;
    }
    
    goToPage(newPage);
}

function goToPage(page) {
    if (page < 1 || page > Math.ceil(totalDealsCount / itemsPerPage)) {
        console.warn('Invalid page number:', page);
        return;
    }
    
    console.log('🔄 Navigating to page:', page, 'from current page:', currentPage);
    currentPage = page;
    renderDealsTable();
    
    // Update pagination UI
    updatePagination({
        currentPage: currentPage,
        totalPages: Math.ceil(totalDealsCount / itemsPerPage),
        totalDeals: totalDealsCount,
        hasPrev: currentPage > 1,
        hasNext: currentPage < Math.ceil(totalDealsCount / itemsPerPage)
    });
}

function previousPage() {
    changePage(-1);
}

function nextPage() {
    changePage(1);
}

// Modal Management
function cancelForm() {
    closeLeadModal();
    loadDeals();
}

function closeLeadModal() {
    document.getElementById('dealForm').style.display = 'none';
    currentDealId = null;
    currentEditingLead = null;
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    currentDeleteLead = null;
}

function closeActivityModal() {
    document.getElementById('activityModal').style.display = 'none';
    document.getElementById('activityType').value = 'Call';
    document.getElementById('activityDate').value = '';
    document.getElementById('activityDescription').value = '';
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        modal.style.display = 'none';
        modal.classList.remove('show');
    });
    currentDealId = null;
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

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
        { id: 'dealTitle', name: 'Deal Title' },
        { id: 'dealValue', name: 'Deal Value' },
        { id: 'dealStage', name: 'Deal Stage' },
        { id: 'closeDate', name: 'Close Date' },
        { id: 'companyName', name: 'Company Name' },
        { id: 'primaryContact', name: 'Primary Contact' }
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
    
    // Deal value validation
    const dealValue = parseFloat(document.getElementById('dealValue').value);
    if (dealValue <= 0) {
        const element = document.getElementById('dealValue');
        element.style.borderColor = '#dc3545';
        element.style.boxShadow = '0 0 0 4px rgba(220, 53, 69, 0.1)';
        showNotification('Deal value must be greater than 0', 'error');
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
async function exportDeals() {
    try {
        const token = getToken();
        if (!token) {
            showNotification('Please login to export deals', 'error');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/deals/export/csv`, {
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
        a.download = 'deals_export.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showNotification('Deals exported successfully', 'success');
    } catch (error) {
        console.error('Error exporting deals:', error);
        showNotification('Failed to export deals: ' + error.message, 'error');
    }
}

console.log('Deal Management System initialized with new modal-based structure');