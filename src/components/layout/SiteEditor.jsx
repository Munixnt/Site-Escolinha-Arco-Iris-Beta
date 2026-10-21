import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Edit3, ImagePlus, Save, Trash2, X } from 'lucide-react';
import { api } from '@/api/client';
import { useSiteEditor } from './SiteEditorContext';

const BLOCK_TEMPLATES = {
  text: { type: 'text', title: 'Nova seção', text: 'Escreva aqui o conteúdo desta seção.' },
  callout: { type: 'callout', title: 'Chamada especial', text: 'Adicione uma mensagem importante.' },
  image: { type: 'image', title: 'Imagem', text: 'Descreva a imagem.', url: '' },
  button: { type: 'button', title: 'Saiba mais', text: '#' },
};

function EditableText({ field, as: Tag = 'span', children, className, ...props }) {
  const editor = useSiteEditor();
  const original = String(children ?? '');
  const text = editor?.page?.fields?.[field] ?? original;
  const save = async (event) => {
    const value = event.currentTarget.textContent || '';
    if (value !== text) {
      try {
        await editor.saveField(field, value);
      } catch {
        event.currentTarget.textContent = text;
      }
    }
  };
  return (
    <Tag
      className={`${className || ''} ${editor?.editing ? 'rounded-sm outline outline-1 outline-dashed outline-gold/80 hover:outline-2 focus:outline-2 cursor-text' : ''}`}
      contentEditable={Boolean(editor?.editing)}
      suppressContentEditableWarning
      onBlur={editor?.editing ? save : undefined}
      onClick={editor?.editing ? (event) => {
        event.preventDefault();
        event.stopPropagation();
      } : undefined}
      role={editor?.editing ? 'textbox' : undefined}
      aria-label={editor?.editing ? `Editar ${field}` : undefined}
      title={editor?.editing ? 'Clique para editar; as alterações são publicadas ao sair do campo' : undefined}
      {...props}
    >
      {text}
    </Tag>
  );
}

function EditableImage({ field, src, alt, className, ...props }) {
  const editor = useSiteEditor();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const imageSrc = editor?.page?.fields?.[field] || src;

  const uploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const { file_url } = await api.integrations.Core.UploadFile({ file, visibility: 'public' });
      await editor.saveField(field, file_url);
    } catch (error) {
      editor.setError(`Não foi possível atualizar a imagem. ${error.message}`);
    } finally {
      setBusy(false);
      event.target.value = '';
    }
  };

  return (
    <>
      {editor?.editing && (
        <input ref={inputRef} type="file" accept="image/*" onChange={uploadImage} className="hidden" />
      )}
      <img
        src={imageSrc}
        alt={alt}
        className={`${className || ''} ${editor?.editing ? 'cursor-pointer outline outline-2 outline-dashed outline-gold hover:outline-solid' : ''} ${busy ? 'opacity-50' : ''}`}
        onClick={editor?.editing ? () => inputRef.current?.click() : props.onClick}
        onKeyDown={editor?.editing ? (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            inputRef.current?.click();
          }
        } : undefined}
        role={editor?.editing ? 'button' : undefined}
        tabIndex={editor?.editing ? 0 : undefined}
        title={editor?.editing ? 'Clique para trocar a imagem' : undefined}
        {...Object.fromEntries(Object.entries(props).filter(([key]) => key !== 'onClick'))}
      />
    </>
  );
}

function safeHref(url) {
  return /^(https?:\/\/|\/|mailto:|tel:)/i.test(url || '') ? url : '#';
}

