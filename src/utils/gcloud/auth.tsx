export async function getAuthToken(interactive: boolean = false): Promise<string | null> {
  try {
    const tokenResult = await chrome.identity.getAuthToken({ interactive });
    return tokenResult.token || null;
  } catch (error) {
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