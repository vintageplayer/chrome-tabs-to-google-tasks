import { getAuthToken, removeAuthToken } from "./auth";

const taskListId = "WlZ2cWU3Rl9hblBGZlpXUQ";

interface Task {
    id: string | null;
    title: string;
    notes: string | null;
    due: string | null;
}

export async function runRequestWithRetry(url: string, method: string = "GET", body: any = null, retriesLeft: number = 1) {
    let token = await getAuthToken(true);
    const headers: Record<string, string> = {
        Authorization: "Bearer " + token,
    };
    if (body) {
        headers["Content-Type"] = "application/json";
    }
    if (retriesLeft === undefined || retriesLeft === null || retriesLeft < 0) {
        retriesLeft = 1;
    }

    try {
      while (retriesLeft >= 0) {
        const res = await fetch(url, {
          method: method,
          headers: headers,
          body: body,
        });
  
        if (res.status === 401) {
          console.warn(`Access token invalid or expired.`);
  
          if (retriesLeft === 0) {
            console.error("Retry exhausted. User must reauthenticate.");
            return;
          }
  
          // Refresh the token and retry once
          await removeAuthToken(token as string);
          const newToken = await getAuthToken(true);
          if (!newToken) {
            console.error("Could not refresh token.");
            return;
          }
          token = newToken;
  
          retriesLeft -= 1;
          continue;
        }
  
        if (!res.ok) {
          console.error(`Error fetching tasks: ${res.status} ${res.statusText}`);
          return;
        }
  
        const data = await res.json();
        if (data.items) {
          return data.items;
        }
        return; // ✅ Success
      }
    } catch (error) {
      console.error("Unexpected error fetching tasks:", error);
    }
  }
  

export async function insertNewTask(task: Task) {
    const url = `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`;
    return await runRequestWithRetry(url, "POST", JSON.stringify(task), 1);
}

export async function getTasks() {
    const url = `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`;
    return await runRequestWithRetry(url);
  }
  
  