"use client";
import { GraduationCap, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <GraduationCap className="w-8 h-8 text-indigo-600" />
          <div className="text-left">
            <p className="font-bold text-gray-900">Training Register</p>
            <p className="text-xs text-gray-500">Gold Rush Group</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Account Under Review</h1>
          <p className="text-sm text-gray-500 mb-6">
            Your account has been created and is awaiting approval from your department head or an administrator.
            You will be able to log in once your account is approved.
          </p>

          <div className="space-y-3 text-left mb-6">
            {[
              "Your account details have been received",
              "Awaiting department head or admin approval",
              "You will be notified when approved",
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${i === 0 ? "bg-green-100" : "bg-gray-100"}`}>
                  {i === 0 ? (
                    <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                  ) : (
                    <span className="text-xs text-gray-400 font-medium">{i + 1}</span>
                  )}
                </div>
                <p className={`text-sm ${i === 0 ? "text-gray-700" : "text-gray-400"}`}>{step}</p>
              </div>
            ))}
          </div>

          <Link
            href="/login"
            className="block w-full py-2.5 text-center border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
