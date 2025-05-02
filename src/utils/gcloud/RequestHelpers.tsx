export async function getAuthToken(interactive: boolean = false): Promise<string | null> {
  try {
    const tokenResult = await chrome.identity.getAuthToken({ interactive });
    return tokenResult.token || null;
  } catch (error) {
    console.error("Error getting auth token:", error);
    console.error(error);
    return null;
  }
}

export async function removeAuthToken(token: string) {
  try {
    await chrome.identity.removeCachedAuthToken({ token: token });
  } catch (error) {
    console.error(error);
  }
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
          return null;
        }

        // Refresh the token and retry once
        await removeAuthToken(token as string);
        const newToken = await getAuthToken(true);
        if (!newToken) {
          console.error("Could not refresh token.");
          return null;
        }
        token = newToken;

        retriesLeft -= 1;
        continue;
      }

      if (!res.ok) {
        console.error(`Error Running Request: ${res.status} ${res.statusText}`);
        return null;
      }

      return res;
    }
  } catch (error) {
    console.error("Unexpected error fetching tasks:", error);
    return null;
  }
}
