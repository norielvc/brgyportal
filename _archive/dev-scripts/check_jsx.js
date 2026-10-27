const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dir = path.join(__dirname, 'frontend', 'src', 'components', 'Forms');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

files.forEach(f => {
    try {
        console.log("Checking " + f);
        // Using npx eslint or similar might be slow, let's just use babel to parse it
        execSync(`npx @babel/cli --dry-run "${path.join(dir, f)}" --presets=@babel/preset-react,@babel/preset-env`, { stdio: 'pipe' });
    } catch (e) {
        console.log("Error in " + f);
        console.log(e.message);
        // Also print standard error
        if (e.stderr) {
            console.log(e.stderr.toString());
        }
    }
});
