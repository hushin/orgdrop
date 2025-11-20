import { useEffect, useState } from 'react';
import { OrgViewer } from './ui/OrgViewer';
import { SearchBox, SearchResults } from './ui/Search';
import { AgendaView } from './ui/AgendaView';
import { Sidebar } from './ui/Sidebar';
import { RemoteFileRepository } from './repository/RemoteFileRepository';
import { GetOrgFileUseCase } from './usecase/GetOrgFile';
import { SearchFilesUseCase } from './usecase/SearchFiles';
import { GetAgendaUseCase } from './usecase/GetAgenda';
import type { OrgFile } from './domain/org/ast';
import type { SearchResult } from './domain/search/SearchResult';
import type { AgendaItem } from './domain/agenda/AgendaItem';

// const repository = new MockFileRepository();
const repository = new RemoteFileRepository('http://localhost:8787');
const getOrgFile = new GetOrgFileUseCase(repository);
const searchFiles = new SearchFilesUseCase(repository);
const getAgenda = new GetAgendaUseCase(repository);

type ViewMode = 'file' | 'agenda';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('file');
  const [file, setFile] = useState<OrgFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentFile, setCurrentFile] = useState<string>('example.org');
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Assume true initially

  const [files, setFiles] = useState<string[]>([]);

  const handleAuthError = (e: any) => {
    console.error(e);
    if (e.message === 'Unauthorized') {
      setIsAuthenticated(false);
    }
  };

  const loadFile = async (path: string) => {
    setLoading(true);
    try {
      const orgFile = await getOrgFile.execute(path);
      setFile(orgFile);
      setCurrentFile(path);
      setViewMode('file');
      setIsSidebarOpen(false); // Close sidebar on selection (mobile)
      setIsAuthenticated(true);
    } catch (e) {
      handleAuthError(e);
    } finally {
      setLoading(false);
    }
  };

  const loadAgenda = async () => {
    setLoading(true);
    try {
      const items = await getAgenda.execute();
      setAgendaItems(items);
      setViewMode('agenda');
      setIsSidebarOpen(false); // Close sidebar on selection (mobile)
      setIsAuthenticated(true);
    } catch (e) {
      handleAuthError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const fileList = await repository.getFiles();
        setFiles(fileList);
        if (fileList.length > 0) {
          // Use the first file found
          const firstFile = fileList[0];
          await loadFile(firstFile);
        } else {
          setLoading(false);
        }
        setIsAuthenticated(true);
      } catch (e: any) {
        handleAuthError(e);
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleSearch = async (query: string) => {
    try {
      const results = await searchFiles.execute(query);
      setSearchResults(results);
      setIsAuthenticated(true);
    } catch (e) {
      handleAuthError(e);
    }
  };



  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded shadow-md text-center">
          <h1 className="text-2xl font-bold mb-4">Welcome to OrgDrop</h1>
          <p className="mb-6 text-gray-600">Please login with Dropbox to continue.</p>
          <a
            href="http://localhost:8787/auth/dropbox"
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Login with Dropbox
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-gray-800 text-white flex-shrink-0 hidden md:block overflow-y-auto">
        <Sidebar
          files={files}
          onFileSelect={loadFile}
          currentFile={currentFile}
          viewMode={viewMode}
          onAgendaSelect={loadAgenda}
        />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-20 md:hidden">
          <div className="absolute inset-0 bg-black opacity-50" onClick={() => setIsSidebarOpen(false)}></div>
          <div className="absolute inset-y-0 left-0 w-64 bg-gray-800 z-30 shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto">
            <Sidebar
              files={files}
              onFileSelect={loadFile}
              currentFile={currentFile}
              viewMode={viewMode}
              onAgendaSelect={loadAgenda}
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 h-full">
        <header className="bg-white shadow p-4 mb-6 sticky top-0 z-10 flex-shrink-0">
          <div className="max-w-4xl mx-auto w-full">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                {/* Hamburger Button */}
                <button
                  className="md:hidden mr-4 text-gray-600 focus:outline-none"
                  onClick={() => setIsSidebarOpen(true)}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <h1 className="text-xl font-bold text-gray-800 md:hidden">OrgDrop</h1>
              </div>
              <span className="text-sm text-gray-500 truncate hidden md:block">{viewMode === 'file' ? currentFile : 'Agenda'}</span>
            </div>
            <SearchBox onSearch={handleSearch} />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-4 pb-8">
          <div className="max-w-4xl mx-auto w-full">
            {searchResults.length > 0 && (
              <SearchResults
                results={searchResults}
                onSelectResult={(path) => {
                  loadFile(path);
                  setSearchResults([]);
                }}
              />
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">Loading...</div>
            ) : viewMode === 'agenda' ? (
              <AgendaView items={agendaItems} onItemClick={loadFile} />
            ) : file ? (
              <OrgViewer
                file={file}
                resolveImage={(src) => {
                  // If it's already an absolute URL, return as is
                  if (src.startsWith('http')) return src;
                  // Otherwise, construct the API URL
                  // Note: src might be relative like "images/foo.png" or absolute like "/images/foo.png"
                  // The worker expects the path as it is in Dropbox
                  // If the file is in a subdirectory, we might need to handle relative paths from the current file?
                  // For now, let's assume src is relative to the Dropbox root or absolute path in Dropbox.
                  // Actually, Org mode links are usually relative to the file.
                  // But we don't have the current file's directory easily accessible here without parsing the path.
                  // Let's assume the user puts images in a fixed place or uses absolute paths for now, 
                  // or that the worker handles the path finding.
                  // But wait, the worker just takes the path.
                  // If I am in "projects/todo.org" and link is "[[file:../images/logo.png]]", 
                  // I need to resolve that path.
                  // For MVP, let's just pass the path to the worker and let the worker/Dropbox handle it 
                  // (Dropbox API takes paths relative to root if they start with / or relative to... wait, API takes full path).

                  // Let's try to resolve relative to current file if possible.
                  let imagePath = src;
                  if (!src.startsWith('/') && currentFile) {
                    const currentDir = currentFile.substring(0, currentFile.lastIndexOf('/'));
                    if (currentDir) {
                      // Simple path join (handling .. is harder without a library, but let's try basic)
                      // For now, just pass it through. The user can use absolute paths in Org for reliability.
                      // Or we can implement a simple join.
                      imagePath = `${currentDir}/${src}`;
                    }
                  }

                  return `http://localhost:8787/api/images/${encodeURIComponent(imagePath)}`;
                }}
              />
            ) : (
              <div className="flex items-center justify-center py-12">Failed to load file</div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
