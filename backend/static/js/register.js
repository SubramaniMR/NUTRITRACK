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
            resultBox.className = "error";
            resultBox.innerText = "Please fill all fields";
            return;
        }

        resultBox.className = "";
        resultBox.innerText = "Creating your account...";

        try {
            const res = await fetch("/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                resultBox.className = "success";
                resultBox.innerText = data.message;

                // Auto redirect to login page
                setTimeout(() => {
                    window.location.href = "/login-ui";
                }, 1500);

            } else {
                resultBox.className = "error";
                resultBox.innerText = data.message;
            }

        } catch (err) {
            console.error(err);
            resultBox.style.color = "error";
            resultBox.innerText = "Server not responding";
        }
    });
});
