from db import db
from datetime import date

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    height = db.Column(db.Float, nullable=False)
    weight = db.Column(db.Float, nullable=False)
    bmi = db.Column(db.Float, nullable=False)
    bmi_category = db.Column(db.String(50))
    diet_type = db.Column(db.String(50))
    daily_calories = db.Column(db.Integer)

    def __repr__(self):
        return f"<User {self.email}>"


class Recipe(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    ingredients = db.Column(db.String(300), nullable=False)
    steps = db.Column(db.Text, nullable=False)
    calories = db.Column(db.Integer, nullable=False)
    diet_type = db.Column(db.String(50), nullable=False)

    def __repr__(self):
        return f"<Recipe {self.name}>"


class FoodLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    food_name = db.Column(db.String(200), nullable=False)
    calories = db.Column(db.Float, nullable=False)
    meal_type = db.Column(db.String(20), nullable=False, default='snack')  # breakfast, lunch, dinner, snack
    image = db.Column(db.String(500), nullable=True)
    logged_date = db.Column(db.Date, nullable=False, default=date.today)

    def to_dict(self):
        return {
            "id": self.id,
            "food_name": self.food_name,
            "calories": self.calories,
            "meal_type": self.meal_type,
            "image": self.image,
            "logged_date": str(self.logged_date)
        }

    def __repr__(self):
        return f"<FoodLog {self.food_name}>"