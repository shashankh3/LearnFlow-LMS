"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, LogOut, LayoutDashboard, GraduationCap, BarChart3 } from "lucide-react";
import { getUser, logout } from "@/lib/auth";

export default function Navbar() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Fix hydration by only rendering user-specific UI after mount
  useEffect(() => {
    setMounted(true);
    setUser(getUser());
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
    router.push("/login");
  };

  if (!mounted) {
    // Return a skeleton or plain logo version during server-side rendering
    return (
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
          <BookOpen size={24} />
          <span>LearnFlow</span>
        </div>
      </nav>
    );
  }

  const isInstructor = user?.role?.toUpperCase() === "INSTRUCTOR";

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex justify-between items-center">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
        <BookOpen size={24} />
        <span>LearnFlow</span>
      </Link>

      {/* Navigation Links */}
      <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
        <Link href="/courses" className="hover:text-indigo-600 transition">Courses</Link>
        
        {user && (
          <>
            <Link
              href={isInstructor ? "/instructor/dashboard" : "/dashboard"}
              className="flex items-center gap-1 hover:text-indigo-600 transition"
            >
              <LayoutDashboard size={15} />
              Dashboard
            </Link>
            
            {isInstructor && (
              <Link
                href="/instructor/analytics"
                className="flex items-center gap-1 text-indigo-600 font-bold"
              >
                <BarChart3 size={15} />
                Analytics
              </Link>
            )}
          </>
        )}
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-3">
        {user ? (
          <>
            <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-sm font-medium border border-indigo-100">
              <GraduationCap size={15} />
              <span>{user.username}</span>
              <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-md uppercase font-bold">
                {user.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 font-medium transition ml-2"
            >
              <LogOut size={15} /> Logout
            </button>
          </>
        ) : (
          <div className="flex gap-4">
            <Link href="/login" className="text-sm font-semibold text-gray-700 hover:text-indigo-600 px-4 py-2">
              Login
            </Link>
            <Link href="/register" className="text-sm font-semibold bg-indigo-600 text-white px-5 py-2 rounded-lg shadow-sm">
              Get Started
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}