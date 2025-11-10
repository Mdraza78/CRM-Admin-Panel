// DOM Elements
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const togglePasswordBtn = document.getElementById('togglePassword');
const rememberCheckbox = document.getElementById('remember');
const successModal = document.getElementById('successModal');
const signinBtn = document.querySelector('.signin-btn');

// API Base URL - backend URL (update if needed)
const API_BASE_URL = 'https://crm-admin-panel-production.up.railway.app/api';

// Password visibility toggle functionality
togglePasswordBtn.addEventListener('click', function() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
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

// Show inline error for a field
function showFieldError(input, message) {
    input.classList.remove('error');
    input.classList.add('error');
    input.style.borderColor = '#FF5252';

    let errorMsg = input.parentNode.querySelector('.error-message');
    if (!errorMsg) {
        errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        errorMsg.style.color = '#FF5252';
        errorMsg.style.fontSize = '12px';
        errorMsg.style.marginTop = '4px';
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

// Show notification popup
function showNotification(message, type = 'error') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

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

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'var(--color-success)' : 'var(--color-error)'};
        color: var(--color-white);
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 10px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        min-width: 300px;
        max-width: 400px;
        animation: slideInRight 250ms cubic-bezier(0.16, 1, 0.3, 1);
        border: 1px solid ${type === 'success' ? 'rgba(33,128,141,0.2)' : 'rgba(192,21,47,0.2)'};
    `;

    document.body.appendChild(notification);

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
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    .notification-content {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    .notification-close {
        background: none;
        border: none;
        color: var(--color-white);
        cursor: pointer;
        margin-left: auto;
        padding: 4px;
        border-radius: 6px;
        transition: background-color 150ms cubic-bezier(0.16,1,0.3,1);
    }
    .notification-close:hover {
        background: rgba(255,255,255,0.2);
    }
`;
document.head.appendChild(style);

// Form submit handler with real backend integration
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    clearAllErrors();

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const rememberMe = rememberCheckbox.checked;

    let hasErrors = false;

    if (!email) {
        showFieldError(emailInput, 'Email address is required');
        hasErrors = true;
    } else if (!validateEmail(email)) {
        showFieldError(emailInput, 'Please enter a valid email address');
        hasErrors = true;
    }

    if (!password) {
        showFieldError(passwordInput, 'Password is required');
        hasErrors = true;
    } else if (!validatePassword(password)) {
        showFieldError(passwordInput, 'Password must be at least 6 characters long');
        hasErrors = true;
    }

    if (!hasErrors) {
        const originalText = signinBtn.innerHTML;
        signinBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
        signinBtn.disabled = true;

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username: email, password: password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Store auth info
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userData', JSON.stringify(data.user));
                localStorage.setItem('loginTime', new Date().toISOString());

                if (rememberMe) {
                    localStorage.setItem('rememberMe', 'true');
                    localStorage.setItem('savedEmail', email);
                } else {
                    localStorage.removeItem('rememberMe');
                    localStorage.removeItem('savedEmail');
                }

                showNotification('Login successful! Redirecting...', 'success');

                setTimeout(() => {
                    window.location.href = '/MAIN_PAGE'; // Matches backend route for dashboard page
                }, 1500);
            } else {
                throw new Error(data.msg || data.error || 'Login failed');
            }
        } catch (error) {
            if (error.message.includes('Invalid credentials')) {
                showFieldError(emailInput, ' ');
                showFieldError(passwordInput, 'Invalid email or password');
                showNotification('Invalid email or password. Please try again.');
            } else if (error.message.toLowerCase().includes('network') || error.message.toLowerCase().includes('fetch')) {
                showNotification('Network error. Please check your connection and try again.');
            } else {
                showNotification(error.message || 'Login failed. Please try again.');
            }
            signinBtn.innerHTML = originalText;
            signinBtn.disabled = false;
        }
    }
});

// Success modal functions (optional based on your UI flow)
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

successModal.addEventListener('click', (e) => {
    if (e.target === successModal) {
        closeModal();
    }
});

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

// Input focus color effects
function addInputFocusEffects() {
    document.querySelectorAll('.form-input').forEach(input => {
        const container = input.parentElement;
        const icon = container.querySelector('.input-icon');

        input.addEventListener('focus', function() {
            container.classList.add('focused');
            if (icon) icon.style.color = '#1E88E5';
        });

        input.addEventListener('blur', function() {
            container.classList.remove('focused');
            if (icon) icon.style.color = '#999';
        });
    });
}

// Forgot password handling
const forgotPasswordLink = document.querySelector('.forgot-password');
forgotPasswordLink.addEventListener('click', function(e) {
    e.preventDefault();
    alert('Password reset functionality would be implemented here.\n\nThis would typically redirect to a password reset page or open a modal to collect the user\'s email address.');
});

// Remember me checkbox styling and logging
rememberCheckbox.addEventListener('change', function() {
    const label = document.querySelector('.checkbox-label');
    if (this.checked) {
        label.style.color = '#1E88E5';
        console.log('Remember me enabled');
    } else {
        label.style.color = '#666';
        console.log('Remember me disabled');
    }
});

// Load saved email on page load
function loadSavedCredentials() {
    const rememberMe = localStorage.getItem('rememberMe');
    const savedEmail = localStorage.getItem('savedEmail');
    if (rememberMe && savedEmail) {
        emailInput.value = savedEmail;
        rememberCheckbox.checked = true;
        const event = new Event('change');
        rememberCheckbox.dispatchEvent(event);
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Globentix Technologies Login Page Initialized');
    addInputFocusEffects();
    loadSavedCredentials();
    emailInput.focus();
});

// Export functions if needed (for testing)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateEmail,
        validatePassword,
        showSuccessModal,
        closeModal
    };
}
