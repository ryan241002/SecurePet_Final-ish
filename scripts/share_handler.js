// Share Modal Functions
function openShareModal() {
    // Create a more informative initial modal
    const modalHtml = `
        <div id="shareModal" class="modal">
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>Lost Pet Alert</h2>
                
                <div class="share-options">
                    <div class="platform-selection">
                        <label class="platform-option">
                            <input type="checkbox" id="postToWebsite" checked>
                            <span class="platform-icon">🌐</span>
                            Post to SecurePet Website
                        </label>
                        
                        <label class="platform-option">
                            <input type="checkbox" id="postToFacebook" checked>
                            <span class="platform-icon">📘</span>
                            Share on Facebook
                        </label>
                    </div>

                    <div class="image-upload-section">
                        <h3>Upload Images (up to 5)</h3>
                        <input type="file" id="petPhotos" accept="image/*" multiple>
                        <div id="imagePreviewGrid"></div>
                    </div>

                    <button class="continue-btn" onclick="proceedWithShare()">
                        Continue
                    </button>
                </div>
            </div>
        </div>
    `;

    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    addModalStyles();
}

function setupImagePreview() {
    const imageInput = document.getElementById('petPhotos');
    const previewGrid = document.getElementById('imagePreviewGrid');

    imageInput.addEventListener('change', function(e) {
        previewGrid.innerHTML = '';
        const files = Array.from(e.target.files).slice(0, 5); // Limit to 5 images

        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.createElement('div');
                preview.className = 'image-preview';
                preview.innerHTML = `
                    <img src="${e.target.result}">
                    <button class="remove-image" onclick="this.parentElement.remove()">×</button>
                `;
                previewGrid.appendChild(preview);
            };
            reader.readAsDataURL(file);
        });
    });
}

function proceedWithShare() {
    const postToWebsite = document.getElementById('postToWebsite').checked;
    const postToFacebook = document.getElementById('postToFacebook').checked;
    
    if (!postToWebsite && !postToFacebook) {
        alert('Please select at least one platform to share to.');
        return;
    }

    // Get pet data and create message
    const petData = collectPetData();
    showContentEditor(petData, postToWebsite, postToFacebook);
}

function collectPetData() {
    return {
        petName: document.querySelector(".name-of-pet").textContent,
        location: document.querySelector(".address").textContent.replace('Address :', '').trim(),
        age: document.querySelector(".age-of-pet").textContent,
        breed: document.querySelector(".breed-of-pet").textContent,
        sex: document.querySelector(".sex-of-pet").textContent,
        description: document.querySelector("#bioText").textContent
    };
}

function showContentEditor(petData, postToWebsite, postToFacebook) {
    const initialMessage = createInitialMessage(petData);
    const files = document.getElementById('petPhotos').files; // Get files before removing first modal
    
    const editorHtml = `
        <div id="contentEditor" class="modal">
            <div class="modal-content-editor">
                <span class="close">&times;</span>
                <h2>Customize Your Alert</h2>

                <div class="platforms-summary">
                    Sharing to: 
                    ${postToWebsite ? '<span class="platform-badge website">SecurePet Website</span>' : ''}
                    ${postToFacebook ? '<span class="platform-badge facebook">Facebook</span>' : ''}
                </div>

                <div class="message-section">
                    <h3>Alert Message</h3>
                    <textarea id="messageEdit">${initialMessage}</textarea>
                </div>

                <div class="contact-section">
                    <h3>Contact Information</h3>
                    <input type="text" id="contactInfo" placeholder="Enter your contact information">
                </div>

                <div id="imagePreviewGrid"></div>
                <input type="file" id="petPhotos" style="display: none;" multiple>

                <div class="button-section">
                    <button class="publish-btn" onclick="publishAlert(${postToWebsite}, ${postToFacebook})">
                        Publish Alert
                    </button>
                </div>
            </div>
        </div>
    `;

    // Replace first modal with editor
    document.getElementById('shareModal').remove();
    document.body.insertAdjacentHTML('beforeend', editorHtml);
    
    // Transfer files to new input if any exist
    const newFileInput = document.getElementById('petPhotos');
    if (files && files.length > 0) {
        const dataTransfer = new DataTransfer();
        Array.from(files).forEach(file => dataTransfer.items.add(file));
        newFileInput.files = dataTransfer.files;
        
        // Show previews
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.createElement('div');
                preview.className = 'image-preview';
                preview.innerHTML = `
                    <img src="${e.target.result}">
                    <button class="remove-image" onclick="removeImage(this, '${file.name}')">×</button>
                `;
                document.getElementById('imagePreviewGrid').appendChild(preview);
            };
            reader.readAsDataURL(file);
        });
    }

    addEditorStyles();
}

