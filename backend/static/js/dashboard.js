// State 
let targetCalories = 0;
let targetProtein  = 0;
let targetCarbs    = 0;
let targetFat      = 0;
let todayLog = [];
let selectedMealType = 'breakfast';

// Init
document.addEventListener('DOMContentLoaded', () => {
    setGreeting();
    loadUserData();
    loadTodayLog();
    loadRecipes();
    initMealTypeButtons();
});

// Greeting and Date
function setGreeting() {
    const now = new Date();
    const hour = now.getHours();
    const name = localStorage.getItem('userName') || 'there';

    let greeting = 'Good morning';
    if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
    else if (hour >= 17) greeting = 'Good evening';

    document.getElementById('greetingText').innerText = greeting + ', ' + name.split(' ')[0];

    const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' });
    document.getElementById('todayDate').innerText = dateStr;
    document.getElementById('ringDate').innerText = now.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

    const initial = name.charAt(0).toUpperCase();
    document.getElementById('navAvatar').innerText = initial;
    document.getElementById('navName').innerText = name;
}


// Load users data
function loadUserData() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    fetch('/diet-plan/' + userId)
        .then(r => r.json())
        .then(data => {
            targetCalories = data.daily_calories;
            if (data.macro_targets) {
                targetProtein = data.macro_targets.protein;
                targetCarbs   = data.macro_targets.carbs;
                targetFat     = data.macro_targets.fat;
            }

            document.getElementById('bmiBig').innerText = data.bmi;
            document.getElementById('bmiVal').innerText = data.bmi;
            document.getElementById('dietVal').innerText = data.diet_type;
            document.getElementById('targetVal').innerText = data.daily_calories.toLocaleString() + ' kcal';
            document.getElementById('navDiet').innerText = data.diet_type;
            document.getElementById('statTarget').innerText = data.daily_calories.toLocaleString();

            const badge = document.getElementById('bmiBadge');
            badge.innerText = data.bmi_category;
            badge.className = 'bmi-badge';
            if (data.bmi_category === 'Overweight') badge.classList.add('overweight');
            else if (data.bmi_category === 'Obese') badge.classList.add('obese');
            else if (data.bmi_category === 'Underweight') badge.classList.add('underweight');

            const tips = {
                'Underweight': 'Eat frequently, include protein-rich foods like dal, eggs, and nuts.',
                'Normal': 'Maintain a balanced diet and stay active with regular exercise.',
                'Overweight': 'Avoid fried foods and added sugars. Prioritise vegetables and lean protein.',
                'Obese': 'Strict calorie control and daily walking are key. Consult a nutritionist.'
            };
            const tip = document.getElementById('dietTip');
            if (tips[data.bmi_category]) {
                tip.innerText = tips[data.bmi_category];
                tip.classList.add('visible');
            }

            updateRing();
        });
}

// Load today log
async function loadTodayLog() {
    try {
        const res = await fetch('/food-log/today');
        if (!res.ok) return;
        todayLog = await res.json();
        renderLog();
        updateRing();
    } catch (e) {
        console.error('Could not load log:', e);
    }
}

// Render food log
function renderLog() {
    const container = document.getElementById('mealGroups');
 
    // Build groups from current todayLog state
    const groups = { breakfast: [], lunch: [], dinner: [], snack: [] };
    todayLog.forEach(function(entry) {
        const key = entry.meal_type in groups ? entry.meal_type : 'snack';
        groups[key].push(entry);
    });
 
    // Always wipe and rebuild from scratch, no stale DOM references
    container.innerHTML = '';
 
    if (todayLog.length === 0) {
        // Re-create empty state fresh each time so it's never detached
        container.innerHTML =
            '<div class="empty-log" id="emptyLog" style="display:flex;">' +
                '<svg width="40" height="40" viewBox="0 0 40 40" fill="none">' +
                    '<circle cx="20" cy="20" r="17" stroke="#E2DAD0" stroke-width="1.5"/>' +
                    '<path d="M14 20h12M20 14v12" stroke="#C0B8AD" stroke-width="1.5" stroke-linecap="round"/>' +
                '</svg>' +
                '<p>Nothing logged yet today</p>' +
                '<button onclick="openLogModal()">Log your first meal</button>' +
            '</div>';
 
        // Zero out the meal summary bars when log is empty
        updateMealSummary(groups);
        return;
    }
 
    const labels = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snacks' };
 
    Object.entries(groups).forEach(function(pair) {
        const type = pair[0];
        const entries = pair[1];
        if (entries.length === 0) return;
 
        const groupTotal = entries.reduce(function(s, e) { return s + e.calories; }, 0);
 
        const groupEl = document.createElement('div');
        groupEl.className = 'meal-group';
        groupEl.innerHTML =
            '<div class="meal-group-header">' +
                '<span class="meal-group-title">' + labels[type] + '</span>' +
                '<span class="meal-group-kcal">' + Math.round(groupTotal) + ' kcal</span>' +
            '</div>' +
            '<div class="meal-entries" id="entries-' + type + '"></div>';
        container.appendChild(groupEl);
 
        const entriesEl = groupEl.querySelector('#entries-' + type);
        entries.forEach(function(entry) { entriesEl.appendChild(buildEntryEl(entry)); });
    });
 
    // update meal summary after rebuilding  for both adds and deletes
    updateMealSummary(groups);
}

