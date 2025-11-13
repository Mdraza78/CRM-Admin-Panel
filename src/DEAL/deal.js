// deal.js - Complete Fixed Version with Navigation

// Global variables
let deals = [];
let filteredDeals = [];
let currentDealId = null;
let currentView = 'list';
let sortColumn = null;
let sortDirection = 'asc';
let currentPage = 1;
const itemsPerPage = 5;
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
    console.log('Deal.js - DOM Content Loaded');
    initializeApp();
    setupEventListeners();
    displayUserName();
    loadDeals();
});

function initializeApp() {
    console.log('Deal Management System initialized with backend integration');
    setupNavigationEventListeners(); // ✅ ADD THIS LINE
    showDealsList();
    updatePagination();
    setMinCloseDate();
}

function setupEventListeners() {
    // ✅ ADD: Navigation event listeners
    setupNavigationEventListeners();

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

    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.dropdown')) {
            closeAllDropdowns();
        }
    });

    // Form validation
    document.addEventListener('input', handleFormValidation);

    // Pipeline stage click events
    document.addEventListener('click', function(e) {
        if (e.target.closest('.pipeline-stage')) {
            const stage = e.target.closest('.pipeline-stage');
            const stageValue = stage.getAttribute('data-stage');
            document.getElementById('dealStage').value = stageValue;
            updatePipelineVisual(stageValue);
        }
    });

    // Escape key to close modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

function displayUserName() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const userNameElement = document.querySelector('.user-name');
    
    if (userData && userData.name) {
        userNameElement.textContent = userData.name;
    } else {
        userNameElement.textContent = 'User';
    }
}

function setMinCloseDate() {
    const closeDateInput = document.getElementById('closeDate');
    if (closeDateInput) {
        const today = new Date().toISOString().split('T')[0];
        closeDateInput.min = today;
    }
}

// API Functions
async function loadDeals() {
    try {
        showLoading(true);
        
        const token = localStorage.getItem('authToken');
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
        const sortBy = 'createdAt';
        const sortOrder = 'desc';

        const params = new URLSearchParams({
            page: currentPage,
            limit: itemsPerPage,
            ...(search && { search }),
            ...(stageFilter && { stage: stageFilter }),
            ...(priorityFilter && { priority: priorityFilter }),
            sortBy: sortBy,
            sortOrder: sortOrder
        });

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
            renderDealsTable();
            updatePagination();
            updateRecordCount();
        } else {
            throw new Error('Failed to load deals');
        }
    } catch (error) {
        console.error('Error loading deals:', error);
        showNotification('Failed to load deals: ' + error.message, 'error');
        
        // Fallback: Try to render with empty data
        deals = [];
        filteredDeals = [];
        renderDealsTable();
    } finally {
        showLoading(false);
    }
}

