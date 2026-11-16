import { addDays, toLocalDateKey } from '../../lib/dates.js'

const DEFAULT_SESSIONS = [
  { type: 'research', startTime: '20:00', endTime: '20:30', title: 'Explore the idea' },
  { type: 'practice', startTime: '20:30', endTime: '21:35', title: 'Build it yourself' },
  { type: 'quiz', startTime: '21:35', endTime: '21:50', title: 'Explain it from memory' },
  { type: 'note', startTime: '21:50', endTime: '22:00', title: 'Capture what matters' },
]

const QUIZ_EXERCISE =
  "Close the notes. Explain today's topic out loud in your own words, then answer the 3 self-check questions."

const NOTE_EXERCISE =
  'Fill in the 5 note fields: what I learned, what I built, what confused me, one thing I will not forget, a question for tomorrow.'

const DAY_CONTENT = [
  {
    topic: 'JSX, components, props',
    resources: [
      { label: 'Quick Start', url: 'https://react.dev/learn' },
      { label: 'Describing the UI', url: 'https://react.dev/learn/describing-the-ui' },
    ],
    practicePath: 'src/day1/ProfileCard.jsx, src/day1/App.jsx',
    exercise: 'Build a ProfileCard (name, role, photo) using props. Render 3 cards from an array.',
  },
  {
    topic: 'State and events',
    resources: [{ label: 'Adding Interactivity', url: 'https://react.dev/learn/adding-interactivity' }],
    practicePath: 'src/day2/Counter.jsx, src/day2/TodoList.jsx',
    exercise: 'Counter with +, -, reset. Todo list where you can add, toggle and delete items.',
  },
  {
    topic: 'Lists, conditionals, forms',
    resources: [
      { label: 'Rendering Lists', url: 'https://react.dev/learn/rendering-lists' },
      { label: 'Conditional Rendering', url: 'https://react.dev/learn/conditional-rendering' },
      { label: 'Reacting to Input with State', url: 'https://react.dev/learn/reacting-to-input-with-state' },
    ],
    practicePath: 'src/day3/ContactForm.jsx, src/day3/SearchableList.jsx',
    exercise: 'Controlled form with validation messages. Search box that filters a list of 10 items.',
  },
  {
    topic: 'useEffect and fetching data',
    resources: [
      { label: 'Synchronizing with Effects', url: 'https://react.dev/learn/synchronizing-with-effects' },
      { label: 'You Might Not Need an Effect', url: 'https://react.dev/learn/you-might-not-need-an-effect' },
    ],
    practicePath: 'src/day4/UserList.jsx',
    exercise: 'Fetch users from https://jsonplaceholder.typicode.com/users. Show loading, error and data states.',
  },
  {
    topic: 'Lifting state, useRef, custom hooks',
    resources: [
      { label: 'Sharing State Between Components', url: 'https://react.dev/learn/sharing-state-between-components' },
      { label: 'Referencing Values with Refs', url: 'https://react.dev/learn/referencing-values-with-refs' },
      { label: 'Reusing Logic with Custom Hooks', url: 'https://react.dev/learn/reusing-logic-with-custom-hooks' },
    ],
    practicePath: 'src/day5/useLocalStorage.js, src/day5/NotesBox.jsx',
    exercise: 'Write a useLocalStorage hook. Use it so a note survives a page refresh.',
  },
  {
    topic: 'Context and routing',
    resources: [
      { label: 'Passing Data Deeply with Context', url: 'https://react.dev/learn/passing-data-deeply-with-context' },
      { label: 'React Router', url: 'https://reactrouter.com' },
    ],
    practicePath: 'src/day6/ThemeContext.jsx, src/day6/Router.jsx, src/day6/pages/',
    exercise: 'Dark/light theme toggle with Context. 3 pages (Home, About, Contact) with navigation.',
  },
  {
    topic: 'Mini project and review',
    resources: [{ label: 'Review my notes from Days 1–6', url: '/review' }],
    practicePath: 'src/day7/MiniApp/',
    exercise:
      'Build a Notes app: add, edit, delete, search, saved in localStorage. Use at least 3 components, 1 custom hook, and fetch or routing.',
  },
]

function createSessions(dayNumber, content) {
  return DEFAULT_SESSIONS.map((session, index) => ({
    id: `session-react-${dayNumber}-${session.type}`,
    dayId: `day-react-${dayNumber}`,
    ...session,
    resources: session.type === 'research' ? content.resources : [],
    practicePath: session.type === 'practice' ? content.practicePath : '',
    exercise:
      session.type === 'practice'
        ? content.exercise
        : session.type === 'quiz'
          ? QUIZ_EXERCISE
          : session.type === 'note'
            ? NOTE_EXERCISE
            : '',
    sortOrder: index + 1,
  }))
}

