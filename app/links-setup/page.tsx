'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Link2, Plus, Save, Trash2, GripVertical, CheckCircle2, User, ExternalLink } from 'lucide-react';
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
    isNew?: boolean; // For tracking newly added unsaved links
};

export default function LinksSetupPage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [links, setLinks] = useState<PublicLink[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch MAPID profile (we assume username 'mapid' for now)
            const { data: profileData, error: profileError } = await supabase
                .from('mapid_public_profiles')
                .select('*')
                .eq('username', 'mapid')
                .single();

            if (profileError && profileError.code !== 'PGRST116') {
                console.error('Error fetching profile:', profileError);
            } else if (profileData) {
                setProfile(profileData);
                
                // Fetch links for this profile
                const { data: linksData, error: linksError } = await supabase
                    .from('mapid_public_links')
                    .select('*')
                    .eq('profile_id', profileData.id)
                    .order('order_index', { ascending: true });
                
                if (linksError) {
                    console.error('Error fetching links:', linksError);
                } else if (linksData) {
                    setLinks(linksData);
                }
            } else {
                // If profile doesn't exist, we'll create a default state
                setProfile({
                    id: '',
                    username: 'mapid',
                    display_name: 'MAPID',
                    bio: 'Location Intelligence & B2B Solutions',
                    avatar_url: 'https://mapid.co.id/favicon.ico',
                    theme_color: '#10b981'
                });
            }
        } catch (err) {
            console.error('Failed to load data', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!profile) return;
        setProfile({
            ...profile,
            [e.target.name]: e.target.value
        });
    };

    const handleLinkChange = (index: number, field: keyof PublicLink, value: string | boolean) => {
        const newLinks = [...links];
        newLinks[index] = { ...newLinks[index], [field]: value };
        setLinks(newLinks);
    };

    const addNewLink = () => {
        const newLink: PublicLink = {
            id: crypto.randomUUID(), // Temp ID
            title: '',
            url: '',
            is_active: true,
            order_index: links.length,
            isNew: true
        };
        setLinks([...links, newLink]);
    };

    const removeLink = async (index: number) => {
        const linkToRemove = links[index];
        const newLinks = [...links];
        newLinks.splice(index, 1);
        
        // Re-order remaining links
        newLinks.forEach((l, i) => { l.order_index = i; });
        setLinks(newLinks);

        // If it's saved in DB, delete it
        if (!linkToRemove.isNew && profile?.id) {
            await supabase.from('mapid_public_links').delete().eq('id', linkToRemove.id);
        }
    };

    const saveChanges = async () => {
        if (!profile) return;
        setIsSaving(true);
        setSaveMessage('');

        try {
            let profileId = profile.id;
            
            // 1. Save Profile
            if (!profileId) {
                // Create new
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
                // Update existing
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

            // 2. Save Links
            if (profileId) {
                const linksToUpsert = links.map((link, index) => {
                    const payload: any = {
                        profile_id: profileId,
                        title: link.title,
                        url: link.url,
                        is_active: link.is_active,
                        order_index: index
                    };
                    // Only include id if it's not new, or if we want to use the generated one
                    // Actually, let's just use the generated crypto.randomUUID() for new links too!
                    payload.id = link.id; 
                    return payload;
                });

                const { error } = await supabase
                    .from('mapid_public_links')
                    .upsert(linksToUpsert);

                if (error) throw error;
            }

            setSaveMessage('Changes saved successfully!');
            setTimeout(() => setSaveMessage(''), 3000);
            
            // Reload to get fresh DB IDs
            await fetchData();
            
        } catch (err: any) {
            console.error('Error saving:', JSON.stringify(err, null, 2));
            setSaveMessage('Error saving changes: ' + (err.message || JSON.stringify(err)));
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="p-8">Loading setup...</div>;
    }

    return (
        <div className="p-8 max-w-5xl mx-auto h-[calc(100vh-2rem)] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Link2 className="text-emerald-500" />
                        Public Links Setup
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">Configure your Linktree-style public page</p>
                </div>
                
                <div className="flex gap-3">
                    <Link 
                        href={`/l/${profile?.username}`} 
                        target="_blank"
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-md hover:bg-zinc-50 transition"
                    >
                        <ExternalLink size={16} />
                        View Live Page
                    </Link>
                    <button
                        onClick={saveChanges}
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-emerald-500 text-white px-5 py-2 rounded-md hover:bg-emerald-600 transition disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : <><Save size={18} /> Save Changes</>}
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
                                    <label className="block text-xs font-medium text-zinc-500 mb-1">Username (URL Path)</label>
                                    <input 
                                        type="text" 
                                        name="username"
                                        value={profile?.username || ''} 
                                        readOnly
                                        className="w-full bg-zinc-100 border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-500" 
                                    />
                                    <span className="text-[10px] text-zinc-400 mt-1 block">Username cannot be changed currently</span>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-zinc-500 mb-1">Display Name</label>
                                    <input 
                                        type="text" 
                                        name="display_name"
                                        value={profile?.display_name || ''} 
                                        onChange={handleProfileChange}
                                        className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500" 
                                        placeholder="e.g. MAPID"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 mb-1">Bio / Description</label>
                                <textarea 
                                    name="bio"
                                    value={profile?.bio || ''} 
                                    onChange={handleProfileChange}
                                    rows={2}
                                    className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500" 
                                    placeholder="Brief description about your company..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-zinc-500 mb-1">Avatar URL</label>
                                    <input 
                                        type="text" 
                                        name="avatar_url"
                                        value={profile?.avatar_url || ''} 
                                        onChange={handleProfileChange}
                                        className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500" 
                                        placeholder="https://..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-zinc-500 mb-1">Theme Color</label>
                                    <div className="flex gap-2 items-center">
                                        <input 
                                            type="color" 
                                            name="theme_color"
                                            value={profile?.theme_color || '#10b981'} 
                                            onChange={handleProfileChange}
                                            className="h-9 w-12 rounded cursor-pointer p-0.5 border border-zinc-200" 
                                        />
                                        <input 
                                            type="text" 
                                            name="theme_color"
                                            value={profile?.theme_color || '#10b981'} 
                                            onChange={handleProfileChange}
                                            className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm uppercase focus:ring-emerald-500 focus:border-emerald-500" 
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
                                                    className="w-full font-medium bg-white border border-zinc-300 rounded-md px-3 py-1.5 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                                                />
                                            </div>
                                            <div>
                                                <input 
                                                    type="text" 
                                                    value={link.url}
                                                    onChange={(e) => handleLinkChange(idx, 'url', e.target.value)}
                                                    placeholder="https://..."
                                                    className="w-full bg-white border border-zinc-300 rounded-md px-3 py-1.5 text-sm text-zinc-600 focus:ring-emerald-500 focus:border-emerald-500"
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
                        
                        {/* Mobile Phone Mockup */}
                        <div className="w-[300px] mx-auto h-[600px] bg-white rounded-[2.5rem] border-[8px] border-zinc-800 shadow-xl overflow-hidden relative">
                            {/* Notch */}
                            <div className="absolute top-0 inset-x-0 h-6 bg-zinc-800 rounded-b-2xl w-32 mx-auto z-10"></div>
                            
                            {/* Screen Content */}
                            <div className="w-full h-full overflow-y-auto bg-slate-50">
                                <div className="p-6 pt-12 flex flex-col items-center">
                                    {/* Avatar */}
                                    <div 
                                        className="w-20 h-20 rounded-full bg-white shadow-md mb-4 overflow-hidden border-2"
                                        style={{ borderColor: profile?.theme_color || '#10b981' }}
                                    >
                                        {profile?.avatar_url ? (
                                            <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-zinc-200 text-zinc-400">
                                                <User size={32} />
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Name & Bio */}
                                    <h2 className="font-bold text-lg text-zinc-900 mb-1">{profile?.display_name || 'Your Name'}</h2>
                                    <p className="text-sm text-zinc-600 text-center mb-8">{profile?.bio || 'Your bio goes here'}</p>
                                    
                                    {/* Links */}
                                    <div className="w-full space-y-3">
                                        {links.filter(l => l.is_active).map((link, idx) => (
                                            <div 
                                                key={`preview-${idx}`}
                                                className="w-full py-3 px-4 rounded-lg bg-white shadow-sm text-center text-sm font-medium hover:shadow-md transition cursor-pointer border"
                                                style={{ 
                                                    color: profile?.theme_color || '#10b981',
                                                    borderColor: `${profile?.theme_color}30` || '#10b98130' 
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
