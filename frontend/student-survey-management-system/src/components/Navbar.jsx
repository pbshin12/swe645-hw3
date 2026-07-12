// Author: Peter Shin (pshin2, G01073633)
// Top navigation bar with the university brand and placeholder links.
function Navbar() {
  return (
    <nav className="navbar navbar-dark bg-dark">
      <div className="container">
        <a className="navbar-brand fw-bold" href="">
          Totally Real University
        </a>
        <div className="navbar-nav flex-row gap-3">
          <a className="nav-link" href="">Home</a>
          <a className="nav-link" href="">About</a>
          <a className="nav-link" href="">Contact</a>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
