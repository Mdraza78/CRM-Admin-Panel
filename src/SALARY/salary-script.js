// Salary Management System with Backend Integration - Updated for new layout

// Global variables
let currentSalaryId = null;
let allSalaries = [];
let currentEditingSalary = null;
let currentDeleteSalary = null;
let currentPage = 1;
let itemsPerPage = 10;
let totalSalariesCount = 0;
let currentPreviewData = null;

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
    displayUserName();
    
    // Load sidebar state
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (sidebarCollapsed) {
        document.querySelector('.app-container').classList.add('sidebar-collapsed');
    }
    
    // Load salaries by default
    loadSalaries();
    
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
        
        if (!userDataString) {
            console.warn('❌ No user data found in localStorage');
            return null;
        }
        
        const userData = JSON.parse(userDataString);
        
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
    });

    // Navigation - Updated for new structure
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '#' || !this.getAttribute('href')) {
                e.preventDefault();
                const page = this.dataset.page;
                console.log(`🔄 Navigation clicked: ${page}`);
                handleNavigation(page);
            }
        });
    });

    // Live form updates for preview
    document.querySelectorAll('#salaryForm input, #salaryForm select').forEach(element => {
        element.addEventListener('input', updateSalaryPreview);
    });
    
    console.log('✅ Event listeners setup complete');
}

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
        'salary': 'Salary'
    };
    return titles[page] || page.replace('-', ' ');
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

// View Management Functions - UPDATED FOR NEW STRUCTURE
function showSalaryGenerator() {
    // Hide all views except salary generator modal
    closeSalaryModal();
    
    setTimeout(() => {
        currentSalaryId = null;
        document.getElementById('salaryModalTitle').textContent = 'Generate New Salary';
        resetSalaryForm();
        
        const modal = document.getElementById('salaryGeneratorModal');
        modal.style.display = 'flex';
        modal.classList.add('show');
        
        // Update preview
        updateSalaryPreview();
    }, 100);
}

function showSalaryList() {
    // Just reload salaries - we're already in the list view
    loadSalaries();
}

function closeSalaryModal() {
    const modal = document.getElementById('salaryGeneratorModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
    }
    currentSalaryId = null;
    currentEditingSalary = null;
}

function closePreviewModal() {
    const modal = document.getElementById('salaryPreviewModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
    }
    currentPreviewData = null;
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
            
            // Close modal and reload list
            closeSalaryModal();
            await loadSalaries();
            
        } else {
            throw new Error(result.message || 'Failed to save salary');
        }
        
    } catch (error) {
        console.error('❌ Error saving salary:', error);
        showNotification(`Error: ${error.message}`, 'error');
    }
}

function collectFormData() {
    const currentDate = new Date();
    
    return {
        employeeId: document.getElementById('employeeId')?.value.trim() || '',
        employeeName: document.getElementById('employeeName')?.value.trim() || '',
        title: document.getElementById('employeeTitle')?.value.trim() || '',
        email: document.getElementById('employeeEmail')?.value.trim() || '',
        pan: document.getElementById('employeePan')?.value.trim() || '',
        accountNumber: document.getElementById('employeeAccount')?.value.trim() || '',
        workingDays: parseInt(document.getElementById('workingDays')?.value) || 30,
        lopDays: parseInt(document.getElementById('lopDays')?.value) || 0,
        basicPay: parseFloat(document.getElementById('basicPay')?.value) || 0,
        specialAllowance: parseFloat(document.getElementById('specialAllowance')?.value) || 0,
        taxDeduction: parseFloat(document.getElementById('taxDeduction')?.value) || 0,
        month: currentDate.toLocaleString('default', { month: 'long' }),
        year: currentDate.getFullYear()
    };
}

