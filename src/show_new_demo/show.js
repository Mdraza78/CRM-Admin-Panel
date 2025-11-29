// show.js - Updated with new layout structure

let showLeads = [];
let filteredShowLeads = [];
let currentEditingShowLead = null;
let currentDeleteShowLead = null;
let currentView = 'table'; // Force table view only
let currentPage = 1;
let itemsPerPage = 6; // Change from 15 to 5
let uploadedFiles = [];
let totalLeadsCount = 0;

// API Base URL
const API_BASE_URL = 'https://crm-admin-panel-production.up.railway.app/api';

document.addEventListener('DOMContentLoaded', function() {
    console.log('🎪 Show Leads System initializing...');
    
    // Check authentication first
    if (!checkAuthentication()) {
        console.log('Authentication failed, redirecting to login');
        return;
    }
    
    console.log('Authentication successful, initializing show leads');
    
    // Load sidebar state and set correct icon
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    const appContainer = document.querySelector('.app-container');
    const toggleIcon = document.getElementById('sidebarToggleIcon');
    
    if (sidebarCollapsed) {
        appContainer.classList.add('sidebar-collapsed');
        if (toggleIcon) {
            toggleIcon.classList.remove('fa-chevron-left');
            toggleIcon.classList.add('fa-chevron-right');
            console.log('🔄 Initial state: Sidebar collapsed - showing right chevron');
        }
    } else {
        appContainer.classList.remove('sidebar-collapsed');
        if (toggleIcon) {
            toggleIcon.classList.remove('fa-chevron-right');
            toggleIcon.classList.add('fa-chevron-left');
            console.log('🔄 Initial state: Sidebar expanded - showing left chevron');
        }
    }
    
    // Initialize the rest of your functionality
    initializeShowLeads();
    setupEventListeners();
    displayUserName();
    initializePagination();
    loadShowLeads();
    
    console.log('✅ Show Leads System initialized successfully');
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
        
        showNotification('Please login to access show leads', 'error');
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

function initializeShowLeads() {
    console.log('🎪 Show Leads System initialized with backend integration');
    // Force table view
    itemsPerPage = 6; // Ensure this is set to 5
    switchView('table');
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
        // Set leads as active menu (since we're on show leads page)
        this.setActiveMenu('leads');
        
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
            'leads': 'Show Leads',
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

function getAvatarColor() {
    return 'linear-gradient(135deg, #00BCD4 0%, #1E88E5 100%)';
}

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

// Navigation function
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
        'leads': 'Show Leads',
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

// API Functions
function getToken() {
    return localStorage.getItem('authToken') || '';
}

// API Functions
// Update the loadShowLeads function to handle ALL data and paginate client-side
async function loadShowLeads() {
    try {
        showLoading(true);
        
        const token = getToken();
        if (!token) {
            showNotification('Please login to access show leads', 'error');
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
            return;
        }

        const search = document.querySelector('.search-input')?.value || '';
        const sourceFilter = document.getElementById('sourceFilter')?.value || '';
        const showFilter = document.getElementById('showFilter')?.value || '';
        const countryFilter = document.getElementById('countryFilter')?.value || '';
        const dateFilter = document.getElementById('dateFilter')?.value || '';
        const sortBy = document.getElementById('sortBy')?.value || 'created_desc';

        // Parse sort parameters
        let sortField = 'createdDate';
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
        } else if (sortBy === 'show_date_desc') {
            sortField = 'showDate';
            sortOrder = 'desc';
        } else if (sortBy === 'show_date_asc') {
            sortField = 'showDate';
            sortOrder = 'asc';
        }

        // For client-side pagination, we need to get ALL data first
        // So we don't send page/limit to server, or we send large limit to get all data
        const params = new URLSearchParams({
            limit: 1000, // Get a large number to ensure we get all records
            ...(search && { search }),
            ...(sourceFilter && { source: sourceFilter }),
            ...(showFilter && { showName: showFilter }),
            ...(countryFilter && { companyCountry: countryFilter }),
            ...(dateFilter && { dateFilter }),
            sortBy: sortField,
            sortOrder: sortOrder
        });

        console.log('🔍 Loading ALL show leads for client-side pagination');

        const response = await fetch(`${API_BASE_URL}/show-leads?${params}`, {
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
            showLeads = result.data.map(lead => ({
                id: lead._id,
                contactName: lead.contactName,
                clientEmail: lead.clientEmail,
                jobTitle: lead.jobTitle,
                clientPhone: lead.clientPhone,
                showName: lead.showName,
                showWebsite: lead.showWebsite,
                showDate: lead.showDate,
                attendeeCount: lead.attendeeCount,
                companyName: lead.companyName,
                companyWebsite: lead.companyWebsite,
                companyCountry: lead.companyCountry,
                companyPhone: lead.companyPhone,
                leadSource: lead.leadSource,
                leadPriority: lead.leadPriority,
                emailMessage: lead.emailMessage,
                keyPoints: lead.keyPoints,
                followUpDate: lead.followUpDate,
                tags: lead.tags ? lead.tags.join(', ') : '',
                createdDate: lead.createdDate,
                emailAttachments: lead.emailAttachments || []
            }));

            filteredShowLeads = [...showLeads];
            totalLeadsCount = result.pagination ? result.pagination.totalLeads : result.data.length;
            
            // Update total records display
            document.getElementById('totalRecords').textContent = totalLeadsCount;
            
            console.log('🔄 Stored ALL leads for client-side pagination:', {
                totalLeadsCount: totalLeadsCount,
                showLeadsLength: showLeads.length
            });
            
            populateShowFilter();
            renderShowLeads();
            
            // Use client-side pagination calculations
            updatePagination({
                currentPage: currentPage,
                totalPages: Math.ceil(totalLeadsCount / itemsPerPage),
                totalLeads: totalLeadsCount,
                hasPrev: currentPage > 1,
                hasNext: currentPage < Math.ceil(totalLeadsCount / itemsPerPage)
            });
            
        } else {
            throw new Error(result.message || 'Failed to load show leads');
        }
    } catch (error) {
        console.error('Error loading show leads:', error);
        showNotification('Failed to load show leads: ' + error.message, 'error');
        
        // Fallback: Try to render with empty data
        showLeads = [];
        filteredShowLeads = [];
        renderShowLeads();
        
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

async function saveShowLeadToAPI(leadData, isUpdate = false) {
    try {
        const token = getToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const url = isUpdate 
            ? `${API_BASE_URL}/show-leads/${currentEditingShowLead.id}`
            : `${API_BASE_URL}/show-leads`;
        
        const method = isUpdate ? 'PUT' : 'POST';

        // Prepare data for API
        const apiData = {
            contactName: leadData.contactName,
            clientEmail: leadData.clientEmail,
            jobTitle: leadData.jobTitle,
            clientPhone: leadData.clientPhone,
            showName: leadData.showName,
            showWebsite: leadData.showWebsite,
            showDate: leadData.showDate,
            attendeeCount: leadData.attendeeCount,
            companyName: leadData.companyName,
            companyWebsite: leadData.companyWebsite,
            companyCountry: leadData.companyCountry,
            companyPhone: leadData.companyPhone,
            leadSource: leadData.leadSource,
            leadPriority: leadData.leadPriority,
            emailMessage: leadData.emailMessage,
            keyPoints: leadData.keyPoints,
            followUpDate: leadData.followUpDate,
            tags: leadData.tags,
            emailAttachments: uploadedFiles.map(file => file.name)
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
        
        if (result.success) {
            return result.data;
        } else {
            throw new Error(result.message || 'Failed to save show lead');
        }
    } catch (error) {
        console.error('Error saving show lead:', error);
        throw error;
    }
}

async function deleteShowLeadFromAPI(leadId) {
    try {
        const token = getToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await fetch(`${API_BASE_URL}/show-leads/${leadId}`, {
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
            throw new Error(result.message || 'Failed to delete show lead');
        }

        return result;
    } catch (error) {
        console.error('Error deleting show lead:', error);
        throw error;
    }
}

async function bulkDeleteShowLeadsAPI(leadIds) {
    try {
        const token = getToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await fetch(`${API_BASE_URL}/show-leads/bulk/delete`, {
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
        console.error('Error bulk deleting show leads:', error);
        throw error;
    }
}

// Show Lead Management Functions
function addNewShowLead() {
    currentEditingShowLead = null;
    document.getElementById('showLeadModalTitle').textContent = 'Add New Show Lead';
    
    // Clear form
    clearShowLeadForm();
    
    const modal = document.getElementById('showLeadModal');
    modal.style.display = 'flex';
    modal.classList.add('show');
}

function editShowLead(leadId) {
    const lead = showLeads.find(l => l.id === leadId);
    if (!lead) return;
    
    currentEditingShowLead = lead;
    document.getElementById('showLeadModalTitle').textContent = 'Edit Show Lead';
    
    // Populate form
    populateShowLeadForm(lead);
    
    const modal = document.getElementById('showLeadModal');
    modal.style.display = 'flex';
    modal.classList.add('show');
}

function populateShowLeadForm(lead) {
    document.getElementById('contactName').value = lead.contactName || '';
    document.getElementById('clientEmail').value = lead.clientEmail || '';
    document.getElementById('jobTitle').value = lead.jobTitle || '';
    document.getElementById('clientPhone').value = lead.clientPhone || '';
    document.getElementById('showName').value = lead.showName || '';
    document.getElementById('showWebsite').value = lead.showWebsite || '';
    document.getElementById('showDate').value = lead.showDate ? lead.showDate.split('T')[0] : '';
    document.getElementById('attendeeCount').value = lead.attendeeCount || '';
    document.getElementById('companyName').value = lead.companyName || '';
    document.getElementById('companyWebsite').value = lead.companyWebsite || '';
    document.getElementById('companyCountry').value = lead.companyCountry || '';
    document.getElementById('companyPhone').value = lead.companyPhone || '';
    document.getElementById('leadSource').value = lead.leadSource || '';
    document.getElementById('leadPriority').value = lead.leadPriority || 'medium';
    document.getElementById('emailMessage').value = lead.emailMessage || '';
    document.getElementById('keyPoints').value = lead.keyPoints || '';
    document.getElementById('followUpDate').value = lead.followUpDate ? lead.followUpDate.split('T')[0] : '';
    document.getElementById('tags').value = lead.tags || '';
    
    // Handle attachments if any
    uploadedFiles = lead.emailAttachments ? lead.emailAttachments.map((file, index) => ({
        id: index,
        name: file,
        size: 0,
        type: 'file'
    })) : [];
    updateUploadedFilesDisplay();
}

function clearShowLeadForm() {
    const form = document.getElementById('showLeadForm');
    form.reset();
    uploadedFiles = [];
    updateUploadedFilesDisplay();
}

async function saveShowLead() {
    try {
        const formData = getShowLeadFormData();
        
        // Validation
        if (!formData.contactName || !formData.clientEmail || !formData.showName || !formData.companyName || !formData.companyCountry || !formData.leadSource || !formData.showDate) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        if (!isValidEmail(formData.clientEmail)) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }

        showLoading(true);

        const savedLead = await saveShowLeadToAPI(formData, !!currentEditingShowLead);

        showNotification(
            `Show lead ${currentEditingShowLead ? 'updated' : 'added'} successfully`, 
            'success'
        );

        closeShowLeadModal();
        await loadShowLeads(); // Reload leads from server
        
    } catch (error) {
        console.error('Error saving show lead:', error);
        showNotification('Failed to save show lead: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

function getShowLeadFormData() {
    return {
        contactName: document.getElementById('contactName').value.trim(),
        clientEmail: document.getElementById('clientEmail').value.trim(),
        jobTitle: document.getElementById('jobTitle').value.trim(),
        clientPhone: document.getElementById('clientPhone').value.trim(),
        showName: document.getElementById('showName').value.trim(),
        showWebsite: document.getElementById('showWebsite').value.trim(),
        showDate: document.getElementById('showDate').value,
        attendeeCount: parseInt(document.getElementById('attendeeCount').value) || 0,
        companyName: document.getElementById('companyName').value.trim(),
        companyWebsite: document.getElementById('companyWebsite').value.trim(),
        companyCountry: document.getElementById('companyCountry').value,
        companyPhone: document.getElementById('companyPhone').value.trim(),
        leadSource: document.getElementById('leadSource').value,
        leadPriority: document.getElementById('leadPriority').value,
        emailMessage: document.getElementById('emailMessage').value.trim(),
        keyPoints: document.getElementById('keyPoints').value.trim(),
        followUpDate: document.getElementById('followUpDate').value,
        tags: document.getElementById('tags').value.trim()
    };
}

function deleteShowLead(leadId) {
    const lead = showLeads.find(l => l.id === leadId);
    if (!lead) return;
    
    currentDeleteShowLead = {
        id: leadId,
        name: lead.contactName
    };
    
    document.getElementById('deleteItemName').textContent = `${lead.contactName} (${lead.showName})`;
    document.getElementById('deleteModal').style.display = 'flex';
}

async function confirmDelete() {
    if (!currentDeleteShowLead) return;
    
    try {
        showLoading(true);
        await deleteShowLeadFromAPI(currentDeleteShowLead.id);
        
        showNotification('Show lead deleted successfully', 'success');
        closeDeleteModal();
        await loadShowLeads(); // Reload leads from server
        
    } catch (error) {
        console.error('Error deleting show lead:', error);
        showNotification('Failed to delete show lead: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function viewShowLeadDetails(leadId) {
    try {
        const token = getToken();
        if (!token) {
            showNotification('Please login to view lead details', 'error');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/show-leads/${leadId}`, {
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
            renderShowLeadDetails(lead);
            document.getElementById('showLeadDetailsModal').style.display = 'flex';
        } else {
            throw new Error(result.message || 'Failed to load lead details');
        }
    } catch (error) {
        console.error('Error loading show lead details:', error);
        showNotification('Failed to load lead details: ' + error.message, 'error');
    }
}

function renderShowLeadDetails(lead) {
    const content = document.getElementById('showLeadDetailsContent');
    const tags = lead.tags || [];
    
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
                <span class="detail-value">${lead.companyCountry}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Company Phone:</span>
                <span class="detail-value">${lead.companyPhone || 'N/A'}</span>
            </div>
        </div>
        
        <div class="details-section">
            <h4><i class="fas fa-calendar-alt"></i> Show Information</h4>
            <div class="detail-row">
                <span class="detail-label">Show Name:</span>
                <span class="detail-value">${lead.showName}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Show Date:</span>
                <span class="detail-value">${formatDate(lead.showDate)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Show Website:</span>
                <span class="detail-value">${lead.showWebsite || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Attendees:</span>
                <span class="detail-value">${lead.attendeeCount ? lead.attendeeCount.toLocaleString() : 'N/A'}</span>
            </div>
        </div>
        
        <div class="details-section">
            <h4><i class="fas fa-info-circle"></i> Lead Details</h4>
            <div class="detail-row">
                <span class="detail-label">Source:</span>
                <span class="detail-value">${lead.leadSource}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Priority:</span>
                <span class="detail-value">${lead.leadPriority}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Follow-up Date:</span>
                <span class="detail-value">${lead.followUpDate ? formatDate(lead.followUpDate) : 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Created:</span>
                <span class="detail-value">${formatDate(lead.createdDate)}</span>
            </div>
        </div>
        
        ${lead.emailMessage ? `
        <div class="communication-section">
            <h4><i class="fas fa-envelope"></i> Email Communication</h4>
            <div class="message-content">${lead.emailMessage}</div>
        </div>
        ` : ''}
        
        ${lead.keyPoints ? `
        <div class="communication-section">
            <h4><i class="fas fa-key"></i> Key Points</h4>
            <div class="message-content">${lead.keyPoints}</div>
        </div>
        ` : ''}
        
        ${tags.length > 0 ? `
        <div class="communication-section">
            <h4><i class="fas fa-tags"></i> Tags</h4>
            <div class="tags-list">
                ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        </div>
        ` : ''}
        
        ${lead.emailAttachments && lead.emailAttachments.length > 0 ? `
        <div class="communication-section">
            <h4><i class="fas fa-paperclip"></i> Attachments</h4>
            <div class="attachments-list">
                ${lead.emailAttachments.map(file => `
                    <div class="attachment-item">
                        <i class="fas fa-file"></i>
                        <span>${file}</span>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
    `;
}

// Rendering Functions
function renderShowLeads() {
    console.log('Rendering show leads. Current view:', currentView);
    
    // Only render table view
    renderShowLeadsTable();
}
function renderShowLeadsTable() {
    const tbody = document.getElementById('showLeadsTableBody');
    tbody.innerHTML = '';

    console.log('🎯 Rendering table - CLIENT-SIDE PAGINATION:', {
        totalLeadsCount: totalLeadsCount,
        showLeadsLength: showLeads.length,
        currentPage: currentPage,
        itemsPerPage: itemsPerPage,
        totalPages: Math.ceil(totalLeadsCount / itemsPerPage)
    });

    // If no leads, show empty state
    if (showLeads.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="no-data">
                    <div class="no-leads-message">
                        <i class="fas fa-calendar-alt"></i>
                        <h3>No Show Leads Found</h3>
                        <p>Get started by adding your first show lead</p>
                        <button class="btn-primary" onclick="addNewShowLead()">
                            <i class="fas fa-plus"></i> Add New Show Lead
                        </button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    // Calculate pagination indices for client-side pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, showLeads.length);
    
    console.log('📄 Pagination slice:', {
        startIndex: startIndex,
        endIndex: endIndex,
        calculation: `(${currentPage} - 1) * ${itemsPerPage} = ${startIndex} to min(${startIndex} + ${itemsPerPage}, ${showLeads.length}) = ${endIndex}`,
        expectedRecords: endIndex - startIndex
    });

    // Get only the leads for the current page
    const leadsToRender = showLeads.slice(startIndex, endIndex);

    console.log('🔄 Leads to render for page', currentPage, ':', leadsToRender.length, 'records');
    console.log('📋 Sample of leads:', leadsToRender.slice(0, 2)); // Show first 2 for verification

    // Render the paginated leads
    leadsToRender.forEach((lead, index) => {
        const actualIndex = startIndex + index;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" value="${lead.id}" onchange="toggleShowLeadSelection(this)"></td>
            <td>${escapeHtml(lead.contactName)}</td>
            <td>${escapeHtml(lead.clientEmail)}</td>
            <td>${escapeHtml(lead.jobTitle || 'NA')}</td>
            <td>${escapeHtml(lead.companyName)}</td>
            <td>${escapeHtml(lead.showName)}</td>
            <td>${formatDate(lead.showDate)}</td>
            <td><span class="lead-source-badge ${lead.leadSource}">${escapeHtml(lead.leadSource)}</span></td>
            <td>${formatDate(lead.createdDate)}</td>
            <td>
                <div class="table-actions">
                    <button class="table-action-btn view" onclick="viewShowLeadDetails('${lead.id}')" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="table-action-btn edit" onclick="editShowLead('${lead.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="table-action-btn delete" onclick="deleteShowLead('${lead.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });

    console.log('✅ Successfully rendered', leadsToRender.length, 'leads for page', currentPage);
    console.log('--- PAGE', currentPage, 'COMPLETE ---');
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



function populateShowFilter() {
    const showFilter = document.getElementById('showFilter');
    const uniqueShows = [...new Set(showLeads.map(lead => lead.showName))];
    
    // Clear existing options except "All Shows"
    showFilter.innerHTML = '<option value="">All Shows</option>';
    
    uniqueShows.forEach(show => {
        const option = document.createElement('option');
        option.value = show;
        option.textContent = show;
        showFilter.appendChild(option);
    });
}

// Helper function to check if pagination elements exist
function checkPaginationElements() {
    const requiredElements = [
        'paginationStart',
        'paginationEnd', 
        'paginationTotal',
        'prevBtn',
        'nextBtn',
        'paginationNumbers'
    ];
    
    const missingElements = [];
    
    requiredElements.forEach(id => {
        const element = document.getElementById(id);
        if (!element) {
            missingElements.push(id);
        }
    });
    
    if (missingElements.length > 0) {
        console.warn('Missing pagination elements:', missingElements);
        return false;
    }
    
    return true;
}

// Call this during initialization
function initializePagination() {
    if (!checkPaginationElements()) {
        console.log('Pagination elements not found, they might be added dynamically');
    }
}

function switchView(view) {
    // Only allow table view
    currentView = 'table';
    itemsPerPage = 6; // Ensure this is set to 6
    currentPage = 1;
    console.log('Forced table view. ItemsPerPage:', itemsPerPage);
    renderShowLeads();
}

// Filtering and Sorting
function filterShowLeads() {
    currentPage = 1;
    loadShowLeads();
}

function resetFilters() {
    document.getElementById('sourceFilter').value = '';
    document.getElementById('showFilter').value = '';
    document.getElementById('countryFilter').value = '';
    document.getElementById('dateFilter').value = '';
    document.querySelector('.search-input').value = '';
    
    currentPage = 1;
    loadShowLeads();
    
    showNotification('Filters reset', 'info');
}

function sortShowLeads() {
    currentPage = 1;
    loadShowLeads();
}

function performSearch(query) {
    currentPage = 1;
    loadShowLeads();
}

// Bulk Operations
function selectAllShowLeads(checkbox) {
    const checkboxes = document.querySelectorAll('#showLeadsTableBody input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.checked = checkbox.checked;
    });
    toggleShowLeadSelection();
}

function toggleShowLeadSelection() {
    const selectedCheckboxes = document.querySelectorAll('#showLeadsTableBody input[type="checkbox"]:checked');
    const bulkActions = document.getElementById('bulkActions');
    const selectedCount = document.querySelector('.selected-count');
    
    if (selectedCheckboxes.length > 0) {
        bulkActions.style.display = 'flex';
        selectedCount.textContent = `${selectedCheckboxes.length} lead${selectedCheckboxes.length > 1 ? 's' : ''} selected`;
    } else {
        bulkActions.style.display = 'none';
    }
}

async function bulkDeleteShowLeads() {
    const selectedCheckboxes = document.querySelectorAll('#showLeadsTableBody input[type="checkbox"]:checked');
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
        const result = await bulkDeleteShowLeadsAPI(selectedIds);
        
        showNotification(`${result.deletedCount} leads deleted successfully`, 'success');
        toggleShowLeadSelection();
        await loadShowLeads(); // Reload leads from server
        
    } catch (error) {
        console.error('Error bulk deleting leads:', error);
        showNotification('Failed to delete leads: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

function verifyPagination() {
    console.log('🔍 VERIFYING PAGINATION:');
    console.log('Total leads:', totalLeadsCount);
    console.log('Items per page:', itemsPerPage);
    console.log('Current page:', currentPage);
    console.log('Total pages:', Math.ceil(totalLeadsCount / itemsPerPage));
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalLeadsCount);
    console.log('Should show records:', startIndex + 1, 'to', endIndex, 'of', totalLeadsCount);
    
    const tbody = document.getElementById('showLeadsTableBody');
    console.log('Actual rows in table:', tbody.children.length);
    
    if (tbody.children.length > itemsPerPage) {
        console.warn('❌ TOO MANY ROWS: Table has', tbody.children.length, 'rows but should have max', itemsPerPage);
    } else {
        console.log('✅ CORRECT: Table has', tbody.children.length, 'rows');
    }
}

// Call this after renderShowLeads() in loadShowLeads function

function bulkEmailSelected() {
    const selectedCheckboxes = document.querySelectorAll('#showLeadsTableBody input[type="checkbox"]:checked');
    const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.value);
    
    if (selectedIds.length === 0) {
        showNotification('Please select leads to email', 'warning');
        return;
    }
    
    showNotification(`Email feature for ${selectedIds.length} leads coming soon`, 'info');
}

function bulkExportSelected() {
    const selectedCheckboxes = document.querySelectorAll('#showLeadsTableBody input[type="checkbox"]:checked');
    const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.value);
    
    if (selectedIds.length === 0) {
        showNotification('Please select leads to export', 'warning');
        return;
    }
    
    const selectedLeads = showLeads.filter(lead => selectedIds.includes(lead.id));
    const csvContent = convertToCSV(selectedLeads);
    downloadCSV(csvContent, 'selected_show_leads.csv');
    
    showNotification(`${selectedIds.length} leads exported successfully`, 'success');
}

// Pagination
function updatePagination(paginationData) {
    console.log('📄 Updating pagination with:', paginationData);
    
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
    
    console.log('🔢 Pagination numbers rendered:', { currentPage, totalPages });
}

// Add this function to test pagination
function testPagination() {
    console.log('🧪 Testing pagination...');
    console.log('Total leads:', totalLeadsCount);
    console.log('Items per page:', itemsPerPage);
    console.log('Current page:', currentPage);
    console.log('Total pages:', Math.ceil(totalLeadsCount / itemsPerPage));
    console.log('Showing records:', ((currentPage - 1) * itemsPerPage) + 1, 'to', Math.min(currentPage * itemsPerPage, totalLeadsCount));
}

// Call this in your loadShowLeads function after renderShowLeads();
// testPagination();

// Add this function to test pagination manually
function testPaginationManually() {
    console.log('🧪 MANUAL PAGINATION TEST');
    console.log('Total records:', totalLeadsCount);
    console.log('Items per page:', itemsPerPage);
    console.log('Total pages:', Math.ceil(totalLeadsCount / itemsPerPage));
    
    // Test going through all pages
    const totalPages = Math.ceil(totalLeadsCount / itemsPerPage);
    for (let page = 1; page <= totalPages; page++) {
        const start = (page - 1) * itemsPerPage;
        const end = Math.min(start + itemsPerPage, totalLeadsCount);
        console.log(`Page ${page}: records ${start + 1} to ${end} (${end - start} records)`);
    }
}

// Call this after loadShowLeads to verify
// testPaginationManually();

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
    renderShowLeads(); // Re-render with the new page
    
    // Update pagination UI
    updatePagination({
        currentPage: currentPage,
        totalPages: Math.ceil(totalLeadsCount / itemsPerPage),
        totalLeads: totalLeadsCount,
        hasPrev: currentPage > 1,
        hasNext: currentPage < Math.ceil(totalLeadsCount / itemsPerPage)
    });
}



// Stats Update
function updateStats(stats) {
    // This function is called but does nothing since KPI section is removed
    console.log('Stats data received (not displayed):', stats);
}

function animateCounter(elementId, endValue) {
    const element = document.getElementById(elementId);
    const card = element.closest('.kpi-card');
    const currentValue = parseInt(element.textContent) || 0;
    
    // If values are the same, no need to animate
    if (currentValue === endValue) {
        return;
    }

    // Add visual feedback
    element.classList.add('animating');
    if (card) card.classList.add('updating');

    const duration = 1500;
    const frameRate = 60;
    const totalFrames = (duration / 1000) * frameRate;
    const increment = (endValue - currentValue) / totalFrames;
    
    let currentFrame = 0;
    let displayedValue = currentValue;

    const counter = setInterval(() => {
        currentFrame++;
        displayedValue += increment;
        
        if (currentFrame >= totalFrames) {
            displayedValue = endValue;
            clearInterval(counter);
            
            // Remove visual feedback after animation completes
            setTimeout(() => {
                element.classList.remove('animating');
                if (card) card.classList.remove('updating');
            }, 300);
        }
        
        element.textContent = Math.round(displayedValue).toLocaleString();
    }, 1000 / frameRate);
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
async function exportShowLeads() {
    try {
        const token = getToken();
        if (!token) {
            showNotification('Please login to export leads', 'error');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/show-leads/export/csv`, {
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
        a.download = 'show_leads.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showNotification('Show leads exported successfully', 'success');
    } catch (error) {
        console.error('Error exporting leads:', error);
        showNotification('Failed to export leads: ' + error.message, 'error');
    }
}

function importShowLeads() {
    showNotification('Import show leads feature coming soon', 'info');
}

// Modal Management
function closeShowLeadModal() {
    document.getElementById('showLeadModal').style.display = 'none';
    currentEditingShowLead = null;
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    currentDeleteShowLead = null;
}

function closeShowLeadDetailsModal() {
    document.getElementById('showLeadDetailsModal').style.display = 'none';
}

function editShowLeadFromDetails() {
    const leadId = currentEditingShowLead ? currentEditingShowLead.id : null;
    closeShowLeadDetailsModal();
    if (leadId) {
        editShowLead(leadId);
    }
}

function emailShowLead() {
    showNotification('Email feature coming soon', 'info');
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        modal.style.display = 'none';
        modal.classList.remove('show');
    });
    currentEditingShowLead = null;
    currentDeleteShowLead = null;
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

// CSV Export Functions
function convertToCSV(data) {
    const headers = [
        'Contact Name', 'Email', 'Job Title', 'Company', 'Country', 
        'Phone', 'Show Name', 'Show Date', 'Source', 'Priority', 'Created Date'
    ];
    
    const rows = data.map(lead => [
        lead.contactName,
        lead.clientEmail,
        lead.jobTitle || '',
        lead.companyName,
        lead.companyCountry || '',
        lead.clientPhone || '',
        lead.showName,
        lead.showDate,
        lead.leadSource,
        lead.leadPriority,
        lead.createdDate
    ]);
    
    const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
        
    return csvContent;
}

function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

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

console.log('✅ Show Leads Management System fully initialized');