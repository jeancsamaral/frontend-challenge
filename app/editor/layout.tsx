import type { Metadata } from "next";
import ProtectedRoute from "../wrappers/ProtectedRoute";

export const metadata: Metadata = {
  title: "Slide Editor - Interactive Presentations",
  description: "Create and edit interactive presentations with real-time student engagement",
};

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="h-full bg-gray-100">
        <main className="flex-1 h-full">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
} 