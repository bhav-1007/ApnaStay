(() => {
    'use strict'
  const forms = document.querySelectorAll('.needs-validation')

    Array.from(forms).forEach((form) => {
        form.addEventListener('submit', (event) => {
            if (!form.checkValidity()) {
                event.preventDefault()
                event.stopPropagation()
            }
            form.classList.add('was-validated')
        }, false)
    })
})()

document.addEventListener("DOMContentLoaded", () => {
  const flashMessages = document.querySelectorAll(".flash-message");

  flashMessages.forEach((flash) => {
    setTimeout(() => {
      flash.classList.add("flash-hide");
      setTimeout(() => {
        flash.remove();
      }, 400); // matches the fade-out transition duration below
    }, 5000); // 5 seconds
  });
});

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("form.needs-confirm-delete").forEach((form) => {
    form.addEventListener("submit", (e) => {
      if (!confirm("Move this listing to trash?")) {
        e.preventDefault();
      }
    });
  });

  document.querySelectorAll("form.needs-confirm-delete-permanent").forEach((form) => {
    form.addEventListener("submit", (e) => {
      if (!confirm("This will permanently delete the listing and all its reviews. This cannot be undone. Continue?")) {
        e.preventDefault();
      }
    });
  });

  document.querySelectorAll("form.needs-confirm-edit").forEach((form) => {
    form.addEventListener("submit", (e) => {
      if (!confirm("Save changes to this listing?")) {
        e.preventDefault();
      }
    });
  });
});