function validateForm(data) {
    if (!data.employeeId) {
        showNotification('Employee ID is required', 'error');
        document.getElementById('employeeId')?.focus();
        return false;
    }
    
    if (!data.employeeName) {
        showNotification('Employee name is required', 'error');
        document.getElementById('employeeName')?.focus();
        return false;
    }
    
    if (!data.email) {
        showNotification('Email is required', 'error');
        document.getElementById('employeeEmail')?.focus();
        return false;
    }
    
    if (!data.basicPay || data.basicPay <= 0) {
        showNotification('Valid basic pay is required', 'error');
        document.getElementById('basicPay')?.focus();
        return false;
    }
    
    if (!data.specialAllowance || data.specialAllowance < 0) {
        showNotification('Valid special allowance is required', 'error');
        document.getElementById('specialAllowance')?.focus();
        return false;
    }
    
    return true;
}

function updateSalaryPreview() {
    try {
        const data = collectFormData();
        
        // Update live preview in modal
        const dailyPay = data.workingDays > 0 ? data.basicPay / data.workingDays : 0;
        const lopDeduction = dailyPay * data.lopDays;
        const totalEarnings = data.basicPay + data.specialAllowance;
        const totalDeductions = data.taxDeduction + lopDeduction;
        const netSalary = totalEarnings - totalDeductions;
        
        document.getElementById('previewBasicPay').textContent = formatCurrency(data.basicPay);
        document.getElementById('previewAllowance').textContent = formatCurrency(data.specialAllowance);
        document.getElementById('previewTax').textContent = formatCurrency(data.taxDeduction);
        document.getElementById('previewLOP').textContent = formatCurrency(lopDeduction);
        document.getElementById('previewNetSalary').textContent = formatCurrency(netSalary);
        
    } catch (error) {
        console.error('Error updating preview:', error);
    }
}

function previewSalarySlip() {
    const formData = collectFormData();
    if (!validateForm(formData)) return;
    
    // Get current date
    const currentDate = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June", 
                       "July", "August", "September", "October", "November", "December"];
    const month = monthNames[currentDate.getMonth()];
    const year = currentDate.getFullYear();
    
    // Calculate last day of month for pay date
    const lastDay = new Date(year, currentDate.getMonth() + 1, 0);
    const payDate = `${lastDay.getDate().toString().padStart(2, '0')}/${(lastDay.getMonth() + 1).toString().padStart(2, '0')}/${lastDay.getFullYear()}`;
    
    // Calculate LOP deduction
    const dailyPay = formData.workingDays > 0 ? formData.basicPay / formData.workingDays : 0;
    const lopDeduction = dailyPay * formData.lopDays;
    
    // Calculate net salary
    const totalEarnings = formData.basicPay + formData.specialAllowance;
    const totalDeductions = formData.taxDeduction + lopDeduction;
    const netSalary = totalEarnings - totalDeductions;
    
    // Populate the slip with dynamic data
    document.getElementById('preview-month').textContent = month;
    document.getElementById('preview-year').textContent = year;
    document.getElementById('preview-pay-date').textContent = payDate;
    
    // Employee Information
    document.getElementById('preview-employeeId').textContent = formData.employeeId;
    document.getElementById('preview-employeeName').textContent = formData.employeeName;
    document.getElementById('preview-employeeTitle').textContent = formData.title;
    document.getElementById('preview-employeeEmail').textContent = formData.email;
    document.getElementById('preview-employeeAccount').textContent = formData.accountNumber;
    
    // Salary Details
    document.getElementById('preview-working-days').textContent = formData.workingDays;
    document.getElementById('preview-lop-days').textContent = formData.lopDays;
    document.getElementById('preview-basicPay').textContent = formatCurrency(formData.basicPay);
    document.getElementById('preview-specialAllowance').textContent = formatCurrency(formData.specialAllowance);
    document.getElementById('preview-taxDeduction').textContent = formatCurrency(formData.taxDeduction);
    
    // Net Salary
    document.getElementById('preview-netSalary').textContent = netSalary.toFixed(2);
    document.getElementById('preview-salaryInWords').textContent = `Indian Rupee ${convertToWords(netSalary)} Only`;
    
    // Footer month
    document.getElementById('preview-footer-month').textContent = `${month} ${year}`;
    
    // Store data for later use
    currentPreviewData = {
        employeeId: formData.employeeId,
        employeeName: formData.employeeName,
        title: formData.title,
        email: formData.email,
        accountNumber: formData.accountNumber,
        workingDays: formData.workingDays,
        lopDays: formData.lopDays,
        basicPay: formData.basicPay,
        specialAllowance: formData.specialAllowance,
        taxDeduction: formData.taxDeduction,
        netSalary: netSalary,
        month: month,
        year: year,
        payDate: payDate
    };
    
    // Show preview modal
    const modal = document.getElementById('salaryPreviewModal');
    modal.style.display = 'flex';
    modal.classList.add('show');
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
    const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    
    if ((num = Math.floor(num)).toString().length > 9) return 'overflow';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return ''; 
    
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    
    return str.trim() + ' rupees';
}

