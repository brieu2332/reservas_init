import React from 'react';

export default function GovHeader() {
  return (
    <div className="w-full bg-[#1351B4] text-white text-xs">
      <div className="max-w-[1400px] mx-auto px-4 py-1 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-semibold">BRASIL</span>
          <span className="hidden sm:inline text-white/80">Governo Federal</span>
        </div>
        <div className="flex items-center gap-4 text-white/80">
          <a href="https://www.gov.br" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
            Acesse gov.br
          </a>
        </div>
      </div>
    </div>
  );
}