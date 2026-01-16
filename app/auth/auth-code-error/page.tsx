export default function AuthCodeError() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
                <p className="text-slate-600 mb-6">
                    There was a problem signing you in. Please try again.
                </p>
                <a
                    href="/login"
                    className="inline-flex items-center justify-center rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
                >
                    Back to Login
                </a>
            </div>
        </div>
    );
}
