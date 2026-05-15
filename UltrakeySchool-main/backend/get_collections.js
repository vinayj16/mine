import fs from 'fs';
try {
    const data = JSON.parse(fs.readFileSync('edusearch_database_export.json', 'utf8'));
    console.log(JSON.stringify(Object.keys(data.collections), null, 2));
} catch (error) {
    console.error(error.message);
}
