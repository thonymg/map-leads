import { spawn } from 'child_process';
import { URL } from 'url';

// Get the URL from the command line arguments
// args[0] is the node executable, args[1] is the script file, args[2] is the URL
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Please provide a URL to record. Usage: npm run record:file -- <url>');
  process.exit(1);
}

const urlStr = args[0];
let domain = '';

try {
    // Add protocol if missing to parse correctly
    const urlToParse = urlStr.startsWith('http') ? urlStr : `https://${urlStr}`;
    const parsedUrl = new URL(urlToParse);
    domain = parsedUrl.hostname;
} catch (error) {
  console.error('Invalid URL provided.');
  process.exit(1);
}

// Remove 'www.' if present for cleaner filename
domain = domain.replace(/^www\./, '');

// Construct the output filename
const outputFile = `recordings/${domain}.scrape.ts`;

console.log(`Recording ${urlStr} to ${outputFile}...`);

// Run playwright codegen
// We use shell: true for compatibility
const child = spawn('npx', ['playwright', 'codegen', urlStr, '-o', outputFile], {
  stdio: 'inherit',
  shell: true
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
