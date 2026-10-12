// Company ↔ question evidence for DSA Journey. Generated 2026-09-29.
// Rules: every entry cites at least one SOURCE; the app must not claim a company asked a
// question beyond the entry's evidence level. `associated` entries come from community-compiled
// LeetCode company-tag lists (capped at 30 per company, six-month list first, then all-time,
// ordered by list frequency). `community` entries come from specific candidate posts.
// `verified` entries come from company-published material.
// Entries whose questionId is not in curriculum plannedQuestions carry title/difficulty/url/topic.

export const EVIDENCE_LEVELS = {
  verified: { label: 'Verified', description: 'Published by the company itself (official interview-prep material, engineering blog).' },
  community: { label: 'Community-reported', description: 'Reported by candidates in a specific, linkable interview-experience post.' },
  associated: { label: 'Commonly associated', description: 'Listed for this company in community-compiled lists (e.g. derived from LeetCode company tags). Frequency and recency not guaranteed.' },
};

export const COMPANIES = [
  {
    "id": "google",
    "name": "Google"
  },
  {
    "id": "amazon",
    "name": "Amazon"
  },
  {
    "id": "microsoft",
    "name": "Microsoft"
  },
  {
    "id": "meta",
    "name": "Meta"
  },
  {
    "id": "apple",
    "name": "Apple"
  },
  {
    "id": "netflix",
    "name": "Netflix"
  },
  {
    "id": "uber",
    "name": "Uber"
  },
  {
    "id": "adobe",
    "name": "Adobe"
  },
  {
    "id": "atlassian",
    "name": "Atlassian"
  },
  {
    "id": "goldman-sachs",
    "name": "Goldman Sachs"
  },
  {
    "id": "bloomberg",
    "name": "Bloomberg"
  },
  {
    "id": "linkedin",
    "name": "LinkedIn"
  }
];

