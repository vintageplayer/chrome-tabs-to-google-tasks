import { runRequestWithRetry } from "./RequestHelpers";

const taskListId = "WlZ2cWU3Rl9hblBGZlpXUQ";

interface Task {
    id: string | null;
    title: string;
    notes: string | null;
    due: string | null;
}

export async function insertNewTask(task: Task) {
    const url = `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`;
    return await runRequestWithRetry(url, "POST", JSON.stringify(task), 1);
}

export async function getTasks() {
    const url = `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`;
    const res = await runRequestWithRetry(url);
    if (res) {
        const data = await res.json();
        if (data.items) {
            return data.items;
        }
    }
    return;
}
  
  