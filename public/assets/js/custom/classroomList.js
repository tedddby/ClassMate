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

        if (!response.ok) {
            alert("Internal Server Error");
            return null;
        }

        const responseData = await response.json();

        if (responseData.success) {
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

const container = document.getElementById('courses-grid');

async function fetchClassrooms() {
    let data = await fetchData('./api/classroom/list', {});
    if(data.classrooms.length > 0){
        for(let i = 0; i < data.classrooms.length; i++){
            container.innerHTML+=addClassroomCard(data.classrooms[i].title, "N/A", data.classrooms[i].host, data.classrooms[i].room_id, data.classrooms[i].authToken);
        }
    }else{
        container.innerHTML = `<p>No classrooms found...</p>`;
    }
}

function addClassroomCard(title, description, host, token, authToken) {
    let href = "./classroom.live.v2?roomId=" + token +"&authToken=" + authToken;
    let html =
    `<div class="col-md-4">
                <div class="card shadow course-card">
                    <div class="card-body text-center">
                        <h5 class="card-title theme-clr-txt">${title}</h5>
                        <p class="card-text theme-clr-txt">Description: ${description}</p>
                        <p class="card-text theme-clr-txt">Host: ${host}</p>
                        <button class="genric-btn theme-clr-btn circle" id="join-btn" onclick="window.location.href='${href}'">Join Classroom</button>
                    </div>
                </div>
    </div>`;
    return html;
}

document.addEventListener("DOMContentLoaded", async () => {
    await fetchClassrooms();
});

document.getElementById('logout-btn').addEventListener('click', () => {
    window.location.href="./api/auth/logout";
});