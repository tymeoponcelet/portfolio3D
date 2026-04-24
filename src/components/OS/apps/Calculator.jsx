import { useReducer, useEffect, useCallback } from 'react'

// ── Expression evaluator (supports × / priority) ──────────────

function evaluate(tokens) {
  const nums = []
  const ops  = []
  for (let i = 0; i < tokens.length; i++) {
    if (i % 2 === 0) nums.push(tokens[i])
    else             ops.push(tokens[i])
  }
  // Pass 1: × and /
  let i = 0
  while (i < ops.length) {
    if (ops[i] === '×' || ops[i] === '/') {
      if (ops[i] === '/' && nums[i + 1] === 0) return null
      const r = ops[i] === '×' ? nums[i] * nums[i + 1] : nums[i] / nums[i + 1]
      nums.splice(i, 2, r)
      ops.splice(i, 1)
    } else {
      i++
    }
  }
  // Pass 2: + and −
  let result = nums[0]
  for (let j = 0; j < ops.length; j++) {
    result = ops[j] === '+' ? result + nums[j + 1] : result - nums[j + 1]
  }
  return result
}

function fmt(n) {
  if (!isFinite(n) || isNaN(n)) return 'Erreur'
  let s = parseFloat(n.toPrecision(12)).toString()
  if (s.length > 13) s = n.toExponential(6)
  return s
}

// ── Reducer ────────────────────────────────────────────────────

const INIT = { display: '0', tokens: [], currentOp: null, waitingForOperand: false, justEvaluated: false }

function reducer(state, { type, payload }) {
  const { display, tokens, currentOp, waitingForOperand, justEvaluated } = state

  switch (type) {
    case 'DIGIT': {
      if (display === 'Erreur') return { ...INIT, display: payload === '0' ? '0' : payload }
      if (waitingForOperand)   return { ...state, display: payload, waitingForOperand: false }
      if (justEvaluated)       return { ...INIT, display: payload }
      return { ...state, display: display === '0' ? payload : display + payload, justEvaluated: false }
    }
    case 'DOT': {
      if (display === 'Erreur') return { ...INIT, display: '0.' }
      if (waitingForOperand)    return { ...state, display: '0.', waitingForOperand: false }
      if (display.includes('.')) return state
      return { ...state, display: display + '.', justEvaluated: false }
    }
    case 'OP': {
      if (display === 'Erreur') return state
      const num = parseFloat(display)
      if (waitingForOperand) return { ...state, currentOp: payload }
      const newTokens = currentOp !== null
        ? [...tokens, currentOp, num]
        : [num]
      return { ...state, tokens: newTokens, currentOp: payload, waitingForOperand: true, justEvaluated: false }
    }
    case 'EQUALS': {
      if (display === 'Erreur') return { ...INIT }
      const num = parseFloat(display)
      const finalTokens = currentOp !== null
        ? [...tokens, currentOp, num]
        : tokens.length > 0 ? [...tokens, num] : [num]
      if (finalTokens.length < 3) return { ...state, justEvaluated: true }
      const result = evaluate(finalTokens)
      if (result === null) return { ...INIT, display: 'Erreur' }
      return { ...INIT, display: fmt(result), justEvaluated: true }
    }
    case 'CLEAR':       return { ...INIT }
    case 'CLEAR_ENTRY': return { ...state, display: '0', waitingForOperand: false }
    case 'BACKSPACE': {
      if (waitingForOperand || justEvaluated || display === 'Erreur') return state
      return { ...state, display: display.length > 1 ? display.slice(0, -1) : '0' }
    }
    case 'SQRT': {
      const n = parseFloat(display)
      if (n < 0) return { ...state, display: 'Erreur', waitingForOperand: true }
      return { ...state, display: fmt(Math.sqrt(n)), waitingForOperand: true, justEvaluated: true }
    }
    case 'RECIPROCAL': {
      const n = parseFloat(display)
      if (n === 0) return { ...state, display: 'Erreur', waitingForOperand: true }
      return { ...state, display: fmt(1 / n), waitingForOperand: true, justEvaluated: true }
    }
    case 'PERCENT':
      return { ...state, display: fmt(parseFloat(display) / 100), justEvaluated: true }
    case 'NEGATE': {
      if (display === '0' || display === 'Erreur') return state
      return { ...state, display: display.startsWith('-') ? display.slice(1) : '-' + display }
    }
    default: return state
  }
}

