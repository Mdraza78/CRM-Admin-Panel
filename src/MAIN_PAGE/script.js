// Global variables
const API_BASE_URL = 'https://crm-admin-panel-production.up.railway.app/api';

let dashboardData = {
    kpis: {
        leads: 247,
        deals: 43,
        revenue: 128500,
        tasks: 8
    },
    notifications: [
        { id: 1, type: 'urgent', icon: 'fa-exclamation-triangle', message: 'High-value deal closing tomorrow: ABC Corp - $50,000', time: '2 minutes ago' },
        { id: 2, type: 'normal', icon: 'fa-user-plus', message: 'New lead assigned: Sarah Wilson from TechStart', time: '1 hour ago' },
        { id: 3, type: 'normal', icon: 'fa-calendar', message: 'Meeting reminder: Client demo at 3:00 PM', time: '2 hours ago' },
        { id: 4, type: 'normal', icon: 'fa-clock', message: 'Overdue follow-up: GlobalTech proposal review', time: '1 day ago' },
        { id: 5, type: 'normal', icon: 'fa-envelope', message: 'Internal message: Team meeting scheduled for Friday', time: '2 days ago' }
    ]
};

let currentDropdown = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard loading...'); // Debug
    
    // Check authentication first
    if (!checkAuthentication()) {
        console.log('Authentication failed, redirecting to login'); // Debug
        return;
    }
    
    console.log('Authentication successful, initializing dashboard'); // Debug
    
    initializeDashboard();
    setupEventListeners();
    renderCharts();
    updateDateTime();
    setInterval(updateDateTime, 60000);
});

// Add this debug function
function debugUserData() {
    console.log('=== DEBUG USER DATA ===');
    console.log('localStorage userData:', localStorage.getItem('userData'));
    console.log('localStorage token:', localStorage.getItem('token'));
    
    const userData = getUserData();
    console.log('Parsed userData:', userData);
    console.log('========================');
}

function checkAuthentication() {
    console.log('🔐 Checking authentication...');
    
    // ✅ CONSISTENT: Use same keys as login.js
    const userData = getUserData();
    const token = localStorage.getItem('authToken'); // Changed from 'token'
    
    console.log('🔐 Auth check - UserData:', userData);
    console.log('🔐 Auth check - Token:', !!token);
    
    if (!userData || !token) {
        console.warn('❌ Authentication failed: Missing userData or token');
        
        // Clear any inconsistent data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        localStorage.removeItem('authToken');
        
        showNotification('Please login to access dashboard', 'error');
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
        return false;
    }
    
    // ✅ Optional: Validate token expiration
    const loginTime = localStorage.getItem('loginTime');
    if (loginTime) {
        const loginDate = new Date(loginTime);
        const now = new Date();
        const hoursDiff = (now - loginDate) / (1000 * 60 * 60);
        
        if (hoursDiff > 24) { // 24 hour expiration
            console.warn('❌ Token expired');
            logout();
            return false;
        }
    }
    
    console.log('✅ Authentication successful');
    return true;
}

function getUserData() {
    try {
        // ✅ CONSISTENT: Use 'userData' key
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

function debugAuth() {
    console.log('=== AUTH DEBUG INFO ===');
    console.log('localStorage userData:', localStorage.getItem('userData'));
    console.log('localStorage authToken:', localStorage.getItem('authToken'));
    console.log('localStorage user:', localStorage.getItem('user'));
    console.log('localStorage token:', localStorage.getItem('token'));
    
    const userData = getUserData();
    console.log('Parsed userData:', userData);
    console.log('Authentication check:', checkAuthentication());
    console.log('========================');
}

// Call this on dashboard load
debugAuth();

// Display user name in the header
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
        openProfileModal();
    };
}

