export function createDebouncedTask(task, delay = 800, timers = globalThis) {
  let timeoutId = null
  let pendingArgs = null

  function run() {
    timeoutId = null
    if (!pendingArgs) return
    const args = pendingArgs
    pendingArgs = null
    task(...args)
  }

  function cancel() {
    if (timeoutId !== null) timers.clearTimeout(timeoutId)
    timeoutId = null
    pendingArgs = null
  }

  return {
    schedule(...args) {
      if (timeoutId !== null) timers.clearTimeout(timeoutId)
      pendingArgs = args
      timeoutId = timers.setTimeout(run, delay)
    },
    cancel,
    flush() {
      if (timeoutId !== null) timers.clearTimeout(timeoutId)
      run()
    },
  }
}
