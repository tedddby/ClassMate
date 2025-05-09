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
const chatInput = document.querySelector('.chat-input input'); // edited
const sendBtn = document.querySelector('.chat-input button'); //
const chatMessages = document.getElementById('chatMessages'); //

const shareScreenBtn = document.getElementById('screenBtn'); //
const muteBtn = document.getElementById('micBtn'); //
const cameraBtn = document.getElementById('camBtn'); //
const recordBtn = document.getElementById('recordBtn'); //
const startBtn = document.getElementById('leaveBtn'); //

const screenShare = document.getElementById('screenShare'); //
const videoFrameShare = document.getElementById('video-frame-share');//
const viewersCounter = document.getElementById("viewerCount"); //
const participantsContainer = document.getElementById("participantsGrid"); //
const endBtn = document.getElementById("end-meeting"); //


//const classroomIdDisplay = document.getElementById("classroom-id");



// State Variables
let meeting = null;
let micEnabled = false;
let cameraEnabled = false;
let screenSharing = false;
let recording = false;
let participants_count = 0;
let participants_list = {};
var started = false;

let host = false;

let token = "init";
let roomId = "init";

let sharableLink = "";

async function setRoomId() {
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    if (params.get("roomId")) {
        roomId = params.get("roomId");
    } else {
        host = true;
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
            //classroomIdDisplay.textContent = `Classroom ID (Used to join): ${data.roomId} (Host)`;
            //alert(`Classroom ID (Used to join): ${data.roomId} (Host)`);
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
        //classroomIdDisplay.textContent = `Classroom ID (Used to join): ${data.roomId} (Joined)`;
        //alert(`Classroom ID (Used to join): ${data.roomId} (Joined)`);
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

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function createCircle(initials, pId) {
    const circle = document.createElement("div");
    circle.classList.add('circle');
    circle.style.backgroundColor = getRandomColor();
    circle.textContent = initials;
    circle.id = "profile-"+pId;

    return circle;
}

function addParticipantCard(pId, pName) {
    let card = `<div class="participant" id="${pId}">
                <div class="name">${pName} <i class="bi bi-mic-mute" id="mic-icon-${pId}"></i> <i class="bi bi-camera-video-off" id="cam-icon-${pId}"></i></div>
            </div>`;
    participantsContainer.innerHTML += card;
}

function deleteParticipantCard(pId) {
    document.getElementById(pId).remove();
}

function createParticipantVideoFrame(pId){
    let card = document.getElementById(pId);
    if(card){
        let video = document.createElement('video');
        video.controls = false;
        video.autoplay = true;
        video.style.width = '100%';
        video.style.height = '100%';
        card.appendChild(video);
        return video;
    }
}

function createScreenShareVideoFrame(){
    let video = document.createElement('video');
    video.controls = false;
    video.autoplay = true;
    video.style.width = '100%';
    video.style.height = '100%';
    video.id = 'screenShareVideoFrame';
    screenShare.appendChild(video);
    return video;
}

function toggleScreenShareVideoFrame(){
    screenShare.classList.toggle('active');
}

function removeScreenShareVideoFrame(){
    let video = document.getElementById("screenShareVideoFrame")
    video.remove();
    return video;
}

function removeParticipantVideoFrame(pId) {
    let card = document.getElementById(pId);
    if(card){
        let video = card.querySelector('video');
        video.remove();
    }
}

function createParticipantProfile(p){
    let card = document.getElementById(p.id);
    let firstName = p.displayName.split(" ")[0];
    let secondName = p.displayName.split(" ")[1];
    let circle = createCircle(firstName[0]+secondName[0], p.id);

    let name = card.querySelector(".name");
    let tempName = name;
    name.remove();
    card.appendChild(circle);
    card.appendChild(tempName);
}

function removeParticipantProfile(p){
    let profile = document.getElementById("profile-"+p.id);
    profile.remove();
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

function setCameraUI(p, state){
    if(state){
        document.getElementById("cam-icon-"+p.id).style.display = "none";
        removeParticipantProfile(p);
    }else{
        createParticipantProfile(p);
        document.getElementById("cam-icon-"+p.id).style.display = "";
    }
}

function setAudioUI(pId, state){
    if(state){
        document.getElementById("mic-icon-"+pId).style.display = "none";
    }else{
        document.getElementById("mic-icon-"+pId).style.display = "";
    }
}

function askForPermissions(){
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                console.log('Access granted to microphone and camera');
                const videoElement = document.querySelector('#videoPreview');
                if (videoElement) {
                    videoElement.srcObject = stream;
                    videoElement.play();
                }
            })
            .catch(error => {
                console.error('Error accessing microphone and camera:', error);
                alert('Microphone and camera access denied.');
            });
    } else {
        console.error('getUserMedia is not supported in this browser.');
        alert('Your browser does not support accessing the microphone and camera.');
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
        displayRoomLink();
        addParticipantCard(meeting.localParticipant.id, "YOU");
        setCameraUI(meeting.localParticipant, false);
        setAudioUI(meeting.localParticipant.id, false);
    });

    meeting.on("meeting-left", async () => {
        deleteParticipantCard(meeting.localParticipant.id);
        let length = Object.keys(participants_list).length;
        if(length === 0){
            await destroyClassroom();
            window.location.href = "./dashboard";
        }
        window.location.href = "./dashboard";
    });

    meeting.localParticipant.on("stream-enabled", (stream) => {
        if (stream.kind === "video") {
            let videoFrame = createParticipantVideoFrame(meeting.localParticipant.id);
            attachStreamToVideo(stream, videoFrame);
        }
        if (stream.kind === "share") {
            let videoFrame = createScreenShareVideoFrame();
            attachStreamToVideo(stream, videoFrame);
        }
    });

    meeting.localParticipant.on("stream-disabled", (stream) => {
        if (stream.kind === "video") {
            removeParticipantVideoFrame(meeting.localParticipant.id);
        }
        if (stream.kind === "share") {
            removeScreenShareVideoFrame();
        }
    });


    meeting.on("participant-joined", (participant) => {
        participants_list[participant.id] = participant;
        addParticipantCard(participant.id, participant.displayName);
        setCameraUI(participant, false);

        participant.on("media-status-changed", (data) => {
            const { kind, newStatus } = data;
            if (kind === "video") {
                setCameraUI(participant, newStatus);
            }else{
                if(kind === "audio") {
                    setAudioUI(participant.id, newStatus);
                }
            }
        });

        participant.on("stream-enabled", (stream) => {
            if(stream.kind === "video") {
                let videoFrame = createParticipantVideoFrame(participant.id);
                attachStreamToVideo(stream, videoFrame);
            }

            if(stream.kind === "share") {
                let videoFrame = createScreenShareVideoFrame();
                attachStreamToVideo(stream, videoFrame);
                toggleScreenShareVideoFrame();
            }

            if(stream.kind === "audio"){
                createAudioElement(stream, participant.id);
            }
        });

        participant.on("stream-disabled", (stream) => {
            if(stream.kind === "video") {
                removeParticipantVideoFrame(participant.id);
            }
            if(stream.kind === "share") {
                removeScreenShareVideoFrame();
                toggleScreenShareVideoFrame();
            }
        });

        participants_count++;
        viewersCounter.textContent = `${participants_count}`;
        console.log(`${participant.displayName} joined the meeting.`);
    });

    meeting.on("participant-left", (participant) => {
        deleteParticipantCard(participant.id);
        delete participants_list[participant.id];
        participants_count--;
        viewersCounter.textContent = `${participants_count}`;
        console.log(`${participant.displayName} left the meeting.`);
    });

    meeting.on("presenter-changed", async (activePresenterId) => {
        let presenter = document.getElementById("presenter");
        if(activePresenterId){
            presenter.innerHTML = `<i class="bi bi-cast"></i> Currently sharing screen: ${participants_list[activePresenterId].displayName}`;
            presenter.style.display = "";
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

function addChatMessage(senderName, messageVal) {
    const message = document.createElement('div');
    message.className = 'message';
    message.innerHTML = `<strong>${senderName}:</strong> ${messageVal}`;
    chatMessages.appendChild(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    chatInput.value = '';
}

function displayRoomLink(){
    sharableLink = window.location.href+`?roomId=${roomId}&authToken=${token}`
    let messageCont = document.getElementById("system-message");
    let messageText = document.createElement("strong");
    messageText.textContent = `Click here to copy classroom link`;
    messageCont.appendChild(messageText);
    messageText.addEventListener("click", (e) => {
        navigator.clipboard.writeText(sharableLink)
            .then(() => {
                messageText.textContent = 'Text copied to clipboard!';
                messageText.style.color = 'green';
            })
            .catch(err => {
                messageText.textContent = 'Failed to copy text.';
                messageText.style.color = 'red';
                console.error('Error copying text: ', err);
            });
    })
}

// UI Event Handlers
sendBtn.addEventListener("click", () => {
    const message = chatInput.value;
    chatInput.value = "";
    meeting.pubSub.publish("CHAT", message, { persist: false });
});

chatInput.addEventListener('keypress', (e) => {
    if(e.key === 'Enter'){
        if(chatInput.value.trim().length > 0){
            const message = chatInput.value;
            chatInput.value = "";
            meeting.pubSub.publish("CHAT", message, { persist: false });
        }
    }
});

muteBtn.addEventListener("click", () => {
    if (micEnabled) {
        meeting.muteMic();
        micEnabled = false;
        muteBtn.classList.toggle('active');
        setAudioUI(meeting.localParticipant.id, false);
    } else {
        meeting.unmuteMic();
        micEnabled = true;
        muteBtn.classList.toggle('active');
        setAudioUI(meeting.localParticipant.id, true);
    }
});

cameraBtn.addEventListener("click", () => {
    if (cameraEnabled) {
        meeting.disableWebcam();
        cameraEnabled = false;
        cameraBtn.classList.toggle('active');
        setCameraUI(meeting.localParticipant, false);
    } else {
        meeting.enableWebcam();
        cameraEnabled = true;
        cameraBtn.classList.toggle('active');
        setCameraUI(meeting.localParticipant, true);
    }
});

shareScreenBtn.addEventListener('click', () => {
    shareScreenBtn.classList.toggle('active');
    screenShare.classList.toggle('active');
    const participantsGrid = document.getElementById('participantsGrid');
    participantsGrid.style.maxHeight = screenShare.classList.contains('active') ? '30vh' : '60vh';
    if (screenSharing) {
        meeting.disableScreenShare();
        screenSharing = false;
    } else {
        meeting.enableScreenShare();
        screenSharing = true;
        let presenter = document.getElementById("presenter");
        presenter.innerHTML = `<i class="bi bi-cast"></i> Currently sharing screen: You [${meeting.localParticipant.displayName}]`;
        presenter.style.display = "";
    }
});

recordBtn.addEventListener("click", () => {
    if (recording) {
        meeting.stopRecording();
        recording = false;
        recordBtn.classList.toggle('active');
    } else {
        meeting.startRecording();
        recording = true;
        recordBtn.classList.toggle('active');
    }
});

startBtn.addEventListener("click", () => {
    if(!started){
        askForPermissions();
        startMeetingHandler();
        started = true;
        startBtn.classList.toggle('leave');
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
    if(!host){
        //shareScreenBtn.style.display = "none";
        recordBtn.style.display = "none";
        endBtn.style.display = "none";
    }
    startBtn.click();
});



