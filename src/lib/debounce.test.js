import { afterEach, describe, expect, it, vi } from 'vitest'
import { createDebouncedTask } from './debounce.js'

describe('note autosave debounce', () => {
  afterEach(() => vi.useRealTimers())

  it('waits 800 ms and saves only the latest field values', () => {
    vi.useFakeTimers()
    const save = vi.fn()
    const autosave = createDebouncedTask(save, 800)

    autosave.schedule({ learned: 'First draft' })
    vi.advanceTimersByTime(500)
    autosave.schedule({ learned: 'Final draft' })
    vi.advanceTimersByTime(799)
    expect(save).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith({ learned: 'Final draft' })
  })

  it('can cancel a pending save when it is no longer needed', () => {
    vi.useFakeTimers()
    const save = vi.fn()
    const autosave = createDebouncedTask(save, 800)
    autosave.schedule({ learned: 'Unsaved' })
    autosave.cancel()
    vi.runAllTimers()
    expect(save).not.toHaveBeenCalled()
  })

  it('can flush the latest change before leaving the note page', () => {
    vi.useFakeTimers()
    const save = vi.fn()
    const autosave = createDebouncedTask(save, 800)
    autosave.schedule({ learned: 'Keep this change' })
    autosave.flush()
    expect(save).toHaveBeenCalledWith({ learned: 'Keep this change' })
  })
})
