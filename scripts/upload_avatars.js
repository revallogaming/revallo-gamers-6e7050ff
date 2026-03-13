import fs from 'fs';
import path from 'path';

const CLOUD_NAME = "db8uqft43";
const UPLOAD_PRESET = "revallo_unsigned";

const avatars = [
    'd:/Documentos/REVALLO/revallo-gamers/public/avatars/avatar_hacker.png',
    'd:/Documentos/REVALLO/revallo-gamers/public/avatars/avatar_mage.png',
    'd:/Documentos/REVALLO/revallo-gamers/public/avatars/avatar_ninja.png',
    'd:/Documentos/REVALLO/revallo-gamers/public/avatars/avatar_sniper.png',
    'd:/Documentos/REVALLO/revallo-gamers/public/avatars/avatar_warrior.png'
];

async function uploadFile(filePath) {
    console.log(`Uploading ${filePath}...`);
    const fileName = path.basename(filePath);
    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer]);
    
    const formData = new FormData();
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("file", blob, fileName);
    formData.append("folder", "avatars");

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
            method: "POST",
            body: formData,
        }
    );

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Failed to upload ${fileName}: ${err}`);
    }

    const data = await response.json();
    console.log(`Success: ${fileName} -> ${data.secure_url}`);
    return data.secure_url;
}

async function run() {
    const results = {};
    for (const avatar of avatars) {
        try {
            const url = await uploadFile(avatar);
            results[path.basename(avatar)] = url;
        } catch (error) {
            console.error(error.message);
        }
    }
    fs.writeFileSync('cloudinary_avatars.json', JSON.stringify(results, null, 2));
    console.log('Results saved to cloudinary_avatars.json');
}

run();
