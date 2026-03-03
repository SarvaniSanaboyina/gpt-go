const { createGateway, generateText } = require("ai");

async function generateAssistantReply(messages) {
  const gatewayApiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_AI_GATEWAY_API_KEY;
  if (!gatewayApiKey) {
    throw new Error("AI Gateway is not configured on the server");
  }

  const model = process.env.AI_MODEL || "minimax/minimax-m2.5";
  const gatewayProvider = createGateway({ apiKey: gatewayApiKey });
  const response = await generateText({
    model: gatewayProvider(model),
    messages,
    system:
      process.env.AI_SYSTEM_PROMPT ||
      "You are a concise and helpful assistant.",
  });

  return {
    model,
    text: response.text?.trim() || "I could not generate a response.",
  };
}

module.exports = {
  generateAssistantReply,
};
