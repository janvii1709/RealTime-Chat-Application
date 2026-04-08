import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import EmojiPicker from "emoji-picker-react";

const socket = io("http://localhost:5000");

export default function Chat() {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [file, setFile] = useState(null);

  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupMembers, setGroupMembers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    socket.emit("join", user._id);
    fetchUsers();
    fetchGroups();
  }, []);

  const fetchUsers = async () => {
    const res = await axios.get(
      "http://localhost:5000/api/auth/users",
      {
        headers: { Authorization: "Bearer " + token },
      }
    );
    setUsers(res.data);
  };

  const fetchGroups = async () => {
    const res = await axios.get(
      "http://localhost:5000/api/chat/groups",
      {
        headers: { Authorization: "Bearer " + token },
      }
    );
    setGroups(res.data);
  };

  useEffect(() => {
    if (!selected) return;

    if (selected.isGroup) {
      socket.emit("joinGroup", selected._id);
    }

    const query = selected.isGroup
      ? `groupId=${selected._id}`
      : `userId=${selected._id}`;

    axios
      .get(
        `http://localhost:5000/api/chat/messages?${query}`,
        {
          headers: { Authorization: "Bearer " + token },
        }
      )
      .then((res) => setMessages(res.data));
  }, [selected]);

  useEffect(() => {
    socket.on("privateMessage", (msg) => {
      if (!selected?.isGroup) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    socket.on("groupMessage", (msg) => {
      if (
        selected?.isGroup &&
        selected._id === msg.groupId
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    socket.on("typing", (data) => {
      setTyping(data.text);
      setTimeout(() => setTyping(""), 1500);
    });

    return () => {
      socket.off("privateMessage");
      socket.off("groupMessage");
      socket.off("typing");
    };
  }, [selected]);

  const send = async () => {
    if ((!text && !file) || !selected) return;

    const formData = new FormData();
    formData.append("content", text);

    if (selected.isGroup) {
      formData.append("groupId", selected._id);
    } else {
      formData.append("receiver", selected._id);
    }

    if (file) formData.append("file", file);

    const res = await axios.post(
      "http://localhost:5000/api/chat/message",
      formData,
      {
        headers: { Authorization: "Bearer " + token },
      }
    );

    setMessages((prev) => [...prev, res.data]);

    if (selected.isGroup) {
      socket.emit("groupMessage", res.data);
    } else {
      socket.emit("privateMessage", res.data);
    }

    setText("");
    setFile(null);
    setShowEmoji(false);
  };

  const createGroup = async () => {
    await axios.post(
      "http://localhost:5000/api/chat/group",
      {
        name: groupName,
        members: [...groupMembers, user._id],
      },
      {
        headers: { Authorization: "Bearer " + token },
      }
    );

    setShowGroupModal(false);
    setGroupName("");
    setGroupMembers([]);
    fetchGroups();
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="chatPage">
        <div className="sidebar">
          <div className="sidebarTop">
            <h2>Chats</h2>

            <div className="topBtns">
              <button onClick={() => setShowGroupModal(true)}>
                + Group
              </button>

              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = "/";
                }}
              >
                Logout
              </button>
            </div>
          </div>

          {users.map((u) => (
            <div
              key={u._id}
              className="userCard"
              onClick={() =>
                setSelected({ ...u, isGroup: false })
              }
            >
              👤 {u.name}
            </div>
          ))}

          {groups.map((g) => (
            <div
              key={g._id}
              className="userCard groupCard"
              onClick={() =>
                setSelected({ ...g, isGroup: true })
              }
            >
              👥 {g.name}
            </div>
          ))}
        </div>

        <div className="chatArea">
          <div className="chatHeader">
            {selected ? (
              <>
                <div>{selected.name}</div>

                {selected.isGroup && (
                  <small className="groupMembersText">
                    {selected.members
                      ?.map((m) => m.name)
                      .join(", ")}
                  </small>
                )}
              </>
            ) : (
              "Select Chat"
            )}
          </div>

          <div className="messages">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`msg ${
                  m.sender === user._id
                    ? "sent"
                    : "received"
                }`}
              >
                {m.content}
              </div>
            ))}

            {typing && (
              <div className="typing">{typing}</div>
            )}
          </div>

          {selected && (
            <div className="inputBar">
              <button
                onClick={() =>
                  setShowEmoji(!showEmoji)
                }
              >
                😊
              </button>

              {showEmoji && (
                <div className="emojiPicker">
                  <EmojiPicker
                    onEmojiClick={(emojiData) =>
                      setText(
                        (prev) =>
                          prev + emojiData.emoji
                      )
                    }
                  />
                </div>
              )}

              <label className="fileUpload">
                📎
                <input
                  type="file"
                  hidden
                  onChange={(e) =>
                    setFile(e.target.files[0])
                  }
                />
              </label>

              <input
                value={text}
                onChange={(e) =>
                  setText(e.target.value)
                }
                placeholder="Type a message..."
              />

              <button onClick={send}>Send</button>
            </div>
          )}
        </div>
      </div>

      {showGroupModal && (
        <div className="modalOverlay">
          <div className="groupModal">
            <h3>Create Group</h3>

            <input
              placeholder="Group Name"
              value={groupName}
              onChange={(e) =>
                setGroupName(e.target.value)
              }
            />

            <input
              placeholder="Search Users"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

            <div className="searchResults">
              {filteredUsers.map((u) => (
                <div
                  key={u._id}
                  className="searchUser"
                  onClick={() =>
                    !groupMembers.includes(u._id) &&
                    setGroupMembers((prev) => [
                      ...prev,
                      u._id,
                    ])
                  }
                >
                  {u.name}
                </div>
              ))}
            </div>

            <button onClick={createGroup}>
              Create Group
            </button>

            <button
              onClick={() =>
                setShowGroupModal(false)
              }
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}