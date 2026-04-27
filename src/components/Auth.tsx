import { useState } from 'react';
import { supabase } from '../supabase';
import { User, MapPin } from 'lucide-react';

// Simple deterministic UUID from a string (for consistent IDs per username)
function simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
    }
    const h = Math.abs(hash).toString(16).padStart(8, '0');
    return `${h.slice(0, 8)}-${h.slice(0, 4)}-4${h.slice(1, 4)}-a${h.slice(2, 5)}-${h.slice(0, 12).padEnd(12, '0')}`;
}

export function Auth({ onLogin }: { onLogin: (user: any) => void }) {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        if (!username.trim()) return;
        setLoading(true);
        setError('');

        const name = username.trim();

        // 1. Look up by full_name
        const { data: existing, error: lookupError } = await supabase
            .from('profiles')
            .select('*')
            .eq('full_name', name)
            .single();

        if (lookupError && lookupError.code !== 'PGRST116') {
            // PGRST116 = row not found, anything else is a real error
            setError('Something went wrong. Try again.');
            setLoading(false);
            return;
        }

        if (existing) {
            // Found existing user — log them in directly
            onLogin(existing);
        } else {
            // New user — create a profile with a deterministic ID
            const newId = simpleHash(name);
            const { data: created, error: insertError } = await supabase
                .from('profiles')
                .insert({ id: newId, full_name: name, email: `${name.toLowerCase()}@mock.com` })
                .select()
                .single();

            if (insertError) {
                setError(`Could not create account: ${insertError.message}`);
                setLoading(false);
                return;
            }

            onLogin(created);
        }

        setLoading(false);
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
            <div className="max-w-md w-full bg-zinc-900 rounded-2xl shadow-xl overflow-hidden border border-zinc-800">
                <div className="p-8">
                    <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center mb-6 border border-amber-500/30">
                        <MapPin className="w-8 h-8 text-amber-500" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Been Social</h2>
                    <p className="text-zinc-400 mb-8">Enter your username to log in or create an account.</p>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1">Username</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-zinc-500" />
                                </div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-zinc-700 rounded-xl bg-zinc-950/50 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                    placeholder="e.g. akshayb"
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {error && (
                            <p className="text-red-400 text-sm">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !username.trim()}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-zinc-950 bg-amber-500 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 focus:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? 'Entering...' : 'Get Started'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
