/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, ChangeEvent, FormEvent, useRef, useMemo, useCallback, RefObject } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, 
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
  ShoppingCart, 
  Gamepad2, 
  UserCircle, 
  Coins, 
  TrendingUp, 
  ArrowRight,
  Zap,
  Trash2,
  Upload,
  CheckCircle2,
  X,
  Menu,
  Copy,
  Check,
  LogOut,
  History,
  User as UserIcon,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  Instagram,
  Plus,
  Minus,
  Package,
  Mail,
  Lock,
  LogIn,
  UserPlus,
  CreditCard,
  Star,
  Tv,
  MessageSquarePlus,
  Share2,
  Heart,
  ShieldCheck,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { 
  auth, 
  db, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut, 
  onAuthStateChanged,
  collection,
  addDoc,
  setDoc,
  getDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  Timestamp,
  User,
  updateDoc,
  deleteDoc,
  doc
} from './firebase';
import { AskForGame } from './components/AskForGame';

// Types
type Language = 'ar' | 'en';
type Currency = 'JOD' | 'USD' | 'EUR' | 'SAR' | 'AED' | 'IQD';

interface Product {
  id: number;
  name: Record<Language, string>;
  price: number;
  oldPrice?: number;
  image: string;
  category: string;
  rating?: number;
  description?: Record<Language, string>;
}

interface CartItem extends Product {
  quantity: number;
  instaUser?: string;
}

interface Translation {
  title: string;
  logoSub: string;
  badge: string;
  heroTitle1: string;
  heroTitle2: string;
  heroTitle3: string;
  subtitle: string;
  categories: {
    title: string;
    games: string;
    accounts: string;
    currencies: string;
  };
  usdtSection: {
    title: string;
    subtitle: string;
    selectAmount: string;
    customAmount: string;
    walletAddress: string;
    walletPlaceholder: string;
    pricePerUnit: string;
    addToCart: string;
  };
  bestSellers: string;
  shopNow: string;
  learnMore: string;
  cart: string;
  emptyCart: string;
  backToShop: string;
  checkout: string;
  total: string;
  paymentMethod: string;
  uploadScreenshot: string;
  confirmPayment: string;
  paymentSuccess: string;
  paymentSuccessDesc: string;
  cliqDesc: string;
  usdtDesc: string;
  totalLabel: string;
  requiredAmount: string;
  cliqAliasLabel: string;
  usdtAddressLabel: string;
  txidLabel: string;
  txidPlaceholder: string;
  usdtNetworkLabel: string;
  usdtNetworkNotice: string;
  copied: string;
  footer: string;
  login: string;
  logout: string;
  myOrders: string;
  loginRequired: string;
  aboutUs: {
    title: string;
    content: string;
  };
  privacyPolicy: {
    title: string;
    content: string;
  };
  returnPolicy: {
    title: string;
    content: string;
  };
  contact: {
    title: string;
    insta: string;
  };
  orderStatus: {
    pending: string;
    delivered: string;
    cancelled: string;
  };
  deliveryInfo: string;
  deliveryPlaceholder: string;
  saveDelivery: string;
  viewScreenshot: string;
  orderDate: string;
  orderTotal: string;
  adminPanel: string;
  updateStatus: string;
  customer: string;
  totalOrders: string;
  totalRevenue: string;
  pendingOrders: string;
  deliveredOrders: string;
  activeUsers: string;
  searchPlaceholder: string;
  noResults: string;
  couponLabel: string;
  applyCoupon: string;
  invalidCoupon: string;
}

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
    providerInfo: {
      providerId: string;
      email: string | null;
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
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const translations: Record<Language, Translation> = {
  ar: {
    title: "LOST",
    logoSub: "ألعاب، حسابات، عملات",
    badge: "أقوى العروض الرقمية في الأردن",
    heroTitle1: "عالمك الرقمي",
    heroTitle2: "في مكان",
    heroTitle3: "واحد",
    subtitle: "في متجر LOST، نوفر لك كل ما تحتاجه من اشتراكات، ألعاب، وحسابات رقمية بأفضل الأسعار وأعلى مستويات الأمان والسرعة.",
    categories: {
      title: "الأقسام",
      games: "ألعاب كاملة",
      accounts: "حسابات ألعاب",
      currencies: "اشتراكات المشاهدة"
    },
    usdtSection: {
      title: "شحن USDT",
      subtitle: "اشحن رصيدك من USDT بسرعة وأمان",
      selectAmount: "اختر الكمية",
      customAmount: "كمية مخصصة",
      walletAddress: "عنوان محفظة USDT الخاص بك",
      walletPlaceholder: "0x...",
      pricePerUnit: "سعر الـ 1 USDT هو 0.72 دينار",
      addToCart: "إضافة للسلة"
    },
    bestSellers: "الأكثر مبيعاً",
    shopNow: "ابدأ التسوق",
    learnMore: "تعرف علينا",
    cart: "سلة التسوق",
    emptyCart: "سلة التسوق فارغة حالياً",
    backToShop: "العودة للتسوق",
    checkout: "إتمام الشراء",
    total: "المجموع الكلي",
    paymentMethod: "اختر طريقة الدفع",
    uploadScreenshot: "ارفق صورة الحوالة",
    confirmPayment: "تأكيد الدفع",
    paymentSuccess: "تم إرسال طلبك بنجاح!",
    paymentSuccessDesc: "سيتم مراجعة الدفع وتفعيل طلبك خلال أقرب وقت ممكن.",
    cliqDesc: "loststore",
    usdtDesc: "0x37796899d8c94c53fdf944eb16544a6582215115",
    totalLabel: "الإجمالي",
    requiredAmount: "المبلغ المطلوب",
    cliqAliasLabel: "CLIQ ALIAS",
    usdtAddressLabel: "USDT ADDRESS",
    txidLabel: "معرف المعاملة (TXID)",
    txidPlaceholder: "أدخل الـ TXID هنا...",
    usdtNetworkLabel: "اختر الشبكة",
    usdtNetworkNotice: "تنويه: سيتم خصم رسوم الشبكة التي تختارها من عملاتك.",
    copied: "تم النسخ!",
    footer: "جميع الحقوق محفوظة © لوست 2024",
    login: "تسجيل الدخول",
    logout: "تسجيل الخروج",
    myOrders: "طلباتي",
    loginRequired: "يرجى تسجيل الدخول للمتابعة",
    aboutUs: {
      title: "من نحن",
      content: "مرحبا بكم في متجر لوست (LOST Store)، الوجهة الرائدة والموثوقة في المملكة الأردنية الهاشمية لكل ما يتعلق بعالم الألعاب والمنتجات الرقمية. نحن نفخر بتقديم تجربة تسوق استثنائية تجمع بين السرعة، الأمان، والتنافسية العالية.\n\nمنذ انطلاقنا، وضعنا نصب أعيننا هدفاً واحداً: وهو تزويد اللاعبين وهواة عالم الرقميات بأفضل الحلول التقنية والحسابات بأسعار تنافسية وبأعلى مستويات الجودة. نحن ندرك تماماً أهمية الوقت في عالم الألعاب، لذا حرصنا على توفير أنظمة تسليم سريعة تضمن وصول منتجك إليك في أسرع وقت ممكن.\n\nرؤيتنا:\nأن نكون المنصة الأولى والخيار المفضل للمجتمع الرقمي في الأردن والمنطقة، من خلال بناء علاقة ثقة مستدامة مع عملائنا وتقديم كل ما هو حصري وجديد في عالم الترفيه الرقمي."
    },
    privacyPolicy: {
      title: "سياسة الخصوصية",
      content: "خصوصيتك هي أولوية قصوى لنا في متجر لوست. نحن نلتزم بحماية كافة المعلومات الشخصية والبيانات المتعلقة بطلباتك باستخدام أحدث تقنيات التشفير لضمان سرية وسلامة بياناتك.\n\nالمعلومات التي نجمعها:\nتشمل المعلومات الأساسية اللازمة لإتمام عمليات الشراء والتواصل معك بخصوص طلبك، مثل البريد الإلكتروني وتفاصيل التسليم.\n\nسرية البيانات:\nنؤكد التزامنا التام بعدم مشاركة، بيع، أو تأجير بياناتك الشخصية لأي طرف ثالث تحت أي ظرف من الظروف. يتم استخدام بياناتك حصراً لتحسين جودة خدمتنا وضمان وصول طلباتك بأمان.\n\nأمان الدفع:\nنحن نستخدم بوابات دفع آمنة ومعتمدة، مما يضمن أن تفاصيل عملياتك المالية محمية بالكامل ولا يمكن الوصول إليها من قبل غير المخولين."
    },
    returnPolicy: {
      title: "سياسة الاسترجاع",
      content: "نظراً لطبيعة المنتجات الرقمية والحسابات التي يوفرها متجر لوست، فإننا نعتمد سياسة واضحة وعادلة تضمن حق العميل وحق المتجر في آن واحد:\n\n1. لا يمكن استرجاع المبالغ النقدية للمنتجات الرقمية بمجرد إرسال الكود أو تسليم الحساب للعميل، وذلك نظراً لحساسية هذه المنتجات.\n\n2. يحق للعميل طلب استبدال المنتج أو الحساب في حال تبين وجود خلل فنّي أو عدم توافق مع المواصفات المذكورة، وذلك خلال مدة لا تتجاوز **أسبوع واحد فقط** من تاريخ الشراء.\n\n3. في حال كان الخلل ناتجاً عن سوء الاستخدام من قبل العميل أو محاولة التلاعب ببيانات الحساب بطريقة غير شرعية، يتم إلغاء الضمان ولا يحق للعميل المطالبة بالتعويض.\n\n4. نحن نلتزم بإصلاح أو استبدال أي منتج يثبت وجود خلل مصنعي فيه بعد التحقق من ذلك من قبل فريقنا الفني المتخصص."
    },
    contact: {
      title: "التواصل",
      insta: "loststore.jo"
    },
    orderStatus: {
      pending: "طلبك قيد التحضير",
      delivered: "تم التسليم",
      cancelled: "ملغي"
    },
    deliveryInfo: "معلومات التسليم",
    deliveryPlaceholder: "اكتب تفاصيل الحساب أو المنتج هنا...",
    saveDelivery: "حفظ وتسليم",
    viewScreenshot: "عرض لقطة الشاشة",
    orderDate: "التاريخ",
    orderTotal: "الإجمالي",
    adminPanel: "لوحة الإدارة",
    updateStatus: "تحديث الحالة",
    customer: "العميل",
    totalOrders: "إجمالي الطلبات",
    totalRevenue: "إجمالي الأرباح",
    pendingOrders: "طلبات قيد الانتظار",
    deliveredOrders: "طلبات تم تسليمها",
    activeUsers: "المستخدمين النشطين",
    searchPlaceholder: "ابحث عن اللعبة...",
    noResults: "لم يتم العثور على نتائج",
    couponLabel: "كود الخصم (كوبون)",
    applyCoupon: "تطبيق",
    invalidCoupon: "كوبون غير صالح"
  },
  en: {
    title: "LOST",
    logoSub: "Games, Accounts, Currencies",
    badge: "The strongest digital offers in Jordan",
    heroTitle1: "Your Digital World",
    heroTitle2: "In One",
    heroTitle3: "Place",
    subtitle: "At LOST store, we provide everything you need from subscriptions, games, and digital accounts at the best prices and highest levels of security and speed.",
    categories: {
      title: "Categories",
      games: "Full Games",
      accounts: "Game Accounts",
      currencies: "Streaming Subscriptions"
    },
    usdtSection: {
      title: "USDT Top-up",
      subtitle: "Top up your USDT balance quickly and securely",
      selectAmount: "Select Amount",
      customAmount: "Custom Amount",
      walletAddress: "Your USDT Wallet Address",
      walletPlaceholder: "0x...",
      pricePerUnit: "Price per 1 USDT is 0.72 JOD",
      addToCart: "Add to Cart"
    },
    bestSellers: "Best Sellers",
    shopNow: "Start Shopping",
    learnMore: "Learn More",
    cart: "Shopping Cart",
    emptyCart: "Your cart is currently empty",
    backToShop: "Back to Shop",
    checkout: "Checkout",
    total: "Total Amount",
    paymentMethod: "Select Payment Method",
    uploadScreenshot: "Upload Transfer Screenshot",
    confirmPayment: "Confirm Payment",
    paymentSuccess: "Order Submitted Successfully!",
    paymentSuccessDesc: "Your payment will be reviewed and your order activated as soon as possible.",
    cliqDesc: "loststore",
    usdtDesc: "0x37796899d8c94c53fdf944eb16544a6582215115",
    totalLabel: "Total",
    requiredAmount: "Required Amount",
    cliqAliasLabel: "CLIQ ALIAS",
    usdtAddressLabel: "USDT ADDRESS",
    txidLabel: "Transaction ID (TXID)",
    txidPlaceholder: "Enter TXID here...",
    usdtNetworkLabel: "Select Network",
    usdtNetworkNotice: "Notice: Network fees for the selected network will be deducted from your coins.",
    copied: "Copied!",
    footer: "All rights reserved © Lost 2024",
    login: "Login",
    logout: "Logout",
    myOrders: "My Orders",
    loginRequired: "Please login to continue",
    aboutUs: {
      title: "About Us",
      content: "Welcome to LOST Store, the premier destination in the Hashemite Kingdom of Jordan for everything related to gaming and digital products. We pride ourselves on delivering an exceptional shopping experience that combines speed, security, and high competitiveness.\n\nSince our launch, we have set one goal: to provide gamers and tech enthusiasts with the best technical solutions and accounts at competitive prices and the highest standards of quality. We fully understand the importance of time in the gaming world, so we've implemented rapid delivery systems to ensure your product reaches you as quickly as possible.\n\nOur Vision:\nTo be the primary platform and preferred choice for the digital community in Jordan and the region, by building a sustainable relationship of trust with our customers and providing everything exclusive and new in the world of digital entertainment."
    },
    privacyPolicy: {
      title: "Privacy Policy",
      content: "Your privacy is a top priority at LOST Store. We are committed to protecting all personal information and data related to your orders using the latest encryption technologies to ensure the confidentiality and integrity of your data.\n\nInformation We Collect:\nThis includes the basic information necessary to complete purchase operations and communicate with you regarding your order, such as email and delivery details.\n\nData Confidentiality:\nWe confirm our absolute commitment not to share, sell, or rent your personal data to any third party under any circumstances. Your data is used exclusively to improve the quality of our service and ensure your orders arrive safely.\n\nPayment Security:\nWe use secure and certified payment gateways, ensuring that your financial transaction details are fully protected and inaccessible to unauthorized individuals."
    },
    returnPolicy: {
      title: "Return Policy",
      content: "Due to the nature of the digital products and accounts provided by LOST Store, we adopt a clear and fair policy that guarantees the rights of both the customer and the store:\n\n1. Cash refunds cannot be issued for digital products once the code has been sent or the account has been delivered to the customer, due to the sensitive nature of these products.\n\n2. The customer is entitled to request a product or account replacement if a technical defect or non-compliance with the stated specifications is found, within a period not exceeding **one week** from the date of purchase.\n\n3. If the defect is caused by the customer's misuse or an attempt to manipulate account data illegally, the warranty is voided and the customer is not entitled to claim compensation.\n\n4. We are committed to repairing or replacing any product proven to have a manufacturing defect after verification by our specialized technical team."
    },
    contact: {
      title: "Contact",
      insta: "loststore.jo"
    },
    orderStatus: {
      pending: "Order in preparation",
      delivered: "Delivered",
      cancelled: "Cancelled"
    },
    deliveryInfo: "Delivery Info",
    deliveryPlaceholder: "Write account details or product keys here...",
    saveDelivery: "Save & Deliver",
    viewScreenshot: "View Screenshot",
    orderDate: "Date",
    orderTotal: "Total",
    adminPanel: "Admin Panel",
    updateStatus: "Update Status",
    customer: "Customer",
    totalOrders: "Total Orders",
    totalRevenue: "Total Revenue",
    pendingOrders: "Pending Orders",
    deliveredOrders: "Delivered Orders",
    activeUsers: "Active Users",
    searchPlaceholder: "Search for games...",
    noResults: "No results found",
    couponLabel: "Discount Code (Coupon)",
    applyCoupon: "Apply",
    invalidCoupon: "Invalid Coupon"
  }
};

const formatNumberTwoDecimals = (val: number): string => {
  let str = val.toFixed(2);
  if (str.endsWith('.98')) {
    str = str.replace(/\.98$/, '.99');
  }
  return str;
};

const products: Product[] = [
  {
    id: 101,
    name: { ar: "حساب FC 27 - نسخة الستاندرد", en: "FC 27 Account - Standard Edition" },
    price: 31.99,
    oldPrice: 50.00,
    image: "https://cdn1.epicgames.com/spt-assets/b8f94281d22b4f40a91d0f19a37d8a8e/fc-27-1nv56.jpg",
    category: "accounts"
  },
  {
    id: 102,
    name: { ar: "حساب FC 27 - نسخة الألتمت", en: "FC 27 Account - Ultimate Edition" },
    price: 48.99,
    oldPrice: 71.00,
    image: "https://preview.redd.it/fc-27-ultimate-edition-cover-v0-b57io6c2sleh1.jpeg?auto=webp&s=156ce73697456ebefee7e56ab283e446b8d3d34e",
    category: "accounts"
  },
  {
    id: 103,
    name: { ar: "حساب FC 27 - نسخة الألتمت بلس", en: "FC 27 Account - Ultimate Plus Edition" },
    price: 72.99,
    oldPrice: 107.00,
    image: "https://image.api.playstation.com/vulcan/ap/rnd/202607/2322/565591318acdd8934f72530c790189942e62f6fb2e1da92d.png",
    category: "accounts"
  },
  {
    id: 3,
    name: { ar: "حساب Arc Raiders", en: "Arc Raiders Account" },
    price: 21.99,
    oldPrice: 29.00,
    image: "https://cdn.akamai.steamstatic.com/steam/apps/1808500/library_600x900_2x.jpg",
    category: "accounts"
  },
  {
    id: 4,
    name: { ar: "حساب Forza Horizon 5", en: "Forza Horizon 5 Account" },
    price: 15.99,
    oldPrice: 24.00,
    image: "https://cdn.akamai.steamstatic.com/steam/apps/1551360/library_600x900_2x.jpg",
    category: "accounts"
  },
  {
    id: 12,
    name: { ar: "حساب Rust", en: "Rust Account" },
    price: 9.99,
    oldPrice: 14.00,
    image: "https://cdn.akamai.steamstatic.com/steam/apps/252490/library_600x900_2x.jpg",
    category: "accounts"
  },
  {
    id: 13,
    name: { ar: "حساب Garry's Mod", en: "Garry's Mod Account" },
    price: 4.99,
    image: "https://cdn.akamai.steamstatic.com/steam/apps/4000/library_600x900_2x.jpg",
    category: "accounts"
  },
  {
    id: 14,
    name: { ar: "حساب Euro Truck Simulator 2", en: "Euro Truck Simulator 2 Account" },
    price: 4.99,
    oldPrice: 8.00,
    image: "https://cdn.akamai.steamstatic.com/steam/apps/227300/library_600x900_2x.jpg",
    category: "accounts"
  },
  {
    id: 15,
    name: { ar: "حساب It Takes Two", en: "It Takes Two Account" },
    price: 13.99,
    oldPrice: 27.00,
    image: "https://cdn.akamai.steamstatic.com/steam/apps/1426210/library_600x900_2x.jpg",
    category: "accounts"
  },
  {
    id: 16,
    name: { ar: "حساب Call of Duty Black Ops 7", en: "Call of Duty Black Ops 7 Account" },
    price: 32.99,
    oldPrice: 50.00,
    image: "https://i.pinimg.com/736x/df/f3/42/dff342f9ef16504dc0e7020cf57fe9d8.jpg",
    category: "accounts"
  },
  {
    id: 17,
    name: { ar: "حساب Pummel Party", en: "Pummel Party Account" },
    price: 4.99,
    oldPrice: 6.00,
    image: "https://cdn.akamai.steamstatic.com/steam/apps/880940/library_600x900_2x.jpg",
    category: "accounts"
  },
  {
    id: 18,
    name: { ar: "حساب A Way Out", en: "A Way Out Account" },
    price: 11.99,
    oldPrice: 22.00,
    image: "https://i.pinimg.com/736x/65/a2/d5/65a2d52c28d7ff8617dfdc7aadf218ab.jpg",
    category: "accounts"
  },
  {
    id: 19,
    name: { ar: "حساب Split Fiction", en: "Split Fiction Account" },
    price: 19.99,
    oldPrice: 36.00,
    image: "https://i.pinimg.com/1200x/cc/7a/2b/cc7a2bbab6bbeb68dadac78c60e68cf5.jpg",
    category: "accounts"
  },
  {
    id: 20,
    name: { ar: "حساب Arma 3", en: "Arma 3 Account" },
    price: 9.99,
    oldPrice: 22.00,
    image: "https://cdn.akamai.steamstatic.com/steam/apps/107410/library_600x900_2x.jpg",
    category: "accounts"
  },
  {
    id: 21,
    name: { ar: "حساب Lies of P", en: "Lies of P Account" },
    price: 7.99,
    image: "https://i.pinimg.com/736x/ed/cc/76/edcc761fd5ccd3908a1bbc89712f97bc.jpg",
    category: "accounts"
  },
  {
    id: 22,
    name: { ar: "حساب The Witcher 3: Wild Hunt", en: "The Witcher 3: Wild Hunt Account" },
    price: 9.99,
    oldPrice: 22.00,
    image: "https://cdn.akamai.steamstatic.com/steam/apps/292030/library_600x900_2x.jpg",
    category: "accounts"
  },
  {
    id: 23,
    name: { ar: "حساب God of War", en: "God of War Account" },
    price: 17.99,
    oldPrice: 36.00,
    image: "https://cdn.akamai.steamstatic.com/steam/apps/1593500/library_600x900_2x.jpg",
    category: "accounts"
  },
  {
    id: 32,
    name: { ar: "حساب Cyberpunk 2077", en: "Cyberpunk 2077 Account" },
    price: 16.99,
    oldPrice: 32.00,
    image: "https://cdn.akamai.steamstatic.com/steam/apps/1091500/library_600x900_2x.jpg",
    category: "accounts"
  },
  {
    id: 35,
    name: { ar: "حساب DARK SOULS III", en: "DARK SOULS III Account" },
    price: 13.99,
    image: "https://cdn.akamai.steamstatic.com/steam/apps/335300/library_600x900_2x.jpg",
    category: "accounts"
  },
  {
    id: 38,
    name: { ar: "حساب Assassin’s Creed Odyssey", en: "Assassin’s Creed Odyssey Account" },
    price: 26.99,
    oldPrice: 34.00,
    image: "https://cdn.akamai.steamstatic.com/steam/apps/812140/library_600x900_2x.jpg",
    category: "accounts"
  },
  {
    id: 39,
    name: { ar: "حساب Assassin’s Creed Valhalla", en: "Assassin’s Creed Valhalla Account" },
    price: 11.99,
    oldPrice: 34.00,
    image: "https://cdn.akamai.steamstatic.com/steam/apps/2208920/library_600x900_2x.jpg",
    category: "accounts"
  },
  {
    id: 40,
    name: { ar: "حساب Assassin’s Creed Mirage", en: "Assassin’s Creed Mirage Account" },
    price: 8.99,
    oldPrice: 29.00,
    image: "https://i.pinimg.com/736x/bd/0c/15/bd0c153b8d7dc98725d5733b2223e451.jpg",
    category: "accounts"
  },
  {
    id: 41,
    name: { ar: "حساب Far Cry 6", en: "Far Cry 6 Account" },
    price: 11.99,
    oldPrice: 34.00,
    image: "https://cdn.akamai.steamstatic.com/steam/apps/2369390/library_600x900_2x.jpg",
    category: "accounts"
  },
  {
    id: 42,
    name: { ar: "حساب Watch Dogs 2", en: "Watch Dogs 2 Account" },
    price: 10.99,
    oldPrice: 29.00,
    image: "https://cdn.akamai.steamstatic.com/steam/apps/447040/library_600x900_2x.jpg",
    category: "accounts"
  },
  {
    id: 43,
    name: { ar: "حساب Watch Dogs: Legion", en: "Watch Dogs: Legion Account" },
    price: 11.99,
    oldPrice: 34.00,
    image: "https://i.pinimg.com/1200x/52/09/d7/5209d7c5a30aac744787e1a913b99cc1.jpg",
    category: "accounts"
  },
  {
    id: 44,
    name: { ar: "حساب Battlefield V Definitive Edition", en: "Battlefield V Definitive Edition Account" },
    price: 7.99,
    oldPrice: 36.00,
    image: "https://cdn.akamai.steamstatic.com/steam/apps/1238810/library_600x900_2x.jpg",
    category: "accounts"
  },
  {
    id: 106,
    name: { ar: "حساب Black Myth: Wukong", en: "Black Myth: Wukong Account" },
    price: 29.99,
    oldPrice: 43.00,
    image: "https://cdn.akamai.steamstatic.com/steam/apps/2358720/library_600x900_2x.jpg",
    category: "accounts"
  },
  {
    id: 107,
    name: { ar: "حساب Dead by Daylight", en: "Dead by Daylight Account" },
    price: 7.99,
    oldPrice: 11.00,
    image: "https://cdn.akamai.steamstatic.com/steam/apps/381210/library_600x900_2x.jpg",
    category: "accounts"
  },
  {
    id: 109,
    name: { ar: "حساب Ready or Not", en: "Ready or Not Account" },
    price: 12.99,
    oldPrice: 21.00,
    image: "https://cdn.akamai.steamstatic.com/steam/apps/1144200/library_600x900_2x.jpg",
    category: "accounts"
  },
  {
    id: 114,
    name: { ar: "حساب Sekiro: Shadows Die Twice", en: "Sekiro: Shadows Die Twice Account" },
    price: 23.99,
    oldPrice: 43.00,
    image: "https://cdn.akamai.steamstatic.com/steam/apps/814380/library_600x900_2x.jpg",
    category: "accounts"
  },
  {
    id: 6,
    name: { ar: "GTA V - نسخة البريميوم", en: "GTA V - Premium Edition" },
    price: 11.99,
    oldPrice: 22.00,
    image: "https://cdn.akamai.steamstatic.com/steam/apps/271590/library_600x900_2x.jpg",
    category: "games"
  },
  {
    id: 7,
    name: { ar: "Red Dead Redemption 2", en: "Red Dead Redemption 2" },
    price: 15.00,
    oldPrice: 41.99,
    image: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1q1f.png",
    category: "games"
  },
  {
    id: 8,
    name: { ar: "Arc Raiders", en: "Arc Raiders" },
    price: 26.99,
    oldPrice: 29.00,
    image: "https://cdn.akamai.steamstatic.com/steam/apps/1808500/library_600x900_2x.jpg",
    category: "games"
  },
  {
    id: 10,
    name: { ar: "Tekken 8", en: "Tekken 8" },
    price: 18.99,
    oldPrice: 20.00,
    image: "https://cdn.akamai.steamstatic.com/steam/apps/1778820/library_600x900_2x.jpg",
    category: "games"
  },
  {
    id: 24,
    name: { ar: "UNCHARTED: Legacy of Thieves Collection", en: "UNCHARTED: Legacy of Thieves Collection" },
    price: 17.99,
    oldPrice: 36.00,
    image: "https://cdn.akamai.steamstatic.com/steam/apps/1659420/library_600x900_2x.jpg",
    category: "games"
  },
  {
    id: 25,
    name: { ar: "God of War", en: "God of War" },
    price: 17.99,
    oldPrice: 36.00,
    image: "https://cdn.akamai.steamstatic.com/steam/apps/1593500/library_600x900_2x.jpg",
    category: "games"
  },
  {
    id: 26,
    name: { ar: "Marvel's Spider-Man Remastered", en: "Marvel's Spider-Man Remastered" },
    price: 21.99,
    oldPrice: 43.00,
    image: "https://cdn.akamai.steamstatic.com/steam/apps/1817070/library_600x900_2x.jpg",
    category: "games"
  },
  {
    id: 27,
    name: { ar: "Farming Simulator 22", en: "Farming Simulator 22" },
    price: 8.99,
    oldPrice: 10.00,
    image: "https://cdn.akamai.steamstatic.com/steam/apps/1248130/library_600x900_2x.jpg",
    category: "games"
  },
  {
    id: 28,
    name: { ar: "DOOM Eternal", en: "DOOM Eternal" },
    price: 8.99,
    oldPrice: 15.00,
    image: "https://cdn.akamai.steamstatic.com/steam/apps/782330/library_600x900_2x.jpg",
    category: "games"
  },
  {
    id: 29,
    name: { ar: "Fallout 4: Game of the Year Edition", en: "Fallout 4: Game of the Year Edition" },
    price: 13.99,
    oldPrice: 19.00,
    image: "https://cdn.akamai.steamstatic.com/steam/apps/377160/library_600x900_2x.jpg",
    category: "games"
  },
  {
    id: 30,
    name: { ar: "DARK SOULS III", en: "DARK SOULS III" },
    price: 23.99,
    oldPrice: 29.00,
    image: "https://cdn.akamai.steamstatic.com/steam/apps/335300/library_600x900_2x.jpg",
    category: "games"
  },
  {
    id: 31,
    name: { ar: "Detroit: Become Human", en: "Detroit: Become Human" },
    price: 10.99,
    oldPrice: 23.00,
    image: "https://i.pinimg.com/736x/0e/c8/a7/0ec8a71ee6a12a5470e7a29cfada1968.jpg",
    category: "games"
  },
  {
    id: 34,
    name: { ar: "Skyrim Special Edition", en: "Skyrim Special Edition" },
    price: 13.99,
    oldPrice: 17.00,
    image: "https://cdn.akamai.steamstatic.com/steam/apps/489830/library_600x900_2x.jpg",
    category: "games"
  },
  {
    id: 37,
    name: { ar: "Spider-Man: Miles Morales", en: "Spider-Man: Miles Morales" },
    price: 19.99,
    oldPrice: 36.00,
    image: "https://cdn.akamai.steamstatic.com/steam/apps/1817190/library_600x900_2x.jpg",
    category: "games"
  },
  {
    id: 105,
    name: { ar: "Ghost of Tsushima DIRECTOR'S CUT", en: "Ghost of Tsushima DIRECTOR'S CUT" },
    price: 29.99,
    oldPrice: 43.00,
    image: "https://cdn.akamai.steamstatic.com/steam/apps/2215430/library_600x900_2x.jpg",
    category: "games"
  },
  {
    id: 108,
    name: { ar: "Ready or Not", en: "Ready or Not" },
    price: 18.99,
    oldPrice: 21.00,
    image: "https://cdn.akamai.steamstatic.com/steam/apps/1144200/library_600x900_2x.jpg",
    category: "games"
  },
  {
    id: 110,
    name: { ar: "Resident Evil 4 Remake", en: "Resident Evil 4 Remake" },
    price: 24.99,
    oldPrice: 48.00,
    image: "https://cdn.akamai.steamstatic.com/steam/apps/2050650/library_600x900_2x.jpg",
    category: "games"
  },
  {
    id: 111,
    name: { ar: "Resident Evil Village", en: "Resident Evil Village" },
    price: 13.99,
    oldPrice: 22.00,
    image: "https://cdn.akamai.steamstatic.com/steam/apps/1196590/library_600x900_2x.jpg",
    category: "games"
  },
  {
    id: 112,
    name: { ar: "Lies of P", en: "Lies of P" },
    price: 22.99,
    oldPrice: 25.00,
    image: "https://cdn.akamai.steamstatic.com/steam/apps/1627720/library_600x900_2x.jpg",
    category: "games"
  },
  {
    id: 113,
    name: { ar: "حساب ARK: Survival Ascended", en: "ARK: Survival Ascended Account" },
    price: 16.99,
    oldPrice: 32.00,
    image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2399830/157abe35b22e96ea4ecea8eb723fb923ea198715/capsule_616x353.jpg?t=1779293241",
    category: "accounts"
  },
  {
    id: 115,
    name: { ar: "Tom Clancy's Ghost Recon Breakpoint", en: "Tom Clancy's Ghost Recon Breakpoint" },
    price: 17.99,
    oldPrice: 34.00,
    image: "https://cdn.akamai.steamstatic.com/steam/apps/2231380/library_600x900_2x.jpg",
    category: "games"
  }
];

const InfoPage = ({ title, content, backToShop, onBack, logoToggle }: { title: string, content: string, backToShop: string, onBack: () => void, logoToggle: boolean }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 1.02 }}
    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    className="pt-40 pb-32 px-6 max-w-5xl mx-auto min-h-screen flex flex-col items-center"
  >
    <div className="flex flex-col items-center text-center mb-20 relative">
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 bg-violet-600/10 blur-[100px] rounded-full"></div>
      
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-24 h-24 bg-gradient-to-br from-violet-600/20 to-indigo-600/20 rounded-[2rem] flex items-center justify-center text-violet-400 mb-10 border border-violet-500/20 backdrop-blur-xl shadow-2xl shadow-violet-900/20"
      >
        <Shield size={44} strokeWidth={1.5} />
      </motion.div>
      
      <motion.h2 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-6xl md:text-7xl font-black uppercase italic tracking-tighter text-white mb-8 relative"
      >
        <span className="relative z-10">{title}</span>
        <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-50 blur-[1px]"></div>
      </motion.h2>

      <motion.button 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        whileHover={{ opacity: 1, x: -5 }}
        onClick={onBack}
        className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.4em] text-violet-400 transition-all font-sans group"
      >
        <ArrowRight size={16} className="group-hover:-translate-x-1 transition-transform" />
        {backToShop}
      </motion.button>
    </div>

    <motion.div 
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.4, duration: 0.8 }}
      className="w-full relative group"
    >
      {/* Decorative gradients */}
      <div className="absolute -inset-1 bg-gradient-to-r from-violet-600/20 via-indigo-600/10 to-violet-600/20 rounded-[48px] blur-xl opacity-50 group-hover:opacity-75 transition duration-1000"></div>
      
      <div className="relative bg-slate-950/40 border border-white/10 p-10 md:p-20 rounded-[40px] backdrop-blur-3xl overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/5 rounded-full blur-[120px] -mr-48 -mt-48 transition-all duration-700"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-600/5 rounded-full blur-[100px] -ml-40 -mb-40 transition-all duration-700"></div>
        
        <div className="relative z-10 leading-[1.8] text-lg md:text-xl text-slate-300 font-medium whitespace-pre-wrap font-sans selection:bg-violet-500/30">
          {content.split('\n\n').map((paragraph, idx) => (
            <p key={idx} className={idx !== 0 ? "mt-8" : ""}>
              {paragraph.split('\n').map((line, lIdx) => (
                <span key={lIdx} className="block">
                  {line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') || line.startsWith('4.') ? (
                    <span className="flex gap-4">
                      <span className="text-violet-400 font-bold min-w-[24px]">{line.split('.')[0]}.</span>
                      <span>{line.split('.').slice(1).join('.').trim()}</span>
                    </span>
                  ) : (
                    line
                  )}
                </span>
              ))}
            </p>
          ))}
        </div>
        
        {/* Formal Signature/Seal footer */}
        <div className="mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 opacity-40">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 border border-white/20 rounded-full flex items-center justify-center text-[10px] font-bold overflow-hidden">
               <AnimatePresence mode="wait">
                  <motion.span
                    key={logoToggle ? 'ar' : 'en'}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.2 }}
                    className="inline-block"
                  >
                    {logoToggle ? (
                      <><span className="text-violet-500">لو</span>ست</>
                    ) : (
                      <><span className="text-violet-500">LO</span>ST</>
                    )}
                  </motion.span>
               </AnimatePresence>
            </div>
            <div className="text-[10px] uppercase tracking-widest leading-none">
              <div className="font-bold text-white mb-1 tracking-[0.2em]">Lost Gaming Store</div>
              <div>Official Documentation</div>
            </div>
          </div>
          <div className="text-[10px] uppercase tracking-[0.3em] font-mono whitespace-nowrap">
            Verification ID: LS-2024-DOC-PRO
          </div>
        </div>
      </div>
    </motion.div>
  </motion.div>
);

