// Global variables
let currentDateRange = 'month';
let currentFilters = {};
let currentReportType = 'summary';
let savedReports = [];
let filterPresets = [];
let currentInsightId = null;
let currentDeleteItem = null;
let currentSortColumn = null;
let currentSortDirection = 'asc';
let currentPage = 1;
let itemsPerPage = 10;
let totalRecords = 150;
let charts = {};
let sampleData = [];
let insights = [];

// Sample data
const generateSampleData = () => {
    const contacts = ['John Smith', 'Sarah Johnson', 'Mike Chen', 'Lisa Brown', 'David Wilson', 'Emma Davis'];
    const companies = ['TechCorp', 'InnovateTech', 'GrowthCorp', 'FutureTech', 'DataSoft', 'CloudNet'];
    const reps = ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Brown'];
    const stages = ['Lead', 'Prospect', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
    const sources = ['Website', 'LinkedIn', 'Email Campaign', 'Cold Call', 'Referral', 'Trade Show'];
    
    sampleData = [];
    for (let i = 0; i < 150; i++) {
        const createdDate = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
        const closeDate = new Date(createdDate);
        closeDate.setDate(closeDate.getDate() + Math.floor(Math.random() * 90));
        
        sampleData.push({
            id: i + 1,
            contactName: contacts[Math.floor(Math.random() * contacts.length)],
            company: companies[Math.floor(Math.random() * companies.length)],
            assignedRep: reps[Math.floor(Math.random() * reps.length)],
            dealStage: stages[Math.floor(Math.random() * stages.length)],
            revenue: Math.floor(Math.random() * 50000) + 1000,
            closeDate: closeDate.toISOString().split('T')[0],
            source: sources[Math.floor(Math.random() * sources.length)],
            createdDate: createdDate.toISOString().split('T')[0],
            status: Math.random() > 0.2 ? 'Active' : 'Inactive'
        });
    }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeReports();
    setupEventListeners();
    loadSampleData();
    initializeCharts();
    renderDataTable();
});

function initializeReports() {
    console.log('Reports System initialized');
    loadSavedState();
}

function setupEventListeners() {
    // Close modals when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-overlay')) {
            closeAllModals();
        }
    });

    // Escape key to close modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
            toggleSidebar(false);
        }
    });

    // Real-time search
    const searchInput = document.querySelector('.search-input');
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performSearch(this.value);
        }, 300);
    });

    // Window resize handler
    window.addEventListener('resize', function() {
        Object.values(charts).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    });
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

// Data Loading
function loadSampleData() {
    generateSampleData();
    
    // Load saved reports from localStorage
    const saved = localStorage.getItem('savedReports');
    if (saved) {
        savedReports = JSON.parse(saved);
    } else {
        savedReports = [
            { id: 1, name: 'Monthly Sales Performance', filters: { dateRange: 'month' }, created: new Date().toISOString() },
            { id: 2, name: 'Lead Source Analysis', filters: { reportType: 'detailed' }, created: new Date().toISOString() },
            { id: 3, name: 'Conversion Funnel', filters: { reportType: 'funnel' }, created: new Date().toISOString() }
        ];
        saveToLocalStorage();
    }
    
    // Load insights
    const savedInsights = localStorage.getItem('reportInsights');
    if (savedInsights) {
        insights = JSON.parse(savedInsights);
    } else {
        insights = [
            {
                id: 1,
                type: 'analyst',
                author: 'John Doe',
                content: 'Q4 performance shows strong growth in enterprise segment. Conversion rates in North America region are 15% above target, suggesting effective sales strategies.',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 2,
                type: 'analyst',
                author: 'Sarah Johnson',
                content: 'Lead quality from LinkedIn campaigns has improved significantly. Cost per acquisition decreased by 22% while conversion rate increased by 8%.',
                timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
            }
        ];
        saveInsightsToLocalStorage();
    }
    
    updateInsightsPanels();
}

function loadSavedState() {
    const savedState = localStorage.getItem('reportState');
    if (savedState) {
        const state = JSON.parse(savedState);
        currentDateRange = state.dateRange || 'month';
        currentFilters = state.filters || {};
        currentReportType = state.reportType || 'summary';
        
        // Apply saved state to UI
        selectDateRange(currentDateRange);
        Object.keys(currentFilters).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                element.value = currentFilters[key];
            }
        });
        
        const reportTypeElement = document.getElementById('reportTypeFilter');
        if (reportTypeElement) {
            reportTypeElement.value = currentReportType;
        }
    }
}

function saveToLocalStorage() {
    localStorage.setItem('savedReports', JSON.stringify(savedReports));
    localStorage.setItem('reportState', JSON.stringify({
        dateRange: currentDateRange,
        filters: currentFilters,
        reportType: currentReportType
    }));
}

function saveInsightsToLocalStorage() {
    localStorage.setItem('reportInsights', JSON.stringify(insights));
}

// Date Range Selection
function selectDateRange(range) {
    currentDateRange = range;
    
    // Update tab appearance
    document.querySelectorAll('.date-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-range="${range}"]`).classList.add('active');
    
    // Show/hide custom date inputs
    const customInputs = document.getElementById('customDateInputs');
    if (range === 'custom') {
        customInputs.style.display = 'flex';
        setDefaultCustomDates();
    } else {
        customInputs.style.display = 'none';
    }
    
    saveToLocalStorage();
}

function setDefaultCustomDates() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
    document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
}

