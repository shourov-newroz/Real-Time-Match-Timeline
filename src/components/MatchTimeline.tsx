import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  List,
  type ListImperativeAPI,
  type RowComponentProps,
  useDynamicRowHeight,
} from 'react-window';
import { Activity } from 'lucide-react';
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
const ENTRY_ANIMATION_MS = 520;

function prependedEventIds(events: MatchEvent[], anchorId: string | null) {
  if (!anchorId) return [];

  const anchorIndex = events.findIndex((event) => event.id === anchorId);
  if (anchorIndex <= 0) return [];

  return events.slice(0, anchorIndex).map((event) => event.id);
}

type TimelineRowProps = {
  events: MatchEvent[];
  enteringEventIds: Set<string>;
};

function TimelineRow({
  index,
  style,
  events,
  enteringEventIds,
}: RowComponentProps<TimelineRowProps>) {
  const event = events[index];

  if (!event) {
    return null;
  }

  return (
    <TimelineItem
      event={event}
      shouldAnimateEntry={enteringEventIds.has(event.id)}
      containerStyle={{
        ...style,
        boxSizing: 'border-box',
        paddingBottom: ITEM_GAP_PX,
      }}
    />
  );
}

export function MatchTimeline() {
  const listRef = useRef<ListImperativeAPI | null>(null);
  const previousFirstId = useRef<string | null>(null);
  const previousFilter = useRef(useMatchStore.getState().activeFilter);
  const returningToLatestRef = useRef(false);
  const animationResetTimeoutRef = useRef<number | null>(null);

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
  const [enteringEventIds, setEnteringEventIds] = useState<string[]>([]);

  const rowHeight = useDynamicRowHeight({
    defaultRowHeight: ITEM_ESTIMATED_HEIGHT_PX + ITEM_GAP_PX,
    key: activeFilter,
  });

  const enteringEventIdSet = useMemo(
    () => new Set(enteringEventIds),
    [enteringEventIds],
  );

  const rowProps = useMemo(
    () => ({
      events: renderedEvents,
      enteringEventIds: enteringEventIdSet,
    }),
    [enteringEventIdSet, renderedEvents],
  );

  useEffect(() => {
    if (enteringEventIds.length === 0) return;

    if (animationResetTimeoutRef.current) {
      window.clearTimeout(animationResetTimeoutRef.current);
    }

    animationResetTimeoutRef.current = window.setTimeout(() => {
      setEnteringEventIds([]);
      animationResetTimeoutRef.current = null;
    }, ENTRY_ANIMATION_MS);

    return () => {
      if (animationResetTimeoutRef.current) {
        window.clearTimeout(animationResetTimeoutRef.current);
        animationResetTimeoutRef.current = null;
      }
    };
  }, [enteringEventIds]);

  useLayoutEffect(() => {
    if (returningToLatestRef.current) {
      setViewingLatest(true);
      setRenderedEvents(filteredEvents);
      setEnteringEventIds(
        prependedEventIds(filteredEvents, renderedEvents[0]?.id ?? null),
      );
      resetNewEvents();
      previousFirstId.current = latestFilteredId;
      return;
    }

    if (previousFilter.current !== activeFilter) {
      previousFilter.current = activeFilter;
      returningToLatestRef.current = false;
      setRenderedEvents(filteredEvents);
      setEnteringEventIds([]);
      resetNewEvents();
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

    if (!latestFilteredId || previousFirstId.current === latestFilteredId) {
      previousFirstId.current = latestFilteredId;
      return;
    }

    if (isViewingLatest) {
      setEnteringEventIds(
        prependedEventIds(filteredEvents, renderedEvents[0]?.id ?? null),
      );
      setRenderedEvents(filteredEvents);
      resetNewEvents();
      requestAnimationFrame(() => {
        listRef.current?.scrollToRow({
          index: 0,
          align: 'start',
          behavior: 'instant',
        });
      });
    } else {
      const anchoredId = previousFirstId.current;
      const prependedCount = anchoredId
        ? filteredEvents.findIndex((event) => event.id === anchoredId)
        : -1;
      if (prependedCount > 0) {
        for (let index = 0; index < prependedCount; index += 1) {
          incrementNewEvents();
        }
      }
    }

    previousFirstId.current = latestFilteredId;
  }, [
    activeFilter,
    filteredEvents,
    incrementNewEvents,
    isViewingLatest,
    latestFilteredId,
    renderedEvents,
    resetNewEvents,
    setViewingLatest,
  ]);

  const onScroll = () => {
    const nextScrollTop = listRef.current?.element?.scrollTop ?? 0;
    const nearLatest =
      nextScrollTop < LATEST_THRESHOLD_PX || returningToLatestRef.current;

    if (returningToLatestRef.current && nextScrollTop <= LATEST_THRESHOLD_PX) {
      returningToLatestRef.current = false;
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
    setEnteringEventIds(
      prependedEventIds(filteredEvents, renderedEvents[0]?.id ?? null),
    );
    resetNewEvents();
    listRef.current?.scrollToRow({
      index: 0,
      align: 'start',
      behavior: 'smooth',
    });
  };

  return (
    <section className='relative h-[590px] rounded-[8px] border border-white/10 bg-pitch-900/78 p-4 shadow-glow overflow-hidden'>
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
          <div className='grid min-h-[280px] place-items-center rounded-[8px] border border-dashed border-white/10 bg-white/[0.03] text-center'>
            <div>
              <Activity className='mx-auto h-8 w-8 text-slate-600' />
              <p className='mt-3 text-sm font-semibold text-slate-300'>
                No events yet
              </p>
              <p className='mt-1 text-xs text-slate-500'>
                Start the match to receive live timeline updates.
              </p>
            </div>
          </div>
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