async function saveDealToAPI(dealData, isUpdate = false) {
    try {
        const token = localStorage.getItem('authToken');
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
            attachments: dealData.attachments
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
        const token = localStorage.getItem('authToken');
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
        const token = localStorage.getItem('authToken');
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

async function addActivityToDealAPI(dealId, activityData) {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await fetch(`${API_BASE_URL}/deals/${dealId}/activities`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(activityData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error adding activity:', error);
        throw error;
    }
}

// Navigation functions
function showDealsList() {
    document.getElementById('dealsList').style.display = 'block';
    document.getElementById('dealForm').style.display = 'none';
    currentView = 'list';
    renderDealsTable();
}

function AddDeals() {
    currentDealId = null;
    resetDealForm();
    document.getElementById('formTitle').textContent = 'Create New Deal';
    document.getElementById('markWonBtn').style.display = 'none';
    document.getElementById('markLostBtn').style.display = 'none';
    document.getElementById('dealsList').style.display = 'none';
    document.getElementById('dealForm').style.display = 'block';
    currentView = 'form';
    updatePipelineVisual('Prospecting');
    loadRelatedDeals();
}

function editDeal(id) {
    currentDealId = id;
    const deal = deals.find(d => d.id === id);
    if (deal) {
        populateDealForm(deal);
        document.getElementById('formTitle').textContent = 'Edit Deal';
        document.getElementById('markWonBtn').style.display = 'inline-block';
        document.getElementById('markLostBtn').style.display = 'inline-block';
        document.getElementById('dealsList').style.display = 'none';
        document.getElementById('dealForm').style.display = 'block';
        currentView = 'form';
        updatePipelineVisual(deal.stage);
        updateDealInfo(deal);
        loadRelatedDeals(deal);
        loadActivities(deal);
    }
}

function viewDeal(id) {
    editDeal(id);
}

function cancelForm() {
    showDealsList();
}

// CRUD Operations
async function saveDeal() {
    if (!validateForm()) {
        return;
    }

    const formData = collectFormData();
    
    try {
        showLoading(true);

        const savedDeal = await saveDealToAPI(formData, !!currentDealId);

        showNotification(
            `Deal ${currentDealId ? 'updated' : 'created'} successfully`, 
            'success'
        );

        closeForm();
        await loadDeals();
        
    } catch (error) {
        console.error('Error saving deal:', error);
        showNotification('Failed to save deal: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function deleteDeal(id) {
    const deal = deals.find(d => d.id === id);
    if (deal) {
        document.getElementById('deleteDealName').textContent = deal.title;
        currentDealId = id;
        document.getElementById('deleteModal').style.display = 'flex';
    }
}

async function confirmDelete() {
    if (!currentDealId) return;
    
    try {
        showLoading(true);
        await deleteDealFromAPI(currentDealId);
        
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
            closeForm();
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
            closeForm();
            await loadDeals();
            
        } catch (error) {
            console.error('Error marking deal as lost:', error);
            showNotification('Failed to update deal: ' + error.message, 'error');
        } finally {
            showLoading(false);
        }
    }
}

// Form handling
function collectFormData() {
    const attachments = Array.from(document.querySelectorAll('.file-item')).map(item => 
        item.querySelector('.file-name').textContent
    );

    return {
        title: document.getElementById('dealTitle').value.trim(),
        value: parseFloat(document.getElementById('dealValue').value) || 0,
        stage: document.getElementById('dealStage').value,
        closeDate: document.getElementById('closeDate').value,
        assignedOwner: document.getElementById('assignedOwner').value,
        priority: document.getElementById('priority').value,
        companyName: document.getElementById('companyName').value.trim(),
        primaryContact: document.getElementById('primaryContact').value.trim(),
        contactEmail: document.getElementById('contactEmail').value.trim(),
        contactPhone: document.getElementById('contactPhone').value.trim(),
        secondaryContacts: document.getElementById('secondaryContacts').value.trim(),
        winProbability: parseInt(document.getElementById('winProbability').value) || 0,
        grossMargin: parseFloat(document.getElementById('grossMargin').value) || 0,
        notes: document.getElementById('dealNotes').value.trim(),
        attachments: attachments
    };
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
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = '';
    if (deal.attachments && deal.attachments.length > 0) {
        deal.attachments.forEach(fileName => {
            addFileToList(fileName);
        });
    }
}

function resetDealForm() {
    document.getElementById('dealTitle').value = '';
    document.getElementById('dealValue').value = '';
    document.getElementById('dealStage').value = 'Prospecting';
    document.getElementById('closeDate').value = '';
    document.getElementById('assignedOwner').value = '';
    document.getElementById('priority').value = 'Medium';
    document.getElementById('companyName').value = '';
    document.getElementById('primaryContact').value = '';
    document.getElementById('contactEmail').value = '';
    document.getElementById('contactPhone').value = '';
    document.getElementById('secondaryContacts').value = '';
    document.getElementById('winProbability').value = '';
    document.getElementById('grossMargin').value = '';
    document.getElementById('dealNotes').value = '';
    document.getElementById('fileList').innerHTML = '';
    document.getElementById('dealAttachments').value = '';
    
    // Reset deal info
    document.getElementById('daysInStage').textContent = '-';
    document.getElementById('daysSinceCreated').textContent = '-';
    document.getElementById('lastActivity').textContent = '-';
    
    // Clear activities
    document.getElementById('pastTimeline').innerHTML = '<p>No past activities</p>';
    document.getElementById('upcomingTimeline').innerHTML = '<p>No upcoming activities</p>';
}

// Pipeline Visual Update
function updatePipelineVisual(currentStage) {
    const stages = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Won'];
    const pipelineStages = document.querySelectorAll('.pipeline-stage');
    
    pipelineStages.forEach(stage => {
        const stageValue = stage.getAttribute('data-stage');
        stage.classList.remove('active', 'completed');
        
        if (stageValue === currentStage) {
            stage.classList.add('active');
        } else if (stages.indexOf(stageValue) < stages.indexOf(currentStage) && currentStage !== 'Lost') {
            stage.classList.add('completed');
        }
    });
}

// Deal Info Update
function updateDealInfo(deal) {
    if (!deal) return;
    
    const now = new Date();
    const created = new Date(deal.created);
    const modified = new Date(deal.modified);
    
    const daysSinceCreated = Math.floor((now - created) / (1000 * 60 * 60 * 24));
    const daysSinceModified = Math.floor((now - modified) / (1000 * 60 * 60 * 24));
    
    document.getElementById('daysInStage').textContent = daysSinceModified + ' days';
    document.getElementById('daysSinceCreated').textContent = daysSinceCreated + ' days';
    
    const lastActivity = deal.activities && deal.activities.length > 0 
        ? deal.activities[deal.activities.length - 1] 
        : null;
    
    document.getElementById('lastActivity').textContent = lastActivity 
        ? `${lastActivity.type} (${formatDateShort(lastActivity.date)})` 
        : 'None';
}

// Activity Management
function switchActivityTab(tab) {
    currentActivityType = tab;
    
    // Update tab buttons
    document.querySelectorAll('.activity-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.activity-tab[data-tab="${tab}"]`).classList.add('active');
    
    // Update content
    document.querySelectorAll('.activity-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    document.getElementById(tab === 'past' ? 'pastActivities' : 'upcomingActivities').classList.add('active');
}

function loadActivities(deal) {
    if (!deal.activities) deal.activities = [];
    
    const pastTimeline = document.getElementById('pastTimeline');
    const upcomingTimeline = document.getElementById('upcomingTimeline');
    
    const pastActivities = deal.activities.filter(a => a.isPast);
    const upcomingActivities = deal.activities.filter(a => !a.isPast);
    
    // Load past activities
    if (pastActivities.length === 0) {
        pastTimeline.innerHTML = '<p>No past activities</p>';
    } else {
        pastTimeline.innerHTML = pastActivities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">${getActivityIcon(activity.type)}</div>
                <div class="activity-content-text">
                    <h5>${activity.type}</h5>
                    <p>${activity.description}</p>
                    <div class="activity-date">${formatDate(activity.date)}</div>
                </div>
            </div>
        `).join('');
    }
    
    // Load upcoming activities
    if (upcomingActivities.length === 0) {
        upcomingTimeline.innerHTML = '<p>No upcoming activities</p>';
    } else {
        upcomingTimeline.innerHTML = upcomingActivities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">${getActivityIcon(activity.type)}</div>
                <div class="activity-content-text">
                    <h5>${activity.type}</h5>
                    <p>${activity.description}</p>
                    <div class="activity-date">${formatDate(activity.date)}</div>
                </div>
            </div>
        `).join('');
    }
}

function getActivityIcon(type) {
    const icons = {
        'Call': '📞',
        'Email': '📧',
        'Meeting': '👥',
        'Follow-up': '📅',
        'Proposal': '📄',
        'Deal Won': '🏆',
        'Deal Lost': '❌'
    };
    return icons[type] || '📋';
}

function addActivity() {
    document.getElementById('activityModalTitle').textContent = 'Add Activity';
    document.getElementById('activityModal').style.display = 'flex';
    
    // Set default date to now
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('activityDate').value = now.toISOString().slice(0, 16);
}

function addPastActivity() {
    currentActivityType = 'past';
    addActivity();
}

function scheduleActivity() {
    currentActivityType = 'upcoming';
    addActivity();
}

async function saveActivity() {
    const type = document.getElementById('activityType').value;
    const date = document.getElementById('activityDate').value;
    const description = document.getElementById('activityDescription').value.trim();
    
    if (!type || !date || !description) {
        showNotification('Please fill in all activity fields', 'error');
        return;
    }
    
    if (currentDealId) {
        try {
            const isPast = new Date(date) < new Date();
            const activityData = {
                type: type,
                description: description,
                date: date,
                isPast: isPast
            };

            await addActivityToDealAPI(currentDealId, activityData);
            
            showNotification('Activity added successfully', 'success');
            closeActivityModal();
            await loadDeals();
            
        } catch (error) {
            console.error('Error adding activity:', error);
            showNotification('Failed to add activity: ' + error.message, 'error');
        }
    }
}

function closeActivityModal() {
    document.getElementById('activityModal').style.display = 'none';
    document.getElementById('activityType').value = 'Call';
    document.getElementById('activityDate').value = '';
    document.getElementById('activityDescription').value = '';
}

// Related Deals
function loadRelatedDeals(currentDeal) {
    const relatedDealsContainer = document.getElementById('relatedDealsList');
    
    if (!currentDeal) {
        relatedDealsContainer.innerHTML = '<p>No related deals found</p>';
        return;
    }
    
    const relatedDeals = deals.filter(d => 
        d.id !== currentDeal.id && 
        (d.companyName === currentDeal.companyName || d.primaryContact === currentDeal.primaryContact)
    );
    
    if (relatedDeals.length === 0) {
        relatedDealsContainer.innerHTML = '<p>No related deals found</p>';
    } else {
        relatedDealsContainer.innerHTML = relatedDeals.map(deal => `
            <div class="related-deal-card" onclick="viewDeal('${deal.id}')">
                <h6>${deal.title}</h6>
                <p>Value: $${deal.value.toLocaleString()}</p>
                <p>Stage: ${deal.stage}</p>
                <p>Close Date: ${formatDateShort(deal.closeDate)}</p>
            </div>
        `).join('');
    }
}

// Quick Actions
function callContact() {
    const phone = document.getElementById('contactPhone').value;
    if (phone) {
        window.open(`tel:${phone}`);
        showNotification(`Calling ${phone}`, 'info');
    } else {
        showNotification('No phone number available', 'warning');
    }
}

function emailContact() {
    const email = document.getElementById('contactEmail').value;
    const subject = encodeURIComponent(`Regarding: ${document.getElementById('dealTitle').value}`);
    
    if (email) {
        window.open(`mailto:${email}?subject=${subject}`);
        showNotification(`Emailing ${email}`, 'info');
    } else {
        showNotification('No email address available', 'warning');
    }
}

// Validation
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
    
    // Email validation
    const emailField = document.getElementById('contactEmail');
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailField.value.trim() && !emailPattern.test(emailField.value.trim())) {
        emailField.style.borderColor = '#dc3545';
        emailField.style.boxShadow = '0 0 0 4px rgba(220, 53, 69, 0.1)';
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

// File handling
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    files.forEach(file => {
        addFileToList(file.name);
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.style.borderColor = '#667eea';
    e.currentTarget.style.background = 'linear-gradient(135deg, #f0f8ff 0%, #e6f2ff 100%)';
}

function handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.style.borderColor = '#e9ecef';
    e.currentTarget.style.background = 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)';
}

function handleFileDrop(e) {
    e.preventDefault();
    e.currentTarget.style.borderColor = '#e9ecef';
    e.currentTarget.style.background = 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)';
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
        addFileToList(file.name);
    });
}

function addFileToList(fileName) {
    const fileList = document.getElementById('fileList');
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.innerHTML = `
        <span class="file-name">${fileName}</span>
        <button class="file-remove" onclick="removeFile(this)" title="Remove file">×</button>
    `;
    fileList.appendChild(fileItem);
}

function removeFile(button) {
    button.parentElement.remove();
}

// Table rendering
function renderDealsTable() {
    const tbody = document.getElementById('dealsTableBody');
    const emptyState = document.getElementById('emptyState');
    
    // Apply filters and search
    applyFilters();
    
    if (filteredDeals.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        updateRecordCount();
        updatePagination();
        return;
    }
    
    emptyState.style.display = 'none';
    
    // Pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedDeals = filteredDeals.slice(startIndex, endIndex);
    
    tbody.innerHTML = '';
    
    paginatedDeals.forEach((deal, index) => {
        const row = document.createElement('tr');
        row.onclick = () => viewDeal(deal.id);
        
        // Add alternating row colors for better readability
        if (index % 2 === 0) {
            row.style.backgroundColor = '#fafbfc';
        }
        
        row.innerHTML = `
            <td>
                <div class="deal-title-cell">
                    <strong>${deal.title}</strong>
                    ${deal.notes ? '<br><small class="text-muted">' + (deal.notes.length > 50 ? deal.notes.substring(0, 50) + '...' : deal.notes) + '</small>' : ''}
                </div>
            </td>
            <td>
                <div class="company-cell">
                    <strong>${deal.companyName}</strong>
                    ${deal.contactEmail ? '<br><small class="text-muted">' + deal.contactEmail + '</small>' : ''}
                </div>
            </td>
            <td><strong>$${deal.value.toLocaleString()}</strong></td>
            <td><span class="stage-badge ${deal.stage.toLowerCase()}">${deal.stage}</span></td>
            <td>
                <div class="date-cell">
                    <strong>${formatDateShort(deal.closeDate)}</strong>
                    ${getDaysUntilClose(deal.closeDate) ? '<br><small class="text-muted">' + getDaysUntilClose(deal.closeDate) + '</small>' : ''}
                </div>
            </td>
            <td><span class="priority-badge ${deal.priority.toLowerCase()}">${deal.priority}</span></td>
            <td>${deal.assignedOwner || '-'}</td>
            <td class="actions-cell">
                <div class="dropdown">
                    <button class="action-btn" onclick="toggleActionMenu(event, '${deal.id}')">⋯</button>
                    <div class="dropdown-menu" id="actionMenu${deal.id}">
                        <div class="dropdown-item" onclick="viewDeal('${deal.id}')">
                            <i class="fas fa-eye"></i> View
                        </div>
                        <div class="dropdown-item" onclick="editDeal('${deal.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </div>
                        <div class="dropdown-item danger" onclick="deleteDeal('${deal.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </div>
                    </div>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    updateRecordCount();
    updatePagination();
}

function getDaysUntilClose(closeDate) {
    if (!closeDate) return '';
    
    const today = new Date();
    const close = new Date(closeDate);
    const diffTime = close - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays === -1) return 'Overdue by 1 day';
    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} days`;
    if (diffDays > 0) return `${diffDays} days left`;
    
    return '';
}

// Search and filter functions
function searchDeals(query) {
    currentPage = 1;
    applyFilters();
    renderDealsTable();
}

function filterDeals() {
    currentPage = 1;
    applyFilters();
    renderDealsTable();
}

function applyFilters() {
    const searchQuery = document.querySelector('.search-input').value.toLowerCase().trim();
    const stageFilter = document.getElementById('stageFilter').value;
    const priorityFilter = document.getElementById('priorityFilter').value;
    
    filteredDeals = deals.filter(deal => {
        const matchesSearch = !searchQuery || 
            deal.title.toLowerCase().includes(searchQuery) ||
            deal.companyName.toLowerCase().includes(searchQuery) ||
            deal.primaryContact.toLowerCase().includes(searchQuery) ||
            (deal.assignedOwner && deal.assignedOwner.toLowerCase().includes(searchQuery));
        
        const matchesStage = !stageFilter || deal.stage === stageFilter;
        const matchesPriority = !priorityFilter || deal.priority === priorityFilter;
        
        return matchesSearch && matchesStage && matchesPriority;
    });
}

// Sorting
function sortTable(columnIndex) {
    const columns = ['title', 'companyName', 'value', 'stage', 'closeDate', 'priority', 'assignedOwner'];
    const column = columns[columnIndex];
    
    if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortDirection = 'asc';
    }
    
    filteredDeals.sort((a, b) => {
        let valueA, valueB;
        
        if (column === 'value') {
            valueA = a[column] || 0;
            valueB = b[column] || 0;
        } else if (column === 'closeDate') {
            valueA = new Date(a[column] || '9999-12-31');
            valueB = new Date(b[column] || '9999-12-31');
        } else {
            valueA = (a[column] || '').toLowerCase();
            valueB = (b[column] || '').toLowerCase();
        }
        
        if (sortDirection === 'asc') {
            return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
        } else {
            return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
        }
    });
    
    renderDealsTable();
    updateSortIcons(columnIndex);
}

function updateSortIcons(activeColumn) {
    const sortIcons = document.querySelectorAll('.sort-icon');
    sortIcons.forEach((icon, index) => {
        if (index === activeColumn) {
            icon.textContent = sortDirection === 'asc' ? '↑' : '↓';
        } else {
            icon.textContent = '↕';
        }
    });
}

// Enhanced Pagination
function updatePagination() {
    const totalPages = Math.ceil(filteredDeals.length / itemsPerPage);
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const prevBtnBottom = document.getElementById('prevBtnBottom');
    const nextBtnBottom = document.getElementById('nextBtnBottom');
    const firstBtn = document.getElementById('firstBtn');
    const lastBtn = document.getElementById('lastBtn');
    
    // Update top pagination buttons
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
    
    // Update bottom pagination buttons
    prevBtnBottom.disabled = currentPage <= 1;
    nextBtnBottom.disabled = currentPage >= totalPages;
    firstBtn.disabled = currentPage <= 1;
    lastBtn.disabled = currentPage >= totalPages;
    
    // Update page numbers
    updatePageNumbers(totalPages);
}

function updatePageNumbers(totalPages) {
    const pageNumbersContainer = document.getElementById('pageNumbers');
    pageNumbersContainer.innerHTML = '';
    
    // Show max 5 page numbers
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    // Adjust start page if we're near the end
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageNumber = document.createElement('button');
        pageNumber.className = `page-number ${i === currentPage ? 'active' : ''}`;
        pageNumber.textContent = i;
        pageNumber.onclick = () => goToPage(i);
        pageNumbersContainer.appendChild(pageNumber);
    }
}

function updateRecordCount() {
    const startIndex = filteredDeals.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, filteredDeals.length);
    const total = filteredDeals.length;
    
    document.getElementById('recordCount').textContent = `${startIndex}-${endIndex} / ${total}`;
    document.getElementById('recordCountBottom').textContent = `Showing ${startIndex}-${endIndex} of ${total} records`;
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        renderDealsTable();
    }
}

