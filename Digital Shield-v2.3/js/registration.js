document.addEventListener('DOMContentLoaded', () => {
    const registrationForm = document.getElementById('form');

    if (registrationForm) {
        registrationForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const thankYouMessage = document.getElementById('thank-you-message');
            const submitButton = event.target.querySelector('button[type="submit"]');

            const GOOGLE_FORM_ACTION_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSd0JECOwVOjUgvZgQ4s3b4_0HKX_Ll6LH607SV7ShP6ng__cw/formResponse';
            const FIRST_NAME_ID = 'entry.993363336';
            const LAST_NAME_ID = 'entry.1721649888';
            const EMAIL_ID = 'entry.1580626573';

            // This is the code that reads the values from the HTML inputs
            const firstName = document.getElementById('firstname').value;
            const lastName = document.getElementById('lastname').value;
            const email = document.getElementById('email').value;

            const formData = new FormData();
            formData.append(FIRST_NAME_ID, firstName);
            formData.append(LAST_NAME_ID, lastName);
            formData.append(EMAIL_ID, email);

            submitButton.disabled = true;
            submitButton.textContent = 'Registering...';

            fetch(GOOGLE_FORM_ACTION_URL, {
                method: 'POST',
                body: formData,
                mode: 'no-cors'
            })
            .then(() => {
                registrationForm.parentElement.style.display = 'none';
                thankYouMessage.style.display = 'block';
            })
            .catch(error => {
                console.error('Fetch submission error:', error);
                alert('Registration failed. Please try again later.');
                submitButton.disabled = false;
                submitButton.textContent = 'Create My Secure Account';
            });
        });
    }
});