interface HeaderProps {
  onReset: () => void;
  onShare: () => void;
  hasSelections: boolean;
}

export function Header({ onReset, onShare, hasSelections }: HeaderProps) {
  return (
    <header className="bg-[#013369] text-white shadow-lg">
      <div className="container mx-auto px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png"
              alt="NFL"
              className="w-8 h-8 object-contain"
            />
            <div>
              <h1 className="text-lg font-bold">Playoff Scenarios</h1>
              <p className="text-xs text-blue-200">2025-26 Season</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasSelections && (
              <>
                <button
                  onClick={onShare}
                  className="px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </button>
                <button
                  onClick={onReset}
                  className="px-3 py-1.5 text-sm bg-red-500/80 hover:bg-red-500 rounded transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
