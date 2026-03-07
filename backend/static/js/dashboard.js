
// Username
const name = localStorage.getItem("userName") ||"user"
document.getElementById("username").innerText = "Welcome, " +name;

// Load BMI & diet data
const userId = localStorage.getItem("userId");

fetch(`/diet-plan/${userId}`)
.then(res => res.json())
.then(data => {
    document.getElementById("bmi").innerText = data.bmi;
    document.getElementById("category").innerText = data.bmi_category;
    document.getElementById("diet").innerText = data.diet_type;
    document.getElementById("calories").innerText = data.daily_calories;
});

// Load recipes
async function loadRecipes() {
    console.log("loading recipes...");
    
    const container = document.getElementById("recipeContainer");
    container.innerHTML = "Loading recipes...";

    const res = await fetch("/get-recipes");
    const recipes = await res.json();

    container.innerHTML = "";

    recipes.forEach(recipe => {
        const card = `
        <div class="recipe-card">
            <img src="${recipe.image}" />
            <h3>${recipe.title}</h3>
            <p>${recipe.nutrition?.nutrients?.[0]?.amount || ''} kcal</p>
        </div>
        `;
        container.innerHTML += card;
    });
}

window.onload = loadRecipes;

// logout
function logout(){
    localStorage.clear();
    window.location.href="/login-ui";
}