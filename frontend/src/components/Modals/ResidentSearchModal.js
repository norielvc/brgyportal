import { useState, useEffect } from 'react';
import { Search, X, User, MapPin, Calendar, Phone, Check, AlertCircle, Database } from 'lucide-react';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api').replace(/\/$/, '').replace(/\/api$/, '') + '/api';

export default function ResidentSearchModal({ isOpen, onClose, onSelect }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm.length >= 3) {
                handleSearch();
            } else {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const handleSearch = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/residents/search?name=${encodeURIComponent(searchTerm)}`);
            const data = await response.json();
            if (data.success) {
                setResults(data.residents);
            } else {
                throw new Error(data.message || 'Failed to search residents');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="fixed inset-0 bg-[#0a1b12]/80 backdrop-blur-md transition-opacity" onClick={onClose} />

                <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-in border border-white/20">
                    {/* Premium Nature Header */}
                    <div className="bg-gradient-to-r from-[#112e1f] via-[#2d5a3d] to-[#112117] px-8 py-6 flex items-center justify-between text-white relative overflow-hidden flex-shrink-0">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>

                        <div className="flex items-center gap-4 relative z-10">
                            <div className="bg-white/10 backdrop-blur-lg p-2.5 rounded-xl border border-white/20 shadow-lg">
                                <Database className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black tracking-tight leading-none uppercase">Resident Database</h2>
                                <p className="text-emerald-100/60 text-[10px] font-black uppercase tracking-widest mt-1">Official Census Records Only</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all group">
                            <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                        </button>
                    </div>

                    {/* Search Input Container */}
                    <div className="p-8 border-b border-gray-100 bg-gray-50/50 relative">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                                <Search className="w-5 h-5 text-emerald-900/30 group-focus-within:text-emerald-600 transition-colors" />
                            </div>
                            <input
                                type="text"
                                autoFocus
                                placeholder="TYPE SURNAME OR GIVEN NAME (MIN. 3 CHARS)..."
                                className="w-full pl-14 pr-6 py-5 bg-white border-2 border-gray-100 rounded-[1.5rem] focus:border-[#2d5a3d] focus:ring-4 focus:ring-[#2d5a3d]/5 outline-none transition-all font-black text-[#112e1f] placeholder:text-gray-300 text-sm tracking-wide shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {isLoading && (
                                <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                    <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Results Area with Custom Scrollbar */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white">
                        {error ? (
                            <div className="py-12 flex flex-col items-center justify-center text-rose-500 text-center space-y-3">
                                <AlertCircle className="w-12 h-12 opacity-20" />
                                <p className="font-black uppercase tracking-widest text-xs">{error}</p>
                            </div>
                        ) : results.length > 0 ? (
                            <div className="grid gap-4">
                                {results.map((resident) => (
                                    <button
                                        key={resident.id}
                                        onClick={() => onSelect(resident)}
                                        className="flex flex-col md:flex-row md:items-center gap-5 p-5 bg-white border-2 border-gray-50 rounded-[2rem] hover:border-emerald-200 hover:bg-emerald-50/30 hover:shadow-xl hover:shadow-emerald-900/5 transition-all text-left group relative overflow-hidden active:scale-[0.98]"
                                    >
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-125 transition-transform duration-700"></div>

                                        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-700 shrink-0 group-hover:bg-[#112e1f] group-hover:text-white transition-all shadow-inner border border-emerald-100/50">
                                            <User className="w-7 h-7" />
                                        </div>

                                        <div className="flex-1 min-w-0 relative z-10">
                                            <div className="flex items-center flex-wrap gap-2 mb-1.5">
                                                <h4 className="font-black text-[#112e1f] text-lg tracking-tight uppercase group-hover:text-emerald-800 transition-colors">
                                                    {resident.full_name}
                                                </h4>
                                                {resident.pending_case && (
                                                    <span className="bg-rose-50 text-rose-600 text-[9px] font-black px-2.5 py-1 rounded-lg border border-rose-100 uppercase tracking-widest">
                                                        RESTRICTED
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                <span className="flex items-center gap-1.5 text-gray-400 group-hover:text-emerald-700/60 transition-colors">
                                                    <MapPin className="w-3.5 h-3.5" />
                                                    {resident.residential_address}
                                                </span>
                                                {resident.age && (
                                                    <span className="flex items-center gap-1.5 text-gray-400 group-hover:text-emerald-700/60 transition-colors border-l border-gray-200 pl-4">
                                                        {resident.age} YRS • {resident.gender}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="shrink-0 flex items-center gap-3 text-emerald-600 font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                            AUTOFILL <Check className="w-4 h-4" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : searchTerm.length >= 3 && !isLoading ? (
                            <div className="py-20 text-center space-y-4">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto opacity-50 border border-gray-100 shadow-inner">
                                    <Search className="w-8 h-8 text-gray-300" />
                                </div>
                                <div>
                                    <p className="text-gray-900 font-black uppercase tracking-widest text-xs">No Records Found</p>
                                    <p className="text-gray-400 text-[10px] font-bold mt-1 tracking-wider uppercase">Try adjusting your search terms</p>
                                </div>
                            </div>
                        ) : (
                            <div className="py-20 text-center space-y-4 opacity-40 group hover:opacity-100 transition-opacity">
                                <div className="w-24 h-24 bg-emerald-50 text-emerald-900/10 rounded-[2.5rem] flex items-center justify-center mx-auto transition-transform duration-700 group-hover:scale-110">
                                    <Database className="w-10 h-10" />
                                </div>
                                <div>
                                    <p className="text-emerald-950 font-black uppercase tracking-widest text-xs">Census Search Engine</p>
                                    <p className="text-emerald-800/60 text-[10px] font-black mt-1 tracking-widest uppercase">Input at least 3 characters to query</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Info bar */}
                    <div className="px-8 py-5 bg-[#112e1f]/5 border-t border-[#112e1f]/10 flex flex-col sm:flex-row justify-between items-center sm:gap-0 gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-[10px] font-black text-[#112e1f]/60 uppercase tracking-widest leading-none">Verified National Census System 2026</span>
                        </div>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm leading-none shrink-0">Press ESC to EXIT</span>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .animate-scale-in { animation: scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                @keyframes scaleIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #112e1f15; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #112e1f30; }
            `}</style>
        </div>
    );
}
