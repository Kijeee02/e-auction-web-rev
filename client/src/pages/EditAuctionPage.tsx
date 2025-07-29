
import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/navbar";
import VehicleInfoModal from "@/components/vehicle-info-modal";
import LocationSelector from "@/components/location-selector";
import { FileText } from "lucide-react";

export default function EditAuctionPage() {
    const { id } = useParams<{ id: string }>();
    const [, navigate] = useLocation();
    const { toast } = useToast();

    // Fetch auction data
    const { data: auction, isLoading } = useQuery({
        queryKey: ["/api/auctions", id],
        queryFn: async () => {
            const res = await fetch(`/api/auctions/${id}`);
            if (!res.ok) throw new Error("Lelang tidak ditemukan");
            return res.json();
        }
    });

    // Fetch categories
    const { data: categories = [] } = useQuery({
        queryKey: ["/api/categories"],
        queryFn: async () => {
            const res = await fetch("/api/categories");
            if (!res.ok) throw new Error("Failed to fetch categories");
            return res.json();
        },
    });

    // Find Motor and Mobil categories
    const motorCategory = categories.find((cat: any) => cat.name.toLowerCase() === "motor");
    const mobilCategory = categories.find((cat: any) => cat.name.toLowerCase() === "mobil");
    const motorCategoryId = motorCategory?.id?.toString();
    const mobilCategoryId = mobilCategory?.id?.toString();

    // State untuk form edit
    const [form, setForm] = useState({
        title: "",
        description: "",
        startingPrice: "",
        endTime: "",
        condition: "",
        location: "",
        categoryId: "",
        imageUrl: "",
        // Vehicle-specific fields
        productionYear: "",
        plateNumber: "",
        chassisNumber: "",
        engineNumber: "",
        documentInfo: "",
    });

    // Isi form otomatis dari data yang didapat
    useEffect(() => {
        if (auction) {
            // Tentukan endTimeValue secara aman:
            let endTimeValue = "";
            if (auction.endTime) {
                if (typeof auction.endTime === "number") {
                    // Cek: timestamp detik atau milidetik
                    endTimeValue = new Date(
                        auction.endTime > 9999999999 ? auction.endTime : auction.endTime * 1000
                    ).toISOString().slice(0, 16);
                } else if (typeof auction.endTime === "string") {
                    // Jika ISO string
                    const d = new Date(auction.endTime);
                    if (!isNaN(d.getTime())) {
                        endTimeValue = d.toISOString().slice(0, 16);
                    }
                }
            }

            setForm({
                title: auction.title ?? "",
                description: auction.description ?? "",
                startingPrice: auction.startingPrice?.toString() ?? "",
                endTime: endTimeValue,
                condition: auction.condition ?? "",
                location: auction.location ?? "",
                categoryId: auction.categoryId?.toString() ?? "",
                imageUrl: auction.imageUrl ?? "",
                // Vehicle-specific fields
                productionYear: auction.productionYear?.toString() ?? "",
                plateNumber: auction.plateNumber ?? "",
                chassisNumber: auction.chassisNumber ?? "",
                engineNumber: auction.engineNumber ?? "",
                documentInfo: auction.documentInfo ?? "",
            });
        }
    }, [auction]);

    // Mutasi update lelang
    const updateAuctionMutation = useMutation({
        mutationFn: async (updates: any) => {
            const res = await apiRequest("PUT", `/api/auctions/${id}`, updates);
            if (!res.ok) throw new Error("Gagal update lelang");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/auctions"] });
            toast({ title: "Sukses", description: "Lelang berhasil diubah" });
            navigate("/admin");
        },
        onError: () => {
            toast({ title: "Gagal", description: "Update gagal", variant: "destructive" });
        },
    });

    if (isLoading) return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="p-8 text-center">Loading...</div>
        </div>
    );

    if (!auction) return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="p-8 text-center text-red-600">Lelang tidak ditemukan.</div>
        </div>
    );

    const isVehicleCategory = form.categoryId === motorCategoryId || form.categoryId === mobilCategoryId;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Edit Lelang</h1>
                        <p className="text-gray-600 mt-2">Update informasi lelang {auction.title}</p>
                    </div>
                    {/* Vehicle Info Modal Button */}
                    {isVehicleCategory && (
                        <VehicleInfoModal auction={auction}>
                            <Button variant="outline">
                                <FileText className="h-4 w-4 mr-2" />
                                View Document/Info
                            </Button>
                        </VehicleInfoModal>
                    )}
                </div>

                <Card className="w-full max-w-6xl mx-auto">
                    <CardHeader>
                        <CardTitle>Informasi Lelang</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form
                            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                            onSubmit={e => {
                                e.preventDefault();
                                
                                const updateData = {
                                    title: form.title,
                                    description: form.description,
                                    condition: form.condition,
                                    location: form.location,
                                    categoryId: parseInt(form.categoryId),
                                    imageUrl: form.imageUrl,
                                    startingPrice: parseFloat(form.startingPrice),
                                    endTime: new Date(form.endTime),
                                };

                                // Add vehicle-specific fields if it's Motor or Mobil category
                                if (isVehicleCategory) {
                                    Object.assign(updateData, {
                                        productionYear: form.productionYear ? parseInt(form.productionYear) : undefined,
                                        plateNumber: form.plateNumber || undefined,
                                        chassisNumber: form.chassisNumber || undefined,
                                        engineNumber: form.engineNumber || undefined,
                                        documentInfo: form.documentInfo || undefined,
                                    });
                                }

                                updateAuctionMutation.mutate(updateData);
                            }}
                        >
                            {/* Left Column - Basic Info */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-900 border-b pb-2">Informasi Dasar</h3>
                                
                                <Input 
                                    placeholder="Judul Lelang" 
                                    value={form.title} 
                                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))} 
                                    required
                                />
                                
                                <textarea
                                    placeholder="Deskripsi"
                                    value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    className="w-full border rounded p-2 min-h-[80px]"
                                    required
                                />
                                
                                <select
                                    value={form.condition}
                                    onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}
                                    className="w-full border rounded p-2"
                                    required
                                >
                                    <option value="">-- Pilih Kondisi --</option>
                                    <option value="new">Baru</option>
                                    <option value="like_new">Seperti Baru</option>
                                    <option value="good">Baik</option>
                                    <option value="fair">Cukup</option>
                                </select>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Lokasi</label>
                                    <LocationSelector
                                        value={form.location}
                                        onChange={(location) => setForm(f => ({ ...f, location }))}
                                        required
                                    />
                                </div>
                                
                                <select
                                    value={form.categoryId}
                                    onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                                    className="w-full border rounded p-2"
                                    required
                                >
                                    <option value="">-- Pilih Kategori --</option>
                                    {categories.map((category: any) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>

                                {/* File Upload for Image */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Upload Gambar</label>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                // Create a temporary URL for preview
                                                const reader = new FileReader();
                                                reader.onload = (event) => {
                                                    setForm(f => ({ ...f, imageUrl: event.target?.result as string }));
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                        className="w-full border rounded p-2"
                                    />
                                    {form.imageUrl && (
                                        <div className="mt-2">
                                            <img
                                                src={form.imageUrl}
                                                alt="Preview"
                                                className="w-32 h-32 object-cover rounded border"
                                            />
                                        </div>
                                    )}
                                </div>
                                
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Harga Awal</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rp</span>
                                        <input
                                            type="text"
                                            placeholder="0"
                                            value={form.startingPrice ? Number(form.startingPrice).toLocaleString('id-ID') : ''}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/[^\d]/g, '');
                                                setForm(f => ({ ...f, startingPrice: value }));
                                            }}
                                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>
                                </div>
                                
                                <Input 
                                    placeholder="Waktu Berakhir" 
                                    type="datetime-local" 
                                    value={form.endTime} 
                                    onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} 
                                    required
                                />
                            </div>

                            {/* Right Column - Vehicle Specific Info */}
                            <div className="space-y-4">
                                {isVehicleCategory ? (
                                    <>
                                        <h3 className="font-semibold text-gray-900 border-b pb-2">
                                            Informasi {form.categoryId === motorCategoryId ? "Motor" : "Mobil"}
                                        </h3>
                                        
                                        <Input
                                            placeholder="Tahun Produksi"
                                            type="number"
                                            value={form.productionYear}
                                            onChange={e => setForm(f => ({ ...f, productionYear: e.target.value }))}
                                        />
                                        
                                        <Input
                                            placeholder="No Polisi"
                                            value={form.plateNumber}
                                            onChange={e => setForm(f => ({ ...f, plateNumber: e.target.value }))}
                                        />
                                        
                                        <Input
                                            placeholder="No Rangka"
                                            value={form.chassisNumber}
                                            onChange={e => setForm(f => ({ ...f, chassisNumber: e.target.value }))}
                                        />
                                        
                                        <Input
                                            placeholder="No Mesin"
                                            value={form.engineNumber}
                                            onChange={e => setForm(f => ({ ...f, engineNumber: e.target.value }))}
                                        />
                                        
                                        <textarea
                                            placeholder="Keterangan Surat (STNK/BPKB/Kelengkapan dokumen)"
                                            value={form.documentInfo}
                                            onChange={e => setForm(f => ({ ...f, documentInfo: e.target.value }))}
                                            className="w-full border rounded p-2 min-h-[100px]"
                                        />
                                    </>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <p>Pilih kategori Motor atau Mobil untuk menampilkan field khusus kendaraan</p>
                                    </div>
                                )}
                            </div>

                            {/* Form Actions - Full Width */}
                            <div className="lg:col-span-2 flex justify-end space-x-2 pt-4 border-t">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => navigate("/admin")}
                                >
                                    Batal
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={updateAuctionMutation.isPending}
                                >
                                    {updateAuctionMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
