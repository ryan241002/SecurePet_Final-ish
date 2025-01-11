function toggleBioEdit() {
    const bioText = document.getElementById('bioText');
    const bioEditor = document.getElementById('bioEditor');
    const editButton = document.querySelector('.edit-bio-btn');

    if (bioText.style.display !== 'none') {
        // Switch to edit mode
        bioEditor.value = bioText.innerText;
        bioText.style.display = 'none';
        bioEditor.style.display = 'block';
        editButton.textContent = 'Save';
        
        // Enhanced textarea styling
        bioEditor.style.width = '90%';
        bioEditor.style.height = '100px';
        bioEditor.style.padding = '8px';
        bioEditor.style.marginBottom = '10px';
        bioEditor.style.fontFamily = 'Inria Serif';
        bioEditor.style.fontSize = '19px';
        bioEditor.style.border = '1px solid rgba(200, 201, 227, 1)';
        bioEditor.style.borderRadius = '5px';
        bioEditor.style.resize = 'none';
        
        // Auto focus the editor
        bioEditor.focus();
    } else {
        // Save changes and switch back to display mode
        const newBio = bioEditor.value.trim();
        
        // Create FormData and append Description
        const formData = new FormData();
        formData.append('Description', newBio);

        // Send to server
        fetch('../php/update_pet.php', {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                bioText.innerText = newBio;
                bioText.style.display = 'block';
                bioEditor.style.display = 'none';
                editButton.textContent = 'Edit bio';
            } else {
                alert('Error updating bio: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while updating the bio.');
        });
    }
} 