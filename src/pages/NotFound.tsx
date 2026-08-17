import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="px-6 md:px-12 min-h-[70vh] flex flex-col justify-center items-start max-w-4xl mx-auto">
      <div className="font-heading text-7xl md:text-9xl font-light tracking-tight text-accent tnum">404</div>
      <h1 className="font-heading text-3xl md:text-5xl font-light tracking-tight mt-6">
        This page hasn’t been built — yet.
      </h1>
      <p className="mt-6 text-muted max-w-md leading-relaxed">
        The page you’re after has moved or never existed. Let’s get you back to
        solid ground.
      </p>
      <Link
        to="/"
        className="mt-10 rounded-full border border-rule px-7 py-3 text-xs tracking-[0.2em] uppercase hover:border-accent hover:text-accent transition-colors"
      >
        Back home
      </Link>
    </div>
  );
}
