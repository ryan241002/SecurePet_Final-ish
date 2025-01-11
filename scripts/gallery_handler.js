document.addEventListener('DOMContentLoaded', function() {
    initializeGallery();
});

function initializeGallery() {
    fetchGalleryImages();
    setupUploadHandlers();
}

function fetchGalleryImages() {
    fetch('../php/fetch_gallery.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayGalleryImages(data.images);
            } else {
                console.error('Failed to fetch gallery images:', data.message);
            }
        })
        .catch(error => console.error('Error fetching gallery:', error));
}

function displayGalleryImages(images) {
    const galleryContainer = document.querySelector('.picture-in-gallery');
    if (!galleryContainer) return;

    galleryContainer.innerHTML = '';
    
    images.forEach(imagePath => {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'gallery-image-container';
        
        const img = document.createElement('img');
        img.src = `../uploads/gallery/${imagePath}`;
        img.alt = 'Pet photo';
        img.className = 'gallery-image';
        
        imgContainer.appendChild(img);
        galleryContainer.appendChild(imgContainer);
    });
}

function setupUploadHandlers() {
    if (!document.getElementById('uploadModal')) {
        const modalHtml = `
            <div id="uploadModal" class="modal">
                <div class="modal-content">
                    <span class="close-upload-modal">&times;</span>
                    <h2>Upload Photos</h2>
                    <form id="uploadForm" enctype="multipart/form-data">
                        <input type="file" id="photoUpload" name="photos[]" accept="image/jpeg,image/png,image/gif" multiple>
                        <div class="upload-info">
                            <p>Maximum file size: 15MB</p>
                            <p>Accepted formats: JPG, PNG, GIF</p>
                        </div>
                        <button type="submit">Upload</button>
                    </form>
                    <div id="uploadPreview"></div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    // Add gallery styles
    addGalleryStyles();
}

function openUploadModal() {
    const modal = document.getElementById('uploadModal');
    if (!modal) return;

    modal.style.display = 'block';

    // Add event listeners
    modal.onclick = function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    };

    const closeBtn = modal.querySelector('.close-upload-modal');
    if (closeBtn) {
        closeBtn.onclick = function() {
            modal.style.display = 'none';
        };
    }

    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        uploadForm.onsubmit = handlePhotoUpload;
    }
}

async function handlePhotoUpload(e) {
    e.preventDefault();
    
    const formData = new FormData();
    const fileInput = document.getElementById('photoUpload');
    
    if (!fileInput || !fileInput.files.length) {
        alert('Please select at least one photo');
        return;
    }

    // Append all files to formData
    Array.from(fileInput.files).forEach(file => {
        formData.append('photos[]', file);
    });

    try {
        const response = await fetch('../php/upload_gallery.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        
        if (data.success) {
            // Check individual file upload results
            const failures = data.files.filter(f => !f.success);
            if (failures.length > 0) {
                alert('Some files failed to upload:\n' + 
                      failures.map(f => `${f.name}: ${f.message}`).join('\n'));
            } else {
                alert('Photos uploaded successfully!');
            }
            
            document.getElementById('uploadModal').style.display = 'none';
            document.getElementById('uploadForm').reset();
            fetchGalleryImages(); // Refresh gallery
        } else {
            alert('Error uploading photos: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while uploading photos');
    }
}

function addGalleryStyles() {
    if (document.getElementById('gallery-styles')) return;

    const styles = `
        .picture-in-gallery {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            grid-template-rows: repeat(2, 1fr);
            gap: 10px;
            padding: 20px;
            padding-top:25px;
            height: 80%;
            overflow-y: auto;
            scrollbar-width: thin;
        }

        .gallery-image-container {
            position: relative;
            width: 100%;
            padding-bottom: 100%; /* Creates a square aspect ratio */
            overflow: hidden;
            border-radius: 8px;
            cursor: pointer;
            transition: transform 0.3s ease;
        }

        .gallery-image {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        /* Rest of modal styles remain the same */
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.6);
            animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .modal-content {
            background-color: white;
            margin: 10% auto;
            padding: 20px;
            width: 80%;
            max-width: 500px;
            border-radius: 8px;
            position: relative;
            animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
            from {
                transform: translateY(-20px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        /* Upload form styles */
        #uploadForm {
            margin: 20px 0;
        }

        #uploadForm button {
            background-color: #4CAF50;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.2s;
        }

        #uploadForm button:hover {
            background-color: #45a049;
        }

        #photoUpload {
            margin: 10px 0;
            padding: 10px;
            border: 2px dashed #ddd;
            border-radius: 4px;
            width: 100%;
            transition: border-color 0.2s;
        }

        #photoUpload:hover {
            border-color: #4CAF50;
        }

        /* Preview grid in upload modal */
        #uploadPreview {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1px;
            margin-top: 15px;
        }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.id = 'gallery-styles';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
} 