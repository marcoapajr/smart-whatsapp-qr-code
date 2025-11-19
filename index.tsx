
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Phone,
  MessageSquare,
  Link as LinkIcon,
  Copy,
  ExternalLink,
  Share2,
  Trash2,
  RefreshCw,
  Check,
  History,
  Smartphone,
  Send,
  Mail,
  Facebook,
  Twitter,
  AlertCircle,
  ChevronDown,
  Globe,
  Search,
  Moon,
  Sun
} from 'lucide-react';

// --- Types ---
interface HistoryItem {
  id: string;
  phoneNumber: string; // Stored as full number for display/link
  message: string;
  link: string;
  timestamp: number;
}

interface Country {
  code: string;
  name: string;
  dial_code: string;
  mask: string | null;
}

// --- Constants ---
const COUNTRIES: Country[] = [
  { code: 'US', name: 'United States', dial_code: '+1', mask: '(###) ###-####' },
  { code: 'BR', name: 'Brazil', dial_code: '+55', mask: '(##) #####-####' },
  { code: 'GB', name: 'United Kingdom', dial_code: '+44', mask: '#### ######', },
  { code: 'IN', name: 'India', dial_code: '+91', mask: '#####-#####' },
  { code: 'DE', name: 'Germany', dial_code: '+49', mask: '#### #######' },
  { code: 'ES', name: 'Spain', dial_code: '+34', mask: '### ### ###' },
  { code: 'FR', name: 'France', dial_code: '+33', mask: '# ## ## ## ##' },
  { code: 'IT', name: 'Italy', dial_code: '+39', mask: '### #######' },
  { code: 'PT', name: 'Portugal', dial_code: '+351', mask: '### ### ###' },
  { code: 'CA', name: 'Canada', dial_code: '+1', mask: '(###) ###-####' },
  { code: 'AU', name: 'Australia', dial_code: '+61', mask: '#### ### ###' },
  { code: 'RU', name: 'Russia', dial_code: '+7', mask: '(###) ###-##-##' },
  { code: 'JP', name: 'Japan', dial_code: '+81', mask: '##-####-####' },
  { code: 'MX', name: 'Mexico', dial_code: '+52', mask: '(###) ### ####' },
  { code: 'ZA', name: 'South Africa', dial_code: '+27', mask: '## ### ####' },
  { code: 'CN', name: 'China', dial_code: '+86', mask: '### #### ####' },
  { code: 'AR', name: 'Argentina', dial_code: '+54', mask: '### ### ####' },
  { code: 'CL', name: 'Chile', dial_code: '+56', mask: '# #### ####' },
  { code: 'CO', name: 'Colombia', dial_code: '+57', mask: '### ### ####' },
  { code: 'PE', name: 'Peru', dial_code: '+51', mask: '### ### ###' },
];

const HISTORY_KEY = 'wa_link_gen_history';
const THEME_KEY = 'wa_link_gen_theme';

// --- Helper Functions ---

const formatPhoneNumber = (value: string, mask: string | null): string => {
  if (!mask) return value;

  const digits = value.replace(/\D/g, '');
  let formatted = '';
  let digitIndex = 0;

  for (let i = 0; i < mask.length && digitIndex < digits.length; i++) {
    if (mask[i] === '#') {
      formatted += digits[digitIndex];
      digitIndex++;
    } else {
      formatted += mask[i];
    }
  }
  return formatted;
};

const stripFormatting = (value: string): string => {
  return value.replace(/\D/g, '');
};

