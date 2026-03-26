import sqlite3

conn = sqlite3.connect("instance/database.db")
cursor = conn.cursor()

cursor.execute("ALTER TABLE food_log ADD COLUMN protein FLOAT")
cursor.execute("ALTER TABLE food_log ADD COLUMN carbs FLOAT")
cursor.execute("ALTER TABLE food_log ADD COLUMN fat FLOAT")

conn.commit()
conn.close()

print("columns added.")