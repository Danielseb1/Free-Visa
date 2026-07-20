import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Compass, 
  FileSpreadsheet, 
  LogOut, 
  RefreshCw, 
  Globe, 
  Navigation, 
  History, 
  Settings, 
  AlertCircle, 
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Map as MapIcon,
  HelpCircle,
  Clock,
  Share2,
  Copy
} from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { initAuth, googleSignIn, logout, getAccessToken, db, auth } from './googleAuth';
import { signInAnonymously } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  updateDoc, 
  doc, 
  getDocs, 
  serverTimestamp 
} from 'firebase/firestore';
import { appendLocationRow, getAllLocations, createNewSpreadsheet, type LocationRecord } from './sheetsApi';
import type { User } from 'firebase/auth';

const DEFAULT_SPREADSHEET_ID = '1J82AXFqaL-7vThUOnZyUKR7rwhNJDd6niXJG9nc0zk';

// Translation Dictionaries
const TRANSLATIONS = {
  am: {
    title: "ፈጣን የቦታ ማጋሪያ",
    subtitle: "አሁን ያሉበትን ትክክለኛ ቦታ በፍጥነት ወደ Google Sheets መመዝገቢያ እና መመልከቻ",
    homeTitle: "የስራ ቦታ መቆጣጠሪያ",
    employeeRoleBtn: "📍 እኔ ሰራተኛ ነኝ (ቦታ አጋራ)",
    adminRoleBtn: "🔒 እኔ አድሚን ነኝ (ካርታውን እይ)",
    employeeViewTitle: "ቦታ ማጋሪያ",
    employeeViewDesc: "አሁን ያሉበትን ቦታ ለማሳወቅ ከታች ያለውን ቁልፍ አንዴ ይጫኑ።",
    adminDashboardTitle: "የአድሚን ዳሽቦርድ",
    adminWaitingMsg: "⏳ ሰራተኛው ሎኬሽን እስኪልክ በመጠባበቅ ላይ...",
    locationFound: "✅ ሎኬሽኑ ተገኝቷል!",
    changeRole: "ወደ መነሻ ተመለስ",
    signIn: "በGoogle ይግቡ",
    signOut: "ውጣ",
    shareTab: "የአሁኑን ቦታ ያጋሩ",
    viewerTab: "የቦታዎች ታሪክና ካርታ",
    settings: "የስፕሬድሺት መለያ",
    sheetIdLabel: "የGoogle ሺት መለያ (Spreadsheet ID)",
    defaultSheetHint: "ይህ መለያ በGoogle Apps Script ውስጥ የተገለጸው የእርስዎ ዋና ሺት ነው::",
    resetDefault: "ወደ መጀመሪያው መልስ",
    shareBtn: "📍 ሎኬሽን አጋራ",
    detecting: "የአሁኑን ቦታ በመፈለግ ላይ...",
    saving: "ወደ Google Sheets በመመዝገብ ላይ...",
    successMsg: "✅ በተሳካ ሁኔታ ተልኳል!",
    errorMsg: "ስህተት ተፈጥሯል: ",
    accLabel: "ትክክለኛነት (Accuracy)",
    latLabel: "Latitude",
    lonLabel: "Longitude",
    timeLabel: "የተመዘገበበት ቀንና ሰዓት",
    mapLink: "ማፕ ሊንክ",
    historyTitle: "የተጋሩ ቦታዎች ታሪክ",
    refreshBtn: "አዲስ መረጃዎችን አምጣ",
    autoRefresh: "በራስ-ሰር አድስ (5 ሰ)",
    noHistory: "ምንም የተመዘገበ የቦታ መረጃ የለም::",
    selectRowHint: "በካርታው ላይ ለመመልከት የአንድን ረድፍ ቦታ ይጫኑ::",
    mapCardTitle: "የቦታ ማሳያ ካርታ",
    latestLocation: "የመጨረሻው የታየ ቦታ",
    noMapKeyTitle: "የካርታ አገልግሎት ቁልፍ (Google Maps API Key) ያስፈልጋል",
    noMapKeySubtitle: "ካርታውን በቀጥታ ለማየት እባክዎ የGoogle Maps API ቁልፍን በ AI Studio ውስጥ ያክሉ::",
    step1: "ደረጃ 1: የካርታ ቁልፍዎን ከGoogle Cloud Console ያግኙ",
    step2: "ደረጃ 2: በ AI Studio Secrets ውስጥ ያስገቡት",
    setupTip: "ቁልፉን ካስገቡ በኋላ አፕሊኬሽኑ በራስ-ሰር እንደገና ይገነባል - ገጹን ማደስ አያስፈልግዎትም::",
    fallbackMapBtn: "አማራጭ ካርታ ተጠቀም (ምንም ቁልፍ አያስፈልግም)",
    loadingAuth: "የመግቢያ ሁኔታን በማጣራት ላይ...",
    welcome: "እንኳን ደህና መጡ",
    shareSuccessHeading: "በተሳካ ሁኔታ ተጋርቷል!",
    accuracyHint: "የGPS ትክክለኛነት ከፍ እንዲል የስልክዎን/የኮምፒተርዎን GPS ማብራትዎን ያረጋግጡ::",
    activeStatus: "ገባሪ",
    copySuccess: "የስፕሬድሺት መለያው ተቀድቷል!",
    refreshing: "እያደሰ ነው...",
    sheetNotFoundTitle: "የጉግል ሺት አልተገኘም (ወይም መግባት አይቻልም)",
    sheetNotFoundDesc: "የተገለጸው የጉግል ሺት መለያ አልተገኘም ወይም ፍቃድ የለዎትም። አዲስ የተዘጋጀ የጉግል ሺት በራስ-ሰር ፈጥረው እዚህ መጠቀም ይችላሉ።",
    createSheetBtn: "አዲስ የጉግል ሺት በራስ-ሰር ፍጠር",
    creatingSheet: "አዲስ የጉግል ሺት በመፍጠር ላይ...",
    employeeNameLabel: "ስምዎን ያስገቡ (Your Name)",
    employeeNamePlaceholder: "ሙሉ ስምዎን እዚህ ያስገቡ (ለምሳሌ፡ ሙሉነህ ከበደ)",
    nameRequired: "እባክዎ መጀመሪያ ስምዎን ያስገቡ!"
  },
  en: {
    title: "Fast Location Share",
    subtitle: "Quickly record and display your real-time coordinates in Google Sheets",
    homeTitle: "Workplace Tracker",
    employeeRoleBtn: "📍 I am an Employee (Share Location)",
    adminRoleBtn: "🔒 I am an Admin (View Map)",
    employeeViewTitle: "Location Sharing",
    employeeViewDesc: "Click the button below once to notify your current location.",
    adminDashboardTitle: "Admin Dashboard",
    adminWaitingMsg: "⏳ Waiting for employee to send location...",
    locationFound: "✅ Location found!",
    changeRole: "Back to Home",
    signIn: "Sign in with Google",
    signOut: "Sign Out",
    shareTab: "Share My Location",
    viewerTab: "History & Map",
    settings: "Spreadsheet Configuration",
    sheetIdLabel: "Google Sheet ID (Spreadsheet ID)",
    defaultSheetHint: "This is your primary spreadsheet defined in your Google Apps Script.",
    resetDefault: "Reset to Default",
    shareBtn: "📍 Share Location",
    detecting: "Detecting your location...",
    saving: "Writing to Google Sheet...",
    successMsg: "✅ Shared successfully!",
    errorMsg: "An error occurred: ",
    accLabel: "Accuracy",
    latLabel: "Latitude",
    lonLabel: "Longitude",
    timeLabel: "Date & Time",
    mapLink: "Map Link",
    historyTitle: "Shared Location History",
    refreshBtn: "Refresh Data",
    autoRefresh: "Auto Refresh (5s)",
    noHistory: "No location records found in the sheet.",
    selectRowHint: "Click any row to highlight that location on the map.",
    mapCardTitle: "Location Visualization Map",
    latestLocation: "Latest Recorded Position",
    noMapKeyTitle: "Google Maps API Key Required",
    noMapKeySubtitle: "To view the interactive map, please provide your Google Maps API key in AI Studio.",
    step1: "Step 1: Obtain a Maps API Key from the Google Cloud Console",
    step2: "Step 2: Add your key as a secret in AI Studio:",
    setupTip: "The app rebuilds automatically after adding the secret — no reload is needed.",
    fallbackMapBtn: "Use Fallback Map (No Key Required)",
    loadingAuth: "Checking authentication status...",
    welcome: "Welcome",
    shareSuccessHeading: "Location Shared!",
    accuracyHint: "For better GPS precision, make sure your device's high-accuracy location services are enabled.",
    activeStatus: "Active",
    copySuccess: "Spreadsheet ID copied!",
    refreshing: "Refreshing...",
    sheetNotFoundTitle: "Google Sheet Not Found (or Inaccessible)",
    sheetNotFoundDesc: "The specified Spreadsheet ID was not found or you do not have permission to view it. You can automatically create a brand new configured Google Sheet with one click!",
    createSheetBtn: "Create New Google Sheet Automatically",
    creatingSheet: "Creating new spreadsheet...",
    employeeNameLabel: "Enter Your Name",
    employeeNamePlaceholder: "Type your full name here...",
    nameRequired: "Please enter your name first!"
  }
};

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

