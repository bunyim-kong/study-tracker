# Study Tracker: build instructions

Build a free-to-host web app called "Study Tracker". One ADMIN (me) manages study
plans and sees every learner's progress. LEARNERS register themselves, see the plan
I assign, tick sessions, and write a short note after each lesson. First use case:
a 7-day React relearning plan for a friend who forgets easily. Works on phone AND
laptop. The learner side has a cute, friendly look; the admin side is calmer.

## ENVIRONMENT NOTES
- You have no access to my Supabase, Cloudflare or GitHub accounts. Do NOT ask for
  keys. Build and test everything locally in MOCK mode first.
- All data access goes through one interface (src/data/adapter.js) with two
  implementations: mockAdapter.js (in-memory + localStorage, seeded with demo data,
  default when VITE_DATA_MODE=mock) and supabaseAdapter.js (VITE_DATA_MODE=supabase).
  UI code never calls Supabase directly.
- Only free tools. No server to host. No paid API. No credit card needed.
- Work in stages. Finish and test one stage before starting the next, and tell me
  what you finished after each stage.

## TECH
- React + Vite (JavaScript), React Router, plain CSS with design tokens
  (CSS variables), lucide-react icons. Fonts via npm (@fontsource/baloo-2 for
  headings, @fontsource/nunito for body), bundled, no external font requests.
- @supabase/supabase-js (Auth email/password + Postgres + Row Level Security).
- Frontend env (.env.example): VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY,
  VITE_DATA_MODE. The service-role key must NEVER appear in frontend code.
- Static SPA for Cloudflare Pages (build: npm run build, output: dist,
  public/_redirects containing "/* /index.html 200").
- PWA: manifest + simple service worker, installable on phone and laptop.
- Tests: Vitest for streak, progress, stars/badges, plan-JSON validation, mock adapter.

## ACCOUNTS AND ROLES
- Roles: 'admin' and 'learner'.
- Learners register themselves in the app (name, email, password). They are ALWAYS
  created as 'learner'. The role is set only by a database trigger on auth.users
  that ignores any role sent from the browser. RLS must block users from changing
  their own role.
- There is exactly one admin (me). Provide scripts/create-admin.mjs, run locally
  with `npm run create-admin`. It reads SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
  ADMIN_EMAIL, ADMIN_PASSWORD from a local, git-ignored .env.admin file
  (.env.admin.example defaults: admin@studytracker.local / ChangeMe-Admin-2026!),
  creates the user with the Supabase admin API, sets profiles.role='admin' and
  must_change_password=true. The script is never bundled into the frontend.
- First admin login forces a new password (min 10 chars) before anything else.
- profiles.active boolean: admin can deactivate a learner; inactive users see
  nothing (enforce in RLS and UI).
- Unassigned learners see a friendly "Waiting for your mentor to assign a plan"
  screen with the sleepy mascot. They can see nothing else.

## DATABASE
Write supabase/schema.sql (Postgres) that I paste into the Supabase SQL editor.
Idempotent where possible, RLS on every table.
- profiles(id uuid pk references auth.users on delete cascade, name text,
  role text check in ('admin','learner') default 'learner', active boolean default true,
  must_change_password boolean default false, created_at)
- plans(id uuid pk, title, description)
- plan_days(id, plan_id, day_number int, topic text)
- plan_sessions(id, day_id, type check in ('research','practice','quiz','note'),
  start_time time, end_time time, title text, resources jsonb default '[]'
  ([{label,url}]), practice_path text, exercise text, sort_order int)
- assignments(id, learner_id, plan_id, start_date date, unique(learner_id, plan_id))
  Function assign_plan(learner uuid, plan uuid, start date): security definer,
  admin only, deep-copies the template plan (days+sessions) into a new plan titled
  "<plan> - <learner name>" so I can edit one learner's copy without touching the
  template.
- progress(learner_id, session_id, done boolean, done_at timestamptz,
  primary key(learner_id, session_id))
- notes(learner_id, day_id, learned, built, confused, remember, question text,
  mentor_comment text, updated_at, primary key(learner_id, day_id))
- ping(id int primary key, ok boolean): one row, readable by anon (keep-alive).
- Helper security-definer functions (is_admin(), etc.) to avoid recursive RLS.

RLS:
- learner: read own profile; read plans/days/sessions only of plans assigned to
  them; read/write only their own progress and notes; cannot write mentor_comment.
- admin: full access to everything.
- Nobody can read another learner's data.
- Stars and badges are DERIVED on the client from progress; no extra tables.

