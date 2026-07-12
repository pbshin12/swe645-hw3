// Author: Peter Shin (pshin2, G01073633)
// Client for the survey REST API: CRUD calls plus converters between the
// camelCase form state and the snake_case fields the backend expects.

// Default: the backend's NodePort on whatever host is serving the frontend.
// Override for local dev with e.g. VITE_API_URL=http://localhost:8000 npm run dev
const API_BASE =
  import.meta.env.VITE_API_URL || `http://${window.location.hostname}:30611`

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`)
  return res.status === 204 ? null : res.json()
}

export const listSurveys = () => request('/surveys')
export const createSurvey = (payload) =>
  request('/surveys', { method: 'POST', body: JSON.stringify(payload) })
export const updateSurvey = (id, payload) =>
  request(`/surveys/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
export const deleteSurvey = (id) =>
  request(`/surveys/${id}`, { method: 'DELETE' })

// Form state (camelCase, likes as an array) → API payload (snake_case,
// liked_most as a comma-separated string).
export const toApiPayload = (form) => ({
  first_name: form.firstName,
  last_name: form.lastName,
  street_address: form.streetAddress,
  city: form.city,
  state: form.state,
  zip: form.zip,
  telephone: form.telephone,
  email: form.email,
  survey_date: form.surveyDate,
  liked_most: form.likes.join(','),
  interest_source: form.interest,
  recommendation: form.recommendation,
})

// API record → form state (keeps the id so the form knows it is editing).
export const fromApiRecord = (record) => ({
  id: record.id,
  firstName: record.first_name,
  lastName: record.last_name,
  streetAddress: record.street_address,
  city: record.city,
  state: record.state,
  zip: record.zip,
  telephone: record.telephone,
  email: record.email,
  surveyDate: record.survey_date,
  likes: record.liked_most ? record.liked_most.split(',') : [],
  interest: record.interest_source,
  recommendation: record.recommendation,
})
