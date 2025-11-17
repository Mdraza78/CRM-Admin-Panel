// Salary Management System with Backend Integration

// Global variables
let currentSalaryId = null;
let allSalaries = [];
let currentEditingSalary = null;
let currentDeleteSalary = null;

// API Base URL
const API_BASE_URL = 'https://crm-admin-panel-production.up.railway.app/api/salary';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('💰 Salary Management System initializing...');
    
    // Check authentication first
    if (!checkAuthentication()) {
        console.log('Authentication failed, redirecting to login');
        return;
    }
    
    console.log('Authentication successful, initializing salaries');
    
    initializeSalaries();
    setupEventListeners();
    displayUserName(); // This will now also update the avatar
    
    // Load sidebar state
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (sidebarCollapsed) {
        document.querySelector('.app-container').classList.add('sidebar-collapsed');
    }
    
    // Show salaries list by default
    showSalaryList();
    
    console.log('✅ Salary Management System initialized successfully');
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
        
        showNotification('Please login to access salary management', 'error');
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

function initializeSalaries() {
    console.log('💰 Salary Management System initialized with backend integration');
    
    // Initialize form with current month/year
    const currentDate = new Date();
    document.getElementById('workingDays').value = getWorkingDaysInMonth(currentDate);
}

function getWorkingDaysInMonth(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    let count = 0;
    const curDate = new Date(year, month, 1);
    
    while (curDate.getMonth() === month) {
        const dayOfWeek = curDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
        curDate.setDate(curDate.getDate() + 1);
    }
    
    return count;
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
        // Set salary as default active menu
        this.setActiveMenu('salary');
        
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
function getToken() {
    return localStorage.getItem('authToken') || '';
}

// View Management
function showSalaryGenerator() {
    document.getElementById('salary-list').classList.add('hidden');
    document.getElementById('salary-generator').classList.remove('hidden');
    document.getElementById('salary-preview').classList.add('hidden');
    resetSalaryForm();
}

function showSalaryList() {
    document.getElementById('salary-list').classList.remove('hidden');
    document.getElementById('salary-generator').classList.add('hidden');
    document.getElementById('salary-preview').classList.add('hidden');
    loadSalaries();
}

function showSalaryPreview() {
    document.getElementById('salary-list').classList.add('hidden');
    document.getElementById('salary-generator').classList.add('hidden');
    document.getElementById('salary-preview').classList.remove('hidden');
}

// Main Functions
async function saveSalary() {
    try {
        const salaryData = collectFormData();
        
        if (!validateForm(salaryData)) {
            return;
        }

        const token = getToken();
        if (!token) {
            showNotification('Please login to generate salary', 'error');
            return;
        }

        const url = currentSalaryId ? `${API_BASE_URL}/payslip/${currentSalaryId}` : `${API_BASE_URL}/generate`;
        const method = currentSalaryId ? 'PUT' : 'POST';

        console.log(`💾 Saving salary:`, { url, method, salaryData });

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(salaryData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || result.message || `HTTP error! status: ${response.status}`);
        }

        if (result.success) {
            const savedSalary = result.data;
            
            showNotification(
                result.message || (currentSalaryId ? 'Salary updated successfully!' : 'Salary generated successfully!'), 
                'success'
            );
            
            // Show preview of the saved salary
            populatePreview(savedSalary);
            showSalaryPreview();
            
        } else {
            throw new Error(result.message || 'Failed to save salary');
        }
        
    } catch (error) {
        console.error('❌ Error saving salary:', error);
        showNotification(`Error: ${error.message}`, 'error');
    }
}

function collectFormData() {
    return {
        employeeId: document.getElementById('employeeId').value.trim(),
        employeeName: document.getElementById('employeeName').value.trim(),
        title: document.getElementById('employeeTitle').value.trim(),
        email: document.getElementById('employeeEmail').value.trim(),
        pan: document.getElementById('employeePan').value.trim(),
        accountNumber: document.getElementById('employeeAccount').value.trim(),
        workingDays: parseInt(document.getElementById('workingDays').value) || 30,
        lopDays: parseInt(document.getElementById('lopDays').value) || 0,
        basicPay: parseFloat(document.getElementById('basicPay').value) || 0,
        specialAllowance: parseFloat(document.getElementById('specialAllowance').value) || 0,
        taxDeduction: parseFloat(document.getElementById('taxDeduction').value) || 0
    };
}

