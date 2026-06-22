/*

Voice Memo App
Stage 1

Features

* Speech recognition
* Automatic memo splitting by silence
* Audio recording
* Audio playback
* TXT export

# Author: Refactored version

*/

let memoCounter = 1;
let isManuallyStopped = false;

let currentMemo = null;
let accumulatedText = "";

let silenceTimer = null;
const SILENCE_LIMIT = 2500;

/* ----------------------------------
Audio Recording
----------------------------------- */

let mediaRecorder = null;
let audioChunks = [];

/* ----------------------------------
Speech Recognition
----------------------------------- */

const SpeechRecognition =
window.SpeechRecognition ||
window.webkitSpeechRecognition;

if (!SpeechRecognition) {


alert(
    "Speech Recognition is not supported in this browser."
);


} else {


const recognition =
    new SpeechRecognition();

recognition.continuous = true;
recognition.interimResults = true;

/* ----------------------------------
   DOM Elements
----------------------------------- */

const startBtn =
    document.getElementById("start-btn");

const stopBtn =
    document.getElementById("stop-btn");

const clearBtn =
    document.getElementById("clear-btn");

const downloadBtn =
    document.getElementById("download-btn");

const transcriptDiv =
    document.getElementById("transcript");

const status =
    document.getElementById("status");

const langSelect =
    document.getElementById("language-select");

const container =
    document.getElementById(
        "transcript-container"
    );

/* ----------------------------------
   Setup Audio Recorder
----------------------------------- */

async function setupRecorder() {

    try {

        const stream =
            await navigator.mediaDevices.getUserMedia({
                audio: true
            });

        mediaRecorder =
            new MediaRecorder(stream);

        mediaRecorder.ondataavailable =
            (event) => {

                audioChunks.push(event.data);

            };

        mediaRecorder.onstop =
            handleAudioFinished;

    } catch (error) {

        console.error(error);

        alert(
            "Microphone permission denied."
        );
    }
}

setupRecorder();

/* ----------------------------------
   Create Memo Card
----------------------------------- */

function createMemoCard() {

    const now = new Date();

    const timestamp =
        now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });

    const card =
        document.createElement("div");

    card.className = "memo-entry";

    card.innerHTML = `
        <span class="memo-id">
            #${memoCounter}
            •
            ${timestamp}
        </span>

        <div class="memo-text"></div>

        <div class="audio-container"></div>
    `;

    transcriptDiv.appendChild(card);

    currentMemo = {

        card,

        textElement:
            card.querySelector(".memo-text"),

        audioContainer:
            card.querySelector(
                ".audio-container"
            )
    };

    memoCounter++;

    container.scrollTop =
        container.scrollHeight;
}

/* ----------------------------------
   Audio Finished
----------------------------------- */

function handleAudioFinished() {

    if (!currentMemo) return;

    const blob =
        new Blob(audioChunks, {
            type: "audio/webm"
        });

    const audioURL =
        URL.createObjectURL(blob);

    const audio =
        document.createElement("audio");

    audio.controls = true;
    audio.src = audioURL;

    currentMemo.audioContainer.appendChild(
        audio
    );

    audioChunks = [];
}

/* ----------------------------------
   Start Audio Recording
----------------------------------- */

function startAudioRecording() {

    if (
        mediaRecorder &&
        mediaRecorder.state !== "recording"
    ) {

        audioChunks = [];

        mediaRecorder.start();
    }
}

/* ----------------------------------
   Stop Audio Recording
----------------------------------- */

function stopAudioRecording() {

    if (
        mediaRecorder &&
        mediaRecorder.state === "recording"
    ) {

        mediaRecorder.stop();
    }
}

/* ----------------------------------
   Speech Start
----------------------------------- */

recognition.onstart = () => {

    status.innerText =
        "Listening...";

    status.style.color =
        "#0ea5e9";

    startBtn.disabled = true;
    stopBtn.disabled = false;

    isManuallyStopped = false;

    accumulatedText = "";

    createMemoCard();

    startAudioRecording();
};

/* ----------------------------------
   Speech Result
----------------------------------- */

recognition.onresult = (event) => {

    if (!currentMemo) return;

    let interimText = "";

    for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
    ) {

        const transcript =
            event.results[i][0]
                .transcript;

        if (
            event.results[i].isFinal
        ) {

            accumulatedText +=
                transcript + " ";

        } else {

            interimText +=
                transcript;
        }
    }

    currentMemo.textElement.innerHTML =
        accumulatedText +
        `<span style="color:#0ea5e9">${interimText}</span>`;

    clearTimeout(silenceTimer);

    silenceTimer = setTimeout(
        () => {

            currentMemo = null;

            accumulatedText = "";

            stopAudioRecording();

            recognition.stop();

        },
        SILENCE_LIMIT
    );

    container.scrollTop =
        container.scrollHeight;
};

/* ----------------------------------
   Errors
----------------------------------- */

recognition.onerror = (event) => {

    if (
        event.error ===
        "no-speech"
    ) return;

    status.innerText =
        "Error: " +
        event.error;
};

/* ----------------------------------
   Recognition End
----------------------------------- */

recognition.onend = () => {

    if (isManuallyStopped) {

        status.innerText =
            "Stopped";

        status.style.color = "";

        startBtn.disabled =
            false;

        stopBtn.disabled =
            true;

        return;
    }

    setTimeout(() => {

        try {

            recognition.start();

        } catch (error) {

            console.log(error);
        }

    }, 300);
};

/* ----------------------------------
   Buttons
----------------------------------- */

startBtn.onclick = () => {

    recognition.lang =
        langSelect.value;

    recognition.start();
};

stopBtn.onclick = () => {

    isManuallyStopped = true;

    stopAudioRecording();

    recognition.stop();
};

clearBtn.onclick = () => {

    if (
        !confirm(
            "Clear all memos?"
        )
    ) return;

    transcriptDiv.innerHTML = "";

    memoCounter = 1;

    currentMemo = null;

    accumulatedText = "";
};

downloadBtn.onclick = () => {

    const text =
        transcriptDiv.innerText;

    if (!text.trim()) return;

    const blob =
        new Blob([text], {
            type: "text/plain"
        });

    const url =
        URL.createObjectURL(
            blob
        );

    const a =
        document.createElement("a");

    a.href = url;

    a.download =
        `voice-memo-${
            new Date()
                .toISOString()
                .slice(0, 10)
        }.txt`;

    a.click();

    URL.revokeObjectURL(url);
};


}