// Filter Management
function applyFilters() {
    // Collect filter values
    currentFilters = {
        owner: document.getElementById('ownerFilter').value,
        region: document.getElementById('regionFilter').value,
        product: document.getElementById('productFilter').value,
        stage: document.getElementById('stageFilter').value,
        industry: document.getElementById('industryFilter').value
    };
    
    currentReportType = document.getElementById('reportTypeFilter').value;
    
    // Apply date range
    if (currentDateRange === 'custom') {
        currentFilters.startDate = document.getElementById('startDate').value;
        currentFilters.endDate = document.getElementById('endDate').value;
    } else {
        currentFilters.dateRange = currentDateRange;
    }
    
    // Update data and visualizations
    updateKPIs();
    updateCharts();
    renderDataTable();
    updateComparisons();
    
    showNotification('Filters applied successfully', 'success');
    saveToLocalStorage();
}

function resetFilters() {
    // Reset all filter inputs
    document.getElementById('ownerFilter').value = '';
    document.getElementById('regionFilter').value = '';
    document.getElementById('productFilter').value = '';
    document.getElementById('stageFilter').value = '';
    document.getElementById('industryFilter').value = '';
    document.getElementById('reportTypeFilter').value = 'summary';
    
    // Reset date range
    selectDateRange('month');
    
    // Clear current filters
    currentFilters = {};
    currentReportType = 'summary';
    
    // Update data and visualizations
    updateKPIs();
    updateCharts();
    renderDataTable();
    updateComparisons();
    
    showNotification('Filters reset successfully', 'info');
    saveToLocalStorage();
}

function changeReportType(type) {
    currentReportType = type;
    
    // Update visualizations based on report type
    switch (type) {
        case 'summary':
            showSummaryView();
            break;
        case 'detailed':
            showDetailedView();
            break;
        case 'comparison':
            showComparisonView();
            break;
        case 'forecast':
            showForecastView();
            break;
    }
    
    updateCharts();
    renderDataTable();
    showNotification(`Switched to ${type} view`, 'info');
}

// Report Views
function showSummaryView() {
    document.querySelector('.kpi-section').style.display = 'grid';
    document.querySelector('.visualization-section').style.display = 'block';
    document.querySelector('.comparison-section').style.display = 'block';
}

function showDetailedView() {
    document.querySelector('.kpi-section').style.display = 'grid';
    document.querySelector('.visualization-section').style.display = 'block';
    document.querySelector('.data-table-section').style.display = 'block';
}

function showComparisonView() {
    document.querySelector('.comparison-section').style.display = 'block';
    document.querySelector('.visualization-section').style.display = 'block';
}

function showForecastView() {
    document.querySelector('.kpi-section').style.display = 'grid';
    document.querySelector('.comparison-section').style.display = 'block';
}

// KPI Updates
function updateKPIs() {
    // Filter data based on current filters
    const filteredData = getFilteredData();
    
    // Calculate KPIs
    const totalLeads = filteredData.filter(item => item.dealStage === 'Lead').length;
    const dealsCreated = filteredData.length;
    const dealsClosed = filteredData.filter(item => item.dealStage === 'Closed Won').length;
    const totalRevenue = filteredData.reduce((sum, item) => sum + item.revenue, 0);
    const conversionRate = dealsCreated > 0 ? (dealsClosed / dealsCreated * 100).toFixed(1) : 0;
    const avgDealValue = dealsCreated > 0 ? Math.round(totalRevenue / dealsCreated) : 0;
    const winRate = filteredData.filter(item => ['Closed Won', 'Closed Lost'].includes(item.dealStage)).length > 0 
        ? (dealsClosed / filteredData.filter(item => ['Closed Won', 'Closed Lost'].includes(item.dealStage)).length * 100).toFixed(1) 
        : 0;
    const pipelineValue = filteredData.filter(item => !['Closed Won', 'Closed Lost'].includes(item.dealStage))
        .reduce((sum, item) => sum + item.revenue, 0);
    
    // Update KPI displays with animation
    animateValue('totalLeads', parseInt(document.getElementById('totalLeads').textContent.replace(/,/g, '')), totalLeads);
    animateValue('dealsCreated', parseInt(document.getElementById('dealsCreated').textContent.replace(/,/g, '')), dealsCreated);
    animateValue('dealsClosed', parseInt(document.getElementById('dealsClosed').textContent.replace(/,/g, '')), dealsClosed);
    animateValue('conversionRate', parseFloat(document.getElementById('conversionRate').textContent.replace('%', '')), conversionRate, '%');
    animateValue('totalRevenue', parseInt(document.getElementById('totalRevenue').textContent.replace(/[$,]/g, '')), totalRevenue, '$');
    animateValue('avgDealValue', parseInt(document.getElementById('avgDealValue').textContent.replace(/[$,]/g, '')), avgDealValue, '$');
    animateValue('winRate', parseFloat(document.getElementById('winRate').textContent.replace('%', '')), winRate, '%');
    animateValue('pipelineValue', parseFloat(document.getElementById('pipelineValue').textContent.replace(/[$M,]/g, '')) * 1000000, pipelineValue, '$', true);
    
    // Update KPI mini charts
    updateKPICharts(filteredData);
}

