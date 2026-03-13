
const API_KEY = "f2d2e126-8168-44f8-b6dd-47b0bf898126";
const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function generateImage(prompt, filename) {
    console.log(`Generating: ${prompt}`);
    try {
        const response = await axios.post(
            'https://cloud.leonardo.ai/api/rest/v1/generations',
            {
                prompt: prompt,
                modelId: "b24e0da0-fa40-49e0-91ac-1c9497e289c8", // Leonardo Vision XL
                width: 1024,
                height: 576,
                num_images: 1,
            },
            {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const generationId = response.data.sdGenerationJob.generationId;
        console.log(`Generation ID: ${generationId}. Waiting...`);

        let imageUrl = null;
        while (!imageUrl) {
            await new Promise(r => setTimeout(r, 5000));
            const statusResponse = await axios.get(
                `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`,
                {
                    headers: { 'Authorization': `Bearer ${API_KEY}` }
                }
            );
            const generation = statusResponse.data.generations_by_pk;
            if (generation.status === 'COMPLETE') {
                imageUrl = generation.generated_images[0].url;
            } else if (generation.status === 'FAILED') {
                throw new Error("Generation failed");
            }
        }

        console.log(`Downloading: ${imageUrl}`);
        const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const filePath = path.join(process.cwd(), 'public', 'banners', filename);
        fs.writeFileSync(filePath, imageResponse.data);
        console.log(`Saved to ${filePath}`);
    } catch (err) {
        console.error(`Error for ${filename}:`, err.response?.data || err.message);
    }
}

async function main() {
    const banners = [
        ["High-end cinematic Free Fire battle royale banner, characters in action with glowing weapon skins, Bermuda map background, vibrant colors, 4k", "ff-banner-1.png"],
        ["Elite Free Fire squad posing in Kalahari desert, sunset lighting, premium tactical skins, cinematic composition, 4k", "ff-banner-2.png"],
        ["Close-up of a legendary Free Fire weapon skin with fire and ice particles, dramatic smoky background, gaming aesthetic, 4k", "ff-banner-3.png"]
    ];

    for (const [prompt, name] of banners) {
        await generateImage(prompt, name);
    }
}

main();
