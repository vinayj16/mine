import fs from 'fs';
try {
    const data = JSON.parse(fs.readFileSync('edusearch_database_export.json', 'utf8'));
    const collections = data.collections;
    console.log('Available collections:', Object.keys(collections).filter(k => k.includes('user')));
    const users = collections.users || [];
    console.log(`Found ${users.length} users.`);
} catch (error) {
    console.error(error.message);
}
