const status = document.querySelector("#status");
const title = document.querySelector("#page-title");
const introduction = document.querySelector("#introduction");
const emptyState = document.querySelector("#empty-state");
const plan = document.querySelector("#plan");
const planDate = document.querySelector("#plan-date");
const attendee = document.querySelector("#attendee");
const sourceNote = document.querySelector("#source-note");
const timeline = document.querySelector("#timeline");
const errorMessage = document.querySelector("#error");

function formatTime(value) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles"
  }).format(new Date(value));
}

function safeHttpsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

function createItem(item) {
  const entry = document.createElement("li");
  entry.className = `timeline-item timeline-item--${item.type || "item"}`;

  const time = document.createElement("p");
  time.className = "timeline-time";
  time.textContent = `${formatTime(item.start)} – ${formatTime(item.end)}`;

  const details = document.createElement("div");
  details.className = "timeline-details";

  const type = document.createElement("p");
  type.className = "timeline-type";
  type.textContent = item.type || "plan";

  const heading = document.createElement("h3");
  heading.textContent = item.title || "Untitled item";

  details.append(type, heading);

  if (item.room) {
    const room = document.createElement("p");
    room.className = "timeline-room";
    room.textContent = item.room;
    details.append(room);
  }

  const noteValue = item.description || item.note;
  if (noteValue) {
    const note = document.createElement("p");
    note.className = "timeline-note";
    note.textContent = noteValue;
    details.append(note);
  }

  const sourceUrl = safeHttpsUrl(item.sourceUrl);
  if (sourceUrl) {
    const source = document.createElement("a");
    source.className = "source-link";
    source.href = sourceUrl;
    source.target = "_blank";
    source.rel = "noopener noreferrer";
    source.textContent = "View public source";
    details.append(source);
  }

  entry.append(time, details);
  return entry;
}

function renderItinerary(itinerary) {
  if (!Array.isArray(itinerary.items) || itinerary.items.length === 0) {
    throw new Error("The itinerary contains no items.");
  }

  const label = itinerary.attendee?.name || "Guest";
  const interests = Array.isArray(itinerary.attendee?.interests)
    ? itinerary.attendee.interests.join(", ")
    : "";
  const source = itinerary.metadata?.source || "public event data";
  const fallback = itinerary.metadata?.fallback ? "fallback" : "live";

  title.textContent = itinerary.event?.name || "Your Universe itinerary";
  introduction.textContent = interests
    ? `A one-day route shaped around ${interests}.`
    : "A sourced, conflict-free route through the day.";
  planDate.textContent = itinerary.date || "GitHub Universe";
  attendee.textContent = label;
  sourceNote.textContent = `Source: ${source} · ${fallback}`;
  status.textContent = "Itinerary ready";
  timeline.replaceChildren(...itinerary.items.map(createItem));
  emptyState.hidden = true;
  plan.hidden = false;
}

async function loadItinerary() {
  const response = await fetch("./itinerary.json", {
    cache: "no-store",
    headers: { Accept: "application/json" }
  });

  if (response.status === 404) {
    return;
  }
  if (!response.ok) {
    throw new Error(`Itinerary request failed with status ${response.status}.`);
  }

  renderItinerary(await response.json());
}

loadItinerary().catch((error) => {
  status.textContent = "Itinerary unavailable";
  errorMessage.textContent =
    "The itinerary could not be displayed. Try again after the plan is regenerated.";
  errorMessage.hidden = false;
  console.error(error);
});
