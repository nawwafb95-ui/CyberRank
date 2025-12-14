# SOCyberX

Modern, responsive cybersecurity training frontend with React + Vite.

## Apps

- Legacy static pages in `public/`
- New React SPA in `app/`

## Run the React app

1) Install deps

```bash
cd app
npm install
```

2) Start dev server (http://localhost:5173)

```bash
npm run dev
```

## Features

- Dark theme, smooth gradients, Inter/Poppins fonts
- Pages: Home (/), About (/about), Login (/login), Sign Up (/signup), Quizzes (/quizzes), Question (/question/:quizId/:index), Profile (/profile)
- Navbar: Logged out → Login/Sign Up/About; Logged in → Logout + Info menu
- Auth/profile mock store with localStorage (setProfile/getProfile/updateProfile)
- Route guards for /quizzes and /question/*
- Timer per question with persisted deadline and expiry handling
- AI feedback placeholder
- Loading skeletons and toasts

## Notes

- After login or signup, app redirects to Home (/).
- Home CTA “Quizzes” sends to /quizzes if logged in, else to /login?next=/quizzes.