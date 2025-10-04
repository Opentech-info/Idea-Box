// --- Advanced Project Image Slider Logic ---
const projectSlides = [
    {
        id: 1,
        image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=800&q=80',
        title: 'Build, Learn, Succeed',
        desc: 'Discover top school projects and boost your academic journey.'
    },
    {
        id: 2,
        image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80',
        title: 'Modern Tech, Real Results',
        desc: 'Explore projects in AI, Cloud, Cybersecurity, and more.'
    },
    {
        id: 3,
        image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
        title: 'Join the Community',
        desc: 'Connect, share, and grow with fellow students and developers.'
    }
];

let projectCurrentSlide = 0;

function renderProjectSlider() {
    const wrapper = document.getElementById('projectSliderWrapper');
    if (!wrapper) return;
    wrapper.innerHTML = projectSlides.map((slide, idx) => `
        <div class="slide${idx === projectCurrentSlide ? ' active' : ''}">
            <img src="${slide.image}" alt="${slide.title}" class="slider-img"/>
            <div class="slide-content">
                <h2>${slide.title}</h2>
                <p>${slide.desc}</p>
            </div>
        </div>
    `).join('');
    updateProjectSliderPosition();
}

function renderProjectSliderDots() {
    const dots = document.getElementById('projectSliderDots');
    if (!dots) return;
    dots.innerHTML = projectSlides.map((_, idx) => `
        <span class="dot${idx === projectCurrentSlide ? ' active' : ''}" data-idx="${idx}"></span>
    `).join('');
    Array.from(dots.children).forEach(dot => {
        dot.addEventListener('click', () => {
            projectCurrentSlide = parseInt(dot.dataset.idx);
            renderProjectSlider();
            renderProjectSliderDots();
        });
    });
}

function updateProjectSliderPosition() {
    const wrapper = document.getElementById('projectSliderWrapper');
    if (!wrapper) return;
    wrapper.style.transform = `translateX(-${projectCurrentSlide * 100}%)`;
    Array.from(wrapper.children).forEach((slide, idx) => {
        slide.classList.toggle('active', idx === projectCurrentSlide);
    });
}

function nextProjectSlide() {
    projectCurrentSlide = (projectCurrentSlide + 1) % projectSlides.length;
    renderProjectSlider();
    renderProjectSliderDots();
}

function prevProjectSlide() {
    projectCurrentSlide = (projectCurrentSlide - 1 + projectSlides.length) % projectSlides.length;
    renderProjectSlider();
    renderProjectSliderDots();
}

function startProjectSliderAuto() {
    setInterval(() => {
        nextProjectSlide();
    }, 6000);
}

document.addEventListener('DOMContentLoaded', () => {
    renderProjectSlider();
    renderProjectSliderDots();
    document.getElementById('projectPrevBtn').addEventListener('click', prevProjectSlide);
    document.getElementById('projectNextBtn').addEventListener('click', nextProjectSlide);
    startProjectSliderAuto();
});
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
            <div class="project-card aws-advanced-card" data-project-id="${project.id}">
                <div class="aws-card-header">
                    <div class="aws-card-icon">
                        <img src="${project.icon || '../pict/aws-default.svg'}" alt="icon" onerror="this.src='../pict/aws-default.svg'">
                    </div>
                    <div class="aws-card-title-group">
                        <h3 class="project-title">${project.name}</h3>
                        <span class="project-tech">${project.tech_stack}</span>
                    </div>
                </div>
                <div class="aws-card-body">
                    <img src="${project.preview_media || '../pict/me6.png'}" alt="${project.name}" class="project-image" onerror="this.src='../pict/me6.png'">
                    <p class="project-description">${project.description}</p>
                </div>
                <div class="project-actions">
                    <button class="cart-btn${project.in_cart ? ' added' : ''}" data-project-id="${project.id}" title="Save">
                        <i class="fas fa-heart"></i>
                    </button>
                    <button class="view-details-btn" data-project-id="${project.id}" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
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
