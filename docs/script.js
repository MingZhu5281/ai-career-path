// AI Career Path - Frontend JavaScript

// Global variables
let currentQuestion = 0;
let questions = [];
let answers = [];
let sessionId = generateSessionId();
let assessmentResults = {};
let chatHistory = [];

// API Configuration
const API_BASE_URL = '/api';

// Utility Functions
function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function showPage(pageId) {
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.style.display = 'none');
    
    // Show target page
    document.getElementById(pageId).style.display = 'block';
    
    // Add fade-in animation
    document.getElementById(pageId).classList.add('fade-in');
}

function showLoading(text = 'Loading...') {
    document.getElementById('loadingText').textContent = text;
    const modal = new bootstrap.Modal(document.getElementById('loadingModal'));
    modal.show();
    
    // Show cancel button after 5 seconds
    setTimeout(() => {
        const cancelBtn = document.getElementById('cancelLoading');
        if (cancelBtn) cancelBtn.style.display = 'inline-block';
    }, 5000);
}

function hideLoading() {
    console.log("Attempting to hide loading modal...");
    
    // Try Bootstrap modal first
    const modal = bootstrap.Modal.getInstance(document.getElementById("loadingModal"));
    if (modal) {
        console.log("Hiding with Bootstrap modal instance");
        modal.hide();
    }
    
    // Force hide the modal directly
    const modalElement = document.getElementById("loadingModal");
    if (modalElement) {
        console.log("Force hiding modal element");
        modalElement.style.display = "none";
        modalElement.classList.remove("show");
        modalElement.classList.remove("modal", "fade", "show");
        
        // Remove backdrop
        const backdrop = document.querySelector(".modal-backdrop");
        if (backdrop) {
            backdrop.remove();
        }
        
        // Remove modal-open class from body
        document.body.classList.remove("modal-open");
        document.body.style.overflow = "";
        document.body.style.paddingRight = "";
    }
    
    console.log("Loading modal hidden");
}

// Assessment Functions
async function startAssessment() {
    try {
        showLoading('Loading assessment questions...');
        
        console.log('Fetching questions from:', `${API_BASE_URL}/questions`);
        
        // Add timeout fallback
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 10000)
        );
        
        // Fetch questions from backend
        const response = await Promise.race([
            fetch(`${API_BASE_URL}/questions`),
            timeoutPromise
        ]);
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Questions received:', data);
        
        if (!data || data.length === 0) {
            throw new Error('No questions received from server');
        }
        
        questions = data;
        answers = [];
        currentQuestion = 0;
        
        hideLoading();
        showPage('assessmentPage');
        displayQuestion();
        
    } catch (error) {
        hideLoading();
        console.error('Assessment error details:', error);
        alert('Error loading assessment: ' + error.message);
    }
}

function displayQuestion() {
    if (currentQuestion >= questions.length) {
        submitAssessment();
        return;
    }
    
    const question = questions[currentQuestion];
    
    // Update progress bar
    const progress = ((currentQuestion + 1) / questions.length) * 100;
    document.getElementById('progressBar').style.width = progress + '%';
    
    // Update question counter
    document.getElementById('questionCounter').textContent = 
        `Question ${currentQuestion + 1} of ${questions.length}`;
    
    // Display question
    document.getElementById('questionText').textContent = question.question;
    
    // Display options
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const optionButton = document.createElement('button');
        optionButton.className = 'option-button';
        optionButton.textContent = option.text;
        optionButton.onclick = () => selectOption(index);
        optionsContainer.appendChild(optionButton);
    });
    
    // Reset next button
    document.getElementById('nextButton').disabled = true;
}

function selectOption(optionIndex) {
    // Remove previous selection
    const options = document.querySelectorAll('.option-button');
    options.forEach(option => option.classList.remove('selected'));
    
    // Select current option
    options[optionIndex].classList.add('selected');
    
    // Store answer
    const question = questions[currentQuestion];
    answers[currentQuestion] = {
        question_id: question.id,
        option_index: optionIndex
    };
    
    // Enable next button
    document.getElementById('nextButton').disabled = false;
}

async function nextQuestion() {
    if (answers[currentQuestion] === undefined) {
        alert('Please select an option before continuing.');
        return;
    }
    
    currentQuestion++;
    displayQuestion();
}

