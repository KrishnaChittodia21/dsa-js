import { Link } from 'react-router-dom';
import { Network } from 'lucide-react';

/** Footer at the end of every page: brand on the left, copyright on the right (stacks on phones). */
export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-row">
        <Link to="/" className="brand footer-brand">
          <span className="brand-tile" aria-hidden="true">
            <Network size={16} strokeWidth={2.4} />
          </span>
          <span className="brand-name">DSA Journey</span>
        </Link>
        <span className="footer-copy">© 2026 DSA Journey</span>
      </div>
    </footer>
  );
}
