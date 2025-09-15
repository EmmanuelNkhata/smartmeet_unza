const fs = require('fs');
const path = require('path');

// List of all admin HTML files
const adminFiles = [
    'index.html',
    'meetings.html',
    'create-meeting.html',
    'room-booking.html',
    'users.html',
    'documents.html',
    'reports.html',
    'notifications.html'
];

// The logo component HTML to insert
const logoComponent = '<!--#include virtual="/admin/components/logo.html" -->';

adminFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    
    try {
        // Read the file
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Replace the old logo/title with the new component
        const updatedContent = content.replace(
            /<h1 class="text-2xl font-bold mb-8">SmartMeet UNZA<\/h1>/,
            logoComponent
        );
        
        // Write the updated content back to the file
        fs.writeFileSync(filePath, updatedContent, 'utf8');
        console.log(`✅ Updated ${file}`);
    } catch (error) {
        console.error(`❌ Error updating ${file}:`, error.message);
    }
});

console.log('\nLogo update complete!');
