/**
 * Cloudinary Client-side Utility for Revallo
 * Uses unsigned uploads for security in the frontend
 */

const CLOUD_NAME = "db8uqft43";
const UPLOAD_PRESET = "revallo_unsigned".trim();

/**
 * Uploads a file to Cloudinary from the browser
 * @param file The file object from input
 * @param folder Optional folder name
 * @returns Promise with the secure URL
 */
export async function uploadToCloudinary(
  file: File,
  folder: string = "revallo",
) {
  const formData = new FormData();
  formData.append("upload_preset", UPLOAD_PRESET); // MUST BE FIRST
  formData.append("file", file);
  if (folder) {
    formData.append("folder", folder);
  }

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      },
    );

    if (!response.ok) {
      const responseText = await response.text().catch(() => "");
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        errorData = { raw: responseText };
      }
      
      const errorMessage = errorData?.error?.message || errorData?.message || "Falha no upload para o Cloudinary";
      console.error("Cloudinary error details:", errorData);
      throw new Error(`${errorMessage} (Status: ${response.status})`);
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
}

/**
 * Uploads an audio blob (e.g. .webm voice message) to Cloudinary.
 * Uses 'video' resource_type since Cloudinary handles audio under that category.
 */
export async function uploadAudioToCloudinary(
  blob: Blob,
  folder: string = "revallo/voices",
): Promise<string> {
  const formData = new FormData();
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("file", blob, "voice-message.webm");
  formData.append("folder", folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`,
    { method: "POST", body: formData },
  );

  if (!response.ok) {
    const txt = await response.text().catch(() => "");
    throw new Error(`Cloudinary audio upload failed: ${txt}`);
  }

  const data = await response.json();
  return data.secure_url as string;
}
