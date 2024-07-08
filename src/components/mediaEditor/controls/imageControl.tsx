import {ImageState, ImageChangeEvent} from '../types';

export interface ImageControlProps {
  imageState: ImageState;
  onImageChange: (imageChangeEvent: ImageChangeEvent) => void;
}
