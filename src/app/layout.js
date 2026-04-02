import "./globals.css";
import MuiProvider from "@/theme/MuiProvider";

export const metadata = {
  title: "RentEasy — Apartment Rental Booking",
  description: "Admin dashboard for apartment rental management",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <MuiProvider>{children}</MuiProvider>
      </body>
    </html>
  );
}
