async function fetchData(url, requestData) {
    let dataReturn;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
        });

        const responseData = await response.json();

        if (responseData) {
            dataReturn = responseData;
        } else {
            alert("Something went wrong");
            return null;
        }
    } catch (error) {
        alert("Something went wrong");
        console.error('Error:', error);
        return null;
    }
    return dataReturn;
}

// DOM Elements
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");
const startBtn = document.getElementById("start-btn");
const shareScreenBtn = document.getElementById("share-screen-btn");
const muteBtn = document.getElementById("mute-btn");
const cameraBtn = document.getElementById("camera-btn");
const recordBtn = document.getElementById("record-btn");
const classroomIdDisplay = document.getElementById("classroom-id");
const chatMessages = document.querySelector(".chat-messages");
const videoFrameShare = document.getElementById('video-frame-share');
const viewersCounter = document.getElementById("viewers-counter");
const participantsContainer = document.getElementById("participants-container");
const endBtn = document.getElementById("end-meeting-btn");

// State Variables
let meeting = null;
let micEnabled = false;
let cameraEnabled = false;
let screenSharing = false;
let recording = false;
let participants_count = 0;
let participants_list = {};
var started = false;

let token = "init";
let roomId = "init";

async function setRoomId() {
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    if (params.get("roomId")) {
        roomId = params.get("roomId");
    } else {
        roomId = null;
    }
}

async function setAuthToken() {
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    if (params.get("authToken")) {
        token = params.get("authToken");
    } else {
        token = null;
    }
}

async function generateToken(){
    let data = await fetchData("./api/classroom/gentoken", {});
    if(data.token){
        token = data.token;
        await initializeVideoSDK(token);
    }
}

async function createClassroom(){
    let title = prompt("Enter a title for your classroom:");
    if(title){
        let data = await fetchData("./api/classroom/create", {roomToken: token, title});
        if(data.roomId && data.displayName){
            await startMeeting(data.roomId, data.displayName);
            classroomIdDisplay.textContent = `Classroom ID (Used to join): ${data.roomId} (Host)`;
            roomId = data.roomId;
        }
    }else{
        alert("Title cannot be empty");
        window.location.reload();
    }
}

async function validateClassroom(){
    let data = await fetchData("./api/classroom/validate", {roomToken: token, roomId:roomId});
    if(data.roomId && data.displayName){
        await startMeeting(data.roomId, data.displayName);
        classroomIdDisplay.textContent = `Classroom ID (Used to join): ${data.roomId} (Joined)`;
    }else{
        alert("Invalid classroom ID");
        return window.location.assign("./classroom.list");
    }
}

async function destroyClassroom(){
    let data = await fetchData("./api/classroom/destroy", {roomId:roomId});
    return data.success;
}

//////////////////////////////////////////////////////////

function addParticipantCard(pId, pName) {
    let card =
        `<div class="col-md-4" id="${pId}">
                <div class="card shadow course-card">
                    <div class="card-body text-center">
                        <h5 class="card-title theme-clr-txt">${pName}</h5>
                        <p id="text-${pId}" class="theme-clr-txt"><i class="bi bi-camera-video-off"></i> Camera OFF</p>
                        <video id='video-frame-${pId}' autoplay width="100%">
                        </video>
                        <p id="text-audio-${pId}" class="theme-clr-txt"><i class="bi bi-mic-mute"></i> Mic OFF</p>
                    </div>
                </div>
            </div>`;
    participantsContainer.innerHTML += card;
}

function createAudioElement(stream, pId) {
    let audioElement = document.createElement("audio");
    audioElement.setAttribute("autoPlay", "false");
    audioElement.setAttribute("playsInline", "true");
    audioElement.setAttribute("controls", "false");
    audioElement.setAttribute("id", `audio-${pId}`);

    const mediaStream = new MediaStream();
    mediaStream.addTrack(stream.track);
    audioElement.srcObject = mediaStream;
    audioElement
        .play()
        .catch((error) => console.error("audioElem.play() failed", error));
}


function deleteParticipantCard(pId) {
    document.getElementById(pId).remove();
}

function setCameraUI(pId, state){
    if(state){
        document.getElementById(`text-${pId}`).style.display = "none";
        document.getElementById(`video-frame-${pId}`).style.display = "block";
    }else{
        document.getElementById(`text-${pId}`).style.display = "block";
        document.getElementById(`video-frame-${pId}`).style.display = "none";
    }
}

function setAudioUI(pId, state){
    if(state){
        document.getElementById(`text-audio-${pId}`).style.display = "none";
    }else{
        document.getElementById(`text-audio-${pId}`).style.display = "block";
    }
}

// Initialize VideoSDK
async function initializeVideoSDK(token) {
    if (!token) {
        alert("Please provide a valid token.");
        return;
    }
    window.VideoSDK.config(token);
    console.log("VideoSDK initialized.");
}

// Create or Join a Meeting
async function startMeetingHandler() {
    if(roomId === null) {
        await createClassroom();
    }else{
        await validateClassroom();
    }
}



async function startMeeting(meetingId, name) {
    meeting = window.VideoSDK.initMeeting({
        meetingId,
        name,
        micEnabled: micEnabled,
        webcamEnabled: cameraEnabled,
        maxResolution: "hd"
    });

    meeting.join();
    setupMeetingEvents();
}

