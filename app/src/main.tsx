// Run locally:
//   cd app && npm i && npm run dev
// Opens http://localhost:5173
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, redirect } from 'react-router-dom';
import './styles.css';
import { AppShell } from './shell/AppShell';
import { HomePage } from './shell/HomePage';
import { AboutPage } from './pages/about/AboutPage';
import { LoginPage } from './features/auth/LoginPage';
import { SignupPage } from './features/auth/SignupPage';
import { QuizzesPage } from './features/quizzes/QuizzesPage';
import { QuestionPage } from './features/quizzes/QuestionPage';
import { ProfilePage } from './features/profile/ProfilePage';
import { isAuthenticated } from './features/auth/store';
import { pathWithNext } from './lib/utils';

const guard = (path: string) => {
  if (!isAuthenticated()) {
    throw redirect('/login' + pathWithNext(path));
  }
  return null;
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'login', loader: () => (isAuthenticated() ? redirect('/') : null), element: <LoginPage /> },
      { path: 'signup', loader: () => (isAuthenticated() ? redirect('/') : null), element: <SignupPage /> },
      { path: 'profile', loader: () => guard('/profile'), element: <ProfilePage /> },
      { path: 'quizzes', loader: () => guard('/quizzes'), element: <QuizzesPage /> },
      { path: 'question/:quizId/:index', loader: ({ params }) => guard(`/question/${params.quizId}/${params.index}`), element: <QuestionPage /> }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);


