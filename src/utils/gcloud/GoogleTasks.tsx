import { getAuthToken, removeAuthToken } from "./auth";

export async function getTasks() {
    let token = await getAuthToken(true);
    let retriesLeft = 1; // You allow 1 retry
  
    try {
      while (retriesLeft >= 0) {
        const res = await fetch("https://tasks.googleapis.com/tasks/v1/lists/@default/tasks", {
          headers: {
            Authorization: "Bearer " + token,
          },
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
  