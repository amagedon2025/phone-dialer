class PhoneDialer {
    constructor() {
        this.phoneInput = document.getElementById('phoneNumber');
        this.callBtn = document.getElementById('callBtn');
        this.endBtn = document.getElementById('endBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.status = document.getElementById('status');
        this.callInfo = document.getElementById('callInfo');
        this.callingNumber = document.getElementById('callingNumber');
        this.callStatus = document.getElementById('callStatus');
        this.walletBtn = document.getElementById('walletBtn');
        this.redirectModal = document.getElementById('redirectModal');
        this.stayBtn = document.getElementById('stayBtn');
        this.proceedBtn = document.getElementById('proceedBtn');
        
        this.currentCall = null;
        this.callInterval = null;
        this.init();
    }

    init() {
        // Keypad buttons
        document.querySelectorAll('.key').forEach(key => {
            key.addEventListener('click', () => {
                this.addDigit(key.dataset.digit);
            });
        });

        // Control buttons
        this.callBtn.addEventListener('click', () => this.makeCall());
        this.endBtn.addEventListener('click', () => this.endCall());
        this.clearBtn.addEventListener('click', () => this.clearNumber());

        // Ethereum Wallet button
        this.walletBtn.addEventListener('click', () => this.showRedirectModal());

        // Modal buttons
        this.stayBtn.addEventListener('click', () => this.hideRedirectModal());
        this.proceedBtn.addEventListener('click', () => {
            this.hideRedirectModal();
            window.open('https://ethereum-vaults.com', '_blank');
        });

        // Keyboard input
        this.phoneInput.addEventListener('input', (e) => {
            this.formatPhoneNumber(e.target.value);
        });

        // Enter key to call
        this.phoneInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.makeCall();
        });

        // Close modal on outside click
        document.addEventListener('click', (e) => {
            if (e.target === this.redirectModal) {
                this.hideRedirectModal();
            }
        });

        // Prevent modal close on inner click
        this.redirectModal.querySelector('.modal-content').addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    addDigit(digit) {
        const current = this.phoneInput.value;
        if (current.length < 15) {
            this.phoneInput.value = current + digit;
            this.phoneInput.focus();
        }
    }

    clearNumber() {
        this.phoneInput.value = '';
        this.phoneInput.focus();
    }

    formatPhoneNumber(number) {
        // Basic formatting - you can enhance this
        this.phoneInput.value = number.replace(/[^\d+]/g, '');
    }

    async makeCall() {
        const number = this.phoneInput.value.trim();
        
        if (!number || !/^\+?[1-9]\d{1,14}$/.test(number.replace(/[^\d]/g, ''))) {
            this.setStatus('Please enter a valid phone number', 'error');
            return;
        }

        this.setStatus('Requesting call...', 'connecting');
        this.callBtn.disabled = true;
        this.endBtn.disabled = false;
        this.callInfo.style.display = 'block';
        this.callingNumber.textContent = number;
        this.callStatus.textContent = 'Connecting...';

        try {
            const response = await fetch('/make-call', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: number })
            });

            const data = await response.json();

            if (data.success) {
                this.setStatus('Call initiated! Ringing...', 'ringing');
                this.callStatus.textContent = 'Ringing...';
                
                // Poll for call status or use Twilio Client SDK
                this.startCallStatusPolling();
            } else {
                throw new Error(data.error || 'Failed to initiate call');
            }
        } catch (error) {
            console.error('Call error:', error);
            this.setStatus('Failed to make call. Please try again.', 'error');
            this.resetUI();
        }
    }

    endCall() {
        if (this.callInterval) {
            clearInterval(this.callInterval);
            this.callInterval = null;
        }
        
        if (this.currentCall) {
            this.currentCall.disconnect();
            this.currentCall = null;
        }
        this.resetUI();
        this.setStatus('Call ended', 'idle');
        this.callStatus.textContent = 'Disconnected';
    }

    resetUI() {
        this.callBtn.disabled = false;
        this.endBtn.disabled = true;
        // Keep call info visible briefly after hangup
        setTimeout(() => {
            this.callInfo.style.display = 'none';
        }, 2000);
    }

    setStatus(message, type = 'idle') {
        this.status.textContent = message;
        this.status.className = `status ${type}`;
    }

    startCallStatusPolling() {
        const statuses = ['Ringing...', 'Connected', 'In Progress', 'Call Active'];
        let index = 0;
        this.callInterval = setInterval(() => {
            this.callStatus.textContent = statuses[index % statuses.length];
            index++;
            
            if (index > 15) { // Simulate stable call after 15 cycles
                clearInterval(this.callInterval);
                this.callInterval = null;
                this.callStatus.textContent = 'Call Active';
                this.setStatus('Call connected! Use End Call to hang up.', 'connected');
            }
        }, 1200);
    }

    // Ethereum Wallet Modal Methods
    showRedirectModal() {
        this.redirectModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    hideRedirectModal() {
        this.redirectModal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scroll
    }
}

// Initialize dialer when page loads
document.addEventListener('DOMContentLoaded', () => {
    new PhoneDialer();
});

// Add haptic feedback for mobile devices
function vibrate(pattern = [50]) {
    if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
    }
}

// Add click feedback to buttons
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            vibrate([20]);
            btn.style.transform = 'scale(0.97)';
            setTimeout(() => {
                btn.style.transform = '';
            }, 100);
        });
    });
});