async function publishAlert(postToWebsite, postToFacebook) {
    const message = document.getElementById('messageEdit').value;
    const contactInfo = document.getElementById('contactInfo').value;
    const fileInput = document.getElementById('petPhotos');
    const files = fileInput ? fileInput.files : [];

    if (!message.trim()) {
        alert('Please enter a message');
        return;
    }

    try {
        // First, handle website posting if selected
        if (postToWebsite) {
            const websiteResponse = await handleWebsitePost(message, contactInfo, files);
            if (!websiteResponse.success) {
                throw new Error('Failed to post to website');
            }
        }

        // Then handle Facebook posting if selected
        if (postToFacebook) {
            await handleFacebookPost(message, contactInfo);
        }

        alert('Alert published successfully!');
        document.getElementById('contentEditor').remove();

    } catch (error) {
        alert('Error publishing alert: ' + error.message);
    }
}

async function handleWebsitePost(message, contactInfo, files) {
    const formData = new FormData();
    formData.append('description', message);
    formData.append('contact', contactInfo);
    
    // Append each photo if there are any
    if (files && files.length > 0) {
        Array.from(files).forEach((file, index) => {
            formData.append(`photo_${index}`, file);
        });
    }

    const response = await fetch('../php/save_lost_alert.php', {
        method: 'POST',
        body: formData
    });

    return response.json();
}

function handleFacebookPost(message, contactInfo) {
    return new Promise((resolve, reject) => {
        FB.ui({
            method: 'share',
            href: 'https://www.facebook.com/profile.php?id=61570443686680',
            quote: `${message}\n\nContact: ${contactInfo}`,
        }, function(response) {
            if (response && !response.error_message) {
                resolve(response);
            } else {
                reject(new Error('Facebook sharing failed'));
            }
        });
    });
}

// Facebook SDK Initialization
window.fbAsyncInit = function() {
    FB.init({
        appId: '939900814742628',
        xfbml: true,
        version: 'v21.0'
    });
};

(function(d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s); js.id = id;
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

// Share Functions
function shareToFacebook() {
    // Get pet data from the page
    const petName = document.querySelector(".name-of-pet").textContent;
    const location = document.querySelector(".address").textContent.replace('Address :', '').trim();
    const age = document.querySelector(".age-of-pet").textContent;
    const breed = document.querySelector(".breed-of-pet").textContent;
    const sex = document.querySelector(".sex-of-pet").textContent;
    const description = document.querySelector("#bioText").textContent;

    // Create initial message
    const initialMessage = `🚨 LOST PET ALERT 🚨\n\n` +
        `My ${breed}, ${petName}, is missing!\n\n` +
        `Details:\n` +
        `• Age: ${age}\n` +
        `• Sex: ${sex}\n` +
        `• Last seen: ${location}\n\n` +
        `Additional Information:\n${description}\n\n` +
        `Please contact me if you have any information. Share this post to help bring ${petName} home! 🙏`;

    // Show edit modal
    const modalHtml = `
        <div id="shareEditModal" class="modal">
            <div class="modal-content-customise">
                <span class="close">&times;</span>
                <h2>Customize Your Lost Pet Alert</h2>
                
                <div class="photo-section">
                    <h3>Upload Photo</h3>
                    <input type="file" id="petPhoto" accept="image/*">
                    <div id="photoPreview"></div>
                </div>

                <div class="message-section">
                    <h3>Edit Message</h3>
                    <textarea id="messageEdit" style="width: 100%; height: 200px;">${initialMessage}</textarea>
                </div>

                <div class="contact-section">
                    <h3>Contact Information</h3>
                    <input type="text" id="contactInfo" placeholder="Enter your contact information">
                </div>

                <div class="button-section">
                    <button onclick="publishToFacebook()">Share on Facebook</button>
                </div>
            </div>
        </div>
    `;

    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Style the modal
    const modalStyles = `
        <style>
            .modal {
                display: block;
                position: fixed;
                z-index: 1000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0,0,0,0.4);
            }

            .modal-content-customise {
                background-color: white;
                border: 1px solid #888;
                margin: 15% auto;
                padding: 30px;
                width: 80%;
                max-width: 400px;
                border-radius: 15px;
                margin-bottom: 100px;
                margin-top:100px;
            }
                
            .close {
                float: right;
                cursor: pointer;
                font-size: 28px;
            }
                
            .photo-section, .message-section, .contact-section {
                margin: 20px 0;
                
            }
            #photoPreview img {
                max-width: 200px;
                margin-top: 10px;
            }
            #messageEdit {
                font-family: Arial, sans-serif;
                padding: 10px;
                margin-top:-1px
                
            }
            #contactInfo {
                width: 100%;
                padding: 8px;

            }
            .button-section {
                text-align: center;
                margin-top: 20px;
            }
            .button-section button {
                padding: 10px 20px;
                background-color: #1877f2;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
        </style>
    `;
    document.head.insertAdjacentHTML('beforeend', modalStyles);

    // Handle photo preview
    document.getElementById('petPhoto').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('photoPreview').innerHTML = 
                    `<img src="${e.target.result}">`;
            };
            reader.readAsDataURL(file);
        }
    });

    // Handle modal close
    document.querySelector('.close').onclick = function() {
        document.getElementById('shareEditModal').remove();
    };
}

