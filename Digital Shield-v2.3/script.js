document.addEventListener('DOMContentLoaded', () => {
    // --- Data for FAQs ---
    // This array of objects holds all the Q&A data.
    const faqsData = [
        {
            question: "What is Digital Shield?",
            answer: "Digital Shield is a comprehensive, all-in-one privacy suite for your browser. It replaces multiple extensions by combining features like a tracker blocker, a secure password manager, site safety warnings, and a browser cleaner into a single, lightweight tool."
        },
        {
            question: "How does Digital Shield make my browsing faster?",
            answer: "By blocking invasive trackers, analytics scripts, and intrusive ads at the source. This reduces the amount of data your browser needs to load, making web pages appear significantly faster and providing a cleaner experience."
        },
        {
            question: "Is the password manager secure? Can you see my passwords?",
            answer: "The password manager is built on a zero-knowledge architecture with military-grade AES-256 encryption. This means your data is encrypted and decrypted locally on your device using your master password. We never have access to your passwords or notes, ensuring your vault is impenetrable—even to us."
        },
         {
            question: "Can I store more than just passwords in Digital Shield?",
            answer: "Absolutely. The Digital Vault includes Secure Notes, which uses the same military-grade, zero-knowledge encryption as the password manager. You can safely store recovery codes, private keys, financial information, or any sensitive text, knowing it's completely inaccessible to anyone but you."
        },
        {
            question: "How does Digital Shield protect me from scams and malware?",
            answer: "It features a real-time shield that automatically blocks access to known malicious websites, phishing scams, and domains that host malware. This stops threats like credit card skimmers and cryptojackers before they can even load on your device."
        },
        {
            question: "What is Tab Locker and how does it work?",
            answer: "Tab Locker allows you to secure important browser tabs with a unique PIN. This is perfect for protecting sensitive information like financial data or critical work from prying eyes or accidental closures, especially when using a shared computer."
        },
        {
            question: "How do I clear my browser's cookies and cache?",
            answer: "Digital Shield includes a 'One-Click Browser Cleaner'. You can instantly wipe cookies, cache, and other site data for your current website or your entire browser with a single click from the extension's menu. This helps improve performance and erase your digital footprint on demand."
        },
        {
            question: "Does Digital Shield have a dark mode?",
            answer: "Yes, it features a Global Dark Mode. You can apply a comfortable, eye-friendly dark theme to any website, even those that don't natively support it. This is perfect for reducing eye strain during late-night browsing."
        },
        {
            question: "What is the Privacy Score?",
            answer: "It's an easy-to-understand rating (from A+ to F) for any website. The score is based on a site’s tracker density, security protocols, and known data breach history, empowering you to assess risks before you visit or share information."
        },
        {
            question: "I use a VPN. Do I still need Digital Shield?",
            answer: "Yes. While a VPN hides your IP address from websites, Digital Shield provides an essential extra layer of protection. It blocks WebRTC requests, which can leak your real IP address even when a VPN is active, ensuring your anonymity is fully protected."
        },
        {
            question: "What is browser fingerprinting and how do you stop it?",
            answer: "Browser fingerprinting is a technique trackers use to build a unique profile of you based on your device settings. Digital Shield's anti-fingerprinting technology actively obfuscates this data (like canvas, audio, and font details) to make it significantly harder for trackers to identify and follow you online."
        },
        {
            question: "How does Digital Shield provide privacy tips?",
            answer: "Our AI-Powered Privacy Coach gives you personalized, real-time recommendations and tips based on the websites you visit and your browsing habits. It acts like a security expert at your side, guiding you toward smarter privacy decisions."
        },
        {
            question: "What is the privacy game?",
            answer: "The privacy game is an interactive and educational feature within Digital Shield designed to help you learn about online threats and best practices in a fun, engaging way. It gamifies privacy education, allowing you to test your knowledge and improve your security awareness."
        },
        {
            question: "How can I understand a website's privacy policy quickly?",
            answer: "Digital Shield includes an AI Policy Summarizer. This tool reads long and complex privacy policies and delivers the key points in plain, simple English in just a few seconds, so you know what you're agreeing to."
        },
        {
            question: "Is Digital Shield a subscription service?",
            answer: "The core features of Digital Shield are available for free. For users seeking the highest level of protection, we offer Digital Shield PRO, which includes advanced features and is available for a simple one-time purchase for lifetime access."
        },
        {
            question: "What is 'Allow List Mode' in the firewall?",
            answer: "This is a maximum security setting for advanced users. When enabled, it blocks all third-party network requests by default. Only connections that you have explicitly approved are permitted, giving you enterprise-grade defense against unknown threats."
        },
        {
            question: "What does the 'Decoy Data Technology' in the PRO version do?",
            answer: "Instead of just blocking trackers, this advanced feature actively confuses them by feeding them randomized, plausible-but-fake data. This pollutes their surveillance profiles and renders their data collection useless, all while preserving full website functionality."
        }
    ];

    const faqListContainer = document.getElementById('faq-list');
    const searchInput = document.getElementById('faq-search');
    const faqSchemaScript = document.getElementById('faq-schema');

    // --- Function to populate FAQ list ---
    const populateFaqs = (faqs) => {
        faqListContainer.innerHTML = ''; // Clear existing list
        if (faqs.length === 0) {
            faqListContainer.innerHTML = '<div class="no-results"><p>No questions found matching your search.</p></div>';
            return;
        }

        faqs.forEach(faq => {
            // Use <details> and <summary> for native accordion functionality
            const details = document.createElement('details');
            details.className = 'faq-item';
            // The 'name' attribute ensures only one <details> element can be open at a time
            details.setAttribute('name', 'faq-accordion');

            const summary = document.createElement('summary');
            summary.className = 'faq-question';
            summary.textContent = faq.question;

            const answerDiv = document.createElement('div');
            answerDiv.className = 'faq-answer';
            const answerP = document.createElement('p');
            answerP.textContent = faq.answer;
            answerDiv.appendChild(answerP);

            details.appendChild(summary);
            details.appendChild(answerDiv);
            faqListContainer.appendChild(details);
        });
    };
    
    // --- Function to populate SEO Schema ---
    const populateSchema = (faqs) => {
        const schema = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.map(faq => ({
                "@type": "Question",
                "name": faq.question,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": faq.answer
                }
            }))
        };
        faqSchemaScript.textContent = JSON.stringify(schema, null, 2); // Pretty print for readability
    };

    // --- Debounce function for performance optimization ---
    // This prevents the search function from firing on every single keystroke,
    // improving performance on large lists.
    const debounce = (func, delay) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    };

    // --- Search filter function ---
    const handleSearch = () => {
        const query = searchInput.value.toLowerCase().trim();
        const filteredFaqs = faqsData.filter(faq => 
            faq.question.toLowerCase().includes(query) || 
            faq.answer.toLowerCase().includes(query)
        );
        populateFaqs(filteredFaqs);
    };

    // --- Event Listener ---
    // Use the debounced function for the input event
    searchInput.addEventListener('input', debounce(handleSearch, 300));

    // --- Initial Population ---
    // Populate the page with all FAQs and the SEO schema when it first loads.
    populateFaqs(faqsData);
    populateSchema(faqsData);
});