function initializeDashboard() {
    console.log('🚀 Initializing dashboard...');
    
    // Debug first
    debugAuth();
    
    // Check authentication
    if (!checkAuthentication()) {
        return;
    }
    
    // Then load dashboard content
    displayUserName();
    updateKPIs();
    loadRecentActivities();
    
    // ✅ ADD THIS LINE - Initialize active menu
    window.activeMenuManager = new ActiveMenuManager();
    
    // Initialize sidebar state
    initializeSidebar();
    
    animateCounters();
    
    console.log('✅ Dashboard initialized successfully');
}

function previewImage(input) {
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = '';
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.maxWidth = '150px';
            img.style.maxHeight = '150px';
            img.style.borderRadius = '50%';
            preview.appendChild(img);
        }
        
        reader.readAsDataURL(input.files[0]);
    }
}

function setupEventListeners() {
    // Navigation click events
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            handleNavigation(this.dataset.page);
        });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.user-profile') && !e.target.closest('.notifications')) {
            closeAllDropdowns();
        }
    });

    // Close modals when clicking outside
    document.addEventListener('click', function(e) {
        const profileModal = document.getElementById('profileModal');
        const taskModal = document.getElementById('taskModal');
        
        if (e.target === profileModal) {
            closeProfileModal();
        }
        if (e.target === taskModal) {
            closeTaskModal();
        }
    });

    // Escape key to close modals and dropdowns
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllDropdowns();
            closeTaskModal();
            closeProfileModal();
        }
    });

    // Real-time search
    const searchInput = document.querySelector('.search-input');
    let searchTimeout;
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                performSearch(this.value);
            }, 300);
        });
    }

    // Edit profile form submission
    const editProfileForm = document.getElementById('editProfileForm');
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', handleProfileUpdate);
    }
}

// Navigation functions - UPDATED VERSION
function handleNavigation(page) {
    console.log(`Navigation requested to: ${page}`);
    
    // Define navigation routes - UPDATED industry-leads route
    const routes = {
        'dashboard': '/dashboard',
        'leads': '/leads', 
        'industry-leads': '/industry-leads', // CHANGED: Now points to correct route
        'deals': '/deals',
        'contacts': '/contacts',
        'invoice': '/invoice',
        'reports': '/reports',
        'settings': '/settings',
        'salary': '/salary'
    };
    
    const route = routes[page];
    
    if (route) {
        showNotification(`Loading ${getPageTitle(page)}...`, 'info');
        
        // Use setTimeout to allow notification to show before navigation
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

// Updated navigation event listeners
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault(); // Always prevent default to handle navigation via JavaScript
        
        const page = this.dataset.page;
        const href = this.getAttribute('href');
        
        console.log(`Nav click - Page: ${page}, Href: ${href}`);
        
        if (page && page !== 'unknown') {
            handleNavigation(page);
        } else if (href && href !== '#' && href !== '') {
            // Fallback: use href if no data-page attribute
            showNotification('Loading...', 'info');
            setTimeout(() => {
                window.location.href = href;
            }, 500);
        } else {
            console.warn('No valid navigation target found');
            showNotification('Navigation not available', 'warning');
        }
    });
});


// Dropdown functions
function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    const isVisible = dropdown.classList.contains('show');
    
    closeAllDropdowns();
    
    if (!isVisible) {
        dropdown.classList.add('show');
        currentDropdown = 'user';
    }
}

function toggleNotifications() {
    const dropdown = document.getElementById('notificationsDropdown');
    const isVisible = dropdown.classList.contains('show');
    
    closeAllDropdowns();
    
    if (!isVisible) {
        dropdown.classList.add('show');
        currentDropdown = 'notifications';
    }
}

function closeAllDropdowns() {
    document.querySelectorAll('.user-dropdown, .notifications-dropdown').forEach(dropdown => {
        dropdown.classList.remove('show');
    });
    currentDropdown = null;
}

// Profile Modal Functions
function viewProfile() {
    closeAllDropdowns();
    openProfileModal();
}

