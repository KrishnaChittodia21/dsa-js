import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page page-narrow lost ink-in">
      <p className="lost-folio folio">p. 404</p>
      <h1>
        This page isn&apos;t in the <em>notebook</em>.
      </h1>
      <p className="standfirst">The link may be old, or the page hasn&apos;t been written yet. Everything that does exist is listed in the contents.</p>
      <p className="lost-actions">
        <Link to="/" className="btn btn-primary">
          Back to today&apos;s page
        </Link>
        <Link to="/contents" className="desk-alt">
          or open the contents
        </Link>
      </p>
    </div>
  );
}
