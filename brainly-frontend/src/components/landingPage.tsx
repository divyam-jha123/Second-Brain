import { Link } from "react-router-dom";
import { BrainIcon } from "../icons/brainIcon";
import { useState } from "react"; // CHANGED: toggle state for mobile menu

export const LandingPage = () => {
  const [isNavOpen, setIsNavOpen] = useState(false); // CHANGED: mobile header toggle

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">{/* CHANGED: prevent horizontal scroll on mobile */}
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">{/* CHANGED: keep row header; mobile menu below */}
          <div className="flex items-center gap-2.5">
            <span className="text-purple-600">
              <BrainIcon size="lg" />
            </span>
            <span className="text-xl font-bold text-gray-900">Brain Expo</span>
          </div>

          

          {/* Desktop nav (unchanged structure, just ensure hidden on mobile) */}
          <div className="hidden md:flex items-center gap-8">{/* CHANGED: moved back to desktop-only */}
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Features</a>
            <a href="#preview" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Resources</a>
            <a href="#cta" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">{/* CHANGED: tighter gap on mobile */}
            {/* Mobile toggle (header items go inside) */}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-700 hover:bg-gray-50 active:scale-[0.99] transition min-h-[44px]" // CHANGED
              aria-label={isNavOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isNavOpen}
              onClick={() => setIsNavOpen((v) => !v)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                {isNavOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                )}
              </svg>
            </button>

            {/* Desktop login */}
            <Link
              to="/sign-in"
              className="hidden md:inline-flex text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors px-4 py-2"
            >
              Log in
            </Link>

            {/* Keep "Get started" visible always */}
            <Link
              to="/sign-up"
              className="text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 px-3 sm:px-3 py-2 rounded-lg transition-colors shadow-sm min-h-[44px] inline-flex items-center justify-center" /* CHANGED: touch target */
            >
              Start for free
          </Link>
            
          </div>
        </div>

        {/* Mobile menu content (header things inside toggle, except get started) */}
        <div className={`${isNavOpen ? "block" : "hidden"} md:hidden border-t border-gray-100 bg-white/90 backdrop-blur-md`}>{/* CHANGED */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col gap-1">
            <a href="#features" className="rounded-xl px-4 py-3 text-base font-semibold text-gray-800 hover:bg-gray-50 active:bg-gray-100 transition" onClick={() => setIsNavOpen(false)}>
              Features
            </a>
            <a href="#preview" className="rounded-xl px-4 py-3 text-base font-semibold text-gray-800 hover:bg-gray-50 active:bg-gray-100 transition" onClick={() => setIsNavOpen(false)}>
              Resources
            </a>
            <a href="#cta" className="rounded-xl px-4 py-3 text-base font-semibold text-gray-800 hover:bg-gray-50 active:bg-gray-100 transition" onClick={() => setIsNavOpen(false)}>
              Pricing
            </a>

            <Link
              to="/sign-in"
              className="rounded-xl px-4 py-3 text-base font-semibold text-gray-800 hover:bg-gray-50 active:bg-gray-100 transition"
              onClick={() => setIsNavOpen(false)}
            >
              Log in
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-50/80 via-white to-white" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[680px] sm:w-[800px] h-[520px] sm:h-[600px] bg-purple-200/30 rounded-full blur-3xl" />{/* CHANGED: scale background for small screens */}

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-12 sm:pb-16 text-center">{/* CHANGED: mobile-first padding */}
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-100 text-purple-700 text-[11px] sm:text-xs font-semibold px-3 sm:px-4 py-1.5 rounded-full mb-6 sm:mb-8">{/* CHANGED: smaller text + spacing on mobile */}
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            SAVE. ORGANIZE. SHARE. CAPTURE.
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-gray-900 leading-tight tracking-tight mb-5 sm:mb-6">{/* CHANGED: mobile-first font size */}
            Your Internet.{" "}
            <span className="bg-gradient-to-r from-purple-600 to-violet-500 bg-clip-text text-transparent">
              Organized.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">{/* CHANGED: readable on 320px */}
            Save tweets, videos, documents, and links in one place. Build your
            personal knowledge hub and never lose a great idea again.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 mb-10 sm:mb-16">{/* CHANGED: stack CTAs on mobile */}
            <Link
              to="/sign-up"
              className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-base px-6 sm:px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-purple-300 sm:hover:-translate-y-0.5 min-h-[48px]"/* CHANGED: touch target + responsive padding */
            >
              Start building for free
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <a
              href="#preview"
              className="inline-flex items-center justify-center gap-2 text-gray-700 font-semibold text-base px-6 py-3.5 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all min-h-[48px]"/* CHANGED: touch target + centered */
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
              </svg>
              Watch demo
            </a>
          </div>

          {/* Dashboard Preview */}
          <div id="preview" className="relative max-w-5xl mx-auto animate-riseUp">
            <div className="bg-white rounded-2xl shadow-2xl shadow-gray-200/50 border border-gray-200/80 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-3 text-xs text-gray-400">brainexpo.me</span>
              </div>
              <img
                src="/dashboard-preview.png"
                alt="Brain Expo Dashboard"
                className="w-full h-auto max-w-full"/* CHANGED: avoid overflow + keep responsive */
              />
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="py-16 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs font-semibold text-gray-400 tracking-widest uppercase mb-8">
            Trusted by over 50,000+ knowledge workers
          </p>
          <div className="flex items-center justify-center gap-12 md:gap-16 flex-wrap opacity-40">
            {["NOTION", "LINEAR", "RAYCAST", "GUMROAD", "LOOM"].map((name) => (
              <span key={name} className="text-xl md:text-2xl font-bold text-gray-900 tracking-wide">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
              Everything you need to stay sharp
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Stop juggling tabs. Brain Expo brings your digital life into a single,
              searchable interface.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-5 group-hover:bg-purple-200 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-purple-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Save Anything</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Capture YouTube videos, Twitter threads, PDFs, or code snippets with our one-click
                browser extensions.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-5 group-hover:bg-blue-200 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Organize Effortlessly</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Auto-categorize content using AI tags or create your own custom folders for
                specific projects.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mb-5 group-hover:bg-violet-200 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-violet-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0-12.814a2.25 2.25 0 1 0 0-2.186m0 2.186a2.25 2.25 0 1 0 0 2.186" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Share Your Brain</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Share your curated links or collaborate with teammates on shared knowledge
                boards in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Knowledge Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
                Your knowledge, visually curated.
              </h2>
              <p className="text-gray-500 mb-8 leading-relaxed">
                Forget messy bookmarks. Our visual-first approach helps you
                remember content through beautiful previews. Whether it's a
                YouTube tutorial or a deep-dive Twitter thread, see it exactly as it
                appeared.
              </p>

              <div className="space-y-4">
                {[
                  "Smart previews for over 500+ websites",
                  "Search within PDF and live content",
                  "Dark mode & custom themes included",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-purple-600">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-700 font-medium text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-100 to-violet-100 rounded-3xl blur-2xl opacity-40" />
              <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden p-6">
                <div className="space-y-4">
                  {/* Mock preview cards */}
                  <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-8 h-8 text-red-500">
                        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0C.488 3.45.029 5.804 0 12c.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0C23.512 20.55 23.971 18.196 24 12c-.029-6.185-.484-8.549-4.385-8.816zM9 16V8l8 4-8 4z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">How to Build a Brain Expo</p>
                      <p className="text-xs text-gray-400">YouTube • 1.2M views</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-7 h-7 text-blue-500">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Thread on Productivity Tips</p>
                      <p className="text-xs text-gray-400">Twitter • @productivedev</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-purple-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Product Strategy v1.pdf</p>
                      <p className="text-xs text-gray-400">Document • 12 KB</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="py-24 bg-gradient-to-br from-purple-600 via-purple-700 to-violet-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-300 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
            Start building your Brain Expo today.
          </h2>
          <p className="text-purple-200 text-lg mb-10 max-w-xl mx-auto">
            Join over 50+ million professionals who simplify work and life with the
            world's #1 personal knowledge manager.
          </p>
          <Link
            to="/sign-up"
            className="inline-flex items-center gap-2 bg-white text-purple-700 font-bold text-base px-8 py-4 rounded-xl hover:bg-purple-50 transition-all shadow-lg hover:-translate-y-0.5"
          >
            Get Started for Free
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <p className="text-purple-300 text-sm mt-4">No credit card required. Cancel anytime.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-purple-400">
                  <BrainIcon size="md" />
                </span>
                <span className="text-white font-bold">Brain Expo</span>
              </div>
              <p className="text-sm leading-relaxed">
                The all-in-one tool for your digital discoveries. Save, organize, and share
                everything that matters to you.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">PRODUCT</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Examples</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">COMPANY</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">RESOURCES</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>

            {/* Social */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">SOCIAL</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition-colors">YouTube</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Facebook</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Discord</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs">© 2024 Brain Expo Inc. All rights reserved.</p>
            <div className="flex gap-6 text-xs">
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Settings</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
