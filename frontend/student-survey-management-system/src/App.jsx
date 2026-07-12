// Author: Peter Shin (pshin2, G01073633)
// Root component: switches between the survey form (create/edit) and the
// list of all recorded surveys.
import { useState } from 'react'
import Navbar from './components/Navbar.jsx'
import SurveyForm from './components/SurveyForm.jsx'
import SurveyList from './components/SurveyList.jsx'
import { fromApiRecord } from './api.js'

function App() {
  const [view, setView] = useState('form') // 'form' | 'list'
  const [editing, setEditing] = useState(null) // form-shaped survey being edited

  const showForm = () => {
    setEditing(null)
    setView('form')
  }
  const showList = () => {
    setEditing(null)
    setView('list')
  }
  const startEdit = (record) => {
    setEditing(fromApiRecord(record))
    setView('form')
  }

  return (
    <>
      <Navbar view={view} onNewSurvey={showForm} onViewSurveys={showList} />
      <div
        className="container my-5"
        style={{ maxWidth: view === 'list' ? '960px' : '720px' }}
      >
        {view === 'form' ? (
          <>
            <h1 className="mb-1">
              {editing ? `Edit Survey #${editing.id}` : 'Student Survey'}
            </h1>
            <p className="text-secondary mb-4">
              Fields marked with <span className="text-danger">*</span> are required.
            </p>
            {/* key remounts the form when switching between create and edits */}
            <SurveyForm
              key={editing?.id ?? 'new'}
              editing={editing}
              onSaved={editing ? showList : null}
            />
          </>
        ) : (
          <>
            <h1 className="mb-1">All Surveys</h1>
            <p className="text-secondary mb-4">
              Every survey recorded to date. Edit opens the survey in the form.
            </p>
            <SurveyList onEdit={startEdit} />
          </>
        )}
      </div>
    </>
  )
}

export default App
