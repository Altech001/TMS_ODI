import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import {
    PresenceAPI,
    PresenceStatus,
    PresenceRecord,
    PresenceHistory,
    UserPresence,
    TeamPresenceResponse
} from "../services/api";

// ==========================================
// Presence Context Types
// ==========================================

interface PresenceState {
    currentStatus: PresenceStatus;
    presence: PresenceRecord | null;
    history: PresenceHistory[];
    orgPresence: UserPresence[];
    isLoading: boolean;
    error: string | null;
    sessionStartedAt: Date | null;
    secondsElapsed: number;
    isOnline: boolean;
}

interface PresenceContextType extends PresenceState {
    updateStatus: (status: PresenceStatus) => Promise<void>;
    goOffline: () => Promise<void>;
    goOnline: () => Promise<void>;
    refreshMyPresence: () => Promise<void>;
    refreshMyHistory: () => Promise<void>;
    refreshOrgPresence: () => Promise<void>;
    getUserPresence: (userId: string) => Promise<PresenceRecord | null>;
    clearError: () => void;
    resetTimer: () => void;
}

const initialState: PresenceState = {
    currentStatus: "OFFLINE",
    presence: null,
    history: [],
    orgPresence: [],
    isLoading: false,
    error: null,
    sessionStartedAt: null,
    secondsElapsed: 0,
    isOnline: true,
};

// ==========================================
// Presence Context
// ==========================================

const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

// ==========================================
// Presence Provider Component
// ==========================================

interface PresenceProviderProps {
    children: ReactNode;
}

