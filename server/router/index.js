const express = require("express");
const rootRouter = require("./root");
const healthRouter = require("./health");
const usersRouter = require("./users");
const chatsRouter = require("./chats");
const messagesRouter = require("./messages");

const router = express.Router();

router.use(rootRouter);
router.use(healthRouter);
router.use(usersRouter);
router.use(chatsRouter);
router.use(messagesRouter);

module.exports = router;
