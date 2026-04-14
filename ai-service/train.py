import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
import pickle
import os

# Dummy dataset for training
data = [
    # Network
    ("wifi is completely down in library", "Network"),
    ("internet very slow in hostel 3", "Network"),
    ("cannot connect to campus network eduroam", "Network"),
    ("lab 4 computers have no lan connection", "Network"),
    ("router is broken in the hallway", "Network"),

    # Electrical
    ("tube light is flickering in classroom A1", "Electrical"),
    ("fan is making loud noise and not working", "Electrical"),
    ("power socket short circuit in my room", "Electrical"),
    ("AC is not cooling in seminar hall", "Electrical"),
    ("projector power cable is missing", "Electrical"),

    # Plumbing
    ("water leaking from washroom ceiling", "Plumbing"),
    ("flush is not working in ground floor toilet", "Plumbing"),
    ("no drinking water in the cooler", "Plumbing"),
    ("sink pipe is blocked and overflowing", "Plumbing"),
    ("tap is broken and water is wasting", "Plumbing"),

    # Cleaning
    ("corridor is very dirty and smells", "Cleaning"),
    ("dustbins are overflowing in the cafeteria", "Cleaning"),
    ("please clean the windows in lab 2", "Cleaning"),

    # Catering / Food
    ("no food in the boys hostel", "Catering"),
    ("stale food served in the mess", "Catering"),
    ("insects found in food plate today", "Catering"),
    ("cafeteria is closed during lunch time", "Catering"),
    ("water cooler is empty in dining hall", "Catering"),
    ("menu was not followed by caterer", "Catering"),

    # Other
    ("stray dogs on the campus ground", "Other"),
    ("bench is broken in the park", "Other"),
    ("need to fix the broken window glass", "Other")
]

df = pd.DataFrame(data, columns=["description", "category"])

# Create a pipeline combining TF-IDF and Logistic Regression
model = make_pipeline(
    TfidfVectorizer(stop_words='english', lowercase=True),
    LogisticRegression()
)

# Train the model
model.fit(df['description'], df['category'])

# Save the trained model
print("Training complete. Accuracy:", model.score(df['description'], df['category']))
with open("model.pkl", "wb") as f:
    pickle.dump(model, f)
print("Model saved to model.pkl")
