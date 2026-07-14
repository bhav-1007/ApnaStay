
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