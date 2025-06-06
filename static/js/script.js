// static/js/script.js
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const chatContainer = document.getElementById('chat-container');
    const languageSelector = document.getElementById('language-selector');
    const sendButton = document.getElementById('send-button');
    const userInput = document.getElementById('user-input');
    const chatMessages = document.getElementById('chat-messages');
    const startChatButton = document.getElementById('start-chat-button');
    const chatSection = document.getElementById('chat-section');
    const suggestionChips = document.querySelectorAll('.suggestion-chip');
    const thinkingAnimationTemplate = document.getElementById('thinking-animation-template');
    
    // --- State ---
    let isLoading = false;

    // --- i18n Translations ---
    const i18n = {
        en: {
            title: "Chik | A New Era in Legal AI",
            description: "An immersive, AI-powered legal assistant for Moroccan Law, reimagined with fluid animations and a next-generation user experience.",
            headline1: "Clarity for",
            headline2: "Moroccan Law.",
            subheadline: "An AI assistant meticulously trained on legal codes, redesigned for an intuitive, fluid, and powerful user experience.",
            cta_button: "Begin Consultation",
            chip_business: "Start a business",
            chip_family: "Family code",
            chip_property: "Property laws",
            placeholder_input: "Ask a question...",
            welcome_message: "Hello! I am Chik, your AI legal assistant for Moroccan law. How may I help you today?"
        },
        fr: {
            title: "Chik | Une Nouvelle Ère en IA Juridique",
            description: "Un assistant juridique immersif pour le droit marocain, propulsé par l'IA, et réimaginé avec des animations fluides et une expérience utilisateur de nouvelle génération.",
            headline1: "La Clarté pour",
            headline2: "le Droit Marocain.",
            subheadline: "Un assistant IA méticuleusement formé sur les codes juridiques, repensé pour une expérience utilisateur intuitive, fluide et puissante.",
            cta_button: "Commencer la Consultation",
            chip_business: "Créer une entreprise",
            chip_family: "Code de la famille",
            chip_property: "Lois immobilières",
            placeholder_input: "Posez votre question...",
            welcome_message: "Bonjour ! Je suis Chik, votre assistant juridique IA pour le droit marocain. Comment puis-je vous aider aujourd'hui ?"
        },
        ar: {
            title: "تشيك | عصر جديد في الذكاء الاصطناعي القانوني",
            description: "مساعد قانوني غامر للقانون المغربي، مدعوم بالذكاء الاصطناعي، ومعاد تصميمه برسوم متحركة سلسة وتجربة مستخدم من الجيل التالي.",
            headline1: "وضوح تام",
            headline2: "للقانون المغربي.",
            subheadline: "مساعد ذكاء اصطناعي مدرب بدقة على القوانين، أعيد تصميمه لتجربة مستخدم بديهية وسلسة وقوية.",
            cta_button: "ابدأ الاستشارة",
            chip_business: "بدء عمل تجاري",
            chip_family: "مدونة الأسرة",
            chip_property: "قوانين العقارات",
            placeholder_input: "اطرح سؤالك...",
            welcome_message: "مرحباً! أنا تشيك، مساعدك القانوني الذكي للقانون المغربي. كيف يمكنني مساعدتك اليوم؟"
        }
    };

    // --- Initial Setup ---
    const init = () => {
        feather.replace();
        setupEventListeners();
        autoResizeTextarea();
        setupIntersectionObserver();
        initializeLanguage();
        setupViewportListener(); // NEW: Keyboard handler
    };

    const initializeLanguage = () => {
        const browserLang = navigator.language.split('-')[0];
        const lang = ['fr', 'ar'].includes(browserLang) ? browserLang : 'en';
        languageSelector.value = lang;
        changeLanguage(lang);
    };

    const addWelcomeMessage = (lang) => {
        setTimeout(() => {
            addMessage('bot', i18n[lang].welcome_message);
        }, 1000);
    };
    
    // --- Event Listeners ---
    const setupEventListeners = () => {
        languageSelector.addEventListener('change', (e) => changeLanguage(e.target.value));
        sendButton.addEventListener('click', handleSendMessage);
        userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
        });
        userInput.addEventListener('input', autoResizeTextarea);
        startChatButton.addEventListener('click', () => {
            chatSection.scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => userInput.focus(), 500);
        });
        suggestionChips.forEach(chip => {
            chip.addEventListener('click', (e) => {
                userInput.value = e.target.getAttribute('data-query');
                userInput.focus(); handleSendMessage();
            });
        });
    };
    
    // --- Core Functions ---
    const handleSendMessage = async () => {
        const messageText = userInput.value.trim();
        if (messageText === '' || isLoading) return;
        setLoading(true);
        addMessage('user', messageText);
        const thinkingMessageId = addThinkingMessage();
        userInput.value = ''; autoResizeTextarea();
        try {
            const response = await fetch('/ask', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: messageText }),
            });
            if (!response.ok) throw new Error('Network response was not ok.');
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            updateThinkingMessage(thinkingMessageId, data.response);
        } catch (error) {
            console.error('Error:', error);
            updateThinkingMessage(thinkingMessageId, "I'm sorry, but I encountered an error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const changeLanguage = (lang) => {
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        const translations = i18n[lang];
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[key]) el.textContent = translations[key];
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (translations[key]) el.placeholder = translations[key];
        });
        chatMessages.innerHTML = '';
        addWelcomeMessage(lang);
    };
    
    const addMessage = (sender, text) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        messageDiv.innerHTML = `<div class="message-content">${processMarkdown(text)}</div>`;
        chatMessages.appendChild(messageDiv); scrollToBottom();
        return messageDiv.id = `msg-${Date.now()}`;
    };

    const addThinkingMessage = () => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message is-thinking';
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.appendChild(thinkingAnimationTemplate.firstElementChild.cloneNode(true));
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv); scrollToBottom();
        return messageDiv.id = `msg-thinking-${Date.now()}`;
    };

    const updateThinkingMessage = (messageId, newText) => {
        const thinkingMessage = document.getElementById(messageId);
        if (thinkingMessage) {
            thinkingMessage.classList.remove('is-thinking');
            const contentDiv = thinkingMessage.querySelector('.message-content');
            contentDiv.style.opacity = '0';
            setTimeout(() => {
                contentDiv.innerHTML = processMarkdown(newText);
                contentDiv.style.opacity = '1'; scrollToBottom();
            }, 300);
        }
    };

    const processMarkdown = (text) => {
        let html = text
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/^\s*###\s*(.*)/gm, '<h3>$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code>$1</code>');
        
        html = html.replace(/^\s*--\s*(.*)/gm, '<li>$1</li>');
        html = html.replace(/(<li>(?:.|\n)*?<\/li>)/g, '<ul>$1</ul>').replace(/<\/ul>\n?<ul>/g, '');

        return html.replace(/\n/g, '<br>');
    };
    
    // --- Utility & Setup Functions ---
    const setLoading = (state) => {
        isLoading = state; chatContainer.classList.toggle('is-loading', state);
        userInput.disabled = state; sendButton.disabled = state;
    };
    const scrollToBottom = () => chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
    const autoResizeTextarea = () => { userInput.style.height = 'auto'; userInput.style.height = `${userInput.scrollHeight}px`; };
    const setupIntersectionObserver = () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => document.body.classList.toggle('chat-active', entry.isIntersecting));
        }, { threshold: 0.5 });
        observer.observe(chatSection);
    };

    // --- NEW: Mobile Keyboard/Viewport Handling ---
    const setupViewportListener = () => {
        // Only run on touch devices
        if (window.matchMedia("(pointer: coarse)").matches) {
            let initialViewportHeight = window.innerHeight;

            const handleViewportChange = () => {
                // Let the native browser behavior handle resize on blur
                if (document.activeElement !== userInput) {
                     document.documentElement.style.setProperty('--keyboard-offset', `0px`);
                     return;
                }

                const keyboardOffset = initialViewportHeight - window.visualViewport.height;
                if (keyboardOffset > 100) { // Threshold to avoid false positives
                    document.documentElement.style.setProperty('--keyboard-offset', `${keyboardOffset}px`);
                }
                scrollToBottom();
            };

            const resetViewport = () => {
                 document.documentElement.style.setProperty('--keyboard-offset', `0px`);
            }

            userInput.addEventListener('focus', () => {
                initialViewportHeight = window.innerHeight;
                if(window.visualViewport) {
                    window.visualViewport.addEventListener('resize', handleViewportChange);
                }
            });

            userInput.addEventListener('blur', () => {
                if(window.visualViewport) {
                    window.visualViewport.removeEventListener('resize', handleViewportChange);
                }
                resetViewport();
            });
        }
    };

    // --- Run ---
    init();
});
