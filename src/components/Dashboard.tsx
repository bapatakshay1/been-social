import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { MapChart } from './MapChart';
import { LogOut, Users, Search, MapPin, Check, Plus, UserPlus, X, CheckCircle } from 'lucide-react';

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
    useEffect(() => {
        const t = setTimeout(onDone, 3000);
        return () => clearTimeout(t);
    }, []);
    return (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-zinc-900 border border-zinc-700 text-white px-4 py-3 rounded-xl shadow-2xl animate-fade-in">
            <CheckCircle size={18} className="text-green-400 flex-shrink-0" />
            <span className="text-sm font-medium">{message}</span>
        </div>
    );
}

export function Dashboard({ user, onLogout }: { user: any; onLogout: () => void }) {
    const [visitedCountries, setVisitedCountries] = useState<string[]>([]);
    const [allCountries, setAllCountries] = useState<string[]>([]);
    const [countryQuery, setCountryQuery] = useState('');

    const [friends, setFriends] = useState<any[]>([]);
    const [pendingReceived, setPendingReceived] = useState<any[]>([]);
    const [pendingSent, setPendingSent] = useState<any[]>([]);

    const [selectedFriend, setSelectedFriend] = useState<any>(null);
    const [friendVisited, setFriendVisited] = useState<string[] | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);

    const [toast, setToast] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToast(msg);
    };

    useEffect(() => {
        fetchMyVisits();
        fetchFriends();
        fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
            .then(res => res.json())
            .then((data: any) => {
                const names = data.objects.countries.geometries.map((g: any) => g.properties.name);
                setAllCountries(names.filter(Boolean).sort());
            });
    }, []);

    useEffect(() => {
        if (selectedFriend) fetchFriendVisits(selectedFriend.id);
        else setFriendVisited(null);
    }, [selectedFriend]);

    async function fetchMyVisits() {
        const { data } = await supabase.from('visits').select('country_code').eq('user_id', user.id);
        if (data) setVisitedCountries(data.map(d => d.country_code));
    }

    async function fetchFriends() {
        const { data: mySent } = await supabase.from('friends').select('user_id_2, profiles:user_id_2 (id, full_name)').eq('user_id_1', user.id);
        const { data: received } = await supabase.from('friends').select('user_id_1, profiles:user_id_1 (id, full_name)').eq('user_id_2', user.id);
        if (!mySent || !received) return;

        const sentIds = new Set(mySent.map(d => d.user_id_2));
        const receivedIds = new Set(received.map(d => d.user_id_1));

        setFriends(mySent.filter(d => receivedIds.has(d.user_id_2)).map(d => d.profiles));
        setPendingSent(mySent.filter(d => !receivedIds.has(d.user_id_2)).map(d => d.profiles));
        setPendingReceived(received.filter(d => !sentIds.has(d.user_id_1)).map(d => d.profiles));
    }

    async function fetchFriendVisits(friendId: string) {
        const { data } = await supabase.from('visits').select('country_code').eq('user_id', friendId);
        if (data) setFriendVisited(data.map(d => d.country_code));
    }

    async function toggleCountry(countryName: string) {
        if (selectedFriend) return;
        const isVisited = visitedCountries.includes(countryName);
        if (isVisited) {
            const { error } = await supabase.from('visits').delete().match({ user_id: user.id, country_code: countryName });
            if (!error) setVisitedCountries(prev => prev.filter(c => c !== countryName));
        } else {
            const { error } = await supabase.from('visits').insert({ user_id: user.id, country_code: countryName });
            if (!error) {
                setVisitedCountries(prev => [...prev, countryName]);
                showToast(`Added ${countryName}!`);
            }
        }
        setCountryQuery('');
    }

    async function searchUsers(e: React.FormEvent) {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        const { data } = await supabase.from('profiles').select('id, full_name').ilike('full_name', `%${searchQuery}%`).neq('id', user.id);
        const friendIds = [...friends.map(f => f.id), ...pendingSent.map(f => f.id), ...pendingReceived.map(f => f.id)];
        if (data) setSearchResults(data.filter(u => !friendIds.includes(u.id)));
    }

    async function sendFriendRequest(friendId: string, friendName?: string) {
        const { error } = await supabase.from('friends').insert({ user_id_1: user.id, user_id_2: friendId });
        if (!error) {
            showToast(friendName ? `Friend request sent to ${friendName}!` : 'Friend request accepted!');
        }
        setSearchQuery('');
        setSearchResults([]);
        fetchFriends();
    }

    return (
        <div className="flex h-screen bg-zinc-950 text-white overflow-hidden font-sans">
            {toast && <Toast message={toast} onDone={() => setToast(null)} />}

            {/* Sidebar */}
            <div className="w-80 flex flex-col bg-zinc-900 border-r border-zinc-800 shadow-xl z-10 flex-shrink-0">
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center font-bold text-zinc-900 shadow-lg shadow-amber-500/20">
                            {user.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="font-semibold text-zinc-100">{user.full_name}</h2>
                            <p className="text-xs text-zinc-400">{visitedCountries.length} countries</p>
                        </div>
                    </div>
                    <button onClick={onLogout} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
                        <LogOut size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">

                    {/* My Countries Search */}
                    <div>
                        <h3 className="text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-3 flex items-center gap-2">
                            <MapPin size={14} /> Find A Country
                        </h3>
                        <div className="relative">
                            <input
                                type="text"
                                value={countryQuery}
                                onChange={(e) => setCountryQuery(e.target.value)}
                                placeholder="E.g. France..."
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 pl-3 pr-8 text-sm focus:outline-none focus:border-amber-500"
                            />
                            {countryQuery && (
                                <div className="absolute top-12 left-0 right-0 bg-zinc-800 border border-zinc-700 shadow-xl rounded-lg max-h-48 overflow-y-auto z-50">
                                    {allCountries
                                        .filter(c => c.toLowerCase().includes(countryQuery.toLowerCase()) && !visitedCountries.includes(c))
                                        .map(c => (
                                            <button key={c} onClick={() => toggleCountry(c)}
                                                className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-700 text-zinc-200 transition-colors flex items-center justify-between">
                                                {c} <Plus size={14} className="text-amber-500" />
                                            </button>
                                        ))}
                                    {allCountries.filter(c => c.toLowerCase().includes(countryQuery.toLowerCase()) && !visitedCountries.includes(c)).length === 0 && (
                                        <div className="px-4 py-3 text-xs text-zinc-500 text-center">No matches or already added.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* My Visited Countries List */}
                    {!selectedFriend && visitedCountries.length > 0 && (
                        <div>
                            <h3 className="text-xs uppercase tracking-wider text-amber-500 font-semibold mb-3">
                                My Countries ({visitedCountries.length})
                            </h3>
                            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
                                {visitedCountries.sort().map(country => (
                                    <div key={country} className="flex items-center justify-between text-sm py-1.5 px-3 bg-zinc-800/30 border border-zinc-800/50 rounded-lg group hover:bg-zinc-800 transition-colors">
                                        <span className="truncate text-zinc-300">{country}</span>
                                        <button onClick={() => toggleCountry(country)}
                                            className="text-zinc-500 flex-shrink-0 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Add Friend */}
                    <div>
                        <h3 className="text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-3 flex items-center gap-2">
                            <UserPlus size={14} /> Add Friends
                        </h3>
                        <form onSubmit={searchUsers} className="relative mb-3">
                            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search username..."
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 pl-3 pr-10 text-sm focus:outline-none focus:border-amber-500" />
                            <button type="submit" className="absolute right-2 top-2 text-zinc-400 hover:text-amber-500">
                                <Search size={16} />
                            </button>
                        </form>
                        <div className="flex flex-col gap-2">
                            {searchResults.map(res => (
                                <div key={res.id} className="flex items-center justify-between bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">
                                    <span className="text-sm font-medium">{res.full_name}</span>
                                    <button onClick={() => sendFriendRequest(res.id, res.full_name)}
                                        className="text-xs bg-amber-500 text-zinc-950 px-3 py-1 rounded-full font-medium hover:bg-amber-400">
                                        Add
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pending Sent Requests */}
                    {pendingSent.length > 0 && (
                        <div>
                            <h3 className="text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-3">
                                Requests Sent ({pendingSent.length})
                            </h3>
                            <div className="flex flex-col gap-1">
                                {pendingSent.map(f => (
                                    <div key={f.id} className="flex items-center gap-3 px-3 py-2 bg-zinc-950/50 rounded-lg border border-zinc-800 border-dashed">
                                        <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-400">
                                            {f.full_name?.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-sm text-zinc-400">{f.full_name}</span>
                                        <span className="ml-auto text-xs text-zinc-600">Pending</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Incoming Friend Requests */}
                    {pendingReceived.length > 0 && (
                        <div>
                            <h3 className="text-xs uppercase tracking-wider text-amber-500 font-semibold mb-3">
                                Friend Requests ({pendingReceived.length})
                            </h3>
                            <div className="flex flex-col gap-2">
                                {pendingReceived.map(req => (
                                    <div key={req.id} className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg">
                                        <span className="text-sm font-medium text-amber-100">{req.full_name}</span>
                                        <button onClick={() => sendFriendRequest(req.id)}
                                            className="text-xs bg-amber-500 text-zinc-950 px-2 py-1 rounded-md font-bold flex items-center gap-1 hover:bg-amber-400">
                                            <Check size={12} /> Accept
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Friends List + Requests */}
                    <div>
                        <h3 className="text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-3 flex items-center gap-2">
                            <Users size={14} /> Your Friends
                        </h3>
                        <div className="flex flex-col gap-2">
                            {/* My map button */}
                            <button onClick={() => setSelectedFriend(null)}
                                className={`w-full text-left px-3 py-3 rounded-lg border transition-colors flex items-center gap-3 ${!selectedFriend ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' : 'bg-transparent border-transparent hover:bg-zinc-800 text-zinc-300'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${!selectedFriend ? 'bg-amber-500/20' : 'bg-zinc-800'}`}>
                                    <MapPin size={14} />
                                </div>
                                <span className="text-sm font-medium">My Map Only</span>
                            </button>

                            {/* Confirmed friends — click to layer map */}
                            {friends.map(f => (
                                <button key={f.id} onClick={() => setSelectedFriend(f)}
                                    className={`w-full text-left px-3 py-3 rounded-lg border transition-colors flex items-center gap-3 ${selectedFriend?.id === f.id ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-transparent border-transparent hover:bg-zinc-800 text-zinc-300'}`}>
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                                        {f.full_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <span className="text-sm font-medium">{f.full_name}</span>
                                        <span className="text-xs text-zinc-500">Tap to layer map</span>
                                    </div>
                                </button>
                            ))}

                            {friends.length === 0 && pendingReceived.length === 0 && (
                                <p className="text-xs text-zinc-500 text-center py-4 bg-zinc-950 rounded-lg border border-zinc-800 border-dashed">
                                    No friends yet. Send a request above!
                                </p>
                            )}
                        </div>

                        {/* Requests sub-section */}
                        {pendingReceived.length > 0 && (
                            <div className="mt-4">
                                <h4 className="text-xs uppercase tracking-wider text-amber-500 font-semibold mb-2 flex items-center gap-2">
                                    <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold rounded-full bg-amber-500 text-zinc-900">{pendingReceived.length}</span>
                                    Requests
                                </h4>
                                <div className="flex flex-col gap-2">
                                    {pendingReceived.map(req => (
                                        <div key={req.id} className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 px-3 py-2.5 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-amber-500/30 flex items-center justify-center text-xs font-bold text-amber-300">
                                                    {req.full_name?.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-sm font-medium text-amber-100">{req.full_name}</span>
                                            </div>
                                            <button onClick={() => sendFriendRequest(req.id, req.full_name)}
                                                className="text-xs bg-amber-500 text-zinc-950 px-2.5 py-1 rounded-md font-bold flex items-center gap-1 hover:bg-amber-400 transition-colors">
                                                <Check size={11} /> Accept
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Map Area */}
            <div className="flex-1 relative bg-zinc-950 flex flex-col p-6">
                {selectedFriend && (
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 bg-zinc-900/90 backdrop-blur-md px-6 py-3 rounded-full border border-zinc-700 shadow-2xl flex items-center gap-6">
                        <h3 className="font-medium text-sm border-r border-zinc-700 pr-6">vs {selectedFriend.full_name}</h3>
                        <div className="flex items-center gap-5 text-xs font-semibold">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-400" /> Only You</div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-pink-400" /> Only Them</div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-teal-400" /> Both</div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-700 border border-slate-500" /> Neither Yet</div>
                        </div>
                    </div>
                )}

                <MapChart
                    visitedCountries={visitedCountries}
                    friendVisitedCountries={friendVisited}
                    onCountryClick={toggleCountry}
                />
            </div>
        </div>
    );
}