function animateValue(elementId, start, end, suffix = '', isCurrency = false, isMillions = false) {
    const element = document.getElementById(elementId);
    const duration = 1000;
    const steps = 60;
    const stepValue = (end - start) / steps;
    let current = start;
    let step = 0;
    
    const timer = setInterval(() => {
        current += stepValue;
        step++;
        
        let displayValue;
        if (isCurrency) {
            if (isMillions) {
                displayValue = `$${(current / 1000000).toFixed(1)}M`;
            } else {
                displayValue = `$${Math.round(current).toLocaleString()}`;
            }
        } else if (suffix === '%') {
            displayValue = `${current.toFixed(1)}%`;
        } else {
            displayValue = Math.round(current).toLocaleString();
        }
        
        element.textContent = displayValue + (suffix && !isCurrency && suffix !== '%' ? suffix : '');
        
        if (step >= steps) {
            clearInterval(timer);
            // Final value
            if (isCurrency) {
                if (isMillions) {
                    element.textContent = `$${(end / 1000000).toFixed(1)}M`;
                } else {
                    element.textContent = `$${end.toLocaleString()}`;
                }
            } else if (suffix === '%') {
                element.textContent = `${end}%`;
            } else {
                element.textContent = end.toLocaleString() + (suffix && !isCurrency && suffix !== '%' ? suffix : '');
            }
        }
    }, duration / steps);
}

function getFilteredData() {
    let filtered = [...sampleData];
    
    // Apply filters
    if (currentFilters.owner) {
        filtered = filtered.filter(item => item.assignedRep === getRepName(currentFilters.owner));
    }
    
    if (currentFilters.stage) {
        filtered = filtered.filter(item => item.dealStage.toLowerCase() === currentFilters.stage.replace('-', ' '));
    }
    
    if (currentFilters.dateRange) {
        const now = new Date();
        let startDate;
        
        switch (currentFilters.dateRange) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
        }
        
        if (startDate) {
            filtered = filtered.filter(item => new Date(item.createdDate) >= startDate);
        }
    }
    
    if (currentFilters.startDate && currentFilters.endDate) {
        const start = new Date(currentFilters.startDate);
        const end = new Date(currentFilters.endDate);
        filtered = filtered.filter(item => {
            const itemDate = new Date(item.createdDate);
            return itemDate >= start && itemDate <= end;
        });
    }
    
    return filtered;
}

function getRepName(value) {
    const repMap = {
        'john-smith': 'John Doe',
        'sarah-johnson': 'Jane Smith',
        'mike-chen': 'Bob Johnson',
        'lisa-brown': 'Alice Brown'
    };
    return repMap[value] || value;
}

// Chart Management
function initializeCharts() {
    initializeRevenueChart();
    initializeLeadSourcesChart();
    initializeConversionFunnelChart();
    initializeSalesPerformanceChart();
    initializeForecastChart();
    initializeKPICharts();
}

function initializeRevenueChart() {
    const ctx = document.getElementById('revenueMonthlyChart').getContext('2d');
    
    const data = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [{
            label: 'Revenue',
            data: [65000, 78000, 82000, 91000, 75000, 88000, 95000, 102000, 89000, 96000, 108000, 115000],
            backgroundColor: 'rgba(102, 126, 234, 0.2)',
            borderColor: 'rgba(102, 126, 234, 1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
        }]
    };
    
    const config = {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + (value / 1000) + 'K';
                        }
                    }
                }
            },
            elements: {
                point: {
                    radius: 6,
                    hoverRadius: 8
                }
            }
        }
    };
    
    charts.revenueMonthly = new Chart(ctx, config);
}

function initializeLeadSourcesChart() {
    const ctx = document.getElementById('leadSourcesChart').getContext('2d');
    
    const data = {
        labels: ['Website', 'LinkedIn', 'Email Campaign', 'Cold Call', 'Referral', 'Trade Show'],
        datasets: [{
            data: [35, 25, 20, 10, 8, 2],
            backgroundColor: [
                'rgba(102, 126, 234, 0.8)',
                'rgba(240, 147, 251, 0.8)',
                'rgba(40, 167, 69, 0.8)',
                'rgba(255, 193, 7, 0.8)',
                'rgba(23, 162, 184, 0.8)',
                'rgba(220, 53, 69, 0.8)'
            ],
            borderWidth: 2,
            borderColor: '#fff'
        }]
    };
    
    const config = {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                }
            }
        }
    };
    
    charts.leadSources = new Chart(ctx, config);
}

function initializeConversionFunnelChart() {
    const ctx = document.getElementById('conversionFunnelChart').getContext('2d');
    
    const data = {
        labels: ['Leads', 'Prospects', 'Proposals', 'Negotiations', 'Closed Won'],
        datasets: [{
            label: 'Conversion Funnel',
            data: [1247, 523, 287, 156, 89],
            backgroundColor: [
                'rgba(102, 126, 234, 0.9)',
                'rgba(102, 126, 234, 0.7)',
                'rgba(102, 126, 234, 0.5)',
                'rgba(102, 126, 234, 0.3)',
                'rgba(40, 167, 69, 0.8)'
            ],
            borderColor: 'rgba(102, 126, 234, 1)',
            borderWidth: 2
        }]
    };
    
    const config = {
        type: 'bar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    };
    
    charts.conversionFunnel = new Chart(ctx, config);
}

function initializeSalesPerformanceChart() {
    const ctx = document.getElementById('salesPerformanceChart').getContext('2d');
    
    const data = {
        labels: ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Brown'],
        datasets: [{
            label: 'Revenue',
            data: [125400, 98750, 87320, 76250],
            backgroundColor: 'rgba(40, 167, 69, 0.8)',
            borderColor: 'rgba(40, 167, 69, 1)',
            borderWidth: 2
        }]
    };
    
    const config = {
        type: 'bar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + (value / 1000) + 'K';
                        }
                    }
                }
            }
        }
    };
    
    charts.salesPerformance = new Chart(ctx, config);
}

