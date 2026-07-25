"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-context";
import { PhoneNumberModal } from "@/components/phone-number-modal";

export function PhoneCheckWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);

  useEffect(() => {
    // Quick phone number check after user is loaded
    if (!loading && user && !checkingPhone) {
      setCheckingPhone(true);
      
      // Skip phone check for admins and super admins
      if (user.role === 'admin') {
        setShowPhoneModal(false);
        setCheckingPhone(false);
        return;
      }
      
      // Check if user has phone number (fast, no API call needed if in user object)
      if (user.phoneNumber) {
        setShowPhoneModal(false);
        setCheckingPhone(false);
        return;
      }

      // If phone not in user object, do a quick check
      const token = localStorage.getItem("token");
      if (token) {
        fetch("/api/auth/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })
          .then((res) => res.json())
          .then((data) => {
            // Skip phone check for admins
            if (data.user.isAdmin || data.user.role === 'admin' || data.user.role === 'superadmin') {
              setShowPhoneModal(false);
              return;
            }
            if (data.user && !data.user.phoneNumber && !data.user.phone) {
              setShowPhoneModal(true);
            }
          })
          .catch(() => {
            // Silently fail - don't block the app
          })
          .finally(() => {
            setCheckingPhone(false);
          });
      } else {
        setCheckingPhone(false);
      }
    }
  }, [user, loading, checkingPhone]);

  const handlePhoneUpdated = () => {
    setShowPhoneModal(false);
  };

  return (
    <>
      {showPhoneModal && (
        <PhoneNumberModal
          isOpen={showPhoneModal}
          onClose={() => {}} // Can't close until phone is added
          onPhoneUpdated={handlePhoneUpdated}
        />
      )}
      {children}
    </>
  );
}
