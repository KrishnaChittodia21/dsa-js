import { Link } from 'react-router-dom';

/** Colophon at the end of every page — like the last line of a printed book. */
export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-row">
        <span>
          <Link to="/">DSA Journey</Link> — set in Fraunces, Atkinson Hyperlegible & IBM Plex Mono.
        </span>
        <span className="folio">© 2026 · keep going, one pattern at a time</span>
      </div>
    </footer>
  );
}