function openProfileModal() {
    const userData = getUserData();
    const modal = document.getElementById('profileModal');
    
    if (userData) {
        // Populate profile data
        document.getElementById('profileName').textContent = userData.name || 'Unknown User';
        document.getElementById('profileUsername').textContent = userData.username || '-';
        document.getElementById('profileEmail').textContent = userData.email || '-';
        document.getElementById('profileUserId').textContent = userData.id || '-';
        
        // Set current date as member since (you can modify this to use actual registration date)
        const memberSince = new Date().getFullYear();
        document.getElementById('profileMemberSince').textContent = memberSince;
        
        // Set last login time
        const lastLogin = new Date().toLocaleString();
        document.getElementById('profileLastLogin').textContent = lastLogin;
        
        // Populate stats from dashboard data
        document.getElementById('profileLeadsCount').textContent = dashboardData.kpis.leads.toLocaleString();
        document.getElementById('profileDealsCount').textContent = dashboardData.kpis.deals.toLocaleString();
        document.getElementById('profileTasksCount').textContent = dashboardData.kpis.tasks.toLocaleString();
        
        // Show modal
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        
        showNotification(`Opening ${userData.name}'s profile`, 'info');
    } else {
        showNotification('Unable to load user profile data', 'error');
    }
}

function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
    // Switch back to view mode when closing
    switchToViewMode();
}

// Profile Edit Mode Functions
function switchToEditMode() {
    const userData = getUserData();
    
    // Populate edit form with current data
    document.getElementById('editName').value = userData.name || '';
    document.getElementById('editUsername').value = userData.username || '';
    document.getElementById('editEmail').value = userData.email || '';
    
    // Clear password fields
    document.getElementById('editCurrentPassword').value = '';
    document.getElementById('editNewPassword').value = '';
    document.getElementById('editConfirmPassword').value = '';
    
    // Clear error messages
    clearErrorMessages();
    
    // Switch modes
    document.getElementById('profileViewMode').style.display = 'none';
    document.getElementById('profileEditMode').style.display = 'block';
}

function switchToViewMode() {
    document.getElementById('profileEditMode').style.display = 'none';
    document.getElementById('profileViewMode').style.display = 'block';
}

function clearErrorMessages() {
    const errorElements = document.querySelectorAll('.field-error');
    errorElements.forEach(element => {
        element.textContent = '';
    });
}

function showFieldError(fieldId, message) {
    const errorElement = document.getElementById(fieldId);
    if (errorElement) {
        errorElement.textContent = message;
    }
}

