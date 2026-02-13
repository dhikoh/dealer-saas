
import Link from "next/link";
import Image from "next/image";
import { Check, ArrowRight, Car, Users, BarChart3, Shield, Zap, Globe, MessageCircle, LayoutDashboard } from "lucide-react";
import { getLandingContent, getPublicPlans } from "@/lib/cms";
import { cookies } from "next/headers";

// Map icon names to components
const IconMap: Record<string, any> = {
  Car,
  Users,
  BarChart3,
  Shield,
  Zap,
  Globe,
  MessageCircle
};

export default async function Home() {
  const [content, plans] = await Promise.all([
    getLandingContent(),
    getPublicPlans(),
  ]);

  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token');
  const isLoggedIn = !!token;

  if (!content) {
    return <div className="min-h-screen flex items-center justify-center text-white bg-slate-900">Loading Content...</div>;
  }

  // Helper to format currency
  const formatPrice = (price: string | number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(Number(price));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white font-sans">
      {/* HEADER / NAV */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center">
              <Car className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">OTOHUB</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-slate-300 hover:text-white transition-colors">Fitur</a>
            <a href="#pricing" className="text-slate-300 hover:text-white transition-colors">Harga</a>
            <a href="#faq" className="text-slate-300 hover:text-white transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link href="/app" className="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-all border border-slate-600 flex items-center gap-2 shadow-lg">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/auth" className="text-slate-300 hover:text-white transition-colors px-4 py-2">
                  Login
                </Link>
                <Link href={content.hero.ctaLink || "/auth?mode=register"} className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-teal-500/25">
                  {content.hero.ctaText || "Daftar Gratis"}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-teal-500/10 text-teal-400 px-4 py-2 rounded-full text-sm font-medium mb-8 border border-teal-500/20">
            <Zap className="w-4 h-4" />
            Gratis 14 Hari Trial - Tanpa Kartu Kredit
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            {content.hero.title}
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            {content.hero.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href={content.hero.ctaLink} className="flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all shadow-xl shadow-teal-500/30">
              {content.hero.ctaText} <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/auth" className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all border border-slate-700">
              Masuk Akun
            </Link>
          </div>
          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-6 mt-12 text-slate-500 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-teal-400" />
              <span>SSL Secured</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-teal-400" />
              <span>Multi-bahasa</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-400" />
              <span>500+ Dealer Terdaftar</span>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-20 px-6 bg-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Semua yang Anda Butuhkan</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Fitur lengkap untuk mengelola bisnis dealer mobil bekas Anda dengan efisien</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(content.features || []).map((feature, idx) => {
              const Icon = IconMap[feature.icon] || Car;
              return (
                <FeatureCard
                  key={idx}
                  icon={<Icon className="w-6 h-6" />}
                  title={feature.title}
                  description={feature.description}
                  badge={feature.badge}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Harga Transparan</h2>
            <p className="text-slate-400">Pilih paket yang sesuai dengan skala bisnis Anda</p>
          </div>
          <div className="grid md:grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {(plans || []).map((plan) => {
              // Parse features from JSON or use defaults from Plan object if structured differently
              // Assumption: plan.features is an object like { maxVehicles: 50, ... }
              // We need to convert it to a list of strings for display

              const featuresList: string[] = [];
              const rawFeat = plan.features as any;

              if (rawFeat) {
                if (rawFeat.maxVehicles === -1) featuresList.push("Unlimited Kendaraan");
                else featuresList.push(`${rawFeat.maxVehicles} Kendaraan`);

                if (rawFeat.maxUsers === -1) featuresList.push("Unlimited User");
                else featuresList.push(`${rawFeat.maxUsers} User`);

                if (rawFeat.multiLanguage) featuresList.push("Multi-bahasa");
                if (rawFeat.blacklistAccess) featuresList.push("Akses Blacklist");
                if (rawFeat.whatsappIntegration) featuresList.push("WhatsApp Integration");
                if (rawFeat.prioritySupport) featuresList.push("Priority Support");
              }

              // Highlight if Enterprise/Group Creator
              const isGroupCapable = plan.canCreateGroup;

              return (
                <PricingCard
                  key={plan.id}
                  name={plan.name}
                  price={formatPrice(plan.price)}
                  description={plan.description}
                  features={featuresList}
                  recommended={plan.slug === 'pro'}
                  isEnterprise={isGroupCapable}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-20 px-6 bg-slate-800/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Pertanyaan Umum</h2>
            <p className="text-slate-400">Jawaban untuk pertanyaan yang sering diajukan</p>
          </div>
          <div className="space-y-4">
            {content.faq && content.faq.map((item, idx) => (
              <div key={idx} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-teal-500/30 transition-all">
                <h3 className="text-lg font-bold text-white mb-2">{item.question}</h3>
                <p className="text-slate-400">{item.answer}</p>
              </div>
            ))}
            {(!content.faq || content.faq.length === 0) && (
              <div className="text-center text-slate-500 italic">Belum ada FAQ yang ditambahkan.</div>
            )}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-20 px-6 bg-gradient-to-r from-teal-900/50 to-emerald-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Siap Memulai?</h2>
          <p className="text-xl text-slate-300 mb-8">
            Daftar sekarang dan dapatkan akses penuh selama 14 hari. Gratis, tanpa komitmen.
          </p>
          <Link href="/auth?mode=register" className="inline-flex items-center gap-2 bg-white text-slate-900 font-bold px-10 py-4 rounded-xl text-lg hover:bg-slate-100 transition-all shadow-xl">
            {content.hero.ctaText} <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">OTOHUB</span>
          </div>
          <p className="text-slate-500 text-sm">
            {content.footer?.copyright}
          </p>
          <div className="flex gap-6 text-slate-400 text-sm">
            {(content.footer?.links || []).map((link, i) => (
              <a key={i} href={link.url} className="hover:text-white transition-colors">{link.label}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, badge }: { icon: React.ReactNode; title: string; description: string; badge?: string }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 hover:border-teal-500/50 transition-all group">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 flex items-center justify-center text-teal-400 mb-4 group-hover:from-teal-500/30 group-hover:to-emerald-500/30 transition-all">
        {icon}
      </div>
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        {badge && (
          <span className="text-xs bg-gradient-to-r from-amber-400 to-amber-600 text-white px-2 py-0.5 rounded-full font-bold">
            {badge}
          </span>
        )}
      </div>
      <p className="text-slate-400 text-sm">{description}</p>
    </div>
  );
}

function PricingCard({ name, price, description, features, recommended, isEnterprise }: { name: string; price: string; description: string; features: string[]; recommended?: boolean; isEnterprise?: boolean }) {
  return (
    <div className={`relative bg-slate-800/50 border rounded-2xl p-6 flex flex-col ${recommended ? 'border-teal-500 ring-1 ring-teal-500' : isEnterprise ? 'border-purple-500/50' : 'border-slate-700'}`}>
      {recommended && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-xs font-bold px-4 py-1 rounded-full">
            REKOMENDASI
          </span>
        </div>
      )}
      {isEnterprise && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
            <Globe className="w-3 h-3" /> DEALER GROUP
          </span>
        </div>
      )}
      <div className="text-center mb-6 mt-2">
        <h3 className="text-xl font-bold mb-1">{name}</h3>
        <p className="text-slate-400 text-sm mb-3">{description}</p>
        <div className="text-3xl font-extrabold">{price}<span className="text-base font-normal text-slate-400">/bln</span></div>
      </div>
      <ul className="space-y-3 mb-8 flex-grow">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
            <Check className={`w-4 h-4 ${isEnterprise ? 'text-purple-400' : 'text-teal-400'}`} />
            {f}
          </li>
        ))}
      </ul>
      <Link href="/auth?mode=register" className={`block w-full text-center py-3 rounded-xl font-semibold transition-all ${recommended ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:opacity-90' : isEnterprise ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-90' : 'bg-slate-700 text-white hover:bg-slate-600'}`}>
        Mulai Sekarang
      </Link>
    </div>
  );
}

