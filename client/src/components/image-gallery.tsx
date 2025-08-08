import { useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageGalleryProps {
    images: string[];
    onImageRemove?: (index: number) => void;
    editable?: boolean;
    className?: string;
}

export default function ImageGallery({
    images,
    onImageRemove,
    editable = false,
    className = ""
}: ImageGalleryProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);

    if (!images || images.length === 0) {
        return null;
    }

    const nextImage = () => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
        resetTransforms();
    };

    const prevImage = () => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
        resetTransforms();
    };

    const resetTransforms = () => {
        setZoom(1);
        setRotation(0);
    };

    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 0.25, 3));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 0.25, 0.5));
    };

    const handleRotate = () => {
        setRotation(prev => (prev + 90) % 360);
    };

    const openModal = (index: number) => {
        setCurrentIndex(index);
        setIsModalOpen(true);
        resetTransforms();
    };

    const closeModal = () => {
        setIsModalOpen(false);
        resetTransforms();
    };

    return (
        <>
            {/* Gallery Thumbnails */}
            <div className={`space-y-3 ${className}`}>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {images.map((image, index) => (
                        <div key={index} className="relative group">
                            <img
                                src={image}
                                alt={`Image ${index + 1}`}
                                className="w-full h-24 md:h-32 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => openModal(index)}
                            />

                            {/* Remove button for editable mode */}
                            {editable && onImageRemove && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onImageRemove(index);
                                    }}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}

                            {/* Image number indicator */}
                            <div className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                                {index + 1}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Image counter */}
                <p className="text-sm text-gray-600">
                    {images.length} gambar
                </p>
            </div>

            {/* Modal for full view */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
                    <div className="relative w-full h-full flex items-center justify-center">
                        {/* Close button */}
                        <button
                            onClick={closeModal}
                            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
                        >
                            <X className="w-8 h-8" />
                        </button>

                        {/* Controls */}
                        <div className="absolute top-4 left-4 flex space-x-2 z-10">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleZoomIn}
                                disabled={zoom >= 3}
                            >
                                <ZoomIn className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleZoomOut}
                                disabled={zoom <= 0.5}
                            >
                                <ZoomOut className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleRotate}
                            >
                                <RotateCcw className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={resetTransforms}
                            >
                                Reset
                            </Button>
                        </div>

                        {/* Image counter */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded">
                            {currentIndex + 1} / {images.length}
                        </div>

                        {/* Navigation arrows */}
                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={prevImage}
                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-2"
                                >
                                    <ChevronLeft className="w-8 h-8" />
                                </button>
                                <button
                                    onClick={nextImage}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-2"
                                >
                                    <ChevronRight className="w-8 h-8" />
                                </button>
                            </>
                        )}

                        {/* Main image */}
                        <div className="relative max-w-full max-h-full overflow-hidden">
                            <img
                                src={images[currentIndex]}
                                alt={`Image ${currentIndex + 1}`}
                                className="max-w-full max-h-full object-contain transition-transform duration-200"
                                style={{
                                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                                }}
                                onWheel={(e) => {
                                    e.preventDefault();
                                    if (e.deltaY < 0) {
                                        handleZoomIn();
                                    } else {
                                        handleZoomOut();
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