export const seedPlan = {
  id: 'plan-react-7-days',
  title: 'React in 7 days',
  description:
    "Setup first: npm create vite@latest react-relearn -- --template react, then npm install and npm run dev. Each day's work goes in its own folder under src/.",
  days: DAY_CONTENT.map((content, index) => {
    const dayNumber = index + 1
    return {
      id: `day-react-${dayNumber}`,
      planId: 'plan-react-7-days',
      dayNumber,
      topic: content.topic,
      sessions: createSessions(dayNumber, content),
    }
  }),
}

function createDemoLearnerPlan() {
  const planId = 'plan-react-maya'
  return {
    ...structuredClone(seedPlan),
    id: planId,
    title: `${seedPlan.title} - Maya`,
    templateId: seedPlan.id,
    isLearnerCopy: true,
    days: seedPlan.days.map((day) => {
      const dayId = `day-maya-${day.dayNumber}`
      return {
        ...structuredClone(day),
        id: dayId,
        planId,
        sessions: day.sessions.map((session) => ({
          ...structuredClone(session),
          id: `session-maya-${day.dayNumber}-${session.type}`,
          dayId,
        })),
      }
    }),
  }
}

export const demoCredentials = Object.freeze({
  admin: { email: 'admin@studytracker.local', password: 'DemoAdmin123!' },
  learner: { email: 'maya@example.com', password: 'DemoLearner123!' },
  learnerWithoutPlan: { email: 'noah@example.com', password: 'DemoLearner123!' },
})

export function createSeedState(today = new Date()) {
  const todayKey = toLocalDateKey(today)
  const startDate = addDays(todayKey, -2)
  const dayOneDate = startDate
  const dayTwoDate = addDays(startDate, 1)
  const learnerPlan = createDemoLearnerPlan()
  const profiles = [
    {
      id: 'user-admin-demo',
      name: 'Demo Admin',
      email: demoCredentials.admin.email,
      role: 'admin',
      active: true,
      mustChangePassword: false,
      createdAt: `${addDays(todayKey, -14)}T08:00:00.000Z`,
    },
    {
      id: 'user-learner-maya',
      name: 'Maya',
      email: demoCredentials.learner.email,
      role: 'learner',
      active: true,
      mustChangePassword: false,
      createdAt: `${addDays(todayKey, -10)}T08:00:00.000Z`,
    },
    {
      id: 'user-learner-noah',
      name: 'Noah',
      email: 'noah@example.com',
      role: 'learner',
      active: true,
      mustChangePassword: false,
      createdAt: `${addDays(todayKey, -9)}T08:00:00.000Z`,
    },
  ]

  const accounts = [
    { userId: 'user-admin-demo', email: demoCredentials.admin.email, password: demoCredentials.admin.password },
    { userId: 'user-learner-maya', email: demoCredentials.learner.email, password: demoCredentials.learner.password },
    {
      userId: 'user-learner-noah',
      email: demoCredentials.learnerWithoutPlan.email,
      password: demoCredentials.learnerWithoutPlan.password,
    },
  ]

  const progress = [
    ...learnerPlan.days[0].sessions.map((session, index) => ({
      learnerId: 'user-learner-maya',
      sessionId: session.id,
      done: true,
      doneAt: `${dayOneDate}T${String(13 + index).padStart(2, '0')}:00:00.000Z`,
    })),
    ...learnerPlan.days[1].sessions.map((session, index) => ({
      learnerId: 'user-learner-maya',
      sessionId: session.id,
      done: true,
      doneAt: `${dayTwoDate}T${String(13 + index).padStart(2, '0')}:00:00.000Z`,
    })),
  ]

  return {
    version: 3,
    session: null,
    accounts,
    profiles,
    plans: [seedPlan, learnerPlan],
    assignments: [
      {
        id: 'assignment-maya-react',
        learnerId: 'user-learner-maya',
        planId: learnerPlan.id,
        startDate,
      },
    ],
    progress,
    notes: [
      {
        learnerId: 'user-learner-maya',
        dayId: 'day-maya-1',
        learned: 'Props let one component render different data.',
        built: 'Three profile cards from an array.',
        confused: 'When to split a component.',
        remember: 'Props flow down.',
        question: 'How small should a component be?',
        mentorComment: 'Great question—we will practice that judgment all week.',
        updatedAt: `${dayOneDate}T15:00:00.000Z`,
      },
      {
        learnerId: 'user-learner-maya',
        dayId: 'day-maya-2',
        learned: 'State lets a component remember values between renders.',
        built: 'A counter and a small todo list.',
        confused: 'Why state updates can be batched.',
        remember: 'Update arrays without mutating them.',
        question: 'When should state move to a parent?',
        mentorComment: '',
        updatedAt: `${dayTwoDate}T15:00:00.000Z`,
      },
    ],
  }
}
