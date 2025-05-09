function validatePassword(password) {
    const minLength = 8;
    const maxLength = 20;
    const passwordCriteria = {
        length: password.length >= minLength && password.length <= maxLength,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        digit: /\d/.test(password),
        specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        noSpaces: !/\s/.test(password)
    };

    const isValid = Object.values(passwordCriteria).every(Boolean);

    if(!isValid){
        let passwordCriteria_return = {
            length: password.length >= minLength && password.length <= maxLength || "Password must be between 8 and 20 characters",
            uppercase: /[A-Z]/.test(password) || "Password must contain at least one capital letter",
            lowercase: /[a-z]/.test(password) || "Password must contain at least one small letter",
            digit: /\d/.test(password) || "Password must contain at least one digit letter",
            specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password) || "Password must contain at least one special character",
            noSpaces: !/\s/.test(password) || "Password must not contain spaces"
        };
        return {
            isValid,
            criteria: passwordCriteria_return
        };
    }else{
        return {
            isValid
        };
    }
}

function setText(value) {
    document.getElementById("required").textContent = value;
    setTimeout(() => {
        document.getElementById("required").textContent = "* Means Required.";
    }, 5000)
}

function setPasswordComment(value) {
    let comment = document.getElementById("password-comment").textContent = value;
}

let validPw = false;

document.getElementById("password").addEventListener("input", function (event) {
    let validate = validatePassword(document.getElementById("password").value);
    let text ="";
    if(document.getElementById("password").value !== ""){
        if (!validate.isValid) {
            Object.entries(validate.criteria).forEach(([key, value]) => {
                if (typeof value === "string"){
                    text+=value+"\n";
                }
            });
            setPasswordComment(text);
        }else{
            validPw = true;
            setPasswordComment("");
        }
    }else{
        setPasswordComment("")
    }
})

let matchedPw = false;
document.getElementById("repassword").addEventListener("input", function (event) {
    let repassword = document.getElementById("repassword").value;
    let password = document.getElementById("password").value;
    if(repassword !== ""){
        if(repassword !== password){
            setPasswordComment("Password and Re-entered password doesn't match");
        }else{
            matchedPw = true;
            setPasswordComment("");
        }
    }else{
        setPasswordComment("")
    }
})

document.getElementById("login-form").addEventListener("submit", function (e) {
    e.preventDefault();
    if(!validPw){
        return setText("Password is not valid.")
    }
    if(!matchedPw){
        return setText("Password and re-entered password doesn't match");
    }

    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;
    let repassword = document.getElementById("repassword").value;
    let name = document.getElementById("name").value;
    let semester = document.getElementById("semester").value;
    let department = document.getElementById("department").value;
    let phone = document.getElementById("phoneNo").value;

    let data = {email,password,repassword,name,semester,department}
    if(phone !== ""){
        data.phone = phone;
    }

    fetch('./api/auth/register', {
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
                document.getElementById("required").classList.remove("required-icon");
                document.getElementById("required").style.color = "green";
                setText(data.message);
                setTimeout(() => {
                    window.location.href = "./login";
                }, 3000)
            }else{
                setText(data.message);
            }
        })
        .catch((error) => {
            setText("Something went wrong");
            console.error('Error:', error);
        });
});