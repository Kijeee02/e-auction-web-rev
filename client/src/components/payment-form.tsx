
import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Upload, X, Image } from "lucide-react";
import type { Auction } from "@shared/schema";

interface PaymentFormProps {
  auction: Omit<Auction, "imageUrls"> & { imageUrls: string | string[] | null };
  onPaymentSubmitted: () => void;
}

export default function PaymentForm({ auction, onPaymentSubmitted }: PaymentFormProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    paymentMethod: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
    paymentProof: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Convert to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setFormData(prev => ({ ...prev, paymentProof: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setFormData(prev => ({ ...prev, paymentProof: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const paymentMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Sending payment data:", data);
      const res = await apiRequest("POST", "/api/payments", data);
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Payment submission error:", errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          throw new Error(errorText || "Failed to submit payment");
        }
        throw new Error(errorData.message || "Failed to submit payment");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment information submitted successfully. Please wait for admin verification.",
      });
      onPaymentSubmitted();
    },
    onError: (error: Error) => {
      console.error("Payment mutation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit payment information",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.paymentMethod) {
      toast({
        title: "Error",
        description: "Please select a payment method",
        variant: "destructive",
      });
      return;
    }

    if (!formData.paymentProof) {
      toast({
        title: "Error",
        description: "Please upload payment proof or provide image URL",
        variant: "destructive",
      });
      return;
    }

    const paymentData = {
      auctionId: auction.id,
      amount: Number(auction.currentPrice),
      paymentMethod: formData.paymentMethod,
      paymentProof: formData.paymentProof,
      bankName: formData.bankName || null,
      accountNumber: formData.accountNumber || null,
      accountName: formData.accountName || null,
      status: "pending"
    };

    console.log("Submitting payment data:", paymentData);
    paymentMutation.mutate(paymentData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          Payment Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label className="text-sm text-gray-600">Auction Item</Label>
              <p className="font-medium">{auction.title}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Amount to Pay</Label>
              <p className="font-bold text-primary">Rp {Number(auction.currentPrice).toLocaleString('id-ID')}</p>
            </div>
          </div>

          <div>
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="ewallet">E-Wallet</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.paymentMethod === "bank_transfer" && (
            <>
              <div>
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  value={formData.bankName}
                  onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                  placeholder="e.g., BCA, Mandiri, BNI"
                  required
                />
              </div>
              <div>
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                  placeholder="Enter account number"
                  required
                />
              </div>
              <div>
                <Label htmlFor="accountName">Account Name</Label>
                <Input
                  id="accountName"
                  value={formData.accountName}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountName: e.target.value }))}
                  placeholder="Enter account holder name"
                  required
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="paymentProof">Payment Proof</Label>
            <div className="space-y-2">
              {/* File Upload */}
              <div className="flex space-x-2">
                <Input
                  ref={fileInputRef}
                  id="paymentProof"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {selectedFile ? "Change Image" : "Upload Image"}
                </Button>
                {selectedFile && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={removeFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Preview */}
              {previewUrl && (
                <div className="relative w-full max-w-xs">
                  <img
                    src={previewUrl}
                    alt="Payment proof preview"
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <div className="absolute top-2 right-2">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={removeFile}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              {/* URL Input Alternative */}
              <div className="relative">
                <Input
                  placeholder="Or paste image URL"
                  value={formData.paymentProof.startsWith('data:') ? '' : formData.paymentProof}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, paymentProof: e.target.value }));
                    if (e.target.value && !e.target.value.startsWith('data:')) {
                      setPreviewUrl(e.target.value);
                      setSelectedFile(null);
                    }
                  }}
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Upload an image file (max 5MB) or paste an image URL. Supported formats: JPG, PNG, GIF
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={paymentMutation.isPending}
          >
            {paymentMutation.isPending ? "Submitting..." : "Submit Payment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