async function submitAssessment() {
    try {
        showLoading('Analyzing your responses...');
        
        const response = await fetch(`${API_BASE_URL}/submit-assessment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                session_id: sessionId,
                answers: answers
            })
        });
        
        if (!response.ok) throw new Error('Failed to submit assessment');
        
        assessmentResults = await response.json();
        
        if (assessmentResults.success) {
            hideLoading();
            showResults();
        } else {
            throw new Error(assessmentResults.error || 'Assessment failed');
        }
        
    } catch (error) {
        hideLoading();
        alert('Error submitting assessment: ' + error.message);
        console.error('Submit error:', error);
    }
}

function showResults() {
    const results = assessmentResults.results;
    
    // Display personality type
    document.getElementById('personalityType').textContent = results.name;
    document.getElementById('personalityDescription').textContent = results.description;
    
    // Display strengths
    const strengthsList = document.getElementById('strengthsList');
    strengthsList.innerHTML = '';
    results.strengths.forEach(strength => {
        const li = document.createElement('li');
        li.textContent = strength;
        strengthsList.appendChild(li);
    });
    
    // Display development areas
    const developmentList = document.getElementById('developmentList');
    developmentList.innerHTML = '';
    results.development_areas.forEach(area => {
        const li = document.createElement('li');
        li.textContent = area;
        developmentList.appendChild(li);
    });
    
    // Display career matches
    const careerMatches = document.getElementById('careerMatches');
    careerMatches.innerHTML = '';
    results.career_matches.forEach(career => {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4';
        col.innerHTML = `
            <div class="career-match">
                <h6>${career}</h6>
            </div>
        `;
        careerMatches.appendChild(col);
    });
    
    showPage('resultsPage');
    
    // Show chat link in navigation
    document.getElementById('chatLink').style.display = 'block';
}

function retakeAssessment() {
    if (confirm('Are you sure you want to retake the assessment? Your current results will be lost.')) {
        startAssessment();
    }
}

// Chat Functions
function startChat() {
    chatHistory = [];
    showPage('chatPage');
    
    // Scroll to bottom of chat
    setTimeout(() => {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 100);
}

function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addMessageToChat(message, 'user');
    input.value = '';
    
    // Show typing indicator
    addTypingIndicator();
    
    try {
        // Send message to backend
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                session_id: sessionId,
                message: message,
                personality_type: assessmentResults.personality_type,
                resume_data: window.resumeData || ''
            })
        });
        
        if (!response.ok) throw new Error('Failed to send message');
        
        const data = await response.json();
        
        // Remove typing indicator
        removeTypingIndicator();
        
        if (data.success) {
            addMessageToChat(data.response, 'bot');
        } else {
            addMessageToChat('Sorry, I encountered an error. Please try again.', 'bot');
        }
        
    } catch (error) {
        removeTypingIndicator();
        addMessageToChat('Sorry, I\'m having trouble connecting. Please check your internet connection and try again.', 'bot');
        console.error('Chat error:', error);
    }
}

function addMessageToChat(message, sender) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = message;
    
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Store in chat history
    chatHistory.push({ message, sender, timestamp: new Date() });
}

function addTypingIndicator() {
    const chatMessages = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message';
    typingDiv.id = 'typingIndicator';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = '<em>AI is typing...</em>';
    
    typingDiv.appendChild(contentDiv);
    chatMessages.appendChild(typingDiv);
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Resume Upload Functions
async function uploadResume() {
    const fileInput = document.getElementById('resumeUpload');
    const file = fileInput.files[0];
    
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 
                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
        alert('Please upload a PDF, DOC, or DOCX file.');
        fileInput.value = '';
        return;
    }
    
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB.');
        fileInput.value = '';
        return;
    }
    
    try {
        showLoading('Uploading and analyzing resume...');
        
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${API_BASE_URL}/upload-resume`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) throw new Error('Failed to upload resume');
        
        const data = await response.json();
        
        if (data.success) {
            window.resumeData = data.resume_text;
            hideLoading();
            alert('Resume uploaded successfully! I can now provide more personalized advice.');
        } else {
            throw new Error(data.error || 'Upload failed');
        }
        
    } catch (error) {
        hideLoading();
        alert('Error uploading resume: ' + error.message);
        console.error('Upload error:', error);
        fileInput.value = '';
    }
}

// Navigation Functions
function goHome() {
    showPage('homePage');
}

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    // Show home page by default
    showPage('homePage');
    
    // Add smooth scrolling for better UX
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Initialize tooltips if any
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});

// Error handling for unhandled promises
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    // You could show a user-friendly error message here
});
