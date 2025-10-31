import React, {useEffect} from 'react'
import {usePuterStore} from "~/lib/puter";
import {useLocation, useNavigate} from "react-router";

export const meta = () => (
    [
        {title: 'Resumind | Auth' },
        {name: 'Description', content: 'Log into your account'},
    ]
)
const Auth = () => {
    const {isLoading, auth} = usePuterStore();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const next = searchParams.get('next') || "/";
    const navigate = useNavigate();
    useEffect(() => {
        if (auth.isAuthenticated) {
            navigate(next);
        }
    }, [auth.isAuthenticated, next, navigate]);
    return (
       <main className="bg-[url('/images/bg-auth.svg')] bg-cover min-h-screen flex items-center justify-center">
            <div className='gradient-border shadow-lg'>
                <section className="flex flex-col gap-8 bg-white rounded-2xl p-10">
                    <div className="flex flex-col items-center gap-2 text-center">
                        <h1>Welcome</h1>
                        <h2>Log in to continue your job journey</h2>
                    </div>
                    <div>
                        {isLoading ? (
                            <button className="auth-button animate-pulse">Signing you in...</button>
                        ) : (
                            <>
                                {auth.isAuthenticated ? (
                                    <button className="auth-button" onClick={() => auth.signOut()}> <p>Sign Out</p></button>
                                ) : (
                                    <button className="auth-button" onClick={() => auth.signIn()}> <p>Sign In</p></button>
                                )}
                            </>
                        )}
                    </div>
                </section>
            </div>
       </main>
    )
}
export default Auth
