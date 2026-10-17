import { Link } from 'react-router-dom';

/** "Next up" band at the end of a tab's content: one obvious way forward. */
export default function NextUp({ lead, label, to, onClick }) {
  const text = (
    <>
      {label} <span aria-hidden="true">→</span>
    </>
  );
  return (
    <div className="next-up">
      <span className="next-up-lead">{lead}</span>
      {to ? (
        <Link to={to} className="btn btn-primary" onClick={onClick}>
          {text}
        </Link>
      ) : (
        <button type="button" className="btn btn-primary" onClick={onClick}>
          {text}
        </button>
      )}
    </div>
  );
}