function publishToFacebook() {
    const message = document.getElementById('messageEdit').value;
    const contactInfo = document.getElementById('contactInfo').value;
    const photoFile = document.getElementById('petPhoto').files[0];
    const uploadToWebsite = document.getElementById('websiteUpload').checked;

    // Combine message with contact info
    const finalMessage = message + '\n\nContact: ' + contactInfo;

    // If website upload is checked, save to database first
    if (uploadToWebsite) {
        const formData = new FormData();
        formData.append('description', message);
        formData.append('photo', photoFile);
        
        fetch('../php/save_lost_alert.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                console.error('Error saving to website:', data.error);
            }
        })
        .catch(error => {
            console.error('Error saving to website:', error);
        });
    }

    // Continue with Facebook sharing
    if (photoFile) {
        // If there's a photo, we need to upload it first
        const formData = new FormData();
        formData.append('photo', photoFile);
        formData.append('message', finalMessage);

        fetch('upload_to_facebook.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Posted successfully!');
                document.getElementById('shareEditModal').remove();
            } else {
                alert('Error posting: ' + data.error);
            }
        })
        .catch(error => {
            alert('Error posting: ' + error);
        });
    } else {
        // If no photo, just share the message
        FB.ui({
            method: 'share',
            href: 'https://www.facebook.com/profile.php?id=61570443686680',
            quote: finalMessage,
        }, function(response){
            if (response && !response.error_message) {
                alert('Posting completed.');
                document.getElementById('shareEditModal').remove();
            } else {
                alert('Error while posting.');
            }
        });
    }
}

function addModalStyles() {
    // Check if styles are already added
    if (document.getElementById('modal-styles')) return;

    const styles = `
        .modal {
            display: block;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.6);
            overflow-y: auto;
        }

        .modal-content {
            background-color: white;
            border-radius: 15px;
            margin: 50px auto;
            padding: 30px;
            width: 90%;
            max-width: 600px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            position: relative;
        }

        .close-modal {
            position: absolute;
            right: 20px;
            top: 15px;
            font-size: 24px;
            cursor: pointer;
            color: #666;
        }

        .platform-selection {
            margin: 20px 0;
        }

        .platform-option {
            display: flex;
            align-items: center;
            padding: 12px;
            margin: 8px 0;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            cursor: pointer;
        }

        .platform-icon {
            font-size: 20px;
            margin-right: 12px;
        }

        .image-upload-section {
            margin: 20px 0;
        }

        #imagePreviewGrid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 10px;
            margin-top: 15px;
        }

        .image-preview {
            position: relative;
            aspect-ratio: 1;
            border-radius: 8px;
            overflow: hidden;
        }

        .image-preview img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .remove-image {
            position: absolute;
            top: 5px;
            right: 5px;
            background: rgba(0,0,0,0.5);
            color: white;
            border: none;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .continue-btn {
            width: 100%;
            padding: 12px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            margin-top: 20px;
        }

        .continue-btn:hover {
            background-color: #45a049;
        }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.id = 'modal-styles';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    // Add event listener to close modal when clicking outside
    document.querySelector('.modal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.remove();
        }
    });

    // Add event listener to close button
    document.querySelector('.close-modal').addEventListener('click', function() {
        document.querySelector('.modal').remove();
    });
}

// Also add this function for the editor styles
function addEditorStyles() {
    // Check if styles are already added
    if (document.getElementById('editor-styles')) return;

    const styles = `
        .modal-content-editor {
            background-color: white;
            border-radius: 15px;
            margin: 50px auto;
            padding: 30px;
            width: 90%;
            max-width: 600px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }

        .platforms-summary {
            margin: 15px 0;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }

        .platform-badge {
            padding: 8px 15px;
            border-radius: 20px;
            font-size: 14px;
        }

        .platform-badge.website {
            background-color: #e3f2fd;
            color: #1565c0;
        }

        .platform-badge.facebook {
            background-color: #e8f0fe;
            color: #1877f2;
        }

        .message-section, .contact-section {
            margin: 20px 0;
        }

        #messageEdit {
            width: 100%;
            min-height: 200px;
            padding: 15px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            margin: 10px 0;
            font-family: inherit;
            resize: vertical;
        }

        #contactInfo {
            width: 100%;
            padding: 12px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
        }

        .publish-btn {
            width: 100%;
            padding: 12px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            margin-top: 20px;
        }

        .publish-btn:hover {
            background-color: #45a049;
        }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.id = 'editor-styles';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}

function createInitialMessage(petData) {
    return `🚨 LOST PET ALERT 🚨

My ${petData.breed}, ${petData.petName}, is missing!

Details:
• Age: ${petData.age}
• Sex: ${petData.sex}
• Last seen: ${petData.location}

Additional Information:
${petData.description}

Please contact me if you have any information. Share this post to help bring ${petData.petName} home! 🙏`;
}

