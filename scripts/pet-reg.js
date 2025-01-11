let cropper;
const modal = document.getElementById('cropModal');
const imagePreview = document.getElementById('imagePreview');

// Function to toggle modal and body scroll
function toggleModal(show) {
    modal.style.display = show ? 'block' : 'none';
    document.body.style.overflow = show ? 'hidden' : 'auto';
}

document.getElementById('photo').addEventListener('change', function(e) {
    if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            toggleModal(true);
            
            if (cropper) {
                cropper.destroy();
            }
            
            cropper = new Cropper(imagePreview, {
                aspectRatio: 1,
                viewMode: 2,
                dragMode: 'move',
                guides: true,
                center: true,
                highlight: true,
                cropBoxResizable: true,
                cropBoxMovable: true,
                minContainerWidth: 300,
                minContainerHeight: 300,
                modal: true
            });
        };
        
        reader.readAsDataURL(e.target.files[0]);
    }
});

// Crop Button Handler
document.getElementById('cropButton').addEventListener('click', function() {
    try {
        const canvas = cropper.getCroppedCanvas({
            width: 300,
            height: 300,
        });
        
        canvas.toBlob(function(blob) {
            if (!blob) {
                throw new Error('Failed to create image blob');
            }
            
            const croppedFile = new File([blob], 'cropped.jpg', { type: 'image/jpeg' });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(croppedFile);
            document.getElementById('photo').files = dataTransfer.files;
            
            toggleModal(false);
            cropper.destroy();
        }, 'image/jpeg');
    } catch (error) {
        console.error('Error during image cropping:', error);
        alert('Failed to process image. Please try again.');
        toggleModal(false);
        if (cropper) {
            cropper.destroy();
        }
        document.getElementById('photo').value = '';
    }
});

// Cancel Button Handler
document.getElementById('cancelButton').addEventListener('click', function() {
    toggleModal(false);
    cropper.destroy();
    document.getElementById('photo').value = '';
});

// Close Modal Handler
document.querySelector('.close').addEventListener('click', function() {
    toggleModal(false);
    cropper.destroy();
    document.getElementById('photo').value = '';
});

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target == modal) {
        toggleModal(false);
        cropper.destroy();
        document.getElementById('photo').value = '';
    }
};

// Prevent modal close when clicking inside modal content
document.querySelector('.modal-content').addEventListener('click', function(e) {
    e.stopPropagation();
});

document.addEventListener('DOMContentLoaded', function() {
    const csrfToken = generateCSRFToken();
    document.getElementById('csrf_token').value = csrfToken;
});

document.getElementById("petRegForm").addEventListener("submit", function(event) {
    event.preventDefault();
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Registering...';

    const formData = new FormData(this);

    fetch('../php/pet-reg.php', {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json',
            'X-CSRF-TOKEN': sessionStorage.getItem('csrf_token')
        },
        credentials: 'same-origin'
    })
    .then(response => {
        if (response.redirected || response.url.includes('home.html')) {
            window.location.href = '../html/home.html';
            return;
        }
        return response.json();
    })
    .then(data => {
        if (data) {  // Only handle data if it exists (not redirected)
            if (data.status === 'error') {
                console.error(data.message);
                alert(data.message);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Register Pet';
            }
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Register Pet';
    });
});

function generateCSRFToken() {
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    
    sessionStorage.setItem('csrf_token', token);
    return token;
}