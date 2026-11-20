
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import "./MentorDiscovery.css";

interface Mentor {
  id: string;
  name: string;
  title: string;
  company: string;
  avatar: string;
  skills: string[];
  rating?: number;
}

interface MentorResponse {
  mentors: Mentor[];
  nextPage: number | null;
}

const PAGE_SIZE = 12;

// Optimized mentor card
const MentorCard = memo(({ mentor }: { mentor: Mentor }) => {
  return (
    <article className="mentor-card">
      <img
        src={mentor.avatar}
        alt={mentor.name}
        className="mentor-avatar"
        loading="lazy"
        decoding="async"
        width="72"
        height="72"
      />

      <div className="mentor-info">
        <h3>{mentor.name}</h3>
        <p>{mentor.title}</p>
        <span>{mentor.company}</span>

        <div className="mentor-skills">
          {mentor.skills.slice(0, 3).map((skill) => (
            <span key={skill} className="skill-tag">
              {skill}
            </span>
          ))}
        </div>

        {mentor.rating !== undefined && (
          <small>⭐ {mentor.rating.toFixed(1)}</small>
        )}
      </div>
    </article>
  );
});

MentorCard.displayName = "MentorCard";

export default function MentorDiscovery() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const [page, setPage] = useState(1);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const loadingRef = useRef(false);
  const pageRef = useRef(1);
  const searchRef = useRef("");

  // Fetch mentors with request cancellation
  const fetchMentors = useCallback(
    async (pageNumber: number, query: string, reset = false) => {
      if (loadingRef.current) return;

      loadingRef.current = true;
      setLoading(true);
      setError(null);

      requestRef.current?.abort();

      const controller = new AbortController();
      requestRef.current = controller;

      try {
        const params = new URLSearchParams({
          page: String(pageNumber),
          limit: String(PAGE_SIZE),
          search: query,
        });

        const response = await fetch(
          `/api/mentors?${params.toString()}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch mentors");
        }

        const data: MentorResponse = await response.json();

        if (controller.signal.aborted) return;

        setMentors((previous) => {
          const existing = reset ? [] : previous;
          const ids = new Set(existing.map((mentor) => mentor.id));

          return [
            ...existing,
            ...data.mentors.filter((mentor) => !ids.has(mentor.id)),
          ];
        });

        setHasMore(data.nextPage !== null);
        pageRef.current = data.nextPage ?? pageNumber;
        setPage(pageRef.current);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        if (requestRef.current === controller) {
          loadingRef.current = false;
          setLoading(false);
        }
      }
    },
    []
  );

  // Initial fetch and search updates
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      searchRef.current = search;
      pageRef.current = 1;
      setMentors([]);
      setHasMore(true);
      fetchMentors(1, search, true);
    }, 350);

    return () => {
      window.clearTimeout(timeout);
      requestRef.current?.abort();
    };
  }, [search, fetchMentors]);

  // Load next page
  const loadMore = useCallback(() => {
    if (loadingRef.current || !hasMore) return;

    const nextPage = pageRef.current + 1;
    fetchMentors(nextPage, searchRef.current);
  }, [fetchMentors, hasMore]);

  // Infinite scroll using Intersection Observer
  useEffect(() => {
    const target = sentinelRef.current;

    if (!target || !hasMore) return;

    observerRef.current?.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      {
        root: null,
        rootMargin: "400px",
        threshold: 0,
      }
    );

    observerRef.current.observe(target);

    return () => observerRef.current?.disconnect();
  }, [loadMore, hasMore]);

  // Memoize visible mentor list
  const visibleMentors = useMemo(() => mentors, [mentors]);

  return (
    <section className="mentor-discovery">
      <header className="discovery-header">
        <div>
          <h1>Discover Mentors</h1>
          <p>Connect with experienced professionals.</p>
        </div>

        <input
          type="search"
          placeholder="Search mentors, skills, companies..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search mentors"
        />
      </header>

      {error && (
        <div className="error-message" role="alert">
          {error}
          <button onClick={() => fetchMentors(1, search, true)}>
            Retry
          </button>
        </div>
      )}

      <div className="mentor-grid">
        {visibleMentors.map((mentor) => (
          <MentorCard key={mentor.id} mentor={mentor} />
        ))}
      </div>

      {loading && (
        <div className="loading-indicator" aria-live="polite">
          Loading mentors...
        </div>
      )}

      {!loading && mentors.length === 0 && !error && (
        <div className="empty-state">
          No mentors found.
        </div>
      )}

      {hasMore && <div ref={sentinelRef} className="scroll-sentinel" />}

      {!hasMore && mentors.length > 0 && (
        <p className="end-message">You've reached the end.</p>
      )}
    </section>
  );
}
