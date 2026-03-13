import { useEffect, useState, ReactNode, useMemo, useCallback } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Profile, UserRole, AuthContextType } from "@/types";
import { AuthContext } from "@/hooks/AuthContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const profileDoc = await getDoc(doc(db, "profiles", userId));
      const creditsDoc = await getDoc(doc(db, "user_credits", userId));

      if (profileDoc.exists()) {
        setProfile({
          ...profileDoc.data(),
          id: userId,
          credits: creditsDoc.exists() ? creditsDoc.data().balance : 0,
        } as Profile);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchRoles = async (userId: string) => {
    try {
      const q = query(
        collection(db, "user_roles"),
        where("user_id", "==", userId),
      );
      const querySnapshot = await getDocs(q);
      const rolesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRoles(rolesData as UserRole[]);
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Wait for both profile and roles before marking loading as done
        await Promise.all([
          fetchProfile(firebaseUser.uid),
          fetchRoles(firebaseUser.uid),
        ]);
      } else {
        setProfile(null);
        setRoles([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isFirebaseError = (error: unknown): error is { code: string } => {
    return typeof error === "object" && error !== null && "code" in error;
  };

  const sanitizeError = useCallback((error: unknown) => {
    let code = "unknown";

    if (isFirebaseError(error)) {
      code = error.code;
    } else if (error instanceof Error) {
      code = error.message;
    }

    switch (code) {
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Email ou senha incorretos. Verifique seus dados.";
      case "auth/email-already-in-use":
        return "Este email já está sendo utilizado.";
      case "auth/weak-password":
        return "A senha é muito fraca. Tente uma senha mais forte.";
      case "auth/invalid-email":
        return "O formato do email é inválido.";
      case "auth/too-many-requests":
        return "Muitas tentativas. Tente novamente mais tarde.";
      case "auth/network-request-failed":
        return "Erro de conexão. Verifique sua internet.";
      default:
        return "Ocorreu um erro na plataforma. Tente novamente.";
    }
  }, []);

  const signIn = useCallback(
    async (email: string, password: string, rememberMe: boolean = true) => {
      try {
        await setPersistence(
          auth,
          rememberMe ? browserLocalPersistence : browserSessionPersistence
        );
        await signInWithEmailAndPassword(auth, email, password);
        return { error: null };
      } catch (error: unknown) {
        return { error: new Error(sanitizeError(error)) };
      }
    },
    [sanitizeError],
  );

  const signUp = useCallback(
    async (email: string, password: string, nickname: string) => {
      try {
        const { user } = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );

        await updateProfile(user, { displayName: nickname });

        if (!user.uid || user.uid.length < 20) {
          console.error("UID truncation suspected:", user.uid);
          throw new Error("Erro de autenticação: UID inválido.");
        }

        await setDoc(doc(db, "profiles", user.uid), {
          id: user.uid,
          nickname,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_banned: false,
          is_highlighted: false,
        });

        await setDoc(doc(db, "user_credits", user.uid), {
          user_id: user.uid,
          balance: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        return { error: null };
      } catch (error: unknown) {
        return { error: new Error(sanitizeError(error)) };
      }
    },
    [sanitizeError],
  );

  const resetPassword = useCallback(
    async (email: string) => {
      try {
        const response = await fetch("/api/send-reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Erro ao solicitar reset");

        return { error: null };
      } catch (error: unknown) {
        return { error: new Error(sanitizeError(error)) };
      }
    },
    [sanitizeError],
  );

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    // Force a full page reload to clear all state and redirect to landing
    window.location.replace('/');
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.uid);
    }
  }, [user]);

  const hasRole = useCallback(
    (role: "admin" | "organizer" | "player") => {
      return roles.some((r) => r.role === role);
    },
    [roles],
  );

  const value = useMemo(
    () => ({
      user,
      profile,
      roles,
      loading,
      isGuest: !user && !loading,
      signIn,
      signUp,
      signOut,
      resetPassword,
      refreshProfile,
      hasRole,
    }),
    [
      user,
      profile,
      roles,
      loading,
      signIn,
      signUp,
      signOut,
      resetPassword,
      refreshProfile,
      hasRole,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
