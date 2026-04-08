const router = require("express").Router();
const auth = require("../middleware/auth");
const Message = require("../models/Message");
const Group = require("../models/Group");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

router.get("/messages", auth, async (req, res) => {
  const { userId, groupId } = req.query;

  let query = {};

  if (groupId) {
    query.groupId = groupId;
  } else {
    query.$or = [
      { sender: req.user.id, receiver: userId },
      { sender: userId, receiver: req.user.id },
    ];
  }

  const messages = await Message.find(query).sort({
    createdAt: 1,
  });

  res.json(messages);
});

router.post(
  "/message",
  auth,
  upload.single("file"),
  async (req, res) => {
    const message = await Message.create({
      sender: req.user.id,
      receiver: req.body.receiver || null,
      groupId: req.body.groupId || null,
      content: req.body.content || "",
      file: req.file ? req.file.filename : null,
      delivered: true,
      seen: false,
    });

    res.status(201).json(message);
  }
);

router.post("/group", auth, async (req, res) => {
  const group = await Group.create({
    name: req.body.name,
    members: req.body.members,
  });

  res.status(201).json(group);
});

router.get("/groups", auth, async (req, res) => {
  const groups = await Group.find({
    members: req.user.id,
  }).populate("members", "name email");

  res.json(groups);
});

module.exports = router;