'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
    const password = formData.get('password');
    const validPassword = process.env.ADMIN_PASSWORD || 'MAPID2026';

    if (password === validPassword) {
        const cookieStore = await cookies();
        cookieStore.set('bi_auth', 'true', {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        });
    } else {
        return { error: 'Invalid password' };
    }

    redirect('/');
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete('bi_auth');
    redirect('/login');
}