// Handle Profile Update - FIXED VERSION
async function handleProfileUpdate(e) {
    console.log('🔄 handleProfileUpdate called'); // Debug log
    
    // Prevent form submission and page redirect - THIS IS CRITICAL
    e.preventDefault();
    
    const saveBtn = document.getElementById('saveProfileBtn');
    const originalText = saveBtn.innerHTML;
    
    try {
        // Show loading state
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        saveBtn.disabled = true;
        
        // Get form data
        const formData = {
            name: document.getElementById('editName').value.trim(),
            username: document.getElementById('editUsername').value.trim(),
            email: document.getElementById('editEmail').value.trim(),
            currentPassword: document.getElementById('editCurrentPassword').value,
            newPassword: document.getElementById('editNewPassword').value
        };
        
        console.log('📝 Form data to send:', formData);
        
        // Basic validation
        if (!formData.name || !formData.username || !formData.email) {
            alert('❌ Please fill in all required fields');
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
            return;
        }
        
        if (formData.newPassword && !formData.currentPassword) {
            alert('❌ Please enter your current password to change password');
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
            return;
        }
        
        // Get token
        const token = localStorage.getItem('token');
        if (!token) {
            alert('❌ Authentication token not found. Please login again.');
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
            return;
        }
        
        console.log('🔑 Token found');
        
        // IMPORTANT: Use the correct endpoint - check your backend routes
        // Try both endpoints to see which one works
        const endpoints = ['/api/update', '/api/profile/update'];
        let response = null;
        let result = null;
        
        for (const endpoint of endpoints) {
            try {
                console.log(`🚀 Trying endpoint: ${endpoint}`);
                response = await fetch(endpoint, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`, // Added Bearer prefix
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                console.log(`📡 Response from ${endpoint}:`, response.status);
                
                if (response.ok) {
                    result = await response.json();
                    console.log('✅ Success with endpoint:', endpoint);
                    break;
                }
            } catch (error) {
                console.log(`❌ Failed with ${endpoint}:`, error.message);
                continue;
            }
        }
        
        if (!response) {
            throw new Error('No response from server - check if backend is running');
        }
        
        if (response.ok) {
            // Success - update local storage
            const currentUserData = getUserData();
            const updatedUserData = {
                ...currentUserData,
                name: formData.name,
                username: formData.username,
                email: formData.email
            };
            localStorage.setItem('userData', JSON.stringify(updatedUserData));
            
            // Show success message using your notification system
            showNotification('✅ Profile updated successfully!', 'success');
            
            // Switch back to view mode
            switchToViewMode();
            
            // Update displayed user name immediately
            displayUserName();
            
            // Close modal after delay (don't reload page)
            setTimeout(() => {
                closeProfileModal();
            }, 1500);
            
        } else {
            // Server returned error
            const errorMessage = result?.msg || `Server error: ${response.status}`;
            console.error('❌ Server error:', errorMessage);
            showNotification('❌ ' + errorMessage, 'error');
        }
        
    } catch (error) {
        console.error('💥 Update error:', error);
        
        // Network error or other issues
        if (error.name === 'TypeError' || error.message.includes('Network') || error.message.includes('Failed to fetch')) {
            showNotification('❌ Network error: Cannot connect to server. Please check if your backend server is running on port 5080.', 'error');
        } else {
            showNotification('❌ Error: ' + error.message, 'error');
        }
        
    } finally {
        // Restore button state
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    }
    
    // Prevent default form behavior
    return false;
}

// Add this test function to debug
async function testBackendConnection() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('No token found');
            return;
        }
        
        console.log('Testing backend connection...');
        const response = await fetch('/api/profile/me', {
            headers: {
                'Authorization': token
            }
        });
        
        console.log('Test response status:', response.status);
        const result = await response.json();
        console.log('Test response data:', result);
        
        if (response.ok) {
            alert('✅ Backend is working! User: ' + result.name);
        } else {
            alert('❌ Backend error: ' + result.msg);
        }
    } catch (error) {
        console.error('Backend test failed:', error);
        alert('❌ Cannot connect to backend: ' + error.message);
    }
}

function validateProfileForm(formData) {
    let isValid = true;
    clearErrorMessages();
    
    // Validate name
    if (!formData.name) {
        showFieldError('nameError', 'Name is required');
        isValid = false;
    } else if (formData.name.length < 2) {
        showFieldError('nameError', 'Name must be at least 2 characters');
        isValid = false;
    }
    
    // Validate username
    if (!formData.username) {
        showFieldError('usernameError', 'Username is required');
        isValid = false;
    } else if (formData.username.length < 3) {
        showFieldError('usernameError', 'Username must be at least 3 characters');
        isValid = false;
    }
    
    // Validate email
    if (!formData.email) {
        showFieldError('emailError', 'Email is required');
        isValid = false;
    } else if (!isValidEmail(formData.email)) {
        showFieldError('emailError', 'Please enter a valid email address');
        isValid = false;
    }
    
    // Validate password if provided
    if (formData.newPassword) {
        if (!formData.currentPassword) {
            showFieldError('passwordError', 'Current password is required to change password');
            isValid = false;
        } else if (formData.newPassword.length < 6) {
            showFieldError('passwordError', 'New password must be at least 6 characters');
            isValid = false;
        } else if (formData.newPassword !== document.getElementById('editConfirmPassword').value) {
            showFieldError('passwordError', 'Passwords do not match');
            isValid = false;
        }
    }
    
    return isValid;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Avatar Upload Functions
function triggerAvatarUpload() {
    document.getElementById('avatarUpload').click();
}

function handleAvatarUpload(files) {
    if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
            // Here you would typically upload to your server
            const reader = new FileReader();
            reader.onload = function(e) {
                // Update avatar preview
                const avatarImages = document.querySelectorAll('.user-avatar-large, .user-avatar');
                avatarImages.forEach(img => {
                    img.src = e.target.result;
                });
                showNotification('Profile picture updated successfully!', 'success');
            };
            reader.readAsDataURL(file);
        } else {
            showNotification('Please select a valid image file', 'error');
        }
    }
}

// User menu functions
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
        
        // ✅ Clear the correct keys
        localStorage.removeItem('userData');
        localStorage.removeItem('authToken');
        localStorage.removeItem('loginTime');
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('savedEmail');
        
        // Redirect to login page
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
    }
}

function debugStorage() {
    console.log('🔍 STORAGE DEBUG:');
    console.log('user:', localStorage.getItem('user'));
    console.log('authToken:', localStorage.getItem('authToken'));
    console.log('userData:', localStorage.getItem('userData')); // Old key
    console.log('token:', localStorage.getItem('token')); // Old key
}

// Run this in console after login
debugStorage();

// Notification functions
function markAllRead() {
    dashboardData.notifications.forEach(notification => {
        notification.read = true;
    });
    
    const badge = document.getElementById('notificationCount');
    badge.textContent = '0';
    badge.style.display = 'none';
    
    closeAllDropdowns();
    showNotification('All notifications marked as read', 'success');
}

function viewNotification(id) {
    const notification = dashboardData.notifications.find(n => n.id === id);
    if (notification) {
        notification.read = true;
        updateNotificationBadge();
        closeAllDropdowns();
        showNotification(`Viewing: ${notification.message}`, 'info');
    }
}

function updateNotificationBadge() {
    const unreadCount = dashboardData.notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notificationCount');
    badge.textContent = unreadCount;
    badge.style.display = unreadCount > 0 ? 'flex' : 'none';
}

// Sidebar Toggle Functionality
let sidebarCollapsed = false;

// Toggle sidebar function - FIXED VERSION
function toggleSidebar() {
    const appContainer = document.querySelector('.app-container');
    const header = document.querySelector('.header');
    
    // Toggle the collapsed class
    appContainer.classList.toggle('sidebar-collapsed');
    
    // Update the state variable
    sidebarCollapsed = appContainer.classList.contains('sidebar-collapsed');
    
    // Save state to localStorage
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed);
    
    console.log('Sidebar toggled. Collapsed:', sidebarCollapsed);
}

// Initialize sidebar state from localStorage
function initializeSidebar() {
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    const appContainer = document.querySelector('.app-container');
    
    if (isCollapsed) {
        appContainer.classList.add('sidebar-collapsed');
        sidebarCollapsed = true;
    } else {
        appContainer.classList.remove('sidebar-collapsed');
        sidebarCollapsed = false;
    }
    
    console.log('Sidebar initialized. Collapsed:', sidebarCollapsed);
}

// Call this on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeSidebar();
    
    // Add click event listener to menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleSidebar);
    }
    
    // Close sidebar when clicking on nav links on mobile
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768 && sidebarCollapsed) {
                toggleSidebar();
            }
        });
    });
});

// Handle window resize
window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
        // Ensure sidebar is visible on larger screens if not explicitly collapsed
        const isExplicitlyCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (!isExplicitlyCollapsed) {
            document.querySelector('.app-container').classList.remove('sidebar-collapsed');
            sidebarCollapsed = false;
        }
    }
});

// Enhanced Active Menu Manager with sidebar support
class ActiveMenuManager {
    constructor() {
        this.currentActiveMenu = null;
        this.init();
    }

    init() {
        // Set dashboard as default active menu
        this.setActiveMenu('dashboard');
        
        // Add click event listeners to all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                this.setActiveMenu(page);
                
                // Auto-expand sidebar when clicking menu items if collapsed
                if (sidebarCollapsed) {
                    toggleSidebar();
                }
                
                // You can add page navigation logic here
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
        console.log(`Navigating to: ${page}`);
        
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

function navigateToLeads() {
    console.log('Navigating to leads page...');
    showNotification('Loading Leads Management...', 'info');
    
    // Use window.location for direct navigation
    setTimeout(() => {
        window.location.href = '/leads';
    }, 500);
}

// Search function
function performSearch(query) {
    if (query.length < 2) return;
    
    console.log(`Searching for: ${query}`);
    showNotification(`Searching for "${query}"...`, 'info');
    
    // Simulate search results
    setTimeout(() => {
        showNotification(`Found 12 results for "${query}"`, 'success');
    }, 1000);
}

// KPI functions
function updateKPIs() {
    const kpis = dashboardData.kpis;
    
    // Update KPI values with animation will be handled by animateCounters
    document.querySelector('.kpi-card.leads .kpi-value').textContent = '0';
    document.querySelector('.kpi-card.deals .kpi-value').textContent = '0';
    document.querySelector('.kpi-card.revenue .kpi-value').textContent = '$0';
    document.querySelector('.kpi-card.tasks .kpi-value').textContent = '0';
}

function animateCounters() {
    const kpis = dashboardData.kpis;
    
    animateCounter('.kpi-card.leads .kpi-value', 0, kpis.leads, 2000);
    animateCounter('.kpi-card.deals .kpi-value', 0, kpis.deals, 2000);
    animateCounter('.kpi-card.revenue .kpi-value', 0, kpis.revenue, 2000, true);
    animateCounter('.kpi-card.tasks .kpi-value', 0, kpis.tasks, 2000);
}

function animateCounter(selector, start, end, duration, isCurrency = false) {
    const element = document.querySelector(selector);
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
            current = end;
            clearInterval(timer);
        }
        
        const value = Math.floor(current);
        if (isCurrency) {
            element.textContent = `$${value.toLocaleString()}`;
        } else {
            element.textContent = value.toLocaleString();
        }
    }, 16);
}

// Pipeline functions
function viewPipelineStage(stage) {
    showNotification(`Viewing ${stage} deals...`, 'info');
    console.log(`Navigating to ${stage} pipeline stage`);
}

// Activity functions
function loadRecentActivities() {
    // Activities are already in HTML, but you could load them dynamically here
    console.log('Recent activities loaded');
}

function viewAllActivities() {
    showNotification('Loading all activities...', 'info');
    console.log('Navigating to all activities');
}

function viewActivityDetail(id) {
    showNotification(`Viewing activity details for ID: ${id}`, 'info');
    console.log(`Viewing activity ${id}`);
}

// Task functions
function toggleTask(id, completed) {
    const taskItem = document.getElementById(`task${id}`).closest('.task-item');
    
    if (completed) {
        taskItem.style.opacity = '0.6';
        taskItem.style.textDecoration = 'line-through';
        showNotification('Task marked as completed', 'success');
        
        setTimeout(() => {
            taskItem.style.opacity = '1';
            taskItem.style.textDecoration = 'none';
            document.getElementById(`task${id}`).checked = false;
        }, 2000);
    } else {
        taskItem.style.opacity = '1';
        taskItem.style.textDecoration = 'none';
    }
}

function addTask() {
    document.getElementById('taskModal').style.display = 'flex';
    document.getElementById('taskModal').classList.add('show');
    
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    
    const dateInput = document.getElementById('taskDate');
    dateInput.value = tomorrow.toISOString().slice(0, 16);
    
    document.getElementById('taskTitle').focus();
}

function saveTask() {
    const title = document.getElementById('taskTitle').value.trim();
    const type = document.getElementById('taskType').value;
    const priority = document.getElementById('taskPriority').value;
    const date = document.getElementById('taskDate').value;
    const description = document.getElementById('taskDescription').value.trim();
    
    if (!title) {
        showNotification('Please enter a task title', 'error');
        return;
    }
    
    if (!date) {
        showNotification('Please select a due date', 'error');
        return;
    }
    
    // Here you would typically save to database
    console.log('Saving task:', { title, type, priority, date, description });
    
    closeTaskModal();
    showNotification('Task created successfully', 'success');
}

function closeTaskModal() {
    document.getElementById('taskModal').style.display = 'none';
    document.getElementById('taskModal').classList.remove('show');
    
    // Reset form
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskType').value = 'call';
    document.getElementById('taskPriority').value = 'medium';
    document.getElementById('taskDate').value = '';
    document.getElementById('taskDescription').value = '';
}

// Reports functions
function updateReports(timeframe) {
    showNotification(`Updating reports for ${timeframe}`, 'info');
    console.log(`Updating reports for timeframe: ${timeframe}`);
    
    // Here you would update the charts and data based on the selected timeframe
    setTimeout(() => {
        showNotification(`Reports updated for ${timeframe}`, 'success');
    }, 1000);
}

// Chart rendering (simplified - you would use Chart.js or similar library)
function renderCharts() {
    renderSalesChart();
    renderRevenueChart();
}

function renderSalesChart() {
    const canvas = document.getElementById('salesChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Simple bar chart simulation
    ctx.fillStyle = '#667eea';
    ctx.fillRect(50, 150, 40, 40);
    ctx.fillRect(100, 130, 40, 60);
    ctx.fillRect(150, 110, 40, 80);
    ctx.fillRect(200, 90, 40, 100);
    
    ctx.fillStyle = '#2c3e50';
    ctx.font = '12px Arial';
    ctx.fillText('Sales Performance Chart', 80, 20);
    ctx.fillText('(Placeholder)', 110, 35);
}

function renderRevenueChart() {
    const canvas = document.getElementById('revenueChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Simple line chart simulation
    ctx.strokeStyle = '#28a745';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(20, 120);
    ctx.lineTo(80, 100);
    ctx.lineTo(140, 80);
    ctx.lineTo(200, 60);
    ctx.lineTo(260, 40);
    ctx.stroke();
    
    ctx.fillStyle = '#2c3e50';
    ctx.font = '12px Arial';
    ctx.fillText('Revenue Trend', 110, 20);
}

// Quick Action functions
function addLead() {
    showNotification('Opening add lead form...', 'info');
    console.log('Navigating to add lead');
}

function addDeal() {
    showNotification('Opening add deal form...', 'info');
    console.log('Navigating to add deal');
}

function logActivity() {
    showNotification('Opening activity log...', 'info');
    console.log('Navigating to log activity');
}

function importData() {
    showNotification('Opening data import wizard...', 'info');
    console.log('Opening import data');
}

function exportData() {
    showNotification('Preparing data export...', 'info');
    console.log('Exporting data');
    
    setTimeout(() => {
        showNotification('Data export completed', 'success');
    }, 2000);
}

function scheduleMeeting() {
    showNotification('Opening meeting scheduler...', 'info');
    console.log('Opening meeting scheduler');
}

// Utility functions
function updateDateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const dateString = now.toLocaleDateString([], {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'});
    
    // Update any date/time displays if they exist
    console.log(`Current time: ${timeString} on ${dateString}`);
}

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
    
    // Style notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 16px 20px;
        border-radius: 10px;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        font-size: 14px;
        font-weight: 500;
        max-width: 400px;
        transform: translateX(100%);
        transition: transform 0.4s ease;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
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
        info: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    };
    return colors[type] || colors.info;
}

// Initialize notification badge
updateNotificationBadge();

// Simulate real-time updates
setInterval(() => {
    // Simulate new notifications occasionally
    if (Math.random() < 0.1) { // 10% chance every 30 seconds
        const newNotification = {
            id: Date.now(),
            type: 'normal',
            icon: 'fa-bell',
            message: 'New activity detected in your CRM',
            time: 'Just now'
        };
        dashboardData.notifications.unshift(newNotification);
        updateNotificationBadge();
    }
}, 30000);

console.log('CRM Dashboard initialized successfully');