function initializeForecastChart() {
    const ctx = document.getElementById('forecastChart').getContext('2d');
    
    const data = {
        labels: ['Current', 'Next Month', 'Month +2', 'Month +3'],
        datasets: [
            {
                label: 'Actual',
                data: [428500, null, null, null],
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 2
            },
            {
                label: 'Forecast',
                data: [null, 485600, 521800, 558200],
                backgroundColor: 'rgba(255, 193, 7, 0.8)',
                borderColor: 'rgba(255, 193, 7, 1)',
                borderWidth: 2,
                borderDash: [5, 5]
            }
        ]
    };
    
    const config = {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + (value / 1000) + 'K';
                        }
                    }
                }
            }
        }
    };
    
    charts.forecast = new Chart(ctx, config);
}

function initializeKPICharts() {
    // Initialize mini charts for KPI cards
    const kpiChartIds = ['leadsChart', 'dealsChart', 'closedDealsChart', 'conversionChart', 'revenueChart', 'avgDealChart', 'winRateChart', 'pipelineChart'];
    
    kpiChartIds.forEach(chartId => {
        const ctx = document.getElementById(chartId);
        if (ctx) {
            const chart = new Chart(ctx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: ['', '', '', '', ''],
                    datasets: [{
                        data: [65, 78, 82, 91, 75],
                        borderColor: 'rgba(102, 126, 234, 1)',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: { display: false },
                        y: { display: false }
                    },
                    elements: {
                        point: { radius: 0 }
                    }
                }
            });
            charts[chartId] = chart;
        }
    });
}

function updateKPICharts(filteredData) {
    // Update mini charts with actual data trends
    // This is a simplified version - in a real app, you'd calculate actual trends
    const kpiChartIds = ['leadsChart', 'dealsChart', 'closedDealsChart', 'conversionChart', 'revenueChart', 'avgDealChart', 'winRateChart', 'pipelineChart'];
    
    kpiChartIds.forEach(chartId => {
        const chart = charts[chartId];
        if (chart) {
            // Generate trend data based on filtered data
            const trendData = generateTrendData(filteredData, chartId);
            chart.data.datasets[0].data = trendData;
            chart.update('none');
        }
    });
}

function generateTrendData(data, chartType) {
    // Simplified trend generation - in a real app, this would be based on time series data
    const baseValue = Math.floor(Math.random() * 50) + 50;
    return Array.from({ length: 5 }, (_, i) => {
        const variation = (Math.random() - 0.5) * 20;
        return Math.max(10, baseValue + variation + (i * 5));
    });
}

function updateCharts() {
    const filteredData = getFilteredData();
    
    // Update all charts with filtered data
    Object.values(charts).forEach(chart => {
        if (chart && typeof chart.update === 'function') {
            chart.update();
        }
    });
    
    updateKPICharts(filteredData);
}

function changeChartType(type) {
    const chartElement = document.getElementById('revenueMonthlyChart');
    const chart = charts.revenueMonthly;
    
    if (chart) {
        chart.config.type = type;
        chart.update();
        showNotification(`Chart type changed to ${type}`, 'info');
    }
}

function toggleFullscreenChart() {
    const chartContainer = document.querySelector('.chart-item.large');
    
    if (chartContainer.classList.contains('chart-fullscreen')) {
        // Exit fullscreen
        chartContainer.classList.remove('chart-fullscreen');
        document.body.style.overflow = '';
    } else {
        // Enter fullscreen
        chartContainer.classList.add('chart-fullscreen');
        document.body.style.overflow = 'hidden';
        
        // Add close button if not exists
        if (!chartContainer.querySelector('.chart-fullscreen-close')) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'chart-fullscreen-close';
            closeBtn.innerHTML = '<i class="fas fa-times"></i> Exit Fullscreen';
            closeBtn.onclick = toggleFullscreenChart;
            chartContainer.insertBefore(closeBtn, chartContainer.firstChild);
        }
    }
    
    // Resize chart after transition
    setTimeout(() => {
        if (charts.revenueMonthly) {
            charts.revenueMonthly.resize();
        }
    }, 300);
}

