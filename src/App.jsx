import { useRef, useState } from 'react'
import * as toxicity from '@tensorflow-models/toxicity'
import '@tensorflow/tfjs'
import './App.css'

const MODERATION_THRESHOLD = 0.9

function App() {
  const [input, setInput] = useState('')
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const modelPromiseRef = useRef(null)

  const loadModel = async () => {
    if (!modelPromiseRef.current) {
      modelPromiseRef.current = toxicity.load(MODERATION_THRESHOLD)
    }

    return modelPromiseRef.current
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const trimmedInput = input.trim()
    if (!trimmedInput) {
      setResult({ type: 'error', message: 'Please enter some text to moderate.' })
      return
    }

    try {
      setStatus('checking')
      setResult(null)

      const model = await loadModel()
      const predictions = await model.classify([trimmedInput])
      const matchedLabels = predictions
        .filter(({ results }) => results[0]?.match)
        .map(({ label }) => label)

      if (matchedLabels.length > 0) {
        setResult({
          type: 'blocked',
          message: `Submission blocked: potential harmful content detected (${matchedLabels.join(', ')}).`,
        })
      } else {
        setResult({
          type: 'success',
          message: 'Submission approved. No harmful content was detected.',
        })
      }
    } catch (error) {
      console.error(error)
      setResult({
        type: 'error',
        message: 'Moderation could not be completed. Please try again.',
      })
    } finally {
      setStatus('idle')
    }
  }

  return (
    <main className="moderation-page">
      <h1>Submit-time Content Moderation</h1>
      <p className="description">
        Check text for harmful language on client-side submit using React and
        TensorFlow toxicity.
      </p>

      <form onSubmit={handleSubmit} className="moderation-form">
        <label htmlFor="content-input">Content</label>
        <textarea
          id="content-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Type your message..."
          rows={5}
        />

        <button type="submit" disabled={status === 'checking'}>
          {status === 'checking' ? 'Checking…' : 'Submit'}
        </button>
      </form>

      {result && (
        <p className={`result ${result.type}`} role="status">
          {result.message}
        </p>
      )}
    </main>
  )
}

export default App
