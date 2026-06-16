/* Voice Memo App - Clean Final Version
   - Single responsibility design
   - Silence-based memo splitting
   - Stable SpeechRecognition handling
*/

let memoCounter = 1;
let isManuallyStopped = false;

let currentMemoElement = null;
let accumulatedText = "";

// Silence detection (controls session splitting)
let silenceTimer = null;
const SILENCE_LIMIT = 2500; // 2.5 seconds

const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

console.log(SpeechRecognition);

if (!SpeechRecognition) {
    alert("Speech Recognition is not supported in this browser.");
} else {
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;

    const startBtn = document.getElementById("start-btn");
    const stopBtn = document.getElementById("stop-btn");
    const clearBtn = document.getElementById("clear-btn");
    const downloadBtn = document.getElementById("download-btn");
    const transcriptDiv = document.getElementById("transcript");
    const status = document.getElementById("status");
    const langSelect = document.getElementById("language-select");
    const container = document.getElementById("transcript-container");

    /* START SESSION */
    recognition.onstart = () => {
        console.log("START");

        status.innerText = "Listening...";
        status.style.color = "#0ea5e9";

        startBtn.disabled = true;
        stopBtn.disabled = false;

        isManuallyStopped = false;

        // Create new memo block
        const now = new Date();
        const timestamp = `[${now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        })}]`;

        currentMemoElement = document.createElement("div");
        currentMemoElement.className = "memo-entry";

        currentMemoElement.innerHTML = `
            <span class="memo-id">[${memoCounter}] ${timestamp}</span>
            <span class="memo-text"></span>
        `;

        transcriptDiv.appendChild(currentMemoElement);

        accumulatedText = "";
        memoCounter++;
    };

    /* SPEECH RESULT HANDLER */
    recognition.onresult = (event) => {
        // Safety guard: ignore late events after session closed
        if (!currentMemoElement) return;

        let interimText = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;

            if (event.results[i].isFinal) {
                accumulatedText += transcript + " ";
            } else {
                interimText += transcript;
            }
        }

        // Update UI safely
        const textSpan = currentMemoElement.querySelector(".memo-text");

        if (textSpan) {
            textSpan.innerHTML =
                accumulatedText +
                `<span style="color:#0ea5e9;">${interimText}</span>`;
        }

        // Reset silence timer (core logic)
        clearTimeout(silenceTimer);

        silenceTimer = setTimeout(() => {
            console.log("SILENCE DETECTED → CLOSE SESSION");

            // Close current memo session
            currentMemoElement = null;
            accumulatedText = "";

            // Stop recognition (will trigger onend)
            recognition.stop();
        }, SILENCE_LIMIT);

        // Auto-scroll
        container.scrollTop = container.scrollHeight;
    };

    /* ERROR HANDLING */
    recognition.onerror = (event) => {
        console.log("ERROR:", event.error);

        if (event.error === "no-speech") return;

        status.innerText = "Error: " + event.error;
    };

    /* SESSION END HANDLER (reconnect only) */
    recognition.onend = () => {
        console.log("END");

        // Manual stop = do nothing
        if (isManuallyStopped) {
            status.innerText = "Stopped.";
            status.style.color = "";

            startBtn.disabled = false;
            stopBtn.disabled = true;
            return;
        }

        // Auto-restart (important for continuous UX)
        setTimeout(() => {
            try {
                recognition.start();
            } catch (e) {
                console.log("Restart blocked:", e.message);
            }
        }, 300);
    };

    /* UI: START */
    startBtn.onclick = () => {
        recognition.lang = langSelect.value;
        recognition.start();
    };

    /* UI: STOP */
    stopBtn.onclick = () => {
        isManuallyStopped = true;
        recognition.stop();
    };

    /* UI: CLEAR */
    clearBtn.onclick = () => {
        if (confirm("Clear all?")) {
            transcriptDiv.innerHTML = "";
            memoCounter = 1;
            accumulatedText = "";
            currentMemoElement = null;
        }
    };

    /* UI: DOWNLOAD */
    downloadBtn.onclick = () => {
        const text = transcriptDiv.innerText;
        if (!text) return;

        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `my-ideas-${new Date()
            .toISOString()
            .slice(0, 10)}.txt`;

        a.click();

        URL.revokeObjectURL(url);
    };
}