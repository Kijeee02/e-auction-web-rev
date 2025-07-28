import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { AuctionWithDetails, Bid } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Navbar from "@/components/navbar";
import CountdownTimer from "@/components/countdown-timer";
import BidForm from "@/components/bid-form";
import VehicleInfoModal from "@/components/vehicle-info-modal";
import PaymentForm from "@/components/payment-form";
import PaymentStatus from "@/components/payment-status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, MapPin, Heart, Share2, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AuctionDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [paymentStatus, setPaymentStatus] = useState<"loading" | "not_submitted" | "submitted">("loading");

  // Load auction details
  const {
    data: auction,
    isLoading: loadingAuction,
  } = useQuery<AuctionWithDetails>({
    queryKey: ["/api/auctions", id],
    queryFn: async () => {
      const res = await fetch(`/api/auctions/${id}`);
      if (!res.ok) throw new Error("Gagal memuat data auction");
      return res.json();
    },
    enabled: !!id,
  });

  // Load bids with bidder info
  const {
    data: bids = [],
    isLoading: loadingBids,
    refetch: refetchBids,
  } = useQuery<(Bid & { bidder: any })[]>({
    queryKey: ["/api/auctions", id, "bids"],
    queryFn: async () => {
      const res = await fetch(`/api/auctions/${id}/bids`);
      if (!res.ok) throw new Error("Gagal memuat bids");
      return res.json();
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (!auction) return;

    if (auction.status === "ended" && auction.winnerId === user?.id) {
      queryClient.fetchQuery({
        queryKey: [`/api/payments/auction/${auction.id}`],
        queryFn: async () => {
          try {
            const res = await fetch(`/api/payments/auction/${auction.id}`);
            if (!res.ok) {
              setPaymentStatus("not_submitted");
              return null;
            }
            setPaymentStatus("submitted");
            return res.json();
          } catch (error) {
            setPaymentStatus("not_submitted");
            return null;
          }
        },
      }).catch(() => setPaymentStatus("not_submitted"));
    } else {
      setPaymentStatus("not_submitted");
    }
  }, [auction, user, id, queryClient]);

  // Watchlist mutation
  const watchlistMutation = useMutation({
    mutationFn: async (action: "add" | "remove") => {
      const method = action === "add" ? "POST" : "DELETE";
      return apiRequest(method, `/api/user/watchlist/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Watchlist updated",
        description: "Auction watchlist status updated successfully",
      });
    },
  });

  // Poll bids every 5s if auction is active and check for expiration
  useEffect(() => {
    if (!auction) return;

    const interval = setInterval(() => {
      refetchBids();

      // Always refresh auction data to get latest status
      queryClient.invalidateQueries({ queryKey: ["/api/auctions", id] });

      // Check if auction has expired client-side
      const now = new Date();
      const endTime = new Date(auction.endTime);

      if (now >= endTime && auction.status === "active") {
        console.log("Auction has expired, waiting for server to auto-end it");
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [auction, refetchBids, id, queryClient]);

  if (loadingAuction) {
    return <div className="min-h-screen bg-gray-50">Loading...</div>;
  }
  if (!auction) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold">Auction Not Found</h1>
          <Button onClick={() => setLocation("/")}>Kembali</Button>
        </div>
      </div>
    );
  }

  const currentBid = Number(auction.currentPrice) || 0;
  const minimumIncrement = Number(auction.minimumIncrement) || 0;
  const minimumNextBid = currentBid + minimumIncrement;
  const highestBid = bids[0] ?? null;
  const isAuctionActive = auction.status === "active" && new Date() < new Date(auction.endTime);
  const isWinner = user && auction.winnerId === user.id;
  const shouldShowPayment = isWinner && auction.status === "ended";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => setLocation("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />Kembali ke Beranda
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
          {/* Detail Produk */}
          <div>
            <div className="aspect-square rounded-lg overflow-hidden mb-4">
              <img
                src={auction.imageUrl || "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=600&fit=crop"}
                alt={auction.title}
                className="w-full h-full object-cover"
              />
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Detail Produk</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Kondisi:</span>
                    <span className="font-medium ml-2">{auction.condition}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Kategori:</span>
                    <span className="font-medium ml-2">{auction.category?.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Lokasi:</span>
                    <div className="flex items-center ml-2">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="font-medium">{auction.location}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Harga Awal:</span>
                    <span className="font-medium ml-2">Rp {currentBid.toLocaleString('id-ID')}</span>
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Deskripsi</h4>
                  <p className="text-sm text-gray-600">{auction.description}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bidding Section */}
          <div className="space-y-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{auction.title}</h1>
                <Badge className={auction.status === "active" ? "status-active" : "status-ended"}>
                  {auction.status === "active" ? "Aktif" : "Berakhir"}
                </Badge>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => watchlistMutation.mutate("add")}
                  disabled={watchlistMutation.isPending}
                >
                  <Heart className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-600 mb-2">Penawaran Tertinggi Saat Ini</p>
                <p className="text-4xl font-bold text-primary">Rp {currentBid.toLocaleString('id-ID')}</p>
                {highestBid && (
                  <p className="text-sm text-gray-600 mt-1">
                    oleh {highestBid.bidder?.firstName} {highestBid.bidder?.lastName}
                  </p>
                )}
              </CardContent>
            </Card>

            {isAuctionActive && (
              <div className="text-center mb-6">
                <p className="text-gray-600 mb-2">Waktu Berakhir</p>
                <CountdownTimer endTime={new Date(auction.endTime).toISOString()} />
              </div>
            )}

            <VehicleInfoModal auction={auction} />

            {shouldShowPayment && (
              <PaymentForm
                auction={auction}
                onPaymentSubmitted={() => {
                  queryClient.invalidateQueries({ queryKey: [`/api/payments/auction/${id}`] });
                }}
              />
            )}

            {isWinner && auction.status === "ended" && (
              <PaymentStatus auctionId={auction.id} />
            )}

            {isAuctionActive && user && (
              <BidForm
                auctionId={auction.id}
                minimumBid={minimumNextBid}
                minimumIncrement={minimumIncrement}
                onBidPlaced={() => {
                  refetchBids();
                  queryClient.invalidateQueries({ queryKey: ["/api/auctions", id] });
                }}
              />
            )}

            {!user && (
              <div className="text-center">
                <p className="text-gray-600 mb-4">Masuk untuk mengikuti lelang</p>
                <Button onClick={() => setLocation("/auth")}>Masuk atau Daftar</Button>
              </div>
            )}

            {!isAuctionActive && (
              <div className="text-center">
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  Lelang Telah Berakhir
                </Badge>
                {auction.winnerId && highestBid && (
                  <Card className="mt-4 bg-green-50 border-green-200">
                    <CardContent className="p-4 text-center">
                      <h3 className="font-semibold text-green-800 mb-2">🏆 Pemenang Lelang</h3>
                      <p className="text-green-700">
                        <span className="font-medium">
                          {highestBid.bidder?.firstName} {highestBid.bidder?.lastName}
                        </span>
                      </p>
                      <p className="text-green-600 text-sm mt-1">
                        Harga Final: Rp {Number(auction.currentPrice).toLocaleString('id-ID')}
                      </p>
                    </CardContent>
                  </Card>
                )}
                {!auction.winnerId && (
                  <p className="text-gray-600 mt-2">Tidak ada pemenang (tidak ada penawaran)</p>
                )}
              </div>
            )}

            {/* Payment Form or Status */}
            {auction.status === "ended" && auction.winnerId === user?.id && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Pembayaran
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {paymentStatus === "loading" ? (
                    <div>Loading payment status...</div>
                  ) : paymentStatus === "not_submitted" ? (
                    <PaymentForm
                      auction={auction}
                      onPaymentSubmitted={() => {
                        setPaymentStatus("submitted");
                        queryClient.invalidateQueries({
                          queryKey: [`/api/payments/auction/${auction.id}`],
                        });
                      }}
                    />
                  ) : (
                    <PaymentStatus auctionId={auction.id} />
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Riwayat Penawaran ({bids.length} penawaran)</CardTitle>
              </CardHeader>
              <CardContent>
                {bids.length === 0 ? (
                  <p className="text-gray-600 text-center py-4">Belum ada penawaran</p>
                ) : (
                  <ScrollArea className="h-60">
                    <div className="space-y-3">
                      {bids.map((bid, index) => (
                        <div key={bid.id} className={`flex justify-between items-center py-2 px-3 rounded-lg ${index === 0 ? "bid-highlight" : "bg-gray-50"}`}>
                          <div>
                            <span className={`font-medium ${index === 0 ? "text-green-800" : "text-gray-700"}`}>
                              {bid.bidder?.firstName} {bid.bidder?.lastName}
                            </span>
                            <span className="text-sm text-gray-600 ml-2">
                              {new Date(bid.createdAt).toLocaleString('id-ID')}
                            </span>
                          </div>
                          <span className={`font-bold ${index === 0 ? "text-green-800" : "text-gray-700"}`}>
                            Rp{Number(bid.amount ?? 0).toLocaleString('id-ID')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}