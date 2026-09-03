import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VisionAI — Image Analysis",
  description:
    "AI-powered image analysis using BLIP image captioning and YOLO object detection.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}