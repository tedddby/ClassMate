document.getElementById("login-form").addEventListener("submit", function (e) {
    e.preventDefault();
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;
    let remember = document.getElementById("rem-me").checked;
    let text = document.getElementById("txt-container");

    function setText(value) {
        text.getElementsByTagName("a")[0].textContent = value;
        if(text.getElementsByTagName("a")[1]){
            text.getElementsByTagName("a")[1].remove();
        }
    }

    if(password.length < 6) {
        setText("Password can't be less than 6 characters");
    }else{
        const url = './api/auth/login';

        const data = {
            email,
            password,
            remember
        };


        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
            .then((response) => {
                if (!response.ok) {
                    setText("Internal Server Error");
                }
                return response.json();
            })
            .then((data) => {
                if(data.success) {
                    window.location.href = "./dashboard";
                }else{
                    setText(data.message);
                }
            })
            .catch((error) => {
                setText("Something went wrong");
                console.error('Error:', error);
            });

    }
});