// Move fetchLostPets outside the DOMContentLoaded event listener
function fetchLostPets() {
    showLoading();
    
    fetch('../php/get_lost_pets.php')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                allPets = data.data.sort((a, b) => 
                    new Date(b.Alert_DateTime) - new Date(a.Alert_DateTime)
                );
                // Add slight delay to show loading animation
                setTimeout(() => {
                    displayPets(allPets);
                }, 500);
            } else {
                throw new Error(data.message);
            }
        })
        .catch(error => {
            const petsContainer = document.querySelector('.pets-content');
            petsContainer.innerHTML = `
                <div class="loading-container">
                    <p>Failed to load lost pets. Please try again.</p>
                    <button onclick="fetchLostPets()" class="retry-btn">Retry</button>
                </div>
            `;
            console.error('Error:', error);
        });
}

// Also move allPets to global scope
let allPets = [];

document.addEventListener('DOMContentLoaded', function() {
    const petGrid = document.querySelector('.lost-pets');
    const searchBar = document.querySelector('.search-bar');

    // Initial fetch of lost pets
    fetchLostPets();

    // Add search functionality
    searchBar.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const filteredPets = allPets.filter(pet => 
            pet.Pet_Name.toLowerCase().includes(searchTerm) ||
            pet.Location.toLowerCase().includes(searchTerm)
        );
        displayPets(filteredPets);
    });
});

function displayPets(pets) {
    const petsContainer = document.querySelector('.pets-content');
    
    if (pets.length === 0) {
        petsContainer.innerHTML = `
            <div class="no-pets-message">
                <p>No lost pets found.</p>
            </div>
        `;
        return;
    }

    petsContainer.innerHTML = '';
    pets.forEach(pet => {
        const petCard = createPetCard(pet);
        petsContainer.appendChild(petCard);
    });
}

function createPetCard(pet) {
    const card = document.createElement('div');
    card.className = 'pet-grid';
    
    const timeSinceLost = getTimeSinceLost(pet.Alert_DateTime);
    const timeClass = getTimeClass(pet.Alert_DateTime);
    
    // Clean up description
    const cleanDescription = pet.Description.replace('🚨 LOST PET ALERT 🚨', '').trim();
    const truncatedDescription = cleanDescription.length > 150 
        ? cleanDescription.substring(0, 150) + '...' 
        : cleanDescription;
    
    // Prepare image gallery HTML
    const images = pet.Images && pet.Images.length > 0 
        ? pet.Images 
        : ['default-pet.jpg'];
    
    const imageGalleryHTML = `
        <div class="image-slider">
            <div class="slider-container">
                ${images.map((img, index) => `
                    <div class="slide ${index === 0 ? 'active' : ''}" data-index="${index}">
                        <img src="../uploads/lost_pets/${img}" alt="${pet.Pet_Name} - Image ${index + 1}">
                        <div class="image-counter">${index + 1}/${images.length}</div>
                    </div>
                `).join('')}
            </div>
            
            <div class="slider-controls">
                <button class="slider-arrow prev">&#10094</button>
                <button class="slider-arrow next">&#10095;</button>
            </div>
            
            <div class="slider-dots">
                ${images.map((_, index) => `
                    <span class="dot ${index === 0 ? 'active' : ''}" data-index="${index}"></span>
                `).join('')}
            </div>
        </div>
    `;

    card.innerHTML = `
        <div class="upper-pet-grid">
            <div class="user-name">
                <a>${pet.First_Name}</a>
            </div>
        </div>

        <div class="middle-pet-grid">
            <div class="pet-profile-pic">
                ${imageGalleryHTML}
            </div>

            <div class="pet-lost-btn-grid">
                <div class="found">
                    <button onclick="showReportForm(${pet.Alert_ID})" class="found-btn">Found</button>
                </div>

                <div class="msg">
                    <button onclick="sendEmail('${pet.Username}')" class="msg-btn">Message</button>
                </div>

                <div class="call">
                    <button onclick="showPhone('${pet.Phone}')" class="call-btn">Call</button>
                </div>
            </div>
        </div>

        <div class="bottom-pet-grid">
            <div class="owner-caption">
                <a><strong>Address:</strong> ${pet.Location}</a>
                <div class="time-lost ${timeClass}">${timeSinceLost}</div>
                <div class="description-container">
                    <p class="description-text">${truncatedDescription}</p>
                    ${cleanDescription.length > 150 ? `
                        <p class="full-description" style="display: none;">${cleanDescription}</p>
                        <button class="see-more-btn">See more</button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    // Add slider functionality
    initializeSlider(card);
    
    // Add see more functionality
    const seeMoreBtn = card.querySelector('.see-more-btn');
    if (seeMoreBtn) {
        seeMoreBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const descContainer = this.closest('.description-container');
            const shortDesc = descContainer.querySelector('.description-text');
            const fullDesc = descContainer.querySelector('.full-description');
            
            if (this.textContent === 'See more') {
                shortDesc.style.display = 'none';
                fullDesc.style.display = 'block';
                this.textContent = 'See less';
            } else {
                shortDesc.style.display = 'block';
                fullDesc.style.display = 'none';
                this.textContent = 'See more';
            }
        });
    }
    
    return card;
}

