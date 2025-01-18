/**
 * AI Agent Framework for Google Apps Script
 * Supports tool use and JSON mode for all providers.
 * @namespace
 */
const AIAgent = (function () {
  // Utility Functions
  const Utils = {
    /**
     * Make an API request
     * @param {string} url - API endpoint
     * @param {object} options - Request options
     * @returns {object} - Response data
     */
    makeApiRequest: function (url, options) {
      try {
        const response = UrlFetchApp.fetch(url, options);
        return JSON.parse(response.getContentText());
      } catch (error) {
        console.error("API request failed:", error);
        throw error;
      }
    },

    /**
     * Validate API key
     * @param {string} apiKey - API key to validate
     * @throws {Error} - If API key is invalid
     */
    validateApiKey: function (apiKey) {
      if (!apiKey || typeof apiKey !== "string") {
        throw new Error("Invalid API key. API key must be a non-empty string.");
      }
    },

    /**
     * Parse provider:model string
     * @param {string} providerModel - Provider and model name (e.g., "openai:gpt-4o")
     * @returns {object} - Parsed provider and model name
     * @throws {Error} - If the format is invalid
     */
    parseProviderModel: function (providerModel) {
      const parts = providerModel.split(":");
      if (parts.length !== 2 || !parts[0] || !parts[1]) {
        throw new Error(
          'Invalid provider:model format. Expected format: "provider:model"'
        );
      }
      return { provider: parts[0], model: parts[1] };
    },
  };

  // Base Module Class
  class BaseModule {
    constructor(apiKey, systemPrompt = "", model = "") {
      Utils.validateApiKey(apiKey);
      this.apiKey = apiKey;
      this.systemPrompt = systemPrompt;
      this.model = model;
    }

    /**
     * Generate text (to be implemented by subclasses)
     * @param {string} prompt - Input prompt
     * @param {object} options - Additional options
     * @returns {object} - Response data
     */
    generateText(prompt, options = {}) {
      throw new Error(
        "generateText method must be implemented by the module class."
      );
    }

    /**
     * Generate JSON response (to be implemented by subclasses)
     * @param {string} prompt - Input prompt
     * @param {object} options - Additional options
     * @returns {object} - JSON response
     */
    generateJson(prompt, options = {}) {
      throw new Error(
        "generateJson method must be implemented by the module class."
      );
    }

    /**
     * Use tools (to be implemented by subclasses)
     * @param {string} prompt - Input prompt
     * @param {Array} tools - List of tools
     * @param {object} options - Additional options
     * @returns {object} - Tool response
     */
    useTools(prompt, tools = [], options = {}) {
      throw new Error(
        "useTools method must be implemented by the module class."
      );
    }
  }

  // Module: OpenAI
  class OpenAIModule extends BaseModule {
    generateText(prompt, options = {}) {
      const url = "https://api.openai.com/v1/chat/completions";
      // Use existing messages from options or initialize
      const messages = options.messages || [];

      const payload = {
        model: options.model || this.model,
        messages: messages,
        max_tokens: options.max_tokens || 50,
        temperature: options.temperature || 0.7,
      };
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      };
      const response = Utils.makeApiRequest(url, {
        method: "post",
        headers: headers,
        payload: JSON.stringify(payload),
      });
      return response.choices[0].message.content.trim();
    }

    generateJson(prompt, options = {}) {
      const url = "https://api.openai.com/v1/chat/completions";
      // Use existing messages from options or initialize
      const messages = options.messages || [];

      const payload = {
        model: options.model || this.model,
        messages: messages,
        max_tokens: options.max_tokens || 50,
        temperature: options.temperature || 0.7,
        response_format: { type: "json_object" },
      };
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      };
      const response = Utils.makeApiRequest(url, {
        method: "post",
        headers: headers,
        payload: JSON.stringify(payload),
      });
      return JSON.parse(response.choices[0].message.content.trim());
    }

    useTools(prompt, tools = [], options = {}) {
      const url = "https://api.openai.com/v1/chat/completions";
      // Use existing messages from options or initialize
      const messages = options.messages || [];

      const payload = {
        model: options.model || this.model,
        messages: messages,
        max_tokens: options.max_tokens || 50,
        temperature: options.temperature || 0.7,
        tools: tools.map((tool) => ({
          type: "function",
          function: {
            name: tool.name,
            description: tool.description || "",
            parameters: tool.parameters || {},
          },
        })),
      };
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      };
      const response = Utils.makeApiRequest(url, {
        method: "post",
        headers: headers,
        payload: JSON.stringify(payload),
      });
      return response.choices[0].message.tool_calls;
    }
  }

  // Module: Gemini
  class GeminiModule extends BaseModule {
    generateText(prompt, options = {}) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
      // Convert messages to Gemini's contents format
      const contents = (options.messages || []).map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

      // Handle system instruction separately
      let systemInstruction = {};
      if (this.systemPrompt) {
        systemInstruction = {
          role: "user",
          parts: [{ text: this.systemPrompt }],
        };
      }

      // Add current prompt
      contents.push({
        role: "user",
        parts: [{ text: prompt }],
      });
      const payload = {
        contents: contents,
        systemInstruction: systemInstruction,
        generationConfig: {
          maxOutputTokens: options.max_tokens || 50,
          temperature: options.temperature || 0.7,
        },
      };
      const headers = {
        "Content-Type": "application/json",
      };
      const response = Utils.makeApiRequest(url, {
        method: "post",
        headers: headers,
        payload: JSON.stringify(payload),
      });
      return response.candidates[0].content.parts[0].text.trim();
    }

    generateJson(prompt, options = {}) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
      // Convert messages to Gemini's contents format
      const contents = (options.messages || []).map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));
      let systemInstruction = {};
      if (this.systemPrompt) {
        systemInstruction = {
          role: "user",
          parts: [{ text: this.systemPrompt }],
        };
      }
      contents.push({
        role: "user",
        parts: [{ text: prompt }],
      });
      const payload = {
        contents: contents,
        systemInstruction: systemInstruction,
        generationConfig: {
          maxOutputTokens: options.max_tokens || 50,
          temperature: options.temperature || 0.7,
          responseMimeType: "application/json",
        },
      };
      const headers = {
        "Content-Type": "application/json",
      };
      const response = Utils.makeApiRequest(url, {
        method: "post",
        headers: headers,
        payload: JSON.stringify(payload),
      });
      return JSON.parse(response.candidates[0].content.parts[0].text.trim());
    }

    useTools(prompt, tools = [], options = {}) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
      // Convert messages to Gemini's contents format
      const contents = (options.messages || []).map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));
      let systemInstruction = {};
      if (this.systemPrompt) {
        systemInstruction = {
          role: "user",
          parts: [{ text: this.systemPrompt }],
        };
      }
      contents.push({
        role: "user",
        parts: [{ text: prompt }],
      });
      const payload = {
        contents: contents,
        systemInstruction: systemInstruction,
        generationConfig: {
          maxOutputTokens: options.max_tokens || 50,
          temperature: options.temperature || 0.7,
        },
        tools: tools.map((tool) => ({
          functionDeclarations: [
            {
              name: tool.name,
              description: tool.description || "",
              parameters: tool.parameters || {},
            },
          ],
        })),
      };
      const headers = {
        "Content-Type": "application/json",
      };
      const response = Utils.makeApiRequest(url, {
        method: "post",
        headers: headers,
        payload: JSON.stringify(payload),
      });
      return response.candidates[0].content.parts[0].functionCall;
    }
  }

  // Module: Anthropic
  class AnthropicModule extends BaseModule {
    generateText(prompt, options = {}) {
      const url = "https://api.anthropic.com/v1/messages";
      // Use existing messages from options or initialize
      const messages = options.messages || [];

      const payload = {
        model: options.model || this.model,
        messages: messages,
        max_tokens: options.max_tokens || 50,
        temperature: options.temperature || 0.7,
      };
      const headers = {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      };
      const response = Utils.makeApiRequest(url, {
        method: "post",
        headers: headers,
        payload: JSON.stringify(payload),
      });
      return response.content[0].text.trim();
    }

    generateJson(prompt, options = {}) {
      const url = "https://api.anthropic.com/v1/messages";
      // Use existing messages from options or initialize
      const messages = options.messages || [];

      const payload = {
        model: options.model || this.model,
        messages: messages,
        max_tokens: options.max_tokens || 50,
        temperature: options.temperature || 0.7,
      };
      const headers = {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      };
      const response = Utils.makeApiRequest(url, {
        method: "post",
        headers: headers,
        payload: JSON.stringify(payload),
      });
      return response.content[0].text.trim();
    }

    useTools(prompt, tools = [], options = {}) {
      const url = "https://api.anthropic.com/v1/messages";
      // Use existing messages from options or initialize
      const messages = options.messages || [];

      const payload = {
        model: options.model || this.model,
        messages: messages,
        max_tokens: options.max_tokens || 50,
        temperature: options.temperature || 0.7,
        tools: tools.map((tool) => ({
          name: tool.name,
          description: tool.description || "",
          input_schema: tool.parameters || {},
        })),
      };
      const headers = {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      };
      const response = Utils.makeApiRequest(url, {
        method: "post",
        headers: headers,
        payload: JSON.stringify(payload),
      });

      let toolsList = response.content.filter((tool) => {
        return tool.type === "tool_use";
      });

      // Normalize Anthropic's tool response format
      return toolsList.map((tool, index) => ({
        type: "function",
        id: tool.id,
        index: index,
        function: {
          name: tool.name,
          arguments: tool.input,
        },
      }));
    }
  }

  // Module: DeepSeek
  class DeepSeekModule extends BaseModule {
    generateText(prompt, options = {}) {
      const url = "https://api.deepseek.com/chat/completions";
      // Use existing messages from options or initialize
      const messages = options.messages || [];

      const payload = {
        model: options.model || this.model,
        messages: messages,
        max_tokens: options.max_tokens || 50,
        temperature: options.temperature || 0.7,
      };
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      };
      const response = Utils.makeApiRequest(url, {
        method: "post",
        headers: headers,
        payload: JSON.stringify(payload),
      });
      return response.choices[0].message.content.trim();
    }

    generateJson(prompt, options = {}) {
      const url = "https://api.deepseek.com/chat/completions";
      // Use existing messages from options or initialize
      const messages = options.messages || [];

      const payload = {
        model: options.model || this.model,
        messages: messages,
        max_tokens: options.max_tokens || 50,
        temperature: options.temperature || 0.7,
        response_format: { type: "json_object" },
      };
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      };
      const response = Utils.makeApiRequest(url, {
        method: "post",
        headers: headers,
        payload: JSON.stringify(payload),
      });
      return JSON.parse(response.choices[0].message.content.trim());
    }

    useTools(prompt, tools = [], options = {}) {
      const url = "https://api.deepseek.com/chat/completions";
      // Use existing messages from options or initialize
      const messages = options.messages || [];

      const payload = {
        model: options.model || this.model,
        messages: messages,
        max_tokens: options.max_tokens || 50,
        temperature: options.temperature || 0.7,
        tools: tools.map((tool) => ({
          type: "function",
          function: {
            name: tool.name,
            description: tool.description || "",
            parameters: tool.parameters || {},
          },
        })),
      };
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      };
      const response = Utils.makeApiRequest(url, {
        method: "post",
        headers: headers,
        payload: JSON.stringify(payload),
      });
      return response.choices[0].message.tool_calls;
    }
  }

  // Module: OpenRouter
  class OpenRouterModule extends BaseModule {
    generateText(prompt, options = {}) {
      const url = "https://api.openrouter.ai/api/v1/chat/completions";
      // Use existing messages from options or initialize
      const messages = options.messages || [];

      const payload = {
        model: options.model || this.model,
        messages: messages,
        max_tokens: options.max_tokens || 50,
        temperature: options.temperature || 0.7,
      };
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      };
      const response = Utils.makeApiRequest(url, {
        method: "post",
        headers: headers,
        payload: JSON.stringify(payload),
      });
      return response.choices[0].message.content.trim();
    }

    generateJson(prompt, options = {}) {
      const url = "https://api.openrouter.ai/api/v1/chat/completions";
      // Use existing messages from options or initialize
      const messages = options.messages || [];

      const payload = {
        model: options.model || this.model,
        messages: messages,
        max_tokens: options.max_tokens || 50,
        temperature: options.temperature || 0.7,
        response_format: { type: "json_object" },
      };
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      };
      const response = Utils.makeApiRequest(url, {
        method: "post",
        headers: headers,
        payload: JSON.stringify(payload),
      });
      return JSON.parse(response.choices[0].message.content.trim());
    }

    useTools(prompt, tools = [], options = {}) {
      const url = "https://api.openrouter.ai/api/v1/chat/completions";
      // Use existing messages from options or initialize
      const messages = options.messages || [];

      const payload = {
        model: options.model || this.model,
        messages: messages,
        max_tokens: options.max_tokens || 50,
        temperature: options.temperature || 0.7,
        tools: tools.map((tool) => ({
          type: "function",
          function: {
            name: tool.name,
            description: tool.description || "",
            parameters: tool.parameters || {},
          },
        })),
      };
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      };
      const response = Utils.makeApiRequest(url, {
        method: "post",
        headers: headers,
        payload: JSON.stringify(payload),
      });
      return response.choices[0].message.tool_calls;
    }
  }

  // Module: Fireworks AI
  class FireworksAIModule extends BaseModule {
    generateText(prompt, options = {}) {
      const url = "https://api.fireworks.ai/inference/v1/chat/completions";
      // Use existing messages from options or initialize
      const messages = options.messages || [];

      const payload = {
        model: options.model || this.model,
        messages: messages,
        max_tokens: options.max_tokens || 50,
        temperature: options.temperature || 0.7,
      };
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      };
      const response = Utils.makeApiRequest(url, {
        method: "post",
        headers: headers,
        payload: JSON.stringify(payload),
      });
      return response.choices[0].message.content.trim();
    }

    generateJson(prompt, options = {}) {
      const url = "https://api.fireworks.ai/inference/v1/chat/completions";
      // Use existing messages from options or initialize
      const messages = options.messages || [];

      const payload = {
        model: options.model || this.model,
        messages: messages,
        max_tokens: options.max_tokens || 50,
        temperature: options.temperature || 0.7,
        response_format: { type: "json_object" },
      };
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      };
      const response = Utils.makeApiRequest(url, {
        method: "post",
        headers: headers,
        payload: JSON.stringify(payload),
      });
      return JSON.parse(response.choices[0].message.content.trim());
    }

    useTools(prompt, tools = [], options = {}) {
      const url = "https://api.fireworks.ai/inference/v1/chat/completions";
      // Use existing messages from options or initialize
      const messages = options.messages || [];

      const payload = {
        model: options.model || this.model,
        messages: messages,
        max_tokens: options.max_tokens || 50,
        temperature: options.temperature || 0.7,
        tools: tools.map((tool) => ({
          type: "function",
          function: {
            name: tool.name,
            description: tool.description || "",
            parameters: tool.parameters || {},
          },
        })),
      };
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      };
      const response = Utils.makeApiRequest(url, {
        method: "post",
        headers: headers,
        payload: JSON.stringify(payload),
      });
      return response.choices[0].message.tool_calls;
    }
  }

  // Module: Together AI
  class TogetherAIModule extends BaseModule {
    generateText(prompt, options = {}) {
      const url = "https://api.together.xyz/v1/chat/completions";
      // Use existing messages from options or initialize
      const messages = options.messages || [];

      const payload = {
        model: options.model || this.model,
        messages: messages,
        max_tokens: options.max_tokens || 50,
        temperature: options.temperature || 0.7,
      };
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      };
      const response = Utils.makeApiRequest(url, {
        method: "post",
        headers: headers,
        payload: JSON.stringify(payload),
      });
      return response.choices[0].message.content.trim();
    }

    generateJson(prompt, options = {}) {
      const url = "https://api.together.xyz/v1/chat/completions";
      // Use existing messages from options or initialize
      const messages = options.messages || [];

      const payload = {
        model: options.model || this.model,
        messages: messages,
        max_tokens: options.max_tokens || 50,
        temperature: options.temperature || 0.7,
        response_format: { type: "json_object" },
      };
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      };
      const response = Utils.makeApiRequest(url, {
        method: "post",
        headers: headers,
        payload: JSON.stringify(payload),
      });
      return JSON.parse(response.choices[0].message.content.trim());
    }

    useTools(prompt, tools = [], options = {}) {
      const url = "https://api.together.xyz/v1/chat/completions";
      // Use existing messages from options or initialize
      const messages = options.messages || [];

      const payload = {
        model: options.model || this.model,
        messages: messages,
        max_tokens: options.max_tokens || 50,
        temperature: options.temperature || 0.7,
        tools: tools.map((tool) => ({
          type: "function",
          function: {
            name: tool.name,
            description: tool.description || "",
            parameters: tool.parameters || {},
          },
        })),
      };
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      };
      const response = Utils.makeApiRequest(url, {
        method: "post",
        headers: headers,
        payload: JSON.stringify(payload),
      });
      return response.choices[0].message.tool_calls;
    }
  }

  // Module: DeepInfra
  class DeepInfraModule extends BaseModule {
    generateText(prompt, options = {}) {
      const url = "https://api.deepinfra.com/v1/openai/chat/completions";
      // Use existing messages from options or initialize
      const messages = options.messages || [];

      const payload = {
        model: options.model || this.model,
        messages: messages,
        max_tokens: options.max_tokens || 50,
        temperature: options.temperature || 0.7,
      };
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      };
      const response = Utils.makeApiRequest(url, {
        method: "post",
        headers: headers,
        payload: JSON.stringify(payload),
      });
      return response.choices[0].message.content.trim();
    }

    generateJson(prompt, options = {}) {
      const url = "https://api.deepinfra.com/v1/openai/chat/completions";
      // Use existing messages from options or initialize
      const messages = options.messages || [];

      const payload = {
        model: options.model || this.model,
        messages: messages,
        max_tokens: options.max_tokens || 50,
        temperature: options.temperature || 0.7,
        response_format: { type: "json_object" },
      };
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      };
      const response = Utils.makeApiRequest(url, {
        method: "post",
        headers: headers,
        payload: JSON.stringify(payload),
      });
      return JSON.parse(response.choices[0].message.content.trim());
    }

    useTools(prompt, tools = [], options = {}) {
      const url = "https://api.deepinfra.com/v1/openai/chat/completions";
      // Use existing messages from options or initialize
      const messages = options.messages || [];

      const payload = {
        model: options.model || this.model,
        messages: messages,
        max_tokens: options.max_tokens || 50,
        temperature: options.temperature || 0.7,
        tools: tools.map((tool) => ({
          type: "function",
          function: {
            name: tool.name,
            description: tool.description || "",
            parameters: tool.parameters || {},
          },
        })),
      };
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      };
      const response = Utils.makeApiRequest(url, {
        method: "post",
        headers: headers,
        payload: JSON.stringify(payload),
      });
      return response.choices[0].message.tool_calls;
    }
  }

  // Agent Class
  class Agent {
    constructor(config) {
      const { providerModel, systemPrompt = "", apiKey = "" } = config;
      const { provider, model } = Utils.parseProviderModel(providerModel);
      this.provider = provider;
      this.model = model;
      this.systemPrompt = systemPrompt;
      this.apiKey = apiKey;
      this.module = this._initializeModule();
      this.messages = [];

      // Initialize with system prompt if provided
      if (this.systemPrompt) {
        this.messages.push({
          role: this.provider !== "anthropic" ? "system" : "user",
          content: this.systemPrompt,
        });
      }
    }

    /**
     * Clear the conversation history
     */
    clearHistory() {
      this.messages = [];
      if (this.systemPrompt) {
        this.messages.push({
          role: this.provider !== "anthropic" ? "system" : "user",
          content: this.systemPrompt,
        });
      }
    }

    /**
     * Get the current conversation history
     * @returns {Array} - Array of message objects
     */
    getHistory() {
      return this.messages;
    }

    /**
     * Initialize the module based on the provider
     * @returns {BaseModule} - The initialized module
     * @throws {Error} - If the provider is invalid
     */
    _initializeModule() {
      switch (this.provider) {
        case "openai":
          return new OpenAIModule(this.apiKey, this.systemPrompt, this.model);
        case "gemini":
          return new GeminiModule(this.apiKey, this.systemPrompt, this.model);
        case "anthropic":
          return new AnthropicModule(
            this.apiKey,
            this.systemPrompt,
            this.model
          );
        case "deepseek":
          return new DeepSeekModule(this.apiKey, this.systemPrompt, this.model);
        case "openrouter":
          return new OpenRouterModule(
            this.apiKey,
            this.systemPrompt,
            this.model
          );
        case "fireworks":
          return new FireworksAIModule(
            this.apiKey,
            this.systemPrompt,
            this.model
          );
        case "together":
          return new TogetherAIModule(
            this.apiKey,
            this.systemPrompt,
            this.model
          );
        case "deepinfra":
          return new DeepInfraModule(
            this.apiKey,
            this.systemPrompt,
            this.model
          );
        case "groq":
          return new GroqModule(this.apiKey, this.systemPrompt, this.model);
        default:
          throw new Error(`Unsupported provider: ${this.provider}`);
      }
    }

    /**
     * Execute the agent's module function
     * @param {string} prompt - Input prompt
     * @param {object} options - Additional options
     * @returns {object} - Result of the function
     */
    execute(prompt, options = {}) {
      this.messages.push({
        role: "user",
        content: typeof prompt === "string" ? prompt : JSON.stringify(prompt),
      });

      const result = this.module.generateText(prompt, {
        ...options,
        messages: this.messages,
      });

      // Check if this exact assistant message already exists in history
      const isDuplicateAssistantMessage = this.messages.some(
        (msg) => msg.role === "assistant" && msg.content === result
      );

      if (!isDuplicateAssistantMessage) {
        this.messages.push({
          role: "assistant",
          content: typeof result === "string" ? result : JSON.stringify(result),
        });
      }

      return { data: result };
    }

    /**
     * Generate JSON response
     * @param {string} prompt - Input prompt
     * @param {object} options - Additional options
     * @returns {object} - JSON response
     */
    executeJson(prompt, options = {}) {
      // Add user message to history
      this.messages.push({
        role: "user",
        content: typeof prompt === "string" ? prompt : JSON.stringify(prompt),
      });

      const result = this.module.generateJson(prompt, {
        ...options,
        messages: this.messages,
      });

      // Add assistant response to history
      this.messages.push({
        role: "assistant",
        content: typeof result === "string" ? result : JSON.stringify(result),
      });

      return { data: result };
    }

    /**
     * Use tools
     * @param {string} prompt - Input prompt
     * @param {Array} tools - List of tools
     * @param {object} options - Additional options
     * @returns {object} - Tool response
     */
    executeTools(prompt, tools = [], options = {}) {
      // Add user message to history as string
      this.messages.push({
        role: "user",
        content: typeof prompt === "string" ? prompt : JSON.stringify(prompt),
      });

      const result = this.module.useTools(prompt, tools, {
        ...options,
        messages: this.messages,
      });

      // Add assistant response to history as string
      this.messages.push({
        role: "assistant",
        content: typeof result === "string" ? result : JSON.stringify(result),
      });

      return { data: result };
    }
  }

  // Module: Groq
  class GroqModule extends BaseModule {
    generateText(prompt, options = {}) {
      const url = "https://api.groq.com/openai/v1/chat/completions";
      // Use existing messages from options or initialize
      const messages = options.messages || [];

      const payload = {
        model: options.model || this.model,
        messages: messages,
        max_tokens: options.max_tokens || 50,
        temperature: options.temperature || 0.7,
      };
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      };
      const response = Utils.makeApiRequest(url, {
        method: "post",
        headers: headers,
        payload: JSON.stringify(payload),
      });
      return response.choices[0].message.content.trim();
    }

    generateJson(prompt, options = {}) {
      const url = "https://api.groq.com/openai/v1/chat/completions";
      // Use existing messages from options or initialize
      const messages = options.messages || [];

      const payload = {
        model: options.model || this.model,
        messages: messages,
        max_tokens: options.max_tokens || 50,
        temperature: options.temperature || 0.7,
        response_format: { type: "json_object" },
      };
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      };
      const response = Utils.makeApiRequest(url, {
        method: "post",
        headers: headers,
        payload: JSON.stringify(payload),
      });
      return JSON.parse(response.choices[0].message.content.trim());
    }

    useTools(prompt, tools = [], options = {}) {
      const url = "https://api.groq.com/openai/v1/chat/completions";
      // Use existing messages from options or initialize
      const messages = options.messages || [];

      const payload = {
        model: options.model || this.model,
        messages: messages,
        max_tokens: options.max_tokens || 50,
        temperature: options.temperature || 0.7,
        tools: tools.map((tool) => ({
          type: "function",
          function: {
            name: tool.name,
            description: tool.description || "",
            parameters: tool.parameters || {},
          },
        })),
      };
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      };
      const response = Utils.makeApiRequest(url, {
        method: "post",
        headers: headers,
        payload: JSON.stringify(payload),
      });
      return response.choices[0].message.tool_calls;
    }
  }

  // Return the framework components
  return {
    Agent: Agent,
  };
})();
