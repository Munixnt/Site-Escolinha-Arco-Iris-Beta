import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { Plus, Trash2, Save, Loader2, Upload, Image } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Conteudo() {
  const [events, setEvents] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.entities.TimelineEvent.list('ordem'),
      api.entities.GalleryAlbum.list('nome'),
      api.entities.GalleryItem.list('ordem'),
    ]).then(([ev, alb, itns]) => {
      setEvents(ev);
      setAlbums(alb);
      setItems(itns);
    });
  }, []);

  // Timeline Events
  const addEvent = () => setEvents(prev => [...prev, { ano: '', titulo: '', descricao: '', _new: true }]);
  const updateEvent = (i, field, val) => setEvents(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: val } : e));
  const deleteEvent = async (ev, i) => {
    if (ev.id) await api.entities.TimelineEvent.delete(ev.id);
    setEvents(prev => prev.filter((_, idx) => idx !== i));
  };
  const saveEvents = async () => {
    setSaving(true);
    for (const [i, ev] of events.entries()) {
      if (ev.id) await api.entities.TimelineEvent.update(ev.id, { ...ev, ordem: i });
      else await api.entities.TimelineEvent.create({ ...ev, ordem: i });
    }
    const updated = await api.entities.TimelineEvent.list('ordem');
    setEvents(updated);
    setSaving(false);
  };

  // Gallery Albums
  const [newAlbum, setNewAlbum] = useState('');
  const createAlbum = async () => {
    if (!newAlbum.trim()) return;
    const alb = await api.entities.GalleryAlbum.create({ nome: newAlbum });
    setAlbums(prev => [...prev, alb]);
    setNewAlbum('');
  };
  const deleteAlbum = async (alb) => {
    await api.entities.GalleryAlbum.delete(alb.id);
    setAlbums(prev => prev.filter(a => a.id !== alb.id));
  };

  // Gallery Items Upload
  const uploadPhoto = async (e) => {
    if (!selectedAlbum) { alert('Selecione um álbum primeiro'); return; }
    const files = Array.from(e.target.files);
    setLoading(true);
    for (const file of files) {
      const { file_url } = await api.integrations.Core.UploadFile({ file });
      const album = albums.find(a => a.id === selectedAlbum);
      const item = await api.entities.GalleryItem.create({
        albumId: selectedAlbum,
        albumNome: album?.nome || '',
        tipo: 'foto',
        url: file_url,
        legenda: file.name.split('.')[0],
      });
      setItems(prev => [...prev, item]);
    }
    setLoading(false);
  };

  const deleteItem = async (item) => {
    await api.entities.GalleryItem.delete(item.id);
    setItems(prev => prev.filter(i => i.id !== item.id));
  };

  const albumItems = selectedAlbum ? items.filter(i => i.albumId === selectedAlbum) : items;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-montserrat font-black text-gray-800 text-3xl">Gestor de Conteúdo</h1>
        <p className="text-gray-500 mt-1">Edite os conteúdos públicos do site</p>
      </div>

      <Tabs defaultValue="timeline">
        <TabsList className="mb-6">
          <TabsTrigger value="timeline" className="font-montserrat font-semibold">Linha do Tempo</TabsTrigger>
          <TabsTrigger value="galeria" className="font-montserrat font-semibold">Galeria</TabsTrigger>
        </TabsList>

        {/* Timeline */}
        <TabsContent value="timeline">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-montserrat font-bold text-gray-800 text-lg">Marcos Históricos</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={addEvent} className="gap-2 font-montserrat font-semibold">
                  <Plus size={16} /> Adicionar Marco
                </Button>
                <Button onClick={saveEvents} disabled={saving} className="bg-burgundy hover:bg-red-900 text-white font-montserrat font-bold gap-2">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Salvar Todos
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              {events.map((ev, i) => (
                <div key={i} className="grid grid-cols-12 gap-3 p-4 border border-gray-200 rounded-xl">
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500 font-montserrat font-semibold">Ano</label>
                    <Input className="mt-1" value={ev.ano} onChange={e => updateEvent(i, 'ano', e.target.value)} placeholder="2017" />
                  </div>
                  <div className="col-span-4">
                    <label className="text-xs text-gray-500 font-montserrat font-semibold">Título</label>
                    <Input className="mt-1" value={ev.titulo} onChange={e => updateEvent(i, 'titulo', e.target.value)} placeholder="Nome do Marco" />
                  </div>
                  <div className="col-span-5">
                    <label className="text-xs text-gray-500 font-montserrat font-semibold">Descrição</label>
                    <Input className="mt-1" value={ev.descricao} onChange={e => updateEvent(i, 'descricao', e.target.value)} placeholder="Descreva o marco histórico" />
                  </div>
                  <div className="col-span-1 flex items-end">
                    <button onClick={() => deleteEvent(ev, i)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {events.length === 0 && (
                <p className="text-center text-gray-400 py-8">Nenhum marco cadastrado. Clique em "Adicionar Marco".</p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Galeria */}
        <TabsContent value="galeria">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Albums */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="font-montserrat font-bold text-gray-800 mb-4">Álbuns</h2>
              <div className="flex gap-2 mb-4">
                <Input value={newAlbum} onChange={e => setNewAlbum(e.target.value)} placeholder="Nome do álbum" className="text-sm" />
                <Button onClick={createAlbum} size="sm" className="bg-burgundy hover:bg-red-900 text-white">
                  <Plus size={14} />
                </Button>
              </div>
              <div className="space-y-2">
                {albums.map(alb => (
                  <div
                    key={alb.id}
                    onClick={() => setSelectedAlbum(alb.id === selectedAlbum ? '' : alb.id)}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                      selectedAlbum === alb.id ? 'bg-burgundy text-white' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <span className="font-montserrat font-semibold text-sm">{alb.nome}</span>
                    <button
                      onClick={e => { e.stopPropagation(); deleteAlbum(alb); }}
                      className="p-1 rounded hover:bg-black/10"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Upload + Grid */}
            <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-montserrat font-bold text-gray-800">
                  Fotos {selectedAlbum ? `— ${albums.find(a => a.id === selectedAlbum)?.nome}` : '(todos os álbuns)'}
                </h2>
                <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-gold text-burgundy font-montserrat font-bold text-sm rounded-lg hover:bg-yellow-400 transition-all">
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  Fazer Upload
                  <input type="file" multiple accept="image/*" className="hidden" onChange={uploadPhoto} />
                </label>
              </div>
              {albumItems.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Image size={40} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">{selectedAlbum ? 'Nenhuma foto neste álbum' : 'Selecione um álbum para ver as fotos'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {albumItems.map(item => (
                    <div key={item.id} className="relative group rounded-lg overflow-hidden aspect-square">
                      <img src={item.url} alt={item.legenda} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button onClick={() => deleteItem(item)} className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}