function buildEntryEl(entry) {
    const div = document.createElement('div');
    div.className = 'food-entry';
    div.id = 'entry-' + entry.id;

    const imgHtml = entry.image
        ? '<img src="' + entry.image + '" alt="' + entry.food_name + '" class="food-entry-img">'
        : '<div class="food-entry-img-placeholder">&#127860;</div>';

    div.innerHTML =
        imgHtml +
        '<div class="food-entry-info">' +
            '<div class="food-entry-name">' + entry.food_name + '</div>' +
            '<div class="food-entry-meta">' + entry.meal_type + '</div>' +
        '</div>' +
        '<span class="food-entry-cal">' + Math.round(entry.calories) + ' kcal</span>' +
        '<button class="food-entry-delete" onclick="deleteEntry(' + entry.id + ')" title="Remove">' +
            '<svg width="14" height="14" viewBox="0 0 14 14" fill="none">' +
                '<path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
            '</svg>' +
        '</button>';
    return div;
}

// Meal summary bars
function updateMealSummary(groups) {
    const types = ['breakfast', 'lunch', 'dinner', 'snack'];
 
    types.forEach(function(t) {
        const entries = groups[t] || [];
        const total = entries.reduce(function(s, e) { return s + e.calories; }, 0);
 
        const kcalEl = document.getElementById('mc-' + t);
        const barEl = document.getElementById('mb-' + t);
 
        if (kcalEl) kcalEl.innerText = Math.round(total) + ' kcal';
 
        if (barEl) {
            // Each meal gets up to 25% of daily target as its "full bar" , so 4 meals = 100%
            const pct = targetCalories > 0 ? Math.min((total / (targetCalories * 0.25)) * 100, 100) : 0;
            barEl.style.width = pct + '%';
        }
    });
}

// Calorie Ring
function updateRing() {
    if (!targetCalories) return;

    const consumed = todayLog.reduce((s, e) => s + e.calories, 0);
    const remaining = Math.max(targetCalories - consumed, 0);
    const circumference = 2 * Math.PI * 80;

    const pct = Math.min(consumed / targetCalories, 1);
    const dash = pct * circumference;
    document.getElementById('consumedArc').setAttribute('stroke-dasharray', dash + ' ' + (circumference - dash));
    document.getElementById('ringRemaining').innerText = Math.round(remaining).toLocaleString();
    document.getElementById('statConsumed').innerText = Math.round(consumed).toLocaleString();

    const arc = document.getElementById('consumedArc');
    const ringNum = document.getElementById('ringRemaining');
    if (consumed > targetCalories) {
        arc.setAttribute('stroke', '#a37e04');
        ringNum.style.color = '#a37e04';
    } else {
        arc.setAttribute('stroke', '#a37e04');
        ringNum.style.color = '';
    }
    updateMacros();
}

function updateMacros() {
    const protein = todayLog.reduce(function(s, e) { return s + (e.protein || 0); }, 0);
    const carbs   = todayLog.reduce(function(s, e) { return s + (e.carbs   || 0); }, 0);
    const fat     = todayLog.reduce(function(s, e) { return s + (e.fat     || 0); }, 0);
 
    function setBar(fillId, valId, consumed, target) {
        const pct = target > 0 ? Math.min((consumed / target) * 100, 100) : 0;
        document.getElementById(fillId).style.width = pct + '%';
        const label = target > 0
            ? Math.round(consumed) + ' / ' + target + 'g'
            : Math.round(consumed) + 'g';
        document.getElementById(valId).innerText = label;
    }
 
    setBar('proteinFill', 'proteinVal', protein, targetProtein);
    setBar('carbsFill',   'carbsVal',   carbs,   targetCarbs);
    setBar('fatFill',     'fatVal',     fat,     targetFat);
}

// Delete entry
async function deleteEntry(id) {
    try {
        const res = await fetch('/food-log/delete/' + id, { method: 'DELETE' });
        if (!res.ok) return;
        todayLog = todayLog.filter(e => e.id !== id);
        renderLog();
        updateRing();
    } catch (e) {
        console.error('Delete failed:', e);
    }
}

