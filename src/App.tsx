import { useState, useEffect, useMemo } from 'react';
import type { OrgFile } from './domain/org/ast';
import { OrgViewer } from './ui/OrgViewer';
import { AgendaView } from './ui/AgendaView';
import { Sidebar } from './ui/Sidebar';
import { RemoteFileRepository } from './repository/RemoteFileRepository';
import { GetAgendaUseCase } from './usecase/GetAgenda';
import { SearchBox, SearchResults } from './ui/Search';
import { SearchFilesUseCase } from './usecase/SearchFiles';
import type { AgendaItem } from './domain/agenda/AgendaItem';
import type { SearchResult } from './domain/search/SearchResult';

type ViewMode = 'file' | 'agenda';

function App() {
  const [files, setFiles] = useState<string[]>([]);
  const [currentFile, setCurrentFile] = useState<string>('');
  const [parsedFile, setParsedFile] = useState<OrgFile | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('agenda');
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const repository = useMemo(() => new RemoteFileRepository('http://localhost:8787'), []);
  const searchFiles = useMemo(() => new SearchFilesUseCase(repository), [repository]);
  const getAgenda = useMemo(() => new GetAgendaUseCase(repository), [repository]);


  const handleAuthError = (e: any) => {
    console.error(e);
    setIsAuthenticated(false);
    setIsLoading(false);
  };

  const loadFile = async (path: string) => {
    setIsLoading(true);
    try {
      const parsed = await repository.readFile(path);
      setCurrentFile(path);
      setParsedFile(parsed);
      setViewMode('file');
      setIsSidebarOpen(false); // Close sidebar on selection (mobile)
      setIsAuthenticated(true);
    } catch (e) {
      handleAuthError(e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAgenda = async () => {
    setIsLoading(true);
    try {
      const items = await getAgenda.execute();
      setAgendaItems(items);
      setViewMode('agenda');
      setIsSidebarOpen(false);
      setIsAuthenticated(true);
    } catch (e) {
      handleAuthError(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const fileList = await repository.getFiles();
        setFiles(fileList);

        // Load agenda items initially
        await loadAgenda();

        setIsAuthenticated(true);
      } catch (e: any) {
        handleAuthError(e);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [repository, getAgenda]);

  const handleSearch = async (query: string) => {
    try {
      const results = await searchFiles.execute(query);
      setSearchResults(results);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearchResultClick = (path: string) => {
    loadFile(path);
    setSearchResults([]); // Clear search results
  };

  if (!isAuthenticated) {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">OrgDrop</h1>
            <div className="animate-pulse text-gray-600">Loading...</div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">OrgDrop</h1>
          <a
            href="http://localhost:8787/auth/dropbox"
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Connect Dropbox
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-800 text-white transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        <Sidebar
          files={files}
          onFileSelect={loadFile}
          currentFile={currentFile}
          viewMode={viewMode}
          onAgendaSelect={() => setViewMode('agenda')}
        />
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <button
                className="md:hidden mr-4 text-gray-600"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-lg font-semibold text-gray-800 truncate">
                {viewMode === 'agenda' ? 'Agenda' : currentFile || 'Select a file'}
              </h1>
            </div>
            <div className="w-full max-w-md ml-4">
              <SearchBox onSearch={handleSearch} />
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-4">
          {searchResults.length > 0 && (
            <SearchResults results={searchResults} onSelectResult={handleSearchResultClick} />
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-full">Loading...</div>
          ) : viewMode === 'agenda' ? (
            <AgendaView items={agendaItems} onItemClick={loadFile} />
          ) : parsedFile ? (
            <OrgViewer
              file={parsedFile}
              resolveImage={(src) => {
                if (src.startsWith('http')) return src;
                let imagePath = src;
                if (!src.startsWith('/') && currentFile) {
                  const currentDir = currentFile.substring(0, currentFile.lastIndexOf('/'));
                  if (currentDir) {
                    imagePath = `${currentDir}/${src}`;
                  }
                }
                return `http://localhost:8787/api/images/${encodeURIComponent(imagePath)}`;
              }}
            />
          ) : (
            <div className="flex items-center justify-center py-12">Failed to load file</div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