function resetSalaryForm() {
    const form = document.getElementById('salaryForm');
    if (form) form.reset();
    
    const currentDate = new Date();
    document.getElementById('workingDays').value = getWorkingDaysInMonth(currentDate);
    document.getElementById('lopDays').value = 0;
    document.getElementById('taxDeduction').value = 0;
    
    // Trigger preview update
    updateSalaryPreview();
}

// Update the loadSalaries function
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

            totalSalariesCount = allSalaries.length;
            
            // Update total records display
            document.getElementById('totalRecords').textContent = totalSalariesCount;
            
            // Apply filters and sort
            const filteredSalaries = filterAndSortSalaries(allSalaries);
            
            renderSalariesTable(filteredSalaries);
            
            // Update pagination
            updatePagination({
                currentPage: currentPage,
                totalPages: Math.ceil(totalSalariesCount / itemsPerPage),
                totalSalaries: totalSalariesCount,
                hasPrev: currentPage > 1,
                hasNext: currentPage < Math.ceil(totalSalariesCount / itemsPerPage)
            });
            
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

function filterAndSortSalaries(salaries) {
    // Apply filters
    let filtered = [...salaries];
    
    const monthFilter = document.getElementById('monthFilter')?.value;
    const yearFilter = document.getElementById('yearFilter')?.value;
    const searchInput = document.getElementById('searchInput')?.value.toLowerCase();
    
    if (monthFilter && monthFilter !== 'all') {
        filtered = filtered.filter(salary => salary.month === monthFilter);
    }
    
    if (yearFilter && yearFilter !== 'all') {
        filtered = filtered.filter(salary => salary.year.toString() === yearFilter);
    }
    
    if (searchInput) {
        filtered = filtered.filter(salary => 
            salary.employeeName.toLowerCase().includes(searchInput) ||
            salary.employeeId.toLowerCase().includes(searchInput) ||
            salary.title.toLowerCase().includes(searchInput)
        );
    }
    
    // Apply sorting
    const sortBy = document.getElementById('sortBy')?.value || 'created_desc';
    
    switch(sortBy) {
        case 'name_asc':
            filtered.sort((a, b) => a.employeeName.localeCompare(b.employeeName));
            break;
        case 'name_desc':
            filtered.sort((a, b) => b.employeeName.localeCompare(a.employeeName));
            break;
        case 'amount_desc':
            filtered.sort((a, b) => b.netPay - a.netPay);
            break;
        case 'amount_asc':
            filtered.sort((a, b) => a.netPay - b.netPay);
            break;
        case 'created_asc':
            filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            break;
        default: // 'created_desc'
            filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
    }
    
    return filtered;
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
    
    totalSalariesCount = allSalaries.length;
    document.getElementById('totalRecords').textContent = totalSalariesCount;
    
    const filteredSalaries = filterAndSortSalaries(allSalaries);
    renderSalariesTable(filteredSalaries);
    
    updatePagination({
        currentPage: currentPage,
        totalPages: Math.ceil(totalSalariesCount / itemsPerPage),
        totalSalaries: totalSalariesCount,
        hasPrev: currentPage > 1,
        hasNext: currentPage < Math.ceil(totalSalariesCount / itemsPerPage)
    });
}

