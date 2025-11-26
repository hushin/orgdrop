import { useState, useEffect, useMemo } from "react";
import {
	Routes,
	Route,
	Navigate,
	useNavigate,
	useLocation,
} from "react-router-dom";
import { Sidebar } from "./ui/Sidebar";
import { RemoteFileRepository } from "./repository/RemoteFileRepository";
import { SearchBox, SearchResults } from "./ui/Search";
import { SearchFilesUseCase } from "./usecase/SearchFiles";
import type { SearchResult } from "@orgdrop/domain";
import { AgendaPage } from "./pages/AgendaPage";
import { FilePage } from "./pages/FilePage";

function App() {
	const [files, setFiles] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const [sidebarWidth, setSidebarWidth] = useState(256);
	const [isResizing, setIsResizing] = useState(false);

	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (!isResizing) return;
			setSidebarWidth((prev) => {
				const newWidth = e.clientX;
				if (newWidth < 150) return 150;
				if (newWidth > 600) return 600;
				return newWidth;
			});
		};

		const handleMouseUp = () => {
			setIsResizing(false);
		};

		if (isResizing) {
			window.addEventListener("mousemove", handleMouseMove);
			window.addEventListener("mouseup", handleMouseUp);
		}

		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
		};
	}, [isResizing]);

	const repository = useMemo(() => new RemoteFileRepository(""), []);
	const searchFiles = useMemo(
		() => new SearchFilesUseCase(repository),
		[repository],
	);

	const handleAuthError = (e: any) => {
		console.error(e);
		setIsAuthenticated(false);
		setIsLoading(false);
	};

	useEffect(() => {
		const init = async () => {
			try {
				const fileList = await repository.getFiles();
				setFiles(fileList);
				setIsAuthenticated(true);
			} catch (e: any) {
				handleAuthError(e);
			} finally {
				setIsLoading(false);
			}
		};
		init();
	}, [repository]);

	const handleSearch = async (query: string) => {
		try {
			const results = await searchFiles.execute(query);
			setSearchResults(results);
		} catch (e) {
			console.error(e);
		}
	};

	const handleSearchResultClick = (path: string) => {
		navigate(`/file/${path.split("/").map(encodeURIComponent).join("/")}`);
		setSearchResults([]); // Clear search results
	};

	// Derive view state from URL for Sidebar
	const currentPath = location.pathname;
	const viewMode = currentPath.startsWith("/agenda") ? "agenda" : "file";
	let currentFile = "";
	if (currentPath.startsWith("/file/")) {
		// Extract path from /file/:path
		// Note: useParams is not available here because App is not inside a Route,
		// but it is inside BrowserRouter.
		// We can manually parse.
		const encodedPath = currentPath.replace("/file/", "");
		currentFile = decodeURIComponent(encodedPath);
	}

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
						href="/auth/dropbox"
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
			<div
				className={`fixed inset-y-0 left-0 z-30 bg-gray-800 text-white transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 flex`}
				style={{ width: sidebarWidth }}
			>
				<div className="flex-1 overflow-hidden">
					<Sidebar
						files={files}
						onFileSelect={(path) => {
							navigate(
								`/file/${path.split("/").map(encodeURIComponent).join("/")}`,
							);
							setIsSidebarOpen(false);
						}}
						currentFile={currentFile}
						viewMode={viewMode}
						onAgendaSelect={() => {
							navigate("/agenda");
							setIsSidebarOpen(false);
						}}
					/>
				</div>
				{/* Resizer */}
				<div
					className="w-4 hover:bg-blue-500 cursor-col-resize transition-colors"
					onMouseDown={() => setIsResizing(true)}
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
								<svg
									className="w-6 h-6"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M4 6h16M4 12h16M4 18h16"
									/>
								</svg>
							</button>
							<h1 className="text-lg font-semibold text-gray-800 truncate">
								{viewMode === "agenda"
									? "Agenda"
									: currentFile || "Select a file"}
							</h1>
						</div>
						<div className="w-full max-w-md ml-4">
							<SearchBox onSearch={handleSearch} />
						</div>
					</div>
				</header>

				{/* Scrollable Content Area */}
				<main className="flex-1 overflow-y-auto p-4">
					{searchResults.length > 0 ? (
						<SearchResults
							results={searchResults}
							onSelectResult={handleSearchResultClick}
						/>
					) : (
						<Routes>
							<Route
								path="/agenda"
								element={<AgendaPage repository={repository} />}
							/>
							<Route
								path="/file/*"
								element={<FilePage repository={repository} />}
							/>
							<Route path="/" element={<Navigate to="/agenda" replace />} />
						</Routes>
					)}
				</main>
			</div>
		</div>
	);
}

export default App;
