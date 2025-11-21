import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import type { OrgFile } from '../domain/org/ast';
import { OrgViewer } from '../ui/OrgViewer';
import type { RemoteFileRepository } from '../repository/RemoteFileRepository';

interface FilePageProps {
    repository: RemoteFileRepository;
}

export function FilePage({ repository }: FilePageProps) {
    const { path } = useParams<{ path: string }>();
    const [parsedFile, setParsedFile] = useState<OrgFile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // The path param might be encoded. react-router-dom decodes params by default.
    // If we use a wildcard route like /file/*, path would be the rest of the URL.
    // If we use /file/:path, and pass "folder%2Ffile.org", path will be "folder/file.org".
    // Let's assume we pass encoded path to /file/:path.

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
                console.error('Failed to load file', e);
                setError(e.message || 'Failed to load file');
            } finally {
                setIsLoading(false);
            }
        };
        loadFile();
    }, [repository, path]);

    if (isLoading) {
        return <div className="flex items-center justify-center h-full">Loading file...</div>;
    }

    if (error) {
        return <div className="flex items-center justify-center h-full text-red-600">{error}</div>;
    }

    if (!parsedFile || !path) {
        return <div className="flex items-center justify-center h-full">No file selected</div>;
    }

    const currentFile = decodeURIComponent(path);

    return (
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
                // Ensure we don't double slash if currentDir is empty or src starts with /
                // But the logic above handles relative paths.
                // Absolute paths in org mode usually start with /, but here we treat them relative to dropbox root?
                // The original logic:
                /*
                if (!src.startsWith('/') && currentFile) {
                   const currentDir = currentFile.substring(0, currentFile.lastIndexOf('/'));
                   if (currentDir) {
                     imagePath = `${currentDir}/${src}`;
                   }
                 }
                */
                // If src starts with /, it's absolute from root.

                return `http://localhost:8787/api/images/${encodeURIComponent(imagePath)}`;
            }}
        />
    );
}
