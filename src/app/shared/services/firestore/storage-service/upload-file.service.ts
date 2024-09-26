import { Injectable } from '@angular/core';
import { getDownloadURL, getStorage, ref, uploadBytes } from '@angular/fire/storage';

@Injectable({
  providedIn: 'root'
})
export class UploadFileService {

  constructor() { }

  uploadFile(event: Event, userId: string, messageId: string) {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files?.[0];
    const allowedImageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/bmp', 'image/jpg'];
    const allowedFileTypes = ['application/pdf'];

    if (file) {
      const storage = getStorage();
      let folder = '';

      // Dynamisch den Ordnerpfad abhängig vom Dateityp erstellen
      if (allowedImageTypes.includes(file.type)) {
        folder = `images/${messageId}/${userId}`; // Backticks für Template-Literals
      } else if (allowedFileTypes.includes(file.type)) {
        folder = `files/${messageId}/${userId}`;  // Backticks für Template-Literals
      } else {
        console.error('File type not supported');
        return;
      }

      // Pfad mit messageId und userId erstellen
      const uploadRef = ref(storage, `sended_files/${folder}/${file.name}`); // Pfad ohne wiederholte IDs

      // Datei hochladen
      uploadBytes(uploadRef, file).then(() => {
        console.log('Upload successful!');
        return getDownloadURL(uploadRef);
      }).then((downloadURL) => {
        console.log('File available at', downloadURL);
        // Hier kannst du den Download-URL verwenden
      }).catch((error) => {
        console.error('Upload failed', error);
      });
    }
  }

}
