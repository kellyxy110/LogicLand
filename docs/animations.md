# LogicLand — Motion Design

Library: **Framer Motion**. Motion is meaningful, never decorative noise.

## Principles
- **Purpose:** motion communicates state, guides attention, and celebrates.
- **Snappy:** UI transitions 150–250ms, ease-out. Celebrations up to ~800ms.
- **Spring for personality:** Robo and rewards use gentle springs.
- **Respect `prefers-reduced-motion`:** provide instant, non-animated fallbacks.

## Signature moments
- **Reward burst:** stars/coins on mission completion (confetti-lite).
- **XP/level up:** meter fill + badge pop.
- **Streak flame:** subtle idle animation that grows with streak length.
- **Robo reactions:** idle breathing, happy bounce on success, gentle tilt on hint.
- **Page/route transitions:** soft fade + rise, no jarring slides.

## Performance
Prefer transform/opacity; avoid layout thrash. Lazy-load heavy celebration assets.
