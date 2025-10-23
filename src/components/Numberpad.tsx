// components/Numberpad.tsx
import { clsx } from "clsx";
import { X, Delete } from "lucide-react";

interface NumberpadProps {
  isOpen: boolean;
  onClose: () => void;
  onNumberClick: (num: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onEnter: () => void;
  title: string;
  currentValue: string;
}

export default function Numberpad({
  isOpen,
  onClose,
  onNumberClick,
  onBackspace,
  onClear,
  onEnter,
  title,
  currentValue,
}: NumberpadProps) {
  if (!isOpen) return null;

  const numbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0"];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 p-2 lg:items-center lg:p-4">
      <div className="bg-white rounded-xl w-full max-w-xs lg:max-w-sm">
        {/* Header - kichikroq */}
        <div className="p-3 border-b flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Display - kichikroq */}
        <div className="p-3">
          <div className="bg-gray-100 rounded-lg p-3 mb-3">
            <div className="text-xl font-mono text-gray-900 text-right">
              {currentValue || "0"}
            </div>
          </div>

          {/* Grid - kichikroq tugmalar */}
          <div className="grid grid-cols-3 gap-2">
            {numbers.map((num) => (
              <button
                key={num}
                onClick={() => onNumberClick(num)}
                className={clsx(
                  "h-12 rounded-lg text-base font-medium transition-colors flex items-center justify-center",
                  num === "."
                    ? "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                )}
              >
                {num}
              </button>
            ))}
            
            <button
              onClick={onBackspace}
              className="h-12 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-600 flex items-center justify-center"
            >
              <Delete className="h-4 w-4" />
            </button>
            
            <button
              onClick={onClear}
              className="h-12 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 text-base font-medium flex items-center justify-center"
            >
              C
            </button>
            
            <button
              onClick={onEnter}
              className="h-12 rounded-lg bg-green-600 hover:bg-green-700 text-white text-base font-medium flex items-center justify-center"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}