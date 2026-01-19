// AI Psychiatrist - Frontend Application
// Reference: Requirements R1 (Session Management), R4 (Communication)

class AIPsychiatristApp {
    constructor() {
        this.socket = null;
        this.sessionId = null;
        this.patientId = null;
        this.timerInterval = null;
        this.elapsedSeconds = 0;
        
        // Initialize state


        this.init();
    }

    init() {
        // Bind event listeners
        document.getElementById('new-session-btn').addEventListener('click', () => this.startSession());
        document.getElementById('end-session-btn').addEventListener('click', () => this.endSession());
        document.getElementById('send-btn').addEventListener('click', () => this.sendMessage());
        document.getElementById('return-dashboard-btn').addEventListener('click', () => this.showScreen('dashboard-screen'));
        
        // Modal events
        const modal = document.getElementById('session-detail-modal');
        document.getElementById('close-modal-btn').addEventListener('click', () => this.closeSessionDetail());
        modal.querySelector('.modal-backdrop').addEventListener('click', () => this.closeSessionDetail());

        // Patient Modal events
        const patientModal = document.getElementById('patient-detail-modal');
        document.getElementById('view-details-btn').addEventListener('click', () => this.openPatientDetail());
        document.getElementById('close-patient-modal-btn').addEventListener('click', () => this.closePatientDetail());
        patientModal.querySelector('.modal-backdrop').addEventListener('click', () => this.closePatientDetail());
        
        
        // Text input handling
        const input = document.getElementById('user-input');
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Load Dashboard directly
        this.loadDashboard();
    }

    async loadDashboard() {
        this.showLoading(true);
        try {
            // 1. Get or Create Default Patient
            await this.ensureDefaultPatient();

            // 2. Render Patient Info
            this.renderPatientInfo();

            // 3. Render Session History
            await this.renderSessionHistory();

            this.showScreen('dashboard-screen');
        } catch (error) {
            console.error('Failed to load dashboard:', error);
            alert('Failed to load dashboard. Check console for details.');
        } finally {
            this.showLoading(false);
        }
    }

    async ensureDefaultPatient() {
        try {
            // Try to get existing patients
            const response = await fetch('/api/patients');
            const data = await response.json();
            
            if (data.patients && data.patients.length > 0) {
                // Use the first patient found
                this.patientId = data.patients[0].patient_id;
                this.currentPatient = data.patients[0];
            } else {
                // Create a new default patient
                console.log('No patients found, creating default...');
                const createResponse = await fetch('/api/patients', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        encryption_key_id: `default-key`,
                        focus_areas: ["Anxiety Management", "Work-Life Balance", "Sleep Hygiene"],
                        todos: ["Practice 4-7-8 breathing", "Log mood daily", "No screens after 10 PM"]
                    })
                });
                const createData = await createResponse.json();
                this.patientId = createData.patientId;
                
