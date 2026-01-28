import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { settingsService } from "../services/settingsService";
import { Loader, AlertTriangle } from "lucide-react";
import 'react-quill-new/dist/quill.snow.css'; 

export default function PageViewer() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await settingsService.getPageBySlug(slug);
        setPage(data);
      } catch (err) {
        console.error(err);
        setError("Strona nie została znaleziona.");
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader className="h-10 w-10 animate-spin text-gray-400 mb-4" />
        <p className="text-gray-500">Ładowanie treści...</p>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="bg-red-50 p-4 rounded-full mb-4">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Ups! Błąd 404</h2>
        <p className="text-gray-600 mb-6">{error || "Szukana strona nie istnieje."}</p>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          Wróć na stronę główną
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <article className="prose prose-lg max-w-none prose-headings:font-bold prose-a:text-blue-600 hover:prose-a:text-blue-800 prose-img:rounded-xl">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-8">{page.title}</h1>
        
        {/* Kontener dla treści */}
        <div className="ql-snow">
            <div 
                className="ql-content"
                dangerouslySetInnerHTML={{ __html: page.content }} 
            />
        </div>
      </article>
    </div>
  );
}