function renderSalariesTable(salaries) {
    const tbody = document.getElementById('salaryTableBody');
    if (!tbody) {
        console.error('Salary table body not found');
        return;
    }
    
    tbody.innerHTML = '';

    // If no salaries, show empty state
    if (salaries.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="no-data">
                    <div class="no-contacts-message">
                        <i class="fas fa-money-bill-wave"></i>
                        <h3>No Salary Records Found</h3>
                        <p>Get started by generating your first salary</p>
                        <button class="btn-primary" onclick="showSalaryGenerator()">
                            <i class="fas fa-plus"></i> Generate First Salary
                        </button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    // Calculate pagination indices for client-side pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, salaries.length);
    
    // Get only the salaries for the current page
    const salariesToRender = salaries.slice(startIndex, endIndex);

    // Render the paginated salaries
    salariesToRender.forEach((salary, index) => {
        const actualIndex = startIndex + index;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" value="${salary._id}" onchange="toggleSalarySelection()"></td>
            <td>${escapeHtml(salary.employeeId)}</td>
            <td class="contact-name-cell">
                <div class="contact-name">${escapeHtml(salary.employeeName)}</div>
            </td>
            <td>${escapeHtml(salary.title)}</td>
            <td><span class="month-badge">${escapeHtml(salary.month)}</span></td>
            <td>${escapeHtml(salary.year)}</td>
            <td class="currency-cell">${formatCurrency(salary.basicPay)}</td>
            <td class="currency-cell">${formatCurrency(salary.specialAllowance)}</td>
            <td class="currency-cell"><strong>${formatCurrency(salary.netPay)}</strong></td>
            <td>
                <div class="table-actions">
                    <button class="table-action-btn view" onclick="viewSalary('${salary._id}')" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="table-action-btn edit" onclick="editSalary('${salary._id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="table-action-btn delete" onclick="confirmDeleteSalary('${salary._id}', '${salary.employeeName}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
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
            populatePreviewModal(salary);
        } else {
            throw new Error(result.message || 'Failed to load salary');
        }
        
    } catch (error) {
        console.error('Error viewing salary:', error);
        showNotification('Failed to load salary: ' + error.message, 'error');
    }
}

function populatePreviewModal(salary) {
    try {
        // Calculate salary components
        const month = salary.month || 'March';
        const year = salary.year || 2024;
        
        // Format date for pay date
        const payDate = salary.payDate || new Date().toLocaleDateString('en-GB');
        
        // Update elements that exist in the HTML
        const previewMonth = document.getElementById('preview-month');
        const previewYear = document.getElementById('preview-year');
        const previewPayDate = document.getElementById('preview-pay-date');
        
        if (previewMonth) previewMonth.textContent = month;
        if (previewYear) previewYear.textContent = year;
        if (previewPayDate) previewPayDate.textContent = payDate;
        
        // Employee details - only update elements that exist
        const employeeName = document.getElementById('preview-employeeName');
        const employeeTitle = document.getElementById('preview-employeeTitle');
        const employeeId = document.getElementById('preview-employeeId');
        const employeeEmail = document.getElementById('preview-employeeEmail');
        const employeeAccount = document.getElementById('preview-employeeAccount');
        
        if (employeeName) employeeName.textContent = salary.employeeName || 'N/A';
        if (employeeTitle) employeeTitle.textContent = salary.title || 'N/A';
        if (employeeId) employeeId.textContent = salary.employeeId || 'N/A';
        if (employeeEmail) employeeEmail.textContent = salary.email || 'N/A';
        if (employeeAccount) employeeAccount.textContent = salary.accountNumber || 'N/A';
        
        // Salary details
        const workingDays = document.getElementById('preview-working-days');
        const lopDays = document.getElementById('preview-lop-days');
        const basicPay = document.getElementById('preview-basicPay');
        const specialAllowance = document.getElementById('preview-specialAllowance');
        const taxDeduction = document.getElementById('preview-taxDeduction');
        
        if (workingDays) workingDays.textContent = salary.workingDays || 0;
        if (lopDays) lopDays.textContent = salary.lopDays || 0;
        if (basicPay) basicPay.textContent = formatCurrency(salary.basicPay || 0);
        if (specialAllowance) specialAllowance.textContent = formatCurrency(salary.specialAllowance || 0);
        if (taxDeduction) taxDeduction.textContent = formatCurrency(salary.taxDeduction || 0);
        
        // Calculate net salary
        const netSalary = (salary.basicPay || 0) + (salary.specialAllowance || 0) - (salary.taxDeduction || 0);
        
        // Net Salary section
        const netSalaryElement = document.getElementById('preview-netSalary');
        const salaryInWords = document.getElementById('preview-salaryInWords');
        const footerMonth = document.getElementById('preview-footer-month');
        
        if (netSalaryElement) netSalaryElement.textContent = netSalary.toFixed(2);
        if (salaryInWords) salaryInWords.textContent = `Indian Rupee ${convertToWords(netSalary)} Only`;
        if (footerMonth) footerMonth.textContent = `${month} ${year}`;
        
        // Store current salary ID
        currentSalaryId = salary._id;
        
        // Show preview modal
        const modal = document.getElementById('salaryPreviewModal');
        modal.style.display = 'flex';
        modal.classList.add('show');
        
    } catch (error) {
        console.error('Error populating preview modal:', error);
        showNotification('Failed to load salary preview: ' + error.message, 'error');
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
            document.getElementById('salaryModalTitle').textContent = 'Edit Salary';
            
            // Show modal
            const modal = document.getElementById('salaryGeneratorModal');
            modal.style.display = 'flex';
            modal.classList.add('show');
            
            // Update preview
            updateSalaryPreview();
            
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
    
    document.getElementById('deleteSalaryName').textContent = `${employeeName}'s salary record`;
    document.getElementById('deleteModal').style.display = 'flex';
    document.getElementById('deleteModal').classList.add('show');
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
    document.getElementById('deleteModal').classList.remove('show');
    currentDeleteSalary = null;
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        modal.style.display = 'none';
        modal.classList.remove('show');
    });
    currentDeleteSalary = null;
    currentPreviewData = null;
}

function filterSalaries() {
    currentPage = 1;
    const filteredSalaries = filterAndSortSalaries(allSalaries);
    renderSalariesTable(filteredSalaries);
    updatePagination({
        currentPage: currentPage,
        totalPages: Math.ceil(filteredSalaries.length / itemsPerPage),
        totalSalaries: filteredSalaries.length,
        hasPrev: currentPage > 1,
        hasNext: currentPage < Math.ceil(filteredSalaries.length / itemsPerPage)
    });
}

function resetFilters() {
    document.getElementById('monthFilter').value = 'all';
    document.getElementById('yearFilter').value = 'all';
    document.getElementById('sortBy').value = 'created_desc';
    document.getElementById('searchInput').value = '';
    
    currentPage = 1;
    filterSalaries();
    
    showNotification('Filters reset', 'info');
}

function sortSalaries() {
    currentPage = 1;
    filterSalaries();
}

// Bulk Operations
function selectAllSalaries(checkbox) {
    const checkboxes = document.querySelectorAll('#salaryTableBody input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.checked = checkbox.checked;
    });
    toggleSalarySelection();
}

