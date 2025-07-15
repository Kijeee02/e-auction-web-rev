import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface BidFormProps {
  auctionId: number;
  minimumBid: number;
  minimumIncrement: number;
  onBidPlaced?: () => void;
}

export default function BidForm({ auctionId, minimumBid, minimumIncrement, onBidPlaced }: BidFormProps) {
  const [bidAmount, setBidAmount] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const placeBidMutation = useMutation({
    mutationFn: async (amount: number) => {
      return apiRequest("POST", `/api/auctions/${auctionId}/bids`, {
        amount: amount,
      });
    },

    onSuccess: () => {
      toast({
        title: "Penawaran berhasil!",
        description: "Penawaran Anda telah ditempatkan.",
      });
      setBidAmount("");
      queryClient.invalidateQueries({ queryKey: ["/api/auctions", auctionId] });
      queryClient.invalidateQueries({ queryKey: ["/api/auctions", auctionId, "bids"] });
      onBidPlaced?.();
    },
    onError: (error: any) => {
      toast({
        title: "Penawaran gagal",
        description: error.message || "Terjadi kesalahan saat menempatkan penawaran.",
        variant: "destructive",
      });
    },
  });

  const handleQuickBid = (incrementAmount: number) => {
    const newBid = minimumBid + incrementAmount;
    setBidAmount(newBid.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(bidAmount);

    if (isNaN(amount)) {
      toast({
        title: "Penawaran tidak valid",
        description: "Mohon masukkan nominal yang valid.",
        variant: "destructive",
      });
      return;
    }

    if (amount < minimumBid) {
      toast({
        title: "Penawaran terlalu rendah",
        description: `Penawaran minimum adalah Rp ${minimumBid.toLocaleString('id-ID')}`,
        variant: "destructive",
      });
      return;
    }

    placeBidMutation.mutate(amount);
  };

  const quickBidAmounts = [
    { label: `+Rp ${(minimumIncrement).toLocaleString('id-ID')}`, amount: minimumIncrement },
    { label: `+Rp ${(minimumIncrement * 2).toLocaleString('id-ID')}`, amount: minimumIncrement * 2 },
    { label: `+Rp ${(minimumIncrement * 5).toLocaleString('id-ID')}`, amount: minimumIncrement * 5 },
  ];

  return (
    <div className="space-y-4">
      {/* Quick Bid Buttons */}
      <div className="grid grid-cols-3 gap-2">
        {quickBidAmounts.map((quick, index) => (
          <Button
            key={index}
            variant="outline"
            className="text-sm"
            onClick={() => handleQuickBid(quick.amount)}
            disabled={placeBidMutation.isPending}
          >
            {quick.label}
          </Button>
        ))}
      </div>

      {/* Custom Bid Form */}
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <Input
          type="number"
          placeholder="Masukkan penawaran Anda"
          value={bidAmount}
          onChange={(e) => setBidAmount(e.target.value)}
          min={minimumBid}
          step={minimumIncrement}
          className="flex-1"
          disabled={placeBidMutation.isPending}
        />
        <Button
          type="submit"
          className="bg-primary text-white hover:bg-blue-700 font-semibold px-6"
          disabled={placeBidMutation.isPending || !bidAmount}
        >
          {placeBidMutation.isPending && (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          )}
          Tawar
        </Button>
      </form>

      <p className="text-xs text-gray-600 text-center">
        Minimum penawaran: <span className="font-semibold">
          Rp {minimumBid.toLocaleString('id-ID')}
        </span> (increment Rp {minimumIncrement.toLocaleString('id-ID')})
      </p>
    </div>
  );
}
