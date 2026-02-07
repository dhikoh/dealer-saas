import Link from "next/link";
import Image from "next/image";
import { Check, ArrowRight, Car, Users, BarChart3, Shield, Zap, Globe } from "lucide-react";

export default function Home() {
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
            <Link href="/auth" className="text-slate-300 hover:text-white transition-colors px-4 py-2">
              Login
            </Link>
            <Link href="/auth?mode=register" className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-teal-500/25">
              Daftar Gratis
            </Link>
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
            Kelola Bisnis<br />
            <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">Mobil Bekas</span> Anda
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            Platform SaaS all-in-one untuk dealer mobil bekas. Inventaris, transaksi,
            customer, laporan keuangan — semua dalam satu dashboard modern.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/auth?mode=register" className="flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all shadow-xl shadow-teal-500/30">
              Mulai Gratis <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/auth" className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all border border-slate-700">
              Sudah Punya Akun? Login
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
            <FeatureCard
              icon={<Car className="w-6 h-6" />}
              title="Manajemen Inventaris"
              description="Kelola stok kendaraan dengan foto, spesifikasi, kondisi, dan harga. Dilengkapi filter dan pencarian cepat."
            />
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="Database Customer"
              description="Simpan data pelanggan, riwayat pembelian, dan follow-up otomatis untuk repeat customer."
            />
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6" />}
              title="Laporan & Statistik"
              description="Dashboard real-time untuk penjualan, revenue, dan performa bisnis Anda."
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Multi-User & Role"
              description="Tambahkan tim sales dengan akses berbeda. Owner dan Staff memiliki permission terpisah."
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6" />}
              title="Simulasi Kredit"
              description="Hitung angsuran untuk berbagai tenor dan DP. Bagikan ke customer dalam hitungan detik."
            />
            <FeatureCard
              icon={<Globe className="w-6 h-6" />}
              title="Multi-Cabang"
              description="Kelola beberapa cabang dealer dalam satu akun. Laporan terpisah per cabang."
              badge="PRO"
            />
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
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <PricingCard
              name="Basic"
              price="Rp 299.000"
              description="Untuk dealer kecil"
              features={["50 Kendaraan", "3 User", "Laporan Dasar", "Email Support"]}
            />
            <PricingCard
              name="Pro"
              price="Rp 599.000"
              description="Terbaik untuk berkembang"
              features={["200 Kendaraan", "10 User", "Multi-Cabang", "Laporan Lengkap", "Priority Support"]}
              recommended
            />
            <PricingCard
              name="Unlimited"
              price="Rp 1.499.000"
              description="Enterprise"
              features={["Unlimited Kendaraan", "Unlimited User", "API Access", "Dedicated Manager"]}
            />
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
            Daftar Gratis Sekarang <ArrowRight className="w-5 h-5" />
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
            &copy; 2026 OTOHUB. All rights reserved.
          </p>
          <div className="flex gap-6 text-slate-400 text-sm">
            <a href="#" className="hover:text-white transition-colors">Kebijakan Privasi</a>
            <a href="#" className="hover:text-white transition-colors">Syarat & Ketentuan</a>
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

function PricingCard({ name, price, description, features, recommended }: { name: string; price: string; description: string; features: string[]; recommended?: boolean }) {
  return (
    <div className={`relative bg-slate-800/50 border rounded-2xl p-6 ${recommended ? 'border-teal-500 ring-1 ring-teal-500' : 'border-slate-700'}`}>
      {recommended && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-xs font-bold px-4 py-1 rounded-full">
            REKOMENDASI
          </span>
        </div>
      )}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold mb-1">{name}</h3>
        <p className="text-slate-400 text-sm mb-3">{description}</p>
        <div className="text-3xl font-extrabold">{price}<span className="text-base font-normal text-slate-400">/bulan</span></div>
      </div>
      <ul className="space-y-3 mb-6">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
            <Check className="w-4 h-4 text-teal-400" />
            {f}
          </li>
        ))}
      </ul>
      <Link href="/auth?mode=register" className={`block w-full text-center py-3 rounded-xl font-semibold transition-all ${recommended ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:opacity-90' : 'bg-slate-700 text-white hover:bg-slate-600'}`}>
        Mulai Sekarang
      </Link>
    </div>
  );
}
