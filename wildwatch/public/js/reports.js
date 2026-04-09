// Toast notification
function showToast(message, type = 'success') {
  const existing = document.querySelectorAll('.toast');
  existing.forEach(t => t.remove());

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('toast-show'), 10);
  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Report form logic
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('reportForm');
  if (!form) return;

  // Animal type -> show/hide other description
  const animalSelect = document.getElementById('animalType');
  const otherGroup = document.getElementById('otherAnimalGroup');
  if (animalSelect && otherGroup) {
    animalSelect.addEventListener('change', function() {
      otherGroup.style.display = this.value === 'Other' ? 'block' : 'none';
    });
  }

  // Character counter
  const descArea = document.getElementById('description');
  const charCount = document.getElementById('charCount');
  if (descArea && charCount) {
    descArea.addEventListener('input', function() {
      charCount.textContent = this.value.length;
      charCount.style.color = this.value.length > 450 ? '#FF0000' : '';
    });
  }

  // Photo preview
  const photoInput = document.getElementById('photo');
  const photoPreview = document.getElementById('photoPreview');
  const previewImg = document.getElementById('previewImg');
  const removePhoto = document.getElementById('removePhoto');
  const fileUploadArea = document.getElementById('fileUploadArea');

  if (photoInput) {
    photoInput.addEventListener('change', function() {
      if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = e => {
          previewImg.src = e.target.result;
          photoPreview.style.display = 'block';
          fileUploadArea.style.display = 'none';
        };
        reader.readAsDataURL(this.files[0]);
      }
    });

    // Drag and drop
    if (fileUploadArea) {
      fileUploadArea.addEventListener('dragover', e => { e.preventDefault(); fileUploadArea.classList.add('drag-over'); });
      fileUploadArea.addEventListener('dragleave', () => fileUploadArea.classList.remove('drag-over'));
      fileUploadArea.addEventListener('drop', e => {
        e.preventDefault();
        fileUploadArea.classList.remove('drag-over');
        if (e.dataTransfer.files[0]) {
          photoInput.files = e.dataTransfer.files;
          photoInput.dispatchEvent(new Event('change'));
        }
      });
    }
  }

  if (removePhoto) {
    removePhoto.addEventListener('click', function() {
      photoInput.value = '';
      photoPreview.style.display = 'none';
      fileUploadArea.style.display = 'block';
    });
  }

  // Severity card selection
  document.querySelectorAll('.severity-card input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', function() {
      document.querySelectorAll('.severity-card').forEach(c => c.classList.remove('selected'));
      this.closest('.severity-card').classList.add('selected');
    });
  });

  // Form submission
  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    // Clear errors
    document.querySelectorAll('.field-error').forEach(el => el.textContent = '');

    // Validate
    let valid = true;
    const name = document.getElementById('reporterName').value.trim();
    const email = document.getElementById('reporterEmail').value.trim();
    const animal = document.getElementById('animalType').value;
    const location = document.getElementById('location').value;
    const severity = document.querySelector('input[name="severity"]:checked');
    const desc = document.getElementById('description').value.trim();

    if (!name) { document.getElementById('nameError').textContent = 'Name is required'; valid = false; }
    if (!email) { document.getElementById('emailError').textContent = 'Email is required'; valid = false; }
    else if (!email.endsWith('@' + (window.CAMPUS_DOMAIN || 'belgiumcampus.ac.za'))) { document.getElementById('emailError').textContent = 'Must be a @' + (window.CAMPUS_DOMAIN || 'belgiumcampus.ac.za') + ' email'; valid = false; }
    if (!animal) { document.getElementById('animalError').textContent = 'Please select an animal type'; valid = false; }
    if (!location) { document.getElementById('locationError').textContent = 'Please select a location'; valid = false; }
    if (!severity) { document.getElementById('severityError').textContent = 'Please select a severity level'; valid = false; }
    if (!desc) { document.getElementById('descError').textContent = 'Description is required'; valid = false; }
    else if (desc.length < 10) { document.getElementById('descError').textContent = 'Description must be at least 10 characters'; valid = false; }

    if (!valid) return;

    // Submit
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    const submitSpinner = document.getElementById('submitSpinner');
    submitBtn.disabled = true;
    submitText.style.display = 'none';
    submitSpinner.style.display = 'inline';

    try {
      const formData = new FormData(form);
      const res = await fetch('/incidents/submit', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.success) {
        document.getElementById('reportForm').style.display = 'none';
        document.getElementById('incidentId').textContent = data.incidentId;
        document.getElementById('successCard').style.display = 'block';
        showToast('Report submitted successfully!', 'success');
      } else {
        showToast(data.error || 'Submission failed. Please try again.', 'error');
        submitBtn.disabled = false;
        submitText.style.display = 'inline';
        submitSpinner.style.display = 'none';
      }
    } catch (err) {
      showToast('Network error. Please check your connection.', 'error');
      submitBtn.disabled = false;
      submitText.style.display = 'inline';
      submitSpinner.style.display = 'none';
    }
  });
});

function resetForm() {
  document.getElementById('reportForm').reset();
  document.getElementById('reportForm').style.display = 'block';
  document.getElementById('successCard').style.display = 'none';
  document.getElementById('charCount').textContent = '0';
  document.getElementById('otherAnimalGroup').style.display = 'none';
  document.querySelectorAll('.severity-card').forEach(c => c.classList.remove('selected'));
}
