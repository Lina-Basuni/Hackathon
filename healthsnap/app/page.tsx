import Link from "next/link";
import { ArrowRight, Mic, Brain, FileText, Calendar, Shield, Stethoscope } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl">HealthSnap</span>
          </div>
          <Link
            href="/record"
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <Shield className="w-4 h-4" />
          AI-Powered Health Assessment
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
          Your Health Snapshot
          <br />
          <span className="text-primary">In Seconds</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
          Record your symptoms, get instant AI-powered risk analysis, and connect
          with the right healthcare professionals.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/record"
            className="inline-flex items-center justify-center gap-2 bg-primary text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
          >
            <Mic className="w-5 h-5" />
            Start Recording
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/reports"
            className="inline-flex items-center justify-center gap-2 bg-white text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-colors border border-gray-200"
          >
            View Past Reports
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Mic className="w-8 h-8" />}
            title="1. Record Symptoms"
            description="Simply speak about how you're feeling. Our system captures your voice note securely."
          />
          <FeatureCard
            icon={<Brain className="w-8 h-8" />}
            title="2. AI Analysis"
            description="Advanced AI analyzes your symptoms, identifying risk factors and generating clinical insights."
          />
          <FeatureCard
            icon={<FileText className="w-8 h-8" />}
            title="3. Get Your Report"
            description="Receive a detailed health snapshot with risk flags, recommendations, and next steps."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-primary to-blue-600 rounded-3xl p-12 text-center text-white">
          <Calendar className="w-12 h-12 mx-auto mb-6 opacity-90" />
          <h2 className="text-3xl font-bold mb-4">Ready to Take Control of Your Health?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-xl mx-auto">
            Get instant insights and connect with qualified healthcare professionals.
          </p>
          <Link
            href="/record"
            className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Start Your Health Snapshot
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2024 HealthSnap. Demo Project for Assessment.</p>
          <p className="text-sm mt-2">
            This is a demonstration application. Not for actual medical use.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border hover:shadow-md transition-shadow">
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
