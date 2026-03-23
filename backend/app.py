from flask import Flask, render_template,request,redirect,session,jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash,check_password_hash
from db import db
from models import User
from flask import render_template
import urllib3
import requests
import os
from dotenv import load_dotenv
from models import FoodLog
from datetime import date

# load the .env file
load_dotenv()

API_KEY = os.getenv("SPOONACULAR_API_KEY")

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

app = Flask(__name__)
app.secret_key="supersecretkey"
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

def get_bmi_details(bmi):
    if bmi < 18.5:
        return "Underweight", "High Calorie Diet", 2500
    elif bmi < 25:
        return "Normal", "Balanced Diet", 2000
    elif bmi < 30:
        return "Overweight", "Low Calorie Diet", 1600
    else:
        return "Obese", "Controlled Diet", 1400

def get_diet_plan(bmi_category):
    if bmi_category == "Underweight":
        return {
            "breakfast": "Milk, banana, peanut butter sandwich",
            "lunch": "Rice, dal, vegetables, curd",
            "dinner": "Chapati, paneer curry",
            "tips": "Eat frequently and include protein-rich foods"
        }

    elif bmi_category == "Normal":
        return {
            "breakfast": "Oats, fruits, boiled egg",
            "lunch": "Chapati, vegetables, dal",
            "dinner": "Rice, vegetables, curd",
            "tips": "Maintain a balanced diet and regular exercise"
        }

    elif bmi_category == "Overweight":
        return {
            "breakfast": "Fruits, green tea",
            "lunch": "Brown rice, vegetables, dal",
            "dinner": "Soup, salad",
            "tips": "Avoid fried foods and sugar"
        }

    else:  # Obese
        return {
            "breakfast": "Warm water, fruits",
            "lunch": "Vegetable salad, dal",
            "dinner": "Soup",
            "tips": "Strict calorie control and daily walking"
        }



@app.route('/')
def home():
    return render_template("index.html")

@app.route("/register", methods=["POST"])
def register():
    try:
        db.session.expire_all()
        data = request.get_json()

        name = data["name"]
        email = data["email"]
        password = data["password"]
        height = float(data["height"])
        weight = float(data["weight"])

        # 🔹 Check if user exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({"message": "Email already registered"}), 400

        # 🔹 Calculate BMI
        bmi = round(weight / ((height / 100) ** 2), 2)

        # 🔹 BMI Category
        if bmi < 18.5:
            bmi_category = "Underweight"
            diet_type = "High Protein Diet"
            daily_calories = 2500
        elif bmi < 25:
            bmi_category = "Normal"
            diet_type = "Balanced Diet"
            daily_calories = 2000
        else:
            bmi_category = "Overweight"
            diet_type = "Low Carb Diet"
            daily_calories = 1800

        # 🔹 Hash Password
        hashed_password = generate_password_hash(password)

        # 🔹 Create User
        user = User(
            name=name,
            email=email,
            password=hashed_password,
            height=height,
            weight=weight,
            bmi=bmi,
            bmi_category=bmi_category,
            diet_type=diet_type,
            daily_calories=daily_calories
        )

        db.session.add(user)
        db.session.commit()

        return jsonify({"message": "Registration successful! Redirecting to login..."}), 200

    except Exception as e:
        print("REGISTER ERROR:", e)
        return jsonify({"message": "Server error"}), 500


@app.route("/login", methods=["POST"])
def login():
    data = request.json
    user = User.query.filter_by(email=data["email"]).first()

    if user and check_password_hash(user.password, data["password"]):
       session["user_id"]=user.id
       return jsonify({"message": "Login successful",
                        "user_id" :user.id,
                        "name" :user.name })
    else:   
        return jsonify({"message":"Invalid credentials"}),401
  
    

@app.route('/diet-plan/<int:user_id>', methods=['GET'])
def diet_plan(user_id):
    user = db.session.get(User, user_id)

    if not user:
        return jsonify({"message": "User not found"}), 404

    diet = get_diet_plan(user.bmi_category)

    return jsonify({
        "name": user.name,
        "bmi": user.bmi,
        "bmi_category": user.bmi_category,
        "diet_type": user.diet_type,
        "daily_calories": user.daily_calories,
        "diet_plan": diet
    })

from models import Recipe

@app.route('/recipes', methods=['GET'])
def recipes_page():
    ingredient = request.args.get('ingredient')
    diet_type = request.args.get('diet_type')

    query = Recipe.query

    if diet_type:
        query = query.filter_by(diet_type=diet_type)

    recipes = query.all()
    results = []

    for recipe in recipes:
        if ingredient:
            ingredients_list = recipe.ingredients.lower().split(',')
            if ingredient.lower() not in ingredients_list:
                continue

        results.append({
            "id": recipe.id,
            "name": recipe.name,
            "ingredients": recipe.ingredients.split(','),
            "steps": recipe.steps,
            "calories": recipe.calories,
            "diet_type": recipe.diet_type
        })

    return jsonify(results)

@app.route('/ui')
def home_ui():
    return render_template('index.html')

@app.route('/register-ui')
def register_ui():
    return render_template('register.html')

@app.route('/login-ui')
def login_ui():
    return render_template('login.html')