                // Fetch details
                const detailResponse = await fetch(`/api/patients/${this.patientId}`);
                const detailData = await detailResponse.json();
                this.currentPatient = detailData.patient;
            }
            console.log('Current Patient:', this.patientId);
        } catch (error) {
            console.error('Error ensuring default patient:', error);
            throw error;
        }
    }

    renderPatientInfo() {
        if (!this.currentPatient) return;

        // Static or Mock Info for POC
        document.getElementById('patient-name').textContent = `Patient ${this.patientId.slice(0, 6)}`;
        
        const badge = document.getElementById('patient-risk-badge');
        badge.textContent = `${this.currentPatient.current_risk_level || 'Low'} Risk`;
        badge.className = `badge ${this.currentPatient.current_risk_level || 'low'}`;

        // Render Focus Areas
        const focusList = document.getElementById('focus-areas-list');
        const focusAreas = this.currentPatient.focus_areas || [];
        focusList.innerHTML = focusAreas.length ? focusAreas
            .map(area => `<li>${area}</li>`)
            .join('') : '<li>No focus areas defined</li>';

        // Render Todos
        const todoList = document.getElementById('todos-list');
        const todos = this.currentPatient.todos || [];
        todoList.innerHTML = todos.length ? todos
            .map(todo => `<li>${todo}</li>`)
            .join('') : '<li>No active todos</li>';
    }

    async renderSessionHistory() {
        const container = document.getElementById('session-history-list');
        container.innerHTML = '<p class="loading-text">Loading history...</p>';

        try {
            const response = await fetch(`/api/patients/${this.patientId}/sessions`);
            const data = await response.json();
            const sessions = data.sessions || [];

            if (sessions.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; color: var(--text-secondary); padding: 20px;">
                        <p>No sessions yet.</p>
                        <p>Start a new session to begin therapy.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = sessions.map(session => {
                const date = new Date(session.created_at || Date.now()).toLocaleDateString(undefined, {
                    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                });
                
                return `
                <div class="session-card" onclick="app.openSessionDetail('${session.session_id}')" style="cursor: pointer;">
                    <div class="session-card-header">
                        <span class="session-date">${date}</span>
                        <span class="session-duration">${Math.floor((session.duration_seconds || 0) / 60)} min</span>
                    </div>
                    <div class="session-summary-preview">
                        ${session.summary_path ? 'Session summary available.' : 'No summary generated.'}
                    </div>
                </div>
            `}).join('');

        } catch (error) {
            console.error('Error loading history:', error);
            container.innerHTML = '<p class="error-text">Failed to load session history.</p>';
        }
    }

    async openSessionDetail(sessionId) {
        this.showLoading(true);
        try {
            const response = await fetch(`/api/sessions/${sessionId}`);
            const data = await response.json();
            const session = data.session;

            if (!session) throw new Error('Session not found');

            document.getElementById('modal-session-title').textContent = `Session ${new Date(session.created_at).toLocaleDateString()}`;
            document.getElementById('modal-session-date').textContent = new Date(session.started_at).toLocaleString();
            
            const duration = Math.floor((session.duration_seconds || 0) / 60);
            document.getElementById('modal-session-duration').textContent = `${duration} mins`;

            const risk = session.risk_level_end || session.risk_level_start || 'low';
            const riskBadge = document.getElementById('modal-session-risk');
            riskBadge.textContent = `${risk.toUpperCase()} Risk`;
            riskBadge.className = `badge ${risk}`;

            document.getElementById('modal-session-summary').textContent = session.summary_content || 'No summary available.';
            document.getElementById('modal-session-transcript').textContent = session.transcript_content || 'No transcript available.';

            document.getElementById('session-detail-modal').classList.remove('hidden');
        } catch (error) {
            console.error('Failed to load session details:', error);
            alert('Failed to load session details.');
        } finally {
            this.showLoading(false);
        }
    }

    closeSessionDetail() {
        document.getElementById('session-detail-modal').classList.add('hidden');
    }

    openPatientDetail() {
        if (!this.currentPatient) return;

        document.getElementById('modal-patient-name').textContent = `Patient ${this.patientId.slice(0, 6)}`;
        
        const risk = this.currentPatient.current_risk_level || 'low';
        const badge = document.getElementById('modal-patient-risk');
        badge.textContent = `${risk.toUpperCase()} Risk`;
        badge.className = `badge ${risk}`;

        document.getElementById('modal-patient-sessions-count').textContent = `${this.currentPatient.total_sessions || 0} Sessions`;
        document.getElementById('modal-patient-last-seen').textContent = `Last Seen: ${this.currentPatient.last_session_date ? new Date(this.currentPatient.last_session_date).toLocaleDateString() : 'New'}`;

        document.getElementById('modal-patient-focus').innerHTML = this.mockPatientDetails.focusAreas
            .map(area => `<li>${area}</li>`)
            .join('');

        document.getElementById('modal-patient-todos').innerHTML = this.mockPatientDetails.todos
            .map(todo => `<li>${todo}</li>`)
            .join('');

        document.getElementById('patient-detail-modal').classList.remove('hidden');
    }

    closePatientDetail() {
        document.getElementById('patient-detail-modal').classList.add('hidden');
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            if (screenId === 'dashboard-screen') {
                // Dashboard is always active underneath, overlay screens hide/show
                if (screen.id !== 'dashboard-screen') {
                     screen.classList.remove('active'); // Hide overlays
                     // Reset session UI if returning to dashboard
                     if (screen.id === 'session-screen') {
                        document.getElementById('transcript').innerHTML = '<div class="message system"><p>Session starting... Welcome.</p></div>';
                        document.getElementById('session-timer').textContent = '25:00';
                        document.getElementById('session-timer').classList.remove('warning');
                     }
                }
            } else {
                // Showing an overlay
                if (screen.id === screenId) {
                    screen.classList.add('active');
                } else if (screen.id !== 'dashboard-screen') {
                    screen.classList.remove('active');
                }
            }
        });
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
        if (!this.patientId) return;
        
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
                // If failed, try to reset and retry once
                console.warn('Session start failed, attempting reset...');
                await fetch('/api/session/reset', { method: 'POST' });
                
                const retryResponse = await fetch('/api/session/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ patientId: this.patientId })
                });
                
                if (!retryResponse.ok) {
                     const retryData = await retryResponse.json();
                     throw new Error(retryData.error || 'Failed to start session after retry');
                }
                
                Object.assign(data, await retryResponse.json());
            }

            this.sessionId = data.sessionId;
            console.log('Session started:', this.sessionId);

            // Connect WebSocket
            this.connectWebSocket();

            // Show session overlay
            this.showScreen('session-screen');
            this.startTimer();
            
            // Initial Greeting
            this.addMessage('therapist', "Hello, I'm Dr. Sterling. I'm glad you're here. How have you been since our last session?");

        } catch (error) {
            console.error('Failed to start session:', error);
            alert('Failed to start session: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    connectWebSocket() {
        if (this.socket) {
            this.socket.disconnect();
        }

        this.socket = io(window.location.origin);

        this.socket.on('connect', () => {
            console.log('WebSocket connected');
            if (this.sessionId) {
                this.socket.emit('session:join', { sessionId: this.sessionId });
            }
        });

        this.socket.on('therapist:response', (data) => {
            this.addMessage('therapist', data.text);
            document.getElementById('session-status').textContent = 'Listening...';
        });
        
        this.socket.on('therapist:speaking', (data) => {
             // Optional: Show typing indicator or stream
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
            if (this.socket && this.socket.connected) {
                this.socket.emit('patient:input', { text });
            } else {
                console.warn('Socket disconnected, attempting reconnect...');
                this.connectWebSocket();
                // Simulating fallback for POC if socket fails immediately
                setTimeout(() => this.socket.emit('patient:input', { text }), 1000);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    }

    addMessage(type, text) {
        const transcript = document.getElementById('transcript');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.innerHTML = `<p>${this.escapeHtml(text)}</p>`;
        transcript.appendChild(messageDiv);
        transcript.scrollTop = transcript.scrollHeight;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    startTimer() {
        this.elapsedSeconds = 0;
        const maxSeconds = 25 * 60;
        
        if (this.timerInterval) clearInterval(this.timerInterval);

        this.timerInterval = setInterval(() => {
            this.elapsedSeconds++;
            // Timer UI is updated via WebSocket in real app, but fallback here
        }, 1000);
    }

    updateTimerDisplay(remainingSeconds) {
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;
        document.getElementById('session-timer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    updateTimer(remainingMs) {
        this.updateTimerDisplay(Math.floor(remainingMs / 1000));
    }

    showWarning(message) {
        document.getElementById('session-timer').classList.add('warning');
        this.addMessage('system', message);
    }

    showCrisisBanner(tier) {
        document.getElementById('crisis-banner').classList.remove('hidden');
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

            document.getElementById('session-summary').innerHTML = `
                <p><strong>Duration:</strong> ${Math.floor((data.duration || this.elapsedSeconds * 1000) / 60000)} minutes</p>
                <p><strong>Summary:</strong> ${data.summary || 'Session completed successfully.'}</p>
            `;

            this.showScreen('summary-screen');
            
            // Refresh dashboard history
            this.renderSessionHistory();

        } catch (error) {
            console.error('Failed to end session:', error);
            this.showScreen('summary-screen');
        } finally {
            this.showLoading(false);
            if (this.socket) {
                this.socket.disconnect();
            }
        }
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AIPsychiatristApp();
});
