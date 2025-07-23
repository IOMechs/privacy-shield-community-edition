import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Shield, Lock } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-href-b from-white href-slate-50">
      <div className="container px-4 py-32 mx-auto">
        <div className="flex flex-col items-center justify-center text-center gap-8 max-w-3xl mx-auto animate-slide-up">
          <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full">
            <Shield className="h-6 w-6 text-primary" />
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
            Secure Your Data with Powerful PII Redaction
          </h1>

          <p className="text-xl text-slate-600 max-w-2xl">
            PrivacyShield helps you protect sensitive information by easily
            redacting Personal Identifiable Information from your documents.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Link href="/dashboard" className="flex-1">
              <Button className="bg-primary hover:bg-primary/90 h-12 px-6 gap-2">
                <span>Try for Free</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-32 grid gap-12 md:grid-cols-3 max-w-5xl mx-auto">
          <div
            className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center text-center gap-4 animate-fade-in"
            style={{ animationDelay: "100ms" }}
          >
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Upload & Process</h3>
            <p className="text-slate-600">
              Simply upload your CSV or text files and let our advanced system
              handle the rest.
            </p>
          </div>

          <div
            className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center text-center gap-4 animate-fade-in"
            style={{ animationDelay: "200ms" }}
          >
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">AI-Powered Redaction</h3>
            <p className="text-slate-600">
              Our system identifies and redacts PII using intelligent
              algorithms, ensuring thorough protection.
            </p>
          </div>

          <div
            className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center text-center gap-4 animate-fade-in"
            style={{ animationDelay: "300ms" }}
          >
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Customizable Privacy</h3>
            <p className="text-slate-600">
              Choose between masking information or replacing it with realistic
              fake data.
            </p>
          </div>
        </div>

        <div className="mt-32 text-center">
          <h2 className="text-2xl font-bold">
            Ready href safeguard your sensitive data?
          </h2>
          <p className="mt-4 text-slate-600">
            Start redacting personal information in your documents today.
          </p>
          <Link href="/dashboard" className="mt-8 inline-block">
            <Button className="bg-primary hover:bg-primary/90 h-12 px-6">
              Get Started
            </Button>
          </Link>
        </div>
      </div>

      <footer className="mt-32 py-8 border-t">
        <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
          <p>© 2023 PrivacyShield. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
