// ─────────────────────────────────────────────────────────────
// ALL portfolio content lives here. Everything below is PLACEHOLDER:
// replace it with your real details and the whole site updates.
// ─────────────────────────────────────────────────────────────

export const PROFILE = {
  name: "CJ COLOMA",
  title: "Creative Developer",
  location: "Manila, PH",
  email: "you@example.com",
  status: "SYSTEM ONLINE · AVAILABLE FOR WORK",
  roles: ["INTERFACES", "WEB EXPERIENCES", "DIGITAL SYSTEMS", "THINGS THAT MOVE"],
  bio: [
    "I design and build interfaces that feel alive. I care about the small details that turn a website from a page into a place.",
    "Replace this with your own story: what you do, what drives you, and the kind of work you want more of.",
  ],
  facts: [
    ["BASE", "Manila, PH"],
    ["FOCUS", "Front-end · Creative dev"],
    ["STACK", "Next.js · TypeScript · Canvas"],
    ["STATUS", "Open to new work"],
  ] as [string, string][],
  stats: [
    { label: "PROJECTS", value: 24, suffix: "+" },
    { label: "YEARS", value: 5, suffix: "" },
    { label: "CLIENTS", value: 12, suffix: "" },
  ],
  links: [
    { label: "GITHUB", href: "https://github.com/LEVi19xx" },
    { label: "LINKEDIN", href: "#" },
    { label: "DRIBBBLE", href: "#" },
  ],
};

export type Project = {
  id: string;
  name: string;
  year: string;
  role: string;
  summary: string;
  description: string;
  highlights: string[];
  stack: string[];
  live: string;
  repo: string;
};

export const PROJECTS: Project[] = [
  {
    id: "01",
    name: "NEON TRANSIT",
    year: "2026",
    role: "Design & Development",
    summary: "Real-time transit map with animated vehicle trails.",
    description:
      "Placeholder. Describe the problem, who it was for, and how you approached it. Keep it to a short paragraph.",
    highlights: ["60fps canvas rendering", "Live data from public APIs", "Fully keyboard accessible"],
    stack: ["Next.js", "TypeScript", "Canvas"],
    live: "#",
    repo: "#",
  },
  {
    id: "02",
    name: "SIGNAL DESK",
    year: "2025",
    role: "Front-end Lead",
    summary: "Analytics dashboard built for fast, dense decision making.",
    description:
      "Placeholder. Explain the result: faster load times, higher conversion, happier users. Numbers are best.",
    highlights: ["Reduced load time by 40%", "Custom charting layer", "Dark & light themes"],
    stack: ["React", "D3", "Tailwind"],
    live: "#",
    repo: "#",
  },
  {
    id: "03",
    name: "ORBIT UI",
    year: "2025",
    role: "Creator",
    summary: "Open-source component library with motion built in.",
    description:
      "Placeholder. Mention adoption, stars, contributors or anything that shows it is used.",
    highlights: ["40+ accessible components", "Zero-config theming", "Fully typed"],
    stack: ["React", "TypeScript", "Storybook"],
    live: "#",
    repo: "#",
  },
  {
    id: "04",
    name: "PULSE STUDIO",
    year: "2024",
    role: "Full-stack Developer",
    summary: "Portfolio and booking platform for a creative studio.",
    description:
      "Placeholder. Say what you owned end to end and what made it a good project.",
    highlights: ["Headless CMS", "Stripe checkout", "SEO score 100"],
    stack: ["Next.js", "Node", "PostgreSQL"],
    live: "#",
    repo: "#",
  },
];

export const EXPERIENCE = [
  {
    period: "2024 — NOW",
    role: "Creative Developer",
    org: "Company Name",
    note: "Placeholder. One or two lines about what you ship and the impact it has.",
  },
  {
    period: "2022 — 2024",
    role: "Front-end Developer",
    org: "Another Company",
    note: "Placeholder. Mention the products, the team size, the stack.",
  },
  {
    period: "2020 — 2022",
    role: "Junior Developer",
    org: "First Company",
    note: "Placeholder. Where it started and what you learned.",
  },
];

export const SKILLS: Record<string, [string, number][]> = {
  FRONTEND: [
    ["REACT / NEXT.JS", 92],
    ["TYPESCRIPT", 90],
    ["TAILWIND / CSS", 94],
    ["CANVAS / WEBGL", 75],
  ],
  BACKEND: [
    ["NODE.JS", 72],
    ["POSTGRESQL", 65],
    ["REST / GRAPHQL", 70],
    ["DOCKER", 55],
  ],
  DESIGN: [
    ["FIGMA", 70],
    ["MOTION DESIGN", 72],
    ["DESIGN SYSTEMS", 78],
    ["ACCESSIBILITY", 80],
  ],
};

export const HEADLINES = [
  "",
  "I build interfaces that feel alive.",
  "Where I have been.",
  "Selected work.",
  "What I work with.",
  "Let us build something.",
  "",
  "What I do after hours.",
  "",
  "Worth framing.",
  "",
  "Now showing.",
  "",
  "Jam session.",
  "",
  "Build a bouquet.",
  "",
  "Paint something.",
  "Write a letter.",
  "Play for tips.",
  "Say cheese.",
];

