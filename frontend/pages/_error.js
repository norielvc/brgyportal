import React from "react";

function ErrorPage({ statusCode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gray-50 text-center">
      <p className="text-6xl font-black text-gray-900 mb-2">
        {statusCode || "Error"}
      </p>
      <p className="text-gray-600 text-sm sm:text-base max-w-md mb-6">
        {statusCode
          ? "May naganap na error sa server. Paki-refresh ang pahina o subukang muli mamaya."
          : "May naganap na error sa browser. Paki-refresh ang pahina."}
      </p>
      <button
        type="button"
        onClick={() => {
          if (typeof window !== "undefined") window.location.reload();
        }}
        className="px-5 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800"
      >
        I-refresh
      </button>
    </div>
  );
}

ErrorPage.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default ErrorPage;