## ADMIN PAGES (desktop-first but responsive)
1. Dashboard: learner cards with today's completion %, streak, last note date,
   a "Missed yesterday" warning, and a "Needs your attention" list (missed days,
   new questions in notes).
2. Learner detail: week strip, today's sessions with done times, latest notes,
   a box to write/save mentor_comment, Deactivate button, Assign plan button.
3. Plans: CRUD for plans, days, sessions; duplicate a plan; reorder sessions.
4. Assign: choose learner + plan + start date (calls assign_plan).
5. AI Plan Builder (manual, no API):
   a. Form: goal/topic, learner level, number of days, nightly start time and
      length, technologies, extra notes.
   b. Generates a ready-to-copy prompt telling any AI to reply with ONLY JSON in my
      plan schema (days -> sessions with type, times, title, resources,
      practice_path, exercise). Show the schema inside the prompt.
   c. Textarea to paste the AI's JSON. Validate strictly with zod (types, enums,
      time format, http/https URLs only, size limits). Show clear errors.
      Never execute or trust the content.
   d. Editable preview, then Save as a plan, optionally Assign right away.
   e. AiProvider interface with ManualProvider so an API provider can be added later.
6. Settings: change password, export all data as JSON.

## LEARNER PAGES (cute)
1. Today (hero): on the first open of each day show a welcome with the mascot
   ("Hi <name>!", "Let's go" button). Home shows a "Today we learn" card with the
   topic and a big Start button, then 4 chunky tiles (Research, Practice, Quiz,
   Note) with time, icon and done state. Tapping a tile opens the session: resource
   links (new tab), practice file path with a Copy button, exercise text, and a big
   copper "Mark as done" button that gives a star, a small confetti burst and a
   mascot cheer. Also show progress, streak flame and star count.
2. Week: 7 day cards (done, today, locked-looking upcoming).
3. Day note: mascot says "What did you learn tonight?"; 5 fields with debounced
   autosave and a "Saved" indicator; shows the mentor comment in a speech bubble.
4. Review: searchable list of past notes.
5. Badges: derived sticker badges (first lesson, 3-day streak, finished a day with
   all 4 sessions, finished the whole plan).
6. Settings: name, theme, export my data, sign out.

Rules: "today" uses the browser's local date. A day is complete when all its
sessions are done. Streak = consecutive completed days ending today or yesterday.
Star = 1 per completed session.

## DESIGN SYSTEM (friendly dark-navy look; original artwork only)
- Do NOT copy any existing app's artwork or characters. Draw an ORIGINAL mascot
  as inline SVG: a round, friendly little owl named "Pip" with moods happy,
  cheering, sleepy, thinking (mood changes with app state). Soft cloud shapes
  and small stars as decorative SVG backgrounds, low contrast.
- Tokens (dark navy default, optional light theme toggle):
  --bg #2A3760, --bg-deep #1F2A4D, --card #364577, --card-2 #41528A,
  --yellow #FFD84D (headings, highlights), --copper #D08A52 (primary buttons)
  with dark text #2A1A0C on copper, --text #F1F4FF, --muted #B8C2E6,
  --green #4ADE80 (done), --danger #F87171. All text meets WCAG AA; verify.
- Type: Baloo 2 for headings (large, friendly), Nunito for body, tabular numbers
  for times.
