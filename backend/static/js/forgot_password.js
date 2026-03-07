document.getElementById("resetBtn").addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const resultBox = document.getElementById("resultBox");

  if (newPassword !== confirmPassword) {
    resultBox.style.color = "red";
    resultBox.innerText = "Passwords do not match";
    return;
  }

  try {
    const res = await fetch("/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, newPassword })
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message);

    resultBox.style.color = "green";
    resultBox.innerText = "Password updated successfully! Redirecting to login...";

    setTimeout(() => {
      window.location.href = "/login-ui";
    }, 1500);

  } catch (err) {
    resultBox.style.color = "red";
    resultBox.innerText = err.message;
  }
});
