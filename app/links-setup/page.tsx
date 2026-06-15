'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Link2, Plus, Save, Trash2, GripVertical, CheckCircle2, User, ExternalLink, ArrowLeft, Layers } from 'lucide-react';
import Link from 'next/link';

type Profile = {
    id: string;
    username: string;
    display_name: string;
    bio: string;
    avatar_url: string;
    theme_color: string;
};

type PublicLink = {
    id: string;
    title: string;
    url: string;
    is_active: boolean;
    order_index: number;
    isNew?: boolean;
};

type ProfileSummary = Profile & { link_count: number };

type ViewMode = { mode: 'list' } | { mode: 'edit'; profileId: string } | { mode: 'create' };

const DEFAULT_AVATAR = 'https://mapid.co.id/favicon.ico';
const DEFAULT_THEME = '#10b981';
const USERNAME_PATTERN = /^[a-z0-9][a-z0-9-]{1,30}$/;

export default function LinksSetupPage() {
    const [view, setView] = useState<ViewMode>({ mode: 'list' });
    const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
    const [isListLoading, setIsListLoading] = useState(true);

    const [profile, setProfile] = useState<Profile | null>(null);
    const [links, setLinks] = useState<PublicLink[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [usernameError, setUsernameError] = useState('');

    useEffect(() => {
        if (view.mode === 'list') {
            fetchProfileList();
        } else if (view.mode === 'edit') {
            loadProfile(view.profileId);
        } else if (view.mode === 'create') {
            initBlankProfile();
        }
    }, [view]);

    const fetchProfileList = async () => {
        setIsListLoading(true);
        try {
            const { data: profilesData, error: profilesError } = await supabase
                .from('mapid_public_profiles')
                .select('*')
                .order('created_at', { ascending: true });

            if (profilesError) {
                console.error('Error fetching profiles:', profilesError);
                setProfiles([]);
                return;
            }

            const { data: linksData } = await supabase
                .from('mapid_public_links')
                .select('profile_id');

            const counts: Record<string, number> = {};
            (linksData || []).forEach((l: any) => {
                counts[l.profile_id] = (counts[l.profile_id] || 0) + 1;
            });

            setProfiles(
                (profilesData || []).map(p => ({ ...p, link_count: counts[p.id] || 0 }))
            );
        } catch (err) {
            console.error('Failed to load profile list', err);
        } finally {
            setIsListLoading(false);
        }
    };

    const loadProfile = async (profileId: string) => {
        setIsLoading(true);
        setSaveMessage('');
        setUsernameError('');
        try {
            const { data: profileData, error: profileError } = await supabase
                .from('mapid_public_profiles')
                .select('*')
                .eq('id', profileId)
                .single();

            if (profileError) {
                console.error('Error loading profile:', profileError);
                setView({ mode: 'list' });
                return;
            }
            setProfile(profileData);

            const { data: linksData } = await supabase
                .from('mapid_public_links')
                .select('*')
                .eq('profile_id', profileId)
                .order('order_index', { ascending: true });

            setLinks(linksData || []);
        } catch (err) {
            console.error('Failed to load profile', err);
        } finally {
            setIsLoading(false);
        }
    };

    const initBlankProfile = () => {
        setProfile({
            id: '',
            username: '',
            display_name: '',
            bio: '',
            avatar_url: DEFAULT_AVATAR,
            theme_color: DEFAULT_THEME
        });
        setLinks([]);
        setSaveMessage('');
        setUsernameError('');
    };

    const deleteProfile = async (p: ProfileSummary) => {
        if (!confirm(`Hapus halaman "${p.display_name || p.username}"?\n\nURL /l/${p.username} akan menjadi 404. Semua link akan ikut terhapus.`)) return;
        const { error } = await supabase
            .from('mapid_public_profiles')
            .delete()
            .eq('id', p.id);
        if (error) {
            alert('Gagal hapus: ' + error.message);
            return;
        }
        fetchProfileList();
    };

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!profile) return;
        if (e.target.name === 'username') {
            const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
            setProfile({ ...profile, username: val });
            setUsernameError(val && !USERNAME_PATTERN.test(val) ? 'Format: 2-31 char, huruf kecil/angka/dash, awali huruf/angka' : '');
            return;
        }
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleLinkChange = (index: number, field: keyof PublicLink, value: string | boolean) => {
        const newLinks = [...links];
        newLinks[index] = { ...newLinks[index], [field]: value };
        setLinks(newLinks);
    };

    const addNewLink = () => {
        setLinks([
            ...links,
            {
                id: crypto.randomUUID(),
                title: '',
                url: '',
                is_active: true,
                order_index: links.length,
                isNew: true
            }
        ]);
    };

    const removeLink = async (index: number) => {
        const linkToRemove = links[index];
        const newLinks = [...links];
        newLinks.splice(index, 1);
        newLinks.forEach((l, i) => { l.order_index = i; });
        setLinks(newLinks);

        if (!linkToRemove.isNew && profile?.id) {
            await supabase.from('mapid_public_links').delete().eq('id', linkToRemove.id);
        }
    };

    const saveChanges = async () => {
        if (!profile) return;
        const isCreating = view.mode === 'create';

        if (isCreating) {
            if (!profile.username || !USERNAME_PATTERN.test(profile.username)) {
                setUsernameError('Username wajib diisi (2-31 char, huruf kecil/angka/dash).');
                return;
            }
            const { data: existing } = await supabase
                .from('mapid_public_profiles')
                .select('id')
                .eq('username', profile.username)
                .maybeSingle();
            if (existing) {
                setUsernameError(`Username "${profile.username}" sudah dipakai.`);
                return;
            }
        }

        setIsSaving(true);
        setSaveMessage('');

        try {
            let profileId = profile.id;

            if (!profileId) {
                const { data, error } = await supabase
                    .from('mapid_public_profiles')
                    .insert([{
                        username: profile.username,
                        display_name: profile.display_name,
                        bio: profile.bio,
                        avatar_url: profile.avatar_url,
                        theme_color: profile.theme_color
                    }])
                    .select()
                    .single();

                if (error) throw error;
                profileId = data.id;
                setProfile(data);
            } else {
                const { error } = await supabase
                    .from('mapid_public_profiles')
                    .update({
                        display_name: profile.display_name,
                        bio: profile.bio,
                        avatar_url: profile.avatar_url,
                        theme_color: profile.theme_color
                    })
                    .eq('id', profileId);

                if (error) throw error;
            }

            if (profileId && links.length > 0) {
                const linksToUpsert = links.map((link, index) => ({
                    id: link.id,
                    profile_id: profileId,
                    title: link.title,
                    url: link.url,
                    is_active: link.is_active,
                    order_index: index
                }));

                const { error } = await supabase
                    .from('mapid_public_links')
                    .upsert(linksToUpsert);

                if (error) throw error;
            }

            setSaveMessage('Changes saved successfully!');
            setTimeout(() => setSaveMessage(''), 3000);

            if (isCreating && profileId) {
                setView({ mode: 'edit', profileId });
            } else if (profileId) {
                await loadProfile(profileId);
            }
        } catch (err: any) {
            console.error('Error saving:', JSON.stringify(err, null, 2));
            setSaveMessage('Error saving changes: ' + (err.message || JSON.stringify(err)));
        } finally {
            setIsSaving(false);
        }
    };

    // ============== LIST VIEW ==============
    if (view.mode === 'list') {
        return (
            <div className="p-8 max-w-6xl mx-auto h-[calc(100vh-2rem)] overflow-y-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Layers className="text-emerald-500" />
                            Public Pages
                        </h1>
                        <p className="text-zinc-500 text-sm mt-1">
                            Manage banyak halaman Linktree-style. Tiap halaman punya URL sendiri di <code className="text-xs bg-zinc-100 px-1.5 py-0.5 rounded">/l/[username]</code>.
                        </p>
                    </div>
                    <button
                        onClick={() => setView({ mode: 'create' })}
                        className="flex items-center gap-2 bg-emerald-500 text-white px-5 py-2 rounded-md hover:bg-emerald-600 transition shadow-sm"
                    >
                        <Plus size={18} /> New Page
                    </button>
                </div>

                {isListLoading ? (
                    <div className="text-zinc-400 text-sm">Loading pages…</div>
                ) : profiles.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed border-zinc-200 rounded-2xl">
                        <Layers className="mx-auto text-zinc-300 mb-3" size={36} />
                        <p className="text-zinc-500 text-sm mb-4">Belum ada halaman publik.</p>
                        <button
                            onClick={() => setView({ mode: 'create' })}
                            className="inline-flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-md hover:bg-emerald-600 transition text-sm"
                        >
                            <Plus size={16} /> Buat halaman pertama
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {profiles.map(p => (
                            <div key={p.id} className="bg-white border border-zinc-200 rounded-xl shadow-sm hover:shadow-md transition overflow-hidden flex flex-col">
                                <div className="h-2" style={{ backgroundColor: p.theme_color || DEFAULT_THEME }} />
                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="flex items-start gap-3 mb-4">
                                        <div
                                            className="w-12 h-12 rounded-full bg-zinc-100 shrink-0 overflow-hidden border-2"
                                            style={{ borderColor: p.theme_color || DEFAULT_THEME }}
                                        >
                                            {p.avatar_url ? (
                                                <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-zinc-400">
                                                    <User size={20} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-zinc-900 truncate">{p.display_name || p.username}</h3>
                                            <p className="text-xs text-zinc-500 truncate">/l/{p.username}</p>
                                        </div>
                                    </div>

                                    <p className="text-xs text-zinc-500 line-clamp-2 mb-4 min-h-[2rem]">
                                        {p.bio || <span className="italic text-zinc-300">No bio</span>}
                                    </p>

                                    <div className="flex items-center justify-between text-xs text-zinc-500 mb-4">
                                        <span className="inline-flex items-center gap-1 bg-zinc-100 px-2 py-1 rounded">
                                            <Link2 size={12} /> {p.link_count} {p.link_count === 1 ? 'link' : 'links'}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5">
                                            <span className="w-3 h-3 rounded-full border border-zinc-200" style={{ backgroundColor: p.theme_color || DEFAULT_THEME }} />
                                            {p.theme_color || DEFAULT_THEME}
                                        </span>
                                    </div>

                                    <div className="flex gap-2 mt-auto">
                                        <button
                                            onClick={() => setView({ mode: 'edit', profileId: p.id })}
                                            className="flex-1 text-sm bg-emerald-500 text-white px-3 py-1.5 rounded-md hover:bg-emerald-600 transition"
                                        >
                                            Edit
                                        </button>
                                        <Link
                                            href={`/l/${p.username}`}
                                            target="_blank"
                                            className="text-sm bg-white border border-zinc-200 text-zinc-700 px-3 py-1.5 rounded-md hover:bg-zinc-50 transition flex items-center gap-1"
                                            title="View live page"
                                        >
                                            <ExternalLink size={14} />
                                        </Link>
                                        <button
                                            onClick={() => deleteProfile(p)}
                                            className="text-sm bg-white border border-zinc-200 text-rose-500 px-3 py-1.5 rounded-md hover:bg-rose-50 hover:border-rose-200 transition"
                                            title="Delete page"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // ============== EDIT / CREATE VIEW ==============
    if (isLoading) {
        return <div className="p-8">Loading setup…</div>;
    }

    const isCreating = view.mode === 'create';

    return (
        <div className="p-8 max-w-5xl mx-auto h-[calc(100vh-2rem)] overflow-y-auto">
            <div className="flex items-center justify-between mb-8 gap-4">
                <div className="flex items-start gap-4">
                    <button
                        onClick={() => setView({ mode: 'list' })}
                        className="mt-1 p-2 hover:bg-zinc-100 rounded-md transition"
                        title="Back to all pages"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Link2 className="text-emerald-500" />
                            {isCreating ? 'New Public Page' : 'Edit Public Page'}
                        </h1>
                        <p className="text-zinc-500 text-sm mt-1">
                            {isCreating ? 'Buat halaman Linktree baru dengan username unik.' : 'Configure your Linktree-style public page'}
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    {!isCreating && profile?.username && (
                        <Link
                            href={`/l/${profile.username}`}
                            target="_blank"
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-md hover:bg-zinc-50 transition"
                        >
                            <ExternalLink size={16} />
                            View Live Page
                        </Link>
                    )}
                    <button
                        onClick={saveChanges}
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-emerald-500 text-white px-5 py-2 rounded-md hover:bg-emerald-600 transition disabled:opacity-50"
                    >
                        {isSaving ? 'Saving…' : <><Save size={18} /> {isCreating ? 'Create Page' : 'Save Changes'}</>}
                    </button>
                </div>
            </div>

            {saveMessage && (
                <div className={`p-4 mb-6 rounded-md flex items-center gap-2 ${saveMessage.includes('Error') ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                    <CheckCircle2 size={18} />
                    {saveMessage}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Profile Section */}
                    <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <User size={18} /> Profile Settings
                        </h2>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Username (URL Path)</label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={profile?.username || ''}
                                        onChange={handleProfileChange}
                                        readOnly={!isCreating}
                                        className={`w-full border rounded-md px-3 py-2 text-sm ${isCreating ? 'bg-white border-zinc-300 focus:ring-emerald-500 focus:border-emerald-500' : 'bg-zinc-100 border-zinc-200 text-zinc-500'}`}
                                        placeholder="mapid-sales"
                                    />
                                    {isCreating ? (
                                        usernameError ? (
                                            <span className="text-[10px] text-rose-500 mt-1 block">{usernameError}</span>
                                        ) : (
                                            <span className="text-[10px] text-zinc-400 mt-1 block">URL akan jadi /l/{profile?.username || '…'}. Tidak bisa diubah setelah dibuat.</span>
                                        )
                                    ) : (
                                        <span className="text-[10px] text-zinc-400 mt-1 block">Username tidak bisa diubah setelah halaman dibuat.</span>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Display Name</label>
                                    <input
                                        type="text"
                                        name="display_name"
                                        value={profile?.display_name || ''}
                                        onChange={handleProfileChange}
                                        className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        placeholder="e.g. MAPID"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-zinc-700 mb-1">Bio / Description</label>
                                <textarea
                                    name="bio"
                                    value={profile?.bio || ''}
                                    onChange={handleProfileChange}
                                    rows={2}
                                    className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="Brief description about your company..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Avatar URL</label>
                                    <input
                                        type="text"
                                        name="avatar_url"
                                        value={profile?.avatar_url || ''}
                                        onChange={handleProfileChange}
                                        className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        placeholder="https://..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Theme Color</label>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="color"
                                            name="theme_color"
                                            value={profile?.theme_color || DEFAULT_THEME}
                                            onChange={handleProfileChange}
                                            className="h-9 w-12 rounded cursor-pointer p-0.5 border border-zinc-200"
                                        />
                                        <input
                                            type="text"
                                            name="theme_color"
                                            value={profile?.theme_color || DEFAULT_THEME}
                                            onChange={handleProfileChange}
                                            className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm uppercase text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Links Section */}
                    <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Link2 size={18} /> Links
                            </h2>
                            <button
                                onClick={addNewLink}
                                className="text-sm bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-3 py-1.5 rounded-md flex items-center gap-1 transition"
                            >
                                <Plus size={14} /> Add Link
                            </button>
                        </div>

                        <div className="space-y-3">
                            {links.length === 0 ? (
                                <div className="text-center py-8 text-zinc-400 text-sm border-2 border-dashed border-zinc-200 rounded-lg">
                                    No links added yet. Click 'Add Link' to get started.
                                </div>
                            ) : (
                                links.map((link, idx) => (
                                    <div key={link.id} className="flex items-start gap-3 bg-zinc-50 p-4 rounded-lg border border-zinc-200 group relative">
                                        <div className="mt-2 text-zinc-300 cursor-move">
                                            <GripVertical size={18} />
                                        </div>

                                        <div className="flex-1 space-y-3">
                                            <div>
                                                <input
                                                    type="text"
                                                    value={link.title}
                                                    onChange={(e) => handleLinkChange(idx, 'title', e.target.value)}
                                                    placeholder="Link Title (e.g. WhatsApp, Website, Maps)"
                                                    className="w-full font-medium bg-white border border-zinc-300 rounded-md px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                />
                                            </div>
                                            <div>
                                                <input
                                                    type="text"
                                                    value={link.url}
                                                    onChange={(e) => handleLinkChange(idx, 'url', e.target.value)}
                                                    placeholder="https://..."
                                                    className="w-full bg-white border border-zinc-300 rounded-md px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center gap-3 ml-2">
                                            <label className="flex items-center cursor-pointer" title={link.is_active ? 'Hide link' : 'Show link'}>
                                                <div className="relative">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only"
                                                        checked={link.is_active}
                                                        onChange={(e) => handleLinkChange(idx, 'is_active', e.target.checked)}
                                                    />
                                                    <div className={`block w-8 h-4 rounded-full transition-colors ${link.is_active ? 'bg-emerald-400' : 'bg-zinc-300'}`}></div>
                                                    <div className={`dot absolute left-0.5 top-0.5 bg-white w-3 h-3 rounded-full transition-transform ${link.is_active ? 'transform translate-x-4' : ''}`}></div>
                                                </div>
                                            </label>

                                            <button
                                                onClick={() => removeLink(idx)}
                                                className="text-zinc-400 hover:text-rose-500 transition p-1"
                                                title="Delete link"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column - Preview */}
                <div className="lg:col-span-1">
                    <div className="sticky top-6">
                        <h3 className="text-sm font-semibold text-zinc-500 mb-4 uppercase tracking-wider text-center">Live Preview</h3>

                        <div className="w-[300px] mx-auto h-[600px] bg-white rounded-[2.5rem] border-[8px] border-zinc-800 shadow-xl overflow-hidden relative">
                            <div className="absolute top-0 inset-x-0 h-6 bg-zinc-800 rounded-b-2xl w-32 mx-auto z-10"></div>

                            <div className="w-full h-full overflow-y-auto bg-slate-50">
                                <div className="p-6 pt-12 flex flex-col items-center">
                                    <div
                                        className="w-20 h-20 rounded-full bg-white shadow-md mb-4 overflow-hidden border-2"
                                        style={{ borderColor: profile?.theme_color || DEFAULT_THEME }}
                                    >
                                        {profile?.avatar_url ? (
                                            <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-zinc-200 text-zinc-400">
                                                <User size={32} />
                                            </div>
                                        )}
                                    </div>

                                    <h2 className="font-bold text-lg text-zinc-900 mb-1">{profile?.display_name || 'Your Name'}</h2>
                                    <p className="text-sm text-zinc-600 text-center mb-8">{profile?.bio || 'Your bio goes here'}</p>

                                    <div className="w-full space-y-3">
                                        {links.filter(l => l.is_active).map((link, idx) => (
                                            <div
                                                key={`preview-${idx}`}
                                                className="w-full py-3 px-4 rounded-lg bg-white shadow-sm text-center text-sm font-medium hover:shadow-md transition cursor-pointer border"
                                                style={{
                                                    color: profile?.theme_color || DEFAULT_THEME,
                                                    borderColor: `${profile?.theme_color}30` || `${DEFAULT_THEME}30`
                                                }}
                                            >
                                                {link.title || 'Link Title'}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
