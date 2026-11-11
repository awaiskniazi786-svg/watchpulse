# ⚡ WatchPulse — Real-Time Movie Discovery & Streaming Guide

> Discover where to stream any movie legally across Netflix, Amazon Prime Video, Disney+, Apple TV+, and Max. Watch official 4K trailers, check IMDb ratings, and track your personal watchlist without subscription paywalls.

[![Live Demo](https://img.shields.io/badge/Live%20Website-watchpulse.online-00C7B7?style=for-the-badge&logo=googlechrome&logoColor=white)](https://watchpulse.online/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Powered by TMDB](https://img.shields.io/badge/API-TMDB%20v3-01b4e4?style=for-the-badge&logo=themoviedatabase&logoColor=white)](https://www.themoviedb.org/)

---

## 🌐 Official Live Platform
Visit the live web application:  
👉 **[https://watchpulse.online](https://watchpulse.online/)**

---

## ✨ Key Features

- **🍿 Streaming Service Filters:** 1-tap filtering for movies streaming on **Netflix**, **Amazon Prime Video**, **Disney+**, **Apple TV+**, and **Max (HBO)**.
- **🔟 Netflix-Style "Top 10" Rankings:** Prominent metallic rank badges (`#1` to `#10`) on the week's hottest releases with glowing flame badges.
- **🎙️ Smart Search Trio:**
  - **Voice Search:** Hands-free speech recognition via the Web Speech API.
  - **Live Autocomplete:** Instant drop-down search suggestions as you type.
  - **Trending Chips:** 1-tap quick searches for trending Hollywood blockbusters.
- **🎬 Official 4K YouTube Trailers:** High-performance trailer modal with zero ads and direct fallback links.
- **📱 Native Mobile Bottom Dock:** High-density 2-column mobile poster grid and gesture-friendly sheets optimized for smartphones.
- **🔖 Offline Watchlist:** Persistent local storage watchlist saved directly to your device.
- **🛡️ 100% Legal & Compliant:** Uses official public APIs from The Movie Database (TMDB) and embed-compliant YouTube players.

---

## 🛠️ Tech Stack

- **Frontend:** Semantic HTML5, CSS3 (Modern Flexbox & CSS Grid, Glassmorphism, CSS Custom Properties)
- **Scripting:** Modern Vanilla JavaScript (ES6+ async/await, Web Speech API, LocalStorage API)
- **Data Source:** [The Movie Database (TMDB) API v3](https://www.themoviedb.org/documentation/api)
- **Deployment:** [Netlify Global CDN](https://www.netlify.com/) with automatic HTTPS / SSL

---

## 🚀 Getting Started Locally

1. **Clone this repository:**
   ```bash
   git clone https://github.com/<your-username>/watchpulse.git
   cd watchpulse
   ```

2. **Open `index.html`:**
   Simply double-click `index.html` or serve via any static file server:
   ```bash
   # Using Python:
   python -m http.server 8000
   
   # Or using PowerShell:
   .\serve.ps1
   ```

3. Open your browser and navigate to `http://localhost:8000`.

---

## ⚖️ Legal & Attribution

- Movie metadata, posters, and cast descriptions are provided by **[The Movie Database (TMDB)](https://www.themoviedb.org/)**. This product uses the TMDB API but is not endorsed or certified by TMDB.
- Streaming platform trademarks (Netflix, Amazon Prime Video, Disney+, Apple TV+, Max) are the intellectual property of their respective owners and used strictly for editorial discovery under Fair Use.

---

## 👨‍💻 Creator & Maintainer

Designed and developed with passion by **Awais K** (Muhammad Awais).
- Email: [awaiskniazi786@gmail.com](mailto:awaiskniazi786@gmail.com)
- Live App: [WatchPulse](https://watchpulse.online/)