function setupMeetingEvents() {
    console.log(JSON.stringify(meeting.localParticipant));
    // Local participant setup
    meeting.on("meeting-joined", () => {
        meeting.pubSub.subscribe("CHAT", (data) => {
            const { message, senderName } = data;
            addChatMessage(senderName, message);
        });
        addParticipantCard(meeting.localParticipant.id, "YOU");
        setCameraUI(meeting.localParticipant.id, false);
        setAudioUI(meeting.localParticipant.id, false);
    });

    meeting.on("meeting-left", async () => {
        deleteParticipantCard(meeting.localParticipant.id);
        if(Object.keys(participants_list).length == 0){
            await destroyClassroom();
        }
        window.location.href = "./dashboard";
    });

    meeting.localParticipant.on("stream-enabled", (stream) => {
        if (stream.kind === "video") {
            let videoFrame = document.getElementById("video-frame-"+meeting.localParticipant.id);
            attachStreamToVideo(stream, videoFrame);
        }
        if (stream.kind === "share") {
            attachStreamToVideo(stream, videoFrameShare);
        }
    });

    // Chat subscription


    meeting.on("participant-joined", (participant) => {
        participants_list[participant.id] = participant;
        addParticipantCard(participant.id, participant.displayName);
        setCameraUI(participant.id, false);

        participant.on("media-status-changed", (data) => {
            const { kind, newStatus } = data;
            if (kind === "video") {
                setCameraUI(participant.id, newStatus);
            }else{
                if(kind === "audio") {
                    setAudioUI(participant.id, newStatus);
                }
            }
        });

        participant.on("stream-enabled", (stream) => {
            if(stream.kind === "video") {
                let videoFrame = document.getElementById("video-frame-"+participant.id);
                attachStreamToVideo(stream, videoFrame);
            }

            if(stream.kind === "share") {
                attachStreamToVideo(stream, videoFrameShare);
            }

            if(stream.kind === "audio"){
                createAudioElement(stream, participant.id);
            }
        })
        participants_count++;
        viewersCounter.textContent= participants_count+" Watching";
        console.log(`${participant.displayName} joined the meeting.`);
    });

    meeting.on("participant-left", (participant) => {
        deleteParticipantCard(participant.id);
        delete participants_list[participant.id];
        participants_count--;
        viewersCounter.textContent= participants_count+" Watching";
        console.log(`${participant.displayName} left the meeting.`);
    });

    meeting.on("presenter-changed", async (activePresenterId) => {
        let presenter = document.getElementById("presenter");
        if(activePresenterId){
            presenter.innerHTML = `<i class="bi bi-cast"></i> Currently sharing screen: ${participants_list[activePresenterId].displayName}`;
            presenter.style.display = "block";
        }else{
            presenter.style.display = "none";
        }
    });
}

function attachStreamToVideo(stream, element) {
    const mediaStream = new MediaStream();
    mediaStream.addTrack(stream.track);
    element.srcObject = mediaStream;
    console.log(element.srcObject);
    element.play().catch((error) => {
        console.error("Error playing video stream--:", error);
    });
}

function addChatMessage(senderName, message) {
    const messageElement = document.createElement("li");
    messageElement.textContent = `${senderName}: ${message}`;
    chatMessages.appendChild(messageElement);
}

// UI Event Handlers
sendBtn.addEventListener("click", () => {
    const message = chatInput.value;
    chatInput.value = "";
    meeting.pubSub.publish("CHAT", message, { persist: false });
});

muteBtn.addEventListener("click", () => {
    if (micEnabled) {
        meeting.muteMic();
        micEnabled = false;
        muteBtn.textContent = "Unmute";
        setAudioUI(meeting.localParticipant.id, false);
    } else {
        meeting.unmuteMic();
        micEnabled = true;
        muteBtn.textContent = "Mute";
        setAudioUI(meeting.localParticipant.id, true);
    }
});

cameraBtn.addEventListener("click", () => {
    if (cameraEnabled) {
        meeting.disableWebcam();
        cameraEnabled = false;
        cameraBtn.textContent = "Enable Camera";
        setCameraUI(meeting.localParticipant.id, false);
    } else {
        meeting.enableWebcam();
        cameraEnabled = true;
        cameraBtn.textContent = "Disable Camera";
        setCameraUI(meeting.localParticipant.id, true);
    }
});

shareScreenBtn.addEventListener("click", () => {
    if (screenSharing) {
        meeting.disableScreenShare();
        screenSharing = false;
        shareScreenBtn.textContent = "Share Screen";
    } else {
        meeting.enableScreenShare();
        screenSharing = true;
        shareScreenBtn.textContent = "Stop Sharing";
        let presenter = document.getElementById("presenter");
        presenter.innerHTML = `<i class="bi bi-cast"></i> Currently sharing screen: You [${meeting.localParticipant.displayName}]`;
        presenter.style.display = "block";
    }
});

recordBtn.addEventListener("click", () => {
    if (recording) {
        meeting.stopRecording();
        recording = false;
        recordBtn.textContent = "Record Classroom";
    } else {
        meeting.startRecording();
        recording = true;
        recordBtn.textContent = "Stop Recording";
    }
});

startBtn.addEventListener("click", () => {
    if(!started){
        startMeetingHandler();
        started = true;
        startBtn.classList.remove("primary-border");
        startBtn.classList.add("danger-border");
        startBtn.textContent = " Exit Classroom";
    }else{
        var entry = confirm("Are you sure you want to exit classroom?");
        if (entry) {
            meeting.leave();
            window.location.assign("./classroom.list");
        }
    }
});

endBtn.addEventListener("click", async () => {
    let destroy = await destroyClassroom();
    if(meeting){
        if(destroy){
            meeting.end();
        }else{
            alert("Something went wrong!");
        }
    }else{
        window.location.href="./dashboard";
    }
})

// Initialize SDK on load
window.addEventListener("load", async () => {
    await setAuthToken();
    await setRoomId();
    if(token == null){
        await generateToken();
    }else{
        initializeVideoSDK(token);
    }
    startBtn.click();
});