// What the drone says when you arrive somewhere, and when you poke it.
export const TIPS = [
  "Hi! Click the glowing diamonds, or type a command on the keyboard.",
  "My story is written in that book. Take your time.",
  "Click a badge to read it.",
  "Everything is on the monitor. Click a project to read it.",
  "These are the tools I reach for.",
  "Tap the phone. And click the speaker to change the music.",
  "Welcome to the lounge. Grab the remote: the TV knows what I am into.",
  "Click a topic on the TV.",
  "Welcome to the gallery. Take your time.",
  "Click a frame to read it.",
  "Grab a seat. Tonight's feature: the films I love.",
  "Click a poster on the screen, then press play.",
  "Welcome to the music room. Click the keys, or turn the record.",
  "Play with the mouse, or use your keyboard: Z to M and Q to U.",
  "Fresh flowers! Click any bunch to start your own bouquet.",
  "Pick a flower and a color, then build a bouquet.",
  "The atelier: paint on the easel, or write a letter at the desk.",
  "Pick a color and paint. Whatever you make shows up on the easel.",
  "Write whatever you like. It lands on the paper, and you can send it to me.",
  "Pick a song and play. A crowd gathers and drops tips in the guitar case.",
  "Pick a frame, turn on the camera and smile. Polaroids and couple strips!",
];

export const QUIPS = [
  "Beep boop. Try typing 'vault' on the keyboard.",
  "Click the window to switch day and night.",
  "The lamp is clickable too.",
  "Drag anywhere to look around the room.",
  "Hold the mouse still to recolor everything.",
  "The chair spins. You are welcome.",
  "Press / for the command menu.",
];

// The lounge TV: what you do when the laptop is shut.
export const INTERESTS = [
  {
    name: "MUSIC",
    blurb: "Placeholder. Say what you listen to, play or make, and why it matters to you.",
    now: "On repeat: your favorite album",
    tags: ["LO-FI", "SYNTHWAVE", "JAZZ"],
  },
  {
    name: "GAMING",
    blurb: "Placeholder. The games you keep coming back to, and what they taught you.",
    now: "Playing: your current game",
    tags: ["INDIE", "STRATEGY", "CO-OP"],
  },
  {
    name: "FITNESS",
    blurb: "Placeholder. How you stay moving: gym, running, sports, anything.",
    now: "This week: your current goal",
    tags: ["GYM", "RUNNING"],
  },
  {
    name: "TRAVEL",
    blurb: "Placeholder. Places you have been, or the next one on the list.",
    now: "Next stop: your dream destination",
    tags: ["CITIES", "FOOD", "HIKING"],
  },
  {
    name: "PHOTOGRAPHY",
    blurb: "Placeholder. What you shoot and what you look for in a frame.",
    now: "Lately: street and night shots",
    tags: ["STREET", "NIGHT"],
  },
];

// The gallery frames: recognition and certificates.
export const AWARDS = [
  {
    title: "Award Title One",
    org: "Organization",
    year: "2026",
    note: "Placeholder. Say what it was for and why it mattered.",
  },
  {
    title: "Certificate Title Two",
    org: "Another Organization",
    year: "2025",
    note: "Placeholder. A certification, course or recognition you are proud of.",
  },
  {
    title: "Award Title Three",
    org: "Third Organization",
    year: "2024",
    note: "Placeholder. A hackathon, a competition, a client thank-you.",
  },
  {
    title: "Certificate Title Four",
    org: "Fourth Organization",
    year: "2023",
    note: "Placeholder. The one that started it all.",
  },
];

export const ROOM_INTROS = {
  lounge: {
    title: "THE LOUNGE",
    tagline: "Where I switch off: music, games and everything in between.",
  },
  gallery: {
    title: "THE GALLERY",
    tagline: "Recognition, certificates and the moments worth framing.",
  },
  theater: {
    title: "THE THEATER",
    tagline: "Lights down, popcorn up. A few of the films that shaped how I think.",
  },
  music: {
    title: "THE MUSIC ROOM",
    tagline: "Hit the keys, spin the record, change the track.",
  },
  flowers: {
    title: "THE FLOWER SHOP",
    tagline: "Fresh blooms on display. Pick your favorites and build a bouquet of your own.",
  },
  atelier: {
    title: "THE ATELIER",
    tagline: "A quiet corner with an easel and a writing desk. Paint something, or leave me a letter.",
  },
};

// The theater screen: favorites, as a little now-showing list.
export const MOVIES = [
  { title: "MOVIE TITLE ONE", year: "2019", genre: "SCI-FI", blurb: "Placeholder. Say why this film stuck with you.", hue: 200 },
  { title: "MOVIE TITLE TWO", year: "2014", genre: "DRAMA", blurb: "Placeholder. The scene you can quote from memory.", hue: 340 },
  { title: "MOVIE TITLE THREE", year: "2010", genre: "THRILLER", blurb: "Placeholder. The one you rewatch every year.", hue: 40 },
  { title: "MOVIE TITLE FOUR", year: "2006", genre: "ANIMATION", blurb: "Placeholder. A comfort movie for any mood.", hue: 150 },
  { title: "MOVIE TITLE FIVE", year: "2022", genre: "ADVENTURE", blurb: "Placeholder. The latest one you loved.", hue: 270 },
];
