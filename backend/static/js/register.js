document.addEventListener("DOMContentLoaded", () => {

    const registerBtn = document.getElementById("registerBtn");
    const resultBox = document.getElementById("resultBox");

    registerBtn.addEventListener("click", async () => {

        const payload = {
            name: document.getElementById("name").value.trim(),
            email: document.getElementById("email").value.trim(),
            password: document.getElementById("password").value.trim(),
            height: document.getElementById("height").value.trim(),
            weight: document.getElementById("weight").value.trim()
        };

        // Basic validation
        if (!payload.name || !payload.email || !payload.password || !payload.height || !payload.weight) {
            resultBox.style.color = "red";
            resultBox.innerText = "Please fill all fields";
            return;
        }

        resultBox.style.color = "white";
        resultBox.innerText = "Registering...";

        try {
            const res = await fetch("http://127.0.0.1:5000/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                resultBox.style.color = "lightgreen";
                resultBox.innerText = data.message;

                // Auto redirect to login page
                setTimeout(() => {
                    window.location.href = "/login-ui";
                }, 1500);

            } else {
                resultBox.style.color = "red";
                resultBox.innerText = data.message;
            }

        } catch (err) {
            console.error(err);
            resultBox.style.color = "red";
            resultBox.innerText = "Server not responding";
        }
    });
});
