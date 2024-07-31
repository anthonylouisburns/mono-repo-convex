import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './globals.css'
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import Timeline from './components/timeline/Timeline.tsx';
import ErrorPage from './components/ErrorPage.tsx';
import Podcasts from './components/podcasts/Podcasts.tsx';
import Episodes from './components/episodes/Episodes.tsx';
import Episode from './components/episode/Episode.tsx';

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      { index: true,
        element:  <Timeline />,
      },
      {
        path: "timeline",
        element: <Timeline />,
      },
      {
        path: "podcasts",
        element: <Podcasts />,
      },
      {
        path: "episodes/:podcast_id",
        element: <Episodes />,
      },
      {
        path: "episode/:episode_id",
        element: <Episode/>,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConvexAuthProvider client={convex}>
      <RouterProvider router={router} />
    </ConvexAuthProvider>
  </React.StrictMode>
)
