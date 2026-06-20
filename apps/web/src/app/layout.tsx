import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AppProviders } from "@/components/providers/AppProviders";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AppProviders>{children}</AppProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
