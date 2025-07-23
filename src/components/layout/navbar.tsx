"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Shield, LogOut, FileText, Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Navbar() {
  const { user, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-md border-b">
      <div className="h-16 px-4 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 transition-all hover:opacity-80"
        >
          <Shield className="h-6 w-6 text-primary" />
          <span className="text-lg font-medium">PrivacyShield</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" className="gap-2 cursor-pointer ">
                  <FileText className="h-4 w-4" />
                  My Files
                </Button>
              </Link>

              <Separator orientation="vertical" className="h-8" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="cursor-pointer">
                      <AvatarImage src={user?.photoURL || ""} />
                      <AvatarFallback>
                        {user?.displayName?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="flex items-center gap-2 p-2">
                    <div className="flex flex-col space-y-1">
                      {user.displayName && (
                        <p className="font-medium">{user.displayName}</p>
                      )}
                      {user.email && (
                        <p className="w-[200px] truncate text-sm text-slate-500">
                          {user.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    className="text-red-500 focus:text-red-500"
                    disabled={isSigningOut}
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{isSigningOut ? "Signing out..." : "Sign out"}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/signin">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-primary hover:bg-primary/90">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden flex items-center gap-1">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="cursor-pointer">
                    <AvatarImage src={user?.photoURL || ""} />
                    <AvatarFallback>
                      {user?.displayName?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="flex items-center gap-2 p-2">
                  <div className="flex flex-col space-y-1">
                    {user.displayName && (
                      <p className="font-medium">{user.displayName}</p>
                    )}
                    {user.email ? (
                      <p className="w-[200px] truncate text-sm text-slate-500">
                        {user.email}
                      </p>
                    ) : null}
                  </div>
                </div>
                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="text-red-500 focus:text-red-500"
                  disabled={isSigningOut}
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{isSigningOut ? "Signing out..." : "Sign out"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="ghost" className="cursor-pointer">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 p-3">
              <SheetTitle>Menu</SheetTitle>
              <div className="flex flex-col gap-4 mt-6">
                {user ? (
                  <>
                    <Link href="/dashboard">
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 cursor-pointer"
                      >
                        <FileText className="h-4 w-4" />
                        My Files
                      </Button>
                    </Link>

                    <Separator />
                    <Button
                      variant="destructive"
                      className="w-full justify-start gap-2 bg-primary/90 cursor-pointer"
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                    >
                      <LogOut className="h-4 w-4" />
                      {isSigningOut ? "Signing out..." : "Sign out"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/signin">
                      <Button variant="ghost" className="w-full justify-start">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/signup">
                      <Button className="w-full bg-primary hover:bg-primary/90">
                        Sign Up
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}

export default Navbar;
