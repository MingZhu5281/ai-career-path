// AI Career Path - Frontend JavaScript

// Global variables
let currentQuestion = 0;
let questions = [];
let answers = [];
let sessionId = generateSessionId();
let assessmentResults = {};
let chatHistory = [];
let currentUser = null;

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
            credentials: 'include',
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
    
    // Show/hide resume upload section based on authentication
    const resumeUploadSection = document.getElementById('resumeUploadSection');
    if (resumeUploadSection) {
        if (currentUser) {
            resumeUploadSection.style.display = 'block';
        } else {
            resumeUploadSection.style.display = 'none';
        }
    }
    
    // Show sample question section when chat starts (if no messages sent yet)
    const sampleQuestionSection = document.querySelector('.sample-question-section');
    if (sampleQuestionSection && chatHistory.length === 0) {
        sampleQuestionSection.style.display = 'block';
    }
    
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

function sendSampleQuestion() {
    const sampleQuestion = "What career paths match my personality type?";
    const input = document.getElementById('chatInput');
    input.value = sampleQuestion;
    sendMessage();
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Hide sample question section after first message
    const sampleQuestionSection = document.querySelector('.sample-question-section');
    if (sampleQuestionSection) {
        sampleQuestionSection.style.display = 'none';
    }
    
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
            credentials: 'include',
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
    if (!currentUser) {
        alert('Please login to upload a resume');
        showLoginModal();
        return;
    }
    
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
            credentials: 'include',
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

// Authentication Functions
async function checkAuthStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/user/status`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.authenticated && data.user) {
                currentUser = data.user;
                updateNavigationForAuth(true);
            } else {
                currentUser = null;
                updateNavigationForAuth(false);
            }
        } else {
            currentUser = null;
            updateNavigationForAuth(false);
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        currentUser = null;
        updateNavigationForAuth(false);
    }
}

function updateNavigationForAuth(isAuthenticated) {
    const loginLink = document.getElementById('loginLink');
    const registerLink = document.getElementById('registerLink');
    const logoutLink = document.getElementById('logoutLink');
    const profileLink = document.getElementById('profileLink');
    const resumeUploadSection = document.getElementById('resumeUploadSection');
    
    if (isAuthenticated) {
        if (loginLink) loginLink.style.display = 'none';
        if (registerLink) registerLink.style.display = 'none';
        if (logoutLink) logoutLink.style.display = 'block';
        if (profileLink) profileLink.style.display = 'block';
        if (resumeUploadSection) resumeUploadSection.style.display = 'block';
    } else {
        if (loginLink) loginLink.style.display = 'block';
        if (registerLink) registerLink.style.display = 'block';
        if (logoutLink) logoutLink.style.display = 'none';
        if (profileLink) profileLink.style.display = 'none';
        if (resumeUploadSection) resumeUploadSection.style.display = 'none';
    }
}

function showLoginModal() {
    const modal = new bootstrap.Modal(document.getElementById('loginModal'));
    modal.show();
}

function showRegisterModal() {
    const modal = new bootstrap.Modal(document.getElementById('registerModal'));
    modal.show();
}

async function login(event) {
    if (event) event.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const remember = document.getElementById('loginRemember').checked;
    
    if (!email || !password) {
        alert('Please enter both email and password');
        return;
    }
    
    try {
        showLoading('Logging in...');
        
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                email: email,
                password: password,
                remember: remember
            })
        });
        
        const data = await response.json();
        hideLoading();
        
        if (data.success) {
            currentUser = data.user;
            updateNavigationForAuth(true);
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
            if (modal) modal.hide();
            
            // Reset form
            document.getElementById('loginForm').reset();
            
            alert('Login successful!');
        } else {
            alert('Login failed: ' + (data.error || 'Invalid credentials'));
        }
    } catch (error) {
        hideLoading();
        alert('Error logging in: ' + error.message);
        console.error('Login error:', error);
    }
}

async function register(event) {
    if (event) event.preventDefault();
    
    const email = document.getElementById('registerEmail').value.trim().toLowerCase();
    const password = document.getElementById('registerPassword').value;
    const firstName = document.getElementById('registerFirstName').value.trim();
    const lastName = document.getElementById('registerLastName').value.trim();
    
    if (!email || !password) {
        alert('Please enter both email and password');
        return;
    }
    
    if (password.length < 8) {
        alert('Password must be at least 8 characters long');
        return;
    }
    
    try {
        showLoading('Creating account...');
        
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                email: email,
                password: password,
                first_name: firstName || null,
                last_name: lastName || null
            })
        });
        
        const data = await response.json();
        hideLoading();
        
        if (data.success) {
            currentUser = data.user;
            updateNavigationForAuth(true);
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
            if (modal) modal.hide();
            
            // Reset form
            document.getElementById('registerForm').reset();
            
            alert('Registration successful! Welcome to AI Career Path!');
        } else {
            alert('Registration failed: ' + (data.error || 'Could not create account'));
        }
    } catch (error) {
        hideLoading();
        alert('Error registering: ' + error.message);
        console.error('Register error:', error);
    }
}

async function logout() {
    try {
        showLoading('Logging out...');
        
        const response = await fetch(`${API_BASE_URL}/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        
        hideLoading();
        
        if (response.ok) {
            currentUser = null;
            updateNavigationForAuth(false);
            showPage('homePage');
            alert('Logged out successfully');
        } else {
            alert('Error logging out');
        }
    } catch (error) {
        hideLoading();
        console.error('Logout error:', error);
    }
}

