// Navbar Scroll Effect
window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (window.scrollY > 50) {
        nav.style.background = 'rgba(15, 23, 42, 0.98)';
        nav.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5)';
    } else {
        nav.style.background = 'rgba(15, 23, 42, 0.9)';
        nav.style.boxShadow = 'none';
    }
});

// Form Submission Simulation
function showSuccess() {
    const successMsg = document.getElementById('form-success');
    successMsg.classList.remove('hidden');
    document.getElementById('registro-form').reset();
    setTimeout(() => {
        successMsg.classList.add('hidden');
    }, 5000);
}

// Chatbot Logic
const chatbox = {
    knowledgeBase: {
        "inscripcion": "Para inscribirte, ve a la sección 'Formulario de Inscripción' en esta misma página, llena tus datos y selecciona tu área de interés.",
        "bootcamps": "Ofrecemos bootcamps en Programación Web Full Stack, Inteligencia Artificial, Blockchain, Análisis de Datos, Cloud Computing y Ciberseguridad.",
        "costo": "El programa Talento Tech es 100% gratuito y certificado por el MinTIC.",
        "gratis": "¡Sí! El programa es totalmente gratuito.",
        "requisitos": "Está dirigido a jóvenes y adultos colombianos con ganas de aprender habilidades digitales para el siglo XXI.",
        "modalidad": "Las capacitaciones son presenciales en la región de Talento Tech.",
        "default": "Disculpa, solo puedo responder dudas sobre el programa Talento Tech, sus bootcamps y la inscripción en esta página. ¿Puedes reformular tu pregunta?"
    }
};

function toggleChat() {
    const body = document.getElementById('chat-body');
    const icon = document.getElementById('chat-toggle-icon');
    if (body.classList.contains('hidden')) {
        body.classList.remove('hidden');
        icon.textContent = '▼';
    } else {
        body.classList.add('hidden');
        icon.textContent = '▲';
    }
}

function handleChatEnter(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

function sendMessage() {
    const inputField = document.getElementById('chat-input');
    const msg = inputField.value.trim();
    
    if (msg === "") return;

    addMessage(msg, 'user-msg');
    inputField.value = '';

    // Simulate typing delay
    setTimeout(() => {
        const response = generateResponse(msg);
        addMessage(response, 'bot-msg');
    }, 600);
}

function addMessage(text, className) {
    const messagesContainer = document.getElementById('chat-messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = className;
    msgDiv.textContent = text;
    messagesContainer.appendChild(msgDiv);
    
    // Auto scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function generateResponse(userMsg) {
    const lowerMsg = userMsg.toLowerCase();

    // Inscripción
    if (lowerMsg.includes('inscribir') || lowerMsg.includes('registro') || lowerMsg.includes('formulario')) {
        return chatbox.knowledgeBase["inscripcion"];
    }

    // Bootcamps generales
    if (lowerMsg.includes('curso') || lowerMsg.includes('bootcamp') || lowerMsg.includes('aprender') || lowerMsg.includes('habilidades')) {
        return chatbox.knowledgeBase["bootcamps"];
    }

    // Costo
    if (lowerMsg.includes('precio') || lowerMsg.includes('costo') || lowerMsg.includes('pagar') || lowerMsg.includes('gratis')) {
        return chatbox.knowledgeBase["costo"];
    }

    // Requisitos
    if (lowerMsg.includes('requisito') || lowerMsg.includes('quien puede')) {
        return chatbox.knowledgeBase["requisitos"];
    }

    // Modalidad
    if (lowerMsg.includes('presencial') || lowerMsg.includes('virtual') || lowerMsg.includes('modalidad')) {
        return chatbox.knowledgeBase["modalidad"];
    }

    // Habilidades específicas
    if (lowerMsg.includes('ciberseguridad')) {
        return "La ciberseguridad se enfoca en proteger sistemas, redes y datos contra ataques digitales. En el bootcamp aprenderás seguridad de redes, hacking ético y protección de información.";
    }

    if (lowerMsg.includes('inteligencia artificial') || lowerMsg.includes('ia')) {
        return "El bootcamp de Inteligencia Artificial enseña a crear modelos que pueden aprender de datos, como chatbots, sistemas de recomendación y automatización.";
    }

    if (lowerMsg.includes('programacion') || lowerMsg.includes('web')) {
        return "En Programación Web aprenderás desarrollo Full Stack: HTML, CSS, JavaScript y tecnologías backend para crear aplicaciones completas.";
    }

    if (lowerMsg.includes('blockchain')) {
        return "Blockchain es una tecnología que permite registrar transacciones de forma segura y descentralizada. Aprenderás contratos inteligentes y aplicaciones descentralizadas.";
    }

    if (lowerMsg.includes('datos') || lowerMsg.includes('analisis de datos')) {
        return "En Análisis de Datos aprenderás a interpretar información usando herramientas de análisis para apoyar decisiones empresariales.";
    }

    if (lowerMsg.includes('cloud') || lowerMsg.includes('nube')) {
        return "Arquitectura Cloud enseña a crear y desplegar aplicaciones en la nube utilizando infraestructuras escalables.";
    }

    // Saludo
    if (lowerMsg.includes('hola') || lowerMsg.includes('saludos')) {
        return "¡Hola! ¿En qué te puedo ayudar sobre Talento Tech?";
    }

    return chatbox.knowledgeBase["default"];
}