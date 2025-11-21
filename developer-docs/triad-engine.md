
# Triad Engine — Palmistry + Astrology + Numerology Fusion

The Triad Engine is the core of the Melodies Answers Platform.

It contains three modules:

---

## 1. Palmistry Engine
Processes uploaded palm image.

### Extracts:
- Line interpretations:
  - Life line
  - Head line
  - Heart line
  - Fate line
  - Sun line
  - Intuition lines
  - Marriage lines
  - Travel lines
- Markings:
  - Crosses
  - Stars
  - Chains
  - Islands
- Shape analysis
- Elemental hand type
- Mounts analysis (Jupiter, Saturn, Apollo, Mercury)
- Finger proportions

Palm engine outputs structured JSON (not free text).

---

## 2. Astrology Engine
Computed using:
- Birth date
- Birth time (if missing, “B” mode picks date only)
- Birth location

### Outputs:
- Sun, Moon, Rising
- Planets (Mercury → Pluto)
- Houses (1–12)
- Aspects (major)
- Themes (spiritual, emotional, mental)
- Summary paragraph

---

## 3. Numerology Engine

### Outputs:
- Life Path
- Expression
- Soul Urge
- Personality
- Karmic Lessons
- Karmic Debts
- Hidden Passion
- Pinnacles
- Challenges

---

## Adaptive Fusion Engine

Combines all three:

- Extracts dominant themes
- Calculates confidence score
- Provides a **short answer**:
  - calm
  - direct
  - grounded
  - Apple Support tone

Example:
“Based on your chart, the strongest pattern is emotional recalibration and new alignment in relationships.”

This short answer is returned to frontend.
