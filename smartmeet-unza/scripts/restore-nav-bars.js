const fs = require('fs');
const path = require('path');

// Directories to process
const uiDirs = [
    path.join(__dirname, '..', 'user-ui')
];

// Required containers
const requiredContainers = [
    { id: 'header-container', comment: 'Header will be loaded here' },
    { id: 'sidebar-container', comment: 'Sidebar will be loaded here' }
];

// Common.js script tag
const commonJsTag = '    <script src="/public/js/common.js"></script>';

// Process HTML files
function processHtmlFiles() {
    uiDirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            console.log(`Directory not found: ${dir}`);
            return;
        }

        // Get all HTML files except components
        const files = fs.readdirSync(dir)
            .filter(file => file.endsWith('.html') && !file.startsWith('components'));

        files.forEach(file => {
            const filePath = path.join(dir, file);
            console.log(`Processing ${filePath}...`);
            
            try {
                let content = fs.readFileSync(filePath, 'utf8');
                let modified = false;

                // Check and add required containers
                requiredContainers.forEach(container => {
                    if (!content.includes(`id="${container.id}"`)) {
                        console.log(`  - Adding ${container.id} to ${filePath}`);
                        
                        // Add container after opening body tag
                        const bodyOpenTag = content.indexOf('<body');
                        if (bodyOpenTag !== -1) {
                            const bodyCloseBracket = content.indexOf('>', bodyOpenTag) + 1;
                            content = content.slice(0, bodyCloseBracket) + 
                                     `\n    <div id="${container.id}" class="${container.id.includes('sidebar') ? 'h-full' : ''}">\n        <!-- ${container.comment} -->\n    </div>` + 
                                     content.slice(bodyCloseBracket);
                            modified = true;
                        }
                    }
                });

                // Ensure common.js is included
                if (!content.includes('common.js')) {
                    console.log(`  - Adding common.js to ${filePath}`);
                    if (content.includes('</body>')) {
                        content = content.replace('</body>', `\n${commonJsTag}\n</body>`);
                    } else {
                        content += `\n${commonJsTag}\n`;
                    }
                    modified = true;
                }

                // Save changes if any were made
                if (modified) {
                    fs.writeFileSync(filePath, content, 'utf8');
                    console.log(`  - Updated ${filePath}`);
                } else {
                    console.log(`  - No changes needed for ${filePath}`);
                }
            } catch (error) {
                console.error(`Error processing ${filePath}:`, error);
            }
        });
    });

    console.log('Navigation bars restoration completed!');
}

// Run the script
processHtmlFiles();
