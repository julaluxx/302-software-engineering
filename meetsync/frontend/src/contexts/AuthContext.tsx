import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../firebase";
import type { UserInfo } from "../types";

type AuthContextType = {
    user: User | null;
    userInfo: UserInfo | null;
    token: string | null;
    loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    userInfo: null,
    token: null,
    loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const idToken = await currentUser.getIdToken();
                setToken(idToken);
                setUserInfo({
                    uid: currentUser.uid,
                    name: currentUser.displayName || "",
                    email: currentUser.email || "",
                });
            } else {
                setToken(null);
                setUserInfo(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, userInfo, token, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
