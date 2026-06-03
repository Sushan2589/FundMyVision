from database import get_connection
from sentence_transformers import SentenceTransformer, util

# Load the model once when the module is imported — not on every request.
# all-MiniLM-L6-v2 is lightweight (~120MB RAM) and fast enough for a demo.
model = SentenceTransformer("all-MiniLM-L6-v2")

SIMILARITY_THRESHOLD = 0.3  # below this, we treat the match as zero


def semantic_score(text_a: str, text_b: str, max_points: int) -> float:
    """
    Returns a score between 0 and max_points based on how semantically
    similar text_a and text_b are. Anything below SIMILARITY_THRESHOLD
    gets zero points so unrelated concepts don't sneak in points.
    """
    if not text_a or not text_b:
        return 0
    embeddings = model.encode([text_a, text_b], convert_to_tensor=True)
    similarity = util.cos_sim(embeddings[0], embeddings[1]).item()
    if similarity < SIMILARITY_THRESHOLD:
        return 0
    return round(similarity * max_points)


def get_recommendations(investor_id: int) -> list[int]:
    conn = get_connection()
    cursor = conn.cursor()

    # Fetch the investor's profile
    cursor.execute("""
        SELECT industries, min_investment, max_investment
        FROM investor_profiles
        WHERE user_id = ?
    """, (investor_id,))
    profile = cursor.fetchone()

    if profile is None:
        conn.close()
        return []

    raw_industries = profile["industries"] or ""
    investor_industries = [i.strip().lower() for i in raw_industries.split(",") if i.strip()]
    investor_industries_text = " ".join(investor_industries)  # joined for embedding

    min_inv = profile["min_investment"]
    max_inv = profile["max_investment"]

    # Fetch candidate ideas — public, not already seen by this investor.
    # Also fetches interest_count, is_recent, and owner_id for scoring.
    # Note: alias "intr" used for interests to avoid clashing with Python's built-in "int".
    cursor.execute("""
        SELECT
            i.id,
            i.category,
            i.funding_needed,
            i.owner_id,
            COUNT(intr.id) AS interest_count,
            CASE
                WHEN i.created_at >= datetime('now', '-30 days') THEN 1
                ELSE 0
            END AS is_recent
        FROM ideas i
        LEFT JOIN interests intr
            ON i.id = intr.idea_id AND intr.investor_id != ?
        WHERE i.visibility = 'public'
          AND i.id NOT IN (
              SELECT idea_id FROM interests WHERE investor_id = ?
          )
        GROUP BY i.id
    """, (investor_id, investor_id))
    ideas = cursor.fetchall()

    # Fetch ideator profiles so we can use their skills as a scoring signal.
    # We build a dict of { user_id: skills_text } for fast lookup.
    cursor.execute("SELECT user_id, skills FROM ideator_profiles")
    ideator_skills = {
        row["user_id"]: (row["skills"] or "").strip()
        for row in cursor.fetchall()
    }

    conn.close()

    # Score each idea
    scored = []

    for idea in ideas:
        score = 0
        explanation = []

        idea_category = (idea["category"] or "").strip()

        # Signal 1: Industry match — semantic similarity (up to +40)
        # How closely does the idea's category relate to the investor's industries?
        industry_score = semantic_score(investor_industries_text, idea_category, 40)
        score += industry_score
        if industry_score > 0:
            explanation.append(f"industry match ({industry_score}pts)")

        # Signal 2: Ideator skills match — semantic similarity (up to +20)
        # How closely do the ideator's skills relate to the idea's category?
        # Rewards ideas backed by a founder who knows their domain.
        owner_skills = ideator_skills.get(idea["owner_id"], "")
        skills_score = semantic_score(owner_skills, idea_category, 20)
        score += skills_score
        if skills_score > 0:
            explanation.append(f"skills match ({skills_score}pts)")

        # Signal 3: Funding range — binary check (+30)
        # Signal 4: Funding closeness — only runs if Signal 3 passed (up to +15)
        # Separating these ensures an out-of-range idea never gets closeness points.
        funding = idea["funding_needed"]
        if funding is not None and min_inv is not None and max_inv is not None:
            if min_inv <= funding <= max_inv:
                score += 30
                explanation.append("within budget")

                # How centered is the ask within the investor's range?
                # Perfect center → +15, near the edges → fewer points.
                range_size = max_inv - min_inv
                if range_size > 0:
                    midpoint = (min_inv + max_inv) / 2
                    distance_from_center = abs(funding - midpoint)
                    closeness = 1 - (distance_from_center / (range_size / 2))
                    closeness_score = round(max(0, closeness) * 15)
                    score += closeness_score
                    if closeness_score > 7:
                        explanation.append(f"good funding fit ({closeness_score}pts)")

        # Signal 5: Popularity — other investors' interest (up to +20)
        # Capped at 4 investors (+5 each) to avoid runaway popular ideas.
        interest_count = idea["interest_count"] or 0
        popularity_score = min(interest_count * 5, 20)
        score += popularity_score
        if popularity_score > 0:
            explanation.append(f"{interest_count} other investor(s) interested")

        # Signal 6: Recency (+10)
        # Ideas posted in the last 30 days get a freshness bonus.
        if idea["is_recent"]:
            score += 10
            explanation.append("recently posted")

        # Signal 7: Ideator has a profile (+5)
        # A filled-out profile signals the ideator is serious.
        if idea["owner_id"] in ideator_skills:
            score += 5
            explanation.append("ideator has profile")

        scored.append((idea["id"], score, explanation))

    scored.sort(key=lambda x: x[1], reverse=True)

    print(f"\nRecommendations for investor {investor_id}:")
    for idea_id, total_score, reasons in scored:
        print(f"  Idea {idea_id}: {total_score} pts — {', '.join(reasons) if reasons else 'no signals matched'}")

    return [idea_id for idea_id, _, _ in scored]