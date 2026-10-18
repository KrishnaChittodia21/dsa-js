import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, ListTree, Search } from 'lucide-react';
import { openPalette } from '../lib/appEvents.js';

/** 404: a voxel column that fell over, the path that missed, and three ways back. */
export default function NotFound() {
  const { pathname } = useLocation();
  return (
    <div className="page nf-page">
      <section className="tile tile--glow nf rise" aria-labelledby="nf-t">
        <div className="nf-art" aria-hidden="true">
          <div className="vox nf-v1" style={{ '--h': 2 }} />
          <div className="vox vox--uv nf-v2" style={{ '--h': 3 }} />
          <div className="vox vox--ghost nf-v3" style={{ '--h': 1 }} />
          <span className="cube nf-c1" style={{ '--s': '22px', '--c': 'var(--plasma)' }} />
          <span className="cube nf-c2" style={{ '--s': '16px', '--c': 'var(--uv)' }} />
        </div>
        <div className="nf-body">
          <span className="eyebrow">
            <i className="pip" aria-hidden="true" />
            index out of range
          </span>
          <h1 id="nf-t" className="nf-code chrome">
            404
          </h1>
          <h2 className="h2">Page not found</h2>
          <p className="body">That page doesn&apos;t exist, or its content hasn&apos;t been written yet.</p>
          <code className="nf-path">GET {pathname} → undefined</code>
          <div className="nf-acts">
            <Link to="/" className="btn btn--plasma">
              Back to the dashboard <ArrowRight aria-hidden="true" />
            </Link>
            <Link to="/contents" className="btn btn--ghost">
              <ListTree aria-hidden="true" /> Contents
            </Link>
            <button type="button" className="btn btn--ghost" onClick={openPalette}>
              <Search aria-hidden="true" /> Search
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
