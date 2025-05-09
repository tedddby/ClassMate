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

let questions = [];

async function loadQuiz(){
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    const quiz_id = params.get('quizId');
    let data;
    if(quiz_id){
        data = await fetchData("./api/dashboard/courses/quizzes", {quiz_id, from:"quiz"});
    }else{
        return window.location.assign('./dashboard');
    }

    if(data.quizzes.length > 0){
        questions = JSON.parse(data.quizzes[0].questions);
        document.getElementById("title").textContent = data.quizzes[0].title;
        console.log(questions);
    }else{
        alert("Invalid quiz id");
        window.location.assign('./dashboard');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadQuiz();
    let currentQuestion = 0;
    let score = 0;
    let counter = 0;

    const questionText = document.getElementById("question-text");
    const answerButtons = document.querySelectorAll(".answer-btn");
    const proceedButton = document.getElementById("proceed-btn");

    function loadQuestion(index) {
        const question = questions[index];
        questionText.textContent = `Question ${index + 1}: ${question.text}`;
        answerButtons.forEach((btn, i) => {
            btn.textContent = question.answers[i];
            btn.classList.remove("correct", "wrong", "selected");
            btn.disabled = false;
        });
    }

    answerButtons.forEach((btn, i) => {
        btn.addEventListener("click", () => {
            const question = questions[currentQuestion];

            // Disable all buttons after selection
            answerButtons.forEach(button => {
                button.disabled = true;
                if (button.textContent === question.correct) {
                    button.classList.add("correct");
                }
            });

            // Highlight selected button as correct or wrong
            if (btn.textContent === question.correct) {
                btn.classList.add("correct");
                score++;
            } else {
                btn.classList.add("wrong");
            }
        });
    });

    proceedButton.addEventListener("click", () => {
        if (currentQuestion < questions.length - 1) {
            currentQuestion++;
            loadQuestion(currentQuestion);

            counter++;
            document.getElementById("tip-text").textContent = counter +"/"+ questions.length;

            if (currentQuestion === questions.length - 1) {
                proceedButton.textContent = "Submit Quiz";
            }
        } else {
            document.getElementById("quiz-card").innerHTML = `<p class="quiz-question theme-clr-txt">You scored ${score} out of ${questions.length}!</p>`;
            document.getElementById("tip-text").textContent = "Not bad!"
            proceedButton.style.display = "none";
        }
    });

    loadQuestion(currentQuestion);

    document.getElementById("quit-btn").addEventListener("click", () => {
        window.location.href = "./dashboard";
    });
});