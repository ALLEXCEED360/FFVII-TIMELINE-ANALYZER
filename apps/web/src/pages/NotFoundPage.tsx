import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-start gap-4 py-16">
      <p className="label text-ember-400">Error 404</p>
      <h1 className="font-display text-3xl font-semibold text-steel-100">No record found</h1>
      <p className="text-steel-300">This page isn't in the archive.</p>
      <Link to="/" className="btn">
        Back to home
      </Link>
    </div>
  );
}
