# Golden Striker v17 — Road to the Pallone d'Oro
## Complete Football Career Simulation Game

---

## 🎮 Overview

Golden Striker is a comprehensive text-based football career management game where you guide a player from a promising teenager in the lower divisions all the way to world superstar status and the Pallone d'Oro award.

### Core Features
- **Career progression** from age 16 to retirement at 38
- **10 playable leagues** across 5 countries (Italy, France, England, Spain, Germany)
- **Champions Cup** with full group stage, knockout rounds, and final
- **Skill Tree** with 15+ unlockable abilities that affect match performance
- **Agent system** with 5 levels of agents offering different bonuses
- **Personal Facility** upgrades from basic pitch to elite academy (7 levels)
- **Dynamic news system** with 300+ unique news templates
- **Sound engine** with Web Audio API — no external dependencies
- **Particle system** for goal celebrations, level-ups, and achievements
- **Achievement system** with 40+ unlockable badges
- **Live commentary** ticker during match simulation
- **Career charts** with goals, assists, and rating visualization
- **Season planner** with fixture difficulty ratings and win probability
- **Tutorial system** for new players
- **Full bilingual support** (Italian / English) with real-time switching

---

## 📁 File Structure

```
golden_striker/
├── backend/
│   ├── api/
│   │   ├── agente.php        — Agent hire/upgrade endpoints
│   │   ├── ai_avatar.php     — AI portrait generation (Pollinations.ai)
│   │   ├── auth.php          — Authentication, careers, account management
│   │   ├── classifica.php    — League standings and Champions Cup data
│   │   ├── extra.php         — News, objectives, season data
│   │   ├── game.php          — Core gameplay: month simulation, transfers
│   │   └── player.php        — Player data, teams, log, season stats
│   └── config/
│       └── db.php            — SQLite schema, seed data, auth helpers
├── frontend/
│   ├── css/
│   │   ├── style.css         — Main styles + full utility/component library
│   │   └── enhancements.css  — Animations, glassmorphism, micro-interactions
│   ├── js/
│   │   ├── app.js            — Main application logic (~200KB)
│   │   ├── sounds.js         — Web Audio API sound engine
│   │   ├── particles.js      — Canvas particle system
│   │   ├── achievements.js   — 40+ achievement system with toast notifications
│   │   ├── commentary.js     — Live match commentary ticker
│   │   ├── charts.js         — Custom canvas charts (bar, line, radar)
│   │   ├── animations.js     — Page transitions, stadium SVG, stat indicators
│   │   ├── tutorial.js       — Interactive 10-step onboarding overlay
│   │   ├── gamedata.js       — Fun facts, quotes, flavor text, hype messages
│   │   ├── locale.js         — Extended localization, milestones, skill lore
│   │   ├── crowd.js          — Animated crowd system with wave effects
│   │   └── season_planner.js — Season calendar, projection, heatmap
│   ├── index.html            — Main single-page application
│   └── reset.html            — Password reset page
├── router.php                — PHP built-in server router
└── start.sh                  — Launch script (starts PHP server on port 8080)
```

---

## 🚀 Getting Started

### Requirements
- PHP 7.4+ (SQLite support included by default)
- Modern browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

### Installation
```bash
# Clone or download the project
cd golden_striker

# Start the server
bash start.sh
# OR manually:
php -S localhost:8080 router.php
```

Then open **http://localhost:8080** in your browser.

---

## 🏟️ Gameplay Guide

### Month Cycle
Each month you choose up to **3 actions** that affect your stats:
| Action | Effect |
|--------|--------|
| 🎯 Shooting Practice | +Tiro, -Energia |
| ⚡ Sprint & Agility | +Velocità, -Energia |
| 🏃 Technical & Dribbling | +Dribbling, -Energia |
| 💪 Physical Conditioning | +Fisico, -Energia |
| 🔥 Special Training | +All stats (high), -Energia (high), injury risk |
| 🧠 Mental Training | +Mentalità, mood boost |
| 📱 Social Activities | +Popolarità |
| 😴 Rest & Recovery | +Energia, +Morale |

After choosing actions, the month simulates:
- League matches are played
- Champions Cup matches (if qualified)
- Stats update, news is generated
- Achievements are checked

### Season Structure
The season runs **September → June** (10 months):
- **September**: Season start, new contracts, Champions Cup enrollment
- **October–May**: League + Champions Cup matches
- **June**: Season end, Pallone d'Oro, promotions/relegations, age +1

### Overall Rating
Your Overall is the average of your 5 stats:
`Overall = (Tiro + Velocità + Dribbling + Fisico + Mentalità) / 5`
Maximum possible: **125** (each stat maxes at 125 with skill boosts)

### Pallone d'Oro Formula
```
Score = Goals×3 + Assists×2 + AvgRating×5 + Overall×0.5 + Popularity×0.3 + LeagueBonus
- League Bonus: +20 if in First Division
- Score ≥ 220: Win the Pallone d'Oro! 🥇
- Score ≥ 175: Finalist (Top 3)
- Score ≥ 130: Top 10
- Score ≥ 90: Top 30
```

---

## 🎯 Skill Tree

### Categories
**Dribbling**: Elastic Touch, Quick Burst, Dribble Mosaic
**Shooting**: Power Shot, Curl Shot, Header, Rabona
**Speed**: Turbo Sprint, Endurance, Nitro
**Physical**: Beast Physical, Iron Body, Pressure Resistance
**Mental**: Composure, Striker Instinct, Game Reading