function CustomBlocks() {
  const editor = useSiteEditor();
  const blocks = editor?.page?.blocks || [];
  if (!blocks.length && !editor?.editing) return null;

  const move = (index, direction) => {
    const next = [...blocks];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    editor.saveBlocks(next).catch(() => {});
  };

  const remove = (id) => editor.saveBlocks(blocks.filter((block) => block.id !== id)).catch(() => {});

  return (
    <section className="bg-white py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-5">
        {blocks.map((block, index) => (
          <article
            key={block.id}
            className={`rounded-xl p-6 ${block.type === 'callout' ? 'bg-burgundy text-white' : 'bg-gray-50 text-gray-700'}`}
          >
            {editor.editing && (
              <div className="flex justify-end gap-2 mb-3">
                <button aria-label="Mover seção para cima" onClick={() => move(index, -1)} className="p-2 rounded border hover:bg-white/80"><ArrowUp size={16} /></button>
                <button aria-label="Mover seção para baixo" onClick={() => move(index, 1)} className="p-2 rounded border hover:bg-white/80"><ArrowDown size={16} /></button>
                <button aria-label="Remover seção" onClick={() => remove(block.id)} className="p-2 rounded border text-red-600 hover:bg-white/80"><Trash2 size={16} /></button>
              </div>
            )}
            {block.type === 'image' && block.url && (
              <img src={block.url} alt={block.title} className="max-h-96 w-full object-cover rounded-lg mb-4" />
            )}
            {block.type === 'button' ? (
              <a href={safeHref(block.text)} className="inline-flex px-6 py-3 rounded-lg bg-gold text-burgundy font-bold">
                {block.title}
              </a>
            ) : (
              <>
                <h2 className="font-montserrat font-bold text-xl mb-2">{block.title}</h2>
                <p>{block.text}</p>
              </>
            )}
            {editor.editing && (
              <BlockEditor
                block={block}
                onSave={(updated) => editor.saveBlocks(blocks.map((item) => item.id === block.id ? updated : item))}
              />
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function BlockEditor({ block, onSave }) {
  const editor = useSiteEditor();
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState(block);

  useEffect(() => setDraft(block), [block]);

  const uploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const { file_url } = await api.integrations.Core.UploadFile({ file, visibility: 'public' });
      const next = { ...draft, url: file_url };
      setDraft(next);
      await onSave(next);
    } catch (error) {
      editor.setError(`Não foi possível enviar a imagem. ${error.message}`);
    } finally {
      setBusy(false);
      event.target.value = '';
    }
  };
  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-2 border-t border-gray-300/50 pt-3">
      <label className="text-xs font-semibold">Título
        <input value={draft.title || ''} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className="mt-1 w-full rounded border px-2 py-1 text-sm text-gray-800" />
      </label>
      {block.type === 'button' ? (
        <label className="text-xs font-semibold">Link
          <input value={draft.text || ''} onChange={(event) => setDraft({ ...draft, text: event.target.value })} className="mt-1 w-full rounded border px-2 py-1 text-sm text-gray-800" />
        </label>
      ) : (
        <label className="text-xs font-semibold">Texto
          <textarea value={draft.text || ''} onChange={(event) => setDraft({ ...draft, text: event.target.value })} className="mt-1 w-full rounded border px-2 py-1 text-sm text-gray-800" rows={3} />
        </label>
      )}
      {block.type === 'image' && (
        <div className="sm:col-span-2">
          <input ref={fileRef} type="file" accept="image/*" onChange={uploadImage} className="hidden" />
          <button type="button" disabled={busy} onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded border px-3 py-2 text-sm">
            <ImagePlus size={16} /> {busy ? 'Enviando...' : 'Escolher imagem'}
          </button>
        </div>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={() => onSave(draft).catch(() => {})}
        className="inline-flex w-fit items-center gap-2 rounded bg-burgundy px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        <Save size={15} /> Salvar seção
      </button>
    </div>
  );
}

export function SiteEditorControls() {
  const editor = useSiteEditor();
  if (!editor?.isAdmin || editor.loading) return null;

  const addBlock = (type) => {
    const blocks = editor.page?.blocks || [];
    editor.saveBlocks([
      ...blocks,
      { ...BLOCK_TEMPLATES[type], id: crypto.randomUUID() },
    ]).catch(() => {});
  };

  return (
    <>
      <div className="fixed right-4 bottom-4 z-[60] flex items-center gap-2 rounded-xl bg-navy p-2 text-white shadow-xl">
        {editor.editing ? (
          <>
            <select aria-label="Adicionar seção" defaultValue="" onChange={(event) => {
              if (event.target.value) addBlock(event.target.value);
              event.target.value = '';
            }} className="rounded bg-white px-2 py-2 text-sm text-gray-800">
              <option value="" disabled>Adicionar seção...</option>
              <option value="text">Texto</option>
              <option value="callout">Destaque</option>
              <option value="image">Imagem</option>
              <option value="button">Botão com link</option>
            </select>
            <span className="hidden sm:inline text-xs text-white/80">Alterações são publicadas ao salvar</span>
            <button onClick={() => editor.setEditing(false)} className="inline-flex items-center gap-2 rounded bg-gold px-3 py-2 font-bold text-burgundy">
              <Save size={16} /> Concluir
            </button>
          </>
        ) : (
          <button onClick={() => editor.setEditing(true)} className="inline-flex items-center gap-2 rounded bg-gold px-4 py-3 font-bold text-burgundy">
            <Edit3 size={17} /> Editar este site
          </button>
        )}
      </div>
      {editor.error && (
        <div role="alert" className="fixed bottom-20 right-4 z-[60] max-w-sm rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 shadow-lg">
          <div className="flex items-start gap-2"><X size={16} className="mt-0.5 shrink-0" />{editor.error}</div>
        </div>
      )}
    </>
  );
}

export { CustomBlocks, EditableImage, EditableText };
