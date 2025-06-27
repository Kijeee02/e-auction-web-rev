import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { AuctionWithDetails, Bid } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Navbar from "@/components/navbar";
import CountdownTimer from "@/components/countdown-timer";
import BidForm from "@/components/bid-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, MapPin, Star, Heart, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AuctionDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: auction, isLoading } = useQuery<AuctionWithDetails>({
    queryKey: ["/api/auctions", id],
    enabled: !!id,
  });

  const { data: bids = [], refetch: refetchBids } = useQuery<(Bid & { bidder: any })[]>({
    queryKey: ["/api/auctions", id, "bids"],
    enabled: !!id,
  });

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

  // Auto-refresh bids every 5 seconds for simulated real-time
  useEffect(() => {
    if (!auction || auction.status !== "active") return;

    const interval = setInterval(() => {
      refetchBids();
    }, 5000);

    return () => clearInterval(interval);
  }, [auction, refetchBids]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-200 rounded"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Auction Not Found</h1>
            <p className="text-gray-600 mb-6">The auction you're looking for doesn't exist.</p>
            <Button onClick={() => setLocation("/")}>
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentBid = parseFloat(auction.currentPrice);
  const minimumNextBid = currentBid + parseFloat(auction.minimumIncrement);
  const highestBid = bids.length > 0 ? bids[0] : null;
  const isAuctionActive = auction.status === "active" && new Date() < new Date(auction.endTime);
  const isOwnAuction = user?.id === auction.sellerId;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Beranda
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div>
            <div className="aspect-square rounded-lg overflow-hidden mb-4">
              <img
                src={auction.imageUrl || "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=600&fit=crop"}
                alt={auction.title}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Product Info */}
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
                    <span className="font-medium ml-2">{auction.category.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Lokasi:</span>
                    <div className="flex items-center ml-2">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="font-medium">{auction.location}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Penjual:</span>
                    <div className="flex items-center ml-2">
                      <Star className="h-4 w-4 mr-1 text-yellow-500" />
                      <span className="font-medium">{auction.seller.firstName} {auction.seller.lastName}</span>
                    </div>
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
            {/* Auction Header */}
            <div>
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
            </div>

            {/* Current Bid */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <p className="text-gray-600 mb-2">Penawaran Tertinggi Saat Ini</p>
                  <p className="text-4xl font-bold text-primary">
                    Rp {currentBid.toLocaleString('id-ID')}
                  </p>
                  {highestBid && (
                    <p className="text-sm text-gray-600 mt-1">
                      oleh <span className="font-medium">user_****{highestBid.bidder.id}</span>
                    </p>
                  )}
                </div>

                {isAuctionActive && (
                  <div className="text-center mb-6">
                    <p className="text-gray-600 mb-2">Waktu Berakhir</p>
                    <CountdownTimer endTime={auction.endTime} />
                  </div>
                )}

                {/* Bidding Form */}
                {isAuctionActive && !isOwnAuction && user && (
                  <BidForm
                    auctionId={auction.id}
                    minimumBid={minimumNextBid}
                    minimumIncrement={parseFloat(auction.minimumIncrement)}
                    onBidPlaced={() => {
                      refetchBids();
                      queryClient.invalidateQueries({ queryKey: ["/api/auctions", id] });
                    }}
                  />
                )}

                {!user && (
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">Masuk untuk mengikuti lelang</p>
                    <Button onClick={() => setLocation("/auth")}>
                      Masuk atau Daftar
                    </Button>
                  </div>
                )}

                {isOwnAuction && (
                  <div className="text-center text-gray-600">
                    <p>Ini adalah lelang Anda sendiri</p>
                  </div>
                )}

                {!isAuctionActive && (
                  <div className="text-center">
                    <Badge variant="secondary" className="text-lg px-4 py-2">
                      Lelang Telah Berakhir
                    </Badge>
                    {auction.winnerId && (
                      <p className="text-gray-600 mt-2">
                        Dimenangkan oleh user_****{auction.winnerId}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bid History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Riwayat Penawaran ({bids.length} penawaran)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bids.length === 0 ? (
                  <p className="text-gray-600 text-center py-4">Belum ada penawaran</p>
                ) : (
                  <ScrollArea className="h-60">
                    <div className="space-y-3">
                      {bids.map((bid, index) => (
                        <div
                          key={bid.id}
                          className={`flex justify-between items-center py-2 px-3 rounded-lg ${
                            index === 0 ? "bid-highlight" : "bg-gray-50"
                          }`}
                        >
                          <div>
                            <span className={`font-medium ${index === 0 ? "text-green-800" : "text-gray-700"}`}>
                              user_****{bid.bidder.id}
                            </span>
                            <span className="text-sm text-gray-600 ml-2">
                              {new Date(bid.createdAt).toLocaleString('id-ID')}
                            </span>
                          </div>
                          <span className={`font-bold ${index === 0 ? "text-green-800" : "text-gray-700"}`}>
                            Rp {parseFloat(bid.amount).toLocaleString('id-ID')}
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
