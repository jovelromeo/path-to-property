const fs = require('fs');
const OpenAI = require('openai');
const { execSync } = require('child_process');

// Parse command line arguments
function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      args[key] = value || true;
    }
  });
  return args;
}

const args = parseArgs();

// Configuration with command line args and environment variable fallbacks
const CONFIG = {
  model: args.model || process.env.OPENAI_MODEL || "o4-mini",
  maxTokens: parseInt(args['max-tokens'] || process.env.MAX_COMPLETION_TOKENS || "2048"),
  maxDiffSize: parseInt(args['max-diff-size'] || process.env.MAX_DIFF_SIZE || "100000"), // ~100KB limit to avoid token issues
  prNumber: args['pr-number'] || null,
  outputFile: args['output-file'],
  dryRun: args['dry-run'] === 'true' || false
};

// Validate required parameters
if (!CONFIG.outputFile) {
  console.error('Error: --output-file parameter is required');
  console.log('Example usage: gh pr diff 123 | node review.js --pr-number=123 --output-file=review.md');
  process.exit(1);
}

// Get PR number from arguments, environment, or prompt
function getPrNumber() {
  // First check if provided as command line argument
  if (CONFIG.prNumber) {
    return CONFIG.prNumber;
  }
  
  // Then try to get from GITHUB_REF
  const githubRef = process.env.GITHUB_REF;
  if (githubRef) {
    const match = githubRef.match(/refs\/pull\/(\d+)\/merge/);
    if (match) {
      return match[1];
    }
    console.warn(`Note: GITHUB_REF found but in unexpected format: ${githubRef}`);
  }
  
  // If we're in CI and couldn't get PR number, that's an error
  if (process.env.CI) {
    throw new Error('Could not determine PR number. Please provide --pr-number argument.');
  }
  
  // For local usage, allow manual input or return null for dry-run mode
  if (CONFIG.dryRun) {
    console.log('Dry run mode: No PR number needed');
    return null;
  }
  
  throw new Error('PR number not provided. Use --pr-number=<number> argument.');
}

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

// Main execution function
async function main() {
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
    if (diff.length > CONFIG.maxDiffSize) {
      console.warn(`Diff is too large (${diff.length} bytes). Truncating to ${CONFIG.maxDiffSize} bytes.`);
      diffContent = diff.substring(0, CONFIG.maxDiffSize) + "\n\n[Diff truncated due to size limitations]";
    }
    
    // Get PR number
    const prNumber = getPrNumber();
    if (prNumber) {
      console.log(`Processing PR #${prNumber}`);
    } else {
      console.log('Running in dry-run mode (no PR number provided)');
    }
    
    console.log(`Requesting review from OpenAI using model: ${CONFIG.model}`);
    const response = await client.chat.completions.create({
      model: CONFIG.model,
      messages: [
        {
          role: "system",
          content: "You are a senior software engineer reviewing a GitHub Pull Request diff. Provide concise, clear, helpful and constructive comments about the changes. Small section for potential issues and improvements. Response starts with '## AI Review Comments'"
        },
        {
          role: "user",
          content: `Here is the PR diff:\n\n${diffContent}`
        }
      ],
      max_completion_tokens: CONFIG.maxTokens,
    });

    const comment = response.choices[0].message.content;
    console.log(`Generated review comment (${comment.length} characters)`);

    // Write the comment to the output file
    fs.writeFileSync(CONFIG.outputFile, comment);
    console.log(`Saved comment to ${CONFIG.outputFile}`);

    // If we have a PR number and we're not in dry-run mode, post the comment
    if (prNumber && !CONFIG.dryRun) {
      console.log(`Posting comment to PR #${prNumber}`);
      execSync(`gh pr comment ${prNumber} --body-file "${CONFIG.outputFile}"`, {
        env: {
          ...process.env,
        },
        stdio: 'inherit',
      });
    } else if (CONFIG.dryRun) {
      console.log('Dry run mode: Skipping comment posting to GitHub');
      console.log('Comment content has been saved to:', CONFIG.outputFile);
    }
    
    console.log('Review process completed successfully.');
    return 0;
  } catch (error) {
    console.error('Error in review process:', error);
    // Save the error to a file for debugging
    try {
      const errorFile = `${CONFIG.outputFile}.error.log`;
      fs.writeFileSync(errorFile, JSON.stringify(error, null, 2));
      console.error(`Error details saved to: ${errorFile}`);
    } catch (logError) {
      console.error('Failed to write error log:', logError);
    }
    return 1;
  }
}

// Execute main function
main().then(exitCode => {
  process.exit(exitCode);
});