// Profile Management Functions
function showProfilePage() {
    if (!currentUser) {
        alert('Please login to view your profile');
        showLoginModal();
        return;
    }
    
    showPage('profilePage');
    loadUserProfile();
}

async function loadUserProfile() {
    try {
        showLoading('Loading profile...');
        
        const response = await fetch(`${API_BASE_URL}/user/profile`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to load profile');
        
        const data = await response.json();
        hideLoading();
        
        if (data.success) {
            // Populate profile form
            document.getElementById('profileEmail').value = data.user.email || '';
            document.getElementById('profileFirstName').value = data.user.first_name || '';
            document.getElementById('profileLastName').value = data.user.last_name || '';
            
            // Display current assessment results
            displayCurrentAssessment(data.personality_results, data.latest_assessment);
            
            // Load assessment history
            loadAssessmentHistory();
            
            // Load resumes
            loadResumes();
        }
    } catch (error) {
        hideLoading();
        console.error('Error loading profile:', error);
        alert('Error loading profile: ' + error.message);
    }
}

function displayCurrentAssessment(personalityResults, latestAssessment) {
    const container = document.getElementById('currentAssessmentResults');
    
    if (!personalityResults || !latestAssessment) {
        container.innerHTML = '<p class="text-muted">No assessment completed yet. <a href="#" onclick="startAssessment(); return false;">Take the assessment</a> to get started.</p>';
        return;
    }
    
    let html = `
        <div class="mb-3">
            <h6>Personality Type: <span class="text-primary">${personalityResults.name}</span></h6>
            <p>${personalityResults.description}</p>
        </div>
        <div class="row">
            <div class="col-md-6">
                <h6>Strengths:</h6>
                <ul>
    `;
    
    personalityResults.strengths.forEach(strength => {
        html += `<li>${strength}</li>`;
    });
    
    html += `
                </ul>
            </div>
            <div class="col-md-6">
                <h6>Development Areas:</h6>
                <ul>
    `;
    
    personalityResults.development_areas.forEach(area => {
        html += `<li>${area}</li>`;
    });
    
    html += `
                </ul>
            </div>
        </div>
        <div class="mt-3">
            <h6>Recommended Careers:</h6>
            <div class="row">
    `;
    
    personalityResults.career_matches.forEach(career => {
        html += `<div class="col-md-6"><div class="career-match"><h6>${career}</h6></div></div>`;
    });
    
    html += `
            </div>
        </div>
        <div class="mt-3">
            <small class="text-muted">Completed: ${new Date(latestAssessment.completed_at).toLocaleDateString()}</small>
        </div>
    `;
    
    container.innerHTML = html;
}

async function loadAssessmentHistory() {
    try {
        const response = await fetch(`${API_BASE_URL}/user/assessment-history`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to load assessment history');
        
        const data = await response.json();
        const container = document.getElementById('assessmentHistory');
        
        if (data.success && data.assessments && data.assessments.length > 0) {
            let html = '<div class="list-group">';
            
            data.assessments.forEach((assessment, index) => {
                const date = new Date(assessment.completed_at).toLocaleDateString();
                const results = assessment.results || {};
                
                html += `
                    <div class="list-group-item">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="mb-1">Assessment #${data.assessments.length - index}</h6>
                                <p class="mb-1">Type: <strong>${results.name || assessment.personality_type}</strong></p>
                                <small class="text-muted">Completed: ${date}</small>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p class="text-muted">No assessment history found.</p>';
        }
    } catch (error) {
        console.error('Error loading assessment history:', error);
        document.getElementById('assessmentHistory').innerHTML = '<p class="text-muted">Error loading assessment history.</p>';
    }
}

async function loadResumes() {
    try {
        const response = await fetch(`${API_BASE_URL}/user/resumes`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to load resumes');
        
        const data = await response.json();
        const container = document.getElementById('resumeList');
        
        if (data.success && data.resumes && data.resumes.length > 0) {
            let html = '<div class="list-group">';
            
            data.resumes.forEach(resume => {
                const date = new Date(resume.uploaded_at).toLocaleDateString();
                const currentBadge = resume.is_current ? '<span class="badge bg-success ms-2">Current</span>' : '';
                
                html += `
                    <div class="list-group-item">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="mb-1">${resume.filename} ${currentBadge}</h6>
                                <small class="text-muted">Uploaded: ${date}</small>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p class="text-muted">No resumes uploaded yet.</p>';
        }
    } catch (error) {
        console.error('Error loading resumes:', error);
        document.getElementById('resumeList').innerHTML = '<p class="text-muted">Error loading resumes.</p>';
    }
}

async function updateProfile() {
    const firstName = document.getElementById('profileFirstName').value.trim();
    const lastName = document.getElementById('profileLastName').value.trim();
    
    try {
        showLoading('Updating profile...');
        
        const response = await fetch(`${API_BASE_URL}/user/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                first_name: firstName || null,
                last_name: lastName || null
            })
        });
        
        const data = await response.json();
        hideLoading();
        
        if (data.success) {
            currentUser = data.user;
            alert('Profile updated successfully!');
        } else {
            alert('Failed to update profile: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        hideLoading();
        alert('Error updating profile: ' + error.message);
        console.error('Update profile error:', error);
    }
}

async function uploadResumeFromProfile() {
    const fileInput = document.getElementById('profileResumeUpload');
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
        showLoading('Uploading resume...');
        
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${API_BASE_URL}/upload-resume`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        
        if (!response.ok) throw new Error('Failed to upload resume');
        
        const data = await response.json();
        
        if (data.success) {
            hideLoading();
            alert('Resume uploaded successfully!');
            fileInput.value = '';
            loadResumes(); // Reload resume list
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

// Share Functions
function getShareUrl() {
    // Get current page URL
    return window.location.href.split('?')[0]; // Remove query params
}

function getShareText() {
    // Generate share text based on context
    let baseText = "Discover your ideal career path with AI Career Path! Take a free personality assessment and get personalized career recommendations.";
    
    // If on results page, include personality type
    if (assessmentResults && assessmentResults.personality_type && assessmentResults.results) {
        const personalityName = assessmentResults.results.name || assessmentResults.personality_type;
        baseText = `I just discovered I'm a ${personalityName}! Discover your ideal career path with AI Career Path - take a free personality assessment and get personalized career recommendations.`;
    }
    
    return baseText;
}

function showShareModal() {
    const modal = new bootstrap.Modal(document.getElementById('shareModal'));
    const shareUrl = getShareUrl();
    const shareLinkInput = document.getElementById('shareLinkInput');
    
    // Set share link in input
    if (shareLinkInput) {
        shareLinkInput.value = shareUrl;
    }
    
    // Check if native share is available (mobile devices)
    const nativeShareContainer = document.getElementById('nativeShareContainer');
    if (navigator.share) {
        if (nativeShareContainer) {
            nativeShareContainer.style.display = 'block';
        }
    } else {
        if (nativeShareContainer) {
            nativeShareContainer.style.display = 'none';
        }
    }
    
    modal.show();
}

async function nativeShare() {
    const shareData = {
        title: 'AI Career Path - Discover Your Ideal Career',
        text: getShareText(),
        url: getShareUrl()
    };
    
    try {
        if (navigator.share) {
            await navigator.share(shareData);
            // Close modal after sharing
            const modal = bootstrap.Modal.getInstance(document.getElementById('shareModal'));
            if (modal) modal.hide();
        }
    } catch (error) {
        // User cancelled or error occurred
        if (error.name !== 'AbortError') {
            console.error('Error sharing:', error);
        }
    }
}

function shareOnFacebook() {
    const shareUrl = getShareUrl();
    const shareText = encodeURIComponent(getShareText());
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${shareText}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
}

function shareOnTwitter() {
    const shareUrl = getShareUrl();
    const shareText = encodeURIComponent(getShareText());
    const twitterUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
}

function shareOnLinkedIn() {
    const shareUrl = getShareUrl();
    const shareText = encodeURIComponent(getShareText());
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(linkedInUrl, '_blank', 'width=600,height=400');
}

function shareOnWhatsApp() {
    const shareUrl = getShareUrl();
    const shareText = encodeURIComponent(getShareText() + ' ' + shareUrl);
    const whatsappUrl = `https://wa.me/?text=${shareText}`;
    window.open(whatsappUrl, '_blank');
}

function shareViaEmail() {
    const shareUrl = getShareUrl();
    const shareText = getShareText();
    const subject = encodeURIComponent('Check out AI Career Path!');
    const body = encodeURIComponent(`${shareText}\n\n${shareUrl}`);
    const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
    window.location.href = mailtoUrl;
}

async function copyLinkToClipboard(event) {
    const shareLinkInput = document.getElementById('shareLinkInput');
    const shareUrl = shareLinkInput ? shareLinkInput.value : getShareUrl();
    
    try {
        await navigator.clipboard.writeText(shareUrl);
        
        // Show success feedback
        let button;
        if (event && event.target) {
            button = event.target.closest('button');
        } else {
            // Find the copy button
            button = document.querySelector('button[onclick*="copyLinkToClipboard"]');
        }
        
        if (button) {
            const originalHTML = button.innerHTML;
            button.innerHTML = '<i class="bi bi-check"></i> Copied!';
            button.classList.add('btn-success');
            button.classList.remove('btn-outline-secondary');
            
            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.classList.remove('btn-success');
                button.classList.add('btn-outline-secondary');
            }, 2000);
        } else {
            alert('Link copied to clipboard!');
        }
        
    } catch (error) {
        console.error('Failed to copy:', error);
        // Fallback for older browsers
        if (shareLinkInput) {
            shareLinkInput.select();
            shareLinkInput.setSelectionRange(0, 99999); // For mobile devices
            try {
                document.execCommand('copy');
                alert('Link copied to clipboard!');
            } catch (err) {
                alert('Please copy the link manually');
            }
        }
    }
}

// Contact Functions
function showContactModal() {
    const modal = new bootstrap.Modal(document.getElementById('contactModal'));
    modal.show();
}

function handleContactForm(event) {
    event.preventDefault();
    
    const formData = {
        name: document.getElementById('contactName').value,
        email: document.getElementById('contactEmail').value,
        subject: document.getElementById('contactSubject').value,
        message: document.getElementById('contactMessage').value
    };
    
    // For now, just show a success message
    // In a real implementation, you would send this to your backend
    alert('Thank you for your message! We\'ll get back to you soon.');
    
    // Reset form
    document.getElementById('contactForm').reset();
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('contactModal'));
    modal.hide();
    
    console.log('Contact form submitted:', formData);
}

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    // Show home page by default
    showPage('homePage');
    
    // Check authentication status
    checkAuthStatus();
    
    // Add smooth scrolling for better UX
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Initialize tooltips if any
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Initialize contact form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }
    
    // Initialize login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', login);
    }
    
    // Initialize register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', register);
    }
    
    // Initialize cat icon hover effect
    const catIcon = document.getElementById('catIcon');
    const catFace = document.getElementById('catFace');
    if (catIcon && catFace) {
        catIcon.addEventListener('mouseenter', function() {
            catFace.textContent = '0v0';
        });
        catIcon.addEventListener('mouseleave', function() {
            catFace.textContent = '-.-';
        });
    }
});

// Error handling for unhandled promises
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    // You could show a user-friendly error message here
});
