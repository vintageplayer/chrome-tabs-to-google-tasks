import React, { useEffect, useState } from "react";
import "../assets/tailwind.css";
import { getTasks, insertNewTask } from "../utils/gcloud/GoogleTasks";

interface SelectedTabInfo {
  id: number;
  url: string;
  title: string;
}

const Popup = () => {
  const [count, setCount] = useState(0);
  const [currentURL, setCurrentURL] = useState<string>();
  const [tabs, setTabs] = useState<chrome.tabs.Tab[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTabsInfo, setSelectedTabsInfo] = useState<SelectedTabInfo[]>([]);

  async function getAllTabs() {
    const tabs = await chrome.tabs.query({});
    setTabs(tabs);
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
    getTasks().then((tasks) => {
      setTasks(tasks);
    });
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

  const createTask = () => {
    const taskNotes = selectedTabsInfo.map(t => t.url).join(', ');
    insertNewTask({
      title: "TestMultipleTabs",
      notes: taskNotes,
      id: null,
      due: null
    }).then((task) => { 
      getTasks().then((tasks) => {
        setTasks(tasks);
      });
    });
  };

  const handleTabSelection = (tab: chrome.tabs.Tab) => {
    if (!tab.id || !tab.url) return;

    const isSelected = selectedTabsInfo.some(t => t.id === tab.id);
    if (isSelected) {
      setSelectedTabsInfo(selectedTabsInfo.filter(t => t.id !== tab.id));
    } else {
      setSelectedTabsInfo([...selectedTabsInfo, {
        id: tab.id,
        url: extractUrlFromSuspendedTab(tab.url ?? ''),
        title: tab.title || 'ChromeTab'
      }]);
    }
  };

  return (
    <>
      <ul style={{ minWidth: "700px" }}>
        <li>Current URL: {currentURL}</li>
        <li>Current Time: {new Date().toLocaleTimeString()}</li>
      </ul>
      <ul>
        {selectedTabsInfo.length > 0 && (
          <li>Selected Tabs: {selectedTabsInfo.map(tab => tab.title).join(', ')}</li>
        )}
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
        <button 
         className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
        onClick={createTask}>create task</button>
        <ul>
          {tabs
            .filter(tab => {
              const extractedUrl = extractUrlFromSuspendedTab(tab.url ?? '');
              return extractedUrl.startsWith('http://') || extractedUrl.startsWith('https://');
            })
            .map((tab) => (
              <li key={tab.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={tab.id ? selectedTabsInfo.some(t => t.id === tab.id) : false}
                  onChange={() => tab.id && handleTabSelection(tab)}
                />
                <span className={tab.id && selectedTabsInfo.some(t => t.id === tab.id) ? "font-bold" : ""}>
                  {tab.title}, {extractUrlFromSuspendedTab(tab.url ?? '')}, {new Date(tab.lastAccessed ?? 0).toLocaleString()}
                </span>
              </li>
            ))}
        </ul>
        <ul>
          {tasks && tasks.map((task) => (
            <li key={task.id}>{task.title}</li>
          ))}
        </ul>
    </>
  );
};

export default Popup;