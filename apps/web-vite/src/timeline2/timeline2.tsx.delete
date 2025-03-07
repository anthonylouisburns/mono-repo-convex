import React from "react";
import ReactDOM from "react-dom/client";
import MultiSelectChips from "./multiSelectChips";
import TimelineView from "./timelineView";

function Timeline() {
  return (
    <div className="flex flex-col min-h-screen">
      <header
        style={{
          position: "fixed",
          top: 40,
          zIndex: 50,
          backgroundColor: "gray",
          padding: "10px",
        }}
      >
        header contents
      </header>

      <header className="sticky top-0 z-50 bg-gray-300 p-4">
        header contents
      </header>

      <div className="flex-grow">
        <MultiSelectChips
          options={["React", "Vue", "Angular", "Svelte", "Next.js", "Nuxt.js"]}
        />
        <MultiSelectChips
          options={["React", "Vue", "Angular", "Svelte", "Next.js", "Nuxt.js"]}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr",
            gap: "20px",
          }}
        >
          <TimelineView />
          <TimelineView />
          <TimelineView />
          <TimelineView />
          <TimelineView />
          <TimelineView />
          <TimelineView />
          <TimelineView />
          <TimelineView />
          <TimelineView />
          <TimelineView />
          <TimelineView />
          <TimelineView />
        </div>
        <div className="h-screen overflow-x-scroll bg-gray-100"></div>
      </div>
      <div
        style={{
          position: "fixed",
          bottom: 0,
          zIndex: 50,
          backgroundColor: "gray",
          padding: "10px",
        }}
      >
        Footer
      </div>
    </div>
  );
}

// Mount the app to the root element
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Timeline />
  </React.StrictMode>,
);
