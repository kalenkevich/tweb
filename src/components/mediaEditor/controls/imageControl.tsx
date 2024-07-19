import {ImageState, ImageChangeEvent} from '../types';

export interface ImageControlProps {
  isMobile: boolean;
  imageState: ImageState;
  currentLayerIndex: number;
  onImageChange: (imageChangeEvent: ImageChangeEvent) => void;
}
