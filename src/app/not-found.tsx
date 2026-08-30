import Link from 'next/link';
import { Flame, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center mb-4">
        <Flame className="w-6 h-6" />
      </div>
      <h2 className="text-2xl font-black text-slate-900 mb-2">Page Not Found</h2>
      <p className="text-sm text-slate-500 max-w-sm mb-6">
        The public issue or page you are looking for does not exist or has been removed.
      </p>
      <Link
        href="/feed"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs shadow-md transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Issues Feed
      </Link>
    </div>
  );
}
