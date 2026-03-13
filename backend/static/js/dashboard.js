
// Username
const name = localStorage.getItem("userName") ||"user"
document.getElementById("username").innerText = "Welcome, " +name;

let consumedCalories = 0;
let targetCalories = 0;

// Load BMI & diet data
const userId = localStorage.getItem("userId");

fetch(`/diet-plan/${userId}`)
.then(res => res.json())
.then(data => {
    document.getElementById("bmi").innerText = data.bmi;
    document.getElementById("category").innerText = data.bmi_category;
    document.getElementById("diet").innerText = data.diet_type;
    document.getElementById("calories").innerText = data.daily_calories;

    targetCalories = data.daily_calories;
    document.getElementById("targetCalories").innerText = targetCalories;
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
            <p class="calories">${recipe.calories}kcal</p>
            <button>Add to Tracker</button>
        </div>
        `;
        
        container.innerHTML += `
        <div class="recipe-card">
        <img src="${recipe.image}" />
        <h3>${recipe.title}</h3>
        <p>${recipe.calories} kcal</p>
        <button onclick="addCalories(${recipe.calories})">
          Add to Tracker
        </button>

         </div>
      `;
    });
}

window.onload = loadRecipes;

async function searchRecipes(){

    const query = document.getElementById("searchInput").value;

    const searchContainer = document.getElementById("searchContainer");
    const title = document.getElementById("searchTitle");

    if(query.length === 0){

        searchContainer.innerHTML = "";
        title.style.display = "none";
        return;
    }

    const res = await fetch(`/search-recipes?query=${query}`);
    const recipes = await res.json();

    searchContainer.innerHTML = "";

    title.style.display = "block";

    recipes.forEach(recipe => {

        const card = `
        <div class="recipe-card">
           <div class="badge">${recipe.badge}</div>
            <img src="${recipe.image}" />

            <h3>${recipe.title}</h3>

            <p class="calories">${recipe.calories} kcal</p>

        </div>
        `;

        searchContainer.innerHTML += card;

    });
}

// logout
function logout(){
    localStorage.clear();
    window.location.href="/login-ui";
}

function addCalories(calories){

    consumedCalories += calories;

    document.getElementById("consumedCalories").innerText = consumedCalories;

    let percent = (consumedCalories / targetCalories) * 100;

    document.getElementById("progressFill").style.width = percent + "%";
}