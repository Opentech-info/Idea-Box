// Main Application Handler for AZsubay.dev School Project Platform
class AppHandler {
    constructor() {
        this.currentSlide = 0;
        this.slides = [];
        this.projects = [];
        this.cart = [];
        this.autoSlideInterval = null;
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadVideoSlider();
        await this.loadProjects();
        await this.loadCart();
        this.startAutoSlide();
        this.initNavbarScroll();
        this.initHamburgerMenu();
        this.updateAuthUI();
    }

    bindEvents() {
        // Slider controls
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.prevSlide());
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextSlide());
        }

        // Load more projects
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => this.loadMoreProjects());
        }

        // Navigation links
        const navLinks = document.querySelectorAll('.nav-link[data-page]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleNavigation(link.dataset.page);
            });
        });

        // Dashboard and Admin links
        const dashboardLink = document.getElementById('dashboardLink');
        const adminLink = document.getElementById('adminLink');
        
        if (dashboardLink) {
            dashboardLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleDashboardNavigation();
            });
        }
        
        if (adminLink) {
            adminLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleAdminNavigation();
            });
        }

        // Cart icon
        const cartIcon = document.getElementById('cartIcon');
        if (cartIcon) {
            cartIcon.addEventListener('click', () => this.showCartModal());
        }

        // Cart modal events
        this.bindCartEvents();
        
        // Checkout modal events
        this.bindCheckoutEvents();
        
        // Contact modal events
        this.bindContactEvents();

        // Order success modal events
        this.bindOrderSuccessEvents();

        // Project cards
        this.bindProjectEvents();
    }

    async loadVideoSlider() {
        try {
            const ads = await api.getActiveAds();
            this.slides = ads;
            this.renderSlider();
            this.renderDots();
        } catch (error) {
            console.error('Failed to load video slider:', error);
            // Use fallback content
            this.slides = [
                {
                    id: 1,
                    title: 'Welcome to AZsubay.dev Projects',
                    video_url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
                }
            ];
            this.renderSlider();
            this.renderDots();
        }
    }

    renderSlider() {
        const sliderWrapper = document.querySelector('.slider-wrapper');
        if (!sliderWrapper) return;

        sliderWrapper.innerHTML = '';

        this.slides.forEach((slide, index) => {
            const slideElement = document.createElement('div');
            slideElement.className = 'slide';
            slideElement.innerHTML = `
                <video autoplay muted loop playsinline>
                    <source src="${slide.video_url}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
                <div class="slide-content">
                    <h2>${slide.title}</h2>
                    <p>Discover amazing school projects and educational resources</p>
                </div>
            `;
            sliderWrapper.appendChild(slideElement);
        });

        this.updateSlidePosition();
    }

    renderDots() {
        const dotsContainer = document.getElementById('sliderDots');
        if (!dotsContainer) return;

        dotsContainer.innerHTML = '';

        this.slides.forEach((_, index) => {
            const dot = document.createElement('span');
            dot.className = `dot ${index === 0 ? 'active' : ''}`;
            dot.addEventListener('click', () => this.goToSlide(index));
            dotsContainer.appendChild(dot);
        });
    }

    updateSlidePosition() {
        const sliderWrapper = document.querySelector('.slider-wrapper');
        if (!sliderWrapper) return;

        sliderWrapper.style.transform = `translateX(-${this.currentSlide * 100}%)`;
        
        // Update dots
        const dots = document.querySelectorAll('.dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentSlide);
        });
    }

    nextSlide() {
        if (this.slides.length === 0) return;
        this.currentSlide = (this.currentSlide + 1) % this.slides.length;
        this.updateSlidePosition();
        this.resetAutoSlide();
    }

    prevSlide() {
        if (this.slides.length === 0) return;
        this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
        this.updateSlidePosition();
        this.resetAutoSlide();
    }

    goToSlide(index) {
        if (index >= 0 && index < this.slides.length) {
            this.currentSlide = index;
            this.updateSlidePosition();
            this.resetAutoSlide();
        }
    }

    startAutoSlide() {
        if (this.slides.length <= 1) return;
        
        this.autoSlideInterval = setInterval(() => {
            this.nextSlide();
        }, 5000);
    }

    resetAutoSlide() {
        if (this.autoSlideInterval) {
            clearInterval(this.autoSlideInterval);
            this.startAutoSlide();
        }
    }

    async loadProjects() {
        try {
            const userId = api.getUserId();
            this.projects = await api.getProjects(userId);
            this.renderProjects();
        } catch (error) {
            console.error('Failed to load projects:', error);
            this.renderProjects([]); // Render empty state
        }
    }

    renderProjects(projectsToRender = this.projects) {
        const projectsGrid = document.getElementById('projectsGrid');
        if (!projectsGrid) return;

        if (projectsToRender.length === 0) {
            projectsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #b3b3b3;">
                    <i class="fas fa-folder-open" style="font-size: 4rem; margin-bottom: 20px; opacity: 0.5;"></i>
                    <h3>No projects available</h3>
                    <p>Check back later for amazing school projects!</p>
                </div>
            `;
            return;
        }

        projectsGrid.innerHTML = projectsToRender.map(project => `
            <div class="project-card" data-project-id="${project.id}">
                <img src="${project.preview_media || '../pict/me6.png'}" 
                     alt="${project.name}" 
                     class="project-image"
                     onerror="this.src='../pict/me6.png'">
                <div class="project-info">
                    <h3 class="project-title">${project.name}</h3>
                    <div class="project-tech">${project.tech_stack}</div>
                    <p class="project-description">${project.description}</p>
                    <div class="project-actions">
                        <button class="cart-btn ${project.in_cart ? 'added' : ''}" 
                                data-project-id="${project.id}"
                                onclick="appHandler.toggleCart(${project.id})">
                            <i class="fas fa-heart"></i>
                            ${project.in_cart ? 'Saved' : 'Save'}
                        </button>
                        <button class="view-details-btn" 
                                data-project-id="${project.id}"
                                onclick="appHandler.viewProjectDetails(${project.id})">
                            <i class="fas fa-eye"></i>
                            View Details
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    bindProjectEvents() {
        // Event delegation for project cards
        document.addEventListener('click', (e) => {
            if (e.target.closest('.project-card')) {
                const card = e.target.closest('.project-card');
                const projectId = card.dataset.projectId;
                
                if (e.target.closest('.cart-btn')) {
                    e.stopPropagation();
                    this.toggleCart(parseInt(projectId));
                } else if (e.target.closest('.view-details-btn')) {
                    e.stopPropagation();
                    this.viewProjectDetails(parseInt(projectId));
                }
            }
        });
    }

    async toggleCart(projectId) {
        if (!api.isAuthenticated()) {
            authHandler.showToast('Please login to save projects', 'error');
            return;
        }

        const cartBtn = document.querySelector(`.cart-btn[data-project-id="${projectId}"]`);
        if (!cartBtn) return;

        try {
            const project = this.projects.find(p => p.id === projectId);
            if (!project) return;

            if (project.in_cart) {
                await api.removeFromCart(projectId);
                project.in_cart = false;
                cartBtn.classList.remove('added');
                cartBtn.innerHTML = '<i class="fas fa-heart"></i> Save';
                authHandler.showToast('Removed from saved projects', 'success');
            } else {
                await api.addToCart(projectId);
                project.in_cart = true;
                cartBtn.classList.add('added');
                cartBtn.innerHTML = '<i class="fas fa-heart"></i> Saved';
                authHandler.showToast('Added to saved projects!', 'success');
            }
        } catch (error) {
            authHandler.showToast(error.message || 'Failed to update cart', 'error');
        }
    }

    viewProjectDetails(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) return;

        // Create and show project details modal
        this.showProjectDetailsModal(project);
    }

    showProjectDetailsModal(project) {
        // Create modal if it doesn't exist
        let modal = document.getElementById('projectDetailsModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'projectDetailsModal';
            modal.className = 'modal';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
                <span class="close" onclick="this.parentElement.parentElement.style.display='none'">&times;</span>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; align-items: start;">
                    <div>
                        <img src="${project.preview_media || '../pict/me6.png'}" 
                             alt="${project.name}" 
                             style="width: 100%; border-radius: 10px;"
                             onerror="this.src='../pict/me6.png'">
                    </div>
                    <div>
                        <h2 style="color: var(--primary-color); margin-bottom: 20px;">${project.name}</h2>
                        <div style="margin-bottom: 20px;">
                            <h3 style="color: var(--text-primary); margin-bottom: 10px;">Technology Stack</h3>
                            <p style="color: var(--text-secondary); background: var(--background-dark); padding: 10px; border-radius: 5px;">
                                ${project.tech_stack}
                            </p>
                        </div>
                        <div style="margin-bottom: 20px;">
                            <h3 style="color: var(--text-primary); margin-bottom: 10px;">Description</h3>
                            <p style="color: var(--text-secondary); line-height: 1.6;">
                                ${project.description}
                            </p>
                        </div>
                        ${project.folder_structure ? `
                        <div style="margin-bottom: 20px;">
                            <h3 style="color: var(--text-primary); margin-bottom: 10px;">Folder Structure</h3>
                            <pre style="color: var(--text-secondary); background: var(--background-dark); padding: 15px; border-radius: 5px; overflow-x: auto; font-size: 0.9rem;">${project.folder_structure}</pre>
                        </div>
                        ` : ''}
                        ${project.github_link ? `
                        <div style="margin-bottom: 20px;">
                            <a href="${project.github_link}" target="_blank" 
                               style="display: inline-flex; align-items: center; gap: 10px; background: var(--primary-color); color: white; padding: 12px 20px; border-radius: 5px; text-decoration: none; transition: all 0.3s ease;"
                               onmouseover="this.style.background='#f40612'" 
                               onmouseout="this.style.background='var(--primary-color)'">
                                <i class="fab fa-github"></i>
                                View on GitHub
                            </a>
                        </div>
                        ` : ''}
                        <div style="display: flex; gap: 10px; margin-top: 30px;">
                            <button class="cart-btn ${project.in_cart ? 'added' : ''}" 
                                    onclick="appHandler.toggleCart(${project.id}); document.getElementById('projectDetailsModal').style.display='none';"
                                    style="flex: 1;">
                                <i class="fas fa-heart"></i>
                                ${project.in_cart ? 'Saved' : 'Save Project'}
                            </button>
                            <button onclick="document.getElementById('projectDetailsModal').style.display='none'" 
                                    class="btn btn-outline" 
                                    style="flex: 1;">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        modal.style.display = 'block';

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    loadMoreProjects() {
        // For now, just show a toast. In a real app, this would load more projects from the API
        authHandler.showToast('All projects loaded!', 'info');
    }

    handleNavigation(page) {
        // Update active nav link
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === page) {
                link.classList.add('active');
            }
        });

        // Handle page navigation
        switch (page) {
            case 'home':
                window.scrollTo({ top: 0, behavior: 'smooth' });
                break;
            case 'projects':
                document.querySelector('.projects-section').scrollIntoView({ behavior: 'smooth' });
                break;
            default:
                break;
        }
    }

    handleDashboardNavigation() {
        if (!api.isAuthenticated()) {
            authHandler.showToast('Please login to access dashboard', 'error');
            return;
        }

        // For now, show a toast message. In a real app, this would navigate to dashboard.html
        authHandler.showToast('Dashboard feature coming soon!', 'info');
        
        // Update active nav link
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
        });
        document.getElementById('dashboardLink').classList.add('active');
    }

    handleAdminNavigation() {
        if (!api.isAuthenticated()) {
            authHandler.showToast('Please login to access admin panel', 'error');
            return;
        }

        if (!api.isAdmin()) {
            authHandler.showToast('Access denied. Admin privileges required.', 'error');
            return;
        }

        // For now, show a toast message. In a real app, this would navigate to admin.html
        authHandler.showToast('Admin dashboard coming soon!', 'info');
        
        // Update active nav link
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
        });
        document.getElementById('adminLink').classList.add('active');
    }

    initNavbarScroll() {
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;

        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    initHamburgerMenu() {
        const hamburger = document.getElementById('hamburger');
        const navMenu = document.getElementById('navMenu');
        
        if (!hamburger || !navMenu) return;

        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            
            // Toggle hamburger icon
            const icon = hamburger.querySelector('i');
            if (icon.classList.contains('fa-bars')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });

        // Close menu when clicking on a link
        const menuLinks = navMenu.querySelectorAll('a');
        menuLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                const icon = hamburger.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            });
        });
    }

    // ===== E-COMMERCE METHODS =====

    async loadCart() {
        if (!api.isAuthenticated()) {
            this.updateCartUI();
            return;
        }

        try {
            this.cart = await api.getCart();
            this.updateCartUI();
        } catch (error) {
            console.error('Failed to load cart:', error);
            this.cart = [];
            this.updateCartUI();
        }
    }

    updateCartUI() {
        const cartIcon = document.getElementById('cartIcon');
        const cartCount = document.getElementById('cartCount');

        if (api.isAuthenticated() && this.cart.length > 0) {
            cartIcon.style.display = 'block';
            cartCount.textContent = this.cart.length;
        } else {
            cartIcon.style.display = 'none';
        }
    }

    showCartModal() {
        if (!api.isAuthenticated()) {
            authHandler.showToast('Please login to view your cart', 'error');
            return;
        }

        const modal = document.getElementById('cartModal');
        if (!modal) return;

        this.renderCartItems();
        modal.style.display = 'block';
    }

    renderCartItems() {
        const cartItemsContainer = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');

        if (!cartItemsContainer || !cartTotal) return;

        if (this.cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="cart-empty">
                    <i class="fas fa-shopping-cart"></i>
                    <h3>Your cart is empty</h3>
                    <p>Add some projects to get started!</p>
                </div>
            `;
            cartTotal.textContent = '$0.00';
            return;
        }

        let total = 0;
        cartItemsContainer.innerHTML = this.cart.map(item => {
            const price = parseFloat(item.price || 0);
            total += price;
            return `
                <div class="cart-item">
                    <img src="${item.preview_media || '../pict/me6.png'}" 
                         alt="${item.name}" 
                         class="cart-item-image"
                         onerror="this.src='../pict/me6.png'">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-tech">${item.tech_stack}</div>
                        <div class="cart-item-price">$${price.toFixed(2)}</div>
                    </div>
                    <button class="cart-item-remove" onclick="appHandler.removeFromCart(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        }).join('');

        cartTotal.textContent = `$${total.toFixed(2)}`;
    }

    async removeFromCart(projectId) {
        try {
            await api.removeFromCart(projectId);
            this.cart = this.cart.filter(item => item.id !== projectId);
            this.updateCartUI();
            this.renderCartItems();
            
            // Update project card button
            const cartBtn = document.querySelector(`.cart-btn[data-project-id="${projectId}"]`);
            if (cartBtn) {
                cartBtn.classList.remove('added');
                cartBtn.innerHTML = '<i class="fas fa-heart"></i> Save';
            }
            
            authHandler.showToast('Removed from cart', 'success');
        } catch (error) {
            authHandler.showToast('Failed to remove item', 'error');
        }
    }

    bindCartEvents() {
        // Close cart modal
        const closeCart = document.getElementById('closeCart');
        if (closeCart) {
            closeCart.addEventListener('click', () => {
                document.getElementById('cartModal').style.display = 'none';
            });
        }

        // Clear cart
        const clearCartBtn = document.getElementById('clearCartBtn');
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', () => this.clearCart());
        }

        // Proceed to checkout
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => this.showCheckoutModal());
        }

        // Close modal when clicking outside
        const cartModal = document.getElementById('cartModal');
        if (cartModal) {
            cartModal.addEventListener('click', (e) => {
                if (e.target === cartModal) {
                    cartModal.style.display = 'none';
                }
            });
        }
    }

    async clearCart() {
        if (this.cart.length === 0) return;

        try {
            for (const item of this.cart) {
                await api.removeFromCart(item.id);
            }
            this.cart = [];
            this.updateCartUI();
            this.renderCartItems();
            authHandler.showToast('Cart cleared', 'success');
        } catch (error) {
            authHandler.showToast('Failed to clear cart', 'error');
        }
    }

    showCheckoutModal() {
        if (this.cart.length === 0) {
            authHandler.showToast('Your cart is empty', 'error');
            return;
        }

        const cartModal = document.getElementById('cartModal');
        const checkoutModal = document.getElementById('checkoutModal');

        if (cartModal) cartModal.style.display = 'none';
        if (checkoutModal) {
            this.renderCheckoutSummary();
            checkoutModal.style.display = 'block';
        }
    }

    renderCheckoutSummary() {
        const checkoutOrderSummary = document.getElementById('checkoutOrderSummary');
        const checkoutSubtotal = document.getElementById('checkoutSubtotal');
        const checkoutTax = document.getElementById('checkoutTax');
        const checkoutTotal = document.getElementById('checkoutTotal');

        if (!checkoutOrderSummary) return;

        let subtotal = 0;
        checkoutOrderSummary.innerHTML = this.cart.map(item => {
            const price = parseFloat(item.price || 0);
            subtotal += price;
            return `
                <div class="order-summary-item">
                    <span class="order-summary-name">${item.name}</span>
                    <span class="order-summary-price">$${price.toFixed(2)}</span>
                </div>
            `;
        }).join('');

        const tax = subtotal * 0.1; // 10% tax
        const total = subtotal + tax;

        if (checkoutSubtotal) checkoutSubtotal.textContent = `$${subtotal.toFixed(2)}`;
        if (checkoutTax) checkoutTax.textContent = `$${tax.toFixed(2)}`;
        if (checkoutTotal) checkoutTotal.textContent = `$${total.toFixed(2)}`;
    }

    bindCheckoutEvents() {
        // Close checkout modal
        const closeCheckout = document.getElementById('closeCheckout');
        if (closeCheckout) {
            closeCheckout.addEventListener('click', () => {
                document.getElementById('checkoutModal').style.display = 'none';
            });
        }

        // Back to cart
        const backToCartBtn = document.getElementById('backToCartBtn');
        if (backToCartBtn) {
            backToCartBtn.addEventListener('click', () => {
                document.getElementById('checkoutModal').style.display = 'none';
                this.showCartModal();
            });
        }

        // Checkout form submission
        const checkoutForm = document.getElementById('checkoutForm');
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', (e) => this.handleCheckout(e));
        }

        // Close modal when clicking outside
        const checkoutModal = document.getElementById('checkoutModal');
        if (checkoutModal) {
            checkoutModal.addEventListener('click', (e) => {
                if (e.target === checkoutModal) {
                    checkoutModal.style.display = 'none';
                }
            });
        }
    }

    async handleCheckout(e) {
        e.preventDefault();

        const customerName = document.getElementById('customerName').value;
        const customerEmail = document.getElementById('customerEmail').value;
        const customerPhone = document.getElementById('customerPhone').value;
        const customerAddress = document.getElementById('customerAddress').value;
        const orderNotes = document.getElementById('orderNotes').value;
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;

        if (!customerName || !customerEmail || !paymentMethod) {
            authHandler.showToast('Please fill in all required fields', 'error');
            return;
        }

        try {
            const orderData = {
                items: this.cart.map(item => ({
                    project_id: item.id,
                    project_name: item.name,
                    price: parseFloat(item.price || 0),
                    quantity: 1
                })),
                customer_name: customerName,
                customer_email: customerEmail,
                customer_phone: customerPhone,
                customer_address: customerAddress,
                notes: orderNotes
            };

            const order = await api.createOrder(orderData);

            // Process payment
            const paymentData = {
                payment_method: paymentMethod,
                amount: order.total_amount
            };

            const payment = await api.processPayment(order.id, paymentData);

            if (payment.status === 'completed') {
                // Clear cart
                this.cart = [];
                this.updateCartUI();

                // Show success modal
                this.showOrderSuccessModal(order.order_number, order.total_amount);
                
                // Close checkout modal
                document.getElementById('checkoutModal').style.display = 'none';
                
                authHandler.showToast('Order completed successfully!', 'success');
            } else {
                authHandler.showToast('Payment failed. Please try again.', 'error');
            }
        } catch (error) {
            authHandler.showToast(error.message || 'Checkout failed', 'error');
        }
    }

    showOrderSuccessModal(orderNumber, totalAmount) {
        const modal = document.getElementById('orderSuccessModal');
        if (!modal) return;

        document.getElementById('orderNumber').textContent = orderNumber;
        document.getElementById('orderAmount').textContent = `$${parseFloat(totalAmount).toFixed(2)}`;
        
        modal.style.display = 'block';
    }

    bindOrderSuccessEvents() {
        const closeOrderSuccess = document.getElementById('closeOrderSuccess');
        const viewOrdersBtn = document.getElementById('viewOrdersBtn');
        const continueShoppingBtn = document.getElementById('continueShoppingBtn');

        if (closeOrderSuccess) {
            closeOrderSuccess.addEventListener('click', () => {
                document.getElementById('orderSuccessModal').style.display = 'none';
            });
        }

        if (viewOrdersBtn) {
            viewOrdersBtn.addEventListener('click', () => {
                document.getElementById('orderSuccessModal').style.display = 'none';
                // In a real app, navigate to orders page
                authHandler.showToast('Orders page would open here', 'info');
            });
        }

        if (continueShoppingBtn) {
            continueShoppingBtn.addEventListener('click', () => {
                document.getElementById('orderSuccessModal').style.display = 'none';
            });
        }

        // Close modal when clicking outside
        const orderSuccessModal = document.getElementById('orderSuccessModal');
        if (orderSuccessModal) {
            orderSuccessModal.addEventListener('click', (e) => {
                if (e.target === orderSuccessModal) {
                    orderSuccessModal.style.display = 'none';
                }
            });
        }
    }

    // ===== CONTACT METHODS =====

    bindContactEvents() {
        // Contact navigation
        const contactLinks = document.querySelectorAll('[data-page="contact"]');
        contactLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.showContactModal();
            });
        });

        // Close contact modal
        const closeContact = document.getElementById('closeContact');
        if (closeContact) {
            closeContact.addEventListener('click', () => {
                document.getElementById('contactModal').style.display = 'none';
            });
        }

        // Contact form submission
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => this.handleContactSubmit(e));
        }

        // Close modal when clicking outside
        const contactModal = document.getElementById('contactModal');
        if (contactModal) {
            contactModal.addEventListener('click', (e) => {
                if (e.target === contactModal) {
                    contactModal.style.display = 'none';
                }
            });
        }
    }

    showContactModal() {
        const modal = document.getElementById('contactModal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    async handleContactSubmit(e) {
        e.preventDefault();

        const name = document.getElementById('contactName').value;
        const email = document.getElementById('contactEmail').value;
        const phone = document.getElementById('contactPhone').value;
        const subject = document.getElementById('contactSubject').value;
        const message = document.getElementById('contactMessage').value;
        const priority = document.getElementById('contactPriority').value;

        if (!name || !email || !subject || !message) {
            authHandler.showToast('Please fill in all required fields', 'error');
            return;
        }

        try {
            const contactData = {
                name,
                email,
                phone,
                subject,
                message,
                priority
            };

            const response = await api.submitContactForm(contactData);
            
            if (response.success) {
                // Reset form
                document.getElementById('contactForm').reset();
                
                // Close modal
                document.getElementById('contactModal').style.display = 'none';
                
                authHandler.showToast('Message sent successfully!', 'success');
            } else {
                authHandler.showToast(response.message || 'Failed to send message', 'error');
            }
        } catch (error) {
            authHandler.showToast('Failed to send message. Please try again.', 'error');
        }
    }

    // ===== AUTH UI METHODS =====

    updateAuthUI() {
        const isLoggedIn = api.isAuthenticated();
        const isAdmin = api.isAdmin();

        // Update navigation
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const dashboardLink = document.getElementById('dashboardLink');
        const adminLink = document.getElementById('adminLink');

        if (isLoggedIn) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (registerBtn) registerBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'block';
            if (dashboardLink) dashboardLink.style.display = 'block';
            if (adminLink && isAdmin) adminLink.style.display = 'block';
        } else {
            if (loginBtn) loginBtn.style.display = 'block';
            if (registerBtn) registerBtn.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (dashboardLink) dashboardLink.style.display = 'none';
            if (adminLink) adminLink.style.display = 'none';
        }

        // Update cart UI
        this.updateCartUI();
    }
}

// Initialize app handler when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.appHandler = new AppHandler();
});
