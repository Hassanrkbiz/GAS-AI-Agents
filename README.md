# GAS AI Agents Framework

A comprehensive framework for building AI agents in Google Apps Script, supporting multiple providers with consistent interfaces for text generation, JSON responses, and tool usage.

## Features

- **Multi-provider support**: OpenAI, Gemini, Anthropic, DeepSeek, OpenRouter, Fireworks AI, Together AI, DeepInfra, Groq
- **Consistent API**: Unified interface across all providers
- **Conversation context**: Maintains message history for context-aware responses
- **Tool usage**: Supports function calling/tool usage where available
- **JSON mode**: Structured JSON responses when needed
- **History management**: Clear and retrieve conversation history
- **Normalized responses**: Consistent tool response format across providers

## Installation

1. Copy the `Code.gs` file into your Google Apps Script project
2. Add the framework to your project:

```javascript
const AIAgentFramework = (function() {
    // Paste Code.gs contents here
})();
```

## Usage

### Basic Setup

```javascript
const config = {
    providerModel: "openai:gpt-4", // Format: "provider:model"
    systemPrompt: "You are a helpful assistant.",
    apiKey: "your-api-key-here"
};

const agent = new AIAgentFramework.Agent(config);
```

### Text Generation

```javascript
const result = agent.execute("Tell me a joke");
console.log(result.data);
```

### JSON Response

```javascript
const result = agent.executeJson("List three fruits in JSON format");
console.log(result.data); // { fruits: [...] }
```

### Tool Usage

```javascript
const tools = [{
    name: "get_weather",
    description: "Get weather for a location",
    parameters: {
        type: "object",
        properties: {
            location: { type: "string" }
        },
        required: ["location"]
    }
}];

const result = agent.executeTools(
    "What's the weather in San Francisco?",
    tools
);

// Normalized tool response format:
// [
//   {
//     type: "function",
//     id: "call_123",
//     function: {
//     name: "get_weather",
//     arguments: "{\"location\":\"San Francisco, CA\"}"
//     }
//   }
// ]
console.log(result.data);
```

### Managing Conversation History

```javascript
// Clear history
agent.clearHistory();

// Get current history
const history = agent.getHistory();

// Multi-turn conversation
agent.execute("Remember I like pizza");
agent.execute("What food do I like?"); // Will remember pizza
```

## Supported Providers

| Provider    | Models               | Features                     |
|-------------|----------------------|------------------------------|
| OpenAI      | gpt-3.5, gpt-4, etc. | Text, JSON, Tools            |
| Gemini      | gemini-pro, etc.     | Text, JSON, Tools            |
| Anthropic   | claude-2, etc.       | Text, JSON, Tools            |
| DeepSeek    | deepseek-chat, etc.  | Text, JSON, Tools            |
| OpenRouter  | Various models       | Text, JSON, Tools            |
| Fireworks AI| Various models       | Text, JSON, Tools            |
| Together AI | Various models       | Text, JSON, Tools            |
| DeepInfra   | Various models       | Text, JSON, Tools            |
| Groq        | Various models       | Text, JSON, Tools            |

## Examples

See the `Example.gs` file for complete usage examples demonstrating:
- Basic text generation
- JSON responses
- Tool usage
- Conversation history management
- Multi-turn conversations

## Contributing

We welcome contributions to the GAS AI Agents Framework! If you'd like to contribute:

1. Fork the repository
2. Create a new branch for your feature or bugfix
3. Submit a pull request

If you find this project useful, please consider giving it a star to show your support!

## License

MIT License