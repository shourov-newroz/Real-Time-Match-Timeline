import { motion } from 'motion/react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  List,
  type ListImperativeAPI,
  type RowComponentProps,
} from 'react-window';
import { Activity } from 'lucide-react';
import { entryMotion } from '../motion/motionTokens';
import { useMatchStore } from '../store/matchStore';
import type { MatchEvent } from '../types/match';
import { filterEvents } from '../utils/eventFilter';
import { BackToLatestButton } from './BackToLatestButton';
import { EventFilters } from './EventFilters';
import { TimelineItem } from './TimelineItem';

const LATEST_THRESHOLD_PX = 80;
const ITEM_GAP_PX = 12;
const ITEM_ESTIMATED_HEIGHT_PX = 88;
const TIMELINE_HEIGHT_PX = 470;
const OVERSCAN_ITEMS = 5;

type TimelineRowProps = {
  animatedEventId: string | null;
  events: MatchEvent[];
  isViewingLatest: boolean;
  onMeasure: (eventId: string, index: number, height: number) => void;
};

function TimelineRow({
  index,
  style,
  events,
  animatedEventId,
  isViewingLatest,
  onMeasure,
}: RowComponentProps<TimelineRowProps>) {
  const event = events[index];

  if (!event) {
    return null;
  }

  const wrapperStyle = {
    ...style,
    top:
      typeof style.top === 'number'
        ? style.top
        : Number.parseFloat(String(style.top ?? 0)),
    height:
      typeof style.height === 'number'
        ? style.height
        : Number.parseFloat(String(style.height ?? 0)),
  };

  return (
    <TimelineItem
      event={event}
      layoutEnabled={false}
      animateEntry={isViewingLatest && event.id === animatedEventId}
      containerStyle={wrapperStyle}
      measureRef={(node) => {
        if (!node) {
          return;
        }
        onMeasure(
          event.id,
          index,
          Math.ceil(node.getBoundingClientRect().height),
        );
      }}
    />
  );
}

