import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import type { OrgFile } from "@orgdrop/domain";
import { OrgViewer } from "../ui/OrgViewer";
import type { RemoteFileRepository } from "../repository/RemoteFileRepository";

interface FilePageProps {
	repository: RemoteFileRepository;
}

export function FilePage({ repository }: FilePageProps) {
	const params = useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const path = params["*"];
	const [parsedFile, setParsedFile] = useState<OrgFile | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// The path param might be encoded or decoded depending on the router and browser.
	// We use a wildcard route /file/* to capture the full path even if it contains slashes.

	useEffect(() => {
		const loadFile = async () => {
			if (!path) return;

			setIsLoading(true);
			setError(null);
			try {
				// Decode just in case, though useParams usually decodes.
				// If the user manually types /file/folder/file.org, it might be an issue if we use :path.
				// But let's assume we use encoded paths for now or wildcard.
				// If we use wildcard in route: <Route path="/file/*" ... />
				// Then useParams()["*"] gives the rest.
				// Let's assume we use /file/:path and rely on encoding.

				const decodedPath = decodeURIComponent(path);
				const parsed = await repository.readFile(decodedPath);
				setParsedFile(parsed);
			} catch (e: any) {
				console.error("Failed to load file", e);
				setError(e.message || "Failed to load file");
			} finally {
				setIsLoading(false);
			}
		};
		loadFile();
	}, [repository, path]);

	// Handle hash scrolling after file load
	useEffect(() => {
		if (!isLoading && parsedFile && location.hash) {
			const id = location.hash.substring(1);
			// Small timeout to ensure DOM is ready
			setTimeout(() => {
				const el = document.getElementById(id);
				if (el) {
					el.scrollIntoView();
				}
			}, 100);
		}
	}, [isLoading, parsedFile, location.hash]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-full">
				Loading file...
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center h-full text-red-600">
				{error}
			</div>
		);
	}

	if (!parsedFile || !path) {
		return (
			<div className="flex items-center justify-center h-full">
				No file selected
			</div>
		);
	}

	const currentFile = decodeURIComponent(path);

	return (
		<OrgViewer
			file={parsedFile}
			resolveImage={(src) => {
				if (src.startsWith("http")) return src;
				let imagePath = src;
				if (!src.startsWith("/") && currentFile) {
					const currentDir = currentFile.substring(
						0,
						currentFile.lastIndexOf("/"),
					);
					if (currentDir) {
						imagePath = `${currentDir}/${src}`;
					}
				}
				return `/api/images/${encodeURIComponent(imagePath)}`;
			}}
			onLinkClick={async (href) => {
				if (href.startsWith("file:")) {
					const target = href.replace("file:", "");
					const resolved = resolvePath(currentFile, target);
					navigate(
						`/file/${target.startsWith("/") ? encodeURIComponent(target.substring(1)) : encodeURIComponent(resolved)}`,
					);
				} else if (href.startsWith("id:")) {
					const id = href.replace("id:", "");
					const el = document.getElementById(id);
					if (el) {
						el.scrollIntoView();
					} else {
						// Search for ID in other files
						try {
							const results = await repository.search(`:ID: ${id}`);
							if (results.length > 0) {
								const targetFile = results[0].filePath;
								// Navigate to file with hash
								navigate(`/file/${encodeURIComponent(targetFile)}#${id}`);
							} else {
								console.warn(`ID not found: ${id}`);
							}
						} catch (e) {
							console.error("Failed to search for ID", e);
						}
					}
				} else if (href.startsWith("*")) {
					const title = href.substring(1);
					const el = document.querySelector(
						`[data-title="${title.replace(/"/g, '\\"')}"]`,
					);
					if (el) el.scrollIntoView();
				} else {
					window.open(href, "_blank");
				}
			}}
		/>
	);
}

function resolvePath(currentPath: string, relativePath: string): string {
	if (relativePath.startsWith("/")) return relativePath;
	const parts = currentPath.split("/");
	parts.pop(); // Remove filename
	const relParts = relativePath.split("/");
	for (const part of relParts) {
		if (part === ".") continue;
		if (part === "..") {
			parts.pop();
		} else {
			parts.push(part);
		}
	}
	return parts.join("/");
}