### How Skills Work
Each skill has 1-3 levels. Unlocking levels:
1. Applies a permanent stat boost to the player
2. Unlocks special goal types in match simulation
3. Affects `piede_forte` and `piede_debole` ratings (1-5 stars)

### Skill Points
Earned by reaching Overall milestones: 40, 50, 60, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125

---

## 🏆 Champions Cup

### Qualification
Top 4 teams from each First Division at season end qualify automatically.

### Format
1. **Group Stage** (September–December): 4 groups of 5 teams, 8 matches each
2. **Playoffs** (January): 2nd and 3rd place teams compete
3. **Round of 16** (February)
4. **Quarter-finals** (March)
5. **Semi-finals** (April)
6. **Final** (May)

Prize: **€500,000** + 1 Trophy + Champions Cup badge

---

## 🤝 Agent System

| Level | Name | Cost | Salary Bonus | OVR Discount |
|-------|------|------|-------------|--------------|
| 1 | Marco Ferretti | €15,000 | +10% | -2.5% |
| 2 | Carlos Mendez | €40,000 | +20% | -5% |
| 3 | James Whitfield | €100,000 | +35% | -7.5% |
| 4 | Alexandre Dupont | €250,000 | +50% | -10% |
| 5 | Giovanni El-Fares | €600,000 | +75% | -15% |

---

## 🏗️ Facility System

| Level | Name | Cost | Training Bonus | Growth Bonus | Injury Reduction |
|-------|------|------|----------------|-------------|-----------------|
| 0 | None | — | 0 | 0 | 0 |
| 1 | Basic Pitch | €50,000 | +1 | 0 | 0 |
| 2 | Dressing Room | €110,000 | +1 | +1% | -2% |
| 3 | Gym & Field | €200,000 | +2 | +2% | -5% |
| 4 | Sports Centre | €380,000 | +2 | +10% | -8% |
| 5 | High-Tech Centre | €600,000 | +3 | +20% | -10% |
| 6 | Elite Centre | €950,000 | +4 | +28% | -15% |
| 7 | Personal Academy | €1,500,000 | +5 | +35% | -20% |

---

## 🎵 Sound System

The game uses the **Web Audio API** for all sounds — no external files needed:
- `GS_Sound.play('goal')` — goal scored
- `GS_Sound.play('win')` — match/season win
- `GS_Sound.play('loss')` — defeat
- `GS_Sound.play('levelUp')` — skill unlocked
- `GS_Sound.play('achievement')` — achievement unlocked
- `GS_Sound.play('transfer')` — transfer completed
- `GS_Sound.play('coin')` — money earned
- `GS_Sound.play('newSeason')` — new season starts
- `GS_Sound.play('notification')` — general notification

Toggle sound: click the 🔊 button (bottom-left) or via Settings.

---

## 🏅 Achievement System

40+ achievements across 8 categories:
- **Milestones**: First Goal, First Assist, First Win, First Season
- **Scoring**: 10/50/100/200 goals, Hat-trick, 50 assists
- **Growth**: OVR 70/80/90/100/115
- **Trophies**: First trophy, 3/10 trophies, Pallone d'Or, Champions
- **Career**: Popularity 50/90, Millionaire, 5/10 seasons, Top Club
- **Skills**: First skill, 5/10/15 skills unlocked
- **Facilities**: First facility, Max facility level
- **Secrets**: Iron Man, Comeback, Timeless, GOAT...

---

## 🌍 Leagues & Teams

### Italy (Seria Alfa / Seria Beta)
20 + 18 teams inspired by real Serie A and Serie B clubs

### France (Ligue Premier / Ligue Seconde)
18 + 18 teams inspired by real Ligue 1 and Ligue 2 clubs

### England (Premier Division / Championship)
20 + 20 teams inspired by real Premier League and Championship clubs

### Spain (La Primera / La Segunda)
20 + 18 teams inspired by real La Liga and Segunda División clubs

### Germany (Bundesliga Pro / Bundesliga Zwei)
18 + 18 teams inspired by real Bundesliga 1 and 2 clubs

---

## 🔧 Database Schema

Key tables:
- `accounts` — User accounts (email, username, password hash)
- `players` — Career data (stats, money, trophies, age)
- `teams` — All 170+ clubs with OVR, stars, budget
- `leghe` — 10 leagues across 5 nations
- `nazioni` — 5 nations (Italy, France, England, Spain, Germany)
- `log_mensile` — Monthly match and training log
- `stagioni` — Season summary statistics
- `notizie` — Dynamic news feed for each career
- `obiettivi` — Season objectives with progress tracking
- `classifica` — League standings (points, goals, W/D/L)
- `champions_cup` — Champions Cup group/knockout data
- `skill_boosts` — Permanent skill bonuses applied to player
- `agente` — Hired agent data
- `calendario` — Generated fixture calendar per league/season

---

## 🔐 Security

- Passwords hashed with `password_hash(PASSWORD_DEFAULT)` (bcrypt)
- Tokens are cryptographically random 64-char hex strings
- Career access validated: each API call verifies the career belongs to the authenticated account
- SQL injection prevention: all queries use PDO prepared statements
- Email validation with `FILTER_VALIDATE_EMAIL`
- Username validation: letters, numbers, underscore only

---

## 📝 License & Credits

Golden Striker is a fan-made project for educational purposes.
Team/player names are fictional and inspired by but not identical to real entities.
AI avatar generation powered by [Pollinations.ai](https://pollinations.ai) (free, no key required).
Sound engine built with Web Audio API — zero external dependencies.

---

*Version 17 | Built with PHP 8 + Vanilla JS + SQLite*
