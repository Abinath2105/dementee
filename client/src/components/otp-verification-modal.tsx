import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";

interface OtpVerificationModalProps {
  email: string;
  isOpen: boolean;
  onClose: () => void;
}

export function OtpVerificationModal({ email, isOpen, onClose }: OtpVerificationModalProps) {
  const { verifyOtpMutation, resendOtpMutation } = useAuth();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      inputRefs.current[0]?.focus();
    }
  }, [isOpen]);

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    
    if (code.length !== 6) {
      return;
    }

    verifyOtpMutation.mutate({ email, code }, {
      onSuccess: () => {
        onClose();
      }
    });
  };

  const handleResend = () => {
    resendOtpMutation.mutate({ email });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <div className="text-center mb-6">
            <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
            <DialogTitle className="text-xl font-bold">Verify Your Email</DialogTitle>
            <p className="text-gray-600 mt-2">
              We've sent a verification code to {email}
            </p>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
              Enter 6-digit verification code
            </label>
            <div className="flex justify-center space-x-2">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-xl font-bold"
                />
              ))}
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={verifyOtpMutation.isPending || otp.join("").length !== 6}
          >
            {verifyOtpMutation.isPending ? "Verifying..." : "Verify Email"}
          </Button>
          
          <div className="text-center">
            <Button 
              type="button" 
              variant="link" 
              onClick={handleResend}
              disabled={resendOtpMutation.isPending}
            >
              {resendOtpMutation.isPending ? "Sending..." : "Didn't receive code? Resend"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
