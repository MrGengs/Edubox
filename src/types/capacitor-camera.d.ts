declare module '@capacitor/camera' {
  export enum CameraResultType {
    Uri = 'uri',
    Base64 = 'base64',
    DataUrl = 'dataUrl'
  }

  export enum CameraSource {
    Prompt = 'PROMPT',
    Camera = 'CAMERA',
    Photos = 'PHOTOS'
  }

  export enum CameraDirection {
    Rear = 'REAR',
    Front = 'FRONT'
  }

  export interface Photo {
    base64String?: string;
    webPath?: string;
    format: string;
    saved: boolean;
  }

  export interface CameraOptions {
    quality?: number;
    allowEditing?: boolean;
    resultType?: CameraResultType;
    saveToGallery?: boolean;
    width?: number;
    height?: number;
    correctOrientation?: boolean;
    source?: CameraSource;
    direction?: CameraDirection;
    presentationStyle?: 'fullscreen' | 'popover';
  }

  export interface CameraPlugin {
    getPhoto(options: CameraOptions): Promise<Photo>;
  }

  const Camera: CameraPlugin;
  export { Camera };
}
