import {JSX, children, onMount, createSignal} from 'solid-js';
import attachGrabListeners, {GrabEvent} from '../../../helpers/dom/attachGrabListeners';

export type {GrabEvent};

export type DragListener = (event: GrabEvent) => void;

export enum DragEventType {
  DragStart = 'dragStart',
  DragMove = 'dragMove',
  DragEnd = 'dragEnd',
}

export interface DraggingSurfaceListeners {
  [DragEventType.DragStart]: DragListener[];
  [DragEventType.DragMove]: DragListener[];
  [DragEventType.DragEnd]: DragListener[];
}

export interface DraggingSurface {
  element: HTMLElement;
  subscribe: (type: DragEventType, listener: DragListener) => void;
  unsubscribe: (type: DragEventType, listener: DragListener) => void;
}

export interface DraggingSurfaceProps {
  children: JSX.Element;
  onSurfaceReady: (surface: DraggingSurface) => void;
}

export function DraggingSurfaceComponent(props: DraggingSurfaceProps) {
  const [surfaceEl, setSurfaceEl] = createSignal<HTMLDivElement>();
  const [surface, setSurface] = createSignal<DraggingSurface>();
  const [listeners, setListeners] = createSignal<DraggingSurfaceListeners>({
    [DragEventType.DragStart]: [],
    [DragEventType.DragMove]: [],
    [DragEventType.DragEnd]: []
  });

  const c = children(() => props.children);

  onMount(() => {
    surfaceEl().style.position = 'relative';
    surfaceEl().style.display = 'block';
    surfaceEl().style.background = 'transparent';
    surfaceEl().style.width = '100%';
    surfaceEl().style.height = '100%';

    const surfaceInstance = {
      element: surfaceEl(),
      subscribe,
      unsubscribe
    };

    setSurface(surfaceInstance);

    attachGrabListeners(surfaceEl() as any, (event) => {
      onEvent(DragEventType.DragStart, event);
    }, (event) => {
      onEvent(DragEventType.DragMove, event);
    }, (event) => {
      onEvent(DragEventType.DragEnd, event);
    });

    props.onSurfaceReady(surfaceInstance);
  });

  const subscribe = (type: DragEventType, listener: DragListener) => {
    setListeners(l => ({
      ...l,
      [type]: [...l[type], listener]
    }));
  };

  const unsubscribe = (type: DragEventType, listener: DragListener) => {
    setListeners(l => ({
      ...l,
      [type]: l[type].filter(ls => ls !== listener)
    }));
  };

  const onEvent = (eventType: DragEventType, event: GrabEvent) => {
    const eventListeners = listeners()[eventType];

    for(const listener of eventListeners) {
      listener(event);
    }
  };

  return (
    <div ref={(el) => setSurfaceEl(el)}>
      {c()}
    </div>
  );
}
