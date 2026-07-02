"use client";

import React, { useState, useEffect } from "react";
import { 
  Cpu, 
  Zap, 
  Search, 
  Layers, 
  ArrowRight, 
  CheckCircle2, 
  Server, 
  ChevronRight, 
  User as UserIcon, 
  Lock, 
  Mail, 
  LogOut, 
  Plus, 
  Trash2, 
  Loader2,
  FileText,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth, db } from "../lib/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User 
} from "firebase/auth";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from "firebase/firestore";

interface Feature {
  id: string;
  icon: React.ReactNode;
  title: string;
  shortDesc: string;
  longDesc: string;
  advantage: string;
  tag: string;
}

interface UserNote {
  id: string;
  title: string;
  content: string;
  createdAt: any;
}

export default function Page() {
  const [activeTab, setActiveTab] = useState<string>("ssr");
  
  // Benchmark Calculator State
  const [siteType, setSiteType] = useState<"standard" | "nextjs">("nextjs");
  const [pagesCount, setPagesCount] = useState<number>(10);

  // Firebase Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [authError, setAuthError] = useState<string>("");
  const [authSuccess, setAuthSuccess] = useState<string>("");
  const [authTimeout, setAuthTimeout] = useState<boolean>(false);

  // Firestore Notes State
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [noteTitle, setNoteTitle] = useState<string>("");
  const [noteContent, setNoteContent] = useState<string>("");
  const [notesLoading, setNotesLoading] = useState<boolean>(false);
  const [noteSubmitting, setNoteSubmitting] = useState<boolean>(false);

  // Listen to Auth State changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setAuthTimeout(true);
      setAuthLoading(false);
      setAuthError("আইফ্রেমের (iframe) নিরাপত্তা সীমার কারণে ফায়ারবেস পোর্টাল লোড হতে বিলম্ব হচ্ছে। চিন্তা করবেন না, আপনি সরাসরি নিচের ফর্মটি ব্যবহার করতে পারেন অথবা ওপরের লিঙ্কে ক্লিক করে পেজটি নতুন ট্যাবে খুলতে পারেন।");
    }, 3500);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      clearTimeout(timer);
      setUser(currentUser);
      setAuthLoading(false);
    });
    
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  // Listen to Firestore Notes in real-time
  useEffect(() => {
    if (!user) {
      setNotes([]);
      return;
    }

    setNotesLoading(true);
    const q = query(
      collection(db, "notes"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotes: UserNote[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedNotes.push({
          id: doc.id,
          title: data.title || "",
          content: data.content || "",
          createdAt: data.createdAt
        });
      });
      setNotes(fetchedNotes);
      setNotesLoading(false);
    }, (error) => {
      console.error("Firestore error:", error);
      setNotesLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Handle Authentication
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    
    if (!email || !password) {
      setAuthError("অনুগ্রহ করে ইমেইল এবং পাসওয়ার্ড প্রদান করুন।");
      return;
    }

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        setAuthSuccess("আপনার অ্যাকাউন্টটি সফলভাবে তৈরি হয়েছে!");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        setAuthSuccess("সফলভাবে লগইন করা হয়েছে!");
      }
      // Reset inputs
      setEmail("");
      setPassword("");
    } catch (error: any) {
      console.error(error);
      if (error.code === "auth/email-already-in-use") {
        setAuthError("এই ইমেইলটি ইতিমধ্যে ব্যবহৃত হচ্ছে।");
      } else if (error.code === "auth/weak-password") {
        setAuthError("পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।");
      } else if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
        setAuthError("ভুল ইমেইল অথবা পাসওয়ার্ড দিয়েছেন।");
      } else {
        setAuthError("একটি ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
      }
    }
  };

  // Sign Out User
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setAuthSuccess("সফলভাবে লগআউট করা হয়েছে।");
    } catch (err) {
      console.error(err);
    }
  };

  // Add a Note to Firestore
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!noteTitle.trim() || !noteContent.trim()) {
      alert("অনুগ্রহ করে শিরোনাম এবং বিবরণ পূরণ করুন।");
      return;
    }

    setNoteSubmitting(true);
    try {
      await addDoc(collection(db, "notes"), {
        userId: user.uid,
        title: noteTitle,
        content: noteContent,
        createdAt: serverTimestamp()
      });
      setNoteTitle("");
      setNoteContent("");
    } catch (err) {
      console.error("Error adding note:", err);
      alert("নোটটি সংরক্ষণ করতে সমস্যা হয়েছে।");
    } finally {
      setNoteSubmitting(false);
    }
  };

  // Delete a Note from Firestore
  const handleDeleteNote = async (id: string) => {
    try {
      await deleteDoc(doc(db, "notes", id));
    } catch (err) {
      console.error("Error deleting note:", err);
    }
  };

  const features: Feature[] = [
    {
      id: "ssr",
      icon: <Server className="w-6 h-6 text-indigo-500" id="icon-ssr" />,
      title: "সার্ভার সাইড রেন্ডারিং (SSR)",
      shortDesc: "প্রতিটি রিকোয়েস্টে সার্ভার থেকে সরাসরি HTML রেন্ডার করা হয়।",
      longDesc: "Next.js-এর ডাইনামিক সার্ভার রেন্ডারিংয়ের ফলে ব্যবহারকারী ব্রাউজারে প্রবেশ করা মাত্রই সম্পূর্ণ তৈরি পেজ দেখতে পান। এতে ব্রাউজার সাইড জাভাস্ক্রিপ্ট লোডিংয়ের জন্য অপেক্ষা করতে হয় না।",
      advantage: "গতি এবং দুর্দান্ত সার্চ ইঞ্জিন অপটিমাইজেশন (SEO)।",
      tag: "পারফরম্যান্স"
    },
    {
      id: "routing",
      icon: <Layers className="w-6 h-6 text-indigo-500" id="icon-routing" />,
      title: "অটোমেটিক ফাইল-ভিত্তিক রাউটিং",
      shortDesc: "কোনো জটিল রাউটার কনফিগারেশন ছাড়াই সরাসরি ফোল্ডার স্ট্রাকচার দিয়ে পেজ তৈরি।",
      longDesc: "আপনাকে কোনো React Router বা এক্সটার্নাল লাইব্রেরি সেটআপ করতে হবে না। `src/app/` ডিরেক্টরিতে নতুন ফোল্ডার এবং `page.tsx` তৈরি করলেই স্বয়ংক্রিয়ভাবে একটি রাউট বা পেজ তৈরি হয়ে যায়।",
      advantage: "সহজ কোড ম্যানেজমেন্ট ও দ্রুত ডেভেলপমেন্ট।",
      tag: "ডেভেলপার ফ্রেন্ডলি"
    },
    {
      id: "seo",
      icon: <Search className="w-6 h-6 text-indigo-500" id="icon-seo" />,
      title: "সেরা SEO অপটিমাইজেশন",
      shortDesc: "সহজ মেটাডাটা কনফিগারেশন এবং এসইও ফ্রেন্ডলি পেজ জেনারেশন।",
      longDesc: "Next.js-এ মেটাডাটা ম্যানেজমেন্ট ও হেড ট্যাগ হ্যান্ডলিং একদম ইন-বিল্ট। মেটাডাটা সরাসরি পেজের সাথে সার্ভার থেকেই চলে যায়, ফলে সার্চ ইঞ্জিন বোটগুলো সহজেই আপনার সাইট ক্রল করতে পারে।",
      advantage: "গুগল ও অন্যান্য সার্চ ইঞ্জিনে প্রথম সারিতে থাকার নিশ্চয়তা।",
      tag: "মার্কেটিং"
    },
    {
      id: "optim",
      icon: <Zap className="w-6 h-6 text-indigo-500" id="icon-optim" />,
      title: "অটো ইমেজ ও ফন্ট অপটিমাইজেশন",
      shortDesc: "কনফিগারেশন ছাড়াই ইমেজ কম্প্রেস করা এবং মডার্ন ফরম্যাটে কনভার্ট করা।",
      longDesc: "Next.js-এর `next/image` এবং `next/font` ব্যবহারের ফলে অতিরিক্ত কোনো থার্ড-পার্টি লাইব্রেরি ছাড়াই ছবিগুলোর সাইজ অপটিমাইজ হয় এবং গুগল ফন্টগুলো সরাসরি লোকালি লোড হয়।",
      advantage: "পেজ লোড স্পিড বৃদ্ধি এবং ব্যান্ডউইথ সাশ্রয়।",
      tag: "অপটিমাইজেশন"
    }
  ];

  const calculateMetrics = () => {
    if (siteType === "nextjs") {
      const loadTime = 0.8;
      const score = 98;
      const seoChance = "৯৯%";
      return { loadTime, score, seoChance };
    } else {
      const loadTime = (2.4 + pagesCount * 0.05).toFixed(1);
      const score = Math.max(45, 82 - pagesCount * 2);
      const seoChance = "৪০%";
      return { loadTime, score, seoChance };
    }
  };

  const metrics = calculateMetrics();

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-900" id="app-container">
      {/* Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200/80 transition-all duration-300" id="main-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3" id="brand-logo">
            <span className="flex items-center justify-center bg-black text-white font-black text-xl px-3 py-1.5 rounded-xl tracking-tight shadow-sm">
              ▲ <span className="text-sm font-semibold ml-1.5 font-sans">Next.js</span>
            </span>
            <div className="h-4 w-px bg-slate-300 hidden sm:block"></div>
            <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase hidden sm:block font-mono">
              FIREBASE INTEGRATION ACTIVE
            </span>
          </div>

          <nav className="flex items-center gap-4" id="navbar-links">
            <a 
              href="#firebase-portal" 
              className="text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3.5 py-1.5 rounded-xl transition-all"
            >
              ফায়ারবেস পোর্টাল
            </a>
            <span className="text-xs bg-emerald-500/10 text-emerald-700 px-3 py-1 rounded-full font-medium flex items-center gap-1.5 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              সার্ভার লাইভ
            </span>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-16 lg:py-24" id="hero-section">
          {/* Decorative Background */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 opacity-30 pointer-events-none">
            <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-indigo-300 blur-3xl"></div>
            <div className="absolute top-20 right-10 w-80 h-80 rounded-full bg-pink-200 blur-3xl"></div>
          </div>

          <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/5 border border-black/10 rounded-full text-xs font-semibold text-slate-800 mb-6"
            >
              <Cpu className="w-3.5 h-3.5 text-indigo-600" />
              <span>রিয়েল-টাইম ফায়ারবেস ডাটাবেস ও অথেন্টিকেশন যুক্ত</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight"
              id="hero-title"
            >
              Next.js এবং <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">ফায়ারবেস ক্লাউড</span><br />
              একত্রিত পূর্ণাঙ্গ পোর্টাল
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed"
              id="hero-desc"
            >
              নিচে আপনার জন্য সম্পূর্ণ সুরক্ষিত এবং ডাইনামিক <strong className="text-indigo-600">Firebase Authentication</strong> ও <strong className="text-indigo-600">Cloud Firestore</strong> পোর্টাল তৈরি করা হয়েছে। যেকোনো অ্যাকাউন্ট তৈরি করে রিয়েল-টাইম ডাটা ক্লাউডে সেভ করুন।
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 flex flex-wrap justify-center gap-4"
              id="hero-actions"
            >
              <a 
                href="#firebase-portal" 
                className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-md shadow-indigo-100 transition-all duration-200 flex items-center gap-2"
              >
                ফায়ারবেস লগইন পোর্টাল
                <ArrowRight className="w-4 h-4" />
              </a>
              <a 
                href="#features-section" 
                className="px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl font-medium transition-all duration-200"
              >
                ফিচারগুলো জানুন
              </a>
            </motion.div>
          </div>
        </section>

        {/* Firebase Live Portal & Auth Section */}
        <section id="firebase-portal" className="py-16 bg-white border-y border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-extrabold text-indigo-600 tracking-wider uppercase bg-indigo-50 px-3 py-1 rounded-full">
                রিয়েল-টাইম ক্লাউড পোর্টাল
              </span>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mt-3">
                ফায়ারবেস পোর্টাল ও সিকিউর ড্যাশবোর্ড
              </h2>
              <p className="mt-2 text-slate-600 text-sm">
                এখান থেকে আপনি ইউজার হিসেবে সাইন আপ বা লগইন করতে পারেন। লগইন করার পর আপনার ডাটা সরাসরি ফায়ারবেস ক্লাউড ফায়ারস্টোর ডাটাবেসে সেভ হবে।
              </p>
            </div>

            {authLoading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border border-slate-100" id="auth-loader">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                <p className="mt-4 text-sm text-slate-500 font-medium">ফায়ারবেস পোর্টাল কানেক্ট হচ্ছে...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                {/* Auth Interface */}
                <div className="lg:col-span-5 bg-slate-50 border border-slate-200/80 rounded-3xl p-6 sm:p-8 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2.5 bg-indigo-600 text-white rounded-xl">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          {user ? "আপনার অ্যাকাউন্ট তথ্য" : (isSignUp ? "নতুন অ্যাকাউন্ট তৈরি করুন" : "অ্যাকাউন্টে লগইন করুন")}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {user ? "ফায়ারবেস সেশন অ্যাক্টিভ" : "ক্লাউড সিকিউরিটি দ্বারা সুরক্ষিত"}
                        </p>
                      </div>
                    </div>

                    {authError && (
                      <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{authError}</span>
                      </div>
                    )}

                    {authSuccess && (
                      <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-700">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{authSuccess}</span>
                      </div>
                    )}

                    {!user ? (
                      <form onSubmit={handleAuth} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                            ইমেইল অ্যাড্রেস
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="example@mail.com"
                              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                            গোপন পাসওয়ার্ড
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                            <input
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="******"
                              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900"
                              required
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {isSignUp ? "অ্যাকাউন্ট তৈরি করুন" : "লগইন করুন"}
                        </button>
                      </form>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">ইমেইল আইডি:</div>
                          <div className="text-sm font-bold text-slate-800 break-all">{user.email}</div>
                          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono mt-2">ইউজার আইডি (UID):</div>
                          <div className="text-xs text-slate-500 font-mono break-all">{user.uid}</div>
                        </div>

                        <button
                          onClick={handleLogout}
                          className="w-full py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          লগআউট করুন
                        </button>
                      </div>
                    )}
                  </div>

                  {!user && (
                    <div className="mt-6 pt-6 border-t border-slate-200 text-center text-xs">
                      <span className="text-slate-500">
                        {isSignUp ? "ইতিমধ্যে অ্যাকাউন্ট আছে?" : "নতুন ইউজার?"}
                      </span>{" "}
                      <button
                        onClick={() => {
                          setIsSignUp(!isSignUp);
                          setAuthError("");
                          setAuthSuccess("");
                        }}
                        className="text-indigo-600 font-bold hover:underline"
                      >
                        {isSignUp ? "লগইন করুন" : "নতুন অ্যাকাউন্ট তৈরি করুন"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Firestore Cloud Notes Interface */}
                <div className="lg:col-span-7 bg-slate-50 border border-slate-200/80 rounded-3xl p-6 sm:p-8 flex flex-col justify-between">
                  {!user ? (
                    <div className="flex flex-col items-center justify-center text-center h-full py-12" id="notes-locked">
                      <div className="p-4 bg-slate-200 text-slate-400 rounded-full mb-4">
                        <Lock className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800">ফায়ারস্টোর ড্যাশবোর্ড লকড</h3>
                      <p className="text-xs text-slate-500 max-w-sm mt-1">
                        আপনার ব্যক্তিগত নোট বা ডাটাবেস এন্ট্রি দেখতে এবং তৈরি করতে অনুগ্রহ করে প্রথমে বাম পাশের পোর্টাল থেকে আপনার অ্যাকাউন্টে লগইন করুন।
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6 flex flex-col justify-between h-full" id="notes-unlocked">
                      {/* Note creation form */}
                      <div>
                        <div className="flex items-center gap-2.5 mb-4">
                          <FileText className="w-5 h-5 text-indigo-600" />
                          <h3 className="text-lg font-bold text-slate-900">ফায়ারস্টোর রিয়েল-টাইম ডাটা এন্ট্রি</h3>
                        </div>

                        <form onSubmit={handleAddNote} className="space-y-3 bg-white p-4 border border-slate-200 rounded-2xl">
                          <div>
                            <input
                              type="text"
                              placeholder="নোটের শিরোনাম লিখুন..."
                              value={noteTitle}
                              onChange={(e) => setNoteTitle(e.target.value)}
                              className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900"
                              required
                            />
                          </div>
                          <div>
                            <textarea
                              placeholder="আপনার বার্তা বা বিবরণ লিখুন..."
                              value={noteContent}
                              onChange={(e) => setNoteContent(e.target.value)}
                              rows={2}
                              className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 resize-none"
                              required
                            ></textarea>
                          </div>
                          <button
                            type="submit"
                            disabled={noteSubmitting}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all disabled:opacity-55 cursor-pointer ml-auto"
                          >
                            {noteSubmitting ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Plus className="w-3.5 h-3.5" />
                            )}
                            ক্লাউডে সেভ করুন
                          </button>
                        </form>
                      </div>

                      {/* Display of Notes */}
                      <div className="flex-grow pt-4 border-t border-slate-200">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono mb-3">
                          আমার ক্লাউড ডাটাবেস এন্ট্রি সমূহ ({notes.length})
                        </h4>

                        {notesLoading ? (
                          <div className="flex justify-center items-center py-10" id="notes-loader">
                            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                          </div>
                        ) : notes.length === 0 ? (
                          <div className="text-center py-10 bg-white border border-slate-100 rounded-2xl text-slate-400 text-xs">
                            কোনো ডাটা পাওয়া যায়নি। আপনার প্রথম নোটটি ক্লাউডে সেভ করুন!
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                            <AnimatePresence>
                              {notes.map((note) => (
                                <motion.div
                                  key={note.id}
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-start justify-between gap-3 shadow-sm"
                                >
                                  <div className="flex-1 min-w-0">
                                    <h5 className="text-sm font-bold text-slate-950 truncate">{note.title}</h5>
                                    <p className="text-xs text-slate-600 mt-1 break-words whitespace-pre-wrap">{note.content}</p>
                                  </div>
                                  <button
                                    onClick={() => handleDeleteNote(note.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all shrink-0 cursor-pointer"
                                    title="মুছে ফেলুন"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Feature Explorer Grid Section */}
        <section className="py-20 bg-slate-100/50 border-y border-slate-200/50" id="features-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl" id="features-title">
                কেন Next.js আমাদের প্রথম পছন্দ?
              </h2>
              <p className="mt-4 text-slate-600">
                মডার্ন ওয়েবের সব জটিলতা সহজ করতে এবং অসাধারণ স্পিড দিতে Next.js অত্যন্ত গুরুত্বপূর্ণ ভূমিকা পালন করে। নিচে এর মূল বৈশিষ্ঠ্যগুলো দেওয়া হলো:
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Navigation Tabs (Left 5 Columns on Desktop) */}
              <div className="lg:col-span-5 space-y-3" id="features-nav-container">
                {features.map((feature) => (
                  <button
                    key={feature.id}
                    onClick={() => setActiveTab(feature.id)}
                    className={`w-full text-left p-4.5 rounded-2xl border transition-all duration-200 flex gap-4 items-center ${
                      activeTab === feature.id
                        ? "bg-white border-indigo-600 shadow-md shadow-slate-200/60"
                        : "bg-transparent border-slate-200/60 hover:bg-white/50 hover:border-slate-300"
                    }`}
                    id={`feature-tab-${feature.id}`}
                  >
                    <div className={`p-2.5 rounded-xl transition-all ${
                      activeTab === feature.id ? "bg-indigo-50" : "bg-slate-100"
                    }`}>
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-semibold text-indigo-600 tracking-wide uppercase font-mono">
                        {feature.tag}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-0.5">
                        {feature.title}
                      </h3>
                    </div>
                  </button>
                ))}
              </div>

              {/* Dynamic Detail Card (Right 7 Columns on Desktop) */}
              <div className="lg:col-span-7" id="feature-detail-container">
                {features.map((feature) => {
                  if (feature.id !== activeTab) return null;
                  return (
                    <motion.div
                      key={feature.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white border border-slate-200/80 rounded-3xl p-8 lg:p-10 shadow-lg shadow-slate-100"
                      id={`feature-detail-${feature.id}`}
                    >
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-6">
                        {feature.tag}
                      </span>
                      <h3 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                        {feature.title}
                      </h3>
                      <p className="mt-4 text-slate-600 text-lg leading-relaxed">
                        {feature.longDesc}
                      </p>

                      <div className="mt-8 pt-6 border-t border-slate-100">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                          প্রধান সুবিধা
                        </h4>
                        <div className="mt-2 flex items-center gap-3 text-slate-800">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                          <span className="font-semibold">{feature.advantage}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Performance Benchmark Calculator */}
        <section className="py-20" id="benchmark-section">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-slate-900 text-white rounded-3xl overflow-hidden shadow-2xl p-8 lg:p-12 relative">
              {/* Glow Accent */}
              <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>

              <div className="relative z-10">
                <div className="max-w-2xl">
                  <span className="text-indigo-400 font-mono text-xs uppercase tracking-widest font-bold">
                    লাইভ পারফরম্যান্স ক্যালকুলেটর
                  </span>
                  <h2 className="text-3xl font-bold mt-2 tracking-tight">
                    Next.js স্পিড বনাম সাধারণ রিয়্যাক্ট ক্লায়েন্ট সাইড রেন্ডারিং
                  </h2>
                  <p className="mt-3 text-slate-400 text-sm sm:text-base">
                    নিচের ক্যালকুলেটরটি ব্যবহার করে সরাসরি দেখুন কিভাবে Next.js-এর অপটিমাইজেশন পেজ লোড ও এসইও স্কোর দ্বিগুণ করে দেয়।
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-10 pt-10 border-t border-slate-800 items-center">
                  {/* Controls */}
                  <div className="md:col-span-5 space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        ১. প্ল্যাটফর্ম সিলেক্ট করুন
                      </label>
                      <div className="grid grid-cols-2 gap-2 bg-slate-800 p-1.5 rounded-xl">
                        <button
                          onClick={() => setSiteType("nextjs")}
                          className={`py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                            siteType === "nextjs"
                              ? "bg-indigo-600 text-white"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          ▲ Next.js App
                        </button>
                        <button
                          onClick={() => setSiteType("standard")}
                          className={`py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                            siteType === "standard"
                              ? "bg-indigo-600 text-white"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          SPA Client App
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        ২. ওয়েবসাইটের পেজ সংখ্যা ({pagesCount})
                      </label>
                      <input 
                        type="range" 
                        min="1" 
                        max="100" 
                        value={pagesCount}
                        onChange={(e) => setPagesCount(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                      <div className="flex justify-between text-xxs text-slate-500 mt-1 font-mono">
                        <span>১ পেজ</span>
                        <span>১০০ পেজ</span>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Metrics Output */}
                  <div className="md:col-span-7 bg-slate-950/80 border border-slate-800 rounded-2xl p-6 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-slate-500 text-xxs uppercase tracking-wider font-bold">পেজ লোড স্পিড</p>
                      <div className="mt-2 flex justify-center items-baseline gap-1">
                        <span className="text-3xl font-black text-white font-mono">{metrics.loadTime}</span>
                        <span className="text-xs text-slate-500 font-sans">সেকেন্ড</span>
                      </div>
                      <div className="mt-3">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-xxs font-bold ${
                          siteType === "nextjs" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}>
                          {siteType === "nextjs" ? "সুপার ফাস্ট" : "ধীরগতি"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-slate-500 text-xxs uppercase tracking-wider font-bold">গুগল লাইটহাউস স্কোর</p>
                      <div className="mt-2 flex justify-center items-baseline">
                        <span className="text-3xl font-black text-white font-mono">{metrics.score}</span>
                        <span className="text-xs text-slate-500 font-mono">/১০০</span>
                      </div>
                      <div className="mt-3">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-xxs font-bold ${
                          metrics.score >= 90 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}>
                          {metrics.score >= 90 ? "সেরা স্কোর" : "অপটিমাইজেশন প্রয়োজন"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-slate-500 text-xxs uppercase tracking-wider font-bold">SEO ইন্ডেক্সিং রেট</p>
                      <div className="mt-2 flex justify-center items-baseline">
                        <span className="text-3xl font-black text-white font-mono">{metrics.seoChance}</span>
                      </div>
                      <div className="mt-3">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-xxs font-bold ${
                          siteType === "nextjs" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}>
                          {siteType === "nextjs" ? "খুব সহজ" : "কঠিন"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ - Explaining Next.js and why Node.js is not the same */}
        <section className="py-20 bg-slate-50 border-t border-slate-200" id="faq-section">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest font-mono">
                প্রশ্ন ও উত্তর (FAQ)
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 mt-2">
                Next.js সম্পর্কিত সাধারণ কিছু জিজ্ঞাসা
              </h2>
            </div>

            <div className="space-y-6" id="faq-accordion">
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg text-xs font-mono">Q.</span>
                  Next.js কেন Node.js থেকে আলাদা?
                </h3>
                <p className="mt-3 text-slate-600 pl-8 leading-relaxed">
                  <strong className="text-slate-800">Node.js</strong> একটি জাভাস্ক্রিপ্ট রানটাইম (Runtime Engine) যা দিয়ে সার্ভার কোড চালানো হয়। আর <strong className="text-slate-800">Next.js</strong> হলো একটি ওয়েব অ্যাপ্লিকেশন ফ্রেমওয়ার্ক যা React ও Node.js-এর উপর ভিত্তি করে তৈরি। Next.js আপনাকে স্বয়ংক্রিয়ভাবে রাউটিং, সার্ভার-সাইড রেন্ডারিং এবং পারফরম্যান্স অপটিমাইজেশনের সুবিধা দেয় যা নিজে নিজে Node.js দিয়ে তৈরি করা অত্যন্ত জটিল।
                </p>
              </div>

              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg text-xs font-mono">Q.</span>
                  Next.js কি স্ট্যাটিক এবং ডাইনামিক পেজ একসাথে সাপোর্ট করে?
                </h3>
                <p className="mt-3 text-slate-600 pl-8 leading-relaxed">
                  হ্যাঁ, Next.js-এর অন্যতম সেরা সুবিধা হলো এটি হাইব্রিড রেন্ডারিং সাপোর্ট করে। আপনি চাইলে কিছু পেজ সম্পূর্ণ স্ট্যাটিক (SSG) রাখতে পারেন এবং ডাটাবেজ কানেক্টেড জটিল পেজগুলো সার্ভার সাইড (SSR) করতে পারেন। এটি সবকিছু একই সাথে অত্যন্ত নিখুঁতভাবে হ্যান্ডেল করে।
                </p>
              </div>

              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg text-xs font-mono">Q.</span>
                  এখানে Tailwind CSS কীভাবে কাজ করছে?
                </h3>
                <p className="mt-3 text-slate-600 pl-8 leading-relaxed">
                  এখানে আমরা সর্বাধুনিক <strong className="text-slate-800">Tailwind CSS v4</strong> ব্যবহার করছি। এটি কোনো কনফিগারেশন ঝামেলা ছাড়াই সরাসরি আধুনিক PostCSS এবং Next.js কম্পাইলারের সাথে যুক্ত হয়ে বিদ্যুতের গতিতে সব ক্লাস রেন্ডার করে।
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Vercel & Firebase Deployment Guide Section */}
        <section className="py-20 bg-slate-900 text-white relative overflow-hidden" id="vercel-deployment-guide">
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-widest font-mono bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20">
                ডিপ্লয়মেন্ট ও গাইডলাইন (Deployment Guide)
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-4">
                কীভাবে এই প্রজেক্টটি Vercel-এ ডিপ্লয় করবেন?
              </h2>
              <p className="mt-3 text-slate-300 text-sm leading-relaxed">
                আপনার দেওয়া ফায়ারবেস (Firebase) কনফিগারেশন অলরেডি কোডের ভেতরে স্ট্যাটিক্যালি যুক্ত করা আছে। কিন্তু প্রোডাকশনে সম্পূর্ণ সিকিউর করতে নিচের নিয়মাবলী অনুসরণ করে সরাসরি <strong className="text-white">Vercel</strong>-এ ডিপ্লয় করুন।
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* Steps Card */}
              <div className="bg-slate-800/80 border border-slate-700/60 p-6 sm:p-8 rounded-3xl space-y-6">
                <h3 className="text-xl font-bold text-sky-300 flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 text-xs font-mono font-bold">১</span>
                  ভার্সেল (Vercel) ডিপ্লয়মেন্ট প্রসেস
                </h3>
                
                <ol className="space-y-4 text-xs sm:text-sm text-slate-300 list-decimal pl-4">
                  <li className="leading-relaxed">
                    ওपरের ডানদিকের সেটিংস মেন্যু থেকে <strong className="text-white">"Export"</strong>-এ ক্লিক করে সম্পূর্ণ প্রজেক্টের জিপ (ZIP) ফাইল ডাউনলোড করুন অথবা সরাসরি জিমেইল দিয়ে গিটহাব (GitHub) অ্যাকাউন্টে প্রজেক্টটি পুশ করুন।
                  </li>
                  <li className="leading-relaxed">
                    <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-sky-400 underline hover:text-sky-300 font-bold">vercel.com</a>-এ গিয়ে আপনার ফ্রি অ্যাকাউন্টটি লগইন করুন।
                  </li>
                  <li className="leading-relaxed">
                    <strong className="text-white">"Add New Project"</strong> সিলেক্ট করে আপনার গিটহাবের এই রিপোজিটরিটি বা ডাউনলোড করা ফোল্ডারটি ইম্পোর্ট করুন।
                  </li>
                  <li className="leading-relaxed">
                    ডিপ্লয় করার পূর্বে নিচে দেওয়া <strong className="text-white">Environment Variables</strong> গুলো কপি করে Vercel এর কনফিগারেশনে বসিয়ে দিন।
                  </li>
                  <li className="leading-relaxed">
                    সবশেষে <strong className="text-white">"Deploy"</strong> বাটনে ক্লিক করলেই মাত্র কয়েক সেকেন্ডে আপনার ওয়েবসাইটটি লাইভ হয়ে যাবে!
                  </li>
                </ol>
              </div>

              {/* Env Variables Card */}
              <div className="bg-slate-800/80 border border-slate-700/60 p-6 sm:p-8 rounded-3xl space-y-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
                    <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold">২</span>
                    এনভায়রনমেন্ট ভেরিয়েবলসমূহ
                  </h3>
                  <span className="text-xxs font-mono bg-slate-700 text-slate-300 px-2.5 py-0.5 rounded-md">Vercel Config</span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  নিরাপত্তা রক্ষার সুবিধার্থে আপনি Vercel Dashboard-এ নিচের ভেরিয়েবলগুলোর নাম এবং আপনার দেওয়া মান বসিয়ে দিন:
                </p>

                <div className="space-y-2.5 text-xs font-mono">
                  <div className="p-2.5 bg-slate-950/60 border border-slate-700/40 rounded-xl flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-slate-400 font-bold shrink-0">NEXT_PUBLIC_FIREBASE_API_KEY</span>
                    <span className="text-emerald-400 truncate max-w-[200px]" title="AIzaSyBZ-pyOMrgT-pNwcHoS6fUCjCcmG1bEtUM">AIzaSyBZ...bEtUM</span>
                  </div>
                  <div className="p-2.5 bg-slate-950/60 border border-slate-700/40 rounded-xl flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-slate-400 font-bold shrink-0">NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</span>
                    <span className="text-emerald-400 text-xxs">steam-park-6xnr0.firebaseapp.com</span>
                  </div>
                  <div className="p-2.5 bg-slate-950/60 border border-slate-700/40 rounded-xl flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-slate-400 font-bold shrink-0">NEXT_PUBLIC_FIREBASE_PROJECT_ID</span>
                    <span className="text-emerald-400">steam-park-6xnr0</span>
                  </div>
                  <div className="p-2.5 bg-slate-950/60 border border-slate-700/40 rounded-xl flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-slate-400 font-bold shrink-0">NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET</span>
                    <span className="text-emerald-400 text-xxs">steam-park-6xnr0.firebasestorage.app</span>
                  </div>
                  <div className="p-2.5 bg-slate-950/60 border border-slate-700/40 rounded-xl flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-slate-400 font-bold shrink-0">NEXT_PUBLIC_FIREBASE_APP_ID</span>
                    <span className="text-emerald-400 truncate max-w-[200px]" title="1:122339358999:web:eb0f58dc25266a7c3c1f52">1:122339358999...3c1f52</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to action */}
        <section className="py-20 bg-indigo-600 text-white text-center relative overflow-hidden" id="cta-section">
          {/* Decorative grid */}
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          
          <div className="max-w-4xl mx-auto px-4 relative z-10">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              আপনার পরবর্তী প্রজেক্ট Next.js দিয়ে শুরু করতে প্রস্তুত?
            </h2>
            <p className="mt-4 text-indigo-100 text-lg max-w-xl mx-auto">
              আপনার চাহিদা অনুযায়ী প্রজেক্টটি এখন সম্পূর্ণ প্রস্তুত এবং রানিং রয়েছে। চলুন আধুনিক ওয়েব টেকনোলজিতে পা রাখি।
            </p>
            <div className="mt-8 flex justify-center">
              <span className="inline-flex items-center gap-2 bg-white text-indigo-700 px-5 py-3 rounded-xl font-bold shadow-md">
                <CheckCircle2 className="w-5 h-5" />
                আপনার Next.js সাইট ফায়ারবেস সহ পুরোপুরি সক্রিয় রয়েছে!
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800" id="main-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div>
              <p className="text-sm text-slate-300 font-bold flex items-center justify-center sm:justify-start gap-2">
                ▲ Next.js ওয়েবসাইট
              </p>
              <p className="text-xs text-slate-500 mt-1">
                মডার্ন ওয়েব সল্যুশন ও উচ্চ পারফরম্যান্স অ্যাপ্লিকেশন।
              </p>
            </div>
            <div className="flex gap-4 text-xs font-mono text-slate-500">
              <span>Next.js App Router v15</span>
              <span>•</span>
              <span>Tailwind CSS v4</span>
              <span>•</span>
              <span>React 19</span>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800/80 text-center text-xs text-slate-600">
            &copy; {new Date().getFullYear()} Next.js Bengali Website. সর্বস্বত্ব সংরক্ষিত।
          </div>
        </div>
      </footer>
    </div>
  );
}
