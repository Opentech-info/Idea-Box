// Contact Page Handler for AZsubay.dev School Project Platform

document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }

    // This assumes you have an authHandler instance available globally or imported
    // If not, you might need to instantiate it or include auth.js before this script.
    // For simplicity, we'll assume authHandler and its showToast method exist.
    if (typeof authHandler === 'undefined') {
        console.warn('authHandler is not defined. Toast notifications will not be shown.');
        // Define a dummy handler to prevent errors
        window.authHandler = {
            showToast: (message, type) => {
                console.log(`Toast [${type}]: ${message}`);
                alert(`[${type}]: ${message}`);
            }
        };
    }
});

async function handleContactSubmit(e) {
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
        const contactData = { name, email, phone, subject, message, priority };

        // Assumes an 'api' object is available globally from api.js
        const response = await api.submitContactForm(contactData);
        
        if (response.success) {
            document.getElementById('contactForm').reset();
            authHandler.showToast('Message sent successfully! We will get back to you soon.', 'success');
        } else {
            authHandler.showToast(response.message || 'Failed to send message', 'error');
        }
    } catch (error) {
        console.error('Contact form submission error:', error);
        authHandler.showToast('Failed to send message. Please try again later.', 'error');
    }
}