- Shapes: very rounded cards (radius 24px), pill chips, soft inner shadows,
  chunky buttons with a darker bottom edge (box-shadow 0 4px 0 #A5683A) that press
  down 2px on click. Touch targets >= 48px.
- Navigation: phone = bottom tab bar (Today, Week, centered raised Start button,
  Badges, Me). Laptop (>=1024px) = left sidebar 240px + content max-width 1120px,
  tiles in 4 columns, hero card two columns with the mascot beside the text.
  Tablet (700-1023px) = 2-column tiles. Everything fluid, no horizontal scroll.
- Admin side: same palette but calmer and denser: no mascot (small logo only),
  tables and cards, copper "Admin" badge, clear active nav state.
- Motion: 150-250ms eases, small bounce on mascot, confetti on completing a
  session or a day. Respect prefers-reduced-motion (disable confetti/bounce).
- Accessible: labels, visible focus rings, keyboard navigable, aria-live for
  save status, alt text/aria-labels for the mascot and icons.

## QUALITY
- Structure: src/pages, src/components (Mascot, Tile, ProgressBar, Confetti, ...),
  src/hooks, src/data (adapters, seed), src/lib (streak.js, progress.js,
  badges.js, dates.js), supabase/schema.sql, supabase/seed.sql, scripts/create-admin.mjs.
- Loading and error states on every data call. No secrets in the repo; add
  .env, .env.admin to .gitignore.
- GitHub Actions .github/workflows/keepalive.yml: every 3 days GET the ping table
  via the Supabase REST API with repo secrets SUPABASE_URL and SUPABASE_ANON_KEY
  (prevents the free-tier inactivity pause).
- Small commits; explain each briefly.

## DEFAULT SCHEDULE per day (editable)
research 20:00-20:30, practice 20:30-21:35, quiz 21:35-21:50, note 21:50-22:00.
Quiz text: "Close the notes. Explain today's topic out loud in your own words,
then answer the 3 self-check questions."
Note text: "Fill in the 5 note fields: what I learned, what I built, what
confused me, one thing I will not forget, a question for tomorrow."

## SEED PLAN "React in 7 days"
Description: "Setup first: npm create vite@latest react-relearn -- --template react,
then npm install and npm run dev. Each day's work goes in its own folder under src/."
Put it in supabase/seed.sql and the mock adapter.

Day 1 - JSX, components, props
  research: [Quick Start|https://react.dev/learn], [Describing the UI|https://react.dev/learn/describing-the-ui]
  practice_path: src/day1/ProfileCard.jsx, src/day1/App.jsx
  exercise: Build a ProfileCard (name, role, photo) using props. Render 3 cards from an array.
Day 2 - State and events
  research: [Adding Interactivity|https://react.dev/learn/adding-interactivity]
  practice_path: src/day2/Counter.jsx, src/day2/TodoList.jsx
  exercise: Counter with +, -, reset. Todo list where you can add, toggle and delete items.
Day 3 - Lists, conditionals, forms
  research: [Rendering Lists|https://react.dev/learn/rendering-lists], [Conditional Rendering|https://react.dev/learn/conditional-rendering], [Reacting to Input with State|https://react.dev/learn/reacting-to-input-with-state]
  practice_path: src/day3/ContactForm.jsx, src/day3/SearchableList.jsx
  exercise: Controlled form with validation messages. Search box that filters a list of 10 items.
Day 4 - useEffect and fetching data
  research: [Synchronizing with Effects|https://react.dev/learn/synchronizing-with-effects], [You Might Not Need an Effect|https://react.dev/learn/you-might-not-need-an-effect]
  practice_path: src/day4/UserList.jsx
  exercise: Fetch users from https://jsonplaceholder.typicode.com/users. Show loading, error and data states.
Day 5 - Lifting state, useRef, custom hooks
  research: [Sharing State Between Components|https://react.dev/learn/sharing-state-between-components], [Referencing Values with Refs|https://react.dev/learn/referencing-values-with-refs], [Reusing Logic with Custom Hooks|https://react.dev/learn/reusing-logic-with-custom-hooks]
  practice_path: src/day5/useLocalStorage.js, src/day5/NotesBox.jsx
  exercise: Write a useLocalStorage hook. Use it so a note survives a page refresh.
Day 6 - Context and routing
  research: [Passing Data Deeply with Context|https://react.dev/learn/passing-data-deeply-with-context], [React Router|https://reactrouter.com]
  practice_path: src/day6/ThemeContext.jsx, src/day6/Router.jsx, src/day6/pages/
  exercise: Dark/light theme toggle with Context. 3 pages (Home, About, Contact) with navigation.
Day 7 - Mini project and review
  research: re-read my own notes from Day 1 to Day 6 (link to the Review page).
  practice_path: src/day7/MiniApp/
  exercise: Build a Notes app: add, edit, delete, search, saved in localStorage. Use at least 3 components, 1 custom hook, and fetch or routing.

Each day has the 4 default sessions. Mock mode also seeds a demo admin, 2 demo
learners and some progress.

## DELIVERABLES
1. Working app in mock mode: npm install, npm run dev, npm test all pass.
2. supabase/schema.sql + seed.sql, scripts/create-admin.mjs.
3. README with beginner-friendly steps:
   a. Create a free Supabase project, run schema.sql, then seed.sql.
   b. Copy URL and anon key into .env and set VITE_DATA_MODE=supabase.
   c. Run `npm run create-admin` locally (service-role key only in .env.admin),
      log in as admin, set a new password.
   d. Push to GitHub, connect Cloudflare Pages, set the env vars, deploy.
   e. Add the two GitHub secrets for the keep-alive workflow.
   f. How learners register, how to assign a plan, how to use the AI Plan Builder.
   g. Backups (Export JSON) and how to move to another Postgres host later.
