import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import App from './App'
import Timeline from './components/timeline/Timeline';
import ErrorPage from './components/ErrorPage';
import Podcasts from './components/podcasts/Podcasts';
import Episodes from './components/episodes/Episodes';
import Episode from './components/episode/Episode';
import TimelineAccordion from './components/timeline/TimelineAccordion';
import './index.css'


const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);
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
        element: <TimelineAccordion />,
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
