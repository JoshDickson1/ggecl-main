import { useState, useEffect, useRef, useCallback } from "react";
import {
  FaPaperPlane,
  FaBars,
  FaTimes,
  FaImage,
  FaSpinner,
} from "react-icons/fa";
import socketService from "@/socket/socketService";
import { formatDistanceToNow } from "date-fns";

interface Message {
  text: string | null;
  sender: string;
  senderId: string;
  role: "admin" | "student";
  timestamp?: number;
  image?: string | null;
}

interface Group {
  groupId: string;
  groupName: string;
  adminId: string;
  students: string[];
  instructors?: string[];
  messages?: Message[];
  lastMessageTime?: Date | null;
}

const StudentChat = () => {
  const currentUserId = "student2";
  const currentUserRole = "student";
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{
    [groupId: string]: string[];
  }>({});

  // Join groups when groups data is loaded
  useEffect(() => {
    if (currentUserId && groups.length > 0) {
      const groupIds = groups.map((g) => g.groupId);
      socketService.emit("joinGroups", { groupIds, studentId: currentUserId });
    }
  }, [currentUserId, groups]);

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Initialize socket and load groups
  useEffect(() => {
    socketService.connect(currentUserId);

    const loadInitialGroups = () => {
      setIsLoading(true);
      setError(null);

      // Mock initial groups - replace with actual API call
      setTimeout(() => {
        try {
          const initialGroups: Group[] = [
            {
              groupId: "group1",
              groupName: "React Learners",
              adminId: "admin1",
              students: ["student1", "student2"],
              instructors: ["inst1"],
              messages: [], // Start with empty messages array
              lastMessageTime: null,
            },
            {
              groupId: "group2",
              groupName: "Next.js Pros",
              adminId: "admin1",
              students: ["student1", "student2"],
              messages: [], // Start with empty messages array
              lastMessageTime: null,
            },
          ];

          setGroups(initialGroups);
          if (initialGroups.length > 0) {
            setSelectedGroup(initialGroups[0]);
          }
        } catch (err) {
          setError("Failed to load groups");
        } finally {
          setIsLoading(false);
        }
      }, 500);
    };

    loadInitialGroups();

    return () => {
      socketService.disconnect();
    };
  }, [currentUserId]);

  // Handle sending messages
  const sendMessage = useCallback(async () => {
    if (!selectedGroup || (!newMessage.trim() && !image)) return;

    setIsSending(true);

    try {
      const messageData = {
        text: newMessage,
        image: image || undefined,
      };

      if (
        (!messageData.text || !messageData.text.trim()) &&
        !messageData.image
      ) {
        throw new Error("Message or image must be provided");
      }

      // Send via socket - wait for socket response to update UI
      await socketService.emit(
        "sendMessage",
        {
          groupId: selectedGroup.groupId,
          senderId: currentUserId,
          role: currentUserRole,
          sender: currentUserId,
          text: messageData.text,
          image: messageData.image,
        },
        (response: { success: boolean; error?: string }) => {
          if (!response.success) {
            throw new Error(response.error || "Failed to send message");
          }
          // Clear input only on success
          setNewMessage("");
          setImage(null);
          setImagePreview(null);
        },
      );
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  }, [selectedGroup, newMessage, image, currentUserId, currentUserRole]);

  // Handle real-time updates
  useEffect(() => {
    const handleGroupCreated = (newGroup: Group) => {
      const transformedGroup = {
        ...newGroup,
        messages: newGroup.messages || [],
        lastMessageTime: newGroup.lastMessageTime || null,
      };

      setGroups((prev) => [...prev, transformedGroup]);

      if (newGroup.students.includes(currentUserId)) {
        setSelectedGroup(transformedGroup);
      }
    };

    const handleNewMessage = (data: {
      groupId: string;
      senderId: string;
      role: "admin" | "student";
      sender: string;
      text: string | null;
      image: string | null;
    }) => {
      const message: Message = {
        text: data.text,
        sender: data.sender,
        senderId: data.senderId,
        role: data.role,
        timestamp: Date.now(),
        image: data.image,
      };

      // Update groups state
      setGroups((prev) =>
        prev.map((group) =>
          group.groupId === data.groupId
            ? {
                ...group,
                messages: [...(group.messages || []), message],
                lastMessageTime: new Date(),
              }
            : group,
        ),
      );

      // Update selected group if it's the current one
      if (selectedGroup?.groupId === data.groupId) {
        setSelectedGroup((prev) =>
          prev
            ? {
                ...prev,
                messages: [...(prev.messages || []), message],
                lastMessageTime: new Date(),
              }
            : null,
        );
      }
    };

    const handleTyping = (data: {
      groupId: string;
      userId: string;
      userName: string;
    }) => {
      setTypingUsers((prev) => {
        const groupTypingUsers = prev[data.groupId] || [];
        if (!groupTypingUsers.includes(data.userName)) {
          return {
            ...prev,
            [data.groupId]: [...groupTypingUsers, data.userName],
          };
        }
        return prev;
      });

      setTimeout(() => {
        setTypingUsers((prev) => {
          const groupTypingUsers = prev[data.groupId] || [];
          return {
            ...prev,
            [data.groupId]: groupTypingUsers.filter(
              (name) => name !== data.userName,
            ),
          };
        });
      }, 3000);
    };

    socketService.on("groupCreated", handleGroupCreated);
    socketService.on("message", handleNewMessage);
    socketService.on("typing", handleTyping);

    return () => {
      socketService.off("groupCreated", handleGroupCreated);
      socketService.off("message", handleNewMessage);
      socketService.off("typing", handleTyping);
    };
  }, [currentUserId, selectedGroup?.groupId]); // Only include selectedGroup.groupId as dependency

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [selectedGroup?.messages, scrollToBottom]);

  // Rest of the component remains the same...
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else if (selectedGroup) {
      socketService.emit("typing", {
        groupId: selectedGroup.groupId,
        userId: currentUserId,
        userName: "Student",
      });
    }
  };

  const visibleGroups = groups.filter((group) =>
    group.students.includes(currentUserId),
  );

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const groupMessagesByDate = (messages: Message[] = []) => {
    const grouped: { [date: string]: Message[] } = {};

    messages.forEach((message) => {
      const date = new Date(message.timestamp || 0).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(message);
    });

    return grouped;
  };

  const groupedMessages = groupMessagesByDate(selectedGroup?.messages);

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-100">
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleImageChange}
        className="hidden"
      />

      {/* Sidebar */}
      <div
        className={`fixed z-20 h-full w-64 border-r border-gray-200 bg-white p-4 shadow-lg transition-transform duration-300 ease-in-out md:static md:z-0 md:w-80 md:translate-x-0 dark:border-gray-700 dark:bg-gray-800 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Chat Groups</h2>
          <button
            className="text-xl text-gray-500 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <FaTimes />
          </button>
        </div>

        <div className="mt-4">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <FaSpinner className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">{error}</div>
          ) : visibleGroups.length > 0 ? (
            <div
              className="mt-4 space-y-2 overflow-y-auto"
              style={{ maxHeight: "calc(100vh - 180px)" }}
            >
              {visibleGroups.map((group) => (
                <div
                  key={group.groupId}
                  onClick={() => {
                    setSelectedGroup(group);
                    setSidebarOpen(false);
                  }}
                  className={`flex cursor-pointer items-center rounded-lg p-3 transition-colors duration-200 ${
                    selectedGroup?.groupId === group.groupId
                      ? "bg-blue-100 dark:bg-gray-700"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
                    {group.groupName.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-3 flex-1 overflow-hidden">
                    <p className="truncate font-medium">{group.groupName}</p>
                    <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                      {group.messages && group.messages.length > 0
                        ? `${
                            group.messages[group.messages.length - 1]
                              .senderId === currentUserId
                              ? "You"
                              : group.messages[group.messages.length - 1].sender
                          }: ${
                            group.messages[group.messages.length - 1].image
                              ? "📷 Image"
                              : group.messages[group.messages.length - 1].text
                          }`
                        : "No messages yet"}
                    </p>
                  </div>
                  {group.messages && group.messages.length > 0 && (
                    <span className="ml-2 text-xs text-gray-400">
                      {formatTime(
                        group.messages[group.messages.length - 1].timestamp,
                      )}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center">
              <p className="text-gray-500">You haven't joined any groups yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="flex items-center border-b border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <button
            className="mr-3 text-xl text-gray-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <FaBars />
          </button>
          {selectedGroup ? (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
                {selectedGroup.groupName.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3">
                <h2 className="text-lg font-semibold">
                  {selectedGroup.groupName}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedGroup.students.length} member
                  {selectedGroup.students.length !== 1 ? "s" : ""}
                  {typingUsers[selectedGroup.groupId]?.length > 0 && (
                    <span className="ml-2 text-blue-500">
                      {typingUsers[selectedGroup.groupId].join(", ")} typing...
                    </span>
                  )}
                </p>
              </div>
            </>
          ) : (
            <div className="ml-3">
              <h2 className="text-lg font-semibold">No group selected</h2>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4 dark:bg-gray-900">
          {selectedGroup ? (
            <>
              {Object.entries(groupedMessages).map(([date, messages]) => (
                <div key={date}>
                  <div className="mb-4 flex justify-center">
                    <span className="rounded-full bg-white px-3 py-1 text-sm text-gray-500 shadow dark:bg-gray-800 dark:text-gray-400">
                      {new Date(date).toLocaleDateString([], {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${
                          msg.senderId !== currentUserId
                            ? "justify-start"
                            : "justify-end"
                        }`}
                      >
                        <div
                          className={`flex max-w-xs flex-col rounded-xl px-4 py-2 ${
                            msg.senderId === currentUserId
                              ? "bg-blue-600 text-white"
                              : "bg-white text-gray-800 shadow dark:bg-gray-700 dark:text-gray-200"
                          }`}
                        >
                          <p className="text-xs font-semibold">
                            {msg.senderId === currentUserId
                              ? "You"
                              : msg.sender}
                          </p>
                          {msg.image ? (
                            <div className="my-2">
                              <img
                                src={msg.image}
                                alt="Message attachment"
                                className="max-h-60 rounded-md object-cover"
                              />
                            </div>
                          ) : null}
                          <p className="py-1">{msg.text}</p>
                          <span
                            className={`text-xs ${
                              msg.senderId === currentUserId
                                ? "text-blue-100"
                                : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {formatTime(msg.timestamp)}
                            {" • "}
                            {formatDistanceToNow(new Date(msg.timestamp || 0), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  Select a group to start chatting
                </p>
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="mt-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 md:hidden"
                >
                  Browse groups
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          {imagePreview && (
            <div className="relative mb-3">
              <img
                src={imagePreview}
                alt="Preview"
                className="h-32 rounded-md object-cover"
              />
              <button
                onClick={removeImage}
                className="absolute top-2 right-2 rounded-full bg-gray-800 p-1 text-white opacity-75 hover:opacity-100"
                aria-label="Remove image"
              >
                <FaTimes className="h-3 w-3" />
              </button>
            </div>
          )}
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-l-md bg-gray-100 px-3 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
              aria-label="Attach image"
            >
              <FaImage />
            </button>
            <input
              type="text"
              placeholder={
                selectedGroup
                  ? "Type your message..."
                  : "Select a group to chat"
              }
              className="flex-1 border border-gray-300 p-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!selectedGroup}
            />
            <button
              onClick={sendMessage}
              disabled={
                !selectedGroup || (!newMessage.trim() && !image) || isSending
              }
              className="rounded-r-md bg-blue-600 px-4 text-white hover:bg-blue-700 disabled:bg-gray-400 dark:bg-blue-700 dark:hover:bg-blue-800 dark:disabled:bg-gray-600"
              aria-label="Send message"
            >
              {isSending ? (
                <FaSpinner className="h-4 w-4 animate-spin" />
              ) : (
                <FaPaperPlane />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentChat;