function nextPage() {
    const totalPages = Math.ceil(filteredDeals.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderDealsTable();
    }
}

function goToPage(page) {
    const totalPages = Math.ceil(filteredDeals.length / itemsPerPage);
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        renderDealsTable();
    }
}

function goToLastPage() {
    const totalPages = Math.ceil(filteredDeals.length / itemsPerPage);
    if (totalPages > 0) {
        currentPage = totalPages;
        renderDealsTable();
    }
}

// Action menu functions
function toggleActionMenu(event, id) {
    event.stopPropagation();
    closeAllDropdowns();
    currentDealId = id;
    const menu = document.getElementById(`actionMenu${id}`);
    if (menu) {
        menu.classList.toggle('show');
    }
}

function closeAllDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown-menu');
    dropdowns.forEach(dropdown => {
        dropdown.classList.remove('show');
    });
}

// Modal functions
function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    currentDealId = null;
}

function closeForm() {
    document.getElementById('dealForm').style.display = 'none';
    document.getElementById('dealsList').style.display = 'block';
    currentView = 'list';
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
    currentDealId = null;
}

// Export function
async function exportDeals() {
    try {
        const token = localStorage.getItem('authToken');
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

// Utility functions
function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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

function showLoading(show) {
    if (show) {
        document.body.style.cursor = 'wait';
        // You can add a loading spinner here
    } else {
        document.body.style.cursor = 'default';
    }
}

// Notification system
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
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 400);
        }
    }, 5000);
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
function toggleSidebar() {
    const appContainer = document.querySelector('.app-container');
    appContainer.classList.toggle('sidebar-collapsed');
    
    // Update the menu toggle icon
    const menuToggleIcon = document.querySelector('.menu-toggle i');
    if (appContainer.classList.contains('sidebar-collapsed')) {
        menuToggleIcon.className = 'fas fa-bars';
    } else {
        menuToggleIcon.className = 'fas fa-bars';
    }
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

console.log('Deal Management System initialized with enhanced table styling and pagination');