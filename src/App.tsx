import { useEffect, useState } from 'react';
import { OrgViewer } from './ui/OrgViewer';
import { SearchBox, SearchResults } from './ui/Search';
import { AgendaView } from './ui/AgendaView';
import { MockFileRepository } from './repository/MockFileRepository';
import { GetOrgFileUseCase } from './usecase/GetOrgFile';
import { SearchFilesUseCase } from './usecase/SearchFiles';
import { GetAgendaUseCase } from './usecase/GetAgenda';
import type { OrgFile } from './domain/org/ast';
import type { SearchResult } from './domain/search/SearchResult';
import type { AgendaItem } from './domain/agenda/AgendaItem';

const repository = new MockFileRepository();
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

  const loadFile = async (path: string) => {
    setLoading(true);
    try {
      const orgFile = await getOrgFile.execute(path);
      setFile(orgFile);
      setCurrentFile(path);
      setViewMode('file');
    } catch (e) {
      console.error(e);
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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFile('example.org');
  }, []);

  const handleSearch = async (query: string) => {
    try {
      const results = await searchFiles.execute(query);
      setSearchResults(results);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-64 bg-gray-800 text-white flex-shrink-0 hidden md:block">
        <div className="p-4">
          <h1 className="text-xl font-bold mb-6">OrgDrop</h1>
          <nav className="space-y-2">
            <button
              onClick={() => loadFile('example.org')}
              className={`w-full text-left px-4 py-2 rounded ${viewMode === 'file' ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
            >
              Files
            </button>
            <button
              onClick={loadAgenda}
              className={`w-full text-left px-4 py-2 rounded ${viewMode === 'agenda' ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
            >
              Agenda
            </button>
          </nav>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white shadow p-4 mb-6 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto w-full">
            <div className="flex justify-between items-center mb-4">
              <div className="md:hidden font-bold text-gray-800">OrgDrop</div>
              <span className="text-sm text-gray-500 truncate">{viewMode === 'file' ? currentFile : 'Agenda'}</span>
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
              <OrgViewer file={file} />
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
