import random
import sqlite3
import bcrypt
from database import DB_PATH
from faker import Faker

fake = Faker()

INDUSTRIES_POOL = ["AI", "SaaS", "Fintech", "Healthtech", "E-commerce", "CleanTech", "EdTech", "Web3"]
SKILLS_POOL = ["Python", "React", "Node.js", "Machine Learning", "Data Analytics", "UI/UX Design", "AWS", "SQL"]

def get_password_hash(password: str) -> str:
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt(rounds=10)
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def seed_database():
    print(f"Connecting to database at: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print("Clearing old tables...")
    cursor.execute("DELETE FROM messages")
    cursor.execute("DELETE FROM conversations")
    cursor.execute("DELETE FROM interests")
    cursor.execute("DELETE FROM ideas")
    cursor.execute("DELETE FROM ideator_profiles")
    cursor.execute("DELETE FROM investor_profiles")
    cursor.execute("DELETE FROM users")
    cursor.execute("DELETE FROM sqlite_sequence WHERE name IN ('users', 'ideas', 'interests', 'conversations', 'messages')")
    conn.commit()

    print("Pre-hashing passwords...")
    universal_hash = get_password_hash("123")

    print("Generating dummy data...")

    # 1. CREATE SYSTEM ADMIN (Verified)
    cursor.execute("""
        INSERT INTO users (username, email, password, role, verified) 
        VALUES ('admin', 'admin@fundmyvision.com', ?, 'admin', 1)
    """, (universal_hash,))

    # 2. CREATE INVESTORS (Verified)
    investor_ids = []
    for i in range(15):
        username = f"investor_{i}_{fake.user_name()}"
        email = fake.unique.email()
        
        cursor.execute("""
            INSERT INTO users (username, email, password, role, verified) 
            VALUES (?, ?, ?, 'investor', 1)
        """, (username, email, universal_hash))
        user_id = cursor.lastrowid
        investor_ids.append(user_id)

        chosen_industries = ", ".join(random.sample(INDUSTRIES_POOL, k=random.randint(1, 2)))
        min_inv = random.choice([10000, 25000, 50000])
        max_inv = min_inv + random.choice([50000, 100000, 200000])

        cursor.execute("""
            INSERT INTO investor_profiles (user_id, company_name, bio, industries, min_investment, max_investment)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (user_id, fake.company(), fake.catch_phrase(), chosen_industries, min_inv, max_inv))

    # 3. CREATE IDEATORS (Verified)
    ideator_ids = []
    for i in range(15):
        username = f"ideator_{i}_{fake.user_name()}"
        email = fake.unique.email()

        cursor.execute("""
            INSERT INTO users (username, email, password, role, verified) 
            VALUES (?, ?, ?, 'ideator', 1)
        """, (username, email, universal_hash))
        user_id = cursor.lastrowid
        ideator_ids.append(user_id)

        chosen_skills = ", ".join(random.sample(SKILLS_POOL, k=random.randint(2, 4)))
        location = fake.city()

        cursor.execute("""
            INSERT INTO ideator_profiles (user_id, bio, skills, location)
            VALUES (?, ?, ?, ?)
        """, (user_id, fake.paragraph(nb_sentences=2), chosen_skills, location))

    # 4. CREATE IDEAS
    idea_ids = []
    for owner_id in ideator_ids:
        for _ in range(random.randint(1, 2)):
            category = random.choice(INDUSTRIES_POOL)
            title = f"{fake.word().capitalize()} {category} Platform"
            summary = fake.sentence(nb_words=8)
            description = fake.paragraph(nb_sentences=4)
            funding_needed = random.choice([15000, 30000, 75000, 120000, 250000])
            
            cursor.execute("""
                INSERT INTO ideas (owner_id, title, summary, description, category, stage, funding_needed, visibility)
                VALUES (?, ?, ?, ?, ?, 'MVP', ?, 'public')
            """, (owner_id, title, summary, description, category, funding_needed))
            idea_ids.append(cursor.lastrowid)

    # 5. CREATE INTERESTS AND MATCHING CONVERSATIONS
    for _ in range(25):
        try:
            target_idea = random.choice(idea_ids)
            target_investor = random.choice(investor_ids)
            
            cursor.execute("""
                INSERT INTO interests (idea_id, investor_id, message, amount, status)
                VALUES (?, ?, ?, ?, 'pending')
            """, (target_idea, target_investor, "Interested in your deck.", random.choice([20000, 50000])))
            
            cursor.execute("""
                INSERT INTO conversations (idea_id, investor_id)
                VALUES (?, ?)
            """, (target_idea, target_investor))
            
        except sqlite3.IntegrityError:
            continue

    conn.commit()
    conn.close()
    print("\nDatabase seeded successfully! All generated users are fully verified.")

if __name__ == "__main__":
    seed_database()