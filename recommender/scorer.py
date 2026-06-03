from database import get_connection
from thefuzz import fuzz

FUZZY_THRESHOLD = 60  # Out of 100. Lower means more forgiving of typos.


def non_ai_text_score(investor_tags_text: str, item_text: str, max_points: int) -> int:
    """
    Calculates similarity using exact keyword intersections and lightweight 
    Levenshtein distance matching instead of heavy neural network embeddings.
    """
    if not investor_tags_text or not item_text:
        return 0

    # Clean and split into sets of words/tags
    # e.g., "AI, SaaS, Fintech" -> {"ai", "saas", "fintech"}
    investor_tags = {t.strip().lower() for t in investor_tags_text.replace(",", " ").split() if t.strip()}
    item_words = {w.strip().lower() for w in item_text.replace(",", " ").split() if w.strip()}

    if not investor_tags or not item_words:
        return 0

    # 1. Check for Exact Keyword Matches (Set Intersection)
    # If the user listed "AI" and the project category contains "AI", give max points immediately.
    exact_matches = investor_tags.intersection(item_words)
    if exact_matches:
        return max_points

    # 2. Fallback: Fuzzy Partial String Matching (No AI, pure character math)
    # Handles things like "Fintech" vs "Fin-tech" or "Machine Learning" vs "ML" typos
    fuzzy_ratio = fuzz.partial_ratio(investor_tags_text.lower(), item_text.lower())
    
    if fuzzy_ratio >= FUZZY_THRESHOLD:
        # Scale the 0-100 score down to your max_points scale
        return round((fuzzy_ratio / 100) * max_points)
        
    return 0


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

    # Format investor tags
    investor_industries_text = (profile["industries"] or "").strip()
    min_inv = profile["min_investment"]
    max_inv = profile["max_investment"]

    # Fetch candidate ideas — public, not already seen by this investor.
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

    # Fetch ideator profiles for skills matching.
    cursor.execute("SELECT user_id, skills FROM ideator_profiles")
    ideator_skills = {
        row["user_id"]: (row["skills"] or "").strip()
        for row in cursor.fetchall()
    }

    conn.close()

    scored = []

    for idea in ideas:
        score = 0
        explanation = []

        idea_category = (idea["category"] or "").strip()
        idea_summary = (idea["summary"] or "").strip()
        # Combine category and summary for a wider keyword net
        idea_text_pool = f"{idea_category} {idea_summary}"

        # Signal 1: Industry match via keywords/fuzzy (up to +40)
        industry_score = non_ai_text_score(investor_industries_text, idea_text_pool, 40)
        score += industry_score
        if industry_score > 0:
            explanation.append(f"industry match ({industry_score}pts)")

        # Signal 2: Ideator skills match against investor interests (up to +20)
        owner_skills = ideator_skills.get(idea["owner_id"], "")
        skills_score = non_ai_text_score(investor_industries_text, owner_skills, 20)
        score += skills_score
        if skills_score > 0:
            explanation.append(f"skills alignment ({skills_score}pts)")

        # Signal 3 & 4: Funding match checks (+30 and up to +15)
        funding = idea["funding_needed"]
        if funding is not None and min_inv is not None and max_inv is not None:
            if min_inv <= funding <= max_inv:
                score += 30
                explanation.append("within budget")

                range_size = max_inv - min_inv
                if range_size > 0:
                    midpoint = (min_inv + max_inv) / 2
                    distance_from_center = abs(funding - midpoint)
                    closeness = 1 - (distance_from_center / (range_size / 2))
                    closeness_score = round(max(0, closeness) * 15)
                    score += closeness_score
                    if closeness_score > 7:
                        explanation.append(f"good funding fit ({closeness_score}pts)")

        # Signal 5: Popularity multiplier (up to +20)
        interest_count = idea["interest_count"] or 0
        popularity_score = min(interest_count * 5, 20)
        score += popularity_score
        if popularity_score > 0:
            explanation.append(f"{interest_count} investor(s) interested")

        # Signal 6: Recency (+10)
        if idea["is_recent"]:
            score += 10
            explanation.append("recently posted")

        # Signal 7: Profile completeness bonus (+5)
        if idea["owner_id"] in ideator_skills:
            score += 5
            explanation.append("ideator profile verified")

        scored.append((idea["id"], score, explanation))

    # Sort candidates by total score descending
    scored.sort(key=lambda x: x[1], reverse=True)
    return [idea_id for idea_id, _, _ in scored]