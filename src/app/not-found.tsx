import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-slate-50 p-4">
      <div className="text-center max-w-md animate-fade-in">
        <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-6">
          <Shield className="h-6 w-6 text-primary" />
        </div>

        <h1 className="text-6xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
        <p className="text-slate-600 mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>

        <Link href="/">
          <Button className="bg-primary hover:bg-primary/90">
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
