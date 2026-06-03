from database import get_connection
from thefuzz import fuzz

SIMILARITY_THRESHOLD = 35  # Adjust based on matching strictness rules

def compute_fuzzy_score(investor_tags: str, source_text: str, max_points: int) -> int:
    if not investor_tags or not source_text:
        return 0
        
    # Check for clean structural tokens string intersections
    investor_words = {w.strip().lower() for w in investor_tags.replace(",", " ").split() if w.strip()}
    source_words = {w.strip().lower() for w in source_text.replace(",", " ").split() if w.strip()}
    
    if investor_words.intersection(source_words):
        return max_points

    # Fallback ratio math calculation
    ratio = fuzz.partial_ratio(investor_tags.lower(), source_text.lower())
    if ratio >= SIMILARITY_THRESHOLD:
        return round((ratio / 100) * max_points)
    return 0

def get_recommendations(investor_id: int) -> list[int]:
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT industries, min_investment, max_investment
        FROM investor_profiles
        WHERE user_id = ?
    """, (investor_id,))
    profile = cursor.fetchone()

    if profile is None:
        conn.close()
        return []

    investor_industries = (profile["industries"] or "").strip()
    min_inv = profile["min_investment"]
    max_inv = profile["max_investment"]

    # Pull candidate arrays
    cursor.execute("""
        SELECT
            i.id,
            i.category,
            i.summary,
            i.funding_needed,
            i.owner_id,
            COUNT(intr.id) AS interest_count,
            CASE
                WHEN i.created_at >= datetime('now', '-30 days') THEN 1
                ELSE 0
            END AS is_recent
        FROM ideas i
        LEFT JOIN interests intr ON i.id = intr.idea_id
        WHERE i.visibility = 'public'
          AND i.id NOT IN (
              SELECT idea_id FROM interests WHERE investor_id = ?
          )
        GROUP BY i.id
    """, (investor_id,))
    ideas = cursor.fetchall()

    cursor.execute("SELECT user_id, skills FROM ideator_profiles")
    ideator_skills = {
        row["user_id"]: (row["skills"] or "").strip()
        for row in cursor.fetchall()
    }

    conn.close()
    scored = []

    for idea in ideas:
        score = 0
        
        category = (idea["category"] or "").strip()
        summary = (idea["summary"] or "").strip()
        text_pool = f"{category} {summary}"

        # Signal 1: Category Check
        ind_score = compute_fuzzy_score(investor_industries, text_pool, 40)
        score += ind_score

        # Signal 2: Experience Pool Match
        owner_skills = ideator_skills.get(idea["owner_id"], "")
        sk_score = compute_fuzzy_score(investor_industries, owner_skills, 20)
        score += sk_score

        # Signal 3 & 4: Valuation Ranges Bracket Constraints
        funding = idea["funding_needed"]
        if funding is not None and min_inv is not None and max_inv is not None:
            if min_inv <= funding <= max_inv:
                score += 30
                range_size = max_inv - min_inv
                if range_size > 0:
                    midpoint = (min_inv + max_inv) / 2
                    closeness = 1 - (abs(funding - midpoint) / (range_size / 2))
                    score += round(max(0, closeness) * 15)

        # Signal 5: Velocity Popularity
        interests_total = idea["interest_count"] or 0
        score += min(interests_total * 5, 20)

        # Signal 6: Date Delta Limit Check
        if idea["is_recent"]:
            score += 10

        # Signal 7: Identity Setup Completeness Validation
        if idea["owner_id"] in ideator_skills:
            score += 5

        scored.append((idea["id"], score))

    scored.sort(key=lambda x: x[1], reverse=True)
    return [idea_id for idea_id, _ in scored]