import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pencil, Save, X } from "lucide-react";
import { toast } from "sonner";
import {
  useGuidanceQuestions,
  useCreateGuidanceQuestion,
  useUpdateGuidanceQuestion,
  useDeleteGuidanceQuestion,
} from "@/hooks/useSkuLevels";
import type { GuidanceQuestion } from "@/hooks/useSkuLevels";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface GuidanceQuestionEditorProps {
  skuId: string;
}

interface OptionItem {
  label: string;
  value: string;
  level_bump?: number;
}

interface QuestionFormState {
  question_text: string;
  is_mandatory: boolean;
  options: OptionItem[];
}

const defaultForm: QuestionFormState = {
  question_text: "",
  is_mandatory: false,
  options: [{ label: "", value: "", level_bump: 0 }],
};

export function GuidanceQuestionEditor({ skuId }: GuidanceQuestionEditorProps) {
  const { data: questions = [], isLoading } = useGuidanceQuestions(skuId);
  const createQuestion = useCreateGuidanceQuestion();
  const updateQuestion = useUpdateGuidanceQuestion();
  const deleteQuestion = useDeleteGuidanceQuestion();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [addMode, setAddMode] = useState(false);
  const [form, setForm] = useState<QuestionFormState>({ ...defaultForm });

  const resetForm = () => {
    setForm({ ...defaultForm, options: [{ label: "", value: "", level_bump: 0 }] });
    setEditingId(null);
    setAddMode(false);
  };

  const startEdit = (q: GuidanceQuestion) => {
    setEditingId(q.id);
    setAddMode(false);
    const opts = (q.options as unknown as OptionItem[]) || [];
    setForm({
      question_text: q.question_text,
      is_mandatory: q.is_mandatory,
      options: opts.length > 0 ? opts : [{ label: "", value: "", level_bump: 0 }],
    });
  };

  const handleSave = () => {
    if (!form.question_text.trim()) {
      toast.error("Question text is required");
      return;
    }
    const validOptions = form.options.filter(o => o.label.trim());
    if (validOptions.length < 2) {
      toast.error("At least 2 options are required");
      return;
    }

    if (editingId) {
      updateQuestion.mutate(
        {
          id: editingId,
          skuId,
          updates: {
            question_text: form.question_text.trim(),
            is_mandatory: form.is_mandatory,
            options: validOptions as any,
          },
        },
        {
          onSuccess: () => { toast.success("Question updated"); resetForm(); },
          onError: (e) => toast.error(e.message),
        }
      );
    } else {
      const nextOrder = questions.length > 0 ? Math.max(...questions.map(q => q.question_order)) + 1 : 1;
      createQuestion.mutate(
        {
          sku_id: skuId,
          question_order: nextOrder,
          question_text: form.question_text.trim(),
          is_mandatory: form.is_mandatory,
          options: validOptions as any,
        },
        {
          onSuccess: () => { toast.success("Question created"); resetForm(); },
          onError: (e) => toast.error(e.message),
        }
      );
    }
  };

  const handleDelete = (q: GuidanceQuestion) => {
    deleteQuestion.mutate(
      { id: q.id, skuId },
      {
        onSuccess: () => toast.success("Question deleted"),
        onError: (e) => toast.error(e.message),
      }
    );
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading questions…</p>;

  const isEditing = editingId !== null || addMode;

  return (
    <div className="space-y-3">
      {questions.length === 0 && !addMode && (
        <p className="text-sm text-muted-foreground">No guidance questions. Customers will choose levels directly.</p>
      )}

      {questions.map(q => (
        <Card key={q.id} className={editingId === q.id ? "ring-2 ring-primary" : ""}>
          {editingId === q.id ? (
            <CardContent className="pt-4">
              <QuestionForm form={form} setForm={setForm} onSave={handleSave} onCancel={resetForm} isPending={updateQuestion.isPending} />
            </CardContent>
          ) : (
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs shrink-0">Q{q.question_order}</Badge>
                    {q.is_mandatory && <Badge variant="outline" className="text-xs">Required</Badge>}
                  </div>
                  <p className="text-sm mt-1">{q.question_text}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {((q.options as unknown as OptionItem[]) || []).map((o, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {o.label}{o.level_bump ? ` (+${o.level_bump})` : ""}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(q)} disabled={isEditing}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" disabled={isEditing}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this question?</AlertDialogTitle>
                        <AlertDialogDescription>This guidance question will be permanently removed.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(q)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      ))}

      {addMode && (
        <Card className="ring-2 ring-primary">
          <CardContent className="pt-4">
            <QuestionForm form={form} setForm={setForm} onSave={handleSave} onCancel={resetForm} isPending={createQuestion.isPending} />
          </CardContent>
        </Card>
      )}

      {!isEditing && questions.length < 3 && (
        <Button variant="outline" size="sm" className="gap-1.5 w-full" onClick={() => { setAddMode(true); setEditingId(null); setForm({ ...defaultForm, options: [{ label: "", value: "", level_bump: 0 }] }); }}>
          <Plus className="h-3.5 w-3.5" /> Add Question
        </Button>
      )}
    </div>
  );
}

function QuestionForm({
  form,
  setForm,
  onSave,
  onCancel,
  isPending,
}: {
  form: QuestionFormState;
  setForm: (f: QuestionFormState) => void;
  onSave: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Question *</Label>
        <Input value={form.question_text} onChange={e => setForm({ ...form, question_text: e.target.value })} placeholder="e.g. How tall is the grass?" />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Required</Label>
        <Switch checked={form.is_mandatory} onCheckedChange={v => setForm({ ...form, is_mandatory: v })} />
      </div>
      <div>
        <Label className="text-xs">Options (min 2)</Label>
        {form.options.map((opt, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_60px_32px] gap-1 mt-1 items-end">
            <div>
              <Label className="text-[10px] text-muted-foreground">Label</Label>
              <Input value={opt.label} onChange={e => {
                const c = [...form.options]; c[i] = { ...c[i], label: e.target.value }; setForm({ ...form, options: c });
              }} placeholder="Short" className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Value</Label>
              <Input value={opt.value} onChange={e => {
                const c = [...form.options]; c[i] = { ...c[i], value: e.target.value }; setForm({ ...form, options: c });
              }} placeholder="low" className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">+Level</Label>
              <Input type="number" value={opt.level_bump ?? 0} onChange={e => {
                const c = [...form.options]; c[i] = { ...c[i], level_bump: Number(e.target.value) }; setForm({ ...form, options: c });
              }} className="h-8 text-sm" />
            </div>
            {form.options.length > 1 && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setForm({ ...form, options: form.options.filter((_, j) => j !== i) })}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ))}
        {form.options.length < 4 && (
          <Button variant="ghost" size="sm" className="mt-1 gap-1 text-xs h-7" onClick={() => setForm({ ...form, options: [...form.options, { label: "", value: "", level_bump: 0 }] })}>
            <Plus className="h-3 w-3" /> Add Option
          </Button>
        )}
      </div>
      <div className="flex gap-2 pt-2 border-t">
        <Button size="sm" onClick={onSave} disabled={isPending} className="gap-1">
          <Save className="h-3.5 w-3.5" /> Save
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel} className="gap-1">
          <X className="h-3.5 w-3.5" /> Cancel
        </Button>
      </div>
    </div>
  );
}
