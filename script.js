/* Voice Memo App - Clean Final Version
   - Single responsibility design
   - Silence-based memo splitting
   - Stable SpeechRecognition handling
*/

let memoCounter = 1;
let isManuallyStopped = false;

let currentMemoElement = null;
let accumulatedText = "";

/* Silence detection */
let silenceTimer = null;
const SILENCE_LIMIT = 2500; // 2.5 seconds

const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;


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

    /* Create a new memo block */
    function createMemo() {
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
    }

    /* Recognition started */
    recognition.onstart = () => {
        console.log("Recognition started");

        status.innerText = "Listening...";
        status.style.color = "#0ea5e9";

        startBtn.disabled = true;
        stopBtn.disabled = false;

        isManuallyStopped = false;
    };

    /* Speech result */
    recognition.onresult = (event) => {
        let interimText = "";

        // Create a memo only when actual speech arrives
        if (!currentMemoElement) {
            createMemo();
        }

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;

            if (event.results[i].isFinal) {
                accumulatedText += transcript + " ";
            } else {
                interimText += transcript;
            }
        }

        const textSpan =
            currentMemoElement?.querySelector(".memo-text");

        if (textSpan) {
            textSpan.innerHTML =
                accumulatedText +
                `<span style="color:#0ea5e9;">${interimText}</span>`;
        }

        // Reset silence timer whenever speech is detected
        clearTimeout(silenceTimer);

        silenceTimer = setTimeout(() => {
            console.log("Silence detected");

            // Close current memo only
            currentMemoElement = null;
            accumulatedText = "";
        }, SILENCE_LIMIT);

        container.scrollTop = container.scrollHeight;
    };

    /* Error handling */
    recognition.onerror = (event) => {
        console.log("Recognition error:", event.error);

        if (event.error === "no-speech") {
            return;
        }

        status.innerText = `Error: ${event.error}`;
        status.style.color = "#ef4444";
    };

    /* Recognition ended */
    recognition.onend = () => {
        console.log("Recognition ended");

        if (isManuallyStopped) {
            status.innerText = "Stopped";
            status.style.color = "";

            startBtn.disabled = false;
            stopBtn.disabled = true;

            return;
        }

        // Auto-restart only when browser closes recognition unexpectedly
        try {
            recognition.start();
        } catch (error) {
            console.log("Restart blocked:", error.message);

            startBtn.disabled = false;
            stopBtn.disabled = true;
        }
    };

    /* Start button */
    startBtn.onclick = () => {
        recognition.lang = langSelect.value;

        try {
            recognition.start();
        } catch (error) {
            console.log(error);
        }
    };

    /* Stop button */
    stopBtn.onclick = () => {
        isManuallyStopped = true;

        clearTimeout(silenceTimer);

        recognition.stop();
    };

    /* Clear button */
    clearBtn.onclick = () => {
        if (!confirm("Clear all memos?")) {
            return;
        }

        transcriptDiv.innerHTML = "";

        memoCounter = 1;
        accumulatedText = "";
        currentMemoElement = null;

        clearTimeout(silenceTimer);
    };

    /* Download button */
    downloadBtn.onclick = () => {
        const text = transcriptDiv.innerText;

        if (!text.trim()) {
            return;
        }

        const blob = new Blob([text], {
            type: "text/plain;charset=utf-8",
        });

        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");

        a.href = url;
        a.download = `voice-memo-${
            new Date().toISOString().slice(0, 10)
        }.txt`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
    };
}

/* Register Service Worker */

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("./service-worker.js")
            .then(() => {
                console.log("Service Worker registered");
            })
            .catch((error) => {
                console.error("Service Worker registration failed:", error);
            });
    });
}