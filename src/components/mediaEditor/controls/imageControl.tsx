import {ImageState, ImageChangeEvent} from '../types';

export interface ImageControlProps {
  imageState: ImageState;
  currentAttachmentIndex: number;
  onImageChange: (imageChangeEvent: ImageChangeEvent) => void;
}