export default function App() {
  const [lang, setLang] = useState<'am' | 'en'>('am');
  const t = TRANSLATIONS[lang];

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // App Settings & App State
  const [spreadsheetId, setSpreadsheetId] = useState<string>(() => {
    return localStorage.getItem('fast_loc_spreadsheet_id') || DEFAULT_SPREADSHEET_ID;
  });
  const [employeeName, setEmployeeName] = useState<string>(() => {
    return localStorage.getItem('fast_loc_employee_name') || '';
  });
  const [activeTab, setActiveTab] = useState<'share' | 'viewer'>('share');
  const [showSettings, setShowSettings] = useState(false);
  const [copyNotification, setCopyNotification] = useState(false);
  const [role, setRole] = useState<'selection' | 'employee' | 'admin'>('selection');
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [copyLinkNotification, setCopyLinkNotification] = useState(false);
  const [hasAutoTriggered, setHasAutoTriggered] = useState(false);

  // Sharing states
  const [sharingStatus, setSharingStatus] = useState<'idle' | 'detecting' | 'saving' | 'success' | 'error'>('idle');
  const [detectedCoords, setDetectedCoords] = useState<{ lat: number; lon: number; accuracy: number } | null>(null);
  const [sharingError, setSharingError] = useState<string | null>(null);

  // Viewer states
  const [records, setRecords] = useState<LocationRecord[]>([]);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationRecord | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [useFallbackMap, setUseFallbackMap] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        setNeedsAuth(false);
        setAuthLoading(false);
      },
      () => {
        // Only set needsAuth to true if we are not in employee mode
        setUser(null);
        setToken(null);
        setNeedsAuth(role !== 'employee');
        setAuthLoading(false);
      }
    );
    return () => unsubscribe();
  }, [role]);

  // Handle URL parameters for automatic role selection
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlRole = params.get('role');
    if (urlRole === 'employee') {
      setRole('employee');
    } else if (urlRole === 'admin') {
      setRole('admin');
    }
  }, []);

  // Handle anonymous sign in for employees (completely silent and automatic)
  useEffect(() => {
    if (role === 'employee' && !user && !authLoading) {
      signInAnonymously(auth)
        .then((result) => {
          setUser(result.user);
          setNeedsAuth(false);
        })
        .catch((err) => {
          console.error('Anonymous auth failed:', err);
        });
    }
  }, [role, user, authLoading]);

  // Automatic sharing trigger when in employee mode and name is preset
  useEffect(() => {
    if (role === 'employee' && employeeName.trim() && !hasAutoTriggered && sharingStatus === 'idle') {
      setHasAutoTriggered(true);
      triggerLocationShare();
    }
  }, [role, employeeName, hasAutoTriggered, sharingStatus]);

  // Sync spreadsheetId with localStorage
  useEffect(() => {
    localStorage.setItem('fast_loc_spreadsheet_id', spreadsheetId);
  }, [spreadsheetId]);

  // Sync employeeName with localStorage
  useEffect(() => {
    localStorage.setItem('fast_loc_employee_name', employeeName);
  }, [employeeName]);

  // Admin Firestore Listener: automatically synces incoming employee pending coordinates to Google Sheets
  useEffect(() => {
    if (role !== 'admin' || !token || !spreadsheetId) return;

    const q = query(collection(db, 'pending_shares'), where('status', '==', 'pending'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type === 'added') {
          const docData = change.doc.data();
          const docId = change.doc.id;
          const { name, lat, lon } = docData;

          console.log(`Syncing pending share for ${name} to Google Sheets...`);
          try {
            // First lock the document to "syncing" status to avoid double processing
            await updateDoc(doc(db, 'pending_shares', docId), {
              status: 'syncing'
            });

            // Append row to Google Sheets on admin behalf
            const result = await appendLocationRow(token, spreadsheetId, lat, lon, name);
            if (result.success) {
              await updateDoc(doc(db, 'pending_shares', docId), {
                status: 'synced',
                syncedAt: serverTimestamp()
              });
              console.log(`Successfully synced location row for ${name}!`);
              loadHistory(true);
            } else {
              console.error(`Failed to sync row for ${name}:`, result.error);
              // Revert to pending so it can be retried
              await updateDoc(doc(db, 'pending_shares', docId), {
                status: 'pending'
              });
            }
          } catch (err) {
            console.error(`Error processing sync for doc ${docId}:`, err);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [role, token, spreadsheetId]);

  // Fetch sheet history once auth token is available
  useEffect(() => {
    if (token) {
      loadHistory();
    }
  }, [token, spreadsheetId]);

  // Auto-refresh handler for Admin Mode - checks every 5 seconds (matching getLatestLocation check from Google Apps Script)
  useEffect(() => {
    if (!token || role !== 'admin' || !autoRefresh) return;
    const interval = setInterval(() => {
      loadHistory(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [token, role, autoRefresh, spreadsheetId]);

  const loadHistory = async (silent = false) => {
    if (!token) return;
    if (!silent) setFetching(true);
    setFetchError(null);
    try {
      const data = await getAllLocations(token, spreadsheetId);
      setRecords(data);
      if (data.length > 0 && !selectedLocation) {
        // Default select the latest location (last row in sheets)
        setSelectedLocation(data[data.length - 1]);
      }
    } catch (err: any) {
      console.error('Error fetching location history:', err);
      setFetchError(err.message || 'Failed to retrieve records.');
    } finally {
      if (!silent) setFetching(false);
    }
  };

  const handleCreateNewSpreadsheet = async () => {
    if (!token) return;
    setIsCreatingSheet(true);
    setFetchError(null);
    try {
      const newId = await createNewSpreadsheet(token, 'Fast Location Share / ፈጣን የቦታ ማጋሪያ');
      setSpreadsheetId(newId);
      setRecords([]);
      setFetchError(null);
    } catch (err: any) {
      console.error('Failed to create new spreadsheet:', err);
      setFetchError(err.message || 'Failed to create new spreadsheet.');
    } finally {
      setIsCreatingSheet(false);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setToken(result.accessToken);
        setUser(result.user);
        setNeedsAuth(false);
      }
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
    setNeedsAuth(true);
    setRecords([]);
    setSelectedLocation(null);
  };

  const triggerLocationShare = () => {
    if (role === 'employee' && !employeeName.trim()) {
      setSharingStatus('error');
      setSharingError(t.nameRequired);
      return;
    }
    if (role !== 'employee' && !token) {
      setSharingStatus('error');
      setSharingError('Not signed in with Google');
      return;
    }

    setSharingStatus('detecting');
    setSharingError(null);

    if (!navigator.geolocation) {
      setSharingStatus('error');
      setSharingError(lang === 'am' ? 'Geolocation በአሳሽዎ ውስጥ አልተፈቀደም::' : 'Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setDetectedCoords({ lat: latitude, lon: longitude, accuracy: Math.round(accuracy) });
        setSharingStatus('saving');

        if (role === 'employee') {
          try {
            await addDoc(collection(db, 'pending_shares'), {
              name: employeeName.trim(),
              lat: latitude,
              lon: longitude,
              accuracy: Math.round(accuracy),
              timestamp: new Date().toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
              }),
              status: 'pending',
              createdAt: serverTimestamp()
            });

            setSharingStatus('success');
            setSelectedLocation({
              timestamp: new Date().toLocaleString(),
              name: employeeName.trim(),
              mapUrl: `https://www.google.com/maps?q=${latitude},${longitude}`,
              lat: latitude,
              lon: longitude
            });
          } catch (err: any) {
            console.error('Failed to save to Firestore:', err);
            setSharingStatus('error');
            setSharingError(err.message || 'Failed to submit location to database.');
          }
        } else {
          // Admin triggers local share
          const result = await appendLocationRow(token!, spreadsheetId, latitude, longitude, 'Admin');
          if (result.success) {
            setSharingStatus('success');
            // Reload the records so the newly shared location appears
            loadHistory(true);
            // Set selected location to the newly shared one
            setSelectedLocation({
              timestamp: new Date().toLocaleString(),
              name: 'Admin',
              mapUrl: `https://www.google.com/maps?q=${latitude},${longitude}`,
              lat: latitude,
              lon: longitude
            });
          } else {
            setSharingStatus('error');
            setSharingError(result.error || 'Failed to update Google Sheet.');
          }
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setSharingStatus('error');
        let errMsg = error.message;
        if (error.code === error.PERMISSION_DENIED) {
          errMsg = lang === 'am' ? 'የቦታ ማጋሪያ ፈቃድ ተከልክሏል:: እባክዎ ፈቃድ ይስጡ::' : 'Location permission denied. Please allow location access.';
        }
        setSharingError(errMsg);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const copySheetId = () => {
    navigator.clipboard.writeText(spreadsheetId);
    setCopyNotification(true);
    setTimeout(() => setCopyNotification(false), 2000);
  };

  const toggleLanguage = () => {
    setLang(prev => (prev === 'am' ? 'en' : 'am'));
  };

  return (
    <div id="app-root" className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Header Bar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 text-white p-2 rounded-xl shadow-sm shadow-emerald-500/20">
              <Compass className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <h1 className="font-bold text-lg sm:text-xl tracking-tight text-slate-900 flex items-center gap-2">
                {t.title}
                <span className="hidden md:inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  v1.2 {t.activeStatus}
                </span>
              </h1>
              <p className="hidden sm:block text-xs text-slate-500">{t.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>{lang === 'am' ? 'English' : 'አማርኛ'}</span>
            </button>

            {/* User Session Profile / Login */}
            {!authLoading && (
              <>
                {user && !user.isAnonymous ? (
                  <div className="flex items-center gap-2">
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={user.displayName || 'Profile'} 
                        className="w-8 h-8 rounded-full border border-emerald-500/30 shadow-inner"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                        {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </div>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 border border-red-100 rounded-lg transition-colors"
                      title={t.signOut}
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{t.signOut}</span>
                    </button>
                  </div>
                ) : (
                  !needsAuth && role !== 'employee' && (
                    <div className="text-xs text-slate-400 animate-pulse">{t.loadingAuth}</div>
                  )
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Welcome banner if not logged in */}
      {authLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
          <p className="text-sm font-medium text-slate-500">{t.loadingAuth}</p>
        </div>
      ) : (needsAuth && role !== 'employee') ? (
        <main className="flex-1 max-w-4xl mx-auto px-4 py-12 flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-12 shadow-xl shadow-slate-100 max-w-md w-full"
          >
            <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
              <MapPin className="w-8 h-8" />
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-2 font-display">{t.title}</h2>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
              {t.subtitle}
            </p>

            {/* Standard "Sign in with Google" button according to skill layout */}
            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 border border-slate-300 rounded-xl shadow-sm transition-all hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              {isLoggingIn ? (
                <RefreshCw className="w-5 h-5 animate-spin text-slate-500" />
              ) : (
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
              )}
              <span>{isLoggingIn ? t.loadingAuth : t.signIn}</span>
            </button>

            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">
              <FileSpreadsheet className="w-4 h-4 text-slate-300" />
              <span>Saves securely to Google Sheets</span>
            </div>
          </motion.div>
        </main>
      ) : (
        /* Authenticated Main App Workspace */
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
          
          {/* Welcome User bar */}
          {role !== 'employee' && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-bold">
                  👋
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
                    {t.welcome}, {user?.displayName || user?.email}!
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Connected to Google Account ({user?.email})
                  </p>
                </div>
              </div>

              {/* Spreadsheet Switcher Trigger */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    showSettings 
                      ? 'bg-slate-800 border-slate-800 text-white shadow-sm' 
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Settings className={`w-3.5 h-3.5 ${showSettings ? 'animate-spin-slow' : ''}`} />
                  <span>{t.settings}</span>
                </button>
              </div>
            </div>
          )}

          {/* Collapsible Spreadsheet Configuration card */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-sm"
              >
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    {t.settings}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">{t.defaultSheetHint}</p>
                </div>
                <div className="p-5 flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                      {t.sheetIdLabel}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={spreadsheetId}
                        onChange={(e) => setSpreadsheetId(e.target.value)}
                        className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors pr-10"
                      />
                      <button 
                        onClick={copySheetId}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-200/50 rounded text-slate-400 hover:text-slate-600"
                        title="Copy Sheet ID"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {spreadsheetId !== DEFAULT_SPREADSHEET_ID && (
                      <button
                        onClick={() => setSpreadsheetId(DEFAULT_SPREADSHEET_ID)}
                        className="flex-1 sm:flex-none bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors border border-slate-200"
                      >
                        {t.resetDefault}
                      </button>
                    )}
                  </div>
                </div>
                {copyNotification && (
                  <div className="px-5 pb-3 text-xs text-emerald-600 font-medium animate-pulse">
                    ✓ {t.copySuccess}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Multi-role Layout Selector and Dashboards */}
          {role === 'selection' && (
            <div className="max-w-xl mx-auto w-full my-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xl p-8 text-center"
              >
                <h3 className="text-xl font-bold text-slate-900 mb-6 font-display flex items-center justify-center gap-2">
                  <Compass className="w-5 h-5 text-emerald-500" />
                  {t.homeTitle}
                </h3>
                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => setRole('employee')}
                    className="group flex items-center justify-between p-5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/60 rounded-2xl transition-all hover:scale-[1.01] hover:shadow-md cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-emerald-500 text-white p-3 rounded-xl shadow-md shadow-emerald-500/15">
                        <MapPin className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="block font-bold text-slate-900 text-sm sm:text-base">
                          {lang === 'am' ? '📍 እኔ ሰራተኛ ነኝ' : '📍 I am an Employee'}
                        </span>
                        <span className="block text-xs text-slate-500 mt-0.5">
                          {lang === 'am' ? 'አሁን ያሉበትን ቦታ በፍጥነት ያጋሩ' : 'Quickly share your current coordinates'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-emerald-500 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    onClick={() => {
                      setRole('admin');
                      loadHistory();
                    }}
                    className="group flex items-center justify-between p-5 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-2xl transition-all hover:scale-[1.01] hover:shadow-md cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-slate-800 text-white p-3 rounded-xl shadow-md shadow-slate-800/15">
                        <Compass className="w-6 h-6 animate-spin-slow" />
                      </div>
                      <div>
                        <span className="block font-bold text-slate-900 text-sm sm:text-base">
                          {lang === 'am' ? '🔒 እኔ አድሚን ነኝ' : '🔒 I am an Admin'}
                        </span>
                        <span className="block text-xs text-slate-500 mt-0.5">
                          {lang === 'am' ? 'የሰራተኞችን ቦታ በካርታ ላይ ይመልከቱ' : 'View shared workspace map and logs'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-600 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {role === 'employee' && (
            <div className="max-w-md mx-auto w-full my-6 flex flex-col gap-4">
              {/* Back to selection */}
              <button
                onClick={() => setRole('selection')}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 self-start"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                <span>{t.changeRole}</span>
              </button>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-4 left-4 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  {t.employeeViewTitle}
                </div>

                <h3 className="font-bold text-slate-900 text-lg mb-1 mt-6">
                  {t.employeeViewTitle}
                </h3>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed mb-6">
                  {t.employeeViewDesc}
                </p>

                {/* Pulsing Radar Rings under Locator Icon */}
                <div className="relative w-28 h-28 my-4 flex items-center justify-center">
                  <AnimatePresence>
                    {(sharingStatus === 'detecting' || sharingStatus === 'saving') && (
                      <>
                        <motion.div
                          key="ring-1"
                          initial={{ scale: 0.8, opacity: 0.5 }}
                          animate={{ scale: 2, opacity: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeOut' }}
                          className="absolute inset-0 bg-emerald-500/20 rounded-full"
                        />
                        <motion.div
                          key="ring-2"
                          initial={{ scale: 0.8, opacity: 0.4 }}
                          animate={{ scale: 1.6, opacity: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ repeat: Infinity, duration: 1.5, delay: 0.5, ease: 'easeOut' }}
                          className="absolute inset-0 bg-emerald-500/15 rounded-full"
                        />
                      </>
                    )}
                  </AnimatePresence>
                  
                  <div className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                    sharingStatus === 'success' 
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                      : sharingStatus === 'error'
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                      : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  }`}>
                    <MapPin className={`w-9 h-9 ${
                      sharingStatus === 'detecting' ? 'animate-bounce' : 
                      sharingStatus === 'saving' ? 'animate-pulse' : ''
                    }`} />
                  </div>
                </div>

                {/* Employee Name Input Field */}
                <div className="w-full text-left mb-6">
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                    {t.employeeNameLabel}
                  </label>
                  <input
                    type="text"
                    value={employeeName}
                    onChange={(e) => setEmployeeName(e.target.value)}
                    placeholder={t.employeeNamePlaceholder}
                    disabled={sharingStatus === 'detecting' || sharingStatus === 'saving'}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 rounded-xl px-4 py-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-semibold"
                  />
                </div>

                <h3 className="font-bold text-slate-900 text-base mb-1">
                  {sharingStatus === 'detecting' && t.detecting}
                  {sharingStatus === 'saving' && t.saving}
                  {sharingStatus === 'success' && t.shareSuccessHeading}
                  {sharingStatus === 'error' && (lang === 'am' ? 'ስህተት ገጥሟል' : 'Sharing Failed')}
                </h3>
                
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed mb-6">
                  {sharingStatus === 'success' ? t.successMsg : t.accuracyHint}
                </p>

                {sharingStatus === 'error' && (
                  <div className="flex flex-col gap-3 w-full bg-red-50/70 border border-red-100 p-4 rounded-2xl mb-6">
                    <p className="text-xs text-red-600 leading-relaxed font-semibold">
                      {t.errorMsg} {sharingError}
                    </p>
                    {String(sharingError).toLowerCase().includes('not found') && (
                      <button
                        onClick={handleCreateNewSpreadsheet}
                        disabled={isCreatingSheet}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-bold py-2.5 px-3 rounded-xl shadow-sm text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        {isCreatingSheet ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>{t.creatingSheet}</span>
                          </>
                        ) : (
                          <>
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            <span>{t.createSheetBtn}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}

                {/* Detected Coords panel */}
                {detectedCoords && (
                  <div className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 mb-6 grid grid-cols-3 gap-2 divide-x divide-slate-200/50 text-center">
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">{t.latLabel}</span>
                      <span className="text-xs font-mono font-medium text-slate-700">{detectedCoords.lat.toFixed(6)}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">{t.lonLabel}</span>
                      <span className="text-xs font-mono font-medium text-slate-700">{detectedCoords.lon.toFixed(6)}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">{t.accLabel}</span>
                      <span className="text-xs font-medium text-emerald-600">{detectedCoords.accuracy}m</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={triggerLocationShare}
                  disabled={sharingStatus === 'detecting' || sharingStatus === 'saving'}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-semibold py-3.5 px-6 rounded-xl shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  <Navigation className="w-4 h-4 text-white/90" />
                  <span>{t.shareBtn}</span>
                </button>
              </div>
            </div>
          )}

          {role === 'admin' && (
            <div className="flex flex-col gap-6">
              {/* Back to selection & real-time checking indicator */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <button
                  onClick={() => setRole('selection')}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 self-start"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  <span>{t.changeRole}</span>
                </button>

                <div className="flex items-center gap-3">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                  </span>
                  <span className="text-xs font-bold text-amber-600">
                    {records.length > 0 ? t.locationFound : t.adminWaitingMsg}
                  </span>
                </div>
              </div>

              {/* Copyable Employee Link */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="bg-emerald-500 text-white p-2.5 rounded-xl shadow-md shrink-0 mt-0.5">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-slate-900 text-sm">
                      {lang === 'am' ? 'የሰራተኞች መግቢያ ሊንክ' : 'Employee Location Link'}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 max-w-md leading-relaxed">
                      {lang === 'am' 
                        ? 'ይህንን ሊንክ ለሰራተኞችዎ ይላኩ። ሊንኩን ሲከፍቱት በራስ-ሰር ስልካቸው ሎኬሽን እንዲያጋራ ይጠይቃቸዋል::' 
                        : 'Send this link to your employees. Opening it will prompt them to share their location automatically.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white border border-emerald-200/60 p-1.5 rounded-xl self-stretch sm:self-center">
                  <span className="text-xs font-mono text-slate-600 truncate max-w-[180px] sm:max-w-[240px] px-2">
                    {`${window.location.origin}${window.location.pathname}?role=employee`}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?role=employee`);
                      setCopyLinkNotification(true);
                      setTimeout(() => setCopyLinkNotification(false), 2500);
                    }}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-3.5 rounded-lg font-bold transition-all text-xs shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copyLinkNotification ? (lang === 'am' ? 'ተቀድቷል!' : 'Copied!') : (lang === 'am' ? 'ቅዳ' : 'Copy')}</span>
                  </button>
                </div>
              </div>

              {/* Quick Tab Select for mobile */}
              <div className="sm:hidden flex bg-slate-200/60 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab('share')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-lg transition-all ${
                    activeTab === 'share' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>{t.historyTitle}</span>
                </button>
                <button
                  onClick={() => setActiveTab('viewer')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-lg transition-all ${
                    activeTab === 'viewer' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  <span>{t.mapCardTitle}</span>
                </button>
              </div>

              {/* Desktop Dual Column & Mobile Tab view */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* Left Column - History list */}
                <div className={`lg:col-span-5 flex flex-col gap-6 ${activeTab !== 'share' ? 'hidden sm:flex' : ''}`}>
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex-1 flex flex-col min-h-[420px]">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <History className="w-4 h-4 text-slate-500" />
                        {t.historyTitle}
                        {records.length > 0 && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-600">
                            {records.length}
                          </span>
                        )}
                      </h4>

                      <div className="flex items-center gap-2">
                        {/* Auto-Refresh Toggle */}
                        <label className="hidden sm:flex items-center gap-1.5 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                          />
                          <span className="text-[10px] text-slate-500 font-medium">{t.autoRefresh}</span>
                        </label>

                        <button
                          onClick={() => loadHistory()}
                          disabled={fetching}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 disabled:opacity-50 transition-colors"
                          title={t.refreshBtn}
                        >
                          <RefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {fetching && records.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-12">
                        <RefreshCw className="w-6 h-6 text-emerald-500 animate-spin mb-2" />
                        <span className="text-xs text-slate-400">{t.refreshing}</span>
                      </div>
                    ) : fetchError ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50 border border-slate-200/80 rounded-2xl">
                        <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
                        <h5 className="font-bold text-slate-800 text-xs mb-1">
                          {String(fetchError).toLowerCase().includes('not found') ? t.sheetNotFoundTitle : (lang === 'am' ? 'የመረጃ ስህተት' : 'Error Fetching Data')}
                        </h5>
                        <p className="text-[11px] text-slate-500 mb-4 max-w-xs leading-relaxed">
                          {String(fetchError).toLowerCase().includes('not found') ? t.sheetNotFoundDesc : fetchError}
                        </p>
                        
                        <div className="flex flex-col gap-2 w-full">
                          {String(fetchError).toLowerCase().includes('not found') && (
                            <button
                              onClick={handleCreateNewSpreadsheet}
                              disabled={isCreatingSheet}
                              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                            >
                              {isCreatingSheet ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>{t.creatingSheet}</span>
                                </>
                              ) : (
                                <>
                                  <FileSpreadsheet className="w-3.5 h-3.5" />
                                  <span>{t.createSheetBtn}</span>
                                </>
                              )}
                            </button>
                          )}
                          
                          <button 
                            onClick={() => loadHistory()} 
                            className="w-full text-xs bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 py-2.5 px-4 rounded-xl font-medium transition-colors"
                          >
                            {t.refreshBtn}
                          </button>
                        </div>
                      </div>
                    ) : records.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-slate-400">
                        <MapPin className="w-8 h-8 mb-2 text-slate-300" />
                        <p className="text-xs">{t.noHistory}</p>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-[420px] pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                        <p className="text-[10px] text-slate-400 font-medium mb-1 px-1">
                          {t.selectRowHint}
                        </p>
                        {records.map((record, index) => {
                          const isSelected = selectedLocation?.timestamp === record.timestamp;
                          const isLatest = index === records.length - 1;
                          return (
                            <div
                              key={index}
                              onClick={() => setSelectedLocation(record)}
                              className={`group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer text-left ${
                                isSelected 
                                  ? 'bg-emerald-50/80 border-emerald-200 hover:bg-emerald-50' 
                                  : 'bg-white hover:bg-slate-50 border-slate-200/60'
                              }`}
                            >
                              <div className="flex items-start gap-2.5 min-w-0">
                                <div className={`mt-0.5 p-1 rounded-lg ${
                                  isLatest ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                }`}>
                                  <MapPin className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <span className="block text-xs font-semibold text-slate-800 flex items-center gap-1.5 flex-wrap">
                                    {isLatest && (
                                      <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold px-1 rounded uppercase">
                                        {t.latestLocation}
                                      </span>
                                    )}
                                    {record.name && (
                                      <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold px-1.5 py-0.5 rounded">
                                        👤 {record.name}
                                      </span>
                                    )}
                                    <span className="font-mono text-slate-600">
                                      {record.lat.toFixed(5)}, {record.lon.toFixed(5)}
                                    </span>
                                  </span>
                                  <span className="block text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5" />
                                    {record.timestamp}
                                  </span>
                                </div>
                              </div>
                              <ChevronRight className={`w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors ${
                                isSelected ? 'text-emerald-500 group-hover:text-emerald-600' : ''
                              }`} />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Map Visualization */}
                <div className={`lg:col-span-7 flex flex-col gap-6 ${activeTab !== 'viewer' ? 'hidden sm:flex' : ''}`}>
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1 min-h-[500px]">
                    <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="bg-emerald-50 text-emerald-600 p-1.5 rounded-lg">
                          <MapIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{t.mapCardTitle}</h4>
                          {selectedLocation && (
                            <p className="text-[10px] text-slate-500 mt-0.5 font-medium flex items-center gap-1.5 flex-wrap">
                              <Compass className="w-3 h-3 text-emerald-500" />
                              {selectedLocation.name && (
                                <span className="text-[9px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded">
                                  👤 {selectedLocation.name}
                                </span>
                              )}
                              <span>{selectedLocation.lat.toFixed(5)}, {selectedLocation.lon.toFixed(5)} ({selectedLocation.timestamp})</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {hasValidKey && (
                        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                          <button
                            onClick={() => setUseFallbackMap(false)}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-colors ${
                              !useFallbackMap ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            Google Map
                          </button>
                          <button
                            onClick={() => setUseFallbackMap(true)}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-colors ${
                              useFallbackMap ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            Embed Fallback
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="relative flex-1 bg-slate-100 min-h-[400px]">
                      {selectedLocation ? (
                        useFallbackMap ? (
                          <iframe
                            title="Fallback Map Location"
                            src={`https://maps.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lon}(${encodeURIComponent(selectedLocation.name || 'Admin')})&hl=am&z=15&output=embed`}
                            className="w-full h-full border-0 absolute inset-0"
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <APIProvider apiKey={API_KEY} version="weekly">
                            <Map
                              defaultCenter={{ lat: selectedLocation.lat, lng: selectedLocation.lon }}
                              center={{ lat: selectedLocation.lat, lng: selectedLocation.lon }}
                              defaultZoom={15}
                              zoom={15}
                              mapId="FAST_LOC_MAP"
                              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                              style={{ width: '100%', height: '100%' }}
                            >
                              <AdvancedMarker 
                                position={{ lat: selectedLocation.lat, lng: selectedLocation.lon }}
                                title={selectedLocation.name || 'Admin'}
                              >
                                <Pin background="#10b981" glyphColor="#ffffff" borderColor="#047857" />
                              </AdvancedMarker>
                              {records.map((r, idx) => {
                                if (r.timestamp === selectedLocation.timestamp) return null;
                                return (
                                  <AdvancedMarker 
                                    key={idx} 
                                    position={{ lat: r.lat, lng: r.lon }}
                                    onClick={() => setSelectedLocation(r)}
                                  >
                                    <div className="w-2.5 h-2.5 bg-emerald-500 border border-white rounded-full shadow cursor-pointer transform hover:scale-125 transition-transform" />
                                  </AdvancedMarker>
                                );
                              })}
                            </Map>
                          </APIProvider>
                        )
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                          <Compass className="w-12 h-12 mb-3 text-slate-300 animate-spin-slow" />
                          <p className="text-sm font-semibold">{t.selectRowHint}</p>
                        </div>
                      )}
                    </div>

                    {!hasValidKey && (
                      <div className="bg-slate-50 border-t border-slate-200 p-4">
                        <div className="flex gap-3">
                          <HelpCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                          <div className="text-left">
                            <h5 className="text-xs font-bold text-slate-800">{t.noMapKeyTitle}</h5>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                              {t.noMapKeySubtitle}
                            </p>
                            <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-slate-600 font-medium">
                              <div className="bg-white border border-slate-200 rounded p-1.5">
                                <span className="font-bold text-emerald-600 block mb-0.5">1. Get a Key:</span>
                                <a 
                                  href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-emerald-600 underline font-semibold flex items-center gap-0.5"
                                >
                                  Google Cloud Console <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              </div>
                              <div className="bg-white border border-slate-200 rounded p-1.5">
                                <span className="font-bold text-emerald-600 block mb-0.5">2. Set as Secret:</span>
                                <span>Add <code>GOOGLE_MAPS_PLATFORM_KEY</code> under ⚙️ Settings → Secrets.</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
              </div>
            </div>
          )}
        </main>
      )}

      {/* Footer copyright */}
      <footer className="mt-auto py-6 border-t border-slate-200/60 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 {t.title} — {lang === 'am' ? 'የቦታ ማጋሪያ ሺት መዝገብ' : 'Durable Google Sheets Location Repository'}</p>
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-300">|</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Google Sheets API {t.activeStatus}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
