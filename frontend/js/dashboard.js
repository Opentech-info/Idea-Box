document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new Dashboard();
    dashboard.init();
});

class Dashboard {
    constructor() {
        this.savedProjects = [];
        this.grid = document.getElementById('savedProjectsGrid');
    }

    init() {
        this.checkAuth();
        this.loadWelcomeMessage();
        this.loadSavedProjects();
        this.bindEvents();
    }

    checkAuth() {
        if (!api.isAuthenticated()) {
            // Redirect to home page if not logged in
            window.location.href = 'index.html';
            // Use a timeout to ensure the user is redirected before the alert shows
            setTimeout(() => alert('You must be logged in to view the dashboard.'), 100);
        }
    }

    loadWelcomeMessage() {
        const welcomeMessage = document.getElementById('welcomeMessage');
        const username = api.getUsername();
        if (welcomeMessage && username) {
            welcomeMessage.textContent = `Welcome, ${username}!`;
        }
    }

    async loadSavedProjects() {
        try {
            this.savedProjects = await api.getCart();
            this.renderSavedProjects();
        } catch (error) {
            console.error('Failed to load saved projects:', error);
            if (this.grid) {
                this.grid.innerHTML = '<p>Could not load your saved projects. Please try again later.</p>';
            }
        }
    }

    renderSavedProjects() {
        if (!this.grid) return;

        if (this.savedProjects.length === 0) {
            this.grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--text-secondary);">
                    <i class="fas fa-heart-broken" style="font-size: 3rem; margin-bottom: 15px;"></i>
                    <h4>No Saved Projects</h4>
                    <p>You haven't saved any projects yet. <a href="index.html#projects" style="color: var(--primary-color);">Explore projects</a> to get started.</p>
                </div>
            `;
            return;
        }

        this.grid.innerHTML = this.savedProjects.map(project => `
            <div class="project-card" data-project-id="${project.id}">
                <img src="${project.preview_media || '../pict/me6.png'}" alt="${project.name}" class="project-image" onerror="this.src='../pict/me6.png'">
                <div class="project-info">
                    <h3 class="project-title">${project.name}</h3>
                    <div class="project-tech">${project.tech_stack}</div>
                    <div class="project-actions">
                        <button class="btn btn-primary btn-small btn-view">View</button>
                        <button class="btn btn-danger btn-small btn-remove">Remove</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async removeFromSaved(projectId) {
        if (confirm('Are you sure you want to remove this project?')) {
            try {
                await api.removeFromCart(projectId);
                authHandler.showToast('Project removed successfully', 'success');
                // Reload projects to reflect the change
                this.loadSavedProjects();
            } catch (error) {
                authHandler.showToast('Failed to remove project', 'error');
            }
        }
    }

    handleGridClick(e) {
        const target = e.target;
        const projectCard = target.closest('.project-card');
        if (!projectCard) return;

        const projectId = projectCard.dataset.projectId;

        if (target.classList.contains('btn-remove')) {
            this.removeFromSaved(projectId);
        } else if (target.classList.contains('btn-view')) {
            window.location.href = 'index.html'; // Or a specific project page
        }
    }

    bindEvents() {
        // Event delegation for project cards
        if (this.grid) {
            this.grid.addEventListener('click', this.handleGridClick.bind(this));
        }

        const navLinks = document.querySelectorAll('.dashboard-nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = e.target.closest('a').dataset.tab;

                // Update active link
                navLinks.forEach(l => l.classList.remove('active'));
                e.target.closest('a').classList.add('active');

                // Show correct tab
                document.querySelectorAll('.dashboard-tab').forEach(tab => {
                    tab.style.display = 'none';
                    tab.classList.remove('active');
                });
                const activeTab = document.getElementById(`${tabId}-tab`);
                activeTab.style.display = 'block';
                activeTab.classList.add('active');
            });
        });
    }
}