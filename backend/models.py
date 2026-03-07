from db import db

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    height = db.Column(db.Float, nullable=False)
    weight = db.Column(db.Float, nullable=False)
    bmi = db.Column(db.Float, nullable=False)

    bmi_category=db.Column(db.String(50))
    diet_type=db.Column(db.String(50))
    daily_calories=db.Column(db.Integer)

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

