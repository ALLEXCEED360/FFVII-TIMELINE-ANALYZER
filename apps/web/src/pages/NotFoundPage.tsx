import { Link } from "react-router";
import { SECTION_ART } from "../art/manifest";
import { useBackdrop } from "../components/Backdrop";

export function NotFoundPage() {
  useBackdrop(SECTION_ART.notFound, { strength: 0.7 });
  return (
    <div className="flex flex-col items-start gap-4 py-16">
      <p className="label text-ember-400">Error 404</p>
      <h1 className="page-title">No record found</h1>
      <p className="text-steel-300">This page isn't in the archive.</p>
      <Link to="/" className="btn">
        Back to home
      </Link>
    </div>
  );
}
