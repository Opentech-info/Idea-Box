// Authentication Handler for AZsubay.dev School Project Platform
class AuthHandler {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateUI();
    }

    bindEvents() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Modal controls
        this.bindModalEvents();

        // Navigation buttons
        this.bindNavigationEvents();
    }

    bindModalEvents() {
        // Login modal
        const loginBtn = document.getElementById('loginBtn');
        const loginModal = document.getElementById('loginModal');
        const closeLogin = document.getElementById('closeLogin');

        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                if (loginModal) loginModal.style.display = 'block';
            });
        }

        if (closeLogin) {
            closeLogin.addEventListener('click', () => {
                if (loginModal) loginModal.style.display = 'none';
            });
        }

        // Register modal
        const registerBtn = document.getElementById('registerBtn');
        const registerModal = document.getElementById('registerModal');
        const closeRegister = document.getElementById('closeRegister');

        if (registerBtn) {
            registerBtn.addEventListener('click', () => {
                if (registerModal) registerModal.style.display = 'block';
            });
        }

        if (closeRegister) {
            closeRegister.addEventListener('click', () => {
                if (registerModal) registerModal.style.display = 'none';
            });
        }

        // Modal switching
        const switchToRegister = document.getElementById('switchToRegister');
        const switchToLogin = document.getElementById('switchToLogin');

        if (switchToRegister) {
            switchToRegister.addEventListener('click', (e) => {
                e.preventDefault();
                if (loginModal) loginModal.style.display = 'none';
                if (registerModal) registerModal.style.display = 'block';
            });
        }

        if (switchToLogin) {
            switchToLogin.addEventListener('click', (e) => {
                e.preventDefault();
                if (registerModal) registerModal.style.display = 'none';
                if (loginModal) loginModal.style.display = 'block';
            });
        }

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    bindNavigationEvents() {
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Footer links
        const footerDashboard = document.getElementById('footerDashboard');
        const footerAdmin = document.getElementById('footerAdmin');

        if (footerDashboard) {
            footerDashboard.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateToDashboard();
            });
        }

        if (footerAdmin) {
            footerAdmin.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateToAdmin();
            });
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const loginEmail = document.getElementById('loginEmail').value;
        const loginPassword = document.getElementById('loginPassword').value;

        try {
            const response = await api.login({
                login: loginEmail,
                password: loginPassword
            });

            this.showToast('Login successful!', 'success');
            this.closeModals();
            this.updateUI();
            
            // Redirect based on role
            if (api.isAdmin()) {
                this.navigateToAdmin();
            } else {
                this.navigateToDashboard();
            }

        } catch (error) {
            this.showToast(error.message || 'Login failed', 'error');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;

        try {
            const response = await api.register({
                username,
                email,
                password
            });

            this.showToast('Registration successful!', 'success');
            this.closeModals();
            this.updateUI();
            this.navigateToDashboard();

        } catch (error) {
            this.showToast(error.message || 'Registration failed', 'error');
        }
    }

    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            api.logout();
            this.showToast('Logged out successfully', 'success');
        }
    }

    updateUI() {
        const isAuthenticated = api.isAuthenticated();
        const isAdmin = api.isAdmin();

        // Update navigation
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const dashboardLink = document.getElementById('dashboardLink');
        const adminLink = document.getElementById('adminLink');

        if (isAuthenticated) {
            // Hide login/register buttons
            if (loginBtn) loginBtn.style.display = 'none';
            if (registerBtn) registerBtn.style.display = 'none';
            
            // Show logout button
            if (logoutBtn) logoutBtn.style.display = 'block';
            
            // Show dashboard link
            if (dashboardLink) dashboardLink.style.display = 'block';
            
            // Show admin link if user is admin
            if (adminLink) {
                adminLink.style.display = isAdmin ? 'block' : 'none';
            }

            // Update footer links
            const footerDashboard = document.getElementById('footerDashboard');
            const footerAdmin = document.getElementById('footerAdmin');
            
            if (footerDashboard) footerDashboard.style.display = 'block';
            if (footerAdmin) footerAdmin.style.display = isAdmin ? 'block' : 'none';

        } else {
            // Show login/register buttons
            if (loginBtn) loginBtn.style.display = 'block';
            if (registerBtn) registerBtn.style.display = 'block';
            
            // Hide logout button
            if (logoutBtn) logoutBtn.style.display = 'none';
            
            // Hide dashboard and admin links
            if (dashboardLink) dashboardLink.style.display = 'none';
            if (adminLink) adminLink.style.display = 'none';

            // Hide footer links
            const footerDashboard = document.getElementById('footerDashboard');
            const footerAdmin = document.getElementById('footerAdmin');
            
            if (footerDashboard) footerDashboard.style.display = 'none';
            if (footerAdmin) footerAdmin.style.display = 'none';
        }
    }

    closeModals() {
        const loginModal = document.getElementById('loginModal');
        const registerModal = document.getElementById('registerModal');
        
        if (loginModal) loginModal.style.display = 'none';
        if (registerModal) registerModal.style.display = 'none';

        // Clear forms
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        if (loginForm) loginForm.reset();
        if (registerForm) registerForm.reset();
    }

    navigateToDashboard() {
        // For now, we'll just show a toast. In a real app, this would navigate to dashboard.html
        this.showToast('Dashboard feature coming soon!', 'info');
    }

    navigateToAdmin() {
        // For now, we'll just show a toast. In a real app, this would navigate to admin.html
        this.showToast('Admin dashboard coming soon!', 'info');
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        
        if (toast && toastMessage) {
            toastMessage.textContent = message;
            
            // Remove existing type classes
            toast.classList.remove('error', 'success');
            
            // Add type class
            if (type === 'error') {
                toast.classList.add('error');
            }
            
            // Show toast
            toast.classList.add('show');
            
            // Hide after 3 seconds
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }
    }

    // Form validation
    validateLoginForm() {
        const loginEmail = document.getElementById('loginEmail');
        const loginPassword = document.getElementById('loginPassword');
        
        let isValid = true;
        
        if (!loginEmail.value.trim()) {
            this.showFieldError(loginEmail, 'Username or email is required');
            isValid = false;
        } else {
            this.clearFieldError(loginEmail);
        }
        
        if (!loginPassword.value.trim()) {
            this.showFieldError(loginPassword, 'Password is required');
            isValid = false;
        } else {
            this.clearFieldError(loginPassword);
        }
        
        return isValid;
    }

    validateRegisterForm() {
        const username = document.getElementById('registerUsername');
        const email = document.getElementById('registerEmail');
        const password = document.getElementById('registerPassword');
        
        let isValid = true;
        
        if (!username.value.trim()) {
            this.showFieldError(username, 'Username is required');
            isValid = false;
        } else if (username.value.trim().length < 3) {
            this.showFieldError(username, 'Username must be at least 3 characters');
            isValid = false;
        } else {
            this.clearFieldError(username);
        }
        
        if (!email.value.trim()) {
            this.showFieldError(email, 'Email is required');
            isValid = false;
        } else if (!this.isValidEmail(email.value.trim())) {
            this.showFieldError(email, 'Please enter a valid email');
            isValid = false;
        } else {
            this.clearFieldError(email);
        }
        
        if (!password.value.trim()) {
            this.showFieldError(password, 'Password is required');
            isValid = false;
        } else if (password.value.trim().length < 6) {
            this.showFieldError(password, 'Password must be at least 6 characters');
            isValid = false;
        } else {
            this.clearFieldError(password);
        }
        
        return isValid;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showFieldError(field, message) {
        field.style.borderColor = '#e87c03';
        
        // Remove existing error message
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Add error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.style.color = '#e87c03';
        errorDiv.style.fontSize = '0.8rem';
        errorDiv.style.marginTop = '5px';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
    }

    clearFieldError(field) {
        field.style.borderColor = '#404040';
        
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }
}

// Initialize auth handler when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authHandler = new AuthHandler();
});
