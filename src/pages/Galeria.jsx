import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { Image, Play, X } from 'lucide-react';
import { EditableImage, EditableText } from '@/components/layout/SiteEditor';

const DEFAULT_ALBUMS = [
  { id: 'treinos', nome: 'Treinos', descricao: 'Momentos dos treinos diários' },
  { id: 'campeonatos', nome: 'Campeonatos', descricao: 'Nossa atuação em competições' },
  { id: 'eventos', nome: 'Eventos Sociais', descricao: 'Confraternizações e eventos da escolinha' },
];

const PLACEHOLDER_PHOTOS = [
  { url: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=600&q=80', legenda: 'Treino Sub-11', albumNome: 'Treinos' },
  { url: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=600&q=80', legenda: 'Aquecimento', albumNome: 'Treinos' },
  { url: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&q=80', legenda: 'Jogo Regional', albumNome: 'Campeonatos' },
  { url: 'https://images.unsplash.com/photo-1508098682722-e99c643e7f0a?w=600&q=80', legenda: 'Disputa pelo campeonato', albumNome: 'Campeonatos' },
  { url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&q=80', legenda: 'Comemoração de título', albumNome: 'Campeonatos' },
  { url: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=600&q=80', legenda: 'Evento de encerramento', albumNome: 'Eventos Sociais' },
];

export default function Galeria() {
  const [albums, setAlbums] = useState([]);
  const [items, setItems] = useState([]);
  const [activeAlbum, setActiveAlbum] = useState('todos');
  const [lightbox, setLightbox] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.entities.GalleryAlbum.list('nome'),
      api.entities.GalleryItem.list('ordem'),
    ]).then(([albs, itns]) => {
      setAlbums(albs.length ? albs : DEFAULT_ALBUMS);
      setItems(itns.length ? itns : PLACEHOLDER_PHOTOS);
      setLoading(false);
    }).catch(() => {
      setAlbums(DEFAULT_ALBUMS);
      setItems(PLACEHOLDER_PHOTOS);
      setLoading(false);
    });
  }, []);

  const filtered = activeAlbum === 'todos'
    ? items
    : items.filter(i => i.albumNome === activeAlbum || i.albumId === activeAlbum);

  const albumNames = ['todos', ...albums.map(a => a.nome || a.id)];

  return (
    <div className="font-roboto">
      {/* Hero */}
      <section className="relative py-24 bg-burgundy">
        <div className="absolute inset-0 opacity-20">
          <EditableImage field="hero.background" src="https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=1920&q=80" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <p className="font-montserrat font-semibold text-gold uppercase tracking-widest text-sm mb-4"><EditableText field="hero.eyebrow">O coração da escola</EditableText></p>
          <h1 className="font-montserrat font-black text-white text-5xl mb-4"><EditableText field="hero.title">GALERIA</EditableText></h1>
          <div className="w-16 h-1 bg-gold mx-auto" />
        </div>
      </section>

      {/* Filtros */}
      <section className="bg-white py-6 px-4 border-b border-gray-200 sticky top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex gap-2 overflow-x-auto pb-1">
          {albumNames.map(name => (
            <button
              key={name}
              onClick={() => setActiveAlbum(name)}
              className={`flex-shrink-0 px-5 py-2 rounded-full font-montserrat font-semibold text-sm transition-all ${
                activeAlbum === name
                  ? 'bg-burgundy text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {name === 'todos' ? 'Todos' : name}
            </button>
          ))}
        </div>
      </section>

      {/* Grid Masonry */}
      <section className="py-12 px-4 bg-gray-50 min-h-96">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className={`w-full bg-gray-200 rounded-xl animate-pulse mb-4 ${i % 3 === 0 ? 'h-64' : i % 3 === 1 ? 'h-48' : 'h-80'}`} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Image size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400 font-montserrat">Nenhuma foto neste álbum ainda</p>
            </div>
          ) : (
            <div className="columns-2 md:columns-3 lg:columns-4 gap-3">
              {filtered.map((item, i) => (
                <div
                  key={i}
                  className="break-inside-avoid mb-3 relative group cursor-pointer overflow-hidden rounded-xl"
                  onClick={() => setLightbox(item)}
                >
                  {item.tipo === 'video' ? (
                    <div className="relative">
                      <video src={item.url} className="w-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Play size={40} className="text-white" />
                      </div>
                    </div>
                  ) : (
                    <img
                      src={item.url}
                      alt={item.legenda || 'Galeria Arco Iris'}
                      className="w-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-burgundy/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                    <p className="text-white font-roboto text-sm">{item.legenda}</p>
                  </div>
                  <div className="absolute top-2 right-2 bg-gold/90 text-burgundy text-xs font-montserrat font-bold px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.albumNome}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white hover:text-gold" onClick={() => setLightbox(null)}>
            <X size={32} />
          </button>
          <div className="max-w-4xl max-h-screen" onClick={e => e.stopPropagation()}>
            <img src={lightbox.url} alt={lightbox.legenda} className="max-w-full max-h-[80vh] object-contain rounded-xl" />
            {lightbox.legenda && (
              <p className="text-white text-center mt-4 font-roboto">{lightbox.legenda}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}