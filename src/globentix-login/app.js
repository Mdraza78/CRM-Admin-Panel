// DOM Elements
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const togglePasswordBtn = document.getElementById('togglePassword');
const rememberCheckbox = document.getElementById('remember');
const successModal = document.getElementById('successModal');
const signinBtn = document.querySelector('.signin-btn');

// API Base URL - Update this to your backend URL
const API_BASE_URL = 'https://crm-admin-panel-production.up.railway.app/api';

// Password visibility toggle functionality
togglePasswordBtn.addEventListener('click', function() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    // Toggle icon
    if (type === 'text') {
        togglePasswordBtn.classList.remove('fa-eye');
        togglePasswordBtn.classList.add('fa-eye-slash');
    } else {
        togglePasswordBtn.classList.remove('fa-eye-slash');
        togglePasswordBtn.classList.add('fa-eye');
    }
});

// Form validation functions
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

function showFieldError(input, message) {
    // Remove existing error styling
    input.classList.remove('error');
    
    // Add error styling
    input.classList.add('error');
    input.style.borderColor = 'var(--color-error)';
    
    // Create or update error message
    let errorMsg = input.parentNode.querySelector('.error-message');
    if (!errorMsg) {
        errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        errorMsg.style.color = 'var(--color-error)';
        errorMsg.style.fontSize = 'var(--font-size-sm)';
        errorMsg.style.marginTop = 'var(--space-4)';
        errorMsg.style.fontWeight = 'var(--font-weight-medium)';
        input.parentNode.appendChild(errorMsg);
    }
    errorMsg.textContent = message;
    
    // Remove error on focus
    input.addEventListener('focus', function() {
        input.style.borderColor = '';
        input.classList.remove('error');
        if (errorMsg) {
            errorMsg.remove();
        }
    }, { once: true });
}

function clearAllErrors() {
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(msg => msg.remove());
    
    const errorInputs = document.querySelectorAll('.error');
    errorInputs.forEach(input => {
        input.classList.remove('error');
        input.style.borderColor = '';
    });
}

function showNotification(message, type = 'error') {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    // Add styles using your design system variables
    notification.style.cssText = `
        position: fixed;
        top: var(--space-20);
        right: var(--space-20);
        background: ${type === 'success' ? 'var(--color-success)' : 'var(--color-error)'};
        color: var(--color-white);
        padding: var(--space-16) var(--space-20);
        border-radius: var(--radius-base);
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        min-width: 300px;
        max-width: 400px;
        animation: slideInRight var(--duration-normal) var(--ease-standard);
        border: 1px solid ${type === 'success' ? 'rgba(var(--color-success-rgb), 0.2)' : 'rgba(var(--color-error-rgb), 0.2)'};
    `;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Add CSS for notification animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { 
            transform: translateX(100%); 
            opacity: 0; 
        }
        to { 
            transform: translateX(0); 
            opacity: 1; 
        }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: var(--space-12);
    }
    
    .notification-close {
        background: none;
        border: none;
        color: var(--color-white);
        cursor: pointer;
        margin-left: auto;
        padding: var(--space-4);
        border-radius: var(--radius-sm);
        transition: background-color var(--duration-fast) var(--ease-standard);
    }
    
    .notification-close:hover {
        background: rgba(255, 255, 255, 0.2);
    }
    
    .signin-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none !important;
    }
    
    .fa-spin {
        animation: fa-spin 1s infinite linear;
    }
    
    @keyframes fa-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Form submission handling with backend integration
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Clear previous errors
    clearAllErrors();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const rememberMe = rememberCheckbox.checked;
    
    let hasErrors = false;
    
    // Validate email
    if (!email) {
        showFieldError(emailInput, 'Email address is required');
        hasErrors = true;
    } else if (!validateEmail(email)) {
        showFieldError(emailInput, 'Please enter a valid email address');
        hasErrors = true;
    }
    
    // Validate password
    if (!password) {
        showFieldError(passwordInput, 'Password is required');
        hasErrors = true;
    } else if (!validatePassword(password)) {
        showFieldError(passwordInput, 'Password must be at least 6 characters long');
        hasErrors = true;
    }
    
    // If validation passes, make API call
    if (!hasErrors) {
        // Add loading state to button
        const originalText = signinBtn.innerHTML;
        signinBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
        signinBtn.disabled = true;
        
        try {
            // Make API call to backend
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: email, // Using email as username for login
                    password: password
                })
            });

            const data = await response.json();
