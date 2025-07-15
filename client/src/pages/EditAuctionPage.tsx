import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

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

    if (isLoading) return <div className="p-8 text-center">Loading...</div>;
    if (!auction) return <div className="p-8 text-center text-red-600">Lelang tidak ditemukan.</div>;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12">
            <Card className="w-full max-w-xl">
                <CardHeader>
                    <CardTitle>Edit Lelang</CardTitle>
                </CardHeader>
                <CardContent>
                    <form
                        className="space-y-4"
                        onSubmit={e => {
                            e.preventDefault();
                            updateAuctionMutation.mutate({
                                title: form.title,
                                description: form.description,
                                condition: form.condition,
                                location: form.location,
                                categoryId: parseInt(form.categoryId),
                                imageUrl: form.imageUrl,
                                startingPrice: parseFloat(form.startingPrice),
                                // currentPrice boleh diabaikan, biasanya dihandle by bid
                                endTime: auction.endTime
                                    ? (typeof auction.endTime === "number"
                                        ? new Date(auction.endTime * 1000).toISOString().slice(0, 16)
                                        : new Date(auction.endTime).toISOString().slice(0, 16))
                                    : "",
                                status: auction.status,
                                createdAt: auction.createdAt,
                            });
                        }}
                    >
                        <Input placeholder="Judul Lelang" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                        <Input placeholder="Deskripsi" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                        <Input placeholder="Kondisi" value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))} />
                        <Input placeholder="Lokasi" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                        <select
                            value={form.categoryId}
                            onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                            className="w-full border rounded p-2"
                        >
                            <option value="">-- Pilih Kategori --</option>
                            <option value="1">Elektronik</option>
                            <option value="2">Fashion</option>
                            <option value="3">Kendaraan</option>
                        </select>
                        <Input placeholder="URL Gambar (opsional)" value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} />
                        <Input placeholder="Harga Awal" type="number" value={form.startingPrice} onChange={e => setForm(f => ({ ...f, startingPrice: e.target.value }))} />
                        <Input placeholder="Waktu Berakhir" type="datetime-local" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
                        <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={() => navigate("/admin")}>Batal</Button>
                            <Button type="submit" disabled={updateAuctionMutation.isPending}>Simpan</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
