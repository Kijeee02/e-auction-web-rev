import { useState, useRef } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ImageGallery from "./image-gallery";

interface MultipleImageUploadProps {
    images: string[];
    onChange: (images: string[]) => void;
    maxImages?: number;
    acceptedTypes?: string;
    className?: string;
}

export default function MultipleImageUpload({
    images,
    onChange,
    maxImages = 5,
    acceptedTypes = "image/*",
    className = ""
}: MultipleImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const processFiles = (files: File[]) => {
        if (files.length === 0) return;

        // Check if adding these files would exceed the limit
        if (images.length + files.length > maxImages) {
            toast({
                title: "Terlalu banyak gambar",
                description: `Maksimal ${maxImages} gambar. Anda sudah memiliki ${images.length} gambar.`,
                variant: "destructive"
            });
            return;
        }

        setUploading(true);

        const newImages: string[] = [];
        let processedCount = 0;

        files.forEach((file) => {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast({
                    title: "File tidak valid",
                    description: `File ${file.name} bukan gambar yang valid.`,
                    variant: "destructive"
                });
                processedCount++;
                if (processedCount === files.length) {
                    setUploading(false);
                    if (newImages.length > 0) {
                        onChange([...images, ...newImages]);
                    }
                }
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast({
                    title: "File terlalu besar",
                    description: `File ${file.name} terlalu besar. Maksimal 5MB.`,
                    variant: "destructive"
                });
                processedCount++;
                if (processedCount === files.length) {
                    setUploading(false);
                    if (newImages.length > 0) {
                        onChange([...images, ...newImages]);
                    }
                }
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    const img = new Image();
                    img.onload = () => {
                        // Create canvas for compression
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');

                        // Calculate new dimensions (max 800px width/height)
                        const maxSize = 800;
                        let { width, height } = img;

                        if (width > height) {
                            if (width > maxSize) {
                                height = (height * maxSize) / width;
                                width = maxSize;
                            }
                        } else {
                            if (height > maxSize) {
                                width = (width * maxSize) / height;
                                height = maxSize;
                            }
                        }

                        canvas.width = width;
                        canvas.height = height;

                        // Draw and compress
                        ctx?.drawImage(img, 0, 0, width, height);
                        const compressedDataURL = canvas.toDataURL('image/jpeg', 0.8);

                        newImages.push(compressedDataURL);
                        processedCount++;

                        // When all files are processed
                        if (processedCount === files.length) {
                            setUploading(false);
                            if (newImages.length > 0) {
                                onChange([...images, ...newImages]);
                            }
                        }
                    };
                    img.src = event.target.result as string;
                } else {
                    processedCount++;
                    if (processedCount === files.length) {
                        setUploading(false);
                        if (newImages.length > 0) {
                            onChange([...images, ...newImages]);
                        }
                    }
                }
            };

            reader.onerror = () => {
                toast({
                    title: "Error",
                    description: `Error reading file ${file.name}`,
                    variant: "destructive"
                });
                processedCount++;
                if (processedCount === files.length) {
                    setUploading(false);
                    if (newImages.length > 0) {
                        onChange([...images, ...newImages]);
                    }
                }
            };

            reader.readAsDataURL(file);
        });
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        processFiles(files);

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (uploading || remainingSlots === 0) return;

        const files = Array.from(e.dataTransfer.files).filter(file =>
            file.type.startsWith('image/')
        );

        if (files.length > 0) {
            processFiles(files);
        }
    };

    const handleRemoveImage = (index: number) => {
        const updatedImages = images.filter((_, i) => i !== index);
        onChange(updatedImages);
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    const remainingSlots = maxImages - images.length;

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Upload Area */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                        Upload Gambar
                    </label>
                    <span className="text-xs text-gray-500">
                        {images.length}/{maxImages}
                    </span>
                </div>

                {/* Upload Box */}
                <div
                    onClick={!uploading && remainingSlots > 0 ? triggerFileSelect : undefined}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${uploading || remainingSlots === 0
                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                        : isDragging
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 cursor-pointer hover:border-blue-400 hover:bg-blue-50'
                        }`}
                >
                    {uploading ? (
                        <div className="space-y-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mx-auto"></div>
                            <p className="text-sm text-gray-600">Mengupload gambar...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <Upload className={`w-12 h-12 mx-auto ${remainingSlots === 0 ? 'text-gray-300' : 'text-gray-400'}`} />

                            <div className="space-y-2">
                                <Button
                                    type="button"
                                    variant={images.length === 0 ? "default" : "outline"}
                                    disabled={remainingSlots === 0}
                                    className="mx-auto"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        triggerFileSelect();
                                    }}
                                >
                                    {images.length === 0 ? 'Pilih Gambar' : 'Tambah Gambar'}
                                </Button>

                                <p className="text-sm text-gray-500">
                                    {isDragging ? 'Lepaskan file di sini' : 'atau drag and drop file ke sini'}
                                </p>
                            </div>

                            {remainingSlots > 0 ? (
                                <p className="text-xs text-gray-500">
                                    JPG, PNG, GIF • Maks 5MB • Sisa {remainingSlots} slot
                                </p>
                            ) : (
                                <p className="text-xs text-orange-600">
                                    Maksimal {maxImages} gambar tercapai
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={acceptedTypes}
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </div>

            {/* Image Gallery */}
            {images.length > 0 && (
                <ImageGallery
                    images={images}
                    onImageRemove={handleRemoveImage}
                    editable={true}
                />
            )}
        </div>
    );
}