const SteamLogo = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.03 4.524 4.524s-2.03 4.524-4.524 4.524c-.102 0-.201-.009-.302-.015l-4.041 2.915c.005.084.011.168.011.254 0 1.966-1.597 3.563-3.563 3.563-1.63 0-3.003-1.1-3.432-2.607l-4.488-1.854C1.385 19.537 6.223 24 11.979 24c6.627 0 12-5.373 12-12s-5.373-12-12-12zM8.544 14.975l-1.854-.766c.219.467.576.852 1.026 1.104.908.511 2.062.2 2.573-.708.286-.508.312-1.096.11-1.602a2.38 2.38 0 0 0-1.855 1.972zm8.013-6.065c-1.378 0-2.495-1.117-2.495-2.495 0-1.378 1.117-2.495 2.495-2.495 1.378 0 2.495 1.117 2.495 2.495 0 1.378-1.117 2.495-2.495 2.495zm0-4.129a1.635 1.635 0 1 0 0 3.27 1.635 1.635 0 0 0 0-3.27z"/>
  </svg>
);

const RockstarLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#FF9900"/>
    <path d="M 20 16 H 58 C 73 16 82 25 82 38 C 82 50 72 58 58 59 L 72 84 H 55 L 43 59 H 35 V 84 H 20 V 16 Z M 35 30 V 45 H 55 C 62 45 67 42 67 37.5 C 67 33 62 30 55 30 H 35 Z" fill="#000000"/>
    <polygon points="72,56 75.8,67.2 87.4,67.2 78.1,74.0 81.6,85.3 72,78.3 62.4,85.3 65.9,74.0 56.6,67.2 68.2,67.2" fill="#FFFFFF"/>
  </svg>
);

const renderFormattedProductName = (
  nameStr: string,
  titleClassName = "",
  durationClassName = "text-violet-400 font-bold text-xs mt-0.5 block"
) => {
  if (!nameStr) return null;
  const match = nameStr.match(/^([^(]+)(?:\s*\(([^)]+)\))?$/);
  if (match && match[2]) {
    const mainTitle = match[1].trim();
    const duration = match[2].trim();
    return (
      <span className="inline-flex flex-col text-right">
        <span className={titleClassName}>{mainTitle}</span>
        <span className={durationClassName}>({duration})</span>
      </span>
    );
  }
  return <span className={titleClassName}>{nameStr}</span>;
};

interface ProductCardProps {
  key?: number | string;
  product: Product;
  lang: Language;
  addToCart: (p: Product) => void;
  getDisplayPrice: (a: number) => string;
  onSelectProduct?: (p: Product) => void;
}

