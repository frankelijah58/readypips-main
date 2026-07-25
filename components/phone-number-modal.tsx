"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Phone, X } from "lucide-react";

interface PhoneNumberModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onPhoneUpdated?: () => void;
  userEmail?: string;
}

export function PhoneNumberModal({ 
  isOpen, 
  onClose, 
  onPhoneUpdated,
  userEmail 
}: PhoneNumberModalProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    // Prevent body scroll when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber || phoneNumber.trim().length < 10) {
      toast.error("Please enter a valid phone number (minimum 10 digits)");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/auth/update-phone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phoneNumber: phoneNumber.trim() }),
      });

      if (response.ok) {
        toast.success("✅ Phone number added successfully!");
        setCanClose(true);
        
        // Call the callback if provided
        if (onPhoneUpdated) {
          onPhoneUpdated();
        }
        
        // Reload to update user context
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update phone number");
      }
    } catch (error) {
      console.error("Phone update error:", error);
      toast.error("Error updating phone number");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-md w-full mx-4 p-8 relative">
        {/* Only show close button after phone is added */}
        {canClose && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        )}

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Phone className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Add Your Phone Number
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            To complete your registration and access all features, please provide your phone number.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <Input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+254 712 345 678"
              className="w-full"
              disabled={loading}
              required
              minLength={10}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Include country code (e.g., +254 for Kenya)
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> Once set, your phone number cannot be changed. Please ensure it&apos;s correct.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            disabled={loading || phoneNumber.trim().length < 10}
          >
            {loading ? "Saving..." : "Continue"}
          </Button>
        </form>

        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
          Logged in as: {userEmail}
        </p>
      </div>
    </div>
  );
}
