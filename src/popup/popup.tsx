import React, { useEffect, useState } from "react";
import "../assets/tailwind.css";
import { getTasks, insertNewTask } from "../utils/gcloud/GoogleTasks";

interface SelectedTabInfo {
  id: number;
  url: string;
  title: string;
  windowId: number;
  position: number;
}

const Popup = () => {
  const [count, setCount] = useState(0);
  const [currentURL, setCurrentURL] = useState<string>();
  const [tabs, setTabs] = useState<chrome.tabs.Tab[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTabsInfo, setSelectedTabsInfo] = useState<SelectedTabInfo[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');

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
    const taskNotes = selectedTabsInfo.map(t => t.url).join('\n\n');
    insertNewTask({
      title: newTaskTitle,
      notes: taskNotes,
      id: null,
      due: null
    }).then((task) => {
      setNewTaskTitle('');
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
      const newTabInfo = {
        id: tab.id,
        url: extractUrlFromSuspendedTab(tab.url ?? ''),
        title: tab.title || 'ChromeTab',
        windowId: tab.windowId,
        position: tab.index
      };
      const sortedSelectedTabsInfo = [...selectedTabsInfo, newTabInfo].sort((a, b) => {
        if (a.windowId !== b.windowId) {
          return a.windowId - b.windowId;
        }
        return a.position - b.position;
      });
      setSelectedTabsInfo(sortedSelectedTabsInfo);
    }
  };

  return (
    <>
      <ul style={{ minWidth: "700px" }}>
        <li>Current URL: {currentURL}</li>
        <li>Current Time: {new Date().toLocaleTimeString()}</li>
        <li>Total Tabs: {tabs.length}</li>
        <li>Selected Tabs: {selectedTabsInfo.length}</li>
      </ul>
      <div className="mt-4 p-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Enter task title"
            className="w-1/2 p-2 border rounded mb-2"
          />
        </div>
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
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left border-b">
              <th className="p-2 w-10"></th>
              <th className="p-2 w-12">Window</th>
              <th className="p-2 w-12">Pos#</th>
              <th className="p-2 w-84">Title</th>
              <th className="p-2 w-24">URL</th>
              <th className="p-2">Last Accessed</th>
            </tr>
          </thead>
          <tbody>
            {tabs
              .filter(tab => {
                const extractedUrl = extractUrlFromSuspendedTab(tab.url ?? '');
                return extractedUrl.startsWith('http://') || extractedUrl.startsWith('https://');
              })
              .map((tab) => (
                <tr key={tab.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={tab.id ? selectedTabsInfo.some(t => t.id === tab.id) : false}
                      onChange={() => tab.id && handleTabSelection(tab)}
                    />
                  </td>
                  <td className="p-2">
                    {tab.windowId}
                  </td>
                  <td className="p-2">
                    {tab.index + 1}
                  </td>
                  <td className={`p-2 max-w-96 ${tab.id && selectedTabsInfo.some(t => t.id === tab.id) ? "font-bold" : ""}`}>
                    <div className="flex flex-col">
                      <div className="truncate" title={tab.title}>
                        {tab.title}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {(() => {
                          try {
                            const url = new URL(extractUrlFromSuspendedTab(tab.url ?? ''));
                            return url.hostname;
                          } catch {
                            return '';
                          }
                        })()}
                      </div>
                    </div>
                  </td>
                  <td className="p-2">
                    <a 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        if (tab.id) chrome.tabs.update(tab.id, { active: true });
                      }}
                      className="text-blue-600 hover:underline"
                      title={extractUrlFromSuspendedTab(tab.url ?? '')}
                    >
                      To Tab
                    </a>
                  </td>
                  <td className="p-2">
                    {new Date(tab.lastAccessed ?? 0).toLocaleString()}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        <ul>
          {tasks && tasks.map((task) => (
            <li key={task.id}>{task.title}</li>
          ))}
        </ul>
    </>
  );
};

export default Popup;