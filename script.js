
/* =========================================================
   Voice Memo App (Stable Transcript Version)
   Focus: NEVER lose text (production-safe structure)
   ========================================================= */

/* -----------------------------
   Global State
------------------------------ */

let memoCounter = 1;

let currentMemo = null;
let accumulatedText = "";
let lastTranscript = "";

let silenceTimer = null;
const SILENCE_LIMIT = 2500;

let isManuallyStopped = false;
let isFirstResult = true;

/* -----------------------------
   Speech Recognition Setup
------------------------------ */

const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    alert("Speech Recognition is not supported in this browser.");
}

const recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;

/* -----------------------------
   DOM Elements
------------------------------ */

const startBtn = document.getElementById("start-btn");
const stopBtn = document.getElementById("stop-btn");
const clearBtn = document.getElementById("clear-btn");
const downloadBtn = document.getElementById("download-btn");

const transcriptDiv = document.getElementById("transcript");
const status = document.getElementById("status");
const hint = document.getElementById("hint");
const langSelect = document.getElementById("language-select");
const container = document.getElementById("transcript-container");

/* -----------------------------
   UI Hint
------------------------------ */

hint.textContent =
    `A new memo is created after ${SILENCE_LIMIT / 1000} seconds of silence.`;

/* -----------------------------
   Create Memo Card
------------------------------ */

function createMemoCard() {
    const now = new Date();

    const timestamp = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });

    const card = document.createElement("div");
    card.className = "memo-entry";

    card.innerHTML = `
        <span class="memo-id">#${memoCounter} • ${timestamp}</span>
        <div class="memo-text"></div>
        <div class="audio-container"></div>
    `;

    transcriptDiv.appendChild(card);

    currentMemo = {
        card,
        textElement: card.querySelector(".memo-text"),
        audioContainer: card.querySelector(".audio-container")
    };

    memoCounter++;

    container.scrollTop = container.scrollHeight;
}

/* -----------------------------
   Finalize Memo (SAFE VERSION)
   Ensures text is always saved
------------------------------ */

function finalizeMemo() {
    if (!currentMemo || !currentMemo.textElement) return;

    const finalText = accumulatedText.trim();

    // Always persist text even if partial
    currentMemo.textElement.innerText =
        finalText.length > 0 ? finalText : "(no transcript)";

    // Reset buffers safely
    accumulatedText = "";
    lastTranscript = "";

    // IMPORTANT:
    // Do NOT null immediately (prevents race condition)
    setTimeout(() => {
        currentMemo = null;
    }, 0);
}

/* -----------------------------
   Speech Start
------------------------------ */

recognition.onstart = () => {
    status.innerText = "Listening...";
    status.style.color = "#0ea5e9";

    startBtn.disabled = true;
    stopBtn.disabled = false;

    isManuallyStopped = false;

    accumulatedText = "";
    isFirstResult = true;

    createMemoCard();
};

/* -----------------------------
   Speech Result Handler
   (CRITICAL: prevent text loss)
------------------------------ */

recognition.onresult = (event) => {
    if (!currentMemo || !currentMemo.textElement) return;

    let interimText = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {

            // Protect first spoken chunk
            if (isFirstResult) {
                accumulatedText = transcript + " ";
                isFirstResult = false;
            } else {
                accumulatedText += transcript + " ";
            }

        } else {
            interimText += transcript;
        }
    }

    lastTranscript = accumulatedText + interimText;

    // Live UI update
    currentMemo.textElement.innerHTML =
        accumulatedText +
        `<span style="color:#0ea5e9">${interimText}</span>`;

    /* -----------------------------
       Silence detection
       ONLY finalizes memo (NO stop)
    ------------------------------ */

    clearTimeout(silenceTimer);

    silenceTimer = setTimeout(() => {
        finalizeMemo();
    }, SILENCE_LIMIT);

    container.scrollTop = container.scrollHeight;
};

/* -----------------------------
   Error Handling
------------------------------ */

recognition.onerror = (event) => {
    if (event.error === "no-speech") return;
    status.innerText = "Error: " + event.error;
};

/* -----------------------------
   Auto restart (stability layer)
------------------------------ */

recognition.onend = () => {
    if (isManuallyStopped) {
        status.innerText = "Stopped";
        startBtn.disabled = false;
        stopBtn.disabled = true;
        return;
    }

    setTimeout(() => {
        try {
            recognition.start();
        } catch (e) {
            console.log("Restart blocked:", e.message);
        }
    }, 300);
};

/* -----------------------------
   UI Controls
------------------------------ */

startBtn.onclick = () => {
    recognition.lang = langSelect.value;
    recognition.start();
};

stopBtn.onclick = () => {
    isManuallyStopped = true;
    recognition.stop();
};

clearBtn.onclick = () => {
    if (!confirm("Clear all memos?")) return;

    transcriptDiv.innerHTML = "";
    memoCounter = 1;
    currentMemo = null;
    accumulatedText = "";
};

downloadBtn.onclick = () => {
    const text = transcriptDiv.innerText;

    if (!text.trim()) return;

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `voice-memo-${new Date().toISOString().slice(0, 10)}.txt`;

    a.click();

    URL.revokeObjectURL(url);
};