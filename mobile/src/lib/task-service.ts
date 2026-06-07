import { supabase } from "../../utils/supabase";

export type TaskPriority = "low" | "medium" | "high";

export type CreatedTaskRow = {
  id: string;
  block_id: string;
  title: string;
  priority: TaskPriority;
  completed: boolean;
  date: string;
  order: number | null;
};

export async function createTask(input: {
  userId: string;
  blockId: string;
  title: string;
  priority: TaskPriority;
  date: string;
  order: number;
}) {
  const payload = {
    user_id: input.userId,
    block_id: input.blockId,
    title: input.title,
    priority: input.priority,
    completed: false,
    date: input.date,
    order: input.order,
  };

  const { data, error } = await supabase
    .from("tasks")
    .insert(payload)
    .select("id,block_id,title,priority,completed,date,order")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not create task");
  }

  return data as CreatedTaskRow;
}
