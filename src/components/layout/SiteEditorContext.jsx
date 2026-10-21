import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';

const SiteEditorContext = createContext(null);

export function SiteEditorProvider({ children }) {
  const { pathname } = useLocation();
  const { isAuthenticated, user } = useAuth();
  const slug = pathname === '/' ? 'home' : pathname.slice(1).replaceAll('/', '-');
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadedSlug, setLoadedSlug] = useState(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const pagesRef = useRef(new Map());
  const saveQueueRef = useRef(Promise.resolve());
  const activeSlugRef = useRef(slug);
  const isAdmin = isAuthenticated && user?.role === 'admin';

  useEffect(() => {
    let cancelled = false;
    activeSlugRef.current = slug;
    setEditing(false);
    setError('');
    setPage(null);
    setLoading(true);
    setLoadedSlug(null);
    api.entities.SitePage.filter({ slug }, null, 1)
      .then(([record]) => {
        if (cancelled) return;
        if (record) pagesRef.current.set(slug, record);
        setPage(record || null);
        setLoadedSlug(slug);
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(`Não foi possível carregar o conteúdo editável: ${requestError.message}`);
          setLoadedSlug(slug);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [slug]);

  const savePage = (patch) => {
    const targetSlug = slug;
    const operation = saveQueueRef.current.catch(() => {}).then(async () => {
      const current = pagesRef.current.get(targetSlug) || null;
      const nextData = {
        slug: targetSlug,
        fields: current?.fields || {},
        blocks: current?.blocks || [],
        ...(typeof patch === 'function' ? patch(current) : patch),
      };
      const saved = current?.id
        ? await api.entities.SitePage.update(current.id, nextData)
        : await api.entities.SitePage.create(nextData);
      pagesRef.current.set(targetSlug, saved);
      if (activeSlugRef.current === targetSlug) {
        setPage(saved);
        setError('');
      }
      return saved;
    }).catch((saveError) => {
      if (activeSlugRef.current === targetSlug) {
        setError(`Não foi possível salvar. ${saveError.message}`);
      }
      throw saveError;
    });
    saveQueueRef.current = operation;
    return operation;
  };

  const saveField = (key, value) => savePage((current) => ({
    fields: { ...(current?.fields || {}), [key]: value },
  }));

  const saveBlocks = (blocks) => savePage({ blocks });

  return (
    <SiteEditorContext.Provider value={{
      slug,
      isAdmin,
      editing: editing && isAdmin && loadedSlug === slug && !loading,
      setEditing,
      page: loadedSlug === slug ? page : null,
      loading: loadedSlug !== slug || loading,
      saveField,
      saveBlocks,
      error,
      setError,
    }}>
      {children}
    </SiteEditorContext.Provider>
  );
}

export function useSiteEditor() {
  return useContext(SiteEditorContext);
}
