"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { ClipboardList } from "lucide-react";
import type { FormField } from "@/types/form";
import { FieldItem } from "./field-item";
import { EmptyState } from "@/components/ui/empty-state";

export function BuilderCanvas({
  fields,
  selectedFieldId,
  onSelect,
  onReorder,
  onDuplicate,
  onDelete,
}: {
  fields: FormField[];
  selectedFieldId: string | null;
  onSelect: (id: string) => void;
  onReorder: (fields: FormField[]) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);
    onReorder(arrayMove(fields, oldIndex, newIndex));
  }

  if (fields.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="ابدأ ببناء نموذجك"
        description="اختر نوع حقل من القائمة لإضافته إلى النموذج"
      />
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {fields.map((field) => (
            <FieldItem
              key={field.id}
              field={field}
              selected={field.id === selectedFieldId}
              onSelect={() => onSelect(field.id)}
              onDuplicate={() => onDuplicate(field.id)}
              onDelete={() => onDelete(field.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
