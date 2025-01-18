// Example configuration for different providers
const config = {
    providerModel: "deepseek:deepseek-chat", // Example: OpenAI GPT-4
    systemPrompt: "You are a helpful assistant.",
    apiKey: "deep-seek-api-key", // Replace with your actual API key
};

// Initialize the agent
const agent = new AIAgentFramework.Agent(config);

// Example 1: Basic text generation with context
function generateTextExample() {
    // First message
    const prompt1 = "Remember that my name is John.";
    const result1 = agent.execute(prompt1);
    console.log("First Response:", result1.data);

    // Second message using context
    const prompt2 = "What is my name?";
    const result2 = agent.execute(prompt2);
    console.log("Second Response:", result2.data);
}

// Example 2: Generate JSON response with context
function generateJsonExample() {
    // First message
    const prompt1 = "Remember these fruits: apple, banana, orange";
    const result1 = agent.execute(prompt1);
    console.log("First Response:", result1.data);

    // Second message requesting JSON
    const prompt2 = "List the fruits I mentioned earlier in JSON format";
    const result2 = agent.executeJson(prompt2);
    console.log("Generated JSON:", result2.data);
}

// Example 3: Using tools with context
function useToolsExample() {
    // First message
    const prompt1 = "Remember I'm in San Francisco";
    const result1 = agent.execute(prompt1);
    console.log("First Response:", result1.data);

    // Second message using tools
    const prompt2 = "What is the weather here?";
    const tools = [
        {
            name: "get_weather",
            description: "Get the current weather for a location.",
            parameters: {
                type: "object",
                properties: {
                    location: {
                        type: "string",
                        description: "The city and state, e.g., San Francisco, CA",
                    },
                },
                required: ["location"],
            },
        },
    ];
    const result2 = agent.executeTools(prompt2, tools);
    console.log("Tool Calls:", result2.data);
}

// Example 4: Managing conversation history
function historyManagementExample() {
    // Clear any existing history
    agent.clearHistory();
    
    // First message
    const prompt1 = "Remember that I like pizza";
    const result1 = agent.execute(prompt1);
    console.log("First Response:", result1.data);

    // Get current history
    const history = agent.getHistory();
    console.log("Current History:", history);

    // Second message using context
    const prompt2 = "What food do I like?";
    const result2 = agent.execute(prompt2);
    console.log("Second Response:", result2.data);
}

// Run all examples
function runExamples() {
    console.log("=== Basic Text Generation Example ===");
    generateTextExample();
    
    console.log("\n=== JSON Generation Example ===");
    generateJsonExample();
    
    console.log("\n=== Tools Usage Example ===");
    useToolsExample();
    
    console.log("\n=== History Management Example ===");
    historyManagementExample();
}

// Execute the examples
runExamples();