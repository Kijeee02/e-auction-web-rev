
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Upload } from "lucide-react";
import type { Auction } from "@shared/schema";

interface PaymentFormProps {
  auction: Auction;
  onPaymentSubmitted: () => void;
}

export default function PaymentForm({ auction, onPaymentSubmitted }: PaymentFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    paymentMethod: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
    paymentProof: "",
  });

  const paymentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/payments", data);
      if (!res.ok) throw new Error("Failed to submit payment");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment information submitted successfully. Please wait for admin verification.",
      });
      onPaymentSubmitted();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit payment information",
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

    paymentMutation.mutate({
      auctionId: auction.id,
      amount: auction.currentPrice,
      ...formData,
    });
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
            <Label htmlFor="paymentProof">Payment Proof (Image URL)</Label>
            <div className="flex space-x-2">
              <Input
                id="paymentProof"
                value={formData.paymentProof}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentProof: e.target.value }))}
                placeholder="https://example.com/proof.jpg"
              />
              <Button type="button" variant="outline" size="sm">
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Upload your payment proof (receipt, screenshot, etc.)
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