function validateForm(data) {
    if (!data.employeeId) {
        showNotification('Employee ID is required', 'error');
        document.getElementById('employeeId').focus();
        return false;
    }
    
    if (!data.employeeName) {
        showNotification('Employee name is required', 'error');
        document.getElementById('employeeName').focus();
        return false;
    }
    
    if (!data.email) {
        showNotification('Email is required', 'error');
        document.getElementById('employeeEmail').focus();
        return false;
    }
    
    if (!data.basicPay || data.basicPay <= 0) {
        showNotification('Valid basic pay is required', 'error');
        document.getElementById('basicPay').focus();
        return false;
    }
    
    if (!data.specialAllowance || data.specialAllowance < 0) {
        showNotification('Valid special allowance is required', 'error');
        document.getElementById('specialAllowance').focus();
        return false;
    }
    
    return true;
}

function previewSalary() {
    const formData = collectFormData();
    if (!validateForm(formData)) return;
    
    // Create a temporary salary object for preview
    const currentDate = new Date();
    const tempSalary = {
        ...formData,
        _id: 'preview',
        month: currentDate.toLocaleString('default', { month: 'long' }),
        year: currentDate.getFullYear(),
        createdAt: new Date().toISOString()
    };
    
    populatePreview(tempSalary);
    showSalaryPreview();
}

function populatePreview(salary) {
    // Calculate salary components
    const totalEarnings = salary.basicPay + salary.specialAllowance;
    const dailyPay = salary.workingDays > 0 ? salary.basicPay / salary.workingDays : 0;
    const lopDeduction = dailyPay * salary.lopDays;
    const totalDeductions = salary.taxDeduction + lopDeduction;
    const netSalary = totalEarnings - totalDeductions;
    
    // Basic info
    document.getElementById('preview-month').textContent = salary.month;
    document.getElementById('preview-year').textContent = salary.year;
    
    // Employee details
    document.getElementById('preview-employeeId').textContent = salary.employeeId;
    document.getElementById('preview-employeeName').textContent = salary.employeeName;
    document.getElementById('preview-employeeTitle').textContent = salary.title;
    document.getElementById('preview-employeeEmail').textContent = salary.email;
    document.getElementById('preview-employeePan').textContent = salary.pan;
    document.getElementById('preview-employeeAccount').textContent = salary.accountNumber;
    
    // Salary breakdown
    document.getElementById('preview-basicPay').textContent = formatCurrency(salary.basicPay);
    document.getElementById('preview-specialAllowance').textContent = formatCurrency(salary.specialAllowance);
    document.getElementById('preview-totalEarnings').textContent = formatCurrency(totalEarnings);
    document.getElementById('preview-taxDeduction').textContent = formatCurrency(salary.taxDeduction);
    document.getElementById('preview-lopDeduction').textContent = formatCurrency(lopDeduction);
    document.getElementById('preview-totalDeductions').textContent = formatCurrency(totalDeductions);
    document.getElementById('preview-netSalary').textContent = formatCurrency(netSalary);
    document.getElementById('preview-salaryInWords').textContent = `(${convertToWords(netSalary)} only)`;
    
    // Store salary ID for later use
    currentSalaryId = salary._id !== 'preview' ? salary._id : null;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    }).format(amount);
}

function convertToWords(num) {
    // Simple number to words conversion for Indian rupees
    // For production, use a proper library like number-to-words
    const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    
    if ((num = num.toString()).length > 9) return 'overflow';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return; 
    
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    
    return str.trim() + ' rupees';
}

function createNewSalary() {
    currentSalaryId = null;
    resetSalaryForm();
    showSalaryGenerator();
}

