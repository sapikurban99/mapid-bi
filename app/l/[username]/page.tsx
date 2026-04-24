import { supabase } from '@/lib/supabaseClient';
import { notFound } from 'next/navigation';
import { ExternalLink, Share2 } from 'lucide-react';
import { Metadata } from 'next';

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
};

// Generate metadata dynamically
export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
    const { username } = await params;
    const { data: profile } = await supabase
        .from('mapid_public_profiles')
        .select('*')
        .eq('username', username)
        .single();

    if (!profile) {
        return { title: 'Not Found' };
    }

    return {
        title: `${profile.display_name} | Links`,
        description: profile.bio,
        icons: {
            icon: profile.avatar_url || 'https://mapid.co.id/favicon.ico'
        }
    };
}

export default async function PublicLinkPage({ params }: { params: Promise<{ username: string }> }) {
    const { username } = await params;
    
    // Fetch profile
    const { data: profile, error: profileError } = await supabase
        .from('mapid_public_profiles')
        .select('*')
        .eq('username', username)
        .single();

    if (profileError || !profile) {
        notFound();
    }

    // Fetch active links
    const { data: links, error: linksError } = await supabase
        .from('mapid_public_links')
        .select('*')
        .eq('profile_id', profile.id)
        .eq('is_active', true)
        .order('order_index', { ascending: true });

    if (linksError) {
        console.error('Error fetching links', linksError);
    }

    const themeColor = profile.theme_color || '#10b981';

    return (
        <div className="min-h-screen relative flex flex-col items-center py-16 px-4 font-sans bg-slate-50">
            {/* Background Accent */}
            <div 
                className="absolute top-0 left-0 right-0 h-64 opacity-20 pointer-events-none"
                style={{ background: `linear-gradient(to bottom, ${themeColor}, transparent)` }}
            ></div>

            <div className="relative z-10 w-full max-w-md flex flex-col items-center">
                {/* Avatar */}
                <div 
                    className="w-24 h-24 rounded-full bg-white shadow-xl mb-6 overflow-hidden border-4"
                    style={{ borderColor: themeColor }}
                >
                    {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-200 text-zinc-400 text-2xl font-bold">
                            {profile.display_name?.charAt(0) || 'U'}
                        </div>
                    )}
                </div>

                {/* Profile Info */}
                <h1 className="text-2xl font-bold text-zinc-900 mb-2 text-center">{profile.display_name}</h1>
                <p className="text-base text-zinc-600 text-center mb-8 max-w-sm">{profile.bio}</p>

                {/* Action Buttons (Optional Share) */}
                <div className="absolute top-4 right-4 sm:fixed sm:top-6 sm:right-6">
                    <button 
                        className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-zinc-600 hover:text-zinc-900 transition hover:shadow-lg"
                        title="Share"
                    >
                        <Share2 size={18} />
                    </button>
                </div>

                {/* Links */}
                <div className="w-full flex flex-col gap-4">
                    {links && links.map((link) => (
                        <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative w-full py-4 px-6 bg-white rounded-xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center justify-between border overflow-hidden"
                            style={{ borderColor: `${themeColor}30` }}
                        >
                            {/* Hover accent line */}
                            <div 
                                className="absolute left-0 top-0 bottom-0 w-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ backgroundColor: themeColor }}
                            ></div>
                            
                            <span className="font-semibold text-zinc-800 text-center flex-1">{link.title}</span>
                            
                            <ExternalLink size={18} className="text-zinc-400 group-hover:text-zinc-700 opacity-50" />
                        </a>
                    ))}
                    
                    {(!links || links.length === 0) && (
                        <p className="text-center text-zinc-500 my-8">No links added yet.</p>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-16 text-center">
                    <a href="https://mapid.co.id" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-600 transition text-sm font-medium">
                        Powered by <img src="https://mapid.co.id/img/mapid_logo_black.png" alt="Mapid" className="h-4 opacity-70 grayscale" />
                    </a>
                </div>
            </div>
        </div>
    );
}
