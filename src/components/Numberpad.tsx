import React from 'react';
import { X, Backpack as Backspace } from 'lucide-react';
import { clsx } from 'clsx';

interface NumberpadProps {
  isOpen: boolean;
  onClose: () => void;
  onNumberClick: (number: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onEnter: () => void;
  title?: string;
  currentValue?: string;
}

export default function Numberpad({
  isOpen,
  onClose,
  onNumberClick,
  onBackspace,
  onClear,
  onEnter,
  title = "Enter Amount",
  currentValue = ""
}: NumberpadProps) {
  if (!isOpen) return null;

  const buttons = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['C', '0', '.']
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-sm mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Display */}
        <div className="p-4 border-b border-gray-200">
          <div className="bg-gray-50 rounded-lg p-4 text-right">
            <span className="text-2xl font-mono text-gray-900">
              {currentValue || '0'}
            </span>
          </div>
        </div>

        {/* Keypad */}
        <div className="p-4">
          <div className="grid grid-cols-3 gap-3 mb-3">
            {buttons.map((row, rowIndex) => 
              row.map((button, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => {
                    if (button === 'C') {
                      onClear();
                    } else {
                      onNumberClick(button);
                    }
                  }}
                  className={clsx(
                    'h-12 rounded-lg font-semibold text-lg transition-colors',
                    button === 'C'
                      ? 'bg-red-100 hover:bg-red-200 text-red-700'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  )}
                >
                  {button}
                </button>
              ))
            )}
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onBackspace}
              className="h-12 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-semibold flex items-center justify-center transition-colors"
            >
              <Backspace className="h-5 w-5" />
            </button>
            <button
              onClick={onEnter}
              className="h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              Enter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}