import { useState, useEffect } from "react";
import { ScreenType, UserSession, ColorThemeType } from "./types";
import LandingView from "./components/LandingView";
import LoginView from "./components/LoginView";
import SignupView from "./components/SignupView";
import DashboardView from "./components/DashboardView";
import OTPVerifyView from "./components/OTPVerifyView";
import ForgotPasswordView from "./components/ForgotPasswordView";
import AdminDashboard from "./components/AdminDashboard";
import PendingView from "./components/PendingView";
import CookieConsent from "./components/CookieConsent";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import { PlatformProvider } from "./context/PlatformContext";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";

const THEME_COOKIE = "BetaCapitalInvestment_theme";

function getThemeCookie(): ColorThemeType {
  try {
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${THEME_COOKIE}=([^;]*)`),
    );
    const val = match ? decodeURIComponent(match[1]) : null;
    const valid: ColorThemeType[] = [
      "sovereign",
      "royal-marine",
      "emerald-reserve",
      "emperor-purple",
    ];
    return (
      valid.includes(val as ColorThemeType) ? val : "sovereign"
    ) as ColorThemeType;
  } catch {
    return "sovereign";
  }
}

function setThemeCookie(theme: ColorThemeType) {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${THEME_COOKIE}=${theme};max-age=${maxAge};path=/;SameSite=Lax`;
}

function applyTheme(theme: string) {
  const themes = [
    "theme-sovereign",
    "theme-emperor-purple",
    "theme-emerald-reserve",
    "theme-royal-marine",
  ];
  document.documentElement.classList.remove(...themes);
  document.documentElement.classList.add(`theme-${theme || "sovereign"}`);
}

const DEFAULT_SESSION: UserSession = {
  fullName: "",
  email: "",
  isLoggedIn: false,
  biometricEnabled: false,
  tier: "Bronze Ore",
  theme: getThemeCookie(),
};

applyTheme(DEFAULT_SESSION.theme);

function injectTawkTo() {
  const TAWK_PROPERTY_ID = "6a2abea9135ef41c3064d7ee";
  const TAWK_WIDGET_ID = "1jqrfhhj9";

  const w = window as unknown as Record<string, unknown>;
  w.Tawk_LoadStart = new Date();
  w.Tawk_API = w.Tawk_API ?? {};
  const api = w.Tawk_API as Record<string, unknown>;
  api.customStyle = { zIndex: 9990 };
  api.onLoad = function () {
    const tawk = w.Tawk_API as {
      setAttributes?: (attrs: Record<string, string>, cb: () => void) => void;
    };
    try {
      const style = document.createElement("style");
      style.textContent = `
        .tawk-min-container .tawk-button-circle { background-color: #F2CA50 !important; }
        .tawk-button-circle svg { fill: #0a0f14 !important; }
        .tawk-badge { background-color: #F2CA50 !important; color: #0a0f14 !important; }
      `;
      document.head.appendChild(style);
      tawk.setAttributes?.({ source: "Beta Capital Investment" }, () => {});
    } catch { /* */ }
  };

  const s = document.createElement("script");
  s.type = "text/javascript";
  s.async = true;
  s.src = `https://embed.tawk.to/${TAWK_PROPERTY_ID}/${TAWK_WIDGET_ID}`;
  s.charset = "UTF-8";
  s.setAttribute("crossorigin", "*");
  document.head.appendChild(s);
}

type SignupUser = {
  email: string;
  fullName: string;
  tier: string;
  theme: string;
  biometricEnabled: boolean;
  isAdmin?: boolean;
  emailVerified?: boolean;
};

function AppInner() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>("landing");
  const [session, setSession] = useState<UserSession>(DEFAULT_SESSION);
  const [authChecked, setAuthChecked] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [globalError, setGlobalError] = useState("");

  const { data: me, isLoading: meLoading } = useGetMe({
    query: { retry: false, queryKey: getGetMeQueryKey() },
  });

  useEffect(() => {
    applyTheme(session.theme);
    setThemeCookie(session.theme);
  }, [session.theme]);

  useEffect(() => {
    injectTawkTo();
  }, []);

  // Clean up any legacy OAuth URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("google_auth") || params.get("auth_error") || params.get("deposit")) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (meLoading) return;
    if (me) {
      const theme =
        (me.theme as ColorThemeType) || getThemeCookie() || "sovereign";
      setSession({
        fullName: me.fullName,
        email: me.email,
        isLoggedIn: true,
        biometricEnabled: me.biometricEnabled,
        tier: me.tier,
        theme,
        isAdmin: (me as { isAdmin?: boolean }).isAdmin,
        emailVerified: (me as { emailVerified?: boolean }).emailVerified,
        avatarUrl: (me as { avatarUrl?: string }).avatarUrl,
      });
      if (
        currentScreen === "landing" ||
        currentScreen === "login" ||
        currentScreen === "signup" ||
        currentScreen === "pending"
      ) {
        const isAdmin = (me as { isAdmin?: boolean }).isAdmin;
        setCurrentScreen(isAdmin ? "admin" : "dashboard");
      }
    }
    setAuthChecked(true);
  }, [me, meLoading]);

  const handleNavigate = (screen: ScreenType) => {
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };

  const handleUpdateTheme = (theme: ColorThemeType) => {
    setSession((prev) => ({ ...prev, theme }));
  };

  const handleUpdateSession = (updatedFields: Partial<UserSession>) => {
    setSession((prev) => ({ ...prev, ...updatedFields }));
  };

  const handleLoginSuccess = (user: {
    email: string;
    fullName: string;
    tier: string;
    theme: string;
    biometricEnabled: boolean;
    isAdmin?: boolean;
  }) => {
    const theme =
      (user.theme as ColorThemeType) || getThemeCookie() || "sovereign";
    setSession({
      fullName: user.fullName,
      email: user.email,
      isLoggedIn: true,
      biometricEnabled: user.biometricEnabled,
      tier: user.tier,
      theme,
      isAdmin: user.isAdmin,
    });
    handleNavigate(user.isAdmin ? "admin" : "dashboard");
  };

  const handleSignupSuccess = (emailOrUser: string | SignupUser | { pending: true; email: string }) => {
    if (typeof emailOrUser === "object" && "pending" in emailOrUser) {
      // New flow: account pending admin verification
      setPendingEmail(emailOrUser.email);
      handleNavigate("pending");
    } else if (typeof emailOrUser === "string") {
      setVerifyEmail(emailOrUser);
      handleNavigate("verify-email");
    } else {
      handleLoginSuccess(emailOrUser);
    }
  };

  const handleVerified = () => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((user) => {
        if (user?.email) {
          const theme = (user.theme as ColorThemeType) || "sovereign";
          setSession({
            fullName: user.fullName,
            email: user.email,
            isLoggedIn: true,
            biometricEnabled: user.biometricEnabled,
            tier: user.tier,
            theme,
            isAdmin: user.isAdmin,
            emailVerified: true,
          });
          handleNavigate(user.isAdmin ? "admin" : "dashboard");
        } else {
          handleNavigate("login");
        }
      })
      .catch(() => handleNavigate("login"));
  };

  const handleLogout = () => {
    setSession({ ...DEFAULT_SESSION, theme: session.theme });
    handleNavigate("landing");
  };

  if (meLoading && !authChecked) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-gold/30 border-t-brand-gold rounded-full animate-spin" />
      </div>
    );
  }

  const GlobalErrorBanner = globalError ? (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] max-w-md w-full px-4">
      <div className="bg-red-950/95 border border-red-500/50 text-red-200 font-sans text-xs px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 backdrop-blur-sm">
        <span className="shrink-0">⚠️</span>
        <span className="flex-1">{globalError}</span>
        <button
          onClick={() => setGlobalError("")}
          className="shrink-0 text-red-400 hover:text-red-200 ml-2 font-bold"
        >
          ✕
        </button>
      </div>
    </div>
  ) : null;

  switch (currentScreen) {
    case "landing":
      return (
        <>
          <LandingView
            onNavigate={handleNavigate}
            session={session}
            onLogout={handleLogout}
            onUpdateTheme={handleUpdateTheme}
          />
          <CookieConsent />
          {GlobalErrorBanner}
        </>
      );
    case "login":
      return (
        <>
          <LoginView
            onNavigate={handleNavigate}
            onLoginSuccess={handleLoginSuccess}
          />
          {GlobalErrorBanner}
        </>
      );
    case "signup":
      return (
        <>
          <SignupView
            onNavigate={handleNavigate}
            onSignupSuccess={handleSignupSuccess}
          />
          {GlobalErrorBanner}
        </>
      );
    case "pending":
      return (
        <PendingView
          onNavigate={handleNavigate}
          email={pendingEmail}
        />
      );
    case "verify-email":
      return (
        <OTPVerifyView
          onNavigate={handleNavigate}
          email={verifyEmail}
          onVerified={handleVerified}
        />
      );
    case "forgot-password":
      return <ForgotPasswordView onNavigate={handleNavigate} />;
    case "dashboard":
      if (!session.isLoggedIn)
        return (
          <LoginView
            onNavigate={handleNavigate}
            onLoginSuccess={handleLoginSuccess}
          />
        );
      return (
        <DashboardView
          onNavigate={handleNavigate}
          session={session}
          onLogout={handleLogout}
          onUpdateTheme={handleUpdateTheme}
          onUpdateSession={handleUpdateSession}
        />
      );
    case "admin":
      if (!session.isLoggedIn || !session.isAdmin)
        return (
          <LoginView
            onNavigate={handleNavigate}
            onLoginSuccess={handleLoginSuccess}
          />
        );
      return (
        <>
          <AdminDashboard
            onNavigate={handleNavigate}
            session={session}
            onLogout={handleLogout}
          />
          <CookieConsent />
        </>
      );
    default:
      return (
        <>
          <LandingView
            onNavigate={handleNavigate}
            session={session}
            onLogout={handleLogout}
            onUpdateTheme={handleUpdateTheme}
          />
          <CookieConsent />
        </>
      );
  }
}

export default function App() {
  return (
    <PlatformProvider>
      <AppInner />
      <PWAInstallPrompt variant="banner" />
    </PlatformProvider>
  );
}
