import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Router,
  Target,
  Infinity as InfinityIcon,
  CreditCard,
  Lock,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { labCatalog } from "../data/catalog";
import { useAuth } from "../contexts/AuthContext";
import { usePurchase } from "../hooks/usePurchase";
import { usePremiumStatus } from "../hooks/usePremiumStatus";

function goBack(navigate: ReturnType<typeof useNavigate>) {
  if (window.history.state?.idx > 0) {
    navigate(-1);
  } else {
    navigate("/");
  }
}

export default function UpgradeScreen() {
  const navigate = useNavigate();
  const { uid } = useAuth();
  const { purchase, restore, isPurchasing, isRestoring } = usePurchase(uid);
  const { isPremium, refreshPremiumStatus } = usePremiumStatus(uid);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const premiumLabs = labCatalog.filter(
    (l) => l.accessLevel === "premium" && l.status === "published"
  );
  const premiumCount = premiumLabs.length;

  const valueProps = [
    {
      icon: Router,
      text: `${premiumCount} premium networking simulations, all unlocked`,
    },
    {
      icon: Target,
      text: "Advanced routing, wireless, security, and troubleshooting scenarios",
    },
    {
      icon: InfinityIcon,
      text: "New labs included as they're released",
    },
    {
      icon: CreditCard,
      text: "Monthly or yearly plans — cancel anytime",
    },
  ];

  const handlePurchase = async () => {
    setErrorMsg(null);
    const result = await purchase();

    if (result.success) {
      await refreshPremiumStatus();
      setPurchaseSuccess(true);
    } else if (result.error === "cancelled") {
      // User cancelled
    } else if (result.error === "network") {
      setErrorMsg("Purchase failed — check your connection and try again.");
    } else {
      setErrorMsg("Something went wrong. Please try again.");
    }
  };

  const handleRestore = async () => {
    setErrorMsg(null);
    const result = await restore();

    if (result.success) {
      await refreshPremiumStatus();
      setPurchaseSuccess(true);
    } else if (result.error === "network") {
      setErrorMsg("Restore failed — check your connection and try again.");
    } else {
      setErrorMsg("No previous purchase found.");
    }
  };

  const isBusy = isPurchasing || isRestoring;

  if (isPremium || purchaseSuccess) {
    return (
      <div className="min-h-screen bg-slate-900">
        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <button
              onClick={() => goBack(navigate)}
              aria-label="Go back"
              className="min-w-[48px] min-h-[48px] flex items-center justify-center -ml-2"
            >
              <ArrowLeft size={20} className="text-slate-400" />
            </button>
            <h1 className="text-sm font-semibold text-white">
              Forge Labs Pro
            </h1>
          </div>
        </div>
        <div className="max-w-lg mx-auto p-4 pt-16 text-center">
          <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">
            You're a Forge Labs Pro Member!
          </h2>
          <p className="text-sm text-slate-400 mb-8">
            All premium labs are unlocked. Thank you for your support.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 rounded-xl bg-emerald-500 text-white font-semibold text-sm"
          >
            Start Exploring
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="min-w-[48px] min-h-[48px] flex items-center justify-center -ml-2"
          >
            <ArrowLeft size={20} className="text-slate-400" />
          </button>
          <h1 className="text-sm font-semibold text-white">
            Forge Labs Pro
          </h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 pb-12">
        <div className="text-center mb-8 pt-4">
          <h2 className="text-2xl font-bold text-white mb-2">
            Join Forge Labs Pro
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">
            Unlock all premium networking simulations with a monthly or yearly
            subscription — including new AI-era labs as they're released.
          </p>
        </div>

        <div className="space-y-3 mb-8">
          {valueProps.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="flex items-center gap-3 bg-slate-800 rounded-xl p-3"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-emerald-400" />
                </div>
                <span className="text-sm text-slate-300">{item.text}</span>
              </div>
            );
          })}
        </div>

        <div className="bg-slate-800 border-2 border-emerald-500 rounded-xl p-6 text-center mb-6 relative">
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-500 text-[9px] font-bold text-white whitespace-nowrap">
            Forge Labs Pro
          </div>
          <div className="text-4xl font-bold text-white mt-2">Full Access</div>
          <div className="text-xs text-emerald-300 mt-1">Monthly & yearly plans · cancel anytime</div>
        </div>

        {errorMsg && (
          <p className="text-xs text-red-400 text-center mb-3">{errorMsg}</p>
        )}

        <button
          onClick={handlePurchase}
          disabled={isBusy}
          className="w-full py-3.5 rounded-xl bg-emerald-500 text-white font-semibold text-base mb-2 active:bg-emerald-600 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isPurchasing ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Processing...
            </>
          ) : (
            "Subscribe to Forge Labs Pro"
          )}
        </button>
        <p className="text-[10px] text-slate-500 text-center mb-4">
          Secured by Google Play. Manage or cancel anytime in your Google Play subscriptions.
        </p>

        <button
          onClick={handleRestore}
          disabled={isBusy}
          className="w-full text-center text-xs text-slate-500 py-2 min-h-[48px] disabled:opacity-40 flex items-center justify-center gap-1"
        >
          {isRestoring ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Restoring...
            </>
          ) : (
            "Restore Purchase"
          )}
        </button>

        {premiumLabs.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
              What You'll Unlock
            </h3>
            <div className="space-y-2">
              {premiumLabs.map((lab) => {
                const tierColor =
                  lab.difficulty === "easy"
                    ? "bg-green-500/15 text-green-400"
                    : lab.difficulty === "moderate"
                    ? "bg-blue-500/15 text-blue-400"
                    : "bg-purple-500/15 text-purple-400";

                return (
                  <div
                    key={lab.id}
                    className="bg-slate-800 rounded-xl p-3 flex items-start gap-3"
                  >
                    <Lock
                      size={14}
                      className="text-slate-500 mt-0.5 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {lab.title}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${tierColor}`}
                        >
                          {lab.difficulty}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {lab.description.split(".")[0]}.
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