// Data Table Management
function renderDataTable() {
    const tbody = document.getElementById('dataTableBody');
    if (!tbody) return;
    
    const filteredData = getFilteredData();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredData.slice(startIndex, endIndex);
    
    tbody.innerHTML = '';
    
    pageData.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.contactName}</td>
            <td>${item.company}</td>
            <td>${item.assignedRep}</td>
            <td><span class="status-badge ${item.dealStage.toLowerCase().replace(/\s+/g, '-')}">${item.dealStage}</span></td>
            <td>$${item.revenue.toLocaleString()}</td>
            <td>${item.closeDate}</td>
            <td>${item.source}</td>
            <td>${item.createdDate}</td>
            <td>
                <button class="chart-action-btn" onclick="editTableRow(${item.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="chart-action-btn" onclick="deleteTableRow(${item.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    updatePagination(filteredData.length);
}

function searchTable(query) {
    if (!query || query.length < 2) {
        renderDataTable();
        return;
    }
    
    const filteredData = sampleData.filter(item => {
        const searchText = `${item.contactName} ${item.company} ${item.assignedRep} ${item.dealStage} ${item.source}`.toLowerCase();
        return searchText.includes(query.toLowerCase());
    });
    
    const tbody = document.getElementById('dataTableBody');
    tbody.innerHTML = '';
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredData.slice(startIndex, endIndex);
    
    pageData.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.contactName}</td>
            <td>${item.company}</td>
            <td>${item.assignedRep}</td>
            <td><span class="status-badge ${item.dealStage.toLowerCase().replace(/\s+/g, '-')}">${item.dealStage}</span></td>
            <td>$${item.revenue.toLocaleString()}</td>
            <td>${item.closeDate}</td>
            <td>${item.source}</td>
            <td>${item.createdDate}</td>
            <td>
                <button class="chart-action-btn" onclick="editTableRow(${item.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="chart-action-btn" onclick="deleteTableRow(${item.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    updatePagination(filteredData.length);
}

function sortTable(columnIndex) {
    const columns = ['contactName', 'company', 'assignedRep', 'dealStage', 'revenue', 'closeDate', 'source', 'createdDate'];
    const column = columns[columnIndex];
    
    if (currentSortColumn === column) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortColumn = column;
        currentSortDirection = 'asc';
    }
    
    sampleData.sort((a, b) => {
        let aValue = a[column];
        let bValue = b[column];
        
        // Handle different data types
        if (column === 'revenue') {
            aValue = parseInt(aValue);
            bValue = parseInt(bValue);
        } else if (column === 'closeDate' || column === 'createdDate') {
            aValue = new Date(aValue);
            bValue = new Date(bValue);
        }
        
        if (currentSortDirection === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });
    
    renderDataTable();
    
    // Update sort indicators
    document.querySelectorAll('.data-table th i').forEach(icon => {
        icon.className = 'fas fa-sort';
    });
    
    const currentHeader = document.querySelectorAll('.data-table th')[columnIndex];
    const icon = currentHeader.querySelector('i');
    icon.className = currentSortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
}

function updatePagination(totalItems) {
    totalRecords = totalItems;
    const totalPages = Math.ceil(totalRecords / itemsPerPage);
    
    // Update pagination info
    const startRecord = (currentPage - 1) * itemsPerPage + 1;
    const endRecord = Math.min(currentPage * itemsPerPage, totalRecords);
    
    document.getElementById('showingStart').textContent = startRecord;
    document.getElementById('showingEnd').textContent = endRecord;
    document.getElementById('totalRecords').textContent = totalRecords;
    
    // Update pagination controls
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
    
    // Generate page numbers
    const pageNumbers = document.getElementById('pageNumbers');
    pageNumbers.innerHTML = '';
    
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-number ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.onclick = () => goToPage(i);
        pageNumbers.appendChild(pageBtn);
    }
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        renderDataTable();
    }
}

function nextPage() {
    const totalPages = Math.ceil(totalRecords / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderDataTable();
    }
}

function goToPage(page) {
    currentPage = page;
    renderDataTable();
}

function editTableRow(id) {
    const item = sampleData.find(row => row.id === id);
    if (!item) return;
    
    showNotification(`Editing record for ${item.contactName}`, 'info');
    console.log('Edit row:', item);
    // In a real application, this would open an edit modal
}

function deleteTableRow(id) {
    const item = sampleData.find(row => row.id === id);
    if (!item) return;
    
    currentDeleteItem = {
        type: 'record',
        id: id,
        name: `${item.contactName} - ${item.company}`
    };
    
    document.getElementById('deleteType').textContent = 'record';
    document.getElementById('deleteItemName').textContent = currentDeleteItem.name;
    document.getElementById('deleteModal').style.display = 'flex';
}

// Export Functions
function exportToPDF() {
    showNotification('Generating PDF report...', 'info');
    setTimeout(() => {
        showNotification('PDF report generated successfully', 'success');
    }, 2000);
}

function exportToExcel() {
    const filteredData = getFilteredData();
    const headers = ['Contact Name', 'Company', 'Assigned Rep', 'Deal Stage', 'Revenue', 'Close Date', 'Source', 'Created Date', 'Status'];
    const csvContent = generateCSV(filteredData, headers);
    downloadFile(csvContent, 'sales-report.csv', 'text/csv');
    showNotification('Excel report downloaded', 'success');
}

function exportToCSV() {
    const filteredData = getFilteredData();
    const headers = ['Contact Name', 'Company', 'Assigned Rep', 'Deal Stage', 'Revenue', 'Close Date', 'Source', 'Created Date', 'Status'];
    const csvContent = generateCSV(filteredData, headers);
    downloadFile(csvContent, 'sales-data.csv', 'text/csv');
    showNotification('CSV file downloaded', 'success');
}

function exportToImage() {
    const charts = document.querySelectorAll('canvas');
    let downloadCount = 0;
    
    charts.forEach((canvas, index) => {
        const link = document.createElement('a');
        link.download = `chart-${index + 1}.png`;
        link.href = canvas.toDataURL();
        link.click();
        downloadCount++;
    });
    
    showNotification(`${downloadCount} chart images downloaded`, 'success');
}

function generateCSV(data, headers) {
    const rows = data.map(item => [
        item.contactName,
        item.company,
        item.assignedRep,
        item.dealStage,
        item.revenue,
        item.closeDate,
        item.source,
        item.createdDate,
        item.status
    ]);
    
    return [headers, ...rows].map(row => 
        row.map(field => `"${field}"`).join(',')
    ).join('\n');
}

function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

function emailReport() {
    document.getElementById('emailReportModal').style.display = 'flex';
    document.getElementById('emailReportModal').classList.add('show');
}

function scheduleReport() {
    document.getElementById('scheduleReportModal').style.display = 'flex';
    document.getElementById('scheduleReportModal').classList.add('show');
}

