// ============================================================
// NetForge — Auth Context
// Firebase Anonymous Auth with UID persistence via Capacitor Preferences
// ============================================================

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { Preferences } from "@capacitor/preferences";
import { Capacitor } from "@capacitor/core";
import { Purchases } from "@revenuecat/purchases-capacitor";
import { auth } from "../config/firebase";
import {
  setSyncUid,
  pullCloudProgress,
  CLOUD_PULL_EVENT,
} from "../services/sync";

interface AuthContextType {
  uid: string | null;
  isAuthReady: boolean;
}

const AuthContext = createContext<AuthContextType>({
  uid: null,
  isAuthReady: false,
});

const UID_STORAGE_KEY = "netforge_firebase_uid";

async function getStoredUid(): Promise<string | null> {
  const { value } = await Preferences.get({ key: UID_STORAGE_KEY });
  return value;
}

async function storeUid(uid: string): Promise<void> {
  await Preferences.set({ key: UID_STORAGE_KEY, value: uid });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [uid, setUid] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const currentUid = user.uid;
          setUid(currentUid);

          const storedUid = await getStoredUid();
          if (storedUid && storedUid !== currentUid) {
            console.warn(
              `[NetForge] UID changed: stored=${storedUid}, current=${currentUid}. ` +
                `User may have lost progress. Previous purchases may need restoration.`
            );
          }

          await storeUid(currentUid);

          // Wire Firebase UID into RevenueCat. logIn aliases any prior
          // anonymous RC user to this UID, so entitlements follow the
          // user across reinstalls/devices. Safe to call every auth
          // event — RC no-ops when the UID is already current.
          if (Capacitor.isNativePlatform()) {
            try {
              await Purchases.logIn({ appUserID: currentUid });
            } catch (rcError) {
              console.error("[NetForge] Purchases.logIn failed:", rcError);
            }
          }

          // Cloud sync: register the UID, then pull any existing cloud
          // progress. useProgress merges it via the CLOUD_PULL_EVENT.
          setSyncUid(currentUid);
          pullCloudProgress(currentUid).then((remote) => {
            if (remote) {
              window.dispatchEvent(
                new CustomEvent(CLOUD_PULL_EVENT, { detail: remote })
              );
            }
          });
        } catch (error) {
          console.error("[NetForge] UID persistence failed:", error);
        } finally {
          setIsAuthReady(true);
        }
      } else {
        try {
          await signInAnonymously(auth);
          return;
        } catch (error) {
          console.error("[NetForge] Anonymous sign-in failed:", error);
          setUid(null);
          setIsAuthReady(true);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ uid, isAuthReady }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}