export const PresenceProvider: React.FC<PresenceProviderProps> = ({ children }) => {
    const [state, setState] = useState<PresenceState>(initialState);

    const setPartialState = useCallback((updates: Partial<PresenceState>) => {
        setState(prev => ({ ...prev, ...updates }));
    }, []);

    // ==========================================
    // Fetch My Presence
    // ==========================================
    const refreshMyPresence = useCallback(async () => {
        try {
            setPartialState({ isLoading: true, error: null });
            const response = await PresenceAPI.getMyStatus();

            if (response.success && response.data) {
                const record = response.data;
                const apiStartDate = record.startedAt ? new Date(record.startedAt) : null;
                const validApiStart = apiStartDate && !isNaN(apiStartDate.getTime()) ? apiStartDate : null;

                setPartialState({
                    presence: record,
                    currentStatus: record.status,
                    sessionStartedAt: record.status !== "OFFLINE" ? validApiStart : null,
                    isLoading: false,
                    isOnline: true,
                });
            } else {
                setPartialState({ isLoading: false, isOnline: true });
            }
        } catch (error) {
            console.error("[PresenceContext] Error fetching presence:", error);
            setPartialState({ isLoading: false, isOnline: false });
        }
    }, [setPartialState]);

    // ==========================================
    // Fetch Presence History
    // ==========================================
    const refreshMyHistory = useCallback(async () => {
        try {
            const response = await PresenceAPI.getMyHistory({ limit: 50 });

            if (response.success && Array.isArray(response.data)) {
                setPartialState({ history: response.data, isOnline: true });
            }
        } catch (error) {
            console.error("[PresenceContext] Error fetching history:", error);
        }
    }, [setPartialState]);

    // ==========================================
    // Fetch Organization Presence
    // ==========================================
    const refreshOrgPresence = useCallback(async () => {
        try {
            const response: TeamPresenceResponse = await PresenceAPI.getOrgPresence();

            if (response.success && response.data?.members) {
                setPartialState({ orgPresence: response.data.members, isOnline: true });
            }
        } catch (error) {
            console.error("[PresenceContext] Error fetching org presence:", error);
        }
    }, [setPartialState]);

    // ==========================================
    // Update Status with optimistic update
    // ==========================================
    const updateStatus = useCallback(async (status: PresenceStatus) => {
        const optimisticSessionStart = status !== "OFFLINE" ? new Date() : null;

        setPartialState({
            currentStatus: status,
            isLoading: true,
            error: null,
            sessionStartedAt: optimisticSessionStart,
            secondsElapsed: 0
        });

        if (optimisticSessionStart) {
            localStorage.setItem("session_started_at", optimisticSessionStart.toISOString());
        } else {
            localStorage.removeItem("session_started_at");
        }

        try {
            const response = await PresenceAPI.updateMyStatus({ status });

            if (response.success && response.data) {
                const record = response.data;
                const apiStartDate = record.startedAt ? new Date(record.startedAt) : null;
                const validApiStart = apiStartDate && !isNaN(apiStartDate.getTime()) ? apiStartDate : null;

                setPartialState({
                    presence: record,
                    currentStatus: record.status,
                    sessionStartedAt: record.status !== "OFFLINE"
                        ? (validApiStart || optimisticSessionStart)
                        : null,
                    isLoading: false,
                    isOnline: true,
                });
            } else {
                setPartialState({ isLoading: false, isOnline: true });
            }
        } catch (error) {
            console.error("[PresenceContext] Error updating status:", error);
            setPartialState({
                error: `Status updated locally. Backend sync failed.`,
                isLoading: false,
                isOnline: false,
            });
        }
    }, [setPartialState]);

    // ==========================================
    // Go Offline with optimistic update
    // ==========================================
    const goOffline = useCallback(async () => {
        setPartialState({
            currentStatus: "OFFLINE",
            sessionStartedAt: null,
            isLoading: true,
            error: null,
        });

        try {
            const response = await PresenceAPI.goOffline();

            if (response.success) {
                setPartialState({
                    currentStatus: "OFFLINE",
                    sessionStartedAt: null,
                    presence: response.data || null,
                    isLoading: false,
                    isOnline: true,
                });
            } else {
                setPartialState({ isLoading: false, isOnline: true });
            }
        } catch (error) {
            console.error("[PresenceContext] Error going offline:", error);
            setPartialState({
                error: `Went offline locally. Backend sync failed.`,
                isLoading: false,
                isOnline: false,
            });
        }
    }, [setPartialState]);

    // ==========================================
    // Go Online with optimistic update
    // ==========================================
    const goOnline = useCallback(async () => {
        const optimisticSessionStart = new Date();

        setPartialState({
            currentStatus: "AVAILABLE",
            sessionStartedAt: optimisticSessionStart,
            isLoading: true,
            error: null,
        });

        try {
            const response = await PresenceAPI.goOnline();

            if (response.success && response.data) {
                const record = response.data;
                const apiStartDate = record.startedAt ? new Date(record.startedAt) : null;
                const validApiStart = apiStartDate && !isNaN(apiStartDate.getTime()) ? apiStartDate : null;

                setPartialState({
                    presence: record,
                    currentStatus: record.status,
                    sessionStartedAt: validApiStart || optimisticSessionStart,
                    isLoading: false,
                    isOnline: true,
                });
            } else {
                setPartialState({ isLoading: false, isOnline: true });
            }
        } catch (error) {
            console.error("[PresenceContext] Error going online:", error);
            setPartialState({
                error: `Went online locally. Backend sync failed.`,
                isLoading: false,
                isOnline: false,
            });
        }
    }, [setPartialState]);

    // ==========================================
    // Get User Presence
    // ==========================================
    const getUserPresence = useCallback(async (userId: string): Promise<PresenceRecord | null> => {
        try {
            const response = await PresenceAPI.getUserPresence(userId);

            if (response.success && response.data) {
                return response.data;
            }
            return null;
        } catch (error) {
            console.error("[PresenceContext] Error fetching user presence:", error);
            return null;
        }
    }, []);

    // ==========================================
    // Clear Error
    // ==========================================
    const clearError = useCallback(() => {
        setPartialState({ error: null });
    }, [setPartialState]);

    // ==========================================
    // Initial Fetch on Mount
    // ==========================================
    useEffect(() => {
        const storedStart = localStorage.getItem("session_started_at");
        if (storedStart) {
            const date = new Date(storedStart);
            if (!isNaN(date.getTime())) {
                setPartialState({ sessionStartedAt: date });
            }
        }
        refreshMyPresence();
        refreshMyHistory();
    }, [refreshMyPresence, refreshMyHistory]);

    // ==========================================
    // Timer Effect
    // ==========================================
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | undefined;

        if (state.currentStatus !== "OFFLINE" && state.sessionStartedAt) {
            // Initial sync
            const now = new Date().getTime();
            const start = state.sessionStartedAt.getTime();
            const diff = Math.floor((now - start) / 1000);
            setPartialState({ secondsElapsed: diff > 0 ? diff : 0 });

            interval = setInterval(() => {
                setPartialState({ secondsElapsed: Math.floor((new Date().getTime() - state.sessionStartedAt!.getTime()) / 1000) });
            }, 1000);
        } else {
            setPartialState({ secondsElapsed: 0 });
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [state.currentStatus, state.sessionStartedAt, setPartialState]);

    const resetTimer = useCallback(() => {
        setPartialState({ secondsElapsed: 0 });
    }, [setPartialState]);

    // ==========================================
    // Context Value
    // ==========================================
    const contextValue: PresenceContextType = {
        ...state,
        updateStatus,
        goOffline,
        goOnline,
        refreshMyPresence,
        refreshMyHistory,
        refreshOrgPresence,
        getUserPresence,
        clearError,
        resetTimer
    };

    return (
        <PresenceContext.Provider value={contextValue}>
            {children}
        </PresenceContext.Provider>
    );
};

// ==========================================
// Custom Hook
// ==========================================

export const usePresence = (): PresenceContextType => {
    const context = useContext(PresenceContext);

    if (context === undefined) {
        throw new Error("usePresence must be used within a PresenceProvider");
    }

    return context;
};

// ==========================================
// Exports
// ==========================================

export { PresenceContext };
export type { PresenceContextType, PresenceState };
