import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";

interface ImageSliderProps {
    images: string[];
    className?: string;
    showGallery?: boolean;
}

export default function ImageSlider({
    images,
    className = "",
    showGallery = true
}: ImageSliderProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const galleryRef = useRef<HTMLDivElement>(null);
    const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
    const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
    const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
    const resetTransforms = () => {
        setZoom(1);
        setRotation(0);
    };

    if (!images || images.length === 0) {
        return (
            <div className={`rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center ${className}`}>
                <img
                    src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=600&fit=crop"
                    alt="Default placeholder"
                    className="w-full h-auto max-h-96 object-contain"
                />
            </div>
        );
    }

    const nextImage = () => {
        setCurrentIndex((prev) => {
            resetTransforms();
            return (prev + 1) % images.length;
        });
    };

    const prevImage = () => {
        setCurrentIndex((prev) => {
            resetTransforms();
            return (prev - 1 + images.length) % images.length;
        });
    };

    const goToImage = (index: number) => {
        setCurrentIndex(index);
        resetTransforms();
    };

    const handleImageClick = () => {
        if (showGallery) {
            setShowModal(true);
            resetTransforms();
        }
    };

    return (
        <>
            <div className={`relative ${className}`}>
                {/* Main Image Container */}
                <div className="rounded-lg overflow-hidden bg-gray-100 relative group">
                    <img
                        src={images[currentIndex]}
                        alt={`Image ${currentIndex + 1}`}
                        className="w-full h-auto max-h-96 object-contain cursor-pointer transition-opacity duration-300"
                        onClick={handleImageClick}
                    />

                    {/* View gallery icon indicator */}
                    {showGallery && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20 pointer-events-none">
                            <div className="bg-white bg-opacity-90 rounded-full p-2 mb-2">
                                <Maximize2 className="w-6 h-6 text-gray-700" />
                            </div>
                            <p className="text-white text-sm font-medium">Klik untuk lihat</p>
                        </div>
                    )}

                    {/* Navigation arrows - only show if more than 1 image */}
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    prevImage();
                                }}
                                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    nextImage();
                                }}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </>
                    )}

                    {/* Image counter - show current position */}
                    {images.length > 1 && (
                        <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                            {currentIndex + 1} / {images.length}
                        </div>
                    )}
                </div>

                {/* Dot indicators - only show if more than 1 image */}
                {images.length > 1 && (
                    <div className="flex justify-center mt-3 space-x-2">
                        {images.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToImage(index)}
                                className={`w-2 h-2 rounded-full transition-colors duration-200 ${index === currentIndex
                                    ? 'bg-blue-500'
                                    : 'bg-gray-300 hover:bg-gray-400'
                                    }`}
                                aria-label={`Go to image ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Simple Image Modal */}
            {showModal && showGallery && (
                <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" ref={galleryRef}>
                    {/* Close button */}
                    <button
                        onClick={() => setShowModal(false)}
                        className="absolute top-4 right-4 text-white hover:text-gray-300 z-50 bg-black bg-opacity-50 rounded-full p-2"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Controls */}
                    <div className="absolute top-4 left-4 flex space-x-2 z-50">
                        <button
                            onClick={handleZoomIn}
                            className={`bg-white text-black rounded-full w-10 h-10 flex items-center justify-center shadow-md transition-colors ${zoom >= 3 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                            disabled={zoom >= 3}
                            title="Zoom In"
                        >
                            +
                        </button>
                        <button
                            onClick={handleZoomOut}
                            className={`bg-white text-black rounded-full w-10 h-10 flex items-center justify-center shadow-md transition-colors ${zoom <= 0.5 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                            disabled={zoom <= 0.5}
                            title="Zoom Out"
                        >
                            −
                        </button>
                        <button
                            onClick={handleRotate}
                            className="bg-white text-black rounded-full w-10 h-10 flex items-center justify-center shadow-md hover:bg-gray-100 transition-colors"
                            title="Rotate"
                        >
                            ↻
                        </button>
                        <button
                            onClick={resetTransforms}
                            className="bg-white text-black rounded px-3 h-10 flex items-center justify-center shadow-md hover:bg-gray-100 transition-colors text-xs"
                            title="Reset"
                        >
                            Reset
                        </button>
                    </div>

                    {/* Navigation arrows in modal */}
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={prevImage}
                                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-3 z-40"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <button
                                onClick={nextImage}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-3 z-40"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </>
                    )}

                    {/* Main image in modal */}
                    <div className="relative max-w-full max-h-full flex items-center justify-center p-4">
                        <img
                            src={images[currentIndex]}
                            alt={`Image ${currentIndex + 1}`}
                            className="max-w-full max-h-full object-contain transition-transform duration-200"
                            style={{
                                transform: `scale(${zoom}) rotate(${rotation}deg)`
                            }}
                            onClick={(e) => e.stopPropagation()}
                            onWheel={(e) => {
                                e.preventDefault();
                                if (e.deltaY < 0) handleZoomIn();
                                else handleZoomOut();
                            }}
                        />

                        {/* Image counter in modal */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-60 text-white text-sm px-3 py-1 rounded">
                            {images.length > 1 && (
                                <span className="mr-3">{currentIndex + 1} / {images.length}</span>
                            )}
                            <span>Zoom: {Math.round(zoom * 100)}%</span>
                        </div>
                    </div>

                    {/* Click outside to close */}
                    <div
                        className="absolute inset-0"
                        onClick={() => setShowModal(false)}
                    ></div>
                </div>
            )}
        </>
    );
}
