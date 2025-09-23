document.addEventListener('DOMContentLoaded', () => {
    const admin = new Admin();
    admin.init();
});

class Admin {
    init() {
        this.checkAuth();
    }

    checkAuth() {
        if (!api.isAuthenticated() || !api.isAdmin()) {
            // Redirect to home page if not an admin
            window.location.href = 'index.html';
            setTimeout(() => alert('Access Denied. You must be an administrator to view this page.'), 100);
        }
    }
}