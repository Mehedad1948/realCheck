export default function MarketingLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                <nav>RealCheck Logo | Login</nav> {/* Website specific nav */}
                {children}
                <footer>© 2025 RealCheck</footer> {/* Website specific footer */}
            </body>
        </html>
    )
}
