
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle, CreditCard } from "lucide-react";
import type { Payment } from "@shared/schema";

interface PaymentStatusProps {
  auctionId: number;
}

export default function PaymentStatus({ auctionId }: PaymentStatusProps) {
  const { data: payment, isLoading } = useQuery<Payment>({
    queryKey: [`/api/payments/auction/${auctionId}`],
    queryFn: async () => {
      const res = await fetch(`/api/payments/auction/${auctionId}`);
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error("Failed to fetch payment");
      }
      return res.json();
    },
  });

  if (isLoading) {
    return <div>Loading payment status...</div>;
  }

  if (!payment) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "verified":
        return "default" as const;
      case "rejected":
        return "destructive" as const;
      default:
        return "secondary" as const;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "verified":
        return "Verified";
      case "rejected":
        return "Rejected";
      default:
        return "Pending Verification";
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          Payment Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Status:</span>
            <div className="flex items-center space-x-2">
              {getStatusIcon(payment.status)}
              <Badge variant={getStatusVariant(payment.status)}>
                {getStatusText(payment.status)}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Amount:</span>
            <span className="font-bold">Rp {Number(payment.amount).toLocaleString('id-ID')}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Payment Method:</span>
            <span className="capitalize">{payment.paymentMethod.replace('_', ' ')}</span>
          </div>
          
          {payment.paymentMethod === "bank_transfer" && payment.bankName && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Bank:</span>
                <span>{payment.bankName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Account:</span>
                <span>{payment.accountNumber}</span>
              </div>
            </>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Submitted:</span>
            <span className="text-sm">{new Date(payment.createdAt).toLocaleDateString('id-ID')}</span>
          </div>
          
          {payment.verifiedAt && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Verified:</span>
              <span className="text-sm">{new Date(payment.verifiedAt).toLocaleDateString('id-ID')}</span>
            </div>
          )}
          
          {payment.paymentProof && (
            <div className="mt-3">
              <span className="text-sm font-medium text-gray-700">Payment Proof:</span>
              <div className="mt-2">
                <img
                  src={payment.paymentProof}
                  alt="Payment proof"
                  className="max-w-xs h-32 object-cover rounded-lg border cursor-pointer"
                  onClick={() => window.open(payment.paymentProof, '_blank')}
                />
              </div>
            </div>
          )}

          {payment.notes && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Admin Notes:</span>
              <p className="text-sm text-gray-600 mt-1">{payment.notes}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
