import React, { useEffect, useState } from "react";
import "../assets/tailwind.css";

const Popup = () => {
  const [count, setCount] = useState(0);
  const [currentURL, setCurrentURL] = useState<string>();
  const [tabs, setTabs] = useState<chrome.tabs.Tab[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [googleAuthToken, setGoogleAuthToken] = useState<any>();
  async function getAllTabs() {
    const tabs = await chrome.tabs.query({});
    setTabs(tabs);
  }

  function getTasks() {
    chrome.identity.getAuthToken({ interactive: true }, function(token) {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
      }
      setGoogleAuthToken(token);
      console.log("Token:", token);
  
      fetch("https://tasks.googleapis.com/tasks/v1/lists/@default/tasks", {
        headers: {
          Authorization: 'Bearer ' + token
        }
      })
      .then(async (res) => {
        if (res.status === 401) {
          // Token expired, clear the cache and retry
          await chrome.identity.removeCachedAuthToken({ token: token as string });
          // Recursively call getTasks() to get a new token and retry
          getTasks();
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          console.log("Tasks:", data);
          // render the tasks to DOM here
          if (data.items) {
            setTasks(data.items);
          }
        }
      })
      .catch(console.error);
    });
  }
  
  function extractUrlFromSuspendedTab(url: string): string {
    try {
      if (url.startsWith('chrome-extension://') && url.includes('/park.html')) {
        const urlParams = new URLSearchParams(url.split('?')[1]);
        const originalUrl = urlParams.get('url');
        return originalUrl ? decodeURIComponent(originalUrl) : url;
      }
      return url;
    } catch (error) {
      console.error('Error extracting URL:', error);
      return url;
    }
  }

  useEffect(() => {
    getAllTabs();
  }, []);

  useEffect(() => {
    getTasks();
  }, []);

  useEffect(() => {
    chrome.action.setBadgeText({ text: count.toString() });
  }, [count]);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      setCurrentURL(tabs[0].url);
    });
  }, []);

  const changeBackground = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const tab = tabs[0];
      if (tab.id) {
        chrome.tabs.sendMessage(
          tab.id,
          {
            color: "#555555",
          },
          (msg) => {
            console.log("result message:", msg);
          }
        );
      }
    });
  };

  return (
    <>
      <ul style={{ minWidth: "700px" }}>
        <li>Current URL: {currentURL}</li>
        <li>Current Time: {new Date().toLocaleTimeString()}</li>
        <li>Token: {googleAuthToken}</li>
      </ul>
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
        onClick={() => setCount(count + 1)}
        style={{ marginRight: "5px" }}
      >
        count up
      </button>
      <button 
         className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
        onClick={changeBackground}>change background</button>
        <ul>
          {tabs
            .filter(tab => {
              const extractedUrl = extractUrlFromSuspendedTab(tab.url ?? '');
              return !extractedUrl.startsWith('http://') && !extractedUrl.startsWith('https://');
            })
            .map((tab) => (
              <li key={tab.id}>
                {tab.title}, {extractUrlFromSuspendedTab(tab.url ?? '')}, {tab.lastAccessed}
              </li>
            ))}
        </ul>
        <ul>
          {tasks && tasks.map((task) => (
            <li key={task.id}>{task.title}</li>
          ))}
        </ul>
        {JSON.stringify(tasks)}
    </>
  );
};

export default Popup;