function toggleSalarySelection() {
    const selectedCheckboxes = document.querySelectorAll('#salaryTableBody input[type="checkbox"]:checked');
    const bulkActions = document.getElementById('bulkActions');
    const selectedCount = document.querySelector('.selected-count');
    
    if (selectedCheckboxes.length > 0 && bulkActions && selectedCount) {
        bulkActions.style.display = 'flex';
        selectedCount.textContent = `${selectedCheckboxes.length} salar${selectedCheckboxes.length > 1 ? 'ies' : 'y'} selected`;
    } else if (bulkActions) {
        bulkActions.style.display = 'none';
    }
}

function bulkPrintSalaries() {
    const selectedCheckboxes = document.querySelectorAll('#salaryTableBody input[type="checkbox"]:checked');
    if (selectedCheckboxes.length === 0) {
        showNotification('Please select salaries to print', 'warning');
        return;
    }
    showNotification(`Printing ${selectedCheckboxes.length} salaries...`, 'info');
}

function bulkExportSalaries() {
    const selectedCheckboxes = document.querySelectorAll('#salaryTableBody input[type="checkbox"]:checked');
    if (selectedCheckboxes.length === 0) {
        showNotification('Please select salaries to export', 'warning');
        return;
    }
    showNotification(`Exporting ${selectedCheckboxes.length} salaries...`, 'info');
}

