// Author: Peter Shin (pshin2, G01073633)
// Root component: composes the page from the navbar and the student survey form.
import Navbar from './components/Navbar.jsx'
import SurveyForm from './components/SurveyForm.jsx'

function App() {
  return (
    <>
      <Navbar />
      <div className="container my-5" style={{ maxWidth: '720px' }}>
        <h1 className="mb-1">Student Survey</h1>
        <p className="text-secondary mb-4">
          Fields marked with <span className="text-danger">*</span> are required.
        </p>
        <SurveyForm />
      </div>
    </>
  )
}

export default App
