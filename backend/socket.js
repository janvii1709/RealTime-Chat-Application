const User = require("./models/User");

const onlineUsers = new Map();

module.exports = (io) => {
  io.on("connection", (socket) => {
    socket.on("join", async (userId) => {
      onlineUsers.set(userId, socket.id);

      await User.findByIdAndUpdate(userId, {
        isOnline: true,
      });

      io.emit("presence", {
        userId,
        isOnline: true,
      });
    });

    socket.on("joinGroup", (groupId) => {
      socket.join(groupId);
    });

    socket.on("privateMessage", (data) => {
      const targetSocket = onlineUsers.get(
        data.receiver
      );

      if (targetSocket) {
        io.to(targetSocket).emit(
          "privateMessage",
          data
        );
      }
    });

    /* FIXED GROUP MESSAGE */
    socket.on("groupMessage", (data) => {
      socket
        .to(data.groupId)
        .emit("groupMessage", data);
    });

    socket.on("typing", (data) => {
      if (data.groupId) {
        socket
          .to(data.groupId)
          .emit("typing", data);
      } else {
        const targetSocket =
          onlineUsers.get(data.receiver);

        if (targetSocket) {
          io.to(targetSocket).emit(
            "typing",
            data
          );
        }
      }
    });

    socket.on("disconnect", async () => {
      for (const [
        userId,
        socketId,
      ] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);

          await User.findByIdAndUpdate(userId, {
            isOnline: false,
          });

          io.emit("presence", {
            userId,
            isOnline: false,
          });

          break;
        }
      }
    });
  });
};