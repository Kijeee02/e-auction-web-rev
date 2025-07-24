
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileText, Calendar, Hash, Settings, CreditCard, Info } from "lucide-react";
import { AuctionWithDetails } from "@shared/schema";

interface VehicleInfoModalProps {
  auction: AuctionWithDetails;
}

export default function VehicleInfoModal({ auction }: VehicleInfoModalProps) {
  // Check if this is a vehicle (Motor or Mobil) based on category
  const isVehicle = auction.category?.name === "Motor" || auction.category?.name === "Mobil";
  
  if (!isVehicle) {
    return null;
  }

  const hasVehicleInfo = auction.productionYear || 
                        auction.plateNumber || 
                        auction.chassisNumber || 
                        auction.engineNumber || 
                        auction.documentInfo;

  if (!hasVehicleInfo) {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <FileText className="h-4 w-4 mr-2" />
          Lihat Dokumen/Info {auction.category?.name}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Informasi {auction.category?.name}
          </DialogTitle>
        </DialogHeader>
        
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {auction.productionYear && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-gray-600">Tahun Produksi</span>
                  </div>
                  <span className="font-medium">{auction.productionYear}</span>
                </div>
              )}
              
              {auction.plateNumber && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Hash className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-gray-600">No Polisi</span>
                    </div>
                    <span className="font-medium">{auction.plateNumber}</span>
                  </div>
                </>
              )}
              
              {auction.chassisNumber && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Settings className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-gray-600">No Rangka</span>
                    </div>
                    <span className="font-medium text-sm break-all">{auction.chassisNumber}</span>
                  </div>
                </>
              )}
              
              {auction.engineNumber && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-gray-600">No Mesin</span>
                    </div>
                    <span className="font-medium text-sm break-all">{auction.engineNumber}</span>
                  </div>
                </>
              )}
              
              {auction.documentInfo && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Info className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-gray-600">Keterangan Surat</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{auction.documentInfo}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
