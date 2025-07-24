import { Link } from "wouter";
import { AuctionWithDetails } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Users } from "lucide-react";
import CountdownTimer from "./countdown-timer";
import VehicleInfoModal from "./vehicle-info-modal";

interface AuctionCardProps {
  auction: AuctionWithDetails;
}

export default function AuctionCard({ auction }: AuctionCardProps) {
  const currentPrice = Number(auction.currentPrice) || 0;
  const startingPrice = Number(auction.startingPrice) || 0;
  const bidCount = auction._count?.bids || 0;
  const now = new Date();
  const endTime = new Date(auction.endTime);
  const isActive = auction.status === "active" && now < endTime;
  const hasExpired = now >= endTime;

  // Show "Berakhir" status if auction has expired, regardless of database status
  const displayStatus = hasExpired && auction.status === "active" ? "ended" : auction.status;

  return (
    <Card className="auction-card">
      <div className="relative">
        <img
          src={auction.imageUrl || "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop"}
          alt={auction.title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-3 right-3">
          <Badge className={`status-${auction.status}`}>
            {auction.status === "active" ? "Aktif" : auction.status === "ended" ? "Berakhir" : "Dibatalkan"}
          </Badge>
        </div>
      </div>

      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {auction.title}
          </h3>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {auction.description}
        </p>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm">Harga Awal</span>
            <span className="font-semibold">
              Rp {startingPrice.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm">Penawaran Tertinggi</span>
            <span className="text-2xl font-bold text-primary">
              Rp {currentPrice.toLocaleString('id-ID')}
            </span>
          </div>

          {isActive && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Berakhir dalam
              </span>
              <CountdownTimer endTime={auction.endTime.toString()} compact />
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-600 flex items-center">
              <Users className="h-4 w-4 mr-1" />
              {bidCount} penawaran
            </span>
            <span className="text-sm text-gray-600 flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              {auction.location}
            </span>
          </div>

          <VehicleInfoModal auction={auction} />

          <Link href={`/auction/${auction.id}`}>
            <Button className="w-full bg-primary text-white hover:bg-blue-700 font-semibold">
              {isActive ? "Ikut Lelang" : "Lihat Detail"}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}