import { Mistral } from "@mistralai/mistralai";
import { mistralApiKey } from "../../config.js";

// Initialize Mistral client
const client = new Mistral({ apiKey: mistralApiKey });

// Interface for chat history
interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

// Store chat histories for different users
const chatHistories = new Map<number, ChatMessage[]>();

export async function handleMessage(userId: number, message: string): Promise<string> {
    // Get or initialize chat history for this user
    let history = chatHistories.get(userId) || [];

    // Add user message to history
    history.push({ role: "user", content: message });

    const preprompt =
        "Act as a gymbro buddy. Only answer gym related prompts, if you are asked about something else, say 'I am a gymbro, I only talk about gym stuff'. ";
    const postprompt =
        " Keep you answer short, never exceed 512 characters. Use emojis to make it more fun. If you don't know the answer, say 'Bro I don't know, I am just a gymbro'.";

    try {
        // Get response from Mistral
        const response = await client.chat.complete({
            messages: history.map((msg) => ({
                role: msg.role,
                content: preprompt + msg.content + postprompt,
            })),
            model: "mistral-small-latest",
            safePrompt: true,
        });

        const botResponse = response.choices[0]?.message?.content?.toString() || "Sorry, I could not generate a response.";

        // Add bot response to history
        history.push({ role: "assistant", content: botResponse });

        // Keep only last 10 messages to manage context window
        if (history.length > 10) {
            history = history.slice(-10);
        }

        // Update chat history
        chatHistories.set(userId, history);

        return botResponse;
    } catch (error) {
        console.error("Error calling Mistral API:", error);
        return "Sorry, I encountered an error while processing your message.";
    }
}
