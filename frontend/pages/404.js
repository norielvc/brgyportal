import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gray-50 text-center">
      <p className="text-6xl font-black text-gray-900 mb-2">404</p>
      <p className="text-gray-600 text-sm sm:text-base max-w-md mb-6">
        Hindi mahanap ang pahinang hinahanap mo.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800"
      >
        Bumalik sa home
      </Link>
    </div>
  );
}
