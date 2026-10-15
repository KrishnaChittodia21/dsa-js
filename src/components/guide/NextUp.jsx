import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/** "Next up" footer at the end of a tab's content: one obvious way forward. */
export default function NextUp({ lead, label, to, onClick }) {
  return (
    <div className="next-up">
      <span className="next-up-lead">{lead}</span>
      {to ? (
        <Link to={to} className="btn btn-primary" onClick={onClick}>
          {label} <ArrowRight size={16} aria-hidden="true" />
        </Link>
      ) : (
        <button type="button" className="btn btn-primary" onClick={onClick}>
          {label} <ArrowRight size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