function initializeSlider(card) {
    const slider = card.querySelector('.image-slider');
    const slides = slider.querySelectorAll('.slide');
    const dots = slider.querySelectorAll('.dot');
    const prevBtn = slider.querySelector('.prev');
    const nextBtn = slider.querySelector('.next');
    let currentIndex = 0;

    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        slides[index].classList.add('active');
        dots[index].classList.add('active');
        currentIndex = index;
    }

    function nextSlide() {
        const newIndex = (currentIndex + 1) % slides.length;
        showSlide(newIndex);
    }

    function prevSlide() {
        const newIndex = (currentIndex - 1 + slides.length) % slides.length;
        showSlide(newIndex);
    }

    // Event listeners
    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        prevSlide();
    });

    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        nextSlide();
    });

    dots.forEach((dot, index) => {
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            showSlide(index);
        });
    });

    // Modal functionality
    slider.addEventListener('click', () => {
        const modalHTML = `
            <div class="image-modal">
                <div class="modal-content">
                    <span class="close-modal">&times;</span>
                    <img src="${slides[currentIndex].querySelector('img').src}" alt="Full size image">
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = document.querySelector('.image-modal');
        const closeBtn = modal.querySelector('.close-modal');

        closeBtn.addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    });
}

function getTimeSinceLost(dateString) {
    const lostDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - lostDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffDays > 0) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
        return 'Just now';
    }
}

// Add this new function to determine time class
function getTimeClass(dateString) {
    const lostDate = new Date(dateString);
    const now = new Date();
    const diffHours = Math.abs(now - lostDate) / (1000 * 60 * 60);
    
    if (diffHours < 24) {
        return 'recent';
    } else if (diffHours < 72) {
        return 'medium';
    } else {
        return 'urgent';
    }
}

// Utility functions
function showPhone(phone) {
    const formattedPhone = phone ? phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3') : 'No phone number provided';
    alert(`Contact Number: ${formattedPhone}`);
}

function sendEmail(username) {
    // Implement email functionality or redirect to email client
    // You could use mailto: or implement in-app messaging later
    window.location.href = `mailto:${username}@yourdomain.com`;
}

function markAsFound(alertId) {
    // Implement status update functionality
    if(confirm('Mark this pet as found?')) {
        // Add API call to update status
        console.log('Marking pet as found:', alertId);
    }
}

function handleMessage(firstName) {
    if (confirm(`Would you like to send a message to ${firstName}?`)) {
        // Implement messaging functionality
        console.log('Messaging:', firstName);
    }
}

// Add this to your existing JavaScript
function showLoading() {
    const petsContainer = document.querySelector('.pets-content');
    petsContainer.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <div class="loading-text">Loading lost pets...</div>
        </div>
    `;
}

// Add these functions for the reporting functionality
function showReportForm(alertId) {
    // Use existing check_session.php
    fetch('../php/check_session.php')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                displayReportForm(alertId);
            } else {
                showNotification('Please log in to report a pet sighting', 'error');
                // Optional: Redirect to login page
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            }
        })
        .catch(error => {
            console.error('Error checking session:', error);
            showNotification('Something went wrong. Please try again.', 'error');
        });
}

// Move the form display logic to a separate function
function displayReportForm(alertId) {
    const modal = document.createElement('div');
    modal.className = 'report-modal';
    
    modal.innerHTML = `
        <div class="report-form">
            <h3 style="text-align: center; margin-bottom: 20px; font-family: 'Inria Sans', sans-serif;">Report Pet Sighting</h3>
            <form id="sightingForm">
                <div class="form-group">
                    <label for="location">Location where pet was seen *</label>
                    <input type="text" 
                           id="location" 
                           name="location" 
                           placeholder="Enter the location details"
                           required>
                </div>

                <div class="form-group">
                    <label for="datetime">Date and Time of sighting *</label>
                    <input type="datetime-local" 
                           id="datetime" 
                           name="datetime"
                           required>
                </div>

                <div class="form-group">
                    <label for="details">Additional Details</label>
                    <textarea id="details" 
                            name="details" 
                            rows="4" 
                            placeholder="Describe the condition of the pet, what it was doing, any distinguishing features you noticed, etc."
                    ></textarea>
                </div>

                <div class="form-group">
                    <label for="photo">Upload Photo (optional)</label>
                    <input type="file" 
                           id="photo" 
                           name="photo"
                           accept="image/*">
                </div>

                <div class="form-buttons">
                    <button type="button" 
                            class="cancel-btn" 
                            onclick="closeReportForm()">
                        Cancel
                    </button>
                    <button type="submit" 
                            class="submit-btn">
                        Submit Report
                    </button>
                </div>
            </form>
        </div>
    `;

    // Add click event to close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeReportForm();
        }
    });

    document.body.appendChild(modal);

    // Set default datetime to current
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('datetime').value = now.toISOString().slice(0, 16);

    // Add form submission handler
    document.getElementById('sightingForm').addEventListener('submit', (e) => {
        e.preventDefault();
        submitSightingReport(alertId);
    });
}

function closeReportForm() {
    const modal = document.querySelector('.report-modal');
    if (modal) {
        modal.remove();
    }
}

function submitSightingReport(alertId) {
    const form = document.getElementById('sightingForm');
    const formData = new FormData(form);
    
    // Show loading state
    const submitBtn = document.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;

    // Create the data object
    const reportData = {
        alert_id: alertId,
        location: formData.get('location'),
        datetime: formData.get('datetime'),
        details: formData.get('details')
    };

    console.log('Sending data:', reportData); // Debug log

    fetch('../php/submit_sighting.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
        credentials: 'include' // Include session cookies
    })
    .then(response => {
        console.log('Raw response:', response); // Debug log
        return response.json();
    })
    .then(data => {
        console.log('Response data:', data); // Debug log
        if (data.status === 'success') {
            showNotification('Thank you! The pet owner has been notified of your report.');
            closeReportForm();
        } else {
            throw new Error(data.message || 'Failed to submit report');
        }
    })
    .catch(error => {
        console.error('Error:', error); // Debug log
        showNotification('Failed to submit report. Please try again.', 'error');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    });
}

// Add notification function
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateY(0)';
        notification.style.opacity = '1';
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateY(-100%)';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
} 