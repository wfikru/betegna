import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Shield } from "lucide-react";
import { useAppMode } from "@/lib/AppModeContext";

export default function Legal() {
  const navigate = useNavigate();
  const { isTaskerMode } = useAppMode();

  return (
    <div className={`min-h-screen pb-24 md:pb-8 ${isTaskerMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 dark:bg-slate-950"}`}>
      {isTaskerMode ? (
        <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-teal-900 text-white py-10 border-b border-indigo-800/60">
          <div className="max-w-4xl mx-auto px-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-indigo-200 hover:text-white text-sm mb-3"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <h1 className="text-3xl font-black mb-1">Legal Information</h1>
            <p className="text-indigo-200 text-base">Tasker Pro terms of service & privacy policies</p>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white py-10">
          <div className="max-w-4xl mx-auto px-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-slate-300 hover:text-white text-sm mb-3"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <h1 className="text-3xl font-black mb-1">Legal Information</h1>
            <p className="text-slate-200 text-base">Our policies and terms of service</p>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-6">

      <div className="space-y-4">
        <Card className="border border-gray-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-600" />
              Privacy Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p>
              <strong>Last Updated:</strong> March 2026
            </p>
            <p>
              Betegna ("we", "our", or "us") respects your privacy and is committed to protecting your personal information.
            </p>
            
            <h3 className="font-semibold text-gray-900 mt-4">Information We Collect</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Account information (name, email, phone number)</li>
              <li>Profile information (bio, location, skills, ratings)</li>
              <li>Task and offer data you create</li>
              <li>Messages exchanged through our platform</li>
              <li>Device and usage information for app functionality</li>
            </ul>

            <h3 className="font-semibold text-gray-900 mt-4">How We Use Your Information</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide and improve our task marketplace service</li>
              <li>To facilitate connections between task posters and taskers</li>
              <li>To send notifications about offers, messages, and account activity</li>
              <li>To maintain platform safety and prevent fraud</li>
            </ul>

            <h3 className="font-semibold text-gray-900 mt-4">Data Sharing</h3>
            <p>
              We do not sell your personal information. Your profile information is visible to other users to facilitate the marketplace. We may share data with service providers necessary to operate our platform (Firebase/Google Cloud).
            </p>

            <h3 className="font-semibold text-gray-900 mt-4">Your Rights</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Access and update your profile information anytime</li>
              <li>Delete your account and associated data through Profile settings</li>
              <li>Control notification preferences</li>
              <li>Request a copy of your data by contacting support</li>
            </ul>

            <h3 className="font-semibold text-gray-900 mt-4">Data Security</h3>
            <p>
              We use industry-standard security measures including Firebase Authentication, encrypted connections, and secure cloud storage to protect your information.
            </p>

            <h3 className="font-semibold text-gray-900 mt-4">Contact Us</h3>
            <p>
              For privacy questions or requests, email us at: <a href="mailto:privacy@betegna.app" className="text-green-700 underline">privacy@betegna.app</a>
            </p>
          </CardContent>
        </Card>

        <Card className="border border-gray-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-green-600" />
              Terms of Service
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p>
              <strong>Last Updated:</strong> March 2026
            </p>
            <p>
              By using Betegna, you agree to these Terms of Service. Please read them carefully.
            </p>

            <h3 className="font-semibold text-gray-900 mt-4">Account Responsibilities</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>You must be at least 18 years old to use Betegna</li>
              <li>You are responsible for maintaining account security</li>
              <li>You must provide accurate and truthful information</li>
              <li>One account per person</li>
            </ul>

            <h3 className="font-semibold text-gray-900 mt-4">Acceptable Use</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Use the platform lawfully and respectfully</li>
              <li>Do not post fraudulent, misleading, or illegal content</li>
              <li>Do not harass, threaten, or abuse other users</li>
              <li>Do not attempt to circumvent platform fees or payments</li>
              <li>Do not spam or use the platform for unrelated commercial purposes</li>
            </ul>

            <h3 className="font-semibold text-gray-900 mt-4">Task Posting and Offers</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Task posters are responsible for providing clear descriptions</li>
              <li>Taskers must deliver services as agreed</li>
              <li>Payment terms and conditions must be honored</li>
              <li>Reviews should be honest and based on actual experiences</li>
            </ul>

            <h3 className="font-semibold text-gray-900 mt-4">Content and Moderation</h3>
            <p>
              We reserve the right to remove content or suspend accounts that violate these terms. Users can report inappropriate content or behavior through the platform.
            </p>

            <h3 className="font-semibold text-gray-900 mt-4">Limitation of Liability</h3>
            <p>
              Betegna is a marketplace platform. We connect task posters with taskers but are not responsible for the quality of services, disputes between users, or any damages arising from transactions. Users engage with each other at their own risk.
            </p>

            <h3 className="font-semibold text-gray-900 mt-4">Changes to Terms</h3>
            <p>
              We may update these terms periodically. Continued use of the platform after changes constitutes acceptance of the updated terms.
            </p>

            <h3 className="font-semibold text-gray-900 mt-4">Contact</h3>
            <p>
              Questions about these terms? Contact us at: <a href="mailto:support@betegna.app" className="text-green-700 underline">support@betegna.app</a>
            </p>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
