const fs = require('fs');
const path = require('path');

// Directories to search for HTML files
const htmlDirs = [
    path.join(__dirname, '..', 'user-ui'),
    path.join(__dirname, '..', 'admin')
];

// Function to check if a file has the required containers
function hasRequiredContainers(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return content.includes('id="header-container"') && 
               content.includes('id="sidebar-container"');
    } catch (err) {
        console.error(`Error reading file ${filePath}:`, err);
        return false;
    }
}

// Function to update HTML files with required containers
function updateHtmlFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Skip if already has containers
        if (hasRequiredContainers(filePath)) {
            console.log(`Skipping ${filePath} - already has required containers`);
            return;
        }

        // Add header container if missing
        if (!content.includes('id="header-container"')) {
            const headerPattern = /<header[\s\S]*?<\/header>/i;
            if (headerPattern.test(content)) {
                // Replace existing header with container
                content = content.replace(headerPattern, 
                    '<div id="header-container">\n$&\n</div>');
            } else {
                // Add header container at the beginning of body
                const bodyPattern = /<body[^>]*>([\s\S]*?)<\/body>/i;
                content = content.replace(bodyPattern, 
                    (match, bodyContent) => 
                        match.replace(bodyContent, 
                            `\n    <div id="header-container">\n        <!-- Header will be loaded here -->\n    </div>\n    ${bodyContent.trim()}`));
            }
        }

        // Add sidebar container if missing
        if (!content.includes('id="sidebar-container"')) {
            const sidebarPattern = /<aside[\s\S]*?<\/aside>|<nav[\s\S]*?<\/nav>/i;
            if (sidebarPattern.test(content)) {
                // Replace existing sidebar with container
                content = content.replace(sidebarPattern, 
                    '<div id="sidebar-container">\n$&\n</div>');
            } else {
                // Add sidebar container at the beginning of body
                const bodyPattern = /<body[^>]*>([\s\S]*?)<\/body>/i;
                content = content.replace(bodyPattern, 
                    (match, bodyContent) => 
                        match.replace(bodyContent, 
                            `\n    <div id="sidebar-container">\n        <!-- Sidebar will be loaded here -->\n    </div>\n    ${bodyContent.trim()}`));
            }
        }

        // Ensure common.js is included
        if (!content.includes('common.js')) {
            const headPattern = /<\/head>/i;
            if (headPattern.test(content)) {
                content = content.replace(headPattern, 
                    '    <script src="/public/js/common.js"></script>\n</head>');
            } else {
                const bodyPattern = /<\/body>/i;
                content = content.replace(bodyPattern, 
                    '    <script src="/public/js/common.js"></script>\n</body>');
            }
        }

        // Write the updated content back to the file
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    } catch (err) {
        console.error(`Error updating file ${filePath}:`, err);
    }
}

// Find all HTML files in the specified directories
function processHtmlFiles() {
    htmlDirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            console.log(`Directory not found: ${dir}`);
            return;
        }

        const files = fs.readdirSync(dir)
            .filter(file => file.endsWith('.html') && file !== 'base.html');

        files.forEach(file => {
            const filePath = path.join(dir, file);
            console.log(`Processing ${filePath}...`);
            updateHtmlFile(filePath);
        });
    });
}

// Run the script
processHtmlFiles();
