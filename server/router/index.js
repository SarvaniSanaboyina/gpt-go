const express = require("express");
const rootRouter = require("./root");
const healthRouter = require("./health");
const authRouter = require("./auth");
const usersRouter = require("./users");
const chatsRouter = require("./chats");
const messagesRouter = require("./messages");

const router = express.Router();

router.use(rootRouter);
router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(chatsRouter);
router.use(messagesRouter);

module.exports = router;