export function MatchTimeline() {
  const listRef = useRef<ListImperativeAPI | null>(null);
  const previousFirstId = useRef<string | null>(null);
  const previousFilter = useRef(useMatchStore.getState().activeFilter);
  const returningToLatestRef = useRef(false);
  const heightCacheRef = useRef<Record<string, number>>({});
  const [heightVersion, setHeightVersion] = useState(0);

  const events = useMatchStore((state) => state.events);
  const activeFilter = useMatchStore((state) => state.activeFilter);
  const isViewingLatest = useMatchStore((state) => state.isViewingLatest);
  const newEventsCount = useMatchStore((state) => state.newEventsCount);
  const setViewingLatest = useMatchStore((state) => state.setViewingLatest);
  const incrementNewEvents = useMatchStore((state) => state.incrementNewEvents);
  const resetNewEvents = useMatchStore((state) => state.resetNewEvents);

  const filteredEvents = useMemo(
    () => filterEvents(events, activeFilter),
    [events, activeFilter],
  );
  const latestFilteredId = filteredEvents[0]?.id ?? null;
  const [renderedEvents, setRenderedEvents] = useState(filteredEvents);
  const [animatedEventId, setAnimatedEventId] = useState<string | null>(null);

  // Stable callback — does not include isViewingLatest so rowProps stays
  // referentially stable across scroll ticks that toggle isViewingLatest.
  const onMeasure = useCallback(
    (eventId: string, index: number, height: number) => {
      const nextHeight = height + ITEM_GAP_PX;
      if (heightCacheRef.current[eventId] === nextHeight) {
        return;
      }

      heightCacheRef.current[eventId] = nextHeight;
      setHeightVersion((value) => value + 1);

      // Only auto-scroll to top for the first item when we know we're live.
      // We read the ref rather than closing over the state so this callback
      // itself never needs to be recreated.
      if (index === 0) {
        requestAnimationFrame(() => {
          const scrollTop = listRef.current?.element?.scrollTop ?? Infinity;
          if (scrollTop < LATEST_THRESHOLD_PX) {
            listRef.current?.scrollToRow({
              index: 0,
              align: 'start',
              behavior: 'instant',
            });
          }
        });
      }
    },
    [],
  );

  const rowProps = useMemo(
    () => ({
      animatedEventId,
      events: renderedEvents,
      isViewingLatest,
      onMeasure,
    }),
    // onMeasure is stable; isViewingLatest changes on scroll but we still need
    // it here so rows correctly compute animateEntry.
    [animatedEventId, isViewingLatest, onMeasure, renderedEvents],
  );

  const rowHeight = useMemo(
    () => (index: number) => {
      const event = renderedEvents[index];
      if (!event) {
        return ITEM_ESTIMATED_HEIGHT_PX + ITEM_GAP_PX;
      }

      return (
        heightCacheRef.current[event.id] ??
        ITEM_ESTIMATED_HEIGHT_PX + ITEM_GAP_PX
      );
    },
    // heightVersion triggers recalculation when any cached height changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [heightVersion, renderedEvents],
  );

  useEffect(() => {
    if (!animatedEventId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setAnimatedEventId((current) =>
        current === animatedEventId ? null : current,
      );
    }, 700);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [animatedEventId]);

  useLayoutEffect(() => {
    // Guard: a smooth-scroll "back to latest" is in flight.
    if (returningToLatestRef.current) {
      setViewingLatest(true);
      setRenderedEvents(filteredEvents);
      resetNewEvents();
      setAnimatedEventId(null);
      previousFirstId.current = latestFilteredId;
      return;
    }

    // Guard: the active filter changed — reset everything and jump to top.
    if (previousFilter.current !== activeFilter) {
      previousFilter.current = activeFilter;
      // If we happened to be mid-return when filter changed, cancel that too.
      returningToLatestRef.current = false;
      setRenderedEvents(filteredEvents);
      resetNewEvents();
      setAnimatedEventId(null);
      previousFirstId.current = latestFilteredId;
      requestAnimationFrame(() => {
        listRef.current?.scrollToRow({
          index: 0,
          align: 'start',
          behavior: 'instant',
        });
      });
      return;
    }

    // No new events at the head of the filtered list — nothing to do.
    if (!latestFilteredId || previousFirstId.current === latestFilteredId) {
      previousFirstId.current = latestFilteredId;
      return;
    }

    if (isViewingLatest) {
      // User is watching live: push the new event and animate it in.
      setRenderedEvents(filteredEvents);
      resetNewEvents();
      setAnimatedEventId(latestFilteredId);
      requestAnimationFrame(() => {
        listRef.current?.scrollToRow({
          index: 0,
          align: 'start',
          behavior: 'instant',
        });
      });
    } else {
      // User has scrolled away: count how many new events prepended since the
      // last anchor and badge them without mutating the visible list.
      const anchoredId = previousFirstId.current;
      const prependedCount = anchoredId
        ? filteredEvents.findIndex((event) => event.id === anchoredId)
        : -1;
      if (prependedCount > 0) {
        for (let index = 0; index < prependedCount; index += 1) {
          incrementNewEvents();
        }
      }
      setAnimatedEventId(null);
    }

    previousFirstId.current = latestFilteredId;
  }, [
    activeFilter,
    filteredEvents,
    incrementNewEvents,
    isViewingLatest,
    latestFilteredId,
    listRef,
    resetNewEvents,
    setViewingLatest,
  ]);

  const onScroll = () => {
    const nextScrollTop = listRef.current?.element?.scrollTop ?? 0;
    const nearLatest =
      nextScrollTop < LATEST_THRESHOLD_PX || returningToLatestRef.current;

    // The smooth-scroll "back to latest" finishes when we cross the threshold.
    if (returningToLatestRef.current && nextScrollTop <= LATEST_THRESHOLD_PX) {
      returningToLatestRef.current = false;
      setAnimatedEventId(null);
    }

    setViewingLatest(nearLatest);
    if (nearLatest) {
      setRenderedEvents(filteredEvents);
      resetNewEvents();
    }
  };

  const backToLatest = () => {
    returningToLatestRef.current = true;
    setViewingLatest(true);
    setRenderedEvents(filteredEvents);
    resetNewEvents();
    setAnimatedEventId(null);
    listRef.current?.scrollToRow({
      index: 0,
      align: 'start',
      behavior: 'smooth',
    });
  };

  return (
    <section className='relative h-[590px] rounded-[8px] border border-white/10 bg-pitch-900/78 p-4 shadow-glow'>
      <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h2 className='flex items-center gap-2 text-sm font-black text-white'>
            <Activity className='h-4 w-4 text-electric-400' />
            Match Timeline{' '}
            <span className='rounded-full bg-electric-500/15 px-2 py-0.5 text-[10px] text-electric-400'>
              {events.length}
            </span>
          </h2>
        </div>
        <span className='text-xs text-slate-500'>Newest first</span>
      </div>
      <EventFilters />
      <div className='mt-4'>
        {renderedEvents.length > 0 ? (
          <List
            listRef={listRef}
            rowComponent={TimelineRow}
            rowCount={renderedEvents.length}
            rowHeight={rowHeight}
            rowProps={rowProps}
            overscanCount={OVERSCAN_ITEMS}
            defaultHeight={TIMELINE_HEIGHT_PX}
            onScroll={onScroll}
            className='pr-1 [scrollbar-color:#3a4d68_transparent] [scrollbar-width:thin]'
            style={{ height: TIMELINE_HEIGHT_PX }}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={entryMotion.transition}
            className='grid min-h-[280px] transform-gpu place-items-center rounded-[8px] border border-dashed border-white/10 bg-white/[0.03] text-center will-change-transform'
          >
            <div>
              <Activity className='mx-auto h-8 w-8 text-slate-600' />
              <p className='mt-3 text-sm font-semibold text-slate-300'>
                No events yet
              </p>
              <p className='mt-1 text-xs text-slate-500'>
                Start the match to receive live timeline updates.
              </p>
            </div>
          </motion.div>
        )}
      </div>
      <BackToLatestButton
        count={newEventsCount}
        show={!isViewingLatest && newEventsCount > 0}
        onClick={backToLatest}
      />
    </section>
  );
}