//Modal
function openLogModal() {
    document.getElementById('logModal').classList.add('open');
    document.getElementById('modalBackdrop').classList.add('open');
    setTimeout(() => document.getElementById('modalSearch').focus(), 100);
}

function closeLogModal() {
    document.getElementById('logModal').classList.remove('open');
    document.getElementById('modalBackdrop').classList.remove('open');
    document.getElementById('modalSearch').value = '';
    document.getElementById('modalResults').innerHTML = '';
    document.getElementById('manualName').value = '';
    document.getElementById('manualCalories').value = '';
}

// Meal type buttons
function initMealTypeButtons() {
    document.querySelectorAll('.meal-type-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.meal-type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedMealType = btn.dataset.meal;
        });
    });
}

// Modal food search
let searchTimeout;
function searchModalFood() {
    const query = document.getElementById('modalSearch').value.trim();
    const container = document.getElementById('modalResults');
    if (query.length < 2) { container.innerHTML = ''; return; }

    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async function() {
        container.innerHTML = '<p style="font-size:13px;color:var(--muted);padding:8px 12px;">Searching...</p>';
        try {
            const res = await fetch('/search-recipes?query=' + encodeURIComponent(query));
            const items = await res.json();
            container.innerHTML = '';

            if (items.length === 0) {
                container.innerHTML = '<p style="font-size:13px;color:var(--muted);padding:8px 12px;">No results found</p>';
                return;
            }

            items.slice(0, 6).forEach(function(item) {
                const cal = item.calories !== 'N/A' ? Math.round(item.calories) : 0;
                const calLabel = cal > 0 ? cal + ' kcal' : '–';
                const div = document.createElement('div');
                div.className = 'modal-result-item';
                div.innerHTML =
                    '<img src="' + (item.image || '') + '" onerror="this.style.display=\'none\'">' +
                    '<span class="modal-result-title">' + item.title + '</span>' +
                    '<span class="modal-result-cal">' + calLabel + '</span>' +
                    '<button class="modal-add-btn" onclick="logFromSearch(\'' + item.title.replace(/'/g, "\\'") + '\',' + cal + ',\'' + (item.image || '') + '\',' + (item.protein || 0) + ',' + (item.carbs || 0) + ',' + (item.fat || 0) + ')">Add</button>';
                container.appendChild(div);
            });
        } catch (e) {
            container.innerHTML = '<p style="font-size:13px;color:var(--muted);padding:8px 12px;">Search failed</p>';
        }
    }, 400);
}

// Log from search
async function logFromSearch(name, calories, image, protein, carbs, fat) {
    await postFoodLog({
        food_name: name,
        calories:  calories,
        meal_type: selectedMealType,
        image:     image,
        protein:   protein || null,
        carbs:     carbs   || null,
        fat:       fat     || null
    });
    closeLogModal();
}

// log from manual
async function logManualFood() {
    const name = document.getElementById('manualName').value.trim();
    const calories = parseFloat(document.getElementById('manualCalories').value);

    if (!name || isNaN(calories) || calories <= 0) {
        alert('Please enter a food name and valid calories.');
        return;
    }

    await postFoodLog({ food_name: name, calories: calories, meal_type: selectedMealType, image: null });
    closeLogModal();
}