function resetSalaryForm() {
    document.getElementById('salaryForm').reset();
    const currentDate = new Date();
    document.getElementById('workingDays').value = getWorkingDaysInMonth(currentDate);
    document.getElementById('lopDays').value = 0;
    document.getElementById('taxDeduction').value = 0;
}

// Update the loadSalaries function to handle API errors gracefully
async function loadSalaries() {
    try {
        showLoading(true);
        
        const token = getToken();
        if (!token) {
            showNotification('Please login to access salaries', 'error');
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
            return;
        }

        const response = await fetch(`${API_BASE_URL}/payslips/table`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            console.log(`✅ Successfully loaded ${result.data.length} salary records`);
            
            allSalaries = result.data.map(salary => ({
                _id: salary._id,
                employeeId: salary.employeeId,
                employeeName: salary.employeeName,
                title: salary.title,
                month: salary.month,
                year: salary.year,
                basicPay: salary.basicPay,
                specialAllowance: salary.specialAllowance,
                netPay: salary.netPay,
                workingDays: salary.workingDays,
                lopDays: salary.lopDays,
                taxDeduction: salary.taxDeduction,
                createdAt: salary.createdAt
            }));

            renderSalariesTable(allSalaries);
            
        } else {
            throw new Error(result.message || 'Failed to load salaries');
        }
    } catch (error) {
        console.error('❌ Error loading salaries:', error);
        showNotification('Failed to load salaries: ' + error.message, 'error');
        // Load sample data for demonstration
        loadSampleData();
    } finally {
        showLoading(false);
    }
}

function loadSampleData() {
    allSalaries = [
        {
            _id: '1',
            employeeId: 'GD-001',
            employeeName: 'John Doe',
            title: 'Software Engineer',
            month: 'October',
            year: 2025,
            basicPay: 15000,
            specialAllowance: 5000,
            netPay: 19500,
            workingDays: 30,
            lopDays: 0,
            taxDeduction: 500
        },
        {
            _id: '2',
            employeeId: 'GD-002',
            employeeName: 'Jane Smith',
            title: 'Senior Developer',
            month: 'October',
            year: 2025,
            basicPay: 20000,
            specialAllowance: 8000,
            netPay: 27500,
            workingDays: 30,
            lopDays: 1,
            taxDeduction: 500
        }
    ];
    renderSalariesTable(allSalaries);
}

