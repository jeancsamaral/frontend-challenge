import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student Response - Teachy",
  description: "Interactive student response interface",
};

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Teachy Student
              </h1>
            </div>
            <div className="text-sm text-gray-500">
              Ready to participate
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-screen">
        {children}
      </main>
    </div>
  );
} 