// Advanced Projects Page Script for AZsubay.dev
// Handles category filtering, advanced card rendering, and mobile-first UI

document.addEventListener('DOMContentLoaded', () => {
    const categoriesList = document.getElementById('categoriesList');
    const projectsGrid = document.getElementById('projectsGrid');
    let allProjects = [];
    let categories = [];
    let selectedCategory = 'all';

    async function loadProjects() {
        try {
            allProjects = await api.getProjects();
            categories = getCategories(allProjects);
            renderCategories();
            renderProjects();
        } catch (error) {
            projectsGrid.innerHTML = '<p style="color:var(--error-color);text-align:center;">Failed to load projects.</p>';
        }
    }

    function getCategories(projects) {
        const cats = new Set();
        projects.forEach(p => {
            if (p.category) cats.add(p.category);
        });
        return ['all', ...Array.from(cats)];
    }

    function renderCategories() {
        categoriesList.innerHTML = categories.map(cat => `
            <button class="category-btn${cat === selectedCategory ? ' active' : ''}" data-category="${cat}">
                ${cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
        `).join('');
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                selectedCategory = btn.dataset.category;
                renderCategories();
                renderProjects();
            });
        });
    }

    function renderProjects() {
        let filtered = selectedCategory === 'all' ? allProjects : allProjects.filter(p => p.category === selectedCategory);
        if (filtered.length === 0) {
            projectsGrid.innerHTML = `<div style="text-align:center;color:var(--text-secondary);padding:40px;">No projects found in this category.</div>`;
            return;
        }
        projectsGrid.innerHTML = filtered.map(project => `
            <div class="project-card" data-project-id="${project.id}">
                <img src="${project.preview_media || '../pict/me6.png'}" alt="${project.name}" class="project-image" onerror="this.src='../pict/me6.png'">
                <div class="project-info">
                    <h3 class="project-title">${project.name}</h3>
                    <div class="project-tech">${project.tech_stack}</div>
                    <p class="project-description">${project.description}</p>
                    <div class="project-actions">
                        <button class="cart-btn${project.in_cart ? ' added' : ''}" data-project-id="${project.id}">
                            <i class="fas fa-heart"></i> ${project.in_cart ? 'Saved' : 'Save'}
                        </button>
                        <button class="view-details-btn" data-project-id="${project.id}">
                            <i class="fas fa-eye"></i> View Details
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        // Card events
        projectsGrid.querySelectorAll('.cart-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = btn.dataset.projectId;
                if (!api.isAuthenticated()) {
                    authHandler.showToast('Please login to save projects', 'error');
                    return;
                }
                try {
                    if (btn.classList.contains('added')) {
                        await api.removeFromCart(id);
                        btn.classList.remove('added');
                        btn.innerHTML = '<i class="fas fa-heart"></i> Save';
                        authHandler.showToast('Removed from saved projects', 'success');
                    } else {
                        await api.addToCart(id);
                        btn.classList.add('added');
                        btn.innerHTML = '<i class="fas fa-heart"></i> Saved';
                        authHandler.showToast('Added to saved projects!', 'success');
                    }
                } catch (err) {
                    authHandler.showToast('Failed to update cart', 'error');
                }
            });
        });
        projectsGrid.querySelectorAll('.view-details-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Optionally show modal or redirect
                window.location.href = `index.html#project-${btn.dataset.projectId}`;
            });
        });
    }

    loadProjects();
});
