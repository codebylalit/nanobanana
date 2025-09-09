import React from "react";

export default function Breadcrumb({ items }) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index === 0 ? (
            <div className="flex items-center">
              <div className="w-4 h-4 border border-gray-400 rounded-sm mr-2 flex items-center justify-center">
                <div className="w-2 h-3 border-l border-gray-400"></div>
              </div>
              <span className="text-gray-700 font-medium">{item.name}</span>
            </div>
          ) : (
            <>
              <span className="text-gray-400">></span>
              <span className="text-gray-700 font-medium">{item.name}</span>
            </>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

