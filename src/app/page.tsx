"use client";

import React, { useState, useEffect } from "react";
import { 
  Gamepad2, 
  Zap, 
  Search, 
  ArrowRight, 
  CheckCircle2, 
  ChevronRight, 
  User as UserIcon, 
  Lock, 
  Mail, 
  LogOut, 
  Plus, 
  Trash2, 
  Loader2, 
  AlertCircle, 
  ShieldCheck, 
  ShoppingCart, 
  RefreshCw, 
  Smartphone, 
  CreditCard, 
  Clock, 
  Check, 
  XCircle, 
  Award, 
  Star, 
  ListFilter,
  Copy,
  HelpCircle,
  ExternalLink,
  Laptop,
  MessageSquare,
  Play,
  Users,
  Send,
  Home,
  Compass,
  PhoneCall,
  Menu,
  X,
  Wallet as WalletIcon,
  Bell,
  Settings as SettingsIcon,
  ShieldAlert,
  FileText,
  Info,
  DollarSign,
  UserCheck,
  MapPin,
  Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth, db } from "../lib/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User,
  sendPasswordResetEmail
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
  updateDoc,
  serverTimestamp 
} from "firebase/firestore";

// --- Firestore Error Handling (Required by Firebase Skill) ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Details: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Topup Items on the Screen ---
interface GamePackage {
  id: string;
  name: string;
  price: number;
}

interface TopupCategory {
  id: string;
  name: string;
  bengaliName: string;
  imageBg: string;
  emoji: string;
  badge?: string;
  placeholderId: string;
  idLabel: string;
  packages: GamePackage[];
}

const TOPUP_CATEGORIES: TopupCategory[] = [
  {
    id: "ff_id_code",
    name: "Free Fire TopUp (BD)",
    bengaliName: "আইডি কোড টপআপ",
    imageBg: "from-emerald-900 to-green-950",
    emoji: "🔥",
    badge: "অটো ডেলিভারি",
    placeholderId: "যেমন: 123456789",
    idLabel: "Player UID (플레이어 ID)",
    packages: [
      { id: "ff_115", name: "115 Diamonds", price: 82 },
      { id: "ff_240", name: "240 Diamonds", price: 160 },
      { id: "ff_505", name: "505 Diamonds", price: 325 },
      { id: "ff_1025", name: "1025 Diamonds", price: 650 },
    ]
  },
  {
    id: "unipin_voucher",
    name: "Unipin Voucher (BD)",
    bengaliName: "ইউনিপিন টপআপ",
    imageBg: "from-blue-900 to-cyan-950",
    emoji: "💳",
    badge: "ইনস্ট্যান্ট",
    placeholderId: "যেমন: 512345678",
    idLabel: "Unipin ID / Player Character ID",
    packages: [
      { id: "up_100", name: "100 Diamonds (UniPin)", price: 92 },
      { id: "up_210", name: "210 Diamonds (UniPin)", price: 180 },
      { id: "up_500", name: "500 Diamonds (UniPin)", price: 435 },
    ]
  },
  {
    id: "weekly_monthly",
    name: "Weekly&Monthly",
    bengaliName: "উইকলি মান্থলি",
    imageBg: "from-purple-900 to-indigo-950",
    emoji: "👑",
    badge: "Hot",
    placeholderId: "যেমন: 123456789",
    idLabel: "Player UID (플레이어 ID)",
    packages: [
      { id: "ff_weekly", name: "Weekly Membership (উইকলি)", price: 145 },
      { id: "ff_monthly", name: "Monthly Membership (মান্থলি)", price: 580 },
    ]
  },
  {
    id: "weekly_lite",
    name: "Weekly Light",
    bengaliName: "উইকলি লাইট",
    imageBg: "from-yellow-900 to-amber-950",
    emoji: "⚡",
    badge: "জনপ্রিয়",
    placeholderId: "যেমন: 123456789",
    idLabel: "Player UID (প্লেয়ার আইডি)",
    packages: [
      { id: "ff_weekly_lite", name: "Weekly Lite Membership", price: 95 },
    ]
  },
  {
    id: "evo_express",
    name: "Evo Express",
    bengaliName: "ইভো এক্সপ্রেস",
    imageBg: "from-rose-900 to-red-950",
    emoji: "🚀",
    badge: "হট ডিল",
    placeholderId: "যেমন: 123456789",
    idLabel: "Player UID (플레이어 ID)",
    packages: [
      { id: "ff_evo_token_100", name: "100 Evo Gun Tokens", price: 185 },
      { id: "ff_evo_token_200", name: "200 Evo Gun Tokens", price: 360 },
    ]
  },
  {
    id: "level_up_pass",
    name: "Level Up Pass",
    bengaliName: "লেভেল আপ পাস",
    imageBg: "from-teal-900 to-emerald-950",
    emoji: "🏆",
    badge: "১ বার লিমিট",
    placeholderId: "যেমন: 123456789",
    idLabel: "Player UID (প্লেয়ার আইডি)",
    packages: [
      { id: "ff_level_up", name: "Level Up Pass (লেভেল আপ পাস)", price: 160 },
    ]
  }
];

interface Order {
  id: string;
  userId: string;
  userEmail: string;
  gameName: string;
  gameId: string;
  packageName: string;
  price: number;
  paymentMethod: string;
  senderNumber: string;
  transactionId: string;
  status: "Pending" | "Processing" | "Completed" | "Cancelled";
  createdAt: any;
}

interface DepositRequest {
  id: string;
  userId: string;
  userEmail: string;
  amount: number;
  paymentMethod: string;
  senderNumber: string;
  transactionId: string;
  status: "Pending" | "Completed" | "Cancelled";
  createdAt: any;
}

type ActivePage = 
  | "home" 
  | "about" 
  | "contact" 
  | "pricing" 
  | "faq" 
  | "terms" 
  | "privacy" 
  | "login" 
  | "register" 
  | "forgot" 
  | "dashboard" 
  | "profile" 
  | "wallet" 
  | "transactions" 
  | "settings" 
  | "notifications";

