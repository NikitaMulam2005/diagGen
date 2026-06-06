import "./globals.css";

export const metadata = {
  title: "AI Block Diagram Generator",
  description: "Generate engineering block diagrams from natural language",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}