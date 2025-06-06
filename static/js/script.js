// static/js/script.js
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const chatMessages = document.getElementById('chat-messages');
    const menuButton = document.getElementById('menu-button');
    const actionSheet = document.getElementById('action-sheet');
    const actionSheetBackdrop = document.getElementById('action-sheet-backdrop');
    const languageSelector = document.getElementById('language-selector');

    // --- State ---
    let isLoading = false;
    
    // --- i18n Translations ---
    const i18n = {
        en: {
            subheadline: "An AI assistant meticulously trained on legal codes, redesigned for an intuitive, fluid, and powerful user experience.",
            suggestions_title: "Suggestions",
            chip_business: "Start a business",
            chip_family: "Family code",
            chip_property: "Property laws",
            placeholder_input: "Ask a question...",
            welcome_message: "Hello! I am Chik, your AI legal assistant for Moroccan law. How may I help you today?"
        },
        fr: {
            subheadline: "Un assistant IA méticuleusement formé sur les codes juridiques, repensé pour une expérience utilisateur intuitive, fluide et puissante.",
            suggestions_title: "Suggestions",
            chip_business: "Créer une entreprise",
            chip_family: "Code de la famille",
            chip_property: "Lois immobilières",
            placeholder_input: "Posez votre question...",
            welcome_message: "Bonjour ! Je suis Chik, votre assistant juridique IA pour le droit marocain. Comment puis-je vous aider aujourd'hui ?"
        },
        ar: {
            subheadline: "مساعد ذكاء اصطناعي مدرب بدقة على القوانين، أعيد تصميمه لتجربة مستخدم بديهية وسلسة وقوية.",
            suggestions_title: "اقتراحات",
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
        initializeLanguage();
        setupViewportListener();
    };

    const initializeLanguage = () => {
        const browserLang = navigator.language.split('-')[0];
        const lang = ['fr', 'ar'].includes(browserLang) ? browserLang : 'en';
        languageSelector.value = lang;
        changeLanguage(lang);
    };

    const addWelcomeMessage = (lang) => {
        setTimeout(() => addMessage('bot', i18n[lang].welcome_message), 500);
    };

    // --- Event Listeners ---
    const setupEventListeners = () => {
        sendButton.addEventListener('click', handleSendMessage);
        userInput.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }});
        
        // Menu handling
        menuButton.addEventListener('click', toggleActionSheet);
        actionSheetBackdrop.addEventListener('click', toggleActionSheet);

        // Language and suggestion chips
        languageSelector.addEventListener('change', e => changeLanguage(e.target.value));
        document.querySelectorAll('.suggestion-chip').forEach(chip => {
            chip.addEventListener('click', e => {
                userInput.value = e.target.getAttribute('data-query');
                toggleActionSheet(false); // Close sheet
                handleSendMessage();
            });
        });
    };

    // --- Core Functions ---
    const handleSendMessage = async () => {
        const messageText = userInput.value.trim();
        if (messageText === '' || isLoading) return;
        setLoading(true);
        addMessage('user', messageText);
        userInput.value = '';
        try {
            const res = await fetch('/ask', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: messageText }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            addMessage('bot', data.response);
        } catch (error) {
            addMessage('bot', "Apologies, an error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const changeLanguage = (lang) => {
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        const translations = i18n[lang];
        document.querySelectorAll('[data-i18n]').forEach(el => {
            el.textContent = translations[el.getAttribute('data-i18n')];
        });
        userInput.placeholder = translations.placeholder_input;
        chatMessages.innerHTML = '';
        addWelcomeMessage(lang);
    };

    const addMessage = (sender, text) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        messageDiv.innerHTML = `<div class="message-content">${text.replace(/\n/g, '<br>')}</div>`;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const toggleActionSheet = (force) => {
        document.body.classList.toggle('action-sheet-open', force);
    };

    const setLoading = (state) => {
        isLoading = state;
        sendButton.disabled = state;
    };

    // --- Mobile Viewport/Keyboard Handling ---
    const setupViewportListener = () => {
        if (!window.matchMedia("(pointer: coarse)").matches) return; // Only for touch devices

        const setKeyboardOffset = () => {
            const offset = window.innerHeight - window.visualViewport.height;
            document.documentElement.style.setProperty('--keyboard-offset', `${Math.max(0, offset)}px`);
        };
        
        window.visualViewport.addEventListener('resize', setKeyboardOffset);
        
        userInput.addEventListener('focus', () => {
             // Briefly hide action sheet if open
            if(document.body.classList.contains('action-sheet-open')) {
                toggleActionSheet(false);
            }
            setTimeout(setKeyboardOffset, 50); // Delay to get final value
        });
        userInput.addEventListener('blur', () => {
            document.documentElement.style.setProperty('--keyboard-offset', '0px');
        });
    };

    init();
});
