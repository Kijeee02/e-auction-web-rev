import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle, CreditCard, FileText } from "lucide-react";
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
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {getStatusIcon(payment.status)}
            <div className="ml-3">
              <h3 className="font-medium text-gray-900">Status Pembayaran</h3>
              <p className="text-sm text-gray-600">
                Jumlah: Rp {Number(payment.amount).toLocaleString('id-ID')}
              </p>
              <p className="text-sm text-gray-500">
                Disubmit: {new Date(payment.createdAt).toLocaleDateString('id-ID')}
              </p>
            </div>
          </div>
          <Badge variant={getStatusVariant(payment.status)}>
            {getStatusText(payment.status)}
          </Badge>
        </div>

        {payment.status === "rejected" && (
          <div className="mt-3 p-3 bg-red-50 rounded-lg">
            <p className="text-sm text-red-700">
              ❌ Pembayaran ditolak oleh admin.
            </p>
            {payment.notes && (
              <p className="text-sm text-red-700 mt-1">
                <strong>Alasan Penolakan:</strong> {payment.notes}
              </p>
            )}
            {payment.verifiedAt && (
              <p className="text-sm text-red-600 mt-1">
                Ditolak pada: {new Date(typeof payment.verifiedAt === 'number' ? payment.verifiedAt * 1000 : payment.verifiedAt).toLocaleDateString('id-ID')}
              </p>
            )}
            <p className="text-sm text-blue-700 mt-2 font-medium">
              💡 Anda dapat melakukan pembayaran ulang dengan bukti pembayaran yang baru.
            </p>
          </div>
        )}

        {payment.status === "verified" && (
          <div className="mt-3 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700">
              ✅ Pembayaran telah berhasil divalidasi dan diproses oleh admin.
            </p>
            {payment.verifiedAt && (
              <p className="text-sm text-green-600 mt-1">
                Divalidasi pada: {new Date(typeof payment.verifiedAt === 'number' ? payment.verifiedAt * 1000 : payment.verifiedAt).toLocaleDateString('id-ID')}
              </p>
            )}
            {payment.notes && (
              <p className="text-sm text-green-600 mt-1">
                <strong>Catatan Admin:</strong> {payment.notes}
              </p>
            )}
            
            {/* Admin Documents Section */}
            {(payment.invoiceDocument || payment.releaseLetterDocument || payment.handoverDocument) && (
              <div className="mt-4 border-t border-green-200 pt-3">
                <h4 className="text-sm font-medium text-green-800 mb-2">📄 Dokumen dari Admin:</h4>
                <div className="space-y-2">
                  {payment.invoiceDocument && (
                    <div className="flex items-center justify-between bg-white p-2 rounded border">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="text-sm text-gray-700">Invoice/Kwitansi Pembayaran</span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => window.open(payment.invoiceDocument, '_blank')}
                          className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                        >
                          Lihat
                        </button>
                        <button
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = payment.invoiceDocument!;
                            link.download = `invoice-auction-${payment.auctionId}.${payment.invoiceDocument!.includes('data:image') ? 'jpg' : 'pdf'}`;
                            link.click();
                          }}
                          className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {payment.releaseLetterDocument && (
                    <div className="flex items-center justify-between bg-white p-2 rounded border">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="text-sm text-gray-700">Surat Pelepasan Kendaraan</span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => window.open(payment.releaseLetterDocument, '_blank')}
                          className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                        >
                          Lihat
                        </button>
                        <button
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = payment.releaseLetterDocument!;
                            link.download = `surat-pelepasan-auction-${payment.auctionId}.${payment.releaseLetterDocument!.includes('data:image') ? 'jpg' : 'pdf'}`;
                            link.click();
                          }}
                          className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {payment.handoverDocument && (
                    <div className="flex items-center justify-between bg-white p-2 rounded border">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="text-sm text-gray-700">Bukti Serah Terima</span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => window.open(payment.handoverDocument, '_blank')}
                          className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                        >
                          Lihat
                        </button>
                        <button
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = payment.handoverDocument!;
                            link.download = `bukti-serah-terima-auction-${payment.auctionId}.${payment.handoverDocument!.includes('data:image') ? 'jpg' : 'pdf'}`;
                            link.click();
                          }}
                          className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {payment.status === "pending" && (
          <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-700">
              ⏳ Pembayaran Anda sedang dalam proses validasi oleh admin. Harap tunggu konfirmasi lebih lanjut.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}