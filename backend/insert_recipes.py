from app import app, db
from models import Recipe

recipes = [
    Recipe(
        name="Vegetable Upma",
        ingredients="rava,carrot,beans,onion",
        steps="Roast rava, cook vegetables, mix with water and cook",
        calories=180,
        diet_type="Balanced Diet"
    ),
    Recipe(
        name="Egg Omelette",
        ingredients="egg,onion,oil",
        steps="Beat eggs, add onion, cook on pan",
        calories=150,
        diet_type="High Calorie Diet"
    ),
    Recipe(
        name="Vegetable Salad",
        ingredients="cucumber,tomato,carrot",
        steps="Chop vegetables and mix",
        calories=90,
        diet_type="Low Calorie Diet"
    ),
    Recipe(
        name="Dal Soup",
        ingredients="dal,water,spices",
        steps="Boil dal with spices and blend",
        calories=120,
        diet_type="Controlled Diet"
    )
]

with app.app_context():
    db.session.bulk_save_objects(recipes)
    db.session.commit()

print("Recipes inserted successfully!")