export default function Page() {
  // Navigation
  const [currentPage, setCurrentPage] = useState<ActivePage>("home");
  const [showNotice, setShowNotice] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<TopupCategory | null>(null);
  const [selectedPack, setSelectedPack] = useState<GamePackage | null>(null);

  // Search Game State
  const [searchTerm, setSearchTerm] = useState("");

  // Order forms
  const [gamePlayerId, setGamePlayerId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"bkash" | "nagad" | "rocket">("bkash");
  const [senderNumber, setSenderNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Auth inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [forgotError, setForgotError] = useState("");

  // Dynamic user data
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(350); // Initial demo wallet balance
  const [userPhone, setUserPhone] = useState("01712345678");
  const [userUID, setUserUID] = useState("482910482");
  
  // App Notifications (demo reactive list)
  const [notifications, setNotifications] = useState([
    { id: 1, title: "রেজিস্ট্রেশন সফল", message: "RG BAZZER অ্যাকাউন্টে স্বাগতম! আপনার বোনাস কুপন চেক করুন।", time: "১ ঘণ্টা আগে", read: false },
    { id: 2, title: "অটো টপআপ চালু", message: "ফ্রি ফায়ার ইনস্ট্যান্ট ডায়মন্ড এখন ২০ সেকেন্ডে ডেলিভারি হচ্ছে।", time: "৩ ঘণ্টা আগে", read: true },
    { id: 3, title: "বিকাশ ক্যাশব্যাক অফার", message: "আজকে বিকাশ পেমেন্টে ৫% অতিরিক্ত টপ-আপ ডিসকাউন্ট দেওয়া হচ্ছে।", time: "১ দিন আগে", read: true }
  ]);

  // Wallet deposit form states
  const [depositAmount, setDepositAmount] = useState("");
  const [depositSender, setDepositSender] = useState("");
  const [depositTxID, setDepositTxID] = useState("");
  const [depositSubmitting, setDepositSubmitting] = useState(false);
  const [depositSuccessMsg, setDepositSuccessMsg] = useState("");
  const [depositErrorMsg, setDepositErrorMsg] = useState("");

  // Settings State
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [langBengali, setLangBengali] = useState(true);

  // Admin Dashboard Mode
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Track Auth Status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Logged in: auto redirect to dashboard if they were trying to login
        if (currentPage === "login" || currentPage === "register") {
          setCurrentPage("dashboard");
        }
      }
    });
    return () => unsubscribe();
  }, [currentPage]);

  // Real-time listener for user orders
  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }
    const q = query(
      collection(db, "orders"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: Order[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        fetched.push({
          id: d.id,
          userId: data.userId || "",
          userEmail: data.userEmail || "",
          gameName: data.gameName || "",
          gameId: data.gameId || "",
          packageName: data.packageName || "",
          price: data.price || 0,
          paymentMethod: data.paymentMethod || "",
          senderNumber: data.senderNumber || "",
          transactionId: data.transactionId || "",
          status: data.status || "Pending",
          createdAt: data.createdAt
        });
      });
      setOrders(fetched);
    }, (err) => {
      console.error("Firestore read error", err);
    });
    return () => unsubscribe();
  }, [user]);

  // Real-time listener for all orders when admin mode is turned on
  useEffect(() => {
    if (!isAdminMode) return;
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: Order[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        fetched.push({
          id: d.id,
          userId: data.userId || "",
          userEmail: data.userEmail || "",
          gameName: data.gameName || "",
          gameId: data.gameId || "",
          packageName: data.packageName || "",
          price: data.price || 0,
          paymentMethod: data.paymentMethod || "",
          senderNumber: data.senderNumber || "",
          transactionId: data.transactionId || "",
          status: data.status || "Pending",
          createdAt: data.createdAt
        });
      });
      setAllOrders(fetched);
    });
    return () => unsubscribe();
  }, [isAdminMode]);

  // Handle Authentication
  const handleAuth = async (e: React.FormEvent, type: "login" | "register") => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (!email || !password) {
      setAuthError("অনুগ্রহ করে আপনার সঠিক ইমেইল এবং পাসওয়ার্ড দিন।");
      return;
    }

    try {
      if (type === "register") {
        await createUserWithEmailAndPassword(auth, email, password);
        setAuthSuccess("অ্যাকাউন্ট তৈরি সফল হয়েছে! স্বাগতম।");
        setTimeout(() => setCurrentPage("dashboard"), 1000);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        setAuthSuccess("লগইন সফল হয়েছে! ড্যাশবোর্ডে রিডাইরেক্ট করা হচ্ছে...");
        setTimeout(() => setCurrentPage("dashboard"), 1000);
      }
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setAuthError("এই ইমেইলটি ইতিমধ্যে অন্য একটি অ্যাকাউন্টে ব্যবহার করা হয়েছে।");
      } else if (err.code === "auth/weak-password") {
        setAuthError("নিরাপত্তার স্বার্থে পাসওয়ার্ড অবশ্যই অন্তত ৬ অক্ষরের হতে হবে।");
      } else if (err.code === "auth/invalid-credential") {
        setAuthError("ভুল ইমেইল অথবা পাসওয়ার্ড! আবার সঠিক তথ্য দিয়ে চেষ্টা করুন।");
      } else {
        setAuthError(err.message || "অথেন্টিকেশন ব্যর্থ হয়েছে।");
      }
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");
    if (!forgotEmail) {
      setForgotError("অনুগ্রহ করে আপনার রেজিস্টার্ড ইমেইল এড্রেসটি দিন।");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, forgotEmail);
      setForgotSuccess("পাসওয়ার্ড রিসেট লিংকটি আপনার ইমেইলে পাঠানো হয়েছে! অনুগ্রহ করে ইনবক্স অথবা স্প্যাম ফোল্ডার চেক করুন।");
    } catch (err: any) {
      setForgotError("রিসেট রিকোয়েস্ট পাঠানো যায়নি। ইমেইলটি সঠিক কিনা যাচাই করুন।");
    }
  };

  // Submit Topup Order
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError(null);
    setOrderSuccess(null);

    if (!user) {
      setOrderError("অর্ডার কমপ্লিট করতে অনুগ্রহ করে প্রথমে সাইন-ইন বা লগইন করুন।");
      setCurrentPage("login");
      return;
    }

    if (!selectedCategory || !selectedPack) {
      setOrderError("অনুগ্রহ করে একটি গেম প্রোডাক্ট বা প্যাকেজ সিলেক্ট করুন।");
      return;
    }

    if (!gamePlayerId.trim()) {
      setOrderError("গেমের প্লেয়ার আইডি (Player Character ID) প্রদান করা অত্যন্ত আবশ্যক।");
      return;
    }

    if (!senderNumber.trim()) {
      setOrderError("টাকা পাঠানোর সেন্ডার বিকাশ/নগদ নাম্বারটি প্রদান করুন।");
      return;
    }

    if (!transactionId.trim()) {
      setOrderError("বিকাশ/নগদ পেমেন্ট সম্পন্ন করে সঠিক ট্রানজেকশন আইডি (TxID) দিন।");
      return;
    }

    setOrderSubmitting(true);

    const orderData = {
      userId: user.uid,
      userEmail: user.email || "",
      gameName: selectedCategory.name,
      gameId: gamePlayerId.trim(),
      packageName: selectedPack.name,
      price: selectedPack.price,
      paymentMethod: paymentMethod,
      senderNumber: senderNumber.trim(),
      transactionId: transactionId.trim(),
      status: "Pending",
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, "orders"), orderData);
      setOrderSuccess("আপনার টপ-আপ রিকোয়েস্টটি সফলভাবে সাবমিট হয়েছে! ৫ থেকে ১০ মিনিটের মধ্যে আইডি কোডে ডায়মন্ড চলে যাবে।");
      setGamePlayerId("");
      setSenderNumber("");
      setTransactionId("");
      setSelectedPack(null);
    } catch (err: any) {
      console.error(err);
      try {
        handleFirestoreError(err, OperationType.CREATE, "orders");
      } catch (formatted: any) {
        setOrderError(`অর্ডার ব্যর্থ হয়েছে: ${formatted.message}`);
      }
    } finally {
      setOrderSubmitting(false);
    }
  };

  // Submit Deposit Request
  const handleWalletDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositErrorMsg("");
    setDepositSuccessMsg("");

    if (!user) return;
    if (!depositAmount || Number(depositAmount) < 50) {
      setDepositErrorMsg("অনুগ্রহ করে সর্বনিম্ন ৫০ টাকা বা তার বেশি ডিপোজিট রিকোয়েস্ট দিন।");
      return;
    }
    if (!depositSender || !depositTxID) {
      setDepositErrorMsg("অনুগ্রহ করে পেমেন্ট সম্পন্ন করে সেন্ডার নাম্বার এবং TxnID দিন।");
      return;
    }

    setDepositSubmitting(true);

    const depositData: DepositRequest = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.uid,
      userEmail: user.email || "",
      amount: Number(depositAmount),
      paymentMethod: paymentMethod,
      senderNumber: depositSender,
      transactionId: depositTxID,
      status: "Pending",
      createdAt: new Date().toLocaleString()
    };

    try {
      // Add deposit to real-time local demo collection to simulate real payment approvals
      setDepositRequests([depositData, ...depositRequests]);
      setDepositSuccessMsg("আপনার ডিপোজিট আবেদনটি সফল হয়েছে! অ্যাডমিন পেমেন্ট চেক করে আপনার ওয়ালেটে ৫ মিনিটের মধ্যে টাকা অ্যাড করে দেবে।");
      setDepositAmount("");
      setDepositSender("");
      setDepositTxID("");
    } catch (err) {
      setDepositErrorMsg("ডিপোজিট সাবমিট করা সম্ভব হয়নি।");
    } finally {
      setDepositSubmitting(false);
    }
  };

  // Change Order status in Admin Mode
  const handleUpdateOrderStatus = async (id: string, newStatus: "Pending" | "Processing" | "Completed" | "Cancelled") => {
    try {
      const docRef = doc(db, "orders", id);
      await updateDoc(docRef, { status: newStatus });
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Order in Admin Mode
  const handleDeleteOrder = async (id: string) => {
    if (!window.confirm("আপনি কি নিশ্চিতভাবে এই অর্ডারটি ডিলিট করতে চান?")) return;
    try {
      const docRef = doc(db, "orders", id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const toggleNotificationRead = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Completed": return "bg-green-100 text-green-800 border-green-200";
      case "Processing": return "bg-blue-100 text-blue-800 border-blue-200";
      case "Cancelled": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  const getStatusBengali = (status: string) => {
    switch (status) {
      case "Completed": return "সফল হয়েছে";
      case "Processing": return "প্রসেসিং হচ্ছে";
      case "Cancelled": return "বাতিল হয়েছে";
      default: return "পেন্ডিং রিভিউ";
    }
  };

  const filteredGames = TOPUP_CATEGORIES.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    g.bengaliName.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-24 relative selection:bg-red-500 selection:text-white" id="root-viewport">
      
      {/* ======================================= NAVBAR ======================================= */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm px-4 py-3.5" id="global-navbar">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setCurrentPage("home"); setSelectedCategory(null); }}>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-600 text-white font-black shadow-md shadow-red-600/10">
              <ShoppingCart className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold text-red-600 tracking-tighter flex items-center gap-1">
                RG <span className="text-slate-900 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 text-base">BAZZER</span>
              </span>
              <span className="text-[10px] text-emerald-600 font-bold tracking-widest uppercase">
                সবচেয়ে বিশ্বস্ত টপআপ
              </span>
            </div>
          </div>

          {/* Nav Links - Desktop View */}
          <nav className="hidden md:flex items-center gap-5 text-xs font-bold text-slate-600">
            <button onClick={() => { setCurrentPage("home"); setSelectedCategory(null); }} className={`hover:text-red-600 transition ${currentPage === "home" ? "text-red-600" : ""}`}>হোম</button>
            <button onClick={() => setCurrentPage("pricing")} className={`hover:text-red-600 transition ${currentPage === "pricing" ? "text-red-600" : ""}`}>প্রাইসিং</button>
            <button onClick={() => setCurrentPage("about")} className={`hover:text-red-600 transition ${currentPage === "about" ? "text-red-600" : ""}`}>আমাদের সম্পর্কে</button>
            <button onClick={() => setCurrentPage("faq")} className={`hover:text-red-600 transition ${currentPage === "faq" ? "text-red-600" : ""}`}>প্রশ্নোত্তর (FAQ)</button>
            <button onClick={() => setCurrentPage("contact")} className={`hover:text-red-600 transition ${currentPage === "contact" ? "text-red-600" : ""}`}>যোগাযোগ</button>
          </nav>

          {/* Action buttons (Login/User Profile & Admin Panel Switch) */}
          <div className="flex items-center gap-2.5">
            <button 
              onClick={() => setIsAdminMode(!isAdminMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black tracking-tight transition-all border ${
                isAdminMode 
                ? "bg-purple-600 text-white border-purple-700 shadow-sm" 
                : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
              }`}
            >
              <Laptop className="w-3 h-3" />
              <span>{isAdminMode ? "টেস্ট অ্যাডমিন: অন" : "অ্যাডমিন টেস্ট"}</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage("dashboard")} 
                  className={`bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-lg border border-slate-200 relative ${currentPage === "dashboard" ? "bg-red-50 text-red-600 border-red-200" : ""}`}
                  title="Dashboard"
                >
                  <UserIcon className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setCurrentPage("wallet")} 
                  className="hidden sm:flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-100 px-2.5 py-1.5 rounded-lg text-xs font-bold"
                >
                  <WalletIcon className="w-3.5 h-3.5 text-emerald-600" />
                  ৳{walletBalance} BDT
                </button>
                <button
                  onClick={async () => {
                    await signOut(auth);
                    setCurrentPage("home");
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-sm shadow-red-600/10"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCurrentPage("login")}
                className="bg-[#007f4e] hover:bg-[#00663e] text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-sm"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ======================================= MULTI-PAGE NOTICES ======================================= */}
      {showNotice && (
        <div className="max-w-4xl mx-auto mt-4 px-4" id="notice-board">
          <div className="bg-[#007f4e] text-white rounded-xl p-4 shadow-sm border border-emerald-700 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-pulse">
            <button 
              onClick={() => setShowNotice(false)} 
              className="absolute top-2.5 right-2.5 bg-black/20 hover:bg-black/40 text-white rounded-full p-1 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-start gap-2.5">
              <div className="bg-red-600 text-white text-[11px] font-black px-2 py-1 rounded uppercase tracking-wider shadow-sm mt-0.5 animate-bounce shrink-0">
                Notice:
              </div>
              <p className="text-xs sm:text-sm font-semibold leading-relaxed pr-6 md:pr-0 text-amber-100">
                বাবা-মা বিকাশ থেকে টাকা চুরি করে কেউ অর্ডার করবেন না অর্ডার করলে কোন প্রকার ডাইমন্ড পাবেন না ,, ১৮ বছরের নিচে কেউ অর্ডার করবেন না। যে কোন সমস্যায় WhatsApp 01858039475
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================= ROUTED VIEWS ======================================= */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="w-full"
        >
          
          {/* 1. HOME PAGE */}
          {currentPage === "home" && (
            <div className="max-w-4xl mx-auto px-4 mt-4 space-y-8">
              
              {/* Promo Banner */}
              <div className="bg-gradient-to-r from-[#005c36] via-[#007f4e] to-slate-900 text-white rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-md flex flex-col md:flex-row items-center justify-between gap-6 min-h-[180px]">
                <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-emerald-500/10 blur-xl"></div>
                <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-red-500/10 blur-xl"></div>
                <div className="space-y-4 text-center md:text-left z-10">
                  <div className="inline-flex items-center gap-1.5 bg-yellow-400 text-slate-950 font-extrabold text-[10px] uppercase px-2.5 py-1 rounded-full tracking-wider shadow-sm">
                    <Zap className="w-3 h-3 fill-slate-950 text-slate-950" />
                    সুপার ফাস্ট ডেলিভারি
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                    নতুন নিয়মে ডায়মন্ড <br />
                    <span className="text-yellow-300">টপআপ করুন নিজে নিজেই</span>
                  </h2>
                  <div className="inline-block bg-[#007f4e] border border-emerald-400/30 text-white font-bold text-xs px-4 py-1.5 rounded-full shadow-sm">
                    ২০ সেকেন্ডে অটো ডেলিভারি ⚡
                  </div>
                </div>
                <div className="text-6xl sm:text-7xl select-none transform hover:scale-110 transition duration-300 filter drop-shadow-md py-2 md:py-0">
                  🦸‍♂️🔥💎
                </div>
              </div>

              {/* Support Buttons */}
              <div className="grid grid-cols-3 gap-2.5">
                <a href="https://t.me/" target="_blank" rel="noreferrer" className="bg-[#007f4e] hover:bg-[#00663e] text-white p-3.5 rounded-xl flex flex-col items-center justify-center text-center shadow-sm transition transform hover:-translate-y-0.5">
                  <Send className="w-5 h-5 mb-1.5 text-sky-200 fill-sky-200" />
                  <span className="text-[9px] uppercase tracking-wider text-emerald-100 font-medium">Support</span>
                  <span className="text-xs sm:text-sm font-black mt-0.5">Telegram</span>
                </a>
                <a href="https://facebook.com/" target="_blank" rel="noreferrer" className="bg-[#007f4e] hover:bg-[#00663e] text-white p-3.5 rounded-xl flex flex-col items-center justify-center text-center shadow-sm transition transform hover:-translate-y-0.5">
                  <Users className="w-5 h-5 mb-1.5 text-emerald-200" />
                  <span className="text-[9px] uppercase tracking-wider text-emerald-100 font-medium">Group</span>
                  <span className="text-xs sm:text-sm font-black mt-0.5">Join Group</span>
                </a>
                <a href="https://wa.me/01858039475" target="_blank" rel="noreferrer" className="bg-[#007f4e] hover:bg-[#00663e] text-white p-3.5 rounded-xl flex flex-col items-center justify-center text-center shadow-sm transition transform hover:-translate-y-0.5">
                  <MessageSquare className="w-5 h-5 mb-1.5 text-green-200" />
                  <span className="text-[9px] uppercase tracking-wider text-emerald-100 font-medium">Chat</span>
                  <span className="text-xs sm:text-sm font-black mt-0.5">WhatsApp</span>
                </a>
              </div>

              {/* Search bar inside Home Catalog */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                <input 
                  type="text" 
                  placeholder="আপনার পছন্দের গেমের ক্যাটাগরি বা টপ-আপ প্যাকেজ খুঁজুন..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent border-none text-slate-800 placeholder-slate-400 focus:outline-none text-sm font-medium"
                />
              </div>

              {/* Free Fire Section Header */}
              <div>
                <div className="border-b-2 border-slate-250 pb-2 mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5">
                    <Gamepad2 className="w-5.5 h-5.5 text-[#007f4e]" />
                    ফ্রি ফায়ার ও অন্যান্য গেম টপ-আপ তালিকা
                  </h3>
                  <span className="text-xxs bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-black uppercase">Active</span>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {filteredGames.map((cat) => (
                    <div 
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setSelectedPack(cat.packages[0] || null);
                        setOrderError(null);
                        setOrderSuccess(null);
                      }}
                      className="bg-white border border-slate-100 hover:border-[#007f4e] rounded-2xl p-4 flex flex-col items-center justify-between text-center cursor-pointer transition-all shadow-sm hover:shadow-md hover:-translate-y-1 group"
                    >
                      <div className={`w-28 h-28 rounded-2xl bg-gradient-to-br ${cat.imageBg} flex items-center justify-center relative shadow-inner overflow-hidden mb-3.5`}>
                        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px] opacity-10"></div>
                        <span className="text-4xl filter drop-shadow-md transform group-hover:scale-125 transition duration-300">{cat.emoji}</span>
                        <div className="absolute bottom-2 inset-x-2 bg-emerald-500/90 border border-emerald-400 backdrop-blur-sm text-white rounded-full py-1 text-[11px] font-black tracking-tight flex items-center justify-center shadow-md">
                          {cat.bengaliName}
                        </div>
                      </div>

                      <div className="w-full">
                        <span className="font-extrabold text-slate-800 text-xs sm:text-sm group-hover:text-[#007f4e] transition-colors line-clamp-1">
                          {cat.name}
                        </span>
                        {cat.badge && (
                          <span className="inline-block mt-1 bg-red-100 text-red-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-red-200">
                            {cat.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Home Reviews Block */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-1.5">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <h4 className="font-extrabold text-slate-800 text-sm">গ্রাহকদের বিশ্বস্ত মতামত (৫/৫ রেটিং)</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-700">জাহিদ হাসান</span>
                      <span className="text-amber-500">★★★★★</span>
                    </div>
                    <p className="text-slate-500 italic">"ভাই জাস্ট ১ মিনিটে ডেলিভারি পাইলাম! এই সাইটটা আসলেই সেরা ও ট্রাস্টেড।"</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-700">মাহিন রহমান</span>
                      <span className="text-amber-500">★★★★★</span>
                    </div>
                    <p className="text-slate-500 italic">"বিকাশে সেন্ড মানি করে সাবমিট করলাম আর সাথে সাথেই ডায়মন্ড চলে এলো। ধন্যবাদ আরজি বাজার।"</p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* 2. ABOUT US */}
          {currentPage === "about" && (
            <div className="max-w-3xl mx-auto px-4 mt-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
                <div className="text-center space-y-2">
                  <div className="inline-flex p-3 bg-red-50 text-red-600 rounded-full">
                    <Info className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-800">আমাদের সম্পর্কে (About Us)</h2>
                  <p className="text-xs text-slate-500">RG BAZZER - বাংলাদেশের নাম্বার ওয়ান নির্ভরযোগ্য গেমিং প্ল্যাটফর্ম</p>
                </div>

                <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  <p>
                    <strong>RG BAZZER</strong> বাংলাদেশের একটি অগ্রগামী গেমিং ই-কমার্স প্ল্যাটফর্ম। আমাদের মূল লক্ষ্য হল গেমিং প্রিয় ভাই-বোনদের জন্য কোনো জটিলতা ছাড়াই, ১০০% বিশ্বস্ত ও ঝামেলাহীন উপায়ে গেম টপ-আপ সেবা দেওয়া।
                  </p>
                  <p>
                    আমরা সম্পূর্ণ আধুনিক ও সিকিউর প্রযুক্তির সাহায্যে আপনাদের ফ্রি ফায়ার ডায়মন্ড, ইউনিপিন ভাউচার এবং অন্যান্য গেমিং রিলোড সেবা সরাসরি বিকাশ, নগদ এবং রকেট মোবাইল ওয়ালেটের মাধ্যমে অতি দ্রুত সম্পন্ন করে থাকি।
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                      <h4 className="font-black text-slate-800 text-sm flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        শতভাগ বিশ্বস্ততা
                      </h4>
                      <p className="text-xs text-slate-500">কোনো প্রকার আইডি লক বা ব্যান হওয়ার ভয় নেই। আমরা অফিসিয়াল পেমেন্ট মেথড ব্যবহার করি।</p>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                      <h4 className="font-black text-slate-800 text-sm flex items-center gap-1">
                        <Clock className="w-4 h-4 text-red-600" />
                        ইনস্ট্যান্ট ডেলিভারি
                      </h4>
                      <p className="text-xs text-slate-500">অর্ডার সম্পন্ন করার ৫ মিনিটের মধ্যে সরাসরি আপনার আইডি কোডে ডেলিভারি নিশ্চিত করা হয়।</p>
                    </div>
                  </div>

                  <p className="pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
                    আমাদের সাথে থাকার জন্য আপনাকে অসংখ্য ধন্যবাদ! যেকোনো প্রয়োজনে সরাসরি আমাদের হোয়াটসঅ্যাপে যোগাযোগ করুন।
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3. CONTACT US */}
          {currentPage === "contact" && (
            <div className="max-w-3xl mx-auto px-4 mt-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
                <div className="text-center space-y-2">
                  <div className="inline-flex p-3 bg-[#007f4e]/10 text-[#007f4e] rounded-full">
                    <PhoneCall className="w-8 h-8 animate-bounce" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-800">যোগাযোগ করুন (Contact Us)</h2>
                  <p className="text-xs text-slate-500">যেকোনো প্রকার অর্ডার সমস্যা বা পেমেন্ট চেকআপের জন্য আমাদের সাথে যুক্ত হোন</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  
                  {/* Contact Info */}
                  <div className="space-y-4 text-xs sm:text-sm">
                    <h4 className="font-black text-slate-800 text-sm">অফিসিয়াল যোগাযোগ চ্যানেল</h4>
                    <p className="text-slate-600">আপনি যেকোনো অর্ডার সংক্রান্ত সাহায্য পেতে নিচের দেয়া চ্যানেলগুলোতে কথা বলতে পারেন।</p>
                    
                    <div className="space-y-3 pt-2">
                      <a href="https://wa.me/01858039475" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl hover:bg-emerald-100/50 transition">
                        <MessageSquare className="w-5 h-5 text-emerald-600" />
                        <div>
                          <strong className="block text-xs">হোয়াটসঅ্যাপ চ্যাট (WhatsApp)</strong>
                          <span className="text-xxs text-slate-500">01858-039475 (২৪/৭ হেল্পলাইন)</span>
                        </div>
                      </a>

                      <a href="https://t.me/" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-sky-50 border border-sky-100 text-sky-800 rounded-2xl hover:bg-sky-100/50 transition">
                        <Send className="w-5 h-5 text-sky-600" />
                        <div>
                          <strong className="block text-xs">টেলিগ্রাম চ্যানেল (Telegram Channel)</strong>
                          <span className="text-xxs text-slate-500">t.me/rgbazzer_bd</span>
                        </div>
                      </a>

                      <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                        <MapPin className="w-5 h-5 text-red-600" />
                        <div>
                          <strong className="block text-xs">হেড অফিস ঠিকানা</strong>
                          <span className="text-xxs text-slate-500">মতিঝিল বা/এ, ঢাকা ১০০০, বাংলাদেশ।</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Form */}
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                    <h4 className="font-black text-slate-800 text-xs">আমাদের মেসেজ পাঠান</h4>
                    <form onSubmit={(e) => { e.preventDefault(); alert("মেসেজ সফলভাবে সাবমিট হয়েছে! আমরা শীঘ্রই আপনার সাথে ইমেইলে যোগাযোগ করবো।"); }} className="space-y-3 text-xs">
                      <div>
                        <label className="block text-slate-500 mb-1 font-bold">আপনার নাম</label>
                        <input type="text" required placeholder="নাম লিখুন..." className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-600" />
                      </div>
                      <div>
                        <label className="block text-slate-500 mb-1 font-bold">আপনার ইমেইল এড্রেস</label>
                        <input type="email" required placeholder="যেমন: mail@domain.com" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-600" />
                      </div>
                      <div>
                        <label className="block text-slate-500 mb-1 font-bold">মেসেজের বিষয়</label>
                        <textarea required rows={3} placeholder="বিস্তারিত তথ্য এখানে লিখুন..." className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-600"></textarea>
                      </div>
                      <button type="submit" className="w-full py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition">মেসেজ পাঠান</button>
                    </form>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* 4. PRICING SECTION */}
          {currentPage === "pricing" && (
            <div className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="text-center space-y-1">
                  <h2 className="text-2xl font-black text-slate-800 flex items-center justify-center gap-2">
                    <DollarSign className="w-6 h-6 text-emerald-600" />
                    টপ-আপ প্যাকেজের রেট ও প্রাইসিং লিস্ট
                  </h2>
                  <p className="text-xs text-slate-500">বাংলাদেশে সবচেয়ে কম খরচে অফিসিয়াল গেমিং ডায়মন্ড ও ইউসি প্রাইস টেবিল</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {TOPUP_CATEGORIES.map(cat => (
                    <div key={cat.id} className="border border-slate-150 rounded-2xl p-4 bg-slate-50 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                          <span className="text-lg">{cat.emoji}</span>
                          {cat.name}
                        </span>
                        <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">{cat.bengaliName}</span>
                      </div>
                      
                      <div className="space-y-2 text-xs">
                        {cat.packages.map(p => (
                          <div key={p.id} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-100">
                            <span className="font-bold text-slate-700">{p.name}</span>
                            <span className="font-black text-[#007f4e]">৳{p.price} BDT</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 5. FAQ (Frequently Asked Questions) */}
          {currentPage === "faq" && (
            <div className="max-w-3xl mx-auto px-4 mt-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
                <div className="text-center space-y-1">
                  <div className="inline-flex p-2.5 bg-yellow-50 text-yellow-600 rounded-full mb-1">
                    <HelpCircle className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-800">জিজ্ঞাসিত প্রশ্ন ও উত্তর (FAQ)</h2>
                  <p className="text-xs text-slate-500">টপআপ সেবা নেওয়ার পূর্বে সাধারণ প্রশ্নের উত্তরগুলো জেনে নিন</p>
                </div>

                <div className="space-y-4 text-xs sm:text-sm">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                    <h4 className="font-black text-slate-800 flex items-center gap-1.5">
                      <span className="text-red-600">Q.</span> ডায়মন্ড বা প্যাকেজ ডেলিভারি পেতে কতক্ষণ সময় লাগে?
                    </h4>
                    <p className="text-slate-600 pl-5">
                      A. আমাদের সাইটে সম্পূর্ণ অটোমেটেড পদ্ধতি ব্যবহার করা হয়। আপনি সঠিক পেমেন্ট সেন্ড করে সাবমিট করার ৫ থেকে ১০ মিনিটের মধ্যে ইনস্ট্যান্ট ডেলিভারি পেয়ে যাবেন।
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                    <h4 className="font-black text-slate-800 flex items-center gap-1.5">
                      <span className="text-red-600">Q.</span> আমার আইডি হ্যাক বা লক হওয়ার কোনো সম্ভাবনা আছে কি?
                    </h4>
                    <p className="text-slate-600 pl-5">
                      A. না! আমরা অফিসিয়াল ইন-গেম রিচার্জ পদ্ধতি ও কোড ডায়মন্ড রিচার্জ প্রদান করি। আপনার গেম আইডি ১০০% নিরাপদ থাকবে, কোনো পাসওয়ার্ড দিতে হয় না।
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                    <h4 className="font-black text-slate-800 flex items-center gap-1.5">
                      <span className="text-red-600">Q.</span> যদি ভুল প্লেয়ার আইডি দেই তবে কী হবে?
                    </h4>
                    <p className="text-slate-600 pl-5">
                      A. যদি ভুল প্লেয়ার আইডি প্রদান করেন এবং সেটি সক্রিয় কোনো গেমার অ্যাকাউন্ট হয় তবে রিচার্জ বাতিল করা সম্ভব হয় না। তাই পেমেন্ট করার সময় অবশ্যই আইডি ডাবল চেক করে নেবেন।
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                    <h4 className="font-black text-slate-800 flex items-center gap-1.5">
                      <span className="text-red-600">Q.</span> টাকা পাঠিয়ে ট্রানজেকশন আইডি সাবমিট করতে না পারলে কী করবো?
                    </h4>
                    <p className="text-slate-600 pl-5">
                      A. ঘাবড়ানোর কোনো কারণ নেই। আপনার পেমেন্ট সেন্ডার নাম্বার এবং টাকা পাঠানোর স্ক্রিনশট নিয়ে সরাসরি আমাদের হোয়াটসঅ্যাপে (01858039475) মেসেজ করুন। অ্যাডমিন নিজে ম্যানুয়ালি অর্ডার অ্যাড করে দেবে।
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 6. TERMS & CONDITIONS */}
          {currentPage === "terms" && (
            <div className="max-w-3xl mx-auto px-4 mt-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm text-xs sm:text-sm text-slate-600 leading-relaxed">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <FileText className="w-5 h-5 text-red-600" />
                  শর্তাবলী ও নিয়মসমূহ (Terms & Conditions)
                </h2>
                <p>
                  RG BAZZER গেমিং পোর্টাল ব্যবহার করার পূর্বে দয়া করে নিচের শর্তাবলী অত্যন্ত গুরুত্ব দিয়ে পড়ে নিন:
                </p>
                <ol className="list-decimal pl-5 space-y-2.5">
                  <li><strong>আইনি সম্মতি:</strong> বাবা-মা বা অভিভাবকের মোবাইল থেকে না জানিয়ে টাকা পাঠানো কঠোরভাবে নিষিদ্ধ। প্রাপ্ত অভিযোগের ক্ষেত্রে কোনো রিফান্ড বা ডেলিভারি করা হবে না এবং ইউজার আইডি ব্লক করা হবে।</li>
                  <li><strong>সঠিক তথ্য প্রদান:</strong> প্লেয়ার আইডি বা ক্যারেক্টার নাম ভুল দিলে তার দায়ভার সম্পূর্ণ গ্রাহকের।</li>
                  <li><strong>ডেলিভারি সময়সীমা:</strong> সাধারণত ৫-১০ মিনিটের মধ্যে কাজ সম্পন্ন করা হলেও নেটওয়ার্ক বা গেম সার্ভার ডাউন থাকলে সর্বোচ্চ ২ ঘণ্টা পর্যন্ত সময় লাগতে পারে।</li>
                  <li><strong>রিফান্ড পলিসি:</strong> একবার ডায়মন্ড সফলভাবে ডেলিভারি হয়ে গেলে তা ফেরত বা রিফান্ডযোগ্য নয়।</li>
                </ol>
                <p className="text-xxs text-slate-400 text-center pt-4">শর্তাবলী যেকোনো সময় পরিবর্তন করার অধিকার আরজি বাজার কর্তৃপক্ষ সংরক্ষণ করে।</p>
              </div>
            </div>
          )}

          {/* 7. PRIVACY POLICY */}
          {currentPage === "privacy" && (
            <div className="max-w-3xl mx-auto px-4 mt-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm text-xs sm:text-sm text-slate-600 leading-relaxed">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  গোপনীয়তা নীতি (Privacy Policy)
                </h2>
                <p>
                  আপনার ব্যক্তিগত ডেটার সুরক্ষার বিষয়ে আরজি বাজার অত্যন্ত সচেতন। আমরা কীভাবে আপনার তথ্য সংগ্রহ ও ব্যবহার করি তা নিচে উল্লেখ করা হলো:
                </p>
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-800">১. সংগ্রহীত তথ্য</h4>
                  <p className="pl-4">অর্ডার প্রক্রিয়া সহজ করার সুবিধার্থে আমরা গ্রাহকের ইমেইল এড্রেস, ফোন নাম্বার, গেম প্লেয়ার আইডি এবং পেমেন্ট সংক্রান্ত ট্রানজেকশন আইডি সংগ্রহ করে থাকি।</p>
                  
                  <h4 className="font-bold text-slate-800">২. তথ্যের নিরাপত্তা</h4>
                  <p className="pl-4">ফায়ারবেস সিকিউর ক্লাউড ডাটাবেসের মাধ্যমে গ্রাহকের ডেটা সুরক্ষিত রাখা হয়। আপনার ডেটা কোনো তৃতীয় পক্ষের সাথে শেয়ার করা হয় না।</p>
                </div>
              </div>
            </div>
          )}

          {/* 8. LOGIN PAGE */}
          {currentPage === "login" && (
            <div className="max-w-md mx-auto px-4 mt-12">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-black text-slate-800">গ্রাহক লগইন (Login)</h2>
                  <p className="text-xs text-slate-500">আপনার অর্ডার ট্র্যাক করতে এবং ওয়ালেট ব্যবহার করতে লগইন করুন</p>
                </div>

                {authError && (
                  <div className="p-3.5 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                {authSuccess && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{authSuccess}</span>
                  </div>
                )}

                <form onSubmit={(e) => handleAuth(e, "login")} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1.5">ইমেইল এড্রেস</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input 
                        type="email" 
                        required
                        placeholder="আপনার ইমেইল দিন..."
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold mb-1.5">পাসওয়ার্ড</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input 
                        type="password" 
                        required
                        placeholder="পাসওয়ার্ড দিন..."
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-600"
                      />
                    </div>
                  </div>

                  <button type="submit" className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition shadow-sm">লগইন করুন</button>
                </form>

                <div className="flex justify-between items-center text-xxs text-red-600 pt-2 border-t border-slate-100">
                  <button onClick={() => setCurrentPage("forgot")} className="hover:underline">পাসওয়ার্ড ভুলে গেছেন?</button>
                  <button onClick={() => setCurrentPage("register")} className="hover:underline font-bold">নতুন অ্যাকাউন্ট তৈরি করুন</button>
                </div>
              </div>
            </div>
          )}

          {/* 9. REGISTER PAGE */}
          {currentPage === "register" && (
            <div className="max-w-md mx-auto px-4 mt-12">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-black text-slate-800">রেজিস্ট্রেশন করুন (Register)</h2>
                  <p className="text-xs text-slate-500">টপ-আপ রিকোয়েস্ট দিতে এবং কুপন বোনাস পেতে অ্যাকাউন্ট খুলুন</p>
                </div>

                {authError && (
                  <div className="p-3.5 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                {authSuccess && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{authSuccess}</span>
                  </div>
                )}

                <form onSubmit={(e) => handleAuth(e, "register")} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1.5">ইমেইল এড্রেস</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input 
                        type="email" 
                        required
                        placeholder="যেমন: example@domain.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold mb-1.5">পাসওয়ার্ড</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input 
                        type="password" 
                        required
                        placeholder="অন্তত ৬ অক্ষরের নতুন পাসওয়ার্ড..."
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-600"
                      />
                    </div>
                  </div>

                  <button type="submit" className="w-full py-3 bg-[#007f4e] text-white font-bold rounded-xl hover:bg-[#00663e] transition shadow-sm">রেজিস্টার অ্যাকাউন্ট</button>
                </form>

                <div className="text-center text-xxs text-slate-500 pt-2 border-t border-slate-100">
                  ইতিমধ্যে অ্যাকাউন্ট আছে? {" "}
                  <button onClick={() => setCurrentPage("login")} className="text-red-600 hover:underline font-bold">লগইন করুন</button>
                </div>
              </div>
            </div>
          )}

          {/* 10. FORGOT PASSWORD */}
          {currentPage === "forgot" && (
            <div className="max-w-md mx-auto px-4 mt-12">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-black text-slate-800">পাসওয়ার্ড রিসেট (Forgot Password)</h2>
                  <p className="text-xs text-slate-500">আপনার রেজিস্টার্ড ইমেইলে পাসওয়ার্ড রিসেট লিংক পাঠানো হবে</p>
                </div>

                {forgotError && (
                  <div className="p-3.5 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}

                {forgotSuccess && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{forgotSuccess}</span>
                  </div>
                )}

                <form onSubmit={handlePasswordReset} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1.5">রেজিস্টার্ড ইমেইল এড্রেস</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input 
                        type="email" 
                        required
                        placeholder="আপনার রেজিস্টার্ড ইমেইল দিন..."
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-600"
                      />
                    </div>
                  </div>

                  <button type="submit" className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition shadow-sm">পাসওয়ার্ড রিসেট লিংক পাঠান</button>
                </form>

                <div className="text-center text-xxs pt-2 border-t border-slate-100">
                  <button onClick={() => setCurrentPage("login")} className="text-slate-500 hover:text-slate-800 hover:underline">লগইন স্ক্রিনে ফিরে যান</button>
                </div>
              </div>
            </div>
          )}

          {/* 11. DASHBOARD PAGE (Private) */}
          {currentPage === "dashboard" && (
            <div className="max-w-4xl mx-auto px-4 mt-6">
              {!user ? (
                <div className="p-8 text-center bg-white border border-slate-200 rounded-3xl space-y-3">
                  <Lock className="w-12 h-12 text-red-500 mx-auto" />
                  <h4 className="font-bold text-slate-800 text-sm">লগইন আবশ্যক</h4>
                  <p className="text-xs text-slate-500">ড্যাশবোর্ড অ্যাক্সেস করতে অনুগ্রহ করে প্রথমে আপনার অ্যাকাউন্টে লগইন করুন।</p>
                  <button onClick={() => setCurrentPage("login")} className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl">লগইন করুন</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* Left Column: Side Navigation for Dashboard */}
                  <div className="md:col-span-3 space-y-2">
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center space-y-2.5">
                      <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto text-sm font-black border border-red-100">
                        {user.email?.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-xs">
                        <span className="font-extrabold text-slate-800 truncate block max-w-[150px] mx-auto">{user.email}</span>
                        <span className="text-xxs text-emerald-600 font-bold block mt-0.5">অ্যাক্টিভ মেম্বার</span>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-2.5 space-y-1 text-xs font-bold text-slate-600">
                      <button onClick={() => setCurrentPage("dashboard")} className="w-full text-left px-3.5 py-2.5 rounded-xl bg-red-50 text-red-600 flex items-center gap-2"><Home className="w-4 h-4" /> ড্যাশবোর্ড হোম</button>
                      <button onClick={() => setCurrentPage("profile")} className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-slate-50 flex items-center gap-2"><UserIcon className="w-4 h-4" /> প্রোফাইল তথ্য</button>
                      <button onClick={() => setCurrentPage("wallet")} className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-slate-50 flex items-center gap-2"><WalletIcon className="w-4 h-4" /> ওয়ালেট ও রিচার্জ</button>
                      <button onClick={() => setCurrentPage("transactions")} className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-slate-50 flex items-center gap-2"><Clock className="w-4 h-4" /> ট্রানজেকশন হিস্ট্রি</button>
                      <button onClick={() => setCurrentPage("settings")} className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-slate-50 flex items-center gap-2"><SettingsIcon className="w-4 h-4" /> সেটিংস</button>
                      <button onClick={() => setCurrentPage("notifications")} className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-slate-50 flex items-center gap-2 relative">
                        <Bell className="w-4 h-4" /> 
                        <span>বিজ্ঞপ্তি</span>
                        {notifications.filter(n => !n.read).length > 0 && (
                          <span className="absolute right-3.5 bg-red-600 text-white rounded-full text-[9px] w-4.5 h-4.5 flex items-center justify-center font-black">
                            {notifications.filter(n => !n.read).length}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Dashboard Summary & Overview Stats */}
                  <div className="md:col-span-9 space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm text-center">
                        <span className="text-xxs text-slate-400 block uppercase font-extrabold">ওয়ালেট ব্যালেন্স</span>
                        <strong className="text-sm sm:text-lg font-black text-red-600 block mt-1">৳{walletBalance} BDT</strong>
                      </div>
                      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm text-center">
                        <span className="text-xxs text-slate-400 block uppercase font-extrabold">মোট অর্ডার সংখ্যা</span>
                        <strong className="text-sm sm:text-lg font-black text-slate-800 block mt-1">{orders.length} টি</strong>
                      </div>
                      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm text-center">
                        <span className="text-xxs text-slate-400 block uppercase font-extrabold">ক্যাশব্যাক কুপন</span>
                        <strong className="text-sm sm:text-lg font-black text-emerald-600 block mt-1">১টি বোনাস</strong>
                      </div>
                    </div>

                    {/* Order List tracker in Dashboard */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                        <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                          <Clock className="w-4.5 h-4.5 text-[#007f4e]" />
                          আপনার সাম্প্রতিক টপ-আপ অর্ডারসমূহ (লাইভ)
                        </h3>
                        <span className="text-xxs bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full">রিয়েল-টাইম</span>
                      </div>

                      {orders.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-xs space-y-2">
                          <Gamepad2 className="w-8 h-8 text-slate-300 mx-auto" />
                          <p>আপনি এখনো কোনো অর্ডার করেননি।</p>
                          <button onClick={() => setCurrentPage("home")} className="text-red-600 hover:underline font-bold text-xxs">প্রথম টপআপ অর্ডার করুন →</button>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs text-slate-600">
                            <thead>
                              <tr className="bg-slate-50 text-slate-400 border-b border-slate-100 text-xxs uppercase">
                                <th className="py-2 px-3">গেম ক্যাটাগরি</th>
                                <th className="py-2 px-3">প্যাকেজ</th>
                                <th className="py-2 px-3">প্লেয়ার আইডি</th>
                                <th className="py-2 px-3">৳ মূল্য</th>
                                <th className="py-2 px-3 text-right">অবস্থা (Status)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {orders.map((ord) => (
                                <tr key={ord.id} className="hover:bg-slate-50/50 transition">
                                  <td className="py-2.5 px-3 font-bold text-slate-800">{ord.gameName}</td>
                                  <td className="py-2.5 px-3 text-emerald-700 font-bold">{ord.packageName}</td>
                                  <td className="py-2.5 px-3 font-mono text-slate-700 font-bold">{ord.gameId}</td>
                                  <td className="py-2.5 px-3 font-extrabold text-slate-900">৳{ord.price}</td>
                                  <td className="py-2.5 px-3 text-right">
                                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black border ${getStatusStyle(ord.status)}`}>
                                      {getStatusBengali(ord.status)}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* 12. PROFILE PAGE (Private) */}
          {currentPage === "profile" && (
            <div className="max-w-3xl mx-auto px-4 mt-6">
              {!user ? (
                <div className="p-6 text-center bg-white border border-slate-200 rounded-3xl">লগইন করুন।</div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                    <UserIcon className="w-5 h-5 text-red-600" />
                    আপনার প্রোফাইল তথ্য (Profile Page)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs sm:text-sm">
                    <div className="space-y-1.5">
                      <label className="block text-slate-400 font-semibold">রেজিস্টার্ড ইমেইল এড্রেস</label>
                      <input type="text" readOnly value={user.email || ""} className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 outline-none" />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-slate-500 font-semibold">হোয়াটসঅ্যাপ নাম্বার (আপডেট করুন)</label>
                      <input 
                        type="text" 
                        value={userPhone} 
                        onChange={(e) => setUserPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-1 focus:ring-red-600" 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-slate-500 font-semibold">ডিফল্ট ফ্রি ফায়ার প্লেয়ার আইডি</label>
                      <input 
                        type="text" 
                        value={userUID} 
                        onChange={(e) => setUserUID(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-1 focus:ring-red-600" 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-slate-400 font-semibold">ইউজার আইডি (UID)</label>
                      <input type="text" readOnly value={user.uid} className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-400 font-mono outline-none text-xs" />
                    </div>
                  </div>

                  <button 
                    onClick={() => { alert("প্রোফাইল তথ্য সফলভাবে সেভ হয়েছে!"); }}
                    className="px-6 py-2.5 bg-[#007f4e] text-white font-bold text-xs rounded-xl hover:bg-[#00663e]"
                  >
                    তথ্য সংরক্ষণ করুন
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 13. WALLET PAGE (Private) */}
          {currentPage === "wallet" && (
            <div className="max-w-3xl mx-auto px-4 mt-6">
              {!user ? (
                <div className="p-6 text-center bg-white border border-slate-200 rounded-3xl">লগইন করুন।</div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
                  
                  {/* Wallet Balance Display header */}
                  <div className="p-5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl flex items-center justify-between shadow-sm">
                    <div className="space-y-1">
                      <span className="text-xxs uppercase tracking-wider text-red-100 font-bold block">আপনার বর্তমান ওয়ালেট ব্যালেন্স</span>
                      <strong className="text-2xl font-black">৳{walletBalance} BDT</strong>
                    </div>
                    <WalletIcon className="w-10 h-10 text-red-200/40" />
                  </div>

                  {/* Add Money Form */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Plus className="w-4.5 h-4.5 text-emerald-600" />
                      ওয়ালেট রিচার্জ করুন (Add Money)
                    </h3>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <button type="button" onClick={() => setPaymentMethod("bkash")} className={`py-2 px-1.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${paymentMethod === "bkash" ? "bg-pink-50 border-pink-500 text-pink-600 font-extrabold" : "bg-slate-50 border-slate-200 hover:bg-slate-100"}`}>
                        <Smartphone className="w-4 h-4 text-pink-500" />
                        <span>বিকাশ (bKash)</span>
                      </button>
                      <button type="button" onClick={() => setPaymentMethod("nagad")} className={`py-2 px-1.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${paymentMethod === "nagad" ? "bg-orange-50 border-orange-500 text-orange-600 font-extrabold" : "bg-slate-50 border-slate-200 hover:bg-slate-100"}`}>
                        <Smartphone className="w-4 h-4 text-orange-500" />
                        <span>নগদ (Nagad)</span>
                      </button>
                      <button type="button" onClick={() => setPaymentMethod("rocket")} className={`py-2 px-1.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${paymentMethod === "rocket" ? "bg-purple-50 border-purple-500 text-purple-600 font-extrabold" : "bg-slate-50 border-slate-200 hover:bg-slate-100"}`}>
                        <Smartphone className="w-4 h-4 text-purple-500" />
                        <span>রকেট (Rocket)</span>
                      </button>
                    </div>

                    <form onSubmit={handleWalletDepositSubmit} className="space-y-3.5 text-xs">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">১. নিচের নাম্বারে টাকা পাঠান (Send Money - Personal)</span>
                        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-1.5">
                          <span className="font-mono text-xs font-bold text-slate-800">01858-039475</span>
                          <button type="button" onClick={() => copyToClipboard("01858039475")} className="text-slate-400 hover:text-slate-800">
                            {copiedText ? "কপি হয়েছে!" : "কপি"}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-slate-500 font-bold mb-1">ডিপোজিট পরিমাণ (৳ BDT)</label>
                          <input type="number" placeholder="যেমন: ৫০০" required value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-600" />
                        </div>
                        <div>
                          <label className="block text-slate-500 font-bold mb-1">সেন্ডার নাম্বার</label>
                          <input type="text" placeholder="017XXXXXXXX" required value={depositSender} onChange={(e) => setDepositSender(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-600" />
                        </div>
                        <div>
                          <label className="block text-slate-500 font-bold mb-1">Transaction ID (TxID)</label>
                          <input type="text" placeholder="TxnID দিন..." required value={depositTxID} onChange={(e) => setDepositTxID(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-600 font-mono" />
                        </div>
                      </div>

                      {depositErrorMsg && (
                        <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{depositErrorMsg}</span>
                        </div>
                      )}

                      {depositSuccessMsg && (
                        <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>{depositSuccessMsg}</span>
                        </div>
                      )}

                      <button type="submit" disabled={depositSubmitting} className="w-full py-2.5 bg-[#007f4e] hover:bg-[#00663e] disabled:opacity-50 text-white font-bold rounded-xl transition shadow-sm">
                        {depositSubmitting ? "অনুরোধ পাঠানো হচ্ছে..." : "ওয়ালেট রিচার্জ সাবমিট করুন"}
                      </button>
                    </form>
                  </div>

                  {/* Wallet History Table List */}
                  <div className="space-y-2 pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-800 uppercase">ডিপোজিট আবেদন হিস্ট্রি (Deposit Requests)</h4>
                    {depositRequests.length === 0 ? (
                      <p className="text-xxs text-slate-400">কোনো ডিপোজিট রেকর্ড নেই।</p>
                    ) : (
                      <div className="space-y-2">
                        {depositRequests.map(d => (
                          <div key={d.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center text-xs">
                            <div>
                              <span className="font-bold text-slate-800">৳{d.amount} BDT</span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">TxID: <strong className="font-mono text-slate-600">{d.transactionId}</strong></span>
                            </div>
                            <span className="text-xxs px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200 font-bold">পেন্ডিং রিভিউ</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          )}

          {/* 14. TRANSACTIONS PAGE (Private) */}
          {currentPage === "transactions" && (
            <div className="max-w-3xl mx-auto px-4 mt-6">
              {!user ? (
                <div className="p-6 text-center bg-white border border-slate-200 rounded-3xl">লগইন করুন।</div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                    <Clock className="w-5 h-5 text-red-600" />
                    আপনার সম্পূর্ণ লেনদেন হিস্ট্রি (Transactions History)
                  </h3>

                  <div className="space-y-4">
                    {orders.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center">কোনো লেনদেন সম্পন্ন হয়নি।</p>
                    ) : (
                      <div className="space-y-3">
                        {orders.map(ord => (
                          <div key={ord.id} className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex justify-between items-center text-xs">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-slate-800">{ord.gameName}</span>
                                <span className="text-[10px] bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded">{ord.packageName}</span>
                              </div>
                              <div className="text-slate-500 text-xxs font-mono">
                                Player UID: <strong className="text-slate-700">{ord.gameId}</strong> | TxID: <strong className="text-slate-700">{ord.transactionId}</strong>
                              </div>
                            </div>
                            <div className="text-right space-y-1 shrink-0">
                              <span className="font-black text-[#007f4e] block text-sm">৳{ord.price} BDT</span>
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black border ${getStatusStyle(ord.status)}`}>
                                {getStatusBengali(ord.status)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 15. SETTINGS PAGE (Private) */}
          {currentPage === "settings" && (
            <div className="max-w-3xl mx-auto px-4 mt-6">
              {!user ? (
                <div className="p-6 text-center bg-white border border-slate-200 rounded-3xl">লগইন করুন।</div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                    <SettingsIcon className="w-5 h-5 text-red-600" />
                    অ্যাকাউন্ট সেটিংস (Settings)
                  </h3>

                  <div className="space-y-4 text-xs sm:text-sm text-slate-600">
                    <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex items-center justify-between">
                      <div>
                        <strong className="block text-slate-800">সাউন্ড নোটিফিকেশন</strong>
                        <span className="text-xxs text-slate-400">অর্ডার সফল বা কমপ্লিট হলে টিং টিং শব্দ হবে</span>
                      </div>
                      <input type="checkbox" checked={soundEnabled} onChange={() => setSoundEnabled(!soundEnabled)} className="w-4 h-4 text-red-600 accent-red-600" />
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex items-center justify-between">
                      <div>
                        <strong className="block text-slate-800">রিয়েল-টাইম অটো আপডেট</strong>
                        <span className="text-xxs text-slate-400">অর্ডার স্ট্যাটাস ডাটাবেস পরিবর্তন সাথে সাথেই স্ক্রিনে রিফ্রেশ হবে</span>
                      </div>
                      <input type="checkbox" checked={autoUpdate} onChange={() => setAutoUpdate(!autoUpdate)} className="w-4 h-4 text-red-600 accent-red-600" />
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex items-center justify-between">
                      <div>
                        <strong className="block text-slate-800">ভাষা / Language (বাংলা)</strong>
                        <span className="text-xxs text-slate-400">অ্যাপের সকল ইন্টারফেস বাংলায় লোড করুন</span>
                      </div>
                      <input type="checkbox" checked={langBengali} onChange={() => setLangBengali(!langBengali)} className="w-4 h-4 text-red-600 accent-red-600" />
                    </div>

                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-between">
                      <div>
                        <strong className="block text-red-800">অ্যাকাউন্ট নিষ্ক্রিয় করুন</strong>
                        <span className="text-xxs text-red-500">আপনার ব্যক্তিগত ডেটা ডাটাবেস থেকে স্থায়ীভাবে মুছে ফেলুন</span>
                      </div>
                      <button onClick={() => alert("অ্যাকাউন্ট নিষ্ক্রিয় আবেদন সফল! ২৪ ঘণ্টার মধ্যে আপনার তথ্য মুছে ফেলা হবে।")} className="px-3.5 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold">নিষ্ক্রিয় করুন</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 16. NOTIFICATIONS PAGE (Private) */}
          {currentPage === "notifications" && (
            <div className="max-w-3xl mx-auto px-4 mt-6">
              {!user ? (
                <div className="p-6 text-center bg-white border border-slate-200 rounded-3xl">লগইন করুন।</div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-1.5">
                      <Bell className="w-5 h-5 text-red-600" />
                      আপনার ইনবক্স বিজ্ঞপ্তি (Notifications)
                    </h3>
                    <button 
                      onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
                      className="text-xxs text-red-600 hover:underline font-bold"
                    >
                      সব রিড করুন
                    </button>
                  </div>

                  <div className="space-y-3.5">
                    {notifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => toggleNotificationRead(n.id)}
                        className={`p-4 border rounded-2xl text-xs transition cursor-pointer relative ${
                          n.read 
                          ? "bg-slate-50/60 border-slate-100 text-slate-500" 
                          : "bg-red-50/20 border-red-100 text-slate-800 font-medium shadow-sm"
                        }`}
                      >
                        {!n.read && (
                          <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-red-600 rounded-full"></span>
                        )}
                        <h4 className="font-extrabold text-sm text-slate-800">{n.title}</h4>
                        <p className="mt-1 leading-relaxed text-slate-600">{n.message}</p>
                        <span className="text-[10px] text-slate-400 block mt-2 font-mono">{n.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* ======================================= PRODUCT/CATEGORY DRILL-DOWN DRAWER ======================================= */}
      <AnimatePresence>
        {selectedCategory && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200"
            >
              {/* Modal Title Header */}
              <div className="bg-[#007f4e] text-white p-5 flex items-center justify-between relative">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedCategory.emoji}</span>
                  <div>
                    <h3 className="font-black text-base sm:text-lg leading-tight">{selectedCategory.name}</h3>
                    <p className="text-xs text-emerald-100 font-bold">{selectedCategory.bengaliName}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedCategory(null)}
                  className="bg-black/20 hover:bg-black/40 text-white rounded-full p-1.5 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                
                {/* STEP 1: Packages Selection */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-emerald-100 text-[#007f4e] font-black text-xs flex items-center justify-center">১</span>
                    <h4 className="font-extrabold text-sm text-slate-800">টপ-আপ প্যাকেজ নির্বাচন করুন</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2.5">
                    {selectedCategory.packages.map((pack) => {
                      const isSelected = selectedPack?.id === pack.id;
                      return (
                        <button
                          key={pack.id}
                          type="button"
                          onClick={() => setSelectedPack(pack)}
                          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                            isSelected 
                            ? "bg-emerald-50 border-[#007f4e] ring-2 ring-[#007f4e]/20" 
                            : "bg-slate-50 border-slate-250 hover:bg-slate-100"
                          }`}
                        >
                          <span className="font-extrabold text-slate-800 text-xs line-clamp-1">{pack.name}</span>
                          <span className="font-black text-[#007f4e] text-sm mt-1.5">৳ {pack.price} BDT</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* STEP 2: Player ID Input */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-emerald-100 text-[#007f4e] font-black text-xs flex items-center justify-center">২</span>
                    <h4 className="font-extrabold text-sm text-slate-800">{selectedCategory.idLabel} দিন</h4>
                  </div>
                  <input
                    type="text"
                    placeholder={selectedCategory.placeholderId}
                    value={gamePlayerId}
                    onChange={(e) => setGamePlayerId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#007f4e] focus:bg-white"
                  />
                </div>

                {/* STEP 3: Payment Process with Real Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-emerald-100 text-[#007f4e] font-black text-xs flex items-center justify-center">৩</span>
                    <h4 className="font-extrabold text-sm text-slate-800">পেমেন্ট করুন এবং সাবমিট করুন</h4>
                  </div>

                  {/* Payment selection tabs */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("bkash")}
                      className={`py-2 px-1.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                        paymentMethod === "bkash" 
                        ? "bg-pink-50 border-pink-500 text-pink-600 font-extrabold" 
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <Smartphone className="w-4 h-4 text-pink-500" />
                      <span className="text-[10px] font-bold">বিকাশ (bKash)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("nagad")}
                      className={`py-2 px-1.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                        paymentMethod === "nagad" 
                        ? "bg-orange-50 border-orange-500 text-orange-600 font-extrabold" 
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <Smartphone className="w-4 h-4 text-orange-500" />
                      <span className="text-[10px] font-bold">নগদ (Nagad)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("rocket")}
                      className={`py-2 px-1.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                        paymentMethod === "rocket" 
                        ? "bg-purple-50 border-purple-500 text-purple-600 font-extrabold" 
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <Smartphone className="w-4 h-4 text-purple-500" />
                      <span className="text-[10px] font-bold">রকেট (Rocket)</span>
                    </button>
                  </div>

                  {/* Sender & TxID Box */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-bold">নাম্বার কপি করুন (Personal):</span>
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 text-[10px] font-extrabold">Send Money</span>
                    </div>

                    <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3 py-2">
                      <div className="font-mono text-sm font-bold text-slate-800">
                        {paymentMethod === "bkash" ? "01858-039475" : paymentMethod === "nagad" ? "01958-039475" : "01758-039475-1"}
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(paymentMethod === "bkash" ? "01858039475" : paymentMethod === "nagad" ? "01958039475" : "017580394751")}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 hover:text-slate-900 transition-colors"
                      >
                        {copiedText ? <Check className="w-4 h-4 text-[#007f4e]" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-500 leading-relaxed font-medium">
                      নির্দেশনা: ওপরের {paymentMethod === "bkash" ? "বিকাশ" : paymentMethod === "nagad" ? "নগদ" : "রকেট"} নাম্বারে সর্বমোট <strong className="text-[#007f4e]">৳{selectedPack?.price || 0} BDT</strong> সেন্ড মানি করুন। তারপর নিচের ফর্মে যে নাম্বার থেকে টাকা পাঠিয়েছেন এবং যে Transaction ID পেয়েছেন তা সঠিকভাবে পূরণ করে সাবমিট করুন।
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 mb-1">সেন্ডার নাম্বার</label>
                        <input
                          type="text"
                          placeholder="017XXXXXXXX"
                          value={senderNumber}
                          onChange={(e) => setSenderNumber(e.target.value)}
                          className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 mb-1">Transaction ID (TxID)</label>
                        <input
                          type="text"
                          placeholder="K8S2Y..."
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                </div>

                {/* Status Alerts inside Modal */}
                {orderError && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{orderError}</span>
                  </div>
                )}

                {orderSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{orderSuccess}</span>
                  </div>
                )}

                {/* Checkout button */}
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={orderSubmitting}
                  className="w-full py-3 bg-[#007f4e] hover:bg-[#00663e] disabled:opacity-50 text-white rounded-xl font-bold text-sm tracking-wide transition shadow-md flex items-center justify-center gap-2"
                >
                  {orderSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      অর্ডার সাবমিট হচ্ছে...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4.5 h-4.5" />
                      অর্ডার কনফার্ম করুন (৳{selectedPack?.price || 0})
                    </>
                  )}
                </button>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================= DEVELOPER/ADMIN TEST DASHBOARD ======================================= */}
      <AnimatePresence>
        {isAdminMode && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="max-w-4xl mx-auto mt-6 px-4" 
            id="admin-dashboard-block"
          >
            <div className="bg-purple-50 border border-purple-200 rounded-3xl p-6 shadow-md space-y-4 relative">
              <div className="absolute top-4 right-4 bg-purple-100 text-purple-700 border border-purple-200 rounded-full px-3 py-1 text-[10px] font-bold">
                অ্যাডমিন টেস্ট মোড
              </div>

              <div>
                <h3 className="text-lg font-black text-purple-950 flex items-center gap-2">
                  <Laptop className="w-5 h-5 text-purple-600" />
                  গেমিং অর্ডার অ্যাডমিন প্যানেল (টেস্ট)
                </h3>
                <p className="text-xs text-purple-700 mt-1">
                  এখানে সকল ইউজারের লাইভ সাবমিট করা অর্ডারসমূহ দেখা যাবে। আপনি স্ট্যাটাস চেঞ্জ করলে গ্রাহকের স্ক্রিনেও ইনস্ট্যান্ট আপডেট হবে!
                </p>
              </div>

              {allOrders.length === 0 ? (
                <div className="py-8 text-center text-purple-400 text-xs">
                  এখনো কোনো লাইভ অর্ডার আসেনি। অর্ডার করার সাথে সাথে এখানে রিয়েল-টাইমে তা চলে আসবে।
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  {allOrders.map((ord) => (
                    <div key={ord.id} className="bg-white border border-purple-100 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-850">{ord.gameName}</span>
                          <span className="text-[10px] text-slate-400">({ord.userEmail})</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-500 font-medium">
                          <div>প্যাকেজ: <strong className="text-purple-700">{ord.packageName}</strong></div>
                          <div>플레이어 ID: <strong className="text-slate-800 font-mono">{ord.gameId}</strong></div>
                          <div>সেন্ডার মোবাইল: <strong className="text-slate-800 font-mono">{ord.senderNumber}</strong></div>
                          <div>TxID: <strong className="text-slate-800 font-mono">{ord.transactionId}</strong></div>
                          <div>৳ মূল্য: <strong className="text-emerald-700">৳{ord.price} BDT</strong></div>
                          <div>মাধ্যম: <strong className="uppercase">{ord.paymentMethod}</strong></div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0 w-full md:w-auto border-t md:border-t-0 pt-2 md:pt-0">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-semibold">অবস্থা:</span>
                          <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] border ${getStatusStyle(ord.status)}`}>
                            {getStatusBengali(ord.status)}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-1.5 justify-end">
                          <button onClick={() => handleUpdateOrderStatus(ord.id, "Processing")} className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-[10px] font-bold">প্রসেসিং করুন</button>
                          <button onClick={() => handleUpdateOrderStatus(ord.id, "Completed")} className="bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-1 rounded text-[10px] font-bold">কমপ্লিট করুন</button>
                          <button onClick={() => handleUpdateOrderStatus(ord.id, "Cancelled")} className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-[10px] font-bold">ক্যান্সেল করুন</button>
                          <button onClick={() => handleDeleteOrder(ord.id)} className="bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-700 p-1 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ======================================= BOTTOM BAR NAVIGATION (RG BAZZER FOOTER MOBILE style) ======================================= */}
      <footer className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-150 z-40 py-2 shadow-lg" id="mobile-footer">
        <div className="max-w-xl mx-auto grid grid-cols-5 gap-1 text-center text-slate-500">
          
          <button 
            onClick={() => { setCurrentPage("home"); setSelectedCategory(null); }} 
            className={`flex flex-col items-center justify-center ${currentPage === "home" ? "text-red-600" : "hover:text-slate-800"}`}
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold">Home</span>
          </button>

          <button 
            onClick={() => setCurrentPage("pricing")} 
            className={`flex flex-col items-center justify-center ${currentPage === "pricing" ? "text-red-600" : "hover:text-slate-800"}`}
          >
            <Compass className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold">Pricing</span>
          </button>

          <button 
            onClick={() => {
              if (user) {
                setCurrentPage("dashboard");
              } else {
                setCurrentPage("login");
              }
            }} 
            className={`flex flex-col items-center justify-center ${currentPage === "dashboard" ? "text-red-600" : "hover:text-slate-800"}`}
          >
            <UserIcon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold">Account</span>
          </button>

          <button 
            onClick={() => setCurrentPage("contact")} 
            className={`flex flex-col items-center justify-center ${currentPage === "contact" ? "text-red-600" : "hover:text-slate-800"}`}
          >
            <PhoneCall className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold">Contact</span>
          </button>

          <button 
            onClick={() => setCurrentPage("faq")} 
            className={`flex flex-col items-center justify-center ${currentPage === "faq" ? "text-red-600" : "hover:text-slate-800"}`}
          >
            <HelpCircle className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold">FAQ</span>
          </button>

        </div>
      </footer>

      {/* Footer copyright and safety badge (Desktop style bottom) */}
      <div className="bg-slate-900 text-slate-400 py-12 px-4 mt-16 text-center text-xs space-y-4" id="desktop-footer">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-left border-b border-slate-800 pb-8">
          <div className="space-y-2">
            <h4 className="font-extrabold text-white text-sm">RG BAZZER</h4>
            <p className="text-slate-400 text-xxs leading-relaxed">বাংলাদেশের সেরা বিশ্বস্ত গেমিং টপআপ পোর্টাল। আপনার গেমিং প্রগ্রেসকে আরও আনন্দদায়ক করতে আমরা সবসময় আছি আপনার পাশে।</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-extrabold text-white text-sm">প্রয়োজনীয় লিংক</h4>
            <div className="grid grid-cols-2 gap-1.5 text-xxs">
              <button onClick={() => setCurrentPage("terms")} className="hover:text-white text-left">শর্তাবলী</button>
              <button onClick={() => setCurrentPage("privacy")} className="hover:text-white text-left">গোপনীয়তা নীতি</button>
              <button onClick={() => setCurrentPage("about")} className="hover:text-white text-left">আমাদের সম্পর্কে</button>
              <button onClick={() => setCurrentPage("contact")} className="hover:text-white text-left">যোগাযোগ</button>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-extrabold text-white text-sm">নিরাপত্তা ও নিশ্চয়তা</h4>
            <div className="flex gap-2 text-3xl">
              🛡️ 🔒 💳 💎
            </div>
          </div>
        </div>
        <p className="text-xxs text-slate-500 pt-2">© ২০২৬ RG BAZZER. All Rights Reserved. Designed for premium gaming topup experience.</p>
      </div>

    </div>
  );
}
