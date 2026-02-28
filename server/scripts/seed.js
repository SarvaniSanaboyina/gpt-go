require("dotenv").config();
const { db, pool } = require("../db/client");
const { users, chats, messages } = require("../db/schema");

async function seed() {
  try {
    await db.delete(messages);
    await db.delete(chats);
    await db.delete(users);

    const createdUsers = await db
      .insert(users)
      .values([
        { name: "Alice Johnson", email: "alice@example.com" },
        { name: "Bob Miller", email: "bob@example.com" },
      ])
      .returning();

    const [alice, bob] = createdUsers;

    const createdChats = await db
      .insert(chats)
      .values([
        { userId: alice.id, title: "Onboarding Chat" },
        { userId: alice.id, title: "Project Ideas" },
        { userId: bob.id, title: "Support Thread" },
      ])
      .returning();

    const [chatOne, chatTwo, chatThree] = createdChats;

    await db.insert(messages).values([
      { chatId: chatOne.id, role: "user", content: "Hey, how do I get started?" },
      { chatId: chatOne.id, role: "assistant", content: "Start by setting up your profile." },
      { chatId: chatTwo.id, role: "user", content: "Need ideas for a chatbot feature." },
      { chatId: chatTwo.id, role: "assistant", content: "You can add message summarization." },
      { chatId: chatThree.id, role: "user", content: "My app crashes on login." },
      { chatId: chatThree.id, role: "assistant", content: "Check your env variables and logs." },
    ]);

    console.log("Seed completed: users, chats, and messages inserted.");
  } catch (error) {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seed();
