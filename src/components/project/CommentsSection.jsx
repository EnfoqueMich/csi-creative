import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Paperclip, X, FileText, Reply, Loader2, Image as ImageIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import SectionCard from "./SectionCard";
import moment from "moment";
import "moment/locale/es";
moment.locale("es");

function Avatar({ nombre, size = "sm" }) {
  const initials = (nombre || "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const colors = ["bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500", "bg-pink-500", "bg-teal-500"];
  const color = colors[(nombre || "").charCodeAt(0) % colors.length];
  const sz = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";
  return (
    <div className={`${sz} ${color} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}

function FilePreview({ file, onRemove }) {
  const isImage = file.tipo?.startsWith("image/");
  return (
    <div className="relative group inline-flex items-center gap-1.5 bg-muted rounded-lg px-2 py-1 text-xs border border-border">
      {isImage ? <ImageIcon className="w-3 h-3 text-blue-500" /> : <FileText className="w-3 h-3 text-red-500" />}
      <span className="max-w-[120px] truncate">{file.nombre}</span>
      {onRemove && (
        <button onClick={onRemove} className="ml-1 text-muted-foreground hover:text-destructive">
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

function AttachmentView({ file }) {
  const isImage = file.tipo?.startsWith("image/");
  if (isImage) {
    return (
      <a href={file.url} target="_blank" rel="noopener noreferrer">
        <img src={file.url} alt={file.nombre} className="max-h-48 rounded-lg border border-border object-cover cursor-pointer hover:opacity-90 transition-opacity" />
      </a>
    );
  }
  return (
    <a href={file.url} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-3 py-2 bg-muted rounded-lg border border-border text-xs hover:bg-muted/80 transition-colors">
      <FileText className="w-4 h-4 text-red-500" />
      <span className="max-w-[200px] truncate">{file.nombre}</span>
    </a>
  );
}

function CommentInput({ projectId, parentId = null, onSent, currentUser, placeholder = "Escribe un comentario...", autoFocus = false }) {
  const [texto, setTexto] = useState("");
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const fileRef = useRef();

  const handleFileChange = async (e) => {
    const selected = Array.from(e.target.files);
    if (!selected.length) return;
    setUploading(true);
    const uploaded = await Promise.all(
      selected.map(async (f) => {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: f });
        return { url: file_url, nombre: f.name, tipo: f.type };
      })
    );
    setFiles((prev) => [...prev, ...uploaded]);
    setUploading(false);
    e.target.value = "";
  };

  const handleSend = async () => {
    if (!texto.trim() && files.length === 0) return;
    setSending(true);
    await base44.entities.Comment.create({
      project_id: projectId,
      parent_id: parentId || null,
      texto: texto.trim(),
      autor_nombre: currentUser?.full_name || currentUser?.email || "Usuario",
      autor_email: currentUser?.email || "",
      archivos: files,
    });
    setTexto("");
    setFiles([]);
    setSending(false);
    onSent();
  };

  return (
    <div className="space-y-2">
      <Textarea
        autoFocus={autoFocus}
        placeholder={placeholder}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSend(); }}
        className="text-sm resize-none min-h-[80px]"
      />
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((f, i) => (
            <FilePreview key={i} file={f} onRemove={() => setFiles((prev) => prev.filter((_, j) => j !== i))} />
          ))}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-muted"
            disabled={uploading}
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
            {uploading ? "Subiendo..." : "Adjuntar"}
          </button>
          <input ref={fileRef} type="file" multiple accept="image/*,.pdf" className="hidden" onChange={handleFileChange} />
          <span className="text-xs text-muted-foreground hidden sm:block">Ctrl+Enter para enviar</span>
        </div>
        <Button size="sm" onClick={handleSend} disabled={sending || (!texto.trim() && files.length === 0)} className="gap-1.5">
          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          Enviar
        </Button>
      </div>
    </div>
  );
}

function CommentItem({ comment, replies, currentUser, projectId, onRefresh }) {
  const [showReply, setShowReply] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Avatar nombre={comment.autor_nombre} />
        <div className="flex-1 min-w-0">
          <div className="bg-muted/40 rounded-xl rounded-tl-sm px-4 py-3 border border-border">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-sm font-semibold">{comment.autor_nombre || "Usuario"}</span>
              <span className="text-xs text-muted-foreground">{moment(comment.created_date).fromNow()}</span>
            </div>
            {comment.texto && <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{comment.texto}</p>}
            {comment.archivos?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {comment.archivos.map((f, i) => <AttachmentView key={i} file={f} />)}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowReply(!showReply)}
            className="mt-1.5 ml-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <Reply className="w-3 h-3" />
            Responder
          </button>

          {showReply && (
            <div className="mt-2 ml-2">
              <CommentInput
                projectId={projectId}
                parentId={comment.id}
                currentUser={currentUser}
                placeholder={`Responder a ${comment.autor_nombre}...`}
                autoFocus
                onSent={() => { setShowReply(false); onRefresh(); }}
              />
            </div>
          )}

          {/* Respuestas */}
          {replies?.length > 0 && (
            <div className="mt-3 ml-4 space-y-3 border-l-2 border-border pl-4">
              {replies.map((r) => (
                <div key={r.id} className="flex gap-2">
                  <Avatar nombre={r.autor_nombre} size="xs" />
                  <div className="flex-1 min-w-0">
                    <div className="bg-muted/30 rounded-xl rounded-tl-sm px-3 py-2.5 border border-border">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-semibold">{r.autor_nombre || "Usuario"}</span>
                        <span className="text-xs text-muted-foreground">{moment(r.created_date).fromNow()}</span>
                      </div>
                      {r.texto && <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">{r.texto}</p>}
                      {r.archivos?.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-2">
                          {r.archivos.map((f, i) => <AttachmentView key={i} file={f} />)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CommentsSection({ projectId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  const load = async () => {
    const [user, data] = await Promise.all([
      base44.auth.me(),
      base44.entities.Comment.filter({ project_id: projectId }, "created_date", 200),
    ]);
    setCurrentUser(user);
    setComments(data);
    setLoading(false);
  };

  useEffect(() => { if (projectId) load(); }, [projectId]);

  const roots = comments.filter((c) => !c.parent_id);
  const repliesOf = (id) => comments.filter((c) => c.parent_id === id);

  return (
    <SectionCard icon={MessageSquare} title="Comentarios en el Proceso" number="6">
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-5">
          {roots.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Aún no hay comentarios. ¡Sé el primero!</p>
          )}
          {roots.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              replies={repliesOf(c.id)}
              currentUser={currentUser}
              projectId={projectId}
              onRefresh={load}
            />
          ))}

          <div className="border-t border-border pt-5">
            <div className="flex gap-3">
              <Avatar nombre={currentUser?.full_name || currentUser?.email} />
              <div className="flex-1">
                <CommentInput
                  projectId={projectId}
                  currentUser={currentUser}
                  onSent={load}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  );
}