const ProductCard = ({ product, lang, addToCart, getDisplayPrice, onSelectProduct }: ProductCardProps) => {
  const isRockstar = 
    product.name.en.toLowerCase().includes('gta') ||
    product.name.en.toLowerCase().includes('grand') ||
    product.name.en.toLowerCase().includes('red dead') ||
    product.name.ar.toLowerCase().includes('قراند') ||
    product.name.ar.toLowerCase().includes('جراند') ||
    product.name.ar.toLowerCase().includes('ريد ديد');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      onClick={() => onSelectProduct?.(product)}
      className="group bg-[#0f0f12] rounded-2xl overflow-hidden border border-white/5 flex flex-col h-full hover:border-violet-500/30 transition-all duration-500 shadow-2xl relative cursor-pointer"
    >
      {/* Decorative Blur Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent pointer-events-none" />

      <div className="relative aspect-[4/5] overflow-hidden bg-black">
        <img 
          src={product.image} 
          alt={product.name[lang]} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        
        {/* Badges Overlay (Left) */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1.5">
          {product.oldPrice && (
            <div className="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-md shadow-lg flex items-center justify-center">
              {Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%
            </div>
          )}
        </div>

        {/* Platform Badge Overlay (Top-Right) */}
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
          {isRockstar ? (
            <div className="bg-black/90 backdrop-blur-md text-white px-2 py-1 rounded-md shadow-xl flex items-center gap-0.5 border border-amber-400/50 font-bold" title="Rockstar Games">
              <img 
                src="https://i.pinimg.com/1200x/75/4c/e0/754ce0289186d3875984907669960680.jpg" 
                alt="Rockstar Games" 
                className="w-4 h-4 object-cover rounded"
                referrerPolicy="no-referrer"
              />
              <span className="text-[9px] font-black uppercase tracking-tight text-amber-400">Rockstar</span>
            </div>
          ) : (
            <div className="bg-[#171a21]/90 backdrop-blur-md text-white px-2 py-1 rounded-md shadow-xl flex items-center gap-1 border border-white/20 font-bold" title="Steam">
              <SteamLogo className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-200">Steam</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1 relative z-10 bg-[#111827] border-t border-white/5">
        <h4 className="font-bold text-sm text-white mb-4 group-hover:text-violet-400 transition-colors min-h-[44px] text-right">
          {renderFormattedProductName(product.name[lang])}
        </h4>
        
        <div className="mt-auto">
          <div className="flex items-center justify-end gap-3 mb-4 flex-wrap">
            {product.oldPrice && (
              <span className="text-xs font-bold text-white/20 line-through decoration-white/10">
                {getDisplayPrice(product.oldPrice)}
              </span>
            )}
            <span className="text-base font-black text-white">
              {getDisplayPrice(product.price)}
            </span>
          </div>

          <button 
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product);
            }}
            className="w-full py-3 bg-transparent border border-white/10 hover:bg-violet-600 hover:border-violet-600 text-white text-[10px] font-black uppercase tracking-widest transition-all duration-300 rounded-xl flex items-center justify-center gap-2 group/btn shadow-lg"
          >
            <ShoppingCart className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
            {lang === 'ar' ? 'أضف للسلة' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const GAME_DESCRIPTIONS: Record<number, Record<Language, string>> = {
  6: { // GTA V - Premium Edition
    ar: "جراند ثيفت أوتو V: النسخة البريميوم تتضمن القصة الكاملة للعبة GTA V، وإمكانية الدخول المجاني لعالم Grand Theft Auto Online المتجدد باستمرار، بالإضافة إلى حزمة ملحقات الولاية المالية (Criminal Enterprise Starter Pack) لبدء إمبراطوريتك الإجرامية بأفضل المزايا والمكافآت.",
    en: "Grand Theft Auto V: Premium Edition includes the complete GTA V story experience, free access to the ever-evolving Grand Theft Auto Online, and the Criminal Enterprise Starter Pack to jumpstart your criminal empire."
  },
  7: { // Red Dead Redemption 2
    ar: "ملحمة الغرب الأمريكي الأسطورية من Rockstar Games. عِش تجربة آرثر مورجان وعصابة فان دير ليند في رحلة ملحمية عبر أمريكا الشاسعة والقاسية للبقاء على قيد الحياة عند فجر العصر الحديث، والحائزة على أكثر من 175 جائزة لعبة العام.",
    en: "Rockstar Games' epic tale of life in America’s unforgiving heartland. Experience Arthur Morgan and the Van der Linde gang as they flee federal agents and bounty hunters across a vast, immersive open world."
  },
  8: { // Arc Raiders
    ar: "لعبة إطلاق نار واستخراج تعاونية مجانية من منظور الشخص الثالث، حيث يتعاون اللاعبون كـ Raiders للدفاع عن الأرض وضمان بقاء البشرية ضد آلات الفضاء الغاشمة ARC في معارك تكتيكية حماسية.",
    en: "A cooperative third-person extraction shooter where Raiders team up to defend Earth and survive against ruthless mechanical threats from space."
  },
  10: { // Tekken 8
    ar: "الفصل الجديد في سلسلة ألعاب القتال العريقة من Bandai Namco. تتميز بتواجد 32 مقاتلاً تم إعادة تصميمهم بالكامل بأسلوب بصري مذهل مع نظام القتال الجديد الحماسي Heat System لمواجهات قتالية مدمّرة.",
    en: "The next chapter in the legendary fighting franchise. Features 32 redesigned fighters rendered with cutting-edge visuals and the dynamic new Heat combat system."
  },
  24: { // UNCHARTED: Legacy of Thieves Collection
    ar: "تتضمن المغامرتين الملحميتين الفائزتين بالجوائز: UNCHARTED 4: A Thief's End و UNCHARTED: The Lost Legacy. خض مغامرات نايثان دريك وكلوفر فريزر في البحث عن الكنوز التاريخية المفقودة حول العالم مع تحسينات بصرية مدهشة على الكومبيوتر.",
    en: "Includes the critically acclaimed single-player adventures: UNCHARTED 4: A Thief's End and UNCHARTED: The Lost Legacy, remastered with stunning PC visual improvements."
  },
  25: { // God of War
    ar: "مغامرة كريتوس وابنه آتريوس في عالم الأساطير النوردية القاسية. ملحمة حماسية تجمع بين القتال الملحمي بفأس ليفياثان والقصة المؤثرة والرسوم المذهلة والدعم الكامل لأجهزة الكومبيوتر.",
    en: "Journey with Kratos and Atreus through harsh Norse realms. Experience epic combat, deeply emotional storytelling, and high-performance PC graphics."
  },
  26: { // Marvel's Spider-Man Remastered
    ar: "تحكّم بشخصية بيتر باركر الخبير في محاربة الجرائم الكبرى في مدينة نيويورك النابضة بالحياة. استمتع بالتأرجح الانسيابي بين النطاحات ومواجهة أعتى الأشرار بمهارات القتال الأكروباتية الاستثنائية.",
    en: "Play as an experienced Peter Parker fighting big crime and iconic villains in Marvel's New York. Experience fluid web-slinging and dynamic acrobatic combat."
  },
  27: { // Farming Simulator 22
    ar: "محاكي الزراعة الأكثر واقعية وشاملة! قم بإدارة مزرعتك الخاصة، وزراعة المحاصيل، وتربية المواشي، وتشغيل أكثر من 400 آلة زراعية مرخصة من أشهر العلامات التجارية العالمية في فصول السنة المختلفة.",
    en: "The ultimate agriculture simulator. Create and manage your farm, harvest crops, raise livestock, and operate over 400 authentic machines from real brands across changing seasons."
  },
  28: { // DOOM Eternal
    ar: "لعبة التصويب والحركة الأسرع والأعنف! بصفك Doom Slayer، دمر جيوش الشياطين عبر الأبعاد باستخدام ترسانة أسلحة فتاكة وسرعة قتالية فائقة وموسيقى حماسية ترفع الأدرينالين.",
    en: "The ultimate high-speed demon-slaying shooter. As the Doom Slayer, conquer demons across dimensions with an arsenal of deadly weapons and unrelenting speed."
  },
  29: { // Fallout 4: Game of the Year Edition
    ar: "تتضمن اللعبة الأصلية الحائزة على أكثر من 200 جائزة بالإضافة إلى جميع الإضافات الست الرسمية (Nuka-World, Vault-Tec Workshop, Far Harbor وغيرها). استكشف العالم المفتوح بعد الكارثة النووية وابنِ مستعمرتك.",
    en: "Includes the award-winning post-apocalyptic RPG along with all six official add-ons. Rebuild the wasteland and determine the fate of the Commonwealth."
  },
  30: { // DARK SOULS III
    ar: "تحفة ألعاب الأدوار والأكشن الصعبة من FromSoftware. انطلق في رحلة في عالم متهالك مليء بالأعداء القتلة والرؤساء الضخام وتصميم المراحل العبقري ونظام القتال الدقيق.",
    en: "The acclaimed dark fantasy action RPG by FromSoftware. Master challenging combat, confront colossal bosses, and explore dark, atmospheric realms."
  },
  31: { // Detroit: Become Human
    ar: "تجربة تفاعلية سينمائية فريدة من Quantic Dream تدور في المستقبل عام 2038 حيث يبدأ الآليون (الأندرويد) بامتلاك المشاعر الإنسانية. كل قرار تتخذه يغير مجرى القصة والنهائيات بشكل كامل.",
    en: "A gripping cinematic narrative thriller set in 2038 Detroit. Control three distinct androids as their choices shape the fate of humanity and machine."
  },
  34: { // Skyrim Special Edition
    ar: "ملحمة الفانتازيا والقصة المفتوحة الفائزة بأكثر من 200 جائزة لعبة العام. تتضمن جميع الملحقات والتحسينات البصرية والدعم الكامل للمودات والأنشطة اللانهائية في عالم تمرييل.",
    en: "Winner of more than 200 Game of the Year Awards, Skyrim Special Edition includes the critically acclaimed game and add-ons with remastered art and effects."
  },
  37: { // Spider-Man: Miles Morales
    ar: "تابع رحلة المراهق مايلز موراليس وهو يتكيف مع منزله الجديد ويتبع خطى معلمه بيتر باركر ليصبح سبايدرمان الجديد مع قوى حيوية وكهربائية مذهلة لحماية مدينته.",
    en: "Experience the rise of Miles Morales as he masters new bio-explosive powers to become his own Spider-Man in a snow-covered Marvel's New York."
  },
  105: { // Ghost of Tsushima DIRECTOR'S CUT
    ar: "نسخة المخرج المكتملة لمغامرة الساموراي جين ساكاي في جزيرة تسوشيما اليابانية. تتضمن إضافات جزيرة إيكي ومود اللعب الجماعي Legends ورسومات فائقة الجمال وتقنيات الكومبيوتر الحديثة.",
    en: "Forge a new path and wage an unconventional war for the freedom of Tsushima. Includes the full game, Iki Island expansion, and Legends co-op mode."
  },
  108: { // Ready or Not
    ar: "محاكي التكتيك والتصويب الواقعي المكثف لفريق SWAT في الأزمات المعاصرة. يتطلب التخطيط التكتيكي والعمل الجماعي الدقيق واستخدام معدات الاقتحام للتعامل مع المواقف الإجرامية الخطيرة.",
    en: "An intense, tactical, first-person shooter depicting a modern-day SWAT team performing high-risk operations in realistic scenarios."
  },
  110: { // Resident Evil 4 Remake
    ar: "إعادة بناء كاملة لأسطورة الرعب والأكشن. يتوجه العميل ليون كينيدي في مهمة إنقاذ ابنة الرئيس الأمريكي من قرية أوروبية معزولة يسيطر عليها طقس غامض ومخيف بأسلوب لعب عصري مذهل.",
    en: "Survival horror reimagined. Leon S. Kennedy sets off to rescue the President's kidnapped daughter from a secluded European village steeped in nightmare."
  },
  111: { // Resident Evil Village
    ar: "استكمال لقصة إيثان وينترز في البحث عن ابنته المخطوفة داخل قرية مثلجة مرعبة تسيطر عليها مخلوقات وحشية وقادة عائلة ديميتريسكو الغامضين بأسلوب الرعب من منظور الشخص الأول.",
    en: "Experience survival horror like never before in Resident Evil Village. Help Ethan Winters battle terrifying foes in a snow-covered village of horrors."
  },
  112: { // Lies of P
    ar: "لعبة سولزلایک مثيرة مستوحاة من قصة بينوكيو الشهيرة، تقع أحداثها في مدينة كرات المظلمة والموبوءة بالدمى القاتلة. قاتل بسلاحك المطور واكذب للوصول للحقيقة للبقاء على قيد الحياة.",
    en: "A thrilling Soulslike game inspired by the story of Pinocchio. Fight through the dark city of Krat, customizing weapons and choosing truth or lies."
  },
  115: { // Tom Clancy's Ghost Recon Breakpoint
    ar: "لعبة تصويب وتكتيك عسكرية في عالم مفتوح شاسع. بصفتك أحد جنود الـ Ghost المقاتلين، حارب للعيش ضد وحدة عسكرية متمردة تمتلك طائرات درون فتاكة في جزيرة أوروا.",
    en: "A military shooter set in a diverse and hostile open world. Play solo or in four-player co-op against a rogue spec-ops faction."
  }
};

const getProductDescription = (product: Product, lang: Language): string => {
  if (product.description?.[lang]) return product.description[lang];
  if (GAME_DESCRIPTIONS[product.id]?.[lang]) return GAME_DESCRIPTIONS[product.id][lang];
  
  if (lang === 'ar') {
    return `استمتع بتجربة ألعاب لا مثيل لها مع ${product.name.ar} من متجر Lost! احصل على المنتج الرسمي 100% بأفضل سعر في السوق مع ضمان شامل وتفعيل سريع.`;
  }
  return `Get ${product.name.en} officially from Lost Store at the best price! 100% authentic product with full warranty and fast activation.`;
};

const ActivationGuide = ({ isRockstar, lang }: { isRockstar: boolean; lang: Language }) => {
  if (isRockstar) {
    return (
      <div className="mt-3 bg-gradient-to-br from-amber-500/10 via-amber-950/20 to-black p-4 rounded-2xl border border-amber-500/30 text-right">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-amber-500/20 justify-end">
          <span className="text-xs sm:text-sm font-black text-amber-400">
            {lang === 'ar' ? '🔑 طريقة تفعيل الأكواد الرقمية على منصة Rockstar' : '🔑 How to Redeem Digital Code on Rockstar Games'}
          </span>
          <img src="https://i.pinimg.com/1200x/75/4c/e0/754ce0289186d3875984907669960680.jpg" alt="Rockstar" className="w-5 h-5 rounded object-cover border border-amber-400/40" />
        </div>
        <ol className="space-y-2 text-xs text-slate-200 font-medium">
          {lang === 'ar' ? (
            <>
              <li className="flex items-start gap-2 justify-end">
                <span>افتَح مشغّل الألعاب <strong>Rockstar Games Launcher</strong> على الكومبيوتر وسجّل الدخول إلى حسابك (أو عبر <a href="https://store.rockstargames.com/redeem" target="_blank" rel="noreferrer" className="text-amber-400 underline">موقع Rockstar</a>).</span>
                <span className="bg-amber-500/20 text-amber-300 font-black px-1.5 py-0.5 rounded text-[10px] shrink-0">1</span>
              </li>
              <li className="flex items-start gap-2 justify-end">
                <span>اضغط على أيقونة الصورة الشخصية (<strong>Profile Avatar</strong>) في أعلى الزاوية اليمنى.</span>
                <span className="bg-amber-500/20 text-amber-300 font-black px-1.5 py-0.5 rounded text-[10px] shrink-0">2</span>
              </li>
              <li className="flex items-start gap-2 justify-end">
                <span>اختر <strong>Redeem Code (استرداد رمز)</strong> من القائمة المنسدلة.</span>
                <span className="bg-amber-500/20 text-amber-300 font-black px-1.5 py-0.5 rounded text-[10px] shrink-0">3</span>
              </li>
              <li className="flex items-start gap-2 justify-end">
                <span>أدخل الكود الرقمي الخاص باللعبة واضغط على <strong>Check / Validate</strong>.</span>
                <span className="bg-amber-500/20 text-amber-300 font-black px-1.5 py-0.5 rounded text-[10px] shrink-0">4</span>
              </li>
              <li className="flex items-start gap-2 justify-end">
                <span>اضغط <strong>Redeem</strong> لتأكيد التفعيل، وستظهر اللعبة فوراً في مكتبتك جاهزة للتحميل واللعب!</span>
                <span className="bg-amber-500/20 text-amber-300 font-black px-1.5 py-0.5 rounded text-[10px] shrink-0">5</span>
              </li>
            </>
          ) : (
            <>
              <li className="flex items-start gap-2">
                <span className="bg-amber-500/20 text-amber-300 font-black px-1.5 py-0.5 rounded text-[10px] shrink-0">1</span>
                <span>Open <strong>Rockstar Games Launcher</strong> on your PC (or visit <a href="https://store.rockstargames.com/redeem" target="_blank" rel="noreferrer" className="text-amber-400 underline">Rockstar Redeem</a>).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-amber-500/20 text-amber-300 font-black px-1.5 py-0.5 rounded text-[10px] shrink-0">2</span>
                <span>Click your <strong>Profile avatar</strong> in the top-right corner.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-amber-500/20 text-amber-300 font-black px-1.5 py-0.5 rounded text-[10px] shrink-0">3</span>
                <span>Select <strong>Redeem Code</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-amber-500/20 text-amber-300 font-black px-1.5 py-0.5 rounded text-[10px] shrink-0">4</span>
                <span>Enter your digital game code and click <strong>Check</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-amber-500/20 text-amber-300 font-black px-1.5 py-0.5 rounded text-[10px] shrink-0">5</span>
                <span>Click <strong>Redeem</strong> to confirm and start downloading your game!</span>
              </li>
            </>
          )}
        </ol>
      </div>
    );
  }

  return (
    <div className="mt-3 bg-gradient-to-br from-sky-950/40 via-blue-950/20 to-black p-4 rounded-2xl border border-sky-500/30 text-right">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-sky-500/20 justify-end">
        <span className="text-xs sm:text-sm font-black text-sky-400">
          {lang === 'ar' ? '🔑 طريقة تفعيل الأكواد الرقمية على منصة Steam' : '🔑 How to Redeem Digital Key on Steam'}
        </span>
        <SteamLogo className="w-5 h-5 text-sky-400" />
      </div>
      <ol className="space-y-2 text-xs text-slate-200 font-medium">
        {lang === 'ar' ? (
          <>
            <li className="flex items-start gap-2 justify-end">
              <span>افتح تطبيق <strong>Steam</strong> على الكومبيوتر وسجّل الدخول إلى حسابك (أو عبر <a href="https://store.steampowered.com/account/registerkey" target="_blank" rel="noreferrer" className="text-sky-400 underline">صفحة تفعيل ستيم</a>).</span>
              <span className="bg-sky-500/20 text-sky-300 font-black px-1.5 py-0.5 rounded text-[10px] shrink-0">1</span>
            </li>
            <li className="flex items-start gap-2 justify-end">
              <span>اضغط على قائمة <strong>Games (ألعاب)</strong> في الشريط العلوي.</span>
              <span className="bg-sky-500/20 text-sky-300 font-black px-1.5 py-0.5 rounded text-[10px] shrink-0">2</span>
            </li>
            <li className="flex items-start gap-2 justify-end">
              <span>اختر <strong>Activate a Product on Steam... (تفعيل منتج على Steam)</strong>.</span>
              <span className="bg-sky-500/20 text-sky-300 font-black px-1.5 py-0.5 rounded text-[10px] shrink-0">3</span>
            </li>
            <li className="flex items-start gap-2 justify-end">
              <span>أدخل كود التفعيل الرقمي للعبة واضغط <strong>Confirm</strong> لتُضاف اللعبة فوراً لمكتبتك للبدء بالتحميل!</span>
              <span className="bg-sky-500/20 text-sky-300 font-black px-1.5 py-0.5 rounded text-[10px] shrink-0">4</span>
            </li>
          </>
        ) : (
          <>
            <li className="flex items-start gap-2">
              <span className="bg-sky-500/20 text-sky-300 font-black px-1.5 py-0.5 rounded text-[10px] shrink-0">1</span>
              <span>Open the <strong>Steam</strong> app on your PC and log in (or visit <a href="https://store.steampowered.com/account/registerkey" target="_blank" rel="noreferrer" className="text-sky-400 underline">Steam Redeem Key</a>).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-sky-500/20 text-sky-300 font-black px-1.5 py-0.5 rounded text-[10px] shrink-0">2</span>
              <span>Click on the <strong>Games</strong> menu at the top.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-sky-500/20 text-sky-300 font-black px-1.5 py-0.5 rounded text-[10px] shrink-0">3</span>
              <span>Select <strong>Activate a Product on Steam...</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-sky-500/20 text-sky-300 font-black px-1.5 py-0.5 rounded text-[10px] shrink-0">4</span>
              <span>Enter your digital game key and click <strong>Confirm</strong> to instantly add the game to your Steam Library!</span>
            </li>
          </>
        )}
      </ol>
    </div>
  );
};

const FifaWarningBox = ({ lang }: { lang: Language }) => (
  <div className="mt-3 bg-gradient-to-br from-red-950/90 via-red-900/50 to-black p-4 rounded-2xl border-2 border-red-500/80 text-right shadow-2xl relative overflow-hidden">
    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl pointer-events-none"></div>
    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-red-500/40 justify-end text-red-400 font-black text-xs sm:text-sm">
      <span>{lang === 'ar' ? '⚠️ تحذير هـام' : '⚠️ IMPORTANT WARNING'}</span>
      <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 animate-pulse" />
    </div>
    <div className="space-y-2 text-xs text-slate-200 leading-relaxed font-medium">
      <p className="text-amber-300 font-bold text-xs sm:text-sm">
        {lang === 'ar' ? 'منطقة حساب Steam:' : 'Steam Account Region:'}
      </p>
      <p className="text-slate-100 bg-black/60 p-3 rounded-xl border border-red-500/30 font-semibold leading-relaxed">
        {lang === 'ar' 
          ? 'لا تقم بتغيير منطقة متجر Steam أو إضافة أي رصيد ووسائل دفع إلا بعد مرور شهر كامل (4 أسابيع) من استلام الحساب. سيقوم نظام Valve بتتبع ذلك وحظر الحساب فوراً إذا تم تغيير المنطقة أو إضافة رصيد قبل انقضاء هذه المدة.'
          : 'Do not change the Steam Store region or add any funds/payment methods until a full month (4 weeks) has passed since receiving the account. Valve\'s system will track this and ban the account if you change the region or add funds before this period expires.'}
      </p>
      <div className="bg-red-950/60 border border-red-500/50 p-2.5 rounded-xl text-red-300 font-bold text-[11px] sm:text-xs text-center shadow">
        {lang === 'ar'
          ? '🚨 في حال تعرض حسابك للحظر لهذا السبب، لن نقوم باستبدال الحساب أو رد المبلغ المدفوع.'
          : '🚨 If your account is banned for this reason, we will not replace the account or refund the paid amount.'}
      </div>
    </div>
  </div>
);

const AccountFeaturesBox = ({ lang }: { lang: Language }) => (
  <div className="mt-3 bg-gradient-to-br from-emerald-950/40 via-green-950/20 to-black p-4 rounded-2xl border border-emerald-500/30 text-right">
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-emerald-500/20 justify-end">
      <span className="text-xs sm:text-sm font-black text-emerald-400">
        {lang === 'ar' ? '🎮 معلومات ومميزات الحساب' : '🎮 Account Info & Features'}
      </span>
      <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
    </div>
    <ul className="space-y-2 text-xs text-slate-200 font-medium">
      <li className="flex items-center gap-2 justify-end">
        <span>{lang === 'ar' ? 'حساب خاص فيك وحدك' : 'Private account for you only'}</span>
        <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
      </li>
      <li className="flex items-center gap-2 justify-end">
        <span>{lang === 'ar' ? 'تقدر تغير الايميل' : 'You can change the email'}</span>
        <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
      </li>
      <li className="flex items-center gap-2 justify-end">
        <span>{lang === 'ar' ? 'تقدر تغير الباس' : 'You can change the password'}</span>
        <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
      </li>
      <li className="flex items-center gap-2 justify-end">
        <span>{lang === 'ar' ? 'حساب اونلاين' : 'Online account'}</span>
        <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
      </li>
    </ul>
  </div>
);

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  lang: Language;
  addToCart: (p: Product, instaUser?: string) => void;
  getDisplayPrice: (a: number) => string;
  orders?: any[];
}

const ProductDetailModal = ({ product, onClose, lang, addToCart, getDisplayPrice, orders = [] }: ProductDetailModalProps) => {
  const [activeTab, setActiveTab] = useState<'options' | 'details'>('options');
  const [instaUser, setInstaUser] = useState('');
  const [isExpandedDesc, setIsExpandedDesc] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const descRef = useRef<HTMLParagraphElement>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const descText = product ? getProductDescription(product, lang) : '';

  useEffect(() => {
    if (!descRef.current) return;
    const checkOverflow = () => {
      if (descRef.current) {
        const hasOverflow = descRef.current.scrollHeight > descRef.current.clientHeight + 2;
        setIsOverflowing(hasOverflow);
      }
    };

    checkOverflow();
    const timer = setTimeout(checkOverflow, 150);
    window.addEventListener('resize', checkOverflow);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [descText, product, lang]);

  const realPurchaseCount = useMemo(() => {
    if (!product || !orders || !Array.isArray(orders)) return 0;
    return orders.reduce((acc, order) => {
      if (!order.items || !Array.isArray(order.items)) return acc;
      const matched = order.items.find((i: any) => 
        i.id === product.id || 
        (i.name && typeof i.name === 'object' && i.name.en === product.name.en) ||
        (i.name && typeof i.name === 'object' && i.name.ar === product.name.ar) ||
        (typeof i.name === 'string' && (i.name === product.name.ar || i.name === product.name.en))
      );
      if (matched) {
        return acc + (Number(matched.quantity) || 1);
      }
      return acc;
    }, 0);
  }, [product, orders]);

  if (!product) return null;

  const isRockstar = 
    product.name.en.toLowerCase().includes('gta') ||
    product.name.en.toLowerCase().includes('grand') ||
    product.name.en.toLowerCase().includes('red dead') ||
    product.name.ar.toLowerCase().includes('قراند') ||
    product.name.ar.toLowerCase().includes('جراند') ||
    product.name.ar.toLowerCase().includes('ريد ديد');

  const isFifa = 
    product.name.en.toLowerCase().includes('fc 27') || 
    product.name.en.toLowerCase().includes('fifa') ||
    product.name.ar.includes('FC 27') ||
    product.name.ar.includes('فيفا');

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-[#0d0f17] border border-white/10 rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl my-auto text-white"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 left-4 z-30 w-10 h-10 rounded-full bg-black/70 border border-white/20 text-slate-300 hover:text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-8">
          {/* Right Column (in RTL): Image & Badges Card */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-[#181a26] to-[#0a0b12] border border-white/10 p-3 flex flex-col justify-between shadow-2xl min-h-[400px]">
              <div className="relative aspect-[4/5] w-full rounded-xl overflow-hidden bg-black">
                <img 
                  src={product.image} 
                  alt={product.name[lang]} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />

                {/* Bottom Overlay Visual Badge */}
                {isFifa && (
                  <div className="absolute inset-x-0 bottom-3 px-3 z-10 pointer-events-none flex flex-col items-center text-center">
                    <div className="bg-black/80 backdrop-blur-md border border-amber-400/40 text-amber-300 font-black text-[10px] px-3.5 py-1.5 rounded-full shadow-2xl">
                      {lang === 'ar' ? '🔥 طلب مسبق' : '🔥 Pre-Order'}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer info */}
              <div className="flex items-center justify-between pt-3 px-2 border-t border-white/5 text-[11px] text-slate-400 font-bold">
                <div className="flex items-center gap-2">
                  {isRockstar ? (
                    <div className="bg-black/90 px-2 py-1 rounded border border-amber-400/40 flex items-center gap-0.5">
                      <img src="https://i.pinimg.com/1200x/75/4c/e0/754ce0289186d3875984907669960680.jpg" alt="Rockstar" className="w-3.5 h-3.5 rounded object-cover" />
                      <span className="text-[9px] font-black tracking-tight text-amber-400">Rockstar</span>
                    </div>
                  ) : (
                    <div className="bg-[#171a21] px-2 py-1 rounded border border-white/20 flex items-center gap-1 text-sky-400">
                      <SteamLogo className="w-3.5 h-3.5" />
                      <span className="text-[9px] font-black text-slate-200">Steam</span>
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-mono text-slate-500">Lost</span>
              </div>
            </div>
          </div>

          {/* Left Column (in RTL): Product Details & Order Options Form */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-4 text-right">
            <div className="flex flex-col gap-3">
              {/* Top Highlight Tagline */}
              <div className="text-red-500 font-black text-xs tracking-wider uppercase flex items-center gap-1.5 justify-end">
                <span>اقل سعر بالعالم!</span>
                <Zap size={14} className="text-amber-400 fill-amber-400" />
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                {renderFormattedProductName(product.name[lang], "", "text-violet-400 font-bold text-base sm:text-lg mt-1 block")}
              </h1>

              {/* Description */}
              <div className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed bg-white/[0.02] p-3.5 rounded-xl border border-white/5 space-y-2">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs justify-end">
                  <span>{lang === 'ar' ? 'وصف اللعبة والمنتج' : 'Game & Product Description'}</span>
                  <Package size={14} />
                </div>
                <p ref={descRef} className={isExpandedDesc ? '' : 'line-clamp-3'}>
                  {descText}
                </p>
                {(isOverflowing || isExpandedDesc) && (
                  <button 
                    onClick={() => setIsExpandedDesc(!isExpandedDesc)}
                    className="text-amber-400 text-xs font-bold hover:underline cursor-pointer block text-right"
                  >
                    {isExpandedDesc ? (lang === 'ar' ? 'عرض أقل' : 'Show less') : (lang === 'ar' ? 'قراءة المزيد' : 'Read more')}
                  </button>
                )}

                {/* Activation guide / features snippets inside description box */}
                {isFifa && <FifaWarningBox lang={lang} />}
                {product.category === 'games' && <ActivationGuide isRockstar={isRockstar} lang={lang} />}
                {product.category === 'accounts' && <AccountFeaturesBox lang={lang} />}
              </div>

              {/* Pricing & Discounts */}
              <div className="flex items-center justify-end gap-3 mt-1 flex-wrap">
                {product.oldPrice && (
                  <div className="bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded-md shadow flex items-center justify-center gap-1">
                    <span>وفر</span>
                    <span>{getDisplayPrice(product.oldPrice - product.price)}</span>
                  </div>
                )}
                {product.oldPrice && (
                  <span className="text-sm font-bold text-slate-500 line-through">
                    {getDisplayPrice(product.oldPrice)}
                  </span>
                )}
                <span className="text-2xl sm:text-3xl font-black text-amber-400">
                  {getDisplayPrice(product.price)}
                </span>
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2 justify-end text-xs font-bold text-emerald-400">
                <span>متوفر</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>

              {/* Category */}
              <div className="text-xs text-slate-400 font-bold text-right">
                <span>تصنيف المنتج: </span>
                <span className="text-amber-400 font-black cursor-pointer hover:underline">
                  {product.category === 'accounts' ? 'حسابات ألعاب' : 'ألعاب رقمية'}
                </span>
              </div>

              {/* Sales Banner */}
              <div className="w-full bg-gradient-to-r from-red-900/60 to-red-950/80 border border-red-500/40 text-red-200 text-xs sm:text-sm font-black py-2.5 px-4 rounded-xl text-center shadow-lg flex items-center justify-center gap-2 my-1">
                <span className="text-white text-base font-mono">{realPurchaseCount}</span>
                <span>{lang === 'ar' ? 'عدد مرات الشراء 💥' : 'Purchases 💥'}</span>
              </div>
            </div>

            {/* Options & Action Tabs Container */}
            <div className="bg-[#11131f] border border-white/10 rounded-2xl p-4 shadow-xl mt-1">
              {/* Tab Selector */}
              <div className="flex border-b border-white/10 mb-4 justify-end gap-2">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`px-4 py-2 text-xs font-black rounded-t-xl transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'details' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white bg-white/5'}`}
                >
                  <Package size={13} />
                  <span>التفاصيل</span>
                </button>
                <button
                  onClick={() => setActiveTab('options')}
                  className={`px-4 py-2 text-xs font-black rounded-t-xl transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'options' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white bg-white/5'}`}
                >
                  <Zap size={13} />
                  <span>الخيارات</span>
                </button>
              </div>

              {/* Tab Windows */}
              {activeTab === 'options' && (
                <div className="flex flex-col gap-3 text-right">
                  <div className="mt-2 pt-3 border-t border-white/5 flex items-center justify-between gap-3 bg-black/40 p-3 rounded-xl">
                    <div className="text-right">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">السعر الإجمالي</span>
                      <span className="text-lg font-black text-amber-400">{getDisplayPrice(product.price)}</span>
                    </div>
                    <button 
                      onClick={() => {
                        addToCart(product);
                        onClose();
                      }}
                      className="bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-black px-6 py-3 rounded-xl shadow-xl flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                    >
                      <ShoppingCart size={16} />
                      <span>أضف للسلة</span>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'details' && (
                <div className="flex flex-col gap-2.5 text-right text-xs text-slate-300 font-medium py-1">
                  {isFifa && <FifaWarningBox lang={lang} />}
                  {product.category === 'games' && <ActivationGuide isRockstar={isRockstar} lang={lang} />}
                  {product.category === 'accounts' && <AccountFeaturesBox lang={lang} />}
                  {product.category !== 'games' && product.category !== 'accounts' && (
                    <div className="flex items-center gap-2 justify-end">
                      <span>{lang === 'ar' ? 'ضمان شامل من متجر Lost وضمان ذهبي دائم' : 'Full warranty & permanent guarantee from Lost Store'}</span>
                      <CheckCircle2 size={14} className="text-emerald-400" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const DeliverySection = ({ order, t, onUpdate }: { order: any, t: any, onUpdate: (id: string, data: string) => void }) => {
  const [val, setVal] = useState(order.deliveryData || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onUpdate(order.id, val);
    setIsSaving(false);
  };

  return (
    <div className="mt-8 pt-8 border-t border-white/5">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-violet-600/20 rounded-lg flex items-center justify-center text-violet-500">
          <Package size={16} />
        </div>
        <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{t.deliveryInfo}</span>
      </div>
      <div className="flex flex-col gap-4">
        <div className="relative group">
          <textarea
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder={t.deliveryPlaceholder}
            className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-6 text-sm font-medium text-white placeholder:text-slate-600 outline-none focus:border-violet-500/30 focus:bg-white/[0.04] transition-all resize-none h-32 leading-relaxed shadow-inner"
          />
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-violet-600/10 px-3 py-1 rounded-full text-[9px] font-bold text-violet-400 uppercase tracking-widest border border-violet-500/20">
              Live Editing
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-10 py-4 bg-violet-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-violet-500 transition-all shadow-xl shadow-violet-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle2 size={16} />
            )}
            {t.saveDelivery}
          </button>
        </div>
      </div>
    </div>
  );
};

const ADMIN_EMAILS = ['salamehmhnd1@gmail.com', 'mohaned.eyad11@gmail.com', 'loststore.jo@gmail.com'];
const isAdminEmail = (email?: string | null) => !!email && ADMIN_EMAILS.includes(email.toLowerCase());

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

function AuthModal({ isOpen, onClose, lang, onSuccess }: AuthModalProps & { onSuccess?: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const GAS_URL = 'https://script.google.com/macros/s/AKfycbwuRDNn4sd1SDonqKD2N7lWZW16ewiuLfanz2h0T4xggq4vavovLmKtxVjiujnAZ75oNA/exec';

  if (!isOpen) return null;

  const handleSendCode = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email || !email.trim()) {
      setError(lang === 'ar' ? 'يرجى إدخال البريد الإلكتروني.' : 'Please enter your email address.');
      return;
    }

    if (mode === 'signup' && !displayName.trim()) {
      setError(lang === 'ar' ? 'يرجى إدخال حسابك في انستغرام لتسليمك الطلب.' : 'Please enter your Instagram account for order delivery.');
      return;
    }

    setLoading(true);
    try {
      const trimmedEmail = email.trim();
      const queryUrl = `${GAS_URL}?action=sendCode&email=${encodeURIComponent(trimmedEmail)}`;

      let response: Response | null = null;
      let data: any = {};

      // Send POST request as requested
      try {
        response = await fetch(queryUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'sendCode', email: trimmedEmail })
        });
        try {
          data = await response.json();
        } catch (parseErr) {
          console.warn("GAS POST response json parse warning:", parseErr);
        }
      } catch (postErr) {
        console.warn("POST sendCode failed, attempting GET fallback:", postErr);
      }

      // If POST didn't return valid response object, try GET as fallback
      if (!data || (!data.status && !data.success && !data.result)) {
        try {
          response = await fetch(queryUrl, { method: 'GET' });
          try {
            data = await response.json();
          } catch {
            data = {};
          }
        } catch (getErr) {
          console.warn("GET sendCode fallback error:", getErr);
        }
      }

      if (data.status === 'error' || data.error) {
        setError(data.message || data.error || (lang === 'ar' ? 'فشل إرسال كود التحقق. يرجى التأكد من البريد الإلكتروني والإعدادات.' : 'Failed to send verification code. Please check your email and settings.'));
      } else {
        setStep('code');
        setSuccessMsg(lang === 'ar' ? 'تم إرسال كود التحقق إلى بريدك الإلكتروني بنجاح (افحص صندوق الوارد والبريد العشوائي Spam).' : 'Verification code sent! Please check your Inbox and Spam folder.');
      }
    } catch (err: any) {
      console.error("Send code error:", err);
      setError(lang === 'ar' ? 'حدث خطأ أثناء إرسال الكود. يرجى التأكد من البريد الإلكتروني والمحاولة مجدداً.' : 'Error sending code. Please check your email and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!code || !code.trim()) {
      setError(lang === 'ar' ? 'يرجى إدخال كود التحقق المكون من 6 أرقام.' : 'Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const trimmedEmail = email.trim();
      const trimmedCode = code.trim();
      const queryUrl = `${GAS_URL}?action=verifyCode&email=${encodeURIComponent(trimmedEmail)}&code=${encodeURIComponent(trimmedCode)}`;

      let response: Response | null = null;
      let data: any = {};

      // Send POST request as requested
      try {
        response = await fetch(queryUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'verifyCode', email: trimmedEmail, code: trimmedCode })
        });
        try {
          data = await response.json();
        } catch (parseErr) {
          console.warn("GAS POST response json parse warning:", parseErr);
        }
      } catch (postErr) {
        console.warn("POST verifyCode failed, attempting GET fallback:", postErr);
      }

      // If POST didn't return valid response object, try GET as fallback
      if (!data || (!data.status && !data.success && !data.result)) {
        try {
          response = await fetch(queryUrl, { method: 'GET' });
          try {
            data = await response.json();
          } catch {
            data = {};
          }
        } catch (getErr) {
          console.warn("GET verifyCode fallback error:", getErr);
        }
      }

      const isSuccess = data.status === 'success' || data.success === true || data.result === 'success' || (response && response.ok && !data.error && data.status !== 'error');

      if (!isSuccess && (data.status === 'error' || data.error || data.message?.includes('incorrect') || data.message?.includes('invalid'))) {
        setError(data.message || data.error || (lang === 'ar' ? 'كود التحقق غير صحيح أو منتهي الصلاحية.' : 'Invalid or expired verification code.'));
        setLoading(false);
        return;
      }

      // Save login session in localStorage as requested
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userEmail', trimmedEmail);

      // Verification successful! Sync user with Firebase Auth
      const defaultPassword = `LostApp2026!${trimmedEmail}`;
      try {
        if (mode === 'signup') {
          try {
            const res = await createUserWithEmailAndPassword(auth, trimmedEmail, defaultPassword);
            if (res.user) {
              if (displayName.trim()) {
                await updateProfile(res.user, { displayName: displayName.trim() });
              }
              await setDoc(doc(db, 'users', res.user.uid), {
                uid: res.user.uid,
                email: res.user.email,
                displayName: displayName.trim() || 'مستخدم Lost',
                photoURL: null,
                role: 'user'
              }, { merge: true });
            }
          } catch (authErr: any) {
            const res = await signInWithEmailAndPassword(auth, trimmedEmail, defaultPassword);
            if (res.user && displayName.trim()) {
              await updateProfile(res.user, { displayName: displayName.trim() });
              await setDoc(doc(db, 'users', res.user.uid), {
                displayName: displayName.trim()
              }, { merge: true });
            }
          }
        } else {
          try {
            await signInWithEmailAndPassword(auth, trimmedEmail, defaultPassword);
          } catch (signInErr: any) {
            const res = await createUserWithEmailAndPassword(auth, trimmedEmail, defaultPassword);
            if (res.user) {
              await setDoc(doc(db, 'users', res.user.uid), {
                uid: res.user.uid,
                email: res.user.email,
                displayName: res.user.displayName || 'مستخدم Lost',
                photoURL: null,
                role: 'user'
              }, { merge: true });
            }
          }
        }
      } catch (syncErr) {
        console.warn("User auth sync notice:", syncErr);
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      console.error("Verify code error:", err);
      setError(lang === 'ar' ? 'حدث خطأ أثناء التأكد من الكود. يرجى المحاولة مرة أخرى.' : 'Error verifying code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-dark-void border border-violet-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-right"
      >
        <button 
          onClick={onClose}
          className="absolute top-5 left-5 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"
        >
          <X size={20} />
        </button>

        {/* Header Branding */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black italic tracking-wider text-white uppercase">
            <span className="text-violet-500">LO</span>ST
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-semibold">
            {mode === 'login' 
              ? (lang === 'ar' ? 'تسجيل الدخول عبر كود التحقق' : 'Sign in with Verification Code') 
              : (lang === 'ar' ? 'إنشاء حساب جديد' : 'Create a New Account')}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-white/5 p-1 rounded-2xl mb-6 border border-white/5">
          <button 
            type="button"
            onClick={() => { setMode('login'); setStep('email'); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${mode === 'login' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' : 'text-slate-400 hover:text-white'}`}
          >
            {lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
          </button>
          <button 
            type="button"
            onClick={() => { setMode('signup'); setStep('email'); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${mode === 'signup' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' : 'text-slate-400 hover:text-white'}`}
          >
            {lang === 'ar' ? 'حساب جديد' : 'Sign Up'}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2 font-medium">
            <AlertCircle size={18} className="shrink-0 text-red-400" />
            <span className="leading-relaxed flex-1">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2 font-medium">
            <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
            <span className="leading-relaxed flex-1">{successMsg}</span>
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  {lang === 'ar' ? 'حسابك انستا' : 'Instagram Account'}
                </label>
                <div className="relative">
                  <input 
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={lang === 'ar' ? 'لتسليمك الطلب (مثال: @username)' : 'For order delivery (e.g. @username)'}
                    className="w-full bg-white/5 border border-white/10 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-white outline-none transition-all pr-10"
                  />
                  <Instagram size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                {lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <div className="relative">
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-white/5 border border-white/10 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-white outline-none transition-all pr-10"
                />
                <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 mt-2 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <Mail size={16} />
                  {lang === 'ar' ? 'إرسال كود التحقق' : 'Send Verification Code'}
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-center mb-2">
              <p className="text-[11px] text-slate-400">
                {lang === 'ar' ? 'تم إرسال كود التحقق إلى البريد:' : 'Verification code sent to:'}
              </p>
              <p className="text-xs font-bold text-violet-400 font-mono mt-0.5">{email}</p>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-300 text-xs flex items-start gap-2 leading-relaxed">
              <AlertCircle size={16} className="shrink-0 text-amber-400 mt-0.5" />
              <div>
                <p className="font-bold">
                  {lang === 'ar' ? 'لم يصلك الكود؟' : 'Code not in inbox?'}
                </p>
                <p className="text-[11px] text-amber-200/90 mt-0.5">
                  {lang === 'ar' 
                    ? 'تفقّد خانة الرسائل غير المرغوب فيها (Spam / Junk) أو البريد العشوائي، حيث تصل بعض الرسائل هناك.' 
                    : 'Please check your Spam / Junk folder as messages may sometimes arrive there.'}
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {lang === 'ar' ? 'كود التحقق (6 أرقام)' : 'Verification Code (6 digits)'}
                </label>
                <button
                  type="button"
                  onClick={() => { setStep('email'); setError(null); setSuccessMsg(null); }}
                  className="text-[10px] text-violet-400 hover:text-violet-300 font-bold underline cursor-pointer"
                >
                  {lang === 'ar' ? 'تغيير البريد' : 'Change Email'}
                </button>
              </div>
              <div className="relative">
                <input 
                  type="text"
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full bg-white/5 border border-white/10 focus:border-violet-500 rounded-xl px-4 py-3 text-center text-lg font-mono tracking-[0.5em] text-white outline-none transition-all pr-10"
                />
                <ShieldCheck size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 mt-2 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  {lang === 'ar' ? 'تأكيد الدخول' : 'Confirm Login'}
                </>
              )}
            </button>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [localLoggedIn, setLocalLoggedIn] = useState<boolean>(() => localStorage.getItem('isLoggedIn') === 'true');
  const [localUserEmail, setLocalUserEmail] = useState<string | null>(() => localStorage.getItem('userEmail'));

  useEffect(() => {
    const syncLocalStorage = () => {
      const isLogged = localStorage.getItem('isLoggedIn') === 'true';
      const storedEmail = localStorage.getItem('userEmail');
      setLocalLoggedIn(isLogged);
      setLocalUserEmail(storedEmail);
    };

    syncLocalStorage();
    window.addEventListener('storage', syncLocalStorage);
    return () => window.removeEventListener('storage', syncLocalStorage);
  }, []);

  const isLoggedIn = !!user || localLoggedIn;
  const currentEmail = user?.email || localUserEmail || '';
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [gameRequests, setGameRequests] = useState<any[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [adminSubTab, setAdminSubTab] = useState<'orders' | 'requests' | 'users'>('orders');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [lang, setLang] = useState<Language>('ar');
  const [currency, setCurrency] = useState<Currency>('JOD');
  const [currentView, setCurrentView] = useState<'home' | 'accounts' | 'cart' | 'checkout' | 'games' | 'orders' | 'admin' | 'about' | 'privacy' | 'returns'>('home');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cliq' | 'usdt' | 'paypal' | null>(null);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [adminFilter, setAdminFilter] = useState<string>('all');
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState(false);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [usdtAmount, setUsdtAmount] = useState<number | 'custom'>(10);
  const [customUsdtAmount, setCustomUsdtAmount] = useState<string>('');
  const [usdtWallet, setUsdtWallet] = useState('');
  const [isOrderComplete, setIsOrderComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingPayPal, setIsProcessingPayPal] = useState(false);
  const [paypalResetKey, setPaypalResetKey] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [usdtNetwork, setUsdtNetwork] = useState<'BSC' | 'TRC20' | 'ERC20' | 'POL'>('BSC');
  const [txid, setTxid] = useState('');
  const [productUsdtNetwork, setProductUsdtNetwork] = useState<'BSC' | 'TRC20' | 'ERC20' | 'POL'>('BSC');
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [logoToggle, setLogoToggle] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const bestSellersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isMobileMenuOpen || isSettingsModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen, isSettingsModalOpen]);

  const t = translations[lang];

  useEffect(() => {
    const timer = setInterval(() => {
      setLogoToggle(prev => !prev);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const scrollBestSellers = (direction: 'left' | 'right') => {
    if (bestSellersRef.current) {
      const scrollAmount = 300;
      const multiplier = lang === 'ar' ? -1 : 1;
      const finalDirection = direction === 'left' ? -scrollAmount : scrollAmount;
      
      bestSellersRef.current.scrollBy({
        left: finalDirection * multiplier,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    // Verified: PayPal Client ID check
    console.log("PAYPAL CLIENT ID (Active):", ("" + (import.meta.env.VITE_PAYPAL_CLIENT_ID || "sb")).substring(0, 7) + "...");

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        localStorage.setItem('isLoggedIn', 'true');
        if (currentUser.email) {
          localStorage.setItem('userEmail', currentUser.email);
          setLocalUserEmail(currentUser.email);
        }
        setLocalLoggedIn(true);
        // Sync user to Firestore - Use setDoc with merge to preserve roles and track lastLoginAt
        setDoc(doc(db, 'users', currentUser.uid), {
          uid: currentUser.uid,
          email: currentUser.email || `${currentUser.uid.substring(0, 8)}@user.lost`,
          displayName: currentUser.displayName || 'مستخدم Lost',
          photoURL: currentUser.photoURL || null,
          role: 'user', // Default role
          lastLoginAt: Timestamp.now()
        }, { merge: true }).catch((error) => {
          console.warn("User sync notice:", error);
        });
      } else {
        const isLogged = localStorage.getItem('isLoggedIn') === 'true';
        setLocalLoggedIn(isLogged);
        setLocalUserEmail(localStorage.getItem('userEmail'));
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    if (user && user.uid) {
      const isAdmin = isAdminEmail(user.email);
      const path = 'orders';
      const q = isAdmin 
        ? query(collection(db, path), orderBy('createdAt', 'desc'))
        : query(collection(db, path), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
          
      const unsubscribeOrders = onSnapshot(q, (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setOrders(ordersData);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      });
      return () => unsubscribeOrders();
    } else {
      setOrders([]);
    }
  }, [user]);

  useEffect(() => {
    if (user && user.email && isAdminEmail(user.email)) {
      const path = 'game_requests';
      const q = query(collection(db, path), orderBy('createdAt', 'desc'));
      const unsubscribeRequests = onSnapshot(q, (snapshot) => {
        const reqsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setGameRequests(reqsData);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      });
      return () => unsubscribeRequests();
    } else {
      setGameRequests([]);
    }
  }, [user]);

  useEffect(() => {
    if (user && user.email && isAdminEmail(user.email)) {
      const path = 'users';
      const q = query(collection(db, path));
      const unsubscribeUsers = onSnapshot(q, (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRegisteredUsers(usersData);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      });
      return () => unsubscribeUsers();
    } else {
      setRegisteredUsers([]);
    }
  }, [user]);

  const deleteRegisteredUser = async (userId: string) => {
    setRegisteredUsers(prev => prev.filter(u => u.id !== userId));
    const path = `users/${userId}`;
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const clearAllPreviousUsers = async () => {
    if (!window.confirm(lang === 'ar' ? 'هل أنت تأكد من مسح جميع الإيميلات المسجلة سابقاً؟' : 'Are you sure you want to clear all registered emails?')) return;
    for (const u of registeredUsers) {
      try {
        await deleteDoc(doc(db, 'users', u.id));
      } catch (e) {
        console.warn("User deletion error:", u.id, e);
      }
    }
    setRegisteredUsers([]);
  };

  const updateGameRequestStatus = async (requestId: string, newStatus: string) => {
    setGameRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: newStatus } : r));
    const path = `game_requests/${requestId}`;
    try {
      await updateDoc(doc(db, 'game_requests', requestId), {
        status: newStatus
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const deleteGameRequest = async (requestId: string) => {
    setGameRequests(prev => prev.filter(r => r.id !== requestId));
    const path = `game_requests/${requestId}`;
    try {
      await deleteDoc(doc(db, 'game_requests', requestId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const path = `orders/${orderId}`;
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus
      });
      
      if (newStatus === 'delivered') {
        const order = orders.find(o => o.id === orderId);
        if (order) {
          console.log(`[SIMULATED EMAIL]
To: ${order.userEmail || 'Customer'}
Subject: Your Order #${orderId} is Delivered!
Message: Hello, your order has been successfully delivered. Thank you for shopping with LOST!
Delivery Info: ${order.deliveryData || 'Check your orders in the app.'}
--------------------------------------------------
To integrate real emails, consider using EmailJS (client-side) or Firebase Cloud Functions with Nodemailer/SendGrid (server-side).`);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const updateDeliveryData = async (orderId: string, deliveryData: string) => {
    const path = `orders/${orderId}`;
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        deliveryData: deliveryData
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const deleteOrder = async (orderId: string) => {
    const path = `orders/${orderId}`;
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      setDeletingOrderId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleLogin = useCallback(() => {
    setIsAuthModalOpen(true);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userEmail');
      setLocalLoggedIn(false);
      setLocalUserEmail(null);
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userEmail');
    } finally {
      window.location.reload();
    }
  }, []);

  const totalPrice = useMemo(() => {
    const base = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return base * (1 - discount);
  }, [cart, discount]);

  const handleConfirmPayment = useCallback(async (paypalOrderId?: string) => {
    if (!isLoggedIn) {
      const msg = lang === 'ar' 
        ? 'يرجى تسجيل الدخول بحسابك أولاً لإكمال الطلب.' 
        : 'Please sign in to your account first to complete the order.';
      setPaymentError(msg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // If it's PayPal, we MUST have a confirmed PayPal Order ID
    if (paymentMethod === 'paypal' && !paypalOrderId) return;

    if (paymentMethod && (screenshot || paymentMethod === 'paypal' || paymentMethod === 'usdt') && isLoggedIn && !isSubmitting) {
      setIsSubmitting(true);
      try {
        let screenshotBase64 = null;
        if (screenshot) {
          // Compress and convert image to base64 to store in Firestore (doc limit 1MB)
          const compressImage = (file: File): Promise<string> => {
            return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.readAsDataURL(file);
              reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                  const canvas = document.createElement('canvas');
                  const MAX_WIDTH = 1000;
                  const MAX_HEIGHT = 1000;
                  let width = img.width;
                  let height = img.height;

                  if (width > height) {
                    if (width > MAX_WIDTH) {
                      height *= MAX_WIDTH / width;
                      width = MAX_WIDTH;
                    }
                  } else {
                    if (height > MAX_HEIGHT) {
                      width *= MAX_HEIGHT / height;
                      height = MAX_HEIGHT;
                    }
                  }

                  canvas.width = width;
                  canvas.height = height;
                  const ctx = canvas.getContext('2d');
                  ctx?.drawImage(img, 0, 0, width, height);
                  // Convert to JPEG with good compression (0.6 is plenty for evidence)
                  resolve(canvas.toDataURL('image/jpeg', 0.6));
                };
                img.onerror = (err) => reject(err);
              };
              reader.onerror = (err) => reject(err);
            });
          };
          screenshotBase64 = await compressImage(screenshot);
        }

        const generateOrderId = async () => {
          const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
          let isUnique = false;
          let newId = '';
          let attempts = 0;
          
          while (!isUnique && attempts < 10) {
            newId = '';
            for (let i = 0; i < 8; i++) {
              newId += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            
            const docRef = doc(db, 'orders', newId);
            try {
              const docSnap = await getDoc(docRef);
              if (!docSnap.exists()) {
                isUnique = true;
              }
            } catch (error) {
              handleFirestoreError(error, OperationType.GET, `orders/${newId}`);
            }
            attempts++;
          }
          return newId;
        };

        const shortOrderId = await generateOrderId();
        if (!shortOrderId) throw new Error("Could not generate a unique order ID");

        const instaHandles = cart
          .map(item => item.instaUser)
          .filter(Boolean)
          .join(', ');

        const orderPath = `orders/${shortOrderId}`;
        try {
          await setDoc(doc(db, 'orders', shortOrderId), {
            id: shortOrderId,
            userId: user?.uid || `user_${currentEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
            userEmail: user?.email || currentEmail,
            instaUser: user?.displayName || instaHandles || null,
            userDisplayName: user?.displayName || currentEmail || null,
            items: cart.map(item => ({ 
              id: item.id, 
              name: item.name, 
              quantity: item.quantity, 
              price: item.price,
              ...(item.instaUser ? { instaUser: item.instaUser } : {})
            })),
            totalPrice,
            currency: currency,
            paymentMethod: paymentMethod,
            paypalOrderId: paypalOrderId || null,
            screenshotUrl: paymentMethod === 'usdt' ? null : screenshotBase64,
            txid: paymentMethod === 'usdt' ? txid : null,
            couponUsed: discount > 0 ? couponCode : null,
            discountAmount: discount > 0 ? (totalPrice / (1 - discount)) * discount : 0,
            usdtNetwork: paymentMethod === 'usdt' ? 'BSC' : null,
            status: 'pending',
            createdAt: Timestamp.now()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, orderPath);
        }
        
        setCart([]);
        setScreenshot(null);
        setPaymentMethod(null);
        setPaymentError(null);
        setDiscount(0);
        setCouponCode('');
        setIsOrderComplete(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (error) {
        console.error("Order failed", error);
        alert(lang === 'ar' ? 'فشل إرسال الطلب. يرجى المحاولة مرة أخرى.' : 'Failed to submit order. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [paymentMethod, screenshot, user, cart, totalPrice, currency, isSubmitting, lang, discount, couponCode]);

  const toggleLang = useCallback(() => setLang(prev => prev === 'ar' ? 'en' : 'ar'), []);

  const addToCart = useCallback((product: Product, instaUser?: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1, ...(instaUser ? { instaUser } : {}) }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1, ...(instaUser ? { instaUser } : {}) }];
    });
    setPaymentError(null);
    setIsOrderComplete(false);
    setCurrentView('cart');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const updateQuantity = useCallback((productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    setCart(prev => prev.filter(p => p.id !== productId));
  }, []);

  const addUsdtToCart = useCallback(() => {
    const amount = usdtAmount === 'custom' ? parseFloat(customUsdtAmount) : usdtAmount;
    if (isNaN(amount) || amount <= 1 || !usdtWallet) return;

    const usdtProduct: Product = {
      id: Date.now(),
      name: { 
        ar: `شحن ${amount} USDT (${productUsdtNetwork})`, 
        en: `Top-up ${amount} USDT (${productUsdtNetwork})` 
      },
      price: amount * 0.72,
      image: "https://i.pinimg.com/736x/1b/c9/9d/1bc99d749b1da94c5d04637bd10be38f.jpg",
      category: "accounts"
    };

    setCart(prev => [...prev, { ...usdtProduct, quantity: 1 }]);
    setCurrentView('cart');
    window.scrollTo({ top: 0, behavior: 'instant' });
    setUsdtWallet('');
    setCustomUsdtAmount('');
  }, [usdtAmount, customUsdtAmount, usdtWallet, productUsdtNetwork]);

  const generateOrderId = useCallback(async () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars like O, 0, I, 1
    let isUnique = false;
    let newId = '';
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      newId = '';
      for (let i = 0; i < 8; i++) { // 8 characters for better uniqueness
        newId += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      const docRef = doc(db, 'orders', newId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        isUnique = true;
      }
      attempts++;
    }
    return newId;
  }, []);

  const getDisplayPrice = useCallback((amount: number) => {
    const rates: Record<Currency, number> = {
      JOD: 1,
      USD: 1.41,
      EUR: 1.32,
      SAR: 5.29,
      AED: 5.18,
      IQD: 1850
    };
    
    const convertedPrice = (amount * rates[currency]);
    const roundedPrice = Math.floor(convertedPrice * 100) / 100;
    
    const priceStr = formatNumberTwoDecimals(roundedPrice);
    
    return `${priceStr}\u00A0${currency}`;
  }, [currency]);

  const handleFileUpload = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setScreenshot(e.target.files[0]);
    }
  }, []);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, []);

  const displayProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = 
        (currentView === 'accounts' && p.category === 'accounts') ||
        (currentView === 'games' && p.category === 'games');
      
      const search = productSearchTerm.toLowerCase();
      const matchesSearch = 
        !search || 
        p.name.ar.toLowerCase().includes(search) || 
        p.name.en.toLowerCase().includes(search);
        
      return matchesCategory && matchesSearch;
    });
  }, [currentView, productSearchTerm]);

  const bestSellingProducts = useMemo(() => {
    const defaultFeaturedIds = [101, 7, 3, 106, 110, 108, 105, 113, 112, 114];

    const getProductSales = (product: Product) => {
      if (!orders || !Array.isArray(orders)) return 0;
      return orders.reduce((acc, order) => {
        if (!order.items || !Array.isArray(order.items)) return acc;
        const matched = order.items.find((i: any) => 
          i.id === product.id || 
          (i.name && typeof i.name === 'object' && i.name.en === product.name.en) ||
          (i.name && typeof i.name === 'object' && i.name.ar === product.name.ar) ||
          (typeof i.name === 'string' && (i.name === product.name.en || i.name === product.name.ar))
        );
        if (matched) {
          return acc + (Number(matched.quantity) || 1);
        }
        return acc;
      }, 0);
    };

    const productsWithSales = products.map((product, originalIndex) => {
      const sales = getProductSales(product);
      const featuredRank = defaultFeaturedIds.indexOf(product.id);
      return {
        product,
        sales,
        featuredRank: featuredRank !== -1 ? featuredRank : 999,
        originalIndex,
      };
    });

    productsWithSales.sort((a, b) => {
      if (b.sales !== a.sales) {
        return b.sales - a.sales;
      }
      if (a.featuredRank !== b.featuredRank) {
        return a.featuredRank - b.featuredRank;
      }
      return a.originalIndex - b.originalIndex;
    });

    return productsWithSales.slice(0, 6).map(item => item.product);
  }, [orders]);

  return (
    <div 
      className={`min-h-screen bg-dark-void text-slate-100 selection:bg-violet-600 selection:text-white`}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <nav className="fixed top-0 w-full z-50 bg-dark-void/90 backdrop-blur-xl py-4 shadow-[0_4px_30px_rgba(0,0,0,0.5)] border-b border-white/[0.02]">
        {authError && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-[92%] max-w-lg p-4 bg-red-950/95 border border-red-500/50 backdrop-blur-2xl text-white text-xs font-bold rounded-2xl shadow-2xl z-50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-right">
              <AlertCircle size={22} className="shrink-0 text-red-400" />
              <span className="leading-relaxed text-red-100">{authError}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={() => setAuthError(null)}
                className="p-1.5 hover:bg-white/10 rounded-xl transition-colors text-white/60 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between">
            <div className="flex flex-col items-start leading-none cursor-pointer" onClick={() => {
              setCurrentView('home');
              window.scrollTo(0, 0);
              setIsMobileMenuOpen(false);
            }}>
              <motion.h1 
                animate={{ 
                  textShadow: [
                    "0 0 10px rgba(67,156,254,0.2)",
                    "0 0 20px rgba(67,156,254,0.6)",
                    "0 0 10px rgba(67,156,254,0.2)"
                  ],
                  filter: [
                    "contrast(1)",
                    "contrast(1.2)",
                    "contrast(1)"
                  ]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-2xl sm:text-4xl font-black tracking-tighter uppercase italic text-white"
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={logoToggle ? 'ar' : 'en'}
                    initial={{ opacity: 0, x: -5, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, x: 5, filter: 'blur(4px)' }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="inline-block"
                  >
                    {logoToggle ? (
                      <><span className="text-violet-500">لو</span>ست</>
                    ) : (
                      <><span className="text-violet-500">LO</span>ST</>
                    )}
                  </motion.span>
                </AnimatePresence>
              </motion.h1>
              <span className="text-[10px] font-bold uppercase tracking-widest text-violet-500 mt-1">
                {t.logoSub}
              </span>
            </div>

          {/* Nav Icons & Mobile Layout */}
          <div className="flex items-center gap-1 sm:gap-6">
            {/* Action Buttons (Login/Orders) - Shown prominently on mobile too */}
            <div className="flex items-center gap-1 sm:gap-4">
              {isLoggedIn ? (
                <>
                  {isAdminEmail(currentEmail) && (
                    <button 
                      onClick={() => setCurrentView('admin')}
                      className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-md border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 transition-all text-xs font-bold uppercase"
                    >
                      <Shield size={14} />
                      {t.adminPanel}
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setCurrentView('orders');
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md border border-white/5 bg-white/[0.02] hover:border-violet-500/30 hover:text-white transition-all text-[10px] sm:text-xs font-bold uppercase whitespace-nowrap"
                  >
                    <History size={14} className="text-violet-500" />
                    <span className="inline">{t.myOrders}</span>
                  </button>
                </>
              ) : (
                <button 
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md border border-white/5 bg-white/[0.02] hover:border-violet-500/30 hover:text-white transition-all text-[10px] sm:text-xs font-bold uppercase whitespace-nowrap ${isLoggingIn ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <UserIcon size={14} className={isLoggingIn ? 'animate-spin' : 'text-violet-500'} />
                  {isLoggingIn ? (lang === 'ar' ? '...' : '...') : t.login}
                </button>
              )}
            </div>

            {/* Cart Button */}
            <button 
              onClick={() => {
                setCurrentView('cart');
                setIsMobileMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'instant' });
              }}
              className="p-2 sm:p-2.5 hover:bg-white/[0.05] rounded-full transition-all relative group"
            >
              <ShoppingCart size={20} className="sm:w-[22px] sm:h-[22px] group-hover:text-violet-500" />
              {cart.length > 0 && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-violet-500 rounded-full shadow-[0_0_8px_rgba(67,156,254,0.6)] text-[8px] sm:text-[10px] flex items-center justify-center font-bold text-white">
                  {cart.length}
                </span>
              )}
            </button>

            {/* Desktop Only Nav Items */}
            <div className="hidden lg:flex items-center gap-4">
              {/* Currency & Language Toggle (Unified) */}
              <button 
                onClick={() => setIsSettingsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-md border border-white/5 bg-white/[0.02] hover:border-violet-500/30 hover:text-white transition-all text-xs font-bold uppercase"
              >
                <Globe size={14} className="text-violet-500" />
                <span className="hidden sm:inline">{currency} | {lang === 'ar' ? 'العربية' : 'EN'}</span>
              </button>

              {isLoggedIn && (
                <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/[0.02]">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full border border-white/10" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-violet-600/30 border border-white/10 flex items-center justify-center text-white text-[10px] font-bold">
                      {(user?.displayName || currentEmail || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-bold text-white/80 max-w-[160px] truncate font-mono">
                    {user?.displayName && user.displayName !== 'مستخدم Lost'
                      ? (user.displayName.startsWith('@') ? user.displayName : `@${user.displayName}`)
                      : (currentEmail ? `@${currentEmail.split('@')[0]}` : '')}
                  </span>
                  <button 
                    onClick={handleLogout} 
                    title={lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}
                    className="text-white/40 hover:text-red-500 transition-colors p-1 cursor-pointer"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-white/[0.05] rounded-full transition-all text-violet-500"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/95 backdrop-blur-2xl z-[999]"
            />
            <motion.div 
              initial={{ x: lang === 'ar' ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: lang === 'ar' ? '100%' : '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`lg:hidden fixed inset-0 ${lang === 'ar' ? 'right-0' : 'left-0'} w-full h-full bg-[#020617] z-[1000] flex flex-col overflow-hidden`}
            >
              {/* Visual Accent Line */}
              <div className={`absolute top-0 bottom-0 w-1.5 bg-violet-600 ${lang === 'ar' ? 'left-0' : 'right-0'} z-0 pointer-events-none`} />

              {/* Header with Close */}
              <div className="flex items-center justify-between p-6 z-10 shrink-0">
                 <button onClick={() => setIsMobileMenuOpen(false)} className="text-white hover:text-violet-500 transition-all p-3 -m-3 outline-none">
                   <X size={32}/>
                 </button>
                 <span className="text-sm font-black text-white uppercase tracking-[0.2em] italic">
                   {lang === 'ar' ? 'القائمة الرئيسية' : 'Main Menu'}
                 </span>
              </div>

              {/* Main Scrollable Area */}
              <div className="flex-1 overflow-y-auto z-10 scrollbar-hide">
                {/* Account Actions */}
                <div className="px-8 pt-4">
                  {isLoggedIn ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-end gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                        <div className="text-right">
                           <div className="text-sm font-black text-white">
                             {user?.displayName && user.displayName !== 'مستخدم Lost'
                               ? (user.displayName.startsWith('@') ? user.displayName : `@${user.displayName}`)
                               : (currentEmail ? `@${currentEmail.split('@')[0]}` : '')}
                           </div>
                           <div className="text-xs text-white/40 font-mono">{currentEmail}</div>
                        </div>
                        <div className="relative">
                          {user?.photoURL ? (
                            <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full border border-violet-500/20" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-violet-600/30 border border-violet-500/20 flex items-center justify-center text-white text-sm font-bold">
                              {(user?.displayName || currentEmail || 'U')[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                      <button 
                        onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                        className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-black uppercase hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                      >
                        <LogOut size={14} />
                        {lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => { handleLogin(); setIsMobileMenuOpen(false); }}
                      className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-violet-600 text-white text-xs font-black uppercase"
                    >
                      <UserIcon size={14} />
                      {lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
                    </button>
                  )}
                </div>

                {/* Navigation Links */}
                <div className="flex flex-col items-end gap-2 px-8 py-6">
                  {isAdminEmail(currentEmail) && (
                    <motion.button 
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { setCurrentView('admin'); setIsMobileMenuOpen(false); }}
                      className="w-full flex items-center justify-end gap-3 text-sm font-black italic p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-500 mb-6 uppercase"
                    >
                      <span>{lang === 'ar' ? 'لوحة المسؤول' : 'Admin Panel'}</span>
                      <Shield size={20} />
                    </motion.button>
                  )}
                  <motion.button 
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setCurrentView('home'); setIsMobileMenuOpen(false); }}
                    className="w-full text-5xl font-black italic text-right py-6 text-white border-b border-white/5 hover:text-violet-500 transition-colors"
                  >
                    {lang === 'ar' ? 'الرئيسية' : 'Home'}
                  </motion.button>
                  <motion.button 
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setCurrentView('orders'); setIsMobileMenuOpen(false); }}
                    className="w-full text-5xl font-black italic text-right py-6 text-white border-b border-white/5 hover:text-violet-500 transition-colors"
                  >
                    {lang === 'ar' ? 'طلباتي' : 'My Orders'}
                  </motion.button>

                  <div className="w-full mt-8 pt-8 border-t border-white/5">
                    <button 
                      onClick={() => {
                        setIsSettingsModalOpen(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.03] active:scale-95 transition-transform"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-500">
                          <Globe size={18} />
                        </div>
                        <span className="text-sm font-bold text-slate-300">{lang === 'ar' ? t.settings || 'الإعدادات' : 'Settings'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-violet-400 font-black text-xs">
                        <span>{currency}</span>
                        <span>•</span>
                        <span>{lang === 'ar' ? 'العربية' : 'English'}</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Settings Modal (Language & Currency) */}
      <AnimatePresence>
        {isSettingsModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsModalOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-[#0a0a0b] border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <button 
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="w-10 h-10 rounded-xl bg-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all active:scale-90"
                >
                  <X size={20} />
                </button>
                <h3 className="text-xl font-black text-white italic">
                  {lang === 'ar' ? 'تخصيص التجربة' : 'Preferences'}
                </h3>
              </div>

              {/* Language Section */}
              <div className="mb-10">
                <div className="flex items-center justify-between mb-6">
                  <Globe size={18} className="text-violet-500" />
                  <span className="text-sm font-bold text-white/40 uppercase tracking-widest">
                    {lang === 'ar' ? 'اللغة' : 'Language'}
                  </span>
                </div>
                
                <div className="space-y-4">
                  {[
                    { id: 'ar', label: 'العربية' },
                    { id: 'en', label: 'English' }
                  ].map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setLang(l.id as Language)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        lang === l.id 
                          ? 'bg-violet-500/10 border-violet-500/50 text-white' 
                          : 'bg-white/[0.02] border-white/5 text-white/50 hover:border-white/10'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        lang === l.id ? 'border-violet-500 bg-violet-500 shadow-[0_0_8px_rgba(67,156,254,0.6)]' : 'border-white/20 bg-transparent'
                      }`}>
                        {lang === l.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="text-sm font-bold">{l.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Currency Section */}
              <div className="mb-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-2 h-2 rounded-full bg-violet-500" />
                  <span className="text-sm font-bold text-white/40 uppercase tracking-widest">
                    {lang === 'ar' ? 'العملة' : 'Currency'}
                  </span>
                </div>

                <div className="relative group">
                  <select 
                    value={currency} 
                    onChange={(e) => setCurrency(e.target.value as Currency)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-sm font-black text-white outline-none cursor-pointer appearance-none hover:border-violet-500/30 transition-all text-right pr-12"
                  >
                    {[
                      { code: 'JOD', label: lang === 'ar' ? 'دينار أردني' : 'Jordanian Dinar' },
                      { code: 'USD', label: lang === 'ar' ? 'دولار أمريكي' : 'US Dollar' },
                      { code: 'EUR', label: lang === 'ar' ? 'يورو' : 'Euro' },
                      { code: 'SAR', label: lang === 'ar' ? 'ريال سعودي' : 'Saudi Riyal' },
                      { code: 'AED', label: lang === 'ar' ? 'درهم إماراتي' : 'UAE Dirham' },
                      { code: 'IQD', label: lang === 'ar' ? 'دينار عراقي' : 'Iraqi Dinar' },
                    ].map(c => (
                      <option key={c.code} value={c.code} className="bg-[#0a0a0b] text-white">
                        {c.label} ({c.code})
                      </option>
                    ))}
                  </select>
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none text-violet-500 group-hover:scale-110 transition-transform">
                    <ChevronDown size={18} />
                  </div>
                </div>
              </div>

              {/* Apply Button */}
              <button 
                onClick={() => setIsSettingsModalOpen(false)}
                className="w-full py-5 rounded-2xl bg-amber-500 text-black text-sm font-black uppercase shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                {lang === 'ar' ? 'موافق' : 'Apply'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {currentView === 'home' ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Hero Section */}
          <section className="relative h-screen flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-gradient-to-b from-dark-void/60 via-deep-blue/20 to-dark-void z-10"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[180px] opacity-50"></div>
            </div>

            <div className="relative z-20 text-center px-8 max-w-5xl">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
              >
                <div className="flex justify-center mb-12">
                  <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.02] text-[11px] font-medium text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(67,156,254,0.8)]"></span>
                    {t.badge}
                  </div>
                </div>

                <h2 className="text-6xl md:text-[8rem] font-black tracking-tight leading-[1.1] mb-10 text-white">
                  {t.heroTitle1} <br />
                  {t.heroTitle2} <span className="text-violet-500 drop-shadow-[0_0_20px_rgba(67,156,254,0.3)]">{t.heroTitle3}</span>
                </h2>

                <p className="text-lg md:text-xl font-medium opacity-50 mb-16 max-w-3xl mx-auto leading-relaxed">
                  {t.subtitle}
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  <button 
                    onClick={() => {
                      const element = document.getElementById('categories');
                      element?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full sm:w-auto px-10 py-5 bg-violet-600 text-white font-bold rounded-full hover:bg-violet-500 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-violet-600/20 group"
                  >
                    {t.shopNow}
                    <ShoppingCart size={20} className="group-hover:animate-bounce" />
                  </button>
                  <button 
                    onClick={() => {
                      setCurrentView('about');
                      window.scrollTo(0, 0);
                    }}
                    className="w-full sm:w-auto px-10 py-5 border border-white/10 bg-white/[0.02] text-white font-bold rounded-full hover:bg-white/5 transition-all"
                  >
                    {t.learnMore}
                  </button>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Categories Section */}
          <section id="categories" className="py-32 px-8 max-w-7xl mx-auto">
            <div className="flex items-center gap-6 mb-16">
              <div className="w-12 h-1 bg-violet-600 rounded-full shadow-[0_0_15px_rgba(67,156,254,0.5)]"></div>
              <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">{t.categories.title}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {[
                { title: t.categories.games, icon: <Gamepad2 size={44} />, desc: lang === 'ar' ? 'ألعاب لحسابك الشخصي' : 'Games for your personal account', view: 'home' },
                { title: t.categories.accounts, icon: <UserCircle size={44} />, desc: lang === 'ar' ? 'حسابات اونلاين موثوقة خاصة فيك' : 'Verified personal online accounts', view: 'accounts' }
              ].map((cat, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -20, borderColor: 'rgba(67, 156, 254, 0.4)' }}
                  onClick={() => {
                    if (cat.view === 'accounts') {
                      setCurrentView('accounts');
                      setProductSearchTerm('');
                      window.scrollTo(0, 0);
                    }
                    if (cat.title === t.categories.games) {
                      setCurrentView('games');
                      setProductSearchTerm('');
                      window.scrollTo(0, 0);
                    }
                  }}
                  className="relative group bg-deep-blue/20 border border-white/5 p-14 flex flex-col items-center text-center rounded-3xl cursor-pointer overflow-hidden blue-glow"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-violet-600/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <div className="mb-10 text-violet-500/40 group-hover:text-violet-400 transition-all transform group-hover:scale-110 duration-500">
                    {cat.icon}
                  </div>
                  <h3 className="text-2xl font-black mb-4 tracking-tight text-white/90 uppercase italic">{cat.title}</h3>
                  <p className="text-[10px] font-bold opacity-30 group-hover:opacity-70 uppercase tracking-[0.2em]">{cat.desc}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Best Sellers Section */}
          <section className="py-32 px-8 max-w-7xl mx-auto border-t border-white/[0.02]">
            <div className="flex items-center justify-between mb-16">
              <div className="flex items-center gap-6">
                <div className="w-12 h-1 bg-violet-600 rounded-full shadow-[0_0_15px_rgba(67,156,254,0.5)]"></div>
                <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">{t.bestSellers}</h2>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => scrollBestSellers('left')}
                  className="p-4 bg-white/5 rounded-full hover:bg-violet-600 transition-all border border-white/5"
                >
                  <ChevronLeft size={24} className={lang === 'ar' ? 'rotate-180' : ''} />
                </button>
                <button 
                  onClick={() => scrollBestSellers('right')}
                  className="p-4 bg-white/5 rounded-full hover:bg-violet-600 transition-all border border-white/5"
                >
                  <ChevronRight size={24} className={lang === 'ar' ? 'rotate-180' : ''} />
                </button>
              </div>
            </div>

            <div 
              ref={bestSellersRef}
              className="flex gap-8 overflow-x-auto pb-12 scrollbar-hide snap-x snap-mandatory no-scrollbar"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {bestSellingProducts.map((product) => (
                <div key={product.id} className="min-w-[200px] sm:min-w-[240px] snap-start flex flex-col">
                  <ProductCard 
                    product={product as Product} 
                    lang={lang} 
                    addToCart={addToCart} 
                    getDisplayPrice={getDisplayPrice} 
                    onSelectProduct={(p) => setSelectedProduct(p)}
                  />
                </div>
              ))}
            </div>
          </section>
        </motion.div>
      ) : currentView === 'accounts' ? (
        <motion.div
          initial={{ opacity: 0, x: lang === 'ar' ? -100 : 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: lang === 'ar' ? 100 : -100 }}
          transition={{ duration: 0.5 }}
          className="pt-40 pb-32 px-8 max-w-7xl mx-auto"
        >
          <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-8">
            <div className="flex items-center gap-8">
              <button 
                onClick={() => {
                  setCurrentView('home');
                  setProductSearchTerm('');
                }}
                className="p-3 bg-white/5 rounded-full hover:bg-violet-600 transition-all"
              >
                <ArrowRight size={24} className={lang === 'ar' ? '' : 'rotate-180'} />
              </button>
              <div className="w-16 h-1 bg-violet-600 rounded-full shadow-[0_0_15px_rgba(67,156,254,0.5)]"></div>
              <h2 className="text-5xl font-black uppercase italic tracking-tighter text-white">{t.categories.accounts}</h2>
            </div>
            
            <div className="flex-1 max-w-md w-full relative group">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                <Globe size={18} className="text-violet-500/50 group-hover:text-violet-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold text-white placeholder:text-slate-600 outline-none focus:border-violet-500/30 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-8">
            {displayProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                lang={lang} 
                addToCart={addToCart} 
                getDisplayPrice={getDisplayPrice} 
                onSelectProduct={(p) => setSelectedProduct(p)}
              />
            ))}
          </div>
          {displayProducts.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-32"
            >
              <div className="w-20 h-20 bg-white/[0.02] border border-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-700">
                <Globe size={32} />
              </div>
              <p className="text-sm font-black uppercase tracking-[0.4em] text-slate-500 italic">{t.noResults}</p>
            </motion.div>
          )}
          <AskForGame lang={lang} userId={user?.uid} userEmail={user?.email || currentEmail} onLoginClick={handleLogin} />
        </motion.div>
      ) : currentView === 'games' ? (
        <motion.div
          initial={{ opacity: 0, x: lang === 'ar' ? -100 : 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: lang === 'ar' ? 100 : -100 }}
          transition={{ duration: 0.5 }}
          className="pt-40 pb-32 px-8 max-w-7xl mx-auto"
        >
          <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-8">
            <div className="flex items-center gap-8">
              <button 
                onClick={() => {
                  setCurrentView('home');
                  setProductSearchTerm('');
                }}
                className="p-3 bg-white/5 rounded-full hover:bg-violet-600 transition-all"
              >
                <ArrowRight size={24} className={lang === 'ar' ? '' : 'rotate-180'} />
              </button>
              <div className="w-16 h-1 bg-violet-600 rounded-full shadow-[0_0_15px_rgba(67,156,254,0.5)]"></div>
              <h2 className="text-5xl font-black uppercase italic tracking-tighter text-white">{t.categories.games}</h2>
            </div>
            
            <div className="flex-1 max-w-md w-full relative group">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                <Globe size={18} className="text-violet-500/50 group-hover:text-violet-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold text-white placeholder:text-slate-600 outline-none focus:border-violet-500/30 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-8">
            {displayProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                lang={lang} 
                addToCart={addToCart} 
                getDisplayPrice={getDisplayPrice} 
                onSelectProduct={(p) => setSelectedProduct(p)}
              />
            ))}
          </div>
          {displayProducts.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-32"
            >
              <div className="w-20 h-20 bg-white/[0.02] border border-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-700">
                <Globe size={32} />
              </div>
              <p className="text-sm font-black uppercase tracking-[0.4em] text-slate-500 italic">{t.noResults}</p>
            </motion.div>
          )}
          <AskForGame lang={lang} userId={user?.uid} userEmail={user?.email || currentEmail} onLoginClick={handleLogin} />
        </motion.div>
      ) : currentView === 'cart' ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="pt-40 pb-32 px-8 max-w-4xl mx-auto"
        >
          <div className="flex items-center justify-between mb-16">
            <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">{t.cart}</h2>
            <button 
              onClick={() => setCurrentView('home')}
              className="text-[11px] font-black uppercase tracking-[0.4em] text-violet-400 opacity-60 hover:opacity-100 transition-all"
            >
              {t.backToShop}
            </button>
          </div>

          {cart.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-6">
                {cart.map((item, idx) => (
                  <div key={idx} className="relative flex gap-4 sm:gap-8 p-4 sm:p-6 bg-white/[0.02] border border-white/5 rounded-3xl group hover:border-violet-500/20 transition-all">
                    {/* Product Image */}
                    <img 
                      src={item.image} 
                      alt={item.name[lang]} 
                      className="w-20 h-24 sm:w-32 sm:h-32 object-cover rounded-2xl shadow-xl shrink-0" 
                    />
                    
                    {/* Content Container */}
                    <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                      <div>
                        <h4 className="font-bold text-sm sm:text-xl text-white mb-2 leading-tight">
                          {renderFormattedProductName(item.name[lang], "", "text-violet-400 font-bold text-xs sm:text-sm mt-0.5 block")}
                        </h4>
                        {item.instaUser && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-lg text-xs font-mono mb-2">
                            <Instagram size={13} />
                            <span>{item.instaUser}</span>
                          </div>
                        )}
                        <p className="text-violet-500 font-black italic text-xs sm:text-base mb-4">
                          {paymentMethod === 'usdt' 
                            ? `USDT\u00A0${formatNumberTwoDecimals(item.price * (1/0.72))}` 
                            : getDisplayPrice(item.price)}
                        </p>
                      </div>

                      {/* Controls Row */}
                      <div className="flex items-center gap-3 sm:gap-6">
                        <div className="flex items-center bg-white/5 rounded-2xl p-1 border border-white/10 select-none">
                          <motion.button 
                            whileTap={{ scale: 0.9 }}
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl bg-white/5 hover:bg-violet-600/20 text-white/50 hover:text-white transition-all active:scale-95 outline-none"
                          >
                            <Minus size={16} />
                          </motion.button>
                          <span className="font-black italic text-white text-lg sm:text-xl w-10 text-center">{item.quantity}</span>
                          <motion.button 
                            whileTap={{ scale: 0.9 }}
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl bg-white/5 hover:bg-violet-600/20 text-white/50 hover:text-white transition-all active:scale-95 outline-none"
                          >
                            <Plus size={16} />
                          </motion.button>
                        </div>

                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all border border-red-500/10"
                          title={lang === 'ar' ? 'حذف' : 'Remove'}
                        >
                          <Trash2 size={18} className="sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl h-fit sticky top-40">
                <h3 className="text-xl font-black uppercase italic text-white mb-8 border-b border-white/5 pb-4">{t.total}</h3>
                
                {/* Coupon Section */}
                <div className="mb-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">{t.couponLabel}</p>
                  <div className="flex flex-col gap-3">
                    <input 
                      type="text" 
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value);
                        setCouponError(false);
                      }}
                      className={`w-full bg-white/5 border ${couponError ? 'border-red-500/50' : 'border-white/10'} rounded-2xl px-6 py-4 text-sm text-white outline-none focus:border-violet-500/50 focus:bg-white/[0.08] transition-all placeholder:text-slate-500 font-bold shadow-inner`}
                      placeholder={lang === 'ar' ? 'أدخل كود الخصم هنا...' : 'Enter coupon code here...'}
                    />
                    <button 
                      onClick={() => {
                        // Currently no active coupons enabled
                        setDiscount(0);
                        setCouponError(true);
                      }}
                      className="w-full py-4 bg-violet-600 hover:bg-violet-500 rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all shadow-lg shadow-violet-600/20 active:scale-95"
                    >
                      {t.applyCoupon}
                    </button>
                  </div>
                  {couponError && <p className="text-[10px] font-bold text-red-500 mt-2 uppercase tracking-wider">{t.invalidCoupon}</p>}
                  {discount > 0 && (
                    <p className="text-[10px] font-bold text-emerald-500 mt-2 uppercase tracking-wider">
                      {lang === 'ar' ? 'تم تطبيق الكوبون بنجاح' : 'Coupon applied successfully'}
                    </p>
                  )}
                </div>

                <div className="mt-8 space-y-4 pt-8 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{lang === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
                    <span className="text-lg font-black text-white">
                      {paymentMethod === 'usdt' 
                        ? `USDT\u00A0${formatNumberTwoDecimals(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * (1/0.72))}` 
                        : getDisplayPrice(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0))}
                    </span>
                  </div>
                  {discount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">{lang === 'ar' ? 'الخصم' : 'Discount'}</span>
                      <span className="text-lg font-black text-emerald-500">
                        -{paymentMethod === 'usdt' 
                          ? `USDT\u00A0${formatNumberTwoDecimals(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * discount * (1/0.72))}` 
                          : getDisplayPrice(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * discount)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <span className="text-xs font-black uppercase tracking-widest text-white">{t.total}</span>
                    <span className="text-3xl font-black italic text-violet-500">
                      {paymentMethod === 'usdt' 
                        ? `USDT\u00A0${formatNumberTwoDecimals(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * (1 - discount) * (1/0.72))}` 
                        : getDisplayPrice(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * (1 - discount))}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    if (cart.length === 0) return;
                    setCurrentView('checkout');
                    window.scrollTo(0, 0);
                  }}
                  className="w-full mt-8 py-6 bg-violet-600 hover:bg-violet-500 rounded-3xl text-sm font-black uppercase tracking-[0.2em] text-white transition-all shadow-2xl shadow-violet-600/30 active:scale-[0.98] flex items-center justify-center gap-3 overflow-hidden group"
                >
                  <CreditCard className="group-hover:translate-x-1 transition-transform" />
                  {t.checkout}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white/[0.02] border border-white/5 rounded-[2.5rem] mt-12 backdrop-blur-xl animate-in fade-in zoom-in duration-500">
              <div className="w-24 h-24 bg-violet-600/10 rounded-[2rem] flex items-center justify-center text-violet-500/50 mb-8 border border-violet-500/10 shadow-2xl">
                <ShoppingCart size={40} strokeWidth={1.5} />
              </div>
              <p className="text-sm font-black uppercase tracking-[0.4em] text-slate-500 mb-10 italic">
                {lang === 'ar' ? 'سلة المشتريات فارغة' : 'Your cart is empty'}
              </p>
              <button 
                onClick={() => setCurrentView('home')}
                className="group flex items-center gap-4 px-10 py-5 bg-violet-600 hover:bg-violet-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-white transition-all shadow-2xl shadow-violet-600/20 active:scale-95"
              >
                {t.backToShop}
                <ArrowRight size={16} className={`${lang === 'ar' ? 'rotate-180' : ''} group-hover:translate-x-1 transition-transform`} />
              </button>
            </div>
          )}
        </motion.div>
      ) : currentView === 'admin' && isAdminEmail(user?.email) ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pt-40 pb-32 px-4 sm:px-8 max-w-7xl mx-auto min-h-screen"
        >
          {/* Admin Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-8">
            <div className="relative">
              <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-violet-600 rounded-full blur-[2px]"></div>
              <h2 className="text-5xl font-black uppercase italic tracking-tighter text-white leading-none">
                {t.adminPanel}
              </h2>
              <div className="flex items-center gap-3 mt-4">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
                  System Status: Operational
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setCurrentView('home')}
                className="group flex items-center gap-4 px-8 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-white hover:bg-violet-600 hover:border-violet-500 transition-all duration-300"
              >
                <ChevronLeft size={16} className={(lang === 'ar' ? 'rotate-180 ' : '') + 'group-hover:-translate-x-1 transition-transform'} />
                {t.backToShop}
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { 
                label: t.totalOrders, 
                value: orders.length, 
                icon: <Package size={24} />, 
                color: 'violet',
                trend: 'Total Volume'
              },
              { 
                label: t.totalRevenue, 
                value: `${orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.totalPrice, 0).toFixed(2)} JOD`, 
                icon: <Coins size={24} />, 
                color: 'emerald',
                trend: 'Gross Sales'
              },
              { 
                label: t.pendingOrders, 
                value: orders.filter(o => o.status === 'pending').length, 
                icon: <Clock size={24} />, 
                color: 'yellow',
                trend: 'Awaiting Action'
              },
              { 
                label: t.activeUsers, 
                value: new Set(orders.map(o => o.userEmail)).size, 
                icon: <UserCircle size={24} />, 
                color: 'blue',
                trend: 'Unique Customers'
              }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="relative group bg-white/[0.02] border border-white/5 p-8 rounded-[32px] overflow-hidden hover:border-white/10 transition-all"
              >
                <div className={`absolute -right-4 -top-4 w-24 h-24 bg-${stat.color}-600/5 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-700`}></div>
                <div className="relative z-10">
                  <div className={`w-12 h-12 bg-${stat.color}-600/10 rounded-2xl flex items-center justify-center text-${stat.color}-500 mb-6 group-hover:scale-110 transition-transform`}>
                    {stat.icon}
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{stat.label}</p>
                  <p className="text-3xl font-black italic text-white mb-2">{stat.value}</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-1 h-1 bg-${stat.color}-500 rounded-full`}></div>
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{stat.trend}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="relative">
            {/* Sub-tabs for Admin: Orders vs Game Requests */}
            <div className="flex border-b border-white/5 mb-8 overflow-x-auto no-scrollbar whitespace-nowrap">
              <button
                onClick={() => setAdminSubTab('orders')}
                className={`pb-4 px-8 text-sm font-black uppercase tracking-widest relative transition-colors ${
                  adminSubTab === 'orders' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {adminSubTab === 'orders' && (
                  <motion.div
                    layoutId="adminActiveSubTab"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-violet-600 rounded-full"
                  />
                )}
                {lang === 'ar' ? 'طلبات الشراء / الحسابات' : 'Orders'}
              </button>
              <button
                onClick={() => setAdminSubTab('requests')}
                className={`pb-4 px-8 text-sm font-black uppercase tracking-widest relative transition-colors ${
                  adminSubTab === 'requests' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {adminSubTab === 'requests' && (
                  <motion.div
                    layoutId="adminActiveSubTab"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-violet-600 rounded-full"
                  />
                )}
                <div className="flex items-center gap-2">
                  <span>{lang === 'ar' ? 'طلبات الألعاب' : 'Game Requests'}</span>
                  {gameRequests.filter(r => r.status === 'pending').length > 0 && (
                    <span className="bg-emerald-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                      {gameRequests.filter(r => r.status === 'pending').length}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => setAdminSubTab('users')}
                className={`pb-4 px-8 text-sm font-black uppercase tracking-widest relative transition-colors ${
                  adminSubTab === 'users' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {adminSubTab === 'users' && (
                  <motion.div
                    layoutId="adminActiveSubTab"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-pink-500 rounded-full"
                  />
                )}
                <div className="flex items-center gap-2">
                  <Instagram size={16} className="text-pink-400" />
                  <span>{lang === 'ar' ? 'حسابات انستا المسجلة' : 'Registered Instagram Accounts'}</span>
                  {registeredUsers.length > 0 && (
                    <span className="bg-pink-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                      {registeredUsers.length}
                    </span>
                  )}
                </div>
              </button>
            </div>

            {adminSubTab === 'orders' && (
              <>
                {/* Filters Bar */}
                <div className="sticky top-24 z-20 mb-8 p-4 sm:p-6 bg-slate-950/40 backdrop-blur-3xl border border-white/5 rounded-3xl flex flex-col lg:flex-row gap-6 shadow-2xl">
              <div className="flex-1 relative group">
                <Globe size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-violet-500/50 group-hover:text-violet-500 transition-colors" />
                <input
                  type="text"
                  placeholder={lang === 'ar' ? 'ابحث عن رقم الطلب...' : 'Search Order ID...'}
                  value={adminSearchTerm}
                  onChange={(e) => setAdminSearchTerm(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold text-white placeholder:text-slate-600 outline-none focus:border-violet-500/30 focus:bg-white/[0.05] transition-all"
                />
              </div>
              
              <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl whitespace-nowrap overflow-x-auto no-scrollbar">
                {(['all', 'pending', 'delivered', 'cancelled'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setAdminFilter(filter)}
                    className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${
                      adminFilter === filter 
                        ? 'text-white' 
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {adminFilter === filter && (
                      <motion.div 
                        layoutId="activeFilter"
                        className="absolute inset-0 bg-violet-600 rounded-xl shadow-lg shadow-violet-600/20"
                      />
                    )}
                    <span className="relative z-10">
                      {filter === 'all' ? (lang === 'ar' ? 'الكل' : 'All') : t.orderStatus[filter]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Orders List */}
            <div className="grid grid-cols-1 gap-8">
              <AnimatePresence mode="popLayout">
                {orders
                  .filter(order => {
                    const matchesFilter = adminFilter === 'all' || order.status === adminFilter;
                    const matchesSearch = !adminSearchTerm || order.id.toLowerCase().includes(adminSearchTerm.toLowerCase());
                    return matchesFilter && matchesSearch;
                  })
                  .map((order, idx) => (
                    <motion.div
                      layout
                      key={order.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4, delay: Math.min(idx * 0.05, 0.5) }}
                      className="group relative bg-[#0f0f12] border border-white/[0.05] rounded-[40px] p-8 sm:p-12 transition-all hover:border-white/10 shadow-2xl"
                    >
                      {/* Order Deletion Overlay */}
                      <AnimatePresence>
                        {deletingOrderId === order.id && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-red-600/95 backdrop-blur-xl z-30 rounded-[40px] flex flex-col items-center justify-center p-12 text-center"
                          >
                            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-white mb-8">
                              <AlertCircle size={40} className="animate-pulse" />
                            </div>
                            <h4 className="text-3xl font-black text-white uppercase italic mb-8 tracking-tighter">
                              {lang === 'ar' ? 'حذف الطلب نهائياً؟' : 'Purge this Order?'}
                            </h4>
                            <div className="flex gap-4">
                              <button 
                                onClick={() => deleteOrder(order.id)}
                                className="px-10 py-4 bg-white text-red-600 font-black uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all shadow-2xl active:scale-95"
                              >
                                {lang === 'ar' ? 'حذف الآن' : 'Execute Deletion'}
                              </button>
                              <button 
                                onClick={() => setDeletingOrderId(null)}
                                className="px-10 py-4 bg-black/20 text-white font-black uppercase tracking-widest rounded-2xl border border-white/20 hover:bg-black/30 transition-all active:scale-95"
                              >
                                {lang === 'ar' ? 'تراجع' : 'Abort'}
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="flex flex-col lg:flex-row justify-between gap-12 relative z-10">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-4 mb-8">
                             <div className="bg-violet-600/10 px-4 py-2 rounded-full border border-violet-500/20">
                               <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest font-mono">
                                 ID: {order.id.slice(0, 12)}...
                               </span>
                             </div>
                             <div className={`px-4 py-2 rounded-full border flex items-center gap-2 ${
                               order.status === 'delivered' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                               order.status === 'cancelled' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                               'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                             }`}>
                               <div className={`w-1.5 h-1.5 rounded-full ${
                                 order.status === 'delivered' ? 'bg-emerald-500' :
                                 order.status === 'cancelled' ? 'bg-red-500' : 'bg-yellow-500'
                               }`} />
                               <span className="text-[10px] font-black uppercase tracking-widest">
                                 {t.orderStatus[order.status as keyof typeof t.orderStatus]}
                               </span>
                             </div>
                          </div>

                          <h4 className="text-4xl font-black text-white italic uppercase mb-8 leading-tight tracking-tighter">
                            {order.items.map((it: any) => `${it.quantity > 1 ? `${it.quantity}x ` : ''}${it.name[lang]}`).join(', ')}
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                            <div className="flex items-center gap-4 group/item">
                              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-500 group-hover/item:text-violet-400 transition-colors">
                                <UserIcon size={18} />
                              </div>
                              <div>
                                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-0.5">Customer Email</p>
                                <p className="text-xs font-bold text-white/80 lowercase">{order.userEmail || 'No Email'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 group/item">
                              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-500 group-hover/item:text-violet-400 transition-colors">
                                <Clock size={18} />
                              </div>
                              <div>
                                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-0.5">Placement Date</p>
                                <p className="text-xs font-bold text-white/80">{order.createdAt?.toDate().toLocaleString()}</p>
                              </div>
                            </div>
                            {(() => {
                              const matchedUser = registeredUsers.find(u => 
                                (u.id && u.id === order.userId) || 
                                (u.email && order.userEmail && u.email.toLowerCase() === order.userEmail.toLowerCase())
                              );
                              const instaHandle = order.instaUser || order.userDisplayName || matchedUser?.displayName || (user?.uid === order.userId ? user.displayName : null);
                              const cleanInsta = instaHandle ? instaHandle.replace('@', '').trim() : '';

                              return (
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:col-span-2 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-transparent p-4 rounded-2xl border border-pink-500/30">
                                  <div className="flex items-center gap-4">
                                    <div className="w-11 h-11 bg-gradient-to-tr from-purple-600/30 to-pink-600/30 rounded-xl flex items-center justify-center text-pink-400 border border-pink-500/40 shadow-lg shadow-pink-500/10 shrink-0">
                                      <Instagram size={22} />
                                    </div>
                                    <div>
                                      <p className="text-[9px] font-black text-pink-400 uppercase tracking-widest mb-0.5">
                                        {lang === 'ar' ? 'حساب الإنستغرام لتسليم الطلب' : 'Instagram Account for Delivery'}
                                      </p>
                                      <p className="text-base font-black text-white font-mono">
                                        {instaHandle ? (instaHandle.startsWith('@') ? instaHandle : `@${instaHandle}`) : (lang === 'ar' ? 'غير مسجل' : 'Not Provided')}
                                      </p>
                                    </div>
                                  </div>
                                  {cleanInsta && (
                                    <a
                                      href={`https://instagram.com/${cleanInsta}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white font-black text-xs rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-pink-500/20 active:scale-95 shrink-0"
                                    >
                                      <Instagram size={14} />
                                      <span>{lang === 'ar' ? 'فتح في إنستغرام' : 'Open in Instagram'}</span>
                                      <ExternalLink size={12} />
                                    </a>
                                  )}
                                </div>
                              );
                            })()}
                          </div>

                          {order.txid && (
                            <div className="mt-8 p-6 bg-violet-600/5 border border-violet-500/10 rounded-2xl">
                              <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-2">Transaction ID (TXID)</p>
                              <p className="text-xs font-mono font-bold text-white break-all bg-black/20 p-3 rounded-lg border border-white/5 select-all">
                                {order.txid}
                              </p>
                            </div>
                          )}

                          {order.screenshotUrl && (
                            <button 
                              onClick={() => setSelectedScreenshot(order.screenshotUrl)}
                              className="mt-8 flex items-center gap-4 px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl group/img transition-all"
                            >
                              <div className="w-10 h-10 bg-violet-600/20 rounded-xl flex items-center justify-center text-violet-400 group-hover/img:scale-110 transition-transform">
                                <Upload size={18} />
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">{t.viewScreenshot}</p>
                                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Evidence of Transfer</p>
                              </div>
                            </button>
                          )}
                        </div>

                        <div className="flex flex-col lg:items-end justify-between gap-10">
                          <div className="text-right">
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Total Amount Due</p>
                            <p className="text-5xl font-black italic text-white tracking-tighter">
                              {order.totalPrice.toFixed(2)} <span className="text-lg text-violet-500 not-italic ml-1">{order.currency}</span>
                            </p>
                            <p className="text-[10px] font-bold text-violet-400/50 uppercase tracking-[0.2em] mt-3">Payment via {order.paymentMethod}</p>
                          </div>

                          <div className="flex flex-col gap-3 w-full lg:w-48">
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1 text-center lg:text-right">{t.updateStatus}</p>
                            <div className="flex lg:flex-col gap-2">
                              {(['pending', 'delivered', 'cancelled'] as const).map((status) => (
                                <button
                                  key={status}
                                  onClick={() => updateOrderStatus(order.id, status)}
                                  className={`flex-1 px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                                    order.status === status 
                                      ? status === 'delivered' 
                                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/20' 
                                        : status === 'cancelled'
                                          ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/20'
                                          : 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-600/20' 
                                      : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/20 hover:bg-white/[0.08]'
                                  }`}
                                >
                                  {t.orderStatus[status]}
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => setDeletingOrderId(order.id)}
                            className="mt-auto p-4 text-red-500/30 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all self-end"
                            title="Delete Order"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                      
                      <DeliverySection order={order} t={t} onUpdate={updateDeliveryData} />
                    </motion.div>
                  ))}
              </AnimatePresence>
              
              {orders.length === 0 && (
                <div className="text-center py-40 bg-white/[0.01] border border-dashed border-white/5 rounded-[60px]">
                  <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-700">
                    <Shield size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-4">Secure Terminal Clear</h3>
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.4em]">No database entries found within these parameters</p>
                </div>
              )}
            </div>
          </>
        )}

        {adminSubTab === 'requests' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {gameRequests.length > 0 ? (
                gameRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-[#0f0f12] border border-white/[0.05] rounded-[32px] p-8 sm:p-10 transition-all hover:border-white/10 shadow-2xl relative overflow-hidden"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            req.status === 'fulfilled' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 animate-pulse'
                          }`}>
                            {req.status === 'fulfilled' 
                              ? (lang === 'ar' ? 'تم توفيره' : 'Fulfilled') 
                              : (lang === 'ar' ? 'قيد الانتظار' : 'Pending')}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {req.createdAt?.seconds 
                              ? new Date(req.createdAt.seconds * 1000).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : ''}
                          </span>
                        </div>
                        <h4 className="text-2xl font-black italic text-white uppercase tracking-tight">
                          {req.gameTitle}
                        </h4>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                            {lang === 'ar' ? 'البريد الإلكتروني:' : 'Email:'}
                          </span>
                          <a 
                            href={`mailto:${req.contactInfo}?subject=LOST Store: Your requested game "${req.gameTitle}" is available!`}
                            className="text-sm font-bold text-violet-400 hover:underline hover:text-violet-300 transition-colors font-mono"
                          >
                            {req.contactInfo}
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end md:self-center">
                        <button
                          onClick={() => updateGameRequestStatus(req.id, req.status === 'fulfilled' ? 'pending' : 'fulfilled')}
                          className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                            req.status === 'fulfilled'
                              ? 'bg-emerald-600/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-600/20'
                              : 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-600/20 hover:bg-violet-500'
                          }`}
                        >
                          {req.status === 'fulfilled' 
                            ? (lang === 'ar' ? 'تغيير إلى قيد الانتظار' : 'Mark Pending') 
                            : (lang === 'ar' ? 'تم توفير اللعبة' : 'Mark Fulfilled')}
                        </button>
                        <button
                          onClick={() => {
                            deleteGameRequest(req.id);
                          }}
                          className="p-3 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                          title="Delete Request"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-40 bg-white/[0.01] border border-dashed border-white/5 rounded-[60px]">
                  <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-700">
                    <MessageSquarePlus size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-4">
                    {lang === 'ar' ? 'لا توجد طلبات بعد' : 'No requests yet'}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.4em]">
                    {lang === 'ar' ? 'طلبات الألعاب من عملائك ستظهر هنا' : 'Customer game requests will show up here'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {adminSubTab === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 p-6 rounded-3xl mb-6">
              <div>
                <h3 className="text-xl font-black text-white italic uppercase tracking-tight flex items-center gap-2">
                  <Instagram className="text-pink-400" size={22} />
                  <span>{lang === 'ar' ? 'سجل حسابات انستا والإيميلات' : 'Registered Instagram Accounts & Emails'}</span>
                </h3>
                <p className="text-[11px] font-medium text-slate-400 mt-1">
                  {lang === 'ar' 
                    ? 'تظهر هنا جميع حسابات الانستا والإيميلات التي تم التسجيل أو الدخول بها لتسليم الطلبات.' 
                    : 'All registered Instagram handles and emails are listed here for order processing.'}
                </p>
              </div>

              {registeredUsers.length > 0 && (
                <button
                  onClick={clearAllPreviousUsers}
                  className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95 shrink-0"
                >
                  <Trash2 size={16} />
                  <span>{lang === 'ar' ? 'حذف كافة البيانات القديمة' : 'Clear All Previous Records'}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {registeredUsers.length > 0 ? (
                registeredUsers.map((u) => {
                  const instaHandle = u.displayName || '';
                  const cleanInsta = instaHandle.replace('@', '').trim();

                  return (
                    <div 
                      key={u.id}
                      className="bg-[#0f0f12] border border-white/[0.08] hover:border-pink-500/40 rounded-2xl p-5 transition-all flex flex-col justify-between gap-4 group relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600/30 to-pink-600/30 border border-pink-500/30 flex items-center justify-center text-pink-400 font-bold shrink-0 shadow-lg shadow-pink-500/10">
                            <Instagram size={20} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] font-black uppercase tracking-widest text-pink-400">
                              {lang === 'ar' ? 'حساب الانستغرام' : 'Instagram Account'}
                            </p>
                            <div className="text-base font-black text-white font-mono truncate">
                              {instaHandle ? (instaHandle.startsWith('@') ? instaHandle : `@${instaHandle}`) : (lang === 'ar' ? 'غير محدد' : 'Not specified')}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => deleteRegisteredUser(u.id)}
                          className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer shrink-0"
                          title={lang === 'ar' ? 'حذف' : 'Delete'}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[10px] text-slate-500 font-medium">{lang === 'ar' ? 'البريد الإلكتروني:' : 'Email:'}</span>
                          <span className="font-mono text-slate-300 font-bold truncate max-w-[170px]">{u.email || u.id}</span>
                        </div>
                        {u.lastLoginAt?.seconds && (
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span>{lang === 'ar' ? 'آخر دخول:' : 'Last login:'}</span>
                            <span>{new Date(u.lastLoginAt.seconds * 1000).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}</span>
                          </div>
                        )}
                      </div>

                      {cleanInsta && (
                        <a
                          href={`https://instagram.com/${cleanInsta}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-2 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 text-pink-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                          <Instagram size={14} />
                          <span>{lang === 'ar' ? 'فتح الحساب في Instagram' : 'Open in Instagram'}</span>
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-20 bg-white/[0.01] border border-dashed border-white/5 rounded-3xl">
                  <Instagram size={40} className="mx-auto text-pink-500/30 mb-3" />
                  <h4 className="text-lg font-bold text-white mb-1">
                    {lang === 'ar' ? 'لا توجد حسابات انستا مسجلة بعد' : 'No Instagram accounts registered yet'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {lang === 'ar' ? 'سيتم إدراج أي حساب انستا يتم التسجيل به هنا تلقائياً' : 'Any Instagram account provided during signup will appear here'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
          </div>
        </motion.div>
      ) : currentView === 'orders' ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="pt-40 pb-32 px-8 max-w-4xl mx-auto"
        >
          <div className="flex items-center justify-between mb-16">
            <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">{t.myOrders}</h2>
            <button 
              onClick={() => setCurrentView('home')}
              className="text-[11px] font-black uppercase tracking-[0.4em] text-violet-400 opacity-60 hover:opacity-100 transition-all"
            >
              {t.backToShop}
            </button>
          </div>

          <div className="space-y-6">
            {orders.filter(o => (user?.uid && o.userId === user.uid) || (currentEmail && o.userEmail?.toLowerCase() === currentEmail.toLowerCase())).length > 0 ? (
              orders.filter(o => (user?.uid && o.userId === user.uid) || (currentEmail && o.userEmail?.toLowerCase() === currentEmail.toLowerCase())).map((order) => (
                <div key={order.id} className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl hover:border-violet-500/20 transition-all">
                  <div className="flex flex-col md:flex-row justify-between gap-6 mb-8">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Order ID: {order.id}</p>
                      <h4 className="text-xl font-black text-white italic uppercase leading-relaxed">
                        {order.items.map((it: any) => `${it.quantity > 1 ? `${it.quantity}x ` : ''}${it.name[lang]}`).join(', ')}
                      </h4>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        order.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                        order.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                        order.status === 'cancelled' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                        'bg-violet-500/10 text-violet-500 border border-violet-500/20'
                      }`}>
                        {t.orderStatus[order.status as keyof typeof t.orderStatus]}
                      </span>
                      <p className="text-xs font-bold text-slate-500 mt-2">{order.createdAt?.toDate().toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-6 border-t border-white/5">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">{t.orderTotal}</span>
                    <span className="text-2xl font-black italic text-white whitespace-nowrap">{order.totalPrice} {order.currency}</span>
                  </div>

                  {order.txid && (
                    <div className="mt-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">TXID</p>
                      <p className="text-[10px] font-mono text-white/60 break-all">{order.txid}</p>
                    </div>
                  )}

                  {order.status !== 'cancelled' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-8 p-8 bg-violet-600/5 border border-violet-500/20 rounded-[32px] relative overflow-hidden group"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
                      <div className="flex items-center gap-4 mb-6 relative z-10">
                        <div className="w-10 h-10 bg-violet-600/20 rounded-xl flex items-center justify-center text-violet-500">
                          <Package size={20} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-violet-400">{t.deliveryInfo}</span>
                      </div>
                      <div className="relative z-10">
                        <div className="text-base font-bold text-white whitespace-pre-wrap leading-relaxed bg-white/[0.03] p-6 rounded-2xl border border-white/5">
                          {order.deliveryData ? (
                            <p>
                              {order.deliveryData.split(/(https?:\/\/[^\s]+)/g).map((part: string, i: number) => 
                                part.match(/https?:\/\/[^\s]+/) ? (
                                  <a 
                                    key={i} 
                                    href={part} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-violet-400 hover:text-violet-300 underline underline-offset-4 decoration-violet-500/30 transition-all font-black break-all"
                                  >
                                    {part}
                                  </a>
                                ) : part
                              )}
                            </p>
                          ) : (
                            <p className="text-violet-400/50 italic font-medium">
                              {lang === 'ar' ? 'طلبك قيد التحضير، سيتم إرسال المعلومات هنا قريباً.' : 'Your order is being prepared, information will be sent here soon.'}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-20 opacity-30">
                <History size={64} className="mx-auto mb-6" />
                <p className="text-lg font-bold uppercase tracking-widest">No orders found</p>
              </div>
            )}
          </div>
        </motion.div>
      ) : currentView === 'checkout' ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5 }}
          className="pt-40 pb-32 px-8 max-w-lg mx-auto"
        >
          {isOrderComplete ? (
            <div className="text-center py-20">
              <div className="mb-12 flex justify-center">
                <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
                  <CheckCircle2 size={64} />
                </div>
              </div>
              <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white mb-6">{t.paymentSuccess}</h2>
              <p className="text-lg font-medium opacity-50 mb-12">{t.paymentSuccessDesc}</p>
              <div className="flex flex-col gap-4 items-center">
                <button 
                  onClick={() => {
                    setIsOrderComplete(false);
                    setCurrentView('orders');
                  }}
                  className="w-full sm:w-auto px-10 py-5 bg-violet-600 text-white font-bold rounded-full hover:bg-violet-500 transition-all shadow-2xl shadow-violet-600/20"
                >
                  {t.myOrders}
                </button>
                <button 
                  onClick={() => {
                    setIsOrderComplete(false);
                    setCurrentView('home');
                  }}
                  className="w-full sm:w-auto px-10 py-5 bg-white/5 text-white font-bold rounded-full hover:bg-white/10 transition-all border border-white/5"
                >
                  {lang === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white/[0.03] border border-white/5 p-10 rounded-[40px] shadow-2xl">
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">{t.totalLabel}</span>
                  <h2 className="text-3xl md:text-4xl font-black italic text-violet-500 drop-shadow-[0_0_15px_rgba(67,156,254,0.3)] whitespace-nowrap">
                    {paymentMethod === 'usdt' ? `USDT\u00A0${formatNumberTwoDecimals(totalPrice * (1/0.72))}` : getDisplayPrice(totalPrice)}
                  </h2>
                </div>
                <button 
                  onClick={() => {
                    setCurrentView('cart');
                    window.scrollTo({ top: 0, behavior: 'instant' });
                  }}
                  className="p-3 bg-white/5 rounded-full hover:bg-red-500/20 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {!user && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-amber-400"
                >
                  <div className="flex items-center gap-3">
                    <AlertCircle size={24} className="shrink-0 text-amber-400" />
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider">
                        {lang === 'ar' ? 'تنبيه: يلزم تسجيل الدخول لإكمال الطلب' : 'Notice: Login Required First'}
                      </p>
                      <p className="text-[11px] text-amber-300/80 mt-0.5">
                        {lang === 'ar' 
                          ? 'يرجى تسجيل الدخول أو إنشاء حساب جديد لتأكيد طلبك وتتبعه بسهولة.' 
                          : 'Please sign in or create an account to complete and track your order.'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={handleLogin}
                    className="px-5 py-2.5 bg-amber-500 text-black text-xs font-black uppercase rounded-xl hover:bg-amber-400 transition-all shrink-0 active:scale-95 shadow-lg shadow-amber-500/20 flex items-center gap-2 whitespace-nowrap"
                  >
                    <UserIcon size={14} />
                    {lang === 'ar' ? 'تسجيل الدخول / إنشاء حساب' : 'Sign In / Register'}
                  </button>
                </motion.div>
              )}

              {paymentError && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-between gap-3 text-red-500 shadow-lg shadow-red-500/10"
                >
                  <div className="flex items-center gap-3">
                    <AlertCircle size={20} className="shrink-0" />
                    <span className="text-xs font-black uppercase tracking-wider leading-relaxed">{paymentError}</span>
                  </div>
                  <button 
                    onClick={() => setPaymentError(null)}
                    className="p-1 hover:bg-white/5 rounded-full transition-colors"
                  >
                    <X size={16} />
                  </button>
                </motion.div>
              )}

              <div className="space-y-10">
                <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 text-center">{lang === 'ar' ? 'ملخص الطلب' : 'Order Summary'}</h3>
                  <div className="space-y-4">
                    {cart.map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <span className="text-white/60 font-bold flex items-start gap-1">
                          <span className="text-violet-400 mr-1 shrink-0">{item.quantity}x</span>
                          {renderFormattedProductName(item.name[lang], "", "text-violet-400 text-xs mt-0.5 block font-semibold")}
                        </span>
                        <span className="text-white font-black italic">{getDisplayPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-300 mb-6 text-center">{t.paymentMethod}</h3>
                  <div className="space-y-4">
                    <button 
                      onClick={() => {
                        setPaymentMethod('cliq');
                        setPaymentError(null);
                        setIsProcessingPayPal(false);
                      }}
                      className={`w-full flex items-center justify-between p-6 rounded-2xl border transition-all ${paymentMethod === 'cliq' ? 'bg-violet-600/10 border-violet-500' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}
                    >
                      <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600">
                        <CheckCircle2 size={24} />
                      </div>
                      <span className="font-black italic text-white text-xl uppercase">CliQ</span>
                    </button>
                    <button 
                      onClick={() => {
                        setPaymentMethod('usdt');
                        setPaymentError(null);
                        setIsProcessingPayPal(false);
                      }}
                      className={`w-full flex items-center justify-between p-6 rounded-2xl border transition-all ${paymentMethod === 'usdt' ? 'bg-violet-600/10 border-violet-500' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}
                    >
                      <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
                        <Zap size={24} />
                      </div>
                      <span className="font-black italic text-white text-xl uppercase">USDT</span>
                    </button>

                    <button 
                      onClick={() => {
                        setPaymentMethod('paypal');
                        setPaymentError(null);
                        setIsProcessingPayPal(false);
                        setPaypalResetKey(prev => prev + 1);
                      }}
                      className={`w-full flex items-center justify-between p-6 rounded-2xl border transition-all ${paymentMethod === 'paypal' ? 'bg-violet-600/10 border-violet-500' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}
                    >
                      <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-600">
                        <CreditCard size={24} />
                      </div>
                      <div className="text-right">
                        <span className="block font-black italic text-white text-xl uppercase leading-none">PayPal</span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Debit / Credit Card</span>
                      </div>
                    </button>
                  </div>
                </div>

                {paymentMethod === 'paypal' ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-8 bg-white/[0.02] border border-white/5 rounded-[32px] space-y-6"
                  >
                    <div className="text-center space-y-2">
                       <h4 className="text-sm font-black text-white uppercase tracking-widest">
                         {lang === 'ar' ? 'الدفع الآمن عبر PayPal' : 'Secure Payment via PayPal'}
                       </h4>
                       <p className="text-[10px] font-bold text-slate-500 uppercase">
                         {lang === 'ar' ? 'يمكنك الدفع باستخدام حساب PayPal أو بطاقتك البنكية مباشرة' : 'Pay using PayPal account or directly via Credit Card'}
                       </p>
                    </div>

                    {paymentError && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-between gap-3 text-red-500 shadow-lg shadow-red-500/10"
                      >
                        <div className="flex items-center gap-3">
                          <AlertCircle size={20} className="shrink-0" />
                          <span className="text-xs font-black uppercase tracking-wider leading-relaxed">{paymentError}</span>
                        </div>
                        <button 
                          onClick={() => setPaymentError(null)}
                          className="p-1 hover:bg-white/5 rounded-full transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </motion.div>
                    )}
                    
                    <PayPalScriptProvider options={{ 
                      "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID || "sb",
                      currency: currency === 'JOD' ? 'USD' : currency,
                      intent: "capture"
                    }}>
                      <PayPalButtons 
                        key={paypalResetKey}
                        style={{ layout: "vertical", shape: "rect", label: "pay" }}
                        onClick={(data, actions) => {
                          setPaymentError(null);
                          if (!user) {
                            const msg = lang === 'ar' 
                              ? 'يرجى تسجيل الدخول بحسابك أولاً لإكمال الطلب.' 
                              : 'Please sign in to your account first to complete the order.';
                            setPaymentError(msg);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            return actions.reject();
                          }
                        }}
                        createOrder={(data, actions) => {
                          return actions.order.create({
                             intent: "CAPTURE",
                             purchase_units: [{
                               reference_id: "order_" + Date.now(),
                               description: "Lost Store Purchase",
                               amount: {
                                 currency_code: currency === 'JOD' ? 'USD' : currency,
                                 value: totalPrice.toFixed(2),
                                 breakdown: {
                                   item_total: {
                                     currency_code: currency === 'JOD' ? 'USD' : currency,
                                     value: totalPrice.toFixed(2)
                                   }
                                 }
                               }
                             }],
                             application_context: {
                               shipping_preference: "NO_SHIPPING",
                               user_action: "PAY_NOW",
                               brand_name: "LOST STORE"
                             }
                          });
                        }}
                        onApprove={async (data, actions) => {
                          if (!actions.order) return;
                          
                          setIsProcessingPayPal(true);
                          setPaymentError(null);

                          try {
                            // 1. PRE-CHECK: Get order status before attempting capture
                            const orderDetails = await actions.order.get();
                            console.log("SHIELD PRE-CHECK - Order Status:", orderDetails.status);
                            
                            if (orderDetails.status !== 'APPROVED') {
                               throw new Error("Order not authorized by user");
                            }

                            // 2. EXECUTE CAPTURE: This is the critical moment money is pulled
                            const details: any = await actions.order.capture();
                            
                            // Deep Audit of the PayPal Response Object
                            const purchaseUnit = details.purchase_units?.[0];
                            const payments = purchaseUnit?.payments;
                            const captures = payments?.captures || [];
                            const capture = captures[0];
                            
                            const capturedStatus = capture?.status;
                            const capturedAmount = capture?.amount?.value;
                            const capturedCurrency = capture?.amount?.currency_code;
                            
                            console.log("ULTRA-SHIELD PAYPAL AUDIT:", {
                              orderId: details.id,
                              orderStatus: details.status,
                              numCaptures: captures.length,
                              capturedStatus,
                              capturedAmount,
                              capturedCurrency
                            });

                            // Security: Exact Parity Check
                            const expectedAmount = totalPrice; 
                            const expectedCurrency = currency === 'JOD' ? 'USD' : currency;

                            const isAmountCorrect = Math.abs(parseFloat(capturedAmount || "0") - expectedAmount) < 0.01;
                            const isCurrencyCorrect = capturedCurrency === expectedCurrency;
                            const isFullyCompleted = details.status === 'COMPLETED' && capturedStatus === 'COMPLETED';

                            if (isFullyCompleted && isAmountCorrect && isCurrencyCorrect) {
                              // SECONDARY SERVER-SIDE ZERO-TRUST AUDIT (Non-blocking)
                              setIsProcessingPayPal(false);
                              handleConfirmPayment(details.id);
                              
                               // Background Audit (Fire-and-forget)
                               fetch('/api/verify-paypal', {
                                 method: 'POST',
                                 headers: { 'Content-Type': 'application/json' },
                                 body: JSON.stringify({
                                   orderId: details.id,
                                   expectedAmount: totalPrice,
                                   currency: currency
                                 })
                               }).catch(e => console.warn("Background Audit Trace:", e));
                             } else {
                              // Something is wrong: PayPal says one thing, or the math is off
                              setPaymentError(lang === 'ar' ? 'فشل التحقق' : 'Verification Failed');
                              setIsProcessingPayPal(false);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                          } catch (err: any) {
                            console.error("SHIELD CAPTURE ERROR:", err);
                            
                            if (err.message && err.message.includes('INSTRUMENT_DECLINED')) {
                              setIsProcessingPayPal(false);
                              return actions.restart();
                            }

                            setPaymentError(lang === 'ar' ? 'فشل التحقق' : 'Verification Failed');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          } finally {
                            setIsProcessingPayPal(false);
                          }
                        }}
                        onCancel={() => {
                          setPaymentError(lang === 'ar' ? 'تم إلغاء عملية الدفع' : 'Payment was cancelled');
                        }}
                        onError={(err) => {
                          console.error("PayPal SDK Error:", err);
                          setIsProcessingPayPal(false);
                          const errorMsg = lang === 'ar' 
                            ? 'حدث خطأ في معالجة الدفع، يرجى المحاولة لاحقاً أو استخدام بطاقة أخرى' 
                            : 'Payment processing error, please try again or use another card';
                           setPaymentError(errorMsg);
                        }}
                      />
                    </PayPalScriptProvider>
                  </motion.div>
                ) : paymentMethod && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
                    <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[32px] space-y-8">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col items-start">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{t.requiredAmount}</span>
                          <h4 className="text-3xl font-black italic text-white text-center sm:text-left">
                            {paymentMethod === 'usdt' ? `USDT\u00A0${formatNumberTwoDecimals(totalPrice * (1/0.72))}` : getDisplayPrice(totalPrice)}
                          </h4>
                        </div>
                      </div>

                      {paymentMethod === 'usdt' && (
                        <div className="p-4 rounded-xl bg-violet-600/5 border border-violet-500/10 text-center">
                          <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest flex items-center justify-center gap-2">
                             <Globe size={12} />
                             Network: BEP-20 (BSC)
                          </p>
                        </div>
                      )}

                      <div className="space-y-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block text-center">
                          {paymentMethod === 'cliq' ? t.cliqAliasLabel : t.usdtAddressLabel}
                        </span>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => copyToClipboard(paymentMethod === 'cliq' ? t.cliqDesc : t.usdtDesc)}
                            className="p-6 bg-violet-600/10 border border-violet-500/20 rounded-2xl text-violet-500 hover:bg-violet-600/20 transition-all relative group"
                          >
                            {isCopied ? <Check size={20} /> : <Copy size={20} />}
                            {isCopied && (
                              <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-violet-600 text-white text-[10px] font-bold rounded-md whitespace-nowrap">
                                {t.copied}
                              </span>
                            )}
                          </button>
                          <div className="flex-1 px-4 sm:px-6 py-6 bg-white/[0.03] border border-white/5 rounded-2xl text-center flex items-center justify-center min-h-[72px]">
                            <span className={paymentMethod === 'usdt' 
                              ? "text-[11px] sm:text-xs md:text-sm font-mono text-emerald-400 break-all select-all block leading-relaxed tracking-normal font-bold"
                              : "text-xs sm:text-lg font-black italic tracking-widest text-white uppercase block"
                            }>
                              {paymentMethod === 'cliq' ? t.cliqDesc : t.usdtDesc}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {paymentMethod === 'usdt' ? (
                        <div className="space-y-4">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block text-center">
                            {t.txidLabel}
                          </span>
                          <input
                            type="text"
                            value={txid}
                            onChange={(e) => setTxid(e.target.value)}
                            placeholder={t.txidPlaceholder}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm font-bold text-center focus:border-violet-500 focus:bg-violet-500/5 transition-all outline-none"
                          />
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:bg-white/[0.02] hover:border-violet-500/30 transition-all group">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload size={32} className="text-violet-500/40 group-hover:text-violet-500 mb-4 transition-colors" />
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                              {screenshot ? screenshot.name : t.uploadScreenshot}
                            </p>
                          </div>
                          <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                        </label>
                      )}
                    </div>

                    <button 
                      disabled={(paymentMethod === 'usdt' ? !txid : !screenshot) || isSubmitting}
                      onClick={() => {
                        if (!user) {
                          const msg = lang === 'ar' 
                            ? 'يرجى تسجيل الدخول بحسابك أولاً لإكمال الطلب.' 
                            : 'Please sign in to your account first to complete the order.';
                          setPaymentError(msg);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                          return;
                        }
                        handleConfirmPayment();
                      }}
                      className={`w-full py-6 font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl ${(paymentMethod === 'usdt' ? txid : screenshot) && !isSubmitting ? 'bg-violet-600 text-white hover:bg-violet-500 shadow-violet-600/20' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                          <span>{lang === 'ar' ? 'جاري الإرسال...' : 'Submitting...'}</span>
                        </div>
                      ) : t.confirmPayment}
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {isProcessingPayPal && (
            <div className="fixed inset-0 z-[100] bg-dark-void/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center">
              <div className="w-24 h-24 border-4 border-violet-600/20 border-t-violet-600 rounded-full animate-spin mb-8 shadow-[0_0_30px_rgba(67,156,254,0.2)]"></div>
              <h2 className="text-2xl font-black uppercase italic tracking-widest text-white mb-4">
                {lang === 'ar' ? 'جاري التحقق من عملية الدفع...' : 'Verifying Payment Process...'}
              </h2>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest max-w-sm">
                {lang === 'ar' ? 'يرجى عدم إغلاق الصفحة، نحن نتأكد من وصول المبلغ الآن' : 'Please do not close this page, we are confirming the balance transfer now'}
              </p>
            </div>
          )}
        </motion.div>
      ) : currentView === 'about' ? (
        <InfoPage title={t.aboutUs.title} content={t.aboutUs.content} backToShop={t.backToShop} onBack={() => setCurrentView('home')} logoToggle={logoToggle} />
      ) : currentView === 'privacy' ? (
        <InfoPage title={t.privacyPolicy.title} content={t.privacyPolicy.content} backToShop={t.backToShop} onBack={() => setCurrentView('home')} logoToggle={logoToggle} />
      ) : currentView === 'returns' ? (
        <InfoPage title={t.returnPolicy.title} content={t.returnPolicy.content} backToShop={t.backToShop} onBack={() => setCurrentView('home')} logoToggle={logoToggle} />
      ) : null}

      {/* Footer */}
      <footer className="py-24 px-8 border-t border-white/[0.02] bg-dark-void mt-20 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto flex flex-col gap-20">
          {/* Top Section: Brand & Social */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col items-center md:items-start gap-2">
              <motion.h2 
                animate={{ 
                  textShadow: [
                    "0 0 10px rgba(67,156,254,0.05)",
                    "0 0 20px rgba(67,156,254,0.3)",
                    "0 0 10px rgba(67,156,254,0.05)"
                  ]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="text-5xl font-black tracking-tighter uppercase italic text-white"
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={logoToggle ? 'ar' : 'en'}
                    initial={{ opacity: 0, filter: 'grayscale(1)' }}
                    animate={{ opacity: 1, filter: 'grayscale(0)' }}
                    exit={{ opacity: 0, filter: 'grayscale(1)' }}
                    className="inline-block"
                  >
                    {logoToggle ? (
                      <><span className="text-violet-500">لو</span>ست</>
                    ) : (
                      <><span className="text-violet-500">LO</span>ST</>
                    )}
                  </motion.span>
                </AnimatePresence>
              </motion.h2>
              <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-slate-500">
                {t.logoSub}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <a 
                href="https://instagram.com/loststore.jo" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-violet-600/10 hover:border-violet-500/30 transition-all group flex items-center justify-center shadow-lg"
                title="Instagram"
              >
                <Instagram size={24} className="text-slate-400 group-hover:text-violet-400 transition-colors" />
              </a>
            </div>
          </div>

          {/* Bottom Section: Links & Copyright */}
          <div className="pt-12 border-t border-white/5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 text-center md:text-start">
              <button 
                onClick={() => {
                  setCurrentView('about');
                  window.scrollTo(0, 0);
                }}
                className="text-[11px] font-black uppercase tracking-[0.4em] text-white hover:text-violet-500 transition-all underline decoration-violet-500/10 underline-offset-8 decoration-2 hover:decoration-violet-500"
              >
                {t.aboutUs.title}
              </button>

              <button 
                onClick={() => {
                  setCurrentView('privacy');
                  window.scrollTo(0, 0);
                }}
                className="text-[11px] font-black uppercase tracking-[0.4em] text-white hover:text-violet-500 transition-all underline decoration-violet-500/10 underline-offset-8 decoration-2 hover:decoration-violet-500"
              >
                {t.privacyPolicy.title}
              </button>

              <button 
                onClick={() => {
                  setCurrentView('returns');
                  window.scrollTo(0, 0);
                }}
                className="text-[11px] font-black uppercase tracking-[0.4em] text-white hover:text-violet-500 transition-all underline decoration-violet-500/10 underline-offset-8 decoration-2 hover:decoration-violet-500"
              >
                {t.returnPolicy.title}
              </button>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-8 opacity-20">
              <p className="text-[10px] font-bold uppercase tracking-[0.4em]">
                {t.footer}
              </p>
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  <span className="text-[9px] font-black uppercase tracking-widest">Global Servers Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Screenshot Modal */}
      {selectedScreenshot && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedScreenshot(null)}
          className="fixed inset-0 bg-dark-void/90 backdrop-blur-xl z-[100] flex items-center justify-center p-8"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative max-w-4xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedScreenshot(null)}
              className="absolute top-4 right-4 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-10"
            >
              <X size={24} />
            </button>
            <img 
              src={selectedScreenshot} 
              alt="Payment Screenshot" 
              className="w-full h-full object-contain rounded-3xl border border-white/10 shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </motion.div>
      )}

      {/* Product Details Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductDetailModal 
            product={selectedProduct} 
            onClose={() => setSelectedProduct(null)} 
            lang={lang} 
            addToCart={addToCart} 
            getDisplayPrice={getDisplayPrice} 
            orders={orders}
          />
        )}
        {isAuthModalOpen && (
          <AuthModal 
            isOpen={isAuthModalOpen} 
            onClose={() => setIsAuthModalOpen(false)} 
            lang={lang} 
            onSuccess={() => {
              setCurrentView('home');
              setIsAuthModalOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