function exportTableData() {
    exportToCSV();
}

// Comparison Updates
function updateComparisons() {
    updatePeriodComparison('month');
    updateTopPerformers('revenue');
    updateForecast('month');
}

function updatePeriodComparison(period) {
    // Simulate period comparison data
    const comparisons = {
        month: {
            revenue: { current: 428500, previous: 327200, change: 31 },
            deals: { current: 67, previous: 54, change: 24 },
            conversion: { current: 24.8, previous: 21.6, change: 3.2 }
        }
    };
    
    const data = comparisons[period];
    if (data) {
        // Update comparison displays
        const comparisonItems = document.querySelectorAll('.comparison-item');
        comparisonItems.forEach((item, index) => {
            const values = Object.values(data)[index];
            if (values) {
                const currentValue = item.querySelector('.current-value');
                const previousValue = item.querySelector('.previous-value');
                const changeIndicator = item.querySelector('.change-indicator');
                
                if (index === 0) { // Revenue
                    currentValue.textContent = `$${values.current.toLocaleString()}`;
                    previousValue.textContent = `$${values.previous.toLocaleString()}`;
                } else {
                    currentValue.textContent = values.current + (index === 2 ? '%' : '');
                    previousValue.textContent = values.previous + (index === 2 ? '%' : '');
                }
                
                changeIndicator.textContent = `+${values.change}%`;
                changeIndicator.className = 'change-indicator positive';
            }
        });
    }
}

function updateTopPerformers(metric) {
    // This would typically fetch real performance data
    const performers = [
        { name: 'John Smith', value: 125400 },
        { name: 'Sarah Johnson', value: 98750 },
        { name: 'Mike Chen', value: 87320 }
    ];
    
    const performersList = document.querySelector('.top-performers-list');
    performersList.innerHTML = '';
    
    performers.forEach((performer, index) => {
        const item = document.createElement('div');
        item.className = 'performer-item';
        
        const badgeClass = index === 0 ? 'gold' : index === 1 ? 'silver' : 'bronze';
        const badgeIcon = index === 0 ? 'fa-trophy' : index === 1 ? 'fa-medal' : 'fa-award';
        
        item.innerHTML = `
            <div class="performer-rank">${index + 1}</div>
            <div class="performer-info">
                <span class="performer-name">${performer.name}</span>
                <span class="performer-value">$${performer.value.toLocaleString()}</span>
            </div>
            <div class="performer-badge ${badgeClass}">
                <i class="fas ${badgeIcon}"></i>
            </div>
        `;
        
        performersList.appendChild(item);
    });
}

function updateForecast(period) {
    // Update forecast chart with new data
    if (charts.forecast) {
        // This would typically calculate forecast based on current data
        const forecastData = [null, 485600, 521800, 558200];
        charts.forecast.data.datasets[1].data = forecastData;
        charts.forecast.update();
    }
}

// Insights Management
function switchInsightTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.insight-tab').forEach(t => {
        t.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    
    // Update content
    document.querySelectorAll('.insight-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    document.getElementById(`${tab}Pane`).classList.add('active');
}

function addInsight() {
    currentInsightId = null;
    document.getElementById('insightModalTitle').textContent = 'Add Analyst Comment';
    document.getElementById('insightType').value = 'observation';
    document.getElementById('insightContent').value = '';
    document.getElementById('shareInsight').checked = false;
    document.getElementById('addInsightModal').style.display = 'flex';
    document.getElementById('addInsightModal').classList.add('show');
    document.getElementById('insightContent').focus();
}

function editInsight(id) {
    const insight = insights.find(i => i.id === id);
    if (!insight) return;
    
    currentInsightId = id;
    document.getElementById('insightModalTitle').textContent = 'Edit Analyst Comment';
    document.getElementById('insightType').value = insight.type || 'observation';
    document.getElementById('insightContent').value = insight.content;
    document.getElementById('shareInsight').checked = false;
    document.getElementById('addInsightModal').style.display = 'flex';
    document.getElementById('addInsightModal').classList.add('show');
    document.getElementById('insightContent').focus();
}

function deleteInsight(id) {
    const insight = insights.find(i => i.id === id);
    if (!insight) return;
    
    currentDeleteItem = {
        type: 'insight',
        id: id,
        name: insight.content.substring(0, 50) + (insight.content.length > 50 ? '...' : '')
    };
    
    document.getElementById('deleteType').textContent = 'insight';
    document.getElementById('deleteItemName').textContent = currentDeleteItem.name;
    document.getElementById('deleteModal').style.display = 'flex';
}

function saveInsight() {
    const type = document.getElementById('insightType').value;
    const content = document.getElementById('insightContent').value.trim();
    const share = document.getElementById('shareInsight').checked;
    
    if (!content) {
        showNotification('Please enter insight content', 'error');
        return;
    }
    
    if (currentInsightId) {
        // Edit existing insight
        const insight = insights.find(i => i.id === currentInsightId);
        if (insight) {
            insight.content = content;
            insight.type = type;
            insight.timestamp = new Date().toISOString();
        }
        showNotification('Insight updated successfully', 'success');
    } else {
        // Add new insight
        const newInsight = {
            id: Date.now(),
            type: 'analyst',
            author: 'John Doe',
            content: content,
            timestamp: new Date().toISOString()
        };
        insights.unshift(newInsight);
        showNotification('Insight added successfully', 'success');
    }
    
    if (share) {
        showNotification('Team members have been notified', 'info');
    }
    
    saveInsightsToLocalStorage();
    updateInsightsPanels();
    closeInsightModal();
}

