from database import get_connection

def get_recommendations(investor_id: int) -> list[int]:
    conn = get_connection()
    cursor = conn.cursor()

    # ─── Step 1: Fetch the investor's profile ───────────────────────────────
    # We need their preferred industries and investment range.
    # If they haven't filled out a profile yet, we return an empty list.
    cursor.execute("""
        SELECT industries, min_investment, max_investment
        FROM investor_profiles
        WHERE user_id = ?
    """, (investor_id,))
    profile = cursor.fetchone()

    if profile is None:
        conn.close()
        return []

    # Turn "fintech,health,edtech" into ["fintech", "health", "edtech"]
    # .lower() makes the matching case-insensitive
    raw_industries = profile["industries"] or ""
    investor_industries = [i.strip().lower() for i in raw_industries.split(",") if i.strip()]

    min_inv = profile["min_investment"]
    max_inv = profile["max_investment"]

    # ─── Step 2: Fetch candidate ideas ──────────────────────────────────────
    # We only consider:
    #   - public ideas (visibility = 'public')
    #   - ideas this investor hasn't already expressed interest in
    # We also fetch extra data we need for scoring:
    #   - interest_count: how many OTHER investors liked this idea (popularity)
    #   - created_at: to check recency
    #   - owner_id: to check if the ideator has a profile
    cursor.execute("""
        SELECT
            i.id,
            i.category,
            i.funding_needed,
            i.owner_id,
            COUNT(int.id) as interest_count,
            CASE WHEN i.created_at >= datetime('now', '-30 days') THEN 1 ELSE 0 END as is_recent
        FROM ideas i
        LEFT JOIN interests int
            ON i.id = int.idea_id AND int.investor_id != ?
        WHERE i.visibility = 'public'
          AND i.id NOT IN (
              SELECT idea_id FROM interests WHERE investor_id = ?
          )
        GROUP BY i.id
    """, (investor_id, investor_id))
    ideas = cursor.fetchall()

    # ─── Step 3: Fetch all ideator user_ids that have a profile ─────────────
    # We do this once here rather than running a query inside the loop,
    # which would be slow if there are many ideas.
    cursor.execute("SELECT user_id FROM ideator_profiles")
    ideators_with_profile = set(row["user_id"] for row in cursor.fetchall())

    conn.close()

    # ─── Step 4: Score each idea ─────────────────────────────────────────────
    scored = []

    for idea in ideas:
        score = 0
        explanation = []  # helpful for debugging during the demo

        # Signal 1: Industry match (+40)
        # Does the idea's category appear in what the investor cares about?
        idea_category = (idea["category"] or "").strip().lower()
        if idea_category and idea_category in investor_industries:
            score += 40
            explanation.append("industry match")

        # Signal 2: Funding range — binary check (+30)
        # Is the funding amount within the investor's min/max budget?
        funding = idea["funding_needed"]
        if funding is not None and min_inv is not None and max_inv is not None:
            if min_inv <= funding <= max_inv:
                score += 30
                explanation.append("within budget")

            # Signal 3: Funding closeness — how centered is the ask? (up to +15)
            # We calculate how close the funding is to the middle of their range.
            # If range is $0–$100k and ask is $50k, that's perfect → +15
            # If ask is $90k (near the edge), that's less ideal → fewer points
            # Formula: 1 - (distance from midpoint / half the range)
            range_size = max_inv - min_inv
            if range_size > 0:
                midpoint = (min_inv + max_inv) / 2
                distance_from_center = abs(funding - midpoint)
                closeness = 1 - (distance_from_center / (range_size / 2))
                # closeness is between 0.0 and 1.0, multiply by 15 for points
                closeness_score = round(max(0, closeness) * 15)
                score += closeness_score
                if closeness_score > 7:
                    explanation.append("good funding fit")

        # Signal 4: Popularity — other investors' interest (up to +20)
        # An idea that 5 other investors liked is more credible than one with 0.
        # We cap the bonus at 20 points (reached at 4+ interested investors).
        interest_count = idea["interest_count"] or 0
        popularity_score = min(interest_count * 5, 20)
        score += popularity_score
        if popularity_score > 0:
            explanation.append(f"{interest_count} other investors interested")

        # Signal 5: Recency (+10)
        # Ideas posted in the last 30 days get a freshness bonus.
        # created_at is stored as a string like "2024-01-15 10:30:00"
        # so we just do a string comparison — SQLite stores dates as text.
        if idea["is_recent"]:
            score += 10
            explanation.append("recently posted")

        # Signal 6: Ideator has a profile (+5)
        # A filled-out ideator profile signals seriousness.
        # We check against the set we built in Step 3.
        if idea["owner_id"] in ideators_with_profile:
            score += 5
            explanation.append("ideator has profile")

        scored.append((idea["id"], score, explanation))

    # ─── Step 5: Sort and return ─────────────────────────────────────────────
    # Sort by score, highest first.
    scored.sort(key=lambda x: x[1], reverse=True)

    # Print scoring breakdown to terminal — useful during the demo
    print(f"\nRecommendations for investor {investor_id}:")
    for idea_id, total_score, reasons in scored:
        print(f"  Idea {idea_id}: {total_score} pts — {', '.join(reasons) if reasons else 'no match'}")

    return [idea_id for idea_id, _, _ in scored]