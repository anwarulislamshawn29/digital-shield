document.addEventListener('DOMContentLoaded', () => {
    const domainNameEl = document.getElementById('domain-name');
    const requestTypeEl = document.getElementById('request-type');
    const emailTemplateEl = document.getElementById('email-template');
    const copyButton = document.getElementById('copy-button');

    const urlParams = new URLSearchParams(window.location.search);
    const domain = urlParams.get('domain') || '[Company Name]';

    if (domainNameEl) {
        domainNameEl.textContent = domain;
    }

    const templates = {
        deletion: `Subject: Data Deletion Request (GDPR/CCPA)

Dear ${domain} Privacy Team,

I am writing to request the permanent deletion of all my personal data, in accordance with my rights under the General Data Protection Regulation (GDPR) and/or the California Consumer Privacy Act (CCPA).

Please process this request and confirm once my data has been deleted.

Thank you,
[Your Name]`,
        access: `Subject: Data Access Request (GDPR/CCPA)

Dear ${domain} Privacy Team,

I am writing to request access to all personal data you hold about me, in accordance with my rights under the General Data Protection Regulation (GDPR) and/or the California Consumer Privacy Act (CCPA).

Please provide me with a copy of my data.

Thank you,
[Your Name]`
    };

    function updateTemplate() {
        const selectedType = document.querySelector('input[name="request"]:checked').value;
        emailTemplateEl.value = templates[selectedType];
    }

    if (requestTypeEl) {
        requestTypeEl.addEventListener('change', updateTemplate);
    }

    if (copyButton) {
        copyButton.addEventListener('click', () => {
            emailTemplateEl.select();
            document.execCommand('copy');
            
            copyButton.innerHTML = `
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                <span>Copied!</span>`;
            copyButton.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
            copyButton.classList.add('bg-green-500');

            setTimeout(() => {
                copyButton.innerHTML = `
                   <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m-4.5 9H12a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"></path></svg>
                   <span>Copy to Clipboard</span>`;
                copyButton.classList.remove('bg-green-500');
                copyButton.classList.add('bg-indigo-600', 'hover:bg-indigo-700');
            }, 2000);
        });
    }

    // Initialize
    updateTemplate();
});
