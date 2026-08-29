import Link from 'next/link';
import {
  Flame,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  MapPin,
  Users,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
} from 'lucide-react';
import { CATEGORIES } from '@/lib/utils';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-primary-950 to-slate-900 text-white pt-24 pb-32">
        {/* Glow Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[350px] h-[350px] bg-accent-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-accent-300 mb-8 shadow-inner">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen Civic Action Engine</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] mb-6">
              Where Public Issues Become{' '}
              <span className="bg-gradient-to-r from-accent-400 via-amber-300 to-accent-500 bg-clip-text text-transparent">
                Priorities
              </span>{' '}
              for Action.
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed mb-10 font-normal">
              JanBindu crowdsources societal challenges, measures urgency using smart engagement
              and location density algorithms, and fast-tracks action with local authorities.
            </p>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/create"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-base shadow-lg shadow-primary-600/30 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-5 h-5 text-accent-300" />
                Report an Issue
              </Link>
              <Link
                href="/feed"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-base border border-white/20 backdrop-blur-md transition-all flex items-center justify-center gap-2"
              >
                Explore Live Feed
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Live Metric Highlights */}
      <section className="bg-white border-y border-gray-200/80 -mt-12 relative z-20 max-w-6xl mx-auto rounded-2xl shadow-xl p-6 sm:p-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
          <div className="pt-4 lg:pt-0">
            <div className="text-3xl sm:text-4xl font-extrabold text-primary-600">100%</div>
            <div className="text-xs sm:text-sm font-medium text-gray-500 mt-1">
              Transparent Scoring
            </div>
          </div>
          <div className="pt-4 lg:pt-0">
            <div className="text-3xl sm:text-4xl font-extrabold text-accent-600">5km</div>
            <div className="text-xs sm:text-sm font-medium text-gray-500 mt-1">
              Cluster Density Radius
            </div>
          </div>
          <div className="pt-4 lg:pt-0">
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600">&ge; 50</div>
            <div className="text-xs sm:text-sm font-medium text-gray-500 mt-1">
              Auto-Escalation Threshold
            </div>
          </div>
          <div className="pt-4 lg:pt-0">
            <div className="text-3xl sm:text-4xl font-extrabold text-indigo-600">24/7</div>
            <div className="text-xs sm:text-sm font-medium text-gray-500 mt-1">
              Civic Engagement
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              The JanBindu Solution
            </h2>
            <p className="mt-3 text-base text-gray-600">
              Transforming scattered public complaints into organized, weighted priorities that
              authorities cannot ignore.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-xs hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-lg mb-6">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">1. Crowdsource & Tag</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Citizens report civic issues with photographs, precise GPS coordinates, and
                criticality ratings.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-xs hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-lg mb-6">
                <Flame className="w-6 h-6 fill-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">2. Priority Algorithm</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Our dynamic JanBindu algorithm weights upvotes, shares, density of nearby reports,
                and criticality to bubble pressing problems to the top.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-xs hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-lg mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">3. Authority Action</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Issues surpassing the threshold automatically notify municipality & government
                officials with complete audit trails.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Category Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                Reportable Categories
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Filter and browse issues across various civic sectors.
              </p>
            </div>
            <Link
              href="/feed"
              className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              View all issues &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.value}
                href={`/feed?category=${cat.value}`}
                className="p-5 rounded-2xl border border-gray-200/80 bg-slate-50/50 hover:bg-primary-50 hover:border-primary-200 transition-all group"
              >
                <span className="block font-bold text-sm text-gray-900 group-hover:text-primary-700 transition-colors">
                  {cat.label}
                </span>
                <span className="text-xs text-gray-500 mt-1 block">Explore reports &rarr;</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="bg-primary-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black mb-4">Be the Voice of Your Neighborhood</h2>
          <p className="text-slate-300 text-base mb-8">
            Empower your community. Connect directly with municipal authorities today.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-accent-500 hover:bg-accent-400 text-slate-950 font-extrabold text-base shadow-xl active:scale-95 transition-all"
          >
            Create Your Free Account
          </Link>
        </div>
      </section>
    </div>
  );
}
