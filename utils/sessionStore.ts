// Simple persistent session store
const sessionStore = new Map();

// Load from localStorage on init
if (typeof window !== 'undefined') {
    const storedSessions = localStorage.getItem('sessions');
    if (storedSessions) {
        const sessions = JSON.parse(storedSessions);
        Object.entries(sessions).forEach(([key, value]) => {
            sessionStore.set(key, value);
        });
    }
}

export const saveSession = (code: string, data: any) => {
    sessionStore.set(code, data);
    if (typeof window !== 'undefined') {
        const sessions = Object.fromEntries(sessionStore.entries());
        localStorage.setItem('sessions', JSON.stringify(sessions));
    }
};

export const getSession = (code: string) => {
    return sessionStore.get(code);
};

export default sessionStore; 