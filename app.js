// CONFIGURATION
// 1. REPLACE THIS URL with your actual Twilio Function URL from Phase B
const TOKEN_URL = "https://makeacall-2394.twil.io/token"; 

let device;
let activeCall;

// DOM Elements
const statusText = document.getElementById("status-text");
const statusLight = document.getElementById("status-light");
const phoneNumberInput = document.getElementById("phoneNumber");
const btnCall = document.getElementById("btn-call");
const btnHangup = document.getElementById("btn-hangup");
const btnMute = document.getElementById("btn-mute");

// 1. Initialize logic on page load
window.addEventListener("DOMContentLoaded", async () => {
    updateStatus("Initializing...", "offline");
    try {
        await startupClient();
    } catch (err) {
        updateStatus("Init Failed: " + err.message, "error");
        console.error(err);
    }
});

// 2. Fetch Token and Setup Device
async function startupClient() {
    updateStatus("Fetching Token...", "offline");
    
    const response = await fetch(TOKEN_URL);
    const data = await response.json();
    
    // Initialize Twilio Device (Voice SDK v2)
    device = new Twilio.Device(data.token, {
        codecPreferences: ["opus", "pcmu"], // Opus is high quality audio
        logLevel: 0 // Set to 1 for debugging
    });

    // Device Event Listeners
    device.on("registered", () => {
        updateStatus("Ready to Call", "ready");
    });

    device.on("error", (error) => {
        updateStatus("Error: " + error.message, "error");
    });
    
    // Register the device to receive/make calls
    device.register();
}

// 3. UI Interactions
btnCall.addEventListener("click", async () => {
    const params = { To: phoneNumberInput.value };
    
    if (!params.To) {
        alert("Please enter a phone number.");
        return;
    }

    updateStatus(`Calling ${params.To}...`, "busy");
    
    // Connect the call
    activeCall = await device.connect({ params: params });

    // Handle Call Events
    activeCall.on("accept", () => {
        updateStatus("In Call", "busy");
        toggleButtons(true); // Enable Hangup, Disable Call
    });

    activeCall.on("disconnect", () => {
        updateStatus("Call Ended", "ready");
        toggleButtons(false); // Enable Call, Disable Hangup
        activeCall = null;
    });
});

btnHangup.addEventListener("click", () => {
    if (activeCall) {
        device.disconnectAll();
    }
});

btnMute.addEventListener("click", () => {
    if (activeCall) {
        const isMuted = activeCall.isMuted();
        activeCall.mute(!isMuted);
        btnMute.classList.toggle("active");
        btnMute.innerText = isMuted ? "Mute" : "Unmute";
    }
});

// Helper: Add numbers to screen from keypad
window.addToScreen = (num) => {
    phoneNumberInput.value += num;
};

// Helper: Update Status Bar
function updateStatus(text, type) {
    statusText.innerText = text;
    statusLight.className = ""; // Reset
    statusLight.classList.add(`status-${type}`);
}

// Helper: Toggle Buttons State
function toggleButtons(isInCall) {
    btnCall.disabled = isInCall;
    btnHangup.disabled = !isInCall;
    btnMute.disabled = !isInCall;
    
    btnCall.style.opacity = isInCall ? "0.5" : "1";
    btnHangup.style.opacity = isInCall ? "1" : "0.5";
}