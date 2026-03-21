/* voce memo / 21.3.2026 */

/**
 * Voice Memo App - Speech Recognition Logic
 */

// [1] Initialize the counter at the top
let memoCounter = 1; 

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    alert("Speech Recognition is not supported in this browser.");
} else {
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const clearBtn = document.getElementById('clear-btn');
    const downloadBtn = document.getElementById('download-btn');
    const transcriptDiv = document.getElementById('transcript');
    const status = document.getElementById('status');
    const langSelect = document.getElementById('language-select');
    const container = document.getElementById('transcript-container');

    recognition.onstart = () => {
        status.innerText = "Listening...";
        startBtn.disabled = true;
        stopBtn.disabled = false;
    };

    recognition.onresult = (event) => {
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                const now = new Date();
                const timestamp = `[${now.toLocaleString()}] `;
                
                // [2] Add ID number and increment it
                finalTranscript += `[${memoCounter}] ` + timestamp + event.results[i][0].transcript + '\n';
                memoCounter++;
            }
        }

        if (finalTranscript) {
            transcriptDiv.innerText += finalTranscript;
            container.scrollTop = container.scrollHeight;
        }
    };

    recognition.onerror = (event) => {
        status.innerText = "Error: " + event.error;
        recognition.stop();
    };

    recognition.onend = () => {
        status.innerText = "Recognition stopped.";
        startBtn.disabled = false;
        stopBtn.disabled = true;
    };

    startBtn.onclick = () => {
        recognition.lang = langSelect.value;
        recognition.start();
    };

    stopBtn.onclick = () => {
        recognition.stop();
    };

    clearBtn.onclick = () => {
        if (confirm("Are you sure?")) {
            transcriptDiv.innerText = "";
            memoCounter = 1; // Reset counter when clearing
        }
    };

    downloadBtn.onclick = () => {
        const text = transcriptDiv.innerText;
        if (!text) return;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'my-voice-ideas.txt';
        a.click();
        URL.revokeObjectURL(url);
    };
}