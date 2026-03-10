import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Flag, Heart, MapPin, ExternalLink, Globe2, Sparkles, Sprout, HandHeart, Radio, PlaySquare, Compass, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = {
    title: 'About Us | Krishna Connect',
    description: "India's first Spiritual Social Media platform. Made in India, for the world.",
};

export default function AboutPage() {
    return (
        <div className="min-h-screen relative overflow-hidden bg-[#0a0a0a] text-foreground selection:bg-orange-500/30">

            {/* 
        ========================================================================
        Immersive Backdrop & Ambient Glows
        ========================================================================
      */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <Image
                    src="/background/india-bg.png"
                    alt="Indian Flag Watercolor Background"
                    fill
                    className="object-cover opacity-80 dark:opacity-30 mix-blend-luminosity brightness-75 contrast-125 saturate-150"
                    priority
                />

                {/* Ethereal Vignette & Noise overlays */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0a0a0a_100%)] opacity-90" />
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

                {/* Floating ambient orbs (Saffron, White, Green) */}
                <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-orange-600/20 rounded-full mix-blend-screen blur-[120px] animate-pulse pointer-events-none" style={{ animationDuration: '8s' }} />
                <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] bg-green-600/10 rounded-full mix-blend-screen blur-[100px] animate-pulse pointer-events-none" style={{ animationDuration: '12s' }} />
                <div className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] bg-white/5 rounded-full mix-blend-screen blur-[150px] pointer-events-none" />
            </div>

            {/* 
        ========================================================================
        Header / Navigation (Glassmorphic)
        ========================================================================
      */}
            <header className="fixed top-0 w-full z-50 transition-all duration-300 bg-black/20 backdrop-blur-xl border-b border-white/5">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="group flex items-center gap-3 text-white/70 hover:text-white transition-all">
                        <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/20 transition-colors backdrop-blur-md">
                            <ArrowLeft className="h-4 w-4" />
                        </div>
                        <span className="font-medium tracking-wide text-sm hidden sm:block">Back to Explore</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <div className="relative h-10 w-10 sm:h-12 sm:w-12">
                            <Image
                                src="/logo/krishna_connect.png"
                                alt="Krishna Connect Logo"
                                fill
                                className="object-contain drop-shadow-[0_0_15px_rgba(255,152,0,0.5)]"
                            />
                        </div>
                        <span className="font-exrabold text-xl tracking-tight text-white hidden sm:block">
                            Krishna <span className="text-orange-500">Connect</span>
                        </span>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 pt-40 pb-32 relative z-10">

                {/* 
          ========================================================================
          Hero Section: Breathtaking Typography & Entry
          ========================================================================
        */}
                <section className="text-center max-w-5xl mx-auto mb-40 animate-in slide-in-from-bottom-12 fade-in duration-[1200ms] fill-mode-forwards">

                    <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-gradient-to-r from-orange-500/10 via-white/5 to-green-600/10 border border-white/10 backdrop-blur-xl mb-12 shadow-[0_0_40px_rgba(255,152,0,0.15)] hover:shadow-[0_0_60px_rgba(255,152,0,0.25)] transition-shadow duration-500 cursor-default">
                        <Flag className="h-4 w-4 text-orange-400" />
                        <span className="text-xs sm:text-sm font-bold tracking-[0.2em] uppercase text-white/90">
                            Proudly Made in India
                        </span>
                    </div>

                    <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-[100px] font-black tracking-tighter mb-8 text-white leading-[1.1] drop-shadow-2xl">
                        We are <br />
                        <span className="bg-gradient-to-r from-orange-400 via-orange-300 to-amber-200 bg-clip-text text-transparent">Krishna Connect.</span>
                    </h1>

                    <p className="text-xl md:text-3xl text-white/60 font-medium text-balance leading-relaxed max-w-3xl mx-auto">
                        India's first Spiritual Social Media platform.
                        <br className="hidden md:block" />
                        <span className="text-white/40 font-light mt-4 block text-lg md:text-xl">
                            Connecting hearts, elevating consciousness, and sharing divine joy with the world.
                        </span>
                    </p>
                </section>

                {/* 
          ========================================================================
          Feature/Value Highlights (Glass Cards with Glows)
          ========================================================================
        */}
                <section className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-40">
                    {[
                        {
                            t: 'Divine Connections',
                            d: 'Find like-minded spiritual seekers globally in a purely ad-free, sattvic environment.',
                            Icon: HandHeart,
                            color: 'text-orange-400',
                            delay: 'delay-100'
                        },
                        {
                            t: 'Elevate Consciousness',
                            d: 'Share, watch, and discuss profound wisdom through Shorts, Streams, and Posts.',
                            Icon: Sparkles,
                            color: 'text-amber-300',
                            delay: 'delay-300'
                        },
                        {
                            t: 'Grow Together',
                            d: 'Participate in challenges, group mantra chanting, and global spiritual milestones.',
                            Icon: Sprout,
                            color: 'text-green-400',
                            delay: 'delay-500'
                        }
                    ].map((feature, i) => (
                        <div key={i} className={`p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all duration-500 hover:-translate-y-2 group animate-in slide-in-from-bottom-12 fade-in duration-1000 ${feature.delay} fill-mode-forwards`}>
                            <div className={`h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/5 group-hover:scale-110 transition-transform duration-500`}>
                                <feature.Icon className={`h-7 w-7 ${feature.color}`} />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3">{feature.t}</h3>
                            <p className="text-white/50 leading-relaxed font-light">{feature.d}</p>
                        </div>
                    ))}
                </section>

                {/* 
          ========================================================================
          The Platform Experience (Concrete Features Showcase)
          ========================================================================
        */}
                <section className="mb-40 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-green-500/5 blur-[100px] rounded-full pointer-events-none" />

                    <div className="text-center mb-20 animate-in slide-in-from-bottom-8 fade-in duration-1000 delay-500 fill-mode-forwards relative z-10">
                        <span className="text-green-400 font-bold tracking-[0.2em] uppercase text-sm mb-4 block flex items-center justify-center gap-2">
                            <HandHeart className="h-4 w-4" /> The Experience
                        </span>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white">
                            Everything You Need,<br />
                            <span className="text-white/60 font-light text-2xl md:text-4xl block mt-4">In One Divine Space.</span>
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4 relative z-10">

                        {/* Feature 1 */}
                        <div className="group relative p-8 rounded-[2rem] bg-gradient-to-br from-white/5 to-transparent border border-white/10 hover:border-red-500/30 overflow-hidden transition-all duration-500 hover:-translate-y-2 mt-0">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[50px] rounded-full -mr-10 -mt-10 group-hover:bg-red-500/30 transition-colors duration-700" />
                            <PlaySquare className="h-10 w-10 text-red-400 mb-6 group-hover:scale-110 transition-transform duration-500" />
                            <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Leela Shorts</h3>
                            <p className="text-white/60 text-sm leading-relaxed font-light">Scroll through infinite vertical video shorts packed with quick spiritual wisdom, kirtans, and divine moments.</p>
                        </div>

                        {/* Feature 2 */}
                        <div className="group relative p-8 rounded-[2rem] bg-gradient-to-br from-white/5 to-transparent border border-white/10 hover:border-amber-500/30 overflow-hidden transition-all duration-500 hover:-translate-y-2 mt-0 md:mt-8">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[50px] rounded-full -mr-10 -mt-10 group-hover:bg-amber-500/30 transition-colors duration-700" />
                            <Compass className="h-10 w-10 text-amber-300 mb-6 group-hover:scale-110 transition-transform duration-500" />
                            <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Explore & News</h3>
                            <p className="text-white/60 text-sm leading-relaxed font-light">Discover trending hashtags, read the latest spiritual news, and explore content from seekers worldwide.</p>
                        </div>

                        {/* Feature 3 */}
                        <div className="group relative p-8 rounded-[2rem] bg-gradient-to-br from-white/5 to-transparent border border-white/10 hover:border-green-500/30 overflow-hidden transition-all duration-500 hover:-translate-y-2 mt-0 md:mt-16">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-[50px] rounded-full -mr-10 -mt-10 group-hover:bg-green-500/30 transition-colors duration-700" />
                            <Users className="h-10 w-10 text-green-400 mb-6 group-hover:scale-110 transition-transform duration-500" />
                            <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Vibrant Community</h3>
                            <p className="text-white/60 text-sm leading-relaxed font-light">Join discussions, build your following, reply to posts, and share your spiritual realizations with the global family.</p>
                        </div>

                    </div>
                </section>

                {/* 
          ========================================================================
          The Inspiration (Cinematic Asymmetric Layout)
          ========================================================================
        */}
                <section className="mb-40 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] h-[100%] bg-orange-600/10 blur-[150px] rounded-full pointer-events-none" />

                    <div className="text-center mb-28 animate-in slide-in-from-bottom-8 fade-in duration-1000 delay-700 fill-mode-forwards relative z-10">
                        <span className="text-orange-500 font-bold tracking-[0.3em] uppercase text-sm mb-6 block flex items-center justify-center gap-2">
                            <Sparkles className="h-4 w-4" /> The Guiding Light
                        </span>
                        <h2 className="text-5xl md:text-7xl font-black text-white">
                            Our Inspiration
                        </h2>
                        <div className="h-1 w-40 bg-gradient-to-r from-orange-500 via-white/80 to-green-600 mx-auto rounded-full mt-10 opacity-70" />
                    </div>

                    <div className="flex flex-col gap-32 md:gap-48 max-w-7xl mx-auto relative z-10 px-4">

                        {/* Srila Prabhupada - Photo first on mobile, Left on desktop */}
                        <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-24 group">

                            {/* Text - order-2 on mobile (below photo), order-2 on desktop (right side) */}
                            <div className="w-full md:w-5/12 order-2 md:order-2 flex justify-center md:justify-start">
                                <div className="text-center md:text-left max-w-lg">
                                    <div className="inline-block px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-bold tracking-widest mb-6">FOUNDER-ACHARYA</div>
                                    <h3 className="text-4xl sm:text-5xl font-black text-white mb-2 leading-tight">His Divine Grace</h3>
                                    <h4 className="text-2xl sm:text-3xl text-orange-400 font-bold mb-8">A.C. Bhaktivedanta Swami Prabhupada</h4>
                                    <p className="text-white/70 text-lg sm:text-xl leading-[1.8] font-light">
                                        The matchless visionary who established the International Society for Krishna Consciousness.
                                        His unparalleled dedication carried the message of pure devotion, love, and Vedic wisdom across the globe.
                                        His eternal teachings form the unshakable spiritual foundation of Krishna Connect.
                                    </p>
                                </div>
                            </div>

                            {/* Photo - order-1 on mobile (above text), order-1 on desktop (left side) */}
                            <div className="w-full md:w-7/12 order-1 md:order-1 flex justify-center md:justify-end relative">
                                <div className="absolute inset-0 bg-orange-500/20 blur-[80px] rounded-[2.5rem] -z-10 group-hover:bg-orange-500/40 transition-colors duration-1000" />
                                <div className="relative w-80 h-80 sm:w-[500px] sm:h-[500px] rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_0_80px_rgba(255,152,0,0.15)] group-hover:shadow-[0_0_120px_rgba(255,152,0,0.3)] transition-all duration-1000 group-hover:border-orange-500/40 -rotate-2 group-hover:rotate-0 translate-x-0 group-hover:translate-x-2">
                                    <Image
                                        src="/logo/Srila-Prabhupada.png"
                                        alt="His Divine Grace A.C. Bhaktivedanta Swami Prabhupada"
                                        fill
                                        className="object-cover scale-105 group-hover:scale-110 transition-transform duration-[2s] ease-out filter saturate-[1.2] group-hover:saturate-150"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-700" />
                                </div>
                            </div>

                        </div>

                        {/* HG Gauranga Sundar Das Gurudev - Photo first on mobile, Right on desktop */}
                        <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-24 group">

                            {/* Text - order-2 on mobile (below photo), order-1 on desktop (left side) */}
                            <div className="w-full md:w-5/12 order-2 md:order-1 flex justify-center md:justify-end">
                                <div className="text-center md:text-right max-w-lg">
                                    <div className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm font-bold tracking-widest mb-6">VISIONARY GUIDE</div>
                                    <h3 className="text-4xl sm:text-5xl font-black text-white mb-2 leading-tight">Inspired By</h3>
                                    <h4 className="text-2xl sm:text-3xl text-amber-200 font-bold mb-8">HG Gauranga Sundar Das</h4>
                                    <p className="text-white/70 text-lg sm:text-xl leading-[1.8] font-light">
                                        Our eternal guiding light and endless source of encouragement.
                                        His profound wisdom, visionary leadership, and boundless compassionate guidance have been the ultimate driving force
                                        in bringing this monumental platform to life for devotees worldwide.
                                    </p>
                                </div>
                            </div>

                            {/* Photo - order-1 on mobile (above text), order-2 on desktop (right side) */}
                            <div className="w-full md:w-7/12 order-1 md:order-2 flex justify-center md:justify-start relative">
                                <div className="absolute inset-0 bg-amber-500/10 blur-[80px] rounded-full -z-10 group-hover:bg-amber-500/30 transition-colors duration-1000" />
                                <div className="relative w-80 h-80 sm:w-[500px] sm:h-[500px] rounded-full overflow-hidden border border-white/10 shadow-[0_0_80px_rgba(255,255,255,0.05)] group-hover:shadow-[0_0_120px_rgba(255,255,255,0.15)] transition-all duration-1000 group-hover:border-white/30 rotate-2 group-hover:rotate-0 translate-x-0 group-hover:-translate-x-2">
                                    <Image
                                        src="/logo/Gurudev.jpg"
                                        alt="HG Gauranga Sundar Das Gurudev"
                                        fill
                                        className="object-cover scale-105 group-hover:scale-110 transition-transform duration-[2s] ease-out filter grayscale group-hover:grayscale-0"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-700" />
                                </div>
                            </div>

                        </div>

                    </div>
                </section>

                {/* 
          ========================================================================
          Vision / Mission Statement (Cinematic Banner)
          ========================================================================
        */}
                <section className="mb-20">
                    <div className="max-w-6xl mx-auto relative p-12 sm:p-24 rounded-[3rem] overflow-hidden border border-white/10 bg-white/[0.02] backdrop-blur-2xl text-center group">

                        {/* Dynamic glow tracking on hover conceptually */}
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-green-500/10 opacity-50 group-hover:opacity-100 transition-opacity duration-700" />

                        <Globe2 className="h-16 w-16 mx-auto mb-8 text-white/20 group-hover:text-white/80 transition-colors duration-700" />
                        <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tight">The Mission</h2>
                        <p className="text-xl md:text-3xl text-white/70 leading-[1.6] max-w-4xl mx-auto font-light text-balance">
                            In an age of digital noise, we offer a <span className="text-white font-medium">sanctuary</span>.
                            We are uniting a global community rooted in eternal Vedic principles,
                            fostering genuine connections, and <span className="text-amber-300 font-medium">spreading divine positivity</span> across the world.
                        </p>
                    </div>
                </section>

            </main>

            {/* 
        ========================================================================
        Footer & Contact (Comprehensive)
        ========================================================================
      */}
            <footer className="border-t border-white/10 bg-black/90 backdrop-blur-2xl pt-20 pb-8 relative z-10 text-white/60">
                <div className="container mx-auto px-6">

                    {/* Top Footer Section: Links & Info */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">

                        {/* Column 1: Brand (Takes up more space) */}
                        <div className="md:col-span-5 lg:col-span-4">
                            <div className="flex items-center gap-3 mb-6">
                                <Image src="/logo/krishna_connect.png" alt="Logo" width={48} height={48} className="object-contain drop-shadow-[0_0_10px_rgba(255,152,0,0.5)]" />
                                <span className="font-black text-2xl text-white tracking-tight">Krishna <span className="text-orange-500">Connect</span></span>
                            </div>
                            <p className="text-white/50 text-sm md:text-base leading-relaxed mb-8 pr-4">
                                India's first Spiritual Social Media platform. Built with love and devotion to elevate global consciousness, foster genuine connections, and share divine joy with seekers everywhere.
                            </p>
                            <div className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/80 w-fit cursor-default hover:bg-white/10 transition-colors">
                                <Heart className="h-4 w-4 text-orange-500 fill-orange-500" />
                                <span>Proudly Made in India</span>
                            </div>
                        </div>

                        {/* Spacer for large screens */}
                        <div className="hidden lg:block lg:col-span-2"></div>

                        {/* Column 2: Platform */}
                        <div className="md:col-span-2">
                            <h4 className="text-white font-bold mb-6 tracking-wide uppercase text-sm">Platform</h4>
                            <ul className="space-y-4 text-sm font-light">
                                <li><Link href="/feed" className="hover:text-orange-400 transition-colors flex items-center gap-2">Home Feed</Link></li>
                                <li><Link href="/explore" className="hover:text-orange-400 transition-colors flex items-center gap-2">Explore Search</Link></li>
                                <li><Link href="/leela" className="hover:text-orange-400 transition-colors flex items-center gap-2">Leela Shorts</Link></li>
                            </ul>
                        </div>

                        {/* Column 3: Community */}
                        <div className="md:col-span-2">
                            <h4 className="text-white font-bold mb-6 tracking-wide uppercase text-sm">Community</h4>
                            <ul className="space-y-4 text-sm font-light">
                                <li><Link href="/about" className="text-orange-400 font-medium">About Us</Link></li>
                                <li><Link href="/get-verified" className="hover:text-orange-400 transition-colors">Get Verified</Link></li>
                                <li><Link href="/faq" className="hover:text-orange-400 transition-colors">Help Center & FAQ</Link></li>
                            </ul>
                        </div>

                        {/* Column 4: Legal & Contact */}
                        <div className="md:col-span-3 lg:col-span-2">
                            <h4 className="text-white font-bold mb-6 tracking-wide uppercase text-sm">Legal & Connect</h4>
                            <ul className="space-y-4 text-sm font-light">
                                <li><Link href="/directory" className="hover:text-orange-400 transition-colors">Legal Directory</Link></li>
                                <li><Link href="/privacy-policy" className="hover:text-orange-400 transition-colors">Privacy Policy</Link></li>
                                <li><Link href="/terms-and-conditions" className="hover:text-orange-400 transition-colors">Terms of Service</Link></li>
                                <li className="pt-2">
                                    <Link href="mailto:madanmohandas@krishnaconnect.in" className="flex items-center gap-2 hover:text-orange-400 transition-colors text-white">
                                        Support <ExternalLink className="h-3 w-3" />
                                    </Link>
                                </li>
                            </ul>
                        </div>

                    </div>

                    {/* Bottom Footer Section: Copyright */}
                    <div className="pt-8 border-t border-white/10 text-sm font-light flex flex-col md:flex-row justify-between items-center opacity-70 hover:opacity-100 transition-opacity">
                        <p className="mb-4 md:mb-0">© {new Date().getFullYear()} Krishna Connect. All rights reserved.</p>
                        <p className="flex items-center gap-2 text-white">
                            Hare Krishna <Sparkles className="h-3 w-3 text-orange-400" />
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