// Post to server
async function postFoodLog(payload) {
    try {
        const res = await fetch('/log-food', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
 
        if (!res.ok) {
            alert('Could not log food. Please try again.');
            return;
        }
 
        const data = await res.json();
 
        // Push the server-returned entry (has the real id from DB)
        todayLog.push(data.entry);
 
        renderLog();    // rebuilds meal groups + updates summary bars
        updateRing();   // recalculates consumed/remaining arc
 
    } catch (e) {
        console.error('Log failed:', e);
        alert('Something went wrong. Please try again.');
    }
}

// Main page recipe search
let recipeSearchTimeout;
function searchRecipes() {
    const query = document.getElementById('searchInput').value.trim();
    const calorieFilter = document.getElementById('calorieFilter').value;
    const searchContainer = document.getElementById('searchContainer');

    if (!query && !calorieFilter) {
        searchContainer.style.display = 'none';
        searchContainer.innerHTML = '';
        return;
    }

    clearTimeout(recipeSearchTimeout);
    recipeSearchTimeout = setTimeout(async function() {
        let url = '/search-recipes?query=' + encodeURIComponent(query);
        if (calorieFilter === 'low')    url += '&maxCalories=200';
        if (calorieFilter === 'medium') url += '&minCalories=200&maxCalories=400';
        if (calorieFilter === 'high')   url += '&minCalories=400';

        try {
            const res = await fetch(url);
            const recipes = await res.json();
            searchContainer.style.display = 'grid';
            searchContainer.innerHTML = '';
            if (recipes.length === 0) {
                searchContainer.innerHTML = '<p style="font-size:14px;color:var(--muted);">No results found</p>';
                return;
            }
            recipes.forEach(r => searchContainer.appendChild(buildRecipeCard(r)));
        } catch (e) {
            searchContainer.innerHTML = '<p style="font-size:14px;color:var(--muted);">Search failed</p>';
        }
    }, 400);
}

// Load recommended recipe
async function loadRecipes() {
    const container = document.getElementById('recipeContainer');
    try {
        const res = await fetch('/get-recipes');
        if (!res.ok) throw new Error();
        const recipes = await res.json();
        container.innerHTML = '';
        recipes.forEach(r => container.appendChild(buildRecipeCard(r)));
    } catch (e) {
        container.innerHTML = '<p style="font-size:14px;color:var(--muted);">Could not load recipes</p>';
    }
}

// Build recipe card

function buildRecipeCard(recipe) {
    const div = document.createElement('div');
    div.className = 'recipe-card';
 
    const cal     = (recipe.calories && recipe.calories !== 'N/A') ? Math.round(recipe.calories) : 0;
    const protein = recipe.protein || 0;
    const carbs   = recipe.carbs   || 0;
    const fat     = recipe.fat     || 0;
    const calLabel = cal > 0 ? cal + ' kcal' : '– kcal';
    const imgSrc  = recipe.image || '';
    const title   = recipe.title.replace(/'/g, "\\'");
 
    div.innerHTML =
        (recipe.badge ? '<div class="badge">' + recipe.badge + '</div>' : '') +
        '<img src="' + imgSrc + '" alt="' + recipe.title + '" loading="lazy" onerror="this.style.background=\'var(--cream)\'">' +
        '<div class="recipe-card-body">' +
            '<h3>' + recipe.title + '</h3>' +
            '<p class="calories">' + calLabel + '</p>' +
            '<button class="add-to-log-btn" onclick="showMealPopover(event,\'' + title + '\',' + cal + ',\'' + imgSrc + '\',' + protein + ',' + carbs + ',' + fat + ')">Add to log</button>' +
        '</div>';
    return div;
}

// Quick log from recipe
async function quickLogRecipe(name, calories, image) {
    await postFoodLog({ food_name: name, calories: calories, meal_type: 'snack', image: image });
}

// Track currently open popover 
let _activePopover = null;
let _pendingLog = null;   // { name, calories, image }
 
function showMealPopover(event, name, calories, image, protein, carbs, fat) {
    event.stopPropagation();
    closeMealPopover();
 
    _pendingLog = { name: name, calories: calories, image: image, protein: protein, carbs: carbs, fat: fat };
 
    const pop = document.createElement('div');
    pop.className = 'meal-popover';
    pop.id = 'mealPopover';
    pop.innerHTML =
        '<p class="popover-label">Add to</p>' +
        '<div class="popover-pills">' +
            '<button class="popover-pill" onclick="confirmMealLog(\'breakfast\')">Breakfast</button>' +
            '<button class="popover-pill" onclick="confirmMealLog(\'lunch\')">Lunch</button>' +
            '<button class="popover-pill" onclick="confirmMealLog(\'dinner\')">Dinner</button>' +
            '<button class="popover-pill" onclick="confirmMealLog(\'snack\')">Snack</button>' +
        '</div>';
 
    const btn = event.currentTarget;
    const card = btn.closest('.recipe-card');
    card.style.position = 'relative';
    card.appendChild(pop);
    _activePopover = pop;
 
    pop.style.bottom = (card.offsetHeight - btn.offsetTop + 8) + 'px';
    pop.style.top = 'auto';
 
    setTimeout(function() {
        document.addEventListener('click', outsidePopoverClick);
    }, 0);
}
 
function outsidePopoverClick(e) {
    const pop = document.getElementById('mealPopover');
    if (pop && !pop.contains(e.target)) {
        closeMealPopover();
    }
}
 
function closeMealPopover() {
    const pop = document.getElementById('mealPopover');
    if (pop) pop.remove();
    _activePopover = null;
    _pendingLog = null;
    document.removeEventListener('click', outsidePopoverClick);
}
 
async function confirmMealLog(mealType) {
    if (!_pendingLog) return;
    const p = _pendingLog;
    closeMealPopover();
    await postFoodLog({
        food_name: p.name,
        calories:  p.calories,
        meal_type: mealType,
        image:     p.image,
        protein:   p.protein || null,
        carbs:     p.carbs   || null,
        fat:       p.fat     || null
    });
}


// logout
function logout() {
    localStorage.clear();
    window.location.href = '/login-ui';
}