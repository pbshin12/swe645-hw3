// Author: Peter Shin (pshin2, G01073633)
// Table of all recorded surveys with Edit and Delete actions per row.
import { useEffect, useState } from 'react'
import { listSurveys, deleteSurvey } from '../api.js'

// Display labels for the liked_most ids stored by the survey form.
const LIKE_LABELS = {
  students: 'Students',
  location: 'Location',
  campus: 'Campus',
  atmosphere: 'Atmosphere',
  dorms: 'Dorm Rooms',
  sports: 'Sports',
}

const formatLikes = (likedMost) =>
  likedMost
    ? likedMost
        .split(',')
        .map((id) => LIKE_LABELS[id] ?? id)
        .join(', ')
    : '—'

function SurveyList({ onEdit }) {
  const [surveys, setSurveys] = useState(null) // null = still loading
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0) // bump to refetch

  useEffect(() => {
    let cancelled = false
    listSurveys()
      .then((data) => !cancelled && setSurveys(data))
      .catch((err) => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const load = () => {
    setSurveys(null)
    setError(null)
    setReloadKey((k) => k + 1)
  }

  const handleDelete = async (id) => {
    if (!window.confirm(`Delete survey #${id}? This cannot be undone.`)) return
    try {
      await deleteSurvey(id)
      setSurveys((prev) => prev.filter((s) => s.id !== id))
    } catch (err) {
      alert(`Deleting the survey failed: ${err.message}`)
    }
  }

  if (error) {
    return (
      <div className="alert alert-danger d-flex justify-content-between align-items-center">
        <span>Could not load surveys: {error}</span>
        <button className="btn btn-sm btn-outline-light" onClick={load}>
          Retry
        </button>
      </div>
    )
  }
  if (surveys === null) return <p className="text-secondary">Loading surveys…</p>
  if (surveys.length === 0)
    return <p className="text-secondary">No surveys recorded yet.</p>

  return (
    <div className="table-responsive">
      <table className="table table-dark table-striped align-middle">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>City</th>
            <th>Email</th>
            <th>Date</th>
            <th>Liked Most</th>
            <th>Recommends?</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {surveys.map((s) => (
            <tr key={s.id}>
              <td>{s.id}</td>
              <td>
                {s.first_name} {s.last_name}
              </td>
              <td>
                {s.city}, {s.state}
              </td>
              <td>{s.email}</td>
              <td>{s.survey_date}</td>
              <td>{formatLikes(s.liked_most)}</td>
              <td>{s.recommendation}</td>
              <td className="text-end text-nowrap">
                <button
                  className="btn btn-sm btn-outline-light me-2"
                  onClick={() => onEdit(s)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => handleDelete(s.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default SurveyList