// ── Button layout ──────────────────────────────────────────────

const BUTTONS = [
  { label: 'Ret',  action: { type: 'BACKSPACE' },            cls: 'win95-calc-btn-fn' },
  { label: 'CE',   action: { type: 'CLEAR_ENTRY' },          cls: 'win95-calc-btn-fn' },
  { label: 'C',    action: { type: 'CLEAR' },                cls: 'win95-calc-btn-fn' },
  { label: '7',    action: { type: 'DIGIT', payload: '7' },  cls: '' },
  { label: '8',    action: { type: 'DIGIT', payload: '8' },  cls: '' },
  { label: '9',    action: { type: 'DIGIT', payload: '9' },  cls: '' },
  { label: '/',    action: { type: 'OP',    payload: '/' },  cls: '' },
  { label: '√',    action: { type: 'SQRT' },                 cls: 'win95-calc-btn-fn' },
  { label: '4',    action: { type: 'DIGIT', payload: '4' },  cls: '' },
  { label: '5',    action: { type: 'DIGIT', payload: '5' },  cls: '' },
  { label: '6',    action: { type: 'DIGIT', payload: '6' },  cls: '' },
  { label: '×',    action: { type: 'OP',    payload: '×' },  cls: '' },
  { label: '%',    action: { type: 'PERCENT' },              cls: 'win95-calc-btn-fn' },
  { label: '1',    action: { type: 'DIGIT', payload: '1' },  cls: '' },
  { label: '2',    action: { type: 'DIGIT', payload: '2' },  cls: '' },
  { label: '3',    action: { type: 'DIGIT', payload: '3' },  cls: '' },
  { label: '−',    action: { type: 'OP',    payload: '-' },  cls: '' },
  { label: '1/x',  action: { type: 'RECIPROCAL' },           cls: 'win95-calc-btn-fn' },
  { label: '0',    action: { type: 'DIGIT', payload: '0' },  cls: '' },
  { label: '+/−',  action: { type: 'NEGATE' },               cls: '' },
  { label: '.',    action: { type: 'DOT' },                  cls: '' },
  { label: '+',    action: { type: 'OP',    payload: '+' },  cls: '' },
  { label: '=',    action: { type: 'EQUALS' },               cls: 'win95-calc-btn-eq' },
]

// ── Component ──────────────────────────────────────────────────

export function Calculator() {
  const [state, dispatch] = useReducer(reducer, INIT)

  const handleKey = useCallback((e) => {
    const k = e.key
    if (k >= '0' && k <= '9') dispatch({ type: 'DIGIT', payload: k })
    else if (k === '+')         dispatch({ type: 'OP', payload: '+' })
    else if (k === '-')         dispatch({ type: 'OP', payload: '-' })
    else if (k === '*')         dispatch({ type: 'OP', payload: '×' })
    else if (k === '/')        { e.preventDefault(); dispatch({ type: 'OP', payload: '/' }) }
    else if (k === '.')         dispatch({ type: 'DOT' })
    else if (k === 'Enter')    { e.preventDefault(); dispatch({ type: 'EQUALS' }) }
    else if (k === 'Escape')    dispatch({ type: 'CLEAR' })
    else if (k === 'Backspace') dispatch({ type: 'BACKSPACE' })
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  return (
    <div style={{ padding: 6, display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
      {/* Display */}
      <div className="win95-calc-display">{state.display}</div>

      {/* Grid: 5 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 3, flex: 1, paddingTop: 6 }}>
        {/* Row 0: Ret / CE / C — first 3 of 5 cols */}
        {BUTTONS.slice(0, 3).map((btn) => (
          <button
            key={btn.label}
            className={`win95-calc-btn ${btn.cls}`}
            onMouseDown={() => dispatch(btn.action)}
          >
            {btn.label}
          </button>
        ))}
        <div /><div />

        {/* Rows 1–4: 5 buttons each */}
        {BUTTONS.slice(3).map((btn) => (
          <button
            key={btn.label}
            className={`win95-calc-btn ${btn.cls}`}
            onMouseDown={() => dispatch(btn.action)}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  )
}
