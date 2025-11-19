import React, { useState } from 'react';
import type { SearchResult } from '../domain/search/SearchResult';

interface SearchBoxProps {
    onSearch: (query: string) => void;
}

export const SearchBox: React.FC<SearchBoxProps> = ({ onSearch }) => {
    const [query, setQuery] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(query);
    };

    return (
        <form onSubmit={handleSubmit} className="mb-6">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search files..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    Search
                </button>
            </div>
        </form>
    );
};

interface SearchResultsProps {
    results: SearchResult[];
    onSelectResult: (filePath: string) => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({ results, onSelectResult }) => {
    if (results.length === 0) {
        return null;
    }

    return (
        <div className="bg-white rounded shadow-sm border border-gray-200 p-4 mb-6">
            <h2 className="text-lg font-bold mb-4 text-gray-800">Search Results</h2>
            <div className="space-y-4">
                {results.map((result) => (
                    <div key={result.filePath} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                        <button
                            onClick={() => onSelectResult(result.filePath)}
                            className="text-blue-600 font-medium hover:underline mb-2 block text-left"
                        >
                            {result.filePath}
                        </button>
                        <ul className="space-y-1">
                            {result.matches.map((match, index) => (
                                <li key={index} className="text-sm text-gray-600 font-mono bg-gray-50 p-1 rounded">
                                    <span className="text-gray-400 mr-2">{match.lineNumber}:</span>
                                    {match.lineContent}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
};
