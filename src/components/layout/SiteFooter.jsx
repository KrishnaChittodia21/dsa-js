import { Link } from 'react-router-dom';
import LogoMark from '../ui/LogoMark.jsx';

/** Footer at the end of every page: logo + wordmark on the left, mono copyright line on the right. */
export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-row">
        <Link to="/" className="brand footer-brand">
          <LogoMark size={22} />
          <span className="brand-name">
            DSA Journey<i>.js</i>
          </span>
        </Link>
        <span className="footer-copy">© 2026 DSA Journey · learn it pattern by pattern</span>
      </div>
    </footer>
  );
}
