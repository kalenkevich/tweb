import {ImageState, ImageChangeEvent} from '../types';

export interface ImageControlProps {
  imageState: ImageState;
  currentLayerIndex: number;
  onImageChange: (imageChangeEvent: ImageChangeEvent) => void;
}
