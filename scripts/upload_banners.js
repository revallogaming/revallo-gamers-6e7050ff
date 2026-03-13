import fs from 'fs';
import path from 'path';

const CLOUD_NAME = "db8uqft43";
const UPLOAD_PRESET = "revallo_unsigned";

const banners = [
    'd:/Documentos/REVALLO/revallo-gamers/public/images/banners/15953551675f17301fc6163_1595355167_3x2_md.jpg',
    'd:/Documentos/REVALLO/revallo-gamers/public/images/banners/450_1000.webp',
    'd:/Documentos/REVALLO/revallo-gamers/public/images/banners/FREE-FIRE-NOVO.webp',
    'd:/Documentos/REVALLO/revallo-gamers/public/images/banners/gametiles_com.dts.freefireth.jpg',
    'd:/Documentos/REVALLO/revallo-gamers/public/images/banners/free-fire.png',
    'C:/Users/Adryan/.gemini/antigravity/brain/7f166f85-d020-4e4a-879e-c2a3bee774cc/free_fire_banner_1_1773364629801.png'
];

async function uploadFile(filePath) {
    console.log(`Uploading ${filePath}...`);
    const fileName = path.basename(filePath);
    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer]);
    
    const formData = new FormData();
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("file", blob, fileName);
    formData.append("folder", "banners");

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
    for (const banner of banners) {
        try {
            const url = await uploadFile(banner);
            results[path.basename(banner)] = url;
        } catch (error) {
            console.error(error.message);
        }
    }
    fs.writeFileSync('cloudinary_banners.json', JSON.stringify(results, null, 2));
    console.log('Results saved to cloudinary_banners.json');
}

run();
