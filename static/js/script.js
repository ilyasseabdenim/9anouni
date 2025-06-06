// static/js/script.js
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const languageSelector = document.getElementById('language-selector');
    const sendButton = document.getElementById('send-button');
    const userInput = document.getElementById('user-input');
    const chatMessages = document.getElementById('chat-messages');
    const startChatButton = document.getElementById('start-chat-button');
    const scrollContainer = document.getElementById('scroll-container');
    const chatSection = document.getElementById('chat-section');
    const thinkingAnimationTemplate = document.getElementById('thinking-animation-template');
    const chatWrapper = document.querySelector('.content-wrapper');

    let isLoading = false;

    const i18n = {
        en: { title: "Chik | A New Era in Legal AI", description: "An immersive, AI-powered legal assistant for Moroccan Law...", headline1: "Clarity for", headline2: "Moroccan Law.", subheadline: "An AI assistant meticulously trained on legal codes...", cta_button: "Begin Consultation", chip_business: "Start a business", chip_family: "Family code", chip_property: "Property laws", placeholder_input: "Ask a question...", welcome_message: "Hello! How may I help you with Moroccan law today?" },
        fr: { title: "Chik | Une Nouvelle Ère en IA Juridique", description: "Un assistant juridique immersif pour le droit marocain...", headline1: "La Clarté pour", headline2: "le Droit Marocain.", subheadline: "Un assistant IA méticuleusement formé sur les codes juridiques...", cta_button: "Commencer la Consultation", chip_business: "Créer une entreprise", chip_family: "Code de la famille", chip_property: "Lois immobilières", placeholder_input: "Posez votre question...", welcome_message: "Bonjour ! Comment puis-je vous aider avec le droit marocain aujourd'hui ?" },
        ar: { title: "تشيك | عصر جديد في الذكاء الاصطناعي القانوني", description: "مساعد قانوني غامر للقانون المغربي...", headline1: "وضوح تام", headline2: "للقانون المغربي.", subheadline: "مساعد ذكاء اصطناعي مدرب بدقة على القوانين...", cta_button: "ابدأ الاستشارة", chip_business: "بدء عمل تجاري", chip_family: "مدونة الأسرة", chip_property: "قوانين العقارات", placeholder_input: "اطرح سؤالك...", welcome_message: "مرحباً! كيف يمكنني مساعدتك في ما يخص القانون المغربي اليوم؟" }
    };

    const init = () => {
        feather.replace();
        setupEventListeners();
        autoResizeTextarea();
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
        sendButton.addEventListener('click', handleSendMessage);
        userInput.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } });
        userInput.addEventListener('input', autoResizeTextarea);
        startChatButton.addEventListener('click', () => {
            const target = window.matchMedia("(min-width: 800px)").matches ? document.querySelector('.main-content > .chat-container') : chatSection;
            target.scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => userInput.focus(), 500);
        });
        document.querySelectorAll('.suggestion-chip').forEach(chip => {
            chip.addEventListener('click', (e) => { userInput.value = e.target.getAttribute('data-query'); userInput.focus(); handleSendMessage(); });
        });
    };
    
    const handleSendMessage = async () => {
        const messageText = userInput.value.trim();
        if (messageText === '' || isLoading) return;
        setLoading(true);
        addMessage('user', messageText);
        const thinkingMessageId = addThinkingMessage();
        userInput.value = ''; autoResizeTextarea();
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
    
    const setLoading = (state) => { isLoading = state; chatWrapper.classList.toggle('is-loading', state); userInput.disabled = state; sendButton.disabled = state; };
    const scrollToBottom = () => {
        const target = window.matchMedia("(min-width: 800px)").matches ? document.querySelector('.main-content .chat-messages') : chatMessages;
        if(target) target.scrollTo({ top: target.scrollHeight, behavior: 'smooth' });
    };
    const autoResizeTextarea = () => { userInput.style.height = 'auto'; userInput.style.height = `${userInput.scrollHeight}px`; };
    
    const setupViewportListener = () => {
        if (!window.matchMedia("(pointer: coarse)").matches) return;
        
        const chatInputBar = document.querySelector('.chat-input-bar');
        
        const handleFocus = () => {
            const initialViewportHeight = window.innerHeight;
            const handleResize = () => {
                if (window.visualViewport.height < initialViewportHeight) {
                    const keyboardHeight = initialViewportHeight - window.visualViewport.height;
                    chatInputBar.style.transform = `translateY(-${keyboardHeight}px)`;
                    scrollContainer.style.paddingBottom = `${chatInputBar.offsetHeight}px`; // Prevent content from being hidden
                }
            };

            window.visualViewport.addEventListener('resize', handleResize);
            
            userInput.addEventListener('blur', () => {
                window.visualViewport.removeEventListener('resize', handleResize);
                chatInputBar.style.transform = `translateY(0px)`;
                scrollContainer.style.paddingBottom = `0px`;
            }, { once: true });
        };
        
        userInput.addEventListener('focus', handleFocus);
    };

    init();
});
