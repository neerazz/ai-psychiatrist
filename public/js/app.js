// AI Psychiatrist - Frontend Application
// Reference: Requirements R1 (Session Management), R4 (Communication)

class AIPsychiatristApp {
    constructor() {
        this.socket = null;
        this.sessionId = null;
        this.patientId = null;
        this.timerInterval = null;
        this.elapsedSeconds = 0;
        
        this.init();
    }

    init() {
        // Bind event listeners
        document.getElementById('start-session-btn').addEventListener('click', () => this.startSession());
        document.getElementById('end-session-btn').addEventListener('click', () => this.endSession());
        document.getElementById('send-btn').addEventListener('click', () => this.sendMessage());
        document.getElementById('new-session-btn').addEventListener('click', () => this.showWelcome());
        
        // Text input handling
        const input = document.getElementById('user-input');
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Check API health on load
        this.checkHealth();
    }

    async checkHealth() {
        try {
            const response = await fetch('/api/health');
            const data = await response.json();
            console.log('API Health:', data);
        } catch (error) {
            console.warn('API not available:', error);
        }
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }

    async startSession() {
        const patientIdInput = document.getElementById('patient-id');
        this.patientId = patientIdInput.value.trim();

        if (!this.patientId) {
            alert('Please enter your Patient ID');
            return;
        }

        this.showLoading(true);

        try {
            // Start session via API
            const response = await fetch('/api/session/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ patientId: this.patientId })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to start session');
            }

            this.sessionId = data.sessionId;
            console.log('Session started:', this.sessionId);

            // Connect WebSocket
            this.connectWebSocket();

            // Show session screen
            this.showScreen('session-screen');
            this.startTimer();
            
            // Clear transcript
            const transcript = document.getElementById('transcript');
            transcript.innerHTML = `
                <div class="message system">
                    <p>Session started. Dr. Sterling is ready to listen.</p>
                </div>
            `;

            this.addMessage('therapist', "Hello, I'm Dr. Sterling. Thank you for joining me today. How are you feeling?");

        } catch (error) {
            console.error('Failed to start session:', error);
            alert('Failed to start session: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        this.socket = io(window.location.origin);

        this.socket.on('connect', () => {
            console.log('WebSocket connected');
            if (this.sessionId) {
                this.socket.emit('session:join', { sessionId: this.sessionId });
            }
        });

        this.socket.on('therapist:response', (data) => {
            this.addMessage('therapist', data.text);
        });

        this.socket.on('session:timer', (data) => {
            this.updateTimer(data.remainingMs);
        });

        this.socket.on('session:warning', (data) => {
            this.showWarning(data.message);
        });

        this.socket.on('crisis:detected', (data) => {
            this.showCrisisBanner(data.tier);
        });

        this.socket.on('error', (data) => {
            console.error('WebSocket error:', data);
        });

        this.socket.on('disconnect', () => {
            console.log('WebSocket disconnected');
        });
    }

    async sendMessage() {
        const input = document.getElementById('user-input');
        const text = input.value.trim();

        if (!text) return;

        // Add patient message to transcript
        this.addMessage('patient', text);
        input.value = '';

        // Update status
        document.getElementById('session-status').textContent = 'Dr. Sterling is thinking...';

        try {
            // Send via WebSocket if connected
            if (this.socket && this.socket.connected) {
                this.socket.emit('patient:input', { text });
            } else {
                // Fallback to REST API with mock response
                // In production, this would call the actual agent
                setTimeout(() => {
                    const responses = [
                        "I hear what you're saying. Can you tell me more about how that makes you feel?",
                        "That sounds like it's been weighing on you. What do you think might help?",
                        "Thank you for sharing that with me. It takes courage to open up.",
                        "I'm curious - when did you first notice these feelings?",
                        "It seems like there's a lot going on for you right now. Let's take this one step at a time."
                    ];
                    const response = responses[Math.floor(Math.random() * responses.length)];
                    this.addMessage('therapist', response);
                }, 1000);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        }

        document.getElementById('session-status').textContent = 'In Session';
    }

    addMessage(type, text) {
        const transcript = document.getElementById('transcript');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.innerHTML = `<p>${this.escapeHtml(text)}</p>`;
        transcript.appendChild(messageDiv);
        
        // Scroll to bottom
        transcript.scrollTop = transcript.scrollHeight;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    startTimer() {
        this.elapsedSeconds = 0;
        const maxSeconds = 25 * 60; // 25 minutes

        this.timerInterval = setInterval(() => {
            this.elapsedSeconds++;
            const remaining = maxSeconds - this.elapsedSeconds;
            this.updateTimerDisplay(remaining);

            // Warning at 5 minutes remaining
            if (remaining === 5 * 60) {
                document.getElementById('session-timer').classList.add('warning');
                this.addMessage('system', '5 minutes remaining in your session.');
            }

            // Auto-end session
            if (remaining <= 0) {
                this.endSession();
            }
        }, 1000);
    }

    updateTimerDisplay(remainingSeconds) {
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;
        const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('session-timer').textContent = display;
    }

    updateTimer(remainingMs) {
        const remainingSeconds = Math.floor(remainingMs / 1000);
        this.updateTimerDisplay(remainingSeconds);
    }

    showWarning(message) {
        document.getElementById('session-timer').classList.add('warning');
        this.addMessage('system', message);
    }

    showCrisisBanner(tier) {
        const banner = document.getElementById('crisis-banner');
        banner.classList.remove('hidden');
        
        // Log for safety
        console.warn('Crisis detected, tier:', tier);
    }

    async endSession() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        this.showLoading(true);

        try {
            const response = await fetch('/api/session/end', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            // Show summary
            document.getElementById('session-summary').innerHTML = `
                <p><strong>Duration:</strong> ${Math.floor((data.duration || this.elapsedSeconds * 1000) / 60000)} minutes</p>
                <p><strong>Summary:</strong> ${data.summary || 'Thank you for your session today.'}</p>
                <p>Take care of yourself, and remember that support is always available.</p>
            `;

            this.showScreen('summary-screen');

        } catch (error) {
            console.error('Failed to end session:', error);
            this.showScreen('summary-screen');
        } finally {
            this.showLoading(false);
            
            // Disconnect WebSocket
            if (this.socket) {
                this.socket.disconnect();
                this.socket = null;
            }
        }
    }

    showWelcome() {
        this.sessionId = null;
        this.patientId = null;
        document.getElementById('patient-id').value = '';
        document.getElementById('crisis-banner').classList.add('hidden');
        document.getElementById('session-timer').classList.remove('warning');
        this.showScreen('welcome-screen');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AIPsychiatristApp();
});
