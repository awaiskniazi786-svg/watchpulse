# WatchPulse - Independent Movie & TV Discovery Guide

WatchPulse (https://watchpulse.online) is an independent movie and TV discovery guide and editorial publication. It combines TV series data from TVmaze (CC BY-SA), open film details from Wikipedia (CC BY-SA) and Wikidata (CC0), official studio trailers played through YouTube's privacy-enhanced player (youtube-nocookie.com), 20 original long-form editorial guides and reviews, and a private watchlist stored only in your own browser.

WatchPulse is not a streaming provider. It does not host or stream video, and it does not provide per-country streaming availability feeds. Always confirm current playback inside your own streaming app.

## Live site

- Website: https://watchpulse.online
- Editorial guides: https://watchpulse.online/guides
- About: https://watchpulse.online/about
- Contact: https://watchpulse.online/contact

## Features

- Search TV series (TVmaze) and films (Wikipedia + Wikidata) from one search bar
- Cast, director, runtime, genre and official reference links
- Official YouTube trailers verified against studio and network channels
- 20 original editorial guides and reviews written by the author
- Private watchlist with "watched" status (browser localStorage, no account needed)
- Mobile-friendly layout

## Tech stack

- Vanilla HTML, CSS and JavaScript (no framework)
- Cloudflare Pages with a Pages Function (`/api/catalog`) that proxies TVmaze, Wikipedia, Wikidata and YouTube oEmbed requests
- Google Consent Mode v2 and Google's certified consent management platform for EEA/UK/CH visitors

## Data sources and attribution

- TVmaze API - TV series metadata (CC BY-SA)
- Wikipedia - film summaries (CC BY-SA)
- Wikidata - structured film data (CC0 Public Domain)
- YouTube - official trailers

All streaming service names, studio names and trademarks (including Netflix, Amazon Prime Video, Disney+, Apple TV+ and HBO Max) belong to their respective owners. WatchPulse is not affiliated with, endorsed by, or sponsored by any of them.

## Author

Built and edited by Awais K (Awais Khan Niazi), an independent web developer based in Pakistan.

- LinkedIn: https://www.linkedin.com/in/awais-khan-niazi
- Contact: awaiskniazi786@gmail.com