function bulkDeleteSalaries() {
    const selectedCheckboxes = document.querySelectorAll('#salaryTableBody input[type="checkbox"]:checked');
    if (selectedCheckboxes.length === 0) {
        showNotification('Please select salaries to delete', 'warning');
        return;
    }
    
    if (confirm(`Are you sure you want to delete ${selectedCheckboxes.length} salar${selectedCheckboxes.length > 1 ? 'ies' : 'y'}?`)) {
        showNotification(`Deleting ${selectedCheckboxes.length} salaries...`, 'info');
        // Implement bulk delete logic here
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
    
    const totalPages = Math.ceil(paginationData.totalSalaries / itemsPerPage);
    const startIndex = ((currentPage - 1) * itemsPerPage) + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, paginationData.totalSalaries);
    
    startElement.textContent = startIndex;
    endElement.textContent = endIndex;
    totalElement.textContent = paginationData.totalSalaries;
    
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

function goToPage(page) {
    if (page < 1 || page > Math.ceil(totalSalariesCount / itemsPerPage)) {
        console.warn('Invalid page number:', page);
        return;
    }
    
    currentPage = page;
    const filteredSalaries = filterAndSortSalaries(allSalaries);
    renderSalariesTable(filteredSalaries);
    
    updatePagination({
        currentPage: currentPage,
        totalPages: Math.ceil(totalSalariesCount / itemsPerPage),
        totalSalaries: totalSalariesCount,
        hasPrev: currentPage > 1,
        hasNext: currentPage < Math.ceil(totalSalariesCount / itemsPerPage)
    });
}

function previousPage() {
    if (currentPage > 1) {
        goToPage(currentPage - 1);
    }
}

function nextPage() {
    if (currentPage < Math.ceil(totalSalariesCount / itemsPerPage)) {
        goToPage(currentPage + 1);
    }
}

function printSalary() {
    window.print();
}

function printAllSalaries() {
    showNotification('Print all feature coming soon', 'info');
}

function exportSalaries() {
    showNotification('Export feature coming soon', 'info');
}

function showLoading(show) {
    // You can implement a loading indicator if needed
    if (show) {
        console.log('⏳ Loading salaries...');
    } else {
        console.log('✅ Loading complete');
    }
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
        } else {
            sidebarToggleIcon.className = 'fas fa-chevron-left';
        }
    }
    
    // Update floating button icon
    if (floatingToggleIcon) {
        floatingToggleIcon.className = 'fas fa-chevron-right';
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

function getToken() {
    return localStorage.getItem('authToken') || '';
}

function getAvatarColor() {
    return 'linear-gradient(135deg, #00BCD4 0%, #1E88E5 100%)';
}

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

function confirmDelete() {
    if (!currentDeleteSalary) return;
    
    deleteSalary(currentDeleteSalary.id);
}

console.log('✅ Salary Management System fully initialized for new layout');