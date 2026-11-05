import { useLocalSearchParams } from 'expo-router';
import { TaskListScreen } from '@/features/task-list';

/** Admin: every task across projects. */
export default function AllTasks() {
  const { filter } = useLocalSearchParams<{ filter?: 'in_review' }>();
  return <TaskListScreen scope="all" initial={filter} />;
}
