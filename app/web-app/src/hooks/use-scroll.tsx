import {
  useScroll as useAHooksScroll,
  useEventListener,
  useMemoizedFn,
  usePrevious,
  useSize,
} from 'ahooks';
import { type RefObject, useEffect, useRef } from 'react';

export const useScroll = (
  containerRef: RefObject<HTMLDivElement | null>,
  scrollBottomRef: RefObject<HTMLDivElement | null>,
  innerListRef: RefObject<HTMLDivElement | null>,
  loading: boolean,
  skip = false,
) => {
  const scrollInfo = useAHooksScroll(containerRef);
  const size = useSize(innerListRef);
  const previousSize = usePrevious(size);
  const userWheeled = useRef<boolean>(false);
  const lastTouchY = useRef<number | null>(null);
  // 容器的高度
  const containerHeight = containerRef.current?.offsetHeight ?? 0;
  // 内部列表的高度
  const innerHeight = containerRef.current?.scrollHeight ?? 0;

  const skipScroll = useMemoizedFn(() => skip || !size);

  const handleWheel = useMemoizedFn((e: WheelEvent) => {
    if (scrollInfo?.top === innerHeight - containerHeight) {
      // 页面在在底部，启动跟随
      userWheeled.current = false;
      return;
    }
    if (e.deltaY > 0 || e.detail < 0) {
      // 页面向上滚动停止自动跟随
      userWheeled.current = true;
    } else {
      // 页面向下滚动，如果距离底部<70px启动跟随
      const isStickInBottom =
        (scrollInfo ? scrollInfo.top : NaN) >= innerHeight - containerHeight - 70;
      userWheeled.current = !isStickInBottom;
    }
  });
  const handleTouchMove = useMemoizedFn((e: TouchEvent) => {
    if (!scrollInfo) return;

    const touch = e.touches[0];
    if (!touch) return;
    if (lastTouchY.current == null) {
      lastTouchY.current = touch.clientY;
      return;
    }

    const deltaY = lastTouchY.current - touch.clientY;
    lastTouchY.current = touch.clientY;

    if (deltaY < 0) {
      userWheeled.current = true;
    } else {
      const isStickInBottom = scrollInfo.top >= innerHeight - containerHeight - 70;
      if (isStickInBottom) {
        userWheeled.current = false;
      }
    }
  });

  useEventListener('mousewheel', handleWheel as () => void);
  useEventListener('DOMMouseScroll', handleWheel as () => void);

  useEventListener('touchstart', (e: TouchEvent) => {
    const touch = e.touches[0];
    lastTouchY.current = touch?.clientY ?? null;
  });

  useEventListener('touchmove', handleTouchMove, {
    passive: true,
  });

  useEventListener('touchend', () => {
    lastTouchY.current = null;
  });

  const scroll2Bottom = useMemoizedFn((behavior: ScrollBehavior = 'smooth') => {
    scrollBottomRef.current?.scrollIntoView({
      behavior,
    });
    userWheeled.current = false;
  });
  useEffect(() => {
    if (skipScroll()) return;
    if (size!.height !== previousSize?.height && !userWheeled.current) {
      scroll2Bottom(loading ? 'smooth' : 'instant');
    }
  }, [size, previousSize]);
};
