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
];

// What the drone says when you arrive somewhere, and when you poke it.
export const TIPS = [
  "Hi! Click the glowing diamonds, or type a command on the keyboard.",
  "My story is written in that book. Take your time.",
  "Click a badge to read it.",
  "Everything is on the monitor. Click a project to read it.",
  "These are the tools I reach for.",
  "Tap the phone. And click the speaker to change the music.",
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
