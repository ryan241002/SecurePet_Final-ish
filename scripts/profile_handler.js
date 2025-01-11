let isEditing = false;
const originalValues = {};

function toggleEditMode() {
    isEditing = !isEditing;
    const editBtn = document.querySelector('.edit-profile-btn');
    
    if (isEditing) {
        editBtn.innerHTML = 'Save';
        editBtn.classList.add('save-mode');
        makeFieldsEditable();
    } else {
        // Save changes
        saveChanges();
        editBtn.innerHTML = `
            <svg class="svg" viewBox="0 0 512 512">
                <path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z"></path>
            </svg>`;
        editBtn.classList.remove('save-mode');
    }
}

function makeFieldsEditable() {
    const editableFields = document.querySelectorAll('[data-field]');
    
    editableFields.forEach(field => {
        const fieldType = field.getAttribute('data-field');
        originalValues[fieldType] = field.textContent;
        
        let input;
        
        if (fieldType === 'Category') {
            input = document.createElement('select');
            ['Dog', 'Cat', 'Other'].forEach(option => {
                const opt = document.createElement('option');
                opt.value = option;
                opt.textContent = option;
                opt.selected = option === field.textContent;
                input.appendChild(opt);
            });
        } else if (fieldType === 'Sex') {
            input = document.createElement('select');
            ['Male', 'Female'].forEach(option => {
                const opt = document.createElement('option');
                opt.value = option;
                opt.textContent = option;
                opt.selected = option === field.textContent;
                input.appendChild(opt);
            });
        } else if (fieldType === 'Age') {
            input = document.createElement('input');
            input.type = 'number';
            input.min = '0';
            input.max = '30';
            input.value = field.textContent;
        } else {
            input = document.createElement('input');
            input.type = 'text';
            input.value = field.textContent.replace('Address :', '').trim();
        }
        
        input.classList.add('editable-input');
        field.innerHTML = '';
        field.appendChild(input);
    });
}

function saveChanges() {
    const formData = new FormData();
    const editableFields = document.querySelectorAll('[data-field] .editable-input');
    
    editableFields.forEach(input => {
        const field = input.closest('[data-field]');
        const fieldType = field.getAttribute('data-field');
        const value = input.value;
        
        formData.append(fieldType, value);
        
        // Update UI
        if (fieldType === 'Location') {
            field.innerHTML = `<b>Address :</b> <br>${value}`;
        } else {
            field.textContent = value;
        }
    });
    
    // Save to server
    fetch('../php/update_pet.php', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin' // Important for session handling
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            alert('Pet information updated successfully!');
        } else {
            alert('Error updating pet information: ' + data.message);
            revertChanges();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while updating pet information.');
        revertChanges();
    });
}

function revertChanges() {
    const editableFields = document.querySelectorAll('[data-field]');
    editableFields.forEach(field => {
        const fieldType = field.getAttribute('data-field');
        if (fieldType === 'Location') {
            field.innerHTML = `<b>Address :</b> <br>${originalValues[fieldType]}`;
        } else {
            field.textContent = originalValues[fieldType];
        }
    });
} 