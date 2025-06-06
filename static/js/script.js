// static/js/script.js
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const languageSelector = document.getElementById('language-selector');
    const sendButtonMobile = document.getElementById('send-button-mobile');
    const userInputMobile = document.getElementById('user-input-mobile');
    const sendButtonDesktop = document.getElementById('send-button-desktop');
    const userInputDesktop = document.getElementById('user-input-desktop');
    const chatMessages = document.getElementById('chat-messages');
    const startChatButton = document.getElementById('start-chat-button');
    const chatAnchor = document.getElementById('chat-anchor');
    const thinkingAnimationTemplate = document.getElementById('thinking-animation-template');
    const mobileInputBar = document.querySelector('.mobile-input-bar');

    let isLoading = false;

    const i18n = {
        en: { title: "Chik | A New Era in Legal AI", description: "An immersive, AI-powered legal assistant for Moroccan Law...", headline1: "Clarity for", headline2: "Moroccan Law.", subheadline: "An AI assistant meticulously trained on legal codes...", cta_button: "Begin Consultation", chip_business: "Start a business", chip_family: "Family code", chip_property: "Property laws", placeholder_input: "Ask a question...", welcome_message: "Hello! How may I help you with Moroccan law today?" },
        fr: { title: "Chik | Une Nouvelle Ère en IA Juridique", description: "Un assistant juridique immersif pour le droit marocain...", headline1: "La Clarté pour", headline2: "le Droit Marocain.", subheadline: "Un assistant IA méticuleusement formé sur les codes juridiques...", cta_button: "Commencer la Consultation", chip_business: "Créer une entreprise", chip_family: "Code de la famille", chip_property: "Lois immobilières", placeholder_input: "Posez votre question...", welcome_message: "Bonjour ! Comment puis-je vous aider avec le droit marocain aujourd'hui ?" },
        ar: { title: "تشيك | عصر جديد في الذكاء الاصطناعي القانوني", description: "مساعد قانوني غامر للقانون المغربي...", headline1: "وضوح تام", headline2: "للقانون المغربي.", subheadline: "مساعد ذكاء اصطناعي مدرب بدقة على القوانين...", cta_button: "ابدأ الاستشارة", chip_business: "بدء عمل تجاري", chip_family: "مدونة الأسرة", chip_property: "قوانين العقارات", placeholder_input: "اطرح سؤالك...", welcome_message: "مرحباً! أنا تشيك، مساعدك القانوني الذكي للقانون المغربي. كيف يمكنني مساعدتك اليوم؟" }
    };

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
    
    const setupEventListeners = () => {
        languageSelector.addEventListener('change', (e) => changeLanguage(e.target.value));
        
        // Handle both input forms
        sendButtonMobile.addEventListener('click', () => handleSendMessage('mobile'));
        userInputMobile.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage('mobile'); }});
        
        sendButtonDesktop.addEventListener('click', () => handleSendMessage('desktop'));
        userInputDesktop.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage('desktop'); }});

        startChatButton.addEventListener('click', () => {
            chatAnchor.scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => userInputMobile.focus(), 500);
        });
        document.querySelectorAll('.suggestion-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                const query = e.target.getAttribute('data-query');
                userInputMobile.value = query;
                userInputDesktop.value = query;
                userInputMobile.focus();
                handleSendMessage('mobile');
            });
        });
    };
    
    const handleSendMessage = async (source) => {
        const input = (source === 'mobile') ? userInputMobile : userInputDesktop;
        const messageText = input.value.trim();
        if (messageText === '' || isLoading) return;
        setLoading(true);
        addMessage('user', messageText);
        input.value = '';
        autoResizeTextarea(input);
        const thinkingMessageId = addThinkingMessage();
        try {
            const response = await fetch('/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: messageText }) });
            if (!response.ok) throw new Error('Network response was not ok.');
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            updateThinkingMessage(thinkingMessageId, data.response);
        } catch (error) {
            console.error('Error:', error);
            updateThinkingMessage(thinkingMessageId, "I'm sorry, an error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const changeLanguage = (lang) => {
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        const translations = i18n[lang];
        document.querySelectorAll('[data-i18n]').forEach(el => { if (translations[el.dataset.i18n]) el.textContent = translations[el.dataset.i18n]; });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { if (translations[el.dataset.i18nPlaceholder]) el.placeholder = translations[el.dataset.i18nPlaceholder]; });
        chatMessages.innerHTML = ''; addWelcomeMessage(lang);
    };
    
    const addMessage = (sender, text) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        messageDiv.innerHTML = `<div class="message-content">${processMarkdown(text)}</div>`;
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
        return messageDiv.id = `msg-${Date.now()}`;
    };

    const addThinkingMessage = () => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message is-thinking';
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.appendChild(thinkingAnimationTemplate.firstElementChild.cloneNode(true));
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
        return messageDiv.id = `msg-thinking-${Date.now()}`;
    };

    const updateThinkingMessage = (messageId, newText) => {
        const thinkingMessage = document.getElementById(messageId);
        if (thinkingMessage) {
            thinkingMessage.classList.remove('is-thinking');
            const contentDiv = thinkingMessage.querySelector('.message-content');
            contentDiv.style.opacity = '0';
            setTimeout(() => { contentDiv.innerHTML = processMarkdown(newText); contentDiv.style.opacity = '1'; scrollToBottom(); }, 300);
        }
    };

    const processMarkdown = (text) => {
        let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/^\s*###\s*(.*)/gm, '<h3>$1</h3>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/`([^`]+)`/g, '<code>$1</code>');
        html = html.replace(/^\s*--\s*(.*)/gm, '<li>$1</li>');
        html = html.replace(/(<li>(?:.|\n)*?<\/li>)/g, '<ul>$1</ul>').replace(/<\/ul>\n?<ul>/g, '');
        return html.replace(/\n/g, '<br>');
    };
    
    const setLoading = (state) => {
        isLoading = state;
        sendButtonMobile.disabled = state;
        sendButtonDesktop.disabled = state;
    };
    const scrollToBottom = () => chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
    const autoResizeTextarea = (el) => { if(el) { el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`; } };
    
    // Mobile Keyboard/Viewport Handling
    const setupViewportListener = () => {
        if (!window.matchMedia("(pointer: coarse)").matches) return;
        
        const handleFocus = () => {
            const handleResize = () => {
                const keyboardHeight = window.innerHeight - window.visualViewport.height;
                mobileInputBar.style.transform = `translateY(-${Math.max(0, keyboardHeight)}px)`;
            };
            window.visualViewport.addEventListener('resize', handleResize);
            userInputMobile.addEventListener('blur', () => {
                window.visualViewport.removeEventListener('resize', handleResize);
                mobileInputBar.style.transform = `translateY(0px)`;
            }, { once: true });
        };
        userInputMobile.addEventListener('focus', handleFocus);
    };

    init();
});