export const SOURCES = {
  "liquidslr-google-6m": {
    "label": "LeetCode company-tag list: Google (six months)",
    "url": "https://raw.githubusercontent.com/liquidslr/leetcode-company-wise-problems/main/Google/3.%20Six%20Months.csv",
    "evidence": "associated",
    "accessed": "2026-09-29",
    "description": "File from the GitHub repository liquidslr/leetcode-company-wise-problems (https://github.com/liquidslr/leetcode-company-wise-problems). Per the repo description, every CSV corresponds to a list of LeetCode questions for a company based on LeetCode company tags (README: 'updated as of 1 June 2025'; repo description: 'Updated as of 20 June, 2025'). Columns: Difficulty, Title, Frequency, Acceptance Rate, Link, Topics. Frequency is LeetCode's relative tag frequency, not a count of interviews. This is the \"Six Months\" file (questions tagged in roughly the last six months as of the snapshot)."
  },
  "liquidslr-google-all": {
    "label": "LeetCode company-tag list: Google (all time)",
    "url": "https://raw.githubusercontent.com/liquidslr/leetcode-company-wise-problems/main/Google/5.%20All.csv",
    "evidence": "associated",
    "accessed": "2026-09-29",
    "description": "File from the GitHub repository liquidslr/leetcode-company-wise-problems (https://github.com/liquidslr/leetcode-company-wise-problems). Per the repo description, every CSV corresponds to a list of LeetCode questions for a company based on LeetCode company tags (README: 'updated as of 1 June 2025'; repo description: 'Updated as of 20 June, 2025'). Columns: Difficulty, Title, Frequency, Acceptance Rate, Link, Topics. Frequency is LeetCode's relative tag frequency, not a count of interviews. This is the \"All\" file (all-time tagged questions)."
  },
  "liquidslr-amazon-6m": {
    "label": "LeetCode company-tag list: Amazon (six months)",
    "url": "https://raw.githubusercontent.com/liquidslr/leetcode-company-wise-problems/main/Amazon/3.%20Six%20Months.csv",
    "evidence": "associated",
    "accessed": "2026-09-29",
    "description": "File from the GitHub repository liquidslr/leetcode-company-wise-problems (https://github.com/liquidslr/leetcode-company-wise-problems). Per the repo description, every CSV corresponds to a list of LeetCode questions for a company based on LeetCode company tags (README: 'updated as of 1 June 2025'; repo description: 'Updated as of 20 June, 2025'). Columns: Difficulty, Title, Frequency, Acceptance Rate, Link, Topics. Frequency is LeetCode's relative tag frequency, not a count of interviews. This is the \"Six Months\" file (questions tagged in roughly the last six months as of the snapshot)."
  },
  "liquidslr-amazon-all": {
    "label": "LeetCode company-tag list: Amazon (all time)",
    "url": "https://raw.githubusercontent.com/liquidslr/leetcode-company-wise-problems/main/Amazon/5.%20All.csv",
    "evidence": "associated",
    "accessed": "2026-09-29",
    "description": "File from the GitHub repository liquidslr/leetcode-company-wise-problems (https://github.com/liquidslr/leetcode-company-wise-problems). Per the repo description, every CSV corresponds to a list of LeetCode questions for a company based on LeetCode company tags (README: 'updated as of 1 June 2025'; repo description: 'Updated as of 20 June, 2025'). Columns: Difficulty, Title, Frequency, Acceptance Rate, Link, Topics. Frequency is LeetCode's relative tag frequency, not a count of interviews. This is the \"All\" file (all-time tagged questions)."
  },
  "liquidslr-microsoft-6m": {
    "label": "LeetCode company-tag list: Microsoft (six months)",
    "url": "https://raw.githubusercontent.com/liquidslr/leetcode-company-wise-problems/main/Microsoft/3.%20Six%20Months.csv",
    "evidence": "associated",
    "accessed": "2026-09-29",
    "description": "File from the GitHub repository liquidslr/leetcode-company-wise-problems (https://github.com/liquidslr/leetcode-company-wise-problems). Per the repo description, every CSV corresponds to a list of LeetCode questions for a company based on LeetCode company tags (README: 'updated as of 1 June 2025'; repo description: 'Updated as of 20 June, 2025'). Columns: Difficulty, Title, Frequency, Acceptance Rate, Link, Topics. Frequency is LeetCode's relative tag frequency, not a count of interviews. This is the \"Six Months\" file (questions tagged in roughly the last six months as of the snapshot)."
  },
  "liquidslr-microsoft-all": {
    "label": "LeetCode company-tag list: Microsoft (all time)",
    "url": "https://raw.githubusercontent.com/liquidslr/leetcode-company-wise-problems/main/Microsoft/5.%20All.csv",
    "evidence": "associated",
    "accessed": "2026-09-29",
    "description": "File from the GitHub repository liquidslr/leetcode-company-wise-problems (https://github.com/liquidslr/leetcode-company-wise-problems). Per the repo description, every CSV corresponds to a list of LeetCode questions for a company based on LeetCode company tags (README: 'updated as of 1 June 2025'; repo description: 'Updated as of 20 June, 2025'). Columns: Difficulty, Title, Frequency, Acceptance Rate, Link, Topics. Frequency is LeetCode's relative tag frequency, not a count of interviews. This is the \"All\" file (all-time tagged questions)."
  },
  "liquidslr-meta-6m": {
    "label": "LeetCode company-tag list: Meta (six months)",
    "url": "https://raw.githubusercontent.com/liquidslr/leetcode-company-wise-problems/main/Meta/3.%20Six%20Months.csv",
    "evidence": "associated",
    "accessed": "2026-09-29",
    "description": "File from the GitHub repository liquidslr/leetcode-company-wise-problems (https://github.com/liquidslr/leetcode-company-wise-problems). Per the repo description, every CSV corresponds to a list of LeetCode questions for a company based on LeetCode company tags (README: 'updated as of 1 June 2025'; repo description: 'Updated as of 20 June, 2025'). Columns: Difficulty, Title, Frequency, Acceptance Rate, Link, Topics. Frequency is LeetCode's relative tag frequency, not a count of interviews. This is the \"Six Months\" file (questions tagged in roughly the last six months as of the snapshot)."
  },
  "liquidslr-meta-all": {
    "label": "LeetCode company-tag list: Meta (all time)",
    "url": "https://raw.githubusercontent.com/liquidslr/leetcode-company-wise-problems/main/Meta/5.%20All.csv",
    "evidence": "associated",
    "accessed": "2026-09-29",
    "description": "File from the GitHub repository liquidslr/leetcode-company-wise-problems (https://github.com/liquidslr/leetcode-company-wise-problems). Per the repo description, every CSV corresponds to a list of LeetCode questions for a company based on LeetCode company tags (README: 'updated as of 1 June 2025'; repo description: 'Updated as of 20 June, 2025'). Columns: Difficulty, Title, Frequency, Acceptance Rate, Link, Topics. Frequency is LeetCode's relative tag frequency, not a count of interviews. This is the \"All\" file (all-time tagged questions)."
  },
  "liquidslr-apple-6m": {
    "label": "LeetCode company-tag list: Apple (six months)",
    "url": "https://raw.githubusercontent.com/liquidslr/leetcode-company-wise-problems/main/Apple/3.%20Six%20Months.csv",
    "evidence": "associated",
    "accessed": "2026-09-29",
    "description": "File from the GitHub repository liquidslr/leetcode-company-wise-problems (https://github.com/liquidslr/leetcode-company-wise-problems). Per the repo description, every CSV corresponds to a list of LeetCode questions for a company based on LeetCode company tags (README: 'updated as of 1 June 2025'; repo description: 'Updated as of 20 June, 2025'). Columns: Difficulty, Title, Frequency, Acceptance Rate, Link, Topics. Frequency is LeetCode's relative tag frequency, not a count of interviews. This is the \"Six Months\" file (questions tagged in roughly the last six months as of the snapshot)."
  },
  "liquidslr-apple-all": {
    "label": "LeetCode company-tag list: Apple (all time)",
    "url": "https://raw.githubusercontent.com/liquidslr/leetcode-company-wise-problems/main/Apple/5.%20All.csv",
    "evidence": "associated",
    "accessed": "2026-09-29",
    "description": "File from the GitHub repository liquidslr/leetcode-company-wise-problems (https://github.com/liquidslr/leetcode-company-wise-problems). Per the repo description, every CSV corresponds to a list of LeetCode questions for a company based on LeetCode company tags (README: 'updated as of 1 June 2025'; repo description: 'Updated as of 20 June, 2025'). Columns: Difficulty, Title, Frequency, Acceptance Rate, Link, Topics. Frequency is LeetCode's relative tag frequency, not a count of interviews. This is the \"All\" file (all-time tagged questions)."
  },
  "liquidslr-netflix-6m": {
    "label": "LeetCode company-tag list: Netflix (six months)",
    "url": "https://raw.githubusercontent.com/liquidslr/leetcode-company-wise-problems/main/Netflix/3.%20Six%20Months.csv",
    "evidence": "associated",
    "accessed": "2026-09-29",
    "description": "File from the GitHub repository liquidslr/leetcode-company-wise-problems (https://github.com/liquidslr/leetcode-company-wise-problems). Per the repo description, every CSV corresponds to a list of LeetCode questions for a company based on LeetCode company tags (README: 'updated as of 1 June 2025'; repo description: 'Updated as of 20 June, 2025'). Columns: Difficulty, Title, Frequency, Acceptance Rate, Link, Topics. Frequency is LeetCode's relative tag frequency, not a count of interviews. This is the \"Six Months\" file (questions tagged in roughly the last six months as of the snapshot)."
  },
  "liquidslr-netflix-all": {
    "label": "LeetCode company-tag list: Netflix (all time)",
    "url": "https://raw.githubusercontent.com/liquidslr/leetcode-company-wise-problems/main/Netflix/5.%20All.csv",
    "evidence": "associated",
    "accessed": "2026-09-29",
    "description": "File from the GitHub repository liquidslr/leetcode-company-wise-problems (https://github.com/liquidslr/leetcode-company-wise-problems). Per the repo description, every CSV corresponds to a list of LeetCode questions for a company based on LeetCode company tags (README: 'updated as of 1 June 2025'; repo description: 'Updated as of 20 June, 2025'). Columns: Difficulty, Title, Frequency, Acceptance Rate, Link, Topics. Frequency is LeetCode's relative tag frequency, not a count of interviews. This is the \"All\" file (all-time tagged questions)."
  },
  "liquidslr-uber-6m": {
    "label": "LeetCode company-tag list: Uber (six months)",
    "url": "https://raw.githubusercontent.com/liquidslr/leetcode-company-wise-problems/main/Uber/3.%20Six%20Months.csv",
    "evidence": "associated",
    "accessed": "2026-09-29",
    "description": "File from the GitHub repository liquidslr/leetcode-company-wise-problems (https://github.com/liquidslr/leetcode-company-wise-problems). Per the repo description, every CSV corresponds to a list of LeetCode questions for a company based on LeetCode company tags (README: 'updated as of 1 June 2025'; repo description: 'Updated as of 20 June, 2025'). Columns: Difficulty, Title, Frequency, Acceptance Rate, Link, Topics. Frequency is LeetCode's relative tag frequency, not a count of interviews. This is the \"Six Months\" file (questions tagged in roughly the last six months as of the snapshot)."
  },
  "liquidslr-uber-all": {
    "label": "LeetCode company-tag list: Uber (all time)",
    "url": "https://raw.githubusercontent.com/liquidslr/leetcode-company-wise-problems/main/Uber/5.%20All.csv",
    "evidence": "associated",
    "accessed": "2026-09-29",
    "description": "File from the GitHub repository liquidslr/leetcode-company-wise-problems (https://github.com/liquidslr/leetcode-company-wise-problems). Per the repo description, every CSV corresponds to a list of LeetCode questions for a company based on LeetCode company tags (README: 'updated as of 1 June 2025'; repo description: 'Updated as of 20 June, 2025'). Columns: Difficulty, Title, Frequency, Acceptance Rate, Link, Topics. Frequency is LeetCode's relative tag frequency, not a count of interviews. This is the \"All\" file (all-time tagged questions)."
  },
  "liquidslr-adobe-6m": {
    "label": "LeetCode company-tag list: Adobe (six months)",
    "url": "https://raw.githubusercontent.com/liquidslr/leetcode-company-wise-problems/main/Adobe/3.%20Six%20Months.csv",
    "evidence": "associated",
    "accessed": "2026-09-29",
    "description": "File from the GitHub repository liquidslr/leetcode-company-wise-problems (https://github.com/liquidslr/leetcode-company-wise-problems). Per the repo description, every CSV corresponds to a list of LeetCode questions for a company based on LeetCode company tags (README: 'updated as of 1 June 2025'; repo description: 'Updated as of 20 June, 2025'). Columns: Difficulty, Title, Frequency, Acceptance Rate, Link, Topics. Frequency is LeetCode's relative tag frequency, not a count of interviews. This is the \"Six Months\" file (questions tagged in roughly the last six months as of the snapshot)."
  },
  "liquidslr-adobe-all": {
    "label": "LeetCode company-tag list: Adobe (all time)",
    "url": "https://raw.githubusercontent.com/liquidslr/leetcode-company-wise-problems/main/Adobe/5.%20All.csv",
    "evidence": "associated",
    "accessed": "2026-09-29",
    "description": "File from the GitHub repository liquidslr/leetcode-company-wise-problems (https://github.com/liquidslr/leetcode-company-wise-problems). Per the repo description, every CSV corresponds to a list of LeetCode questions for a company based on LeetCode company tags (README: 'updated as of 1 June 2025'; repo description: 'Updated as of 20 June, 2025'). Columns: Difficulty, Title, Frequency, Acceptance Rate, Link, Topics. Frequency is LeetCode's relative tag frequency, not a count of interviews. This is the \"All\" file (all-time tagged questions)."
  },
  "liquidslr-atlassian-6m": {
    "label": "LeetCode company-tag list: Atlassian (six months)",
    "url": "https://raw.githubusercontent.com/liquidslr/leetcode-company-wise-problems/main/Atlassian/3.%20Six%20Months.csv",
    "evidence": "associated",
    "accessed": "2026-09-29",
    "description": "File from the GitHub repository liquidslr/leetcode-company-wise-problems (https://github.com/liquidslr/leetcode-company-wise-problems). Per the repo description, every CSV corresponds to a list of LeetCode questions for a company based on LeetCode company tags (README: 'updated as of 1 June 2025'; repo description: 'Updated as of 20 June, 2025'). Columns: Difficulty, Title, Frequency, Acceptance Rate, Link, Topics. Frequency is LeetCode's relative tag frequency, not a count of interviews. This is the \"Six Months\" file (questions tagged in roughly the last six months as of the snapshot)."
  },
  "liquidslr-atlassian-all": {
    "label": "LeetCode company-tag list: Atlassian (all time)",
    "url": "https://raw.githubusercontent.com/liquidslr/leetcode-company-wise-problems/main/Atlassian/5.%20All.csv",
    "evidence": "associated",
    "accessed": "2026-09-29",
    "description": "File from the GitHub repository liquidslr/leetcode-company-wise-problems (https://github.com/liquidslr/leetcode-company-wise-problems). Per the repo description, every CSV corresponds to a list of LeetCode questions for a company based on LeetCode company tags (README: 'updated as of 1 June 2025'; repo description: 'Updated as of 20 June, 2025'). Columns: Difficulty, Title, Frequency, Acceptance Rate, Link, Topics. Frequency is LeetCode's relative tag frequency, not a count of interviews. This is the \"All\" file (all-time tagged questions)."
  },
  "liquidslr-goldman-sachs-6m": {
    "label": "LeetCode company-tag list: Goldman Sachs (six months)",
    "url": "https://raw.githubusercontent.com/liquidslr/leetcode-company-wise-problems/main/Goldman%20Sachs/3.%20Six%20Months.csv",
    "evidence": "associated",
    "accessed": "2026-09-29",
    "description": "File from the GitHub repository liquidslr/leetcode-company-wise-problems (https://github.com/liquidslr/leetcode-company-wise-problems). Per the repo description, every CSV corresponds to a list of LeetCode questions for a company based on LeetCode company tags (README: 'updated as of 1 June 2025'; repo description: 'Updated as of 20 June, 2025'). Columns: Difficulty, Title, Frequency, Acceptance Rate, Link, Topics. Frequency is LeetCode's relative tag frequency, not a count of interviews. This is the \"Six Months\" file (questions tagged in roughly the last six months as of the snapshot)."
  },
  "liquidslr-goldman-sachs-all": {
    "label": "LeetCode company-tag list: Goldman Sachs (all time)",
    "url": "https://raw.githubusercontent.com/liquidslr/leetcode-company-wise-problems/main/Goldman%20Sachs/5.%20All.csv",
    "evidence": "associated",
    "accessed": "2026-09-29",
    "description": "File from the GitHub repository liquidslr/leetcode-company-wise-problems (https://github.com/liquidslr/leetcode-company-wise-problems). Per the repo description, every CSV corresponds to a list of LeetCode questions for a company based on LeetCode company tags (README: 'updated as of 1 June 2025'; repo description: 'Updated as of 20 June, 2025'). Columns: Difficulty, Title, Frequency, Acceptance Rate, Link, Topics. Frequency is LeetCode's relative tag frequency, not a count of interviews. This is the \"All\" file (all-time tagged questions)."
  },
  "liquidslr-bloomberg-6m": {
    "label": "LeetCode company-tag list: Bloomberg (six months)",
    "url": "https://raw.githubusercontent.com/liquidslr/leetcode-company-wise-problems/main/Bloomberg/3.%20Six%20Months.csv",
    "evidence": "associated",
    "accessed": "2026-09-29",
    "description": "File from the GitHub repository liquidslr/leetcode-company-wise-problems (https://github.com/liquidslr/leetcode-company-wise-problems). Per the repo description, every CSV corresponds to a list of LeetCode questions for a company based on LeetCode company tags (README: 'updated as of 1 June 2025'; repo description: 'Updated as of 20 June, 2025'). Columns: Difficulty, Title, Frequency, Acceptance Rate, Link, Topics. Frequency is LeetCode's relative tag frequency, not a count of interviews. This is the \"Six Months\" file (questions tagged in roughly the last six months as of the snapshot)."
  },
  "liquidslr-bloomberg-all": {
    "label": "LeetCode company-tag list: Bloomberg (all time)",
    "url": "https://raw.githubusercontent.com/liquidslr/leetcode-company-wise-problems/main/Bloomberg/5.%20All.csv",
    "evidence": "associated",
    "accessed": "2026-09-29",
    "description": "File from the GitHub repository liquidslr/leetcode-company-wise-problems (https://github.com/liquidslr/leetcode-company-wise-problems). Per the repo description, every CSV corresponds to a list of LeetCode questions for a company based on LeetCode company tags (README: 'updated as of 1 June 2025'; repo description: 'Updated as of 20 June, 2025'). Columns: Difficulty, Title, Frequency, Acceptance Rate, Link, Topics. Frequency is LeetCode's relative tag frequency, not a count of interviews. This is the \"All\" file (all-time tagged questions)."
  },
  "liquidslr-linkedin-6m": {
    "label": "LeetCode company-tag list: LinkedIn (six months)",
    "url": "https://raw.githubusercontent.com/liquidslr/leetcode-company-wise-problems/main/LinkedIn/3.%20Six%20Months.csv",
    "evidence": "associated",
    "accessed": "2026-09-29",
    "description": "File from the GitHub repository liquidslr/leetcode-company-wise-problems (https://github.com/liquidslr/leetcode-company-wise-problems). Per the repo description, every CSV corresponds to a list of LeetCode questions for a company based on LeetCode company tags (README: 'updated as of 1 June 2025'; repo description: 'Updated as of 20 June, 2025'). Columns: Difficulty, Title, Frequency, Acceptance Rate, Link, Topics. Frequency is LeetCode's relative tag frequency, not a count of interviews. This is the \"Six Months\" file (questions tagged in roughly the last six months as of the snapshot)."
  },
  "liquidslr-linkedin-all": {
    "label": "LeetCode company-tag list: LinkedIn (all time)",
    "url": "https://raw.githubusercontent.com/liquidslr/leetcode-company-wise-problems/main/LinkedIn/5.%20All.csv",
    "evidence": "associated",
    "accessed": "2026-09-29",
    "description": "File from the GitHub repository liquidslr/leetcode-company-wise-problems (https://github.com/liquidslr/leetcode-company-wise-problems). Per the repo description, every CSV corresponds to a list of LeetCode questions for a company based on LeetCode company tags (README: 'updated as of 1 June 2025'; repo description: 'Updated as of 20 June, 2025'). Columns: Difficulty, Title, Frequency, Acceptance Rate, Link, Topics. Frequency is LeetCode's relative tag frequency, not a count of interviews. This is the \"All\" file (all-time tagged questions)."
  },
  "google-tdg-volume-of-lakes": {
    "label": "Google Tech Dev Guide: \"Former interview question: volume of lakes\"",
    "url": "https://web.archive.org/web/20221209223021/https://techdevguide.withgoogle.com/resources/former-interview-question-volume-of-lakes/",
    "evidence": "verified",
    "accessed": "2026-09-29",
    "description": "Page published by Google on its Tech Dev Guide, titled \"Former interview question: volume of lakes\". The original URL (https://techdevguide.withgoogle.com/resources/former-interview-question-volume-of-lakes/) now redirects to Google Careers \"Build your future\" resources, so the Internet Archive snapshot is linked."
  },
  "google-tdg-compression-and-decompression": {
    "label": "Google Tech Dev Guide: \"Former interview question: compression and decompression\"",
    "url": "https://web.archive.org/web/20221209223021/https://techdevguide.withgoogle.com/resources/former-interview-question-compression-and-decompression/",
    "evidence": "verified",
    "accessed": "2026-09-29",
    "description": "Page published by Google on its Tech Dev Guide, titled \"Former interview question: compression and decompression\". The original URL (https://techdevguide.withgoogle.com/resources/former-interview-question-compression-and-decompression/) now redirects to Google Careers \"Build your future\" resources, so the Internet Archive snapshot is linked."
  },
  "google-tdg-find-longest-word": {
    "label": "Google Tech Dev Guide: \"Former interview question: find longest word\"",
    "url": "https://web.archive.org/web/20221209223021/https://techdevguide.withgoogle.com/resources/former-interview-question-find-longest-word/",
    "evidence": "verified",
    "accessed": "2026-09-29",
    "description": "Page published by Google on its Tech Dev Guide, titled \"Former interview question: find longest word\". The original URL (https://techdevguide.withgoogle.com/resources/former-interview-question-find-longest-word/) now redirects to Google Careers \"Build your future\" resources, so the Internet Archive snapshot is linked."
  },
  "google-tdg-word-squares": {
    "label": "Google Tech Dev Guide: \"Former interview question: word squares\"",
    "url": "https://web.archive.org/web/20221209223021/https://techdevguide.withgoogle.com/resources/former-interview-question-word-squares/",
    "evidence": "verified",
    "accessed": "2026-09-29",
    "description": "Page published by Google on its Tech Dev Guide, titled \"Former interview question: word squares\". The original URL (https://techdevguide.withgoogle.com/resources/former-interview-question-word-squares/) now redirects to Google Careers \"Build your future\" resources, so the Internet Archive snapshot is linked."
  },
  "google-tdg-minesweeper": {
    "label": "Google Tech Dev Guide: \"Former interview question: minesweeper\"",
    "url": "https://web.archive.org/web/20230324001952/https://techdevguide.withgoogle.com/resources/former-interview-question-minesweeper/",
    "evidence": "verified",
    "accessed": "2026-09-29",
    "description": "Page published by Google on its Tech Dev Guide, titled \"Former interview question: minesweeper\". The original URL (https://techdevguide.withgoogle.com/resources/former-interview-question-minesweeper/) now redirects to Google Careers \"Build your future\" resources, so the Internet Archive snapshot is linked."
  },
  "google-tdg-flatten-iterators": {
    "label": "Google Tech Dev Guide: \"Former interview question: flatten iterators\"",
    "url": "https://web.archive.org/web/20221108083129/https://techdevguide.withgoogle.com/resources/former-interview-question-flatten-iterators/",
    "evidence": "verified",
    "accessed": "2026-09-29",
    "description": "Page published by Google on its Tech Dev Guide, titled \"Former interview question: flatten iterators\". The original URL (https://techdevguide.withgoogle.com/resources/former-interview-question-flatten-iterators/) now redirects to Google Careers \"Build your future\" resources, so the Internet Archive snapshot is linked."
  },
  "lc-discuss-1789833": {
    "label": "LeetCode Discuss: \"Amazon | New Grad 2022 | SDE 1 | Round 3\"",
    "url": "https://leetcode.com/discuss/post/1789833/amazon-new-grad-2022-sde-1-round-3/",
    "evidence": "community",
    "accessed": "2026-09-29",
    "description": "Candidate-written interview-experience post on LeetCode Discuss (posted 2022). Self-reported and unverified; content read via LeetCode's public discuss API."
  },
  "lc-discuss-302349": {
    "label": "LeetCode Discuss: \"Amazon | SDE | Unknown | May 2019 [Reject]\"",
    "url": "https://leetcode.com/discuss/post/302349/amazon-sde-experience/",
    "evidence": "community",
    "accessed": "2026-09-29",
    "description": "Candidate-written interview-experience post on LeetCode Discuss (posted 2019). Self-reported and unverified; content read via LeetCode's public discuss API."
  },
  "lc-discuss-5949964": {
    "label": "LeetCode Discuss: \"Meta E4 Phone Screen US\"",
    "url": "https://leetcode.com/discuss/interview-question/5949964/",
    "evidence": "community",
    "accessed": "2026-09-29",
    "description": "Candidate-written interview-experience post on LeetCode Discuss (posted 2024). Self-reported and unverified; content read via LeetCode's public discuss API."
  },
  "lc-discuss-5893260": {
    "label": "LeetCode Discuss: \"Meta L4 Screening Interview - Merge Intervals given a target\"",
    "url": "https://leetcode.com/discuss/interview-question/5893260",
    "evidence": "community",
    "accessed": "2026-09-29",
    "description": "Candidate-written interview-experience post on LeetCode Discuss (posted 2024). Self-reported and unverified; content read via LeetCode's public discuss API."
  },
  "lc-discuss-4266103": {
    "label": "LeetCode Discuss: \"Meta | E4 | Onsite Interview\"",
    "url": "https://leetcode.com/discuss/post/4266103/Meta-or-E4-or-Onsite-Interview/",
    "evidence": "community",
    "accessed": "2026-09-29",
    "description": "Candidate-written interview-experience post on LeetCode Discuss (posted 2023). Self-reported and unverified; content read via LeetCode's public discuss API."
  },
  "lc-discuss-6379540": {
    "label": "LeetCode Discuss: \"META | Software Engineer (Product) E4 | Full Interview Experience | US\"",
    "url": "https://leetcode.com/discuss/post/6379540/",
    "evidence": "community",
    "accessed": "2026-09-29",
    "description": "Candidate-written interview-experience post on LeetCode Discuss (posted 2025). Self-reported and unverified; content read via LeetCode's public discuss API."
  },
  "lc-discuss-5199331": {
    "label": "LeetCode Discuss: \"Goldman Sachs | Coderpad | Trapping Rain water | Winner of circular game\"",
    "url": "https://leetcode.com/discuss/interview-question/5199331/Goldman-Sachs-or-Coderpad-or-Trapping-Rain-water-or-Winner-of-circular-game/",
    "evidence": "community",
    "accessed": "2026-09-29",
    "description": "Candidate-written interview-experience post on LeetCode Discuss (posted 2024). Self-reported and unverified; content read via LeetCode's public discuss API."
  },
  "lc-discuss-861334": {
    "label": "LeetCode Discuss: \"Goldman Sachs | Phone | Trapping rain water & Highest average score\"",
    "url": "https://leetcode.com/discuss/interview-question/861334/goldman-sachs-phone-trapping-rain-water-highest-average-score",
    "evidence": "community",
    "accessed": "2026-09-29",
    "description": "Candidate-written interview-experience post on LeetCode Discuss (posted 2020). Self-reported and unverified; content read via LeetCode's public discuss API."
  },
  "lc-discuss-413065": {
    "label": "LeetCode Discuss: \"Goldman Sachs | Cycle In Array & Trapping Rain Water\"",
    "url": "https://leetcode.com/discuss/interview-question/413065/goldman-sachs-cycle-in-array-trapping-rain-water",
    "evidence": "community",
    "accessed": "2026-09-29",
    "description": "Candidate-written interview-experience post on LeetCode Discuss (posted 2019). Self-reported and unverified; content read via LeetCode's public discuss API."
  },
  "lc-discuss-1789554": {
    "label": "LeetCode Discuss: \"Bloomberg New-grad Interview 2022\"",
    "url": "https://leetcode.com/discuss/interview-question/1789554/bloomberg-new-grad-interview-2022/",
    "evidence": "community",
    "accessed": "2026-09-29",
    "description": "Candidate-written interview-experience post on LeetCode Discuss (posted 2022). Self-reported and unverified; content read via LeetCode's public discuss API."
  },
  "lc-discuss-833176": {
    "label": "LeetCode Discuss: \"bloomberg onsite / phone interview question [Offer]\"",
    "url": "https://leetcode.com/discuss/interview-question/833176/bloomberg-onsite-phone-interview-question-offer",
    "evidence": "community",
    "accessed": "2026-09-29",
    "description": "Candidate-written interview-experience post on LeetCode Discuss (posted 2020). Self-reported and unverified; content read via LeetCode's public discuss API."
  },
  "lc-discuss-3281930": {
    "label": "LeetCode Discuss: \"Uber Onsite Interview Experience\"",
    "url": "https://leetcode.com/discuss/interview-experience/3281930/Uber-Onsite-Interview-Experience/",
    "evidence": "community",
    "accessed": "2026-09-29",
    "description": "Candidate-written interview-experience post on LeetCode Discuss (posted 2023). Self-reported and unverified; content read via LeetCode's public discuss API."
  },
  "lc-discuss-1294643": {
    "label": "LeetCode Discuss: \"LinkedIn Onsite\"",
    "url": "https://leetcode.com/discuss/interview-experience/1294643/linkedin-onsite",
    "evidence": "community",
    "accessed": "2026-09-29",
    "description": "Candidate-written interview-experience post on LeetCode Discuss (posted 2021). Self-reported and unverified; content read via LeetCode's public discuss API."
  },
  "lc-discuss-1627771": {
    "label": "LeetCode Discuss: \"Apple | Software Engineer (ICT3) | San Diego | December 2021 | Offer\"",
    "url": "https://leetcode.com/discuss/interview-experience/1627771/apple-software-engineer-ict3-san-diego-december-2021-offer/",
    "evidence": "community",
    "accessed": "2026-09-29",
    "description": "Candidate-written interview-experience post on LeetCode Discuss (posted 2021). Self-reported and unverified; content read via LeetCode's public discuss API."
  },
  "lc-discuss-1838547": {
    "label": "LeetCode Discuss: \"Adobe | MTS-2 | Noida | Jan 2022 [Offer]\"",
    "url": "https://leetcode.com/discuss/interview-experience/1838547/adobe-mts-2-noida-jan-2022-offer/",
    "evidence": "community",
    "accessed": "2026-09-29",
    "description": "Candidate-written interview-experience post on LeetCode Discuss (posted 2022). Self-reported and unverified; content read via LeetCode's public discuss API."
  },
  "lc-discuss-5616563": {
    "label": "LeetCode Discuss: \"Adobe MTS 2 interview experience\"",
    "url": "https://leetcode.com/discuss/interview-experience/5616563/Adobe-MTS-2-interview-experience/",
    "evidence": "community",
    "accessed": "2026-09-29",
    "description": "Candidate-written interview-experience post on LeetCode Discuss (posted 2024). Self-reported and unverified; content read via LeetCode's public discuss API."
  },
  "lc-discuss-4625890": {
    "label": "LeetCode Discuss: \"Microsoft Interview Experience for SDE\"",
    "url": "https://leetcode.com/discuss/post/4625890/Microsoft-Interview-Experience-for-SDE/",
    "evidence": "community",
    "accessed": "2026-09-29",
    "description": "Candidate-written interview-experience post on LeetCode Discuss (posted 2024). Self-reported and unverified; content read via LeetCode's public discuss API."
  },
  "lc-discuss-4937133": {
    "label": "LeetCode Discuss: \"Microsoft SDE2 L61 interview experience\"",
    "url": "https://leetcode.com/discuss/interview-experience/4937133/Microsoft-SDE2-L61-interview-experience/",
    "evidence": "community",
    "accessed": "2026-09-29",
    "description": "Candidate-written interview-experience post on LeetCode Discuss (posted 2024). Self-reported and unverified; content read via LeetCode's public discuss API."
  },
  "lc-discuss-124626": {
    "label": "LeetCode Discuss: \"Google | Onsite interview questions\"",
    "url": "https://leetcode.com/discuss/interview-experience/124626/Google-onsite-interview-questions/",
    "evidence": "community",
    "accessed": "2026-09-29",
    "description": "Candidate-written interview-experience post on LeetCode Discuss (posted 2017). Self-reported and unverified; content read via LeetCode's public discuss API."
  },
  "lc-discuss-4987607": {
    "label": "LeetCode Discuss: \"Google Onsite | L5\"",
    "url": "https://leetcode.com/discuss/interview-experience/4987607/Google-Onsite-or-L5/",
    "evidence": "community",
    "accessed": "2026-09-29",
    "description": "Candidate-written interview-experience post on LeetCode Discuss (posted 2024). Self-reported and unverified; content read via LeetCode's public discuss API."
  },
  "glassdoor-gs-5462610": {
    "label": "Glassdoor: Goldman Sachs interview question (QTN_5462610)",
    "url": "https://www.glassdoor.co.in/Interview/Interview-First-online-coding-interview-They-asked-me-to-hard-leetcode-problem-Median-of-Two-Sorted-Arrays-I-solve-th-QTN_5462610.htm",
    "evidence": "community",
    "accessed": "2026-09-29",
    "description": "Candidate-submitted Glassdoor interview review for Goldman Sachs. The page itself returned HTTP 403 to our fetcher; the quoted review text (naming Median of Two Sorted Arrays, String to Integer (atoi) and High Five) was read from the page title shown in search results."
  }
};

