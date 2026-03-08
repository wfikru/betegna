import { useState } from "react";
import { api } from "@/api/firebaseClient";
import { useAuth } from "@/lib/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";

/**
 * @param {Object} props
 * @param {boolean} props.open
 * @param {Function} props.onOpenChange
 * @param {"task" | "user" | "review" | "message"} props.itemType
 * @param {string} props.itemId
 * @param {string} props.reportedUserEmail
 * @param {string} [props.itemTitle]
 */
export default function ReportDialog({ open, onOpenChange, itemType, itemId, reportedUserEmail, itemTitle }) {
  const { user } = useAuth();
  const [reason, setReason] = useState("spam");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      await api.entities.Report.create({
        reporter_email: user.email,
        reported_item_type: itemType,
        reported_item_id: itemId,
        reported_user_email: reportedUserEmail,
        reason,
        description: description.trim(),
        status: "pending",
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setDescription("");
        setReason("spam");
        onOpenChange(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to submit report:", err);
      alert("Failed to submit report. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Report {itemType === "user" ? "User" : "Content"}
          </DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-semibold text-gray-900">Report Submitted</p>
            <p className="text-sm text-gray-600 mt-1">Thank you. We'll review this report.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {itemTitle && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600 truncate">Reporting: <span className="font-medium text-gray-900">{itemTitle}</span></p>
              </div>
            )}

            <div>
              <Label>Reason</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="inappropriate">Inappropriate Content</SelectItem>
                  <SelectItem value="fraud">Fraud or Scam</SelectItem>
                  <SelectItem value="harassment">Harassment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Additional Details (optional)</Label>
              <Textarea
                placeholder="Provide more context about this report..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="mt-1"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">{description.length}/500</p>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                {submitting ? "Submitting..." : "Submit Report"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