// In the login form submission handler, replace the success section:
if (response.ok) {
    // Login successful
    console.log('Login successful:', data);
    
    // ✅ FIXED: Store with consistent keys
    localStorage.setItem('authToken', data.token);  // Changed from 'token'
    localStorage.setItem('userData', JSON.stringify(data.user)); // Changed from 'user'
    localStorage.setItem('loginTime', new Date().toISOString());
    
    // Handle remember me
    if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('savedEmail', email);
    } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('savedEmail');
    }
    
    showNotification('Login successful! Redirecting to dashboard...', 'success');
    
    // Redirect to dashboard
    setTimeout(() => {
        window.location.href = '/MAIN_PAGE';
    }, 1500);
    
} else {
    // Login failed
    throw new Error(data.msg || data.error || 'Login failed');
}
            
        } catch (error) {
            console.error('Login error:', error);
            
            // Show appropriate error message
            if (error.message.includes('Invalid credentials')) {
                showFieldError(emailInput, ' ');
                showFieldError(passwordInput, 'Invalid email or password');
                showNotification('Invalid email or password. Please try again.');
            } else if (error.message.includes('network') || error.message.includes('fetch')) {
                showNotification('Network error. Please check your connection and try again.');
            } else {
                showNotification(error.message || 'Login failed. Please try again.');
            }
            
            // Reset button
            signinBtn.innerHTML = originalText;
            signinBtn.disabled = false;
        }
    }
});

// Success modal functions
function showSuccessModal() {
    successModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    successModal.style.display = 'none';
    document.body.style.overflow = '';
    loginForm.reset();
    clearAllErrors();
}

// Close modal when clicking outside of it
successModal.addEventListener('click', function(e) {
    if (e.target === successModal) {
        closeModal();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && successModal.style.display === 'flex') {
        closeModal();
    }
    
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        if (emailInput === document.activeElement || passwordInput === document.activeElement) {
            loginForm.dispatchEvent(new Event('submit'));
        }
    }
});

// Enhanced input interactions
function addInputFocusEffects() {
    const inputs = document.querySelectorAll('.form-input');
    
    inputs.forEach(input => {
        const container = input.parentElement;
        const icon = container.querySelector('.input-icon');
        
        input.addEventListener('focus', function() {
            container.classList.add('focused');
            if (icon) {
                icon.style.color = 'var(--color-primary)';
            }
        });
        
        input.addEventListener('blur', function() {
            container.classList.remove('focused');
            if (icon) {
                icon.style.color = 'var(--color-text-secondary)';
            }
        });
    });
}

// Forgot password handling
const forgotPasswordLink = document.querySelector('.forgot-password');
forgotPasswordLink.addEventListener('click', function(e) {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    if (!email || !validateEmail(email)) {
        showNotification('Please enter a valid email address to reset your password.');
        emailInput.focus();
        return;
    }
    
    // Implement forgot password functionality here
    showNotification(`Password reset link would be sent to: ${email}`);
    console.log('Forgot password requested for:', email);
});

// Remember me checkbox enhancement
rememberCheckbox.addEventListener('change', function() {
    const label = document.querySelector('.checkbox-label');
    if (this.checked) {
        label.style.color = 'var(--color-primary)';
    } else {
        label.style.color = 'var(--color-text-secondary)';
    }
});

// Check if user is already logged in
function checkExistingLogin() {
    const token = localStorage.getItem('token');
    const rememberMe = localStorage.getItem('rememberMe');
    
    if (token && rememberMe) {
        // Auto-redirect if remember me was enabled
        window.location.href = '/MAIN_PAGE/index.html';
    } else if (token) {
        // Show welcome back message but don't auto-redirect
        console.log('User has existing session but remember me was not enabled');
    }
}

// Load saved email if remember me was checked
function loadSavedCredentials() {
    const rememberMe = localStorage.getItem('rememberMe');
    const savedEmail = localStorage.getItem('savedEmail');
    
    if (rememberMe && savedEmail) {
        emailInput.value = savedEmail;
        rememberCheckbox.checked = true;
        
        // Trigger the checkbox change to update styling
        const event = new Event('change');
        rememberCheckbox.dispatchEvent(event);
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Globentix Technologies Login Page Initialized');
    
    // Initialize all functionality
    addInputFocusEffects();
    loadSavedCredentials();
    checkExistingLogin();
    
    // Focus on email input after page loads
    setTimeout(() => {
        if (!emailInput.value) {
            emailInput.focus();
        } else {
            passwordInput.focus();
        }
    }, 500);
    
    // Add some demo data for testing (remove in production)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('Development mode detected');
        console.log('Backend API:', API_BASE_URL);
        
        // Auto-fill demo credentials for testing if no saved credentials
        if (!emailInput.value) {
            // You can pre-fill test credentials here if needed
            // emailInput.value = 'test@example.com';
            // passwordInput.value = 'password123';
        }
    }
});

// Utility function to get auth token (for use in other pages)
function getAuthToken() {
    return localStorage.getItem('token');
}

// Utility function to get user data (for use in other pages)
function getUserData() {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
}

// Utility function to check if user is authenticated
function isAuthenticated() {
    const token = localStorage.getItem('token');
    return !!token;
}

// Utility function to logout (for use in other pages)
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
    window.location.href = '/LOGIN/index.html';
}

// Make utility functions globally available
window.getAuthToken = getAuthToken;
window.getUserData = getUserData;
window.isAuthenticated = isAuthenticated;
window.logout = logout;

// Export functions for potential testing (optional)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateEmail,
        validatePassword,
        showSuccessModal,
        closeModal,
        getAuthToken,
        getUserData,
        logout,
        isAuthenticated
    };
}