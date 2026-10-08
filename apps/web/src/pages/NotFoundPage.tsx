import { Link } from "react-router";
import { SECTION_ART } from "../art/manifest";
import { useBackdrop } from "../components/Backdrop";

export function NotFoundPage() {
  useBackdrop(SECTION_ART.notFound, { strength: 0.6, side: "full" });
  return (
    <div className="flex flex-col items-start gap-4 py-16">
      <p className="m-label">Error 404</p>
      <h1 className="m-heading m-title">No record found</h1>
      <p className="m-intro">This page isn't in the archive.</p>
      <Link to="/" className="m-pill-link">
        Back to home
      </Link>
    </div>
  );
}