// --- Ad Component ---
const AdUnit = () => {
  useEffect(() => {
    try {
        // Safely push to adsbygoogle
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (e) {
        console.error("AdSense error:", e);
    }
  }, []);

  return (
    <div className="w-full my-8 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl py-4 min-h-[120px] transition-colors duration-300">
       <span className="text-[10px] text-slate-400 uppercase tracking-widest mb-2">Advertisement</span>
       
       {/* 
          TODO: 
          1. Replace data-ad-client with your 'ca-pub-XXXXXXXXXXXXXXXX' 
          2. Replace data-ad-slot with your Ad Unit ID (e.g., '1234567890') 
       */}
       <ins className="adsbygoogle block w-full text-center"
            style={{ display: 'block' }}
            data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" 
            data-ad-slot="1234567890"
            data-ad-format="auto"
            data-full-width-responsive="true"></ins>
    </div>
  );
};

// --- Main App Component ---

const App = () => {
  // --- State ---
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('US');
  const [localNumber, setLocalNumber] = useState('');
  const [message, setMessage] = useState('');
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [copied, setCopied] = useState(false);

  // Custom Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // --- Derived State ---
  const selectedCountry = useMemo(() => 
    COUNTRIES.find(c => c.code === selectedCountryCode) || COUNTRIES[0], 
  [selectedCountryCode]);

  const filteredCountries = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase();
    return COUNTRIES.filter(c => 
      c.name.toLowerCase().includes(lowerQuery) || 
      c.dial_code.includes(lowerQuery) ||
      c.code.toLowerCase().includes(lowerQuery)
    );
  }, [searchQuery]);

  // --- Effects ---

  // Handle Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(THEME_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(THEME_KEY, 'light');
    }
  }, [darkMode]);

  // Load history on mount
  useEffect(() => {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Auto-format number when country changes
  useEffect(() => {
      const clean = stripFormatting(localNumber);
      if (clean) {
          const formatted = formatPhoneNumber(clean, selectedCountry.mask);
          setLocalNumber(formatted);
      }
  }, [selectedCountryCode]);

  // Click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setSearchQuery(''); // Reset search on close
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // --- Handlers ---

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const handleCountryChange = (code: string) => {
    setSelectedCountryCode(code);
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  const handleLocalNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow user to delete everything
    if (val === '') {
        setLocalNumber('');
        return;
    }
    
    // If the user is typing digits, enforce formatting
    // If deleting, we might need to be looser, but simple re-formatting usually works well enough for this scope
    const clean = stripFormatting(val);
    
    // Prevent excessive length based on mask count (optional but good UX)
    const maxDigits = selectedCountry.mask ? (selectedCountry.mask.match(/#/g) || []).length : 15;
    if (clean.length > maxDigits) return;

    const formatted = formatPhoneNumber(clean, selectedCountry.mask);
    setLocalNumber(formatted);
  };

  const generateLink = () => {
    const cleanNumber = stripFormatting(localNumber);
    
    if (cleanNumber.length < 3) {
      alert("Please enter a valid phone number.");
      return;
    }

    // Construct full number: Country Dial Code + Local Number (stripped)
    // Remove the '+' from dial code for the link format
    const dialCodeClean = selectedCountry.dial_code.replace('+', '');
    const fullNumber = `${dialCodeClean}${cleanNumber}`;

    const encodedMessage = encodeURIComponent(message);
    const link = `https://wa.me/${fullNumber}?text=${encodedMessage}`;

    setGeneratedLink(link);
    
    // Generate QR Code URL (using quickchart.io or similar for client-side simplicity without heavy libs)
    // We can use a reliable public API for the QR code
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}&bgcolor=ffffff`;
    setQrCodeUrl(qrUrl);

    addToHistory(selectedCountry.dial_code + ' ' + localNumber, message, link);
  };

  const addToHistory = (phoneDisplay: string, msg: string, link: string) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      phoneNumber: phoneDisplay,
      message: msg,
      link,
      timestamp: Date.now(),
    };

    const updated = [newItem, ...history].slice(0, 10); // Keep max 10
    setHistory(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareLink = async () => {
    if (navigator.share && generatedLink) {
      try {
        await navigator.share({
          title: 'WhatsApp Link',
          text: 'Check out this WhatsApp link!',
          url: generatedLink,
        });
      } catch (error) {
        console.log('Error sharing', error);
      }
    } else {
      alert("Web Share API not supported on this browser. Use the buttons below.");
    }
  };

  const handleRestore = (item: HistoryItem) => {
      setGeneratedLink(item.link);
      setMessage(item.message);
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(item.link)}&bgcolor=ffffff`);
      
      // Attempt to parse country and local number back
      // This is a best-guess since we stored formatted string. 
      // Ideally we store parts, but for simplicity we stored display string.
      // Let's just reset the input to what we see if it matches known codes
      
      // Simple heuristic: Check if phone starts with a known dial code
      const cleanFull = item.phoneNumber.replace(/[^0-9+]/g, '');
      // Try to match dial codes
      const foundCountry = COUNTRIES.find(c => cleanFull.startsWith(c.dial_code));
      if (foundCountry) {
          setSelectedCountryCode(foundCountry.code);
          // formatting is tricky, let's just put the raw digits for now or try to re-format
          const rawLocal = cleanFull.substring(foundCountry.dial_code.length);
          const formatted = formatPhoneNumber(rawLocal, foundCountry.mask);
          setLocalNumber(formatted);
      }
  };

  // --- Render ---

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pb-12 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" 
              alt="WhatsApp Logo" 
              className="w-9 h-9" 
            />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Smart Whatsapp QR Code</h1>
          </div>
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            aria-label="Toggle Dark Mode"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Input Section */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors duration-300">
              <div className="flex items-center space-x-2 mb-6">
                <Smartphone className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Details</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Phone Number (with country code)
                  </label>
                  <div className="flex rounded-lg shadow-sm ring-1 ring-inset ring-slate-200 dark:ring-slate-700 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 bg-white dark:bg-slate-950 relative transition-all">
                    {/* Custom Country Selector with Search */}
                    <div className="relative" ref={dropdownRef}>
                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center pl-3 pr-2 py-3 bg-slate-50 dark:bg-slate-800 rounded-l-lg border-r border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors h-full focus:outline-none"
                      >
                        <img 
                            src={`https://flagcdn.com/w40/${selectedCountry.code.toLowerCase()}.png`}
                            alt={selectedCountry.name}
                            className="w-6 h-4 object-cover rounded-sm shadow-sm"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-2">{selectedCountry.dial_code}</span>
                        <ChevronDown className="h-4 w-4 text-slate-400 ml-1" />
                      </button>

                      {isDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 flex flex-col overflow-hidden max-h-80 animate-fade-in">
                           {/* Search Input */}
                           <div className="p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                              <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400"/>
                                <input 
                                   autoFocus
                                   type="text" 
                                   placeholder="Search country or code..." 
                                   className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                                   value={searchQuery}
                                   onChange={(e) => setSearchQuery(e.target.value)}
                                   onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                           </div>
                           {/* List */}
                           <div className="overflow-y-auto flex-1">
                              {filteredCountries.length > 0 ? (
                                filteredCountries.map((country) => (
                                   <button 
                                     key={country.code} 
                                     onClick={() => handleCountryChange(country.code)}
                                     className="w-full text-left flex items-center px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm transition-colors border-b border-slate-50 dark:border-slate-700 last:border-0"
                                   >
                                      <img 
                                          src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
                                          alt={country.name}
                                          className="w-6 h-4 object-cover rounded-sm mr-3 shadow-sm"
                                      />
                                      <span className="flex-1 text-slate-700 dark:text-slate-200 font-medium truncate">{country.name}</span>
                                      <span className="text-slate-400 font-mono text-xs ml-2 bg-slate-100 dark:bg-slate-800 dark:text-slate-500 px-1.5 py-0.5 rounded">{country.dial_code}</span>
                                   </button>
                                ))
                              ) : (
                                <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                                   No countries found.
                                </div>
                              )}
                           </div>
                        </div>
                      )}
                    </div>
                    
                    <input
                        type="tel"
                        value={localNumber}
                        onChange={handleLocalNumberChange}
                        placeholder={selectedCountry.mask ? selectedCountry.mask.replace(/#/g, '5') : '99999 9999'}
                        className="block w-full border-0 bg-transparent py-3 pl-3 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-0 sm:text-sm sm:leading-6 font-mono"
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                      {selectedCountry.name} format: {selectedCountry.mask || 'Generic'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Pre-filled Message
                  </label>
                  <div className="relative">
                    <textarea
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="block w-full rounded-lg border-0 py-3 pl-3 pr-3 text-slate-900 dark:text-white bg-white dark:bg-slate-950 shadow-sm ring-1 ring-inset ring-slate-200 dark:ring-slate-700 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 resize-none transition-all"
                      placeholder="Hello, I'm interested in your services..."
                    />
                    <div className="absolute top-3 right-3">
                        <MessageSquare className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                    </div>
                  </div>
                </div>

                <button
                  onClick={generateLink}
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white font-semibold py-3.5 px-4 rounded-xl shadow-md shadow-blue-500/20 transition-all duration-200 active:scale-[0.99]"
                >
                  <LinkIcon className="w-5 h-5" />
                  <span>Generate Link</span>
                </button>
              </div>
            </div>
          </div>

          {/* Output Section */}
          <div className="space-y-6">
            {generatedLink ? (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 animate-fade-in transition-colors duration-300">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Your Link is Ready!</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Scan the QR code or copy the link below</p>
                </div>

                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                     {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 object-contain" />}
                  </div>
                </div>

                <div className="space-y-3">
                   <div className="flex items-center space-x-2">
                      <input 
                        readOnly 
                        value={generatedLink} 
                        className="block w-full rounded-lg border-0 py-2.5 pl-3 pr-10 text-slate-500 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 shadow-sm ring-1 ring-inset ring-slate-200 dark:ring-slate-700 sm:text-sm sm:leading-6 truncate transition-colors"
                      />
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => copyToClipboard(generatedLink)}
                        className="flex items-center justify-center space-x-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium py-2.5 px-4 rounded-lg transition-colors"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                      <a
                        href={generatedLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center space-x-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium py-2.5 px-4 rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Open</span>
                      </a>
                   </div>

                   <button
                      onClick={shareLink}
                      className="w-full flex items-center justify-center space-x-2 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium py-2.5 px-4 rounded-lg transition-colors"
                   >
                      <Share2 className="w-4 h-4" />
                      <span>Share Link</span>
                   </button>

                   {/* Social Share Icons */}
                   <div className="flex justify-center space-x-4 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                      <a 
                        href={`https://wa.me/?text=${encodeURIComponent(generatedLink)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                      >
                        <Phone className="w-5 h-5" />
                      </a>
                      <a 
                         href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(generatedLink)}`}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                      >
                        <Facebook className="w-5 h-5" />
                      </a>
                      <a 
                         href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(generatedLink)}&text=Check%20this%20out`}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="p-2 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-500 dark:text-sky-400 hover:bg-sky-200 dark:hover:bg-sky-900/50 transition-colors"
                      >
                        <Twitter className="w-5 h-5" />
                      </a>
                      <a 
                         href={`mailto:?subject=WhatsApp Link&body=${encodeURIComponent(generatedLink)}`}
                         className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Mail className="w-5 h-5" />
                      </a>
                   </div>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 dark:text-slate-500 transition-colors duration-300">
                 <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <LinkIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                 </div>
                 <p className="font-medium">Fill in the details to generate your link</p>
              </div>
            )}
          </div>
        </div>

        {/* Advertisement Space */}
        <AdUnit />

        {/* History Section */}
        {history.length > 0 && (
          <div className="mt-4 animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                 <History className="w-5 h-5 text-slate-400" />
                 <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Links</h2>
              </div>
              <button 
                onClick={clearHistory}
                className="text-sm text-red-500 hover:text-red-600 flex items-center space-x-1"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear History</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map((item) => (
                <div key={item.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all duration-300">
                  <div className="flex justify-between items-start mb-3">
                    <div className="font-mono text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded">
                      {item.phoneNumber}
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 h-10">
                    {item.message || <span className="italic text-slate-300 dark:text-slate-600">No message</span>}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-800">
                    <button 
                      onClick={() => handleRestore(item)}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium flex items-center"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" /> Use Again
                    </button>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => copyToClipboard(item.link)}
                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                        title="Copy Link"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <a 
                        href={item.link}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-green-600 dark:hover:text-green-400 rounded-md hover:bg-green-50 dark:hover:bg-slate-800 transition-colors"
                        title="Open WhatsApp"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="mt-12 border-t border-slate-200 dark:border-slate-800 py-8 transition-colors duration-300">
         <div className="text-center text-slate-400 dark:text-slate-500 text-sm">
            <p className="flex items-center justify-center gap-1">
              Built with <span className="text-red-400">❤️</span> using Gemini + Google AI Studio
            </p>
         </div>
      </footer>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
