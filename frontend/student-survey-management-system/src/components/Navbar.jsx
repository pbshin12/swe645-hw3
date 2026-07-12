// Author: Peter Shin (pshin2, G01073633)
// Top navigation bar: switches between the survey form and the list of all surveys.
function Navbar({ view, onNewSurvey, onViewSurveys }) {
  return (
    <nav className="navbar navbar-dark bg-dark">
      <div className="container">
        <a
          className="navbar-brand fw-bold"
          href=""
          onClick={(e) => {
            e.preventDefault()
            onNewSurvey()
          }}
        >
          Totally Real University
        </a>
        <div className="navbar-nav flex-row gap-3">
          <button
            type="button"
            className={`nav-link ${view === 'form' ? 'active fw-bold' : ''}`}
            onClick={onNewSurvey}
          >
            New Survey
          </button>
          <button
            type="button"
            className={`nav-link ${view === 'list' ? 'active fw-bold' : ''}`}
            onClick={onViewSurveys}
          >
            All Surveys
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
