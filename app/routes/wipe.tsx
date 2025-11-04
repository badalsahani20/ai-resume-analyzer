import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { usePuterStore } from "~/lib/puter";

const wipe = () => {
  const { auth, fs, isLoading, error, kv } = usePuterStore();
  const navigate = useNavigate();
  const [files, setFiles] = useState<FSItem[]>();

  const loadFiles = async () => {
    const files = (await fs.readDir("./")) as FSItem[];
    setFiles(files);
  };

  useEffect(() => {
    loadFiles();
  }, []);

  useEffect(() => {
    if (!isLoading && !auth.isAuthenticated) {
      navigate("/auth?next=/wipe");
    }
  }, [isLoading]);

  const handleDelete = async () => {
    files?.forEach(async (file) => {
      await fs.delete(file.path);
    });
    await kv.flush();
    loadFiles();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-lg">
        ❌ Error: {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      <div className="space-y-6 bg-white p-6 rounded-lg shadow-md max-w-3xl">
        {/* Auth Info */}
        <div className="text-gray-700 text-lg font-medium">
          ✅ Authenticated as:{" "}
          <span className="font-semibold text-blue-600">
            {auth.user?.username}
          </span>
        </div>

        {/* File List */}
        <div>
          <h3 className="text-gray-800 font-semibold mb-2">
            📁 Existing Files:
          </h3>
          {files?.length ? (
            <div className="grid grid-cols-4 gap-5">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="p-3 bg-gray-50 border border-gray-200 rounded-md flex items-center justify-between"
                >
                  <p className="text-gray-700 truncate hover:overflow-visible">{file.name}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No files found.</p>
          )}
        </div>

        {/* Wipe Button */}
        <button
          className="bg-red-500 hover:bg-red-600 transition text-white font-medium px-4 py-2 rounded-md shadow-sm"
          onClick={() => handleDelete()}
        >
          🧹 Wipe App Data
        </button>
      </div>
    </div>
  );
};

export default wipe;