function updateInsightsPanels() {
    const analystPane = document.getElementById('analystComments');
    if (!analystPane) return;
    
    analystPane.innerHTML = '';
    
    insights.forEach(insight => {
        const timeAgo = getTimeAgo(new Date(insight.timestamp));
        
        const item = document.createElement('div');
        item.className = 'insight-item';
        item.dataset.id = insight.id;
        
        item.innerHTML = `
            <div class="insight-header">
                <div class="insight-author">
                    <img src="https://via.placeholder.com/32x32/667eea/ffffff?text=${insight.author.split(' ').map(n => n[0]).join('')}" alt="${insight.author}" class="author-avatar">
                    <div class="author-info">
                        <strong>${insight.author}</strong>
                        <span class="insight-time">${timeAgo}</span>
                    </div>
                </div>
                <div class="insight-actions">
                    <button class="insight-action-btn" onclick="editInsight(${insight.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="insight-action-btn" onclick="deleteInsight(${insight.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="insight-content">
                <p>${insight.content}</p>
            </div>
        `;
        
        analystPane.appendChild(item);
    });
}

function getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return date.toLocaleDateString();
}

// Filter Presets
function saveFilterPreset() {
    document.getElementById('savePresetModal').style.display = 'flex';
    document.getElementById('savePresetModal').classList.add('show');
    document.getElementById('presetName').focus();
}

function saveFilterPresetAction() {
    const name = document.getElementById('presetName').value.trim();
    const description = document.getElementById('presetDescription').value.trim();
    
    if (!name) {
        showNotification('Please enter a preset name', 'error');
        return;
    }
    
    const preset = {
        id: Date.now(),
        name: name,
        description: description,
        filters: { ...currentFilters },
        dateRange: currentDateRange,
        reportType: currentReportType,
        created: new Date().toISOString()
    };
    
    filterPresets.push(preset);
    localStorage.setItem('filterPresets', JSON.stringify(filterPresets));
    
    // Add to sidebar
    const presetsContainer = document.getElementById('favoriteFiltersList');
    const presetElement = document.createElement('div');
    presetElement.className = 'filter-preset';
    presetElement.onclick = () => applyFilterPreset(preset.id);
    presetElement.innerHTML = `
        <i class="fas fa-filter"></i>
        <span>${name}</span>
    `;
    presetsContainer.appendChild(presetElement);
    
    showNotification('Filter preset saved successfully', 'success');
    closeSavePresetModal();
}

function applyFilterPreset(presetId) {
    const preset = filterPresets.find(p => p.id === presetId);
    if (!preset) {
        // Handle predefined presets
        if (presetId === 'q4-2024') {
            selectDateRange('custom');
            document.getElementById('startDate').value = '2024-10-01';
            document.getElementById('endDate').value = '2024-12-31';
            document.getElementById('stageFilter').value = 'closed-won';
        } else if (presetId === 'high-value-deals') {
            document.getElementById('stageFilter').value = 'negotiation';
        }
        
        applyFilters();
        showNotification(`Applied ${presetId} filter preset`, 'success');
        return;
    }
    
    // Apply saved preset
    currentFilters = { ...preset.filters };
    currentDateRange = preset.dateRange;
    currentReportType = preset.reportType;
    
    // Update UI
    selectDateRange(currentDateRange);
    Object.keys(currentFilters).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            element.value = currentFilters[key];
        }
    });
    
    document.getElementById('reportTypeFilter').value = currentReportType;
    
    applyFilters();
    showNotification(`Applied "${preset.name}" filter preset`, 'success');
}

// Saved Reports Management
function loadSavedReport(id) {
    const report = savedReports.find(r => r.id === id);
    if (!report) return;
    
    // Apply report filters
    if (report.filters) {
        currentFilters = { ...report.filters };
        currentDateRange = report.filters.dateRange || 'month';
        
        // Update UI
        selectDateRange(currentDateRange);
        Object.keys(report.filters).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                element.value = report.filters[key];
            }
        });
    }
    
    // Update report title
    document.getElementById('reportTitle').textContent = report.name;
    
    applyFilters();
    showNotification(`Loaded "${report.name}" report`, 'success');
}

function deleteSavedReport(id, event) {
    event.stopPropagation();
    
    const report = savedReports.find(r => r.id === id);
    if (!report) return;
    
    currentDeleteItem = {
        type: 'saved-report',
        id: id,
        name: report.name
    };
    
    document.getElementById('deleteType').textContent = 'saved report';
    document.getElementById('deleteItemName').textContent = report.name;
    document.getElementById('deleteModal').style.display = 'flex';
}

// Sidebar Management
function toggleSidebar(force = null) {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    
    if (force !== null) {
        if (force) {
            sidebar.classList.add('open');
            mainContent.classList.add('sidebar-open');
        } else {
            sidebar.classList.remove('open');
            mainContent.classList.remove('sidebar-open');
        }
    } else {
        sidebar.classList.toggle('open');
        mainContent.classList.toggle('sidebar-open');
    }
}

