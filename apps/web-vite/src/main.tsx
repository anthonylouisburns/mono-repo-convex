import React from "react";
import ReactDOM from "react-dom/client";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import ErrorPage from "./components/ErrorPage";
// import Podcasts from "./components/podcasts/Podcasts";
import Episodes from "./components/episodes/Episodes";
import TimelinePage from "./components/timeline/TimelinePage";
import "./index.css";
import PlayHistory from "./components/PlayHistory";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <TimelinePage /> },
      {
        path: "timeline",
        element: <TimelinePage />,
      },
      {
        path: "episodes/:podcast_id",
        element: <Episodes />,
      },
      {
        path: "play_history",
        element: <PlayHistory />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConvexAuthProvider client={convex}>
      <RouterProvider router={router} />
    </ConvexAuthProvider>
  </React.StrictMode>,
);
