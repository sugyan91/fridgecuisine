import { Capacitor } from "@capacitor/core";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

export function isNativePlatform() {
  return Capacitor.isNativePlatform();
}

/**
 * Capture a photo using the device's native camera (iOS/Android) when running
 * inside the Capacitor shell, falling back to the standard <input type="file">
 * picker on the web. Returns a JPEG data URL ready to send to the vision API.
 */
export async function capturePhotoDataUrl(): Promise<string | null> {
  if (!isNativePlatform()) return null;

  const photo = await Camera.getPhoto({
    quality: 82,
    allowEditing: false,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Prompt, // user picks Camera or Photo Library
    width: 1024,
    correctOrientation: true,
  });

  return photo.dataUrl ?? null;
}