function renderSalariesTable(salaries) {
    const tbody = document.getElementById('salaryTableBody');
    const emptyState = document.getElementById('emptyState');
    const loadingState = document.getElementById('loadingState');
    
    // Hide loading state
    loadingState.style.display = 'none';
    
    if (salaries.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        console.log('📭 No salary records to display');
        return;
    }
    
    emptyState.style.display = 'none';
    tbody.innerHTML = '';
    
    console.log(`🔄 Rendering ${salaries.length} salary records`);
    
    salaries.forEach(salary => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${salary.employeeId}</td>
            <td>${salary.employeeName}</td>
            <td>${salary.title}</td>
            <td>${salary.month}</td>
            <td>${salary.year}</td>
            <td>${formatCurrency(salary.basicPay)}</td>
            <td>${formatCurrency(salary.specialAllowance)}</td>
            <td>${formatCurrency(salary.netPay)}</td>
            <td class="actions">
                <button class="action-btn view" onclick="viewSalary('${salary._id}')" title="View">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn edit" onclick="editSalary('${salary._id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete" onclick="confirmDeleteSalary('${salary._id}', '${salary.employeeName}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

async function viewSalary(salaryId) {
    try {
        const token = getToken();
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/payslip/${salaryId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || result.message || 'Failed to load salary');
        }

        if (result.success) {
            const salary = result.data;
            populatePreview(salary);
            showSalaryPreview();
        } else {
            throw new Error(result.message || 'Failed to load salary');
        }
        
    } catch (error) {
        console.error('Error viewing salary:', error);
        showNotification('Failed to load salary: ' + error.message, 'error');
    }
}

async function editSalary(salaryId) {
    try {
        const token = getToken();
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/payslip/${salaryId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || result.message || 'Failed to load salary for editing');
        }

        if (result.success) {
            const salary = result.data;
            
            // Populate form with salary data
            document.getElementById('employeeId').value = salary.employeeId;
            document.getElementById('employeeName').value = salary.employeeName;
            document.getElementById('employeeTitle').value = salary.title;
            document.getElementById('employeeEmail').value = salary.email;
            document.getElementById('employeePan').value = salary.pan;
            document.getElementById('employeeAccount').value = salary.accountNumber;
            document.getElementById('workingDays').value = salary.workingDays;
            document.getElementById('lopDays').value = salary.lopDays;
            document.getElementById('basicPay').value = salary.basicPay;
            document.getElementById('specialAllowance').value = salary.specialAllowance;
            document.getElementById('taxDeduction').value = salary.taxDeduction;
            
            currentSalaryId = salaryId;
            showSalaryGenerator();
        } else {
            throw new Error(result.message || 'Failed to load salary for editing');
        }
        
    } catch (error) {
        console.error('Error editing salary:', error);
        showNotification('Failed to load salary for editing: ' + error.message, 'error');
    }
}

function confirmDeleteSalary(salaryId, employeeName) {
    currentDeleteSalary = {
        id: salaryId,
        name: employeeName
    };
    
    document.getElementById('deleteItemName').textContent = `${employeeName}'s salary record`;
    document.getElementById('deleteModal').style.display = 'flex';
    
    document.getElementById('confirmDeleteBtn').onclick = () => deleteSalary(salaryId);
}

async function deleteSalary(salaryId) {
    try {
        const token = getToken();
        if (!token) {
            showNotification('Please login to delete salary record', 'error');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/payslip/${salaryId}`, {
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
            showNotification(result.message || 'Salary record deleted successfully', 'success');
            closeDeleteModal();
            loadSalaries(); // Refresh the list
        } else {
            throw new Error(result.message || 'Failed to delete salary record');
        }
        
    } catch (error) {
        console.error('❌ Error deleting salary record:', error);
        showNotification('Failed to delete salary record: ' + error.message, 'error');
    }
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    currentDeleteSalary = null;
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
    currentDeleteSalary = null;
}

function filterSalaries() {
    const monthFilter = document.getElementById('monthFilter').value;
    const yearFilter = document.getElementById('yearFilter').value;
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    
    let filteredSalaries = allSalaries;
    
    if (monthFilter !== 'all') {
        filteredSalaries = filteredSalaries.filter(salary => salary.month === monthFilter);
    }
    
    if (yearFilter !== 'all') {
        filteredSalaries = filteredSalaries.filter(salary => salary.year.toString() === yearFilter);
    }
    
    if (searchInput) {
        filteredSalaries = filteredSalaries.filter(salary => 
            salary.employeeName.toLowerCase().includes(searchInput) ||
            salary.employeeId.toLowerCase().includes(searchInput) ||
            salary.title.toLowerCase().includes(searchInput)
        );
    }
    
    renderSalariesTable(filteredSalaries);
}

function printSalary() {
    window.print();
}

function showLoading(show) {
    const loadingState = document.getElementById('loadingState');
    const salariesSection = document.querySelector('.form-container');
    
    if (show) {
        salariesSection.style.opacity = '0.6';
        loadingState.style.display = 'block';
        console.log('⏳ Showing loading state');
    } else {
        salariesSection.style.opacity = '1';
        loadingState.style.display = 'none';
        console.log('✅ Hiding loading state');
    }
}

// Dashboard Functions
function toggleSidebar() {
    const appContainer = document.querySelector('.app-container');
    appContainer.classList.toggle('sidebar-collapsed');
    
    // Update the menu toggle icon
    const menuToggleIcon = document.querySelector('.menu-toggle i');
    if (appContainer.classList.contains('sidebar-collapsed')) {
        menuToggleIcon.className = 'fas fa-chevron-right';
    } else {
        menuToggleIcon.className = 'fas fa-bars';
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

// Avatar color function
function getAvatarColor() {
    return 'linear-gradient(135deg, #00BCD4 0%, #1E88E5 100%)';
}

// Update the displayUserName function to include avatar
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

console.log('✅ Salary Management System fully initialized');