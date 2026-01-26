import React, { useState } from "react";
import { dummyTrailers } from "../assets/assets";
import BlurCircle from "./BlurCircle";

function TrailerSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerPage = 3;
  const totalPages = Math.ceil(dummyTrailers.length / itemsPerPage);
  const visibleTrailers = dummyTrailers.slice(
    currentIndex,
    currentIndex + itemsPerPage,
  );

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? 0 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) =>
      prev + itemsPerPage >= dummyTrailers.length ? prev : prev + 1,
    );
  };

  return (
    <div className="px-6 md:px-16 lg:px-44 py-20 overflow-hidden">
      <p className="text-gray-300 font-medium text-lg max-w-[960px] mx-auto">
        Trailers
      </p>
      <div className="relative mt-6">
        <BlurCircle top="-100px" right="-100px" />

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-8 max-w-[960px] mx-auto mb-8">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition duration-300"
          >
            ← Previous
          </button>
          <p className="text-gray-400 text-sm">
            {currentIndex + 1} -{" "}
            {Math.min(currentIndex + itemsPerPage, dummyTrailers.length)} of{" "}
            {dummyTrailers.length}
          </p>
          <button
            onClick={handleNext}
            disabled={currentIndex + itemsPerPage >= dummyTrailers.length}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition duration-300"
          >
            Next →
          </button>
        </div>

        {/* Trailers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[960px] mx-auto">
          {visibleTrailers.map((trailer, index) => (
            <div
              key={currentIndex + index}
              onClick={() => window.open(trailer.videoUrl, "_blank")}
              className="relative cursor-pointer group overflow-hidden rounded-lg shadow-lg transition-transform duration-300 hover:scale-105"
            >
              <img
                src={trailer.image}
                alt={`Trailer ${currentIndex + index + 1}`}
                className="w-full h-48 object-cover bg-gray-800"
                crossOrigin="anonymous"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.parentElement.style.backgroundColor = "#1f2937";
                }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold">
                  Watch on YouTube
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TrailerSection;