// Title Editing
function editReportTitle() {
    const titleElement = document.getElementById('reportTitle');
    const currentTitle = titleElement.textContent;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentTitle;
    input.className = 'form-input';
    input.style.fontSize = '28px';
    input.style.fontWeight = '700';
    input.style.maxWidth = '500px';
    
    input.onblur = function() {
        const newTitle = this.value.trim() || currentTitle;
        titleElement.textContent = newTitle;
        titleElement.style.display = 'block';
        this.remove();
        
        if (newTitle !== currentTitle) {
            showNotification('Report title updated', 'success');
        }
    };
    
    input.onkeydown = function(e) {
        if (e.key === 'Enter') {
            this.blur();
        } else if (e.key === 'Escape') {
            titleElement.textContent = currentTitle;
            titleElement.style.display = 'block';
            this.remove();
        }
    };
    
    titleElement.style.display = 'none';
    titleElement.parentNode.insertBefore(input, titleElement);
    input.focus();
    input.select();
}

// Chart Settings
function editChartSettings(chartId) {
    showNotification(`Opening settings for ${chartId} chart`, 'info');
    console.log('Edit chart settings:', chartId);
}

function exportChart(chartId) {
    const canvas = document.querySelector(`#${chartId.replace('-', '')}Chart, #${chartId}Chart`);
    if (canvas) {
        const link = document.createElement('a');
        link.download = `${chartId}-chart.png`;
        link.href = canvas.toDataURL();
        link.click();
        showNotification(`${chartId} chart exported`, 'success');
    }
}

// Column Settings
function toggleColumnSettings() {
    showNotification('Column settings feature coming soon', 'info');
}

// Modal Management
function closeInsightModal() {
    document.getElementById('addInsightModal').style.display = 'none';
    document.getElementById('addInsightModal').classList.remove('show');
    currentInsightId = null;
}

function closeSavePresetModal() {
    document.getElementById('savePresetModal').style.display = 'none';
    document.getElementById('savePresetModal').classList.remove('show');
    document.getElementById('presetName').value = '';
    document.getElementById('presetDescription').value = '';
}

function closeEmailReportModal() {
    document.getElementById('emailReportModal').style.display = 'none';
    document.getElementById('emailReportModal').classList.remove('show');
}

function closeScheduleReportModal() {
    document.getElementById('scheduleReportModal').style.display = 'none';
    document.getElementById('scheduleReportModal').classList.remove('show');
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    currentDeleteItem = null;
}

function closeAllModals() {
    closeInsightModal();
    closeSavePresetModal();
    closeEmailReportModal();
    closeScheduleReportModal();
    closeDeleteModal();
}

// Delete Confirmation
function confirmDelete() {
    if (!currentDeleteItem) return;
    
    switch (currentDeleteItem.type) {
        case 'record':
            const recordIndex = sampleData.findIndex(item => item.id === currentDeleteItem.id);
            if (recordIndex !== -1) {
                sampleData.splice(recordIndex, 1);
                renderDataTable();
                updateKPIs();
                updateCharts();
                showNotification('Record deleted successfully', 'success');
            }
            break;
            
        case 'insight':
            const insightIndex = insights.findIndex(item => item.id === currentDeleteItem.id);
            if (insightIndex !== -1) {
                insights.splice(insightIndex, 1);
                saveInsightsToLocalStorage();
                updateInsightsPanels();
                showNotification('Insight deleted successfully', 'success');
            }
            break;
            
        case 'saved-report':
            const reportIndex = savedReports.findIndex(item => item.id === currentDeleteItem.id);
            if (reportIndex !== -1) {
                savedReports.splice(reportIndex, 1);
                saveToLocalStorage();
                
                // Remove from sidebar
                const reportElement = document.querySelector(`[onclick="loadSavedReport(${currentDeleteItem.id})"]`);
                if (reportElement) {
                    reportElement.parentElement.remove();
                }
                
                showNotification('Saved report deleted successfully', 'success');
            }
            break;
    }
    
    closeDeleteModal();
}

// Email and Schedule Functions
function sendEmailReport() {
    const recipients = document.getElementById('emailRecipients').value.trim();
    const subject = document.getElementById('emailSubject').value.trim();
    const message = document.getElementById('emailMessage').value.trim();
    
    if (!recipients) {
        showNotification('Please enter email recipients', 'error');
        return;
    }
    
    // Simulate sending email
    showNotification('Sending email report...', 'info');
    setTimeout(() => {
        showNotification('Email report sent successfully', 'success');
        closeEmailReportModal();
    }, 2000);
}

function saveSchedule() {
    const frequency = document.getElementById('scheduleFrequency').value;
    const day = document.getElementById('scheduleDay').value;
    const time = document.getElementById('scheduleTime').value;
    const recipients = document.getElementById('scheduleRecipients').value.trim();
    
    if (!recipients) {
        showNotification('Please enter email recipients', 'error');
        return;
    }
    
    // Save schedule
    const schedule = {
        id: Date.now(),
        frequency: frequency,
        day: day,
        time: time,
        recipients: recipients,
        created: new Date().toISOString()
    };
    
    // In a real app, this would be saved to the backend
    console.log('Schedule saved:', schedule);
    
    showNotification('Report schedule saved successfully', 'success');
    closeScheduleReportModal();
}

// Search Function
function performSearch(query) {
    if (query.length < 2) return;
    
    console.log(`Searching reports for: ${query}`);
    showNotification(`Searching for "${query}"...`, 'info');
    
    // Simulate search results
    setTimeout(() => {
        showNotification(`Found 5 reports matching "${query}"`, 'success');
    }, 1000);
}

// Dropdown Functions
function toggleNotifications() {
    showNotification('Notifications feature coming soon', 'info');
}

function toggleUserMenu() {
    showNotification('User menu feature coming soon', 'info');
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

// Initialize application
console.log('CRM Reports System with full functionality initialized successfully');
