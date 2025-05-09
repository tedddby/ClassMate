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

function getTimeOfDay() {
    const currentHour = new Date().getHours(); // Get the current hour (0-23)

    if (currentHour >= 5 && currentHour < 12) {
        return "Morning";
    } else if (currentHour >= 12 && currentHour < 17) {
        return "Afternoon";
    } else {
        return "Evening";
    }
}

async function loadCourses(){
    let data = await fetchData("./api/dashboard/courses", {null:true});
    generateCards_Courses(data.courses);
}

function generateCards_Courses (courses){
    let courses_container = document.getElementById("courses-grid");
    for(let i = 0; i < courses.length; i++){
        courses_container.innerHTML += `<div class="col-md-4">
                <div class="card shadow course-card">
                    <div class="card-body text-center">
                        <h5 class="card-title theme-clr-txt">${courses[i].course_name}</h5>
                        <p class="card-text theme-clr-txt">Explore lectures, quizzes, and exams for ${courses[i].course_name}</p>
                        <button class="genric-btn theme-clr-btn circle view-details-btn" data-course="${courses[i].course_name}-${courses[i].id}">View Details</button>
                    </div>
                </div>
            </div>`;
    }
}

async function loadNotifications(){
    let data = await fetchData("./api/dashboard/notifications", {null:true});
    generateCards_Notifs(data.notifications);
}

function generateCards_Notifs (notifications){
    let notifications_container = document.getElementById("notifications-container");
    document.getElementById("notifications-btn").textContent = "Notifications ("+notifications.length+")";
    for(let i = notifications.length-1; i >= 0 ; i--){
        notifications_container.innerHTML += `<div>
                <div class="card shadow course-card">
                    <div class="card-body">
                        <h6 class="mb-4">${notifications[i].notification_title}</h6>
                        <small class="card-text  theme-clr-txt">${notifications[i].notification_body}</small>
                        <br>
                        <small class="text-muted">${notifications[i].notification_date}</small>
                    </div>
                </div>
            </div>`;
    }
}


async function loadCourseMaterials(course_id) {
    let data = await fetchData('./api/dashboard/courses/lectures', {course_id: course_id});
    let videos = generateCards_LectureVideos(data.lectures);
    let pdfs = generateCards_LecturePdfs(data.lectures);
    return {videos, pdfs};
}


function generateCards_LectureVideos(lectures){
    let html = '';
    if(lectures.length > 0){
        for(let i = 0; i < lectures.length; i++){
            html +=
                `<div class="col-md-4">
                    <div class="card shadow course-card">
                        <div class="card-body text-center">
                            <video controls width="100%">
                                 <source src="${lectures[i].lecture_video}" type="video/mp4">
                            </video>
                            <small class="theme-clr-txt">${lectures[i].lecture_name}</small>
                        </div>
                    </div>
                </div>`;
        }
        html = `<div class="row" id="courses-grid">`+html+`</div>`;
    }else{
       html = `<p style="theme-clr-txt">No lectures found for this course... </p><br>` + `<p style="theme-clr-txt">Have materials for this course? send them on telegram (+201550177519)</p>`;
    }
    return html;
}

function generateCards_LecturePdfs(lectures){
    let html = '';
    if(lectures.length > 0){
        for(let i = 0; i < lectures.length; i++){
            html += `<a href="${lectures[i].lecture_pdf}" class="theme-clr-txt-2">[${i+1}] ${lectures[i].lecture_name} [Click to open]</a><br>`
        }
    }else{
        html = `<p style="theme-clr-txt">No PDFs found for this course... </p><br>` + `<p style="theme-clr-txt">Have materials for this course? send them on telegram (+201550177519)</p>`;
    }
    return html;
}

async function loadCourseQuizzes(course_id) {
    let data = await fetchData('./api/dashboard/courses/quizzes', {course_id: course_id, from:"dashboard"});
    let quizzes = generateCards_Quizzes(data.quizzes);
    return quizzes;
}

function generateCards_Quizzes(quizzes) {
    let html = '';
    if(quizzes.length > 0){
        for(let i = 0; i < quizzes.length; i++){
            html += `<a href="./quiz?quizId=${quizzes[i].id}" class="theme-clr-txt-2">[${i+1}] ${quizzes[i].title} [Click to take quiz]</a><br>`
        }
    }else{
        html = `<p style="theme-clr-txt">No quizzes found for this course... </p><br>` + `<p style="theme-clr-txt">Have materials for this course? send them on telegram (+201550177519)</p>`;
    }
    return html;
}

async function loadCourseExams(course_id) {
    let data = await fetchData('./api/dashboard/courses/exams', {course_id});
    let exams = generateCards_Exams(data.exams);
    return exams;
}

function generateCards_Exams(exams) {
    let html = '';
    if(exams.length > 0){
        for(let i = 0; i < exams.length; i++){
            html += `<a href="${exams[i].exam}" class="theme-clr-txt-2">[${i+1}] ${exams[i].title} [Click to open]</a><br>`
        }
    }else{
        html = `<p style="theme-clr-txt">No exams found for this course... </p><br>` + `<p style="theme-clr-txt">Have materials for this course? send them on telegram (+201550177519)</p>`;
    }
    return html;
}

function modifyContainer (){

    const mainContainer = document.getElementById('dashboard-main-container');

    document.querySelectorAll('.view-details-btn').forEach(button => {
        button.addEventListener('click', async function () {

            const courseName = this.getAttribute('data-course').split("-")[0];
            const courseId = this.getAttribute('data-course').split("-")[1];
            const lectureMaterials = await loadCourseMaterials(courseId);
            const courseQuizzes = await loadCourseQuizzes(courseId);
            const courseExams = await loadCourseExams(courseId);

            mainContainer.innerHTML = `
            <h2 class="theme-clr-txt">${courseName} Materials</h2>
            <a onclick="location.reload()" class="genric-btn link-border">Return to course list</a>
            <br><br>
            <ul class="nav nav-tabs mb-3 theme-clr-bg">
                <li class="nav-item">
                    <a class="nav-link active" data-toggle="tab" href="#lectures-tab">Lectures</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" data-toggle="tab" href="#pdfs-tab">PDFs</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" data-toggle="tab" href="#quizzes-tab">Quizzes</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" data-toggle="tab" href="#exam-sheets-tab">Exam Sheets</a>
                </li>
            </ul>
            <div class="tab-content">
                <div id="lectures-tab" class="tab-pane fade show active">
                     ${lectureMaterials.videos}
                </div>
                <div id="pdfs-tab" class="tab-pane fade">
                    ${lectureMaterials.pdfs}
                </div>
                <div id="quizzes-tab" class="tab-pane fade">
                    ${courseQuizzes}
                </div>
                <div id="exam-sheets-tab" class="tab-pane fade">
                    ${courseExams}
                </div>
            </div>`;
        });
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadCourses();
    document.getElementById("welcome").textContent = `Good ${getTimeOfDay()}, `;
    setTimeout(() => {
        modifyContainer();
    }, 3000);
    loadNotifications();
});

document.getElementById('notifications-btn').addEventListener('click', () => {
    const sidebar = document.getElementById('notifications-sidebar');
    sidebar.classList.toggle('open');
});

document.getElementById('close-sidebar').addEventListener('click', () => {
    document.getElementById('notifications-sidebar').classList.remove('open');
});

document.getElementById('logout-btn').addEventListener('click', () => {
    window.location.href="./api/auth/logout";
});