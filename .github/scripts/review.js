const fs = require('fs');
const OpenAI = require('openai');
const { execSync } = require('child_process');

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    
});

const diff = fs.readFileSync('pr.diff', 'utf8');

(async () => {
  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a js senior software engineer reviewing a GitHub Pull Request diff. Provide helpful, constructive comments about the changes, potential issues, and improvements. Response starts with '## AI Review Comments' and ends with '## End of IA Review Comments'."
        },
        {
          role: "user",
          content: `Here is the PR diff:\n\n${diff}`
        }
      ],
      max_tokens: 2048,
    });

    const comment = response.data.choices[0].message.content;

    const prNumber = process.env.GITHUB_REF.split('/')[2];
    const repo = process.env.GITHUB_REPOSITORY;

    execSync(`gh pr comment ${prNumber} --body "${comment}"`, {
      env: {
        ...process.env,
      },
      stdio: 'inherit',
    });
  } catch (error) {
    console.error('Error generating review comment:', error);
    process.exit(1);
  }
})();