export const COMPANY_QUESTIONS = [
  {
    "company": "google",
    "questionId": "two-sum",
    "evidence": "associated",
    "sources": [
      "liquidslr-google-6m",
      "liquidslr-google-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "google",
    "questionId": "add-two-numbers",
    "evidence": "associated",
    "sources": [
      "liquidslr-google-6m",
      "liquidslr-google-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "google",
    "questionId": "3sum",
    "evidence": "associated",
    "sources": [
      "liquidslr-google-6m",
      "liquidslr-google-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "google",
    "questionId": "trapping-rain-water",
    "evidence": "associated",
    "sources": [
      "liquidslr-google-6m",
      "liquidslr-google-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "google",
    "questionId": "median-of-two-sorted-arrays",
    "evidence": "associated",
    "sources": [
      "liquidslr-google-6m",
      "liquidslr-google-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "google",
    "questionId": "longest-substring-without-repeating-characters",
    "evidence": "associated",
    "sources": [
      "liquidslr-google-6m",
      "liquidslr-google-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "google",
    "questionId": "best-time-to-buy-and-sell-stock",
    "evidence": "associated",
    "sources": [
      "liquidslr-google-6m",
      "liquidslr-google-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "google",
    "questionId": "longest-common-prefix",
    "evidence": "associated",
    "sources": [
      "liquidslr-google-6m",
      "liquidslr-google-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "google",
    "questionId": "longest-consecutive-sequence",
    "evidence": "associated",
    "sources": [
      "liquidslr-google-6m",
      "liquidslr-google-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "google",
    "questionId": "longest-palindromic-substring",
    "evidence": "associated",
    "sources": [
      "liquidslr-google-6m",
      "liquidslr-google-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "google",
    "questionId": "container-with-most-water",
    "evidence": "associated",
    "sources": [
      "liquidslr-google-6m",
      "liquidslr-google-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "google",
    "questionId": "majority-element",
    "evidence": "associated",
    "sources": [
      "liquidslr-google-6m",
      "liquidslr-google-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "google",
    "questionId": "remove-duplicates-from-sorted-array",
    "evidence": "associated",
    "sources": [
      "liquidslr-google-6m",
      "liquidslr-google-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "google",
    "questionId": "valid-parentheses",
    "evidence": "associated",
    "sources": [
      "liquidslr-google-6m",
      "liquidslr-google-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "google",
    "questionId": "merge-sorted-array",
    "evidence": "associated",
    "sources": [
      "liquidslr-google-6m",
      "liquidslr-google-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "google",
    "questionId": "subarray-sum-equals-k",
    "evidence": "associated",
    "sources": [
      "liquidslr-google-6m",
      "liquidslr-google-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "google",
    "questionId": "maximum-subarray",
    "evidence": "associated",
    "sources": [
      "liquidslr-google-6m",
      "liquidslr-google-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "google",
    "questionId": "number-of-islands",
    "evidence": "associated",
    "sources": [
      "liquidslr-google-6m",
      "liquidslr-google-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "google",
    "questionId": "valid-anagram",
    "evidence": "associated",
    "sources": [
      "liquidslr-google-6m",
      "liquidslr-google-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "google",
    "questionId": "merge-two-sorted-lists",
    "evidence": "associated",
    "sources": [
      "liquidslr-google-6m",
      "liquidslr-google-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "google",
    "questionId": "merge-intervals",
    "evidence": "associated",
    "sources": [
      "liquidslr-google-6m",
      "liquidslr-google-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "google",
    "questionId": "reverse-linked-list",
    "evidence": "associated",
    "sources": [
      "liquidslr-google-6m",
      "liquidslr-google-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "google",
    "questionId": "top-k-frequent-elements",
    "evidence": "associated",
    "sources": [
      "liquidslr-google-6m",
      "liquidslr-google-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "google",
    "questionId": "koko-eating-bananas",
    "evidence": "associated",
    "sources": [
      "liquidslr-google-6m",
      "liquidslr-google-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "google",
    "questionId": "rotate-image",
    "evidence": "associated",
    "sources": [
      "liquidslr-google-6m",
      "liquidslr-google-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "google",
    "questionId": "4sum",
    "evidence": "associated",
    "sources": [
      "liquidslr-google-6m",
      "liquidslr-google-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "google",
    "questionId": "group-anagrams",
    "evidence": "associated",
    "sources": [
      "liquidslr-google-6m",
      "liquidslr-google-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "google",
    "questionId": "search-in-rotated-sorted-array",
    "evidence": "associated",
    "sources": [
      "liquidslr-google-6m",
      "liquidslr-google-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "google",
    "questionId": "lru-cache",
    "evidence": "associated",
    "sources": [
      "liquidslr-google-6m",
      "liquidslr-google-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "google",
    "questionId": "spiral-matrix",
    "evidence": "associated",
    "sources": [
      "liquidslr-google-6m",
      "liquidslr-google-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "amazon",
    "questionId": "two-sum",
    "evidence": "associated",
    "sources": [
      "liquidslr-amazon-6m",
      "liquidslr-amazon-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "amazon",
    "questionId": "trapping-rain-water",
    "evidence": "associated",
    "sources": [
      "liquidslr-amazon-6m",
      "liquidslr-amazon-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "amazon",
    "questionId": "best-time-to-buy-and-sell-stock",
    "evidence": "associated",
    "sources": [
      "liquidslr-amazon-6m",
      "liquidslr-amazon-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "amazon",
    "questionId": "longest-substring-without-repeating-characters",
    "evidence": "associated",
    "sources": [
      "liquidslr-amazon-6m",
      "liquidslr-amazon-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "amazon",
    "questionId": "lru-cache",
    "evidence": "associated",
    "sources": [
      "liquidslr-amazon-6m",
      "liquidslr-amazon-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "amazon",
    "questionId": "add-two-numbers",
    "evidence": "associated",
    "sources": [
      "liquidslr-amazon-6m",
      "liquidslr-amazon-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "amazon",
    "questionId": "number-of-islands",
    "evidence": "associated",
    "sources": [
      "liquidslr-amazon-6m",
      "liquidslr-amazon-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "amazon",
    "questionId": "3sum",
    "evidence": "associated",
    "sources": [
      "liquidslr-amazon-6m",
      "liquidslr-amazon-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "amazon",
    "questionId": "group-anagrams",
    "evidence": "associated",
    "sources": [
      "liquidslr-amazon-6m",
      "liquidslr-amazon-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "amazon",
    "questionId": "median-of-two-sorted-arrays",
    "evidence": "associated",
    "sources": [
      "liquidslr-amazon-6m",
      "liquidslr-amazon-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "amazon",
    "questionId": "longest-palindromic-substring",
    "evidence": "associated",
    "sources": [
      "liquidslr-amazon-6m",
      "liquidslr-amazon-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "amazon",
    "questionId": "merge-intervals",
    "evidence": "associated",
    "sources": [
      "liquidslr-amazon-6m",
      "liquidslr-amazon-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "amazon",
    "questionId": "course-schedule",
    "evidence": "associated",
    "sources": [
      "liquidslr-amazon-6m",
      "liquidslr-amazon-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "amazon",
    "questionId": "koko-eating-bananas",
    "evidence": "associated",
    "sources": [
      "liquidslr-amazon-6m",
      "liquidslr-amazon-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "amazon",
    "questionId": "rotting-oranges",
    "evidence": "associated",
    "sources": [
      "liquidslr-amazon-6m",
      "liquidslr-amazon-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "amazon",
    "questionId": "search-in-rotated-sorted-array",
    "evidence": "associated",
    "sources": [
      "liquidslr-amazon-6m",
      "liquidslr-amazon-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "amazon",
    "questionId": "container-with-most-water",
    "evidence": "associated",
    "sources": [
      "liquidslr-amazon-6m",
      "liquidslr-amazon-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "amazon",
    "questionId": "merge-k-sorted-lists",
    "evidence": "associated",
    "sources": [
      "liquidslr-amazon-6m",
      "liquidslr-amazon-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "amazon",
    "questionId": "subarray-sum-equals-k",
    "evidence": "associated",
    "sources": [
      "liquidslr-amazon-6m",
      "liquidslr-amazon-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "amazon",
    "questionId": "fruit-into-baskets",
    "evidence": "associated",
    "sources": [
      "liquidslr-amazon-6m",
      "liquidslr-amazon-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "amazon",
    "questionId": "reorganize-string",
    "evidence": "associated",
    "sources": [
      "liquidslr-amazon-6m",
      "liquidslr-amazon-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "amazon",
    "questionId": "longest-consecutive-sequence",
    "evidence": "associated",
    "sources": [
      "liquidslr-amazon-6m",
      "liquidslr-amazon-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "amazon",
    "questionId": "majority-element",
    "evidence": "associated",
    "sources": [
      "liquidslr-amazon-6m",
      "liquidslr-amazon-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "amazon",
    "questionId": "lowest-common-ancestor-of-a-binary-tree",
    "evidence": "associated",
    "sources": [
      "liquidslr-amazon-6m",
      "liquidslr-amazon-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "amazon",
    "questionId": "letter-combinations-of-a-phone-number",
    "evidence": "associated",
    "sources": [
      "liquidslr-amazon-6m",
      "liquidslr-amazon-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "amazon",
    "questionId": "top-k-frequent-elements",
    "evidence": "associated",
    "sources": [
      "liquidslr-amazon-6m",
      "liquidslr-amazon-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "amazon",
    "questionId": "longest-common-prefix",
    "evidence": "associated",
    "sources": [
      "liquidslr-amazon-6m",
      "liquidslr-amazon-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "amazon",
    "questionId": "maximum-subarray",
    "evidence": "associated",
    "sources": [
      "liquidslr-amazon-6m",
      "liquidslr-amazon-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "amazon",
    "questionId": "subsets",
    "evidence": "associated",
    "sources": [
      "liquidslr-amazon-6m",
      "liquidslr-amazon-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "amazon",
    "questionId": "house-robber",
    "evidence": "associated",
    "sources": [
      "liquidslr-amazon-6m",
      "liquidslr-amazon-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "microsoft",
    "questionId": "two-sum",
    "evidence": "associated",
    "sources": [
      "liquidslr-microsoft-6m",
      "liquidslr-microsoft-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "microsoft",
    "questionId": "longest-palindromic-substring",
    "evidence": "associated",
    "sources": [
      "liquidslr-microsoft-6m",
      "liquidslr-microsoft-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "microsoft",
    "questionId": "add-two-numbers",
    "evidence": "associated",
    "sources": [
      "liquidslr-microsoft-6m",
      "liquidslr-microsoft-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "microsoft",
    "questionId": "longest-substring-without-repeating-characters",
    "evidence": "associated",
    "sources": [
      "liquidslr-microsoft-6m",
      "liquidslr-microsoft-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "microsoft",
    "questionId": "trapping-rain-water",
    "evidence": "associated",
    "sources": [
      "liquidslr-microsoft-6m",
      "liquidslr-microsoft-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "microsoft",
    "questionId": "3sum",
    "evidence": "associated",
    "sources": [
      "liquidslr-microsoft-6m",
      "liquidslr-microsoft-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "microsoft",
    "questionId": "maximum-subarray",
    "evidence": "associated",
    "sources": [
      "liquidslr-microsoft-6m",
      "liquidslr-microsoft-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "microsoft",
    "questionId": "merge-intervals",
    "evidence": "associated",
    "sources": [
      "liquidslr-microsoft-6m",
      "liquidslr-microsoft-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "microsoft",
    "questionId": "lru-cache",
    "evidence": "associated",
    "sources": [
      "liquidslr-microsoft-6m",
      "liquidslr-microsoft-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "microsoft",
    "questionId": "number-of-islands",
    "evidence": "associated",
    "sources": [
      "liquidslr-microsoft-6m",
      "liquidslr-microsoft-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "microsoft",
    "questionId": "subarray-sum-equals-k",
    "evidence": "associated",
    "sources": [
      "liquidslr-microsoft-6m",
      "liquidslr-microsoft-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "microsoft",
    "questionId": "next-permutation",
    "evidence": "associated",
    "sources": [
      "liquidslr-microsoft-6m",
      "liquidslr-microsoft-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "microsoft",
    "questionId": "best-time-to-buy-and-sell-stock",
    "evidence": "associated",
    "sources": [
      "liquidslr-microsoft-6m",
      "liquidslr-microsoft-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "microsoft",
    "questionId": "container-with-most-water",
    "evidence": "associated",
    "sources": [
      "liquidslr-microsoft-6m",
      "liquidslr-microsoft-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "microsoft",
    "questionId": "generate-parentheses",
    "evidence": "associated",
    "sources": [
      "liquidslr-microsoft-6m",
      "liquidslr-microsoft-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "microsoft",
    "questionId": "minimum-window-substring",
    "evidence": "associated",
    "sources": [
      "liquidslr-microsoft-6m",
      "liquidslr-microsoft-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "microsoft",
    "questionId": "longest-common-prefix",
    "evidence": "associated",
    "sources": [
      "liquidslr-microsoft-6m",
      "liquidslr-microsoft-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "microsoft",
    "questionId": "search-in-rotated-sorted-array",
    "evidence": "associated",
    "sources": [
      "liquidslr-microsoft-6m",
      "liquidslr-microsoft-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "microsoft",
    "questionId": "valid-anagram",
    "evidence": "associated",
    "sources": [
      "liquidslr-microsoft-6m",
      "liquidslr-microsoft-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "microsoft",
    "questionId": "valid-parentheses",
    "evidence": "associated",
    "sources": [
      "liquidslr-microsoft-6m",
      "liquidslr-microsoft-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "microsoft",
    "questionId": "remove-duplicates-from-sorted-array",
    "evidence": "associated",
    "sources": [
      "liquidslr-microsoft-6m",
      "liquidslr-microsoft-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "microsoft",
    "questionId": "median-of-two-sorted-arrays",
    "evidence": "associated",
    "sources": [
      "liquidslr-microsoft-6m",
      "liquidslr-microsoft-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "microsoft",
    "questionId": "letter-combinations-of-a-phone-number",
    "evidence": "associated",
    "sources": [
      "liquidslr-microsoft-6m",
      "liquidslr-microsoft-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "microsoft",
    "questionId": "climbing-stairs",
    "evidence": "associated",
    "sources": [
      "liquidslr-microsoft-6m",
      "liquidslr-microsoft-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "microsoft",
    "questionId": "rotting-oranges",
    "evidence": "associated",
    "sources": [
      "liquidslr-microsoft-6m",
      "liquidslr-microsoft-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "microsoft",
    "questionId": "longest-consecutive-sequence",
    "evidence": "associated",
    "sources": [
      "liquidslr-microsoft-6m",
      "liquidslr-microsoft-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "microsoft",
    "questionId": "koko-eating-bananas",
    "evidence": "associated",
    "sources": [
      "liquidslr-microsoft-6m",
      "liquidslr-microsoft-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "microsoft",
    "questionId": "fibonacci-number",
    "evidence": "associated",
    "sources": [
      "liquidslr-microsoft-6m",
      "liquidslr-microsoft-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "microsoft",
    "questionId": "sliding-window-maximum",
    "evidence": "associated",
    "sources": [
      "liquidslr-microsoft-6m",
      "liquidslr-microsoft-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "microsoft",
    "questionId": "maximum-average-subarray-i",
    "evidence": "associated",
    "sources": [
      "liquidslr-microsoft-6m",
      "liquidslr-microsoft-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "meta",
    "questionId": "two-sum",
    "evidence": "associated",
    "sources": [
      "liquidslr-meta-6m",
      "liquidslr-meta-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "meta",
    "questionId": "best-time-to-buy-and-sell-stock",
    "evidence": "associated",
    "sources": [
      "liquidslr-meta-6m",
      "liquidslr-meta-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "meta",
    "questionId": "subarray-sum-equals-k",
    "evidence": "associated",
    "sources": [
      "liquidslr-meta-6m",
      "liquidslr-meta-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "meta",
    "questionId": "longest-substring-without-repeating-characters",
    "evidence": "associated",
    "sources": [
      "liquidslr-meta-6m",
      "liquidslr-meta-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "meta",
    "questionId": "remove-duplicates-from-sorted-array",
    "evidence": "associated",
    "sources": [
      "liquidslr-meta-6m",
      "liquidslr-meta-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "meta",
    "questionId": "median-of-two-sorted-arrays",
    "evidence": "associated",
    "sources": [
      "liquidslr-meta-6m",
      "liquidslr-meta-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "meta",
    "questionId": "add-two-numbers",
    "evidence": "associated",
    "sources": [
      "liquidslr-meta-6m",
      "liquidslr-meta-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "meta",
    "questionId": "valid-parentheses",
    "evidence": "associated",
    "sources": [
      "liquidslr-meta-6m",
      "liquidslr-meta-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "meta",
    "questionId": "valid-palindrome",
    "evidence": "associated",
    "sources": [
      "liquidslr-meta-6m",
      "liquidslr-meta-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "meta",
    "questionId": "3sum",
    "evidence": "associated",
    "sources": [
      "liquidslr-meta-6m",
      "liquidslr-meta-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "meta",
    "questionId": "next-permutation",
    "evidence": "associated",
    "sources": [
      "liquidslr-meta-6m",
      "liquidslr-meta-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "meta",
    "questionId": "kth-largest-element-in-an-array",
    "evidence": "associated",
    "sources": [
      "liquidslr-meta-6m",
      "liquidslr-meta-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "meta",
    "questionId": "longest-palindromic-substring",
    "evidence": "associated",
    "sources": [
      "liquidslr-meta-6m",
      "liquidslr-meta-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "meta",
    "questionId": "merge-intervals",
    "evidence": "associated",
    "sources": [
      "liquidslr-meta-6m",
      "liquidslr-meta-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "meta",
    "questionId": "merge-sorted-array",
    "evidence": "associated",
    "sources": [
      "liquidslr-meta-6m",
      "liquidslr-meta-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "meta",
    "questionId": "max-consecutive-ones-iii",
    "evidence": "associated",
    "sources": [
      "liquidslr-meta-6m",
      "liquidslr-meta-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "meta",
    "questionId": "move-zeroes",
    "evidence": "associated",
    "sources": [
      "liquidslr-meta-6m",
      "liquidslr-meta-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "meta",
    "questionId": "container-with-most-water",
    "evidence": "associated",
    "sources": [
      "liquidslr-meta-6m",
      "liquidslr-meta-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "meta",
    "questionId": "powx-n",
    "evidence": "associated",
    "sources": [
      "liquidslr-meta-6m",
      "liquidslr-meta-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "meta",
    "questionId": "maximum-subarray",
    "evidence": "associated",
    "sources": [
      "liquidslr-meta-6m",
      "liquidslr-meta-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "meta",
    "questionId": "diameter-of-binary-tree",
    "evidence": "associated",
    "sources": [
      "liquidslr-meta-6m",
      "liquidslr-meta-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "meta",
    "questionId": "minimum-size-subarray-sum",
    "evidence": "associated",
    "sources": [
      "liquidslr-meta-6m",
      "liquidslr-meta-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "meta",
    "questionId": "set-matrix-zeroes",
    "evidence": "associated",
    "sources": [
      "liquidslr-meta-6m",
      "liquidslr-meta-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "meta",
    "questionId": "find-peak-element",
    "evidence": "associated",
    "sources": [
      "liquidslr-meta-6m",
      "liquidslr-meta-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "meta",
    "questionId": "binary-tree-right-side-view",
    "evidence": "associated",
    "sources": [
      "liquidslr-meta-6m",
      "liquidslr-meta-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "meta",
    "questionId": "number-of-islands",
    "evidence": "associated",
    "sources": [
      "liquidslr-meta-6m",
      "liquidslr-meta-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "meta",
    "questionId": "coin-change",
    "evidence": "associated",
    "sources": [
      "liquidslr-meta-6m",
      "liquidslr-meta-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "meta",
    "questionId": "search-in-rotated-sorted-array",
    "evidence": "associated",
    "sources": [
      "liquidslr-meta-6m",
      "liquidslr-meta-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "meta",
    "questionId": "group-anagrams",
    "evidence": "associated",
    "sources": [
      "liquidslr-meta-6m",
      "liquidslr-meta-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "meta",
    "questionId": "valid-anagram",
    "evidence": "associated",
    "sources": [
      "liquidslr-meta-6m",
      "liquidslr-meta-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "apple",
    "questionId": "lru-cache",
    "evidence": "associated",
    "sources": [
      "liquidslr-apple-6m",
      "liquidslr-apple-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "apple",
    "questionId": "merge-intervals",
    "evidence": "associated",
    "sources": [
      "liquidslr-apple-6m",
      "liquidslr-apple-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "apple",
    "questionId": "course-schedule-ii",
    "evidence": "associated",
    "sources": [
      "liquidslr-apple-6m",
      "liquidslr-apple-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "apple",
    "questionId": "group-anagrams",
    "evidence": "associated",
    "sources": [
      "liquidslr-apple-6m",
      "liquidslr-apple-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "apple",
    "questionId": "number-of-islands",
    "evidence": "associated",
    "sources": [
      "liquidslr-apple-6m",
      "liquidslr-apple-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "apple",
    "questionId": "insert-delete-getrandom-o1",
    "evidence": "associated",
    "sources": [
      "liquidslr-apple-6m",
      "liquidslr-apple-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "apple",
    "questionId": "best-time-to-buy-and-sell-stock",
    "evidence": "associated",
    "sources": [
      "liquidslr-apple-6m",
      "liquidslr-apple-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "apple",
    "questionId": "reverse-linked-list",
    "evidence": "associated",
    "sources": [
      "liquidslr-apple-6m",
      "liquidslr-apple-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "apple",
    "questionId": "two-sum",
    "evidence": "associated",
    "sources": [
      "liquidslr-apple-6m",
      "liquidslr-apple-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "apple",
    "questionId": "longest-common-prefix",
    "evidence": "associated",
    "sources": [
      "liquidslr-apple-6m",
      "liquidslr-apple-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "apple",
    "questionId": "time-based-key-value-store",
    "evidence": "associated",
    "sources": [
      "liquidslr-apple-6m",
      "liquidslr-apple-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "apple",
    "questionId": "subarray-sum-equals-k",
    "evidence": "associated",
    "sources": [
      "liquidslr-apple-6m",
      "liquidslr-apple-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "apple",
    "questionId": "find-first-and-last-position-of-element-in-sorted-array",
    "evidence": "associated",
    "sources": [
      "liquidslr-apple-6m",
      "liquidslr-apple-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "apple",
    "questionId": "3sum",
    "evidence": "associated",
    "sources": [
      "liquidslr-apple-6m",
      "liquidslr-apple-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "apple",
    "questionId": "longest-substring-without-repeating-characters",
    "evidence": "associated",
    "sources": [
      "liquidslr-apple-6m",
      "liquidslr-apple-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "apple",
    "questionId": "valid-palindrome",
    "evidence": "associated",
    "sources": [
      "liquidslr-apple-6m",
      "liquidslr-apple-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "apple",
    "questionId": "spiral-matrix",
    "evidence": "associated",
    "sources": [
      "liquidslr-apple-6m",
      "liquidslr-apple-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "apple",
    "questionId": "rotate-image",
    "evidence": "associated",
    "sources": [
      "liquidslr-apple-6m",
      "liquidslr-apple-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "apple",
    "questionId": "task-scheduler",
    "evidence": "associated",
    "sources": [
      "liquidslr-apple-6m",
      "liquidslr-apple-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "apple",
    "questionId": "edit-distance",
    "evidence": "associated",
    "sources": [
      "liquidslr-apple-6m",
      "liquidslr-apple-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "apple",
    "questionId": "merge-k-sorted-lists",
    "evidence": "associated",
    "sources": [
      "liquidslr-apple-6m",
      "liquidslr-apple-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "apple",
    "questionId": "course-schedule",
    "evidence": "associated",
    "sources": [
      "liquidslr-apple-6m",
      "liquidslr-apple-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "apple",
    "questionId": "word-ladder",
    "evidence": "associated",
    "sources": [
      "liquidslr-apple-6m",
      "liquidslr-apple-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "apple",
    "questionId": "best-time-to-buy-and-sell-stock-with-cooldown",
    "evidence": "associated",
    "sources": [
      "liquidslr-apple-6m",
      "liquidslr-apple-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "apple",
    "questionId": "is-graph-bipartite",
    "evidence": "associated",
    "sources": [
      "liquidslr-apple-6m",
      "liquidslr-apple-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "apple",
    "questionId": "valid-sudoku",
    "evidence": "associated",
    "sources": [
      "liquidslr-apple-6m",
      "liquidslr-apple-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "apple",
    "questionId": "rotate-array",
    "evidence": "associated",
    "sources": [
      "liquidslr-apple-6m",
      "liquidslr-apple-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "apple",
    "questionId": "top-k-frequent-elements",
    "evidence": "associated",
    "sources": [
      "liquidslr-apple-6m",
      "liquidslr-apple-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "apple",
    "questionId": "longest-palindromic-substring",
    "evidence": "associated",
    "sources": [
      "liquidslr-apple-6m",
      "liquidslr-apple-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "apple",
    "questionId": "median-of-two-sorted-arrays",
    "evidence": "associated",
    "sources": [
      "liquidslr-apple-6m",
      "liquidslr-apple-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "netflix",
    "questionId": "time-based-key-value-store",
    "evidence": "associated",
    "sources": [
      "liquidslr-netflix-6m",
      "liquidslr-netflix-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "netflix",
    "questionId": "course-schedule-ii",
    "evidence": "associated",
    "sources": [
      "liquidslr-netflix-6m",
      "liquidslr-netflix-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "netflix",
    "questionId": "longest-substring-without-repeating-characters",
    "evidence": "associated",
    "sources": [
      "liquidslr-netflix-6m",
      "liquidslr-netflix-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "netflix",
    "questionId": "reconstruct-itinerary",
    "evidence": "associated",
    "sources": [
      "liquidslr-netflix-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "netflix",
    "questionId": "meeting-rooms-ii",
    "evidence": "associated",
    "sources": [
      "liquidslr-netflix-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "netflix",
    "questionId": "merge-intervals",
    "evidence": "associated",
    "sources": [
      "liquidslr-netflix-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "netflix",
    "questionId": "contains-duplicate-ii",
    "evidence": "associated",
    "sources": [
      "liquidslr-netflix-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "netflix",
    "questionId": "word-search",
    "evidence": "associated",
    "sources": [
      "liquidslr-netflix-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "netflix",
    "questionId": "network-delay-time",
    "evidence": "associated",
    "sources": [
      "liquidslr-netflix-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "netflix",
    "questionId": "contains-duplicate",
    "evidence": "associated",
    "sources": [
      "liquidslr-netflix-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "netflix",
    "questionId": "first-missing-positive",
    "evidence": "associated",
    "sources": [
      "liquidslr-netflix-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "netflix",
    "questionId": "lru-cache",
    "evidence": "associated",
    "sources": [
      "liquidslr-netflix-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "netflix",
    "questionId": "summary-ranges",
    "evidence": "associated",
    "sources": [
      "liquidslr-netflix-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "netflix",
    "questionId": "top-k-frequent-elements",
    "evidence": "associated",
    "sources": [
      "liquidslr-netflix-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "netflix",
    "questionId": "word-break",
    "evidence": "associated",
    "sources": [
      "liquidslr-netflix-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "netflix",
    "questionId": "koko-eating-bananas",
    "evidence": "associated",
    "sources": [
      "liquidslr-netflix-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "netflix",
    "questionId": "fruit-into-baskets",
    "evidence": "associated",
    "sources": [
      "liquidslr-netflix-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "netflix",
    "questionId": "lfu-cache",
    "evidence": "associated",
    "sources": [
      "liquidslr-netflix-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "netflix",
    "questionId": "find-peak-element",
    "evidence": "associated",
    "sources": [
      "liquidslr-netflix-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "netflix",
    "questionId": "valid-anagram",
    "evidence": "associated",
    "sources": [
      "liquidslr-netflix-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "uber",
    "questionId": "bus-routes",
    "evidence": "associated",
    "sources": [
      "liquidslr-uber-6m",
      "liquidslr-uber-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "uber",
    "questionId": "number-of-islands-ii",
    "evidence": "associated",
    "sources": [
      "liquidslr-uber-6m",
      "liquidslr-uber-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "uber",
    "questionId": "longest-continuous-subarray-with-absolute-diff-less-than-or-equal-to-limit",
    "evidence": "associated",
    "sources": [
      "liquidslr-uber-6m",
      "liquidslr-uber-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "uber",
    "questionId": "alien-dictionary",
    "evidence": "associated",
    "sources": [
      "liquidslr-uber-6m",
      "liquidslr-uber-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "uber",
    "questionId": "squares-of-a-sorted-array",
    "evidence": "associated",
    "sources": [
      "liquidslr-uber-6m",
      "liquidslr-uber-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "uber",
    "questionId": "word-search",
    "evidence": "associated",
    "sources": [
      "liquidslr-uber-6m",
      "liquidslr-uber-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "uber",
    "questionId": "kth-smallest-element-in-a-bst",
    "evidence": "associated",
    "sources": [
      "liquidslr-uber-6m",
      "liquidslr-uber-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "uber",
    "questionId": "number-of-islands",
    "evidence": "associated",
    "sources": [
      "liquidslr-uber-6m",
      "liquidslr-uber-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "uber",
    "questionId": "time-based-key-value-store",
    "evidence": "associated",
    "sources": [
      "liquidslr-uber-6m",
      "liquidslr-uber-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "uber",
    "questionId": "find-peak-element",
    "evidence": "associated",
    "sources": [
      "liquidslr-uber-6m",
      "liquidslr-uber-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "uber",
    "questionId": "minimum-number-of-refueling-stops",
    "evidence": "associated",
    "sources": [
      "liquidslr-uber-6m",
      "liquidslr-uber-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "uber",
    "questionId": "insert-delete-getrandom-o1",
    "evidence": "associated",
    "sources": [
      "liquidslr-uber-6m",
      "liquidslr-uber-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "uber",
    "questionId": "lru-cache",
    "evidence": "associated",
    "sources": [
      "liquidslr-uber-6m",
      "liquidslr-uber-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "uber",
    "questionId": "split-array-largest-sum",
    "evidence": "associated",
    "sources": [
      "liquidslr-uber-6m",
      "liquidslr-uber-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "uber",
    "questionId": "making-a-large-island",
    "evidence": "associated",
    "sources": [
      "liquidslr-uber-6m",
      "liquidslr-uber-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "uber",
    "questionId": "word-search-ii",
    "evidence": "associated",
    "sources": [
      "liquidslr-uber-6m",
      "liquidslr-uber-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "uber",
    "questionId": "merge-intervals",
    "evidence": "associated",
    "sources": [
      "liquidslr-uber-6m",
      "liquidslr-uber-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "uber",
    "questionId": "course-schedule-ii",
    "evidence": "associated",
    "sources": [
      "liquidslr-uber-6m",
      "liquidslr-uber-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "uber",
    "questionId": "evaluate-division",
    "evidence": "associated",
    "sources": [
      "liquidslr-uber-6m",
      "liquidslr-uber-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "uber",
    "questionId": "meeting-rooms-ii",
    "evidence": "associated",
    "sources": [
      "liquidslr-uber-6m",
      "liquidslr-uber-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "uber",
    "questionId": "rotting-oranges",
    "evidence": "associated",
    "sources": [
      "liquidslr-uber-6m",
      "liquidslr-uber-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "uber",
    "questionId": "longest-palindromic-substring",
    "evidence": "associated",
    "sources": [
      "liquidslr-uber-6m",
      "liquidslr-uber-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "uber",
    "questionId": "vertical-order-traversal-of-a-binary-tree",
    "evidence": "associated",
    "sources": [
      "liquidslr-uber-6m",
      "liquidslr-uber-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "uber",
    "questionId": "find-median-from-data-stream",
    "evidence": "associated",
    "sources": [
      "liquidslr-uber-6m",
      "liquidslr-uber-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "uber",
    "questionId": "find-eventual-safe-states",
    "evidence": "associated",
    "sources": [
      "liquidslr-uber-6m",
      "liquidslr-uber-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "uber",
    "questionId": "serialize-and-deserialize-binary-tree",
    "evidence": "associated",
    "sources": [
      "liquidslr-uber-6m",
      "liquidslr-uber-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "uber",
    "questionId": "number-of-provinces",
    "evidence": "associated",
    "sources": [
      "liquidslr-uber-6m",
      "liquidslr-uber-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "uber",
    "questionId": "my-calendar-i",
    "evidence": "associated",
    "sources": [
      "liquidslr-uber-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "uber",
    "questionId": "best-time-to-buy-and-sell-stock",
    "evidence": "associated",
    "sources": [
      "liquidslr-uber-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "uber",
    "questionId": "product-of-array-except-self",
    "evidence": "associated",
    "sources": [
      "liquidslr-uber-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "adobe",
    "questionId": "lru-cache",
    "evidence": "associated",
    "sources": [
      "liquidslr-adobe-6m",
      "liquidslr-adobe-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "adobe",
    "questionId": "group-anagrams",
    "evidence": "associated",
    "sources": [
      "liquidslr-adobe-6m",
      "liquidslr-adobe-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "adobe",
    "questionId": "binary-tree-maximum-path-sum",
    "evidence": "associated",
    "sources": [
      "liquidslr-adobe-6m",
      "liquidslr-adobe-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "adobe",
    "questionId": "gas-station",
    "evidence": "associated",
    "sources": [
      "liquidslr-adobe-6m",
      "liquidslr-adobe-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "adobe",
    "questionId": "minimum-cost-for-tickets",
    "evidence": "associated",
    "sources": [
      "liquidslr-adobe-6m",
      "liquidslr-adobe-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "adobe",
    "questionId": "largest-number",
    "evidence": "associated",
    "sources": [
      "liquidslr-adobe-6m",
      "liquidslr-adobe-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "adobe",
    "questionId": "best-time-to-buy-and-sell-stock",
    "evidence": "associated",
    "sources": [
      "liquidslr-adobe-6m",
      "liquidslr-adobe-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "adobe",
    "questionId": "two-sum",
    "evidence": "associated",
    "sources": [
      "liquidslr-adobe-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "adobe",
    "questionId": "special-binary-string",
    "evidence": "associated",
    "sources": [
      "liquidslr-adobe-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "adobe",
    "questionId": "longest-substring-without-repeating-characters",
    "evidence": "associated",
    "sources": [
      "liquidslr-adobe-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "adobe",
    "questionId": "add-two-numbers",
    "evidence": "associated",
    "sources": [
      "liquidslr-adobe-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "adobe",
    "questionId": "median-of-two-sorted-arrays",
    "evidence": "associated",
    "sources": [
      "liquidslr-adobe-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "adobe",
    "questionId": "merge-intervals",
    "evidence": "associated",
    "sources": [
      "liquidslr-adobe-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "adobe",
    "questionId": "majority-element",
    "evidence": "associated",
    "sources": [
      "liquidslr-adobe-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "adobe",
    "questionId": "3sum",
    "evidence": "associated",
    "sources": [
      "liquidslr-adobe-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "adobe",
    "questionId": "climbing-stairs",
    "evidence": "associated",
    "sources": [
      "liquidslr-adobe-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "adobe",
    "questionId": "reverse-linked-list",
    "evidence": "associated",
    "sources": [
      "liquidslr-adobe-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "adobe",
    "questionId": "number-of-islands",
    "evidence": "associated",
    "sources": [
      "liquidslr-adobe-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "adobe",
    "questionId": "kth-largest-element-in-a-stream",
    "evidence": "associated",
    "sources": [
      "liquidslr-adobe-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "adobe",
    "questionId": "next-permutation",
    "evidence": "associated",
    "sources": [
      "liquidslr-adobe-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "adobe",
    "questionId": "jump-game",
    "evidence": "associated",
    "sources": [
      "liquidslr-adobe-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "adobe",
    "questionId": "minimum-window-substring",
    "evidence": "associated",
    "sources": [
      "liquidslr-adobe-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "adobe",
    "questionId": "longest-palindromic-substring",
    "evidence": "associated",
    "sources": [
      "liquidslr-adobe-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "adobe",
    "questionId": "longest-common-prefix",
    "evidence": "associated",
    "sources": [
      "liquidslr-adobe-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "adobe",
    "questionId": "valid-parentheses",
    "evidence": "associated",
    "sources": [
      "liquidslr-adobe-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "adobe",
    "questionId": "trapping-rain-water",
    "evidence": "associated",
    "sources": [
      "liquidslr-adobe-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "adobe",
    "questionId": "maximum-product-subarray",
    "evidence": "associated",
    "sources": [
      "liquidslr-adobe-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "adobe",
    "questionId": "lowest-common-ancestor-of-a-binary-tree",
    "evidence": "associated",
    "sources": [
      "liquidslr-adobe-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "adobe",
    "questionId": "top-k-frequent-elements",
    "evidence": "associated",
    "sources": [
      "liquidslr-adobe-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "adobe",
    "questionId": "koko-eating-bananas",
    "evidence": "associated",
    "sources": [
      "liquidslr-adobe-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "atlassian",
    "questionId": "best-time-to-buy-and-sell-stock",
    "evidence": "associated",
    "sources": [
      "liquidslr-atlassian-6m",
      "liquidslr-atlassian-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "atlassian",
    "questionId": "merge-intervals",
    "evidence": "associated",
    "sources": [
      "liquidslr-atlassian-6m",
      "liquidslr-atlassian-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "atlassian",
    "questionId": "lowest-common-ancestor-of-a-binary-tree",
    "evidence": "associated",
    "sources": [
      "liquidslr-atlassian-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "atlassian",
    "questionId": "meeting-rooms-ii",
    "evidence": "associated",
    "sources": [
      "liquidslr-atlassian-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "atlassian",
    "questionId": "word-search",
    "evidence": "associated",
    "sources": [
      "liquidslr-atlassian-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "atlassian",
    "questionId": "text-justification",
    "evidence": "associated",
    "sources": [
      "liquidslr-atlassian-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "atlassian",
    "questionId": "top-k-frequent-elements",
    "evidence": "associated",
    "sources": [
      "liquidslr-atlassian-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "atlassian",
    "questionId": "can-place-flowers",
    "evidence": "associated",
    "sources": [
      "liquidslr-atlassian-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "atlassian",
    "questionId": "russian-doll-envelopes",
    "evidence": "associated",
    "sources": [
      "liquidslr-atlassian-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "atlassian",
    "questionId": "two-sum",
    "evidence": "associated",
    "sources": [
      "liquidslr-atlassian-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "atlassian",
    "questionId": "longest-substring-without-repeating-characters",
    "evidence": "associated",
    "sources": [
      "liquidslr-atlassian-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "atlassian",
    "questionId": "group-anagrams",
    "evidence": "associated",
    "sources": [
      "liquidslr-atlassian-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "atlassian",
    "questionId": "koko-eating-bananas",
    "evidence": "associated",
    "sources": [
      "liquidslr-atlassian-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "atlassian",
    "questionId": "jump-game-ii",
    "evidence": "associated",
    "sources": [
      "liquidslr-atlassian-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "atlassian",
    "questionId": "longest-consecutive-sequence",
    "evidence": "associated",
    "sources": [
      "liquidslr-atlassian-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "atlassian",
    "questionId": "maximum-subarray",
    "evidence": "associated",
    "sources": [
      "liquidslr-atlassian-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "atlassian",
    "questionId": "lru-cache",
    "evidence": "associated",
    "sources": [
      "liquidslr-atlassian-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "atlassian",
    "questionId": "longest-increasing-subsequence",
    "evidence": "associated",
    "sources": [
      "liquidslr-atlassian-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "atlassian",
    "questionId": "design-add-and-search-words-data-structure",
    "evidence": "associated",
    "sources": [
      "liquidslr-atlassian-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "atlassian",
    "questionId": "find-first-and-last-position-of-element-in-sorted-array",
    "evidence": "associated",
    "sources": [
      "liquidslr-atlassian-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "atlassian",
    "questionId": "serialize-and-deserialize-binary-tree",
    "evidence": "associated",
    "sources": [
      "liquidslr-atlassian-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "atlassian",
    "questionId": "next-permutation",
    "evidence": "associated",
    "sources": [
      "liquidslr-atlassian-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "goldman-sachs",
    "questionId": "trapping-rain-water",
    "evidence": "associated",
    "sources": [
      "liquidslr-goldman-sachs-6m",
      "liquidslr-goldman-sachs-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "goldman-sachs",
    "questionId": "longest-palindromic-subsequence",
    "evidence": "associated",
    "sources": [
      "liquidslr-goldman-sachs-6m",
      "liquidslr-goldman-sachs-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "goldman-sachs",
    "questionId": "median-of-two-sorted-arrays",
    "evidence": "associated",
    "sources": [
      "liquidslr-goldman-sachs-6m",
      "liquidslr-goldman-sachs-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "goldman-sachs",
    "questionId": "minimum-path-sum",
    "evidence": "associated",
    "sources": [
      "liquidslr-goldman-sachs-6m",
      "liquidslr-goldman-sachs-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "goldman-sachs",
    "questionId": "merge-intervals",
    "evidence": "associated",
    "sources": [
      "liquidslr-goldman-sachs-6m",
      "liquidslr-goldman-sachs-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "goldman-sachs",
    "questionId": "container-with-most-water",
    "evidence": "associated",
    "sources": [
      "liquidslr-goldman-sachs-6m",
      "liquidslr-goldman-sachs-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "goldman-sachs",
    "questionId": "first-unique-character-in-a-string",
    "evidence": "associated",
    "sources": [
      "liquidslr-goldman-sachs-6m",
      "liquidslr-goldman-sachs-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "goldman-sachs",
    "questionId": "string-compression",
    "evidence": "associated",
    "sources": [
      "liquidslr-goldman-sachs-6m",
      "liquidslr-goldman-sachs-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "goldman-sachs",
    "questionId": "number-of-islands",
    "evidence": "associated",
    "sources": [
      "liquidslr-goldman-sachs-6m",
      "liquidslr-goldman-sachs-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "goldman-sachs",
    "questionId": "lru-cache",
    "evidence": "associated",
    "sources": [
      "liquidslr-goldman-sachs-6m",
      "liquidslr-goldman-sachs-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "goldman-sachs",
    "questionId": "longest-substring-without-repeating-characters",
    "evidence": "associated",
    "sources": [
      "liquidslr-goldman-sachs-6m",
      "liquidslr-goldman-sachs-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "goldman-sachs",
    "questionId": "best-time-to-buy-and-sell-stock",
    "evidence": "associated",
    "sources": [
      "liquidslr-goldman-sachs-6m",
      "liquidslr-goldman-sachs-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "goldman-sachs",
    "questionId": "3sum",
    "evidence": "associated",
    "sources": [
      "liquidslr-goldman-sachs-6m",
      "liquidslr-goldman-sachs-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "goldman-sachs",
    "questionId": "group-anagrams",
    "evidence": "associated",
    "sources": [
      "liquidslr-goldman-sachs-6m",
      "liquidslr-goldman-sachs-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "goldman-sachs",
    "questionId": "search-in-rotated-sorted-array",
    "evidence": "associated",
    "sources": [
      "liquidslr-goldman-sachs-6m",
      "liquidslr-goldman-sachs-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "goldman-sachs",
    "questionId": "binary-tree-maximum-path-sum",
    "evidence": "associated",
    "sources": [
      "liquidslr-goldman-sachs-6m",
      "liquidslr-goldman-sachs-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "goldman-sachs",
    "questionId": "sqrtx",
    "evidence": "associated",
    "sources": [
      "liquidslr-goldman-sachs-6m",
      "liquidslr-goldman-sachs-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "goldman-sachs",
    "questionId": "minimum-window-substring",
    "evidence": "associated",
    "sources": [
      "liquidslr-goldman-sachs-6m",
      "liquidslr-goldman-sachs-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "goldman-sachs",
    "questionId": "unique-paths",
    "evidence": "associated",
    "sources": [
      "liquidslr-goldman-sachs-6m",
      "liquidslr-goldman-sachs-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "goldman-sachs",
    "questionId": "daily-temperatures",
    "evidence": "associated",
    "sources": [
      "liquidslr-goldman-sachs-6m",
      "liquidslr-goldman-sachs-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "goldman-sachs",
    "questionId": "find-the-winner-of-the-circular-game",
    "evidence": "associated",
    "sources": [
      "liquidslr-goldman-sachs-6m",
      "liquidslr-goldman-sachs-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "goldman-sachs",
    "questionId": "pascals-triangle",
    "evidence": "associated",
    "sources": [
      "liquidslr-goldman-sachs-6m",
      "liquidslr-goldman-sachs-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "goldman-sachs",
    "questionId": "valid-arrangement-of-pairs",
    "evidence": "associated",
    "sources": [
      "liquidslr-goldman-sachs-6m",
      "liquidslr-goldman-sachs-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "goldman-sachs",
    "questionId": "course-schedule",
    "evidence": "associated",
    "sources": [
      "liquidslr-goldman-sachs-6m",
      "liquidslr-goldman-sachs-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "goldman-sachs",
    "questionId": "two-sum",
    "evidence": "associated",
    "sources": [
      "liquidslr-goldman-sachs-6m",
      "liquidslr-goldman-sachs-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "goldman-sachs",
    "questionId": "gas-station",
    "evidence": "associated",
    "sources": [
      "liquidslr-goldman-sachs-6m",
      "liquidslr-goldman-sachs-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "goldman-sachs",
    "questionId": "longest-palindromic-substring",
    "evidence": "associated",
    "sources": [
      "liquidslr-goldman-sachs-6m",
      "liquidslr-goldman-sachs-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "goldman-sachs",
    "questionId": "search-a-2d-matrix",
    "evidence": "associated",
    "sources": [
      "liquidslr-goldman-sachs-6m",
      "liquidslr-goldman-sachs-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "goldman-sachs",
    "questionId": "koko-eating-bananas",
    "evidence": "associated",
    "sources": [
      "liquidslr-goldman-sachs-6m",
      "liquidslr-goldman-sachs-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "goldman-sachs",
    "questionId": "decode-ways",
    "evidence": "associated",
    "sources": [
      "liquidslr-goldman-sachs-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "bloomberg",
    "questionId": "two-sum",
    "evidence": "associated",
    "sources": [
      "liquidslr-bloomberg-6m",
      "liquidslr-bloomberg-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "bloomberg",
    "questionId": "merge-intervals",
    "evidence": "associated",
    "sources": [
      "liquidslr-bloomberg-6m",
      "liquidslr-bloomberg-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "bloomberg",
    "questionId": "best-time-to-buy-and-sell-stock",
    "evidence": "associated",
    "sources": [
      "liquidslr-bloomberg-6m",
      "liquidslr-bloomberg-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "bloomberg",
    "questionId": "longest-substring-without-repeating-characters",
    "evidence": "associated",
    "sources": [
      "liquidslr-bloomberg-6m",
      "liquidslr-bloomberg-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "bloomberg",
    "questionId": "longest-palindromic-substring",
    "evidence": "associated",
    "sources": [
      "liquidslr-bloomberg-6m",
      "liquidslr-bloomberg-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "bloomberg",
    "questionId": "add-two-numbers",
    "evidence": "associated",
    "sources": [
      "liquidslr-bloomberg-6m",
      "liquidslr-bloomberg-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "bloomberg",
    "questionId": "trapping-rain-water",
    "evidence": "associated",
    "sources": [
      "liquidslr-bloomberg-6m",
      "liquidslr-bloomberg-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "bloomberg",
    "questionId": "group-anagrams",
    "evidence": "associated",
    "sources": [
      "liquidslr-bloomberg-6m",
      "liquidslr-bloomberg-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "bloomberg",
    "questionId": "decode-string",
    "evidence": "associated",
    "sources": [
      "liquidslr-bloomberg-6m",
      "liquidslr-bloomberg-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "bloomberg",
    "questionId": "number-of-islands",
    "evidence": "associated",
    "sources": [
      "liquidslr-bloomberg-6m",
      "liquidslr-bloomberg-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "bloomberg",
    "questionId": "climbing-stairs",
    "evidence": "associated",
    "sources": [
      "liquidslr-bloomberg-6m",
      "liquidslr-bloomberg-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "bloomberg",
    "questionId": "subarray-sum-equals-k",
    "evidence": "associated",
    "sources": [
      "liquidslr-bloomberg-6m",
      "liquidslr-bloomberg-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "bloomberg",
    "questionId": "median-of-two-sorted-arrays",
    "evidence": "associated",
    "sources": [
      "liquidslr-bloomberg-6m",
      "liquidslr-bloomberg-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "bloomberg",
    "questionId": "3sum",
    "evidence": "associated",
    "sources": [
      "liquidslr-bloomberg-6m",
      "liquidslr-bloomberg-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "bloomberg",
    "questionId": "valid-parentheses",
    "evidence": "associated",
    "sources": [
      "liquidslr-bloomberg-6m",
      "liquidslr-bloomberg-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "bloomberg",
    "questionId": "meeting-rooms-ii",
    "evidence": "associated",
    "sources": [
      "liquidslr-bloomberg-6m",
      "liquidslr-bloomberg-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "bloomberg",
    "questionId": "longest-consecutive-sequence",
    "evidence": "associated",
    "sources": [
      "liquidslr-bloomberg-6m",
      "liquidslr-bloomberg-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "bloomberg",
    "questionId": "container-with-most-water",
    "evidence": "associated",
    "sources": [
      "liquidslr-bloomberg-6m",
      "liquidslr-bloomberg-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "bloomberg",
    "questionId": "longest-common-prefix",
    "evidence": "associated",
    "sources": [
      "liquidslr-bloomberg-6m",
      "liquidslr-bloomberg-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "bloomberg",
    "questionId": "merge-two-sorted-lists",
    "evidence": "associated",
    "sources": [
      "liquidslr-bloomberg-6m",
      "liquidslr-bloomberg-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "bloomberg",
    "questionId": "remove-duplicates-from-sorted-array",
    "evidence": "associated",
    "sources": [
      "liquidslr-bloomberg-6m",
      "liquidslr-bloomberg-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "bloomberg",
    "questionId": "majority-element",
    "evidence": "associated",
    "sources": [
      "liquidslr-bloomberg-6m",
      "liquidslr-bloomberg-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "bloomberg",
    "questionId": "insert-delete-getrandom-o1",
    "evidence": "associated",
    "sources": [
      "liquidslr-bloomberg-6m",
      "liquidslr-bloomberg-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "bloomberg",
    "questionId": "valid-palindrome",
    "evidence": "associated",
    "sources": [
      "liquidslr-bloomberg-6m",
      "liquidslr-bloomberg-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "bloomberg",
    "questionId": "word-search",
    "evidence": "associated",
    "sources": [
      "liquidslr-bloomberg-6m",
      "liquidslr-bloomberg-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "bloomberg",
    "questionId": "rotate-image",
    "evidence": "associated",
    "sources": [
      "liquidslr-bloomberg-6m",
      "liquidslr-bloomberg-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "bloomberg",
    "questionId": "longest-repeating-character-replacement",
    "evidence": "associated",
    "sources": [
      "liquidslr-bloomberg-6m",
      "liquidslr-bloomberg-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "bloomberg",
    "questionId": "next-permutation",
    "evidence": "associated",
    "sources": [
      "liquidslr-bloomberg-6m",
      "liquidslr-bloomberg-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "bloomberg",
    "questionId": "search-in-rotated-sorted-array",
    "evidence": "associated",
    "sources": [
      "liquidslr-bloomberg-6m",
      "liquidslr-bloomberg-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "bloomberg",
    "questionId": "lru-cache",
    "evidence": "associated",
    "sources": [
      "liquidslr-bloomberg-6m",
      "liquidslr-bloomberg-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "linkedin",
    "questionId": "valid-parentheses",
    "evidence": "associated",
    "sources": [
      "liquidslr-linkedin-6m",
      "liquidslr-linkedin-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "linkedin",
    "questionId": "maximum-subarray",
    "evidence": "associated",
    "sources": [
      "liquidslr-linkedin-6m",
      "liquidslr-linkedin-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "linkedin",
    "questionId": "letter-combinations-of-a-phone-number",
    "evidence": "associated",
    "sources": [
      "liquidslr-linkedin-6m",
      "liquidslr-linkedin-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "linkedin",
    "questionId": "lru-cache",
    "evidence": "associated",
    "sources": [
      "liquidslr-linkedin-6m",
      "liquidslr-linkedin-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "linkedin",
    "questionId": "can-place-flowers",
    "evidence": "associated",
    "sources": [
      "liquidslr-linkedin-6m",
      "liquidslr-linkedin-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "linkedin",
    "questionId": "word-ladder",
    "evidence": "associated",
    "sources": [
      "liquidslr-linkedin-6m",
      "liquidslr-linkedin-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "linkedin",
    "questionId": "number-of-islands",
    "evidence": "associated",
    "sources": [
      "liquidslr-linkedin-6m",
      "liquidslr-linkedin-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "linkedin",
    "questionId": "maximum-product-subarray",
    "evidence": "associated",
    "sources": [
      "liquidslr-linkedin-6m",
      "liquidslr-linkedin-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "linkedin",
    "questionId": "kth-largest-element-in-an-array",
    "evidence": "associated",
    "sources": [
      "liquidslr-linkedin-6m",
      "liquidslr-linkedin-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "linkedin",
    "questionId": "search-in-rotated-sorted-array",
    "evidence": "associated",
    "sources": [
      "liquidslr-linkedin-6m",
      "liquidslr-linkedin-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "linkedin",
    "questionId": "insert-delete-getrandom-o1",
    "evidence": "associated",
    "sources": [
      "liquidslr-linkedin-6m",
      "liquidslr-linkedin-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "linkedin",
    "questionId": "partition-to-k-equal-sum-subsets",
    "evidence": "associated",
    "sources": [
      "liquidslr-linkedin-6m",
      "liquidslr-linkedin-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "linkedin",
    "questionId": "max-consecutive-ones-iii",
    "evidence": "associated",
    "sources": [
      "liquidslr-linkedin-6m",
      "liquidslr-linkedin-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "linkedin",
    "questionId": "maximum-depth-of-binary-tree",
    "evidence": "associated",
    "sources": [
      "liquidslr-linkedin-6m",
      "liquidslr-linkedin-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "linkedin",
    "questionId": "insert-delete-getrandom-o1-duplicates-allowed",
    "evidence": "associated",
    "sources": [
      "liquidslr-linkedin-6m",
      "liquidslr-linkedin-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "linkedin",
    "questionId": "longest-substring-without-repeating-characters",
    "evidence": "associated",
    "sources": [
      "liquidslr-linkedin-6m",
      "liquidslr-linkedin-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "linkedin",
    "questionId": "rotting-oranges",
    "evidence": "associated",
    "sources": [
      "liquidslr-linkedin-6m",
      "liquidslr-linkedin-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "linkedin",
    "questionId": "permutations",
    "evidence": "associated",
    "sources": [
      "liquidslr-linkedin-6m",
      "liquidslr-linkedin-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "linkedin",
    "questionId": "merge-intervals",
    "evidence": "associated",
    "sources": [
      "liquidslr-linkedin-6m",
      "liquidslr-linkedin-all"
    ],
    "note": "In the six-month list"
  },
  {
    "company": "linkedin",
    "questionId": "find-first-and-last-position-of-element-in-sorted-array",
    "evidence": "associated",
    "sources": [
      "liquidslr-linkedin-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "linkedin",
    "questionId": "powx-n",
    "evidence": "associated",
    "sources": [
      "liquidslr-linkedin-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "linkedin",
    "questionId": "minimum-window-substring",
    "evidence": "associated",
    "sources": [
      "liquidslr-linkedin-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "linkedin",
    "questionId": "lowest-common-ancestor-of-a-binary-search-tree",
    "evidence": "associated",
    "sources": [
      "liquidslr-linkedin-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "linkedin",
    "questionId": "symmetric-tree",
    "evidence": "associated",
    "sources": [
      "liquidslr-linkedin-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "linkedin",
    "questionId": "serialize-and-deserialize-binary-tree",
    "evidence": "associated",
    "sources": [
      "liquidslr-linkedin-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "linkedin",
    "questionId": "isomorphic-strings",
    "evidence": "associated",
    "sources": [
      "liquidslr-linkedin-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "linkedin",
    "questionId": "lowest-common-ancestor-of-a-binary-tree",
    "evidence": "associated",
    "sources": [
      "liquidslr-linkedin-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "linkedin",
    "questionId": "repeated-dna-sequences",
    "evidence": "associated",
    "sources": [
      "liquidslr-linkedin-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "linkedin",
    "questionId": "max-points-on-a-line",
    "evidence": "associated",
    "sources": [
      "liquidslr-linkedin-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "linkedin",
    "questionId": "longest-palindromic-subsequence",
    "evidence": "associated",
    "sources": [
      "liquidslr-linkedin-all"
    ],
    "note": "All-time list only (not in the six-month list)"
  },
  {
    "company": "google",
    "questionId": "trapping-rain-water",
    "evidence": "verified",
    "sources": [
      "google-tdg-volume-of-lakes"
    ],
    "note": "Published by Google as \"volume of lakes\": total water held between bars of given heights, i.e. the same problem as LeetCode 42."
  },
  {
    "company": "google",
    "questionId": "decode-string",
    "evidence": "verified",
    "sources": [
      "google-tdg-compression-and-decompression"
    ],
    "note": "Published by Google as \"compression and decompression\": expand strings of the form number[string], e.g. 2[3[a]b], i.e. the LeetCode 394 problem."
  },
  {
    "company": "google",
    "questionId": "google-tdg-find-longest-word",
    "evidence": "verified",
    "sources": [
      "google-tdg-find-longest-word"
    ],
    "note": "Google's own statement; closely related to LeetCode 524 \"Longest Word in Dictionary through Deleting\". Difficulty is our estimate.",
    "title": "Find Longest Word (subsequence of S)",
    "difficulty": "Medium",
    "url": "https://web.archive.org/web/20221209223021/https://techdevguide.withgoogle.com/resources/former-interview-question-find-longest-word/",
    "topic": "two-pointers"
  },
  {
    "company": "google",
    "questionId": "google-tdg-word-squares",
    "evidence": "verified",
    "sources": [
      "google-tdg-word-squares"
    ],
    "note": "Google's own statement (check a word square, then find all word squares); related to LeetCode 425 \"Word Squares\". Difficulty is our estimate.",
    "title": "Word Squares",
    "difficulty": "Hard",
    "url": "https://web.archive.org/web/20221209223021/https://techdevguide.withgoogle.com/resources/former-interview-question-word-squares/",
    "topic": "backtracking"
  },
  {
    "company": "google",
    "questionId": "google-tdg-minesweeper",
    "evidence": "verified",
    "sources": [
      "google-tdg-minesweeper"
    ],
    "note": "Google's own statement (implement Minesweeper, including revealing empty regions); related to LeetCode 529 \"Minesweeper\". Difficulty is our estimate.",
    "title": "Implement Minesweeper",
    "difficulty": "Medium",
    "url": "https://web.archive.org/web/20230324001952/https://techdevguide.withgoogle.com/resources/former-interview-question-minesweeper/",
    "topic": "graphs"
  },
  {
    "company": "google",
    "questionId": "google-tdg-flatten-iterators",
    "evidence": "verified",
    "sources": [
      "google-tdg-flatten-iterators"
    ],
    "note": "Google's own statement (given an iterator of iterators, implement an interleaving iterator); related to LeetCode 281 \"Zigzag Iterator\". Difficulty is our estimate.",
    "title": "Flatten (Interleave) Iterators",
    "difficulty": "Medium",
    "url": "https://web.archive.org/web/20221108083129/https://techdevguide.withgoogle.com/resources/former-interview-question-flatten-iterators/",
    "topic": "queue-deque"
  },
  {
    "company": "amazon",
    "questionId": "lru-cache",
    "evidence": "community",
    "sources": [
      "lc-discuss-1789833"
    ],
    "note": "SDE 1 new-grad final round; the post links LeetCode 146 directly."
  },
  {
    "company": "amazon",
    "questionId": "lru-cache",
    "evidence": "community",
    "sources": [
      "lc-discuss-302349"
    ],
    "note": "Phone screen: \"view most recently visited items\", which the candidate says turned into LeetCode 146."
  },
  {
    "company": "meta",
    "questionId": "merge-intervals",
    "evidence": "community",
    "sources": [
      "lc-discuss-5949964"
    ],
    "note": "Phone screen variant: union of two sorted, non-overlapping interval lists."
  },
  {
    "company": "meta",
    "questionId": "valid-word-abbreviation",
    "evidence": "community",
    "sources": [
      "lc-discuss-5949964"
    ],
    "note": "Phone screen, second question; links LeetCode 408.",
    "title": "Valid Word Abbreviation",
    "difficulty": "Easy",
    "url": "https://leetcode.com/problems/valid-word-abbreviation/",
    "topic": "two-pointers"
  },
  {
    "company": "meta",
    "questionId": "insert-interval",
    "evidence": "community",
    "sources": [
      "lc-discuss-5893260"
    ],
    "note": "Screening question: merge a target interval into a sorted list, which is the LeetCode 57 task (post title calls it \"Merge Intervals given a target\")."
  },
  {
    "company": "meta",
    "questionId": "course-schedule",
    "evidence": "community",
    "sources": [
      "lc-discuss-4266103"
    ],
    "note": "E4 onsite coding round 1; links LeetCode 207."
  },
  {
    "company": "meta",
    "questionId": "largest-rectangle-in-histogram",
    "evidence": "community",
    "sources": [
      "lc-discuss-4266103"
    ],
    "note": "E4 onsite coding round 2; links LeetCode 84."
  },
  {
    "company": "meta",
    "questionId": "minimum-window-substring",
    "evidence": "community",
    "sources": [
      "lc-discuss-4266103"
    ],
    "note": "E4 onsite coding round 2; links LeetCode 76."
  },
  {
    "company": "meta",
    "questionId": "simplify-path",
    "evidence": "community",
    "sources": [
      "lc-discuss-6379540"
    ],
    "note": "Screening round: \"return the final directory after following the path\" with ./ and ~ cases, a variant of LeetCode 71.",
    "title": "Simplify Path",
    "difficulty": "Medium",
    "url": "https://leetcode.com/problems/simplify-path/",
    "topic": "stack"
  },
  {
    "company": "goldman-sachs",
    "questionId": "trapping-rain-water",
    "evidence": "community",
    "sources": [
      "lc-discuss-5199331"
    ],
    "note": "CoderPad round (Engineering Division); links LeetCode 42."
  },
  {
    "company": "goldman-sachs",
    "questionId": "find-the-winner-of-the-circular-game",
    "evidence": "community",
    "sources": [
      "lc-discuss-5199331"
    ],
    "note": "CoderPad round, first question; links LeetCode 1823."
  },
  {
    "company": "goldman-sachs",
    "questionId": "trapping-rain-water",
    "evidence": "community",
    "sources": [
      "lc-discuss-861334"
    ],
    "note": "Phone/CoderPad round, framed as \"Trapping SnowFlakes\", which the candidate calls the same problem."
  },
  {
    "company": "goldman-sachs",
    "questionId": "trapping-rain-water",
    "evidence": "community",
    "sources": [
      "lc-discuss-413065"
    ],
    "note": "Phone screen; candidate says \"similar to\" LeetCode 42."
  },
  {
    "company": "goldman-sachs",
    "questionId": "median-of-two-sorted-arrays",
    "evidence": "community",
    "sources": [
      "glassdoor-gs-5462610"
    ],
    "note": "First online coding interview, per the Glassdoor review."
  },
  {
    "company": "goldman-sachs",
    "questionId": "string-to-integer-atoi",
    "evidence": "community",
    "sources": [
      "glassdoor-gs-5462610"
    ],
    "note": "Second online coding interview (testing/debugging), per the Glassdoor review.",
    "title": "String to Integer (atoi)",
    "difficulty": "Medium",
    "url": "https://leetcode.com/problems/string-to-integer-atoi/",
    "topic": "arrays"
  },
  {
    "company": "bloomberg",
    "questionId": "valid-palindrome-ii",
    "evidence": "community",
    "sources": [
      "lc-discuss-1789554"
    ],
    "note": "New-grad phone round; links LeetCode 680.",
    "title": "Valid Palindrome II",
    "difficulty": "Easy",
    "url": "https://leetcode.com/problems/valid-palindrome-ii/",
    "topic": "two-pointers"
  },
  {
    "company": "bloomberg",
    "questionId": "meeting-rooms-ii",
    "evidence": "community",
    "sources": [
      "lc-discuss-1789554"
    ],
    "note": "New-grad onsite round 1; links LeetCode 253."
  },
  {
    "company": "bloomberg",
    "questionId": "design-underground-system",
    "evidence": "community",
    "sources": [
      "lc-discuss-1789554"
    ],
    "note": "New-grad onsite round 1; links LeetCode 1396.",
    "title": "Design Underground System",
    "difficulty": "Medium",
    "url": "https://leetcode.com/problems/design-underground-system/",
    "topic": "hashing"
  },
  {
    "company": "bloomberg",
    "questionId": "merge-two-sorted-lists",
    "evidence": "community",
    "sources": [
      "lc-discuss-833176"
    ],
    "note": "Phone interview."
  },
  {
    "company": "bloomberg",
    "questionId": "merge-k-sorted-lists",
    "evidence": "community",
    "sources": [
      "lc-discuss-833176"
    ],
    "note": "Phone interview (complexity discussion, not fully coded)."
  },
  {
    "company": "uber",
    "questionId": "course-schedule-ii",
    "evidence": "community",
    "sources": [
      "lc-discuss-3281930"
    ],
    "note": "Onsite algorithms round; candidate says the question was \"similar to\" LeetCode 210."
  },
  {
    "company": "linkedin",
    "questionId": "number-of-islands",
    "evidence": "community",
    "sources": [
      "lc-discuss-1294643"
    ],
    "note": "Onsite coding."
  },
  {
    "company": "linkedin",
    "questionId": "delete-node-in-a-bst",
    "evidence": "community",
    "sources": [
      "lc-discuss-1294643"
    ],
    "note": "Onsite coding (\"BST - delete a node\")."
  },
  {
    "company": "apple",
    "questionId": "median-of-two-sorted-arrays",
    "evidence": "community",
    "sources": [
      "lc-discuss-1627771"
    ],
    "note": "ICT3 onsite interview 2; links LeetCode 4."
  },
  {
    "company": "adobe",
    "questionId": "copy-list-with-random-pointer",
    "evidence": "community",
    "sources": [
      "lc-discuss-1838547"
    ],
    "note": "MTS-2 technical round 2.",
    "title": "Copy List with Random Pointer",
    "difficulty": "Medium",
    "url": "https://leetcode.com/problems/copy-list-with-random-pointer/",
    "topic": "linked-list"
  },
  {
    "company": "adobe",
    "questionId": "lowest-common-ancestor-of-a-binary-tree",
    "evidence": "community",
    "sources": [
      "lc-discuss-5616563"
    ],
    "note": "MTS-2 round 2 (\"LCA of Binary Tree\")."
  },
  {
    "company": "adobe",
    "questionId": "binary-tree-level-order-traversal",
    "evidence": "community",
    "sources": [
      "lc-discuss-5616563"
    ],
    "note": "MTS-2 round 3."
  },
  {
    "company": "adobe",
    "questionId": "invert-binary-tree",
    "evidence": "community",
    "sources": [
      "lc-discuss-5616563"
    ],
    "note": "MTS-2 round 4."
  },
  {
    "company": "adobe",
    "questionId": "reverse-words-in-a-string",
    "evidence": "community",
    "sources": [
      "lc-discuss-5616563"
    ],
    "note": "MTS-2 round 4 (\"Reverse words in long string\").",
    "title": "Reverse Words in a String",
    "difficulty": "Medium",
    "url": "https://leetcode.com/problems/reverse-words-in-a-string/",
    "topic": "arrays"
  },
  {
    "company": "microsoft",
    "questionId": "linked-list-cycle",
    "evidence": "community",
    "sources": [
      "lc-discuss-4625890"
    ],
    "note": "Phone screen: check whether a linked list has a loop."
  },
  {
    "company": "microsoft",
    "questionId": "first-unique-character-in-a-string",
    "evidence": "community",
    "sources": [
      "lc-discuss-4625890"
    ],
    "note": "Phone screen: first non-repeating character."
  },
  {
    "company": "microsoft",
    "questionId": "maximum-subarray",
    "evidence": "community",
    "sources": [
      "lc-discuss-4625890"
    ],
    "note": "Coding round: maximum sum of a contiguous subarray."
  },
  {
    "company": "microsoft",
    "questionId": "populating-next-right-pointers-in-each-node",
    "evidence": "community",
    "sources": [
      "lc-discuss-4937133"
    ],
    "note": "SDE2 round 1: connect nodes to right neighbours in a complete tree (LeetCode 116 setup).",
    "title": "Populating Next Right Pointers in Each Node",
    "difficulty": "Medium",
    "url": "https://leetcode.com/problems/populating-next-right-pointers-in-each-node/",
    "topic": "trees"
  },
  {
    "company": "google",
    "questionId": "single-number-ii",
    "evidence": "community",
    "sources": [
      "lc-discuss-124626"
    ],
    "note": "Onsite round 1 (post from 2017); links LeetCode 137."
  },
  {
    "company": "google",
    "questionId": "decode-string",
    "evidence": "community",
    "sources": [
      "lc-discuss-124626"
    ],
    "note": "Onsite round 2 (post from 2017); links LeetCode 394."
  },
  {
    "company": "google",
    "questionId": "toeplitz-matrix",
    "evidence": "community",
    "sources": [
      "lc-discuss-124626"
    ],
    "note": "Onsite round 5 with an out-of-memory follow-up (post from 2017).",
    "title": "Toeplitz Matrix",
    "difficulty": "Easy",
    "url": "https://leetcode.com/problems/toeplitz-matrix/",
    "topic": "arrays"
  },
  {
    "company": "google",
    "questionId": "find-all-possible-recipes-from-given-supplies",
    "evidence": "community",
    "sources": [
      "lc-discuss-4987607"
    ],
    "note": "L5 onsite; links LeetCode 2115."
  }
];
