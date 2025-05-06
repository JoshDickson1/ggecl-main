import { useState } from "react";
import { FaBars, FaPaperPlane, FaTimes } from "react-icons/fa";

type User = {
  name: string;
  message: string;
  time: string;
  active: boolean;
};

type Group = {
  name: string;
  users: User[];
};

type Message = {
  text: string;
  sender: string;
};

const groups: Group[] = [
  {
    name: "Admins",
    users: [
      {
        name: "Jane Cooper",
        message: "Ready for the meeting?",
        time: "just now",
        active: true,
      },
      {
        name: "John Doe",
        message: "Just finished the task.",
        time: "5m",
        active: false,
      },
    ],
  },
  {
    name: "Instructors",
    users: [
      {
        name: "Jenny Wilson",
        message: "Thank you so much, sir",
        time: "2m",
        active: false,
      },
      {
        name: "Marvin McKinney",
        message: "You're welcome",
        time: "4m",
        active: false,
      },
    ],
  },
];

const ChatApp = () => {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(groups[0]);
  const [selectedUser, setSelectedUser] = useState<User | null>(
    selectedGroup?.users[0] || null,
  );
  const [messages, setMessages] = useState<Message[]>([
    { text: "Hello and thanks for signing up...", sender: "Jane" },
    { text: "Hello, Good Evening.", sender: "You" },
    { text: "I'm Zafor", sender: "You" },
    { text: "I only have a small doubt...", sender: "You" },
    { text: "Yeah sure, tell me zafor", sender: "Jane" },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    setMessages([...messages, { text: newMessage, sender: "You" }]);
    setNewMessage("");
  };

  return (
    <div className="flex h-screen text-gray-600">
      {/* Sidebar */}
      <div
        className={`fixed h-full w-64 border-r border-gray-50 bg-white p-4 shadow-md transition-transform duration-300 ease-in-out md:static md:w-1/3 dark:border-gray-950 dark:bg-gray-900 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <h2 className="mb-4 flex items-center justify-between text-2xl font-bold">
          Groups
          <button
            className="text-xl md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <FaTimes />
          </button>
        </h2>

        <div className="h-96 space-y-2 overflow-y-auto">
          {groups.map((group, index) => (
            <div
              key={index}
              onClick={() => {
                setSelectedGroup(group);
                setSelectedUser(group.users[0]);
                setSidebarOpen(false);
              }}
              className={`flex cursor-pointer items-center rounded-md p-3 transition-all duration-200 hover:bg-blue-100 ${selectedGroup?.name === group.name ? "bg-blue-200" : ""}`}
            >
              <p className="font-semibold">{group.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Section */}
      <div className="flex flex-1 flex-col">
        {/* Chat Header */}
        <div className="flex items-center border-b border-gray-200 p-4 shadow-md dark:border-gray-900">
          <button
            className="mr-3 text-xl md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <FaBars />
          </button>
          <div className="h-12 w-12 rounded-full bg-gray-800"></div>
          <div className="ml-3">
            <h2 className="text-lg font-semibold">{selectedUser?.name}</h2>
            <p
              className={`text-sm ${selectedUser?.active ? "text-green-500" : "text-gray-400"}`}
            >
              {selectedUser?.active ? "Active Now" : "Offline"}
            </p>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 space-y-3 overflow-y-auto bg-gray-100 p-6 dark:bg-gray-800">
          <div className="mb-4 flex justify-center">
            <span className="rounded-full bg-white px-3 py-1 text-sm text-gray-500 dark:bg-gray-900">
              Today
            </span>
          </div>
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.sender === "You" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs rounded-lg px-4 py-2 ${msg.sender === "You" ? "bg-blue-600 text-white" : "border border-gray-200 text-gray-600 dark:border-gray-950 dark:text-gray-400"}`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="flex border-t border-gray-200 p-4 shadow-md dark:border-gray-900">
          <input
            type="text"
            placeholder="Type your message..."
            className="flex-1 rounded-md border p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button
            onClick={sendMessage}
            className="ml-2 rounded-md bg-blue-600 p-3 text-white transition-all duration-200 hover:bg-blue-700"
          >
            <FaPaperPlane />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatApp;
