import { Link } from 'react-router-dom';
import { EmptyState } from '../components/ui/primitives.jsx';

export default function NotFound() {
  return (
    <div className="page">
      <EmptyState icon="alert" title="Page not found">
        <p>That page doesn't exist (or its content hasn't been written yet).</p>
        <Link to="/" className="btn btn-primary">
          Back to the dashboard
        </Link>
      </EmptyState>
    </div>
  );
}
