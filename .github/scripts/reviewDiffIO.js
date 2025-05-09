const fs = require('fs');
const OpenAI = require('openai');
const { execSync } = require('child_process');

// Parse command line arguments
const args = (() => {
  const args = {};
  process.argv.slice(2).forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      args[key] = value || true;
    }
  });
  return args;
})();

// Configuration with command line args and environment variable fallbacks
// Parse and validate integer arguments
function parseIntArg(val, name, fallback) {
  const parsed = parseInt(val);
  if (isNaN(parsed)) {
    console.error(`Invalid value for ${name}: '${val}'. Must be a valid integer.`);
    process.exit(1);
  }
  return parsed;
}

const CONFIG = {
  model: args.model || process.env.OPENAI_MODEL || "o4-mini",
  maxCompletionTokens: parseIntArg(
    args['max-completion-tokens'] || process.env.MAX_COMPLETION_TOKENS || "2048",
    'max-completion-tokens',
    2048
  ),
  maxDiffSize: parseIntArg(
    args['max-diff-size'] || process.env.MAX_DIFF_SIZE || "100000",
    'max-diff-size',
    100000
  ), // ~100KB limit to avoid token issues
  prompt: args.prompt || process.env.OPENAI_REVIEW_PROMPT || "You are a senior software engineer reviewing a GitHub Pull Request diff. Provide concise, clear, helpful and constructive comments about the changes. Small section for potential issues and improvements. Response starts with '## AI Review Comments'"
};


const configToLog = { ...CONFIG };
if (configToLog.prompt) configToLog.prompt = '[REDACTED]';
console.log('Effective configuration:', JSON.stringify(configToLog, null, 2));


// Read data from stdin (pipe)
async function readFromStdin() {
  return new Promise((resolve) => {
    let data = '';
    if (process.stdin.isTTY) {
      // No data being piped in, return empty string
      console.log('No data piped in. Expecting diff via stdin pipe.');
      resolve('');
      return;
    }

    process.stdin.setEncoding('utf8');
    
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    
    process.stdin.on('end', () => {
      resolve(data);
    });
  });
}

// Main execution function, allow injecting OpenAI client for testing
async function main(openAiClient) {
  try {
    console.log('Reading diff from stdin...');
    // Read the diff from stdin
    const diff = await readFromStdin();
    console.log(`Read diff data (${diff.length} bytes)`);
    
    if (diff.length === 0) {
      console.error('Error: No diff data received. Please pipe in diff data.');
      console.log('Example usage: gh pr diff 123 | node review.js --pr-number=123');
      return 1;
    }
    
    // Check if diff is too large
    let diffContent = diff;
    let truncated = false;
    if (diff.length > CONFIG.maxDiffSize) {
      console.warn(`WARNING: Diff is too large (${diff.length} bytes). Truncating to ${CONFIG.maxDiffSize} bytes.\nConsider increasing max-diff-size if needed.`);
      diffContent = diff.substring(0, CONFIG.maxDiffSize) + "\n\n[Diff truncated due to size limitations]";
      truncated = true;
    }
    // If truncated, output marker to stdout for testability
    if (truncated) {
      process.stdout.write("[Diff truncated due to size limitations]\n");
    }

    console.log(`Requesting review from OpenAI using model: ${CONFIG.model}`);
    const response = await openAiClient.chat.completions.create({
      model: CONFIG.model,
      messages: [
        {
          role: "system",
          content: CONFIG.prompt
        },
        {
          role: "user",
          content: `Here is the PR diff:\n\n${diffContent}`
        }
      ],
      max_completion_tokens: CONFIG.maxCompletionTokens,
    });

    const comment = response.choices[0].message.content;
    console.error(`Generated review comment (${comment.length} characters)`);

    // Always output the comment to stdout for piping
    process.stdout.write(comment);
    
    console.error('Review process completed successfully.');
    return 0;
  } catch (error) {
    console.error('Error in review process:', error);
    return 1;
  }
}

// Export main for testing
module.exports = { main };

// Initialize OpenAI client

// Execute main function only if run as CLI, not when imported for tests
if (require.main === module) {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  main(client).then(exitCode => {
    process.exit(exitCode);
  });
}
