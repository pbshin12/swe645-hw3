// Author: Peter Shin (pshin2, G01073633)
// Student survey form: personal info and campus feedback.
import { useState } from 'react'

const LIKE_OPTIONS = [
  { id: 'students', label: 'Students' },
  { id: 'location', label: 'Location' },
  { id: 'campus', label: 'Campus' },
  { id: 'atmosphere', label: 'Atmosphere' },
  { id: 'dorms', label: 'Dorm Rooms' },
  { id: 'sports', label: 'Sports' },
]

const INTEREST_OPTIONS = [
  { id: 'friends', label: 'Friends' },
  { id: 'television', label: 'Television' },
  { id: 'internet', label: 'Internet' },
  { id: 'other', label: 'Other' },
]

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  streetAddress: '',
  city: '',
  state: '',
  zip: '',
  telephone: '',
  email: '',
  surveyDate: '',
  likes: [],
  interest: '',
  recommendation: '',
}

function SurveyForm() {
  const [form, setForm] = useState(EMPTY_FORM)

  const setField = (name, value) =>
    setForm((prev) => ({ ...prev, [name]: value }))

  const toggleLike = (id) =>
    setForm((prev) => ({
      ...prev,
      likes: prev.likes.includes(id)
        ? prev.likes.filter((like) => like !== id)
        : [...prev.likes, id],
    }))

  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: POST the form to the backend survey API once it exists
    console.log('Survey submission:', form)
    alert('Survey submitted! (Backend not wired up yet — data logged to the console.)')
  }

  const handleReset = () => setForm(EMPTY_FORM)

  return (
    <form onSubmit={handleSubmit}>
      {/* Personal Information */}
      <h5 className="border-bottom pb-2 mb-3">Personal Information</h5>

      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <label htmlFor="firstName" className="form-label">
            First Name <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className="form-control"
            id="firstName"
            value={form.firstName}
            onChange={(e) => setField('firstName', e.target.value)}
            required
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="lastName" className="form-label">
            Last Name <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className="form-control"
            id="lastName"
            value={form.lastName}
            onChange={(e) => setField('lastName', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="mb-3">
        <label htmlFor="streetAddress" className="form-label">
          Street Address <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          className="form-control"
          id="streetAddress"
          value={form.streetAddress}
          onChange={(e) => setField('streetAddress', e.target.value)}
          required
        />
      </div>

      <div className="row g-3 mb-3">
        <div className="col-md-5">
          <label htmlFor="city" className="form-label">
            City <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className="form-control"
            id="city"
            value={form.city}
            onChange={(e) => setField('city', e.target.value)}
            required
          />
        </div>
        <div className="col-md-4">
          <label htmlFor="state" className="form-label">
            State <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className="form-control"
            id="state"
            value={form.state}
            onChange={(e) => setField('state', e.target.value)}
            required
          />
        </div>
        <div className="col-md-3">
          <label htmlFor="zip" className="form-label">
            Zip <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className="form-control"
            id="zip"
            value={form.zip}
            onChange={(e) => setField('zip', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <label htmlFor="telephone" className="form-label">
            Telephone Number <span className="text-danger">*</span>
          </label>
          <input
            type="tel"
            className="form-control"
            id="telephone"
            value={form.telephone}
            onChange={(e) => setField('telephone', e.target.value)}
            required
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="email" className="form-label">
            E-mail <span className="text-danger">*</span>
          </label>
          <input
            type="email"
            className="form-control"
            id="email"
            value={form.email}
            onChange={(e) => setField('email', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="surveyDate" className="form-label">
          Date of Survey <span className="text-danger">*</span>
        </label>
        <input
          type="date"
          className="form-control"
          id="surveyDate"
          value={form.surveyDate}
          onChange={(e) => setField('surveyDate', e.target.value)}
          required
        />
      </div>

      {/* Campus Likes */}
      <h5 className="border-bottom pb-2 mb-3">What did you like most about the campus?</h5>
      <div className="row g-2 mb-4">
        {LIKE_OPTIONS.map(({ id, label }) => (
          <div className="col-6 col-md-4" key={id}>
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id={`like-${id}`}
                checked={form.likes.includes(id)}
                onChange={() => toggleLike(id)}
              />
              <label className="form-check-label" htmlFor={`like-${id}`}>
                {label}
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* How did you hear about us */}
      <h5 className="border-bottom pb-2 mb-3">How did you become interested in the university?</h5>
      <div className="row g-2 mb-4">
        {INTEREST_OPTIONS.map(({ id, label }) => (
          <div className="col-6 col-md-3" key={id}>
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name="interest"
                id={`interest-${id}`}
                checked={form.interest === id}
                onChange={() => setField('interest', id)}
              />
              <label className="form-check-label" htmlFor={`interest-${id}`}>
                {label}
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* Likelihood of recommendation */}
      <h5 className="border-bottom pb-2 mb-3">How likely are you to recommend this school?</h5>
      <div className="mb-4">
        <select
          className="form-select"
          id="recommendation"
          value={form.recommendation}
          onChange={(e) => setField('recommendation', e.target.value)}
        >
          <option value="" disabled>Select an option</option>
          <option value="very-likely">Very Likely</option>
          <option value="likely">Likely</option>
          <option value="unlikely">Unlikely</option>
        </select>
      </div>

      {/* Buttons */}
      <div className="d-flex gap-2">
        <button type="submit" className="btn btn-light fw-bold">Submit</button>
        <button type="button" className="btn btn-outline-secondary" onClick={handleReset}>
          Reset
        </button>
      </div>
    </form>
  )
}

export default SurveyForm