@app.route("/dashboard")
def dashboard():

    user_id=session.get("user_id")
    user=User.query.get(user_id)

    return render_template(
        "dashboard.html",
        name=user.name,
        bmi=user.bmi,
        category=user.bmi_category,
        diet_plan=user.diet_type,
        daily_calories=user.daily_calories
    )

@app.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json()
    user = User.query.filter_by(email=data["email"]).first()

    if not user:
        return jsonify({"message": "Email not registered"}), 404

    user.password = generate_password_hash(data["newPassword"])
    db.session.commit()

    return jsonify({"message": "Password reset successful"})

@app.route("/forgot-password-ui")
def forgot_password_ui():
    return render_template("forgot_password.html")
#feb#
@app.route("/dashboard-data")
def dashboard_data():

    user_email = session.get("user_email")

    user = User.query.filter_by(email=user_email).first()

    if not user:
        return jsonify({"message": "User not found"}), 404

    # BMI calculation
    bmi = round(user.weight / ((user.height/100)**2), 2)

    # Category
    if bmi < 18.5:
        category = "Underweight"
        diet = "High Calorie Diet"
        calories = 2500
    elif bmi < 25:
        category = "Normal"
        diet = "Balanced Diet"
        calories = 2000
    else:
        category = "Overweight"
        diet = "Low Calorie Diet"
        calories = 1500

    return jsonify({
        "name": user.name,
        "bmi": bmi,
        "category": category,
        "diet": diet,
        "calories": calories
    })




@app.route("/get-recipes")
def get_recipes():
    if "user_id" not in session:
        return jsonify({"message": "Unauthorized"}), 401

    user = db.session.get(User, session["user_id"])
    diet_type = user.diet_type

    # Macro filtering logic
    if diet_type == "Low Carb Diet":
        url = f"https://api.spoonacular.com/recipes/complexSearch?apiKey={API_KEY}&cuisine=Indian&minProtein=15&maxCarbs=20&maxCalories=400&number=5&addRecipeInformation=true&addRecipeNutrition=true"
    elif diet_type == "High Calorie Diet":
        url = f"https://api.spoonacular.com/recipes/complexSearch?apiKey={API_KEY}&cuisine=Indian&minCalories=500&number=5&addRecipeInformation=true&addRecipeNutrition=true"
    elif diet_type == "Low Calorie Diet":
        url = f"https://api.spoonacular.com/recipes/complexSearch?apiKey={API_KEY}&cuisine=Indian&maxCalories=250&number=5&addRecipeInformation=true&addRecipeNutrition=true"
    else:  #Balanced
        url = f"https://api.spoonacular.com/recipes/complexSearch?apiKey={API_KEY}&cuisine=Indian&number=5&addRecipeInformation=true&addRecipeNutrition=true"

    response = requests.get(url, verify=False)
    data = response.json()

    recipes = []

    for r in data.get("results", []):

        calories = "N/A"

        if "nutrition" in r:
            for n in r["nutrition"]["nutrients"]:
               if n["name"] == "Calories":
                  calories = n["amount"]

        recipes.append({
          "title": r.get("title"),
          "image": r.get("image"),
          "calories": calories,
          "badge": diet_type
        })

    return jsonify(recipes)

@app.route("/search-recipes")
def search_recipes():

    query = request.args.get("query")

    url = f"https://api.spoonacular.com/recipes/complexSearch?query={query}&number=5&addRecipeNutrition=true&apiKey={API_KEY}"

    response = requests.get(url, verify=False)
    data = response.json()

    recipes = []

    for r in data.get("results", []):

        calories = "N/A"

        if "nutrition" in r:
            for n in r["nutrition"]["nutrients"]:
                if n["name"] == "Calories":
                    calories = n["amount"]

        recipes.append({
            "title": r.get("title"),
            "image": r.get("image"),
            "calories": calories
        })

    return jsonify(recipes)

# Food log routes

@app.route("/log-food", methods=["POST"])
def log_food():
    if "user_id" not in session:
        return jsonify({"message": "Unauthorized"}), 401
 
    data = request.get_json()
 
    entry = FoodLog(
        user_id=session["user_id"],
        food_name=data.get("food_name"),
        calories=float(data.get("calories", 0)),
        meal_type=data.get("meal_type", "snack"),
        image=data.get("image", None)
    )
 
    db.session.add(entry)
    db.session.commit()
 
    return jsonify({"message": "Logged", "entry": entry.to_dict()}), 200
 
 
@app.route("/food-log/today", methods=["GET"])
def get_today_log():
    if "user_id" not in session:
        return jsonify({"message": "Unauthorized"}), 401
 
    from datetime import date
    today = date.today()
 
    entries = FoodLog.query.filter_by(
        user_id=session["user_id"],
        logged_date=today
    ).all()
 
    return jsonify([e.to_dict() for e in entries])
 
 
@app.route("/food-log/delete/<int:entry_id>", methods=["DELETE"])
def delete_food_log(entry_id):
    if "user_id" not in session:
        return jsonify({"message": "Unauthorized"}), 401
 
    entry = FoodLog.query.get(entry_id)
 
    if not entry or entry.user_id != session["user_id"]:
        return jsonify({"message": "Not found"}), 404
 
    db.session.delete(entry)
    db.session.commit()
 
    return jsonify({"message": "Deleted"})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()

    app.run(debug=True)         
