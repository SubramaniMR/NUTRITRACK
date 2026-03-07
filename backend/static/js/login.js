const email = document.getElementById("email");
const password = document.getElementById("password");
const result = document.getElementById("result");

document.getElementById("loginBtn").addEventListener("click", async () => {

  result.innerText = "Logging in...";

  try {
    const res = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.value,
        password: password.value
      })
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("userId", data.user_id);
      localStorage.setItem("userName", data.name);
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    } else {
      result.style.color = "red";
      result.innerText = data.message;
    }

  } catch (err) {
    result.innerText = "Server not responding";
    result.style.color = "red";
  }
});

function showForgot() {
  const emailVal = email.value;
  if (!emailVal) {
    alert("Enter email first");
    return;
  }

  const newPass = prompt("Enter new password");

  if (!newPass) return;

  fetch("/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: emailVal,
      newPassword: newPass
    })
  })
  .then(res => res.json())
  .then(data => {
    alert(data.message);
  });
}
